/* AQVILA — agricultura por suelos: REGLAS sin pantalla (módulo ESM, corre igual en Node y en el navegador).
   Cinco campos (trigo, olivar, viña, huerto, pasto) que rinden distinto según el suelo donde se plantan, con mejoras,
   calendario de labores y cuatro productos nuevos (aceite, vino, verdura, lana). Las labores y mejoras siguen a Catón
   (De agri cultura) y Varrón (Res rusticae); TODOS LOS NÚMEROS (rindes, bases, precios, costes) son licencia de juego.
   Funciones puras: no tocan pantalla, ni window, ni azar, y no mutan lo que reciben (salvo migrar, que es la migración
   del guardado y completa el objeto que se le pasa). Lo visual vive en js/gfx/campos.js; eso lo hace otra pieza. */

const F = (autor, obra, pasaje) => ({ autor, obra, pasaje });
const CATON = 'Catón', VARRON = 'Varrón';

export const SUELOS = {
  ribera: { id: 'ribera', nombre: 'Junto al agua', en: 'junto al agua', de: 'de la ribera', d: 'Tierra húmeda al lado del río: el huerto se riega solo.' },
  baja: { id: 'baja', nombre: 'Tierra baja o pobre', en: 'en tierra baja', de: 'de la tierra baja', d: 'Terreno bajo, encharcado o flaco: bueno para pastar.' },
  llano: { id: 'llano', nombre: 'Llano de tierra honda', en: 'en el llano', de: 'del llano', d: 'Tierra honda y plana: la mejor para arar el trigo.' },
  ladera_sol: { id: 'ladera_sol', nombre: 'Ladera al sol', en: 'en la ladera al sol', de: 'de la ladera', d: 'Cuesta cara al sur: la vid madura bien.' },
  ladera_seca: { id: 'ladera_seca', nombre: 'Ladera seca', en: 'en la ladera seca', de: 'de la ladera', d: 'Cuesta pedregosa y sin agua: el olivo la aguanta.' }
};

/* nota por suelo: bien / regular / mal / no */
export const CAMPOS = {
  trigo: { id: 'trigo', nombre: 'Trigo', art: 'el', produce: 'grano', d: 'Cereal del pan: pide llano y tierra honda.', fuente: F(CATON, 'De agri cultura', '1.7 y 6'), notas: { llano: 'bien', ladera_seca: 'no', ladera_sol: 'mal', ribera: 'regular', baja: 'mal' } },
  olivar: { id: 'olivar', nombre: 'Olivar', art: 'el', produce: 'aceite', d: 'Olivos en hilera: aguantan la ladera seca, no el agua.', fuente: F(CATON, 'De agri cultura', '1.7 y 6'), notas: { llano: 'regular', ladera_seca: 'bien', ladera_sol: 'regular', ribera: 'no', baja: 'no' } },
  vina: { id: 'vina', nombre: 'Viña', art: 'la', produce: 'vino', d: 'Vides en espaldera: piden sol de cara al sur.', fuente: F(CATON, 'De agri cultura', '1.7 y 6'), notas: { llano: 'mal', ladera_seca: 'regular', ladera_sol: 'bien', ribera: 'no', baja: 'no' } },
  huerto: { id: 'huerto', nombre: 'Huerto', art: 'el', produce: 'verdura', d: 'Verdura todo el año: necesita agua cerca.', fuente: F(CATON, 'De agri cultura', '1.7 (hortus irriguus)'), notas: { llano: 'regular', ladera_seca: 'no', ladera_sol: 'no', ribera: 'bien', baja: 'regular' } },
  pasto: { id: 'pasto', nombre: 'Pasto', art: 'el', produce: 'lana', d: 'Prado para ovejas: sirve donde nada más crece.', fuente: F(VARRON, 'Res rusticae', '2.2 y 2.11'), notas: { llano: 'regular', ladera_seca: 'regular', ladera_sol: 'mal', ribera: 'regular', baja: 'bien' } }
};

const RINDE = { bien: 1, regular: 0.6, mal: 0.3, no: 0 };
const RAZON_NO = {
  'olivar:ribera': 'El olivo se pudre con el pie en agua.', 'olivar:baja': 'El olivo se pudre con el pie en agua.',
  'vina:ribera': 'La vid se pudre con el pie en agua.', 'vina:baja': 'La vid se pudre con el pie en agua.',
  'huerto:ladera_seca': 'Sin agua no hay huerto en ladera.', 'huerto:ladera_sol': 'Sin agua no hay huerto en ladera.',
  'trigo:ladera_seca': 'El trigo no se ara en ladera pedregosa.'
};

