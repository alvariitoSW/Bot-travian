// EV2 · «Política grande» (264 a.C.) — reglas sin pantalla. Corre en Node y en el navegador. Sin azar, sin relojes.
// API para quien haga la pantalla. Las funciones que cambian la partida MUTAN el estado `e`; las que consultan, no.
//  crear() → e · ajustar(e,'todo'|'grande'|'nada') · ordenar(e,cargo,ordenId) → cambios
//  candidatos(e,cargo) → [persona+{ocupa}] · nombrar(e,cargo,personaId) → {cambios,coste}
//  asunto(e) → {id,estacion,fecha,titulo,texto,fuente,dictamen,tipo:'voto'|'opciones'|'cierre',opciones:[{id,titulo,tono,chips,apagada?}]}
//  tratos(e) → [{id:'ter'|'mer'|'mil',titulo,tipo,etiqueta,texto,chips,usado}] (una vez cada uno por año)
//  votos(e,opcionId,tratos[]) → {ter:{si,duda,no},mer,mil,si,duda,no,sale,hacenFalta}   (consulta, no muta)
//  votar(e,opcionId,tratos[]) → {sale,salio,votos,cambios,linea}; en primavera, si !sale hay que llamar elegir(e,'pueblo'|'acatar')
//  elegir(e,id) → {cambios,linea} (solo la segunda decisión de primavera) · consultas(e) → [{id,cargo,persona,titulo,texto,opciones,decidida,laDecideElMagistrado}]
//  decidir(e,consultaId,opcionId) → {cambios,linea} (solo con ajuste 'todo' y si el magistrado no «no pide permiso»)
//  puedeCerrar(e) → {ok,falta[]} · cerrarEstacion(e) → [partes]; e.despachos: {estacion,cargo,persona,orden,texto,cambios,decidio?}
//  cierre(e) → {desvio,nudos,rumbo,secundaria,balance,promesas,ciudad:{nivel,obras,genteIni,genteFin},magistrados:[{cargo,persona,orden,juicio,texto}]}
//  Un cambio/chip es {que:'oro'|'pueblo'|'ter'|'mer'|'mil'|'obra'|'gente', n, nota?:'rota'|'cumplida'}. Obras: OBRAS (ids para el dibujo).
//  Estado: estacion 0..3 (e.cerrado=true tras el invierno), oro, pueblo, humor, escanos, ciudad{nivel,obras[{id,nombre,estacion}],gente}, cargos, ordenes, ajuste, promesas, marcas, hilo, despachos, consultas.
export const BANDOS = {
  ter: { id: 'ter', nombre: 'Terratenientes', color: '#8FAE5A' },
  mer: { id: 'mer', nombre: 'Mercaderes', color: '#5AA6C4' },
  mil: { id: 'mil', nombre: 'Militares', color: '#D0443A' },
};
export const HACEN_FALTA = 16;
export const ESTACIONES = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const BS = ['ter', 'mer', 'mil'];
const DIC = 'El hombre y la fecha de su consulado o censura, históricos. Que ocupe este cargo en 264 y su carácter: licencia de juego';
const DIC2 = 'histórico; el carácter, licencia de juego';

export const OBRAS = [
  { id: 'calzada', nombre: 'Tramo de calzada empedrada' }, { id: 'fuente', nombre: 'Fuente pública del Anio Viejo' },
  { id: 'graneros', nombre: 'Graneros' }, { id: 'mercado', nombre: 'Mercado' },
  { id: 'casas', nombre: 'Casas nuevas en el Aventino' }, { id: 'templo', nombre: 'Templo de Vertumno en el Aventino', nota: 'Lo votó Fulvio Flaco en 264 (histórico)' },
  { id: 'muralla', nombre: 'Lienzo de muralla reparado' }, { id: 'muelle', nombre: 'Muelle en el Tíber' },
];

/* ---------- cargos y órdenes ---------- */
const O = (id, titulo, texto) => ({ id, titulo, texto });
export const CARGOS = {
  cuestor: { id: 'cuestor', nombre: 'Cuestor', latin: 'quaestor', lleva: 'El tesoro de Roma', ordenes: [O('ahorra', 'Ahorra', 'Guarda cada sestercio.'), O('justo', 'Paga lo justo', 'Gasta lo necesario.'), O('gasta', 'Gasta para ganar amigos', 'Abre el arca.')] },
  edil: { id: 'edil', nombre: 'Edil', latin: 'aedilis', lleva: 'Obras, grano y juegos', ordenes: [O('obras', 'Obras', 'Piedra y andamios.'), O('grano', 'Grano barato', 'Pan para la plebe.'), O('juegos', 'Juegos', 'Fiestas y espectáculos.')] },
  pretor: { id: 'pretor', nombre: 'Pretor', latin: 'praetor', lleva: 'Justicia y aliados', ordenes: [O('dura', 'Mano dura', 'Castigos ejemplares.'), O('igual', 'Justicia igual para todos', 'La ley es la ley.'), O('aliados', 'Favorece a los aliados', 'Los socios, primero.')] },
  censor: { id: 'censor', nombre: 'Censor', latin: 'censor', lleva: 'El censo y el Senado', ordenes: [O('estricto', 'Censo estricto', 'Nadie sube sin mérito.'), O('antiguas', 'Costumbres antiguas', 'Como siempre se hizo.'), O('abre', 'Abre el Senado a hombres nuevos', 'Savia nueva en la Curia.')] },
  consul: { id: 'consul', nombre: 'Cónsul', latin: 'consul', lleva: 'La guerra', ordenes: [O('prudente', 'Prudente', 'Evita aventuras.'), O('refuerza', 'Refuerza a los aliados', 'Apoyarse en los socios.'), O('ataque', 'Al ataque', 'Golpear primero.')] },
};
export const ORDEN_CARGOS = ['cuestor', 'edil', 'pretor', 'censor', 'consul'];
// efecto por estación de cada orden (con un hábil 2). obra = puntos de obra (100 = una obra); gente = habitantes
const ORD = {
  cuestor: { ahorra: { oro: 14, pueblo: -2, mer: -1, mil: -1 }, justo: { oro: 3 }, gasta: { oro: -14, pueblo: 2, mer: 1, mil: 1, obra: 15 } },
  edil: { obras: { oro: -14, mer: 1, obra: 140, gente: 250 }, grano: { oro: -6, pueblo: 2, ter: -1, obra: 45, gente: 700 }, juegos: { oro: -12, pueblo: 5, mil: 1, ter: -1, obra: 45, gente: 150 } },
  pretor: { dura: { oro: 2, pueblo: -2, ter: 2, mil: 1, mer: -1 }, igual: { pueblo: 1, mer: 1 }, aliados: { oro: -3, mer: 2, mil: -1, ter: -1 } },
  censor: { estricto: { oro: 4, pueblo: -1, ter: 2, mer: -1 }, antiguas: { pueblo: 1, ter: 1, mil: 1 }, abre: { oro: -2, pueblo: 2, mer: 2, ter: -3 } },
  consul: { prudente: { oro: 3, pueblo: 1, ter: 2, mil: -2 }, refuerza: { oro: -4, mer: 2, mil: 1, ter: -1 }, ataque: { oro: -6, pueblo: -1, mil: 3, ter: -2 } },
};
const TONO_ORDEN = { prudente: ['paz', 'aliados', 'guerra'], refuerza: ['aliados', 'guerra', 'paz'], ataque: ['guerra', 'aliados', 'paz'] };

