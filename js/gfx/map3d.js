/* AQVILA — mapa de campaña en 3D: relieve del Mediterráneo, ciudades, rutas y ejércitos en marcha */
import { THREE, uTime, unitGeometry, unitMaterial } from './models.js';
import { staticMesh, getStatic, CULTURA, staticInstancedVacio } from './statics.js';
import COSTA from '../../assets/mapa/costa.js';
import { mapaMaterial, mapaTexturas, texturaRuido } from './ground.js';
import ALTURAS from '../../assets/mapa/alturas.js';
import AGUA from '../../assets/mapa/agua.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf, UNIT_SCALE } from './units.js';

const D = window.DATA, G = window.Game;
const MARE_DIST = 130;   // C6: distancia de Mare Nostrum de reserva (C8: la real se calcula según la pantalla en ajustarMare)
/* C15 · cámara con horizonte: de cerca la cámara va baja (unos 20° en vertical, 13° en horizontal) y deja ver el mar y los montes a lo lejos, con cielo y bruma; al alejar
   se endereza poco a poco hasta la vista de carta de siempre (70°), a la que llega a 115 de distancia (Mare Nostrum no cambia). */
// b (this.pitchBajo) se ajusta a la pantalla en resize(): la mirada más alta queda unos 5° sobre el horizonte, en vertical y en horizontal
const pitchDe = (d, b) => b + ss(30, 115, d) * (1.22 - b);   // inclinación de la cámara según la distancia
const horizonte = d => 1 - ss(55, 112, d);           // C15: 1 = cámara baja con cielo y bruma clara; 0 = vista de carta
const K = 0.1;                                   // mundo 2D (D.proj) -> unidades 3D
/* C9 · marco del mundo: lon -10..37,24 y lat 27,93..51,5 (Hispania y Galia enteras, Egipto con el delta y Asia Menor), con las mismas
   casillas que el mapa antiguo (32/420 ° de longitud y 12,5/210 ° de latitud). Las coordenadas del juego (D.proj, partidas guardadas)
   no cambian: el marco empieza en x, z negativos (OX, OZ). El núcleo jugable de antes (lon -7..25, lat 34,5..47) es x 0..160, z 0..80. */
const LON0 = -10, LAT1 = 51.5, NX = 620, NZ = 396, DLON = 32 / 420, DLAT = 12.5 / 210, LON1 = LON0 + NX * DLON, LAT0 = LAT1 - NZ * DLAT;
const CW = DLON * 50 * K, CH = DLAT * 64 * K, OX = (LON0 + 7) * 50 * K, OZ = (47 - LAT1) * 64 * K, ANCHO = NX * CW, ALTO = NZ * CH;
const TROZO = 124;                               // C9: el terreno va en trozos de 124×124 casillas con tres niveles de detalle (THREE.LOD)
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* relieve: alturas reales (assets/mapa/alturas.js, misma malla que el mapa) a ESCALA_V unidades por metro; sin árboles sobre ARBOL_MAX m */
const ESCALA_V = 0.0008, ARBOL_MAX = 1800;
/* realce local de dos cumbres que la malla de alturas aplana (Etna 3330 m reales frente a 2630 en los datos; Olimpo 2917 frente a 2305): factor f en el pico, que baja hasta 1 a r grados. Licencia de juego para que se lean con roca y nieve */
const PICOS_REALCE = [{ lo: 15.0, la: 37.75, r: 0.55, f: 1.4 }, { lo: 22.35, la: 40.09, r: 0.55, f: 1.4 }];
const realce = (lo, la) => { let f = 1; for (const p of PICOS_REALCE) { const t = 1 - Math.hypot(lo - p.lo, la - p.la) / p.r; if (t > 0) f = Math.max(f, 1 + (p.f - 1) * t * t * (3 - 2 * t)); } return f; };
/* C4 — ríos y lagos (assets/mapa/agua.js, Natural Earth) horneados en una máscara de 8 bits a DOBLE resolución, igual que la del mar:
   255 = agua, ~60 = ribera (franja de barro y verde junto al río), 0 = nada. El sombreador del terreno la pinta y el relieve la usa para
   bajar el cauce y aplanar los lagos; no añade triángulos. Se dibuja en un lienzo (trazos con borde suave) y se lee una sola vez. */
const AW = 2 * NX + 1, AH = 2 * NZ + 1;
const puntoEn = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
/* C4 — terreno variado sin triángulos: pesos 0..1 de llanura padana, estepa, desierto y marisma en un punto (lon, lat, metros, distancia a la costa en casillas).
   Cajas con borde suave, hechas a ojo sobre la geografía real; solo cambian el color y la textura de vértice. */
const sbx = (x, a, b, f) => { const u = Math.max(0, Math.min(1, (x - (a - f)) / f)), v = Math.max(0, Math.min(1, (x - b) / f)); return u * u * (3 - 2 * u) * (1 - v * v * (3 - 2 * v)); };
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const MARISMAS = [[12.3, 44.95, 0.3], [4.55, 43.5, 0.32], [0.75, 40.7, 0.22], [-6.3, 37.0, 0.42], [12.95, 41.4, 0.3], [31.95, 31.25, 0.4], [30.8, 31.45, 0.35], [29.95, 31.15, 0.18]];   // C9: Manzala, Burullus y Mareotis
/* C9 · Egipto: el valle del Nilo es una franja verde en el desierto y el delta un abanico verde con marismas. NILO: tramos del río
   (assets/mapa/agua.js) al sur de lat 31,7; DELTA: abanico a ojo entre Menfis, Alejandría y Pelusio. */
const NILO = []; for (const r of AGUA.rios) if (r.n === 'Nilo') for (const l of r.l) for (let q = 0; q + 1 < l.length; q++) NILO.push([l[q][0], l[q][1], l[q + 1][0], l[q + 1][1]]);
const DELTA = [[31.2, 30.0], [30.9, 30.15], [30.25, 30.75], [29.85, 31.2], [30.4, 31.5], [31.1, 31.6], [31.8, 31.55], [32.3, 31.28], [32.05, 30.9], [31.55, 30.35]];
function vegaNilo(lo, la) {
  if (lo < 29.6 || lo > 32.6 || la > 31.7) return 0;
  if (puntoEn(lo, la, DELTA)) return 1;
  let m = 9; for (const g of NILO) { const dx = g[2] - g[0], dy = g[3] - g[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((lo - g[0]) * dx + (la - g[1]) * dy) / l)) : 0; m = Math.min(m, Math.hypot(lo - g[0] - dx * t, la - g[1] - dy * t)); }
  return 1 - ss(0.07, 0.2, m);
}
function bioma(lo, la, met, d) {
  const baja = 1 - ss(150, 450, met), pad = sbx(lo, 7.6, 12.6, 0.6) * sbx(la, 44.55, 45.7, 0.35) * baja;
  const est = Math.max(sbx(lo, -6.3, -1.0, 0.9) * sbx(la, 38.5, 42.3, 0.8) * ss(250, 550, met), sbx(lo, -2.2, 0.5, 0.5) * sbx(la, 41.0, 42.2, 0.4) * 0.8, sbx(lo, 16.3, 25, 0.9) * sbx(la, 44.0, 47, 0.7) * (1 - ss(250, 500, met)) * 0.9,
    sbx(lo, 30.5, 36.5, 0.8) * sbx(la, 37.7, 40.2, 0.5) * ss(700, 1000, met) * 0.85);   // C9: meseta de Anatolia
  const africa = lo < 12 && la < (lo < -1 ? 35.95 : 37.45);
  let des = africa ? ss(3, 14, d) * Math.max(0.55, ss(0, 1.8, 37.3 - la)) * (lo < -1 ? Math.max(0.3, ss(34, 31.5, la)) : 1) : 0;
  // C9: Libia y Egipto (Cirenaica algo menos), Sinaí y desierto de Siria
  if (lo >= 12 && lo < 34.6 && la < 33.4) des = Math.max(des, ss(1.5, 8, d) * Math.max(0.6, ss(32.9, 31.6, la)) * (1 - 0.45 * sbx(lo, 20.3, 22.8, 0.4) * ss(32.1, 32.6, la)));
  if (lo > 32.2 && lo < 35.3 && la < 31.3) des = Math.max(des, ss(0.5, 4, d) * 0.9);
  if (lo > 35.6 && la < 34.2) des = Math.max(des, ss(5, 12, d) * ss(34.2, 33.0, la));
  const vega = vegaNilo(lo, la); des *= 1 - vega;
  let mar = 0; for (const m of MARISMAS) mar = Math.max(mar, 1 - ss(0.4, 1, Math.hypot(lo - m[0], (la - m[1]) * 1.28) / m[2]));
  return { pad, est, des, mar, vega, sinArbol: pad > 0.35 || des > 0.35 || mar > 0.3 || est > 0.7 || vega > 0.3 };
}
/* C9 · palmera datilera hecha por código: tronco de 5 caras y 7 hojas dobladas (2 triángulos cada una); ~24 triángulos, color por vértice */
function palmeraGeo() {
  const tr = new THREE.CylinderGeometry(0.022, 0.04, 0.6, 5, 1, true).toNonIndexed(); tr.translate(0, 0.3, 0);
  const P = Array.from(tr.attributes.position.array), C = [], cT = new THREE.Color('#7d6040'), cH = new THREE.Color('#4d7a2c'), cH2 = new THREE.Color('#6f9a3a');
  for (let k = 0; k < P.length / 3; k++) C.push(cT.r, cT.g, cT.b);
  for (let f = 0; f < 7; f++) {
    const a = f / 7 * 6.283 + 0.3, ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, top = [0, 0.6, 0], mid = [ca * 0.17, 0.66, sa * 0.17], tip = [ca * 0.34, 0.47, sa * 0.34];
    P.push(...top, mid[0] + px * 0.06, mid[1], mid[2] + pz * 0.06, ...tip, ...top, ...tip, mid[0] - px * 0.06, mid[1], mid[2] - pz * 0.06);
    for (let k = 0; k < 6; k++) { const c = k % 3 === 2 ? cH2 : cH; C.push(c.r, c.g, c.b); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); return g;
}
/* C9 · monumentos de D.MONUMENTOS, dibujados por código y muy agrandados (licencia de juego: a escala real no se verían; ficha en js/registro.js).
   giza: las tres pirámides (Keops, Kefrén con su remate de caliza blanca, Micerino) en diagonal, como en la meseta.
   faro: torre de tres cuerpos (cuadrado, octógono, cilindro) sobre un islote, con fuego que parpadea. */
function monumento(id) {
  const grp = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  if (id === 'giza') {
    const piedra = L('#d9c08a'), blanco = L('#f1e8cf');
    [[0.55, -0.45, 0.62, 0.78], [0, 0, 0.6, 0.74], [-0.5, 0.42, 0.3, 0.4]].forEach(([x, z, r, h], i) => {
      const p = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4, 1), piedra); p.rotation.y = Math.PI / 4; p.position.set(x, h / 2, z); grp.add(p);
      if (i === 1) { const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.22, h * 0.22, 4, 1), blanco); c.rotation.y = Math.PI / 4; c.position.set(x, h - h * 0.11 + 0.005, z); grp.add(c); }
    });
  } else if (id === 'faro') {
    const marmol = L('#eeeadf'), roca = L('#8f8270');
    const isla = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.5, 9), roca); isla.position.y = -0.15; grp.add(isla);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.42), marmol); b.position.y = 0.52; grp.add(b);
    const o = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.5, 8), marmol); o.position.y = 1.19; grp.add(o);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.26, 10), marmol); c.position.y = 1.57; grp.add(c);
    const fuego = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 6), new THREE.MeshBasicMaterial({ color: '#ffb23a' })); fuego.position.y = 1.8; grp.add(fuego); grp.userData.fuego = fuego;
  }
  return grp;
}
/* C10 · Adornos de carta (D.ADORNOS): nombres latinos de los mares, rosa de los vientos, galeras y criaturas, dibujados a tinta en un
   lienzo (un atlas) y puestos en el mar como rectángulos planos de UNA sola malla: una llamada de dibujo y dos triángulos por adorno.
   Sin arte de fuera. Se desvanecen al acercarse (ver update). Ficha histórica en js/registro.js (tipo adorno). */
