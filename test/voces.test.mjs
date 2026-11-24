// AQVILA — SON1-b: pruebas puras de js/voces.js (Node): node test/voces.test.mjs
import { createRequire } from 'node:module';
const V = createRequire(import.meta.url)('../js/voces.js'), fallos = [];
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const semilla = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

const F = V.FRASES;
ok(F.length >= 70, `hay ${F.length} frases`);
ok(F.every(f => f.lat && f.grupo && f.quien && f.ev && f.peso > 0), 'todas con texto, grupo, quién, situación y peso');
ok(F.every(f => V.GRUPOS.includes(f.grupo)), 'todos los grupos de sonido son válidos');
ok(F.filter(f => f.quien !== 'enemigo').every(f => f.es && f.es.length > 2), 'toda frase romana trae su traducción');
ok(F.filter(f => f.quien === 'enemigo').every(f => /^\(.*\)$/.test(f.lat) && !f.es), 'las del enemigo son descripciones entre paréntesis');
ok(F.every(f => f.fuente || f.licencia === 'juego'), 'cada frase lleva fuente o la marca licencia de juego');
ok(new Set(F.map(f => f.id)).size === F.length, 'los identificadores no se repiten');
ok(!F.some(f => /imperi|caesar augustus|legio.*imperator/i.test(f.lat + f.es)), 'ningún anacronismo imperial («Imperio»)');
for (const s of V.SITUACIONES) ok(F.some(f => f.ev === s), 'situación con frases: ' + s);
for (const q of ['centurion', 'optio', 'soldado', 'enemigo']) ok(F.some(f => f.quien === q), 'habla: ' + q);

