/* AQVILA — CS3: menú de clases sociales, con sus personajes en 3D. SOLO PANTALLA (la lógica está en game.js y necesidades.js).
   Hoja de papiro que sube desde abajo (mismo patrón que ministros-ui.js). Estilos propios con prefijo cl-, inyectados una sola vez.

   CONTRATO DE ENGANCHE (lo hace la sesión CDe4; esta pieza no toca nada de eso):
   1. index.html: <script type="module" src="js/clases-ui.js"></script> (es módulo: importa necesidades.js, barrio-ui.js y gfx/models.js).
   2. ui.js: un botón «Clases» (o en el menú de la ciudad) que llame window.CLASES_UI.abrir(ciudadId); cerrar() lo quita. Si no se pasa
      ciudad, usa window.UI.city. El botón «Encargar al ministro» llama a Game.necEncargar(cid, {barrio, ...remedio}), igual que barrio-ui.
   3. sw.js: añadir js/clases-ui.js, assets/personajes/personajes.json, assets/personajes/*.glb y assets/personajes/LICENSE.txt, y subir la caché.
   4. registro.js: una ficha por personaje (8: plebeyo, plebeya, ecuestre, dama, patricio, matrona, esclavo, esclava): arte Meshy,
      CC BY-SA 3.0, dictamen histórico de MS3/MS4. Crédito en el menú de licencias.
   5. Sin los .glb el menú funciona igual: pone una silueta de tinta en cada tarjeta y en la ficha (nunca un error).

   LICENCIA DE JUEGO (apuntada): el juego solo cuenta tres clases de población (plebe, ciudadanos, esclavos). Los PATRICIOS son aquí una parte de los
   ciudadanos: el 10 % (PATRICIOS_DE_CIU). Se restan de la cifra de ciudadanos para no contarlos dos veces. Piden más cultura, culto y orden
   (PESOS_PAT, cada fila suma 1) y su ánimo parte del de los ciudadanos, corregido por esos pesos con la cobertura de los barrios. */
import * as NEC from './necesidades.js';
import { datosCiudad, remedioBarrio } from './barrio-ui.js';
import { THREE } from './gfx/models.js';

const root = typeof window !== 'undefined' ? window : globalThis;

/* ---------- reglas de esta pantalla (puras) ---------- */
export const PATRICIOS_DE_CIU = 0.10;
export const PESOS_PAT = { alimento: 0.05, agua: 0.1, limpieza: 0.05, salud: 0.1, trabajo: 0.1, cultura: 0.2, culto: 0.2, orden: 0.2 };
export const PESOS_CLASE = { ple: NEC.PESOS.ple, ciu: NEC.PESOS.ciu, pat: PESOS_PAT, esc: NEC.PESOS.esc };
export const CLASES = [
  { id: 'plebe', base: 'ple', nombre: 'Plebe', h: 'plebeyo', m: 'plebeya', col: '#8a5a2b' },
  { id: 'ciudadanos', base: 'ciu', nombre: 'Ciudadanos', h: 'ecuestre', m: 'dama', col: '#2f6a8c' },
  { id: 'patricios', base: 'pat', nombre: 'Patricios', h: 'patricio', m: 'matrona', col: '#7a2a6a' },
  { id: 'esclavos', base: 'esc', nombre: 'Esclavos', h: 'esclavo', m: 'esclava', col: '#4a4a4a' }
];
const CONTENTO = NEC.DUREZA.duro.contento, DESCONTENTO = NEC.DUREZA.duro.descontento;
export const estadoAnimo = a => a >= CONTENTO ? 'bien' : a >= DESCONTENTO ? 'tenso' : 'mal';
const COL_AN = { bien: '#4fa94a', tenso: '#e9a919', mal: '#d4382f' };
const TXT_AN = { bien: 'En calma', tenso: 'Tensión', mal: 'Enfado' };
const lim = x => Math.max(0, Math.min(100, Math.round(x)));
const animoDe = (cob, pesos) => { let s = 0; for (const n of NEC.NECESIDADES) s += (pesos[n.id] || 0) * ((cob && cob[n.id]) || 0); return 100 * s; };