/* ---------- personajes ---------- */
const P = (id, nombre, cargo, bando, habil, b, m, nota, fuente, dictamen = DIC) => ({ id, nombre, cargo, bando, habil, bueno: { titulo: b[0], texto: b[1] }, malo: { titulo: m[0], texto: m[1] }, nota, fuente, dictamen });
export const PERSONAS = [
  P('apio', 'Apio Claudio Cáudex', 'consul', 'mil', 3, ['Golpea primero', 'Sus campañas dan oro y fama a la tropa.'], ['No pide permiso', 'Decide por su cuenta aunque se lo hayas pedido todo.'], 'Cónsul en 264; cruzó a Mesina.', 'Polibio, Historias 1.11–12', DIC2),
  P('fulvio', 'Marco Fulvio Flaco', 'consul', 'ter', 2, ['Metódico', 'Cuida el tesoro y el orden.'], ['Lento', 'Tarda y los soldados se impacientan.'], 'Cónsul en 264; tomó Volsinios.', 'Fasti triumphales, año 264', DIC2),
  P('valerio', 'Manio Valerio Máximo Mesala', 'consul', 'mer', 2, ['Negociador', 'Saca provecho de cada pacto.'], ['Vanidoso', 'Gasta en su propia gloria.'], 'Cónsul en 263; hizo la paz con Hierón.', 'Polibio 1.16; Plinio, Historia natural 35.22', 'El hombre y su consulado, históricos, pero fue cónsul un año después: licencia de juego. El carácter, licencia de juego'),
  P('postumio', 'Lucio Postumio Megelo', 'pretor', 'ter', 2, ['Severo y recto', 'Los pleitos acaban rápido y el campo respira.'], ['Altivo', 'Trata con desdén a mercaderes y plebeyos.'], 'Cónsul en 262.', 'Polibio 1.17'),
  P('atilio', 'Aulo Atilio Calatino', 'pretor', 'mil', 3, ['Querido por el pueblo', 'La plebe lo aclama.'], ['Blando con los suyos', 'Perdona a los de su casa y cuesta oro.'], 'Cónsul en 258.', 'Cicerón, Sobre la vejez 61'),
  P('otacilio', 'Manio Otacilio Craso', 'pretor', 'mer', 2, ['Conoce a los aliados', 'Mercaderes y soldados lo respetan.'], ['Sin padrinos en el Senado', 'Los terratenientes lo ignoran.'], 'Cónsul en 263.', 'Polibio 1.16'),
  P('marcio', 'Cayo Marcio Rútilo Censorino', 'censor', 'ter', 3, ['Íntegro', 'Nadie duda de su censo.'], ['Rígido', 'No cede ni ante los mercaderes ni ante los militares.'], 'Censor en 294 y en 265, el único dos veces.', 'Valerio Máximo 4.1.3', DIC2),
  P('blasion', 'Cneo Cornelio Blasión', 'censor', 'mil', 2, ['Hombre de orden', 'Contenta a terratenientes y militares.'], ['Mira por su casa', 'Se queda una parte del tesoro.'], 'Censor en 265.', 'Fasti Capitolini', DIC2),
  P('coruncanio', 'Tiberio Coruncanio', 'censor', 'mer', 3, ['Sabio en leyes', 'Su fama de jurista calma al pueblo.'], ['Abre demasiadas puertas', 'Los terratenientes se sienten amenazados.'], 'Cónsul en 280; primer plebeyo pontífice máximo.', 'Cicerón, Sobre la naturaleza de los dioses 2.165; Digesto 1.2.2.38'),
  P('fabio', 'Numerio Fabio Píctor', 'edil', 'ter', 2, ['Ahorrador', 'Cada obra cuesta menos.'], ['Poco querido', 'Al pueblo no le cae bien.'], 'Cónsul en 266.', 'Fasti'),
  P('junio', 'Décimo Junio Pera', 'edil', 'mer', 2, ['Juegos espléndidos', 'La plebe se divierte.'], ['Manirroto', 'Gasta de más cada estación.'], 'Cónsul en 266; él y su hermano dieron los primeros gladiadores en 264.', 'Valerio Máximo 2.4.7; Livio, Períoca 16'),
  P('duilio', 'Cayo Duilio', 'edil', 'mil', 3, ['Ingenioso', 'Levanta obras más deprisa.'], ['Presumido', 'Se pasea y enfada a todos.'], 'Cónsul en 260; vencedor en Milas.', 'Polibio 1.22–23; Cicerón, Sobre la vejez 44'),
  P('aquilio', 'Cayo Aquilio Floro', 'cuestor', 'ter', 2, ['Cuentas claras', 'El arca siempre cuadra.'], ['Tacaño', 'Regatea hasta con el pueblo.'], 'Cónsul en 259.', 'Fasti'),
  P('escipion', 'Lucio Cornelio Escipión', 'cuestor', 'mil', 3, ['Buena cabeza', 'Encuentra oro donde nadie mira.'], ['Ambicioso', 'Mira más a su carrera que a Roma.'], 'Cónsul en 259; se conserva su epitafio.', 'CIL I² 8–9'),
  P('sulpicio', 'Cayo Sulpicio Patérculo', 'cuestor', 'mer', 2, ['Buen trato con mercaderes', 'Los mercaderes lo aprecian.'], ['Se deja querer', 'Acepta regalos que salen del arca.'], 'Cónsul en 258.', 'Fasti'),
];
// efecto mecánico de cada rasgo (por estación). obraMult multiplica las obras. tuerce: torcerá las consultas hacia su interés
const RASGOS = {
  apio: { b: { oro: 4, mil: 2 }, m: { permiso: 1 } }, fulvio: { b: { oro: 4, pueblo: 1 }, m: { mil: -2, pueblo: -1 } }, valerio: { b: { mer: 2, oro: 5 }, m: { oro: -5, pueblo: -1 } },
  postumio: { b: { ter: 2, pueblo: 1 }, m: { mer: -2, pueblo: -1 } }, atilio: { b: { pueblo: 3 }, m: { ter: -2, oro: -3, tuerce: 1 } }, otacilio: { b: { mer: 1, mil: 1, pueblo: 1 }, m: { ter: -2, mer: -1 } },
  marcio: { b: { pueblo: 2, ter: 1 }, m: { mer: -2, mil: -1 } }, blasion: { b: { ter: 1, mil: 2 }, m: { oro: -4, tuerce: 1 } }, coruncanio: { b: { pueblo: 2, mer: 1 }, m: { ter: -3, tuerce: 1 } },
  fabio: { b: { oro: 5 }, m: { pueblo: -3 } }, junio: { b: { pueblo: 4 }, m: { oro: -10, tuerce: 1 } }, duilio: { b: { mil: 1, obraMult: 1.2 }, m: { mer: -2, ter: -1, pueblo: -1 } },
  aquilio: { b: { oro: 6 }, m: { pueblo: -2, mer: -1 } }, escipion: { b: { mil: 2, oro: 3 }, m: { ter: -2, pueblo: -1, tuerce: 1 } }, sulpicio: { b: { mer: 2, oro: 3 }, m: { oro: -4, tuerce: 1 } },
};
const persona = id => PERSONAS.find(p => p.id === id);
const personaDe = (e, cargo) => persona(e.cargos[cargo]);
const noPidePermiso = (e, cargo) => !!(RASGOS[e.cargos[cargo]].m.permiso);

