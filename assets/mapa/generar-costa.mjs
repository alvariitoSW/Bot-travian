#!/usr/bin/env node
/* AQVILA — genera assets/mapa/costa.js a partir de Natural Earth (ne_50m_land, dominio público).
   Uso: node assets/mapa/generar-costa.mjs ruta/a/ne_50m_land.geojson
   Recorta al marco del mapa (lon -7..25, lat 34.5..47), simplifica y redondea a 2 decimales. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const X0 = -7, X1 = 25, Y0 = 34.5, Y1 = 47, TOL = 0.016, AREA_MIN = 0.004;
const gj = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const rings = [];
for (const f of gj.features) { const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const p of polys) for (const r of p) rings.push(r); }
// Sutherland–Hodgman contra un lado del marco
const clip = (pts, inside, cut) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(cut(a, b)); } return out; };
const lerpX = x => (a, b) => [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])], lerpY = y => (a, b) => [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y];
function marco(r) { let p = r.slice(0, -1); for (const [ins, cut] of [[a => a[0] >= X0, lerpX(X0)], [a => a[0] <= X1, lerpX(X1)], [a => a[1] >= Y0, lerpY(Y0)], [a => a[1] <= Y1, lerpY(Y1)]]) { if (!p.length) break; p = clip(p, ins, cut); } return p; }
const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); };
function dp(p, tol) { // Douglas–Peucker sobre anillo cerrado: partimos por el punto más lejano del primero
  const d2 = (q, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l)) : 0; return Math.hypot(q[0] - a[0] - dx * t, q[1] - a[1] - dy * t); };
  const rec = (a, b, keep) => { let m = -1, k = 0; for (let i = a + 1; i < b; i++) { const d = d2(p[i], p[a], p[b]); if (d > m) { m = d; k = i; } } if (m > tol) { rec(a, k, keep); keep.add(k); rec(k, b, keep); } };
  let far = 0, fd = -1; for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[0][0], p[i][1] - p[0][1]); if (d > fd) { fd = d; far = i; } }
  const keep = new Set([0, far]); rec(0, far, keep); const q = p.concat([p[0]]); const keep2 = new Set(); { const pp = p; const rec2 = (a, b) => { let m = -1, k = 0; for (let i = a + 1; i < b; i++) { const d = d2(q[i], q[a], q[b]); if (d > m) { m = d; k = i; } } if (m > tol) { rec2(a, k); keep2.add(k); rec2(k, b); } }; keep2.add(far); rec2(far, p.length); }
  return p.filter((_, i) => keep.has(i) || keep2.has(i));
}
// Las ciudades del juego están puestas «a ojo» (data.js no se toca): si alguna cae en el mar o pegada a la orilla,
// se engorda esa isla un poco hacia fuera para que la ciudad quede en tierra firme.
const require = createRequire(import.meta.url), D = require(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'js', 'data.js'));
const inP = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0; return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); };
const dEdge = (x, y, p) => { let m = 9; for (let i = 0; i < p.length; i++) m = Math.min(m, dSeg(x, y, p[i], p[(i + 1) % p.length])); return m; };
function normales(p) { const sa = p.reduce((s, a, i) => s + (a[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * a[1]), 0) > 0 ? 1 : -1; return p.map((a, i) => { const b = p[(i + p.length - 1) % p.length], c = p[(i + 1) % p.length], nx = (c[1] - b[1]) * sa, ny = -(c[0] - b[0]) * sa, l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; }); }
// Empuja la orilla hacia fuera solo cerca de la ciudad (radio R, con caída suave); antes se afinan los lados largos para que haya puntos que mover.
function engordaCerca(p, ci, d, R) {
  const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], n = Math.min(12, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.08)); q.push(a); if (dSeg(ci.lon, ci.lat, a, b) < R) for (let k = 1; k < n; k++) q.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
  const nm = normales(q); return q.map((a, i) => { const w = Math.max(0, 1 - Math.hypot(a[0] - ci.lon, (a[1] - ci.lat) * 1.28) / R), k = d * w * w * (3 - 2 * w); return [a[0] + nm[i][0] * k, a[1] + nm[i][1] * k]; });
}
const MARGEN = 0.16, MAXD = 0.3, ciudades = Object.values(D.CITIES);
const out = [];
for (const r of rings) { const c = marco(r); if (c.length < 3 || area(c) < AREA_MIN) continue; let s = dp(c, TOL); if (s.length < 3 || area(s) < AREA_MIN) continue;
  for (const ci of ciudades) { const e = dEdge(ci.lon, ci.lat, s), sd = inP(ci.lon, ci.lat, s) ? e : -e; if (sd < MARGEN && e < 0.5) { const need = Math.min(MARGEN - sd + 0.06, MAXD); s = engordaCerca(s, ci, need, 0.9); console.log('orilla empujada', need.toFixed(2), '° junto a', ci.n); } }
  out.push(s.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)])); }
const txt = '/* AQVILA — costa del Mediterráneo para el mapa. Datos: Natural Earth (ne_50m_land), dominio público (naturalearthdata.com).\n   Generado con assets/mapa/generar-costa.mjs; recortado al marco del mapa y simplificado. */\nexport default ' + JSON.stringify(out).replace(/\],\[\[/g, '],\n[[') + ';\n';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'costa.js'), txt);
console.log(out.length, 'polígonos,', out.reduce((s, p) => s + p.length, 0), 'puntos,', (txt.length / 1024).toFixed(1), 'KB');
