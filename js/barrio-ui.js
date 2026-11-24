/* CD5b: cuadro de mando del barrio y capa de necesidades, en la vista de la ciudad.
   Dos mitades. 1) PURA (sin pantalla; corre en Node): datosCiudad, remedioBarrio, zonaServicio, zonaNecesidad. 2) PANTALLA: manchas de barrio,
   ficha, capa de necesidades con gotas. Todo se calcula al abrir o al cambiar la ciudad, nunca por fotograma. Los estilos se inyectan desde aquí.
   Lo monta ciudad-menu.js: montarBarrioUI(vista, ctx). Reglas en js/necesidades.js (CD5a). Todo es licencia de juego (ver ese archivo). */
import * as NEC from './necesidades.js';
import * as CI from './ciudad.js';

/* ---------- parte pura ---------- */
export const GEO = { X0: -480, Z0: -520, C: 4 };
export const CABEN = [0, 15, 25, 40, 60];              // vecinos por nivel de casa (igual que ciudad.js)
export const CLASE_NOMBRE = { ple: 'plebe', ciu: 'ciudadanos', esc: 'esclavos' };
export const TIPO_JUEGO = { guardia: 'cuartel' };      // el servicio «guardia» (orden) lo da hoy el cuartel
const SERV_DE = { cuartel: 'guardia' };
const geoDe = E => ({ N: Math.round(Math.sqrt(E.ocup.length)), X0: (E.geo && E.geo.X0) ?? GEO.X0, Z0: (E.geo && E.geo.Z0) ?? GEO.Z0, C: (E.geo && E.geo.C) ?? GEO.C });
const celdaDe = (g, x, z) => { const i = Math.floor((x - g.X0) / g.C), j = Math.floor((z - g.Z0) / g.C); return i < 0 || j < 0 || i >= g.N || j >= g.N ? -1 : j * g.N + i; };
export const centroCelda = (g, k) => [g.X0 + (k % g.N + 0.5) * g.C, g.Z0 + (Math.floor(k / g.N) + 0.5) * g.C];

/* la celda de calle más cercana a un punto (-1 si no hay ninguna a menos de rad) */
export function calleCerca(red, g, x, z, rad = 20) {
  const k0 = celdaDe(g, x, z); if (k0 < 0) return -1;
  const i0 = k0 % g.N, j0 = (k0 - i0) / g.N, n = Math.ceil(rad / g.C); let mejor = -1, bd = 1e9;
  for (let j = Math.max(0, j0 - n); j <= Math.min(g.N - 1, j0 + n); j++) for (let i = Math.max(0, i0 - n); i <= Math.min(g.N - 1, i0 + n); i++) {
    const k = j * g.N + i; if (!red.esCalle(k)) continue;
    const d = Math.hypot((i - i0) * g.C, (j - j0) * g.C); if (d < bd) { bd = d; mejor = k; }
  }
  return bd <= rad ? mejor : -1;
}

/* Todo lo que la pantalla necesita saber de la ciudad. clasesTot = {ple, ciu, esc}; nec = c.nec (o nada). */
export function datosCiudad(E, clasesTot, nec) {
  const g = geoDe(E), red = NEC.redDeCiudad(E);
  const casas = [], servicios = [];
  for (const p of E.parcelas) {
    if (!p.casa || p.fuera || p.casa.ruina || p.barrio === undefined || p.barrio < 0) continue;
    casas.push({ id: p.id, x: p.x, z: p.z, barrio: p.barrio, nivel: p.casa.nivel || 1, celda: calleCerca(red, g, p.x, p.z, 20) });
  }
  for (const e of E.edificios) {
    if (e.obra || e.ruina) continue;
    const tipo = SERV_DE[e.tipo] || e.tipo; if (!NEC.SERVICIOS[tipo]) continue;
    const celda = calleCerca(red, g, e.x, e.z, Math.max(e.w || 0, e.d || 0) / 2 + 12); if (celda < 0) continue;
    servicios.push({ id: e.id, tipo, celda, x: e.x, z: e.z });
  }
  const alc = NEC.calcularAlcances(red, servicios, casas);
  const tot = clasesTot && (clasesTot.ple + clasesTot.ciu + clasesTot.esc) > 0 ? clasesTot : { ple: 0.7, ciu: 0.2, esc: 0.1 };
  const sum = (tot.ple + tot.ciu + tot.esc) || 1;
  const barrios = E.barrios.map((b, i) => {
    const mias = casas.filter(c => c.barrio === i), share = casas.length ? mias.length / casas.length : 0;
    const clases = { ple: tot.ple / sum * Math.max(share, 0.001), ciu: tot.ciu / sum * Math.max(share, 0.001), esc: tot.esc / sum * Math.max(share, 0.001) };
    const cob = NEC.coberturaBarrio(mias, alc.porCasa), mem = Object.assign(NEC.memoriaNueva(), (nec && nec.mem && nec.mem[i]) || {});
    const ficha = NEC.fichaBarrio({ cobertura: cob, clases, mem });
    const dom = ['ple', 'ciu', 'esc'].reduce((a, k) => clases[k] > clases[a] ? k : a, 'ple');
    const estado = mem.revuelta || ficha.animo < 40 ? 'mal' : ficha.animo >= 60 ? 'bien' : 'falta';
    return { i, nombre: b.nombre || ('Barrio ' + (i + 1)), corto: b.corto || b.nombre || ('B' + (i + 1)), x: b.x, z: b.z, n: mias.length, pop: mias.reduce((s, c) => s + CABEN[Math.min(4, c.nivel)], 0),
      cob, mem, ficha, animo: ficha.animo, humor: ficha.humor, estado, revuelta: !!mem.revuelta, nivel: ficha.nivel, clases, dom, claseNombre: CLASE_NOMBRE[dom], tend: 0 };
  });
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const c of casas.concat(servicios)) { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); z0 = Math.min(z0, c.z); z1 = Math.max(z1, c.z); }
  for (const b of E.barrios) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x); z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z); }
  if (x0 > x1) { x0 = -100; x1 = 100; z0 = -100; z1 = 100; }
  const M = 50, rect = { x0: x0 - M, z0: z0 - M, x1: x1 + M, z1: z1 + M };
  return { E, g, red, casas, servicios, alc, barrios, rect, clasesTot: tot };
}