/* Cifras y ánimo de las cuatro clases. gente = {ple, ciu, esc}; animo = {ple, ciu, esc} (0-100); D = datosCiudad (o null). */
export function calcularClases(gente, animo, D) {
  const pat = Math.round((gente.ciu || 0) * PATRICIOS_DE_CIU);
  const barrios = D ? D.barrios : [];
  /* ánimo de cada clase en cada barrio, con los pesos de la clase */
  const porBarrio = barrios.map(b => ({ b, an: { ple: lim(animoDe(b.cob, PESOS_CLASE.ple)), ciu: lim(animoDe(b.cob, PESOS_CLASE.ciu)), pat: lim(animoDe(b.cob, PESOS_CLASE.pat)), esc: lim(animoDe(b.cob, PESOS_CLASE.esc)) } }));
  /* patricios: el ánimo de los ciudadanos + la diferencia (cultura, culto, orden) que se nota en los barrios, ponderada por casas */
  let dif = 0, w = 0; for (const q of porBarrio) { const k = Math.max(1, q.b.n || 0); dif += (q.an.pat - q.an.ciu) * k; w += k; }
  const aPat = lim((animo.ciu || 0) + (w ? dif / w : 0));
  /* cobertura media de cada necesidad en toda la ciudad (por casas) */
  const cob = {}; let tot = 0; for (const n of NEC.NECESIDADES) cob[n.id] = 0;
  for (const b of barrios) { const k = Math.max(1, b.n || 0); tot += k; for (const n of NEC.NECESIDADES) cob[n.id] += ((b.cob && b.cob[n.id]) || 0) * k; }
  for (const n of NEC.NECESIDADES) cob[n.id] = tot ? cob[n.id] / tot : null;
  return {
    plebe: { gente: gente.ple || 0, animo: lim(animo.ple) },
    ciudadanos: { gente: Math.max(0, (gente.ciu || 0) - pat), animo: lim(animo.ciu) },
    patricios: { gente: pat, animo: aPat },
    esclavos: { gente: gente.esc || 0, animo: lim(animo.esc) },
    cob, porBarrio
  };
}

/* ---------- glifos (los mismos trazos que barrio-ui) y caras ---------- */
const ST = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const GLIFO = {
  alimento: '<path d="M12 21V8M12 8C9.500 8 8.500 6 8.500 4c2.500 0 3.500 2 3.500 4zM12 8c2.500 0 3.500-2 3.500-4-2.500 0-3.500 2-3.500 4zM12 14c-2.500 0-4-1.800-4-4 2.500 0 4 1.800 4 4zM12 14c2.500 0 4-1.800 4-4-2.500 0-4 1.800-4 4z"/>',
  agua: '<path d="M12 3c3.500 4.500 6 7.500 6 11a6 6 0 0 1-12 0c0-3.500 2.500-6.500 6-11z"/>',
  limpieza: '<path d="M18 3l-6 9M7 12h8l3 9H4zM9 15v3M12 15v3"/>',
  salud: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
  trabajo: '<path d="M13 4l7 7-3 3-7-7zM11 9l-7 8 3 3 8-7"/>',
  cultura: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM8 8h8M8 12h8"/>',
  culto: '<path d="M3 9l9-5 9 5zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  orden: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>'
};
const COL_NEC = { alimento: '#d9a21b', agua: '#2f8fe0', limpieza: '#1fa89a', salud: '#d6568a', trabajo: '#e0762a', cultura: '#8a63c9', culto: '#5c6bc0', orden: '#5f7d8c' };
const icono = (id, px) => '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" ' + ST + ' aria-hidden="true">' + (GLIFO[id] || '') + '</svg>';
const BOCA = { bien: 'M7.500 13.500c1 2.800 8 2.800 9 0', tenso: 'M8 15h8', mal: 'M7.500 16.500c1-2.800 8-2.800 9 0' };
const cara = (est, px) => '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" aria-hidden="true"><circle cx="12" cy="12" r="10.500" fill="' + COL_AN[est] + '" stroke="#fff" stroke-width="1.500"/><path d="' + BOCA[est] + '" fill="none" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/><circle cx="9" cy="9.500" r="1.200" fill="#fff"/><circle cx="15" cy="9.500" r="1.200" fill="#fff"/></svg>';

const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = n => Math.round(n).toLocaleString('es');

/* silueta de tinta de reserva (si el .glb no está o falla) */
const SIL = {};
const silueta = (mujer) => {
  const k = mujer ? 'm' : 'h'; if (SIL[k]) return SIL[k];
  const cuerpo = mujer ? '<path d="M50 52c-9 0-14 6-15 16l-6 62h42l-6-62c-1-10-6-16-15-16z"/>' : '<path d="M38 56c-3 0-5 3-5 7v38h8v52h8v-34h2v34h8v-52h8V63c0-4-2-7-5-7z"/>';
  const s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160"><g fill="#2b1c0a" fill-opacity=".55"><circle cx="50" cy="32" r="14"/>' + cuerpo + '</g></svg>';
  return SIL[k] = 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
};

