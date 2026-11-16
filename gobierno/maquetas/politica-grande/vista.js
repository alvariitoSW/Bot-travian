// EV2 · pantalla de «Gobernar Roma». Sin relojes: todo avanza cuando el jugador toca.
import * as R from './reglas.js';
const SEMILLA_FIJA = +new URLSearchParams(location.search).get('semilla') || 0, semillaNueva = () => SEMILLA_FIJA || (Date.now() % 2147483646) + 1; /* EV4a: cada partida, un año distinto */
import * as A from './arte.js';
const { BANDOS, CARGOS, ORDEN_CARGOS, ESTACIONES, PERSONAS } = R;
const CLAVE = 'aqvila-maqueta-ev4a', BS = ['ter', 'mer', 'mil'];
const $ = i => document.getElementById(i);
let e, ui, ov = {}, aviso = '', ultimoLugar = null;
const nuevoUI = () => ({ lugar: 'casa', paso: null, res: {}, rec: null, yo: {}, opc: null, tr: [], visto: {}, ajusteVisto: false });
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify({ e, ui })); } catch (_) { } }
function cargar() {
  try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.e && s.ui && s.e.cargos && s.e.marcas) { e = s.e; ui = Object.assign(nuevoUI(), s.ui); return; } } catch (_) { }
  e = R.crear(semillaNueva()); ui = nuevoUI();
}
const num = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const pers = id => PERSONAS.find(p => p.id === id);
const cargoDe = c => pers(e.cargos[c]);
const art = (html, cl = 'arte') => `<div class="${cl}">${html}</div>`;
const NOM_L = { cuestor: 'cuestor', edil: 'edil', pretor: 'pretor', censor: 'censor', consul: 'cónsul' };
const HIST = e0 => ESTACIONES[e0.estacion];

/* ---------- fichas de efecto ---------- */
function chip(c) {
  const bien = c.nota === 'rota' ? false : c.nota === 'cumplida' ? true : c.n > 0;
  const cl = bien ? 'b' : 'm', s = c.n > 0 ? '+' : '−', a = Math.abs(Math.round(c.n));
  let t, pt = '';
  if (c.que === 'oro') t = `${s}${a} de oro`;
  else if (c.que === 'pueblo') t = `Pueblo ${s}${a}`;
  else if (BS.includes(c.que)) { t = `${BANDOS[c.que].nombre} ${s}${a}`; pt = `<i style="--c:${BANDOS[c.que].color}"></i>`; }
  else if (c.que === 'obra') t = c.n > 0 ? 'Avanzan las obras' : 'Se frenan las obras';
  else t = c.n > 0 ? 'Crece la gente' : 'Se va gente';
  if (c.nota === 'rota') t += ' · promesa rota'; if (c.nota === 'cumplida') t += ' · promesa cumplida';
  return `<span class="chip ${cl}">${pt}${t}</span>`;
}
function chips(lista) {
  const m = new Map();
  for (const c of lista || []) { const k = c.que + (c.nota || ''); if (m.has(k)) m.get(k).n += c.n; else m.set(k, { ...c }); }
  const v = [...m.values()].filter(c => c.n !== 0);
  return v.length ? `<div class="chips">${v.map(chip).join('')}</div>` : '';
}
const hab = n => `<span class="hab">Hábil ${[1, 2, 3].map(i => `<u class="${i <= n ? 'l' : ''}"></u>`).join('')}</span>`;
const bandoBd = b => `<span class="bd"><i style="--c:${BANDOS[b].color}"></i>${BANDOS[b].nombre}</span>`;
const fuente = (f, d) => `<details><summary>Fuente</summary><p>${f}</p><p>Dictamen: ${d}</p></details>`;

