/* Pieza «enemigo»: los galos (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0). Sin pantalla: corre en Node.
   · creaGalos: dos filas de 8, cada uno con su sitio, su salida y su paso propio (locomocion.js). TP8b-L3: y «reserva»
     galos más, guardados (reserva: true, no se dibujan): son los refuerzos que la lucha (acciones.js) trae corriendo del fondo.
   · marchaGalos: esperan, gritan y se vienen; a 9 m, a la carrera. Cada uno acelera y frena a su aire (nada de golpe),
     y la pierna avanza por lo que recorre: los pies pisan.
   · filasGalo: qué dos filas de su tabla le tocan (quieto, andar, correr fundidos) o la de caer.
   · conMezcla: cambia el sombreador de figuras de js/gfx/units.js para que mezcle dos filas (como el de los romanos).
   Después: otros pueblos, con el mismo contrato. */
import { crearPaso, velocidad, pisa } from './locomocion.js';
import { filasMarcha } from './soldado.js';
/* TP8b-E2: ancho = galos por fila (8 con el manípulo de antes; 14 con la centuria). La reserva ya no se esconde: espera en
   masa detrás, en filas al tresbolillo, sigue a los suyos al paso y se para a unos 8 m de la lucha. De ahí salen los refuerzos */
export function creaGalos(azar, azarP, Z_GALOS, zancadas, reserva = 0, ancho = 8) {
  const G = [], NF = 2 * ancho;
  for (let i = 0; i < NF; i++) {
    const fila = Math.floor(i / ancho);
    G.push({ i, x: ((i % ancho) - (ancho - 1) / 2) * 1.25 + (azar() - 0.5) * 0.3, z: Z_GALOS - fila * 1.6 + (azar() - 0.5) * 0.4, vivo: true, muere: 0, fila, fase: azar() * 3, v: 0, dist: (i * 1.37) % 3,
      sale: ((i * 7) % 5) * 0.1 + fila * 0.25, marcado: false, frena: -9, fr: 0, A: 0, B: 0, mx: 0, pitch: 0, porPila: false, camino: 0, off: 0, golpes: 0,
      /* cada galo, su genio: unos salen con más prisa y corren algo más (±8 %); y su talla (±4 %), y con ella su zancada */
      vMas: 0.92 + azarP() * 0.16, esc: 0.96 + azarP() * 0.08 });
    const g = G[i]; g.paso = crearPaso({ zW: zancadas.walk * g.esc, zR: zancadas.run * g.esc, fase: azarP(), prisa: 0.8 + azarP() * 0.4 });
  }
  /* los de reserva no gastan azar: así la escena de siempre sale igual */
  for (let k = 0; k < reserva; k++) {
    const i = NF + k, fila = 2 + Math.floor(k / ancho), a = ((k * 7919) % 1000) / 1000, b = ((k * 4241) % 997) / 997;
    G.push({ i, x: ((k % ancho) - (ancho - 1) / 2) * 1.25 + (fila % 2 ? 0.62 : 0) + (a - 0.5) * 0.5, z: Z_GALOS - fila * 1.5 + (b - 0.5) * 0.6, vivo: false, reserva: true, muere: 0, fila, fase: (k * 0.73) % 3, v: 0, dist: 0, sale: 0.5 + fila * 0.2 + a * 0.3, marcado: false, frena: -9, fr: 0, A: 0, B: 0, mx: 0, pitch: 0, porPila: false, camino: 0, off: 0, golpes: 0, vMas: 0.92 + b * 0.12, esc: 0.96 + a * 0.08 });
    const g = G[i]; g.paso = crearPaso({ zW: zancadas.walk * g.esc, zR: zancadas.run * g.esc, fase: (k * 0.37) % 1, prisa: 1 });
  }
  return G;
}
/* vf: velocidad de la carrera de ahora (al paso vivo o corriendo); parados en el choque */
export function marchaGalos(S, dt, T, vf) {
  if (S.choque) return;   /* en la lucha los mueve acciones.js */
  for (const g of S.galos) {
    let d;
    if (!g.vivo && !g.reserva) { g.v *= Math.max(0, 1 - dt * 5); d = g.v * dt; }
    else {
      let meta = S.choque || S.tGalos < 0 || T < S.tGalos + g.sale ? 0 : T - g.frena < 0.5 ? vf * 0.15 : vf * g.vMas;
      /* la reserva va detrás y frena al llegar a su sitio, a unos 8 m del frente romano */
      if (g.reserva) meta = Math.min(meta, Math.max(0, (S.zF - 8 - (g.fila - 2) * 1.5 - g.z) * 1.2));
      g.v = velocidad(g.paso, meta, dt); d = g.v * dt;
    }
    g.z += d; g.dist += d; pisa(g.paso, d, dt);
  }
}
export function filasGalo(g, fig, T, frameOf, frameOnce) {
  const CG = fig.C;
  if (!g.vivo) { g.A = g.B = frameOnce(CG.death, Math.max(0, T - g.muere)); g.mx = 0; g.pitch = 0; return; }
  [g.A, g.B, g.mx] = filasMarcha(fig, g.paso, T + g.fase, frameOf);
  /* el clip de correr de 0 A.D. va tieso: al correr, el galo entero se inclina hacia delante (gira sobre los pies) */
  g.pitch = 0.16 * g.paso.inclina;
}
export function conMezcla(vs) {
  return vs.replace('attribute float aFrame;', 'attribute float aFrame;\nattribute float aFrame2;\nattribute float aMix;')
    .replace(/(mat4 boneM\(float slot, int row\)[^}]*\}\n?)/, '$1\nmat4 boneG(float s) { mat4 m = boneM(s, int(aFrame + 0.5)); if (aMix > 0.001) m = m * (1.0 - aMix) + boneM(s, int(aFrame2 + 0.5)) * aMix; return m; }\n')
    .replace(/boneM\((aSkinI\.[xyzw]), row\)/g, 'boneG($1)');
}
