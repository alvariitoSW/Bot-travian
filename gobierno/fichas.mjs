#!/usr/bin/env node
/* AQVILA — juez de fichas: comprueba que cada pieza de js/data.js tiene su ficha en js/registro.js.
   Uso:  node gobierno/fichas.mjs   (sale con código 1 si algo falla)
   Casa por id: si data.js añade o quita una pieza, dice cuál falta o sobra. Los números siguen en data.js. */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);
const D = req(join(RAIZ, 'js', 'data.js')), R = req(join(RAIZ, 'js', 'registro.js'));
const DICT = ['historico', 'probable', 'licencia de juego', 'por cotejar'];
const fallos = [], cuenta = { cotejar: 0, licencia: 0, historico: 0, probable: 0, provisional: 0, localizar: 0, sinModelo: 0 };
const esNum = v => typeof v === 'number' && Number.isFinite(v);
const esTxt = v => typeof v === 'string' && v.length > 0;

// Piezas de data.js por tipo: { clave de casado: pieza }. Los hechos van en lista y se casan por año.
function piezas(tipo) {
  const t = R.tipos[tipo], tabla = D[t.tabla];
  if (!tabla) { fallos.push(tipo + ': data.js ya no tiene D.' + t.tabla); return {}; }
  if (!t.lista) return tabla;
  const o = {};
  tabla.forEach(e => { if (o[e.y]) fallos.push('hecho: dos hechos del mismo año ' + e.y + ' en data.js; el registro casa por año'); o[e.y] = e; });
  return o;
}
const etiqueta = (tipo, k, p) => tipo === 'hecho' ? 'hecho del año ' + k + (p && p.t ? ' («' + p.t + '»)' : '') : tipo + ' «' + k + '»';

for (const tipo of Object.keys(R.tipos)) {
  const t = R.tipos[tipo], P = piezas(tipo), fichas = R.fichas[tipo] || {}, antes = fallos.length;
  const porClave = {};   // clave de casado → id de ficha
  for (const id of Object.keys(fichas)) porClave[tipo === 'hecho' ? id.split('-')[0] : id] = id;

  for (const k of Object.keys(P)) {
    const p = P[k];
    if (!porClave[k]) fallos.push('falta la ficha de ' + etiqueta(tipo, k, p) + ' (añádela en js/registro.js, tipo ' + tipo + ')');
    // campos obligatorios de data.js
    const falta = [];
    for (const c of t.numericos || []) if (!esNum(p[c])) falta.push(c);
    for (const c of t.textos || []) if (!esTxt(p[c])) falta.push(c);
    for (const c of t.mapas || []) if (!p[c] || typeof p[c] !== 'object' || !Object.keys(p[c]).length || !Object.values(p[c]).every(esNum)) falta.push(c);
    for (const c of (t.segunClase && t.segunClase[p.cls]) || []) if (!esNum(p[c])) falta.push(c);
    if (falta.length) fallos.push(etiqueta(tipo, k, p) + ': en data.js falta o no es válido ' + falta.join(', '));
  }
  for (const k of Object.keys(porClave)) if (!(k in P)) fallos.push('la ficha «' + porClave[k] + '» (' + tipo + ') no tiene pieza en data.js (¿se quitó o cambió de id?)');

  for (const id of Object.keys(fichas)) {
    const fi = fichas[id], n = tipo + ' «' + id + '»;', a = fi.arte, hi = fi.historia;
    if (!a || typeof a !== 'object') fallos.push(n + ' falta arte');
    else if (a.sin !== undefined) {
      if (!esTxt(a.sin)) fallos.push(n + ' arte.sin debe explicar el motivo');
      if (a.sin === 'por localizar') cuenta.localizar++; else if (a.provisional) cuenta.provisional++; else cuenta.sinModelo++;
    } else {
      for (const c of ['modelo', 'licencia', 'credito']) if (!esTxt(a[c])) fallos.push(n + ' arte.' + c + ' vacío');
      if (esTxt(a.modelo) && !existsSync(join(RAIZ, a.modelo))) fallos.push(n + ' el archivo de arte.modelo no existe: ' + a.modelo);
      if (a.provisional) cuenta.provisional++;
    }
    if (hi && hi.texto !== undefined) {   // texto del Códice (P55): vive aquí y solo aquí
      if (!esTxt(hi.texto) || hi.texto.length < 40 || hi.texto.length > 420) fallos.push(n + ' historia.texto debe tener entre 40 y 420 letras');
      if (!esTxt(hi.fuente)) fallos.push(n + ' historia.texto sin historia.fuente');
      if (hi.dictamen === 'por cotejar') fallos.push(n + ' tiene texto en el Códice pero sigue «por cotejar»');
    }
    if (!hi || typeof hi !== 'object') fallos.push(n + ' falta historia');
    else {
      if (typeof hi.fuente !== 'string') fallos.push(n + ' historia.fuente debe ser texto (puede ir vacío)');
      if (!DICT.includes(hi.dictamen)) fallos.push(n + ' historia.dictamen «' + hi.dictamen + '» no es ninguno de: ' + DICT.join(', '));
      else if (hi.dictamen === 'por cotejar') cuenta.cotejar++; else if (hi.dictamen === 'historico') cuenta.historico++; else if (hi.dictamen === 'probable') cuenta.probable++; else cuenta.licencia++;
    }
  }
  const nf = Object.keys(fichas).length, np = Object.keys(P).length;
  console.log((fallos.length === antes ? '  ✔ ' : '  ✘ ') + tipo.padEnd(9) + nf + ' fichas · ' + np + ' piezas en data.js');
}

console.log('Resumen: ' + cuenta.cotejar + ' por cotejar · ' + cuenta.licencia + ' licencia de juego · ' + cuenta.historico + ' históricas · ' + cuenta.probable + ' probables · '
  + cuenta.provisional + ' con arte provisional · ' + cuenta.localizar + ' por localizar · ' + cuenta.sinModelo + ' sin modelo (ciudades, hechos, facciones, mejoras)');
console.log(fallos.length ? 'FICHAS: NO APTO\n  ✘ ' + fallos.join('\n  ✘ ') : 'FICHAS: APTO');
process.exit(fallos.length ? 1 : 0);
