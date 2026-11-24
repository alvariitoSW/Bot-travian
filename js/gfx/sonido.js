/* Sonido de la batalla (WebAudio) y elección pura del choque que sigue la cámara.
   GM43i: sonido grabado (assets/sonido/, CC0; autores en assets/sonido/LICENSE.txt). Se baja tras el primer toque;
   mientras no llega, suena la síntesis de antes. Las escenas a pie (gobierno/maquetas/a-pie) usan este mismo banco.
   Se carga como módulo (efecto lateral: window.Sonido) y también en Node (module.exports) para las pruebas. */
(function (raiz) {
  'use strict';
  const CLAVE = 'aqvila-sonido';
  const S = { activo: true, ctx: null, voces: 0, ultimoChoque: -1, maestro: null, ruido: null };
  try { if (raiz.localStorage && raiz.localStorage.getItem(CLAVE) === '0') S.activo = false; } catch (e) { /* sin almacenamiento: activo */ }

  // el AudioContext solo puede nacer tras un gesto del jugador (política de autoplay)
  function crea() {
    if (S.ctx || !raiz.document) return;
    try {
      const AC = raiz.AudioContext || raiz.webkitAudioContext; if (!AC) return;
      S.ctx = new AC(); S.maestro = S.ctx.createGain(); S.maestro.gain.value = 0.5; S.maestro.connect(S.ctx.destination);
      const n = S.ctx.sampleRate, b = S.ctx.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; S.ruido = b;
    } catch (e) { S.ctx = null; }
    if (S.ctx) S.cargaBanco();
  }
  function desbloquea() { crea(); try { if (S.ctx && S.ctx.state === 'suspended' && !raiz.document.hidden) S.ctx.resume(); } catch (e) { /* nada */ } }
  if (raiz.document) {
    for (const ev of ['pointerdown', 'touchstart', 'keydown']) raiz.document.addEventListener(ev, desbloquea, { passive: true });
    raiz.document.addEventListener('visibilitychange', () => { try { if (!S.ctx) return; if (raiz.document.hidden) S.ctx.suspend(); else if (S.activo) S.ctx.resume(); } catch (e) { /* nada */ } });
  }
  /* el contexto común (lo crea si hace falta; solo tras un gesto suena) */
  S.contexto = function () { desbloquea(); return S.ctx; };
  const listo = () => S.activo && S.ctx && S.ctx.state === 'running' && !(raiz.document && raiz.document.hidden);
  // reserva una voz (máx. 6 a la vez) y la libera a los `dur` segundos
  function voz(dur) { if (S.voces >= 6) return false; S.voces++; setTimeout(() => { S.voces = Math.max(0, S.voces - 1); }, dur * 1000 + 60); return true; }
  const vol = v => Math.max(0, Math.min(1, v === undefined ? 1 : v));
  function ruido(t, dur, f0, f1, g, tipo) {
    const c = S.ctx, o = c.createBufferSource(), f = c.createBiquadFilter(), a = c.createGain(); o.buffer = S.ruido; o.loop = true;
    f.type = tipo || 'lowpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + Math.min(0.03, dur / 3)); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(a); a.connect(S.maestro); o.start(t); o.stop(t + dur + 0.05);
  }
  function tono(t, dur, f0, f1, g, tipo) {
    const c = S.ctx, o = c.createOscillator(), a = c.createGain(); o.type = tipo || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(a); a.connect(S.maestro); o.start(t); o.stop(t + dur + 0.05);
  }
  // cada sonido recibe (intensidad 0..1, volumen por cercanía 0..1)
  S.choque = function (int, v) {
    try {
      if (!listo()) return; const t = S.ctx.currentTime; v = vol(v) * vol(int === undefined ? 0.7 : int); if (v < 0.03 || t - S.ultimoChoque < 0.25 || !voz(0.5)) return; S.ultimoChoque = t;
      /* GM43i: grabado: escudo, hierro y madera, un pelín desfasados */
      if (S.tiene('escudo')) { S.muestra('escudo', { v: 0.9 * v, vel: al(0.85, 1.1), pan: al(-0.4, 0.4) }); S.muestra('hierro', { v: 0.45 * v, retraso: al(0.02, 0.12), vel: al(0.9, 1.1), pan: al(-0.6, 0.6) }); if (Math.random() < 0.6) S.muestra('madera', { v: 0.5 * v, retraso: al(0.05, 0.2), pan: al(-0.6, 0.6) }); return; }
      ruido(t, 0.45, 600, 90, 0.5 * v); tono(t, 0.12, 1800, 700, 0.12 * v, 'square'); tono(t + 0.03, 0.09, 2600, 1200, 0.08 * v, 'triangle');
    } catch (e) { /* silencio */ }
  };
  S.jabalina = function (v) {
    try { if (!listo()) return; v = vol(v); if (v < 0.03 || !voz(0.3)) return; if (S.tiene('vuelo')) { S.muestra('vuelo', { v: 0.6 * v, vel: al(0.6, 0.8) }); return; } const t = S.ctx.currentTime; ruido(t, 0.28, 1500, 5000, 0.13 * v, 'bandpass'); } catch (e) { /* silencio */ }
  };
  S.cuerno = function (v) {
    try { if (!listo()) return; v = vol(v === undefined ? 0.8 : v); if (!voz(1.2)) return; if (S.tiene('cuerno')) { S.muestra('cuerno', { v: 0.8 * v, i: 1 }); return; } const t = S.ctx.currentTime; tono(t, 0.5, 196, 190, 0.18 * v, 'sawtooth'); tono(t + 0.55, 0.65, 262, 255, 0.18 * v, 'sawtooth'); } catch (e) { /* silencio */ }
  };
  /* carga de infantería: el clamor de los que cargan y sus pasos; `tam` (0..1, el tamaño del ejército) sube el rugido de la masa que suena debajo (SON10) */
  S.carga = function (v, tam) {
    try { if (!listo()) return; v = vol(v); if (v < 0.03 || !voz(1.1)) return; if (S.tiene('clamor')) { S.muestra('clamor', { v: 0.7 * v }); const m = Math.max(0, Math.min(1, tam || 0)); if (m > 0.15 && S.tiene('masa')) S.muestra('masa', { v: 0.55 * v * m, retraso: 0.05 }); for (let i = 0; i < 3; i++) S.muestra('paso', { v: 0.5 * v, retraso: i * 0.22, vel: 0.8 }); return; } const t = S.ctx.currentTime; ruido(t, 1.0, 220, 70, 0.4 * v); tono(t, 0.9, 70, 45, 0.25 * v, 'sine'); } catch (e) { /* silencio */ }
  };
  /* GC5: cuerno del enemigo (más grave y áspero que el romano), barrito de elefante y redoble de la falange. Síntesis propia, sin archivos. */
  S.cuernoRival = function (v) {
    try { if (!listo()) return; v = vol(v === undefined ? 0.7 : v); if (!voz(1.3)) return; if (S.tiene('cuerno')) { S.muestra('cuerno', { v: 0.8 * v, i: 2 }); return; } const t = S.ctx.currentTime; tono(t, 0.6, 130, 120, 0.2 * v, 'sawtooth'); tono(t + 0.1, 0.6, 133, 118, 0.12 * v, 'square'); tono(t + 0.7, 0.55, 98, 92, 0.2 * v, 'sawtooth'); } catch (e) { /* silencio */ }
  };
  S.elefante = function (v) {
    try { if (!listo()) return; v = vol(v === undefined ? 0.8 : v); if (v < 0.03 || !voz(1.2)) return; const t = S.ctx.currentTime; tono(t, 0.25, 260, 520, 0.2 * v, 'sawtooth'); tono(t + 0.2, 0.8, 520, 180, 0.22 * v, 'sawtooth'); ruido(t, 0.9, 900, 300, 0.1 * v, 'bandpass'); } catch (e) { /* silencio */ }
  };
  S.falange = function (v) {
    try { if (!listo()) return; v = vol(v === undefined ? 0.7 : v); if (v < 0.03 || !voz(0.9)) return; if (S.tiene('coro')) { S.muestra('coro', { v: 0.7 * v, vel: 0.9 }); for (let i = 0; i < 4; i++) S.muestra('paso', { v: 0.6 * v, retraso: 0.15 + i * 0.2, vel: 0.75 }); return; } const t = S.ctx.currentTime; for (let i = 0; i < 4; i++) tono(t + i * 0.2, 0.18, 90, 55, 0.2 * v, 'sine'); ruido(t, 0.8, 3000, 1200, 0.05 * v, 'highpass'); } catch (e) { /* silencio */ }
  };
  /* ---------- GM43i: sonido grabado ----------
     BANCO: grupo → cuántas variantes hay (assets/sonido/<grupo><n>.mp3). Una variante al azar cada vez, sin repetir la última. */
  const BANCO = { madera: 4, hierro: 4, escudo: 4, paso: 4, vuelo: 3, esfuerzo: 3, herido: 5, coro: 1, grito: 5, clamor: 1, masa: 1, cuerno: 2, lucha: 1, viento: 1, orden: 1, aclamacion: 1, panico: 3, canto: 2, quejido: 3 };
  S.BANCO = BANCO;
  S.archivos = () => Object.entries(BANCO).flatMap(([g, n]) => Array.from({ length: n }, (_, i) => 'assets/sonido/' + g + (i + 1) + '.mp3'));
  S.buf = {}; S.ultima = {}; S.muestras = 0; S.fondos = {}; S.banco = null;
  function decodifica(c, ab) { return new Promise((ok, mal) => { try { const p = c.decodeAudioData(ab, ok, mal); if (p && p.then) p.then(ok, mal); } catch (e) { mal(e); } }); }
  /* baja y descodifica el banco una sola vez (en Node no hace nada). Devuelve una promesa que se cumple al acabar, falte lo que falte */
  S.cargaBanco = function (c, raizWeb) {
    if (S.banco) return S.banco; c = c || S.ctx; if (!c || typeof fetch !== 'function') return Promise.resolve(0);
    const base = raizWeb || (raiz.document && raiz.document.baseURI) || (raiz.location && raiz.location.href) || '';
    const una = (g, i) => fetch(new URL('assets/sonido/' + g + (i + 1) + '.mp3', base)).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))
      .then(ab => decodifica(c, ab)).then(b => { (S.buf[g] = S.buf[g] || [])[i] = b; return 1; }).catch(() => 0);
    S.banco = Promise.all(Object.entries(BANCO).flatMap(([g, n]) => Array.from({ length: n }, (_, i) => una(g, i)))).then(r => r.reduce((a, b) => a + b, 0));
    return S.banco;
  };
  S.tiene = g => !!(S.buf[g] && S.buf[g].some(Boolean));
  /* ---------- SON2: frases habladas (assets/voces/<id>.mp3, hechas con Piper; ver assets/voces/LICENSE.txt) ----------
     cargaVoces(lista de ids): baja y descodifica las que falten (tras el primer toque; en Node no hace nada). Devuelve una promesa.
     voz(id, o): dice la frase `id`. o = { v volumen, pan, retraso, espera (s máx. que aguarda a que acabe quien habla), a nodo destino }.
       Devuelve false si esa voz no está cargada (quien llama usa entonces el grito del banco), 'ocupado' si alguien está hablando
       y no hay hueco (se salta: no se pisan), y true si suena. */
  S.vbuf = {}; S.vozHasta = 0; S.vpend = {};
  S.cargaVoces = function (lista, c, raizWeb) {
    c = c || S.ctx; if (!c || typeof fetch !== 'function' || !lista) return Promise.resolve(0);
    const base = raizWeb || (raiz.document && raiz.document.baseURI) || (raiz.location && raiz.location.href) || '';
    return Promise.all(lista.filter(id => !S.vbuf[id] && !S.vpend[id]).map(id => (S.vpend[id] = fetch(new URL('assets/voces/' + id + '.mp3', base))
      .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))).then(ab => decodifica(c, ab)).then(b => { S.vbuf[id] = b; return 1; }).catch(() => { delete S.vpend[id]; return 0; })))).then(r => r.reduce((a, b) => a + b, 0));
  };
  S.hablando = () => !!(S.ctx && S.ctx.currentTime < S.vozHasta);
  S.voz = function (id, o) {
    o = o || {}; const b = S.vbuf[id]; if (!b) return false;
    if (!listo()) return 'ocupado';
    const c = S.ctx, ahora = c.currentTime, inicio = Math.max(ahora + (o.retraso || 0), S.vozHasta);
    if (inicio - ahora > (o.espera || 0) + (o.retraso || 0) + 0.01 || S.muestras >= 24) return 'ocupado';
    try {
      const s = c.createBufferSource(), gn = c.createGain(); s.buffer = b; gn.gain.value = vol(o.v === undefined ? 0.8 : o.v); let sal = o.a || S.maestro;
      if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); p.connect(sal); sal = p; }
      s.connect(gn); gn.connect(sal); s.start(inicio); S.muestras++; S.vozHasta = inicio + b.duration + 0.2;
      s.onended = () => { S.muestras = Math.max(0, S.muestras - 1); try { s.disconnect(); gn.disconnect(); } catch (e) { /* nada */ } };
      return true;
    } catch (e) { return false; }
  };
  /* toca una variante del grupo g en el contexto c, hacia el nodo a. o = { v, pan, vel (velocidad), retraso, i (variante fija, desde 1) }.
     No mira el interruptor: eso lo hace quien llama (S.muestra, o la escena a pie). Devuelve la fuente o null. */
  S.toca = function (c, a, g, o) {
    o = o || {}; const L = S.buf[g], v = vol(o.v); if (!c || !a || !L || v < 0.02 || S.muestras >= 24) return null;
    let i = o.i ? o.i - 1 : -1;
    if (!L[i]) { const hay = L.map((b, k) => b ? k : -1).filter(k => k >= 0); if (!hay.length) return null; i = hay[Math.floor(Math.random() * hay.length)]; if (hay.length > 1 && i === S.ultima[g]) i = hay[(hay.indexOf(i) + 1) % hay.length]; }
    S.ultima[g] = i;
    try {
      const s = c.createBufferSource(), gn = c.createGain(); s.buffer = L[i]; s.playbackRate.value = o.vel || 1; gn.gain.value = v; let sal = a;
      if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); p.connect(a); sal = p; }
      s.connect(gn); gn.connect(sal); s.start(c.currentTime + (o.retraso || 0)); S.muestras++;
      s.onended = () => { S.muestras = Math.max(0, S.muestras - 1); try { s.disconnect(); gn.disconnect(); } catch (e) { /* nada */ } };
      return s;
    } catch (e) { return null; }
  };
  /* lo mismo en el contexto del juego, solo si el sonido está encendido y ya hubo un toque */
  S.muestra = (g, o) => listo() ? S.toca(S.ctx, (o && o.a) || S.maestro, g, o) : null;
  /* un fondo que se repite (lucha, viento) con volumen v (0 lo apaga despacio). a: nodo destino; c: contexto (el común si no se da) */
  S.fondo = function (g, v, a, c) {
    try {
      c = c || S.ctx; if (!c) return; const f = S.fondos[g], t = c.currentTime; v = S.activo ? vol(v) : 0;
      if (f && f.c === c) { f.g.gain.setTargetAtTime(Math.max(0.0001, v), t, 0.5); return; }
      if (f) { try { f.s.stop(); } catch (e) { /* nada */ } delete S.fondos[g]; }
      if (v < 0.01 || !S.tiene(g)) return;
      const b = S.buf[g].find(Boolean), s = c.createBufferSource(), gn = c.createGain(); s.buffer = b; s.loop = true; s.loopStart = 0.06; s.loopEnd = Math.max(0.2, b.duration - 0.06);
      gn.gain.value = 0.0001; gn.gain.setTargetAtTime(v, t, 0.5); s.connect(gn); gn.connect(a || S.maestro); s.start(t, Math.random() * b.duration * 0.8);
      S.fondos[g] = { s, g: gn, c };
    } catch (e) { /* silencio */ }
  };
  S.callaFondos = function () { for (const k in S.fondos) { try { const f = S.fondos[k]; f.s.stop(); f.s.disconnect(); f.g.disconnect(); } catch (e) { /* nada */ } } S.fondos = {}; };
  const al = (a, b) => a + Math.random() * (b - a);

  S.on = function () { S.activo = true; try { raiz.localStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ } desbloquea(); };
  S.off = function () { S.activo = false; try { raiz.localStorage.setItem(CLAVE, '0'); } catch (e) { /* nada */ } for (const k in S.fondos) S.fondo(k, 0); };
  // volumen por cercanía: d = distancia cámara-evento (mundo)
  S.cerca = d => 1 / (1 + Math.pow(d / 90, 2));

  /* Elige el choque más importante (lógica pura, en metros de simulación).
     Un regimiento «activo» tiene fight>0 o charge>0. Cada uno puntúa la suma de hombres de los activos a menos de `radio`
     (las cargas pesan 1,5). Devuelve { x, y, puntos, carga, cab, regs } o null. `prev` (opcional) da una ligera ventaja al objetivo actual. */
  function elegirChoque(regs, radio, prev) {
    radio = radio || 90; const act = regs.filter(r => r.st === 'ok' && (r.fight > 0 || r.charge > 0)); if (!act.length) return null;
    const pesa = r => (r.men || 0) * (r.charge > 0 ? 1.5 : 1); let mejor = null;
    for (const a of act) {
      let p = 0, sx = 0, sy = 0, w = 0, carga = false, cab = false; const gr = [];
      for (const r of act) if (Math.hypot(r.x - a.x, r.y - a.y) <= radio) { const m = pesa(r); p += m; sx += r.x * m; sy += r.y * m; w += m; gr.push(r); if (r.charge > 0) { carga = true; if (r.u && r.u.cls === 'cav') cab = true; } }
      if (prev && Math.hypot(sx / w - prev.x, sy / w - prev.y) < radio) p *= 1.15;
      if (!mejor || p > mejor.puntos) mejor = { x: sx / w, y: sy / w, puntos: p, carga, cab, regs: gr };
    }
    return mejor;
  }
  S.elegirChoque = elegirChoque;
  // texto de la cinta según dónde está el choque respecto al ancho del campo
  S.etiqueta = function (ch, ancho) { if (!ch) return ''; if (ch.cab) return 'carga de caballería'; const f = ch.x / (ancho || 1); return f < 0.33 ? 'ala izquierda' : f > 0.67 ? 'ala derecha' : 'choque del centro'; };

  raiz.Sonido = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
