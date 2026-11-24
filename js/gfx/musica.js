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
  const DORIO = [0, 2, 3, 5, 7, 9, 10], FRIGIO = [0, 1, 3, 5, 7, 8, 10], MIXOLIDIO = [0, 2, 4, 5, 7, 9, 10];   // sobre re: re mi fa sol la si do / re mib fa sol la sib do / re mi fa# sol la si do

  /* resumen = { fase: 'lejos' | 'lucha' | 'fin', moral: [propia, enemiga] (0..1, media de los cuerpos), rotos: [propios, enemigos] (0..3), cansancio: 0..1 (opcional) } */
  function tensionDe(r) {
    r = r || {}; const mo = r.moral || [1, 1], ro = r.rotos || [0, 0];
    const mp = clamp(mo[0] === undefined ? 1 : mo[0], 0, 1), me = clamp(mo[1] === undefined ? 1 : mo[1], 0, 1);
    let t = r.fase === 'lucha' ? 0.5 : r.fase === 'fin' ? 0.3 : 0.22;   // despliegue y espera: tensa pero contenida
    if (r.fase === 'lucha') t += 0.34 * (1 - mp) + 0.06 * (1 - me);
    t += 0.12 * clamp(ro[0], 0, 3) - 0.04 * clamp(ro[1], 0, 3) + 0.06 * clamp(r.cansancio || 0, 0, 1);
    return clamp(t, 0, 1);
  }
  /* espera | lucha | ventaja (vas ganando) | peligro (vas perdiendo) | victoria | derrota.
     SON1 (usuario, 23/11: «en función de si voy ganando o perdiendo»): el carácter de la música lo da este estado. */
  function estadoDe(r) {
    r = r || {}; const mo = r.moral || [1, 1], ro = r.rotos || [0, 0];
    if (r.fase === 'fin') return r.resultado === 'victoria' ? 'victoria' : 'derrota';
    if (r.fase !== 'lucha') return 'espera';
    const mp = mo[0] === undefined ? 1 : mo[0], me = mo[1] === undefined ? 1 : mo[1];
    if (ro[0] > ro[1] || mp < 0.45 || mp < me - 0.2) return 'peligro';
    if (ro[1] > ro[0] || me < mp - 0.2) return 'ventaja';
    return 'lucha';
  }
  M.tensionDe = tensionDe; M.estadoDe = estadoDe;

  /* Un compás de 4 pulsos. Devuelve notas { t (pulsos desde el inicio), d (duración en pulsos), c (capa), n (nota MIDI), v (0..1) }.
     Capas: bordon, tambor, tibia, cornu. Determinista: misma tensión, compás y semilla → mismas notas. */
  function patron(tension, compas, sem, estado) {
    const ten = clamp(tension === undefined ? 0.3 : tension, 0, 1), r = semilla((sem || 1) * 7919 + compas * 104729 + 13), notas = [];
    // ganando: modo brillante (mixolidio), sin roces, marcha firme y el cornu que sube. Perdiendo: frigio, tritono y tambor insistente.
    const gana = estado === 'ventaja', peligro = !gana && (estado === 'peligro' || ten > 0.72), esc = gana ? MIXOLIDIO : peligro || ten > 0.45 ? FRIGIO : DORIO;
    const grado = (g, oct) => RE + (oct || 0) + esc[((g % 7) + 7) % 7] + 12 * Math.floor(g / 7);
    // bordón: la tónica larga; con tensión, una segunda menor encima que roza (disonancia) y la quinta
    const baseB = RE;   // re3 (146 Hz): el altavoz del móvil no da más abajo
    notas.push({ t: 0, d: 4, c: 'bordon', n: baseB, v: 0.6 + 0.2 * ten });
    if (ten > 0.4) notas.push({ t: 0, d: 4, c: 'bordon', n: baseB + 7, v: 0.3 + 0.2 * ten });
    if (ten > 0.6 && !gana) notas.push({ t: compas % 2 ? 2 : 0, d: 2, c: 'bordon', n: baseB + 13, v: 0.18 + 0.3 * (ten - 0.6) });   // la segunda menor: roce
    if (peligro && compas % 2) notas.push({ t: 0, d: 4, c: 'bordon', n: baseB + 6, v: 0.16 });   // el tritono
    // tympanum: golpe grave en el 1; más golpes cuanto más tensión; si hay peligro, insistente (corcheas)
    for (let k = 0; k < (ten < 0.3 ? 4 : 8); k++) {
      const t = ten < 0.3 ? k : k / 2, fuerte = k === 0 || (ten >= 0.3 ? k === 4 : k === 2);
      const p = fuerte ? 1 : gana ? (k % 2 ? 0.25 : 0.95) : ten < 0.3 ? 0.1 + 0.4 * ten : peligro ? 0.9 : 0.15 + 0.75 * ten;   // ganando: paso de marcha, en los pulsos
      if (r() < p) notas.push({ t, d: 0.25, c: 'tambor', n: fuerte ? 41 : 48 + (r() < 0.3 ? 3 : 0), v: fuerte ? 0.9 : 0.3 + 0.35 * ten });
    }
    // tibia: la melodía en una frase de 4 compases (pregunta, respuesta, pregunta, cadencia a la tónica)
    const f = compas % 4, reg = gana ? 19 : ten < 0.35 ? 12 : ten < 0.7 ? 19 : 24;   // registro: de re4 a re5 y más agudo
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
    if (gana && compas % 4 === 2) {   // ganando: llamada que sube (re, la, re agudo)
      notas.push({ t: 0, d: 1, c: 'cornu', n: RE, v: 0.75 }, { t: 1.25, d: 1, c: 'cornu', n: RE + 7, v: 0.75 }, { t: 2.5, d: 1.5, c: 'cornu', n: RE + 12, v: 0.8 });
    } else if ((compas % 8 === 0 && compas > 0) || (ten > 0.6 && compas % 4 === 2 && r() < 0.5)) {
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

  /* ---------- SON6: temas del resto del juego (menú, ciudad, mapa, Senado), por código ----------
     Pantalla de la interfaz (UI.tab) → tema. Cada tema es un patrón determinista por compás de 4 pulsos: temaPatron(tema, compas, { sem, estacion 0..3, tension 0..1 }) → { bpm, notas }.
     Capas: las de batalla más la lira (cuerda pulsada, cítara de época). Sobrios y por debajo de todo; ninguno es un bucle eterno: ciclo(tema) = segundos que suena y segundos que calla.
     Toda melodía es reconstrucción de modos antiguos: licencia de juego. */
  const PANTALLAS = { menu: 'menu', city: 'ciudad', saber: 'ciudad', army: 'ciudad', imperio: 'ciudad', hero: 'ciudad', map: 'mapa', senado: 'senado' };
  const CICLO = { menu: { suena: 53, calla: 150 }, ciudad: { suena: 200, calla: 50 }, mapa: { suena: 150, calla: 45 }, senado: { suena: 120, calla: 60 } };
  M.TEMAS = Object.keys(CICLO);
  M.temaDe = pantalla => PANTALLAS[pantalla] || 'ciudad';
  M.ciclo = tema => CICLO[tema] || CICLO.ciudad;
  /* tensión del mapa según los ejércitos enemigos en marcha (0 = paz) */
  M.tensionMapa = n => { n = Math.max(0, Math.floor(n || 0)); return n === 0 ? 0.1 : n === 1 ? 0.4 : n === 2 ? 0.55 : 0.7; };
  const gr = (esc, g, oct) => RE + (oct || 0) + esc[((g % 7) + 7) % 7] + 12 * Math.floor(g / 7);
  const MENU_TIBIA = { 2: [[0, 0, 2], [2, 2, 2]], 3: [[0, 4, 2], [2, 2, 2]], 4: [[0, 3, 2], [2, 1, 2]], 5: [[0, 0, 4]], 8: [[0, 4, 2], [2, 5, 2]], 9: [[0, 6, 2], [2, 4, 2]], 10: [[0, 2, 2], [2, 3, 2]], 11: [[0, 0, 4]] };   // [pulso, grado, duración]
  function temaPatron(tema, compas, o) {
    o = o || {}; const n = [], r = semilla((o.sem || 1) * 7919 + compas * 104729 + 29), ten = clamp(o.tension === undefined ? 0.2 : o.tension, 0, 1);
    const est = ((Math.round(o.estacion === undefined ? 1 : o.estacion) % 4) + 4) % 4, nota = (t, d, c, nn, v) => n.push({ t, d, c, n: nn, v });
    let bpm;
    if (tema === 'menu') {                                    // solemne: cornu lejano, tympanum grave, tibia lenta en dorio; 12 compases ≈ 53 s
      bpm = 54; const k = compas % 12, E = DORIO;
      nota(0, 4, 'bordon', RE, 0.55); nota(0, 4, 'bordon', RE + 7, 0.3);
      if (k === 0) { nota(0, 1, 'tambor', 41, 0.8); nota(0, 2.5, 'cornu', RE, 0.42); nota(2.5, 1.5, 'cornu', RE + 7, 0.4); }
      else if (k === 6) nota(0, 3, 'cornu', RE + 7, 0.36);
      else if (k % 4 === 0) nota(0, 1, 'tambor', 41, 0.45);
      if (k === 11) nota(2, 1, 'tambor', 41, 0.5);
      for (const [t, g, d] of MENU_TIBIA[k] || []) nota(t, d * 0.95, 'tibia', gr(E, g, 12), 0.5);
      if (k >= 6 && k % 2 === 1) nota(1, 3, 'lira', gr(E, 4, 12), 0.4);
    } else if (tema === 'senado') {                           // sobrio: bordón, lira en acordes lentos, tibia suelta, un golpe de tympanum cada cuatro compases
      bpm = 56; const E = DORIO, k = compas % 8;
      nota(0, 4, 'bordon', RE, 0.45); nota(0, 4, 'bordon', RE + 7, 0.25);
      [0, 4, 7].forEach((g, i) => nota(i * 0.12, 3.5, 'lira', gr(E, g, 12), 0.45 - 0.05 * i));
      if (k % 2 === 1) nota(2, 2, 'lira', gr(E, 2 + (k % 3), 12), 0.35);
      if (k === 2) { nota(0, 2, 'tibia', gr(E, 4, 12), 0.45); nota(2, 2, 'tibia', gr(E, 2, 12), 0.45); }
      if (k === 4) { nota(0, 1.5, 'tibia', gr(E, 3, 12), 0.42); nota(2, 2, 'tibia', gr(E, 1, 12), 0.42); }
      if (k === 7) nota(0, 4, 'tibia', gr(E, 0, 12), 0.45);
      if (compas % 4 === 0) nota(0, 1, 'tambor', 41, 0.3);
    } else if (tema === 'mapa') {                             // paso de marcha: tambor en los pulsos, tibia con ritmo de marcha; con enemigos, frigio, más rápido y cornu
      const tenso = ten >= 0.35, E = tenso ? FRIGIO : DORIO, f = compas % 4; bpm = 68 + 28 * ten;
      nota(0, 4, 'bordon', RE, 0.5); if (ten >= 0.3) nota(0, 4, 'bordon', RE + 7, 0.3);
      for (let b = 0; b < 4; b++) nota(b, 0.25, 'tambor', b % 2 ? 48 : 41, b === 0 ? 0.75 : b === 2 ? 0.5 : 0.22 + 0.1 * ten);
      if (tenso) { nota(1.75, 0.25, 'tambor', 48, 0.28); nota(3.75, 0.25, 'tambor', 48, 0.28); }
      const celda = [[0, 2, 4, 2], [3, 4, 2, 0], [4, 5, 4, 2], [2, 1, 0, 0]][f], tt = [0, 1.5, 2, 3], dd = [1.25, 0.5, 1, 1], reg = tenso ? 19 : 12;
      for (let i = 0; i < 4; i++) { const g = celda[i] + (f !== 3 && r() < 0.25 ? 1 : 0); nota(tt[i], dd[i] * 0.9, 'tibia', gr(E, g, reg), 0.45 + 0.2 * ten); }
      if (tenso && f === 2) nota(0, 1.5, 'cornu', RE, 0.5);
      else if (compas % 8 === 0 && compas > 0) nota(0, 1.5, 'cornu', RE + 7, 0.3);
    } else {                                                  // ciudad: lira que arpegia y tibia que responde; la estación cambia modo, ritmo y densidad
      bpm = [74, 78, 68, 60][est]; const E = est <= 1 ? MIXOLIDIO : DORIO, f = compas % 4, cuantas = est === 3 ? 3 : est === 1 ? 5 : 4;
      nota(0, 4, 'bordon', RE, 0.4); if (compas % 2 === 0) nota(0, 4, 'bordon', RE + 7, 0.22);
      const pos = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], sel = []; while (sel.length < cuantas) sel.push(pos.splice(Math.floor(r() * pos.length), 1)[0]); sel.sort((a, b) => a - b);
      const PENTA = [0, 2, 4, 5, 7]; let g = 2;
      for (const t of sel) { g = clamp(g + Math.floor(r() * 3) - 1, 0, 4); nota(t, 1.5, 'lira', gr(E, PENTA[g], 12), 0.5 + 0.15 * r()); }
      if (f === 1 && est !== 3) { nota(0, 1.5, 'tibia', gr(E, 4, 12), 0.45); nota(2, 2, 'tibia', gr(E, 2, 12), 0.45); }
      if (f === 3) { nota(0, 1.5, 'tibia', gr(E, 3, 12), 0.45); nota(1.5, 0.5, 'tibia', gr(E, 1, 12), 0.4); nota(2, 2, 'tibia', gr(E, 0, 12), 0.45); }
      if (f === 0) nota(0, 1, 'tambor', 41, 0.28);
    }
    return { bpm, notas: n.sort((a, b) => a.t - b.t) };
  }
  M.temaPatron = temaPatron;

  /* ---------- parte de audio (solo en el navegador) ---------- */
  const CAPA = 0.42;                  // la capa música; los efectos van por encima
  const S = { ctx: null, bus: null, filtro: null, duck: null, fade: null, ruido: null, eco: null, id: 0, ten: 0.25, meta: 0.25, sem: 1, compas: 0, proximo: 0, pend: [], tUlt: 0, final: false, vivas: 0 };

  function arma(c, Son, E) {
    E.fade = c.createGain(); E.fade.gain.value = 0.0001;
    E.duck = c.createGain(); E.duck.gain.value = 1;
    E.filtro = c.createBiquadFilter(); E.filtro.type = 'lowpass'; E.filtro.frequency.value = 2200; E.filtro.Q.value = 0.5;
    E.bus = c.createGain(); E.bus.gain.value = CAPA;
    // un eco corto y oscuro da sala (sin convolución, barato en móvil)
    const ret = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(), hum = c.createGain(); ret.delayTime.value = 0.31; fb.gain.value = 0.33; lp.type = 'lowpass'; lp.frequency.value = 1400; hum.gain.value = 0.28;
    E.bus.connect(E.filtro); E.filtro.connect(E.duck); E.duck.connect(E.fade); E.fade.connect(Son.maestro);
    E.filtro.connect(ret); ret.connect(lp); lp.connect(fb); fb.connect(ret); lp.connect(hum); hum.connect(E.duck);
    E.eco = { ret, fb, lp, hum };
    const nb = c.sampleRate, b = c.createBuffer(1, nb, nb), d = b.getChannelData(0); for (let i = 0; i < nb; i++) d[i] = Math.random() * 2 - 1; E.ruido = b;
  }

  // cada instrumento programa su sonido en el instante t (s) con duración d (s); v 0..1
  function bordon(c, t, d, f, v, E) {
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380 + 220 * E.ten; lp.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09 * v, t + Math.min(0.5, d * 0.25)); g.gain.setValueAtTime(0.09 * v, t + Math.max(0.5, d - 0.7)); g.gain.linearRampToValueAtTime(0.0001, t + d);
    for (const [tipo, mul, det, ga] of [['sawtooth', 1, -6, 1], ['sawtooth', 1, 7, 0.8], ['triangle', 0.5, 0, 0.9]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = tipo; o.frequency.value = f * mul; o.detune.value = det; og.gain.value = ga; o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + d + 0.05); E.vivas++; o.onended = () => { E.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lp.connect(g); g.connect(E.bus);
  }
  function tambor(c, t, f, v, E) {
    const g = c.createGain(), o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 2.4, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(E.bus); o.start(t); o.stop(t + 0.42); E.vivas++; o.onended = () => { E.vivas--; try { o.disconnect(); g.disconnect(); } catch (e) { /* nada */ } };
    const r = c.createBufferSource(), rf = c.createBiquadFilter(), rg = c.createGain(); r.buffer = E.ruido; rf.type = 'lowpass'; rf.frequency.value = 900; rf.Q.value = 0.7;
    rg.gain.setValueAtTime(0.0001, t); rg.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.004); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);   // el golpe seco del parche
    r.connect(rf); rf.connect(rg); rg.connect(E.bus); r.start(t, Math.random() * 0.5); r.stop(t + 0.1); r.onended = () => { try { r.disconnect(); rf.disconnect(); rg.disconnect(); } catch (e) { /* nada */ } };
  }
  function tibia(c, t, d, f, v, E) {
    const g = c.createGain(), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 0.8;
    lfo.frequency.value = 5 + 0.8 * E.ten; lg.gain.value = 9 + 10 * E.ten; lfo.connect(lg);     // vibrato en cents; crece el vibrato con la tensión
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.085 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.06 * v, t + Math.min(0.3, d * 0.5)); g.gain.setValueAtTime(0.06 * v, t + Math.max(0.1, d - 0.1)); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.08);
    // aulós: dos cañas casi iguales (+7 cents) y un octavo de armónico
    for (const [tipo, mul, det, ga] of [['triangle', 1, 0, 1], ['triangle', 1, 7, 0.7], ['sine', 2, 0, 0.18]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = tipo; o.frequency.value = f * mul; o.detune.value = det; og.gain.value = ga; lg.connect(o.detune); o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + d + 0.15); E.vivas++; o.onended = () => { E.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lfo.start(t); lfo.stop(t + d + 0.15); lfo.onended = () => { try { lfo.disconnect(); lg.disconnect(); } catch (e) { /* nada */ } };
    const r = c.createBufferSource(), rf = c.createBiquadFilter(), rg = c.createGain(); r.buffer = E.ruido; rf.type = 'bandpass'; rf.frequency.value = f * 3; rf.Q.value = 1.2;   // soplo al atacar
    rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.03 * v, t + 0.02); rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    r.connect(rf); rf.connect(rg); rg.connect(lp); r.start(t, Math.random() * 0.5); r.stop(t + 0.22); r.onended = () => { try { r.disconnect(); rf.disconnect(); rg.disconnect(); } catch (e) { /* nada */ } };
    lp.connect(g); g.connect(E.bus);
  }
  function cornu(c, t, d, f, v, E) {
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.4; lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(950, t + Math.min(0.35, d * 0.4)); lp.frequency.linearRampToValueAtTime(600, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11 * v, t + 0.16); g.gain.setValueAtTime(0.1 * v, t + Math.max(0.2, d - 0.3)); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.1);
    for (const [det, ga] of [[-4, 1], [5, 0.7]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.12); o.detune.value = det; og.gain.value = ga; o.connect(og); og.connect(lp);   // el cuerno entra un poco bajo y sube a la nota
      o.start(t); o.stop(t + d + 0.15); E.vivas++; o.onended = () => { E.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lp.connect(g); g.connect(E.bus);
  }
  function toca(c, t, nota, bpm, E) {
    const sp = 60 / bpm, st = t + nota.t * sp, d = Math.max(0.1, nota.d * sp);
    if (nota.c === 'bordon') bordon(c, st, d, hz(nota.n), nota.v, E); else if (nota.c === 'tambor') tambor(c, st, hz(nota.n), nota.v, E);
    else if (nota.c === 'tibia') tibia(c, st, d, hz(nota.n), nota.v, E); else if (nota.c === 'cornu') cornu(c, st, d, hz(nota.n), nota.v, E);
    else if (nota.c === 'lira') lira(c, st, d, hz(nota.n), nota.v, E);
  }

  const Son = () => raiz.Sonido;
  const puedeSonar = () => { const so = Son(); return !!(so && ON && so.activo !== false && so.ctx && so.ctx.state === 'running' && !(raiz.document && raiz.document.hidden) && so.maestro); };

  // el programador: cada ~100 ms mira 0,3 s adelante y programa las notas que caen ahí
  function tic() {
    try {
      const so = Son(); if (!so || !so.ctx || S.final) return; const c = so.ctx, ahora = c.currentTime;
      S.ten += clamp(S.meta - S.ten, -0.12, 0.12) * Math.min(1, (ahora - S.tUlt) / 0.9 || 0); S.tUlt = ahora;   // la tensión se mueve despacio (≈ 1 s)
      if (S.filtro) { S.filtro.frequency.setTargetAtTime(1500 + 2600 * S.ten, ahora, 0.4); }
      if (!puedeSonar()) { S.proximo = Math.max(S.proximo, ahora + 0.1); S.pend = []; return; }   // en silencio no se acumula nada
      if (S.proximo < ahora) S.proximo = ahora + 0.05;
      while (S.proximo < ahora + 0.3) {
        const bpm = tempoDe(S.ten), sp = 60 / bpm, notas = patron(S.ten, S.compas, S.sem, M.estadoActual);
        for (const n of notas) toca(c, S.proximo, n, bpm, S);
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
      apartaTema(); arma(c, so, S); opc = opc || {}; S.sem = opc.semilla || ((Math.random() * 1e9) | 0) || 1; S.compas = 0; S.final = false; S.pend = [];
      S.ten = S.meta = clamp(opc.tension === undefined ? 0.22 : opc.tension, 0, 1); S.proximo = c.currentTime + 0.2; S.tUlt = c.currentTime;
      S.fade.gain.setValueAtTime(0.0001, c.currentTime); S.fade.gain.linearRampToValueAtTime(1, c.currentTime + 2);   // fundido de entrada de 2 s
      M.activa = true; M.estadoActual = 'espera'; S.id = setInterval(tic, 100);
      return true;
    } catch (e) { M.activa = false; return false; }
  };
  /* tensión objetivo 0..1 (la música la sigue despacio: tempo y densidad) y estado nombrado (carácter: ganando o perdiendo) */
  M.tension = function (x) { S.meta = clamp(x, 0, 1); };
  M.estado = function (nombre) { M.estadoActual = nombre; };   // ventaja y peligro cambian el modo, el tambor y el cornu
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
      if (puedeSonar()) { const t0 = c.currentTime + 0.5; for (const n of fraseFinal(res)) toca(c, t0, { t: n.s, d: n.d, c: n.c, n: n.n, v: n.v }, 60, S); }   // a 60 ppm 1 pulso = 1 s: los tiempos van en segundos
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
      S.final = false; devuelveTema();
    } catch (e) { M.activa = false; }
  };

  /* ---------- SON6: reproductor de temas (menú, ciudad, mapa, Senado) ----------
     M.tema(nombre, { estacion, tension }) lo llama la interfaz al cambiar de pantalla: fundido cruzado de 2 s con el tema anterior.
     Un tema suena el tiempo de ciclo(tema).suena y calla el de .calla (no es un bucle eterno). Durante una batalla manda la de batalla
     (M.iniciar lo aparta; M.parar lo devuelve). Se calla con el interruptor «Sonido», con el de «Música» y al ocultar la pestaña.
     No crea el AudioContext: espera a que el primer toque del jugador lo cree (nunca bloquea el arranque). */
  const CLAVE_MUSICA = 'aqvila-musica', GANA_TEMA = 0.6;      // el tema va por debajo de la batalla y de los efectos
  let ON = true; try { if (raiz.localStorage && raiz.localStorage.getItem(CLAVE_MUSICA) === '0') ON = false; } catch (e) { /* sin almacenamiento: encendida */ }
  const T = { tema: null, opc: {}, E: null, id: 0, compas: 0, proximo: 0, fase: 'suena', finFase: 0, pausado: false, sem: ((Math.random() * 1e9) | 0) || 1 };

  function lira(c, t, d, f, v, E) {                           // cuerda pulsada: ataque seco y caída larga
    const g = c.createGain(), lp = c.createBiquadFilter(), largo = Math.max(0.6, Math.min(2.4, d * 1.4)); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3400, t); lp.frequency.exponentialRampToValueAtTime(900, t + largo);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + largo);
    for (const [tipo, mul, ga] of [['triangle', 1, 1], ['sine', 2, 0.3], ['sine', 3, 0.12]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = tipo; o.frequency.value = f * mul; og.gain.value = ga; o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + largo + 0.05); E.vivas++; o.onended = () => { E.vivas--; try { o.disconnect(); og.disconnect(); } catch (e) { /* nada */ } };
    }
    lp.connect(g); g.connect(E.bus);
  }
  function cierra(E, seg) {                                   // fundido a silencio y desmontaje de la cadena
    try {
      const so = Son(); if (!E || !so || !so.ctx) return; const t = so.ctx.currentTime, p = E.fade.gain;
      p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(0.0001, t + seg);
      setTimeout(() => { try { E.fade.disconnect(); } catch (e) { /* nada */ } }, seg * 1000 + 2500);
    } catch (e) { /* nada */ }
  }
  function cadena(c, so) {
    const E = { bus: null, filtro: null, duck: null, fade: null, ruido: null, eco: null, ten: 0.25, vivas: 0 };
    arma(c, so, E); E.ten = clamp(T.opc.tension === undefined ? 0.25 : T.opc.tension, 0, 1);
    E.fade.gain.setValueAtTime(0.0001, c.currentTime); E.fade.gain.linearRampToValueAtTime(GANA_TEMA, c.currentTime + 2);   // fundido de entrada de 2 s
    return E;
  }
  function ticT() {
    try {
      const so = Son(); if (!T.tema || !so || !so.ctx || M.activa || T.pausado) return;
      const c = so.ctx, ahora = c.currentTime, ci = M.ciclo(T.tema);
      if (!puedeSonar()) { if (T.E) T.proximo = Math.max(T.proximo, ahora + 0.1); return; }   // en silencio no se acumula nada
      if (T.fase === 'suena' && T.E && T.finFase && ahora >= T.finFase) { cierra(T.E, 3); T.E = null; T.fase = 'calla'; T.finFase = ahora + ci.calla; return; }
      if (T.fase === 'calla') { if (ahora < T.finFase) return; T.fase = 'suena'; T.compas = 0; }
      if (!T.E) { T.E = cadena(c, so); T.proximo = ahora + 0.2; T.finFase = ahora + ci.suena; T.compas = 0; }
      T.E.ten += clamp((T.opc.tension === undefined ? 0.25 : T.opc.tension) - T.E.ten, -0.05, 0.05);
      if (T.proximo < ahora) T.proximo = ahora + 0.05;
      while (T.proximo < ahora + 0.3) {
        const p = temaPatron(T.tema, T.compas, { sem: T.sem, estacion: T.opc.estacion, tension: T.opc.tension }), sp = 60 / p.bpm;
        for (const n of p.notas) toca(c, T.proximo, n, p.bpm, T.E);
        T.proximo += 4 * sp; T.compas++;
      }
    } catch (e) { /* la música nunca rompe el juego */ }
  }
  M.tema = function (nombre, opc) {
    if (nombre === null) { cierra(T.E, 2); T.E = null; T.tema = null; return true; }
    if (!CICLO[nombre]) return false;
    T.opc = opc || {};
    if (T.tema !== nombre) { if (T.E) { cierra(T.E, 2); T.E = null; } T.tema = nombre; T.fase = 'suena'; T.finFase = 0; T.compas = 0; }   // fundido cruzado: el viejo baja mientras el nuevo sube
    if (!T.id && raiz.document) T.id = setInterval(ticT, 100);
    return true;
  };
  M.estadoTema = () => ({ tema: T.tema, fase: T.fase, sonando: !!T.E, batalla: M.activa, pausado: T.pausado, encendida: ON });
  M.encendida = () => ON;
  M.on = function () { ON = true; try { raiz.localStorage.setItem(CLAVE_MUSICA, '1'); } catch (e) { /* nada */ } };
  M.off = function () { ON = false; try { raiz.localStorage.setItem(CLAVE_MUSICA, '0'); } catch (e) { /* nada */ } if (T.E) { cierra(T.E, 1); T.E = null; } T.fase = 'suena'; T.finFase = 0; };
  const apartaTema = () => { T.pausado = true; if (T.E) { cierra(T.E, 2); T.E = null; } };              // empieza una batalla
  const devuelveTema = () => { if (!T.pausado) return; T.pausado = false; T.fase = 'suena'; T.finFase = 0; T.compas = 0; };      // acaba: vuelve la de la pantalla

  raiz.Musica = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
