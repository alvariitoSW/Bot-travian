/* Estilo 1: plano claro. Vector limpio, colores planos, sombra corta dura (sol arriba a la izquierda). */
(function () {
  const f = n => Math.round(n * 10) / 10;
  const TEJA = [['#c9643a', '#8d3a1f'], ['#bf5a33', '#84341b'], ['#d27348', '#97482a'], ['#b4532f', '#7a3019']];
  const SOMB = '#3b2812';
  const P = { hierba: '#a4b25c', tierra: '#d4c08c', toba: '#bcae8a', tobaOsc: '#8c7f60', enlucido: '#efe4c8', zocalo: '#a8452b', paja: '#d9b85e', pajaOsc: '#a58a38' };
  const sombra = (x, y, w, h, dx, dy, o = .28) => `<rect x="${f(x + dx)}" y="${f(y + dy)}" width="${w}" height="${h}" fill="${SOMB}" opacity="${o}"/>`;
  const arbol = (x, y, r) => `<circle cx="${f(x + r * .35)}" cy="${f(y + r * .4)}" r="${r}" fill="${SOMB}" opacity=".26"/><circle cx="${x}" cy="${y}" r="${r}" fill="#5b8a35"/><circle cx="${f(x - r * .28)}" cy="${f(y - r * .28)}" r="${f(r * .55)}" fill="#86ad4a"/>`;
  function tejas(x, y, w, h, col, vert) { // lineas de teja sobre un tejado
    let d = ''; if (vert) for (let i = x + 3; i < x + w - 1; i += 3) d += `M${f(i)} ${y + 1}v${h - 2}`; else for (let i = y + 3; i < y + h - 1; i += 3) d += `M${x + 1} ${f(i)}h${w - 2}`;
    return `<path d="${d}" stroke="${col}" stroke-width=".5" opacity=".45" fill="none"/>`;
  }
  function tejado(x, y, w, h, c, dx = 2, dy = 2.5) {
    const [a, b] = TEJA[c % 4], vert = h > w, cum = vert ? `<line x1="${x + w / 2}" y1="${y + 1}" x2="${x + w / 2}" y2="${y + h - 1}"` : `<line x1="${x + 1}" y1="${y + h / 2}" x2="${x + w - 1}" y2="${y + h / 2}"`;
    return sombra(x, y, w, h, dx, dy) + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${a}"/>` + tejas(x, y, w, h, b, !vert) + `${cum} stroke="${b}" stroke-width="1.8"/><${cum.slice(1)} stroke="#e29a70" stroke-width=".6" opacity=".7" transform="translate(-.4,-.6)"/>`;
  }
  const choza = h => { const { x, y, r } = h; let l = ''; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; l += `M${f(x)} ${f(y)}L${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`; }
    return `<circle cx="${f(x + 1.6)}" cy="${f(y + 2)}" r="${r}" fill="${SOMB}" opacity=".28"/><circle cx="${x}" cy="${y}" r="${r}" fill="${P.paja}" stroke="${P.pajaOsc}" stroke-width=".8"/><path d="${l}" stroke="${P.pajaOsc}" stroke-width=".5" opacity=".7"/><circle cx="${x}" cy="${y}" r="1.2" fill="${P.pajaOsc}"/>`; };
  function atrio(h) { const { x, y, w, h: hh } = h, [a, b] = TEJA[h.c % 4], cx = x + w / 2, cy = y + hh / 2, q = 2.8;
    return sombra(x, y, w, hh, 2, 2.5) + `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="1" fill="${a}"/><path d="M${x} ${y}L${cx - q} ${cy - q}M${x + w} ${y}L${cx + q} ${cy - q}M${x} ${y + hh}L${cx - q} ${cy + q}M${x + w} ${y + hh}L${cx + q} ${cy + q}" stroke="${b}" stroke-width="1" opacity=".85"/><rect x="${cx - q}" y="${cy - q}" width="${2 * q}" height="${2 * q}" fill="#5b4a31"/><rect x="${cx - q + 1.2}" y="${cy - q + 1.2}" width="${2 * q - 2.4}" height="${2 * q - 2.4}" fill="#8ab0bf"/>`; }
  function insula(h) { const { x, y, w, h: hh } = h, [a, b] = TEJA[h.c % 4];
    return sombra(x, y, w, hh, 6, 7, .3) + `<rect x="${x + 2.5}" y="${y + 3.5}" width="${w}" height="${hh}" fill="${P.enlucido}"/><rect x="${x + 2.5}" y="${y + hh + 2}" width="${w}" height="1.5" fill="${P.zocalo}"/><path d="M${x + 6} ${y + hh + 1}h2M${x + 12} ${y + hh + 1}h2M${x + 18} ${y + hh + 1}h2M${x + 24} ${y + hh + 1}h2" stroke="#6b5430" stroke-width="1.2"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${a}" stroke="${b}" stroke-width=".8"/>` + tejas(x, y, w, hh, b, true) + `<path d="M${x + w / 3} ${y}v${hh}M${x + 2 * w / 3} ${y}v${hh}" stroke="${b}" stroke-width="1.3"/><rect x="${x + 4}" y="${y + 4}" width="3" height="3" fill="${b}"/><rect x="${x + w - 8}" y="${y + hh - 8}" width="3" height="3" fill="${b}"/>`; }
  function rica(h) { const { x, y, w, h: hh } = h, [a, b] = TEJA[h.c % 4], i = 9, ix = x + i, iy = y + 8, iw = w - 2 * i, ih = hh - 16; let col = '';
    for (let k = 0; k <= 4; k++) { col += `<circle cx="${f(ix + 1.5 + k * (iw - 3) / 4)}" cy="${iy + 1.5}" r="1" fill="${P.enlucido}"/><circle cx="${f(ix + 1.5 + k * (iw - 3) / 4)}" cy="${iy + ih - 1.5}" r="1" fill="${P.enlucido}"/>`; }
    return sombra(x, y, w, hh, 4, 5, .3) + `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${P.enlucido}"/><path fill-rule="evenodd" fill="${a}" d="M${x} ${y}h${w}v${hh}h${-w}zM${ix} ${iy}v${ih}h${iw}v${-ih}z"/><rect x="${x + 3.5}" y="${y + 3.5}" width="${w - 7}" height="${hh - 7}" fill="none" stroke="${b}" stroke-width="1.2"/><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#7fa04a"/>${col}<circle cx="${x + w / 2}" cy="${y + hh / 2}" r="2.4" fill="#8ab0bf" stroke="${P.enlucido}" stroke-width=".8"/>`; }
  function publico(p) { const { x, y, w, h, tipo } = p; let o = '';
    if (tipo === 'granero') o = sombra(x, y, w, h, 4, 5) + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c9a05a" stroke="#8a6a30" stroke-width=".8"/>` + tejas(x, y, w, h, '#8a6a30', true) + `<path d="M${x + w / 2} ${y}v${h}" stroke="#7a5a28" stroke-width="2"/><rect x="${x + w / 2 - 4}" y="${y + h - 3}" width="8" height="3" fill="#5b4a31"/>`;
    else if (tipo === 'almacen') o = sombra(x, y, w, h, 3, 4) + `<rect x="${x}" y="${y + 3}" width="${w}" height="${h - 6}" fill="#9a7a52" stroke="#6b5230" stroke-width=".8"/>` + tejas(x, y + 3, w, h - 6, '#5b4020', true) + `<path d="M${x} ${y + h / 2}h${w}" stroke="#5b4020" stroke-width="1.8"/><rect x="${x + 4}" y="${y + h - 3}" width="6" height="3" fill="#5b4a31"/><rect x="${x + 22}" y="${y + h - 3}" width="6" height="3" fill="#5b4a31"/>`;
    else if (tipo === 'cuartel') o = sombra(x, y, w, h, 4, 5) + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.enlucido}" stroke="#8c7f60" stroke-width="1"/><path fill-rule="evenodd" fill="#b5472f" d="M${x + 2} ${y + 2}h${w - 4}v${h - 4}h${-w + 4}zM${x + 8} ${y + 8}v${h - 16}h${w - 16}v${-h + 16}z"/><rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" fill="#d3c391"/><path d="M${x + w / 2} ${y + 11}v8" stroke="#3b2812" stroke-width="1"/><path d="M${x + w / 2} ${y + 11}h5v3h-5z" fill="#c0281f"/>`;
    else o = sombra(x, y, w, h, 3, 4) + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.enlucido}" stroke="#8c7f60" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 14}" fill="#c9643a"/><path d="M${x + 2} ${y + 8}h${w - 4}" stroke="#8d3a1f" stroke-width="1.5"/><path d="M${x + 6} ${y + h - 11}h${w - 12}v8a4 4 0 0 1-4 4h${-w + 20}a4 4 0 0 1-4-4z" fill="#7db4c8" stroke="#4f7f8f" stroke-width="1"/><circle cx="${x + w - 5}" cy="${y + 4}" r="1.6" fill="#8c7f60"/>`;
    return o; }
  function campo(c) { const cols = [['#cdab55', '#a88a36'], ['#adb95e', '#86963f'], ['#d3b565', '#aa8b3d']][c.col], cx = c.x + c.w / 2, cy = c.y + c.h / 2; let k = '';
    if (c.vert) for (let i = 3; i < c.w; i += 4) k += `M${c.x + i} ${c.y + 1}v${c.h - 2}`; else for (let i = 3; i < c.h; i += 4) k += `M${c.x + 1} ${c.y + i}h${c.w - 2}`;
    return `<g transform="rotate(${c.rot} ${cx} ${cy})"><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${cols[0]}" stroke="#8f8a40" stroke-width="1"/><path d="${k}" stroke="${cols[1]}" stroke-width="1.1" fill="none"/></g>`; }
  const pl = pts => 'M' + pts.map(p => p.join(' ')).join('L');
  function barco(b) { const l = b.l, w = b.w, v = b.vela ? `<path d="M${-l * .1} ${-w * .3}h${l * .3}v${w * .6}h${-l * .3}z" fill="#e8dcc0" stroke="#8c7f60" stroke-width=".6"/><path d="M${-l * .1} 0h${l * .3}" stroke="#a8452b" stroke-width="1"/>` : `<path d="M${-l * .3} -1h${l * .3}M${-l * .3} 2h${l * .3}" stroke="#6b4a22" stroke-width=".7"/>`;
    return `<g transform="translate(${b.x} ${b.y}) rotate(${b.rot})"><path d="M${-l / 2} ${-w / 2 + 2}Q0 ${w / 2 + 4} ${l / 2} 2Q0 ${-w / 2 + 4} ${-l / 2} ${-w / 2 + 2}z" fill="#27465a" opacity=".3" transform="translate(2,3)"/><path d="M${-l / 2} ${-w / 2}L${l * .32} ${-w / 2}Q${l / 2} 0 ${l * .32} ${w / 2}L${-l / 2} ${w / 2}z" fill="#8a5a28" stroke="#4a2f12" stroke-width="1"/><path d="M${-l / 2 + 2} ${-w / 2 + 2}L${l * .3} ${-w / 2 + 2}Q${l * .42} 0 ${l * .3} ${w / 2 - 2}L${-l / 2 + 2} ${w / 2 - 2}z" fill="#c49a5a"/>${v}</g>`; }
  function carro(c) { return `<g transform="translate(${c.x} ${c.y}) rotate(${c.rot})"><rect x="-6" y="-3.5" width="13" height="7" rx="1" fill="#8a5a22" stroke="#3b2812" stroke-width=".8" transform="translate(1,1.5)" opacity=".3"/><rect x="-6" y="-3.5" width="13" height="7" rx="1" fill="#9a6a2c" stroke="#3b2812" stroke-width=".8"/><path d="M-5 -2h11M-5 0h11M-5 2h11" stroke="#6b4a22" stroke-width=".5"/><ellipse cx="10" cy="0" rx="3.4" ry="2.2" fill="#8a7a66" stroke="#3b2812" stroke-width=".6"/></g>`; }

  window.dibujarCiudad = function (E, el) {
    const { CX, CY, RX, RY, rio, RIO_W, foro, mercado, muralla } = E;
    let o = `<svg viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="adoq" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3h6M3 0v3M0 3v3" stroke="#bfb08a" stroke-width=".5" fill="none" opacity=".7"/></pattern><clipPath id="clipCiudad"><ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}"/></clipPath></defs>`;
    o += `<rect width="390" height="844" fill="${P.hierba}"/>`;
    for (let i = 0; i < 60; i++) { const x = (i * 97) % 390, y = (i * 211) % 844; o += `<path d="M${x} ${y}l1.5-3M${x + 2} ${y}l.5-3.500M${x + 4} ${y}l-.5-3" stroke="#8d9e48" stroke-width=".9" fill="none"/>`; }
    E.campos.forEach(c => o += campo(c));
    /* caminos exteriores */
    E.camino.forEach(c => { const d = pl(c.pts); o += `<path d="${d}" stroke="#c2ad78" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#e2d2a2" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; });
    /* río: orillas, agua, ondas */
    const a = RIO_W, ry = x => rio(x);
    o += `<path d="M-10 ${f(ry(-10) - a - 7)}L400 ${f(ry(400) - a - 7)}L400 ${f(ry(400) + a + 7)}L-10 ${f(ry(-10) + a + 7)}z" fill="#dccb98"/><path d="M-10 ${f(ry(-10) - a)}L400 ${f(ry(400) - a)}L400 ${f(ry(400) + a)}L-10 ${f(ry(-10) + a)}z" fill="#5f9aae"/><path d="M-10 ${f(ry(-10) - a + 4)}L400 ${f(ry(400) - a + 4)}" stroke="#8fc0cf" stroke-width="2" opacity=".5"/>`;
    for (let i = 0; i < 9; i++) { const x = 15 + i * 44, y = ry(x) + ((i * 7) % 5 - 2) * 8; o += `<path d="M${x} ${f(y)}q8-3 16 0M${x + 22} ${f(y + 9)}q6-2 12 0" stroke="#a9d0db" stroke-width="1.3" fill="none" opacity=".75" transform="rotate(${E.RIO_ANG} ${x} ${f(y)})"/>`; }
    /* muelle */
    const q = E.muelle.quay, pi = E.muelle.pier;
    o += `<rect x="${q.x + 2}" y="${q.y + 3}" width="${q.w}" height="${q.h}" fill="${SOMB}" opacity=".25"/><rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" fill="#a7783f" stroke="#5b3d1a" stroke-width="1"/><path d="M${q.x + 4} ${q.y}v${q.h}M${q.x + 9} ${q.y}v${q.h}M${q.x + 14} ${q.y}v${q.h}M${q.x + 19} ${q.y}v${q.h}M${q.x + 24} ${q.y}v${q.h}M${q.x + 29} ${q.y}v${q.h}" stroke="#5b3d1a" stroke-width=".6"/>`;
    o += `<rect x="${pi.x + 2}" y="${pi.y + 3}" width="${pi.w}" height="${pi.h}" fill="${SOMB}" opacity=".25"/><rect x="${pi.x}" y="${pi.y}" width="${pi.w}" height="${pi.h}" fill="#a7783f" stroke="#5b3d1a" stroke-width="1"/><path d="M${pi.x} ${pi.y + 5}h${pi.w}M${pi.x} ${pi.y + 10}h${pi.w}M${pi.x} ${pi.y + 15}h${pi.w}M${pi.x} ${pi.y + 20}h${pi.w}M${pi.x} ${pi.y + 25}h${pi.w}M${pi.x} ${pi.y + 30}h${pi.w}" stroke="#5b3d1a" stroke-width=".6"/>`;
    E.barcos.forEach(b => o += barco(b));
    /* puente */
    const pu = E.puente;
    o += `<rect x="${pu.x - pu.w / 2 + 3}" y="${pu.y0 + 3}" width="${pu.w}" height="${pu.y1 - pu.y0}" fill="${SOMB}" opacity=".3"/><rect x="${pu.x - pu.w / 2}" y="${pu.y0}" width="${pu.w}" height="${pu.y1 - pu.y0}" fill="#c9b886" stroke="#7b6a40" stroke-width="1"/><rect x="${pu.x - pu.w / 2}" y="${pu.y0}" width="3" height="${pu.y1 - pu.y0}" fill="#a89868"/><rect x="${pu.x + pu.w / 2 - 3}" y="${pu.y0}" width="3" height="${pu.y1 - pu.y0}" fill="#a89868"/><path d="M${pu.x - 5} ${pu.y0 + 2}v${pu.y1 - pu.y0 - 4}M${pu.x + 5} ${pu.y0 + 2}v${pu.y1 - pu.y0 - 4}" stroke="#b5a478" stroke-width=".6" stroke-dasharray="4 4"/>`;
    /* árboles y casas del campo */
    E.arboles.forEach(t => o += arbol(t.x, t.y, t.r));
    E.casasRurales.forEach(c => o += tejado(c.x, c.y, c.w, c.h, c.c));
    /* suelo de la ciudad y calles */
    o += `<ellipse cx="${CX}" cy="${CY}" rx="${RX + 8}" ry="${RY + 8}" fill="#c2b58a" opacity=".6"/><ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="#dccda3"/><g clip-path="url(#clipCiudad)">`;
    E.calles.forEach(c => { const d = pl(c.pts), w = c.ancho; if (c.tipo === 'tierra') o += `<path d="${d}" stroke="#c4ad78" stroke-width="${w + 1.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#d2bf8c" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; else o += `<path d="${d}" stroke="#b8a97f" stroke-width="${w + 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#ece2c6" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="url(#adoq)" stroke-width="${w}" fill="none" stroke-linecap="round"/>`; });
    /* huertos y jardines */
    E.huertos.forEach(h => { let k = ''; for (let i = 3; i < h.h - 1; i += 3.5) k += `M${h.x + 2} ${h.y + i}h${h.w - 4}`; o += `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" fill="#d9ca9a"/><rect x="${h.x + 2}" y="${h.y + 2}" width="${h.w - 4}" height="${h.h - 4}" fill="#86a850"/><path d="${k}" stroke="#5f8a38" stroke-width="1.2"/>`; });
    E.jardines.forEach(h => { o += `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" fill="#d9ca9a"/><rect x="${h.x + 2}" y="${h.y + 2}" width="${h.w - 4}" height="${h.h - 4}" fill="#8fb05a"/><path d="M${h.x + 16} ${h.y + 2}v${h.h - 4}M${h.x + 2} ${h.y + 15}h${h.w - 4}" stroke="#e6d9b0" stroke-width="2"/>` + arbol(h.x + 9, h.y + 8, 4.5) + arbol(h.x + 23, h.y + 22, 4.5); });
    /* viviendas y públicos */
    E.casas.forEach(h => { o += h.tipo === 'choza' ? choza(h) : h.tipo === 'atrio' ? atrio(h) : h.tipo === 'insula' ? insula(h) : rica(h); });
    E.publicos.forEach(p => o += publico(p));
    /* foro */
    const fx = foro.x, fy = foro.y, fw = foro.w, fh = foro.h, cu = foro.curia, co = foro.comicio, te = foro.templo, pr = te.porche, fu = foro.fuente;
    o += `<rect x="${fx - 4}" y="${fy - 4}" width="${fw + 8}" height="${fh + 8}" fill="#b9a97c"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#ece1c2"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#adoq)"/>`;
    foro.columnas.forEach(([x, y]) => o += `<circle cx="${x + 1}" cy="${y + 1.500}" r="2.200" fill="${SOMB}" opacity=".25"/><circle cx="${x}" cy="${y}" r="2.200" fill="#f3ebd2" stroke="#9a8a60" stroke-width=".6"/>`);
    /* curia: rectangular */
    o += sombra(cu.x, cu.y, cu.w, cu.h, 3, 4) + `<rect x="${cu.x}" y="${cu.y}" width="${cu.w}" height="${cu.h}" fill="${P.enlucido}" stroke="#8c7f60" stroke-width="1"/><rect x="${cu.x + 3}" y="${cu.y + 3}" width="${cu.w - 6}" height="${cu.h - 6}" fill="#c9643a"/>` + tejas(cu.x + 3, cu.y + 3, cu.w - 6, cu.h - 6, '#8d3a1f', true) + `<path d="M${cu.x + 3} ${cu.y + cu.h / 2}h${cu.w - 6}" stroke="#8d3a1f" stroke-width="1.8"/><rect x="${cu.x + cu.w / 2 - 4}" y="${cu.y + cu.h - 2}" width="8" height="4" fill="#a8452b"/>`;
    /* comicio: círculo escalonado */
    o += `<circle cx="${co.x + 2}" cy="${co.y + 2.500}" r="${co.r + 1}" fill="${SOMB}" opacity=".25"/>`; for (let i = 0; i < 3; i++) o += `<circle cx="${co.x}" cy="${co.y}" r="${co.r - i * 3.800}" fill="${['#d6c9a3', '#e5dab8', '#f0e7cc'][i]}" stroke="#9a8a60" stroke-width=".8"/>`; o += `<circle cx="${co.x}" cy="${co.y}" r="2.500" fill="#b9a97c"/>`;
    /* templo toscano: podio, cella, pórtico y frontón delante */
    o += sombra(te.x, te.y, te.w, te.h + 12, 4, 5) + `<rect x="${te.x - 2}" y="${te.y - 2}" width="${te.w + 4}" height="${te.h + 14}" fill="#e3d8ba" stroke="#9a8a60" stroke-width="1"/><rect x="${te.x + 4}" y="${te.y + 3}" width="${te.w - 8}" height="${te.h - 4}" fill="#c9643a"/>` + tejas(te.x + 4, te.y + 3, te.w - 8, te.h - 4, '#8d3a1f', true) + `<path d="M${te.x + te.w / 2} ${te.y + 3}v${te.h - 4}" stroke="#8d3a1f" stroke-width="2"/><path d="M${te.x + 4} ${te.y + te.h - 1}L${te.x + te.w / 2} ${te.y + te.h - 7}L${te.x + te.w - 4} ${te.y + te.h - 1}z" fill="#ead7b5" stroke="#8d3a1f" stroke-width=".8"/>`;
    for (let i = 0; i < 4; i++) o += `<circle cx="${f(te.x + 8 + i * (te.w - 16) / 3)}" cy="${pr.y + 2}" r="2" fill="#f3ebd2" stroke="#9a8a60" stroke-width=".6"/>`;
    o += `<path d="M${pr.x} ${pr.y + 7}h${pr.w}M${pr.x + 2} ${pr.y + 9}h${pr.w - 4}" stroke="#b9a97c" stroke-width="1"/>`;
    o += `<circle cx="${fu.x}" cy="${fu.y}" r="${fu.r + 1.500}" fill="#c9bc98" stroke="#8c7f60" stroke-width="1"/><circle cx="${fu.x}" cy="${fu.y}" r="${fu.r - .5}" fill="#7db4c8"/><circle cx="${fu.x}" cy="${fu.y}" r="1.500" fill="#e8f3f6"/>`;
    /* mercado */
    o += `<rect x="${mercado.x - 2}" y="${mercado.y - 2}" width="${mercado.w + 4}" height="${mercado.h + 4}" fill="#b9a97c"/><rect x="${mercado.x}" y="${mercado.y}" width="${mercado.w}" height="${mercado.h}" fill="#e6d8ae"/>`;
    mercado.puestos.forEach(p => { let r = ''; for (let i = 0; i < p.w; i += 3.700) r += `<rect x="${f(p.x + i)}" y="${p.y}" width="1.900" height="${p.h}" fill="#f1e8d0"/>`; o += sombra(p.x, p.y, p.w, p.h, 2, 2.500) + `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.color}"/>${r}<rect x="${p.x}" y="${p.y + p.h + 1}" width="${p.w}" height="2.500" fill="#8a6a3a"/>`; });
    o += `</g>`;
    /* muralla de sillares: sombra, cuerpo, juntas, bordes; torres cuadradas; puertas */
    const ell = (stroke, w, extra = '', rx = RX, ry = RY) => `<ellipse cx="${CX}" cy="${CY}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
    o += `<ellipse cx="${CX + 2}" cy="${CY + 3}" rx="${RX}" ry="${RY}" fill="none" stroke="${SOMB}" stroke-width="9" opacity=".3"/>` + ell('#c4b690', 9) + ell('#8c7f60', 8, 'stroke-dasharray="4.5 1.3" opacity=".75"') + ell('#d6c9a4', 1.2, 'opacity=".8"', RX - 3, RY - 3);
    muralla.torres.forEach(t => o += `<g transform="translate(${t.x} ${t.y}) rotate(${t.ang})"><rect x="-6" y="-6" width="12" height="12" fill="${SOMB}" opacity=".3" transform="translate(2,3)"/><rect x="-6.500" y="-6.500" width="13" height="13" fill="#c4b690" stroke="#7a6d4e" stroke-width="1.200"/><rect x="-4" y="-4" width="8" height="8" fill="#d6c9a4" stroke="#9a8d6a" stroke-width=".7"/><path d="M-6.500 0h13M0 -6.500v13" stroke="#8c7f60" stroke-width=".5"/></g>`);
    muralla.puertas.forEach(p => { const horiz = p.ang === 0, w = horiz ? 24 : 12, h = horiz ? 12 : 24; o += `<g transform="translate(${p.x} ${p.y})"><rect x="${-w / 2 + 2}" y="${-h / 2 + 3}" width="${w}" height="${h}" fill="${SOMB}" opacity=".3"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#c4b690" stroke="#7a6d4e" stroke-width="1.200"/>` + (horiz ? `<rect x="-5" y="-6" width="10" height="12" fill="#6b5a3a"/><path d="M-5 0h10" stroke="#3b2c14" stroke-width="1"/><circle cx="-9" cy="0" r="3" fill="#d6c9a4" stroke="#8c7f60" stroke-width=".8"/><circle cx="9" cy="0" r="3" fill="#d6c9a4" stroke="#8c7f60" stroke-width=".8"/>` : `<rect x="-6" y="-5" width="12" height="10" fill="#6b5a3a"/><path d="M0 -5v10" stroke="#3b2c14" stroke-width="1"/><circle cx="0" cy="-9" r="3" fill="#d6c9a4" stroke="#8c7f60" stroke-width=".8"/><circle cx="0" cy="9" r="3" fill="#d6c9a4" stroke="#8c7f60" stroke-width=".8"/>`) + `</g>`; });
    /* carros y gente */
    E.carros.forEach(c => o += carro(c));
    E.gente.forEach(g => o += `<circle cx="${g.x}" cy="${g.y}" r="1.700" fill="${g.c}" stroke="#2a1a08" stroke-width=".5"/>`);
    o += '</svg>'; el.innerHTML = o;
  };
})();
