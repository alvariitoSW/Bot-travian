/* AQVILA — CE10: los cuatro caminos de victoria (reglas). Lógica pura (corre en Node), sin pantalla, sin azar.
   Armas, comercio, política y ciudad. Se gana con dos tercios de los caminos (3 de 4), sin plazo.
   Un camino logrado se puede perder. Ganar NO acaba la partida: este módulo nunca escribe s.over.
   Solo escribe en s.caminos = { v, estado:{id:{logrado,desde,sost,fallo,perdidoEn,veces}}, victoria, victoriaVista, avisos }.
   NOTA HISTÓRICA:
   - Príncipe del Senado (princeps senatus): primer senador de la lista del censo; Q. Fabio Máximo lo fue en 209 a.C.
     (Livio 27.11.9-12). Histórico. Que se llegue a él por el favor y los bandos: licencia de juego.
   - Toma y destrucción de Cartago, 146 a.C., Escipión Emiliano (Polibio 38.19-22; Apiano, Líbica 127-135). Histórico.
     Que sea «un camino» y no el fin del juego: licencia de juego.
   - Tratados con Cartago y comercio (Polibio 3.22-25); alianza (foedus) con Hierón II en 263 (Polibio 1.16). Histórico.
     La meta de tesoro, rutas y acuerdos: licencia de juego.
   - Ciudad: Aqua Appia, 312 a.C. (Frontino, Acueductos 1.5); los ediles cuidan calles y mercados (Cicerón, Leyes 3.7).
     Histórico. «Barrios cubiertos» y «Urbs» como nivel: licencia de juego.
   - Ganar con 3 de 4, sin plazo y con caminos que se pierden: licencia de juego (decisión del usuario, 18/11). */