const CSS = '' +
  '.cl-fondo{position:fixed;left:0;right:0;bottom:76px;top:auto;z-index:60;display:flex;justify-content:center;pointer-events:none;overflow:clip}' +
  '.cl-hoja{--tinta:#2b1c0a;--tinta2:#5a4220;pointer-events:auto;box-sizing:border-box;width:100%;max-width:560px;max-height:min(88vh,calc(100vh - 84px));display:flex;flex-direction:column;color:var(--tinta);font-family:var(--libro,Georgia,serif);' +
  'background-color:var(--papiro,#e8d4a2);background-image:var(--fibras),var(--manchas),radial-gradient(ellipse at 20% 0%,rgba(255,246,214,.7),transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(140,92,36,.38),transparent 60%);' +
  'border-radius:4px 4px 0 0;box-shadow:inset 14px 0 18px -12px rgba(100,60,18,.8),inset -14px 0 18px -12px rgba(100,60,18,.8),0 -14px 40px #000c;padding:0 14px;animation:cl-sube .22s ease-out}' +
  '@keyframes cl-sube{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
  '.cl-asa{flex:none;position:relative;height:22px;margin:0 -14px 8px;border-radius:9px;background:var(--veta),linear-gradient(#9a6c38,#6a4520 40%,#3a230c);box-shadow:0 3px 5px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,220,160,.35)}' +
  '.cl-asa::before,.cl-asa::after{content:"";position:absolute;top:-4px;width:16px;height:30px;border-radius:6px/10px;background:radial-gradient(ellipse at 40% 28%,#fff1c0 0 8%,#e2b860 22%,#a8781f 55%,#4e3409 100%);box-shadow:inset 0 0 0 1px rgba(60,35,5,.7),0 2px 3px #000}' +
  '.cl-asa::before{left:-6px}.cl-asa::after{right:-6px}' +
  '.cl-cab{flex:none;display:flex;align-items:center;gap:8px;margin-bottom:8px}' +
  '.cl-cab .ro-ansata{flex:1;min-width:0;height:40px;margin:0 22px 0 20px;font-size:17px;letter-spacing:.08em}' +
  '.cl-btn{flex:none;min-height:44px;min-width:44px;padding:0 12px;color:var(--tinta);font:700 15px var(--serif,serif);border-radius:8px;border:1px solid rgba(60,35,10,.7);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
  '.cl-cuerpo{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 0 14px;scrollbar-width:none}' +
  '.cl-cuerpo::-webkit-scrollbar{display:none}' +
  '.cl-rejilla{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}' +
  '.cl-card{display:flex;flex-direction:column;align-items:stretch;gap:4px;min-width:0;min-height:44px;padding:6px 6px 8px;border-radius:8px;border:1px solid rgba(60,35,10,.55);border-top:4px solid var(--cc,#8a5a2b);background:rgba(255,246,214,.5);color:var(--tinta);font:inherit;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,.18)}' +
  '.cl-fig{display:flex;justify-content:center;align-items:flex-end;gap:0;height:112px;border-radius:6px;background:radial-gradient(ellipse at 50% 90%,rgba(60,35,10,.28),transparent 65%),radial-gradient(circle at 50% 35%,rgba(255,250,230,.7),rgba(212,184,124,.35));overflow:clip}' +
  '.cl-fig img{display:block;width:50%;height:100%;object-fit:contain;object-position:50% 100%}' +
  '.cl-nom{font:700 17px/1.15 var(--serif,serif);letter-spacing:.02em}' +
  '.cl-fil{display:flex;align-items:center;justify-content:center;gap:8px}' +
  '.cl-fil b{font:700 20px/1 var(--serif,serif)}' +
  '.cl-ver{font-size:13px;color:var(--tinta2)}' +
  '.cl-mapa{position:relative;height:244px;margin:0 0 8px;border-radius:8px;overflow:clip;border:1px solid rgba(60,35,10,.5);background:radial-gradient(ellipse at 50% 92%,rgba(60,35,10,.35),transparent 60%),radial-gradient(circle at 50% 30%,rgba(255,250,230,.8),rgba(212,184,124,.5))}' +
  '.cl-mapa canvas{display:block;width:100%;height:100%}' +
  '.cl-sil{position:absolute;inset:0;display:flex;justify-content:center;align-items:flex-end;gap:12px;padding:10px 0 4px}.cl-sil img{height:100%;width:auto}' +
  '.cl-sel{position:absolute;right:8px;top:8px;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:20px;background:rgba(43,28,10,.82);color:#fbe9c7;font:700 17px var(--serif,serif)}' +
  '.cl-sel small{font:400 13px var(--libro,serif)}' +
  '.cl-gen{position:absolute;left:8px;top:8px;padding:4px 10px;border-radius:20px;background:rgba(43,28,10,.82);color:#fbe9c7;font:700 17px var(--serif,serif)}' +
  '.cl-tit{margin:10px 0 6px;font:700 13px var(--serif,serif);letter-spacing:.08em;text-transform:uppercase;color:var(--minio,#9b2a1a)}' +
  '.cl-nec{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}' +
  '.cl-n{display:flex;align-items:center;gap:6px;min-width:0;padding:5px 6px;border-radius:8px;border:1px solid rgba(60,35,10,.35);background:rgba(255,246,214,.45)}' +
  '.cl-n.nada{opacity:.45}' +
  '.cl-ic{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;color:#fff;box-shadow:0 0 0 2px var(--ec,#999)}' +
  '.cl-nt{flex:1;min-width:0}' +
  '.cl-nn{font:700 13px/1.15 var(--serif,serif);white-space:nowrap;overflow:clip;text-overflow:ellipsis}' +
  '.cl-bar{height:8px;margin-top:3px;border-radius:4px;background:rgba(60,35,10,.2);box-shadow:inset 0 1px 1px rgba(60,35,10,.35);overflow:clip}' +
  '.cl-bar i{display:block;height:100%;background:var(--ec,#4fa94a)}' +
  '.cl-pip{display:flex;gap:2px;margin-top:3px}.cl-pip s{display:block;width:8px;height:8px;border-radius:50%;background:rgba(60,35,10,.2);text-decoration:none}.cl-pip s.on{background:var(--tinta)}' +
  '.cl-bq{display:flex;flex-direction:column;gap:6px;padding:8px;margin-bottom:8px;border-radius:8px;border:1px solid rgba(60,35,10,.45);border-left:5px solid #d4382f;background:rgba(255,246,214,.55)}' +
  '.cl-bq .f1{display:flex;align-items:center;gap:8px}' +
  '.cl-bq .f1 .t{flex:1;min-width:0;font:700 16px/1.2 var(--serif,serif)}' +
  '.cl-bq .f2{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--tinta2)}' +
  '.cl-bq .f2 b{color:var(--tinta)}' +
  '.cl-enc{min-height:44px;width:100%;padding:4px 10px;border-radius:8px;font:700 15px var(--serif,serif);letter-spacing:.03em;color:#fbe9c7;text-shadow:0 1px 0 rgba(0,0,0,.5);border:1px solid #6e130d;background:linear-gradient(#b8321f,#7e1910 70%,#6a140c);box-shadow:0 0 0 2px #6a4a18,0 2px 6px rgba(0,0,0,.4)}' +
  '.cl-enc[aria-disabled=true]{filter:grayscale(.8);opacity:.6}' +
  '.cl-msg{font-size:14px;font-weight:700;color:var(--minio,#9b2a1a)}.cl-msg.ok{color:#2f6a1f}' +
  '.cl-ok{display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;border:1px dashed rgba(60,35,10,.5);font:700 15px var(--serif,serif)}';

