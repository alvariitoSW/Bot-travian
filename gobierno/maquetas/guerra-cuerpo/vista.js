/* Maqueta GM2 — vista de águila en canvas 2D. Dibuja lo que dice retrato(B); no decide nada. */
import * as R from './reglas.js';
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const ctl = { rapido: Math.max(0.1, +Q.get('rapido') || 1), pausa: false };
const lienzo = $('lienzo'), ctx = lienzo.getContext('2d');
const ROJO = '#c23a2e', PURP = '#7b5bb5';
let W = 0, H = 0, dpr = 1, B = null, rival = Q.get('rival') === 'cartago' ? 'cartago' : 'pirro', semilla = +Q.get('semilla') || 7;
let sel = 1, nEv = 0, tocado = false, pausaSalir = false, cintaHasta = 0, cartaClave = '', fichas = [], cuadro = {}, proy = [], T = 0;
const L = { S: 1, kx: 1, cx: 0, y0: 0, abajo: 0 };

function medir() {
  dpr = Q.get('dpr') ? +Q.get('dpr') : Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); lay();
}
function lay() {
  const vert = H >= W, m = $('mando').getBoundingClientRect();
  const arriba = vert ? 100 : 6, abajo = (m.height ? m.top : H - 180) - 6, etiq = 58, ZR = 190, libre = abajo - arriba - etiq;
  const S = Math.min(vert ? (W - 12) / 210 : W * 0.5 / 210, libre / ZR);
  L.S = S; L.kx = vert ? 1 : Math.max(1, Math.min(2.2, (W * 0.5 / 210) / S)); L.abajo = abajo; L.cx = vert ? W / 2 : W * 0.42; L.y0 = arriba + etiq + ZR * S / 2 + Math.max(0, (libre - ZR * S) / 2);
}
window.addEventListener('resize', medir);

/* ---- disposición de los puntos de cada línea, según su formación ---- */
const FORM = {
  falange: { cols: 12, dx: 3.9, dy: 2.5 }, manipulos: { cols: 12, dx: 3.2, dy: 3.2, grupo: 4, hueco: 7 }, cerrada: { cols: 14, dx: 3.3, dy: 2.4 },
  tropel: { cols: 11, dx: 4.4, dy: 3.4, sac: 1.3 }, tiro: { dx: 4.6, dy: 3.6 }, ligera: { cols: 8, dx: 6, dy: 6, sac: 2.4 }, hilera: { dx: 8, dy: 4 },
};
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
const disp = {};
function disposicion(tipo, max) {
  const k = tipo + max; if (disp[k]) return disp[k];
  const T0 = R.TROPAS[tipo], F = R.FORMACIONES[T0.forma], por = T0.cadaFigura || 6, nd = Math.max(1, Math.ceil(max / por)), f = FORM[T0.forma];
  const hondoMax = Math.max(1, Math.min(F.filas, Math.ceil(max / (T0.cadaFigura || 1) / 4))) * F.paso;
  let cols = Math.min(f.cols || nd, nd), dx = f.dx;
  if (T0.forma === 'tiro') { cols = Math.ceil(nd / 2); dx = Math.min(4.6, 50 / cols); }
  if (T0.forma === 'hilera') { cols = nd; dx = Math.min(8, 56 / cols); }
  const filas = Math.ceil(nd / cols), dy = Math.min(f.dy, (hondoMax + 4) / filas), pts = [];
  for (let i = 0; i < nd; i++) {
    const r = Math.floor(i / cols), c = i % cols; let lx = (c - (cols - 1) / 2) * dx, ly = (r - (filas - 1) / 2) * dy;
    if (f.grupo) { const g = Math.floor(c / f.grupo), ng = Math.ceil(cols / f.grupo); lx += (g - (ng - 1) / 2) * f.hueco; if (r % 2) lx += dx / 2; }
    if (f.sac) { lx += (hash(i * 7 + 1) - 0.5) * 2 * f.sac; ly += (hash(i * 13 + 5) - 0.5) * 2 * f.sac; }
    pts.push({ lx, ly, r, rank: 0 });
  }
  const orden = pts.map((_, i) => i).sort((a, b) => hash(a * 31 + 3) - hash(b * 31 + 3)); orden.forEach((i, j) => { pts[i].rank = j; });
  return (disp[k] = { pts, por, dx, dy });
}

