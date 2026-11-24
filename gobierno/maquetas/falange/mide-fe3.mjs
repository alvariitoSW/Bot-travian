// FE3 «Elefantes que no rebotan como una pelota»: mide, sin pantalla, cómo se mueve el elefante dibujado en la lucha contra el muro.
// Sigue la figura como la sigue el dibujo (rival.js, sigue: V_ELEFANTE) y su cabeceo como elefante.js.
// Se mide desde que la figura alcanza a la bestia tras el golpe (la carrera llega a 11 m/s y eso no es vaivén).
// Imprime por elefante vivo en lucha: vaivén horizontal por fotograma (máx, cm), recorrido de ida y vuelta en la lucha (m),
// fotogramas a tope (|f| ≥ TOPE − 1 cm) y bote vertical (cm, salvo al alzarse). Sale con 1 si falla una vara.
// Uso: node gobierno/maquetas/falange/mide-fe3.mjs [semilla=9] [fisica=0] [segundos=60]
import { crearFalange, SARISA, AGARRE } from '../../../js/falange.js';
import { RIVALES } from '../../../js/falange-rivales.js';
import { crearFisica, TOPE } from '../../../js/fisica-batalla.js';
import { cabeceo } from './elefante.js';
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split('=')));
const semilla = +(op.semilla || 9), conFisica = op.fisica !== '0', SEG = +(op.segundos || 60), DT = 1 / 30;
const F = crearFalange({ semilla, rival: RIVALES.elefantes, avisa: () => {} }), S = F.S, Fi = crearFisica();
for (let i = 0; i < 5; i++) F.fila(i, true); F.orden('aguantar');
const CARRIL = r => ({ x: 0.18 + 0.07 * Math.min(4, r), y: [1.0, 1.24, 1.42, 1.58, 1.72][Math.min(4, r)] });
function picas() {
  const g = S.giro || 0, Fx = Math.sin(g), Fz = -Math.cos(g), Rx = Math.cos(g), Rz = Math.sin(g);
  for (const h of S.fal) if (h.vivo && !h.huye && h.kB > 0.5 && h.r < 5) {
    const c = CARRIL(h.r), mx = h.x + (h.fx || 0) + Rx * c.x + Fx * 0.3, mz = h.z + (h.fz || 0) + Rz * c.x + Fz * 0.3, D = [Fx, -0.015, Fz];
    Fi.pica(h, [mx - D[0] * AGARRE, c.y - D[1] * AGARRE, mz - D[2] * AGARRE], D, SARISA);
  }
}
const V_ELEFANTE = 11, fig = new Map(), est = new Map(), golpes = [], paso0 = (d, px, pz) => Math.hypot(d.x - px, d.z - pz);
let T = 0;
while (S.T < SEG && !S.ganador) {
  F.paso(DT); if (conFisica) { Fi.paso(S, DT); picas(); } T += DT;
  for (const h of S.ene) {
    if (h.tipo !== 'elefante' || h.fuera) continue;
    let d = fig.get(h); const hx = h.x + (conFisica ? h.fx || 0 : 0), hz = h.z + (conFisica ? h.fz || 0 : 0);
    if (!d) { d = { x: hx, z: hz, t0: T, est: h.est, fase: (h.i || 0) * 1.7 }; fig.set(h, d); }
    if (d.est !== h.est) { d.est = h.est; d.t0 = T; }
    const px = d.x, pz = d.z, dx = hx - d.x, dz = hz - d.z, dist = Math.hypot(dx, dz), mv = Math.min(dist, V_ELEFANTE * DT);
    if (dist > 1e-6) { d.x += dx / dist * mv; d.z += dz / dist * mv; }
    if (!h.vivo || h.est !== 'lucha' && h.est !== 'ensartada') { d.llego = false; continue; }
    /* el golpe: la figura aún llega a la carrera (11 m/s) los primeros fotogramas; se mide desde que alcanza a la bestia y se para */
    const lag = Math.hypot(hx - d.x, hz - d.z); if (!d.llego) { if (lag > 0.05 || paso0(d, px, pz) > 0.05) { golpes.push(paso0(d, px, pz)); continue; } d.llego = true; }
    const c = cabeceo(h.est, T, d.t0), y = c.y;
    let m = est.get(h); if (!m) est.set(h, m = { n: 0, vMax: 0, rec: 0, tope: 0, yMin: Infinity, yMax: -Infinity, alza: 0 });
    const paso = Math.hypot(d.x - px, d.z - pz); if (op.ver && paso > 0.05) console.log(`    T ${S.T.toFixed(2)} e${h.i} ${h.est} paso ${(paso*100).toFixed(1)} cm · lógica (${h.x.toFixed(2)}, ${h.z.toFixed(2)}) · f (${(h.fx||0).toFixed(2)}, ${(h.fz||0).toFixed(2)}) · lag ${dist.toFixed(2)}`); m.n++; m.vMax = Math.max(m.vMax, paso); m.rec += paso;
    if (conFisica && Math.hypot(h.fx || 0, h.fz || 0) >= TOPE - 0.01) m.tope++;
    if (c.alza) m.alza++; else { m.yMin = Math.min(m.yMin, y); m.yMax = Math.max(m.yMax, y); }
  }
}
const mal = [];
console.log(`FE3 · semilla ${semilla} · ${conFisica ? 'con' : 'sin'} física · ${S.T.toFixed(1)} s${S.ganador ? ' (gana ' + S.ganador + ')' : ''}`);
for (const [h, m] of est) {
  const bote = m.yMax > m.yMin ? (m.yMax - m.yMin) * 100 : 0;
  console.log(`  elefante ${h.i}: ${m.n} fotogramas en lucha · vaivén máx ${(m.vMax * 100).toFixed(1)} cm/fotograma · recorrido ${m.rec.toFixed(1)} m · a tope ${m.tope} · bote ${bote.toFixed(1)} cm (alzado ${m.alza} fotogramas)`);
  if (m.vMax >= 0.05) mal.push(`elefante ${h.i}: vaivén ${(m.vMax * 100).toFixed(1)} cm ≥ 5`);
  if (m.tope) mal.push(`elefante ${h.i}: llega al tope ${m.tope} veces`);
  if (bote >= 3) mal.push(`elefante ${h.i}: bote ${bote.toFixed(1)} cm ≥ 3`);
}
console.log(`  golpe de llegada (fin de la carrera, no cuenta): ${golpes.length} fotogramas, el mayor ${(Math.max(0, ...golpes) * 100).toFixed(1)} cm`);
if (!est.size) mal.push('ningún elefante llegó a la lucha');
console.log(mal.length ? 'NO APTO\n  ' + mal.join('\n  ') : 'APTO'); process.exit(mal.length ? 1 : 0);
