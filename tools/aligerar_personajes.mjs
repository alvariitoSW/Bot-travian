#!/usr/bin/env node
// Aligera los personajes de clases generados con Meshy (CS3) y los deja en assets/personajes/.
//
// Uso:
//   npm i --prefix /tmp/claude-0/cs3-tools @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer sharp
//   node tools/aligerar_personajes.mjs <carpeta con los GLB originales> [<carpeta de salida>]
//
//   Los originales se llaman <id>.glb (patricio.glb, matrona.glb…); se bajan de la API de Meshy con el
//   id de cada tarea (están en TAREAS, abajo). Dependencias: solo para esta herramienta, instaladas FUERA del repo
//   (variable CS3_TOOLS, por defecto /tmp/claude-0/cs3-tools). El juego no las usa.
//
// Qué hace por personaje: una sola malla y un solo material; solo textura de color (512×512 JPEG, calidad 80);
// malla simplificada con meshoptimizer (conserva costuras de UV y normales) hasta ≈250 KB (tope duro 300 KB);
// posiciones, normales y UV cuantizadas (KHR_mesh_quantization, lo lee el GLTFLoader de three.js sin decodificador).
// Sin compresión meshopt ni Draco, sin esqueleto ni animación. Pies en y=0, centrado en x/z, 1,8 de alto, mirando a +Z.
// Pontífice y tribuno (vista previa de Meshy, sin textura): material color yeso #d9d2c2, sin imagen.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const req = createRequire((process.env.CS3_TOOLS || '/tmp/claude-0/cs3-tools') + '/');
const { Document, NodeIO } = req('@gltf-transform/core');
const { KHRMeshQuantization } = req('@gltf-transform/extensions');
const { ALL_EXTENSIONS } = req('@gltf-transform/extensions');
const { quantize } = req('@gltf-transform/functions');
const { MeshoptSimplifier } = req('meshoptimizer');
const sharp = req('sharp');

const ALTURA = 1.8, OBJETIVO_KB = 250, TOPE_KB = 300, TEX = 512, CALIDAD = 80;
const YESO = [0xd9 / 255, 0xd2 / 255, 0xc2 / 255].map(c => Math.pow(c, 2.2)); // sRGB -> lineal
// giro: radianes en torno a Y para que el personaje mire a +Z (se ajusta mirando la hoja de contacto)
const P = (id, meshy, clase, sexo, nombre, extra = {}) => ({ id, meshy, clase, sexo, nombre, giro: 0, textura: true, ...extra });
export const TAREAS = [
  P('plebeyo', '01a20d1e-9456-745d-8026-ae4ec4a18ec8', 'plebe', 'm', 'Plebeyo'),
  P('plebeya', '01a20d2e-5be0-77ff-9dc8-8b8dc011a442', 'plebe', 'f', 'Plebeya'),
  P('artesano', '01a20d25-1cc7-73ef-aee0-0c24bdb4b67a', 'plebe', 'm', 'Artesano'),
  P('artesana', '01a20d2e-707f-71a4-9541-a6d24ed9a80a', 'plebe', 'f', 'Artesana'),
  P('ecuestre', '01a20d1e-d1e6-733f-850c-fcf78a262db9', 'ciudadanos', 'm', 'Caballero ecuestre'),
  P('dama', '01a20d2e-189f-765e-81e3-ee8a0009bcc3', 'ciudadanos', 'f', 'Dama ecuestre'),
  P('liberto', '01a20d25-d5cb-71b1-bedf-09fe812b3532', 'ciudadanos', 'm', 'Liberto'),
  P('liberta', '01a20d2d-f6b3-75da-848f-e58f8c4fbae6', 'ciudadanos', 'f', 'Liberta'),
  P('patricio', '01a20d1e-95a0-7152-ac23-fd0d33ed68dd', 'patricios', 'm', 'Patricio'),
  P('matrona', '01a20d2e-1229-70a5-a4fb-fcc72d939df7', 'patricios', 'f', 'Matrona patricia'),
  P('esclavo', '01a20d1e-9620-7390-9bc0-1f00ef730573', 'esclavos', 'm', 'Esclavo'),
  P('esclava', '01a20d2e-110e-720e-9943-2ef2ffb93eea', 'esclavos', 'f', 'Esclava'),
  P('consul', '01a20d2e-4144-7545-b88d-6b929d5932e9', 'magistrados', 'm', 'Cónsul'),
  P('censor', '01a20d2e-0ef6-74d0-9643-b40658bb280a', 'magistrados', 'm', 'Censor'),
  P('edil', '01a20d2e-1758-7664-b2ef-f11020b154d2', 'magistrados', 'm', 'Edil'),
  P('cuestor', '01a20d2e-5909-7317-aa36-116855bb4658', 'magistrados', 'm', 'Cuestor'),
  P('pontifice', '01a20d30-5731-75b6-8a45-4217958778fd', 'magistrados', 'm', 'Pontífice', { textura: false }),
  P('legado', '01a20d31-1ca6-7569-8575-6a334a07d0b2', 'magistrados', 'm', 'Legado'),
  P('tribuno', '01a20d30-7ab4-7006-900b-97a221d35290', 'magistrados', 'm', 'Tribuno', { textura: false }),
];
// giros por personaje (fruto de mirar la hoja de contacto)
const GIROS = JSON.parse(process.env.CS3_GIROS || '{}');