/* ---------- barras ---------- */
function barra() {
  $('cab').innerHTML = `<div class="f1"><span class="est ins">${HIST(e)} · 264 a.C.</span><div class="cif"><span title="Oro">${A.icono('oro', 20)}${num(e.oro)}</span><span title="Ánimo del pueblo">${A.icono('pueblo', 20)}${num(e.pueblo)}</span></div></div>
<div class="f2"><div class="ban">${BS.map(b => `<span title="${BANDOS[b].nombre}"><i style="--c:${BANDOS[b].color}"></i>${num(e.humor[b])}</span>`).join('')}</div></div>`;
  const hay = { casa: hayCasa(), foro: e.estacion === 0 && !ui.visto.foro && !e.cerrado, curia: hayCuria() };
  $('nav').innerHTML = [['casa', 'Casa'], ['foro', 'Foro'], ['curia', 'Curia']].map(([l, n]) => `<button data-a="lugar" data-x="${l}" class="${ui.lugar === l ? 'on' : ''}">${A.icono(l, 24)}<span>${n}</span>${hay[l] ? '<i class="pto"></i>' : ''}</button>`).join('');
}
const hayCasa = () => e.cerrado || (e.ajuste === 'todo' && R.consultas(e).some(c => c.decidida === null && !c.laDecideElMagistrado));
const hayCuria = () => !e.cerrado && e.estacion <= 2 && e.ajuste !== 'nada' && !e.marcas['hecho' + e.estacion];

/* ---------- botón principal ---------- */
function botonCierre() {
  if (e.cerrado) return { txt: 'Gobernar otro año', a: 'otro' };
  const pc = R.puedeCerrar(e), n = ESTACIONES[e.estacion].toLowerCase(), art_ = n === 'verano' || n === 'otoño' ? 'el' : 'la';
  if (pc.ok) return { txt: `Cerrar ${art_} ${n}`, a: 'cerrar' };
  const f = pc.falta[0];
  if (/^votar/.test(f)) return { txt: 'Falta votar en la Curia', a: 'lugar', x: 'curia' };
  if (/^decidir qué/.test(f)) return { txt: 'Falta decidir en la Curia', a: 'lugar', x: 'curia' };
  return { txt: 'Falta contestar en Casa: ' + f.replace('decidir: ', ''), a: 'consultas' };
}
function pie(p, s) {
  $('pie').innerHTML = (p ? `<button id="principal" class="btn rojo" data-a="${p.a}" data-x="${p.x || ''}" ${p.off ? 'disabled' : ''}>${p.txt}</button>` : '') + (s ? `<button id="secundario" class="btn sec" data-a="${s.a}" data-x="${s.x || ''}">${s.txt}</button>` : '');
}

