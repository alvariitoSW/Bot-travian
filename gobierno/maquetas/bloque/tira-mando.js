/* ES2 · La tira de mando (ES1 §2): fichas «Todos · Falange · Man. I · Man. II» (y las que añada ES3, p. ej. «Honderos») encima de los cuatro botones.
   Cada ficha mide 52 px de alto, con su barra de vida (verde/ámbar/roja) y borde dorado si está elegida. Tocar una ficha, o el estandarte de un cuerpo,
   lo elige. Además: el botón ⏸ de arriba (pausa con órdenes) y los cuatro botones, que pasan a ser las órdenes del cuerpo elegido.
   Su propio DOM y CSS. En horizontal (844×390) la tira va en columna a la izquierda y las órdenes quedan en columna a la derecha (index.html).
   crearTira({ mando, hud, $, dedos }) → { tick(dt), quita() }
     mando  js/mando-varios.js · hud  crearHud (usa hud.ordenes) · $ getElementById · dedos  para borrar la raya cuando ya no hace falta */
const CSS = `
#tira{position:absolute;left:calc(env(safe-area-inset-left) + 8px);right:calc(env(safe-area-inset-right) + 8px);bottom:calc(var(--abajoH,150px) + 6px);display:flex;gap:5px;pointer-events:none}
.ficha{pointer-events:auto;flex:1 1 0;min-width:0;height:52px;padding:5px 4px 5px;border-radius:10px;background:var(--vidrio);border:2px solid var(--fil);display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;text-align:center;overflow:clip;box-shadow:0 3px 8px rgba(0,0,0,.4)}
.ficha b{font:700 12.5px/1.1 system-ui,sans-serif;white-space:nowrap;overflow:clip;color:var(--marmol);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;flex:1}.ficha b svg{width:24px;height:24px;flex:none}.ficha b em{font-style:normal;font-size:10px;line-height:1;margin-top:-1px}
.ficha small{font-size:10.5px;color:#cfc6b0;line-height:1}
.ficha i{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:clip}
.ficha i s{display:block;height:100%;width:100%;background:var(--verde);text-decoration:none;transition:width .3s}
.ficha.ambar i s{background:var(--ambar)}.ficha.rojo i s{background:var(--rojo)}
.ficha.on{border-color:var(--oro);box-shadow:0 0 0 1px var(--oro),0 3px 8px rgba(0,0,0,.4)}
.ficha.on b{color:var(--oro)}
.ficha.caida{opacity:.5}
#pausaB{width:44px;padding:0;justify-content:center;font-size:18px}
#pausaB[aria-pressed="true"]{border-color:var(--oro);color:var(--oro);background:rgba(60,44,16,.92)}
#pausa-t{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 64px);transform:translateX(-50%);padding:4px 12px;border-radius:12px;background:rgba(18,15,11,.88);border:1px solid var(--oro);font:700 12px Cinzel,Georgia,serif;color:var(--oro);white-space:nowrap;pointer-events:none}
@media (orientation:landscape){
  #tira{right:auto;width:104px;bottom:auto;top:calc(env(safe-area-inset-top) + 58px);flex-direction:column;gap:4px}
  .ficha{flex:none;width:100%}
}`;