/* Mejoras: costes en denarios (licencia de juego). `efecto` es solo texto para la pantalla. */
export const MEJORAS = {
  estercolero: { id: 'estercolero', nombre: 'Estercolero', campo: 'trigo', coste: { denarios: 120 }, efecto: 'Rinde ×1,2; ×1,35 con pasto o redil vecino.', fuente: F(CATON, 'De agri cultura', '5.8, 36–37') },
  era: { id: 'era', nombre: 'Era empedrada', campo: 'trigo', coste: { denarios: 150 }, efecto: 'Rinde ×1,15.', fuente: F(VARRON, 'Res rusticae', '1.51') },
  almazara: { id: 'almazara', nombre: 'Almazara y prensa', campo: 'olivar', coste: { denarios: 250 }, efecto: 'Sin ella el aceite rinde la mitad.', fuente: F(CATON, 'De agri cultura', '20–22 (trapetum), 18 (prensa)') },
  lagar: { id: 'lagar', nombre: 'Lagar', campo: 'vina', coste: { denarios: 250 }, efecto: 'Sin él el vino rinde la mitad.', fuente: F(CATON, 'De agri cultura', '18, 23–26') },
  bodega: { id: 'bodega', nombre: 'Bodega de dolias', campo: 'vina', coste: { denarios: 200 }, efecto: 'El vino se guarda sin perderse y vale ×1,3.', fuente: F(CATON, 'De agri cultura', '10–11 (dolia)') },
  noria: { id: 'noria', nombre: 'Noria o riego', campo: 'huerto', coste: { denarios: 180 }, efecto: 'Rinde ×1,3 y el huerto rinde bien en llano y tierra baja.', fuente: F('Filón de Bizancio', 'Pneumatica (rueda de agua, s. III a.C.)', 'probable') },
  redil: { id: 'redil', nombre: 'Redil', campo: 'pasto', coste: { denarios: 100 }, efecto: 'Lana ×1,25 y da estiércol al trigo vecino.', fuente: F(VARRON, 'Res rusticae', '2.2.8–9') }
};
const MULT = { estercolero: 1.2, era: 1.15, noria: 1.3, redil: 1.25 };

/* Productos: lo que el mercado (js/mercado.js) necesita saber. Los PRECIOS no están aquí: los pone el mercado.
   alimento = equivalente en grano; guarda: 'si' | 'bodega' (solo con bodega) | 'no'; estropea = fracción que se pierde
   cada MES sin guardar bien; suelos = suelos donde su campo rinde «bien» (sale de la tabla de CAMPOS); base = producción anual
   de una parcela de nivel 1 (licencia de juego). */
const PROD = [
  ['grano', 'Grano', 'trigo', 'si', 0, ['comida', 'tropa'], 1, 36],
  ['aceite', 'Aceite', 'olivar', 'si', 0, ['comida', 'comercio', 'culto', 'banos'], 0.5, 10],
  ['vino', 'Vino', 'vina', 'bodega', 0.07, ['comercio', 'fiesta', 'culto', 'tropa'], 0.3, 10],
  ['verdura', 'Verdura', 'huerto', 'no', 0.3, ['comida', 'comercio'], 0.8, 24],
  ['lana', 'Lana', 'pasto', 'si', 0, ['comercio', 'taller', 'tropa'], 0, 8]
];
export const PRODUCTOS = Object.fromEntries(PROD.map(([id, nombre, campo, guarda, estropea, usos, alimento, base]) => [id, {
  id, nombre, campo, guarda, estropea, usos, alimento, base,
  suelos: Object.keys(SUELOS).filter(su => CAMPOS[campo].notas[su] === 'bien')
}]));
const ALIMENTOS = ['grano', 'aceite', 'vino', 'verdura'];
const PAN = { grano: 'pan', aceite: 'aceite', vino: 'vino', verdura: 'verdura' };

