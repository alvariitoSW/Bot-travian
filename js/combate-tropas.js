/* AQVILA — CB3: el motor de lucha (js/combate.js) decide la lucha cuerpo a cuerpo de la batalla a pie («Bajar a pie» y la escena
   de bloques, gobierno/maquetas/bloque/). Sin pantalla: corre en Node y en el navegador. Prueba: test/combate-bloque.test.mjs.

   CONTRATO
   import { crearLucha, TROPA, clipLucha } from './combate-tropas.js';
   TROPA[tipo de bloque] → { arma, escudo } del motor: lo que lleva cada hombre de esa tropa.
   crearLucha({ C, TR, semilla }) → { paso(dt), medir() }
     C: crearCombate({ ..., lucha: 'motor' }) de js/bloque-ia.js; TR: crearTropas de gobierno/maquetas/bloque/tropas.js.
     paso(dt), después de C.paso, TR.paso y la física (las figuras ya en su sitio corregido): cada figura de las FILAS primeras de un
     bloque en choque (y no huyendo) lleva un hombre del motor (f.hc) con su x, z y yaw; Combate.paso decide golpes, paradas y
     caídas. Un 'cae' del motor = esa figura cae (f.marcado / h.marcado: tropas.js y bloque-ia la tumban la primera) y C.baja(b, 1)
     la cuenta como baja del bloque. Bloques sin contacto: no gastan motor (su hombre se guarda, con su cansancio y sus heridas).
     El testudo de las reglas pone la guardia 'testudo' del motor (como Combate.ponerGuardia, sin apretar filas: eso es de tropas.js).
     El hombre que eres tú (h.yo, FU2) y la figura marcada (tu rival del duelo) no entran: los decide el duelo.
     medir() → { pasos, ms (media por paso de Combate.paso), msMax, hombres (media en el motor), eventos { golpe, para, cae, ... } }
   clipLucha(h, T, DUR) → { clip, t } | null: el clip de los soldados y el tiempo dentro de él, sacados del estado del motor por
     poseDe (js/combate-poses.js), como gobierno/maquetas/combate-cerca/: golpe → 'golpear'; parada o umbo → 'cubrirse'; si no, guardia.
   Determinista: el azar sale de Combate.crearAzar(semilla).
   HISTORIA: gladius y scutum del legionario (Polibio 6.23; histórico). Espada larga y escudo oval de los galos (Polibio 2.30-33,
   Diodoro 5.30; histórico). Lo demás (cuántas filas pelean, el reparto de armas de tiradores y nobles) es LICENCIA DE JUEGO. */

import * as Combate from './combate.js';
import { poseDe } from './combate-poses.js';

export const TROPA = {
  manipulo:  { arma: 'gladius',     escudo: 'scutum' },
  galos:     { arma: 'espada_gala', escudo: 'thureos' },
  nobles:    { arma: 'espada_gala', escudo: 'thureos' },
  tiradores: { arma: 'hasta',       escudo: 'pelta' },
  falange:   { arma: 'sarisa',      escudo: 'aspis' },
};
export const FILAS = 2;          /* filas de cada bloque que entran al motor (la 1.ª pega; la 2.ª ocupa el hueco). Licencia de juego */
/* el paso adelante del que golpea: la física deja a los rivales a ~1–1,5 m (escudo contra escudo) y el gladius alcanza 1,2 m; el
   motor ve a cada hombre ADELANTE m más cerca del enemigo (el brazo y el paso que se dan al golpear). Licencia de juego, puesta
   para que la lucha a pie dure como antes (test/combate-bloque.test.mjs) */
export const ADELANTE = 0.35;
const T_GOLPE_CLIP = 0.6;        /* segundo del clip 'golpear' en que el brazo llega al golpe (a ojo en los clips Meshy). Licencia */

const filaDe = f => f.h ? f.h.fila : (f.b.vis ? Math.floor(f.slot / f.b.vis.cols) : 99);
const lucha = b => b.contactos && b.contactos.length > 0 && b.estado !== 'huye' && b.estado !== 'fuera' && !b.U.roto;

export function crearLucha({ C, TR, semilla = 1 }) {
  const rnd = Combate.crearAzar((semilla * 977 + 13) >>> 0), porId = new Map(), est = { pasos: 0, ms: 0, msMax: 0, hombres: 0, eventos: {} };
  let sig = 1;
  const reloj = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function paso(dt) {
    const L = [];
    for (const f of TR.figs) {
      const b = f.b;
      if (f.hc) f.hc.activo = false;
      if (f.vivo === false || f.marcado || (f.h && f.h.yo) || !lucha(b) || filaDe(f) >= FILAS) continue;
      const T = TROPA[b.tipo] || TROPA.manipulo;
      if (!f.hc) { f.hc = Combate.crearHombre({ id: sig++, bando: b.bando, arma: T.arma, escudo: T.escudo, rnd }); porId.set(f.hc.id, f); }
      const h = f.hc;
      h.yaw = Math.PI - f.yaw; h.x = f.x + Math.sin(h.yaw) * ADELANTE; h.z = f.z - Math.cos(h.yaw) * ADELANTE; h.fila = filaDe(f); h.col = f.semilla;   /* tropas: mira (sen yaw, cos yaw); motor: (sen yaw, −cos yaw) */
      h.guardia = b.bando === 'r' && b.orden === 'testudo' ? 'testudo' : T.arma === 'sarisa' ? 'falange' : 'normal';
      h.activo = true; L.push(h);
    }
    if (!L.length) return;
    const ev = [], t0 = reloj();
    Combate.paso(L, dt, { rnd, eventos: ev });
    const ms = reloj() - t0; est.pasos++; est.ms += ms; est.msMax = Math.max(est.msMax, ms); est.hombres += L.length;
    for (const e of ev) {
      est.eventos[e.tipo] = (est.eventos[e.tipo] || 0) + 1;
      if (e.tipo !== 'cae') continue;
      const f = porId.get(e.a); if (!f || f.vivo === false) continue;
      f.marcado = true; if (f.h) f.h.marcado = true;
      C.baja(f.b, 1);
    }
  }
  function medir() {
    const n = Math.max(1, est.pasos);
    return { pasos: est.pasos, ms: +(est.ms / n).toFixed(4), msMax: +est.msMax.toFixed(3), hombres: Math.round(est.hombres / n), eventos: { ...est.eventos } };
  }
  return { paso, medir };
}

/* el clip de un soldado sacado del estado del motor (como clipDe de combate-cerca) */
export function clipLucha(h, T, DUR) {
  if (!h || !h.activo || !h.vivo) return null;
  const p = poseDe(h, T);
  if (p.arma === 'estocada' || p.arma === 'tajo') return { clip: 'golpear', t: T_GOLPE_CLIP * Math.min(1, p.avance / 0.6) };
  if (p.arma === 'recupera') return { clip: 'golpear', t: T_GOLPE_CLIP + (DUR.golpear - 0.05 - T_GOLPE_CLIP) * Math.min(1, (h.der.t || 0) / 0.45) };
  if (p.escudo === 'para' || p.escudo === 'empuja' || p.arma === 'para') return { clip: 'cubrirse', t: (DUR.cubrirse - 0.05) * Math.min(1, (h.izq.t || h.der.t || 0) / 0.08 + 0.3) };
  return { clip: 'guardia', t: null };
}
