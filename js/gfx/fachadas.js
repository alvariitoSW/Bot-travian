/* AQVILA — fachadas de la ciudad 3D (CN15a): puestos con toldo en la plaza del foro y acabados por barrio (ropa tendida,
   toldos pequeños, macetas). Módulo ÚNICO: city3d.js solo lo llama (iniciar, reiniciar, actualizar).
   Arte: props de 0 A.D. (Wildfire Games, CC BY-SA 3.0): prop_mesa, prop_cesto, prop_sacos, prop_vaso, prop_caja y el puesto cartaginés
   prop_puesto_cart. Postes, toldos, cuerdas y paños son cajas por código con color por vértice, en una sola malla y SIN sombra.
   No toca la lógica: lee E (js/ciudad.js) y no guarda nada. Todo el azar sale de ctx.azar(semilla): dos cargas dibujan lo mismo.
   Se rehace solo cuando cambia E.rev. Con una constante en false no se crea nada (cero triángulos). */
import { THREE } from './models.js';

export const FACHADAS_PUESTOS = true;
export const FACHADAS_TOLDOS = true;
export const FACHADAS_ROPA = true;
export const FACHADAS_BARRIO = true;
export const N_PUESTOS_MAX = 14;                  // puestos en la plaza (los lee gobierno/arte.mjs)
export const N_TOLDOS_MAX = 60;                   // toldos pequeños sobre puertas de casas
export const N_ROPA_MAX = 40;                     // tendederos con paños
export const N_MACETAS_MAX = 40;                  // macetas (prop_vaso pequeño) en barrios ricos
const CAM_PUESTOS = 900, CAM_DETALLE = 480;       // a más distancia de cámara no se dibuja: puestos / detalle de casas

/* colores apagados: nada chillón */
const TOLDOS = ['#9a4a3a', '#b88a4a', '#5f7482', '#d8c9a4', '#8a6b45'];
const PANOS = ['#cfc4a8', '#a8553f', '#7d8f9a', '#b59a5c', '#8c7a62'];
const CREMA = '#d8c9a4', MADERA = '#6b5238', CUERDA = '#8a7a5c';

let C = null;                                      // contexto de city3d: { scene, altura, azar, pieza, lote, matriz, Bulto, matBulto, pedirReparto }
let rev = -1, mallaP = null, mallaC = null, LP = null, listaP = {}, listaC = {}, verP = true, verC = true;
const CLAVES = ['prop_mesa', 'prop_cesto', 'prop_sacos', 'prop_vaso', 'prop_caja', 'prop_puesto_cart'];

export function iniciar(ctx) { C = ctx; }
/* al cambiar de ciudad */
export function reiniciar() { quita(); rev = -1; listaP = {}; listaC = {}; if (LP) aplicar(); }

function quita() {
  for (const m of [mallaP, mallaC]) if (m) { C.scene.remove(m); m.geometry.dispose(); }
  mallaP = mallaC = null;
}
/* un lote por pieza, creado una sola vez y solo si algo está encendido; si falta la pieza, city3d devuelve uno vacío */
function lotes() {
  if (LP) return LP;
  LP = {};
  for (const k of CLAVES) LP[k] = C.lote(k, k === 'prop_vaso' ? N_PUESTOS_MAX + N_MACETAS_MAX : k === 'prop_puesto_cart' ? N_PUESTOS_MAX : N_PUESTOS_MAX * 2, { sinTeja: true, sombra: false });
  return LP;
}
/* deja en cada lote lo que toca según la distancia de cámara (se llama al reconstruir y al cruzar un umbral) */
function aplicar() {
  const L = lotes();
  for (const k of CLAVES) L[k].poner([...(verP ? listaP[k] || [] : []), ...(verC ? listaC[k] || [] : [])]);
  if (mallaP) mallaP.visible = verP;
  if (mallaC) mallaC.visible = verC;
  C.pedirReparto();
}

/* ---------- geometría auxiliar ---------- */
/* de un desplazamiento local (lx, lz) a mundo, para un objeto girado th sobre Y (la misma convención de three.js) */
const rot = (cx, cz, th, lx, lz) => [cx + lx * Math.cos(th) + lz * Math.sin(th), cz - lx * Math.sin(th) + lz * Math.cos(th)];
const poner = (lista, k, m) => { (lista[k] = lista[k] || []).push({ m }); };