/* ---- dibujo de una línea ---- */
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
function dibujaFicha(f) {
  const S = L.S, d = disposicion(f.tipo, f.max), nd = Math.ceil(f.hombres / d.por), sgn = f.lado === 0 ? 1 : -1;
  const px = L.cx + f.x * S * L.kx, py = L.y0 + f.z * S;
  const side = f.sector === 0 ? -1 : 1, ang = f.mira ? (f.mira === 180 ? Math.PI : (f.mira * Math.PI / 180) * side * (f.lado === 0 ? 1 : -1)) : 0;
  const fwd = rot(0, -sgn, ang), huye = f.hace === 'huye', lucha = f.hace === 'lucha';
  const lig = f.forma === 'ligera' || f.forma === 'tiro';
  const col = f.lado === 0 ? (lig ? '#e5806f' : ROJO) : (lig ? '#a98fd8' : PURP);
  const rd = f.forma === 'hilera' ? 2.6 * S : Math.max(1.6, 0.5 * Math.min(d.dx, d.dy || d.dx) * S * (f.forma === 'ligera' ? 0.7 : 1));
  const clave = f.lado + '_' + f.sector + '_' + f.linea; let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
  ctx.globalAlpha = huye ? 0.3 : f.linea > 0 ? 0.6 : 1;
  const hacia = f.sector === 0 ? -1 : 1;
  for (let i = 0; i < d.pts.length; i++) {
    const p = d.pts[i]; if (p.rank >= nd) continue;
    let ox = p.lx * S * L.kx, oy = sgn * p.ly * S;
    if (lucha && f.linea === 0 && p.r < 2) oy += -sgn * (0.5 + Math.sin(T * 11 + i * 1.7)) * 1.1 * S;
    if (huye) ox += Math.sin(T * 3 + i) * 1.5 * S;
    if (ang) [ox, oy] = rot(ox, oy, ang);
    const x = px + ox, y = py + oy; mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y);
    ctx.fillStyle = col;
    if (f.forma === 'hilera') {
      ctx.beginPath(); ctx.ellipse(x, y, rd, rd * 0.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#d9cfa8'; ctx.beginPath(); ctx.arc(x + fwd[0] * rd, y + fwd[1] * rd, rd * 0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#d9cfa8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + fwd[0] * rd, y + fwd[1] * rd); ctx.lineTo(x + fwd[0] * rd * 2, y + fwd[1] * rd * 2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x, y, rd, 0, 7); ctx.fill();
      let largo = 0;
      if (f.forma === 'falange' && p.r < 2) largo = 6.5; else if (f.arma === 'lanza' && p.r === 0) largo = 3.4;
      if (largo) { ctx.strokeStyle = 'rgba(235,225,190,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + fwd[0] * largo * S, y + fwd[1] * largo * S); ctx.stroke(); }
    }
  }
  ctx.globalAlpha = 1;
  if (mnx > mxx) { mnx = mxx = px; mny = mxy = py; }
  const b = { mnx: mnx - rd, mxx: mxx + rd, mny: mny - rd, mxy: mxy + rd, cx: (mnx + mxx) / 2, cy: (mny + mxy) / 2 };
  cuadro[clave] = b;
  if (f.linea === 1 && f.mira && f.hombres > 0) {
    ctx.fillStyle = 'rgba(233,192,99,.95)'; ctx.font = '700 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('\u{1F6E1} cubre', b.cx + hacia * 0, b.mny - 4);
  }
}

/* ---- flechas de flanco ---- */
function flecha(x0, y0, x1, y1, col, ancho) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, h = ancho * 2.1, cuello = l - h;
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x0 + nx * ancho / 2, y0 + ny * ancho / 2); ctx.lineTo(x0 + ux * cuello + nx * ancho / 2, y0 + uy * cuello + ny * ancho / 2);
  ctx.lineTo(x0 + ux * cuello + nx * h * 0.8, y0 + uy * cuello + ny * h * 0.8); ctx.lineTo(x1, y1);
  ctx.lineTo(x0 + ux * cuello - nx * h * 0.8, y0 + uy * cuello - ny * h * 0.8); ctx.lineTo(x0 + ux * cuello - nx * ancho / 2, y0 + uy * cuello - ny * ancho / 2);
  ctx.lineTo(x0 - nx * ancho / 2, y0 - ny * ancho / 2); ctx.closePath(); ctx.fill();
}
function peligros() {
  for (const f of fichas) {
    if (f.linea !== 0 || !f.peligro || (f.peligro.costado <= 0 && f.peligro.espalda <= 0) || f.hace === 'huye') continue;
    const b = cuadro[f.lado + '_' + f.sector + '_0']; if (!b) continue;
    const roma = f.lado === 0, pul = 0.55 + 0.45 * Math.sin(T * 8), rgb = roma ? '226,64,48' : '236,200,90', col = 'rgba(' + rgb + ',' + (0.7 + 0.3 * pul) + ')';
    ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.5 + 0.5 * pul) + ')'; ctx.lineWidth = 1.5 + 2 * pul; ctx.setLineDash([]);
    ctx.beginPath(); ctx.roundRect(b.mnx - 5, b.mny - 5, b.mxx - b.mnx + 10, b.mxy - b.mny + 10, 6); ctx.stroke();
    const S = L.S, mov = 7 * (1 - pul), largo = 52 + 8 * S;
    if (f.peligro.costado > 0) {
      const side = f.sector === 0 ? -1 : 1, xb = side > 0 ? b.mxx + 5 : b.mnx - 5, yy = (b.mny + b.mxy) / 2;
      flecha(xb + side * (largo - mov), yy, xb + side * 2 * 0, yy, col, 10); ctx.lineWidth = 1;
    }
    if (f.peligro.espalda > 0) {
      const xx = b.cx;
      if (roma) flecha(xx, b.mxy + largo - mov, xx, b.mxy + 5, col, 10); else flecha(xx, b.mny - largo + mov, xx, b.mny - 5, col, 10);
    }
  }
}

