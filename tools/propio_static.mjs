/* Piezas hechas desde cero por el proyecto AQVILA (no vienen de ningún juego): termas y acueducto romanos.
   Se dibujan con cajas, columnas y arcos de medio punto y usan una zona del atlas de 0 A.D. que ya está en el juego
   (structural_rome_struct_2.webp), así que no añaden texturas. Formato idéntico a build_static.mjs.
   Uso: node tools/propio_static.mjs <carpeta con static.json>   (añade termas.bin y acueducto.bin e inserta su índice)
   Licencia de las piezas: CC BY-SA 3.0, como el resto de assets/static; crédito: proyecto AQVILA (ver LICENSE.txt). */
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
// zonas del atlas (fracciones de imagen, v contado desde arriba): [u0, v0, ancho, alto]
const Z = { estuco: [0.03, 0.03, 0.4, 0.27], teja: [0.52, 0.005, 0.44, 0.07], ladrillo: [0.54, 0.54, 0.4, 0.22], piedra: [0.54, 0.31, 0.4, 0.12],
  puerta: [0.285, 0.64, 0.084, 0.097], madera: [0.205, 0.506, 0.071, 0.114], columna: [0.252, 0.78, 0.031, 0.218], greca: [0.005, 0.665, 0.145, 0.13] };
const K = 0.03, C = 6;    // píxeles de atlas por unidad de modelo y tamaño de la celda que se repite
class Malla {
  constructor() { this.P = []; this.N = []; this.UV = []; }
  // quad con vértices [x,y,z,s,t] en sentido continuo; modo 'celda': s,t en unidades de modelo; modo 'ajuste': s,t van de 0 a 1 sobre la zona
  quad(v, n, zona, ajuste, k) {
    const [u0, v0, du, dv] = Z[zona], kk = k || K; let cs = 0, ct = 0; for (const q of v) { cs += q[3] / v.length; ct += q[4] / v.length; }
    const bs = ajuste ? 0 : Math.floor(cs / C) * C, bt = ajuste ? 0 : Math.floor(ct / C) * C;
    const uv = q => ajuste ? [u0 + q[3] * du, v0 + (1 - q[4]) * dv] : [u0 + Math.min(du, (q[3] - bs) * kk), v0 + Math.min(dv, (bt + C - q[4]) * kk)];
    for (const i of v.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]) { const q = v[i]; this.P.push(q[0], q[1], q[2]); this.N.push(Math.round(n[0] * 127), Math.round(n[1] * 127), Math.round(n[2] * 127)); this.UV.push(...uv(q)); }
  }
  // cara rectangular partida en celdas de C unidades (así la textura se repite en vez de estirarse): origen o, ejes a y b con longitudes la y lb
  cara(o, a, la, b, lb, n, zona, k) {
    const na = Math.max(1, Math.ceil(la / C)), nb = Math.max(1, Math.ceil(lb / C)), pt = (i, j) => [o[0] + a[0] * i * la / na + b[0] * j * lb / nb, o[1] + a[1] * i * la / na + b[1] * j * lb / nb, o[2] + a[2] * i * la / na + b[2] * j * lb / nb, i * la / na, j * lb / nb];
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) this.quad([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], n, zona, 0, k);
  }
  // caja alineada con los ejes; tapa: zona del techo (cara de arriba)
  caja(x0, y0, z0, x1, y1, z1, zona, tapa, k) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    this.cara([x0, y0, z1], [1, 0, 0], dx, [0, 1, 0], dy, [0, 0, 1], zona, k);
    this.cara([x1, y0, z0], [-1, 0, 0], dx, [0, 1, 0], dy, [0, 0, -1], zona, k);
    this.cara([x1, y0, z1], [0, 0, -1], dz, [0, 1, 0], dy, [1, 0, 0], zona, k);
    this.cara([x0, y0, z0], [0, 0, 1], dz, [0, 1, 0], dy, [-1, 0, 0], zona, k);
    this.cara([x0, y1, z1], [1, 0, 0], dx, [0, 0, -1], dz, [0, 1, 0], tapa || zona, k);
  }
  // columna de n lados
  columna(cx, cz, r, y0, y1, n) {
    for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, b = (i + 1) / n * 2 * Math.PI, m = (a + b) / 2, p = (ang, y, u) => [cx + r * Math.cos(ang), y, cz + r * Math.sin(ang), u, 1 - (y - y0) / (y1 - y0)];
      this.quad([p(a, y0, 0), p(b, y0, 1), p(b, y1, 1), p(a, y1, 0)].map(q => [q[0], q[1], q[2], q[3], 1 - q[4]]), [Math.cos(m), 0, Math.sin(m)], 'columna', 1); }
  }
  datos() { return { P: new Float32Array(this.P), N: new Int8Array(this.N), UV: new Float32Array(this.UV) }; }
}
function ficha(m, zonaMain) {
  const { P, N, UV } = m.datos(), n = P.length / 3, bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { bb[k] = Math.min(bb[k], P[i + k]); bb[k + 3] = Math.max(bb[k + 3], P[i + k]); }
  const bufs = [Buffer.from(P.buffer), Buffer.from(N.buffer), Buffer.from(UV.buffer)], off = []; let o = 0;
  for (const b of bufs) { off.push(o); o += b.length; o += (4 - o % 4) % 4; }
  const bin = Buffer.alloc(o); bufs.forEach((b, i) => b.copy(bin, off[i]));
  return { bin, idx: { verts: n, groups: [{ tex: 'structural/rome_struct_2.png', mode: 0, start: 0, count: n, file: 'structural_rome_struct_2.webp', normFile: null, specFile: null }], bb: bb.map(x => +x.toFixed(2)), off, actor: 'propio (AQVILA)' } };
}

