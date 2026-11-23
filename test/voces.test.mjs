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
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else console.log('\nTodo bien');