/* ---- proyectiles ---- */
function lanza(lado, sect, arma, n, dur, retardo, delante) {
  const fi = fichas.find(f => f.lado === lado && f.sector === sect && f.hombres > 0 && (delante ? f.linea === 0 : f.arma === arma));
  const a = fi && cuadro[lado + '_' + sect + '_' + fi.linea], e = cuadro[(1 - lado) + '_' + sect + '_0']; if (!a || !e) return;
  const yFrente = lado === 0 ? e.mxy : e.mny;
  for (let i = 0; i < n; i++) {
    const x0 = a.mnx + Math.random() * (a.mxx - a.mnx), y0 = a.mny + Math.random() * (a.mxy - a.mny), x1 = e.mnx + Math.random() * (e.mxx - e.mnx), y1 = yFrente + (lado === 0 ? 1 : -1) * Math.random() * 10;
    proy.push({ x0, y0, x1, y1, u: -Math.random() * retardo, dur, arco: Math.min(70, Math.hypot(x1 - x0, y1 - y0) * 0.38), jab: arma === 'jabalina' });
  }
}
function dibujaProy(dt) {
  for (const p of proy) {
    p.u += dt / p.dur; if (p.u < 0 || p.u > 1.15) continue;
    const pos = u => { const v = Math.min(1, u); return [p.x0 + (p.x1 - p.x0) * v, p.y0 + (p.y1 - p.y0) * v - p.arco * 4 * v * (1 - v)]; };
    const a = pos(p.u - (p.jab ? 0.12 : 0.07)), b = pos(p.u);
    ctx.strokeStyle = p.jab ? 'rgba(255,233,168,.95)' : 'rgba(235,228,205,.8)'; ctx.lineWidth = p.jab ? 2 : 1;
    ctx.globalAlpha = p.u > 1 ? Math.max(0, 1 - (p.u - 1) * 7) : 1;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.globalAlpha = 1; proy = proy.filter(p => p.u < 1.15);
}

/* ---- caballería ---- */
function camino(pts, p) {
  p = Math.max(0, Math.min(1, p)); const ls = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); ls.push(l); tot += l; }
  let r = p * tot; for (let i = 0; i < ls.length; i++) { if (r <= ls[i] || i === ls.length - 1) { const u = ls[i] ? Math.min(1, r / ls[i]) : 1; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; } r -= ls[i]; }
  return pts[pts.length - 1];
}
const sx = i => L.cx + (i - 1) * R.ANCHO_SECTOR * L.S * L.kx;
function rangoY(lado, i) { let mn = 1e9, mx = -1e9; for (let k = 0; k < 4; k++) { const b = cuadro[lado + '_' + i + '_' + k]; if (b) { mn = Math.min(mn, b.mny); mx = Math.max(mx, b.mxy); } } return [mn, mx]; }
function rombo(x, y, r, col) { ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.25); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
function caballeria() {
  const S = L.S, k = B.cab; let rr = 0; for (let i = 0; i < 3; i++) rr = Math.max(rr, rangoY(0, i)[1]); if (rr <= 0) rr = L.y0 + 80 * S;
  const home = [L.cx, Math.min(rr + 16, L.abajo - 8)];
  let ruta = [home, home], p = 0;
  if (k.estado !== 'lista' && k.sect >= 0) {
    const i = k.sect, side = i === 0 ? -1 : 1, e = cuadro['1_' + i + '_0'], r0 = rangoY(0, i), re = rangoY(1, i); if (!e) return;
    const xo = sx(i) + side * 46 * S * L.kx;
    if (k.por === 'espalda') ruta = [home, [xo, r0[0] - 10], [xo, re[0] - 14], [sx(i), re[0] - 12]];
    else ruta = [home, [xo, r0[0] + 10], [side > 0 ? e.mxx + 8 : e.mnx - 8, e.cy]];
    const tt = k.por === 'espalda' ? 4 : 3;
    p = k.estado === 'yendo' ? 1 - k.t / tt : k.estado === 'cargando' ? 1 : 1 - Math.min(1, (17 - k.t) / 8);
  }
  const c = camino(ruta, p);
  for (let j = 0; j < 8; j++) {
    const ox = ((j % 4) - 1.5) * 9, oy = Math.floor(j / 4) * 9 + (k.estado === 'cargando' ? Math.sin(T * 14 + j) * 2 : 0);
    rombo(c[0] + ox, c[1] + oy, 4.3, k.estado === 'lista' ? '#e07a68' : '#ff9a85');
  }
  const n = B.num; if (n.estado === 'lejos' || n.sect < 0) return;
  const i = n.sect, side = i === 0 ? -1 : 1, r0 = rangoY(0, i); if (r0[1] < 0) return;
  const dest = [sx(i), Math.min(r0[1] + 12, L.abajo - 6)];
  let c2;
  if (n.estado === 'llega') c2 = camino([[sx(i) + side * 75 * S * L.kx, L.y0 - 85 * S], [sx(i) + side * 58 * S * L.kx, L.y0 + 10 * S], dest], 1 - n.t / 5);
  else c2 = [dest[0] + Math.sin(T * 2.2) * 16, dest[1] + Math.cos(T * 3) * 4];
  for (let j = 0; j < 8; j++) rombo(c2[0] + ((j % 4) - 1.5) * 8 + Math.sin(T * 5 + j) * 2, c2[1] + Math.floor(j / 4) * 8, 3.6, '#a58ad6');
}