export function crear() {
  const ordenes = {}; for (const c of ORDEN_CARGOS) ordenes[c] = CARGOS[c].ordenes[1].id; ordenes.edil = 'obras'; // el edil empieza en obras: la ciudad crece desde la primera estación
  return { estacion: 0, oro: 200, pueblo: 50, humor: { ter: 50, mer: 50, mil: 50 }, escanos: { ter: 12, mer: 8, mil: 10 }, ciudad: { nivel: 0, obras: [], gente: 90000, genteIni: 90000 },
    cargos: { cuestor: 'aquilio', edil: 'fabio', pretor: 'postumio', censor: 'marcio', consul: 'apio' }, ordenes, ajuste: 'grande', promesas: [], marcas: { progreso: 0, aporte: {}, nombrados: ['aquilio', 'fabio', 'postumio', 'marcio', 'apio'], tratos: [] }, hilo: [], despachos: [], consultas: [], cerrado: false };
}
export function favor(e) { let s = 0, n = 0; for (const b of BS) { s += e.humor[b] * e.escanos[b]; n += e.escanos[b]; } return s / n; }

/* ---------- efectos: una sola fuente para los chips de antes y los cambios de después ---------- */
function lista(o) { const f = []; for (const k of ['oro', 'pueblo', 'ter', 'mer', 'mil', 'obra', 'gente']) if (o[k]) f.push({ que: k, n: o[k] }); return f; }
function aplica(e, efectos) {
  return efectos.map(({ que, n, nota }) => {
    let antes, despues;
    if (que === 'oro') { antes = e.oro; e.oro = clamp(e.oro + n, 0, 99999); despues = e.oro; }
    else if (que === 'pueblo') { antes = e.pueblo; e.pueblo = clamp(e.pueblo + n, 0, 100); despues = e.pueblo; }
    else if (que === 'obra') { antes = e.marcas.progreso; e.marcas.progreso = Math.max(0, antes + n); despues = e.marcas.progreso; }
    else if (que === 'gente') { antes = e.ciudad.gente; e.ciudad.gente = clamp(antes + n, 0, 999999); despues = e.ciudad.gente; }
    else { antes = e.humor[que]; e.humor[que] = clamp(antes + n, 0, 100); despues = e.humor[que]; }
    const c = { que, n: despues - antes }; if (nota) c.nota = nota; return c;
  });
}
function efectosOpcion(e, id) {
  const Pm = e.promesas, f = [], X = (que, n, nota) => f.push(nota ? { que, n, nota } : { que, n });
  if (id === 'alianza') { X('oro', 100); X('pueblo', 5); X('mer', 6); X('mil', -4); if (Pm.includes('botin')) X('mil', -15, 'rota'); if (Pm.includes('levas')) X('ter', 5, 'cumplida'); }
  else if (id === 'sitio') { X('oro', -80); X('mil', 8); X('mer', -6); X('pueblo', -4); if (Pm.includes('levas')) X('ter', -15, 'rota'); if (Pm.includes('botin')) X('mil', 5, 'cumplida'); }
  else if (id === 'tratado') { X('oro', 60); X('mer', 8); X('mil', -8); X('ter', 3); }
  else if (id === 'flota') { X('oro', -100); X('mil', 6); X('mer', -3); X('ter', -4); if (Pm.includes('levas')) X('ter', -15, 'rota'); }
  else if (id === 'permitir') { X('pueblo', 8); X('ter', -3); }
  else if (id === 'prohibir') { X('pueblo', -5); X('ter', 5); }
  else if (id === 'grandes') { X('oro', -60); X('pueblo', 14); X('ter', -5); X('mil', 2); }
  else if (id === 'cruzar' || id === 'senado') { X('mil', 4); X('mer', 4); X('ter', -4); X('pueblo', -3); }
  else if (id === 'pueblo') { X('ter', -10); X('mer', -10); X('mil', -10); X('pueblo', 6); }
  else if (id === 'acatar') { X('ter', 4); X('mil', -6); }
  return f;
}
function notas(e, cambios) {
  const fr = [];
  for (const c of cambios) if (c.nota) {
    const prom = c.que === 'mil' ? 'botin' : 'levas', quien = c.que === 'mil' ? 'los militares' : 'los terratenientes';
    if (c.nota === 'rota') { fr.push('Rompes tu promesa a ' + quien); (e.marcas.rotas ||= []).push(prom); } else { fr.push('Cumples tu promesa a ' + quien); (e.marcas.cumplidas ||= []).push(prom); }
  }
  return fr;
}

