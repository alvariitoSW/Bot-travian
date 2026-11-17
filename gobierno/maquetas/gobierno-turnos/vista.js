// EV7 · pantalla de «Gobierno por turnos». El Senado vota, la ciudad obedece. Sin relojes que decidan por ti:
// el recuento se anima unos segundos y se puede saltar; todo lo demás avanza cuando el jugador toca.
// El dibujo vive en arte.js; aquí solo se monta la pantalla y se atienden los toques.
import * as R from './reglas.js';
import * as A from './arte.js';
const { BANDOS, BS, EDIFICIOS, SABERES, EDADES, K } = R;
const CLAVE = 'aqvila-maqueta-ev7';
const PARAM = new URLSearchParams(location.search), SEMILLA_FIJA = +PARAM.get('semilla') || 0;
const semillaNueva = () => (Date.now() % 2147483646) + 1;
const $ = i => document.getElementById(i);
const ROMANO = ['I', 'II', 'III'];
let e = null, ui, anim = null, zoomT = null, focos = [];

/* ---------- guardar y cargar (una partida terminada también se guarda: al volver se ve su veredicto) ---------- */
const nuevoUI = () => ({ tab: 'ciudad', verFuente: false, info: null });
function guardar() { try { if (e) localStorage.setItem(CLAVE, JSON.stringify({ e, ui: { tab: ui.tab } })); } catch (_) { } }
function cargar() {
  try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.e && s.e.senadores) { e = s.e; ui = Object.assign(nuevoUI(), s.ui); return; } } catch (_) { }
  e = null; ui = nuevoUI();
}
function nueva(semilla) { e = R.crear(semilla); ui = nuevoUI(); }

/* ---------- iconos (dibujo propio, trazo sencillo) ---------- */
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
  juegos: '<circle cx="12" cy="12" r="8" fill="none" stroke="#6b4a26" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#6b4a26"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7" stroke="#6b4a26" stroke-width="1.3"/>',
  ciudad: '<path d="M3 20V11l4-3 4 3v9zM11 20v-7l5-4 5 4v7z" fill="#a98a66" stroke="#4a3119" stroke-width="1.2"/><path d="M2 11l5-4 5 4M10 13l6-5 6 5" fill="none" stroke="#b5562f" stroke-width="2"/>',
  senado: '<path d="M3 20h18M5 20v-8M9 20v-8M15 20v-8M19 20v-8M3 12h18L12 5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  mando: '<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8"/>',
  tribuno: '<circle cx="12" cy="6" r="3" fill="#c98a5a" stroke="#5a3418"/><path d="M6 21c0-7 3-10 6-10s6 3 6 10z" fill="#efe1bd" stroke="#5a3418"/><path d="M4 12l16 8" stroke="#a3231a" stroke-width="2.2"/>',
  promesa: '<path d="M4 12c3-3 5-3 8 0s5 3 8 0" fill="none" stroke="#6b4a26" stroke-width="2"/><path d="M6 15l3 3 3-3 3 3 3-3" fill="none" stroke="#6b4a26" stroke-width="1.6"/>',
  retraso: '<circle cx="12" cy="12" r="8" fill="#f6d6c8" stroke="#9b2a1a" stroke-width="1.6"/><path d="M12 7v5l3 3" stroke="#9b2a1a" stroke-width="1.8" fill="none"/>',
}, A.ICONOS);
const ico = (n, cl = '') => `<svg viewBox="0 0 24 24" class="${cl}" aria-hidden="true">${IC[n] || IC.obra}</svg>`;
const icoLey = ley => ico({ reclutar: 'legion', leva: 'legion', ampliar: ley.obj || 'ciudad', estudiar: ley.obj || 'saber', edad: 'edad', impuestos: 'oro', granoBarato: 'grano', juegos: 'juegos' }[ley.tipo]);
const NOMBRE = { oro: 'Oro', grano: 'Grano', plebe: 'Plebe', favor: 'Favor', legiones: 'Legiones', amenaza: 'Amenaza' };
const signo = n => (n > 0 ? '+' : '−') + Math.abs(Math.round(n));
const texto = ley => R.leyTexto(ley, e);
const golpe = () => R.golpe ? R.golpe(e) : { esperado: e.fase === 'fin' ? e.amenaza : R.amenazaFinal(e), min: e.amenaza, max: e.amenaza, enCola: 0, fuerza: R.fuerza(e) };