/* ---------- CASA ---------- */
const obrasIds = (f = () => true) => e.ciudad.obras.filter(f).map(o => o.id);
function casaHTML() {
  const nuevas = e.cerrado ? [] : e.ciudad.obras.filter(o => o.estacion === e.estacion - 1), ids = obrasIds(o => !nuevas.includes(o));
  let h = `<div class="vista" data-a="ciudad">${A.vistaCiudad({ obras: ids, nuevas: nuevas.map(o => o.id), estacion: e.estacion })}<span class="lupa">${A.icono('ciudad', 20)}</span>
<div class="rot"><b>Roma · ${num(e.ciudad.gente)} habitantes</b>${nuevas.length ? `<div class="nuevo">Nuevo: ${nuevas.map(o => nombreCorto(o.id)).join(', ')}</div>` : ''}</div></div>`;
  if (e.cerrado) return h + cierreHTML();
  h += `<div class="pan" id="ajuste"><div class="ins cap">Me consultan</div><div class="sw">${[['todo', 'Todo'], ['grande', 'Lo grande'], ['nada', 'Nada']].map(([k, n]) => `<button data-a="ajuste" data-x="${k}" class="${e.ajuste === k ? 'on' : ''}">${n}</button>`).join('')}</div>
<div class="lin">${{ todo: 'Los magistrados te preguntan cada asunto y tú votas en la Curia.', grande: 'Los magistrados deciden lo menor; tú votas en la Curia.', nada: 'Los magistrados lo deciden todo; el cónsul lleva lo grande al Senado por ti.' }[e.ajuste]}</div></div>`;
  h += `<div class="mesa">${A.casa()}<div class="ins cap2">Sobre tu mesa</div></div><div class="pan" style="margin-top:0;border-top:0">`;
  const ps = e.despachos.filter(d => d.estacion === e.estacion - 1);
  if (!ps.length) h += `<div class="nota">Mesina pide ayuda a Roma. El Senado espera tu palabra en la Curia.</div>`;
  else h += ps.map(d => { const p = pers(d.persona); return `<div class="parte"><div class="cara">${A.cara(d.persona, { tam: 44, bando: p.bando })}</div><div><b>${p.nombre}</b><div class="cg">${CARGOS[d.cargo].nombre} · ${CARGOS[d.cargo].ordenes.find(o => o.id === d.orden).titulo}</div><p>${d.texto}</p>${chips(d.cambios)}</div></div>`; }).join('');
  h += `</div>`;
  const cs = R.consultas(e);
  if (cs.length) {
    h += `<div class="tit" id="consultas">Te consultan</div>`;
    for (const c of cs) {
      const p = pers(e.cargos[c.cargo]);
      if (c.laDecideElMagistrado) h += `<div class="pan ap cons"><div class="q"><div class="cara">${A.cara(p.id, { tam: 44, bando: p.bando })}</div><div><h3>${c.titulo}</h3><div class="suave">Lo decide ${p.nombre.split(' ').slice(0, 2).join(' ')}</div></div></div></div>`;
      else h += `<div class="pan cons"><div class="q"><div class="cara">${A.cara(p.id, { tam: 44, bando: p.bando })}</div><div><div class="suave">${CARGOS[c.cargo].nombre} ${p.nombre.split(' ').slice(0, 2).join(' ')} pregunta</div><h3>${c.titulo}</h3></div></div><div class="suave" style="margin-top:4px">${c.texto}</div>`
        + c.opciones.map(o => `<button class="opc ${c.decidida === o.id ? 'on' : ''}" data-a="decidir" data-x="${c.id}" data-y="${o.id}" ${c.decidida !== null ? 'disabled' : ''}><b>${o.titulo}${c.decidida === o.id ? `<span class="marca">${A.icono('si', 20)}</span>` : ''}</b>${chips(o.chips)}</button>`).join('') + `</div>`;
    }
  }
  return h;
}
const nombreCorto = id => ({ calzada: 'calzada', fuente: 'fuente pública', graneros: 'graneros', mercado: 'mercado', casas: 'casas nuevas', templo: 'templo', muralla: 'muralla', muelle: 'muelle' }[id]);

