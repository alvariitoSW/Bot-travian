/* Pieza «acciones» (TP7a): lo que pasa en la escena de la falange, sin pantalla (corre en Node).
   Marcha, órdenes, salva de pila, choque contra el muro de puntas, tu golpe, empuje, ruptura y huida.
   Contrato: crearAcciones(m) con m = { S, H, azar, azarP, zanF, zanR, avisa } devuelve
     { reinicia, paso(dt), orden(nombre), golpe(), marcado(), frente(), bot(dt) }.
   avisa(tipo, datos) es la única salida hacia la pantalla y el sonido (cinta, grito, temblor, golpes); en Node, nada.
   El estado vive en S (lo lee escena.js para dibujar). Licencia de juego: tiradas de dado para cada intento, golpe y pilum. */
import { FILES, FILAS, M, DX, BAJAN, YO, ALCANCE, puesto, retraso, vaiven } from './formacion.js';
import { crearPaso, velocidad, pisa } from './locomocion.js';
import { crearUnidad } from './unidad.js';
import { creaRomanos, COLS_R, N_R, DZ_R } from './enemigo.js';

export const V_AVANCE = 0.85, V_ROM = 1.3, V_CARGA = 4.0, V_HUYE = 4.6, V_EMPUJE = 0.38;
export const D_PILA = 19, D_CARGA = 13, VUELO_PILA = 1.35, NPILA = 16;
const G = 9.8, suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hacia = (v, obj, d) => v < obj ? Math.min(obj, v + d) : Math.max(obj, v - d);

