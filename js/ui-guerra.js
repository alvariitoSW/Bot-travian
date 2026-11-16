/* AQVILA — GC4: la pantalla de la batalla (la Guerra). Dibuja lo que dice el motor js/guerra.js con los soldados y el suelo del juego.
   Sale de la maqueta gobierno/maquetas/guerra-cero (GC1) sin cambiar cómo se juega: tres cuerpos, cuatro órdenes, «Retirarse» siempre arriba.
   Uso: UIGuerra.abrir(cfg, alTerminar). cfg = { estado } (un estado de Guerra.crear o de Guerra.cargar) y, si se quiere guardar a mitad,
        guardar(estado) (se llama cada pocos segundos, al pausar y al salir de la app). alTerminar(r) recibe Guerra.resumen(estado).
   Las vistas gfx son módulos: se cargan con import() al abrir. Arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0). */
(function (root) {
  'use strict';
  let activa = null;
  const HTML = `
<canvas id="gu-lienzo"></canvas>
<div id="gu-hud">
  <div id="gu-pendones"></div>
  <div id="gu-cinta"></div>
  <button id="gu-retirar" type="button"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 5h12l-3 4 3 4H5"/></svg>Retirarse</button>
  <div id="gu-mando" hidden>
    <div id="gu-cuerpos"></div>
    <div id="gu-ordenes">
      <button class="orden" data-o="empujar" type="button"><svg viewBox="0 0 24 24"><path d="M5 19L18 6M18 6h-5M18 6v5M4 14l6 6M7 17l-3 3"/></svg><span class="que">Empujar</span><span class="sub">pega más, cansa</span></button>
      <button class="orden" data-o="aguantar" type="button"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg><span class="que">Aguantar</span><span class="sub">menos bajas</span></button>
      <button class="orden" data-o="relevo" type="button"><svg viewBox="0 0 24 24"><path d="M7 20V6M7 6l-3.5 3.5M7 6l3.5 3.5M17 4v14M17 18l-3.5-3.5M17 18l3.5-3.5"/></svg><span class="que">Relevo</span><span class="sub">línea fresca</span></button>
      <button class="orden" data-o="caballeria" type="button"><span class="glifo">♞</span><span class="que">Caballería</span><span class="sub">carga al flanco</span></button>
    </div>
  </div>
  <div id="gu-salir" class="velo" hidden>
    <h1>¿Retirarse?</h1>
    <p>La legión sale del campo en orden. La batalla se da por perdida.</p>
    <div class="fila"><button class="gordo b" id="gu-salir-no" type="button">Seguir luchando</button><button class="gordo" id="gu-salir-si" type="button">Sí, retirarse</button></div>
  </div>
  <div id="gu-fin" class="velo" hidden>
    <h1 id="gu-fin-t"></h1>
    <p id="gu-fin-p"></p>
    <div class="cifras" id="gu-fin-c"></div>
    <div class="fila"><button class="gordo" id="gu-seguir" type="button">Ver el resultado</button></div>
    <div class="creditos">Soldados y texturas de 0 A.D. (Wildfire Games, CC BY-SA 3.0)</div>
  </div>
  <div id="gu-carga" class="velo"><h1>AQVILA</h1><p id="gu-carga-p">Formando la legión…</p><div class="fila" id="gu-carga-s" hidden><button class="gordo b" id="gu-carga-no" type="button">Volver</button></div><div class="creditos">Soldados y texturas de 0 A.D. (Wildfire Games, CC BY-SA 3.0)</div></div>
</div>`;

  function cerrar() { if (activa) { const a = activa; activa = null; try { a.cerrar(); } catch (e) { /* ya cerrada */ } if (a.el) a.el.remove(); } }

  async function abrir(cfg, alTerminar) {
    cerrar(); cfg = cfg || {};
    if (!cfg.estado) cfg.estado = root.Guerra.crear(cfg);
    const el = document.createElement('div'); el.id = 'gu'; el.innerHTML = HTML; document.body.appendChild(el);
    const a = activa = { el, cerrar: () => {} };
    const $ = id => el.querySelector('#gu-' + id);
    $('carga-no').addEventListener('click', () => { cerrar(); if (alTerminar) alTerminar(root.Guerra.resumen(cfg.estado)); });
    try {
      const [M, U, Gr, St] = await Promise.all([import('./gfx/models.js'), import('./gfx/units.js'), import('./gfx/ground.js'), import('./gfx/statics.js')]);
      if (activa !== a) return;
      const fin = r => { if (activa === a) { activa = null; el.remove(); } if (alTerminar) alTerminar(r); };
      const P = pantalla(M, U, Gr, St, el, $, cfg, fin); a.cerrar = P.cerrarTodo;
    } catch (e) { console.error(e); const p = $('carga-p'); if (p) p.textContent = 'No se ha podido cargar la batalla.'; const s = $('carga-s'); if (s) s.hidden = false; }
    return el;
  }

  function pantalla(M, U, Gr, St, el, $, cfg, alTerminar) {
    const { THREE } = M, { preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE } = U;
    const { loadGroundTextures, applyGround, crearCielo, texturaRuido } = Gr, { preloadStatic, staticInstances } = St, R = root.Guerra;
    const S = 9, FILAS = 7, PASO = 1.15, HUECO = 2.4, CAMPO = 7; let porFig = 8.6;      // medidas del campo, en metros de juego
    const COLOR = ['#b3261e', '#5b3a8c'];
    const nombreTropa = t => (root.DATA && root.DATA.UNITS && root.DATA.UNITS[t] && root.DATA.UNITS[t].n) || t;
    const xs = i => (i - 1) * S;

    /* ---------- escena ---------- */
    const lienzo = $('lienzo');
    const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    let dpr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const escena = new THREE.Scene(), HORIZ = '#d9d2b8';
    escena.fog = new THREE.Fog(HORIZ, 90, 520);
    const camara = new THREE.PerspectiveCamera(50, 1, 0.5, 12000);
    escena.add(new THREE.HemisphereLight('#cfe2ff', '#7a6238', 1.3));
    const sol = new THREE.DirectionalLight('#ffe6b8', 3.0); sol.position.set(-90, 95, 60); escena.add(sol);

    let ancho = 0, alto = 0, vertical = true;
    function medir() {
      ancho = window.innerWidth; alto = window.innerHeight; vertical = alto > ancho;
      renderer.setSize(ancho, alto, false); camara.aspect = ancho / alto; camara.fov = vertical ? 54 : 40; camara.updateProjectionMatrix();
    }
    window.addEventListener('resize', medir); medir();
    const salidas = [() => window.removeEventListener('resize', medir)];   // lo que hay que soltar al cerrar

    /* ---------- estado ---------- */
    let B = null, figs = [], lineas = new Map(), mallas = new Map(), sombras = null, cab = [], num = [], T = 0, nEv = 0, sel = 1, pausa = false, lista = false;
    let foco = { i: -1, hasta: 0, ultimo: -99 }, cintaHasta = 0, tocado = false, temblor = 0;
    const cam = { x: 0, y: 0, z: 6, d: 80, p: 0.6, a: 0 };
    const estand = [], pend = [], polvoN = 150; let polvo = null, marca = null;

    function figura(key, lado, x, z) { const f = { key, lado, x, z, tx: x, tz: z, yaw: lado === 0 ? Math.PI : 0, ph: Math.random() * 5, est: 0, t0: 0, ataca: false, corre: false, idx: figs.length }; figs.push(f); return f; }

    function montar(estado, retomada) {
      B = estado; figs = []; lineas = new Map(); cab = []; num = []; nEv = 0; T = 0; sel = 1; foco = { i: -1, hasta: 0, ultimo: -99 }; tocado = false;
      let maxL = 1; for (const s of B.sect) for (const c of s.c) for (const l of c.lineas) maxL = Math.max(maxL, l.max);
      porFig = Math.max(1, Math.min(8.6, maxL / 12), maxL / 30);   // pocas figuras en un ejército pequeño; tope por línea en uno grande
      for (const s of B.sect) for (const c of s.c) for (const l of c.lineas) {
        const n = Math.max(1, Math.round(l.max / porFig)), lv = { c, fs: [] }; lineas.set(l, lv);
        for (let k = 0; k < n; k++) lv.fs.push(figura(l.tipo, c.lado, xs(s.i), (c.lado === 0 ? 1 : -1) * 16));
      }
      const mayor = comp => Object.keys(comp || {}).sort((a, b) => comp[b] - comp[a])[0];
      const tCab = mayor(B.cab.comp) || 'equites', tNum = mayor(B.num.comp) || 'numidas';
      for (let k = 0; k < 8; k++) { if (B.cab.h0 > 0) cab.push(figura(tCab, 0, (k % 4 - 1.5) * 1.9, 27 + Math.floor(k / 4) * 2.2)); if (B.num.h0 > 0) num.push(figura(tNum, 1, (k % 4 - 1.5) * 1.9 + 48, -110 - Math.floor(k / 4) * 2.2)); }
      colocar(0, true);
      if (retomada) { colocar(0, false); for (const f of figs) if (f.est === 1 || f.est === 3) f.est = 2; }   // una batalla retomada: los caídos y los que huyeron ya no están
      /* una malla por tipo de tropa: todos sus soldados en una sola llamada */
      for (const m of mallas.values()) { escena.remove(m.malla); m.malla.geometry.dispose(); } mallas.clear();
      const cuenta = {}; for (const f of figs) { const id = f.key + f.lado; f.slot = cuenta[id] = (cuenta[id] || 0) + 1; f.slot--; }
      for (const id in cuenta) {
        const key = id.slice(0, -1), lado = +id.slice(-1), u = getUnit(key); if (!u) continue;
        const g = instancedGeometry(u, cuenta[id]), malla = new THREE.InstancedMesh(g, unitMaterialReal(u, COLOR[lado]), cuenta[id]); malla.frustumCulled = false; escena.add(malla);
        mallas.set(id, { malla, fr: g.attributes.aFrame, u });
      }
      if (sombras) { escena.remove(sombras); sombras.geometry.dispose(); }
      sombras = new THREE.InstancedMesh(new THREE.CircleGeometry(0.62, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1a1408', transparent: true, opacity: 0.3, depthWrite: false }), figs.length); sombras.frustumCulled = false; sombras.renderOrder = 1; escena.add(sombras);
      for (const f of figs) { f.x = f.tx; f.z = f.tz; }
      nEv = B.eventos.length; pintarCartas(true);
    }

    /* ---------- dónde debe estar cada soldado ---------- */
    const zFrente = s => -s.frente * CAMPO;
    function colocar(dt, inicio) {
      const hueco = B.fase === 'marcha' ? 22 * (1 - B.t / R.T_MARCHA) : 0, vistas = new Set();
      for (const s of B.sect) for (const c of s.c) {
        const dir = c.lado === 0 ? 1 : -1, rival = s.c[1 - c.lado];
        const r = B.resultado, vencido = r && (r.como === 'victoria') === (c.lado === 1);                 // al acabar, el bando vencido deja el campo
        if (c.roto || vencido) { for (const [l, lv] of lineas) if (lv.c === c) { huir(lv.fs, dir, !c.roto && r && r.como === 'retirada'); lv.fs = []; } continue; }
        /* el vencedor de su duelo se vuelve contra el costado del vecino */
        let fl = null; if (rival.roto && c.libre <= 0) { const o = R.vecino(B, s.i, 1 - c.lado); if (o && o !== s) { const sg = Math.sign(xs(s.i) - xs(o.i)); fl = { sg, x: xs(o.i) + sg * (FILAS * PASO / 2 + 0.9), z: zFrente(o) - dir * 3.4 }; } }
        const lucha = B.fase === 'lucha' && c.relevo <= 0 && (!rival.roto || fl);
        let d = 0.8 + hueco / 2;
        c.lineas.forEach((l, k) => {
          const lv = lineas.get(l); if (!lv) return; vistas.add(lv);
          const quiere = l.hombres <= 0 ? 0 : Math.max(1, Math.round(l.hombres / porFig));
          while (!inicio && lv.fs.length > quiere) { const j = Math.floor(Math.random() * Math.min(FILAS, lv.fs.length)), f = lv.fs.splice(j, 1)[0]; f.est = 1; f.t0 = T; }
          const n = lv.fs.length, rs = k === 0 && c.postura === 'empujar' ? 1.0 : 1.25, filas = Math.ceil(n / FILAS);
          lv.fs.forEach((f, j) => {
            const r = Math.floor(j / FILAS), col = j % FILAS, enFila = Math.min(FILAS, n - r * FILAS), lx = (col - (enFila - 1) / 2) * PASO, lz = d + r * rs;
            if (fl) { f.tx = fl.x + fl.sg * (lz - 0.8); f.tz = fl.z + lx; f.cara = -fl.sg * Math.PI / 2; }
            else { f.tx = xs(s.i) + lx; f.tz = zFrente(s) + dir * lz; f.cara = c.lado === 0 ? Math.PI : 0; }
            f.ataca = lucha && k === 0 && r < (c.postura === 'empujar' ? 2 : 1) && (c.postura === 'empujar' || Math.sin(T * 0.8 + f.ph * 3) > 0.1);
          });
          d += filas * rs + HUECO;
        });
        c.fondo = d;
      }
      for (const [l, lv] of lineas) if (!vistas.has(lv) && lv.fs.length && !lv.c.roto) { huir(lv.fs, lv.c.lado === 0 ? 1 : -1, true); lv.fs = []; }   // línea deshecha: se retira
      jinetes();
    }
    function huir(fs, dir, orden) { for (const f of fs) { f.est = 3; f.tx = f.x + (Math.random() - 0.5) * (orden ? 3 : 14); f.tz = dir * (orden ? 34 : 75); f.ataca = false; } }

    function jinetes() {
      const c = B.cab, lado = i => i === 0 ? -1 : 1;
      cab.forEach((f, k) => {
        const ox = (k % 4 - 1.5) * 1.7, oz = Math.floor(k / 4) * 2;
        if (c.estado === 'yendo' || c.estado === 'cargando') {
          const s = B.sect[c.sect], sg = lado(c.sect), zf = zFrente(s), xg = xs(c.sect) + sg * (S / 2 + (c.sect === 1 ? 0 : 1.5));
          if (f.z > zf + 7 && Math.abs(f.x - xg) > 1.5 + Math.abs(ox)) { f.tx = xg + ox * 0.5; f.tz = zf + 5 + oz; }           // primero rodean por el hueco, sin pisar a los suyos
          else { f.tx = xs(c.sect) + sg * (3.6 + (k % 4) * 0.5); f.tz = zf - 1.5 - (k % 4) * 0.9 - oz * 0.6; }
          f.ataca = c.estado === 'cargando'; f.corre = true; f.cara = -sg * Math.PI / 2;
        } else { f.tx = ox; f.tz = 27 + oz; f.ataca = false; f.corre = c.estado === 'volviendo'; f.cara = Math.PI; }
      });
      const n = B.num;
      num.forEach((f, k) => {
        const ox = (k % 4 - 1.5) * 1.7, oz = Math.floor(k / 4) * 2;
        if (n.estado === 'llega' || n.estado === 'hostiga') {
          const s = B.sect[n.sect], sg = lado(n.sect), zf = zFrente(s), xg = xs(n.sect) + sg * (S / 2 + 3);
          if (f.z < zf - 4 && Math.abs(f.x - xg) > 2 + Math.abs(ox)) { f.tx = xg + ox * 0.4; f.tz = zf - 3 + oz; }
          else { const a = T * 0.9 + k * 0.785; f.tx = xg + Math.cos(a) * 1.6 - sg * 0.5; f.tz = zf + 5 + Math.sin(a) * 3.2; }      // caracolean junto al costado romano
          f.ataca = n.estado === 'hostiga' && k % 2 === 0; f.corre = true; f.cara = -sg * Math.PI / 2;
        } else { const sg = n.sect === 0 ? -1 : 1; f.tx = sg * (S * 1.5 + 34) + ox; f.tz = -110 - oz; f.ataca = false; f.corre = true; f.cara = 0; }
      });
    }

    /* ---------- mover y animar ---------- */
    function mover(dt) {
      for (const f of figs) {
        if (f.est === 1 || f.est === 2) continue;
        const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz), montado = f.key === 'equites' || f.key === 'numidas';
        const corre = f.est === 3 || f.corre || d > 7, v = montado ? (corre ? 12 : 4) : (corre ? 6.2 : B.fase === 'marcha' ? 1.75 : 3.4);
        f.mueve = d > 0.12; f.rapido = corre && f.mueve;
        if (f.mueve) { const p = Math.min(d, v * dt); f.x += dx / d * p; f.z += dz / d * p; }
        const quiere = d > 0.7 ? Math.atan2(dx, dz) : (f.cara !== undefined ? f.cara : f.yaw); let g = quiere - f.yaw; g = Math.atan2(Math.sin(g), Math.cos(g)); f.yaw += g * Math.min(1, dt * 7);
        if (f.est === 3 && Math.abs(f.z) > (Math.abs(f.tz) - 1)) f.est = 2;
      }
    }
    const M4 = new THREE.Matrix4();
    function pintarFiguras() {
      const sm = sombras.instanceMatrix.array;
      for (const f of figs) {
        const m = mallas.get(f.key + f.lado); if (!m) continue; const C = m.u.clips, o = f.slot * 16, a = m.malla.instanceMatrix.array;
        let sc = UNIT_SCALE, fr;
        if (f.est === 2) sc = 0;
        else if (f.est === 1) { const t = T - f.t0; fr = frameOnce(C.death, t); if (t > 16) f.est = 2; else if (t > 14) sc *= (16 - t) / 2; }
        else if (f.mueve) fr = frameOf(f.rapido ? C.run : C.walk, T + f.ph);
        else if (f.ataca) fr = frameOf(C.attack_melee || C.attack_ranged, T + f.ph);
        else fr = frameOf(C.idle, T + f.ph);
        const c = Math.cos(f.yaw) * sc, s = Math.sin(f.yaw) * sc;
        a[o] = c; a[o + 1] = 0; a[o + 2] = -s; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = sc; a[o + 6] = 0; a[o + 7] = 0; a[o + 8] = s; a[o + 9] = 0; a[o + 10] = c; a[o + 11] = 0; a[o + 12] = f.x; a[o + 13] = 0; a[o + 14] = f.z; a[o + 15] = 1;
        m.fr.array[f.slot] = fr || 0;
        const q = f.idx * 16, e = f.est === 0 || f.est === 3 ? (f.key === 'equites' || f.key === 'numidas' ? 1.5 : 1) : 0;
        sm[q] = e; sm[q + 1] = 0; sm[q + 2] = 0; sm[q + 3] = 0; sm[q + 4] = 0; sm[q + 5] = 1; sm[q + 6] = 0; sm[q + 7] = 0; sm[q + 8] = 0; sm[q + 9] = 0; sm[q + 10] = e; sm[q + 11] = 0; sm[q + 12] = f.x; sm[q + 13] = 0.03; sm[q + 14] = f.z; sm[q + 15] = 1;
      }
      for (const m of mallas.values()) { m.malla.instanceMatrix.needsUpdate = true; m.fr.needsUpdate = true; }
      sombras.instanceMatrix.needsUpdate = true;
    }

    /* ---------- campo: suelo, cielo, árboles, estandartes, polvo ---------- */
    function campo() {
      const rnd = (() => { let s = 99; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
      const g = new THREE.PlaneGeometry(900, 900, 90, 90).rotateX(-Math.PI / 2), P = g.attributes.position, W = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), z = P.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.06 - 0.4) + 0.25 * Math.sin(x * 0.13 + z * 0.09);
        const pis = 0.55 * Math.exp(-(z * z) / 190) * Math.exp(-(x * x) / 2200);                       // tierra pisada donde se lucha
        W[i * 3] = Math.max(0, Math.min(0.75, 0.3 + 0.4 * n) * (1 - pis)); W[i * 3 + 1] = pis + 0.08 * Math.max(0, Math.sin(x * 0.21) * Math.sin(z * 0.17)); W[i * 3 + 2] = 0;
        const lejos = Math.hypot(x, z); if (lejos > 70) P.setY(i, Math.max(0, (lejos - 70) * 0.05 * (0.5 + 0.5 * Math.sin(x * 0.021 + 2) * Math.cos(z * 0.017))));
      }
      const suelo = new THREE.Mesh(g, applyGround(g, W, 0.09)); escena.add(suelo);
      try { escena.add(crearCielo(sol.position.clone(), HORIZ, { uRuido: { value: texturaRuido() } })); } catch (e) { escena.background = new THREE.Color(HORIZ); console.warn('sin cielo', e); }
      const arboles = { cipres: [], olivo: [], pino: [] }, E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
      for (let k = 0; k < 150; k++) {
        const a = rnd() * Math.PI * 2, r = 42 + rnd() * 150, x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r - 20; if (Math.abs(x) < 34 && z > -34 && z < 60) continue;
        const tipo = rnd() < 0.45 ? 'olivo' : rnd() < 0.6 ? 'cipres' : 'pino', e = UNIT_SCALE * (0.75 + rnd() * 0.6) * (tipo === 'pino' ? 0.8 : 1);
        arboles[tipo].push(new THREE.Matrix4().compose(V.set(x, 0, z), Q.setFromEuler(E.set(0, rnd() * 6.28, 0)), SC.set(e, e, e)));
      }
      for (const t in arboles) { const m = staticInstances(t, arboles[t]); if (m) escena.add(m); }
      /* un estandarte por cuerpo: es lo que se mira para saber cómo va */
      for (let l = 0; l < 2; l++) for (let i = 0; i < 3; i++) {
        const gr = new THREE.Group(), palo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6), new THREE.MeshLambertMaterial({ color: '#6b4a22' })); palo.position.y = 2.3; gr.add(palo);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.35), new THREE.MeshLambertMaterial({ color: l === 0 ? '#c0281d' : '#6a45a8', side: THREE.DoubleSide })); tela.position.y = 3.75; gr.add(tela);
        const orla = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.14), new THREE.MeshLambertMaterial({ color: '#e9c063', side: THREE.DoubleSide })); orla.position.y = 4.5; gr.add(orla);
        escena.add(gr); estand.push({ gr, tela, l, i });
      }
      marca = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })); marca.position.y = 0.05; marca.renderOrder = 2; escena.add(marca);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(polvoN * 3), 3)); pg.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(polvoN), 1));
      polvo = new THREE.Points(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 300 } },
        vertexShader: 'attribute float aV; varying float vA; uniform float uT; void main(){ vA = aV; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uT * (0.6 + aV) / -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vA * 0.5; gl_FragColor = vec4(0.86, 0.78, 0.6, a); }' }));
      polvo.frustumCulled = false; polvo.renderOrder = 3; polvo.userData.p = Array.from({ length: polvoN }, (_, k) => ({ s: k % 3, v: Math.random(), x: Math.random() - 0.5, z: Math.random() - 0.5 })); escena.add(polvo);
      for (let i = 0; i < 3; i++) { const d = document.createElement('div'); d.className = 'pend'; d.innerHTML = '<span></span><i><b></b></i>'; $('pendones').appendChild(d); pend.push(d); }
    }
    function adornos(dt) {
      for (const e of estand) {
        const s = B.sect[e.i], c = s.c[e.l], dir = e.l === 0 ? 1 : -1; e.gr.visible = !c.roto && !(B.resultado && (B.resultado.como === 'victoria') === (e.l === 1));
        const fr = c.lineas[0], lv = lineas.get(fr), filas = lv ? Math.ceil(lv.fs.length / FILAS) : 1, hueco = B.fase === 'marcha' ? 22 * (1 - B.t / R.T_MARCHA) : 0;
        const zz = zFrente(s) + dir * (0.8 + hueco / 2 + filas * 1.25 + 0.5); e.gr.position.x += (xs(e.i) - e.gr.position.x) * 0.2; e.gr.position.z += (zz - e.gr.position.z) * Math.min(1, dt * 3);
        e.gr.rotation.z = Math.sin(T * 1.7 + e.i) * 0.03 + (1 - c.moral) * 0.22 * Math.sin(T * 3 + e.i); e.tela.scale.y = 0.35 + 0.65 * Math.max(0, c.moral); e.tela.position.y = 4.43 - 0.675 * e.tela.scale.y;
      }
      const c = B.sect[sel].c[0]; marca.visible = !c.roto && B.fase !== 'fin';
      if (marca.visible) { const f = c.fondo || 10; marca.scale.set(FILAS * PASO + 1.4, 1, f); marca.position.x = xs(sel); marca.position.z = zFrente(B.sect[sel]) + (B.fase === 'marcha' ? 11 * (1 - B.t / R.T_MARCHA) : 0) + f / 2 + 0.2; marca.material.opacity = 0.16 + 0.07 * Math.sin(T * 4); }
      const P = polvo.geometry.attributes.position.array, A = polvo.geometry.attributes.aV.array; polvo.material.uniforms.uT.value = alto * 1.6;
      polvo.userData.p.forEach((p, k) => {
        const s = B.sect[p.s], vivo = B.fase === 'lucha' && !s.c[0].roto && !s.c[1].roto, fuerza = vivo ? (s.c[0].postura === 'empujar' || s.c[1].postura === 'empujar' ? 1 : 0.5) : 0;
        p.v += dt * 0.28; if (p.v > 1) { p.v = 0; p.x = Math.random() - 0.5; p.z = Math.random() - 0.5; p.f = fuerza; }
        P[k * 3] = xs(p.s) + p.x * (FILAS * PASO + 1); P[k * 3 + 1] = 0.4 + p.v * 3.2; P[k * 3 + 2] = zFrente(s) + p.z * 4; A[k] = (p.f || 0) * Math.sin(p.v * Math.PI);
      });
      polvo.geometry.attributes.position.needsUpdate = true; polvo.geometry.attributes.aV.needsUpdate = true;
    }

    /* ---------- cámara: vista general, y baja sola a donde pasa algo ---------- */
    function camaraMeta() {
      if (foco.i >= 0 && T < foco.hasta && B.fase !== 'fin') { const s = B.sect[foco.i]; return { x: xs(foco.i) * 0.9, y: 1.2, z: zFrente(s) + 1.5, d: vertical ? 30 : 21, p: 0.3, a: (1 - foco.i) * 0.3 + 0.28 }; }
      const tanH = Math.tan(camara.fov * Math.PI / 360) * camara.aspect, medio = S * 1.5 + 1.5;
      if (vertical) return { x: 0, y: 0, z: 7, d: Math.max(46, medio * 1.04 / tanH), p: 0.4, a: 0 };
      return { x: 0, y: 0, z: 4.5, d: Math.max(40, medio * 1.25 / tanH), p: 0.4, a: 0 };
    }
    function moverCamara(dt, ya) {
      const m = camaraMeta(), k = ya ? 1 : 1 - Math.exp(-dt * 2.4); for (const q in m) cam[q] += (m[q] - cam[q]) * k;
      temblor = Math.max(0, temblor - dt * 1.6); const tb = temblor * 0.25;
      const cp = Math.cos(cam.p); camara.position.set(cam.x + Math.sin(cam.a) * cp * cam.d + Math.sin(T * 47) * tb, cam.y + Math.sin(cam.p) * cam.d + Math.sin(T * 53) * tb, cam.z + Math.cos(cam.a) * cp * cam.d);
      camara.lookAt(cam.x, cam.y, cam.z);
      if (vertical && !(foco.i >= 0 && T < foco.hasta)) camara.setViewOffset(ancho, alto, 0, -alto * 0.1, ancho, alto); else camara.clearViewOffset();   // deja sitio a los botones de abajo
    }
    function mirar(i, seg, fuerte) { if (!fuerte && (T - foco.ultimo < 7 || (foco.i >= 0 && T < foco.hasta))) return; foco = { i, hasta: T + seg, ultimo: T + seg }; }

    /* ---------- interfaz ---------- */
    const POSTURA = { empujar: '<svg class="post" viewBox="0 0 24 24"><path d="M5 19L18 6M18 6h-5M18 6v5"/></svg>', aguantar: '<svg class="post" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>' };
    const tinte = f => f < 0.45 ? 'var(--verde)' : f < 0.75 ? 'var(--ambar)' : 'var(--rojo)';
    let cartaClave = '';
    function pintarCartas(fuerza) {
      let h = '';
      B.sect.forEach((s, i) => {
        const c = s.c[0], alerta = !c.roto && c.lineas.length > 1 && c.relevo <= 0 && (R.frente(c).fatiga > 0.75 || R.frente(c).hombres < 0.4 * R.frente(c).max) && c.lineas[1].fatiga < 0.5;
        const acoso = (B.num.estado === 'llega' || B.num.estado === 'hostiga') && B.num.sect === i;
        c.alerta = alerta; c.acoso = acoso;
        h += '<button class="cuerpo' + (i === sel ? ' sel' : '') + (c.roto ? ' roto' : '') + (alerta || acoso ? ' alerta' : '') + '" data-i="' + i + '"><span class="nom">' + R.NOMBRE_SECTOR[i] + '</span>' + (c.roto ? '<span class="nom">ha huido</span>' : '<span class="escudos">' + (acoso ? '<span class="acoso">♞</span>' : '') + c.lineas.map(l => '<span class="esc"><b style="height:' + Math.round(100 * l.hombres / l.max) + '%;background:' + tinte(l.fatiga) + '"></b></span>').join('') + '</span><span class="moral"><b style="width:' + Math.round(100 * Math.max(0, c.moral)) + '%"></b></span>') + '</button>';
      });
      if (fuerza || h !== cartaClave) { $('cuerpos').innerHTML = h; cartaClave = h; }
      const c = B.sect[sel].c[0];
      el.querySelectorAll('.orden').forEach(b => {
        const o = b.dataset.o, no = R.puede(B, sel, o), activa = !c.roto && c.postura === o, sub = b.querySelector('.sub');
        b.classList.toggle('activa', activa); b.classList.toggle('no', !!no && !activa);
        b.classList.toggle('pide', !no && ((o === 'relevo' && c.alerta) || (o === 'caballeria' && c.acoso) || (!tocado && B.t > 2 && o === 'empujar')));
        if (o === 'relevo') sub.textContent = c.roto || c.lineas.length < 2 ? 'no queda nadie' : c.relevo > 0 ? 'relevando…' : 'entran ' + nombreTropa(c.lineas[1].tipo);
        if (o === 'caballeria') { const k = B.cab, falta = k.estado === 'yendo' ? k.t + 21 : k.estado === 'cargando' ? k.t + 17 : k.t; sub.textContent = k.estado === 'lista' ? 'carga al flanco' : k.estado === 'volviendo' || k.estado === 'cargando' ? 'vuelve en ' + Math.ceil(falta) + ' s' : 'cargando…'; }
      });
    }
    const V3 = new THREE.Vector3();
    function pintarPendones() {
      B.sect.forEach((s, i) => {
        const e = s.c[1], d = pend[i]; if (e.roto || B.fase === 'fin') { d.hidden = true; return; } d.hidden = false;
        const hueco = B.fase === 'marcha' ? 11 * (1 - B.t / R.T_MARCHA) : 0; V3.set(xs(i), 5.6, zFrente(s) - hueco - (e.fondo || 6) + 1).project(camara);
        const x = (V3.x * 0.5 + 0.5) * ancho, y = (-V3.y * 0.5 + 0.5) * alto - 30; d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(Math.max(54, y)) + 'px)';
        const fl = R.frente(e).fatiga > 0.6, cls = 'pend' + (e.postura === 'empujar' ? ' carga' : fl ? ' flaquea' : ''), txt = e.postura === 'empujar' ? 'cargan' : fl ? 'flaquean' : 'aguantan';
        if (d.className !== cls) d.className = cls; if (d.firstChild.textContent !== txt) d.firstChild.textContent = txt; d.lastChild.firstChild.style.width = Math.round(100 * Math.max(0, e.moral)) + '%';
      });
    }
    function cinta(texto, tono) { const c = $('cinta'); c.textContent = texto; c.className = 've' + (tono ? ' ' + tono : ''); cintaHasta = performance.now() + 2800; }
    function eventos() {
      for (; nEv < B.eventos.length; nEv++) {
        const e = B.eventos[nEv];
        if (e.tipo === 'orden') { mirar(e.sect, 2.2, true); continue; }
        if (e.tipo === 'fin') { fin(); continue; }
        if (e.tipo === 'caballeria-lista') { if (performance.now() > cintaHasta) cinta(e.texto); continue; }
        const mala = ['carga-enemiga', 'numidas-aviso', 'cansados', 'linea-deshecha'].includes(e.tipo) || (e.tipo === 'roto' && e.lado === 0) || (e.tipo === 'envuelve' && e.lado === 1);
        const buena = ['enemigo-cede', 'impacto', 'numidas-fuera'].includes(e.tipo) || (e.tipo === 'roto' && e.lado === 1) || (e.tipo === 'envuelve' && e.lado === 0);
        cinta(e.texto, mala ? 'mala' : buena ? 'buena' : '');
        if (e.tipo === 'impacto' || e.tipo === 'choque') temblor = 1;
        if (e.tipo === 'roto' || e.tipo === 'impacto' || e.tipo === 'relevo' || e.tipo === 'caballeria') mirar(e.sect, e.tipo === 'caballeria' ? 6.5 : 3.2, true);
        else if (e.tipo === 'carga-enemiga' || e.tipo === 'envuelve' || e.tipo === 'numidas-aviso') mirar(e.sect, 2.8, false);
        if (e.tipo === 'roto' && e.lado === 0 && e.sect === sel) { const j = [1, 0, 2].find(k => !B.sect[k].c[0].roto); if (j !== undefined) sel = j; }
      }
    }
    function fin() {
      const r = B.resultado, t = { victoria: 'Victoria', derrota: 'Derrota', retirada: 'Retirada' }[r.como], m = Math.floor(r.t / 60), s = Math.round(r.t % 60);
      $('fin-t').textContent = t; $('fin-t').style.color = r.como === 'victoria' ? 'var(--oro)' : '#e0937f'; $('fin-p').textContent = r.motivo;
      $('fin-c').innerHTML = '<span>Tus bajas</span><b>' + r.bajas[0] + ' de ' + r.inicial[0] + '</b><span>Bajas enemigas</span><b>' + r.bajas[1] + ' de ' + r.inicial[1] + '</b><span>Duración</span><b>' + m + ' min ' + s + ' s</b>';
      guardaYa();
      tFin = setTimeout(() => { $('fin').hidden = false; $('mando').hidden = true; $('retirar').hidden = true; $('cinta').className = ''; }, r.como === 'retirada' || retardo0 ? 0 : 1600);
    }
    function ordenar(o) {
      const no = R.ordenar(B, sel, o); tocado = true;
      if (no) cinta(no); else if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* sin vibración */ } }
      pintarCartas();
    }
    function elegir(i) { if (i === sel || B.fase === 'fin') return; sel = i; pintarCartas(); }

    $('ordenes').addEventListener('click', e => { const b = e.target.closest('.orden'); if (b) ordenar(b.dataset.o); });
    $('cuerpos').addEventListener('click', e => { const b = e.target.closest('.cuerpo'); if (b) elegir(+b.dataset.i); });
    $('retirar').addEventListener('click', () => { if (B.fase === 'fin') return; pausa = true; $('salir').hidden = false; guardaYa(); });
    $('salir-no').addEventListener('click', () => { pausa = false; $('salir').hidden = true; });
    $('salir-si').addEventListener('click', () => { pausa = false; $('salir').hidden = true; R.retirarse(B); eventos(); });   // eventos() ve el evento «fin» y muestra el cartel
    $('seguir').addEventListener('click', () => { if (B.fase === 'fin') terminar(); });
    /* tocar la tropa en el campo también la elige */
    const rayo = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), toque = { x: 0, y: 0, t: 0 };
    lienzo.addEventListener('pointerdown', e => { toque.x = e.clientX; toque.y = e.clientY; toque.t = performance.now(); });
    lienzo.addEventListener('pointerup', e => {
      if (!lista || pausa || Math.hypot(e.clientX - toque.x, e.clientY - toque.y) > 12 || performance.now() - toque.t > 600) return;
      rayo.setFromCamera(new THREE.Vector2(e.clientX / ancho * 2 - 1, -(e.clientY / alto) * 2 + 1), camara); const p = rayo.ray.intersectPlane(plano, V3); if (!p || Math.abs(p.x) > S * 1.5 + 3 || Math.abs(p.z) > 30) return;
      elegir(Math.max(0, Math.min(2, Math.round(p.x / S) + 1)));
    });

    /* ---------- bucle ---------- */
    function avanza(dt) { T += dt; R.paso(B, dt); eventos(); colocar(dt); mover(dt); }
    let raf = 0, cerrado = false, tFin = 0, retardo0 = false, antes = 0, acum = 0, cuadros = 0, lentos = 0, tHud = 0;
    function cuadro(ahora) {
      if (cerrado) return; raf = requestAnimationFrame(cuadro);
      const real = Math.min(0.1, (ahora - antes) / 1000 || 0); antes = ahora;
      if (!lista) return;
      if (!pausa) {
        if (B.fase !== 'fin') { acum += real; while (acum >= 0.05) { avanza(0.05); acum -= 0.05; } }
        else { T += real; colocar(real); mover(real); }
      }
      adornos(real); moverCamara(real); pintarFiguras(); renderer.render(escena, camara); pintarPendones();
      if (ahora - tHud > 200) { tHud = ahora; pintarCartas(); if (ahora > cintaHasta) $('cinta').classList.remove('ve'); }
      /* si el móvil no puede, se baja la nitidez antes que la fluidez */
      if (cuadros < 240) { cuadros++; if (real > 0.04) lentos++; if (cuadros === 240 && lentos > 120 && dpr > 1) { dpr = Math.max(1, dpr * 0.6); renderer.setPixelRatio(dpr); medir(); } }
    }

    async function arrancar() {
      try {
        const tipos = new Set(['hastati', 'principes', 'triarii', 'equites', 'galos', 'libios', 'iberos', 'numidas']);
        for (const s of cfg.estado.sect) for (const c of s.c) for (const l of c.lineas) tipos.add(l.tipo);
        for (const t in cfg.estado.cab.comp || {}) tipos.add(t); for (const t in cfg.estado.num.comp || {}) tipos.add(t);
        await Promise.all([preload([...tipos]), loadGroundTextures().then(() => preloadStatic(['cipres', 'olivo', 'pino']))]);
        if (cerrado) return;
        if (!getUnit('hastati')) throw new Error('No se han podido cargar los soldados');
        campo(); const retomada = cfg.estado.fase === 'fin' || cfg.estado.t > 0; retardo0 = retomada; montar(cfg.estado, retomada); moverCamara(0, true);
        lista = true; $('carga').hidden = true; $('mando').hidden = false;
        if (B.fase === 'fin') fin(); else { cinta(retomada ? 'La batalla sigue donde la dejaste' : 'Elige un cuerpo y dale una orden'); cintaHasta = performance.now() + 6000; }
      } catch (e) { console.error(e); $('carga-p').textContent = 'No se ha podido cargar la batalla.'; $('carga-s').hidden = false; }
    }

    /* ---------- guardar a mitad, y cerrar ---------- */
    function guardaYa() { if (B && cfg.guardar) { try { cfg.guardar(B); } catch (e) { /* sin sitio donde guardar */ } } }
    const alOcultar = () => { if (document.hidden) guardaYa(); };
    document.addEventListener('visibilitychange', alOcultar); window.addEventListener('pagehide', guardaYa);
    const tGuardar = setInterval(() => { if (lista && B && B.fase !== 'fin' && !pausa) guardaYa(); }, 4000);
    function cerrarTodo() {
      cerrado = true; cancelAnimationFrame(raf); clearInterval(tGuardar); clearTimeout(tFin); delete window.__gc;
      document.removeEventListener('visibilitychange', alOcultar); window.removeEventListener('pagehide', guardaYa); for (const f of salidas) f();
      for (const m of mallas.values()) { try { m.malla.geometry.dispose(); } catch (e) { /* ya liberada */ } }
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* nada que liberar */ }
    }
    function terminar() { const r = R.resumen(B); cerrarTodo(); alTerminar(r); }
    requestAnimationFrame(t => { antes = t; raf = requestAnimationFrame(cuadro); }); arrancar();

    /* ganchos para las pruebas y las capturas */
    window.__gc = {
      terminar, get cerrado() { return cerrado; },
      get lista() { return lista; }, get B() { return B; }, R,
      ordenar: (i, o) => { sel = i; ordenar(o); }, elegir,
      pausa: v => { pausa = v; },
      salta: seg => { for (let k = 0; k < seg * 20 && B.fase !== 'fin'; k++) avanza(0.05); },
      mirar: (i, seg) => { foco = { i, hasta: i < 0 ? 0 : T + seg, ultimo: T }; moverCamara(0, true); },
      estado: () => ({ t: B.t, fase: B.fase, sel, res: B.resultado, figs: figs.filter(f => f.est === 0).length, tri: renderer.info.render.triangles, llamadas: renderer.info.render.calls }),
    };

    return { cerrarTodo };
  }

  root.UIGuerra = { abrir, cerrar, get abierta() { return !!activa; } };
})(typeof window !== 'undefined' ? window : globalThis);