/* celdas de calle que cubre un servicio de ese tipo puesto en esa celda */
export function zonaServicio(D, tipo, celda) {
  const def = NEC.SERVICIOS[tipo]; if (!def || celda === null || celda === undefined || celda < 0) return new Map();
  return NEC.distancias(D.red, NEC.accesos(D.red, celda), def.alcance);
}
/* celdas de calle que cubren, juntos, todos los servicios que dan esa necesidad */
export function zonaNecesidad(D, nec) {
  const u = new Set();
  for (const s of D.servicios) { const def = NEC.SERVICIOS[s.tipo]; if (def && def.cubre.includes(nec)) for (const k of zonaServicio(D, s.tipo, s.celda).keys()) u.add(k); }
  return u;
}
/* casas (de toda la ciudad o de un barrio) sin esa necesidad cubierta */
export function casasSin(D, nec, barrio) { return D.casas.filter(c => (barrio === undefined || c.barrio === barrio) && !(D.alc.porCasa[c.id] && D.alc.porCasa[c.id][nec])); }

/* la peor necesidad del barrio y el mejor remedio para ella (o null si todo está cubierto) */
export function remedioBarrio(D, b) {
  const pesos = NEC.PESOS[b.dom], pend = b.ficha.necesidades.filter(n => n.estado !== 'cubierta').sort((p, q) => pesos[q.id] * (1 - q.frac) - pesos[p.id] * (1 - p.frac));
  if (!pend.length) return null;
  const mias = D.casas.filter(c => c.barrio === b.i); let primero = null, util = null;
  for (const n of pend.slice(0, 5)) {
    const celdas = [...new Set(casasSin(D, n.id, b.i).map(c => c.celda).filter(k => k >= 0))], paso = Math.max(1, Math.ceil(celdas.length / 40));
    const r0 = NEC.remedio(D.red, mias, D.alc.porCasa, n.id, celdas.filter((_, k) => k % paso === 0));
    const r = Object.assign({}, r0, { tipoJuego: TIPO_JUEGO[r0.servicio] || r0.servicio, nombre: NEC.SERVICIOS[r0.servicio] ? NEC.SERVICIOS[r0.servicio].nombre : r0.servicio, barrio: b.i, estadoNec: n.estado });
    if (!primero) primero = r;
    if (r.casas > 0 && CI.EDIF[r.tipoJuego]) { util = r; break; }
  }
  return util || primero;
}

/* ---------- aspecto ---------- */
export const COL_NEC = { alimento: '#d9a21b', agua: '#2f8fe0', limpieza: '#1fa89a', salud: '#d6568a', trabajo: '#e0762a', cultura: '#8a63c9', culto: '#5c6bc0', orden: '#5f7d8c' };
export const COL_ESTADO = { bien: '#4fa94a', falta: '#e9a919', mal: '#d4382f' };
const TXT_ESTADO = { bien: 'Bien', falta: 'Falta algo', mal: 'Mal' };
const TXT_NEC = { cubierta: 'Bien', falta: 'Falta', mal: 'Mal' };
const ST = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const GLIFO = {
  alimento: '<path d="M12 21V8M12 8C9.500 8 8.500 6 8.500 4c2.500 0 3.500 2 3.500 4zM12 8c2.500 0 3.500-2 3.500-4-2.500 0-3.500 2-3.500 4zM12 14c-2.500 0-4-1.800-4-4 2.500 0 4 1.800 4 4zM12 14c2.500 0 4-1.800 4-4-2.500 0-4 1.800-4 4z"/>',
  agua: '<path d="M12 3c3.500 4.500 6 7.500 6 11a6 6 0 0 1-12 0c0-3.500 2.500-6.500 6-11z"/>',
  limpieza: '<path d="M18 3l-6 9M7 12h8l3 9H4zM9 15v3M12 15v3"/>',
  salud: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
  trabajo: '<path d="M13 4l7 7-3 3-7-7zM11 9l-7 8 3 3 8-7"/>',
  cultura: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM8 8h8M8 12h8"/>',
  culto: '<path d="M3 9l9-5 9 5zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  orden: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>',
  capas: '<path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  cruz: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
  gotas: '<path d="M12 3c3.500 4.500 6 7.500 6 11a6 6 0 0 1-12 0c0-3.500 2.500-6.500 6-11z"/>',
  cloaca: '<path d="M3 9h18M3 17h18M7 17a5 5 0 0 1 10 0"/>',
  puesto: '<path d="M4 20V8l8-5 8 5v12zM9 20v-6h6v6"/>',
  tropas: '<path d="M12 3v14M8 7h8M7 21l5-4 5 4"/>',
  grano: '<path d="M12 21V8M12 8C9.500 8 8.500 6 8.500 4c2.500 0 3.500 2 3.500 4zM12 8c2.500 0 3.500-2 3.500-4-2.500 0-3.500 2-3.500 4zM12 14c-2.500 0-4-1.800-4-4 2.500 0 4 1.800 4 4zM12 14c2.500 0 4-1.800 4-4-2.500 0-4 1.800-4 4z"/>',
  juegos: '<path d="M4 6c0 8 3 13 8 13s8-5 8-13zM8 10h.01M16 10h.01M9 14c1.500 1.500 4.500 1.500 6 0"/>'
};
const GLIFO_SERV = { fuente: 'gotas', cloaca: 'cloaca', termas: 'gotas', medico: 'cruz', escuela: 'cultura', taller: 'trabajo', templo: 'culto', mercado: 'alimento', guardia: 'orden', granero: 'alimento', teatro: 'juegos' };
const svg = (g, t = 22) => '<svg viewBox="0 0 24 24" width="' + t + '" height="' + t + '" ' + ST + ' aria-hidden="true">' + (GLIFO[g] || GLIFO.capas) + '</svg>';
const CARA = {
  bien: '<circle cx="12" cy="12" r="10" fill="#4fa94a" stroke="#fff" stroke-width="1.6"/><path d="M7.500 13.500c1 2.800 8 2.800 9 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.500" r="1.200" fill="#fff"/><circle cx="15" cy="9.500" r="1.200" fill="#fff"/>',
  falta: '<circle cx="12" cy="12" r="10" fill="#e9a919" stroke="#fff" stroke-width="1.6"/><path d="M8 15.500h8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.500" r="1.200" fill="#fff"/><circle cx="15" cy="9.500" r="1.200" fill="#fff"/>',
  mal: '<circle cx="12" cy="12" r="10" fill="#d4382f" stroke="#fff" stroke-width="1.6"/><path d="M7.500 16.500c1-2.800 8-2.800 9 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.500" r="1.200" fill="#fff"/><circle cx="15" cy="9.500" r="1.200" fill="#fff"/>'
};
const cara = (e, t = 22) => '<svg viewBox="0 0 24 24" width="' + t + '" height="' + t + '" aria-hidden="true">' + CARA[e] + '</svg>';
const NIVEL_SVG = {
  chozas: '<path d="M4 26l7-14 7 14zM20 26l6-11 6 11zM8 26v0M2 26h38" />',
  atrio: '<path d="M4 26V14l16-9 16 9v12zM16 26v-8h8v8M2 26h38"/>',
  insulas: '<path d="M6 26V8h14v18M20 26V14h14v12M10 12h6M10 16h6M10 20h6M24 18h6M24 22h6M2 26h38"/>'
};
const nivelSvg = id => '<svg viewBox="0 0 42 30" width="42" height="30" ' + ST + ' aria-hidden="true">' + (NIVEL_SVG[id] || NIVEL_SVG.chozas) + '</svg>';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = f => Math.round(f * 100);

