// EV8 · pantalla de «Gobierno y ciudad juntos». Consejo del año → Senado (juicio y cuestión de Estado) → ciudad (obras, actos)
// → terminar la estación → la ciudad marca qué cambió y por qué. Las reglas viven en reglas.js; el dibujo en arte.js y arte-escenas.js.
// Aquí solo se monta la pantalla y se atienden los toques. Diseño: DISENO-EV8.md.
import * as R from './reglas.js';
import * as A from './arte.js';
import * as EX from './arte-escenas.js';
const { BANDOS, BS, EDIFICIOS, SABERES, EDADES, K, CARGOS, ORDEN_CARGOS } = R;
const CLAVE = 'aqvila-maqueta-ev8';
const PARAM = new URLSearchParams(location.search), SEMILLA_FIJA = +PARAM.get('semilla') || 0;
const semillaNueva = () => (Date.now() % 2147483646) + 1;
const $ = i => document.getElementById(i);
const ROMANO = ['I', 'II', 'III'];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let e = null, ui, anim = null, CREDITOS = [];

/* ---------- escenas con respaldo si aún falta alguna ---------- */
const respaldo = t => `<svg viewBox="0 0 360 200" class="escena" role="img" aria-label="${t}"><rect width="360" height="200" fill="#d9bd84"/><path d="M0 150 H360 V200 H0Z" fill="#8a6034"/><text x="180" y="100" font-size="18" text-anchor="middle" fill="#4a3119" font-family="Georgia,serif">${t}</text></svg>`;
const ESC = {
  consejero: (c, g) => EX.consejero ? EX.consejero(c, g) : respaldo(CARGOS[c].nombre),
  consejo: () => EX.escenaConsejo ? EX.escenaConsejo() : respaldo('Consejo del año'),
  banquete: b => EX.escenaBanquete ? EX.escenaBanquete(b) : respaldo('Banquete'),
  juegos: t => EX.escenaJuegos ? EX.escenaJuegos(t) : respaldo('Juegos'),
  rito: () => EX.escenaRito ? EX.escenaRito() : respaldo('Rito en el templo'),
  senado: h => EX.escenaSenado ? EX.escenaSenado(h) : respaldo('El Senado'),
  triunfo: () => EX.caballoTriunfo ? EX.caballoTriunfo() : null,
};

/* ---------- guardar y cargar ---------- */
const nuevoUI = () => ({ tab: 'ciudad', verFuente: false, plan: [], juicioVisto: -1, informe: null, acto: null, zoom: { s: 1, x: 0, y: 0 }, ficha: null });
function guardar() { try { if (e) localStorage.setItem(CLAVE, JSON.stringify({ e, ui: { tab: ui.tab, plan: ui.plan, juicioVisto: ui.juicioVisto, informe: ui.informe, acto: ui.acto } })); } catch (_) { } }
function cargar() {
  try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.e && s.e.senadores && s.e.edif) { e = s.e; ui = Object.assign(nuevoUI(), s.ui); return; } } catch (_) { }
  e = null; ui = nuevoUI();
}
function nueva(semilla) { e = R.crear(semilla); ui = nuevoUI(); ui.tab = e.fase === 'consejo' ? 'consejo' : 'senado'; }

/* ---------- imágenes reales (imagenes/creditos.json, si ya está) ---------- */
fetch('imagenes/creditos.json').then(r => r.ok ? r.json() : []).then(j => { CREDITOS = Array.isArray(j) ? j : []; }).catch(() => { });
const imagen = id => CREDITOS.find(c => c.id === id && c.archivo);

/* ---------- iconos ---------- */
const IC = Object.assign({
  oro: '<circle cx="12" cy="12" r="8" fill="#e2b13c" stroke="#7a5212" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#7a5212" stroke-width="1.2"/>',
  grano: '<path d="M12 21V6" stroke="#7a5a1f" stroke-width="1.6"/><g fill="#e0b54a" stroke="#7a5a1f" stroke-width=".8"><ellipse cx="9.5" cy="8" rx="2" ry="3.2" transform="rotate(-25 9.5 8)"/><ellipse cx="14.5" cy="8" rx="2" ry="3.2" transform="rotate(25 14.5 8)"/><ellipse cx="9.5" cy="13" rx="2" ry="3.2" transform="rotate(-25 9.5 13)"/><ellipse cx="14.5" cy="13" rx="2" ry="3.2" transform="rotate(25 14.5 13)"/><ellipse cx="12" cy="4" rx="1.8" ry="2.8"/></g>',
  plebe: '<g fill="#c98a5a" stroke="#5a3418" stroke-width="1"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20c0-5 2.5-7 5-7s5 2 5 7z"/><path d="M11 20c0-5 2.5-7 5-7s5 2 5 7z"/></g>',
  favor: '<g stroke="#5a3418" stroke-width="1.2"><rect x="9" y="3" width="6" height="18" rx="1" fill="#b8862b"/><path d="M12 3v18" stroke="#7a5212"/><path d="M15 5l5-2v6l-5 1z" fill="#cfd3d6"/></g>',
  legion: '<path d="M6 3h12v11c0 4-3 6-6 7-3-1-6-3-6-7z" fill="#a3231a" stroke="#4a0d08" stroke-width="1.4"/><circle cx="12" cy="11" r="2.6" fill="#e2b13c"/><path d="M12 4v4M12 14v6M7 11h2.5M14.5 11H17" stroke="#e2b13c" stroke-width="1.2"/>',
  amenaza: '<path d="M2 15h20l-3 5H5z" fill="#3a3a52" stroke="#1a1a28" stroke-width="1"/><path d="M12 3v12" stroke="#4a3018" stroke-width="1.4"/><path d="M12 4l7 8h-7z" fill="#8d4fa0" stroke="#3a1a48" stroke-width=".8"/>',
  obra: '<g stroke="#6b4a26" stroke-width="1.6" fill="none"><path d="M5 21V5M12 21V5M19 21V5M3 8h18M3 13h18M3 18h18M5 13l7-5M12 18l7-5"/></g>',
  saber: '<rect x="4" y="5" width="16" height="14" rx="2" fill="#efe1bd" stroke="#6b4a26" stroke-width="1.4"/><circle cx="4" cy="12" r="2.4" fill="#b8862b" stroke="#6b4a26"/><circle cx="20" cy="12" r="2.4" fill="#b8862b" stroke="#6b4a26"/><path d="M8 9h8M8 12h8M8 15h5" stroke="#6b4a26" stroke-width="1.1"/>',
  edad: '<path d="M7 3h10M7 21h10M8 3c0 6 8 6 8 9s-8 3-8 9M16 3c0 6-8 6-8 9s8 3 8 9" fill="none" stroke="#6b4a26" stroke-width="1.6"/><path d="M10 18c1-1.5 3-1.5 4 0v2h-4z" fill="#e0b54a"/>',
  ciudad: '<path d="M3 20V11l4-3 4 3v9zM11 20v-7l5-4 5 4v7z" fill="#a98a66" stroke="#4a3119" stroke-width="1.2"/><path d="M2 11l5-4 5 4M10 13l6-5 6 5" fill="none" stroke="#b5562f" stroke-width="2"/>',
  senado: '<path d="M3 20h18M5 20v-8M9 20v-8M15 20v-8M19 20v-8M3 12h18L12 5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  consejo: '<circle cx="7" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="6" r="3" fill="currentColor"/><path d="M2 20c0-5 2-7 5-7M22 20c0-5-2-7-5-7M7 21c0-6 2-9 5-9s5 3 5 9" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  tribuno: '<circle cx="12" cy="6" r="3" fill="#c98a5a" stroke="#5a3418"/><path d="M6 21c0-7 3-10 6-10s6 3 6 10z" fill="#efe1bd" stroke="#5a3418"/><path d="M4 12l16 8" stroke="#a3231a" stroke-width="2.2"/>',
  promesa: '<path d="M4 12c3-3 5-3 8 0s5 3 8 0" fill="none" stroke="#6b4a26" stroke-width="2"/><path d="M6 15l3 3 3-3 3 3 3-3" fill="none" stroke="#6b4a26" stroke-width="1.6"/>',
}, A.ICONOS);
const ico = (n, cl = '') => `<svg viewBox="0 0 24 24" class="${cl}" aria-hidden="true">${IC[n] || IC.obra}</svg>`;
const icoLey = ley => ico({ reclutar: 'legion', socios: 'legion', leva: 'legion', obra: ley.obj || 'ciudad', estudiar: ley.obj || 'saber', edad: 'edad', impuestos: 'oro', granoBarato: 'grano' }[ley.tipo]);
const NOMBRE = { oro: 'Oro', grano: 'Grano', plebe: 'Plebe', favor: 'Favor', legiones: 'Legiones', amenaza: 'Amenaza' };
const signo = n => (n > 0 ? '+' : '−') + Math.abs(Math.round(n));
const texto = ley => R.leyTexto(ley, e);
const nbando = b => BANDOS[b].nombre.toLowerCase();

