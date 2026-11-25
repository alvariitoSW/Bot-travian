/* AQVILA · AM1 — maqueta C «Tablero de juego»: Grecia como una maqueta de mesa, de colores limpios y relieve marcado.
   Cada comarca de recurso va teñida de su color y lleva su ficha; las polis van sobre peanas con su color. Se lee de un vistazo. */
import { pagina } from '../mapa-comun/pagina.js';
import { mix, paso, clamp, ruido, fbm, hash } from '../mapa-comun/motor.js';
import { ZONAS, BASICOS } from '../mapa-comun/datos.js';

const ZC = { grano: [232, 190, 70], madera: [52, 112, 62], piedra: [214, 212, 204], hierro: [122, 110, 128] };
function pintar(o, p) {
  let r, g, b; const n = fbm(p.x * 0.02, p.y * 0.02, 3);
  if (p.h <= 0) { const d = clamp(-p.h / 160, 0, 1); o[0] = mix(150, 30, d); o[1] = mix(214, 110, d); o[2] = mix(200, 150, d); return; }
  if (p.lago) { o[0] = 70; o[1] = 160; o[2] = 190; return; }
  const h = p.h + (n - 0.5) * 90;
  if (h < 140) { r = 168; g = 196; b = 96; } else if (h < 480) { r = 132; g = 172; b = 84; } else if (h < 1000) { r = 104; g = 142; b = 76; } else if (h < 1700) { r = 166; g = 146; b = 112; } else if (h < 2200) { r = 188; g = 180; b = 168; } else { r = 246; g = 246; b = 244; }
  const llano = (1 - paso(0.02, 0.06, p.pend)) * (1 - paso(160, 380, p.h));
  if (llano > 0.3) { const c = hash(Math.floor((p.x + p.y * 0.4) / 9), Math.floor((p.y - p.x * 0.4) / 6)); if (c > 0.45) { r = mix(r, 216, 0.55); g = mix(g, 204, 0.55); b = mix(b, 108, 0.55); } }
  for (const k in ZC) { const w = p.zw[k]; if (w > 0) { const f = paso(0, 0.25, w) * 0.72, c = ZC[k]; r = mix(r, c[0], f); g = mix(g, c[1], f); b = mix(b, c[2], f); if (w > 0.02 && w < 0.16) { r *= 0.62; g *= 0.62; b *= 0.62; } } }
  if (p.costa < 1.5 && p.h < 40) { r = 244; g = 228; b = 170; }
  const q = p.luz < 0.42 ? 0.7 : p.luz < 0.6 ? 0.88 : p.luz < 0.78 ? 1.0 : 1.12; o[0] = Math.min(255, r * q); o[1] = Math.min(255, g * q); o[2] = Math.min(255, b * q);
  if (Math.abs(p.costa) < 0.45) { o[0] *= 0.55; o[1] *= 0.5; o[2] *= 0.45; }
}
function dibujar(g, ay) {
  g.lineCap = g.lineJoin = 'round';
  for (const r of ay.rios) for (const l of r.l) { g.strokeStyle = '#2f86a8'; g.lineWidth = 2.2; ay.linea(l); }
  for (const c of ay.caminos) { g.strokeStyle = '#5a3d22'; g.lineWidth = 3.4; ay.linea(c); g.strokeStyle = '#f6e7b8'; g.lineWidth = 1.8; g.setLineDash([4, 3]); ay.linea(c); g.setLineDash([]); }
}
/* fichas de recurso: discos de color clavados en su comarca, como piezas de un juego de mesa */
function extra(m) {
  const T = m.THREE;
  for (const z of ZONAS) { const g = new T.Group(), c = BASICOS[z.t].color; g.position.set(m.X(z.lon), m.yLL(z.lon, z.lat), m.Z(z.lat));
    const palo = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.5, 6).translate(0, 0.25, 0), new T.MeshLambertMaterial({ color: '#3a2a1c' })), disco = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.09, 20).translate(0, 0.52, 0), new T.MeshLambertMaterial({ color: c })), aro = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.05, 20).translate(0, 0.5, 0), new T.MeshLambertMaterial({ color: '#fbf3dc' }));
    g.add(palo, aro, disco); m.escena.add(g); m.escalables.push({ o: g, k: 0.9 }); }
}
pagina({ clase: 'piel-c', titulo: 'C · Tablero de juego', lema: 'Como una maqueta de mesa: colores limpios y fichas claras.',
  relieve: 11, fuerzaSombra: 3.6, niebla: '#2c2118', nubes: 0.14, nubesAltas: 0.0, detalle: 0.05, facetas: 0.5, malla: 200, lienzo: 1800, detalleRelieve: 0.3, inclinaCerca: 0.8, inclinaLejos: 1.0,
  mar: { costa: '#6fd6c4', hondo: '#1f6f9c', fuerzaBrillo: 0.15, fuerzaEspuma: 1, alfaCosta: 0.75, ondas: 0.5, espumaDura: 1 },
  arboles: { cuantos: 1700, radio: 0.13, alto: 0.34, colores: ['#2f6a3a', '#3b7d44', '#28583a'] }, rebanos: true, peana: true, tamCiudad: 34, alzaEtiqueta: 1.35, pintar, dibujar, extra });