/* ---------- cargos: candidatos y órdenes ---------- */
export function candidatos(e, cargo) { return PERSONAS.filter(p => p.cargo === cargo).map(p => ({ ...p, ocupa: e.cargos[cargo] === p.id })); }
export function nombrar(e, cargo, id) {
  const p = persona(id); if (!p || p.cargo !== cargo) throw new Error('candidato inválido: ' + id);
  if (e.cerrado) throw new Error('el año ya acabó');
  const ant = personaDe(e, cargo); if (ant.id === id) return { cambios: [], coste: 0 };
  const gratis = e.estacion === 0; if (!gratis && e.oro < 30) throw new Error('falta oro');
  const ef = []; if (!gratis) { ef.push({ que: 'oro', n: -30 }); ef.push({ que: ant.bando, n: -6 }); }
  if (!e.marcas.nombrados.includes(id)) { e.marcas.nombrados.push(id); ef.push({ que: p.bando, n: 3 }); }
  e.cargos[cargo] = id; return { cambios: aplica(e, ef), coste: gratis ? 0 : 30 };
}
export function ordenar(e, cargo, ordenId) {
  if (!CARGOS[cargo] || !CARGOS[cargo].ordenes.some(o => o.id === ordenId)) throw new Error('orden inválida');
  e.ordenes[cargo] = ordenId; return [];
}
export function ajustar(e, a) { if (!['todo', 'grande', 'nada'].includes(a)) throw new Error('ajuste inválido'); e.ajuste = a; }

/* ---------- los asuntos grandes y la votación ---------- */
const POSTURA = { cruzar: { ter: -1, mer: 1, mil: 2 }, alianza: { ter: 0, mer: 2, mil: -1 }, sitio: { ter: -1, mer: -1, mil: 2 }, tratado: { ter: 1, mer: 2, mil: -1 }, flota: { ter: -1, mer: 0, mil: 2 }, permitir: { ter: -1, mer: 1, mil: 1 }, prohibir: { ter: 2, mer: -1, mil: -1 }, grandes: { ter: -2, mer: 1, mil: 2 } };
const TONO = { cruzar: 'guerra', acatar: 'paz', alianza: 'aliados', sitio: 'guerra', tratado: 'paz', flota: 'guerra', permitir: 'aliados', prohibir: 'paz', grandes: 'aliados' };
const TRATOS = [
  { id: 'ter', bando: 'ter', titulo: 'Sin levas en el campo este año', tipo: 'Promesa', etiqueta: 'Arriesgado', texto: 'Los terratenientes votan sí. Choca con una guerra.', chips: [] },
  { id: 'mer', bando: 'mer', titulo: 'Pagar 60 de oro', tipo: 'Pago', etiqueta: 'Dudoso', texto: 'Los mercaderes votan sí a cambio de oro.', chips: [{ que: 'oro', n: -60 }] },
  { id: 'mil', bando: 'mil', titulo: 'Botín para la tropa', tipo: 'Promesa', etiqueta: 'Dudoso', texto: 'Los militares votan sí con la promesa de un reparto.', chips: [] },
];
export function tratos(e) { return TRATOS.map(t => ({ ...t, chips: t.chips.map(c => ({ ...c })), usado: !!(e && e.marcas.tratos.includes(t.id)) })); }

