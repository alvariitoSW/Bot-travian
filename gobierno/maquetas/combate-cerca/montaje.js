/* AQVILA — CB2: el choque de la maqueta «Combate de cerca», sin pantalla. Lo usan la maqueta y gobierno/captura-combate-cb2.mjs
   (que busca en los eventos los momentos de cada captura). 4×2 hastati (gladius y scutum) contra 4×2 galos (espada larga y
   escudo oval: el galo de Meshy lleva en la mano la espada que le presta el soldado «galo», así que en el motor llevan
   'espada_gala'), frente con frente a SEP m: escudo contra escudo, a distancia de umbo. Motor real: Combate.paso.
   CB2b: con física real (js/fisica-batalla.js, crearFisica, como gobierno/maquetas/bloque/fisica.js). Cada hombre tiene un
   cuerpo { x, z (su sitio de las reglas), fx, fz (lo que lo aparta la física) }. En cada paso: el motor lucha con las
   posiciones ya corregidas (h.x = sitio + apartado); si el motor recoloca a alguien (relevo), se mueve su sitio; luego la
   física separa (rivales ≥ RIVAL m centro a centro, amigos ≥ MIN_DIST) y h.x, h.z quedan otra vez corregidos: lo que se
   dibuja y lo que el motor lee en el paso siguiente. Los caídos quedan tendidos de espaldas (estorbo fijo). */
import * as Combate from '../../../js/combate.js';
import { crearFisica, MIN_DIST } from '../../../js/fisica-batalla.js';
export const DT = 1 / 30, SEP = 0.95, RIVAL = 0.95;
const TENDIDO = 1.5, CAE_T = 1.1, R_CAIDO = 0.3;
const ahora = () => (typeof performance !== 'undefined' ? performance : Date).now();
export function montar(semilla = 1, fisica = true) {
  const A = Combate.crearManipulo({ id: 'A', bando: 'a', linea: 'hastati', filas: 2, frente: 4, x: 0, z: SEP / 2, yaw: 0, arma: 'gladius', escudo: 'scutum', semilla: semilla * 3 });
  const G = Combate.crearManipulo({ id: 'G', bando: 'b', linea: 'galos', filas: 2, frente: 4, x: 0, z: -SEP / 2, yaw: Math.PI, arma: 'espada_gala', escudo: 'thureos', semilla: semilla * 3 + 1 });
  const hombres = [...A.hombres, ...G.hombres];
  const Fi = fisica ? crearFisica({ caidoFijo: true, parMax: RIVAL, parMin: (a, b) => a.bando !== b.bando ? RIVAL : undefined, parRival: RIVAL }) : null;
  const cu = new Map(), SF = { fal: [], ene: [], giro: A.yaw || 0 };
  for (const h of hombres) {
    const c = { x: h.x, z: h.z, fx: 0, fz: 0, vx: 0, vz: 0, ux: 0, uz: 0, yaw: h.yaw, vivo: true, huye: false, salta: false, f: h.col, r: h.fila,
      bando: h.bando, tipo: 'infante', guardia: null, tendido: null, kB: 0, tCae: 0, h };
    cu.set(h, c); (h.bando === 'a' ? SF.fal : SF.ene).push(c);
  }
  return { A, G, hombres, rnd: Combate.crearAzar(semilla), t: 0, log: [], Fi, cu, SF, ms: { motor: 0, fisica: 0, n: 0 } };
}
/* un paso de DT: motor (con lo corregido) y física. ev: lista donde dejar los eventos (se vacía) */
export function paso1(S, ev = []) {
  ev.length = 0;
  const px = S.hombres.map(h => h.x), pz = S.hombres.map(h => h.z), t0 = ahora();
  Combate.paso(S.hombres, DT, { rnd: S.rnd, eventos: ev }); S.t += DT;
  const t1 = ahora();
  if (S.Fi) {
    S.hombres.forEach((h, i) => {
      const c = S.cu.get(h);
      c.x += h.x - px[i]; c.z += h.z - pz[i];   /* lo que el motor haya movido (relevo, avance): se mueve el sitio */
      c.yaw = h.yaw;
      if (!h.vivo && c.vivo) { c.vivo = false; c.tendido = { dx: -Math.sin(h.yaw), dz: Math.cos(h.yaw), largo: 0, r: R_CAIDO }; c.vx = c.vz = 0; c.tCae = 0; }
      if (c.tendido && c.tCae < CAE_T) { c.tCae += DT; const u = Math.min(1, c.tCae / CAE_T); c.tendido.largo = TENDIDO * u * u * (3 - 2 * u); }
    });
    S.Fi.paso(S.SF, DT);
    for (const h of S.hombres) { const c = S.cu.get(h); h.x = c.x + c.fx; h.z = c.z + c.fz; }
  }
  S.ms.motor += t1 - t0; S.ms.fisica += ahora() - t1; S.ms.n++;
  for (const e of ev) S.log.push({ t: +S.t.toFixed(3), tipo: e.tipo, de: e.de, a: e.a, en: e.en });
  return ev;
}
/* avanza la pelea hasta «hasta» segundos */
export function avanzar(S, hasta) { const ev = []; while (S.t < hasta - 1e-9) paso1(S, ev); return S; }
/* la menor distancia (m, centro a centro, vivos) entre rivales y entre amigos, ahora */
export function distancias(S) {
  let rival = Infinity, amigo = Infinity; const V = S.hombres.filter(h => h.vivo);
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
    const d = Math.hypot(V[i].x - V[j].x, V[i].z - V[j].z);
    if (V[i].bando !== V[j].bando) rival = Math.min(rival, d); else amigo = Math.min(amigo, d);
  }
  return { rival, amigo };
}
export const VARAS = { rival: RIVAL, amigo: MIN_DIST };
