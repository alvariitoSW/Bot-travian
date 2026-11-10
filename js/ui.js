/* AQVILA — interfaz: mapa 3D como pantalla principal, paneles, modales y pantalla de batalla */
import { MapView3D } from './gfx/map3d.js';
import { BattleView3D } from './gfx/battle3d.js';
import { portrait } from './gfx/models.js';

const D = window.DATA, G = window.Game, $ = id => document.getElementById(id);
const UI = { tab: 'map', city: 'roma', sel: null, modalQ: [], modalOpen: false, battle: null, menu: true, last: 0, saveT: 0, map: null };
const ROMA = D.FACTIONS.roma.col;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => { n = Math.floor(n); return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); };
const months = m => m < 1 ? Math.max(1, Math.round(m * 30)) + ' días' : (m >= 12 ? (m / 12).toFixed(1).replace('.', ',') + ' años' : m.toFixed(1).replace('.', ',') + ' meses');
const costHtml = c => '<div class="cost">' + Object.keys(c).map(r => '<span>' + D.RES_ICON[r] + ' ' + fmt(c[r]) + '</span>').join('') + '</div>';
const pt = (k, col) => { const u = portrait(k, col || ROMA); return u ? '<img src="' + u + '" alt="">' : '<span style="display:grid;place-items:center;height:100%;font-size:22px">' + D.UNITS[k].g + '</span>'; };
const troopsHtml = (u, col) => { const k = Object.keys(u).filter(x => u[x] > 0); return k.length ? '<div class="troops">' + k.map(x => '<div class="troop">' + pt(x, col) + '<em>' + u[x] + '</em><b>' + D.UNITS[x].n + '</b></div>').join('') + '</div>' : '<div class="empty">Sin tropas.</div>'; };
const S = () => G.state;
const cohort = k => (D.UNITS[k].cls === 'cav' ? 10 : 20);

/* ---------- avisos y modales ---------- */
function toast(txt, kind) {
  const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = txt; $('toasts').appendChild(t);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => t.remove(), 3200);
}
function modal(html, sticky) { UI.modalQ.push({ html: html, sticky: sticky }); pump(); }
function pump() {
  if (UI.modalOpen || !UI.modalQ.length) return;
  const m = UI.modalQ.shift(); UI.modalOpen = true; UI.sticky = m.sticky;
  $('mbox').innerHTML = m.html; $('modal').hidden = false; $('mbox').scrollTop = 0;
}
function closeModal() { UI.modalOpen = false; $('modal').hidden = true; pump(); }

G.onEvent = function (type, p) {
  if (type === 'event') modal('<div class="yr">' + p.y + ' A.C.</div><h2>' + esc(p.t) + '</h2><p>' + esc(p.x) + '</p><div class="acts"><button class="btn" data-act="close">Continuar</button></div>');
  else if (type === 'alert') toast(p, 'bad');
  else if (type === 'log') { if (p.k === 'good') toast(p.x); else if (p.k === 'bad') toast(p.x, 'bad'); UI.dirty = true; }
  else if (type === 'dirty') UI.dirty = true;
  else if (type === 'over') { if (!UI.battle && !UI.binfo) showOver(); }
};

/* ---------- menú ---------- */
function showMenu() {
  UI.menu = true; $('menu').hidden = false;
  const img = portrait('general', ROMA);
  $('menu').innerHTML = (img ? '<div class="hero"><img src="' + img + '" alt=""></div>' : '') + '<h1>AQVILA</h1><div class="sub">EL ASCENSO DE ROMA</div>' +
    '<p>280 a.C. Gobierna tus ciudades, levanta legiones, dirige las batallas sobre el terreno y lleva las águilas hasta Cartago antes del 146 a.C.</p>' +
    (G.hasSave() ? '<button class="btn gold" data-act="continue">Continuar campaña</button>' : '') +
    '<input id="hname" maxlength="28" placeholder="Nombre de tu general" value="Lucio Cornelio Escipión">' +
    '<button class="btn" data-act="new">Nueva campaña</button><div class="spqr">S·P·Q·R</div>';
}
function startGame() { UI.menu = false; $('menu').hidden = true; UI.city = 'roma'; UI.sel = null; if (UI.map) UI.map.center('roma'); setTab('map'); }
function showOver() {
  const s = S(), o = s.over; if (!o || UI.overShown) return; UI.overShown = true;
  modal('<div class="yr">' + (o.win ? 'VICTORIA' : 'DERROTA') + '</div><h2>' + (o.win ? 'Roma Victrix' : 'Vae victis') + '</h2><p>' + esc(o.why) + '</p>' +
    '<p>Ciudades: <b>' + G.myCities().length + '</b> de ' + Object.keys(D.CITIES).length + ' · Batallas: <b>' + s.stats.wins + '/' + s.stats.battles + '</b> ganadas\nEnemigos abatidos: <b>' + s.stats.kills + '</b> · Bajas propias: <b>' + s.stats.lost + '</b>\n' + esc(s.hero.name) + ', nivel <b>' + s.hero.lvl + '</b></p>' +
    '<div class="acts"><button class="btn" data-act="tomenu">Volver al menú</button></div>', true);
}