/* puesto de mercado de la plaza: cuatro postes, toldo a rayas inclinado y mesa con género. th = hacia dónde mira la parte delantera (+z local) */
function puesto(B, lista, x, z, th, rnd, punico) {
  const alt = C.altura, M = C.matriz;
  if (punico) {                                    // puesto cartaginés de 0 A.D.: ya lleva su toldo
    poner(lista, 'prop_puesto_cart', M(x, alt(x, z) - 0.05, z, th, 1.6));
    const [cx, cz] = rot(x, z, th, -1.6, 2.4); poner(lista, 'prop_cesto', M(cx, alt(cx, cz), cz, th + rnd() * 3, 1.0));
    const [vx, vz] = rot(x, z, th, 1.7, 2.6); poner(lista, 'prop_vaso', M(vx, alt(vx, vz), vz, rnd() * 6, 0.55));
    return;
  }
  const cols = [[-1.7, -1.3], [1.7, -1.3], [-1.7, 1.3], [1.7, 1.3]].map(([a, b]) => rot(x, z, th, a, b));
  const yb = Math.min(...cols.map(p => alt(p[0], p[1])));
  /* postes: los de atrás más altos, para que el toldo caiga hacia el cliente */
  cols.forEach((p, i) => { const top = yb + (i < 2 ? 2.85 : 2.17), h = top - (yb - 0.35); B.caja(0.16, h, 0.16, p[0], (top + yb - 0.35) / 2, p[1], MADERA); });
  const col = TOLDOS[Math.floor(rnd() * TOLDOS.length)], par = col === CREMA ? TOLDOS[0] : CREMA;
  for (let i = 0; i < 4; i++) { const [tx, tz] = rot(x, z, th, -1.5 + i, 0); B.caja(1, 0.08, 3.5, tx, yb + 2.52, tz, i % 2 ? par : col, th, 0.2, 0); }
  const yc = alt(x, z), m = rot(x, z, th, 0, 0);
  poner(lista, 'prop_mesa', M(m[0], yc - 0.05, m[1], th, 0.55));
  const [ax, az] = rot(x, z, th, -0.75, 0), [bx, bz] = rot(x, z, th, 0.75, 0);
  poner(lista, rnd() < 0.5 ? 'prop_cesto' : 'prop_caja', M(ax, yc + 0.86, az, th + rnd() * 3, 0.8));
  poner(lista, rnd() < 0.5 ? 'prop_vaso' : 'prop_caja', M(bx, yc + 0.86, bz, rnd() * 6, rnd() < 0.5 ? 0.45 : 0.7));
  const [sx, sz] = rot(x, z, th, -2.2, 0.1); poner(lista, rnd() < 0.5 ? 'prop_sacos' : 'prop_cesto', M(sx, alt(sx, sz), sz, th + 1.2, 0.6));
}

