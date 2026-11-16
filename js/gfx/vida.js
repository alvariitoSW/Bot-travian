/* AQVILA — vida de la ciudad 3D (CN11-A). Módulo ÚNICO de gente, humo, fuego y carros: city3d.js solo lo llama.
   Arte real de 0 A.D. (Wildfire Games, CC BY-SA 3.0): la ciudadana (units.js), prop_carreta y prop_pozo. El humo es un shader por código.
   Se apaga todo con las constantes de abajo. No toca la lógica: lee E (js/ciudad.js) y no guarda nada.
   USO DESDE OTRAS TAREAS (CN8, Q11):
     pedirHumo(x, z, { y, f, col, op, fuego })  -> manojo; columna de humo en un punto. y = altura sobre el suelo, f = tamaño, col = [r,g,b], op = opacidad, fuego = 1 para llama.
     pedirFuego(parcelaOCasa)                    -> manojo; humo negro y dos llamas sobre esa casa (acepta una parcela de E.parcelas, una casa o {x,z}).
     apagar(manojo)                              -> quita lo pedido; apagarTodo() quita todos los pedidos.
   Lo pedido se pierde al cambiar de ciudad (reiniciar) y se redibuja solo cuando cambia E.rev o se pide algo nuevo. */
import { THREE } from './models.js';
import * as UN from './units.js';

export const VIDA_GENTE = true, VIDA_HUMO = true, VIDA_CARROS = true, VIDA_GUARNICION_LIGERA = true;
export const GUARN_REAL_MAX = 50, GUARN_R_IN = 105, GUARN_R_OUT = 135, GUARN_CAP = 130, GUARN_TORRES_MAX = 10;   // topes máximos de la guarnición (los lee gobierno/arte.mjs)
const N_GENTE = 56, N_CARROS = 5, CAM_GENTE = 560, NP = 9;

let C = null;                                       // contexto que pasa city3d: { scene, U, HORIZ, altura, azar, carros (lote), pedirReparto }
let gente = null, humoM = null, carros = [], extras = [], sucio = true, rev = -1, estado = null;
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const matriz = (x, y, z, giro, k) => _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), _s.set(k, k, k));

export function iniciar(ctx) { C = ctx; }
/* al cambiar de ciudad */
export function reiniciar() { quitaHumo(); guQuita(); extras = []; if (gente) gente.l = []; carros = []; rev = -1; estado = null; sucio = true; }
function quitaHumo() { if (humoM) { C.scene.remove(humoM); humoM.geometry.dispose(); humoM = null; } }

/* ---------- peticiones de humo y fuego ---------- */
export function pedirHumo(x, z, o = {}) { const h = { x, z, y: o.y === undefined ? 8 : o.y, f: o.f || 0.75, col: o.col || [0.9, 0.86, 0.8], op: o.op || 0.8, fuego: o.fuego ? 1 : 0 }; extras.push(h); sucio = true; return h; }
export function pedirFuego(c) {
  let l = c; if (c && c.x === undefined && estado) l = estado.parcelas.find(q => q.casa === c) || c; if (!l || l.x === undefined) return null;
  const g = [pedirHumo(l.x, l.z, { y: 2, f: 1.1, col: [0.12, 0.11, 0.1], op: 1.25 }), pedirHumo(l.x - 3, l.z, { y: 0.5, f: 0.3, col: [1.5, 0.42, 0.06], op: 1.3, fuego: 1 }), pedirHumo(l.x + 2, l.z + 2, { y: 0.5, f: 0.24, col: [1.7, 0.7, 0.1], op: 1.3, fuego: 1 })];
  return { grupo: g };
}
export function apagar(h) { if (!h) return; const g = h.grupo || [h]; extras = extras.filter(q => !g.includes(q)); sucio = true; }
export function apagarTodo() { extras = []; sucio = true; }