/* Labores: nombre y verbo. El calendario de cada campo (mes 0 = Ianuarius) apunta a estos ids. */
export const LABORES = {
  escarda: { id: 'escarda', nombre: 'Escarda', verbo: 'escardar' }, crece: { id: 'crece', nombre: 'Crecimiento', verbo: 'vigilar' },
  siega: { id: 'siega', nombre: 'Siega', verbo: 'segar' }, trilla: { id: 'trilla', nombre: 'Trilla', verbo: 'trillar en la era' },
  arada: { id: 'arada', nombre: 'Arada', verbo: 'arar' }, siembra: { id: 'siembra', nombre: 'Siembra', verbo: 'sembrar' },
  nace: { id: 'nace', nombre: 'Nace el grano', verbo: 'esperar' }, aceituna: { id: 'aceituna', nombre: 'Aceituna', verbo: 'varear y recoger' },
  poda: { id: 'poda', nombre: 'Poda', verbo: 'podar' }, cava: { id: 'cava', nombre: 'Cava', verbo: 'cavar' }, atar: { id: 'atar', nombre: 'Atado', verbo: 'atar a la espaldera' },
  reposo: { id: 'reposo', nombre: 'Reposo', verbo: 'descansar' }, vendimia: { id: 'vendimia', nombre: 'Vendimia', verbo: 'vendimiar' },
  pisado: { id: 'pisado', nombre: 'Pisado', verbo: 'pisar en el lagar' }, riego: { id: 'riego', nombre: 'Riego', verbo: 'regar' },
  huerta: { id: 'huerta', nombre: 'Huerta', verbo: 'cuidar' }, paridera: { id: 'paridera', nombre: 'Paridera', verbo: 'atender los partos' },
  esquileo: { id: 'esquileo', nombre: 'Esquileo', verbo: 'esquilar' }, heno: { id: 'heno', nombre: 'Heno', verbo: 'segar el heno' },
  trashumancia: { id: 'trashumancia', nombre: 'Trashumancia', verbo: 'subir el rebaño al monte' }, pasto: { id: 'pasto', nombre: 'Pasto', verbo: 'pastorear' }
};
const rep = (id, n) => Array(n).fill(id);
const CALENDARIO = {
  trigo: [...rep('escarda', 3), ...rep('crece', 2), ...rep('siega', 2), 'trilla', 'arada', ...rep('siembra', 2), 'nace'],
  olivar: ['aceituna', ...rep('poda', 2), ...rep('arada', 2), ...rep('crece', 5), ...rep('aceituna', 2)],
  vina: ['reposo', ...rep('poda', 2), 'cava', 'atar', ...rep('crece', 3), ...rep('vendimia', 2), 'pisado', 'reposo'],
  huerto: ['huerta', 'huerta', 'siembra', 'siembra', 'huerta', 'riego', 'riego', 'riego', 'siembra', 'siembra', 'huerta', 'huerta'],
  pasto: [...rep('paridera', 3), ...rep('esquileo', 2), 'heno', ...rep('trashumancia', 3), ...rep('pasto', 3)]
};
const COSECHA = { trigo: [5, 6], olivar: [0, 10, 11], vina: [8, 9], huerto: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], pasto: [3, 4] };
const MES_ESTACION = [3, 6, 9, 0];
const FIN_ESTACION = [1, 4, 7, 10];

const num = (x, d) => (typeof x === 'number' && isFinite(x) ? x : d);
const r2 = x => Math.round(x * 100) / 100;

export function clasificarSuelo(e) {
  const pend = num(e && e.pend, 0), dist = num(e && e.distAgua, 1e9), alt = num(e && e.altAgua, 99), sol = num(e && e.solana, 0);
  if (pend >= 0.08) return sol >= 0.5 ? 'ladera_sol' : 'ladera_seca';
  if (dist < 70 && alt < 6) return 'ribera';
  if (alt < 2.5 || (e && e.pobre)) return 'baja';
  return 'llano';
}

export function encaje(campo, suelo, mejoras = []) {
  const c = CAMPOS[campo];
  if (!c || !SUELOS[suelo]) return { nota: 'no', rinde: 0, razon: 'Campo o suelo desconocido.' };
  let nota = c.notas[suelo];
  if (campo === 'huerto' && mejoras.includes('noria') && (suelo === 'llano' || suelo === 'baja')) nota = 'bien';
  const razon = nota === 'no' ? (RAZON_NO[campo + ':' + suelo] || 'No se puede plantar aquí.')
    : nota === 'bien' ? (campo === 'huerto' && mejoras.includes('noria') && suelo !== 'ribera' ? 'Con noria el huerto rinde bien aquí.' : 'Es su sitio: rinde bien.')
    : nota === 'regular' ? 'Se da, pero sin lucirse.' : 'Rinde poco aquí.';
  return { nota, rinde: RINDE[nota], razon };
}

export function consejo(suelo, mejoras = []) {
  return Object.keys(CAMPOS).map((campo, i) => ({ campo, i, ...encaje(campo, suelo, mejoras) }))
    .filter(x => x.nota !== 'no').sort((a, b) => b.rinde - a.rinde || a.i - b.i)
    .map(({ campo, nota, rinde }) => ({ campo, nota, rinde }));
}

