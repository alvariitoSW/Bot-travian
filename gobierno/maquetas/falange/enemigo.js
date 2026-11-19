/* Pieza «enemigo» (TP7a): el manípulo romano que ataca a la falange (hastati de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Sin pantalla: corre en Node.
   · creaRomanos: el manípulo en filas de 12, cada uno con su columna, su paso propio (locomocion.js), su talla y su genio.
   · filasRomano: qué dos filas de su tabla le tocan (quieto, andar, correr fundidos), o la de golpear o caer.
   · conMezcla: cambia el sombreador de figuras para que mezcle dos filas.
   Antes fueron los galos del testudo, con el mismo contrato. */
import { crearPaso } from './locomocion.js';
import { filasMarcha } from './soldado.js';
import { FILES, HOMBRES } from './formacion.js';
/* TP8b-E1: el manípulo entero, tantas columnas como la falange y el fondo que salga (8 filas con 96) */
export const COLS_R = FILES, FILAS_R = Math.max(2, Math.round(HOMBRES / COLS_R)), N_R = COLS_R * FILAS_R, DX_R = 0.85, DZ_R = 1.4;
export const REF_R = 3 * COLS_R;   /* las 3 filas de antes: cada baja pesa en el ánimo como entonces */
export function creaRomanos(azar, azarP, zancadas) {
  const R = [];
  for (let i = 0; i < N_R; i++) {
    const c = i % COLS_R, r = Math.floor(i / COLS_R), esc = 0.96 + azarP() * 0.08;
    R.push({ i, c, r, x: (c - (COLS_R - 1) / 2) * DX_R + (azar() - 0.5) * 0.25, z: 0, jz: (azar() - 0.5) * 0.35, yaw: 0, vivo: true, muere: 0, est: 'marcha',
      fase: azar() * 3, vMas: 0.92 + azarP() * 0.16, esc, pilum: r <= 1, intento: 0, tAtk: -9, tRecibe: -9, heridas: 0, A: 0, B: 0, mx: 0, pitch: 0,
      paso: crearPaso({ zW: zancadas.walk * esc, zR: zancadas.run * esc, fase: azarP(), prisa: 0.8 + azarP() * 0.4 }) });
  }
  return R;
}
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
