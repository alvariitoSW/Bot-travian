/* AQVILA · AM2 — pantalla del mapa vivo de Grecia: monta el mapa en una caja con sus botones (Recursos, estilo, alturas),
   la regla de escala, la leyenda y la ficha de cada polis. Lleva su propia hoja de estilos: no necesita nada de css/.
   Uso desde el juego (pase a los comunes):  import('./js/gfx/mapa-grecia-pantalla.js').then(m => m.abrirMapaGrecia());
   Uso en una caja propia:                   const p = await montarMapaGrecia(caja, { estilo: 'a' });   p.mapa es el MapaGrecia. */
import { MapaGrecia } from './mapa-grecia.js';
import { POLIS, BASICOS, LUJOS, comarca } from './mapa-grecia-datos.js';
import { ICONOS } from './mapa-grecia-iconos.js';

const CSS = `
.mgp{position:absolute;inset:0;font-family:Georgia,'Times New Roman',serif;color:#2a2119;-webkit-tap-highlight-color:transparent}
.mgp *{box-sizing:border-box}
.mgp-mapa{position:absolute;inset:0}
.mgp button{font:bold 13px Georgia,serif;min-height:44px;min-width:44px;padding:0 10px;border-radius:6px;border:1px solid #6b5335;background:#f3e7c6f2;color:#2a2119;box-shadow:0 2px 4px #0007;cursor:pointer}
.mgp button[aria-pressed="true"]{background:#7a2b20;color:#fbeed0;border-color:#3d120c}
.mgp-arriba{position:absolute;left:8px;right:8px;top:calc(6px + env(safe-area-inset-top,0px));display:flex;gap:6px;align-items:flex-start;pointer-events:none}
.mgp-arriba>*{pointer-events:auto}
.mgp-titulo{flex:1;min-width:0;padding:5px 9px;border-radius:6px;background:#1c1610cc;color:#f1e3c0;font-size:12px;line-height:1.25;text-shadow:0 1px 2px #000;pointer-events:none}
.mgp-titulo b{display:block;font-size:14.5px;letter-spacing:.5px}
.mgp-abajo{position:absolute;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;align-items:flex-end;justify-content:space-between;pointer-events:none}
.mgp-abajo>*{pointer-events:auto}
.mgp-fila{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.mgp-regla{pointer-events:none;font-size:11.5px;padding:3px 6px 4px;border-radius:5px;background:#1c161099;color:#fff;text-shadow:0 1px 2px #000,0 0 3px #000;display:flex;flex-direction:column;align-items:flex-start;gap:1px;margin-bottom:2px}
.mgp-regla i{display:block;height:5px;border:1.5px solid #fff;border-top:0;box-shadow:0 1px 1px #0008}
.mgp-b .mgp-regla{color:#3a2416;background:#f4e8c8dd;text-shadow:none}.mgp-b .mgp-regla i{border-color:#3a2416;box-shadow:none}
.mgp-zoom{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px}
.mgp-zoom button{font-size:20px;padding:0}
.mgp-leyenda{position:absolute;left:8px;right:8px;top:calc(58px + env(safe-area-inset-top,0px));padding:5px 8px;border-radius:6px;background:#f3e7c6ee;border:1px solid #6b5335;font-size:11.5px;line-height:1.2;box-shadow:0 2px 4px #0007;pointer-events:none}
.mgp-leyenda[hidden],.mgp-ficha[hidden],.mgp-carga[hidden]{display:none}
.mgp-leyenda .f{display:flex;flex-wrap:wrap}
.mgp .rec{display:inline-flex;align-items:center;gap:3px;margin:1px 6px 1px 0;white-space:nowrap}
.mgp .rec i{width:17px;height:17px;border-radius:50%;padding:3px;background:var(--c);color:#fff;border:1px solid #0006;flex:none}
.mgp .rec.lujo i{box-shadow:0 0 0 1.5px #e3b341}
.mgp .rec svg{width:100%;height:100%;display:block;filter:drop-shadow(0 0 .6px #000) drop-shadow(0 0 .6px #000)}
.mgp-leyenda em{display:block;font-size:10.5px;opacity:.85;margin-top:2px}
.mgp-ficha{position:absolute;left:8px;right:8px;bottom:calc(62px + env(safe-area-inset-bottom,0px));padding:10px 12px 8px;border-radius:8px;background:#f6ecd0;border:1px solid #6b5335;box-shadow:0 4px 12px #000a;font-size:13px;z-index:3}
.mgp-ficha h2{margin:0 44px 4px 0;font-size:18px;display:flex;align-items:center;gap:7px}.mgp-ficha h2 b{width:13px;height:13px;border-radius:50%;border:1px solid #0008}
.mgp-ficha p{margin:4px 0}.mgp-ficha em{font-style:normal;font-weight:bold}.mgp-ficha small{display:block;font-size:11.5px;opacity:.85}
.mgp-ficha .falta{border-top:1px solid #6b533566;padding-top:5px}
.mgp-ficha .cerrar{position:absolute;right:2px;top:2px;border:0;background:none;box-shadow:none;font-size:24px}
.mgp-ficha .ir{margin-top:6px;width:100%}
.mgp-carga{position:absolute;inset:0;display:grid;place-items:center;background:#1c1610;color:#f1e3c0;font-size:15px;z-index:5}
@media (orientation:landscape){.mgp-ficha{left:auto;width:330px}.mgp-leyenda{right:auto;max-width:320px}.mgp-titulo b{display:inline;margin-right:8px}}
.mgp-pantalla{position:fixed;inset:0;z-index:9000;background:#1c1610}
.mgp-partida .mgp-titulo,.mgp-partida .mgp-zoom{display:none}
.mgp-partida .mgp-arriba{top:var(--mgp-arriba,56px);left:auto;justify-content:flex-end}
.mgp-partida .mgp-leyenda{top:calc(var(--mgp-arriba,56px) + 52px)}
.mgp-partida .mgp-abajo{bottom:var(--mgp-abajo,140px);left:var(--mgp-izq,8px)}
.mgp-partida .mgp-ficha{bottom:calc(var(--mgp-abajo,140px) + 54px);left:var(--mgp-izq,8px)}
.mgp-partida .mgp-leyenda{left:var(--mgp-izq,8px)}
@media (orientation:landscape){.mgp-partida .mgp-ficha{left:auto}}
`;
const NOMBRE = { a: 'Relieve natural', b: 'Carta antigua' };

