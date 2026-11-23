/* AQVILA — necesidades de los barrios: REGLAS sin pantalla (módulo ESM, corre igual en Node y en el navegador).
   Todo es licencia de juego: que el servicio (fuente, médico, templo…) llegue por la CALLE hasta la casa es una simplificación
   inventada para poder jugar. Funciones puras: no tocan pantalla, ni window, ni localStorage, ni azar, y no mutan lo que reciben.
   Se engancha desde game.js con G.usarNecesidades(modulo); eso lo hace otra sesión. */

export const NECESIDADES = [
  { id: 'alimento', nombre: 'Alimentación', ministro: 'agricultura', consecuencia: 'hambre' },
  { id: 'agua', nombre: 'Agua', ministro: 'infraestructura', consecuencia: 'fiebres' },
  { id: 'limpieza', nombre: 'Limpieza', ministro: 'infraestructura', consecuencia: 'fiebres' },
  { id: 'salud', nombre: 'Salud', ministro: 'infraestructura', consecuencia: 'fiebres' },
  { id: 'trabajo', nombre: 'Trabajo', ministro: 'artesania', consecuencia: 'se_van' },
  { id: 'cultura', nombre: 'Cultura', ministro: 'ciencia', consecuencia: 'pierde_votos' },
  { id: 'culto', nombre: 'Culto y ocio', ministro: 'culto', consecuencia: 'protesta' },
  { id: 'orden', nombre: 'Orden', ministro: 'ejercito', consecuencia: 'paran_obras' }
];

export const SERVICIOS = {
  fuente: { nombre: 'Fuente (lacus)', cubre: ['agua'], alcance: 10 },
  cloaca: { nombre: 'Cloaca', cubre: ['limpieza'], alcance: 20 },
  termas: { nombre: 'Baños (balneum)', cubre: ['limpieza', 'salud'], alcance: 20 },
  medico: { nombre: 'Tienda del médico', cubre: ['salud'], alcance: 20 },
  escuela: { nombre: 'Escuela (ludus)', cubre: ['cultura'], alcance: 20 },
  taller: { nombre: 'Taller', cubre: ['trabajo'], alcance: 20 },
  templo: { nombre: 'Templo', cubre: ['culto'], alcance: 30 },
  mercado: { nombre: 'Mercado', cubre: ['alimento', 'trabajo'], alcance: 30 },
  guardia: { nombre: 'Ronda nocturna (triunviros)', cubre: ['orden'], alcance: 30 },
  granero: { nombre: 'Granero (horreum)', cubre: ['alimento'], alcance: 45 },
  teatro: { nombre: 'Escena de los juegos', cubre: ['culto', 'cultura'], alcance: 45 }
};

export const UMBRAL = { cubierta: 0.8, mal: 0.3 };

export const NIVELES = [
  { id: 'chozas', nombre: 'Chozas', min: 0 },
  { id: 'atrio', nombre: 'Casas de atrio', min: 4 },
  { id: 'insulas', nombre: 'Ínsulas y casas ricas', min: 6 }
];

/* Peso de cada necesidad en el ánimo de cada clase (plebe, ciudadanos, esclavos). Cada fila suma 1. */
export const PESOS = {
  ple: { alimento: 0.2, agua: 0.05, limpieza: 0.05, salud: 0.15, trabajo: 0.2, cultura: 0.05, culto: 0.2, orden: 0.1 },
  ciu: { alimento: 0.1, agua: 0.15, limpieza: 0.15, salud: 0.1, trabajo: 0.1, cultura: 0.15, culto: 0.1, orden: 0.15 },
  esc: { alimento: 0.3, agua: 0.05, limpieza: 0.05, salud: 0.25, trabajo: 0.15, cultura: 0, culto: 0.05, orden: 0.15 }
};

export const DUREZA = { duro: { contento: 60, descontento: 40, estacionesConsecuencia: 2, estacionesRevuelta: 4 } };
export const REMEDIOS_REVUELTA = ['tropas', 'grano', 'juegos'];

