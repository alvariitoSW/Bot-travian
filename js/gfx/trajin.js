/* AQVILA — trajín de la ciudad 3D (CN15b-A): cuadrilla de obra y recuas de mulas. Módulo ÚNICO: city3d.js solo lo llama.
   Solo dibujo: lee E (js/ciudad.js), city.obras y, de forma opcional, window.Game (rutasDeCiudad, state.t). No guarda nada.
   Cuadrilla: hasta 3 obreros por obra (tope N_OBREROS_MAX), sin obreros si la obra está en pausa. De cerca son la ciudadana real
   de 0 A.D. (Wildfire Games, CC BY-SA 3.0, como en vida.js); de lejos, la figura ligera. Junto a cada obra, un montón de material
   que baja con el avance. Recuas: mulas hechas POR CÓDIGO (cajas con color por vértice; las patas se mueven en el shader), sin arte nuevo.
   Todo el azar sale de ctx.azar(semilla): dos cargas de la misma partida dibujan lo mismo. Sin sombras. Con las constantes en false no se crea nada. */
import { THREE } from './models.js';
import * as UN from './units.js';
import * as CI from '../ciudad.js';

export const TRAJIN_CUADRILLAS = true;
export const TRAJIN_RECUAS = true;
export const N_OBREROS_MAX = 12;
export const N_RECUAS = 3;
export const MULAS_POR_RECUA = 4;
const OBREROS_POR_OBRA = 3, N_MONTONES = 6, CAM_REAL = 320, CAM_LIGERA = 1000, CAM_RECUAS = 1000, VEL_RECUA = 1.2, SEP_MULAS = 3.4, ESC_FIGURA = 0.75;

let C = null, estado = null, rev = -1, tAcc = 0, tRecalc = 0;
let tabla = null;                                  // 64 valores fijos de ctx.azar: fases, ángulos, colores
let figR = null, figL = null, unidad = null, montones = null, malasM = [], geos = new Map(), nRecuas = 0, rec = [], reloj = { value: 0 }, matMula = null;
const _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const _o = { x: 0, z: 0, ang: 0 };
const matriz = (x, y, z, yaw, pitch, k) => _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(pitch, yaw, 0)), _s.set(k, k, k));

/* posiciones vivas (solo lectura para el sonido, CN15c) */
const obr = Array.from({ length: N_OBREROS_MAX }, () => ({ x: 0, z: 0, y: 0, yaw: 0, obra: -1, ph: 0 })); let nObr = 0;
const arr = Array.from({ length: N_RECUAS }, () => ({ x: 0, z: 0, y: 0, ang: 0, n: 0, carga: '', mulas: Array.from({ length: MULAS_POR_RECUA }, () => ({ x: 0, z: 0, y: 0, ang: 0 })) })); let nArr = 0;
export function obreros() { return obr.slice(0, nObr); }
export function recuas() { return arr.slice(0, nArr); }

export function iniciar(ctx) { C = ctx; tabla = null; }
/* al cambiar de ciudad */
export function reiniciar() {
  rev = -1; estado = null; nObr = 0; nArr = 0; nRecuas = 0; rec = []; tRecalc = 0;
  if (figR) figR.count = 0; if (figL) figL.count = 0; if (montones) montones.count = 0; for (const m of malasM) m.visible = false;
}

/* ---------- ayudantes ---------- */
function tablaAzar() { if (!tabla) { const r = C.azar(15); tabla = Array.from({ length: 64 }, () => r()); } return tabla; }
function gameT() { try { const G = typeof window !== 'undefined' && window.Game; return G && G.state && isFinite(G.state.t) ? G.state.t : null; } catch (_) { return null; } }
function ponM(M, o, x, y, z, yaw, pitch, k) { matriz(x, y, z, yaw, pitch, k).toArray(M, o); }