/* ---------- HUD ---------- */
function buildTop() { $('res').innerHTML = D.RES.map(r => '<div class="r" id="rb-' + r + '">' + D.RES_ICON[r] + '<b id="r-' + r + '"></b><small id="p-' + r + '"></small></div>').join(''); }
function tickUI() {
  const s = S(); if (!s) return;
  const p = G.prod(), cap = G.cap();
  for (const r of D.RES) {
    $('r-' + r).textContent = fmt(s.res[r]);
    const e = $('p-' + r), v = Math.round(p[r]); e.textContent = (v >= 0 ? '+' : '') + v; e.className = v < 0 ? 'neg' : '';
    $('rb-' + r).classList.toggle('full', s.res[r] >= cap - 1);
  }
  $('date').textContent = G.dateStr(s.t);
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.v === s.speed));
  document.querySelectorAll('[data-t1]').forEach(e => {
    const t0 = +e.dataset.t0, t1 = +e.dataset.t1, f = Math.max(0, Math.min(1, (s.t - t0) / (t1 - t0)));
    const bar = e.querySelector('i'); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
    const rem = e.parentElement.querySelector('.rem'); if (rem) rem.textContent = s.t < t0 ? 'en cola' : 'faltan ' + months(Math.max(0, t1 - s.t));
  });
  document.querySelectorAll('[data-need]').forEach(b => b.classList.toggle('no', !G.canAfford(JSON.parse(b.dataset.need))));
}

