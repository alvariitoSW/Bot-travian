/* FU2 · El HUD del duelo del oficial: solo en la vista del oficial. Crea sus elementos y su <style> (como camara.js con #vista).
   Abajo, encima de las órdenes: tres marcas de heridas, la barra de aliento y una línea de ayuda según el modo.
   En el centro-alto, el eco del duelo (¡Parado!, Herido 1 de 3…) 1,2 s: verde si va bien, rojo si va mal.
   Sobre el rival (proyectado), un aro: rojo que se cierra mientras arma; dorado si está abierto o desequilibrado.
   Mientras cargas el pilum, un arco de carga junto al dedo. Nada roba toques al lienzo (pointer-events: none).
   Contrato: crearDueloHud({ padre }) → { pinta({ ve, est, aro: [px, py, visible] | null, dedo: { x, y } | null, modo, dt }) }
     est: OF.estado() de oficial.js · modo: 'nada' | 'pilum' | 'duelo' (el de dedos.js) */
const NS = 'http://www.w3.org/2000/svg', ECO_S = 1.2, R = 17, CIRC = 2 * Math.PI * R;

export function crearDueloHud({ padre }) {
  const st = document.createElement('style');
  st.textContent = `#duelo,#duelo *{pointer-events:none}
#duelo-abajo{position:absolute;left:calc(env(safe-area-inset-left) + 8px);right:calc(env(safe-area-inset-right) + 8px);bottom:calc(env(safe-area-inset-bottom) + 132px);display:flex;flex-direction:column;align-items:center;gap:3px}
#duelo-fila{display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:10px;background:rgba(18,15,11,.62);font:600 12px system-ui,sans-serif;color:#fff3dc;white-space:nowrap;overflow:clip}
#duelo-heridas{display:flex;gap:4px}
#duelo-heridas i{width:12px;height:12px;border-radius:50%;border:1.5px solid #d9c9a8;background:transparent}
#duelo-heridas i.h{background:#c0392b;border-color:#ff8a7a}
#duelo-aliento{width:120px;height:8px;border-radius:4px;background:rgba(255,255,255,.15);overflow:clip}
#duelo-aliento b{display:block;height:100%;border-radius:4px;background:#e9c063;transition:width .15s}
#duelo-ayuda{font:600 12px system-ui,sans-serif;color:#fff3dc;text-shadow:0 1px 3px #000,0 0 6px #000;white-space:nowrap;overflow:clip;max-width:100%}
#duelo-eco{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 132px);transform:translateX(-50%);max-width:86%;padding:6px 16px;border-radius:12px;font:700 17px Cinzel,Georgia,serif;letter-spacing:.02em;color:#fff;text-align:center;white-space:nowrap;overflow:clip;opacity:0;transition:opacity .2s;box-shadow:0 3px 12px rgba(0,0,0,.5)}
#duelo-eco.ve{opacity:1}
#duelo-eco.bien{background:rgba(38,120,58,.9)}
#duelo-eco.mal{background:rgba(160,38,30,.92)}
#duelo-eco.nada{background:rgba(18,15,11,.82)}
#duelo svg.marca{position:absolute;left:0;top:0;width:48px;height:48px;margin:-24px 0 0 -24px;overflow:visible}
#duelo svg.marca circle{fill:none;stroke-width:4;stroke-linecap:round}
#hud.duelo-ve #grito{bottom:calc(env(safe-area-inset-bottom) + 196px)}
@media (orientation:landscape){
  #duelo-abajo{left:calc(env(safe-area-inset-left) + 8px);right:auto;width:440px;bottom:calc(env(safe-area-inset-bottom) + 44px);align-items:flex-start}
  #duelo-eco{top:calc(env(safe-area-inset-top) + 66px);font-size:15px}
  #hud.duelo-ve #grito{bottom:calc(env(safe-area-inset-bottom) + 110px)}
}`;
  document.head.appendChild(st);
  const raiz = document.createElement('div'); raiz.id = 'duelo'; raiz.hidden = true;
  raiz.innerHTML = `<div id="duelo-abajo"><div id="duelo-fila"><span>Heridas</span><span id="duelo-heridas"><i></i><i></i><i></i></span><span>Aliento</span><span id="duelo-aliento"><b></b></span></div><div id="duelo-ayuda"></div></div><div id="duelo-eco"></div>`;
  const marca = (color) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'marca'); s.setAttribute('viewBox', '-24 -24 48 48');
    const fondo = document.createElementNS(NS, 'circle'), arco = document.createElementNS(NS, 'circle');
    for (const c of [fondo, arco]) { c.setAttribute('r', R); s.appendChild(c); }
    fondo.style.stroke = 'rgba(0,0,0,.45)'; arco.style.stroke = color; arco.setAttribute('transform', 'rotate(-90)'); arco.style.strokeDasharray = CIRC;
    s.style.display = 'none'; raiz.appendChild(s); return { s, arco }; };
  const aro = marca('#e04030'), carga = marca('#e9c063');
  (padre || document.body).appendChild(raiz);
  const $ = id => raiz.querySelector('#' + id), heridas = [...raiz.querySelectorAll('#duelo-heridas i')], aliento = $('duelo-aliento').firstChild, ayuda = $('duelo-ayuda'), eco = $('duelo-eco');
  let ecoVisto = '', ecoHasta = 0, reloj = 0;   /* reloj: segundos de juego (el dt del bucle), no de la pared */
  const pon = (m, x, y, frac, color) => { m.s.style.display = ''; m.s.style.transform = `translate(${x}px,${y}px)`; m.arco.style.stroke = color; m.arco.style.strokeDashoffset = CIRC * (1 - Math.max(0, Math.min(1, frac))); };

  function pinta({ ve, est, aro: pa, dedo, modo, dt = 0 }) {
    reloj += dt;
    raiz.hidden = !ve || !est; if (padre) padre.classList.toggle('duelo-ve', !raiz.hidden); if (raiz.hidden) return;
    heridas.forEach((h, k) => h.classList.toggle('h', k < est.heridas));
    aliento.style.width = Math.round(est.aliento) + '%'; aliento.style.background = est.aliento < 30 ? '#c0392b' : '#e9c063';
    ayuda.textContent = modo === 'duelo' ? 'Toca: estocada · Mantén: escudo · Desliza arriba: empujón' : modo === 'pilum' ? `Mantén y suelta: pilum (${est.pilum})` : '';
    /* el eco: cada texto nuevo se ve 1,2 s */
    const clave = est.eco.texto + '|' + est.eco.t, ahora = reloj;
    if (est.eco.texto && clave !== ecoVisto) { ecoVisto = clave; ecoHasta = ahora + ECO_S; eco.textContent = est.eco.texto; eco.className = est.eco.tipo || 'nada'; }
    eco.classList.toggle('ve', ahora < ecoHasta);
    /* el aro sobre el rival */
    const rv = est.rival;
    if (rv && pa && pa[2]) {
      const abierto = rv.fase === 'abierto' || rv.fase === 'deseq', armando = rv.fase === 'arma' || rv.fase === 'golpea';
      pon(aro, pa[0], pa[1], abierto ? 1 : armando ? rv.t : 1, abierto ? '#e9c063' : armando ? '#e04030' : 'rgba(255,243,220,.35)');
    } else aro.s.style.display = 'none';
    /* el arco de carga del pilum, junto al dedo */
    if (est.carga != null && dedo) pon(carga, dedo.x + 34, dedo.y - 46, est.carga, est.carga < 0.3 ? '#d9c9a8' : '#e9c063'); else carga.s.style.display = 'none';
  }
  return { pinta };
}

