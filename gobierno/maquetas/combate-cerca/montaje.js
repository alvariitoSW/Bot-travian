/* AQVILA — CB2: el choque de la maqueta «Combate de cerca», sin pantalla. Lo usan la maqueta y gobierno/captura-combate-cb2.mjs
   (que busca en los eventos los momentos de cada captura). 4×2 hastati (gladius y scutum) contra 4×2 galos (espada larga y
   escudo oval; su modelo de 0 A.D. lleva lanza, así que en el motor llevan 'hasta' para que lo dibujado cuadre), frente con frente a SEP m: escudo contra escudo, a distancia de umbo. Motor real: Combate.paso. */
import * as Combate from '../../../js/combate.js';
export const DT = 1 / 30, SEP = 0.95;
export function montar(semilla = 1) {
  const A = Combate.crearManipulo({ id: 'A', bando: 'a', linea: 'hastati', filas: 2, frente: 4, x: 0, z: SEP / 2, yaw: 0, arma: 'gladius', escudo: 'scutum', semilla: semilla * 3 });
  const G = Combate.crearManipulo({ id: 'G', bando: 'b', linea: 'galos', filas: 2, frente: 4, x: 0, z: -SEP / 2, yaw: Math.PI, arma: 'hasta', escudo: 'thureos', semilla: semilla * 3 + 1 });
  return { A, G, hombres: [...A.hombres, ...G.hombres], rnd: Combate.crearAzar(semilla), t: 0, log: [] };
}
/* avanza la pelea hasta «hasta» segundos; guarda cada evento con su t */
export function avanzar(S, hasta) {
  const ev = [];
  while (S.t < hasta - 1e-9) {
    ev.length = 0; Combate.paso(S.hombres, DT, { rnd: S.rnd, eventos: ev }); S.t += DT;
    for (const e of ev) S.log.push({ t: +S.t.toFixed(3), tipo: e.tipo, de: e.de, a: e.a, en: e.en });
  }
  return S;
}
