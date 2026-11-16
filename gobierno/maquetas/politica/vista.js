// EV1 · pantalla de «Un año de política». Solo dibuja; las reglas viven en reglas.js.
import { crear, favor, escena, votos, tratos, votar, elegir, seguir, cierre, debate, repartoTras, BANDOS, HACEN_FALTA } from './reglas.js';
const $ = s => document.querySelector(s), NS = 'http://www.w3.org/2000/svg';
const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOMBRE = { oro: 'Oro', pueblo: 'Pueblo', ter: 'Terratenientes', mer: 'Mercaderes', mil: 'Militares' };
const ICONO = {
  oro: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><path d="M12 9v6M10 12h4"/></svg>',
  pueblo: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 19c0-4 2.5-6 5.5-6s5.5 2 5.5 6M14.5 14.5c3-.8 7 .3 7 4.5"/></svg>',
  favor: '<svg viewBox="0 0 24 24"><path d="M3 7h18M5 7v2M19 7v2M6 9h12M8 9v9M12 9v9M16 9v9M5 18h14M4 21h16M12 3l9 4H3z"/></svg>',
};
const SI = '<svg viewBox="0 0 16 16" stroke="#8fae5a"><path d="M2 8.5l4 4 8-9"/></svg>', NO = '<svg viewBox="0 0 16 16" stroke="#d9764a"><path d="M3 3l10 10M13 3L3 13"/></svg>';
let E, fase, sel, tr, pend, res, vista0, abierto;
const nuevo = () => { E = crear(); fase = 'antes'; sel = null; tr = new Set(); pend = false; res = null; abierto = null; vista0 = snap(); pintaCifras(false); render(); };
const snap = () => ({ oro: E.oro, pueblo: E.pueblo, favor: Math.round(favor(E)), humor: { ...E.humor } });

/* ---------- cabecera ---------- */
function pintaEst() {
  $('#est').innerHTML = ['Prim.', 'Ver.', 'Oto.', 'Inv.'].map((n, i) => `<i class="${i === E.paso ? 'on' : i < E.paso ? 'ya' : ''}">${n}</i>`).join('');
}
let mostrado = null;
function pintaCifras(anima) {
  const nuevoV = snap(), c = $('#cifras');
  if (!c.children.length) c.innerHTML = [['oro', 'Oro'], ['pueblo', 'Pueblo'], ['favor', 'Senado']].map(([k, t]) => `<div class="cifra" id="c-${k}">${ICONO[k]}<div><b id="v-${k}">0</b><small>${t}</small></div>${k === 'favor' ? '<div class="rayas">' + ['ter', 'mer', 'mil'].map(b => `<u id="r-${b}" style="--c:${BANDOS[b].color};height:50%"></u>`).join('') + '</div>' : ''}</div>`).join('');
  pintaEst();
  const ant = mostrado || nuevoV; mostrado = nuevoV;
  for (const k of ['oro', 'pueblo', 'favor']) {
    const el = $('#v-' + k), d = nuevoV[k] - (anima ? ant[k] : nuevoV[k]);
    const dur = anima && !calma ? 800 : 0, t0 = performance.now(), a = ant[k], z = nuevoV[k];
    const paso = t => { const p = dur ? Math.min(1, (t - t0) / dur) : 1; el.textContent = Math.round(a + (z - a) * p); if (p < 1) requestAnimationFrame(paso); else el.textContent = z; };
    if (anima && d) { requestAnimationFrame(paso); const cj = $('#c-' + k); cj.classList.remove('late'); void cj.offsetWidth; cj.classList.add('late'); const f = document.createElement('span'); f.className = 'flota ' + (d > 0 ? 'b' : 'm'); f.textContent = (d > 0 ? '+' : '−') + Math.abs(d); cj.appendChild(f); setTimeout(() => f.remove(), 1700); }
    else el.textContent = z;
  }
  for (const b of ['ter', 'mer', 'mil']) $('#r-' + b).style.height = Math.max(8, nuevoV.humor[b]) + '%';
}

