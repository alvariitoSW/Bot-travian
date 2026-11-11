/* AQVILA — lógica de campaña: economía, ciudades, marchas, IA enemiga, hechos históricos */
(function (root) {
  const D = root.DATA;
  const G = { state: null, onEvent: null };
  const SAVE_KEY = 'aqvila-save-v1';
  const emit = (type, p) => { if (G.onEvent) G.onEvent(type, p); };
  const sum = o => { let n = 0; for (const k in o) n += o[k]; return n; };

  G.yearOf = t => D.START_YEAR - Math.floor(t / 12);
  G.dateStr = t => D.MONTHS[Math.floor(t) % 12] + ' · ' + G.yearOf(t) + ' a.C.';
  G.rate = L => L <= 0 ? 0 : Math.round(14 * L * Math.pow(1.15, L - 1));
  G.cost = function (b, L) { const o = {}, base = D.BUILD[b].cost; for (const r in base) o[r] = Math.round(base[r] * Math.pow(1.5, L) / 5) * 5; return o; };
  G.buildTime = (city, b) => D.BUILD[b].time * Math.pow(1.35, city.b[b] || 0) * (1 - 0.04 * (city.b.foro || 0));
  G.myCities = () => Object.keys(G.state.cities).filter(id => G.state.cities[id].owner === 'roma');
  G.cap = () => { let c = 0; for (const id of G.myCities()) c += 600 * Math.pow(1.45, G.state.cities[id].b.almacen || 0); return Math.round(c); };
  G.men = units => { let n = 0; for (const k in units) n += units[k] * (D.UNITS[k].cls === 'ele' ? 1 : 1); return n; };
  G.power = units => { let p = 0; for (const k in units) { const u = D.UNITS[k]; p += units[k] * (u.atk + u.def) * (u.hp || 1) * (u.mass ? 1.6 : 1); } return Math.round(p / 10); };
  G.pos = id => { const c = D.CITIES[id]; return D.proj(c.lon, c.lat); };
  G.edge = (a, b) => D.EDGES.find(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
  G.neighbors = id => D.EDGES.filter(e => e[0] === id || e[1] === id).map(e => e[0] === id ? e[1] : e[0]);
  G.canAfford = c => { for (const r in c) if (G.state.res[r] < c[r]) return false; return true; };
  const pay = c => { for (const r in c) G.state.res[r] -= c[r]; };

  G.prod = function () {
    const s = G.state, p = { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 };
    let up = 0;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      p.madera += 4 + G.rate(c.b.aserradero); p.piedra += 4 + G.rate(c.b.cantera); p.hierro += 4 + G.rate(c.b.mina); p.grano += 6 + G.rate(c.b.granja);
      p.oro += G.rate(c.b.foro) * 0.5 + (c.pop || 0) * 0.03 * G.impMult(c) + 5 * (c.b.puerto || 0);   // foro + impuestos de la población + comercio del puerto
      p.grano -= (c.pop || 0) * 0.02;
      for (const k in c.units) up += c.units[k] * D.UNITS[k].up;
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    p.grano -= up; p.upkeep = up;
    return p;
  };

  /* ---------- felicidad e impuestos ---------- */
  G.impMult = c => (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).mult;
  G.felicidad = function (c) {
    let f = D.FELICIDAD_BASE + (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).f;
    for (const b in D.FELICIDAD_EDIF) f += D.FELICIDAD_EDIF[b] * ((c.b && c.b[b]) || 0);
    return Math.max(0, Math.min(100, Math.round(f)));
  };
  G.setImp = function (cid, nivel) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.IMPUESTOS[nivel]) return false; c.imp = nivel; return true; };

  /* ---------- población ---------- */
  G.popCap = c => Math.round(120 + 130 * (c.b.viviendas || 0) + 30 * (c.b.foro || 0));
  G.MIN_POP = 50;                                   // civiles que nunca se reclutan
  G.recruits = c => Math.max(0, Math.floor((c.pop || 0) - G.MIN_POP));

  /* ---------- mercado ---------- */
  G.marketLevel = () => { let l = 0; for (const id of G.myCities()) l = Math.max(l, G.state.cities[id].b.mercado || 0); return l; };
  G.tradeRate = () => { const l = G.marketLevel(); return l ? Math.min(0.9, 0.45 + 0.05 * l) : 0; };
  G.trade = function (from, to, amount) {
    const s = G.state, rate = G.tradeRate(); amount = Math.floor(Math.min(amount, s.res[from] || 0));
    if (!rate || from === to || amount <= 0 || !(from in s.res) || !(to in s.res)) return 0;
    const got = Math.min(Math.floor(amount * rate), Math.max(0, G.cap() - s.res[to])); if (got <= 0) return 0;
    s.res[from] -= Math.ceil(got / rate); s.res[to] += got; return got;
  };

  G.travel = function (a, b, withHero) {
    const pa = G.pos(a), pb = G.pos(b), e = G.edge(a, b), s = G.state;
    let t = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) / 60;
    if (e && e[2]) t *= s.mods.sea * Math.max(0.6, 1 - 0.05 * ((s.cities[a].b.puerto || 1) - 1));
    if (withHero) t /= 1 + 0.08 * s.hero.sk.log;
    return Math.max(0.5, t);
  };

  G.log = function (txt, kind) { const s = G.state; s.log.unshift({ t: s.t, x: txt, k: kind || '' }); if (s.log.length > 60) s.log.pop(); emit('log', { x: txt, k: kind }); };

  G.newGame = function (heroName) {
    const s = {
      v: 1, t: 0, speed: 1, res: { madera: 400, piedra: 400, hierro: 400, grano: 400, oro: 200 },
      cities: {}, marches: [], log: [], ev: {}, pending: [], over: null, mid: 1,
      mods: { sea: 1, flex: 0 }, forja: { armas: 0, armaduras: 0, cola: null }, stats: { battles: 0, wins: 0, kills: 0, lost: 0 },
      hero: { name: heroName || 'Lucio Cornelio Escipión', lvl: 1, xp: 0, pts: 1, sk: { mando: 0, disc: 0, log: 0 }, city: 'roma', march: null, wound: 0 }
    };
    for (const id in D.CITIES) {
      const d = D.CITIES[id], w = d.w, h = Math.floor(w / 2);
      s.cities[id] = {
        owner: d.f, units: Object.assign({}, d.g), queue: null, train: [],
        b: { aserradero: w, cantera: w, mina: w, granja: w, viviendas: id === 'roma' ? 2 : w, foro: Math.max(1, h), almacen: Math.max(1, h), mercado: id === 'roma' ? 0 : h, puerto: d.sea && id !== 'roma' ? Math.max(1, h) : 0, cuartel: id === 'roma' ? 1 : h, establo: id === 'roma' ? 0 : Math.max(0, h - 1), muralla: d.wl, templo: 0, herreria: 0 }
      };
    }
    for (const id in s.cities) s.cities[id].pop = Math.round(G.popCap(s.cities[id]) * 0.7);
    G.state = s;
    checkEvents(D.START_YEAR);
    return s;
  };

  /* ---------- acciones del jugador ---------- */
  G.upgrade = function (cid, b) {
    const c = G.state.cities[cid], L = c.b[b] || 0;
    if (c.owner !== 'roma' || c.queue || L >= D.MAX_LVL || (D.BUILD[b].sea && !D.CITIES[cid].sea)) return false;
    const cost = G.cost(b, L); if (!G.canAfford(cost)) return false;
    pay(cost); c.queue = { b: b, t0: G.state.t, t1: G.state.t + G.buildTime(c, b) };
    return true;
  };

  /* herrería: mejoras globales de armas y armaduras (niveles 0 a D.FORJA_MAX) */
  G.forjaCost = function (k, L) { const o = {}, base = D.FORJA[k].cost; for (const r in base) o[r] = Math.round(base[r] * Math.pow(1.5, L) / 5) * 5; return o; };
  G.forjaTime = (k, L) => D.FORJA[k].time * Math.pow(1.4, L);
  G.forjaMul = (s, k) => 1 + D.FORJA_BONO * ((s.forja && s.forja[k]) || 0);
  G.forjaUp = function (cid, k) {
    const s = G.state, c = s.cities[cid], f = s.forja, L = f[k];
    if (!D.FORJA[k] || c.owner !== 'roma' || f.cola || L >= D.FORJA_MAX || (c.b.herreria || 0) <= L) return false;
    const cost = G.forjaCost(k, L); if (!G.canAfford(cost)) return false;
    pay(cost); f.cola = { k: k, t0: s.t, t1: s.t + G.forjaTime(k, L) };
    return true;
  };

  G.unitOk = function (c, k) { const u = D.UNITS[k]; if (!u.cost) return false; for (const b in u.req) if ((c.b[b] || 0) < u.req[b]) return false; return true; };
  G.unitCost = function (k, n) { const o = {}, c = D.UNITS[k].cost; for (const r in c) o[r] = c[r] * n; return o; };
  G.maxTrain = function (k) { let m = 1e9; const c = D.UNITS[k].cost; for (const r in c) m = Math.min(m, Math.floor(G.state.res[r] / c[r])); return m; };
  G.train = function (cid, k, n) {
    const s = G.state, c = s.cities[cid]; n = Math.floor(n);
    if (c.owner !== 'roma' || n <= 0 || !G.unitOk(c, k) || c.train.length >= 5 || G.recruits(c) < n) return false;
    const cost = G.unitCost(k, n); if (!G.canAfford(cost)) return false;
    pay(cost); c.pop -= n;                                 // los reclutas salen de la población
    const u = D.UNITS[k], bl = c.b[Object.keys(u.req)[0]] || 1, last = c.train[c.train.length - 1];
    const t0 = Math.max(s.t, last ? last.t1 : 0);
    c.train.push({ u: k, n: n, t0: t0, t1: t0 + n * u.time * Math.max(0.5, 1 - 0.05 * (bl - 1)) });
    return true;
  };

  G.heroAvailable = cid => { const h = G.state.hero; return h.city === cid && !h.march && h.wound <= G.state.t; };

  G.send = function (from, to, units, withHero) {
    const s = G.state, c = s.cities[from];
    if (!c || c.owner !== 'roma' || !G.edge(from, to)) return false;
    if (G.edge(from, to)[2] && !(c.b.puerto > 0)) return false;       // por mar hace falta un puerto
    const u = {}; let n = 0;
    for (const k in units) { const q = Math.min(Math.floor(units[k]), c.units[k] || 0); if (q > 0) { u[k] = q; n += q; } }
    if (withHero && !G.heroAvailable(from)) withHero = false;
    const own = s.cities[to].owner === 'roma';
    if (n === 0 && !(withHero && own)) return false;
    for (const k in u) { c.units[k] -= u[k]; if (c.units[k] <= 0) delete c.units[k]; }
    const m = { id: s.mid++, owner: 'roma', from: from, to: to, units: u, hero: !!withHero, t0: s.t, t1: s.t + G.travel(from, to, withHero) };
    if (withHero) { s.hero.city = null; s.hero.march = m.id; }
    s.marches.push(m);
    return true;
  };

  G.skill = function (k) { const h = G.state.hero; if (h.pts <= 0 || h.sk[k] >= 10) return false; h.pts--; h.sk[k]++; return true; };
  G.xpNeed = l => Math.round(80 * Math.pow(l, 1.6));
  function addXp(x) {
    const s = G.state, h = s.hero; let t = 0;
    for (const id of G.myCities()) t = Math.max(t, s.cities[id].b.templo || 0);
    h.xp += Math.round(x * (1 + 0.1 * t));
    while (h.xp >= G.xpNeed(h.lvl)) { h.xp -= G.xpNeed(h.lvl); h.lvl++; h.pts++; G.log('🦅 ' + h.name + ' asciende al nivel ' + h.lvl + '.', 'good'); }
  }

  /* ---------- IA enemiga y hechos históricos ---------- */
  function spawn(owner, fromId, fromXY, to, units, gen, eta, label) {
    const s = G.state;
    s.marches.push({ id: s.mid++, owner: owner, from: fromId, fromXY: fromXY, to: to, units: units, gen: gen || null, t0: s.t, t1: s.t + eta, label: label || null });
  }
  const firstMine = list => list.find(id => G.state.cities[id].owner === 'roma') || 'roma';

  const FX = {
    pirro: function (s) {
      if (s.cities.tarentum.owner !== 'epiro') return;
      spawn('epiro', 'tarentum', null, firstMine(['capua', 'roma']), { falange: 70, hoplitas: 50, peltastas: 30, tesalios: 20, elefantes: 3 }, { n: 'Pirro de Epiro', mando: 3, disc: 2 }, 20, 'Pirro');
    },
    pirroSeVa: function (s) { const c = s.cities.tarentum; if (c.owner === 'epiro') { delete c.units.elefantes; } },
    corvus: function (s) { s.mods.sea = 0.7; },
    egadas: function (s) {
      const n = ['messana', 'syracusae', 'agrigentum', 'panormus', 'lilybaeum'].filter(id => s.cities[id].owner === 'roma').length;
      if (n > 0) { s.res.oro += 400 * n; G.log('🪙 Cartago paga ' + 400 * n + ' denarios de indemnización.', 'good'); }
    },
    telamon: function (s) {
      if (s.cities.mediolanum.owner !== 'galos') return;
      spawn('galos', 'mediolanum', null, firstMine(['volsinii', 'roma']), { galos: 480, jinetes: 80 }, { n: 'Concolitano', mando: 2, disc: 1 }, 14, 'Horda gala');
    },
    anibal1: function (s) {
      spawn('cartago', null, D.proj(6.9, 45.1), firstMine(['mediolanum', 'volsinii', 'roma']), { libios: 300, iberos: 200, galos: 200, numidas: 150, elefantes: 15 }, { n: 'Aníbal Barca', mando: 6, disc: 5 }, 16, 'Aníbal');
    },
    anibal2: function (s) {
      spawn('cartago', null, D.proj(16.1, 41.3), firstMine(['capua', 'tarentum', 'roma']), { libios: 350, iberos: 250, galos: 250, numidas: 200 }, { n: 'Aníbal Barca', mando: 6, disc: 5 }, 14, 'Aníbal');
    },
    escipion: function (s) { s.hero.pts++; },
    masinisa: function (s) { const u = s.cities.roma.units; u.numidas = (u.numidas || 0) + 80; },
    flex: function (s) { s.mods.flex = 1; }
  };

  function checkEvents(year) {
    const s = G.state;
    D.EVENTS.forEach((ev, i) => {
      if (s.ev[i] || year > ev.y) return;
      s.ev[i] = 1;
      if (ev.fx && FX[ev.fx]) FX[ev.fx](s);
      G.log('📜 ' + ev.y + ' a.C. — ' + ev.t, 'hist');
      emit('event', ev);
    });
  }

  function newYear(year) {
    const s = G.state, mult = 1 + (D.START_YEAR - year) / (D.START_YEAR - D.END_YEAR) * 0.8;
    for (const id in s.cities) {
      const c = s.cities[id]; if (c.owner === 'roma') continue;
      const d = D.CITIES[id], f = D.FACTIONS[c.owner];
      // refuerzos de la guarnición
      const base = c.owner === d.f ? d.g : null;
      if (base) for (const k in base) { const cap = Math.round(base[k] * mult), cur = c.units[k] || 0; if (cur < cap) c.units[k] = Math.min(cap, cur + Math.ceil(cap * 0.06)); }
      // incursiones
      if (!f.raid || year > f.from || year > 270) continue;
      if (s.marches.some(m => m.from === id && m.owner !== 'roma')) continue;
      const tg = G.neighbors(id).filter(n => s.cities[n].owner === 'roma');
      if (!tg.length || G.men(c.units) < 100 || Math.random() > 0.14) continue;
      const to = tg[Math.floor(Math.random() * tg.length)], u = {};
      for (const k in c.units) { const q = Math.floor(c.units[k] * 0.4); if (q > 0) { u[k] = q; c.units[k] -= q; } }
      spawn(c.owner, id, null, to, u, null, G.travel(id, to) * 2 + 4);
      G.log('⚠️ ' + f.n + ' envía un ejército desde ' + d.n + ' contra ' + D.CITIES[to].n + '.', 'bad');
      emit('alert', '¡' + f.n + ' marcha sobre ' + D.CITIES[to].n + '!');
    }
    checkEvents(year);
    if (year < D.END_YEAR && !s.over) { s.over = { win: false, why: 'El año 146 a.C. ha terminado y Cartago sigue en pie. La historia recordará a otro.' }; emit('over'); }
  }

  /* ---------- bucle ---------- */
  G.tick = function (dm) {
    const s = G.state; if (!s || s.over || s.pending.length) return;
    const y0 = G.yearOf(s.t), m0 = Math.floor(s.t);
    s.t += dm;
    // economía
    const p = G.prod(), cap = G.cap();
    for (const r of D.RES) s.res[r] = Math.max(0, Math.min(cap, s.res[r] + p[r] * dm));
    for (const id of G.myCities()) { const c = s.cities[id], pc = G.popCap(c); c.pop = s.res.grano > 0 ? (G.felicidad(c) < D.FELICIDAD_MIN_CRECER ? c.pop : Math.min(pc, c.pop + (1 + 0.03 * c.pop * Math.max(0, 1 - c.pop / pc)) * dm)) : Math.max(20, c.pop * (1 - 0.02 * dm)); }
    // herrería
    if (s.forja.cola && s.t >= s.forja.cola.t1) { const k = s.forja.cola.k; s.forja[k]++; s.forja.cola = null; G.log('🔨 Herrería: ' + D.FORJA[k].n + ' nivel ' + s.forja[k] + '.'); emit('dirty'); }
    // colas
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.queue && s.t >= c.queue.t1) { const b = c.queue.b; c.b[b] = (c.b[b] || 0) + 1; c.queue = null; G.log('🏗️ ' + D.CITIES[id].n + ': ' + D.BUILD[b].n + ' nivel ' + c.b[b] + '.'); emit('dirty'); }
      while (c.train.length && s.t >= c.train[0].t1) { const q = c.train.shift(); c.units[q.u] = (c.units[q.u] || 0) + q.n; G.log('🛡️ ' + D.CITIES[id].n + ': ' + q.n + ' ' + D.UNITS[q.u].n + ' listos.'); emit('dirty'); }
    }
    // marchas
    for (let i = s.marches.length - 1; i >= 0; i--) {
      const m = s.marches[i]; if (s.t < m.t1) continue;
      s.marches.splice(i, 1);
      const c = s.cities[m.to];
      if (m.owner === 'roma') {
        if (c.owner === 'roma') { merge(c.units, m.units); if (m.hero) { s.hero.city = m.to; s.hero.march = null; } emit('dirty'); }
        else s.pending.push({ kind: 'attack', m: m });
      } else if (c.owner === 'roma') s.pending.push({ kind: 'defense', m: m });
      else if (c.owner === m.owner) merge(c.units, m.units);
    }
    if (s.pending.length) { emit('battle'); return; }
    // hambre
    if (Math.floor(s.t) > m0 && s.res.grano <= 0 && p.grano < 0) {
      for (const id of G.myCities()) { const u = s.cities[id].units; for (const k in u) u[k] = Math.floor(u[k] * 0.96); }
      if (Math.floor(s.t) % 6 === 0) G.log('🍞 ¡No hay grano! Las tropas desertan.', 'bad');
      emit('dirty');
    }
    const y1 = G.yearOf(s.t);
    if (y1 < y0) newYear(y1);
  };

  function merge(a, b) { for (const k in b) if (b[k] > 0) a[k] = (a[k] || 0) + b[k]; }

  /* ---------- batallas ---------- */
  G.battleInfo = function (pb) {
    const s = G.state, m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const fa = G.forjaMul(s, 'armas'), fd = G.forjaMul(s, 'armaduras');
    const hm = { atkMul: (1 + 0.04 * h.sk.mando) * (s.mods.flex ? 1.1 : 1) * fa, defMul: (1 + 0.03 * h.sk.disc) * fd, mor: 4 * h.sk.disc };
    const noHero = { atkMul: (s.mods.flex ? 1.1 : 1) * fa, defMul: fd, mor: 0 };
    let me, foe, heroIn;
    if (pb.kind === 'attack') {
      heroIn = m.hero;
      me = Object.assign({ units: m.units, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name } : null }, heroIn ? hm : noHero);
      const year = G.yearOf(s.t), g = d.gen && c.owner === d.f && year >= d.gen.until ? d.gen : null;
      foe = { units: c.units, name: D.FACTIONS[c.owner].n, col: D.FACTIONS[c.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    } else {
      heroIn = G.heroAvailable(cid);
      const u = Object.assign({}, c.units); u.vigiles = 20 + 20 * (c.b.muralla || 0);
      me = Object.assign({ units: u, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name } : null }, heroIn ? hm : noHero);
      me.mor += 3 * (c.b.templo || 0);
      const g = m.gen;
      foe = { units: m.units, name: D.FACTIONS[m.owner].n, col: D.FACTIONS[m.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    }
    return { cfg: { sides: [me, foe], defender: pb.kind === 'attack' ? 1 : 0, wall: c.b.muralla || 0, seed: Math.floor(s.t * 1000) + m.id }, city: cid, heroIn: heroIn, kind: pb.kind };
  };

  const keep = (surv, lost, f, g) => { const o = {}; for (const k in surv) { if (k === 'vigiles') continue; const n = Math.floor(surv[k] * f + (lost[k] || 0) * g); if (n > 0) o[k] = n; } return o; };

  G.applyBattle = function (res) {
    const s = G.state, pb = s.pending.shift(), m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const heroIn = pb.kind === 'attack' ? m.hero : G.heroAvailable(cid);
    const win = res.winner === 0, out = { win: win, kind: pb.kind, city: cid, dead: res.dead, lines: [] };
    s.stats.battles++; if (win) s.stats.wins++; s.stats.kills += res.dead[1]; s.stats.lost += res.dead[0];
    if (pb.kind === 'attack') {
      if (win) {
        const prev = D.FACTIONS[c.owner].n;
        c.owner = 'roma'; c.imp = 'normal'; c.units = keep(res.surv[0], res.lost[0], 1, 0.25); c.queue = null; c.train = []; c.pop = Math.round(G.popCap(c) * 0.5);
        c.b.muralla = Math.max(0, (c.b.muralla || 0) - 1);
        if (m.hero) { h.city = cid; h.march = null; }
        const loot = Math.round(150 * d.w * (1 + 0.1 * h.sk.log)), cap = G.cap();
        for (const r of D.RES) s.res[r] = Math.min(cap, s.res[r] + (r === 'oro' ? loot : loot));
        out.lines.push('🏛️ ' + d.n + ' es ahora romana.', '💰 Botín: +' + loot + ' de cada recurso.');
        G.log('🏆 ¡' + d.n + ' conquistada a ' + prev + '!', 'good');
        if (cid === 'carthago') { s.over = { win: true, why: 'Cartago ha caído en ' + G.yearOf(s.t) + ' a.C. Sus muros son arrasados y Roma es dueña del Mediterráneo: Mare Nostrum.' }; }
      } else {
        merge(s.cities[m.from].owner === 'roma' ? s.cities[m.from].units : s.cities.roma.units, keep(res.surv[0], res.lost[0], 0.7, 0));
        c.units = keep(res.surv[1], res.lost[1], 1, 0.3);
        if (m.hero) { h.city = s.cities[m.from].owner === 'roma' ? m.from : 'roma'; h.march = null; }
        out.lines.push('Los supervivientes se retiran a ' + D.CITIES[m.from].n + '.');
        G.log('💀 Derrota ante los muros de ' + d.n + '.', 'bad');
      }
    } else {
      if (win) {
        c.units = keep(res.surv[0], res.lost[0], 1, 0.25);
        out.lines.push('🛡️ ' + d.n + ' resiste.');
        G.log('🛡️ ' + d.n + ' rechaza el ataque de ' + D.FACTIONS[m.owner].n + '.', 'good');
      } else {
        c.owner = m.owner; c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.queue = null; c.train = [];
        out.lines.push('🔥 ' + d.n + ' ha caído en manos de ' + D.FACTIONS[m.owner].n + '.');
        G.log('🔥 ' + d.n + ' ha caído ante ' + D.FACTIONS[m.owner].n + '.', 'bad');
        if (cid === 'roma') s.over = { win: false, why: 'Roma ha caído en ' + G.yearOf(s.t) + ' a.C. ante ' + D.FACTIONS[m.owner].n + '. Vae victis.' };
        else if (h.city === cid) h.city = 'roma';
        // las marchas propias hacia la ciudad perdida se convierten en ataques al llegar (ya lo gestiona tick)
      }
    }
    if (heroIn) {
      const before = h.lvl; addXp(res.dead[1] / 4 * (win ? 1.5 : 0.7) + 10);
      out.lines.push('🦅 ' + h.name + ' gana experiencia' + (h.lvl > before ? ' y sube al nivel ' + h.lvl + '.' : '.'));
      if (res.genDead[0]) { h.wound = s.t + 24; out.lines.push('🩸 ' + h.name + ' ha sido herido: dos años de convalecencia.'); G.log('🩸 ' + h.name + ' cae herido en combate.', 'bad'); }
    }
    G.save();
    if (s.over) emit('over');
    return out;
  };

  /* ---------- guardado ---------- */
  G.save = function () { try { if (typeof localStorage !== 'undefined' && G.state) localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* almacenamiento no disponible */ } };
  G.hasSave = function () { try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.load = function () { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { G.state = s; if (!s.forja) s.forja = { armas: 0, armaduras: 0, cola: null }; for (const id in s.cities) { const c = s.cities[id]; for (const b of ['viviendas', 'mercado', 'puerto', 'herreria']) if (c.b[b] === undefined) c.b[b] = b === 'viviendas' ? 2 : 0; if (c.pop === undefined) c.pop = Math.round(G.popCap(c) * 0.7); if (!D.IMPUESTOS[c.imp]) c.imp = 'normal'; } return true; } } catch (e) { /* partida corrupta */ } return false; };
  G.wipe = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } };

  root.Game = G;
  if (typeof module !== 'undefined') module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