/* ---------- humo: malla instanciada con shader, sin sombras ---------- */
let matHumo = null, tH = null;
export function tinteHumo(c) { tH = c.clone(); if (matHumo) matHumo.uniforms.uH.value.copy(c); }      // CN15a: niebla del humo con el color de la estación
function material() {
  if (matHumo) return matHumo;
  matHumo = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uH: { value: new THREE.Color(C.HORIZ) }, uTiempo: C.U.uTiempo },
    vertexShader: 'attribute vec4 aPos; attribute vec3 aOp; attribute vec3 aCol; uniform float uTiempo; varying vec2 vUv; varying vec3 vOp; varying vec3 vCol; varying float vD; void main(){ vUv = uv; vOp = aOp; vCol = aCol; vec3 p = aPos.xyz; p.x += sin(uTiempo * 0.7 + aOp.y * 20.0) * aPos.w * 0.12; p.y += sin(uTiempo * 0.5 + aOp.y * 31.0) * aPos.w * 0.1; vec4 mv = modelViewMatrix * vec4(p, 1.0); mv.xy += position.xy * aPos.w * (1.0 + aOp.z * 0.25 * sin(uTiempo * 9.0 + aOp.y * 50.0)); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec2 vUv; varying vec3 vOp; varying vec3 vCol; varying float vD; uniform vec3 uH; void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0; float a = smoothstep(1.0, 0.15, r) * vOp.x; a *= 0.75 + 0.25 * sin(vUv.x * 9.0 + vOp.y * 30.0) * sin(vUv.y * 7.0 + vOp.y * 17.0); vec3 c = vCol * mix(0.84, 1.0, smoothstep(-0.3, 0.4, d.y - d.x)); c = mix(c, uH, (1.0 - exp(-vD * vD * 0.00000011)) * (1.0 - vOp.z)); gl_FragColor = vec4(c, a);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }' });
  if (tH) matHumo.uniforms.uH.value.copy(tH);
  return matHumo;
}
function humo(E) {
  const cols = [], rnd = C.azar(3), Rr = (a, b) => a + (b - a) * rnd();
  for (const l of E.parcelas) { const c = l.casa; if (!c || l.fuera) continue;
    if (c.arde && c.ruina) { cols.push({ x: l.x, z: l.z, y: 2, f: 1.1, col: [0.12, 0.11, 0.1], op: 1.25 }, { x: l.x - 3, z: l.z, y: 0.5, f: 0.3, col: [1.5, 0.42, 0.06], op: 1.3, fuego: 1 }, { x: l.x + 2, z: l.z + 2, y: 0.5, f: 0.24, col: [1.7, 0.7, 0.1], op: 1.3, fuego: 1 }); }
    else if (!c.ruina && l.id % (c.nivel === 1 ? 6 : 4) === 0) cols.push({ x: l.x, z: l.z, y: c.nivel === 1 ? 5 : 8, f: c.nivel === 1 ? 0.5 : 0.75, col: [0.9, 0.86, 0.8], op: 0.8 }); }
  for (const e of E.edificios) if (e.tipo === 'taller' && !e.obra && !e.ruina) cols.push({ x: e.x, z: e.z, y: 11, f: 1.7, col: [0.36, 0.33, 0.31], op: 1 });
  for (const h of extras) cols.push(h);
  quitaHumo(); if (!cols.length) return;
  const n = cols.length * NP, geo = new THREE.InstancedBufferGeometry(), pl = new THREE.PlaneGeometry(1, 1); geo.index = pl.index; geo.setAttribute('position', pl.attributes.position); geo.setAttribute('uv', pl.attributes.uv);
  const a = new Float32Array(n * 4), b = new Float32Array(n * 3), cc = new Float32Array(n * 3); let i = 0;
  for (const c of cols) { const y0 = C.altura(c.x, c.z) + c.y, f = c.f * Rr(0.8, 1.2), fase = Rr(0, 1);
    for (let k = 0; k < NP; k++, i++) { const t = (k + fase) / NP; a.set([c.x + 2 + t * t * 46 * f + Rr(-1, 1), y0 + t * 42 * f, c.z + 1 + t * t * 20 * f + Rr(-1, 1), (2.6 + t * 15) * f * (c.fuego ? 1.6 : 1)], i * 4); b.set([(1 - t) * 0.78 * (0.4 + 0.6 * Math.min(1, t * 5)) * c.op, rnd(), c.fuego ? 1 : 0], i * 3); cc.set(c.col, i * 3); } }
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(a, 4)); geo.setAttribute('aOp', new THREE.InstancedBufferAttribute(b, 3)); geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(cc, 3)); geo.instanceCount = n;
  humoM = new THREE.Mesh(geo, material()); humoM.frustumCulled = false; humoM.renderOrder = 5; C.scene.add(humoM);
}

