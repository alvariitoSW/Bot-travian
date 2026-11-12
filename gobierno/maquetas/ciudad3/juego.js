/* Maqueta Q1k — el mando: pantalla (una línea arriba, una bandeja abajo), dedos, reloj por meses y ganchos de prueba.
   Une reglas.js (sin pantalla) con vista.js (3D). Todo lo de este archivo es inventado. */
import * as R from './reglas.js';
import * as V from './vista.js';

const Q = new URLSearchParams(location.search), SEMILLA = +(Q.get('semilla') || 1) || 1;
const $ = id => document.getElementById(id);
const MES_S = 4.5, MES_RAPIDO = 1.2;
let E = R.crear(SEMILLA), modo = 'fundar', sel = null, pausa = false, rapido = false, acum = 0, avisoHasta = 0, minis = {}, camA = null, tUlt = performance.now(), fichasVistas = '';

/* ---------- línea de contexto: una sola, bajo la barra ---------- */
const NOTA = { verde: 'Buen sitio', ocre: 'Sitio regular', rojo: 'Mal sitio', nada: 'Aquí no' };      // verde: nota 3 o más · ocre: 0 a 2 · rojo: negativa o no vale
function linea(texto, clase = '', nota = '') { const l = $('linea'); if (!texto) { l.hidden = true; return; } l.hidden = false; l.className = clase; $('l-nota').textContent = nota; $('l-nota').hidden = !nota; $('l-texto').textContent = texto; }
function aviso(texto, clase = 'aviso', seg = 7) { linea(texto, clase); avisoHasta = performance.now() + seg * 1000; }
const razones = (s, vale) => linea(s.razones.join(' · '), 'sitio ' + (vale ? R.color(s.nota) : 'rojo'), vale ? NOTA[R.color(s.nota)] : 'Aquí no');

/* ---------- barra y bandeja ---------- */
function barra() { const f = R.fecha(E), ing = R.ingreso(E); $('h-fecha').textContent = f.texto.replace(' de ', ' '); $('h-pob').textContent = E.fundada ? R.poblacion(E).toLocaleString('es') : '300'; $('h-mon').textContent = Math.floor(E.monedas).toLocaleString('es'); $('h-ing').textContent = E.fundada ? '+' + ing + ' al mes' : ''; }
function bandeja() {
  const ids = E.abiertas.filter(id => id !== 'muralla' || R.murallaSiguiente(E) || E.muralla.obra), firma = ids.join() + '|' + E.muralla.fase + E.muralla.obra + '|' + Object.keys(minis).length;
  const b = $('bandeja');
  if (firma !== fichasVistas) { const antes = fichasVistas.split('|')[0].split(','); fichasVistas = firma;
    b.innerHTML = ids.map(id => { const D = R.EDIF[id], m = id === 'muralla' ? R.murallaSiguiente(E) : null, nombre = id === 'muralla' ? (E.muralla.fase ? 'Muralla de piedra' : 'Empalizada') : D.nombre, coste = m ? m.coste : D.coste;
      return `<button class="ficha${antes.length > 1 && !antes.includes(id) ? ' nueva' : ''}" data-id="${id}" data-coste="${coste}">${minis[id] ? `<img src="${minis[id]}" alt="" draggable="false">` : '<i></i>'}<b>${nombre}</b><span>${id === 'muralla' && E.muralla.obra ? 'en obra' : coste}</span></button>`; }).join(''); }
  for (const f of b.children) f.classList.toggle('cara', E.monedas < +f.dataset.coste);
}
function pantalla() {
  document.body.dataset.modo = modo; barra(); bandeja();
  const si = $('b-si'), no = $('b-no'); no.hidden = modo === 'fundar';
  if (modo === 'fundar') { si.textContent = 'Fundar aquí'; si.disabled = !(sel && sel.vale); }
  else if (modo === 'colocar') { const D = R.EDIF[sel.id], falta = D.coste - E.monedas; si.textContent = falta > 0 ? 'Faltan ' + Math.ceil(falta) + ' monedas' : 'Construir aquí · ' + D.coste; si.disabled = !sel.vale || falta > 0; }
  else if (modo === 'muralla') { const m = R.murallaSiguiente(E), falta = m ? m.coste - E.monedas : 0; si.textContent = !m ? 'En obra' : falta > 0 ? 'Faltan ' + Math.ceil(falta) + ' monedas' : m.nombre + ' · ' + m.coste; si.disabled = !m || falta > 0; }
  $('b-pausa').textContent = pausa ? 'Seguir' : 'Pausa'; $('b-rapido').textContent = rapido ? 'Normal' : 'Rápido'; $('b-rapido').classList.toggle('on', rapido); $('b-pausa').classList.toggle('on', pausa);
}