export function votos(e, opcionId, trat = []) {
  const post = POSTURA[opcionId]; if (!post) throw new Error('opción sin votación: ' + opcionId);
  const r = { hacenFalta: HACEN_FALTA }; let si = 0, duda = 0, no = 0;
  const con = personaDe(e, 'consul'), encaja = TONO_ORDEN[e.ordenes.consul][0] === TONO[opcionId];
  for (const b of BS) {
    const esc = e.escanos[b], pts = post[b] * 15 + (e.humor[b] - 50) / 2;
    let s = Math.round(esc * clamp(0.5 + pts / 50, 0, 1) * 0.8), n = Math.round(esc * clamp(0.5 - pts / 50, 0, 1) * 0.8), d = esc - s - n;
    if (trat.includes(b)) { s += d; d = 0; }
    if (encaja && con.bando === b) { let k = 2; const dd = Math.min(k, d); d -= dd; s += dd; k -= dd; const nn = Math.min(k, n); n -= nn; s += nn; }
    r[b] = { si: s, duda: d, no: n }; si += s; duda += d; no += n;
  }
  r.si = si; r.duda = duda; r.no = no; r.sale = si >= HACEN_FALTA; return r;
}
const mk = (e, id, titulo, real) => ({ id, titulo, real, tono: TONO[id], chips: efectosOpcion(e, id).map(c => ({ ...c })) });
export function asunto(e) {
  const p = e.estacion, cruza = !!e.marcas.cruza, base = { id: ['I', 'II', 'III', 'IV'][p], estacion: ESTACIONES[p] };
  if (p === 0) return { ...base, fecha: 'Primavera de 264 a.C. · Mesina pide ayuda', titulo: 'Mesina pide ayuda', texto: 'Los mamertinos, mercenarios que tienen Mesina, piden socorro a Roma. Cartago ya ha metido una guarnición en la ciudad. Al otro lado del Estrecho está Sicilia.', fuente: 'Polibio, Historias 1.10–11', dictamen: 'histórico', tipo: 'voto', opciones: [mk(e, 'cruzar', 'Cruzar a Sicilia', true)] };
  if (p === 1 && cruza) return { ...base, fecha: 'Verano de 264 a.C. · Hierón de Siracusa', titulo: 'Hierón de Siracusa', texto: 'Tus legiones han roto el cerco de Mesina. Hierón, rey de Siracusa, se retira a su ciudad y ofrece paz, grano y cien talentos.', fuente: 'Polibio 1.11–12 y 1.16; Diodoro 23.4', dictamen: 'licencia de juego: la paz con Hierón fue en 263; aquí va en el mismo año', tipo: 'opciones', opciones: [mk(e, 'alianza', 'Aliarte con Hierón', true), mk(e, 'sitio', 'Sitiar Siracusa', false)] };
  if (p === 1) return { ...base, fecha: 'Verano de 264 a.C. · Cartago en el Estrecho', titulo: 'Cartago en el Estrecho', texto: 'Cartago se queda Mesina. Sus naves vigilan el paso frente a Regio. Sus enviados recuerdan los viejos tratados.', fuente: 'Polibio 3.22–26 (tratados entre Roma y Cartago)', dictamen: 'licencia de juego: historia que no ocurrió; los tratados sí existieron', tipo: 'opciones', opciones: [mk(e, 'tratado', 'Renovar el tratado con Cartago', false), mk(e, 'flota', 'Armar una flota en secreto', false)] };
  if (p === 2) { const g = mk(e, 'grandes', 'Pagarlo tú y hacerlo grande', false); if (e.oro < 60) { g.apagada = true; g.aviso = 'falta oro'; }
    return { ...base, fecha: 'Otoño de 264 a.C. · Sangre en el Foro Boario', titulo: 'Sangre en el Foro Boario', texto: 'Los hijos de Junio Bruto Pera quieren honrar a su padre muerto con algo nunca visto en Roma: tres parejas de hombres luchando a espada.', fuente: 'Livio, Períoca 16; Valerio Máximo 2.4.7', dictamen: 'histórico (fueron los primeros gladiadores de Roma); que tú lo permitas o no es licencia de juego', tipo: 'opciones', opciones: [mk(e, 'permitir', 'Permitirlo', true), mk(e, 'prohibir', 'Prohibirlo', false), g] }; }
  return { ...base, fecha: 'Invierno de 264 a.C. · Cierre del año', titulo: 'El hilo de la historia', texto: 'El año se acaba. Mira dónde coincidiste con la historia y dónde te apartaste.', fuente: 'Polibio, Historias 1.10–12 y 1.20; Livio, Períoca 16', dictamen: 'mezcla: los hechos son históricos; el rumbo que sigue es conjetura y licencia de juego', tipo: 'cierre' };
}
const DICHAS = { alianza: 'Aliarte con Hierón: grano, oro y paz en Sicilia.', sitio: 'Pones sitio a Siracusa.', tratado: 'Renuevas el tratado con Cartago.', flota: 'Mandas armar naves en secreto.', permitir: 'Los gladiadores luchan en el Foro Boario.', prohibir: 'Prohíbes el espectáculo.', grandes: 'Pagas unos juegos nunca vistos.' };
function resolverGrande(e, id) { // aplica la opción que ha salido (verano y otoño)
  const cambios = aplica(e, efectosOpcion(e, id)); e.marcas['hecho' + e.estacion] = true;
  if (e.estacion === 1) e.marcas[e.marcas.cruza ? 'hieron' : 'estrecho'] = id; else e.marcas.juegos = id === 'permitir' ? true : id === 'prohibir' ? false : 'grandes';
  e.hilo.push(e.estacion + ':' + id); const fr = notas(e, cambios);
  return { cambios, linea: [DICHAS[id], ...fr].join(' ') + (fr.length ? '.' : '') };
}
function pagaTratos(e, sel) {
  for (const t of sel) { if (!BS.includes(t)) throw new Error('trato inválido: ' + t); if (e.marcas.tratos.includes(t)) throw new Error('trato ya usado este año: ' + t); }
  if (sel.includes('mer') && e.oro < 60) throw new Error('falta oro para el trato');
  const cambios = []; for (const t of sel) { e.marcas.tratos.push(t); if (t === 'ter') e.promesas.push('levas'); if (t === 'mil') e.promesas.push('botin'); }
  if (sel.includes('mer')) cambios.push(...aplica(e, [{ que: 'oro', n: -60 }])); return cambios;
}
export function votar(e, opcionId, trat = []) {
  if (e.cerrado || e.estacion > 2) throw new Error('no hay votación'); if (e.marcas['hecho' + e.estacion] || e.marcas.pendiente) throw new Error('el voto ya está resuelto');
  const as = asunto(e), op = as.opciones.find(o => o.id === opcionId); if (!op) throw new Error('opción inválida: ' + opcionId); if (op.apagada) throw new Error('opción apagada: ' + opcionId);
  const sel = [...new Set(trat)], cambios = pagaTratos(e, sel), v = votos(e, opcionId, sel); e.marcas['votos' + e.estacion] = v;
  if (e.estacion === 0) {
    if (!v.sale) { e.marcas.pendiente = true; return { sale: false, salio: null, votos: v, cambios, linea: 'Solo ' + v.si + ' de ' + HACEN_FALTA + ': el Senado no se decide.' }; }
    e.marcas.cruza = true; e.marcas.via = 'senado'; e.marcas.hecho0 = true; cambios.push(...aplica(e, efectosOpcion(e, 'senado'))); e.hilo.push('I:senado');
    return { sale: true, salio: 'cruzar', votos: v, cambios, linea: 'El Senado vota ' + v.si + ' a favor: Roma cruza a Sicilia.' };
  }
  let id = opcionId; if (!v.sale) { let mejor = -1; for (const o of as.opciones) if (o.id !== opcionId && !o.apagada) { const s = votos(e, o.id, []).si; if (s > mejor) { mejor = s; id = o.id; } } }
  const r = resolverGrande(e, id); cambios.push(...r.cambios);
  return { sale: v.sale, salio: id, votos: v, cambios, linea: (v.sale ? 'El Senado vota ' + v.si + ' a favor. ' : 'Solo ' + v.si + ' de ' + HACEN_FALTA + ': tu propuesta cae y sale otra. ') + r.linea };
}
export function elegir(e, id) {
  if (e.estacion !== 0 || !e.marcas.pendiente) throw new Error('no hay segunda decisión');
  if (id !== 'pueblo' && id !== 'acatar') throw new Error('opción inválida: ' + id);
  delete e.marcas.pendiente; const cambios = aplica(e, efectosOpcion(e, id));
  e.marcas.cruza = id === 'pueblo'; e.marcas.via = id === 'pueblo' ? 'pueblo' : 'no'; e.marcas.hecho0 = true; e.hilo.push('I:' + e.marcas.via);
  return { cambios, linea: id === 'pueblo' ? 'La asamblea del pueblo vota ir: Roma cruza a Sicilia.' : 'Acatas al Senado: Roma no cruza.' };
}

