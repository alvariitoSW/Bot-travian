/* Escenas a pie (testudo y falange): sonido GRABADO (GM43i). Sale del banco de js/gfx/sonido.js (assets/sonido/, todo CC0;
   autores en assets/sonido/LICENSE.txt). Ya no hay síntesis: gritos, pasos, madera, hierro, escudos y cuernos de verdad.
   Dos salidas: «fuera» (viento, salva, cuerno, gritos) y «dentro» (golpes en tus escudos, pasos, madera). Al cerrar el
   testudo, lo de fuera se oye apagado, como bajo un techo. Respeta el interruptor y el volumen del juego (Sonido.activo,
   Sonido.maestro) y no suena nada antes del primer toque. La falange usa este mismo archivo (falange/sonido.js lo reexporta). */
import '../../../js/gfx/sonido.js';
import '../../../js/voces.js';        /* SON4: las voces, la música y el subtítulo del juego (globales Voces, Musica, Banda) */
import '../../../js/gfx/musica.js';
import '../../../js/gfx/banda.js';

const So = () => window.Sonido, RAIZ = new URL('../../../', import.meta.url).href;   /* la raíz del juego: de ahí cuelga assets/sonido/ */
const alSonarFns = [];
/* SON4: lo que debe arrancar con el primer toque (la música y las voces): se ejecuta ya si el sonido está en marcha */
export function alSonar(fn) { alSonarFns.push(fn); if (ctx) try { fn(); } catch (e) { /* sin banda */ } }
let ctx = null, propio = false, maestro = null, fuera = null, tapa = null, dentro = null;

/* se llama con el primer toque (los navegadores no dejan sonar antes); para las pruebas admite un contexto sin altavoz (OfflineAudioContext) */
export function inicia(c) {
  if (ctx) return ctx; const S = So(); if (!S) return null;
  propio = !!c; ctx = c || S.contexto(); if (!ctx) return null;
  try {
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -9; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    maestro = ctx.createGain(); maestro.gain.value = 1.4; maestro.connect(comp).connect(propio ? ctx.destination : S.maestro);
    tapa = ctx.createBiquadFilter(); tapa.type = 'lowpass'; tapa.frequency.value = 16000; tapa.Q.value = 0.3;
    fuera = ctx.createGain(); fuera.connect(tapa).connect(maestro);
    dentro = ctx.createGain(); dentro.gain.value = 1.3; dentro.connect(maestro);
  } catch (e) { ctx = null; return null; }
  S.cargaBanco(ctx, RAIZ).then(() => fondo());
  for (const fn of alSonarFns) try { fn(); } catch (e) { /* sin banda */ }
  return ctx;
}
/* espera a que el banco esté descodificado (para las pruebas sin altavoz) */
export const carga = () => (So() && ctx ? So().cargaBanco(ctx, RAIZ) : Promise.resolve(0));
export const listo = () => !!ctx;
/* ¿puede sonar ya? sonido encendido, contexto en marcha y página a la vista (o un contexto de prueba) */
const vale = () => { const S = So(); return !!(ctx && S && (propio || (S.activo && ctx.state === 'running' && !document.hidden))); };
const al = (a, b) => a + Math.random() * (b - a);
/* toca una variante del grupo g; si el banco aún no ha llegado, lo reintenta un momento (el cuerno del primer toque) */
function toca(g, a, o, espera) {
  const S = So(); if (!vale()) return;
  if (!S.tiene(g)) { if (espera > 0) setTimeout(() => toca(g, a, o, espera - 1), 250); return; }
  S.toca(ctx, a, g, o);
}
/* viento de fondo, siempre que haya sonido */
function fondo() { const S = So(); if (S && ctx && (propio || S.activo)) S.fondo('viento', 0.32, fuera, ctx); }

/* k = 0 a cielo abierto, 1 bajo los escudos */
export function bajoTecho(k) { if (!ctx) return; tapa.frequency.setTargetAtTime(16000 * Math.pow(0.075, k), ctx.currentTime, 0.08); fuera.gain.setTargetAtTime(1 - 0.35 * k, ctx.currentTime, 0.08); fondo(); }