ok(F.filter(f => f.grupo === 'canto').every(f => f.quien === 'enemigo'), '«canto» (cántico celta) solo en el enemigo');
ok(F.filter(f => f.grupo === 'panico').every(f => f.ev === 'roto-propio' || f.ev === 'roto-enemigo'), '«panico» solo cuando un cuerpo se rompe');
ok(F.filter(f => f.grupo === 'aclamacion').every(f => f.ev === 'victoria' || f.ev === 'enemigo-cede'), '«aclamacion» solo en victoria o enemigo que cede');
ok(F.filter(f => f.grupo === 'orden').every(f => f.quien === 'centurion' || f.quien === 'optio'), '«orden» solo del centurión u optio');
// SON2: voz hablada. Cada frase romana trae su pronunciación y su mp3; los gritos griegos también
import { existsSync, statSync } from 'node:fs';
const RAIZ = new URL('..', import.meta.url).pathname, rom = F.filter(f => f.quien !== 'enemigo');
ok(rom.every(f => typeof f.pron === 'string' && f.pron.length > 2), `las ${rom.length} frases romanas traen «pron» (latín restituido para voz española)`);
ok(F.filter(f => f.quien === 'enemigo').every(f => !f.pron), 'el enemigo no lleva «pron» (sin idiomas inventados)');
ok(!rom.some(f => /[vVjJ]|ae|oe|ph|ch|qu(?![aeio])|ñ|ll/.test(f.pron.replace(/Boues/, ''))), 'pron: sin v, j, ae, oe, ph, ch ni ll (se escribe como suena)');
ok(!rom.some(f => /c[eiéí]|g[eiéí]/i.test(f.pron.replace(/gu[eiéí]/gi, 'gx'))), 'pron: c y g siempre duras (qu/gu ante e, i)');
ok(rom.every(f => existsSync(RAIZ + 'assets/voces/' + f.id + '.mp3') && statSync(RAIZ + 'assets/voces/' + f.id + '.mp3').size > 2000), 'cada frase romana tiene su mp3 en assets/voces/');
ok(V.GRIEGO.length === 3 && V.GRIEGO.every(g => existsSync(RAIZ + 'assets/voces/' + g.id + '.mp3') && g.fuente && g.lat), 'los 3 gritos griegos (alalá, eleleú, peán) tienen mp3, texto y fuente');
const fe = F.find(f => f.quien === 'enemigo' && f.ev === 'carga-enemiga');
ok(V.griegoDe(fe, false) === null && V.griegoDe(fe, true) !== null && V.griegoDe(F.find(f => f.quien === 'soldado'), true) === null, 'el grito griego solo suena si el rival es griego y habla el enemigo');
ok(V.griegoDe(F.find(f => f.quien === 'enemigo' && f.ev === 'elefantes'), true) === null, '…y no en situaciones sin grito griego (elefantes)');
// la voz no se pisa: Sonido.voz con un contexto falso
const S = createRequire(import.meta.url)('../js/gfx/sonido.js');
ok(S.voz('inexistente') === false, 'Sonido.voz devuelve false si la voz no está cargada');
{
  let t = 0; const nodo = () => ({ connect() {}, disconnect() {}, gain: { value: 1 }, start() {}, pan: { value: 0 } });
  S.ctx = { get currentTime() { return t; }, state: 'running', createBufferSource: () => nodo(), createGain: nodo, createStereoPanner: nodo }; S.maestro = nodo(); S.activo = true;
  S.vbuf = { a: { duration: 2 }, b: { duration: 1 } }; S.vozHasta = 0;
  ok(S.voz('a', { retraso: 0.1 }) === true && S.hablando(), 'suena una frase y se sabe que alguien habla');
  ok(S.voz('b', { retraso: 0.1, espera: 0.4 }) === 'ocupado', 'si alguien habla y no hay hueco, la siguiente se salta');
  ok(S.voz('b', { retraso: 0.1, espera: 3 }) === true, 'con espera suficiente, la siguiente aguarda su turno');
  ok(S.vozHasta > 3, 'el turno queda detrás de las dos frases');
  t = 100; ok(!S.hablando() && S.voz('b', {}) === true, 'cuando acaba, vuelve a poder hablar otra');
  S.ctx = null; S.maestro = null; S.vbuf = {};
}
// sin repetir la última, con pausa mínima
const e = V.nuevo(), rng = semilla(42); let t = 0, dichas = [], intentos = 0;
for (let k = 0; k < 600; k++) { t += 1; e.t = t; e.tension = 0.5; intentos++; const f = V.elige('choque', e, rng); if (f) dichas.push({ f, t }); }
ok(dichas.length > 20, `con 600 s de choques habla (${dichas.length} frases)`);
ok(dichas.every((d, i) => i === 0 || d.f.id !== dichas[i - 1].f.id), 'no repite la frase anterior');
ok(dichas.every((d, i) => i === 0 || d.t - dichas[i - 1].t >= V.pausaMin(0.5) - 1e-9), `respeta la pausa mínima (${V.pausaMin(0.5)} s a tensión 0,5)`);
const cuentaConTension = ten => { const e2 = V.nuevo(), r = semilla(7); let n = 0; for (let k = 1; k <= 600; k++) { e2.t = k; e2.tension = ten; if (V.elige('choque', e2, r)) n++; } return n; };
ok(cuentaConTension(0.9) > cuentaConTension(0.1) * 1.4, `habla más cuanta más tensión (${cuentaConTension(0.1)} → ${cuentaConTension(0.9)})`);
ok(V.pausaMin(1) < V.pausaMin(0), 'la pausa se acorta con la tensión');
// urgentes: pasan por encima de la pausa larga (1,2 s) y siempre hablan
const eu = V.nuevo(); eu.t = 100; eu.tUlt = 98; ok(V.elige('roto-propio', eu, () => 0.99) !== null, 'un cuerpo que se rompe se dice aunque hablara hace 2 s');
eu.tUlt = eu.t - 0.5; ok(V.elige('roto-propio', eu, () => 0.5) === null, '…pero no antes de 1,2 s');
// la charla suelta de la espera sale cada 8-15 s
const ec = V.nuevo(), rc = semilla(3), huecos = []; let tp = null;
for (let k = 0; k <= 400; k++) { ec.t = k; ec.tension = 0.3; if (V.elige('espera', ec, rc)) { if (tp !== null) huecos.push(k - tp); tp = k; } }
ok(huecos.length > 10 && huecos.every(h => h >= 8 && h <= 16), `charla en la espera cada 8-15 s (huecos ${Math.min(...huecos)}–${Math.max(...huecos)} s)`);
ok(V.elige('desconocida', V.nuevo(), Math.random) === null && V.elige('choque', null) === null, 'situación desconocida o sin estado: nada');
// mapa de eventos de js/guerra.js
const d = V.deEvento;
ok(d({ tipo: 'carga-enemiga', tropa: 'elefantes' }) === 'elefantes' && d({ tipo: 'carga-enemiga', tropa: 'galos' }) === 'carga-enemiga', 'eventos: carga y elefantes');
ok(d({ tipo: 'roto', lado: 0 }) === 'roto-propio' && d({ tipo: 'roto', lado: 1 }) === 'roto-enemigo' && d({ tipo: 'envuelve', lado: 1 }) === 'flanco', 'eventos: roto y flanco');
ok(d({ tipo: 'fin' }) === null && d({ tipo: 'caballeria-lista' }) === null && d(null) === null, 'eventos sin voz: fin, caballería lista');
// caída de grupos al banco que haya
const sin = new Set(['grito', 'clamor']), tiene = g => sin.has(g);
ok(V.grupoDisponible('orden', tiene) === 'grito' && V.grupoDisponible('aclamacion', tiene) === 'clamor' && V.grupoDisponible('cuerno', tiene) === null, 'grupo que falta: cae al parecido que haya');
ok(V.grupoDisponible('orden', g => g === 'orden') === 'orden', 'si el grupo existe, se usa');
const r = V.rotulo(F.find(f => f.quien === 'centurion')); ok(/^Centurión: .+ — .+$/.test(r), 'rótulo: «' + r + '»');
// usuario, 23/11 («A»): solo los pueblos griegos gritan en griego
ok(V.esGriego({ falange: 800, elefantes: 20 }) && V.esGriego({ hoplitas: 600, peltastas: 200 }), 'Macedonia, Epiro (con elefantes) y las polis gritan en griego');
ok(!V.esGriego({ libios: 900, hoplitas: 300 }) && !V.esGriego({ sagrada: 400, hoplitas: 200 }), 'Cartago con hoplitas mercenarios no grita en griego');
ok(!V.esGriego({ galos: 900 }) && !V.esGriego({}) && !V.esGriego(), 'galos y ejércitos sin falange ni hoplitas, tampoco');
// SON4: las otras pantallas de batalla (maquetas a pie, Escaramuzas): traducción de avisos y eventos, y los gritos de la falange propia
const da = V.deAviso, ds = V.deSim;
ok(da('choque') === 'choque' && da('salva') === 'pila' && da('barrito') === 'elefantes' && da('oleada') === 'caballeria' && da('flanco', { lado: 1 }) === 'flanco', 'avisos de la falange: choque, salva, elefantes, caballería, flanco');
ok(da('rompe', { ganador: 'falange' }) === 'roto-enemigo' && da('rompe', { ganador: 'rival' }) === 'roto-propio' && da('pulso') === null && da('ha') === null && da('fin') === null, 'avisos: «rompe» según quién gana; pulso, «¡Ha!» y fin no hablan');
ok(ds({ tipo: 'choque', lado: 0 }) === 'choque' && ds({ tipo: 'carga', lado: 0 }) === 'empujar' && ds({ tipo: 'carga', lado: 1 }) === 'carga-enemiga' && ds({ tipo: 'desboque', lado: 1 }) === 'elefantes', 'simulador: choque, carga propia y ajena, elefantes');
ok(ds({ tipo: 'ruptura', lado: 0 }) === 'roto-propio' && ds({ tipo: 'ruptura', lado: 1 }) === 'roto-enemigo' && ds({ tipo: 'duda', lado: 1 }) === 'enemigo-cede' && ds({ tipo: 'flanqueo', lado: 0 }) === 'flanco', 'simulador: cuerpo roto, enemigo que duda, flanco');
ok(ds({ tipo: 'fin', como: 'victoria' }) === 'victoria' && ds({ tipo: 'fin', como: 'derrota' }) === 'derrota' && ds({ tipo: 'fin', como: 'retirada' }) === null && ds({ tipo: 'orden' }) === null && ds(null) === null, 'simulador: victoria y derrota hablan; retirada y órdenes, no');
ok(V.SITUACIONES.includes(da('choque')) && ['choque', 'empujar', 'carga-enemiga', 'elefantes', 'roto-propio', 'roto-enemigo', 'enemigo-cede', 'flanco', 'flaquea', 'relevo', 'pila', 'victoria', 'derrota'].every(x => V.SITUACIONES.includes(x)), 'las situaciones traducidas existen');
ok(V.GRIEGO_PROPIO.every(g => V.GRIEGO.some(h => h.id === g.id) && existsSync(RAIZ + 'assets/voces/' + g.id + '.mp3') && g.fuente), 'los gritos propios griegos usan los mp3 y las fuentes de GRIEGO');
ok(V.GRIEGO_PROPIO.every(g => g.ev.every(e => V.SITUACIONES.includes(e))), 'los gritos propios solo en situaciones que existen');
const fch = F.find(f => f.ev === 'choque' && f.quien === 'centurion'), fesp = F.find(f => f.ev === 'aguantar' && f.quien === 'centurion'), fen = F.find(f => f.quien === 'enemigo');
ok(V.griegoPropio(fch, () => 0).id === 'griego1' && V.griegoPropio(fesp) === null && V.griegoPropio(fen) === null && V.griegoPropio(null) === null, 'falangitas: gritan al chocar; sin grito en «aguantar»; el enemigo no es suyo');
// la banda (js/gfx/banda.js): quién somos y quién es el rival, y el resumen para la música desde el simulador
const Bd = createRequire(import.meta.url)('../js/gfx/banda.js'), Mu = createRequire(import.meta.url)('../js/gfx/musica.js');
globalThis.Voces = V;
ok(Bd.propioDe({ hastati: 90, principes: 90 }) === 'romano' && Bd.propioDe({ falange: 800 }) === 'griego' && Bd.propioDe({ libios: 500, hoplitas: 100 }) === 'otro' && Bd.propioDe({ galos: 500 }) === 'otro' && Bd.propioDe() === 'otro', 'banda: Roma habla latín; la falange, solo gritos; Cartago y galos, nada propio');
ok(Bd.rivalDe({ galos: 300 }).galos && !Bd.rivalDe({ galos: 300 }).esGriego && Bd.rivalDe({ falange: 90 }).esGriego && !Bd.rivalDe({ hastati: 90 }).galos, 'banda: el rival galo canta; el griego grita en griego; Roma, ni una cosa ni otra');
const man = (lado, moral, estado, n0 = 100) => ({ lado, n0, moral, estado, fatiga: 0.2 });
const base = { fase: 'lucha', man: [man(0, 1, 'firme'), man(0, 0.4, 'duda'), man(1, 0.8, 'firme'), man(1, 0, 'roto')], reg: [], resultado: null };
const r0 = Bd.resumenSim(base); ok(r0.fase === 'lejos' && r0.rotos[1] === 1 && r0.rotos[0] === 0 && Math.abs(r0.moral[0] - 0.7) < 1e-9, 'resumen: sin choque aún, «lejos»; cuenta los rotos y la moral media');
base.reg.push({ tipo: 'choque' }); ok(Bd.resumenSim(base).fase === 'lucha' && Mu.tensionDe(Bd.resumenSim(base)) > Mu.tensionDe(r0), 'resumen: tras el choque, «lucha» y más tensión');
base.fase = 'fin'; base.resultado = { como: 'victoria' }; ok(Bd.resumenSim(base).fase === 'fin' && Mu.estadoDe(Bd.resumenSim(base)) === 'victoria', 'resumen: al acabar, victoria');
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else console.log('\nTodo bien');
