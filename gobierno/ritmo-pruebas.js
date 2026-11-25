/* AQVILA — J20a: ritmo de las pruebas en navegador. Solo lo cargan los jueces (gobierno/jueces.mjs y gobierno/juez-guerra.mjs, con
   addInitScript); el juego no lo lleva. Con el dibujo por software (sin tarjeta gráfica) cada fotograma tarda ~0,5 s y ocupa los
   4 núcleos: el juego dibuja uno tras otro y cada consulta del juez espera ~0,6 s su turno. Aquí los fotogramas se espacian a uno
   cada 2 s como mucho (los jueces ponen window.__ritmoMs = RITMO_MS, 2000 de serie); entre uno y otro la página queda libre y responde en milisegundos.
   Medido el 25/11 (a 1 s): consulta 600 → 1-6 ms; carga 3,8 → 2,4. Subida: 45 min → 14-17 min (1 s) → 7,6-7,8 min (2 s).
   Lo que se comprueba no cambia: las pruebas avanzan la batalla con cuadro()/salta() y esperan a lo que miden, no a plazos fijos. Para quitarlo: RITMO_MS=0 node gobierno/jueces.mjs */
(() => {
  const MIN = +(window.__ritmoMs || 2000), raf = window.requestAnimationFrame.bind(window), caf = window.cancelAnimationFrame.bind(window);
  let marco = -1e9, id = 0; const vivos = new Map();
  /* todos los avisos de un mismo fotograma corren juntos; si el fotograma llega antes de tiempo, se espera y se vuelve a pedir */
  const pide = (k, cb) => { vivos.set(k, { r: raf(t => { if (!vivos.has(k)) return;
    if (t === marco || t - marco >= MIN) { marco = t; vivos.delete(k); cb(t); }
    else { const e = vivos.get(k); e.r = null; e.s = setTimeout(() => { if (vivos.has(k)) pide(k, cb); }, MIN - (t - marco)); } }) }); };
  window.requestAnimationFrame = cb => { const k = ++id; pide(k, cb); return k; };
  window.cancelAnimationFrame = k => { const e = vivos.get(k); if (!e) return; vivos.delete(k); if (e.r) caf(e.r); if (e.s) clearTimeout(e.s); };
})();