/* ---------- gente y carros: caminan por E.vias ---------- */
function pos(g) {
  const p = g.v.p, f = g.s / g.v.largo * (p.length - 1), k = Math.min(p.length - 2, Math.floor(f)), u = f - k, a = p[k], b = p[k + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return { x: a[0] + (b[0] - a[0]) * u - Math.sin(ang) * g.lat, z: a[1] + (b[1] - a[1]) * u + Math.cos(ang) * g.lat, yaw: -ang + Math.PI / 2 + (g.vel < 0 ? Math.PI : 0) };
}
function paso(g, dt) { g.s += g.vel * dt; if (g.s < 1) { g.s = 1; g.vel = Math.abs(g.vel); } if (g.s > g.v.largo - 1) { g.s = g.v.largo - 1; g.vel = -Math.abs(g.vel); } }
function repartoGente(E) {
  const u = UN.getUnit('ciudadana'); if (!u) return;
  if (!gente) { const geo = UN.instancedGeometry(u, N_GENTE), im = new THREE.InstancedMesh(geo, UN.unitMaterialReal(u, '#b9aa8c'), N_GENTE); im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); C.scene.add(im); gente = { u, im, fr: geo.attributes.aFrame, l: [] }; }
  const nc = {}, casas = []; for (const l of E.parcelas) if (l.casa && !l.fuera && !l.casa.ruina) { nc[l.via] = (nc[l.via] || 0) + 1; casas.push(l); }
  const vs = E.vias.filter(v => nc[v.id] >= 2 && v.largo > 30 && v.p && v.p.length > 1), rnd = C.azar(E.vias.length * 13 + 1), quiero = Math.min(N_GENTE, Math.floor(casas.length / 2));
  gente.l = gente.l.filter(g => vs.includes(g.v)).slice(0, quiero); let guard = 0;
  while (gente.l.length < quiero && vs.length && guard++ < 300) { const v = vs[Math.floor(rnd() * vs.length)]; gente.l.push({ v, s: rnd() * v.largo, vel: (rnd() < 0.5 ? 1 : -1) * (3.2 + rnd() * 1.6), lat: (rnd() - 0.5) * v.w * 1.1, fase: rnd() * 6, e: 0.7 + rnd() * 0.1 }); }
}
function repartoCarros(E) {
  const vs = E.vias.filter(v => v.largo > 60 && v.p && v.p.length > 1), rnd = C.azar(E.vias.length * 7 + 5), quiero = vs.length ? Math.min(N_CARROS, 3 + Math.floor(E.parcelas.length / 40)) : 0;
  carros = carros.filter(g => vs.includes(g.v)).slice(0, quiero); let guard = 0;
  while (carros.length < quiero && guard++ < 100) { const v = vs[Math.floor(rnd() * vs.length)]; carros.push({ v, s: rnd() * v.largo, vel: (rnd() < 0.5 ? 1 : -1) * (1.6 + rnd() * 0.8), lat: (rnd() - 0.5) * v.w * 0.4, e: 1.6 }); }
}
function moverGente(t, dt, ver) {
  if (!gente) return; const im = gente.im; im.count = ver ? gente.l.length : 0; if (!ver) return; const A = im.instanceMatrix.array;
  gente.l.forEach((g, i) => { paso(g, dt); const p = pos(g); matriz(p.x, C.altura(p.x, p.z) + 0.05, p.z, p.yaw, g.e).toArray(A, i * 16); gente.fr.array[i] = UN.frameOf(gente.u.clips.walk, t * 0.9 + g.fase); });
  im.instanceMatrix.needsUpdate = true; gente.fr.needsUpdate = true;
}
function moverCarros(dt, ver) {
  const lote = C.carros; if (!lote) return;
  if (!ver || !carros.length) { if (lote.n) { lote.poner([]); C.pedirReparto(); } return; }
  lote.poner(carros.map(g => { paso(g, dt); const p = pos(g); return { m: matriz(p.x, C.altura(p.x, p.z), p.z, p.yaw - Math.PI / 2, g.e).clone() }; })); C.pedirReparto();
}