const [, , DIR_IN, DIR_OUT = new URL('../assets/personajes/', import.meta.url).pathname] = process.argv;
if (!DIR_IN) { console.error('Uso: node tools/aligerar_personajes.mjs <carpeta GLB originales> [<salida>]'); process.exit(1); }
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function leer(t) {
  const d = await io.read(path.join(DIR_IN, t.id + '.glb'));
  const prim = d.getRoot().listMeshes()[0].listPrimitives()[0];
  const pos = Float32Array.from(prim.getAttribute('POSITION').getArray());
  const nor = Float32Array.from(prim.getAttribute('NORMAL').getArray());
  const uvA = prim.getAttribute('TEXCOORD_0');
  const uv = t.textura && uvA ? Float32Array.from(uvA.getArray()) : null;
  const idx = Uint32Array.from(prim.getIndices().getArray());
  let jpg = null;
  if (t.textura) {
    const tex = prim.getMaterial().getBaseColorTexture();
    jpg = await sharp(Buffer.from(tex.getImage())).resize(TEX, TEX, { fit: 'fill' }).jpeg({ quality: CALIDAD, mozjpeg: true }).toBuffer();
  }
  return { pos, nor, uv, idx, jpg };
}

function simplificar(src, tris) {
  const n = src.pos.length / 3, w = src.uv ? 5 : 3;
  const attr = new Float32Array(n * w);
  for (let i = 0; i < n; i++) {
    let o = i * w;
    if (src.uv) { attr[o++] = src.uv[2 * i]; attr[o++] = src.uv[2 * i + 1]; }
    attr[o++] = src.nor[3 * i]; attr[o++] = src.nor[3 * i + 1]; attr[o++] = src.nor[3 * i + 2];
  }
  const pesos = src.uv ? [1.5, 1.5, 0.5, 0.5, 0.5] : [0.5, 0.5, 0.5];
  const [ind] = MeshoptSimplifier.simplifyWithAttributes(src.idx, src.pos, 3, attr, w, pesos, null, tris * 3, 0.5, ['Prune', 'Permissive']);
  // compactar vértices usados
  const mapa = new Int32Array(n).fill(-1); let m = 0;
  for (const i of ind) if (mapa[i] < 0) mapa[i] = m++;
  const pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), uv = src.uv ? new Float32Array(m * 2) : null;
  for (let i = 0; i < n; i++) { const j = mapa[i]; if (j < 0) continue;
    pos.set(src.pos.subarray(3 * i, 3 * i + 3), 3 * j); nor.set(src.nor.subarray(3 * i, 3 * i + 3), 3 * j);
    if (uv) uv.set(src.uv.subarray(2 * i, 2 * i + 2), 2 * j); }
  const idx = Uint32Array.from(ind, i => mapa[i]);
  return { pos, nor, uv, idx, jpg: src.jpg };
}

