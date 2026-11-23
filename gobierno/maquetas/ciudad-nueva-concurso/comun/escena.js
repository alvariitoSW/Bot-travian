/* Datos de la ciudad (sin dibujar). Lienzo 390x844, vista desde arriba. Semilla fija: siempre sale igual.
   Uso: <script src="../comun/escena.js"></script> y luego window.ESCENA. */
(function () {
  const W = 390, H = 844, CX = 195, CY = 360, RX = 165, RY = 225;
  let s = 278146; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const f = n => Math.round(n * 10) / 10;
  const rio = x => 672 - 0.22 * x, RIO_W = 34, RIO_ANG = Math.atan(-0.22) * 180 / Math.PI;
  const dentro = (x, y, m = 0) => ((x - CX) / (RX - m)) ** 2 + ((y - CY) / (RY - m)) ** 2 < 1;
  const enRect = (x, y, r, m = 0) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
  const solapa = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  /* ---- foro y mercado ---- */
  const foro = { x: 128, y: 322, w: 134, h: 76,
    curia: { x: 134, y: 328, w: 42, h: 28 },
    comicio: { x: 160, y: 378, r: 14, gradas: 3 },
    templo: { x: 212, y: 326, w: 46, h: 34, porche: { x: 216, y: 360, w: 38, h: 10 }, frontonLado: 's' },
    fuente: { x: 214, y: 384, r: 6 }, columnas: [] };
  for (let i = 0; i <= 8; i++) foro.columnas.push([f(132 + i * 16.5), 324]);
  for (let i = 0; i <= 2; i++) { foro.columnas.push([132, 340 + i * 24], [258, 340 + i * 24]); }
  const mercado = { x: 153, y: 404, w: 84, h: 62, puestos: [] };
  const colTold = ['#b5472f', '#d0a53a', '#4f7f8f', '#8a9a4a', '#b5472f', '#e8dcc0'];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) mercado.puestos.push({ x: 158 + i * 13.2, y: 410 + r * 30, w: 11, h: 11, color: colTold[(i + r * 2) % 6] });
  const bloq = (x, y) => enRect(x, y, foro) || enRect(x, y, mercado);

  /* ---- barrios ---- */
  const nec = (o) => Object.assign({ alimentacion: 'bien', agua: 'bien', limpieza: 'bien', salud: 'bien', trabajo: 'bien', cultura: 'bien', culto_ocio: 'bien', orden: 'bien' }, o);
  const barrios = [
    { id: 'alto', nombre: 'Barrio alto', clase: 'patricios', nivel: 3, centro: [115, 205], vecinos: 640, necesidades: nec({}) },
    { id: 'mercado', nombre: 'Barrio del Mercado', clase: 'comerciantes', nivel: 3, centro: [275, 205], vecinos: 980, necesidades: nec({ orden: 'falta' }) },
    { id: 'oeste', nombre: 'Barrio de la Colina', clase: 'caballeros', nivel: 2, centro: [80, 355], vecinos: 760, necesidades: nec({ cultura: 'falta' }) },
    { id: 'este', nombre: 'Barrio del Granero', clase: 'artesanos', nivel: 2, centro: [310, 355], vecinos: 820, necesidades: nec({}) },
    { id: 'viejo', nombre: 'Barrio Viejo', clase: 'libertos', nivel: 2, centro: [268, 490], vecinos: 900, necesidades: nec({ limpieza: 'falta', culto_ocio: 'falta' }) },
    { id: 'rio', nombre: 'Barrio del río', clase: 'plebe', nivel: 1, centro: [140, 515], vecinos: 1200, necesidades: nec({ agua: 'falta', salud: 'falta', limpieza: 'mal' }) }
  ];
  const peor = b => { const v = Object.values(b.necesidades); return v.includes('mal') ? 'mal' : v.includes('falta') ? 'falta' : 'bien'; };
  barrios.forEach(b => { b.estado = peor(b); b.radio = 34; });

  /* ---- retícula de manzanas, algo torcida en la ladera ---- */
  const warpK = (x, y) => 0.35 + 0.9 * Math.min(1, Math.hypot((x - CX) / RX, (y - CY) / RY));
  const warp = (x, y) => { const k = warpK(x, y); return [x + 3.5 * k * Math.sin(y / 41 + 1), y + 3 * k * Math.sin(x / 33)]; };
  const xsB = [], ysB = [];
  for (let i = 0; i < 5; i++) { xsB.push(199 + 38 * i); xsB.push(159 - 38 * i); }
  for (let j = 0; j < 7; j++) { ysB.push(364 + 36 * j); ysB.push(326 - 36 * j); }
  let libres = [];
  for (const x0 of xsB) for (const y0 of ysB) {
    const [wx, wy] = warp(x0 + 16, y0 + 15); const b = { x: f(wx - 16), y: f(wy - 15), w: 32, h: 30 };
    const cs = [[b.x, b.y], [b.x + 32, b.y], [b.x, b.y + 30], [b.x + 32, b.y + 30]];
    if (!cs.every(([a, c]) => dentro(a, c, 4))) continue;
    if (solapa(b, foro) || solapa(b, mercado)) continue;
    let mejor = null, md = 1e9;
    for (const br of barrios) { const d = ((wx - br.centro[0]) / 1) ** 2 + ((wy - br.centro[1]) / 1) ** 2; if (d < md) { md = d; mejor = br; } }
    b.barrio = mejor.id; b.d = Math.hypot((wx - CX) / RX, (wy - CY) / RY); libres.push(b);
  }
  const tomar = (x, y, filtro) => { let m = null, md = 1e9; for (const b of libres) { if (filtro && !filtro(b)) continue; const d = Math.hypot(b.x + 16 - x, b.y + 15 - y); if (d < md) { md = d; m = b; } } libres = libres.filter(b => b !== m); return m; };
  const publicos = [];
  for (const [tipo, x, y] of [['granero', 312, 425], ['cuartel', 62, 470], ['almacen', 245, 548], ['termas', 122, 296]]) { const b = tomar(x, y); if (b) publicos.push({ tipo, x: b.x, y: b.y, w: 32, h: 30 }); }
  const huertos = [], jardines = [];
  const cand = () => libres.filter(b => b.barrio !== 'rio');
  for (let i = 0; i < 4; i++) { const c = cand().filter(b => b.d > 0.72); if (!c.length) break; const b = pick(c); libres = libres.filter(q => q !== b); huertos.push({ x: b.x, y: b.y, w: 32, h: 30 }); }
  for (let i = 0; i < 2; i++) { const c = cand().filter(b => b.d < 0.7 && b.d > 0.25); if (!c.length) break; const b = pick(c); libres = libres.filter(q => q !== b); jardines.push({ x: b.x, y: b.y, w: 32, h: 30 }); }

  /* ---- edificios de vivienda por nivel ---- */
  const casas = [];
  for (const b of libres) {
    const br = barrios.find(q => q.id === b.barrio), c = Math.floor(rnd() * 4);
    if (br.nivel === 1) {
      const n = 4 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) { const gx = k % 2, gy = Math.floor(k / 2) % 2; casas.push({ tipo: 'choza', x: f(b.x + 8.5 + gx * 15 + rnd() * 3 - 1.5), y: f(b.y + 7.5 + gy * 15 + rnd() * 3 - 1.5), r: f(5 + rnd() * 1.5), barrio: br.id, c }); }
    } else if (br.nivel === 2) {
      if (rnd() < 0.5) { casas.push({ tipo: 'atrio', x: b.x + 1, y: b.y + 1, w: 14, h: 28, barrio: br.id, c }, { tipo: 'atrio', x: b.x + 17, y: b.y + 1, w: 14, h: 28, barrio: br.id, c: (c + 1) % 4 }); }
      else casas.push({ tipo: 'atrio', x: b.x + 1, y: b.y + 1, w: 30, h: 13, barrio: br.id, c }, { tipo: 'atrio', x: b.x + 1, y: b.y + 16, w: 30, h: 13, barrio: br.id, c: (c + 1) % 4 });
    } else {
      const rica = br.id === 'alto' ? rnd() < 0.7 : rnd() < 0.2;
      casas.push(rica ? { tipo: 'rica', x: b.x, y: b.y + 1, w: 32, h: 28, barrio: br.id, c } : { tipo: 'insula', x: b.x, y: b.y + 1, w: 31, h: 27, pisos: 3, barrio: br.id, c });
    }
  }
  casas.sort((a, b) => (a.y + (a.h || 0)) - (b.y + (b.h || 0)));

  /* ---- calles ---- */
  const emped = (x, y) => ((x - 195) / 112) ** 2 + ((y - 385) / 100) ** 2 < 1;
  const calles = [];
  function trazar(pts, principal) {
    let run = null;
    for (const [x, y] of pts) {
      const [wx, wy] = warp(x, y);
      if (!dentro(wx, wy, 0) || bloq(wx, wy)) { run = null; continue; }
      const tipo = emped(wx, wy) ? 'empedrada' : 'tierra';
      if (run && run.tipo !== tipo) { const p = run.pts[run.pts.length - 1]; run = { tipo, ancho: principal ? 9 : 6, principal, pts: [p] }; calles.push(run); }
      if (!run) { run = { tipo, ancho: principal ? 9 : 6, principal, pts: [] }; calles.push(run); }
      run.pts.push([f(wx), f(wy)]);
    }
  }
  const linea = (fx, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(fx(i / n)); return o; };
  for (const x of [195, 156, 118, 80, 42, 234, 272, 310, 348]) trazar(linea(t => [x, CY - RY + t * 2 * RY], 40), x === 195);
  const hy = [360]; for (let k = 0; k < 7; k++) { hy.push(397 + 36 * k); hy.push(323 - 36 * k); }
  for (const y of hy) trazar(linea(t => [CX - RX + t * 2 * RX, y], 40), y === 360);
  const ronda = []; for (let a = 0; a < 360; a += 6) { const r = a * Math.PI / 180; ronda.push([f(CX + (RX - 9) * Math.cos(r)), f(CY + (RY - 9) * Math.sin(r))]); } ronda.push(ronda[0]);
  calles.push({ tipo: 'tierra', ancho: 5, principal: false, pts: ronda });
  const camino = [
    { pts: [[195, 135], [193, 90], [200, 40], [196, -10]] },
    { pts: [[30, 360], [10, 372], [-10, 386]] },
    { pts: [[360, 360], [378, 346], [400, 334]] },
    { pts: [[195, 585], [192, 640], [188, 700], [172, 780], [160, 860]] }
  ];

  /* ---- muralla ---- */
  const torres = [];
  for (let a = 0; a < 360; a += 15) {
    if ([0, 90, 180, 270].includes(a)) continue;
    const r = a * Math.PI / 180, x = CX + RX * Math.cos(r), y = CY + RY * Math.sin(r);
    torres.push({ x: f(x), y: f(y), ang: f(Math.atan2(RY * Math.cos(r), -RX * Math.sin(r)) * 180 / Math.PI), l: 12 });
  }
  const puertas = [{ id: 'norte', x: 195, y: CY - RY, ang: 0 }, { id: 'sur', x: 195, y: CY + RY, ang: 0 }, { id: 'oeste', x: CX - RX, y: CY, ang: 90 }, { id: 'este', x: CX + RX, y: CY, ang: 90 }];
  const muralla = { cx: CX, cy: CY, rx: RX, ry: RY, grosor: 8, torres, puertas };

  /* ---- exterior ---- */
  const campos = [
    { x: 4, y: 66, w: 100, h: 56, rot: -4, col: 0 }, { x: 110, y: 46, w: 112, h: 48, rot: 3, col: 1 }, { x: 236, y: 62, w: 120, h: 56, rot: -3, col: 2 },
    { x: 2, y: 170, w: 22, h: 300, rot: 0, col: 1, vert: true }, { x: 366, y: 180, w: 22, h: 290, rot: 0, col: 0, vert: true },
    { x: 4, y: 540, w: 78, h: 78, rot: 3, col: 2 }, { x: 4, y: 722, w: 130, h: 100, rot: 2, col: 0 }, { x: 205, y: 722, w: 86, h: 52, rot: -2, col: 1 },
    { x: 298, y: 684, w: 88, h: 64, rot: 0, col: 2 }, { x: 205, y: 786, w: 180, h: 52, rot: 1, col: 0 }
  ];
  const distSeg = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  const cercaCamino = (x, y, m) => camino.some(c => c.pts.some((p, i) => i && distSeg(x, y, c.pts[i - 1], p) < m));
  const casasRurales = [[146, 708], [190, 706], [330, 760], [30, 690], [338, 440], [48, 150]].map(([x, y]) => ({ tipo: 'casa', x, y, w: 14, h: 10, c: Math.floor(rnd() * 4) }));
  const arboles = [];
  for (let i = 0, n = 0; i < 4000 && n < 80; i++) {
    const x = rnd() * W, y = rnd() * H;
    if (dentro(x, y, -18) || Math.abs(y - rio(x)) < RIO_W + 10 || cercaCamino(x, y, 10)) continue;
    if (campos.some(c => enRect(x, y, c, 4))) continue;
    if (casasRurales.some(c => enRect(x, y, c, 8))) continue;
    arboles.push({ x: f(x), y: f(y), r: f(4 + rnd() * 3.5) }); n++;
  }
  arboles.sort((a, b) => a.y - b.y);
  const muelle = { quay: { x: 288, y: 556, w: 36, h: 12 }, pier: { x: 306, y: 566, w: 9, h: 36 } };
  const rx = (x) => rio(x);
  const barcos = [{ x: 332, y: f(rx(332) - 4), rot: f(RIO_ANG), l: 38, w: 12, vela: false }, { x: 236, y: f(rx(236) + 6), rot: f(RIO_ANG), l: 42, w: 13, vela: true }];
  const puente = { x: 195, y0: f(rio(195) - RIO_W - 5), y1: f(rio(195) + RIO_W + 5), w: 18 };

  /* ---- gente y carros ---- */
  const gente = [], cg = ['#f4efe0', '#f4efe0', '#c0281f', '#2f5da8', '#e9c063', '#7a4a8a', '#8a6a3a'];
  const punto = (x, y) => gente.push({ x: f(x), y: f(y), c: pick(cg) });
  for (let i = 0; i < 46; i++) { let x, y, k = 0; do { x = foro.x + 4 + rnd() * (foro.w - 8); y = foro.y + 12 + rnd() * (foro.h - 14); k++; } while (k < 20 && (enRect(x, y, foro.curia, 2) || enRect(x, y, foro.templo, 2) || enRect(x, y, foro.templo.porche, 2) || Math.hypot(x - foro.comicio.x, y - foro.comicio.y) < foro.comicio.r + 2)); punto(x, y); }
  for (let i = 0; i < 26; i++) punto(mercado.x + 3 + rnd() * (mercado.w - 6), mercado.y + 3 + rnd() * (mercado.h - 6));
  const largas = calles.filter(c => c.pts.length > 3);
  for (let i = 0; i < 60; i++) { const c = pick(largas), k = Math.floor(rnd() * (c.pts.length - 1)), a = c.pts[k], b = c.pts[k + 1], t = rnd(); punto(a[0] + (b[0] - a[0]) * t + rnd() * 3 - 1.5, a[1] + (b[1] - a[1]) * t + rnd() * 3 - 1.5); }
  for (let i = 0; i < 8; i++) punto(192 + rnd() * 6, 600 + rnd() * 100);
  for (let i = 0; i < 4; i++) punto(muelle.quay.x + 3 + rnd() * 30, muelle.quay.y + 3 + rnd() * 6);
  const carros = [{ x: 296, y: 360, rot: 0 }, { x: 192, y: 650, rot: 90 }, { x: 384, y: 340, rot: -12 }];

  const NECESIDADES = [['alimentacion', 'Alimentación'], ['agua', 'Agua'], ['limpieza', 'Limpieza'], ['salud', 'Salud'], ['trabajo', 'Trabajo'], ['cultura', 'Cultura'], ['culto_ocio', 'Culto y ocio'], ['orden', 'Orden']];
  const E = { W, H, CX, CY, RX, RY, rio, RIO_W, RIO_ANG, dentro, foro, mercado, barrios, peor, NECESIDADES, casas, publicos, huertos, jardines, calles, camino, muralla, campos, casasRurales, arboles, muelle, barcos, puente, gente, carros, fecha: 'Verano 278 a.C.' };
  if (typeof window !== 'undefined') window.ESCENA = E;
  if (typeof module !== 'undefined') module.exports = E;
})();
