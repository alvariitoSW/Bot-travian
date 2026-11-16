// EV1 · Un año de política (264 a.C.) — reglas sin pantalla. Corre en Node y en el navegador.
// Convención: las funciones que cambian la partida (votar, elegir, seguir) MUTAN el estado recibido y devuelven el resultado.
// Las que solo consultan (favor, escena, votos, tratos, cierre) no lo tocan. La prueba clona con structuredClone.
export const BANDOS = {
  ter: { id: 'ter', nombre: 'Terratenientes', color: '#8FAE5A' },
  mer: { id: 'mer', nombre: 'Mercaderes', color: '#5AA6C4' },
  mil: { id: 'mil', nombre: 'Militares', color: '#D0443A' },
};
export const HACEN_FALTA = 16;
const POSTURA = { ter: -1, mer: 1, mil: 2 };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ESTACIONES = ['Primavera', 'Verano', 'Otoño', 'Invierno'];

export function crear() {
  return { paso: 0, oro: 200, pueblo: 50, humor: { ter: 50, mer: 50, mil: 50 }, escanos: { ter: 12, mer: 8, mil: 10 }, promesas: [], marcas: {}, hilo: [] };
}
export function favor(e) {
  let s = 0, n = 0;
  for (const b of Object.keys(e.escanos)) { s += e.humor[b] * e.escanos[b]; n += e.escanos[b]; }
  return s / n;
}

/* ---------- efectos: una sola fuente para los chips de antes y los cambios de después ---------- */
// un efecto es {que, n, nota?}; nota = 'rota' | 'cumplida' para promesas
function efectosOpcion(e, id) {
  const P = e.promesas, f = [];
  const X = (que, n, nota) => f.push(nota ? { que, n, nota } : { que, n });
  if (id === 'alianza') { X('oro', 100); X('pueblo', 5); X('mer', 6); X('mil', -4); if (P.includes('botin')) X('mil', -15, 'rota'); if (P.includes('levas')) X('ter', 5, 'cumplida'); }
  else if (id === 'sitio') { X('oro', -80); X('mil', 8); X('mer', -6); X('pueblo', -4); if (P.includes('levas')) X('ter', -15, 'rota'); if (P.includes('botin')) X('mil', 5, 'cumplida'); }
  else if (id === 'tratado') { X('oro', 60); X('mer', 8); X('mil', -8); X('ter', 3); }
  else if (id === 'flota') { X('oro', -100); X('mil', 6); X('mer', -3); X('ter', -4); if (P.includes('levas')) X('ter', -15, 'rota'); }
  else if (id === 'permitir') { X('pueblo', 8); X('ter', -3); }
  else if (id === 'prohibir') { X('pueblo', -5); X('ter', 5); }
  else if (id === 'grandes') { X('oro', -60); X('pueblo', 14); X('ter', -5); X('mil', 2); }
  else if (id === 'senado') { X('mil', 4); X('mer', 4); X('ter', -4); X('pueblo', -3); }
  else if (id === 'pueblo') { X('ter', -10); X('mer', -10); X('mil', -10); X('pueblo', 6); }
  else if (id === 'acatar') { X('ter', 4); X('mil', -6); }
  return f;
}
// aplica efectos y devuelve la lista con el cambio REAL (tras topes 0–100)
function aplica(e, efectos) {
  return efectos.map(({ que, n, nota }) => {
    let antes, despues;
    if (que === 'oro') { antes = e.oro; e.oro += n; despues = e.oro; }
    else if (que === 'pueblo') { antes = e.pueblo; e.pueblo = clamp(e.pueblo + n, 0, 100); despues = e.pueblo; }
    else { antes = e.humor[que]; e.humor[que] = clamp(antes + n, 0, 100); despues = e.humor[que]; }
    const c = { que, n: despues - antes }; if (nota) c.nota = nota; return c;
  });
}
function notas(e, cambios) {
  const frases = [];
  for (const c of cambios) if (c.nota) {
    const prom = c.que === 'mil' ? 'botin' : 'levas', quien = c.que === 'mil' ? 'los militares' : 'los terratenientes';
    if (c.nota === 'rota') { frases.push('Rompes tu promesa a ' + quien); (e.marcas.rotas ||= []).push(prom); }
    else { frases.push('Cumples tu promesa a ' + quien); (e.marcas.cumplidas ||= []).push(prom); }
  }
  return frases;
}

