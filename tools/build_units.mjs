/* Convierte unidades de 0 A.D. (Collada: cuerpo con esqueleto + piezas + animaciones) al formato compacto del juego.
   Uso: node tools/build_units.mjs <art de 0 A.D.> <manifest.json> <three/examples/jsm> <salida>
   El trabajo 3D se hace en Chromium (Playwright) con el ColladaLoader de three.js.
   Arte: Wildfire Games (0 A.D.), CC BY-SA 3.0. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [art, manifestPath, jsm, out] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const TYPES = { '.js': 'text/javascript', '.dae': 'text/xml', '.html': 'text/html', '.png': 'image/png' };

const PAGE = `<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/vendor/three.module.min.js"}}</script>
<script type="module">
import * as THREE from 'three';
import { ColladaLoader } from '/jsm/loaders/ColladaLoader.js';
const loader = new ColladaLoader(), cache = new Map();
const dae = p => { if (!cache.has(p)) cache.set(p, loader.loadAsync('/art/' + p)); return cache.get(p); };
// 0 A.D. no aplica la unidad del archivo (hay piezas en pulgadas): se deshace el giro de ejes y también la escala
const rotInv = sc => new THREE.Matrix4().makeScale(1 / sc.scale.x, 1 / sc.scale.y, 1 / sc.scale.z).multiply(new THREE.Matrix4().makeRotationFromQuaternion(sc.quaternion).invert());
const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
const MODE = m => /^player/.test(m || '') ? 1 : /trans/.test(m || '') ? 2 : 0;

window.build = async function (key, unit) {
  const log = [];
  const P = [], N = [], UV = [], SI = [], SW = [], MD = [], CELL = [], cells = [];   // por vértice
  const slots = [], slotOf = new Map(), rigs = [];                                   // huesos horneados y esqueletos (montura, jinete…)
  const slot = (rig, name, raw) => { const k = rig + (raw ? '|R:' : '|S:') + name; if (!slotOf.has(k)) { slotOf.set(k, slots.length); slots.push({ rig, name, raw }); } return slotOf.get(k); };
  const cell = (tex, big) => { let i = cells.findIndex(c => c.tex === tex); if (i < 0) { i = cells.length; cells.push({ tex, big: !!big }); } return i; };
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const each = (geo, fn) => { const idx = geo.index; const cnt = idx ? idx.count : geo.attributes.position.count; for (let i = 0; i < cnt; i++) fn(idx ? idx.getX(i) : i); };
  const isRig = p => p.mesh && p.mesh.startsWith('skeletal/') && Object.keys(p.anims || {}).length > 0;

  // pieza rígida enganchada a un hueso
  async function prop(p, sl, L) {
    let sc = null, Ri = null;
    if (p.mesh) {
      const col = await dae('meshes/' + p.mesh); sc = col.scene; sc.updateMatrixWorld(true); Ri = rotInv(sc);
      const c = cell(p.tex, false), md = MODE(p.material);
      sc.traverse(o => { if (!o.isMesh) return; const T = new THREE.Matrix4().multiplyMatrices(L, new THREE.Matrix4().multiplyMatrices(Ri, o.matrixWorld)), nm = new THREE.Matrix3().getNormalMatrix(T), g = o.geometry;
        each(g, i => { v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(T); if (g.attributes.normal) n.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(nm).normalize(); else n.set(0, 1, 0);
          P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); UV.push(g.attributes.uv ? g.attributes.uv.getX(i) : 0, g.attributes.uv ? g.attributes.uv.getY(i) : 0); SI.push(sl, 0, 0, 0); SW.push(1, 0, 0, 0); MD.push(md); CELL.push(c); }); });
    }
    for (const ch of p.props || []) {
      let L2 = L;
      if (ch.attach !== 'root' && sc) { let nd = null; sc.traverse(o => { if (!nd && ['prop-' + ch.attach, 'prop_' + ch.attach].includes(o.name)) nd = o; }); if (nd) L2 = new THREE.Matrix4().multiplyMatrices(L, new THREE.Matrix4().multiplyMatrices(Ri, nd.matrixWorld)); }
      await prop(ch, sl, L2);
    }
  }

  // cuerpo con esqueleto; un jinete es otro esqueleto colgado de un hueso de la montura
  async function rig(u, parent, parentJoint) {
    const body = await dae('meshes/' + u.mesh); body.scene.updateMatrixWorld(true);
    let sk = null; body.scene.traverse(o => { if (o.isSkinnedMesh && !sk) sk = o; });
    if (!sk) throw new Error('sin malla con esqueleto: ' + u.mesh);
    const bones = sk.skeleton.bones, byName = new Map(bones.map((b, i) => [b.name, i])), id = rigs.length;
    rigs.push({ u, bones, byName, IB: sk.skeleton.boneInverses, parent, parentJoint });
    const g = sk.geometry, bm = sk.bindMatrix, nm = new THREE.Matrix3().getNormalMatrix(bm), c = cell(u.tex, true), md = MODE(u.material);
    each(g, i => {
      v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(bm); n.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(nm).normalize();
      P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); UV.push(g.attributes.uv ? g.attributes.uv.getX(i) : 0, g.attributes.uv ? g.attributes.uv.getY(i) : 0);
      const w = [0, 1, 2, 3].map(k => [g.attributes.skinIndex.getComponent(i, k), g.attributes.skinWeight.getComponent(i, k)]).sort((a, b) => b[1] - a[1]);
      const tot = w.reduce((s, x) => s + x[1], 0) || 1;
      for (const [bi, bw] of w) { SI.push(bw > 0 ? slot(id, bones[bi].name, false) : 0); SW.push(bw / tot); }
      MD.push(md); CELL.push(c);
    });
    const findJoint = ap => ['prop-' + ap, 'prop_' + ap, ap].find(nm2 => byName.has(nm2));
    for (const p of u.props || []) {
      const j = findJoint(p.attach); if (!j) { if (p.attach !== 'root') log.push('sin enganche ' + p.attach); continue; }
      try { if (isRig(p)) await rig(p, id, j); else await prop(p, slot(id, j, true), new THREE.Matrix4()); } catch (e) { log.push('pieza ' + p.actor + ': ' + e.message); }
    }
    return id;
  }
  await rig(unit, -1, null);

  // animaciones -> matrices 3x4 por hueso y fotograma. Cada esqueleto usa su clip del mismo nombre (o el de reposo)
  const clips = {}, rows = [], names = [];
  for (const nm of ['idle', 'walk', 'run', 'attack_melee', 'attack_ranged', 'death']) { const k = Math.max(...rigs.map(r => (r.u.anims[nm] || []).length)); for (let q = 0; q < k; q++) names.push([nm, q]); }
  const X = rigs.map(() => new THREE.Matrix4()), M = new THREE.Matrix4();
  for (const [name, q] of names) {
    const st = [];
    for (const r of rigs) {
      const files = r.u.anims[name] || r.u.anims.idle || Object.values(r.u.anims)[0], file = files[Math.min(q, files.length - 1)];
      const col = await dae('animation/' + file), sc = col.scene, clip = sc.animations && sc.animations[0];
      if (!clip) { log.push('sin clip ' + file); st.push(null); continue; }
      const joints = new Map(); sc.traverse(o => { if (o.isBone && !joints.has(o.name)) joints.set(o.name, o); });
      const mixer = new THREE.AnimationMixer(sc); mixer.clipAction(clip).play();
      st.push({ sc, clip, joints, mixer, Ri: rotInv(sc), own: !!r.u.anims[name] });
    }
    if (!st[0]) continue;
    const lead = st.find(x => x && x.own) || st[0], loop = name !== 'death' && !/^attack/.test(name), frames = Math.max(2, Math.min(70, Math.round(lead.clip.duration * 30)));
    const start = rows.length / (slots.length * 12);
    for (let f = 0; f < frames; f++) {
      const ph = loop ? f / frames : Math.min(0.999, f / (frames - 1));
      rigs.forEach((r, ri) => { const a = st[ri]; if (!a) return; a.mixer.setTime(a.clip.duration * ph); a.sc.updateMatrixWorld(true);
        if (r.parent < 0) X[ri].identity(); else { const pa = st[r.parent], pj = pa && pa.joints.get(r.parentJoint); X[ri].copy(X[r.parent]); if (pj) X[ri].multiply(pj.matrixWorld); X[ri].multiply(a.Ri); } });
      for (const s of slots) { const a = st[s.rig], j = a && a.joints.get(s.name); if (!j) { rows.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0); continue; }
        M.multiplyMatrices(X[s.rig], j.matrixWorld); if (!s.raw) M.multiply(rigs[s.rig].IB[rigs[s.rig].byName.get(s.name)]);
        const e = M.elements; rows.push(e[0], e[4], e[8], e[12], e[1], e[5], e[9], e[13], e[2], e[6], e[10], e[14]); }
    }
    for (const a of st) if (a) { a.mixer.stopAllAction(); a.mixer.uncacheRoot(a.sc); }
    clips[name + (q ? q + 1 : '')] = { start, frames, dur: +lead.clip.duration.toFixed(3), loop };
  }

  let minY = 1e9, maxY = -1e9; { const base = clips.idle ? clips.idle.start : 0, R = rows;
    for (let i = 0; i < P.length / 3; i += 7) { const sl = SI[i * 4], o = (base * slots.length + sl) * 12; const y = R[o + 4] * P[i * 3] + R[o + 5] * P[i * 3 + 1] + R[o + 6] * P[i * 3 + 2] + R[o + 7]; if (SW[i * 4] > 0.6) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); } } }
  return { key, log, verts: P.length / 3, slots: slots.length, frames: rows.length / (slots.length * 12), clips, cells, minY, maxY,
    P: b64(new Float32Array(P).buffer), N: b64(new Int8Array(N.map(x => Math.round(x * 127))).buffer), UV: b64(new Float32Array(UV).buffer),
    SI: b64(new Uint8Array(SI).buffer), SW: b64(new Uint8Array(SW.map(x => Math.round(x * 255))).buffer), MD: b64(new Uint8Array(MD).buffer), CELL: b64(new Uint8Array(CELL).buffer),
    A: b64(new Float32Array(rows).buffer) };
};
window.ready = true;
</script>`;

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let f = null;
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  if (u.startsWith('/vendor/')) f = path.join(root, 'js', u);
  else if (u.startsWith('/jsm/')) f = path.join(jsm, u.slice(5));
  else if (u.startsWith('/art/')) f = path.join(art, u.slice(5));
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
  try {
    const r = await page.evaluate(([k, u]) => window.build(k, u), [key, manifest[key]]);
    const parts = ['P', 'N', 'UV', 'SI', 'SW', 'MD', 'CELL', 'A'].map(n => Buffer.from(r[n], 'base64')), off = []; let o = 0;
    for (const p of parts) { off.push(o); o += p.length; o += (4 - o % 4) % 4; }
    const bin = Buffer.alloc(o); parts.forEach((p, i) => p.copy(bin, off[i]));
    fs.writeFileSync(path.join(out, key + '.bin'), bin);
    index[key] = { verts: r.verts, slots: r.slots, frames: r.frames, clips: r.clips, cells: r.cells, minY: r.minY, maxY: r.maxY, off, actor: manifest[key].actor };
    console.log(key.padEnd(10), 'tris', String(r.verts / 3).padStart(5), 'huesos', r.slots, 'fotogramas', r.frames, 'celdas', r.cells.length, (bin.length / 1024 | 0) + ' KB', r.log.join('; '));
  } catch (e) { console.error(key, 'ERROR', e.message.split('\n')[0]); }
}
fs.writeFileSync(path.join(out, 'units.json'), JSON.stringify(index));
await browser.close(); server.close();
