// Maqueta Q1b: ciudad itálica común (toba y teja), densa e irregular, SOBRE la vista 3D real. No toca el juego.
// Uso: node gobierno/maquetas/ciudad-italica.mjs  (~10-15 min por render por software)
//      -> gobierno/capturas-tarea/Q1b-{0-antes-cerca,0-antes-lejos,1-romana-cerca,2-romana-lejos,3-griega,4-punica}.jpg
// Qué es real y qué inventado:
//  - REAL (arte 0 A.D., CC BY-SA 3.0, ya en assets/static): casa, almacen, mercado, foro, vesta, templo, grie_templo, cart_templo,
//    muro, puerta, olivo, cipres, algarrobo, pino. No se añade arte nuevo.
//  - INVENTADO (maqueta, no es dato histórico): el contorno de la muralla, la colina (arx), el trazado de calles, los campos,
//    arrabales y aldeas, el humo, los tonos de toba/estuco/encalado y la luz de tarde. Todo se genera por código con una semilla fija.
//  - LICENCIA DE JUEGO: «ciudad itálica común» es un tipo genérico; el templo capitolino de la arx, la cultura griega con estuco blanco
//    y la púnica ocre/encalada son tintes y piezas elegidos por aspecto, no reconstrucción arqueológica. Los muros de toba (aquí con el
//    modelo del muro de 0 A.D.) son una aproximación; las casas con teja reales de la época serían más pequeñas y de planta irregular.
//  - Las medallas/etiquetas del juego se ocultan en las capturas «después» (apuntan a los solares antiguos).
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.webmanifest': 'application/manifest+json' };