const CSS = `
.bui-etq { position: absolute; inset: 0; overflow: clip; pointer-events: none; z-index: 3; }
.bui-etq button { text-transform: none; letter-spacing: 0; position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 5px; max-width: 150px; min-height: 30px; padding: 3px 10px 3px 4px; border-radius: 16px; background: rgba(246, 237, 216, .94); color: #4a2f12; border: 1.5px solid rgba(110, 76, 30, .55); font-family: inherit; font-weight: 650; font-size: 13px; line-height: 1; white-space: nowrap; pointer-events: auto; box-shadow: 0 2px 8px #0006; overflow: clip; will-change: transform; }
.bui-etq button span { overflow: clip; text-overflow: ellipsis; }
.bui-etq button.mal { border-color: #b5281f; }
.bui-gotas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; }
.mlabel.barrio { display: none !important; }
#bui-capa { position: absolute; right: 12px; z-index: 5; width: 48px; height: 48px; padding: 0; display: grid; place-items: center; border-radius: 50%; background: rgba(34, 27, 18, .88); color: #f0d79a; border: 1.5px solid rgba(240, 215, 154, .6); box-shadow: 0 3px 12px #0008; }
#bui-capa.on { background: linear-gradient(#f0cf7a, #c9972f); color: #2a1a06; }
#bui-capa[hidden], #bui-fila[hidden], #bui-ley[hidden], #bui-ficha[hidden] { display: none; }
#bui-fila { position: absolute; left: 8px; right: 8px; bottom: calc(136px + env(safe-area-inset-bottom)); max-width: 560px; margin: 0 auto; z-index: 6; padding: 8px 8px 9px; border-radius: 16px; background: rgba(34, 27, 18, .92); border: 1px solid rgba(240, 215, 154, .35); box-shadow: 0 8px 24px #0009; overflow: clip; }
#bui-fila .bf-ico { display: flex; justify-content: space-between; gap: 2px; }
#bui-fila .bf-ico button { flex: 1 1 0; min-width: 0; height: 42px; padding: 0; display: grid; place-items: center; border-radius: 50%; color: #fff; border: 2px solid transparent; max-width: 42px; }
#bui-fila .bf-ico button.on { border-color: #fff; box-shadow: 0 0 0 2px #0008, 0 0 10px #fff8; transform: translateY(-3px); }
#bui-fila .bf-tx { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; color: #f0e4c8; font-size: 14px; min-height: 26px; overflow: clip; }
#bui-fila .bf-tx b { font-size: 15px; white-space: nowrap; overflow: clip; text-overflow: ellipsis; }
#bui-fila .bf-x { text-transform: none; letter-spacing: 0; flex: none; min-height: 32px; padding: 0 12px; border-radius: 16px; background: rgba(255, 255, 255, .1); border: 1px solid rgba(240, 215, 154, .4); color: #f0d79a; font-weight: 650; }
#bui-ley { position: absolute; left: 0; right: 0; z-index: 5; display: flex; justify-content: center; gap: 6px; padding: 0 8px; pointer-events: none; overflow: clip; }
#bui-ley span { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 5px; border-radius: 14px; background: rgba(34, 27, 18, .86); color: #f4e8cc; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
#bui-ley i { width: 12px; height: 12px; border-radius: 50%; display: inline-block; border: 1.5px solid #fff; }
#bui-ley i.g { border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; }
#bui-ficha { position: absolute; left: 8px; right: 8px; bottom: calc(72px + env(safe-area-inset-bottom)); max-width: 560px; margin: 0 auto; z-index: 8; max-height: calc(100% - 232px); display: flex; flex-direction: column; overflow: clip; padding: 6px 12px 10px; border-radius: 20px 20px 14px 14px; background: #efe5cf; color: #4a2f12; border: 2px solid #b88a45; box-shadow: 0 -4px 26px #000a; }
#bui-ficha .bu-cuerpo { flex: 1 1 auto; min-height: 0; overflow-x: clip; overflow-y: auto; overscroll-behavior: contain; }
#bui-ficha .bu-grip { width: 44px; height: 5px; border-radius: 3px; background: #b99f78; margin: 0 auto 6px; }
#bui-ficha .bu-cab { display: flex; align-items: flex-start; gap: 8px; }
#bui-ficha .bu-cab > div { flex: 1; min-width: 0; }
#bui-ficha h3 { font-variant: normal; margin: 0; font-family: inherit; font-weight: 800; font-size: 19px; line-height: 1.15; font-variant: normal; text-transform: none; letter-spacing: 0; color: #5a3410; white-space: nowrap; overflow: clip; text-overflow: ellipsis; }
#bui-ficha .bu-sub { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6b5233; margin-top: 2px; overflow: clip; white-space: nowrap; }
#bui-ficha .bu-sub svg { color: #7a5a2c; flex: none; }
#bui-ficha .bu-x { flex: none; margin-top: -2px; width: 40px; height: 40px; padding: 0; border-radius: 50%; background: rgba(90, 52, 16, .1); color: #5a3410; font-size: 20px; border: 0; }
#bui-ficha .bu-animo { margin: 6px 0 4px; padding: 6px 10px 4px; border-radius: 12px; background: #f8f1e0; border: 1px solid #cdb68a; overflow: clip; }
#bui-ficha .bu-animo .t { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: 14px; white-space: nowrap; overflow: clip; }
#bui-ficha .bu-animo .t b { font-size: 16px; }
#bui-ficha .tb-bien { color: #2e8b2a; } #bui-ficha .tb-falta { color: #b07d06; } #bui-ficha .tb-mal { color: #b8281f; }
#bui-ficha .bu-barra { position: relative; height: 12px; border-radius: 6px; margin: 7px 3px 2px; background: linear-gradient(90deg, #d4382f, #e9a919 50%, #4fa94a); }
#bui-ficha .bu-barra i { position: absolute; top: -4px; width: 12px; height: 20px; margin-left: -6px; border-radius: 6px; background: #fff; border: 2px solid #4a2f12; }
#bui-ficha .bu-barra u { position: absolute; top: -3px; bottom: -3px; border-left: 2px dashed #4a2f12aa; }
#bui-ficha .bu-ext { display: flex; justify-content: space-between; font-size: 12px; color: #6b5233; }
#bui-ficha .bu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; margin-top: 4px; }
#bui-ficha .bu-nec { display: flex; align-items: center; gap: 6px; width: 100%; height: 42px; padding: 0 2px; background: none; border: 0; border-bottom: 1px solid #d6c4a0; color: #4a2f12; text-align: left; overflow: clip; font-family: inherit; font-weight: 600; font-size: 13px; line-height: 1.1; text-transform: none; letter-spacing: 0; }
#bui-ficha .bu-nec .ic { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; color: #fff; }
#bui-ficha .bu-nec .mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
#bui-ficha .bu-nec .nm { white-space: nowrap; overflow: clip; text-overflow: ellipsis; }
#bui-ficha .bu-nec .br { height: 8px; border-radius: 4px; background: #cdbf9f; overflow: clip; }
#bui-ficha .bu-nec .br i { display: block; height: 100%; border-radius: 4px; }
#bui-ficha .bu-nec .pc { flex: none; width: 36px; text-align: right; font-size: 14px; font-weight: 800; }
#bui-ficha .bu-pide { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin: 9px 0 0; font-size: 14px; font-weight: 650; }
#bui-ficha .bu-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px 3px 6px; border-radius: 15px; background: #e3efd2; border: 1.5px solid #8fb86a; font-weight: 600; font-size: 13.5px; }
#bui-ficha .bu-chip svg { color: #3f6e24; }
#bui-ficha .bu-av { margin: 8px 0 0; padding: 6px 10px; border-radius: 10px; background: #f6e3b8; border: 1px solid #d3a74a; font-size: 13.5px; }
#bui-ficha .bu-rev { margin: 8px 0 0; padding: 8px 10px; border-radius: 10px; background: #8c1d16; color: #fff; font-size: 14.5px; }
#bui-ficha .bu-rem { display: flex; align-items: center; gap: 10px; margin: 10px 0 0; padding: 8px; border-radius: 12px; background: #f8f1e0; border: 1px solid #cdb68a; overflow: clip; }
#bui-ficha .bu-rem .mini { flex: none; width: 60px; height: 60px; border-radius: 10px; background: #d9c9a4; display: grid; place-items: center; color: #7a5a2c; overflow: clip; }
#bui-ficha .bu-rem .mini img { width: 100%; height: 100%; object-fit: contain; }
#bui-ficha .bu-rem .tx { flex: 1; min-width: 0; font-size: 14px; line-height: 1.25; }
#bui-ficha .bu-rem .tx b { display: block; font-size: 16px; color: #5a3410; }
#bui-ficha .bu-rem .mn { font-size: 12.5px; color: #7a6542; }
#bui-ficha .bu-rem .tx em { font-style: normal; color: #2e8b2a; font-weight: 700; }
#bui-ficha .bu-bt { flex: none; display: grid; grid-template-columns: 1fr; gap: 6px; margin-top: 8px; }
#bui-ficha .bu-bt.tres, #bui-ficha .bu-bt.dos { grid-template-columns: repeat(3, 1fr); } #bui-ficha .bu-bt.dos { grid-template-columns: 1fr 1fr; }
#bui-ficha button, #bui-fila button, .bui-etq button { font-family: inherit; text-transform: none; letter-spacing: 0; font-variant: normal; }
#bui-ficha .bu-bt button { height: auto; margin: 0; align-self: stretch; min-height: 46px; padding: 0 8px; border-radius: 12px; font-family: inherit; font-weight: 700; font-size: 14.5px; line-height: 1.15; text-transform: none; letter-spacing: 0; text-align: center; color: #4a2f12; background: #e6d6b2; border: 1.5px solid #b88a45; overflow: clip; display: flex; align-items: center; justify-content: center; gap: 6px; }
#bui-ficha .bu-bt button.pri { color: #fff; background: linear-gradient(#c9332a, #98201a); border-color: #6e1612; }
#bui-ficha .bu-bt button.sec { background: #f8f1e0; }
#bui-ficha .bu-bt button[aria-disabled="true"] { opacity: .55; }
@media (max-width: 360px) { #bui-ficha .bu-nec .nm { flex-basis: 88px; } }
`;

