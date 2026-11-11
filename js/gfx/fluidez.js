/* Contador de fluidez (img/s). Autónomo: su propio requestAnimationFrame mientras está encendido.
   La elección se guarda aparte del guardado de la partida. */
const CLAVE = 'aqvila-fluidez';
let el = null, raf = 0, encendido = false, muestras = [], t0 = 0, n0 = 0;
const estado = (window.AQ_FLUIDEZ = { media: 0, peor: 0, encendido: false });

function guardar(v) { try { localStorage.setItem(CLAVE, v ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } }
function recordada() { try { return localStorage.getItem(CLAVE) === '1'; } catch (e) { return false; } }

function tick(t) {
  if (!encendido) return;
  raf = requestAnimationFrame(tick);
  if (!t0) { t0 = t; n0 = 0; }
  n0++;
  if (t - t0 >= 500) {
    muestras.push({ t, f: n0 * 1000 / (t - t0) });
    t0 = t; n0 = 0;
    while (muestras.length && t - muestras[0].t > 10000) muestras.shift();
    const f = muestras.map(m => m.f);
    estado.media = f.reduce((a, b) => a + b, 0) / f.length;
    estado.peor = Math.min.apply(null, f);
    if (el) el.textContent = Math.round(estado.media) + ' img/s · peor ' + Math.round(estado.peor);
  }
}

export function estaEncendido() { return encendido; }
export function leer() { return { media: estado.media, peor: estado.peor, encendido }; }

export function fijar(v, recordar) {
  if (v === encendido) return;
  encendido = !!v; estado.encendido = encendido;
  if (recordar !== false) guardar(encendido);
  if (encendido) {
    el = document.createElement('div');
    el.id = 'fluidez';
    el.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:60;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,.6);color:#9f9;font:11px/1.2 monospace;pointer-events:none;white-space:nowrap';
    el.textContent = 'midiendo…';
    document.body.appendChild(el);
    muestras = []; t0 = 0; estado.media = 0; estado.peor = 0;
    raf = requestAnimationFrame(tick);
  } else {
    cancelAnimationFrame(raf);
    if (el) el.remove();
    el = null; estado.media = 0; estado.peor = 0;
  }
}

if (recordada()) fijar(true, false);
