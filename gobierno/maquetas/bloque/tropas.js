/* LP3 · Los hombres que se ven de cada bloque (sin three.js: corre también en Node).
   Las reglas (js/bloque-ia.js) solo dan cada bloque como un rectángulo (x, z, ang, ancho, fondo, U.enPie). Aquí cada bloque
   tiene sus hombres: un hueco en la formación y un hombre que anda hacia él a su paso, sin saltos.
   Tu manípulo no: sus hombres son los del bloque de LP1 (S.B.hombres), que ya andan solos hacia su hueco.
   Cuando un bloque pierde hombres, caen los de delante (se quedan en el suelo) y los de atrás cierran filas.
   Contrato: crearTropas({ S, muroDelante? }) → { figs, caidos, paso(dt, T), asienta(), lanzan(b, T), ofs }
     ofs: Map bloque → { x, z }: cuánto se dibuja apartado ese bloque entero (LP5a, lo pone fisica.js). f.tx, f.tz: el sitio de las reglas
     figs[]   hombres en pie: { bando 'r'|'g', x, z, yaw, clip, t, semilla, talla, b }  (yaw: mira hacia (sen yaw, cos yaw))
     caidos[] hombres caídos: los mismos campos, con clip 'morir' (se quedan donde cayeron) */

import { clipLucha } from '../../../js/combate-tropas.js';   /* CB3: la pose desde el motor de lucha */

const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) }), de = a => ({ x: Math.cos(a), z: Math.sin(a) });
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
/* azar fijo por hombre (no toca el azar de la partida) */
const hash = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
/* huecos por tipo de bloque: de lado (m), de fondo (m) y cuánto se desordena cada hombre (m). Licencia de juego */
const HUECO = { manipulo: [1.0, 1.2, 0.08], galos: [1.3, 1.35, 0.38], nobles: [1.2, 1.3, 0.25], tiradores: [1.7, 1.8, 0.5] };
const DUR = { golpear: 1.55, lanzar: 1.85, cubrirse: 1.25, morir: 2.4, encajar: 0.35 };
const CAIDOS_MAX = 700;
const FRENA = 0.88;   /* LP5a: el que va contra alguien afloja hasta 1 − FRENA de su paso (lo mismo que fisica.js FRENA) */