const meter = () => { if (typeof document === 'undefined' || document.getElementById('clases-ui-css')) return; const st = document.createElement('style'); st.id = 'clases-ui-css'; st.textContent = CSS; document.head.appendChild(st); };

/* ---------- cargador mínimo de .glb (sin dependencias: three 0.170 no trae GLTFLoader) ----------
   Lee mallas, normales, UV y la textura de color base. Sin animación ni huesos: se ve en la postura de reposo del modelo. */
const COMP = { 5120: ['getInt8', 1, 127], 5121: ['getUint8', 1, 255], 5122: ['getInt16', 2, 32767], 5123: ['getUint16', 2, 65535], 5125: ['getUint32', 4, 4294967295], 5126: ['getFloat32', 4, 0] };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
async function leerGLB(url) {
  const r = await fetch(url); if (!r.ok) throw new Error('No hay ' + url);
  const buf = await r.arrayBuffer(), dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('No es un .glb');
  let off = 12, json = null, binOff = 0;
  while (off + 8 <= buf.byteLength) {
    const len = dv.getUint32(off, true), tipo = dv.getUint32(off + 4, true);
    if (tipo === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len)));
    else if (tipo === 0x004E4942 && !binOff) binOff = off + 8;
    off += 8 + len;
  }
  if (!json) throw new Error('.glb sin JSON');
  const mal = (json.extensionsRequired || []).filter(x => x !== 'KHR_mesh_quantization');   // la cuantización la cubre el lector de accesores
  if (mal.length) throw new Error('Extensiones no admitidas: ' + mal.join(','));
  const acc = (i, indices) => {
    const a = json.accessors[i], n = NCOMP[a.type], [fn, tam, max] = COMP[a.componentType], out = indices ? new Uint32Array(a.count * n) : new Float32Array(a.count * n);   // los atributos siempre en flotantes (ya sin cuantizar)
    if (a.bufferView === undefined) return { arr: out, n };
    const v = json.bufferViews[a.bufferView], ini = binOff + (v.byteOffset || 0) + (a.byteOffset || 0), paso = v.byteStride || tam * n;
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) { let x = dv[fn](ini + k * paso + c * tam, true); if (a.normalized && max) x = Math.max(x / max, -1); out[k * n + c] = x; }
    return { arr: out, n };
  };
  const imagen = async i => {
    const im = json.images[i]; let blob;
    if (im.bufferView !== undefined) { const v = json.bufferViews[im.bufferView]; blob = new Blob([new Uint8Array(buf, binOff + (v.byteOffset || 0), v.byteLength)], { type: im.mimeType || 'image/png' }); }
    else if (im.uri) blob = await (await fetch(im.uri.indexOf('data:') === 0 ? im.uri : url.replace(/[^/]*$/, '') + im.uri)).blob();
    else return null;
    return createImageBitmap(blob);
  };
  const texCache = new Map(), materiales = [];
  for (const m of (json.materials || [])) {
    const p = m.pbrMetallicRoughness || {}, f = p.baseColorFactor || [1, 1, 1, 1], mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(f[0], f[1], f[2]), side: THREE.DoubleSide });
    const ti = p.baseColorTexture && p.baseColorTexture.index;
    if (ti !== undefined && json.textures && json.textures[ti] && json.textures[ti].source !== undefined) {
      const src = json.textures[ti].source;
      if (!texCache.has(src)) { let t = null; try { const bm = await imagen(src); if (bm) { t = new THREE.Texture(bm); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; } } catch (e) { t = null; } texCache.set(src, t); }
      const t = texCache.get(src); if (t) { mat.map = t; mat.color.set(0xffffff); }
    }
    materiales.push(mat);
  }
  const porDefecto = new THREE.MeshLambertMaterial({ color: 0xc8b090, side: THREE.DoubleSide });
  const grupo = new THREE.Group(), M4 = new THREE.Matrix4();
  const nodo = (i, padre) => {
    const nd = json.nodes[i], L = new THREE.Matrix4();
    if (nd.matrix) L.fromArray(nd.matrix); else L.compose(new THREE.Vector3(...(nd.translation || [0, 0, 0])), new THREE.Quaternion(...(nd.rotation || [0, 0, 0, 1])), new THREE.Vector3(...(nd.scale || [1, 1, 1])));
    const W = new THREE.Matrix4().multiplyMatrices(padre, L);
    if (nd.mesh !== undefined) {
      for (const pr of json.meshes[nd.mesh].primitives) {
        if (pr.mode !== undefined && pr.mode !== 4) continue;
        const g = new THREE.BufferGeometry(), P = acc(pr.attributes.POSITION);
        g.setAttribute('position', new THREE.BufferAttribute(P.arr, 3));
        if (pr.attributes.NORMAL !== undefined) g.setAttribute('normal', new THREE.BufferAttribute(acc(pr.attributes.NORMAL).arr, 3));
        if (pr.attributes.TEXCOORD_0 !== undefined) g.setAttribute('uv', new THREE.BufferAttribute(acc(pr.attributes.TEXCOORD_0).arr, 2));
        if (pr.indices !== undefined) g.setIndex(new THREE.BufferAttribute(acc(pr.indices, true).arr, 1));
        if (pr.attributes.NORMAL === undefined) g.computeVertexNormals();
        if (nd.skin === undefined) g.applyMatrix4(W);   // con huesos, la malla ya viene en la postura de reposo: se ignora la matriz del nodo
        grupo.add(new THREE.Mesh(g, (pr.material !== undefined && materiales[pr.material]) || porDefecto));
      }
    }
    for (const h of (nd.children || [])) nodo(h, W);
  };
  const esc0 = json.scenes && json.scenes[json.scene || 0]; for (const i of ((esc0 && esc0.nodes) || [])) nodo(i, M4.identity());
  if (!grupo.children.length) throw new Error('.glb sin mallas');
  /* de pie sobre y=0, centrado y de 1,8 de alto */
  const caja = new THREE.Box3().setFromObject(grupo), alto = caja.max.y - caja.min.y || 1, e = 1.8 / alto, c = caja.getCenter(new THREE.Vector3());
  const pivote = new THREE.Group(); grupo.scale.setScalar(e); grupo.position.set(-c.x * e, -caja.min.y * e, -c.z * e); pivote.add(grupo);
  return pivote;
}