const TINTA = '#3a230e', HALO = 'rgba(247,234,204,0.82)';
function letras(ctx, txt, x, y, px, esp) {   // texto con letras espaciadas (aire de inscripción); x es el centro
  const w = [...txt].map(ch => ctx.measureText(ch).width), tot = w.reduce((a, b) => a + b, 0) + esp * px * (txt.length - 1);
  let cx = x - tot / 2;
  for (let pas = 0; pas < 2; pas++) { cx = x - tot / 2; [...txt].forEach((ch, i) => { if (pas === 0) ctx.strokeText(ch, cx, y); else ctx.fillText(ch, cx, y); cx += w[i] + esp * px; }); }
  return tot;
}
function anchoLetras(ctx, txt, px, esp) { return [...txt].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + esp * px * (txt.length - 1); }
const latino = n => n.toUpperCase().replace(/U/g, 'V');
function olas(ctx, x0, x1, y, a) { ctx.beginPath(); for (let x = x0; x < x1; x += a * 2) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a / 2, y - a * 0.7, x + a, y); ctx.quadraticCurveTo(x + a * 1.5, y + a * 0.5, x + a * 2, y); } ctx.stroke(); }
/* cada dibujo se hace en una caja de 100 de ancho (alto según la forma) */
const DIBUJO = {
  barco: { alto: 72, f(c) {
    c.lineWidth = 2.2; c.strokeStyle = TINTA; c.lineJoin = c.lineCap = 'round';
    c.beginPath(); c.moveTo(50, 44); c.lineTo(50, 6); c.stroke();                                            // mástil
    c.beginPath(); c.moveTo(30, 10); c.quadraticCurveTo(50, 7, 70, 10); c.lineTo(68, 36); c.quadraticCurveTo(50, 40, 32, 36); c.closePath();   // vela cuadra
    c.fillStyle = '#f1e3c0'; c.fill(); c.stroke();
    c.fillStyle = 'rgba(150,42,28,0.85)'; for (const x of [40, 50, 60]) c.fillRect(x - 2.5, 10, 5, 27);
    c.beginPath(); c.moveTo(4, 30); c.quadraticCurveTo(4, 40, 14, 44); c.lineTo(86, 44); c.lineTo(99, 50); c.lineTo(86, 52);   // casco con espolón
    c.quadraticCurveTo(50, 60, 18, 54); c.quadraticCurveTo(8, 50, 4, 30); c.closePath(); c.fillStyle = '#5b3517'; c.fill(); c.stroke();
    c.strokeStyle = '#e6cf9c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(16, 48); c.lineTo(84, 48); c.stroke();
    c.fillStyle = '#f4e8cc'; c.beginPath(); c.arc(84, 47.5, 1.8, 0, 7); c.fill();                                   // el ojo de la proa
    c.strokeStyle = TINTA; c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i < 9; i++) { c.moveTo(24 + i * 6.5, 54); c.lineTo(17 + i * 6.5, 64); } c.stroke();   // remos
    c.lineWidth = 1.4; c.strokeStyle = 'rgba(58,35,14,0.75)'; olas(c, 6, 94, 67, 5);
  } },
  ketos: { alto: 62, f(c) {
    c.lineJoin = c.lineCap = 'round'; const cuerpo = () => { c.beginPath(); c.moveTo(22, 30); c.bezierCurveTo(28, 8, 42, 6, 46, 36); c.moveTo(54, 38); c.bezierCurveTo(58, 12, 72, 12, 76, 38); c.moveTo(82, 36); c.bezierCurveTo(86, 24, 90, 20, 94, 22); };
    c.strokeStyle = TINTA; c.lineWidth = 11; cuerpo(); c.stroke(); c.strokeStyle = '#4f7466'; c.lineWidth = 7; cuerpo(); c.stroke();
    c.fillStyle = '#4f7466'; c.strokeStyle = TINTA; c.lineWidth = 2;
    c.beginPath(); c.moveTo(94, 22); c.lineTo(99, 10); c.lineTo(96, 24); c.lineTo(100, 30); c.closePath(); c.fill(); c.stroke();   // aleta de la cola
    for (const [x, y] of [[31, 13], [37, 12], [63, 16], [69, 16]]) { c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x, y - 6); c.lineTo(x + 3, y + 2); c.closePath(); c.fill(); c.stroke(); }   // cresta
    c.beginPath(); c.moveTo(24, 26); c.quadraticCurveTo(14, 16, 4, 24); c.lineTo(12, 27); c.lineTo(3, 31); c.quadraticCurveTo(14, 36, 24, 33); c.closePath(); c.fill(); c.stroke();   // cabeza con las fauces abiertas
    c.fillStyle = '#f4e8cc'; c.beginPath(); c.arc(15, 22.5, 1.8, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.moveTo(20, 21); c.lineTo(23, 15); c.lineTo(22, 22); c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(58,35,14,0.8)'; olas(c, 10, 96, 40, 5); olas(c, 24, 80, 48, 4);
  } },
  delphini: { alto: 56, f(c) {
    c.lineJoin = c.lineCap = 'round';
    const delfin = (x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s);
      c.beginPath(); c.moveTo(-26, 10); c.quadraticCurveTo(-10, -20, 18, -4); c.lineTo(28, -2); c.lineTo(18, 2); c.quadraticCurveTo(-6, -10, -20, 14); c.closePath();
      c.fillStyle = '#5d7b86'; c.fill(); c.strokeStyle = TINTA; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.moveTo(-4, -10); c.lineTo(-10, -20); c.lineTo(2, -11); c.fill(); c.stroke();               // aleta del lomo
      c.beginPath(); c.moveTo(-23, 12); c.lineTo(-32, 8); c.lineTo(-26, 18); c.lineTo(-18, 18); c.closePath(); c.fill(); c.stroke();   // cola
      c.fillStyle = '#f4e8cc'; c.beginPath(); c.arc(14, -4, 1.5, 0, 7); c.fill(); c.restore(); };
    delfin(34, 26, 1); delfin(72, 32, 0.8);
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(58,35,14,0.8)'; olas(c, 4, 96, 44, 5);
  } },
  physeter: { alto: 64, f(c) {
    c.lineJoin = c.lineCap = 'round'; c.strokeStyle = 'rgba(58,35,14,0.85)'; c.lineWidth = 1.8;
    c.beginPath(); for (const a of [-0.5, -0.2, 0.1, 0.4]) { c.moveTo(28, 20); c.quadraticCurveTo(28 + a * 20, 4, 28 + a * 34, 8); } c.stroke();   // el chorro
    c.beginPath(); c.moveTo(6, 44); c.quadraticCurveTo(8, 20, 34, 20); c.quadraticCurveTo(70, 18, 84, 38); c.lineTo(90, 30); c.lineTo(98, 28); c.lineTo(92, 38); c.lineTo(98, 46); c.lineTo(86, 44); c.lineTo(80, 44); c.closePath();
    c.fillStyle = '#4a4e52'; c.fill(); c.strokeStyle = TINTA; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = 'rgba(244,232,204,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(14, 36); c.quadraticCurveTo(40, 30, 70, 34); c.stroke();
    c.fillStyle = '#f4e8cc'; c.beginPath(); c.arc(16, 33, 1.8, 0, 7); c.fill();
    c.strokeStyle = 'rgba(58,35,14,0.8)'; c.lineWidth = 1.5; olas(c, 2, 98, 46, 5); olas(c, 16, 86, 54, 4);
  } },
  rosa: { alto: 100, f(c) {
    c.lineJoin = 'round'; c.strokeStyle = TINTA; c.lineWidth = 1.2;
    for (const r of [33, 30.5]) { c.beginPath(); c.arc(50, 50, r, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(247,234,204,0.35)'; c.beginPath(); c.arc(50, 50, 30.5, 0, 7); c.fill();
    const punta = (ang, largo, ancho) => { const ux = Math.sin(ang), uy = -Math.cos(ang), px = -uy * ancho, py = ux * ancho, tx = 50 + ux * largo, ty = 50 + uy * largo;
      c.beginPath(); c.moveTo(50, 50); c.lineTo(tx, ty); c.lineTo(50 + px, 50 + py); c.closePath(); c.fillStyle = '#efe0bd'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(50, 50); c.lineTo(tx, ty); c.lineTo(50 - px, 50 - py); c.closePath(); c.fillStyle = TINTA; c.fill(); c.stroke(); };
    for (let k = 0; k < 4; k++) punta(Math.PI / 4 + k * Math.PI / 2, 24, 5);
    for (let k = 0; k < 4; k++) punta(k * Math.PI / 2, 38, 6.5);
    c.fillStyle = '#962a1c'; c.beginPath(); c.arc(50, 50, 2.6, 0, 7); c.fill();
    c.font = 'italic 600 7px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = TINTA; c.strokeStyle = HALO; c.lineWidth = 2;
    for (const [t, x, y, r] of [['SEPTENTRIO', 50, 7, 0], ['AVSTER', 50, 94, 0], ['SOLANVS', 94, 50, Math.PI / 2], ['FAVONIVS', 6, 50, -Math.PI / 2]]) {   // los cuatro vientos de Vitruvio 1.6
      c.save(); c.translate(x, y); c.rotate(r); c.strokeText(t, 0, 0); c.fillText(t, 0, 0); c.restore(); }
  } }
};
function adornosMalla() {
  const A = D.ADORNOS || {}, P = 26, ANCHO_AT = 2048, piezas = [], fuente = px => 'italic 600 ' + px + 'px Georgia, "Times New Roman", serif';
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  for (const id in A) {   // medir cada pieza (en unidades del mapa y en píxeles del atlas)
    const a = A[id], forma = a.clase === 'mar' ? 'mar' : a.clase === 'rosa' ? 'rosa' : a.clase === 'barco' ? 'barco' : id.replace(/\d+$/, '');
    if (forma === 'mar') {
      const px = Math.round(a.t * P), txt = latino(a.n), dos = /^MARE /.test(txt) && id !== 'internum', nombre = dos ? txt.slice(5) : txt;
      ctx.font = fuente(px); const w = anchoLetras(ctx, nombre, px, 0.28) + px * 0.8;
      piezas.push({ a, forma, txt: nombre, dos, px, wpx: Math.ceil(w), hpx: Math.ceil(px * (dos ? 1.95 : 1.4)) });
    } else { const d = DIBUJO[forma]; if (!d) continue; const wpx = Math.round(a.t * P); piezas.push({ a, forma, d, wpx, hpx: Math.round(wpx * d.alto / 100) }); }
  }
  let x = 0, y = 0, fila = 0;   // atlas en estantes
  for (const q of piezas.slice().sort((p, r) => r.hpx - p.hpx)) { if (x + q.wpx + 2 > ANCHO_AT) { x = 0; y += fila + 2; fila = 0; } q.ax = x; q.ay = y; x += q.wpx + 2; fila = Math.max(fila, q.hpx); }
  cv.width = ANCHO_AT; cv.height = Math.max(4, y + fila);
  for (const q of piezas) {
    ctx.save(); ctx.beginPath(); ctx.rect(q.ax, q.ay, q.wpx, q.hpx); ctx.clip();
    if (q.forma === 'mar') {
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = TINTA; ctx.strokeStyle = HALO; ctx.lineJoin = 'round';
      const cx = q.ax + q.wpx / 2;
      if (q.dos) { const pc = Math.round(q.px * 0.55); ctx.font = fuente(pc); ctx.lineWidth = pc * 0.2; letras(ctx, 'MARE', cx, q.ay + pc * 1.05, pc, 0.45); }
      ctx.font = fuente(q.px); ctx.lineWidth = q.px * 0.2; letras(ctx, q.txt, cx, q.ay + q.hpx - q.px * 0.32, q.px, 0.28);
    } else {
      const s = q.wpx / 100; ctx.translate(q.ax + (q.a.izq ? q.wpx : 0), q.ay); ctx.scale(q.a.izq ? -s : s, s); q.d.f(ctx);
    }
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const pos = [], uv = [], idx = [];
  for (const q of piezas) {
    const p = D.proj(q.a.lon, q.a.lat), cx = p[0] * K, cz = p[1] * K, w = q.wpx / P, h = q.hpx / P, r = (q.a.rot || 0) * Math.PI / 180, co = Math.cos(r), si = Math.sin(r), b = pos.length / 3;
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {   // u: izquierda→derecha, v: arriba (norte)→abajo
      const lx = (u - 0.5) * w, lz = (v - 0.5) * h; pos.push(cx + lx * co - lz * si, 0.15, cz + lx * si + lz * co);
      uv.push((q.ax + u * q.wpx) / cv.width, 1 - (q.ay + v * q.hpx) / cv.height);
    }
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 4; m.userData.piezas = piezas.length; return m;
}

/* C11 · Pueblos y tribus (D.TRIBUS) en las tierras sin ciudad. Dos mallas para todos: los poblados (cabañas, castros, casas íberas y
   mapalia, unidos en UNA geometría con color por vértice) y los nombres (cintas a tinta en un lienzo, como C10). Dos llamadas de
   dibujo; los poblados solo se pintan de cerca y las cintas se desvanecen al alejarse (ver update). Ficha en js/registro.js (tipo tribu). */
const GENTES = {   // color sobrio de cada familia de pueblos: cinta y detalles del poblado
  celta: '#4e6a3c', castreno: '#5d5a52', celtibero: '#7a5434', ibero: '#93472b', ligur: '#5f6b4a', italico: '#7a6234',
  ilirio: '#47607a', tracio: '#5e4c72', anatolio: '#7b5a5a', libio: '#a0703a'
};
function tribusMallas(vista, aguaXZ) {
  const T = D.TRIBUS || {}, P = 30, ANCHO_AT = 2048, piezas = [], fl = px => '600 ' + px + 'px Georgia, "Times New Roman", serif', fs = px => 'italic ' + px + 'px Georgia, "Times New Roman", serif';
  // --- nombres: cinta con el nombre latino y, debajo, el nombre en español ---
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d'), LX = 0.95;   // LX: alto de letra latina en unidades del mapa
  for (const id in T) {
    const t = T[id], px = Math.round(LX * P), txt = latino(t.la); ctx.font = fl(px); const wl = anchoLetras(ctx, txt, px, 0.22);
    ctx.font = fs(Math.round(px * 0.8)); const we = ctx.measureText(t.n).width;
    piezas.push({ id, t, txt, px, wl, wpx: Math.ceil(Math.max(wl + px * 2.4, we + px)), hpx: Math.ceil(px * 2.7) });
  }
  let x = 0, y = 0;
  for (const q of piezas) { if (x + q.wpx + 2 > ANCHO_AT) { x = 0; y += piezas[0].hpx + 2; } q.ax = x; q.ay = y; x += q.wpx + 2; }
  cv.width = ANCHO_AT; cv.height = Math.max(4, y + (piezas[0] ? piezas[0].hpx : 2));
  for (const q of piezas) {
    const px = q.px, cx = q.ax + q.wpx / 2, w = q.wl + px * 1.3, x0 = cx - w / 2, x1 = cx + w / 2, y0 = q.ay + px * 0.12, y1 = y0 + px * 1.25, col = GENTES[q.t.gente] || '#6b5a40';
    ctx.save(); ctx.lineJoin = 'round';
    // cola de la cinta (dos picos plegados a cada lado), más oscura
    ctx.fillStyle = col; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) { const xe = s < 0 ? x0 : x1, xo = xe - s * px * 0.25; ctx.beginPath(); ctx.moveTo(xo, y0 + px * 0.28); ctx.lineTo(xe + s * px * 0.5, y0 + px * 0.28);
      ctx.lineTo(xe + s * px * 0.28, y0 + px * 0.86); ctx.lineTo(xe + s * px * 0.5, y1 + px * 0.16); ctx.lineTo(xo, y1 + px * 0.16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.fillStyle = col; }
    // cuerpo de la cinta, algo curvado como un pergamino
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, y0 - px * 0.18, x1, y0); ctx.lineTo(x1, y1); ctx.quadraticCurveTo(cx, y1 - px * 0.18, x0, y1); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.strokeStyle = 'rgba(240,226,190,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 3, y0 + 3); ctx.quadraticCurveTo(cx, y0 - px * 0.18 + 3, x1 - 3, y0 + 3); ctx.stroke();
    ctx.font = fl(px); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f4e6c4'; ctx.strokeStyle = 'rgba(30,18,6,0.85)'; ctx.lineWidth = px * 0.14;
    letras(ctx, q.txt, cx, y1 - px * 0.3, px, 0.22);
    const pe = Math.round(px * 0.8); ctx.font = fs(pe); ctx.textAlign = 'center'; ctx.fillStyle = TINTA; ctx.strokeStyle = HALO; ctx.lineWidth = pe * 0.28;
    ctx.strokeText(q.t.n, cx, q.ay + q.hpx - pe * 0.25); ctx.fillText(q.t.n, cx, q.ay + q.hpx - pe * 0.25);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const pos = [], uv = [], idx = [];
  for (const q of piezas) {
    const p = D.proj(q.t.lon, q.t.lat), cx = p[0] * K, cz = p[1] * K + 2.0, w = q.wpx / P, h = q.hpx / P, b = pos.length / 3;   // la cinta, al sur del poblado
    let alto = 0; for (const [u, v] of [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]]) alto = Math.max(alto, vista.hAt(cx + (u - 0.5) * w, cz + (v - 0.5) * h));
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push(cx + (u - 0.5) * w, Math.max(0.15, alto + 0.12), cz + (v - 0.5) * h); uv.push((q.ax + u * q.wpx) / cv.width, 1 - (q.ay + v * q.hpx) / cv.height); }
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  const gN = new THREE.BufferGeometry(); gN.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gN.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gN.setIndex(idx); gN.computeBoundingSphere();
  const nombres = new THREE.Mesh(gN, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  nombres.renderOrder = 4; nombres.userData.piezas = piezas.length;
  // --- poblados: piezas base (sin índices, con color por vértice) que se copian giradas y escaladas en una sola geometría ---
  const base = (g, col) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
  const pieza = (...gs) => gs;   // una forma = lista de geometrías base
  const cil = (r, h, n, col) => { const g = new THREE.CylinderGeometry(r, r * 1.05, h, n, 1, true); g.translate(0, h / 2, 0); return base(g, col); };
  const cono = (r, h, y0, n, col) => { const g = new THREE.ConeGeometry(r, h, n, 1, true); g.translate(0, y0 + h / 2, 0); return base(g, col); };
  const caja = (w, h, d, col) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return base(g, col); };
  const PAJA = '#b99a5c', BARRO = '#a88a63', PIEDRA = '#9c968a', ADOBE = '#c8ab80', CUERO = '#8a6a48', MADERA = '#5e4126';
  const FORMAS = {
    redonda: pieza(cil(0.13, 0.13, 7, BARRO), cono(0.17, 0.2, 0.13, 7, PAJA)),
    castro: pieza(cil(0.12, 0.12, 7, PIEDRA), cono(0.155, 0.17, 0.12, 7, PAJA)),
    ibera: pieza(caja(0.24, 0.15, 0.2, ADOBE), caja(0.27, 0.025, 0.23, '#8d6b4c').translate(0, 0.15, 0)),
    mapalia: pieza((() => { const g = new THREE.CylinderGeometry(0.11, 0.11, 0.34, 6, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return base(g, CUERO); })())
  };
  const MUROS = { redonda: [MADERA, 0.15], castro: [PIEDRA, 0.11], ibera: [PIEDRA, 0.11] };   // empalizada de madera o muro de piedra
  const P3 = [], N3 = [], C3 = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), nm = new THREE.Matrix3();
  const poner = (gs, x, z, giro, esc, tinte) => {
    const hy = vista.hAt(x, z); M.compose(V.set(x, Math.max(0.03, hy) - 0.015, z), Q.setFromAxisAngle(Y, giro), S.set(esc, esc, esc)); nm.getNormalMatrix(M);
    for (const g of gs) {
      const pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color;
      for (let k = 0; k < pa.count; k++) {
        V.fromBufferAttribute(pa, k).applyMatrix4(M); P3.push(V.x, V.y, V.z); V.fromBufferAttribute(na, k).applyMatrix3(nm).normalize(); N3.push(V.x, V.y, V.z);
        C3.push(ca.getX(k) * tinte, ca.getY(k) * tinte, ca.getZ(k) * tinte);
      }
    }
  };
  let casas = 0;
  for (const id in T) {
    const t = T[id], p = D.proj(t.lon, t.lat), x0 = p[0] * K, z0 = p[1] * K, E = 1.7, sem = t.lon * 13.1 + t.lat * 7.7, forma = FORMAS[t.casa] || FORMAS.redonda, n = t.casa === 'mapalia' ? 7 : 6;
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + hash(sem + i) * 0.6, r = i === 0 ? 0 : (0.28 + hash(sem + i * 3.3) * 0.22) * E, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;
      if (aguaXZ(x, z) > 0.05) continue;
      poner(forma, x, z, t.casa === 'ibera' ? hash(sem) * 0.5 : hash(sem + i * 5.1) * 6.28, (i === 0 ? 1.3 : 0.85 + hash(sem + i * 2.2) * 0.3) * E, 0.88 + hash(sem + i * 7.9) * 0.24); casas++;
    }
    const muro = MUROS[t.casa];
    if (muro && aguaXZ(x0, z0) < 0.05) {   // el recinto: anillo bajo de 16 lados; la piedra va algo más baja y un poco irregular
      const R = 0.68 * E, h = muro[1] * E, col = new THREE.Color(muro[0]), cg = new THREE.Color(GENTES[t.gente] || '#6b5a40');
      for (let k = 0; k < 16; k++) {
        const a0 = k / 16 * 6.283, a1 = (k + 1) / 16 * 6.283, xa = x0 + Math.cos(a0) * R, za = z0 + Math.sin(a0) * R, xb = x0 + Math.cos(a1) * R, zb = z0 + Math.sin(a1) * R;
        const ya = Math.max(0.03, vista.hAt(xa, za)) - 0.02, yb = Math.max(0.03, vista.hAt(xb, zb)) - 0.02, ha = h * (0.85 + hash(sem + k) * 0.3), hb = h * (0.85 + hash(sem + k + 1) * 0.3);
        const nx = Math.cos((a0 + a1) / 2), nz = Math.sin((a0 + a1) / 2), c = k === 4 ? cg : col;   // un tramo con el color del pueblo (la puerta)
        for (const [px, py, pz] of [[xa, ya, za], [xb, yb, zb], [xb, yb + hb, zb], [xa, ya, za], [xb, yb + hb, zb], [xa, ya + ha, za]]) { P3.push(px, py, pz); N3.push(nx, 0.3, nz); C3.push(c.r, c.g, c.b); }
      }
    }
  }
  const gA = new THREE.BufferGeometry(); gA.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); gA.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); gA.setAttribute('color', new THREE.Float32BufferAttribute(C3, 3)); gA.computeBoundingSphere();
  for (const k in FORMAS) for (const g of FORMAS[k]) g.dispose();
  const aldeas = new THREE.Mesh(gA, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true }));
  aldeas.userData.casas = casas;
  return { nombres, aldeas };
}

/* C12 · Calzadas, puertos y rutas de mar (D.CALZADAS, D.PUERTOS, D.RUMBOS) como en una carta antigua. SOLO SE VEN: no tocan D.EDGES
   ni las rutas de comercio. Tres mallas para todo: (1) los trazos, en UNA geometría con color por vértice (rgba): cada calzada es una
   cinta de tinta roja con el alma color pergamino y rayitas de miliario; cada ruta de mar, trazos de tinta sobre el agua;
   (2) los nombres de las calzadas con su año y (3) las anclas de los puertos con su nombre, en un lienzo-atlas como C10 y C11.
   La calzada que aún no existe en el año de la partida se ve pálida (ver calzadasAnio). Ficha en js/registro.js (calzada, puerto, rumbo). */
