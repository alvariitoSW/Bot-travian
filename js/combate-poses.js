/* AQVILA — CB2: la pose de un hombre sacada SOLO del estado del motor (js/combate.js). Sin pantalla: corre en Node y en el navegador.
   Prueba: test/combate-poses.test.mjs.

   CONTRATO
   import { poseDe, rotuloDe, T_CAIDA } from './combate-poses.js';
   poseDe(h, t) → { escudo, arma, golpe, avance, agacha, inclina, cae,              (lo que hace, para quien no quiera huesos)
                    manoI, manoD, poloI, poloD, baja, dobla, tuerce, cabeza }       (blancos para esqueleto.js postura(), en metros)
     h: un hombre del motor (izq.estado/izq.t, der.estado/der.t/der.golpe, guardia, vivo, muerto). t: segundos de la escena (respira).
     escudo: 'alzado'|'bajo'|'para'|'empuja'|'roto'    arma: 'guardia'|'estocada'|'tajo'|'recupera'|'para'
     avance: 0..1 del golpe en curso (estocada o tajo)  agacha: 0..1 (testudo)  inclina: rad hacia delante  cae: 0..1 desde 'cae'
     Ejes del hombre: +x a su izquierda, y arriba, +z delante (los de esqueleto.js). La mano izquierda lleva el escudo.
   rotuloDe(h) → frase corta de lo que hace: «para con el escudo», «estocada», «golpe de umbo», «cae»…
   Las cifras son licencia de juego: posturas que se lean a 3-5 m, no medidas. */

import { T_GOLPE, T_PARA, UMBO } from './combate.js';

export const T_CAIDA = 1.1;   /* segundos que tarda en llegar al suelo */
const T_VUELVE = 0.45;        /* lo que tarda en volver a la guardia tras el golpe */

/* posturas de partida (metros). GUARDIA es la de soldado.js (GP1) */
const GUARDIA = { baja: 0.12, dobla: 0.14, tuerce: 0.18, manoI: [0.2, 1.1, 0.48], manoD: [-0.3, 1.02, 0.28], cabeza: [-0.05, -0.18] };
const ESCUDO = {
  /* la mano del scutum va en el asa, detrás del umbo, casi en el centro del cuerpo (como el muro de a-pie: MURO_Y, MURO_Z) */
  alzado: [0.0, 0.92, 0.42], bajo: [0.22, 0.68, 0.28], para: [-0.02, 1.08, 0.5], roto: [0.36, 0.95, 0.12]
};
const ARMA = {
  guardia: [-0.3, 1.02, 0.28], estocada: [-0.1, 1.15, 0.9], tajoArriba: [-0.34, 1.98, 0.08], tajoAbajo: [-0.04, 0.95, 0.62],
  para: [-0.12, 1.48, 0.46]
};
const mezcla = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const suave = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const sem = id => { let s = 0; for (const c of String(id)) s = (s * 31 + c.charCodeAt(0)) % 997; return s / 997; };

/* dónde va la mano del arma en el golpe (k = 0..1 del tiempo T_GOLPE) */
function manoGolpe(golpe, k) {
  if (golpe === 'filo') {
    /* tajo: arriba (35 %) y de arriba abajo */
    if (k < 0.35) return mezcla(ARMA.guardia, ARMA.tajoArriba, suave(k / 0.35));
    return mezcla(ARMA.tajoArriba, ARMA.tajoAbajo, suave((k - 0.35) / 0.65));
  }
  /* estocada: sale rápida (45 %), se queda un poco fuera */
  if (k < 0.45) return mezcla(ARMA.guardia, ARMA.estocada, suave(k / 0.45));
  return mezcla(ARMA.estocada, ARMA.guardia, 0.3 * (k - 0.45) / 0.55);
}

