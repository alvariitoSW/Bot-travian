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
   pisan(a, b, holgura) — true si dos rectángulos se solapan más de «holgura» px (lo usa también el juez de BT1). */
export const ZONAS = ['abajo', 'arriba', 'tira', 'datos', 'pausa-t', 'vista'];
export const FIJOS = ['grito', 'aviso-b', 'borde-a', 'borde-t', 'borde-i', 'borde-d'];

export const pisan = (a, b, h = 1) => a.left < b.right - h && a.right > b.left + h && a.top < b.bottom - h && a.bottom > b.top + h;
const el = x => (typeof x === 'string' ? document.getElementById(x) : x);
const visto = e => {
  if (!e || e.hidden || !e.isConnected) return false;
  const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
  const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0;
};
/* el rectángulo que se lee de un aviso: el de su texto (un <span> dentro) o el suyo */
const caja = e => { const s = e.querySelector && e.querySelector(':scope > span'); return (s && s.textContent ? s : e).getBoundingClientRect(); };

export function separaEstandartes(contenedor, { zonas = ZONAS, fijos = FIJOS } = {}) {
  const els = [];
  for (const e of contenedor.children) { e.style.visibility = ''; if (e.style.display !== 'none' && !e.hidden) { e.style.translate = ''; els.push(e); } }
  /* 1) los avisos fijos, por peso: el que pisa a otro de más peso se calla */
  const F = [];
  for (const f of fijos.map(el)) { if (!f) continue; f.style.visibility = ''; if (!visto(f)) continue; const r = caja(f); if (F.some(q => pisan(q, r, 2))) { f.style.visibility = 'hidden'; continue; } F.push(r); }
  const Z = zonas.map(el).filter(visto).map(z => z.getBoundingClientRect());
  if (!els.length) return;
  /* 2 y 3) de abajo arriba: cada estandarte sube lo justo para no pisar a los de debajo ni a un aviso fijo */
  const R = els.map(e => ({ e, r: e.getBoundingClientRect(), dy: 0 })).sort((a, b) => b.r.bottom - a.r.bottom);
  const mueve = (a, dy) => ({ left: a.r.left, right: a.r.right, top: a.r.top + dy, bottom: a.r.bottom + dy });
  for (let i = 0; i < R.length; i++) for (let vuelta = 0; vuelta < 4; vuelta++) {
    let movido = false; const yo = mueve(R[i], R[i].dy);
    for (let j = 0; j < i; j++) { const otro = mueve(R[j], R[j].dy); if (!R[j].oculto && pisan(yo, otro, 1)) { R[i].dy = otro.top - R[i].r.bottom - 2; movido = true; break; } }
    if (!movido) for (const f of F) if (pisan(yo, f, 1)) { R[i].dy = f.top - R[i].r.bottom - 2; movido = true; break; }
    if (!movido) break;
    if (vuelta === 3) R[i].oculto = true;
  }
  /* 4) lo que cae (o queda tras subir) encima de una zona de mando o de un aviso, oculto */
  for (const a of R) {
    const r = mueve(a, a.dy);
    if (a.oculto || r.top < 0 || Z.some(z => pisan(r, z, 0)) || F.some(f => pisan(r, f, 1))) { a.e.style.visibility = 'hidden'; a.dy = 0; }
    a.e.style.translate = a.dy ? '0 ' + a.dy.toFixed(1) + 'px' : '';
  }
}