const ROJO = [0.55, 0.13, 0.07], ALMA = [0.93, 0.84, 0.64], RUMBO = [0.14, 0.09, 0.05];
function calzadasMallas(vista) {
  const C = D.CALZADAS || {}, PU = D.PUERTOS || {}, RU = D.RUMBOS || {}, pos = [], col = [], tramos = {};
  const pr = (lo, la) => { const p = D.proj(lo, la); return [p[0] * K, p[1] * K]; };
  const quad = (a, b, c, d, y, rgb, al) => { for (const [x, z] of [a, b, c, a, c, d]) { pos.push(x, y(x, z), z); col.push(rgb[0], rgb[1], rgb[2], al); } };
  // muestrea una polilínea cada ~paso unidades: [x, z, dx, dz] (dirección unitaria)
  const muestras = (p, paso) => {
    const out = [];
    for (let i = 0; i + 1 < p.length; i++) {
      const [ax, az] = pr(p[i][0], p[i][1]), [bx, bz] = pr(p[i + 1][0], p[i + 1][1]), l = Math.hypot(bx - ax, bz - az) || 1, n = Math.max(1, Math.ceil(l / paso));
      for (let k = i ? 1 : 0; k <= n; k++) out.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n, (bx - ax) / l, (bz - az) / l]);
    }
    for (let k = 1; k + 1 < out.length; k++) if (out[k + 1][0] !== out[k][0] || out[k + 1][1] !== out[k][1]) { const dx = out[k - 1][2] + out[k + 1][2], dz = out[k - 1][3] + out[k + 1][3], l = Math.hypot(dx, dz) || 1; out[k][2] = dx / l; out[k][3] = dz / l; }   // esquinas suaves
    return out;
  };
  const sobre = alto => (x, z) => Math.max(0.03, vista.hAt(x, z)) + alto;
  for (const id in C) {
    const c = C[id], m = muestras(c.p, 0.4), i0 = col.length;
    for (const [ancho, alto, rgb] of [[0.42, 0.1, ROJO], [0.13, 0.104, ALMA]]) {
      const y = sobre(alto), w = ancho / 2;
      for (let k = 0; k + 1 < m.length; k++) { const a = m[k], b = m[k + 1]; quad([a[0] - a[3] * w, a[1] + a[2] * w], [b[0] - b[3] * w, b[1] + b[2] * w], [b[0] + b[3] * w, b[1] - b[2] * w], [a[0] + a[3] * w, a[1] - a[2] * w], y, rgb, 1); }
    }
    const y = sobre(0.106);   // rayitas de miliario cada ~1,6 unidades (≈ cada 30 km): la trama de las cartas
    for (let k = 2; k + 2 < m.length; k += 4) { const [x, z, dx, dz] = m[k], L = 0.36, e = 0.06; quad([x - dz * L - dx * e, z + dx * L - dz * e], [x - dz * L + dx * e, z + dx * L + dz * e], [x + dz * L + dx * e, z - dx * L + dz * e], [x + dz * L - dx * e, z - dx * L - dz * e], y, ROJO, 1); }
    tramos[id] = [i0 / 4, col.length / 4];
  }
  const llano = () => 0.13;
  for (const id in RU) {   // trazos de 0,5 con huecos de 0,35 sobre el agua: un rectángulo por trazo
    const p = RU[id].p.map(q => pr(q[0], q[1])), w = 0.11, DASH = 0.7, HUECO = 0.45; let resto = 0;
    for (let i = 0; i + 1 < p.length; i++) {
      const [ax, az] = p[i], [bx, bz] = p[i + 1], l = Math.hypot(bx - ax, bz - az) || 1, dx = (bx - ax) / l, dz = (bz - az) / l;
      for (let t = resto; t < l; t += DASH + HUECO) {
        const t1 = Math.min(l, t + DASH), x0 = ax + dx * t, z0 = az + dz * t, x1 = ax + dx * t1, z1 = az + dz * t1;
        quad([x0 - dz * w, z0 + dx * w], [x1 - dz * w, z1 + dx * w], [x1 + dz * w, z1 - dx * w], [x0 + dz * w, z0 - dx * w], llano, RUMBO, 0.92);
        resto = t + DASH + HUECO - l;
      }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.computeBoundingSphere();
  const trazos = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  trazos.renderOrder = 3; trazos.userData.tramos = tramos;
  // --- nombres: atlas con las calzadas (nombre latino y año) y los puertos (ancla y nombre) ---
  const P = 30, ANCHO_AT = 2048, fl = px => '600 ' + px + 'px Georgia, "Times New Roman", serif', fs = px => 'italic ' + px + 'px Georgia, "Times New Roman", serif';
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d'), piezas = [];
  for (const id in C) {
    const c = C[id], px = Math.round(0.46 * P), txt = latino(c.la), fecha = c.anio ? (c.hacia ? 'hacia ' : 'año ') + c.anio + ' a.C.' : 'camino antiguo';
    ctx.font = fl(px); const w1 = anchoLetras(ctx, txt, px, 0.2); ctx.font = fs(Math.round(px * 0.78)); const w2 = ctx.measureText(fecha).width;
    const q = c.p[Math.min(c.et || 0, c.p.length - 1)]; piezas.push({ clase: 'via', txt, fecha, px, lon: q[0], lat: q[1], wpx: Math.ceil(Math.max(w1, w2) + px), hpx: Math.ceil(px * 2.3) });
  }
  for (const id in PU) {
    const u = PU[id], px = Math.round(0.68 * P), txt = u.ciudad ? '' : latino(u.la); ctx.font = fl(px); const w = txt ? anchoLetras(ctx, txt, px, 0.2) : 0;
    piezas.push({ clase: 'puerto', txt, px, lon: u.lon, lat: u.lat, wpx: Math.ceil(Math.max(px * 2.2, w + px)), hpx: Math.ceil(px * (txt ? 3.4 : 2.2)) });
  }
  let x = 0, y = 0, fila = 0;
  for (const q of piezas) { if (x + q.wpx + 2 > ANCHO_AT) { x = 0; y += fila + 2; fila = 0; } q.ax = x; q.ay = y; x += q.wpx + 2; fila = Math.max(fila, q.hpx); }
  cv.width = ANCHO_AT; cv.height = Math.max(4, y + fila);
  for (const q of piezas) {
    const cx = q.ax + q.wpx / 2, px = q.px; ctx.save(); ctx.lineJoin = 'round'; ctx.textBaseline = 'alphabetic';
    if (q.clase === 'via') {
      ctx.font = fl(px); ctx.textAlign = 'left'; ctx.fillStyle = '#7a1f12'; ctx.strokeStyle = HALO; ctx.lineWidth = px * 0.26; letras(ctx, q.txt, cx, q.ay + px * 1.05, px, 0.2);
      const pe = Math.round(px * 0.78); ctx.font = fs(pe); ctx.textAlign = 'center'; ctx.fillStyle = TINTA; ctx.lineWidth = pe * 0.3; ctx.strokeText(q.fecha, cx, q.ay + q.hpx - pe * 0.3); ctx.fillText(q.fecha, cx, q.ay + q.hpx - pe * 0.3);
    } else {   // ancla a tinta: anilla, caña, cepo y brazos curvos
      const s = px * 0.9, ay = q.ay + px * 0.25; ctx.translate(cx, ay); ctx.strokeStyle = HALO; ctx.lineCap = 'round';
      const ancla = () => { ctx.beginPath(); ctx.arc(0, s * 0.18, s * 0.14, 0, 7); ctx.moveTo(0, s * 0.32); ctx.lineTo(0, s * 1.75); ctx.moveTo(-s * 0.42, s * 0.6); ctx.lineTo(s * 0.42, s * 0.6);
        ctx.moveTo(-s * 0.72, s * 1.2); ctx.quadraticCurveTo(-s * 0.6, s * 1.78, 0, s * 1.78); ctx.quadraticCurveTo(s * 0.6, s * 1.78, s * 0.72, s * 1.2); ctx.stroke(); };
      ctx.lineWidth = s * 0.34; ancla(); ctx.strokeStyle = '#1f3a4f'; ctx.lineWidth = s * 0.15; ancla();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (q.txt) { ctx.font = fl(px); ctx.textAlign = 'left'; ctx.fillStyle = '#1f3a4f'; ctx.strokeStyle = HALO; ctx.lineWidth = px * 0.28; letras(ctx, q.txt, cx, q.ay + q.hpx - px * 0.3, px, 0.2); }
    }
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const malla = clase => {
    const p3 = [], uv = [], idx = [];
    for (const q of piezas) {
      if (q.clase !== clase) continue;
      const [x0, z0] = pr(q.lon, q.lat), w = q.wpx / P, h = q.hpx / P, cx = x0, cz = clase === 'via' ? z0 + h * 0.5 + 0.25 : z0 + h * 0.5 - 0.3, b = p3.length / 3;
      let alto = 0.15; if (clase === 'via') for (const [u, v] of [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]]) alto = Math.max(alto, vista.hAt(cx + (u - 0.5) * w, cz + (v - 0.5) * h) + 0.12);
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { p3.push(cx + (u - 0.5) * w, alto, cz + (v - 0.5) * h); uv.push((q.ax + u * q.wpx) / cv.width, 1 - (q.ay + v * q.hpx) / cv.height); }
      idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
    }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(p3, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeBoundingSphere();
    const me = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); me.renderOrder = 4; return me;
  };
  return { trazos, vias: malla('via'), puertos: malla('puerto') };
}
/* C12 · la calzada que aún no se ha construido en el año de la partida (D.anio, en años a.C.) se ve pálida */
function calzadasAnio(trazos, anio) {
  const C = D.CALZADAS || {}, a = trazos.geometry.attributes.color;
  for (const id in trazos.userData.tramos) { const [i0, i1] = trazos.userData.tramos[id], al = !C[id].anio || anio <= C[id].anio ? 1 : 0.3; for (let i = i0; i < i1; i++) a.setW(i, al); }
  a.needsUpdate = true;
}

/* C13 · Vida en el mapa (D.VIDA): rebaños que pastan, humo de los hogares en poblados y ciudades, mercantes por las rutas de mar
   (D.RUMBOS) y carros de bueyes por las calzadas (D.CALZADAS). Sin arte nuevo y barato: (1) el ganado, en UNA geometría pequeña
   (13 triángulos) copiada con instancias, repartida en trozos del mapa para que solo se dibujen los que están en pantalla; pastan
   y se mueven en el sombreador, sin tocar la CPU; (2) el humo, cintas de 12 triángulos que miran a la cámara y se mecen, todas en
   una malla; (3) mercantes y (4) carros, una malla con instancias cada uno: la CPU mueve 18 + 11 matrices por fotograma, y solo
   cuando se ven (barcos y carros van en una sola malla). Todo se apaga de lejos (ver update). Ficha en js/registro.js (tipo vida). */
const PELO = { ovis: ['#e9e2d0', '#d8cfb8', '#cfc6ae'], capra: ['#6e5236', '#4a3a2a', '#8a6d4c'], bos: ['#8a6a4a', '#b39673', '#5d4632'] };
const conColor = (g, col) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
const sinSuelo = (g, y0) => { g = g.toNonIndexed(); const p = g.attributes.position, keep = []; for (let t = 0; t < p.count; t += 3) { let abajo = true; for (let q = 0; q < 3; q++) if (p.getY(t + q) > y0 + 1e-4) abajo = false; if (!abajo) keep.push(t); } const out = new THREE.BufferGeometry(); for (const nm of ['position', 'normal']) { const a = g.attributes[nm], b = new Float32Array(keep.length * 9); keep.forEach((t, i) => { for (let q = 0; q < 9; q++) b[i * 9 + q] = a.array[t * 3 + q]; }); out.setAttribute(nm, new THREE.BufferAttribute(b, 3)); } return out; };
const cajaSin = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y + h / 2, z); return sinSuelo(g, y); };
const unir = gs => { const n = gs.reduce((a, g) => a + g.attributes.position.count, 0), out = new THREE.BufferGeometry(); for (const nm of ['position', 'normal', 'color']) { const b = new Float32Array(n * 3); let o = 0; for (const g of gs) { b.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; } out.setAttribute(nm, new THREE.BufferAttribute(b, 3)); } out.computeBoundingSphere(); return out; };
function animalGeo() {   // cuerpo sin suelo (10) y cabeza en punta (3): 13 triángulos; la cabeza va más oscura y es lo que baja al pastar
  const cuerpo = conColor(cajaSin(0.09, 0.075, 0.2, 0, 0.04, 0), '#ffffff');
  const ca = new THREE.ConeGeometry(0.04, 0.09, 3, 1, true); ca.rotateX(Math.PI / 2); ca.translate(0, 0.115, 0.135); const cabeza = conColor(ca, '#9a9a9a');
  return unir([cuerpo, cabeza]);
}
function mercanteGeo() {   // casco ancho sin suelo, proa en cuña, mástil y vela cuadra (crema): 17 triángulos
  const casco = conColor(cajaSin(0.32, 0.13, 0.62, 0, 0, -0.04), '#6b4423');
  const pr = new THREE.ConeGeometry(0.16, 0.26, 3, 1, true); pr.rotateX(Math.PI / 2); pr.scale(1, 0.55, 1); pr.translate(0, 0.07, 0.4); const proa = conColor(pr, '#5a381c');
  const ve = new THREE.PlaneGeometry(0.5, 0.42); ve.translate(0, 0.45, 0.04); const vela = conColor(ve, '#efe3c2');
  const ma = new THREE.PlaneGeometry(0.03, 0.62); ma.rotateY(Math.PI / 2); ma.translate(0, 0.38, 0.03); const mastil = conColor(ma, '#4a3018');
  return unir([casco, proa, vela, mastil]);
}
function carroGeo() {   // caja de tablas, dos ruedas macizas y el buey delante: 26 triángulos
  const caja = conColor(cajaSin(0.17, 0.07, 0.24, 0, 0.06, -0.05), '#8c6a3c');
  const ruedas = [-1, 1].map(s => { const r = new THREE.CircleGeometry(0.055, 5); r.rotateY(Math.PI / 2); r.translate(s * 0.095, 0.055, -0.05); return conColor(r, '#3e2a16'); });
  const buey = conColor(cajaSin(0.08, 0.07, 0.17, 0, 0.035, 0.2), '#7d6248');
  return unir([caja, ...ruedas, buey]);
}
/* el ganado pasta en el sombreador: cada animal (por su sitio) da pasos cortos adelante y atrás y baja la cabeza a ratos */
function materialGanado() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      float hh = fract(sin(dot(ip.xz, vec2(12.9898, 78.233))) * 43758.5453), tt = uTime * 0.11 + hh * 40.0;
      transformed.z += sin(tt) * 0.09 + sin(tt * 0.37) * 0.05; transformed.x += sin(tt * 0.23 + 1.0) * 0.03;
      if (position.z > 0.09) transformed.y -= 0.045 * smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(uTime * 0.5 + hh * 23.0));`);
  };
  return m;
}
function materialHumo() {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: uTime, uOp: { value: 1 } },
    vertexShader: `uniform float uTime; varying vec2 vU; varying float vH;
      void main() {
        vec3 base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float s = length(instanceMatrix[0].xyz), y = position.y;
        vH = fract(sin(dot(base.xz, vec2(12.9898, 78.233))) * 43758.5453); vU = vec2(position.x * 2.0, y);
        float vien = 0.35 + 0.25 * sin(uTime * 0.21 + vH * 6.28), mece = sin(uTime * 0.7 + vH * 9.0 + y * 3.0) * 0.12 * y;
        vec3 der = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 p = base + vec3((vien * y * y + mece) * s, y * 1.7 * s, (0.25 * y * y + mece * 0.5) * s) + der * position.x * mix(0.04, 0.24, y) * s;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform float uTime, uOp; varying vec2 vU; varying float vH;
      void main() {
        float borde = 1.0 - smoothstep(0.35, 1.0, abs(vU.x)), bocanada = 0.75 + 0.25 * sin(vU.y * 11.0 - uTime * 1.3 + vH * 6.0);
        float a = borde * bocanada * smoothstep(0.0, 0.08, vU.y) * (1.0 - smoothstep(0.35, 1.0, vU.y)) * 0.8 * uOp;
        gl_FragColor = vec4(mix(vec3(0.27, 0.25, 0.23), vec3(0.6, 0.58, 0.56), vU.y), a);
      }` });
}
/* recorrido de una polilínea (lon, lat) en el mundo 3D: puntos y longitudes acumuladas, para mover por ella a velocidad fija */
function recorrido(p) { const pts = p.map(q => { const r = D.proj(q[0], q[1]); return [r[0] * K, r[1] * K]; }), ac = [0]; for (let i = 1; i < pts.length; i++) ac.push(ac[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, ac, L: ac[ac.length - 1] }; }
function enRecorrido(r, d, out) { let i = 1; while (i < r.ac.length - 1 && r.ac[i] < d) i++; const a = r.pts[i - 1], b = r.pts[i], l = (r.ac[i] - r.ac[i - 1]) || 1, f = Math.max(0, Math.min(1, (d - r.ac[i - 1]) / l)); out[0] = a[0] + (b[0] - a[0]) * f; out[1] = a[1] + (b[1] - a[1]) * f; out[2] = Math.atan2(b[0] - a[0], b[1] - a[1]); return out; }
function vidaMallas(vista, sitioPasto) {
  const V = D.VIDA || {}, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const grupo = new THREE.Group(), r = { grupo, rebanos: [], humo: null, humoCiudad: [], viajeros: null, rutasMar: [], rutasTierra: [] };
  // --- rebaños: centros junto a pueblos y ciudades, y sueltos en la estepa; 5 a 8 cabezas por rebaño ---
  const centros = [];
  for (const id in (D.TRIBUS || {})) { const t = D.TRIBUS[id], p = D.proj(t.lon, t.lat); for (let k = 0; k < 2; k++) { const a = hash(t.lon * 3.1 + k * 7.7) * 6.283, d = 2.6 + hash(t.lat * 5.3 + k) * 1.6; centros.push([p[0] * K + Math.cos(a) * d, p[1] * K + Math.sin(a) * d, t.lon * 1.7 + k]); } }
  for (const id in D.CITIES) { const c = D.CITIES[id], p = D.proj(c.lon, c.lat); if (hash(c.lon * 9.1 + c.lat) < 0.35) continue; const a = hash(c.lat * 4.4) * 6.283, d = 2.4 + hash(c.lon * 2.2) * 1.4; centros.push([p[0] * K + Math.cos(a) * d, p[1] * K + Math.sin(a) * d, c.lon * 2.3]); }
  for (let q = 0, n = 0; q < 4000 && n < 45; q++) { const x = OX + hash(q * 3.3 + 0.5) * ANCHO, z = OZ + hash(q * 7.1 + 0.2) * ALTO, s = sitioPasto(x, z); if (s && s.estepa) { centros.push([x, z, q * 0.37]); n++; } }
  const trozos = new Map();
  for (const [cx, cz, sem] of centros) {
    const s = sitioPasto(cx, cz); if (!s) continue;
    const u = hash(sem * 1.3), tipo = s.monte ? (u < 0.75 ? 'capra' : 'ovis') : s.estepa || s.seco ? (u < 0.7 ? 'ovis' : 'capra') : (u < 0.45 ? 'bos' : 'ovis');
    if (!V[tipo]) continue;
    const n = tipo === 'bos' ? 3 + Math.floor(hash(sem * 2.1) * 3) : 5 + Math.floor(hash(sem * 2.1) * 4), giro = hash(sem * 4.7) * 6.283, esc = tipo === 'bos' ? 1.15 : 0.85;
    const key = Math.floor(cx / 30) + ',' + Math.floor(cz / 30); let tr = trozos.get(key); if (!tr) trozos.set(key, tr = []);
    for (let i = 0; i < n; i++) {
      const x = cx + (hash(sem + i * 1.7) - 0.5) * 0.9, z = cz + (hash(sem + i * 2.9) - 0.5) * 0.7; if (!sitioPasto(x, z)) continue;
      const pel = PELO[tipo]; col.set(pel[Math.floor(hash(sem + i * 5.5) * pel.length)]);
      M.compose(P.set(x, Math.max(0.03, vista.hAt(x, z)) - 0.01, z), Q.setFromAxisAngle(Y, giro + (hash(sem + i * 3.1) - 0.5) * 1.6), S.setScalar(esc * (0.9 + hash(sem + i) * 0.2)));
      tr.push([M.clone(), col.clone()]);
    }
  }
  const gA = animalGeo(), mA = materialGanado();
  for (const tr of trozos.values()) {
    if (!tr.length) continue; const im = new THREE.InstancedMesh(gA, mA, tr.length);
    tr.forEach(([m, c], i) => { im.setMatrixAt(i, m); im.setColorAt(i, c); }); im.computeBoundingSphere(); grupo.add(im); r.rebanos.push(im);
  }
  r.cabezas = r.rebanos.reduce((a, m) => a + m.count, 0);
  // --- humo: una columna en cada pueblo (dos en los grandes) y una en cada ciudad (escondida si la ciudad no está en la partida) ---
  if (V.fumus) {
    const sitios = [];
    for (const id in (D.TRIBUS || {})) { const t = D.TRIBUS[id], p = D.proj(t.lon, t.lat), x = p[0] * K, z = p[1] * K; sitios.push([x + 0.15, z - 0.1, 1.0, null]); if (t.casa !== 'mapalia') sitios.push([x - 0.55, z + 0.35, 0.75, null]); }
    for (const id in D.CITIES) { const c = D.CITIES[id], p = D.proj(c.lon, c.lat); sitios.push([p[0] * K + 0.55, p[1] * K - 0.35, 1.15, id]); }
    const g = new THREE.PlaneGeometry(1, 1, 1, 6); g.translate(0, 0.5, 0); g.deleteAttribute('normal'); g.deleteAttribute('uv');
    const im = new THREE.InstancedMesh(g, materialHumo(), sitios.length);
    sitios.forEach(([x, z, s, id], i) => { M.compose(P.set(x, Math.max(0.05, vista.hAt(x, z)) + 0.3 * s, z), Q.identity(), S.setScalar(s)); im.setMatrixAt(i, M); if (id) r.humoCiudad.push([i, id, M.clone()]); });
    im.computeBoundingSphere(); im.boundingSphere.radius += 3; im.renderOrder = 2; grupo.add(im); r.humo = im;
  }
  // --- mercantes (dos por ruta de mar, que van y vuelven) y carros (uno por calzada), en UNA malla: cada instancia lleva las dos
  //     formas y el sombreador aplasta la que no le toca (aTipo 0 barco, 1 carro): una llamada de dibujo para todos ---
  if (V.oneraria) for (const id in (D.RUMBOS || {})) { const rc = recorrido(D.RUMBOS[id].p); for (let k = 0; k < 2; k++) r.rutasMar.push({ rc, ph: rc.L * (k ? 0.95 : 0.15) + hash(rc.L) * 3 }); }
  if (V.plaustrum) for (const id in (D.CALZADAS || {})) { const c = D.CALZADAS[id]; r.rutasTierra.push({ id, rc: recorrido(c.p), ph: hash(c.p.length * 3.3) * 40 }); }
  const nV = r.rutasMar.length + r.rutasTierra.length;
  if (nV) {
    const gb = mercanteGeo(), gc = carroGeo(), g = unir([gb, gc]), pa = new Float32Array(g.attributes.position.count); pa.fill(1, gb.attributes.position.count); g.setAttribute('aParte', new THREE.BufferAttribute(pa, 1));
    const ti = new Float32Array(nV); ti.fill(1, r.rutasMar.length); g.setAttribute('aTipo', new THREE.InstancedBufferAttribute(ti, 1));
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true });
    m.onBeforeCompile = sh => { sh.vertexShader = 'attribute float aParte, aTipo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n      if (abs(aParte - aTipo) > 0.5) transformed = vec3(0.0);'); };
    const im = new THREE.InstancedMesh(g, m, nV); im.frustumCulled = false; grupo.add(im); r.viajeros = im;
    r.rutasMar.forEach((o, i) => { o.i = i; }); r.rutasTierra.forEach((o, i) => { o.i = r.rutasMar.length + i; });
  }
  return r;
}
/* C13 · mueve mercantes y carros y ajusta el humo (solo lo que se ve; lo llama update) */
const _vp = [0, 0, 0], _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _P = new THREE.Vector3(), _S = new THREE.Vector3();
function vidaMover(vista, vd, t, state) {
  const dist = vista.c.dist;
  const vaiven = (o, vel, sobre, esc, hy, cab) => {   // ida y vuelta a velocidad fija; al volver, gira la proa
    const L = o.rc.L, u = (t * vel + o.ph) % (2 * L), d = u < L ? u : 2 * L - u; enRecorrido(o.rc, d, _vp);
    const x = _vp[0], z = _vp[1], y = sobre ? Math.max(0.03, vista.hAt(x, z)) + hy : hy;
    _E.set(0, _vp[2] + (u < L ? 0 : Math.PI), cab ? Math.sin(t * 1.1 + o.ph) * 0.06 : 0); _M.compose(_P.set(x, y + (cab ? Math.sin(t * 1.4 + o.ph) * 0.015 : 0), z), _Q.setFromEuler(_E), _S.setScalar(esc)); return _M;
  };
  if (vd.viajeros) {   // los barcos se ven hasta Italia entera; los carros, solo de cerca (fuera de su distancia, o sin calzada aún, escala 0)
    const barcos = dist < 175, carros = dist < 70; vd.viajeros.visible = barcos || carros;
    if (vd.viajeros.visible) {
      const eb = Math.min(2.6, Math.max(1, dist / 40)), ec = Math.min(2, Math.max(1, dist / 22)), anio = D.anio || D.START_YEAR || 280;
      for (const o of vd.rutasMar) vd.viajeros.setMatrixAt(o.i, vaiven(o, 0.35, false, barcos ? eb : 0, 0.02, true));
      for (const o of vd.rutasTierra) { const c = D.CALZADAS[o.id], hecha = !c.anio || anio <= c.anio; vd.viajeros.setMatrixAt(o.i, vaiven(o, 0.12, true, carros && hecha ? ec : 0, 0.1, false)); }
      vd.viajeros.instanceMatrix.needsUpdate = true;
    }
  }
  if (vd.humo) {
    const op = ss(85, 55, dist) * ss(3, 6, dist); vd.humo.material.uniforms.uOp.value = op; vd.humo.visible = op > 0.01;
    const firma = Object.keys(state.cities).length + '|' + vista.firmaMundo;
    if (vd.humo.visible && vd.humoFirma !== firma) { vd.humoFirma = firma; for (const [i, id, m] of vd.humoCiudad) vd.humo.setMatrixAt(i, state.cities[id] ? m : _M.makeScale(0, 0, 0)); vd.humo.instanceMatrix.needsUpdate = true; }
  }
  for (const m of vd.rebanos) m.visible = dist < 48;
}

function aguaMask() {
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH; const g = cv.getContext('2d', { willReadFrequently: true }), px = lo => (lo - LON0) / DLON * 2 + 0.5, py = la => (LAT1 - la) / DLAT * 2 + 0.5;
  g.fillStyle = '#000'; g.fillRect(0, 0, AW, AH); g.globalCompositeOperation = 'lighten'; g.lineJoin = g.lineCap = 'round';
  const linea = (l, w, v) => { g.beginPath(); l.forEach((q, i) => i ? g.lineTo(px(q[0]), py(q[1])) : g.moveTo(px(q[0]), py(q[1]))); g.lineWidth = w; g.strokeStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.stroke(); };
  for (const r of AGUA.rios) for (const l of r.l) linea(l, 2 * r.w + 3.2, 62);
  for (const lg of AGUA.lagos) { const p = lg.p.concat([lg.p[0]]); linea(p, 3.6, 62); }
  for (const r of AGUA.rios) for (const l of r.l) linea(l, 2 * r.w + 0.9, 255);
  for (const lg of AGUA.lagos) { g.beginPath(); lg.p.forEach((q, i) => i ? g.lineTo(px(q[0]), py(q[1])) : g.moveTo(px(q[0]), py(q[1]))); g.closePath(); g.fillStyle = '#fff'; g.fill(); }
  const im = g.getImageData(0, 0, AW, AH).data, d = new Uint8Array(AW * AH); for (let k = 0; k < d.length; k++) d[k] = im[k * 4];
  return d;
}
/* Mar con orillas: la distancia firmada a la costa (casillas; negativa en tierra) se hornea en una textura de 8 bits a DOBLE resolución
   (el campo se interpola entre nodos y el cruce por cero sigue la costa) y el sombreador del propio plano de mar dibuja con ella
   franjas de espuma que suben y bajan (más ruido y tiempo) y agua clara en el bajío. Sin triángulos nuevos. */
function mar(dist, land) {
  const TW = 2 * NX + 1, TH = 2 * NZ + 1, W1 = NX + 1, data = new Uint8Array(TW * TH), sd = k => land[k] ? -dist[k] : dist[k];
  for (let b = 0; b < TH; b++) for (let a = 0; a < TW; a++) {
    const i = Math.min(NX - 1, a >> 1), j = Math.min(NZ - 1, b >> 1), u = (a - 2 * i) / 2, v = (b - 2 * j) / 2, k = j * W1 + i;
    const q = (sd(k) * (1 - u) + sd(k + 1) * u) * (1 - v) + (sd(k + W1) * (1 - u) + sd(k + W1 + 1) * u) * v;
    data[b * TW + a] = Math.round((Math.max(-2, Math.min(6, q)) + 2) / 8 * 255);
  }
  const tD = new THREE.DataTexture(data, TW, TH, THREE.RedFormat, THREE.UnsignedByteType); tD.magFilter = tD.minFilter = THREE.LinearFilter; tD.wrapS = tD.wrapT = THREE.ClampToEdgeWrapping; tD.generateMipmaps = false; tD.needsUpdate = true;
  const m = new THREE.MeshPhongMaterial({ color: '#2f7fa6', transparent: true, opacity: 0.78, shininess: 90, specular: '#bfe6ff' }), tN = texturaRuido();
  m.onBeforeCompile = sh => {
    sh.uniforms.tD = { value: tD }; sh.uniforms.tN = { value: tN }; sh.uniforms.uTiempo = uTime;
    sh.vertexShader = 'varying vec2 vXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vXZ = (modelMatrix * vec4(position, 1.0)).xz;');
    sh.fragmentShader = 'uniform sampler2D tD, tN; uniform float uTiempo; varying vec2 vXZ; float gEsp = 0.0;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec2 uv = vec2(((vXZ.x - ${OX.toFixed(4)}) / ${CW.toFixed(5)} * 2.0 + 0.5) / ${TW}.0, ((vXZ.y - ${OZ.toFixed(4)}) / ${CH.toFixed(5)} * 2.0 + 0.5) / ${TH}.0);
        float dentro = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        float sd = mix(9.0, texture2D(tD, clamp(uv, 0.0, 1.0)).r * 8.0 - 2.0, dentro);
        float n = texture2D(tN, vXZ * 0.23 + vec2(uTiempo * 0.012, -uTiempo * 0.008)).r, n2 = texture2D(tN, vXZ * 0.9 - vec2(uTiempo * 0.02, 0.0)).b;
        float baj = 1.0 - smoothstep(0.0, 3.4, sd);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.40, 0.80, 0.82), baj * 0.65);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.79, 0.58), (1.0 - smoothstep(0.2, 1.6, sd)) * 0.7);   // C15: aguas someras color arena junto a la orilla
        diffuseColor.a = mix(diffuseColor.a, 0.5, baj * baj);
        float borde = 0.4 + 0.5 * (0.5 + 0.5 * sin(uTiempo * 0.9 + n * 6.28));
        float f0 = (1.0 - smoothstep(borde - 0.3, borde, sd)) * (0.6 + 0.4 * n2);
        float p1 = 1.5 + 0.7 * sin(uTiempo * 0.6 + n * 5.0 + 1.7), f1 = (1.0 - smoothstep(0.05, 0.2, abs(sd - p1))) * smoothstep(0.3, 0.6, n2 + 0.25 * n);
        float p2 = 2.8 + 0.8 * sin(uTiempo * 0.45 + n * 4.0 + 3.1), f2 = (1.0 - smoothstep(0.04, 0.15, abs(sd - p2))) * smoothstep(0.5, 0.75, n2) * 0.7;
        gEsp = clamp(f0 + f1 + f2, 0.0, 1.0) * step(-0.15, sd) * dentro;
        diffuseColor.a = mix(diffuseColor.a, 0.97, gEsp);
      }`).replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, vec3(1.0), gEsp * 0.9);\n#include <opaque_fragment>');
  };
  return m;
}
/* Línea sobre el relieve cada ~0,4 unidades (rutas de comercio, caminos y marchas): una sola función para todas */
function trazo(vista, pa, pb, alto) {
  const dx = (pb[0] - pa[0]) * K, dz = (pb[1] - pa[1]) * K, n = Math.max(2, Math.ceil(Math.hypot(dx, dz) / 0.4)), pts = [];
  for (let i = 0; i <= n; i++) { const x = pa[0] * K + dx * i / n, z = pa[1] * K + dz * i / n; pts.push(new THREE.Vector3(x, Math.max(0.03, vista.hAt(x, z)) + alto, z)); }
  return pts;
}