/* ---------- figuras: ciudadana real (cerca) o ligera (lejos), UNA malla instanciada cada una ---------- */
function mallasFiguras() {
  if (figR || figL) return;
  unidad = UN.getUnit('ciudadana'); if (!unidad) return;
  const cap = N_OBREROS_MAX + N_RECUAS, geo = UN.instancedGeometry(unidad, cap);
  figR = new THREE.InstancedMesh(geo, UN.unitMaterialReal(unidad, '#b9aa8c'), cap); figL = new THREE.InstancedMesh(UN.lightGeometry(unidad, '#b9aa8c'), UN.lightMaterial(), cap);
  for (const m of [figR, figL]) { m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); C.scene.add(m); }
}
/* ---------- montones de material: cajas de color, su altura baja con el avance ---------- */
const COL_MAT = ['#a58a5c', '#9a9084', '#b8a070', '#7d6a4c', '#c0b08a'];
function mallaMontones() {
  if (montones) return;
  montones = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#ffffff' }), N_MONTONES * 2);
  montones.count = 0; montones.frustumCulled = false; montones.castShadow = false; montones.receiveShadow = false; montones.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const T = tablaAzar(); for (let i = 0; i < N_MONTONES * 2; i++) montones.setColorAt(i, _c.set(COL_MAT[Math.floor(T[(i * 5 + 3) % 64] * COL_MAT.length)]));
  C.scene.add(montones);
}

/* ---------- cuadrilla ---------- */
const nPorObra = new Int8Array(N_MONTONES + 8);
function cuadrilla(E, city, camD, t, listo) {
  nObr = 0; const obras = city && city.obras, T = tablaAzar(), tj = gameT();
  const act = obras && obras.length ? obras : null;
  if (!act) { if (montones) montones.count = 0; if (figR) figR.count = 0; if (figL) figL.count = 0; return; }
  mallaMontones(); mallasFiguras();
  const nO = Math.min(act.length, N_MONTONES);
  /* reparto por turnos (1, 2, 3 obreros por obra) hasta el tope; las obras en pausa no reciben */
  for (let i = 0; i < nO; i++) nPorObra[i] = 0;
  let total = 0;
  for (let ronda = 0; ronda < OBREROS_POR_OBRA; ronda++) for (let i = 0; i < nO && total < N_OBREROS_MAX; i++) { const o = act[i]; if (o && !o.pausa && isFinite(o.x) && isFinite(o.z)) { nPorObra[i]++; total++; } }
  let im = 0; const MM = montones.instanceMatrix.array;
  for (let i = 0; i < nO; i++) {
    const o = act[i]; if (!o || !isFinite(o.x) || !isFinite(o.z)) continue;
    const av = tj === null ? 0.5 : Math.max(0, Math.min(1, (tj - o.t0) / Math.max(1e-6, o.t1 - o.t0)));
    const a0 = T[(i * 7 + 1) % 64] * Math.PI * 2, n = nPorObra[i], D0 = CI.EDIF[o.pieza], rb = D0 ? Math.hypot(D0.w, D0.d) / 2 : 0;      // rb: del centro de la obra a su esquina, para quedar FUERA del edificio
    /* montón de material a un lado de la obra: baja con el avance */
    for (let j = 0; j < 2; j++) { const a = a0 + 2.4 + j * 0.9, r = rb + 3.2 + j * 0.8, x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r, h = Math.max(0.12, (0.5 + 0.9 * (1 - av)) * (j ? 0.7 : 1));
      _m.compose(_p.set(x, C.altura(x, z) + h / 2, z), _q.setFromEuler(_e.set(0, a, 0)), _s.set(1.5, h, 1.1)).toArray(MM, im * 16); im++; }
    for (let k = 0; k < n && nObr < N_OBREROS_MAX; k++) {
      const a = a0 + k / Math.max(1, n) * Math.PI * 2 + T[(i * 3 + k) % 64] * 0.6, r = rb + 0.8 + 0.7 * T[(i * 5 + k * 2) % 64], b = obr[nObr++];
      b.x = o.x + Math.cos(a) * r; b.z = o.z + Math.sin(a) * r; b.y = C.altura(b.x, b.z); b.yaw = Math.atan2(o.x - b.x, o.z - b.z); b.obra = i; b.ph = T[(i * 11 + k * 3 + 2) % 64] * 6;
    }
  }
  montones.count = im; montones.visible = camD < CAM_LIGERA; montones.instanceMatrix.needsUpdate = true; if (montones.instanceColor) montones.instanceColor.needsUpdate = true;
}

