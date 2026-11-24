/* LP3 · El único gesto en el campo: arrastrar el dedo por el suelo dibuja el frente (LP0 §3).
   Se pinta una raya azul discontinua con tres flechas: ahí formará tu primera fila, mirando hacia donde apuntan.
   Al soltar, el bloque marcha y gira como una puerta. Mientras va, la raya se queda en el suelo; al llegar, se borra.
   Un toque corto no hace nada (no hay gestos invisibles). Los botones y velos no dibujan.
   Contrato: crearDedos({ lienzo, suelo, haciaDonde, alSoltar, libre }) → { raya (THREE.Mesh), muestra(p0, p1, rumbo), oculta(), activo() }
     suelo(px, py) → { x, z } | null · haciaDonde(p0, p1) → rumbo previsto · alSoltar(p0, p1)
     escala() → grosor de la raya y tamaño de las flechas (1 arriba; más fina desde la vista del oficial, LP4)
     libre() → false mientras hay un pellizco (camara.js, LP4): entonces no se dibuja y lo empezado se borra
   FU3b · la falange: fal() → null | { bajar: bool, anillo: { x, y, r } | null } (el hueco abierto, en pantalla). Con bajar (acometida): deslizar hacia abajo
     (> 40 px, casi vertical, < 400 ms) → 'bajar'. Con anillo: tocar el anillo, o arrastrar hasta él → 'cerrar'. En los dos casos no se dibuja raya.
   FU3c: fal() añade sostener (empuje en curso o falange en lucha), empuje (hay empuje en curso: no dibuja) y othismos (cada toque → 'golpe', sin raya).
     Todo dedo que toca el lienzo con sostener manda 'sostener' {on:true}; al soltar el último, {on:false}.
   FU2 · modo pelea (vista del oficial): pelea() → 'nada' | 'pilum' | 'duelo' y alGesto(gesto, datos).
     'duelo': un dedo no dibuja. Tocar (< 0,2 s, quieto) → 'estocada'; mantener quieto ≥ 0,2 s → 'parar' y al levantar 'suelta-parar';
              deslizar hacia arriba (más de 40 px) → 'empujar'.
     'pilum': dedo quieto (< 14 px) 0,3 s → 'pilum-arma' y ya no dibuja; al soltar → 'pilum-suelta' con el punto del suelo bajo el dedo.
              Si se arrastra antes, dibuja el frente como siempre. 'nada': como siempre. dedoEn() → { x, y } del dedo (el arco de carga). */
import { THREE } from '../../../js/gfx/models.js';

const DESLIZA_PX = 40, DESLIZA_MS = 400, ANILLO_PX = 60;
const ARRASTRA_PX = 14, MIN_M = 1.5, TOQUE_S = 200, PILUM_S = 300, EMPUJA_PX = 40;
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) });

