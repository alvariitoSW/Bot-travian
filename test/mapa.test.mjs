/* AQVILA — prueba de las alturas reales del mapa (assets/mapa/alturas.js): picos en su sitio, Roma baja, mar negativo, peso.
   Uso: node test/mapa.test.mjs */
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import A from '../assets/mapa/alturas.js';
const M = A.metros(), W = A.w;
const at = (lon, lat) => { const i = Math.round((lon - A.x0) / (A.x1 - A.x0) * (A.w - 1)), j = Math.round((A.y1 - lat) / (A.y1 - A.y0) * (A.h - 1)); return M[j * W + i]; };
// máximo en un entorno de r grados (los picos reales no caen justo en un nodo)
const cerca = (lon, lat, r) => { let m = -1e9; for (let y = lat - r; y <= lat + r; y += 0.03) for (let x = lon - r; x <= lon + r; x += 0.03) m = Math.max(m, at(x, y)); return m; };
let fallos = 0;
const ok = (c, msg) => { if (!c) { fallos++; console.log('FALLA: ' + msg); } };
const kb = statSync(fileURLToPath(new URL('../assets/mapa/alturas.js', import.meta.url))).size / 1024;
ok(kb <= 250, 'alturas.js pesa ' + kb.toFixed(0) + ' KB (tope 250)');
ok(M.length === A.w * A.h, 'tamaño de la malla');
const picos = { 'Mont Blanc': [6.87, 45.83, 2800], 'Etna': [15.0, 37.75, 2500], 'Gran Sasso': [13.57, 42.47, 1800], 'Olimpo': [22.35, 40.09, 2000], 'Sierra Nevada': [-3.2, 37.05, 2000] };
const val = {};
for (const k in picos) { const [lo, la, min] = picos[k]; val[k] = Math.round(cerca(lo, la, 0.1)); ok(val[k] >= min, k + ' demasiado bajo: ' + val[k] + ' m (mínimo ' + min + ')'); }
// en su sitio: el pico sale más alto que la llanura a unos grados de distancia
ok(cerca(6.87, 45.83, 0.1) > at(9.0, 45.0) + 3000, 'Mont Blanc no destaca');
ok(cerca(15.0, 37.75, 0.1) > cerca(15.0, 37.0, 0.1) + 1200, 'Etna no destaca');
ok(cerca(22.35, 40.09, 0.1) > at(22.35, 39.4) + 1200, 'Olimpo no destaca');
const roma = at(12.5, 41.9); ok(roma < 150, 'Roma no es baja: ' + roma + ' m');
const mares = { 'Tirreno': [11.5, 39.5], 'Jónico': [18.5, 37.5], 'Egeo': [25 - 0.5, 38.5], 'Adriático': [15.5, 43.3], 'Golfo de León': [4.5, 42.5] };
for (const k in mares) ok(at(...mares[k]) < -50, 'mar no negativo en ' + k + ': ' + at(...mares[k]));
console.log('Alturas (m): ' + Object.entries(val).map(([k, v]) => k + ' ' + v).join(', ') + ', Roma ' + Math.round(roma) + ', máx ' + Math.round(Math.max(...M)) + '; archivo ' + kb.toFixed(0) + ' KB');
console.log(fallos ? fallos + ' fallos' : 'APTO: alturas reales en su sitio');
process.exit(fallos ? 1 : 0);
