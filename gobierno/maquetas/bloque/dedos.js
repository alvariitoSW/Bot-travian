/* LP3 · El único gesto en el campo: arrastrar el dedo por el suelo dibuja el frente (LP0 §3).
   Se pinta una raya azul discontinua con tres flechas: ahí formará tu primera fila, mirando hacia donde apuntan.
   Al soltar, el bloque marcha y gira como una puerta. Mientras va, la raya se queda en el suelo; al llegar, se borra.
   Un toque corto no hace nada (no hay gestos invisibles). Los botones y velos no dibujan.
   Contrato: crearDedos({ lienzo, suelo, haciaDonde, alSoltar }) → { raya (THREE.Mesh), muestra(p0, p1, rumbo), oculta(), activo() }
     suelo(px, py) → { x, z } | null · haciaDonde(p0, p1) → rumbo previsto · alSoltar(p0, p1) */
import { THREE } from '../../../js/gfx/models.js';

const ARRASTRA_PX = 14, MIN_M = 1.5;
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) });

export function crearDedos({ lienzo, suelo, haciaDonde, alSoltar, H = () => 0 }) {
  /* la raya: guiones y flechas en una sola malla, encima de todo (se tiene que ver entre los hombres) */
  const MAX = 64 * 6 + 3 * 9, pos = new Float32Array(MAX * 3), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0x3aa8ff, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const raya = new THREE.Mesh(geo, mat); raya.frustumCulled = false; raya.renderOrder = 20; raya.visible = false;

  function muestra(p0, p1, rumbo, vivo = true) {
    const dx = p1.x - p0.x, dz = p1.z - p0.z, L = Math.hypot(dx, dz); if (L < 0.01) { oculta(); return; }
    const ux = dx / L, uz = dz / L, w = 0.75, F = fr(rumbo);
    let n = 0; const v = (x, z) => { pos[n++] = x; pos[n++] = H(x, z) + 0.15; pos[n++] = z; };
    const quad = (ax, az, bx, bz, ex, ez) => { v(ax + ex, az + ez); v(bx + ex, bz + ez); v(bx - ex, bz - ez); v(ax + ex, az + ez); v(bx - ex, bz - ez); v(ax - ex, az - ez); };
    /* guiones de 1,2 m con huecos de 0,7 m; la normal del guion (-uz, ux) da su grosor */
    const ex = -uz * w / 2, ez = ux * w / 2; let s = 0, k = 0;
    while (s < L && k < 64) { const e = Math.min(L, s + 1.6); quad(p0.x + ux * s, p0.z + uz * s, p0.x + ux * e, p0.z + uz * e, ex, ez); s = e + 0.8; k++; }
    /* tres flechas hacia delante del frente: en las puntas y en medio */
    for (const t of [0.12, 0.5, 0.88]) {
      const cx = p0.x + dx * t + F.x * 1.2, cz = p0.z + dz * t + F.z * 1.2, a = 1.8;
      v(cx + F.x * 1.6 * a, cz + F.z * 1.6 * a); v(cx - ux * 0.9 * a, cz - uz * 0.9 * a); v(cx + ux * 0.9 * a, cz + uz * 0.9 * a);
      v(cx + ux * 0.32 * a, cz + uz * 0.32 * a); v(cx - ux * 0.32 * a, cz - uz * 0.32 * a); v(cx - ux * 0.32 * a - F.x * 0.9 * a, cz - uz * 0.32 * a - F.z * 0.9 * a);
      v(cx + ux * 0.32 * a, cz + uz * 0.32 * a); v(cx - ux * 0.32 * a - F.x * 0.9 * a, cz - uz * 0.32 * a - F.z * 0.9 * a); v(cx + ux * 0.32 * a - F.x * 0.9 * a, cz + uz * 0.32 * a - F.z * 0.9 * a);
    }
    geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, n / 3); geo.computeBoundingSphere();
    mat.opacity = vivo ? 0.95 : 0.75; raya.visible = true;
  }
  function oculta() { raya.visible = false; geo.setDrawRange(0, 0); }

  /* ---------- el dedo ---------- */
  let dedo = null;   /* { id, x, y, p0, p1, dibuja } */
  const fuera = e => e.target !== lienzo;
  addEventListener('pointerdown', e => {
    if (dedo || fuera(e)) return;
    const p = suelo(e.clientX, e.clientY); if (!p) return;
    dedo = { id: e.pointerId, x: e.clientX, y: e.clientY, p0: p, p1: p, dibuja: false };
  });
  addEventListener('pointermove', e => {
    if (!dedo || e.pointerId !== dedo.id) return;
    if (!dedo.dibuja && Math.hypot(e.clientX - dedo.x, e.clientY - dedo.y) < ARRASTRA_PX) return;
    const p = suelo(e.clientX, e.clientY); if (!p) return;
    dedo.dibuja = true; dedo.p1 = p; muestra(dedo.p0, p, haciaDonde(dedo.p0, p), true);
  });
  const suelta = e => {
    if (!dedo || e.pointerId !== dedo.id) return;
    const d = dedo; dedo = null;
    if (d.dibuja && Math.hypot(d.p1.x - d.p0.x, d.p1.z - d.p0.z) >= MIN_M) alSoltar(d.p0, d.p1); else if (d.dibuja) oculta();
  };
  addEventListener('pointerup', suelta); addEventListener('pointercancel', e => { if (dedo && e.pointerId === dedo.id) { dedo = null; oculta(); } });
  return { raya, muestra, oculta, activo: () => !!(dedo && dedo.dibuja) };
}
