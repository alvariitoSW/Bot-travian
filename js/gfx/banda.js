/* AQVILA — SON4: banda sonora, voces y subtítulo para las pantallas de batalla que no son la de campaña (maquetas a pie y Escaramuzas).
   No inventa nada: junta lo que ya hay (js/gfx/musica.js, js/voces.js, js/gfx/sonido.js) con las mismas reglas que js/ui-guerra.js:
   música por debajo (se agacha al hablar el centurión), una voz cada vez, solo los pueblos griegos gritan en griego (Voces.esGriego),
   el canto (grupo «canto») solo para galos, y el subtítulo con el mismo aspecto que #gu-dialogo. Todo sale por Sonido.maestro (un solo contexto).
   Banda.crea({ padre, propio: 'romano' | 'griego' | 'otro', rival: { esGriego, galos }, semilla, abajo }) → { dice(sit), tic(dt, resumen), inicia(), fin(como), reinicia(), parar() }.
     propio 'romano': frases latinas de Voces como en la campaña. 'griego' (SON5): frases en griego antiguo del lochagós y los falangitas (Voces.GRIEGAS), con su
     transliteración y traducción, y a veces el grito alalá/eleleú/peán. 'cartago', 'galos', 'iberos' (SON5): gritos de guerra en español (Voces.GRITOS).
     'otro': ninguna frase propia, solo música y lo que se oye del rival. El rival (enemigo) sigue como estaba: descripciones y, si es griego, su grito.
   Parte pura (también en Node): propioDe, rivalDe, resumenSim. */
