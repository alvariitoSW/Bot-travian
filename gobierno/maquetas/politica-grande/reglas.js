// EV4a · «Política grande» (264 a.C.) — reglas sin pantalla. Corre en Node y en el navegador. El azar sale de una semilla guardada en el estado.
// API para quien haga la pantalla. Las funciones que cambian la partida MUTAN el estado `e`; las que consultan (votos, asunto, consultas, visita, senadores, veredicto…) ni mutan ni gastan azar.
//  crear(semilla=1) → e (lleva e.semilla y e.rng, un entero: pasar `e` por JSON entre pasos no cambia nada) · ajustar(e,'todo'|'grande'|'nada') · ordenar(e,cargo,ordenId) → cambios
//  candidatos(e,cargo) → [persona+{ocupa}] · nombrar(e,cargo,personaId) → {cambios,coste}
//  asunto(e) → {id,estacion,fecha,titulo,texto,fuente,dictamen,nota?,tipo:'voto'|'opciones'|'cierre',opciones:[{id,titulo,tono,chips,apagada?}]}
//  tratos(e) → [{id:'ter'|'mer'|'mil',titulo,tipo,etiqueta,texto,chips,usado,bloqueado}] (una vez cada uno por año; empujan, no garantizan; bloqueados si el Senado está en contra)
//  votos(e,opcionId,tratos[]) → PRONÓSTICO {ter:{si,duda,no},mer,mil,si,duda,no,sale,puedeSalir,claves,hacenFalta}: si = seguros, duda = dudosos; sale = seguros ≥ 16; no gasta azar
//  senadores(e,opcionId?,tratos?) → [{id,nombre,corto,bando,arrastra,quiere:{texto,cumplido,tipo,cargo,valor,n},ganado,coste,animo:'a favor'|'dudoso'|'en contra',fuente,dictamen}]
//  ganarse(e,senadorId) → {cambios,linea}: paga un favor (22 de oro; 40 si quiere un regalo en oro y aún no lo tiene); una vez por estación y senador; vale para el voto de esa estación
//  votar(e,opcionId,tratos[]) → {sale,salio,votos,cambios,linea,rival?}: el recuento REAL se sortea aquí (duda:0). `sale` = salió TU propuesta. `salio` = lo que salió (tu opción, la del rival, o null si nada salió).
//     Verano y otoño: si tu propuesta cae, rival = {senador,opcion,votos,sale} propone y se vota en el acto; si tampoco sale, salio:null y el asunto queda sin resolver (con coste).
//     Primavera: si !sale hay que llamar elegir(e,'pueblo'|'acatar')
//  elegir(e,id) → {sale,cambios,linea} (solo la segunda decisión de primavera; 'pueblo' VOTA la asamblea y puede caer, entonces sale:false) · asamblea(e) → {pueblo,prob,animo}
//  consultas(e) → [{id,cargo,persona,titulo,texto,opciones,decidida,laDecideElMagistrado}] (2 por estación, del mazo CONSULTAS, sorteadas con la semilla)
//  decidir(e,consultaId,opcionId) → {cambios,linea} (solo con ajuste 'todo' y si el magistrado no «no pide permiso»)
//  visita(e) → {id,tipo:'pide'|'choque',cargo,persona,cargoB?,personaB?,titulo,texto,fuente,dictamen,opciones:[{id,titulo,chips}],atendida} o null · atender(e,opcionId) → {cambios,linea}
//     (pide: 'conceder'|'negar'; choque: 'a'|'b'). Si no se atiende antes de cerrar, pasa lo peor. puedeCerrar NO la exige.
//  puedeCerrar(e) → {ok,falta[]} · cerrarEstacion(e) → [partes] (parte: {estacion,cargo,persona,orden,texto,cambios,fallo?,decidio?}; el array lleva .fijos y .sucesos) · e.despachos
//  cierre(e) → {desvio,nudos,rumbo,secundaria,balance,promesas,ciudad,magistrados,veredicto}; nudo de primavera con `matiz` si cruzas por el Senado
//  veredicto(e) → {nota 0–100,grado:'honores'|'gris'|'casa',titulo,frase,causas:[{texto,puntos}],desastres,juicio?:{texto,multa},dictamen}
//  Un cambio/chip es {que:'oro'|'pueblo'|'ter'|'mer'|'mil'|'obra'|'gente', n, nota?:'rota'|'cumplida'}. Obras: OBRAS (ids para el dibujo). Exporta también SENADORES, CONSULTAS, VISITAS.
//  Estado: estacion 0..3 (e.cerrado=true tras el invierno), oro, pueblo, humor, escanos, ciudad, cargos, ordenes, ajuste, promesas, marcas, hilo, despachos, consultas, sorteo, sucesos, semilla, rng.
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
const DIC_ASUNTO = 'licencia de juego: asunto típico de la época, no un hecho fechado';
// números que se afinan con los robots de prueba.mjs
const GASTO = 4, GASTO_GUERRA = 3, PLEBE = 3; // gastos fijos por estación y lo que la plebe pide siempre
const FALLO = { 1: 0.22, 2: 0.15, 3: 0.08 }; // probabilidad de que un magistrado falle, según su habilidad
const COSTE_FAVOR = 22, COSTE_REGALO = 40, ARRASTRE = 3;
const PESO = { desea: 1.4, ganado: 1.2, trato: 1.8, consul: 0.5, postura: 0.8, humor: 20 };

export const OBRAS = [
  { id: 'calzada', nombre: 'Tramo de calzada empedrada' }, { id: 'fuente', nombre: 'Fuente pública del Anio Viejo' },
  { id: 'graneros', nombre: 'Graneros' }, { id: 'mercado', nombre: 'Mercado' },
  { id: 'casas', nombre: 'Casas nuevas en el Aventino' }, { id: 'templo', nombre: 'Templo de Vertumno en el Aventino', nota: 'Lo votó Fulvio Flaco en 264 (histórico)' },
  { id: 'muralla', nombre: 'Lienzo de muralla reparado' }, { id: 'muelle', nombre: 'Muelle en el Tíber' },
];