/* ACUEDUCTO: arcada de arcos de medio punto en el eje X, con el canal (specus) y su cubierta encima */
function acueducto() {
  const m = new Malla(), N_ = 6, w = 4.6, p = 2.2, r = w / 2, yb = 7.5, H = 13, d = 2.1, pit = w + p, L = N_ * pit + p, x0 = -L / 2, SEG = 8;
  for (let i = 0; i <= N_; i++) {      // pilas
    const xa = x0 + i * pit, xb = xa + p;
    for (const [z, nz] of [[d, 1], [-d, -1]]) m.quad([[xa, 0, z, xa, 0], [xb, 0, z, xb, 0], [xb, H, z, xb, H], [xa, H, z, xa, H]], [0, 0, nz], 'ladrillo');
    if (i === 0) m.quad([[xa, 0, d, d, 0], [xa, 0, -d, -d, 0], [xa, H, -d, -d, H], [xa, H, d, d, H]], [-1, 0, 0], 'ladrillo');
    if (i === N_) m.quad([[xb, 0, -d, -d, 0], [xb, 0, d, d, 0], [xb, H, d, d, H], [xb, H, -d, -d, H]], [1, 0, 0], 'ladrillo');
  }
  for (let i = 0; i < N_; i++) {       // vanos con arco de medio punto
    const xl = x0 + i * pit + p, xc = xl + r, xr = xl + w;
    m.quad([[xl, 0, d, d, 0], [xl, 0, -d, -d, 0], [xl, yb, -d, -d, yb], [xl, yb, d, d, yb]], [1, 0, 0], 'ladrillo');
    m.quad([[xr, 0, -d, -d, 0], [xr, 0, d, d, 0], [xr, yb, d, d, yb], [xr, yb, -d, -d, yb]], [-1, 0, 0], 'ladrillo');
    for (let k = 0; k < SEG; k++) {
      const a = Math.PI - k * Math.PI / SEG, b = Math.PI - (k + 1) * Math.PI / SEG, m2 = (a + b) / 2, A = [xc + r * Math.cos(a), yb + r * Math.sin(a)], B = [xc + r * Math.cos(b), yb + r * Math.sin(b)];
      for (const [z, nz] of [[d, 1], [-d, -1]]) m.quad([[A[0], A[1], z, A[0], A[1]], [B[0], B[1], z, B[0], B[1]], [B[0], H, z, B[0], H], [A[0], H, z, A[0], H]], [0, 0, nz], 'ladrillo');
      m.quad([[A[0], A[1], d, -d, A[1]], [A[0], A[1], -d, d, A[1]], [B[0], B[1], -d, d, B[1]], [B[0], B[1], d, -d, B[1]]].map(q => [q[0], q[1], q[2], q[3] + 40, q[4]]), [-Math.cos(m2), -Math.sin(m2), 0], 'ladrillo');
    }
  }
  m.caja(x0, H, -d, x0 + L, H + 0.5, d, 'piedra');                                  // cornisa de la arcada
  m.caja(x0, H + 0.5, -1.5, x0 + L, H + 3, 1.5, 'estuco');                          // canal (specus)
  m.caja(x0 - 0.3, H + 3, -1.9, x0 + L + 0.3, H + 3.7, 1.9, 'piedra');              // losas de cubierta
  return ficha(m);
}

