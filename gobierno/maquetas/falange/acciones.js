/* Pieza «acciones» (TP7a): lo que pasa en la escena de la falange, sin pantalla (corre en Node).
   Marcha, órdenes, salva de pila, choque contra el muro de puntas, tu golpe, empuje, ruptura y huida.
   Contrato: crearAcciones(m) con m = { S, H, azar, azarP, zanF, zanR, avisa } devuelve
     { reinicia, paso(dt), orden(nombre), golpe(), marcado(), frente(), bot(dt) }.
   avisa(tipo, datos) es la única salida hacia la pantalla y el sonido (cinta, grito, temblor, golpes); en Node, nada.
   El estado vive en S (lo lee escena.js para dibujar). Licencia de juego: tiradas de dado para cada intento, golpe y pilum. */
import { FILES, FILAS, M, DX, BAJAN, YO, ALCANCE, REF_F, puesto, retraso, vaiven } from './formacion.js';
import { crearPaso, velocidad, pisa } from './locomocion.js';
import { crearUnidad } from './unidad.js';
import { creaRomanos, COLS_R, N_R, DZ_R, REF_R } from './enemigo.js';

export const V_AVANCE = 0.85, V_ROM = 1.3, V_CARGA = 4.0, V_HUYE = 4.6, V_EMPUJE = 0.55;
/* TP8b-P2: el oficial mantiene el muro. Compás de la estocada (s) y su ventana (±s), metros que hay que ganar empujando,
   segundos de aviso del flanco y la probabilidad de que una estocada a una tumbe a cada romano del muro. Licencia de juego */
export const PULSO = 1.6, VENTANA = 0.2, META = 15, AVISO_FLANCO = 5, P_ESTOCADA = 0.022;
export const D_PILA = 19, D_CARGA = 13, VUELO_PILA = 1.35, NPILA = 16;
const G = 9.8, suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hacia = (v, obj, d) => v < obj ? Math.min(obj, v + d) : Math.max(obj, v - d);