function cierreHTML() {
  const c = R.cierre(e);
  let h = `<div class="tit d">El hilo de la historia</div><div class="pan">`;
  h += c.nudos.map(n => `<div class="nudo"><b class="ins" style="font-size:13px;color:var(--oro)">${n.estacion}</b><div class="l"><span>Pasó</span><span>${n.real}</span></div><div class="l"><span>Tú</span><span class="${n.igual ? 'ig' : 'dis'}">${n.tu} · ${n.igual ? 'igual' : 'distinto'}</span></div>${fuente(n.fuente, n.dictamen)}</div>`).join('');
  h += `</div><div class="pan"><h2>Te has apartado de la historia un ${c.desvio} %</h2><div style="margin-top:8px"><b class="ins" style="font-size:13px;color:var(--oro)">${c.rumbo.titulo}</b><p>${c.rumbo.frase}</p><p class="suave" style="margin-top:4px">${c.rumbo.viene}</p></div></div>`;
  h += `<div class="tit">La ciudad</div><div class="pan" style="padding:0;overflow:hidden">${A.vistaCiudad({ obras: obrasIds(), nuevas: [], estacion: 3 })}<div style="padding:10px 12px">De ${num(c.ciudad.genteIni)} a ${num(c.ciudad.genteFin)} habitantes, ${c.ciudad.nivel} ${c.ciudad.nivel === 1 ? 'obra' : 'obras'}.</div></div>`;
  h += `<div class="tit">Tus magistrados</div><div class="pan">` + c.magistrados.map(m => { const p = pers(m.persona); return `<div class="parte"><div class="cara">${A.cara(m.persona, { tam: 44, bando: p.bando })}</div><div style="flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><b>${p.nombre}</b><span class="jui ${m.juicio}">${{ bien: 'Bien', regular: 'Regular', mal: 'Mal' }[m.juicio]}</span></div><div class="cg">${CARGOS[m.cargo].nombre}</div></div></div>`; }).join('') + `</div>`;
  h += `<div class="tit">Promesas</div><div class="pan">${c.promesas.length ? c.promesas.map(p => `<div class="prom ${p.estado === 'rota' ? 'dis' : 'ig'}">${A.icono(p.estado === 'rota' ? 'no' : 'si', 20)}<span>${p.texto}: ${p.estado === 'rota' ? 'rota' : 'cumplida'}</span></div>`).join('') : '<div class="suave">No prometiste nada.</div>'}</div>`;
  return h + `<a class="rein" data-a="reiniciar" href="#">Empezar de nuevo</a>`;
}

/* ---------- FORO ---------- */
function foroHTML() {
  let h = `<div class="foro"><div class="arte">${A.foro()}</div><div class="mag">` + ORDEN_CARGOS.map(c => {
    const p = cargoDe(c), o = CARGOS[c].ordenes.find(x => x.id === e.ordenes[c]);
    return `<button class="m1" data-a="ficha" data-x="${c}">${A.cara(p.id, { tam: 64, bando: p.bando })}<span class="cg">${CARGOS[c].nombre}</span><b>${p.nombre.split(' ').slice(0, 2).join(' ')}</b><span class="et">${o.titulo}</span></button>`;
  }).join('') + `</div></div>`;
  const pv = [...new Set(e.promesas)];
  if (pv.length) h += `<div class="tit">Lo que has prometido</div><div class="pan">` + pv.map(p => `<div class="prom">${A.icono('promesa', 22)}<span>${p === 'levas' ? 'Sin levas en el campo este año <span class="suave">· a los terratenientes</span>' : 'Botín para la tropa <span class="suave">· a los militares</span>'}</span></div>`).join('') + `</div>`;
  return h;
}
function fichaHTML(c) {
  const p = cargoDe(c), C = CARGOS[c], ult = [...e.despachos].reverse().find(d => d.cargo === c);
  let h = `<div class="cent">${A.cara(p.id, { tam: 120, bando: p.bando })}<h2 style="margin-top:8px">${p.nombre}</h2><div class="suave">${C.nombre} <i>(${C.latin})</i> · ${C.lleva}</div>${bandoBd(p.bando)}${hab(p.habil)}</div>`;
  h += `<div class="pan"><div class="bien"><b>${p.bueno.titulo}</b>${p.bueno.texto}</div><div class="mal"><b>${p.malo.titulo}</b>${p.malo.texto}</div><p class="suave" style="margin-top:9px;font-size:13px">${p.nota}</p>${fuente(p.fuente, p.dictamen)}</div>`;
  h += `<div class="tit">Tu orden</div><div class="pan">` + C.ordenes.map(o => `<button class="opc ${e.ordenes[c] === o.id ? 'on' : ''}" data-a="orden" data-x="${c}" data-y="${o.id}"><b>${o.titulo}${e.ordenes[c] === o.id ? `<span class="marca">${A.icono('si', 20)}</span>` : ''}</b><span class="suave" style="font-size:13px">${o.texto}</span></button>`).join('') + `</div>`;
  if (ult) h += `<div class="tit">Su último parte</div><div class="pan"><p>${ult.texto}</p>${chips(ult.cambios)}</div>`;
  return h + `<div class="pad" style="margin-top:14px"><button class="btn sec" data-a="cands" data-x="${c}">Cambiar de ${NOM_L[c]}</button></div>`;
}
function candsHTML(c) {
  const actual = cargoDe(c);
  let h = `<div class="cent" style="padding-bottom:0"><h2>Candidatos a ${NOM_L[c]}</h2><div class="suave">${CARGOS[c].lleva}</div></div>`;
  for (const p of R.candidatos(e, c)) {
    const gratis = e.estacion === 0, sin = !gratis && e.oro < 30;
    h += `<div class="pan"><div class="cand"><div class="cara">${A.cara(p.id, { tam: 64, bando: p.bando })}</div><div><b>${p.nombre}</b>${bandoBd(p.bando)} ${hab(p.habil)}<p class="bi">${p.bueno.titulo}: ${p.bueno.texto}</p><p class="ma">${p.malo.titulo}: ${p.malo.texto}</p><p class="nt">${p.nota}</p></div></div>`
      + (p.ocupa ? `<div class="encargo">En el cargo</div>` : `<button class="btn rojo peq" style="margin-top:9px" data-a="nombrar" data-x="${c}" data-y="${p.id}" ${sin || e.cerrado ? 'disabled' : ''}>Nombrar</button>` + (gratis ? '' : `<div class="lin" style="text-align:center">Cuesta 30 de oro y enfada a los ${BANDOS[actual.bando].nombre.toLowerCase()}.${sin ? ' No te llega el oro.' : ''}</div>`)) + `</div>`;
  }
  return h;
}