export function crearTropas({ S, muroDelante = false, reales = [] }) {   /* FU3: reales = [{ b, hombres }]: bloques que se pintan con sus hombres de verdad (x, z, yaw, vivo), no con huecos */   /* FU1: muroDelante: en testudo la 1.ª fila no se cubre arriba, lleva el escudo de frente (guardia) */
  const figs = [], caidos = [];
  /* LP5a: cuánto se dibuja apartado cada bloque entero (lo pone la física cuando las reglas meten un bloque en otro):
     sus hombres van a su sitio más esto, y las filas no se deforman */
  const ofs = new Map(), CERO = { x: 0, z: 0 }, ofsDe = b => ofs.get(b) || CERO;
  let semillas = 1;
  const nuevo = (b, extra) => ({ bando: b.bando, b, x: 0, z: 0, yaw: Math.PI - b.ang, clip: 'quieto', t: 0, v: 0, semilla: semillas++ * 1.37, talla: 0.95 + 0.1 * hash(semillas * 3.1), pausa: 0, esp: null, ...extra });

  /* ---------- tu manípulo: los hombres del bloque de LP1 ---------- */
  const tuyo = S.tuyo, B = S.B;
  if (B) for (const h of B.hombres) { const f = nuevo(tuyo, { h, x: h.x, z: h.z, yaw: h.yaw }); figs.push(f); }
  const conReales = new Set(reales.map(r => r.b));
  for (const { b, hombres } of reales) for (const h of hombres) if (h.vivo !== false) figs.push(nuevo(b, { h, x: h.x, z: h.z, yaw: h.yaw }));

  /* ---------- los demás bloques: un hueco por hombre ---------- */
  for (const b of S.bloques) {
    if ((B && b === tuyo) || conReales.has(b)) continue;
    const [sx, sz, des] = HUECO[b.tipo] || HUECO.manipulo, n = b.U.hombres;
    const cols = Math.max(2, Math.round(b.ancho / sx)), filas = Math.ceil(n / cols);
    b.vis = { cols, filas, sx: b.ancho / cols, sz: Math.max(sz, filas > 1 ? Math.min(1.6, b.fondo / (filas - 1)) : sz), des, men: [] };
    for (let k = 0; k < n; k++) { const f = nuevo(b, { slot: k, jx: (hash(semillas * 7.7) - 0.5) * 2 * des, jz: (hash(semillas * 5.3) - 0.5) * 2 * des }); b.vis.men.push(f); figs.push(f); }
    for (const f of b.vis.men) { const p = hueco(b, f); f.x = p.x; f.z = p.z; }
  }

  /* el hueco de un hombre: (x, z) del bloque es el centro de su primera fila; las filas van hacia atrás */
  function hueco(b, f) {
    const V = b.vis, c = f.slot % V.cols, fi = Math.floor(f.slot / V.cols), F = fr(b.ang), D = de(b.ang);
    let lado = (c - (V.cols - 1) / 2) * V.sx + f.jx, delante = -fi * V.sz + f.jz;
    if (b.estado === 'huye' || b.estado === 'fuera') { lado *= 1.5; delante = delante * 1.6 - 2; }      /* al huir se desparraman */
    return { x: b.x + D.x * lado + F.x * delante, z: b.z + D.z * lado + F.z * delante, fila: fi };
  }

  function cae(f, T) {
    f.vivo = false; f.clip = 'morir'; f.t = 0; f.yawCae = f.yaw + (hash(f.semilla) - 0.5) * 1.2;   /* LP5a: gira hacia ahí mientras cae (sin salto) */
    const i = figs.indexOf(f); if (i >= 0) figs.splice(i, 1);
    caidos.push(f); if (caidos.length > CAIDOS_MAX) caidos.shift();
  }

  /* lanzar (jabalinas de los tiradores o pilum de tu primera fila): la primera fila hace el gesto */
  function lanzan(b, T) {
    const men = b === tuyo ? figs.filter(f => f.b === tuyo && f.h && f.h.fila <= 1) : (b.vis ? b.vis.men.filter(f => Math.floor(f.slot / b.vis.cols) <= 1) : []);
    for (const f of men) f.esp = { clip: 'lanzar', t0: T + hash(f.semilla * 9) * 0.35 };
  }

  /* el movimiento que toca: por el bloque y por lo que anda el hombre */
  function animacion(f, b, fila, dt, T) {
    if (f.esp) {
      if (T < f.esp.t0) { /* espera su turno */ }
      else if (T - f.esp.t0 < DUR[f.esp.clip] / (f.esp.vel || 1)) { if (f.clip !== f.esp.clip) { f.clip = f.esp.clip; f.t = 0; } f.t += dt * (f.esp.vel || 1); return; }   /* FU2: vel acelera o frena el gesto */
      else f.esp = null;
    }
    const enChoque = b.contactos && b.contactos.length > 0, huye = b.estado === 'huye' || b.estado === 'fuera';
    /* CB3: el que lucha en el motor (combate-tropas.js) se mueve como dice el motor: golpe, parada (escudo arriba) o guardia */
    if (!huye && f.hc && f.hc.activo && !(b.bando === 'r' && b.orden === 'testudo')) {
      const c = clipLucha(f.hc, T, DUR);
      if (c) {
        if (c.t === null) { if (f.clip !== 'guardia') { f.clip = 'guardia'; f.t = hash(f.semilla * 11) * 3; } f.t += dt; }
        else { f.clip = c.clip; f.t = c.t; }
        return;
      }
    }
    let clip;
    if (huye) clip = 'correr';
    else if (b.bando === 'r' && b.orden === 'testudo') clip = muroDelante && fila === 0 ? 'guardia' : 'cubrirse';
    else if (enChoque && fila <= 1 && f.v < 1.2) clip = 'golpear';
    else if (f.v > 2.3) clip = 'correr';
    else if (f.v > 0.3) clip = 'andar';
    else clip = enChoque || b.estado === 'choque' ? 'guardia' : (b.bando === 'r' ? 'guardia' : 'quieto');
    if (clip === 'golpear') {      /* golpe, pausa y otro golpe; cada uno a su compás */
      if (f.clip !== 'golpear' && f.clip !== 'guardia') { f.clip = 'guardia'; f.t = hash(f.semilla) * 2; f.pausa = T + hash(f.semilla * 3) * 1.5; }
      if (f.clip === 'guardia' && T >= f.pausa) { f.clip = 'golpear'; f.t = 0; }
      else if (f.clip === 'golpear' && f.t > DUR.golpear) { f.clip = 'guardia'; f.pausa = T + 0.3 + hash(f.semilla + T) * 1.4; }
      f.t += dt; return;
    }
    if (clip !== f.clip) { f.clip = clip; f.t = clip === 'cubrirse' ? 0 : hash(f.semilla * 11) * 3; }
    f.t += dt * (clip === 'andar' ? Math.max(0.6, Math.min(1.5, f.v / 1.2)) : clip === 'correr' ? Math.max(0.8, Math.min(1.3, f.v / 3.4)) : 1);
    if (clip === 'cubrirse') f.t = Math.min(f.t, DUR.cubrirse - 0.05);
  }

  /* LP5a: da un paso de m metros hacia (ux, uz). Si la física le dice que va contra alguien (f.bn: hacia dónde está el
     estorbo y cuánto estorba, de 0 a 1), quita lo que iría contra él y resbala de lado; de frente, rodea por un lado fijo */
  function anda(f, ux, uz, m) {
    const b = f.bn; if (b) m *= 1 - FRENA * b.k;
    let sx = ux * m, sz = uz * m;
    if (b && b.k > 0.05) {
      const dot = sx * b.x + sz * b.z;
      if (dot > 0) {
        sx -= b.x * dot * b.k; sz -= b.z * dot * b.k;
        if (Math.abs(ux * b.z - uz * b.x) < 0.5 && b.k > 0.5) { const lado = hash(f.semilla * 13) < 0.5 ? -1 : 1, r = m * 0.6 * b.k; sx += -b.z * lado * r; sz += b.x * lado * r; }
      }
    }
    f.x += sx; f.z += sz; f.px = sx; f.pz = sz; return Math.hypot(sx, sz);
  }
  /* LP5a: el sitio que dan las reglas, suavizado (f.tx, f.tz). Las reglas lo mueven a saltitos (20 veces por segundo) y
     la pantalla va a 30–60: sin suavizar, el hombre anda y se para a cada fotograma (tiembla). τ = SUAVE s */
  const SUAVE = 0.1;
  function sigue(f, x, z, dt) {
    if (f.tx === undefined || Math.hypot(x - f.tx, z - f.tz) > 3) { f.tx = x; f.tz = z; return; }   /* un salto de las reglas (huecos nuevos): sin suavizar */
    const k = 1 - Math.exp(-dt / SUAVE); f.tx += (x - f.tx) * k; f.tz += (z - f.tz) * k;
  }
  /* gira hacia ang con tope de vel rad/s */
  const giraA = (f, ang, vel, dt) => { const d = angDif(ang, f.yaw), m = vel * dt; f.yaw += Math.abs(d) <= m ? d : Math.sign(d) * m; };

  function paso(dt, T) {
    /* tu manípulo: copia a los hombres de LP1 y mira su velocidad */
    for (const f of figs.slice()) {
      if (!f.h) continue; const h = f.h, bf = f.b;   /* tu bloque (LP1) y los de hombres reales (FU3) */
      if (!h.vivo) { cae(f, T); continue; }
      /* LP5a: anda hacia su hombre de LP1 (no se pega a él): así, si la física lo aparta, vuelve a su paso, sin saltos */
      const hv = Math.hypot(h.x - (f.hx ?? h.x), h.z - (f.hz ?? h.z)) / Math.max(dt, 1e-3); f.hx = h.x; f.hz = h.z;
      const o = ofsDe(bf); sigue(f, h.x, h.z, dt);
      const dx = f.tx + o.x - f.x, dz = f.tz + o.z - f.z, d = Math.hypot(dx, dz), m0 = Math.min(d, Math.min(5, hv + 0.6 + d * 2.5) * dt);
      const m = d > 1e-4 ? anda(f, dx / d, dz / d, m0) : (f.px = f.pz = 0);
      const v = m / Math.max(dt, 1e-3); f.v += (v - f.v) * Math.min(1, dt * 6);
      giraA(f, h.yaw, 4, dt);
      animacion(f, bf, h.fila ?? h.r ?? 0, dt, T);
    }
    /* los demás bloques */
    for (const b of S.bloques) {
      if (!b.vis) continue; const V = b.vis;
      /* bajas: caen los de delante (los del centro antes) y los de atrás cierran filas */
      const vivos = V.men.filter(f => f.vivo !== false); let sobran = vivos.length - Math.max(0, b.U.enPie);
      if (sobran > 0) {
        /* FU2: la figura marcada (tu rival del duelo) cae la primera, y se le quita la marca */
        const orden = vivos.slice().sort((a, c) => ((c.marcado ? 1 : 0) - (a.marcado ? 1 : 0)) || (Math.floor(a.slot / V.cols) - Math.floor(c.slot / V.cols)) || (Math.abs(a.slot % V.cols - (V.cols - 1) / 2) - Math.abs(c.slot % V.cols - (V.cols - 1) / 2)) + (hash(a.semilla) - hash(c.semilla)) * 3);
        for (const f of orden) { if (sobran-- <= 0) break; f.marcado = false; cae(f, T); }
        V.men = V.men.filter(f => f.vivo !== false); V.men.sort((a, c) => a.slot - c.slot); V.men.forEach((f, k) => { f.slot = k; });
      }
      const huye = b.estado === 'huye' || b.estado === 'fuera', corre = huye || b.orden === 'cargar' || b.estado === 'reforma';
      const vmax = corre ? 4.0 : 2.4;
      for (const f of V.men) {
        const p = hueco(b, f), o = ofsDe(b); sigue(f, p.x, p.z, dt);
        const dx = f.tx + o.x - f.x, dz = f.tz + o.z - f.z, d = Math.hypot(dx, dz);
        const quiere = d < 0.05 ? 0 : Math.min(vmax, d * 1.6 + (d > 0.4 ? 0.8 : 0));
        f.v += (quiere - f.v) * Math.min(1, dt * 4);
        const m = Math.min(d, f.v * dt); if (d > 1e-4) anda(f, dx / d, dz / d, m); else f.px = f.pz = 0;
        const mira = huye ? Math.atan2(dx, dz) : (d > 1.0 && f.v > 0.8 ? Math.atan2(dx, dz) : Math.PI - b.ang);
        giraA(f, mira, 3.5, dt);
        animacion(f, b, p.fila, dt, T);
      }
    }
    for (const f of caidos) if (f.t < DUR.morir) { f.t += dt; if (f.yawCae !== undefined) giraA(f, f.yawCae, 0.8, dt); }
  }

  /* tras saltar en el tiempo (capturas): todos en su hueco y mirando al frente */
  function asienta() {
    for (const b of S.bloques) if (b.vis) for (const f of b.vis.men) { const p = hueco(b, f), o = ofsDe(b); f.tx = p.x; f.tz = p.z; f.x = p.x + o.x; f.z = p.z + o.z; f.yaw = b.estado === 'huye' ? -b.ang : Math.PI - b.ang; f.v = 0; }
    for (const f of figs) if (f.h) { const o = ofsDe(f.b); f.tx = f.h.x; f.tz = f.h.z; f.x = f.h.x + o.x; f.z = f.h.z + o.z; f.yaw = f.h.yaw; }
    for (const f of caidos) { f.t = DUR.morir; if (f.yawCae !== undefined) f.yaw = f.yawCae; }
  }
  return { figs, caidos, paso, asienta, lanzan, DUR, ofs };
}
