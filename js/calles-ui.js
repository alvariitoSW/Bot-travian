/* AQVILA — CD2a: la barra de «Calles» (solo pantalla). Tres estados: elegir, trazado y propuesta del arquitecto.
   No sabe de reglas: el modo que la usa le da los textos y recibe los toques. Estilos propios con clases cl-. */
const CSS = `.cl-barra{position:absolute;left:8px;right:8px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:30;background:rgba(32,24,16,.94);color:#f3e7c9;border:1px solid #8a6d3b;border-radius:10px;padding:8px;font:14px/1.3 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.5)}
.cl-barra *{box-sizing:border-box}.cl-txt{margin:0 0 6px;min-height:20px;text-align:center}.cl-mal{color:#ff9a8a}.cl-coste{color:#e9c46a}
.cl-fila{display:flex;gap:6px;margin-top:6px}.cl-fila>button{flex:1 1 0;min-width:0;min-height:44px;padding:6px 8px;border-radius:8px;border:1px solid #8a6d3b;background:#4a3a24;color:#f3e7c9;font:inherit;font-weight:600;touch-action:manipulation}
.cl-fila>button.cl-on{background:#e9c46a;color:#2b2118;border-color:#fff3c4}.cl-fila>button.cl-ok{background:#5d7a3a;border-color:#a8c97f}.cl-fila>button[disabled]{opacity:.45}.cl-fila>button.cl-sal{flex:0 0 30%}`;
export function crearBarra(host, cb) {
  if (!document.getElementById('cl-estilo')) { const s = document.createElement('style'); s.id = 'cl-estilo'; s.textContent = CSS; document.head.appendChild(s); }
  const el = document.createElement('div'); el.className = 'cl-barra'; el.setAttribute('role', 'toolbar'); el.setAttribute('aria-label', 'Calles'); host.appendChild(el);
  const boton = (t, f, c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; if (c) b.className = c; b.addEventListener('click', e => { e.stopPropagation(); f(); }); return b; };
  const fila = (...bs) => { const d = document.createElement('div'); d.className = 'cl-fila'; bs.forEach(b => d.appendChild(b)); return d; };
  const texto = (t, c) => { const p = document.createElement('p'); p.className = 'cl-txt' + (c ? ' ' + c : ''); p.textContent = t; return p; };
  const pon = (...hijos) => { el.replaceChildren(...hijos); };
  const r = { el, estado: 'elegir',
    elegir() { r.estado = 'elegir'; pon(texto('Arrastra el dedo para trazar una calle'), fila(boton('Que proponga el arquitecto', cb.proponer), boton('Salir', cb.salir, 'cl-sal'))); },
    /* v = { cual: 'tal' | 'recta' | 'cuadricula', ok, motivo, costeTxt, largo } */
    trazado(v) { r.estado = 'trazado'; const nombres = [['tal', 'Como la tracé'], ['recta', 'Recta'], ['cuadricula', 'Cuadrícula']];
      const info = v.ok ? texto('Calle de ' + v.largo + ' m · cuesta ' + v.costeTxt, 'cl-coste') : texto(v.motivo + '.', 'cl-mal');
      const hacer = boton('Hacer la calle', cb.hacer, 'cl-ok'); if (!v.ok) hacer.disabled = true;
      pon(fila(...nombres.map(([k, t]) => boton(t, () => cb.forma(k), v.cual === k ? 'cl-on' : ''))), info, fila(hacer, boton('Borrar', cb.borrar))); },
    propuesta(v) { r.estado = 'propuesta'; pon(texto(v.porque), texto('Cuesta ' + v.costeTxt, 'cl-coste'), fila(boton('Aceptar', cb.aceptar, 'cl-ok'), boton('Descartar', cb.descartar))); },
    aviso(t) { pon(texto(t), fila(boton('Seguir', cb.borrar))); },
    quitar() { el.remove(); } };
  r.elegir(); return r;
}