/* Cinta plana sobre el relieve (K7a): como trazo(), pero con grosor, que las líneas de WebGL miden siempre 1 px */
function cinta(vista, pa, pb, alto, ancho) {
  const pts = trazo(vista, pa, pb, alto), dx = pb[0] - pa[0], dz = pb[1] - pa[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * ancho / 2, nz = dx / l * ancho / 2, pos = [], idx = [];
  pts.forEach((q, i) => { pos.push(q.x + nx, q.y, q.z + nz, q.x - nx, q.y, q.z - nz); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
/* grosor según la renta mensual: de 0,14 (ruta pobre) a 0,5 (ruta de 30 o más) */
const anchoRuta = renta => Math.round((0.14 + Math.min(1, Math.max(0, (renta - 4) / 26)) * 0.36) * 20) / 20;

function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0; return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t); }

/* C16 · Ciudades grandes. Cada ciudad del mapa es un racimo: muralla que crece con su población y con su nivel de muralla, y casas.
   De lejos, una «mancha» de casitas dibujadas por código; de cerca, casas de 0 A.D. (Wildfire Games, CC BY-SA 3.0) de su cultura.
   Todo va instanciado: una llamada por tipo de muralla, de mancha y de casa para TODAS las ciudades. */
const RAC_MAX = 96, CASAS_MAX = 400, RAC_TRI_CIUDAD = 11000, RAC_TRI_TOTAL = 60000;   // ciudades; casas de un tipo a la vez; triángulos de casas por ciudad (tope de arte.json: 12 000 por edificio) y en pantalla
const RAC_GRANDES = { roma: 1, carthago: 1, syracusae: 1, capua: 1 };
const RAC_CASAS = { roma: ['casa_b', 'casa_c', 'casa_d'], grie: ['grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_casa_d', 'grie_casa_e'], cart: ['cart_casa', 'cart_casa_b', 'cart_casa_c'] };
const RAC_MANCHA = { roma: 'tejas', grie: 'tejas', cart: 'plana', iber: 'plana', galo: 'choza' };
const RAC_PIEDRA = { roma: '#d9cdb1', grie: '#e8e2d2', cart: '#dcc69c', iber: '#c9ad85', galo: '#8f6e48' };
const RAC_TEJA = { roma: '#b0553a', grie: '#b86a48', cart: '#cdb98f', iber: '#a98a62', galo: '#8a7448' };   // tejados sobrios por cultura (las casas reales llevan este color donde 0 A.D. pone el del bando)
const RAC_TRI = { roma: 780, grie: 500, cart: 330 };   // triángulos medios de una casa de 0 A.D. de cada cultura
const culturaDe = dueno => dueno === 'roma' ? 'roma' : (CULTURA[dueno] || 'roma');
/* tamaño de 0 (aldea) a 1 (gran ciudad): peso de la ciudad, población y, para Roma, Cartago, Siracusa y Capua, un plus */
function racTam(id, st) {
  const d = D.CITIES[id] || {}, g = RAC_GRANDES[id] ? 1 : 0, base = g ? 0.8 : 0.15 + 0.1 * Math.min(5, d.w || 1);
  const pop = Math.max(1, st.pop || 0), pt = Math.max(0, Math.min(1, Math.log2(pop / 150) / 4));
  return Math.max(0.05, Math.min(1, 0.55 * base + 0.45 * pt + 0.15 * g - (d.colonia ? 0.08 : 0)));
}
/* une piezas sueltas en una sola geometría sin índices, con color por vértice */
function fundir(piezas) {
  const P = [], N = [], C = [], col = new THREE.Color();
  for (const [g0, hex] of piezas) {
    const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); col.set(hex); const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); } for (let i = 0; i < p.length / 3; i++) C.push(col.r, col.g, col.b);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return geo;
}
/* muralla de radio 1 y alto 1 (la instancia la escala): empalizada sin torres, muro con 6 torres o muro alto con 10 torres y puerta */
function murallaGeo(tipo) {
  const pz = [], seg = tipo === 'empalizada' ? 16 : 24, nt = tipo === 'muro' ? 6 : tipo === 'alto' ? 10 : 0;
  const muro = new THREE.CylinderGeometry(1, 1.04, 1, seg, 1, true); muro.translate(0, 0.5, 0); pz.push([muro, tipo === 'empalizada' ? '#ffffff' : '#f4f1ea']);
  if (tipo !== 'empalizada') { const paseo = new THREE.RingGeometry(0.93, 1, seg, 1); paseo.rotateX(-Math.PI / 2); paseo.translate(0, 1, 0); pz.push([paseo, '#cfc9bc']); }
  for (let i = 0; i < nt; i++) { const a = (i + 0.5) / nt * 6.283, t = new THREE.BoxGeometry(0.13, 1.4, 0.13); t.translate(Math.cos(a) * 1.0, 0.7, Math.sin(a) * 1.0); pz.push([t, '#e2ddd2']); }
  if (tipo === 'alto') for (const da of [-0.13, 0.13]) { const a = Math.PI / 2 + da, t = new THREE.BoxGeometry(0.17, 1.7, 0.17); t.translate(Math.cos(a), 0.85, Math.sin(a)); pz.push([t, '#d8d2c4']); }
  return fundir(pz);
}
/* la mancha de lejos: casitas de radio 1 (sin el centro, donde va el edificio principal). tejas: casa y tejado a cuatro aguas; plana: azoteas; choza: redondas con paja */
function manchaGeo(tipo) {
  const pz = [], n = tipo === 'choza' ? 13 : 18;
  for (let i = 0; i < n; i++) {
    const rr = Math.sqrt(0.12 + (i + 0.5) / n * 0.6), a = i * 2.39996 + 0.4, x = Math.cos(a) * rr, z = Math.sin(a) * rr, w = 0.15 + hash(i * 3.3 + 1) * 0.1, h = 0.12 + hash(i * 5.1 + 2) * 0.16;
    if (tipo === 'choza') { const m = new THREE.CylinderGeometry(w * 0.6, w * 0.6, h * 0.7, 6, 1, true); m.translate(x, h * 0.35, z); pz.push([m, '#bba987']); const t = new THREE.ConeGeometry(w * 0.75, h * 0.8, 6, 1, true); t.translate(x, h * 0.7 + h * 0.4, z); pz.push([t, '#a48c5c']); continue; }
    const b = new THREE.BoxGeometry(w, h, w * (0.8 + hash(i * 1.7) * 0.5)); b.rotateY(a); b.translate(x, h / 2, z); pz.push([b, tipo === 'plana' ? '#ece2c9' : '#efe6d0']);
    if (tipo === 'tejas') { const t = new THREE.ConeGeometry(w * 0.78, 0.09, 4, 1, true); t.rotateY(a + Math.PI / 4); t.translate(x, h + 0.045, z); pz.push([t, '#b4573a']); }
    else if (hash(i * 9.3) > 0.55) { const t = new THREE.BoxGeometry(w * 0.45, 0.07, w * 0.45); t.rotateY(a); t.translate(x, h + 0.035, z); pz.push([t, '#d9cbaa']); }
  }
  return fundir(pz);
}

/* C9 · El terreno entero tiene ~460 mil triángulos: se parte en trozos de TROZO×TROZO casillas, cada uno un THREE.LOD con tres niveles
   (todas las casillas, una de cada dos, una de cada cuatro) que comparten los mismos vértices y solo cambian los índices. Los trozos
   fuera de pantalla no se dibujan y los lejanos van con menos detalle. Un faldón que baja 0,6 bajo el borde tapa las rendijas entre
   trozos de distinto nivel. Las normales se calculan antes, en la malla entera, para que no se vean las juntas. */
