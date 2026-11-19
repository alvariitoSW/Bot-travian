/* Pieza «locomoción»: andar y correr de cada hombre (romano o galo). Sin pantalla: corre en Node.
   Lo que resuelve (queja del usuario: «la marcha y el correr sobre todo hay que mejorarlo»):
   · los pies no patinan: la fase del paso avanza por la DISTANCIA que recorre el hombre dividida por la zancada del clip
     (la mide zancadas() de js/gfx/units.js), no por el tiempo;
   · cada uno lleva su velocidad, con aceleración y frenada, y su retraso al arrancar (la fila de delante antes);
   · los cambios entre quieto, andar y correr se funden en 0,3 s con un solo número «g» (0 quieto, 1 andar, 2 correr):
     se mezclan dos filas de la tabla de huesos (A, B y la mezcla), con la misma fase de pierna en las dos;
   · al parar, acaba el paso que lleva y se asienta en los dos pies.
   Contrato: crearPaso({ zW, zR, fase, retraso }) → p; velocidad(p, vObjetivo, dt, T) → p.v; pisa(p, d, dt) avanza la
   fase por d metros; mezcla(p) → { a, b, mx } con a y b en 'quieto' | 'anda' | 'corre'. Dispersión: dispersion(fases). */
export const MARCHA = {
  V_ANDA: 2.6,      /* hasta aquí, andar (m/s, en la escala de las figuras) */
  V_CORRE: 3.7,     /* desde aquí, correr del todo; entre medias, se funden */
  ACEL: 1.9, ACEL_CORRE: 3.2, FRENA: 2.8,   /* m/s² */
  FUNDIDO: 0.3,     /* segundos para pasar de un modo al siguiente */
};
const lim = (x, a, b) => Math.max(a, Math.min(b, x));
export function crearPaso({ zW, zR, fase = 0, retraso = 0, prisa = 1 }) {
  return { zW, zR, fase, ciclos: fase, retraso, prisa, v: 0, vReal: 0, g: 0, acel: 0, quieto: 0, inclina: 0 };
}
/* acelera o frena hacia la velocidad que le toca, sin cambios de golpe. «prisa» da a cada uno su poco de genio */
export function velocidad(p, vObj, dt) {
  const sube = vObj > p.v, a = sube ? (vObj > MARCHA.V_ANDA ? MARCHA.ACEL_CORRE : MARCHA.ACEL) * p.prisa : MARCHA.FRENA;
  const v0 = p.v; p.v += lim(vObj - p.v, -a * dt, a * dt); p.acel = dt > 0 ? (p.v - v0) / dt : 0;
  return p.v;
}
/* zancada del modo de ahora (metros por ciclo de dos pasos) */
export const zancada = p => p.g <= 1 ? p.zW : p.zW + (p.zR - p.zW) * (p.g - 1);
/* el hombre ha avanzado d metros en dt segundos: la pierna avanza lo mismo, y el modo se va fundiendo hacia el que pide su velocidad */
export function pisa(p, d, dt) {
  const vr = dt > 0 ? d / dt : 0; p.vReal += (vr - p.vReal) * Math.min(1, dt * 12);
  const v = p.vReal, meta = v < 0.12 ? 0 : v <= MARCHA.V_ANDA ? 1 : Math.min(2, 1 + (v - MARCHA.V_ANDA) / (MARCHA.V_CORRE - MARCHA.V_ANDA));
  const paso = dt / MARCHA.FUNDIDO;
  if (meta > 0 || p.g > 1) p.g += lim(Math.max(meta, p.g > 1 ? 1 : 0) - p.g, -paso, paso);
  else if (p.g > 0) {
    /* parando: el último paso se acaba y se asienta cuando los dos pies están en el suelo (fase 0 o 0,5) */
    const enDos = Math.abs(((p.ciclos * 2) % 1) - 0.5) > 0.38;
    p.quieto += dt; if (enDos || p.quieto > 0.45) p.g = Math.max(0, p.g - paso);
  }
  if (meta > 0) p.quieto = 0;
  if (d > 0 && p.g > 0) { const z = zancada(p); p.ciclos += d / z; p.fase = ((p.ciclos % 1) + 1) % 1; }
  /* al correr se inclina; al arrancar fuerte, algo más; al frenar, se echa atrás */
  const inc = lim(p.g - 1, 0, 1) + lim(p.acel / 6, -0.25, 0.3);
  p.inclina += (inc - p.inclina) * Math.min(1, dt * 6);
  return p;
}
/* las dos filas que se mezclan y cuánto: g entre 0 y 1 funde quieto con andar; entre 1 y 2, andar con correr */
export function mezcla(p) {
  const g = lim(p.g, 0, 2);
  if (g <= 0.001) return { a: 'quieto', b: 'quieto', mx: 0, fase: p.fase };
  if (g < 1) return { a: 'quieto', b: 'anda', mx: g, fase: p.fase };
  if (g < 1.001) return { a: 'anda', b: 'anda', mx: 0, fase: p.fase };
  if (g > 1.995) return { a: 'corre', b: 'corre', mx: 0, fase: p.fase };
  return { a: 'anda', b: 'corre', mx: g - 1, fase: p.fase };
}
/* cuánto se separan las fases de unos hombres (0: todos a la vez; 1: repartidas del todo). Estadística circular */
export function dispersion(fases) {
  if (!fases.length) return 0; let c = 0, s = 0;
  for (const f of fases) { c += Math.cos(f * 2 * Math.PI); s += Math.sin(f * 2 * Math.PI); }
  return +(1 - Math.hypot(c, s) / fases.length).toFixed(3);
}