/* ---------- fundar ---------- */
const FRASE = 'Año 273 a. C. El Senado te envía con 300 familias a fundar una colonia. Elige dónde clavar la groma: toca el terreno.';
function empezarFundar() { modo = 'fundar'; sel = null; V.calor(R.mapaCalor(E, 'fundar')); V.ponerGroma(null); linea(FRASE, 'frase'); pantalla(); }
function moverGroma(x, z) { const s = R.notaFundar(E, x, z); sel = { x, z, vale: s.vale, nota: s.nota }; V.ponerGroma({ x, z, color: s.vale ? R.color(s.nota) : 'rojo' }); razones(s, s.vale); pantalla(); }
function fundarAqui() { if (!sel || !R.fundar(E, sel.x, sel.z)) return false; V.calor(null); V.ponerGroma(null); V.surcar(); modo = 'jugar'; sel = null; acum = 0;
  camA = { tx: E.foro.x, tz: E.foro.z, d: 430, t0: performance.now(), de: { ...V.cam } };
  aviso('El arado traza el surco: es el límite sagrado de la ciudad. Dentro, el foro y las primeras tiendas.', 'aviso', 5); setTimeout(() => { if (performance.now() >= avisoHasta - 200) aviso('Toca una ficha y elige dónde construir. Las casas y las calles nacen solas.', 'aviso', 9); }, 5200); pantalla(); return true; }

/* ---------- colocar ---------- */
function empezarColocar(id, p) {
  if (!E.fundada) return; if (id === 'muralla') { modo = 'muralla'; sel = null; V.ponerFantasma(null); V.calor(null); const m = R.murallaSiguiente(E); linea(m ? (E.muralla.fase ? 'La empalizada se rehace en piedra, con torres y puertas donde cruzan las calles.' : 'La empalizada sigue el surco, con puertas donde cruzan las calles. Las casas de fuera quedan de arrabal.') : 'La obra de la muralla ya está en marcha.', 'aviso'); pantalla(); return; }
  modo = 'colocar'; sel = { id }; V.calor(R.mapaCalor(E, id)); if (!p) p = V.sueloEn(innerWidth / 2, innerHeight * 0.45) || [E.foro.x, E.foro.z]; moverSel(p[0], p[1]); }
function moverSel(x, z) { const s = R.notaSitio(E, sel.id, x, z); Object.assign(sel, { x, z, vale: s.vale, nota: s.nota }); V.ponerFantasma({ id: sel.id, x, z, ang: s.ang || 0, color: s.vale ? R.color(s.nota) : 'rojo', radio: s.vale ? s.radio : 0 }); razones(s, s.vale); pantalla(); }
function salirColocar() { modo = 'jugar'; sel = null; V.ponerFantasma(null); V.calor(null); if (performance.now() > avisoHasta) linea(''); pantalla(); }
function construir() {
  if (modo === 'fundar') return fundarAqui();
  if (modo === 'muralla') { const r = R.levantarMuralla(E); if (r.ok) { salirColocar(); aviso(E.muralla.fase ? 'Empieza la muralla de piedra: tres meses de obra.' : 'Empieza la empalizada: tres meses de obra.'); } else aviso(r.motivo, 'aviso malo', 4); return r.ok; }
  if (modo !== 'colocar') return false; const id = sel.id, r = R.colocar(E, id, sel.x, sel.z); if (!r.ok) { aviso(r.motivo, 'aviso malo', 4); return false; }
  salirColocar(); aviso('Obra en marcha: ' + R.EDIF[id].nombre.replace('Abrir barrio', 'capilla de cruce').toLowerCase() + ' (' + (R.EDIF[id].obra === 1 ? 'un mes' : R.EDIF[id].obra + ' meses') + '). Le nace sola una calle.', 'aviso', 5); return true; }