/* ---------- estado ---------- */
let BASE = 'assets/personajes/';   // carpeta de los .glb; op.base la cambia (banco de pruebas)
const U = { el: null, cid: null, op: null, vista: 'menu', clase: null, datos: null, msg: {}, vis: true, io: null };
const RET = {};          // retratos ya hechos (id -> dataURL): se guardan en memoria
const MODELOS = new Map();   // id -> Promise<Group|null>
let INDICE = null;
const R = { ren: null, scene: null, cam: null, listo: null, raf: 0, t: 0, piv: [], malo: false, haciendo: false, gen: 0 };

const idDe = (c, sexo) => {
  const nom = sexo === 'm' ? c.m : c.h;
  if (INDICE && !INDICE[nom]) {
    const k = Object.keys(INDICE).find(i => INDICE[i] && INDICE[i].clase === c.id && (sexo === 'm' ? /^f/i : /^m/i).test(String(INDICE[i].sexo || '')));
    if (k) return k;
  }
  return nom;
};
async function cargarIndice() {
  if (INDICE) return INDICE;
  let ind = null; try { const r = await fetch(BASE + 'personajes.json'); if (r.ok) ind = await r.json(); } catch (e) { ind = null; }
  if (ind) INDICE = ind;   // si falla no se guarda: se reintenta
  return ind || {};
}
function modelo(id) {
  if (!MODELOS.has(id)) MODELOS.set(id, (async () => {
    await cargarIndice(); const f = (INDICE || {})[id] || {};   // sin índice, se prueba id.glb
    try { return await leerGLB(BASE + (f.archivo || id + '.glb')); } catch (e) { console.warn('Personaje ' + id + ': no se pudo leer', e); MODELOS.delete(id); return null; }
  })());
  return MODELOS.get(id);
}

