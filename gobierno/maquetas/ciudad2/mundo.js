/* Maqueta Q1b2 — el plano de la ciudad itálica, generado por código con semilla fija. Sin pantalla: solo números.
   Unidades: las de los modelos de 0 A.D. (una persona mide ~3,2; una casa ~17 de lado ≈ 9 m; 1 unidad ≈ 0,55 m).
   Ejes: +x este, +z sur. La cámara mira al norte (−z). Todo lo de este archivo es INVENTADO (trazado, relieve, río). */

export function azar(semilla) { let a = semilla >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const h2 = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0; n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
export function ruido(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * ruido(x * f, y * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, o)); }
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

/* ---------- polilíneas ---------- */
export function suavizar(p, paso = 4) {               // Catmull-Rom y remuestreo a paso fijo
  const o = []; const n = p.length;
  for (let i = 0; i < n - 1; i++) { const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(n - 1, i + 2)]; const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(2, Math.ceil(L / paso));
    for (let j = 0; j < k; j++) { const t = j / k, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  o.push(p[n - 1]); return o;
}
export function distPoli(p, x, z) { let m = 1e9; for (let i = 0; i < p.length - 1; i++) { const ax = p[i][0], az = p[i][1], bx = p[i + 1][0] - ax, bz = p[i + 1][1] - az, l = bx * bx + bz * bz; let t = l ? ((x - ax) * bx + (z - az) * bz) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const d = Math.hypot(x - ax - bx * t, z - az - bz * t); if (d < m) m = d; } return m; }

/* ---------- río ---------- */
export const NIVEL_RIO = -3;
export const RIO = suavizar([[-2600, -620], [-1700, -540], [-1000, -470], [-560, -440], [-300, -395], [-90, -405], [70, -470], [200, -440], [300, -365], [420, -335], [560, -385], [820, -430], [1500, -390], [2600, -460]], 14);
const rioCelda = new Map();
export function distRio(x, z) { if (z > 200 || z < -1100) return 400; const k = Math.round(x / 6) + ',' + Math.round(z / 6); let d = rioCelda.get(k); if (d === undefined) { d = distPoli(RIO, Math.round(x / 6) * 6, Math.round(z / 6) * 6); rioCelda.set(k, d); } return d; }
const distRioFina = (x, z) => (z > 200 || z < -1100) ? 400 : distPoli(RIO, x, z);

/* ---------- relieve ---------- */
export const ARX = [-70, -118], FORO = [12, 52], FORO_GIRO = 0.12, FORO_M = [52, 36];      // foro: medias anchuras
export function altura(x, z) {
  const R = Math.hypot(x, z);
  let h = 7 * (fbm(x / 300 + 7.3, z / 300 + 2.1, 3) - 0.5) + 1.2 * (fbm(x / 40, z / 40, 2) - 0.5);
  const ga = Math.exp(-((x - ARX[0]) ** 2 / 115 ** 2 + (z - ARX[1]) ** 2 / 95 ** 2)); h += 50 * (1 - Math.exp(-3.2 * ga)) / (1 - Math.exp(-3.2));
  h += 21 * Math.exp(-((x - 160) ** 2 / 140 ** 2 + (z - 20) ** 2 / 125 ** 2));
  h += 9 * Math.exp(-((x + 230) ** 2 / 120 ** 2 + (z - 120) ** 2 / 150 ** 2));
  const df = Math.hypot(x - FORO[0], z - FORO[1]); h = mix(3.2, h, ss(45, 115, df));                                     // el foro, en la vaguada, casi llano
  if (R > 900) h += (R - 900) * 0.085 * (0.25 + 1.5 * fbm(x / 700 + 3, z / 700 + 9, 3)) * ss(900, 1500, R);                // lomas lejanas
  const d = distRioFina(x, z); if (d < 235) { h = mix(-1.6 + 1.2 * (fbm(x / 60, z / 60, 2) - 0.5), h, ss(60, 230, d)); h = mix(-8, h, ss(38, 70, d)); }
  return h;
}

/* ---------- muralla ---------- */
export function radioMuro(t) { const c = Math.cos(t), s = Math.sin(t); return (1 / Math.sqrt(c * c / (335 * 335) + s * s / (285 * 285))) * (1 + 0.085 * Math.sin(2 * t + 1.3) + 0.06 * Math.sin(3 * t + 4.1) + 0.035 * Math.sin(5 * t + 0.7) + 0.02 * Math.sin(9 * t + 2)); }
export const fracMuro = (x, z) => Math.hypot(x, z) / radioMuro(Math.atan2(z, x));     // <1 dentro
const P_ANG = { sur: Math.PI / 2 + 0.06, norte: -Math.PI / 2 + 0.2, este: 0.12, oeste: Math.PI - 0.25 };
const enMuro = (t, f = 1) => { const r = radioMuro(t) * f; return [Math.cos(t) * r, Math.sin(t) * r]; };

export function generar(semilla = 7) {
  const rnd = azar(semilla), R = (a, b) => a + (b - a) * rnd();
  /* muralla: tramos de 30 que siguen el contorno; puertas y torres irregulares */
  const cont = []; for (let i = 0; i <= 720; i++) cont.push(enMuro(i / 720 * Math.PI * 2));
  const TR = 30.5, muros = [], torres = [], puertas = []; let acc = 0, ini = cont[0], desde = 0;
  const puertaEn = Object.entries(P_ANG).map(([k, t]) => ({ k, t: (t + Math.PI * 2) % (Math.PI * 2), p: enMuro(t) }));
  for (let i = 1; i < cont.length; i++) { acc += Math.hypot(cont[i][0] - cont[i - 1][0], cont[i][1] - cont[i - 1][1]);
    if (acc >= TR) { const a = ini, b = cont[i], x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]); const pu = puertaEn.find(p => Math.hypot(p.p[0] - x, p.p[1] - z) < TR * 0.55 && !p.hecho);
      if (pu) { pu.hecho = true; pu.p = [x, z]; puertas.push({ x, z, ang, k: pu.k }); torres.push({ x: a[0], z: a[1] }, { x: b[0], z: b[1] }); } else { muros.push({ x, z, ang }); if (rnd() < 0.3) torres.push({ x: b[0], z: b[1] }); }
      ini = b; acc = 0; desde = i; } }
  const puerta = k => puertaEn.find(p => p.k === k).p;

  /* calles: {p: polilínea, w: media anchura, t: tipo} */
  const calles = [], torcer = (a, b, n, amp) => { const o = [a]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); for (let i = 1; i < n; i++) { const t = i / n, k = (rnd() - 0.5) * 2 * amp * Math.sin(t * Math.PI); o.push([a[0] + dx * t - dz / L * k, a[1] + dz * t + dx / L * k]); } o.push(b); return suavizar(o, 3); };
  const bordeForo = k => ({ sur: [FORO[0] + 4, FORO[1] + FORO_M[1]], norte: [FORO[0] - 10, FORO[1] - FORO_M[1]], este: [FORO[0] + FORO_M[0], FORO[1] - 6], oeste: [FORO[0] - FORO_M[0], FORO[1] + 4] })[k];
  for (const k of ['sur', 'norte', 'este', 'oeste']) { const g = puerta(k), f = bordeForo(k);
    if (k === 'norte') calles.push({ p: suavizar([g, [60, -215], [78, -150], [50, -80], [22, -30], f], 3), w: 4.6, t: 'via' });       // rodea la arx por el este
    else calles.push({ p: torcer(g, f, 5, 22), w: 4.6, t: 'via' }); }
  calles.push({ p: suavizar([[40, -75], [10, -100], [-25, -112], [-46, -112]], 3), w: 3.4, t: 'clivus' });                       // subida a la arx
  /* anillos torcidos y travesías entre ellos */
  const anillos = [0.27, 0.43, 0.59, 0.75, 0.905].map((f, i) => ({ f, fase: R(0, 6), amp: 0.035 + 0.01 * i, cx: R(-12, 12), cz: R(-10, 10) }));
  const rA = (a, t) => a.f * (1 + a.amp * Math.sin(3 * t + a.fase) + a.amp * 0.7 * Math.sin(5 * t + a.fase * 2.3));
  const pA = (a, t) => { const p = enMuro(t, rA(a, t)); return [p[0] + a.cx * (1 - a.f), p[1] + a.cz * (1 - a.f)]; };
  anillos.forEach((a, i) => { const trozos = i === 4 ? 9 : 3 + i; const corte = R(0, 6);
    for (let j = 0; j < trozos; j++) { const t0 = corte + j / trozos * Math.PI * 2 + 0.03, t1 = corte + (j + 1) / trozos * Math.PI * 2 - (rnd() < 0.5 ? 0.02 : 0.11); const o = []; for (let t = t0; t <= t1; t += 0.02) o.push(pA(a, t)); calles.push({ p: suavizar(o, 3), w: i === 4 ? 2.4 : R(2.4, 3.4), t: 'calle' }); } });
  for (let i = 0; i < anillos.length - 1; i++) { const n = [7, 11, 15, 19][i], fase = R(0, 6);
    for (let j = 0; j < n; j++) { const t = fase + (j + R(-0.28, 0.28)) / n * Math.PI * 2, a = pA(anillos[i], t), b = pA(anillos[i + 1], t + R(-0.05, 0.05)); calles.push({ p: torcer(a, b, 3, 5), w: R(1.9, 3), t: 'calle' }); } }
  /* caminos de fuera */
  const iPuente = RIO.reduce((m, p, i) => Math.hypot(p[0] - 82, p[1] + 450) < Math.hypot(RIO[m][0] - 82, RIO[m][1] + 450) ? i : m, 0), PUENTE = { x: RIO[iPuente][0], z: RIO[iPuente][1], ang: Math.atan2(RIO[iPuente + 1][1] - RIO[iPuente - 1][1], RIO[iPuente + 1][0] - RIO[iPuente - 1][0]) + Math.PI / 2 };
  const fuera = { sur: [puerta('sur'), [-10, 420], [30, 620], [-40, 900], [60, 1500], [0, 2600]], norte: [puerta('norte'), [70, -350], [PUENTE.x - Math.cos(PUENTE.ang) * 45, PUENTE.z - Math.sin(PUENTE.ang) * 45], [PUENTE.x + Math.cos(PUENTE.ang) * 45, PUENTE.z + Math.sin(PUENTE.ang) * 45], [60, -640], [140, -900], [60, -1300], [200, -2400]], este: [puerta('este'), [470, 60], [640, 10], [900, 90], [1500, 40], [2600, 200]], oeste: [puerta('oeste'), [-470, 110], [-640, 60], [-900, 150], [-1600, 80], [-2600, 200]] };
  const caminos = Object.entries(fuera).map(([k, p]) => ({ p: suavizar(p, 5), w: 4.2, t: 'camino', k }));
  caminos.push({ p: suavizar([[-10, 420], [-160, 470], [-330, 560], [-520, 610], [-900, 760]], 5), w: 2.6, t: 'senda' }, { p: suavizar([[70, -350], [-80, -330], [-260, -330], [-420, -300], [-640, 60]], 5), w: 2.4, t: 'senda' }, { p: suavizar([[470, 60], [430, 240], [300, 420], [30, 620]], 5), w: 2.4, t: 'senda' }, { p: suavizar([[60, -640], [-200, -700], [-520, -820], [-1000, -900]], 5), w: 2.4, t: 'senda' }, { p: suavizar([[140, -900], [420, -820], [760, -900]], 5), w: 2.2, t: 'senda' });

  /* rejilla para medir distancia a calles deprisa */
  const todas = calles.concat(caminos), CEL = 24, rej = new Map();
  todas.forEach((c, ci) => { for (let i = 0; i < c.p.length - 1; i++) { const a = c.p[i], k = Math.floor(a[0] / CEL) + ',' + Math.floor(a[1] / CEL); let l = rej.get(k); if (!l) rej.set(k, l = []); l.push([ci, i]); } });
  function libreDeCalle(x, z, salvo, holg) { const cx = Math.floor(x / CEL), cz = Math.floor(z / CEL); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = rej.get((cx + i) + ',' + (cz + j)); if (!l) continue; for (const [ci, si] of l) { if (ci === salvo) continue; const c = todas[ci], a = c.p[si], b = c.p[si + 1], bx = b[0] - a[0], bz = b[1] - a[1], ll = bx * bx + bz * bz; let t = ll ? ((x - a[0]) * bx + (z - a[1]) * bz) / ll : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(x - a[0] - bx * t, z - a[1] - bz * t) < c.w + holg) return false; } } return true; }
  const enForo = (x, z, m) => { const c = Math.cos(-FORO_GIRO), s = Math.sin(-FORO_GIRO), dx = x - FORO[0], dz = z - FORO[1]; return Math.abs(dx * c - dz * s) < FORO_M[0] + m && Math.abs(dx * s + dz * c) < FORO_M[1] + m; };

  /* casas: se camina por cada calle y se van adosando a ambos lados, tocándose (medianeras) */
  const casas = [], rejC = new Map(), CC = 30;
  const esquinas = (c, k = 1) => { const co = Math.cos(c.ang), si = Math.sin(c.ang), a = c.w / 2 * k, b = c.d / 2 * k; return [[-a, -b], [a, -b], [a, b], [-a, b]].map(([u, v]) => [c.x + u * co - v * si, c.z + u * si + v * co]); };
  const solapa = (A, B) => { const pa = esquinas(A, 0.86), pb = esquinas(B, 0.86); for (const P of [pa, pb]) for (let i = 0; i < 2; i++) { const nx = P[i + 1][1] - P[i][1], nz = P[i][0] - P[i + 1][0]; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const q of pa) { const d = q[0] * nx + q[1] * nz; a0 = Math.min(a0, d); a1 = Math.max(a1, d); } for (const q of pb) { const d = q[0] * nx + q[1] * nz; b0 = Math.min(b0, d); b1 = Math.max(b1, d); } if (a1 < b0 || b1 < a0) return false; } return true; };
  const choca = c => { const cx = Math.floor(c.x / CC), cz = Math.floor(c.z / CC); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = rejC.get((cx + i) + ',' + (cz + j)); if (l) for (const o of l) if (solapa(c, o)) return true; } return false; };
  const apunta = c => { const k = Math.floor(c.x / CC) + ',' + Math.floor(c.z / CC); let l = rejC.get(k); if (!l) rejC.set(k, l = []); l.push(c); casas.push(c); };
  const reservas = [];                                 // círculos donde no van casas (arx, edificios singulares)
  const reservado = (x, z, m) => reservas.some(r => Math.hypot(x - r[0], z - r[1]) < r[2] + m);
  reservas.push([ARX[0], ARX[1], 46]);
  /* edificios singulares (se colocan antes) */
  const unicos = [];
  const unico = (pieza, x, z, ang, esc, r) => { unicos.push({ pieza, x, z, ang, esc }); reservas.push([x, z, r]); };
  const fc = Math.cos(FORO_GIRO), fs = Math.sin(FORO_GIRO), enF = (u, v) => [FORO[0] + u * fc - v * fs, FORO[1] + u * fs + v * fc];
  unico('templo_arx', ARX[0], ARX[1], 0.25, 1, 0);
  { const p = enF(-FORO_M[0] - 20, -8); unico('curia', p[0], p[1], FORO_GIRO + Math.PI / 2, 1, 22); }
  { const p = enF(FORO_M[0] + 16, 14); unico('mercado', p[0], p[1], FORO_GIRO - Math.PI / 2, 0.8, 17); }
  { const p = enF(26, -FORO_M[1] - 13); unico('vesta', p[0], p[1], FORO_GIRO, 0.85, 12); }
  { const p = enF(-22, FORO_M[1] + 17); unico('almacen_g', p[0], p[1], FORO_GIRO + Math.PI, 1, 14); }
  unico('cuartel', 205, 95, 0.4, 0.95, 20);

  const dentro = (c, lim) => esquinas(c).every(q => fracMuro(q[0], q[1]) < lim);
  function fila(calle, ci, intramuros, prob) {
    const p = calle.p; let L = 0; const acum = [0]; for (let i = 1; i < p.length; i++) { L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); acum.push(L); }
    const en = s => { let i = 1; while (i < p.length - 1 && acum[i] < s) i++; const t = (s - acum[i - 1]) / Math.max(1e-6, acum[i] - acum[i - 1]), a = p[i - 1], b = p[i]; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
    for (const lado of [1, -1]) { let s = R(0, 6);
      while (s < L - 6) { const tipo = rnd(), esc = R(0.86, 1.2), ex = esc * R(0.92, 1.1), ez = esc * R(0.92, 1.1), w = 13.2 * ex, d = 13.8 * ez, q = en(s + w / 2);
        const pr = typeof prob === 'function' ? prob(q.x, q.z, s) : prob; if (rnd() > pr) { s += R(8, 26); continue; }
        const ret = calle.w + d / 2 + R(-0.4, 0.5), c = { x: q.x - Math.sin(q.ang) * ret * lado, z: q.z + Math.cos(q.ang) * ret * lado, ang: q.ang + R(-0.035, 0.035), w, d, tipo, ex, ez, lado, intramuros, tono: rnd(), teja: rnd(), giro: rnd() < 0.5 };
        const ok = (!intramuros || dentro(c, 0.972)) && (intramuros || esquinas(c).every(e => fracMuro(e[0], e[1]) > 1.045 && distRio(e[0], e[1]) > 80)) && !enForo(c.x, c.z, Math.max(w, d) * 0.6) && !reservado(c.x, c.z, Math.max(w, d) * 0.55) && esquinas(c, 1.04).concat([[c.x, c.z]]).every(e => libreDeCalle(e[0], e[1], ci, 0.3)) && !choca(c);
        if (ok) { apunta(c); s += w * 0.9; if (rnd() < 0.06) s += R(3.5, 5); } else s += 1.5; } }
  }
  const densidad = (x, z) => { const f = fracMuro(x, z); return f < 0.62 ? 1 : mix(1, 0.74, ss(0.62, 0.96, f)); };
  calles.forEach((c, i) => fila(c, i, true, densidad));
  /* relleno: segundas filas en el interior de las manzanas del centro, alineadas con la vecina */
  for (let i = 0; i < 5000; i++) { const t = R(0, 6.283), f = Math.sqrt(rnd()) * 0.8, p = enMuro(t, f); if (rnd() > 0.95 - f) continue; let v = null, dm = 24; for (const o of casas) { const d = Math.hypot(o.x - p[0], o.z - p[1]); if (d < dm) { dm = d; v = o; } } if (!v) continue;
    const ex = R(0.82, 1.05), ez = R(0.82, 1.05), c = { x: p[0], z: p[1], ang: v.ang + (rnd() < 0.3 ? Math.PI / 2 : 0) + R(-0.04, 0.04), w: 13.2 * ex, d: 13.8 * ez, tipo: rnd(), ex, ez, lado: rnd() < 0.5 ? 1 : -1, intramuros: true, tono: rnd(), teja: rnd(), relleno: true };
    if (dentro(c, 0.97) && !enForo(c.x, c.z, 12) && !reservado(c.x, c.z, 9) && esquinas(c, 1.05).concat([[c.x, c.z]]).every(e => libreDeCalle(e[0], e[1], -1, 0.6)) && !choca(c)) apunta(c); }
  const nDentro = casas.length;
  /* arrabales: junto a los caminos, cada vez más ralos; las tumbas ocupan el primer tramo de la vía sur */
  caminos.forEach((c, i) => { const g = c.p[0]; fila(c, calles.length + i, false, (x, z) => { const d = Math.hypot(x - g[0], z - g[1]); return c.t === 'senda' ? 0.07 * Math.exp(-d / 500) : (c.k === 'sur' && d < 90 ? 0.15 : c.k === 'sur' ? 0.9 * Math.exp(-d / 330) + 0.05 : 0.8 * Math.exp(-d / 170) + 0.03); }); });
  /* casas arrimadas por fuera a la muralla */
  for (let i = 0; i < 260; i++) { const t = R(0, Math.PI * 2), f = R(1.06, 1.16), p = enMuro(t, f), c = { x: p[0], z: p[1], ang: t + Math.PI / 2 + R(-0.2, 0.2), tipo: rnd(), ex: R(0.85, 1.05), ez: R(0.85, 1.05), lado: 1, intramuros: false, tono: rnd(), teja: rnd(), giro: rnd() < 0.5 }; c.w = 13.2 * c.ex; c.d = 13.8 * c.ez;
    if (rnd() < 0.3 && esquinas(c, 1.05).every(e => libreDeCalle(e[0], e[1], -1, 1) && distRio(e[0], e[1]) > 80) && !choca(c)) apunta(c); }

  /* granjas y villas dispersas */
  const granjas = []; for (let i = 0; i < 900 && granjas.length < 30; i++) { const x = R(-1500, 1500), z = R(-1500, 1100), f = fracMuro(x, z); if (f < 1.22 || distRio(x, z) < 70 || !libreDeCalle(x, z, -1, 14) || granjas.some(g => Math.hypot(g.x - x, g.z - z) < 150)) continue; if (rnd() > Math.exp(-(f - 1.3) * 0.33)) continue; const g = { x, z, ang: R(0, 6.28), esc: R(0.85, 1.05), w: 24, d: 20, tono: rnd(), teja: rnd() }; if (choca(g)) continue; granjas.push(g); }

  /* tumbas junto a las vías, fuera de las puertas (necrópolis) */
  const tumbas = []; for (const c of caminos.filter(c => c.t === 'camino')) { let s = 0; for (let i = 1; i < c.p.length && s < (c.k === 'sur' ? 330 : 190); i++) { s += Math.hypot(c.p[i][0] - c.p[i - 1][0], c.p[i][1] - c.p[i - 1][1]); if (s < 26 || rnd() > 0.34) continue; const a = c.p[i - 1], b = c.p[i], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), lado = rnd() < 0.5 ? 1 : -1, r = c.w + R(4, 9), t = { x: b[0] - Math.sin(ang) * r * lado, z: b[1] + Math.cos(ang) * r * lado, ang, clase: rnd() < 0.3 ? 'tumulo' : rnd() < 0.5 ? 'edicula' : 'cipo', esc: R(0.8, 1.3), w: 7, d: 7 }; if (!choca(t) && distRio(t.x, t.z) > 40) tumbas.push(t); } }

  /* parcelas: rejilla deformada de cuadriláteros que comparten lindes */
  const parcelas = [], PASO = 96, N = 34, nodo = (i, j) => { const x = (i - N / 2) * PASO, z = (j - N / 2) * PASO; return [x + (fbm(x / 420 + 11, z / 420 + 5, 2) - 0.5) * 150 + (h2(i * 7 + 3, j * 13 + 1) - 0.5) * 46, z + (fbm(x / 420 + 31, z / 420 + 17, 2) - 0.5) * 150 + (h2(i * 5 + 9, j * 3 + 7) - 0.5) * 46]; };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const q = [nodo(i, j), nodo(i + 1, j), nodo(i + 1, j + 1), nodo(i, j + 1)], cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, f = fracMuro(cx, cz), dr = distRio(cx, cz);
    if (q.some(e => fracMuro(e[0], e[1]) < 1.07) || dr < 40 || altura(cx, cz) > 60) continue; const v = h2(i * 31 + 5, j * 17 + 11), lejos = ss(1.6, 4.5, f);
    if (v < 0.1 + 0.45 * lejos) continue;                                                             // erial / pasto seco
    const u = h2(i * 3 + 77, j * 29 + 3); let clase = dr < 150 && u < 0.6 ? 'huerta' : u < 0.36 ? 'rastrojo' : u < 0.56 ? 'barbecho' : u < 0.74 ? 'vina' : u < 0.9 ? 'olivar' : 'pasto';
    /* se parte en 1-3 tiras para que no sean todas iguales */
    const tiras = 1 + Math.floor(h2(i + 100, j + 50) * 3), dir = h2(i + 9, j + 77) < 0.5;
    for (let k = 0; k < tiras; k++) { const a = k / tiras, b = (k + 1) / tiras, L = (p, r, t) => [p[0] + (r[0] - p[0]) * t, p[1] + (r[1] - p[1]) * t]; const pol = dir ? [L(q[0], q[1], a), L(q[0], q[1], b), L(q[3], q[2], b), L(q[3], q[2], a)] : [L(q[0], q[3], a), L(q[1], q[2], a), L(q[1], q[2], b), L(q[0], q[3], b)];
      const cl = k === 0 ? clase : ['rastrojo', 'barbecho', 'vina', 'pasto', clase][Math.floor(h2(i * 9 + k, j * 5 + k) * 5)]; parcelas.push({ pol, clase: cl, ang: Math.atan2(pol[1][1] - pol[0][1], pol[1][0] - pol[0][0]) + (dir ? Math.PI / 2 : 0), v: h2(i + k * 13, j + k * 7), linde: h2(i * 2 + k, j * 11) }); } }

  /* árboles */
  const arboles = [], arbol = (pieza, x, z, esc, tono) => arboles.push({ pieza, x, z, esc, ang: rnd() * 6.28, tono: tono === undefined ? rnd() : tono });
  const libre = (x, z, m) => libreDeCalle(x, z, -1, m) && !choca({ x, z, ang: 0, w: m * 2 + 3, d: m * 2 + 3 }) && !enForo(x, z, 4);
  const huertos = [];
  for (let i = 0; i < 1700; i++) { const t = R(0, 6.28), f = Math.sqrt(rnd()) * 0.95, p = enMuro(t, f); if (Math.hypot(p[0] - ARX[0], p[1] - ARX[1]) < 30 || !libre(p[0], p[1], 2.5) || reservado(p[0], p[1], 0)) continue; const v = rnd(); huertos.push({ x: p[0], z: p[1], r: R(5, 10) }); if (v < 0.5) arbol(v < 0.13 ? 'cipres' : 'olivo', p[0], p[1], v < 0.13 ? R(0.8, 1.25) : R(0.5, 0.8)); }
  for (let i = 0; i < 26; i++) { const t = i / 26 * 6.28 + R(-0.1, 0.1), r = R(26, 40); arbol(rnd() < 0.85 ? 'cipres' : 'pino', ARX[0] + Math.cos(t) * r, ARX[1] + Math.sin(t) * r * 0.9, R(0.9, 1.3)); }   // bosque sagrado de la arx
  for (let i = 0; i < 420; i++) { const t = R(0, 6.28), p = enMuro(t, R(1.03, 1.22)); if (libre(p[0], p[1], 3) && distRio(p[0], p[1]) > 30) { const v = rnd(); arbol(v < 0.12 ? 'cipres' : v < 0.6 ? 'olivo' : 'algarrobo', p[0], p[1], v < 0.6 ? R(0.6, 1.05) : R(0.95, 1.3)); } }
  for (const pa of parcelas) { const [a, b, c, d] = pa.pol;
    if (pa.clase === 'olivar') { if (Math.hypot(a[0], a[1]) > 950) continue; const n = 4; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const u = (i + 0.5) / n, v = (j + 0.5) / n, x = mix(mix(a[0], b[0], u), mix(d[0], c[0], u), v), z = mix(mix(a[1], b[1], u), mix(d[1], c[1], u), v); if (Math.hypot(x, z) < 1500 && libre(x, z, 3)) arbol('olivo', x + R(-1.5, 1.5), z + R(-1.5, 1.5), R(0.5, 0.72), 0.5); } }
    else if (pa.linde < 0.4) { const n = 3 + Math.floor(rnd() * 5); for (let i = 0; i < n; i++) { const u = (i + R(0.1, 0.9)) / n, x = mix(a[0], b[0], u), z = mix(a[1], b[1], u); if (Math.hypot(x, z) < 1500 && libre(x, z, 3)) arbol(pa.linde < 0.05 ? 'cipres' : rnd() < 0.5 ? 'algarrobo' : 'olivo', x, z, R(0.6, 1.1)); } } }
  for (let i = 0; i < RIO.length; i++) { const p = RIO[i]; if (Math.abs(p[0]) > 1500) continue; for (const l of [1, -1]) if (rnd() < 0.5) { const q = RIO[Math.min(RIO.length - 1, i + 1)], ang = Math.atan2(q[1] - p[1], q[0] - p[0]), r = R(62, 100), x = p[0] - Math.sin(ang) * r * l + R(-6, 6), z = p[1] + Math.cos(ang) * r * l + R(-6, 6); if (libre(x, z, 4) && Math.hypot(x - PUENTE.x, z - PUENTE.z) > 30) arbol(rnd() < 0.98 ? 'algarrobo' : 'pino', x, z, R(0.7, 1.2), R(0.6, 1)); } }   // soto de ribera
  for (const g of granjas) for (let i = 0; i < 5; i++) { const t = R(0, 6.28), r = R(16, 30); arbol(rnd() < 0.4 ? 'cipres' : 'algarrobo', g.x + Math.cos(t) * r, g.z + Math.sin(t) * r, R(0.7, 1.1)); }
  for (const t of tumbas) if (rnd() < 0.45) arbol('cipres', t.x + R(-5, 5), t.z + R(-5, 5), R(0.9, 1.3));
  for (let i = 0; i < 1500; i++) { const x = R(-2300, 2300), z = R(-2300, 1500), R0 = Math.hypot(x, z); if (R0 < 700 || distRio(x, z) < 30) continue; if (fbm(x / 500 + 40, z / 500 + 40, 2) < 0.5) continue; arbol(rnd() < 0.02 ? 'pino' : rnd() < 0.3 ? 'olivo' : 'algarrobo', x, z, R(0.9, 1.5)); }   // manchas de monte lejanas

  return { muros, torres, puertas, calles, caminos, casas, nDentro, unicos, granjas, tumbas, parcelas, arboles, huertos, contorno: cont, PUENTE, enF, libre, libreDeCalle, puerta };
}