function colocar(g, giro) { // pies en y=0, centrado en x/z, altura 1,8, giro en Y
  const c = Math.cos(giro), s = Math.sin(giro);
  for (let i = 0; i < g.pos.length; i += 3) {
    const x = g.pos[i], z = g.pos[i + 2];
    g.pos[i] = c * x + s * z; g.pos[i + 2] = -s * x + c * z;
    const nx = g.nor[i], nz = g.nor[i + 2];
    g.nor[i] = c * nx + s * nz; g.nor[i + 2] = -s * nx + c * nz;
  }
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < g.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], g.pos[i + k]); mx[k] = Math.max(mx[k], g.pos[i + k]); }
  const e = ALTURA / (mx[1] - mn[1]), cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
  for (let i = 0; i < g.pos.length; i += 3) { g.pos[i] = (g.pos[i] - cx) * e; g.pos[i + 1] = (g.pos[i + 1] - mn[1]) * e; g.pos[i + 2] = (g.pos[i + 2] - cz) * e; }
}

async function construir(t, g) {
  const d = new Document(); const b = d.createBuffer();
  const mat = d.createMaterial(t.id).setMetallicFactor(0).setRoughnessFactor(1).setDoubleSided(false);
  if (g.jpg) mat.setBaseColorTexture(d.createTexture(t.id).setImage(new Uint8Array(g.jpg)).setMimeType('image/jpeg'));
  else mat.setBaseColorFactor([...YESO, 1]);
  const prim = d.createPrimitive().setMaterial(mat)
    .setAttribute('POSITION', d.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(b))
    .setAttribute('NORMAL', d.createAccessor().setType('VEC3').setArray(g.nor).setBuffer(b))
    .setIndices(d.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 < 65536 ? Uint16Array.from(g.idx) : g.idx).setBuffer(b));
  if (g.uv) prim.setAttribute('TEXCOORD_0', d.createAccessor().setType('VEC2').setArray(g.uv).setBuffer(b));
  const mesh = d.createMesh(t.id).addPrimitive(prim);
  const nodo = d.createNode(t.id).setMesh(mesh);
  d.createScene('escena').addChild(nodo);
  await d.transform(quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }));
  return io.writeBinary(d);
}

fs.mkdirSync(DIR_OUT, { recursive: true });
const ficha = {}; let total = 0;
for (const t of TAREAS.filter(t => !process.env.CS3_SOLO || process.env.CS3_SOLO.split(",").includes(t.id))) {
  t.giro = GIROS[t.id] ?? t.giro;
  const src = await leer(t);
  let tris = 7000, mejor = null;
  for (let it = 0; it < 6; it++) {
    const g = simplificar(src, tris); colocar(g, t.giro);
    const glb = await construir(t, g); const kb = glb.length / 1024;
    const real = g.idx.length / 3; if (process.env.CS3_DEBUG) console.log("  ", t.id, it, tris, real, kb.toFixed(0), g.jpg ? (g.jpg.length/1024).toFixed(0) : "-");
    if (!mejor || (kb <= TOPE_KB && Math.abs(kb - OBJETIVO_KB) < Math.abs(mejor.kb - OBJETIVO_KB)) || mejor.kb > TOPE_KB) mejor = { glb, kb, tris: real };
    if (kb > OBJETIVO_KB + 8 || kb < OBJETIVO_KB - 25) {
      const fijo = g.jpg ? g.jpg.length / 1024 + 4 : 4;
      tris = Math.round(Math.max(1500, Math.min(14000, real * (OBJETIVO_KB - 5 - fijo) / (kb - fijo))));
    } else break;
  }
  if (mejor.kb > TOPE_KB) throw new Error(t.id + ' pesa ' + mejor.kb.toFixed(0) + ' KB (tope ' + TOPE_KB + ')');
  fs.writeFileSync(path.join(DIR_OUT, t.id + '.glb'), mejor.glb);
  ficha[t.id] = { archivo: t.id + '.glb', kb: Math.round(mejor.kb), triangulos: mejor.tris, clase: t.clase, sexo: t.sexo, nombre: t.nombre, meshy: t.meshy, textura: t.textura };
  total += mejor.kb;
  console.log(t.id.padEnd(10), Math.round(mejor.kb) + ' KB', mejor.tris + ' tris', t.textura ? 'textura' : 'yeso');
}
fs.writeFileSync(path.join(DIR_OUT, 'personajes.json'), JSON.stringify(ficha, null, 2) + '\n');
console.log('Total', Math.round(total) + ' KB');
