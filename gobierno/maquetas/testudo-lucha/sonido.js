/* Maqueta GM43c «Testudo a pie»: sonido hecho por código (WebAudio), sin un solo archivo.
   Hay dos salidas: «fuera» (viento, salva, cuerno) y «dentro» (golpes en tus escudos, pasos, madera). Al cerrar el
   testudo, lo de fuera se oye apagado, como bajo un techo. Las voces no se sintetizan: irán con audio libre comprobado. */
let ctx = null, maestro = null, fuera = null, tapa = null, dentro = null, blanco = null, viento = null;

/* se llama con el primer toque (los navegadores no dejan sonar antes); para las pruebas admite un contexto sin altavoz */
export function inicia(c) {
  if (ctx) return ctx;
  try { ctx = c || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return null; }
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -7; comp.ratio.value = 4; comp.attack.value = 0.002; comp.release.value = 0.15;
  maestro = ctx.createGain(); maestro.gain.value = 0.8; maestro.connect(comp).connect(ctx.destination);
  tapa = ctx.createBiquadFilter(); tapa.type = 'lowpass'; tapa.frequency.value = 16000; tapa.Q.value = 0.3;
  fuera = ctx.createGain(); fuera.connect(tapa).connect(maestro);
  dentro = ctx.createGain(); dentro.gain.value = 2; dentro.connect(maestro);
  const n = ctx.sampleRate * 2; blanco = ctx.createBuffer(1, n, ctx.sampleRate); const d = blanco.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  /* viento de fondo: ruido grave que sube y baja despacio */
  viento = ctx.createGain(); viento.gain.value = 0.11;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  s.buffer = blanco; s.loop = true; f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6; lfo.frequency.value = 0.13; lg.gain.value = 160;
  lfo.connect(lg).connect(f.frequency); s.connect(f).connect(viento).connect(fuera); s.start(); lfo.start();
  return ctx;
}
export const listo = () => !!ctx;
/* k = 0 a cielo abierto, 1 bajo los escudos */
export function bajoTecho(k) { if (!ctx) return; tapa.frequency.setTargetAtTime(16000 * Math.pow(0.075, k), ctx.currentTime, 0.08); fuera.gain.setTargetAtTime(1 - 0.35 * k, ctx.currentTime, 0.08); }

const lado = (x, a) => { if (!ctx.createStereoPanner) return a; const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, x || 0)); p.connect(a); return p; };
/* un soplo de ruido filtrado: empieza en f0 y acaba en f1, sube en «sube» segundos y luego se apaga */
function soplo(a, t0, dur, { tipo = 'lowpass', f0 = 800, f1 = f0, q = 0.8, vol = 0.5, sube = 0.004, pan = 0 }) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), fm = Math.sqrt(f0 * f1);
  /* el ruido pierde fuerza al filtrarlo: se compensa según lo estrecha que queda la banda */
  vol *= Math.max(1, Math.min(10, Math.sqrt(9000 / (tipo === 'lowpass' ? fm : tipo === 'bandpass' ? fm / q : 20000 - fm))));
  s.buffer = blanco; s.loop = true; f.type = tipo; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + sube); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(lado(pan, a)); s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
}
/* una nota que cae de f0 a f1 y se apaga */
function nota(a, t0, dur, { tipo = 'sine', f0 = 200, f1 = f0, vol = 0.5, sube = 0.003, pan = 0 }) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo;
  o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + sube); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(lado(pan, a)); o.start(t0); o.stop(t0 + dur + 0.05);
}
const T = r => ctx.currentTime + (r || 0), al = (a, b) => a + Math.random() * (b - a);

