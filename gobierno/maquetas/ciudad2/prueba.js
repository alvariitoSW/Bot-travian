/* Página de prueba para el móvil: contador de fluidez y botones. Con ?quieto no hace nada (lo usa captura.mjs). */
const Q = new URLSearchParams(location.search);
if (!Q.has('quieto')) {
  const CULTURAS = ['roma', 'grecia', 'punica'], NOMBRE_C = { roma: 'Romana', grecia: 'Griega', punica: 'Púnica' };
  const VISTAS = ['cerca', 'lejos', 'calle'], NOMBRE_V = { cerca: 'Cerca', lejos: 'Lejos', calle: 'Calle' };
  let cultura = Q.get('cultura') || 'roma', vista = Q.get('vista') || 'cerca';
  if (!CULTURAS.includes(cultura)) cultura = 'roma'; if (!VISTAS.includes(vista)) vista = 'cerca';

  const css = document.createElement('style');
  css.textContent = `
  #q-info{position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top) + 8px);padding:8px 10px;border-radius:10px;background:#000b;color:#fff;font:600 15px/1.25 system-ui;text-align:center;pointer-events:none;z-index:5}
  #q-info small{display:block;margin-top:3px;font:400 12px/1.3 system-ui;color:#fffc}
  #q-pie{position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 8px);z-index:5;display:flex;flex-direction:column;gap:8px}
  #q-pie p{margin:0;text-align:center;font:13px system-ui;color:#fff;text-shadow:0 1px 3px #000}
  #q-pie div{display:flex;gap:8px}
  #q-pie button{flex:1;min-height:52px;padding:6px 4px;border:0;border-radius:12px;background:#7a1f1b;color:#fff;font:700 15px system-ui;touch-action:manipulation}
  #q-pie button:active{background:#a82a24}
  #nota{display:none}`;
  document.head.appendChild(css);

  const info = document.createElement('div'); info.id = 'q-info'; info.innerHTML = '<span id="q-fps">Cargando…</span><small id="q-det"></small>';
  const pie = document.createElement('div'); pie.id = 'q-pie';
  pie.innerHTML = '<p>Espera 10 segundos y dime los tres números.</p><div><button id="q-cul"></button><button id="q-vis"></button></div><div><button id="q-cam"></button></div>';
  document.body.append(info, pie);
  const $ = id => document.getElementById(id), bCul = $('q-cul'), bVis = $('q-vis'), bCam = $('q-cam');
  const pintar = () => { bCul.textContent = 'Cultura: ' + NOMBRE_C[cultura]; bVis.textContent = 'Vista: ' + NOMBRE_V[vista]; bCam.textContent = paseo ? 'Parar cámara' : 'Mover cámara'; };

  /* ---- medida ---- */
  let t0 = 0, tSeg = 0, nSeg = 0, total = 0, ahora = 0, minimo = Infinity, ultimo = 0, lista = null;
  const reiniciar = () => { lista = null; t0 = 0; ahora = 0; minimo = Infinity; total = 0; nSeg = 0; };
  function medir(t) {
    requestAnimationFrame(medir);
    if (window.__lista !== true) { return; }
    if (lista === null) lista = t;
    if (!t0) { if (t - lista < 3000) return; t0 = tSeg = t; nSeg = 0; total = 0; return; }
    nSeg++; total++;
    if (t - tSeg >= 1000) { ahora = nSeg * 1000 / (t - tSeg); if (ahora < minimo) minimo = ahora; nSeg = 0; tSeg = t; }
  }
  requestAnimationFrame(medir);
  function mostrar() {
    const f = x => Math.round(x), lienzo = $('lienzo') || document.querySelector('canvas'), r = window.__info && window.__info.render;
    if (window.__lista === true && t0 && minimo < Infinity) $('q-fps').textContent = 'Ahora ' + f(ahora) + ' · Media ' + f(total * 1000 / (performance.now() - t0)) + ' · Mínimo ' + f(minimo);
    else $('q-fps').textContent = window.__lista === true ? 'Midiendo…' : 'Cargando…';
    $('q-det').textContent = (r ? r.triangles.toLocaleString('es') + ' triángulos · ' + r.calls + ' llamadas' : '—') + ' · lienzo ' + (lienzo ? lienzo.width + '×' + lienzo.height : '—') + ' px · dpr ' + (+devicePixelRatio.toFixed(2));
  }
  setInterval(mostrar, 250);

  /* ---- paseo de cámara ---- */
  let paseo = false, base = null, objetivo = null, inicio = 0;
  function tomarBase() { const c = window.__camara; objetivo = window.__objetivo(); base = c.position.toArray(); }
  function paso(t) {
    if (!paseo) return; requestAnimationFrame(paso);
    const c = window.__camara, s = (t - inicio) / 1000, o = objetivo, dx = base[0] - o[0], dz = base[2] - o[2];
    const giro = 0.38 * Math.sin(s * 0.3), k = 1 + 0.12 * Math.sin(s * 0.7), cs = Math.cos(giro), sn = Math.sin(giro);
    c.position.set(o[0] + (dx * cs + dz * sn) * k, o[1] + (base[1] - o[1]) * k, o[2] + (-dx * sn + dz * cs) * k); c.lookAt(o[0], o[1], o[2]);
  }
  function parar() { if (!paseo) return; paseo = false; window.__vista(vista); }
  bCam.onclick = () => { if (window.__lista !== true) return; if (paseo) parar(); else { tomarBase(); paseo = true; inicio = performance.now(); requestAnimationFrame(paso); } reiniciar(); pintar(); };
  bVis.onclick = () => { if (window.__lista !== true) return; paseo = false; vista = VISTAS[(VISTAS.indexOf(vista) + 1) % VISTAS.length]; window.__vista(vista); reiniciar(); pintar(); };
  bCul.onclick = () => { const q = new URLSearchParams(location.search); q.set('cultura', CULTURAS[(CULTURAS.indexOf(cultura) + 1) % CULTURAS.length]); q.set('vista', vista); location.search = q.toString(); };
  pintar();
}