/* ---------- parte de pantalla ---------- */
const COL_RGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
let _bolita = null;
function bolita() {              // un círculo con borde suave; sirve de pincel para todas las manchas
  if (_bolita) return _bolita;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  d.addColorStop(0, 'rgba(0,0,0,1)'); d.addColorStop(0.62, 'rgba(0,0,0,1)'); d.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = d; g.fillRect(0, 0, 64, 64); return (_bolita = c);
}
const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/* tamaño del lienzo para un rectángulo del mundo (máx. 1024 de lado) y pasos de conversión */
function medida(rect) { const w = rect.x1 - rect.x0, h = rect.z1 - rect.z0, k = Math.min(1.6, 1024 / Math.max(w, h)); return { W: Math.max(8, Math.round(w * k)), H: Math.max(8, Math.round(h * k)), k }; }
/* tinta: pinta con el pincel donde haya bolitas y la tiñe de un color (acuarela: relleno suave y un borde algo más oscuro) */
function tintar(destino, tinta, color, alfa, borde) {
  const g = destino.getContext('2d'), W = tinta.width, H = tinta.height, [r, gg, b] = COL_RGB(color);
  const col = lienzo(W, H), cg = col.getContext('2d'); cg.drawImage(tinta, 0, 0); cg.globalCompositeOperation = 'source-in'; cg.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')'; cg.fillRect(0, 0, W, H);
  g.globalAlpha = alfa; g.drawImage(col, 0, 0);
  if (borde) { g.globalAlpha = borde; g.drawImage(borde_(col, tinta, color), 0, 0); }
  g.globalAlpha = 1;
}
function borde_(col, tinta, color) {      // solo el contorno: la mancha menos la mancha encogida
  const W = col.width, H = col.height, o = lienzo(W, H), g = o.getContext('2d'); g.drawImage(col, 0, 0);
  g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; const s = 0.9; g.drawImage(tinta, W * (1 - s) / 2, H * (1 - s) / 2, W * s, H * s); return o;
}
function pintarManchas(D) {
  const { W, H, k } = medida(D.rect), cv = lienzo(W, H), R = 21 * k, r = D.rect;
  for (const b of D.barrios) {
    const t = lienzo(W, H), g = t.getContext('2d'), br = bolita(), pon = (x, z, rad) => g.drawImage(br, (x - r.x0) * k - rad, (z - r.z0) * k - rad, rad * 2, rad * 2);
    for (const c of D.casas) if (c.barrio === b.i) pon(c.x, c.z, R);
    pon(b.x, b.z, R * 1.3);
    tintar(cv, t, COL_ESTADO[b.estado], 0.46, 0.7);
  }
  return cv;
}
function pintarZona(D, celdas, color, alfa = 0.42) {
  const { W, H, k } = medida(D.rect), cv = lienzo(W, H), t = lienzo(W, H), g = t.getContext('2d'), br = bolita(), r = D.rect, R = 11 * k;
  for (const c of celdas) { const [x, z] = centroCelda(D.g, c); if (x < r.x0 - 20 || x > r.x1 + 20 || z < r.z0 - 20 || z > r.z1 + 20) continue; g.drawImage(br, (x - r.x0) * k - R, (z - r.z0) * k - R, R * 2, R * 2); }
  tintar(cv, t, color, alfa, 0.5); return cv;
}
function trazarGota(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y - s); g.bezierCurveTo(x + s * 0.25, y - s * 0.5, x + s * 0.72, y - s * 0.1, x + s * 0.72, y + s * 0.34); g.arc(x, y + s * 0.34, s * 0.72, 0, Math.PI, false);
  g.bezierCurveTo(x - s * 0.72, y - s * 0.1, x - s * 0.25, y - s * 0.5, x, y - s); g.closePath();
}