/* ---- escena ---- */
const hierba = Array.from({ length: 90 }, (_, i) => [hash(i * 3 + 1), hash(i * 5 + 2), 2 + hash(i) * 4]);
function dibuja(dt) {
  const S = L.S; ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#34301d'); g.addColorStop(1, '#2a2716'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,110,60,.35)'; ctx.lineWidth = 1; for (const [a, b, l] of hierba) { const x = a * W, y = b * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y - l); ctx.stroke(); }
  ctx.setLineDash([5, 7]); ctx.strokeStyle = 'rgba(184,134,43,.28)';
  for (const k of [-0.5, 0.5]) { const x = L.cx + k * R.ANCHO_SECTOR * S * L.kx; ctx.beginPath(); ctx.moveTo(x, L.y0 - 98 * S); ctx.lineTo(x, L.y0 + 98 * S); ctx.stroke(); }
  ctx.setLineDash([]);
  fichas = R.retrato(B); cuadro = {};
  const orden = fichas.slice().sort((a, b) => b.linea - a.linea);
  for (const f of orden) dibujaFicha(f);
  /* sector elegido */
  if (B.fase !== 'fin' && !B.sect[sel].c[0].roto) {
    const r = rangoY(0, sel); ctx.strokeStyle = 'rgba(233,192,99,.55)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(sx(sel) - 36 * S * L.kx, r[0] - 6, 72 * S * L.kx, r[1] - r[0] + 12, 8); ctx.stroke(); ctx.setLineDash([]);
  }
  /* chispas del choque */
  for (const s of B.sect) {
    if (s.dist > 3 || s.c[0].roto || s.c[1].roto) continue;
    const a = cuadro['0_' + s.i + '_0'], e = cuadro['1_' + s.i + '_0']; if (!a || !e) continue;
    const y = (a.mny + e.mxy) / 2, x0 = Math.min(a.mnx, e.mnx), x1 = Math.max(a.mxx, e.mxx);
    ctx.fillStyle = 'rgba(255,220,140,' + (0.18 + 0.12 * Math.sin(T * 20)) + ')'; ctx.fillRect(x0, y - 2, x1 - x0, 4);
    for (let i = 0; i < 14; i++) { const x = x0 + Math.random() * (x1 - x0), l = 2 + Math.random() * 5, an = Math.random() * 6.3; ctx.strokeStyle = Math.random() < 0.5 ? '#fff3c4' : '#ffb347'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + (Math.random() - 0.5) * 6); ctx.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); ctx.stroke(); }
  }
  peligros(); caballeria(); dibujaProy(dt);
}