/* ---------- cabecera: estación, cuatro cifras y UNA barra «Fuerza / Golpe» ---------- */
function cabecera() {
  const G = golpe(), f = R.fuerza(e), g = G.esperado, tope = Math.max(f + G.enCola, G.max, 1) * 1.08, pc = v => (100 * v / tope).toFixed(1);
  const c = [['oro', 'Oro', e.oro, e.oro < 0], ['grano', 'Grano', e.grano, e.grano < 0], ['plebe', 'Plebe', e.plebe, e.plebe < 30], ['favor', 'Favor', e.favor, e.favor < 25]];
  $('cab').innerHTML = `<div class="fila"><span class="est">${R.nombreEstacion(e.turno)} · ${Math.min(e.turno + 1, K.turnos)}/${K.turnos}</span><span class="edad">Edad ${ROMANO[e.edad - 1]}</span></div>
  <div id="cifras">${c.map(([i, n, v, m]) => `<div class="cifra${m ? ' mal' : ''}" data-cifra="${i}">${ico(i)}<b>${Math.round(v)}</b><span>${n}</span></div>`).join('')}</div>
  <div class="pulso ${f >= g ? 'bien' : 'mal'}" data-cifra="fuerza">${ico('legion')}<span>Fuerza <b>${f}</b></span><div class="pista"><u style="left:${pc(G.min)}%;width:${(pc(G.max) - pc(G.min)).toFixed(1)}%"></u><s style="width:${pc(f + G.enCola)}%"></s><i style="width:${pc(f)}%"></i><em style="left:${pc(g)}%"></em></div><span>Golpe <b>${g}</b></span>${ico('amenaza')}</div>`;
}

/* ---------- pantallas ---------- */
const GUIA = {
  ciudad: 'Esta es Roma. No la construyes tú: el Senado vota y la ciudad cumple sola lo que se apruebe.',
  senado: 'Elige una ley, ofrece tratos a quien dude y vota con el sello rojo.',
  mando: 'Aquí ves lo ordenado, lo que se está cumpliendo y lo que ha cambiado en Roma.',
};
const guia = t => e.turno === 0 && e.fase !== 'fin' ? `<p class="guia">${GUIA[t]}</p>` : '';
function bandaSuceso() {
  const s = e.suceso; if (!s) return '';
  const ef = Object.entries(s.ef).filter(([, v]) => v).map(([k, v]) => `${NOMBRE[k] || k} ${signo(v)}`).join(' · ');
  const ic = s.ef.amenaza ? 'amenaza' : s.ef.legiones ? 'legion' : s.ef.grano ? 'grano' : s.ef.oro ? 'oro' : s.ef.plebe ? 'plebe' : 'favor';
  return `<div class="banda ro-papiro">${ico(ic)}<div><b>${s.titulo}</b>${s.texto} <i>${ef}</i></div></div>`;
}
/* lo recién cumplido: informe.nuevo ([{tipo, id, n}]) traducido a lo que entiende el dibujo; si no lo hay, los cambios */
const recienCambios = () => {
  const u = e.ultimo; if (!u || !(u.turno === e.turno - 1 || e.fase === 'fin')) return [];
  if (!u.nuevo) return u.cambios;
  return u.nuevo.map(x => x.tipo === 'edificio' ? { que: 'edif', obj: x.id, n: 1 } : x.tipo === 'saber' ? { que: 'saber', obj: x.id, n: 1 } : x.tipo === 'legion' ? { que: 'legiones', n: 1 } : { que: 'edad', obj: x.n, n: 1 });
};
const NOMBRES = { edif: Object.fromEntries(Object.values(EDIFICIOS).map(x => [x.id, x.nombre])), saber: Object.fromEntries(Object.values(SABERES).map(x => [x.id, x.nombre])) };

