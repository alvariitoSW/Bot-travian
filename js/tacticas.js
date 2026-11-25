/* AQVILA — TH1 (24/11/2026): cuatro TÁCTICAS de la época como reglas puras, sin pantalla. Corre en Node y en el navegador (global `Tacticas`).
   Las usa js/simulador.js solo si la batalla se crea con cfg.tacticas; sin eso el simulador da las mismas batallas de siempre.
   El estado de cada manípulo vive en S.tac[id] (JSON puro, se guarda con S). Este archivo no requiere el simulador (evita ciclos).
   API: paso(S, dt) · rompe(S, u) · golpe(S, u) · recibe(S, u, cara) · moral(S, u) → multiplicadores (1 si no hay S.tac) · activas(S, u) → claves · CIFRAS
   Cada cifra es «licencia de juego» (la época da la idea, no el número); la fuente histórica va en el comentario de cada regla. */
(function (root) {
  'use strict';
  /* Cifras. Todas: licencia de juego. Fuente de la idea entre paréntesis. */
  const CIFRAS = {
    triarios: { /* «res ad triarios rediit» (Livio 8.8.9-13) */ umbral: 0.5, moralMin: 0.9, susto: 0.08, recibe: 0.75, moral: 0.6 },
    falange:  { /* sarisas que no giran (Polibio 18.29-32 y 18.26) */ golpe: 0.55, moral: 1.5, pausa: 8 },
    envuelto: { /* Cannas (Polibio 3.115-116; Livio 22.47-49): rodeados, sin sitio ni salida */ enemigos: 3, recibe: 1.3, moral: 1.4, golpe: 0.8, pausa: 10, copados: 0.4 },
    galos:    { /* furia que se agota (Polibio 2.33; Livio 10.28.4) */ furia: 20, fin: 40, golpe: 1.4, final: 0.8, aviso: 30, fatiga: 0.004 }
  };
  const vivo = u => u.estado === 'firme' || u.estado === 'duda';
  const redo = x => Math.round(x * 10) / 10;
  function aviso(S, u, tac, texto) { S.reg.push({ t: redo(S.t), tipo: 'tactica', tac, texto, id: u.id, lado: u.lado, x: Math.round(u.x), y: Math.round(u.y) }); }
  const est = (S, u) => S.tac[u.id] || (S.tac[u.id] = {});
  const enemigos = (S, u) => (S.cont && S.cont[u.id] || []).filter(c => vivo(S.man[c.id]));

  function envuelto(S, u) {
    const c = enemigos(S, u), K = CIFRAS.envuelto, fr = c.some(x => x.cara === 'frente'), fl = c.some(x => x.cara === 'flanco'), re = c.some(x => x.cara === 'retaguardia');
    return (fr && (fl || re)) || (fl && re) || c.length >= K.enemigos;
  }
  /* Las reglas se calculan una vez por paso y se guardan en el estado; golpe/recibe/moral solo leen. */
  function paso(S, dt) {
    if (!S.tac) return;
    const M = S.man, K = CIFRAS;
    const resto = [0, 0], base = [0, 0];                       /* hastati + príncipes de cada lado: hombres vivos / iniciales */
    for (const u of M) if (u.tropa === 'hastati' || u.tropa === 'principes') { base[u.lado] += u.n0; if (vivo(u)) resto[u.lado] += u.n; }
    for (const u of M) {
      if (!vivo(u)) { const e = S.tac[u.id]; if (e) { e.fal = false; e.env = false; } continue; }
      const cont = enemigos(S, u);
      if (u.tropa === 'triarii' && cont.length) {
        const e = est(S, u);
        if (!e.alzado && base[u.lado] > 0 && resto[u.lado] / base[u.lado] < K.triarios.umbral) {
          e.alzado = true; u.moral = Math.max(u.moral, K.triarios.moralMin);
          for (const c of cont) S.man[c.id].moral -= K.triarios.susto;
          aviso(S, u, 'triarios', '¡Res ad triarios rediit! ' + u.nom + ' se alzan y cierran filas');
        }
      }
      if (u.forma === 'falange') {
        const e = est(S, u), fl = (S.cont[u.id] || []).some(c => c.cara === 'flanco' || c.cara === 'retaguardia');
        if (fl && !e.fal && S.t - (e.tFal === undefined ? -99 : e.tFal) >= K.falange.pausa) { e.tFal = S.t; aviso(S, u, 'falange', u.nom + ': las sarisas no giran; la falange se deshace por el flanco'); }
        e.fal = fl;
      }
      if (cont.length || (S.tac[u.id] && S.tac[u.id].env)) {
        const e = est(S, u), en = envuelto(S, u);
        if (en && !e.env && S.t - (e.tEnv === undefined ? -99 : e.tEnv) >= K.envuelto.pausa) { e.tEnv = S.t; aviso(S, u, 'envuelto', '¡' + u.nom + ', envueltos! No hay sitio ni para blandir la espada'); }
        e.env = en;
      }
      if (u.tropa === 'galos') {
        const e = est(S, u);
        if (e.t0 === undefined && cont.length) { e.t0 = S.t; aviso(S, u, 'galos', 'Furia gala: ' + u.nom + ' se lanzan con todo'); }
        if (e.t0 !== undefined) {
          if (!e.apagada && S.t >= e.t0 + K.galos.aviso) { e.apagada = true; aviso(S, u, 'galos-fin', 'La furia de ' + u.nom + ' se apaga'); }
          if (cont.length && S.t >= e.t0 + K.galos.furia) u.fatiga = Math.min(1, u.fatiga + K.galos.fatiga * dt);
        }
      }
    }
  }
  /* Lo llama el simulador cuando un manípulo se rompe. Copados: el que se rompe estando envuelto no tiene por dónde huir
     y cae en el sitio (Cannas). Una vez por manípulo. */
  function rompe(S, u) {
    const e = S.tac && S.tac[u.id]; if (!e || !e.env || e.copado) return;
    e.copado = true; u.n -= Math.min(u.n, u.n * CIFRAS.envuelto.copados);
    aviso(S, u, 'copados', u.nom + ': rodeados, no tienen por dónde huir');
  }
  function furia(S, u) {
    const e = S.tac[u.id], G = CIFRAS.galos;
    if (!e || e.t0 === undefined) return 1;
    const r = S.t - e.t0;
    if (r < G.furia) return G.golpe;
    if (r < G.fin) return G.golpe + (G.final - G.golpe) * (r - G.furia) / (G.fin - G.furia);
    return G.final;
  }
  function golpe(S, u) {
    if (!S.tac) return 1; const e = S.tac[u.id]; let m = 1;
    if (u.tropa === 'galos') m *= furia(S, u);
    if (e && e.fal) m *= CIFRAS.falange.golpe;
    if (e && e.env) m *= CIFRAS.envuelto.golpe;
    return m;
  }
  function recibe(S, u, cara) {
    if (!S.tac) return 1; const e = S.tac[u.id]; let m = 1;
    if (e && e.alzado) m *= CIFRAS.triarios.recibe;
    if (e && e.env) m *= CIFRAS.envuelto.recibe;
    return m;
  }
  function moral(S, u) {
    if (!S.tac) return 1; const e = S.tac[u.id]; let m = 1;
    if (e && e.alzado) m *= CIFRAS.triarios.moral;
    if (e && e.fal) m *= CIFRAS.falange.moral;
    if (e && e.env) m *= CIFRAS.envuelto.moral;
    return m;
  }
  function activas(S, u) {
    const r = [], e = S.tac && S.tac[u.id]; if (!e) return r;
    if (e.alzado) r.push('triarios'); if (e.fal) r.push('falange'); if (e.env) r.push('envuelto');
    if (u.tropa === 'galos' && e.t0 !== undefined) r.push('galos');
    return r;
  }
  const T = { CIFRAS, paso, golpe, recibe, moral, rompe, activas };
  root.Tacticas = T;
  if (typeof module !== 'undefined') module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