function renderer() {
  if (R.ren) return R.ren;
  if (R.malo || typeof document === 'undefined') return null;
  try {
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setClearColor(0x000000, 0); ren.setPixelRatio(1);
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff4dc, 0x7a6040, 2.2)); const sol = new THREE.DirectionalLight(0xffffff, 2.2); sol.position.set(2, 4, 3); sc.add(sol);
    R.ren = ren; R.scene = sc; R.cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  } catch (e) { console.warn('Sin 3D para los personajes', e); R.malo = true; R.ren = null; }
  return R.ren;
}
function liberar() {
  if (R.raf) { cancelAnimationFrame(R.raf); R.raf = 0; }
  if (R.ren) { try { R.scene.clear(); R.ren.dispose(); R.ren.forceContextLoss(); if (R.ren.domElement.parentNode) R.ren.domElement.remove(); } catch (e) { /* ya estaba suelto */ } }
  R.ren = null; R.scene = null; R.cam = null; R.piv = []; R.listo = null;
}

/* retratos de tarjeta: medio cuerpo, fondo transparente, una sola vez por personaje */
async function hacerRetratos() {
  if (R.haciendo) return; R.haciendo = true;
  try { await retratos(); } finally { R.haciendo = false; }
}
async function retratos() {
  const gen = R.gen;   // si cambia (abrir, cerrar, entrar en la ficha), este trabajo ya no vale y sale sin tocar nada
  await cargarIndice(); if (gen !== R.gen || !U.el) return;
  const ren = renderer(); if (!ren) return;
  for (const c of CLASES) for (const sx of ['h', 'm']) {
    if (gen !== R.gen || U.vista === 'ficha' || !U.el || R.ren !== ren) return;   // la ficha usa el mismo renderer: los retratos que falten se hacen al volver
    const id = idDe(c, sx); if (RET[id]) continue;
    const m = await modelo(id); if (gen !== R.gen || R.ren !== ren || !U.el) return; if (!m) continue;
    try {
      ren.setSize(176, 232, false); R.cam.aspect = 176 / 232; R.cam.updateProjectionMatrix(); R.cam.position.set(0, 1.35, 2.5); R.cam.lookAt(0, 1.22, 0);
      m.position.set(0, 0, 0); m.rotation.y = sx === 'm' ? -0.3 : 0.3; R.scene.add(m); ren.render(R.scene, R.cam);
      if (!ren.getContext().isContextLost()) RET[id] = ren.domElement.toDataURL('image/png');
      R.scene.remove(m);
    } catch (e) { console.warn('Retrato ' + id, e); }
    if (RET[id]) U.el.querySelectorAll('img[data-ret="' + id + '"]').forEach(im => { im.src = RET[id]; });
  }
}

/* ---------- datos de la partida ---------- */
function leer() {
  const op = U.op || {}, G = op.juego || root.Game;
  let gente = { ple: 0, ciu: 0, esc: 0 }, animo = { ple: 50, ciu: 50, esc: 50 }, D = null;
  if (op.estado) { const e = op.estado(); gente = e.gente; animo = e.animo; D = e.D || null; }
  else if (G && G.state && G.state.cities[U.cid]) {
    const c = G.state.cities[U.cid]; gente = G.clases(c); animo = G.animoClases(c);
    try { const E = G.ciudadE ? G.ciudadE(U.cid) : null; if (E && E.fundada) D = datosCiudad(E, gente, c.nec); } catch (e) { D = null; }
  }
  U.datos = calcularClases(gente, animo, D); U.datos.D = D; return U.datos;
}