export function crearAcciones(m) {
  const { S, H, azar, azarP, zanF, zanR } = m, avisa = m.avisa || (() => {});
  function reinicia() {
    Object.assign(S, { T: 0, fase: 'marcha', zF: -10, zR: -62, andando: false, picas: false, orden: null, yo: YO, choque: false, tChoque: -9, tSalva: -9, salva: false,
      tCarga: -9, tGolpe: -9, golpes: { buenos: 0, parados: 0 }, ganador: null, tFin: -9, tRoto: -9, temblor: 0, avisoPicas: false, kFrente: 0, abanico: 0, PILA: [] });
    S.U = crearUnidad({ hombres: M, nombre: 'Tu sintagma' }); S.R = crearUnidad({ hombres: N_R, nombre: 'El manípulo' });
    S.fal = [];
    for (let i = 0; i < M; i++) {
      const f = i % FILES, r = Math.floor(i / FILES), p = puesto(f, r, S.zF), a = azarP(), b = azarP();
      S.fal.push({ i, f, r, r0: r, x: p.x, z: p.z, yaw: Math.PI, vivo: true, muere: 0, huye: false, kB: 0, objB: 0, tB: 0, kA: 0, kG: 0, tG: -9, heridas: 0, az: a,
        va: vaiven(a, b), fase: b * 3, A: 0, B: 0, mx: 0, paso: crearPaso({ zW: zanF.walk, zR: zanF.run, fase: azarP(), prisa: 0.85 + azarP() * 0.3 }) });
    }
    S.rom = creaRomanos(azar, azarP, zanR);
    for (const h of S.rom) h.z = S.zR - h.r * DZ_R + h.jz;
    for (let i = 0; i < NPILA; i++) S.PILA.push({ est: 0, p: [0, 0, 0], v: [0, 0, 0], t0: 0, h: null, s: 0, dir: [0, 0, 1] });
  }
  const vivosF = () => S.fal.filter(h => h.vivo && !h.huye);
  /* la fila de cada uno entre los vivos de su columna (los de detrás pasan adelante: los huecos se cierran) */
  function rangos(L, col) {
    const porCol = new Map();
    for (const h of L) if (h.vivo && !h.huye) { const c = h[col]; if (!porCol.has(c)) porCol.set(c, []); porCol.get(c).push(h); }
    for (const l of porCol.values()) { l.sort((a, b) => a.r0 - b.r0 || a.i - b.i); l.forEach((h, k) => { h.r = k; }); }
    return porCol;
  }
  /* mueve a un hombre hacia (tx, tz) con su paso: acelera y frena a su aire, y la pierna avanza lo que recorre */
  function mueve(h, tx, tz, vmax, dt) {
    const dx = tx - h.x, dz = tz - h.z, dist = Math.hypot(dx, dz), v = velocidad(h.paso, Math.min(vmax, dist * 2.2), dt), d = Math.min(dist, v * dt);
    if (dist > 1e-4) { h.x += dx / dist * d; h.z += dz / dist * d; }
    pisa(h.paso, d, dt);
  }
  /* la punta de la primera fila: cuánto sale por delante (con las picas abajo, unos 4 m; alzadas, nada) */
  const frente = () => S.kFrente * ALCANCE;
  const muere = (h, quien) => {
    if (!h.vivo) return; h.vivo = false; h.muere = S.T;
    if (quien === 'f') { S.U.baja(1); S.R.causa(1); if (S.fal[S.yo] === h) cambiaYo(); }
    else { S.R.baja(1); S.U.causa(1); }
    avisa('cae', { h, quien });
  };
  function cambiaYo() {
    const yo = S.fal[S.yo], L = vivosF(); if (!L.length) return;
    const otro = L.filter(h => h.f === yo.f).sort((a, b) => a.r0 - b.r0)[0] || L.sort((a, b) => Math.abs(a.f - yo.f) + a.r * 0.1 - Math.abs(b.f - yo.f) - b.r * 0.1)[0];
    S.yo = otro.i; avisa('cinta', { texto: 'Has caído. Sigues como otro falangita', mala: true });
  }
  /* ---------- órdenes (un botón cada una) ---------- */
  function orden(n) {
    if (S.fase === 'fin' || S.U.roto) return;
    if (n === 'picas') { S.picas = !S.picas; avisa('grito', { texto: S.picas ? '¡Picas abajo!' : '¡Alzad las picas!' }); avisa('madera', {}); }
    if (n === 'avanzar') { S.andando = !S.andando; S.orden = null; avisa('grito', { texto: S.andando ? '¡Adelante, paso a paso!' : '¡Alto!' }); }
    if (n === 'aguantar') { S.andando = false; S.orden = 'aguantar'; if (!S.picas) S.picas = true; avisa('grito', { texto: '¡Aguantad! ¡Firmes!' }); }
    if (n === 'empujad' && S.choque) { S.orden = S.orden === 'empujar' ? null : 'empujar'; S.andando = false; S.picas = true; avisa('grito', { texto: S.orden ? '¡Empujad!' : '¡Firmes!' }); }
  }
  /* el enemigo marcado: el romano más cercano delante de tu columna, al alcance de tu sarisa */
  function marcado() {
    const yo = S.fal[S.yo]; if (!yo || !yo.vivo || yo.r !== 0 || !S.choque) return null;
    let mejor = null, dm = 1e9;
    for (const h of S.rom) if (h.vivo && (h.est === 'muro' || h.est === 'dentro')) { const d = Math.abs(h.x - yo.x) * 2 + Math.abs(h.z - yo.z); if (Math.abs(h.x - yo.x) < 1.5 && d < dm) { dm = d; mejor = h; } }
    return mejor;
  }
  /* tu golpe: con el que está delante; respuesta en palabras */
  function golpe() {
    const yo = S.fal[S.yo];
    if (!S.choque || !yo || !yo.vivo || S.fase === 'fin') return null;
    if (S.T - S.tGolpe < 0.9) return 'espera';
    const r = marcado(); S.tGolpe = S.T; yo.tG = S.T;
    if (!r) { avisa('cinta', { texto: 'Nadie a tu alcance' }); return 'nadie'; }
    const p = (r.est === 'dentro' ? 0.72 : 0.55) * (1 - 0.3 * S.U.cansancio);
    if (azar() < p) {
      S.golpes.buenos++; r.tRecibe = S.T; r.heridas++;
      if (r.heridas >= 2 || azar() < 0.6) { muere(r, 'r'); avisa('cinta', { texto: '¡Buen golpe! Cae', buena: true }); }
      else avisa('cinta', { texto: 'Buen golpe: le has herido', buena: true });
      avisa('hierro', { h: r }); return 'bueno';
    }
    S.golpes.parados++; avisa('cinta', { texto: 'Parado: te lo quita con el escudo' }); avisa('madera', { h: r }); return 'parado';
  }
  /* ---------- la salva de pila ---------- */
  function lanzaSalva() {
    S.salva = true; S.tSalva = S.T; let k = 0;
    const blancos = vivosF();
    for (const r of S.rom) if (r.vivo && r.pilum && k < NPILA) {
      const P = S.PILA[k++], b = blancos[Math.floor(azar() * blancos.length)], p0 = [r.x - 0.2, H(r.x, r.z) + 2.0, r.z], p1 = [b.x + (azar() - 0.5) * 1.2, H(b.x, b.z) + 1.1, b.z + (azar() - 0.5) * 1.4];
      const t = VUELO_PILA * (0.9 + azar() * 0.2);
      P.est = 1; P.t0 = S.T + azar() * 0.35; P.dur = t; P.p0 = p0; P.b = b; P.p = p0.slice();
      P.v = [(p1[0] - p0[0]) / t, (p1[1] - p0[1] + 0.5 * G * t * t) / t, (p1[2] - p0[2]) / t]; r.pilum = false; r.tAtk = S.T;
    }
    avisa('salva', {});
  }
  function vuelaPila() {
    for (const P of S.PILA) {
      if (P.est !== 1) continue; const t = S.T - P.t0; if (t < 0) continue;
      P.p = [P.p0[0] + P.v[0] * t, P.p0[1] + P.v[1] * t - 0.5 * G * t * t, P.p0[2] + P.v[2] * t]; P.dir = [P.v[0], P.v[1] - G * t, P.v[2]];
      if (t < P.dur) continue;
      /* llega: ¿le para el bosque de astas alzadas? (Polibio 18.30), ¿el escudo?, ¿el hombre?, o al suelo */
      const b = P.b, L = S.fal.filter(h => h.vivo && h.f === b.f && h.r <= b.r), alz = L.filter(h => h.kB < 0.5).length / Math.max(1, L.length), dado = azar();
      const asta = S.fal.filter(h => h.vivo && Math.abs(h.f - b.f) <= 1 && h.r <= b.r && h.kB < 0.5).sort((a, c) => c.r - a.r)[0];
      if (asta && dado < 0.62 * alz) { P.est = 2; P.h = asta; P.s = 3.3 + azar() * 1.6; P.giro = (azar() - 0.5) * 0.6; avisa('clava', { p: P.p }); }
      else if (b.vivo && b.r <= 1 && dado < 0.62 * alz + 0.45) { P.est = 3; P.h = b; avisa('escudo', { p: P.p }); }
      else if (b.vivo && dado < 0.62 * alz + 0.45 + 0.16) { P.est = 4; P.h = b; muere(b, 'f'); }
      else { P.est = 5; P.p[1] = H(P.p[0], P.p[2]) + 0.6; avisa('tierra', { p: P.p }); }
    }
  }
  /* ---------- un paso de la escena ---------- */
  function paso(dt) {
    S.T += dt; const U = S.U, R = S.R;
    const colF = rangos(S.fal, 'f'), colR = rangos(S.rom, 'c');
    /* la primera fila: cuánto ha bajado la sarisa (de esto depende el muro de puntas) */
    const fr = S.fal.filter(h => h.vivo && !h.huye && h.r === 0); S.kFrente = fr.length ? fr.reduce((a, h) => a + h.kB, 0) / fr.length : 0;
    /* la falange avanza al paso, prieta; con «Empujad» aprieta contra el enemigo */
    if (!U.roto && S.fase !== 'fin') {
      if (S.andando && !S.choque) S.zF -= V_AVANCE * (S.picas ? 0.85 : 1) * dt;
      if (S.choque && S.orden === 'empujar') { S.zF -= V_EMPUJE * (1 - 0.6 * U.cansancio) * (R.roto ? 0 : 1) * dt; U.cansa(dt, 0.045); R.cansa(dt, 0.06); R.anima(-0.009 * dt); }
      if (S.choque && S.orden === 'aguantar') U.cansa(dt, -0.012);
      if (S.choque) { U.cansa(dt, 0.006); R.cansa(dt, 0.012); }
    }
    for (const h of S.fal) {
      if (!h.vivo) { h.paso.v = 0; pisa(h.paso, 0, dt); continue; }
      if (h.huye) { h.yaw = 0; mueve(h, h.x + (h.f - 3.5) * 0.3, h.z + 30, V_HUYE, dt); continue; }
      /* la sarisa: las cinco primeras filas la bajan si se manda, cada fila con su retraso; las de detrás se inclinan en abanico */
      const obj = S.picas && h.r < BAJAN ? 1 : 0, objA = S.picas ? 1 : 0;
      if (obj !== h.objB) { h.objB = obj; h.tB = S.T + retraso(h.r, h.az); }
      if (S.T >= h.tB) { h.kB = hacia(h.kB, obj, dt / 0.95); h.kA = hacia(h.kA, objA, dt / 1.3); }
      h.kG = Math.max(0, 1 - Math.abs(S.T - h.tG - 0.18) / 0.22) * (h.r === 0 ? 1 : 0);
      const p = puesto(h.f, h.r, S.zF); mueve(h, p.x, p.z, 1.5, dt);
    }
    /* romanos */
    const muroZ = S.zF - frente(), vR = S.fase === 'carga' || S.choque ? V_CARGA : V_ROM;
    if (S.fase === 'marcha' && S.T > 1.5) S.zR += V_ROM * dt;
    if (S.fase === 'carga' && !S.choque) S.zR += V_CARGA * dt;
    if (S.choque) S.zR = muroZ;
    if (S.fase === 'marcha' && S.zF - S.zR < D_PILA) { S.fase = 'pila'; S.tPila = S.T; avisa('grito', { texto: '¡Pila! ¡Cuidado!' }); }
    if (S.fase === 'pila' && !S.salva && S.T - S.tPila > 1.1) lanzaSalva();
    if (S.fase === 'pila' && S.salva && S.T - S.tSalva > 1.9) { S.fase = 'carga'; S.tCarga = S.T; avisa('carga', {}); }
    for (const h of S.rom) {
      if (!h.vivo) { h.paso.v = 0; pisa(h.paso, 0, dt); continue; }
      if (h.est === 'huye') { h.yaw = Math.PI; mueve(h, h.x, h.z - 40, V_HUYE * h.vMas, dt); continue; }
      h.yaw = 0;
      const enMuro = h.r === 0 && (S.choque || S.fase === 'carga');
      let tz = Math.min(S.zR, muroZ - 0.05) - h.r * DZ_R + h.jz * (S.choque ? 0.2 : 1), tx = h.x;
      if (h.est === 'dentro') { const c = S.fal.filter(f => f.vivo && !f.huye && f.r === 0).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0]; tz = S.zF - 0.78; if (c) tx = c.x + 0.12; }
      if (S.choque && h.r > 0) { const del = colR.get(h.c); const f0 = del && del[0]; if (f0) tz = Math.min(tz, f0.z - h.r * 1.2); }
      mueve(h, tx, tz, S.choque && h.est === 'dentro' ? 1.8 : vR * h.vMas, dt);
      /* llega al muro de puntas */
      if (enMuro && h.est !== 'dentro' && h.est !== 'muro' && h.z >= muroZ - 0.35) {
        h.est = 'muro'; h.intento = S.T + 0.8 + azar() * 1.2;
        if (!S.choque) { S.choque = true; S.tChoque = S.T; S.andando = false; avisa('choque', {}); }
        if (S.kFrente < 0.4) { h.est = 'dentro'; continue; }   /* picas alzadas: entran sin más */
        /* los que cargan contra las puntas se frenan y caen; con «Aguantar», más */
        if (azar() < (S.orden === 'aguantar' ? 0.3 : 0.12)) { muere(h, 'r'); continue; }
      }
      if (h.r === 0 && S.choque && h.est === 'marcha') h.est = 'muro';
    }
    /* el choque: los del muro intentan apartar las puntas con el escudo y meterse; los de dentro pelean con la primera fila */
    if (S.choque && !R.roto && !U.roto) {
      const ag = S.orden === 'aguantar', em = S.orden === 'empujar';
      for (const h of S.rom) {
        if (!h.vivo || h.r !== 0) continue;
        if (h.est === 'muro' && S.T >= h.intento) {
          h.intento = S.T + 1.6 + azar() * 0.9;
          const pIn = 0.3 * (ag ? 0.6 : 1) * (em ? 0.75 : 1) * (0.55 + 0.6 * R.animo) * (S.kFrente > 0.6 ? 1 : 2.6);
          if (azar() < pIn) { h.est = 'dentro'; h.tAtk = S.T; avisa('dentro', { h }); }
          else if (azar() < 0.12 * (ag ? 1.5 : 1) * (em ? 1.3 : 1) * (1 + R.cansancio)) muere(h, 'r');
          else { h.tRecibe = S.T; avisa('madera', { h }); }
        }
        if (h.est === 'dentro') {
          if (S.T >= h.intento) {
            h.intento = S.T + 1.3 + azar() * 0.6; h.tAtk = S.T;
            const v = S.fal.filter(f => f.vivo && !f.huye && f.r === 0).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
            if (v) { const esYo = v.i === S.yo, p = 0.3 * (1 + 0.5 * U.cansancio) * (ag ? 0.85 : 1) * (esYo ? 0.6 : 1);
              if (azar() < p) { if (esYo && ++v.heridas < 2) avisa('cinta', { texto: '¡Te hieren! Aguanta', mala: true }); else muere(v, 'f'); } else avisa('madera', { h }); }
          }
          /* las sarisas de las filas 2.ª a 5.ª le buscan entre las astas */
          const atras = S.fal.filter(f => f.vivo && !f.huye && f.r > 0 && f.r < BAJAN && Math.abs(f.x - h.x) < DX * 1.6 && f.kB > 0.6).length;
          if (azar() < dt * 0.045 * atras * (em ? 1.2 : 1)) muere(h, 'r');
        }
      }
      U.tic(dt); R.tic(dt);
    }
    vuelaPila();
    /* romper: el que rompe da la espalda y huye corriendo */
    if (!S.ganador && (R.roto || U.roto)) {
      S.ganador = R.roto ? 'falange' : 'romanos'; S.tRoto = S.T; S.orden = null; S.andando = false;
      if (R.roto) for (const h of S.rom) { if (h.vivo) h.est = 'huye'; }
      else for (const h of S.fal) { if (h.vivo) h.huye = true; }
      avisa('rompe', { ganador: S.ganador });
    }
    if (S.ganador && S.fase !== 'fin' && S.T - S.tRoto > 4) { S.fase = 'fin'; S.tFin = S.T; avisa('fin', {}); }
    if (!S.picas && S.fase === 'carga' && !S.avisoPicas) { S.avisoPicas = true; avisa('cinta', { texto: '¡Cargan! Baja las picas', mala: true }); }
    S.temblor = Math.max(0, S.temblor - dt * 2.5);
  }
  /* el «bot» de las pruebas: avanza, deja pasar la salva con las picas alzadas, baja las picas, aguanta, empuja y golpea */
  function bot() {
    if (S.fase === 'marcha' && !S.andando && S.T > 0.5) orden('avanzar');
    if (S.salva && !S.picas && S.T - S.tSalva > 1.6) orden('picas');
    if (S.choque && !S.orden && S.T - S.tChoque < 6) orden('aguantar');
    if (S.choque && S.orden === 'aguantar' && S.T - S.tChoque > 6) orden('empujad');
    if (S.choque && S.T - S.tGolpe > 1.0 && marcado()) golpe();
  }
  return { reinicia, paso, orden, golpe, marcado, frente, bot, mueve };
}
