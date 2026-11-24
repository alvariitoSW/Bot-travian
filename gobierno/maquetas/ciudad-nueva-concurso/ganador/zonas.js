/* Áreas de influencia por calle andando. Rejilla de ~6 px sobre las calles y el foro; relleno por anchura (BFS) desde cada servicio.
   Sin dibujar: corre también en Node. Uso: const Z = calcularZonas(ESCENA). */
(function () {
  const CELDA = 6;
  /* las 8 necesidades y qué servicios la cubren */
  const NEC = { agua: ['fuente'], limpieza: ['termas', 'cloaca'], salud: ['termas', 'medico'], alimentacion: ['granero', 'mercado'], trabajo: ['taller', 'mercado'], cultura: ['escuela'], culto_ocio: ['templo', 'teatro'], orden: ['guardia', 'cuartel'] };
  const TIPOS = { fuente: { n: 18, t: 'Fuente' }, termas: { n: 26, t: 'Termas' }, cloaca: { n: 22, t: 'Cloaca' }, medico: { n: 24, t: 'Médico' }, templo: { n: 30, t: 'Templo' }, mercado: { n: 30, t: 'Mercado' },
    granero: { n: 34, t: 'Granero' }, taller: { n: 28, t: 'Taller' }, guardia: { n: 30, t: 'Puesto de guardia' }, cuartel: { n: 30, t: 'Cuartel' }, teatro: { n: 40, t: 'Teatro' }, escuela: { n: 26, t: 'Escuela' } };
  /* servicios que ESCENA no trae: lista a mano (x,y sobre una calle) */
  const EXTRA = [
    ['fuente', 120, 238], ['fuente', 276, 236], ['fuente', 86, 398], ['fuente', 312, 330], ['fuente', 198, 270],
    ['cloaca', 200, 300], ['cloaca', 314, 400], ['cloaca', 90, 250],
    ['medico', 190, 250], ['medico', 300, 270], ['medico', 232, 436],
    ['taller', 316, 360], ['taller', 270, 300], ['taller', 232, 500],
    ['escuela', 160, 252], ['escuela', 272, 255],
    ['granero', 150, 232], ['teatro', 300, 214], ['teatro', 190, 440],
    ['guardia', 120, 214], ['guardia', 160, 330], ['guardia', 300, 440]
  ];
  const NUEVA_FUENTE = ['fuente', 198, 478]; // la que se coloca en la pantalla «colocar»

  const NEC_DE = { termas: ['limpieza', 'salud'], cloaca: ['limpieza'], medico: ['salud'], escuela: ['cultura'] };
  function calcularZonas(E) {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const W = Math.ceil(E.W / CELDA), H = Math.ceil(E.H / CELDA), cam = new Uint8Array(W * H), cx = i => (i % W + .5) * CELDA, cy = i => (Math.floor(i / W) + .5) * CELDA;
    const marca = (x0, y0, x1, y1, r) => { // pinta las celdas a menos de r del segmento
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
      for (let j = Math.max(0, Math.floor((Math.min(y0, y1) - r) / CELDA)); j <= Math.min(H - 1, Math.floor((Math.max(y0, y1) + r) / CELDA)); j++)
        for (let i = Math.max(0, Math.floor((Math.min(x0, x1) - r) / CELDA)); i <= Math.min(W - 1, Math.floor((Math.max(x0, x1) + r) / CELDA)); i++) {
          const px = (i + .5) * CELDA, py = (j + .5) * CELDA, t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2));
          if (Math.hypot(px - x0 - t * dx, py - y0 - t * dy) <= r) cam[j * W + i] = 1;
        }
    };
    for (const c of E.calles) { if (c.pts === undefined || c.pts.length < 2 || c.ancho === 5) continue; for (let k = 1; k < c.pts.length; k++) marca(c.pts[k - 1][0], c.pts[k - 1][1], c.pts[k][0], c.pts[k][1], c.ancho / 2 + 3); }
    for (const r of [E.foro, E.mercado]) for (let j = Math.floor(r.y / CELDA); j <= Math.floor((r.y + r.h) / CELDA); j++) for (let i = Math.floor(r.x / CELDA); i <= Math.floor((r.x + r.w) / CELDA); i++) if (i >= 0 && j >= 0 && i < W && j < H) cam[j * W + i] = 1;
    // los vecinos de una celda andable: calle conectada entre foro y calles
    const celdaCerca = (x, y) => { let m = -1, md = 1e9; const i0 = Math.floor(x / CELDA), j0 = Math.floor(y / CELDA);
      for (let j = Math.max(0, j0 - 6); j <= Math.min(H - 1, j0 + 6); j++) for (let i = Math.max(0, i0 - 6); i <= Math.min(W - 1, i0 + 6); i++) if (cam[j * W + i]) { const d = Math.hypot((i + .5) * CELDA - x, (j + .5) * CELDA - y); if (d < md) { md = d; m = j * W + i; } } return m; };
    /* lista de servicios: los de ESCENA y los extra */
    const serv = [];
    const poner = (tipo, x, y, extra) => serv.push(Object.assign({ tipo, x, y, n: TIPOS[tipo].n, nombre: TIPOS[tipo].t }, extra));
    poner('fuente', E.foro.fuente.x, E.foro.fuente.y, { arte: true });
    poner('templo', E.foro.templo.x + 23, E.foro.templo.y + 40, { arte: true });
    poner('mercado', E.mercado.x + E.mercado.w / 2, E.mercado.y + E.mercado.h / 2, { arte: true });
    for (const p of E.publicos) { const t = { granero: 'granero', cuartel: 'cuartel', termas: 'termas' }[p.tipo]; if (t) poner(t, p.x + p.w / 2, p.y + p.h / 2, { arte: true }); }
    for (const [t, x, y] of EXTRA) poner(t, x, y);
    const nuevo = { tipo: NUEVA_FUENTE[0], x: NUEVA_FUENTE[1], y: NUEVA_FUENTE[2], n: TIPOS.fuente.n, nombre: 'Fuente' };
    const bfs = (s) => { // devuelve la lista de celdas alcanzadas
      const ini = celdaCerca(s.x, s.y); const dist = new Int16Array(W * H).fill(-1), q = [ini], out = []; if (ini < 0) return out; dist[ini] = 0;
      for (let h = 0; h < q.length; h++) { const a = q[h]; out.push(a); if (dist[a] >= s.n) continue; const i = a % W, j = (a - i) / W;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue; const b = nj * W + ni; if (cam[b] && dist[b] < 0) { dist[b] = dist[a] + 1; q.push(b); } } }
      return out;
    };
    const tBfs0 = (typeof performance !== 'undefined' ? performance : Date).now();
    for (const s of serv) { s.celdas = bfs(s); }
    nuevo.celdas = bfs(nuevo);
    const msBfs = (typeof performance !== 'undefined' ? performance : Date).now() - tBfs0;
    /* casas: cubierta si toca una celda alcanzada */
    const casas = E.casas.map((c, idx) => ({ c, idx, cx: c.w ? c.x + c.w / 2 : c.x, cy: c.h ? c.y + c.h / 2 : c.y, semi: c.w ? Math.max(c.w, c.h) / 2 : c.r }));
    const toca = (h, set) => { const m = h.semi + 4; for (let j = Math.floor((h.cy - m) / CELDA); j <= Math.floor((h.cy + m) / CELDA); j++) for (let i = Math.floor((h.cx - m) / CELDA); i <= Math.floor((h.cx + m) / CELDA); i++) if (set[j * W + i] === 1) return true; return false; };
    const conj = (celdas) => { const a = new Uint8Array(W * H); for (const k of celdas) a[k] = 1; return a; };
    for (const s of serv) { s.set = conj(s.celdas); s.cubre = casas.filter(h => toca(h, s.set)).map(h => h.idx); }
    nuevo.set = conj(nuevo.celdas); nuevo.cubre = casas.filter(h => toca(h, nuevo.set)).map(h => h.idx);
    /* por necesidad: casas cubiertas */
    const porNec = {}; for (const [k, tipos] of Object.entries(NEC)) { const s = new Set(); for (const sv of serv) if (tipos.includes(sv.tipo)) sv.cubre.forEach(i => s.add(i)); porNec[k] = s; }
    const sinAgua = casas.filter(h => !porNec.agua.has(h.idx)).map(h => h.idx);
    const conAguaNueva = nuevo.cubre.filter(i => !porNec.agua.has(i));
    const barrioDe = i => E.casas[i].barrio;
    const cobertura = (bid, k) => { const l = casas.filter(h => h.c.barrio === bid); return l.length ? l.filter(h => porNec[k].has(h.idx)).length / l.length : 0; };
    const barriosNuevos = {}; conAguaNueva.forEach(i => { barriosNuevos[barrioDe(i)] = (barriosNuevos[barrioDe(i)] || 0) + 1; });
    /* después de colocar la fuente: casas que suben de nivel y cobertura del barrio */
    const aguaDesp = new Set([...porNec.agua, ...nuevo.cubre]);
    const subidas = casas.filter(h => h.c.tipo === 'choza' && h.c.barrio === 'rio' && conAguaNueva.includes(h.idx)).sort((p, q) => Math.hypot(p.cx - nuevo.x, p.cy - nuevo.y) - Math.hypot(q.cx - nuevo.x, q.cy - nuevo.y)).slice(0, 14).map((h, k) => ({ idx: h.idx, tipo: k === 3 || k === 9 ? 'andamio' : 'atrio' }));
    const cobDespues = (bid, k) => { const l = casas.filter(h => h.c.barrio === bid); const s = k === 'agua' ? aguaDesp : porNec[k]; return l.length ? l.filter(h => s.has(h.idx)).length / l.length : 0; };
    const PESO = { alimentacion: 3, trabajo: 3, culto_ocio: 3, agua: 2, salud: 2, limpieza: 1.5, orden: 1.5, cultura: 1 };
    const remedios = ['termas', 'cloaca', 'medico', 'escuela'].map(t => { const dueno = NEC_DE[t], ini = celdaCerca(140, 515), s = { tipo: t, x: 140, y: 515, n: TIPOS[t].n }, set = conj(bfs(s)), lc = casas.filter(h => h.c.barrio === 'rio');
      const nuevas = {}; let uni = new Set(), score = 0; for (const k of dueno) { const l = lc.filter(h => !(k === 'agua' ? aguaDesp : porNec[k]).has(h.idx) && toca(h, set)); nuevas[k] = l.length; l.forEach(h => uni.add(h.idx)); score += PESO[k] * l.length; }
      return { tipo: t, nombre: TIPOS[t].t, nuevas, casas: uni.size, score }; }).sort((a, b) => b.score - a.score);
    const ms = (typeof performance !== 'undefined' ? performance : Date).now() - t0;
    return { PESO, subidas, cobDespues, remedios, CELDA, W, H, cam, NEC, TIPOS, serv, nuevo, casas, porNec, sinAgua, conAguaNueva, barriosNuevos, cobertura, msBfs, ms, celdaCerca };
  }
  const API = { calcularZonas, NEC, TIPOS, CELDA };
  if (typeof window !== 'undefined') window.Zonas = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