/* ---------- cabecera ---------- */
function cabecera() {
  const G = R.golpe(e), f = R.fuerza(e), g = G.esperado, tope = Math.max(f + G.enCola, G.max, 1) * 1.08, pc = v => (100 * v / tope).toFixed(1);
  const c = [['oro', 'Oro', e.oro, e.oro < 0], ['grano', 'Grano', e.grano, e.grano < 0], ['plebe', 'Plebe', e.plebe, e.plebe < 30], ['favor', 'Favor', e.favor, e.favor < 25]];
  $('cab').innerHTML = `<div class="fila"><span class="est">${R.nombreEstacion(e.turno)} · ${Math.min(e.turno + 1, K.turnos)}/${K.turnos}</span><span class="edad">Edad ${ROMANO[e.edad - 1]}</span></div>
  <div id="cifras">${c.map(([i, n, v, m]) => `<div class="cifra${m ? ' mal' : ''}" data-cifra="${i}">${ico(i)}<b>${Math.round(v)}</b><span>${n}</span></div>`).join('')}</div>
  <div class="pulso ${f >= g ? 'bien' : 'mal'}" data-cifra="fuerza">${ico('legion')}<span>Fuerza <b>${f}</b></span><div class="pista"><u style="left:${pc(G.min)}%;width:${(pc(G.max) - pc(G.min)).toFixed(1)}%"></u><s style="width:${pc(f + G.enCola)}%"></s><i style="width:${pc(f)}%"></i><em style="left:${pc(g)}%"></em></div><span>Golpe <b>${g}</b></span>${ico('amenaza')}</div>`;
}

function bandaSuceso() {
  const s = e.suceso; if (!s) return '';
  const ef = Object.entries(s.ef).filter(([, v]) => v).map(([k, v]) => `${NOMBRE[k] || k} ${signo(v)}`).join(' · ');
  const ic = s.ef.amenaza ? 'amenaza' : s.ef.legiones ? 'legion' : s.ef.grano ? 'grano' : s.ef.oro ? 'oro' : s.ef.plebe ? 'plebe' : 'favor';
  return `<div class="banda ro-papiro">${ico(ic)}<div><b>${s.titulo}</b>${s.texto} <i>${ef}</i></div></div>`;
}

/* ================= 1 · CONSEJO DEL AÑO ================= */
function tarjetaConsejero(c) {
  const C = CARGOS[c], enc = R.encargosPropuestos(e).filter(x => x.cargo === c), del = e.delegados[c];
  const filas = enc.map(x => {
    const on = ui.plan.includes(x.id), lleno = !on && ui.plan.length >= 3;
    return `<button class="encargo${on ? ' on' : ''}${x.puede ? '' : ' cuesta'}" data-a="encargo" data-x="${x.id}"${lleno ? ' aria-disabled="true"' : ''}>
      <span class="marca-sel">${on ? '✓' : ''}</span><span class="t">${esc(x.titulo)}</span><span class="da">${esc(x.da)}.</span>
      <span class="cu">${ico('oro')}${esc(x.cuestaTexto)}</span>${x.falta.length ? `<span class="falta">Falta: ${esc(x.falta.join('; '))}</span>` : ''}</button>`;
  }).join('');
  return `<div class="consejero ro-papiro"><div class="cara">${ESC.consejero(c, del ? 'contento' : '')}</div>
    <div class="quien"><b>${C.nombre}</b><span class="bando" style="--c:${BANDOS[C.bando].color}">de los ${nbando(C.bando)}</span><small>Lleva ${esc(C.area)}.</small>
    ${interruptor(c)}</div><div class="encargos">${filas}</div></div>`;
}
const interruptor = c => `<button class="interruptor${e.delegados[c] ? ' on' : ''}" data-a="delegar" data-x="${c}" role="switch" aria-checked="${!!e.delegados[c]}"><span class="op${e.delegados[c] ? '' : ' sel'}">A mano</span><span class="op${e.delegados[c] ? ' sel' : ''}">Delegado</span></button>`;
function pantallaConsejo() {
  if (e.fase !== 'consejo') return pantallaGobierno();
  return `<section class="ca"><div class="escena-marco">${ESC.consejo()}</div>
    <h2 class="ro-ansata">Consejo del año ${264 - Math.floor(e.turno / 4)} a.C.</h2>
    <p class="guia">Elige hasta <b>3 encargos</b>: es tu plan del año. El Senado juzgará si lo cumples.</p>
    <p class="guia peq"><b>Delegado</b>: el consejero empieza solo su parte (un poco más caro). <b>A mano</b>: lo empiezas tú en la ciudad.</p>
    <p class="cuenta-plan">Elegidos: <b>${ui.plan.length}</b> de 3</p></section>
    <section class="cb">${ORDEN_CARGOS.map(tarjetaConsejero).join('')}</section>`;
}

