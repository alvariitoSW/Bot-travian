/* LP4 · Estandartes que no se montan (decisión del usuario, 23/11: «Separarlos»).
   hud.js pone cada estandarte sobre su bloque; desde la vista del oficial varios caen en el mismo sitio del horizonte
   («Su jefe» encima de «Su centro»). Tras hud.tick, separa() mira los que se ven y, si dos se pisan, sube el de más arriba
   lo justo para que se lean los dos. Solo toca la propiedad CSS translate y visibility (hud.js maneja transform; el margen es de cada etiqueta). No toca hud.js.
   BT1 («Lo común, una sola vez»): lo mismo para TODAS las etiquetas de la batalla, también las de la batalla grande (js/ui-mando.js):
     1) los avisos fijos (el grito, «¡Jabalinas!», los avisos del borde, el de los tiradores…) no se pisan entre sí: si dos se tocan,
        se calla el de menos peso (el primero de la lista manda);
     2) un estandarte que pisa un aviso fijo sube por encima; si aun así lo pisa, se oculta mientras dure el aviso;
     3) los estandartes no se pisan entre sí (lo de LP4);
     4) ninguna etiqueta asoma encima de las zonas de mando (barra de órdenes, raya del cansancio, cabecera del objetivo, tira de
        cuerpos, botones): la que caería encima se oculta (visibility) hasta que salga de ahí.
   Contrato: separaEstandartes(caja, { zonas, fijos }) — caja: el contenedor de los estandartes (#ests). zonas: elementos (o ids) donde
     no puede asomar ninguna etiqueta; fijos: los avisos, de más a menos peso (elemento o id; de un aviso con un <span> dentro cuenta el
     texto, no la franja). Sin opciones, las de la escena a pie (ZONAS, FIJOS).
   Opciones: pila (2 de serie: como mucho tantas etiquetas en torre; las demás se ocultan) y peso(e, rect) (batalla grande: las de más
     peso se ponen primero; las de menos, si no caben, se ocultan).
   pisan(a, b, holgura) — true si dos rectángulos se solapan más de «holgura» px (lo usa también el juez de BT1). */
export const ZONAS = ['abajo', 'arriba', 'tira', 'datos', 'pausa-t', 'vista'];
export const FIJOS = ['grito', 'aviso-b', 'borde-a', 'borde-t', 'borde-i', 'borde-d'];

/* b justo encima de a (a menos de TORRE px y solapados a lo ancho): una pila */
export const TORRE = 6;
export const sobre = (b, a) => b.bottom <= a.top + 1 && a.top - b.bottom <= TORRE && b.left < a.right - 1 && b.right > a.left + 1;
export const pisan = (a, b, h = 1) => a.left < b.right - h && a.right > b.left + h && a.top < b.bottom - h && a.bottom > b.top + h;
const el = x => (typeof x === 'string' ? document.getElementById(x) : x);
const visto = e => {
  if (!e || e.hidden || !e.isConnected) return false;
  const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
  const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0;
};
/* el rectángulo que se lee de un aviso: el de su texto (un <span> dentro) o el suyo */
const caja = e => { const s = e.querySelector && e.querySelector(':scope > span'); return (s && s.textContent ? s : e).getBoundingClientRect(); };

export function separaEstandartes(contenedor, { zonas = ZONAS, fijos = FIJOS, pila = 2, peso = null } = {}) {
  const els = [], W = innerWidth;
  for (const e of contenedor.children) { e.style.visibility = ''; if (e.style.display !== 'none' && !e.hidden) { e.style.translate = ''; els.push(e); } }
  /* 1) los avisos fijos, por peso: el que pisa a otro de más peso se calla */
  const F = [];
  for (const f of fijos.map(el)) { if (!f) continue; f.style.visibility = ''; if (!visto(f)) continue; const r = caja(f); if (F.some(q => pisan(q, r, 2))) { f.style.visibility = 'hidden'; continue; } F.push(r); }
  const Z = zonas.map(el).filter(visto).map(z => z.getBoundingClientRect());
  if (!els.length) return;
  /* 2 y 3) de abajo arriba (o de más a menos peso, si se da): cada estandarte entra de lado lo justo para no quedar cortado por el
     borde de la pantalla y sube lo justo para no pisar a los ya puestos ni a un aviso fijo. Una torre no pasa de «pila» etiquetas:
     la que haría la siguiente se oculta (con peso, las de menos interés, que se ponen las últimas) */
  const R = els.map(e => { const r = e.getBoundingClientRect(), dx = r.left < 2 ? 2 - r.left : r.right > W - 2 ? W - 2 - r.right : 0; return { e, r, dx, dy: 0, alto: 1, p: peso ? peso(e, r) : 0 }; })
    .sort((a, b) => (b.p - a.p) || (b.r.bottom - a.r.bottom));
  const mueve = (a, dy) => ({ left: a.r.left + a.dx, right: a.r.right + a.dx, top: a.r.top + dy, bottom: a.r.bottom + dy });
  for (let i = 0; i < R.length; i++) for (let vuelta = 0; vuelta < 4; vuelta++) {
    let movido = false; const yo = mueve(R[i], R[i].dy);
    for (let j = 0; j < i; j++) { if (R[j].oculto) continue; const otro = mueve(R[j], R[j].dy); if (pisan(yo, otro, 1)) { R[i].dy = Math.min(R[i].dy, otro.top - R[i].r.bottom - 2); R[i].alto = R[j].alto + 1; movido = true; break; } }
    if (!movido) for (const f of F) if (pisan(yo, f, 1)) { R[i].dy = Math.min(R[i].dy, f.top - R[i].r.bottom - 2); movido = true; break; }
    if (R[i].alto > pila) { R[i].oculto = true; break; }
    if (!movido) break;
    if (vuelta === 3) R[i].oculto = true;
  }
  /* 4) lo que cae (o queda tras subir) encima de una zona de mando o de un aviso, o fuera de la pantalla, oculto */
  for (const a of R) { const r = mueve(a, a.dy); if (a.oculto || r.top < 0 || Z.some(z => pisan(r, z, 0)) || F.some(f => pisan(r, f, 1))) a.oculto = true; }
  /* 5) torres: con lo que queda a la vista (estandartes y avisos), ninguna pila de más de «pila» etiquetas una encima de otra (a menos de
     TORRE px). Se mira de abajo arriba; si la sobra es un estandarte, se oculta; si es un aviso, se oculta el estandarte en que se apoya */
  for (let vuelta = 0; vuelta < 6 && pila < Infinity; vuelta++) {
    const V = R.filter(a => !a.oculto).map(a => ({ a, r: mueve(a, a.dy) })).concat(F.map(r => ({ a: null, r }))).sort((p, q) => q.r.bottom - p.r.bottom);
    let quita = null;
    for (const x of V) {
      x.h = 1; x.base = null;
      for (const y of V) { if (y === x || y.h === undefined || !sobre(x.r, y.r)) continue; if (y.h + 1 > x.h) { x.h = y.h + 1; x.base = y; } }
      if (x.h > pila) { quita = x.a || (x.base && x.base.a) || null; if (quita) break; }
    }
    V.forEach(x => { delete x.h; });
    if (!quita) break; quita.oculto = true;
  }
  for (const a of R) {
    if (a.oculto) { a.e.style.visibility = 'hidden'; a.dx = a.dy = 0; }
    a.e.style.translate = a.dx || a.dy ? a.dx.toFixed(1) + 'px ' + a.dy.toFixed(1) + 'px' : '';
  }
}
