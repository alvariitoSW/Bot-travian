/* Aligera y reescala una pieza de assets/static: suelda vértices, simplifica con meshoptimizer (MIT) y reescribe el .bin.
   Uso: NODE_PATH=<carpeta con meshoptimizer> node tools/aligerar_static.mjs <carpeta con static.json> <clave> <triángulos que quedan> [escala]
   Hace falta cuando una pieza de 0 A.D. pasa del tope de triángulos por edificio (gobierno/arte.json). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [dir, key, target, esc] = process.argv.slice(2), S = +(esc || 1);
const { MeshoptSimplifier: M } = createRequire(import.meta.url)('meshoptimizer'); await M.ready;
const ij = path.join(dir, 'static.json'), idx = JSON.parse(fs.readFileSync(ij, 'utf8')), u = idx[key];
const buf = fs.readFileSync(path.join(dir, key + '.bin')), ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length), n = u.verts;
const P = new Float32Array(ab, u.off[0], n * 3), N = new Int8Array(ab, u.off[1], n * 3), UV = new Float32Array(ab, u.off[2], n * 2), UV1 = u.off[3] !== undefined ? new Float32Array(ab, u.off[3], n * 2) : null;
const nuevo = [], groups = []; let verts = 0, P2 = [], N2 = [], UV2 = [], UV12 = [];
for (const g of u.groups) {
  const m = new Map(), pos = [], at = [], ix = [], src = [];
  for (let i = g.start; i < g.start + g.count; i++) {
    const k = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2], UV[i * 2], UV[i * 2 + 1], UV1 ? UV1[i * 2] : 0, UV1 ? UV1[i * 2 + 1] : 0].join(',');
    let v = m.get(k); if (v === undefined) { v = pos.length / 3; m.set(k, v); pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); at.push(N[i * 3] / 127, N[i * 3 + 1] / 127, N[i * 3 + 2] / 127, UV[i * 2], UV[i * 2 + 1], UV1 ? UV1[i * 2] : 0, UV1 ? UV1[i * 2 + 1] : 0); src.push(i); }
    ix.push(v);
  }
  const share = g.count / n, want = Math.round(+target * 3 * share / 3) * 3;
  const [out] = M.simplifyWithAttributes(new Uint32Array(ix), new Float32Array(pos), 3, new Float32Array(at), 7, [1, 1, 1, 4, 4, 2, 2], null, want, 0.02, ['Prune']);
  groups.push(Object.assign({}, g, { start: verts, count: out.length })); verts += out.length;
  for (const v of out) { const i = src[v]; P2.push(pos[v * 3] * S, pos[v * 3 + 1] * S, pos[v * 3 + 2] * S); N2.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); UV2.push(UV[i * 2], UV[i * 2 + 1]); UV12.push(UV1 ? UV1[i * 2] : 0, UV1 ? UV1[i * 2 + 1] : 0); }
}
const parts = [new Float32Array(P2), new Int8Array(N2), new Float32Array(UV2)]; if (UV1) parts.push(new Float32Array(UV12));
const off = []; let o = 0; const bufs = parts.map(p => Buffer.from(p.buffer)); for (const b of bufs) { off.push(o); o += b.length; o += (4 - o % 4) % 4; }
const bin = Buffer.alloc(o); bufs.forEach((b, i) => b.copy(bin, off[i])); fs.writeFileSync(path.join(dir, key + '.bin'), bin);
idx[key] = Object.assign({}, u, { verts, groups, off, bb: u.bb.map(x => +(x * S).toFixed(2)) }); fs.writeFileSync(ij, JSON.stringify(idx));
console.log(key, 'triángulos', n / 3, '→', verts / 3, 'escala', S, (bin.length / 1024 | 0) + ' KB');