/* plan del año con su avance */
function bloquePlan(conBotones) {
  const plan = R.planDelAnio(e);
  if (!plan.length) return `<p class="vacio">Roma no tiene plan este año. El Senado lo castiga.</p>`;
  return plan.map(p => {
    const est = p.hecho ? 'hecho' : p.enCurso ? 'curso' : 'pend', del = e.delegados[p.cargo];
    const o = p.enCurso ? enCursoDe(p) : null;
    const pct = p.hecho ? 100 : o ? Math.round(100 * (o.hecho + .5) / (o.dura + .5)) : 4;
    const lab = p.hecho ? 'Hecho' : o ? `En obra · falta${o.dura - o.hecho > 1 ? 'n' : ''} ${o.dura - o.hecho} est.` : del ? `Lo empieza el ${CARGOS[p.cargo].nombre}` : 'Sin empezar';
    const enc = !p.hecho && !p.enCurso && conBotones ? R.encargosPropuestos(e).find(x => x.id === p.id) : null;
    const boton = enc ? `<button class="mini" data-a="empezar" data-x="${p.id}"${enc.puede ? '' : ' disabled'}>${enc.puede ? `Empezar (${esc(enc.cuestaTexto.split(';')[0])})` : esc(enc.falta[0] || 'No se puede aún')}</button>` : '';
    return `<div class="plan ${est}"><span class="t">${ico(p.tipo === 'obra' ? p.obj : p.tipo === 'legion' ? 'legion' : 'saber')}${esc(p.titulo)}</span><small>${CARGOS[p.cargo].nombre} · ${lab}</small><span class="barra"><i style="width:${pct}%"></i></span>${boton}</div>`;
  }).join('');
}
function enCursoDe(p) {
  return e.ordenes.find(o => (p.tipo === 'obra' && o.ley.tipo === 'obra' && o.ley.obj === p.obj) || (p.tipo === 'legion' && (o.ley.tipo === 'reclutar' || o.ley.tipo === 'legion')) || (p.tipo === 'saber' && o.ley.tipo === 'estudiar' && ('saber-' + o.ley.obj) === p.id));
}

/* pestaña Consejo fuera de la primavera: consejeros, plan, golpe, edad, leva */
function pantallaGobierno() {
  const G = R.golpe(e), f = R.fuerza(e), E = EDADES[e.edad + 1], pl = R.puedeLeva(e);
  const cons = ORDEN_CARGOS.map(c => `<div class="cargo-fila"><div class="cara-p">${ESC.consejero(c, e.delegados[c] ? 'contento' : '')}</div><div><b>${CARGOS[c].nombre}</b><small>de los ${nbando(CARGOS[c].bando)}</small></div>${interruptor(c)}</div>`).join('');
  const ordenes = e.ordenes.map(o => { const t = texto(o.ley), falta = o.dura - o.hecho; return `<div class="orden">${icoLey(o.ley)}<span>${esc(t.titulo)}</span><small>${o.retraso ? `<b class="tarde">Retrasada: ${o.retraso}.</b> ` : ''}Falta${falta > 1 ? 'n' : ''} ${falta} est.${o.oro || o.grano ? ` · ${o.oro ? o.oro + ' oro' : ''}${o.oro && o.grano ? ' y ' : ''}${o.grano ? o.grano + ' grano' : ''} por estación` : ''}</small></div>`; }).join('');
  const prom = e.promesas.map(p => `<div class="orden">${ico('promesa')}<span>Promesa a los ${nbando(p.bando)}</span><small>Aprueba una ley que les guste antes de la estación ${p.vence + 2}</small></div>`).join('');
  const req = E ? `<ul class="req">${[`<li class="${e.saberes.length >= E.saberes ? 'ok' : 'no'}">${E.saberes} saberes (tienes ${e.saberes.length})</li>`].concat(Object.keys(E.edif).map(k => `<li class="${e.edif[k] >= E.edif[k] ? 'ok' : 'no'}">${EDIFICIOS[k].nombre} a nivel ${E.edif[k]} (tienes ${e.edif[k]})</li>`), ['<li class="no">Y que el Senado vote «Pasar de edad»</li>']).join('')}</ul>` : '';
  return `<section class="ca"><h2 class="ro-ansata">Tus consejeros</h2><div class="bloque">${cons}<p class="vacio">Delegado: al terminar la estación empieza solo su parte del plan (cuesta un ${Math.round(K.delegaSobre * 100)} % más).</p></div>
    <div class="bloque"><h3 class="ro-rubrica">${ico('obra')}Plan del año</h3>${bloquePlan(true)}</div></section>
    <section class="cb"><div class="amenaza ro-papiro"><b>Golpe de Cartago al final.</b> Ahora ${e.amenaza}; llegará a unos <b>${G.esperado}</b> (entre ${G.min} y ${G.max}). Tus fuerzas: <b>${f}</b>${G.enCola ? `; en camino +${G.enCola}` : ''}.
    <button class="pasar leva" data-a="leva"${pl.ok ? '' : ' disabled'}>${pl.ok ? `Pagar una leva ya (${pl.oro} oro, −${pl.favor} favor)` : `Leva: ${esc(pl.porque.toLowerCase())}`}</button></div>
    ${E ? `<div class="bloque"><h3 class="ro-rubrica">${ico('edad')}Para la Edad ${ROMANO[E.n - 1]} «${E.nombre}»</h3>${req}</div>` : ''}
    <div class="bloque"><h3 class="ro-rubrica">${ico('favor')}En marcha</h3>${ordenes || '<p class="vacio">Nada en marcha.</p>'}${prom}</div></section>`;
}