const INFO = {
  legion: () => `Legiones: ${e.legiones}. Cada una suma ${R.fuerzaLegion(e)} de fuerza.`,
  ...Object.fromEntries(R.ORDEN_EDIF.map(k => [k, () => `${EDIFICIOS[k].nombre}: ${e.edif[k]} de ${EDIFICIOS[k].max}. Da escaños a los ${BANDOS[EDIFICIOS[k].bando].nombre.toLowerCase()}.`])),
};
function pantallaCiudad() {
  const nuevo = recienCambios(), dib = A.ciudad(e, nuevo, Object.assign({ estacion: R.estacionVisual ? R.estacionVisual(e) : null }, NOMBRES)); focos = dib.focos;
  const nv = (q, o) => nuevo.some(c => c.que === q && (o == null || c.obj === o) && (q !== 'legiones' || c.n > 0));
  const chip = (i, n, cl) => `<button class="icono${cl ? ' nueva' : ''}${ui.info === i ? ' on' : ''}" data-a="info" data-x="${i}" aria-label="${i}">${ico(i)}<b>${n}</b></button>`;
  const fila = chip('legion', e.legiones, nv('legiones')) + R.ORDEN_EDIF.map(k => chip(k, e.edif[k], nv('edif', k))).join('');
  const sabs = e.saberes.map(id => `<span class="ficha${nv('saber', id) ? ' nueva' : ''}">${ico(id)}${SABERES[id].nombre}</span>`).join('');
  const cola = e.ordenes.map(o => `<span class="ficha obra">${icoLey(o.ley)}${texto(o.ley).titulo.replace(/^(Ampliar|Estudiar): /, '')} ${o.hecho}/${o.dura}</span>`).join('');
  return `<section class="ca"><div class="lienzo o2" id="lienzo">${dib.svg}<div class="rotulo" hidden></div></div></section>
  <section class="cb"><div class="o0">${guia('ciudad')}${bandaSuceso()}</div><div class="ro-rubrica sub">Lo que tiene Roma · ${Math.round(e.pob)} 000 vecinos</div><div class="iconos">${fila}</div>
  <p class="leyenda">${ui.info && INFO[ui.info] ? INFO[ui.info]() : 'Toca un icono para ver qué es.'}</p>
  <div class="fichas">${sabs || '<span class="vacio">Sin saberes todavía: el Senado puede votar estudiar uno.</span>'}</div>
  ${cola ? `<div class="ro-rubrica sub">En obra</div><div class="fichas">${cola}</div>` : ''}</section>`;
}
/* zoom suave y destello sobre lo recién cumplido, con su nombre encima */
function zoomNuevo() {
  clearTimeout(zoomT); const L = $('lienzo'); if (!L || !focos.length) return;
  const svg = L.querySelector('svg'), rot = L.querySelector('.rotulo'), lista = focos.slice(0, 3); let i = 0;
  const uno = () => {
    if (!svg.isConnected) return;
    if (i >= lista.length) { svg.style.transform = ''; rot.hidden = true; return; }
    const f = lista[i++], px = f.x / 4, py = f.y / 3;
    svg.style.transformOrigin = `${px}% ${py}%`; svg.style.transform = 'scale(2.3)';
    rot.textContent = f.nombre; rot.style.left = Math.min(80, Math.max(20, px)) + '%'; rot.style.top = Math.max(16, py) + '%';
    rot.hidden = false; rot.classList.remove('sale'); void rot.offsetWidth; rot.classList.add('sale');
    zoomT = setTimeout(uno, 2000);
  };
  zoomT = setTimeout(uno, 300);
}