export function poseDe(h, t = 0) {
  const I = h.izq || { estado: 'alzado', t: 0 }, D = h.der || { estado: 'guardia', t: 0 };
  const p = { ...GUARDIA, manoI: ESCUDO.alzado.slice(), manoD: ARMA.guardia.slice(), poloI: [0.6, -1, 0.1], poloD: [-0.6, -1, 0.1],
    escudo: I.estado, arma: 'guardia', golpe: D.golpe || 'punta', avance: 0, agacha: 0, inclina: 0, cae: 0 };
  /* respira: un poco, cada uno a su ritmo */
  p.baja += 0.012 * Math.sin(t * 1.9 + 6.28 * sem(h.id));
  /* escudo */
  if (I.estado === 'para') { const k = suave(Math.min(1, (I.t || 0) / 0.08)); p.manoI = mezcla(ESCUDO.alzado, ESCUDO.para, k); p.dobla += 0.08 * k; }
  else if (I.estado === 'empuja') {
    const k = Math.sin(Math.PI * Math.min(1, (I.t || 0) / UMBO.t));   /* sale y vuelve */
    p.manoI = [-0.01, 0.95, 0.42 + 0.35 * k]; p.dobla += 0.2 * k; p.tuerce -= 0.15 * k; p.baja += 0.04 * k;
  }
  else if (ESCUDO[I.estado]) p.manoI = ESCUDO[I.estado].slice();
  /* arma */
  if (D.estado === 'golpea') {
    const k = Math.min(1, (D.t || 0) / T_GOLPE);
    p.arma = p.golpe === 'filo' ? 'tajo' : 'estocada'; p.avance = k;
    p.manoD = manoGolpe(p.golpe, k);
    const fuera = Math.sin(Math.PI * Math.min(1, k * 1.3));
    p.inclina = 0.22 * fuera; p.dobla += p.inclina; p.tuerce += (p.golpe === 'filo' ? 0.15 : 0.3) * fuera;
    if (p.golpe === 'filo' && k < 0.5) p.poloD = [-0.8, -0.3, -0.4];
  } else if (D.estado === 'recupera') {
    const fin = manoGolpe(D.golpe || 'punta', 1), k = suave(Math.min(1, (D.t || 0) / T_VUELVE));
    p.arma = 'recupera'; p.manoD = mezcla(fin, ARMA.guardia, k);
  } else if (D.estado === 'para') {
    p.arma = 'para'; p.manoD = mezcla(ARMA.guardia, ARMA.para, suave(Math.min(1, (D.t || 0) / 0.08)));
    p.poloD = [-0.9, -0.3, 0.2];
  }
  /* cuerpo: testudo agachado */
  if (h.guardia === 'testudo') { p.agacha = 1; p.baja += 0.1; p.dobla += 0.08; }
  /* caída */
  if (h.vivo === false) {
    p.cae = Math.min(1, (h.muerto || 0) / T_CAIDA);
    p.arma = 'guardia'; p.escudo = 'bajo'; p.manoI = ESCUDO.bajo.slice(); p.manoD = [-0.36, 0.9, 0.15];
    p.dobla = GUARDIA.dobla + 0.45 * p.cae; p.baja = GUARDIA.baja + 0.12 * p.cae; p.cabeza = [0.4 * p.cae, 0];
  }
  return p;
}

const ROTULO_ESCUDO = { para: 'para con el escudo', empuja: 'golpe de umbo' };
export function rotuloDe(h) {
  if (!h) return '';
  if (h.vivo === false) return (h.muerto || 0) < T_CAIDA ? 'cae' : 'caído';
  if (h.huye) return 'huye';
  if (ROTULO_ESCUDO[h.izq.estado]) return ROTULO_ESCUDO[h.izq.estado];
  if (h.der.estado === 'para') return 'para con la espada';
  if (h.der.estado === 'golpea') return h.der.golpe === 'filo' ? 'tajo' : 'estocada';
  if (h.der.estado === 'recupera') return 'vuelve a la guardia';
  if (h.izq.estado === 'bajo') return 'escudo bajo: cansado';
  if (h.izq.estado === 'roto') return 'sin escudo';
  return h.guardia === 'testudo' ? 'en testudo' : 'en guardia';
}
export { T_PARA };
