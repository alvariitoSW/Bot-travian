/* SUP1 · Boceto del campamento visto desde arriba (SVG). Solo maqueta de diseño: no es código del juego.
   escena(svg, {etapa:0..4, hora:'dia'|'tarde'|'noche', oleada:bool, obras:bool, ancho, alto}) */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  let semilla = 7;
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
  const el = (padre, tag, at) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); padre.appendChild(n); return n; };

  window.escena = function (svg, o) {
    semilla = o.semilla || 7;
    const W = o.ancho || 390, H = o.alto || 600, cx = W / 2, cy = H * 0.52;
    const R = Math.min(W, H) * 0.36;               // radio del recinto
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const defs = el(svg, 'defs', {});
    defs.innerHTML = `
      <filter id="hierba" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/>
        <feColorMatrix values="0 0 0 0 .32  0 0 0 0 .36  0 0 0 0 .16  0 0 0 .55 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="sombra"><feDropShadow dx="2" dy="3" stdDeviation="1.6" flood-opacity=".45"/></filter>
      <filter id="humo"><feGaussianBlur stdDeviation="5"/></filter>
      <radialGradient id="fuego"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="#ffb43c"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
      <radialGradient id="hueco"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="foso" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a3420"/><stop offset="1" stop-color="#6b4c2c"/></linearGradient>`;

    // Suelo
    const suelo = { dia: '#8c9348', tarde: '#8a7f42', noche: '#5b6236' }[o.hora || 'dia'];
    el(svg, 'rect', { width: W, height: H, fill: suelo });
    el(svg, 'rect', { width: W, height: H, fill: '#000', filter: 'url(#hierba)' });
    // claros de tierra pisada dentro del campamento
    el(svg, 'ellipse', { cx, cy, rx: R * (o.etapa >= 2 ? 0.92 : 0.7), ry: R * (o.etapa >= 2 ? 0.86 : 0.62), fill: '#a68d5b', opacity: .75 });
    // camino a la puerta (abajo)
    el(svg, 'path', { d: `M${cx - 14} ${H} Q${cx - 6} ${cy + R * 1.2} ${cx} ${cy + R * .55} L${cx + 12} ${cy + R * .55} Q${cx + 14} ${cy + R * 1.2} ${cx + 22} ${H} Z`, fill: '#a68d5b', opacity: .8 });
    // río al este
    el(svg, 'path', { d: `M${W} 0 C${W - 40} ${H * .25} ${W - 10} ${H * .45} ${W - 46} ${H * .7} S${W - 30} ${H} ${W - 20} ${H} L${W} ${H} Z`, fill: '#4f7f8c' });
    el(svg, 'path', { d: `M${W} 0 C${W - 40} ${H * .25} ${W - 10} ${H * .45} ${W - 46} ${H * .7} S${W - 30} ${H} ${W - 20} ${H}`, fill: 'none', stroke: '#c9d8c0', 'stroke-width': 1.2, opacity: .6 });

    // Árboles alrededor (bosque al norte y al oeste)
    for (let i = 0, n = 0; i < 900 && n < (o.arboles || 95); i++) {
      const x = azar() * W, y = azar() * H;
      const dx = (x - cx) / (R * 1.32), dy = (y - cy) / (R * 1.22);
      if (dx * dx + dy * dy < 1 || x > W - 58 || (y > cy && Math.abs(x - cx - 4) < 34)) continue;
      if (o.claroSur && y > cy + R * .9 && Math.abs(x - cx) < W * .3) continue;
      arbol(x, y, 8 + azar() * 9); n++;
    }
    // tocones donde ya se taló
    if (o.etapa >= 1) for (let i = 0; i < 14; i++) { const a = -Math.PI * .9 + azar() * 1.4, d = R * (1.15 + azar() * .25); el(svg, 'circle', { cx: cx + Math.cos(a) * d * 1.1, cy: cy + Math.sin(a) * d, r: 3, fill: '#c9a46a', stroke: '#6b4a26' }); }

    // Foso y terraplén
    if (o.etapa >= 2) {
      const obra = o.etapa === 2 ? 0.62 : 1;   // en la etapa 2 el foso está a medias
      const largo = 2 * Math.PI * R * 1.08;
      el(svg, 'ellipse', { cx, cy, rx: R * 1.12, ry: R * 1.04, fill: 'none', stroke: 'url(#foso)', 'stroke-width': 11, 'stroke-dasharray': `${largo * obra} ${largo}`, transform: `rotate(100 ${cx} ${cy})` });
      el(svg, 'ellipse', { cx, cy, rx: R * 1.0, ry: R * 0.93, fill: 'none', stroke: '#8d6c3e', 'stroke-width': 7, opacity: .9, 'stroke-dasharray': `${largo * obra * .9} ${largo}`, transform: `rotate(100 ${cx} ${cy})` });
      if (o.etapa === 2) {               // montones de tierra y cavadores en la punta del foso
        const a = (100 + 360 * obra) * Math.PI / 180;
        for (let k = 0; k < 5; k++) { const aa = a - k * 0.13; trabajador(cx + Math.cos(aa) * R * 1.12, cy + Math.sin(aa) * R * 1.04, 'pala'); }
        for (let k = 0; k < 4; k++) { const aa = a + 0.2 + k * 0.25; el(svg, 'circle', { cx: cx + Math.cos(aa) * R * 1.12, cy: cy + Math.sin(aa) * R * 1.04, r: 1.6, fill: '#e9c063' }); }
        etiquetaObra(cx + Math.cos(a) * R * 1.12, cy + Math.sin(a) * R * 1.04 - 20, 'Foso 62 %');
      }
    }
    // Empalizada
    const puertaA = Math.PI / 2;   // abajo
    if (o.etapa >= 3) {
      const n = 120;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2; if (Math.abs(a - puertaA) < 0.11) continue;
        const roto = o.oleada && Math.abs(a - 4.55) < 0.07;
        if (roto) continue;
        const x = cx + Math.cos(a) * R * 0.97, y = cy + Math.sin(a) * R * 0.9;
        el(svg, 'circle', { cx: x, cy: y, r: 2.6, fill: '#7a5530', stroke: '#3d2810', 'stroke-width': .8 });
      }
      // puerta
      const px = cx, py = cy + R * 0.9;
      el(svg, 'rect', { x: px - 13, y: py - 4, width: 26, height: 8, fill: '#5a3c1c', stroke: '#2b1c0a', filter: 'url(#sombra)' });
      el(svg, 'line', { x1: px, y1: py - 4, x2: px, y2: py + 4, stroke: '#2b1c0a' });
      if (o.oleada) { // tramo roto
        const a = 4.55; etiquetaObra(cx + Math.cos(a) * R + 6, cy + Math.sin(a) * R * .9 - 18, '¡Brecha!', '#dd5a43');
      }
    }
    // Torre
    if (o.etapa >= 4) {
      for (const dx of [-24, 24]) {
        const tx = cx + dx, ty = cy + R * 0.9 - 2;
        el(svg, 'rect', { x: tx - 8, y: ty - 8, width: 16, height: 16, fill: '#8a6236', stroke: '#2b1c0a', filter: 'url(#sombra)' });
        el(svg, 'path', { d: `M${tx - 8} ${ty - 8} L${tx + 8} ${ty + 8} M${tx + 8} ${ty - 8} L${tx - 8} ${ty + 8}`, stroke: '#5a3c1c' });
        if (o.hora === 'noche') antorcha(tx, ty - 10);
      }
    }

    // Tiendas
    const tiendas = [];
    if (o.etapa >= 1) {
      const filas = o.etapa >= 3 ? 3 : 2, porFila = o.etapa >= 3 ? 6 : 4;
      for (let f = 0; f < filas; f++) for (let c = 0; c < porFila; c++) {
        const x = cx - (porFila - 1) * 19 + c * 38 + (f % 2) * 6, y = cy - R * 0.55 + f * 34;
        if (Math.hypot(x - cx, (y - cy) * 1.1) < 34) continue;
        tiendas.push([x, y]); tienda(x, y);
      }
    } else {
      for (let i = 0; i < 12; i++) { const a = azar() * 6.28, d = 22 + azar() * 30; el(svg, 'rect', { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * .8, width: 10, height: 5, rx: 2, fill: '#b49a6a', stroke: '#5a4220', transform: `rotate(${azar() * 180} ${cx + Math.cos(a) * d} ${cy + Math.sin(a) * d * .8})` }); }
      // carros de la llegada
      for (const [x, y] of [[cx - 60, cy + 40], [cx + 50, cy + 55]]) { el(svg, 'rect', { x: x - 12, y: y - 7, width: 24, height: 14, fill: '#7a5530', stroke: '#2b1c0a', filter: 'url(#sombra)' }); el(svg, 'circle', { cx: x - 13, cy: y, r: 4, fill: 'none', stroke: '#2b1c0a', 'stroke-width': 2 }); }
    }
    // Talleres de la etapa 4: fragua y horno
    if (o.etapa >= 4) {
      casita(cx + R * .55, cy + R * .25, '#9b6b3a', 'Fragua');
      casita(cx - R * .6, cy + R * .3, '#a07a46', 'Horno');
      el(svg, 'rect', { x: cx - 7, y: cy - R * .78, width: 14, height: 8, fill: '#e8dcc0', stroke: '#5a4220' }); // altar
    }
    // Leña, agua, víveres
    if (o.etapa >= 1) {
      monton(cx - R * .62, cy - R * .05, '#8a5a2a', 'leña'); monton(cx + R * .62, cy - R * .15, '#c9b37a', 'grano');
      for (let i = 0; i < 4; i++) el(svg, 'ellipse', { cx: cx + R * .5 + i * 7, cy: cy + R * .55, rx: 3, ry: 4, fill: '#b5643a', stroke: '#5a2a10' }); // ánforas
    }
    // Hoguera central
    hoguera(cx, cy, o.etapa >= 1 ? 1.2 : 1);
    if (o.etapa >= 1) { hoguera(cx - 70, cy + R * .1, .8); hoguera(cx + 70, cy + R * .05, .8); }

    // Hombres: guardias en el perímetro, trabajadores dentro y fuera
    const hombres = [];
    if (!o.oleada) {
      if (o.obras !== false && o.hora !== 'noche') {
        for (let i = 0; i < 7; i++) trabajador(cx - R * 1.28 - (i % 2) * 9, cy - R * .5 + i * 11, 'hacha');   // talando al oeste
        for (let i = 0; i < 3; i++) trabajador(cx - R * 1.05 + i * 10, cy - R * .2 + i * 4, 'leña');
        for (let i = 0; i < 3; i++) trabajador(W - 60 + i * 6, cy + 30 + i * 8, 'agua');                       // agua del río
        for (let i = 0; i < 4; i++) trabajador(cx - R * .6 + i * 8, cy + R * .05 + (i % 2) * 7, 'leña');
        if (o.etapa >= 3) for (let i = 0; i < 4; i++) trabajador(cx + R * .9 + i * 4, cy - R * .4 + i * 7, 'martillo');
      }
      // guardias
      const ng = o.hora === 'noche' ? 14 : 6;
      for (let i = 0; i < ng; i++) { const a = i / ng * Math.PI * 2 + .2; hoplita(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.8, a); if (o.hora === 'noche' && i % 2 === 0) antorcha(cx + Math.cos(a) * R * 0.86 + 4, cy + Math.sin(a) * R * 0.8 - 3); }
      // descansando junto al fuego
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; hoplita(cx + Math.cos(a) * 20, cy + Math.sin(a) * 16, a + Math.PI, true); }
    } else {
      // la guarnición en la empalizada, mirando afuera; la reserva en el centro
      for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2; if (Math.abs(a - 4.55) < .18) continue; hoplita(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.81, a); if (i % 3 === 0) antorcha(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.74); }
      // el grupo del oficial tapando la brecha (resaltado)
      const a = 4.55, bx = cx + Math.cos(a) * R * 0.86, by = cy + Math.sin(a) * R * 0.8;
      el(svg, 'circle', { cx: bx, cy: by + 4, r: 22, fill: 'none', stroke: '#e9c063', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' });
      for (let k = 0; k < 12; k++) hoplita(bx - 15 + (k % 6) * 6, by - 2 + Math.floor(k / 6) * 7, a, false, k === 0);
      // enemigos llegando del bosque, sobre todo por el norte y el oeste
      for (let i = 0; i < 70; i++) {
        const aa = -Math.PI * .95 + azar() * Math.PI * 0.9, d = R * (1.15 + azar() * .75);
        const x = cx + Math.cos(aa) * d * 1.1, y = cy + Math.sin(aa) * d;
        enemigo(x, y, Math.atan2(cy - y, cx - x)); if (i % 5 === 0) antorcha(x + 3, y - 3);
      }
      // dardos y flechas
      for (let i = 0; i < 26; i++) { const aa = -Math.PI * .9 + azar() * Math.PI * .8, d1 = R * (1.1 + azar() * .4); const x = cx + Math.cos(aa) * d1, y = cy + Math.sin(aa) * d1 * .93; el(svg, 'line', { x1: x, y1: y, x2: x + (cx - x) * .08, y2: y + (cy - y) * .08, stroke: '#f1ead9', 'stroke-width': .8, opacity: .8 }); }
    }

    // Humo de los fuegos (de día)
    if (o.hora !== 'noche') for (const [x, y] of [[cx, cy], [cx - 70, cy + R * .1], [cx + 70, cy + R * .05]]) {
      for (let k = 0; k < 4; k++) el(svg, 'circle', { cx: x + 8 + k * 9, cy: y - 10 - k * 14, r: 7 + k * 4, fill: '#d8d2c4', opacity: .38 - k * .07, filter: 'url(#humo)' });
    }

    // Noche: velo oscuro con huecos de luz en fuegos y antorchas
    if (o.hora === 'noche' || o.hora === 'tarde') {
      const m = el(defs, 'mask', { id: 'velo' });
      el(m, 'rect', { width: W, height: H, fill: '#fff' });
      for (const [x, y, r] of luces) el(m, 'circle', { cx: x, cy: y, r, fill: 'url(#hueco)' });
      el(svg, 'rect', { width: W, height: H, fill: o.hora === 'noche' ? '#0b1030' : '#5a2a10', opacity: o.hora === 'noche' ? .72 : .28, mask: 'url(#velo)' });
      for (const [x, y, r] of luces) el(svg, 'circle', { cx: x, cy: y, r: r * .55, fill: 'url(#fuego)', opacity: .35 });
    }

    // ---- piezas ----
    function arbol(x, y, r) { el(svg, 'circle', { cx: x + 3, cy: y + 4, r, fill: '#000', opacity: .25 }); el(svg, 'circle', { cx: x, cy: y, r, fill: azar() < .5 ? '#3f5a24' : '#4d6a2a' }); el(svg, 'circle', { cx: x - r * .3, cy: y - r * .3, r: r * .5, fill: '#6b8a3a', opacity: .7 }); }
    function tienda(x, y) {
      el(svg, 'rect', { x: x - 13, y: y - 9, width: 26, height: 18, rx: 1.5, fill: '#d9c9a0', stroke: '#6b5a3a', 'stroke-width': .8, filter: 'url(#sombra)' });
      el(svg, 'path', { d: `M${x - 13} ${y - 9} L${x + 13} ${y - 9} L${x + 13} ${y} L${x - 13} ${y} Z`, fill: '#f0e4c4', opacity: .7 });
      el(svg, 'line', { x1: x - 13, y1: y, x2: x + 13, y2: y, stroke: '#6b5a3a', 'stroke-width': 1 });
    }
    function casita(x, y, color, nombre) {
      el(svg, 'rect', { x: x - 16, y: y - 12, width: 32, height: 24, fill: color, stroke: '#2b1c0a', filter: 'url(#sombra)' });
      el(svg, 'path', { d: `M${x - 16} ${y} L${x + 16} ${y}`, stroke: '#5a3c1c', 'stroke-width': 1.5 });
      if (nombre === 'Fragua') luces.push([x + 10, y + 14, 16]);
    }
    function monton(x, y, color) { for (let k = 0; k < 7; k++) el(svg, 'rect', { x: x - 10 + (k % 4) * 5, y: y - 4 + Math.floor(k / 4) * 5, width: 6, height: 4, fill: color, stroke: '#2b1c0a', 'stroke-width': .5 }); }
    function hoguera(x, y, s) { el(svg, 'circle', { cx: x, cy: y, r: 6 * s, fill: '#3a2a1a' }); el(svg, 'circle', { cx: x, cy: y, r: 9 * s, fill: 'url(#fuego)' }); luces.push([x, y, 46 * s]); }
    function antorcha(x, y) { el(svg, 'circle', { cx: x, cy: y, r: 3.2, fill: 'url(#fuego)' }); luces.push([x, y, 20]); }
    function hoplita(x, y, a, sentado, jefe) { const G = el(svg, 'g', { transform: `translate(${x} ${y}) scale(${o.esc || 1.45}) translate(${-x} ${-y})` }); const svg0 = svg; svg = G;
      // escudo redondo de bronce delante, cabeza con casco; jefe con penacho
      const ex = x + Math.cos(a) * 2.6, ey = y + Math.sin(a) * 2.6;
      el(svg, 'circle', { cx: x, cy: y, r: 2.9, fill: sentado ? '#8b3b26' : '#7a2a1c' });
      el(svg, 'circle', { cx: ex, cy: ey, r: 3.1, fill: '#c08a2e', stroke: '#5a3c10', 'stroke-width': .7 });
      el(svg, 'circle', { cx: x - Math.cos(a) * 1, cy: y - Math.sin(a) * 1, r: 1.5, fill: jefe ? '#e9c063' : '#9c7a3a' });
      if (jefe) el(svg, 'line', { x1: x - 3, y1: y - 1, x2: x + 3, y2: y - 1, stroke: '#dd3a2a', 'stroke-width': 1.6 });
      if (!sentado) el(svg, 'line', { x1: x, y1: y, x2: x + Math.cos(a) * 9, y2: y + Math.sin(a) * 9, stroke: '#3a2a12', 'stroke-width': .9 }); // lanza
      svg = svg0;
    }
    function trabajador(x, y, util) { const G = el(svg, 'g', { transform: `translate(${x} ${y}) scale(${o.esc || 1.45}) translate(${-x} ${-y})` }); const svg0 = svg; svg = G;
      el(svg, 'circle', { cx: x, cy: y, r: 2.6, fill: '#c9b48a', stroke: '#5a4220', 'stroke-width': .6 });
      el(svg, 'circle', { cx: x, cy: y - .6, r: 1.3, fill: '#6b4a26' });
      const c = { pala: '#8a6a3a', hacha: '#5a5a5a', agua: '#b5643a', leña: '#8a5a2a', martillo: '#5a5a5a' }[util];
      if (util === 'agua') el(svg, 'ellipse', { cx: x + 3, cy: y + 2, rx: 1.8, ry: 2.3, fill: c });
      else if (util === 'leña') el(svg, 'rect', { x: x - 4, y: y + 2, width: 8, height: 2, fill: c });
      else el(svg, 'line', { x1: x, y1: y, x2: x + 5, y2: y - 4, stroke: c, 'stroke-width': 1.3 });
      svg = svg0;
    }
    function enemigo(x, y, a) { const G = el(svg, 'g', { transform: `translate(${x} ${y}) scale(${o.esc || 1.45}) translate(${-x} ${-y})` }); const svg0 = svg; svg = G;
      el(svg, 'circle', { cx: x, cy: y, r: 2.8, fill: '#3b2a3e' });
      el(svg, 'path', { d: `M${x + Math.cos(a) * 2 - 2.5} ${y + Math.sin(a) * 2} a3 3 0 0 0 5 0`, fill: '#a9452c', transform: `rotate(${a * 57.3 - 90} ${x} ${y})` });
      el(svg, 'circle', { cx: x, cy: y, r: 1.3, fill: '#c7a27a' });
      svg = svg0;
    }
    function etiquetaObra(x, y, t, color) {
      const g = el(svg, 'g', {}); const w = t.length * 6.2 + 12;
      el(g, 'rect', { x: x - w / 2, y: y - 9, width: w, height: 17, rx: 8, fill: 'rgba(18,15,11,.86)', stroke: color || '#e9c063' });
      const tx = el(g, 'text', { x, y: y + 3.5, 'text-anchor': 'middle', fill: color || '#e9c063', 'font-size': 11, 'font-weight': 700, 'font-family': 'system-ui,sans-serif' }); tx.textContent = t;
    }
  };
  const luces = window.__luces = [];
  // las piezas usan esta lista; se vacía en cada escena
  const orig = window.escena;
  window.escena = function (svg, o) { luces.length = 0; return orig(svg, o); };
})();