const IDS = NECESIDADES.map(n => n.id);
const POR_ID = Object.fromEntries(NECESIDADES.map(n => [n.id, n]));

/* ---------- red de calles ---------- */
export function redDeRejilla(N, esCalle) { return { N, esCalle }; }
export function redDeCiudad(E) {
  const N = Math.round(Math.sqrt(E.ocup.length));
  return { N, esCalle: k => E.ocup[k] === 1 };
}

/* Celdas de calle que tocan la celda (ella misma si es calle). Sin calle al lado: []. */
export function accesos(red, celda) {
  const N = red.N;
  if (celda < 0 || celda >= N * N) return [];
  if (red.esCalle(celda)) return [celda];
  const i = celda % N, j = (celda - i) / N, r = [];
  if (j > 0 && red.esCalle(celda - N)) r.push(celda - N);
  if (i > 0 && red.esCalle(celda - 1)) r.push(celda - 1);
  if (i < N - 1 && red.esCalle(celda + 1)) r.push(celda + 1);
  if (j < N - 1 && red.esCalle(celda + N)) r.push(celda + N);
  return r;
}

/* BFS por calles desde las celdas de inicio: Map celda -> pasos (<= tope). */
export function distancias(red, celdasInicio, tope) {
  const N = red.N, d = new Map();
  let cola = [];
  for (const c of celdasInicio) if (!d.has(c)) { d.set(c, 0); cola.push(c); }
  for (let p = 0; p < tope && cola.length; p++) {
    const sig = [];
    for (const c of cola) {
      const i = c % N, j = (c - i) / N, vec = [];
      if (j > 0) vec.push(c - N);
      if (i > 0) vec.push(c - 1);
      if (i < N - 1) vec.push(c + 1);
      if (j < N - 1) vec.push(c + N);
      for (const v of vec) if (!d.has(v) && red.esCalle(v)) { d.set(v, p + 1); sig.push(v); }
    }
    cola = sig;
  }
  return d;
}

/* Qué casas alcanza cada servicio y qué necesidades tiene cubiertas cada casa. Llamar solo al construir o derribar. */
export function calcularAlcances(red, servicios, casas) {
  const porServicio = {}, porCasa = {};
  const accCasa = casas.map(c => accesos(red, c.celda));
  for (const c of casas) porCasa[c.id] = {};
  for (const s of servicios) {
    const def = SERVICIOS[s.tipo];
    porServicio[s.id] = [];
    if (!def) continue;
    const d = distancias(red, accesos(red, s.celda), def.alcance);
    casas.forEach((c, n) => {
      if (!accCasa[n].some(a => d.has(a))) return;
      porServicio[s.id].push(c.id);
      for (const nec of def.cubre) porCasa[c.id][nec] = true;
    });
  }
  return { porServicio, porCasa };
}

/* ---------- barrio ---------- */
const idDe = c => (c !== null && typeof c === 'object') ? c.id : c;

export function coberturaBarrio(casasDelBarrio, porCasa) {
  const r = {}, n = casasDelBarrio.length;
  for (const id of IDS) {
    let t = 0;
    for (const c of casasDelBarrio) { const p = porCasa[idDe(c)]; if (p && p[id]) t++; }
    r[id] = n ? t / n : 0;
  }
  return r;
}

export function estadoNecesidad(frac) {
  return frac >= UMBRAL.cubierta ? 'cubierta' : frac >= UMBRAL.mal ? 'falta' : 'mal';
}

export function nivelBarrio(cobertura) {
  const cubiertas = IDS.filter(id => estadoNecesidad(cobertura[id] || 0) === 'cubierta').length;
  let nivel = NIVELES[0];
  for (const n of NIVELES) if (cubiertas >= n.min) nivel = n;
  return { id: nivel.id, nombre: nivel.nombre, cubiertas };
}