/* ---------- asuntos menores ---------- */
const CS = (id, cargo, estacion, titulo, texto, fuente, a, b, elige) => ({ id, cargo, estacion, titulo, texto, fuente, dictamen: 'licencia de juego: asunto típico de la época, no un hecho fechado', opciones: [{ id: 'a', titulo: a[0], ef: a[1], interes: !!a[2] }, { id: 'b', titulo: b[0], ef: b[1], interes: !!b[2] }], elige });
const CONSULTAS = [
  CS('grano', 'edil', 0, 'Sube el precio del grano', 'Mala siega: los vendedores del Foro Boario piden más por el trigo.', 'Asunto típico de la annona romana', ['Fijar el precio', { pueblo: 4, ter: -3 }], ['Dejar que suba', { pueblo: -4, ter: 3, mer: 1 }, 1], { obras: 'b', grano: 'a', juegos: 'a' }),
  CS('contrata', 'cuestor', 0, 'Un publicano pide la contrata de la calzada', 'Un publicano ofrece adelantar el dinero a cambio de la contrata.', 'Polibio 6.17 (contratas públicas)', ['Sacarla a subasta', { oro: -10, pueblo: 1, mer: -2, obra: 20 }], ['Dársela al publicano', { oro: 15, mer: 4, pueblo: -2 }, 1], { ahorra: 'b', justo: 'a', gasta: 'a' }),
  CS('pleito', 'pretor', 1, 'Pleito de un aliado latino contra un senador', 'Un latino aliado reclama tierras que un senador le ha quitado.', 'Asunto típico de la época', ['Dar la razón al aliado', { mer: 2, pueblo: 2, ter: -3 }], ['Dar la razón al senador', { ter: 3, pueblo: -3, mer: -2 }, 1], { dura: 'b', igual: 'a', aliados: 'a' }),
  CS('remeros', 'consul', 1, 'Faltan remeros para cruzar el Estrecho', 'Las naves de los aliados no bastan para pasar las legiones.', 'Polibio 1.11 (el paso del Estrecho)', ['Pedir remeros a los aliados de la costa', { oro: -10, mil: 1, pueblo: 1 }], ['Reclutar a la fuerza entre la plebe', { pueblo: -5, mil: 3 }, 1], { prudente: 'a', refuerza: 'a', ataque: 'b' }),
  CS('caballero', 'censor', 2, 'Un caballero rico pide entrar en el Senado', 'Un caballero enriquecido con el comercio quiere un asiento en la Curia.', 'Asunto típico de la época', ['Admitirlo', { oro: 10, mer: 4, ter: -3 }, 1], ['Rechazarlo', { ter: 3, mer: -3, pueblo: 1 }], { estricto: 'b', antiguas: 'b', abre: 'a' }),
  CS('cloaca', 'edil', 2, 'Reparar la Cloaca o adoquinar el Clivo', 'Hay dinero para una sola obra: la Cloaca Máxima que se hunde o el Clivo Capitolino.', 'Livio 1.56 (la Cloaca Máxima)', ['Reparar la Cloaca', { oro: -12, pueblo: 2, obra: 40, gente: 300 }], ['Adoquinar el Clivo', { oro: -12, pueblo: 3, mer: 2, obra: 25 }, 1], { obras: 'a', grano: 'a', juegos: 'b' }),
];
const chipsC = o => lista(o.ef);
export function consultas(e) {
  if (e.cerrado || e.estacion > 2) return [];
  return CONSULTAS.filter(c => c.estacion === e.estacion).map(c => {
    const d = e.consultas.find(x => x.id === c.id);
    return { id: c.id, cargo: c.cargo, persona: personaDe(e, c.cargo).nombre, titulo: c.titulo, texto: c.texto, fuente: c.fuente, dictamen: c.dictamen, opciones: c.opciones.map(o => ({ id: o.id, titulo: o.titulo, chips: chipsC(o) })), decidida: d ? d.opcion : null, laDecideElMagistrado: e.ajuste !== 'todo' || noPidePermiso(e, c.cargo) };
  });
}
export function decidir(e, consultaId, opcionId) {
  const c = CONSULTAS.find(x => x.id === consultaId); if (!c || c.estacion !== e.estacion || e.cerrado) throw new Error('consulta inválida: ' + consultaId);
  if (e.ajuste !== 'todo' || noPidePermiso(e, c.cargo)) throw new Error('esta consulta la decide el magistrado'); if (e.consultas.some(x => x.id === c.id)) throw new Error('consulta ya decidida');
  const o = c.opciones.find(x => x.id === opcionId); if (!o) throw new Error('opción inválida: ' + opcionId);
  e.consultas.push({ id: c.id, estacion: e.estacion, opcion: o.id, por: 'jugador' });
  return { cambios: aplica(e, chipsC(o)), linea: 'Decides: ' + o.titulo + '.' };
}
export function puedeCerrar(e) {
  const falta = []; if (e.cerrado) return { ok: false, falta: ['el año ya acabó'] };
  if (e.estacion <= 2 && e.ajuste !== 'nada' && !e.marcas['hecho' + e.estacion]) falta.push(e.marcas.pendiente ? 'decidir qué hacer si el Senado no vota' : 'votar el asunto grande');
  if (e.ajuste === 'todo') for (const c of consultas(e)) if (c.decidida === null && !c.laDecideElMagistrado) falta.push('decidir: ' + c.titulo);
  return { ok: falta.length === 0, falta };
}