export function labor(campo, mes) {
  const cal = CALENDARIO[campo];
  if (!cal) return null;
  const m = ((Math.floor(num(mes, 0)) % 12) + 12) % 12, l = LABORES[cal[m]];
  return { id: l.id, nombre: l.nombre, verbo: l.verbo, cosecha: COSECHA[campo].includes(m) };
}
export function laborEstacion(campo, est) { return labor(campo, MES_ESTACION[((Math.floor(num(est, 0)) % 4) + 4) % 4]); }

export function mejorasDe(campo) { return Object.values(MEJORAS).filter(m => m.campo === campo).map(m => m.id); }
export function puedeMejorar(parcela, mejora) {
  const m = MEJORAS[mejora];
  if (!m) return { ok: false, motivo: 'Esa mejora no existe.' };
  if (!parcela || parcela.campo !== m.campo) return { ok: false, motivo: m.nombre + ' solo sirve en ' + CAMPOS[m.campo].nombre.toLowerCase() + '.' };
  if ((parcela.mejoras || []).includes(mejora)) return { ok: false, motivo: 'Ya tiene ' + m.nombre.toLowerCase() + '.' };
  if (encaje(parcela.campo, parcela.suelo, parcela.mejoras || []).nota === 'no') return { ok: false, motivo: 'Aquí no se puede cultivar.' };
  return { ok: true, motivo: '' };
}

function factor(p, vecinos) {
  const mj = p.mejoras || [];
  let f = 1;
  if (mj.includes('estercolero')) f *= vecinos.some(v => v && (v.campo === 'pasto' || (v.mejoras || []).includes('redil'))) ? 1.35 : 1.2;
  for (const id of ['era', 'noria', 'redil']) if (mj.includes(id)) f *= MULT[id];
  if (p.campo === 'olivar' && !mj.includes('almazara')) f *= 0.5;
  if (p.campo === 'vina' && !mj.includes('lagar')) f *= 0.5;
  return f;
}
export function produccionAnual(parcela, vecinos = []) {
  const c = CAMPOS[parcela && parcela.campo];
  if (!c) return {};
  const prod = PRODUCTOS[c.produce], niv = Math.max(1, Math.min(5, num(parcela.nivel, 1)));
  const e = encaje(parcela.campo, parcela.suelo, parcela.mejoras || []);
  return { [c.produce]: r2(prod.base * niv * e.rinde * factor(parcela, vecinos || [])) };
}
export function produccionMes(parcela, mes, vecinos = [], { granoRepartido = true } = {}) {
  const anual = produccionAnual(parcela, vecinos), out = {};
  const m = ((Math.floor(num(mes, 0)) % 12) + 12) % 12;
  for (const k of Object.keys(anual)) {
    if (k === 'grano' && granoRepartido) out[k] = anual[k] / 12;
    else { const cs = COSECHA[parcela.campo]; out[k] = cs.includes(m) ? anual[k] / cs.length : 0; }
  }
  return out;
}

const MESES_EST = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];
/* Suma de los tres meses de la estación (0 primavera, 1 verano, 2 otoño, 3 invierno). */
export function produccionEstacion(parcela, est, vecinos = []) {
  const out = {};
  for (const m of MESES_EST[((Math.floor(num(est, 0)) % 4) + 4) % 4]) {
    const pm = produccionMes(parcela, m, vecinos);
    for (const k of Object.keys(pm)) out[k] = (out[k] || 0) + pm[k];
  }
  return out;
}
/* Lo que da una parcela de nivel 1 sin mejoras en cada estación: [4 números] del producto del campo. */
export function ofertaPorEstacion(campo, suelo) {
  const c = CAMPOS[campo];
  if (!c) return [0, 0, 0, 0];
  return [0, 1, 2, 3].map(e => r2(produccionEstacion({ campo, suelo, nivel: 1, mejoras: [] }, e)[c.produce] || 0));
}
/* Lo que producen en un mes las parcelas de una ciudad (s.agro.parcelas con `ciudad`); las otras parcelas de la misma ciudad son vecinas. */
export function produccionCiudad(s, idCiudad, mes) {
  const out = { grano: 0, aceite: 0, vino: 0, verdura: 0, lana: 0 };
  const ps = ((s && s.agro && s.agro.parcelas) || []).filter(p => p && p.ciudad === idCiudad);
  ps.forEach((p, i) => {
    const pm = produccionMes(p, mes, ps.filter((_, j) => j !== i));
    for (const k of Object.keys(pm)) out[k] += pm[k];
  });
  return out;
}

