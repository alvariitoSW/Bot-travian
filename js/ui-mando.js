/* AQVILA — CG4 (A1): la pantalla de MANDO EN VIVO. Dibuja y dirige la batalla del simulador js/simulador.js (global Simulador).
   De momento solo la usan las Escaramuzas; la campaña sigue con js/ui-guerra.js (se retira en el paso B).
   Uso: UIMando.abrir(cfg, alTerminar).
     cfg = { S } (un estado ya creado, p. ej. con manípulos a mano: CG5) o { semilla, ejercitos } (o { semilla, manipulos });
     cfg.campo: llano, colina, bosque o mixto (solo paisaje). alTerminar(r) recibe Simulador.resumen(S) (r.estado.resultado = {como, motivo, t, bajas, inicial}).
   Cómo se juega: arrastrar en vacío mueve la cámara; pellizcar acerca y aleja. Tocar un manípulo tuyo lo elige (con «Varios», cada toque
   suma o quita); tocar el suelo vacío suelta la elección. Arrastrar DESDE un elegido lo manda allí (mirando hacia donde arrastras;
   si arrastras hacia atrás, retroceden mirando al enemigo). Tocar un enemigo con tropa elegida: cargar contra él. Botones abajo.
   Piezas que se copian de ui-guerra.js (sin refactorizar: aquella se retira): la escena three.js, la carga de los soldados nuevos
   (js/gfx/soldado.js y la tabla NUEVO), los niveles de detalle, el instanciado, los velos de carga y fin. La luz y el suelo están en
   js/gfx/campo-mando.js (un solo sitio: los cambia la pieza A2).
   Arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0); soldados nuevos: MakeHuman y Quaternius (CC0 1.0), ver js/gfx/soldado.js. */