(function (root) {
  'use strict';
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const CAM = {};
  CAM.ORDEN = ['armas', 'comercio', 'politica', 'ciudad'];
  CAM.necesarios = function (n) { n = n == null ? 4 : n; return Math.ceil(n * 2 / 3); };
  // Cifras de juego (las ajusta CE12). Todas licencia de juego.
  const CIFRAS = {
    // CE12 (24/11, medido con test/equilibrio-caminos.mjs sobre el juego enganchado; ver gobierno/estudios/CE12-cifras.md):
    // plazas 8→6 (3 en la corta), tesoro 3000→3600, rutas 4→6, acuerdos 3→6, planes 2→3, sostener comercio 24, política y ciudad 12.
    // Príncipe 80: con 75 o 78 la corta daba la política en el 276 a.C. Tesoro 3900 o más: nadie llega (el bot se queda en ≈3900).
    armas: { plazas: 6, plazasCorta: 3 },   // CE12: en la partida corta (Italia) la partida acaba al caer la capital rival
    comercio: { rentaPorCiudad: 800, rutas: 6, acuerdos: 6 },   // CE12: «tesoro» es la renta neta del año anterior: umbral = rentaPorCiudad x ciudades propias
    politica: { favorPrinceps: 80, hostil: 35, apoyo: 0.6, humorApoyo: 50, planesBien: 4 },
    ciudad: { cubiertos: 0.8, nivelUrbe: 4, casasPorCiudad: 73, fraccionUrbe: 0.5 },   // CE12: «urbe» = casas de la capital en barrios de nivel >= nivelUrbe (y al menos la fracción de las casas)
    sostener: { armas: 0, comercio: 24, politica: 24, ciudad: 12 },
    gracia: 3
  };
  CAM.CIFRAS = CIFRAS;

  const num = (x) => (typeof x === 'number' && isFinite(x) ? x : 0);
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);
  const lista = (x) => (Array.isArray(x) ? x : []);

  // Renta neta del año anterior completo en denarios (entra - sale, todas las ciudades y el imperio) según «Este año» (s.esteAno.anterior).
  function rentaAnual(s) {
    const l = obj(obj(s.esteAno) && s.esteAno.anterior), c = obj(l && l.c); if (!c) return 0;
    let n = 0;
    Object.keys(c).forEach((id) => { const d = obj(c[id]) && obj(c[id].denarios); if (!d) return; ['entra', 'sale'].forEach((k) => { const o = obj(d[k]) || {}; Object.keys(o).forEach((m) => { n += (k === 'entra' ? 1 : -1) * num(o[m]); }); }); });
    return n;
  }
  // La «foto»: lo que el juego mide cada mes, leído del estado guardado.
  CAM.foto = function (s, G) {
    s = obj(s) || {};
    const cities = obj(s.cities) || {};
    const CI = (D && D.CITIES) || {};
    const mes = Math.floor(num(s.t) + 1e-9);
    let plazas = 0;
    Object.keys(cities).forEach((id) => { if (cities[id] && cities[id].owner === 'roma' && CI[id] && CI[id].f !== 'roma') plazas++; });
    const mer = obj(s.mercado) || {};
    const dip = obj(s.dip) || {};
    let acuerdos = Object.keys(dip).filter((k) => dip[k] && (dip[k].estado === 'alianza' || dip[k].estado === 'tributo')).length;
    acuerdos += lista(mer.contratos).filter((c) => c && c.id === 'tratado' && num(c.hasta) > mes).length;
    const favorSenado = num(s.favor && s.favor.senado);
    const sen = obj(s.senado) || {};
    // Puente provisional (licencia de juego): sin cargo del Senado (CE7), el favor alto hace de princeps.
    const cargo = sen.cargo || (favorSenado >= CIFRAS.politica.favorPrinceps ? 'princeps' : 'ninguno');
    const humor = obj(sen.humor) || {}, esc = obj(sen.escanos) || {};
    const ids = Array.isArray(sen.bandos) ? sen.bandos.map((b) => (b && typeof b === 'object' ? b.id : b)) : Object.keys(humor);
    // Un bando sin humor guardado (migración a medias) no cuenta: ni hostil ni a favor.
    const bandos = ids.filter((id) => typeof humor[id] === 'number' && isFinite(humor[id])).map((id) => ({ id, humor: humor[id], escanos: num(esc[id]) }));
    const hist = lista(obj(s.planSenado) && s.planSenado.historial);
    const pl = obj(s.planSenado), planesBien = pl && typeof pl.bienTotal === 'number' && isFinite(pl.bienTotal) ? pl.bienTotal : hist.filter((h) => h && h.juicio === 'bien').length;   // CE12: contador acumulado (el historial es corto)
    const cid = (G && typeof G.capital === 'function' && G.capital()) || s.capital || 'roma', c = obj(cities[cid]) || {};
    let bi = null;
    try { bi = G && typeof G.barrioInfo === 'function' ? G.barrioInfo(c) : null; } catch (e) { bi = null; }   // una ciudad rota no para el mes
    let cubiertos, total, casasUrbe = 0, casasTotal = 0;
    if (bi && lista(bi.barrios).length) {
      total = bi.barrios.length;
      cubiertos = bi.barrios.filter((b) => !b.falta && num(b.nivel) >= num(b.objetivo)).length;
    } else {
      total = 1;
      cubiertos = (bi ? lista(bi.falta).length === 0 : (num(c.barrio) || 1) >= 4) ? 1 : 0;
    }
    // CE12: casas de TODAS las ciudades propias, y las que están en barrios de nivel >= nivelUrbe (sin barrios, la población hace de casas: 20 por casa)
    Object.keys(cities).forEach((id) => {
      const ci = obj(cities[id]); if (!ci || ci.owner !== 'roma') return;
      let b2 = null; try { b2 = G && typeof G.barrioInfo === 'function' ? G.barrioInfo(ci) : null; } catch (e) { b2 = null; }
      if (b2 && lista(b2.barrios).length) b2.barrios.forEach((b) => { const k = num(b.casas); casasTotal += k; if (num(b.nivel) >= CIFRAS.ciudad.nivelUrbe) casasUrbe += k; });
      else { const k = Math.floor(num(ci.pop) / 20); casasTotal += k; if ((num(ci.barrio) || 1) >= CIFRAS.ciudad.nivelUrbe) casasUrbe += k; }
    });
    // CE12 (decidido por la coordinación, 24/11): si Cartago no está en el mapa (partida corta), cuenta la capital rival del modo.
    const modo = obj(s.modo) && D && D.MODOS ? D.MODOS[s.modo.id] : null;
    const corta = !cities.carthago && !!(modo && modo.capitalRival && cities[modo.capitalRival]);
    const objetivo = corta ? modo.capitalRival : 'carthago';
    return {
      cartago: !!(cities[objetivo] && cities[objetivo].owner === 'roma'), corta, objetivo: corta ? ((D.CITIES[objetivo] && D.CITIES[objetivo].n) || objetivo) : null, plazas,
      denarios: num(s.res && s.res.denarios) + num(s.alm && s.alm.denarios),
      renta: rentaAnual(s), ciudades: Math.max(1, Object.keys(cities).filter((id) => cities[id] && cities[id].owner === 'roma').length),
      rutas: obj(s.mercado) ? lista(mer.rutas).filter((r) => r && !r.parada).length : lista(s.rutas).filter((r) => r && !r.parada).length,   // mercado.js migra las rutas viejas sin borrarlas: no contar dos veces
      acuerdos, cargo, favorSenado, bandos, planesBien,
      barrios: { cubiertos, total }, casasUrbe, casasTotal, nivelUrbe: Math.max(1, num(c.barrio) || 1)
    };
  };

  // Fracción de escaños contentos y si algún bando es hostil.
  function apoyoBandos(f) {
    const b = lista(f.bandos), P = CIFRAS.politica;
    let tot = 0, ap = 0, hostil = false;
    b.forEach((x) => { if (!x) return; const e = num(x.escanos); tot += e; if (num(x.humor) >= P.humorApoyo) ap += e; if (num(x.humor) < P.hostil) hostil = true; });
    return { frac: tot > 0 ? ap / tot : 0, hostil, vacio: !b.length };
  }
  // Valor de cada hito desde la foto.
  CAM.VALOR = {
    armas: { cartago: (f) => (f.cartago ? 1 : 0), plazas: (f) => num(f.plazas) },
    comercio: { tesoro: (f) => num(f.renta), rutas: (f) => num(f.rutas), acuerdos: (f) => num(f.acuerdos) },
    politica: {
      princeps: (f) => (f.cargo === 'princeps' ? 1 : 0),
      bandos: (f) => {
        const a = apoyoBandos(f), P = CIFRAS.politica;
        if (a.vacio) return 0;
        if (!a.hostil && a.frac >= P.apoyo) return 1;
        return Math.min(0.99, a.frac / P.apoyo);
      },
      planes: (f) => num(f.planesBien)
    },
    ciudad: {
      barrios: (f) => { const t = num(f.barrios && f.barrios.total); return t > 0 ? num(f.barrios.cubiertos) / t : 0; },
      urbe: (f) => { const u = num(f.casasUrbe), t = num(f.casasTotal), C = CIFRAS.ciudad; return t > 0 && u / t >= C.fraccionUrbe ? u : Math.min(u, metaUrbe(f) - 1); }   // casas en barrios de nivel 4, si son la fracción pedida
    }
  };
  CAM.DATOS = [
    { id: 'armas', n: 'Camino de las armas', i: '⚔️', lema: 'Roma se impone por la espada',
      hitos: [{ id: 'cartago', n: 'Cartago tomada', meta: 1, unidad: 'hecho' }, { id: 'plazas', n: 'Plazas tomadas', meta: CIFRAS.armas.plazas, unidad: 'plazas' }],
      nota: 'Histórico: Cartago cae en 146 a.C. con Escipión Emiliano (Polibio 38.19-22; Apiano, Líbica 127-135). Licencia de juego: que sea un camino y no el fin, y la meta de plazas.' },
    { id: 'comercio', n: 'Camino del comercio', i: '🪙', lema: 'Roma prospera con sus tratos',
      hitos: [{ id: 'tesoro', n: 'Renta del año', meta: CIFRAS.comercio.rentaPorCiudad, unidad: 'denarios al año' }, { id: 'rutas', n: 'Rutas abiertas', meta: CIFRAS.comercio.rutas, unidad: 'rutas' }, { id: 'acuerdos', n: 'Acuerdos firmados', meta: CIFRAS.comercio.acuerdos, unidad: 'acuerdos' }],
      nota: 'Histórico: tratados con Cartago (Polibio 3.22-25) y alianza con Hierón II en 263 a.C. (Polibio 1.16). Licencia de juego: las metas de tesoro, rutas y acuerdos.' },
    { id: 'politica', n: 'Camino de la política', i: '🏛️', lema: 'Roma te sigue en el Senado',
      hitos: [{ id: 'princeps', n: 'Príncipe del Senado', meta: 1, unidad: 'hecho' }, { id: 'bandos', n: 'Apoyo de los bandos', meta: 1, unidad: 'apoyo' }, { id: 'planes', n: 'Planes bien juzgados', meta: CIFRAS.politica.planesBien, unidad: 'planes' }],
      nota: 'Histórico: el princeps senatus era el primer senador del censo; Q. Fabio Máximo lo fue en 209 a.C. (Livio 27.11.9-12). Licencia de juego: llegar a él por el favor y los bandos.' },
    { id: 'ciudad', n: 'Camino de la ciudad', i: '🏙️', lema: 'Roma crece y se cuida',
      hitos: [{ id: 'barrios', n: 'Barrios cubiertos', meta: CIFRAS.ciudad.cubiertos, unidad: 'barrios' }, { id: 'urbe', n: 'Casas en barrios de nivel ' + CIFRAS.ciudad.nivelUrbe, meta: CIFRAS.ciudad.casasPorCiudad, unidad: 'casas' }],
      nota: 'Histórico: Aqua Appia, 312 a.C. (Frontino, Acueductos 1.5); los ediles cuidan calles y mercados (Cicerón, Leyes 3.7). Licencia de juego: «barrios cubiertos» y «Urbs» como nivel.' }
  ];
  CAM.FUENTES = [
    { tema: 'Príncipe del Senado (princeps senatus): Q. Fabio Máximo, 209 a.C.', cita: 'Livio 27.11.9-12', dictamen: 'histórico' },
    { tema: 'Llegar a príncipe por el favor y los bandos', cita: 'Diseño de AQVILA', dictamen: 'licencia de juego' },
    { tema: 'Toma y destrucción de Cartago, 146 a.C., Escipión Emiliano', cita: 'Polibio 38.19-22; Apiano, Líbica 127-135', dictamen: 'histórico' },
    { tema: 'Cartago como un camino y no el fin de la partida', cita: 'Diseño de AQVILA', dictamen: 'licencia de juego' },
    { tema: 'Tratados con Cartago y comercio; alianza con Hierón II en 263 a.C.', cita: 'Polibio 3.22-25; Polibio 1.16', dictamen: 'histórico' },
    { tema: 'Metas de tesoro, rutas y acuerdos', cita: 'Diseño de AQVILA', dictamen: 'licencia de juego' },
    { tema: 'Aqua Appia, 312 a.C.; los ediles cuidan calles y mercados', cita: 'Frontino, Acueductos 1.5; Cicerón, Leyes 3.7', dictamen: 'histórico' },
    { tema: '«Barrios cubiertos» y «Urbs» como nivel', cita: 'Diseño de AQVILA', dictamen: 'licencia de juego' },
    { tema: 'Ganar con 3 de 4, sin plazo, con caminos que se pierden', cita: 'Decisión del usuario, 18/11', dictamen: 'licencia de juego' }
  ];

  // CE12: en la partida corta el hito de las plazas es menor y el de Cartago lee la capital rival.
  const metaUrbe = (f) => CIFRAS.ciudad.casasPorCiudad * Math.max(1, num(f.ciudades));   // casas pedidas: por ciudad propia
  function metaDe(h, f) { return h.id === 'plazas' && f.corta ? CIFRAS.armas.plazasCorta : h.id === 'urbe' ? metaUrbe(f) : h.id === 'tesoro' ? CIFRAS.comercio.rentaPorCiudad * Math.max(1, num(f.ciudades)) : h.meta; }
  CAM.evaluar = function (foto) {
    const f = obj(foto) || {};
    const caminos = CAM.DATOS.map((c) => {
      const hitos = c.hitos.map((h) => {
        const v = num(CAM.VALOR[c.id][h.id](f)), meta = metaDe(h, f);
        const n = h.id === 'cartago' && f.corta && f.objetivo ? f.objetivo + ' tomada' : h.n;
        return { id: h.id, n, v, meta, ok: v >= meta, avance: Math.max(0, Math.min(1, v / meta)) };
      });
      const avance = hitos.reduce((a, h) => a + h.avance, 0) / hitos.length;
      return { id: c.id, n: c.n, i: c.i, avance, cumple: hitos.every((h) => h.ok), hitos };
    });
    return { caminos, cumplen: caminos.filter((c) => c.cumple).length };
  };

  const vacio = () => ({ logrado: false, desde: null, sost: 0, fallo: 0, perdidoEn: null, veces: 0 });
  CAM.migrar = function (s) {
    if (!obj(s)) return null;
    let c = obj(s.caminos);
    if (!c) c = s.caminos = {};
    c.v = 1;
    const e = obj(c.estado) || (c.estado = {});
    CAM.ORDEN.forEach((id) => {
      const o = obj(e[id]) || (e[id] = vacio());
      o.logrado = !!o.logrado;
      ['sost', 'fallo', 'veces'].forEach((k) => { o[k] = Math.max(0, Math.floor(num(o[k]))); });
      ['desde', 'perdidoEn'].forEach((k) => { o[k] = typeof o[k] === 'number' && isFinite(o[k]) ? o[k] : null; });
    });
    const v = obj(c.victoria);
    c.victoria = v && typeof v.mes === 'number' && isFinite(v.mes) ? { mes: v.mes, caminos: lista(v.caminos).filter((x) => typeof x === 'string') } : null;
    c.victoriaVista = !!c.victoriaVista;
    c.avisos = lista(c.avisos).filter((a) => a && typeof a === 'object' && typeof a.texto === 'string').slice(-8);
    return c;
  };

  CAM.paso = function (s, foto, mes) {
    const c = CAM.migrar(s);
    const out = { efectos: [], logra: [], pierde: [], gana: false };
    if (!c) return out;
    const ev = CAM.evaluar(foto);
    const aviso = (texto, tono) => { out.efectos.push({ tipo: 'log', texto, tono }); c.avisos.push({ mes, texto, tono }); };
    ev.caminos.forEach((k) => {
      const e = c.estado[k.id], nom = CAM.DATOS.find((d) => d.id === k.id).n.replace('Camino', 'camino');
      if (k.cumple) { e.sost++; e.fallo = 0; } else e.sost = 0;
      if (!e.logrado) {
        if (k.cumple && e.sost >= CIFRAS.sostener[k.id]) {
          e.logrado = true; e.desde = mes; e.veces++; out.logra.push(k.id);
          aviso('Logras el ' + nom + '.', 'good');
        }
      } else if (!k.cumple) {
        e.fallo++;
        if (e.fallo >= CIFRAS.gracia) { e.logrado = false; e.perdidoEn = mes; e.sost = 0; out.pierde.push(k.id); aviso('Pierdes el ' + nom + '.', 'bad'); }
        else if (e.fallo === 1) aviso('Peligro: el ' + nom + ' flaquea. Te quedan ' + (CIFRAS.gracia - 1) + ' meses para recuperarlo.', 'warn');
      }
    });
    const ids = CAM.ORDEN.filter((id) => c.estado[id].logrado);
    if (c.victoria === null && ids.length >= CAM.necesarios(CAM.ORDEN.length)) {
      c.victoria = { mes, caminos: ids }; c.victoriaVista = false; out.gana = true;
      aviso('¡Victoria! Has logrado ' + ids.length + ' de ' + CAM.ORDEN.length + ' caminos. Puedes seguir jugando.', 'good');
    }
    c.avisos = c.avisos.slice(-8);
    return out;
  };

  function miles(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function textoHito(id, h) {
    if (h.ok) return 'Hecho';
    if (id === 'tesoro') return miles(h.v) + ' de ' + miles(h.meta) + ' denarios al año';
    if (id === 'barrios') return Math.round(h.v * 100) + ' % (meta ' + Math.round(h.meta * 100) + ' %)';
    if (id === 'urbe') return h.v + ' de ' + h.meta + ' casas en barrios de nivel ' + CIFRAS.ciudad.nivelUrbe;
    if (id === 'bandos') return Math.round(h.avance * 100) + ' % del apoyo';
    if (h.meta === 1) return 'Pendiente';
    return h.v + ' de ' + h.meta;
  }
  CAM.vista = function (s, foto) {
    const c = CAM.migrar(s) || { estado: {}, victoria: null, victoriaVista: false, avisos: [] };
    const ev = CAM.evaluar(foto);
    const caminos = ev.caminos.map((k) => {
      const d = CAM.DATOS.find((x) => x.id === k.id), e = c.estado[k.id] || vacio();
      return { id: k.id, n: k.n, i: k.i, lema: d.lema, avance: k.avance, cumple: k.cumple, logrado: e.logrado, sost: e.sost,
        sostMeta: CIFRAS.sostener[k.id], fallo: e.fallo, gracia: CIFRAS.gracia, perdido: e.perdidoEn !== null && !e.logrado,
        hitos: k.hitos.map((h) => ({ id: h.id, n: h.n, v: h.v, meta: h.meta, ok: h.ok, avance: h.avance, texto: textoHito(h.id, h) })) };
    });
    return { caminos, logrados: caminos.filter((k) => k.logrado).length, necesarios: CAM.necesarios(4), total: 4,
      victoria: c.victoria, nuevaVictoria: !!c.victoria && !c.victoriaVista, avisos: c.avisos };
  };
  CAM.marcarVista = function (s) { const c = CAM.migrar(s); if (c) c.victoriaVista = true; return c; };

  root.CAMINOS = CAM;
  if (typeof module !== 'undefined') module.exports = CAM;
})(typeof window !== 'undefined' ? window : globalThis);