/* ---------- escena I: el voto ---------- */
const TRATOS = [
  { id: 'ter', bando: 'ter', titulo: 'Sin levas en el campo este año', tipo: 'Promesa', etiqueta: 'Arriesgado', texto: 'Los terratenientes votan sí. Choca con una guerra.', chips: [] },
  { id: 'mer', bando: 'mer', titulo: 'Pagar 60 de oro', tipo: 'Pago', etiqueta: 'Dudoso', texto: 'Los mercaderes votan sí a cambio de oro.', chips: [{ que: 'oro', n: -60 }] },
  { id: 'mil', bando: 'mil', titulo: 'Botín para la tropa', tipo: 'Promesa', etiqueta: 'Dudoso', texto: 'Los militares votan sí con la promesa de un reparto.', chips: [] },
];
export function tratos() { return TRATOS.map(t => ({ ...t, chips: t.chips.map(c => ({ ...c })) })); }

export function votos(e, trat = []) {
  const r = { hacenFalta: HACEN_FALTA };
  let si = 0, duda = 0, no = 0;
  for (const b of ['ter', 'mer', 'mil']) {
    const esc = e.escanos[b], pts = POSTURA[b] * 15 + (e.humor[b] - 50) / 2;
    let s = Math.round(esc * clamp(0.5 + pts / 50, 0, 1) * 0.8), n = Math.round(esc * clamp(0.5 - pts / 50, 0, 1) * 0.8), d = esc - s - n;
    if (trat.includes(b)) { s += d; d = 0; }
    r[b] = { si: s, duda: d, no: n }; si += s; duda += d; no += n;
  }
  r.si = si; r.duda = duda; r.no = no; r.sale = si >= HACEN_FALTA; return r;
}

export function escena(e) {
  const p = e.paso, cruza = !!e.marcas.cruza;
  const base = { id: ['I', 'II', 'III', 'IV'][p], estacion: ESTACIONES[p] };
  if (p === 0) return { ...base, fecha: 'Primavera de 264 a.C. · Mesina pide ayuda', titulo: 'Mesina pide ayuda', texto: 'Los mamertinos, mercenarios que tienen Mesina, piden socorro a Roma. Cartago ya ha metido una guarnición en la ciudad. Al otro lado del Estrecho está Sicilia.', fuente: 'Polibio, Historias 1.10–11', dictamen: 'histórico', tipo: 'voto', ley: { titulo: 'Cruzar a Sicilia', tipo: 'guerra', postura: { ...POSTURA } } };
  if (p === 1 && cruza) return { ...base, fecha: 'Verano de 264 a.C. · Hierón de Siracusa', titulo: 'Hierón de Siracusa', texto: 'Tus legiones han roto el cerco de Mesina. Hierón, rey de Siracusa, se retira a su ciudad y ofrece paz, grano y cien talentos.', fuente: 'Polibio 1.11–12 y 1.16; Diodoro 23.4', dictamen: 'licencia de juego: la paz con Hierón fue en 263; aquí va en el mismo año', tipo: 'opciones',
    opciones: [mk(e, 'alianza', 'Aliarte con Hierón', true), mk(e, 'sitio', 'Sitiar Siracusa', false)] };
  if (p === 1) return { ...base, fecha: 'Verano de 264 a.C. · Cartago en el Estrecho', titulo: 'Cartago en el Estrecho', texto: 'Cartago se queda Mesina. Sus naves vigilan el paso frente a Regio. Sus enviados recuerdan los viejos tratados.', fuente: 'Polibio 3.22–26 (tratados entre Roma y Cartago)', dictamen: 'licencia de juego: historia que no ocurrió; los tratados sí existieron', tipo: 'opciones',
    opciones: [mk(e, 'tratado', 'Renovar el tratado con Cartago', false), mk(e, 'flota', 'Armar una flota en secreto', false)] };
  if (p === 2) { const g = mk(e, 'grandes', 'Pagarlo tú y hacerlo grande', false); if (e.oro < 60) { g.apagada = true; g.aviso = 'falta oro'; }
    return { ...base, fecha: 'Otoño de 264 a.C. · Sangre en el Foro Boario', titulo: 'Sangre en el Foro Boario', texto: 'Los hijos de Junio Bruto Pera quieren honrar a su padre muerto con algo nunca visto en Roma: tres parejas de hombres luchando a espada.', fuente: 'Livio, Períoca 16; Valerio Máximo 2.4.7', dictamen: 'histórico (fueron los primeros gladiadores de Roma); que tú lo permitas o no es licencia de juego', tipo: 'opciones',
      opciones: [mk(e, 'permitir', 'Permitirlo', true), mk(e, 'prohibir', 'Prohibirlo', false), g] }; }
  return { ...base, fecha: 'Invierno de 264 a.C. · Cierre del año', titulo: 'El hilo de la historia', texto: 'El año se acaba. Mira dónde coincidiste con la historia y dónde te apartaste.', fuente: 'Polibio, Historias 1.10–12 y 1.20; Livio, Períoca 16', dictamen: 'mezcla: los hechos son históricos; el rumbo que sigue es conjetura y licencia de juego', tipo: 'cierre' };
}
function mk(e, id, titulo, real) { return { id, titulo, real, chips: efectosOpcion(e, id).map(({ que, n, nota }) => nota ? { que, n, nota } : { que, n }) }; }