/* ---------- reloj ---------- */
function pasarMes() { const av = R.mes(E); if (av.length) { const a = av[0]; aviso(a.t, 'aviso ' + (a.c || ''), a.p >= 4 ? 10 : 7); } pantalla(); return av; }
function etiquetas() { const c = $('etiquetas'), ver = E.fundada && V.cam.d > 400 && modo === 'jugar'; c.hidden = !ver; if (!ver) return;
  while (c.children.length < E.barrios.length) c.appendChild(document.createElement('div')); E.barrios.forEach((b, i) => { const p = V.aPantalla(b.x, b.z, 34), d = c.children[i], t = b.corto + ' · ' + R.ROMANOS[b.nivel || 1]; if (d.textContent !== t) d.textContent = t; const w = d.offsetWidth / 2 + 6; d.style.transform = `translate(${Math.round(Math.max(w, Math.min(innerWidth - w, p.x)))}px,${Math.round(p.y)}px) translate(-50%,-100%)`; d.style.visibility = p.ok && p.y > 110 && p.y < innerHeight - 190 ? 'visible' : 'hidden'; }); }
function bucle(t) {
  requestAnimationFrame(bucle); const dt = Math.min(0.1, (t - tUlt) / 1000); tUlt = t;
  if (camA) { const u = Math.min(1, (t - camA.t0) / 1100), f = 1 - Math.pow(1 - u, 3); V.cam.tx = camA.de.tx + (camA.tx - camA.de.tx) * f; V.cam.tz = camA.de.tz + (camA.tz - camA.de.tz) * f; V.cam.d = camA.de.d + (camA.d - camA.de.d) * f; V.ponerCamara(); if (u >= 1) camA = null; }
  if (modo === 'jugar' && !pausa && E.fundada) { acum += dt; const dur = rapido ? MES_RAPIDO : MES_S; if (acum >= dur) { acum = 0; pasarMes(); } $('progreso').style.transform = `scaleX(${Math.min(1, acum / dur)})`; }
  if (avisoHasta && t > avisoHasta && modo === 'jugar') { avisoHasta = 0; linea(''); }
  V.cuadro(); etiquetas();
}

/* ---------- dedos y ratón sobre el terreno ---------- */
const lz = $('lienzo'), dedos = new Map(); let gesto = null;
const cercaDeSel = (x, y) => { if (!sel || sel.x === undefined) return false; const p = V.aPantalla(sel.x, sel.z, 4); return Math.hypot(p.x - x, p.y - y) < 64; };
function tocar(x, y) { const g = V.sueloEn(x, y); if (!g) return;
  if (modo === 'fundar') return moverGroma(g[0], g[1]); if (modo === 'colocar') return moverSel(g[0], g[1]); if (modo !== 'jugar' || !E.fundada) return;
  const ed = E.edificios.find(e => Math.hypot(e.x - g[0], e.z - g[1]) < Math.max(e.w, e.d) * 0.6);
  if (ed) return aviso(R.EDIF[ed.tipo].nombre.replace('Abrir barrio', 'Capilla de cruce') + (ed.obra ? ' · en obra, ' + ed.obra + (ed.obra === 1 ? ' mes' : ' meses') : ed.ruina ? ' · en ruina por la crecida' : ' · ' + R.EDIF[ed.tipo].que.toLowerCase()), 'aviso', 6);
  const b = R.barrioDe(E, g[0], g[1]); if (b >= 0) aviso(R.textoBarrio(E, b), 'aviso barrio', 7); }
