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
// (CG4b: el mapa de eventos de js/guerra.js, deEvento, se retiró con la batalla vieja; queda deSim, abajo)
ok(V.deEvento === undefined, 'sin deEvento: la batalla vieja se retiró');
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
ok(Bd.propioDe({ hastati: 90, principes: 90 }) === 'romano' && Bd.propioDe({ falange: 800 }) === 'griego' && Bd.propioDe({ libios: 500, hoplitas: 100 }) === 'cartago' && Bd.propioDe({ galos: 500 }) === 'galos' && Bd.propioDe({ iberos: 500, velites: 50 }) === 'iberos' && Bd.propioDe({ honderos: 90 }) === 'otro' && Bd.propioDe() === 'otro', 'banda: Roma habla latín; la falange, griego; Cartago, galos e íberos, gritos en español (SON5)');
ok(Bd.rivalDe({ galos: 300 }).galos && !Bd.rivalDe({ galos: 300 }).esGriego && Bd.rivalDe({ falange: 90 }).esGriego && !Bd.rivalDe({ hastati: 90 }).galos, 'banda: el rival galo canta; el griego grita en griego; Roma, ni una cosa ni otra');
const man = (lado, moral, estado, n0 = 100) => ({ lado, n0, moral, estado, fatiga: 0.2 });
const base = { fase: 'lucha', man: [man(0, 1, 'firme'), man(0, 0.4, 'duda'), man(1, 0.8, 'firme'), man(1, 0, 'roto')], reg: [], resultado: null };
const r0 = Bd.resumenSim(base); ok(r0.fase === 'lejos' && r0.rotos[1] === 1 && r0.rotos[0] === 0 && Math.abs(r0.moral[0] - 0.7) < 1e-9, 'resumen: sin choque aún, «lejos»; cuenta los rotos y la moral media');
base.reg.push({ tipo: 'choque' }); ok(Bd.resumenSim(base).fase === 'lucha' && Mu.tensionDe(Bd.resumenSim(base)) > Mu.tensionDe(r0), 'resumen: tras el choque, «lucha» y más tensión');
base.fase = 'fin'; base.resultado = { como: 'victoria' }; ok(Bd.resumenSim(base).fase === 'fin' && Mu.estadoDe(Bd.resumenSim(base)) === 'victoria', 'resumen: al acabar, victoria');

