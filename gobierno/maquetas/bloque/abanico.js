/* FU5 · El abanico del estandarte (decisión del usuario «3a»): la forma del manípulo (cerrada · muro · abierto) se elige en un abanico
   de tres botones redondos que sale al tocar tu estandarte (.est.tuyo, dentro de #ests); abajo siguen los cuatro botones de siempre.
   Cada botón: ≥ 56 px, con su dibujo y su palabra. La forma vigente lleva el borde claro; la que conviene ahora (C.formaUtil()) late en oro.
   Cuando conviene una forma y el abanico está cerrado, el aro del estandarte late para que se descubra. Se cierra al tocar fuera,
   al elegir o a los 4 s. Sigue al estandarte y no se sale de la pantalla (a 390 px tampoco). Sin C.forma (la falange): no hace nada.
   Contrato: crearAbanico({ $, padre, Son }) → { pon(C), paso(dt), abre(), cierra(), abierto() } */
const FORMAS = [
  { f: 'cerrada', t: 'Cerrada', svg: '<rect x="3" y="10" width="5" height="13"/><rect x="9" y="10" width="5" height="13"/><rect x="15" y="10" width="5" height="13"/><rect x="21" y="10" width="5" height="13"/><path d="M3 27h23"/>' },
  { f: 'muro', t: 'Muro', svg: '<rect x="3" y="7" width="12" height="17" rx="2"/><rect x="11" y="7" width="12" height="17" rx="2"/><rect x="19" y="7" width="10" height="17" rx="2"/><path d="M9 15.5h3M17 15.5h3" /><path d="M3 28h26"/>' },
  { f: 'abierto', t: 'Abierto', svg: '<rect x="2" y="12" width="5" height="10"/><rect x="13.5" y="12" width="5" height="10"/><rect x="25" y="12" width="5" height="10"/><path d="M8.5 9l-3 -3M17 8V4M24 9l3 -3"/>' },
];
const R = 76, MITAD = 28, TIEMPO = 4;   /* radio del arco, medio botón (px) y segundos que aguanta abierto */
const ESTILO = `
#abanico{position:absolute;inset:0;pointer-events:none;overflow:clip;z-index:6}
#abanico .ab{position:absolute;left:0;top:0;width:${MITAD * 2}px;height:${MITAD * 2}px;margin:-${MITAD}px 0 0 -${MITAD}px;border-radius:50%;pointer-events:auto;cursor:pointer;
  background:radial-gradient(#3a2c14,#1f170b);border:2.5px solid var(--bronce,#8a6a2b);color:var(--marmol,#f1ead9);box-shadow:0 3px 10px rgba(0,0,0,.6);
  display:flex;align-items:center;justify-content:center;padding:0;opacity:0;transform:scale(.3);transition:opacity .16s,transform .16s;touch-action:manipulation}
#abanico.ve .ab{opacity:1;transform:scale(1)}
#abanico .ab svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
#abanico .ab b{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;font:700 12px Cinzel,Georgia,serif;color:#fff3dc;text-shadow:0 1px 3px #000,0 0 6px #000;white-space:nowrap;pointer-events:none}
#abanico .ab.vigente{background:radial-gradient(#9a3024,#5c1b15);border-color:#f1ead9}
#abanico .ab.luz{border-color:var(--oro,#e9c063);animation:abLuz .9s infinite}
#abanico:not(.ve) .ab{pointer-events:none}
@keyframes abLuz{0%,100%{box-shadow:0 3px 10px rgba(0,0,0,.6),0 0 0 0 rgba(233,192,99,.0)}50%{box-shadow:0 3px 10px rgba(0,0,0,.6),0 0 0 6px rgba(233,192,99,.7)}}
.est.tuyo{pointer-events:auto;cursor:pointer}
.est.tuyo::before{content:'';position:absolute;inset:-8px -14px -2px}
.est.tuyo.late-forma i{animation:abLate 1s infinite;border-color:var(--oro,#e9c063)}
@keyframes abLate{0%,100%{box-shadow:0 1px 4px rgba(0,0,0,.7),0 0 0 0 rgba(233,192,99,.0)}50%{box-shadow:0 1px 4px rgba(0,0,0,.7),0 0 0 7px rgba(233,192,99,.75)}}
@media (prefers-reduced-motion:reduce){#abanico .ab.luz{animation:none;box-shadow:0 0 0 4px rgba(233,192,99,.8)}.est.tuyo.late-forma i{animation:none;box-shadow:0 0 0 5px rgba(233,192,99,.8)}}`;

