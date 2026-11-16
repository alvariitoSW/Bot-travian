/* GM10 — MANEJO CON EL DEDO. Aquí vive lo que cambia entre las variantes A, B y C; vista.js solo da el «contexto» (ctx) y llama a:
     crearCapa(ctx)        las marcas del suelo (objetivo, ruta de jinetes, señales de espera/cede/rehúsa, flecha del dedo)
     montar(nombre, ctx)   la variante: un objeto con  abajo(e) mueve(e) arriba(e) cancela(e) toque(px,py) cuadro(dt) cierra()  (todos opcionales)
     rotular(B, cartas)    el texto «Espera / Cede / Rehúsa» en la carta de cada cuerpo
     pantalla(ctx)         dónde está cada cosa en píxeles de pantalla (para las pruebas)
   Variante C (tablilla de mando): el siguiente agente escribe `montarC(ctx)` aquí abajo y la enchufa en VARIANTES.c. Dispone de
   `ctx.tablilla` (div#tablilla dentro de #mando, encima de las cartas) y de las mismas llamadas que A y B: ctx.mando(tipo, datos),
   ctx.puede(tipo, datos), ctx.rutaJinetes(ala, obj), ctx.lento(bool), ctx.capa (marcas del suelo), ctx.elegir(i), ctx.cinta(txt, tono).
   Todo se manda con ctx.mando(tipo, datos): 'adelantar'|'retrasar'|'rehusar'{i,costado} · 'jinetes'{obj,ala} · 'marcar'{i}. */

export const NOMBRES = { a: 'Arrastrar en el campo', b: 'Tocar y elegir', c: 'Tablilla de mando' };
export const ORDEN_MANEJOS = ['a', 'b'];
export const siguiente = n => ORDEN_MANEJOS[(Math.max(0, ORDEN_MANEJOS.indexOf(n)) + 1) % ORDEN_MANEJOS.length];

const COL = { adelante: '#7cc65e', atras: '#e6ac3c', lado: '#6fb4ff', no: '#9a9a9a', ruta: '#ffb02e', diana: '#e0392a' };
const hip = Math.hypot;

