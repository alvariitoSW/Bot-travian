/* AQVILA — NB4: el choque en 3D en directo (solo dibuja; la lógica es js/batalla2.js).
   Cada regimiento es un bloque de 20–40 figuras reales de 0 A.D. en su sector; la línea de choque desplaza los dos frentes.
   No simula posiciones libres: cada pulso fija el sitio de cada bloque y las figuras caminan hasta él.
   Uso: const v = new Choque3D(host); v.estado(e, { corre, pausa, ms }); v.sucesos(lista, e); v.cerrar(). */
import { THREE } from './models.js';
import { applyGround, loadGroundTextures } from './ground.js';
import { loadIndex, preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE, lightGeometry, lightMaterial } from './units.js';

const SW = 28;                       // ancho de un sector (m)
const DT = 2;                        // segundos de batalla por pulso (como Batalla2)
const MORDIDA = 3;                   // metros que se desplaza todo el sector por punto de línea
const CAP_REAL = (navigator.maxTouchPoints > 0 ? 160 : 260);   // figuras reales a la vez (el resto, ligeras)
const DEAD = 80, V_ANDA = 3.6, V_CORRE = 7.5;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const lim = (v, a, z) => Math.max(a, Math.min(z, v));
const FORMA = cls => cls === 'ele' ? { cols: 3, sx: 5, sz: 6 } : cls === 'cav' || cls === 'gen' ? { cols: 6, sx: 2.1, sz: 2.8 } : cls === 'rng' ? { cols: 8, sx: 1.5, sz: 1.5 } : { cols: 8, sx: 1.2, sz: 1.3 };
const NFIG = (cls, n0) => cls === 'ele' ? lim(Math.round(n0 / 12), 3, 8) : cls === 'cav' || cls === 'gen' ? lim(Math.round(n0 / 4), 12, 24) : lim(Math.round(n0 / 2.5), 20, 40);
let ctxN = 0;

