// AQVILA · AM2 — prueba de los datos del mapa de Grecia (assets/mapa-grecia/). Node puro. Uso: node test/mapa-grecia.test.mjs
import fs from 'node:fs'; import zlib from 'node:zlib'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), DIR = path.join(AQUI, '..', 'assets', 'mapa-grecia');
let fallos = 0;
const ok = (c, m) => { console.log((c ? 'ok    ' : 'FALLA ') + m); if (!c) fallos++; };
const X0 = 19.3, X1 = 28.3, Y0 = 34.7, Y1 = 41.0, KMLON = 111.32 * Math.cos(38 * Math.PI / 180), KMLAT = 110.57;

// --- PNG RGB 8 bits sin entrelazar, 5 filtros ---
function leerPNG(buf) {
  let p = 8, w = 0, h = 0, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), tipo = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (tipo === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[9] !== 2 || d[12] !== 0) throw new Error('PNG no es RGB 8 bits sin entrelazar'); }
    if (tipo === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 3, st = w * bpp, px = Buffer.alloc(h * st);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], o = y * (st + 1) + 1, q = y * st;
    for (let x = 0; x < st; x++) {
      const v = raw[o + x], a = x >= bpp ? px[q + x - bpp] : 0, b = y ? px[q - st + x] : 0, c = x >= bpp && y ? px[q - st + x - bpp] : 0;
      let r;
      if (f === 0) r = v; else if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[q + x] = r & 255;
    }
  }
  return { w, h, px };
}
const archivo = path.join(DIR, 'alturas.png'), peso = fs.statSync(archivo).size;
const { w: W, h: H, px } = leerPNG(fs.readFileSync(archivo));
ok(W === 2160 && H === 1920, `tamaño ${W}x${H} = 2160x1920`);
ok(peso <= 7 * 1024 * 1024, `peso ${(peso / 1024).toFixed(0)} KB <= 7 MB`);
const alt = (j, i) => ((px[(j * W + i) * 3] * 256 + px[(j * W + i) * 3 + 1]) / 6) - 5000;       // metros
const dist = (j, i) => (px[(j * W + i) * 3 + 2] - 128) / 8;                                       // celdas, + tierra, - mar
const celda = (lon, lat) => [Math.min(H - 1, Math.max(0, Math.floor((Y1 - lat) / (Y1 - Y0) * H))), Math.min(W - 1, Math.max(0, Math.floor((lon - X0) / (X1 - X0) * W)))];
const tierra = (lon, lat) => { const [j, i] = celda(lon, lat); return alt(j, i) > 0; };
let nt = 0; for (let k = 0; k < W * H; k++) if ((px[k * 3] * 256 + px[k * 3 + 1]) / 6 - 5000 > 0) nt++;
const pct = nt / (W * H) * 100;
ok(pct >= 20 && pct <= 45, `tierra ${pct.toFixed(1)} % (entre 20 y 45)`);

// km hasta el mar: busca la celda de mar más cercana en anillos
function kmAlMar(lon, lat) {
  const [j0, i0] = celda(lon, lat); let mejor = 1e9;
  for (let r = 0; r < 120; r++) {
    for (let j = Math.max(0, j0 - r); j <= Math.min(H - 1, j0 + r); j++) for (let i = Math.max(0, i0 - r); i <= Math.min(W - 1, i0 + r); i++) {
      if (Math.max(Math.abs(j - j0), Math.abs(i - i0)) !== r || alt(j, i) > 0) continue;
      const km = Math.hypot((i - i0) * (X1 - X0) / W * KMLON, (j - j0) * (Y1 - Y0) / H * KMLAT); if (km < mejor) mejor = km;
    }
    if (mejor < 1e9 && r * 0.33 > mejor) break;
  }
  return mejor;
}
const POLIS = [['atenas', 23.73, 37.98], ['esparta', 22.43, 37.07], ['corinto', 22.88, 37.905], ['argos', 22.72, 37.63], ['tebas', 23.32, 38.32], ['megara', 23.34, 38.0], ['mileto', 27.28, 37.53], ['calcis', 23.6, 38.46]];
for (const [id, lon, lat] of POLIS) {
  ok(tierra(lon, lat), `${id} está en tierra`);
  if (id !== 'esparta' && id !== 'tebas') { const km = kmAlMar(lon, lat); ok(km < 12, `${id} a ${km.toFixed(1)} km del mar (< 12)`); }
}
{ const [j, i] = celda(22.35, 40.08); let m = 0; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) m = Math.max(m, alt(j + a, i + b)); ok(m > 2300, `Olimpo ${m.toFixed(0)} m (> 2300)`); }

