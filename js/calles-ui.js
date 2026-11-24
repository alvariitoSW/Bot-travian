/* AQVILA — CD2a: la barra de «Calles» (solo pantalla). Tres estados: elegir, trazado y propuesta del arquitecto.
   No sabe de reglas: el modo que la usa le da los textos y recibe los toques. Estilos propios con clases cl-. */
const CSS = `.cl-barra{position:absolute;left:8px;right:8px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:30;padding:12px 10px 10px;color:#2b1c0a;font:15px/1.3 var(--libro,Georgia,'Noto Serif',serif);border:2px solid #8a5f1c;border-radius:10px;background:radial-gradient(ellipse at 50% 0%,#fdf1cf,#efd9a2 70%,#e0c386);box-shadow:inset 0 0 0 3px #f6e8c2,inset 0 0 0 4.5px #b8862b,0 5px 16px rgba(0,0,0,.55)}
.cl-barra::before{content:"VIAE · CALLES";display:block;margin:-2px 0 6px;padding:0 0 5px;text-align:center;font:700 12px/1 var(--serif,Cinzel,Georgia,serif);letter-spacing:.2em;color:#5a3a0e;background:repeating-linear-gradient(90deg,#b8862b 0 6px,transparent 6px 9px,#b8862b 9px 12px,transparent 12px 15px) left bottom/100% 3px no-repeat}
.cl-barra *{box-sizing:border-box}.cl-txt{margin:0 0 6px;font-size:14px;min-height:20px;text-align:center;color:#2b1c0a}.cl-mal{color:#8a1f10;font-weight:700}.cl-coste{color:#5a3a0e;font-weight:700}
.cl-fila{display:flex;gap:6px;margin-top:6px}.cl-fila>button{flex:1 1 0;min-width:0;min-height:44px;padding:6px 8px;border-radius:8px;border:1px solid rgba(60,35,10,.75);background:linear-gradient(#f5e6bd,#e3cc94);color:#2b1c0a;font:700 14px/1.15 var(--serif,Cinzel,Georgia,serif);letter-spacing:.02em;box-shadow:inset 0 0 0 2px #f6ead0,inset 0 0 0 3px rgba(139,98,30,.45);touch-action:manipulation}
.cl-fila>button.cl-on{background:linear-gradient(#f3e2b4,#d8bb80);border-color:#46661f;box-shadow:inset 0 0 0 2px #f6ead0,inset 0 0 0 4px #46661f}.cl-fila>button.cl-ok{background:linear-gradient(#6f8f3d,#46661f);border-color:#2f4713;color:#fbf3d8;box-shadow:inset 0 0 0 2px rgba(255,246,214,.35)}.cl-fila>button[disabled]{opacity:.5}.cl-fila>button.cl-sal{flex:0 0 30%}`;
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
