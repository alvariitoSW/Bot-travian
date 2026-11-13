// K10 · medidas de P1: tamaño, colores fuera de paleta, texto < 11 px. Uso: node medir-p1.js <estandarte.svg.js>
const f = require(require('path').resolve(process.argv[2]));
const PAL = new Set(['#0b1016','#c0281f','#e9c063','#b8862b','#f1ead9','#9aa6b4','#8fae5a','#d9764a','#5b3a8c','#2a6fa8','#3f8a4a','#b9873a','#000000','#ffffff','#000','#fff']);
const norm = h => { h = h.toLowerCase(); return h.length === 4 ? '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3] : h; };
const T = ['hastati','principes','triarios','velites','equites','general','elefantes','falange'];
const fuera = {}; let n = 0, mal = 0, txt = 0, bytes = 0, texto = 0;
for (const b of [0,1]) for (const t of T) for (const a of ['F','V','D','H']) for (const c of [0,1,2,3]) for (const v of [0,1,2]) for (const s of [false,true]) {
  const o = f({ bando: b, tipo: t, animo: a, cansancio: c, vet: v, sel: s }); n++; bytes += o.length;
  if (!/viewBox="0 0 36 60"/.test(o) || !/width="36"/.test(o) || !/height="60"/.test(o)) mal++;
  for (const m of o.matchAll(/#[0-9a-fA-F]{3,6}\b/g)) { const h = norm(m[0]); if (!PAL.has(h)) fuera[h] = (fuera[h] || 0) + 1; }
  if (/<text/.test(o)) { texto++; for (const m of o.matchAll(/font-size="?([\d.]+)/g)) if (+m[1] < 11) txt++; }
}
const ks = Object.keys(fuera);
console.log(JSON.stringify({ combos: n, medidaMal: mal, bytesMedio: Math.round(bytes / n), coloresFuera: ks.length, ejemplos: ks.slice(0, 8), conTexto: texto, textoMenor11: txt }));
