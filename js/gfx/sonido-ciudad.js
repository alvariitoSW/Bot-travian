/* Sonido ambiente de la ciudad (WebAudio, sin archivos). Cuelga de window.Sonido (ctx, maestro, activo, cerca).
   ambiente(est) es PURA (se prueba en Node); actualizar(est) se llama una vez por cuadro desde CityView3D.update().
   est = { E, city, id, camD, camX, camZ, estacion (ks: 0 primavera, 1 verano, 2 otoño, 3 invierno), hora (0..24),
           nObras, nObrasActivas, forja, mercado, granjas, fuego, hambre, crecida, dRio, pending, vivo, obreros, recuas } */
(function (raiz) {
  'use strict';
  const S = { _g: null, _an: null, _buf: null, _t: 0, _vivo: false, _nodos: null, _voces: 0, _ult: {}, _tm: null, _nv: 0 };
  const cl = (v, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const suave = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ---------- lógica pura ---------- */
  function ambiente(est) {
    est = est || {};
    const ks = ((Math.round(num(est.estacion, 1)) % 4) + 4) % 4, h = ((num(est.hora, 12) % 24) + 24) % 24;
    const dia = suave(5.5, 7.5, h) * (1 - suave(18.5, 20.5, h)), noche = 1 - dia;
    const camD = Math.max(0, num(est.camD, 60)), cer = 1 / (1 + Math.pow(camD / 90, 2)), cerca = 0.3 + 0.7 * cer;
    const verano = ks === 1 ? 1 : 0, calido = ks === 1 ? 1 : ks === 0 || ks === 2 ? 0.55 : 0;
    const invierno = ks === 3;
    const act = Math.max(0, num(est.nObrasActivas, 0)), obras = act > 0 ? cl(0.55 + 0.15 * Math.min(act, 3)) : 0;
    const dRio = num(est.dRio, 400), prox = 1 - suave(40, 260, dRio);
    const estac = ks === 1 ? 1 : invierno ? 0.2 : 0.6;
    const r = {};
    r.viento = cl((invierno ? 0.55 : 0.2 + 0.1 * (ks === 0 ? 1 : 0)) * (0.7 + 0.3 * noche) * (0.55 + 0.45 * cer) + (invierno && noche ? 0.25 : 0));
    r.rio = cl(prox * estac * (0.4 + 0.6 * cer) * (1 + 0.5 * cl(num(est.crecida, 0))) * (0.55 + 0.45 * Math.max(dia, 0.4)) + (invierno && noche ? 0 : 0));
    r.martillo = cl(obras * dia * cerca * (0.6 + 0.4 * (invierno ? 0.6 : 1)));
    r.forja = cl(num(est.forja, 0) > 0 ? (0.5 + 0.1 * Math.min(num(est.forja, 0), 5)) * dia * cerca : 0);
    r.mercado = cl(num(est.mercado, 0) > 0 ? (0.45 + 0.1 * Math.min(num(est.mercado, 0), 5)) * dia * cerca : 0);
    r.pajaros = cl(dia * (ks === 3 ? 0.15 : ks === 2 ? 0.45 : 0.9) * (0.3 + 0.7 * cer) * (0.6 + 0.1 * Math.min(num(est.granjas, 0), 4)));
    r.gallo = cl(num(est.granjas, 0) > 0 ? (suave(5, 6.5, h) * (1 - suave(8, 10, h))) * cerca * (invierno ? 0.5 : 1) : 0);
    r.cigarras = cl(verano * dia * (0.35 + 0.65 * cer));
    r.grillos = cl(ks === 3 ? 0 : noche * calido * (0.35 + 0.65 * cer));
    r.fuego = cl(num(est.fuego, 0) > 0 ? (0.5 + 0.1 * Math.min(num(est.fuego, 0), 5)) * cerca : 0);
    // el hambre apaga la alegría del mercado
    if (num(est.hambre, 0) > 0) r.mercado = cl(r.mercado * (1 - 0.5 * cl(est.hambre)));
    return r;
  }
  S.ambiente = ambiente;

  /* ---------- audio ---------- */
  const Son = () => raiz.Sonido || null;
  const pronto = () => { const s = Son(); return !!(s && s.activo && s.ctx && s.maestro); };
  function buffer(c) { if (S._buf && S._buf._c === c) return S._buf; const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; b._c = c; S._buf = b; return b; }
  function fuente(c, tipo, f, q, g) { const o = c.createBufferSource(), fl = c.createBiquadFilter(), a = c.createGain(); o.buffer = buffer(c); o.loop = true; o.loopStart = Math.random() * 0.5; fl.type = tipo; fl.frequency.value = f; fl.Q.value = q; a.gain.value = 0; o.connect(fl); fl.connect(a); a.connect(S._g); o.start(); return { o, fl, a }; }
  function osc(c, f, g) { const o = c.createOscillator(), a = c.createGain(), m = c.createOscillator(), mg = c.createGain(); o.type = 'sine'; o.frequency.value = f; m.frequency.value = 18; mg.gain.value = 0; m.connect(mg); mg.connect(a.gain); a.gain.value = 0; o.connect(a); a.connect(S._g); o.start(); m.start(); return { o, m, a, mg }; }
  function nace() {
    const s = Son(), c = s.ctx; S._g = c.createGain(); S._g.gain.value = 0; S._g.connect(s.maestro);
    try { S._an = c.createAnalyser(); S._an.fftSize = 512; S._g.connect(S._an); } catch (e) { S._an = null; }
    S._nodos = { viento: fuente(c, 'lowpass', 400, 0.7), rio: fuente(c, 'bandpass', 900, 0.5), mercado: fuente(c, 'bandpass', 700, 0.9), fuego: fuente(c, 'highpass', 2500, 0.6), cigarras: osc(c, 4600), grillos: osc(c, 4200) };
    S._nodos.cigarras.m.frequency.value = 38; S._nodos.grillos.m.frequency.value = 9; S._nodos.cigarras.o.type = 'sawtooth';
  }
  function destruye() {
    if (S._nodos) for (const k in S._nodos) { const n = S._nodos[k]; try { (n.o).stop(); if (n.m) n.m.stop(); n.a.disconnect(); } catch (e) { /* nada */ } }
    try { if (S._g) S._g.disconnect(); } catch (e) { /* nada */ }
    S._nodos = null; S._g = null; S._an = null; S._vivo = false;
    if (S._tm) { clearInterval(S._tm); S._tm = null; }
  }
  // ganancia de una voz continua con rampa corta
  const rampa = (p, v, t, d) => { try { p.cancelScheduledValues(t); p.setTargetAtTime(v, t, d || 0.25); } catch (e) { p.value = v; } };
  const fundeA = (t, v) => { if (S._g) rampa(S._g.gain, v, t, 0.3); };

  function reserva(dur) { if (S._voces >= 4) return false; S._voces++; setTimeout(() => { S._voces = Math.max(0, S._voces - 1); }, dur * 1000 + 60); return true; }
  function pan(c, d) { if (!c.createStereoPanner) return null; const p = c.createStereoPanner(); p.pan.value = cl(d, -1, 1); p.connect(S._g); return p; }
  function rafaga(c, t, dur, f0, f1, g, tipo, p, esTono) {
    const o = esTono ? c.createOscillator() : c.createBufferSource(), a = c.createGain(), fl = c.createBiquadFilter(), d = p || S._g;
    if (esTono) { o.type = tipo || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); o.connect(a); }
    else { o.buffer = buffer(c); o.loop = true; fl.type = tipo || 'bandpass'; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); o.connect(fl); fl.connect(a); }
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + Math.min(0.02, dur / 3)); a.gain.exponentialRampToValueAtTime(0.0001, t + dur); a.connect(d); o.start(t); o.stop(t + dur + 0.05);
  }
  const ritmo = (k, t, cada) => { if (t - (S._ult[k] || -99) < cada) return false; S._ult[k] = t; return true; };
  // posición relativa a la cámara → volumen y panorama (cámara mira a -z de forma aproximada)
  function lugar(est, x, z) {
    const s = Son(), dx = num(x, 0) - num(est.camX, 0), dz = num(z, 0) - num(est.camZ, 0), d = Math.hypot(dx, dz) + num(est.camD, 60) * 0.3;
    return { v: s.cerca ? s.cerca(d) : 1 / (1 + Math.pow(d / 90, 2)), p: cl(dx / (Math.abs(dx) + Math.abs(dz) + 30)) };
  }

  function actualizar(est) {
    try {
      est = est || {}; S._t = Date.now();
      const s = Son(), hide = !!(raiz.document && raiz.document.hidden);
      if (!pronto() || hide || est.pending || est.vivo) { if (S._vivo) callar(); return; }
      if (s.ctx.state !== 'running') return;
      if (!S._g) nace();
      if (!S._vivo) { S._vivo = true; if (!S._tm && typeof setInterval === 'function') S._tm = setInterval(vigila, 400); }
      const c = s.ctx, t = c.currentTime, a = ambiente(est), N = S._nodos;
      fundeA(t, 1);
      rampa(N.viento.a.gain, 0.30 * a.viento, t); N.viento.fl.frequency.value = 250 + 500 * a.viento + 150 * Math.sin(t * 0.37);
      rampa(N.rio.a.gain, 0.22 * a.rio, t);
      rampa(N.mercado.a.gain, 0.10 * a.mercado * (0.7 + 0.3 * Math.sin(t * 1.3 + 1)), t); N.mercado.fl.frequency.value = 600 + 250 * Math.sin(t * 0.8);
      rampa(N.fuego.a.gain, 0.12 * a.fuego * (0.6 + 0.4 * Math.random()), t, 0.08);
      rampa(N.cigarras.mg.gain, 0.02 * a.cigarras, t); rampa(N.cigarras.a.gain, 0.02 * a.cigarras, t);
      rampa(N.grillos.mg.gain, 0.02 * a.grillos, t); rampa(N.grillos.a.gain, 0.02 * a.grillos, t);
      // ráfagas cortas con tope de 4 voces
      const act = num(est.nObrasActivas, 0) > 0;
      if (a.martillo > 0.03 && act && ritmo('mar', t, 0.55 + Math.random() * 0.4)) {
        const ob = Array.isArray(est.obreros) ? est.obreros : null, o = ob && ob.length ? ob[Math.floor(Math.random() * ob.length)] : null, l = o ? lugar(est, o.x, o.z) : { v: 1, p: 0 };
        if (l.v > 0.04 && reserva(0.2)) { const p = pan(c, l.p); rafaga(c, t, 0.12, 900, 500, 0.35 * a.martillo * l.v, 'bandpass', p); rafaga(c, t, 0.1, 1700, 900, 0.1 * a.martillo * l.v, 'triangle', p, true); }
      }
      if (a.forja > 0.03 && ritmo('forja', t, 0.9 + Math.random() * 0.5) && reserva(0.5)) { rafaga(c, t, 0.4, 2200, 1800, 0.28 * a.forja, 'sine', null, true); rafaga(c, t, 0.15, 1200, 600, 0.2 * a.forja, 'bandpass'); }
      const rc = Array.isArray(est.recuas) ? est.recuas : null;
      if (rc && rc.length && ritmo('cascos', t, 0.32)) {
        const r = rc[Math.floor(Math.random() * rc.length)], l = lugar(est, r.x, r.z);
        if (l.v > 0.05 && reserva(0.15)) { const p = pan(c, l.p); rafaga(c, t, 0.08, 500, 250, 0.3 * l.v, 'bandpass', p); if (Math.random() < 0.4) rafaga(c, t + 0.04, 0.12, 3200, 3000, 0.05 * l.v, 'sine', p, true); }
      }
      if (a.pajaros > 0.05 && ritmo('paj', t, 2.5 + Math.random() * 4 / Math.max(0.2, a.pajaros)) && reserva(0.4)) { const f = 2500 + Math.random() * 1500; rafaga(c, t, 0.12, f, f * 1.4, 0.05 * a.pajaros, 'sine', null, true); rafaga(c, t + 0.15, 0.1, f * 1.3, f * 0.9, 0.04 * a.pajaros, 'sine', null, true); }
      if (a.gallo > 0.05 && ritmo('gallo', t, 14) && reserva(1.1)) { rafaga(c, t, 0.3, 500, 900, 0.1 * a.gallo, 'sawtooth', null, true); rafaga(c, t + 0.35, 0.25, 800, 600, 0.1 * a.gallo, 'sawtooth', null, true); rafaga(c, t + 0.65, 0.4, 900, 450, 0.1 * a.gallo, 'sawtooth', null, true); }
      if (a.fuego > 0.05 && ritmo('crep', t, 0.25 + Math.random() * 0.4) && reserva(0.1)) rafaga(c, t, 0.05, 3500, 2000, 0.25 * a.fuego, 'highpass');
    } catch (e) { /* silencio */ }
  }
  S.actualizar = actualizar;

  // fundido a silencio; las fuentes se destruyen cuando la ganancia ya es 0
  function callar() {
    try { const s = Son(); if (!S._g || !s || !s.ctx) { destruye(); return; } fundeA(s.ctx.currentTime, 0); S._vivo = false; if (S._tm) { clearInterval(S._tm); S._tm = null; } setTimeout(() => { if (!S._vivo) destruye(); }, 1200); } catch (e) { destruye(); }
  }
  function vigila() { if (!S._vivo) return; if (Date.now() - S._t > 1000 || (raiz.document && raiz.document.hidden) || !pronto()) callar(); }
  S.nivel = function () {
    try { if (!S._an) return 0; const d = new Uint8Array(S._an.fftSize); S._an.getByteTimeDomainData(d); let q = 0; for (let i = 0; i < d.length; i++) { const v = (d[i] - 128) / 128; q += v * v; } return Math.sqrt(q / d.length); } catch (e) { return 0; }
  };

  raiz.SonidoCiudad = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