/* ---- rótulos del enemigo ---- */
const pend = [];
for (let i = 0; i < 3; i++) { const d = document.createElement('div'); d.className = 'pend'; d.innerHTML = '<span class="n"></span><small></small><em></em><u></u><i><b></b></i>'; $('pendones').appendChild(d); pend.push(d); }
const cap = t => t[0].toUpperCase() + t.slice(1);
function pintarPendones() {
  B.sect.forEach((s, i) => {
    const e = s.c[1], d = pend[i]; if (e.roto || B.fase === 'fin') { d.hidden = true; return; } d.hidden = false;
    const l = R.frente(e), Tt = R.TROPAS[l.tipo], fi = fichas.find(f => f.lado === 1 && f.sector === i && f.linea === 0);
    const re = rangoY(1, i), fl = l.fatiga > 0.6, aire = e.flanco.espalda > 0 ? 'cogidos por la espalda' : e.flanco.costado > 0 ? 'costado al aire' : '';
    const cls = 'pend' + (e.postura === 'empujar' ? ' carga' : fl ? ' flaquea' : '') + (aire ? ' aire' : ''), txt = e.postura === 'empujar' ? 'cargan' : fl ? 'flaquean' : 'aguantan';
    if (d.className !== cls) d.className = cls;
    const [n, sm, es, au, br] = d.children; const nn = cap(Tt.n), ss = Tt.arma === 'elefante' ? 'bestias · hilera' : R.ARMAS[Tt.arma].n + ' · ' + R.FORMACIONES[Tt.forma].n;
    if (n.textContent !== nn) n.textContent = nn; if (sm.textContent !== ss) sm.textContent = ss; if (es.textContent !== txt) es.textContent = txt;
    au.textContent = aire; au.hidden = !aire; br.firstChild.style.width = Math.round(100 * Math.max(0, e.moral)) + '%';
    const y = (isFinite(re[0]) && re[0] < 1e8 ? re[0] : L.y0 - 80 * L.S) - 6;
    d.style.transform = 'translate(' + Math.round(sx(i) - 48) + 'px,' + Math.round(y) + 'px) translateY(-100%)';
    void fi;
  });
}

