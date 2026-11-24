/* AQVILA — CG7 (CG1 §8, ES0): la BATALLA RÁPIDA, solo lógica. Corre en Node y en el navegador (global `BatallaRapida`).
   QUÉ ES. La batalla de siempre (js/simulador.js) jugada a trozos: tres rondas de PLANEAR (órdenes por ala o por manípulo) y MIRAR
   (la batalla corre SEG segundos). Al terminar la tercera ronda, los tribunos acaban la batalla sin que se mire. «Resolver sin mirar»
   corre todo de golpe. Usa el simulador SOLO por su interfaz pública; no lo cambia. Sin azar propio: mismo cfg y mismas órdenes, misma batalla.
   Licencia de juego: el número de rondas (3) y los segundos de cada una (50) no son históricos; la batalla clásica dura unos 120–160 s.

   API: RONDAS · SEG · ORDENES · ALAS · crear(cfg) · grupos(R) · ordenarAla(R, ala, k) · ordenarUnidad(R, id, k) · mirar(R)
        avanzar(R, seg) · saltar(R) · acabar(R) · retirarse(R) · resumen(R) · resolver(cfg) · vista(R) · eventos(R, desde)
   R = { S, ronda, fase: 'planear' | 'mirar' | 'fin', tFin, ordAla: [k,k,k], ordUni: {id: k}, resto }
   cfg = { S } (estado ya creado) o lo que recibe Simulador.crear ({semilla, ejercitos} o {semilla, manipulos}).
   Las órdenes devuelven '' si se hicieron o el motivo en llano. avanzar() devuelve la fase.
   TIEMPO: el simulador anda en pasos fijos de 0,2 s; si se pide menos (p. ej. 0,05), el resto se acumula en R.resto hasta
   completar un paso, para no perder ni duplicar tiempo. */