/* ---------- pantalla ---------- */
const imgFig = (c, sx) => { const id = idDe(c, sx); return '<img alt="" data-ret="' + esc(id) + '" src="' + esc(RET[id] || silueta(sx === 'm')) + '">'; };
function pintarMenu(d) {
  let h = '<div class="cl-rejilla">';
  for (const c of CLASES) {
    const q = d[c.id], est = estadoAnimo(q.animo);
    h += '<button class="cl-card" data-cl="' + c.id + '" style="--cc:' + c.col + '" aria-label="' + esc(c.nombre) + ': ' + num(q.gente) + ' personas, ' + TXT_AN[est] + '"><span class="cl-fig">' + imgFig(c, 'h') + imgFig(c, 'm') + '</span><span class="cl-nom">' + esc(c.nombre) + '</span><span class="cl-fil"><b>' + num(q.gente) + '</b>' + cara(est, 30) + '</span><span class="cl-ver">' + TXT_AN[est] + ' · ' + q.animo + '</span></button>';
  }
  return h + '</div>';
}
function pintarFicha(d, c) {
  const q = d[c.id], est = estadoAnimo(q.animo), pesos = PESOS_CLASE[c.base], maxP = Math.max.apply(null, NEC.NECESIDADES.map(n => pesos[n.id])) || 1;
  let h = '<div class="cl-mapa" id="cl-mapa"><div class="cl-sil" id="cl-sil"><img alt="" src="' + esc(RET[idDe(c, 'h')] || silueta(false)) + '"><img alt="" src="' + esc(RET[idDe(c, 'm')] || silueta(true)) + '"></div>' +
    '<span class="cl-gen">' + num(q.gente) + '</span><span class="cl-sel">' + cara(est, 30) + q.animo + ' <small>' + TXT_AN[est] + '</small></span></div>';
  h += '<div class="cl-tit">Lo que pide</div><div class="cl-nec">';
  for (const n of NEC.NECESIDADES) {
    const p = pesos[n.id], f = d.cob[n.id], pips = p > 0 ? Math.max(1, Math.round(p / maxP * 5)) : 0, ee = f == null ? 'x' : NEC.estadoNecesidad(f), col = ee === 'cubierta' ? COL_AN.bien : ee === 'falta' ? COL_AN.tenso : ee === 'mal' ? COL_AN.mal : '#999';
    h += '<div class="cl-n' + (p > 0 ? '' : ' nada') + '" style="--ec:' + col + '" title="' + esc(n.nombre) + '"><span class="cl-ic" style="background:' + COL_NEC[n.id] + '">' + icono(n.id, 20) + '</span><span class="cl-nt"><div class="cl-nn">' + esc(n.nombre) + '</div>' +
      '<div class="cl-bar"><i style="width:' + Math.round((f || 0) * 100) + '%"></i></div><div class="cl-pip" aria-label="Importancia ' + pips + ' de 5">' + [1, 2, 3, 4, 5].map(k => '<s class="' + (k <= pips ? 'on' : '') + '"></s>').join('') + '</div></span></div>';
  }
  h += '</div><div class="cl-tit">Barrios donde protesta</div>';
  const dom = c.base === 'pat' ? 'ciu' : c.base, malos = d.porBarrio.filter(x => x.an[c.base] < DESCONTENTO).sort((a, b) => a.an[c.base] - b.an[c.base]).slice(0, 4);
  if (!d.porBarrio.length) h += '<div class="cl-ok">' + cara('tenso', 28) + 'Aún no hay barrios que medir.</div>';
  else if (!malos.length) h += '<div class="cl-ok">' + cara('bien', 28) + 'Ningún barrio protesta.</div>';
  for (const x of malos) {
    const b = x.b, peor = NEC.NECESIDADES.slice().sort((p, r) => pesos[r.id] * (1 - (b.cob[r.id] || 0)) - pesos[p.id] * (1 - (b.cob[p.id] || 0)))[0];
    let rem = null; try { rem = remedioBarrio(d.D, Object.assign({}, b, { dom })); } catch (e) { rem = null; }
    x._rem = rem; const m = U.msg[b.i], nec = (rem && NEC.NECESIDADES.find(n => n.id === rem.necesidad)) || peor;   // el texto habla de la necesidad que arregla el remedio
    h += '<div class="cl-bq"><div class="f1">' + cara(estadoAnimo(x.an[c.base]), 30) + '<span class="t">' + esc(b.nombre) + '</span><b><small style="font-weight:400;font-size:13px">ánimo </small>' + x.an[c.base] + '</b></div>' +
      '<div class="f2"><span class="cl-ic" style="background:' + COL_NEC[nec.id] + ';--ec:#d4382f;width:26px;height:26px">' + icono(nec.id, 18) + '</span><span>Falta <b>' + esc(nec.nombre.toLowerCase()) + '</b>' + (rem ? ' · Remedio: <b>' + esc(rem.nombre) + '</b>' : '') + '</span></div>' +
      '<button class="cl-enc" data-enc="' + b.i + '"' + (rem ? '' : ' aria-disabled="true"') + '>Encargar al ministro</button>' +
      (m ? '<div class="cl-msg' + (m.ok ? ' ok' : '') + '">' + esc(m.t) + '</div>' : '') + '</div>';
  }
  return h;
}
function pinta() {
  if (!U.el) return; const d = leer(), c = CLASES.find(k => k.id === U.clase), ficha = U.vista === 'ficha' && c;
  U.el.innerHTML = '<div class="cl-hoja" role="dialog" aria-label="Clases sociales"><div class="cl-asa"></div><div class="cl-cab">' + (ficha ? '<button class="cl-btn" data-acc="atras" aria-label="Volver a las clases">‹ Clases</button>' : '') +
    '<h2 class="ro-ansata" style="margin:0 22px 0 20px">' + (ficha ? esc(c.nombre) : 'Clases sociales') + '</h2><button class="cl-btn" data-acc="cerrar">Cerrar</button></div><div class="cl-cuerpo">' + (ficha ? pintarFicha(d, c) : pintarMenu(d)) + '</div></div>';
  if (ficha) montar3D(c); else paraBucle();
}