/* ---------- se llama una vez por cuadro desde CityView3D.people ---------- */
export function actualizar(E, camD, t, dt, listo) {
  if (!C) return; if (E !== estado) { reiniciar(); estado = E; }
  if (!E || !E.vias || !E.parcelas) { if (gente) gente.im.count = 0; quitaHumo(); return; }
  const cerca = camD < CAM_GENTE && listo;
  if (rev !== E.rev || sucio) { rev = E.rev; sucio = false;
    if (VIDA_HUMO) humo(E); else quitaHumo();
    if (VIDA_GENTE) repartoGente(E); if (VIDA_CARROS) repartoCarros(E); }
  if (humoM) humoM.visible = camD < 900;
  moverGente(t, dt, VIDA_GENTE && cerca); moverCarros(dt, VIDA_CARROS && camD < 700 && listo);
}

/* ---------- guarnición ligera (CN11-B) ----------
   Misma formación que antes (bloques por tipo ante la puerta principal). Solo los soldados más cercanos a la cámara (radio con
   histéresis, tope GUARN_REAL_MAX) son figuras reales de 0 A.D.; el resto, cajas de lightGeometry. Apagable con VIDA_GUARNICION_LIGERA
   (entonces todos son reales, como antes). Devuelve { x, z, men } (centro de la guarnición) o men = 0 si no hay tropa. */
let gu = null;
const guHash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function guMallas(k, n) {
  const u = UN.getUnit(k); if (!u) return null; const col = C.colorGuarn;
  const cap = VIDA_GUARNICION_LIGERA ? Math.min(n, GUARN_REAL_MAX) : n, g = UN.instancedGeometry(u, cap);
  const real = new THREE.InstancedMesh(g, UN.unitMaterialReal(u, col), cap); real.frustumCulled = false; real.count = 0; real.instanceMatrix.setUsage(THREE.DynamicDrawUsage); C.scene.add(real);
  const m = { u, cap, real, R: real.instanceMatrix.array, A: g.attributes.aFrame, ir: 0, lig: null, L: null, il: 0 };
  if (VIDA_GUARNICION_LIGERA) { const lm = new THREE.InstancedMesh(UN.lightGeometry(u, col), UN.lightMaterial(), n); lm.frustumCulled = false; lm.count = 0; lm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); C.scene.add(lm); m.lig = lm; m.L = lm.instanceMatrix.array; }
  return m;
}
let texT = null;      // CN16p: tierra pisada procedural (canvas pequeño, sin arte nuevo)
function texTierra() { if (texT) return texT; const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'); g.fillStyle = '#7a6444'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 900; i++) { const x = guHash(i * 1.7) * N, y = guHash(i * 3.1 + 9) * N, l = 40 + guHash(i * 5.9) * 40, a = guHash(i * 2.3) * 0.3; g.fillStyle = 'hsla(34,' + (22 + guHash(i) * 14) + '%,' + l + '%,' + a + ')'; const r = 1 + guHash(i * 7.1) * 4; for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { g.beginPath(); g.ellipse(x + dx, y + dy, r * 1.6, r, guHash(i * 4.4) * 3, 0, 7); g.fill(); } }
  for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(40,30,18,' + (0.15 + guHash(i * 8.8) * 0.25) + ')'; g.fillRect(guHash(i * 6.1) * N, guHash(i * 9.7) * N, 1.5, 1.5); }
  texT = new THREE.CanvasTexture(cv); texT.wrapS = texT.wrapT = THREE.RepeatWrapping; texT.colorSpace = THREE.SRGBColorSpace; return texT; }