// rutas: todo en mar (vértices y puntos medios)
const rutas = (await import(pathToFileURL(path.join(DIR, 'rutas.js')).href)).default;
ok(rutas.length >= 16, `${rutas.length} rutas (>= 16)`);
let malas = [];
for (const r of rutas) for (let k = 0; k < r.l.length; k++) {
  const [lon, lat] = r.l[k];
  if (tierra(lon, lat)) malas.push(`${r.n} vértice ${k}`);
  if (k) { const [a, b] = r.l[k - 1]; if (tierra((a + lon) / 2, (b + lat) / 2)) malas.push(`${r.n} tramo ${k - 1}-${k}`); }
}
ok(malas.length === 0, 'todas las rutas van por mar' + (malas.length ? ': ' + malas.slice(0, 5).join('; ') : ''));

// ríos (rios.js): derivados del relieve
const rios = (await import(pathToFileURL(path.join(DIR, 'rios.js')).href)).default;
ok(rios.length >= 40, `${rios.length} tramos de río (>= 40)`);
ok(rios.every(r => r.l.length >= 2 && r.l.every(([lon, lat]) => lon >= X0 && lon <= X1 && lat >= Y0 && lat <= Y1)), 'todos los vértices de ríos dentro del marco');
{ const malos = rios.filter(r => r.l.filter(([lon, lat]) => { const [j, i] = celda(lon, lat); return alt(j, i) > -5; }).length < 0.9 * r.l.length);
  ok(malos.length === 0, 'cada tramo de río tiene >= 90 % de sus vértices en tierra' + (malos.length ? ': ' + malos.slice(0, 3).map(r => r.n || '?').join(', ') : '')); }
ok(rios.every(r => r.w >= 1 && r.w <= 3), 'anchos de río entre 1 y 3');
for (const n of ['Peneo', 'Eurotas', 'Alfeo']) ok(rios.some(r => r.n === n), `río ${n} existe por nombre`);
{ const kb = fs.statSync(path.join(DIR, 'rios.js')).size / 1024; ok(kb <= 100, `rios.js pesa ${kb.toFixed(0)} KB (<= 100)`); }