/* ---------- el trabajo de los magistrados ---------- */
function llevaElConsul(e) { // ajuste «nada» (o voto no hecho): el cónsul lleva al Senado lo que encaja con su orden
  const as = asunto(e), pref = TONO_ORDEN[e.ordenes.consul]; let id = null;
  if (e.estacion === 0) { for (const t of pref) { if (t === 'guerra') { id = 'cruzar'; break; } if (t === 'paz') { id = 'acatar'; break; } } if (!id) id = 'acatar'; }
  else { const ops = as.opciones.filter(o => !o.apagada); for (const t of pref) { const o = ops.find(x => x.tono === t); if (o) { id = o.id; break; } } if (!id) id = ops[0].id; }
  let r;
  if (e.estacion === 0) { if (id === 'cruzar') { r = votar(e, 'cruzar', []); if (!r.sale) r = { ...r, ...elegir(e, 'acatar') }; } else { e.marcas.pendiente = true; r = elegir(e, 'acatar'); } }
  else r = votar(e, id, []);
  return { id, linea: r.linea };
}
function eligeMagistrado(e, c) {
  const p = personaDe(e, c.cargo); const t = RASGOS[p.id].m.tuerce;
  if (t) { const o = c.opciones.find(x => x.interes); if (o) return { o, torcida: true }; }
  return { o: c.opciones.find(x => x.id === c.elige[e.ordenes[c.cargo]]), torcida: false };
}
const PARTES = {
  cuestor: { ahorra: 'Cierro el arca con candado: gasto lo mínimo y guardo cada sestercio.', justo: 'Pago lo que se debe, ni un as más ni uno menos.', gasta: 'He abierto el arca: pagos rápidos y favores a quien nos conviene.' },
  edil: { obras: 'He puesto a los obreros a trabajar en piedra y andamios.', grano: 'He vigilado los graneros y el pan se vende barato en el Foro.', juegos: 'He preparado fiestas y espectáculos para la plebe.' },
  pretor: { dura: 'He juzgado con rigor: los castigos han sido ejemplares.', igual: 'He aplicado la ley a todos por igual, sea quien sea.', aliados: 'He oído primero a los aliados y he resuelto a su favor.' },
  censor: { estricto: 'He revisado el censo con lupa y he quitado a quien no cumple.', antiguas: 'He cuidado las costumbres de los mayores, sin cambiar nada.', abre: 'He dado puerta a hombres nuevos en las listas del Senado.' },
  consul: { prudente: 'He mantenido las legiones en pie, sin arriesgarlas.', refuerza: 'He tratado con los aliados y los he armado a nuestro lado.', ataque: 'He golpeado primero, antes de que el enemigo se mueva.' },
};
function trabaja(e, cargo) {
  const p = personaDe(e, cargo), o = ORD[cargo][e.ordenes[cargo]], r = RASGOS[p.id], h = 0.7 + 0.15 * p.habil, ef = {};
  for (const k of ['oro', 'pueblo', 'ter', 'mer', 'mil']) { const v = Math.round((o[k] || 0) * h) + (r.b[k] || 0) + (r.m[k] || 0); if (v) ef[k] = v; }
  ef.obra = Math.round((o.obra || 0) * (0.8 + 0.2 * p.habil) * (r.b.obraMult || 1)); ef.gente = o.gente || 0; return ef;
}
export function cerrarEstacion(e) {
  if (e.cerrado) throw new Error('el año ya acabó');
  if (e.ajuste === 'nada' && e.estacion <= 2 && !e.marcas['hecho' + e.estacion]) { e.marcas.llevo = llevaElConsul(e); e.marcas.llevo.est = e.estacion; }
  const pc = puedeCerrar(e); if (!pc.ok) throw new Error('falta: ' + pc.falta.join('; '));
  const est = e.estacion, cs = est <= 2 ? CONSULTAS.filter(c => c.estacion === est) : [], decide = {};
  for (const c of cs) { if (!e.consultas.some(x => x.id === c.id)) { const { o, torcida } = eligeMagistrado(e, c); e.consultas.push({ id: c.id, estacion: est, opcion: o.id, por: 'magistrado', torcida }); decide[c.cargo] = { c, o, torcida }; } }
  const res = {}, progAntes = e.marcas.progreso;
  for (const cargo of ORDEN_CARGOS) {
    const ef = lista(trabaja(e, cargo)).filter(x => x.que !== 'obra' && x.que !== 'gente'); const obra = trabaja(e, cargo).obra, gente = trabaja(e, cargo).gente;
    const cambios = aplica(e, ef); if (obra) cambios.push(...aplica(e, [{ que: 'obra', n: obra }])); if (gente) cambios.push(...aplica(e, [{ que: 'gente', n: gente }]));
    let dec = null; if (decide[cargo]) { dec = decide[cargo]; cambios.push(...aplica(e, chipsC(dec.o))); }
    res[cargo] = { cambios, dec };
  }
  let nuevas = 0; while (e.marcas.progreso >= 100 && nuevas < 2 && e.ciudad.obras.length < OBRAS.length) { const ob = OBRAS[e.ciudad.obras.length]; e.ciudad.obras.push({ id: ob.id, nombre: ob.nombre, estacion: est }); e.marcas.progreso -= 100; nuevas++; }
  e.ciudad.nivel = e.ciudad.obras.length; if (nuevas) aplica(e, [{ que: 'gente', n: 400 * nuevas }]); aplica(e, [{ que: 'gente', n: 150 }]);
  const partes = [];
  for (const cargo of ORDEN_CARGOS) {
    const p = personaDe(e, cargo), { cambios, dec } = res[cargo], co = CARGOS[cargo].ordenes.find(o => o.id === e.ordenes[cargo]);
    let t = PARTES[cargo][co.id];
    if (cargo === 'edil' && nuevas) t += ' Hemos terminado: ' + e.ciudad.obras.slice(-nuevas).map(o => o.nombre.toLowerCase()).join(' y ') + '.';
    if (cargo === 'consul' && e.marcas.llevo && e.marcas.llevo.est === est) t += ' Sin que me lo pidieras, llevé al Senado: «' + (e.marcas.llevo.id === 'acatar' ? 'no cruzar' : e.marcas.llevo.id) + '».';
    if (dec) t += dec.torcida ? ' Sobre «' + dec.c.titulo + '» decidí a mi conveniencia: ' + dec.o.titulo.toLowerCase() + '.' : ' Sobre «' + dec.c.titulo + '» decidí: ' + dec.o.titulo.toLowerCase() + '.';
    t += est % 2 === 0 ? ' ' + p.bueno.titulo + ': ' + p.bueno.texto : ' ' + p.malo.titulo + ': ' + p.malo.texto;
    const ap = cambios.reduce((s, c) => s + (c.que === 'oro' ? c.n / 10 : c.que === 'pueblo' ? c.n : ['ter', 'mer', 'mil'].includes(c.que) ? c.n / 2 : 0), 0) + (cargo === 'edil' ? nuevas * 3 : 0);
    e.marcas.aporte[cargo] = (e.marcas.aporte[cargo] || 0) + ap;
    const parte = { estacion: est, cargo, persona: p.id, orden: co.id, texto: t, cambios: cambios.filter(c => c.n !== 0 && c.que !== 'obra') }; if (dec) parte.decidio = { consulta: dec.c.id, opcion: dec.o.id };
    e.despachos.push(parte); partes.push(parte);
  }
  if (est === 3) e.cerrado = true; else e.estacion++;
  return partes;
}