export async function montarMapaGrecia(caja, opts) {
  opts = opts || {};
  if (!document.getElementById('mgp-css')) { const s = document.createElement('style'); s.id = 'mgp-css'; s.textContent = CSS; document.head.appendChild(s); }
  let estilo = opts.estilo; if (!estilo) { try { estilo = localStorage.getItem('aqvila-mapa-estilo'); } catch (e) {} } if (estilo !== 'b') estilo = 'a';
  const rec = (k, o, lujo) => '<span class="rec' + (lujo ? ' lujo' : '') + '"><i style="--c:' + o.color + '">' + ICONOS[k] + '</i>' + o.n + '</span>';
  const raiz = document.createElement('div'); raiz.className = 'mgp' + (opts.enPartida ? ' mgp-partida' : ''); caja.appendChild(raiz);   // AM4: dentro de la partida, sin título ni zoom propios (los pone el juego)
  raiz.innerHTML = '<div class="mgp-mapa"></div>' +
    '<div class="mgp-arriba">' + (opts.onVolver ? '<button data-a="volver">Volver</button>' : '') + '<div class="mgp-titulo"><b>Grecia</b><span data-r="lema"></span></div><button data-a="estilo" aria-label="Cambiar el estilo del mapa"></button></div>' +
    '<div class="mgp-leyenda" hidden><span class="f">' + Object.keys(BASICOS).map(k => rec(k, BASICOS[k])).join('') + '<span class="rec lujo"><i style="--c:#cfd6dd">' + ICONOS.plata + '</i>Lujo: solo en una polis</span></span></div>' +
    '<div class="mgp-zoom"><button data-a="mas" aria-label="Acercar">+</button><button data-a="menos" aria-label="Alejar">−</button></div>' +
    '<div class="mgp-ficha" hidden></div>' +
    '<div class="mgp-abajo"><div class="mgp-regla"><span></span><i></i></div><div class="mgp-fila"><button data-a="recursos" aria-pressed="false">Recursos</button><button data-v="entera">Grecia entera</button><button data-v="corazon">Las polis</button></div></div>' +
    '<div class="mgp-carga">Desplegando el mapa de Grecia…</div>';
  const $ = s => raiz.querySelector(s), hoja = $('.mgp-ficha'), regla = $('.mgp-regla'), bEst = $('[data-a="estilo"]'), lema = $('[data-r="lema"]');
  let kmPrev = 0, estVisto = '', huecos = null;
  /* sitio que ocupan los botones: los rótulos del mapa no se meten debajo */
  const mideHuecos = () => { const r0 = raiz.getBoundingClientRect(); huecos = [...raiz.querySelectorAll('.mgp-zoom, .mgp-arriba > *, .mgp-fila, .mgp-regla, .mgp-leyenda:not([hidden])')].map(e => { const r = e.getBoundingClientRect(); return [r.left - r0.left - 4, r.top - r0.top - 4, r.right - r0.left + 4, r.bottom - r0.top + 4]; }).filter(r => r[2] > r[0] + 8); if (opts.huecosExtra) huecos.push(...opts.huecosExtra(r0)); return huecos; };
  new ResizeObserver(() => { huecos = null; }).observe(raiz);
  let mapa; try { mapa = new MapaGrecia($('.mgp-mapa'), Object.assign({}, opts, { estilo, huecos: () => huecos || mideHuecos(), onPolis: p => { if (!(opts.alTocarPolis && opts.alTocarPolis(p))) ficha(p); }, onToque: () => { ficha(null); if (opts.alToque) opts.alToque(); }, onCambio: m => {
    if (opts.alCuadro) opts.alCuadro(m);   // AM4: la partida pinta encima sus marchas y su selección
    if (m.est !== estVisto) pintaEstilo(); const km100 = m.kmPor100px(); if (Math.abs(km100 - kmPrev) / km100 < 0.02) return; kmPrev = km100;
    const pasos = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]; let k = pasos[0]; for (const q of pasos) if (q <= km100 * 0.9) k = q;
    regla.firstChild.textContent = k < 1 ? (k * 1000) + ' m' : k + ' km'; regla.lastChild.style.width = Math.round(k / km100 * 100) + 'px';
    lema.textContent = m.ancho > 30 ? 'Las polis y sus mares' : m.ancho > 1.4 ? 'Comarcas, caminos y puertos' : 'La polis, de cerca'; } })); } catch (e) { raiz.remove(); throw e; }
  function pintaEstilo() { estVisto = mapa.est; bEst.textContent = opts.enPartida ? (mapa.est === 'a' ? 'Ver carta antigua' : 'Ver relieve') : 'Estilo: ' + NOMBRE[mapa.est]; raiz.classList.toggle('mgp-b', mapa.est === 'b'); }
  function ficha(p) {
    if (!p) { hoja.hidden = true; return; }
    const c = comarca(p), ic = k => rec(k, BASICOS[k] || LUJOS[k], !!LUJOS[k]);
    const quien = k => { const o = POLIS.filter(q => q !== p && comarca(q).tiene[k]).map(q => q.n); return o.length ? o.slice(0, 2).join(' o ') : 'las comarcas libres'; };
    hoja.innerHTML = '<button class="cerrar" aria-label="Cerrar">×</button><h2><b style="background:' + p.color + '"></b>' + p.n + '</h2>' +
      '<p><em>En su comarca:</em> ' + (Object.keys(c.tiene).map(ic).join(' ') || 'poca cosa') + '</p>' +
      '<p><em>De lujo, solo aquí:</em> ' + ic(p.lujo) + '<small> (' + p.lujoDe + ')</small></p>' +
      (c.faltan.length ? '<p class="falta"><em>Le falta:</em> ' + c.faltan.map(ic).join(' ') + '<small> Por comercio o conquista: ' + quien(c.faltan[0]) + '.</small></p>' : '') +
      '<button class="ir" data-ir="' + p.id + '">Ver ' + p.n + ' de cerca</button>';
    hoja.hidden = false;
  }
  raiz.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
    if (b.dataset.v) { ficha(null); mapa.vista(b.dataset.v, 900); }
    else if (b.dataset.ir) { const p = POLIS.find(q => q.id === b.dataset.ir); ficha(null); mapa.vista({ lon: p.lon, lat: p.lat, a: 0.42 }, 1600); }
    else if (b.classList.contains('cerrar')) ficha(null);
    else if (a === 'recursos') { const on = mapa.recursos(); b.setAttribute('aria-pressed', on); $('.mgp-leyenda').hidden = !on; huecos = null; }
    else if (a === 'estilo') { b.disabled = true; mapa.estilo().then(k => { try { localStorage.setItem('aqvila-mapa-estilo', k); } catch (x) {} pintaEstilo(); }).catch(err => console.warn('No se pudo cambiar el estilo del mapa', err)).then(() => { b.disabled = false; }); }
    else if (a === 'mas') mapa.irA(mapa.V.x, mapa.V.z, mapa.V.upx / 2, 350); else if (a === 'menos') mapa.irA(mapa.V.x, mapa.V.z, mapa.V.upx * 2, 350);
    else if (a === 'volver' && opts.onVolver) opts.onVolver(); });
  try { await mapa.iniciar(); } catch (e) { try { mapa.destruir(); } catch (x) {} raiz.remove(); throw e; }
  pintaEstilo(); $('.mgp-carga').hidden = true;
  return { mapa, raiz, ficha, rehacerHuecos() { huecos = null; }, cerrar() { mapa.destruir(); raiz.remove(); } };
}

/* a pantalla completa, por encima del juego, con «Volver» */
export async function abrirMapaGrecia(opts) {
  const caja = document.createElement('div'); caja.className = 'mgp-pantalla'; document.body.appendChild(caja); let p;
  let cerrado = false; const cerrar = () => { if (cerrado) return; cerrado = true; if (p) p.cerrar(); caja.remove(); if (opts && opts.alCerrar) opts.alCerrar(); };
  try { p = await montarMapaGrecia(caja, Object.assign({ onVolver: cerrar }, opts)); } catch (e) { caja.remove(); throw e; }   // si no carga (sin WebGL, sin red), no se deja el menú tapado
  return p;
}
