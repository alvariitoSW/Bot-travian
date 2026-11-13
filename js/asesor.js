/* AQVILA — asesor: lecciones cortas de MECÁNICAS del juego, una cada vez, sin repetir y sin molestar al colocar.
   Lógica pura (corre en Node). ui.js arma el contexto y pinta; aquí solo se decide cuál toca. */
(function (root) {
  'use strict';
  const LECCIONES = [
    { id: 'bandeja', texto: 'Toca una pieza de la bandeja para colocarla en la ciudad.', cuando: c => !!c.bandeja },
    { id: 'cifra', texto: 'La cifra grande dice cuánto mejora tu ciudad si colocas ahí: busca la mayor.', cuando: c => !!c.cifra },
    { id: 'cuotas', texto: 'Las obras grandes se pagan en cuotas: si falta oro, se pausan hasta que haya.', cuando: c => !!c.cuotas },
    { id: 'riesgo', texto: 'Un riesgo se apaga al construir la pieza que lo remedia: la bandeja la resalta.', cuando: c => !!c.riesgo },
    { id: 'barrio', texto: 'Un barrio sube de nivel si recibe agua, grano y cobijo: no le dejes sin nada.', cuando: c => !!c.barrioSube },
    { id: 'almacen', texto: 'Lo que no cabe en el almacén se pierde cada mes: amplíalo.', cuando: c => !!c.almacenLleno },
    { id: 'arrabal', texto: 'Las casas fuera de la muralla arden y se anegan antes: levanta muralla.', cuando: c => !!c.arrabal },
    { id: 'turno', texto: 'El tiempo solo avanza al pulsar «Pasar turno»: piensa antes de pulsarlo.', cuando: c => (c.turnos || 0) >= 1 }
  ];
  /* R4: avisos de UNA frase (≤ 80 caracteres, una acción). ui.js y game.js los arman con estas funciones; test/avisos.test.mjs los recorre.
     Si hay dos avisos a la vez, sale el más urgente: PRIORIDAD (de más a menos). */
  const PRIORIDAD = ['ataque', 'riesgo', 'arrabal', 'almacen', 'hambre', 'tope', 'barrio', 'obra', 'consejo'];
  const mes1 = n => n + (n === 1 ? ' mes' : ' meses');
  const TEXTOS = {
    obras: (nom, mas, tiempo) => 'En obras: ' + nom + (mas ? ' y ' + mas + ' más' : '') + ', faltan ' + tiempo + '.',
    sinRecursos: () => 'Faltan recursos para nuevas obras: espera a que lleguen.',
    almacen: (res, pct, hay) => 'Tu ' + res + ' llega al ' + pct + ' %: coloca ' + (hay ? 'otro almacén.' : 'un almacén.'),
    granero: () => 'Falta un granero: sin él hay hambre en invierno.',
    tope: () => 'La población está al tope: coloca una obra que traiga una calle.',
    barrio: (baja, nivel, falta) => (baja ? 'Para seguir siendo ' : 'Para ser ') + nivel + ' falta ' + falta + '.',
    mejora: (mej, nombre) => (mej ? 'Mejora a ' : 'Coloca: ') + nombre + ': ya tienes los recursos.',
    arrabal: (n, piedra) => 'Tu arrabal tiene ' + n + ' casas sin muralla' + (piedra ? ' de piedra' : '') + ': levántala.',
    tranquila: () => 'Estación tranquila: aprovecha para ampliar la ciudad.',
    constructores: () => 'Pon a trabajar a los constructores.',
    refuerza: ciudad => 'Refuerza ' + ciudad + ' antes de que acabe la estación.',
    llega: (fac, n, ciudad) => fac + ' (' + n + ' hombres) llega a ' + ciudad + ' al acabar este turno.',
    colonos: lugar => 'Los colonos han llegado a ' + lugar + ': funda la colonia.',
    seAcaba: (grano, meses) => (grano ? 'El grano' : 'El oro') + ' se acaba en ' + meses + ' mes(es).',
    sinObras: (lista, mas) => 'Sin obras en cola: ' + lista + (mas ? '…' : '') + '.',
    llenoAlm: lista => 'Almacén lleno (' + lista + '): gasta lo que sobra.',
    favor: () => 'Senado: favor bajo, sin tratados ajenos ni levas extra.',
    mision: (nom, quedan, falta) => 'Senado: ' + nom + ' (' + mes1(quedan) + '): ' + falta.replace(/\.$/, '') + '.',
    perdido: lista => 'Perdido por almacén lleno: ' + lista + '.',
    cierre: (nom, sobra, cabe, per, completo) => nom + ': sobran ' + sobra + ', caben ' + cabe + ', se perderán ' + per + (completo ? ' si no lo gastas.' : '.'),
    turno: (partes, grave) => 'Turno: ' + partes + ' (mira la Crónica).',
    obraHecha: (ciudad, txt) => 'Obra terminada en ' + ciudad + ': ' + txt + '.',
    tropaLista: (ciudad, n, unidad) => 'Tropa lista en ' + ciudad + ': ' + n + ' ' + unidad + '.',
    ataque: (fac, ciudad) => 'Ataque: ' + fac + ' marcha sobre ' + ciudad + '.',
    misionOk: nom => 'Misión cumplida: ' + nom + '.',
    misionMal: nom => 'Misión fallida: ' + nom + '.',
    crecida: n => 'Crecida: el río puede llevarse ' + n + (n === 1 ? ' construcción' : ' construcciones') + ': no edifiques en la zona azul.',
    fuego: n => 'Riesgo de incendio en ' + n + (n === 1 ? ' casa' : ' casas') + ': pon una fuente cerca.',
    hambre: ya => ya ? 'Hay hambre de invierno: coloca un granero para el próximo.' : 'Sin granero habrá hambre en invierno: coloca uno antes de diciembre.'
  };
  /* siguiente(ajustes, ctx) -> lección o null. No escribe nada. */
  function siguiente(a, ctx) {
    if (!a || a.asesor === false) return null;
    ctx = ctx || {}; if (ctx.colocando) return null;
    const vistos = Array.isArray(a.vistos) ? a.vistos : [];
    const mes = ctx.mes || 0, ahora = ctx.ahora || 0;
    if (a.asesorMes != null && a.asesorMs != null && mes - a.asesorMes < 3 && ahora - a.asesorMs < 60000) return null;
    for (const l of LECCIONES) if (!vistos.includes(l.id) && l.cuando(ctx)) return l;
    return null;
  }
  function marcar(a, id, ctx) {
    if (!a) return; ctx = ctx || {};
    if (!Array.isArray(a.vistos)) a.vistos = [];
    if (!a.vistos.includes(id)) a.vistos.push(id);
    a.asesorMes = ctx.mes || 0; a.asesorMs = ctx.ahora || 0;
  }
  function repetir(a) { if (!a) return; a.vistos = []; delete a.asesorMes; delete a.asesorMs; }
  const ASESOR = { LECCIONES, TEXTOS, PRIORIDAD, siguiente, marcar, repetir };
  root.ASESOR = ASESOR;
  if (typeof module !== 'undefined' && module.exports) module.exports = ASESOR;
})(typeof globalThis !== 'undefined' ? globalThis : this);