/* ---------- CURIA ---------- */
const NV = { ter: 'terratenientes', mer: 'mercaderes', mil: 'militares' };
function asientos(v, reveladas) {
  const pos = A.asientosCuria(); let i = 0, o = '';
  for (const b of BS) {
    const x = v[b], lista = [...Array(x.si).fill('si'), ...Array(x.duda).fill('duda'), ...Array(x.no).fill('no')];
    for (const vt of lista) { const p = pos[i++], voto = reveladas && !reveladas.includes(b) ? null : vt; o += `<div class="sn" style="left:${((p.x - 13) / 3.9).toFixed(2)}%;top:${((p.y - 26) / 2.2).toFixed(2)}%;width:${(26 / 3.9).toFixed(2)}%">${A.senador({ bando: b, voto, tam: 26, banco: false })}</div>`; }
  }
  return o;
}
const cont = (si, du, no, fl = true) => `<div class="cont"><div class="si"><b>${si}</b>Sí</div><div><b>${du}</b>Dudan</div><div class="no"><b>${no}</b>No</div>${fl ? `<div class="fl"><b>${R.HACEN_FALTA}</b>Hacen falta</div>` : ''}</div>`;
const ley = `<div class="ley">${BS.map(b => `<span><i style="--c:${BANDOS[b].color}"></i>${BANDOS[b].nombre}</span>`).join('')}</div>`;
function simulaPueblo(id) { const c = structuredClone(e); try { return R.elegir(c, id).cambios; } catch (_) { return []; } }
function curiaHTML() {
  const est = e.estacion;
  if (e.cerrado) return `<div class="cur">${A.curia()}${asientos({ ter: { si: 0, duda: 12, no: 0 }, mer: { si: 0, duda: 8, no: 0 }, mil: { si: 0, duda: 10, no: 0 } }, [])}</div>${ley}<div class="cartel">El Senado no se reúne en invierno. El año está cerrado: mira el cierre en Casa.</div>`;
  const as = R.asunto(e), res = ui.res[est], rec = ui.rec && ui.rec.est === est ? ui.rec : null, hecho = !!e.marcas['hecho' + est] || !!e.marcas.pendiente;
  const nadaSinYo = e.ajuste === 'nada' && !ui.yo[est] && !res;
  const opts = as.opciones, opc = opts.find(o => o.id === ui.opc && !o.apagada) ? ui.opc : opts.find(o => !o.apagada).id;
  const cabeza = `<div class="pan"><h2>${as.titulo}</h2><div class="suave" style="font-size:13px;margin-top:2px">${as.fecha}</div><p style="margin-top:6px">${as.texto}</p>${fuente(as.fuente, as.dictamen)}</div>`;
  let v;
  if (res) {
    const rev = rec && rec.paso < 3 ? BS.slice(0, rec.paso) : null; v = res.votos;
    const sum = k => (rev || BS).reduce((s, b) => s + v[b][k], 0);
    let h = `<div class="cur">${A.curia()}${asientos(v, rev)}</div>${ley}${cont(sum('si'), sum('duda'), sum('no'))}`;
    if (rev) return h + cabeza;
    const pend = !!e.marcas.pendiente, tit = pend ? 'El Senado no se decide' : res.salio === 'cruzar' || res.salio === 'senado' ? 'Roma cruza a Sicilia' : (opts.find(o => o.id === res.salio) || { titulo: as.titulo }).titulo;
    h += `<div class="pan res"><h2>${pend ? tit : res.sale ? 'Aprobado: ' + tit : res.salio ? 'Tu propuesta cae. Sale: ' + tit : 'Tu propuesta cae: no sale nada'}</h2><p>${res.linea}</p>${chips(res.cambios)}${res.extra ? `<p style="margin-top:8px">${res.extra.linea}</p>${chips(res.extra.cambios)}` : ''}`;
    if (res.tr.length) h += `<div class="chips">` + res.tr.map(t => R.tratos(e).find(x => x.id === t)).map(t => `<span class="chip b">${A.icono('promesa', 16)}${t.titulo}</span>`).join('') + `</div>`;
    h += `</div>`;
    if (pend) h += `<div class="pan"><b>Qué haces</b><div class="suave" style="font-size:13px">Llevarlo al pueblo: ${chips(simulaPueblo('pueblo')).replace('chips', 'chips')}</div><div class="suave" style="font-size:13px;margin-top:6px">Acatar al Senado: ${chips(simulaPueblo('acatar'))}</div></div>`;
    return h + cabeza;
  }
  if (nadaSinYo) {
    return `<div class="cur">${A.curia()}${asientos(R.votos(e, opc, []), [])}</div>${ley}<div class="cartel">El cónsul ${cargoDe('consul').nombre.split(' ').slice(0, 2).join(' ')} llevará este asunto por ti al cerrar la estación.</div>${cabeza}`;
  }
  v = R.votos(e, opc, ui.tr);
  let h = `<div class="cur">${A.curia()}${asientos(v, null)}</div>${ley}${cont(v.si, v.duda, v.no)}${cabeza}`;
  h += `<div class="tit">${opts.length > 1 ? 'Qué propones' : 'Qué pasa si sale'}</div>` + opts.map(o => `<div class="pan" style="padding:0 10px 10px"><button class="opc ${o.id === opc && opts.length > 1 ? 'on' : ''}" data-a="opc" data-x="${o.id}" ${o.apagada ? 'disabled' : ''}><b>${o.titulo}${o.id === opc && opts.length > 1 ? `<span class="marca">${A.icono('si', 20)}</span>` : ''}</b>${o.apagada ? `<span class="suave" style="font-size:13px">${o.aviso || ''}</span>` : ''}${chips(o.chips)}</button></div>`).join('');
  h += `<div class="tit">Hablar con los bandos</div><div class="pan" style="padding-top:2px">` + R.tratos(e).map(t => { const on = ui.tr.includes(t.id), off = t.usado || (t.id === 'mer' && e.oro < 60 && !on); return `<button class="trato ${on ? 'on' : ''}" data-a="trato" data-x="${t.id}" ${off ? 'disabled' : ''}><b><span class="tp">${t.tipo}</span>${t.titulo}</b><p>${t.texto}${t.usado ? ' · ya usado' : ''}</p>${chips(t.chips)}<span class="ck">${on ? A.icono('si', 16) : ''}</span></button>`; }).join('') + `</div>`;
  return h;
}
function curiaPie() {
  const est = e.estacion; if (e.cerrado) return [botonCierre()];
  const res = ui.res[est], rec = ui.rec && ui.rec.est === est ? ui.rec : null;
  if (res && rec && rec.paso < 3) return [{ txt: 'Votan los ' + NV[BS[rec.paso]], a: 'revela' }];
  if (res && e.marcas.pendiente) return [{ txt: 'Llevarlo al pueblo', a: 'elegir', x: 'pueblo' }, { txt: 'Acatar al Senado', a: 'elegir', x: 'acatar' }];
  if (res) return [botonCierre()];
  if (e.ajuste === 'nada' && !ui.yo[est]) return [botonCierre(), { txt: 'Votar yo', a: 'yo' }];
  return [{ txt: 'Llamar a votar', a: 'llamar' }];
}