/* hemiciclo: 30 sillas curules en tres gradas y los tres jefes de bando delante */
const ASIENTOS = (() => { const out = []; [[7, 66], [10, 94], [13, 122]].forEach(([n, r]) => { for (let k = 0; k < n; k++) { const a = Math.PI - (k + 0.5) * Math.PI / n; out.push({ x: 195 + r * Math.cos(a), y: 140 - r * Math.sin(a), a }); } }); return out.sort((p, q) => q.a - p.a || p.y - q.y); })();
const JEFE = { ter: [6, 92, 60], mer: [167, 86, 56], mil: [324, 92, 60] };
const retratoEn = (b, gesto) => { const [x, y, w] = JEFE[b]; return A.retrato(b, BANDOS[b].color, gesto).replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${w * 72 / 64}" `); };
function hemiciclo(estado, gestos = {}, id = '') {
  let g = `<path d="M60 144 A135 135 0 0 1 330 144" fill="none" stroke="rgba(110,70,25,.2)" stroke-width="46"/><path d="M40 146 H350" stroke="#8a6034" stroke-width="5"/>`;
  if (e.plebe < R.TRIBUNO.umbral) g += `<g transform="translate(352 4) scale(1.3)">${IC.tribuno}</g><text x="368" y="44" font-size="11" text-anchor="middle" fill="#9b2a1a" font-weight="700">Tribuno</text>`;
  e.senadores.forEach((s, i) => { const p = ASIENTOS[i]; g += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" data-asiento="${s.i}">${estado(s)}</g>`; });
  BS.forEach(b => { const [x, y, w] = JEFE[b]; const an = b === 'ter' ? ['start', 2] : b === 'mil' ? ['end', 388] : ['middle', x + w / 2]; g += `<g data-jefe="${b}">${retratoEn(b, gestos[b] || '')}</g><text x="${an[1]}" y="${y + w * 72 / 64 + 14}" font-size="13" font-weight="700" text-anchor="${an[0]}" fill="${BANDOS[b].color}">${BANDOS[b].corto} ${e.escanos[b]}</text>`; });
  return `<svg viewBox="0 0 390 180" aria-label="Hemiciclo del Senado" ${id ? `id="${id}"` : ''}>${g}</svg>`;
}
const asiento = (b, clase) => A.asiento(BANDOS[b].color, clase);
function gestosPrevision(pv) {
  const o = {}; if (!pv) return o;
  BS.forEach(b => { const x = pv.bandos[b], n = x.seguros + x.dudosos + x.contra; o[b] = x.seguros * 2 > n ? 'si' : x.contra * 2 >= n ? 'no' : 'duda'; });
  return o;
}

function pantallaSenado() {
  if (e.fase !== 'senado') {
    const r = e.recuento, g = {};
    if (r) BS.forEach(b => { const v = r.votos.filter(x => x.bando === b), s = v.filter(x => x.si).length; g[b] = s * 2 > v.length ? 'si' : 'no'; });
    return `<section class="ca">${guia('senado')}<div class="hemi">${hemiciclo(s => r ? asiento(s.bando, r.votos.find(v => v.i === s.i).si ? 'si' : 'no') : asiento(s.bando, ''), g)}</div></section>
      <section class="cb"><p class="resultado ${r && r.aprobada ? 'bien' : 'mal'}">${r ? (r.aprobada ? 'Aprobada' : r.veto ? 'Vetada por el tribuno' : 'Rechazada') + ` · ${r.si} a ${r.no}` : 'Esta estación no se votó'}</p>
      ${r ? `<p class="guia">${texto(r.ley).titulo}. ${r.aprobada ? 'Ya está en la cola de mando.' : 'No se cumplirá.'}</p>` : ''}
      <p class="vacio centro">El Senado vuelve a reunirse la próxima estación.</p></section>`;
  }
  const pv = R.prevision(e);
  const est = s => pv ? asiento(s.bando, pv.por.find(p => p.i === s.i).clase) : asiento(s.bando, '');
  const cuenta = pv ? `<div class="cuenta"><span><b>${pv.seguros}</b> seguros</span><span><b>${pv.dudosos}</b> dudan</span><span><b>${pv.contra}</b> en contra</span><span>· mayoría <b>${K.mayoria}</b></span></div>`
    : `<div class="cuenta"><span>Elige una ley: los jefes te dirán qué piensan.</span></div>`;
  const cartas = e.cartas.map((ley, i) => {
    const t = texto(ley), g = R.gustoLey(ley), pl = R.plantillaOrden(e, ley), on = e.sel === i;
    const eb = R.efectoBando ? R.efectoBando(ley) : Object.fromEntries(BS.map(b => [b, g[b] >= .1 ? 1 : g[b] <= -.1 ? -1 : 0])), gus = BS.filter(b => eb[b]).map(b => `<i class="${eb[b] > 0 ? 'si' : 'no'}">${eb[b] > 0 ? '▲' : '▼'} ${BANDOS[b].corto}</i>`).join('') + (R.perjudicaPlebe(ley) ? '<i class="no">▼ Plebe</i>' : '');
    const coste = `${pl.dura} est.${pl.oro ? ` · ${pl.oro} oro` : ''}${pl.grano ? ` · ${pl.grano} grano` : ''}${pl.dura > 1 && (pl.oro || pl.grano) ? '/est.' : ''}`;
    return `<button class="carta${on ? ' on' : ''}" data-a="ley" data-x="${i}">${icoLey(ley).replace('<svg', '<svg class="ic"')}<span class="t">${t.titulo}${ley.noLlega ? ' <em class="tarde">· no da tiempo</em>' : ''}</span><span class="g">${gus}<i class="cos">⧗ ${coste}</i></span>${on ? `<span class="x">${t.efecto}</span><span class="info" data-a="fuente">ⓘ ${ui.verFuente ? 'Ocultar la fuente' : 'Fuente histórica'}</span>${ui.verFuente ? `<span class="f">${t.fuente} · ${t.dictamen}</span>` : ''}` : ''}</button>`;
  }).join('');
  const tratos = BS.map(b => {
    const t = e.tratos[b], c = R.costeTrato(e, b), bb = pv && pv.bandos[b];
    const ya = bb && bb.yaTeVotan, lab = ya ? 'Ya te votan' : t === 'oro' ? `${c} oro` : t === 'promesa' ? 'Promesa' : 'Sin trato';
    return `<button class="${t ? 'on' : ''}${ya ? ' ya' : ''}" data-a="trato" data-x="${b}"${ya ? ' disabled' : ''}><span><span class="pt" style="background:${BANDOS[b].color}"></span>${BANDOS[b].corto}</span><strong>${lab}</strong>${bb ? `<small>${bb.seguros} sí · ${bb.dudosos} dudan</small>` : ''}</button>`;
  }).join('');
  const veto = pv && pv.veto ? `<div class="veto">El tribuno de la plebe vetará esta ley: la plebe está por debajo de ${R.TRIBUNO.umbral} y la perjudica.</div>` : '';
  return `<section class="ca"><div class="hemi o2">${hemiciclo(est, gestosPrevision(pv))}</div><div class="o3">${cuenta}${veto}</div>
    <div class="ro-tablilla tratos o6">${tratos}</div>
    <p class="nota-trato o7">${notaTrato()}</p></section>
    <section class="cb"><div class="o0">${guia('senado')}</div><div class="ro-tablilla cartas o5">${cartas}</div>
    <button class="pasar o8" data-a="pasar">Dejar pasar la votación (−${K.favorPasa} de favor)</button></section>`;
}

function notaTrato() {
  const P = R.plazoPromesa ? R.plazoPromesa(e) : { puede: true, estacion: Math.min(e.turno + K.promesaPlazo, K.turnos - 1) + 1, favor: K.promesaRota.favor, humor: K.promesaRota.humor };
  return 'Toca un bando: oro, promesa o nada. ' + (P.puede ? `Promesa: apruebas una ley que les guste como tarde en la estación ${P.estacion}; si no, −${P.favor} de favor y −${P.humor} de humor con ellos.` : 'Ya no queda estación para cumplir una promesa.');
}
function filaOrden(o) {
  const t = texto(o.ley), falta = o.dura - o.hecho;
  return `<div class="orden">${icoLey(o.ley)}<span>${t.titulo}</span><small><span class="barra"><i style="width:${Math.round(100 * o.hecho / o.dura)}%"></i></span>
    ${o.retraso ? `<span class="tarde">Retrasada: ${o.retraso}.</span> ` : ''}Falta${falta > 1 ? 'n' : ''} ${falta} estaci${falta > 1 ? 'ones' : 'ón'} · ${o.oro ? o.oro + ' de oro' : ''}${o.oro && o.grano ? ' y ' : ''}${o.grano ? o.grano + ' de grano' : ''}${o.oro || o.grano ? ' por estación' : 'sin coste'}</small></div>`;
}
function resumenCambios(cambios) {
  const tot = {}, cosas = [];
  for (const c of cambios) {
    if (NOMBRE[c.que] && c.que !== 'legiones') tot[c.que] = (tot[c.que] || 0) + c.n;
    else if (c.que === 'legiones') cosas.push(['legion', c.n > 0 ? `${c.n > 1 ? c.n + ' legiones nuevas' : 'Una legión nueva'}` : 'Pierdes una legión', c.n]);
    else if (c.que === 'edif') cosas.push([c.obj, `Nuevo: ${EDIFICIOS[c.obj].una}`, 1]);
    else if (c.que === 'saber') cosas.push([c.obj, `Saber: ${SABERES[c.obj].nombre}`, 1]);
    else if (c.que === 'edad') cosas.push(['edad', `Edad ${ROMANO[c.obj - 1]}: «${EDADES[c.obj].nombre}»`, 1]);
    else if (c.que === 'retraso') cosas.push(['retraso', c.motivo, -1]);
    else if (c.que === 'promesa') cosas.push(['promesa', c.motivo, 1]);
  }
  const icoR = { oro: 'oro', grano: 'grano', plebe: 'plebe', favor: 'favor', amenaza: 'amenaza' };
  const filas = cosas.map(([i, t, n]) => `<div class="cambio">${ico(i)}<span>${t}</span>${n < 0 ? '<span class="n m">!</span>' : '<span class="n b">✓</span>'}</div>`)
    .concat(Object.entries(tot).filter(([, v]) => Math.round(v)).map(([k, v]) => { const bueno = k === 'amenaza' ? v < 0 : v > 0; return `<div class="cambio">${ico(icoR[k])}<span>${NOMBRE[k]}</span><span class="n ${bueno ? 'b' : 'm'}">${signo(v)}</span></div>`; }));
  return filas.join('') || '<p class="vacio">Nada todavía.</p>';
}
function pantallaMando() {
  const G = golpe(), f = R.fuerza(e), prev = G.esperado, tope = Math.max(G.max, f + G.enCola, 1) * 1.1, E = EDADES[e.edad + 1];
  const pl = R.puedeLeva ? R.puedeLeva(e) : null;
  const leva = pl ? `<button class="pasar leva" data-a="leva"${pl.ok ? '' : ' disabled'}>${pl.ok ? `Pagar una leva (${pl.oro} oro, −${pl.favor} favor)` : `Leva: ${pl.porque.toLowerCase()}`}</button>` : '';
  const ordenado = e.aprobadas.length ? e.aprobadas.map(l => `<div class="orden">${icoLey(l)}<span>${texto(l).titulo}</span><small>Aprobada en el Senado esta estación</small></div>`).join('')
    : `<p class="vacio">${e.fase === 'senado' ? 'Todavía no se ha votado esta estación.' : 'Nada aprobado esta estación.'}</p>`;
  const prom = e.promesas.map(p => `<div class="orden">${ico('promesa')}<span>Promesa a los ${BANDOS[p.bando].nombre.toLowerCase()}</span><small>Aprueba una ley que les guste como tarde en la estación ${p.vence + 1}</small></div>`).join('');
  return `<section class="ca">${guia('mando')}<div class="amenaza ro-papiro"><b>Golpe de Cartago en la estación ${K.turnos}.</b> Ahora ${e.amenaza}; llegará a unos <b>${prev}</b> (entre ${G.min} y ${G.max}, según los sucesos).
    <div class="barra roja"><i style="width:${(100 * prev / tope).toFixed(0)}%"></i></div>Tus fuerzas: <b>${f}</b> (${e.legiones} legiones de ${R.fuerzaLegion(e)}, muralla ${e.edif.muralla * K.muralla}${e.saberes.includes('corvus') ? ', corvus ' + K.corvus : ''})${G.enCola ? `; en camino <b>+${G.enCola}</b>` : ''}
    <div class="barra"><i style="width:${(100 * f / tope).toFixed(0)}%"></i></div>${leva}</div>
    ${E ? `<div class="bloque"><h3 class="ro-rubrica">${ico('edad')}Para la Edad ${ROMANO[E.n - 1]} «${E.nombre}»</h3><ul class="req">${reqLista(E)}</ul>${e.edad < 2 ? '<small class="vacio">Sin la Edad II no hay triunfo.</small>' : ''}</div>` : ''}</section>
    <section class="cb"><div class="bloque"><h3 class="ro-rubrica">${ico('favor')}Ordenado</h3>${ordenado}${prom}</div>
    <div class="bloque"><h3 class="ro-rubrica">${ico('obra')}Cumpliéndose</h3>${e.ordenes.length ? e.ordenes.map(filaOrden).join('') : '<p class="vacio">La cola de mando está vacía.</p>'}</div>
    <div class="bloque"><h3 class="ro-rubrica">${ico('ciudad')}Ha cambiado</h3>${e.ultimo ? resumenCambios(e.ultimo.cambios) : '<p class="vacio">Al terminar la estación verás aquí lo que ganó Roma.</p>'}</div></section>`;
}
function reqLista(E) {
  const li = (ok, t) => `<li class="${ok ? 'ok' : 'no'}">${t}</li>`, out = [];
  out.push(li(e.saberes.length >= E.saberes, `${E.saberes} saberes (tienes ${e.saberes.length})`));
  for (const k in E.edif) out.push(li(e.edif[k] >= E.edif[k], `${EDIFICIOS[k].nombre} ${E.edif[k]} (tienes ${e.edif[k]})`));
  out.push(li(false, 'Y que el Senado vote «Pasar de edad»'));
  return out.join('');
}

/* ---------- capas ---------- */
function capa(html, cl = '') { const c = $('capa'); c.innerHTML = `<div class="hoja ${cl}">${html}</div>`; c.hidden = false; }
function cierraCapa() { clearTimeout(anim); anim = null; $('capa').hidden = true; $('capa').innerHTML = ''; }

/* recuento: se pinta una vez y luego solo cambian el escaño, el marcador y la cara del jefe que vota */
function recuento() {
  const r = e.recuento, N = r.votos.length; let k = 0, si = 0, no = 0, golpeDado = false; const gestos = {};
  capa(`<h2 class="ro-ansata">Recuento</h2><p class="ley-voto">${texto(r.ley).titulo}</p>
    <div class="hemi">${hemiciclo(s => { const v = r.votos.find(x => x.i === s.i); return asiento(s.bando, v.clase === 'dudoso' ? 'dudoso' : 'espera'); }, {}, 'rc-hemi')}</div>
    <div class="marcador"><span class="si"><b id="rc-si">0</b> sí</span><span class="no"><b id="rc-no">0</b> no</span></div>
    <div class="pista-voto"><i id="rc-barra"></i><em style="left:${(100 * K.mayoria / N).toFixed(1)}%"><span>${K.mayoria}</span></em></div>
    <div class="sello-res" id="rc-sello" hidden></div>
    <p class="resultado" id="resultado">Votan: ${BANDOS[r.votos[0].bando].nombre}…</p>
    <button class="boton2" data-a="saltar">Saltar el recuento</button>
    <button class="boton ro-sello" data-a="al-mando" hidden>Ver la cola de mando</button>`, 'recuento');
  const hoja = $('capa').querySelector('.hoja');
  const ponJefe = (b, g) => { if (gestos[b] === g) return; gestos[b] = g; const n = hoja.querySelector(`[data-jefe="${b}"]`); if (n) n.innerHTML = retratoEn(b, g); };
  const sello = (t, cl) => { const s = $('rc-sello'); s.textContent = t; s.className = 'sello-res ' + cl; s.hidden = false; };
  const marca = () => {
    $('rc-si').textContent = si; $('rc-no').textContent = no; $('rc-barra').style.width = (100 * si / N).toFixed(1) + '%';
    const p = $('rc-si').parentNode; p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
    if (si >= K.mayoria && !golpeDado) { golpeDado = true; hoja.classList.add('golpe'); $('rc-barra').classList.add('llena'); sello(r.veto ? '¡Mayoría!… y veto' : '¡Mayoría!', 'oro'); }
  };
  const final = () => {
    clearTimeout(anim); anim = null;
    $('resultado').className = 'resultado ' + (r.aprobada ? 'bien' : 'mal');
    $('resultado').textContent = r.aprobada ? `Aprobada ${r.si} a ${r.no}: pasa a la cola de mando` : r.veto ? `Tenía ${r.si} votos, pero el tribuno de la plebe la veta` : `Rechazada ${r.si} a ${r.no}: hacían falta ${K.mayoria}`;
    sello(r.aprobada ? 'Aprobada' : r.veto ? 'Vetada' : 'Rechazada', r.aprobada ? 'rojo' : 'gris');
    hoja.querySelector('[data-a="saltar"]').hidden = true; hoja.querySelector('[data-a="al-mando"]').hidden = false;
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
  window.__ev7.saltar = () => {
    clearTimeout(anim); if (k >= N && !$('rc-sello').hidden && hoja.querySelector('[data-a="saltar"]').hidden) return;
    while (k < N) { const v = r.votos[k++]; const n = hoja.querySelector(`[data-asiento="${v.i}"]`); if (n) n.innerHTML = asiento(v.bando, v.si ? 'si' : 'no'); }
    si = r.si; no = r.no;
    BS.forEach(b => { const vs = r.votos.filter(x => x.bando === b), s = vs.filter(x => x.si).length; ponJefe(b, s * 2 > vs.length ? 'si' : 'no'); });
    marca(); final();
  };
}

function pasoEstacion(inf) {
  const sig = e.fase !== 'fin';
  capa(`<h2 class="ro-ansata">Cierre: ${R.nombreEstacion(inf.turno).split(' de ')[0]}</h2>
    <p class="ro-rubrica">Así ha cambiado Roma</p>${resumenCambios(inf.cambios)}
    ${sig ? `<div class="ro-hiedra"><svg viewBox="0 0 22 14"><path d="M11 1c3 4 9 3 10 6-4 0-6 3-10 6-4-3-6-6-10-6 1-3 7-2 10-6z"/></svg></div><p class="ro-rubrica">Llega ${R.nombreEstacion(e.turno)}</p>${bandaSuceso()}` : ''}
    <button class="boton ro-sello" data-a="${sig ? 'a-ciudad' : 'veredicto'}">${sig ? 'Ver cómo ha crecido Roma' : 'Ver el veredicto'}</button>`);
}

function veredicto() {
  const f = e.fin, gana = f.gana;
  capa(`<div class="veredicto"><h2 class="ro-ansata">Veredicto</h2>
    <div class="ilus">${A.ilustracionFin(f)}</div>
    <div class="titulo ${gana ? 'gana' : 'pierde'}">${f.titulo}</div>
    <div class="nota">Nota: ${String(f.nota).replace('.', ',')} de 10</div>
    <ul>${f.causas.map(c => `<li>${c}</li>`).join('')}</ul>${R.consejo ? `<p class="consejo">${R.consejo(e)}</p>` : ''}
    <p class="resumen">${Math.min(e.turno + 1, K.turnos)} estaciones · ${e.legiones} legiones · ${e.saberes.length} saberes · Edad ${ROMANO[e.edad - 1]} · plebe ${e.plebe}</p>
    <button class="boton ro-sello" data-a="otra">Jugar otra vez</button>
    <button class="boton2" data-a="cerrar">Mirar la ciudad</button></div>`, 'fin');
}

/* ---------- portada ---------- */
function portada() {
  const p = $('portada'), sigue = e && e.fase !== 'fin';
  p.innerHTML = `${A.portada(390, 844).replace('class="portada-svg"', 'class="portada-svg de-pie"')}${A.portada(844, 390).replace('class="portada-svg"', 'class="portada-svg tumbada"')}<div class="portada-txt"><h1 class="titulo-bronce">AQVILA</h1><p class="lema">Roma, 264 a.C. · El Senado manda, la ciudad obedece</p></div>
    <div class="portada-botones"><button class="boton ro-sello" data-a="nueva">Nueva partida</button>
    ${sigue ? `<button class="boton ro-bronce" data-a="seguir">Seguir · ${R.nombreEstacion(e.turno)}</button>` : ''}
    <p class="credito">Dibujos propios de la maqueta · doce estaciones</p></div>`;
  p.hidden = false;
}

/* ---------- pintar todo ---------- */
function principal() {
  const b = $('principal'); b.classList.remove('apagado');
  if (e.fase === 'fin') b.textContent = 'Ver el veredicto';
  else if (e.fase === 'mando') b.textContent = 'Terminar la estación';
  else if (ui.tab !== 'senado') b.textContent = 'Ir al Senado a votar';
  else if (e.sel < 0) { b.textContent = 'Elige una ley para votar'; b.classList.add('apagado'); }
  else b.textContent = 'Llamar a votar';
}
function pintar() {
  clearTimeout(zoomT);
  cabecera();
  const c = $('cuerpo'), y = ui.tab === ui._ultimo ? c.scrollTop : 0;
  c.className = 'p-' + ui.tab;
  c.innerHTML = ui.tab === 'ciudad' ? pantallaCiudad() : ui.tab === 'senado' ? pantallaSenado() : pantallaMando();
  c.scrollTop = y; ui._ultimo = ui.tab;
  $('nav').innerHTML = [['ciudad', 'Ciudad', 'ciudad'], ['senado', 'Senado', 'senado'], ['mando', 'Mando', 'mando']].map(([t, n, i]) => `<button class="${ui.tab === t ? 'on' : ''}" data-a="tab" data-x="${t}">${ico(i)}${n}</button>`).join('');
  principal(); guardar();
}

/* ---------- toques ---------- */
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-a], #principal'); if (!t) return;
  if (t.id === 'principal') {
    if (e.fase === 'fin') return veredicto();
    if (e.fase === 'mando') { const inf = R.terminar(e); pintar(); return pasoEstacion(inf); }
    if (ui.tab !== 'senado') { ui.tab = 'senado'; return pintar(); }
    if (e.sel < 0) { const c = $('cuerpo').querySelector('.cartas'); if (c) { c.scrollIntoView({ block: 'center' }); c.animate([{ outline: '3px solid #9b2a1a' }, { outline: '3px solid transparent' }], 900); } return; }
    R.votar(e); pintar(); return recuento();
  }
  const a = t.dataset.a, x = t.dataset.x;
  if (a === 'tab') { ui.tab = x; pintar(); }
  else if (a === 'fuente') { ui.verFuente = !ui.verFuente; pintar(); }
  else if (a === 'ley') { R.elegir(e, e.sel === +x ? -1 : +x); pintar(); }
  else if (a === 'info') { ui.info = ui.info === x ? null : x; pintar(); }
  else if (a === 'trato') { const ciclo = [undefined, 'oro', 'promesa']; let i = ciclo.indexOf(e.tratos[x]); for (let n = 0; n < 3; n++) { i = (i + 1) % 3; if (!ciclo[i] || R.trato(e, x, ciclo[i])) { if (!ciclo[i]) R.trato(e, x, null); break; } } pintar(); }
  else if (a === 'leva') { if (R.levaPagada(e)) pintar(); }
  else if (a === 'pasar') { R.dejarPasar(e); ui.tab = 'mando'; pintar(); }
  else if (a === 'saltar') window.__ev7.saltar();
  else if (a === 'al-mando') { cierraCapa(); ui.tab = 'mando'; pintar(); }
  else if (a === 'a-ciudad') { cierraCapa(); ui.tab = 'ciudad'; pintar(); zoomNuevo(); }
  else if (a === 'veredicto') veredicto();
  else if (a === 'otra') { cierraCapa(); nueva(semillaNueva()); pintar(); }
  else if (a === 'cerrar') { cierraCapa(); ui.tab = 'ciudad'; pintar(); }
  else if (a === 'nueva') { $('portada').hidden = true; nueva(SEMILLA_FIJA || semillaNueva()); pintar(); }
  else if (a === 'seguir') { $('portada').hidden = true; pintar(); }
});

/* ---------- arranque y gancho para las pruebas ---------- */
cargar();
window.__ev7 = { lista: false, estado: () => JSON.parse(JSON.stringify(e)), lugar: () => ui.tab, R, saltar: () => { }, portada: () => !$('portada').hidden, focos: () => focos.slice() };
if (e && e.fase === 'fin') { pintar(); veredicto(); }
else portada();
window.__ev7.lista = true;