export function animoPorClase(cobertura) {
  const r = {};
  for (const cl of Object.keys(PESOS)) {
    let s = 0;
    for (const id of IDS) s += PESOS[cl][id] * (cobertura[id] || 0);
    r[cl] = 100 * s;
  }
  return r;
}

export function animo(cobertura, clases) {
  const a = animoPorClase(cobertura), cs = Object.keys(PESOS);
  let tot = 0, s = 0;
  for (const cl of cs) { const p = Math.max(0, (clases && clases[cl]) || 0); tot += p; s += a[cl] * p; }
  const v = tot > 0 ? s / tot : (a.ple + a.ciu + a.esc) / 3;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function humor(animoBarrio, dureza = 'duro') {
  const d = DUREZA[dureza] || DUREZA.duro;
  return animoBarrio >= d.contento ? 'contento' : animoBarrio < d.descontento ? 'descontento' : 'normal';
}

/* ---------- estaciones ---------- */
export function memoriaNueva() { return { desc: 0, mal: {}, revuelta: false }; }

export function estacion(mem, cobertura, animoBarrio, dureza = 'duro') {
  const d = DUREZA[dureza] || DUREZA.duro, m0 = mem || memoriaNueva();
  const nueva = { desc: m0.desc || 0, mal: { ...(m0.mal || {}) }, revuelta: !!m0.revuelta };
  const sucesos = [];
  nueva.desc = animoBarrio < d.descontento ? nueva.desc + 1 : 0;
  if (nueva.desc >= d.estacionesConsecuencia) {
    const peores = IDS.filter(id => estadoNecesidad(cobertura[id] || 0) !== 'cubierta')
      .sort((a, b) => (cobertura[a] || 0) - (cobertura[b] || 0)).slice(0, 2);
    for (const id of peores) sucesos.push({ tipo: 'consecuencia', necesidad: id, efecto: POR_ID[id].consecuencia });
  }
  let causa = null;
  for (const id of IDS) {
    if (estadoNecesidad(cobertura[id] || 0) === 'mal') {
      nueva.mal[id] = (nueva.mal[id] || 0) + 1;
      if (nueva.mal[id] >= d.estacionesRevuelta && !causa) causa = id;
    } else delete nueva.mal[id];
  }
  if (causa && !nueva.revuelta) { nueva.revuelta = true; sucesos.push({ tipo: 'revuelta', necesidad: causa }); }
  if (nueva.revuelta) sucesos.push({ tipo: 'en_revuelta' });
  return { mem: nueva, sucesos };
}

export function calmar(mem, remedioElegido) {
  const m0 = mem || memoriaNueva();
  const igual = { desc: m0.desc || 0, mal: { ...(m0.mal || {}) }, revuelta: !!m0.revuelta };
  if (!REMEDIOS_REVUELTA.includes(remedioElegido)) return { mem: igual, ok: false, texto: 'Ese remedio no existe. Prueba con tropas, grano o juegos.' };
  if (!igual.revuelta) return { mem: igual, ok: false, texto: 'El barrio no está en revuelta: no hace falta calmarlo.' };
  const frases = { tropas: 'Las tropas despejan las calles y vuelve la calma.', grano: 'El reparto de grano calma al barrio.', juegos: 'Los juegos distraen al barrio y vuelve la calma.' };
  return { mem: { desc: 0, mal: {}, revuelta: false }, ok: true, texto: frases[remedioElegido] };
}

/* ---------- ficha del barrio y remedios ---------- */
export function remedio(red, casas, porCasa, necesidad, candidatos) {
  const ministro = (POR_ID[necesidad] || {}).ministro;
  const tipos = Object.keys(SERVICIOS).filter(t => SERVICIOS[t].cubre.includes(necesidad))
    .sort((a, b) => SERVICIOS[a].alcance - SERVICIOS[b].alcance);
  let mejor = { necesidad, servicio: tipos[0], ministro, celda: null, casas: 0 };
  const accCasa = casas.map(c => accesos(red, c.celda));
  const pend = casas.map(c => !(porCasa[c.id] && porCasa[c.id][necesidad]));
  for (const tipo of tipos) {
    for (const celda of candidatos || []) {
      const d = distancias(red, accesos(red, celda), SERVICIOS[tipo].alcance);
      let n = 0;
      casas.forEach((c, k) => { if (pend[k] && accCasa[k].some(a => d.has(a))) n++; });
      if (n > mejor.casas) mejor = { necesidad, servicio: tipo, ministro, celda, casas: n };
    }
  }
  return mejor;
}

const FALTA = { alimento: 'comida', agua: 'agua', limpieza: 'limpieza', salud: 'salud', trabajo: 'trabajo', cultura: 'cultura', culto: 'culto y ocio', orden: 'orden' };
const SIN = { alimento: 'comida', agua: 'agua', limpieza: 'limpieza', salud: 'médico', trabajo: 'trabajo', cultura: 'cultura', culto: 'culto y ocio', orden: 'orden' };
const LLEGA = { hambre: 'llega el hambre', fiebres: 'llegan las fiebres', se_van: 'la gente se va', pierde_votos: 'se pierden votos', protesta: 'estalla la protesta', paran_obras: 'se paran las obras' };
const ARTICULO = { fuente: 'una fuente', cloaca: 'una cloaca', termas: 'unos baños', medico: 'una tienda de médico', escuela: 'una escuela', taller: 'un taller', templo: 'un templo', mercado: 'un mercado', guardia: 'una ronda nocturna', granero: 'un granero', teatro: 'una escena de juegos' };

function fraseRemedio(r) {
  if (!r) return '';
  const base = ' Encárgaselo al ministro de ' + r.ministro + ':';
  if (!r.casas || !r.servicio) return base.slice(0, -1) + '.';
  const plural = r.servicio === 'termas';
  return base + ' ' + ARTICULO[r.servicio] + (plural ? ' cubrirían ' : ' cubriría ') + r.casas + (r.casas === 1 ? ' casa.' : ' casas.');
}

export function fichaBarrio({ cobertura, clases, mem, dureza = 'duro', remedios }) {
  const d = DUREZA[dureza] || DUREZA.duro, m = Object.assign(memoriaNueva(), mem || {}), mal = (mem && mem.mal) || {};
  const an = animo(cobertura, clases), hu = humor(an, dureza);
  const necesidades = NECESIDADES.map(n => ({ id: n.id, nombre: n.nombre, frac: cobertura[n.id] || 0, estado: estadoNecesidad(cobertura[n.id] || 0) }));
  const rem = id => (remedios || []).find(r => r && r.necesidad === id);
  const avisos = [];
  if (m.revuelta) avisos.push('En revuelta: no paga ni obedece. Cálmala con tropas, grano o juegos.');
  else {
    for (const id of IDS) {
      if ((mal[id] || 0) === d.estacionesRevuelta - 1 && estadoNecesidad(cobertura[id] || 0) === 'mal') avisos.push('Lleva ' + mal[id] + ' estaciones sin ' + SIN[id] + ': a la próxima, revuelta.' + fraseRemedio(rem(id)));
    }
  }
  if (hu === 'descontento' && (m.desc || 0) === d.estacionesConsecuencia - 1) {
    const peor = necesidades.filter(n => n.estado !== 'cubierta').sort((a, b) => a.frac - b.frac)[0];
    if (peor) {
      const falta = d.estacionesConsecuencia - m.desc;
      const cons = POR_ID[peor.id].consecuencia;
      avisos.push('Falta ' + FALTA[peor.id] + ': ' + falta + (falta === 1 ? ' estación más descontento y ' : ' estaciones más descontento y ') + LLEGA[cons] + '.' + fraseRemedio(rem(peor.id) || { ministro: POR_ID[peor.id].ministro }));
    }
  }
  return { nivel: nivelBarrio(cobertura), animo: an, humor: hu, necesidades, avisos, remedios: remedios || [] };
}
