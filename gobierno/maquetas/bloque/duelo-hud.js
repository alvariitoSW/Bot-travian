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