const LOD_DIST = [0, 58, 190];
function trozos(g, mat) {
  const grp = new THREE.Group(), W1 = NX + 1, A = g.attributes, nom = ['position', 'normal', 'color', 'aT'];
  for (let j0 = 0; j0 < NZ; j0 += TROZO) for (let i0 = 0; i0 < NX; i0 += TROZO) {
    const ni = Math.min(TROZO, NX - i0), nj = Math.min(TROZO, NZ - j0), w = ni + 1, h = nj + 1, borde = [];
    for (let i = 0; i < ni; i++) borde.push([i, 0]); for (let j = 0; j < nj; j++) borde.push([ni, j]); for (let i = ni; i > 0; i--) borde.push([i, nj]); for (let j = nj; j > 0; j--) borde.push([0, j]);
    const n = w * h + borde.length, at = {}; for (const k of nom) at[k] = new Float32Array(n * 3);
    const copia = (dst, a, b) => { const src = (j0 + b) * W1 + i0 + a; for (const k of nom) { const s = A[k].array; at[k][dst * 3] = s[src * 3]; at[k][dst * 3 + 1] = s[src * 3 + 1]; at[k][dst * 3 + 2] = s[src * 3 + 2]; } };
    for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) copia(b * w + a, a, b);
    borde.forEach((q, m) => { copia(w * h + m, q[0], q[1]); at.position[(w * h + m) * 3 + 1] -= 0.6; });
    const geo = new THREE.BufferGeometry(); for (const k of nom) geo.setAttribute(k, new THREE.BufferAttribute(at[k], 3));
    const lod = new THREE.LOD(), cx = OX + (i0 + ni / 2) * CW, cz = OZ + (j0 + nj / 2) * CH;
    [1, 2, 4].forEach((st, nv) => {
      const idx = [], v = (a, b) => b * w + a;
      for (let b = 0; b < nj; b += st) for (let a = 0; a < ni; a += st) { const p = v(a, b), q = v(a + st, b), r = v(a, b + st), t = v(a + st, b + st); idx.push(p, r, q, q, r, t); }
      for (let m = 0; m < borde.length; m += st) { const m2 = (m + st) % borde.length, a = v(...borde[m]), b = v(...borde[m2]), a2 = w * h + m, b2 = w * h + m2; idx.push(a, b, a2, b, b2, a2, a, a2, b, b, a2, b2); }
      const gl = new THREE.BufferGeometry(); for (const k of nom) gl.setAttribute(k, geo.attributes[k]); gl.setIndex(idx); gl.computeBoundingSphere();
      const me = new THREE.Mesh(gl, mat); me.position.set(0, 0, 0); lod.addLevel(me, LOD_DIST[nv]);
    });
    // el LOD mide la distancia a su propia posición: se pone en el centro del trozo y se devuelve la malla a su sitio
    lod.position.set(cx, 0, cz); lod.children.forEach(me => me.position.set(-cx, 0, -cz)); grp.add(lod);
  }
  return grp;
}

/* Cultura de cada bando -> prefijo de sus piezas de 0 A.D. (los que no figuran conservan las casitas) */
const CENTRO = { cart: 'cart_templo', grie: 'grie_templo', galo: 'galo_centro', iber: 'iber_centro', roma: 'vesta' };
const claveCentro = dueno => CENTRO[dueno === 'roma' ? 'roma' : CULTURA[dueno]] || null;
const claveBarco = dueno => (CULTURA[dueno] === 'cart' || CULTURA[dueno] === 'grie') ? CULTURA[dueno] + '_trirreme' : 'trirreme';

const ZOOM_CIUDAD = 19;   // C1: por debajo de esta distancia de cámara, sobre una ciudad propia, se abre la ciudad
export class MapView3D {
  constructor(host, opts) {
    this.host = host; this.opts = opts || {};
    this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.1;
    this.cv = this.r.domElement; this.cv.className = 'gl'; host.insertBefore(this.cv, host.firstChild);
    this.labels = document.createElement('div'); this.labels.className = 'mlabels'; host.insertBefore(this.labels, this.cv.nextSibling);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(40, 1, 0.5, 600);
    const p = G.pos('roma'); this.c = { x: p[0] * K, z: p[1] * K, dist: 46, pitch: 0.95 };
    this.esc = { zona: null, pila: [], anim: null, zEls: {}, clave: '' };   // C6: escalón actual, pila de «volver» y animación de cámara
    this.migas = document.createElement('div'); this.migas.className = 'mmigas'; host.insertBefore(this.migas, this.labels.nextSibling);
    this.migas.addEventListener('click', ev => { if (ev.target.closest('[data-volver]')) { ev.stopPropagation(); this.volver(); } });
    this.build(); this.bind(); this.resize(); this.armies = new Map(); this.t = 0; this.last = performance.now();
  }