/* ---------- piezas ---------- */
const signo = n => (n > 0 ? '+' : '−') + Math.abs(n);
function chip(c) {
  const bueno = c.n > 0, nom = NOMBRE[c.que];
  if (c.nota) return `<span class="chip ${bueno ? 'p' : 'm'} rota">Promesa ${c.nota === 'rota' ? 'rota' : 'cumplida'} · ${nom} ${signo(c.n)}</span>`;
  return `<span class="chip ${bueno ? 'b' : 'm'}">${nom} ${signo(c.n)}</span>`;
}
const chips = l => l.length ? `<div class="chips">${l.map(chip).join('')}</div>` : '';
function tablilla(s) {
  return `<section class="panel tab"><div class="f ins">${s.fecha}</div><p>${s.texto}</p><button class="fb" id="fbtn">Fuente</button><div class="fuente" id="fuente" hidden><b>Fuente:</b> ${s.fuente}<br><b>Dictamen:</b> ${s.dictamen}</div></section>`;
}
function enlazaFuente() { const b = $('#fbtn'); if (b) b.onclick = () => { const f = $('#fuente'); f.hidden = !f.hidden; }; }
const pie = html => { $('#pie').innerHTML = html; };

/* ---------- hemiciclo ---------- */
let asientos;
function sala() {
  const cx = 195, cy = 190, filas = [[8, 62], [10, 92], [12, 122]], seats = [];
  filas.forEach(([n, r]) => { for (let i = 0; i < n; i++) { const a = Math.PI * (1 - (i + .5) / n); seats.push({ a, x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }); } });
  seats.sort((p, q) => q.a - p.a);
  let k = 0, h = '<path d="M20 190A175 175 0 0 1 370 190Z" fill="#0b1016" stroke="#b8862b" stroke-opacity=".5"/><path d="M150 190A45 45 0 0 1 240 190Z" fill="#1a1510" stroke="#b8862b" stroke-opacity=".7"/>';
  asientos = {};
  for (const b of ['ter', 'mer', 'mil']) {
    const g = seats.slice(k, k += E.escanos[b]).sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
    asientos[b] = g.length;
    g.forEach((s, i) => { h += `<g class="as du" data-b="${b}" data-i="${i}" style="--c:${BANDOS[b].color}"><circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="10" stroke-width="2.2"/><text class="q" x="${s.x.toFixed(1)}" y="${(s.y + 4.5).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${BANDOS[b].color}">?</text><path class="x" d="M${(s.x - 4).toFixed(1)} ${(s.y - 4).toFixed(1)}l8 8m0-8l-8 8" stroke="${BANDOS[b].color}" stroke-width="2"/></g>`; });
  }
  h += '<text x="195" y="180" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="9" letter-spacing="1.2" fill="#b8862b">CÓNSULES</text>';
  return `<svg id="sala" viewBox="0 48 390 150" role="img" aria-label="Hemiciclo del Senado">${h}</svg>`;
}
function pintaSala(v) {
  for (const b of ['ter', 'mer', 'mil']) { const x = v[b]; document.querySelectorAll(`.as[data-b="${b}"]`).forEach(g => { const i = +g.dataset.i; g.classList.remove('si', 'du', 'no', 'cu'); g.classList.add(i < x.si ? 'si' : i < x.si + x.duda ? 'du' : 'no'); }); }
  const c = $('#cuenta'); if (c) c.innerHTML = `<b class="s">${v.si} sí</b> · <b class="d">${v.duda} dudan</b> · <b class="n">${v.no} no</b> <em>— hacen falta ${HACEN_FALTA}</em>`;
}
const leyenda = () => `<div id="leyenda">${['ter', 'mer', 'mil'].map(b => `<span><i style="--c:${BANDOS[b].color}"></i>${BANDOS[b].nombre} ${E.escanos[b]}</span>`).join('')}</div>`;

