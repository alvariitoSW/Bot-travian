/* AQVILA — SON1-b: banda sonora de la batalla, hecha por código (WebAudio; 0 KB de descarga) y adaptativa.
   Instrumentos de época imitados: bordón de lengüeta (tibia / aulós grave), tympanum (pandero), tibia con vibrato y llamadas de cornu.
   Modo: dorio sobre re en la calma; frigio (con segunda menor y tritono) cuando sube la tensión. Toda melodía es reconstrucción: licencia de juego.
   Todo sale por Sonido.maestro con ganancia propia (capa música, por debajo de los efectos). Un solo AudioContext: Sonido.contexto().
   Parte pura (también en Node): hz, tempoDe, tensionDe, estadoDe, patron, fraseFinal. Parte de audio: iniciar, tension, estado, final, agacha, parar. */
(function (raiz) {
  'use strict';
  const M = { activa: false, estadoActual: 'espera' };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);        // nota MIDI → Hz
  const BPM0 = 66, BPM1 = 120;
  const tempoDe = ten => BPM0 + (BPM1 - BPM0) * clamp(ten, 0, 1);   // pulsos por minuto
  M.hz = hz; M.tempoDe = tempoDe;

  /* ---------- parte pura ---------- */
  function semilla(s) { let a = (s >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const RE = 50;                                            // re3 (MIDI 50): la tónica de trabajo
  const DORIO = [0, 2, 3, 5, 7, 9, 10], FRIGIO = [0, 1, 3, 5, 7, 8, 10];   // sobre re: re mi fa sol la si do / re mib fa sol la sib do

  /* resumen = { fase: 'lejos' | 'lucha' | 'fin', moral: [propia, enemiga] (0..1, media de los cuerpos), rotos: [propios, enemigos] (0..3), cansancio: 0..1 (opcional) } */
  function tensionDe(r) {
    r = r || {}; const mo = r.moral || [1, 1], ro = r.rotos || [0, 0];
    const mp = clamp(mo[0] === undefined ? 1 : mo[0], 0, 1), me = clamp(mo[1] === undefined ? 1 : mo[1], 0, 1);
    let t = r.fase === 'lucha' ? 0.5 : r.fase === 'fin' ? 0.3 : 0.22;   // despliegue y espera: tensa pero contenida
    if (r.fase === 'lucha') t += 0.34 * (1 - mp) + 0.06 * (1 - me);
    t += 0.12 * clamp(ro[0], 0, 3) - 0.04 * clamp(ro[1], 0, 3) + 0.06 * clamp(r.cansancio || 0, 0, 1);
    return clamp(t, 0, 1);
  }
  /* espera | lucha | peligro (vas perdiendo) | victoria | derrota */
  function estadoDe(r) {
    r = r || {}; const mo = r.moral || [1, 1], ro = r.rotos || [0, 0];
    if (r.fase === 'fin') return r.resultado === 'victoria' ? 'victoria' : 'derrota';
    if (r.fase !== 'lucha') return 'espera';
    if (ro[0] > 0 || mo[0] < 0.45 || mo[0] < mo[1] - 0.2) return 'peligro';
    return 'lucha';
  }
  M.tensionDe = tensionDe; M.estadoDe = estadoDe;

  /* Un compás de 4 pulsos. Devuelve notas { t (pulsos desde el inicio), d (duración en pulsos), c (capa), n (nota MIDI), v (0..1) }.
     Capas: bordon, tambor, tibia, cornu. Determinista: misma tensión, compás y semilla → mismas notas. */
  function patron(tension, compas, sem) {
    const ten = clamp(tension === undefined ? 0.3 : tension, 0, 1), r = semilla((sem || 1) * 7919 + compas * 104729 + 13), notas = [];
    const peligro = ten > 0.72, esc = ten > 0.45 ? FRIGIO : DORIO;
    const grado = (g, oct) => RE + (oct || 0) + esc[((g % 7) + 7) % 7] + 12 * Math.floor(g / 7);
    // bordón: la tónica larga; con tensión, una segunda menor encima que roza (disonancia) y la quinta
    const baseB = RE;   // re3 (146 Hz): el altavoz del móvil no da más abajo
    notas.push({ t: 0, d: 4, c: 'bordon', n: baseB, v: 0.6 + 0.2 * ten });
    if (ten > 0.4) notas.push({ t: 0, d: 4, c: 'bordon', n: baseB + 7, v: 0.3 + 0.2 * ten });
    if (ten > 0.6) notas.push({ t: compas % 2 ? 2 : 0, d: 2, c: 'bordon', n: baseB + 13, v: 0.18 + 0.3 * (ten - 0.6) });   // la segunda menor: roce
    if (peligro && compas % 2) notas.push({ t: 0, d: 4, c: 'bordon', n: baseB + 6, v: 0.16 });   // el tritono
    // tympanum: golpe grave en el 1; más golpes cuanto más tensión; si hay peligro, insistente (corcheas)
    for (let k = 0; k < (ten < 0.3 ? 4 : 8); k++) {
      const t = ten < 0.3 ? k : k / 2, fuerte = k === 0 || (ten >= 0.3 ? k === 4 : k === 2);
      const p = fuerte ? 1 : ten < 0.3 ? 0.1 + 0.4 * ten : peligro ? 0.9 : 0.15 + 0.75 * ten;
      if (r() < p) notas.push({ t, d: 0.25, c: 'tambor', n: fuerte ? 41 : 48 + (r() < 0.3 ? 3 : 0), v: fuerte ? 0.9 : 0.3 + 0.35 * ten });
    }
    // tibia: la melodía en una frase de 4 compases (pregunta, respuesta, pregunta, cadencia a la tónica)
    const f = compas % 4, reg = ten < 0.35 ? 12 : ten < 0.7 ? 19 : 24;   // registro: de re4 a re5 y más agudo
    const nn = Math.round(1 + 4 * ten + (r() < 0.5 ? 0 : 1)), pos = [0, 1, 1.5, 2, 2.5, 3, 3.5];
    if (ten < 0.15 && f % 2 === 1) { /* silencio: respira */ }
    else {
      const elegidos = pos.slice(); const sel = [];
      while (sel.length < Math.min(nn, elegidos.length)) sel.push(elegidos.splice(Math.floor(r() * elegidos.length), 1)[0]);
      sel.sort((a, b) => a - b);
      let g = f === 0 ? 0 : f === 2 ? 4 : 2 + Math.floor(r() * 3);
      sel.forEach((t, i) => {
        const ult = i === sel.length - 1, sigue = ult ? 4 - t : sel[i + 1] - t;
        g += Math.floor(r() * 3) - 1;
        if (f === 3 && ult) g = 0;                         // la cadencia vuelve a la tónica
        g = clamp(g, -2, 6);
        notas.push({ t, d: Math.max(0.5, sigue * 0.9), c: 'tibia', n: grado(g, reg), v: 0.55 + 0.25 * ten });
      });
    }
    // cornu: una llamada de dos notas cada ocho compases; más a menudo con tensión
    if ((compas % 8 === 0 && compas > 0) || (ten > 0.6 && compas % 4 === 2 && r() < 0.5)) {
      notas.push({ t: 0, d: 1.5, c: 'cornu', n: RE, v: 0.75 }); notas.push({ t: 1.75, d: 2, c: 'cornu', n: RE + 7 - (ten > 0.5 ? 1 : 0), v: 0.7 });
    }
    return notas.sort((a, b) => a.t - b.t);
  }
  M.patron = patron;

  /* La frase final (no es un bucle): 5-10 s de notas con tiempos en segundos. victoria: llamada de cornu en modo dorio y tibia que resuelve;
     derrota: tibia sola, frigia, que baja despacio sobre un bordón que se apaga. */
  function fraseFinal(res) {
    const n = [];
    if (res === 'victoria') {
      n.push({ s: 0.0, d: 1.2, c: 'cornu', n: RE, v: 0.8 }, { s: 1.4, d: 1.0, c: 'cornu', n: RE + 7, v: 0.8 }, { s: 2.5, d: 2.4, c: 'cornu', n: RE + 12, v: 0.85 });
      n.push({ s: 0, d: 9, c: 'bordon', n: RE, v: 0.7 }, { s: 0, d: 9, c: 'bordon', n: RE + 7, v: 0.4 });
      for (let k = 0; k < 6; k++) n.push({ s: 2.5 + k * 0.28, d: 0.2, c: 'tambor', n: k ? 48 : 41, v: k ? 0.35 : 0.9 });
      [[5.2, 0.5, 7], [5.7, 0.5, 9], [6.2, 0.5, 10], [6.7, 0.5, 9], [7.2, 1.8, 7]].forEach(([s, d, g]) => n.push({ s, d, c: 'tibia', n: RE + 12 + g, v: 0.75 }));
    } else {
      [[0.0, 1.2, 10], [1.5, 1.0, 8], [2.7, 1.0, 7], [3.9, 1.4, 5], [5.5, 3.0, 3]].forEach(([s, d, g]) => n.push({ s, d, c: 'tibia', n: RE + 12 + g - 1, v: 0.7 }));
      n.push({ s: 0, d: 9, c: 'bordon', n: RE, v: 0.7 }, { s: 0, d: 9, c: 'bordon', n: RE + 1, v: 0.25 });
      for (let k = 0; k < 4; k++) n.push({ s: 0.2 + k * 2.2, d: 0.3, c: 'tambor', n: 41, v: 0.7 - 0.12 * k });
      n.push({ s: 6.4, d: 2.2, c: 'cornu', n: RE + 7, v: 0.5 });
    }
    return n;
  }
  M.fraseFinal = fraseFinal;

  /* ---------- parte de audio (solo en el navegador) ---------- */
  const CAPA = 0.42;                  // la capa música; los efectos van por encima
  const S = { ctx: null, bus: null, filtro: null, duck: null, fade: null, ruido: null, eco: null, id: 0, ten: 0.25, meta: 0.25, sem: 1, compas: 0, proximo: 0, pend: [], tUlt: 0, final: false, vivas: 0 };

  function arma(c, Son) {
    S.fade = c.createGain(); S.fade.gain.value = 0.0001;
    S.duck = c.createGain(); S.duck.gain.value = 1;
    S.filtro = c.createBiquadFilter(); S.filtro.type = 'lowpass'; S.filtro.frequency.value = 2200; S.filtro.Q.value = 0.5;
    S.bus = c.createGain(); S.bus.gain.value = CAPA;
    // un eco corto y oscuro da sala (sin convolución, barato en móvil)
    const ret = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(), hum = c.createGain(); ret.delayTime.value = 0.31; fb.gain.value = 0.33; lp.type = 'lowpass'; lp.frequency.value = 1400; hum.gain.value = 0.28;
    S.bus.connect(S.filtro); S.filtro.connect(S.duck); S.duck.connect(S.fade); S.fade.connect(Son.maestro);
    S.filtro.connect(ret); ret.connect(lp); lp.connect(fb); fb.connect(ret); lp.connect(hum); hum.connect(S.duck);
    S.eco = { ret, fb, lp, hum };
    const nb = c.sampleRate, b = c.createBuffer(1, nb, nb), d = b.getChannelData(0); for (let i = 0; i < nb; i++) d[i] = Math.random() * 2 - 1; S.ruido = b;
  }

  // cada instrumento programa su sonido en el instante t (s) con duración d (s); v 0..1
  function bordon(c, t, d, f, v) {
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380 + 220 * S.ten; lp.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09 * v, t + Math.min(0.5, d * 0.25)); g.gain.setValueAtTime(0.09 * v, t + Math.max(0.5, d - 0.7)); g.gain.linearRampToValueAtTime(0.0001, t + d);
    for (const [tipo, mul, det, ga] of [['sawtooth', 1, -6, 1], ['sawtooth', 1, 7, 0.8], ['triangle', 0.5, 0, 0.9]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = tipo; o.frequency.value = f * mul; o.detune.value = det; og.gain.value = ga; o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + d + 0.05); S.vivas++; o.onended = () => { S.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lp.connect(g); g.connect(S.bus);
  }
  function tambor(c, t, f, v) {
    const g = c.createGain(), o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 2.4, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(S.bus); o.start(t); o.stop(t + 0.42); S.vivas++; o.onended = () => { S.vivas--; try { o.disconnect(); g.disconnect(); } catch (e) { /* nada */ } };
    const r = c.createBufferSource(), rf = c.createBiquadFilter(), rg = c.createGain(); r.buffer = S.ruido; rf.type = 'lowpass'; rf.frequency.value = 900; rf.Q.value = 0.7;
    rg.gain.setValueAtTime(0.0001, t); rg.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.004); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);   // el golpe seco del parche
    r.connect(rf); rf.connect(rg); rg.connect(S.bus); r.start(t, Math.random() * 0.5); r.stop(t + 0.1); r.onended = () => { try { r.disconnect(); rf.disconnect(); rg.disconnect(); } catch (e) { /* nada */ } };
  }
  function tibia(c, t, d, f, v) {
    const g = c.createGain(), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 0.8;
    lfo.frequency.value = 5 + 0.8 * S.ten; lg.gain.value = 9 + 10 * S.ten; lfo.connect(lg);     // vibrato en cents; crece el vibrato con la tensión
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.085 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.06 * v, t + Math.min(0.3, d * 0.5)); g.gain.setValueAtTime(0.06 * v, t + Math.max(0.1, d - 0.1)); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.08);
    // aulós: dos cañas casi iguales (+7 cents) y un octavo de armónico
    for (const [tipo, mul, det, ga] of [['triangle', 1, 0, 1], ['triangle', 1, 7, 0.7], ['sine', 2, 0, 0.18]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = tipo; o.frequency.value = f * mul; o.detune.value = det; og.gain.value = ga; lg.connect(o.detune); o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + d + 0.15); S.vivas++; o.onended = () => { S.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lfo.start(t); lfo.stop(t + d + 0.15); lfo.onended = () => { try { lfo.disconnect(); lg.disconnect(); } catch (e) { /* nada */ } };
    const r = c.createBufferSource(), rf = c.createBiquadFilter(), rg = c.createGain(); r.buffer = S.ruido; rf.type = 'bandpass'; rf.frequency.value = f * 3; rf.Q.value = 1.2;   // soplo al atacar
    rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.03 * v, t + 0.02); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    r.connect(rf); rf.connect(rg); rg.connect(lp); r.start(t, Math.random() * 0.5); r.stop(t + 0.22); r.onended = () => { try { r.disconnect(); rf.disconnect(); rg.disconnect(); } catch (e) { /* nada */ } };
    lp.connect(g); g.connect(S.bus);
  }
  function cornu(c, t, d, f, v) {
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.4; lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(950, t + Math.min(0.35, d * 0.4)); lp.frequency.linearRampToValueAtTime(600, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11 * v, t + 0.16); g.gain.setValueAtTime(0.1 * v, t + Math.max(0.2, d - 0.3)); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.1);
    for (const [det, ga] of [[-4, 1], [5, 0.7]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.12); o.detune.value = det; og.gain.value = ga; o.connect(og); og.connect(lp);   // el cuerno entra un poco bajo y sube a la nota
      o.start(t); o.stop(t + d + 0.15); S.vivas++; o.onended = () => { S.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lp.connect(g); g.connect(S.bus);
  }
  function toca(c, t, nota, bpm) {
    const sp = 60 / bpm, st = t + nota.t * sp, d = Math.max(0.1, nota.d * sp);
    if (nota.c === 'bordon') bordon(c, st, d, hz(nota.n), nota.v); else if (nota.c === 'tambor') tambor(c, st, hz(nota.n), nota.v);
    else if (nota.c === 'tibia') tibia(c, st, d, hz(nota.n), nota.v); else if (nota.c === 'cornu') cornu(c, st, d, hz(nota.n), nota.v);
  }

  const Son = () => raiz.Sonido;
  const puedeSonar = () => { const so = Son(); return !!(so && so.activo !== false && so.ctx && so.ctx.state === 'running' && !(raiz.document && raiz.document.hidden) && so.maestro); };

  // el programador: cada ~100 ms mira 0,3 s adelante y programa las notas que caen ahí
  function tic() {
    try {
      const so = Son(); if (!so || !so.ctx || S.final) return; const c = so.ctx, ahora = c.currentTime;
      S.ten += clamp(S.meta - S.ten, -0.12, 0.12) * Math.min(1, (ahora - S.tUlt) / 0.9 || 0); S.tUlt = ahora;   // la tensión se mueve despacio (≈ 1 s)
      if (S.filtro) { S.filtro.frequency.setTargetAtTime(1500 + 2600 * S.ten, ahora, 0.4); }
      if (!puedeSonar()) { S.proximo = Math.max(S.proximo, ahora + 0.1); S.pend = []; return; }   // en silencio no se acumula nada
      if (S.proximo < ahora) S.proximo = ahora + 0.05;
      while (S.proximo < ahora + 0.3) {
        const bpm = tempoDe(S.ten), sp = 60 / bpm, notas = patron(S.ten, S.compas, S.sem);
        for (const n of notas) toca(c, S.proximo, n, bpm);
        S.proximo += 4 * sp; S.compas++;
      }
    } catch (e) { /* la música nunca rompe el juego */ }
  }

  M.iniciar = function (opc) {
    try {
      const so = Son(); if (!so || !so.contexto) return false; const c = so.contexto(); if (!c || !so.maestro) return false;
      if (M.activa) return true;
      clearTimeout(S.tFin);
      if (S.id) clearInterval(S.id);
      if (S.fade) { try { S.fade.disconnect(); } catch (e) { /* nada */ } }
      arma(c, so); opc = opc || {}; S.sem = opc.semilla || ((Math.random() * 1e9) | 0) || 1; S.compas = 0; S.final = false; S.pend = [];
      S.ten = S.meta = clamp(opc.tension === undefined ? 0.22 : opc.tension, 0, 1); S.proximo = c.currentTime + 0.2; S.tUlt = c.currentTime;
      S.fade.gain.setValueAtTime(0.0001, c.currentTime); S.fade.gain.linearRampToValueAtTime(1, c.currentTime + 2);   // fundido de entrada de 2 s
      M.activa = true; M.estadoActual = 'espera'; S.id = setInterval(tic, 100);
      return true;
    } catch (e) { M.activa = false; return false; }
  };
  /* tensión objetivo 0..1 (la música la sigue despacio) y estado nombrado (solo informa; el tempo y la densidad salen de la tensión) */
  M.tension = function (x) { S.meta = clamp(x, 0, 1); };
  M.estado = function (nombre) { M.estadoActual = nombre; };
  M.nivel = () => S.ten;
  /* al sonar un cuerno o una orden, la música baja ≈ 6 dB durante un segundo */
  M.agacha = function () {
    try {
      const so = Son(); if (!M.activa || !S.duck || !so || !so.ctx) return; const t = so.ctx.currentTime, p = S.duck.gain;
      p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(0.5, t + 0.08); p.setValueAtTime(0.5, t + 0.9); p.linearRampToValueAtTime(1, t + 1.6);
    } catch (e) { /* nada */ }
  };
  /* frase final de victoria o derrota (5-10 s, no es un bucle); luego se funde y se calla */
  M.final = function (res) {
    try {
      const so = Son(); if (!M.activa || S.final || !so || !so.ctx) return; const c = so.ctx; S.final = true; M.estadoActual = res === 'victoria' ? 'victoria' : 'derrota';
      if (puedeSonar()) { const t0 = c.currentTime + 0.5; for (const n of fraseFinal(res)) toca(c, t0, { t: n.s, d: n.d, c: n.c, n: n.n, v: n.v }, 60); }   // a 60 ppm 1 pulso = 1 s: los tiempos van en segundos
      if (S.id) clearInterval(S.id); S.id = 0; clearTimeout(S.tFin);
      S.tFin = setTimeout(() => { M.parar(2); }, 10500);
    } catch (e) { /* nada */ }
  };
  M.parar = function (seg) {
    try {
      if (S.id) { clearInterval(S.id); S.id = 0; } clearTimeout(S.tFin);
      const so = Son(), f = S.fade, c = so && so.ctx; seg = seg === undefined ? 2 : seg;
      M.activa = false;
      if (f && c) { const t = c.currentTime; f.gain.cancelScheduledValues(t); f.gain.setValueAtTime(f.gain.value, t); f.gain.linearRampToValueAtTime(0.0001, t + seg); const quien = f; setTimeout(() => { try { quien.disconnect(); } catch (e) { /* nada */ } }, seg * 1000 + 600); }
      S.final = false;
    } catch (e) { M.activa = false; }
  };

  raiz.Musica = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