/* ---- tarjetas y órdenes ---- */
const tinte = f => f < 0.45 ? 'var(--verde)' : f < 0.75 ? 'var(--ambar)' : 'var(--rojo)';
function pintarCartas(fuerza) {
  let h = '';
  B.sect.forEach((s, i) => {
    const c = s.c[0], l = R.frente(c), alerta = !c.roto && c.lineas.length > 1 && c.relevo <= 0 && (l.fatiga > 0.75 || l.hombres < 0.4 * l.max) && c.lineas[1].fatiga < 0.5;
    const acoso = (B.num.estado === 'llega' || B.num.estado === 'hostiga') && B.num.sect === i; c.alerta = alerta; c.acoso = acoso;
    const mal = !c.roto && (c.flanco.espalda > 0 ? 'ESPALDA' : c.flanco.costado > 0 ? 'COSTADO' : '');
    const Tt = R.TROPAS[l.tipo];
    h += '<button class="cuerpo' + (i === sel ? ' sel' : '') + (c.roto ? ' roto' : '') + (alerta || acoso || mal ? ' alerta' : '') + '" data-i="' + i + '"><span class="nom' + (mal ? ' mal' : '') + '">' + (mal || R.NOMBRE_SECTOR[i]) + '</span>'
      + (c.roto ? '<span class="nom">ha huido</span>' : '<span class="escudos">' + (acoso ? '<span class="acoso">♞</span>' : '') + c.lineas.map(x => '<span class="esc"><b style="height:' + Math.round(100 * x.hombres / x.max) + '%;background:' + tinte(x.fatiga) + '"></b></span>').join('') + '</span><span class="tro">' + cap(Tt.n) + ' · ' + R.ARMAS[Tt.arma].n + '</span><span class="moral"><b style="width:' + Math.round(100 * Math.max(0, c.moral)) + '%"></b></span>') + '</button>';
  });
  if (fuerza || h !== cartaClave) { $('cuerpos').innerHTML = h; cartaClave = h; }
  const c = B.sect[sel].c[0];
  document.querySelectorAll('.orden').forEach(b => {
    const o = b.dataset.o, no = R.puede(B, sel, o), activa = !c.roto && c.postura === o, sub = b.querySelector('.sub');
    b.classList.toggle('activa', activa); b.classList.toggle('no', !!no && !activa);
    let pide = !no && ((o === 'relevo' && c.alerta) || (!tocado && B.t > 2 && o === 'empujar'));
    if (o === 'relevo') sub.textContent = c.roto || c.lineas.length < 2 ? 'no queda nadie' : c.relevo > 0 ? 'relevando…' : 'entran ' + R.TROPAS[c.lineas[1].tipo].n;
    if (o === 'caballeria') {
      const k = B.cab, falta = k.estado === 'yendo' ? k.t + 21 : k.estado === 'cargando' ? k.t + 17 : k.t;
      if (k.estado === 'lista') { const oc = R.ocasion(B, sel); sub.textContent = oc === 'espalda' ? '¡por la espalda!' : oc === 'jinetes' ? 'espanta a los jinetes' : 'carga al costado'; if (!no && (oc === 'espalda' || oc === 'jinetes')) pide = true; }
      else sub.textContent = k.estado === 'volviendo' || k.estado === 'cargando' ? 'vuelve en ' + Math.ceil(falta) + ' s' : 'cargando…';
    }
    b.classList.toggle('pide', pide);
  });
}

