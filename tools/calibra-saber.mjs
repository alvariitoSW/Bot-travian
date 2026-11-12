// AQVILA — calibración del Saber (criterio 4.13 del estudio P93): node tools/calibra-saber.mjs
// Recursos infinitos, requisitos cumplidos, camino de 16 saberes y 3 edades en orden fijo, tiempoMul = 1, sin saberes fechados.
// Imprime los meses del árbol completo para cada caso (sin y con las seis Eureka) frente a su banda, y el peso de la ciencia económica.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js');

const CAMINO = ['griego', 'apio', 'castra', 'E2', 'quinque', 'corvus', 'fasti', 'vina', 'pilum', 'E3', 'latif', 'sambuca', 'astilleros', 'medicina', 'E4', 'magon', 'perseo', 'acoger', 'hormigon'];
const EUREKA = ['tarentum', 'agrigentum', 'syracusae', 'panormus', 'carthago', 'pella'];
// banda [mín, máx] de meses; «piso» = no antes de ese mes
const CASOS = [
  { n: 'Sin Escuela (ritmo 1)', k: 'sin', sin: [650, 700], con: [590, 630] },
  { n: 'Escuela 3 con 30 plebeyos desde el mes 15', k: 'esc3', sin: [350, 420], con: [320, 380] },
  { n: 'R = 60 desde el mes 0', k: 'r60', sin: [300, 1e9], con: [270, 1e9] },
  { n: 'Tope (ritmo 3)', k: 'tope', sin: [215, 1e9], con: [195, 1e9] }
];

function partida(conEureka) {
  G.turnos = false; const s = G.newGame('Calibra'); G.turnos = false; s.turnos = false;
  const otras = D.regionCiudades(G.regionId()).filter(id => id !== 'roma' && !EUREKA.includes(id) && !['lilybaeum'].includes(id));
  for (const id of (conEureka ? EUREKA : otras.slice(0, 6))) if (s.cities[id]) s.cities[id].owner = 'roma';
  return s;
}
function corre(caso, conEureka) {
  const s = partida(conEureka), invReq = G.invReq, sabiosR = G.sabiosR; G.invReq = () => true;   // «requisitos cumplidos»
  if (caso.k === 'r60') G.sabiosR = () => 60; if (caso.k === 'tope') G.sabiosR = () => 1e9;
  const dt = 0.1; let i = 0, t = 0, escuelaPuesta = false;
  try {
    while ((i < CAMINO.length || s.inv.cola) && t < 2000) {
      for (const r of D.RES) { s.res[r] = 1e9; s.alm[r] = 1e9; s.cuarto[r] = 1e9; }
      if (caso.k === 'esc3' && !escuelaPuesta && t >= 15) {
        const c = s.cities.roma; c.heredado = Object.assign(c.heredado || {}, { escuela: 3 }); c.b.escuela = 3; c.pop = 2000; c.ciu = 0; c.esc = 0; c.imp = 'normal'; c.sabios = { dot: 3, clase: 'ple' }; escuelaPuesta = true;
      }
      if (!s.inv.cola && i < CAMINO.length) { const r = G.invUp(CAMINO[i]); if (!r.ok) throw new Error('no se puede estudiar ' + CAMINO[i] + ' en el mes ' + t.toFixed(1) + ': ' + r.motivo); i++; s.cuarto.oro = 1e9; }
      s.t = t; G.invTick(dt); t += dt;
    }
    if (caso.k === 'esc3') { const v = G.saberVel(); if (Math.abs(v - 1.8) > 1e-9) throw new Error('el ritmo de 30 plebeyos no es 1,8: ' + v); }
  } finally { G.invReq = invReq; G.sabiosR = sabiosR; }
  return Math.round(t * 10) / 10;
}

// peso económico de la ciencia: valor producido (materiales + 1,7 por denario) con y sin los saberes económicos, en un imperio de 6 ciudades grandes
function peso(extra) {
  const s = partida(false); for (const id of G.myCities()) { const c = s.cities[id]; Object.assign(c.b, { foro: 6, granja: 6, aserradero: 6, cantera: 6, mina: 6, mercado: 6, puerto: c.b.puerto || 0 }); c.pop = 1500; c.heredado = Object.assign(c.heredado || {}, { foro: 6, granja: 6, aserradero: 6, cantera: 6, mina: 6, mercado: 6 }); }
  const val = () => { const p = G.prod(); return p.madera + p.piedra + p.hierro + p.grano + p.comida + 1.7 * (p.oro + p.mant.total + p.det.impuestos * 0); };
  const base = val(); const tot = {};
  for (const ca of ['vina', 'trigo']) {
    s.inv.hechas = {}; for (const id of ['apio', 'castra', 'fasti', ca, 'pilum', 'latif', 'sambuca', 'astilleros', 'medicina', 'magon', 'perseo', 'acoger', 'hormigon', 'griego', 'quinque', 'corvus']) s.inv.hechas[id] = 0; s.inv.edad = 4; s.inv.rev++;
    tot[ca] = val() / base - 1;
  }
  s.inv.hechas = {}; s.inv.rev++; return tot;
}

console.log('AQVILA · calibración del Saber (meses del árbol de 16 saberes + 3 edades; base ' + CAMINO.reduce((a, id) => a + (D.INVEST[id] || D.EDADES[id]).time, 0) + ' meses)\n');
let fuera = 0; const fila = [];
for (const c of CASOS) {
  const a = corre(c, false), b = corre(c, true), oka = a >= c.sin[0] && a <= c.sin[1], okb = b >= c.con[0] && b <= c.con[1]; if (!oka) fuera++; if (!okb) fuera++;
  const bd = x => x[1] >= 1e8 ? 'no antes del ' + x[0] : x[0] + '-' + x[1];
  fila.push('| ' + c.n.padEnd(42) + ' | ' + String(a).padStart(6) + ' ' + (oka ? 'ok   ' : 'FUERA') + ' (' + bd(c.sin) + ') | ' + String(b).padStart(6) + ' ' + (okb ? 'ok   ' : 'FUERA') + ' (' + bd(c.con) + ') |');
}
console.log('| Caso                                       | Sin Eureka                       | Con las seis Eureka              |'); console.log(fila.join('\n'));
const w = peso(), mx = Math.max(w.vina, w.trigo);
console.log('\nPeso de la ciencia económica sobre el valor producido: con Viña ' + (w.vina * 100).toFixed(1) + ' %, con Trigo ' + (w.trigo * 100).toFixed(1) + ' % (tope 8 %; diseño 3-6 %).');
if (mx > 0.08) { console.log('FALLA: el peso económico pasa del 8 %.'); process.exit(1); }
if (fuera) { console.log('FUERA DE BANDA en ' + fuera + ' celdas: no se toca el código; ajustar D.SABER (decide el usuario).'); process.exit(1); }
console.log('APTO'); 