function servidor() {
  return new Promise(ok => {
    const s = createServer(async (req, res) => {
      try {
        let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
        if (r === '' || r.endsWith('/')) r += 'index.html';
        if (r.startsWith('..')) throw new Error('fuera');
        const d = await readFile(join(RAIZ, r));
        res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(d);
      } catch (e) { res.writeHead(404); res.end('no encontrado'); }
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

/* ---- todo lo que sigue corre DENTRO de la página, sobre UI.cityV (CityView3D real) ---- */
async function enPagina() {
  const { THREE } = await import('/js/gfx/models.js');
  const S = await import('/js/gfx/statics.js');
  const V = UI.cityV, sc = V.scene;
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mk = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  // ---- limpiar la escena original: se quitan (no solo se ocultan: sync() les devuelve visible cada cuadro) ----
  const keep = new Set([...Object.values(V.figs ? [...V.figs.values()].map(e => e.m) : [])]);
  for (const o of [...sc.children]) if (!(o.isLight || keep.has(o))) sc.remove(o);
  V.labels.style.display = 'none';
  // gente: que pise el terreno nuevo
  const put0 = V.put.bind(V), fig0 = V.fig.bind(V);   // la guarnición del juego (cientos de soldados, ~270 000 triángulos) se oculta en la maqueta
  V.fig = (k, cap) => { const e = fig0(k, cap); if (e && !/ciudadana|sacerdote/.test(k)) e.m.visible = false; return e; };
  for (const [k, e] of V.figs) if (!/ciudadana|sacerdote/.test(k)) e.m.visible = false;
  // ---- terreno ----
  const HC = [0, -82];
  function H(x, z) {
    const d = Math.hypot(x - HC[0], z - HC[1]), r = Math.hypot(x, z), a = Math.atan2(z, x);
    let h = 34 * ss(88, 16, d);
    const ridge = 0.5 + 0.5 * Math.sin(a * 3 + 0.7) * Math.cos(a * 5 + 1.3);
    h += ss(300, 540, r) * (40 + 60 * ridge + 8 * Math.sin(x * 0.03) * Math.sin(z * 0.027));
    h += ss(110, 260, r) * (3 * Math.sin(x * 0.011 + z * 0.007) + 2.5 * Math.cos(z * 0.013 - x * 0.005));
    return h;
  }
  V.put = function (e, x, z, yaw, clip, t) { const n = e ? e.i : 0; put0(e, x, z, yaw, clip, t); if (e && e.i > n) e.M[(e.i - 1) * 16 + 13] = H(x, z) + 0.1; };
  const SZ = 1200, N = 96, TS = 3072, K = TS / (SZ * 2);
  const g = new THREE.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2);
  { const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), w = p.getZ(i), x = SZ * (0.22 * u + 0.78 * u * u * u), z = SZ * (0.22 * w + 0.78 * w * w * w); p.setXYZ(i, x, H(x, z), z); uv.setXY(i, x / (SZ * 2) + 0.5, 1 - (z / (SZ * 2) + 0.5)); }
    g.computeVertexNormals(); }
  const cvT = document.createElement('canvas'); cvT.width = cvT.height = TS;
  const tex = new THREE.CanvasTexture(cvT); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex }));
  // ---- cielo, niebla, luz ----
  const sk = document.createElement('canvas'); sk.width = 4; sk.height = 256; { const c = sk.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5f8fc6'); gr.addColorStop(0.16, '#9cc0d9'); gr.addColorStop(0.3, '#e0d5b4'); gr.addColorStop(0.42, '#dccba3'); gr.addColorStop(1, '#dccba3'); c.fillStyle = gr; c.fillRect(0, 0, 4, 256); }
  const skt = new THREE.CanvasTexture(sk); skt.colorSpace = THREE.SRGBColorSpace; sc.background = skt; sc.fog = new THREE.Fog('#dccba3', 480, 1350);
  for (const l of sc.children) { if (l.isHemisphereLight) { l.color.set('#d4e2f4'); l.groundColor.set('#8f6c3e'); l.intensity = 1.05; } if (l.isDirectionalLight) { l.color.set('#ffd29a'); l.intensity = 3.1; l.position.set(-170, 105, 130); } }
  V.r.toneMappingExposure = 1.05;
  sc.add(ground);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#a8a272', fog: true })); base.position.y = -3; sc.add(base);

  // ---- geometría de la ciudad (igual en todas las culturas) ----
  const R0 = mk(7), CC = [0, -30];
  const NV = 22, poly = [];
  for (let i = 0; i < NV; i++) { const th = i / NV * Math.PI * 2 + (R0() - 0.5) * 0.18, f = 0.88 + 0.24 * R0(); poly.push([CC[0] + 100 * f * Math.cos(th), CC[1] + 88 * f * Math.sin(th)]); }
  const inPoly = (x, z) => { let c = false; for (let i = 0, j = NV - 1; i < NV; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const dSeg = (x, z, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz || 1))); return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); };
  const edgeD = (x, z) => { let m = 1e9; for (let i = 0; i < NV; i++) m = Math.min(m, dSeg(x, z, poly[i], poly[(i + 1) % NV])); return m; };
  // puertas: arista cuyo punto medio queda más cerca de cada objetivo
  const gateT = [[0, 70], [110, -30], [-110, -30], [-45, -125]], gateE = gateT.map(t => { let b = 0, bd = 1e9; for (let i = 0; i < NV; i++) { const a = poly[i], c = poly[(i + 1) % NV], d = Math.hypot((a[0] + c[0]) / 2 - t[0], (a[1] + c[1]) / 2 - t[1]); if (d < bd) { bd = d; b = i; } } return b; });
  const gateP = gateE.map(i => { const a = poly[i], c = poly[(i + 1) % NV]; return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; });
  const roads = [], lanes = [];   // roads: ancho 6; lanes: 3.5
  gateP.forEach((G, k) => { const dx = G[0] - CC[0], dz = G[1] - CC[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, px = -uz, pz = ux, pts = [];
    for (let t = 0; t <= 1150; t += 35) { const w = Math.sin(t / 95 + k * 1.7) * 16 * Math.min(1, t / 120) + Math.sin(t / 37 + k) * 3; pts.push([G[0] + ux * t + px * w, G[1] + uz * t + pz * w]); }
    roads.push(pts); });
  roads.push([gateP[0], [3, 40], [-3, 15], [2, -10], [-2, -40], [1, -62], [0, -82]]);                           // cardo hasta la arx
  roads.push([gateP[2], [-80, -20], [-50, -10], [-22, -4], [4, 2], [35, -6], [65, -14], gateP[1]]);  // decumano
  roads.push([gateP[3], [-30, -105], [-15, -92], [0, -82]]);
  lanes.push([[-60, -60], [-35, -45], [-18, -25], [-4, 2]], [[50, -62], [32, -45], [18, -22], [4, 2]], [[-80, 20], [-50, 28], [-26, 26]], [[75, 28], [48, 28], [26, 24]], [[-48, -85], [-28, -70], [-12, -62]]);
  const dRoad = (x, z) => { let m = 1e9; for (const r of roads) for (let i = 0; i < r.length - 1; i++) m = Math.min(m, dSeg(x, z, r[i], r[i + 1])); return m; };
  const dLane = (x, z) => { let m = 1e9; for (const r of lanes) for (let i = 0; i < r.length - 1; i++) m = Math.min(m, dSeg(x, z, r[i], r[i + 1])); return m; };
  const inForo = (x, z) => x > -45 && x < 40 && z > 8 && z < 42;

  // ---- campos, arboledas y aldeas (posiciones fijas por semilla) ----
  const RF = mk(31), fields = [], groves = [], hamlets = [];
  for (let n = 0; n < 900 && fields.length < 120; n++) {
    const r = 150 + RF() * 420, a = RF() * 6.283, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    if (inPoly(cx, cz) || edgeD(cx, cz) < 34 || Math.hypot(cx - HC[0], cz - HC[1]) < 105 || dRoad(cx, cz) < 22) continue;
    const w = 34 + RF() * 50, h = 24 + RF() * 32, rad = Math.hypot(w, h) * 0.38;
    if (fields.some(f => Math.hypot(f.x - cx, f.z - cz) < f.rad + rad)) continue;
    const th = 0.4 + 0.5 * Math.sin(cx / 230) + 0.5 * Math.cos(cz / 190) + (RF() < 0.3 ? Math.PI / 2 : 0);
    fields.push({ x: cx, z: cz, w, h, th, rad, c: Math.floor(RF() * 100), grove: false });
  }
  fields.filter((f, i) => i % 15 === 4).forEach(f => { f.grove = true; groves.push(f); });
  for (let n = 0; n < 6; n++) { const a = RF() * 6.283, r = 220 + RF() * 230, x = Math.cos(a) * r, z = Math.sin(a) * r; if (dRoad(x, z) < 14 || fields.some(f => Math.hypot(f.x - x, f.z - z) < f.rad + 24)) { n--; if (RF() < 0.02) break; continue; } hamlets.push([x, z]); }

  const PAL = {
    roma: { grass: '#86a050', dry: ['#a3a65a', '#6f8d46', '#b4a65f'], city: '#a08c68', fields: ['#7f9d49', '#98ab55', '#c3a957', '#b59a4f', '#8a6b3f', '#a07e4b', '#c9b783', '#6f8f44'], road: '#b99f6f', plaza: '#b7ab91' },
    grie: { grass: '#939c64', dry: ['#a8a66e', '#808b58', '#b9ae7c'], city: '#b3a68a', fields: ['#a7a66a', '#b7ae72', '#cdbb83', '#9aa066', '#bba578', '#8c7d52', '#c4b68b'], road: '#c3b48c', plaza: '#d4cdb8' },
    puni: { grass: '#a69c5c', dry: ['#b8a864', '#9a8c4e', '#c7b478'], city: '#c2a578', fields: ['#c7a65a', '#d3b366', '#b58d48', '#c9b27a', '#9b7a40', '#a8bf5a', '#d6c488'], road: '#cdb27f', plaza: '#d9c9a0' }
  };
  function pintar(cul) {
    const P = PAL[cul], c = cvT.getContext('2d'), R = mk(99), X = x => (x / (SZ * 2) + 0.5) * TS, Zp = z => (z / (SZ * 2) + 0.5) * TS;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = P.grass; c.fillRect(0, 0, TS, TS);
    const cols = [P.grass, ...P.dry, '#5f7f3c'];
    for (let i = 0; i < 2600; i++) { c.globalAlpha = 0.08; c.fillStyle = cols[Math.floor(R() * cols.length)]; c.beginPath(); c.arc(R() * TS, R() * TS, 20 + R() * 70, 0, 7); c.fill(); }
    // laderas lejanas: matorral oliva; colina de la arx: roca y monte bajo
    { const gr = c.createRadialGradient(TS / 2, TS / 2, 330 * K, TS / 2, TS / 2, 760 * K); gr.addColorStop(0, 'rgba(120,128,82,0)'); gr.addColorStop(1, 'rgba(112,120,78,.6)'); c.globalAlpha = 1; c.fillStyle = gr; c.fillRect(0, 0, TS, TS);
      const gh = c.createRadialGradient(X(HC[0]), Zp(HC[1]), 10, X(HC[0]), Zp(HC[1]), 100 * K); gh.addColorStop(0, 'rgba(170,158,128,.8)'); gh.addColorStop(0.5, 'rgba(150,132,92,.5)'); gh.addColorStop(1, 'rgba(150,132,92,0)'); c.fillStyle = gh; c.fillRect(0, 0, TS, TS); }
    // campos
    for (const f of fields) {
      c.save(); c.translate(X(f.x), Zp(f.z)); c.rotate(f.th); const w = f.w * K, h = f.h * K;
      c.globalAlpha = 1; c.fillStyle = f.grove ? '#6a8240' : P.fields[f.c % P.fields.length]; c.fillRect(-w / 2, -h / 2, w, h);
      c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1; for (let u = -h / 2 + 4 * K; u < h / 2; u += 3.4 * K) { c.beginPath(); c.moveTo(-w / 2, u); c.lineTo(w / 2, u); c.stroke(); }
      if (f.grove) { c.fillStyle = 'rgba(40,55,25,.5)'; for (let u = -w / 2 + 5 * K; u < w / 2 - 3 * K; u += 9 * K) for (let v = -h / 2 + 5 * K; v < h / 2 - 3 * K; v += 9 * K) { c.beginPath(); c.arc(u, v, 2.4 * K, 0, 7); c.fill(); } }
      c.strokeStyle = 'rgba(55,70,30,.6)'; c.lineWidth = 1.6 * K; c.strokeRect(-w / 2, -h / 2, w, h); c.restore();
    }
    // suelo de la ciudad (tierra batida) y arrabales
    c.globalAlpha = 0.95; c.fillStyle = P.city; c.beginPath(); poly.forEach((p, i) => i ? c.lineTo(X(p[0]), Zp(p[1])) : c.moveTo(X(p[0]), Zp(p[1]))); c.closePath(); c.fill();
    c.globalAlpha = 0.5; c.fillStyle = P.city; for (let k = 0; k < 4; k++) for (let t = 20; t < 150; t += 8) { const r = roads[k], idx = Math.min(r.length - 1, Math.floor(t / 35) + 1), p = r[idx]; c.beginPath(); c.arc(X(p[0] + (R() - 0.5) * 30), Zp(p[1] + (R() - 0.5) * 30), (10 + R() * 14) * K, 0, 7); c.fill(); }
    for (const h of hamlets) { c.beginPath(); c.arc(X(h[0]), Zp(h[1]), 26 * K, 0, 7); c.fill(); }
    // caminos
    c.globalAlpha = 1; c.lineCap = c.lineJoin = 'round';
    const trazo = (r, w, col) => { c.strokeStyle = col; c.lineWidth = w * K; c.beginPath(); r.forEach((p, i) => i ? c.lineTo(X(p[0]), Zp(p[1])) : c.moveTo(X(p[0]), Zp(p[1]))); c.stroke(); };
    roads.forEach((r, k) => { const w = k < 4 ? 10 : 7.2; trazo(r, w, 'rgba(95,78,50,.5)'); trazo(r, w - 2, P.road); });
    for (const r of lanes) { trazo(r, 4.4, 'rgba(95,78,50,.45)'); trazo(r, 3.2, P.road); }
    // plaza del foro y explanada del templo
    c.fillStyle = P.plaza; c.beginPath(); c.ellipse(X(-3), Zp(31), 34 * K, 21 * K, 0.05, 0, 7); c.fill();
    c.fillStyle = P.plaza; c.beginPath(); c.arc(X(HC[0]), Zp(HC[1]), 25 * K, 0, 7); c.fill();
    // moteado fino
    for (let i = 0; i < 60000; i++) { c.globalAlpha = 0.1 + R() * 0.1; c.fillStyle = R() < 0.5 ? '#000' : '#fff'; c.fillRect(R() * TS, R() * TS, 1.5, 1.5); }
    c.globalAlpha = 1; tex.needsUpdate = true;
  }

  const CUL = {
    roma: { team: ['#b5532d', '#9b4a2e', '#a85b38'], real: 1, wall: '#c2ad86', roof: '#9a5636', tint: [1.0, 0.93, 0.82], temple: 'templo', ts: 1.25, ty: 0, foro: true, vesta: true },
    grie: { team: ['#b9573c', '#c46a48'], real: 0.6, wall: '#f1ebdb', roof: '#cf9370', tint: [1.5, 1.5, 1.45], temple: 'grie_templo', ts: 1.9, ty: 0, foro: false, vesta: false },
    puni: { team: ['#c9a468', '#bb9558', '#d2b078'], real: 0.35, wall: '#dcb67c', roof: '#bf9a66', flat: true, tint: [1.38, 1.2, 0.93], temple: 'cart_templo', ts: 1.6, ty: 0, foro: false, vesta: false }
  };
  let grupo = null;
  function poblar(cul) {
    const C = CUL[cul]; pintar(cul);
    if (grupo) sc.remove(grupo); grupo = new THREE.Group(); sc.add(grupo);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), M4 = (x, y, z, ry, s) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, ry), new THREE.Vector3(s, s, s));
    const R = mk(1234);
    // ---- casas dentro: rejilla torcida con calles, densidad mayor en el centro ----
    const casas = [], rot0 = 0.3, cs = Math.cos(rot0), sn = Math.sin(rot0), SP = 7.8;
    for (let j = -14; j <= 14; j++) for (let i = -14; i <= 14; i++) {
      if ((i + Math.floor(j / 3)) % 8 === 0) continue; if ((j + Math.floor(i / 4)) % 7 === 0 && R() < 0.7) continue;
      const gx = i * SP + 2.8 * Math.sin(j * 0.8 + i * 0.2) + (R() - 0.5) * 2.2, gz = j * SP + 2.8 * Math.cos(i * 0.7 - j * 0.15) + (R() - 0.5) * 2.2;
      const x = gx * cs - gz * sn, z = gx * sn + gz * cs - 30;
      if (!inPoly(x, z) || edgeD(x, z) < 8.5 || inForo(x, z) || Math.hypot(x - HC[0], z - HC[1]) < 25 || dRoad(x, z) < 6 || dLane(x, z) < 4.2) continue;
      const d = Math.hypot(x, z + 25); if (R() > 1.0 - 0.3 * Math.pow(d / 110, 1.6)) continue;
      const u0 = R(), kd = u0 < 0.17 * C.real ? 'casa' : u0 < 0.3 * C.real ? 'almacen' : 'fill', casa = kd === 'casa', s = casa ? 0.54 + 0.2 * R() : 0.78 + 0.2 * R(), ry = rot0 + 0.35 * Math.sin(x * 0.03 + z * 0.02) + (R() - 0.5) * 0.5 + (R() < 0.5 ? 0 : Math.PI / 2) + (R() < 0.5 ? 0 : Math.PI);
      casas.push({ x, z, ry, s, k: kd });
    }
    const dentro = casas.length;
    // ---- arrabales a lo largo de los caminos y aldeas ----
    for (let k = 0; k < 4; k++) { const r = roads[k]; for (let t = 25; t < 150; t += 8.5) { const idx = Math.floor(t / 35) + 1, a = r[idx], b = r[Math.min(r.length - 1, idx + 1)], f = (t % 35) / 35, px = a[0] + (b[0] - a[0]) * f, pz = a[1] + (b[1] - a[1]) * f, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const sd of [-1, 1]) { if (R() < 0.35) continue; const off = sd * (9 + R() * 14), x = px - Math.sin(ang) * off + (R() - 0.5) * 3, z = pz + Math.cos(ang) * off + (R() - 0.5) * 3; if (inPoly(x, z) || edgeD(x, z) < 13 || dRoad(x, z) < 6) continue; casas.push({ x, z, ry: -ang + (R() < 0.5 ? 0 : Math.PI) + (R() - 0.5) * 0.6, s: 0.7 + 0.2 * R(), k: R() < 1 - 0.35 * C.real ? 'fill' : 'almacen' }); } } }
    for (const h of hamlets) for (let i = 0; i < 9; i++) { const a = R() * 6.283, d = 4 + R() * 22; casas.push({ x: h[0] + Math.cos(a) * d, z: h[1] + Math.sin(a) * d, ry: R() * 6.283, s: 0.7 + 0.2 * R(), k: R() < 1 - 0.3 * C.real ? 'fill' : 'almacen' }); }
    const sub = casas.length - dentro;
    // instancias por tipo y tono de teja
    const col = new THREE.Color();
    for (const kind of ['casa', 'almacen']) { const buckets = C.team.map(() => []);
      casas.filter(c => c.k === kind).forEach(c => buckets[Math.floor(R() * C.team.length)].push(c));
      for (let b = 0; b < buckets.length; b++) { const L = buckets[b], inst = S.staticInstances(kind, L.map(c => M4(c.x, H(c.x, c.z) - 0.25, c.z, c.ry, c.s)), C.team[b]);
        if (inst) { inst.children.forEach(im => L.forEach((c, i) => { const v = 0.78 + 0.34 * R(); col.setRGB(C.tint[0] * v, C.tint[1] * v, C.tint[2] * v); im.setColorAt(i, col); })); inst.children.forEach(im => { if (im.instanceColor) im.instanceColor.needsUpdate = true; }); grupo.add(inst); } } }
    // relleno: casitas de volumen simple (caja de toba + tejado a dos aguas), invento de la maqueta, baratas en triángulos
    { const fl = casas.filter(c => c.k === 'fill'), bx = new THREE.BoxGeometry(1, 1, 1); bx.translate(0, 0.5, 0);
      const pr = new THREE.BufferGeometry(), V8 = [[-.6, 0, -.55], [.6, 0, -.55], [.6, 0, .55], [-.6, 0, .55], [-.6, .5, 0], [.6, .5, 0]], F = [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [0, 4, 3], [1, 2, 5]];
      pr.setAttribute('position', new THREE.Float32BufferAttribute(F.flat().flatMap(i => V8[i]), 3)); pr.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide, flatShading: true }), wI = new THREE.InstancedMesh(bx, mat, fl.length), rI = new THREE.InstancedMesh(pr, mat, fl.length), c1 = new THREE.Color();
      fl.forEach((c, i) => { const w = 5 + 2.8 * R(), d = 4.6 + 2.4 * R(), h = C.flat ? 3.0 + 1.0 * R() : 4.6 + 1.8 * R(), y = H(c.x, c.z) - 0.4;
        wI.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(c.x, y, c.z), q.setFromAxisAngle(up, c.ry), new THREE.Vector3(w, h + 0.4, d)));
        rI.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(c.x, y + h, c.z), q.setFromAxisAngle(up, c.ry), new THREE.Vector3(w * 1.06, C.flat ? 0.5 : 3.0, d * 1.1)));
        wI.setColorAt(i, c1.set(C.wall).multiplyScalar(0.82 + 0.3 * R())); rI.setColorAt(i, c1.set(C.roof).multiplyScalar(0.8 + 0.32 * R())); });
      wI.frustumCulled = rI.frustumCulled = false; grupo.add(wI, rI); }
    // ---- edificios públicos ----
    const edif = (k, x, z, ry, s) => { const m = S.staticMesh(k, C.team[0]); if (m) { m.position.set(x, H(x, z) - 0.2, z); m.rotation.y = ry; m.scale.setScalar(s); grupo.add(m); } };
    edif(C.temple, HC[0], HC[1], 0, C.ts);
    if (C.foro) { edif('foro', -12, 38, 0, 0.8); edif('mercado', 22, 28, Math.PI, 0.9); } else { edif('mercado', -14, 36, 0, 1.15); edif('mercado', 24, 28, Math.PI, 0.95); }
    if (C.vesta) edif('vesta', -33, 22, 0, 0.8);
    // ---- muralla irregular de toba: tramos de muro y puertas ----
    const wm = [], wsx = 0.0, hy = 0.82;
    for (let i = 0; i < NV; i++) {
      const a = poly[i], b = poly[(i + 1) % NV], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let n = Math.max(1, Math.round(L / 34)); if (gateE.includes(i) && n % 2 === 0) n++; if (gateE.includes(i) && n < 3) n = 3;
      const ang = -Math.atan2(b[1] - a[1], b[0] - a[0]), sx = L / n / 37.3 * 1.02;
      for (let s = 0; s < n; s++) { const f = (s + 0.5) / n, x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f, y = Math.min(H(x, z), H(a[0] + (b[0] - a[0]) * (s / n), a[1] + (b[1] - a[1]) * (s / n)), H(a[0] + (b[0] - a[0]) * ((s + 1) / n), a[1] + (b[1] - a[1]) * ((s + 1) / n))) - 2.2;
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, ang).clone(), new THREE.Vector3(sx, hy, 1));
        if (gateE.includes(i) && s === (n - 1) / 2) { const gt = S.staticMesh('puerta', C.team[0]); if (gt) { gt.position.set(x, y + 0.5, z); gt.rotation.y = ang; gt.scale.set(sx, hy, 1.15); grupo.add(gt); } } else wm.push(m); }
    }
    { const w = S.staticInstances('muro', wm, C.team[0]); if (w) grupo.add(w); }
    // ---- árboles ----
    const T = { olivo: [], cipres: [], algarrobo: [], pino: [] }, tr = (k, x, z, s) => T[k].push(M4(x, H(x, z) - 0.2, z, R() * 6.283, s));
    for (const f of groves) { const cs2 = Math.cos(f.th), sn2 = Math.sin(f.th); for (let u = -f.w / 2 + 6; u < f.w / 2 - 3; u += 11) for (let v = -f.h / 2 + 6; v < f.h / 2 - 3; v += 11) tr('olivo', f.x + u * cs2 - v * sn2 + (R() - 0.5) * 2, f.z + u * sn2 + v * cs2 + (R() - 0.5) * 2, 1.0 + R() * 0.5); }
    for (let n = 0; n < 4; n++) { const r = roads[n]; for (let t = 60; t < 480; t += 22) { if (R() < 0.45) continue; const idx = Math.floor(t / 35) + 1, p = r[idx], a2 = r[idx + 1], ang = Math.atan2(a2[1] - p[1], a2[0] - p[0]), sd = R() < 0.5 ? -1 : 1; tr('cipres', p[0] - Math.sin(ang) * sd * 8, p[1] + Math.cos(ang) * sd * 8, 1.4 + R() * 0.7); } }
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + R() * 0.4; tr('cipres', HC[0] + Math.cos(a) * 31, HC[1] + Math.sin(a) * 31, 1.6 + R() * 0.5); }
    for (let n = 0; n < 500 && T.algarrobo.length + T.olivo.length < 260; n++) { const r = 130 + R() * 380, a = R() * 6.283, x = Math.cos(a) * r, z = Math.sin(a) * r; if (inPoly(x, z) || edgeD(x, z) < 18 || dRoad(x, z) < 8) continue; if (R() < 0.6) tr('algarrobo', x, z, 1.2 + R() * 0.7); else tr('olivo', x, z, 1.1 + R() * 0.6); }
    for (let i = 0; i < 3; i++) { const a = 3.4 + R() * 2.2, r = 190 + R() * 80, x = HC[0] + Math.cos(a) * 80 + (R() - 0.5) * 60, z = HC[1] + Math.sin(a) * 80 - 60 + R() * 30; if (!inPoly(x, z) && dRoad(x, z) > 10 && edgeD(x, z) > 12) tr('pino', x, z, 1.4 + R() * 0.5); }
    for (const k in T) { const t = S.staticInstances(k, T[k]); if (t) grupo.add(t); }
    // ---- humo de hogares ----
    const hc = document.createElement('canvas'); hc.width = hc.height = 64; { const c = hc.getContext('2d'), gr = c.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }
    const ht = new THREE.CanvasTexture(hc), cent = casas.slice(0, dentro).filter(c => Math.hypot(c.x, c.z + 20) < 95);
    for (let i = 0; i < 18 && cent.length; i++) { const c = cent[Math.floor(R() * cent.length)], y0 = H(c.x, c.z) + 8 * c.s * 1.6; for (let k = 0; k < 4; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht, color: '#d9d4c8', transparent: true, opacity: 0.6 - k * 0.12, depthWrite: false })); sp.scale.setScalar(5 + k * 3.4); sp.position.set(c.x + k * 1.6, y0 + 1 + k * 5.5, c.z + k * 0.8); grupo.add(sp); } }
    return { dentro, sub, fields: fields.length, groves: groves.length, hamlets: hamlets.length, muros: wm.length };
  }
  window.__M = { poblar };
  return 'ok';
}

