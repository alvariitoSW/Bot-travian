/* AQVILA — CE5: «Este año» (libro de cuentas anual) y tributo de guerra. Lógica pura (corre en Node), sin pantalla ni Math.random.
   Contrato: libro = { v:1, anio, c:{ ciudadId:{ recurso:{ entra:{motivo:n}, sale:{motivo:n} } } } }; '_imperio' guarda lo que no es de una ciudad.
   Funciones puras salvo apunta, apuntaMes y migrar, que mutan lo que reciben. s.esteAno = { v:1, actual:libro, anterior:libro|null }.
   Cuentas por ámbito (imperio o ciudad): entra, sale, saldo, tendencia contra el año anterior, y adónde va el dinero y qué cuesta la guerra.
   HISTORIA: stipendium, paga del soldado desde el 406 a.C. (Livio 4.59-60); tributum de los ciudadanos para pagar la guerra,
   suspendido en 167 a.C. con el botín de Macedonia (Plutarco, Emilio Paulo 38; Cicerón, De officiis 2.76); indemnizaciones de Cartago:
   3200 talentos en 10 años en 241 y 10 000 en 50 años en 201 (Polibio 1.62-63 y 15.18).
   Todo lo demás (cifras, plazos de 5/10/20 años, humor) es LICENCIA DE JUEGO. */