/* ---------- pantallas aparte ---------- */
function pasoHTML() {
  const d = ui.paso.desde, nuevas = e.ciudad.obras.filter(o => o.estacion >= d), est = ESTACIONES[e.estacion];
  return `<div class="pant pso"><div class="gran"><div class="ins">${est} de 264 a.C.</div><div class="suave" style="margin-top:6px">${num(e.ciudad.gente)} habitantes en Roma</div></div>${A.vistaCiudad({ obras: obrasIds(o => o.estacion < d), nuevas: nuevas.map(o => o.id), estacion: e.estacion })}
<div class="tit">Lo nuevo</div><ul class="lst" style="margin-bottom:6px">${nuevas.length ? nuevas.map(o => `<li>${A.icono('ciudad', 20)}${o.nombre}</li>`).join('') : `<li class="suave">La ciudad sigue como estaba.</li>`}</ul><div class="tit">Lo que dejaron tus magistrados</div>${chips(e.despachos.filter(x => x.estacion >= d).flatMap(x => x.cambios))}</div>
<div style="padding:8px 12px"><button id="principal" class="btn rojo" data-a="entrar">Entrar en casa</button></div>`;
}
function grandeHTML() {
  return `<div class="arr"><button data-a="volver">${A.icono('no', 18)}Volver</button></div><div class="pant"><div class="arte">${A.vistaCiudad({ obras: obrasIds(), nuevas: [], estacion: e.estacion })}</div><div class="tit">Obras de este año</div><ul class="lst">${e.ciudad.obras.length ? e.ciudad.obras.map(o => `<li><span style="flex:1">${o.nombre}</span><span class="suave">${ESTACIONES[o.estacion]}</span></li>`).join('') : '<li class="suave">Aún no se ha terminado ninguna obra.</li>'}</ul></div>`;
}

