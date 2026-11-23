/* Estilo «Maqueta de museo»: la ciudad de ESCENA levantada en 3D con three.js (el de js/vendor), geometría por código.
   Cámara cenital fija (mirando recta hacia abajo), perspectiva moderada: lo alto se ve de lado hacia los bordes.
   Sol bajo con sombras. Casi todo va en InstancedMesh para pocas llamadas de dibujo. */
import * as THREE from '../../../../js/vendor/three.module.min.js';

const W = 390, H = 844;
let sem = 4242; const R = () => (sem = sem * 16807 % 2147483647) / 2147483647;
const rad = d => d * Math.PI / 180;

/* ---------- geometrías de partida (todas con la base en y=0) ---------- */
function malla(caras) { // caras: [[a,b,c,pista, uvA,uvB,uvC]] ; se orienta cada triángulo según su pista (normal hacia fuera)
  const pos = [], uv = [];
  for (const [a, b, c, n, ua, ub, uc] of caras) {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    const flip = nx * n[0] + ny * n[1] + nz * n[2] < 0, t = flip ? [a, c, b] : [a, b, c], u = flip ? [ua, uc, ub] : [ua, ub, uc];
    for (const p of t) pos.push(...p); for (const q of u) uv.push(...(q || [0, 0]));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
const quad = (a, b, c, d, n, ua, ub, uc, ud) => [[a, b, c, n, ua, ub, uc], [a, c, d, n, ua, uc, ud]];
// tejado a dos aguas: cumbrera a lo largo de x, ancho 1 (z), alto 1. Las faldas llevan uv para las hileras de teja.
const GABLE = malla([
  ...quad([-.5, 0, -.5], [.5, 0, -.5], [.5, 1, 0], [-.5, 1, 0], [0, 1, -1], [0, 0], [3, 0], [3, 1], [0, 1]),
  ...quad([-.5, 0, .5], [-.5, 1, 0], [.5, 1, 0], [.5, 0, .5], [0, 1, 1], [0, 0], [0, 1], [3, 1], [3, 0]),
  [[-.5, 0, -.5], [-.5, 1, 0], [-.5, 0, .5], [-1, 0, 0]], [[.5, 0, -.5], [.5, 0, .5], [.5, 1, 0], [1, 0, 0]]]);
// tejado a cuatro aguas
const HIP = malla([
  ...quad([-.5, 0, -.5], [.5, 0, -.5], [.25, 1, 0], [-.25, 1, 0], [0, 1, -1], [0, 0], [3, 0], [2.4, 1], [.6, 1]),
  ...quad([-.5, 0, .5], [-.25, 1, 0], [.25, 1, 0], [.5, 0, .5], [0, 1, 1], [0, 0], [.6, 1], [2.4, 1], [3, 0]),
  [[-.5, 0, -.5], [-.25, 1, 0], [-.5, 0, .5], [-1, 1, 0], [0, 0], [.5, 1], [1, 0]], [[.5, 0, -.5], [.5, 0, .5], [.25, 1, 0], [1, 1, 0], [0, 0], [1, 0], [.5, 1]]]);
// compluvio: tejado que se hunde hacia el hueco central (atrios y domus). Falda exterior de 0 a 1; el borde del hueco queda a 0.3
function compluvio(h) {
  const o = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], i = o.map(([x, z]) => [x * 2 * h, z * 2 * h]), c = [];
  for (let k = 0; k < 4; k++) {
    const k2 = (k + 1) % 4, a = o[k], b = o[k2], p = i[k], q = i[k2], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    c.push(...quad([a[0], 1, a[1]], [b[0], 1, b[1]], [q[0], .3, q[1]], [p[0], .3, p[1]], [-mx, 1, -mz], [0, 0], [3, 0], [3, 1], [0, 1]));
    c.push(...quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], 1, b[1]], [a[0], 1, a[1]], [mx, 0, mz], [0, 0], [3, 0], [3, .3], [0, .3]));
  }
  return malla(c);
}
const caja = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0);
const cil = (n = 12) => new THREE.CylinderGeometry(1, 1, 1, n).translate(0, .5, 0);
const cono = new THREE.ConeGeometry(1, 1, 10).translate(0, .5, 0);