/* ---------- escenas ---------- */
function render() {
  parar(); pintaEst(); const s = escena(E), c = $('#cuerpo');
  c.scrollTop = 0;
  if (s.tipo === 'voto') return renderVoto(s, c);
  if (s.tipo === 'cierre') return renderCierre(s, c);
  renderOpciones(s, c);
}
let pasoDeb = 0, timers = [], bloqueo = false;
const rapido = calma || /rapido=1/.test(location.search);
const parar = () => { timers.forEach(clearTimeout); timers = []; };
const espera = (f, ms) => timers.push(setTimeout(f, ms));
function vivo() {
  const r = repartoTras(E, pasoDeb), o = { si: 0, duda: 0, no: 0 };
  for (const b of ['ter', 'mer', 'mil']) { const x = { ...r[b] }; if (tr.has(b)) { x.si += x.duda; x.duda = 0; } r[b] = x; for (const k in o) o[k] += x[k]; }
  return { ...r, ...o };
}
function globo(b, texto, ms) {
  const t = $('#tribuna'); if (!t) return;
  t.style.justifyContent = b === 'ter' ? 'flex-start' : b === 'mil' ? 'flex-end' : 'center';
  t.innerHTML = texto ? `<div class="glo" style="--c:${BANDOS[b].color}"><b class="ins">${BANDOS[b].nombre}</b>${texto}</div>` : '';
  document.querySelectorAll('.as.hab').forEach(g => g.classList.remove('hab'));
  if (texto && !ms) { const g = document.querySelector(`.as[data-b="${b}"][data-i="0"]`); if (g) g.classList.add('hab'); }
  if (ms) espera(() => { if (t.firstChild) t.innerHTML = ''; }, ms);
}
function discurso(k) {
  if (!$('#tribuna')) return;
  const ps = debate(E);
  if (k >= ps.length) { globo('ter', ''); pasoDeb = ps.length; actualizaVoto(); return; }
  globo(ps[k].bando, '«' + ps[k].frase + '»');
  espera(() => { pasoDeb = k + 1; actualizaVoto(); }, 1100);
  espera(() => discurso(k + 1), 2000);
}
function saltaDebate() { parar(); pasoDeb = 6; const t = $('#tiempo i'); if (t) { t.style.transition = 'none'; t.style.width = '100%'; } if ($('#tribuna')) globo('ter', ''); if ($('#principal') && fase === 'antes' && !pend) actualizaVoto(); }
function renderVoto(s, c) {
  const trat = tratos();
  const salaHtml = '<div id="tribuna"></div><div id="salaw">' + sala() + '</div><div id="cuenta"></div>';
  if (fase === 'despues') {
    c.innerHTML = salaHtml.replace('<div id="tribuna"></div>', '') + `<div class="panel res"><p>${res.linea}</p>${chips(res.cambios)}</div>`;
    pintaSala(E.marcas.votos); pie('<button class="btn rojo" id="principal">Seguir</button>'); $('#principal').onclick = seguirEscena; return;
  }
  if (pend) {
    c.innerHTML = salaHtml.replace('<div id="tribuna"></div>', '') + `<div class="ley"><b>El Senado no se decide.</b></div>
    <button class="carta on" id="o-pueblo"><h3>Llevarlo al pueblo</h3><p>Cruzas igual, pero el Senado se resiente.</p>${chips([{ que: 'ter', n: -10 }, { que: 'mer', n: -10 }, { que: 'mil', n: -10 }, { que: 'pueblo', n: 6 }])}</button>
    <button class="carta" id="o-acatar"><h3>Acatar al Senado</h3><p>No cruzas.</p>${chips([{ que: 'ter', n: 4 }, { que: 'mil', n: -6 }])}</button>`;
    pintaSala(E.marcas.votos);
    pie('<button class="btn rojo" id="pueblo">Llevarlo al pueblo</button><button class="btn lin" id="acatar">Acatar al Senado</button>');
    $('#pueblo').onclick = () => decide('pueblo'); $('#acatar').onclick = () => decide('acatar'); return;
  }
  pasoDeb = rapido ? 6 : 0; bloqueo = false;
  c.innerHTML = tablilla(s) + `<div class="ley">El Senado propone: <b>${s.ley.titulo}</b> · ley de guerra</div>` + salaHtml + '<div id="tiempo" title="El cónsul llama a votar"><i></i></div>' +
    trat.map(t => `<button class="carta" data-t="${t.id}" style="--c:${BANDOS[t.bando].color}"><div class="cab"><u></u>${BANDOS[t.bando].nombre} · ${E.escanos[t.bando]} escaños<s class="${t.etiqueta === 'Arriesgado' ? 'arr' : ''}">${t.etiqueta}</s></div><h3>${t.tipo}: ${t.titulo}</h3><div class="chips"><span class="chip p" data-v="${t.bando}"></span>${t.chips.map(chip).join('')}</div></button>`).join('');
  enlazaFuente();
  c.querySelectorAll('.carta').forEach(b => b.onclick = () => { if (bloqueo) return; const id = b.dataset.t; tr.has(id) ? tr.delete(id) : tr.add(id); b.classList.toggle('on', tr.has(id)); actualizaVoto(); });
  $('#salaw').onclick = ev => { const g = ev.target.closest('.as'); if (!g || !g.classList.contains('du') || bloqueo) return; const b = g.dataset.b, t = trat.find(x => x.bando === b); parar(); globo(b, `Duda. Le convence: «${t.titulo}»`, 3000); if (pasoDeb < 6) espera(() => discurso(Math.min(5, Math.floor(pasoDeb))), 3100); };
  pie('<button class="btn rojo" id="principal"></button>'); $('#principal').onclick = votarYa; actualizaVoto();
  if (rapido) { const t = $('#tiempo i'); t.style.width = '100%'; } else { requestAnimationFrame(() => requestAnimationFrame(() => { const t = $('#tiempo i'); if (t) { t.style.transition = 'width 12s linear'; t.style.width = '100%'; } })); espera(() => discurso(0), 500); }
}
function actualizaVoto() {
  const v = vivo(); pintaSala(v);
  const p = $('#principal'); if (p && !bloqueo) p.textContent = `Votar ya · ${v.si} de ${HACEN_FALTA}`;
  document.querySelectorAll('[data-v]').forEach(x => { const d = v[x.dataset.v].duda, tt = tr.has(x.dataset.v); x.textContent = tt ? 'votan sí' : '+' + d + ' votos'; });
}
function votarYa() {
  if (bloqueo) return; saltaDebate(); bloqueo = true; const p = $('#principal'); p.disabled = true;
  const antes = snap(), r = votar(E, [...tr]); res = r; vista0 = antes;
  const fin = E.marcas.votos, gs = [...document.querySelectorAll('.as')].sort((a, b) => a.querySelector('circle').getAttribute('cx') - b.querySelector('circle').getAttribute('cx'));
  const acaba = () => { if (r.sale) fase = 'despues'; else pend = true; pintaCifras(true); render(); };
  if (rapido) return acaba();
  const cont = { ter: 0, mer: 0, mil: 0 }, cls = {}, vistos = { si: 0, duda: 0, no: 0 };
  for (const b of ['ter', 'mer', 'mil']) { const x = fin[b]; document.querySelectorAll(`.as[data-b="${b}"]`).forEach(g => { const i = +g.dataset.i; cls[b + i] = i < x.si ? 'si' : i < x.si + x.duda ? 'du' : 'no'; }); }
  gs.forEach(g => { g.classList.remove('si', 'du', 'no', 'hab'); g.classList.add('cu'); });
  gs.forEach((g, n) => espera(() => { const k = cls[g.dataset.b + g.dataset.i]; g.classList.remove('cu'); g.classList.add(k); vistos[k]++; $('#cuenta').innerHTML = `<b class="s">sí ${vistos.si}</b> · <b class="d">dudan ${vistos.duda}</b> · <b class="n">no ${vistos.no}</b> <em>— hacen falta ${HACEN_FALTA}</em>`; if (n === gs.length - 1) espera(acaba, 700); }, 120 * (n + 1)));
}
function decide(id) { const r = elegir(E, id); res = r; pend = false; fase = 'despues'; pintaCifras(true); render(); }
function renderOpciones(s, c) {
  const hecho = fase === 'despues';
  if (hecho) { const o = s.opciones.find(x => x.id === sel); c.innerHTML = tablilla(s) + `<div class="carta on" style="margin-bottom:0"><h3>${o.titulo}</h3></div><div class="panel res"><p>${res.linea}</p>${chips(res.cambios)}</div>`; enlazaFuente(); pie('<button class="btn rojo" id="principal">Seguir</button>'); $('#principal').onclick = seguirEscena; return; }
  c.innerHTML = tablilla(s) + s.opciones.map(o => `<button class="carta ${o.apagada ? 'off' : ''} ${sel === o.id ? 'on' : ''}" data-o="${o.id}" ${o.apagada ? 'aria-disabled="true"' : ''}><h3>${o.titulo}</h3>${chips(o.chips)}${o.aviso ? `<div class="aviso">${o.aviso}</div>` : ''}</button>`).join('');
  enlazaFuente();
  c.querySelectorAll('.carta').forEach(b => b.onclick = () => { if (b.classList.contains('off')) return; sel = b.dataset.o; c.querySelectorAll('.carta').forEach(x => x.classList.toggle('on', x === b)); $('#principal').disabled = false; });
  pie(`<button class="btn rojo" id="principal" ${sel ? '' : 'disabled'}>Decidir</button>`);
  $('#principal').onclick = () => { if (!sel) return; res = elegir(E, sel); fase = 'despues'; pintaCifras(true); render(); };
}
function seguirEscena() { seguir(E); fase = 'antes'; sel = null; res = null; pend = false; pintaEst(); render(); }

