/* AQVILA — asesor: lecciones cortas de MECÁNICAS del juego, una cada vez, sin repetir y sin molestar al colocar.
   Lógica pura (corre en Node). ui.js arma el contexto y pinta; aquí solo se decide cuál toca. */
(function (root) {
  'use strict';
  const LECCIONES = [
    { id: 'bandeja', texto: 'Abajo está la bandeja: toca una pieza para colocarla, o arrástrala hacia arriba.', cuando: c => !!c.bandeja },
    { id: 'cifra', texto: 'La cifra grande dice cuánto mejora o empeora tu ciudad si colocas ahí. Busca la mayor.', cuando: c => !!c.cifra },
    { id: 'cuotas', texto: 'Las obras grandes se pagan en cuotas al mes. Si falta oro, se pausan hasta que haya.', cuando: c => !!c.cuotas },
    { id: 'riesgo', texto: 'Un aviso de riesgo se apaga al construir la pieza que lo remedia: la bandeja la resalta.', cuando: c => !!c.riesgo },
    { id: 'barrio', texto: 'Un barrio sube de nivel si recibe agua, grano y cobijo; si le falta algo, acaba bajando.', cuando: c => !!c.barrioSube },
    { id: 'almacen', texto: 'Lo que no cabe en el almacén se pierde cada mes. Amplíalo o gasta antes.', cuando: c => !!c.almacenLleno },
    { id: 'arrabal', texto: 'Las casas fuera de la muralla son el arrabal: arden y se anegan antes. Levanta muralla.', cuando: c => !!c.arrabal },
    { id: 'turno', texto: 'Con turnos, el tiempo solo avanza al pulsar «Pasar turno». Piénsalo todo antes.', cuando: c => (c.turnos || 0) >= 1 }
  ];
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
  const ASESOR = { LECCIONES, siguiente, marcar, repetir };
  root.ASESOR = ASESOR;
  if (typeof module !== 'undefined' && module.exports) module.exports = ASESOR;
})(typeof globalThis !== 'undefined' ? globalThis : this);