export function crearAbanico({ $, padre, Son }) {
  const st = document.createElement('style'); st.textContent = ESTILO; document.head.appendChild(st);
  const raiz = document.createElement('div'); raiz.id = 'abanico'; padre.appendChild(raiz);
  const NS = 'http://www.w3.org/2000/svg';
  const bot = FORMAS.map(d => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'ab'; el.dataset.f = d.f; el.setAttribute('aria-label', d.t);
    el.innerHTML = `<svg viewBox="0 0 32 32" xmlns="${NS}" aria-hidden="true">${d.svg}</svg><b>${d.t}</b>`; raiz.appendChild(el);
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => { e.stopPropagation(); if (!C || !C.forma) return; Son && Son.toque && Son.toque(); C.forma(d.f); cierra(); });
    return el;
  });
  let C = null, ve = false, t = 0;
  const ests = () => $('ests'), mio = () => { const e = ests(); return e && e.querySelector('.est.tuyo'); };
  function abre() { if (!C || !C.forma) return; ve = true; t = TIEMPO; raiz.classList.add('ve'); coloca(); }
  function cierra() { ve = false; raiz.classList.remove('ve'); }
  /* los tres botones en arco encima del estandarte (debajo si no cabe arriba), dentro de la pantalla */
  function coloca() {
    const e = mio(), i = e && e.querySelector('i'); if (!i) return cierra();
    const r = i.getBoundingClientRect(), pr = padre.getBoundingClientRect(), W = pr.width, Hh = pr.height;
    if (e.style.display === 'none' || !r.width) return cierra();
    const cx = r.left + r.width / 2 - pr.left, cy = r.top + r.height / 2 - pr.top, arriba = cy - R - MITAD - 56 > 0, s = arriba ? -1 : 1;
    [-50, 0, 50].forEach((g, k) => {
      const a = g * Math.PI / 180;
      let x = cx + Math.sin(a) * R, y = cy + s * Math.cos(a) * R + (g ? 0 : 0);
      x = Math.max(MITAD + 6, Math.min(W - MITAD - 6, x)); y = Math.max(MITAD + 56, Math.min(Hh - MITAD - 24, y));
      bot[k].style.transform = ''; bot[k].style.left = x.toFixed(1) + 'px'; bot[k].style.top = y.toFixed(1) + 'px';
    });
  }
  /* tocar el estandarte (delegación: #ests se rehace en cada partida) */
  const dentro = n => !!(n && n.closest && (n.closest('#abanico') || n.closest('.est.tuyo')));
  padre.addEventListener('pointerdown', e => {
    const est = e.target.closest && e.target.closest('.est.tuyo');
    if (!est || !ests() || !ests().contains(est)) return;
    e.stopPropagation(); if (ve) cierra(); else abre();
  });
  document.addEventListener('pointerdown', e => { if (ve && !dentro(e.target)) cierra(); }, true);
  return {
    pon(c) { C = c && c.forma ? c : null; cierra(); },
    paso(dt) {
      const e = mio(); if (!C || !e) { if (ve) cierra(); return; }
      const S = C.S, util = C.formaUtil ? C.formaUtil() : null, ahora = S.tuyo.forma;
      if (ve && (S.ganador || S.tuyo.U.roto)) cierra();
      if (ve) { t -= dt; if (t <= 0) cierra(); else coloca(); }
      for (const b of bot) { b.classList.toggle('vigente', b.dataset.f === ahora); b.classList.toggle('luz', b.dataset.f === util && b.dataset.f !== ahora); }
      const l = !ve && util !== null && !S.ganador; if (l !== e.classList.contains('late-forma')) e.classList.toggle('late-forma', l);
    },
    abre, cierra, abierto: () => ve
  };
}