/* ---------- paneles ---------- */
function setTab(t) {
  UI.tab = t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  $('view').hidden = t === 'map'; $('zoom').hidden = t !== 'map';
  if (t === 'map') renderSheet(); else { $('sheet').hidden = true; $('view').scrollTop = 0; render(); }
}
function cityChips() {
  const my = G.myCities(); if (!my.includes(UI.city)) UI.city = my[0] || 'roma';
  return '<div class="chips">' + my.map(id => '<button class="chip ' + (id === UI.city ? 'on' : '') + '" data-act="city" data-v="' + id + '">' + D.CITIES[id].n + (S().hero.city === id ? ' 🦅' : '') + '</button>').join('') + '</div>';
}
function render() {
  UI.dirty = false;
  if (!S()) return; if (UI.tab === 'map') { renderSheet(); return; }
  const v = $('view'), st = v.scrollTop;
  v.innerHTML = UI.tab === 'city' ? viewCity() : UI.tab === 'army' ? viewArmy() : UI.tab === 'hero' ? viewHero() : viewLog();
  v.scrollTop = st; tickUI();
}
function effect(b, L) {
  const B = D.BUILD[b];
  if (B.prod) return '+' + Math.round(G.rate(L) * (b === 'foro' ? 0.5 : 1)) + '/mes';
  if (b === 'almacen') return 'Cap. ' + fmt(600 * Math.pow(1.45, L));
  if (b === 'muralla') return '+' + L * 10 + ' % def.';
  if (b === 'templo') return '+' + L * 10 + ' % exp.';
  return 'Nv ' + L;
}
function viewCity() {
  const s = S(), c = s.cities[UI.city], d = D.CITIES[UI.city];
  let h = cityChips() + '<div class="head"><h2>' + d.n + '</h2><p>' + esc(d.h) + '</p></div><div class="sec">Edificios</div>';
  for (const b in D.BUILD) {
    const B = D.BUILD[b], L = c.b[b] || 0, q = c.queue && c.queue.b === b, max = L >= D.MAX_LVL, cost = G.cost(b, L);
    h += '<div class="card"><div class="ic">' + B.i + '</div><div class="bd"><div class="tt">' + B.n + '<span class="lv">Nv ' + L + '</span></div>' +
      '<div class="ds">' + (max ? effect(b, L) + ' · nivel máximo' : effect(b, L) + ' → ' + effect(b, L + 1)) + '</div>' +
      (q ? '<div class="prog" data-t0="' + c.queue.t0 + '" data-t1="' + c.queue.t1 + '"><i></i></div><span class="rem"></span>' : max ? '' : costHtml(cost)) + '</div>' +
      (q || max ? '' : '<button class="btn ' + (c.queue ? 'no' : '') + '" data-act="up" data-v="' + b + '" ' + (c.queue ? '' : "data-need='" + JSON.stringify(cost) + "'") + '>Mejorar<small>' + months(G.buildTime(c, b)) + '</small></button>') + '</div>';
  }
  return h + '<div class="empty">' + Object.keys(D.BUILD).map(b => D.BUILD[b].i + ' ' + D.BUILD[b].d).join('<br>') + '</div>';
}
const bar = (label, v, max) => '<span>' + label + '</span><u><s style="width:' + Math.min(100, v / max * 100) + '%"></s></u>';
function viewArmy() {
  const s = S(), c = s.cities[UI.city], p = G.prod();
  let h = cityChips() + '<div class="sec">Guarnición de ' + D.CITIES[UI.city].n + ' · ' + G.men(c.units) + ' hombres</div>' + troopsHtml(c.units);
  h += '<div class="empty">🌾 Consumo de todas tus tropas: ' + Math.round(p.upkeep) + ' grano/mes · 🧱 Vigiles al defender: ' + (20 + 20 * (c.b.muralla || 0)) + '<br>Para enviarlas a la guerra, toca una ciudad vecina en el mapa.</div>';
  if (c.train.length) {
    h += '<div class="sec">En instrucción</div>';
    h += c.train.map(q => '<div class="row"><div style="display:flex;justify-content:space-between"><span>' + q.n + ' × ' + D.UNITS[q.u].n + '</span><span class="rem"></span></div><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div></div>').join('');
  }
  h += '<div class="sec">Reclutar</div>';
  for (const k in D.UNITS) {
    const u = D.UNITS[k]; if (!u.cost) continue;
    const ok = G.unitOk(c, k), rb = Object.keys(u.req)[0], n = cohort(k);
    h += '<div class="card ' + (ok ? '' : 'locked') + '"><div class="pt">' + pt(k) + '</div><div class="bd"><div class="tt">' + u.n + '</div><div class="ds">' + u.d + '</div>' +
      '<div class="bars">' + bar('Ataque', u.ratk || u.atk, 16) + bar('Defensa', u.def, 16) + bar('Moral', u.mor, 100) + bar('Velocidad', u.spd, 85) + '</div>' + costHtml(G.unitCost(k, n)) + '</div>' +
      (ok ? '<div class="btns"><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n + '" data-need=\'' + JSON.stringify(G.unitCost(k, n)) + '\'>+' + n + '</button><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n * 3 + '" data-need=\'' + JSON.stringify(G.unitCost(k, n * 3)) + '\'>+' + n * 3 + '</button></div>'
        : '<button class="btn no">' + D.BUILD[rb].n + '<small>nivel ' + u.req[rb] + '</small></button>') + '</div>';
  }
  return h;
}
function viewHero() {
  const s = S(), h = s.hero, need = G.xpNeed(h.lvl);
  const where = h.wound > s.t ? '🩸 Herido — se recupera en ' + months(h.wound - s.t) : h.march ? '🚩 En marcha con el ejército' : '📍 En ' + D.CITIES[h.city].n;
  const SK = { mando: ['⚔️ Mando', '+4 % de ataque de tu ejército por nivel'], disc: ['🛡️ Disciplina', '+3 % de defensa y +4 de moral por nivel'], log: ['🧭 Logística', '+8 % de velocidad de marcha y +10 % de botín por nivel'] };
  let o = '<div class="head"><div class="pt">' + pt('general') + '</div><h2>' + esc(h.name) + '</h2><p>General de la República · Nivel ' + h.lvl + '</p><div class="xp"><i style="width:' + Math.min(100, h.xp / need * 100) + '%"></i></div><p>Experiencia ' + h.xp + ' / ' + need + '<br>' + where + '</p></div>';
  o += '<div class="sec">Habilidades · ' + h.pts + ' punto' + (h.pts === 1 ? '' : 's') + '</div>';
  for (const k in SK) o += '<div class="card"><div class="bd"><div class="tt">' + SK[k][0] + '<span class="lv">Nv ' + h.sk[k] + '</span></div><div class="ds">' + SK[k][1] + '</div></div><button class="btn ' + (h.pts > 0 && h.sk[k] < 10 ? 'gold' : 'no') + '" data-act="skill" data-v="' + k + '">＋</button></div>';
  return o + '<div class="empty">Tu general combate con su guardia de caballería cuando acompaña a un ejército o defiende la ciudad en la que está. Gana experiencia en cada batalla; si su guardia es aniquilada, quedará herido dos años.</div>';
}
function viewLog() {
  const s = S(), year = G.yearOf(s.t), left = year - D.END_YEAR + 1;
  let o = '<div class="head"><h2>Carthago delenda est</h2><p>Conquista <b>Carthago</b> antes de que termine el año 146 a.C. Si Roma cae, la campaña termina.</p><p>⏳ Quedan <b>' + left + '</b> años · 🏛️ ' + G.myCities().length + '/' + Object.keys(D.CITIES).length + ' ciudades · ⚔️ ' + s.stats.wins + '/' + s.stats.battles + ' batallas</p></div>';
  o += '<div class="sec">Línea del tiempo</div><div class="tl">' + D.EVENTS.map((e, i) => '<div class="' + (s.ev[i] ? 'done' : '') + '"' + (s.ev[i] ? ' data-act="ev" data-v="' + i + '"' : '') + '>' + e.y + ' a.C. — ' + (s.ev[i] ? esc(e.t) : '···') + '</div>').join('') + '</div>';
  o += '<div class="sec">Crónica</div>' + (s.log.length ? s.log.map(l => '<div class="logl ' + l.k + '"><small>' + G.yearOf(l.t) + ' a.C.</small>' + esc(l.x) + '</div>').join('') : '<div class="empty">Aún no ha ocurrido nada.</div>');
  return o + '<div class="acts" style="margin-top:16px"><button class="btn ghost" data-act="tomenu">Guardar y salir al menú</button></div>';
}