export function crearTira({ mando: M, hud, $, dedos }) {
  const estilo = document.createElement('style'); estilo.id = 'tira-css'; estilo.textContent = CSS; document.head.appendChild(estilo);
  const cont = document.createElement('div'); cont.id = 'tira'; $('hud').appendChild(cont);
  const pausaB = document.createElement('button'); pausaB.id = 'pausaB'; pausaB.className = 'pildora'; pausaB.textContent = '⏸'; pausaB.setAttribute('aria-label', 'Pausa con órdenes'); pausaB.setAttribute('aria-pressed', 'false');
  $('arriba').insertBefore(pausaB, $('datosB')); pausaB.addEventListener('pointerdown', e => e.stopPropagation());
  const rotulo = document.createElement('div'); rotulo.id = 'pausa-t'; rotulo.hidden = true; $('hud').appendChild(rotulo);
  const fichas = new Map();
  const ids = () => ['todos', ...M.cuerpos.map(c => c.id)];
  const nombreDe = id => id === 'todos' ? 'Todos' : M.cuerpos.find(c => c.id === id).corto;
  /* figuras por arma (SVG en línea, del color del texto): Todos = tres estandartes; falange = sarisa; manípulo = scutum y gladius; honda, arco, jabalina */
  const SV = d => '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const ICONOS = {
    todos: SV('<path d="M5 21V4M12 21V3M19 21V4"/><path d="M5 4h4v5H5zM12 3h4v5h-4zM19 4h-4v5h4z" fill="currentColor" fill-opacity=".45"/>'),
    falange: SV('<path d="M3 21 20 4"/><path d="M20 4l-4.5 1 3.5 3.5z" fill="currentColor"/><path d="M6 21 22 6" opacity=".55"/>'),
    manipulo: SV('<rect x="4" y="3" width="11" height="18" rx="2" fill="currentColor" fill-opacity=".3"/><path d="M9.5 6v12M6 12h7"/><path d="M20 9v8M18.2 17h3.6M20 9l-1-2 2 0z"/>'),
    honderos: SV('<path d="M5 17c0-5 4-9 9-9"/><path d="M14 8c3 0 5 2 5 5s-3 4-4 2"/><circle cx="18.5" cy="6" r="2" fill="currentColor"/><path d="M5 17l-2 3M5 17l3 2"/>'),
    arqueros: SV('<path d="M7 3c8 4 8 14 0 18"/><path d="M7 3v18"/><path d="M7 12h14M18 9l3 3-3 3"/>'),
    velites: SV('<path d="M4 20 19 5"/><path d="M19 5l-5 .5 4.5 4.5z" fill="currentColor"/><path d="M6 14l4 4"/>')
  };
  const iconoDe = id => { if (id === 'todos') return ICONOS.todos; const c = M.cuerpos.find(q => q.id === id), k = c.corto || ''; return /^Hond/.test(k) ? ICONOS.honderos : /^Arq/.test(k) ? ICONOS.arqueros : /^V[ée]l/.test(k) ? ICONOS.velites : (ICONOS[c.tipo] || ICONOS.manipulo); };
  const numeroDe = id => { const c = id === 'todos' ? null : M.cuerpos.find(q => q.id === id), m = c && c.tipo === 'manipulo' && /\b(I{1,3})$/.exec(c.corto || ''); return m ? m[1] : ''; };
  function haz() {
    cont.textContent = ''; fichas.clear();
    for (const id of ids()) {
      const el = document.createElement('button'); el.className = 'ficha'; el.dataset.id = id; el.setAttribute('aria-label', 'Elegir: ' + (id === 'todos' ? 'Todos' : M.cuerpos.find(q => q.id === id).nombre)); el.title = el.getAttribute('aria-label').slice(8);
      el.innerHTML = `<b>${iconoDe(id)}${numeroDe(id) ? '<em>' + numeroDe(id) + '</em>' : ''}</b><i><s></s></i><small></small>`; cont.appendChild(el);
      el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('click', e => { e.stopPropagation(); M.elige(id); });
      fichas.set(id, { el, s: el.querySelector('s'), t: el.querySelector('small'), w: -1, n: -1, clase: '' });
    }
  }
  haz();
  /* los cuatro botones: las órdenes del elegido */
  let puestas = '';
  function ordenes() {
    const l = M.ordenesDe(M.elegido), k = l.join(); if (k === puestas) return; puestas = k;
    hud.ordenes(l, { retirada: false, tuyo: 'Falange' });
  }
  /* tocar el estandarte de un cuerpo lo elige */
  const ESTS = { 0: 'falange', 1: 'man1', 2: 'man2' };
  function estandartes() {
    [...document.querySelectorAll('#ests .est.r')].forEach((el, i) => {
      const id = ESTS[i]; if (!id || el.dataset.mando) return; el.dataset.mando = '1'; if (i) el.querySelector('b').dataset.n = nombreDe(id);
      el.style.pointerEvents = 'auto'; el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('click', e => { e.stopPropagation(); M.elige(id); });
    });
  }
  if (!document.getElementById('tira-css2')) { const e2 = document.createElement('style'); e2.id = 'tira-css2'; e2.textContent = '.est b[data-n]::before{content:attr(data-n) " · "}'; document.head.appendChild(e2); }
  estandartes();
  pausaB.addEventListener('click', e => { e.stopPropagation(); M.pon(!M.pausa); });
  M.escucha(() => { puestas = ''; ordenes(); pinta(); });
  function pinta() {
    for (const [id, f] of fichas) f.el.classList.toggle('on', id === M.elegido);
    pausaB.setAttribute('aria-pressed', String(M.pausa)); rotulo.hidden = !M.pausa;
    rotulo.textContent = M.cola.length ? 'En pausa · ' + M.cola.length + (M.cola.length === 1 ? ' orden dada' : ' órdenes dadas') : 'En pausa · da órdenes y reanuda';
  }
  const abajoH = () => { const h = $('abajo').offsetHeight; document.documentElement.style.setProperty('--abajoH', (h + (parseFloat(getComputedStyle($('abajo')).bottom) || 8)) + 'px'); };
  ordenes(); pinta(); abajoH();
  let tT = 0;
  function tick(dt) {
    estandartes(); abajoH();
    for (const [id, f] of fichas) {
      const v = M.vida(id), w = Math.round(v.f * 100);
      if (w !== f.w) { f.w = w; f.s.style.width = w + '%'; const c = v.f > 0.6 ? '' : v.f > 0.3 ? 'ambar' : 'rojo'; if (c !== f.clase) { f.el.classList.remove('ambar', 'rojo'); if (c) f.el.classList.add(c); f.clase = c; } f.el.classList.toggle('caida', v.n <= 0); }
      if (v.n !== f.n) { f.n = v.n; f.t.textContent = v.n; }
    }
    /* los botones del elegido: la orden vigente, la que conviene y las que no se pueden */
    const id = M.elegido, c = M.cuerpos.find(q => q.id === id), u = M.util(id), S = M.cuerpos[0].b;
    for (const el of document.querySelectorAll('.orden')) {
      const o = el.dataset.o; let vig = false, apaga = false;
      if (c && c.b && !c.alOrden) {
        const b = c.b; vig = o === 'relevo' ? b.tRelevo > (hud.tiempo ? hud.tiempo() : 0) : (c.tipo === 'falange' && o === 'picas') ? b.orden === 'cargar' : b.orden === o;
        apaga = !!(b.U.roto || b.estado === 'fuera' || (o === 'relevo' && b.relevos <= 0));
      }
      el.classList.toggle('vigente', vig); el.classList.toggle('luz', !!u && o === u && !vig); el.classList.toggle('apagada', apaga);
    }
    if (c && c.b && c.tipo === 'manipulo') { const r = $('relevos'); if (r) r.textContent = c.b.relevos; }
    /* la raya dorada sobra cuando nadie va hacia ella */
    tT -= dt; if (tT <= 0) { tT = 0.5; if (!M.pausa && dedos && !dedos.activo() && dedos.raya.visible && !M.cuerpos.some(q => q.b && q.b.obj)) dedos.oculta(); }
    void S;
  }
  function quita() { cont.remove(); estilo.remove(); pausaB.remove(); rotulo.remove(); }
  return { tick, quita, fichas };
}