/* curva suave por las esquinas (Chaikin): la ruta de los jinetes se pinta redondeada */
export function suavizar(p, it = 3) {
  for (let k = 0; k < it; k++) { const q = [p[0]]; for (let j = 0; j < p.length - 1; j++) { const a = p[j], b = p[j + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(p[p.length - 1]); p = q; }
  return p;
}

/* ---------- una cinta con punta de flecha tendida en el suelo ---------- */
function crearCinta(THREE, max, color) {
  const n = max, pos = new Float32Array((2 * n + 3) * 3), idx = [2 * n, 2 * n + 1, 2 * n + 2];
  for (let k = 0; k < n - 1; k++) { const a = 2 * k, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setIndex(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
  m.frustumCulled = false; m.renderOrder = 60; m.visible = false;
  /* pts: [[x,z],…]; w: ancho en metros; punta: dibuja la cabeza de flecha */
  m.poner = (pts, w, punta = true, y = 0.35) => {
    const mpts = Math.min(n, pts.length); if (mpts < 2) { m.visible = false; return; }
    const P = pts.slice(0, mpts).map(q => [q[0], q[1]]), L = P[mpts - 1], A = P[mpts - 2];
    let dx = L[0] - A[0], dz = L[1] - A[1]; const dl = hip(dx, dz) || 1; dx /= dl; dz /= dl;
    const hl = punta ? Math.min(w * 2.6, dl * 0.8 + 0.01) : 0;
    if (punta) { P[mpts - 1] = [L[0] - dx * hl, L[1] - dz * hl]; }
    for (let k = 0; k < mpts; k++) {
      const a = P[Math.max(0, k - 1)], b = P[Math.min(mpts - 1, k + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = hip(tx, tz) || 1; tx /= tl; tz /= tl;
      const nx = -tz * w / 2, nz = tx * w / 2, o = 6 * k;
      pos[o] = P[k][0] + nx; pos[o + 1] = y; pos[o + 2] = P[k][1] + nz; pos[o + 3] = P[k][0] - nx; pos[o + 4] = y; pos[o + 5] = P[k][1] - nz;
    }
    for (let k = mpts; k < n; k++) { const o = 6 * k, s = 6 * (mpts - 1); for (let q = 0; q < 6; q++) pos[o + q] = pos[s + q]; }
    const h = 6 * n;
    if (punta) { const bx = P[mpts - 1][0], bz = P[mpts - 1][1], nx = -dz * w * 0.95, nz = dx * w * 0.95; pos[h] = L[0]; pos[h + 1] = y; pos[h + 2] = L[1]; pos[h + 3] = bx + nx; pos[h + 4] = y; pos[h + 5] = bz + nz; pos[h + 6] = bx - nx; pos[h + 7] = y; pos[h + 8] = bz - nz; }
    else for (let q = 0; q < 9; q++) pos[h + q] = pos[6 * (mpts - 1) + (q % 3)];
    g.attributes.position.needsUpdate = true; g.setDrawRange(0, 3 + (mpts - 1) * 6); m.visible = true;
  };
  m.color = c => m.material.color.set(c);
  return m;
}

/* ---------- las marcas del suelo: lo que se ve en el campo en las tres variantes ---------- */
export function crearCapa(ctx) {
  const THREE = ctx.THREE, escena = ctx.escena, ANCHO = ctx.ANCHO;
  const flecha = crearCinta(THREE, 48, COL.adelante), rutaDedo = crearCinta(THREE, 48, COL.ruta), rutaFija = crearCinta(THREE, 48, COL.ruta);
  const senal = [0, 1, 2].map(() => crearCinta(THREE, 4, COL.lado));
  rutaFija.material.opacity = 0.6;
  const mAnillo = new THREE.MeshBasicMaterial({ color: COL.diana, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const anillo = new THREE.Group(), aro = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 56).rotateX(-Math.PI / 2), mAnillo), aro2 = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.46, 40).rotateX(-Math.PI / 2), mAnillo);
  const cruz = [0, 1].map(k => { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.1).rotateX(-Math.PI / 2), mAnillo); b.rotation.y = k * Math.PI / 2; return b; });
  anillo.add(aro, aro2, ...cruz); anillo.position.y = 0.4; anillo.visible = false; anillo.renderOrder = 60; anillo.traverse(o => { o.renderOrder = 60; o.frustumCulled = false; });
  escena.add(flecha, rutaDedo, rutaFija, anillo, ...senal);
  const grueso = () => Math.max(1.6, ANCHO * 0.06);
  const capa = {
    flecha, rutaDedo,
    /* el dedo dibuja: flecha en el suelo (pts [[x,z],…]) o ruta de jinetes */
    arrastre(tipo, pts, color) { const m = tipo === 'ruta' ? rutaDedo : flecha; m.color(color); m.poner(tipo === 'ruta' ? suavizar(pts) : pts, tipo === 'ruta' ? grueso() * 1.1 : grueso() * 1.3, true); },
    limpiar() { flecha.visible = false; rutaDedo.visible = false; },
    actualizar(T) {
      const B = ctx.B; if (!B) return;
      const fin = B.fase === 'fin', w = grueso();
      /* enemigo marcado: diana roja en el suelo */
      const o = B.objetivo, ok = !fin && o >= 0 && !B.sect[o].c[1].roto; anillo.visible = ok;
      if (ok) { const r = ctx.rect('enemigo', o), k = Math.max(5, Math.min(ANCHO * 0.5, r.d * 0.5)) * (1 + 0.05 * Math.sin(T * 5)); anillo.position.set(r.x, 0.4, r.z); anillo.scale.set(k, 1, k); mAnillo.opacity = 0.7 + 0.25 * Math.sin(T * 5); anillo.rotation.y = T * 0.4; }
      /* señal de cada cuerpo nuestro: espera (barra), cede (flecha atrás), rehúsa (flecha al costado) */
      for (let i = 0; i < 3; i++) {
        const c = B.sect[i].c[0], m = senal[i], r = ctx.rect('propio', i), z0 = r.z - r.d / 2;
        if (c.roto || fin) { m.visible = false; continue; }
        if (c.postura === 'ceder') { m.color(COL.atras); m.poner([[r.x, z0 - 1], [r.x, z0 + Math.min(14, r.d * 0.9)]], w * 2.2, true); }
        else if (c.rehusa) { const k = c.rehusa; m.color(COL.lado); m.poner([[r.x + k * ANCHO * 0.12, z0 + 2], [r.x + k * (ANCHO / 2 + 7), z0 + 2]], w * 2.2, true); }
        else if (c.postura === 'esperar') { m.color(COL.lado); m.poner([[r.x - ANCHO * 0.42, z0 - 1.2], [r.x + ANCHO * 0.42, z0 - 1.2]], w * 1.6, false); }
        else m.visible = false;
      }
      /* ruta ya ordenada, mientras cabalgan */
      const k = B.cab, va = !fin && (k.estado === 'yendo' || k.estado === 'cargando') && k.obj >= 0 && k.ala >= 0;
      if (va) { rutaFija.color(COL.ruta); rutaFija.poner(suavizar(ctx.rutaJinetes(k.ala, k.obj)), w, true); } else rutaFija.visible = false;
    },
  };
  return capa;
}

/* ---------- qué hay bajo un dedo: cuerpo nuestro, cuerpo enemigo o jinetes (zona generosa: es un pulgar) ---------- */
export function golpe(ctx, px, py) {
  const B = ctx.B, ex = 16, mini = 30;
  const dentro = (quien, i, extra) => {
    const r = ctx.rect(quien, i), c = ctx.proyecta(r.x, r.z, 1), P = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ctx.proyecta(r.x + a * r.w / 2, r.z + b * r.d / 2, 0.8));
    const x0 = Math.min(c.x - mini, ...P.map(q => q.x)) - extra, x1 = Math.max(c.x + mini, ...P.map(q => q.x)) + extra, y0 = Math.min(c.y - mini, ...P.map(q => q.y)) - extra, y1 = Math.max(c.y + mini, ...P.map(q => q.y)) + extra;
    return px >= x0 && px <= x1 && py >= y0 && py <= y1 ? hip(px - c.x, py - c.y) : -1;
  };
  if (B.fase !== 'fin' && B.cab.estado === 'lista') { const d = dentro('jinetes', 0, 10); if (d >= 0) return { tipo: 'jinetes', i: 0 }; }
  let mejor = null;
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i];
    if (!s.c[0].roto) { const d = dentro('propio', i, ex); if (d >= 0 && (!mejor || d < mejor.d)) mejor = { tipo: 'cuerpo', i, d }; }
    if (!s.c[1].roto) { const d = dentro('enemigo', i, ex); if (d >= 0 && (!mejor || d < mejor.d - 6)) mejor = { tipo: 'enemigo', i, d }; }
  }
  if (!mejor && B.cab.estado !== 'lista') { const d = dentro('jinetes', 0, 10); if (d >= 0) return { tipo: 'jinetes-fuera', i: 0 }; }
  return mejor;
}