export function votar(e, trat = []) {
  if (e.paso !== 0 || e.marcas.via) throw new Error('el voto ya está resuelto');
  const sel = [...new Set(trat)];
  for (const t of sel) { if (t === 'ter') e.promesas.push('levas'); if (t === 'mil') e.promesas.push('botin'); }
  const cambios = [];
  if (sel.includes('mer')) cambios.push(...aplica(e, [{ que: 'oro', n: -60 }]));
  const v = votos(e, sel); e.marcas.votos = v;
  if (!v.sale) { e.marcas.pendiente = true; return { sale: false, votos: v, cambios, linea: 'Solo ' + v.si + ' de ' + HACEN_FALTA + ': el Senado no se decide.' }; }
  e.marcas.cruza = true; e.marcas.via = 'senado'; delete e.marcas.pendiente;
  cambios.push(...aplica(e, efectosOpcion(e, 'senado')));
  e.hilo.push('I:senado');
  return { sale: true, votos: v, cambios, linea: 'El Senado vota ' + v.si + ' a favor: Roma cruza a Sicilia.' };
}

export function elegir(e, id) {
  if (e.paso === 0) {
    if (!e.marcas.pendiente) throw new Error('no hay segunda decisión');
    if (id !== 'pueblo' && id !== 'acatar') throw new Error('opción inválida: ' + id);
    delete e.marcas.pendiente; const cambios = aplica(e, efectosOpcion(e, id));
    e.marcas.cruza = id === 'pueblo'; e.marcas.via = id === 'pueblo' ? 'pueblo' : 'no'; e.hilo.push('I:' + e.marcas.via);
    return { cambios, linea: id === 'pueblo' ? 'La asamblea del pueblo vota ir: Roma cruza a Sicilia.' : 'Acatas al Senado: Roma no cruza.' };
  }
  const esc = escena(e), op = (esc.opciones || []).find(o => o.id === id);
  if (!op) throw new Error('opción inválida: ' + id);
  if (op.apagada) throw new Error('opción apagada: ' + id);
  if (e.marcas['hecho' + e.paso]) throw new Error('escena ya resuelta');
  const cambios = aplica(e, efectosOpcion(e, id)); e.marcas['hecho' + e.paso] = true;
  if (e.paso === 1) e.marcas[e.marcas.cruza ? 'hieron' : 'estrecho'] = id === 'alianza' ? 'alianza' : id === 'sitio' ? 'sitio' : id;
  else e.marcas.juegos = id === 'permitir' ? true : id === 'prohibir' ? false : 'grandes';
  e.hilo.push(e.paso + ':' + id);
  const frases = notas(e, cambios), dichas = { alianza: 'Aliarte con Hierón: grano, oro y paz en Sicilia.', sitio: 'Pones sitio a Siracusa.', tratado: 'Renuevas el tratado con Cartago.', flota: 'Mandas armar naves en secreto.', permitir: 'Los gladiadores luchan en el Foro Boario.', prohibir: 'Prohíbes el espectáculo.', grandes: 'Pagas unos juegos nunca vistos.' };
  return { cambios, linea: [dichas[id], ...frases].join(' ') + (frases.length ? '.' : '') };
}
export function seguir(e) { if (e.paso < 3) e.paso++; return e; }