/* ---------- mulas: cuerpo por código, patas movidas en el shader ---------- */
const PELAJES = ['#6e5a45', '#7d7468', '#5b4a3a'];
function parte(P, g, col, pata) {                       // añade una geometría al montón; pata = [amplitud, fase, pivX, pivY]
  const ng = g.index ? g.toNonIndexed() : g, p = ng.attributes.position, n = ng.attributes.normal; _c.set(col);
  for (let i = 0; i < p.count; i++) { P.pos.push(p.getX(i), p.getY(i), p.getZ(i)); P.nor.push(n.getX(i), n.getY(i), n.getZ(i)); P.col.push(_c.r, _c.g, _c.b); P.pat.push(...(pata || [0, 0, 0, 0])); }
}
const caja = (P, x0, x1, y0, y1, z0, z1, col, pata) => parte(P, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), col, pata);
function geoMula(carga, pel) {
  const clave = carga + pel; if (geos.has(clave)) return geos.get(clave);
  const P = { pos: [], nor: [], col: [], pat: [] }, cu = PELAJES[pel % PELAJES.length], osc = _c.set(cu).multiplyScalar(0.72).getStyle();
  caja(P, -1.1, 1.1, 0.95, 1.65, -0.36, 0.36, cu); caja(P, 0.95, 1.45, 1.35, 2.1, -0.15, 0.15, cu); caja(P, 1.35, 1.95, 1.75, 2.15, -0.18, 0.18, osc); caja(P, -1.28, -1.1, 1.05, 1.55, -0.05, 0.05, osc);
  for (const [x, z, f] of [[0.85, -0.22, 0], [0.85, 0.22, Math.PI], [-0.85, -0.22, Math.PI], [-0.85, 0.22, 0]]) caja(P, x - 0.1, x + 0.1, 0, 0.95, z - 0.1, z + 0.1, osc, [0.5, f, x, 0.95]);
  if (carga === 'sacos') { for (const s of [-1, 1]) caja(P, -0.4, 0.4, 1.1, 1.75, s * 0.4 + (s > 0 ? 0 : -0.35), s * 0.4 + (s > 0 ? 0.35 : 0), '#c8b88a'); caja(P, -0.35, 0.35, 1.65, 2.05, -0.25, 0.25, '#b8a878'); }
  else if (carga === 'vasijas') { for (const s of [-1, 1]) parte(P, new THREE.CylinderGeometry(0.3, 0.25, 0.65, 8, 1).translate(0, 1.45, s * 0.58), '#a8643c'); parte(P, new THREE.CylinderGeometry(0.28, 0.24, 0.6, 8, 1).translate(0, 1.95, 0), '#b8744a'); }
  else { for (const x of [-0.45, 0.45]) parte(P, new THREE.CylinderGeometry(0.2, 0.2, 1.7, 6, 1).rotateX(Math.PI / 2).translate(x, 1.85, 0), '#7a5a3a'); parte(P, new THREE.CylinderGeometry(0.2, 0.2, 1.7, 6, 1).rotateX(Math.PI / 2).translate(0, 2.2, 0), '#8a6a46'); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(P.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3)); g.setAttribute('aPata', new THREE.Float32BufferAttribute(P.pat, 4));
  g.computeBoundingSphere(); g.userData.tris = P.pos.length / 9; geos.set(clave, g); return g;
}
function materialMula() {
  if (matMula) return matMula;
  matMula = new THREE.MeshLambertMaterial({ vertexColors: true });
  matMula.onBeforeCompile = sh => {
    sh.uniforms.uT = reloj;
    sh.vertexShader = 'attribute vec4 aPata;\nuniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3(position);\nif (aPata.x > 0.0) { float a = aPata.x * sin(uT * 5.0 + aPata.y + float(gl_InstanceID) * 0.9); vec2 d = transformed.xy - aPata.zw; float cs = cos(a), sn = sin(a); transformed.xy = aPata.zw + vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y); }');
  };
  matMula.customProgramCacheKey = () => 'aqvila-mula';
  return matMula;
}
function mallaMula(i, carga, pel) {
  let m = malasM[i], g = geoMula(carga, pel);
  if (!m) { m = new THREE.InstancedMesh(g, materialMula(), MULAS_POR_RECUA); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); C.scene.add(m); malasM[i] = m; }
  else if (m.geometry !== g) m.geometry = g;
  return m;
}

