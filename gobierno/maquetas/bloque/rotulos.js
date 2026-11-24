/* LP4 · Estandartes que no se montan (decisión del usuario, 23/11: «Separarlos»).
   hud.js pone cada estandarte sobre su bloque; desde la vista del oficial varios caen en el mismo sitio del horizonte
   («Su jefe» encima de «Su centro»). Tras hud.tick, separa() mira los que se ven y, si dos se pisan, sube el de más arriba
   lo justo para que se lean los dos. Solo toca margin-top (hud.js maneja transform). No toca hud.js.
   Contrato: separaEstandartes(caja) — caja: el contenedor #ests */
export function separaEstandartes(caja) {
  const els = []; for (const e of caja.children) if (e.style.display !== 'none') { e.style.marginTop = '0px'; els.push(e); }
  if (els.length < 2) return;
  const R = els.map(e => ({ e, r: e.getBoundingClientRect(), dy: 0 })).sort((a, b) => b.r.bottom - a.r.bottom);
  const pisa = (a, b) => a.r.left < b.r.right - 4 && a.r.right > b.r.left + 4 && a.r.top + a.dy < b.r.bottom + b.dy && a.r.bottom + a.dy > b.r.top + b.dy;
  for (let i = 1; i < R.length; i++) for (let vuelta = 0; vuelta < 3; vuelta++) {
    let movido = false;
    for (let j = 0; j < i; j++) if (pisa(R[i], R[j])) { R[i].dy = R[j].r.top + R[j].dy - R[i].r.bottom - 2; movido = true; }
    if (!movido) break;
  }
  for (const a of R) if (a.dy) a.e.style.marginTop = a.dy.toFixed(1) + 'px';
}