(function (raiz) {
  'use strict';
  const B = {};
  const romanas = ['hastati', 'principes', 'triarii', 'velites', 'equites'];
  /* quién somos, según las tropas de nuestro bando ({ tipo: hombres }): romano si lleva legión; griego si lleva falange u hoplitas sin Cartago */
  /* SON5: si se sabe el pueblo (Escaramuzas: roma, cartago, epiro, macedonia, galos, iberos), manda; si no, se deduce de las tropas.
     'cartago' | 'galos' | 'iberos' hablan en español (gritos de guerra); 'griego', en griego antiguo; 'romano', en latín. */
  B.propioDe = (n0, pueblo) => {
    n0 = n0 || {}; const hay = t => (n0[t] || 0) > 0;
    if (pueblo === 'roma') return 'romano';
    if (pueblo === 'epiro' || pueblo === 'macedonia') return 'griego';
    if (pueblo === 'cartago' || pueblo === 'galos' || pueblo === 'iberos') return pueblo;
    if (['hastati', 'principes', 'triarii'].some(hay)) return 'romano';
    if (['libios', 'sagrada'].some(hay)) return 'cartago';
    if (raiz.Voces && raiz.Voces.esGriego(n0)) return 'griego';
    const tot = Object.keys(n0).reduce((a, t) => a + (n0[t] || 0), 0);
    if (tot > 0 && (n0.galos || 0) > tot / 2) return 'galos';
    if (tot > 0 && (n0.iberos || 0) > tot / 2) return 'iberos';
    return 'otro';
  };
  /* el rival: ¿grita en griego?, ¿lleva galos? (n0 = { tipo: hombres } de su bando) */
  B.rivalDe = n0 => { n0 = n0 || {}; return { esGriego: !!(raiz.Voces && raiz.Voces.esGriego(n0)), galos: (n0.galos || 0) > 0 }; };
  /* el resumen para la música a partir del estado del simulador (js/simulador.js): fase, moral media de cada bando, cuerpos rotos, cansancio */
  B.resumenSim = S => {
    const viv = l => S.man.filter(u => u.lado === l && u.n0 > 0), med = l => { const v = viv(l); return v.length ? v.reduce((a, u) => a + (u.estado === 'roto' || u.estado === 'caida' ? 0 : Math.max(0, Math.min(1, u.moral))), 0) / v.length : 1; };
    const rotos = l => viv(l).filter(u => u.estado === 'roto' || u.estado === 'caida' || u.estado === 'fuera').length;
    const luchan = S.reg.some(e => e.tipo === 'choque' || e.tipo === 'carga'), v0 = viv(0);
    return { fase: S.fase === 'fin' ? 'fin' : luchan ? 'lucha' : 'lejos', moral: [med(0), med(1)], rotos: [Math.min(3, rotos(0)), Math.min(3, rotos(1))],
      cansancio: v0.length ? Math.max(...v0.map(u => u.fatiga || 0)) : 0, resultado: S.resultado && S.resultado.como };
  };

  /* el subtítulo: el mismo aspecto que #gu-dialogo de css/guerra.css */
  const CSS = '.banda-dialogo{position:absolute;left:50%;transform:translateX(-50%);width:max-content;max-width:min(60%,calc(100% - 24px));padding:6px 12px;border-radius:12px;background:rgba(14,12,9,.8);border:1px solid #8a7340;font:600 13.5px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#efe6d0;text-align:center;opacity:0;transition:opacity .35s;pointer-events:none;overflow:clip;overflow-wrap:anywhere;z-index:30}'
    + '.banda-dialogo.ve{opacity:1}.banda-dialogo b{font:700 12px Cinzel,Georgia,serif;letter-spacing:.03em;color:#d4af37}.banda-dialogo i{font-weight:700;color:#fff}.banda-dialogo span{color:#cdbf9d;font-weight:500}'
    + '.banda-dialogo.enemigo{border-color:rgba(123,91,181,.8)}.banda-dialogo.enemigo b{color:#c9b2ee}.banda-dialogo.enemigo i{font-weight:500;font-style:italic;color:#d8cfe8}';

  B.crea = function (opc) {
    opc = opc || {}; const V = raiz.Voces, propio = opc.propio || 'otro', rival = opc.rival || {}, vz = V ? V.nuevo() : null;
    let d = null, hasta = 0, tBanda = 0, iniciada = false;
    if (opc.padre && raiz.document) {
      if (!raiz.document.getElementById('banda-css')) { const st = raiz.document.createElement('style'); st.id = 'banda-css'; st.textContent = CSS; raiz.document.head.appendChild(st); }
      d = raiz.document.createElement('div'); d.className = 'banda-dialogo'; d.setAttribute('aria-live', 'polite'); d.style.bottom = opc.abajo || '84px';
      d.innerHTML = '<b></b> <i></i> <span></span>'; opc.padre.appendChild(d);
    }
    const rotulo = (quien, lat, es, nombre) => {
      if (!d) return; d.className = 'banda-dialogo ve ' + quien; d.children[0].textContent = quien === 'enemigo' ? 'Se oye:' : (nombre || V.NOMBRE[quien] || quien) + ':'; d.children[1].textContent = lat; d.children[2].textContent = es ? '— ' + es : '';
      hasta = Date.now() + 3200; clearTimeout(rotulo.t); rotulo.t = setTimeout(() => { if (Date.now() >= hasta) d.classList.remove('ve'); }, 3300);
    };
    const habla = propio === 'griego' || propio === 'cartago' || propio === 'galos' || propio === 'iberos';   /* SON5: nuestro bando habla en su lengua */
    /* dice una frase: subtítulo y voz grabada (o el grito del banco si no está cargada) */
    function frase(f) {
      if (!f || !V) return; const So = raiz.Sonido;
      if (f.quien !== 'enemigo') {
        if (propio === 'otro') return;
        if (habla && f.pueblo === propio) {   /* frase propia en griego antiguo o grito en español: subtítulo con su nombre, transliteración y traducción */
          rotulo(f.quien, (f.gr ? f.gr + ' · ' : '') + f.lat, f.es, V.nombreDe(f));
          const g = f.grupo === 'orden' ? 'orden' : f.grupo;
          if (!So || !So.muestra) return;
          if (So.vbuf && So.vbuf[f.id]) {
            if ((f.quien === 'lochagos' || f.quien === 'jefe') && raiz.Musica) raiz.Musica.agacha();
            So.voz(f.id, { v: f.quien === 'lochagos' || f.quien === 'jefe' ? 0.95 : 0.8, retraso: 0.1, espera: V.URGENTES.includes(f.ev) ? 2.5 : 0.4 }); return;
          }
          const gd = V.grupoDisponible(g, So.tiene); if (gd) So.muestra(gd, { v: 0.7, vel: 1 + 0.1 * Math.random(), retraso: 0.12 });
          return;
        }
        if (propio === 'griego') {   /* frases romanas no: solo, a veces, el grito de guerra de los falangitas (alalá, eleleú, peán) */
          const g = V.griegoPropio(f); if (!g) return; rotulo('enemigo', g.lat, '');
          if (So && So.voz && So.vbuf && So.vbuf[g.id]) So.voz(g.id, { v: 0.7, retraso: 0.1, espera: 0.4 }); return;
        }
        return;   /* un pueblo que habla en otra lengua no dice las frases latinas */
      } else if ((/galos/i.test(f.lat) && !rival.galos) || (/Zama/.test(f.fuente || '') && rival.galos)) return;   /* no se oyen galos si el rival no los lleva; ni el griterío disperso de Zama (cartagineses) si son galos */
      const gg = V.griegoDe(f, !!rival.esGriego), idv = gg ? gg.id : f.quien === 'enemigo' ? '' : f.id;
      rotulo(f.quien, gg ? gg.lat : f.lat, f.es);
      if (!So || !So.muestra) return;
      if (idv && So.vbuf && So.vbuf[idv]) {
        if (f.quien === 'centurion' && raiz.Musica) raiz.Musica.agacha();
        So.voz(idv, { v: f.quien === 'centurion' ? 0.95 : f.quien === 'optio' ? 0.85 : f.quien === 'enemigo' ? 0.6 : 0.75, retraso: 0.1, espera: V.URGENTES.includes(f.ev) ? 2.5 : 0.4 });   /* una voz cada vez: si alguien habla, espera o se salta */
        return;
      }
      let gr = f.grupo; if (gr === 'canto' && !rival.galos) gr = 'clamor';   /* el cántico es celta */
      const g = V.grupoDisponible(gr, So.tiene);
      if (g) { if (f.grupo === 'orden' && raiz.Musica) raiz.Musica.agacha(); So.muestra(g, { v: f.quien === 'centurion' ? 0.85 : f.quien === 'enemigo' ? 0.55 : 0.65, vel: f.quien === 'enemigo' ? 0.9 : 1 + 0.1 * Math.random(), retraso: 0.12 }); }
    }
    const o = {
      vz, propio, rival, get iniciada() { return iniciada; },
      /* una situación de Voces.SITUACIONES (el mapa de eventos a situaciones es Voces.deAviso / deSim) */
      dice(sit) {
        if (!vz || !sit) return; let f = V.elige(sit, vz, Math.random, habla ? propio : null);
        if (propio === 'griego' && f && f.pueblo === 'griego' && Math.random() < 0.2) { const g = V.griegoPropio(f); if (g) { rotulo('enemigo', g.lat, ''); const So = raiz.Sonido; if (So && So.voz && So.vbuf && So.vbuf[g.id]) So.voz(g.id, { v: 0.7, retraso: 0.1, espera: 0.4 }); return; } }   /* a veces, el grito de guerra de siempre: alalá, eleleú o el peán */
        frase(f);
      },
      /* cada fotograma: dt en segundos de batalla; cada segundo, la tensión y la charla suelta. rs = resumen para la música (Musica.tensionDe) */
      tic(dt, rs, flaquea) {
        if (!vz) return; vz.t += dt; tBanda -= dt; if (tBanda > 0) return; tBanda = 1;
        if (typeof rs === 'function') rs = rs(); if (typeof flaquea === 'function') flaquea = flaquea();   /* pueden venir como funciones: solo se calculan una vez por segundo */
        const M = raiz.Musica, ten = M && M.tensionDe ? M.tensionDe(rs) : 0.3; vz.tension = ten;
        if (M && M.activa) { M.tension(ten); M.estado(M.estadoDe(rs)); }
        o.dice(rs && rs.fase === 'lucha' ? 'lucha' : 'espera'); if (flaquea) o.dice('flaquea');
      },
      /* tras el primer toque (los navegadores no dejan sonar antes): la música y las frases habladas */
      inicia() {
        if (iniciada) return; const So = raiz.Sonido; if (!So || !V) return; iniciada = true;
        So.contexto(); if (raiz.Musica) raiz.Musica.iniciar({ semilla: opc.semilla });
        if (So.cargaVoces) {   /* solo las voces que pueden sonar: las de nuestro pueblo y los gritos griegos si hay griegos en la batalla */
          const ids = propio === 'romano' ? V.FRASES.filter(f => f.pron).map(f => f.id) : habla ? V.FRASES_PUEBLO[propio].map(f => f.id) : [];
          if (propio === 'griego' || rival.esGriego) for (const g of V.GRIEGO) ids.push(g.id);
          So.cargaVoces(ids);
        }
      },
      fin(como) {
        if (!vz) return; const sit = como === 'victoria' ? 'victoria' : como === 'derrota' ? 'derrota' : null;
        if (raiz.Musica && sit) raiz.Musica.final(sit); if (sit) o.dice(sit);
      },
      reinicia() { const era = iniciada; o.parar(); Object.assign(vz || {}, V ? V.nuevo() : {}); tBanda = 0; if (d) d.classList.remove('ve'); if (era) o.inicia(); },
      parar() { if (raiz.Musica && raiz.Musica.activa) raiz.Musica.parar(1.5); iniciada = false; },
      quita() { o.parar(); if (d) d.remove(); },
    };
    return o;
  };

  raiz.Banda = B;
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(typeof window !== 'undefined' ? window : globalThis);