// SON5: nuestra falange habla griego antiguo; Cartago, galos e íberos gritan en español
const G = V.GRIEGAS, GR = V.GRITOS, mp3 = id => existsSync(RAIZ + 'assets/voces/' + id + '.mp3') && statSync(RAIZ + 'assets/voces/' + id + '.mp3').size > 2000;
ok(G.length >= 25 && G.length <= 40, `hay ${G.length} frases en griego antiguo (25–40)`);
ok(G.every(f => typeof f.pron === 'string' && f.pron.length > 2 && f.es && f.es.length > 2 && f.lat && f.gr && f.grupo && V.GRUPOS.includes(f.grupo) && f.peso > 0), 'toda frase griega trae pron, traducción, transliteración, escritura griega, grupo y peso');
ok(G.every(f => mp3(f.id)), 'toda frase griega tiene su mp3 en assets/voces/');
ok(G.every(f => f.fuente || f.licencia === 'juego'), 'toda frase griega lleva fuente o la marca licencia de juego');
ok(G.every(f => /[Ͱ-Ͽἀ-῿]/.test(f.gr) && !/[Ͱ-Ͽἀ-῿]/.test(f.lat + f.pron + f.es)), 'el griego va solo en «gr»; la transliteración, la pronunciación y la traducción, en letras latinas');
ok(G.every(f => f.quien === 'lochagos' || f.quien === 'falangita') && G.some(f => f.quien === 'lochagos') && G.some(f => f.quien === 'falangita'), 'hablan el lochagós (oficial) y los falangitas');
ok(!G.some(f => /imperi|augustus|legio|cohort/i.test(f.lat + f.es + f.pron)), 'ningún anacronismo en las frases griegas');
ok(['espera', 'choque', 'empujar', 'aguantar', 'carga-enemiga', 'elefantes', 'caballeria', 'flanco', 'flaquea', 'roto-propio', 'roto-enemigo', 'enemigo-cede', 'victoria', 'derrota'].every(e => G.some(f => f.ev === e)), 'el griego cubre espera, carga, choque, aguantar, flanco, elefantes, caballería, flaquea, victoria y derrota');
ok(G.every(f => V.SITUACIONES.includes(f.ev)) && new Set(G.map(f => f.id)).size === G.length, 'situaciones válidas e ids únicos');
ok(G.filter(f => f.grupo === 'orden').every(f => f.quien === 'lochagos'), 'las órdenes (grupo «orden») son del lochagós');
ok(G.find(f => f.lat === 'Émba!') && G.find(f => f.lat === 'Émba!').es === '¡Adelante!', 'el ejemplo «Ἔμβα! — ¡Adelante!» se lee «Émba!»');
// los gritos en español
const PU = ['cartago', 'galos', 'iberos'];
ok(GR.length >= 15 && GR.length <= 25, `hay ${GR.length} gritos de guerra en español (15–25)`);
ok(PU.every(p => GR.filter(g => g.pueblo === p).length >= 5), 'cada pueblo (Cartago, galos, íberos) tiene al menos 5 gritos');
ok(GR.every(g => g.pueblo && PU.includes(g.pueblo) && (g.quien === 'jefe' || g.quien === 'guerrero') && g.lat && g.pron && g.grupo && V.GRUPOS.includes(g.grupo) && V.SITUACIONES.includes(g.ev) && (g.fuente || g.licencia === 'juego')), 'todo grito lleva pueblo, quién, texto, pron, situación y fuente o licencia de juego');
ok(GR.every(g => mp3(g.id)) && new Set(GR.map(g => g.id)).size === GR.length, 'todo grito tiene su mp3 y su id propio');
ok(GR.every(g => /^¡.*[!?]$/.test(g.lat) && !/[Ͱ-Ͽ]/.test(g.lat)), 'son exclamaciones en castellano (¡…!)');
ok(!GR.some(g => /falcata|imperi|delenda|augusto|c[eé]sar|cristo|dios mío|\b(the|and|for)\b/i.test(g.lat + g.pron)), 'sin anacronismos ni otras lenguas (falcata, Imperio, Delenda, César, inglés)');
ok(GR.filter(g => g.pueblo === 'cartago').some(g => /Melqart|Tanit|Baal/.test(g.lat)) && GR.filter(g => g.pueblo === 'galos').some(g => /Breno/.test(g.lat)) && GR.filter(g => g.pueblo === 'iberos').some(g => /íberos|Neto|Indíbil/.test(g.lat)), 'los dioses y nombres de época: Melqart, Tanit y Baal; Breno; Neto e Indíbil');
ok(PU.every(p => ['espera', 'empujar', 'choque', 'victoria', 'derrota', 'roto-enemigo'].every(e => GR.some(g => g.pueblo === p && g.ev === e))), 'cada pueblo grita al esperar, cargar, chocar, romper al rival, ganar y perder');
// ninguna lengua no permitida: solo español (gritos) y griego translitero (frases), sin latín mezclado en los de otros pueblos
ok(!GR.some(g => /\b(tenete|pro roma|signa|hastati|legio|vicimus)\b/i.test(g.lat)), 'los gritos de otros pueblos no llevan latín');
ok(V.nombreDe(G[0]) !== '' && V.nombreDe(GR[0]) === 'Jefe cartaginés' && V.nombreDe(GR.find(g => g.pueblo === 'galos' && g.quien === 'guerrero')) === 'Guerrero galo' && V.nombreDe(F[0]) === 'Centurión', 'nombreDe: lochagós, jefe cartaginés, guerrero galo, centurión');
// Voces.elige con pueblo: solo habla lo propio de ese pueblo (y el enemigo), nunca latín
for (const p of ['griego', ...PU]) {
  const e = V.nuevo(), r = semilla(11), vistas = new Set(); let tt = 0;
  for (let k = 0; k < 4000; k++) { tt += 1; e.t = tt; e.tension = 0.8; const sit = V.SITUACIONES[k % V.SITUACIONES.length], f = V.elige(sit, e, r, p); if (f) vistas.add(f); }
  const propias = [...vistas].filter(f => f.quien !== 'enemigo');
  ok(propias.length > 3 && propias.every(f => f.pueblo === p), `Voces.elige(…, '${p}') solo da frases de ese pueblo (${propias.length}) y lo que se oye del enemigo`);
}
{ const e = V.nuevo(); e.t = 50; const f = V.elige('choque', e, () => 0.1); ok(!f || !f.pueblo, 'sin pueblo, Voces.elige sigue dando las romanas de siempre'); }
ok(V.rotulo(G.find(f => f.lat === 'Émba!')) === 'Lochagós: Ἔμβα! · Émba! — ¡Adelante!' && V.rotulo(GR[0]) === 'Jefe cartaginés: ¡Baal Hammón, danos la victoria!', 'rótulos: «Lochagós: Ἔμβα! · Émba! — ¡Adelante!» y «Jefe cartaginés: ¡Baal Hammón…!»');
ok(V.FRASES_PUEBLO.griego.length === G.length && PU.every(p => V.FRASES_PUEBLO[p].length === GR.filter(g => g.pueblo === p).length), 'FRASES_PUEBLO reúne las frases de cada pueblo');
// banda: el pueblo manda sobre las tropas (Escaramuzas); los demás pueblos hablan lo suyo
ok(Bd.propioDe({ hastati: 90 }, 'cartago') === 'cartago' && Bd.propioDe({ libios: 50 }, 'roma') === 'romano' && Bd.propioDe({ velites: 90 }, 'roma') === 'romano' && Bd.propioDe({ falange: 90 }, 'epiro') === 'griego' && Bd.propioDe({ falange: 90 }, 'macedonia') === 'griego' && Bd.propioDe({ galos: 90 }, 'iberos') === 'iberos', 'banda: el pueblo elegido en Escaramuzas manda (Roma, Cartago, Epiro, Macedonia, galos, íberos)');
ok(Bd.propioDe({ hoplitas: 600 }) === 'griego' && Bd.propioDe({ sagrada: 300, hoplitas: 600 }) === 'cartago', 'banda: sin pueblo, hoplitas = griego; con tropa sagrada, Cartago');
// banda con subtítulo falso: el griego y el español salen con nombre, texto y voz
{
  const pone = []; const sustituto = { vbuf: {}, tiene: () => false, muestra() {}, voz: (id) => { pone.push(id); return true; }, contexto() {}, cargaVoces(l) { pone.push('carga:' + l.length); } };
  globalThis.Sonido = sustituto; globalThis.Musica = undefined; globalThis.Voces = V;
  for (const [propio, esp] of [['griego', 'gr-'], ['cartago', 'ca-'], ['galos', 'ga-'], ['iberos', 'ib-']]) {
    pone.length = 0; sustituto.vbuf = {}; for (const f of V.FRASES_PUEBLO[propio]) sustituto.vbuf[f.id] = { duration: 1 };
    const b = Bd.crea({ propio, rival: {}, semilla: 1 }); b.inicia();
    for (let k = 0; k < 40; k++) { b.vz.t += 20; b.vz.tUlt = -99; b.dice(['choque', 'empujar', 'espera', 'victoria'][k % 4]); }
    ok(pone.some(x => x.startsWith(esp)), `banda '${propio}': suena una voz ${esp}* (${pone.filter(x => x.startsWith(esp)).length} veces)`);
    ok(!pone.some(x => !x.startsWith(esp) && !x.startsWith('carga:') && !/^griego/.test(x)), `banda '${propio}': ninguna voz latina ni de otro pueblo`);
    ok(pone.find(x => x.startsWith('carga:')) === 'carga:' + (V.FRASES_PUEBLO[propio].length + (propio === 'griego' ? V.GRIEGO.length : 0)), `banda '${propio}': solo carga las voces de su pueblo`);
  }
  globalThis.Sonido = undefined;
}
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else console.log('\nTodo bien');
