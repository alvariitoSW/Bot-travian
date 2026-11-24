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
export function reiniciar() { quitaHumo(); guQuita(); quitaViva(); gentioL = []; fijos = []; extras = []; if (gente) gente.l = []; carros = []; rev = -1; estado = null; sucio = true; }
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
  for (const q of fijos) cols.push({ x: q.x, z: q.z, y: q.y || 7, f: 0.33, col: [0.86, 0.83, 0.78], op: 0.55 });      // CD5b: humo de hornos
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
/* UR1 (usuario, 20/11): los carros iban solos, sin animal que tirase, y daban la vuelta al final de la calle. Fuera hasta que haya yunta. */
const CARROS_SOLOS = false;
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
  const vs = E.vias.filter(v => v.largo > 60 && v.p && v.p.length > 1), rnd = C.azar(E.vias.length * 7 + 5), quiero = CARROS_SOLOS && vs.length ? Math.min(N_CARROS, 3 + Math.floor(E.parcelas.length / 40)) : 0;
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
  const plano = C.U && C.U.uPlano && C.U.uPlano.value > 0.5;      // CD5b: desde arriba la gente es la de calleViva
  moverGente(t, dt, VIDA_GENTE && cerca && !plano); moverCarros(dt, VIDA_CARROS && camD < 700 && listo); calleViva(E, camD, t, dt, listo);
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

/* ---------- CD5b: calles vivas vistas desde arriba ----------
   Gente (un cuerpo y una cabeza con su sombra) y carros de buey (caja con dos ruedas y yunta) en instancias, de pocos triángulos.
   Siguen E.vias y las calles de la urbe: cada uno elige un destino (el foro, una puerta o el mercado), va por la calle hacia el extremo más cercano
   y, al llegar, vuelve a salir por otra calle. Gentío de revuelta: gentio(lista). Humo de hornos fijos: humosFijos(lista). */
const VIVA_CAM = 1100, VIVA_MAX = 150, VIVA_EXTRA = 70, VIVA_CARROS_MAX = 9;
const TUNICAS = ['#e8dcc0', '#c9a05a', '#a8553f', '#5f7482', '#7f8f5c', '#b04a3a', '#d8d0b0', '#8a6b45', '#cfc4a8'];
let viva = null, gentioL = [], fijos = [];
export function gentio(lista) { gentioL = lista || []; }
export function humosFijos(lista) { const f = (lista || []).map(q => `${Math.round(q.x)},${Math.round(q.z)}`).join('|'); if (f === fijos.f) return; fijos = (lista || []).slice(); fijos.f = f; sucio = true; }
function mezcla(partes) {
  const P = [], N = [], Cc = [];
  for (const [g0, col, x, y, z] of partes) { const g = g0.index ? g0.toNonIndexed() : g0; g.translate(x, y, z); const p = g.attributes.position, n = g.attributes.normal, c = new THREE.Color(col);
    for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); Cc.push(c.r, c.g, c.b); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); return g;
}
const caja3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function geoPersona() { return mezcla([[caja3(1.0, 1.5, 0.75), '#ffffff', 0, 0.75, 0], [caja3(0.55, 0.5, 0.55), '#b08a64', 0, 1.78, 0], [new THREE.CircleGeometry(0.62, 8).rotateX(-Math.PI / 2), '#6a5a44', 0, 0.05, 0]]); }
function geoCarro() { const rueda = new THREE.CylinderGeometry(0.75, 0.75, 0.22, 8).rotateX(Math.PI / 2);
  return mezcla([[caja3(3.4, 0.5, 1.9), '#c49560', 0, 1.0, 0], [caja3(2.0, 0.85, 1.3), '#f2e0b4', -0.3, 1.65, 0], [rueda, '#6a5238', 0, 0.75, 1.05], [rueda.clone(), '#6a5238', 0, 0.75, -1.05], [caja3(0.14, 0.14, 2.4), '#6a5238', 0, 0.75, 0],
    [caja3(2.0, 1.1, 0.85), '#b8a080', 3.6, 1.15, 0], [caja3(0.75, 0.65, 0.65), '#9a8468', 4.85, 1.3, 0], [caja3(0.2, 0.2, 1.5), '#5a4028', 4.3, 1.9, 0], [caja3(2.1, 0.12, 0.12), '#5a4028', 2.2, 1.0, 0],
    [new THREE.CircleGeometry(2.6, 8).rotateX(-Math.PI / 2), '#2a2218', 2.0, 0.05, 0]]); }
