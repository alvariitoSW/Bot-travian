/* AQVILA — SON7: banda sonora grabada (OpenGameArt; créditos y licencias en assets/musica/LICENSE.txt). Sustituye a la música hecha por código.
   Cada pantalla tiene su pista: menú, ciudad (también Saber, Tropas, Imperio y Senado), mapa, batalla; y al acabar una batalla suena victoria o derrota, una vez.
   Para no gastar memoria en el móvil NO se descodifican las pistas: cada una es un <audio> (que va leyendo el archivo) conectado con createMediaElementSource
   a una ganancia propia y de ahí a Sonido.maestro (un solo AudioContext: Sonido.contexto()). Si un archivo no carga, silencio: mejor eso que otra música.
   Fundido cruzado de 2 s entre pantallas. En batalla, el volumen sube con la tensión (tensionDe) y se agacha con cuernos y voces (agacha).
   Parte pura (también en Node): tensionDe, estadoDe, temaDe, tensionMapa, pistaDe, volumenBatalla, ARCHIVOS. Parte de audio: tema, iniciar, tension, estado, final, agacha, parar. */
(function (raiz) {
  'use strict';
  const M = { activa: false, estadoActual: 'espera' };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- parte pura ---------- */
  /* resumen = { fase: 'lejos' | 'lucha' | 'fin', moral: [propia, enemiga] (0..1, media de los cuerpos), rotos: [propios, enemigos] (0..3), cansancio: 0..1 (opcional) } */
  function tensionDe(r) {
    r = r || {}; const mo = r.moral || [1, 1], ro = r.rotos || [0, 0];
    const mp = clamp(mo[0] === undefined ? 1 : mo[0], 0, 1), me = clamp(mo[1] === undefined ? 1 : mo[1], 0, 1);
    let t = r.fase === 'lucha' ? 0.5 : r.fase === 'fin' ? 0.3 : 0.22;   // despliegue y espera: tensa pero contenida
    if (r.fase === 'lucha') t += 0.34 * (1 - mp) + 0.06 * (1 - me);
    t += 0.12 * clamp(ro[0], 0, 3) - 0.04 * clamp(ro[1], 0, 3) + 0.06 * clamp(r.cansancio || 0, 0, 1);
    return clamp(t, 0, 1);
  }
  /* espera | lucha | ventaja (vas ganando) | peligro (vas perdiendo) | victoria | derrota. */
  function estadoDe(r) {
    r = r || {}; const mo = r.moral || [1, 1], ro = r.rotos || [0, 0];
    if (r.fase === 'fin') return r.resultado === 'victoria' ? 'victoria' : 'derrota';
    if (r.fase !== 'lucha') return 'espera';
    const mp = mo[0] === undefined ? 1 : mo[0], me = mo[1] === undefined ? 1 : mo[1];
    if (ro[0] > ro[1] || mp < 0.45 || mp < me - 0.2) return 'peligro';
    if (ro[1] > ro[0] || me < mp - 0.2) return 'ventaja';
    return 'lucha';
  }
  M.tensionDe = tensionDe; M.estadoDe = estadoDe;

  /* pantalla de la interfaz (UI.tab) → tema. Las pantallas desconocidas tocan la de ciudad. */
  const PANTALLAS = { menu: 'menu', city: 'ciudad', saber: 'ciudad', army: 'ciudad', imperio: 'ciudad', hero: 'ciudad', senado: 'ciudad', map: 'mapa' };
  const ARCHIVOS = { menu: 'assets/musica/menu.mp3', ciudad: 'assets/musica/ciudad.mp3', mapa: 'assets/musica/mapa.mp3', batalla: 'assets/musica/batalla.mp3', victoria: 'assets/musica/victoria.mp3', derrota: 'assets/musica/derrota.mp3' };
  M.ARCHIVOS = ARCHIVOS; M.TEMAS = ['menu', 'ciudad', 'mapa'];
  M.temaDe = pantalla => PANTALLAS[pantalla] || 'ciudad';
  /* tensión del mapa según los ejércitos enemigos en marcha (0 = paz) */
  M.tensionMapa = n => { n = Math.max(0, Math.floor(n || 0)); return n === 0 ? 0.1 : n === 1 ? 0.4 : n === 2 ? 0.55 : 0.7; };
  /* volumen de la pista de batalla según la tensión: de 0,45 (calma) a 0,85 (todo roto); los temas van a 0,6 y victoria/derrota a 0,8 */
  const GANA_TEMA = 0.6, GANA_FINAL = 0.8;
  const volumenBatalla = ten => 0.45 + 0.4 * clamp(ten === undefined ? 0.22 : ten, 0, 1);
  M.volumenBatalla = volumenBatalla; M.GANA_TEMA = GANA_TEMA; M.GANA_FINAL = GANA_FINAL;
  /* qué pista debe sonar. e = { encendida, visible, activa (hay batalla), final ('victoria' | 'derrota' | null), finalHecho, tema } */
  function pistaDe(e) {
    e = e || {};
    if (e.encendida === false || e.visible === false) return null;
    if (e.activa) return e.final ? (e.finalHecho ? null : e.final) : 'batalla';
    return e.tema && ARCHIVOS[e.tema] ? e.tema : null;
  }
  M.pistaDe = pistaDe;

  /* ---------- parte de audio (solo en el navegador) ---------- */
  const CLAVE_MUSICA = 'aqvila-musica';
  let ON = true; try { if (raiz.localStorage && raiz.localStorage.getItem(CLAVE_MUSICA) === '0') ON = false; } catch (e) { /* sin almacenamiento: encendida */ }
  const Son = () => raiz.Sonido;
  const visible = () => !(raiz.document && raiz.document.hidden);
  const puedeSonar = () => { const so = Son(); return !!(so && so.activo !== false && so.ctx && so.ctx.state === 'running' && so.maestro && visible()); };

  const T = { tema: null, id: 0 };                                        // tema de la pantalla actual
  const S = { ten: 0.22, meta: 0.22, final: null, finalHecho: false, nueva: false };   // la batalla
  const P = {};                                                           // pistas ya creadas: { el, g, vol, tOff }
  const C = { nombre: null };                                             // pista que suena ahora
  let duck = null;

  function bus(so) {                                                      // ganancia de «agacha», común a todas las pistas
    if (!duck) { duck = so.ctx.createGain(); duck.gain.value = 1; duck.connect(so.maestro); }
    return duck;
  }
  function pista(nombre) {
    if (P[nombre]) return P[nombre];
    const so = Son(), c = so.ctx, el = new raiz.Audio();
    el.preload = 'auto'; el.loop = nombre !== 'victoria' && nombre !== 'derrota'; el.src = ARCHIVOS[nombre];
    el.addEventListener('error', () => { /* sin archivo, silencio */ });
    const g = c.createGain(); g.gain.value = 0.0001; c.createMediaElementSource(el).connect(g); g.connect(bus(so));
    const p = P[nombre] = { el, g, vol: 0, tOff: 0 };
    if (!el.loop) el.addEventListener('ended', () => { if (nombre === S.final) { S.finalHecho = true; reconcilia(0.3); } });
    return p;
  }
  function rampa(g, c, a, seg) { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.linearRampToValueAtTime(Math.max(0.0001, a), t + seg); }
  function baja(nombre, seg) {
    const p = P[nombre], c = Son().ctx; if (!p) return;
    rampa(p.g, c, 0.0001, seg); p.vol = 0; clearTimeout(p.tOff);
    p.tOff = setTimeout(() => { if (C.nombre !== nombre) { try { p.el.pause(); } catch (e) { /* nada */ } } }, seg * 1000 + 150);
  }
  function sube(nombre, vol, seg, reinicia) {
    const p = pista(nombre), c = Son().ctx; clearTimeout(p.tOff);
    try { if (reinicia) p.el.currentTime = 0; } catch (e) { /* aún sin metadatos: empieza por el principio */ }
    rampa(p.g, c, vol, seg); p.vol = vol;
    const r = p.el.play(); if (r && r.catch) r.catch(() => { /* sin gesto del jugador o sin archivo: silencio */ });
  }
  const volumenDe = nombre => nombre === 'batalla' ? volumenBatalla(S.ten) : nombre === 'victoria' || nombre === 'derrota' ? GANA_FINAL : GANA_TEMA;

  /* pone a sonar lo que toca: cambia de pista con fundido cruzado (seg) o ajusta el volumen de la que ya suena */
  function reconcilia(seg) {
    try {
      const so = Son(); if (!so || !so.ctx) return;
      const puede = puedeSonar(), q = puede ? pistaDe({ encendida: ON, visible: true, activa: M.activa, final: S.final, finalHecho: S.finalHecho, tema: T.tema }) : null;
      seg = !puede ? 0.05 : seg === undefined ? 2 : seg;
      if (q !== C.nombre) {
        const antes = C.nombre; C.nombre = q;
        if (antes) baja(antes, seg);
        if (q) { const nueva = q === 'batalla' ? S.nueva : q === 'victoria' || q === 'derrota'; if (q === 'batalla') S.nueva = false; sube(q, volumenDe(q), seg, nueva); }
      } else if (q) {
        const p = P[q], v = volumenDe(q);
        if (p && Math.abs(v - p.vol) > 0.01) { p.vol = v; const t = so.ctx.currentTime; p.g.gain.cancelScheduledValues(t); p.g.gain.setValueAtTime(Math.max(0.0001, p.g.gain.value), t); p.g.gain.setTargetAtTime(v, t, 0.4); }
        if (p && p.el.paused && !(q === S.final && S.finalHecho)) { const r = p.el.play(); if (r && r.catch) r.catch(() => { /* nada */ }); }
      }
    } catch (e) { /* la música nunca rompe el juego */ }
  }
  function tic() {
    S.ten += clamp(S.meta - S.ten, -0.1, 0.1);                            // la tensión se mueve despacio
    reconcilia();
  }
  M.tic = tic;                                                            // lo da el reloj de la página cada 400 ms; público para las pruebas
  function arranca() {
    if (T.id || !raiz.document) return;
    T.id = setInterval(tic, 400);
    try { raiz.document.addEventListener('visibilitychange', () => reconcilia()); } catch (e) { /* nada */ }
  }

  /* ---------- interfaz ---------- */
  /* M.tema(nombre, { estacion, tension }): la pantalla pide su tema (null = ninguno). No crea el AudioContext: espera al primer toque del jugador. */
  M.tema = function (nombre, opc) {
    if (nombre === null) { T.tema = null; reconcilia(2); return true; }
    if (!ARCHIVOS[nombre] || nombre === 'batalla' || nombre === 'victoria' || nombre === 'derrota') return false;
    T.tema = nombre; arranca(); reconcilia(2); return true;
  };
  M.estadoTema = () => ({ tema: T.tema, pista: C.nombre, sonando: !!C.nombre, batalla: M.activa, encendida: ON });
  M.encendida = () => ON;
  M.on = function () { ON = true; try { raiz.localStorage.setItem(CLAVE_MUSICA, '1'); } catch (e) { /* nada */ } reconcilia(2); };
  M.off = function () { ON = false; try { raiz.localStorage.setItem(CLAVE_MUSICA, '0'); } catch (e) { /* nada */ } reconcilia(1); };
  M.pista = () => C.nombre;                                               // para comprobar qué suena
  M.audio = nombre => (P[nombre] || {}).el || null;

  /* batalla: iniciar (con el primer toque), tension, estado, agacha, final y parar */
  M.iniciar = function (opc) {
    try {
      const so = Son(); if (!so || !so.contexto) return false; const c = so.contexto(); if (!c || !so.maestro) return false;
      if (M.activa) return true;
      opc = opc || {}; S.ten = S.meta = clamp(opc.tension === undefined ? 0.22 : opc.tension, 0, 1); S.final = null; S.finalHecho = false; S.nueva = true;
      M.activa = true; M.estadoActual = 'espera'; arranca(); reconcilia(2);
      pista('victoria'); pista('derrota');                                // se van leyendo en silencio (0,8 MB) para que la fanfarria suene en cuanto acabe la batalla
      return true;
    } catch (e) { M.activa = false; return false; }
  };
  /* tensión objetivo 0..1 (el volumen la sigue despacio) y estado nombrado */
  M.tension = function (x) { S.meta = clamp(x, 0, 1); };
  M.estado = function (nombre) { M.estadoActual = nombre; };
  M.nivel = () => S.ten;
  /* al sonar un cuerno o una orden, la música baja ≈ 6 dB durante un segundo */
  M.agacha = function () {
    try {
      const so = Son(); if (!duck || !so || !so.ctx) return; const t = so.ctx.currentTime, p = duck.gain;
      p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(0.5, t + 0.08); p.setValueAtTime(0.5, t + 0.9); p.linearRampToValueAtTime(1, t + 1.6);
    } catch (e) { /* nada */ }
  };
  /* fin de la batalla: la pista de batalla se funde y suena victoria o derrota una vez; después, silencio hasta que se cierra la batalla (parar) */
  M.final = function (res) {
    try {
      if (!M.activa || S.final) return; S.final = res === 'victoria' ? 'victoria' : 'derrota'; M.estadoActual = S.final;
      S.finalHecho = !puedeSonar();                                       // si no se puede oír, no se espera a que acabe
      reconcilia(1.5);
    } catch (e) { /* nada */ }
  };
  M.parar = function (seg) {
    try { M.activa = false; S.final = null; S.finalHecho = false; reconcilia(seg === undefined ? 2 : seg); } catch (e) { M.activa = false; }
  };

  raiz.Musica = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