/* ---------- ficha de ciudad sobre el mapa ---------- */
function renderSheet() {
  const s = S(), sh = $('sheet'); if (!s || !UI.sel || UI.tab !== 'map') { sh.hidden = true; UI.sheetKey = ''; return; }
  const id = UI.sel, c = s.cities[id], d = D.CITIES[id], f = D.FACTIONS[c.owner], mine = c.owner === 'roma';
  const src = G.neighbors(id).filter(n => s.cities[n].owner === 'roma'), inc = s.marches.filter(m => m.to === id);
  const key = id + c.owner + JSON.stringify(c.units) + src.join() + inc.map(m => m.id + Math.round((m.t1 - s.t) * 2)).join();
  if (key === UI.sheetKey && !sh.hidden) return; UI.sheetKey = key;
  let h = '<button class="x" data-act="unsel">✕</button><h3>' + d.n + '<span class="tagf" style="background:' + f.col + '">' + f.n + '</span></h3><p>' + esc(d.h) + '</p>';
  h += '<span class="stat">🧱 Muralla ' + (c.b.muralla || 0) + '</span><span class="stat">💰 ' + '★'.repeat(d.w) + '</span><span class="stat">⚔ Fuerza ' + G.power(c.units) + '</span>';
  h += '<div class="units">' + (Object.keys(c.units).filter(k => c.units[k] > 0).map(k => '<span>' + D.UNITS[k].n + ' <b>' + c.units[k] + '</b></span>').join('') || '<span>Sin guarnición</span>') + '</div>';
  if (inc.length) h += inc.map(m => '<div class="stat" style="color:' + (m.owner === 'roma' ? 'var(--good)' : 'var(--bad)') + '">' + (m.owner === 'roma' ? '🚩 Tus tropas llegan' : '⚠️ ' + D.FACTIONS[m.owner].n + ' (' + G.men(m.units) + ') llega') + ' en ' + months(m.t1 - s.t) + '</div>').join('');
  h += '<div class="acts">';
  if (mine) h += '<button class="btn gold" data-act="goto" data-v="' + id + '">Gestionar</button>';
  if (src.length) h += src.map(n => '<button class="btn" data-act="pick" data-from="' + n + '" data-to="' + id + '">' + (mine ? 'Reforzar' : 'Atacar') + ' desde ' + D.CITIES[n].n + '</button>').join('');
  else if (!mine) h += '<div class="empty">Sin ruta: conquista antes una ciudad vecina (' + G.neighbors(id).map(n => D.CITIES[n].n).join(', ') + ').</div>';
  const st = sh.scrollTop; sh.innerHTML = h + '</div>'; sh.hidden = false; sh.scrollTop = st;
}

