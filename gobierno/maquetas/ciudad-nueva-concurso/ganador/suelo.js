/* Suelo pintado (hierba con manchas y flores, caminos de borde difuso, campos en tiras, orilla húmeda, agua) y capas de acuarela
   (áreas de servicio y barrios con forma). Ambos en canvas 2D; el render los pone como textura de un plano. Copiado y adaptado de pintado/render.js. */
export const REGION = { x0: -30, y0: -70, w: 450, h: 984, S: 2 };
let seed = 90210; const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rr = (a, b) => a + (b - a) * R();
const hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%,${a})`;
function lienzo() { const { w, h, S, x0, y0 } = REGION, cv = document.createElement('canvas'); cv.width = w * S; cv.height = h * S; const c = cv.getContext('2d'); c.setTransform(S, 0, 0, S, -x0 * S, -y0 * S); return [cv, c]; }

export function pintarSuelo(E) {
  const { CX, CY, RX, RY, rio, RIO_W, RIO_ANG } = E, [cv, c] = lienzo(), S = REGION.S, X0 = REGION.x0, Y0 = REGION.y0, X1 = X0 + REGION.w, Y1 = Y0 + REGION.h;
  const nosombra = () => { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; };
  const sombra = (b = 4, dx = 2.5, dy = 3.2, a = .42) => { c.shadowColor = `rgba(50,30,12,${a})`; c.shadowBlur = b * S; c.shadowOffsetX = dx * S; c.shadowOffsetY = dy * S; };
  const blob = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
  const wob = (x, y, w, h, j = .6) => { c.beginPath(); const n = Math.max(3, Math.round(w / 6)), m = Math.max(3, Math.round(h / 6)); c.moveTo(x + rr(-j, j), y + rr(-j, j));
    for (let i = 1; i <= n; i++) c.lineTo(x + w * i / n + rr(-j, j), y + rr(-j, j)); for (let i = 1; i <= m; i++) c.lineTo(x + w + rr(-j, j), y + h * i / m + rr(-j, j));
    for (let i = n - 1; i >= 0; i--) c.lineTo(x + w * i / n + rr(-j, j), y + h + rr(-j, j)); for (let i = m - 1; i > 0; i--) c.lineTo(x + rr(-j, j), y + h * i / m + rr(-j, j)); c.closePath(); };
  const trazo = (pts, w, col, blur = 0) => { c.save(); if (blur) { c.shadowColor = col; c.shadowBlur = blur * S; } c.strokeStyle = col; c.lineWidth = w; c.lineCap = c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore(); };
  const jit = (pts, j) => pts.map(p => [p[0] + rr(-j, j), p[1] + rr(-j, j)]);
  const ptsCalle = (pts) => { const o = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(pts[pts.length - 1]); return o; };

  /* hierba: base, manchas suaves, briznas */
  c.fillStyle = '#93a752'; c.fillRect(X0, Y0, REGION.w, REGION.h);
  for (let i = 0; i < 300; i++) { const g = R(); blob(rr(X0, X1), rr(Y0, Y1), rr(18, 55), g < .4 ? 'hsla(78,38%,48%,A)' : g < .7 ? 'hsla(95,34%,38%,A)' : 'hsla(60,45%,60%,A)', rr(.18, .4)); }
  for (let i = 0; i < 3600; i++) { c.fillStyle = R() < .5 ? 'rgba(70,95,30,.22)' : 'rgba(210,220,120,.25)'; c.fillRect(rr(X0, X1), rr(Y0, Y1), 1, rr(1.5, 3.5)); }
  /* suelo de tierra batida dentro de la muralla, con borde suave */
  c.save(); c.fillStyle = 'rgba(214,194,146,.62)'; c.shadowColor = 'rgba(214,194,146,.9)'; c.shadowBlur = 10 * S; c.beginPath(); c.ellipse(CX, CY, RX - 4, RY - 4, 0, 0, 7); c.fill(); c.restore();
  for (let i = 0; i < 700; i++) { const a = R() * 6.283, d = Math.sqrt(R()); const x = CX + (RX - 8) * d * Math.cos(a), y = CY + (RY - 8) * d * Math.sin(a); c.fillStyle = R() < .5 ? 'rgba(120,95,50,.14)' : 'rgba(250,236,190,.2)'; c.fillRect(x, y, rr(1, 2.4), rr(1, 2));
    if (i < 90) blob(x, y, rr(8, 20), 'rgba(160,130,80,A)', .1); }
  const flores = []; for (let i = 0; i < 190; i++) { const x = rr(0, 390), y = rr(0, 844); if (E.dentro(x, y, -8) || Math.abs(y - rio(x)) < RIO_W + 10) continue; flores.push([x, y, ['#f7efd4', '#f2d24a', '#d9553d', '#f4f0e0', '#b48ad0'][Math.floor(R() * 5)]]); }

  /* campos en tiras con surcos */
  const COL = [[44, 52, 58], [78, 40, 52], [48, 55, 62]];
  E.campos.forEach(f => { c.save(); c.translate(f.x + f.w / 2, f.y + f.h / 2); c.rotate(f.rot * Math.PI / 180); c.translate(-f.w / 2, -f.h / 2); const [h, s, l] = COL[f.col];
    sombra(3, 1, 1.5, .25); wob(0, 0, f.w, f.h, 1.2); c.fillStyle = hsl(h, s, l); c.fill(); nosombra(); c.clip();
    const n = f.vert ? f.w : f.h; for (let i = 0; i < n; i += 3.2) { const tono = hsl(h + rr(-6, 6), s + rr(-10, 8), l + rr(-9, 9), .55);
      c.strokeStyle = tono; c.lineWidth = 1.9; c.beginPath(); if (f.vert) { c.moveTo(i + 1, 0); c.lineTo(i + 1 + rr(-.4, .4), f.h); } else { c.moveTo(0, i + 1); c.lineTo(f.w, i + 1 + rr(-.4, .4)); } c.stroke();
      c.strokeStyle = hsl(h - 4, s, l - 16, .4); c.lineWidth = .6; c.beginPath(); if (f.vert) { c.moveTo(i + 2.6, 0); c.lineTo(i + 2.6, f.h); } else { c.moveTo(0, i + 2.6); c.lineTo(f.w, i + 2.6); } c.stroke(); }
    const g = c.createLinearGradient(0, 0, f.w, f.h); g.addColorStop(0, 'rgba(255,230,150,.22)'); g.addColorStop(1, 'rgba(60,30,10,.18)'); c.fillStyle = g; c.fillRect(0, 0, f.w, f.h); c.restore(); });

  /* caminos de tierra, borde difuso */
  const tierra = (pts, w) => { const p = jit(pts, .8); trazo(p, w + 6, 'rgba(120,95,45,.35)', 6); trazo(p, w + 2, 'rgba(176,148,88,.8)', 3); trazo(p, w - 1, '#c9b078'); trazo(jit(pts, 1.4), w * .45, 'rgba(236,220,170,.55)', 2);
    for (let i = 0; i < pts.length; i++) for (let k = 0; k < 3; k++) { c.fillStyle = R() < .5 ? 'rgba(110,85,40,.35)' : 'rgba(250,236,190,.4)'; c.fillRect(pts[i][0] + rr(-w / 2, w / 2), pts[i][1] + rr(-w / 2, w / 2), 1.2, 1); } };
  E.camino.forEach(k => { const ps = []; const q = k.pts; for (let i = 1; i < q.length; i++) for (let u = 0; u < 6; u++) ps.push([q[i - 1][0] + (q[i][0] - q[i - 1][0]) * u / 6, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * u / 6]); ps.push(q[q.length - 1]); tierra(ps, 10); });

  /* río: orilla húmeda, agua, reflejos */
  { const a = RIO_W, ry = rio, x0 = X0, x1 = X1;
    const banda = (d, col, bl) => { c.save(); c.fillStyle = col; if (bl) { c.shadowColor = col; c.shadowBlur = bl * S; } c.beginPath(); c.moveTo(x0, ry(x0) - d); c.lineTo(x1, ry(x1) - d); c.lineTo(x1, ry(x1) + d); c.lineTo(x0, ry(x0) + d); c.closePath(); c.fill(); c.restore(); };
    banda(a + 12, 'rgba(206,186,128,.8)', 8); banda(a + 5, '#6e7a45', 4); banda(a + 1.5, '#4d5a3a');
    c.save(); c.beginPath(); c.moveTo(x0, ry(x0) - a); c.lineTo(x1, ry(x1) - a); c.lineTo(x1, ry(x1) + a); c.lineTo(x0, ry(x0) + a); c.closePath(); c.clip();
    let g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#3f7f90'); g.addColorStop(.5, '#4e92a0'); g.addColorStop(1, '#3a7488'); c.fillStyle = g; c.fillRect(x0, 400, REGION.w, 500);
    for (let i = 0; i < 45; i++) { const x = rr(x0, x1), y = ry(x) + rr(-a, a); blob(x, y, rr(10, 26), R() < .5 ? 'hsla(190,45%,62%,A)' : 'hsla(205,50%,30%,A)', .3); }
    for (let i = 0; i < 190; i++) { const x = rr(x0, x1), y = ry(x) + rr(-a + 3, a - 3), l = rr(5, 18); c.save(); c.translate(x, y); c.rotate(RIO_ANG * Math.PI / 180); c.strokeStyle = R() < .6 ? `rgba(230,244,236,${rr(.2, .5)})` : `rgba(240,200,130,${rr(.15, .35)})`; c.lineWidth = rr(.6, 1.6); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l / 2, rr(-1.2, 1.2), l, 0); c.stroke(); c.restore(); }
    c.strokeStyle = 'rgba(20,50,60,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, ry(x0) + a - 1); c.lineTo(x1, ry(x1) + a - 1); c.stroke();
    c.restore(); }

  /* calles de la ciudad */
  E.calles.forEach(cl => { const ps = ptsCalle(cl.pts), w = cl.ancho; if (cl.tipo === 'tierra') tierra(ps, w); else { trazo(ps, w + 3, 'rgba(110,95,60,.4)', 3); trazo(ps, w + 1, '#9d9174'); trazo(ps, w - 1, '#c3b898'); trazo(jit(ps, .5), w * .5, 'rgba(240,232,205,.5)', 1.5); for (let i = 0; i < ps.length; i++) { c.fillStyle = 'rgba(90,80,55,.4)'; c.fillRect(ps[i][0] + rr(-w / 2, w / 2), ps[i][1] + rr(-w / 2, w / 2), 1.6, 1); } } });
  flores.forEach(([x, y, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, .9, 0, 7); c.arc(x + 2, y + 1, .8, 0, 7); c.arc(x - 1.5, y + 1.8, .8, 0, 7); c.fill(); });
  return cv;
}

/* ---------- acuarela: máscara suave -> umbral con ruido -> borde de pigmento ---------- */
const ruido = (x, y) => .5 + .25 * Math.sin(x * .09 + Math.sin(y * .07) * 2.1) + .15 * Math.sin(y * .13 - x * .05 + 1.3) + .1 * Math.sin((x + y) * .31);
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function campo(pts, r, desen, k = 1.5) { // pts [[x,y,r?]] -> máscara con caja propia
  const m = r + desen * 3 + 4; let a = 1e9, b = 1e9, c2 = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0] - (p[2] || r)); c2 = Math.max(c2, p[0] + (p[2] || r)); b = Math.min(b, p[1] - (p[2] || r)); d = Math.max(d, p[1] + (p[2] || r)); }
  const ox = a - m, oy = b - m, w = Math.ceil((c2 - a + 2 * m) * k), h = Math.ceil((d - b + 2 * m) * k), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  g.filter = `blur(${desen * k}px)`; g.fillStyle = '#fff'; for (const p of pts) { g.beginPath(); g.arc((p[0] - ox) * k, (p[1] - oy) * k, (p[2] || r) * k, 0, 7); g.fill(); }
  return { ox, oy, w, h, k, d: g.getImageData(0, 0, w, h).data };
}
function acuarela(c, m, rgb, o) { // o: alfa (relleno), borde (alfa del borde), ancho (del borde, 0..1), grano
  const im = new ImageData(m.w, m.h), q = im.data, dk = [rgb[0] * .5, rgb[1] * .55, rgb[2] * .6], { alfa = .35, borde = .7, ancho = .13, grano = .12, bajo = .42 } = o;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const v = m.d[(y * m.w + x) * 4 + 3] / 255; if (v < .15) continue; const X = m.ox + x / m.k, Y = m.oy + y / m.k, n = ruido(X, Y), v2 = v + (n - .5) * .3 + (ruido(X * 2.3 + 9, Y * 2.3) - .5) * .08;
    if (v2 < bajo) continue; const t = (v2 - bajo) / ancho, edge = 1 - sm(t), fuera = sm((v2 - bajo) / .035), gr = 1 + (((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) - .5) * 2 * grano;
    const pincel = .55 + .45 * ruido(X * 1.7 + 40, Y * 1.7), ai = alfa * (.78 + .3 * sm((v2 - bajo) / .5)) * gr, ab = edge * borde * pincel, a = Math.min(1, ai + ab * (1 - ai)), i = (y * m.w + x) * 4, mix = ab / (ai + ab + 1e-6);
    q[i] = rgb[0] + (dk[0] - rgb[0]) * mix; q[i + 1] = rgb[1] + (dk[1] - rgb[1]) * mix; q[i + 2] = rgb[2] + (dk[2] - rgb[2]) * mix; q[i + 3] = 255 * a * fuera;
  }
  const t = document.createElement('canvas'); t.width = m.w; t.height = m.h; t.getContext('2d').putImageData(im, 0, 0); c.drawImage(t, m.ox, m.oy, m.w / m.k, m.h / m.k);
}
export const COL_NEC = { agua: [58, 146, 220], limpieza: [60, 176, 160], salud: [222, 90, 126], alimentacion: [226, 164, 44], trabajo: [150, 110, 62], cultura: [140, 92, 204], culto_ocio: [214, 120, 52], orden: [96, 110, 190] };
export const COL_EST = { bien: [92, 176, 66], falta: [232, 168, 40], mal: [214, 66, 48] };

/* op: { nec, base (áreas ya existentes), nueva (área de la fuente que se coloca), barrios: {id: estado} o null, brillo: id de barrio, cielo } */
export function pintarCapas(E, Z, op) {
  const [cv, c] = lienzo(), CELDA = Z.CELDA, tipos = Z.NEC[op.nec] || [];
  const celdasPts = set => { const p = []; for (const k of set) p.push([(k % Z.W + .5) * CELDA, (Math.floor(k / Z.W) + .5) * CELDA]); return p; };
  if (op.base !== false && op.nec) for (const sv of Z.serv) if (tipos.includes(sv.tipo)) acuarela(c, campo(celdasPts(sv.celdas), 14, 5), COL_NEC[op.nec], { alfa: op.nueva ? .24 : .3, borde: .6 }); // una mancha por servicio: al solaparse se ven los pigmentos sumarse
  if (op.nueva) { acuarela(c, campo(celdasPts(new Set(Z.nuevo.celdas)), 14, 5), COL_NEC.agua, { alfa: .5, borde: .9, ancho: .16 });
    c.save(); c.setLineDash([3, 2.5]); c.lineWidth = 1.6; c.strokeStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 6; c.beginPath(); c.arc(Z.nuevo.x, Z.nuevo.y, 11, 0, 7); c.stroke(); c.restore(); }
  if (op.barrios) for (const b of E.barrios) {
    const est = op.barrios[b.id] || b.estado, pts = E.casas.filter(h => h.barrio === b.id).map(h => [h.w ? h.x + h.w / 2 : h.x, h.h ? h.y + h.h / 2 : h.y]);
    if (op.brillo === b.id) acuarela(c, campo(pts, 27, 8), [255, 250, 225], { alfa: .0, borde: .9, ancho: .1, bajo: .46, grano: 0 });
    acuarela(c, campo(pts, 20, 7), COL_EST[est], { alfa: op.barrioAlfa || .24, borde: .88, ancho: .09, bajo: .48, grano: .1 });
  }
  return cv;
}
