/* Sonido sintetizado de la batalla (WebAudio, sin archivos) y elección pura del choque que sigue la cámara.
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
  }
  function desbloquea() { crea(); try { if (S.ctx && S.ctx.state === 'suspended' && !raiz.document.hidden) S.ctx.resume(); } catch (e) { /* nada */ } }
  if (raiz.document) {
    for (const ev of ['pointerdown', 'touchstart', 'keydown']) raiz.document.addEventListener(ev, desbloquea, { passive: true });
    raiz.document.addEventListener('visibilitychange', () => { try { if (!S.ctx) return; if (raiz.document.hidden) S.ctx.suspend(); else if (S.activo) S.ctx.resume(); } catch (e) { /* nada */ } });
  }
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
      ruido(t, 0.45, 600, 90, 0.5 * v); tono(t, 0.12, 1800, 700, 0.12 * v, 'square'); tono(t + 0.03, 0.09, 2600, 1200, 0.08 * v, 'triangle');
    } catch (e) { /* silencio */ }
  };
  S.jabalina = function (v) {
    try { if (!listo()) return; v = vol(v); if (v < 0.03 || !voz(0.3)) return; const t = S.ctx.currentTime; ruido(t, 0.28, 1500, 5000, 0.13 * v, 'bandpass'); } catch (e) { /* silencio */ }
  };
  S.cuerno = function (v) {
    try { if (!listo()) return; v = vol(v === undefined ? 0.8 : v); if (!voz(1.2)) return; const t = S.ctx.currentTime; tono(t, 0.5, 196, 190, 0.18 * v, 'sawtooth'); tono(t + 0.55, 0.65, 262, 255, 0.18 * v, 'sawtooth'); } catch (e) { /* silencio */ }
  };
  S.carga = function (v) {
    try { if (!listo()) return; v = vol(v); if (v < 0.03 || !voz(1.1)) return; const t = S.ctx.currentTime; ruido(t, 1.0, 220, 70, 0.4 * v); tono(t, 0.9, 70, 45, 0.25 * v, 'sine'); } catch (e) { /* silencio */ }
  };
  S.on = function () { S.activo = true; try { raiz.localStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ } desbloquea(); };
  S.off = function () { S.activo = false; try { raiz.localStorage.setItem(CLAVE, '0'); } catch (e) { /* nada */ } };
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
