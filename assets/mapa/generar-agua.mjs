#!/usr/bin/env node
/* AQVILA — genera assets/mapa/agua.js (ríos y lagos) a partir de Natural Earth 10m (dominio público, naturalearthdata.com).
   Uso: node assets/mapa/generar-agua.mjs carpeta/con/ne_10m_rivers_lake_centerlines.geojson+ne_10m_lakes.geojson
   Recorta al marco del mapa (lon -7..25, lat 34.5..47), simplifica y redondea a 2 decimales.
   Salida: { rios: [{ n, w, l: [polilínea, ...] }], lagos: [{ n, p: [[lon, lat], ...] }] } con w = ancho en casillas del mapa. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const X0 = -7, X1 = 25, Y0 = 34.5, Y1 = 47, TOL = 0.011;
const dir = process.argv[2];
if (!dir) { console.log('Uso: node generar-agua.mjs <carpeta con los dos geojson>'); process.exit(1); }
const leer = f => JSON.parse(readFileSync(join(dir, f), 'utf8'));
// Ríos que entran: nombre en los datos -> [nombre en el juego, ancho en casillas]. Los que no existen en los datos no se inventan.
const RIOS = { Danube: ['Danubio', 1.2], Po: ['Po', 1.1], 'Rhône': ['Ródano', 1.0], 'Rhne': ['Ródano', 1.0], Ebro: ['Ebro', 0.85], Tevere: ['Tíber', 0.8],
  Adige: ['Adigio', 0.6], Ticino: ['Tesino', 0.55], Mincio: ['Mincio', 0.45], Durance: ['Durance', 0.5], Ofanto: ['Ófanto', 0.5], Tajo: ['Tajo', 0.8], Guadalquivir: ['Guadalquivir', 0.8],
  Guadiana: ['Guadiana', 0.65], Duero: ['Duero', 0.75], Segre: ['Segre', 0.5], Garonne: ['Garona', 0.6], Sava: ['Sava', 0.85], Drau: ['Drava', 0.7], Tisa: ['Tisza', 0.8], Mures: ['Mureș', 0.6],
  Morava: ['Morava', 0.55], Drin: ['Drin', 0.5], Haliacmon: ['Haliacmón', 0.5], Strymnas: ['Estrimón', 0.5], Evros: ['Hebro', 0.6], Drina: ['Drina', 0.5], Olt: ['Olt', 0.55], Mur: ['Mura', 0.5], null: ['Danubio', 1.1] };
const LAGOS = { 'Lake Geneva': 'Lemano', 'Lago di Como': 'Como', 'Lago di Garda': 'Garda', 'Lago di Bracciano': 'Bracciano', 'Lake Balaton': 'Balatón', 'Lake Skadar': 'Escútari' };
// lagos sin nombre en los datos, identificados por su centro (Ohrid y Prespa)
const LAGOS_SIN_NOMBRE = [{ lo: 20.72, la: 41.04, n: 'Ohrid' }, { lo: 21.0, la: 40.87, n: 'Prespa' }];
const dentro = p => p[0] >= X0 && p[0] <= X1 && p[1] >= Y0 && p[1] <= Y1;
// recorta una polilínea al marco (Liang–Barsky por tramo) y devuelve los trozos que quedan dentro
function recorta(l) {
  const out = []; let cur = [];
  for (let i = 0; i + 1 < l.length; i++) {
    const [ax, ay] = l[i], [bx, by] = l[i + 1], dx = bx - ax, dy = by - ay; let t0 = 0, t1 = 1;
    for (const [p, q] of [[-dx, ax - X0], [dx, X1 - ax], [-dy, ay - Y0], [dy, Y1 - ay]]) { if (p === 0) { if (q < 0) { t0 = 2; break; } } else { const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r); } }
    if (t0 > t1) { if (cur.length > 1) out.push(cur); cur = []; continue; }
    const a = [ax + dx * t0, ay + dy * t0], b = [ax + dx * t1, ay + dy * t1];
    if (t0 > 0 && cur.length > 1) { out.push(cur); cur = []; }
    if (!cur.length) cur.push(a); cur.push(b); if (t1 < 1) { out.push(cur); cur = []; }
  }
  if (cur.length > 1) out.push(cur); return out;
}
const dseg = (q, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L)) : 0; return Math.hypot(q[0] - a[0] - dx * t, q[1] - a[1] - dy * t); };
function dp(p, tol) { if (p.length < 3) return p; const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let m = -1, k = 0; for (let i = a + 1; i < b; i++) { const d = dseg(p[i], p[a], p[b]); if (d > m) { m = d; k = i; } } if (m > tol) { keep[k] = 1; st.push([a, k], [k, b]); } }
  return p.filter((_, i) => keep[i]); }
const r2 = p => p.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]);
const quita = p => p.filter((q, i) => !i || q[0] !== p[i - 1][0] || q[1] !== p[i - 1][1]);
const rios = new Map(), faltan = [];
for (const f of leer('ne_10m_rivers_lake_centerlines.geojson').features) {
  const nm = f.properties.name, def = RIOS[nm]; if (!def) continue;
  const g = f.geometry, ls = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
  // los ríos sin nombre solo valen si son el Danubio/Tisza de la llanura panonia (lon 19..21, lat 45.5..47)
  if (nm === null) { const c = ls[0][0]; if (!(c[0] > 19 && c[0] < 22 && c[1] > 45.4)) continue; }
  const o = rios.get(def[0]) || { n: def[0], w: def[1], l: [] }; rios.set(def[0], o);
  for (const l of ls) for (const t of recorta(l)) { const s = quita(r2(dp(t, TOL))); if (s.length > 1) o.l.push(s); }
}
for (const n of ['Po', 'Tevere', 'Ebro', 'Rhône', 'Danube', 'Adige', 'Guadalquivir', 'Tajo']) if (!rios.has(RIOS[n][0])) faltan.push(n);
const lagos = [];
const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); };
for (const f of leer('ne_10m_lakes.geojson').features) {
  const g = f.geometry, ps = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; let nm = LAGOS[f.properties.name];
  for (const p of ps) { const r = p[0].slice(0, -1); if (!r.some(dentro)) continue; const c = r.reduce((s, q) => [s[0] + q[0] / r.length, s[1] + q[1] / r.length], [0, 0]);
    if (!nm) { const u = LAGOS_SIN_NOMBRE.find(l => Math.hypot(l.lo - c[0], l.la - c[1]) < 0.12); if (!u) continue; nm = u.n; }
    const s = quita(r2(dp(r.concat([r[0]]), 0.012).slice(0, -1).map(q => [Math.max(X0, Math.min(X1, q[0])), Math.max(Y0, Math.min(Y1, q[1]))]))); if (s.length >= 3 && area(s) > 0.0004) lagos.push({ n: nm, p: s }); }
}
const out = { rios: [...rios.values()], lagos };
const txt = '/* AQVILA — ríos y lagos del mapa. Datos: Natural Earth (ne_10m_rivers_lake_centerlines y ne_10m_lakes), dominio público (naturalearthdata.com).\n   Generado con assets/mapa/generar-agua.mjs; recortado al marco del mapa y simplificado. w = ancho del río en casillas del mapa. */\nexport default ' + JSON.stringify(out) + ';\n';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'agua.js'), txt);
console.log(out.rios.length, 'ríos,', out.rios.reduce((s, r) => s + r.l.reduce((a, l) => a + l.length, 0), 0), 'puntos;', lagos.length, 'lagos,', lagos.reduce((s, l) => s + l.p.length, 0), 'puntos;', (txt.length / 1024).toFixed(1), 'KB');
console.log('Ríos:', out.rios.map(r => r.n).join(', ')); console.log('Lagos:', [...new Set(lagos.map(l => l.n))].join(', '));
console.log('No existen en los datos o quedan fuera del marco: Arno, Nilo (el marco acaba en lat 34,5; el delta está en 31), Lago Maggiore, Trasimeno, Bolsena, Fucino.' + (faltan.length ? ' Faltan además: ' + faltan.join(', ') : ''));