/* ---------- (a) puestos en la parte libre de la plaza ---------- */
function puestos(E, B, lista) {
  if (!E.foro) return;
  const f = E.foro, alt = C.altura, st = C.pieza('foro'), bb = st ? st.bb : [-18.3, 0, -18.1, 18.3, 19.3, -0.25];
  /* huella del edificio del foro, como la pone city3d: centro 8 hacia atrás, giro PI/2 - ang, escala 0.78 */
  const c0x = f.x - Math.cos(f.ang) * 8, c0z = f.z - Math.sin(f.ang) * 8, g = Math.PI / 2 - f.ang, cg = Math.cos(g), sg = Math.sin(g), K = 0.78, M = 5.5;
  const dentroForo = (x, z) => { const dx = x - c0x, dz = z - c0z, px = dx * cg - dz * sg, pz = dx * sg + dz * cg; return px > bb[0] * K - M && px < bb[3] * K + M && pz > bb[2] * K - M && pz < bb[5] * K + M; };
  const merc = E.edificios.filter(e => e.tipo === 'mercado' && !e.obra && !e.ruina);
  const quiero = Math.min(N_PUESTOS_MAX, 2 + merc.reduce((n, e) => n + 2 + (e.mejora || 0), 0));
  const rnd = C.azar((E.semilla || 1) * 131 + 17), yf = alt(f.x, f.z), punico = E.cultura === 'cart';
  const casas = E.parcelas.filter(l => l.casa && !l.fuera);
  const cand = [];
  for (const r of [20, 26, 32, 38, 44]) { const n = 12 + Math.round(r / 4); for (let i = 0; i < n; i++) { const a = (i + rnd() * 0.6) / n * Math.PI * 2; cand.push([f.x + Math.cos(a) * r, f.z + Math.sin(a) * r, rnd()]); } }
  cand.sort((a, b) => (Math.hypot(a[0] - f.x, a[1] - f.z) / 20 + a[2] * 1.8) - (Math.hypot(b[0] - f.x, b[1] - f.z) / 20 + b[2] * 1.8));   // cerca del foro primero, con algo de desorden
  const puestos = [];
  for (const [x, z] of cand) {
    if (puestos.length >= quiero) break;
    if (dentroForo(x, z) || Math.abs(alt(x, z) - yf) > 3) continue;                                                       // no dentro del foro ni en una ladera
    const ys = [[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([a, b]) => alt(x + a, z + b)); if (Math.max(...ys) - Math.min(...ys) > 1.5) continue;
    if (E.edificios.some(e => Math.hypot(e.x - x, e.z - z) < Math.max(e.w || 16, e.d || 16) * 0.5 + 5)) continue;
    if (casas.some(l => Math.hypot(l.x - x, l.z - z) < 11)) continue;
    if (puestos.some(p => Math.hypot(p[0] - x, p[1] - z) < 7)) continue;
    puestos.push([x, z]);
  }
  for (const [x, z] of puestos) puesto(B, lista, x, z, Math.atan2(f.x - x, f.z - z), rnd, punico);
  return puestos.length;
}

/* ---------- (b) fachadas por barrio ---------- */
function barrios(E, B, lista) {
  if (!E.fundada) return;
  const f = E.foro || { x: 0, z: 0 }, alt = C.altura, M = C.matriz;
  const de = t => E.edificios.filter(e => e.tipo === t && !e.obra && !e.ruina), merc = de('mercado'), fuen = de('fuente'), temp = de('templo');
  const cerca = (l, lis, r) => lis.some(e => Math.hypot(e.x - l.x, e.z - l.z) < r);
  const casas = E.parcelas.filter(l => l.casa && !l.fuera && !l.casa.ruina && !l.casa.arde).sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z));
  let nT = 0, nR = 0, nM = 0;
  for (const l of casas) {
    const b = E.barrios && E.barrios[l.barrio], bn = (b && b.nivel) || 1, c = l.casa.nivel || 1, rnd = C.azar(l.id * 977 + 13);   // azar por parcela: no cambia al aparecer otras casas
    const r1 = rnd(), r2 = rnd(), r3 = rnd();
    const ct = Math.cos(l.ang), st = Math.sin(l.ang), fx = st * l.lado, fz = -ct * l.lado;                        // hacia la calle (la casa mira a la calle)
    const near = cerca(l, merc, 70) || cerca(l, fuen, 40) || cerca(l, temp, 60), pobre = l.arrabal || bn <= 2;
    const y0 = alt(l.x, l.z), th = Math.atan2(fx, fz);
    if (FACHADAS_ROPA && pobre && r1 < 0.4 && nR < N_ROPA_MAX) {                                                   // tendedero: cuerda y 1-3 paños
      nR++; const off = c === 1 ? 5.6 : 7.9, yc = y0 + (c === 1 ? 3.2 : 4.3), mx = l.x + fx * off, mz = l.z + fz * off, n = 1 + Math.floor(r2 * 3);
      B.caja(10, 0.07, 0.07, mx, yc, mz, CUERDA, -l.ang, 0, 0.03);
      for (let i = 0; i < n; i++) { const u = (n === 1 ? 0 : (i / (n - 1) - 0.5) * 6) + (r3 - 0.5), px = mx + ct * u, pz = mz + st * u; B.caja(1.2, 1.5, 0.06, px, yc - 0.8, pz, PANOS[Math.floor(rnd() * PANOS.length)], -l.ang, 0, (rnd() - 0.5) * 0.12); }
    }
    if (FACHADAS_TOLDOS && (bn >= 3 || near) && c >= 2 && r2 < 0.55 && nT < N_TOLDOS_MAX) {                          // toldo pequeño sobre la puerta
      nT++; const col = TOLDOS[Math.floor(rnd() * TOLDOS.length)], par = col === CREMA ? TOLDOS[0] : CREMA, mx = l.x + fx * 7.1, mz = l.z + fz * 7.1;
      for (let i = 0; i < 3; i++) { const u = (i - 1) * 1.15; B.caja(1.15, 0.07, 2.1, mx + ct * u, y0 + 3.9, mz + st * u, i % 2 ? par : col, th, 0.28, 0); }
    }
    if (FACHADAS_BARRIO && bn >= 4 && c >= 3 && nM + 2 <= N_MACETAS_MAX) {                                         // macetas a ambos lados de la puerta
      nM += 2; for (const s of [-1, 1]) { const px = l.x + fx * 8.2 + ct * 1.7 * s, pz = l.z + fz * 8.2 + st * 1.7 * s; poner(lista, 'prop_vaso', M(px, alt(px, pz), pz, rnd() * 6, 0.4)); }
    }
  }
}

/* ---------- reconstrucción y bucle ---------- */
function reconstruir(E) {
  quita(); listaP = {}; listaC = {};
  const hay = FACHADAS_PUESTOS || FACHADAS_TOLDOS || FACHADAS_ROPA || FACHADAS_BARRIO;
  if (!hay || !E || !E.fundada) { if (LP) aplicar(); return; }
  if (FACHADAS_PUESTOS) { const B = new C.Bulto(); puestos(E, B, listaP); mallaP = malla(B); }
  if (FACHADAS_BARRIO || FACHADAS_TOLDOS || FACHADAS_ROPA) { const B = new C.Bulto(); barrios(E, B, listaC); mallaC = malla(B); }
  aplicar();
}
/* una sola malla por grupo, sin sombra */
function malla(B) {
  if (!B.p.length) return null;
  const m = new THREE.Mesh(B.geo(), C.matBulto); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; C.scene.add(m); return m;
}
/* E = estado de la ciudad; camD = distancia de la cámara. Se rehace solo si cambia E.rev */
export function actualizar(E, camD) {
  if (!C || !E) return;
  let sucio = false;
  if (E.rev !== rev) { rev = E.rev; reconstruir(E); sucio = true; }
  const p = camD < CAM_PUESTOS, d = camD < CAM_DETALLE;
  if (p !== verP || d !== verC) { verP = p; verC = d; if (!sucio) aplicar(); }
}