/* ---- eventos, cinta, fin ---- */
function cinta(texto, tono) { const c = $('cinta'); c.textContent = texto; c.className = 've' + (tono ? ' ' + tono : ''); cintaHasta = performance.now() + 2800; }
const MALOS = ['carga-enemiga', 'numidas-aviso', 'cansados', 'linea-deshecha'];
function eventos() {
  for (; nEv < B.eventos.length; nEv++) {
    const e = B.eventos[nEv];
    if (e.tipo === 'salva') { lanza(e.lado, e.sect, e.arma, e.arma === 'arco' ? 22 : 7, e.arma === 'arco' ? 1.1 : 0.6, 0.35); continue; }
    if (e.tipo === 'pila') { lanza(e.lado, e.sect, 'jabalina', 9, 0.35, 0.15, true); continue; }
    if (e.tipo === 'orden') continue;
    if (e.tipo === 'fin') { fin(); continue; }
    if (e.tipo === 'caballeria-lista') { if (performance.now() > cintaHasta) cinta(e.texto); continue; }
    if (!e.texto) continue;
    let mala = MALOS.includes(e.tipo) || (e.tipo === 'roto' && e.lado === 0), buena = ['enemigo-cede', 'impacto', 'numidas-fuera', 'cubre'].includes(e.tipo) || (e.tipo === 'roto' && e.lado === 1);
    if (['flanco', 'envuelve', 'estampida'].includes(e.tipo)) { mala = e.lado === 0; buena = e.lado === 1; }
    if (e.tipo === 'calles') { buena = e.texto.startsWith('Abres'); mala = !buena; }
    cinta(e.texto, mala ? 'mala' : buena ? 'buena' : '');
    if (e.tipo === 'roto' && e.lado === 0 && e.sect === sel) { const j = [1, 0, 2].find(k => !B.sect[k].c[0].roto); if (j !== undefined) sel = j; }
  }
}
function fin() {
  const r = B.resultado, t = { victoria: 'Victoria', derrota: 'Derrota', retirada: 'Retirada' }[r.como], m = Math.floor(r.t / 60), s = Math.round(r.t % 60);
  $('fin-t').textContent = t; $('fin-t').style.color = r.como === 'victoria' ? 'var(--oro)' : '#e0937f'; $('fin-p').textContent = r.motivo;
  $('fin-c').innerHTML = '<span>Tus bajas</span><b>' + r.bajas[0] + ' de ' + r.inicial[0] + '</b><span>Bajas enemigas</span><b>' + r.bajas[1] + ' de ' + r.inicial[1] + '</b><span>Duración</span><b>' + m + ' min ' + s + ' s</b>';
  const ver = () => { if (B.fase !== 'fin') return; $('fin').hidden = false; $('mando').hidden = true; $('retirar').hidden = true; $('cinta').className = ''; };
  setTimeout(ver, r.como === 'retirada' ? 0 : 1600);
}
function ordenar(o) {
  const no = R.ordenar(B, sel, o); tocado = true;
  if (no) cinta(no); else if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* sin vibración */ } }
  pintarCartas(); eventos();
}
function elegir(i) { if (i === sel || B.fase === 'fin') return; sel = i; pintarCartas(); }
$('ordenes').addEventListener('click', e => { const b = e.target.closest('.orden'); if (b) ordenar(b.dataset.o); });
$('cuerpos').addEventListener('click', e => { const b = e.target.closest('.cuerpo'); if (b) elegir(+b.dataset.i); });
$('retirar').addEventListener('click', () => { if (B.fase === 'fin') return; pausaSalir = true; $('salir').hidden = false; });
$('salir-no').addEventListener('click', () => { pausaSalir = false; $('salir').hidden = true; });
$('salir-si').addEventListener('click', () => { pausaSalir = false; $('salir').hidden = true; R.retirarse(B); eventos(); });
$('otra').addEventListener('click', () => { rival = rival === 'pirro' ? 'cartago' : 'pirro'; semilla = Math.floor(Math.random() * 1e6) + 1; montar(); });
lienzo.addEventListener('pointerup', e => {
  if (pausaSalir || B.fase === 'fin') return; const i = Math.round((e.clientX - L.cx) / (R.ANCHO_SECTOR * L.S * L.kx)) + 1;
  if (i >= 0 && i <= 2 && Math.abs(e.clientX - sx(i)) < 36 * L.S * L.kx && !B.sect[i].c[0].roto) elegir(i);
});

function montar() {
  B = R.nueva(semilla, { rival }); nEv = 0; sel = 1; tocado = false; proy = []; fichas = []; cuadro = {}; cartaClave = '';
  $('fin').hidden = true; $('mando').hidden = false; $('retirar').hidden = false; $('cinta').className = '';
  $('rival').textContent = 'Contra ' + (rival === 'cartago' ? 'Cartago' : 'Pirro de Epiro');
  pintarCartas(true); lay();
}

let ultimo = performance.now(), tHud = 0;
function marco(ahora) {
  requestAnimationFrame(marco);
  const dtR = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora; T = ahora / 1000; let dtJ = 0;
  if (!ctl.pausa && !pausaSalir && B.fase !== 'fin') { let resto = dtR * ctl.rapido; dtJ = resto; while (resto > 1e-6) { const d = Math.min(0.1, resto); R.paso(B, d); resto -= d; } }
  dibuja(dtJ); eventos(); pintarPendones();
  if (ahora - tHud > 150) { tHud = ahora; pintarCartas(); if (ahora > cintaHasta) $('cinta').classList.remove('ve'); }
}
medir(); montar(); setTimeout(lay, 400);
requestAnimationFrame(marco);
Object.defineProperty(window, '__B', { get: () => B });
window.__ctl = ctl; window.__proy = () => proy.length;
window.__sel = i => { sel = i; pintarCartas(); };
