#!/usr/bin/env node
// Aligera el templo y la curia que Meshy hizo con aspecto griego (CD7) y los deja en assets/edificios-griegos/.
// En el juego: templo griego y bouleuterion de las ciudades de cultura 'grie' (js/gfx/city3d.js).
//
// Uso:
//   npm i --prefix /tmp/claude-0/cs3-tools @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer sharp
//   node tools/aligerar_edificios_griegos.mjs <carpeta con templo.glb y curia.glb> [<carpeta de salida>]
//
//   Los originales se bajan de la API de Meshy (GET /openapi/v2/text-to-3d/<id>, model_urls.glb) con los ids de TAREAS.
//   Bajar una tarea hecha no gasta créditos. Las dependencias van FUERA del repo; el juego no las usa.
//
// Qué hace: una malla y un material; textura de color a 1024×1024 JPEG; malla simplificada con meshoptimizer
// (conserva costuras de UV) hasta ≈OBJETIVO_KB; sin cuantizar (el lector de city3d.js lee flotantes).
// Base en y=0, centrado en x/z, lado largo de la planta = LARGO unidades del juego, fachada mirando a +Z.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const req = createRequire((process.env.CS3_TOOLS || '/tmp/claude-0/cs3-tools') + '/');
const { Document, NodeIO } = req('@gltf-transform/core');
const { MeshoptSimplifier } = req('meshoptimizer');
const sharp = req('sharp');

const OBJETIVO_KB = 420, TOPE_KB = 500, TEX = 1024, CALIDAD = 78;
// giro: radianes en Y para que la fachada mire a +Z (se ajusta mirando la captura)
export const TAREAS = [
  { id: 'templo', meshy: '01a20a6f-e84a-7256-b8d7-996b733a8557', largo: 24, giro: Number(process.env.GIRO_TEMPLO || 0) },
  { id: 'curia', meshy: '01a20a6f-ec38-74b9-b649-c746e6abd64f', largo: 22, giro: Number(process.env.GIRO_CURIA || 0) },
];
const [, , DIR_IN, DIR_OUT = fileURLToPath(new URL('../assets/edificios-griegos/', import.meta.url))] = process.argv;
if (!DIR_IN) { console.error('Uso: node tools/aligerar_edificios_griegos.mjs <carpeta GLB originales> [<salida>]'); process.exit(1); }
await MeshoptSimplifier.ready;
const io = new NodeIO();