lz.addEventListener('pointerdown', e => { lz.setPointerCapture(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); camA = null;
  if (dedos.size === 1) gesto = { tipo: (modo === 'fundar' || modo === 'colocar') && cercaDeSel(e.clientX, e.clientY) ? 'ficha' : e.button === 2 || e.shiftKey ? 'giro' : 'mover', x0: e.clientX, y0: e.clientY, t0: performance.now(), movido: 0, g: V.sueloEn(e.clientX, e.clientY), dx: 0, dy: 0 };
  if (gesto && gesto.tipo === 'ficha') { const p = V.aPantalla(sel.x, sel.z); gesto.dx = p.x - e.clientX; gesto.dy = p.y - e.clientY; }
  if (dedos.size === 2) { const [a, b] = [...dedos.values()]; gesto = { tipo: 'dos', d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), cd: V.cam.d, az: V.cam.az, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, movido: 99 }; } });
lz.addEventListener('pointermove', e => { const p = dedos.get(e.pointerId); if (!p || !gesto) return; const ax = p.x, ay = p.y; p.x = e.clientX; p.y = e.clientY;
  if (gesto.tipo === 'dos' && dedos.size >= 2) { const [a, b] = [...dedos.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; let da = ang - gesto.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    V.cam.d = gesto.cd * gesto.d / Math.max(20, d); if (Math.abs(da) > 0.12 || gesto.gira) { gesto.gira = true; V.cam.az = gesto.az - da; } const k = V.cam.d / innerHeight * 0.9, c = Math.cos(V.cam.az), s = Math.sin(V.cam.az), ux = -(mx - gesto.mx) * k, uy = -(my - gesto.my) * k * 1.6; V.cam.tx += ux * c + uy * s; V.cam.tz += -ux * s + uy * c; gesto.mx = mx; gesto.my = my; V.ponerCamara(); return; }
  if (dedos.size !== 1) return; gesto.movido = Math.max(gesto.movido, Math.hypot(e.clientX - gesto.x0, e.clientY - gesto.y0));
  if (gesto.tipo === 'ficha') { const g = V.sueloEn(e.clientX + gesto.dx, e.clientY + gesto.dy); if (g) modo === 'fundar' ? moverGroma(g[0], g[1]) : moverSel(g[0], g[1]); }
  else if (gesto.tipo === 'giro') { V.cam.az -= (e.clientX - ax) * 0.008; V.ponerCamara(); }
  else if (gesto.movido > 6 && gesto.g) { const g = V.sueloEn(e.clientX, e.clientY); if (g) { V.cam.tx += gesto.g[0] - g[0]; V.cam.tz += gesto.g[1] - g[1]; V.ponerCamara(); } } });
const soltar = e => { if (!dedos.has(e.pointerId)) return; dedos.delete(e.pointerId); if (gesto && gesto.tipo !== 'dos' && dedos.size === 0 && gesto.movido < 9 && performance.now() - gesto.t0 < 600 && e.type === 'pointerup') tocar(e.clientX, e.clientY);
  if (dedos.size === 1) { const p = [...dedos.values()][0]; gesto = { tipo: 'mover', x0: p.x, y0: p.y, t0: 0, movido: 99, g: V.sueloEn(p.x, p.y) }; } else if (dedos.size === 0) gesto = null; };
lz.addEventListener('pointerup', soltar); lz.addEventListener('pointercancel', soltar);
lz.addEventListener('wheel', e => { e.preventDefault(); V.cam.d *= Math.exp(e.deltaY * 0.0012); V.ponerCamara(); }, { passive: false });
lz.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- bandeja: tocar una ficha, o arrastrarla hacia arriba para llevar el edificio bajo el dedo ---------- */
let arr = null;
$('bandeja').addEventListener('pointerdown', e => { const f = e.target.closest('.ficha'); if (!f) return; arr = { id: f.dataset.id, x0: e.clientX, y0: e.clientY, activo: false, pid: e.pointerId, f }; });
addEventListener('pointermove', e => { if (!arr || e.pointerId !== arr.pid) return; const dx = e.clientX - arr.x0, dy = e.clientY - arr.y0;
  if (!arr.activo) { if (dy < -16 && Math.abs(dy) > Math.abs(dx) && arr.id !== 'muralla') { arr.activo = true; try { arr.f.setPointerCapture(arr.pid); } catch (err) { /* sin captura */ } const g = V.sueloEn(e.clientX, e.clientY - 70); empezarColocar(arr.id, g); } else if (Math.abs(dx) > 16) arr = null; return; }
  const g = V.sueloEn(e.clientX, e.clientY - 70); if (g && modo === 'colocar') moverSel(g[0], g[1]); });
addEventListener('pointerup', e => { if (!arr || e.pointerId !== arr.pid) return; const a = arr; arr = null; if (!a.activo && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) < 12) empezarColocar(a.id); });
addEventListener('pointercancel', e => { if (arr && e.pointerId === arr.pid && !arr.activo) arr = null; });

