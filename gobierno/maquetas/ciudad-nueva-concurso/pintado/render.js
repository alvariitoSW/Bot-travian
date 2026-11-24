/* Estilo «Plano pintado»: acuarela/gouache cálido, canvas 2D, todo por código. Semilla fija. Sol de tarde arriba-izquierda. */
(function () {
  const S = 2; // resolución interna (píxeles por unidad)
  let seed = 90210; const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * R();
  const hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%,${a})`;
  function dibujarCiudad(E, el) {
    const t0 = performance.now();
    const { CX, CY, RX, RY, rio, RIO_W, RIO_ANG, foro, mercado, muralla } = E;
    const cv = document.createElement('canvas'); cv.width = 390 * S; cv.height = 844 * S; el.appendChild(cv);
    const c = cv.getContext('2d'); c.setTransform(S, 0, 0, S, 0, 0);
    const sombra = (b = 4, dx = 2.5, dy = 3.2, a = .42) => { c.shadowColor = `rgba(50,30,12,${a})`; c.shadowBlur = b * S; c.shadowOffsetX = dx * S; c.shadowOffsetY = dy * S; };
    const nosombra = () => { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; };
    const blob = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    const wob = (x, y, w, h, j = .6) => { c.beginPath(); const n = Math.max(3, Math.round(w / 6)), m = Math.max(3, Math.round(h / 6)); c.moveTo(x + rr(-j, j), y + rr(-j, j));
      for (let i = 1; i <= n; i++) c.lineTo(x + w * i / n + rr(-j, j), y + rr(-j, j)); for (let i = 1; i <= m; i++) c.lineTo(x + w + rr(-j, j), y + h * i / m + rr(-j, j));
      for (let i = n - 1; i >= 0; i--) c.lineTo(x + w * i / n + rr(-j, j), y + h + rr(-j, j)); for (let i = m - 1; i > 0; i--) c.lineTo(x + rr(-j, j), y + h * i / m + rr(-j, j)); c.closePath(); };
    const trazo = (pts, w, col, blur = 0) => { c.save(); if (blur) { c.shadowColor = col; c.shadowBlur = blur * S; } c.strokeStyle = col; c.lineWidth = w; c.lineCap = c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore(); };
    const jit = (pts, j) => pts.map(p => [p[0] + rr(-j, j), p[1] + rr(-j, j)]);
    const ptsCalle = (cl) => { const o = []; for (let i = 1; i < cl.pts.length; i++) { const a = cl.pts[i - 1], b = cl.pts[i], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(cl.pts[cl.pts.length - 1]); return o; };

    /* ---- hierba: base, manchas suaves, flores ---- */
    c.fillStyle = '#9bab57'; c.fillRect(0, 0, 390, 844);
    for (let i = 0; i < 260; i++) { const g = R(); blob(rr(-20, 410), rr(-20, 864), rr(18, 55), g < .4 ? 'hsla(78,38%,48%,A)' : g < .7 ? 'hsla(95,34%,38%,A)' : 'hsla(60,45%,60%,A)', rr(.18, .4)); }
    for (let i = 0; i < 2600; i++) { c.fillStyle = R() < .5 ? 'rgba(70,95,30,.22)' : 'rgba(210,220,120,.25)'; const x = rr(0, 390), y = rr(0, 844); c.fillRect(x, y, 1, rr(1.5, 3.5)); }
    const flores = []; for (let i = 0; i < 170; i++) { const x = rr(0, 390), y = rr(0, 844); if (E.dentro(x, y, -8) || Math.abs(y - rio(x)) < RIO_W + 10) continue; flores.push([x, y, ['#f7efd4', '#f2d24a', '#d9553d', '#f4f0e0', '#b48ad0'][Math.floor(R() * 5)]]); }

    /* ---- campos: tiras con surcos, borde irregular ---- */
    const COL = [[44, 52, 58], [78, 40, 52], [48, 55, 62]];
    E.campos.forEach(f => { c.save(); c.translate(f.x + f.w / 2, f.y + f.h / 2); c.rotate(f.rot * Math.PI / 180); c.translate(-f.w / 2, -f.h / 2); const [h, s, l] = COL[f.col];
      sombra(3, 1, 1.5, .25); wob(0, 0, f.w, f.h, 1.2); c.fillStyle = hsl(h, s, l); c.fill(); nosombra(); c.clip();
      const n = f.vert ? f.w : f.h; for (let i = 0; i < n; i += 3.2) { const tono = hsl(h + rr(-6, 6), s + rr(-10, 8), l + rr(-9, 9), .55);
        c.strokeStyle = tono; c.lineWidth = 1.9; c.beginPath(); if (f.vert) { c.moveTo(i + 1, 0); c.lineTo(i + 1 + rr(-.4, .4), f.h); } else { c.moveTo(0, i + 1); c.lineTo(f.w, i + 1 + rr(-.4, .4)); } c.stroke();
        c.strokeStyle = hsl(h - 4, s, l - 16, .4); c.lineWidth = .6; c.beginPath(); if (f.vert) { c.moveTo(i + 2.6, 0); c.lineTo(i + 2.6, f.h); } else { c.moveTo(0, i + 2.6); c.lineTo(f.w, i + 2.6); } c.stroke(); }
      const g = c.createLinearGradient(0, 0, f.w, f.h); g.addColorStop(0, 'rgba(255,230,150,.22)'); g.addColorStop(1, 'rgba(60,30,10,.18)'); c.fillStyle = g; c.fillRect(0, 0, f.w, f.h); c.restore(); });

    /* ---- caminos de tierra, borde difuso ---- */
    const tierra = (pts, w) => { const p = jit(pts, .8); trazo(p, w + 6, 'rgba(120,95,45,.35)', 6); trazo(p, w + 2, 'rgba(176,148,88,.8)', 3); trazo(p, w - 1, '#c9b078'); trazo(jit(pts, 1.4), w * .45, 'rgba(236,220,170,.55)', 2);
      for (let i = 0; i < pts.length; i++) for (let k = 0; k < 3; k++) { c.fillStyle = R() < .5 ? 'rgba(110,85,40,.35)' : 'rgba(250,236,190,.4)'; c.fillRect(pts[i][0] + rr(-w / 2, w / 2), pts[i][1] + rr(-w / 2, w / 2), 1.2, 1); } };
    E.camino.forEach(k => { const ps = []; const q = k.pts; for (let i = 1; i < q.length; i++) for (let u = 0; u < 6; u++) ps.push([q[i - 1][0] + (q[i][0] - q[i - 1][0]) * u / 6, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * u / 6]); ps.push(q[q.length - 1]); tierra(ps, 10); });

    /* ---- río: orilla húmeda, agua, reflejos ---- */
    { const a = RIO_W, ry = rio;
      const banda = (d, col, bl) => { c.save(); c.fillStyle = col; if (bl) { c.shadowColor = col; c.shadowBlur = bl * S; } c.beginPath(); c.moveTo(-20, ry(-20) - d); c.lineTo(410, ry(410) - d); c.lineTo(410, ry(410) + d); c.lineTo(-20, ry(-20) + d); c.closePath(); c.fill(); c.restore(); };
      banda(a + 12, 'rgba(206,186,128,.8)', 8); banda(a + 5, '#6e7a45', 4); banda(a + 1.5, '#4d5a3a');
      c.save(); c.beginPath(); c.moveTo(-20, ry(-20) - a); c.lineTo(410, ry(410) - a); c.lineTo(410, ry(410) + a); c.lineTo(-20, ry(-20) + a); c.closePath(); c.clip();
      let g = c.createLinearGradient(0, 0, 390, 0); g.addColorStop(0, '#3f7f90'); g.addColorStop(.5, '#4e92a0'); g.addColorStop(1, '#3a7488'); c.fillStyle = g; c.fillRect(-20, 400, 440, 500);
      for (let i = 0; i < 40; i++) { const x = rr(-10, 400), y = ry(x) + rr(-a, a); blob(x, y, rr(10, 26), R() < .5 ? 'hsla(190,45%,62%,A)' : 'hsla(205,50%,30%,A)', .3); }
      c.rotate(0); for (let i = 0; i < 170; i++) { const x = rr(-10, 400), y = ry(x) + rr(-a + 3, a - 3), l = rr(5, 18); c.save(); c.translate(x, y); c.rotate(RIO_ANG * Math.PI / 180); c.strokeStyle = R() < .6 ? `rgba(230,244,236,${rr(.2, .5)})` : `rgba(240,200,130,${rr(.15, .35)})`; c.lineWidth = rr(.6, 1.6); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l / 2, rr(-1.2, 1.2), l, 0); c.stroke(); c.restore(); }
      c.strokeStyle = 'rgba(20,50,60,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, ry(-20) + a - 1); c.lineTo(410, ry(410) + a - 1); c.stroke();
      c.restore(); }
    /* muelle y puente */
    const tabla = (r, base) => { sombra(4, 3, 4, .5); wob(r.x, r.y, r.w, r.h, .4); c.fillStyle = base; c.fill(); nosombra(); c.save(); c.clip(); const v = r.h > r.w; for (let i = 0; i < (v ? r.h : r.w); i += 2.6) { c.fillStyle = `rgba(${R() < .5 ? '60,35,12' : '230,190,120'},.28)`; if (v) c.fillRect(r.x, r.y + i, r.w, .8); else c.fillRect(r.x + i, r.y, .8, r.h); } c.restore(); };
    tabla(E.muelle.quay, '#a97b44'); tabla(E.muelle.pier, '#9a6d3a');
    E.barcos.forEach(b => { c.save(); c.translate(b.x, b.y); c.rotate(b.rot * Math.PI / 180); const l = b.l, w = b.w; sombra(5, 2, 4, .45);
      c.beginPath(); c.moveTo(-l / 2, -w / 2); c.quadraticCurveTo(0, w / 2 + 3, l / 2, 0); c.quadraticCurveTo(0, -w / 2 - 3, -l / 2, -w / 2); c.fillStyle = '#8b5a2b'; c.fill(); nosombra();
      c.strokeStyle = '#5a3a18'; c.lineWidth = .8; c.stroke(); c.fillStyle = '#b98550'; c.beginPath(); c.ellipse(0, 0, l * .33, w * .26, 0, 0, 7); c.fill();
      if (b.vela) { c.fillStyle = '#f0e2bd'; c.fillRect(-l * .1, -w * .32, l * .22, w * .64); c.strokeStyle = '#b02a22'; c.lineWidth = 1.2; c.strokeRect(-l * .1, -w * .32, l * .22, w * .64); } c.restore(); });
    { const p = E.puente; tabla({ x: p.x - p.w / 2, y: p.y0, w: p.w, h: p.y1 - p.y0 }, '#b08a58'); c.strokeStyle = 'rgba(70,45,20,.6)'; c.lineWidth = 1.6; c.strokeRect(p.x - p.w / 2, p.y0, p.w, p.y1 - p.y0); }

    /* ---- árboles: sombra blanda abajo-derecha, capas de verde, luz arriba-izquierda ---- */
    const arbol = (x, y, r) => { c.save(); c.fillStyle = 'rgba(30,45,15,.34)'; c.shadowColor = 'rgba(30,45,15,.34)'; c.shadowBlur = 5 * S; c.beginPath(); c.ellipse(x + r * .55, y + r * .6, r * .95, r * .8, 0, 0, 7); c.fill(); c.restore();
      const cap = (dx, dy, k, col) => { c.fillStyle = col; c.beginPath(); c.arc(x + dx * r, y + dy * r, r * k, 0, 7); c.fill(); };
      cap(0, 0, 1, '#2f5a2a'); cap(-.1, -.12, .88, '#467a34'); cap(-.2, -.26, .62, '#68a043'); cap(-.3, -.36, .34, '#95c25a');
      for (let i = 0; i < 6; i++) { const a = rr(0, 7), d = rr(.15, .75); cap(Math.cos(a) * d - .1, Math.sin(a) * d - .1, rr(.12, .22), hsl(rr(80, 110), rr(40, 55), rr(26, 52), .65)); } };
    E.arboles.forEach(t => arbol(t.x, t.y, t.r * 1.15));

    /* ---- tejados ---- */
    const tono = (cc) => { const h = 12 + cc * 3 + rr(-5, 6), s = rr(48, 66), l = rr(40, 52); return [hsl(h, s, l + 8), hsl(h, s, l), hsl(h - 3, s, l - 12), hsl(h, s - 8, l - 20)]; };
    function tejas(x, y, w, h, d, vert) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = d; c.lineWidth = .55; c.globalAlpha = .55; c.beginPath();
      if (vert) for (let i = x + 2.4; i < x + w; i += 2.4) { c.moveTo(i, y); c.lineTo(i, y + h); } else for (let i = y + 2.4; i < y + h; i += 2.4) { c.moveTo(x, i); c.lineTo(x + w, i); } c.stroke();
      c.globalAlpha = .22; c.strokeStyle = '#2b1408'; c.beginPath(); for (let i = 0; i < 14; i++) { const px = x + rr(0, w), py = y + rr(0, h); c.moveTo(px, py); c.lineTo(px + (vert ? 0 : rr(-2, 2)), py + (vert ? rr(-2, 2) : 0)); } c.stroke(); c.restore(); }
    const luz = (x, y, w, h, a = .25) => { const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, `rgba(255,225,150,${a})`); g.addColorStop(1, `rgba(50,20,5,${a * .9})`); c.fillStyle = g; c.fillRect(x, y, w, h); };
    function techo(x, y, w, h, cc, sh = true) { const [l, m, d, dd] = tono(cc), vert = h > w; if (sh) sombra(4, 2.5, 3.2, .42); wob(x, y, w, h, .5); c.fillStyle = m; c.fill(); nosombra(); tejas(x, y, w, h, dd, !vert); luz(x, y, w, h, .3);
      c.strokeStyle = l; c.lineWidth = 1.4; c.beginPath(); if (vert) { c.moveTo(x + w / 2 - .6, y + 1); c.lineTo(x + w / 2 - .6, y + h - 1); } else { c.moveTo(x + 1, y + h / 2 - .6); c.lineTo(x + w - 1, y + h / 2 - .6); } c.stroke();
      c.strokeStyle = dd; c.lineWidth = .9; c.beginPath(); if (vert) { c.moveTo(x + w / 2 + .6, y + 1); c.lineTo(x + w / 2 + .6, y + h - 1); } else { c.moveTo(x + 1, y + h / 2 + .6); c.lineTo(x + w - 1, y + h / 2 + .6); } c.stroke(); }
    function choza(h) { const { x, y, r } = h; c.save(); c.fillStyle = 'rgba(50,30,10,.38)'; c.shadowColor = 'rgba(50,30,10,.4)'; c.shadowBlur = 4 * S; c.beginPath(); c.ellipse(x + r * .5, y + r * .65, r, r * .85, 0, 0, 7); c.fill(); c.restore();
      const g = c.createRadialGradient(x - r * .3, y - r * .35, 0, x, y, r * 1.05); g.addColorStop(0, '#f0d27a'); g.addColorStop(.6, '#cfa74e'); g.addColorStop(1, '#8e6a28'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      c.lineWidth = .5; for (let k = 0; k < 26; k++) { const a = k * Math.PI / 13 + rr(-.05, .05); c.strokeStyle = k % 2 ? 'rgba(90,60,15,.5)' : 'rgba(255,235,150,.45)'; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .2, y + Math.sin(a) * r * .2); c.lineTo(x + Math.cos(a) * r * rr(.88, 1), y + Math.sin(a) * r * rr(.88, 1)); c.stroke(); }
      c.strokeStyle = 'rgba(100,70,20,.55)'; c.lineWidth = .6; c.beginPath(); c.arc(x, y, r * .55, 0, 7); c.stroke(); c.fillStyle = '#7a5518'; c.beginPath(); c.arc(x, y, r * .16, 0, 7); c.fill(); }
    function faldon(pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); }
    function atrio(h) { const { x, y, w, h: hh } = h, [l, m, d, dd] = tono(h.c), cx = x + w / 2, cy = y + hh / 2, q = 3.4; sombra(4, 2.5, 3.2, .42); wob(x, y, w, hh, .4); c.fillStyle = m; c.fill(); nosombra();
      faldon([[x, y], [x + w, y], [cx + q, cy - q], [cx - q, cy - q]], l); faldon([[x, y], [cx - q, cy - q], [cx - q, cy + q], [x, y + hh]], l); faldon([[x + w, y], [x + w, y + hh], [cx + q, cy + q], [cx + q, cy - q]], d); faldon([[x, y + hh], [x + w, y + hh], [cx + q, cy + q], [cx - q, cy + q]], d);
      c.save(); c.beginPath(); c.rect(x, y, w, hh); c.clip(); c.strokeStyle = dd; c.lineWidth = .5; c.globalAlpha = .45; c.beginPath(); for (let i = 3; i < Math.max(w, hh); i += 2.6) { c.moveTo(x, y + i); c.lineTo(x + w, y + i); } c.stroke(); c.restore();
      c.strokeStyle = dd; c.lineWidth = .8; c.beginPath(); c.moveTo(x, y); c.lineTo(cx - q, cy - q); c.moveTo(x + w, y); c.lineTo(cx + q, cy - q); c.moveTo(x, y + hh); c.lineTo(cx - q, cy + q); c.moveTo(x + w, y + hh); c.lineTo(cx + q, cy + q); c.stroke();
      c.fillStyle = '#2a2a24'; c.fillRect(cx - q, cy - q, 2 * q, 2 * q); c.fillStyle = '#5aa0b4'; c.fillRect(cx - q + .8, cy - q + .8, 2 * q - 1.6, 2 * q - 1.6); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(cx - q + 1, cy - q + 1, 2, 1.2); luz(x, y, w, hh, .2); }
    function insula(h) { const { x, y, w, h: hh } = h, [l, m, d, dd] = tono(h.c); sombra(7, 5, 6, .5); c.fillStyle = '#e8d6a8'; c.fillRect(x + 3, y + 4, w, hh); nosombra();
      c.fillStyle = '#cdb584'; c.fillRect(x + 3, y + hh + 3, w, 4.5); c.fillStyle = '#a9915f'; c.fillRect(x + w + 3, y + 5, 3.5, hh); for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(60,35,15,.65)'; c.fillRect(x + 6 + i * 4, y + hh + 4.5, 1.6, 2.2); }
      c.fillStyle = m; c.fillRect(x, y + 1, w, hh - 1); tejas(x, y + 1, w, hh - 1, dd, true); c.fillStyle = l; c.fillRect(x, y + 1, w, 2); luz(x, y, w, hh, .3);
      c.strokeStyle = dd; c.lineWidth = 1; c.strokeRect(x + .5, y + 1.5, w - 1, hh - 2); c.fillStyle = '#e6c98a'; c.fillRect(x + w * .3, y + hh * .35, w * .4, hh * .3); c.strokeStyle = 'rgba(60,30,10,.5)'; c.lineWidth = .6; c.strokeRect(x + w * .3, y + hh * .35, w * .4, hh * .3);
      for (let k = 0; k < 3; k++) { c.fillStyle = R() < .5 ? '#f4efe0' : '#c9a14a'; c.fillRect(x + 4 + k * 8, y + hh - 5, 5, 1.6); } }
    function rica(h) { const { x, y, w, h: hh } = h, [l, m, d, dd] = tono(h.c), i = 9, ix = x + i, iy = y + 7, iw = w - 2 * i, ih = hh - 14; sombra(6, 3.5, 4.5, .45); c.fillStyle = '#efe0b8'; c.fillRect(x, y, w, hh); nosombra();
      c.fillStyle = m; c.beginPath(); c.rect(x, y, w, hh); c.rect(ix, iy, iw, ih); c.fill('evenodd'); c.save(); c.beginPath(); c.rect(x, y, w, hh); c.rect(ix, iy, iw, ih); c.clip('evenodd'); tejas(x, y, w, hh, dd, false); c.restore();
      c.strokeStyle = l; c.lineWidth = 1; c.strokeRect(x + 3.5, y + 3.5, w - 7, hh - 7); luz(x, y, w, hh, .22);
      c.fillStyle = '#6f9a45'; c.fillRect(ix, iy, iw, ih); blob(ix + iw / 2, iy + ih / 2, iw * .6, 'hsla(95,45%,60%,A)', .5); c.fillStyle = '#5aa0b4'; c.beginPath(); c.ellipse(ix + iw / 2, iy + ih / 2, 3.4, 2.4, 0, 0, 7); c.fill(); c.strokeStyle = '#d9cba5'; c.lineWidth = .7; c.stroke();
      for (let k = 0; k <= 4; k++) { const px = ix + 1.5 + k * (iw - 3) / 4; [iy + 1.3, iy + ih - 1.3].forEach(py => { c.fillStyle = 'rgba(40,25,10,.35)'; c.fillRect(px, py, 1.7, 1.7); c.fillStyle = '#fbf3da'; c.beginPath(); c.arc(px, py, 1, 0, 7); c.fill(); }); }
      c.strokeStyle = '#8a6c3a'; c.lineWidth = .5; c.strokeRect(ix, iy, iw, ih); if (R() < .6) anfora(ix + iw - 2.5, iy + ih - 2.5); }
    function anfora(x, y) { c.save(); c.shadowColor = 'rgba(40,20,5,.5)'; c.shadowBlur = 2 * S; c.shadowOffsetX = 1 * S; c.shadowOffsetY = 1.2 * S; c.fillStyle = '#b8683a'; c.beginPath(); c.ellipse(x, y, 1.5, 2.1, .3, 0, 7); c.fill(); c.restore(); c.fillStyle = '#e0a070'; c.beginPath(); c.ellipse(x - .4, y - .6, .6, .8, 0, 0, 7); c.fill(); c.fillStyle = '#3a2210'; c.beginPath(); c.arc(x, y, .5, 0, 7); c.fill(); }
    function lena(x, y) { for (let k = 0; k < 5; k++) { const px = x + (k % 3) * 1.9 - 2, py = y - (k > 2 ? 1.6 : 0); c.strokeStyle = k % 2 ? '#7a4c22' : '#5a3512'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(px - 2.2, py); c.lineTo(px + 2.2, py + .3); c.stroke(); c.fillStyle = '#c9965a'; c.beginPath(); c.arc(px + 2.2, py + .3, .8, 0, 7); c.fill(); } }
    function hoguera(x, y) { blob(x, y, 11, 'rgba(255,150,40,A)', .55); c.strokeStyle = '#4a2a10'; c.lineWidth = 1.3; for (let k = 0; k < 4; k++) { const a = k * 1.6; c.beginPath(); c.moveTo(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6); c.lineTo(x - Math.cos(a) * 2.6, y - Math.sin(a) * 2.6); c.stroke(); }
      c.fillStyle = '#f08a22'; c.beginPath(); c.ellipse(x, y - .6, 1.7, 2.4, 0, 0, 7); c.fill(); c.fillStyle = '#ffe58a'; c.beginPath(); c.ellipse(x, y - .2, .8, 1.3, 0, 0, 7); c.fill(); humo.push([x, y]); }
    const humo = [];
    function publico(p) { const { x, y, w, h, tipo } = p; sombra(5, 3, 4, .45);
      if (tipo === 'granero') { wob(x, y, w, h, .5); c.fillStyle = '#c9a05a'; c.fill(); nosombra(); tejas(x, y, w, h, '#6e4c1e', true); luz(x, y, w, h, .3); c.strokeStyle = '#6e4c1e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + w / 2, y + 1); c.lineTo(x + w / 2, y + h - 1); c.stroke(); for (let k = 0; k < 3; k++) { c.fillStyle = '#e0b860'; c.beginPath(); c.arc(x + 8 + k * 8, y + h + 3, 2.2, 0, 7); c.fill(); } }
      else if (tipo === 'almacen') { wob(x, y + 3, w, h - 6, .4); c.fillStyle = '#8f6c46'; c.fill(); nosombra(); tejas(x, y + 3, w, h - 6, '#4a3018', true); luz(x, y + 3, w, h - 6, .3); c.strokeStyle = '#4a3018'; c.lineWidth = 1; c.strokeRect(x + .5, y + 3.5, w - 1, h - 7); for (let k = 0; k < 4; k++) { anfora(x + 5 + k * 7, y + h - 1); } }
      else if (tipo === 'cuartel') { wob(x, y, w, h, .5); c.fillStyle = '#e8d8ac'; c.fill(); nosombra(); c.strokeStyle = '#8c7f60'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#b6955a'; c.fillRect(x + 4, y + 4, w - 8, h - 8); c.fillStyle = '#d9b97a'; c.fillRect(x + 7, y + 7, w - 14, h - 14); c.fillStyle = '#b02a22'; c.fillRect(x + w / 2 - 1, y + 5, 7, 4); c.fillStyle = '#4a2a10'; c.fillRect(x + w / 2 - 1.5, y + 4, 1.2, 12); hoguera(x + 8, y + h - 8); }
      else { wob(x, y, w, h, .5); c.fillStyle = '#eadcb4'; c.fill(); nosombra(); c.strokeStyle = '#8c7f60'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#c9654a'; c.fillRect(x + 3, y + 3, w - 6, 10); tejas(x + 3, y + 3, w - 6, 10, '#7a3019', false); c.fillStyle = '#5aa0b4'; c.fillRect(x + 4, y + 16, w - 8, h - 20); c.strokeStyle = '#fff'; c.globalAlpha = .4; c.lineWidth = .6; c.beginPath(); c.moveTo(x + 6, y + 20); c.lineTo(x + w - 8, y + 20); c.stroke(); c.globalAlpha = 1; } nosombra(); }

    /* ---- suelo de la ciudad y calles ---- */
    c.save(); c.shadowColor = 'rgba(60,40,15,.55)'; c.shadowBlur = 10 * S; c.fillStyle = '#c9b682'; c.beginPath(); c.ellipse(CX, CY, RX + 6, RY + 6, 0, 0, 7); c.fill(); c.restore();
    c.save(); c.beginPath(); c.ellipse(CX, CY, RX, RY, 0, 0, 7); c.clip(); c.fillStyle = '#d8c690'; c.fillRect(0, 0, 390, 844);
    for (let i = 0; i < 90; i++) blob(rr(30, 360), rr(130, 590), rr(14, 40), R() < .5 ? 'hsla(40,35%,70%,A)' : 'hsla(30,30%,52%,A)', .25);
    E.calles.forEach(cl => { const ps = ptsCalle(cl), w = cl.ancho; if (cl.tipo === 'tierra') tierra(ps, w); else { trazo(ps, w + 3, 'rgba(110,95,60,.4)', 3); trazo(ps, w + 1, '#9d9174'); trazo(ps, w - 1, '#c3b898'); const p2 = jit(ps, .5); trazo(p2, w * .5, 'rgba(240,232,205,.5)', 1.5); for (let i = 0; i < ps.length; i++) { c.fillStyle = 'rgba(90,80,55,.4)'; c.fillRect(ps[i][0] + rr(-w / 2, w / 2), ps[i][1] + rr(-w / 2, w / 2), 1.6, 1); } } });
    /* huertos y jardines */
    E.huertos.forEach(h => { wob(h.x, h.y, h.w, h.h, .6); c.fillStyle = '#7f9f45'; c.fill(); c.save(); c.clip(); for (let i = 2; i < h.h; i += 3.2) { c.strokeStyle = i % 6 < 3 ? 'rgba(60,40,15,.55)' : 'rgba(150,200,80,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(h.x, h.y + i); c.lineTo(h.x + h.w, h.y + i); c.stroke(); } for (let k = 0; k < 30; k++) { c.fillStyle = '#4c7a2a'; c.beginPath(); c.arc(h.x + rr(2, h.w - 2), h.y + rr(2, h.h - 2), 1.1, 0, 7); c.fill(); } c.restore(); });
    E.jardines.forEach(h => { wob(h.x, h.y, h.w, h.h, .6); c.fillStyle = '#d9c996'; c.fill(); wob(h.x + 2, h.y + 2, h.w - 4, h.h - 4, .5); c.fillStyle = '#76a24a'; c.fill(); blob(h.x + 12, h.y + 12, 14, 'hsla(90,50%,65%,A)', .5); for (let k = 0; k < 8; k++) arbol(h.x + rr(5, h.w - 5), h.y + rr(5, h.h - 5), rr(1.8, 3)); });
    /* casas */
    E.casas.forEach(h => { if (h.tipo === 'choza') choza(h); else if (h.tipo === 'atrio') atrio(h); else if (h.tipo === 'insula') insula(h); else rica(h); });
    E.publicos.forEach(publico);
    /* vida: leña, hogueras, ánforas junto a las casas */
    E.casas.forEach((h, i) => { if (h.tipo === 'choza') { if (i % 6 === 0) hoguera(h.x + h.r + 4, h.y + 2); else if (i % 4 === 1) lena(h.x - h.r - 3, h.y + h.r); }
      else if (h.tipo === 'atrio' && i % 3 === 0) { anfora(h.x - 1.5, h.y + h.h * .5); } else if (h.tipo === 'insula' && i % 5 === 0) lena(h.x + 6, h.y + h.h + 9); });
    /* foro */
    const fx = foro.x, fy = foro.y, fw = foro.w, fh = foro.h, cu = foro.curia, co = foro.comicio, te = foro.templo, pr = te.porche, fu = foro.fuente;
    sombra(4, 1, 2, .4); c.fillStyle = '#a99a74'; c.fillRect(fx - 4, fy - 4, fw + 8, fh + 8); nosombra(); c.fillStyle = '#e6dbbd'; c.fillRect(fx, fy, fw, fh); c.fillRect(fx, fy, fw, fh);
    blob(fx + 50, fy + 30, 70, 'rgba(255,245,215,A)', .5); c.strokeStyle = 'rgba(120,105,70,.35)'; c.lineWidth = .5; c.beginPath(); for (let i = 0; i < fw; i += 8) { c.moveTo(fx + i, fy); c.lineTo(fx + i, fy + fh); } for (let i = 0; i < fh; i += 8) { c.moveTo(fx, fy + i); c.lineTo(fx + fw, fy + i); } c.stroke();
    foro.columnas.forEach(([x, y]) => { c.fillStyle = 'rgba(50,30,10,.4)'; c.beginPath(); c.arc(x + 1.3, y + 1.6, 2.2, 0, 7); c.fill(); const g = c.createRadialGradient(x - .6, y - .6, 0, x, y, 2.4); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#c9b98e'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); });
    /* curia */
    sombra(5, 3, 4, .45); c.fillStyle = '#e8d6a4'; c.fillRect(cu.x, cu.y, cu.w, cu.h); nosombra(); c.strokeStyle = '#7e6a40'; c.lineWidth = 1; c.strokeRect(cu.x, cu.y, cu.w, cu.h);
    c.fillStyle = '#b5593a'; c.fillRect(cu.x + 3, cu.y + 3, cu.w - 6, cu.h - 9); tejas(cu.x + 3, cu.y + 3, cu.w - 6, cu.h - 9, '#6e2c14', false); luz(cu.x + 3, cu.y + 3, cu.w - 6, cu.h - 9, .3); c.fillStyle = '#7a3019'; c.fillRect(cu.x + 3, cu.y + (cu.h - 9) / 2 + 2, cu.w - 6, 1.4); for (let k = 0; k < 5; k++) { c.fillStyle = '#fbf3da'; c.beginPath(); c.arc(cu.x + 6 + k * (cu.w - 12) / 4, cu.y + cu.h - 3, 1.4, 0, 7); c.fill(); }
    /* comicio */
    sombra(5, 3, 3.5, .45); c.fillStyle = '#d9c9a0'; c.beginPath(); c.arc(co.x, co.y, co.r + 1, 0, 7); c.fill(); nosombra();
    for (let i = 0; i < co.gradas; i++) { const r = co.r - i * 3.8, g = c.createRadialGradient(co.x - r * .4, co.y - r * .4, 0, co.x, co.y, r); g.addColorStop(0, i % 2 ? '#efe3c4' : '#fff6dc'); g.addColorStop(1, i % 2 ? '#c8b78e' : '#d8c9a2'); c.fillStyle = g; c.beginPath(); c.arc(co.x, co.y, r, 0, 7); c.fill(); c.strokeStyle = 'rgba(110,90,55,.6)'; c.lineWidth = .7; c.stroke(); }
    c.fillStyle = '#c9a85a'; c.beginPath(); c.arc(co.x, co.y, 3.2, 0, 7); c.fill();
    /* templo */
    sombra(6, 4, 4.5, .5); c.fillStyle = '#e1d6b6'; c.fillRect(te.x - 2, te.y - 2, te.w + 4, te.h + 14); nosombra(); c.strokeStyle = '#8f7f55'; c.lineWidth = 1; c.strokeRect(te.x - 2, te.y - 2, te.w + 4, te.h + 14);
    c.fillStyle = '#c0613b'; c.fillRect(te.x + 4, te.y + 3, te.w - 8, te.h - 4); tejas(te.x + 4, te.y + 3, te.w - 8, te.h - 4, '#6e2c14', true); luz(te.x + 4, te.y + 3, te.w - 8, te.h - 4, .3); c.strokeStyle = '#7a3019'; c.lineWidth = 2; c.beginPath(); c.moveTo(te.x + te.w / 2, te.y + 3); c.lineTo(te.x + te.w / 2, te.y + te.h - 1); c.stroke();
    c.fillStyle = '#f0e0bd'; c.beginPath(); c.moveTo(te.x + 4, te.y + te.h - 1); c.lineTo(te.x + te.w / 2, te.y + te.h - 8); c.lineTo(te.x + te.w - 4, te.y + te.h - 1); c.closePath(); c.fill(); c.strokeStyle = '#7a3019'; c.lineWidth = .9; c.stroke();
    for (let i = 0; i < 4; i++) { const x = te.x + 8 + i * (te.w - 16) / 3, y = pr.y + 2; c.fillStyle = 'rgba(50,30,10,.4)'; c.beginPath(); c.arc(x + 1.3, y + 1.5, 2.2, 0, 7); c.fill(); c.fillStyle = '#fbf3da'; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); c.strokeStyle = '#a89868'; c.lineWidth = .5; c.stroke(); }
    c.strokeStyle = 'rgba(130,115,80,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(pr.x, pr.y + 7); c.lineTo(pr.x + pr.w, pr.y + 7); c.moveTo(pr.x + 2, pr.y + 9); c.lineTo(pr.x + pr.w - 2, pr.y + 9); c.stroke();
    c.fillStyle = '#c7baa0'; c.beginPath(); c.arc(fu.x, fu.y, fu.r + 1.5, 0, 7); c.fill(); c.fillStyle = '#5aa6bd'; c.beginPath(); c.arc(fu.x, fu.y, fu.r - .5, 0, 7); c.fill(); c.fillStyle = '#e8f6f8'; c.beginPath(); c.arc(fu.x - 1, fu.y - 1, 1.6, 0, 7); c.fill();
    /* mercado */
    sombra(4, 1.5, 2, .4); c.fillStyle = '#b3a37a'; c.fillRect(mercado.x - 2, mercado.y - 2, mercado.w + 4, mercado.h + 4); nosombra(); c.fillStyle = '#e4d4a6'; c.fillRect(mercado.x, mercado.y, mercado.w, mercado.h);
    mercado.puestos.forEach(p => { sombra(3, 2, 2.5, .45); c.fillStyle = p.color; c.fillRect(p.x, p.y, p.w, p.h); nosombra(); c.fillStyle = 'rgba(245,236,210,.85)'; for (let i = 0; i < p.w; i += 3.7) c.fillRect(p.x + i, p.y, 1.9, p.h); luz(p.x, p.y, p.w, p.h, .3); c.fillStyle = '#7e5a2c'; c.fillRect(p.x, p.y + p.h + 1, p.w, 2.5); [0, 1, 2].forEach(k => anfora(p.x + 2 + k * 3.3, p.y + p.h + 5.5)); });
    c.restore();

    /* ---- muralla de sillar ---- */
    const ell = (st, w, rx = RX, ry = RY, dash) => { c.strokeStyle = st; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.ellipse(CX, CY, rx, ry, 0, 0, 7); c.stroke(); c.setLineDash([]); };
    c.save(); c.shadowColor = 'rgba(40,25,8,.6)'; c.shadowBlur = 7 * S; c.shadowOffsetX = 2.5 * S; c.shadowOffsetY = 3.5 * S; ell('#b9ab84', 9); c.restore();
    ell('#b9ab84', 9); ell('#8d8062', 7.5, RX, RY, [4.5, 1.2]); ell('rgba(255,245,215,.55)', 2, RX - 2.5, RY - 2.5); ell('rgba(70,55,30,.45)', 1.2, RX + 3.8, RY + 3.8);
    muralla.torres.forEach(t => { c.save(); c.translate(t.x, t.y); c.rotate(t.ang * Math.PI / 180); sombra(4, 2.5, 3.5, .5); c.fillStyle = '#b9ab84'; c.fillRect(-6.5, -6.5, 13, 13); nosombra(); c.strokeStyle = '#6f6445'; c.lineWidth = 1; c.strokeRect(-6.5, -6.5, 13, 13); c.fillStyle = '#d3c7a2'; c.fillRect(-4, -4, 8, 8); c.fillStyle = 'rgba(255,255,230,.5)'; c.fillRect(-4, -4, 8, 2); c.restore(); });
    muralla.puertas.forEach(p => { const hz = p.ang === 0, w = hz ? 24 : 12, h = hz ? 12 : 24; sombra(4, 2.5, 3.5, .5); c.fillStyle = '#b9ab84'; c.fillRect(p.x - w / 2, p.y - h / 2, w, h); nosombra(); c.strokeStyle = '#6f6445'; c.lineWidth = 1; c.strokeRect(p.x - w / 2, p.y - h / 2, w, h); c.fillStyle = '#5e4a2a'; if (hz) c.fillRect(p.x - 5, p.y - 6, 10, 12); else c.fillRect(p.x - 6, p.y - 5, 12, 10); });
    E.carros.forEach(k => { c.save(); c.translate(k.x, k.y); c.rotate(k.rot * Math.PI / 180); sombra(3, 1.5, 2, .5); c.fillStyle = '#8a5a22'; c.fillRect(-6, -3.5, 13, 7); nosombra(); c.strokeStyle = '#3b2410'; c.lineWidth = .8; c.strokeRect(-6, -3.5, 13, 7); c.fillStyle = '#d9b968'; c.fillRect(-4.5, -2.2, 8, 4.4); c.restore(); });
    c.save(); E.gente.forEach(g => { c.fillStyle = 'rgba(40,25,8,.4)'; c.beginPath(); c.ellipse(g.x + .9, g.y + 1.1, 1.7, 1.2, 0, 0, 7); c.fill(); c.fillStyle = g.c; c.beginPath(); c.arc(g.x, g.y, 1.7, 0, 7); c.fill(); c.fillStyle = '#c99a6a'; c.beginPath(); c.arc(g.x - .3, g.y - .5, .9, 0, 7); c.fill(); }); c.restore();
    /* flores puntuales */
    flores.forEach(([x, y, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, .9, 0, 7); c.arc(x + 2, y + 1, .8, 0, 7); c.arc(x - 1.5, y + 1.8, .8, 0, 7); c.fill(); });
    /* humo tenue de las hogueras */
    humo.forEach(([x, y]) => { for (let k = 0; k < 6; k++) blob(x + k * 2.2 + rr(-1, 1), y - 5 - k * 4.5, 3 + k * 1.6, 'rgba(225,215,200,A)', .3 - k * .035); });

    /* ---- pasada de pincel: suaviza como gouache ---- */
    try { const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; t.getContext('2d').drawImage(cv, 0, 0);
      if ('filter' in c) { c.setTransform(1, 0, 0, 1, 0, 0); c.save(); c.filter = 'blur(1.1px)'; c.globalAlpha = .55; c.drawImage(t, 0, 0); c.restore(); c.setTransform(S, 0, 0, S, 0, 0); } } catch (e) { }
    /* luz cálida de tarde, grano de papel y viñeta */
    c.globalCompositeOperation = 'multiply'; let g = c.createLinearGradient(0, 0, 390, 844); g.addColorStop(0, 'rgba(255,238,200,1)'); g.addColorStop(1, 'rgba(238,190,140,1)'); c.fillStyle = g; c.fillRect(0, 0, 390, 844);
    c.globalCompositeOperation = 'screen'; g = c.createRadialGradient(60, 80, 0, 60, 80, 420); g.addColorStop(0, 'rgba(255,190,100,.22)'); g.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = g; c.fillRect(0, 0, 390, 844);
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 5000; i++) { c.fillStyle = R() < .5 ? 'rgba(60,35,10,.07)' : 'rgba(255,245,215,.09)'; c.fillRect(rr(0, 390), rr(0, 844), rr(.5, 1.5), rr(.5, 1.5)); }
    for (let i = 0; i < 70; i++) { c.strokeStyle = R() < .5 ? 'rgba(255,240,200,.05)' : 'rgba(80,50,20,.04)'; c.lineWidth = rr(2, 6); const x = rr(0, 390), y = rr(0, 844); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rr(20, 60), y + rr(10, 40)); c.stroke(); }
    g = c.createRadialGradient(195, 422, 230, 195, 422, 520); g.addColorStop(0, 'rgba(40,20,5,0)'); g.addColorStop(1, 'rgba(40,20,5,.42)'); c.fillStyle = g; c.fillRect(0, 0, 390, 844);
    return Math.round(performance.now() - t0);
  }
  window.dibujarCiudad = dibujarCiudad;
})();
