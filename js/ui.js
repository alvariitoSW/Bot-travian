/* AQVILA — interfaz: pestañas, mapa de campaña, modales y pantalla de batalla */
(function () {
  const D = window.DATA, G = window.Game, $ = id => document.getElementById(id);
  const UI = { tab: 'city', city: 'roma', sel: null, modalQ: [], modalOpen: false, battle: null, menu: true, cam: { x: 0, y: 0, z: 0.75 }, last: 0, saveT: 0 };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => { n = Math.floor(n); return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); };
  const months = m => m < 1 ? Math.max(1, Math.round(m * 30)) + ' días' : (m >= 12 ? (m / 12).toFixed(1).replace('.', ',') + ' años' : m.toFixed(1).replace('.', ',') + ' meses');
  const costHtml = c => '<div class="cost">' + Object.keys(c).map(r => '<span>' + D.RES_ICON[r] + ' ' + fmt(c[r]) + '</span>').join('') + '</div>';
  const unitsHtml = u => { const k = Object.keys(u).filter(x => u[x] > 0); return k.length ? '<div class="units">' + k.map(x => '<span>' + D.UNITS[x].g + ' ' + D.UNITS[x].n + ' <b>' + u[x] + '</b></span>').join('') + '</div>' : '<div class="empty">Sin tropas.</div>'; };
  const S = () => G.state;

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
    else if (type === 'over') { if (!UI.battle && !UI.binfo) showOver(); } // tras una batalla se muestra al cerrar el parte
  };

  /* ---------- menú ---------- */
  function showMenu() {
    UI.menu = true;
    $('menu').hidden = false;
    $('menu').innerHTML = '<div class="eagle">🦅</div><h1>AQVILA</h1><div class="sub">EL ASCENSO DE ROMA</div>' +
      '<p>280 a.C. Construye tus ciudades, recluta legiones, dirige las batallas y lleva las águilas hasta Cartago antes del 146 a.C.</p>' +
      (G.hasSave() ? '<button class="btn gold" data-act="continue">Continuar partida</button>' : '') +
      '<input id="hname" maxlength="28" placeholder="Nombre de tu general" value="Lucio Cornelio Escipión">' +
      '<button class="btn" data-act="new">Nueva campaña</button><div class="spqr">S·P·Q·R</div>';
  }
  function startGame() { UI.menu = false; $('menu').hidden = true; UI.city = 'roma'; UI.sel = null; centerOn('roma'); setTab('city'); }

  function showOver() {
    const s = S(), o = s.over; if (!o || UI.overShown) return; UI.overShown = true;
    modal('<div class="yr">' + (o.win ? 'VICTORIA' : 'DERROTA') + '</div><h2>' + (o.win ? '🏆 Roma Victrix' : '💀 Vae victis') + '</h2><p>' + esc(o.why) + '</p>' +
      '<p>Ciudades: <b>' + G.myCities().length + '</b> de ' + Object.keys(D.CITIES).length + ' · Batallas: <b>' + s.stats.wins + '/' + s.stats.battles + '</b> ganadas\nEnemigos abatidos: <b>' + s.stats.kills + '</b> · Bajas propias: <b>' + s.stats.lost + '</b>\n' + esc(s.hero.name) + ', nivel <b>' + s.hero.lvl + '</b></p>' +
      '<div class="acts"><button class="btn" data-act="tomenu">Volver al menú</button></div>', true);
  }

  /* ---------- barra superior ---------- */
  function buildTop() {
    $('res').innerHTML = D.RES.map(r => '<div class="r" id="rb-' + r + '">' + D.RES_ICON[r] + '<b id="r-' + r + '"></b><small id="p-' + r + '"></small></div>').join('');
  }
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

  /* ---------- pestañas ---------- */
  function setTab(t) {
    UI.tab = t;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
    $('view').hidden = t === 'map'; $('mapwrap').hidden = t !== 'map';
    if (t === 'map') { resizeMap(); renderSheet(); } else { $('view').scrollTop = 0; render(); }
  }
  function cityChips() {
    const my = G.myCities(); if (!my.includes(UI.city)) UI.city = my[0] || 'roma';
    return '<div class="chips">' + my.map(id => '<button class="chip ' + (id === UI.city ? 'on' : '') + '" data-act="city" data-v="' + id + '">' + D.CITIES[id].n + (S().hero.city === id ? ' 🦅' : '') + '</button>').join('') + '</div>';
  }
  function render() {
    UI.dirty = false;
    if (!S() || UI.tab === 'map') { if (UI.tab === 'map') renderSheet(); return; }
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
    h += '<div class="empty">' + Object.keys(D.BUILD).map(b => D.BUILD[b].i + ' ' + D.BUILD[b].d).join('<br>') + '</div>';
    return h;
  }
  function viewArmy() {
    const s = S(), c = s.cities[UI.city], p = G.prod();
    let h = cityChips() + '<div class="sec">Guarnición de ' + D.CITIES[UI.city].n + '</div>';
    const ks = Object.keys(c.units).filter(k => c.units[k] > 0);
    h += ks.length ? ks.map(k => '<div class="row"><span>' + D.UNITS[k].g + ' ' + D.UNITS[k].n + '</span><b>' + c.units[k] + '</b></div>').join('') : '<div class="empty">No hay tropas en la ciudad.</div>';
    h += '<div class="empty">🌾 Consumo de todas tus tropas: ' + Math.round(p.upkeep) + ' grano/mes · 🧱 Vigiles al defender: ' + (20 + 20 * (c.b.muralla || 0)) + '</div>';
    if (c.train.length) {
      h += '<div class="sec">En instrucción</div>';
      h += c.train.map(q => '<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span>' + q.n + ' × ' + D.UNITS[q.u].n + '</span><span class="rem"></span></div><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div></div>').join('');
    }
    h += '<div class="sec">Reclutar</div>';
    for (const k in D.UNITS) {
      const u = D.UNITS[k]; if (!u.cost) continue;
      const ok = G.unitOk(c, k), rb = Object.keys(u.req)[0];
      h += '<div class="card ' + (ok ? '' : 'locked') + '"><div class="ic">' + u.g + '</div><div class="bd"><div class="tt">' + u.n + '</div><div class="ds">' + u.d + '</div>' +
        '<div><span class="stat">⚔ ' + (u.ratk ? u.ratk + ' dist.' : u.atk) + '</span><span class="stat">🛡 ' + u.def + '</span><span class="stat">👟 ' + u.spd + '</span><span class="stat">🌾 ' + u.up + '</span></div>' + costHtml(u.cost) + '</div>' +
        (ok ? '<div class="btns"><button class="btn" data-act="train" data-v="' + k + '" data-n="10" data-need=\'' + JSON.stringify(G.unitCost(k, 10)) + '\'>+10</button><button class="btn" data-act="train" data-v="' + k + '" data-n="50" data-need=\'' + JSON.stringify(G.unitCost(k, 50)) + '\'>+50</button></div>'
          : '<button class="btn no">' + D.BUILD[rb].n + '<small>nivel ' + u.req[rb] + '</small></button>') + '</div>';
    }
    return h;
  }
  function viewHero() {
    const s = S(), h = s.hero, need = G.xpNeed(h.lvl);
    const where = h.wound > s.t ? '🩸 Herido — se recupera en ' + months(h.wound - s.t) : h.march ? '🚩 En marcha con el ejército' : '📍 En ' + D.CITIES[h.city].n;
    const SK = { mando: ['⚔️ Mando', '+4 % de ataque de tu ejército por nivel'], disc: ['🛡️ Disciplina', '+3 % de defensa y +4 de moral por nivel'], log: ['🧭 Logística', '+8 % de velocidad de marcha y +10 % de botín por nivel'] };
    let o = '<div class="head"><h2>🦅 ' + esc(h.name) + '</h2><p>General de la República · Nivel ' + h.lvl + '</p><div class="xp"><i style="width:' + Math.min(100, h.xp / need * 100) + '%"></i></div><p>Experiencia ' + h.xp + ' / ' + need + '</p><p>' + where + '</p></div>';
    o += '<div class="sec">Habilidades · ' + h.pts + ' punto' + (h.pts === 1 ? '' : 's') + ' disponible' + (h.pts === 1 ? '' : 's') + '</div>';
    for (const k in SK) o += '<div class="card"><div class="bd"><div class="tt">' + SK[k][0] + '<span class="lv">Nv ' + h.sk[k] + '</span></div><div class="ds">' + SK[k][1] + '</div></div><button class="btn ' + (h.pts > 0 && h.sk[k] < 10 ? 'gold' : 'no') + '" data-act="skill" data-v="' + k + '">＋</button></div>';
    o += '<div class="empty">Tu general combate con su guardia de caballería cuando acompaña a un ejército o defiende la ciudad en la que está. Gana experiencia en cada batalla. Si su guardia es aniquilada, quedará herido dos años.<br><br>Para llevarlo a la guerra, marca «El general acompaña» al enviar tropas desde su ciudad.</div>';
    return o;
  }
  function viewLog() {
    const s = S(), year = G.yearOf(s.t), left = year - D.END_YEAR + 1;
    let o = '<div class="head"><h2>Carthago delenda est</h2><p>Objetivo: conquista <b>Carthago</b> antes de que termine el año 146 a.C. Si Roma cae, la partida termina.</p><p>⏳ Quedan <b>' + left + '</b> años · 🏛️ ' + G.myCities().length + '/' + Object.keys(D.CITIES).length + ' ciudades · ⚔️ ' + s.stats.wins + '/' + s.stats.battles + ' batallas ganadas</p></div>';
    o += '<div class="sec">Línea del tiempo</div><div class="tl">' + D.EVENTS.map((e, i) => '<div class="' + (s.ev[i] ? 'done' : '') + '"' + (s.ev[i] ? ' data-act="ev" data-v="' + i + '"' : '') + '>' + e.y + ' a.C. — ' + (s.ev[i] ? esc(e.t) : '···') + '</div>').join('') + '</div>';
    o += '<div class="sec">Crónica</div>' + (s.log.length ? s.log.map(l => '<div class="logl ' + l.k + '"><small>' + G.yearOf(l.t) + ' a.C.</small>' + esc(l.x) + '</div>').join('') : '<div class="empty">Aún no ha ocurrido nada.</div>');
    o += '<div class="acts" style="margin-top:16px"><button class="btn ghost" data-act="tomenu">Guardar y salir al menú</button></div>';
    return o;
  }

  /* ---------- mapa ---------- */
  const mp = $('map'), mx = mp.getContext('2d');
  function resizeMap() { const w = $('mapwrap'), dpr = Math.min(2, window.devicePixelRatio || 1); mp.width = w.clientWidth * dpr; mp.height = w.clientHeight * dpr; UI.dpr = dpr; clampCam(); }
  function centerOn(id) { const p = G.pos(id); UI.cam.x = p[0]; UI.cam.y = p[1]; }
  function clampCam() {
    const c = UI.cam, w = mp.width / UI.dpr, h = mp.height / UI.dpr;
    c.z = Math.max(Math.max(w / D.WORLD.w, h / D.WORLD.h, 0.3), Math.min(2.2, c.z));
    const hw = w / 2 / c.z, hh = h / 2 / c.z;
    c.x = Math.max(hw, Math.min(D.WORLD.w - hw, c.x)); c.y = Math.max(hh, Math.min(D.WORLD.h - hh, c.y));
  }
  function marchPos(m) {
    const s = S(), a = m.fromXY || G.pos(m.from), b = G.pos(m.to), f = Math.max(0, Math.min(1, (s.t - m.t0) / (m.t1 - m.t0)));
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a, b];
  }
  function drawMap() {
    const s = S(), c = UI.cam, W = mp.width, H = mp.height, k = c.z * UI.dpr;
    mx.setTransform(1, 0, 0, 1, 0, 0);
    const sea = mx.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#6c9db3'); sea.addColorStop(1, '#4d829c'); mx.fillStyle = sea; mx.fillRect(0, 0, W, H);
    mx.setTransform(k, 0, 0, k, W / 2 - c.x * k, H / 2 - c.y * k);
    // tierra
    for (let pass = 0; pass < 2; pass++) for (const poly of D.LAND) {
      mx.beginPath(); poly.forEach((p, i) => { const q = D.proj(p[0], p[1]); if (i) mx.lineTo(q[0], q[1]); else mx.moveTo(q[0], q[1]); }); mx.closePath();
      if (pass === 0) { mx.strokeStyle = 'rgba(225,240,245,0.5)'; mx.lineWidth = 9; mx.lineJoin = 'round'; mx.stroke(); }
      else { mx.fillStyle = '#d9c692'; mx.fill(); mx.strokeStyle = '#8c7646'; mx.lineWidth = 1.5; mx.stroke(); }
    }
    // rótulos
    mx.textAlign = 'center'; mx.textBaseline = 'middle';
    for (const l of D.LABELS) { const q = D.proj(l[1], l[2]); mx.font = 'italic 700 ' + (l[0] === 'MARE NOSTRVM' ? 20 : 15) + 'px Georgia, serif'; mx.fillStyle = l[0] === 'MARE NOSTRVM' ? 'rgba(255,255,255,0.35)' : 'rgba(90,65,30,0.38)'; mx.fillText(l[0].split('').join(' '), q[0], q[1]); }
    // rutas
    for (const e of D.EDGES) {
      const a = G.pos(e[0]), b = G.pos(e[1]);
      mx.strokeStyle = e[2] ? 'rgba(255,255,255,0.55)' : 'rgba(110,70,30,0.7)'; mx.lineWidth = e[2] ? 1.6 : 2.4; mx.setLineDash(e[2] ? [3, 7] : [8, 5]);
      mx.beginPath(); mx.moveTo(a[0], a[1]); mx.lineTo(b[0], b[1]); mx.stroke();
    }
    mx.setLineDash([]);
    // ciudades
    for (const id in D.CITIES) {
      const p = G.pos(id), ct = s.cities[id], f = D.FACTIONS[ct.owner], mine = ct.owner === 'roma', R = id === 'roma' || id === 'carthago' ? 15 : 12;
      if (UI.sel === id) { mx.strokeStyle = '#fff'; mx.lineWidth = 3; mx.beginPath(); mx.arc(p[0], p[1], R + 6 + Math.sin(performance.now() / 200) * 1.5, 0, 7); mx.stroke(); }
      mx.fillStyle = 'rgba(0,0,0,0.3)'; mx.beginPath(); mx.arc(p[0] + 2, p[1] + 3, R, 0, 7); mx.fill();
      mx.fillStyle = f.col; mx.beginPath(); mx.arc(p[0], p[1], R, 0, 7); mx.fill();
      mx.strokeStyle = mine ? '#ffd76a' : '#2b1a10'; mx.lineWidth = mine ? 3 : 2; mx.stroke();
      mx.font = (R + 1) + 'px sans-serif'; mx.fillStyle = '#fff'; mx.fillText(mine ? '🦅' : id === 'carthago' ? '☠' : '🏛', p[0], p[1] + 1);
      mx.font = '700 13px Georgia, serif'; mx.lineWidth = 3.5; mx.strokeStyle = 'rgba(250,240,215,0.9)'; mx.strokeText(D.CITIES[id].n, p[0], p[1] + R + 11); mx.fillStyle = '#2b1a10'; mx.fillText(D.CITIES[id].n, p[0], p[1] + R + 11);
      if (s.hero.city === id) { mx.font = '14px sans-serif'; mx.fillText('⭐', p[0] + R, p[1] - R); }
    }
    // marchas
    for (const m of s.marches) {
      const q = marchPos(m), mine = m.owner === 'roma';
      mx.strokeStyle = mine ? 'rgba(179,38,30,0.85)' : 'rgba(20,10,10,0.85)'; mx.lineWidth = 3; mx.beginPath(); mx.moveTo(q[2][0], q[2][1]); mx.lineTo(q[0], q[1]); mx.stroke();
      mx.fillStyle = mine ? '#b3261e' : D.FACTIONS[m.owner].col; mx.beginPath(); mx.arc(q[0], q[1], 10, 0, 7); mx.fill(); mx.strokeStyle = mine ? '#ffd76a' : '#000'; mx.lineWidth = 2; mx.stroke();
      mx.font = '11px sans-serif'; mx.fillStyle = '#fff'; mx.fillText(m.hero || m.gen ? '★' : '⚔', q[0], q[1] + 1);
      if (!mine) { mx.font = '700 11px sans-serif'; mx.strokeStyle = '#fff'; mx.lineWidth = 3; const t = (m.label || D.FACTIONS[m.owner].n) + ' · ' + G.men(m.units); mx.strokeText(t, q[0], q[1] - 17); mx.fillStyle = '#7d1712'; mx.fillText(t, q[0], q[1] - 17); }
    }
  }
  function renderSheet() {
    const s = S(), sh = $('sheet'); if (!UI.sel) { sh.hidden = true; return; }
    const id = UI.sel, c = s.cities[id], d = D.CITIES[id], f = D.FACTIONS[c.owner], mine = c.owner === 'roma';
    const src = G.neighbors(id).filter(n => s.cities[n].owner === 'roma');
    let h = '<button class="x" data-act="unsel">✕</button><h3>' + d.n + '<span class="tagf" style="background:' + f.col + '">' + f.n + '</span></h3><p>' + esc(d.h) + '</p>';
    h += '<div class="stat">🧱 Muralla ' + (c.b.muralla || 0) + '</div><div class="stat">💰 Riqueza ' + '★'.repeat(d.w) + '</div><div class="stat">⚔ Fuerza ' + G.power(c.units) + '</div>' + unitsHtml(c.units);
    const inc = s.marches.filter(m => m.to === id);
    if (inc.length) h += inc.map(m => '<div class="stat" style="color:' + (m.owner === 'roma' ? 'var(--good)' : 'var(--bad)') + '">' + (m.owner === 'roma' ? '🚩 Tus tropas llegan' : '⚠️ ' + D.FACTIONS[m.owner].n + ' (' + G.men(m.units) + ') llega') + ' en ' + months(m.t1 - s.t) + '</div>').join('<br>');
    h += '<div class="acts">';
    if (mine) h += '<button class="btn gold" data-act="goto" data-v="' + id + '">Gestionar ciudad</button>';
    if (src.length) h += src.map(n => '<button class="btn" data-act="pick" data-from="' + n + '" data-to="' + id + '">' + (mine ? 'Reforzar' : 'Atacar') + ' desde ' + D.CITIES[n].n + '</button>').join('');
    else if (!mine) h += '<div class="empty">Sin ruta: conquista antes una ciudad vecina (' + G.neighbors(id).map(n => D.CITIES[n].n).join(', ') + ').</div>';
    sh.innerHTML = h + '</div>'; sh.hidden = false;
  }
  // gestos del mapa
  const ptr = new Map(); let drag = null;
  $('mapwrap').addEventListener('pointerdown', e => { if (e.target !== mp) return; mp.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, moved: 0, d: 0 }; });
  mp.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    const prev = ptr.get(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 1) { UI.cam.x -= (e.clientX - prev[0]) / UI.cam.z; UI.cam.y -= (e.clientY - prev[1]) / UI.cam.z; if (drag) drag.moved += Math.abs(e.clientX - prev[0]) + Math.abs(e.clientY - prev[1]); }
    else if (ptr.size === 2) { const v = [...ptr.values()], dd = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); if (drag && drag.d) UI.cam.z *= dd / drag.d; if (drag) { drag.d = dd; drag.moved = 99; } }
    clampCam();
  });
  const up = e => {
    if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId);
    if (drag && drag.moved < 10 && e.type === 'pointerup') {
      const r = mp.getBoundingClientRect(), wx = (e.clientX - r.left - r.width / 2) / UI.cam.z + UI.cam.x, wy = (e.clientY - r.top - r.height / 2) / UI.cam.z + UI.cam.y;
      let best = null, bd = 30 / Math.min(1, UI.cam.z);
      for (const id in D.CITIES) { const p = G.pos(id), dd = Math.hypot(p[0] - wx, p[1] - wy); if (dd < bd) { bd = dd; best = id; } }
      UI.sel = best; renderSheet();
    }
    if (!ptr.size) drag = null; else if (drag) drag.d = 0;
  };
  mp.addEventListener('pointerup', up); mp.addEventListener('pointercancel', up);
  mp.addEventListener('wheel', e => { UI.cam.z *= e.deltaY < 0 ? 1.12 : 0.89; clampCam(); e.preventDefault(); }, { passive: false });

  /* ---------- envío de tropas ---------- */
  function showPicker(from, to) {
    const s = S(), c = s.cities[from], own = s.cities[to].owner === 'roma', hero = G.heroAvailable(from);
    const ks = Object.keys(c.units).filter(k => c.units[k] > 0);
    let h = '<h2>' + (own ? 'Reforzar ' : 'Atacar ') + D.CITIES[to].n + '</h2><div class="yr">DESDE ' + D.CITIES[from].n.toUpperCase() + ' · ' + months(G.travel(from, to, false)).toUpperCase() + '</div>';
    if (!ks.length && !hero) h += '<p>No hay tropas en ' + D.CITIES[from].n + '. Recluta en la pestaña Tropas.</p>';
    h += ks.map(k => '<div class="pick"><label><span>' + D.UNITS[k].g + ' ' + D.UNITS[k].n + '</span><span><b id="pv-' + k + '">' + c.units[k] + '</b> / ' + c.units[k] + '</span></label><input type="range" min="0" max="' + c.units[k] + '" value="' + c.units[k] + '" data-k="' + k + '"></div>').join('');
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
    return '<div class="side"><h4 style="color:' + sd.col + '">' + esc(sd.name) + '</h4>' + (sd.gen ? '<div><span>★ ' + esc(sd.gen.n) + '</span></div>' : '') +
      Object.keys(sd.units).filter(k => sd.units[k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>' + sd.units[k] + '</b></div>').join('') + '</div>';
  }
  function battlePrompt() {
    const pb = S().pending[0], info = G.battleInfo(pb), d = D.CITIES[info.city];
    UI.binfo = info;
    modal('<div class="yr">' + G.yearOf(S().t) + ' A.C.</div><h2>' + (info.kind === 'attack' ? 'Asalto a ' : 'Defensa de ') + d.n + '</h2>' +
      '<div class="vs">' + sideHtml(info.cfg.sides[0]) + sideHtml(info.cfg.sides[1]) + '</div>' +
      '<div class="pw">Fuerza: ' + G.power(info.cfg.sides[0].units) + ' contra ' + G.power(info.cfg.sides[1].units) + ' · Muralla del defensor: nivel ' + info.cfg.wall + '</div>' +
      '<div class="acts"><button class="btn" data-act="bview">🎬 Dirigir la batalla</button><button class="btn ghost" data-act="bquick">⚡ Resolver</button></div>', true);
  }
  function startBattle() {
    closeModal();
    $('battle').hidden = false;
    const fld = $('bfield'), cfg = Object.assign({}, UI.binfo.cfg, { fh: 600 * fld.clientHeight / Math.max(1, fld.clientWidth) });
    const b = new window.Battle(cfg);
    const view = new window.BattleView($('bcanvas'), b);
    UI.battle = { b: b, view: view, speed: 1, paused: false, acc: 0, endT: 0 };
    $('bauto').classList.add('on'); $('bspeed').textContent = 'x1'; $('bpause').textContent = 'II';
    $('bhint').style.opacity = 1; setTimeout(() => { $('bhint').style.opacity = 0; }, 6000);
  }
  function battleHud() {
    const B = UI.battle, b = B.b, s0 = b.cfg.sides[0], s1 = b.cfg.sides[1], n0 = b.men(0), n1 = b.men(1), t = Math.max(1, n0 + n1);
    $('bhud').innerHTML = '<div class="nm"><span style="color:#ff8a7a">🦅 ' + esc(s0.name) + ' · ' + n0 + '</span><span style="color:#ddd">' + n1 + ' · ' + esc(s1.name) + '</span></div><div class="bar"><i style="width:' + n0 / t * 100 + '%;background:' + s0.col + '"></i><i style="flex:1;background:' + s1.col + '"></i></div>';
  }
  function endBattle(res) {
    const info = UI.binfo, out = G.applyBattle(res), d = D.CITIES[info.city];
    const loss = side => Object.keys(res.lost[side]).filter(k => res.lost[side][k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>−' + res.lost[side][k] + '</b></div>').join('') || '<div><span>Sin bajas</span></div>';
    modal('<div class="yr">' + (out.kind === 'attack' ? 'ASALTO A ' : 'DEFENSA DE ') + d.n.toUpperCase() + '</div><h2>' + (out.win ? '🏆 ¡Victoria!' : '💀 Derrota') + '</h2>' +
      '<div class="vs"><div class="side"><h4 style="color:' + info.cfg.sides[0].col + '">Bajas romanas</h4>' + loss(0) + '</div><div class="side"><h4 style="color:' + info.cfg.sides[1].col + '">Bajas enemigas</h4>' + loss(1) + '</div></div>' +
      '<p>' + out.lines.map(esc).join('\n') + '</p><div class="acts"><button class="btn" data-act="bdone">Continuar</button></div>', true);
  }
  $('bcanvas').addEventListener('pointerdown', e => { if (UI.battle && !UI.battle.b.over) UI.battle.view.tap(e.clientX, e.clientY); });

  /* ---------- acciones ---------- */
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el) { if (e.target.id === 'modal' && !UI.sticky) closeModal(); return; }
    const a = el.dataset.act, v = el.dataset.v, s = S();
    switch (a) {
      case 'new': G.newGame(($('hname').value || '').trim() || 'Lucio Cornelio Escipión'); UI.overShown = false; G.save(); startGame(); break;
      case 'continue': if (G.load()) { UI.overShown = false; startGame(); if (S().over) showOver(); } break;
      case 'tomenu': G.save(); UI.modalQ = []; closeModal(); $('battle').hidden = true; UI.battle = null; UI.binfo = null; showMenu(); break;
      case 'tab': setTab(v); break;
      case 'speed': s.speed = +v; tickUI(); break;
      case 'city': UI.city = v; $('view').scrollTop = 0; render(); break;
      case 'up': if (G.upgrade(UI.city, v)) render(); else toast(s.cities[UI.city].queue ? 'Ya hay una obra en curso en esta ciudad.' : 'Faltan recursos.', 'bad'); break;
      case 'train': if (G.train(UI.city, v, +el.dataset.n)) render(); else toast(s.cities[UI.city].train.length >= 5 ? 'La cola de instrucción está llena.' : 'Faltan recursos.', 'bad'); break;
      case 'skill': if (G.skill(v)) render(); break;
      case 'ev': { const ev = D.EVENTS[+v]; modal('<div class="yr">' + ev.y + ' A.C.</div><h2>' + esc(ev.t) + '</h2><p>' + esc(ev.x) + '</p><div class="acts"><button class="btn" data-act="close">Cerrar</button></div>'); break; }
      case 'zoom': UI.cam.z *= +v; clampCam(); break;
      case 'unsel': UI.sel = null; renderSheet(); break;
      case 'goto': UI.city = v; setTab('city'); break;
      case 'pick': showPicker(el.dataset.from, el.dataset.to); break;
      case 'send': {
        const hero = $('pk-hero') && $('pk-hero').checked;
        if (G.send(el.dataset.from, el.dataset.to, pickUnits(), hero)) { closeModal(); toast('🚩 El ejército parte hacia ' + D.CITIES[el.dataset.to].n + '.'); renderSheet(); }
        else toast('Selecciona al menos una unidad.', 'bad');
        break;
      }
      case 'close': closeModal(); break;
      case 'bview': startBattle(); break;
      case 'bquick': { closeModal(); const b = new window.Battle(UI.binfo.cfg); b.finish(); endBattle(b.result()); break; }
      case 'bdone': closeModal(); $('battle').hidden = true; UI.battle = null; UI.binfo = null; if (UI.tab === 'map') renderSheet(); else render(); if (S().over) showOver(); break;
      case 'bpause': UI.battle.paused = !UI.battle.paused; el.textContent = UI.battle.paused ? '▶' : 'II'; break;
      case 'bspeed': UI.battle.speed = UI.battle.speed === 1 ? 2 : UI.battle.speed === 2 ? 4 : 1; el.textContent = 'x' + UI.battle.speed; break;
      case 'bauto': UI.battle.b.auto = !UI.battle.b.auto; el.classList.toggle('on', UI.battle.b.auto); toast(UI.battle.b.auto ? 'Tus tropas atacan por iniciativa propia.' : 'Tus tropas mantienen la posición hasta recibir órdenes.'); break;
      case 'ball': UI.battle.view.selectAll(); break;
      case 'bskip': UI.battle.b.finish(); break;
    }
  });

  /* ---------- bucle principal ---------- */
  function frame(now) {
    const dt = Math.min(0.25, (now - UI.last) / 1000 || 0); UI.last = now;
    const s = S();
    if (UI.battle) {
      const B = UI.battle, b = B.b;
      if (!B.paused && !b.over) { B.acc += dt * B.speed; let n = 0; while (B.acc >= 0.05 && n++ < 12) { b.step(0.05); B.acc -= 0.05; } }
      battleHud(); if (!B.sized) { B.sized = true; B.view.resize(); }
      B.view.draw();
      if (b.over && !B.done) { B.endT += dt; if (B.endT > 1.2) { B.done = true; endBattle(b.result()); } }
    } else if (s && !UI.menu) {
      if (!UI.modalOpen && !s.over) {
        if (s.pending.length) battlePrompt();
        else if (s.speed > 0) G.tick(dt * s.speed / 4);
      }
      if (UI.tab === 'map') drawMap();
      if (UI.dirty) render();
      UI.acc = (UI.acc || 0) + dt; if (UI.acc > 0.25) { UI.acc = 0; tickUI(); if (UI.tab === 'map' && UI.sel && !UI.modalOpen) { const sh = $('sheet'), st = sh.scrollTop; if (!sh.matches(':active')) { renderSheet(); sh.scrollTop = st; } } }
      UI.saveT += dt; if (UI.saveT > 8) { UI.saveT = 0; G.save(); }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { if (UI.tab === 'map') resizeMap(); if (UI.battle) UI.battle.view.resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S() && !UI.menu) G.save(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

  buildTop(); showMenu(); requestAnimationFrame(frame);
  window.UI = UI;
})();