/* venablo que se clava en un escudo: golpe seco de madera hueca (cuerpo grave + tabla + chasquido) */
export function madera(fuerza = 1, pan = 0, retraso = 0) {
  if (!ctx) return; const t = T(retraso), f = al(150, 230);
  nota(dentro, t, al(0.12, 0.2), { f0: f, f1: f * 0.62, vol: 1.1 * fuerza, pan });
  soplo(dentro, t, al(0.05, 0.08), { tipo: 'bandpass', f0: al(800, 1500), q: 1.4, vol: 0.4 * fuerza, pan });
  soplo(dentro, t, 0.014, { tipo: 'highpass', f0: 3200, vol: 0.28 * fuerza, pan });
}
/* venablo que cae en la hierba */
export function tierra(pan = 0, retraso = 0) { if (!ctx) return; soplo(fuera, T(retraso), al(0.09, 0.14), { f0: al(160, 260), vol: 2.6, pan }); }
/* la salva en el aire: un silbido que baja de tono y crece hasta que llega */
export function salva(dur) {
  if (!ctx) return; const t = T();
  for (let i = 0; i < 4; i++) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), f0 = al(2200, 4200), r = i * 0.07;
    s.buffer = blanco; s.loop = true; f.type = 'bandpass'; f.Q.value = al(5, 9);
    f.frequency.setValueAtTime(f0, t + r); f.frequency.exponentialRampToValueAtTime(f0 * 0.3, t + dur);
    g.gain.setValueAtTime(0.0001, t + r); g.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(1.6, t + dur * 0.97); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    s.connect(f).connect(g).connect(lado(i % 2 ? 0.4 : -0.4, fuera)); s.start(t + r, Math.random()); s.stop(t + dur + 0.2);
  }
  soplo(fuera, t + dur * 0.5, dur * 0.5 + 0.1, { tipo: 'lowpass', f0: 300, f1: 900, vol: 0.2, sube: dur * 0.45 });
}
/* la salva entera al llegar: un golpe sordo que se nota en el pecho */
export function trueno(fuerza = 1) { if (!ctx) return; const t = T(); nota(dentro, t, 0.5, { f0: 95, f1: 42, vol: 1.5 * fuerza }); soplo(dentro, t, 0.4, { f0: 320, f1: 90, vol: 0.5 * fuerza }); }
/* cuerno romano (cornu): dos sierras algo desafinadas con un filtro que se abre al soplar */
export function cuerno(notas = [[110, 0.7], [146.83, 1.3]]) {
  if (!ctx) return; let t = T(0.02);
  for (const [fr, dur] of notas) {
    const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2.2;
    f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(1250, t + 0.16); f.frequency.linearRampToValueAtTime(760, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.1); g.gain.setValueAtTime(0.13, t + dur - 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [des, tipo, v] of [[-5, 'sawtooth', 1], [6, 'sawtooth', 0.8], [0, 'square', 0.35]]) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = tipo; o.frequency.value = tipo === 'square' ? fr / 2 : fr; o.detune.value = des; og.gain.value = v;
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.value = 5; vib.connect(vg).connect(o.detune); vib.start(t); vib.stop(t + dur + 0.05);
      o.connect(og).connect(f); o.start(t); o.stop(t + dur + 0.05);
    }
    f.connect(g).connect(fuera); t += dur * 0.93;
  }
}
/* un paso de la formación: golpe grave en tierra; bajo los escudos, además, madera que roza */
export function paso(fuerza = 1, techo = 0) {
  if (!ctx) return; const t = T();
  soplo(dentro, t, 0.09, { f0: al(110, 150), vol: 0.5 * fuerza }); nota(dentro, t, 0.14, { f0: 78, f1: 50, vol: 0.9 * fuerza });
  for (let i = 0; i < 3; i++) soplo(dentro, t + al(0, 0.12), 0.05, { f0: al(90, 170), vol: 0.1 * fuerza, pan: al(-0.8, 0.8) });
  if (techo > 0.5 && Math.random() < 0.6) madera(0.14, al(-0.7, 0.7), al(0, 0.1));
}
/* escudos que suben o bajan: una ráfaga de tablas que chocan */
export function clac(n = 9) { if (!ctx) return; for (let i = 0; i < n; i++) madera(al(0.1, 0.25), al(-0.9, 0.9), al(0, 0.45)); soplo(dentro, T(), 0.45, { tipo: 'bandpass', f0: 500, f1: 260, q: 2, vol: 0.12, sube: 0.15 }); }
/* tu escudo se parte */
export function crac() {
  if (!ctx) return; const t = T();
  soplo(dentro, t, 0.28, { tipo: 'highpass', f0: 1700, f1: 900, vol: 0.7 }); nota(dentro, t, 0.4, { f0: 180, f1: 70, vol: 1.4 });
  for (let i = 0; i < 5; i++) soplo(dentro, t + 0.03 + i * al(0.02, 0.05), 0.03, { tipo: 'bandpass', f0: al(1800, 3600), q: 3, vol: 0.4 });
}
/* hierro: una espada o un pilum que da en algo (parciales que no casan, como una campana pequeña) */
export function hierro(pan = 0, retraso = 0, fuerza = 1) { if (!ctx) return; const t = T(retraso), f = al(1300, 2100); for (const [k, v] of [[1, 0.5], [2.76, 0.3], [5.4, 0.18]]) nota(fuera, t, al(0.18, 0.4), { f0: f * k, f1: f * k * 0.995, vol: v * fuerza, pan }); soplo(fuera, t, 0.03, { tipo: 'highpass', f0: 4000, vol: 0.2 * fuerza, pan }); }
/* el vuelo de los pila propios */
export function lanza() { if (!ctx) return; soplo(fuera, T(0.3), 0.9, { tipo: 'bandpass', f0: 900, f1: 2600, q: 3, vol: 0.3, sube: 0.25 }); }
/* el choque de las dos líneas */
export function choque() {
  if (!ctx) return; trueno(0.45);
  for (let i = 0; i < 16; i++) { madera(al(0.12, 0.3), al(-1, 1), al(0.05, 1.1)); if (i % 2) hierro(al(-1, 1), al(0.05, 1.3), al(0.5, 1)); }
}
