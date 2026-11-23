// Convierte un .glb sencillo (una malla, una textura aparte) al formato de assets/static: <clave>.bin + entrada en static.json.
// Uso: node tools/glb_a_static.mjs <modelo.glb> <clave> <textura.webp> [carpeta=assets/static]
// Para arte PROPIO hecho en Blender (UR2). Formato «antiguo» de statics.js: sin índices, posiciones y UV a 32 bits, normales a 8.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, basename } from 'node:path';
const [glb, clave, tex, dest = 'assets/static'] = process.argv.slice(2);
if (!glb || !clave || !tex) { console.error('Uso: node tools/glb_a_static.mjs <modelo.glb> <clave> <textura.webp> [carpeta]'); process.exit(2); }
const b = readFileSync(glb), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('No es un .glb');
let o = 12, json = null, bin = null;
while (o < b.length) { const n = dv.getUint32(o, true), t = dv.getUint32(o + 4, true), d = b.subarray(o + 8, o + 8 + n); if (t === 0x4e4f534a) json = JSON.parse(d.toString('utf8')); else if (t === 0x004e4942) bin = d; o += 8 + n; }
const lee = i => { const a = json.accessors[i], v = json.bufferViews[a.bufferView], nc = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type], T = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array }[a.componentType];
  const ini = bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0), copia = bin.buffer.slice(ini, ini + a.count * nc * T.BYTES_PER_ELEMENT); return { d: new T(copia), nc, n: a.count }; };
const P = [], N = [], U = [];
for (const m of json.meshes) for (const pr of m.primitives) { const p = lee(pr.attributes.POSITION), n = lee(pr.attributes.NORMAL), u = lee(pr.attributes.TEXCOORD_0), ix = pr.indices !== undefined ? lee(pr.indices).d : Uint32Array.from({ length: p.n }, (_, i) => i);
  for (const i of ix) { P.push(p.d[i * 3], p.d[i * 3 + 1], p.d[i * 3 + 2]); N.push(n.d[i * 3], n.d[i * 3 + 1], n.d[i * 3 + 2]); U.push(u.d[i * 2], u.d[i * 2 + 1]); } }
const nv = P.length / 3, al4 = x => (x + 3) & ~3, o1 = nv * 12, o2 = al4(o1 + nv * 3), out = Buffer.alloc(o2 + nv * 8);
new Float32Array(out.buffer, out.byteOffset, nv * 3).set(P); new Int8Array(out.buffer, out.byteOffset + o1, nv * 3).set(N.map(v => Math.max(-127, Math.min(127, Math.round(v * 127)))));
for (let i = 0; i < nv * 2; i++) out.writeFloatLE(U[i], o2 + i * 4);
const bb = [0, 1, 2].map(k => Math.min(...P.filter((_, i) => i % 3 === k))).concat([0, 1, 2].map(k => Math.max(...P.filter((_, i) => i % 3 === k)))).map(v => Math.round(v * 100) / 100);
writeFileSync(join(dest, clave + '.bin'), out); copyFileSync(tex, join(dest, basename(tex)));
const jf = join(dest, 'static.json'), idx = JSON.parse(readFileSync(jf, 'utf8'));
idx[clave] = { verts: nv, groups: [{ mode: 0, start: 0, count: nv, file: basename(tex) }], bb, off: [0, o1, o2], propia: true };
writeFileSync(jf, JSON.stringify(idx)); console.log(clave + ': ' + nv / 3 + ' triángulos, ' + out.length + ' bytes, caja ' + bb.join(' '));