(function (root) {
  'use strict';
  let activa = null;
  const CRED = 'Soldados y texturas de 0 A.D. (Wildfire Games, CC BY-SA 3.0). Soldados nuevos: cuerpo de MakeHuman y movimientos de Quaternius (CC0). Suelo y cielo: fotos de Poly Haven (CC0)';
  const HTML = `
<canvas id="mn-lienzo"></canvas>
<div id="mn-capa"></div>
<div id="mn-hud">
  <div id="mn-arriba">
    <button id="mn-pausa" class="mn-b1" type="button">Pausa</button>
    <div id="mn-vel"><button type="button" data-v="1" class="on">×1</button><button type="button" data-v="2">×2</button><button type="button" data-v="4">×4</button></div>
    <span id="mn-reloj">0:00</span>
    <span id="mn-enpausa" hidden>En pausa: puedes dar órdenes</span>
    <button id="mn-retirar" class="mn-b1" type="button">Retirarse</button>
    <span id="mn-estado"></span>
    <button id="mn-subir" class="mn-b1" type="button">Mando</button>
  </div>
  <div id="mn-palanca"><i></i></div>
  <div id="mn-apieo"></div>
  <div id="mn-anillo"><b></b><span></span></div>
  <div id="mn-lucha">
    <div id="mn-fuelle"><span>Aliento</span><i><b></b></i><em id="mn-heridas"></em></div>
    <button type="button" data-g="pilum">Pilum</button><button type="button" data-g="empujar">Empujar</button>
    <button type="button" data-g="parar">Parar</button><button type="button" data-g="golpear">Golpear</button>
  </div>
  <div id="mn-cinta"></div>
  <div id="mn-aviso" hidden></div>
  <div id="mn-abajo">
    <div id="mn-ficha"><div id="mn-ficha-t"></div><button id="mn-varios" type="button" aria-pressed="false">Varios</button></div>
    <div id="mn-ordenes" hidden></div>
  </div>
  <div id="mn-salir" class="velo" hidden>
    <h1>¿Retirarse?</h1>
    <p>La legión sale del campo en orden. La batalla se da por perdida.</p>
    <div class="fila"><button class="gordo b" id="mn-salir-no" type="button">Seguir luchando</button><button class="gordo" id="mn-salir-si" type="button">Sí, retirarse</button></div>
  </div>
  <div id="mn-fin" class="velo" hidden>
    <h1 id="mn-fin-t"></h1>
    <p id="mn-fin-p"></p>
    <div class="cifras" id="mn-fin-c"></div>
    <div class="fila"><button class="gordo" id="mn-seguir" type="button">Ver el resultado</button></div>
    <div class="creditos">${CRED}</div>
  </div>
  <div id="mn-carga" class="velo"><h1>AQVILA</h1><p id="mn-carga-p">Formando los manípulos…</p><div class="fila" id="mn-carga-s" hidden><button class="gordo b" id="mn-carga-no" type="button">Volver</button></div><div class="creditos">${CRED}</div></div>
</div>`;

  function cerrar() { if (activa) { const a = activa; activa = null; try { a.cerrar(); } catch (e) { /* ya cerrada */ } if (a.el) a.el.remove(); } }

  async function abrir(cfg, alTerminar) {
    cerrar(); cfg = cfg || {};
    const Sim = root.Simulador;
    const S = cfg.S || Sim.crear({ semilla: cfg.semilla, ejercitos: cfg.ejercitos, manipulos: cfg.manipulos });
    const el = document.createElement('div'); el.id = 'mn'; el.innerHTML = HTML; document.body.appendChild(el);
    const a = activa = { el, cerrar: () => {} };
    const $ = id => el.querySelector('#mn-' + id);
    const sale = () => { if (activa !== a) return; cerrar(); if (alTerminar) alTerminar(Sim.resumen(S)); };   // mientras carga: cuenta como retirada
    $('carga-no').addEventListener('click', sale); $('retirar').addEventListener('click', sale);
    window.__mn = { lista: false, cerrado: false, S };
    try {
      const [M, U, Gr, St, C] = await Promise.all([import('./gfx/models.js'), import('./gfx/units.js'), import('./gfx/ground.js'), import('./gfx/statics.js'), import('./gfx/campo-mando.js')]);
      if (activa !== a) return;
      const fin = r => { if (activa === a) { activa = null; el.remove(); } if (alTerminar) alTerminar(r); };
      $('retirar').removeEventListener('click', sale);
      const P = pantalla({ M, U, Gr, St, C }, el, $, cfg, S, fin); a.cerrar = P.cerrarTodo;
    } catch (e) { console.error(e); const p = $('carga-p'); if (p) p.textContent = 'No se ha podido cargar la batalla.'; const s = $('carga-s'); if (s) s.hidden = false; }
    return el;
  }

  function pantalla(mods, el, $, cfg, S, alTerminar) {
    const { M, U, Gr, St, C } = mods, Sim = root.Simulador;
    const { THREE } = M, { preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE } = U;
    const COLOR = ['#b3261e', '#5b3a8c'];
    /* el soldado nuevo (js/gfx/soldado.js) para estas tropas, como en ui-guerra; las demás (a caballo, elefantes), con 0 A.D. */
    const NUEVO = { hastati: 'hastatus', principes: 'hastatus', vigiles: 'hastatus', galos: 'galo', libios: 'hastatus:libio', triarii: 'triario', velites: 'velite', milicia: 'velite:milicia', honderos: 'hondero', peltastas: 'peltasta', hoplitas: 'hoplita:griego', sagrada: 'hoplita:sagrada', falange: 'falangita', iberos: 'ibero' };
    const UMBRAL_N = [200, 90, 42];      /* alto en pantalla (px CSS) desde el que toca el nivel 0, 1 y 2; por debajo, el 3 */
    const TOPE_N = [40, 150];            /* como mucho, tantas figuras en el nivel 0 y en el 1 (las más cercanas): presupuesto de triángulos */
    const MAXF = 1200;                   /* figuras por batalla como mucho (una figura vale por varios hombres): ~1 200 × 442 triángulos de lejos */
    const TALLA = 1.25;                  /* las figuras, algo mayores que el hombre: de lejos el bloque se lee (licencia de vista) */
    const PARADA_N = 0.55;               /* el punto del clip «cubrirse» con el escudo arriba (testudo, muro) */
    const ALTO_HASTATUS = 2.11;
    const PASO = Sim.PASO;
    let SOLD = null, escN = 0.84, altoN = 1.78; const soldados = new Map(), V3 = new THREE.Vector3();
    const nombreTropa = t => (root.DATA && root.DATA.UNITS && root.DATA.UNITS[t] && root.DATA.UNITS[t].n) || t;
    const vivo = u => u.estado === 'firme' || u.estado === 'duda';
    const yawDe = a => Math.atan2(Math.cos(a), -Math.sin(a));       /* ángulo del simulador (0 = +x) → giro de la figura (mira a +Z con 0) */

    /* ---------- escena ---------- */
    const lienzo = $('lienzo');
    const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    let dpr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr);
    C.prepararLuz(THREE, renderer);   /* la gradación de color de GM43e (js/gfx/campo-mando.js) */
    const escena = new THREE.Scene(), camara = new THREE.PerspectiveCamera(45, 1, 1, 12000);
    let entorno = null;
    let ancho = 0, alto = 0, vertical = true;
    let apie = null;     /* CG6: a pie, { id, f, yaw, v, tSig, talla, look, dir }: f es tu figura (el centurión); la mueve la palanca, no colocar() */
    function medir() {
      ancho = window.innerWidth; alto = window.innerHeight; vertical = alto > ancho;
      renderer.setSize(ancho, alto, false); camara.aspect = ancho / alto; camara.fov = apie ? (vertical ? 70 : 55) : vertical ? 54 : 40; camara.near = apie ? 0.1 : 1; camara.updateProjectionMatrix();
    }
    window.addEventListener('resize', medir); medir();
    const salidas = [() => window.removeEventListener('resize', medir)];

    /* ---------- cámara tipo Total War: alta y oblicua, mirando hacia el enemigo; d = distancia ---------- */
    const cam = { x: 0, z: 0, d: 300 }, D_MIN = 40, D_MAX = 900;
    const inclina = d => 0.62 + 0.36 * Math.min(1, Math.max(0, (d - D_MIN) / 600));    /* de cerca, más baja; de lejos, casi desde arriba */
    function ponCamara() {
      cam.d = Math.max(D_MIN, Math.min(D_MAX, cam.d)); cam.x = Math.max(-700, Math.min(700, cam.x)); cam.z = Math.max(-420, Math.min(420, cam.z));
      const p = inclina(cam.d); camara.position.set(cam.x, Math.sin(p) * cam.d, cam.z + Math.cos(p) * cam.d); camara.lookAt(cam.x, 0, cam.z); camara.updateMatrixWorld();
    }
    function camaraInicial() {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const u of S.man) if (vivo(u)) { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x); z0 = Math.min(z0, -u.y); z1 = Math.max(z1, -u.y); }
      if (x0 > x1) { x0 = -100; x1 = 100; z0 = -100; z1 = 100; }
      /* detrás de la legión, como en Total War: se ve el frente propio entero y, al fondo, el enemigo; lo demás, desplazando */
      let r0 = 1e9, r1 = -1e9; for (const u of S.man) if (vivo(u) && u.lado === 0 && u.tropa !== 'velites') { r0 = Math.min(r0, u.x - Sim.frente(u) / 2); r1 = Math.max(r1, u.x + Sim.frente(u) / 2); }
      if (r0 > r1) { r0 = x0; r1 = x1; }
      const tanH = Math.tan(camara.fov * Math.PI / 360) * camara.aspect, medio = (r1 - r0) / 2 + 20;
      cam.x = (r0 + r1) / 2; cam.d = Math.min(vertical ? 380 : 420, Math.max(140, medio / tanH * 1.05));
      /* el frente romano, a esta altura de la pantalla (de arriba abajo); se busca el punto que mira la cámara */
      let zR = -1e9; for (const u of S.man) if (vivo(u) && u.lado === 0 && u.tropa !== 'velites') zR = Math.max(zR, -u.y); if (zR < -1e8) zR = z1;
      const meta = vertical ? 0.6 : 0.68; let lo = zR - 400, hi = zR - 2;
      for (let k = 0; k < 30; k++) { cam.z = (lo + hi) / 2; ponCamara(); V3.set(cam.x, 0, zR - 3).project(camara); if (V3.z > 1 || (1 - V3.y) / 2 > meta) lo = cam.z; else hi = cam.z; }
      ponCamara();
    }

    /* ---------- figuras: cada manípulo, k figuras dentro de su rectángulo frente × fondo ---------- */
    const mans = [], figs = [], mallas = new Map();
    let Tv = 0, acum = 0, vel = 1, lista = false, cerrado = false, sel = [], varios = false, porFig = 4;
    let previo = S.man.map(u => ({ x: u.x, y: u.y, a: u.a }));
    function cuantas(u) {
      if (u.tropa === 'elefantes') return Math.max(2, Math.round(u.n0 / 3));
      if (!NUEVO[u.tropa]) return Math.max(3, Math.min(16, Math.round(u.n0 / (porFig * 2.5))));   /* a caballo (0 A.D., sin niveles de detalle: 3 300 triángulos cada uno): menos figuras */
      return Math.max(3, Math.min(40, Math.round(u.n0 / porFig)));
    }
    function preparar() {
      const total = S.man.reduce((s, u) => s + u.n0, 0); porFig = Math.max(3, total / MAXF);
      const cuenta = {};
      for (const u of S.man) {
        const k = cuantas(u), m = { id: u.id, k, por: u.n0 / k, fs: [], vivos: [] };
        for (let j = 0; j < k; j++) {
          const r = q => { const v = Math.sin((figs.length + 1) * 127.1 + q * 311.7) * 43758.5453; return v - Math.floor(v); };
          const f = { m: u.id, key: u.tropa, lado: u.lado, idx: figs.length, x: u.x, z: -u.y, yaw: yawDe(u.a), est: 0, t0: 0, fase: r(7), ritmo: 0.9 + 0.2 * r(8), ph: r(9) * 3,
            vr: [r(1), r(2), r(3), r(4)], talla: 0.96 + 0.08 * r(5), vq: ['quieto', 'quieto2', 'quieto3'][Math.floor(r(6) * 2.999)], jx: r(10) - 0.5, jy: r(11) - 0.5, ve: 0, marcha: 0, nv: 3, dc: 0 };
          const id = u.tropa + u.lado; f.slot = cuenta[id] = (cuenta[id] || 0) + 1; f.slot--;
          figs.push(f); m.fs.push(f); m.vivos.push(f);
        }
        mans[u.id] = m;
      }
      { const ref = [...soldados.values()].find(s => s.nombre === 'hastatus'), uh = getUnit('hastati'); altoN = uh ? uh.height : 1.78; escN = altoN / (ref ? ref.alto : ALTO_HASTATUS); }
      for (const id in cuenta) {
        const key = id.slice(0, -1), lado = +id.slice(-1), u = getUnit(key), N = soldados.get(id);
        if (N) { mallas.set(id, { u, N, nv: N.niveles.map(s => { const t = SOLD.tropa(s, cuenta[id]); escena.add(t.malla); return t; }) }); continue; }
        if (!u) continue;
        const g = instancedGeometry(u, cuenta[id]), malla = new THREE.InstancedMesh(g, unitMaterialReal(u, COLOR[lado]), cuenta[id]); malla.frustumCulled = false; escena.add(malla);
        mallas.set(id, { malla, fr: g.attributes.aFrame, u });
      }
      /* sombra de cada figura, alargada hacia donde la echa el sol bajo (sin mapa de sombras: no cuesta ni una llamada más) */
      const so = entorno.sombra, gso = new THREE.CircleGeometry(0.62, 12), kso = Math.max(1, 2.1 * so.largo / 1.24);
      gso.scale(1, kso, 1).translate(0, 0.62 * (kso - 1) * 0.92, 0).rotateX(-Math.PI / 2).rotateY(Math.atan2(so.dx, so.dz) + Math.PI);
      sombras = new THREE.InstancedMesh(gso, new THREE.MeshBasicMaterial({ color: '#1c140a', transparent: true, opacity: 0.34, depthWrite: false }), figs.length);
      sombras.frustumCulled = false; sombras.renderOrder = 1; escena.add(sombras);
      /* el rectángulo de cada manípulo en el suelo (borde grueso = su frente), y los fantasmas dorados del destino */
      const tex = texturaRect(), geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      const mat = () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
      rects = new THREE.InstancedMesh(geo, mat(), S.man.length); rects.frustumCulled = false; rects.renderOrder = 2; escena.add(rects);
      for (let i = 0; i < S.man.length; i++) rects.setColorAt(i, new THREE.Color('#fff'));
      fantasmas = new THREE.InstancedMesh(geo, mat(), S.man.length); fantasmas.frustumCulled = false; fantasmas.renderOrder = 3; fantasmas.count = 0; escena.add(fantasmas);
      fantasmas.material.opacity = 0.85; fantasmas.material.color.set('#ffd76a');
      flecha = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, -0.5), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
      flecha.renderOrder = 3; flecha.visible = false; escena.add(flecha);
      salidas.push(() => { tex.dispose(); geo.dispose(); });
      for (const u of S.man) { const b = document.createElement('div'); b.className = 'mn-e' + (u.lado ? ' ene' : ''); b.innerHTML = '<i class="h"><b></b></i><i class="m"><b></b></i><i class="f"><b></b></i>'; $('capa').appendChild(b); mans[u.id].barra = b; }
    }
    let sombras = null, rects = null, fantasmas = null, flecha = null;
    function texturaRect() {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 60);
      g.fillStyle = 'rgba(255,255,255,1)'; g.fillRect(0, 54, 64, 10);           /* el frente (abajo en el lienzo = delante en el suelo) */
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }

    /* reparto en filas dentro del rectángulo: fila 0 = la primera, la que lucha */
    function sitio(m, u, i, n, F, Df) {
      const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * F / Math.max(1, Df))))), filas = Math.ceil(n / cols), fila = Math.floor(i / cols), col = i % cols;
      const enFila = fila === filas - 1 ? n - fila * cols : cols;
      let ancho = F; if (u.forma === 'cuna') ancho = F * (0.3 + 0.7 * (fila + 0.5) / filas);
      const sueltos = u.forma === 'abierto' ? 0.8 : u.forma === 'testudo' || u.forma === 'falange' ? 0.08 : 0.3;
      const lx = ((col + 0.5) / enFila - 0.5) * ancho, ly = (0.5 - (fila + 0.5) / filas) * Df;
      return [lx, ly, fila, sueltos];
    }
    const mezclaAng = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

    /* mueve las figuras hacia su sitio. dt = segundos de batalla (0 en pausa); salto = colocarlas ya (tras saltar tiempo) */
    function colocar(dt, salto) {
      const al = Math.max(0, Math.min(1, acum / PASO));
      for (const u of S.man) {
        const m = mans[u.id]; if (!m) continue;
        const p0 = previo[u.id] || u, px = p0.x + (u.x - p0.x) * al, py = p0.y + (u.y - p0.y) * al, pa = mezclaAng(p0.a, u.a, al);
        let quiero = u.estado === 'caida' ? 0 : u.n <= 0 ? 0 : Math.max(1, Math.ceil(u.n / m.por - 0.35));
        if (u.estado === 'fuera') { for (const f of m.vivos) f.est = 2; m.vivos = []; continue; }
        const lucha = !!(S.cont && S.cont[u.id] && S.cont[u.id].length);
        while (m.vivos.length > quiero) {
          const cols = Math.max(1, Math.round(Math.sqrt(m.vivos.length * Sim.frente(u) / Math.max(1, Sim.fondo(u)))));
          const i = lucha ? Math.floor(Math.random() * Math.min(cols, m.vivos.length)) : Math.floor(Math.random() * m.vivos.length);
          let j = i; if (apie && m.vivos[j] === apie.f && m.vivos.length > 1) j = (j + 1) % m.vivos.length;
          const f = m.vivos.splice(j, 1)[0]; f.est = 1; f.t0 = Tv; if (salto) f.t0 = Tv - 9;
        }
        const F = Sim.frente(u), Df = Sim.fondo(u), c = Math.cos(pa), s = Math.sin(pa), yaw = yawDe(pa), n = m.vivos.length, roto = !vivo(u);
        const tira = u.tirando >= 0, rapido = /^(elefantes|equites|numidas|jinetes|tesalios|general)$/.test(u.tropa);
        for (let i = 0; i < n; i++) {
          if (apie && m.vivos[i] === apie.f) continue;   /* tú: te mueve la palanca */
          if (duelo && m.vivos[i] === duelo.g) continue;   /* tu galo: lo pone el duelo */
          const f = m.vivos[i], [lx0, ly0, fila, su] = sitio(m, u, i, n, F, Df), lx = lx0 + f.jx * su * 2, ly = ly0 + f.jy * su * 2;
          const tx = px + lx * s + ly * c, ty = py - lx * c + ly * s, TX = tx, TZ = -ty;
          const k = salto || dt <= 0 ? (salto ? 1 : 0) : 1 - Math.exp(-dt * 5);
          const ox = f.x, oz = f.z; f.x += (TX - f.x) * k; f.z += (TZ - f.z) * k;
          const dx = f.x - ox, dz = f.z - oz, dd = Math.hypot(dx, dz), v = dt > 0 ? dd / dt : 0;
          f.ve = dt > 0 ? f.ve + (v - f.ve) * Math.min(1, dt * 4) : f.ve; if (salto) f.ve = 0;
          let yawM = yaw; const atras = dd > 1e-3 && (dx * Math.sin(yaw) + dz * Math.cos(yaw)) < -0.3 * dd;
          if (roto && dd > 1e-3) yawM = Math.atan2(dx, dz);
          f.yaw = salto ? yawM : mezclaAng(f.yaw, yawM, Math.min(1, dt * 4));
          f.marcha = f.ve < 0.35 ? 0 : f.ve > (rapido ? 5 : 2.6) ? 2 : 1;
          if (f.marcha) f.fase += (atras ? -1 : 1) * dd / (f.marcha === 2 ? 2.4 : 1.5) / TALLA;
          f.fila = fila; f.lucha = lucha && fila === 0 && !roto; f.tira = tira && !roto; f.forma = u.forma; f.aguanta = u.orden === 'aguantar' || u.postura === 'escudos';
        }
      }
    }

    /* qué movimiento hace cada figura: [clip, valor, modo] con modo 'c' ciclo (fase), 'p' fracción del clip (0–1), 's' segundos */
    function movimiento(f) {
      if (f.est === 1) return ['morir', (Tv - f.t0) / 2.4, 'p'];
      if (f.dClip != null) return [f.dLanza ? 'lanzar' : 'golpear', f.dClip, 'p'];   /* CG6b: tu duelo */
      if (f.dPara) return ['cubrirse', PARADA_N, 'p'];
      if (f.marcha === 2) return ['correr', f.fase, 'c'];
      if (f.marcha === 1) return ['andar', f.fase, 'c'];
      if (f.lucha) { const q = ((Tv * f.ritmo + f.ph) / 2.2) % 1; return q < 0.45 ? ['golpear', q / 0.45, 'p'] : q < 0.75 ? ['cubrirse', (q - 0.45) / 0.3 * PARADA_N, 'p'] : ['guardia', Tv + f.ph, 's']; }
      if (f.tira) { const q = ((Tv * f.ritmo + f.ph) / 2.8) % 1; return q < 0.62 ? ['lanzar', q / 0.62, 'p'] : [f.vq, Tv + f.ph, 's']; }
      if (f.forma === 'testudo' || f.forma === 'muro') return ['cubrirse', PARADA_N, 'p'];
      if (f.aguanta || f.dGuardia) return ['guardia', Tv + f.ph, 's'];
      return [f.vq, Tv + f.ph, 's'];
    }
    const VIEJO = { quieto: 'idle', quieto2: 'idle', quieto3: 'idle', guardia: 'idle', andar: 'walk', correr: 'run', golpear: 'attack_melee', cubrirse: 'attack_melee', lanzar: 'attack_ranged', morir: 'death' };

    function niveles() {
      const kpx = alto / (2 * Math.tan(camara.fov * Math.PI / 360)), cp = camara.position, h = altoN * TALLA, cuenta = [[], []];
      for (const f of figs) {
        if (f.est === 2) continue;
        const d = Math.max(0.1, Math.hypot(f.x - cp.x, h / 2 - cp.y, f.z - cp.z)), px = h * kpx / d;
        let nv = px >= UMBRAL_N[0] ? 0 : px >= UMBRAL_N[1] ? 1 : px >= UMBRAL_N[2] ? 2 : 3;
        if (apie && f === apie.f) { f.nv = 0; f.dc = 0; cuenta[0].push(f); continue; }
        if (nv < 3) { V3.set(f.x, h / 2, f.z).project(camara); if (V3.z > 1 || Math.abs(V3.x) > 1.1 || Math.abs(V3.y) > 1.1) nv = 3; }
        f.nv = nv; f.dc = d; if (nv < 2) cuenta[nv].push(f);
      }
      for (let k = 0; k < 2; k++) if (cuenta[k].length > TOPE_N[k]) { cuenta[k].sort((p, q) => p.dc - q.dc); for (let i = TOPE_N[k]; i < cuenta[k].length; i++) { cuenta[k][i].nv = k + 1; if (k === 0) cuenta[1].push(cuenta[k][i]); } }
    }
    function pintarFiguras() {
      for (const m of mallas.values()) if (m.nv) for (const t of m.nv) t.limpiar();
      niveles();
      const sm = sombras.instanceMatrix.array;
      for (const f of figs) {
        const m = mallas.get(f.key + f.lado), q = f.idx * 16;
        if (!m || f.est === 2) { for (let k = 0; k < 16; k++) sm[q + k] = 0; if (m && !m.nv) { const a = m.malla.instanceMatrix.array; for (let k = 0; k < 16; k++) a[f.slot * 16 + k] = 0; } continue; }
        const [clip, val, modo] = movimiento(f);
        let a, o, sc;
        if (m.nv) {
          const tr = m.nv[f.nv], ii = tr.sig(); if (ii < 0) continue; a = tr.malla.instanceMatrix.array; o = ii * 16; sc = escN * f.talla * TALLA;
          const k = tr.s.j.clips[clip] ? clip : 'quieto', cl = tr.s.j.clips[k], dur = (cl.n - 1) / cl.fps, tt = modo === 's' ? val : modo === 'c' ? (val - Math.floor(val)) * dur : Math.min(1, Math.max(0, val)) * dur;
          tr.vars(ii, f.vr); tr.pose(ii, k, tt, tr.muestra(k, tt));
        } else {
          a = m.malla.instanceMatrix.array; o = f.slot * 16; sc = UNIT_SCALE * TALLA;
          const Cl = m.u.clips, cl = Cl[VIEJO[clip]] || Cl.attack_melee || Cl.idle;
          m.fr.array[f.slot] = !cl ? 0 : modo === 'c' ? cl.start + Math.min(cl.frames - 1, Math.floor((val - Math.floor(val)) * cl.frames)) : modo === 'p' ? frameOnce(cl, Math.min(1, Math.max(0, val)) * cl.dur) : frameOf(cl, val);
        }
        const c = Math.cos(f.yaw) * sc, s = Math.sin(f.yaw) * sc;
        a[o] = c; a[o + 1] = 0; a[o + 2] = -s; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = sc; a[o + 6] = 0; a[o + 7] = 0;
        a[o + 8] = s; a[o + 9] = 0; a[o + 10] = c; a[o + 11] = 0; a[o + 12] = f.x; a[o + 13] = 0; a[o + 14] = f.z; a[o + 15] = 1;
        const e = f.est === 0 ? (m.nv ? 1 : 1.5) * TALLA : 0;
        sm[q] = e; sm[q + 1] = 0; sm[q + 2] = 0; sm[q + 3] = 0; sm[q + 4] = 0; sm[q + 5] = 1; sm[q + 6] = 0; sm[q + 7] = 0; sm[q + 8] = 0; sm[q + 9] = 0; sm[q + 10] = e; sm[q + 11] = 0; sm[q + 12] = f.x; sm[q + 13] = 0.03; sm[q + 14] = f.z; sm[q + 15] = 1;
      }
      for (const m of mallas.values()) { if (m.nv) { for (const t of m.nv) t.malla.instanceMatrix.needsUpdate = true; continue; } m.malla.instanceMatrix.needsUpdate = true; m.fr.needsUpdate = true; }
      sombras.instanceMatrix.needsUpdate = true;
    }

    /* ---------- rectángulos en el suelo, fantasmas y flecha ---------- */
    const MT = new THREE.Matrix4(), QT = new THREE.Quaternion(), PT = new THREE.Vector3(), ST = new THREE.Vector3(), YT = new THREE.Vector3(0, 1, 0), CT = new THREE.Color();
    const C_PROPIO = new THREE.Color('#e0483a'), C_RIVAL = new THREE.Color('#9a78e0'), C_SEL = new THREE.Color('#ffd76a'), C_ROTO = new THREE.Color('#77716a');
    function rect(malla, i, x, y, a, F, Df, h) { PT.set(x, h, -y); QT.setFromAxisAngle(YT, yawDe(a)); ST.set(F + 3, 1, Df + 3); MT.compose(PT, QT, ST); malla.setMatrixAt(i, MT); }
    let arrastre = null;      /* { dx, dy, a } mientras se arrastra una orden */
    function pintarSuelo() {
      rects.visible = fantasmas.visible = !apie; if (apie) { flecha.visible = false; return; }
      const al = Math.max(0, Math.min(1, acum / PASO));
      for (const u of S.man) {
        const p0 = previo[u.id] || u, fuera = u.estado === 'fuera' || u.estado === 'caida';
        rect(rects, u.id, p0.x + (u.x - p0.x) * al, p0.y + (u.y - p0.y) * al, mezclaAng(p0.a, u.a, al), fuera ? 0 : Sim.frente(u), fuera ? 0 : Sim.fondo(u), sel.includes(u.id) ? 0.09 : 0.06);
        if (fuera) { ST.set(0, 0, 0); MT.compose(PT, QT, ST); rects.setMatrixAt(u.id, MT); }
        CT.copy(sel.includes(u.id) ? C_SEL : !vivo(u) ? C_ROTO : u.lado === 0 ? C_PROPIO : C_RIVAL); if (!sel.includes(u.id)) CT.multiplyScalar(0.8); rects.setColorAt(u.id, CT);
      }
      rects.instanceMatrix.needsUpdate = true; if (rects.instanceColor) rects.instanceColor.needsUpdate = true;
      let n = 0; flecha.visible = false;
      if (arrastre) {
        let cx = 0, cy = 0; const us = sel.map(i => S.man[i]); for (const u of us) { cx += u.x / us.length; cy += u.y / us.length; }
        for (const u of us) rect(fantasmas, n++, u.x + arrastre.dx, u.y + arrastre.dy, arrastre.a, Sim.frente(u), Sim.fondo(u), 0.12);
        const L = Math.hypot(arrastre.dx, arrastre.dy);
        if (L > 2) { flecha.visible = true; flecha.position.set(cx + arrastre.dx, 0.11, -(cy + arrastre.dy)); flecha.rotation.set(0, Math.atan2(-arrastre.dx, arrastre.dy), 0); flecha.scale.set(2.2, 1, L); }
      } else for (const i of sel) { const u = S.man[i]; if (u.dest && vivo(u) && Math.hypot(u.dest.x - u.x, u.dest.y - u.y) > 4) rect(fantasmas, n++, u.dest.x, u.dest.y, u.dest.a !== undefined ? u.dest.a : u.a, Sim.frente(u), Sim.fondo(u), 0.12); }
      fantasmas.count = n; fantasmas.instanceMatrix.needsUpdate = true;
    }

    /* ---------- barras sobre cada manípulo: hombres, moral, cansancio ---------- */
    function pintarBarras() {
      if (apie) return;   /* a pie no hay barras (las oculta también mando.css) */
      const al = Math.max(0, Math.min(1, acum / PASO)), y = altoN * TALLA * 1.9;
      for (const u of S.man) {
        const m = mans[u.id]; if (!m || !m.barra) continue; const b = m.barra;
        if (u.estado === 'fuera' || u.estado === 'caida') { if (!b.hidden) b.hidden = true; continue; }
        const p0 = previo[u.id] || u; V3.set(p0.x + (u.x - p0.x) * al, y, -(p0.y + (u.y - p0.y) * al)).project(camara);
        if (V3.z > 1 || Math.abs(V3.x) > 1.05 || Math.abs(V3.y) > 1.05) { if (!b.hidden) b.hidden = true; continue; }
        b.hidden = false; b.style.transform = 'translate3d(' + Math.round((V3.x + 1) / 2 * ancho) + 'px,' + Math.round((1 - V3.y) / 2 * alto) + 'px,0)';
        const cl = 'mn-e' + (u.lado ? ' ene' : '') + (sel.includes(u.id) ? ' sel' : '') + (!vivo(u) ? ' roto' : '');
        if (b.className !== cl) b.className = cl;
        const [h, mo, fa] = b.children, pon = (i, v) => { const w = Math.round(Math.max(0, Math.min(1, v)) * 100) + '%'; if (i.firstChild.style.width !== w) i.firstChild.style.width = w; };
        pon(h, u.n / u.n0); pon(mo, u.moral); pon(fa, 1 - u.fatiga);
      }
    }

    /* ---------- ficha y botones de la selección ---------- */
    const FORMAS = Sim.FORMAS, SABE = Sim.SABE;
    const ORD = { cargar: ['Cargar', 'al más cercano'], relevar: ['Relevar', 'entra la fresca'], retirar: ['Retroceder', '80 m atrás'], aguantar: ['Aguantar', 'escudos juntos'], formar: ['Formar…', 'cambiar forma'], devolver: ['Al tribuno', 'que lo lleve él'] };
    let verFormas = false, hudClave = '';
    function puedeYa(o) { return Sim.puede(S, Object.assign({ lado: 0, ids: sel, x: 0, y: 0 }, o)); }
    function pintarHud(fuerza) {
      sel = sel.filter(i => S.man[i] && vivo(S.man[i]));
      const t = Math.floor(S.t), reloj = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); if ($('reloj').textContent !== reloj) $('reloj').textContent = reloj;
      if (apie) { const u = S.man[apie.id], p = Sim.palabras(u, S), t = u.nom + ': ' + Math.round(u.n) + ' hombres, ' + p.animo + ', ' + p.cansancio + (p.combate ? ', ' + p.combate : ''); if ($('estado').textContent !== t) $('estado').textContent = t; }
      if (apie) pintarApieo(fuerza);
      const ft = $('ficha-t'), od = $('ordenes');
      let html = '', ords = '';
      if (!sel.length) { html = '<span class="ayuda">Toca un manípulo tuyo (rojo) para mandarlo. Arrastra el campo para mirar; pellizca para acercar.</span>'; }
      else {
        const us = sel.map(i => S.man[i]);
        if (us.length === 1) {
          const u = us[0], p = Sim.palabras(u, S), tono = { firme: 'bien', duda: 'medio', rompe: 'mal' }[p.animo] || '', tc = { fresca: 'bien', cansada: 'medio', agotada: 'mal' }[p.cansancio] || '', tb = { ganando: 'bien', igualado: 'medio', perdiendo: 'mal' }[p.combate] || '';
          html = '<b>' + esc(u.nom) + '</b> <small>' + esc(FORMAS[u.forma].n) + (u.cambio > 0 ? ' (formando)' : '') + ' · ' + (u.mando === 'jugador' ? 'lo llevas tú' : 'lo lleva el tribuno') + '</small><br>' +
            '<span>' + Math.round(u.n) + ' de ' + u.n0 + ' hombres</span> <em class="' + tono + '">' + esc(p.animo) + '</em> <em class="' + tc + '">' + esc(p.cansancio) + '</em>' + (p.combate ? ' <em class="' + tb + '">' + esc(p.combate) + '</em>' : '');
        } else html = '<b>' + us.length + ' manípulos</b><br><span>' + Math.round(us.reduce((s, u) => s + u.n, 0)) + ' hombres</span>';
        const boton = (o, que, sub, on) => { const no = puedeYa(o); return '<button type="button" class="mn-o' + (no ? ' no' : '') + (on ? ' on' : '') + '" data-o="' + esc(JSON.stringify(o)) + '" data-no="' + esc(no) + '"><span>' + esc(que) + '</span><small>' + esc(sub) + '</small></button>'; };
        if (verFormas) {
          const formas = []; for (const u of us) for (const f of (SABE[u.tropa] || ['linea', 'columna'])) if (!formas.includes(f)) formas.push(f);
          ords = formas.map(f => boton({ tipo: 'formar', forma: f }, FORMAS[f].n, ({ linea: 'la de siempre', columna: 'para marchar', cuna: 'rompe líneas', abierto: 'menos bajas al tiro', testudo: 'bajo los proyectiles', muro: 'para la carga', falange: 'picas de frente' })[f] || '', us.every(u => u.forma === f))).join('') +
            '<button type="button" class="mn-o b" data-volver="1"><span>Volver</span><small>a las órdenes</small></button>';
        } else {
          ords = ['cargar', 'relevar', 'retirar', 'aguantar'].map(k => boton({ tipo: k }, ORD[k][0], ORD[k][1])).join('') +
            '<button type="button" class="mn-o" data-formas="1"><span>' + ORD.formar[0] + '</span><small>' + ORD.formar[1] + '</small></button>' +
            (us.some(u => u.mando === 'jugador') ? boton({ tipo: 'devolver' }, ORD.devolver[0], ORD.devolver[1]) : '') +
            (us.length === 1 ? (no => '<button type="button" class="mn-o' + (no ? ' no' : '') + '" data-bajar="1" data-no="' + esc(no) + '"><span>Bajar</span><small>a pie, con ellos</small></button>')(puedeBajar(us[0].id)) : '');
        }
      }
      const clave = html + '|' + ords + '|' + varios;
      if (clave !== hudClave || fuerza) { hudClave = clave; ft.innerHTML = html; od.innerHTML = ords; od.hidden = !ords; $('varios').setAttribute('aria-pressed', varios ? 'true' : 'false'); $('varios').classList.toggle('on', varios); }
    }
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    let avisoHasta = 0;
    function aviso(txt) { const a = $('aviso'); a.textContent = txt; a.hidden = false; avisoHasta = performance.now() + 2600; }
    function ordenar(o) {
      const ord = Object.assign({ lado: 0, ids: sel.slice() }, o), no = Sim.ordenar(S, ord);
      if (no) aviso(no); else if (o.tipo === 'formar' || o.tipo === 'devolver') verFormas = false;
      pintarHud(true); return no;
    }
    $('ordenes').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !lista) return;
      if (b.dataset.formas) { verFormas = true; pintarHud(true); return; }
      if (b.dataset.volver) { verFormas = false; pintarHud(true); return; }
      if (b.dataset.no) { aviso(b.dataset.no); return; }
      if (b.dataset.bajar) { bajar(sel[0]); return; }
      ordenar(JSON.parse(b.dataset.o));
    });
    $('varios').addEventListener('click', () => { varios = !varios; pintarHud(true); });
    /* CG6b: a pie, una fila de órdenes para TU manípulo: Cargad, Aguantar, Relevo y Formar (las formas de su tropa, Sim.ordenesDe) */
    let apieForm = false, apieClave = '';
    function pintarApieo(fuerza) {
      const u = S.man[apie.id], os = Sim.ordenesDe(S, apie.id), no = t => (os.find(o => o.tipo === t) || {}).no || '';
      const b = (o, txt, n, on) => '<button type="button" class="' + (n ? 'no' : '') + (on ? ' on' : '') + '" data-o="' + esc(JSON.stringify(o)) + '" data-no="' + esc(n) + '">' + esc(txt) + '</button>';
      const h = apieForm ? os.filter(o => o.tipo === 'formar').map(o => b({ tipo: 'formar', forma: o.forma }, o.nombre, o.no, u.forma === o.forma)).join('') + '<button type="button" class="b" data-volver="1">Volver</button>'
        : b({ tipo: 'cargar' }, 'Cargad', no('cargar')) + b({ tipo: 'aguantar' }, 'Aguantar', no('aguantar'), u.orden === 'aguantar') + b({ tipo: 'relevar' }, 'Relevo', no('relevar')) + '<button type="button" data-formas="1">Formar…</button>';
      if (h !== apieClave || fuerza) { apieClave = h; $('apieo').innerHTML = h; }
    }
    $('apieo').addEventListener('pointerdown', e => e.stopPropagation());
    $('apieo').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !apie) return;
      if (b.dataset.formas) { apieForm = true; pintarHud(true); return; }
      if (b.dataset.volver) { apieForm = false; pintarHud(true); return; }
      if (b.dataset.no) { aviso(b.dataset.no); return; }
      const o = JSON.parse(b.dataset.o), no = Sim.ordenar(S, Object.assign({ lado: 0, ids: [apie.id] }, o));
      if (no) aviso(no); else { if (o.tipo === 'formar') apieForm = false; aviso(o.tipo === 'formar' ? 'Formad: ' + FORMAS[o.forma].n : { cargar: '¡Cargad!', aguantar: '¡Aguantad!', relevar: 'Relevo: entra la línea de atrás' }[o.tipo]); }
      pintarHud(true);
    });

    /* ---------- CG6: a pie, desde el hombro (CG1 §5.3 y §7). Eres el centurión: una figura de la primera fila que mueve la palanca.
       El manípulo te sigue con órdenes «mover» del simulador (una sola verdad); no puedes alejarte más de 15 m de su frente.
       En esta tanda no hay lucha a pie: solo bajar, mirar, andar, correr y volver al mando. ---------- */
    const V_ANDA = 1.6, V_CORRE = 5, LIBRE = 4, CORREA = 15, CAM_AP = { atras: 3.2, alto: 1.9, lado: 0.6, mira: 12 },
      CAM_DU = { h: { atras: 4.2, alto: 2.3, lado: 1.5, mira: 5, mlado: 0.5, ly: 0.2 }, v: { atras: 6, alto: 2.8, lado: 1.6, mira: 4, mlado: 0.4, ly: 0.1 } };
    const palanca = { x: 0, y: 0 };
    const simA = yaw => Math.atan2(-Math.cos(yaw), Math.sin(yaw));      /* giro de figura → ángulo del simulador (inverso de yawDe) */
    function puedeBajar(id) {
      const u = S.man[id];
      if (!lista) return 'Aún se están formando'; if (S.fase === 'fin') return 'La batalla ha terminado';
      if (!u || u.lado !== 0) return 'Solo puedes bajar con los tuyos';
      if (!vivo(u)) return 'Están rotos: no te seguirían';
      const m = mallas.get(u.tropa + '0');
      if (!NUEVO[u.tropa] || !m || !m.nv) return 'A pie, de momento, solo con la infantería';
      if (!mans[id] || !mans[id].vivos.length) return 'No queda nadie en pie';
      return '';
    }
    /* dónde te toca: delante del centro de su frente */
    function puesto(u) { const L = Sim.fondo(u) / 2 + 2; return { x: u.x + Math.cos(u.a) * L, y: u.y + Math.sin(u.a) * L }; }
    function bajar(id) {
      const no = puedeBajar(id); if (no) { aviso(no); return no; }
      const u = S.man[id], m = mans[id], F = Sim.frente(u), Df = Sim.fondo(u), n = m.vivos.length;
      let f = m.vivos[0], mejor = 1e9;
      for (let i = 0; i < n; i++) { const [lx, , fila] = sitio(m, u, i, n, F, Df); if (fila === 0 && Math.abs(lx) < mejor) { mejor = Math.abs(lx); f = m.vivos[i]; } }
      apie = { id, f, yaw: yawDe(u.a), v: 0, tSig: S.t, talla: f.talla, camYaw: yawDe(u.a), look: null };
      { const p = puesto(u); f.x = p.x; f.z = -p.y; f.yaw = apie.yaw; }   /* sales un paso por delante de tu primera fila */
      f.talla = f.talla * 1.08; f.lucha = f.tira = false; f.aguanta = false; f.forma = 'linea';
      if (!aro) { aro = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.78, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false })); aro.renderOrder = 3; escena.add(aro); salidas.push(() => { aro.geometry.dispose(); aro.material.dispose(); }); }
      aro.visible = true; aro.position.set(f.x, 0.05, f.z);
      arrastre = null; gesto = null; dedos.clear(); verFormas = false; sel = [id];
      el.classList.add('apie'); medir(); camaraApie(0, true); pintarHud(true);
      return '';
    }
    function subir(motivo) {
      if (!apie) return; acabaDuelo(); const { id, f } = apie; f.talla = apie.talla; apie = null; soltarPalanca(); gesto = null; dedos.clear();
      if (aro) aro.visible = false; el.classList.remove('apie'); medir();
      const u = S.man[id]; cam.x = u.x; cam.z = -u.y; ponCamara();
      sel = vivo(u) ? [id] : []; pintarHud(true); if (motivo) aviso(motivo);
    }
    let aro = null;
    /* la palanca: tú andas o corres (dt = segundos de batalla); el manípulo te sigue */
    function andarApie(dt) {
      const u = S.man[apie.id], f = apie.f;
      if (S.fase === 'fin') { subir(); return; }
      if (!vivo(u)) { subir(u.estado === 'caida' || u.n <= 0 ? 'Tu manípulo ha caído: vuelves al mando' : 'Tu manípulo ha roto: vuelves al mando'); return; }
      if (f.est !== 0) { subir('Has caído: vuelves al mando'); return; }
      if (dt <= 0) return;
      lucharApie(dt / vel); if (!apie) return;
      const L = duelo ? 0 : Math.min(1, Math.hypot(palanca.x, palanca.y)), vObj = L < 0.15 ? 0 : L > 0.8 ? V_CORRE : V_ANDA;
      apie.v += Math.max(-6 * dt, Math.min((vObj > V_ANDA ? 4 : 3) * dt, vObj - apie.v));
      const cy = apie.yaw, fx = Math.sin(cy), fz = Math.cos(cy), rx = -Math.cos(cy), rz = Math.sin(cy);
      let dx = 0, dz = 0;
      if (L > 0.15) { const k = 1 / L; dx = (fx * -palanca.y + rx * palanca.x) * k; dz = (fz * -palanca.y + rz * palanca.x) * k; }
      const ox = f.x, oz = f.z;
      if (apie.v > 0.01) { if (L > 0.15) apie.dir = [dx, dz]; const d = apie.dir || [fx, fz]; f.x += d[0] * apie.v * dt; f.z += d[1] * apie.v * dt; }
      /* la correa: no te sueltas de los tuyos */
      const p = puesto(u), ex = f.x - p.x, ey = -f.z - p.y, el2 = Math.hypot(ex, ey);
      if (el2 > CORREA) { f.x = p.x + ex * CORREA / el2; f.z = -(p.y + ey * CORREA / el2); }
      const mx = f.x - ox, mz = f.z - oz, dd = Math.hypot(mx, mz);
      f.ve = dd / dt; f.marcha = f.ve < 0.35 ? 0 : f.ve > 2.6 ? 2 : 1; f.fila = 0;
      if (f.marcha) f.fase += dd / (f.marcha === 2 ? 2.4 : 1.5) / TALLA;
      f.yaw = mezclaAng(f.yaw, dd > 1e-3 ? Math.atan2(mx, mz) : apie.yaw, Math.min(1, dt * 6));
      if (aro) aro.position.set(f.x, 0.05, f.z);
      /* cada segundo de batalla: si te has ido de tu puesto (o miras a otro lado), el manípulo viene a ponerse detrás de ti */
      /* CG6b: cada 0,25 s, y con el destino adelantado medio segundo a tu paso, para que al correr vayan pegados (mover con vel) */
      if (S.t - apie.tSig >= 0.25) {
        apie.tSig = S.t;
        const a = simA(apie.yaw), giro = Math.abs(mezclaAng(u.a, a, 1) - u.a), anda = apie.v > 0.3, d = apie.dir || [0, 0];
        const ocupado = (u.orden === 'cargar' || u.orden === 'aguantar' || u.relevo > 0) && !anda;   /* tu Cargad o Aguantar no lo pisa el seguirte */
        if (!ocupado && (anda || Math.hypot(f.x - p.x, -f.z - p.y) > LIBRE || giro > 0.7)) {
          const B = Sim.fondo(u) / 2 + 2, ade = anda ? apie.v * 0.5 : 0;
          Sim.ordenar(S, { tipo: 'mover', lado: 0, ids: [apie.id], x: f.x + d[0] * ade - Math.cos(a) * B, y: -(f.z + d[1] * ade) - Math.sin(a) * B, a, vel: anda ? apie.v : 0 });
        }
      }
    }
    /* ---------- CG6b: tu duelo a pie. Al tocar los tuyos al enemigo (S.cont), el galo más cercano viene a ponerse delante de ti.
       Las reglas son las de la maqueta TP8b (Sim.duelo / Sim.dueloPaso, lógica pura); aquí solo se ve y se toca. ---------- */
    let duelo = null, pide = null; const D_DUELO = 1.6;
    function galoCerca(rid) { const m = mans[rid], f = apie.f; if (!m) return null; let g = null, d = 1e9; for (const x of m.vivos) { const e = Math.hypot(x.x - f.x, x.z - f.z); if (x.est === 0 && e < d) { d = e; g = x; } } return g; }
    function sueltaFig(x) { if (x) { x.dClip = null; x.dPara = false; x.dGuardia = false; x.dLanza = false; } }
    function acabaDuelo() { if (!duelo) return; sueltaFig(duelo.g); sueltaFig(apie && apie.f); duelo = null; pide = null; el.classList.remove('duelo'); }
    function caeFig(id, x) { x.est = 1; x.t0 = Tv; sueltaFig(x); const v = mans[id].vivos, i = v.indexOf(x); if (i >= 0) v.splice(i, 1); }
    function lucharApie(dt) {
      const id = apie.id, c = (S.cont[id] || []).filter(k => vivo(S.man[k.id]) && Sim.aPie(S.man[k.id].tropa)), ce = c.find(k => k.cara === 'frente') || c[0];   /* CG6b: el duelo, solo contra infantes */
      if (!ce) { acabaDuelo(); return; }
      if (!duelo) {
        const g = galoCerca(ce.id); if (!g) return;
        duelo = { D: Sim.duelo(id * 131 + Math.round(S.t * 10)), rid: ce.id, g, visto: 0 };
        apie.yaw = Math.atan2(g.x - apie.f.x, g.z - apie.f.z); el.classList.add('duelo'); aviso('¡Un galo viene a por ti!');
      }
      if (duelo.g.est !== 0 || !mans[duelo.rid].vivos.includes(duelo.g)) { const g = galoCerca(duelo.rid); if (!g) { acabaDuelo(); return; } duelo.g = g; }
      const D = duelo.D, hechos = Sim.dueloPaso(D, dt, pide); pide = null;
      for (const h of hechos) {
        if (h === 'mata') { caeFig(duelo.rid, duelo.g); Sim.apie(S, id, { mata: 1 }); const g = galoCerca(duelo.rid); if (!g) { acabaDuelo(); return; } duelo.g = g; }
        else if (h === 'herido') Sim.apie(S, id, { heridas: 1 });
        else if (h === 'cae') {
          Sim.apie(S, id, { cae: 1 }); const viejo = apie.f, v = mans[id].vivos.filter(x => x !== viejo && x.est === 0); viejo.talla = apie.talla; caeFig(id, viejo);
          if (!v.length) { subir('No queda nadie en pie: vuelves al mando'); return; }
          let nf = v[0], d = 1e9; for (const x of v) { const e = Math.hypot(x.x - viejo.x, x.z - viejo.z); if (e < d) { d = e; nf = x; } }
          apie.f = nf; apie.talla = nf.talla; nf.talla *= 1.08; nf.lucha = nf.tira = nf.aguanta = false; nf.forma = 'linea'; nf.x = viejo.x; nf.z = viejo.z;
        }
      }
      for (; duelo.visto < D.eco.length; duelo.visto++) aviso(D.eco[duelo.visto].texto);
      /* tu galo: se acerca y se pone delante, de cara a ti; al empujarlo recula un paso */
      const v = Sim.dueloVer(D), f = apie.f, g = duelo.g, yaw = apie.yaw, L = D_DUELO + (v.abierto && D.T < D.deseq ? 0.45 : 0);
      const tx = f.x + Math.sin(yaw) * L, tz = f.z + Math.cos(yaw) * L, k = 1 - Math.exp(-dt * 3), ox = g.x, oz = g.z;
      g.x += (tx - g.x) * k; g.z += (tz - g.z) * k; const dd = Math.hypot(g.x - ox, g.z - oz);
      g.ve = dt > 0 ? dd / dt : 0; g.marcha = g.ve > 0.35 ? 1 : 0; if (g.marcha) g.fase += dd / 1.5 / TALLA; g.yaw = mezclaAng(g.yaw, yaw + Math.PI, Math.min(1, dt * 6));
      g.dClip = g.marcha ? null : v.clipG; g.dGuardia = true; g.lucha = false;
      f.dClip = v.clipR; f.dLanza = v.tuPilum; f.dPara = v.parando && v.clipR == null; f.dGuardia = true; f.yaw = mezclaAng(f.yaw, yaw, Math.min(1, dt * 6));
      pintarLucha(v);
    }
    const anillo = $('anillo'), fuelleB = $('fuelle').querySelector('b');
    function pintarLucha(v) {
      fuelleB.style.width = v.fuelle + '%'; fuelleB.style.background = v.fuelle < v.costes.golpear ? '#c0452f' : '#e9c063';
      $('heridas').textContent = 'Heridas ' + v.heridas + ' de 3';
      for (const b of $('lucha').querySelectorAll('button')) { const q = b.dataset.g; b.classList.toggle('no', q === 'pilum' ? !v.pilum : v.fuelle < v.costes[q]); }
      const a = v.aviso; anillo.hidden = !a; if (!a) return;
      const g = duelo.g; V3.set(g.x, altoN * TALLA * 0.8, g.z).project(camara);
      const fr = Math.min(1, a.frac), r = Math.round(240 - 30 * fr), gg = Math.round(176 - 140 * fr);
      anillo.style.left = Math.round((V3.x + 1) / 2 * ancho) + 'px'; anillo.style.top = Math.round((1 - V3.y) / 2 * alto) + 'px';
      anillo.firstElementChild.style.transform = 'scale(' + (1.7 - 1.2 * fr).toFixed(3) + ')'; anillo.firstElementChild.style.borderColor = a.ventana || a.imparable ? '#e8341f' : 'rgb(' + r + ',' + gg + ',40)';
      anillo.lastElementChild.textContent = a.imparable ? '¡No se para!' : a.ventana ? '¡Para!' : '';
    }
    for (const b of $('lucha').querySelectorAll('button')) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (duelo) pide = b.dataset.g; });
    /* la cámara al hombro: detrás y a la derecha, mirando 12 m delante; suavizada (dt real) */
    function camaraApie(dt, salto) {
      const f = apie.f, y = apie.yaw, fx = Math.sin(y), fz = Math.cos(y), rx = -Math.cos(y), rz = Math.sin(y), K = TALLA;
      const C = duelo ? (ancho < alto ? CAM_DU.v : CAM_DU.h) : CAM_AP;   /* CG6b: en duelo, más atrás y sobre el hombro derecho */
      const tx = f.x - fx * C.atras * K + rx * C.lado * K, tz = f.z - fz * C.atras * K + rz * C.lado * K, ty = C.alto * K;
      const lx = f.x + fx * C.mira + rx * (C.mlado || 0) * K, lz = f.z + fz * C.mira + rz * (C.mlado || 0) * K, ly = C.ly || 1.1;
      const k = salto ? 1 : 1 - Math.exp(-dt * 7), P = camara.position;
      if (!apie.look || salto) apie.look = { x: lx, y: ly, z: lz };
      P.set(P.x + (tx - P.x) * k, P.y + (ty - P.y) * k, P.z + (tz - P.z) * k);
      const L = apie.look; L.x += (lx - L.x) * k; L.y += (ly - L.y) * k; L.z += (lz - L.z) * k;
      camara.lookAt(L.x, L.y, L.z); camara.updateMatrixWorld();
    }
    /* la palanca del pulgar izquierdo (HTML): a fondo, correr; poco, andar */
    const pal = $('palanca'), pomo = pal.firstElementChild; let dedoPal = null;
    function ponPalanca(x, y) { const L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; } palanca.x = x; palanca.y = y; pomo.style.transform = 'translate(' + Math.round(x * 38) + 'px,' + Math.round(y * 38) + 'px)'; }
    function soltarPalanca() { dedoPal = null; ponPalanca(0, 0); }
    function dedoEnPalanca(e) { const r = pal.getBoundingClientRect(), R = r.width / 2 - 18; ponPalanca((e.clientX - r.left - r.width / 2) / R, (e.clientY - r.top - r.height / 2) / R); }
    pal.addEventListener('pointerdown', e => { if (!apie) return; e.preventDefault(); dedoPal = e.pointerId; pal.setPointerCapture && pal.setPointerCapture(e.pointerId); dedoEnPalanca(e); });
    pal.addEventListener('pointermove', e => { if (e.pointerId === dedoPal) dedoEnPalanca(e); });
    for (const t of ['pointerup', 'pointercancel']) pal.addEventListener(t, e => { if (e.pointerId === dedoPal) soltarPalanca(); });
    $('subir').addEventListener('click', () => subir());

    /* ---------- avisos en palabras, del registro S.reg ---------- */
    let nReg = 0, chocaron = false, nCuadros = 0; const cinta = [];
    function avisos() {
      const nuevos = [];
      for (; nReg < S.reg.length; nReg++) {
        const e = S.reg[nReg], u = e.id !== undefined ? S.man[e.id] : null, nom = u ? u.nom : '', mio = e.lado === 0;
        let t = '', tono = '';
        if (e.tipo === 'flanqueo') { t = mio ? '¡Flanco al aire! Os flanquean a ' + nom : 'Flanqueáis a ' + nom; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'retaguardia') { t = mio ? '¡Os atacan por la espalda! ' + nom : 'Atacáis por la espalda a ' + nom; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'duda') { t = mio ? nom + ': a punto de romper' : nom + ' (enemigos) dudan'; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'ruptura') { t = mio ? '¡Huyen los ' + nom + '!' : 'Huyen los ' + nom; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'testudo-roto') { t = e.texto; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'carga' || e.tipo === 'carga-frenada') { t = e.texto; tono = (e.tipo === 'carga') === mio ? 'bien' : 'mal'; }
        else if (e.tipo === 'relevo' && mio) t = e.texto;
        else if (e.tipo === 'caida') { t = e.texto; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'choque' && !chocaron) { chocaron = true; t = '¡Chocan las líneas!'; }
        if (t) nuevos.push({ t, tono });
      }
      const ahora = performance.now();
      for (const n of nuevos.slice(-3)) { if (cinta.some(c => c.t === n.t)) continue; cinta.push(Object.assign(n, { hasta: ahora + 5000, c0: nCuadros })); }
      while (cinta.length > 3) cinta.shift();
      for (let i = cinta.length - 1; i >= 0; i--) if (cinta[i].hasta < ahora && nCuadros - (cinta[i].c0 || 0) > 8) cinta.splice(i, 1);   /* 5 s y al menos 8 cuadros: se lee también a pocos fotogramas */
      const html = cinta.map(c => '<div class="' + c.tono + '">' + esc(c.t) + '</div>').join('');
      if ($('cinta').innerHTML !== html) $('cinta').innerHTML = html;
      if (avisoHasta && ahora > avisoHasta) { $('aviso').hidden = true; avisoHasta = 0; }
    }

    /* ---------- tocar y arrastrar (no depende de los fotogramas: todo va por eventos del dedo) ---------- */
    const RC = new THREE.Raycaster(), PL = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), V2 = new THREE.Vector2(), HIT = new THREE.Vector3();
    function suelo(cx, cy) { const r = lienzo.getBoundingClientRect(); V2.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); RC.setFromCamera(V2, camara); return RC.ray.intersectPlane(PL, HIT) ? { x: HIT.x, y: -HIT.z } : null; }
    /* el manípulo bajo el dedo: dentro de su rectángulo (con margen) o, si no, el más cercano en pantalla a menos de 30 px */
    function manipuloEn(cx, cy, soloLado) {
      const p = suelo(cx, cy); let mejor = null, md = 1e9;
      if (p) for (const u of S.man) {
        if (!vivo(u) || (soloLado !== undefined && u.lado !== soloLado)) continue;
        const c = Math.cos(u.a), s = Math.sin(u.a), dx = p.x - u.x, dy = p.y - u.y, lx = dx * s - dy * c, ly = dx * c + dy * s;
        if (Math.abs(lx) < Sim.frente(u) / 2 + 3 && Math.abs(ly) < Sim.fondo(u) / 2 + 3) { const d = Math.hypot(dx, dy); if (d < md) { md = d; mejor = u; } }
      }
      if (mejor) return mejor;
      const r = lienzo.getBoundingClientRect();
      for (const u of S.man) {
        if (!vivo(u) || (soloLado !== undefined && u.lado !== soloLado)) continue;
        V3.set(u.x, 1, -u.y).project(camara); if (V3.z > 1) continue;
        const d = Math.hypot(r.left + (V3.x + 1) / 2 * r.width - cx, r.top + (1 - V3.y) / 2 * r.height - cy); if (d < 30 && d < md) { md = d; mejor = u; }
      }
      return mejor;
    }
    const dedos = new Map(); let gesto = null;
    function abajo(e) {
      if (!lista) return;
      if (apie) { if (e.clientX < ancho * 0.4) return; lienzo.setPointerCapture && lienzo.setPointerCapture(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); gesto = { tipo: 'giro', x0: e.clientX, yaw0: apie.yaw }; return; } lienzo.setPointerCapture && lienzo.setPointerCapture(e.pointerId);
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (dedos.size === 2) { const [a, b] = [...dedos.values()]; gesto = { tipo: 'pellizco', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, cd: cam.d }; arrastre = null; return; }
      if (dedos.size > 2) return;
      const u = manipuloEn(e.clientX, e.clientY, 0), p = suelo(e.clientX, e.clientY);
      if (u && sel.includes(u.id) && S.fase !== 'fin') gesto = { tipo: 'orden', x0: e.clientX, y0: e.clientY, p0: p, movido: false, t0: performance.now() };
      else gesto = { tipo: 'camara', x0: e.clientX, y0: e.clientY, p0: p, movido: false, t0: performance.now() };
    }
    function mueve(e) {
      if (!dedos.has(e.pointerId) || !gesto) return; dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesto.tipo === 'giro') { if (apie) apie.yaw = gesto.yaw0 - (e.clientX - gesto.x0) * 0.0065; return; }
      if (gesto.tipo === 'pellizco') { if (dedos.size < 2) return; const [a, b] = [...dedos.values()]; cam.d = gesto.cd * gesto.d0 / (Math.hypot(a.x - b.x, a.y - b.y) || 1); ponCamara(); return; }
      if (!gesto.movido && Math.hypot(e.clientX - gesto.x0, e.clientY - gesto.y0) < 10) return; gesto.movido = true;
      if (gesto.tipo === 'camara') { if (!gesto.p0) return; const p = suelo(e.clientX, e.clientY); if (!p) return; cam.x += gesto.p0.x - p.x; cam.z -= gesto.p0.y - p.y; ponCamara(); return; }
      const p = suelo(e.clientX, e.clientY); if (!p || !gesto.p0) return;
      const dx = p.x - gesto.p0.x, dy = p.y - gesto.p0.y, u0 = S.man[sel[0]];
      let a = Math.atan2(dy, dx); if (u0 && Math.cos(a - u0.a) < -0.3) a = u0.a;       /* hacia atrás: retroceden mirando al enemigo */
      arrastre = { dx, dy, a, cx: e.clientX, cy: e.clientY };
    }
    function arriba(e) {
      if (!dedos.has(e.pointerId)) return; dedos.delete(e.pointerId);
      const g = gesto; if (dedos.size > 0) { if (g && g.tipo === 'pellizco') gesto = null; return; }
      gesto = null; if (!g || g.tipo === 'giro') return;
      if (g.tipo === 'orden' && g.movido && arrastre) {
        const ar = arrastre; arrastre = null;
        const ene = manipuloEn(e.clientX, e.clientY, 1);
        if (ene) { ordenar({ tipo: 'cargar', objetivo: ene.id }); return; }
        if (Math.hypot(ar.dx, ar.dy) < 3) return;
        let cx = 0, cy = 0; const us = sel.map(i => S.man[i]); for (const u of us) { cx += u.x / us.length; cy += u.y / us.length; }
        ordenar({ tipo: 'mover', x: cx + ar.dx, y: cy + ar.dy, a: ar.a }); return;
      }
      arrastre = null;
      if (g.movido || g.tipo === 'pellizco') return;
      tocar(e.clientX, e.clientY);
    }
    function tocar(cx, cy) {
      const u = manipuloEn(cx, cy);
      if (u && u.lado === 0) { if (varios) sel = sel.includes(u.id) ? sel.filter(i => i !== u.id) : sel.concat([u.id]); else sel = [u.id]; verFormas = false; }
      else if (u && u.lado === 1) { if (sel.length) ordenar({ tipo: 'cargar', objetivo: u.id }); else aviso(u.nom + ' (enemigo): ' + Math.round(u.n) + ' hombres'); }
      else { sel = []; verFormas = false; }
      pintarHud(true);
    }
    lienzo.addEventListener('pointerdown', abajo); lienzo.addEventListener('pointermove', mueve); lienzo.addEventListener('pointerup', arriba); lienzo.addEventListener('pointercancel', arriba);
    lienzo.addEventListener('wheel', e => { e.preventDefault(); if (apie) return; cam.d *= Math.exp(e.deltaY * 0.0012); ponCamara(); }, { passive: false });

    /* ---------- arriba: pausa, velocidad, retirarse ---------- */
    function pausa(v) { const p = v === undefined ? !S.pausa : !!v; if (p !== S.pausa && S.fase !== 'fin') Sim.ordenar(S, { tipo: 'pausa', valor: p }); $('pausa').textContent = S.pausa ? 'Seguir' : 'Pausa'; $('pausa').classList.toggle('on', S.pausa); $('enpausa').hidden = !S.pausa; }
    $('pausa').addEventListener('click', () => { if (lista) pausa(); });
    $('vel').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; vel = +b.dataset.v; for (const x of $('vel').children) x.classList.toggle('on', x === b); });
    let pausaAntes = false;
    $('retirar').addEventListener('click', () => { if (!lista || S.fase === 'fin') return; pausaAntes = S.pausa; pausa(true); $('salir').hidden = false; });
    $('salir-no').addEventListener('click', () => { $('salir').hidden = true; pausa(pausaAntes); });
    $('salir-si').addEventListener('click', () => { $('salir').hidden = true; Sim.retirarse(S); finYa(); });
    $('seguir').addEventListener('click', terminar);

    /* ---------- fin ---------- */
    let finVisto = false, tFin = 0;
    function finYa() {
      if (finVisto) return; finVisto = true; clearTimeout(tFin);
      const R = S.resultado || { como: 'retirada', motivo: '', t: S.t, bajas: [0, 0], inicial: [0, 0] }, mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      $('fin-t').textContent = { victoria: 'Victoria', derrota: 'Derrota', retirada: 'Retirada' }[R.como] || 'Fin';
      $('fin-p').textContent = R.motivo || '';
      const m = Math.floor(R.t / 60), s = Math.round(R.t % 60);
      $('fin-c').innerHTML = '<span>Tus bajas</span><b>' + mil(R.bajas[0]) + ' de ' + mil(R.inicial[0]) + '</b><span>Bajas del enemigo</span><b>' + mil(R.bajas[1]) + ' de ' + mil(R.inicial[1]) + '</b><span>Duración</span><b>' + m + ' min ' + s + ' s</b>';
      if (apie) subir(); $('fin').hidden = false; $('abajo').hidden = true; sel = [];
    }

    /* ---------- el tiempo: pasos fijos del simulador; dt acotado ---------- */
    function pasoSim() { previo = S.man.map(u => ({ x: u.x, y: u.y, a: u.a })); Sim.avanzar(S, PASO); }
    function avanza(dtReal) {
      const dt = S.pausa || S.fase === 'fin' ? 0 : Math.min(0.1, dtReal) * vel;
      if (dt > 0) { acum += dt; let k = 0; while (acum >= PASO && k++ < 8) { acum -= PASO; pasoSim(); } if (acum > PASO) acum = PASO; }
      Tv += dt; colocar(dt, false); if (apie) andarApie(dt);
      if (S.fase === 'fin' && !finVisto && !tFin) tFin = setTimeout(finYa, 1500);
    }
    function pinta(dt) { nCuadros++; pintarSuelo(); pintarFiguras(); if (entorno) entorno.tick(dt || 0, S, Sim, camara, alto * dpr); renderer.render(escena, camara); pintarBarras(); }
    let raf = 0, antes = 0, tHud = 0;
    function cuadro(ahora) {
      if (cerrado) return; raf = requestAnimationFrame(cuadro);
      const real = Math.max(0, (ahora - antes) / 1000 || 0); antes = ahora;
      if (!lista) return;
      avanza(real); if (apie) camaraApie(Math.min(0.1, real)); pinta(S.pausa || S.fase === 'fin' ? 0 : Math.min(0.1, real) * vel); avisos();
      if (ahora - tHud > 250) { tHud = ahora; pintarHud(); }
    }

    function soltarSoldados() { for (const s of soldados.values()) { try { SOLD.soltarSoldado(s); } catch (e) { /* ya suelto */ } } soldados.clear(); }
    async function arrancar() {
      try {
        const tipos = new Set(['hastati']); for (const u of S.man) tipos.add(u.tropa);
        const quiero = new Set(); for (const u of S.man) if (NUEVO[u.tropa]) quiero.add(u.tropa + u.lado);
        const nuevos = !quiero.size ? null : import('./gfx/soldado.js').then(Mod => { SOLD = Mod; return Promise.all([...quiero].map(id => { const lado = +id.slice(-1), [nom, pueblo = nom] = NUEVO[id.slice(0, -1)].split(':'), propio = Mod.ROMANOS.has(pueblo) === (lado === 0), pal = Mod.PUEBLOS[pueblo];
          return Mod.cargarSoldado(nom, propio ? pal || null : Mod.gama(COLOR[lado], pal)).then(s => { if (s) soldados.set(id, s); }); })); }).catch(() => { /* sin soldado nuevo: 0 A.D. */ });
        await Promise.all([preload([...tipos]), Gr.loadGroundTextures().then(() => St.preloadStatic(['cipres', 'olivo', 'pino'])), nuevos]);
        if (cerrado) { soltarSoldados(); return; }
        if (!getUnit('hastati') && !soldados.size) throw new Error('No se han podido cargar los soldados');
        entorno = await C.montarEntorno({ THREE, escena, Gr, St, UNIT_SCALE, campo: cfg.campo, renderer });
        if (cerrado) { entorno.soltar(); soltarSoldados(); return; }
        preparar(); camaraInicial(); colocar(0, true);
        lista = true; $('carga').hidden = true; pausa(S.pausa); pintarHud(true);
        if (S.fase === 'fin') finYa();
        else { cinta.push({ t: 'Toca un manípulo tuyo y arrástralo para moverlo', tono: '', hasta: performance.now() + 7000 }); }
      } catch (e) { console.error(e); $('carga-p').textContent = 'No se ha podido cargar la batalla.'; $('carga-s').hidden = false; }
    }

    function cerrarTodo() {
      cerrado = true; cancelAnimationFrame(raf); clearTimeout(tFin);   /* window.__mn se queda con cerrado = true para las pruebas */
      for (const f of salidas) f();
      for (const m of mallas.values()) { try { if (m.nv) for (const t of m.nv) { escena.remove(t.malla); t.dispose(); } else { escena.remove(m.malla); m.malla.geometry.dispose(); } } catch (e) { /* ya liberada */ } }
      soltarSoldados(); if (entorno) entorno.soltar();
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* nada que liberar */ }
    }
    function terminar() { const r = Sim.resumen(S); cerrarTodo(); alTerminar(r); }
    requestAnimationFrame(t => { antes = t; raf = requestAnimationFrame(cuadro); }); arrancar();

    /* ganchos para las pruebas y las capturas (a pocos fotogramas por segundo todo funciona igual) */
    const gancho = window.__mn = {
      get lista() { return lista; }, get cerrado() { return cerrado; }, get S() { return S; }, Sim,
      estado: () => ({ t: S.t, fin: S.fase === 'fin', res: S.resultado, sel: sel.slice(), pausa: S.pausa, vel, cam: Object.assign({}, cam), tri: renderer.info.render.triangles, llamadas: renderer.info.render.calls,
        figuras: figs.filter(f => f.est === 0).length, caidas: figs.filter(f => f.est === 1).length, niveles: [0, 1, 2, 3].map(k => figs.filter(f => f.est !== 2 && f.nv === k).length) }),
      elegir: ids => { sel = (ids || []).filter(i => S.man[i] && S.man[i].lado === 0); verFormas = false; pintarHud(true); return sel.slice(); },
      ordenar: o => ordenar(o),
      pausa: v => pausa(v),
      salta: seg => { const hasta = S.t + seg; while (S.t < hasta - 1e-9 && S.fase !== 'fin' && !S.pausa) pasoSim(); acum = 0; previo = S.man.map(u => ({ x: u.x, y: u.y, a: u.a })); colocar(0, true); avisos(); pintarHud(true); if (S.fase === 'fin') finYa(); return S.t; },
      cuadro: dt => { avanza(dt || 0); if (apie) camaraApie(Math.min(0.1, dt || 0)); pinta(S.pausa ? 0 : Math.min(0.1, dt || 0) * vel); avisos(); pintarHud(); },
      camara: o => { if (o) Object.assign(cam, o); else camaraInicial(); ponCamara(); return Object.assign({}, cam); },
      /* para pruebas del dedo: el punto de pantalla (px CSS) de un manípulo */
      pantalla: id => { const u = S.man[id]; V3.set(u.x, 0, -u.y).project(camara); return { x: (V3.x + 1) / 2 * ancho, y: (1 - V3.y) / 2 * alto }; },
      terminar, ver: () => verFormas,
      /* CG6: a pie. bajar(id) devuelve '' o el motivo; palanca(dx, dy) de −1 a 1 (dy −1 = adelante, como en pantalla; 0, 0 la suelta) */
      camaraY: () => camara.position.y,
      bajar: id => bajar(id), subir: () => subir(),
      /* CG6b: tu duelo. golpe('golpear' | 'parar' | 'empujar' | 'pilum') lo hace en el siguiente cuadro; duelo() su estado o null */
      golpe: que => { if (!duelo) return 'No hay duelo'; pide = que; return ''; },
      duelo: () => { if (!duelo) return null; const v = Sim.dueloVer(duelo.D); return { rival: duelo.rid, aviso: v.aviso, fuelle: v.fuelle, heridas: v.heridas, mata: v.mata, caidas: v.caidas, abierto: v.abierto, pilum: v.pilum }; }, palanca: (dx, dy) => { if (!dx && !dy) soltarPalanca(); else ponPalanca(dx, dy); },
      apie: () => apie ? { id: apie.id, x: apie.f.x, y: -apie.f.z, yaw: apie.yaw, v: apie.v, camara: { x: camara.position.x, y: camara.position.y, z: camara.position.z } } : null,
      /* triángulos por pieza de la escena (para el presupuesto) */
      desglose: () => { const r = {}; escena.traverse(o => { if (!o.isMesh || !o.visible) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3, n = o.isInstancedMesh ? o.count : 1, k = o.name || (o.isInstancedMesh ? 'inst' : 'malla') + ':' + Math.round(t); r[k] = (r[k] || 0) + Math.round(t * n); }); return r; }
    };
    return { cerrarTodo };
  }

  root.UIMando = { abrir, cerrar, get abierta() { return !!activa; } };
})(typeof window !== 'undefined' ? window : globalThis);