(function (root) {
  'use strict';
  const EA = {};
  EA.RECURSOS = ['denarios', 'grano', 'materiales', 'hierro', 'aceite', 'vino', 'verdura', 'lana'];
  EA.MOTIVOS = {
    entra: ['impuestos', 'comercio', 'cosecha', 'botin', 'indemnizacion', 'tributo', 'aliados'],
    sale: ['comida', 'edificios', 'obras', 'legiones', 'tributoGuerra', 'sabios', 'senado', 'compras', 'indemnizacion', 'perdido']
  };
  EA.CAMINO = { legiones: 'guerra', tributoGuerra: 'guerra', obras: 'ciudad', edificios: 'ciudad', comida: 'ciudad', sabios: 'ciencia', senado: 'politica', compras: 'comercio', indemnizacion: 'guerra', perdido: 'perdido' };
  EA.CAMINOS = ['guerra', 'ciudad', 'comercio', 'politica', 'ciencia', 'otros', 'perdido'];
  EA.K = { pagaHombreAnio: 0.12, tributoPorCiudadano: 0.05, humorPorDenario: 0.004, humorMax: 15, plazos: { leve: 5, normal: 10, dura: 20 }, factor: { leve: 0.5, normal: 1, dura: 2 } };
  const IMP = '_imperio';
  const VETADO = ['__proto__', 'constructor', 'prototype'];
  const fin = x => (typeof x === 'number' && isFinite(x)) ? x : 0;
  const pos = x => Math.max(0, fin(x));
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  EA.nuevoLibro = function (anio) { return { v: 1, anio, c: {} }; };

  EA.apunta = function (libro, ciudad, recurso, cantidad, motivo) {
    if (!libro || !libro.c || !ciudad || !recurso) return libro;
    if (typeof cantidad !== 'number' || !isFinite(cantidad) || cantidad === 0) return libro;
    const m = motivo || 'otros';
    if (VETADO.indexOf(ciudad) >= 0 || VETADO.indexOf(recurso) >= 0 || VETADO.indexOf(m) >= 0) return libro;
    const c = own(libro.c, ciudad) ? libro.c[ciudad] : (libro.c[ciudad] = {});
    const r = own(c, recurso) ? c[recurso] : (c[recurso] = { entra: {}, sale: {} });
    const lado = cantidad > 0 ? r.entra : r.sale;
    lado[m] = (lado[m] || 0) + Math.abs(cantidad);
    return libro;
  };

  EA.apuntaMes = function (libro, ciudad, mov) {
    if (!mov) return libro;
    for (const r of Object.keys(mov)) for (const m of Object.keys(mov[r] || {})) EA.apunta(libro, ciudad, r, mov[r][m], m);
    return libro;
  };

  function sumar(libro, ids) {
    const out = {};
    for (const id of ids) {
      const c = libro && libro.c && libro.c[id]; if (!c) continue;
      for (const r of Object.keys(c)) {
        const o = out[r] || (out[r] = { entra: {}, sale: {} });
        for (const l of ['entra', 'sale']) for (const m of Object.keys((c[r] && c[r][l]) || {})) o[l][m] = (o[l][m] || 0) + fin(c[r][l][m]);
      }
    }
    return out;
  }
  const total = o => Object.keys(o).reduce((a, k) => a + o[k], 0);
  const ordenR = r => { const i = EA.RECURSOS.indexOf(r); return i < 0 ? 1000 : i; };
  const motivos = o => Object.keys(o).map(m => ({ m, n: Math.round(o[m]) })).filter(x => x.n !== 0).sort((a, b) => b.n - a.n || (a.m < b.m ? -1 : 1));

  function filas(suma, previo) {
    return Object.keys(suma).filter(r => total(suma[r].entra) + total(suma[r].sale) > 0)
      .sort((a, b) => ordenR(a) - ordenR(b) || (a < b ? -1 : a > b ? 1 : 0))
      .map(r => {
        const entra = total(suma[r].entra), sale = total(suma[r].sale), saldo = entra - sale;
        let antes = null, tendencia = null;
        if (previo && previo[r]) { antes = total(previo[r].entra) - total(previo[r].sale); }
        if (antes !== null) {
          const d = saldo - antes;
          tendencia = (Math.abs(d) < 1 || Math.abs(d) < 0.02 * Math.max(Math.abs(antes), 1)) ? 'igual' : (d > 0 ? 'sube' : 'baja');
          antes = Math.round(antes);
        }
        return { r, entra: Math.round(entra), sale: Math.round(sale), saldo: Math.round(saldo), antes, tendencia, motivosEntra: motivos(suma[r].entra), motivosSale: motivos(suma[r].sale) };
      });
  }

  // Reparto en enteros que suman 100 exacto (resto mayor).
  function porCien(ns) {
    const t = ns.reduce((a, b) => a + b, 0); if (!(t > 0)) return ns.map(() => 0);
    const cr = ns.map(n => n * 100 / t), pc = cr.map(Math.floor);
    let falta = 100 - pc.reduce((a, b) => a + b, 0);
    const ord = cr.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f || a.i - b.i);
    for (let k = 0; k < falta && k < ord.length; k++) pc[ord[k].i]++;
    return pc;
  }

  EA.adondeVa = function (libro, recurso, ciudad) {
    const rec = recurso || 'denarios';
    const suma = sumar(libro, ciudad ? [ciudad] : (libro && libro.c ? Object.keys(libro.c) : []));
    const sale = suma[rec] ? suma[rec].sale : {};
    const mot = Object.keys(sale).filter(m => Math.round(sale[m]) > 0).map(m => ({ motivo: m, n: sale[m] })).sort((a, b) => b.n - a.n || (a.motivo < b.motivo ? -1 : 1));
    const tot = mot.reduce((a, b) => a + b.n, 0);
    const pcs = porCien(mot.map(x => x.n));
    const partes = mot.map((x, i) => ({ motivo: x.motivo, n: Math.round(x.n), pc: pcs[i], camino: own(EA.CAMINO, x.motivo) ? EA.CAMINO[x.motivo] : 'otros' }));
    const cam = {}; mot.forEach(x => { const c = own(EA.CAMINO, x.motivo) ? EA.CAMINO[x.motivo] : 'otros'; cam[c] = (cam[c] || 0) + x.n; });
    const cl = Object.keys(cam).map(c => ({ camino: c, n: cam[c] })).sort((a, b) => b.n - a.n || EA.CAMINOS.indexOf(a.camino) - EA.CAMINOS.indexOf(b.camino));
    const cp = porCien(cl.map(x => x.n));
    const caminos = cl.map((x, i) => ({ camino: x.camino, n: Math.round(x.n), pc: cp[i] }));
    return { total: Math.round(tot), partes, caminos, mayor: partes[0] || null };
  };

  EA.balanceGuerra = function (libro, ciudad) {
    const d = sumar(libro, ciudad ? [ciudad] : (libro && libro.c ? Object.keys(libro.c) : [])).denarios || { entra: {}, sale: {} };
    const cuesta = (d.sale.legiones || 0) + (d.sale.tributoGuerra || 0) + (d.sale.indemnizacion || 0);
    const gana = (d.entra.botin || 0) + (d.entra.indemnizacion || 0);
    return { cuesta: Math.round(cuesta), gana: Math.round(gana), saldo: Math.round(gana - cuesta) };
  };

  EA.cuentas = function (libro, anterior) {
    const ids = libro && libro.c ? Object.keys(libro.c) : [];
    const idsAnt = anterior && anterior.c ? Object.keys(anterior.c) : [];
    const imperio = filas(sumar(libro, ids), anterior ? sumar(anterior, idsAnt) : null);
    const ciudades = {};
    const porCiudad = {};
    for (const id of ids) if (id !== IMP) { porCiudad[id] = { adonde: EA.adondeVa(libro, 'denarios', id), guerra: EA.balanceGuerra(libro, id) }; }
    for (const id of ids) if (id !== IMP) ciudades[id] = filas(sumar(libro, [id]), anterior ? sumar(anterior, [id]) : null);
    return { anio: libro ? libro.anio : null, imperio, ciudades, porCiudad, faltan: imperio.filter(f => f.saldo < 0).map(f => f.r), adonde: EA.adondeVa(libro), guerra: EA.balanceGuerra(libro) };
  };

  EA.registro = function (anio) { return { v: 1, actual: EA.nuevoLibro(anio), anterior: null }; };
  EA.cerrarAnio = function (reg, anioNuevo) { return { v: 1, actual: EA.nuevoLibro(anioNuevo), anterior: reg ? reg.actual : null }; };
  const libroOk = l => l && typeof l === 'object' && l.c && typeof l.c === 'object' && !Array.isArray(l.c);
  EA.migrar = function (s, anio) {
    const e = s.esteAno;
    if (e && typeof e === 'object' && e.v === 1 && libroOk(e.actual) && (e.anterior === null || e.anterior === undefined || libroOk(e.anterior))) { const ch = e.anterior === undefined; if (ch) e.anterior = null; return ch; }
    s.esteAno = EA.registro(anio); return true;
  };

  // Tributo de guerra (cada primavera). Licencia de juego salvo la idea de suspenderlo con botín (167 a.C.).
  EA.tributoPrimavera = function (o) {
    o = o || {};
    const K = EA.K, h = pos(o.hombresEnArmas), ciu = pos(o.ciudadanos), botin = pos(o.botinAnio), ind = pos(o.indemnizacionAnio), caja = pos(o.caja);
    const coste = Math.round(h * K.pagaHombreAnio * 10);
    const cb = Math.min(botin, coste), ci = Math.min(ind, coste - cb);
    const falta = coste - cb - ci;
    const hm = Math.min(K.humorMax, Math.round(falta * K.humorPorDenario));
    return {
      coste, cubre: { botin: cb, indemnizacion: ci }, falta, suspendido: coste > 0 && falta === 0,
      opciones: {
        tributo: { cobra: falta, porCiudadano: ciu > 0 ? Math.round(falta / ciu * 100) / 100 : 0, humor: hm ? -hm : 0, posible: ciu > 0 },
        caja: { paga: falta, alcanza: caja >= falta }
      }
    };
  };

  EA.indemnizacion = function (o) {
    o = o || {};
    const K = EA.K, d = own(K.plazos, o.dureza) ? o.dureza : 'normal';
    const rq = pos(o.riquezaAnual), an = Math.min(Math.max(fin(o.anios) || 1, 1), 10);
    const tot = Math.round(rq * K.factor[d] * an), plazos = K.plazos[d];
    return { total: tot, plazos, cuota: Math.ceil(tot / plazos), inicio: isFinite(o.inicio) && typeof o.inicio === 'number' ? o.inicio : 0, pagado: 0 };
  };
  EA.cuotaAnio = function (plan, anio) {
    if (!plan || !(fin(anio) === anio) || !isFinite(plan.inicio) || !isFinite(plan.plazos) || typeof plan.inicio !== 'number') return 0;
    const resta = Math.max(0, fin(plan.total) - fin(plan.pagado));
    if (anio < plan.inicio || anio > plan.inicio + plan.plazos - 1 || resta <= 0) return 0;
    return anio === plan.inicio + plan.plazos - 1 ? resta : Math.min(plan.cuota, resta);
  };
  EA.cobrarCuota = function (plan, anio) {
    const cuota = EA.cuotaAnio(plan, anio);
    return { plan: Object.assign({}, plan, { pagado: fin(plan && plan.pagado) + cuota }), cuota };
  };

  root.ESTEANO = EA;
  if (typeof module !== 'undefined' && module.exports) module.exports = EA;
})(typeof window !== 'undefined' ? window : globalThis);
