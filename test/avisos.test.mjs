// AQVILA — R4: avisos de una frase. node test/avisos.test.mjs
// Todo texto de aviso (asesor, consejo de estación, pausas, resumen de turno) ≤ 80 caracteres y una sola frase.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const A = require('../js/asesor.js'); const G = require('../js/game.js');
const Ciudad = await import('../js/ciudad.js');
const T = A.TEXTOS; let n = 0, mal = 0;
const frase = (t, de) => {
  n++;
  const m = [];
  if (!t || t.length > 80) m.push(t.length + ' caracteres');
  if (/;/.test(t)) m.push('lleva «;»');
  if (/[.!?](\s+\S)/.test(t.replace(/\d[.,]\d/g, '0'))) m.push('más de una frase');
  if (m.length) { mal++; console.log('MAL', de, '—', m.join(', '), '→', t); }
};
// 1) lecciones del asesor
for (const l of A.LECCIONES) frase(l.texto, 'lección ' + l.id);
// 2) constructores con los peores nombres de los datos
const largo = a => a.reduce((x, y) => (y.length > x.length ? y : x), '');
const ciudades = Object.values(D.CITIES).map(c => c.n), facs = Object.values(D.FACTIONS).map(f => f.n), unis = Object.values(D.UNITS).map(u => u.n);
const edifs = Object.values(D.BUILD).map(b => b.n + ' nivel 20').concat(Object.values(Ciudad.EDIF).map(e => e.nombre + ' mejorado'));
const C = largo(ciudades), F = largo(facs), U = largo(unis), E = largo(edifs);
frase(T.obras(E, 3, '12,5 meses'), 'obras'); frase(T.obras(E, 0, '12 días'), 'obras 1');
frase(T.sinRecursos(), 'sinRecursos'); frase(T.almacen('madera', 100, true), 'almacén'); frase(T.granero(), 'granero'); frase(T.tope(), 'tope');
for (const [b, nv, f] of [[true, 'Aldea', 'más grano (una granja)'], [false, 'Barrio residencial', 'un mercado']]) frase(T.barrio(b, nv, f), 'barrio');
for (const b of Object.values(D.BARRIO || {})) if (b && b.n) frase(T.barrio(true, b.n, 'más grano (una granja)'), 'barrio ' + b.n);
frase(T.mejora(true, E.replace(/ nivel 20| mejorado/, '')), 'mejora'); frase(T.arrabal(999, true), 'arrabal'); frase(T.tranquila(), 'tranquila'); frase(T.constructores(), 'constructores');
frase(T.refuerza(C), 'refuerza'); frase(T.llega(F, 99999, C), 'llega'); frase(T.colonos(C), 'colonos'); frase(T.seAcaba(true, 99), 'seAcaba');
frase(T.sinObras([C, C, C].join(', '), true), 'sinObras'); frase(T.llenoAlm('madera, piedra, hierro, grano, oro'), 'llenoAlm'); frase(T.favor(), 'favor');
frase(T.perdido('🪵 -999 🪨 -999 ⛏️ -999 🌾 -999 🪙 -999'), 'perdido');
for (const r of D.RES) { const N = r[0].toUpperCase() + r.slice(1); frase(T.cierre(N, 99999, 99999, 99999, false), 'cierre'); frase(T.cierre(N, 99999, 99999, 99999, true), 'cierre completo'); }
for (const p of ['5 obras, 3 avisos graves, 4 avisos', '1 obra', '2 avisos graves']) frase(T.turno(p), 'turno');
frase(T.obraHecha(C, E), 'obraHecha'); frase(T.tropaLista(C, 99999, U), 'tropaLista'); frase(T.ataque(F, C), 'ataque');
for (const q of Object.values(D.MISIONES)) { frase(T.mision(q.n, 12, 'Hombres en armas: 9999 de 9999.'), 'misión Senado'); frase(T.misionOk(q.n), 'misión ok'); frase(T.misionMal(q.n), 'misión mal'); }
for (const ya of [true, false]) frase(T.hambre(ya), 'hambre');
for (const k of [1, 99]) { frase(T.crecida(k), 'crecida'); frase(T.fuego(k), 'fuego'); }
// 3) lo que de verdad dice el juego: se corre una campaña y se mira cada línea del consejo, cada pausa y cada riesgo
const vistos = new Set(); const mira = (t, de) => { const k = de + '|' + t; if (!vistos.has(k)) { vistos.add(k); frase(t, de); } };
G.newGame('Test', 'mediterraneo', {}); const s = G.state; G.turnos = false;
G.onEvent = (tipo, p) => { if (tipo === 'parar') mira(p.motivo, 'pausa'); };
for (let i = 0; i < 24 * 4 * 3 && !s.over; i++) {
  G.tick(0.25); if (s.pending.length) s.pending.length = 0;
  if (i % 4 === 0) { for (const l of G.consejo().slice(1)) mira(l.x, 'consejo'); for (const x of G.avisoCierre(true)) mira(x, 'cierre'); for (const x of G.avisoCierre(false)) mira(x, 'cierre'); }
  if (i % 8 === 0) for (const id of G.myCities()) for (const r of G.riesgos(id)) mira(r.a, 'riesgo ' + r.c);
}
// 4) prioridad documentada: ataque primero, consejo corriente último
if (A.PRIORIDAD[0] !== 'ataque' || A.PRIORIDAD[A.PRIORIDAD.length - 1] !== 'consejo') { mal++; console.log('MAL prioridad'); }
console.log((mal ? 'FALLA' : 'bien') + ' — ' + n + ' textos mirados, ' + vistos.size + ' del juego en marcha, ' + mal + ' malos');
process.exit(mal ? 1 : 0);