/* venablo que se clava en un escudo: madera hueca */
export function madera(fuerza = 1, pan = 0, retraso = 0) { toca('madera', dentro, { v: 0.85 * fuerza, pan, retraso, vel: al(0.85, 1.1) }); }
/* venablo que cae en la hierba: un paso sordo, más grave */
export function tierra(pan = 0, retraso = 0) { toca('paso', fuera, { v: 0.55, pan, retraso, vel: al(0.55, 0.7) }); }
/* la salva en el aire: silbidos que se acercan y se juntan al llegar */
export function salva(dur) {
  for (let i = 0; i < 7; i++) { const r = dur * (0.45 + 0.55 * i / 6); toca('vuelo', fuera, { v: 0.25 + 0.6 * i / 6, retraso: r - 0.12, vel: al(0.55, 0.8), pan: al(-0.7, 0.7) }); }
}
/* la salva entera al llegar: un golpe sordo que se nota en el pecho (escudo grave y madera) */
export function trueno(fuerza = 1) {
  toca('escudo', dentro, { v: 0.9 * fuerza, vel: al(0.5, 0.6), i: 3 }); toca('madera', dentro, { v: 0.6 * fuerza, vel: 0.6, retraso: 0.02 });
}
/* cuerno romano (cornu); con notas agudas al final, el de la victoria y el de cargar suenan algo más agudos y cortos */
export function cuerno(notas) {
  const fin = notas && notas.length ? notas[notas.length - 1][0] : 146.83, vel = Math.max(0.85, Math.min(1.3, fin / 146.83));
  toca('cuerno', fuera, { v: 0.85, i: fin < 140 ? 2 : 1, vel }, 12);
  if (window.Musica && vale()) window.Musica.agacha();   /* SON4: suena un cuerno: la música baja un momento */
}
/* un paso de la formación: tu pie, los de al lado y, bajo los escudos, madera que roza */
export function paso(fuerza = 1, techo = 0) {
  toca('paso', dentro, { v: 0.5 * fuerza, vel: al(0.8, 1) });
  for (let i = 0; i < 2; i++) toca('paso', dentro, { v: 0.18 * fuerza, retraso: al(0.03, 0.15), pan: al(-0.8, 0.8), vel: al(0.75, 1) });
  if (techo > 0.5 && Math.random() < 0.5) madera(0.15, al(-0.7, 0.7), al(0, 0.1));
}
/* escudos que suben o bajan: una ráfaga de tablas que chocan */
export function clac(n = 9) { for (let i = 0; i < n; i++) madera(al(0.15, 0.35), al(-0.9, 0.9), al(0, 0.45)); }
/* tu escudo se parte: golpe, astillas y un quejido */
export function crac() {
  toca('escudo', dentro, { v: 1, vel: 0.8, i: 4 }); for (let i = 0; i < 3; i++) toca('madera', dentro, { v: 0.5, vel: al(1.2, 1.5), retraso: 0.04 + i * 0.05, pan: al(-0.5, 0.5) });
  toca('herido', dentro, { v: 0.6, retraso: 0.15 });
}
/* hierro: una espada o un pilum que da en algo */
export function hierro(pan = 0, retraso = 0, fuerza = 1) { toca('hierro', fuera, { v: 0.6 * fuerza, pan, retraso, vel: al(0.9, 1.1) }); }
/* el vuelo de los pila propios: el esfuerzo del brazo y el silbido */
export function lanza() { toca('esfuerzo', dentro, { v: 0.6 }); toca('vuelo', fuera, { v: 0.6, retraso: 0.3, vel: 0.6 }); toca('vuelo', fuera, { v: 0.4, retraso: 0.4, vel: 0.7, pan: 0.3 }); }
/* el choque de las dos líneas: el clamor y una lluvia de golpes */
export function choque() {
  toca('clamor', fuera, { v: 0.7 }); trueno(0.6);
  for (let i = 0; i < 12; i++) { const r = al(0.05, 1.2); toca(i % 3 ? 'escudo' : 'madera', dentro, { v: al(0.2, 0.45), retraso: r, pan: al(-1, 1), vel: al(0.85, 1.15) }); if (i % 3 === 0) hierro(al(-1, 1), r + 0.03, al(0.4, 0.8)); }
}
/* voces: el texto del grito decide si es un clamor de todos, el «¡Ha!» a una o un grito suelto */
export function voz(texto) {
  const t = String(texto || '');
  if (/Cargad|Cargan|A ellos|Victoria|Choque|Rompen|huyen/i.test(t)) toca('clamor', fuera, { v: 0.6 });
  else if (/Ha!|A una|Arriba|Abajo|Ea/i.test(t)) toca('coro', fuera, { v: 0.75, vel: al(0.9, 1.05) });
  else toca('grito', fuera, { v: 0.5 });
}
/* un hombre que pega con todo, o que cae herido */
export function esfuerzo(pan = 0, fuerza = 1) { toca('esfuerzo', dentro, { v: 0.5 * fuerza, pan, vel: al(0.9, 1.1) }); }
export function herido(pan = 0, retraso = 0) { toca('herido', fuera, { v: 0.45, pan, retraso, vel: al(0.9, 1.1) }); }
/* el fragor de la lucha cuerpo a cuerpo: k de 0 (nada) a 1 (todo el frente pegándose) */
export function lucha(k) { const S = So(); if (S && ctx && (propio || S.activo)) S.fondo('lucha', 0.45 * Math.max(0, Math.min(1, k)), fuera, ctx); }
