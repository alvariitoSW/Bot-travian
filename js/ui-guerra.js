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
    // GC7: «Retirarse» también vale mientras carga la pantalla (resumen() lo cuenta como retirada); al cargar, este oyente se quita y lo gestiona pantalla()
    const retiraCarga = () => { if (activa !== a) return; cerrar(); if (alTerminar) alTerminar(root.Guerra.resumen(cfg.estado)); };
    $('retirar').addEventListener('click', retiraCarga);
    try {
      const [M, U, Gr, St] = await Promise.all([import('./gfx/models.js'), import('./gfx/units.js'), import('./gfx/ground.js'), import('./gfx/statics.js'), import('./gfx/sonido.js')]);
      if (activa !== a) return;
      const fin = r => { if (activa === a) { activa = null; el.remove(); } if (alTerminar) alTerminar(r); };
      const P = pantalla(M, U, Gr, St, el, $, cfg, fin); a.cerrar = P.cerrarTodo; $('retirar').removeEventListener('click', retiraCarga);
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
    /* GM5: de lejos. Los metros del motor se pintan a esta escala (240 m de separación caben en la pantalla) */
    const ESCV = 0.3, hueco = c => (c.z > 0 ? c.z * ESCV : 0), ini = new WeakMap(), velo = new WeakMap();
    const ORD = { avanzar: { que: 'Avanzar', sub: 'sin cubrirse', ico: '<svg viewBox="0 0 24 24"><path d="M12 20V5M12 5l-6 6M12 5l6 6"/></svg>' },
      escudos: { que: 'Escudos', sub: 'cubre, cansa', ico: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2"/></svg>' },
      testudo: { que: 'Testudo', sub: 'inmune, agota', ico: '<svg viewBox="0 0 24 24"><path d="M4 9h16v9H4zM4 13.5h16M9.3 9v9M14.7 9v9M6 9l2-3h8l2 3"/></svg>' } };

    /* ---------- escena ---------- */
    const lienzo = $('lienzo');
    const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    let dpr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const escena = new THREE.Scene(), HORIZ = '#d9d2b8';
    escena.fog = new THREE.Fog(HORIZ, 110, 860);
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
      for (const s of B.sect) for (const c of s.c) for (const l of c.tir ? c.lineas.concat([c.tir]) : c.lineas) {
        const n = Math.max(1, Math.round(l.max / porFig)), lv = { c, fs: [], tir: l === c.tir }; lineas.set(l, lv);
        for (let k = 0; k < n; k++) lv.fs.push(figura(l.tipo, c.lado, xs(s.i), (c.lado === 0 ? 1 : -1) * (16 + hueco(c))));
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
        const g = instancedGeometry(u, cuenta[id]), malla = new THREE.InstancedMesh(g, gentio(u, COLOR[lado]), cuenta[id]); malla.frustumCulled = false; escena.add(malla);
        mallas.set(id, { malla, fr: g.attributes.aFrame, u });
      }
      if (sombras) { escena.remove(sombras); sombras.geometry.dispose(); }
      sombras = new THREE.InstancedMesh(new THREE.CircleGeometry(0.62, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1a1408', transparent: true, opacity: 0.3, depthWrite: false }), figs.length); sombras.frustumCulled = false; sombras.renderOrder = 1; escena.add(sombras);
      for (const f of figs) { f.x = f.tx; f.z = f.tz; }
      nEv = B.eventos.length; pintarCartas(true);
    }

    /* ---------- GM5 · el gentío (GM33): cada hombre con su piel, su túnica y su bronce; el bando, en escudo y penacho ----------
       Es una copia del material de la unidad (el de la ciudad y el mapa no cambia). La variación sale del número del hombre en su malla
       (gl_InstanceID): sin atributos nuevos, sin llamadas de dibujo nuevas. De lejos el bloque se tiñe un poco de su color para leerse. */
    const GENTIO_V = `vP = transformed; { float id = float(gl_InstanceID) + 1.0; vH = fract(sin(vec4(id * 12.9898, id * 78.233, id * 37.719, id * 93.989)) * 43758.5453); }
  #include <project_vertex>`;
    const GENTIO_F = `{ const vec3 L = vec3(0.3, 0.59, 0.11);
    vec3 c0 = tx.rgb; float l = dot(c0, L), mk = (vMode > 0.5 && vMode < 1.5) ? 1.0 - tx.a : 0.0;
    float esc = smoothstep(0.82, 0.95, mk) * smoothstep(0.30, 0.50, abs(vP.x)), cab = smoothstep(0.80, 0.90, vP.y / 5.3), ft = clamp(max(esc, cab), 0.0, 1.0);
    float k = floor(vH.y * 2.999); vec3 tela = k < 0.5 ? vec3(0.66, 0.54, 0.34) : (k < 1.5 ? vec3(0.52, 0.27, 0.05) : vec3(0.22, 0.13, 0.06));
    tela *= (0.86 + 0.28 * vH.z) * clamp(l / 0.45, 0.7, 1.3) * 1.25;
    float tv = fract(vH.w * 5.0 + vH.y * 3.0); vec3 tono = tv < 0.33 ? vec3(0.78) : (tv < 0.66 ? vec3(1.0) : vec3(1.18, 1.1, 1.0));
    tx.rgb = mix(c0, mix(tela, uTeam * tono, ft), smoothstep(0.15, 0.4, mk));
    float mxc = max(c0.r, max(c0.g, c0.b)), mnc = min(c0.r, min(c0.g, c0.b)), br = c0.b / max(c0.r, 0.004), gr = c0.g / max(c0.r, 0.004), fuera = 1.0 - smoothstep(0.15, 0.4, mk);
    float wS = smoothstep(0.50, 0.58, br) * (1.0 - smoothstep(0.80, 0.92, br)) * smoothstep(0.68, 0.76, gr) * (1.0 - smoothstep(0.92, 1.0, gr)) * smoothstep(0.03, 0.08, l) * fuera;
    vec3 piel = mix(vec3(1.14, 1.08, 1.04), vec3(0.70, 0.50, 0.38), smoothstep(0.05, 0.95, fract(vH.x * 5.7 + vH.w * 3.3)));
    float wB = (1.0 - smoothstep(0.42, 0.52, br)) * smoothstep(0.50, 0.62, (mxc - mnc) / max(mxc, 0.004)) * smoothstep(0.08, 0.2, l) * fuera;
    vec3 bronce = mix(vec3(1.18, 1.04, 0.82), vec3(0.78, 0.66, 0.56), fract(vH.z * 4.1 + vH.x * 2.3));
    tx.rgb = mix(tx.rgb, tx.rgb * piel, wS); tx.rgb = mix(tx.rgb, tx.rgb * bronce, wB * (1.0 - wS));
    float lejos = smoothstep(45.0, 120.0, length(vViewPosition)), lt = dot(tx.rgb, L);
    tx.rgb = mix(tx.rgb, uTeam * (0.35 + 1.6 * lt), lejos * clamp(0.3 + ft * 0.6, 0.0, 1.0)); }`;
    const gentios = new Map();
    function gentio(u, color) {
      const id = u.key + color; if (gentios.has(id)) return gentios.get(id);
      const base = unitMaterialReal(u, color), m = base.clone();
      m.onBeforeCompile = sh => {
        base.onBeforeCompile(sh);
        sh.vertexShader = 'varying vec4 vH; varying vec3 vP;\n' + sh.vertexShader.replace('#include <project_vertex>', GENTIO_V);
        sh.fragmentShader = 'varying vec4 vH; varying vec3 vP;\n' + sh.fragmentShader.replace('if (vMode > 0.5 && vMode < 1.5) tx.rgb = mix(uTeam, tx.rgb, tx.a);', GENTIO_F);
      };
      m.customProgramCacheKey = () => 'aqvila-gentio';
      gentios.set(id, m); salidas.push(() => m.dispose()); return m;
    }

    /* ---------- dónde debe estar cada soldado ---------- */
    const zFrente = s => -s.frente * CAMPO;
    function colocar(dt, inicio) {
      const vistas = new Set();
      for (const s of B.sect) for (const c of s.c) {
        const dir = c.lado === 0 ? 1 : -1, rival = s.c[1 - c.lado];
        const r = B.resultado, vencido = r && (r.como === 'victoria') === (c.lado === 1);                 // al acabar, el bando vencido deja el campo
        if (c.roto || vencido) { for (const [l, lv] of lineas) if (lv.c === c) { huir(lv.fs, dir, !c.roto && r && r.como === 'retirada'); lv.fs = []; } continue; }
        /* el vencedor de su duelo se vuelve contra el costado del vecino */
        let fl = null; if (rival.roto && c.libre <= 0) { const o = R.vecino(B, s.i, 1 - c.lado); if (o && o !== s) { const sg = Math.sign(xs(s.i) - xs(o.i)); fl = { sg, x: xs(o.i) + sg * (FILAS * PASO / 2 + 0.9), z: zFrente(o) - dir * 3.4 }; } }
        const lejos = R.lejos(s), lucha = !lejos && B.fase === 'lucha' && c.relevo <= 0 && (!rival.roto || fl);
        /* de lejos: se aprietan con los escudos en alto y andan al paso del motor */
        const ap = lejos ? (R.POSTURAS[c.postura] || R.POSTURAS.avanzar).aprieta : 1, zAntes = velo.get(c), vm = lejos && dt > 0 && zAntes !== undefined ? Math.max(0.25, (zAntes - c.z) / dt * ESCV * 1.15) : 0; velo.set(c, c.z);
        let d = 0.8 + hueco(c); ini.set(c, d);
        c.lineas.forEach((l, k) => {
          const lv = lineas.get(l); if (!lv) return; vistas.add(lv);
          const quiere = l.hombres <= 0 ? 0 : Math.max(1, Math.round(l.hombres / porFig));
          while (!inicio && lv.fs.length > quiere) { const j = Math.floor(Math.random() * Math.min(FILAS, lv.fs.length)), f = lv.fs.splice(j, 1)[0]; f.est = 1; f.t0 = T; }
          const n = lv.fs.length, rs = (k === 0 && c.postura === 'empujar' ? 1.0 : 1.25) * ap, filas = Math.ceil(n / FILAS);
          lv.fs.forEach((f, j) => {
            const r = Math.floor(j / FILAS), col = j % FILAS, enFila = Math.min(FILAS, n - r * FILAS), lx = (col - (enFila - 1) / 2) * PASO * ap, lz = d + r * rs; f.vm = vm;
            if (fl) { f.tx = fl.x + fl.sg * (lz - 0.8); f.tz = fl.z + lx; f.cara = -fl.sg * Math.PI / 2; }
            else { f.tx = xs(s.i) + lx; f.tz = zFrente(s) + dir * lz; f.cara = c.lado === 0 ? Math.PI : 0; }
            f.ataca = lucha && k === 0 && r < (c.postura === 'empujar' ? 2 : 1) && (c.postura === 'empujar' || Math.sin(T * 0.8 + f.ph * 3) > 0.1);
          });
          d += filas * rs + HUECO;
        });
        c.fondo = d;
        /* los tiradores: delante mientras tiran; detrás de todo cuando se retiran */
        const t = c.tir, tv = t && lineas.get(t);
        if (tv) {
          vistas.add(tv);
          const quiere = t.hombres <= 0 ? 0 : Math.max(1, Math.round(t.hombres / porFig));
          while (!inicio && tv.fs.length > quiere) { const f = tv.fs.splice(Math.floor(Math.random() * tv.fs.length), 1)[0]; f.est = 1; f.t0 = T; }
          const fuera = t.estado === 'fuera' || t.estado === 'vuelve', FT = 9, base = fuera ? d + 0.5 : ini.get(c) - t.av * ESCV - 1.2;
          tv.fs.forEach((f, j) => {
            const r = Math.floor(j / FT), col = j % FT, enFila = Math.min(FT, tv.fs.length - r * FT), lx = (col - (enFila - 1) / 2) * PASO * 1.5 + Math.sin(f.ph * 7) * 0.3;
            f.tx = xs(s.i) + lx; f.tz = zFrente(s) + dir * (base + (fuera ? r * 1.6 : -r * 1.6)); f.cara = c.lado === 0 ? Math.PI : 0;
            f.ataca = t.estado === 'tira' && Math.sin(T * 1.3 + f.ph * 3) > -0.2; f.vm = fuera ? 0 : Math.max(vm, 0.9);
          });
        }
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
        const corre = f.est === 3 || f.corre || d > 7, v = montado ? (corre ? 12 : 4) : (corre ? 6.2 : f.vm || 3.4);
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
    /* GM5 · relieve (GM29): el campo de lucha es llano (las figuras van a ras de suelo); fuera salen lomas suaves y, lejos, un horizonte de colinas.
       Solo aspecto: no hay regla de la loma. El llano cubre también de dónde salen la caballería y los númidas. */
    const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const REL = { xc: 62, za: -132, zb: 52, zc: -40, r0: 330 };
    function alt(x, z) {
      const dx = Math.max(0, Math.abs(x) - REL.xc), dz = Math.max(0, REL.za - z, z - REL.zb), d = Math.hypot(dx, dz), f = suave(0, 110, d);
      let h = f * (1.4 + 1.8 * Math.sin(x * 0.021 + 1.7) * Math.cos(z * 0.017 - 0.6) + 0.9 * Math.sin(x * 0.047 + z * 0.031)) * (1 + d / 220);
      const r = Math.hypot(x, z - REL.zc); h += 70 * suave(REL.r0, REL.r0 + 260, r) * (0.65 + 0.35 * Math.sin(Math.atan2(x, z - REL.zc) * 4 + 1));
      return Math.max(0, h);
    }
    function campo() {
      const rnd = (() => { let s = 99; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
      const g = new THREE.PlaneGeometry(1500, 1500, 120, 120).rotateX(-Math.PI / 2), P = g.attributes.position, W = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), z = P.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.06 - 0.4) + 0.25 * Math.sin(x * 0.13 + z * 0.09);
        const pis = 0.55 * Math.exp(-(z * z) / 190) * Math.exp(-(x * x) / 2200);                       // tierra pisada donde se lucha
        W[i * 3] = Math.max(0, Math.min(0.75, 0.3 + 0.4 * n) * (1 - pis)); W[i * 3 + 1] = pis + 0.08 * Math.max(0, Math.sin(x * 0.21) * Math.sin(z * 0.17)); W[i * 3 + 2] = 0;
        P.setY(i, alt(x, z));
      }
      const suelo = new THREE.Mesh(g, applyGround(g, W, 0.09)); escena.add(suelo);
      try { escena.add(crearCielo(sol.position.clone(), HORIZ, { uRuido: { value: texturaRuido() } })); } catch (e) { escena.background = new THREE.Color(HORIZ); console.warn('sin cielo', e); }
      const arboles = { cipres: [], olivo: [], pino: [] }, E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
      for (let k = 0; k < 150; k++) {
        const a = rnd() * Math.PI * 2, r = 42 + rnd() * 150, x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r - 20; if (Math.abs(x) < 34 && z > -34 && z < 60) continue;
        const tipo = rnd() < 0.45 ? 'olivo' : rnd() < 0.6 ? 'cipres' : 'pino', e = UNIT_SCALE * (0.75 + rnd() * 0.6) * (tipo === 'pino' ? 0.8 : 1);
        arboles[tipo].push(new THREE.Matrix4().compose(V.set(x, alt(x, z) - 0.2, z), Q.setFromEuler(E.set(0, rnd() * 6.28, 0)), SC.set(e, e, e)));
      }
      for (const t in arboles) { const m = staticInstances(t, arboles[t]); if (m) escena.add(m); }
      /* un estandarte por cuerpo: es lo que se mira para saber cómo va */
      for (let l = 0; l < 2; l++) for (let i = 0; i < 3; i++) {
        /* GM5 (GM-K6d): estandarte alto con el icono de su tropa; la tela encoge con la moral */
        const gr = new THREE.Group(), palo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, EST.palo, 6), new THREE.MeshLambertMaterial({ color: '#6b4a22' })); palo.position.y = EST.palo / 2; gr.add(palo);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(EST.ancho, EST.alto), new THREE.MeshBasicMaterial({ map: lienzoEstandarte(l, 'espada'), side: THREE.DoubleSide, transparent: true, toneMapped: false })); gr.add(tela);
        const orla = new THREE.Mesh(new THREE.PlaneGeometry(EST.ancho + 0.3, 0.16), new THREE.MeshLambertMaterial({ color: '#e9c063', side: THREE.DoubleSide })); orla.position.y = EST.palo - 0.1; gr.add(orla);
        escena.add(gr); estand.push({ gr, tela, l, i, ico: 'espada' });
      }
      marca = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd76a', map: texturaBrillo(), transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); marca.position.y = 0.05; marca.renderOrder = 2; escena.add(marca);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(polvoN * 3), 3)); pg.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(polvoN), 1));
      polvo = new THREE.Points(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 300 } },
        vertexShader: 'attribute float aV; varying float vA; uniform float uT; void main(){ vA = aV; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uT * (0.6 + aV) / -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vA * 0.5; gl_FragColor = vec4(0.86, 0.78, 0.6, a); }' }));
      polvo.frustumCulled = false; polvo.renderOrder = 3; polvo.userData.p = Array.from({ length: polvoN }, (_, k) => ({ s: k % 3, v: Math.random(), x: Math.random() - 0.5, z: Math.random() - 0.5 })); escena.add(polvo);
      for (let i = 0; i < 3; i++) { const d = document.createElement('div'); d.className = 'pend'; d.innerHTML = '<span></span><i><b></b></i>'; $('pendones').appendChild(d); pend.push(d); }
    }
    /* ---------- GM5: estandartes con icono, brillo bajo el cuerpo elegido y flecha de la orden ---------- */
    const EST = { palo: 6.2, ancho: 1.9, alto: 2.3 }, escEst = () => Math.max(1, Math.min(2.4, cam.d / 48));
    const ICONO = { inf: 'espada', spear: 'lanza', rng: 'arco', cav: 'caballo', ele: 'elefante' };
    const icono = t => { const u = t && root.DATA && root.DATA.UNITS && root.DATA.UNITS[t]; return (u && ICONO[u.cls]) || 'espada'; };
    const telas = new Map();
    /* la tela: color del bando, orla de oro e icono claro con borde oscuro, dibujado con código (sin arte nuevo) */
    function lienzoEstandarte(l, ico) {
      const id = l + ico; if (telas.has(id)) return telas.get(id);
      const W = 128, H = 156, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
      const fondo = x.createLinearGradient(0, 0, 0, H); fondo.addColorStop(0, l === 0 ? '#d23224' : '#7a52bf'); fondo.addColorStop(1, l === 0 ? '#8e1a12' : '#45297a');
      x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, H - 22); x.lineTo(W * 0.75, H); x.lineTo(W / 2, H - 22); x.lineTo(W * 0.25, H); x.lineTo(0, H - 22); x.closePath();
      x.fillStyle = fondo; x.fill(); x.lineWidth = 7; x.strokeStyle = '#e9c063'; x.stroke();
      x.save(); x.translate(W / 2, 66); x.lineCap = 'round'; x.lineJoin = 'round';
      const p = new Path2D();
      if (ico === 'espada') { p.moveTo(0, -50); p.lineTo(13, -34); p.lineTo(11, 14); p.lineTo(-11, 14); p.lineTo(-13, -34); p.closePath(); p.rect(-28, 14, 56, 11); p.rect(-7, 25, 14, 16); p.arc(0, 46, 9, 0, 7); }
      else if (ico === 'lanza') { p.moveTo(0, -54); p.quadraticCurveTo(22, -30, 0, -10); p.quadraticCurveTo(-22, -30, 0, -54); p.rect(-6, -12, 12, 64); p.rect(-14, -14, 28, 8); }
      else if (ico === 'arco') { p.moveTo(-6, -46); p.quadraticCurveTo(46, 0, -6, 46); p.lineTo(-11, 41); p.quadraticCurveTo(34, 0, -11, -41); p.closePath(); p.rect(-31, -2.5, 52, 5); p.moveTo(21, -11); p.lineTo(36, 0); p.lineTo(21, 11); p.closePath(); p.rect(-38, -7, 9, 14); }
      else if (ico === 'caballo') { p.moveTo(-26, 46); p.lineTo(-24, 14); p.quadraticCurveTo(-30, -14, -10, -34); p.lineTo(-12, -48); p.lineTo(0, -38); p.lineTo(4, -48); p.lineTo(10, -34); p.quadraticCurveTo(36, -18, 38, 6); p.lineTo(32, 14); p.quadraticCurveTo(20, 6, 10, 0); p.quadraticCurveTo(4, 22, 22, 46); p.closePath(); }
      else { p.ellipse(4, 0, 34, 22, 0, 0, 7); p.rect(-24, 10, 11, 32); p.rect(-4, 10, 11, 32); p.rect(18, 10, 11, 30); p.arc(-30, -10, 17, 0, 7); p.moveTo(-44, -6); p.quadraticCurveTo(-52, 22, -40, 40); p.lineTo(-33, 37); p.quadraticCurveTo(-42, 22, -34, 2); p.closePath(); p.moveTo(-46, 4); p.lineTo(-58, 12); p.lineTo(-48, 14); p.closePath(); }
      x.lineWidth = 8; x.strokeStyle = 'rgba(30,14,6,0.85)'; x.stroke(p); x.fillStyle = '#f6ecd2'; x.fill(p, 'nonzero');
      x.restore();
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; telas.set(id, t); salidas.push(() => t.dispose()); return t;
    }
    /* el brillo del cuerpo elegido: un rectángulo de bordes difuminados */
    function texturaBrillo() {
      const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), im = x.createImageData(N, N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const u = Math.abs((i + 0.5) / N * 2 - 1), v = Math.abs((j + 0.5) / N * 2 - 1), d = Math.max(0, Math.hypot(Math.max(0, u - 0.45), Math.max(0, v - 0.55)) / 0.48), a = Math.max(0, 1 - d), q = (j * N + i) * 4;
        im.data[q] = im.data[q + 1] = im.data[q + 2] = Math.round(255 * a * a * (3 - 2 * a)); im.data[q + 3] = 255;
      }
      x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); salidas.push(() => t.dispose()); return t;
    }
    /* la orden pintada en el suelo (GM29): una flecha roja del cuerpo hacia su objetivo que se desvanece en unos 4 s */
    const flechas = [], FLECHA_SEG = 4;
    const MAT_FLECHA = color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    function flecha(pts) {
      for (const f of flechas.splice(0)) for (const m of [f.borde, f.cuerpo]) { escena.remove(m); m.geometry.dispose(); m.material.dispose(); }   // una sola a la vez
      const w = Math.max(0.7, cam.d * 0.009), P = [];   // fina: que no tape a la tropa
      for (let k = 0; k < pts.length - 1; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 4)); for (let j = k ? 1 : 0; j <= n; j++) P.push([x0 + (x1 - x0) * j / n, z0 + (z1 - z0) * j / n]); }
      const cab = w * 2.2, tot = P.reduce((a, p, k) => a + (k ? Math.hypot(p[0] - P[k - 1][0], p[1] - P[k - 1][1]) : 0), 0);
      if (tot < cab * 1.4) return;
      const Q = [P[0]]; let dd = 0;
      for (let k = 1; k < P.length; k++) { const l = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); if (dd + l >= tot - cab) { const f = (tot - cab - dd) / l; Q.push([P[k - 1][0] + (P[k][0] - P[k - 1][0]) * f, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * f]); break; } dd += l; Q.push(P[k]); }
      const fin = P[P.length - 1], ult = Q[Q.length - 1], dx = fin[0] - ult[0], dz = fin[1] - ult[1], dl = Math.hypot(dx, dz) || 1, y = 0.12;
      const nor = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
      const geo = (m, mas) => {
        const pos = [], idx = [];
        for (let k = 0; k < Q.length; k++) {
          const a = Q[Math.max(0, k - 1)], b = Q[Math.min(Q.length - 1, k + 1)], [nx, nz] = nor(a, b), ws = w * m * (0.55 + 0.45 * Math.min(1, k / 2)) * 0.5;
          pos.push(Q[k][0] + nx * ws, y, Q[k][1] + nz * ws, Q[k][0] - nx * ws, y, Q[k][1] - nz * ws); if (k) { const i = (k - 1) * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
        }
        const nx = -dz / dl, nz = dx / dl, b0 = pos.length / 3;
        pos.push(ult[0] + nx * w * 1.15 * m, y, ult[1] + nz * w * 1.15 * m, ult[0] - nx * w * 1.15 * m, y, ult[1] - nz * w * 1.15 * m, fin[0] + dx / dl * mas, y, fin[1] + dz / dl * mas); idx.push(b0, b0 + 1, b0 + 2);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
      };
      const mk = (g, color, orden) => { const m = new THREE.Mesh(g, MAT_FLECHA(color)); m.frustumCulled = false; m.renderOrder = orden; escena.add(m); return m; };
      flechas.push({ borde: mk(geo(1.4, w * 0.5), '#2a0504', 40), cuerpo: mk(geo(1, 0), '#d8231a', 41), edad: 0 });
    }
    /* de qué cuerpo a qué sitio va la flecha de cada orden («Aguantar» y «Relevo» no mueven a nadie: sin flecha) */
    function pintarOrden(o, i) {
      const s = B.sect[i], c = s.c[0], e = s.c[1], x = xs(i), z0 = zFrente(s) + hueco(c) + 0.3, z1 = zFrente(s) - hueco(e) - 1.5;
      if (o === 'caballeria') {
        const sg = i === 0 ? -1 : 1, vivos = cab.filter(f => f.est === 0); if (!vivos.length) return;
        const cx = vivos.reduce((a, f) => a + f.x, 0) / vivos.length, cz = vivos.reduce((a, f) => a + f.z, 0) / vivos.length, xg = x + sg * (S / 2 + 2.5);
        flecha([[cx, cz], [xg, Math.max(zFrente(s) + 8, Math.min(cz, z0 + 6))], [xg, zFrente(s) - 2], [x + sg * 2.5, z1 - 2]]);
      } else if (o === 'avanzar' || o === 'escudos' || o === 'testudo' || o === 'empujar') flecha([[x, z0], [x, Math.min(z1, z0 - 14)]]);
    }
    function animarFlechas(dt) {
      for (let k = flechas.length - 1; k >= 0; k--) {
        const f = flechas[k]; f.edad += dt; const a = Math.min(1, f.edad / 0.18) * Math.max(0, Math.min(1, (FLECHA_SEG - f.edad) / 1.6));
        f.cuerpo.material.opacity = 0.88 * a; f.borde.material.opacity = 0.7 * a;
        if (f.edad >= FLECHA_SEG) { for (const m of [f.borde, f.cuerpo]) { escena.remove(m); m.geometry.dispose(); m.material.dispose(); } flechas.splice(k, 1); }
      }
    }
    function adornos(dt) {
      for (const e of estand) {
        const s = B.sect[e.i], c = s.c[e.l], dir = e.l === 0 ? 1 : -1; e.gr.visible = !c.roto && !(B.resultado && (B.resultado.como === 'victoria') === (e.l === 1));
        const fr = c.lineas[0], lv = lineas.get(fr), filas = lv ? Math.ceil(lv.fs.length / FILAS) : 1;
        const zz = zFrente(s) + dir * (0.8 + hueco(c) + filas * 1.25 + 0.5); e.gr.position.x += (xs(e.i) - e.gr.position.x) * 0.2; e.gr.position.z += (zz - e.gr.position.z) * Math.min(1, dt * 3);
        e.gr.rotation.z = Math.sin(T * 1.7 + e.i) * 0.03 + (1 - c.moral) * 0.22 * Math.sin(T * 3 + e.i); e.tela.scale.y = 0.35 + 0.65 * Math.max(0, c.moral); e.tela.position.y = EST.palo - 0.18 - EST.alto / 2 * e.tela.scale.y;
        e.gr.scale.setScalar(escEst()); const ico = icono(fr && fr.tipo); if (ico !== e.ico) { e.ico = ico; e.tela.material.map = lienzoEstandarte(e.l, ico); }
      }
      const c = B.sect[sel].c[0]; marca.visible = !c.roto && B.fase !== 'fin';
      if (marca.visible) { const a = ini.get(c) || 0.8, f = Math.max(2, (c.fondo || 10) - a + 0.8); marca.scale.set(FILAS * PASO + 5, 1, f + 4.5); marca.position.x = xs(sel); marca.position.z = zFrente(B.sect[sel]) + a - 0.8 + f / 2 + 0.2; marca.material.opacity = 0.24 + 0.06 * Math.sin(T * 3); }
      animarFlechas(dt);
      const P = polvo.geometry.attributes.position.array, A = polvo.geometry.attributes.aV.array; polvo.material.uniforms.uT.value = alto * 1.6;
      polvo.userData.p.forEach((p, k) => {
        const s = B.sect[p.s], vivo = B.fase === 'lucha' && !R.lejos(s) && !s.c[0].roto && !s.c[1].roto, fuerza = vivo ? (s.c[0].postura === 'empujar' || s.c[1].postura === 'empujar' ? 1 : 0.5) : 0;
        p.v += dt * 0.28; if (p.v > 1) { p.v = 0; p.x = Math.random() - 0.5; p.z = Math.random() - 0.5; p.f = fuerza; }
        P[k * 3] = xs(p.s) + p.x * (FILAS * PASO + 1); P[k * 3 + 1] = 0.4 + p.v * 3.2; P[k * 3 + 2] = zFrente(s) + p.z * 4; A[k] = (p.f || 0) * Math.sin(p.v * Math.PI);
      });
      polvo.geometry.attributes.position.needsUpdate = true; polvo.geometry.attributes.aV.needsUpdate = true;
    }

    /* ---------- cámara: vista general, y baja sola a donde pasa algo ---------- */
    function camaraMeta() {
      if (foco.i >= 0 && T < foco.hasta && B.fase !== 'fin') { const s = B.sect[foco.i]; return { x: xs(foco.i) * 0.9, y: 1.2, z: zFrente(s) + 1.5 + hueco(s.c[0]), d: vertical ? 30 : 21, p: 0.3, a: (1 - foco.i) * 0.3 + 0.28 }; }
      const tanH = Math.tan(camara.fov * Math.PI / 360) * camara.aspect, medio = S * 1.5 + 1.5;
      /* GM5: mientras se acercan, la cámara se aleja lo justo para ver a los dos ejércitos */
      let g0 = 0, g1 = 0; for (const s of B.sect) if (R.lejos(s)) { g0 = Math.max(g0, hueco(s.c[0])); g1 = Math.max(g1, hueco(s.c[1])); }
      if (g0 + g1 > 4 && B.fase !== 'fin') { const z = (g0 - g1) / 2 + (vertical ? 7 : 4.5), d = Math.max(vertical ? 46 : 40, (g0 + g1 + 26) * (vertical ? 1.05 : 1.15)); return { x: 0, y: 0, z, d, p: vertical ? 0.62 : 0.5, a: 0 }; }
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
    const ICO = {}; el.querySelectorAll('.orden').forEach(b => { ICO[b.dataset.o] = { ico: (b.querySelector('svg') || b.querySelector('.glifo')).outerHTML, que: b.querySelector('.que').textContent, sub: b.querySelector('.sub').textContent }; });
    function pintarCartas(fuerza) {
      let h = '';
      B.sect.forEach((s, i) => {
        const c = s.c[0], alerta = !c.roto && c.lineas.length > 1 && c.relevo <= 0 && (R.frente(c).fatiga > 0.75 || R.frente(c).hombres < 0.4 * R.frente(c).max) && c.lineas[1].fatiga < 0.5;
        const acoso = (B.num.estado === 'llega' || B.num.estado === 'hostiga') && B.num.sect === i;
        c.alerta = alerta; c.acoso = acoso;
        h += '<button class="cuerpo' + (i === sel ? ' sel' : '') + (c.roto ? ' roto' : '') + (alerta || acoso ? ' alerta' : '') + '" data-i="' + i + '"><span class="nom">' + R.NOMBRE_SECTOR[i] + '</span>' + (c.roto ? '<span class="nom">ha huido</span>' : '<span class="escudos">' + (acoso ? '<span class="acoso">♞</span>' : '') + c.lineas.map(l => '<span class="esc"><b style="height:' + Math.round(100 * l.hombres / l.max) + '%;background:' + tinte(l.fatiga) + '"></b></span>').join('') + '</span><span class="moral"><b style="width:' + Math.round(100 * Math.max(0, c.moral)) + '%"></b></span>') + '</button>';
      });
      if (fuerza || h !== cartaClave) { $('cuerpos').innerHTML = h; cartaClave = h; }
      const c = B.sect[sel].c[0], ords = R.ordenesDe(B, sel), lj = R.lejos(B.sect[sel]), fuego = lj && R.bajoFuego(B, c);
      el.querySelectorAll('.orden').forEach((b, k) => {
        if (b.dataset.o !== ords[k]) { const o = ords[k], q = ORD[o] || ICO[o]; b.dataset.o = o; b.innerHTML = q.ico + '<span class="que">' + q.que + '</span><span class="sub">' + q.sub + '</span>'; }   // GM5: lejos, otros botones
        const o = b.dataset.o, no = R.puede(B, sel, o), activa = !c.roto && (c.postura === o || (c.cambio > 0 && o === 'testudo')), sub = b.querySelector('.sub');
        b.classList.toggle('activa', activa); b.classList.toggle('no', !!no && !activa);
        b.classList.toggle('pide', !no && ((o === 'relevo' && c.alerta) || (o === 'caballeria' && c.acoso) || (o === 'escudos' && fuego && c.postura === 'avanzar') || (!tocado && !lj && B.t > 2 && o === 'empujar')));
        if (o === 'relevo') sub.textContent = c.roto || c.lineas.length < 2 ? 'no queda nadie' : c.relevo > 0 ? 'relevando…' : 'entran ' + nombreTropa(c.lineas[1].tipo);
        if (o === 'caballeria' && lj && B.cab.estado === 'lista') { sub.textContent = B.cab.h < 0.5 ? 'no tienes' : R.tirando(B.sect[sel].c[1]) ? 'a por sus tiradores' : 'tras el choque'; return; }
        if (o === 'caballeria') { const k = B.cab, falta = k.estado === 'yendo' ? k.t + 21 : k.estado === 'cargando' ? k.t + 17 : k.t; sub.textContent = k.estado === 'lista' ? 'carga al flanco' : k.estado === 'volviendo' || k.estado === 'cargando' ? 'vuelve en ' + Math.ceil(falta) + ' s' : 'cargando…'; }
      });
    }
    const V3 = new THREE.Vector3();
    function pintarPendones() {
      B.sect.forEach((s, i) => {
        const e = s.c[1], d = pend[i]; if (e.roto || B.fase === 'fin') { d.hidden = true; return; } d.hidden = false;
        const lj = R.lejos(s); V3.set(xs(i), (EST.palo + 0.6) * escEst(), lj ? zFrente(s) - hueco(e) - 3 : zFrente(s) - (e.fondo || 6) + 1).project(camara);
        const x = (V3.x * 0.5 + 0.5) * ancho, y = (-V3.y * 0.5 + 0.5) * alto - 30; d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(Math.max(54, y)) + 'px)';
        const fl = R.frente(e).fatiga > 0.6, cls = 'pend' + (e.postura === 'empujar' ? ' carga' : fl ? ' flaquea' : ''), txt = lj ? (e.tir && e.tir.estado === 'tira' ? 'tiran' : 'avanzan') : e.postura === 'empujar' ? 'cargan' : fl ? 'flaquean' : 'aguantan';
        if (d.className !== cls) d.className = cls; if (d.firstChild.textContent !== txt) d.firstChild.textContent = txt; d.lastChild.firstChild.style.width = Math.round(100 * Math.max(0, e.moral)) + '%';
      });
    }
    function cinta(texto, tono) { const c = $('cinta'); c.textContent = texto; c.className = 've' + (tono ? ' ' + tono : ''); cintaHasta = performance.now() + 2800; }
    /* GC5: sonido de la batalla. Sonido ya sabe callarse (apagado, sin gesto, app oculta). */
    function suena(e) {
      const S = root.Sonido; if (!S) return;
      const tropa = e.tropa;
      if (e.tipo === 'choque') { if (/^Las líneas/.test(e.texto)) { S.cuerno(0.8); setTimeout(() => S.cuernoRival(0.6), 700); setTimeout(() => S.choque(1, 1), 1400); } else S.choque(1, 1); }
      else if (e.tipo === 'pila') S.choque(0.4, 1.3);
      else if (e.tipo === 'carga-enemiga') { if (tropa === 'elefantes') S.elefante(0.8); else if (tropa === 'falange') S.falange(0.7); else { S.carga(0.7); } }
      else if (e.tipo === 'elefantes-desbocados') { S.elefante(1); setTimeout(() => S.choque(0.8, 1), 500); }
      else if (e.tipo === 'caballeria') S.cuerno(0.7);
      else if (e.tipo === 'impacto') { S.carga(0.9); S.choque(1, 1); }
      else if (e.tipo === 'numidas-aviso') S.cuernoRival(0.7);
      else if (e.tipo === 'relevo') S.cuerno(0.5);
      else if (e.tipo === 'roto' || e.tipo === 'envuelve') S.choque(0.8, 0.9);
    }
    function eventos() {
      for (; nEv < B.eventos.length; nEv++) {
        const e = B.eventos[nEv];
        if (e.tipo === 'orden') { mirar(e.sect, 2.2, true); continue; }
        if (e.tipo === 'fin') { fin(); continue; }
        if (e.tipo === 'caballeria-lista') { if (performance.now() > cintaHasta) cinta(e.texto); continue; }
        if (e.tipo === 'pila') { rafaga(e.sect, e.lado, 26, 0.9, 1.6, '#efe3bf'); if (e.lado === 1 && performance.now() < cintaHasta) continue; }
        const mala = ['carga-enemiga', 'numidas-aviso', 'cansados', 'linea-deshecha', 'lluvia', 'testudo-roto'].includes(e.tipo) || (e.tipo === 'roto' && e.lado === 0) || (e.tipo === 'envuelve' && e.lado === 1) || (e.tipo === 'pila' && e.lado === 1);
        const buena = ['enemigo-cede', 'impacto', 'numidas-fuera', 'tir-tiran'].includes(e.tipo) || (e.tipo === 'roto' && e.lado === 1) || (e.tipo === 'envuelve' && e.lado === 0) || (e.tipo === 'pila' && e.lado === 0);
        cinta(e.texto, mala ? 'mala' : buena ? 'buena' : '');
        suena(e);
        if (e.tipo === 'impacto' || e.tipo === 'choque') temblor = 1;
        if (e.tipo === 'roto' || e.tipo === 'impacto' || e.tipo === 'relevo' || e.tipo === 'caballeria' || e.tipo === 'choque') mirar(e.sect, e.tipo === 'caballeria' ? 6.5 : 3.2, true);
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
      if (no) cinta(no); else { pintarOrden(o, sel); if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* sin vibración */ } } }
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
      rayo.setFromCamera(new THREE.Vector2(e.clientX / ancho * 2 - 1, -(e.clientY / alto) * 2 + 1), camara); const p = rayo.ray.intersectPlane(plano, V3); if (!p || Math.abs(p.x) > S * 1.5 + 3 || Math.abs(p.z) > 30 + R.DIST0 * ESCV / 2) return;
      elegir(Math.max(0, Math.min(2, Math.round(p.x / S) + 1)));
    });

    /* ---------- bucle ---------- */
    let tRuido = 0;
    /* Fragor de fondo: el choque suena cada poco, más fuerte cuantos más cuerpos empujan (Sonido limita las voces) */
    function ambiente(dt) {
      if (B.fase !== 'lucha' || !root.Sonido) return; tRuido -= dt; if (tRuido > 0) return;
      const n = B.sect.filter(s => !s.c[0].roto && !s.c[1].roto), emp = n.filter(s => s.c[0].postura === 'empujar' || s.c[1].postura === 'empujar').length;
      if (n.length) { root.Sonido.choque(0.25 + 0.2 * emp, 0.8); tRuido = 1.1 + Math.random() * 0.8 - 0.15 * emp; }
    }
    /* ---------- GM5: proyectiles que se ven (jabalinas, piedras, pila) ---------- */
    const NP = 220, proy = [], pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(NP * 6), pCol = new Float32Array(NP * 6);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMalla = new THREE.LineSegments(pGeo, new THREE.LineBasicMaterial({ vertexColors: true })); pMalla.frustumCulled = false; escena.add(pMalla);
    for (let k = 0; k < NP; k++) proy.push({ on: false }); let kP = 0; const COLP = new THREE.Color();
    const VUELO = { jabalinas: { seg: 1.3, alto: 2.6, color: '#efe3bf' }, piedras: { seg: 1.9, alto: 6, color: '#f4efe2' } };
    const alAzar = fs => fs.length ? fs[Math.floor(Math.random() * fs.length)] : null;
    function lanza(a, b, seg, alto, color) {
      if (!a || !b) return; const p = proy[kP]; kP = (kP + 1) % NP;
      Object.assign(p, { on: true, x0: a.x, z0: a.z, x1: b.x + (Math.random() - 0.5) * 1.2, z1: b.z + (Math.random() - 0.5) * 1.2, t: 0, seg: seg * (0.85 + Math.random() * 0.3), alto });
      COLP.set(color); const q = (kP + NP - 1) % NP * 6; for (let j = 0; j < 6; j += 3) { pCol[q + j] = COLP.r; pCol[q + j + 1] = COLP.g; pCol[q + j + 2] = COLP.b; }
    }
    /* una descarga de golpe: pila al llegar al choque */
    function rafaga(i, lado, n, seg, alto, color) {
      const s = B.sect[i], a = lineas.get(s.c[lado].lineas[0]), b = lineas.get(s.c[1 - lado].lineas[0]); if (!a || !b) return;
      for (let k = 0; k < n; k++) lanza(alAzar(a.fs), alAzar(b.fs), seg, alto, color);
    }
    let tTiro = 0;
    function proyectiles(dt) {
      tTiro -= dt;
      if (tTiro <= 0 && B.fase !== 'fin') {
        tTiro = 0.12;
        for (const s of B.sect) for (const c of s.c) {
          const t = c.tir; if (!t || t.estado !== 'tira') continue;
          const tv = lineas.get(t), o = s.c[1 - c.lado], A = R.tiroDe(t.tipo), V = VUELO[A.arma] || VUELO.jabalinas;
          const obj = t.blanco === 'tir' || (t.blanco === 'ambos' && Math.random() < 0.35) ? lineas.get(o.tir) : lineas.get(o.lineas[0]);
          if (tv && obj && Math.random() < Math.min(1, tv.fs.length / 6)) lanza(alAzar(tv.fs), alAzar(obj.fs), V.seg, V.alto, V.color);
        }
      }
      for (let k = 0; k < NP; k++) {
        const p = proy[k], q = k * 6;
        if (!p.on) { pPos[q + 1] = pPos[q + 4] = -50; continue; }
        p.t += dt; const u = p.t / p.seg; if (u >= 1) { p.on = false; pPos[q + 1] = pPos[q + 4] = -50; continue; }
        const en = w => [p.x0 + (p.x1 - p.x0) * w, 1.4 + 4 * p.alto * w * (1 - w), p.z0 + (p.z1 - p.z0) * w], a = en(u), b = en(Math.max(0, u - 0.05));
        pPos[q] = a[0]; pPos[q + 1] = a[1]; pPos[q + 2] = a[2]; pPos[q + 3] = b[0]; pPos[q + 4] = b[1]; pPos[q + 5] = b[2];
      }
      pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    }
    function avanza(dt) { T += dt; R.paso(B, dt); eventos(); ambiente(dt); colocar(dt); mover(dt); proyectiles(dt); }
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
        for (const s of cfg.estado.sect) for (const c of s.c) { for (const l of c.lineas) tipos.add(l.tipo); if (c.tir) tipos.add(c.tir.tipo); }
        for (const t in cfg.estado.cab.comp || {}) tipos.add(t); for (const t in cfg.estado.num.comp || {}) tipos.add(t);
        await Promise.all([preload([...tipos]), loadGroundTextures().then(() => preloadStatic(['cipres', 'olivo', 'pino']))]);
        if (cerrado) return;
        if (!getUnit('hastati')) throw new Error('No se han podido cargar los soldados');
        campo(); const retomada = cfg.estado.fase === 'fin' || cfg.estado.t > 0; retardo0 = retomada; montar(cfg.estado, retomada); moverCamara(0, true);
        lista = true; $('carga').hidden = true; $('mando').hidden = false;
        if (B.fase === 'fin') fin(); else { cinta(retomada ? 'La batalla sigue donde la dejaste' : 'Se acercan. Si te tiran, pulsa «Escudos»'); cintaHasta = performance.now() + 6000; }
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
      get lista() { return lista; }, get B() { return B; }, R, get flechas() { return flechas.length; },
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