/* el cuerpo enemigo no roto más cercano (en pantalla) a un punto */
function enemigoCerca(ctx, px, py) {
  let m = null; for (let i = 0; i < 3; i++) { if (ctx.B.sect[i].c[1].roto) continue; const r = ctx.rect('enemigo', i), c = ctx.proyecta(r.x, r.z, 1), d = hip(px - c.x, py - c.y); if (!m || d < m.d) m = { i, d }; }
  return m && m.i;
}

const NOM_ALA = ['por la izquierda', '', 'por la derecha'];
const COSTADO = { '-1': 'Rehusar izq.', 1: 'Rehusar der.' };

/* ---------- variante A: arrastrar en el campo ---------- */
function montarA(ctx) {
  let g = null; const rot = document.getElementById('rotulo'), ficha = document.getElementById('ficha-cab');
  const quita = () => { if (g) { g = null; ctx.capa.limpiar(); rot.hidden = true; ctx.lento(false); ctx.zoom(1); } };
  const clasifica = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? { tipo: 'rehusar', costado: dx < 0 ? -1 : 1 } : dy < 0 ? { tipo: 'adelantar' } : { tipo: 'retrasar' };
  const nombre = o => o.tipo === 'adelantar' ? 'Adelantar' : o.tipo === 'retrasar' ? (ctx.B.sect[g.i] && ctx.R.lejos(ctx.B.sect[g.i]) ? 'Esperar' : 'Ceder') : COSTADO[o.costado];
  const texto = (t, x, y, malo) => { rot.textContent = t; rot.className = malo ? 'no' : ''; rot.hidden = false; rot.style.transform = 'translate(' + Math.round(Math.max(8, Math.min(ctx.ancho - 8 - rot.offsetWidth, x - rot.offsetWidth / 2))) + 'px,' + Math.round(Math.max(60, y - 70)) + 'px)'; };
  /* en vertical los jinetes quedan tapados por las órdenes: la ficha «Jinetes» se arrastra igual que ellos */
  const empieza = (tipo, i, e, dedo) => { g = { tipo, i, x0: e.clientX, y0: e.clientY, activo: false, id: e.pointerId }; try { dedo.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ } ctx.lento(true); if (tipo === 'jinetes') ctx.zoom(1.4); };
  const V = {
    abajo(e) {
      const h = golpe(ctx, e.clientX, e.clientY); if (!h || (h.tipo !== 'cuerpo' && h.tipo !== 'jinetes')) { g = null; return; }
      empieza(h.tipo, h.i, e, ctx.lienzo);
    },
    mueve(e) {
      if (!g || e.pointerId !== g.id) return;
      const px = e.clientX, py = e.clientY; if (!g.activo && hip(px - g.x0, py - g.y0) < 24) return; g.activo = true;
      const p = ctx.suelo(px, py);
      if (g.tipo === 'cuerpo') {
        const o = clasifica(px - g.x0, py - g.y0), dat = { i: g.i, costado: o.costado }, no = ctx.puede(o.tipo, dat), r = ctx.rect('propio', g.i); g.o = o;
        if (p) { const dx = p.x - r.x, dz = p.z - r.z, L = hip(dx, dz) || 1, K = Math.min(1, 46 / L); ctx.capa.arrastre('flecha', [[r.x, r.z], [r.x + dx * K, r.z + dz * K]], no ? COL.no : o.tipo === 'adelantar' ? COL.adelante : o.tipo === 'retrasar' ? COL.atras : COL.lado); }
        texto(nombre(o) + (no ? ': ' + no : ''), px, py, !!no);
      } else {
        const ala = p && p.x < 0 ? 0 : 2, obj = enemigoCerca(ctx, px, py), no = ctx.puede('jinetes', { obj, ala }); g.o = { tipo: 'jinetes', ala, obj };
        ctx.capa.arrastre('ruta', ctx.rutaJinetes(ala, obj), no ? COL.no : COL.ruta);
        texto('Jinetes ' + NOM_ALA[ala] + ' · contra ' + ctx.nombreSector(obj) + (no ? ': ' + no : ''), px, py, !!no);
      }
    },
    arriba(e) {
      if (!g || e.pointerId !== g.id) return false;
      const act = g.activo, o = g.o, i = g.i; quita();
      if (!act) return false;
      if (o.tipo === 'jinetes') ctx.mando('jinetes', { obj: o.obj, ala: o.ala });
      else { ctx.elegir(i); ctx.mando(o.tipo, { i, costado: o.costado }); }
      return true;
    },
    cancela() { quita(); },
    /* toque corto: sobre un cuerpo enemigo, marcarlo; lo demás sigue como antes */
    toque(px, py) { const h = golpe(ctx, px, py); if (h && h.tipo === 'enemigo') { ctx.mando('marcar', { i: h.i }); return true; } return false; },
    cierra() { quita(); },
  };
  ficha.hidden = false; ficha.style.touchAction = 'none';
  ficha.addEventListener('pointerdown', e => { if (ctx.B.fase === 'fin') return; if (ctx.B.cab.estado !== 'lista') { ctx.cinta('Los jinetes se están rehaciendo', 'mala'); return; } empieza('jinetes', 0, e, ficha); });
  ficha.addEventListener('pointermove', e => V.mueve(e)); ficha.addEventListener('pointercancel', () => quita());
  ficha.addEventListener('pointerup', e => { const act = g && g.activo; V.arriba(e); if (!act) ctx.cinta('Arrastra los jinetes hacia el ala enemiga', ''); });
  return V;
}

