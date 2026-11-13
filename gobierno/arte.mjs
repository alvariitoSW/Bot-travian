#!/usr/bin/env node
/* AQVILA — ministerio de Arte: pesa el arte, cuenta triángulos y comprueba las licencias.
   Uso:  node gobierno/arte.mjs   (sale con código 1 si se pasa del presupuesto o falta una licencia)
   El presupuesto está en gobierno/arte.json; lo decide el usuario. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = JSON.parse(await readFile(join(RAIZ, 'gobierno', 'arte.json'), 'utf8'));
const MB = b => (b / 1048576).toFixed(1) + ' MB';
const fallos = [];

async function peso(dir) { let t = 0; for (const f of await readdir(dir, { withFileTypes: true })) t += f.isDirectory() ? await peso(join(dir, f.name)) : (await stat(join(dir, f.name))).size; return t; }

let total = 0; const TRIS = {};   // triángulos de cada pieza, para sumar escenas
for (const [carpeta, indice, tope, nombre] of [['assets/units', 'units.json', P.triangulosPorUnidad, 'unidad'], ['assets/static', 'static.json', P.triangulosPorEdificio, 'edificio']]) {
  const dir = join(RAIZ, carpeta), b = await peso(dir); total += b;
  const idx = JSON.parse(await readFile(join(dir, indice), 'utf8'));
  const tris = Object.entries(idx).filter(([, v]) => v.verts).map(([k, v]) => [k, Math.round(v.verts / 3)]).sort((a, c) => c[1] - a[1]);   // mallas sin índices: 3 vértices por triángulo
  for (const [k, n] of tris) TRIS[k] = n;
  console.log(carpeta + ' · ' + MB(b) + ' · ' + tris.length + ' piezas · la mayor: ' + tris[0][0] + ' (' + tris[0][1] + ' triángulos)');
  for (const [k, n] of tris) if (n > tope) fallos.push(k + ': ' + n + ' triángulos (tope por ' + nombre + ': ' + tope + ')');
  try { const l = await readFile(join(dir, 'LICENSE.txt'), 'utf8'); if (!/CC BY-SA 3\.0/.test(l) || !/Wildfire Games/.test(l)) fallos.push(carpeta + '/LICENSE.txt no cita a Wildfire Games y la CC BY-SA 3.0'); }
  catch (e) { fallos.push('falta ' + carpeta + '/LICENSE.txt'); }
}
console.log('Descarga total de arte: ' + MB(total) + ' (tope: ' + P.descargaMB + ' MB)');
if (total > P.descargaMB * 1048576) fallos.push('el arte pesa ' + MB(total) + ' y el tope es ' + P.descargaMB + ' MB');
for (const [f, re] of [['README.md', /CC BY-SA 3\.0/], ['js/ui.js', /Wildfire Games/]]) if (!re.test(await readFile(join(RAIZ, f), 'utf8'))) fallos.push('falta el crédito de 0 A.D. en ' + f);

/* ---- Escenas típicas (E3): cuántos triángulos pide una batalla y una ciudad normales ----
   Es una cuenta aproximada a partir de js/data.js y de los índices de assets/. Sigue las reglas de js/gfx/battle3d.js
   (figuras por regimiento) y js/gfx/city3d.js (casas, muralla, barcos, árboles). Si esas reglas cambian, hay que cambiarlas aquí. */