function guQuita() { if (!gu) return; if (gu.campo) { C.scene.remove(gu.campo); gu.campo.geometry.dispose(); gu.campo.material.dispose(); } for (const m of gu.mallas.values()) { C.scene.remove(m.real); m.real.geometry.dispose(); if (m.lig) { C.scene.remove(m.lig); m.lig.geometry.dispose(); } } gu = null; }
function ponM(M, o, x, y, z, yaw, k) { const c = Math.cos(yaw) * k, s = Math.sin(yaw) * k; M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = k; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1; }
export function guarnicion(E, units, camPos, t, o) {
  const PK = o.PK, f = E && E.foro; let men = 0; for (const k in units) men += units[k];
  const sig = f && men > 0 ? JSON.stringify(units) + '|' + f.x + '|' + f.z + '|' + (E.puertas && E.puertas[0] ? E.puertas[0].x + ',' + E.puertas[0].z : '') + '|' + VIDA_GUARNICION_LIGERA + '|' + (E.muralla ? E.muralla.fase || 0 : 0) + '|' + ((E.surco && E.surco.length) || 0) : '';
  if (!sig) { if (gu) for (const m of gu.mallas.values()) { m.real.count = 0; if (m.lig) m.lig.count = 0; } return { men, x: 0, z: 0, hay: false }; }
  if (!gu || gu.sig !== sig) {
    guQuita(); const pu = E.puertas && E.puertas[0]; let ox = 0, oz = 1, ax = f.x, az = f.z + 46;
    if (pu) { const d = Math.hypot(pu.x - f.x, pu.z - f.z) || 1; ox = (pu.x - f.x) / d; oz = (pu.z - f.z) / d; ax = pu.x + ox * 26; az = pu.z + oz * 26; }
    const lx = -oz, lz = ox, yaw = Math.atan2(ox, oz), ratio = Math.max(1, men / (GUARN_CAP - 14)), blocks = []; let width = 0;
    for (const k in units) { const cls = o.D.UNITS[k].cls, cnt = units[k]; if (cnt <= 0 || !UN.getUnit(k)) continue; const n = cls === 'ele' ? Math.min(cnt, 20) : Math.max(1, Math.round(cnt / ratio)), sp = (cls === 'ele' ? 11 : cls === 'cav' ? 6.4 : 3.5) * PK, cols = cls === 'ele' ? 5 : Math.min(cls === 'cav' ? 8 : 10, Math.max(4, Math.ceil(n / 4))); blocks.push({ k, f: n, sp, cols, w: Math.min(cols, n) * sp }); width += Math.min(cols, n) * sp + 8; }
    const slots = [], mallas = new Map(); let x0 = -width / 2 + 4;
    for (const B of blocks) {
      for (let j = 0; j < B.f; j++) { const cx = j % B.cols, cy = Math.floor(j / B.cols), u = x0 + cx * B.sp + (guHash(j * 3.1) - 0.5) * 0.5, w = cy * B.sp * 1.35 + (guHash(j * 7.7) - 0.5) * 0.5;
        const x = ax + lx * u + ox * w, z = az + lz * u + oz * w; slots.push({ k: B.k, x, z, y: C.altura(x, z) + 0.1, yaw, ph: guHash(j * 1.9 + B.cols) * 6, real: false }); }
      x0 += B.w + 8; }
    /* CN16a: explanada del Campo de Marte (un plano de tierra batida bajo la formación) y guardias en torres y puertas si hay muralla */
    const prof = Math.max(...blocks.map(B => (Math.ceil(B.f / B.cols) - 1) * B.sp * 1.35), 0), hw = width / 2 + 7, w0 = -7, w1 = prof + 7, cg = new THREE.BufferGeometry(), v = [], uv = [];
    const per = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), e = 1 / Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(sn), 4), 0.25), rr = e * (1 + (guHash(i * 5.3) - 0.5) * 0.09); per.push([c * rr * hw, (w0 + w1) / 2 + sn * rr * (w1 - w0) / 2]); }
    const pv = (u, w) => { const x = ax + lx * u + ox * w, z = az + lz * u + oz * w; v.push(x, C.altura(x, z) + 0.35, z); uv.push(x / 26, z / 26); };
    for (let i = 0; i < 28; i++) { const q = per[i], q2 = per[(i + 1) % 28]; pv(0, (w0 + w1) / 2); pv(q[0], q[1]); pv(q2[0], q2[1]); }
    cg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); const campo = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: texTierra(), color: 0xd9c9a6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); campo.frustumCulled = false; C.scene.add(campo);
    const fase = E.muralla ? E.muralla.fase || 0 : 0, mayor = blocks.filter(B => B.cols >= 4 && UN.getUnit(B.k) && o.D.UNITS[B.k].cls !== 'ele' && o.D.UNITS[B.k].cls !== 'cav').sort((p, q) => q.f - p.f)[0];
    if (fase > 0 && mayor && E.surco && E.surco.length) {
      const nG = Math.min(GUARN_TORRES_MAX, Math.max(2, Math.ceil(men / 20))), alto = fase >= 2 ? 9 : 7.5, pts = [];
      for (const q of E.puertas || []) for (const sg of [1, -1]) pts.push([q.x + Math.cos(q.ang) * 9 * sg, q.z + Math.sin(q.ang) * 9 * sg, Math.atan2(q.x - f.x, q.z - f.z)]);
      const S = E.surco, paso = Math.max(1, Math.floor(S.length / 6)); for (let i = 0; i < S.length && pts.length < nG; i += paso) pts.push([S[i][0], S[i][1], Math.atan2(S[i][0] - f.x, S[i][1] - f.z)]);
      pts.slice(0, nG).forEach((q, j) => slots.push({ k: mayor.k, x: q[0], z: q[1], y: C.altura(q[0], q[1]) + alto, yaw: q[2], ph: guHash(j * 2.3) * 6, real: false, torre: true })); }
    const n = {}; for (const s of slots) n[s.k] = (n[s.k] || 0) + 1; for (const k in n) { const m = guMallas(k, n[k]); if (m) mallas.set(k, m); }
    gu = { sig, slots, mallas, ax, az, campo };
  }
  for (const m of gu.mallas.values()) { m.ir = 0; m.il = 0; }
  const RI = GUARN_R_IN * GUARN_R_IN, RO = GUARN_R_OUT * GUARN_R_OUT, TI = 190 * 190, TO = 230 * 230, cand = [];
  for (const s of gu.slots) { const dx = s.x - camPos.x, dy = s.y - camPos.y, dz = s.z - camPos.z, d2 = dx * dx + dy * dy + dz * dz; s.d2 = s.torre ? d2 * 0.2 : d2; s.real = !VIDA_GUARNICION_LIGERA || (s.torre ? (s.real ? d2 < TO : d2 < TI) : (s.real ? d2 < RO : d2 < RI)); if (s.real && VIDA_GUARNICION_LIGERA) cand.push(s); }
  if (VIDA_GUARNICION_LIGERA && cand.length > GUARN_REAL_MAX) { cand.sort((a, b) => a.d2 - b.d2); for (let i = GUARN_REAL_MAX; i < cand.length; i++) cand[i].real = false; }
  for (const s of gu.slots) { const m = gu.mallas.get(s.k); if (!m) continue;
    if (s.real && m.ir < m.cap) { ponM(m.R, m.ir * 16, s.x, s.y, s.z, s.yaw, s.torre ? PK * 1.6 : PK); m.A.array[m.ir] = UN.frameOf(m.u.clips.idle, t + s.ph); m.ir++; }
    else if (m.lig) { ponM(m.L, m.il * 16, s.x, s.y, s.z, s.yaw, s.torre ? PK * 1.6 : PK); m.il++; } }
  for (const m of gu.mallas.values()) { m.real.count = m.ir; m.real.instanceMatrix.needsUpdate = true; m.A.needsUpdate = true; if (m.lig) { m.lig.count = m.il; m.lig.instanceMatrix.needsUpdate = true; } }
  return { men, x: gu.ax, z: gu.az, hay: true, reales: [...gu.mallas.values()].reduce((a, m) => a + m.ir, 0), ligeras: [...gu.mallas.values()].reduce((a, m) => a + m.il, 0) };
}