export function crearAcciones(m) {
  const { S, H, azar, azarP, zanF, zanR } = m, avisa = m.avisa || (() => {});
  function reinicia() {
    Object.assign(S, { T: 0, fase: 'marcha', zF: -10, zR: -62, andando: false, picas: false, orden: null, yo: YO, choque: false, tChoque: -9, tSalva: -9, salva: false,
      tCarga: -9, tGolpe: -9, golpes: { buenos: 0, parados: 0 }, ganador: null, tFin: -9, tRoto: -9, temblor: 0, avisoPicas: false, kFrente: 0, abanico: 0, PILA: [],
      coh: 100, ganado: 0, zF0: -10, destiempo: 0, pulsoN: -1, pulsoUsado: -99, colado: null, tColado: -9, tHueco: -9, flanco: null, tFlanco: 1e9, entraron: false, recula: 0, tAgu: -9, tCoro: -9, tLoco: -9, tEstocada: -9 });
    S.U = crearUnidad({ hombres: M, nombre: 'Tu sintagma', ref: Math.min(M, REF_F) }); S.R = crearUnidad({ hombres: N_R, nombre: 'El manípulo', ref: Math.min(N_R, REF_R) });
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
  /* TP8b-P2: el compás. Late cada PULSO s desde el choque; «Golpe» vale a ±VENTANA s del latido */
  const fasePulso = () => S.choque ? (((S.T - S.tChoque) % PULSO) + PULSO) % PULSO : 0;
  const nPulso = () => Math.round((S.T - S.tChoque) / PULSO);
  const enPulso = () => { const f = fasePulso(); return S.choque && Math.min(f, PULSO - f) <= VENTANA; };
  const cohesion = x => { S.coh = Math.min(100, Math.max(0, S.coh + x)); };
  /* se abre un hueco: el romano del muro más cercano a ti se cuela entre las astas */
  function abreHueco(porque) {
    if (S.colado || !S.choque) return;
    const yo = S.fal[S.yo], c = S.rom.filter(h => h.vivo && h.r === 0 && h.est === 'muro').sort((a, b) => Math.abs(a.x - yo.x) - Math.abs(b.x - yo.x))[0];
    if (!c) return;
    c.est = 'dentro'; c.tAtk = S.T; c.intento = S.T + 2.5; S.colado = c; S.tColado = S.T; S.destiempo = 0;
    avisa('dentro', { h: c }); avisa('cinta', { texto: porque || 'Hueco: se cuela un romano', mala: true });
  }
  /* el flanco (Polibio 18.30–32: la falange es débil por los costados). Cada 20–30 s unos romanos rodean por un lado */
  function flanco() {
    const F = S.flanco;
    if (!F) {
      if (S.T < S.tFlanco) return;
      const lado = azar() < 0.5 ? 1 : -1, L = S.rom.filter(h => h.vivo && h.r > 0 && h.est === 'marcha').sort((a, b) => lado * (b.x - a.x)).slice(0, 3);
      if (!L.length) { S.tFlanco = S.T + 5; return; }
      for (const h of L) h.est = 'flanco';
      S.flanco = { lado, t0: S.T, tI: S.T + AVISO_FLANCO, L, hecho: false };
      avisa('flanco', { lado, texto: lado > 0 ? '¡Por la derecha!' : '¡Por la izquierda!' }); return;
    }
    if (!F.hecho && S.T >= F.tI) {
      F.hecho = true;
      if (S.orden === 'aguantar') { for (const h of F.L) if (h.vivo && azar() < 0.4) muere(h, 'r'); avisa('cinta', { texto: 'Flanco cerrado: las filas de atrás giran', buena: true }); avisa('grito', { texto: '¡Cerrad el flanco!' }); }
      else {
        const em = S.orden === 'empujar', V = S.fal.filter(h => h.vivo && !h.huye).sort((a, b) => F.lado * (b.f - a.f) || b.r - a.r).slice(0, em ? 6 : 4);
        for (const h of V) muere(h, 'f');
        cohesion(em ? -50 : -35); S.U.anima(em ? -0.12 : -0.07); if (em) S.orden = null;
        avisa('flancoEntra', {}); avisa('cinta', { texto: em ? '¡Nos toman el flanco empujando!' : '¡Nos toman el flanco!', mala: true });
      }
    }
    if (F.hecho && S.T >= F.tI + 2.5) { for (const h of F.L) if (h.vivo) h.est = 'marcha'; S.flanco = null; S.tFlanco = S.T + 20 + azar() * 10; }
  }
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
    if (n === 'picas') { S.picas = !S.picas; avisa('grito', { texto: S.picas ? '¡Sarisas abajo!' : '¡Sarisas arriba!' }); avisa('ola', { abajo: S.picas }); }
    if (n === 'avanzar') { S.andando = !S.andando; S.orden = null; avisa('grito', { texto: S.andando ? '¡Adelante, paso a paso!' : '¡Alto!' }); }
    if (n === 'aguantar') {
      if (S.orden === 'aguantar' && S.choque) { S.orden = null; avisa('grito', { texto: '¡A la lucha!' }); return; }
      S.andando = false; S.orden = 'aguantar'; S.tAgu = S.T; avisa('grito', { texto: S.colado ? '¡Cerrad!' : S.flanco ? '¡Girad! ¡Cerrad el flanco!' : '¡Aguantad! ¡Firmes!' });
    }
    if (n === 'empujad') {
      if (!S.choque || S.orden === 'empujar') return;
      if (S.coh < 60) { avisa('cinta', { texto: 'El muro no está firme', mala: true }); return; }
      S.orden = 'empujar'; S.andando = false; S.picas = true; S.tCoro = -9; avisa('grito', { texto: '¡Empujad! ¡Todos a una!' });
    }
  }
  /* el enemigo marcado: el romano más cercano delante de tu columna, al alcance de tu sarisa */
  function marcado() {
    const yo = S.fal[S.yo]; if (!yo || !yo.vivo || yo.r !== 0 || !S.choque) return null;
    let mejor = null, dm = 1e9;
    for (const h of S.rom) if (h.vivo && (h.est === 'muro' || h.est === 'dentro')) { const d = Math.abs(h.x - yo.x) * 2 + Math.abs(h.z - yo.z); if (Math.abs(h.x - yo.x) < 1.5 && d < dm) { dm = d; mejor = h; } }
    return mejor;
  }
  /* «Golpe»: la primera fila pincha junta. En el latido, estocada a una; fuera, cada asta a su aire y el muro se descompone */
  function golpe() {
    const yo = S.fal[S.yo];
    if (!S.choque || !yo || !yo.vivo || S.fase === 'fin' || S.ganador) return null;
    if (S.T - S.tGolpe < 0.25) return 'espera';
    if (S.orden === 'aguantar') { avisa('cinta', { texto: 'Aguantando no se pincha' }); return 'aguanta'; }
    S.tGolpe = S.T; yo.tG = S.T; const fr = S.fal.filter(h => h.vivo && !h.huye && h.r === 0);
    if (enPulso() && S.pulsoUsado !== nPulso()) {
      S.pulsoUsado = nPulso(); S.destiempo = 0; S.golpes.buenos++; cohesion(4); S.recula = 0.8; S.tEstocada = S.T;
      for (const h of fr) h.tG = S.T + azar() * 0.04;
      let caen = 0;
      for (const r of S.rom) if (r.vivo && r.r === 0 && (r.est === 'muro' || r.est === 'dentro')) { r.tRecibe = S.T; if (azar() < (r.est === 'dentro' ? 0.6 : P_ESTOCADA)) { if (r === S.colado) S.colado = null; muere(r, 'r'); caen++; } }
      S.R.anima(-0.003);
      avisa('estocada', { caen }); avisa('cinta', { texto: caen ? `¡Estocada a una! Caen ${caen}` : '¡Estocada a una! Reculan', buena: true });
      return 'bueno';
    }
    for (const h of fr) h.tG = S.T + azar() * 0.55;
    S.golpes.parados++; cohesion(-12); S.destiempo++;
    avisa('destiempo', {}); avisa('cinta', { texto: '¡A destiempo! El muro se descompone', mala: true });
    if (S.destiempo >= 2) abreHueco('Dos a destiempo: hueco');
    return 'destiempo';
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
      if (S.choque && S.orden === 'aguantar') U.cansa(dt, -0.012);
      if (S.choque) { U.cansa(dt, 0.006); R.cansa(dt, 0.012); }
    }
    for (const h of S.fal) {
      if (!h.vivo) { h.paso.v = 0; pisa(h.paso, 0, dt); continue; }
      if (h.huye) { h.yaw = 0; mueve(h, h.x + (h.f - (FILES - 1) / 2) * 0.3, h.z + 30, V_HUYE, dt); continue; }
      /* la sarisa: las cinco primeras filas la bajan si se manda, cada fila con su retraso; las de detrás se inclinan en abanico */
      const obj = S.picas && h.r < BAJAN ? 1 : 0, objA = S.picas ? 1 : 0;
      /* TP8b-P2: las filas de atrás también esperan su turno (antes se inclinaban en cuanto se mandaba y rozaban a la 5.ª), y algo más: primero bajan las de delante */
      if (obj !== h.objB || objA !== h.objA) { h.objB = obj; h.objA = objA; h.tB = S.T + retraso(h.r, h.az) + (h.r >= BAJAN && objA ? 0.45 : 0); }
      if (S.T >= h.tB) { h.kB = hacia(h.kB, obj, dt / 0.95); h.kA = hacia(h.kA, objA, dt / 1.3); }
      h.kG = Math.max(0, 1 - Math.abs(S.T - h.tG - 0.18) / 0.22) * (h.r === 0 ? 1 : 0);
      /* con el flanco y «Aguantar», las filas de atrás de ese lado giran hacia él y cierran */
      const gira = S.flanco && S.orden === 'aguantar' && h.r >= 5 && (h.f - (FILES - 1) / 2) * S.flanco.lado > 0.5;
      h.yaw += ((gira ? Math.PI - S.flanco.lado * Math.PI / 2 : Math.PI) - h.yaw) * Math.min(1, dt * 5);
      const p = puesto(h.f, h.r, S.zF); mueve(h, p.x + (gira ? S.flanco.lado * 0.25 : 0), p.z, 1.5, dt);
    }
    /* romanos */
    const muroZ = S.zF - frente(), vR = S.fase === 'carga' || S.choque ? V_CARGA : V_ROM;
    if (S.fase === 'marcha' && S.T > 1.5) S.zR += V_ROM * dt;
    if (S.fase === 'carga' && !S.choque) S.zR += V_CARGA * dt;
    if (S.choque) S.zR = muroZ - S.recula;
    S.recula = Math.max(0, S.recula - dt * 0.9);
    if (S.fase === 'marcha' && S.zF - S.zR < D_PILA) { S.fase = 'pila'; S.tPila = S.T; avisa('grito', { texto: '¡Pila! ¡Cuidado!' }); }
    if (S.fase === 'pila' && !S.salva && S.T - S.tPila > 1.1) lanzaSalva();
    if (S.fase === 'pila' && S.salva && S.T - S.tSalva > 1.9) { S.fase = 'carga'; S.tCarga = S.T; avisa('carga', {}); S.avisoPicas = true; avisa('cinta', { texto: S.picas ? 'Picas abajo: los pila caen de lleno' : 'Las astas desvían los pila. ¡Baja las picas!', mala: !S.picas }); }
    for (const h of S.rom) {
      if (!h.vivo) { h.paso.v = 0; pisa(h.paso, 0, dt); continue; }
      if (h.est === 'huye') { h.yaw = Math.PI; mueve(h, h.x, h.z - 40, V_HUYE * h.vMas, dt); continue; }
      if (h.est === 'flanco') {
        const F = S.flanco, s = F ? F.lado : 1, xL = s * (FILES * DX / 2 + (F && S.T >= F.tI && S.orden !== 'aguantar' ? 0.5 : 1.9)), zL = S.zF + 1.5 + h.r * 1.2 + (h.c % 3) * 0.9, dx = xL - h.x, dz = zL - h.z;
        h.yaw = Math.hypot(dx, dz) > 0.6 ? Math.atan2(dx, dz) : -s * Math.PI / 2; mueve(h, xL, zL, V_CARGA * 0.9 * h.vMas, dt); continue;
      }
      h.yaw = 0;
      const enMuro = h.r === 0 && (S.choque || S.fase === 'carga');
      let tz = Math.min(S.zR, muroZ - 0.05) - h.r * DZ_R + h.jz * (S.choque ? 0.2 : 1), tx = h.x;
      /* TP8b (solo se ve): en las puntas no esperan quietos. Cada uno a su compás empuja con el escudo y recula un paso;
         a veces uno se cuela un metro por el hueco entre las astas antes de que lo paren (no cambia las tiradas) */
      if (h.est === 'muro' && S.choque) {
        const c = 0.5 + 0.5 * Math.sin(S.T * (1.5 + h.vMas) + h.fase * 2.1); tz -= 0.55 * c * c;
        const tc = S.T - (h.tCuela ?? -9);
        if (tc < 1.8) { const k = Math.sin(Math.PI * tc / 1.8), g = Math.round((h.x - 0.71) / DX + (FILES - 1) / 2), gx = (g - (FILES - 1) / 2) * DX + 0.71; tz += 0.9 * k; tx = h.x + (gx - h.x) * Math.min(1, k * 2); }
      }
      if (h.est === 'dentro') { const c = S.fal.filter(f => f.vivo && !f.huye && f.r === 0).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0]; tz = S.zF - 0.78; if (c) tx = c.x + 0.12; }
      if (S.choque && h.r > 0) { const del = colR.get(h.c); const f0 = del && del[0]; if (f0) tz = Math.min(tz, f0.z - h.r * 1.2); }
      /* TP8b-P2: los de atrás no esperan quietos: se mecen, se asoman y se recolocan */
      if (S.choque && h.r > 0 && h.est === 'marcha') { h.x0 ??= h.x; tz += 0.35 * Math.sin(S.T * (0.8 + 0.5 * h.vMas) + h.fase * 2.3); tx = h.x0 + 0.22 * Math.sin(S.T * (0.5 + 0.3 * h.vMas) + h.fase * 4); }
      mueve(h, tx, tz, S.choque && h.est === 'dentro' ? 1.8 : vR * h.vMas, dt);
      /* llega al muro de puntas */
      if (enMuro && h.est !== 'dentro' && h.est !== 'muro' && h.z >= muroZ - 0.35) {
        h.est = 'muro'; h.intento = S.T + 0.8 + azar() * 1.2;
        if (!S.choque) { S.choque = true; S.tChoque = S.T; S.zF0 = S.zF; S.tFlanco = S.T + 14; S.andando = false; avisa('choque', {}); }
        if (S.kFrente < 0.4) { if (!S.entraron) { S.entraron = true; cohesion(-50); abreHueco('¡Picas alzadas! Entran'); } continue; }   /* picas alzadas: entran sin más */
        /* los que cargan contra las puntas se frenan y caen; con «Aguantar», más */
        if (azar() < (S.orden === 'aguantar' ? 0.3 : 0.12)) { muere(h, 'r'); continue; }
      }
      if (h.r === 0 && S.choque && h.est === 'marcha') h.est = 'muro';
    }
    /* TP8b-P2, el choque: tu trabajo es mantener el muro. La cohesión (0–100) lo dice todo */
    if (S.choque && !R.roto && !U.roto) {
      const ag = S.orden === 'aguantar', em = S.orden === 'empujar';
      const k = Math.floor((S.T - S.tChoque) / PULSO); if (k !== S.pulsoN) { S.pulsoN = k; avisa('pulso', {}); }
      /* el roce la gasta; aguantar la rehace; empujar la gasta; con las picas alzadas o un colado, más */
      cohesion(dt * (ag ? 10 : em ? -6 : -1) - (S.kFrente < 0.6 ? 4 * dt : 0) - (S.colado ? 3 * dt : 0));
      if (em) {
        const v = V_EMPUJE * (1 - 0.5 * U.cansancio); S.zF -= v * dt; S.ganado = S.zF0 - S.zF; U.cansa(dt, 0.03); R.cansa(dt, 0.05); R.anima(-0.006 * v * dt);
        if (S.T - S.tCoro > PULSO) { S.tCoro = S.T; avisa('coro', {}); }
        if (S.coh < 60) { S.orden = null; avisa('cinta', { texto: 'El muro se afloja: dejad de empujar', mala: true }); }
      }
      if (ag) U.cansa(dt, -0.02);
      if (!S.colado && S.coh < 40 && S.T - S.tHueco > 3) { S.tHueco = S.T; abreHueco(); }
      /* el colado mata a uno cada 2,5 s hasta que cerráis con «Aguantar»; entonces la segunda fila lo remata */
      const c = S.colado;
      if (c) {
        if (!c.vivo) S.colado = null;
        else if (ag && S.T - Math.max(S.tAgu, S.tColado) > 1.1) { muere(c, 'r'); S.colado = null; S.tHueco = S.T; avisa('grito', { texto: '¡Cerrad! La segunda fila remata' }); avisa('cinta', { texto: 'Hueco cerrado: cae el colado', buena: true }); }
        else if (S.T >= c.intento) {
          c.intento = S.T + 2.5; c.tAtk = S.T;
          const v = S.fal.filter(f => f.vivo && !f.huye && f.r === 0).sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
          if (v) { muere(v, 'f'); cohesion(-6); U.anima(-0.02); avisa('cinta', { texto: 'El colado mata a uno: ¡Aguantar!', mala: true }); }
        }
      }
      if (S.coh < 25) U.anima(-0.03 * dt);
      /* los del muro empujan con el escudo y reculan (solo se ve); a veces uno cae en las puntas */
      for (const h of S.rom) {
        if (!h.vivo || h.r !== 0 || h.est !== 'muro' || S.T < h.intento) continue;
        h.intento = S.T + 1.6 + azar() * 0.9;
        if (azar() < 0.01 * (em ? 1.5 : 1) * (S.coh / 100)) muere(h, 'r');
        else { if ((h.i + Math.floor(S.T)) % 2) h.tAtk = S.T; else h.tRecibe = S.T; if ((h.i * 7 + Math.floor(S.T * 3)) % 4 === 0) h.tCuela = S.T; avisa('madera', { h }); }
      }
      flanco();
      if (S.ganado >= META && !R.roto) { R.roto = true; R.animo = 0; avisa('cinta', { texto: `¡${META} m ganados! El manípulo cede`, buena: true }); }
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
  /* qué toca ahora: la línea de arriba, el botón que late y los que no sirven */
  function consejo() {
    if (S.ganador) return { texto: S.ganador === 'falange' ? 'El manípulo rompe y huye' : 'Tu falange rompe', toca: null, off: [] };
    if (!S.choque) {
      if (S.fase === 'marcha') return S.andando ? { texto: S.picas ? 'Alza las picas: vendrán pila' : 'Avanza con las picas alzadas', toca: S.picas ? 'picas' : null, off: [] } : { texto: 'Pulsa Avanzar', toca: 'avanzar', off: [] };
      if (!S.salva || S.T - S.tSalva < 1.6) return { texto: S.picas ? '¡Pila! Alza las picas' : 'Picas alzadas: desvían los pila', toca: S.picas ? 'picas' : null, off: [] };
      return { texto: S.picas ? 'Picas abajo: espera el choque' : '¡Cargan! Baja las picas', toca: S.picas ? null : 'picas', off: [] };
    }
    if (S.flanco && !S.flanco.hecho) return { texto: `Cierra: ¡por la ${S.flanco.lado > 0 ? 'derecha' : 'izquierda'}!`, toca: S.orden === 'aguantar' ? null : 'aguantar', off: ['empujad', 'golpe'] };
    if (S.colado) return { texto: 'Hay uno dentro: Aguantar', toca: 'aguantar', off: ['empujad', 'golpe'] };
    if (S.orden === 'aguantar') return S.coh < 95 ? { texto: 'Aguanta: el muro se rehace', toca: null, off: ['empujad', 'golpe'] } : { texto: 'Muro firme: suelta Aguantar', toca: 'aguantar', off: ['empujad', 'golpe'] };
    if (S.orden === 'empujar') return { texto: S.coh < 68 ? 'Se afloja: Aguantar' : 'Empuja y pincha al compás', toca: S.coh < 68 ? 'aguantar' : 'golpe', off: [] };
    if (S.coh >= 60) return { texto: 'Empuja ahora', toca: 'empujad', off: [] };
    return { texto: S.coh < 40 ? 'Cierra: Aguantar' : 'Pincha al compás', toca: S.coh < 40 ? 'aguantar' : 'golpe', off: ['empujad'] };
  }
  /* los bots de las pruebas. «bien»: picas a tiempo, pincha en el latido, aguanta en flancos y colados, empuja con el muro firme.
     «loco»: lo mismo hasta el choque y luego pulsa Golpe y Empujad cada 0,3 s */
  function bot(modo = 'bien') {
    if (S.fase === 'marcha' && !S.andando && S.T > 0.5) orden('avanzar');
    if (S.salva && !S.picas && S.T - S.tSalva > 1.6) orden('picas');
    if (!S.choque) return;
    if (modo === 'loco') { if (S.T - S.tLoco >= 0.3) { S.tLoco = S.T; golpe(); orden('empujad'); } return; }
    const ag = S.orden === 'aguantar';
    if (S.colado || (S.flanco && !S.flanco.hecho)) { if (!ag) orden('aguantar'); return; }
    if (ag) { if (S.coh >= 95 && !S.flanco) orden('aguantar'); return; }
    if (S.orden === 'empujar' && S.coh < 64) { orden('aguantar'); return; }
    if (S.orden !== 'empujar' && S.coh >= 90) orden('empujad');
    const f = fasePulso(); if (S.pulsoUsado !== nPulso() && Math.min(f, PULSO - f) < 0.1) golpe();
  }
  return { reinicia, paso, orden, golpe, marcado, frente, bot, mueve, consejo, enPulso, fasePulso, abreHueco };
}