/* recorrido: la vía entera de la puerta hacia dentro; ida y vuelta */
function preparaRuta(v, desdeInicio) {
  const p = desdeInicio ? v.p : v.p.slice().reverse(), cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  return { p, cum, largo: cum[cum.length - 1] };
}
function sobreRuta(r, s, lat, atras) {                   // _o = posición (con desplazamiento lateral) y rumbo en la ruta
  const p = r.p, cum = r.cum; let k = 0; while (k < p.length - 2 && cum[k + 1] < s) k++;
  const a = p[k], b = p[k + 1], l = (cum[k + 1] - cum[k]) || 1, u = Math.max(0, Math.min(1, (s - cum[k]) / l)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  _o.x = a[0] + (b[0] - a[0]) * u - Math.sin(ang) * lat; _o.z = a[1] + (b[1] - a[1]) * u + Math.cos(ang) * lat; _o.ang = atras ? ang + Math.PI : ang;
}
const hechos = (E, t) => E.edificios.filter(e => e.tipo === t && !e.obra && !e.ruina);
function reparteRecuas(E, city) {
  rec = []; const vs = (E.vias || []).filter(v => v.p && v.p.length > 1 && v.largo > 40), pu = E.puertas || [];
  if (!E.fundada || !vs.length || !pu.length || !E.foro) return;
  let rutas = 0; try { const G = typeof window !== 'undefined' && window.Game; const id = E.id !== undefined ? E.id : city && city.id !== undefined ? city.id : (typeof window !== "undefined" && window.UI ? window.UI.city : undefined); if (G && G.rutasDeCiudad && id !== undefined) rutas = G.rutasDeCiudad(id) || 0; } catch (_) { rutas = 0; }
  const merc = hechos(E, 'mercado').length, n = Math.min(N_RECUAS, 1 + Math.min(2, rutas + merc)), T = tablaAzar(), usadas = new Set();
  const ase = hechos(E, 'aserradero'), otro = [...hechos(E, 'muelle'), ...hechos(E, 'almacen'), ...hechos(E, 'cantera'), ...hechos(E, 'granja'), ...hechos(E, 'mercado')];
  for (let r = 0; r < n; r++) {
    let dest = E.foro, carga = r % 2 ? 'vasijas' : 'sacos';
    if (r === 1 && ase.length) { dest = ase[0]; carga = 'troncos'; } else if (r >= 1 && otro.length) dest = otro[(r - 1) % otro.length]; else if (r === 2 && ase.length) { dest = ase[0]; carga = 'troncos'; }
    let mejor = null, ms = 1e18;
    for (const v of vs) { if (usadas.has(v)) continue; const a = v.p[0], b = v.p[v.p.length - 1];
      for (const ini of [true, false]) { const s0 = ini ? a : b, s1 = ini ? b : a; let dp = 1e18; for (const q of pu) dp = Math.min(dp, Math.hypot(q.x - s0[0], q.z - s0[1]));
        const sc = Math.hypot(dest.x - s1[0], dest.z - s1[1]) + dp * 0.3 + T[(v.id * 7 + r) % 64] * 4; if (sc < ms) { ms = sc; mejor = { v, ini }; } } }
    if (!mejor) { const v = vs[r % vs.length]; mejor = { v, ini: true }; }
    usadas.add(mejor.v); const ru = preparaRuta(mejor.v, mejor.ini);
    rec.push({ ru, carga, pel: Math.floor(T[(r * 9 + 4) % 64] * 3), d: T[(r * 13 + 6) % 64] * ru.largo * 2, lat: 0.9 * (r % 2 ? -1 : 1), mf: null });
  }
}

function recuasDibuja(E, city, camD, dt, listo) {
  tRecalc += dt;
  if (E.rev !== rev || tRecalc > 3) { if (E.rev !== rev || nRecuas !== recuasQuiero(E, city)) { rev = E.rev; reparteRecuas(E, city); nRecuas = rec.length; } tRecalc = 0; }
  nArr = 0; const ver = camD < CAM_RECUAS && listo;
  for (let i = 0; i < malasM.length; i++) if (malasM[i]) malasM[i].visible = false;
  if (!rec.length) { return; }
  mallasFiguras();
  for (let i = 0; i < rec.length; i++) {
    const r = rec[i], m = mallaMula(i, r.carga, r.pel), L2 = r.ru.largo * 2, A = m.instanceMatrix.array; r.d = (r.d + VEL_RECUA * dt) % L2; const a = arr[nArr++]; a.carga = r.carga; a.n = MULAS_POR_RECUA;
    for (let k = 0; k < MULAS_POR_RECUA; k++) {
      let pp = (r.d - k * SEP_MULAS) % L2; if (pp < 0) pp += L2; const atras = pp > r.ru.largo, s = atras ? L2 - pp : pp;
      sobreRuta(r.ru, Math.max(0.01, Math.min(r.ru.largo - 0.01, s)), atras ? -r.lat : r.lat, atras); const y = C.altura(_o.x, _o.z);
      ponM(A, k * 16, _o.x, y, _o.z, -_o.ang, 0, 1); const q = a.mulas[k]; q.x = _o.x; q.z = _o.z; q.y = y; q.ang = _o.ang;
      if (k === 0) { a.x = _o.x; a.z = _o.z; a.y = y; a.ang = _o.ang; }
    }
    m.instanceMatrix.needsUpdate = true; m.count = MULAS_POR_RECUA; m.visible = ver;
  }
}
function recuasQuiero(E, city) {
  let rutas = 0; try { const G = typeof window !== 'undefined' && window.Game; const id = E.id !== undefined ? E.id : city && city.id !== undefined ? city.id : (typeof window !== "undefined" && window.UI ? window.UI.city : undefined); if (G && G.rutasDeCiudad && id !== undefined) rutas = G.rutasDeCiudad(id) || 0; } catch (_) { rutas = 0; }
  return Math.min(N_RECUAS, 1 + Math.min(2, rutas + hechos(E, 'mercado').length));
}

/* ---------- se llama una vez por cuadro desde city3d ---------- */
export function actualizar(E, city, camD, t, dt, listo) {
  if (!C || (!TRAJIN_CUADRILLAS && !TRAJIN_RECUAS)) return;
  if (E !== estado) { reiniciar(); estado = E; }
  if (!E) return;
  dt = Math.min(0.1, dt || 0); tAcc += dt; reloj.value = tAcc;
  if (TRAJIN_CUADRILLAS) cuadrilla(E, city, camD, tAcc, listo); else nObr = 0;
  if (TRAJIN_RECUAS) recuasDibuja(E, city, camD, dt, listo);
  /* figuras (obreros y arrieros): reales de cerca, ligeras de lejos, ocultas muy lejos */
  if (!figR) return;
  const n = nObr + (TRAJIN_RECUAS ? nArr : 0), real = camD < CAM_REAL && listo, ver = camD < CAM_LIGERA && listo && n > 0, M = (real ? figR : figL).instanceMatrix.array, F = figR.geometry.attributes.aFrame;
  figR.count = figL.count = 0; if (!ver) return;
  for (let i = 0; i < nObr; i++) { const b = obr[i], w = tAcc * 3.2 + b.ph;      // martillar / acarrear: sube y baja con una inclinación
    ponM(M, i * 16, b.x, b.y + 0.04 + Math.abs(Math.sin(w)) * 0.1, b.z, b.yaw + Math.sin(w * 0.5) * 0.25, 0.14 + 0.16 * Math.sin(w), ESC_FIGURA); if (real) F.array[i] = UN.frameOf(unidad.clips.idle, tAcc + b.ph); }
  if (TRAJIN_RECUAS) for (let j = 0; j < nArr; j++) { const a = arr[j], k = a.mulas[MULAS_POR_RECUA - 1], i = nObr + j;     // el arriero cierra la fila, a pie
    ponM(M, i * 16, k.x - Math.cos(k.ang) * 1.8 + Math.sin(k.ang) * 0.9, k.y + 0.04, k.z - Math.sin(k.ang) * 1.8 - Math.cos(k.ang) * 0.9, Math.atan2(Math.cos(k.ang), Math.sin(k.ang)) , 0, ESC_FIGURA); if (real) F.array[i] = UN.frameOf(unidad.clips.walk, tAcc * 0.9 + j); }
  const m = real ? figR : figL; m.count = n; m.instanceMatrix.needsUpdate = true; if (real) F.needsUpdate = true;
}
