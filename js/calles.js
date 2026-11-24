/* AQVILA — CD2a: calles con el dedo y el arquitecto. REGLAS sin pantalla (corre en Node): suavizar el trazo, sus tres formas,
   validarlo y proponer una calle. Sin azar: lo mismo de entrada da lo mismo de salida. Lo que se ve está en js/gfx/calles3d.js y js/calles-ui.js.
   Las reglas de verdad (qué vale, qué cuesta, hacerla) están en js/ciudad.js (motivoCalle, costeCalle, trazarCalle). */
import { suavizar, distPoli } from './gfx/mundo.js';
import { motivoCalle, costeCalle, largoTrazo, trazarCalle, barrioDe, esAgua, ci, conCasa, DRIO, CALLE_MIN, CALLE_MAX, CALLE_ANCHO } from './ciudad.js';
export { trazarCalle, CALLE_MIN, CALLE_MAX };

/* Douglas-Peucker sobre [[x, z], …]: quita los puntos que no se apartan más de tol metros de la recta que los une */
export function simplificar(trazo, tol = 3) {
  const n = trazo.length; if (n < 3) return trazo.map(q => q.slice());
  const guarda = new Uint8Array(n); guarda[0] = guarda[n - 1] = 1; const pila = [[0, n - 1]];
  while (pila.length) { const [i, j] = pila.pop(); let m = -1, mk = -1; const a = trazo[i], b = trazo[j], bx = b[0] - a[0], bz = b[1] - a[1], l2 = bx * bx + bz * bz;
    for (let k = i + 1; k < j; k++) { const q = trazo[k]; let t = l2 ? ((q[0] - a[0]) * bx + (q[1] - a[1]) * bz) / l2 : 0; t = Math.max(0, Math.min(1, t)); const d = Math.hypot(q[0] - a[0] - bx * t, q[1] - a[1] - bz * t); if (d > m) { m = d; mk = k; } }
    if (m > tol && mk > 0) { guarda[mk] = 1; pila.push([i, mk], [mk, j]); } }
  return trazo.filter((q, k) => guarda[k]).map(q => q.slice());
}

/* Ángulo del eje de la ciudad: el de la calle principal del foro (E.eje, de puerta a puerta). Sin eje, el de la primera vía del foro. */
export function anguloEje(E) {
  const v = E.vias.find(q => q.id === E.eje) || E.vias.find(q => q.t === 'via'); if (!v || v.p.length < 2) return 0;
  const a = v.p[0], b = v.p[v.p.length - 1]; return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

/* Las tres formas de un trazo: «como la tracé» (suavizada), «recta» y «cuadrícula» (tramos en L alineados al eje) */
export function formas(E, trazo) {
  if (!trazo || trazo.length < 2) return { tal: [], recta: [], cuadricula: [] };
  const A = trazo[0], B = trazo[trazo.length - 1], simple = simplificar(trazo, 3);
  const tal = simple.length >= 3 ? suavizar(simple, 5) : simple, recta = [A.slice(), B.slice()];
  const th = anguloEje(E), c = Math.cos(th), s = Math.sin(th), dx = B[0] - A[0], dz = B[1] - A[1], u = dx * c + dz * s, w = -dx * s + dz * c;
  const esquina = (uu, ww) => [A[0] + uu * c - ww * s, A[1] + uu * s + ww * c];
  let cuadricula;
  if (Math.abs(u) < 3 || Math.abs(w) < 3) cuadricula = [A.slice(), B.slice()];
  else { const o1 = [A.slice(), esquina(u, 0), B.slice()], o2 = [A.slice(), esquina(0, w), B.slice()];       // primero a lo largo del eje o primero de través
    const err = o => simple.reduce((t, q) => t + distPoli(o, q[0], q[1]), 0); cuadricula = err(o1) <= err(o2) ? o1 : o2; }
  return { tal, recta, cuadricula };
}

export const coste = costeCalle;
/* ¿Vale este trazo? { ok, motivo (una frase, o ''), largo, coste } */
export function validar(E, pts) {
  const largo = pts && pts.length > 1 ? largoTrazo(pts) : 0, motivo = motivoCalle(E, pts);
  return { ok: !motivo, motivo: motivo || '', largo: Math.round(largo), coste: costeCalle(largo) };
}
export const costeTexto = c => ['piedra', 'madera', 'hierro', 'grano', 'oro'].filter(r => c[r]).map(r => c[r] + ' ' + r).join(' · ');

/* Cuántos solares nuevos saldrían a los lados: cuenta huecos libres cada ~15,5 m, a ~11,5 m de la calle, que no pisen otra parcela */
export function solaresNuevos(E, pts) {
  const ret = CALLE_ANCHO + 1.4 + 7.75, vivas = E.parcelas.filter(l => !l.fuera); let n = 0, sig = 9, s = 0;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!L) continue; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang), nz = Math.cos(ang);
    while (sig <= s + L) { const u = (sig - s) / L, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u; sig += 15.5;
      for (const lado of [1, -1]) { const cx = x + nx * ret * lado, cz = z + nz * ret * lado, k = ci(cx, cz); if (k < 0 || barrioDe(E, cx, cz) < 0 || esAgua(cx, cz) || DRIO[k] < 56) continue;
        const o = E.ocup[k]; if (o === 1 || o === 2 || o === 4 || o === 5 || o === 6 || (o === 3 && conCasa(E, k))) continue;
        if (vivas.some(l => Math.abs(l.x - cx) < 14 && Math.hypot(l.x - cx, l.z - cz) < 13.6)) continue; n++; } }
    s += L; }
  return n;
}