/* ---------- cierre ---------- */
const RUMBOS = {
  'cruza-alianza': { id: 'mar', titulo: 'Roma mira al mar', frase: 'Con el grano de Siracusa a tu espalda, la guerra con Cartago será larga y se decidirá en el agua.', viene: '260 a.C.: Roma construye su primera flota (Polibio 1.20).', real: true },
  'cruza-sitio': { id: 'martillo', titulo: 'Roma, martillo de Sicilia', frase: 'Los griegos de la isla te temen más que a Cartago. Tendrás dos enemigos y ningún granero.', viene: 'Siracusa llama a Cartago.', real: false },
  'no-tratado': { id: 'tierra', titulo: 'Roma, potencia de tierra', frase: 'Cartago manda en el mar y tú en Italia. Hay paz y comercio; el Estrecho no es tuyo.', viene: 'Roma mira al norte, hacia los galos.', real: false },
  'no-flota': { id: 'aplazada', titulo: 'Guerra aplazada', frase: 'Nadie ha roto la paz todavía, pero los dos contáis barcos.', viene: 'Cuando llegue la guerra, Roma ya tendrá naves.', real: false },
};
export function cierre(e) {
  const m = e.marcas, cruza = !!m.cruza, via = m.via, II = cruza ? m.hieron : m.estrecho;
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
  const magistrados = ORDEN_CARGOS.map(c => {
    const p = personaDe(e, c), a = e.marcas.aporte[c] || 0, juicio = a >= 4 ? 'bien' : a >= 0 ? 'regular' : 'mal', ds = e.despachos.filter(d => d.cargo === c);
    const suma = k => ds.reduce((s, d) => s + d.cambios.filter(x => x.que === k).reduce((q, x) => q + x.n, 0), 0), oro = suma('oro'), pu = suma('pueblo');
    return { cargo: c, persona: p.id, nombre: p.nombre, orden: e.ordenes[c], juicio, texto: p.nombre + ' (' + CARGOS[c].nombre.toLowerCase() + '): ' + juicio + '. Dejó ' + (oro >= 0 ? '+' : '') + oro + ' de oro y ' + (pu >= 0 ? '+' : '') + pu + ' de pueblo.' };
  });
  return {
    desvio: Math.round(real.filter(x => !x).length / 3 * 100), nudos, rumbo: { ...RUMBOS[clave] },
    secundaria: m.juegos === true ? 'Roma descubre los juegos de sangre' : m.juegos === false ? 'Roma sigue siendo austera' : 'La plebe ya espera juegos de quien manda',
    balance: [{ que: 'oro', ini: base.oro, fin: e.oro }, { que: 'pueblo', ini: base.pueblo, fin: e.pueblo }, { que: 'favor', ini: Math.round(favor(base)), fin: Math.round(favor(e)) }].map(b => ({ ...b, dif: b.fin - b.ini })),
    promesas: [...(m.cumplidas || []).map(p => ({ id: p, estado: 'cumplida' })), ...(m.rotas || []).map(p => ({ id: p, estado: 'rota' }))].map(p => ({ ...p, texto: p.id === 'levas' ? 'Sin levas en el campo' : 'Botín para la tropa' })),
    ciudad: { nivel: e.ciudad.nivel, obras: e.ciudad.obras.map(o => ({ ...o })), genteIni: e.ciudad.genteIni, genteFin: e.ciudad.gente }, magistrados,
  };
}