(function (root) {
  'use strict';
  let Z = root.Simulador;
  if (!Z && typeof require !== 'undefined') Z = require('./simulador.js');

  const RONDAS = 3, SEG = 50;
  const ORDENES = [{ k: 'avanzar', n: 'Avanzar' }, { k: 'aguantar', n: 'Aguantar' }, { k: 'flanquear', n: 'Flanquear' }, { k: 'cargar', n: 'Cargar' }, { k: 'retirarse', n: 'Retirarse' }];
  const ALAS = ['Ala izquierda', 'Centro', 'Ala derecha'];
  const PLAN_DE = { avanzar: 'avanzar', aguantar: 'aguantar', flanquear: 'envolver', cargar: 'avanzar' };
  const PARADA = 15, COSTADO = 25;   /* metros: dónde se detienen al avanzar; margen al flanquear */
  const vivo = u => u.estado === 'firme' || u.estado === 'duda';

  function crear(cfg) {
    cfg = cfg || {};
    const S = cfg.S || Z.crear(cfg);
    return { S, ronda: 1, fase: 'planear', tFin: 0, ordAla: ['avanzar', 'avanzar', 'avanzar'], ordUni: {}, resto: 0 };
  }

  const propios = (R, ala) => R.S.man.filter(u => u.lado === 0 && u.ala === ala);

  function grupos(R) {
    return [0, 1, 2].map(ala => {
      const todos = propios(R, ala), vivos = todos.filter(vivo);
      return { ala, nombre: ALAS[ala], ids: vivos.map(u => u.id), hombres: Math.round(vivos.reduce((a, u) => a + u.n, 0)),
        hombres0: todos.reduce((a, u) => a + u.n0, 0), moral: vivos.length ? vivos.reduce((a, u) => a + u.moral, 0) / vivos.length : 0, orden: R.ordAla[ala] };
    });
  }

  function enemigoCerca(S, u) {
    let m = null, md = 1e9;
    for (const v of S.man) { if (v.lado === u.lado || !vivo(v)) continue; const d = Math.hypot(v.x - u.x, v.y - u.y); if (d < md) { md = d; m = v; } }
    return m;
  }

  function ordenarAla(R, ala, k) {
    if (R.fase !== 'planear') return 'Ahora no se pueden dar órdenes: hay que esperar a la siguiente ronda';
    if (!ORDENES.some(o => o.k === k)) return 'Orden desconocida';
    if (!(ala >= 0 && ala <= 2)) return 'Ala desconocida';
    const ids = propios(R, ala).filter(vivo).map(u => u.id);
    if (!ids.length) return 'En esa ala no queda ningún manípulo';
    const S = R.S;
    if (k === 'retirarse' || k === 'cargar') {
      if (k === 'cargar') {
        for (const id of ids) { const no = Z.puede(S, { tipo: 'cargar', lado: 0, ids: [id] }); if (no && ids.length === 1) return no; }
        Z.ordenar(S, { tipo: 'plan', lado: 0, ala, plan: 'avanzar' });
      }
      for (const id of ids) {
        const o = { tipo: k === 'cargar' ? 'cargar' : 'retirar', lado: 0, ids: [id] };
        if (!Z.puede(S, o)) Z.ordenar(S, o);
      }
    } else {
      const no = Z.ordenar(S, { tipo: 'plan', lado: 0, ala, plan: PLAN_DE[k] }); if (no) return no;
      Z.ordenar(S, { tipo: 'devolver', lado: 0, ids });
    }
    R.ordAla[ala] = k;
    for (const id of ids) delete R.ordUni[id];
    for (const u of propios(R, ala)) delete R.ordUni[u.id];
    return '';
  }

  function ordenarUnidad(R, id, k) {
    if (R.fase !== 'planear') return 'Ahora no se pueden dar órdenes: hay que esperar a la siguiente ronda';
    const S = R.S, u = S.man[id];
    if (!u || u.lado !== 0) return 'Ese manípulo no es tuyo';
    let o;
    if (k === 'ala') o = { tipo: 'devolver', lado: 0, ids: [id] };
    else if (k === 'aguantar') o = { tipo: 'aguantar', lado: 0, ids: [id] };
    else if (k === 'cargar') o = { tipo: 'cargar', lado: 0, ids: [id] };
    else if (k === 'retirarse') o = { tipo: 'retirar', lado: 0, ids: [id] };
    else if (k === 'avanzar' || k === 'flanquear') {
      const e = enemigoCerca(S, u);
      if (!e) return 'No queda enemigo al que acercarse';
      const dx = e.x - u.x, dy = e.y - u.y, d = Math.hypot(dx, dy) || 1;
      if (k === 'avanzar') {
        const l = Math.max(0, d - PARADA);
        o = { tipo: 'mover', lado: 0, ids: [id], x: u.x + dx / d * l, y: u.y + dy / d * l, a: Math.atan2(dy, dx) };
      } else {
        const ve = Z.vista(S).find(v => v.id === e.id), fr = ve ? ve.frente : 40;
        const sx = Math.cos(e.a + Math.PI / 2), sy = Math.sin(e.a + Math.PI / 2);
        const sg = ((u.x - e.x) * sx + (u.y - e.y) * sy) >= 0 ? 1 : -1, r = fr / 2 + COSTADO;
        const x = e.x + sg * sx * r, y = e.y + sg * sy * r;
        o = { tipo: 'mover', lado: 0, ids: [id], x, y, a: Math.atan2(e.y - y, e.x - x) };
      }
    } else return 'Orden desconocida';
    const no = Z.puede(S, o); if (no) return no;
    Z.ordenar(S, o);
    if (k === 'ala') delete R.ordUni[id]; else R.ordUni[id] = k;
    return '';
  }

  function mirar(R) { R.fase = 'mirar'; R.tFin = R.S.t + SEG; R.resto = 0; return ''; }

  function avanzar(R, seg) {
    if (R.fase !== 'mirar') return R.fase;
    const S = R.S;
    R.resto += Math.max(0, seg);
    const pasos = Math.floor(R.resto / Z.PASO + 1e-9);
    if (pasos > 0) {
      R.resto -= pasos * Z.PASO;
      const quedan = Math.max(0, R.tFin - S.t);
      Z.avanzar(S, Math.min(pasos * Z.PASO, quedan));
    }
    if (S.fase === 'fin') R.fase = 'fin';
    else if (S.t >= R.tFin - 1e-6) {
      if (R.ronda >= RONDAS) acabar(R); else { R.ronda++; R.fase = 'planear'; R.resto = 0; }
    }
    return R.fase;
  }

  function saltar(R) {
    if (R.fase !== 'mirar') return R.fase;
    const falta = R.tFin - R.S.t;
    return avanzar(R, falta + Z.PASO);
  }

  /* Los tribunos acaban la batalla sin mirar: las órdenes quedan como estaban */
  function acabar(R) { Z.avanzar(R.S, R.S.limite); R.fase = 'fin'; return R.fase; }
  function retirarse(R) { Z.retirarse(R.S); R.fase = 'fin'; return R.fase; }
  const resumen = R => Z.resumen(R.S);
  function resolver(cfg) { const S = (cfg && cfg.S) || Z.crear(cfg); Z.avanzar(S, S.limite); return Z.resumen(S); }
  const vista = R => Z.vista(R.S);
  const eventos = (R, desde) => R.S.reg.slice(desde || 0);

  const BR = { RONDAS, SEG, ORDENES, ALAS, crear, grupos, ordenarAla, ordenarUnidad, mirar, avanzar, saltar, acabar, retirarse, resumen, resolver, vista, eventos };
  root.BatallaRapida = BR;
  if (typeof module !== 'undefined') module.exports = BR;
})(typeof window !== 'undefined' ? window : globalThis);