/* ---------- dibujo ---------- */
function dibuja() {
  barra();
  const capa = $('capa'), c = $('cuerpo');
  if (ui.paso || ov.ficha || ov.cands || ov.grande) $('pie').innerHTML = '';
  if (ui.paso) { capa.hidden = false; capa.innerHTML = pasoHTML(); return; }
  if (ov.ficha || ov.cands || ov.grande) {
    capa.hidden = false;
    capa.innerHTML = ov.grande ? grandeHTML() : `<div class="arr"><button data-a="${ov.cands ? 'ficha' : 'volver'}" data-x="${ov.cands || ''}">${A.icono('no', 18)}Volver</button></div><div class="pant">${ov.cands ? candsHTML(ov.cands) : fichaHTML(ov.ficha)}</div>`;
    return;
  }
  capa.hidden = true; capa.innerHTML = '';
  const y = ultimoLugar === ui.lugar ? c.scrollTop : 0;
  c.innerHTML = { casa: casaHTML, foro: foroHTML, curia: curiaHTML }[ui.lugar]();
  c.scrollTop = y;
  if (ultimoLugar !== ui.lugar) { c.classList.remove('fade'); void c.offsetWidth; c.classList.add('fade'); }
  ultimoLugar = ui.lugar;
  if (ui.lugar === 'curia') { const [p, s] = curiaPie(); pie(p, s); } else pie(botonCierre());
  if (aviso) { const t = document.createElement('div'); t.id = 'toast'; t.textContent = aviso; $('app').appendChild(t); aviso = ''; setTimeout(() => t.remove(), 2500); }
}
function sigue(f) { try { f(); } catch (err) { aviso = String(err.message || err); } guardar(); dibuja(); }