/* ================= 2 · CIUDAD ================= */
const recorta = (a, d) => { const pa = String(a).split(' '), pd = String(d).split(' '); let k = 0; while (k < pa.length - 1 && k < pd.length - 1 && pa[k] === pd[k]) k++; return k ? `${pa.slice(0, k).join(' ')} ${pa.slice(k).join(' ')} → ${pd.slice(k).join(' ')}` : `${a} → ${d}`; };
const corto = (s, n = 30) => s.length > n ? s.slice(0, n - 1) + '…' : s;
function marcasCiudad() {
  const out = [], inf = ui.informe;
  if (inf && (inf.turno === e.turno - 1 || e.fase === 'fin')) {
    for (const c of inf.cambiosCiudad || []) { const ley = /^Orden cumplida/.test(c.porque || ''); out.push({ ley, sitio: c.sitio, texto: corto((ley ? 'Ley: ' : '') + (/^Sin /.test(c.antes) ? c.despues.split(':')[0] : recorta(c.antes, c.despues))) }); }
    for (const l of inf.aprobadas || []) { const t = texto(l); if (!out.some(m => m.ley && m.sitio === t.sitio)) out.push({ sitio: t.sitio, texto: corto('Ley: ' + t.titulo.replace(/^Estudiar: /, '')) }); }
  }
  if (ui.acto && ui.acto.turno === e.turno) for (const c of ui.acto.cambiosCiudad || []) out.push({ sitio: c.sitio, texto: corto(recorta(c.antes, c.despues)) });
  return out;
}
function dibujoCiudad(opc = {}) {
  const obras = e.ordenes.filter(o => o.ley.tipo === 'obra').map(o => o.ley.obj);
  return A.ciudad({ edif: e.edif, legiones: e.legiones, edad: e.edad, estacion: R.estacionVisual(e), obras, plebe: e.plebe }, opc);
}
function quePorQue() {
  const inf = ui.informe; if (!inf || !(inf.turno === e.turno - 1 || e.fase === 'fin')) return '';
  const L = [];
  for (const l of inf.aprobadas || []) L.push(['favor', `<b>Ley aprobada:</b> ${esc(texto(l).ciudad)}`]);
  for (const c of inf.cambiosCiudad || []) L.push([c.sitio in EDIFICIOS ? c.sitio : c.sitio === 'plebe' ? 'plebe' : 'ciudad', `<b>${esc(recorta(c.antes, c.despues))}</b>: ${esc(c.porque)}.`]);
  for (const d of inf.delegaron || []) L.push(['consejo', esc(d)]);
  const tot = {}; for (const c of inf.cambios || []) if (['oro', 'grano', 'plebe', 'favor'].includes(c.que)) tot[c.que] = (tot[c.que] || 0) + c.n;
  const cifras = Object.entries(tot).filter(([, v]) => Math.round(v)).map(([k, v]) => `<span class="${v > 0 ? 'b' : 'm'}">${NOMBRE[k]} ${signo(v)}</span>`).join('');
  return `<div class="bloque cambios"><h3 class="ro-rubrica">${ico('ciudad')}Qué ha cambiado y por qué</h3>${L.map(([i, t]) => `<div class="cambio">${ico(i)}<span>${t}</span></div>`).join('') || '<p class="vacio">Nada nuevo en la ciudad.</p>'}
    ${cifras ? `<div class="totales">${cifras}</div>` : ''}<button class="mini" data-a="limpiar">Quitar las marcas</button></div>`;
}
function pantallaCiudad() {
  const inf = ui.informe, nuevo = inf && inf.turno === e.turno - 1 ? (inf.nuevo || []).filter(x => x.tipo === 'edificio').map(x => x.id) : [];
  const fin = e.fase === 'fin';
  const svg = dibujoCiudad({ marcas: marcasCiudad(), nuevo: fin ? R.ORDEN_EDIF.filter(k => e.edif[k] >= 2) : nuevo, sel: ui.ficha });
  const ac = R.actos(e), hecho = e.actoTurno === e.turno;
  const obras = e.ordenes.filter(o => o.ley.tipo === 'obra');
  return `<section class="ca"><div class="lienzo" id="lienzo"><div class="mapa" id="mapa">${svg}</div>
    <div class="zoom"><button data-a="zoom" data-x="1" aria-label="Acercar">+</button><button data-a="zoom" data-x="-1" aria-label="Alejar">−</button><button data-a="zoom" data-x="0" aria-label="Ver entera">⤢</button></div>
    ${fin ? `<div class="rotulo-fin">${e.fin.gana ? 'Roma triunfa' : esc(e.fin.titulo)}</div>` : ''}</div>
    <p class="pista-toque">Toca un edificio para verlo y mejorarlo. Pellizca o usa + y − para acercar.</p></section>
    <section class="cb">${quePorQue()}${e.turno === 0 || (ui.informe && ui.informe.turno === e.turno - 1) ? bandaSuceso() : ''}
    ${fin ? '' : `<button class="boton-acto ro-bronce" data-a="actos"${hecho ? ' disabled' : ''}>${hecho ? 'Ya hiciste el acto de esta estación' : 'Actos de la estación: banquete, juegos o rito'}</button>`}
    <div class="bloque"><h3 class="ro-rubrica">${ico('obra')}Plan del año</h3>${bloquePlan(!fin)}</div>
    <div class="bloque"><h3 class="ro-rubrica">${ico('ciudad')}Recursos de Roma</h3>
    <div class="recursos"><span>${ico('legion')}<b>${e.legiones}</b> legiones (caben ${R.topeLegiones(e)})</span><span>${ico('saber')}<b>${e.saberes.length}</b> saberes</span><span>${ico('plebe')}<b>${Math.round(e.pob)}</b> mil vecinos</span><span>${ico('obra')}<b>${obras.length}</b> obras (a la vez: ${e.edif.foro + K.obrasForo})</span></div>
    ${e.saberes.length ? `<div class="fichas">${e.saberes.map(id => `<span class="ficha">${ico(id)}${SABERES[id].nombre}</span>`).join('')}</div>` : ''}
    ${ac.length && !fin ? `<p class="vacio">${esc(R.consejo(e).split(/(?<=\.) /)[0])}</p>` : ''}</div></section>`;
}

/* zoom y arrastre del dibujo */
function aplicaZoom() {
  const L = $('lienzo'), M = $('mapa'); if (!L || !M) return;
  const z = ui.zoom, W = L.clientWidth, H = L.clientHeight;
  z.s = Math.max(1, Math.min(4, z.s)); z.x = Math.min(0, Math.max(W - W * z.s, z.x)); z.y = Math.min(0, Math.max(H - H * z.s, z.y));
  M.style.transform = `translate(${z.x.toFixed(1)}px,${z.y.toFixed(1)}px) scale(${z.s.toFixed(3)})`;
}
function zoomEn(s, cx, cy) { const z = ui.zoom, k = s / z.s; z.x = cx - (cx - z.x) * k; z.y = cy - (cy - z.y) * k; z.s = s; aplicaZoom(); }
function enfocar(sitio, s = 2.4) {
  const L = $('lienzo'), p = A.SITIO && A.SITIO[sitio]; if (!L || !p) return;
  const W = L.clientWidth, H = L.clientHeight, px = (p[0] - 14) / 386 * W, py = (p[1] - 28) / 292 * H;
  ui.zoom = { s, x: W / 2 - px * s, y: H / 2 - py * s }; aplicaZoom();
}
const punteros = new Map(); let gesto = null, arrastro = false;
document.addEventListener('pointerdown', ev => {
  const L = ev.target.closest('#lienzo'); if (!L || ev.target.closest('.zoom')) return;
  punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); arrastro = false;
  gesto = { z: Object.assign({}, ui.zoom), p: [...punteros.values()].map(p => ({ ...p })), r: L.getBoundingClientRect() };
});
document.addEventListener('pointermove', ev => {
  if (!punteros.has(ev.pointerId) || !gesto) return;
  punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  const ps = [...punteros.values()], g = gesto;
  if (ps.length >= 2 && g.p.length >= 2) {
    const d0 = Math.hypot(g.p[0].x - g.p[1].x, g.p[0].y - g.p[1].y) || 1, d1 = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    const cx = (g.p[0].x + g.p[1].x) / 2 - g.r.left, cy = (g.p[0].y + g.p[1].y) / 2 - g.r.top, nx = (ps[0].x + ps[1].x) / 2 - g.r.left, ny = (ps[0].y + ps[1].y) / 2 - g.r.top;
    const s = Math.max(1, Math.min(4, g.z.s * d1 / d0)), k = s / g.z.s;
    ui.zoom = { s, x: nx - (cx - g.z.x) * k, y: ny - (cy - g.z.y) * k }; arrastro = true; aplicaZoom();
  } else if (ps.length === 1) {
    const dx = ps[0].x - g.p[0].x, dy = ps[0].y - g.p[0].y;
    if (Math.abs(dx) + Math.abs(dy) > 8) arrastro = true;
    if (arrastro) { ui.zoom = { s: g.z.s, x: g.z.x + dx, y: g.z.y + dy }; aplicaZoom(); }
  }
});
const suelta = ev => { punteros.delete(ev.pointerId); if (gesto) gesto = punteros.size ? { z: Object.assign({}, ui.zoom), p: [...punteros.values()].map(p => ({ ...p })), r: gesto.r } : null; };
document.addEventListener('pointerup', suelta); document.addEventListener('pointercancel', suelta);