/* ---------- variante B: tocar y elegir ---------- */
function montarB(ctx) {
  const menu = document.getElementById('menu'), ficha = document.getElementById('ficha-cab');
  let abierto = null, botones = [], tPuede = 0, tAbre = 0;
  ficha.hidden = false;
  const lim = () => { const m = document.getElementById('mando').getBoundingClientRect(); return { x0: 8, x1: ctx.ancho - 8, y0: ctx.vertical ? 100 : 64, y1: m.top - 54 }; };
  const cierra = () => { abierto = null; botones = []; menu.innerHTML = ''; ctx.lento(false); ctx.zoom(1); };
  const motivoCab = () => { const B = ctx.B; return B.cab.estado !== 'lista' ? 'Los jinetes se están rehaciendo' : ''; };
  function crea(clase, html, tipo, datos) {
    const b = document.createElement('button'); b.className = clase; b.innerHTML = html; menu.appendChild(b);
    b.addEventListener('click', ev => { ev.stopPropagation(); if (performance.now() - tAbre < 450) return; const no = ctx.mando(tipo, datos); if (!no && tipo !== 'marcar') cierra(); });
    botones.push({ b, tipo, datos }); return b;
  }
  function abre(que, i) {
    cierra(); abierto = { que, i }; tAbre = performance.now(); ctx.lento(true); if (que === 'jinetes') ctx.zoom(1.4);
    if (que === 'cuerpo') {
      crea('ob', '<b>▲</b><i>Adelantar</i>', 'adelantar', { i }); crea('ob', '<b>▼</b><i>Retrasar</i>', 'retrasar', { i });
      crea('ob', '<b>◀</b><i>Rehusar izq.</i>', 'rehusar', { i, costado: -1 }); crea('ob', '<b>▶</b><i>Rehusar der.</i>', 'rehusar', { i, costado: 1 });
    } else {
      for (let j = 0; j < 3; j++) { if (ctx.B.sect[j].c[1].roto) continue; for (const ala of [0, 2]) { const b = crea('pl', '<b>' + (ala === 0 ? '↶ por la izquierda' : '↷ por la derecha') + '</b><i></i>', 'jinetes', { obj: j, ala }); b.dataset.j = j; b.dataset.ala = ala; } }
    }
    pon(true);
  }
  /* coloca los botones sobre el cuerpo (se rehace cada imagen: la cámara se mueve) y apaga los que no se pueden */
  function pon(estados) {
    if (!abierto) return; const L = lim(), B = ctx.B;
    if (abierto.que === 'cuerpo') {
      const r = ctx.rect('propio', abierto.i), c = ctx.proyecta(r.x, r.z, 1), ax = Math.max(L.x0 + 88, Math.min(L.x1 - 88, c.x)), ay = Math.max(L.y0 + 88, Math.min(Math.max(L.y0 + 88, L.y1 - 88), c.y));
      const sit = [[0, -62], [0, 62], [-62, 0], [62, 0]]; botones.forEach(({ b }, k) => { b.style.transform = 'translate(' + Math.round(ax - 26 + sit[k][0]) + 'px,' + Math.round(ay - 26 + sit[k][1]) + 'px)'; });
    } else {
      /* un par de botones por cuerpo enemigo, sobre él; si la cámara los junta, se separan para que no se pisen */
      const js = [...new Set(botones.map(({ b }) => +b.dataset.j))].sort(), cx = {}; let ant = -1e9;
      for (const j of js) { const r = ctx.rect('enemigo', j); ant = cx[j] = Math.max(ctx.proyecta(r.x, r.z, 1).x, ant + 116); }
      const ult = cx[js[js.length - 1]], tope = ctx.ancho - 58; if (ult > tope) for (const j of js) cx[j] -= ult - tope;
      ant = 58 - 116; for (const j of js) ant = cx[j] = Math.max(cx[j], ant + 116);
      for (const { b } of botones) {
        const j = +b.dataset.j, ala = +b.dataset.ala, r = ctx.rect('enemigo', j), c = ctx.proyecta(r.x, r.z, 1), y0 = Math.max(L.y0, Math.min(L.y1 - 104, c.y - 52));
        b.style.transform = 'translate(' + Math.round(cx[j] - 56) + 'px,' + Math.round(y0 + (ala === 0 ? 0 : 52)) + 'px)';
      }
    }
    if (estados) for (const { b, tipo, datos } of botones) {
      const no = ctx.puede(tipo, datos); b.classList.toggle('no', !!no);
      if (tipo === 'jinetes') { const r = B.cab && ctx.R.rutasCab(B, datos.obj)[datos.ala === 0 ? 0 : 1], sub = b.querySelector('i'), t = no ? 'no se puede' : r.doble ? 'rodeo largo' : r.duelo ? 'duelo antes' : 'directo'; if (sub.textContent !== t) sub.textContent = t; }
    }
  }
  ficha.addEventListener('click', () => { if (ctx.B.fase === 'fin') return; const no = motivoCab(); if (no) { ctx.cinta(no, 'mala'); return; } if (abierto && abierto.que === 'jinetes') cierra(); else abre('jinetes', 0); });
  document.getElementById('cuerpos').addEventListener('click', e => { const b = e.target.closest('.cuerpo'); if (!b || ctx.B.fase === 'fin') return; const i = +b.dataset.i; if (ctx.B.sect[i].c[0].roto) return; if (abierto && abierto.que === 'cuerpo' && abierto.i === i) cierra(); else abre('cuerpo', i); });
  return {
    toque(px, py) {
      const h = golpe(ctx, px, py);
      if (h && h.tipo === 'cuerpo') { ctx.elegir(h.i); if (abierto && abierto.que === 'cuerpo' && abierto.i === h.i) cierra(); else abre('cuerpo', h.i); return true; }
      if (h && h.tipo === 'jinetes') { if (abierto && abierto.que === 'jinetes') cierra(); else abre('jinetes', 0); return true; }
      if (abierto) { cierra(); return true; }
      if (h && h.tipo === 'enemigo') { ctx.mando('marcar', { i: h.i }); return true; }
      return false;
    },
    cuadro(dt) {
      ficha.classList.toggle('no', ctx.B.cab.estado !== 'lista' || ctx.B.fase === 'fin');
      if (!abierto) return; if (ctx.B.fase === 'fin') { cierra(); return; }
      tPuede += dt; const est = tPuede > 0.2; if (est) tPuede = 0; pon(est);
      if (abierto.que === 'jinetes' && ctx.B.cab.estado !== 'lista') cierra();
    },
    cierra,
  };
}