/* ---------- acciones ---------- */
const acciones = {
  lugar: x => { ov = {}; ui.lugar = x; if (x === 'foro') ui.visto.foro = true; $('cuerpo').scrollTop = 0; },
  ajuste: x => R.ajustar(e, x),
  ficha: x => { ov = { ficha: x }; }, volver: () => { ov = {}; }, cands: x => { ov = { cands: x }; }, ciudad: () => { ov = { grande: true }; },
  orden: (x, y) => R.ordenar(e, x, y),
  nombrar: (x, y) => { R.nombrar(e, x, y); ov = { ficha: x }; },
  decidir: (x, y) => R.decidir(e, x, y),
  opc: x => { ui.opc = x; }, trato: x => { ui.tr = ui.tr.includes(x) ? ui.tr.filter(t => t !== x) : [...ui.tr, x]; },
  yo: () => { ui.yo[e.estacion] = true; },
  llamar: () => {
    const as = R.asunto(e), opc = as.opciones.find(o => o.id === ui.opc && !o.apagada) ? ui.opc : as.opciones.find(o => !o.apagada).id, tr = [...ui.tr];
    const r = R.votar(e, opc, tr); ui.res[e.estacion] = { sale: r.sale, salio: r.salio, votos: r.votos, cambios: r.cambios, linea: r.linea, tr }; ui.rec = { est: e.estacion, paso: 0 };
  },
  revela: () => { ui.rec.paso++; if (ui.rec.paso >= 3) ui.rec = null; },
  elegir: x => { const r = R.elegir(e, x); ui.res[e.estacion].extra = r; const va = x === 'pueblo' && r.sale !== false; ui.res[e.estacion].sale = va; ui.res[e.estacion].salio = va ? 'cruzar' : 'acatar'; },
  consultas: () => { const t = document.getElementById('consultas'); if (t) t.scrollIntoView(); },
  cerrar: () => { const d = e.estacion; R.cerrarEstacion(e); if (d === 2) R.cerrarEstacion(e); ui.paso = { desde: d }; ui.lugar = 'casa'; ui.opc = null; ui.tr = []; ui.rec = null; ov = {}; ultimoLugar = null; },
  entrar: () => { ui.paso = null; ui.lugar = 'casa'; $('cuerpo').scrollTop = 0; },
  otro: () => { const aj = e.ajuste; e = R.crear(semillaNueva()); R.ajustar(e, aj); ui = Object.assign(nuevoUI(), { ajusteVisto: true }); ultimoLugar = null; },
  reiniciar: () => { e = R.crear(semillaNueva()); ui = nuevoUI(); ov = {}; ultimoLugar = null; },
};
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; ev.preventDefault();
  const f = acciones[b.dataset.a]; if (!f) return;
  if (b.dataset.a === 'consultas') { f(); return; }
  sigue(() => f(b.dataset.x, b.dataset.y));
});
cargar();
window.__ev2 = { estado: () => JSON.parse(JSON.stringify(e)), lugar: () => ui.lugar, lista: true };
dibuja();