const D = createRequire(import.meta.url)(join(RAIZ, 'js', 'data.js')), E = P.escenas, mil = n => Math.round(n / 1000) + ' mil';
const tri = k => TRIS[k] || 0;
// Batalla: el ejército romano de arte.json contra la guarnición más grande del mapa, cada uno con su general.
const hombres = g => Object.values(g).reduce((a, b) => a + b, 0);
const rival = Object.entries(D.CITIES).filter(([, c]) => c.f !== 'roma').sort((a, b) => hombres(b[1].g) - hombres(a[1].g))[0];
const bandos = [E.ejercitoRomano, rival[1].g];
const grande = Math.max(...bandos.map(g => Object.entries(g).reduce((a, [k, n]) => a + (D.UNITS[k].cls === 'ele' ? 0 : n), 0)));
const regimiento = Math.max(30, Math.ceil(grande / 12));                                   // como en js/battle.js
const figurasMax = k => ({ ele: 99, cav: 30, gen: 30, rng: 50 })[D.UNITS[k].cls] || 60;        // como formation() en battle3d.js
let soldados = 0, trisBatalla = 0;
for (const g of bandos) for (const [k, n] of Object.entries({ ...g, general: 1 })) {
  const regs = D.UNITS[k].cls === 'ele' || k === 'general' ? 1 : Math.ceil(n / regimiento), fig = regs * Math.min(Math.ceil(n / regs), figurasMax(k));
  soldados += fig; trisBatalla += fig * tri(k);
}
// El juego ya recorta: si la batalla pide más que su tope de móvil (TRI_BUDGET en battle3d.js), pinta menos soldados.
const recorte = +((await readFile(join(RAIZ, 'js', 'gfx', 'battle3d.js'), 'utf8')).match(/TRI_BUDGET = \(.*?\? ([\d.e]+)/) || [0, Infinity])[1];
const pintados = Math.min(trisBatalla, recorte), visibles = Math.round(soldados * pintados / trisBatalla);
console.log('Batalla típica (Roma contra ' + rival[1].n + '): pide ' + soldados + ' soldados y ' + mil(trisBatalla) + ' triángulos · en móvil se pintan ' + visibles + ' soldados y ' + mil(pintados) + ' (tope: ' + mil(E.triangulosPorBatalla) + ')');
if (pintados < trisBatalla) console.log('  aviso: el juego recorta la batalla al ' + Math.round(100 * pintados / trisBatalla) + ' % de sus soldados para no pasar de ' + mil(recorte) + ' triángulos en móvil');
if (pintados > E.triangulosPorBatalla) fallos.push('la batalla típica pinta ' + mil(pintados) + ' triángulos y el tope es ' + mil(E.triangulosPorBatalla));
// Ciudad: todos los edificios de data.js a un nivel medio, con sus casas, muralla, barcos y arbolado.
const nv = E.nivelCiudad, piezas = { casa: 2 + nv * 3, muro: 16, puerta: 4, torre: 21, barco: Math.min(5, nv) - Math.floor(Math.min(5, nv) / 3), trirreme: Math.floor(Math.min(5, nv) / 3), ...E.arboles };
for (const b in D.BUILD) if (TRIS[b]) piezas[b] = 1;
// Las casas se reparten a partes iguales entre las variantes que existan (casa, casa_b, casa_c, casa_d). Cuenta aproximada: cuando js/gfx/city3d.js elija variantes, hay que ajustarla aquí.
const vCasa = ['casa', 'casa_b', 'casa_c', 'casa_d'].filter(k => TRIS[k]), nCasa = piezas.casa; delete piezas.casa;
vCasa.forEach((k, i) => { piezas[k] = Math.floor(nCasa / vCasa.length) + (i < nCasa % vCasa.length ? 1 : 0); });
let nPiezas = 0, trisCiudad = 0; for (const k in piezas) { nPiezas += piezas[k]; trisCiudad += piezas[k] * tri(k); }
console.log('Ciudad típica (todos los edificios, nivel ' + nv + '): ' + nPiezas + ' piezas · ' + mil(trisCiudad) + ' triángulos (tope: ' + mil(E.triangulosPorCiudad) + ')');
// Vida (CN11, js/gfx/vida.js): gente, carros, guarnición. Se cuenta el peor caso teórico con los topes del propio módulo.
const vsrc = await readFile(join(RAIZ, 'js', 'gfx', 'vida.js'), 'utf8'), cte = n => +(vsrc.match(new RegExp(n + ' = (\\d+)')) || [0, 0])[1];
const nGente = cte('N_GENTE'), nCarros = cte('N_CARROS'), gReal = cte('GUARN_REAL_MAX'), gTope = cte('GUARN_CAP'), LIGERA = 60;   // 60 = LIGHT_TRIS de units.js
const rom = Object.entries(E.ejercitoRomano), trisSold = rom.reduce((a, [k, n]) => a + n * tri(k), 0) / rom.reduce((a, [, n]) => a + n, 0);   // media de la tropa romana de arte.json
const trisGente = nGente * tri('ciudadana'), trisCarros = nCarros * tri('prop_carreta'), trisGuarn = gReal * trisSold + (gTope - gReal) * LIGERA;
console.log('Vida de la ciudad (máximo teórico): gente ' + mil(trisGente) + ' (' + nGente + '), carros ' + mil(trisCarros) + ' (' + nCarros + '), guarnición ' + mil(trisGuarn) + ' (' + gReal + ' reales + ' + (gTope - gReal) + ' ligeras)');
if (trisGente + trisCarros + trisGuarn > E.triangulosPorCiudad) fallos.push('la vida de la ciudad (gente, carros, guarnición) pide por sí sola ' + mil(trisGente + trisCarros + trisGuarn) + ' triángulos y el tope es ' + mil(E.triangulosPorCiudad));
// Fachadas (CN15a, js/gfx/fachadas.js): puestos de la plaza, toldos, ropa tendida y macetas. Peor caso con los topes del propio módulo.
const fsrc = await readFile(join(RAIZ, 'js', 'gfx', 'fachadas.js'), 'utf8'), fcte = n => +(fsrc.match(new RegExp(n + ' = (\\d+)')) || [0, 0])[1], fint = n => new RegExp('export const ' + n + ' = true').test(fsrc);
const nPuestos = fcte('N_PUESTOS_MAX'), nToldos = fcte('N_TOLDOS_MAX'), nRopa = fcte('N_ROPA_MAX'), nMacetas = fcte('N_MACETAS_MAX');
// puesto = 4 postes y 4 tiras de toldo (8 cajas, 12 triángulos cada una) + mesa + la mayor de cesto o sacos + vaso o caja; toldo pequeño = 3 cajas; tendero = cuerda y 3 paños (4 cajas)
const trisPuesto = 96 + tri('prop_mesa') + Math.max(tri('prop_cesto'), tri('prop_sacos')) + Math.max(tri('prop_vaso'), tri('prop_caja'));
const trisFach = (fint('FACHADAS_PUESTOS') ? nPuestos * trisPuesto : 0) + (fint('FACHADAS_TOLDOS') ? nToldos * 36 : 0) + (fint('FACHADAS_ROPA') ? nRopa * 48 : 0) + (fint('FACHADAS_BARRIO') ? nMacetas * tri('prop_vaso') : 0);
console.log('Fachadas (máximo teórico): ' + mil(trisFach) + ' (' + nPuestos + ' puestos, ' + nToldos + ' toldos, ' + nRopa + ' tendederos, ' + nMacetas + ' macetas)');
if (trisFach > 15000) fallos.push('las fachadas piden ' + mil(trisFach) + ' triángulos y el presupuesto de CN15a es 15 mil');
// Trajín (CN15b, js/gfx/trajin.js): cuadrilla de obra y recuas. Peor caso: obreros reales + 15 figuras ligeras, montones y mulas (170 tris cada una con carga).
const tsrc = await readFile(join(RAIZ, 'js', 'gfx', 'trajin.js'), 'utf8'), tcte = n => +(tsrc.match(new RegExp(n + ' = (\\d+)')) || [0, 0])[1], tint = n => new RegExp('export const ' + n + ' = true').test(tsrc);
const nObr = tcte('N_OBREROS_MAX'), nRec = tcte('N_RECUAS'), nMul = tcte('MULAS_POR_RECUA');
const trisTraj = (tint('TRAJIN_CUADRILLAS') ? nObr * tri('ciudadana') + 144 : 0) + (tint('TRAJIN_RECUAS') ? nRec * (nMul * 170 + tri('ciudadana')) : 0);
console.log('Trajín (máximo teórico): ' + mil(trisTraj) + ' (' + nObr + ' obreros, ' + nRec + ' recuas de ' + nMul + ' mulas)');
if (trisTraj > 22000) fallos.push('el trajín pide ' + mil(trisTraj) + ' triángulos y el techo teórico de CN15b es 22 mil (lo real medido va en medidas-ciudad.json)');
const sumaVida = trisCiudad + trisGente + trisCarros + trisGuarn + trisFach + trisTraj;
console.log('  suma teórica si TODO estuviera en pantalla a la vez: ' + mil(sumaVida) + ' triángulos (no es lo que se pinta: la cámara solo ve una parte)');
// Lo que de verdad se pinta se mide con captura-ciudad.mjs y queda en gobierno/medidas-ciudad.json: ahí se vigila el tope.
const MED = JSON.parse(await readFile(join(RAIZ, 'gobierno', 'medidas-ciudad.json'), 'utf8'));
for (const c of ['roma', 'capua']) for (const [v, n] of Object.entries(MED[c] || {})) { if (n > E.triangulosPorCiudad) fallos.push(c + ' en la vista «' + v + '» pinta ' + mil(n) + ' triángulos y el tope es ' + mil(E.triangulosPorCiudad)); }
console.log('Medido en pantalla (' + MED.tarea + '): Roma hasta ' + mil(Math.max(...Object.values(MED.roma))) + ', Capua hasta ' + mil(Math.max(...Object.values(MED.capua))) + ' (tope: ' + mil(E.triangulosPorCiudad) + ')');
if (trisCiudad > E.triangulosPorCiudad) fallos.push('la ciudad típica pide ' + mil(trisCiudad) + ' triángulos y el tope es ' + mil(E.triangulosPorCiudad));

console.log(fallos.length ? 'ARTE: NO APTO\n  ✘ ' + fallos.join('\n  ✘ ') : 'ARTE: APTO' + (P.provisional ? ' (presupuesto provisional, pendiente de que el usuario lo apruebe)' : ''));
process.exit(fallos.length ? 1 : 0);