/* FU3b · El gesto de la falange en pantalla (falangita.js), con el mismo estilo que el duelo de arriba.
   Acometida del rival: sobre el frente, «¡Bajad sarisas! ↓» con una barra que se llena (rival.t). Con hueco abierto: un anillo rojo en el
   suelo, donde falta el hombre (con su cuenta atrás hueco.t), y «Arrastra al de atrás al hueco». El eco (¡Ensartado!, ¡Muro cerrado!, Brecha
   en la falange) sale 1,2 s en el centro-alto. Nada roba toques al lienzo (pointer-events: none): los gestos los lee dedos.js.
   Contrato: crearFalangitaHud({ padre }) → { pinta({ ve, est, frente: [px, py, visible], hueco: [px, py, visible] | null, dt }), anillo() → { x, y, r } | null } */
export function crearFalangitaHud({ padre }) {
  const st = document.createElement('style');
  st.textContent = `#fal,#fal *{pointer-events:none}
#fal-aviso{position:absolute;left:0;top:0;width:210px;margin-left:-105px;margin-top:-100px;display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0;transition:opacity .12s}
#fal-aviso.ve{opacity:1}
#fal-aviso b{display:block;padding:5px 14px;border-radius:12px;background:rgba(160,38,30,.94);font:700 17px Cinzel,Georgia,serif;color:#fff;white-space:nowrap;overflow:clip;box-shadow:0 2px 8px rgba(0,0,0,.5)}
#fal-aviso i{display:block;width:170px;height:9px;border-radius:5px;background:rgba(0,0,0,.55);overflow:clip}
#fal-aviso i u{display:block;height:100%;width:0;border-radius:5px;background:#e9c063;text-decoration:none}
#fal-hueco{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 186px);transform:translateX(-50%);max-width:90%;padding:5px 14px;border-radius:12px;background:rgba(160,38,30,.94);font:700 15px Cinzel,Georgia,serif;color:#fff;white-space:nowrap;overflow:clip;opacity:0;transition:opacity .12s}
#fal-hueco.ve{opacity:1}
#fal-eco{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 132px);transform:translateX(-50%);max-width:86%;padding:6px 16px;border-radius:12px;font:700 17px Cinzel,Georgia,serif;letter-spacing:.02em;color:#fff;text-align:center;white-space:nowrap;overflow:clip;opacity:0;transition:opacity .15s}
#fal-eco.ve{opacity:1}
#fal-eco.bien{background:rgba(38,120,58,.9)}
#fal-eco.mal{background:rgba(160,38,30,.92)}
#fal svg.anillo{position:absolute;left:0;top:0;width:72px;height:72px;margin:-36px 0 0 -36px;overflow:visible;display:none}
#fal svg.anillo circle{fill:none;stroke-linecap:round}
@media (orientation:landscape){
  #fal-eco{top:calc(env(safe-area-inset-top) + 66px);font-size:15px}
  #fal-hueco{top:calc(env(safe-area-inset-top) + 104px);font-size:14px}
}`;
  document.head.appendChild(st);
  const raiz = document.createElement('div'); raiz.id = 'fal'; raiz.hidden = true;
  const R2 = 28, C2 = 2 * Math.PI * R2;
  raiz.innerHTML = `<div id="fal-aviso"><b>¡Bajad sarisas! ↓</b><i><u></u></i></div><div id="fal-hueco">Arrastra al de atrás al hueco</div><div id="fal-eco"></div>
<svg class="anillo" viewBox="-36 -36 72 72"><circle r="${R2}" stroke="rgba(0,0,0,.5)" stroke-width="9"/><circle id="fal-cuenta" r="${R2}" stroke="#ff5a44" stroke-width="6" transform="rotate(-90)" stroke-dasharray="${C2}"/><circle r="${R2 + 7}" stroke="#ff5a44" stroke-width="2" stroke-dasharray="4 5"/></svg>`;
  (padre || document.body).appendChild(raiz);
  const $ = s => raiz.querySelector(s), aviso = $('#fal-aviso'), barra = $('#fal-aviso u'), huecoR = $('#fal-hueco'), eco = $('#fal-eco'), anilloS = $('svg.anillo'), cuenta = $('#fal-cuenta');
  let ecoVisto = '', ecoHasta = 0, reloj = 0, pos = null;
  function pinta({ ve, est, frente, hueco, dt = 0 }) {
    reloj += dt; raiz.hidden = !ve || !est; pos = null; if (raiz.hidden) return;
    const acomete = !!(est.rival && est.rival.fase === 'acomete');
    aviso.classList.toggle('ve', acomete);
    if (acomete && frente) {
      const w = innerWidth, x = Math.max(110, Math.min(w - 110, frente[0])), y = Math.max(176, Math.min(innerHeight - 190, frente[1]));
      aviso.style.transform = `translate(${x}px,${y}px)`; barra.style.width = Math.round(100 * est.rival.t) + '%';
    }
    const hu = est.hueco;
    huecoR.classList.toggle('ve', !!hu);
    if (hu && hueco && hueco[2]) {
      anilloS.style.display = 'block'; anilloS.style.transform = `translate(${hueco[0]}px,${hueco[1]}px)`; cuenta.style.strokeDashoffset = C2 * (1 - Math.max(0, Math.min(1, hu.t)));
      pos = { x: hueco[0], y: hueco[1], r: 60 };
    } else anilloS.style.display = 'none';
    const clave = est.eco.texto + '|' + est.eco.t;
    if (est.eco.texto && clave !== ecoVisto) { ecoVisto = clave; ecoHasta = reloj + ECO_S; eco.textContent = est.eco.texto; eco.className = est.eco.tipo || ''; }
    eco.classList.toggle('ve', reloj < ecoHasta);
  }
  return { pinta, anillo: () => pos };
}
