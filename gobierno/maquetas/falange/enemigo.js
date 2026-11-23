/* Pieza «enemigo» (TP7a): el manípulo romano que ataca a la falange (hastati de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Sin pantalla: corre en Node.
   · filasRomano: qué dos filas de su tabla le tocan (quieto, andar, correr fundidos), o la de golpear o caer.
   · conMezcla: cambia el sombreador de figuras para que mezcle dos filas.
   Antes fueron los galos del testudo, con el mismo contrato. */
import { filasMarcha } from './soldado.js';
/* FA4: los hombres del rival los crea y mueve js/falange-rivales.js; aquí queda solo el dibujo */
export function filasRomano(h, fig, T, frameOf, frameOnce) {
  const C = fig.C;
  if (!h.vivo) { h.A = h.B = frameOnce(C.death, Math.max(0, T - h.muere)); h.mx = 0; h.pitch = 0; return; }
  if (T - h.tAtk < C.attack_melee.dur) { h.A = h.B = frameOnce(C.attack_melee, T - h.tAtk); h.mx = 0; h.pitch = 0; return; }
  [h.A, h.B, h.mx] = filasMarcha(fig, h.paso, T + h.fase, frameOf);
  /* el clip de correr va tieso: al correr, el hombre entero se inclina; al recibir un golpe, se echa atrás */
  h.pitch = 0.16 * h.paso.inclina - 0.25 * Math.max(0, 1 - (T - h.tRecibe) / 0.4);
}
export function conMezcla(vs) {
  return vs.replace('attribute float aFrame;', 'attribute float aFrame;\nattribute float aFrame2;\nattribute float aMix;')
    .replace(/(mat4 boneM\(float slot, int row\)[^}]*\}\n?)/, '$1\nmat4 boneG(float s) { mat4 m = boneM(s, int(aFrame + 0.5)); if (aMix > 0.001) m = m * (1.0 - aMix) + boneM(s, int(aFrame2 + 0.5)) * aMix; return m; }\n')
    .replace(/boneM\((aSkinI\.[xyzw]), row\)/g, 'boneG($1)');
}