async function leer(t) {
  const d = await io.read(path.join(DIR_IN, t.id + '.glb'));
  const prim = d.getRoot().listMeshes()[0].listPrimitives()[0];
  const tex = prim.getMaterial().getBaseColorTexture();
  return {
    pos: Float32Array.from(prim.getAttribute('POSITION').getArray()), nor: Float32Array.from(prim.getAttribute('NORMAL').getArray()),
    uv: Float32Array.from(prim.getAttribute('TEXCOORD_0').getArray()), idx: Uint32Array.from(prim.getIndices().getArray()),
    jpg: await sharp(Buffer.from(tex.getImage())).resize(TEX, TEX, { fit: 'fill' }).jpeg({ quality: CALIDAD, mozjpeg: true }).toBuffer(),
  };
}
function simplificar(src, tris) {
  const n = src.pos.length / 3, attr = new Float32Array(n * 5);
  for (let i = 0; i < n; i++) { attr.set([src.uv[2 * i], src.uv[2 * i + 1], src.nor[3 * i], src.nor[3 * i + 1], src.nor[3 * i + 2]], i * 5); }
  const [ind] = MeshoptSimplifier.simplifyWithAttributes(src.idx, src.pos, 3, attr, 5, [1.5, 1.5, 0.3, 0.3, 0.3], null, Math.min(tris, src.idx.length / 3) * 3, 0.5, ['Prune', 'Permissive']);
  const mapa = new Int32Array(n).fill(-1); let m = 0; for (const i of ind) if (mapa[i] < 0) mapa[i] = m++;
  const pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), uv = new Float32Array(m * 2);
  for (let i = 0; i < n; i++) { const j = mapa[i]; if (j < 0) continue; pos.set(src.pos.subarray(3 * i, 3 * i + 3), 3 * j); nor.set(src.nor.subarray(3 * i, 3 * i + 3), 3 * j); uv.set(src.uv.subarray(2 * i, 2 * i + 2), 2 * j); }
  return { pos, nor, uv, idx: Uint32Array.from(ind, i => mapa[i]), jpg: src.jpg };
}
function colocar(g, t) {
  const c = Math.cos(t.giro), s = Math.sin(t.giro);
  for (let i = 0; i < g.pos.length; i += 3) { const x = g.pos[i], z = g.pos[i + 2]; g.pos[i] = c * x + s * z; g.pos[i + 2] = -s * x + c * z; const nx = g.nor[i], nz = g.nor[i + 2]; g.nor[i] = c * nx + s * nz; g.nor[i + 2] = -s * nx + c * nz; }
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < g.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], g.pos[i + k]); mx[k] = Math.max(mx[k], g.pos[i + k]); }
  const e = t.largo / Math.max(mx[0] - mn[0], mx[2] - mn[2]), cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
  for (let i = 0; i < g.pos.length; i += 3) { g.pos[i] = (g.pos[i] - cx) * e; g.pos[i + 1] = (g.pos[i + 1] - mn[1]) * e; g.pos[i + 2] = (g.pos[i + 2] - cz) * e; }
}
async function construir(t, g) {
  const d = new Document(); const b = d.createBuffer();
  const mat = d.createMaterial(t.id).setMetallicFactor(0).setRoughnessFactor(1)
    .setBaseColorTexture(d.createTexture(t.id).setImage(new Uint8Array(g.jpg)).setMimeType('image/jpeg'));
  const prim = d.createPrimitive().setMaterial(mat)
    .setAttribute('POSITION', d.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(b))
    .setAttribute('NORMAL', d.createAccessor().setType('VEC3').setArray(g.nor).setBuffer(b))
    .setAttribute('TEXCOORD_0', d.createAccessor().setType('VEC2').setArray(g.uv).setBuffer(b))
    .setIndices(d.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 < 65536 ? Uint16Array.from(g.idx) : g.idx).setBuffer(b));
  d.createScene('escena').addChild(d.createNode(t.id).setMesh(d.createMesh(t.id).addPrimitive(prim)));
  return io.writeBinary(d);
}
fs.mkdirSync(DIR_OUT, { recursive: true });
const ficha = {};
for (const t of TAREAS) {
  const src = await leer(t); let tris = 9000, mejor = null;
  for (let it = 0; it < 6; it++) {
    const g = simplificar(src, tris); colocar(g, t); const glb = await construir(t, g), kb = glb.length / 1024, real = g.idx.length / 3; if (process.env.DEPURA) console.log('  ', t.id, tris, real, kb.toFixed(0), (g.jpg.length / 1024).toFixed(0));
    if (!mejor || Math.abs(kb - OBJETIVO_KB) < Math.abs(mejor.kb - OBJETIVO_KB)) mejor = { glb, kb, tris: real };
    if (kb > OBJETIVO_KB + 15 || (kb < OBJETIVO_KB - 40 && real < src.idx.length / 3 - 10)) { const fijo = g.jpg.length / 1024 + 2; tris = Math.round(Math.max(2000, real * (OBJETIVO_KB - 5 - fijo) / (kb - fijo))); } else break;
  }
  if (mejor.kb > TOPE_KB) throw new Error(t.id + ' pesa ' + mejor.kb.toFixed(0) + ' KB');
  fs.writeFileSync(path.join(DIR_OUT, t.id + '.glb'), mejor.glb);
  ficha[t.id] = { archivo: t.id + '.glb', kb: Math.round(mejor.kb), triangulos: mejor.tris, meshy: t.meshy, largo: t.largo };
  console.log(t.id.padEnd(8), Math.round(mejor.kb) + ' KB', mejor.tris + ' tris');
}
fs.writeFileSync(path.join(DIR_OUT, 'edificios.json'), JSON.stringify(ficha, null, 2) + '\n');