const nombreVia = v => v.id === 1 ? 'el camino' : v.t === 'camino' ? 'el camino' : v.trazada ? 'tu calle' : v.t === 'via' ? 'la calle del foro' : v.t === 'callejon' ? 'el callejón' : 'la calle';
/* El arquitecto propone UNA calle (no la traza). Prueba: prolongar la punta de una calle, salir de una boca sin hacer, y cruzar de través una calle;
   en la dirección que ya llevan o alineadas al eje. Se queda con la válida que daría más solares nuevos. { pts, porque } o null. */
export function proponer(E) {
  if (!E.fundada) return null;
  const th = anguloEje(E), cands = [], dirEje = a => { let m = null, md = 9; for (const t of [th, th + Math.PI / 2, th + Math.PI, th - Math.PI / 2]) { let d = Math.abs(Math.atan2(Math.sin(t - a), Math.cos(t - a))); if (d < md) { md = d; m = t; } } return md < 0.6 ? m : null; };
  const recta = (x, z, ang, L) => [[x, z], [x + Math.cos(ang) * L, z + Math.sin(ang) * L]];
  const dirs = a => { const o = [a], e = dirEje(a); if (e !== null && Math.abs(Math.atan2(Math.sin(e - a), Math.cos(e - a))) > 0.02) o.push(e); return o; };
  for (const v of E.vias) { if (v.t === 'senda' || v.p.length < 3) continue; const n = v.p.length;
    for (const fin of [true, false]) { const p = fin ? v.p[n - 1] : v.p[0], q = fin ? v.p[Math.max(0, n - 4)] : v.p[Math.min(n - 1, 3)], ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
      for (const a of dirs(ang)) for (const L of [60, 80, 100, 120, 140]) cands.push({ pts: recta(p[0], p[1], a, L), tipo: 'prolonga', v }); }
    for (const f of [0.35, 0.65]) { const i = Math.floor((n - 1) * f), a = v.p[i], b = v.p[Math.min(n - 1, i + 1)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const lado of [1, -1]) for (const L of [60, 100, 140]) { const t = ang + lado * Math.PI / 2, o = v.w + 1; cands.push({ pts: recta(a[0] + Math.cos(t) * o, a[1] + Math.sin(t) * o, t, L), tipo: 'perpendicular', v }); } } }
  for (const b of E.bocas) { if (b.hecha) continue; const v = E.vias.find(q => q.id === b.via), ang = Math.atan2(b.dz, b.dx);
    for (const a of dirs(ang)) for (const L of [60, 100, 140]) cands.push({ pts: recta(b.x, b.z, a, L), tipo: 'boca', v }); }
  let mejor = null, ms = 1;
  for (const c of cands) { if (motivoCalle(E, c.pts)) continue; const sc = solaresNuevos(E, c.pts); if (sc > ms) { ms = sc; mejor = c; } }
  if (!mejor) return null;
  const L = Math.round(largoTrazo(mejor.pts)), nom = mejor.v ? nombreVia(mejor.v) : 'una calle', N = ms;
  const porque = mejor.tipo === 'prolonga' ? 'Prolonga ' + nom + ' hacia terreno libre: salen unos ' + N + ' solares a sus lados.'
    : mejor.tipo === 'boca' ? 'Sale de una boca que quedó sin calle junto a ' + nom + ': abre unos ' + N + ' solares nuevos.'
    : 'Cruza ' + nom + ' de través, por terreno libre y llano: salen unos ' + N + ' solares.';
  return { pts: mejor.pts.map(q => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]), porque, largo: L, solares: N };
}
