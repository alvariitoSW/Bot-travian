// K6: captura 844×390 de cada maqueta (inicio y tras tocar) y mide botones <44 px, texto <11 px, errores.
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const aqui = path.dirname(fileURLToPath(import.meta.url)); const out = path.resolve(aqui, '../../../capturas-tarea');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const res = {};
for (const L of 'ABCDE') {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type()==='error' && err.push(m.text()));
  await p.goto('file://' + path.join(aqui, L, 'index.html')); await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(out, `K6-${L}-1.jpg`), type: 'jpeg', quality: 80 });
  const m = await p.evaluate(() => {
    const r = { peq: 0, tot: 0, texto: 0, pequeños: [], scrollX: document.documentElement.scrollWidth > innerWidth };
    for (const e of document.querySelectorAll('button,a,[onclick],[role=button],.btn,input,select')) {
      const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue; r.tot++;
      if (q.width < 44 || q.height < 44) { r.peq++; if (r.pequeños.length < 4) r.pequeños.push((e.textContent||e.className||e.tagName).trim().slice(0,14)+' '+Math.round(q.width)+'x'+Math.round(q.height)); }
    }
    for (const e of document.querySelectorAll('body *')) {
      if (![...e.childNodes].some(n => n.nodeType===3 && n.textContent.trim())) continue;
      if (e.getBoundingClientRect().width<1) continue;
      if (parseFloat(getComputedStyle(e).fontSize) < 11) r.texto++;
    }
    return r;
  });
  // interacción: tocar el centro-izquierda (un regimiento aliado), esperar y volver a capturar
  await p.mouse.click(250, 190); await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(out, `K6-${L}-2.jpg`), type: 'jpeg', quality: 80 });
  m.err = err; res[L] = m; await ctx.close();
}
await b.close(); console.log(JSON.stringify(res, null, 1));