export class Choque3D {
  constructor(host) {
    this.host = host; this.e = null; this.listo = false; this.muerto = false; this.G = new Map(); this.mesh = new Map();
    this.act = [0, 0, 0]; this.opt = { corre: false, pausa: null, ms: 2000 }; this.subT = 0; this.simT = 0;
    this.r = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); ctxN++;
    this.pr = Math.min(window.devicePixelRatio || 1, 1.5); this.r.setPixelRatio(this.pr); this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.12;
    this.cv = this.r.domElement; this.cv.style.touchAction = 'none'; host.appendChild(this.cv);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#9cc3df'); this.scene.fog = new THREE.Fog('#d9d6bf', 110, 330);
    this.cam = new THREE.PerspectiveCamera(46, 2, 1, 600);
    this.c = { x: 0, z: 0, dist: 40 }; this.a = { x: 0, z: 0, dist: 52 }; this.pitch = 0.78; this.libre = 0;
    this.scene.add(new THREE.HemisphereLight('#cfe2ff', '#7a6238', 1.3));
    const sol = new THREE.DirectionalLight('#ffe6b8', 3); sol.position.set(-60, 90, 50); this.scene.add(sol);
    this.fps = 0; this.nf = 0; this.t0 = performance.now(); this.lenta = 0; this.last = performance.now(); this.t = 0;
    this.ligaEntrada(); this.resize(); this.onResize = () => this.resize(); window.addEventListener('resize', this.onResize);
    window.AQ_CHOQUE3D = this.info = { fps: 0, figuras: 0, reales: 0, ligeras: 0, listo: false };
    this.raf = requestAnimationFrame(t => this.bucle(t));
  }
  carga(e) {   // modelos de las tropas que salen y texturas del suelo; luego se dibuja
    const tipos = [...new Set(Object.keys(e.regs).map(i => e.regs[i].tipo))];
    this.pre = loadIndex().then(() => preload(tipos)).then(() => loadGroundTextures()).catch(() => null).then(() => { if (this.muerto) return; this.construirSuelo(); this.listo = true; this.info.listo = true; if (this.e) this.sincroniza(); });
  }

  /* ---------- cámara: sigue sola, se arrastra y vuelve ---------- */
  ligaEntrada() {
    const cv = this.cv; let d = null;
    cv.addEventListener('pointerdown', ev => { d = { x: ev.clientX, y: ev.clientY, mov: 0 }; try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura */ } });
    cv.addEventListener('pointermove', ev => {
      if (!d) return; const dx = ev.clientX - d.x, dy = ev.clientY - d.y; d.x = ev.clientX; d.y = ev.clientY; d.mov += Math.abs(dx) + Math.abs(dy);
      const k = this.c.dist * 0.0011; this.c.x = lim(this.c.x - dx * k, -SW * 1.6, SW * 1.6); this.c.z = lim(this.c.z - dy * k * 1.5, -30, 30); this.libre = performance.now() + 4000;
    });
    const fin = () => { d = null; }; cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  }
  resize() { const w = this.host.clientWidth || innerWidth, h = this.host.clientHeight || innerHeight; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }

  /* ---------- escena fija ---------- */
  construirSuelo() {
    const g = new THREE.PlaneGeometry(420, 300, 70, 50); g.rotateX(-Math.PI / 2); const p = g.attributes.position, w = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) * Math.cos(z * 0.09 + x * 0.03); w[i * 3] = 1 - n * 0.4; w[i * 3 + 1] = Math.max(0, n * 0.25 - 0.05); w[i * 3 + 2] = 0; }
    this.suelo = new THREE.Mesh(g, applyGround(g, w, 0.09)); this.scene.add(this.suelo);
    this.rasgos = new THREE.Group(); this.scene.add(this.rasgos);
  }
  pintaRasgos(e) {
    if (!this.rasgos || !e) return; const clave = e.sectores.map(s => s.rasgo.tipo).join(); if (clave === this.claveRasgos) return; this.claveRasgos = clave;
    while (this.rasgos.children.length) this.rasgos.remove(this.rasgos.children[0]);
    e.sectores.forEach((s, i) => {
      const t = s.rasgo.tipo, x = (i - 1) * SW;
      if (t === 'vado' || t === 'rio' || t === 'puente') { const m = new THREE.Mesh(new THREE.PlaneGeometry(t === 'vado' ? 9 : 6, 140), new THREE.MeshBasicMaterial({ color: '#4f8fb5', transparent: true, opacity: 0.8 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, 0); this.rasgos.add(m); }
      else if (t === 'cerro' || t === 'bosque') { const m = new THREE.Mesh(new THREE.CircleGeometry(SW * 0.55, 24), new THREE.MeshBasicMaterial({ color: t === 'cerro' ? '#b9a566' : '#2f5a2c', transparent: true, opacity: 0.35 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, 0); this.rasgos.add(m); }
    });
  }

  /* ---------- estado y sucesos que llegan de la pantalla 2D ---------- */
  estado(e, opt) {
    const antesP = this.opt.pausa; this.e = e; if (!this.pre) this.carga(e); this.opt = { corre: !!opt.corre, pausa: opt.pausa || null, ms: opt.ms || 2000 };
    if (e.t !== this.simT) { this.simT = e.t; this.subT = 0; }
    if (!this.opt.corre && this.opt.pausa && this.opt.pausa !== antesP) { const p = this.opt.pausa; if (p.sector != null && p.tipo !== 'inicio' && p.tipo !== 'manual') { this.libre = 0; this.foco = { s: p.sector, hasta: 1e12 }; } else this.foco = null; }
    if (this.opt.corre) this.foco = null;
    if (this.listo) this.sincroniza();
  }
  sucesos(lista) { for (const s of lista || []) { if (s.sector != null && s.sector >= 0 && s.sector < 3) this.act[s.sector] += ['linea', 'roto', 'carga', 'rodeoLlega', 'bolsa', 'generalCae', 'huye', 'cae'].indexOf(s.tipo) >= 0 ? 3 : 1; if (s.tipo === 'carga' && s.reg && this.G.get(s.reg)) this.G.get(s.reg).cargaHasta = this.e ? this.e.t + 6 : 0; } }

  /* crea o actualiza los grupos de figuras según el estado */
  sincroniza() {
    const e = this.e; this.pintaRasgos(e);
    const claves = new Set(), ver = r => ['frente', 'apoyo', 'rodeo', 'marcha', 'huido', 'caido'].indexOf(r.lugar) >= 0;
    for (const id in e.regs) { const r = e.regs[id]; if (r.tipo) claves.add(r.tipo + '|' + r.bando); }
    for (const k of claves) if (!this.mesh.has(k)) this.nuevaMalla(k, e);
    for (const id in e.regs) {
      const r = e.regs[id]; let g = this.G.get(id);
      if (!g) { if (!ver(r) || r.lugar === 'huido' || r.lugar === 'caido' || r.n <= 0) continue; g = this.nuevoGrupo(r); if (!g) continue; }
      g.r = r;
      const F = r.lugar === 'caido' ? 0 : r.lugar === 'huido' ? g.nv : Math.max(r.n > 0 ? 3 : 0, Math.round(g.F0 * r.n / Math.max(1, r.n0)));
      while (g.nv > F) this.mata(g);
    }
  }
  nuevaMalla(k, e) {
    const [tipo, b] = k.split('|'), u = getUnit(tipo); if (!u) { this.mesh.set(k, null); return; }
    let cap = 0; for (const id in e.regs) { const r = e.regs[id]; if (r.tipo === tipo && r.bando === +b) cap += NFIG(r.cls, r.n0); }
    cap += DEAD; const col = +b ? '#5b3a8c' : '#b3261e', geo = instancedGeometry(u, cap), m = new THREE.InstancedMesh(geo, unitMaterialReal(u, col), cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; this.scene.add(m);
    const lm = new THREE.InstancedMesh(lightGeometry(u, col), lightMaterial(), cap); lm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lm.frustumCulled = false; lm.count = 0; this.scene.add(lm);
    this.mesh.set(k, { u, m, a: geo.attributes.aFrame.array, M: m.instanceMatrix.array, lm, LM: lm.instanceMatrix.array, i: 0, li: 0, dead: [], cap });
  }
  nuevoGrupo(r) {
    const ms = this.mesh.get(r.tipo + '|' + r.bando); if (!ms) return null;
    const F = NFIG(r.cls, r.n0), g = { id: r.id, r, ms, F0: F, nv: F, f: FORMA(r.cls), x: new Float32Array(F), z: new Float32Array(F), yaw: new Float32Array(F), ph: new Float32Array(F), cargaHasta: 0, primera: true };
    for (let j = 0; j < F; j++) g.ph[j] = hash(j * 3.1 + r.id.length * 7 + (r.id.charCodeAt(r.id.length - 1) || 0)) * 4;
    this.G.set(r.id, g); g.nuevo = true; return g;
  }
  mata(g) { const j = g.nv - 1; if (j < 0) return; g.nv--; const d = g.ms.dead; d.push({ x: g.x[j], z: g.z[j], yaw: g.yaw[j], t0: this.t }); if (d.length > DEAD) d.shift(); }

  /* ---------- sitio de cada bloque (calculado cada cuadro: así sigue la línea) ---------- */
  sitio(g, tSim) {
    const e = this.e, r = g.r, b = r.bando, sg = b === 0 ? 1 : -1, f = g.f, cols = Math.min(f.cols, Math.max(1, g.nv)), rows = Math.ceil(g.nv / cols), prof = rows * f.sz;
    const o = { cx: 0, cz: 0, fz: -sg, modo: 'quieto', ancho: 1 };
    const sec = r.sector != null ? e.sectores[r.sector] : null, desv = sec ? -sec.linea * MORDIDA : 0;
    if (r.lugar === 'frente' || r.lugar === 'apoyo') {
      const fil = sec.filas[b][r.lugar], i = Math.max(0, fil.indexOf(r.id)), n = Math.max(1, fil.length), cx = (r.sector - 1) * SW + ((i + 0.5) / n - 0.5) * SW * 0.94;
      const enemigo = sec.filas[1 - b].frente.length > 0, lucha = enemigo && this.opt.corre && !e.fin;
      let cz;
      if (r.lugar === 'frente') cz = sg * (0.9 + prof / 2); else cz = sg * (0.9 + 7 + 2.2 + prof / 2);
      if (r.golpeHasta > tSim && r.golpeMul > 1 && r.lugar === 'frente') { cz = -sg * (0.9 + 7 + 3 + prof / 2); o.fz = sg; o.modo = 'espalda'; }   // rodeo recién llegado: por la espalda del enemigo
      o.cx = cx; o.cz = cz + desv; o.lucha = lucha && r.lugar === 'frente'; o.tira = lucha && r.lugar === 'apoyo' && r.cls === 'rng';
      if (o.modo === 'espalda') o.lucha = lucha;
      if (g.cargaHasta > tSim && lucha) { o.carga = true; o.cz += o.fz * 1.2; }
      o.huye = r.animo >= 3;
    } else if (r.lugar === 'rodeo') {
      const p = e.programados.find(q => q.reg === r.id && q.tipo === 'rodeo'); const dest = p ? p.sector : 1, org = p ? p.origen : 1;
      const dir = dest === 0 ? -1 : dest === 2 ? 1 : (org === 0 ? -1 : 1), fx = dir * (SW * 1.5 + 12), k = p ? lim(1 - (p.en - tSim) / 20, 0, 1) : 0.5;
      const ox = (org - 1) * SW, oz = sg * (0.9 + prof / 2), dz = -sg * 30, dx = (dest - 1) * SW;
      const P = [[ox, oz], [fx, sg * 6], [fx, dz], [dx, dz]], seg = Math.min(2, Math.floor(k * 3)), u = k * 3 - seg;
      o.cx = P[seg][0] + (P[seg + 1][0] - P[seg][0]) * u; o.cz = P[seg][1] + (P[seg + 1][1] - P[seg][1]) * u; o.modo = 'marcha'; o.corre = true; o.fz = P[seg + 1][1] > P[seg][1] ? 1 : -1; o.ejeX = P[seg + 1][0] !== P[seg][0] && seg !== 1; o.dirx = Math.sign(P[seg + 1][0] - P[seg][0]);
    } else if (r.lugar === 'marcha') {
      const p = e.programados.find(q => q.reg === r.id && q.tipo === 'mover'); const dest = p ? p.sector : 1, org = p ? p.origen : 1, k = p ? lim(1 - (p.en - tSim) / 10, 0, 1) : 0.5;
      o.cx = ((org - 1) + (dest - org) * k) * SW; o.cz = sg * (0.9 + 7 + 2.2 + prof / 2); o.modo = 'marcha'; o.ejeX = true; o.dirx = Math.sign(dest - org);
    } else if (r.lugar === 'huido') { o.modo = 'huida'; o.cx = g.cx0 == null ? 0 : g.cx0; o.cz = sg * 90; o.corre = true; o.fz = sg; }
    return o;
  }

  /* ---------- cuadro ---------- */
  bucle(t) {
    if (this.muerto) return; this.raf = requestAnimationFrame(tt => this.bucle(tt));
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - this.last) / 1000); this.last = ahora; this.t += dt;
    this.nf++; if (ahora - this.t0 >= 1000) { this.fps = this.nf * 1000 / (ahora - this.t0); this.info.fps = Math.round(this.fps * 10) / 10; this.nf = 0; this.t0 = ahora; this.adapta(); }
    if (this.opt.corre) this.subT = Math.min(DT, this.subT + dt * DT / Math.max(0.2, this.opt.ms / 1000));
    if (this.listo && this.e) this.cuadro(dt);
    this.camara(dt); this.r.render(this.scene, this.cam);
  }
  adapta() {   // si va lento, baja la resolución y luego el tope de figuras reales
    if (this.fps < 22) this.lenta++; else this.lenta = Math.max(0, this.lenta - 1);
    if (this.lenta >= 3) { this.lenta = 0; if (this.pr > 1) { this.pr = 1; this.r.setPixelRatio(1); this.resize(); } else this.topeReal = Math.max(40, (this.topeReal || CAP_REAL) * 0.7); }
  }
  camara(dt) {
    const e = this.e, now = performance.now(); let tx = 0, tz = 0, td = 50;
    if (e) {
      let s = 1;
      if (this.foco) { s = this.foco.s; td = 28; }
      else { let m = 0, wsum = 0, xs = 0; for (let i = 0; i < 3; i++) { this.act[i] *= Math.exp(-dt * 0.18); const w = this.act[i] + 0.15 + (e.sectores[i].filas[0].frente.length ? 0.2 : 0); wsum += w; xs += w * (i - 1); m = Math.max(m, this.act[i]); } const g = e.bandos[0].general; s = wsum ? xs / wsum + 1 : 1; if (m < 1 && g && g.vivo) s = 0.5 * s + 0.5 * g.sector; td = lim(40 - m * 1.5, 30, 40); }
      tx = (s - 1) * SW * (this.foco ? 1 : 0.85); const sec = e.sectores[lim(Math.round(s), 0, 2)]; tz = this.foco ? -sec.linea * MORDIDA : -sec.linea * MORDIDA * 0.5;
    }
    if (now > this.libre) { const k = 1 - Math.exp(-dt * (this.foco ? 2.6 : 1.2)); this.c.x += (tx - this.c.x) * k; this.c.z += (tz - this.c.z) * k; this.c.dist += (td - this.c.dist) * k; }
    const d = this.c.dist, p = this.pitch;
    this.cam.position.set(this.c.x, d * Math.sin(p), this.c.z + d * Math.cos(p)); this.cam.lookAt(this.c.x, 0, this.c.z - 2);
  }
  cuadro(dt) {
    const e = this.e, tSim = e.t + this.subT, grupos = [...this.G.values()]; let n = 0;
    // posición de las figuras
    const FX = this.FX || (this.FX = []), L = FX; L.length = 0;
    for (const g of grupos) {
      const r = g.r, o = this.sitio(g, tSim), ms = g.ms, f = g.f, cols = Math.min(f.cols, Math.max(1, g.nv)), rows = Math.ceil(g.nv / cols);
      if (r.lugar === 'huido' || r.lugar === 'caido') { if (g.nv && r.lugar === 'huido' && g.cx0 == null) { let sx = 0; for (let j = 0; j < g.nv; j++) sx += g.x[j]; g.cx0 = sx / g.nv; } if (r.lugar === 'caido') while (g.nv) this.mata(g); }
      else g.cx0 = null;
      const ang = o.fz > 0 ? 0 : Math.PI;
      let vivos = 0;
      for (let j = 0; j < g.nv; j++) {
        const c = j % cols, row = Math.floor(j / cols), inRow = row === rows - 1 ? g.nv - row * cols : cols;
        const lx = (c - (inRow - 1) / 2) * f.sx + (hash(j * 7.3 + r.id.length) - 0.5) * 0.4, lf = ((rows - 1) / 2 - row) * f.sz + (hash(j * 3.9 + r.id.charCodeAt(r.id.length - 1)) - 0.5) * 0.4;
        let tx = o.cx + lx, tz = o.cz + o.fz * lf;
        if (o.lucha && row < 2) { const ph = j * 2.3 + g.ph[j]; tx += Math.sin(this.t * 1.7 + ph) * 0.3; tz += o.fz * (0.5 + Math.cos(this.t * 1.3 + ph) * 0.3); }
        if (o.huye) tz -= o.fz * (3 + row);
        if (g.primera) { g.x[j] = tx; g.z[j] = tz; }
        const dx = tx - g.x[j], dz = tz - g.z[j], d = Math.hypot(dx, dz), mv = d > 0.15, vel = (o.corre || o.carga || (r.cargando && o.lucha) || d > 9) ? V_CORRE : V_ANDA;
        if (mv) { const st = Math.min(d, vel * dt * (o.modo === 'huida' ? 1 : 1)); g.x[j] += dx / d * st; g.z[j] += dz / d * st; }
        let yaw = mv && d > 0.8 ? Math.atan2(dx, dz) : ang; if (o.modo === 'huida') yaw = o.fz > 0 ? 0 : Math.PI;
        g.yaw[j] += Math.atan2(Math.sin(yaw - g.yaw[j]), Math.cos(yaw - g.yaw[j])) * Math.min(1, dt * 8);
        if (g.primera) g.yaw[j] = ang;
        const cl = ms.u.clips, ph = g.ph[j];
        let clip;
        if (o.modo === 'huida' || o.huye && mv) clip = cl.run || cl.walk; else if (mv && d > 0.3) clip = vel === V_CORRE && cl.run ? cl.run : cl.walk;
        else if (o.lucha && row < 2) clip = (j % 2 && cl.attack_melee2) || cl.attack_melee || cl.attack_ranged || cl.idle;
        else if (o.tira) clip = cl.attack_ranged || cl.attack_melee || cl.idle; else clip = cl.idle;
        if (o.modo === 'huida' && Math.abs(g.z[j]) > 60) continue;           // ya salió del campo
        L.push(ms, g.x[j], g.z[j], g.yaw[j], frameOf(clip, this.t + ph)); vivos++;
      }
      g.primera = false;
      if (r.lugar === 'huido' && !vivos && g.nv) while (g.nv) g.nv--;
    }
    // caídos (se quedan en el suelo)
    for (const ms of new Set(grupos.map(g => g.ms))) for (const dd of ms.dead) { const dc = ms.u.clips.death; L.push(ms, dd.x, dd.z, dd.yaw, frameOnce(dc, this.t - dd.t0)); }
    // nivel de detalle: las figuras reales más cercanas a la cámara; el resto, ligeras
    const N = L.length / 5, cp = this.cam.position, d2 = this.D2 && this.D2.length >= N ? this.D2 : (this.D2 = new Float32Array(N + 64)); const tope = this.topeReal || CAP_REAL;
    for (let i = 0; i < N; i++) { const x = L[i * 5 + 1] - cp.x, z = L[i * 5 + 2] - cp.z; d2[i] = x * x + cp.y * cp.y + z * z; }
    let umbral = Infinity; if (N > tope) { const s = Float32Array.from(d2.subarray(0, N)).sort(); umbral = s[tope - 1]; }
    for (const ms of this.mesh.values()) if (ms) { ms.i = 0; ms.li = 0; }
    let reales = 0; const k = UNIT_SCALE;
    for (let i = 0; i < N; i++) {
      const ms = L[i * 5], x = L[i * 5 + 1], z = L[i * 5 + 2], yaw = L[i * 5 + 3], fr = L[i * 5 + 4], real = (d2[i] <= umbral || ms.u.wide) && ms.i < ms.cap, c = Math.cos(yaw) * k, s = Math.sin(yaw) * k;
      const M = real ? ms.M : ms.LM, o = (real ? ms.i : ms.li) * 16; if ((real ? ms.i : ms.li) >= ms.cap) continue;
      M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = k; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = 0; M[o + 14] = z; M[o + 15] = 1;
      if (real) { ms.a[ms.i] = fr; ms.i++; reales++; } else ms.li++;
    }
    for (const ms of this.mesh.values()) if (ms) { ms.m.count = ms.i; ms.lm.count = ms.li; ms.m.instanceMatrix.needsUpdate = true; ms.lm.instanceMatrix.needsUpdate = true; ms.m.geometry.attributes.aFrame.needsUpdate = true; }
    this.info.figuras = N; this.info.reales = reales; this.info.ligeras = N - reales;
  }

  cerrar() {
    this.muerto = true; cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize);
    try { this.scene.traverse(o => { if (o.geometry && o.isInstancedMesh) o.geometry.dispose(); }); this.r.dispose(); this.r.forceContextLoss(); } catch (e) { /* ya liberado */ }
    if (this.cv.parentNode) this.cv.remove(); ctxN--; if (window.AQ_CHOQUE3D === this.info) window.AQ_CHOQUE3D = null;
  }
}
Choque3D.disponible = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