/* ---------- envío de tropas ---------- */
function showPicker(from, to) {
  const s = S(), c = s.cities[from], own = s.cities[to].owner === 'roma', hero = G.heroAvailable(from);
  const ks = Object.keys(c.units).filter(k => c.units[k] > 0);
  let h = '<div class="yr">DESDE ' + D.CITIES[from].n.toUpperCase() + ' · ' + months(G.travel(from, to, false)).toUpperCase() + '</div><h2>' + (own ? 'Reforzar ' : 'Atacar ') + D.CITIES[to].n + '</h2>';
  if (!ks.length && !hero) h += '<p>No hay tropas en ' + D.CITIES[from].n + '. Recluta en la pestaña Ejército.</p>';
  h += ks.map(k => '<div class="pick"><div class="pt">' + pt(k) + '</div><div><label><span>' + D.UNITS[k].n + '</span><span><b id="pv-' + k + '">' + c.units[k] + '</b> / ' + c.units[k] + '</span></label><input type="range" min="0" max="' + c.units[k] + '" value="' + c.units[k] + '" data-k="' + k + '"></div></div>').join('');
  if (hero) h += '<label class="chk"><input type="checkbox" id="pk-hero" checked> 🦅 El general acompaña al ejército</label>';
  if (!own) h += '<div class="pw">Fuerza enemiga: ' + G.power(s.cities[to].units) + ' · muralla nivel ' + (s.cities[to].b.muralla || 0) + '<br>Tu fuerza: <b id="pk-pw"></b></div>';
  h += '<div class="acts"><button class="btn ghost" data-act="close">Cancelar</button>' + (ks.length || hero ? '<button class="btn" data-act="send" data-from="' + from + '" data-to="' + to + '">' + (own ? 'Enviar' : '¡A las armas!') + '</button>' : '') + '</div>';
  modal(h); pickUpdate();
}
function pickUnits() { const u = {}; document.querySelectorAll('#mbox input[type=range]').forEach(i => { u[i.dataset.k] = +i.value; }); return u; }
function pickUpdate() { const u = pickUnits(); for (const k in u) { const e = $('pv-' + k); if (e) e.textContent = u[k]; } const p = $('pk-pw'); if (p) p.textContent = G.power(u); }
$('mbox').addEventListener('input', pickUpdate);