/* ---------- azar guardable: un entero de 32 bits dentro de `e` (mulberry32) ---------- */
function rnd(e) { let t = (e.rng = (e.rng + 0x6D2B79F5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const ri = (e, n) => Math.floor(rnd(e) * n);

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
const tituloOrden = (c, id) => CARGOS[c].ordenes.find(o => o.id === id).titulo;
// efecto por estación de cada orden (con un hábil 2). obra = puntos de obra (100 = una obra); gente = habitantes
const ORD = {
  cuestor: { ahorra: { oro: 18, pueblo: -2, mer: -1, mil: -1 }, justo: { oro: 8 }, gasta: { oro: -14, pueblo: 2, mer: 1, mil: 1, obra: 15 } },
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

/* ---------- los seis senadores clave: dos por bando, cada uno arrastra tres votos ---------- */
const DIC_SEN = 'El hombre y su consulado, históricos; su bando, a quién arrastra y lo que quiere: licencia de juego';
const SN = (id, nombre, corto, bando, anio) => ({ id, nombre, corto, bando, consulado: anio, nota: 'Cónsul en ' + anio + '.', fuente: 'Fasti Capitolini, año ' + anio, dictamen: DIC_SEN, arrastra: ARRASTRE });
export const SENADORES = [
  SN('regulo', 'Marco Atilio Régulo', 'Atilio Régulo', 'mil', 267), SN('libon', 'Lucio Julio Libón', 'Julio Libón', 'mil', 267),
  SN('ogulnio', 'Quinto Ogulnio Galo', 'Ogulnio Galo', 'mer', 269), SN('mamilio', 'Lucio Mamilio Vítulo', 'Mamilio Vítulo', 'mer', 265),
  SN('sofo', 'Publio Sempronio Sofo', 'Sempronio Sofo', 'ter', 268), SN('pictor', 'Cayo Fabio Píctor', 'Fabio Píctor', 'ter', 269),
];
const DESEOS = { // dos deseos por senador; la semilla elige uno
  regulo: [{ tipo: 'orden', cargo: 'consul', valor: 'ataque' }, { tipo: 'cargo', cargo: 'edil', valor: 'duilio' }],
  libon: [{ tipo: 'orden', cargo: 'censor', valor: 'antiguas' }, { tipo: 'oro', n: COSTE_REGALO }],
  ogulnio: [{ tipo: 'orden', cargo: 'cuestor', valor: 'gasta' }, { tipo: 'obras', n: 2 }],
  mamilio: [{ tipo: 'orden', cargo: 'pretor', valor: 'igual' }, { tipo: 'cargo', cargo: 'censor', valor: 'coruncanio' }],
  sofo: [{ tipo: 'orden', cargo: 'consul', valor: 'prudente' }, { tipo: 'orden', cargo: 'censor', valor: 'estricto' }],
  pictor: [{ tipo: 'cargo', cargo: 'edil', valor: 'fabio' }, { tipo: 'oro', n: COSTE_REGALO }],
};
const MANIA = { // una manía propia por senador y opción
  regulo: { cruzar: 0.6, sitio: 0.5, flota: 0.4, tratado: -0.5 }, libon: { cruzar: 0.3, grandes: 0.4, prohibir: -0.3 },
  ogulnio: { alianza: 0.5, tratado: 0.4, permitir: 0.3, sitio: -0.4 }, mamilio: { alianza: 0.3, grandes: 0.4, flota: -0.4 },
  sofo: { prohibir: 0.6, cruzar: -0.3, grandes: -0.4 }, pictor: { prohibir: 0.5, permitir: -0.4, tratado: 0.3 },
};
const deseoDe = (e, s) => DESEOS[s.id][e.marcas.deseos[s.id] || 0];
function cumplido(e, s) {
  const d = deseoDe(e, s);
  if (d.tipo === 'orden') return e.ordenes[d.cargo] === d.valor; if (d.tipo === 'cargo') return e.cargos[d.cargo] === d.valor;
  if (d.tipo === 'obras') return e.ciudad.obras.length >= d.n; return !!e.marcas.regalos[s.id];
}
function textoDeseo(d) {
  if (d.tipo === 'orden') return 'Quiere que el ' + CARGOS[d.cargo].nombre.toLowerCase() + ' tenga la orden «' + tituloOrden(d.cargo, d.valor) + '»';
  if (d.tipo === 'cargo') return 'Quiere a ' + persona(d.valor).nombre + ' de ' + CARGOS[d.cargo].nombre.toLowerCase();
  if (d.tipo === 'obras') return 'Quiere ver ' + d.n + ' obras terminadas'; return 'Quiere un regalo de ' + d.n + ' de oro';
}
const ganado = (e, id) => e.marcas.ganados.some(g => g.est === e.estacion && g.id === id);

export function crear(semilla = 1) {
  const ordenes = {}; for (const c of ORDEN_CARGOS) ordenes[c] = CARGOS[c].ordenes[1].id; ordenes.edil = 'obras'; // el edil empieza en obras: la ciudad crece desde la primera estación
  const e = { semilla, rng: Math.imul(semilla | 0, 0x9E3779B1) ^ 0x5bd1e995, estacion: 0, oro: 200, pueblo: 50, humor: { ter: 50, mer: 50, mil: 50 }, escanos: { ter: 12, mer: 8, mil: 10 }, ciudad: { nivel: 0, obras: [], gente: 90000, genteIni: 90000 },
    cargos: { cuestor: 'aquilio', edil: 'fabio', pretor: 'postumio', censor: 'marcio', consul: 'apio' }, ordenes, ajuste: 'grande', promesas: [],
    marcas: { progreso: 0, aporte: {}, nombrados: ['aquilio', 'fabio', 'postumio', 'marcio', 'apio'], tratos: [], deseos: {}, ganados: [], regalos: {}, visitas: {}, animo: {}, mitad: {}, propios: 0, sinResolver: 0, desatendidas: 0, faltaOro: false, contra: false, desastres: { arca: 0, tumulto: 0, contra: 0 } },
    hilo: [], despachos: [], consultas: [], sucesos: [], sorteo: { tipos: [], consultas: [], visitas: [] }, cerrado: false };
  rnd(e); rnd(e);
  for (const s of SENADORES) e.marcas.deseos[s.id] = ri(e, 2);
  e.sorteo.tipos = TIPOS_ANIO[ri(e, TIPOS_ANIO.length)].slice(); // al menos una visita de cada tipo
  sortea(e, 0); return e;
}
export function favor(e) { let s = 0, n = 0; for (const b of BS) { s += e.humor[b] * e.escanos[b]; n += e.escanos[b]; } return s / n; }

/* ---------- efectos: una sola fuente para los chips de antes y los cambios de después ---------- */
function lista(o) { const f = []; for (const k of ['oro', 'pueblo', 'ter', 'mer', 'mil', 'obra', 'gente']) if (o[k]) f.push({ que: k, n: o[k] }); return f; }
function aplica(e, efectos) {
  return efectos.map(({ que, n, nota }) => {
    let antes, despues;
    if (que === 'oro') { if (e.oro + n < 0) e.marcas.faltaOro = true; antes = e.oro; e.oro = clamp(e.oro + n, 0, 99999); despues = e.oro; }
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
  else if (id === 'pueblo') { X('mil', 4); X('mer', 4); X('ter', -6); X('pueblo', 1); } // mismo cruce que por el Senado; los terratenientes, saltados, se enfadan un poco más; la plebe lo celebra
  else if (id === 'asamblea-no') { X('pueblo', -3); X('mil', -2); }
  else if (id === 'acatar') { X('ter', 4); X('mil', -6); }
  else if (id === 'nada1') { if (e.marcas.cruza) { X('oro', -20); X('mil', -3); X('pueblo', -2); } else { X('pueblo', -2); X('mer', -2); } } // verano sin rumbo: guerra a medias o tensión sin salida
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
const SESGO = { cruzar: -1.0 }; // el Senado duda antes de meterse en guerra
const TONO = { cruzar: 'guerra', acatar: 'paz', alianza: 'aliados', sitio: 'guerra', tratado: 'paz', flota: 'guerra', permitir: 'aliados', prohibir: 'paz', grandes: 'aliados' };
const PROPONE = { alianza: 'aliarse con Hierón', sitio: 'sitiar Siracusa', tratado: 'renovar el tratado con Cartago', flota: 'armar una flota en secreto', permitir: 'permitir los juegos', prohibir: 'prohibir los juegos', grandes: 'pagar unos juegos grandes' };
const TRATOS = [
  { id: 'ter', bando: 'ter', titulo: 'Sin levas en el campo este año', tipo: 'Promesa', etiqueta: 'Arriesgado', texto: 'Los terratenientes se inclinan mucho a tu favor. Choca con una guerra.', chips: [] },
  { id: 'mer', bando: 'mer', titulo: 'Pagar 60 de oro', tipo: 'Pago', etiqueta: 'Dudoso', texto: 'Los mercaderes se inclinan mucho a tu favor a cambio de oro.', chips: [{ que: 'oro', n: -60 }] },
  { id: 'mil', bando: 'mil', titulo: 'Botín para la tropa', tipo: 'Promesa', etiqueta: 'Dudoso', texto: 'Los militares se inclinan mucho a tu favor con la promesa de un reparto.', chips: [] },
];
export function tratos(e) { return TRATOS.map(t => ({ ...t, chips: t.chips.map(c => ({ ...c })), usado: !!(e && e.marcas.tratos.includes(t.id)), bloqueado: !!(e && e.marcas.contra) })); }

// probabilidad de que vote sí un senador clave (sen) o un senador de a pie del bando (sen = null)
function prob(e, bando, sen, opcion, trat) {
  let s = (SESGO[opcion] ?? -0.8) + POSTURA[opcion][bando] * PESO.postura + (e.humor[bando] - 50) / PESO.humor;
  const con = personaDe(e, 'consul'); if (con.bando === bando && TONO_ORDEN[e.ordenes.consul][0] === TONO[opcion]) s += PESO.consul;
  if (!e.marcas.contra && trat.includes(bando)) s += PESO.trato;
  if (sen) { s += (MANIA[sen.id] && MANIA[sen.id][opcion]) || 0; if (cumplido(e, sen)) s += PESO.desea; if (ganado(e, sen.id)) s += PESO.ganado; }
  return clamp(1 / (1 + Math.exp(-s)), 0.04, 0.95);
}
const clase = p => p >= 0.75 ? 'si' : p <= 0.25 ? 'no' : 'duda';
const clavesDe = b => SENADORES.filter(s => s.bando === b);
const aPie = (e, b) => e.escanos[b] - ARRASTRE * clavesDe(b).length;
export function senadores(e, opcionId, trat = []) {
  const o = opcionId || (() => { const a = e.cerrado || e.estacion > 2 ? null : asunto(e); return a && a.opciones && a.opciones[0] ? a.opciones[0].id : 'cruzar'; })();
  return SENADORES.map(s => {
    const d = deseoDe(e, s), c = clase(prob(e, s.bando, s, o, trat)), pagaRegalo = d.tipo === 'oro' && !cumplido(e, s);
    return { id: s.id, nombre: s.nombre, corto: s.corto, bando: s.bando, arrastra: ARRASTRE, fuente: s.fuente, dictamen: s.dictamen, quiere: { texto: textoDeseo(d), cumplido: cumplido(e, s), tipo: d.tipo, cargo: d.cargo, valor: d.valor, n: d.n }, ganado: ganado(e, s.id), coste: pagaRegalo ? COSTE_REGALO : COSTE_FAVOR, animo: c === 'si' ? 'a favor' : c === 'no' ? 'en contra' : 'dudoso' };
  });
}
export function votos(e, opcionId, trat = []) { // pronóstico: no gasta azar
  if (!POSTURA[opcionId]) throw new Error('opción sin votación: ' + opcionId);
  const r = { hacenFalta: HACEN_FALTA }; let si = 0, duda = 0, no = 0;
  for (const b of BS) {
    const x = { si: 0, duda: 0, no: 0 };
    for (const s of clavesDe(b)) x[clase(prob(e, b, s, opcionId, trat))] += ARRASTRE;
    x[clase(prob(e, b, null, opcionId, trat))] += aPie(e, b);
    r[b] = x; si += x.si; duda += x.duda; no += x.no;
  }
  r.si = si; r.duda = duda; r.no = no; r.sale = si >= HACEN_FALTA; r.puedeSalir = si + duda >= HACEN_FALTA; r.claves = senadores(e, opcionId, trat); return r;
}
function sorteaVoto(e, opcionId, trat) { // el recuento de verdad: cada clave arrastra a los suyos; los de a pie votan uno a uno
  const r = {}; let si = 0, no = 0;
  for (const b of BS) {
    let s = 0;
    for (const k of clavesDe(b)) if (rnd(e) < prob(e, b, k, opcionId, trat)) s += ARRASTRE;
    const p = prob(e, b, null, opcionId, trat), n = aPie(e, b); for (let i = 0; i < n; i++) if (rnd(e) < p) s++;
    r[b] = { si: s, duda: 0, no: e.escanos[b] - s }; si += s; no += e.escanos[b] - s;
  }
  r.si = si; r.duda = 0; r.no = no; r.sale = si >= HACEN_FALTA; r.hacenFalta = HACEN_FALTA; return r;
}
export function asamblea(e) { const p = e.pueblo >= 45 ? 0.92 : clamp(0.92 - (45 - e.pueblo) * 0.03, 0.08, 0.92); return { pueblo: e.pueblo, prob: p, animo: p >= 0.75 ? 'a favor' : p <= 0.35 ? 'en contra' : 'dudoso' }; }
const mk = (e, id, titulo, real) => ({ id, titulo, real, tono: TONO[id], chips: efectosOpcion(e, id).map(c => ({ ...c })) });
export function asunto(e) {
  const p = e.estacion, cruza = !!e.marcas.cruza, base = { id: ['I', 'II', 'III', 'IV'][p], estacion: ESTACIONES[p] };
  if (p === 0) return { ...base, fecha: 'Primavera de 264 a.C. · Mesina pide ayuda', titulo: 'Mesina pide ayuda', texto: 'Los mamertinos, mercenarios que tienen Mesina, piden socorro a Roma. Cartago ya ha metido una guarnición en la ciudad. Al otro lado del Estrecho está Sicilia. En la historia, el Senado debatió mucho y no se decidió: el pueblo, cansado de guerras, votó ir con la promesa del botín y el mando fue para Apio Claudio.', nota: 'Se discute si «los muchos» de Polibio son la asamblea del pueblo o la mayoría del Senado; seguimos la lectura habitual: la asamblea.', fuente: 'Polibio, Historias 1.10–11', dictamen: 'histórico (el Senado no se decidió y votó el pueblo); la lectura de «los muchos» como asamblea es la habitual, no la única', tipo: 'voto', opciones: [mk(e, 'cruzar', 'Cruzar a Sicilia', true)] };
  if (p === 1 && cruza) return { ...base, fecha: 'Verano de 264 a.C. · Hierón de Siracusa', titulo: 'Hierón de Siracusa', texto: 'Tus legiones han roto el cerco de Mesina. Hierón, rey de Siracusa, se retira a su ciudad y ofrece paz, grano y cien talentos.', fuente: 'Polibio 1.11–12 y 1.16; Diodoro 23.4', dictamen: 'licencia de juego: la paz con Hierón fue en 263; aquí va en el mismo año', tipo: 'opciones', opciones: [mk(e, 'alianza', 'Aliarte con Hierón', true), mk(e, 'sitio', 'Sitiar Siracusa', false)] };
  if (p === 1) return { ...base, fecha: 'Verano de 264 a.C. · Cartago en el Estrecho', titulo: 'Cartago en el Estrecho', texto: 'Cartago se queda Mesina. Sus naves vigilan el paso frente a Regio. Sus enviados recuerdan los viejos tratados.', fuente: 'Polibio 3.22–26 (tratados entre Roma y Cartago)', dictamen: 'licencia de juego: historia que no ocurrió; los tratados sí existieron', tipo: 'opciones', opciones: [mk(e, 'tratado', 'Renovar el tratado con Cartago', false), mk(e, 'flota', 'Armar una flota en secreto', false)] };
  if (p === 2) { const g = mk(e, 'grandes', 'Pagarlo tú y hacerlo grande', false); if (e.oro < 60) { g.apagada = true; g.aviso = 'falta oro'; }
    return { ...base, fecha: 'Otoño de 264 a.C. · Sangre en el Foro Boario', titulo: 'Sangre en el Foro Boario', texto: 'Los hijos de Junio Bruto Pera quieren honrar a su padre muerto con algo nunca visto en Roma: tres parejas de hombres luchando a espada.', fuente: 'Livio, Períoca 16; Valerio Máximo 2.4.7', dictamen: 'histórico (fueron los primeros gladiadores de Roma); que tú lo permitas o no es licencia de juego', tipo: 'opciones', opciones: [mk(e, 'permitir', 'Permitirlo', true), mk(e, 'prohibir', 'Prohibirlo', false), g] }; }
  return { ...base, fecha: 'Invierno de 264 a.C. · Cierre del año', titulo: 'El hilo de la historia', texto: 'El año se acaba. Mira dónde coincidiste con la historia y dónde te apartaste.', fuente: 'Polibio, Historias 1.10–12 y 1.20; Livio, Períoca 16', dictamen: 'mezcla: los hechos son históricos; el rumbo que sigue es conjetura y licencia de juego', tipo: 'cierre' };
}
const DICHAS = { alianza: 'Aliarte con Hierón: grano, oro y paz en Sicilia.', sitio: 'Pones sitio a Siracusa.', tratado: 'Renuevas el tratado con Cartago.', flota: 'Mandas armar naves en secreto.', permitir: 'Los gladiadores luchan en el Foro Boario.', prohibir: 'Prohíbes el espectáculo.', grandes: 'Pagas unos juegos nunca vistos.' };
function resolverGrande(e, id, propio) { // aplica la opción que ha salido (verano y otoño)
  const cambios = aplica(e, efectosOpcion(e, id)); e.marcas['hecho' + e.estacion] = true; if (propio) e.marcas.propios++;
  if (e.estacion === 1) e.marcas[e.marcas.cruza ? 'hieron' : 'estrecho'] = id; else e.marcas.juegos = id === 'permitir' ? true : id === 'prohibir' ? false : 'grandes';
  e.hilo.push(e.estacion + ':' + id); const fr = notas(e, cambios);
  return { cambios, linea: [DICHAS[id], ...fr].join(' ') + (fr.length ? '.' : '') };
}
function sinResolver(e) { // ni tu propuesta ni la del rival salen
  const verano = e.estacion === 1, cambios = aplica(e, verano ? efectosOpcion(e, 'nada1') : []);
  e.marcas['hecho' + e.estacion] = true; e.marcas.sinResolver++;
  if (verano) e.marcas[e.marcas.cruza ? 'hieron' : 'estrecho'] = 'nada'; else e.marcas.juegos = 'privado';
  e.hilo.push(e.estacion + ':nada');
  return { cambios, linea: verano ? (e.marcas.cruza ? 'Nadie reúne los votos: la guerra sigue sin rumbo y la tensión crece.' : 'Nadie reúne los votos: el Estrecho sigue en vilo y nadie hace nada.') : 'Nadie reúne los votos: los Junios dan el combate por su cuenta en el Foro Boario, como un funeral privado. Ni mérito ni culpa para ti.' };
}
function rivalDe(e, as, opcionId) { // el jefe del bando más contrario propone la alternativa que más le gusta
  const post = POSTURA[opcionId]; let b = 'ter', m = 99;
  for (const x of BS) { const v = post[x] + (e.humor[x] - 50) / 40; if (v < m) { m = v; b = x; } }
  let alt = null, mm = -99; for (const o of as.opciones) if (o.id !== opcionId && !o.apagada && POSTURA[o.id][b] > mm) { mm = POSTURA[o.id][b]; alt = o.id; }
  return { sen: clavesDe(b)[0], alt };
}
function pagaTratos(e, sel) {
  for (const t of sel) { if (!BS.includes(t)) throw new Error('trato inválido: ' + t); if (e.marcas.tratos.includes(t)) throw new Error('trato ya usado este año: ' + t); }
  if (sel.length && e.marcas.contra) throw new Error('el Senado no te escucha: los tratos no valen');
  if (sel.includes('mer') && e.oro < 60) throw new Error('falta oro para el trato');
  const cambios = []; for (const t of sel) { e.marcas.tratos.push(t); if (t === 'ter') e.promesas.push('levas'); if (t === 'mil') e.promesas.push('botin'); }
  if (sel.includes('mer')) cambios.push(...aplica(e, [{ que: 'oro', n: -60 }])); return cambios;
}
export function ganarse(e, id) {
  const s = SENADORES.find(x => x.id === id); if (!s) throw new Error('senador inválido: ' + id);
  if (e.cerrado || e.estacion > 2) throw new Error('no hay votación'); if (ganado(e, id)) throw new Error('ya lo has ganado esta estación');
  const regalo = deseoDe(e, s).tipo === 'oro' && !cumplido(e, s), coste = regalo ? COSTE_REGALO : COSTE_FAVOR; if (e.oro < coste) throw new Error('falta oro');
  const cambios = aplica(e, [{ que: 'oro', n: -coste }]); e.marcas.ganados.push({ est: e.estacion, id }); if (regalo) e.marcas.regalos[id] = true;
  return { cambios, linea: 'Haces un favor a ' + s.nombre + (regalo ? ' (el regalo que quería)' : '') + ': esta estación votará mejor contigo.' };
}
export function votar(e, opcionId, trat = []) {
  if (e.cerrado || e.estacion > 2) throw new Error('no hay votación'); if (e.marcas['hecho' + e.estacion] || e.marcas.pendiente) throw new Error('el voto ya está resuelto');
  const as = asunto(e), op = as.opciones.find(o => o.id === opcionId); if (!op) throw new Error('opción inválida: ' + opcionId); if (op.apagada) throw new Error('opción apagada: ' + opcionId);
  const sel = [...new Set(trat)], cambios = pagaTratos(e, sel), v = sorteaVoto(e, opcionId, sel); e.marcas['votos' + e.estacion] = v;
  if (e.estacion === 0) {
    if (!v.sale) { e.marcas.pendiente = true; return { sale: false, salio: null, votos: v, cambios, linea: 'Tu propuesta cae (' + v.si + ' de ' + HACEN_FALTA + '): el Senado no se decide.' }; }
    e.marcas.cruza = true; e.marcas.via = 'senado'; e.marcas.hecho0 = true; e.marcas.propios++; cambios.push(...aplica(e, efectosOpcion(e, 'senado'))); e.hilo.push('I:senado');
    return { sale: true, salio: 'cruzar', votos: v, cambios, linea: 'El Senado vota ' + v.si + ' a favor: Roma cruza a Sicilia.' };
  }
  if (v.sale) { const r = resolverGrande(e, opcionId, true); cambios.push(...r.cambios); return { sale: true, salio: opcionId, votos: v, cambios, linea: 'El Senado vota ' + v.si + ' a favor. ' + r.linea }; }
  const rv = rivalDe(e, as, opcionId), vr = sorteaVoto(e, rv.alt, []), caida = 'Tu propuesta cae (' + v.si + ' de ' + HACEN_FALTA + '). ' + rv.sen.corto + ' propone ' + PROPONE[rv.alt] + ': ';
  const rival = { senador: rv.sen.nombre, opcion: rv.alt, votos: vr, sale: vr.sale };
  if (vr.sale) { const r = resolverGrande(e, rv.alt, false); cambios.push(...r.cambios); return { sale: false, salio: rv.alt, votos: v, cambios, linea: caida + 'sale con ' + vr.si + '. ' + r.linea, rival }; }
  const r = sinResolver(e); cambios.push(...r.cambios);
  return { sale: false, salio: null, votos: v, cambios, linea: caida + 'tampoco sale (' + vr.si + ' de ' + HACEN_FALTA + '). ' + r.linea, rival };
}
export function elegir(e, id) {
  if (e.estacion !== 0 || !e.marcas.pendiente) throw new Error('no hay segunda decisión');
  if (id !== 'pueblo' && id !== 'acatar') throw new Error('opción inválida: ' + id);
  delete e.marcas.pendiente; e.marcas.hecho0 = true;
  if (id === 'acatar') { const cambios = aplica(e, efectosOpcion(e, 'acatar')); e.marcas.cruza = false; e.marcas.via = 'no'; e.hilo.push('I:no'); return { sale: false, cambios, linea: 'Acatas al Senado: Roma no cruza.' }; }
  if (rnd(e) < asamblea(e).prob) { const cambios = aplica(e, efectosOpcion(e, 'pueblo')); e.marcas.cruza = true; e.marcas.via = 'pueblo'; e.marcas.propios++; e.hilo.push('I:pueblo'); return { sale: true, cambios, linea: 'La asamblea del pueblo vota ir: Roma cruza a Sicilia. Los senadores saltados lo llevan mal.' }; }
  const cambios = aplica(e, efectosOpcion(e, 'asamblea-no')); e.marcas.cruza = false; e.marcas.via = 'no'; e.marcas.asamblea = 'cae'; e.hilo.push('I:no');
  return { sale: false, cambios, linea: 'La asamblea, harta de guerras, no vota ir: Roma no cruza y tu autoridad sale tocada.' };
}

/* ---------- asuntos menores: un mazo de 14, salen 2 por estación ---------- */
const CS = (id, cargo, titulo, texto, fuente, a, b, elige, cond) => ({ id, cargo, titulo, texto, fuente, dictamen: DIC_ASUNTO, cond, opciones: [{ id: 'a', titulo: a[0], ef: a[1], interes: !!a[2] }, { id: 'b', titulo: b[0], ef: b[1], interes: !!b[2] }], elige });
export const CONSULTAS = [
  CS('grano', 'edil', 'Sube el precio del grano', 'Mala siega: los vendedores del Foro Boario piden más por el trigo.', 'Asunto típico de la annona romana', ['Fijar el precio', { pueblo: 4, ter: -3 }], ['Dejar que suba', { pueblo: -4, ter: 3, mer: 1 }, 1], { obras: 'b', grano: 'a', juegos: 'a' }),
  CS('contrata', 'cuestor', 'Un publicano pide la contrata de la calzada', 'Un publicano ofrece adelantar el dinero a cambio de la contrata.', 'Polibio 6.17 (contratas públicas)', ['Sacarla a subasta', { oro: -10, pueblo: 1, mer: -2, obra: 20 }], ['Dársela al publicano', { oro: 15, mer: 4, pueblo: -2 }, 1], { ahorra: 'b', justo: 'a', gasta: 'a' }),
  CS('pleito', 'pretor', 'Pleito de un aliado latino contra un senador', 'Un latino aliado reclama tierras que un senador le ha quitado.', 'Asunto típico de la época', ['Dar la razón al aliado', { mer: 2, pueblo: 2, ter: -3 }], ['Dar la razón al senador', { ter: 3, pueblo: -3, mer: -2 }, 1], { dura: 'b', igual: 'a', aliados: 'a' }),
  CS('remeros', 'consul', 'Faltan remeros para cruzar el Estrecho', 'Las naves de los aliados no bastan para pasar las legiones.', 'Polibio 1.11 (el paso del Estrecho)', ['Pedir remeros a los aliados de la costa', { oro: -10, mil: 1, pueblo: 1 }], ['Reclutar a la fuerza entre la plebe', { pueblo: -5, mil: 3 }, 1], { prudente: 'a', refuerza: 'a', ataque: 'b' }, e => !!e.marcas.cruza),
  CS('caballero', 'censor', 'Un caballero rico pide entrar en el Senado', 'Un caballero enriquecido con el comercio quiere un asiento en la Curia.', 'Asunto típico de la época', ['Admitirlo', { oro: 10, mer: 4, ter: -3 }, 1], ['Rechazarlo', { ter: 3, mer: -3, pueblo: 1 }], { estricto: 'b', antiguas: 'b', abre: 'a' }),
  CS('cloaca', 'edil', 'Reparar la Cloaca o adoquinar el Clivo', 'Hay dinero para una sola obra: la Cloaca Máxima que se hunde o el Clivo Capitolino.', 'Livio 1.56 (la Cloaca Máxima)', ['Reparar la Cloaca', { oro: -12, pueblo: 2, obra: 40, gente: 300 }], ['Adoquinar el Clivo', { oro: -12, pueblo: 3, mer: 2, obra: 25 }, 1], { obras: 'a', grano: 'a', juegos: 'b' }),
  CS('plata', 'cuestor', 'El taller de moneda pide metal', 'Roma empieza a acuñar plata y el taller pide metal y obreros.', 'Asunto típico de la época', ['Acuñar plata ya', { oro: -12, pueblo: 2, mer: 3 }], ['Seguir con el bronce pesado', { oro: 6, mer: -2, pueblo: -1 }, 1], { ahorra: 'b', justo: 'b', gasta: 'a' }),
  CS('paga', 'cuestor', 'La paga de los obreros se retrasa', 'Los obreros del Tíber llevan un mes sin cobrar y murmuran.', 'Asunto típico de la época', ['Pagar ya con el arca', { oro: -12, pueblo: 3 }], ['Pagar cuando entren los impuestos', { oro: 4, pueblo: -4 }, 1], { ahorra: 'b', justo: 'a', gasta: 'a' }),
  CS('deudas', 'pretor', 'Los deudores piden amparo', 'Unos plebeyos endeudados piden que no los aten por sus deudas.', 'Livio 8.28 (la ley Poetelia Papiria, 326: se prohíbe encadenar al deudor)', ['Proteger al deudor', { pueblo: 4, ter: -2, mer: -2 }], ['Hacer cumplir la deuda', { oro: 6, ter: 2, mer: 2, pueblo: -4 }, 1], { dura: 'b', igual: 'a', aliados: 'a' }),
  CS('latinos', 'pretor', 'Una ciudad aliada pide la ciudadanía', 'Los notables de una ciudad latina piden derechos de ciudadano romano.', 'Asunto típico de la época', ['Dársela', { mer: 2, mil: 2, ter: -3, pueblo: -1 }], ['Negarla', { ter: 2, mer: -2, mil: -1, pueblo: 1 }, 1], { dura: 'b', igual: 'b', aliados: 'a' }),
  CS('colonia', 'consul', 'Colonos para una nueva colonia latina', 'Hay tierras conquistadas y cientos de familias sin campo que quieren partir.', 'Asunto típico de la época', ['Fundar la colonia', { oro: -12, ter: 3, mil: 2, pueblo: 3 }], ['Aplazarla un año', { oro: 4, ter: -2, pueblo: -2 }, 1], { prudente: 'b', refuerza: 'a', ataque: 'a' }),
  CS('prodigio', 'consul', 'Un rayo cae sobre un templo', 'La gente teme un mal presagio y los sacerdotes piden expiaciones.', 'Asunto típico de la época (los prodigios se anotaban cada año)', ['Hacer expiaciones solemnes', { oro: -8, pueblo: 3, ter: 2 }], ['Quitarle importancia', { oro: 2, pueblo: -3, ter: -2 }, 1], { prudente: 'a', refuerza: 'a', ataque: 'b' }),
  CS('censo', 'censor', 'Bienes sin declarar en el censo', 'Varios ricos han declarado menos de lo que tienen.', 'Asunto típico de la época', ['Multar a los que ocultan', { oro: 10, pueblo: 1, mer: -3, ter: 1 }], ['Cerrar los ojos', { mer: 3, oro: -2, pueblo: -1 }, 1], { estricto: 'a', antiguas: 'b', abre: 'b' }),
  CS('calzada', 'edil', 'Prolongar la calzada o reparar la vieja', 'El dinero no da para las dos cosas: alargar el camino hacia el sur o arreglar los baches.', 'Livio 9.29 (la Vía Apia, de 312)', ['Prolongar la calzada', { oro: -14, obra: 35, mil: 2, mer: 2 }], ['Reparar lo que hay', { oro: -6, obra: 15, pueblo: 1 }, 1], { obras: 'a', grano: 'b', juegos: 'b' }),
];
const chipsC = o => lista(o.ef);
const consultaDe = id => CONSULTAS.find(c => c.id === id);
const consultasEst = e => (e.sorteo.consultas[e.estacion] || []).map(consultaDe);
export function consultas(e) {
  if (e.cerrado || e.estacion > 2) return [];
  return consultasEst(e).map(c => {
    const d = e.consultas.find(x => x.id === c.id);
    return { id: c.id, cargo: c.cargo, persona: personaDe(e, c.cargo).nombre, titulo: c.titulo, texto: c.texto, fuente: c.fuente, dictamen: c.dictamen, opciones: c.opciones.map(o => ({ id: o.id, titulo: o.titulo, chips: chipsC(o) })), decidida: d ? d.opcion : null, laDecideElMagistrado: e.ajuste !== 'todo' || noPidePermiso(e, c.cargo) };
  });
}
export function decidir(e, consultaId, opcionId) {
  const c = consultaDe(consultaId); if (!c || e.cerrado || !(e.sorteo.consultas[e.estacion] || []).includes(consultaId)) throw new Error('consulta inválida: ' + consultaId);
  if (e.ajuste !== 'todo' || noPidePermiso(e, c.cargo)) throw new Error('esta consulta la decide el magistrado'); if (e.consultas.some(x => x.id === c.id)) throw new Error('consulta ya decidida');
  const o = c.opciones.find(x => x.id === opcionId); if (!o) throw new Error('opción inválida: ' + opcionId);
  e.consultas.push({ id: c.id, estacion: e.estacion, opcion: o.id, por: 'jugador' });
  return { cambios: aplica(e, chipsC(o)), linea: 'Decides: ' + o.titulo + '.' };
}

/* ---------- visitas de magistrados: piden o chocan ---------- */
const VP = (id, cargo, titulo, texto, a, b) => ({ id, tipo: 'pide', cargo, titulo, texto, fuente: 'Asunto típico de la época', dictamen: DIC_ASUNTO, ops: [{ id: 'conceder', titulo: a[0], ef: a[1] }, { id: 'negar', titulo: b[0], ef: b[1] }] });
const VC = (id, cargo, cargoB, titulo, texto, a, b) => ({ id, tipo: 'choque', cargo, cargoB, titulo, texto, fuente: 'Asunto típico de la época', dictamen: DIC_ASUNTO, ops: [{ id: 'a', titulo: a[0], ef: a[1] }, { id: 'b', titulo: b[0], ef: b[1] }] });
export const VISITAS = [
  VP('p-obra', 'edil', 'El edil pide oro para acabar la obra', 'El andamio está a medias y los obreros esperan: pide oro para rematarla.', ['Darle el oro', { oro: -25, obra: 45, mer: 1 }], ['Que espere', { pueblo: -1 }]),
  VP('p-leva', 'consul', 'El cónsul pide una leva', 'Dice que con más hombres la campaña será más corta.', ['Concederla', { mil: 3, oro: -8, pueblo: -3 }], ['Negarla', { mil: -2 }]),
  VP('p-tributo', 'cuestor', 'El cuestor pide subir un tributo', 'El arca está floja y propone cobrar más a los que comercian y a los campesinos.', ['Subirlo', { oro: 25, pueblo: -3, mer: -2 }], ['Dejarlo como está', { pueblo: 1 }]),
  VP('p-expulsar', 'censor', 'El censor pide expulsar a un senador', 'Un senador vive sin decoro y el censor quiere borrarlo de la lista.', ['Dejarle expulsarlo', { ter: -3, pueblo: 3, oro: -4 }], ['Pedirle prudencia', { ter: 1 }]),
  VP('p-proceso', 'pretor', 'El pretor pide un proceso ejemplar', 'Quiere juzgar a un usurero que arruina familias y dar un escarmiento.', ['Apoyar el proceso', { pueblo: 3, mer: -2, oro: -6 }], ['Que no haga ruido', { mer: 1 }]),
  VP('p-graneros', 'edil', 'El edil pide abrir los graneros', 'La plebe pasa hambre y quiere repartir grano de las reservas.', ['Abrirlos', { oro: -12, pueblo: 4 }], ['Guardar las reservas', { pueblo: -1 }]),
  VC('c-ahorro', 'cuestor', 'edil', 'El cuestor ahorra y el edil gasta', 'El cuestor cierra el arca; el edil dice que así no se levanta nada.', ['Dar la razón al cuestor', { oro: 15, pueblo: -1 }], ['Dar la razón al edil', { oro: -18, pueblo: 2, obra: 40 }]),
  VC('c-leva', 'consul', 'pretor', 'El cónsul quiere hombres y el pretor, orden', 'El cónsul pide levas; el pretor dice que los tribunales se quedan sin gente.', ['Dar la razón al cónsul', { mil: 3, pueblo: -2, oro: -6 }], ['Dar la razón al pretor', { pueblo: 2, mer: 1, mil: -2 }]),
  VC('c-censo', 'censor', 'cuestor', 'El censor aprieta y el cuestor teme perder tributos', 'Un censo estricto asusta a los ricos, y los ricos pagan.', ['Dar la razón al censor', { ter: 2, mer: -2, oro: -4 }], ['Dar la razón al cuestor', { oro: 8, mer: 2, ter: -2 }]),
  VC('c-fiesta', 'edil', 'consul', 'El edil quiere fiestas y el cónsul, remos', 'Hay oro para una cosa: espectáculos para la plebe o armas para la tropa.', ['Dar la razón al edil', { oro: -12, pueblo: 5 }], ['Dar la razón al cónsul', { oro: -12, mil: 3, ter: -1 }]),
  VC('c-juicio', 'pretor', 'censor', 'El pretor y el censor discuten a quién toca juzgar a un caballero', 'Los dos reclaman el caso y la gente murmura.', ['Dar la razón al pretor', { mer: -2, pueblo: 2 }], ['Dar la razón al censor', { ter: 2, pueblo: -1 }]),
];
const TIPOS_ANIO = [['pide', 'pide', 'choque'], ['pide', 'choque', 'pide'], ['choque', 'pide', 'pide'], ['choque', 'choque', 'pide'], ['choque', 'pide', 'choque'], ['pide', 'choque', 'choque']];
export function visita(e) {
  if (e.cerrado || e.estacion > 2) return null; const id = e.sorteo.visitas[e.estacion], v = VISITAS.find(x => x.id === id); if (!v) return null;
  const reg = e.marcas.visitas[e.estacion], nom = c => personaDe(e, c).nombre;
  const r = { id: v.id, tipo: v.tipo, cargo: v.cargo, persona: nom(v.cargo), titulo: v.titulo, texto: v.texto, fuente: v.fuente, dictamen: v.dictamen, opciones: v.ops.map(o => ({ id: o.id, titulo: o.titulo, chips: lista(o.ef) })), atendida: !!(reg && reg.atendida) };
  if (v.tipo === 'choque') { r.cargoB = v.cargoB; r.personaB = nom(v.cargoB); } return r;
}
export function atender(e, opcionId) {
  const v = visita(e); if (!v) throw new Error('no hay visita'); if (v.atendida) throw new Error('la visita ya está atendida');
  const def = VISITAS.find(x => x.id === v.id), o = def.ops.find(x => x.id === opcionId); if (!o) throw new Error('opción inválida: ' + opcionId);
  const cambios = aplica(e, lista(o.ef)), est = e.estacion, an = (c, estado) => { e.marcas.animo[c] = { estado, hasta: est + 1 }; };
  e.marcas.visitas[est] = { id: v.id, opcion: opcionId, atendida: true }; let linea;
  if (v.tipo === 'pide') { an(v.cargo, opcionId === 'conceder' ? 'leal' : 'resentido'); linea = opcionId === 'conceder' ? 'Concedes lo que pide ' + v.persona + ': queda leal.' : 'Niegas a ' + v.persona + ' lo que pedía: queda resentido.'; }
  else { const gana = opcionId === 'a' ? v.cargo : v.cargoB, pierde = opcionId === 'a' ? v.cargoB : v.cargo; an(gana, 'leal'); an(pierde, 'resentido'); e.marcas.mitad[pierde] = est; linea = 'Das la razón a ' + personaDe(e, gana).nombre + '. ' + personaDe(e, pierde).nombre + ' queda resentido y trabajará a medias.'; }
  return { cambios, linea };
}
function sortea(e, est) { // lo que traerá la estación: dos asuntos pequeños y una visita
  const usadas = e.sorteo.consultas.flat(); let pool = CONSULTAS.filter(c => !usadas.includes(c.id) && (!c.cond || c.cond(e)));
  const a = pool[ri(e, pool.length)]; pool = pool.filter(c => c.cargo !== a.cargo); const b = pool[ri(e, pool.length)]; e.sorteo.consultas[est] = [a.id, b.id];
  const vp = VISITAS.filter(v => v.tipo === e.sorteo.tipos[est] && !e.sorteo.visitas.includes(v.id)); e.sorteo.visitas[est] = vp[ri(e, vp.length)].id;
}
export function puedeCerrar(e) {
  const falta = []; if (e.cerrado) return { ok: false, falta: ['el año ya acabó'] };
  if (e.estacion <= 2 && e.ajuste !== 'nada' && !e.marcas['hecho' + e.estacion]) falta.push(e.marcas.pendiente ? 'decidir qué hacer si el Senado no vota' : 'votar el asunto grande');
  if (e.ajuste === 'todo') for (const c of consultas(e)) if (c.decidida === null && !c.laDecideElMagistrado) falta.push('decidir: ' + c.titulo);
  return { ok: falta.length === 0, falta };
}

/* ---------- el trabajo de los magistrados ---------- */
function llevaElConsul(e) { // ajuste «nada» (o voto no hecho): el cónsul lleva al Senado lo que encaja con su orden, sin ganarse a nadie
  const as = asunto(e), pref = TONO_ORDEN[e.ordenes.consul]; let id = null, titulo;
  if (e.estacion === 0) { for (const t of pref) { if (t === 'guerra') { id = 'cruzar'; break; } if (t === 'paz') { id = 'acatar'; break; } } if (!id) id = 'acatar'; titulo = id === 'acatar' ? 'no cruzar' : as.opciones[0].titulo; }
  else { const ops = as.opciones.filter(o => !o.apagada); for (const t of pref) { const o = ops.find(x => x.tono === t); if (o) { id = o.id; break; } } if (!id) id = ops[0].id; titulo = ops.find(o => o.id === id).titulo; }
  let r;
  if (e.estacion === 0) { if (id === 'cruzar') { r = votar(e, 'cruzar', []); if (!r.sale) r = { ...r, ...elegir(e, 'acatar') }; } else { e.marcas.pendiente = true; r = elegir(e, 'acatar'); } }
  else r = votar(e, id, []);
  return { id, titulo, linea: r.linea };
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
const FALLOS = {
  cuestor: 'Se me han cruzado las cuentas: el arca no ha rendido lo que esperabas, y los gastos siguen.', edil: 'Los andamios se han parado y no hemos avanzado en la obra; los obreros cobran igual.',
  pretor: 'Los pleitos se me han enredado y no he resuelto nada que te sirva.', censor: 'El censo se me ha atascado y no he sacado nada en limpio.', consul: 'Las legiones han tropezado y no he logrado lo que te prometí.',
};
function trabaja(e, cargo) {
  const p = personaDe(e, cargo), o = ORD[cargo][e.ordenes[cargo]], r = RASGOS[p.id], h = 0.7 + 0.15 * p.habil, ef = {};
  for (const k of ['oro', 'pueblo', 'ter', 'mer', 'mil']) { const v = Math.round((o[k] || 0) * h) + (r.b[k] || 0) + (r.m[k] || 0); if (v) ef[k] = v; }
  ef.obra = Math.round((o.obra || 0) * (0.8 + 0.2 * p.habil) * (r.b.obraMult || 1)); ef.gente = o.gente || 0; return ef;
}
function suceso(e, est, id, titulo, texto, cambios) { // la misma crisis que sigue de una estación a otra se apunta, pero cuenta como un solo desastre
  const continua = e.sucesos.some(x => x.id === id && x.estacion === est - 1), s = { estacion: est, id, titulo, texto, cambios: cambios.filter(c => c.n !== 0) }; if (continua) s.continua = true; e.sucesos.push(s); e.marcas.desastres[id]++; return s; }
export function cerrarEstacion(e) {
  if (e.cerrado) throw new Error('el año ya acabó');
  if (e.ajuste === 'nada' && e.estacion <= 2 && !e.marcas['hecho' + e.estacion]) { e.marcas.llevo = llevaElConsul(e); e.marcas.llevo.est = e.estacion; }
  const pc = puedeCerrar(e); if (!pc.ok) throw new Error('falta: ' + pc.falta.join('; '));
  const est = e.estacion, m = e.marcas, prog0 = m.progreso, sucesos = [], animoDe = c => { const a = m.animo[c]; return a && a.hasta >= est ? a.estado : null; };
  const cs = est <= 2 ? consultasEst(e) : [], decide = {};
  if (est <= 2) { const v = visita(e); if (v && !v.atendida) { // si no atiendes, pasa lo peor
    m.desatendidas++; if (v.tipo === 'pide') { m.animo[v.cargo] = { estado: 'resentido', hasta: est + 1 }; aplica(e, [{ que: 'pueblo', n: -1 }, { que: 'oro', n: -5 }]); } else { m.mitad[v.cargo] = est; m.mitad[v.cargoB] = est; } m.visitas[est] = { id: v.id, atendida: false }; } }
  for (const c of cs) { if (!e.consultas.some(x => x.id === c.id)) { const { o, torcida } = eligeMagistrado(e, c); e.consultas.push({ id: c.id, estacion: est, opcion: o.id, por: 'magistrado', torcida }); decide[c.cargo] = { c, o, torcida }; } }
  const fijos = aplica(e, [{ que: 'oro', n: -(GASTO + (m.cruza ? GASTO_GUERRA : 0)) }, { que: 'pueblo', n: -PLEBE }]);
  const res = {};
  for (const cargo of ORDEN_CARGOS) {
    const p = personaDe(e, cargo), an = animoDe(cargo), falla = rnd(e) < FALLO[p.habil] + (an === 'resentido' ? 0.15 : an === 'leal' ? -0.08 : 0), medias = m.mitad[cargo] === est;
    const tr = trabaja(e, cargo); let dec = decide[cargo] || null, chips = dec ? chipsC(dec.o).map(c => ({ ...c })) : [];
    if (medias) { for (const k in tr) tr[k] = Math.round(tr[k] / 2); chips.forEach(c => { c.n = Math.round(c.n / 2); }); }
    if (falla) { for (const k in tr) if (tr[k] > 0) tr[k] = 0; chips = chips.filter(c => c.n <= 0); }
    const negado = m.contra && (tr.oro > 0 || chips.some(c => c.que === 'oro' && c.n > 0)); if (negado) { if (tr.oro > 0) tr.oro = 0; chips = chips.filter(c => !(c.que === 'oro' && c.n > 0)); }
    if (tr.oro < 0 && e.oro + tr.oro < 0) { tr.oro = 0; tr.obra = 0; m.faltaOro = true; } // no hay con qué pagar: ni se gasta ni se hace la obra
    const cambios = aplica(e, lista(tr).filter(x => x.que !== 'obra' && x.que !== 'gente'));
    if (tr.obra) cambios.push(...aplica(e, [{ que: 'obra', n: tr.obra }])); if (tr.gente) cambios.push(...aplica(e, [{ que: 'gente', n: tr.gente }]));
    if (chips.length) cambios.push(...aplica(e, chips));
    res[cargo] = { cambios, dec, falla, medias, negado };
  }
  if (e.oro === 0 || m.faltaOro) { m.progreso = prog0; sucesos.push(suceso(e, est, 'arca', 'Arca vacía', 'No hay con qué pagar: la tropa y los obreros no cobran, los militares y la plebe murmuran y la obra se para esta estación.', aplica(e, [{ que: 'mil', n: -4 }, { que: 'pueblo', n: -4 }]))); }
  m.faltaOro = false;
  if (e.pueblo < 25) { m.progreso = 0; sucesos.push(suceso(e, est, 'tumulto', 'Pueblo harto: tumulto', 'La plebe se echa a la calle y amenaza con irse de la ciudad, como en la secesión al Janículo de 287 (Livio, Períoca 11). Se pierde la obra en curso, oro y favor.', aplica(e, [{ que: 'oro', n: -20 }, { que: 'ter', n: -3 }, { que: 'mer', n: -3 }, { que: 'mil', n: -3 }, { que: 'pueblo', n: 3 }]))); }
  m.contra = false; if (favor(e) < 35) { m.contra = true; sucesos.push(suceso(e, est, 'contra', 'Senado en contra', 'El Senado te niega fondos la próxima estación y tus tratos no valen.', [])); }
  let nuevas = 0; while (m.progreso >= 100 && nuevas < 2 && e.ciudad.obras.length < OBRAS.length) { const ob = OBRAS[e.ciudad.obras.length]; e.ciudad.obras.push({ id: ob.id, nombre: ob.nombre, estacion: est }); m.progreso -= 100; nuevas++; }
  e.ciudad.nivel = e.ciudad.obras.length; if (nuevas) aplica(e, [{ que: 'gente', n: 400 * nuevas }]); aplica(e, [{ que: 'gente', n: 150 }]);
  const partes = [];
  for (const cargo of ORDEN_CARGOS) {
    const p = personaDe(e, cargo), { cambios, dec, falla, medias, negado } = res[cargo], co = CARGOS[cargo].ordenes.find(o => o.id === e.ordenes[cargo]);
    let t = falla ? FALLOS[cargo] : PARTES[cargo][co.id];
    if (cargo === 'edil' && nuevas) t += ' Hemos terminado: ' + e.ciudad.obras.slice(-nuevas).map(o => o.nombre.toLowerCase()).join(' y ') + '.';
    if (cargo === 'consul' && m.llevo && m.llevo.est === est) t += ' Sin que me lo pidieras, llevé al Senado: «' + m.llevo.titulo + '».';
    if (dec) t += dec.torcida ? ' Sobre «' + dec.c.titulo + '» decidí a mi conveniencia: ' + dec.o.titulo.toLowerCase() + '.' : ' Sobre «' + dec.c.titulo + '» decidí: ' + dec.o.titulo.toLowerCase() + '.';
    if (medias) t += ' Trabajé a medias: estoy disgustado.'; if (negado) t += ' El Senado me ha negado los fondos.';
    if (!falla) t += est % 2 === 0 ? ' ' + p.bueno.titulo + ': ' + p.bueno.texto : ' ' + p.malo.titulo + ': ' + p.malo.texto;
    const ap = cambios.reduce((s, c) => s + (c.que === 'oro' ? c.n / 10 : c.que === 'pueblo' ? c.n : ['ter', 'mer', 'mil'].includes(c.que) ? c.n / 2 : 0), 0) + (cargo === 'edil' ? nuevas * 3 : 0);
    m.aporte[cargo] = (m.aporte[cargo] || 0) + ap;
    const parte = { estacion: est, cargo, persona: p.id, orden: co.id, texto: t, cambios: cambios.filter(c => c.n !== 0 && c.que !== 'obra') }; if (falla) parte.fallo = true; if (dec) parte.decidio = { consulta: dec.c.id, opcion: dec.o.id };
    e.despachos.push(parte); partes.push(parte);
  }
  partes.fijos = fijos.filter(c => c.n !== 0); partes.sucesos = sucesos;
  if (est === 3) e.cerrado = true; else { e.estacion++; if (e.estacion <= 2) sortea(e, e.estacion); }
  return partes;
}

/* ---------- cierre y veredicto ---------- */
const RUMBOS = {
  'cruza-alianza': { id: 'mar', titulo: 'Roma mira al mar', frase: 'Con el grano de Siracusa a tu espalda, la guerra con Cartago será larga y se decidirá en el agua.', viene: '260 a.C.: Roma construye su primera flota (Polibio 1.20).', real: true },
  'cruza-sitio': { id: 'martillo', titulo: 'Roma, martillo de Sicilia', frase: 'Los griegos de la isla te temen más que a Cartago. Tendrás dos enemigos y ningún granero.', viene: 'Siracusa llama a Cartago.', real: false },
  'cruza-nada': { id: 'sinrumbo', titulo: 'Guerra sin rumbo', frase: 'Tus legiones están en Sicilia y nadie en Roma sabe para qué. Los soldados cuentan los días.', viene: 'Cartago aprovechará la duda.', real: false },
  'no-tratado': { id: 'tierra', titulo: 'Roma, potencia de tierra', frase: 'Cartago manda en el mar y tú en Italia. Hay paz y comercio; el Estrecho no es tuyo.', viene: 'Roma mira al norte, hacia los galos.', real: false },
  'no-flota': { id: 'aplazada', titulo: 'Guerra aplazada', frase: 'Nadie ha roto la paz todavía, pero los dos contáis barcos.', viene: 'Cuando llegue la guerra, Roma ya tendrá naves.', real: false },
  'no-nada': { id: 'dudosa', titulo: 'Paz sin dueño', frase: 'Ni guerra ni pacto: el Estrecho queda en manos de quien se atreva.', viene: 'Alguien llenará el vacío.', real: false },
};
const GRADOS = { honores: { titulo: 'Reelegido con honores', frase: 'Roma te recordará: el Senado te aplaude y la plebe te corea.' }, gris: { titulo: 'Año gris', frase: 'Ni gloria ni escándalo: acabas el año sin pena ni honra.' }, casa: { titulo: 'A casa', frase: 'El año te ha comido: el pueblo y el Senado te dan la espalda y vuelves a casa sin honores.' } };
export const NOTA_HONORES = 64, NOTA_CASA = 28;
export function veredicto(e) {
  const m = e.marcas, causas = [], add = (texto, puntos) => causas.push({ texto, puntos }), fv = favor(e);
  add('Oro en el arca (' + e.oro + ')', clamp(Math.round((e.oro - 40) / 7), 0, 22)); add('Contento del pueblo (' + e.pueblo + ')', clamp(Math.round((e.pueblo - 35) / 1.6), 0, 20));
  add('Favor del Senado (' + Math.round(fv) + ')', clamp(Math.round((fv - 40) / 2), 0, 12)); add('Obras terminadas (' + e.ciudad.obras.length + ')', Math.min(15, Math.round(e.ciudad.obras.length * 2.5)));
  if (m.propios) add('Asuntos grandes sacados con tu propuesta (' + m.propios + ')', m.propios * 6);
  const cum = (m.cumplidas || []).length, rot = (m.rotas || []).length; if (cum) add('Promesas cumplidas (' + cum + ')', cum * 3); if (rot) add('Promesas rotas (' + rot + ')', -rot * 8);
  for (const s of e.sucesos) add(s.titulo + (s.continua ? ' (sigue) · ' : ' · ') + ESTACIONES[s.estacion].toLowerCase(), (s.id === 'arca' ? -10 : s.id === 'tumulto' ? -12 : -8) / (s.continua ? 2 : 1));
  if (m.sinResolver) add('Asuntos sin resolver (' + m.sinResolver + ')', -m.sinResolver * 7); const atend = Object.values(m.visitas).filter(v => v.atendida).length; if (atend) add('Visitas atendidas (' + atend + ')', atend * 7); if (m.desatendidas) add('Visitas desatendidas (' + m.desatendidas + ')', -m.desatendidas * 9);
  const nota = clamp(causas.reduce((s, c) => s + c.puntos, 0), 0, 100), desastres = e.sucesos.filter(x => !x.continua).length;
  const grado = desastres >= 2 || nota < NOTA_CASA ? 'casa' : nota >= NOTA_HONORES ? 'honores' : 'gris';
  const r = { nota, grado, titulo: GRADOS[grado].titulo, frase: GRADOS[grado].frase, causas, desastres, dictamen: 'licencia de juego: en 264 un cónsul no podía repetir hasta pasados diez años (Livio 7.42); el veredicto es un marcador' };
  if (fv < 30) r.juicio = { texto: 'El Senado muy en contra: al dejar el cargo te llevan a juicio, como a Postumio Megelo, multado al dejar el consulado hacia 290 (Livio, Períoca 11).', multa: 40 };
  return r;
}
export function cierre(e) {
  const m = e.marcas, cruza = !!m.cruza, via = m.via, II = cruza ? m.hieron : m.estrecho;
  const clave = cruza ? 'cruza-' + (II === 'alianza' ? 'alianza' : II === 'nada' ? 'nada' : 'sitio') : 'no-' + (II === 'tratado' ? 'tratado' : II === 'nada' ? 'nada' : 'flota');
  const real = [cruza, II === 'alianza', m.juegos === true];
  const tuI = via === 'senado' ? 'Cruzas por voto del Senado' : via === 'pueblo' ? 'Cruzas por voto del pueblo' : m.asamblea === 'cae' ? 'La asamblea no vota ir: no cruzas' : 'No cruzas: acatas al Senado';
  const tuII = { alianza: 'Te alías con Hierón', sitio: 'Sitias Siracusa', tratado: 'Renuevas el tratado con Cartago', flota: 'Armas una flota en secreto', nada: 'Nadie saca nada: sin rumbo' }[II];
  const tuIII = m.juegos === true ? 'Permites los juegos' : m.juegos === false ? 'Prohíbes los juegos' : m.juegos === 'privado' ? 'Los Junios los dan por su cuenta' : 'Pagas unos juegos grandes';
  const base = crear();
  const nudoI = { estacion: 'Primavera', real: 'Roma cruza a Sicilia por voto del pueblo', tu: tuI, igual: real[0], fuente: 'Polibio, Historias 1.10–11', dictamen: 'histórico (el Senado no se decidió y votó el pueblo)' }; if (via === 'senado') nudoI.matiz = 'en la historia lo votó el pueblo';
  const nudos = [
    nudoI,
    { estacion: 'Verano', real: 'Hierón firma la paz y se alía con Roma (263)', tu: tuII, igual: real[1], fuente: 'Polibio 1.11–12 y 1.16; Diodoro 23.4', dictamen: 'licencia de juego: la paz con Hierón fue en 263' },
    { estacion: 'Otoño', real: 'Primeros gladiadores en Roma', tu: tuIII, igual: real[2], fuente: 'Livio, Períoca 16; Valerio Máximo 2.4.7', dictamen: 'histórico (los primeros gladiadores); tu decisión es licencia de juego' },
  ];
  const magistrados = ORDEN_CARGOS.map(c => {
    const p = personaDe(e, c), a = m.aporte[c] || 0, juicio = a >= 4 ? 'bien' : a >= 0 ? 'regular' : 'mal', ds = e.despachos.filter(d => d.cargo === c);
    const suma = k => ds.reduce((s, d) => s + d.cambios.filter(x => x.que === k).reduce((q, x) => q + x.n, 0), 0), oro = suma('oro'), pu = suma('pueblo');
    return { cargo: c, persona: p.id, nombre: p.nombre, orden: e.ordenes[c], juicio, texto: p.nombre + ' (' + CARGOS[c].nombre.toLowerCase() + '): ' + juicio + '. Dejó ' + (oro >= 0 ? '+' : '') + oro + ' de oro y ' + (pu >= 0 ? '+' : '') + pu + ' de pueblo.' };
  });
  return {
    desvio: Math.round(real.filter(x => !x).length / 3 * 100), nudos, rumbo: { ...RUMBOS[clave] },
    secundaria: m.juegos === true ? 'Roma descubre los juegos de sangre' : m.juegos === false ? 'Roma sigue siendo austera' : m.juegos === 'privado' ? 'Los juegos de sangre llegan por mano privada' : 'La plebe ya espera juegos de quien manda',
    balance: [{ que: 'oro', ini: base.oro, fin: e.oro }, { que: 'pueblo', ini: base.pueblo, fin: e.pueblo }, { que: 'favor', ini: Math.round(favor(base)), fin: Math.round(favor(e)) }].map(b => ({ ...b, dif: b.fin - b.ini })),
    promesas: [...(m.cumplidas || []).map(p => ({ id: p, estado: 'cumplida' })), ...(m.rotas || []).map(p => ({ id: p, estado: 'rota' }))].map(p => ({ ...p, texto: p.id === 'levas' ? 'Sin levas en el campo' : 'Botín para la tropa' })),
    ciudad: { nivel: e.ciudad.nivel, obras: e.ciudad.obras.map(o => ({ ...o })), genteIni: e.ciudad.genteIni, genteFin: e.ciudad.gente }, magistrados, veredicto: veredicto(e),
  };
}