function creaViva() {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), mk = (geo, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, new THREE.Color()); C.scene.add(m); return m; };
  viva = { gM: mk(geoPersona(), VIVA_MAX + VIVA_EXTRA), cM: mk(geoCarro(), VIVA_CARROS_MAX), rutas: [], g: [], c: [], fE: null, rev: -1 };
  const rnd = C.azar(77); viva.gM.userData.col = Array.from({ length: VIVA_MAX + VIVA_EXTRA }, () => new THREE.Color(TUNICAS[Math.floor(rnd() * TUNICAS.length)]).multiplyScalar(0.92 + 0.16 * rnd()));
  viva.gM.userData.col.forEach((c, i) => viva.gM.setColorAt(i, c)); for (let i = 0; i < VIVA_CARROS_MAX; i++) viva.cM.setColorAt(i, new THREE.Color().setScalar(0.9 + 0.12 * ((i * 37) % 10) / 10));
}
function quitaViva() { if (!viva) return; for (const m of [viva.gM, viva.cM]) { C.scene.remove(m); m.geometry.dispose(); m.material.dispose(); m.dispose(); } viva = null; }
function rutasDe(E) {
  const r = []; for (const v of [...E.vias.filter(v => v.p && v.p.length > 1), ...(E.urbe && E.urbe.calles || [])]) { const p = v.p.map(q => Array.isArray(q) ? q : [q.x, q.z]), cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const L = cum[cum.length - 1]; if (L >= 14 && L <= 600) r.push({ p, cum, L, w: v.w || 2 }); }
  return r;
}
function destinos(E) { const d = []; if (E.foro) { d.push({ x: E.foro.x, z: E.foro.z }, { x: E.foro.x, z: E.foro.z }); } for (const q of E.puertas || []) d.push({ x: q.x, z: q.z }); for (const e of E.edificios || []) if (e.tipo === 'mercado' && !e.obra && !e.ruina) d.push({ x: e.x, z: e.z }); return d; }
function enRuta(r, s) { const c = r.cum; let a = 0, b = c.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (c[m] <= s) a = m; else b = m; } const u = (s - c[a]) / ((c[b] - c[a]) || 1), p0 = r.p[a], p1 = r.p[b]; return { x: p0[0] + (p1[0] - p0[0]) * u, z: p0[1] + (p1[1] - p0[1]) * u, ang: Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) }; }
function nuevoViaje(w, rutas, dest, rnd, larga) {
  for (let k = 0; k < 20; k++) { const r = rutas[Math.floor(rnd() * rutas.length)]; if (larga && r.L < 40) continue; const T = dest[Math.floor(rnd() * dest.length)] || { x: r.p[0][0], z: r.p[0][1] }, a = r.p[0], b = r.p[r.p.length - 1], haciaB = Math.hypot(b[0] - T.x, b[1] - T.z) < Math.hypot(a[0] - T.x, a[1] - T.z);
    w.r = r; w.dir = haciaB ? 1 : -1; w.s = rnd() < 0.5 ? (haciaB ? 0 : r.L) : rnd() * r.L; w.lat = (rnd() - 0.5) * Math.min(r.w, 3) * 0.7; return true; }
  return false;
}
export function calleViva(E, camD, t, dt, listo) {
  const ver = VIDA_GENTE && E && E.vias && camD < VIVA_CAM && listo; if (!ver) { if (viva) { viva.gM.count = 0; viva.cM.count = 0; } return; }
  if (!viva) creaViva();
  if (viva.fE !== E || viva.rev !== E.rev) { viva.fE = E; viva.rev = E.rev; viva.rutas = rutasDe(E); viva.dest = destinos(E); const rnd = C.azar(E.vias.length * 5 + 3); viva.rnd = rnd; viva.g = []; viva.c = [];
    if (viva.rutas.length) { const n = E.urbe ? VIVA_MAX : Math.min(60, 10 + E.parcelas.length * 2), nc = Math.min(VIVA_CARROS_MAX, E.urbe ? 8 : 2);
      for (let i = 0; i < n; i++) { const w = { vel: 3 + rnd() * 1.8, e: 1.9 + rnd() * 0.3, fase: rnd() * 6 }; if (nuevoViaje(w, viva.rutas, viva.dest, rnd, false)) viva.g.push(w); }
      for (let i = 0; i < nc; i++) { const w = { vel: 2.4 + rnd() * 0.8, e: 1.35 }; if (nuevoViaje(w, viva.rutas, viva.dest, rnd, true)) viva.c.push(w); } } }
  const A = viva.gM.instanceMatrix.array, B = viva.cM.instanceMatrix.array, mv = (w, i, M, esCarro) => { w.s += w.dir * w.vel * dt; if (w.s < 0 || w.s > w.r.L) { nuevoViaje(w, viva.rutas, viva.dest, viva.rnd, esCarro); w.s = w.dir > 0 ? 0 : w.r.L; }
    const p = enRuta(w.r, Math.max(0, Math.min(w.r.L, w.s))), a = w.dir > 0 ? p.ang : p.ang + Math.PI, x = p.x - Math.sin(p.ang) * w.lat, z = p.z + Math.cos(p.ang) * w.lat; matriz(x, C.altura(x, z) + 0.05, z, esCarro ? -a : 0, w.e).toArray(M, i * 16); };
  viva.g.forEach((w, i) => mv(w, i, A, false)); viva.c.forEach((w, i) => mv(w, i, B, true));
  let n = viva.g.length; for (let k = 0; k < gentioL.length && n < VIVA_MAX + VIVA_EXTRA; k++, n++) { const q = gentioL[k], j = Math.sin(t * 6 + k * 1.7) * 0.5; matriz(q.x + j, C.altura(q.x, q.z) + 0.05 + Math.abs(Math.sin(t * 5 + k)) * 0.5, q.z - j, k, 2.0).toArray(A, n * 16); }
  viva.gM.count = n; viva.cM.count = viva.c.length; viva.gM.instanceMatrix.needsUpdate = true; viva.cM.instanceMatrix.needsUpdate = true;
  if (viva.gM.instanceColor) viva.gM.instanceColor.needsUpdate = true;
}