function texturaTeja() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
  for (let r = 0; r < 4; r++) { x.fillStyle = 'rgba(70,25,10,.38)'; x.fillRect(0, r * 16 + 13, 64, 3); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, r * 16 + 1, 64, 2);
    for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(70,25,10,.2)'; x.fillRect(k * 16 + (r % 2) * 8, r * 16, 1.5, 14); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function texturaHierba() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#9bb05a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { const l = 40 + R() * 30; x.fillStyle = `hsla(${70 + R() * 25},${35 + R() * 20}%,${l}%,.35)`; const r = 2 + R() * 7; x.beginPath(); x.arc(R() * 256, R() * 256, r, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function dibujarCiudad(E, host) {
  const { CX, CY, RX, RY } = E;
  const X = x => x - CX, Z = y => y - CY; // plano de la escena -> mundo (x derecha, z hacia abajo de la pantalla)
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); const FONDO = new THREE.Color('#e6d2a8'); scene.background = FONDO;

  /* ---- cámara: cenital recta, perspectiva moderada ---- */
  const cam = new THREE.PerspectiveCamera(42, W / H, 20, 6000); cam.up.set(0, 0, -1);
  const T = new THREE.Vector3(0, 0, 0);
  const colocar = d => { cam.position.set(T.x, T.y + d, T.z); cam.lookAt(T); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
  const proy = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return [(v.x + 1) * W / 2, (1 - v.y) * H / 2]; };
  let D = 900;
  for (let it = 0; it < 4; it++) {
    for (D = 400; D < 4000; D += 5) { colocar(D); let mn = 1e9, mx = -1e9; for (let a = 0; a < 360; a += 10) { const p = proy((RX + 6) * Math.cos(rad(a)), 24, RY * Math.sin(rad(a)))[0]; mn = Math.min(mn, p); mx = Math.max(mx, p); } if (mx - mn <= 356) break; }
    const sc = (proy(0, 0, 100)[1] - proy(0, 0, 0)[1]) / 100; T.z += (proy(0, 10, 0)[1] - 378) / sc;
  }
  colocar(D); T.x = 0;
  scene.fog = new THREE.Fog(FONDO, D * 1.15, D * 2.4);

  /* ---- luces: sol bajo de tarde, cálido ---- */
  scene.add(new THREE.HemisphereLight('#fff0d2', '#8c7050', 1.25));
  const sol = new THREE.DirectionalLight('#ffd49a', 3.4); sol.position.set(-300, 290, 230); sol.target.position.set(0, 0, 60);
  sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096); sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.5; sol.shadow.radius = 2.5;
  const sc2 = sol.shadow.camera; sc2.left = -420; sc2.right = 420; sc2.top = 470; sc2.bottom = -470; sc2.near = 50; sc2.far = 1400;
  scene.add(sol, sol.target);

  /* ---- materiales ---- */
  const mBase = new THREE.MeshStandardMaterial({ color: '#fff', roughness: .9 });
  const mTeja = new THREE.MeshStandardMaterial({ color: '#fff', roughness: .8, map: texturaTeja(), side: THREE.DoubleSide });
  const mLiso = (c, r = .9, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r }, o));
  const mTejaPlano = new THREE.MeshStandardMaterial({ color: '#fff', roughness: .85, side: THREE.DoubleSide });

  /* ---- lotes instanciados ---- */
  const lotes = [];
  function lote(geo, mat, max, cast = true) {
    const m = new THREE.InstancedMesh(geo, mat, max); m.count = 0; m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false;
    const o = new THREE.Object3D(), c = new THREE.Color();
    m.poner = (x, y, z, sx, sy, sz, ry, col) => { o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(0, ry || 0, 0); o.updateMatrix(); m.setMatrixAt(m.count, o.matrix); m.setColorAt(m.count, c.set(col)); m.count++; };
    scene.add(m); lotes.push(m); return m;
  }
  const jit = (hex, dh = .015, dl = .05) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h + (R() - .5) * dh, h.s, Math.max(0, Math.min(1, h.l + (R() - .5) * dl))); return c; };
  const TEJA = ['#c9683e', '#bd5b34', '#d27749', '#b4522f'], ENL = ['#eadcb8', '#e2cfa4', '#ecdfc4', '#dcc59a'];

  /* ---- suelo ---- */
  const hierba = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: texturaHierba(), roughness: 1 }));
  hierba.position.set(0, -.5, 0); hierba.receiveShadow = true; scene.add(hierba);
  const interior = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), mLiso('#e4d3a8', 1)); interior.scale.set(RX, 1, RY); interior.position.y = .1; interior.receiveShadow = true; scene.add(interior);

  /* ---- bandas planas: calles, caminos (una sola malla por color) ---- */
  function cinta(grupos, col, y) {
    const pos = [];
    for (const { pts, ancho } of grupos) for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz * ancho / 2, nz = dx * ancho / 2, ex = dx * .8, ez = dz * .8, ax = X(a[0]) - ex, az = Z(a[1]) - ez, bx = X(b[0]) + ex, bz = Z(b[1]) + ez;
      pos.push(ax + nx, y, az + nz, bx - nx, y, bz - nz, ax - nx, y, az - nz, ax + nx, y, az + nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, k) => k % 3 === 1 ? 1 : 0), 3));
    const m = new THREE.Mesh(g, mLiso(col, 1)); m.receiveShadow = true; scene.add(m);
  }
  cinta(E.calles.filter(c => c.tipo === 'tierra'), '#c4a977', .3);
  cinta(E.camino.map(c => ({ pts: c.pts, ancho: 8 })), '#c9ae7c', .25);
  cinta(E.calles.filter(c => c.tipo === 'empedrada'), '#cdc3aa', .5);

  /* ---- río, orillas y puente ---- */
  const ang = -Math.atan2(-.22, 1), RLEN = 1500, rc = [0, Z(E.rio(195))];
  const banda = (ancho, col, y, rough, ex = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(RLEN, ancho).rotateX(-Math.PI / 2), mLiso(col, rough, ex)); m.position.set(0, y, rc[1]); m.rotation.y = ang; m.receiveShadow = true; scene.add(m); return m; };
  banda(2 * (E.RIO_W + 7), '#d4c08c', .2, 1); banda(2 * E.RIO_W, '#4d93b3', .45, .22, { metalness: .15 });
  const carga = (x, z, sx, sy, sz, ry, col, y0 = 0) => { const m = new THREE.Mesh(caja, mLiso(col, .9)); m.position.set(x, y0, z); m.scale.set(sx, sy, sz); m.rotation.y = ry || 0; m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  { const p = E.puente, zc = Z((p.y0 + p.y1) / 2), l = p.y1 - p.y0;
    carga(0, zc, p.w, 2.2, l, 0, '#b9ab88', .9); carga(-p.w / 2 + .8, zc, 1.6, 2.4, l, 0, '#a99b78', 3.1); carga(p.w / 2 - .8, zc, 1.6, 2.4, l, 0, '#a99b78', 3.1);
    for (const dz of [-.3, 0, .3]) carga(0, zc + dz * l, p.w - 2, 4, 4, 0, '#a99b78', -.2); }
  { const q = E.muelle.quay, p = E.muelle.pier; carga(X(q.x + q.w / 2), Z(q.y + q.h / 2), q.w, 3.2, q.h, 0, '#b4a584'); carga(X(p.x + p.w / 2), Z(p.y + p.h / 2), p.w, 1.6, p.h, 0, '#8d6a3f', .8); }
  // barcos: casco puntiagudo extruido
  for (const b of E.barcos) {
    const s = new THREE.Shape(); const l = b.l / 2, w = b.w / 2; s.moveTo(-l, -w * .8); s.lineTo(l - 8, -w); s.lineTo(l, 0); s.lineTo(l - 8, w); s.lineTo(-l, w * .8); s.closePath();
    const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: false }).rotateX(-Math.PI / 2), mLiso('#8a5a2c', .85)); hull.position.set(X(b.x), .1, Z(b.y)); hull.rotation.y = -rad(b.rot); hull.castShadow = hull.receiveShadow = true; scene.add(hull);
    const dk = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .6, bevelEnabled: false }).rotateX(-Math.PI / 2).scale(.82, 1, .72), mLiso('#c9a468', .9)); dk.position.set(X(b.x), 4.1, Z(b.y)); dk.rotation.y = hull.rotation.y; dk.receiveShadow = true; scene.add(dk);
    if (b.vela) { const mast = new THREE.Mesh(caja, mLiso('#5b3d1e')); mast.scale.set(1, 20, 1); mast.position.set(X(b.x), 4, Z(b.y)); mast.castShadow = true; scene.add(mast);
      const vela = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mLiso('#efe6cf', .95, { side: THREE.DoubleSide })); vela.position.set(X(b.x), 15, Z(b.y)); vela.rotation.y = hull.rotation.y + Math.PI / 2; vela.castShadow = true; scene.add(vela); }
  }

  /* ---- campos, huertos y jardines ---- */
  const PAL = [['#dcb95e', '#c9a64a'], ['#92b055', '#7c9b45'], ['#bb9058', '#a87d48']];
  const tiras = lote(caja, mBase, 900, false);
  function campo(x, y, w, h, rot, pal, vert, filas) {
    const cx = X(x + w / 2), cz = Z(y + h / 2), ry = -rad(rot || 0), lado = vert ? w : h, n = filas || Math.max(2, Math.round(lado / 5)), paso = lado / n;
    tiras.poner(cx, 0, cz, w, .5, h, ry, '#7d6a3f');
    for (let k = 0; k < n; k++) { const off = -lado / 2 + paso * (k + .5), lx = vert ? off : 0, lz = vert ? 0 : off, c = Math.cos(ry), s = Math.sin(ry);
      tiras.poner(cx + lx * c + lz * s, .5, cz - lx * s + lz * c, vert ? paso * .72 : w - 1, 1.1, vert ? h - 1 : paso * .72, ry, pal[k % 2]); }
  }
  for (const c of E.campos) campo(c.x, c.y, c.w, c.h, c.rot, PAL[c.col], c.vert);
  for (const h of E.huertos) campo(h.x, h.y, h.w, h.h, 0, ['#6c9c3e', '#55862f'], false, 5);
  for (const j of E.jardines) { campo(j.x, j.y, j.w, j.h, 0, ['#8fbf5c', '#7fb04c'], false, 4); }

  /* ---- vivienda ---- */
  const cuerpos = lote(caja, mBase, 400), tejaD = lote(GABLE, mTeja, 300), tejaH = lote(HIP, mTeja, 60), comp = lote(compluvio(.18), mTeja, 80), comp2 = lote(compluvio(.26), mTeja, 30);
  const chozaC = lote(cil(10), mBase, 60), chozaT = lote(cono, mBase, 60), vent = lote(caja, mBase, 400, false), agua = lote(caja, mLiso('#fff', .15, { metalness: .1 }), 80, false);
  const gableSobre = (cx, y, cz, w, h, alto, col, lado = 1.06, mt = tejaD) => { const largo = h > w; mt.poner(cx, y, cz, (largo ? h : w) * lado, alto, (largo ? w : h) * lado, largo ? Math.PI / 2 : 0, col); };
  for (const c of E.casas) {
    if (c.tipo === 'choza') { const x = X(c.x), z = Z(c.y); chozaC.poner(x, 0, z, c.r, 4, c.r, 0, '#d9c8a0'); chozaT.poner(x, 3.6, z, c.r * 1.3, c.r * 1.25 + 2.6, c.r * 1.3, 0, jit('#d6b95e', .03, .1)); continue; }
    const cx = X(c.x + c.w / 2), cz = Z(c.y + c.h / 2), w = c.w, h = c.h, te = jit(TEJA[c.c % 4]);
    if (c.tipo === 'atrio') { cuerpos.poner(cx, 0, cz, w, 5, h, 0, ENL[c.c % 4]); comp.poner(cx, 5, cz, w * 1.05, 3.4, h * 1.05, 0, te); agua.poner(cx, 5.2, cz, w * .3, .3, h * .3, 0, '#5aa2c4'); }
    else if (c.tipo === 'rica') { cuerpos.poner(cx, 0, cz, w, 6, h, 0, ENL[c.c % 4]); comp2.poner(cx, 6, cz, w * 1.04, 3.2, h * 1.04, 0, te); agua.poner(cx, 6.2, cz, w * .36, .3, h * .36, 0, '#5aa2c4'); for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cuerpos.poner(cx + sx * w * .27, 6, cz + sz * h * .27, 1.6, 2.4, 1.6, 0, '#efe6d0'); }
    else if (c.tipo === 'insula') {
      for (let k = 0; k < 3; k++) { cuerpos.poner(cx, k * 5.5, cz, w * (k ? 1.03 : 1), 5.3, h * (k ? 1.03 : 1), 0, jit(ENL[c.c % 4], .02, .06)); for (let j = -1; j <= 1; j++) vent.poner(cx + j * 9, k * 5.5 + 1.3, cz + h / 2 + .05, 3.2, 2.6, .6, 0, '#4a3a2a'); }
      gableSobre(cx, 16.5, cz, w, h, 4, te);
    }
  }
  for (const p of E.publicos) {
    const cx = X(p.x + p.w / 2), cz = Z(p.y + p.h / 2), w = p.w, h = p.h;
    if (p.tipo === 'granero') { cuerpos.poner(cx, 0, cz, w, 9, h, 0, '#cfa75f'); gableSobre(cx, 9, cz, w, h, 6, jit('#c19a4a')); }
    else if (p.tipo === 'almacen') { cuerpos.poner(cx, 0, cz, w, 6, h, 0, '#9d7d55'); gableSobre(cx, 6, cz, w, h, 4, jit('#7e6240')); }
    else if (p.tipo === 'cuartel') { cuerpos.poner(cx, 0, cz, w, 7, h, 0, '#e3d4b2'); comp2.poner(cx, 7, cz, w * 1.04, 3, h * 1.04, 0, jit('#b4402c')); agua.poner(cx, 7.2, cz, w * .36, .3, h * .36, 0, '#7a6a55'); cuerpos.poner(cx + w * .3, 7, cz - h * .3, .6, 9, .6, 0, '#4a3a2a'); cuerpos.poner(cx + w * .3 + 2, 14.5, cz - h * .3, 4, 2.5, .3, 0, '#c0281f'); }
    else { cuerpos.poner(cx, 0, cz, w, 10, h, 0, '#eadfc6'); const d = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, 2 * Math.PI, 0, Math.PI / 2), mLiso('#d6c7a5', .8)); d.scale.set(w * .32, 8, h * .32); d.position.set(cx, 10, cz); d.castShadow = d.receiveShadow = true; scene.add(d);
      cuerpos.poner(cx - w * .34, 10, cz, w * .24, 4, h * .5, 0, '#e2d3b0'); cuerpos.poner(cx + w * .34, 10, cz, w * .24, 4, h * .5, 0, '#e2d3b0'); }
  }
  for (const c of E.casasRurales) { const cx = X(c.x + c.w / 2), cz = Z(c.y + c.h / 2); cuerpos.poner(cx, 0, cz, c.w, 5, c.h, 0, ENL[c.c % 4]); gableSobre(cx, 5, cz, c.w, c.h, 4, jit(TEJA[c.c % 4])); }

  /* ---- foro y mercado ---- */
  const f = E.foro, pav = lote(caja, mBase, 10, false);
  pav.poner(X(f.x + f.w / 2), 0, Z(f.y + f.h / 2), f.w, .9, f.h, 0, '#ddd3bc'); pav.poner(X(E.mercado.x + E.mercado.w / 2), 0, Z(E.mercado.y + E.mercado.h / 2), E.mercado.w, .8, E.mercado.h, 0, '#d4c7a8');
  { const c = f.curia, cx = X(c.x + c.w / 2), cz = Z(c.y + c.h / 2);
    cuerpos.poner(cx, .9, cz, c.w + 4, 2.5, c.h + 4, 0, '#cfc4aa'); cuerpos.poner(cx, 3.4, cz, c.w, 14, c.h, 0, '#d9b48a'); tejaH.poner(cx, 17.4, cz, c.w * 1.08, 6, c.h * 1.12, 0, '#a8492c'); vent.poner(cx, 3.4, cz + c.h / 2 + .05, 6, 9, .7, 0, '#3a2a1c'); }
  { const m = new THREE.Mesh(new THREE.LatheGeometry([[2, .9], [2, 1.2], [6, 1.2], [6, 2.6], [10, 2.6], [10, 4.0], [14, 4.0], [14.4, 4.0], [14.4, .6], [2, .6]].map(([r, y]) => new THREE.Vector2(r, y)), 36), mLiso('#d8cdb3', .9, { side: THREE.DoubleSide }));
    m.position.set(X(f.comicio.x), 0, Z(f.comicio.y)); m.castShadow = m.receiveShadow = true; scene.add(m);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.8, 14), mLiso('#a98c63', .9)); tr.position.set(X(f.comicio.x), 1.4, Z(f.comicio.y)); tr.castShadow = true; scene.add(tr); }
  { const t = f.templo, pr = t.porche, x0 = t.x, z0 = t.y, w = t.w, h = pr.y + pr.h - t.y, cx = X(x0 + w / 2), cz = Z(z0 + h / 2), pod = 8, cel = 14;
    cuerpos.poner(cx, 0, cz, w, pod, h, 0, '#dcd1b6');
    cuerpos.poner(cx, 0, Z(z0 + h + 3), 20, 5.5, 6, 0, '#d4c9ae'); cuerpos.poner(cx, 0, Z(z0 + h + 6), 20, 2.8, 6, 0, '#d4c9ae');
    cuerpos.poner(cx, pod, Z(z0 + 15), w - 8, cel, 30, 0, '#ecdfc4');
    vent.poner(cx, pod, Z(z0 + 30) + .1, 6, 10, .8, 0, '#3a2a1c');
    const col = lote(cil(10), mBase, 80), cx0 = x0 + 4, paso = (w - 8) / 5;
    for (let i = 0; i < 6; i++) col.poner(X(cx0 + i * paso), pod, Z(pr.y + 5), 1.7, cel, 1.7, 0, '#f1e8d2');
    for (let k = 0; k < 3; k++) for (const sx of [x0 + 2.5, x0 + w - 2.5]) col.poner(X(sx), pod, Z(z0 + 12 + k * 12), 1.6, cel, 1.6, 0, '#f1e8d2');
    cuerpos.poner(cx, pod + cel, cz, w + 1, 2, h - 2, 0, '#e9dec6');
    tejaD.poner(cx, pod + cel + 2, cz, h - 2, 8, w + 3, Math.PI / 2, '#b9532f');
    const tri = new THREE.Shape(); tri.moveTo(-w / 2 - 1, 0); tri.lineTo(w / 2 + 1, 0); tri.lineTo(0, 7.6); tri.closePath();
    const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.2, bevelEnabled: false }), mLiso('#efe6d0', .85)); fr.position.set(cx, pod + cel + 2, Z(z0 + h - 1.2)); fr.castShadow = fr.receiveShadow = true; scene.add(fr); }
  { const fu = f.fuente, m = new THREE.Mesh(new THREE.CylinderGeometry(fu.r, fu.r + .6, 2.4, 20), mLiso('#cfc5ac')); m.position.set(X(fu.x), 1.2, Z(fu.y)); m.castShadow = m.receiveShadow = true; scene.add(m);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(fu.r - 1, fu.r - 1, .3, 20), mLiso('#4f9cc2', .15)); a.position.set(X(fu.x), 2.3, Z(fu.y)); scene.add(a);
    const ch = new THREE.Mesh(new THREE.ConeGeometry(.8, 5, 8), mLiso('#bfe0ee', .2)); ch.position.set(X(fu.x), 4.6, Z(fu.y)); scene.add(ch); }
  const colF = lote(cil(10), mBase, 60);
  for (const [x, y] of f.columnas) colF.poner(X(x), .9, Z(y), 1.2, 8, 1.2, 0, '#eadfc6');
  { const m = E.mercado, post = lote(caja, mBase, 60, false); // puestos con toldo
    for (const p of m.puestos) { const cx = X(p.x + p.w / 2), cz = Z(p.y + p.h / 2); cuerpos.poner(cx, .8, cz, p.w - 3, 2, p.w - 3, 0, '#9a7448'); post.poner(cx, 5.2, cz, p.w, .7, p.h, 0, p.color); for (const sx of [-1, 1]) for (const sz of [-1, 1]) post.poner(cx + sx * (p.w / 2 - .5), .8, cz + sz * (p.h / 2 - .5), .5, 4.4, .5, 0, '#6b4a28'); } }

  /* ---- muralla de toba con torres cuadradas ---- */
  const M = E.muralla, mur = lote(caja, mBase, 140), almenas = lote(caja, mBase, 900), torr = lote(caja, mBase, 200);
  const pe = t => [RX * Math.cos(t), RY * Math.sin(t)], puertasT = [0, 90, 180, 270].map(rad);
  const cerca = t => puertasT.some(p => Math.abs(Math.atan2(Math.sin(t - p), Math.cos(t - p))) < rad(4.2));
  const N = 120;
  for (let i = 0; i < N; i++) {
    const t0 = i / N * 2 * Math.PI, t1 = (i + 1) / N * 2 * Math.PI, tm = (t0 + t1) / 2; if (cerca(tm)) continue;
    const a = pe(t0), b = pe(t1), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ry = -Math.atan2(dz, dx), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    mur.poner(mx, 0, mz, l + 1.2, 16, M.grosor, ry, jit('#c3b490', .01, .05));
    const nx = dz / l, nz = -dx / l; // normal exterior (sentido horario en pantalla)
    for (let k = 0; k < 3; k++) { const u = (k - 1) * l / 3.2; almenas.poner(mx + dx / l * u + nx * 3, 16, mz + dz / l * u + nz * 3, 3, 2.6, 2, ry, '#b7a883'); almenas.poner(mx + dx / l * u - nx * 3, 16, mz + dz / l * u - nz * 3, 3, 2.6, 2, ry, '#b7a883'); }
  }
  const torre = (x, z, ry, s = 13, alto = 26) => { torr.poner(x, 0, z, s, alto, s, ry, '#b9a982'); torr.poner(x, alto, z, s + 2.5, 2.4, s + 2.5, ry, '#a89a76'); torr.poner(x, alto + 2.4, z, s * .55, 2.4, s * .55, ry, '#c9bb96'); };
  for (const t of M.torres) torre(X(t.x), Z(t.y), -rad(t.ang));
  for (const p of M.puertas) { const horiz = p.ang === 0, px = X(p.x), pz = Z(p.y); for (const s of [-1, 1]) torre(px + (horiz ? s * 15 : 0), pz + (horiz ? 0 : s * 17), 0, 14, 30); torr.poner(px, 17, pz, horiz ? 30 : 12, 9, horiz ? 12 : 34, 0, '#b0a07a'); }

  /* ---- árboles y carros ---- */
  const tron = lote(cil(6), mBase, 100), copa = lote(new THREE.IcosahedronGeometry(1, 1).translate(0, 0, 0), mLiso('#fff', .9, { flatShading: true }), 100);
  for (const a of E.arboles) { tron.poner(X(a.x), 0, Z(a.y), .9, a.r * .9, .9, 0, '#6b4a2a'); copa.poner(X(a.x), a.r * .75, Z(a.y), a.r, a.r * .78, a.r, R() * 6, jit(['#5a8c36', '#4f7f2f', '#678f3c'][Math.floor(R() * 3)], .03, .1)); }
  const carr = lote(caja, mBase, 10); for (const c of E.carros) { carr.poner(X(c.x), 1.6, Z(c.y), 8, 2.4, 5, -rad(c.rot), '#8b5d32'); carr.poner(X(c.x), 1.2, Z(c.y), 2, 1.2, 6.4, -rad(c.rot), '#4a3220'); }

  /* ---- gente: pequeños conos con cabeza ---- */
  const gp = lote(new THREE.ConeGeometry(.9, 3, 6).translate(0, 1.5, 0), mBase, 200, true), gc = lote(new THREE.SphereGeometry(.7, 6, 4).translate(0, 3.4, 0), mLiso('#fff', .8), 200, false);
  for (const p of E.gente) { gp.poner(X(p.x), .5, Z(p.y), 1, 1, 1, 0, p.c); gc.poner(X(p.x), .5, Z(p.y), 1, 1, 1, 0, '#e0b790'); }

  lotes.forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  // tejados: el color por instancia ya lleva el tinte; la textura solo marca las hileras

  /* ---- primer cuadro, con medidas ---- */
  const t0 = performance.now(); renderer.render(scene, cam); renderer.getContext().finish();
  const ms = performance.now() - t0, info = renderer.info.render;
  const medidas = { triangulos: info.triangles, llamadas: info.calls, ms_primer_cuadro: Math.round(ms), camara_dist: Math.round(D) };
  console.log('MAQUETA ' + JSON.stringify(medidas)); window.medidasMaqueta = medidas;
  return { proyectar: (x, y) => proy(X(x), 0, Z(y)), medidas, renderer };
}
