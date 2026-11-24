/* AQVILA — FI4: un campo como el de la batalla de campaña (js/ui-guerra.js), sin pantalla, para probar la física de las figuras.
   Tres cuerpos por bando, tres líneas de 30 figuras (filas de 7, a 1,15 m) y tiradores. Lo usa test/fisica-batalla.test.mjs. */
import { crearFisicaFiguras } from '../js/fisica-batalla.js';
const FILAS = 7, PASO = 1.15, S = 9;
export function crearCampo({ porLinea = 30, lineas = 3, cuerpos = 3, caidos = 0, fisica = true, semilla = 1 } = {}) {
  let a = semilla >>> 0; const az = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
  const figs = [], L = [];
  for (let s = 0; s < cuerpos; s++) for (let lado = 0; lado < 2; lado++) for (let k = 0; k < lineas; k++) {
    const lv = { s, lado, k, fs: [], d: 0.8 + k * (Math.ceil(porLinea / FILAS) * 1.25 + 2.4) }; L.push(lv);
    for (let j = 0; j < porLinea; j++) { const f = { idx: figs.length, lado, est: 0, t0: 0, yaw: lado === 0 ? Math.PI : 0, x: 0, z: 0, tx: 0, tz: 0, fila: 0, cc: L.length * 16, g: L.length }; figs.push(f); lv.fs.push(f); }
  }
  /* los caídos de antes, entre las líneas */
  for (let i = 0; i < caidos; i++) figs.push({ idx: figs.length, lado: i % 2, est: 1, t0: -5, yaw: az() * 6.28, x: (az() - 0.5) * S * cuerpos, z: (az() - 0.5) * 3, tx: 0, tz: 0, fila: 0, cc: -1 - figs.length });
  const sitio = (lv, j, z0) => { const r = Math.floor(j / FILAS), col = j % FILAS, n = lv.fs.length, enFila = Math.min(FILAS, n - r * FILAS), dir = lv.lado === 0 ? 1 : -1;
    return [(lv.s - (cuerpos - 1) / 2) * S + (col - (enFila - 1) / 2) * PASO, z0 + dir * (lv.d + r * 1.25), r, col]; };
  const C = { figs, L, frente: 0, T: 0, ff: fisica ? crearFisicaFiguras({ semilla }) : null };
  /* coloca cada línea en su sitio (z0: dónde está el frente de cada bando) */
  C.coloca = (zR = 0, zE = 0, cambio = null) => { for (const lv of L) { const z0 = lv.lado === 0 ? zR : zE; const ord = cambio && cambio(lv); lv.fs.forEach((f, j) => { const [x, z, r, col] = sitio(ord || lv, j, z0); f.tx = x; f.tz = z; f.fila = r; f.cc = L.indexOf(lv) * 16 + col; }); } };
  C.inicio = () => { for (const f of figs) if (f.est === 0) { f.x = f.tx; f.z = f.tz; } };
  /* andan hacia su sitio a v m/s (y miran hacia donde van si se alejan mucho) */
  C.mueve = (dt, v = 1.5) => { for (const f of figs) { if (f.est !== 0) continue; const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz); if (d < 1e-4) continue; const p = Math.min(d, v * dt); f.x += dx / d * p; f.z += dz / d * p; } };
  const lee = (f, c) => { if (f.est === 2) return false; c.x = f.x; c.z = f.z; c.yaw = f.yaw; c.vivo = f.est === 0; c.lado = f.lado; c.tipo = f.tipo || 'infante'; c.f = f.cc; c.r = f.fila; c.guardia = f.guardia || null; c.g = f.g; return true; };
  C.paso = (dt, v) => { C.T += dt; C.mueve(dt, v); if (C.ff) C.ff.paso(figs, dt, lee); };
  C.dibujado = f => [f.x + (f.fx || 0), f.z + (f.fz || 0)];
  return C;
}
