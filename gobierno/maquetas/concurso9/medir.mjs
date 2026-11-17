// K7: captura 390×844 de cada maqueta y mide botones <44 px, texto <11 px, colores fuera de paleta, errores.
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const aqui = path.dirname(fileURLToPath(import.meta.url)); const out = path.resolve(aqui, '../../capturas-tarea');
fs.mkdirSync(out, { recursive: true });
const PAL = ['#0b1016','#c0281f','#e9c063','#b8862b','#f1ead9','#9aa6b4','#8fae5a','#d9764a'].map(h => [1,3,5].map(i => parseInt(h.substr(i,2),16)));
const cerca = (c) => PAL.some(p => Math.hypot(p[0]-c[0],p[1]-c[1],p[2]-c[2]) < 70) || (Math.max(...c) < 60); // fondos oscuros de la familia Noche
const b = await chromium.launch(); const res = {};
for (const L of 'ABCDE') {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type()==='error' && err.push(m.text()));
  await p.goto('file://' + path.join(aqui, L, 'index.html')); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, `K7-${L}-1.png`) });
  const m = await p.evaluate(() => {
    const r = { peq: 0, tot: 0, texto: 0, fuera: new Set(), pequeños: [] };
    for (const e of document.querySelectorAll('button,a,[onclick],[role=button],.btn,input,select')) {
      const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue; r.tot++;
      if (q.width < 44 || q.height < 44) { r.peq++; if (r.pequeños.length < 5) r.pequeños.push((e.textContent||e.className||e.tagName).trim().slice(0,18)+' '+Math.round(q.width)+'x'+Math.round(q.height)); }
    }
    for (const e of document.querySelectorAll('body *')) {
      if (![...e.childNodes].some(n => n.nodeType===3 && n.textContent.trim())) continue;
      const q = e.getBoundingClientRect(); if (q.width<1) continue;
      if (parseFloat(getComputedStyle(e).fontSize) < 11) r.texto++;
      r.fuera.add(getComputedStyle(e).color); 
    }
    r.fuera = [...r.fuera]; return r;
  });
  m.fuera = m.fuera.map(s => s.match(/\d+/g).slice(0,3).map(Number)).filter(c => !cerca(c)).map(c => 'rgb('+c+')');
  m.err = err; res[L] = m; await ctx.close();
}
await b.close(); console.log(JSON.stringify(res, null, 1));