export function crearDedos({ lienzo, suelo, haciaDonde, alSoltar, H = () => 0, libre = () => true, escala = () => 1, pelea = () => 'nada', alGesto = () => {}, fal = () => null }) {
  /* la raya: guiones y flechas en una sola malla, encima de todo (se tiene que ver entre los hombres) */
  const MAX = 64 * 6 + 3 * 9, pos = new Float32Array(MAX * 3), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0x3aa8ff, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const raya = new THREE.Mesh(geo, mat); raya.frustumCulled = false; raya.renderOrder = 20; raya.visible = false;

  function muestra(p0, p1, rumbo, vivo = true) {
    const dx = p1.x - p0.x, dz = p1.z - p0.z, L = Math.hypot(dx, dz); if (L < 0.01) { oculta(); return; }
    const E = escala(), ux = dx / L, uz = dz / L, w = 0.75 * E, F = fr(rumbo);
    let n = 0; const v = (x, z) => { pos[n++] = x; pos[n++] = H(x, z) + 0.15; pos[n++] = z; };
    const quad = (ax, az, bx, bz, ex, ez) => { v(ax + ex, az + ez); v(bx + ex, bz + ez); v(bx - ex, bz - ez); v(ax + ex, az + ez); v(bx - ex, bz - ez); v(ax - ex, az - ez); };
    /* guiones de 1,2 m con huecos de 0,7 m; la normal del guion (-uz, ux) da su grosor */
    const ex = -uz * w / 2, ez = ux * w / 2; let s = 0, k = 0;
    while (s < L && k < 64) { const e = Math.min(L, s + 1.6); quad(p0.x + ux * s, p0.z + uz * s, p0.x + ux * e, p0.z + uz * e, ex, ez); s = e + 0.8; k++; }
    /* tres flechas hacia delante del frente: en las puntas y en medio */
    for (const t of [0.12, 0.5, 0.88]) {
      const cx = p0.x + dx * t + F.x * 1.2 * E, cz = p0.z + dz * t + F.z * 1.2 * E, a = 1.8 * E;
      v(cx + F.x * 1.6 * a, cz + F.z * 1.6 * a); v(cx - ux * 0.9 * a, cz - uz * 0.9 * a); v(cx + ux * 0.9 * a, cz + uz * 0.9 * a);
      v(cx + ux * 0.32 * a, cz + uz * 0.32 * a); v(cx - ux * 0.32 * a, cz - uz * 0.32 * a); v(cx - ux * 0.32 * a - F.x * 0.9 * a, cz - uz * 0.32 * a - F.z * 0.9 * a);
      v(cx + ux * 0.32 * a, cz + uz * 0.32 * a); v(cx - ux * 0.32 * a - F.x * 0.9 * a, cz - uz * 0.32 * a - F.z * 0.9 * a); v(cx + ux * 0.32 * a - F.x * 0.9 * a, cz + uz * 0.32 * a - F.z * 0.9 * a);
    }
    geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, n / 3); geo.computeBoundingSphere();
    mat.opacity = vivo ? 0.95 : 0.75; raya.visible = true;
  }
  function oculta() { raya.visible = false; geo.setDrawRange(0, 0); }

  /* ---------- el dedo ---------- */
  let dedo = null, reloj = 0;   /* { id, x, y, cx, cy, p0, p1, dibuja, modo, lejos, manten, hecho, pilum } */
  const fuera = e => e.target !== lienzo;
  const gesto = (g, d) => { try { alGesto(g, d); } catch (err) { console.warn('gesto', err); } };
  /* FU3c: dedos que mantienen la pantalla (sostener) */
  const tiene = new Set();
  const alza = e => { if (tiene.delete(e.pointerId) && !tiene.size) gesto('sostener', { on: false }); };
  addEventListener('pointerdown', e => {
    if (fuera(e) || !libre()) return;
    const f3 = fal();
    if (f3 && f3.sostener) { tiene.add(e.pointerId); gesto('sostener', { on: true }); }
    if (f3 && f3.othismos) { gesto('golpe'); return; }   /* FU3c: cada toque es un golpe al compás; no dibuja ni se queda colgado */
    if (dedo) return;
    const modo = pelea(), p = modo === 'duelo' ? null : suelo(e.clientX, e.clientY), fa = fal();
    if (!p && modo === 'nada') return;
    dedo = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, p0: p, p1: p, dibuja: false, modo, lejos: false, manten: false, hecho: false, pilum: false, t0: e.timeStamp, fa: !!(fa && (fa.bajar || fa.anillo || fa.empuje)) };
    const d = dedo; clearTimeout(reloj);
    if (modo === 'duelo') reloj = setTimeout(() => { if (dedo === d && !d.lejos && !d.hecho && libre()) { d.manten = true; gesto('parar'); } }, TOQUE_S);
    else if (modo === 'pilum') reloj = setTimeout(() => { if (dedo === d && !d.lejos && !d.dibuja && libre()) { d.pilum = true; gesto('pilum-arma'); } }, PILUM_S);
  });
  /* cortar a medias (pellizco o cancelación): soltar el escudo, olvidar el pilum, borrar la raya */
  const corta = () => { const d = dedo; dedo = null; clearTimeout(reloj); if (d && d.manten) gesto('suelta-parar'); if (d && d.dibuja) oculta(); };
  addEventListener('pointermove', e => {
    if (!dedo || e.pointerId !== dedo.id) return;
    if (!libre()) { corta(); return; }
    dedo.cx = e.clientX; dedo.cy = e.clientY;
    if (Math.hypot(e.clientX - dedo.x, e.clientY - dedo.y) >= ARRASTRA_PX) dedo.lejos = true;
    if (dedo.modo === 'duelo') {
      if (!dedo.hecho && e.clientY - dedo.y < -EMPUJA_PX) { dedo.hecho = true; if (dedo.manten) { dedo.manten = false; gesto('suelta-parar'); } gesto('empujar'); }
      return;
    }
    if (dedo.fa && !dedo.dibuja) {   /* FU3b: gestos de la falange (deslizar hacia abajo, llevar al hueco): no dibujan */
      const fa = fal(), dx = e.clientX - dedo.x, dy = e.clientY - dedo.y;
      if (fa && fa.bajar && !dedo.hecho && dy > DESLIZA_PX && Math.abs(dx) < dy * 0.6 && e.timeStamp - dedo.t0 < DESLIZA_MS) { dedo.hecho = true; gesto('bajar'); }
      if (fa && fa.anillo && !dedo.hecho && Math.hypot(e.clientX - fa.anillo.x, e.clientY - fa.anillo.y) < Math.max(ANILLO_PX, fa.anillo.r)) { dedo.hecho = true; gesto('cerrar'); }
      if (dedo.hecho || (fa && (fa.anillo || (fa.bajar && dy > 8 && Math.abs(dx) < dy * 0.6) || fa.empuje))) return;   /* FU3c: con empuje, mantener no dibuja */
    }
    if (dedo.hecho && dedo.fa) return;
    if (dedo.pilum) return;
    if (!dedo.dibuja && !dedo.lejos) return;
    const p = suelo(e.clientX, e.clientY); if (!p) return;
    if (!dedo.p0) dedo.p0 = p;
    dedo.dibuja = true; dedo.p1 = p; muestra(dedo.p0, p, haciaDonde(dedo.p0, p), true);
  });
  const suelta = e => {
    alza(e);
    if (!dedo || e.pointerId !== dedo.id) return;
    const d = dedo; dedo = null; clearTimeout(reloj);
    if (d.modo === 'duelo') {
      if (d.manten) gesto('suelta-parar');
      else if (!d.hecho && !d.lejos) gesto('estocada');   /* un toque corto: si fuese largo, ya sería «parar» */
      return;
    }
    if (d.fa && !d.dibuja) {   /* FU3b: un toque sobre el anillo del hueco, o un gesto ya hecho: no hay raya */
      const fa = fal();
      if (!d.hecho && fa && fa.anillo && Math.hypot(e.clientX - fa.anillo.x, e.clientY - fa.anillo.y) < Math.max(ANILLO_PX, fa.anillo.r)) gesto('cerrar');
      return;
    }
    if (d.pilum) { gesto('pilum-suelta', suelo(e.clientX, e.clientY)); return; }
    if (d.dibuja && Math.hypot(d.p1.x - d.p0.x, d.p1.z - d.p0.z) >= MIN_M) alSoltar(d.p0, d.p1); else if (d.dibuja) oculta();
  };
  addEventListener('pointerup', suelta); addEventListener('pointercancel', e => { alza(e); if (dedo && e.pointerId === dedo.id) corta(); });
  return { raya, muestra, oculta, activo: () => !!(dedo && dedo.dibuja), dedoEn: () => dedo ? { x: dedo.cx, y: dedo.cy } : null };
}
