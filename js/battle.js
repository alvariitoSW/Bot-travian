/* AQVILA — motor de batalla táctica en tiempo real (simulación + vista) */
(function (root) {
  const D = root.DATA;
  const FW = 600, CONTACT = 50;

  function mkRng(seed) { let a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function effN(m) { return m <= 24 ? m : 24 + (m - 24) * 0.3; }
  function ratio(atk, def) { return Math.pow(atk / def, 0.6); }
  function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  /* cfg: { sides:[{units,gen,name,col,atkMul,defMul,mor}, {...}], defender:0|1, wall:n, seed }
     el lado 0 es siempre el jugador (abajo) */
  function Battle(cfg) {
    this.cfg = cfg; this.t = 0; this.regs = []; this.fx = []; this.corpses = [];
    this.over = false; this.winner = null; this.auto = true;
    this.H = Math.max(800, Math.min(1300, Math.round(cfg.fh || 900))); // alto del campo (se adapta a la pantalla)
    this.rnd = mkRng(cfg.seed || 1);
    this.genDown = [false, false];
    // mismo tamaño de regimiento para ambos bandos (máx. ~12 regimientos por ejército)
    let big = 0;
    for (const sd of cfg.sides) { let t = 0; for (const k in sd.units) if (D.UNITS[k].cls !== 'ele') t += sd.units[k]; big = Math.max(big, t); }
    this.size = Math.max(30, Math.ceil(big / 12));
    for (let s = 0; s < 2; s++) this.deploy(s, cfg.sides[s]);
    this.start = [this.men(0), this.men(1)];
  }

  Battle.prototype.men = function (side) { let n = 0; for (const r of this.regs) if (r.side === side && r.st === 'ok') n += r.men; return n; };

  Battle.prototype.mk = function (side, k, men, a) {
    const u = D.UNITS[k], hp = u.hp || 1;
    let def = a.defMul || 1;
    if (this.cfg.defender === side) def *= 1 + 0.1 * (this.cfg.wall || 0);
    const mor = u.mor + (a.mor || 0);
    return {
      id: this.regs.length + 1, side: side, k: k, u: u, men: men, max: men, hp: men * hp, mor: mor, morMax: mor,
      x: 0, y: 0, ang: side === 0 ? -Math.PI / 2 : Math.PI / 2, st: 'ok', tgt: null, order: null,
      think: this.rnd() * 0.5, cd: this.rnd() * 1.6, ammo: u.range ? 14 : 0, fight: 0, charge: 0, run: 0, flank: 0,
      atkMul: (a.atkMul || 1) * (0.92 + this.rnd() * 0.16), defMul: def // ±8 % de fortuna por regimiento
    };
  };

  Battle.prototype.deploy = function (side, a) {
    const list = [], size = this.size;
    for (const k in a.units) {
      const n = Math.floor(a.units[k]); if (n <= 0) continue;
      const sz = D.UNITS[k].cls === 'ele' ? 8 : size, cnt = Math.max(1, Math.round(n / sz));
      for (let i = 0; i < cnt; i++) { const r = this.mk(side, k, Math.floor(n / cnt) + (i < n % cnt ? 1 : 0), a); this.regs.push(r); list.push(r); }
    }
    let gen = null;
    if (a.gen) { gen = this.mk(side, 'general', 20, a); gen.name = a.gen.n; this.regs.push(gen); }
    const f = side === 0 ? -1 : 1, base = side === 0 ? this.H - 200 : 200, SP = 62, CAP = 7;
    const place = (row, y) => row.forEach((r, i) => { r.x = FW / 2 + (i - (row.length - 1) / 2) * SP; r.y = y; });
    let skirm = list.filter(r => r.u.cls === 'rng'), main = list.filter(r => r.u.cls === 'inf' || r.u.cls === 'spear' || r.u.cls === 'ele'), cav = list.filter(r => r.u.cls === 'cav');
    // elefantes al centro-frente, lanzas en los extremos de la línea
    main.sort((p, q) => (q.u.cls === 'ele') - (p.u.cls === 'ele'));
    if (skirm.length > CAP) main = main.concat(skirm.splice(CAP));
    place(skirm, base + f * 58);
    const wings = cav.splice(0, 2), rows = [];
    const first = main.splice(0, CAP - wings.length);
    rows.push((wings[0] ? [wings[0]] : []).concat(first, wings[1] ? [wings[1]] : []));
    while (main.length) rows.push(main.splice(0, CAP));
    const rear = cav.concat(gen ? [gen] : []);
    if (rear.length) { if (gen) { rear.splice(rear.indexOf(gen), 1); rear.splice(Math.floor(rear.length / 2), 0, gen); } rows.push(rear.splice(0, CAP)); }
    while (rear.length) rows.push(rear.splice(0, CAP));
    rows.forEach((row, i) => place(row, base - f * 60 * i));
    for (const r of this.regs) if (r.side === side) r.y = Math.max(24, Math.min(this.H - 24, r.y));
  };

  Battle.prototype.pick = function (r, hold) {
    let best = null, bs = 1e9;
    for (const e of this.regs) {
      if (e.side === r.side || e.st !== 'ok') continue;
      const d = Math.hypot(e.x - r.x, e.y - r.y);
      if (hold && d > (r.ammo > 0 ? r.u.range : 130)) continue;
      let s = d;
      if (d < CONTACT + 6) s -= 1000;
      else if (r.u.cls === 'cav') { if (e.u.cls === 'rng') s *= 0.55; else if (e.u.cls === 'spear' || e.u.cls === 'ele') s *= 1.7; }
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  };

  Battle.prototype.turn = function (r, want, dt) {
    const d = angDiff(want, r.ang), m = (r.u.cls === 'cav' || r.u.cls === 'gen' ? 3.2 : 2.2) * dt;
    r.ang += Math.abs(d) <= m ? d : Math.sign(d) * m;
  };

  Battle.prototype.moveTo = function (r, x, y, dt, mul) {
    const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy);
    if (d < 1) return 0;
    this.turn(r, Math.atan2(dy, dx), dt);
    const m = Math.min(r.u.spd * (mul || 1) * dt, d);
    r.x += dx / d * m; r.y += dy / d * m; r.run += m;
    return d - m;
  };

  Battle.prototype.hit = function (a, b, amount, ranged) {
    const prev = b.men, hp = b.u.hp || 1;
    // flanqueo
    const da = Math.abs(angDiff(Math.atan2(a.y - b.y, a.x - b.x), b.ang));
    let fl = 1;
    if (da > 2.1) fl = 1.6; else if (da > 1.15) fl = 1.3;
    if (fl > 1) { b.flank = 1; if (b.k === 'falange') fl *= 1.35; } // la falange es muy vulnerable por los flancos
    let m = amount * fl;
    const ac = a.u.cls, bc = b.u.cls;
    if (!ranged) {
      if (ac === 'spear' && (bc === 'cav' || bc === 'ele' || bc === 'gen')) m *= 1.7;
      if ((ac === 'cav' || ac === 'gen') && bc === 'spear' && fl === 1) m *= 0.6;
      if ((ac === 'cav' || ac === 'gen') && bc === 'rng') m *= 1.5;
      if (a.charge > 0) m *= 2.1;
    } else if (bc === 'ele') m *= 1.5; // los proyectiles espantan a los elefantes
    b.hp -= m;
    b.men = Math.max(0, Math.ceil(b.hp / hp));
    const killed = prev - b.men;
    b.mor -= (m / (b.max * hp)) * 100 * 0.8 * (fl > 1 ? 1.35 : 1) * (ac === 'ele' ? 1.25 : 1);
    if (killed > 0 && this.corpses.length < 700) {
      const n = Math.min(killed, 3);
      for (let i = 0; i < n; i++) this.corpses.push({ x: b.x + (this.rnd() - 0.5) * 50, y: b.y + (this.rnd() - 0.5) * 30, s: b.side });
    }
    if (b.men <= 0) { b.st = 'dead'; this.onBreak(b); }
    else if (b.mor <= 0) { b.st = 'rout'; this.onBreak(b); }
  };

  Battle.prototype.onBreak = function (b) {
    b.order = null;
    for (const o of this.regs) {
      if (o.st !== 'ok') continue;
      const near = Math.hypot(o.x - b.x, o.y - b.y) < 120;
      if (b.k === 'general' && o.side === b.side) o.mor -= 12;
      else if (near) o.mor += o.side === b.side ? -5 : 4;
    }
    if (b.k === 'general') this.genDown[b.side] = true;
  };

  Battle.prototype.step = function (dt) {
    if (this.over) return;
    this.t += dt;
    const regs = this.regs, cur = [this.men(0), this.men(1)];
    for (const r of regs) {
      if (r.st === 'rout') {
        r.y += (r.side === 0 ? 1 : -1) * r.u.spd * 1.3 * dt; r.ang = r.side === 0 ? Math.PI / 2 : -Math.PI / 2;
        if (r.y < -30 || r.y > this.H + 30) r.st = 'fled';
        continue;
      }
      if (r.st !== 'ok') continue;
      if (r.charge > 0) r.charge -= dt;
      const collapse = cur[r.side] < this.start[r.side] * 0.15;
      if (collapse) r.mor -= 4 * dt;
      // objetivo
      let tgt = r.tgt && r.tgt.st === 'ok' ? r.tgt : null;
      const hold = (r.side === 0 && !this.auto) || (r.u.cls === 'gen' && cur[r.side] > this.start[r.side] * 0.55);
      if (r.order && r.order.k === 'atk') { if (r.order.r.st === 'ok') tgt = r.order.r; else { r.order = null; tgt = null; } }
      else if (!r.order) { r.think -= dt; if (r.think <= 0 || !tgt) { r.think = 0.5; tgt = this.pick(r, hold); } }
      else tgt = null;
      r.tgt = tgt;
      let fighting = false;
      if (r.order && r.order.k === 'move') {
        if (this.moveTo(r, r.order.x, r.order.y, dt) < 6) r.order = null;
      } else if (tgt) {
        const d = Math.hypot(tgt.x - r.x, tgt.y - r.y);
        if (r.ammo > 0 && d > CONTACT + 6) {
          if (d <= r.u.range) {
            this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
            r.cd -= dt;
            if (r.cd <= 0) {
              r.cd = 1.6; r.ammo--;
              this.hit(r, tgt, effN(r.men) * ratio(r.u.ratk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * 1.6 * 0.6, true);
              this.fx.push({ x0: r.x, y0: r.y, x1: tgt.x, y1: tgt.y, t: 0, n: Math.min(6, 1 + (r.men >> 4)) });
            }
          } else this.moveTo(r, tgt.x, tgt.y, dt);
        } else if (d > CONTACT) {
          const left = this.moveTo(r, tgt.x, tgt.y, dt, (r.u.cls === 'cav' || r.u.cls === 'gen') && d < 160 ? 1.25 : 1);
          if (left <= CONTACT && (r.u.cls === 'cav' || r.u.cls === 'gen' || r.u.cls === 'ele') && r.run > 90) r.charge = 2.5;
        } else {
          fighting = true; r.run = 0;
          this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
          this.hit(r, tgt, effN(r.men * (r.u.mass || 1)) * ratio(r.u.atk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * dt, false);
        }
      }
      r.fight = fighting ? 0.4 : Math.max(0, r.fight - dt);
      if (!fighting && r.fight <= 0) { r.mor = Math.min(r.morMax, r.mor + 1.5 * dt); r.flank = 0; }
      r.x = Math.max(20, Math.min(FW - 20, r.x)); r.y = Math.max(20, Math.min(this.H - 20, r.y));
    }
    // separación entre regimientos amigos
    for (let i = 0; i < regs.length; i++) {
      const a = regs[i]; if (a.st !== 'ok') continue;
      for (let j = i + 1; j < regs.length; j++) {
        const b = regs[j]; if (b.st !== 'ok' || b.side !== a.side) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < 56) { const p = (56 - d) * 0.5 * Math.min(1, dt * 6), nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p; }
      }
    }
    for (const f of this.fx) f.t += dt;
    if (this.fx.length && this.fx[0].t > 0.5) this.fx = this.fx.filter(f => f.t <= 0.5);
    const n0 = this.men(0), n1 = this.men(1);
    if (n0 <= 0 || n1 <= 0) { this.over = true; this.winner = n0 > 0 ? 0 : 1; }
    else if (this.t > 240) { this.over = true; this.winner = this.cfg.defender; }
  };

  Battle.prototype.finish = function () { let i = 0; while (!this.over && i++ < 6000) this.step(0.1); };

  Battle.prototype.result = function () {
    const res = { winner: this.winner, surv: [{}, {}], lost: [{}, {}], dead: [0, 0], genDead: [false, false], time: this.t };
    for (const r of this.regs) {
      const alive = r.st === 'dead' ? 0 : r.men;
      if (r.k === 'general') { res.genDead[r.side] = r.st === 'dead'; continue; }
      res.surv[r.side][r.k] = (res.surv[r.side][r.k] || 0) + alive;
      res.lost[r.side][r.k] = (res.lost[r.side][r.k] || 0) + (r.max - alive);
      res.dead[r.side] += r.max - alive;
    }
    return res;
  };

  /* ---------------- Vista ---------------- */
  function BattleView(canvas, battle) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.b = battle; this.sel = new Set();
    this.bg = this.makeBg();
    this.resize();
  }

  BattleView.prototype.resize = function () {
    const p = this.cv.parentElement, w = p.clientWidth, h = p.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    const sc = Math.min(w / FW, h / this.b.H);
    this.cv.style.width = FW * sc + 'px'; this.cv.style.height = this.b.H * sc + 'px';
    this.cv.width = Math.round(FW * sc * dpr); this.cv.height = Math.round(this.b.H * sc * dpr);
    this.k = sc * dpr; this.sc = sc;
  };

  BattleView.prototype.makeBg = function () {
    const c = document.createElement('canvas'); c.width = FW; c.height = this.b.H;
    const g = c.getContext('2d'), rnd = mkRng(this.b.cfg.seed || 7);
    const gr = g.createLinearGradient(0, 0, 0, this.b.H); gr.addColorStop(0, '#7d9150'); gr.addColorStop(0.5, '#93a35c'); gr.addColorStop(1, '#84964f');
    g.fillStyle = gr; g.fillRect(0, 0, FW, this.b.H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(60,80,30,0.10)' : 'rgba(200,190,120,0.10)';
      g.beginPath(); g.ellipse(rnd() * FW, rnd() * this.b.H, 10 + rnd() * 46, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill();
    }
    // camino
    g.strokeStyle = 'rgba(190,165,110,0.55)'; g.lineWidth = 26; g.beginPath(); g.moveTo(FW * 0.42, 0); g.bezierCurveTo(FW * 0.7, this.b.H * 0.3, FW * 0.3, this.b.H * 0.6, FW * 0.55, this.b.H); g.stroke();
    // árboles en los bordes
    for (let i = 0; i < 46; i++) {
      const left = rnd() < 0.5, x = left ? rnd() * 34 : FW - rnd() * 34, y = rnd() * this.b.H, r = 8 + rnd() * 9;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x + 3, y + 4, r, 0, 7); g.fill();
      g.fillStyle = rnd() < 0.5 ? '#3f6a2c' : '#4d7a33'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 7); g.fill();
    }
    // muralla del defensor
    const wall = this.b.cfg.wall || 0;
    if (wall > 0) {
      const y = this.b.cfg.defender === 0 ? this.b.H - 46 : 14;
      g.fillStyle = '#8d8676'; g.fillRect(0, y, FW, 32); g.fillStyle = '#6f695b'; g.fillRect(0, y + 26, FW, 6);
      g.fillStyle = '#a39b88';
      for (let x = 4; x < FW; x += 18) g.fillRect(x, y - 5, 10, 7);
      for (let x = 60; x < FW; x += 160) { g.fillStyle = '#7b7566'; g.fillRect(x - 20, y - 12, 40, 50); g.fillStyle = '#a39b88'; g.fillRect(x - 20, y - 16, 10, 6); g.fillRect(x - 5, y - 16, 10, 6); g.fillRect(x + 10, y - 16, 10, 6); }
      g.fillStyle = '#4a3a22'; g.fillRect(FW / 2 - 16, y + 4, 32, 28);
    }
    return c;
  };

  BattleView.prototype.toField = function (cx, cy) { const r = this.cv.getBoundingClientRect(); return [(cx - r.left) / this.sc, (cy - r.top) / this.sc]; };

  BattleView.prototype.tap = function (cx, cy) {
    const p = this.toField(cx, cy), b = this.b;
    let hit = null, hd = 40;
    for (const r of b.regs) { if (r.st !== 'ok') continue; const d = Math.hypot(r.x - p[0], r.y - p[1]); if (d < hd) { hd = d; hit = r; } }
    if (hit && hit.side === 0) { if (this.sel.has(hit)) this.sel.delete(hit); else this.sel.add(hit); return; }
    const sel = [...this.sel].filter(r => r.st === 'ok');
    if (!sel.length) return;
    if (hit) sel.forEach(r => { r.order = { k: 'atk', r: hit }; });
    else {
      let cx0 = 0, cy0 = 0; sel.forEach(r => { cx0 += r.x; cy0 += r.y; }); cx0 /= sel.length; cy0 /= sel.length;
      sel.forEach(r => { r.order = { k: 'move', x: p[0] + (r.x - cx0), y: p[1] + (r.y - cy0) }; r.tgt = null; });
      this.ping = { x: p[0], y: p[1], t: b.t };
    }
  };

  BattleView.prototype.selectAll = function () {
    const all = this.b.regs.filter(r => r.side === 0 && r.st === 'ok');
    if (this.sel.size >= all.length) this.sel.clear(); else all.forEach(r => this.sel.add(r));
  };

  BattleView.prototype.draw = function () {
    const c = this.ctx, b = this.b;
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
    c.drawImage(this.bg, 0, 0);
    for (const k of b.corpses) { c.fillStyle = k.s === 0 ? 'rgba(90,20,15,0.55)' : 'rgba(40,30,50,0.5)'; c.fillRect(k.x, k.y, 3.5, 2); }
    if (this.ping && b.t - this.ping.t < 0.6) { c.strokeStyle = 'rgba(255,230,120,' + (1 - (b.t - this.ping.t) / 0.6) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(this.ping.x, this.ping.y, 6 + (b.t - this.ping.t) * 40, 0, 7); c.stroke(); }
    // órdenes
    for (const r of this.sel) {
      if (r.st !== 'ok' || !r.order) continue;
      const tx = r.order.k === 'atk' ? r.order.r.x : r.order.x, ty = r.order.k === 'atk' ? r.order.r.y : r.order.y;
      c.strokeStyle = r.order.k === 'atk' ? 'rgba(255,90,60,0.7)' : 'rgba(255,235,140,0.7)'; c.lineWidth = 1.5; c.setLineDash([5, 5]);
      c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(tx, ty); c.stroke(); c.setLineDash([]);
    }
    const order = b.regs.slice().sort((p, q) => p.y - q.y);
    for (const r of order) if (r.st === 'ok' || r.st === 'rout') this.drawReg(r);
    // proyectiles
    c.strokeStyle = 'rgba(40,30,20,0.85)'; c.lineWidth = 1.2;
    for (const f of b.fx) {
      const p = Math.min(1, f.t / 0.45);
      for (let i = 0; i < f.n; i++) {
        const ox = (i - f.n / 2) * 7, x = f.x0 + (f.x1 - f.x0) * p + ox, y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 26;
        const a = Math.atan2(f.y1 - f.y0, f.x1 - f.x0);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7); c.stroke();
      }
    }
  };

  BattleView.prototype.drawReg = function (r) {
    const c = this.ctx, b = this.b, col = b.cfg.sides[r.side].col, cls = r.u.cls;
    const big = cls === 'cav' || cls === 'gen', ele = cls === 'ele';
    const cols = ele ? 4 : big ? 8 : 12, sp = ele ? 13 : big ? 6.6 : 4.6, ds = ele ? 9 : big ? 4 : 3;
    const maxDots = ele ? r.max : Math.min(r.max, big ? 32 : 48), dots = Math.max(1, Math.round(maxDots * r.men / r.max));
    const rows = Math.ceil(dots / cols), w = cols * sp + 4, d = Math.max(1, rows) * sp + 4;
    c.save(); c.translate(r.x, r.y); c.rotate(r.ang + Math.PI / 2);
    const rout = r.st === 'rout';
    if (!rout) {
      c.fillStyle = col; c.globalAlpha = 0.28; c.fillRect(-w / 2, -d / 2, w, d); c.globalAlpha = 1;
      c.strokeStyle = this.sel.has(r) ? '#ffe27a' : 'rgba(0,0,0,0.45)'; c.lineWidth = this.sel.has(r) ? 2.4 : 1; c.strokeRect(-w / 2, -d / 2, w, d);
      // frente
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(-w / 2, -d / 2 - 2, w, 1.6);
    }
    const tick = Math.floor(b.t * 9), jig = r.fight > 0 ? 1.4 : 0;
    for (let i = 0; i < dots; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      let x = -w / 2 + 2 + cx * sp + (sp - ds) / 2, y = -d / 2 + 2 + cy * sp + (sp - ds) / 2;
      if (jig || rout) { const h = Math.sin((i * 12.9898 + tick * 78.233 + r.id) * 43758.5453); x += h * (rout ? 5 : jig); y += Math.cos(h * 9) * (rout ? 5 : jig); }
      if (ele) { c.fillStyle = '#6d6a66'; c.fillRect(x, y, ds, ds + 2); c.fillStyle = col; c.fillRect(x + 2, y + 3, ds - 4, 4); c.fillStyle = '#e8e2d0'; c.fillRect(x + 1, y - 2, 1.5, 3); c.fillRect(x + ds - 2.5, y - 2, 1.5, 3); }
      else {
        c.fillStyle = big ? '#5a3d22' : cy === 0 ? '#f0d9a0' : col;
        c.fillRect(x, y, ds, big ? ds + 2 : ds);
        if (big) { c.fillStyle = cls === 'gen' ? '#ffd24a' : col; c.fillRect(x + 1, y + 1, ds - 2, ds - 1); }
        else if (cy === 0) { c.fillStyle = col; c.fillRect(x + 0.5, y + 1, ds - 1, ds - 1); }
      }
    }
    c.restore();
    // estandarte
    const bx = r.x, by = r.y - 2;
    c.strokeStyle = '#2a1c10'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by + 6); c.lineTo(bx, by - 14); c.stroke();
    c.fillStyle = rout ? '#f4f4f4' : cls === 'gen' ? '#ffd24a' : col; c.fillRect(bx, by - 15, 13, 10); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.8; c.strokeRect(bx, by - 15, 13, 10);
    if (!rout) {
      c.fillStyle = cls === 'gen' ? '#5a1a10' : '#fff'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ele ? 'E' : r.u.g, bx + 6.5, by - 9.5);
      const m = Math.max(0, r.mor / r.morMax);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(bx - 14, by + 8, 28, 3.5);
      c.fillStyle = m > 0.5 ? '#7ddc5a' : m > 0.25 ? '#f0c040' : '#e8503a'; c.fillRect(bx - 14, by + 8, 28 * m, 3.5);
      if (r.charge > 0) { c.fillStyle = '#fff'; c.font = 'bold 10px sans-serif'; c.fillText('¡CARGA!', bx, by - 22); }
    }
  };

  root.Battle = Battle; root.BattleView = BattleView;
  if (typeof module !== 'undefined') module.exports = { Battle: Battle };
})(typeof window !== 'undefined' ? window : globalThis);