  build() {
    const sc = this.scene;
    sc.background = new THREE.Color('#0d1a26'); sc.fog = new THREE.Fog('#27455c', 90, 260);
    sc.add(new THREE.HemisphereLight('#eaf2ff', '#5a4a30', 1.2));
    const sun = new THREE.DirectionalLight('#fff1d6', 2.4); sun.position.set(-60, 90, 40); sc.add(sun);
    // --- máscara de tierra y distancia a la costa ---
    const land = new Uint8Array((NX + 1) * (NZ + 1)), polys = COSTA;          // costa: Natural Earth 50m, recortada y simplificada
    const lonOf = i => LON0 + i * DLON, latOf = j => LAT1 - j * DLAT;
    // relleno por líneas: para cada fila, cruces con los lados de la costa y tramos de tierra entre pares
    for (let j = 0; j <= NZ; j++) {
      const la = latOf(j), xs = [];
      for (const p of polys) for (let q = 0, n = p.length; q < n; q++) { const a = p[q], b = p[(q + 1) % n]; if ((a[1] > la) !== (b[1] > la)) xs.push((b[0] - a[0]) * (la - a[1]) / (b[1] - a[1]) + a[0]); }
      xs.sort((u, v) => u - v);
      for (let q = 0; q + 1 < xs.length; q += 2) { const i0 = Math.max(0, Math.ceil((xs[q] - LON0) / DLON)), i1 = Math.min(NX, Math.floor((xs[q + 1] - LON0) / DLON)); for (let i = i0; i <= i1; i++) land[j * (NX + 1) + i] = 1; }
    }
    const dist = new Float32Array(land.length), W1 = NX + 1;
    for (let k = 0; k < land.length; k++) dist[k] = 99;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i, me = land[k]; if ((i > 0 && land[k - 1] !== me) || (i < NX && land[k + 1] !== me) || (j > 0 && land[k - W1] !== me) || (j < NZ && land[k + W1] !== me)) dist[k] = 0.5; }
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i; if (i > 0) dist[k] = Math.min(dist[k], dist[k - 1] + 1); if (j > 0) dist[k] = Math.min(dist[k], dist[k - W1] + 1); if (i > 0 && j > 0) dist[k] = Math.min(dist[k], dist[k - W1 - 1] + 1.4); if (i < NX && j > 0) dist[k] = Math.min(dist[k], dist[k - W1 + 1] + 1.4); }
      for (let j = NZ; j >= 0; j--) for (let i = NX; i >= 0; i--) { const k = j * W1 + i; if (i < NX) dist[k] = Math.min(dist[k], dist[k + 1] + 1); if (j < NZ) dist[k] = Math.min(dist[k], dist[k + W1] + 1); if (i < NX && j < NZ) dist[k] = Math.min(dist[k], dist[k + W1 + 1] + 1.4); if (i > 0 && j < NZ) dist[k] = Math.min(dist[k], dist[k + W1 - 1] + 1.4); }
    }
    // distancia exacta a la costa cerca del litoral (costa suave en vez de escalonada)
    const segs = []; for (const p of polys) for (let q = 0; q < p.length; q++) { const a = p[q], b = p[(q + 1) % p.length]; if ((a[0] === b[0] && (a[0] <= LON0 + 0.01 || a[0] >= LON1 - 0.01)) || (a[1] === b[1] && (a[1] >= LAT1 - 0.01 || a[1] <= LAT0 + 0.01))) continue; segs.push([a[0], a[1] * 1.28, b[0], b[1] * 1.28]); }
    const cellDeg = CW / K / 50;
    const BK = 0.5, bucket = new Map(), bkey = (u, v) => u * 1000 + v;                 // segmentos en casillas de 0,5° para no recorrerlos todos
    for (const sg of segs) { const u0 = Math.floor((Math.min(sg[0], sg[2]) - 0.3) / BK), u1 = Math.floor((Math.max(sg[0], sg[2]) + 0.3) / BK), v0 = Math.floor((Math.min(sg[1], sg[3]) - 0.3) / BK), v1 = Math.floor((Math.max(sg[1], sg[3]) + 0.3) / BK); for (let u = u0; u <= u1; u++) for (let v = v0; v <= v1; v++) { const kk = bkey(u, v); (bucket.get(kk) || bucket.set(kk, []).get(kk)).push(sg); } }
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i; if (dist[k] > 3.2) continue; const lo = lonOf(i), la = latOf(j) * 1.28, near = bucket.get(bkey(Math.floor(lo / BK), Math.floor(la / BK))); let best = 9; if (near) for (const sgm of near) { const dd = segDist(lo, la, [sgm[0], sgm[1]], [sgm[2], sgm[3]]); if (dd < best) best = dd; } dist[k] = Math.min(dist[k] + 0.5, best / cellDeg); }
    // --- C4: ríos y lagos (máscara de agua) ---
    const AG = aguaMask(), agu = (i, j) => AG[(2 * j) * AW + 2 * i] / 255, aguaXZ = (x, z) => AG[Math.max(0, Math.min(AH - 1, Math.round((z - OZ) / CH * 2))) * AW + Math.max(0, Math.min(AW - 1, Math.round((x - OX) / CW * 2)))] / 255;
    for (const id in D.CITIES) { const c = D.CITIES[id], cx = (c.lon - LON0) / DLON * 2, cz = (LAT1 - c.lat) / DLAT * 2; if (AG[Math.round(cz) * AW + Math.round(cx)] < 90) continue;   // ciudad dentro del agua: se aparta el agua en un disco de ~1 casilla
      for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) if (a * a + b * b <= 9) { const q = (Math.round(cz) + b) * AW + Math.round(cx) + a; if (q >= 0 && q < AG.length) AG[q] = 0; } }
    // --- alturas ---
    const H = this.H = new Float32Array(land.length), metros = ALTURAS.metros(), cities = Object.keys(D.CITIES).map(id => [D.CITIES[id].lon, D.CITIES[id].lat]);
    const sua = t => t * t * (3 - 2 * t);
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const k = j * W1 + i, lo = lonOf(i), la = latOf(j), d = dist[k];
      if (!land[k]) { H[k] = -Math.min(d, 10) * 0.085; continue; }                  // mar: fondo suave, nunca bajo -0,85
      const n2 = Math.sin(lo * 9.7 + la * 4.1) * Math.cos(la * 11.3 - lo * 3.3), hm = Math.max(0, metros[k]) * ESCALA_V * realce(lo, la);
      // tierra: suelo mínimo con playa suave (solo a menos de 2,5 casillas de la costa) y altura real por encima, que sube con la distancia a la orilla
      H[k] = 0.05 + Math.min(d, 2.5) * 0.026 + hm * (0.4 + 0.6 * sua(Math.max(0, Math.min(1, (d - 0.5) / 2)))) + n2 * 0.035 * (0.3 + hm) * Math.min(1, d / 3);
    }
    // aplanado bajo cada ciudad a su altura local (media de la tierra en torno a ella), no a una cota fija
    for (const c of cities) {
      const ci = Math.round((c[0] - LON0) / DLON), cj = Math.round((LAT1 - c[1]) / DLAT); let s0 = 0, n0 = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const i = ci + a, j = cj + b; if (i >= 0 && i <= NX && j >= 0 && j <= NZ && land[j * W1 + i]) { s0 += H[j * W1 + i]; n0++; } }
      const hc = Math.max(0.1, n0 ? s0 / n0 : 0.1);
      for (let j = Math.max(0, cj - 8); j <= Math.min(NZ, cj + 8); j++) for (let i = Math.max(0, ci - 8); i <= Math.min(NX, ci + 8); i++) {
        const k = j * W1 + i; if (!land[k]) continue; const cd = Math.hypot(lonOf(i) - c[0], (latOf(j) - c[1]) * 1.28);
        if (cd < 0.5) { const t = (cd / 0.5) * (cd / 0.5); H[k] = hc + (H[k] - hc) * t; }
      }
    }
    // C4: cauce un poco hundido junto a los ríos y lagos planos (nivel del nodo más bajo del lago); las ciudades conservan su meseta
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i, w = agu(i, j); if (w < 0.1 || !land[k] || dist[k] < 1) continue; let cd = 9; for (const c of cities) cd = Math.min(cd, Math.hypot(lonOf(i) - c[0], (latOf(j) - c[1]) * 1.28)); if (cd < 0.5) continue; H[k] = Math.max(0.045, H[k] - 0.06 * Math.min(1, w * 1.3)); }
    for (const lg of AGUA.lagos) {
      const xs = lg.p.map(q => q[0]), ys = lg.p.map(q => q[1]), nodos = []; let mn = 9;
      for (let j = Math.max(0, Math.floor((LAT1 - Math.max(...ys)) / DLAT)); j <= Math.min(NZ, Math.ceil((LAT1 - Math.min(...ys)) / DLAT)); j++) for (let i = Math.max(0, Math.floor((Math.min(...xs) - LON0) / DLON)); i <= Math.min(NX, Math.ceil((Math.max(...xs) - LON0) / DLON)); i++) {
        const k = j * W1 + i; if (!land[k] || !puntoEn(lonOf(i), latOf(j), lg.p)) continue; nodos.push(k); mn = Math.min(mn, H[k]); }
      for (const k of nodos) H[k] = Math.max(0.045, mn - 0.02);
    }
    this.metros = metros;
    // --- malla del terreno ---
    const g = new THREE.PlaneGeometry(ANCHO, ALTO, NX, NZ); g.rotateX(-Math.PI / 2); g.translate(OX + ANCHO / 2, 0, OZ + ALTO / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), aT = new Float32Array(pos.count * 3), c = new THREE.Color();
    const cSand = new THREE.Color('#d9c48e'), cGrass = new THREE.Color('#7f9a4a'), cDry = new THREE.Color('#b3a25e'), cForest = new THREE.Color('#4f7438'), cRock = new THREE.Color('#8b7d66'), cSnow = new THREE.Color('#f4f4f0'), cPad = new THREE.Color('#93b252'), cEst = new THREE.Color('#cdb866'), cDes1 = new THREE.Color('#e2cd98'), cDes2 = new THREE.Color('#c9a467'), cMar = new THREE.Color('#6c8b5a'), cVega = new THREE.Color('#6f9a3e'), cBed = new THREE.Color('#c9b98a'), cDeep = new THREE.Color('#2b4a5e');
    for (let k = 0; k < pos.count; k++) {
      const i = k % W1, j = Math.floor(k / W1), h = H[k], la = latOf(j), lo = lonOf(i); pos.setY(k, h);
      if (!land[k]) c.copy(cSand).lerp(cBed, Math.min(1, -h / 0.12)).lerp(cDeep, Math.min(1, -h / 0.55));
      else {
        const dry = Math.max(0, Math.min(1, (39.5 - la) / 4 + (lo < 0 ? 0.35 : 0))), f = 0.5 + 0.5 * Math.sin(lo * 5.3 + la * 7.1);
        const B = bioma(lo, la, metros[k], dist[k]), seco = Math.min(1, dry * (1 - B.pad) + B.est * 0.8 + B.des) * (1 - 0.8 * B.vega);
        c.copy(cGrass).lerp(cForest, f * (1 - seco) * 0.7 * (1 - B.pad)).lerp(cDry, dry * 0.85 * (1 - B.pad)).lerp(cPad, B.pad * 0.85).lerp(cEst, B.est * 0.75).lerp(cDes1, B.des * 0.9).lerp(cDes2, B.des * 0.8 * Math.max(0, Math.sin(lo * 13.1 + la * 6.7) * 0.5 + 0.5)).lerp(cMar, B.mar * 0.8).lerp(cVega, B.vega * 0.85);
        if (dist[k] < 1.6) c.lerp(cSand, 1 - dist[k] / 1.6);
        if (h > 0.9) c.lerp(cRock, Math.min(1, (h - 0.9) / 0.9)); if (h > 2.3) c.lerp(cSnow, Math.min(1, (h - 2.3) / 0.6));
        c.multiplyScalar(0.92 + hash(k) * 0.16);
        aT[k * 3] = seco; aT[k * 3 + 1] = (1 - Math.min(1, Math.max(0, (h - 1.2) / 1.0))) * Math.min(1, dist[k] / 0.9);   // textura: más seca / fuerza (menos en roca, nieve y orilla)
      }
      aT[k * 3 + 2] = land[k] ? dist[k] : -dist[k];   // distancia firmada a la costa: el sombreador pinta la playa con ella
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 3)); g.computeVertexNormals();
    const tW = new THREE.DataTexture(AG, AW, AH, THREE.RedFormat, THREE.UnsignedByteType); tW.magFilter = tW.minFilter = THREE.LinearFilter; tW.wrapS = tW.wrapT = THREE.ClampToEdgeWrapping; tW.generateMipmaps = false; tW.needsUpdate = true;
    this.terr = mapaMaterial(tW, new THREE.Vector4(CW, CH, AW, AH), new THREE.Vector2(OX, OZ)); this.terreno = trozos(g, this.terr); sc.add(this.terreno); g.dispose();
    // --- mar ---
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1000, 800), mar(dist, land));
    sea.rotation.x = -Math.PI / 2; sea.position.set(OX + ANCHO / 2, 0, OZ + ALTO / 2); sc.add(sea);
    // C5a: marco de carta antigua. Fuera del mundo, pergamino; dentro, viñeta sepia en los bordes (más fuerte al alejarse)
    this.marco = { value: 0 };
    this.nieblaMarco = { c: { value: new THREE.Color() }, d: { value: new THREE.Vector3(1e4, 2e4, 0) } };   // C15: color, cerca, lejos y fuerza de la bruma
    const marcoMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uVig: this.marco, uAncho: { value: ANCHO }, uAlto: { value: ALTO }, uO: { value: new THREE.Vector2(OX, OZ) }, uNC: this.nieblaMarco.c, uND: this.nieblaMarco.d },
      vertexShader: 'varying vec2 vXZ; varying float vDc; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vXZ = w.xz; vec4 mv = viewMatrix * w; vDc = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `varying vec2 vXZ; varying float vDc; uniform float uVig, uAncho, uAlto; uniform vec2 uO; uniform vec3 uNC, uND;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          vec2 q = abs(vXZ - uO - vec2(uAncho, uAlto) * 0.5) - vec2(uAncho, uAlto) * 0.5;
          float d = max(q.x, q.y);                                   // <0 dentro del mundo, >0 fuera
          float ruido = vn(vXZ * 0.35) * 0.6 + vn(vXZ * 1.7) * 0.4;
          vec3 perg = mix(vec3(0.80, 0.68, 0.46), vec3(0.88, 0.77, 0.55), ruido);
          perg = mix(perg, vec3(0.36, 0.24, 0.11), smoothstep(2.0, 60.0, d) * 0.75);   // bordes quemados lejos
          float fuera = step(0.0, d);
          float tinta = (1.0 - smoothstep(0.0, 0.5, abs(d - 0.2))) + (1.0 - smoothstep(0.0, 0.25, abs(d - 2.2))) * 0.6;   // filete doble
          perg = mix(perg, vec3(0.25, 0.15, 0.06), clamp(tinta, 0.0, 1.0) * fuera);
          float vig = smoothstep(-9.0, 0.0, d) * 0.7 * uVig;
          float a = mix(vig, 1.0, fuera);
          // C15: con la cámara baja no hay pergamino: fuera del mundo todo es bruma, y la tierra se funde en ella en los últimos 35 de borde
          float nb = max(smoothstep(uND.x, uND.y, vDc), max(fuera, smoothstep(-35.0, 0.0, d))) * uND.z;
          gl_FragColor = vec4(mix(mix(vec3(0.30, 0.20, 0.09), perg, fuera), uNC, nb), mix(a, 1.0, nb));
        }` });
    const out = new THREE.Mesh(new THREE.PlaneGeometry(1000, 800), marcoMat); out.rotation.x = -Math.PI / 2; out.position.set(OX + ANCHO / 2, 3, OZ + ALTO / 2); out.renderOrder = 5; sc.add(out);
    // C15: cielo. Una esfera que sigue a la cámara, pintada por la altura de la mirada: en el horizonte, el color de la bruma; arriba, azul;
    // un brillo cálido hacia el sol. Se dibuja la primera y sin profundidad: el relieve la tapa. Solo con la cámara baja.
    this.cielo = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: { uH: { value: new THREE.Color('#c9d6da') }, uZ: { value: new THREE.Color('#6f9fcc') }, uS: { value: new THREE.Vector3(-0.55, 0.25, -0.8).normalize() } },
      vertexShader: 'varying vec3 vD; void main() { vD = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vD; uniform vec3 uH, uZ, uS;
        void main() { vec3 d = normalize(vD); float e = max(d.y, 0.0);
          vec3 c = mix(uH, uZ, smoothstep(0.0, 0.14, e));
          c = mix(c, vec3(1.0, 0.93, 0.78), pow(max(dot(d, uS), 0.0), 6.0) * 0.35 * (1.0 - smoothstep(0.0, 0.5, e)));
          gl_FragColor = vec4(c, 1.0); }` }));
    this.cielo.renderOrder = -10; this.cielo.frustumCulled = false; this.cielo.visible = false; sc.add(this.cielo);
    this.nieblaCarta = new THREE.Color('#27455c'); this.nieblaBaja = new THREE.Color('#c9d6da');
    // --- bosques ---
    const tg = new THREE.ConeGeometry(0.16, 0.5, 5); tg.translate(0, 0.25, 0);
    const trees = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ color: '#3f6a30', flatShading: true }), 6000), M = new THREE.Matrix4(); let tn = 0;   // C9: el mundo es 2,7 veces mayor
    for (let q = 0; q < 110000 && tn < 6000; q++) {
      const i = Math.floor(hash(q * 1.3) * NX), j = Math.floor(hash(q * 2.7 + 5) * NZ), k = j * W1 + i;
      if (!land[k] || dist[k] < 2 || agu(i, j) > 0.05 || metros[k] > ARBOL_MAX || latOf(j) < 37.5 - hash(q) * 2) continue;
      if (Math.sin(lonOf(i) * 5.3 + latOf(j) * 7.1) < 0.1 || bioma(lonOf(i), latOf(j), metros[k], dist[k]).sinArbol) continue;
      const s = 0.7 + hash(q * 9.1) * 0.8; M.makeScale(s, s, s); { const tx = OX + i * CW + (hash(q * 4.4) - 0.5) * CW, tz = OZ + j * CH + (hash(q * 6.6) - 0.5) * CH; if (aguaXZ(tx, tz) > 0.05) continue; M.setPosition(tx, this.hAt(tx, tz) - 0.02, tz); } trees.setMatrixAt(tn++, M);
    }
    trees.count = tn; sc.add(trees);
    // --- C9: palmeras en el valle del Nilo y el delta (una malla con todas; se dibuja solo si Egipto está en pantalla) ---
    const palms = new THREE.InstancedMesh(palmeraGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 420); let pn = 0;
    const lejosMon = (lo, la) => Object.values(D.MONUMENTOS || {}).every(m => Math.hypot(lo - m.lon, la - m.lat) > 0.22);
    for (let q = 0; q < 60000 && pn < 420; q++) {   // sueltas y en grupitos: más en el valle que en el delta (Estrabón 17.1.51: el mejor dátil, en la Tebaida)
      const lo = 29.6 + hash(q * 3.7 + 1) * 3, la = 28.0 + hash(q * 5.3 + 2) * 3.7, x = (lo + 7) * 5, z = (47 - la) * 6.4, vg = vegaNilo(lo, la);
      if (vg < 0.55 || aguaXZ(x, z) > 0.05 || this.hAt(x, z) < 0.04 || hash(q * 8.1) < (puntoEn(lo, la, DELTA) ? 0.93 : 0.6) || !lejosMon(lo, la)) continue;
      const s = 0.42 + hash(q * 2.2) * 0.3; M.makeRotationY(hash(q * 1.9) * 6.28); M.scale(new THREE.Vector3(s, s, s)); M.setPosition(x, this.hAt(x, z) - 0.02, z); palms.setMatrixAt(pn++, M);
    }
    palms.count = pn; palms.computeBoundingSphere(); sc.add(palms); this.palmeras = pn;
    // --- C9: monumentos (D.MONUMENTOS): pirámides de Giza y Faro de Alejandría ---
    this.monumentos = {};
    for (const id in (D.MONUMENTOS || {})) {
      const d = D.MONUMENTOS[id], p = D.proj(d.lon, d.lat), x = p[0] * K, z = p[1] * K, m = monumento(id); m.position.set(x, Math.max(0.02, this.hAt(x, z)), z); sc.add(m);
      const el = document.createElement('div'); el.className = 'mlabel'; el.style.cssText = 'pointer-events:none;font-size:10px;padding:2px 7px;opacity:.88;background:rgba(58,40,16,.78)'; el.textContent = d.n; el.style.display = 'none'; this.labels.appendChild(el);
      this.monumentos[id] = { grp: m, el: el, x: x, z: z, top: id === 'faro' ? 2.1 : 1.0 };
    }
    // --- C10: adornos de carta en el mar (D.ADORNOS) ---
    this.adornos = adornosMalla(); sc.add(this.adornos);
    // --- C11: pueblos y tribus (D.TRIBUS): poblados y cintas con su nombre ---
    { const tm = tribusMallas(this, aguaXZ); this.tribus = tm.nombres; this.aldeas = tm.aldeas; sc.add(this.tribus); sc.add(this.aldeas); }
    // --- C12: calzadas, puertos y rutas de mar (D.CALZADAS, D.PUERTOS, D.RUMBOS): solo se ven ---
    { const cm = calzadasMallas(this); this.calzadas = cm.trazos; this.vias = cm.vias; this.puertos = cm.puertos; this.calzAnio = null; sc.add(this.calzadas); sc.add(this.vias); sc.add(this.puertos); }
    // --- C13: vida en el mapa (D.VIDA): rebaños, humo de los hogares, mercantes y carros ---
    { const sitioPasto = (x, z) => { const i = Math.round((x - OX) / CW), j = Math.round((z - OZ) / CH); if (i < 0 || j < 0 || i > NX || j > NZ) return null; const k = j * W1 + i;
        if (!land[k] || dist[k] < 1.5 || aguaXZ(x, z) > 0.05 || metros[k] > 1500) return null; const lo = lonOf(i), la = latOf(j), B = bioma(lo, la, metros[k], dist[k]);
        if (B.des > 0.5 || B.mar > 0.5) return null; return { estepa: B.est > 0.4, monte: metros[k] > 1000, seco: la < 38.5 || B.est > 0.2 }; };
      this.vida = vidaMallas(this, sitioPasto); sc.add(this.vida.grupo); }
    // --- rutas ---
    this.aristas = [];
    for (const e of D.EDGES) {
      const pts = trazo(this, G.pos(e[0]), G.pos(e[1]), 0.08);
      const geo = new THREE.BufferGeometry().setFromPoints(pts), line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: e[2] ? '#e8f6ff' : '#5a3418', dashSize: e[2] ? 0.35 : 0.6, gapSize: e[2] ? 0.5 : 0.3, transparent: true, opacity: e[2] ? 0.55 : 0.85 }));
      line.computeLineDistances(); sc.add(line); this.aristas.push({ a: e[0], b: e[1], line: line });
    }
    // --- ciudades (y, aparte, los sitios de colonia de CN5) ---
    this.cities = {}; this.sitios = {}; this.aristaSet = new Set(this.aristas.map(e => e.a + '|' + e.b)); this.firmaMundo = '';
    this.racimosCrear();
    for (const id in D.CITIES) this.crearCiudad(id);
    this.crearSitios();
  }

  /* una ciudad del mapa: muralla, casas, bandera, etiqueta. Aparte para poder añadir la colonia cuando se funda (CN5) */
  crearCiudad(id) {
    const sc = this.scene;
    {
      const d = D.CITIES[id], p = G.pos(id), x = p[0] * K, z = p[1] * K, grp = new THREE.Group(), s = id === 'roma' || id === 'carthago' ? 1.5 : 0.95 + d.w * 0.09;
      const casas = [];   // C16: muralla y casas van en los racimos instanciados (ver racimos)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 5), new THREE.MeshLambertMaterial({ color: '#3a2a1a' })); pole.position.y = 1.15; grp.add(pole);
      const fm = new THREE.MeshLambertMaterial({ color: '#fff', side: THREE.DoubleSide }), flag = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.6), fm); flag.position.set(0.5, 1.95, 0); grp.add(flag); grp.userData.pole = pole;
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.6, 28), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.85, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.visible = false; grp.add(ring);
      grp.scale.setScalar(s); grp.position.set(x, Math.max(0.05, this.hAt(x, z)), z); sc.add(grp);
      const el = document.createElement('button'); el.className = 'mlabel'; el.innerHTML = '<i></i><b class="marca" hidden></b><span>' + d.n + '</span><em></em>';
      el.addEventListener('click', ev => { ev.stopPropagation(); if (this.opts.onSelect) this.opts.onSelect(id); });
      this.labels.appendChild(el);
      this.cities[id] = { s: s, marca: el.querySelector('b'), rel: null, casas: casas, pole: pole, flag: fm, flagMesh: flag, centro: null, quiere: null, grp: grp, ring: ring, el: el, dot: el.querySelector('i'), em: el.querySelector('em'), owner: null, x: x, z: z, top: 2.6 * s };
    }
  }

  /* C16 · capas instanciadas de los racimos (murallas y manchas: 3 + 3 llamadas para todas las ciudades); las casas reales se crean al cargarse */
  racimosCrear() {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }), capa = geo => { const im = new THREE.InstancedMesh(geo, mat, RAC_MAX); im.count = 0; im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.setColorAt(0, new THREE.Color('#fff')); this.scene.add(im); return im; };
    this.rac = { firma: '', muros: {}, manchas: {}, casas: {}, M: new THREE.Matrix4(), Q: new THREE.Quaternion(), V: new THREE.Vector3(), E: new THREE.Vector3(), C: new THREE.Color(), F: new THREE.Color(), Y: new THREE.Vector3(0, 1, 0) };
    for (const t of ['empalizada', 'muro', 'alto']) this.rac.muros[t] = capa(murallaGeo(t));
    for (const t of ['tejas', 'plana', 'choza']) this.rac.manchas[t] = capa(manchaGeo(t));
  }
  /* rellena las capas según lo que se ve: solo se rehace cuando cambia algo (dueño, tamaño, muralla, cerca/lejos o una casa recién cargada) */
  racimos(state) {
    const R = this.rac, cam = this.cam.position, filas = []; let firma = '';
    for (const id in this.cities) {
      const c = this.cities[id], st = state.cities[id]; if (!st || !c.grp.visible) continue;
      const cu = culturaDe(st.owner), t = Math.round(racTam(id, st) * 20) / 20, lv = Math.min(6, st.b ? st.b.muralla || 0 : 0), lista = RAC_CASAS[cu];
      const dc = Math.hypot(c.x - cam.x, c.grp.position.y - cam.y, c.z - cam.z), n = lista ? Math.min(Math.round(6 + 16 * t), Math.floor(RAC_TRI_CIUDAD / RAC_TRI[cu])) : 0;
      filas.push({ id, c, st, cu, t, lv, n, dc, cerca: !!lista && this.c.dist < 40 && dc < this.c.dist * 0.9 + 12 && lista.every(k => getStatic(k)) });
    }
    // de cerca, las casas reales van primero a las ciudades más próximas a la cámara, hasta el tope de triángulos en pantalla
    let gasto = 0; for (const f of filas.filter(f => f.cerca).sort((a, b) => a.dc - b.dc)) { const g = f.n * RAC_TRI[f.cu]; if (gasto + g > RAC_TRI_TOTAL) f.cerca = false; else gasto += g; }
    for (const f of filas) firma += f.id + f.st.owner + f.t + f.lv + (f.cerca ? 1 : 0) + '|';
    if (firma === R.firma) return; R.firma = firma;
    const { M, Q, V, E, C, F, Y } = R, nM = {}, nC = {}, cuenta = {};
    for (const k in R.muros) nM[k] = 0; for (const k in R.manchas) nM[k] = 0;
    for (const f of filas) {
      const { c, st, cu, t, lv } = f, s = c.s, Rl = 0.75 + 0.9 * t, Rw = Rl * s, y = c.grp.position.y, rot = hash(c.x * 3.7 + c.z) * 6.283;
      c.ring.scale.setScalar(Math.max(1, (Rl + 0.3) / 1.35));
      F.set(D.FACTIONS[st.owner].col);
      // muralla: radio con el tamaño; alto con el nivel de muralla del juego (sin muralla: empalizada baja)
      const tm = lv <= 0 ? 'empalizada' : lv <= 2 ? 'muro' : 'alto', im = R.muros[tm], hm = s * (lv <= 0 ? 0.1 : 0.11 + 0.025 * lv);
      M.compose(V.set(c.x, y - 0.03, c.z), Q.setFromAxisAngle(Y, rot), E.set(Rw, hm, Rw)); im.setMatrixAt(nM[tm], M); im.setColorAt(nM[tm], C.set(RAC_PIEDRA[cu]).lerp(F, 0.06)); nM[tm]++;
      // mancha (de lejos, o siempre si su cultura no tiene casas de 0 A.D.)
      if (!f.cerca) { const tp = RAC_MANCHA[cu], mm = R.manchas[tp]; M.compose(V.set(c.x, y, c.z), Q.setFromAxisAngle(Y, rot), E.set(Rw * 0.93, s * (0.8 + 0.5 * t), Rw * 0.93)); mm.setMatrixAt(nM[tp], M); mm.setColorAt(nM[tp], C.set('#ffffff').lerp(F, 0.1)); nM[tp]++; continue; }
      // de cerca: casas de 0 A.D. en espiral entre el edificio central y la muralla
      const lista = RAC_CASAS[cu], n = f.n, r0 = 0.7, r1 = Rl - 0.22;
      for (let i = 0; i < n; i++) {
        const k = lista[Math.floor(hash(i * 7.3 + c.x) * lista.length)], st0 = getStatic(k), b = st0.bb, g = this.racCasas(k, cu); if (!g || (cuenta[g.uuid] || 0) >= CASAS_MAX) continue;
        const rr = Math.sqrt(r0 * r0 + (i + 0.5) / n * (r1 * r1 - r0 * r0)) * s, a = rot + i * 2.39996 + (hash(i + c.z) - 0.5) * 0.3, x = c.x + Math.cos(a) * rr, z = c.z + Math.sin(a) * rr;
        const kk = s * (0.36 + hash(i * 2.9 + c.z) * 0.1) / Math.max(b[3] - b[0], b[5] - b[2]), giro = -a + Math.PI / 2 + Math.round(hash(i * 4.1) * 3) * Math.PI / 2;
        Q.setFromAxisAngle(Y, giro); V.set(-(b[0] + b[3]) / 2 * kk, 0, -(b[2] + b[5]) / 2 * kk).applyQuaternion(Q);
        M.compose(V.add(E.set(x, Math.min(this.hAt(x, z), y + 0.25) - 0.02, z)), Q, E.set(kk, kk, kk)); const j = cuenta[g.uuid] || 0;
        for (const m of g.children) m.setMatrixAt(j, M); cuenta[g.uuid] = j + 1; nC[g.uuid] = g;
      }
    }
    for (const k in R.muros) { const im = R.muros[k]; im.count = nM[k]; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    for (const k in R.manchas) { const im = R.manchas[k]; im.count = nM[k]; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    for (const k in R.casas) { const g = R.casas[k]; for (const m of g.children) { m.count = cuenta[g.uuid] || 0; m.instanceMatrix.needsUpdate = true; } }
  }
  /* un juego de casas reales por tipo y cultura (el tejado lleva el color sobrio de la cultura) */
  racCasas(key, cu) {
    const id = key + '|' + cu; if (this.rac.casas[id]) return this.rac.casas[id];
    const g = staticInstancedVacio(key, CASAS_MAX, RAC_TEJA[cu]); if (!g) return null; this.scene.add(g); this.rac.casas[id] = g; return g;
  }

  /* CN5 · sitios de colonia: un mojón con banderín (sin muralla ni casas, para no parecer una ciudad). Se eligen al tocar como las ciudades. */
  crearSitios() {
    const sc = this.scene, palo = new THREE.MeshLambertMaterial({ color: '#4a3524', flatShading: true }), tela = new THREE.MeshLambertMaterial({ color: '#e9c063', side: THREE.DoubleSide, flatShading: true }), piedra = new THREE.MeshLambertMaterial({ color: '#cfc3a6', flatShading: true });
    for (const id in (D.COLONIAS || {})) {
      const d = D.COLONIAS[id], p = G.pos(id), x = p[0] * K, z = p[1] * K, grp = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.18, 8), piedra); base.position.y = 0.09; grp.add(base);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 5), palo); mast.position.y = 0.95; grp.add(mast);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.05), palo); bar.position.y = 1.62; grp.add(bar);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), tela); flag.position.set(0.3, 1.38, 0); grp.add(flag);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.05, 24), new THREE.MeshBasicMaterial({ color: '#e9c063', transparent: true, opacity: 0.9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; grp.add(ring);
      grp.position.set(x, Math.max(0.05, this.hAt(x, z)), z); grp.visible = false; sc.add(grp);
      const el = document.createElement('button'); el.type = 'button'; el.className = 'mlabel sitio'; el.innerHTML = '<i></i><span>' + d.n + '</span><em></em>'; el.style.display = 'none';
      el.addEventListener('click', ev => { ev.stopPropagation(); if (this.opts.onSelect) this.opts.onSelect(id); });
      this.labels.appendChild(el);
      this.sitios[id] = { grp: grp, ring: ring, flag: tela, el: el, em: el.querySelector('em'), x: x, z: z, top: 2.1, est: '' };
    }
  }
  /* ¿el sitio cae en la región de esta partida (I6)? Vale la ciudad no-colonia más cercana: si está en el mapa, el sitio también */
  sitioEnRegion(id, state) {
    const d = D.COLONIAS[id]; if (!d) return false; const p = D.proj(d.lon, d.lat); let best = null, bd = 1e9;
    for (const o in D.CITIES) { if (D.CITIES[o].colonia) continue; const q = G.pos(o), dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; best = o; } }
    return !!best && !!state.cities[best];
  }
  /* carreta con bueyes y un banderín: los colonos que marchan (sin soldados, sin batalla) */
  colonosModel(m) {
    const grp = new THREE.Group(), mad = new THREE.MeshLambertMaterial({ color: '#7a4a22', flatShading: true }), lona = new THREE.MeshLambertMaterial({ color: '#efe5cc', flatShading: true }), buey = new THREE.MeshLambertMaterial({ color: '#8a7458', flatShading: true });
    const car = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.8), mad); car.position.set(0, 0.28, -0.25); grp.add(car);
    const toldo = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), lona); toldo.position.set(0, 0.52, -0.25); grp.add(toldo);
    for (const dx of [-0.16, 0.16]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.4), buey); b.position.set(dx, 0.24, 0.35); grp.add(b); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 5), mad); pole.position.set(0.3, 0.75, -0.5); grp.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshLambertMaterial({ color: D.FACTIONS.roma.col, side: THREE.DoubleSide })); fl.position.set(0.55, 1.25, -0.5); grp.add(fl);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.05, 18), new THREE.MeshBasicMaterial({ color: '#e9c063', transparent: true, opacity: 0.45 })); base.position.y = 0.03; grp.add(base);
    const el = document.createElement('div'); el.className = 'mlabel army mine'; this.labels.appendChild(el); this.scene.add(grp); return { grp: grp, el: el, anims: [], colonos: true };
  }
  /* rutas y ciudades que aparecen después de construir el mapa (colonia recién fundada o cargada) */
  alDiaMundo() {
    const f = Object.keys(D.CITIES).length + '|' + D.EDGES.length; if (f === this.firmaMundo) return; this.firmaMundo = f;
    for (const id in D.CITIES) if (!this.cities[id]) this.crearCiudad(id);
    for (const e of D.EDGES) {
      const k = e[0] + '|' + e[1]; if (this.aristaSet.has(k) || this.aristaSet.has(e[1] + '|' + e[0])) continue; this.aristaSet.add(k);
      const pts = trazo(this, G.pos(e[0]), G.pos(e[1]), 0.08), line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: e[2] ? '#e8f6ff' : '#5a3418', dashSize: e[2] ? 0.35 : 0.6, gapSize: e[2] ? 0.5 : 0.3, transparent: true, opacity: e[2] ? 0.55 : 0.85 }));
      line.computeLineDistances(); this.scene.add(line); this.aristas.push({ a: e[0], b: e[1], line: line });
    }
  }

  /* Edificio real de la cultura del dueño en el centro de la ciudad; si aún no cargó el modelo, quedan las casitas y se reintenta */
  ponerCentro(c) {
    const clave = c.quiere, st = clave && getStatic(clave);
    if (clave && !st) return;
    if (c.centro) { c.grp.remove(c.centro); c.centro = null; }
    const m = clave && staticMesh(clave, D.FACTIONS[c.owner].col);
    if (m) {
      const b = st.bb, k = 1.2 / Math.max(b[3] - b[0], b[5] - b[2], 1), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      m.scale.setScalar(k); m.position.set(-cx * k, Math.max(0, -b[1] * k), -cz * k); c.grp.add(m); c.centro = m;
    }
    c.pole.position.set(m ? 0.8 : 0, 1.15, m ? 0.8 : 0); c.flagMesh.position.set(m ? 1.3 : 0.5, 1.95, m ? 0.8 : 0);
    c.puesto = c.quiere;
  }

  /* altura bilineal del relieve en (x, z) del mundo 3D */
  hAt(x, z) {
    const fx = Math.max(0, Math.min(NX, (x - OX) / CW)), fz = Math.max(0, Math.min(NZ, (z - OZ) / CH)), i = Math.min(NX - 1, Math.floor(fx)), j = Math.min(NZ - 1, Math.floor(fz)), u = fx - i, v = fz - j, W1 = NX + 1, H = this.H, k = j * W1 + i;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + W1] * (1 - u) + H[k + W1 + 1] * u) * v;
  }

  /* una figura (real si ya cargó, si no la sencilla) puesta en el grupo; reutilizada por los ejércitos y las guarniciones */
  figura(grp, anims, key, col, x, z, s, clip) {
    const real = getUnit(key);
    if (real) {                                               // figura real
      const g = instancedGeometry(real, 1), im = new THREE.InstancedMesh(g, unitMaterialReal(real, col), 1), k = s * UNIT_SCALE * (key === 'elefantes' ? 1.6 : 1);
      im.setMatrixAt(0, new THREE.Matrix4().makeScale(k, k, k)); im.position.set(x, 0, z); im.frustumCulled = false; im.userData.real = true; grp.add(im);
      anims.push({ a: g.attributes.aFrame, clip: real.clips[clip] || real.clips.idle, ph: hash(x * 9 + z) * 3 }); return;
    }
    const g = unitGeometry(key, col).clone(); g.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array([1, 0, hash(x * 9 + z) * 6]), 3));
    const me = new THREE.Mesh(g, unitMaterial()); me.position.set(x, 0, z); me.scale.setScalar(s); me.frustumCulled = false; grp.add(me);
  }
  /* C1 · guarnición: 1 a 4 figuras junto a la ciudad (según los hombres que hay), con su disco y estandarte del dueño. Solo con la cámara a media distancia o cerca. */
  guarnicion(c, st, ver) {
    const hombres = G.men(st.units), n = !hombres ? 0 : hombres < 25 ? 1 : hombres < 120 ? 2 : hombres < 450 ? 3 : 4;
    let main = null, best = 0; for (const k in st.units) if (st.units[k] > best && D.UNITS[k] && D.UNITS[k].cls !== 'ele') { best = st.units[k]; main = k; }
    const clave = ver && main ? st.owner + '|' + main + '|' + n : '';
    if (clave !== c.gClave) {
      c.gClave = clave;
      if (c.gar) { c.grp.parent.remove(c.gar.grp); c.gar.grp.traverse(o => { if (o.geometry && !o.userData.real) o.geometry.dispose(); }); c.gar = null; }
      if (clave) {
        const grp = new THREE.Group(), anims = [], col = D.FACTIONS[st.owner].col, mine = st.owner === 'roma';
        for (let i = 0; i < n; i++) { const a = 2.55 + (i - (n - 1) / 2) * 0.5; this.figura(grp, anims, main, col, Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.4, 'idle'); }
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4), new THREE.MeshLambertMaterial({ color: '#3a2a1a' })); pole.position.set(Math.cos(2.55) * 1.9 - 0.6, 0.5, Math.sin(2.55) * 1.9); grp.add(pole);
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.26), new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide })); fl.position.set(pole.position.x + 0.18, 0.88, pole.position.z); grp.add(fl);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2 + n * 0.14, 0.2 + n * 0.14, 0.03, 14), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 })); base.position.set(Math.cos(2.55) * 1.9, 0.02, Math.sin(2.55) * 1.9); grp.add(base);
        c.grp.add(grp); c.gar = { grp: grp, anims: anims };
      }
    }
    if (c.gar) for (const an of c.gar.anims) { an.a.array[0] = frameOf(an.clip, this.t + an.ph); an.a.needsUpdate = true; }
  }

  armyModel(m) {
    const grp = new THREE.Group(), mine = m.owner === 'roma', col = D.FACTIONS[m.owner].col, e = m.from && G.edge(m.from, m.to);
    const ship = e && e[2] ? (staticMesh(claveBarco(m.owner), col) || staticMesh('trirreme', col)) : null;                    // por mar, el ejército viaja embarcado
    if (ship) { ship.scale.setScalar(0.07); ship.position.y = -0.06; grp.add(ship); const el2 = document.createElement('div'); el2.className = 'mlabel army ' + (mine ? 'mine' : 'foe'); this.labels.appendChild(el2); this.scene.add(grp); return { grp: grp, el: el2, anims: [] }; }
    let main = mine ? 'hastati' : 'milicia', best = 0; for (const k in m.units) if (m.units[k] > best && D.UNITS[k].cls !== 'ele') { best = m.units[k]; main = k; }
    const anims = [], lead = m.hero || m.gen ? 'general' : (m.units.elefantes ? 'elefantes' : main), add = (key, x, z, s) => this.figura(grp, anims, key, col, x, z, s, 'walk');
    add(lead, 0, 0.35, lead === 'elefantes' ? 0.3 : 0.62); add(main, -0.5, -0.25, 0.6); add(main, 0.5, -0.25, 0.6); add(main, 0, -0.7, 0.6);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 18), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 })); base.position.y = 0.03; grp.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5), new THREE.MeshLambertMaterial({ color: '#3a2a1a' })); pole.position.set(0, 1.1, -0.3); grp.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide })); fl.position.set(0.36, 1.95, -0.3); grp.add(fl);
    const el = document.createElement('div'); el.className = 'mlabel army ' + (mine ? 'mine' : 'foe'); this.labels.appendChild(el);
    this.scene.add(grp); return { grp: grp, el: el, anims: anims };
  }

  update(state, sel) {
    if (!this.terrOn && mapaTexturas(this.terr)) this.terrOn = true;           // las texturas llegan después de crear el mapa
    const W = this.host.clientWidth, Hh = this.host.clientHeight, v = new THREE.Vector3(), now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt; uTime.value = this.t;
    if (W && Hh && (W !== this.mW || Hh !== this.mH)) { this.mW = W; this.mH = Hh; this.ajustarMare(); }   // C8: el encuadre de Mare Nostrum sigue al tamaño real
    const cpos = this.cam.position, alc = this.alcance, place = (el, x, y, z) => { if (alc && Math.hypot(x - cpos.x, y - cpos.y, z - cpos.z) > alc) { el.style.display = 'none'; return; } v.set(x, y, z).project(this.cam); if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) { el.style.display = 'none'; return; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * Hh).toFixed(1) + 'px) translate(-50%,-100%)'; };
    if (this.labels.scrollLeft || this.labels.scrollTop) { this.labels.scrollLeft = 0; this.labels.scrollTop = 0; }
    this.escalon(state, dt, place);
    const mare = this.esc.mare;
    this.alDiaMundo();
    for (const id in this.sitios) {      // CN5: sitios libres, con colonos en camino o con colonos esperando; los de fuera de la región, ocultos (I6)
      const q = this.sitios[id], k = state.colonias && state.colonias[id], ver = !!k && k.estado !== 'fundada' && this.sitioEnRegion(id, state) && D.COLONIAS[id];
      if (!ver) { q.grp.visible = false; q.el.style.display = 'none'; continue; }
      q.grp.visible = true; q.ring.visible = true; q.ring.rotation.z = this.t * 0.8; q.ring.scale.setScalar(k.estado === 'pendiente' ? 1 + 0.12 * Math.sin(this.t * 4) : 1);
      q.grp.scale.setScalar(k.estado === 'libre' ? 1 : 1.15);
      if (q.est !== k.estado) { q.est = k.estado; q.flag.color.set(k.estado === 'libre' ? '#e9c063' : k.estado === 'camino' ? '#9aa4b0' : '#7fd060'); q.el.dataset.est = k.estado; q.em.textContent = k.estado === 'libre' ? D.COLONIAS[id].anio + ' a.C.' : k.estado === 'camino' ? 'colonos en camino' : '¡funda aquí!'; }
      q.el.classList.toggle('sel', sel === id); place(q.el, q.x, q.grp.position.y + q.top, q.z); if (mare) q.el.style.display = 'none';
    }
    for (const id in this.monumentos) {   // C9: nombre del monumento solo de cerca; el fuego del Faro parpadea
      const q = this.monumentos[id], fu = q.grp.userData.fuego; if (fu) fu.scale.set(1, 0.8 + 0.35 * Math.abs(Math.sin(this.t * 7.3) + 0.5 * Math.sin(this.t * 13.1)), 1);
      if (mare || this.c.dist > 70) q.el.style.display = 'none'; else place(q.el, q.x, q.grp.position.y + q.top, q.z);
    }
    for (const id in this.cities) {
      const c = this.cities[id], st = state.cities[id];
      if (!st) { c.grp.visible = false; c.el.style.display = 'none'; continue; }   // ciudad que no es de esta región: ni modelo ni etiqueta
      c.grp.visible = true;
      if (c.owner !== st.owner) { c.owner = st.owner; c.quiere = claveCentro(st.owner); const col = D.FACTIONS[st.owner].col; c.flag.color.set(col); c.dot.style.background = col; c.el.classList.toggle('mine', st.owner === 'roma'); }
      const rel = st.owner === 'roma' ? '' : (G.dipEstado(st.owner) || 'guerra');   // K7a: aliada, tributaria o en guerra con Roma
      if (c.rel !== rel) { c.rel = rel; c.el.dataset.rel = rel; c.marca.hidden = !rel; c.marca.textContent = rel === 'alianza' ? '🤝' : rel === 'tributo' ? '💰' : rel ? '⚔' : ''; c.marca.title = rel === 'alianza' ? 'Aliada de Roma' : rel === 'tributo' ? 'Paga tributo a Roma' : 'En guerra con Roma'; }
      if (c.quiere !== c.puesto) this.ponerCentro(c);
      this.guarnicion(c, st, !mare && this.c.dist < 95 && !(this.opts.ocupado && this.opts.ocupado()) && Math.hypot(c.x - this.c.x, c.z - this.c.z) < this.c.dist * 1.3);   // C1: guarnición visible solo de media distancia a cerca
      c.ring.visible = sel === id; if (sel === id) c.ring.rotation.z = this.t * 0.8;
      const txt = (state.hero.city === id ? '🦅 ' : '') + G.men(st.units); if (c.txt !== txt) { c.txt = txt; c.em.textContent = txt; }
      c.el.classList.toggle('sel', sel === id); place(c.el, c.x, c.grp.position.y + c.top, c.z);
      if (mare) c.el.style.display = 'none';   // C6: de lejos solo se leen los nombres de zona
    }
    this.racimos(state);   // C16: murallas, manchas y casas de todas las ciudades
    this.sinPisar(sel);
    const ar = new Set(G.aristas().map(e => e[0] + '|' + e[1]));
    for (const e of this.aristas) e.line.visible = ar.has(e.a + '|' + e.b) && !!state.cities[e.a] && !!state.cities[e.b];
    // rutas comerciales: trazo dorado y un mercante que va y viene (una malla por ruta)
    if (!this.rutaObj) { this.rutaObj = new Map(); this.rutaMat = { oro: new THREE.MeshBasicMaterial({ color: '#f2c14e', side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), casco: new THREE.MeshLambertMaterial({ color: '#7a4a22', flatShading: true }), vela: new THREE.MeshLambertMaterial({ color: '#f1e6c8', side: THREE.DoubleSide, flatShading: true }), carro: new THREE.MeshLambertMaterial({ color: '#b98a3c', flatShading: true }) }; }
    const vistas = new Set();
    for (const r of (state.rutas || [])) {
      if (!state.cities[r.a] || !state.cities[r.b]) continue;
      const k = r.a + '|' + r.b; vistas.add(k); let o = this.rutaObj.get(k);
      if (!o) {
        const mar = G.rutaMar(r), pa = G.pos(r.a), pb = G.pos(r.b), w = anchoRuta(G.rutaRenta(r));
        const linea = new THREE.Mesh(cinta(this, pa, pb, 0.11, w), this.rutaMat.oro), g = new THREE.Group();
        if (mar) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.9), this.rutaMat.casco); c.position.y = 0.1; const v = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), this.rutaMat.vela); v.position.y = 0.55; v.rotation.y = Math.PI / 2; g.add(c, v); }
        else { const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.55), this.rutaMat.carro); c.position.y = 0.2; const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.3), this.rutaMat.vela); b.position.y = 0.38; g.add(c, b); }
        this.scene.add(linea, g); o = { linea: linea, g: g, pa: pa, pb: pb, w: w, ph: (r.a.length + r.b.length) * 0.37 }; this.rutaObj.set(k, o);
      }
      const w2 = anchoRuta(G.rutaRenta(r)); if (w2 !== o.w) { o.w = w2; o.linea.geometry.dispose(); o.linea.geometry = cinta(this, o.pa, o.pb, 0.11, w2); }   // la renta cambió (mercado, tipo de ciudad)
      const u = (this.t * 0.06 + o.ph) % 2, f = u < 1 ? u : 2 - u, x = (o.pa[0] + (o.pb[0] - o.pa[0]) * f) * K, z = (o.pa[1] + (o.pb[1] - o.pa[1]) * f) * K;
      o.g.position.set(x, Math.max(0.04, this.hAt(x, z)) + 0.05, z); o.g.rotation.y = Math.atan2(o.pb[0] - o.pa[0], o.pb[1] - o.pa[1]) + (u < 1 ? 0 : Math.PI);
    }
    for (const [k, o] of this.rutaObj) if (!vistas.has(k)) { this.scene.remove(o.linea, o.g); o.linea.geometry.dispose(); o.g.traverse(m => { if (m.geometry) m.geometry.dispose(); }); this.rutaObj.delete(k); }
    const seen = new Set();
    for (const m of state.marches) {
      if (m.colonos ? !(state.cities[m.from] && this.sitioEnRegion(m.to, state)) : (!state.cities[m.to] || (m.from && !state.cities[m.from]))) continue;
      seen.add(m.id); let a = this.armies.get(m.id); if (!a) { a = m.colonos ? this.colonosModel(m) : this.armyModel(m); this.armies.set(m.id, a); }
      let p0 = m.fromXY || G.pos(m.from), p1 = G.pos(m.to), f = Math.max(0, Math.min(1, (state.t - m.t0) / (m.t1 - m.t0)));
      if (m.sitio && D.CAMINOS[m.sitio.c - 1]) {   // GM15b: un ejército que espera en un sitio se dibuja parado sobre el camino, no en la ciudad enemiga
        const e = D.CAMINOS[m.sitio.c - 1], a0 = G.pos(e[0]), a1 = G.pos(e[1]); p1 = [a0[0] + (a1[0] - a0[0]) * m.sitio.p, a0[1] + (a1[1] - a0[1]) * m.sitio.p];
        f = Math.max(0, Math.min(1, (state.t - m.t0) / Math.max(1e-6, m.sitio.tLlega - m.t0)));
      }
      const x = (p0[0] + (p1[0] - p0[0]) * f) * K, z = (p0[1] + (p1[1] - p0[1]) * f) * K, y = Math.max(0.04, this.hAt(x, z));
      a.grp.position.set(x, y, z); a.grp.rotation.y = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
      for (const an of a.anims) { an.a.array[0] = frameOf(an.clip, this.t + an.ph); an.a.needsUpdate = true; }
      const txt = m.colonos ? '🏛️ Colonos a ' + G.lugar(m.to).n : (m.owner === 'roma' ? '' : (m.label || D.FACTIONS[m.owner].n) + ' · ') + G.men(m.units); if (a.txt !== txt) { a.txt = txt; a.el.textContent = txt; }
      place(a.el, x, y + 2.7, z);
    }
    for (const [id, a] of this.armies) if (!seen.has(id)) { this.scene.remove(a.grp); a.grp.traverse(o => { if (o.geometry && !o.userData.real) o.geometry.dispose(); }); a.el.remove(); this.armies.delete(id); }
    const c = this.c, cp = Math.cos(c.pitch);
    this.marco.value = Math.max(0, Math.min(1, (c.dist - 40) / 90));
    this.adornos.material.opacity = 0.92 * ss(16, 42, c.dist) * (1 - horizonte(c.dist));   // C15: con la cámara baja, sin letras de carta   // C10: los adornos de carta se desvanecen al acercarse
    this.adornos.visible = this.adornos.material.opacity > 0.01;   // C5a: viñeta del marco solo en vistas lejanas
    this.tribus.material.opacity = 0.95 * ss(170, 125, c.dist) * ss(13, 24, c.dist); this.tribus.visible = this.tribus.material.opacity > 0.01;   // C11: cintas de los pueblos a media distancia (de muy cerca se ve el poblado)
    if (D.anio !== this.calzAnio) { this.calzAnio = D.anio; calzadasAnio(this.calzadas, D.anio || D.START_YEAR || 280); }   // C12: calzadas pálidas hasta su año
    this.vias.material.opacity = 0.95 * ss(120, 80, c.dist) * ss(8, 14, c.dist); this.vias.visible = this.vias.material.opacity > 0.01;   // C12: nombres de calzadas a media distancia
    this.puertos.material.opacity = 0.95 * ss(260, 190, c.dist) * ss(6, 11, c.dist); this.puertos.visible = this.puertos.material.opacity > 0.01;   // C12: anclas de los puertos
    this.aldeas.visible = c.dist < 135;
    if (!(typeof document !== 'undefined' && document.hidden)) vidaMover(this, this.vida, this.t, state);   // C13: rebaños, humo, mercantes y carros; de lejos se apagan solos   // C11: de lejos, los poblados no se distinguen: no se dibujan
    { // C6: a más distancia, más bruma lejana. C15: con la cámara baja la bruma es clara y cercana (oculta el borde del mundo) y la cámara
      // no dibuja más allá de ella: los trozos de relieve que caen detrás se recortan y no suman triángulos.
      const h = horizonte(c.dist), f = this.scene.fog, nc = Math.max(90, c.dist * 0.6), fc = Math.max(260, c.dist * 1.75), nh = 10 + c.dist * 1.1, fh = 40 + c.dist * 2.3;
      f.near = nc + (nh - nc) * h; f.far = fc + (fh - fc) * h; f.color.copy(this.nieblaCarta).lerp(this.nieblaBaja, h);
      const lejos = h > 0 ? Math.min(600, f.far * 1.04 + (1 - h) * 600) : 600; if (this.cam.far !== lejos) { this.cam.far = lejos; this.cam.updateProjectionMatrix(); }
      const l1 = Math.round(58 - 20 * h); if (this.lodL1 !== l1) { this.lodL1 = l1; for (const lod of this.terreno.children) lod.levels[1].distance = l1; }   // C15: con la cámara baja, el detalle medio empieza antes
      this.nieblaMarco.c.value.copy(f.color); this.nieblaMarco.d.value.set(f.near, f.far, h);
      this.alcance = h > 0.3 ? f.near + (f.far - f.near) * 0.15 : 0;   // las etiquetas de lo que ya se pierde en la bruma no salen
      const sobre = c.pitch - this.cam.fov * Math.PI / 360;   // la mirada más alta, en radianes bajo el horizonte
      this.cielo.visible = h > 0.01 && sobre < 0.12;
      if (this.cielo.visible) { this.cielo.position.set(c.x, Math.sin(c.pitch) * c.dist, c.z + cp * c.dist); this.cielo.scale.setScalar(lejos * 0.9); this.cielo.material.uniforms.uH.value.copy(f.color); }
    }
    { const cz = c.z + cp * c.dist; this.cam.position.set(c.x, Math.max(Math.sin(c.pitch) * c.dist, this.hAt(c.x, cz) + 1.2), cz); this.cam.lookAt(c.x, 0, c.z); }   // C15: la cámara baja nunca entra en un monte
    this.r.render(this.scene, this.cam);
  }

  /* J4b · las etiquetas de ciudades y sitios no se pisan (Etruria tiene 4 ciudades juntas). Orden: elegida, Roma, ciudades, sitios.
     Cada una prueba su sitio y, si choca, sube o baja una fila; de lejos se esconde el contador de tropas para que quepan. */
  sinPisar(sel) {
    const lejos = this.c.dist > 52; this.labels.classList.toggle('comp', lejos);
    const todos = [];
    for (const id in this.cities) { const c = this.cities[id]; if (c.el.style.display !== 'none') todos.push({ e: c.el, p: id === sel ? 0 : c.el.classList.contains('mine') ? 1 : 2 }); }
    for (const id in this.sitios) { const q = this.sitios[id]; if (q.el.style.display !== 'none') { if (lejos && id !== sel) { q.el.style.display = 'none'; continue; } todos.push({ e: q.el, p: id === sel ? 0 : 3 }); } }
    if (todos.length < 2) return;
    for (const o of todos) o.r = o.e.getBoundingClientRect();
    todos.sort((m, n) => m.p - n.p || m.r.top - n.r.top);
    const puestos = [], choca = (r, dy) => puestos.some(q => r.left < q.right && r.right > q.left && r.top + dy < q.bottom && r.bottom + dy > q.top);
    for (const o of todos) {
      const h = o.r.height + 2; let dy = 0;
      for (const k of [0, -1, 1, -2, 2, -3, 3]) { dy = k * h; if (!choca(o.r, dy)) break; }
      if (dy) o.e.style.transform += ' translateY(' + dy.toFixed(0) + 'px)';
      puestos.push({ left: o.r.left, right: o.r.right, top: o.r.top + dy, bottom: o.r.bottom + dy });
    }
  }

  /* C6 · Escalones del mapa. Mare Nostrum (cámara lejos): solo nombres de zona. Zona: la cámara se acerca a sus ciudades y salen
     las etiquetas normales. «volver» restaura el encuadre guardado en la pila. Solo en la campaña del Mediterráneo (I6 no se toca). */
  zonaCiudades(z, state) { return D.ZONAS[z].ciudades.filter(id => state.cities[id] && this.cities[id]); }
  entrarZona(z) {
    const st = this.esc; if (!G.state || !D.ZONAS[z]) return;
    const ids = this.zonaCiudades(z, G.state); if (!ids.length) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const id of ids) { const c = this.cities[id]; x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); z0 = Math.min(z0, c.z); z1 = Math.max(z1, c.z); }
    const c = this.c, dist = Math.max(24, Math.min(this.umbralMare() * 0.6, Math.max((x1 - x0) * 3.3 + 12, (z1 - z0) * 2 + 12)));
    st.pila.push({ x: c.x, z: c.z, dist: c.dist, pitch: c.pitch, zona: st.zona }); st.zona = z;
    st.anim = { d: 0.6, t0: performance.now(), de: { x: c.x, z: c.z, dist: c.dist }, a: { x: (x0 + x1) / 2, z: (z0 + z1) / 2, dist: dist } };
  }
  /* C1 · zoom continuo a la ciudad: guarda el encuadre exacto, acerca la cámara hasta ella y abre la vista de ciudad (opts.onEntrar). */
  entrarCiudad(id) {
    const st = this.esc, k = this.cities[id]; if (!k || !this.opts.onEntrar || st.entrando) return;
    const c = this.c; this.vuelta = { x: c.x, z: c.z, dist: c.dist, pitch: c.pitch, zona: st.zona, pila: st.pila.slice() }; st.entrando = true; st.dentro = true;
    st.anim = { d: 0.7, t0: performance.now(), de: { x: c.x, z: c.z, dist: c.dist }, a: { x: k.x, z: k.z, dist: ZOOM_CIUDAD - 3 }, fin: () => { st.entrando = false; this.opts.onEntrar(id); } };
  }
  /* «volver» desde la ciudad: el mapa queda en el encuadre exacto de antes */
  restaurar() { const v = this.vuelta, st = this.esc; st.entrando = false; if (!v) return; this.c.x = v.x; this.c.z = v.z; this.c.dist = v.dist; st.zona = v.zona; st.pila = v.pila; this.vuelta = null; st.dentro = true; this.clamp(); }
  /* al acercar a mano sobre una ciudad propia (pellizco libre) se entra sola; se rearma al alejarse */
  autoEntrada() {
    const st = this.esc, c = this.c; if (st.anim || st.entrando || !this.opts.puedeEntrar) return;
    if (c.dist > ZOOM_CIUDAD * 1.3) { st.dentro = false; return; }
    if (st.dentro || c.dist >= ZOOM_CIUDAD) return;
    for (const id in this.cities) { const k = this.cities[id]; if (k.grp.visible && Math.hypot(k.x - c.x, k.z - c.z) < 5 && this.opts.puedeEntrar(id)) { this.entrarCiudad(id); return; } }
  }
  volver() {
    const st = this.esc, g = st.pila.pop(); if (!g) return; const c = this.c;
    st.zona = g.zona; st.anim = { d: 0.6, t0: performance.now(), de: { x: c.x, z: c.z, dist: c.dist }, a: { x: g.x, z: g.z, dist: g.dist } };
  }
  escalon(state, dt, place) {
    const st = this.esc, c = this.c, med = G.regionId() === 'mediterraneo'; this.autoEntrada();
    if (st.anim) {
      const a = st.anim; /* C9: t0 se pone al pedir la animación (con fotogramas lentos no se pierde el primero) */ if (a.t0 === undefined) a.t0 = performance.now(); const u = Math.min(1, (performance.now() - a.t0) / 1000 / a.d), e = u * u * (3 - 2 * u);
      c.x = a.de.x + (a.a.x - a.de.x) * e; c.z = a.de.z + (a.a.z - a.de.z) * e; c.dist = a.de.dist + (a.a.dist - a.de.dist) * e; this.clamp();
      if (u >= 1) { st.anim = null; if (a.fin) a.fin(); }
    } else if (st.zona && c.dist >= this.umbralMare()) { st.zona = null; st.pila = []; }   // se aleja a mano: vuelve a Mare Nostrum
    st.mare = med && !st.zona && c.dist >= this.umbralMare() && !st.anim;
    // C8: al llegar a Mare Nostrum alejando a mano (pellizco o rueda) la vista se desliza hasta Italia; «volver» no la mueve; arrastrar lo corta
    if (st.mare && !st.eraMare && st.aMano && performance.now() - st.aMano < 1500) st.aRoma = G.pos('roma')[0] * K;
    st.eraMare = st.mare;
    if (st.aRoma !== undefined) { if (!st.mare) st.aRoma = undefined; else { const f = Math.min(1, dt * 6); c.x += (st.aRoma - c.x) * f; c.z += (this.mareZ - c.z) * f; this.clamp(); if (Math.abs(st.aRoma - c.x) < 0.05) st.aRoma = undefined; } }
    const clave = med ? (st.zona || '') + '|' + st.pila.length : '-';
    if (clave !== st.clave) {
      st.clave = clave;
      this.migas.style.display = med ? '' : 'none';
      this.migas.innerHTML = '<span class="mm-t">Mare Nostrum</span>' + (st.zona ? '<span class="mm-s">›</span><span class="mm-t">' + D.ZONAS[st.zona].n + '</span><button type="button" data-volver>← volver</button>' : '');
    }
    for (const z in D.ZONAS) {
      let el = st.zEls[z];
      if (!el) { el = st.zEls[z] = document.createElement('button'); el.type = 'button'; el.className = 'mlabel zona'; el.textContent = D.ZONAS[z].n; el.addEventListener('click', ev => { ev.stopPropagation(); this.entrarZona(z); }); this.labels.appendChild(el); }
      const ids = med && st.mare ? this.zonaCiudades(z, state) : [];
      if (!ids.length) { el.style.display = 'none'; continue; }
      let x = 0, zz = 0; for (const id of ids) { x += this.cities[id].x; zz += this.cities[id].z; }
      // C8: en vertical el mundo no cabe a lo ancho; la zona que queda fuera se nombra en el borde con una flecha hacia ella (tocarla acerca igual)
      const v = this.vZona || (this.vZona = new THREE.Vector3()), W = this.host.clientWidth, H = this.host.clientHeight; v.set(x / ids.length, 0.3, zz / ids.length).project(this.cam);
      const vx = Math.max(-0.8, Math.min(0.8, v.x)), txt = (v.x < -0.8 ? '← ' : '') + D.ZONAS[z].n + (v.x > 0.8 ? ' →' : ''); if (el.textContent !== txt) el.textContent = txt;
      el.style.display = ''; el.style.transform = 'translate(' + ((vx + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
      const y = zz / ids.length, ancla = y < 62 ? '-100%' : '0%';   // las del norte cuelgan hacia arriba y las del sur hacia abajo, para no pisarse
      el.style.transform = el.style.transform.replace('translate(-50%,-100%)', 'translate(-50%,' + ancla + ')');
      const fuera = v.x < -0.8 || v.x > 0.8; el.style.opacity = fuera ? '0.72' : ''; el.style.fontSize = fuera ? '11px' : ''; el.style.padding = fuera ? '2px 8px' : '';   // C8: las de fuera, pequeñas y pegadas al borde (brújula), sin tapar el mapa
      if (fuera) { const yy = Math.max(-0.75, Math.min(0.75, v.y)); el.style.transform = 'translate(' + (v.x < 0 ? 4 : W - 4).toFixed(1) + 'px,' + ((1 - yy) / 2 * H).toFixed(1) + 'px) translate(' + (v.x < 0 ? '0%' : '-100%') + ',-50%)'; }
    }
    // los nombres no se pisan: si dos se solapan en pantalla, el de abajo baja lo justo
    const vis = Object.values(st.zEls).filter(e => e.style.display !== 'none').map(e => ({ e: e, r: e.getBoundingClientRect() })).sort((p, q) => p.r.top - q.r.top), hechos = [];
    for (const o of vis) { let dy = 0; for (const q of hechos) if (o.r.left < q.right && o.r.right > q.left && o.r.top + dy < q.bottom && o.r.bottom + dy > q.top) dy = q.bottom - o.r.top + 3; if (dy) o.e.style.transform += ' translateY(' + dy.toFixed(0) + 'px)'; hechos.push({ left: o.r.left, right: o.r.right, top: o.r.top + dy, bottom: o.r.bottom + dy }); }
    // y no se salen por los lados ni quedan bajo los botones de zoom de la derecha
    const caja = this.labels.getBoundingClientRect(), izq = caja.left + 6, der = caja.right - 62;
    for (const o of vis) { if (o.e.style.opacity) continue; const r = o.e.getBoundingClientRect(); let dx = 0; if (r.left < izq) dx = izq - r.left; else if (r.right > der) dx = der - r.right; if (dx) o.e.style.transform += ' translateX(' + dx.toFixed(0) + 'px)'; }
  }

  /* Centra y acerca la cámara según la ficha de la región (lon, lat, zoom) */
  encuadre() { const r = G.region(), cm = r && r.camara; if (!cm) return; const p = D.proj(cm.lon, cm.lat); this.c.x = p[0] * K; this.c.z = p[1] * K; this.c.dist = 46 * (cm.zoom || 1); this.clamp(); }
  center(id) { const p = G.pos(id); this.c.x = p[0] * K; this.c.z = p[1] * K; this.clamp(); }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  /* C8 · límites de la cámara. La distancia máxima es la de Mare Nostrum (el núcleo del Mediterráneo llena el alto útil); el centro
     no deja ver más de un margen corto de pergamino fuera del mundo. C9: el mundo pasa del núcleo (160×80) al marco ancho (ANCHO×ALTO),
     así que de lejos también se arrastra arriba y abajo (Galia del norte, Egipto); el alto visible se estima con el de Mare Nostrum. */
  clamp() {
    const c = this.c, D = this.mareD || 330, m = 5; c.dist = Math.max(14, Math.min(D, c.dist)); c.pitch = pitchDe(c.dist, this.pitchBajo || 0.35);
    const medio = c.dist * Math.tan(this.cam.fov * Math.PI / 360) * this.cam.aspect;   // medio ancho de suelo visible en el centro
    let x0 = OX + Math.max(4, medio - m), x1 = OX + Math.min(ANCHO - 4, ANCHO - medio + m); if (x0 > x1) x0 = x1 = OX + ANCHO / 2;
    c.x = Math.max(x0, Math.min(x1, c.x));
    const zM = this.mareZ === undefined ? 42 : this.mareZ, f = c.dist / D, hz = 40 * f, dz = (zM - 40) * f;   // medio alto visible y desfase por la cabecera
    let z0 = OZ + Math.max(4, hz - m) + dz, z1 = OZ + ALTO - Math.max(4, hz - m) + dz; if (z0 > z1) z0 = z1 = OZ + ALTO / 2;
    c.z = Math.max(z0, Math.min(z1, c.z));
  }
  umbralMare() { return (this.mareD || MARE_DIST / 0.93) * 0.93; }
  /* C8 · distancia y centro de Mare Nostrum: el mundo (alto 80) llena la banda entre la cabecera (~200 px) y la barra de abajo (~80 px) */
  ajustarMare() {
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    const arriba = Math.min(200, h * 0.24), abajo = Math.min(80, h * 0.1), banda = h - arriba - abajo - 12, centro = arriba + 6 + banda / 2;
    const cam = this.cam.clone(), v = new THREE.Vector3();
    const y = (zt, d, zz) => { const p = pitchDe(d, this.pitchBajo || 0.35); cam.position.set(80, Math.sin(p) * d, zt + Math.cos(p) * d); cam.lookAt(80, 0, zt); cam.updateMatrixWorld(); v.set(80, 0, zz).project(cam); return (1 - v.y) / 2 * h; };
    let a = 40, b = 600; for (let i = 0; i < 30; i++) { const d = (a + b) / 2; if (y(40, d, 80) - y(40, d, 0) > banda) a = d; else b = d; }
    const d = b; a = -40; b = 120; for (let i = 0; i < 30; i++) { const zt = (a + b) / 2; if ((y(zt, d, 0) + y(zt, d, 80)) / 2 > centro) a = zt; else b = zt; }
    this.mareD = d; this.mareZ = (a + b) / 2; this.clamp();
  }
  bind() {
    const P = new Map(), cv = this.cv; let st = null;
    cv.addEventListener('pointerdown', e => { this.esc.anim = null; cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); if (P.size === 1) st = { mv: 0, d: 0 }; else if (st) { st.mv = 99; st.d = 0; } });
    cv.addEventListener('pointermove', e => {
      if (!P.has(e.pointerId)) return; const pr = P.get(e.pointerId), dx = e.clientX - pr[0], dy = e.clientY - pr[1]; P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 1 && st) { this.esc.aRoma = undefined; st.mv += Math.abs(dx) + Math.abs(dy); const k = this.c.dist * 0.0019; this.c.x -= dx * k; this.c.z -= dy * k * 1.25; }
      else if (P.size === 2 && st) { const v = [...P.values()], d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); if (st.d) { this.c.dist *= st.d / d; this.esc.aMano = performance.now(); } st.d = d; }
      this.clamp();
    });
    const up = e => {
      if (!P.has(e.pointerId)) return; P.delete(e.pointerId);
      if (st && st.mv < 10 && e.type === 'pointerup' && !P.size) {
        const rc = cv.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), this.cam);
        const o = ray.ray.origin, d = ray.ray.direction, k = (0.3 - o.y) / d.y, x = o.x + d.x * k, z = o.z + d.z * k; let best = null, bd = 2.6;
        for (const id in this.cities) { const c = this.cities[id], dd = Math.hypot(c.x - x, c.z - z); if (dd < bd) { bd = dd; best = id; } }
        for (const id in this.sitios) { const c = this.sitios[id]; if (!c.grp.visible) continue; const dd = Math.hypot(c.x - x, c.z - z); if (dd < bd) { bd = dd; best = id; } }
        if (this.opts.onSelect) this.opts.onSelect(best);
      }
      if (!P.size) st = null; else if (st) st.d = 0;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.esc.aMano = performance.now(); this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.clamp(); e.preventDefault(); }, { passive: false });
  }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 50 : 36; this.cam.updateProjectionMatrix(); this.pitchBajo = Math.max(0.2, this.cam.fov * Math.PI / 360 - 0.09); this.ajustarMare(); }
}
