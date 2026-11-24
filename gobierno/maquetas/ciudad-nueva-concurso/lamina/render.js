/* Estilo «Mapa antiguo ilustrado»: pergamino, tinta sepia, rayado, tres aguadas, alzados pequeños de los edificios principales. Canvas 2D, semilla fija. */
(function () {
  const S = 2;
  let seed = 1899; const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * R();
  const TINTA = '#4a3320', PAPEL = '#e9dab0', TEJA = '#c4694a', OLIVA = '#8f9a4e', AZUL = '#7f9aa3';
  const SERIF = "Georgia,'Palatino Linotype','Times New Roman',serif";
  function dibujarCiudad(E, el) {
    const t0 = performance.now();
    const { CX, CY, RX, RY, rio, RIO_W, RIO_ANG, foro, mercado, muralla } = E;
    const cv = document.createElement('canvas'); cv.width = 390 * S; cv.height = 844 * S; el.appendChild(cv);
    const c = cv.getContext('2d'); c.setTransform(S, 0, 0, S, 0, 0); c.lineCap = c.lineJoin = 'round';
    const tinta = (a = 1, w = .7) => { c.strokeStyle = TINTA; c.globalAlpha = a; c.lineWidth = w; };
    const reset = () => { c.globalAlpha = 1; c.setLineDash([]); };
    const wob = (x, y, w, h, j = .35) => { const p = (a, b) => [a + rr(-j, j), b + rr(-j, j)]; const q = [p(x, y), p(x + w, y), p(x + w, y + h), p(x, y + h)]; c.beginPath(); q.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath(); };
    const poly = (pts) => { c.beginPath(); pts.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath(); };
    const lav = (col, a) => { c.fillStyle = col; c.globalAlpha = a; c.fill(); c.globalAlpha = 1; };            // aguada: color suave sobre la ruta actual
    function hatch(clipFn, ang, sp, w, a = .6, ox = 0) { c.save(); clipFn(); c.clip(); c.translate(CX, CY); c.rotate(ang); tinta(a, w); c.beginPath(); for (let d = -300 + ox; d < 300; d += sp) { c.moveTo(-320, d); c.lineTo(320, d + rr(-.3, .3)); } c.stroke(); c.restore(); }
    const hatchRect = (x, y, w, h, ang, sp, lw, a) => hatch(() => { c.beginPath(); c.rect(x, y, w, h); }, ang, sp, lw, a);
    function rotulo(txt, x, y, tam = 6.5, halo = true, col = TINTA) { c.save(); c.font = `bold ${tam}px ${SERIF}`; try { c.letterSpacing = (tam * .18) + 'px'; } catch (e) { } c.textAlign = 'center'; c.textBaseline = 'middle'; if (halo) { c.strokeStyle = PAPEL; c.lineWidth = 2.6; c.globalAlpha = .9; c.strokeText(txt, x, y); } c.globalAlpha = 1; c.fillStyle = col; c.fillText(txt, x, y); c.restore(); }

    /* ---- papel: grano, fibras, manchas ---- */
    c.fillStyle = PAPEL; c.fillRect(0, 0, 390, 844);
    for (let i = 0; i < 26; i++) { const x = rr(0, 390), y = rr(0, 844), r = rr(30, 110), g = c.createRadialGradient(x, y, 0, x, y, r); const o = R() < .5; g.addColorStop(0, o ? 'rgba(150,110,50,.13)' : 'rgba(255,248,215,.25)'); g.addColorStop(1, 'rgba(150,110,50,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (let i = 0; i < 1800; i++) { c.strokeStyle = R() < .6 ? 'rgba(120,85,40,.1)' : 'rgba(255,250,225,.22)'; c.lineWidth = .5; const x = rr(0, 390), y = rr(0, 844), a = rr(0, 6.3), l = rr(2, 8); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
    for (let i = 0; i < 28; i++) { const x = rr(0, 390), y = rr(0, 844), r = rr(1, 3.5), g = c.createRadialGradient(x, y, 0, x, y, r * 2.4); g.addColorStop(0, 'rgba(140,85,30,.28)'); g.addColorStop(1, 'rgba(140,85,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, 7); c.fill(); }

    /* ---- campos: surcos de tinta, algo de aguada oliva ---- */
    E.campos.forEach(f => { c.save(); c.translate(f.x + f.w / 2, f.y + f.h / 2); c.rotate(f.rot * Math.PI / 180); c.translate(-f.w / 2, -f.h / 2); wob(0, 0, f.w, f.h, .6); if (f.col !== 1) lav(OLIVA, .22); tinta(.8, .8); c.stroke(); c.save(); c.clip(); tinta(.5, .45); c.beginPath(); const n = f.vert ? f.w : f.h; for (let i = 2.2; i < n; i += 2.6) { if (f.vert) { c.moveTo(i, 0); c.lineTo(i + rr(-.3, .3), f.h); } else { c.moveTo(0, i); c.lineTo(f.w, i + rr(-.3, .3)); } } c.stroke(); c.restore(); reset(); c.restore(); });
    /* hierba: matas de tinta sueltas */
    for (let i = 0; i < 160; i++) { const x = rr(0, 390), y = rr(0, 844); if (E.dentro(x, y, -4) || Math.abs(y - rio(x)) < RIO_W + 12) continue; tinta(.5, .5); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.2, y - 2.6); c.moveTo(x, y); c.lineTo(x + .2, y - 3); c.moveTo(x, y); c.lineTo(x + 1.3, y - 2.4); c.stroke(); } reset();
    /* caminos: dos líneas paralelas finas */
    const ptsC = q => { const o = []; for (let i = 1; i < q.length; i++) for (let u = 0; u < 6; u++) o.push([q[i - 1][0] + (q[i][0] - q[i - 1][0]) * u / 6, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * u / 6]); o.push(q[q.length - 1]); return o; };
    E.camino.forEach(k => { const p = ptsC(k.pts); [-4.5, 4.5].forEach(off => { tinta(.7, .6); c.setLineDash([5, 1.4, 2, 1.4]); c.beginPath(); p.forEach((v, i) => { const [nx, ny] = i < p.length - 1 ? [p[i + 1][1] - v[1], -(p[i + 1][0] - v[0])] : [0, 0]; const l = Math.hypot(nx, ny) || 1; const X = v[0] + nx / l * off + rr(-.3, .3), Y = v[1] + ny / l * off; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); reset(); }); });

    /* ---- río: aguada azul gris, orillas de tinta, ondas ---- */
    { const a = RIO_W, ry = rio; const borde = d => { const o = []; for (let x = -20; x <= 410; x += 10) o.push([x, ry(x) + d + Math.sin(x / 17) * 1.2]); return o; };
      const top = borde(-a), bot = borde(a); poly(top.concat(bot.slice().reverse())); lav(AZUL, .55); c.save(); c.clip();
      for (let i = 0; i < 90; i++) { const x = rr(-10, 400), y = ry(x) + rr(-a + 4, a - 4); tinta(.5, .55); c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 4, y - 2.2, x + 8, y + 2.2, x + 12, y); c.stroke(); }
      hatch(() => poly(top.concat(bot.slice().reverse())), RIO_ANG * Math.PI / 180, 4.2, .35, .25); c.restore(); reset();
      [top, bot].forEach(b => { tinta(.9, 1); c.beginPath(); b.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.stroke(); tinta(.6, .5); c.beginPath(); b.forEach((v, i) => { const y = v[1] + (b === top ? -2.8 : 2.8); i ? c.lineTo(v[0], y) : c.moveTo(v[0], y); }); c.stroke(); }); reset(); }
    /* muelle y puente (planta) */
    const tabla = (r) => { wob(r.x, r.y, r.w, r.h, .3); c.fillStyle = PAPEL; c.fill(); tinta(.9, .8); c.stroke(); tinta(.6, .5); c.beginPath(); const v = r.h > r.w; for (let i = 2.5; i < (v ? r.h : r.w); i += 2.5) { if (v) { c.moveTo(r.x, r.y + i); c.lineTo(r.x + r.w, r.y + i); } else { c.moveTo(r.x + i, r.y); c.lineTo(r.x + i, r.y + r.h); } } c.stroke(); reset(); };
    tabla(E.muelle.quay); tabla(E.muelle.pier);
    { const p = E.puente; tabla({ x: p.x - p.w / 2, y: p.y0, w: p.w, h: p.y1 - p.y0 }); for (let k = 0; k < 3; k++) { const y = p.y0 + 8 + k * (p.y1 - p.y0 - 16) / 2; tinta(.8, .7); c.beginPath(); c.arc(p.x, y, 3, Math.PI, 0); c.moveTo(p.x - p.w / 2 - 2, y); c.lineTo(p.x - p.w / 2, y); c.moveTo(p.x + p.w / 2, y); c.lineTo(p.x + p.w / 2 + 2, y); c.stroke(); } reset(); }
    /* barquitos de perfil en el río, con remos y vela */
    E.barcos.forEach(b => { c.save(); c.translate(b.x, b.y); c.rotate(b.rot * Math.PI / 180); const l = b.l * .95, k = l / 40; c.scale(k, k);
      tinta(.5, .6); c.beginPath(); for (let i = -4; i < 5; i++) { c.moveTo(-20 + i * 6, 7); c.quadraticCurveTo(-18 + i * 6, 5.5, -16 + i * 6, 7); } c.stroke();
      c.beginPath(); c.moveTo(-20, -2); c.quadraticCurveTo(-10, 8, 0, 8); c.quadraticCurveTo(12, 8, 22, -5); c.quadraticCurveTo(10, -1, -20, -2); c.closePath(); c.fillStyle = PAPEL; c.fill(); tinta(1, 1); c.stroke(); hatch(() => { c.beginPath(); c.rect(-22, 1, 46, 8); }, .3, 1.6, .45, .55);
      tinta(1, 1); c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -22); c.stroke(); if (b.vela) { c.beginPath(); c.moveTo(0, -21); c.quadraticCurveTo(10, -15, 2, -4); c.lineTo(0, -4); c.closePath(); c.fillStyle = PAPEL; c.fill(); tinta(1, .8); c.stroke(); hatch(() => { c.beginPath(); c.rect(0, -22, 12, 20); }, 1.2, 1.6, .4, .5); }
      tinta(.9, .7); c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(i * 6, 2); c.lineTo(i * 6 - 4, 11); } c.stroke(); c.restore(); }); reset();

    /* ---- árboles: círculos de tinta de trazo nervioso ---- */
    const arbol = (x, y, r) => { c.beginPath(); const n = 11; for (let i = 0; i <= n; i++) { const a = i / n * 6.283, rad = r * rr(.86, 1.08); const X = x + Math.cos(a) * rad, Y = y + Math.sin(a) * rad; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.fillStyle = PAPEL; c.fill(); if (R() < .45) lav(OLIVA, .28); tinta(.95, .75); c.stroke();
      tinta(.55, .5); c.beginPath(); c.arc(x, y, r * .95, .2, 1.5); c.stroke(); reset(); };
    E.arboles.forEach(t => arbol(t.x, t.y, t.r * 1.05));

    /* ---- piezas de dibujo de los tejados ---- */
    const sombraH = (x, y, w, h, d = 4) => hatch(() => { c.beginPath(); c.rect(x + d, y + d, w, h); }, -.8, 1.7, .4, .5);
    const caja = (x, y, w, h, wash = TEJA, a = .4) => { wob(x, y, w, h); c.fillStyle = PAPEL; c.fill(); if (wash) lav(wash, a); tinta(1, .85); c.stroke(); reset(); };
    function casaRural(r) { sombraH(r.x, r.y, r.w, r.h, 2); caja(r.x, r.y, r.w, r.h); hatchRect(r.x, r.y, r.w, r.h, 0, 1.6, .4, .6); }
    function choza(h) { const { x, y, r } = h; c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = PAPEL; c.fill(); tinta(1, .9); c.stroke(); tinta(.7, .45); c.beginPath(); for (let k = 0; k < 18; k++) { const a = k * Math.PI / 9; c.moveTo(x + Math.cos(a) * r * .22, y + Math.sin(a) * r * .22); c.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95); } c.stroke(); tinta(.9, .7); c.beginPath(); c.arc(x, y, r * .2, 0, 7); c.stroke(); reset(); }
    function atrio(h) { const { x, y, w, h: hh } = h, cx = x + w / 2, cy = y + hh / 2, q = 3.2; sombraH(x, y, w, hh, 3); caja(x, y, w, hh);
      const fal = [[[x, y], [x + w, y], [cx + q, cy - q], [cx - q, cy - q]], [[x, y], [cx - q, cy - q], [cx - q, cy + q], [x, y + hh]], [[x + w, y], [x + w, y + hh], [cx + q, cy + q], [cx + q, cy - q]], [[x, y + hh], [x + w, y + hh], [cx + q, cy + q], [cx - q, cy + q]]];
      const ang = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]; fal.forEach((p, i) => hatch(() => poly(p), ang[i], 1.7, .4, .65)); tinta(.9, .6); c.beginPath(); c.moveTo(x, y); c.lineTo(cx - q, cy - q); c.moveTo(x + w, y); c.lineTo(cx + q, cy - q); c.moveTo(x, y + hh); c.lineTo(cx - q, cy + q); c.moveTo(x + w, y + hh); c.lineTo(cx + q, cy + q); c.stroke();
      c.beginPath(); c.rect(cx - q, cy - q, 2 * q, 2 * q); c.fillStyle = PAPEL; c.fill(); lav(AZUL, .6); tinta(1, .8); c.stroke(); tinta(.7, .4); c.beginPath(); c.moveTo(cx - q + 1, cy); c.lineTo(cx + q - 1, cy); c.stroke(); reset(); }
    function insula(h) { const { x, y, w, h: hh } = h; sombraH(x, y, w, hh, 5); caja(x, y, w, hh, TEJA, .32); hatchRect(x, y, w, hh, Math.PI / 2, 1.5, .4, .65); tinta(1, .8); c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + hh); c.moveTo(x + 2, y + 2); c.lineTo(x + w - 2, y + 2); c.stroke(); wob(x + 2, y + 2, w - 4, hh - 4, .2); tinta(.5, .5); c.stroke();
      tinta(.9, .6); c.beginPath(); for (let i = 0; i < 6; i++) { c.moveTo(x + 3 + i * 5, y + hh); c.lineTo(x + 3 + i * 5, y + hh + 2.4); } c.stroke(); tinta(.9, .8); c.beginPath(); c.moveTo(x, y + hh + 2.4); c.lineTo(x + w, y + hh + 2.4); c.stroke(); reset(); }
    function rica(h) { const { x, y, w, h: hh } = h, i = 9, ix = x + i, iy = y + 7, iw = w - 2 * i, ih = hh - 14; sombraH(x, y, w, hh, 4); caja(x, y, w, hh, TEJA, .38);
      hatch(() => { c.beginPath(); c.rect(x, y, w, hh); c.rect(ix, iy, iw, ih); }, .25, 1.7, .4, .65); c.save(); c.beginPath(); c.rect(x, y, w, hh); c.rect(ix, iy, iw, ih); c.clip('evenodd'); c.restore();
      c.beginPath(); c.rect(ix, iy, iw, ih); c.fillStyle = PAPEL; c.fill(); lav(OLIVA, .45); tinta(1, .8); c.stroke(); tinta(.6, .4); c.strokeRect(ix + 2.8, iy + 2.8, iw - 5.6, ih - 5.6);
      for (let k = 0; k <= 4; k++) { const px = ix + 1.5 + k * (iw - 3) / 4; [iy + 1.4, iy + ih - 1.4].forEach(py => { c.beginPath(); c.arc(px, py, .9, 0, 7); c.fillStyle = PAPEL; c.fill(); tinta(1, .6); c.stroke(); }); }
      c.beginPath(); c.ellipse(ix + iw / 2, iy + ih / 2, 3, 2.2, 0, 0, 7); c.fillStyle = PAPEL; c.fill(); lav(AZUL, .7); tinta(1, .6); c.stroke(); reset(); }
    function publico(p) { const { x, y, w, h, tipo } = p; sombraH(x, y, w, h, 3);
      if (tipo === 'granero') { caja(x, y, w, h, TEJA, .25); hatchRect(x, y, w, h, Math.PI / 2, 1.5, .4, .6); tinta(1, .9); c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke(); }
      else if (tipo === 'almacen') { caja(x, y + 3, w, h - 6, TEJA, .25); hatchRect(x, y + 3, w, h - 6, Math.PI / 2, 1.5, .4, .6); }
      else if (tipo === 'cuartel') { caja(x, y, w, h, null); tinta(.9, .6); c.strokeRect(x + 3, y + 3, w - 6, h - 6); hatchRect(x + 3, y + 3, w - 6, h - 6, 0, 2.2, .35, .45); tinta(1, .9); c.beginPath(); c.moveTo(x + w / 2, y + h / 2 + 4); c.lineTo(x + w / 2, y + 7); c.lineTo(x + w / 2 + 6, y + 9.5); c.lineTo(x + w / 2, y + 12); c.stroke(); }
      else { caja(x, y, w, h, null); caja(x + 3, y + 3, w - 6, 10, TEJA, .35); hatchRect(x + 3, y + 3, w - 6, 10, 0, 1.6, .4, .6); c.beginPath(); c.rect(x + 4, y + 16, w - 8, h - 20); c.fillStyle = PAPEL; c.fill(); lav(AZUL, .6); tinta(1, .7); c.stroke(); } reset(); }

    /* ---- ciudad: suelo, calles, huertos ---- */
    c.save(); c.beginPath(); c.ellipse(CX, CY, RX, RY, 0, 0, 7); c.fillStyle = 'rgba(233,218,176,.92)'; c.fill(); c.clip();
    const ptsCalle = cl => { const o = []; for (let i = 1; i < cl.pts.length; i++) { const a = cl.pts[i - 1], b = cl.pts[i], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(cl.pts[cl.pts.length - 1]); return o; };
    const trz = (p, w, st) => { c.strokeStyle = st; c.lineWidth = w; c.beginPath(); p.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.stroke(); };
    const cps = E.calles.map(cl => [ptsCalle(cl), cl]); c.globalAlpha = .85; cps.forEach(([p, cl]) => trz(p, cl.ancho + 1.4, TINTA)); c.globalAlpha = 1; cps.forEach(([p, cl]) => trz(p, cl.ancho - .2, '#ecdfb8'));
    cps.forEach(([p, cl]) => { if (cl.tipo === 'empedrada') for (let i = 0; i < p.length; i++) { c.fillStyle = 'rgba(74,51,32,.45)'; c.fillRect(p[i][0] + rr(-cl.ancho / 2 + 1, cl.ancho / 2 - 1), p[i][1] + rr(-cl.ancho / 2 + 1, cl.ancho / 2 - 1), .8, .8); } });
    E.huertos.forEach(h => { wob(h.x, h.y, h.w, h.h, .5); c.fillStyle = PAPEL; c.fill(); lav(OLIVA, .5); tinta(1, .8); c.stroke(); tinta(.7, .45); c.beginPath(); for (let i = 2.5; i < h.h; i += 2.6) { c.moveTo(h.x + 1.5, h.y + i); c.lineTo(h.x + h.w - 1.5, h.y + i); } c.stroke(); reset(); });
    E.jardines.forEach(h => { wob(h.x, h.y, h.w, h.h, .4); c.fillStyle = PAPEL; c.fill(); tinta(1, .8); c.stroke(); c.beginPath(); c.rect(h.x + 3, h.y + 3, h.w - 6, h.h - 6); lav(OLIVA, .4); tinta(.8, .5); c.stroke(); for (let k = 0; k < 6; k++) arbol(h.x + rr(6, h.w - 6), h.y + rr(6, h.h - 6), rr(1.8, 2.8)); reset(); });
    E.casasRurales.forEach(() => 0);
    E.casas.forEach(h => { if (h.tipo === 'choza') choza(h); else if (h.tipo === 'atrio') atrio(h); else if (h.tipo === 'insula') insula(h); else rica(h); });
    E.publicos.forEach(publico);

    /* foro: plaza de losas punteadas, columnas, curia, comicio, templo */
    const fx = foro.x, fy = foro.y, fw = foro.w, fh = foro.h, cu = foro.curia, co = foro.comicio, te = foro.templo, pr = te.porche, fu = foro.fuente;
    wob(fx - 4, fy - 4, fw + 8, fh + 8, .3); c.fillStyle = PAPEL; c.fill(); tinta(1, .9); c.stroke(); wob(fx, fy, fw, fh, .2); tinta(.7, .5); c.stroke();
    for (let i = 0; i < 280; i++) { c.fillStyle = 'rgba(74,51,32,.4)'; c.fillRect(rr(fx + 2, fx + fw - 2), rr(fy + 2, fy + fh - 2), .8, .8); }
    foro.columnas.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.9, 0, 7); c.fillStyle = PAPEL; c.fill(); tinta(1, .7); c.stroke(); });
    /* mercado: puestos con toldo rayado */
    wob(mercado.x - 2, mercado.y - 2, mercado.w + 4, mercado.h + 4, .3); c.fillStyle = PAPEL; c.fill(); tinta(1, .9); c.stroke(); for (let i = 0; i < 220; i++) { c.fillStyle = 'rgba(74,51,32,.35)'; c.fillRect(rr(mercado.x + 1, mercado.x + mercado.w - 1), rr(mercado.y + 1, mercado.y + mercado.h - 1), .8, .8); }
    mercado.puestos.forEach(p => { sombraH(p.x, p.y, p.w, p.h, 2); wob(p.x, p.y, p.w, p.h, .2); c.fillStyle = PAPEL; c.fill(); tinta(1, .7); c.stroke(); tinta(.8, .5); c.beginPath(); for (let i = 1.8; i < p.w; i += 3.6) { c.moveTo(p.x + i, p.y); c.lineTo(p.x + i, p.y + p.h); } c.stroke(); });
    /* comicio (planta: gradas circulares con rayas radiales) */
    for (let i = 0; i < co.gradas; i++) { const r = co.r - i * 3.8; c.beginPath(); c.arc(co.x, co.y, r, 0, 7); c.fillStyle = PAPEL; c.fill(); tinta(1, .8); c.stroke(); }
    tinta(.7, .4); c.beginPath(); for (let k = 0; k < 20; k++) { const a = k * Math.PI / 10; c.moveTo(co.x + Math.cos(a) * 3.5, co.y + Math.sin(a) * 3.5); c.lineTo(co.x + Math.cos(a) * co.r, co.y + Math.sin(a) * co.r); } c.stroke(); c.beginPath(); c.arc(co.x, co.y, 3.4, 0, 7); c.fillStyle = PAPEL; c.fill(); tinta(1, .8); c.stroke();
    c.beginPath(); c.arc(fu.x, fu.y, fu.r, 0, 7); c.fillStyle = PAPEL; c.fill(); lav(AZUL, .7); tinta(1, .8); c.stroke(); reset();
    c.restore();

    /* ---- muralla: doble línea con relleno punteado ---- */
    const ell = (col, w, rx, ry, a = 1, dash) => { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.ellipse(CX, CY, rx, ry, 0, 0, 7); c.stroke(); reset(); };
    ell(TINTA, 9.4, RX, RY); ell(PAPEL, 7.4, RX, RY); ell(TINTA, 5.2, RX, RY, .55, [.9, 2]); ell(TINTA, .5, RX, RY, .7);
    /* alzados de la muralla: puertas y torres, de más al norte a más al sur */
    function torreAlzado(x, y, w, h) { // base en (x,y)
      c.beginPath(); c.rect(x - w / 2, y - h, w, h); c.fillStyle = PAPEL; c.fill(); tinta(1, .85); c.stroke();
      hatchRect(x, y - h, w / 2, h, Math.PI / 2, 1.3, .4, .6); hatchRect(x - w / 2, y - h, w / 2, h, 0, 100, .1, 0);
      tinta(1, .8); c.beginPath(); for (let i = 0; i < 3; i++) { const bx = x - w / 2 + i * w / 3; c.rect(bx, y - h - 2.2, w / 3 - .8, 2.2); } c.stroke(); c.fillStyle = PAPEL; for (let i = 0; i < 3; i++) c.fillRect(x - w / 2 + i * w / 3 + .3, y - h - 1.8, w / 3 - 1.4, 1.8);
      c.fillStyle = TINTA; c.fillRect(x - .7, y - h * .65, 1.4, 3.2); }
    const torres = muralla.torres.slice().sort((a, b) => a.y - b.y); torres.forEach(t => torreAlzado(t.x, t.y + 4, 8.5, 12)); reset();
    muralla.puertas.forEach(p => { const x = p.x, y = p.y + 5; torreAlzado(x - 9, y, 9, 15); torreAlzado(x + 9, y, 9, 15); c.beginPath(); c.rect(x - 5, y - 9, 10, 9); c.fillStyle = PAPEL; c.fill(); tinta(1, .85); c.stroke(); c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 3, y - 4); c.arc(x, y - 4, 3, Math.PI, 0); c.lineTo(x + 3, y); c.fillStyle = TINTA; c.globalAlpha = .85; c.fill(); reset(); });

    /* ---- edificios principales en alzado (vista caballera), sobre su planta ---- */
    function temploAlzado(x, y, w) { // base y, ancho w
      const h = 17; tinta(1, .9);
      for (let i = 0; i < 3; i++) { c.beginPath(); c.rect(x - w / 2 - 2 + i * 1.4, y - i * 1.8 - 1.8, w + 4 - i * 2.8, 1.8); c.fillStyle = PAPEL; c.fill(); c.stroke(); }
      c.beginPath(); c.rect(x - w / 2, y - 5.4 - h, w, h); c.fillStyle = PAPEL; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x - w / 2 - 3, y - 5.4 - h); c.lineTo(x, y - 5.4 - h - 9); c.lineTo(x + w / 2 + 3, y - 5.4 - h); c.closePath(); c.fillStyle = PAPEL; c.fill(); lav(TEJA, .5); tinta(1, .9); c.stroke(); hatch(() => { c.beginPath(); c.moveTo(x - w / 2 - 3, y - 5.4 - h); c.lineTo(x, y - 5.4 - h - 9); c.lineTo(x + w / 2 + 3, y - 5.4 - h); c.closePath(); }, .45, 1.6, .4, .6);
      c.beginPath(); c.arc(x, y - 5.4 - h - 3.2, 1.6, 0, 7); tinta(.9, .6); c.stroke();
      for (let i = 0; i < 6; i++) { const cx = x - w / 2 + 3 + i * (w - 6) / 5; c.beginPath(); c.rect(cx - 1.3, y - 5.4 - h + 1, 2.6, h - 1); c.fillStyle = PAPEL; c.fill(); tinta(1, .7); c.stroke(); tinta(.6, .4); c.beginPath(); c.moveTo(cx + .4, y - 5.4 - h + 2); c.lineTo(cx + .4, y - 6.5); c.stroke(); } reset(); }
    function curiaAlzado(x, y, w) { const h = 13; c.beginPath(); c.rect(x - w / 2, y - h, w, h); c.fillStyle = PAPEL; c.fill(); tinta(1, .9); c.stroke(); hatchRect(x - w / 2, y - h, w, 3.2, 0, 1.2, .4, .6);
      c.beginPath(); c.moveTo(x - w / 2 - 2, y - h); c.lineTo(x, y - h - 7); c.lineTo(x + w / 2 + 2, y - h); c.closePath(); c.fillStyle = PAPEL; c.fill(); lav(TEJA, .5); tinta(1, .9); c.stroke(); hatch(() => { c.beginPath(); c.moveTo(x - w / 2 - 2, y - h); c.lineTo(x, y - h - 7); c.lineTo(x + w / 2 + 2, y - h); c.closePath(); }, -.5, 1.5, .4, .6);
      c.beginPath(); c.rect(x - 3, y - 8, 6, 8); c.fillStyle = TINTA; c.globalAlpha = .85; c.fill(); reset(); for (let i = 0; i < 3; i++) { const cx = x - w / 2 + 4 + i * (w - 8) / 2; if (Math.abs(cx - x) < 4) continue; c.beginPath(); c.rect(cx - 1, y - h + 3, 2, h - 3); c.fillStyle = PAPEL; c.fill(); tinta(1, .6); c.stroke(); } reset(); }
    temploAlzado(te.x + te.w / 2, pr.y + 8, te.w - 6); curiaAlzado(cu.x + cu.w / 2, cu.y + cu.h + 3, cu.w - 4);

    /* ---- cosas vivas: carros y gente como puntos de tinta ---- */
    E.carros.forEach(k => { c.save(); c.translate(k.x, k.y); c.rotate(k.rot * Math.PI / 180); c.beginPath(); c.rect(-6, -3, 12, 6); c.fillStyle = PAPEL; c.fill(); tinta(1, .8); c.stroke(); hatchRect(-6, -3, 12, 6, .8, 1.5, .35, .5); c.restore(); });
    E.gente.forEach(g => { c.fillStyle = TINTA; c.globalAlpha = .75; c.beginPath(); c.arc(g.x, g.y, .8, 0, 7); c.fill(); }); reset();

    /* ---- rótulos en latín (versalitas serif) ---- */
    rotulo('FORVM', 195, 317, 8); rotulo('CVRIA', 152, 365, 5.8); rotulo('TEMPLVM', 236, 382, 5.8); rotulo('COMITIVM', 166, 402, 5.2); rotulo('MACELLVM', 195, 470, 6);
    const P = k => E.publicos.find(p => p.tipo === k); const pg = P('granero'), pc = P('cuartel'), pa = P('almacen'), pt = P('termas');
    if (pg) rotulo('HORREVM', pg.x + 16, pg.y + 37, 5.6); if (pc) rotulo('CASTRA', pc.x + 16, pc.y + 37, 5.6); if (pa) rotulo('HORREA', pa.x + 16, pa.y + 37, 5.6); if (pt) rotulo('THERMAE', pt.x + 16, pt.y + 15, 5.4);
    rotulo('PONS', E.puente.x + 22, (E.puente.y0 + E.puente.y1) / 2, 6.5); rotulo('PORTVS', 304, 548, 5.4);

    /* ---- cartela, rosa de los vientos y escala gráfica ---- */
    { const x = 206, y = 700, w = 176, h = 66; c.save(); c.shadowColor = 'rgba(60,40,15,.4)'; c.shadowBlur = 5 * S; c.shadowOffsetX = 2 * S; c.shadowOffsetY = 2 * S; wob(x, y, w, h, .4); c.fillStyle = '#efe1b8'; c.fill(); c.restore();
      tinta(1, 1.6); c.strokeRect(x, y, w, h); tinta(1, .6); c.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7); [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 5, 0, 7); c.fillStyle = TINTA; c.fill(); c.beginPath(); c.arc(a, b, 2.2, 0, 7); c.fillStyle = PAPEL; c.fill(); });
      c.fillStyle = '#9c3a1c'; c.font = `bold 21px ${SERIF}`; try { c.letterSpacing = '5px'; } catch (e) { } c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AQVILA', x + w / 2 + 2, y + 25); try { c.letterSpacing = '1.5px'; } catch (e) { }
      c.fillStyle = TINTA; c.font = `italic 8.5px ${SERIF}`; c.fillText('PLANVM · ANNO CCLXXVIII', x + w / 2, y + 46); c.font = `7px ${SERIF}`; c.fillText('Verano 278 a. C.', x + w / 2, y + 57); tinta(.8, .6); c.beginPath(); c.moveTo(x + 24, y + 38); c.lineTo(x + w - 24, y + 38); c.stroke(); reset(); }
    { const x = 348, y = 168, r = 19; c.save(); c.translate(x, y); c.beginPath(); c.arc(0, 0, r + 3, 0, 7); c.fillStyle = 'rgba(233,218,176,.8)'; c.fill(); tinta(1, .7); c.stroke(); c.beginPath(); c.arc(0, 0, r - 4, 0, 7); tinta(.8, .5); c.stroke();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, big = k % 2 === 0, L = big ? r : r * .62, w = big ? 3.2 : 2; const px = Math.cos(a + Math.PI / 2), py = Math.sin(a + Math.PI / 2); c.beginPath(); c.moveTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(px * w, py * w); c.lineTo(0, 0); c.closePath(); c.fillStyle = k === 0 ? '#9c3a1c' : PAPEL; c.fill(); tinta(1, .6); c.stroke(); c.beginPath(); c.moveTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(-px * w, -py * w); c.lineTo(0, 0); c.closePath(); c.fillStyle = k % 2 ? TINTA : '#9a8a60'; c.globalAlpha = .55; c.fill(); c.globalAlpha = 1; c.stroke(); }
      c.restore(); c.fillStyle = TINTA; c.font = `bold 8px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', x, y - r - 7); }
    { const x = 16, y = 744; c.save(); c.fillStyle = 'rgba(233,218,176,.85)'; c.fillRect(x - 6, y - 14, 112, 32); tinta(1, .7); c.strokeRect(x - 6, y - 14, 112, 32); for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? PAPEL : TINTA; c.fillRect(x + i * 18, y, 18, 4); } tinta(1, .7); c.strokeRect(x, y, 90, 4);
      c.fillStyle = TINTA; c.font = `bold 7px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('0', x, y - 5); c.fillText('100 pasos', x + 90, y - 5); c.font = `italic 6.5px ${SERIF}`; c.fillText('SCALA PASSVVM', x + 45, y + 12); c.restore(); }

    /* ---- marco de tinta, desgaste y viñeta de pergamino ---- */
    tinta(.9, 1.6); c.strokeRect(5, 5, 380, 834); tinta(.7, .6); c.strokeRect(8, 8, 374, 828); reset();
    const g = c.createRadialGradient(195, 422, 260, 195, 422, 520); g.addColorStop(0, 'rgba(120,80,30,0)'); g.addColorStop(1, 'rgba(120,80,30,.35)'); c.fillStyle = g; c.fillRect(0, 0, 390, 844);
    for (let i = 0; i < 3000; i++) { c.fillStyle = R() < .5 ? 'rgba(80,55,25,.07)' : 'rgba(255,248,220,.12)'; c.fillRect(rr(0, 390), rr(0, 844), rr(.5, 1.3), rr(.5, 1.3)); }
    return Math.round(performance.now() - t0);
  }
  window.dibujarCiudad = dibujarCiudad;
})();
