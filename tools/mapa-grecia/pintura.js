/* AQVILA · AM2 — pintura del suelo del mapa vivo de Grecia. Se ejecuta UNA VEZ en un navegador (tools/mapa-grecia/hornear.mjs)
   y deja en assets/mapa-grecia/ las texturas ya pintadas: suelo-a.webp (estilo A, relieve natural), suelo-b.webp (estilo B, carta
   antigua) y mascaras-a.webp y mascaras-b.webp (R = campos de labor, G = bosque, B = roca y cumbre en A, umbría para el rayado a tinta en B). El juego solo las carga: no pinta nada al arrancar.
   Todo el arte es propio (pintado aquí con cuentas sobre el relieve). Uso: ver hornear.mjs. */
import { MARCO, ZONAS, COPAIS, pesoZonas } from '../../js/gfx/mapa-grecia-datos.js';

export const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
export const mix = (a, b, t) => a + (b - a) * t;
export const paso = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const h2 = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
export function ruido(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return mix(mix(h2(xi, yi), h2(xi + 1, yi), u), mix(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v); }
export function fbm(x, y, o) { let s = 0, a = 0.5, t = 0; for (let i = 0; i < (o || 4); i++) { s += a * ruido(x, y); t += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return s / t; }
export function azar(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const W = 2304, H = 2048, MW = 1152, MH = 1024;

export async function cargar(url) {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, alt = new Float32Array(n), costa = new Float32Array(n);
  for (let i = 0; i < n; i++) { alt[i] = (d[i * 4] * 256 + d[i * 4 + 1]) / 6 - 5000; costa[i] = (d[i * 4 + 2] - 128) / 8; }
  return { alt, costa, nx: c.width, nz: c.height };
}
function muestreador(a, nx, nz) { return (fx, fz) => { fx = clamp(fx, 0, nx - 1.001); fz = clamp(fz, 0, nz - 1.001); const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * nx + i;
  return mix(mix(a[k], a[k + 1], u), mix(a[k + nx], a[k + nx + 1], u), v); }; }

/* campos comunes a los dos estilos: altura suavizada, pendiente, luz, costa, comarcas, lago y las tres máscaras */
export function preparar(T) {
  const nx = T.nx, nz = T.nz, mA = muestreador(T.alt, nx, nz), mC = muestreador(T.costa, nx, nz), n = W * H;
  const A = new Float32Array(n), B = new Float32Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) A[y * W + x] = mA((x + 0.5) / W * nx - 0.5, (y + 0.5) / H * nz - 0.5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const xa = x > 0 ? x - 1 : x, xb = x < W - 1 ? x + 1 : x, ya = y > 0 ? y - 1 : y, yb = y < H - 1 ? y + 1 : y;
    B[y * W + x] = (A[y * W + x] * 4 + (A[y * W + xa] + A[y * W + xb] + A[ya * W + x] + A[yb * W + x]) * 2 + A[ya * W + xa] + A[ya * W + xb] + A[yb * W + xa] + A[yb * W + xb]) / 16; }
  /* oclusión ancha: lo hundido respecto a su entorno (valles) sale más oscuro, las crestas más claras */
  const R = 6, S1 = new Float32Array(n), S2 = new Float32Array(n);
  for (let y = 0; y < H; y++) { let s = 0; for (let x = -R; x <= R; x++) s += B[y * W + clamp(x, 0, W - 1)]; for (let x = 0; x < W; x++) { S1[y * W + x] = s / (2 * R + 1); s += B[y * W + clamp(x + R + 1, 0, W - 1)] - B[y * W + clamp(x - R, 0, W - 1)]; } }
  for (let x = 0; x < W; x++) { let s = 0; for (let y = -R; y <= R; y++) s += S1[clamp(y, 0, H - 1) * W + x]; for (let y = 0; y < H; y++) { S2[y * W + x] = s / (2 * R + 1); s += S1[clamp(y + R + 1, 0, H - 1) * W + x] - S1[clamp(y - R, 0, H - 1) * W + x]; } }
  const PX = (MARCO.x1 - MARCO.x0) * 87.7 * 1000 / W;   // metros por píxel (≈343)
  return { B, S2, PX, mC, nx, nz };
}

/* recorre todos los píxeles y llama a pintar(o, p) con lo que hay en ese punto */
export function recorrer(C, est, pintar, masc) {
  const { B, S2, PX, mC, nx, nz } = C, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H), o = im.data;
  const L = est.luz, ln = Math.hypot(L[0], L[1], L[2]), S = est.fuerzaSombra / PX, zw = {}, px = [0, 0, 0];
  const dlon = (MARCO.x1 - MARCO.x0) / W, dlat = (MARCO.y1 - MARCO.y0) / H, p = { h: 0, pend: 0, luz: 0, costa: 0, zw, x: 0, y: 0, lago: false, lon: 0, lat: 0, hueco: 0, campos: 0, bos: 0, roca: 0 };
  for (let y = 0; y < H; y++) { const lat = MARCO.y1 - (y + 0.5) * dlat;
    for (let x = 0; x < W; x++) { const k = y * W + x, lon = MARCO.x0 + (x + 0.5) * dlon;
      const gx = (B[y * W + Math.min(W - 1, x + 1)] - B[y * W + Math.max(0, x - 1)]) * 0.5, gz = (B[Math.min(H - 1, y + 1) * W + x] - B[Math.max(0, y - 1) * W + x]) * 0.5;
      const ax = -gx * S, az = -gz * S, nn = Math.hypot(ax, 1, az);
      p.h = B[k]; p.pend = Math.hypot(gx, gz) / PX; p.luz = Math.max(0, (ax * L[0] + L[1] + az * L[2]) / (nn * ln)); p.costa = mC((x + 0.5) / W * nx - 0.5, (y + 0.5) / H * nz - 0.5) * 0.366;   // km
      p.hueco = clamp((S2[k] - B[k]) / 260, -1, 1); p.x = x; p.y = y; p.lon = lon; p.lat = lat; pesoZonas(lon, lat, zw);
      const cx = (lon - COPAIS.lon) * 87.7 / COPAIS.rx, cz = (lat - COPAIS.lat) * 111.3 / COPAIS.rz; p.lago = cx * cx + cz * cz < 0.8 + 0.4 * ruido(x * 0.05, y * 0.05) && p.h < 130 && p.h > 0;
      /* máscaras (las mismas cuentas sirven al estilo A y a lo que el juego pinta de cerca) */
      const n1 = fbm(x * 0.0075, y * 0.0075, 4), n2 = fbm(x * 0.0375 + 40, y * 0.0375, 3), n3 = ruido(x * 0.23, y * 0.23); p.n1 = n1; p.n2 = n2; p.n3 = n3;
      const tierra = p.h > 0 && !p.lago ? 1 : 0, llano = 1 - paso(0.03, 0.11, p.pend), bajo = 1 - paso(220, 520, p.h);
      p.campos = tierra * llano * bajo * (0.45 + 0.55 * Math.max(zw.grano, paso(0.42, 0.6, n1))) * paso(0.15, 1.1, p.costa);
      let bos = paso(300, 700, p.h) * (1 - paso(1550, 1950, p.h)) * paso(0.38, 0.6, n2 * 0.6 + n1 * 0.4); bos = Math.max(bos, zw.madera * paso(60, 220, p.h) * (1 - paso(1700, 2000, p.h)) * 0.95);
      p.bos = tierra * bos * (1 - p.campos);
      p.roca = tierra * clamp(paso(0.42, 0.85, p.pend) * 0.8 + paso(1550, 2050, p.h) + zw.piedra * paso(0.5, 0.7, n2 * 0.7 + n3 * 0.3) * 0.8, 0, 1);
      if (masc) { o[k * 4] = p.campos * 255; o[k * 4 + 1] = p.bos * 255; o[k * 4 + 2] = (masc === 'b' ? tierra * clamp((0.62 - p.luz) * 2.4, 0, 1) * paso(0.03, 0.2, p.pend) : p.roca) * 255; }
      else { pintar(px, p); o[k * 4] = px[0]; o[k * 4 + 1] = px[1]; o[k * 4 + 2] = px[2]; }
      o[k * 4 + 3] = 255; } }
  g.putImageData(im, 0, 0); return c;
}

/* ---------- estilo A · relieve natural ---------- */
export const EST_A = { luz: [-0.55, 0.62, -0.55], fuerzaSombra: 2.6 };
export function pintarA(o, p) {
  const { n1, n2, n3 } = p;
  if (p.lago) { const f = 0.9 + n3 * 0.15; o[0] = 70 * f; o[1] = 124 * f; o[2] = 138 * f; return; }
  /* base mediterránea: ocre seco en lo bajo, verde oliva en las lomas */
  const t = paso(0.34, 0.66, n1); let r = mix(190, 132, t), g = mix(174, 148, t), b = mix(112, 84, t);
  const sube = paso(150, 900, p.h); r = mix(r, 122, sube * 0.6); g = mix(g, 136, sube * 0.6); b = mix(b, 82, sube * 0.6);
  if (p.campos > 0.02) { const w = p.campos * 0.85, oro = p.zw.grano * 0.75, v = paso(0.4, 0.62, fbm(p.x * 0.05 + 9, p.y * 0.05, 2));
    const cr = mix(mix(196, 164, v), 226, oro), cg = mix(mix(184, 174, v), 194, oro), cb = mix(mix(108, 96, v), 98, oro); r = mix(r, cr, w); g = mix(g, cg, w); b = mix(b, cb, w); }
  if (p.bos > 0) { const f = 0.84 + n3 * 0.3; r = mix(r, 62 * f, p.bos); g = mix(g, 92 * f, p.bos); b = mix(b, 52 * f, p.bos); }
  const roca = paso(0.42, 0.85, p.pend) * 0.75; r = mix(r, 170, roca); g = mix(g, 158, roca); b = mix(b, 134, roca);
  const alta = paso(1550, 2050, p.h); r = mix(r, 158, alta); g = mix(g, 154, alta); b = mix(b, 146, alta);
  const nieve = paso(2100, 2500, p.h + n2 * 320); r = mix(r, 242, nieve); g = mix(g, 244, nieve); b = mix(b, 248, nieve);
  const cant = p.zw.piedra * paso(0.5, 0.7, n2 * 0.7 + n3 * 0.3); r = mix(r, 234, cant); g = mix(g, 230, cant); b = mix(b, 218, cant);
  const mina = p.zw.hierro * paso(0.52, 0.7, n2 * 0.6 + n3 * 0.4) * 0.85; r = mix(r, 134, mina); g = mix(g, 84, mina); b = mix(b, 62, mina);
  const playa = (1 - paso(0.15, 0.9, p.costa)) * (1 - paso(12, 40, p.h)); r = mix(r, 228, playa); g = mix(g, 212, playa); b = mix(b, 168, playa);
  if (p.h <= 0) { r = 222; g = 208; b = 166; }   // el mar lo pinta el juego; aquí, arena, para que la orilla no se ensucie al ampliar
  const f = (0.58 + 0.72 * p.luz) * (1 - 0.22 * Math.max(0, p.hueco)) * (1 + 0.1 * Math.max(0, -p.hueco)), fl = p.h <= 0 ? 1 : f;
  o[0] = Math.min(255, r * fl); o[1] = Math.min(255, g * fl); o[2] = Math.min(255, b * mix(fl, 1, 0.2));
}

/* ---------- estilo B · carta antigua ---------- */
export const EST_B = { luz: [-0.6, 0.55, -0.55], fuerzaSombra: 3.4 };
export function pintarB(o, p) {
  const papel = 0.93 + 0.09 * fbm(p.x * 0.004, p.y * 0.004, 3) + (ruido(p.x * 0.56, p.y * 0.16) - 0.5) * 0.04;
  let r, g, b;
  if (p.h <= 0 || p.lago) { r = 232; g = 216; b = 172; if (p.lago) { r = 150; g = 180; b = 170; } }
  else {
    const a = paso(60, 900, p.h), m = paso(900, 2100, p.h); r = mix(232, 210, a); g = mix(214, 182, a); b = mix(168, 130, a); r = mix(r, 182, m); g = mix(g, 148, m); b = mix(b, 106, m);
    const t = { grano: [228, 192, 98], madera: [156, 174, 108], piedra: [224, 222, 212], hierro: [180, 136, 114] };
    for (const k in t) { const w = p.zw[k] * 0.5; if (w > 0) { r = mix(r, t[k][0], w); g = mix(g, t[k][1], w); b = mix(b, t[k][2], w); } }
    const sombra = clamp((0.62 - p.luz) * 2.4, 0, 1) * paso(0.03, 0.2, p.pend); r = mix(r, 120, sombra * 0.5); g = mix(g, 86, sombra * 0.5); b = mix(b, 58, sombra * 0.5);   // aguada; el rayado a tinta lo pone el juego, nítido a cualquier altura
    const claro = clamp((p.luz - 0.7) * 2, 0, 1) * 0.35; r = mix(r, 250, claro); g = mix(g, 240, claro); b = mix(b, 210, claro);
    const hondo = Math.max(0, p.hueco) * 0.18; r *= 1 - hondo; g *= 1 - hondo; b *= 1 - hondo;
  }
  o[0] = r * papel; o[1] = g * papel; o[2] = b * papel;
}
/* adornos de la carta que solo se ven de lejos: rosa de los vientos y título */
export function adornosB(g) {
  const T = '#4a2f1c', px = (lon, lat) => [(lon - MARCO.x0) / (MARCO.x1 - MARCO.x0) * W, (MARCO.y1 - lat) / (MARCO.y1 - MARCO.y0) * H];
  const c = px(20.45, 35.75); g.save(); g.translate(c[0], c[1]); g.scale(1.6, 1.6); g.strokeStyle = T; g.fillStyle = T; g.lineWidth = 1.2; g.lineJoin = 'round'; g.beginPath(); g.arc(0, 0, 46, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 40, 0, 7); g.stroke();
  for (let i = 0; i < 16; i++) { const L = i % 4 === 0 ? 62 : i % 2 === 0 ? 44 : 26, a = i * Math.PI / 8; g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, -L); g.lineTo(5, 0); g.lineTo(-5, 0); g.closePath(); g.fillStyle = i % 2 ? '#c9b98c' : (i % 4 === 0 ? '#7a2b20' : T); g.fill(); g.stroke(); g.restore(); }
  g.font = 'bold 20px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = T; g.fillText('N', 0, -68); g.restore();
  const t = px(20.5, 36.62); g.save(); g.translate(t[0], t[1]); g.textAlign = 'center'; g.fillStyle = 'rgba(74,47,28,.9)'; g.font = 'italic 70px Georgia, serif'; try { g.letterSpacing = '22px'; } catch (e) {} g.fillText('HELLAS', 0, 0);
  try { g.letterSpacing = '2px'; } catch (e) {} g.font = 'italic 27px Georgia, serif'; g.fillText('las polis y sus riquezas', 0, 40); g.restore();
}

export async function hornear(urlAlturas) {
  const T = await cargar(urlAlturas), C = preparar(T);
  const a = recorrer(C, EST_A, pintarA), b = recorrer(C, EST_B, pintarB); adornosB(b.getContext('2d'));
  const chica = m0 => { const m = document.createElement('canvas'); m.width = MW; m.height = MH; const gm = m.getContext('2d'); gm.imageSmoothingQuality = 'high'; gm.drawImage(m0, 0, 0, MW, MH); return m; };
  const ma = chica(recorrer(C, EST_A, null, 'a')), mb = chica(recorrer(C, EST_B, null, 'b'));
  const aB64 = async (c, q) => { const bl = await new Promise(ok => c.toBlob(ok, 'image/webp', q)), u = new Uint8Array(await bl.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
  return { 'suelo-a.webp': await aB64(a, 0.92), 'suelo-b.webp': await aB64(b, 0.92), 'mascaras-a.webp': await aB64(ma, 0.9), 'mascaras-b.webp': await aB64(mb, 0.9) };
}