/* TERMAS: sala central con bóveda de cañón, alas bajas, pórtico de columnas, ábside y chimenea del hipocausto */
function termas() {
  const m = new Malla();
  m.caja(-17, 0, -13, 17, 1.2, 13, 'piedra');                                          // basamento
  m.caja(-7, 0, 13, 7, 0.5, 15.5, 'piedra'); m.caja(-6, 0, 15.5, 6, 0.25, 17, 'piedra'); // escalera
  m.caja(-16, 1.2, -11, -8.5, 7, 8, 'estuco', 'teja'); m.caja(8.5, 1.2, -11, 16, 7, 8, 'estuco', 'teja');   // alas
  m.caja(-16.4, 6.4, -11.4, -8.1, 7.4, 8.4, 'greca', 'teja'); m.caja(8.1, 6.4, -11.4, 16.4, 7.4, 8.4, 'greca', 'teja');  // cornisa con greca
  m.caja(-9, 1.2, -12, 9, 8, 9, 'estuco');                                             // sala central
  const SEG = 10, R = 9, yc = 8;                                                       // bóveda de cañón
  for (let k = 0; k < SEG; k++) { const a = Math.PI - k * Math.PI / SEG, b = Math.PI - (k + 1) * Math.PI / SEG, mid = (a + b) / 2, A = [R * Math.cos(a), yc + R * 0.8 * Math.sin(a)], B = [R * Math.cos(b), yc + R * 0.8 * Math.sin(b)];
    m.quad([[A[0], A[1], 9, A[0], 0], [B[0], B[1], 9, B[0], 0], [B[0], B[1], -12, B[0], 21], [A[0], A[1], -12, A[0], 21]], [Math.cos(mid) * 0.8, Math.sin(mid), 0].map((v, i, o) => v / Math.hypot(...o)), 'teja', 0, 0.02); }
  for (const z of [9, -12]) { const nz = z > 0 ? 1 : -1;                              // frontones de la bóveda
    for (let k = 0; k < SEG; k++) { const a = Math.PI - k * Math.PI / SEG, b = Math.PI - (k + 1) * Math.PI / SEG, A = [R * Math.cos(a), yc + R * 0.8 * Math.sin(a)], B = [R * Math.cos(b), yc + R * 0.8 * Math.sin(b)];
      m.quad([[A[0], yc, z, A[0], yc], [B[0], yc, z, B[0], yc], [B[0], B[1], z, B[0], B[1]], [A[0], A[1], z, A[0], A[1]]], [0, 0, nz], 'estuco'); } }
  for (const x of [-5.5, 0, 5.5]) m.quad([[x - 1.5, 3, 9.02, 0, 0], [x + 1.5, 3, 9.02, 1, 0], [x + 1.5, 8, 9.02, 1, 1], [x - 1.5, 8, 9.02, 0, 1]], [0, 0, 1], x === 0 ? 'puerta' : 'madera', 1);   // puertas y ventanales de la fachada
  for (const x of [-15.9, 15.9]) for (const z of [-7, -1, 5]) { const nx = Math.sign(x); m.quad([[x, 3, z - 1, 0, 0], [x, 3, z + 1, 1, 0], [x, 6, z + 1, 1, 1], [x, 6, z - 1, 0, 1]], [nx, 0, 0], 'madera', 1); }
  for (const x of [-6.5, -2.2, 2.2, 6.5]) m.columna(x, 11.5, 0.65, 1.2, 8.2, 8);        // pórtico
  m.caja(-8, 8.2, 9.2, 8, 9.4, 13.4, 'greca'); m.caja(-8.4, 9.4, 9, 8.4, 9.9, 13.8, 'piedra');
  for (const s of [-1, 1]) m.quad([[s * 8.4, 9.9, 13.8, 0, 0], [0, 12.4, 13.8, 8, 2.5], [0, 12.4, 9, 8, 2.5], [s * 8.4, 9.9, 9, 0, 0]].map(q => [q[0], q[1], q[2], q[3], q[4]]), [0, 0.9, s * 0.4].map((v, i, o) => v / Math.hypot(...o)), 'teja', 0, 0.02);  // tejado a dos aguas del pórtico
  m.quad([[-8.4, 9.9, 13.8, 0, 0], [0, 12.4, 13.8, 4, 2.5], [8.4, 9.9, 13.8, 8, 0]], [0, 0, 1], 'estuco');                                                                // frontón
  const AS = 8, ra = 6;                                                                // ábside del caldarium
  for (let k = 0; k < AS; k++) { const xa = -ra * Math.cos(k * Math.PI / AS), xb = -ra * Math.cos((k + 1) * Math.PI / AS), za = -12 - ra * Math.sin(k * Math.PI / AS), zb = -12 - ra * Math.sin((k + 1) * Math.PI / AS), nm = (k + 0.5) * Math.PI / AS;
    m.quad([[xa, 1.2, za, k * 3, 1.2], [xb, 1.2, zb, k * 3 + 3, 1.2], [xb, 8, zb, k * 3 + 3, 8], [xa, 8, za, k * 3, 8]], [-Math.cos(nm), 0, -Math.sin(nm)].map((v, i, o) => v / Math.hypot(...o)), 'estuco');
    m.quad([[xa, 8, za, 0, 0], [xb, 8, zb, 1, 0], [0, 11, -12, 0.5, 1]], [0, 1, -0.3].map((v, i, o) => v / Math.hypot(...o)), 'teja', 0, 0.02); }
  m.caja(11, 7, -8, 13, 12, -6, 'ladrillo'); m.caja(10.6, 12, -8.4, 13.4, 12.6, -5.6, 'piedra');   // chimenea del hipocausto
  return ficha(m);
}

const idxPath = path.join(dir, 'static.json'), idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
for (const [clave, f] of [['acueducto', acueducto()], ['termas', termas()]]) {
  fs.writeFileSync(path.join(dir, clave + '.bin'), f.bin); idx[clave] = f.idx;
  console.log(clave, 'triángulos', f.idx.verts / 3, 'caja', f.idx.bb.join(' '), (f.bin.length / 1024 | 0) + ' KB');
}
fs.writeFileSync(idxPath, JSON.stringify(idx));