/* ---------- cierre ---------- */
const RUMBOS = {
  'cruza-alianza': { id: 'mar', titulo: 'Roma mira al mar', frase: 'Con el grano de Siracusa a tu espalda, la guerra con Cartago será larga y se decidirá en el agua.', viene: '260 a.C.: Roma construye su primera flota (Polibio 1.20).', real: true },
  'cruza-sitio': { id: 'martillo', titulo: 'Roma, martillo de Sicilia', frase: 'Los griegos de la isla te temen más que a Cartago. Tendrás dos enemigos y ningún granero.', viene: 'Siracusa llama a Cartago.', real: false },
  'no-tratado': { id: 'tierra', titulo: 'Roma, potencia de tierra', frase: 'Cartago manda en el mar y tú en Italia. Hay paz y comercio; el Estrecho no es tuyo.', viene: 'Roma mira al norte, hacia los galos.', real: false },
  'no-flota': { id: 'aplazada', titulo: 'Guerra aplazada', frase: 'Nadie ha roto la paz todavía, pero los dos contáis barcos.', viene: 'Cuando llegue la guerra, Roma ya tendrá naves.', real: false },
};
export function cierre(e) {
  const m = e.marcas, cruza = !!m.cruza, via = m.via;
  const II = cruza ? m.hieron : m.estrecho;
  const clave = cruza ? 'cruza-' + (II === 'alianza' ? 'alianza' : 'sitio') : 'no-' + (II === 'tratado' ? 'tratado' : 'flota');
  const real = [cruza, II === 'alianza', m.juegos === true];
  const tuI = via === 'senado' ? 'Cruzas por voto del Senado' : via === 'pueblo' ? 'Cruzas por voto del pueblo' : 'No cruzas: acatas al Senado';
  const tuII = { alianza: 'Te alías con Hierón', sitio: 'Sitias Siracusa', tratado: 'Renuevas el tratado con Cartago', flota: 'Armas una flota en secreto' }[II];
  const tuIII = m.juegos === true ? 'Permites los juegos' : m.juegos === false ? 'Prohíbes los juegos' : 'Pagas unos juegos grandes';
  const base = crear();
  const nudos = [
    { estacion: 'Primavera', real: 'Roma cruza a Sicilia por voto del pueblo', tu: tuI, igual: real[0], fuente: 'Polibio, Historias 1.10–11', dictamen: 'histórico' },
    { estacion: 'Verano', real: 'Hierón firma la paz y se alía con Roma (263)', tu: tuII, igual: real[1], fuente: 'Polibio 1.11–12 y 1.16; Diodoro 23.4', dictamen: 'licencia de juego: la paz con Hierón fue en 263' },
    { estacion: 'Otoño', real: 'Primeros gladiadores en Roma', tu: tuIII, igual: real[2], fuente: 'Livio, Períoca 16; Valerio Máximo 2.4.7', dictamen: 'histórico (los primeros gladiadores); tu decisión es licencia de juego' },
  ];
  const n = real.filter(x => !x).length;
  return {
    desvio: Math.round(n / 3 * 100), nudos, rumbo: { ...RUMBOS[clave] },
    secundaria: m.juegos === true ? 'Roma descubre los juegos de sangre' : m.juegos === false ? 'Roma sigue siendo austera' : 'La plebe ya espera juegos de quien manda',
    balance: [{ que: 'oro', ini: base.oro, fin: e.oro }, { que: 'pueblo', ini: base.pueblo, fin: e.pueblo }, { que: 'favor', ini: Math.round(favor(base)), fin: Math.round(favor(e)) }].map(b => ({ ...b, dif: b.fin - b.ini })),
    promesas: [...(m.cumplidas || []).map(p => ({ id: p, estado: 'cumplida' })), ...(m.rotas || []).map(p => ({ id: p, estado: 'rota' }))].map(p => ({ ...p, texto: p.id === 'levas' ? 'Sin levas en el campo' : 'Botín para la tropa' })),
  };
}

/* ---------- el debate en directo (escena I) ---------- */
// Guion fijo: seis discursos (dos rondas de ter, mer, mil). Cada uno mueve 1–2 dudosos; el último deja el reparto de votos(e, []).
const FRASES = [
  { ter: '¿Dejar los campos por una isla?', mer: 'Quien tenga el Estrecho tendrá el trigo', mil: 'Cartago ya está en Mesina. Mañana, en Regio' },
  { ter: 'Mis campos primero', mer: 'El trigo no espera', mil: 'Que hablen las legiones' },
];
export function debate(e) {
  const fin = votos(e, []), pasos = [], lotes = {};
  for (const b of ['ter', 'mer', 'mil']) {
    let si = fin[b].si, no = fin[b].no; const m = [];
    while (m.length < 4 && si + no > 0) { if (no >= si) { m.push('no'); no--; } else { m.push('si'); si--; } }
    lotes[b] = m;
  }
  for (let r = 0; r < 2; r++) for (const b of ['ter', 'mer', 'mil']) {
    pasos.push({ bando: b, frase: FRASES[r][b], mueve: lotes[b].slice(r * 2, r * 2 + 2).map(a => ({ bando: b, de: 'duda', a })) });
  }
  return pasos;
}
// reparto de votos tras k discursos (k = 0 inicio, k = pasos.length final)
export function repartoTras(e, k) {
  const fin = votos(e, []), pasos = debate(e), r = {};
  for (const b of ['ter', 'mer', 'mil']) r[b] = { si: fin[b].si, duda: fin[b].duda, no: fin[b].no };
  for (const p of pasos) for (const m of p.mueve) { r[m.bando][m.a]--; r[m.bando].duda++; }
  for (const p of pasos.slice(0, k)) for (const m of p.mueve) { r[m.bando][m.a]++; r[m.bando].duda--; }
  return r;
}
