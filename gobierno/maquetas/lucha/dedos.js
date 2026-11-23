/* Lucha a pie: los dedos (pointer events) y el teclado se convierten en lo que pide el jugador. Segunda versión: ningún dedo se pierde.
   Cualquier dedo, en cualquier sitio:
     toque    = soltar antes de 350 ms sin haberse alejado 18 px  -> estocada (aunque el escudo ya hubiera subido a los 250 ms)
     mantener = a los 250 ms sin alejarse 18 px                     -> escudo arriba hasta soltar
     deslizar = en cuanto se aleja 30 px del origen, a cualquier velocidad -> tajo a ese lado / empujón (arriba) / ceder un paso (abajo)
   Palanca (pulgar izquierdo): solo si el dedo cae en el 35 % izquierdo Y se arrastra más de 34 px; da un paso a un lado, adelante o atrás
     cada vez que pasa del radio. En esa zona, soltar sin arrastrar es un toque (estocada) y mantener, escudo.
   crearDedos(elemento, avisos, opciones) -> { toma() -> pide, gesto(nombre), escudo(v), inclina (x, y en -1..1) }.
   avisos.huella(lado, x, y, gesto) pinta la huella (gesto: lo que ha salido, para el eco al instante); avisos.palanca(x0, y0, x, y | null).
   opciones (para probar en Node): { ahora: () => ms, ancho: () => px, teclado: false }. */
export const TOQUE_MS = 350, QUIETO_PX = 18, MANTEN_MS = 250, DESLIZ_PX = 30, PALANCA_PX = 34, ZONA = 0.35;

export function crearDedos(el, avisos = {}, op = {}) {
  const ahora = op.ahora || (() => performance.now()), ancho = op.ancho || (() => window.innerWidth);
  const cola = [], dedos = new Map(); let escudoTecla = false;
  const D = { inclina: { x: 0, y: 0 } };
  const pon = (g, d) => { cola.push(g); if (d && avisos.huella) avisos.huella(d.izq ? 'i' : 'd', d.x, d.y, g); };
  const lejos = d => Math.hypot(d.x - d.x0, d.y - d.y0);
  el.addEventListener('pointerdown', e => {
    if (e.preventDefault) e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
    const izq = e.clientX < ancho() * ZONA;
    const d = { izq, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: ahora(), hecho: false, escudo: false, palanca: false, armada: true };
    dedos.set(e.pointerId, d);
    if (avisos.huella) avisos.huella(izq ? 'i' : 'd', e.clientX, e.clientY);
  }, { passive: false });
  el.addEventListener('pointermove', e => {
    const d = dedos.get(e.pointerId); if (!d) return; d.x = e.clientX; d.y = e.clientY;
    const dx = d.x - d.x0, dy = d.y - d.y0, r = Math.hypot(dx, dy);
    if (d.izq && !d.escudo && !d.hecho && r > PALANCA_PX) { d.palanca = true; d.hecho = true; }
    if (d.palanca) {
      if (avisos.palanca) avisos.palanca(d.x0, d.y0, d.x, d.y);
      D.inclina.x = Math.max(-1, Math.min(1, dx / 60)); D.inclina.y = Math.max(-1, Math.min(1, dy / 60));
      /* un golpe de palanca: pasa del radio y vuelve hacia el centro para el siguiente */
      if (d.armada && r > PALANCA_PX) { d.armada = false; pon(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'izq' : 'der') : (dy < 0 ? 'adelante' : 'atras'), d); }
      else if (!d.armada && r < PALANCA_PX * 0.45) d.armada = true;
      return;
    }
    if (!d.izq && !d.hecho && r > DESLIZ_PX) {                  /* deslizar: a cualquier velocidad; un gesto por dedo */
      d.hecho = true; d.escudo = false;
      pon(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'tajo-izq' : 'tajo-der') : dy < 0 ? 'empujon' : 'atras', d);
    }
  });
  const suelta = e => {
    const d = dedos.get(e.pointerId); if (!d) return; dedos.delete(e.pointerId);
    if (d.palanca) { D.inclina.x = 0; D.inclina.y = 0; if (avisos.palanca) avisos.palanca(null); return; }
    if (e.type === 'pointercancel') return;
    /* toque: corto y quieto (aunque el escudo ya hubiera subido) */
    if (!d.hecho && ahora() - d.t0 < TOQUE_MS && lejos(d) < QUIETO_PX) pon('estocada', d);
    /* en la zona izquierda, soltar sin arrastrar siempre es golpe, por largo que sea (si no fue escudo) */
    else if (!d.hecho && d.izq && !d.escudo) pon('estocada', d);
  };
  el.addEventListener('pointerup', suelta); el.addEventListener('pointercancel', suelta);
  /* teclado para probar: flechas = palanca; espacio = estocada; A / D = tajo; W = empujón; S (mantener) = escudo */
  if (op.teclado !== false && typeof addEventListener === 'function') {
    const TECLAS = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'adelante', ArrowDown: 'atras', ' ': 'estocada', a: 'tajo-izq', d: 'tajo-der', w: 'empujon' };
    addEventListener('keydown', e => { if (e.repeat) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k === 's') escudoTecla = true; else if (TECLAS[k]) { pon(TECLAS[k]); e.preventDefault(); } });
    addEventListener('keyup', e => { if (e.key.toLowerCase() === 's') escudoTecla = false; });
  }
  D.gesto = g => { if (g === 'escudo') { escudoTecla = true; return; } if (g === 'bajar') { escudoTecla = false; return; } pon(g); };
  /* cada fotograma: mira qué dedos llevan 250 ms quietos (escudo) y entrega lo pedido */
  D.toma = () => {
    const t = ahora(); let escudo = escudoTecla;
    for (const d of dedos.values()) {
      if (!d.hecho && !d.escudo && t - d.t0 >= MANTEN_MS && lejos(d) < QUIETO_PX) { d.escudo = true; if (avisos.huella) avisos.huella(d.izq ? 'i' : 'd', d.x, d.y, 'escudo'); }
      if (d.escudo && !d.hecho) escudo = true;
    }
    return { gestos: cola.splice(0), escudo };
  };
  return D;
}
