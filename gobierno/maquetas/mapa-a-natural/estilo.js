/* AQVILA · AM1 — maqueta A «Relieve natural»: Grecia como se vería desde el aire, con el relieve de verdad,
   campos, bosques, mar que se mueve, sombras de nube, ciudades con sus casas y templo, barcos y rebaños. */
import { pagina } from '../mapa-comun/pagina.js';
import { mix, paso, clamp, ruido, fbm, hash } from '../mapa-comun/motor.js';

const PARCELAS = [[204, 182, 104], [156, 164, 86], [188, 156, 96], [172, 176, 104], [214, 190, 96]];
function pintar(o, p) {
  const n1 = fbm(p.x * 0.012, p.y * 0.012, 4), n2 = fbm(p.x * 0.06 + 40, p.y * 0.06, 3), n3 = ruido(p.x * 0.37, p.y * 0.37);
  if (p.h <= 0) { const d = clamp(-p.h / 110, 0, 1); o[0] = mix(214, 52, d); o[1] = mix(202, 92, d); o[2] = mix(160, 112, d); return; }
  if (p.lago) { const f = 0.9 + n3 * 0.15; o[0] = 66 * f; o[1] = 118 * f; o[2] = 134 * f; return; }
  const t = paso(0.36, 0.64, n1); let r = mix(182, 122, t), g = mix(168, 142, t), b = mix(108, 78, t);
  const llano = 1 - paso(0.02, 0.07, p.pend), bajo = 1 - paso(200, 460, p.h), campos = llano * bajo * (0.5 + 0.5 * p.zw.grano);
  if (campos > 0.02) { const u = p.x * 0.94 + p.y * 0.34, v = p.y * 0.94 - p.x * 0.34, c = PARCELAS[(hash(Math.floor(u / 6), Math.floor(v / 4)) * 5) | 0], w = campos * 0.8, oro = p.zw.grano * 0.5;
    r = mix(r, mix(c[0], 222, oro), w); g = mix(g, mix(c[1], 190, oro), w); b = mix(b, mix(c[2], 92, oro), w);
    const linde = (((u % 6) + 6) % 6 < 0.7 || ((v % 4) + 4) % 4 < 0.6) ? 0.88 : 1; r *= mix(1, linde, w); g *= mix(1, linde, w); b *= mix(1, linde, w); }
  let bos = paso(260, 650, p.h) * (1 - paso(1500, 1900, p.h)) * paso(0.36, 0.6, n2 * 0.6 + n1 * 0.4); bos = Math.max(bos, p.zw.madera * paso(60, 220, p.h) * 0.92);
  if (bos > 0) { const f = 0.82 + n3 * 0.36; r = mix(r, 58 * f, bos); g = mix(g, 86 * f, bos); b = mix(b, 48 * f, bos); }
  const roca = paso(0.26, 0.55, p.pend) * 0.8; r = mix(r, 162, roca); g = mix(g, 148, roca); b = mix(b, 124, roca);
  const alta = paso(1500, 2000, p.h); r = mix(r, 152, alta); g = mix(g, 148, alta); b = mix(b, 140, alta);
  const nieve = paso(2050, 2450, p.h + n2 * 320); r = mix(r, 240, nieve); g = mix(g, 242, nieve); b = mix(b, 246, nieve);
  const playa = (1 - paso(0.5, 1.7, p.costa)) * (1 - paso(15, 45, p.h)); r = mix(r, 226, playa); g = mix(g, 210, playa); b = mix(b, 164, playa);
  const cant = p.zw.piedra * paso(0.5, 0.7, n2 * 0.7 + n3 * 0.3); r = mix(r, 232, cant); g = mix(g, 228, cant); b = mix(b, 216, cant);
  const mina = p.zw.hierro * paso(0.52, 0.7, n2 * 0.6 + n3 * 0.4) * 0.85; r = mix(r, 128, mina); g = mix(g, 78, mina); b = mix(b, 58, mina);
  const f = 0.42 + 0.98 * p.luz; o[0] = Math.min(255, r * f); o[1] = Math.min(255, g * f); o[2] = Math.min(255, b * mix(f, 1, 0.18));
}
function dibujar(g, ay) {
  g.lineCap = g.lineJoin = 'round';
  for (const r of ay.rios) for (const l of r.l) { g.strokeStyle = 'rgba(40,84,100,.55)'; g.lineWidth = 2.6; ay.linea(l); g.strokeStyle = 'rgba(96,160,184,.95)'; g.lineWidth = 1.3; ay.linea(l); }
  for (const c of ay.caminos) { g.strokeStyle = 'rgba(90,70,44,.5)'; g.lineWidth = 2.4; ay.linea(c); g.strokeStyle = 'rgba(236,216,168,.95)'; g.lineWidth = 1.2; ay.linea(c); }
}
pagina({ clase: 'piel-a', titulo: 'A · Relieve natural', lema: 'Grecia desde el aire: relieve real, mar vivo, ciudades y barcos.',
  relieve: 7.5, fuerzaSombra: 3.4, niebla: '#b4c3cd', nubes: 0.3, nubesAltas: 0.5, detalle: 0.17, malla: 400, lienzo: 1800,
  mar: { costa: '#54b9b2', hondo: '#15426d', brillo: '#fff2c8', fuerzaBrillo: 0.28, fuerzaEspuma: 0.85, alfaCosta: 0.5 },
  arboles: { cuantos: 5200, radio: 0.06, alto: 0.17, colores: ['#3d5c34', '#476a3a', '#35502e', '#557240'] },
  rebanos: true, pintar, dibujar });
