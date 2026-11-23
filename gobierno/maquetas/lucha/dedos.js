/* Lucha a pie: los dedos (pointer events) y el teclado se convierten en lo que pide el jugador.
   Pulgar izquierdo (40 % izquierdo de la pantalla): palanca que aparece donde cae; un golpe de palanca a un lado, adelante o atrás.
   Pulgar derecho (el resto): tocar = estocada · deslizar a un lado = tajo · deslizar arriba = empujón · mantener quieto = escudo.
   crearDedos(elemento, avisos) -> { toma() -> pide, gesto(nombre), escudo(v), inclina (x, y en -1..1) }.
   avisos.huella(lado, x, y, tipo) pinta la huella; avisos.palanca(x0, y0, x, y | null) la palanca. */
const TOQUE_MS = 180, TOQUE_PX = 12, DESLIZ_PX = 28, DESLIZ_MS = 250, PALANCA_PX = 34;

export function crearDedos(el, avisos = {}) {
  const cola = [], dedos = new Map(); let escudoDedo = null, escudoTecla = false;
  const D = { inclina: { x: 0, y: 0 } };
  const pon = g => cola.push(g);
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
    const izq = e.clientX < window.innerWidth * 0.4;
    const d = { izq, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), hecho: false, armada: true };
    dedos.set(e.pointerId, d);
    if (avisos.huella) avisos.huella(izq ? 'i' : 'd', e.clientX, e.clientY);
    if (izq && avisos.palanca) avisos.palanca(d.x0, d.y0, d.x, d.y);
    if (!izq) d.reloj = setTimeout(() => { if (dedos.get(e.pointerId) === d && !d.hecho && Math.hypot(d.x - d.x0, d.y - d.y0) < TOQUE_PX) { d.hecho = true; escudoDedo = e.pointerId; } }, TOQUE_MS);
  }, { passive: false });
  el.addEventListener('pointermove', e => {
    const d = dedos.get(e.pointerId); if (!d) return; d.x = e.clientX; d.y = e.clientY;
    const dx = d.x - d.x0, dy = d.y - d.y0;
    if (d.izq) {
      if (avisos.palanca) avisos.palanca(d.x0, d.y0, d.x, d.y);
      const r = Math.hypot(dx, dy); D.inclina.x = Math.max(-1, Math.min(1, dx / 60)); D.inclina.y = Math.max(-1, Math.min(1, dy / 60));
      /* un golpe de palanca: pasa del radio y vuelve hacia el centro para el siguiente */
      if (d.armada && r > PALANCA_PX) { d.armada = false; pon(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'izq' : 'der') : (dy < 0 ? 'adelante' : 'atras')); }
      else if (!d.armada && r < PALANCA_PX * 0.45) d.armada = true;
    } else if (!d.hecho && performance.now() - d.t0 < DESLIZ_MS && Math.hypot(dx, dy) > DESLIZ_PX) {
      d.hecho = true; clearTimeout(d.reloj);
      pon(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'tajo-izq' : 'tajo-der') : dy < 0 ? 'empujon' : 'estocada');
    }
  });
  const suelta = e => {
    const d = dedos.get(e.pointerId); if (!d) return; dedos.delete(e.pointerId); clearTimeout(d.reloj);
    if (escudoDedo === e.pointerId) escudoDedo = null;
    if (d.izq) { D.inclina.x = 0; D.inclina.y = 0; if (avisos.palanca) avisos.palanca(null); return; }
    if (!d.hecho && performance.now() - d.t0 < TOQUE_MS + 60 && Math.hypot(d.x - d.x0, d.y - d.y0) < TOQUE_PX * 2) pon('estocada');
  };
  el.addEventListener('pointerup', suelta); el.addEventListener('pointercancel', suelta);
  /* teclado para probar: flechas = palanca; espacio = estocada; A / D = tajo; W = empujón; S (mantener) = escudo */
  const TECLAS = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'adelante', ArrowDown: 'atras', ' ': 'estocada', a: 'tajo-izq', d: 'tajo-der', w: 'empujon' };
  addEventListener('keydown', e => { if (e.repeat) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k === 's') escudoTecla = true; else if (TECLAS[k]) { pon(TECLAS[k]); e.preventDefault(); } });
  addEventListener('keyup', e => { if (e.key.toLowerCase() === 's') escudoTecla = false; });
  D.gesto = g => { if (g === 'escudo') { escudoTecla = true; return; } if (g === 'bajar') { escudoTecla = false; return; } pon(g); };
  D.toma = () => ({ gestos: cola.splice(0), escudo: escudoDedo !== null || escudoTecla });
  return D;
}