// AM2: datos.js del mapa, contra el relieve ya decodificado
const D = await import(pathToFileURL(path.join(AQUI, '..', 'js', 'gfx', 'mapa-grecia-datos.js')).href);
const mar = (lon, lat) => { const [j, i] = celda(lon, lat); return alt(j, i) <= 0; };
const marCerca = (lon, lat, n) => { const [j0, i0] = celda(lon, lat); for (let j = Math.max(0, j0 - n); j <= Math.min(H - 1, j0 + n); j++) for (let i = Math.max(0, i0 - n); i <= Math.min(W - 1, i0 + n); i++) if (alt(j, i) <= 0) return true; return false; };
const tierraCerca = (lon, lat, n) => { const [j0, i0] = celda(lon, lat); for (let j = Math.max(0, j0 - n); j <= Math.min(H - 1, j0 + n); j++) for (let i = Math.max(0, i0 - n); i <= Math.min(W - 1, i0 + n); i++) if (alt(j, i) > 0) return true; return false; };
{
  const ids = D.POLIS.map(p => p.id), esperadas = ['atenas', 'esparta', 'corinto', 'argos', 'tebas', 'megara', 'mileto', 'calcis'];
  ok(D.POLIS.length === 8 && new Set(ids).size === 8 && esperadas.every(i => ids.includes(i)), `8 polis con id único (${ids.join(', ')})`);
  ok(D.POLIS.every(p => p.color && D.LUJOS[p.lujo] && p.casas > 0), 'cada polis tiene color, lujo existente en LUJOS y casas');
  for (const k in D.BASICOS) { const n = D.ZONAS.filter(z => z.t === k).length; ok(n >= 3, `básico ${k} en ${n} zonas (>= 3)`); }
  ok(D.ZONAS.every(z => D.BASICOS[z.t]), 'toda zona es de un básico conocido');
  for (const k in D.LUJOS) { const n = D.POLIS.filter(p => p.lujo === k).length; ok(n >= 1 && n <= 3, `lujo ${k} en ${n} polis (1 a 3)`); }
  const sinTierra = D.ZONAS.filter(z => !tierra(z.lon, z.lat)).map(z => `${z.n} (${z.lon}, ${z.lat}) alt ${alt(...celda(z.lon, z.lat)).toFixed(0)} m`);
  ok(sinTierra.length === 0, 'el centro de cada zona cae en tierra' + (sinTierra.length ? ': ' + sinTierra.join('; ') : ''));
  const malosC = [];
  D.CAMINOS.forEach((c, n) => c.forEach(([lon, lat], k) => { if (tierra(lon, lat)) return; const extremo = k === 0 || k === c.length - 1; if (extremo && marCerca(lon, lat, 0) && tierraCerca(lon, lat, 1)) return; malosC.push(`camino ${n} punto ${k} (${lon}, ${lat})${extremo ? ' extremo' : ''}`); }));
  ok(malosC.length === 0, 'todos los puntos de CAMINOS en tierra (salvo extremos de puerto)' + (malosC.length ? ': ' + malosC.join('; ') : ''));
  const fuera = D.LUGARES.filter(l => l.lon < X0 || l.lon > X1 || l.lat < Y0 || l.lat > Y1).map(l => l.n);
  ok(fuera.length === 0, `${D.LUGARES.length} LUGARES dentro del marco` + (fuera.length ? ': ' + fuera.join(', ') : ''));
  const malosL = [];
  for (const l of D.LUGARES) {
    if ((l.c === 'mar' || l.c === 'golfo') && /^(Mar|Golfo)/.test(l.n)) { if (!mar(l.lon, l.lat)) malosL.push(`${l.n} (${l.lon}, ${l.lat}) no cae en mar, alt ${alt(...celda(l.lon, l.lat)).toFixed(0)} m`); }
    else if (['monte', 'lugar', 'comarca'].includes(l.c)) { if (!tierra(l.lon, l.lat) && !tierraCerca(l.lon, l.lat, 2)) malosL.push(`${l.n} [${l.c}] (${l.lon}, ${l.lat}) en mar, a más de 2 celdas de tierra`); }
  }
  ok(malosL.length === 0, 'LUGARES sobre su terreno' + (malosL.length ? ':\n        ' + malosL.join('\n        ') : ''));
  const rp = D.recursosPorPolis();
  ok(D.POLIS.every(p => rp[p.id] && rp[p.id].lujo && Array.isArray(rp[p.id].faltan)), 'recursosPorPolis() da lujo y faltan por polis');
  const at = D.comarca(D.POLIS.find(p => p.id === 'atenas'));
  ok(!at.tiene.grano && at.faltan.includes('grano'), 'la comarca de Atenas no tiene grano (por diseño); tiene: ' + Object.keys(at.tiene).join(', '));
  let tot = 0; const filas = [];
  for (const f of fs.readdirSync(DIR)) { const b = fs.statSync(path.join(DIR, f)).size; tot += b; filas.push(`${f} ${(b / 1024).toFixed(0)} KB`); }
  console.log('      pesos: ' + filas.join(', '));
  ok(tot <= 6 * 1024 * 1024, `assets/mapa-grecia pesa ${(tot / 1048576).toFixed(2)} MB en total (<= 6 MB)`);
}

console.log(fallos ? `\n${fallos} FALLO(S)` : '\ntodo ok'); process.exit(fallos ? 1 : 0);