/* ---------- cierre ---------- */
function vistos() { try { return JSON.parse(localStorage.getItem('aqvila-ev1-rumbos') || '[]'); } catch (e) { return []; } }
function anotaRumbo(id) { try { const l = vistos(); if (!l.includes(id)) { l.push(id); localStorage.setItem('aqvila-ev1-rumbos', JSON.stringify(l)); } return l.length; } catch (e) { return 1; } }
function hilo(nudos) {
  const xr = 30, ys = 34;
  return nudos.map((n, i) => {
    const xi = n.igual ? xr : 90, sig = nudos[i + 1], xs = sig ? (sig.igual ? xr : 90) : xi;
    const curva = d => `M${d} 0V78C${d} 96 ${sig ? xs : d} 94 ${sig ? xs : d} 112`;
    const real = `<path d="M${xr} 0V78C${xr} 96 ${xr} 94 ${xr} 112" stroke="#b8862b" stroke-width="5" fill="none"/>`;
    const tu = `<path d="${curva(xi)}" stroke="#e9c063" stroke-width="2.5" fill="none"/>`;
    const ini = i === 0 ? '' : '';
    const nodoReal = `<circle cx="${xr}" cy="${ys}" r="9" fill="#0b1016" stroke="#b8862b" stroke-width="2.5"/>`;
    const nodoTu = n.igual ? `<circle cx="${xr}" cy="${ys}" r="4.5" fill="#e9c063"/>` : `<circle cx="${xi}" cy="${ys}" r="9" fill="#c0281f" stroke="#e9c063" stroke-width="2"/>`;
    return `<button class="hl" data-n="${i}"><svg viewBox="0 0 120 112" aria-hidden="true">${real}${tu}${ini}${nodoReal}${nodoTu}</svg><div class="tx"><div class="es ins">${n.estacion}</div><div class="fu">Fue: ${n.real}</div><div class="tu">${n.igual ? '' : '<em>desvío</em>'}Tú: ${n.tu}</div></div></button>`;
  }).join('');
}
function renderCierre(s, c) {
  const ci = cierre(E), nv = anotaRumbo(ci.rumbo.id), r = ci.rumbo;
  const flecha = b => `<span class="${b.dif >= 0 ? 'b' : 'm'}"><svg width="10" height="10" viewBox="0 0 10 10"><path d="${b.dif >= 0 ? 'M5 1L9 8H1z' : 'M5 9L1 2h8z'}" fill="currentColor"/></svg>${b.dif >= 0 ? '+' : '−'}${Math.abs(b.dif)}</span>`;
  const nom = { oro: 'Oro', pueblo: 'Pueblo', favor: 'Senado' };
  c.innerHTML = `<div class="medidor"><div class="t ins"><span>Desvío de la historia</span><b>${ci.desvio} %</b></div><div class="barra"><i style="width:0"></i></div></div>
  <div class="cols ins"><span>Como fue</span><span>Tu año</span></div>
  <div class="hilos">${hilo(ci.nudos)}</div>
  <div class="panel tab" id="det" style="animation:none;margin:6px 0 0;padding:8px 12px;font-size:13px;color:var(--piedra)"><b style="color:var(--marmol)">Fuente:</b> <span id="d-f">${ci.nudos[0].fuente}</span><br><b style="color:var(--marmol)">Dictamen:</b> <span id="d-d">${ci.nudos[0].dictamen}</span></div>
  <section class="panel rumbo"><div class="f ins" style="font-size:11px;color:var(--piedra)">Hacia dónde vas</div>
  <span class="eti ${r.real ? 'real' : ''}">${r.real ? 'así fue' : 'conjetura · licencia de juego'}</span><h2 class="ins" style="letter-spacing:.06em">${r.titulo}</h2><p>${r.frase}</p>
  <div class="vn"><small>Lo que viene</small>${r.viene}</div>
  <div class="sec">${ci.secundaria}<br><span class="eti" style="margin-top:4px">${r.real && E.marcas.juegos === true ? 'así fue' : 'conjetura · licencia de juego'}</span></div></section>
  <div class="bal">${ci.balance.map(b => `<div class="panel"><small>${nom[b.que]}</small><b>${b.fin}</b>${flecha(b)}</div>`).join('')}</div>
  ${ci.promesas.length ? `<div class="prom">${ci.promesas.map(p => `<div>${p.estado === 'rota' ? NO : SI}<span>${p.texto}: <b>${p.estado === 'rota' ? 'rota' : 'cumplida'}</b></span></div>`).join('')}</div>` : ''}`;
  setTimeout(() => { const i = c.querySelector('.barra i'); if (i) i.style.width = ci.desvio + '%'; }, 50);
  c.querySelectorAll('.hl').forEach(b => b.onclick = () => { const n = ci.nudos[+b.dataset.n]; c.querySelectorAll('.hl').forEach(x => x.classList.toggle('sel', x === b)); $('#d-f').textContent = n.fuente; $('#d-d').textContent = n.dictamen; });
  pie(`<button class="btn rojo" id="principal">Jugar otro 264 distinto</button><small>Hay 4 rumbos. Has visto ${nv}.</small>`);
  $('#principal').onclick = nuevo;
}

nuevo();
window.__ev = { lista: true, salta: saltaDebate, estado: () => ({ paso_deb: pasoDeb, paso: E.paso, fase, pend, sel, oro: E.oro, pueblo: E.pueblo, favor: Math.round(favor(E)), marcas: E.marcas, desvio: E.paso === 3 ? cierre(E).desvio : null }) };
