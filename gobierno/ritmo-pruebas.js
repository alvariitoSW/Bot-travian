/* AQVILA — J20a: ritmo de las pruebas en navegador. Solo lo cargan los jueces (gobierno/jueces.mjs y gobierno/juez-guerra.mjs, con
   addInitScript); el juego no lo lleva. Con el dibujo por software (sin tarjeta gráfica) cada fotograma tarda ~0,5 s y ocupa los
   4 núcleos: el juego dibuja uno tras otro y cada consulta del juez espera ~0,6 s su turno. Aquí los fotogramas se espacian a uno
   por segundo como mucho (window.__ritmoMs lo cambia); entre uno y otro la página queda libre y responde en milisegundos.
   Medido el 25/11: consulta 600 → 1-6 ms; carga 3,8 → 2,4. Lo que se comprueba no cambia: las pruebas ya contaban con ~1 fotograma/s
   y avanzan la batalla con cuadro()/salta(). Para quitarlo: RITMO_MS=0 node gobierno/jueces.mjs */
(() => {
  const MIN = +(window.__ritmoMs || 1000), raf = window.requestAnimationFrame.bind(window), caf = window.cancelAnimationFrame.bind(window);
  let marco = -1e9, id = 0; const vivos = new Map();
  /* todos los avisos de un mismo fotograma corren juntos; si el fotograma llega antes de tiempo, se espera y se vuelve a pedir */
  const pide = (k, cb) => { vivos.set(k, { r: raf(t => { if (!vivos.has(k)) return;
    if (t === marco || t - marco >= MIN) { marco = t; vivos.delete(k); cb(t); }
    else { const e = vivos.get(k); e.r = null; e.s = setTimeout(() => { if (vivos.has(k)) pide(k, cb); }, MIN - (t - marco)); } }) }); };
  window.requestAnimationFrame = cb => { const k = ++id; pide(k, cb); return k; };
  window.cancelAnimationFrame = k => { const e = vivos.get(k); if (!e) return; vivos.delete(k); if (e.r) caf(e.r); if (e.s) clearTimeout(e.s); };
})();