async function main() {
  await mkdir(SALIDA, { recursive: true });
  const srv = await servidor(), url = 'http://127.0.0.1:' + srv.address().port + '/';
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const errores = [];
  page.setDefaultTimeout(600000);
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message.slice(0, 200)));
  const t0 = Date.now(), log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
  const cam = async (d, p, y, gx, gz) => { await page.evaluate(([d, p, y, gx, gz]) => { const V = UI.cityV; V.c.dist = d; V.c.pitch = p; V.c.yaw = y; V.goal = { x: gx, z: gz }; V.tg = { x: gx, z: gz }; }, [d, p, y, gx, gz]); await page.waitForTimeout(7000); };
  const foto = async nombre => {
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const tri = await page.evaluate(() => UI.cityV.r.info.render.triangles);
    if (process.env.DESGLOSE) console.log(JSON.stringify(await page.evaluate(() => { const o = {}; UI.cityV.scene.traverse(m => { if (!m.isMesh) return; const g = m.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1), k = (m.isInstancedMesh ? 'I:' : 'M:') + (m.material.map && m.material.map.image && m.material.map.image.src || '').split('/').pop() + '/' + g.attributes.position.count; o[k] = (o[k] || 0) + Math.round(n); }); return o; })));
    await page.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 80, timeout: 600000 }); log(nombre, 'triángulos:', tri); return tri;
  };
  try {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('#menu [data-act="new"]', { timeout: 60000 });
    await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
    for (let i = 0; i < 12; i++) { const b = page.locator('#modal:not([hidden]) [data-act="close"]').first(); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(120); }
    await page.waitForTimeout(10000);   // modelos
    log('partida lista');
    const sel = (process.env.SOLO || '').split(',').filter(Boolean), quiere = n => !sel.length || sel.includes(n);
    if (quiere('0')) { await cam(250, 0.55, 0.5, 0, -10); await foto('Q1b-0-antes-cerca.jpg'); await cam(640, 0.4, 0.5, 0, 10); await foto('Q1b-0-antes-lejos.jpg'); }
    log(await page.evaluate(enPagina));
    const tris = {};
    for (const [cul, caps] of [['roma', ['1', '2']], ['grie', ['3']], ['puni', ['4']]]) {
      if (!caps.some(quiere)) continue;
      log('poblar', cul, JSON.stringify(await page.evaluate(c => window.__M.poblar(c), cul)));
      if (cul === 'roma') {
        if (quiere('1')) { await cam(250, 0.55, 0.5, 0, -20); tris.cerca = await foto('Q1b-1-romana-cerca.jpg'); }
        if (quiere('2')) { await cam(640, 0.36, 0.5, 0, -40); tris.lejos = await foto('Q1b-2-romana-lejos.jpg'); }
      } else { await cam(280, 0.5, 0.5, 0, -20); tris[cul] = await foto(cul === 'grie' ? 'Q1b-3-griega.jpg' : 'Q1b-4-punica.jpg'); }
    }
    log('triángulos máx:', Math.max(0, ...Object.values(tris)));
  } finally { await br.close(); srv.close(); }
  console.log(errores.length ? 'ERRORES DE CONSOLA:\n' + errores.join('\n') : 'Sin errores de consola. Capturas en ' + SALIDA);
}
main().catch(e => { console.error(e); process.exit(1); });
