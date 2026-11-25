/* AQVILA — CG4 (A1): la pantalla de MANDO EN VIVO. Dibuja y dirige la batalla del simulador js/simulador.js (global Simulador).
   La usan las Escaramuzas y, desde CG4b, la campaña (por la hoja de js/ui-batalla-rapida.js). cfg.guardar(S), si está, guarda a mitad.
   Uso: UIMando.abrir(cfg, alTerminar).
     cfg = { S } (un estado ya creado, p. ej. con manípulos a mano: CG5) o { semilla, ejercitos } (o { semilla, manipulos });
     cfg.campo: llano, colina, bosque o mixto (solo paisaje). cfg.pueblo (o cfg.ejercitos.pueblo): el pueblo de tu bando (roma, cartago, epiro, macedonia, galos, iberos); decide en qué lengua gritan los tuyos (SON5). alTerminar(r) recibe Simulador.resumen(S) (r.estado.resultado = {como, motivo, t, bajas, inicial}).
   Cómo se juega: arrastrar en vacío mueve la cámara; pellizcar acerca y aleja. Tocar un manípulo tuyo lo elige (con «Varios», cada toque
   suma o quita); tocar el suelo vacío suelta la elección. Arrastrar DESDE un elegido lo manda allí (mirando hacia donde arrastras;
   si arrastras hacia atrás, retroceden mirando al enemigo). Tocar un enemigo con tropa elegida: cargar contra él. Botones abajo.
   Piezas que vinieron de la pantalla vieja de la campaña (ui-guerra.js, retirada en CG4b): la escena three.js, la carga de los soldados nuevos
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
  </div>
  <div id="mn-cinta"></div>
  <div id="mn-aviso" hidden></div>
  <div id="mn-abajo">
    <div id="mn-ficha"><div id="mn-ficha-t"></div><div id="mn-ficha-b"><button id="mn-varios" class="mn-t" type="button" aria-pressed="false">Varios</button></div></div>
    <div id="mn-ordenes" class="barra6"></div>
    <div id="mn-formas" hidden></div>
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
    const S = cfg.S || Sim.crear({ semilla: cfg.semilla, ejercitos: cfg.ejercitos, manipulos: cfg.manipulos, tacticas: cfg.tacticas !== false });   /* TH1: tácticas de la época (js/tacticas.js), si está cargado */
    const el = document.createElement('div'); el.id = 'mn'; el.innerHTML = HTML; document.body.appendChild(el);
    const a = activa = { el, cerrar: () => {} };
    const $ = id => el.querySelector('#mn-' + id);
    const sale = () => { if (activa !== a) return; cerrar(); if (alTerminar) alTerminar(Sim.resumen(S)); };   // mientras carga: cuenta como retirada
    $('carga-no').addEventListener('click', sale); $('retirar').addEventListener('click', sale);
    window.__mn = { lista: false, cerrado: false, S };
    try {
      const [M, U, Gr, St, C, FB, MV, RO] = await Promise.all([import('./gfx/models.js'), import('./gfx/units.js'), import('./gfx/ground.js'), import('./gfx/statics.js'), import('./gfx/campo-mando.js'), import('./fisica-batalla.js').catch(() => null), import('./mando-varios.js'), import('../gobierno/maquetas/bloque/rotulos.js').catch(() => null)]);   /* FI4: la física de las figuras. BT1: la barra común y las etiquetas que no se pisan */
      if (activa !== a) return;
      const fin = r => { if (activa === a) { activa = null; el.remove(); } if (alTerminar) alTerminar(r); };
      $('retirar').removeEventListener('click', sale);
      const P = pantalla({ M, U, Gr, St, C, FB, MV, RO }, el, $, cfg, S, fin); a.cerrar = P.cerrarTodo;
    } catch (e) { console.error(e); const p = $('carga-p'); if (p) p.textContent = 'No se ha podido cargar la batalla.'; const s = $('carga-s'); if (s) s.hidden = false; }
    return el;
  }

  function pantalla(mods, el, $, cfg, S, alTerminar) {
    const { M, U, Gr, St, C } = mods, Sim = root.Simulador;
    const { THREE } = M, { preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE } = U;
    /* CG4b: el rival lleva el color de su bando (cfg.col, el de la campaña o de Escaramuzas); si no viene o se confunde con el rojo
       de Roma, el morado de siempre */
    const rivalDe = col => { try { if (!col) return null; const c = new THREE.Color(col), h = {}; c.getHSL(h); const dh = Math.min(h.h, 1 - h.h) * 360;
      return dh < 30 && h.s > 0.35 ? null : '#' + c.getHexString(); } catch (e) { return null; } };
    const COLOR = ['#b3261e', rivalDe(cfg.col) || '#5b3a8c'];
    { const c = new THREE.Color(COLOR[1]); el.style.setProperty('--mn-rival', '#' + c.clone().lerp(new THREE.Color('#ffffff'), 0.25).getHexString()); }
    /* el soldado nuevo (js/gfx/soldado.js) para estas tropas; las demás (a caballo, elefantes), con 0 A.D. */
    const NUEVO = { hastati: 'hastatus', principes: 'hastatus', vigiles: 'hastatus', galos: 'galo', libios: 'hastatus:libio', triarii: 'triario', velites: 'velite', milicia: 'velite:milicia', honderos: 'hondero', peltastas: 'peltasta', hoplitas: 'hoplita:griego', sagrada: 'hoplita:sagrada', falange: 'falangita', iberos: 'ibero' };
    const UMBRAL_N = [200, 90, 42];      /* alto en pantalla (px CSS) desde el que toca el nivel 0, 1 y 2; por debajo, el 3 */
    const TOPE_N = [40, 150];            /* como mucho, tantas figuras en el nivel 0 y en el 1 (las más cercanas): presupuesto de triángulos */
    const MAXF = 1200;                   /* figuras por batalla como mucho (una figura vale por varios hombres): ~1 200 × 442 triángulos de lejos */
    const TALLA = 1.25;                  /* las figuras, algo mayores que el hombre: de lejos el bloque se lee (licencia de vista) */
    const PARADA_N = 0.55;               /* el punto del clip «cubrirse» con el escudo arriba (testudo, muro) */
    const ALTO_HASTATUS = 2.11;
    const PASO = Sim.PASO;
    /* SON4: música, voces y subtítulo (js/gfx/banda.js, js/voces.js, js/gfx/musica.js): los momentos salen del registro S.reg del simulador */
    let banda = null;
    try {
      const n0 = l => { const o = {}; for (const u of S.man) if (u.lado === l) o[u.tropa] = (o[u.tropa] || 0) + u.n0; return o; };
      if (root.Banda) banda = root.Banda.crea({ padre: el, propio: root.Banda.propioDe(n0(0), cfg.pueblo || (cfg.ejercitos && cfg.ejercitos.pueblo)), rival: root.Banda.rivalDe(n0(1)), semilla: S.sem, abajo: '96px' });
    } catch (e) { banda = null; }
    /* SON9: la arenga antes de la batalla y las preguntas de tus oficiales (js/dialogos.js, js/gfx/dialogos-ui.js). Hablan los romanos (en latín) y, en español, Cartago, los galos y los íberos; desactivado en pruebas
       automáticas (navigator.webdriver), salvo con ?arenga=1. Mientras eliges, la batalla espera (con un tope de 8 s en las preguntas). */
    const propioD = (() => { try { const o = {}; for (const u of S.man) if (u.lado === 0) o[u.tropa] = (o[u.tropa] || 0) + u.n0; return root.Banda ? root.Banda.propioDe(o, cfg.pueblo || (cfg.ejercitos && cfg.ejercitos.pueblo)) : 'romano'; } catch (e) { return 'romano'; } })();
    /* SON10: hablan los romanos (latín) y, en español, Cartago, los galos y los íberos; el resto de pueblos, no */
    const puebloD = ['cartago', 'galos', 'iberos'].includes(propioD) ? propioD : null;
    const DU = (propioD === 'romano' || puebloD) && root.DialogosUI && root.Dialogos && root.DialogosUI.quiere(cfg) ? root.DialogosUI.crea({ padre: $('hud'), abajo: '150px', abajoH: '96px', pueblo: puebloD }) : null;
    let preg = null, tPreg = 0, arengando = false;
    function preguntas(dtReal) {
      if (!DU || preg || arengando || apie || S.pausa || S.fase === 'fin' || !root.Dialogos.preguntasOn()) return;   /* ajuste «Preguntas de oficiales» */
      tPreg -= dtReal; if (tPreg > 0) return; tPreg = 1;
      const Dl = root.Dialogos, p = Dl.detectar(S, puebloD); if (!p) return;
      Dl.mostrada(S, p); preg = p; sel = [p.uid]; pausa(true); pintarHud(true);
      const sigue = r => { preg = null; pausa(false); if (!r.ok && r.no) aviso(r.no); pintarHud(true); };
      DU.pregunta(p, { alElegir: k => sigue(Dl.responder(S, p, k)), alTiempo: () => { const r = Dl.porTiempo(S, p); DU.habla(r.frase, { nombre: Dl.nombreDe('tribuno', puebloD), espera: 3 }); sigue(r); if (r.ok) aviso('Sin tu orden, ' + (puebloD ? 'tu ' + Dl.nombreDe('tribuno', puebloD).toLowerCase() : 'el tribuno') + ' mantiene la línea'); } });
    }
    function arengar() {
      arengando = true; pausa(true);
      DU.arenga(id => { root.Dialogos.arengar(S, id); arengando = false; pausa(false); pintarHud(true); const a = root.Dialogos.arenga(id, puebloD); if (a) aviso(a.efecto); });
    }
    /* SON5: efectos de la batalla, los que tenía la pantalla vieja de la campaña (suena y ambiente) desde los mismos momentos que traduce Voces.deSim.
       Todo sale por Sonido.maestro; Sonido ya sabe callarse (apagado, sin toque aún, app oculta). Cada cuerno agacha la música. */
    let primerChoque = false, tRuido = 0;
    const claseDe = t => (root.DATA && root.DATA.UNITS && root.DATA.UNITS[t] && root.DATA.UNITS[t].cls) || '';
    function suena(e) {
      const So = root.Sonido; if (!So) return;
      const u = e.id !== undefined ? S.man[e.id] : null, tropa = u ? u.tropa : '', mio = e.lado === 0, cls = claseDe(tropa);
      const cuerno = (v, rival) => { if (root.Musica) root.Musica.agacha(); if (rival) So.cuernoRival(v); else So.cuerno(v); };
      switch (e.tipo) {
        case 'choque':
          if (!primerChoque) { primerChoque = true; cuerno(0.8, false); setTimeout(() => { if (!cerrado) So.cuernoRival(0.6); }, 700); setTimeout(() => { if (!cerrado) So.choque(1, 1); }, 1400); }   /* «Las líneas chocan»: cuerno propio, cuerno rival y el golpe */
          else So.choque(0.9, 1);
          break;
        case 'testudo-roto': So.choque(1, 1); break;
        case 'carga':
          if (tropa === 'elefantes' || cls === 'ele') So.elefante(0.8);
          else if (tropa === 'falange') So.falange(0.7);
          else { if (cls === 'cav') cuerno(0.6, !mio); So.carga(0.7, Math.min(1, S.man.filter(x => x.lado === e.lado && vivo(x)).reduce((a, x) => a + x.n, 0) / 1500)); }   /* SON10: la masa que suena debajo crece con el ejército */
          break;
        case 'carga-frenada': So.choque(1, 0.9); if (tropa === 'falange' || (e.con !== undefined && S.man[e.con] && S.man[e.con].tropa === 'falange')) So.falange(0.5); break;
        case 'pila': case 'tiro': So.jabalina(0.7); setTimeout(() => { if (!cerrado) So.choque(0.4, 1.3); }, 650); break;
        case 'desboque': So.elefante(1); setTimeout(() => { if (!cerrado) So.choque(0.8, 1); }, 500); break;
        case 'flanqueo': case 'retaguardia': case 'ruptura': case 'caida': So.choque(0.8, 0.9); break;
        case 'relevo': if (mio) { cuerno(0.5, false); } break;
        default: break;
      }
    }
    /* el fragor de fondo (grabado «lucha») sube con los manípulos que están trabados y suena un golpe suelto de vez en cuando */
    function ambiente(dt) {
      const So = root.Sonido; if (!So || !So.fondo) return;
      const lucha = S.fase !== 'fin' && !S.pausa ? S.man.filter(u => vivo(u) && u.lucha > 0) : [];
      if (!lucha.length) { if (So.fondos && So.fondos.lucha) So.fondo('lucha', 0); return; }
      tRuido -= dt; if (tRuido > 0) return;
      const emp = lucha.filter(u => u.postura === 'empujar').length;
      So.fondo('lucha', Math.min(0.5, 0.22 + 0.08 * Math.min(4, emp)));
      So.choque(0.25 + 0.2 * Math.min(4, emp), 0.8); tRuido = 1.1 + Math.random() * 0.8 - 0.15 * Math.min(4, emp);
    }
    let SOLD = null, escN = 0.84, altoN = 1.78; const soldados = new Map(), V3 = new THREE.Vector3();
    /* FI4: la física de las figuras (js/fisica-batalla.js, crearFisicaFiguras): nadie se mete dentro de otro, la carga empuja y los pila
       se clavan o rebotan. Solo cambia dónde se dibuja cada figura (f.fx, f.fz): el simulador no la lee. ?fisica=0 la apaga */
    const FIS = mods.FB && mods.FB.crearFisicaFiguras && !/[?&]fisica=0/.test(root.location ? root.location.search : '') ? mods.FB : null; let FF = null;
    const RAPIDO = /^(elefantes|equites|numidas|jinetes|tesalios|general)$/;
    function leeFig(f, c) {
      if (f.est === 2) return false;
      c.x = f.x; c.z = f.z; c.yaw = f.yaw; c.vivo = f.est === 0; c.lado = f.lado; c.tipo = f.key === 'elefantes' ? 'elefante' : RAPIDO.test(f.key) ? 'jinete' : 'infante';
      c.f = -1 - f.idx; c.r = f.fila || 0; c.g = f.m; c.guardia = f.est === 0 && f.forma === 'testudo' ? (f.fila ? 'alto' : 'muro') : null;
      return true;
    }
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
    let apie = null;     /* LP7: a pie, { id, P, frame, pausaAntes }: la capa del bloque está abierta (ver bajar) */
    function medir() {
      ancho = window.innerWidth; alto = window.innerHeight; vertical = alto > ancho;
      renderer.setSize(ancho, alto, false); camara.aspect = ancho / alto; camara.fov = vertical ? 54 : 40; camara.near = 1; camara.updateProjectionMatrix();
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
    /* CG4b: el encuadre inicial deja ver los dos ejércitos enteros en la parte libre de la pantalla: entre la barra de arriba
       y la ficha de abajo (en horizontal, también sobre los botones de órdenes, que salen al elegir). Desde detrás de la legión,
       como en Total War; se acerca todo lo que se pueda sin cortar a nadie. */
    function libre() {   /* arriba se dejan 54 px más: los estandartes miden al menos 46 en pantalla (js/gfx/estandartes.js) */
      const r = id => { const e = $(id); return e && !e.hidden ? e.getBoundingClientRect() : null; };
      const ar = r('arriba'), ab = r('ficha');
      let arriba = (ar ? ar.bottom + 8 : 60) + 54, abajo = ab && ab.height ? ab.top - 8 : alto - 80;
      if (!vertical) abajo = Math.min(abajo, alto - 118);   /* en horizontal, los botones de órdenes ocupan unos 110 px de abajo */
      if (abajo - arriba < alto * 0.3) { arriba = alto * 0.12; abajo = alto * 0.8; }
      return { arriba, abajo, izq: 10, der: ancho - 10 };
    }
    function camaraInicial() {
      const us = S.man.filter(vivo); if (!us.length) { cam.x = 0; cam.z = 0; cam.d = 300; ponCamara(); return; }
      const L = libre(), pts = [];
      for (const u of us) { const F = Sim.frente(u) / 2 + 2, Df = Sim.fondo(u) / 2 + 2, c = Math.cos(u.a), sn = Math.sin(u.a);
        for (const [a, b] of [[-F, -Df], [F, -Df], [-F, Df], [F, Df]]) { const x = u.x + a * sn + b * c, y = u.y - a * c + b * sn; pts.push([x, 0, -y]); } }   /* las esquinas, en el suelo (el estandarte va en el margen de arriba) */
      let x0 = 1e9, x1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
      const caja = () => { let a = 1e9, b = -1e9, l = 1e9, r = -1e9, atras = false; for (const p of pts) { V3.set(p[0], p[1], p[2]).project(camara); if (V3.z > 1) atras = true; const px = (V3.x + 1) / 2 * ancho, py = (1 - V3.y) / 2 * alto; a = Math.min(a, py); b = Math.max(b, py); l = Math.min(l, px); r = Math.max(r, px); } return { a, b, l, r, atras }; };
      const enZ = () => {   /* coloca cam.z para que la caja quede centrada en vertical en la parte libre */
        let lo = -900, hi = 900; const meta = (L.arriba + L.abajo) / 2;
        for (let k = 0; k < 40; k++) { cam.z = (lo + hi) / 2; ponCamara(); const q = caja(); if (q.atras || (q.a + q.b) / 2 > meta) lo = cam.z; else hi = cam.z; }   /* subir cam.z sube lo que se ve en pantalla */
        ponCamara(); return caja();
      };
      cam.x = (x0 + x1) / 2;
      let mejor = null;
      for (let d = 120; d <= D_MAX; d += 10) {
        cam.d = d; const q = enZ();
        if (!q.atras && q.a >= L.arriba && q.b <= L.abajo && q.l >= L.izq && q.r <= L.der) { mejor = d; break; }
      }
      cam.d = mejor || D_MAX; enZ();
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
    /* CG4b: la caballería de 0 A.D. salía negra. No era la luz: sus caballos son así en el arte (pelo negro, de media 31/255,
       y castaño oscuro, 65/255), y desde arriba y de lejos se leían como manchas negras. Aquí solo, sin tocar el arte ni
       js/gfx/units.js, se aclara la celda del caballo (la cuarta de arriba a la izquierda del atlas): un negro mate y un castaño. */
    const ACLARA = { equites: 5.5, jinetes: 3.4, numidas: 3.4, tesalios: 3.4 }, matCab = new Map();
    function materialDe(u, color) {
      const base = unitMaterialReal(u, color), k = ACLARA[u.key]; if (!k) return base;
      const id = u.key + color; if (matCab.has(id)) return matCab.get(id);
      const m = base.clone(), antes = base.onBeforeCompile;
      m.onBeforeCompile = (sh, r) => { antes(sh, r); sh.fragmentShader = sh.fragmentShader.replace('diffuseColor.rgb *= tx.rgb;', 'if (vMapUv.x < 0.5 && vMapUv.y < 0.5) tx.rgb *= ' + k.toFixed(2) + ';\n  diffuseColor.rgb *= tx.rgb;'); };
      m.customProgramCacheKey = () => 'aqvila-real-caballo-' + k;
      matCab.set(id, m); salidas.push(() => m.dispose()); return m;
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
        const g = instancedGeometry(u, cuenta[id]), malla = new THREE.InstancedMesh(g, materialDe(u, COLOR[lado]), cuenta[id]); malla.frustumCulled = false; escena.add(malla);
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
      if (SOLD && SOLD.crearPila) { pila = SOLD.crearPila(escena, TALLA); salidas.push(() => pila.soltar()); }   /* PIL3: pila en el aire */
      for (const u of S.man) { const b = document.createElement('div'); b.className = 'mn-e' + (u.lado ? ' ene' : ''); b.innerHTML = '<i class="h"><b></b><b class="her"></b></i><i class="m"><b></b></i><i class="f"><b></b></i>'; $('capa').appendChild(b); mans[u.id].barra = b; }
    }
    let sombras = null, rects = null, fantasmas = null, flecha = null, pila = null;
    /* CG8a: cámara de cine (js/gfx/cine-mando.js) y estandarte de cada manípulo (js/gfx/estandartes.js) */
    let cine = null, estandartes = null; const celdaDe = [];
    function crearEst(ES) {
      const cel = {}, letras = []; let k = [0, 0];
      for (const u of S.man) { const c = u.lado + ':' + u.tropa; if (cel[c] === undefined) { cel[c] = k[u.lado]++ % 8; letras.push([String(nombreTropa(u.tropa)).trim().charAt(0).toUpperCase(), u.lado, cel[c]]); } celdaDe[u.id] = cel[c]; }
      return ES.crearEstandartes({ THREE, escena, n: S.man.length, talla: TALLA, letras, pano: COLOR });
    }
    function pintarEstandartes() {
      if (!estandartes) return; const al = Math.max(0, Math.min(1, acum / PASO));
      for (const u of S.man) { const p0 = previo[u.id] || u, fuera = u.estado === 'fuera' || u.estado === 'caida' || u.n <= 0;
        estandartes.pon(u.id, p0.x + (u.x - p0.x) * al, -(p0.y + (u.y - p0.y) * al), celdaDe[u.id] || 0, u.lado, fuera ? -1 : sel.includes(u.id) ? 1 : vivo(u) ? 0 : 2); }
      estandartes.fin(camara, alto, Tv + performance.now() / 4000);
    }
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
          const j = i;
          const f = m.vivos.splice(j, 1)[0]; f.est = 1; f.t0 = Tv; if (salto) f.t0 = Tv - 9;
        }
        const F = Sim.frente(u), Df = Sim.fondo(u), c = Math.cos(pa), s = Math.sin(pa), yaw = yawDe(pa), n = m.vivos.length, roto = !vivo(u);
        const tira = u.tirando >= 0, rapido = /^(elefantes|equites|numidas|jinetes|tesalios|general)$/.test(u.tropa);
        for (let i = 0; i < n; i++) {
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
        if (nv < 3) { V3.set(f.x, h / 2, f.z).project(camara); if (V3.z > 1 || Math.abs(V3.x) > 1.1 || Math.abs(V3.y) > 1.1) nv = 3; }
        f.nv = nv; f.dc = d; if (nv < 2) cuenta[nv].push(f);
      }
      for (let k = 0; k < 2; k++) if (cuenta[k].length > TOPE_N[k]) { cuenta[k].sort((p, q) => p.dc - q.dc); for (let i = TOPE_N[k]; i < cuenta[k].length; i++) { cuenta[k][i].nv = k + 1; if (k === 0) cuenta[1].push(cuenta[k][i]); } }
    }
    /* CG8a: de lejos, las figuras crecen algo (hasta +40 % a 650 m): el bloque se lee como hombres y no como hormigas (licencia de vista) */
    const lejos = f => 1 + 0.4 * Math.max(0, Math.min(1, ((f.dc || 0) - 150) / 500));
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
          const tr = m.nv[f.nv], ii = tr.sig(); if (ii < 0) continue; a = tr.malla.instanceMatrix.array; o = ii * 16; sc = escN * f.talla * TALLA * lejos(f);
          const k0 = clip === 'lanzar' && tr.s.j.clips.lanzar2 && ((tr.s.j.muestra || {}).lanzar2 || []).length === 3 ? 'lanzar2' : clip;      /* lanzamiento nuevo (pilum, jabalina, venablo): quien lo trae lo usa; el hondero sigue con el suyo */
          const k = tr.s.j.clips[k0] ? k0 : 'quieto', cl = tr.s.j.clips[k], dur = (cl.n - 1) / cl.fps, tt = modo === 's' ? val : modo === 'c' ? (val - Math.floor(val)) * dur : Math.min(1, Math.max(0, val)) * dur;
          tr.vars(ii, f.vr); tr.pose(ii, k, tt, tr.muestra(k, tt));
          if (pila) { const su = k === 'lanzar2' ? SOLD.soltarDe(tr.s) : null; if (su != null && f.tl != null && f.tl < su && tt >= su && f.dc < 160) tirarPila(f, sc); f.tl = su != null ? tt : null; }   /* PIL3: suelta el arma: vuela */
        } else {
          a = m.malla.instanceMatrix.array; o = f.slot * 16; sc = UNIT_SCALE * TALLA * lejos(f);
          const Cl = m.u.clips, cl = Cl[VIEJO[clip]] || Cl.attack_melee || Cl.idle;
          m.fr.array[f.slot] = !cl ? 0 : modo === 'c' ? cl.start + Math.min(cl.frames - 1, Math.floor((val - Math.floor(val)) * cl.frames)) : modo === 'p' ? frameOnce(cl, Math.min(1, Math.max(0, val)) * cl.dur) : frameOf(cl, val);
        }
        const c = Math.cos(f.yaw) * sc, s = Math.sin(f.yaw) * sc;
        a[o] = c; a[o + 1] = 0; a[o + 2] = -s; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = sc; a[o + 6] = 0; a[o + 7] = 0;
        a[o + 8] = s; a[o + 9] = 0; a[o + 10] = c; a[o + 11] = 0; a[o + 12] = f.x + (f.fx || 0); a[o + 13] = 0; a[o + 14] = f.z + (f.fz || 0); a[o + 15] = 1;
        const e = (f.est === 0 ? (m.nv ? 1 : 1.5) : 1.15) * TALLA * lejos(f);   /* CG8a: el caído deja su mancha en el suelo */
        sm[q] = e; sm[q + 1] = 0; sm[q + 2] = 0; sm[q + 3] = 0; sm[q + 4] = 0; sm[q + 5] = 1; sm[q + 6] = 0; sm[q + 7] = 0; sm[q + 8] = 0; sm[q + 9] = 0; sm[q + 10] = e; sm[q + 11] = 0; sm[q + 12] = f.x + (f.fx || 0); sm[q + 13] = 0.03; sm[q + 14] = f.z + (f.fz || 0); sm[q + 15] = 1;
      }
      for (const m of mallas.values()) { if (m.nv) { for (const t of m.nv) t.malla.instanceMatrix.needsUpdate = true; continue; } m.malla.instanceMatrix.needsUpdate = true; m.fr.needsUpdate = true; }
      sombras.instanceMatrix.needsUpdate = true;
      if (pila && FF) { pila.malla.count = FF.pintaArmas(pila.malla.instanceMatrix.array, pila.malla.instanceMatrix.count, TALLA); pila.malla.instanceMatrix.needsUpdate = true; }   /* FI4: los de la física */
      else if (pila) pila.paso(Tv);
    }
    /* PIL3: el pilum que suelta f vuela hacia un hombre de la tropa a la que tira Solo se ve: las bajas
       las da el simulador. La mitad se hinca en el suelo cerca del blanco y se queda unos segundos; la otra mitad da en él y desaparece. */
    function tirarPila(f, sc) {
      let b = null;
      { const u = S.man[f.m], t = u && u.tirando >= 0 ? mans[u.tirando] : null; if (t && t.vivos.length) b = t.vivos[Math.floor(Math.random() * t.vivos.length)]; }
      if (!b) return;
      if (FF) { const sx = Math.sin(f.yaw), sz = Math.cos(f.yaw), x0 = f.x + (f.fx || 0) - sz * 0.2 * sc + sx * 0.35 * sc, z0 = f.z + (f.fz || 0) + sx * 0.2 * sc + sz * 0.35 * sc, bx = b.x + (b.fx || 0) + (Math.random() - 0.5) * 2 * TALLA, bz = b.z + (b.fz || 0) + (Math.random() - 0.5) * 2 * TALLA;
        FF.lanza(f.key === 'velites' ? 'jabalina' : 'pilum', f, [x0, 1.75 * sc, z0], [bx, 1.1 * TALLA, bz], Math.max(0.5, Math.hypot(bx - x0, bz - z0) / 19)); return; }   /* FI4: lo resuelve la física */
      const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw), x0 = f.x - fz * 0.2 * sc + fx * 0.35 * sc, z0 = f.z + fx * 0.2 * sc + fz * 0.35 * sc, y0 = 1.75 * sc;   /* la mano derecha, sobre el hombro */
      const dx = b.x - x0, dz = b.z - z0, dh = Math.hypot(dx, dz) || 1, ux = dx / dh, uz = dz / dh;
      if (Math.random() < 0.5) { const r = (Math.random() - 0.5) * 3 * TALLA, w = (Math.random() - 0.5) * 2 * TALLA; pila.lanza(x0, y0, z0, b.x + ux * r - uz * w, 0, b.z + uz * r + ux * w, Tv, true); }
      else pila.lanza(x0, y0, z0, b.x - ux * 0.45 * TALLA, 1.15 * TALLA, b.z - uz * 0.45 * TALLA, Tv, false);
    }

    /* ---------- rectángulos en el suelo, fantasmas y flecha ---------- */
    const MT = new THREE.Matrix4(), QT = new THREE.Quaternion(), PT = new THREE.Vector3(), ST = new THREE.Vector3(), YT = new THREE.Vector3(0, 1, 0), CT = new THREE.Color();
    const C_PROPIO = new THREE.Color('#e0483a'), C_RIVAL = new THREE.Color(COLOR[1]).lerp(new THREE.Color('#ffffff'), 0.3), C_SEL = new THREE.Color('#ffd76a'), C_ROTO = new THREE.Color('#77716a');
    function rect(malla, i, x, y, a, F, Df, h) { PT.set(x, h, -y); QT.setFromAxisAngle(YT, yawDe(a)); ST.set(F + 3, 1, Df + 3); MT.compose(PT, QT, ST); malla.setMatrixAt(i, MT); }
    let arrastre = null;      /* { dx, dy, a } mientras se arrastra una orden */
    function pintarSuelo() {
      rects.visible = fantasmas.visible = true;
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
      const al = Math.max(0, Math.min(1, acum / PASO)), y = altoN * TALLA * 1.9;
      for (const u of S.man) {
        const m = mans[u.id]; if (!m || !m.barra) continue; const b = m.barra;
        if (u.estado === 'fuera' || u.estado === 'caida' || (cine && cine.modo === 'apertura')) { if (!b.hidden) b.hidden = true; continue; }   /* CG8a: sin barras en el plano de apertura */
        const p0 = previo[u.id] || u, ye = estandartes && estandartes.alto(u.id) ? estandartes.alto(u.id) * 0.22 : y; V3.set(p0.x + (u.x - p0.x) * al, ye, -(p0.y + (u.y - p0.y) * al)).project(camara);   /* CG8a: bajo el paño del estandarte */
        if (V3.z > 1 || Math.abs(V3.x) > 1.05 || Math.abs(V3.y) > 1.05) { if (!b.hidden) b.hidden = true; continue; }
        b.hidden = false; b.style.transform = 'translate3d(' + Math.round((V3.x + 1) / 2 * ancho) + 'px,' + Math.round((1 - V3.y) / 2 * alto) + 'px,0)';
        const cl = 'mn-e' + (u.lado ? ' ene' : '') + (sel.includes(u.id) ? ' sel' : '') + (!vivo(u) ? ' roto' : '');
        if (b.className !== cl) b.className = cl;
        const [h, mo, fa] = b.children, pon = (i, v) => { const w = Math.round(Math.max(0, Math.min(1, v)) * 100) + '%'; if (i.firstChild.style.width !== w) i.firstChild.style.width = w; };
        pon(h, u.n / u.n0); { const w = Math.round(Math.max(0, Math.min(1, (u.her || 0) / u.n0)) * 100) + '%', hb = h.lastChild; if (hb.style.width !== w) hb.style.width = w; }   /* sanos blanco, heridos ámbar, muertos el hueco */
        pon(mo, u.moral); pon(fa, 1 - u.fatiga);
      }
      /* BT1: las etiquetas no se pisan ni asoman encima de la ficha, la barra de órdenes, la de arriba o los avisos */
      if (mods.RO) mods.RO.separaEstandartes($('capa'), { zonas: [$('abajo'), $('arriba'), $('formas')], fijos: [$('aviso'), $('cinta')] });
    }

    /* ---------- ficha y botones de la selección ----------
       BT1: la barra común de seis (js/mando-varios.js, la misma que a pie): Formar… · Avanzar · Cargar · Alto · Relevo · Retirada, siempre
       con el mismo nombre en el mismo sitio. Sin manípulo elegido, apagados (al tocarlos dicen qué hacer). «Formar…» abre las formas
       encima de la barra, sin cambiarla. «Al tribuno» y «Bajar a pie» no son órdenes: van en la ficha, como botones de texto. */
    const FORMAS = Sim.FORMAS, SABE = Sim.SABE, MV = mods.MV, RO = mods.RO;
    const SUB_FORMA = { linea: 'la de siempre', columna: 'para marchar', cuna: 'rompe líneas', abierto: 'menos bajas al tiro', testudo: 'bajo los proyectiles', muro: 'para la carga', falange: 'picas de frente' };
    const HUECO = MV.HUECOS.grande, AVANCE = 40;   /* «Avanzar»: 40 m de frente, como la falange a pie (licencia de juego) */
    let verFormas = false, hudClave = '';
    $('ordenes').innerHTML = MV.BARRA.map(h => { const k = h === 'propia' ? HUECO.propia : h; return '<button type="button" class="orden mn-o' + (h === 'propia' ? ' propia' : '') + '" data-h="' + h + '" aria-label="' + MV.ROTULO[k] + '"><span class="aro"><svg viewBox="0 0 32 32">' + MV.ICONO[k] + '</svg></span><b>' + MV.ROTULO[k] + '</b></button>'; }).join('');
    function puedeYa(o) { return Sim.puede(S, Object.assign({ lado: 0, ids: sel, x: 0, y: 0 }, o)); }
    /* la orden del simulador de cada hueco, para lo elegido ahora */
    function ordenDe(h) {
      const t = HUECO[h]; if (t === 'formar') return null;
      if (t === 'mover') { const us = sel.map(i => S.man[i]); if (!us.length) return null; let cx = 0, cy = 0; for (const u of us) { cx += u.x / us.length; cy += u.y / us.length; } const a = us[0].a; return { tipo: 'mover', x: cx + Math.cos(a) * AVANCE, y: cy + Math.sin(a) * AVANCE, a }; }
      return { tipo: t };
    }
    function pintarHud(fuerza) {
      sel = sel.filter(i => S.man[i] && vivo(S.man[i]));
      const t = Math.floor(S.t), reloj = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); if ($('reloj').textContent !== reloj) $('reloj').textContent = reloj;
      const ft = $('ficha-t');
      let html = '', fb = '', formas = '';
      if (!sel.length) { html = '<span class="ayuda">Toca un manípulo tuyo (rojo) para mandarlo. Arrastra el campo para mirar; pellizca para acercar.</span>'; verFormas = false; }
      else {
        const us = sel.map(i => S.man[i]);
        if (us.length === 1) {
          const u = us[0], p = Sim.palabras(u, S), tono = { firme: 'bien', duda: 'medio', rompe: 'mal' }[p.animo] || '', tc = { fresca: 'bien', cansada: 'medio', agotada: 'mal' }[p.cansancio] || '', tb = { ganando: 'bien', igualado: 'medio', perdiendo: 'mal' }[p.combate] || '';
          html = '<b>' + esc(u.nom) + '</b> <small>' + esc(FORMAS[u.forma].n) + (u.cambio > 0 ? ' (formando)' : '') + ' · ' + (u.mando === 'jugador' ? 'lo llevas tú' : 'lo lleva el tribuno') + '</small><br>' +
            '<span>' + Math.round(u.n) + ' en pie' + (u.her ? ' · ' + Math.round(u.her) + ' heridos' : '') + (u.muertos ? ' · ' + Math.round(u.muertos) + ' muertos' : '') + ' de ' + u.n0 + '</span> <em class="' + tono + '">' + esc(p.animo) + '</em> <em class="' + tc + '">' + esc(p.cansancio) + '</em>' + (p.combate ? ' <em class="' + tb + '">' + esc(p.combate) + '</em>' : '');
        } else html = '<b>' + us.length + ' manípulos</b><br><span>' + Math.round(us.reduce((s, u) => s + u.n, 0)) + ' hombres</span>';
        if (us.some(u => u.mando === 'jugador')) { const no = puedeYa({ tipo: 'devolver' }); fb += '<button type="button" class="mn-t' + (no ? ' no' : '') + '" data-devolver="1" data-no="' + esc(no) + '">Al tribuno</button>'; }
        if (us.length === 1) { const no = puedeBajar(us[0].id); fb += '<button type="button" class="mn-t' + (no ? ' no' : '') + '" data-bajar="1" data-no="' + esc(no) + '">Bajar a pie</button>'; }
        if (verFormas) {
          const fs = []; for (const u of us) for (const f of (SABE[u.tropa] || ['linea', 'columna'])) if (!fs.includes(f)) fs.push(f);
          formas = fs.map(f => { const o = { tipo: 'formar', forma: f }, no = puedeYa(o); return '<button type="button" class="mn-f' + (no ? ' no' : '') + (us.every(u => u.forma === f) ? ' on' : '') + '" data-o="' + esc(JSON.stringify(o)) + '" data-no="' + esc(no) + '"><span>' + esc(FORMAS[f].n) + '</span><small>' + esc(SUB_FORMA[f] || '') + '</small></button>'; }).join('') +
            '<button type="button" class="mn-f b" data-volver="1"><span>Cerrar</span><small>sin cambiar</small></button>';
        }
      }
      /* los seis: siempre los mismos; apagado el que ahora no vale (data-no dice por qué) */
      let est = '';
      for (const b of $('ordenes').children) {
        const h = b.dataset.h, o = ordenDe(h), no = !sel.length ? 'Toca antes un manípulo tuyo' : o ? puedeYa(o) : '';
        const vig = sel.length && (h === 'propia' ? verFormas : h === 'alto' ? sel.every(i => S.man[i].orden === 'aguantar') : h === 'retirada' ? sel.every(i => S.man[i].orden === 'retirar') : h === 'cargar' ? sel.every(i => S.man[i].orden === 'cargar') : h === 'avanzar' ? sel.every(i => S.man[i].orden === 'mover') : h === 'relevo' ? sel.every(i => S.man[i].relevo > 0) : false);
        b.dataset.no = no; est += h + (no ? 0 : 1) + (vig ? 1 : 0);
        b.classList.toggle('apagada', !!no); b.classList.toggle('no', !!no); b.classList.toggle('vigente', !!vig);
      }
      const clave = html + '|' + fb + '|' + formas + '|' + varios;
      if (clave !== hudClave || fuerza) {
        hudClave = clave; ft.innerHTML = html; $('formas').innerHTML = formas; $('formas').hidden = !formas;
        for (const q of [...$('ficha-b').children]) if (q !== $('varios')) q.remove();
        $('varios').insertAdjacentHTML('beforebegin', fb);
        $('varios').setAttribute('aria-pressed', varios ? 'true' : 'false'); $('varios').classList.toggle('on', varios);
      }
      void est;
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
      if (b.dataset.no) { aviso(b.dataset.no); return; }
      if (b.dataset.h === 'propia') { verFormas = !verFormas; pintarHud(true); return; }
      const o = ordenDe(b.dataset.h); if (o) ordenar(o);
    });
    $('formas').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !lista) return;
      if (b.dataset.volver) { verFormas = false; pintarHud(true); return; }
      if (b.dataset.no) { aviso(b.dataset.no); return; }
      ordenar(JSON.parse(b.dataset.o));
    });
    $('ficha-b').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !lista || b === $('varios')) return;
      if (b.dataset.no) { aviso(b.dataset.no); return; }
      if (b.dataset.bajar) { bajar(sel[0]); return; }
      if (b.dataset.devolver) ordenar({ tipo: 'devolver' });
    });
    $('varios').addEventListener('click', () => { varios = !varios; pintarHud(true); });
    /* ---------- LP7: «Bajar a pie» con el control del bloque (LP0, «Sí, aprobado»). Mandas tu manípulo, no a un hombre: la escena
       de «Manípulo a pie» (gobierno/maquetas/bloque/, LP3–LP5a: dibujar el frente con el dedo, cuatro órdenes que se iluminan,
       pellizco a la vista del oficial, «Datos ▾», física) se abre en una capa encima, con las fuerzas de aquí: tu manípulo, el
       enemigo de enfrente y, si los hay cerca, un vecino a cada lado, su reserva y sus tiradores. Se lucha hasta que a uno le
       queda el 15 % (FIN_LUCHA). Mientras, la batalla grande espera en pausa. Al volver, Sim.vuelveDePie pone bajas, roturas y
       dónde acabó tu manípulo: la batalla solo recibe hombres. Nada se copia de la maqueta: es la misma página. ---------- */
    const LIGERA = new Set(['velites', 'milicia', 'honderos', 'peltastas']);   /* tiradores: hacen de «tiradores» del rival */
    const PICAS = new Set(['falange', 'hoplitas', 'sagrada']);                  /* LP7b: la falange baja a la maqueta de LP6; los hoplitas, aún no */
    const TOPE_AP = { tuyo: 120, centro: 120, lado: 70, reserva: 50, tiradores: 30 };   /* hombres por bloque a pie: con todos, 600 (el motor de física, cerca de 1 ms por paso) */
    const RUTA_AP = 'gobierno/maquetas/bloque/index.html';
    /* LP7b: la falange de picas baja a «Falange a pie» (gobierno/maquetas/falange/, LP6: el mismo control, con sarisas), con el mismo
       contrato de capa (?lp7=, window.__bloque, postMessage). Allí se lucha con 96 contra 96 (su maqueta); las bajas vuelven a escala */
    const RUTA_FAL = 'gobierno/maquetas/bloque/index.html?formacion=falange', N_FAL = 96;   /* FU3: la escena del bloque con la formación falange */
    function puedeBajar(id) {
      const u = S.man[id];
      if (!lista) return 'Aún se están formando'; if (S.fase === 'fin') return 'La batalla ha terminado';
      if (!u || u.lado !== 0) return 'Solo puedes bajar con los tuyos';
      if (!vivo(u)) return 'Están rotos: no te seguirían';
      if (!NUEVO[u.tropa] || LIGERA.has(u.tropa)) return 'A pie, de momento, solo con la infantería de línea';
      if (PICAS.has(u.tropa) && u.tropa !== 'falange') return 'Los hoplitas a pie aún no: su lanza no es la sarisa';
      if (!delanteDe(u)) return 'No hay enemigo delante';
      return '';
    }
    const linea = v => vivo(v) && NUEVO[v.tropa] && !LIGERA.has(v.tropa);
    /* en el marco de u: lado (+ a su derecha) y del (+ hacia delante), en metros */
    function enMarco(u, v) { const c = Math.cos(u.a), s = Math.sin(u.a), dx = v.x - u.x, dy = v.y - u.y; return { lado: dx * s - dy * c, del: dx * c + dy * s }; }
    /* el enemigo con el que pelearás: el que te toca de frente o, si no, el de línea más cerca por delante */
    function delanteDe(u) {
      const c = (S.cont[u.id] || []).map(k => S.man[k.id]).filter(v => v && v.lado === 1 && linea(v));
      if (c.length) return c[0];
      let mejor = null, md = 1e9;
      for (const v of S.man) { if (v.lado !== 1 || !linea(v)) continue; const p = enMarco(u, v); if (p.del < -5) continue; const d = Math.hypot(p.lado * 1.6, p.del); if (d < md) { md = d; mejor = v; } }
      return mejor;
    }
    function planApie(id) {
      const u = S.man[id], ce = delanteDe(u), pc = enMarco(u, ce), usados = new Set([u.id, ce.id]), mapa = {}, fuerzas = {};
      const pon = (k, v, tope) => { if (!v) return 0; usados.add(v.id); const h = Math.max(10, Math.min(TOPE_AP[tope], Math.round(v.n))); mapa[k] = { id: v.id, esc: v.n / h }; return h; };
      /* el más cerca de un sitio (lado, del) de mi marco, a menos de r metros, que cumpla ok */
      const cerca = (ok, lado, del, r) => { let m = null, md = r; for (const v of S.man) { if (usados.has(v.id) || !ok(v)) continue; const p = enMarco(u, v), d = Math.hypot(p.lado - lado, p.del - del); if (d < md) { md = d; m = v; } } return m; };
      fuerzas.tuyo = pon('tuyo', u, 'tuyo'); fuerzas.centro = pon('centro', ce, 'centro');
      const mio = v => v.lado === 0 && linea(v), suyo = v => v.lado === 1 && linea(v);
      fuerzas.amigas = [pon('amigas0', cerca(mio, -36, 0, 30), 'lado'), pon('amigas1', cerca(mio, 36, 0, 30), 'lado')];
      fuerzas.alas = [pon('alas0', cerca(suyo, pc.lado - 36, pc.del, 30), 'lado'), pon('alas1', cerca(suyo, pc.lado + 36, pc.del, 30), 'lado')];
      fuerzas.reserva = pon('reserva', cerca(suyo, pc.lado, pc.del + 22, 60), 'reserva');
      fuerzas.tiradores = pon('tiradores', cerca(v => v.lado === 1 && vivo(v) && LIGERA.has(v.tropa), pc.lado, pc.del - 12, 60), 'tiradores');
      const lejos = Math.max(12, Math.min(70, Math.round(pc.del - Sim.fondo(u) / 2 - Sim.fondo(ce) / 2)));
      /* el soldado de cada bando: el de su tropa (NUEVO); el romano de línea y el galo, los de la maqueta (Meshy) */
      const sold = (t, lado) => { if (lado === 0 ? ['hastati', 'principes'].includes(t) : t === 'galos') return null; const [nom, pueblo = nom] = NUEVO[t].split(':'), M = SOLD || {}, pal = M.PUEBLOS && M.PUEBLOS[pueblo], propio = M.ROMANOS && M.ROMANOS.has(pueblo) === (lado === 0);
        return { modelo: nom, paleta: propio ? pal || null : M.gama ? M.gama(COLOR[lado], pal) : null }; };
      const n = nombreTropa(ce.tropa), Los = n.charAt(0).toUpperCase() + n.slice(1);
      const plan = { semilla: (id * 131 + Math.round(S.t * 10)) % 9973 + 1, nivel: 'normal', fuerzas, lejos, r: sold(u.tropa, 0), g: sold(ce.tropa, 1),
        rival: { los: ce.tropa === 'galos' ? 'los galos' : 'los suyos', Los }, objetivo: 'Rompe su centro: se lucha hasta el 15 %' };
      return { plan, mapa };
    }
    /* LP7b: la falange contra el que tiene delante (las reglas del rival son las de los manípulos; su soldado y su color, los suyos) */
    function planFalange(id) {
      const u = S.man[id], ce = delanteDe(u), pc = enMarco(u, ce), n = nombreTropa(ce.tropa), Los = n.charAt(0).toUpperCase() + n.slice(1);
      const lejos = Math.max(22, Math.min(52, Math.round(pc.del - Sim.fondo(u) / 2 - Sim.fondo(ce) / 2)));
      const plan = { semilla: (id * 131 + Math.round(S.t * 10)) % 9973 + 1, lejos, unidad: ce.tropa, color: COLOR[1], rival: { Los }, objetivo: 'Rompe su línea: se lucha hasta el 15 %' };
      return { plan, mapa: { tuyo: { id: u.id, esc: u.n / N_FAL }, centro: { id: ce.id, esc: ce.n / N_FAL } }, falange: true };
    }
    function bajar(id) {
      const no = puedeBajar(id); if (no) { aviso(no); return no; }
      const fal = S.man[id].tropa === 'falange', P = fal ? planFalange(id) : planApie(id), f = document.createElement('iframe');
      apie = { id, P, frame: f, pausaAntes: S.pausa, t0: performance.now() };
      pausa(true); arrastre = null; gesto = null; dedos.clear(); verFormas = false; sel = [id];
      f.id = 'mn-apie'; f.title = fal ? 'A pie, con tu falange' : 'A pie, con tu manípulo'; f.setAttribute('allow', 'autoplay');
      f.src = (fal ? RUTA_FAL + '&' : RUTA_AP + '?') + 'lp7=' + encodeURIComponent(JSON.stringify(P.plan));
      el.appendChild(f); el.classList.add('apie'); pintarHud(true);
      return '';
    }
    /* vuelve de la capa: r (de la página, al salir) o lo que haya ahora si sales tú desde aquí */
    function subir(r) {
      if (!apie) return; const a = apie; apie = null;
      if (r === undefined) { try { r = a.frame.contentWindow.__bloque.lp7(); } catch (e) { r = null; } }
      let txt = 'Vuelves al mando';
      if (r) { const o = Sim.vuelveDePie(S, { tuyo: a.id, mapa: a.P.mapa, r }); txt = (r.ganador === 'tuyo' ? 'Victoria a pie' : r.ganador === 'enemigo' ? (a.P.falange ? 'Tu falange rompió' : 'Tu manípulo rompió') : 'Vuelves al mando') + ' · bajas: ' + o.bajas[0] + ' tuyas, ' + o.bajas[1] + ' suyas'; }
      try { a.frame.src = 'about:blank'; } catch (e) { /* nada */ } a.frame.remove();
      el.classList.remove('apie'); medir(); previo = S.man.map(u => ({ x: u.x, y: u.y, a: u.a })); colocar(0, true); avisos();
      const u = S.man[a.id]; if (cine) cine.libre(); cam.x = u.x; cam.z = -u.y; ponCamara();
      sel = vivo(u) ? [a.id] : []; pausa(a.pausaAntes); pintarHud(true); aviso(txt);
      if (S.fase === 'fin') finYa();
    }
    function alMensaje(e) { if (!apie || e.source !== apie.frame.contentWindow || !e.data || e.data.aqvila !== 'lp7') return; subir(e.data.r || null); }
    window.addEventListener('message', alMensaje); salidas.push(() => window.removeEventListener('message', alMensaje));
    /* para las pruebas: la escena de dentro (window.__bloque de la maqueta) */
    const dentro = () => { try { return apie && apie.frame.contentWindow.__bloque; } catch (e) { return null; } };

    /* ---------- avisos en palabras, del registro S.reg ---------- */
    let nReg = 0, chocaron = false, nCuadros = 0; const cinta = [];
    /* CG8a: una nube de polvo donde chocan o cargan */
    function polvoDe(e) {
      if (!entorno || !entorno.golpe || !/^(choque|carga|carga-frenada|ruptura|desboque)$/.test(e.tipo)) return;
      const u = e.id !== undefined ? S.man[e.id] : null, v = e.con !== undefined ? S.man[e.con] : null; if (!u) return;
      const x = v ? (u.x + v.x) / 2 : u.x, y = v ? (u.y + v.y) / 2 : u.y, a = v ? Math.atan2(v.y - u.y, v.x - u.x) + Math.PI / 2 : u.a + Math.PI / 2;
      entorno.golpe(x, -y, Math.min(Sim.frente(u), v ? Sim.frente(v) : 99), a, e.tipo === 'choque' ? 1 : 0.8);
    }
    function avisos() {
      const nuevos = [];
      for (; nReg < S.reg.length; nReg++) {
        const e = S.reg[nReg]; suena(e); if (cine) cine.evento(e); polvoDe(e); if (banda && root.Voces) { if (e.tipo === 'fin') banda.fin(e.como); else { const sit = root.Voces.deSim(e); if (sit) banda.dice(sit); } }
        const u = e.id !== undefined ? S.man[e.id] : null, nom = u ? u.nom : '', mio = e.lado === 0;
        let t = '', tono = '';
        if (e.tipo === 'flanqueo') { t = mio ? '¡Flanco al aire! Os flanquean a ' + nom : 'Flanqueáis a ' + nom; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'retaguardia') { t = mio ? '¡Os atacan por la espalda! ' + nom : 'Atacáis por la espalda a ' + nom; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'duda') { t = mio ? nom + ': a punto de romper' : nom + ' (enemigos) dudan'; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'ruptura') { t = mio ? '¡Huyen los ' + nom + '!' : 'Huyen los ' + nom; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'testudo-roto') { t = e.texto; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'carga' || e.tipo === 'carga-frenada') { t = e.texto; tono = (e.tipo === 'carga') === mio ? 'bien' : 'mal'; }
        else if (e.tipo === 'relevo' && mio) t = e.texto;
        else if (e.tipo === 'caida') { t = e.texto; tono = mio ? 'mal' : 'bien'; }
        else if (e.tipo === 'tactica') { t = e.texto; tono = (e.tac === 'galos-fin' || e.tac === 'falange' || e.tac === 'envuelto' || e.tac === 'copados') === mio ? 'mal' : 'bien'; }   /* TH1 */
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
      if (apie) return; lienzo.setPointerCapture && lienzo.setPointerCapture(e.pointerId); if (cine) cine.toca();
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (dedos.size === 2) { const [a, b] = [...dedos.values()]; gesto = { tipo: 'pellizco', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, cd: cam.d }; arrastre = null; return; }
      if (dedos.size > 2) return;
      const u = manipuloEn(e.clientX, e.clientY, 0), p = suelo(e.clientX, e.clientY);
      if (u && sel.includes(u.id) && S.fase !== 'fin') gesto = { tipo: 'orden', x0: e.clientX, y0: e.clientY, p0: p, movido: false, t0: performance.now() };
      else gesto = { tipo: 'camara', x0: e.clientX, y0: e.clientY, p0: p, movido: false, t0: performance.now() };
    }
    function mueve(e) {
      if (!dedos.has(e.pointerId) || !gesto) return; dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesto.tipo === 'pellizco') { if (dedos.size < 2) return; if (cine) cine.libre(); const [a, b] = [...dedos.values()]; cam.d = gesto.cd * gesto.d0 / (Math.hypot(a.x - b.x, a.y - b.y) || 1); ponCamara(); return; }
      if (!gesto.movido && Math.hypot(e.clientX - gesto.x0, e.clientY - gesto.y0) < 10) return; gesto.movido = true;
      if (gesto.tipo === 'camara') { if (!gesto.p0) return; if (cine) cine.libre(); const p = suelo(e.clientX, e.clientY); if (!p) return; cam.x += gesto.p0.x - p.x; cam.z -= gesto.p0.y - p.y; ponCamara(); return; }
      const p = suelo(e.clientX, e.clientY); if (!p || !gesto.p0) return;
      const dx = p.x - gesto.p0.x, dy = p.y - gesto.p0.y, u0 = S.man[sel[0]];
      let a = Math.atan2(dy, dx); if (u0 && Math.cos(a - u0.a) < -0.3) a = u0.a;       /* hacia atrás: retroceden mirando al enemigo */
      arrastre = { dx, dy, a, cx: e.clientX, cy: e.clientY };
    }
    function arriba(e) {
      if (!dedos.has(e.pointerId)) return; dedos.delete(e.pointerId);
      const g = gesto; if (dedos.size > 0) { if (g && g.tipo === 'pellizco') gesto = null; return; }
      gesto = null; if (!g) return;
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
    lienzo.addEventListener('wheel', e => { e.preventDefault(); if (apie) return; if (cine) cine.libre(); cam.d *= Math.exp(e.deltaY * 0.0012); ponCamara(); }, { passive: false });

    /* ---------- arriba: pausa, velocidad, retirarse ---------- */
    /* CG4b: la campaña guarda la batalla a mitad (cfg.guardar) para retomarla si se recarga la página: cada ~5 s de batalla,
       al pausar, al acabar y al ocultar la app. Un fallo al guardar no para la batalla. */
    let tGuarda = 0;
    function guarda() { if (!cfg.guardar || cerrado || !lista) return; try { cfg.guardar(S); } catch (e) { /* sin guardado: se sigue */ } tGuarda = 0; }
    const alOcultar = () => { if (document.visibilityState === 'hidden') guarda(); };
    window.addEventListener('pagehide', guarda); document.addEventListener('visibilitychange', alOcultar);
    salidas.push(() => { window.removeEventListener('pagehide', guarda); document.removeEventListener('visibilitychange', alOcultar); });
    function pausa(v) { const p = v === undefined ? !S.pausa : !!v; if (p !== S.pausa && S.fase !== 'fin') { Sim.ordenar(S, { tipo: 'pausa', valor: p }); if (p) guarda(); } $('pausa').textContent = S.pausa ? 'Seguir' : 'Pausa'; $('pausa').classList.toggle('on', S.pausa); $('enpausa').hidden = !S.pausa; }
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
      if (finVisto) return; finVisto = true; clearTimeout(tFin); guarda();
      const R = S.resultado || { como: 'retirada', motivo: '', t: S.t, bajas: [0, 0], inicial: [0, 0] }, mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      $('fin-t').textContent = { victoria: 'Victoria', derrota: 'Derrota', retirada: 'Retirada' }[R.como] || 'Fin';
      $('fin-p').textContent = R.motivo || '';
      const m = Math.floor(R.t / 60), s = Math.round(R.t % 60);
      const ob = l => { const w = R.muertos && R.heridos ? 'muertos ' + mil(R.muertos[l]) + ' · heridos ' + mil(R.heridos[l]) : mil(R.bajas[l]) + ' de ' + mil(R.inicial[l]);
        const gana = (R.como === 'victoria' ? 0 : 1) === l, ex = !R.heridos ? '' : gana ? (R.recuperados ? ' (' + mil(R.recuperados) + ' recuperados)' : '') : (l === 0 ? R.cautivos : R.prisioneros) ? ' (' + mil(l === 0 ? R.cautivos : R.prisioneros) + ' prisioneros)' : '';
        return w + ex; };
      $('fin-c').innerHTML = '<span>Tus bajas</span><b>' + ob(0) + '</b><span>Bajas del enemigo</span><b>' + ob(1) + '</b>' + (R.como === 'victoria' && R.prisioneros ? '<span>Prisioneros</span><b>' + mil(R.prisioneros) + '</b>' : '') + '<span>Duración</span><b>' + m + ' min ' + s + ' s</b>';
      if (apie) subir(); $('fin').hidden = false; $('abajo').hidden = true; sel = [];
    }

    /* ---------- el tiempo: pasos fijos del simulador; dt acotado ---------- */
    function pasoSim() { previo = S.man.map(u => ({ x: u.x, y: u.y, a: u.a })); Sim.avanzar(S, PASO); }
    function avanza(dtReal) {
      const dt = S.pausa || S.fase === 'fin' ? 0 : Math.min(0.1, dtReal) * vel;
      if (dt > 0) { acum += dt; let k = 0; while (acum >= PASO && k++ < 8) { acum -= PASO; pasoSim(); } if (acum > PASO) acum = PASO; }
      Tv += dt; colocar(dt, false); if (FF && dt > 0) FF.paso(figs, dt, leeFig);
      if (cfg.guardar && dt > 0) { tGuarda += dt; if (tGuarda >= 5) guarda(); }
      if (S.fase === 'fin' && !finVisto && !tFin) tFin = setTimeout(finYa, 1500);
    }
    function pinta(dt) { nCuadros++; if (cine) cine.tick(); pintarSuelo(); pintarFiguras(); pintarEstandartes(); if (entorno) entorno.tick(dt || 0, S, Sim, camara, alto * dpr); renderer.render(escena, camara); pintarBarras(); }
    let raf = 0, antes = 0, tHud = 0;
    function cuadro(ahora) {
      if (cerrado) return; raf = requestAnimationFrame(cuadro);
      const real = Math.max(0, (ahora - antes) / 1000 || 0); antes = ahora;
      if (!lista) return;
      if (banda && !S.pausa && S.fase !== 'fin') banda.tic(Math.min(0.1, real) * vel, () => root.Banda.resumenSim(S), () => S.man.some(u => u.lado === 0 && u.estado === 'duda'));
      ambiente(Math.min(0.1, real) * vel);   /* SON4-5: música y fragor siguen también a pie */
      if (apie) return;   /* LP7: a pie pinta la capa; aquí no se dibuja (un solo lienzo trabajando) */
      avanza(real); pinta(S.pausa || S.fase === 'fin' ? 0 : Math.min(0.1, real) * vel); avisos(); preguntas(real);
      if (ahora - tHud > 250) { tHud = ahora; pintarHud(); }
    }

    function soltarSoldados() { for (const s of soldados.values()) { try { SOLD.soltarSoldado(s); } catch (e) { /* ya suelto */ } } soldados.clear(); }
    async function arrancar() {
      try {
        const tipos = new Set(['hastati']); for (const u of S.man) tipos.add(u.tropa);
        const quiero = new Set(); for (const u of S.man) if (NUEVO[u.tropa]) quiero.add(u.tropa + u.lado);
        const nuevos = !quiero.size ? null : import('./gfx/soldado.js').then(Mod => { SOLD = Mod; return Promise.all([...quiero].map(id => { const lado = +id.slice(-1), [nom, pueblo = nom] = NUEVO[id.slice(0, -1)].split(':'), propio = Mod.ROMANOS.has(pueblo) === (lado === 0), pal = Mod.PUEBLOS[pueblo];
          return Mod.cargarSoldado(nom, propio ? pal || null : Mod.gama(COLOR[lado], pal)).then(s => { if (s) soldados.set(id, s); }); })); }).catch(() => { /* sin soldado nuevo: 0 A.D. */ });
        await Promise.all([preload([...tipos]), Gr.loadGroundTextures().then(() => St.preloadStatic(['cipres', 'olivo', 'pino'])), nuevos, import('./gfx/sonido.js').catch(() => null)]);   /* SON4: el banco de sonido (global Sonido) para la música y las voces */
        if (cerrado) { soltarSoldados(); return; }
        if (!getUnit('hastati') && !soldados.size) throw new Error('No se han podido cargar los soldados');
        entorno = await C.montarEntorno({ THREE, escena, Gr, St, UNIT_SCALE, campo: cfg.campo, renderer });
        const [CI, ES] = await Promise.all([import('./gfx/cine-mando.js').catch(() => null), import('./gfx/estandartes.js').catch(() => null)]);   /* CG8a: cámara de cine y estandartes */
        if (cerrado) { entorno.soltar(); soltarSoldados(); return; }
        preparar(); camaraInicial(); colocar(0, true);
        if (ES) estandartes = crearEst(ES);
        if (CI) { cine = CI.crearCine({ THREE, camara, cam, ponCamara, S }); cine.apertura(); }
        if (FIS) FF = FIS.crearFisicaFiguras({ escala: altoN * TALLA / 1.78 });   /* FI4: radios y escudos a la medida de la figura (TALLA) */
        lista = true; if (banda) banda.inicia(); $('carga').hidden = true; pausa(S.pausa); pintarHud(true);
        if (S.fase === 'fin') finYa();
        else if (DU && !S.arenga && S.t === 0) arengar();
        else { cinta.push({ t: 'Toca un manípulo tuyo y arrástralo para moverlo', tono: '', hasta: performance.now() + 7000 }); }
      } catch (e) { console.error(e); $('carga-p').textContent = 'No se ha podido cargar la batalla.'; $('carga-s').hidden = false; }
    }

    function cerrarTodo() {
      cerrado = true; cancelAnimationFrame(raf); clearTimeout(tFin); if (DU) DU.cerrar(); if (banda) banda.quita(); if (root.Sonido && root.Sonido.callaFondos) root.Sonido.callaFondos();   /* SON5: cállalo todo (fragor, música) */   /* window.__mn se queda con cerrado = true para las pruebas */
      for (const f of salidas) f();
      for (const m of mallas.values()) { try { if (m.nv) for (const t of m.nv) { escena.remove(t.malla); t.dispose(); } else { escena.remove(m.malla); m.malla.geometry.dispose(); } } catch (e) { /* ya liberada */ } }
      soltarSoldados(); if (entorno) entorno.soltar(); if (estandartes) estandartes.soltar();
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
      guarda: () => guarda(),   /* CG4b: guarda ya (pruebas del guardado a mitad) */
      salta: seg => { const hasta = S.t + seg; while (S.t < hasta - 1e-9 && S.fase !== 'fin' && !S.pausa) pasoSim(); acum = 0; previo = S.man.map(u => ({ x: u.x, y: u.y, a: u.a })); colocar(0, true); avisos(); pintarHud(true); if (S.fase === 'fin') finYa(); return S.t; },
      cuadro: dt => { if (apie) { const b = dentro(); if (b && b.C) for (let k = 0; k < Math.round((dt || 0) / 0.05); k++) b.C.paso(0.05); return; } avanza(dt || 0); pinta(S.pausa ? 0 : Math.min(0.1, dt || 0) * vel); avisos(); pintarHud(); },
      camara: o => { if (cine) cine.libre(); if (o) Object.assign(cam, o); else camaraInicial(); ponCamara(); return Object.assign({}, cam); },
      /* para pruebas del dedo: el punto de pantalla (px CSS) de un manípulo */
      pantalla: id => { const u = S.man[id]; V3.set(u.x, 0, -u.y).project(camara); return { x: (V3.x + 1) / 2 * ancho, y: (1 - V3.y) / 2 * alto }; },
      terminar, ver: () => verFormas,
      /* LP7: a pie. bajar(id) devuelve '' o el motivo; apie() lo de la capa; frente(p0, p1) dibuja el frente (metros, marco del bloque);
         orden(n) una de las cuatro; subir() vuelve con las bajas de ahora */
      camaraY: () => camara.position.y,
      cine: otra => { if (cine && otra) cine.apertura(otra === true ? undefined : otra); return cine ? cine.modo : null; },   /* CG8a: 'apertura', 'sigue' o 'mando'; cine(true) repite la apertura; cine(s) la deja quieta en el segundo s (capturas) */
      /* PIL3: pila en el aire o hincados ahora mismo */
      pila: () => pila ? (FF ? FF.proyectiles.length : pila.vivos.length) : 0,
      fisica: () => FF ? FF.medir() : null, fisicaCero: () => FF && FF.cero(),   /* FI4 */
      tiran: id => figs.filter(f => f.m === id && f.est === 0).map(f => movimiento(f)[0] + (f.nv < 2 ? '' : '·lejos')).join(' '),
      bajar: id => bajar(id), subir: () => subir(),
      apie: () => { if (!apie) return null; const b = dentro(), e = b && b.listo && b.estado ? b.estado() : null; return { id: apie.id, lista: !!e, plan: apie.P.plan, estado: e, r: b && b.lp7 ? b.lp7() : null }; },
      frente: (p0, p1) => { const b = dentro(); if (!b || !b.dibuja) return 'No estás a pie'; b.dibuja(p0, p1); return ''; },
      orden: n => { const b = dentro(); return b && b.orden ? b.orden(n) : false; },
      capa: () => apie ? apie.frame : null,
      /* triángulos por pieza de la escena (para el presupuesto) */
      desglose: () => { const r = {}; escena.traverse(o => { if (!o.isMesh || !o.visible) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3, n = o.isInstancedMesh ? o.count : 1, k = o.name || (o.isInstancedMesh ? 'inst' : 'malla') + ':' + Math.round(t); r[k] = (r[k] || 0) + Math.round(t * n); }); return r; }
    };
    return { cerrarTodo };
  }

  root.UIMando = { abrir, cerrar, get abierta() { return !!activa; } };
})(typeof window !== 'undefined' ? window : globalThis);
