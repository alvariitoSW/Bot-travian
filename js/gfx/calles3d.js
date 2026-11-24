/* AQVILA — CD2a: el dibujo de las calles que se trazan (solo vista). Una cinta sobre el terreno por capa:
   trazo en curso (tinta), forma elegida (crema, o roja si no vale) y propuesta del arquitecto (dorado discontinuo).
   Uso: montar(scene) una vez · pintar({ trazo, forma, ok, propuesta }) · limpiar(). No toca reglas ni datos. */
import { THREE } from './models.js';
import { altura } from './mundo.js';

let escena = null; const capas = {};
const COL = { tinta: 0x2b2118, crema: 0xf1e2b0, borde: 0x5a4524, rojo: 0xd8402e, oro: 0xf2b630 };
const ALZA = 1.7;

/* cinta de ancho w siguiendo el relieve; con raya = [largo, hueco] se parte en trozos (discontinua) */
function cinta(pts, w, raya) {
  const pos = [], idx = []; if (!pts || pts.length < 2) return null;
  const fino = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 2)); for (let j = i === 1 ? 0 : 1; j <= n; j++) fino.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
  let s = 0; const dist = [0]; for (let i = 1; i < fino.length; i++) { s += Math.hypot(fino[i][0] - fino[i - 1][0], fino[i][1] - fino[i - 1][1]); dist.push(s); }
  const base = []; fino.forEach((q, i) => { const a = fino[Math.max(0, i - 1)], b = fino[Math.min(fino.length - 1, i + 1)], t = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(t) * w / 2, nz = Math.cos(t) * w / 2; base.push([q[0] + nx, q[1] + nz, q[0] - nx, q[1] - nz, q[0], q[1]]); });
  let n0 = 0; for (let i = 0; i < fino.length; i++) { const b = base[i]; pos.push(b[0], altura(b[4], b[5]) + ALZA, b[1], b[2], altura(b[4], b[5]) + ALZA, b[3]);
    if (i > 0) { const k = (i - 1) * 2, ok = !raya || (dist[i] % (raya[0] + raya[1])) < raya[0]; if (ok) idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } n0++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
function capa(nombre, color, orden) {
  if (capas[nombre]) return capas[nombre];
  const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, opacity: 0.95, toneMapped: false, fog: false }));
  m.renderOrder = 40 + orden; m.frustumCulled = false; m.visible = false; escena.add(m); return (capas[nombre] = m);
}
function poner(nombre, pts, w, color, orden, raya) {
  const m = capa(nombre, color, orden), g = cinta(pts, w, raya); m.geometry.dispose();
  if (!g) { m.geometry = new THREE.BufferGeometry(); m.visible = false; return; } m.geometry = g; m.material.color.setHex(color); m.visible = true;
}
export function montar(scene) { escena = scene; }
export function pintar(o) {
  if (!escena) return; o = o || {};      // anchos fijos en metros (no dependen de la cámara)
  poner('trazo', o.trazo && !o.forma ? o.trazo : null, 5, COL.tinta, 1);
  poner('formaB', o.forma, 8, COL.borde, 2);
  poner('forma', o.forma, 6, o.ok ? COL.crema : COL.rojo, 3);
  poner('propuesta', o.propuesta, 5, COL.oro, 4, [7, 4]);
  poner('hecha', o.hecha, 7, COL.crema, 5);      // la calle recién hecha: se enciende un momento para que se note
}
export function limpiar() { for (const k in capas) { capas[k].visible = false; capas[k].geometry.dispose(); capas[k].geometry = new THREE.BufferGeometry(); } }