/* variante C: tablilla de mando. La escribirá otro agente; ver la cabecera de este archivo. */
const montarC = null;
export const VARIANTES = { a: montarA, b: montarB, c: montarC };
export function montar(nombre, ctx) { const f = VARIANTES[nombre]; return f ? f(ctx) : null; }

/* ---------- el texto de cada carta: Espera, Cede, Rehúsa izq./der. ---------- */
export function rotular(B, cont) {
  B.sect.forEach((s, i) => {
    const b = cont.children[i]; if (!b) return; const e = b.querySelector('.est'); if (!e) return; const c = s.c[0], t = [];
    if (!c.roto) { if (c.postura === 'ceder') t.push('Cede'); else if (c.postura === 'esperar') t.push('Espera'); if (c.rehusa) t.push('Rehúsa ' + (c.rehusa < 0 ? 'izq.' : 'der.')); }
    const txt = t.join(' · '); if (e.textContent !== txt) { e.textContent = txt; e.hidden = !txt; }
  });
}

/* ---------- dónde está cada cosa en la pantalla (para las pruebas y las capturas) ---------- */
export function pantalla(ctx) {
  const B = ctx.B, punto = (q, i) => { const r = ctx.rect(q, i), c = ctx.proyecta(r.x, r.z, 1); return { x: Math.round(c.x), y: Math.round(c.y) }; };
  return {
    ancho: ctx.ancho, alto: ctx.alto,
    propios: B.sect.map((s, i) => Object.assign(punto('propio', i), { roto: s.c[0].roto })),
    enemigos: B.sect.map((s, i) => Object.assign(punto('enemigo', i), { roto: s.c[1].roto })),
    jinetes: Object.assign(punto('jinetes', 0), { lista: B.cab.estado === 'lista' }),
    ficha: (() => { const f = document.getElementById('ficha-cab'); if (!f || f.hidden) return null; const r = f.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })(),
  };
}