/* Fracción de un producto que se pierde en un mes (la verdura se pasa; el vino se avinagra sin bodega). */
export function perdidaMes(id, mejorasCiudad = []) {
  const p = PRODUCTOS[id];
  if (!p) return 0;
  if (id === 'vino' && (mejorasCiudad || []).includes('bodega')) return 0;
  return p.estropea;
}

export function dieta(productos, bocas) {
  const p = productos || {};
  let comida = 0;
  for (const id of ALIMENTOS) comida += Math.max(0, num(p[id], 0)) * PRODUCTOS[id].alimento;
  const tiene = ALIMENTOS.filter(id => num(p[id], 0) > 0), faltan = ALIMENTOS.filter(id => !tiene.includes(id));
  let cubre = bocas > 0 ? Math.min(1, comida / bocas) : 1;
  if (tiene.length >= 3) cubre = Math.min(1, cubre + 0.1);
  const lista = tiene.map(id => PAN[id]);
  const junta = lista.length > 1 ? lista.slice(0, -1).join(', ') + ' y ' + lista[lista.length - 1] : lista[0];
  let texto = tiene.length ? 'Comen ' + junta : 'No comen nada';
  if (tiene.length && faltan.length) texto += '; falta ' + faltan.map(id => PAN[id]).join(' y ');
  return { cubre, variedad: tiene.length, faltan, texto: texto + '.' };
}

/* Valor en denarios a los precios que da el mercado (id → denarios). Sin precios, 0. */
export function valor(productos, precios) {
  let t = 0;
  if (!precios) return 0;
  for (const k of Object.keys(productos || {})) if (PRODUCTOS[k]) t += num(productos[k], 0) * num(precios[k], 0);
  return r2(t);
}

/* Propone al edil del grano hasta 3 cosas, de más a menos urgente. */
export function encargosAgricultura(estado) {
  const s = estado || {}, parcelas = s.parcelas || [], libres = s.libres || [], alm = s.almacen || {}, bocas = num(s.bocas, 0);
  const urgente = [], campos = [], cambios = [], mejoras = [], reserva = [];
  const aviso = { tipo: 'reserva', recurso: 'grano', objetivo: Math.ceil(bocas * 3), texto: 'Guardar grano para tres meses' };
  if (bocas > 0 && num(alm.grano, 0) < bocas * 0.5) urgente.push(aviso);
  else if (bocas > 0 && num(alm.grano, 0) < bocas * 3) reserva.push(aviso);
  for (const l of libres) {
    const mejor = consejo(l.suelo)[0];
    if (mejor) campos.push({ tipo: 'campo', parcela: l.id, campo: mejor.campo, texto: 'Plantar ' + CAMPOS[mejor.campo].nombre.toLowerCase() + ' ' + SUELOS[l.suelo].en });
  }
  for (const p of parcelas) {
    const e = encaje(p.campo, p.suelo, p.mejoras || []), mejor = consejo(p.suelo, [])[0];
    if ((e.nota === 'mal' || e.nota === 'no') && mejor && mejor.campo !== p.campo && mejor.rinde > e.rinde) {
      cambios.push({ tipo: 'cambiar', parcela: p.id, campo: mejor.campo, texto: 'Cambiar ' + CAMPOS[p.campo].art + ' ' + CAMPOS[p.campo].nombre.toLowerCase() + ' ' + SUELOS[p.suelo].de + ' por ' + CAMPOS[mejor.campo].nombre.toLowerCase() });
    } else if (e.nota !== 'no') {
      const falta = mejorasDe(p.campo).filter(id => puedeMejorar(p, id).ok).sort((a, b) => (b === 'almazara' || b === 'lagar') - (a === 'almazara' || a === 'lagar'));
      if (falta.length) mejoras.push({ tipo: 'mejora', parcela: p.id, mejora: falta[0], texto: 'Poner ' + MEJORAS[falta[0]].nombre.toLowerCase() + ' en ' + CAMPOS[p.campo].art + ' ' + CAMPOS[p.campo].nombre.toLowerCase() });
    }
  }
  return [...urgente, ...campos, ...cambios, ...mejoras, ...reserva].slice(0, 3);
}

/* Migración del guardado: completa s.agro sin pisar lo que ya haya. Las existencias viven en s.bienes (no se tocan). */
export function migrar(s) {
  if (!s) return s;
  if (!s.agro || typeof s.agro !== 'object') s.agro = { v: 1, parcelas: [] };
  else {
    if (s.agro.v === undefined) s.agro.v = 1;
    if (!Array.isArray(s.agro.parcelas)) s.agro.parcelas = [];
  }
  return s;
}
