/* Pantallas nuevas del estilo ganador: colocar, zonas, subir, barrio. Se apoya en comun/ui.js (barra de recursos, barra de abajo, etiquetas)
   y añade lo suyo encima. Uso: montarZonas({modo, Z, proyectar}) */
(function () {
  const svg = (k, cl = '') => `<svg viewBox="0 0 24 24" class="${cl}" aria-hidden="true">${UIComun.ICONOS[k]}</svg>`;
  const pct = v => Math.round(v * 100);
  const estado = p => p >= 70 ? 'bien' : p >= 10 ? 'falta' : 'mal';
  const TXT = { bien: 'Bien', falta: 'Falta', mal: 'Mal' };
  const CARA = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f4c542" stroke="#6b4a10" stroke-width="1.6"/><circle cx="8.6" cy="9.6" r="1.4" fill="#4a2e08"/><circle cx="15.4" cy="9.6" r="1.4" fill="#4a2e08"/><path d="M7 13.5c1.2 3.2 8.8 3.2 10 0z" fill="#4a2e08" stroke="#4a2e08" stroke-width="1" stroke-linejoin="round"/></svg>';

  function gotas(E, P, lista, color, z0) { // dibuja una gota sobre cada casa de la lista (canvas encima del 3D, bajo la interfaz)
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; cv.className = 'gotas'; const c = cv.getContext('2d'); c.scale(2, 2);
    const alt = { choza: 11, atrio: 9.5, insula: 23, rica: 10 };
    for (const i of lista) { const h = E.casas[i], x = h.w ? h.x + h.w / 2 : h.x, y = h.h ? h.y + h.h / 2 : h.y, [sx, sy] = P(x, y, alt[h.tipo] || 8); if (sy < 44 || sy > 790) continue;
      const w = color.w; c.save(); c.translate(sx, sy); c.beginPath(); c.moveTo(0, -w * 1.5); c.bezierCurveTo(w * .35, -w * .6, w, -w * .15, w, w * .45); c.arc(0, w * .45, w, 0, Math.PI, false); c.bezierCurveTo(-w, -w * .15, -w * .35, -w * .6, 0, -w * 1.5); c.closePath();
      c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 2; c.shadowOffsetY = 1; c.fillStyle = color.f; c.fill(); c.shadowColor = 'transparent'; c.lineWidth = 1.3; c.strokeStyle = color.s; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-w * .35, w * .15, w * .2, w * .38, .3, 0, 7); c.fill(); c.restore(); }
    return cv;
  }
  const ROJA = { f: '#d4402e', s: '#fff', w: 4.4 }, AZUL = { f: '#7cc7f2', s: '#14588f', w: 3.6 };

  window.montarZonas = function (op) {
    const E = window.ESCENA, Z = op.Z, modo = op.modo, ui = document.getElementById('ui'), P = op.proyectar3;
    window.montarUI({ modo: 'ciudad', proyectar: op.proyectar }); // base: recursos, fecha, etiquetas, barra de abajo
    const q = s => ui.querySelector(s), todos = s => [...ui.querySelectorAll(s)], add = h => ui.insertAdjacentHTML('beforeend', h);
    const rio = E.barrios.find(b => b.id === 'rio');
    const fuera = () => todos('.etq').forEach(e => { const x = parseFloat(e.style.left), y = parseFloat(e.style.top); if (x < 30 || x > 360 || y < 50 || y > 790) e.remove(); });
    const nombresBarrio = (rev) => todos('.etq.bar').forEach(e => { e.classList.add('banner'); });
    todos('.etq.foro,.fecha').forEach(e => e.remove()); nombresBarrio();
    const nb = Z.conAguaNueva.length, nbarr = Object.keys(Z.barriosNuevos).length;

    if (modo === 'colocar') {
      q('.barra').remove();
      ui.insertBefore(gotas(E, P, Z.conAguaNueva, AZUL), ui.firstChild);
      add(`<div class="tarj"><div class="t1"><span class="ico azul">${svg('agua')}</span><b>Fuente</b><span class="pre">· 60 mat.</span><span class="b2">Agua para ${nbarr} barrios, ${nb} casas</span></div>
        <div class="t2"><i></i>${rio.nombre}: chozas → casas de atrio <em>(falta salud)</em></div></div>
        <div class="acc"><button class="no">Cancelar</button><button class="si">Colocar aquí</button></div>`);
    }
    if (modo === 'colocar') { const [fx, fy] = op.proyectar(Z.nuevo.x, Z.nuevo.y); add(`<div class="aqui" style="left:${fx}px;top:${fy - 40}px">Fuente aquí</div>`); }
    if (modo === 'zonas') {
      const sel = op.nec || 'agua', sin = Z.sinAgua;
      ui.insertBefore(gotas(E, P, sin, ROJA), ui.firstChild);
      add(`<div class="chips">${E.NECESIDADES.map(([k, n]) => `<div class="chip${k === sel ? ' on' : ''}" title="${n}">${svg(k)}</div>`).join('')}</div>
        <div class="selnom"><b>${E.NECESIDADES.find(a => a[0] === sel)[1]}</b> · ${sin.length} casas sin agua de ${E.casas.length}</div>
        <div class="leyz"><span><i class="az"></i>Azul: llega el agua</span><span>·</span><span><i class="gt"></i>Gota roja: casa sin agua</span></div>`);
      Z.serv.filter(s => s.tipo === 'fuente').forEach(s => { const [x, y] = op.proyectar(s.x, s.y); add(`<div class="pin" style="left:${x}px;top:${y}px">${svg('agua')}</div>`); });
    }
    if (modo === 'subir') {
      const [fx, fy] = op.proyectar(Z.nuevo.x, Z.nuevo.y);
      add(`<div class="aviso"><div class="a1"><span class="ico verde">▲</span><b>${rio.nombre} sube a nivel 2</b></div><div class="a2">+40 vecinos · +12 denarios por estación</div></div>`);
      for (const s of Z.subidas.filter(s => s.tipo === 'andamio')) { const h = E.casas[s.idx], [x, y] = op.proyectar(h.x, h.y); add(`<div class="obra" style="left:${x}px;top:${y - 17}px">En obra</div>`); }
      const [bx, by] = op.proyectar(rio.centro[0], rio.centro[1]);
      add(`<div class="cara" style="left:${bx}px;top:${by - 26}px">${CARA}</div>`);
      todos('.etq.bar').forEach(e => { if (e.textContent === rio.nombre) { e.textContent = rio.nombre + ' · nivel 2'; e.style.top = (parseFloat(e.style.top) + 24) + 'px'; } });
    }
    if (modo === 'barrio') {
      const ks = E.NECESIDADES, cob = k => Z.cobDespues('rio', k), n = 1;
      fuera();
      const filas = ks.map(([k, nom]) => { const p = pct(cob(k)), e = estado(p); return `<div class="fila"><span class="ic ${e}" style="background:var(--ui-${e})">${svg(k)}</span><span class="nm">${nom}</span><span class="bar"><i class="${e}" style="width:${Math.max(p, 2)}%"></i></span><span class="pc">${p}%</span><span class="es ${e}">${TXT[e]}</span></div>`; }).join('');
      let w = 0, sw = 0; for (const [k] of ks) { w += Z.PESO[k] * cob(k); sw += Z.PESO[k]; }
      const base = w / sw, animo = Math.max(4, Math.min(96, Math.round((base - .35) / .6 * 100))), futuro = Math.min(96, animo + 14);
      const pal = a => a < 20 ? 'Revuelta' : a < 40 ? 'Descontentos' : a < 60 ? 'Inquietos' : a < 80 ? 'Conformes' : 'Contentos';
      const r = Z.remedios[0], necsR = Object.entries(r.nuevas).filter(([, v]) => v).map(([k]) => ({ salud: 'salud', limpieza: 'limpieza', cultura: 'cultura' }[k] || k));
      const pesan = ['alimentacion', 'trabajo', 'culto_ocio'].map(k => [k, { alimentacion: 'grano', trabajo: 'trabajo', culto_ocio: 'juegos' }[k]]);
      add(`<div class="hoja"><div class="asa"></div>
        <div class="cab"><div><h3>${rio.nombre} · plebe</h3><div class="vec">${String(rio.vecinos).replace(/(\d)(\d{3})$/, '$1 $2')} vecinos · nivel 1</div></div><div class="x">✕</div></div>
        <div class="animo"><div class="al"><b>Ánimo de la plebe</b><span class="tend">↗ sube</span><span class="est">${pal(animo)} <small>→ ${pal(futuro)} en 2 estaciones</small></span></div>
          <div class="med"><i class="mk" style="left:${animo}%"></i><i class="mk fut" style="left:${futuro}%"></i></div><div class="ex"><span>Revuelta</span><span>Contentos</span></div></div>
        <div class="filas">${filas}</div>
        <div class="pesan"><b>Qué pide la plebe:</b> ${pesan.map(([k, t]) => `<span class="pq ${estado(pct(cob(k)))}">${svg(k)}${t}</span>`).join('')}<small>las que más pesan en la plebe: ahora están cubiertas</small></div>
        <div class="rem"><div class="rt"><b>Mejor remedio:</b> ${r.nombre} aquí: <em>+${necsR.join(' y +')}</em> a ${r.casas} casas</div><button class="btn">Encargar a Infraestructura</button></div></div>`);
      const [px, py] = op.proyectar(Z.nuevo.x, Z.nuevo.y); add(`<div class="pin" style="left:${px}px;top:${py}px">${svg('agua')}</div>`);
    }
    if (modo === 'necesidades') { todos('.halo').forEach(h => { if (!h.classList.contains('sel')) h.remove(); else h.remove(); }); }
  };
})();