/* ---------- ficha en 3D ---------- */
function paraBucle() { if (R.raf) { cancelAnimationFrame(R.raf); R.raf = 0; } if (U.io) { U.io.disconnect(); U.io = null; } if (R.ren && R.ren.domElement.parentNode) R.ren.domElement.remove(); R.piv.forEach(p => R.scene && R.scene.remove(p)); R.piv = []; }
async function montar3D(c) {
  const ren = renderer(), mapa = U.el && U.el.querySelector('#cl-mapa'); if (!ren || !mapa) return;
  await cargarIndice(); const ms = await Promise.all([modelo(idDe(c, 'h')), modelo(idDe(c, 'm'))]);
  if (!U.el || U.vista !== 'ficha' || U.clase !== c.id || !R.ren || !document.getElementById('cl-mapa')) return;   // el usuario ya cambió de pantalla
  const vivos = ms.filter(Boolean); if (!vivos.length) return;   // se queda la silueta
  paraBucle(); const mp = document.getElementById('cl-mapa'), w = mp.clientWidth || 360, hh = mp.clientHeight || 216;
  ren.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2)); ren.setSize(w, hh, false); R.cam.aspect = w / hh; R.cam.updateProjectionMatrix(); R.cam.position.set(0, 1.08, 4.7); R.cam.lookAt(0, 1.08, 0);
  const sil = document.getElementById('cl-sil'); if (sil) sil.remove();
  mp.insertBefore(ren.domElement, mp.firstChild);
  ms.forEach((m, k) => { if (!m) return; const dos = vivos.length > 1; m.position.set(dos ? (k ? 0.62 : -0.62) : 0, 0, 0); m.rotation.y = k ? 0.6 : -0.4; R.scene.add(m); R.piv.push(m); });
  U.vis = true;
  if (typeof IntersectionObserver !== 'undefined') { U.io = new IntersectionObserver(es => { U.vis = es[es.length - 1].isIntersecting; arranca(); }); U.io.observe(mp); }
  R.t = 0; arranca();
}
const enVista = () => !!(U.el && U.vista === 'ficha' && R.ren && R.piv.length && U.vis && !document.hidden);
function arranca() { if (!R.raf && enVista()) R.raf = requestAnimationFrame(bucle); }
function bucle(t) {
  R.raf = 0; if (!enVista()) return;
  const dt = R.t ? Math.min(0.1, (t - R.t) / 1000) : 0; R.t = t;
  R.piv.forEach(p => { p.rotation.y += dt * 0.7; }); R.ren.render(R.scene, R.cam); R.raf = requestAnimationFrame(bucle);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { R.t = 0; arranca(); });

/* ---------- eventos ---------- */
function clic(e) {
  const t = e.target.closest('[data-acc],[data-cl],[data-enc]'); if (!t || !U.el) return;
  if (t.dataset.acc === 'cerrar') return cerrar();
  if (t.dataset.acc === 'atras') { U.vista = 'menu'; pinta(); hacerRetratos().catch(() => {}); return; }
  if (t.dataset.cl) { R.gen++; R.haciendo = false; U.vista = 'ficha'; U.clase = t.dataset.cl; U.msg = {}; pinta(); const cu = U.el.querySelector('.cl-cuerpo'); if (cu) cu.scrollTop = 0; return; }
  if (t.dataset.enc !== undefined) {
    const c = CLASES.find(k => k.id === U.clase), x = U.datos && U.datos.porBarrio.find(q => String(q.b.i) === t.dataset.enc), rem = x && x._rem, op = U.op || {}, G = op.juego || root.Game;
    if (!rem) { U.msg[t.dataset.enc] = { ok: false, t: 'Este barrio no tiene remedio claro todavía.' }; return pinta(); }
    let r; const det = Object.assign({ barrio: x.b.i }, rem);
    try { r = op.encargar ? op.encargar(U.cid, det) : (G && G.necEncargar ? G.necEncargar(U.cid, det) : { ok: false, motivo: 'El ministro aún no recibe encargos desde aquí' }); } catch (er) { r = { ok: false, motivo: 'No se pudo encargar' }; }
    U.msg[t.dataset.enc] = r && r.ok ? { ok: true, t: 'Encargado. Míralo en «Ministros».' } : { ok: false, t: ((r && r.motivo) || 'No se pudo') + '.' };
    const cu = U.el.querySelector('.cl-cuerpo'), y = cu ? cu.scrollTop : 0; pinta(); const cu2 = U.el.querySelector('.cl-cuerpo'); if (cu2) cu2.scrollTop = y; void c;
  }
}

export function abrir(cid, op) {
  if (typeof document === 'undefined') return;
  meter(); cerrar();
  R.gen++; if (op && op.base) BASE = op.base; U.cid = cid || (root.UI && root.UI.city) || null; U.op = op || null; U.vista = 'menu'; U.clase = null; U.msg = {};
  U.el = document.createElement('div'); U.el.className = 'cl-fondo'; U.el.id = 'cl-fondo'; U.el.addEventListener('click', clic); document.body.appendChild(U.el);
  pinta();
  hacerRetratos().then(() => { if (U.el && U.vista === 'ficha') { const c = CLASES.find(k => k.id === U.clase); if (c && !R.piv.length) montar3D(c); } }).catch(e => console.warn('Retratos', e));
}
export function cerrar() {
  R.gen++; R.haciendo = false; paraBucle(); if (U.el) { U.el.remove(); U.el = null; }
  liberar();   // un solo renderer: se libera al cerrar (los retratos y los modelos quedan en memoria)
}
export const CLASES_UI = { abrir, cerrar, calcularClases, PATRICIOS_DE_CIU, PESOS_PAT };
root.CLASES_UI = CLASES_UI;