/* ficha de edificio (hoja desde abajo) */
function ficha(id) {
  const F = R.fichaEdificio(e, id), C = CARGOS[F.cargo];
  const marcas = [1, 2, 3].map(n => `<i class="${n <= F.nivel ? 'si' : ''}">${ROMANO[n - 1]}</i>`).join('');
  const obra = F.enObra ? `<p class="en-obra">${ico('obra')}En obra hacia el nivel ${F.enObra.nivel}: falta${F.enObra.faltan > 1 ? 'n' : ''} ${F.enObra.faltan} estaci${F.enObra.faltan > 1 ? 'ones' : 'ón'} (${F.enObra.mano ? 'a mano' : 'la lleva el ' + C.nombre}).</p>` : '';
  const coste = `${F.coste.oro} oro${F.coste.grano ? ` y ${F.coste.grano} grano` : ''}`;
  const boton = F.nivel >= F.max ? '<button class="boton" disabled>Ya está en el nivel más alto</button>'
    : F.enObra ? '<button class="boton" disabled>Ya está en obra</button>'
      : `<button class="boton ro-sello" data-a="mejorar" data-x="${id}"${F.puede ? '' : ' disabled'}>Mejorar a nivel ${F.nivel + 1} (${coste})</button>`;
  capa(`<div class="asa"></div><div class="ficha-cab"><div class="ficha-ico">${ico(id)}</div><div><h2>${esc(F.nombre)}</h2><div class="niveles">${marcas}<span>Nivel ${F.nivel} de ${F.max}</span></div></div></div>
    <dl class="datos"><dt>Ahora</dt><dd>${esc(F.produce || 'Nada todavía')}</dd>
    ${F.produceSiguiente ? `<dt>Al subir</dt><dd class="sube">${esc(F.produceSiguiente)}${F.dura ? ` · tarda ${F.dura} est.` : ''}</dd>` : ''}
    <dt>Lo lleva</dt><dd><span class="lleva">${C.nombre}, de los ${nbando(C.bando)}${F.enPlan ? ' · está en el plan' : ''}</span>${interruptor(F.cargo)}</dd>
    ${F.falta.length ? `<dt>Falta</dt><dd class="falta">${esc(F.falta.join('. '))}.</dd>` : ''}</dl>${obra}
    ${boton}<p class="fuente">Fuente: ${esc(F.fuente)} · ${esc(F.dictamen)}</p>
    <button class="boton2" data-a="cerrar">Cerrar</button>`, 'abajo ficha-edif');
}

/* actos de la estación */
function menuActos() {
  const ac = R.actos(e);
  capa(`<h2 class="ro-ansata">Actos de la estación</h2><p class="guia">Uno por estación. Cada acto enseña algo de la Roma de 264 a.C.</p>
    ${ac.map(a => `<div class="acto ro-papiro"><b>${esc(a.titulo)}</b><p>${esc(a.texto)}</p>
    ${a.tipo === 'banquete' ? `<div class="bandos">${a.bandos.map(b => `<button class="bando-b" style="--c:${BANDOS[b].color}" data-a="acto" data-x="banquete" data-b="${b}"${a.puede ? '' : ' disabled'}>Con los ${nbando(b)}</button>`).join('')}</div><small>Cuesta ${a.oro} oro.${a.puede ? '' : ' ' + esc(a.porque) + '.'}</small>`
      : `<button class="boton ro-sello" data-a="acto" data-x="${a.tipo}"${a.puede ? '' : ' disabled'}>${a.puede ? `${a.tipo === 'juegos' ? 'Dar los juegos' : 'Hacer el rito'} (${a.oro} oro)` : esc(a.porque)}</button>`}</div>`).join('')}
    <button class="boton2" data-a="cerrar">Volver a la ciudad</button>`, 'actos');
}
function escenaActo(r, bando) {
  if (r.tipo === 'banquete') return ESC.banquete(bando);
  if (r.tipo === 'juegos') return ESC.juegos(r.aprende && r.aprende.imagen === 'circo' ? 'carreras' : 'gladiadores');
  return ESC.rito();
}
function verActo(r, bando) {
  const ef = (r.efectos || []).filter(x => x.n).map(x => `<span class="${(x.que === 'oro' ? x.n > 0 : x.n > 0) ? 'b' : 'm'}">${NOMBRE[x.que] || x.que} ${signo(x.n)}</span>`).join('');
  capa(`<h2 class="ro-ansata">${esc(r.titulo)}</h2><div class="escena-marco">${escenaActo(r, bando)}</div>
    <div class="totales">${ef}</div>${r.confidencia ? `<p class="confidencia">«${esc(r.confidencia)}»</p>` : ''}
    <button class="boton ro-sello" data-a="aprende">Aprendes: un dato de la época</button>`, 'acto-ver');
}
function verAprende() {
  const a = ui.acto && ui.acto.aprende; if (!a) return cierraCapa();
  const im = imagen(a.imagen);
  capa(`<h2 class="ro-ansata">Aprendes</h2>
    ${im ? `<figure class="museo"><img src="imagenes/${esc(im.archivo)}" alt="${esc(im.titulo)}"><figcaption><b>${esc(im.titulo)}</b>${im.fecha ? ` · ${esc(im.fecha)}` : ''}${im.pie ? `<span>${esc(im.pie)}</span>` : ''}
      <span class="credito-img">${esc(im.museo || '')}${im.museo ? ' · ' : ''}Autor: ${esc(im.autor || 'desconocido')} · Licencia: ${esc(im.licencia || '—')}${im.url ? ` · <a href="${esc(im.url)}" target="_blank" rel="noopener">ver original</a>` : ''}</span></figcaption></figure>` : ''}
    <p class="dato">${esc(a.texto)}</p><p class="fuente">Fuente: ${esc(a.fuente)} · ${esc(a.dictamen)}</p>
    <button class="boton ro-sello" data-a="cerrar">Volver a la ciudad</button>`, 'aprende');
}

