/* Aligera las piezas de assets/static sin perder aspecto: guarda cada vértice una sola vez (con índices) y las posiciones
   y coordenadas de textura a 16 bits (reparto uniforme dentro de la caja de la pieza). Lo lee js/gfx/statics.js.
   Uso: node tools/indexar_static.mjs [carpeta con static.json]   (por defecto assets/static). Se puede repetir: salta lo ya hecho.
   Si se vuelve a generar una pieza con build_static.mjs o aligerar_static.mjs (formato antiguo), hay que pasar esto de nuevo.
   Formato nuevo (campo "nv" en el índice): [posiciones u16 ×3][normales i8 ×3][uv u16 ×2][uv1 u16 ×2?][índices u16 o u32], cada bloque alineado a 4.
   "q" = [mín x,y,z, tamaño x,y,z, mín u,v, tamaño u,v, mín u1,v1, tamaño u1,v1]. "verts" sigue siendo triángulos×3 (lo usa arte.mjs). */
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2] || 'assets/static', ij = path.join(dir, 'static.json'), idx = JSON.parse(fs.readFileSync(ij, 'utf8'));
let antes = 0, despues = 0;
const rango = (a, k, d) => { let lo = Infinity, hi = -Infinity; for (let i = k; i < a.length; i += d) { if (a[i] < lo) lo = a[i]; if (a[i] > hi) hi = a[i]; } return [lo, Math.max(hi - lo, 1e-6)]; };
const cuant = (v, lo, s) => Math.max(0, Math.min(65535, Math.round((v - lo) / s * 65535)));
for (const [key, u] of Object.entries(idx)) {
  if (!u.off || u.nv !== undefined) continue;
  const f = path.join(dir, key + '.bin'), buf = fs.readFileSync(f), ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length), n = u.verts;
  const P = new Float32Array(ab, u.off[0], n * 3), N = new Int8Array(ab, u.off[1], n * 3), UV = new Float32Array(ab, u.off[2], n * 2), UV1 = u.off[3] !== undefined ? new Float32Array(ab, u.off[3], n * 2) : null;
  const q = []; for (let c = 0; c < 3; c++) q.push(rango(P, c, 3)); const qp = [q[0][0], q[1][0], q[2][0], q[0][1], q[1][1], q[2][1]];
  const ru = [rango(UV, 0, 2), rango(UV, 1, 2)]; qp.push(ru[0][0], ru[1][0], ru[0][1], ru[1][1]);
  if (UV1) { const r1 = [rango(UV1, 0, 2), rango(UV1, 1, 2)]; qp.push(r1[0][0], r1[1][0], r1[0][1], r1[1][1]); }
  const m = new Map(), pos = [], nor = [], uv = [], uv1 = [], groups = []; const ix = [];
  for (const g of u.groups) {
    const start = ix.length;
    for (let i = g.start; i < g.start + g.count; i++) {
      const p = [cuant(P[i * 3], qp[0], qp[3]), cuant(P[i * 3 + 1], qp[1], qp[4]), cuant(P[i * 3 + 2], qp[2], qp[5])], t = [cuant(UV[i * 2], qp[6], qp[8]), cuant(UV[i * 2 + 1], qp[7], qp[9])];
      const t1 = UV1 ? [cuant(UV1[i * 2], qp[10], qp[12]), cuant(UV1[i * 2 + 1], qp[11], qp[13])] : [];
      const k = p.join() + '|' + N[i * 3] + ',' + N[i * 3 + 1] + ',' + N[i * 3 + 2] + '|' + t.join() + '|' + t1.join();
      let v = m.get(k); if (v === undefined) { v = pos.length / 3; m.set(k, v); pos.push(...p); nor.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); uv.push(...t); if (UV1) uv1.push(...t1); }
      ix.push(v);
    }
    groups.push(Object.assign({}, g, { start, count: ix.length - start }));
  }
  const nv = pos.length / 3, parts = [new Uint16Array(pos), new Int8Array(nor), new Uint16Array(uv)]; if (UV1) parts.push(new Uint16Array(uv1));
  parts.push(nv < 65536 ? new Uint16Array(ix) : new Uint32Array(ix));
  const off = []; let o = 0; const bufs = parts.map(p => Buffer.from(p.buffer, p.byteOffset, p.byteLength)); for (const b of bufs) { off.push(o); o += b.length; o += (4 - o % 4) % 4; }
  const bin = Buffer.alloc(o); bufs.forEach((b, i) => b.copy(bin, off[i]));
  fs.writeFileSync(f, bin); idx[key] = Object.assign({}, u, { groups, off, nv, q: qp.map(x => +x.toPrecision(9)), i32: nv >= 65536 ? 1 : undefined });
  antes += buf.length; despues += bin.length;
  console.log(key.padEnd(18), (buf.length / 1024 | 0) + ' KB →', (bin.length / 1024 | 0) + ' KB', ' vértices', n, '→', nv);
}
fs.writeFileSync(ij, JSON.stringify(idx));
console.log('Total', (antes / 1048576).toFixed(2), 'MB →', (despues / 1048576).toFixed(2), 'MB');
