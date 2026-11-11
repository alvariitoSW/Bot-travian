/* Convierte actores estáticos de 0 A.D. (edificios, murallas, árboles) al formato del juego: una malla por textura.
   Uso: node tools/build_static.mjs <art de 0 A.D.> <manifest.json> <three/examples/jsm> <salida>
   Arte: Wildfire Games (0 A.D.), CC BY-SA 3.0. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [art, manifestPath, jsm, out] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const TYPES = { '.js': 'text/javascript', '.dae': 'text/xml' };

const PAGE = `<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/vendor/three.module.min.js"}}</script>
<script type="module">
import * as THREE from 'three';
import { ColladaLoader } from '/jsm/loaders/ColladaLoader.js';
const loader = new ColladaLoader(), cache = new Map();
const dae = p => { if (!cache.has(p)) cache.set(p, loader.loadAsync('/art/' + p)); return cache.get(p); };
const rotInv = sc => new THREE.Matrix4().makeScale(1 / sc.scale.x, 1 / sc.scale.y, 1 / sc.scale.z).multiply(new THREE.Matrix4().makeRotationFromQuaternion(sc.quaternion).invert());
const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
const MODE = m => (m || '').startsWith('player') ? 1 : (m || '').startsWith('basic_trans') ? 2 : 0;
window.build = async function (key, node) {
  const groups = new Map(), log = [], v = new THREE.Vector3(), n = new THREE.Vector3();
  const each = (geo, fn) => { const idx = geo.index; const cnt = idx ? idx.count : geo.attributes.position.count; for (let i = 0; i < cnt; i++) fn(idx ? idx.getX(i) : i); };
  async function emit(p, L) {
    let sc = null, Ri = null;
    if (p.mesh) {
      const col = await dae('meshes/' + p.mesh); sc = col.scene; sc.updateMatrixWorld(true); Ri = rotInv(sc);
      const gk = (p.tex || '') + '|' + MODE(p.material) + '|' + (p.ao || ''); if (!groups.has(gk)) groups.set(gk, { tex: p.tex, ao: p.ao || null, norm: p.norm || null, spec: p.spec || null, mode: MODE(p.material), P: [], N: [], UV: [], UV1: [] });
      const G = groups.get(gk);
      sc.traverse(o => { if (!o.isMesh) return; const T = new THREE.Matrix4().multiplyMatrices(L, new THREE.Matrix4().multiplyMatrices(Ri, o.matrixWorld)); if (o.isSkinnedMesh) T.multiply(o.bindMatrix);
        const nm = new THREE.Matrix3().getNormalMatrix(T), g = o.geometry;
        each(g, i => { v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(T); if (g.attributes.normal) n.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(nm).normalize(); else n.set(0, 0, 1);
          G.P.push(v.x, v.z, -v.y); G.N.push(n.x, n.z, -n.y); G.UV.push(g.attributes.uv ? g.attributes.uv.getX(i) : 0, g.attributes.uv ? 1 - g.attributes.uv.getY(i) : 0); const u1 = g.attributes.uv1 || g.attributes.uv; G.UV1.push(u1 ? u1.getX(i) : 0, u1 ? 1 - u1.getY(i) : 0); }); });
    }
    for (const ch of p.props || []) {
      let L2 = L;
      if (ch.attach !== 'root' && sc) { let nd = null; sc.traverse(o => { if (!nd && ['prop-' + ch.attach, 'prop_' + ch.attach].includes(o.name)) nd = o; }); if (nd) L2 = new THREE.Matrix4().multiplyMatrices(L, new THREE.Matrix4().multiplyMatrices(Ri, nd.matrixWorld)); else { log.push('sin enganche ' + ch.attach); continue; } }
      try { await emit(ch, L2); } catch (e) { log.push(ch.actor + ': ' + e.message); }
    }
  }
  await emit(node, new THREE.Matrix4());
  const P = [], N = [], UV = [], UV1 = [], gs = []; const bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (const G of groups.values()) { if (!G.P.length) continue; gs.push({ tex: G.tex, ao: G.ao, norm: G.norm, spec: G.spec, mode: G.mode, start: P.length / 3, count: G.P.length / 3 }); for (const x of G.P) P.push(x); for (const x of G.N) N.push(x); for (const x of G.UV) UV.push(x); for (const x of G.UV1) UV1.push(x); }
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { bb[k] = Math.min(bb[k], P[i + k]); bb[k + 3] = Math.max(bb[k + 3], P[i + k]); }
  return { log, verts: P.length / 3, groups: gs, bb: bb.map(x => +x.toFixed(2)), P: b64(new Float32Array(P).buffer), N: b64(new Int8Array(N.map(x => Math.round(x * 127))).buffer), UV: b64(new Float32Array(UV).buffer), UV1: b64(new Float32Array(UV1).buffer) };
};
window.ready = true;
</script>`;

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]); let f = null;
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  if (u.startsWith('/vendor/')) f = path.join(root, 'js', u); else if (u.startsWith('/jsm/')) f = path.join(jsm, u.slice(5)); else if (u.startsWith('/art/')) f = path.join(art, u.slice(5));
  if (!f || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch(), page = await browser.newPage();
page.on('pageerror', e => console.error('PAGE', e.message));
await page.goto('http://localhost:' + server.address().port + '/'); await page.waitForFunction('window.ready');
fs.mkdirSync(out, { recursive: true });
const index = {};
for (const key of Object.keys(manifest)) {
  if (key.startsWith('__')) continue;
  try {
    const r = await page.evaluate(([k, u]) => window.build(k, u), [key, manifest[key]]);
    const parts = ['P', 'N', 'UV', 'UV1'].map(n => Buffer.from(r[n], 'base64')), off = []; let o = 0;
    for (const p of parts) { off.push(o); o += p.length; o += (4 - o % 4) % 4; }
    const bin = Buffer.alloc(o); parts.forEach((p, i) => p.copy(bin, off[i]));
    fs.writeFileSync(path.join(out, key + '.bin'), bin);
    index[key] = { verts: r.verts, groups: r.groups, bb: r.bb, off, actor: manifest[key].actor };
    console.log(key.padEnd(11), 'tris', String(r.verts / 3).padStart(6), 'texturas', r.groups.length, 'caja', r.bb.join(' '), (bin.length / 1024 | 0) + ' KB', r.log.slice(0, 3).join('; '));
  } catch (e) { console.error(key, 'ERROR', e.message.split('\n')[0]); }
}
index.__extra = manifest.__extra || {};
fs.writeFileSync(path.join(out, 'static.json'), JSON.stringify(index));
await browser.close(); server.close();