/* ================= 3 · SENADO ================= */
const ASIENTOS = (() => { const out = []; [[7, 66], [10, 94], [13, 122]].forEach(([n, r]) => { for (let k = 0; k < n; k++) { const a = Math.PI - (k + 0.5) * Math.PI / n; out.push({ x: 195 + r * Math.cos(a), y: 140 - r * Math.sin(a), a }); } }); return out.sort((p, q) => q.a - p.a || p.y - q.y); })();
const JEFE = { ter: [6, 92, 60], mer: [167, 86, 56], mil: [324, 92, 60] };
// el retrato de arte.js pone un «?» en un sello cuando duda: aquí se quita y se dice en palabras debajo
const retratoEn = (b, gesto) => { const [x, y, w] = JEFE[b]; return A.retrato(b, BANDOS[b].color, gesto).replace(/<circle cx="54" cy="58" r="8" fill="#fffaf0"[^>]*\/><text[^>]*>\?<\/text>/, '').replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${w * 72 / 64}" `); };
const PALABRA = { si: 'a favor', no: 'en contra', duda: 'dudan' };
function hemiciclo(estado, gestos = {}, id = '') {
  let g = `<path d="M60 144 A135 135 0 0 1 330 144" fill="none" stroke="rgba(110,70,25,.2)" stroke-width="46"/><path d="M40 146 H350" stroke="#8a6034" stroke-width="5"/>`;
  if (e.plebe < R.TRIBUNO.umbral) g += `<g transform="translate(352 4) scale(1.3)">${IC.tribuno}</g><text x="368" y="44" font-size="11" text-anchor="middle" fill="#9b2a1a" font-weight="700">Tribuno</text>`;
  e.senadores.forEach((s, i) => { const p = ASIENTOS[i]; g += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" data-asiento="${s.i}">${estado(s)}</g>`; });
  BS.forEach(b => {
    const [x, y, w] = JEFE[b], an = b === 'ter' ? ['start', 2] : b === 'mil' ? ['end', 388] : ['middle', x + w / 2], yt = y + w * 72 / 64 + 13;
    g += `<g data-jefe="${b}">${retratoEn(b, gestos[b] || '')}</g><text x="${an[1]}" y="${yt}" font-size="13" font-weight="700" text-anchor="${an[0]}" fill="${BANDOS[b].color}">${BANDOS[b].corto} ${e.escanos[b]}</text><text data-palabra="${b}" x="${an[1]}" y="${yt + 14}" font-size="12" font-weight="700" text-anchor="${an[0]}" fill="#3b2a16">${PALABRA[gestos[b]] || ''}</text>`;
  });
  return `<svg viewBox="0 0 390 196" aria-label="Hemiciclo del Senado" ${id ? `id="${id}"` : ''}>${g}</svg>`;
}
const asiento = (b, clase) => A.asiento(BANDOS[b].color, clase);
function gestosPrevision(pv) {
  const o = {}; if (!pv) return o;
  BS.forEach(b => { const x = pv.bandos[b], n = x.seguros + x.dudosos + x.contra; o[b] = x.seguros * 2 > n ? 'si' : x.contra * 2 >= n ? 'no' : 'duda'; });
  return o;
}
function pantallaJuicio() {
  const J = R.juicio(e), humor = e.plebe < K.revuelta.umbral + 5 ? 'revuelta' : J.total < 0 ? 'mal' : 'bien';
  return `<section class="ca"><div class="escena-marco">${ESC.senado(humor)}</div><h2 class="ro-ansata">El Senado te juzga</h2></section>
    <section class="cb"><div class="juicio ro-papiro">${J.lineas.map(l => `<div class="linea ${l.n > 0 ? 'b' : l.n < 0 ? 'm' : ''}"><span class="mk">${l.marca}</span><span>${esc(l.texto)}</span>${l.n ? `<b>${signo(l.n)}</b>` : ''}</div>`).join('')}
    <div class="linea total"><span>Favor del Senado</span><b>${J.total ? signo(J.total) : '='} → ${e.favor}</b></div></div>
    ${bandaSuceso()}</section>`;
}
function pantallaSenado() {
  if (e.fase === 'consejo') return `<section class="ca"><p class="vacio centro">Primero, el consejo del año: elige el plan.</p><button class="boton ro-sello" data-a="tab" data-x="consejo">Ir al consejo del año</button></section>`;
  if (e.fase === 'senado' && ui.juicioVisto !== e.turno) return pantallaJuicio();
  if (e.fase !== 'senado') {
    const r = e.recuento, g = {};
    if (r) BS.forEach(b => { const v = r.votos.filter(x => x.bando === b), s = v.filter(x => x.si).length; g[b] = s * 2 > v.length ? 'si' : 'no'; });
    return `<section class="ca"><div class="hemi">${hemiciclo(s => r ? asiento(s.bando, r.votos.find(v => v.i === s.i).si ? 'si' : 'no') : asiento(s.bando, ''), g)}</div></section>
      <section class="cb"><p class="resultado ${r && r.aprobada ? 'bien' : 'mal'}">${r ? (r.aprobada ? 'Aprobada' : r.veto ? 'Vetada por el tribuno' : 'Rechazada') + ` · ${r.si} a ${r.no}` : 'Esta estación no se votó'}</p>
      ${r ? `<p class="guia">${esc(texto(r.ley).titulo)}. ${r.aprobada ? 'En la ciudad: ' + esc(texto(r.ley).ciudad) : 'No se cumplirá.'}</p>` : ''}
      <p class="vacio centro">El Senado vuelve a reunirse la próxima estación.</p></section>`;
  }
  const pv = R.prevision(e);
  const est = s => pv ? asiento(s.bando, pv.por.find(p => p.i === s.i).clase) : asiento(s.bando, '');
  const cuenta = pv ? `<div class="cuenta"><span><b>${pv.seguros}</b> seguros</span><span><b>${pv.dudosos}</b> dudan</span><span><b>${pv.contra}</b> en contra</span><span>· mayoría <b>${K.mayoria}</b></span></div>`
    : `<div class="cuenta"><span>Elige una ley: los jefes te dirán qué piensan.</span></div>`;
  const cartas = e.cartas.map((ley, i) => {
    const t = texto(ley), on = e.sel === i, eb = R.efectoBando(ley), pl = R.plantillaOrden(e, ley);
    const gus = BS.filter(b => eb[b]).map(b => `<i class="${eb[b] > 0 ? 'si' : 'no'}">${eb[b] > 0 ? '▲' : '▼'} ${BANDOS[b].corto}</i>`).join('') + (R.perjudicaPlebe(ley) ? '<i class="no">▼ Plebe</i>' : '');
    const coste = `${pl.dura} est.${pl.oro ? ` · ${pl.oro} oro` : ''}${pl.grano ? ` · ${pl.grano} grano` : ''}${pl.dura > 1 && (pl.oro || pl.grano) ? '/est.' : ''}`;
    const sitio = t.sitio in EDIFICIOS ? EDIFICIOS[t.sitio].nombre : 'Las calles';
    return `<button class="carta${on ? ' on' : ''}" data-a="ley" data-x="${i}">${icoLey(ley).replace('<svg', '<svg class="ic"')}<span class="t">${esc(t.titulo)}${ley.noLlega ? ' <em class="tarde">· no da tiempo</em>' : ''}</span>
      <span class="ciudad-ley"><b>En la ciudad:</b> ${esc(t.ciudad)}</span><span class="sitio">${ico(t.sitio in EDIFICIOS ? t.sitio : 'plebe')}${sitio}</span>
      <span class="g">${gus}<i class="cos">⧗ ${coste}</i></span>${on ? `<span class="info" data-a="fuente">ⓘ ${ui.verFuente ? 'Ocultar la fuente' : 'Fuente histórica'}</span>${ui.verFuente ? `<span class="f">${esc(t.fuente)} · ${esc(t.dictamen)}</span>` : ''}` : ''}</button>`;
  }).join('');
  const tratos = BS.map(b => {
    const t = e.tratos[b], c = R.costeTrato(e, b), bb = pv && pv.bandos[b], ya = bb && bb.yaTeVotan;
    const lab = ya ? 'Ya te votan' : t === 'oro' ? `${c} oro` : t === 'promesa' ? 'Promesa' : 'Sin trato';
    return `<button class="${t ? 'on' : ''}${ya ? ' ya' : ''}" data-a="trato" data-x="${b}"${ya ? ' disabled' : ''}><span><span class="pt" style="background:${BANDOS[b].color}"></span>${BANDOS[b].corto}</span><strong>${lab}</strong>${bb ? `<small>${bb.seguros} sí · ${bb.dudosos} dudan</small>` : ''}</button>`;
  }).join('');
  const veto = pv && pv.veto ? `<div class="veto">El tribuno de la plebe vetará esta ley: la plebe está por debajo de ${R.TRIBUNO.umbral} y la perjudica.</div>` : '';
  const P = R.plazoPromesa(e);
  return `<section class="ca"><h2 class="ro-ansata">Cuestión de Estado</h2><div class="hemi">${hemiciclo(est, gestosPrevision(pv))}</div>${cuenta}${veto}
    <div class="ro-tablilla tratos">${tratos}</div>
    <p class="nota-trato">Toca un bando: oro, promesa o nada. ${P.puede ? `Promesa: apruebas una ley que les guste antes de la estación ${P.estacion + 1}; si no, −${P.favor} de favor.` : 'Ya no queda tiempo para prometer.'}</p></section>
    <section class="cb"><p class="guia">Elige una ley. Cada una dice qué cambia en la ciudad.</p><div class="ro-tablilla cartas">${cartas}</div>
    <button class="pasar" data-a="pasar">Dejar pasar la votación (−${K.favorPasa} de favor)</button></section>`;
}

/* recuento senador a senador (como en EV7) */
function recuento() {
  const r = e.recuento, N = r.votos.length; let k = 0, si = 0, no = 0, golpeDado = false; const gestos = {};
  capa(`<h2 class="ro-ansata">Recuento</h2><p class="ley-voto">${esc(texto(r.ley).titulo)}</p>
    <div class="hemi">${hemiciclo(s => { const v = r.votos.find(x => x.i === s.i); return asiento(s.bando, v.clase === 'dudoso' ? 'dudoso' : 'espera'); }, {}, 'rc-hemi')}</div>
    <div class="marcador"><span class="si"><b id="rc-si">0</b> sí</span><span class="no"><b id="rc-no">0</b> no</span></div>
    <div class="pista-voto"><i id="rc-barra"></i><em style="left:${(100 * K.mayoria / N).toFixed(1)}%"><span>${K.mayoria}</span></em></div>
    <div class="sello-res" id="rc-sello" hidden></div>
    <p class="resultado" id="resultado">Votan: ${BANDOS[r.votos[0].bando].nombre}…</p>
    <p class="guia" id="rc-ciudad" hidden></p>
    <button class="boton2" data-a="saltar">Saltar el recuento</button>
    <button class="boton ro-sello" data-a="a-ciudad" hidden>Volver a la ciudad</button>`, 'recuento');
  const hoja = $('capa').querySelector('.hoja');
  const ponJefe = (b, g) => { if (gestos[b] === g) return; gestos[b] = g; const n = hoja.querySelector(`[data-jefe="${b}"]`); if (n) n.innerHTML = retratoEn(b, g); const p = hoja.querySelector(`[data-palabra="${b}"]`); if (p) p.textContent = PALABRA[g] || ''; };
  const sello = (t, cl) => { const s = $('rc-sello'); s.textContent = t; s.className = 'sello-res ' + cl; s.hidden = false; };
  const marca = () => {
    $('rc-si').textContent = si; $('rc-no').textContent = no; $('rc-barra').style.width = (100 * si / N).toFixed(1) + '%';
    if (si >= K.mayoria && !golpeDado) { golpeDado = true; hoja.classList.add('golpe'); $('rc-barra').classList.add('llena'); sello(r.veto ? '¡Mayoría!… y veto' : '¡Mayoría!', 'oro'); }
  };
  const final = () => {
    clearTimeout(anim); anim = null;
    $('resultado').className = 'resultado ' + (r.aprobada ? 'bien' : 'mal');
    $('resultado').textContent = r.aprobada ? `Aprobada ${r.si} a ${r.no}` : r.veto ? `Tenía ${r.si} votos, pero el tribuno la veta` : `Rechazada ${r.si} a ${r.no}: hacían falta ${K.mayoria}`;
    if (r.aprobada) { const c = $('rc-ciudad'); c.innerHTML = '<b>En la ciudad:</b> ' + esc(texto(r.ley).ciudad); c.hidden = false; }
    sello(r.aprobada ? 'Aprobada' : r.veto ? 'Vetada' : 'Rechazada', r.aprobada ? 'rojo' : 'gris');
    hoja.querySelector('[data-a="saltar"]').hidden = true; hoja.querySelector('[data-a="a-ciudad"]').hidden = false;
  };
  const paso = () => {
    if (k >= N) return final();
    const v = r.votos[k++]; v.si ? si++ : no++;
    const n = hoja.querySelector(`[data-asiento="${v.i}"]`); if (n) n.innerHTML = asiento(v.bando, v.si ? 'si' : 'no');
    const hechos = r.votos.slice(0, k).filter(x => x.bando === v.bando), s = hechos.filter(x => x.si).length;
    ponJefe(v.bando, s * 2 > hechos.length ? 'si' : s * 2 < hechos.length ? 'no' : 'duda');
    marca();
    const sig = r.votos[k]; if (sig) $('resultado').textContent = `Votan: ${BANDOS[sig.bando].nombre}…`;
    anim = setTimeout(paso, sig && sig.bando !== v.bando ? 420 : 110);
  };
  anim = setTimeout(paso, 500);
  window.__ev8.saltar = () => {
    clearTimeout(anim); if (hoja.querySelector('[data-a="saltar"]').hidden) return;
    while (k < N) { const v = r.votos[k++]; const n = hoja.querySelector(`[data-asiento="${v.i}"]`); if (n) n.innerHTML = asiento(v.bando, v.si ? 'si' : 'no'); }
    si = r.si; no = r.no;
    BS.forEach(b => { const vs = r.votos.filter(x => x.bando === b), s = vs.filter(x => x.si).length; ponJefe(b, s * 2 > vs.length ? 'si' : 'no'); });
    marca(); final();
  };
}

/* ================= 5 · FINAL ================= */
function veredicto() {
  const f = e.fin, gana = f.gana, tr = gana ? ESC.triunfo() : null;
  capa(`<div class="veredicto"><h2 class="ro-ansata">Veredicto</h2>
    <div class="ilus">${tr || A.ilustracionFin(f)}</div>
    <div class="titulo ${gana ? 'gana' : 'pierde'}">${esc(f.titulo)}</div>
    <div class="nota">Nota: ${String(f.nota).replace('.', ',')} de 10</div>
    <ul>${f.causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul><p class="consejo">${esc(R.consejo(e))}</p>
    <p class="resumen">${Math.min(e.turno + 1, K.turnos)} estaciones · ${e.legiones} legiones · ${e.saberes.length} saberes · Edad ${ROMANO[e.edad - 1]} · plebe ${e.plebe}</p>
    <button class="boton ro-sello" data-a="otra">Jugar otra vez</button>
    <button class="boton2" data-a="ver-ciudad">Mirar la ciudad</button></div>`, 'fin');
}

/* ---------- capas ---------- */
function capa(html, cl = '') { const c = $('capa'); c.className = cl.includes('abajo') ? 'abajo' : ''; c.innerHTML = `<div class="hoja ${cl}">${html}</div>`; c.hidden = false; c.scrollTop = 0; }
function cierraCapa() { clearTimeout(anim); anim = null; $('capa').hidden = true; $('capa').innerHTML = ''; if (ui && ui.ficha) { ui.ficha = null; } }

/* ---------- portada ---------- */
function portada() {
  const p = $('portada'), sigue = e && e.fase !== 'fin';
  p.innerHTML = `${A.portada(390, 844).replace('class="portada-svg"', 'class="portada-svg de-pie"')}<div class="portada-txt"><h1 class="titulo-bronce">AQVILA</h1><p class="lema">Roma, 264 a.C. · Tú gobiernas la ciudad, el Senado te juzga</p></div>
    <div class="portada-botones"><button class="boton ro-sello" data-a="nueva">Nueva partida</button>
    ${sigue ? `<button class="boton ro-bronce" data-a="seguir">Seguir · ${R.nombreEstacion(e.turno)}</button>` : ''}
    <p class="credito">Dibujos propios · imágenes de museo con su licencia · doce estaciones</p></div>`;
  p.hidden = false;
}

/* ---------- pintar todo ---------- */
function principal() {
  const b = $('principal'); b.classList.remove('apagado'); b.disabled = false;
  if (e.fase === 'fin') b.textContent = 'Ver el veredicto';
  else if (e.fase === 'consejo') {
    if (ui.tab !== 'consejo') b.textContent = 'Ir al consejo del año';
    else if (!ui.plan.length) { b.textContent = 'Elige al menos un encargo'; b.classList.add('apagado'); }
    else b.textContent = `Aprobar el plan del año (${ui.plan.length})`;
  }
  else if (e.fase === 'mando') b.textContent = 'Terminar la estación';
  else if (ui.tab !== 'senado') b.textContent = 'Ir al Senado';
  else if (ui.juicioVisto !== e.turno) b.textContent = 'A la cuestión de Estado';
  else if (e.sel < 0) { b.textContent = 'Elige una ley para votar'; b.classList.add('apagado'); }
  else b.textContent = 'Llamar a votar';
}
function pintar() {
  cabecera();
  const c = $('cuerpo'), y = ui.tab === ui._ultimo ? c.scrollTop : 0;
  c.className = 'p-' + ui.tab;
  c.innerHTML = ui.tab === 'ciudad' ? pantallaCiudad() : ui.tab === 'senado' ? pantallaSenado() : pantallaConsejo();
  c.scrollTop = y; ui._ultimo = ui.tab;
  if (ui.tab === 'ciudad') aplicaZoom();
  const n3 = e.fase === 'consejo' ? 'Consejo' : 'Gobierno';
  $('nav').innerHTML = [['ciudad', 'Ciudad', 'ciudad'], ['senado', 'Senado', 'senado'], ['consejo', n3, 'consejo']].map(([t, n, i]) => `<button class="${ui.tab === t ? 'on' : ''}" data-a="tab" data-x="${t}">${ico(i)}${n}</button>`).join('');
  principal(); guardar();
}

/* ---------- toques ---------- */
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-a], #principal, [data-edif]'); if (!t) return;
  if (t.id === 'principal') {
    if (e.fase === 'fin') return veredicto();
    if (e.fase === 'consejo') {
      if (ui.tab !== 'consejo') { ui.tab = 'consejo'; return pintar(); }
      if (!ui.plan.length) return;
      const r = R.elegirPlan(e, ui.plan); if (!r.ok) return;
      ui.plan = []; ui.tab = 'senado'; $('cuerpo').scrollTop = 0; return pintar();
    }
    if (e.fase === 'mando') {
      const inf = R.terminar(e); ui.informe = inf; ui.acto = null; ui.ficha = null; ui.zoom = { s: 1, x: 0, y: 0 };
      ui.tab = 'ciudad'; pintar(); $('cuerpo').scrollTop = 0;
      if (e.fase === 'fin') setTimeout(veredicto, 900);
      return;
    }
    if (ui.tab !== 'senado') { ui.tab = 'senado'; return pintar(); }
    if (ui.juicioVisto !== e.turno) { ui.juicioVisto = e.turno; pintar(); $('cuerpo').scrollTop = 0; return; }
    if (e.sel < 0) { const c = $('cuerpo').querySelector('.cartas'); if (c) c.scrollIntoView({ block: 'center' }); return; }
    R.votar(e); pintar(); return recuento();
  }
  if (t.dataset.edif && !t.dataset.a) { if (arrastro) { arrastro = false; return; } ui.ficha = t.dataset.edif; pintar(); return ficha(ui.ficha); }
  const a = t.dataset.a, x = t.dataset.x;
  if (a === 'tab') { ui.tab = x; cierraCapa(); pintar(); }
  else if (a === 'encargo') { const i = ui.plan.indexOf(x); if (i >= 0) ui.plan.splice(i, 1); else if (ui.plan.length < 3) ui.plan.push(x); pintar(); }
  else if (a === 'delegar') { R.delegar(e, x, !e.delegados[x]); pintar(); if (ui.ficha && !$('capa').hidden) ficha(ui.ficha); }
  else if (a === 'empezar') { R.empezarEncargo(e, x); pintar(); }
  else if (a === 'mejorar') { const r = R.mejorar(e, x); ui.ficha = x; pintar(); ficha(x); if (!r.ok) { const p = document.createElement('p'); p.className = 'veto'; p.textContent = r.porque; $('capa').querySelector('.hoja').append(p); } }
  else if (a === 'zoom') { const L = $('lienzo'), W = L.clientWidth / 2, H = L.clientHeight / 2; if (+x === 0) { ui.zoom = { s: 1, x: 0, y: 0 }; aplicaZoom(); } else zoomEn(ui.zoom.s * (+x > 0 ? 1.5 : 1 / 1.5), W, H); }
  else if (a === 'limpiar') { ui.informe = null; ui.acto = null; pintar(); }
  else if (a === 'actos') menuActos();
  else if (a === 'acto') { const b = t.dataset.b, r = R.hacerActo(e, x, b); if (!r.ok) return; ui.acto = Object.assign({ turno: e.turno }, r); pintar(); verActo(r, b); }
  else if (a === 'aprende') verAprende();
  else if (a === 'fuente') { ev.stopPropagation(); ui.verFuente = !ui.verFuente; pintar(); }
  else if (a === 'ley') { R.elegir(e, e.sel === +x ? -1 : +x); pintar(); }
  else if (a === 'trato') { const ciclo = [undefined, 'oro', 'promesa']; let i = ciclo.indexOf(e.tratos[x]); for (let n = 0; n < 3; n++) { i = (i + 1) % 3; if (!ciclo[i] || R.trato(e, x, ciclo[i])) { if (!ciclo[i]) R.trato(e, x, null); break; } } pintar(); }
  else if (a === 'leva') { if (R.levaPagada(e)) pintar(); }
  else if (a === 'pasar') { R.dejarPasar(e); ui.tab = 'ciudad'; pintar(); }
  else if (a === 'saltar') window.__ev8.saltar();
  else if (a === 'a-ciudad') { cierraCapa(); ui.tab = 'ciudad'; ui.zoom = { s: 1, x: 0, y: 0 }; pintar(); }
  else if (a === 'otra') { cierraCapa(); nueva(semillaNueva()); pintar(); }
  else if (a === 'ver-ciudad' || a === 'cerrar') { cierraCapa(); ui.tab = 'ciudad'; pintar(); }
  else if (a === 'nueva') { $('portada').hidden = true; nueva(SEMILLA_FIJA || semillaNueva()); pintar(); }
  else if (a === 'seguir') { $('portada').hidden = true; pintar(); }
});
$('capa').addEventListener('click', ev => { if (ev.target === $('capa')) cierraCapa(); });
addEventListener('resize', () => { if (e && ui.tab === 'ciudad') aplicaZoom(); });

/* ---------- arranque y gancho para las pruebas ---------- */
cargar();
window.__ev8 = { lista: false, estado: () => JSON.parse(JSON.stringify(e)), lugar: () => ui.tab, ui: () => JSON.parse(JSON.stringify(ui)), R, saltar: () => { }, portada: () => !$('portada').hidden };
if (e && e.fase === 'fin') { pintar(); veredicto(); }
else portada();
window.__ev8.lista = true;
