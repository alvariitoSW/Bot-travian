// AQVILA — CN18 «Hecho para el móvil»: lo que toca el navegador (descargas, portapapeles, archivos, postal, contemplar). La lógica va en game.js.
const sinFallo = f => { try { return f(); } catch (e) { return undefined; } };

/* baja un archivo con <a download>; vale texto o un Blob */
export function descargar(nombre, datos, mime) {
  const b = datos instanceof Blob ? datos : new Blob([datos], { type: mime || 'text/plain;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = nombre; a.style.display = 'none'; a.addEventListener('click', e => e.stopPropagation());   // si no, el manejador general de toques cerraría la hoja
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 4000); return true;
}
/* copia texto al portapapeles; si el navegador no deja, cae al método antiguo */
export async function copiar(txt) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(txt); return true; } } catch (e) { /* sigue */ }
  const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0'; document.body.appendChild(t); t.select();
  const ok = !!sinFallo(() => document.execCommand('copy')); t.remove(); return ok;
}
/* abre el selector de archivos y devuelve su texto (null si se cancela) */
export function elegirArchivo(accept) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept || ''; i.style.display = 'none'; i.addEventListener('click', e => e.stopPropagation()); document.body.appendChild(i);
    i.addEventListener('change', () => { const f = i.files && i.files[0]; i.remove(); if (!f) { res(null); return; } f.text().then(res, () => res(null)); });
    i.addEventListener('cancel', () => { i.remove(); res(null); }); i.click();
  });
}
/* postal: la imagen de la ciudad (canvas ya copiado del 3D) con marco dorado, nombre, fecha del juego y población. Devuelve el canvas final. */
export function componerPostal(foto, nombre, fecha, pob) {
  const W = foto.width, H = foto.height, m = Math.round(Math.min(W, H) * 0.035), base = Math.round(H * 0.1), c = document.createElement('canvas'); c.width = W + m * 2; c.height = H + m + base;
  const g = c.getContext('2d'), oro = '#d9b25a'; g.fillStyle = '#17110c'; g.fillRect(0, 0, c.width, c.height); g.drawImage(foto, m, m);
  g.strokeStyle = oro; g.lineWidth = Math.max(2, m * 0.18); g.strokeRect(m * 0.5, m * 0.5, c.width - m, c.height - m * 0.5 - m * 0.1); g.lineWidth = 1; g.strokeRect(m, m, W, H);
  const f1 = Math.round(base * 0.42), f2 = Math.round(base * 0.26); g.textAlign = 'center'; g.fillStyle = oro; g.font = '700 ' + f1 + 'px Cinzel, Georgia, serif'; g.fillText(String(nombre).toUpperCase(), c.width / 2, H + m + Math.round(base * 0.48));
  const pie = fecha + ' · ' + pob + ' habitantes · AQVILA'; let fs = f2; g.fillStyle = '#e8dcc0'; g.font = fs + 'px Georgia, serif'; while (fs > 8 && g.measureText(pie).width > c.width - m * 2) { fs--; g.font = fs + 'px Georgia, serif'; }
  g.fillText(pie, c.width / 2, H + m + Math.round(base * 0.82)); return c;
}
export function postalPng(foto, nombre, fecha, pob) { return new Promise(res => componerPostal(foto, nombre, fecha, pob).toBlob(b => res(b), 'image/png')); }

/* contemplar: oculta la interfaz y la cámara orbita sola (la hace CityView3D.contemplar). Un toque en cualquier sitio sale. El reloj sigue como estaba. */
let velo = null;
export function contemplando() { return !!velo; }
export function contemplar(vista, alSalir) {
  if (velo || !vista || !vista.contemplar) return false;
  velo = document.createElement('div'); velo.id = 'contempla'; velo.setAttribute('role', 'button'); velo.setAttribute('aria-label', 'Salir de contemplar'); velo.innerHTML = '<span>Toca para volver</span>';
  const salir = () => { if (!velo) return; velo.remove(); velo = null; document.body.classList.remove('contemplando'); vista.contemplar(false); if (alSalir) alSalir(); };
  velo.addEventListener('click', salir); document.body.appendChild(velo); document.body.classList.add('contemplando'); vista.contemplar(true);
  setTimeout(() => { if (velo) velo.classList.add('calla'); }, 3500); return true;
}

/* ---- acciones completas (las llama ui.js con el juego y los datos) ---- */
export async function hacerPostal(vista, G, D, cid) {
  const c = G.state.cities[cid], f = vista && vista.foto ? vista.foto() : null; if (!f || !c) return false;
  const png = await postalPng(f, D.CITIES[cid].n, G.dateStr(G.state.t), Math.round(c.pop || 0));
  if (!png) return false; descargar('aqvila-postal-' + cid + '-' + G.yearOf(G.state.t) + 'aC.png', png); return true;
}
export function guardarCopia(G) { const txt = G.exportar(); if (!txt) return false; const f = G.yearOf(G.state.t); return descargar('aqvila-partida-' + f + 'aC.json', txt, 'application/json'); }
export async function cargarCopia(G) { const txt = await elegirArchivo('.json,application/json'); if (txt === null) return { ok: false, motivo: '', nada: true }; return G.importar(txt); }