export function montarBarrioUI(vista, ctx) {
  const G = window.Game, U = window.UI;
  if (!document.getElementById('barrio-ui-css')) { const st = document.createElement('style'); st.id = 'barrio-ui-css'; st.textContent = CSS; document.head.appendChild(st); }
  const host = vista.host, app = document.getElementById('app') || document.body;
  const etq = document.createElement('div'); etq.className = 'bui-etq'; host.appendChild(etq);
  const gotas = document.createElement('canvas'); gotas.className = 'bui-gotas'; host.appendChild(gotas);
  const btn = document.createElement('button'); btn.id = 'bui-capa'; btn.type = 'button'; btn.hidden = true; btn.setAttribute('aria-label', 'Ver necesidades de los barrios'); btn.innerHTML = svg('capas', 26); app.appendChild(btn);
  const fila = document.createElement('div'); fila.id = 'bui-fila'; fila.hidden = true; app.appendChild(fila);
  const ley = document.createElement('div'); ley.id = 'bui-ley'; ley.hidden = true; app.appendChild(ley);
  const ficha = document.createElement('div'); ficha.id = 'bui-ficha'; ficha.hidden = true; app.appendChild(ficha);

  const est = { D: null, clave: '', capa: null, barrio: -1, firma: '', raf: 0, etqs: [], visible: false, t: 0 };

  /* ----- datos ----- */
  const ciudadId = () => U && U.city;
  const claveDe = E => (ciudadId() || '') + '|' + (E ? E.rev + '|' + E.mesN + '|' + E.parcelas.length + '|' + E.edificios.length + '|' + E.barrios.length : '');
  function calcular(E) {
    const c = G.state && G.state.cities[ciudadId()], cl = c && G.clases ? G.clases(c) : null;
    const prev = est.D && est.D.E === E ? est.D : null;
    const D = datosCiudad(E, cl, c && c.nec);
    if (prev) D.barrios.forEach(b => { const p = prev.barrios[b.i]; if (p) { const d = b.animo - p.animo; b.tend = Math.abs(d) < 2 ? (p.tend || 0) : d > 0 ? 1 : -1; } });
    return D;
  }
  function refrescar() {
    const E = G && G.ciudadE && U ? G.ciudadE(ciudadId()) : null;
    if (!E || !E.fundada) { if (est.D) { est.D = null; est.clave = ''; limpiarTodo(); } return false; }
    const k = claveDe(E);
    if (k !== est.clave) { est.clave = k; est.D = calcular(E); pintarCapas(); if (est.barrio >= 0) pintaFicha(); }
    return true;
  }
  function limpiarTodo() { vista.quitarCapa('barrios'); vista.quitarCapa('zonas'); vista.quitarCapa('remedio'); etq.replaceChildren(); est.etqs = []; est.capa = null; est.barrio = -1; fila.hidden = true; ley.hidden = true; ficha.hidden = true; gotas.getContext('2d').clearRect(0, 0, gotas.width, gotas.height); }

  /* ----- capas del suelo ----- */
  function pintarCapas() {
    const D = est.D; if (!D) return;
    if (est.capa) { vista.quitarCapa('barrios'); const cv = pintarZona(D, zonaNecesidad(D, est.capa), COL_NEC[est.capa], 0.5); vista.capaSuelo('zonas', cv, D.rect, { orden: 1 }); }
    else { vista.quitarCapa('zonas'); vista.capaSuelo('barrios', pintarManchas(D), D.rect, { orden: 0 }); }
    pintarRemedio(); ponerEtiquetas(); est.firma = ''; posicionar();
  }
  function pintarRemedio() {
    const D = est.D, b = est.barrio >= 0 && D ? D.barrios[est.barrio] : null, r = b && b._rem;
    if (!r || r.celda === null || r.celda === undefined) { vista.quitarCapa('remedio'); return; }
    vista.capaSuelo('remedio', pintarZona(D, zonaServicio(D, r.servicio, r.celda).keys(), COL_NEC[r.necesidad] || '#2f8fe0', 0.5), D.rect, { orden: 2 });
  }

  /* ----- etiquetas de barrio ----- */
  function ponerEtiquetas() {
    const D = est.D; etq.replaceChildren(); est.etqs = [];
    if (!D) return;
    for (const b of D.barrios) {
      const e = document.createElement('button'); e.type = 'button'; e.dataset.b = b.i; e.className = b.estado === 'mal' ? 'mal' : ''; e.setAttribute('aria-label', b.nombre);
      e.innerHTML = cara(b.estado, 22) + '<span>' + esc(b.corto) + '</span>'; e.addEventListener('click', ev => { ev.stopPropagation(); abrirFicha(b.i); });
      etq.appendChild(e); est.etqs.push(e);
    }
  }
  function posicionar() {
    const D = est.D, r = host.getBoundingClientRect(), H = r.height, W = r.width;
    // etiquetas: solo con la ciudad a la vista, sin capa y sin ficha; lejos de la barra de arriba y de los botones de abajo
    const verEtq = !!D && est.visible && !est.capa && est.barrio < 0;
    est.etqs.forEach((e, i) => {
      const b = D && D.barrios[i]; if (!b || !verEtq) { e.style.display = 'none'; return; }
      const p = vista.aPantalla(b.x, b.z, 6), x = p.x - r.left, y = p.y - r.top, w = e.offsetWidth || 90;
      if (!p.ok || y < 190 || y > H - 110) { e.style.display = 'none'; return; }
      e.style.display = ''; e.style.transform = 'translate(' + Math.round(Math.max(4, Math.min(W - w - 4, x - w / 2))) + 'px,' + Math.round(y - 15) + 'px)';
    });
    pintarGotas();
  }
  function pintarGotas() {
    const r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (gotas.width !== w || gotas.height !== h) { gotas.width = w; gotas.height = h; }
    const g = gotas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
    const D = est.D; if (!D || !est.capa || !est.visible) return;
    const cam = vista.camObj(), s = Math.max(6.5, Math.min(13, 2600 / cam.d)), vistas = new Set();
    g.lineWidth = 1.6; g.strokeStyle = '#fff'; g.fillStyle = '#d4382f';
    for (const c of casasSin(D, est.capa)) {
      const p = vista.aPantalla(c.x, c.z, 8); if (!p.ok) continue;
      const x = p.x - r.left, y = p.y - r.top, k = Math.round(x / (s * 1.7)) + ',' + Math.round(y / (s * 1.9)); if (vistas.has(k)) continue; vistas.add(k);
      if (y < 150 || y > r.height - 150) continue;
      trazarGota(g, x, y - s * 0.4, s); g.fill(); g.stroke();
      g.beginPath(); g.arc(x - s * 0.22, y + s * 0.05, s * 0.18, 0, 6.3); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill(); g.fillStyle = '#d4382f';
    }
  }

  /* ----- capa de necesidades ----- */
  function colocaBoton() {
    const ref = document.querySelector('.vo.plano'), rr = ref ? ref.getBoundingClientRect() : null, ar = app.getBoundingClientRect();
    btn.style.top = Math.round(rr && rr.height ? rr.bottom - ar.top + 10 : 360) + 'px';
    const sal = [...document.querySelectorAll('button')].find(q => q.offsetParent && /Salir al mapa/.test(q.textContent || '')), sr = sal ? sal.getBoundingClientRect() : null;
    ley.style.top = Math.round(sr && sr.height ? sr.bottom - ar.top + 6 : 154) + 'px';
  }
  function pintaFila() {
    const D = est.D, c = est.capa, n = c && NEC.NECESIDADES.find(q => q.id === c);
    const sin = c && D ? casasSin(D, c).length : 0;
    fila.innerHTML = '<div class="bf-ico">' + NEC.NECESIDADES.map(q => '<button type="button" data-n="' + q.id + '" aria-label="' + esc(q.nombre) + '" aria-pressed="' + (q.id === c) + '" class="' + (q.id === c ? 'on' : '') + '" style="background:' + COL_NEC[q.id] + '">' + svg(q.id, 22) + '</button>').join('') + '</div>' +
      '<div class="bf-tx"><b>' + (n ? esc(n.nombre) + ' · ' + (sin ? sin + (sin === 1 ? ' casa sin llegar' : ' casas sin llegar') : 'llega a todas') : 'Elige una necesidad') + '</b><button type="button" class="bf-x" data-n="">✕ Cerrar</button></div>';
  }
  function ponerCapa(id) {
    est.capa = id || null; if (id) cerrarFicha();
    pintaFila(); pintarCapas();
  }
  let filaAbierta = false;
  function alternaFila(abrir) {
    filaAbierta = abrir; fila.hidden = !abrir || !est.visible; ley.hidden = !abrir || !est.visible; btn.classList.toggle('on', abrir);
    if (abrir) { cerrarFicha(); colocaBoton(); pintaLey(); pintaFila(); } else if (est.capa) { est.capa = null; pintarCapas(); }
  }
  function pintaLey() {
    ley.innerHTML = ['bien', 'falta', 'mal'].map(e => '<span><i style="background:' + COL_ESTADO[e] + '"></i>' + TXT_ESTADO[e] + '</span>').join('') + '<span><i class="g" style="background:#d4382f"></i>Sin llegar</span>';
  }
  btn.addEventListener('click', () => alternaFila(!filaAbierta));
  fila.addEventListener('click', e => { const t = e.target.closest('[data-n]'); if (!t) return; const n = t.dataset.n; if (!n || n === est.capa) { if (!n) alternaFila(false); else ponerCapa(null); } else ponerCapa(n); });

  /* ----- ficha del barrio ----- */
  function trozo(b) {
    const f = b.ficha, r = b._rem, mini = ctx.minis && ctx.minis() || {};
    const tend = b.tend > 0 ? '<span class="tb-bien">↗ sube</span>' : b.tend < 0 ? '<span class="tb-mal">↘ baja</span>' : '<span>→ estable</span>';
    const humor = { contento: 'Contentos', normal: 'Conformes', descontento: 'Descontentos' }[b.humor] + (b.revuelta ? ' · en revuelta' : '');
    const dom = b.dom, pesos = NEC.PESOS[dom], pide = Object.keys(pesos).filter(k => pesos[k] > 0).sort((p, q) => pesos[q] - pesos[p]).slice(0, 3);
    const CORTO = { alimento: 'Comida', agua: 'Agua', limpieza: 'Limpieza', salud: 'Salud', trabajo: 'Trabajo', cultura: 'Cultura', culto: 'Ocio', orden: 'Orden' }, nombreNec = id => NEC.NECESIDADES.find(q => q.id === id).nombre;
    let h = '<div class="bu-grip"></div><div class="bu-cab"><div><h3>' + esc(b.nombre) + ' · ' + b.claseNombre + '</h3><div class="bu-sub"><span>' + b.pop.toLocaleString('es-ES') + ' vecinos</span>' + nivelSvg(f.nivel.id) + '<span>' + esc(f.nivel.nombre) + '</span></div></div><button type="button" class="bu-x" data-bu="x" aria-label="Cerrar la ficha">✕</button></div>';
    h += '<div class="bu-cuerpo">';
    if (b.revuelta) h += '<div class="bu-rev"><b>En revuelta:</b> no paga ni obedece.</div>';
    h += '<div class="bu-animo"><div class="t"><span>Ánimo de ' + (b.claseNombre === 'plebe' ? 'la plebe' : 'los ' + b.claseNombre) + '</span>' + tend + '</div><div class="t"><b class="tb-' + b.estado + '">' + humor + '</b><span>' + b.animo + ' / 100</span></div>' +
      '<div class="bu-barra"><u style="left:60%"></u><i style="left:' + Math.max(2, Math.min(98, b.animo)) + '%"></i></div><div class="bu-ext"><span>Revuelta</span><span>Contentos</span></div></div>';
    h += '<div class="bu-grid">' + f.necesidades.map(n => { const col = n.estado === 'cubierta' ? COL_ESTADO.bien : n.estado === 'falta' ? COL_ESTADO.falta : COL_ESTADO.mal, cl = n.estado === 'cubierta' ? 'bien' : n.estado;
      return '<button type="button" class="bu-nec" data-bu="nec" data-n="' + n.id + '" aria-label="' + esc(n.nombre) + ': ' + pct(n.frac) + '%. Ver dónde llega"><span class="ic" style="background:' + col + '">' + svg(n.id, 17) + '</span><span class="mid"><span class="nm">' + esc(n.nombre) + '</span><span class="br"><i style="width:' + pct(n.frac) + '%;background:' + col + '"></i></span></span><span class="pc tb-' + cl + '">' + pct(n.frac) + '%</span></button>'; }).join('') + '</div>';
    h += '<div class="bu-pide">Pide: ' + pide.map(k => '<span class="bu-chip">' + svg(k, 16) + esc(CORTO[k]) + '</span>').join('') + '</div>';
    if (f.avisos.length && !b.revuelta) h += '<div class="bu-av">' + esc(f.avisos[0]) + '</div>';
    if (r && r.servicio) {
      const sv = NEC.SERVICIOS[r.servicio], img = mini[r.tipoJuego], min = img ? '<img src="' + img + '" alt="" draggable="false">' : svg(GLIFO_SERV[r.servicio] || 'capas', 40);
      h += '<div class="bu-rem"><div class="mini">' + min + '</div><div class="tx"><span>Mejor remedio</span><b>' + esc(sv ? sv.nombre : r.servicio) + '</b>' + (r.casas ? '<em>llegaría a ' + r.casas + (r.casas === 1 ? ' casa' : ' casas') + '</em>' : '<em>no hay sitio con calle</em>') + ' · ' + esc(nombreNec(r.necesidad).toLowerCase()) + '<br><span class="mn">Ministro de ' + esc(NEC.NOMBRE_MINISTRO[r.ministro] || r.ministro) + '</span></div></div>';
    } else h += '<div class="bu-rem"><div class="mini">' + svg('orden', 38) + '</div><div class="tx"><b>Todo cubierto</b>Este barrio no echa nada en falta.</div></div>';
    h += '</div>';
    const ministro = r ? NEC.NOMBRE_MINISTRO[r.ministro] || r.ministro : '';
    if (b.revuelta) h += '<div class="bu-bt tres"><button type="button" data-bu="calmar" data-r="grano">' + svg('grano', 18) + 'Repartir grano</button><button type="button" data-bu="calmar" data-r="juegos">' + svg('juegos', 18) + 'Dar juegos</button><button type="button" data-bu="calmar" data-r="tropas">' + svg('tropas', 18) + 'Tropas</button></div>';
    if (r && r.servicio) {
      const puede = !!(CI.EDIF[r.tipoJuego]);
      h += '<div class="bu-bt dos"><button type="button" class="pri" data-bu="construir"' + (puede ? '' : ' aria-disabled="true"') + '>' + (puede ? 'Construir la mejora' : 'Aún no se puede') + '</button><button type="button" class="sec" data-bu="encargar">Encargar al ministro</button></div>';
    }
    return h;
  }
  function pintaFicha() {
    const D = est.D, b = D && D.barrios[est.barrio]; if (!b) { cerrarFicha(); return; }
    b._rem = remedioBarrio(D, b); ficha.innerHTML = trozo(b); pintarRemedio();
  }
  function abrirFicha(i) {
    if (!est.D) return; const b = est.D.barrios[i]; if (!b) return;
    if (filaAbierta) alternaFila(false);
    if (ctx.cerrarMenu) ctx.cerrarMenu();
    est.barrio = i; ficha.hidden = false; ficha.scrollTop = 0; pintaFicha(); posicionar();
    try { // el barrio sube a la parte que la ficha no tapa
      const cam = vista.camObj(), r = host.getBoundingClientRect(), ft = ficha.getBoundingClientRect().top, objetivo = [r.left + r.width / 2, Math.max(r.top + 170, (r.top + 150 + ft) / 2)], g = vista.sueloEn(objetivo[0], objetivo[1]);
      if (g) { est.camPrev = { tx: cam.tx, tz: cam.tz }; cam.tx += b.x - g[0]; cam.tz += b.z - g[1]; est.camSet = { tx: cam.tx, tz: cam.tz }; est.firma = ''; }
    } catch (e) { /* la vista sigue donde estaba */ }
  }
  function cerrarFicha() {
    if (est.barrio < 0 && ficha.hidden) return;
    const cm = vista.camObj(); if (est.camPrev && est.camSet && Math.abs(cm.tx - est.camSet.tx) < 1 && Math.abs(cm.tz - est.camSet.tz) < 1) { cm.tx = est.camPrev.tx; cm.tz = est.camPrev.tz; } est.camPrev = est.camSet = null;
    est.barrio = -1; ficha.hidden = true; vista.quitarCapa('remedio'); posicionar(); }
  function avisa(t) { if (ctx.aviso) ctx.aviso(t); }
  const evento = (nombre, detalle) => { const ev = new CustomEvent(nombre, { detail: detalle, bubbles: true, cancelable: true }); document.dispatchEvent(ev); return ev.defaultPrevented; };
  ficha.addEventListener('click', e => {
    const t = e.target.closest('[data-bu]'); if (!t) return; const a = t.dataset.bu, D = est.D, b = D && D.barrios[est.barrio], r = b && b._rem;
    if (a === 'x') cerrarFicha();
    else if (a === 'nec') { cerrarFicha(); alternaFila(true); ponerCapa(t.dataset.n); }
    else if (a === 'construir' && r) {
      const tipo = r.tipoJuego, puede = !!(CI.EDIF[tipo]);
      const atendido = evento('barrio:construir', { tipo, servicio: r.servicio, celda: r.celda, barrio: b.i, remedio: r });
      if (!puede) { avisa((r.nombre || 'Esa obra') + ': llegará pronto.'); return; }
      if (atendido) return;
      try { if (r.celda !== null && r.celda >= 0) { const [x, z] = centroCelda(D.g, r.celda), cm = vista.camObj(); cm.tx = x; cm.tz = z; } } catch (er) { /* sigue */ }
      cerrarFicha(); if (ctx.elegir) ctx.elegir(tipo);
    }
    else if (a === 'encargar' && r) { if (!evento('barrio:encargar', Object.assign({ barrio: b.i }, r))) avisa('El ministro de ' + (NEC.NOMBRE_MINISTRO[r.ministro] || r.ministro) + ' aún no recibe encargos desde aquí.'); }
    else if (a === 'calmar') { if (!evento('barrio:calmar', { barrio: b.i, remedio: t.dataset.r })) avisa('Calmar el barrio con ' + { grano: 'grano', juegos: 'juegos', tropas: 'tropas' }[t.dataset.r] + ' llegará pronto.'); }
  });

  /* ----- tocar una casa en el suelo ----- */
  let toque = null; const cv = vista.cv;
  cv.addEventListener('pointerdown', e => { toque = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  cv.addEventListener('pointerup', e => {
    const t0 = toque; toque = null; if (!t0 || !est.visible || !est.D || est.capa) return;
    if (Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > 8 || performance.now() - t0.t > 450) return;
    setTimeout(() => {
      if (U.bsel || (U.modo3 && U.modo3 !== 'mirar')) return;
      const g = vista.sueloEn(e.clientX, e.clientY); if (!g) return;
      let m = 14, hit = null; for (const c of est.D.casas) { const d = Math.hypot(c.x - g[0], c.z - g[1]); if (d < m) { m = d; hit = c; } }
      if (hit) abrirFicha(hit.barrio);
    }, 0);
  });

  /* ----- bucle (solo mientras la ciudad está a la vista) ----- */
  function vivo() { return !!(U && U.tab === 'city' && U.cityV === vista && !U.cityList && !U.fundar && host.offsetParent !== null && vista.listo); }
  function tick() {
    est.raf = 0;
    const ver = vivo() && (U.modo3 || 'mirar') === 'mirar' && !U.bsel, antes = est.visible;
    est.visible = ver && refrescar();
    if (est.visible !== antes) {
      etq.style.display = ver ? '' : 'none'; btn.hidden = !est.visible; gotas.style.display = est.visible ? '' : 'none';
      if (est.visible) { colocaBoton(); fila.hidden = !filaAbierta; ley.hidden = !filaAbierta; if (est.D) pintarCapas(); }
      else { fila.hidden = true; ley.hidden = true; ficha.hidden = true; vista.quitarCapa('barrios'); vista.quitarCapa('zonas'); vista.quitarCapa('remedio'); est.barrio = -1; est.capa = null; filaAbierta = false; btn.classList.remove('on'); est.firma = ''; posicionar(); }
    }
    if (est.visible) { const f = vista.firma(); if (f !== est.firma) { est.firma = f; posicionar(); } }
    if (vivo()) est.raf = requestAnimationFrame(tick); else est.raf = setTimeout(tick, 400);
  }
  function despierta() { if (!est.raf) est.raf = requestAnimationFrame(tick); }
  const api = { sync() { despierta(); }, cerrar() { cerrarFicha(); if (filaAbierta) alternaFila(false); }, abrirFicha, ponerCapa, alternaFila, get estado() { return est; } };
  window.BarrioUI = api; return api;
}