$('b-si').onclick = construir; $('b-no').onclick = salirColocar;
$('b-pausa').onclick = () => { pausa = !pausa; pantalla(); }; $('b-rapido').onclick = () => { rapido = !rapido; pantalla(); };
let seguro = 0; $('b-nuevo').onclick = () => { if (performance.now() - seguro > 3000) { seguro = performance.now(); $('b-nuevo').textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { $('b-nuevo').textContent = 'Empezar de nuevo'; }, 3000); return; } seguro = 0; $('b-nuevo').textContent = 'Empezar de nuevo'; nueva(); };
function nueva(semilla = SEMILLA) { E = R.crear(semilla); pausa = false; rapido = false; acum = 0; fichasVistas = ''; Object.assign(V.cam, { tx: 110, tz: -150, d: 640, az: 0 }); V.ponerCamara(); V.mundo(E); empezarFundar(); }

/* ---------- arranque ---------- */
await V.montar(); await V.listo(); minis = V.miniaturas(); V.mundo(E); empezarFundar(); $('carga').hidden = true; requestAnimationFrame(bucle);

/* ---------- ganchos de prueba ---------- */
const VISTAS = { general: () => ({ tx: 110, tz: -150, d: 640, az: 0 }), foro: () => ({ tx: E.foro.x, tz: E.foro.z, d: 400, az: 0 }), cerca: () => ({ tx: E.foro.x, tz: E.foro.z - 10, d: 210, az: 0.5 }), lejos: () => ({ tx: E.foro ? E.foro.x : 110, tz: E.foro ? E.foro.z + 20 : -150, d: 820, az: 0 }) };
window.__q1k = {
  get E() { return E; }, reglas: R,
  tocar(x, z) { modo === 'fundar' ? moverGroma(x, z) : modo === 'colocar' && moverSel(x, z); },
  fundar(x, z) { moverGroma(x, z); return fundarAqui(); },
  elegir(id, x, z) { empezarColocar(id, x === undefined ? null : [x, z]); },
  colocar(id, x, z, gratis) { if (modo !== 'jugar') salirColocar(); const r = R.colocar(E, id, x, z, gratis); pantalla(); return r.ok ? true : r.motivo; },
  muralla(gratis) { const r = R.levantarMuralla(E, gratis); pantalla(); return r.ok ? true : r.motivo; },
  cancelar: salirColocar,
  mes(n = 1) { let ult = []; for (let i = 0; i < n; i++) { const a = pasarMes(); if (a.length) ult = a; } return ult.map(a => a.t); },
  mejor: (id, cerca) => R.mejorSitio(E, id, cerca), nota: (id, x, z) => id === 'fundar' ? R.notaFundar(E, x, z) : R.notaSitio(E, id, x, z),
  estado: () => ({ modo, pausa, rapido, ...R.estado(E) }), pausa(b = true) { pausa = b; pantalla(); }, monedas(n) { E.monedas = n; pantalla(); },
  vista(v) { camA = null; V.cam.elF = 0; Object.assign(V.cam, typeof v === 'string' ? VISTAS[v]() : v); V.ponerCamara(); return { ...V.cam }; },
  aPantalla: (x, z) => V.aPantalla(x, z), sueloEn: (x, y) => V.sueloEn(x, y), aviso, nueva,
  medidas: () => ({ ...V.medidas, casas: R.casas(E).length }), lista: true
};