/* ---------- batalla ---------- */
function sideHtml(sd) {
  return '<div class="side"><h4 style="color:' + sd.col + ';filter:brightness(1.6)">' + esc(sd.name) + '</h4>' + (sd.gen ? '<div><span>★ ' + esc(sd.gen.n) + '</span></div>' : '') +
    Object.keys(sd.units).filter(k => sd.units[k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>' + sd.units[k] + '</b></div>').join('') + '</div>';
}
function battlePrompt() {
  const pb = S().pending[0], info = G.battleInfo(pb), d = D.CITIES[info.city];
  UI.binfo = info;
  modal('<div class="yr">' + G.yearOf(S().t) + ' A.C.</div><h2>' + (info.kind === 'attack' ? 'Asalto a ' : 'Defensa de ') + d.n + '</h2>' +
    '<div class="vs">' + sideHtml(info.cfg.sides[0]) + sideHtml(info.cfg.sides[1]) + '</div>' +
    '<div class="pw">Fuerza: ' + G.power(info.cfg.sides[0].units) + ' contra ' + G.power(info.cfg.sides[1].units) + ' · Muralla del defensor: nivel ' + info.cfg.wall + '</div>' +
    '<div class="acts"><button class="btn" data-act="bview">⚔️ Dirigir la batalla</button><button class="btn ghost" data-act="bquick">Resolver</button></div>', true);
}
function startBattle() {
  closeModal();
  $('battle').hidden = false;
  const cfg = Object.assign({}, UI.binfo.cfg, { fh: 1000 }), b = new window.Battle(cfg), B = { b: b, speed: 1, paused: false, acc: 0, endT: 0 };
  try { B.view = new BattleView3D($('bfield'), b, { cards: $('bcards'), speed: () => (B.paused || b.over ? 0 : B.speed) }); }
  catch (e) { // sin WebGL: vista 2D de reserva
    console.warn('WebGL no disponible, usando vista 2D', e);
    const cv = document.createElement('canvas'); cv.className = 'c2d'; $('bfield').appendChild(cv); B.view = new window.BattleView(cv, b); B.flat = cv;
    cv.addEventListener('pointerdown', ev => { if (!b.over) B.view.tap(ev.clientX, ev.clientY); });
  }
  UI.battle = B;
  $('bauto').classList.add('on'); $('bspeed').textContent = 'x1'; $('bpause').textContent = 'II';
  $('bhint').style.opacity = 1; setTimeout(() => { $('bhint').style.opacity = 0; }, 7000);
}
function stopBattle() { const B = UI.battle; if (B) { if (B.view.dispose) B.view.dispose(); if (B.flat) B.flat.remove(); } $('battle').hidden = true; UI.battle = null; UI.binfo = null; if (UI.map) UI.map.resize(); }
function battleHud() {
  const b = UI.battle.b, s0 = b.cfg.sides[0], s1 = b.cfg.sides[1], n0 = b.men(0), n1 = b.men(1), key = n0 + '|' + n1; if (key === UI.hudKey) return; UI.hudKey = key;
  $('bhud').innerHTML = '<div class="nm"><span style="color:#ff9c8c">' + esc(s0.name) + ' · ' + n0 + '</span><span>' + n1 + ' · ' + esc(s1.name) + '</span></div><div class="bar"><i style="width:' + n0 / Math.max(1, n0 + n1) * 100 + '%;background:' + s0.col + '"></i><i style="flex:1;background:' + s1.col + '"></i></div>';
}
function endBattle(res) {
  const info = UI.binfo, out = G.applyBattle(res), d = D.CITIES[info.city];
  const loss = side => Object.keys(res.lost[side]).filter(k => res.lost[side][k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>−' + res.lost[side][k] + '</b></div>').join('') || '<div><span>Sin bajas</span></div>';
  modal('<div class="yr">' + (out.kind === 'attack' ? 'ASALTO A ' : 'DEFENSA DE ') + d.n.toUpperCase() + '</div><h2>' + (out.win ? '¡Victoria!' : 'Derrota') + '</h2>' +
    '<div class="vs"><div class="side"><h4 style="color:#ff9c8c">Bajas romanas</h4>' + loss(0) + '</div><div class="side"><h4>Bajas enemigas</h4>' + loss(1) + '</div></div>' +
    '<p>' + out.lines.map(esc).join('\n') + '</p><div class="acts"><button class="btn" data-act="bdone">Continuar</button></div>', true);
}

/* ---------- acciones ---------- */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-act]');
  if (!el) { if (e.target.id === 'modal' && !UI.sticky) closeModal(); return; }
  const a = el.dataset.act, v = el.dataset.v, s = S(), B = UI.battle;
  switch (a) {
    case 'new': G.newGame(($('hname').value || '').trim() || 'Lucio Cornelio Escipión'); UI.overShown = false; G.save(); startGame(); break;
    case 'continue': if (G.load()) { UI.overShown = false; startGame(); if (S().over) showOver(); } break;
    case 'tomenu': G.save(); UI.modalQ = []; closeModal(); stopBattle(); showMenu(); break;
    case 'tab': setTab(v); break;
    case 'speed': s.speed = +v; tickUI(); break;
    case 'city': UI.city = v; $('view').scrollTop = 0; render(); break;
    case 'up': if (G.upgrade(UI.city, v)) render(); else toast(s.cities[UI.city].queue ? 'Ya hay una obra en curso en esta ciudad.' : 'Faltan recursos.', 'bad'); break;
    case 'train': if (G.train(UI.city, v, +el.dataset.n)) render(); else toast(s.cities[UI.city].train.length >= 5 ? 'La cola de instrucción está llena.' : 'Faltan recursos.', 'bad'); break;
    case 'skill': if (G.skill(v)) render(); break;
    case 'ev': { const ev = D.EVENTS[+v]; modal('<div class="yr">' + ev.y + ' A.C.</div><h2>' + esc(ev.t) + '</h2><p>' + esc(ev.x) + '</p><div class="acts"><button class="btn" data-act="close">Cerrar</button></div>'); break; }
    case 'zoom': if (UI.map) UI.map.zoom(+v); break;
    case 'home': if (UI.map) UI.map.center(s.hero.city || 'roma'); break;
    case 'unsel': UI.sel = null; renderSheet(); break;
    case 'goto': UI.city = v; setTab('city'); break;
    case 'pick': showPicker(el.dataset.from, el.dataset.to); break;
    case 'send': {
      const hero = $('pk-hero') && $('pk-hero').checked;
      if (G.send(el.dataset.from, el.dataset.to, pickUnits(), hero)) { closeModal(); toast('🚩 El ejército parte hacia ' + D.CITIES[el.dataset.to].n + '.'); UI.sheetKey = ''; renderSheet(); }
      else toast('Selecciona al menos una unidad.', 'bad');
      break;
    }
    case 'close': closeModal(); break;
    case 'bview': startBattle(); break;
    case 'bquick': { closeModal(); const b = new window.Battle(UI.binfo.cfg); b.finish(); endBattle(b.result()); break; }
    case 'bdone': closeModal(); stopBattle(); UI.sheetKey = ''; render(); if (S().over) showOver(); break;
    case 'bpause': B.paused = !B.paused; el.textContent = B.paused ? '▶' : 'II'; break;
    case 'bspeed': B.speed = B.speed === 1 ? 2 : B.speed === 2 ? 4 : 1; el.textContent = 'x' + B.speed; break;
    case 'bauto': B.b.auto = !B.b.auto; el.classList.toggle('on', B.b.auto); toast(B.b.auto ? 'Tus tropas atacan por iniciativa propia.' : 'Tus tropas mantienen la posición hasta recibir órdenes.'); break;
    case 'ball': B.view.selectAll(); break;
    case 'bcam': if (B.view.cycleCam) B.view.cycleCam(); break;
    case 'bskip': B.b.finish(); break;
  }
});

/* ---------- bucle principal ---------- */
function frame(now) {
  const dt = Math.min(0.25, (now - UI.last) / 1000 || 0); UI.last = now;
  const s = S();
  if (UI.battle) {
    const B = UI.battle, b = B.b;
    if (!B.paused && !b.over) { B.acc += dt * B.speed; let n = 0; while (B.acc >= 0.05 && n++ < 12) { b.step(0.05); B.acc -= 0.05; } }
    battleHud(); B.view.draw();
    if (b.over && !B.done) { B.endT += dt; if (B.endT > 2.2) { B.done = true; endBattle(b.result()); } }
  } else if (s && !UI.menu) {
    if (!UI.modalOpen && !s.over) {
      if (s.pending.length) battlePrompt();
      else if (s.speed > 0) G.tick(dt * s.speed / 4);
    }
    if (UI.map && UI.tab === 'map') UI.map.update(s, UI.sel);
    if (UI.dirty) render();
    UI.acc = (UI.acc || 0) + dt; if (UI.acc > 0.25) { UI.acc = 0; tickUI(); if (UI.tab === 'map' && UI.sel && !UI.modalOpen) renderSheet(); }
    UI.saveT += dt; if (UI.saveT > 8) { UI.saveT = 0; G.save(); }
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { if (UI.map) UI.map.resize(); if (UI.battle && UI.battle.view.resize) UI.battle.view.resize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S() && !UI.menu) G.save(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

buildTop();
try { UI.map = new MapView3D($('mapwrap'), { onSelect: id => { UI.sel = id; UI.sheetKey = ''; renderSheet(); } }); }
catch (e) { console.warn('WebGL no disponible para el mapa', e); $('mapwrap').innerHTML = '<div class="empty" style="padding:160px 24px;text-align:center">Tu dispositivo no puede mostrar el mapa 3D. Puedes jugar desde las pestañas Ciudad y Ejército.</div>'; }
showMenu(); requestAnimationFrame(frame);
window.UI = UI;
