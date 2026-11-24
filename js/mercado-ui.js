/* AQVILA — CDe3 fase 2b: pantalla del mercado (productos, rutas y viajes, Senado y aduanas).
   Solo pantalla: las reglas están en mercado.js (window.MERCADO) y game.js (window.Game). Estilos propios con prefijo mu-.
   Uso: abrirMercado(ciudad?, pestaña?) y cerrarMercado(). Las miniaturas son dibujos SVG propios, hechos aquí. */
const CSS = '' +
  '#mu{position:fixed;inset:0;z-index:80;display:flex;justify-content:center;background:rgba(5,8,12,.72)}#mu[hidden]{display:none}' +
  '.mu-hoja{position:relative;box-sizing:border-box;width:100%;max-width:560px;height:100%;display:flex;flex-direction:column;overflow:clip;background:#0e141d;color:#f1ead9;font:15px/1.3 var(--sans,system-ui,sans-serif)}' +
  '.mu-cab{flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px 6px;border-bottom:1px solid rgba(233,192,99,.4)}' +
  '.mu-cab h2{flex:1;min-width:0;margin:0;font:700 19px var(--serif,serif);letter-spacing:.06em;color:#e9c063}' +
  '.mu-x{flex:none;width:44px;height:44px;border-radius:10px;border:1px solid rgba(241,234,217,.3);background:rgba(241,234,217,.08);color:#f1ead9;font-size:22px;line-height:1}' +
  '.mu-ciud{flex:none;display:flex;gap:6px;padding:6px 12px 0;overflow-x:auto;scrollbar-width:none}.mu-ciud::-webkit-scrollbar{display:none}' +
  '.mu-chip{flex:none;min-height:44px;padding:0 14px;border-radius:99px;border:1px solid rgba(241,234,217,.25);background:rgba(241,234,217,.06);color:#f1ead9;font:inherit}' +
  '.mu-chip.on{background:#e9c063;color:#241a08;border-color:#e9c063;font-weight:700}' +
  '.mu-tabs{flex:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px 12px}' +
  '.mu-tab{min-height:44px;padding:0 4px;border-radius:10px;border:1px solid rgba(241,234,217,.25);background:rgba(241,234,217,.06);color:#f1ead9;font:600 13px var(--sans,system-ui,sans-serif)}' +
  '.mu-tab.on{background:#7c2418;border-color:#d9a21b;color:#fff}' +
  '.mu-cuerpo{flex:1;min-height:0;overflow-y:auto;overflow-x:clip;overscroll-behavior:contain;padding:4px 12px 90px}' +
  '.mu-aviso{margin:4px 0 10px;padding:10px 12px;border-radius:10px;background:rgba(214,86,60,.16);border:1px solid #d6563c;color:#ffb4a2;font-size:14px}' +
  '.mu-consejo{display:flex;gap:10px;align-items:center;margin:2px 0 10px;padding:10px 12px;border-radius:10px;background:rgba(233,192,99,.12);border:1px solid rgba(233,192,99,.5);font-size:14px}' +
  '.mu-consejo svg{flex:none;width:30px;height:30px}' +
  '.mu-rej{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}' +
  '.mu-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:112px;padding:8px 4px 6px;border-radius:12px;border:1px solid rgba(241,234,217,.2);background:rgba(241,234,217,.06);color:#f1ead9;font:inherit;text-align:center;overflow:clip}' +
  '.mu-card.on{border-color:#e9c063;background:rgba(233,192,99,.14)}' +
  '.mu-card svg.mu-mini{width:46px;height:46px}' +
  '.mu-card .mu-n{font-size:13px;font-weight:600;max-width:100%;white-space:nowrap;overflow:clip;text-overflow:ellipsis}' +
  '.mu-card .mu-p{display:flex;align-items:center;gap:3px;font:700 15px var(--sans,system-ui,sans-serif);font-variant-numeric:tabular-nums}' +
  '.mu-card .mu-t{font-size:12px;color:#b9b19c}' +
  '.mu-up{color:#58d36b}.mu-dn{color:#ff7060}.mu-ig{color:#b9b19c}' +
  '.mu-ficha{position:absolute;left:0;right:0;bottom:0;max-height:78%;display:flex;flex-direction:column;overflow:clip;border-radius:16px 16px 0 0;background:#161f2c;border-top:2px solid #e9c063;box-shadow:0 -10px 30px #000c;animation:mu-sube .18s ease-out}' +
  '@keyframes mu-sube{from{transform:translateY(30px);opacity:.3}to{transform:none;opacity:1}}' +
  '.mu-fin{flex:1;min-height:0;overflow-y:auto;padding:10px 12px 14px}' +
  '.mu-fcab{display:flex;align-items:center;gap:10px}.mu-fcab svg.mu-mini{width:54px;height:54px;flex:none}' +
  '.mu-fcab>div{flex:1;min-width:0}.mu-fcab b{display:block;font:700 18px var(--serif,serif)}.mu-fcab span{font-size:13px;color:#b9b19c}' +
  '.mu-lotes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 10px}' +
  '.mu-lote{min-height:56px;padding:4px;border-radius:10px;border:1px solid rgba(241,234,217,.25);background:rgba(241,234,217,.08);color:#f1ead9;font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}' +
  '.mu-lote b{font-size:16px}.mu-lote small{font-size:12px;color:#d8cfb6}' +
  '.mu-comp .mu-lote{border-color:#58a566}.mu-vend .mu-lote{border-color:#d9a21b}' +
  '.mu-lote[disabled]{opacity:.38}' +
  '.mu-sub{margin:8px 0 4px;font:700 12px var(--serif,serif);letter-spacing:.1em;color:#e9c063}' +
  '.mu-fila{display:flex;align-items:center;gap:8px;min-height:36px;padding:3px 0;border-bottom:1px solid rgba(241,234,217,.1);font-size:14px}' +
  '.mu-fila>span{flex:1;min-width:0}.mu-fila b{font-variant-numeric:tabular-nums}' +
  '.mu-caja{margin:0 0 10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(241,234,217,.2);background:rgba(241,234,217,.05);overflow:clip}' +
  '.mu-caja h3{margin:0 0 4px;font:700 15px var(--serif,serif);color:#f1ead9}' +
  '.mu-caja p{margin:2px 0 6px;font-size:13px;color:#cfc7b0}' +
  '.mu-btn{min-height:46px;padding:0 14px;border-radius:10px;border:1px solid #d9a21b;background:#7c2418;color:#fff;font:700 14px var(--sans,system-ui,sans-serif)}' +
  '.mu-btn.sec{background:rgba(241,234,217,.08);border-color:rgba(241,234,217,.3);color:#f1ead9}' +
  '.mu-btn.peli{background:rgba(214,86,60,.2);border-color:#d6563c}' +
  '.mu-btn[disabled]{opacity:.4}' +
  '.mu-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.mu-btns .mu-btn{flex:1 1 130px}' +
  '.mu-sel{width:100%;box-sizing:border-box;min-height:46px;margin:2px 0 8px;padding:0 10px;border-radius:10px;border:1px solid rgba(241,234,217,.3);background:#0e141d;color:#f1ead9;font:inherit}' +
  '.mu-lab{display:block;font-size:12px;color:#b9b19c;margin-top:2px}' +
  '.mu-paso{display:flex;align-items:center;gap:10px;margin:2px 0 8px}.mu-paso b{flex:1;text-align:center;font-size:18px}' +
  '.mu-paso button{width:56px;min-height:46px;border-radius:10px;border:1px solid rgba(241,234,217,.3);background:rgba(241,234,217,.08);color:#f1ead9;font-size:22px}' +
  '.mu-cu{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:14px;margin:4px 0}.mu-cu b{text-align:right;font-variant-numeric:tabular-nums}' +
  '.mu-vacio{padding:14px 4px;text-align:center;color:#b9b19c;font-size:14px}' +
  '.mu-tag{display:inline-block;padding:1px 8px;border-radius:99px;font-size:12px;background:rgba(88,211,107,.16);border:1px solid #58a566;color:#9fe0aa}';

const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const d1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
const d2 = x => (Math.round(x * 100) / 100).toString().replace('.', ',');
const ent = x => Math.round(x).toLocaleString('es-ES');

/* ---------- miniaturas SVG propias (64×64), una por producto ---------- */
const fig = c => '<svg class="mu-mini" viewBox="0 0 64 64" aria-hidden="true">' + c + '</svg>';
const MINI = {
  grano: fig('<path d="M32 58V20" stroke="#8a6a1c" stroke-width="3" fill="none"/><g fill="#e3b83a" stroke="#8a6a1c" stroke-width="1.2"><ellipse cx="32" cy="10" rx="4" ry="7"/><ellipse cx="25" cy="18" rx="4" ry="7" transform="rotate(-28 25 18)"/><ellipse cx="39" cy="18" rx="4" ry="7" transform="rotate(28 39 18)"/><ellipse cx="24" cy="30" rx="4" ry="7" transform="rotate(-28 24 30)"/><ellipse cx="40" cy="30" rx="4" ry="7" transform="rotate(28 40 30)"/></g>'),
  aceite: fig('<path d="M25 10h14v6c9 4 12 12 12 21 0 11-7 19-19 19S13 48 13 37c0-9 3-17 12-21z" fill="#8c6a3a" stroke="#4d3517" stroke-width="2"/><path d="M13 30h38" stroke="#4d3517" stroke-width="2"/><ellipse cx="32" cy="10" rx="8" ry="3" fill="#a98450" stroke="#4d3517" stroke-width="2"/><path d="M12 24c-6 0-6 14 0 14M52 24c6 0 6 14 0 14" fill="none" stroke="#4d3517" stroke-width="2.4"/><ellipse cx="32" cy="43" rx="6" ry="8" fill="#7d9a2a" stroke="#3f5214" stroke-width="1.5"/>'),
  vino: fig('<path d="M26 6h12v8c7 4 11 10 11 20 0 13-7 22-17 22S15 47 15 34c0-10 4-16 11-20z" fill="#7b2a3a" stroke="#3d1119" stroke-width="2"/><path d="M26 14h12" stroke="#3d1119" stroke-width="2"/><path d="M20 34h24" stroke="#d8b25a" stroke-width="3"/><circle cx="26" cy="46" r="3.2" fill="#a04a5e"/><circle cx="33" cy="48" r="3.2" fill="#a04a5e"/><circle cx="39" cy="45" r="3.2" fill="#a04a5e"/>'),
  verdura: fig('<path d="M32 58c-18 0-24-12-22-24 2-12 12-20 22-20s20 8 22 20c2 12-4 24-22 24z" fill="#6fae3c" stroke="#2f5a14" stroke-width="2"/><path d="M32 56V22M32 40c-8-2-13-8-14-14M32 40c8-2 13-8 14-14M32 30c-4-2-6-5-6-9M32 30c4-2 6-5 6-9" fill="none" stroke="#c6e59a" stroke-width="2.2"/>'),
  lana: fig('<g fill="#f2ecde" stroke="#8d8570" stroke-width="2"><circle cx="20" cy="30" r="11"/><circle cx="34" cy="22" r="12"/><circle cx="46" cy="32" r="11"/><circle cx="32" cy="38" r="12"/><circle cx="22" cy="42" r="9"/></g><path d="M26 52c4 3 12 3 16 0" fill="none" stroke="#8d8570" stroke-width="2"/><rect x="26" y="50" width="12" height="8" rx="3" fill="#5a4a38"/>'),
  materiales: fig('<g stroke="#5a2a18" stroke-width="2"><rect x="6" y="38" width="24" height="14" fill="#b4573a"/><rect x="34" y="38" width="24" height="14" fill="#c4643f"/><rect x="20" y="22" width="24" height="14" fill="#a24c32"/><rect x="2" y="22" width="14" height="14" fill="#c4643f"/><rect x="48" y="22" width="14" height="14" fill="#b4573a"/></g>'),
  hierro: fig('<path d="M10 44l8-14h28l8 14z" fill="#8a929c" stroke="#2f343a" stroke-width="2"/><path d="M18 30l-4-8h26l4 8" fill="#aab2bb" stroke="#2f343a" stroke-width="2"/><path d="M6 56l6-12h40l6 12z" fill="#6f7780" stroke="#2f343a" stroke-width="2"/><path d="M22 34h16" stroke="#dfe4ea" stroke-width="2"/>'),
  sal: fig('<path d="M6 54L26 14h12l20 40z" fill="#f4f1ea" stroke="#8d8a80" stroke-width="2"/><path d="M20 54l12-26 12 26" fill="#e1ded4" stroke="#8d8a80" stroke-width="1.5"/><g fill="#fff"><circle cx="30" cy="22" r="2"/><circle cx="38" cy="34" r="2"/><circle cx="24" cy="44" r="2"/></g>'),
  caballos: fig('<path d="M20 58V40c0-10 4-18 10-24l4-8 6 6-2 4c8 2 14 8 14 18v22z" fill="#8a5a30" stroke="#3e2610" stroke-width="2"/><path d="M34 12c-6 2-10 8-10 18" fill="none" stroke="#3e2610" stroke-width="5"/><circle cx="42" cy="22" r="2.2" fill="#fff"/><path d="M48 28l6 2-6 4z" fill="#6b4524" stroke="#3e2610" stroke-width="1.5"/>'),
  pieles: fig('<path d="M14 12l10 5 8-6 8 6 10-5 4 14-6 6 4 14-10 8H20L10 46l4-14-6-6z" fill="#b98a52" stroke="#5a3d1c" stroke-width="2"/><g fill="#6e4a22"><circle cx="26" cy="28" r="3"/><circle cx="38" cy="36" r="3.5"/><circle cx="28" cy="46" r="2.6"/></g>'),
  plata: fig('<path d="M10 42l8-14h30l8 14z" fill="#d9dde3" stroke="#6a717b" stroke-width="2"/><rect x="10" y="42" width="46" height="10" fill="#b9bec6" stroke="#6a717b" stroke-width="2"/><circle cx="32" cy="16" r="9" fill="#e9ecf0" stroke="#6a717b" stroke-width="2"/><path d="M28 12l8 8M36 12l-8 8" stroke="#6a717b" stroke-width="2"/>'),
  marmol: fig('<path d="M10 24l10-12h34v26L44 52H10z" fill="#ece8df" stroke="#8c8678" stroke-width="2"/><path d="M10 24h34v28M44 24l10-12" fill="none" stroke="#8c8678" stroke-width="2"/><path d="M16 34c8-2 10 6 18 2M20 46c6-3 10 0 16-2" fill="none" stroke="#b5ada0" stroke-width="2"/>'),
  purpura: fig('<path d="M32 8c-12 0-20 10-20 22 0 12 8 18 14 18l2 10 4-8 4 8 2-10c6 0 14-6 14-18C52 18 44 8 32 8z" fill="#7a2a8a" stroke="#3b1244" stroke-width="2"/><path d="M32 8c-4 10-4 22 0 34M22 12c-4 10-2 22 4 30M42 12c4 10 2 22-4 30" fill="none" stroke="#c78bd6" stroke-width="2"/>'),
  maderanaval: fig('<path d="M6 40h52l-8 14H14z" fill="#8a5a30" stroke="#3e2610" stroke-width="2"/><path d="M32 40V8M32 10l18 20H32z" fill="#efe6cc" stroke="#6b5a36" stroke-width="2"/><path d="M14 54h36M16 46h32" stroke="#3e2610" stroke-width="1.6"/>')
};
const MINI_GEN = fig('<path d="M8 22l24-12 24 12v26L32 58 8 48z" fill="#b4895a" stroke="#4d3517" stroke-width="2"/><path d="M8 22l24 12 24-12M32 34v24" fill="none" stroke="#4d3517" stroke-width="2"/>');
const mini = p => MINI[p] || MINI_GEN;
const FLECHA = f => f > 0 ? '<span class="mu-up" aria-label="sube">↑</span>' : f < 0 ? '<span class="mu-dn" aria-label="baja">↓</span>' : '<span class="mu-ig" aria-label="igual">=</span>';
const DEN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="#e9c063" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 9.2l4 5.6M14 9.2l-4 5.6"/></svg>';
const ICO_CONSEJO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#e9c063" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';

/* ---------- estado ---------- */
const E = { abierto: false, cid: null, tab: 'prod', prod: null, destino: '', rprod: 'grano', cargas: 5, ctrOp: {}, msg: '' };
let host = null;
const G = () => window.Game, M = () => window.MERCADO, D = () => window.DATA, S = () => window.Game && window.Game.state;
const nomC = id => (D().CITIES[id] && D().CITIES[id].n) || id;
const nomP = p => (M().PRODUCTOS[p] && M().PRODUCTOS[p].n) || p;
const nomF = f => (D().FACTIONS[f] && D().FACTIONS[f].n) || f;
const mias = () => G().myCities();

function simula(cid, prod, n, vende) {   // precio medio sin tocar la partida: trabaja sobre una copia del mercado
  try {
    const s = S(), copia = Object.assign({}, s, { mercado: JSON.parse(JSON.stringify(s.mercado)) }), ay = Object.assign({}, G().mercadoAyuda(), { tiene: () => 1e9, cabe: () => 1e9 });
    const r = vende ? M().vender(copia, cid, prod, n, ay) : M().comprar(copia, cid, prod, n, ay);
    return r.ok ? { medio: r.precioMedio, total: Math.abs(r.delta.denarios || 0) } : null;
  } catch (e) { return null; }
}

/* ---------- pestaña Productos ---------- */
function vistaProductos(mal) {
  const tabla = G().mercadoTabla(E.cid);
  let h = mal ? '<div class="mu-aviso">' + esc(mal) + '. Puedes mirar los precios, pero no comprar ni vender aquí.</div>' : '';
  h += '<div class="mu-rej">' + tabla.map(r => '<button type="button" class="mu-card' + (E.prod === r.prod ? ' on' : '') + '" data-m="prod" data-v="' + r.prod + '" aria-label="' + esc(r.n) + ', precio ' + d1(r.precio) + '">' + mini(r.prod) +
    '<span class="mu-n">' + esc(r.n) + '</span><span class="mu-p">' + FLECHA(r.flecha) + d1(r.precio) + '</span><span class="mu-t">tienes ' + ent(r.existencias || 0) + '</span></button>').join('') + '</div>';
  return h + (E.prod ? ficha(tabla.find(r => r.prod === E.prod), mal) : '');
}
function ficha(r, mal) {
  if (!r) return '';
  const s = S(), p = r.prod, mej = M().mejores(s, p, 3, G().mercadoAyuda()), tengo = Math.floor(r.existencias || 0), lotes = [10, 50, 100];
  const btns = vende => '<div class="mu-lotes ' + (vende ? 'mu-vend' : 'mu-comp') + '">' + lotes.map(n => {
    const sim = simula(E.cid, p, n, vende), off = !!mal || !sim || (vende && tengo < n);
    return '<button type="button" class="mu-lote" data-m="' + (vende ? 'vender' : 'comprar') + '" data-v="' + p + '" data-n="' + n + '"' + (off ? ' disabled' : '') + '><b>' + n + '</b><small>' + (sim ? d1(sim.medio) + ' c/u' : '—') + '</small></button>';
  }).join('') + '</div>';
  const vend = mej.caro.map(x => '<div class="mu-fila"><span>' + esc(nomC(x.ciudad)) + '</span><b>' + d1(x.precio) + '</b>' + DEN + '</div>').join('');
  return '<div class="mu-ficha" role="dialog" aria-label="' + esc(r.n) + '"><div class="mu-fin"><div class="mu-fcab">' + mini(p) + '<div><b>' + esc(r.n) + '</b><span>' + FLECHA(r.flecha) + ' ' + d1(r.precio) + ' ' + DEN + ' · tienes ' + ent(tengo) + (r.motivo ? ' · ' + esc(r.motivo) : '') + '</span></div><button type="button" class="mu-x" data-m="fichax" aria-label="Cerrar la ficha">×</button></div>' +
    '<div class="mu-sub">COMPRAR (precio medio)</div>' + btns(false) + '<div class="mu-sub">VENDER (precio medio)</div>' + btns(true) +
    '<div class="mu-sub">MEJORES CIUDADES PARA VENDER</div>' + vend + '</div></div>';
}

/* ---------- pestaña Rutas y viajes ---------- */
function opcionesDestino() { return Object.keys(D().CITIES).filter(c => c !== E.cid).sort((a, b) => nomC(a) < nomC(b) ? -1 : 1); }
function vistaRutas(mal) {
  const s = S(), ay = G().mercadoAyuda(), cs = G().mercadoConsejo(), rutas = G().rutasMercado(), viajes = (s.mercado && s.mercado.viajes) || [];
  let h = cs ? '<div class="mu-consejo">' + ICO_CONSEJO + '<span>' + esc(cs.texto) + '</span></div>' : '';
  if (mal) h += '<div class="mu-aviso">' + esc(mal) + '.</div>';
  h += '<div class="mu-sub">RUTAS ACTIVAS</div>';
  if (!rutas.length) h += '<div class="mu-vacio">Aún no tienes rutas. Crea una abajo y irá sola cada mes.</div>';
  for (const r of rutas) {
    let c = null; try { c = M().rutaCuenta(s, r, ay); } catch (e) { c = null; }
    h += '<div class="mu-caja"><h3>' + mini(r.prod).replace('class="mu-mini"', 'class="mu-mini" style="width:26px;height:26px;vertical-align:middle"') + ' ' + esc(nomP(r.prod)) + ' · ' + esc(nomC(r.a)) + ' → ' + esc(nomC(r.b)) + '</h3><p>' + r.cargas + ' cargas al mes</p>' +
      (c ? '<div class="mu-cu"><span>Compra</span><b>' + d1(c.compra) + '</b><span>Venta</span><b>' + d1(c.venta) + '</b><span>Flete</span><b>' + d1(c.flete) + '</b><span>Aduana</span><b>' + d1(c.portoria) + '</b><span>Ganas</span><b class="' + (c.neto >= 0 ? 'mu-up' : 'mu-dn') + '">' + (c.neto >= 0 ? '+' : '') + d1(c.neto) + '</b></div>' : '') +
      '<div class="mu-btns"><button type="button" class="mu-btn peli" data-m="quitar" data-v="' + r.id + '">Quitar esta ruta</button></div></div>';
  }
  if (viajes.length) h += '<div class="mu-sub">VIAJES EN CAMINO</div>' + viajes.map(v => '<div class="mu-fila"><span>' + esc(nomP(v.prod)) + ' ×' + v.cargas + ' · ' + esc(nomC(v.a)) + ' → ' + esc(nomC(v.b)) + '</span><b>' + v.resta + (v.resta === 1 ? ' mes' : ' meses') + '</b></div>').join('');
  const dest = E.destino && E.destino !== E.cid ? E.destino : (opcionesDestino()[0] || ''); E.destino = dest;
  const tope = dest ? M().rutaTope(s, E.cid, dest, ay) : 0; E.cargas = Math.max(1, Math.min(E.cargas, tope || 1));
  let cu = null; try { if (dest) cu = M().rutaCuenta(s, { a: E.cid, b: dest, prod: E.rprod, cargas: E.cargas }, ay); } catch (e) { cu = null; }
  h += '<div class="mu-sub">RUTA O VIAJE NUEVO</div><div class="mu-caja"><label class="mu-lab" for="mu-dest">Sale de ' + esc(nomC(E.cid)) + ' hacia</label><select id="mu-dest" class="mu-sel" data-m="destino">' + opcionesDestino().map(c => '<option value="' + c + '"' + (c === dest ? ' selected' : '') + '>' + esc(nomC(c)) + '</option>').join('') + '</select>' +
    '<label class="mu-lab" for="mu-prod">Producto</label><select id="mu-prod" class="mu-sel" data-m="rprod">' + M().ORDEN.map(p => '<option value="' + p + '"' + (p === E.rprod ? ' selected' : '') + '>' + esc(nomP(p)) + '</option>').join('') + '</select>' +
    '<span class="mu-lab">Cargas' + (tope ? ' (hasta ' + tope + ')' : '') + '</span><div class="mu-paso"><button type="button" data-m="cargas" data-v="-1" aria-label="Una carga menos">−</button><b>' + E.cargas + '</b><button type="button" data-m="cargas" data-v="1" aria-label="Una carga más">+</button></div>' +
    (cu ? '<div class="mu-cu"><span>Compra</span><b>' + d1(cu.compra) + '</b><span>Venta</span><b>' + d1(cu.venta) + '</b><span>Flete + aduana</span><b>' + d1(cu.flete + cu.portoria) + '</b><span>Ganarías</span><b class="' + (cu.neto >= 0 ? 'mu-up' : 'mu-dn') + '">' + (cu.neto >= 0 ? '+' : '') + d1(cu.neto) + '</b></div>' : '') +
    '<div class="mu-btns"><button type="button" class="mu-btn" data-m="rutacrear"' + (mal || !dest ? ' disabled' : '') + '>Crear ruta mensual</button><button type="button" class="mu-btn sec" data-m="viaje"' + (mal || !dest ? ' disabled' : '') + '>Enviar un viaje ahora</button></div></div>';
  return h;
}

/* ---------- pestaña Senado y aduanas ---------- */
function textoSuceso(e) {
  if (e.t === 'guerra') return 'Guerra con ' + nomF(e.f) + ': sube el grano y el hierro allí';
  if (e.t === 'bloqueo') return 'Puerto de ' + nomC(e.c) + ' bloqueado: sin rutas de mar';
  if (e.t === 'mala') return 'Mala cosecha cerca de ' + nomC(e.c);
  if (e.t === 'buena') return 'Buena cosecha cerca de ' + nomC(e.c);
  return e.t;
}
function vistaSenado() {
  const s = S(), m = s.mercado || {}, ay = G().mercadoAyuda();
  let h = '<div class="mu-sub">CONTRATOS DEL SENADO</div>';
  for (const k of M().contratosPosibles(s, ay)) {
    const ops = k.opciones;
    h += '<div class="mu-caja"><h3>' + esc(k.i) + ' ' + esc(k.n) + (k.vigente ? ' <span class="mu-tag">vigente</span>' : '') + '</h3><p>' + esc(k.texto) + '</p>' +
      (ops ? (ops.length ? '<label class="mu-lab" for="mu-f-' + k.id + '">Con quién</label><select id="mu-f-' + k.id + '" class="mu-sel" data-m="ctrop" data-v="' + k.id + '">' + ops.map(f => '<option value="' + f + '"' + (E.ctrOp[k.id] === f ? ' selected' : '') + '>' + esc(nomF(f)) + '</option>').join('') + '</select>' : '<p>Ninguna facción en paz con ciudades que puedas firmar.</p>') : '') +
      '<div class="mu-btns"><button type="button" class="mu-btn" data-m="proponer" data-v="' + k.id + '"' + (k.vigente || (ops && !ops.length) ? ' disabled' : '') + '>' + (k.vigente ? 'Ya está vigente' : 'Proponer al Senado') + '</button></div></div>';
  }
  const pt = mias().map(c => '<div class="mu-fila"><span>' + esc(nomC(c)) + '</span><b>' + d1((m.portoria && typeof m.portoria[c] === 'number' ? m.portoria[c] : 0.025) * 100) + ' %</b></div>').join('');
  h += '<div class="mu-sub">ADUANA DE TUS CIUDADES (PORTORIA)</div><div class="mu-caja">' + (pt || '<div class="mu-vacio">Sin ciudades.</div>') + '</div>';
  const casas = Object.keys(M().CASAS).map(id => { const c = M().CASAS[id], r = (m.rivales && m.rivales[id]) || {}; return '<div class="mu-fila"><span>' + esc(c.n) + '</span><b>' + (r.ult === 'guerra' ? 'en guerra' : r.ult ? esc(r.ult) : 'quieta') + '</b></div>'; }).join('');
  h += '<div class="mu-sub">CASAS RIVALES</div><div class="mu-caja">' + casas + '</div>';
  const su = (m.sucesos || []);
  h += '<div class="mu-sub">SUCESOS DEL MES</div><div class="mu-caja">' + (su.length ? su.map(e => '<div class="mu-fila"><span>' + esc(textoSuceso(e)) + '</span></div>').join('') : '<div class="mu-vacio">Sin sucesos: el mar y los caminos están tranquilos.</div>') + '</div>';
  return h;
}

/* ---------- marco ---------- */
function pinta() {
  if (!host || !E.abierto || !S()) return;
  const cs = mias(); if (cs.indexOf(E.cid) < 0) E.cid = cs[0];
  const mal = G().mercadoPuede(E.cid);
  const cuerpo = E.tab === 'prod' ? vistaProductos(mal) : E.tab === 'rutas' ? vistaRutas(mal) : vistaSenado();
  const h = host.querySelector('.mu-cuerpo'), st = h ? h.scrollTop : 0;
  host.innerHTML = '<div class="mu-hoja" role="dialog" aria-label="Mercado"><div class="mu-cab"><h2>Mercado</h2><button type="button" class="mu-x" data-m="cerrar" aria-label="Cerrar el mercado">×</button></div>' +
    '<div class="mu-ciud">' + cs.map(c => '<button type="button" class="mu-chip' + (c === E.cid ? ' on' : '') + '" data-m="ciudad" data-v="' + c + '">' + esc(nomC(c)) + '</button>').join('') + '</div>' +
    '<div class="mu-tabs">' + [['prod', 'Productos'], ['rutas', 'Rutas y viajes'], ['senado', 'Senado y aduanas']].map(t => '<button type="button" class="mu-tab' + (E.tab === t[0] ? ' on' : '') + '" data-m="tab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div class="mu-cuerpo">' + cuerpo + '</div></div>';
  const n = host.querySelector('.mu-cuerpo'); if (n) n.scrollTop = st;
}
let avisoFn = null;
export const fijarAviso = f => { avisoFn = f; };   // ui.js pasa su toast
function aviso(t, tono) { if (avisoFn) avisoFn(t, tono); }
function clic(e) {
  const b = e.target.closest && e.target.closest('[data-m]'); if (!b || b.disabled || b.tagName === 'SELECT') return;
  const a = b.dataset.m, v = b.dataset.v, g = G();
  if (a === 'cerrar') return cerrarMercado();
  if (a === 'tab') { E.tab = v; E.prod = null; }
  else if (a === 'ciudad') { E.cid = v; E.prod = null; }
  else if (a === 'prod') E.prod = E.prod === v ? null : v;
  else if (a === 'fichax') E.prod = null;
  else if (a === 'comprar' || a === 'vender') {
    const n = +b.dataset.n, r = a === 'vender' ? g.mercadoVender(E.cid, v, n) : g.mercadoComprar(E.cid, v, n);
    aviso(r.ok ? (a === 'vender' ? 'Vendes ' + n + ' de ' + nomP(v).toLowerCase() + ' a ' + d1(r.precioMedio) + ' c/u.' : 'Compras ' + n + ' de ' + nomP(v).toLowerCase() + ' a ' + d1(r.precioMedio) + ' c/u.') : r.motivo, r.ok ? 'good' : 'bad');
  }
  else if (a === 'cargas') E.cargas = Math.max(1, E.cargas + (+v));
  else if (a === 'quitar') { const r = g.rutaQuitar(v); aviso(r.ok ? 'Ruta quitada.' : r.motivo, r.ok ? '' : 'bad'); }
  else if (a === 'rutacrear') { const r = g.rutaCrear(E.cid, E.destino, E.rprod, E.cargas); aviso(r.ok ? 'Ruta creada: ' + nomP(E.rprod) + ' a ' + nomC(E.destino) + '.' : r.motivo, r.ok ? 'good' : 'bad'); }
  else if (a === 'viaje') { const r = g.viajeLanzar(E.cid, E.destino, E.rprod, E.cargas); aviso(r.ok ? 'Sale un viaje con ' + E.cargas + ' cargas de ' + nomP(E.rprod).toLowerCase() + '.' : r.motivo, r.ok ? 'good' : 'bad'); }
  else if (a === 'proponer') {
    const op = E.ctrOp[v] || (host.querySelector('#mu-f-' + v) || {}).value, r = g.contratoProponer(v, v === 'tratado' ? { f: op } : null);
    aviso(!r.ok ? r.motivo : r.aprobado ? 'El Senado aprueba el contrato.' : 'El Senado lo rechaza.', r.ok && r.aprobado ? 'good' : 'bad');
  }
  pinta();
}
function cambia(e) {
  const t = e.target, a = t.dataset && t.dataset.m; if (!a) return;
  if (a === 'destino') E.destino = t.value; else if (a === 'rprod') E.rprod = t.value; else if (a === 'ctrop') E.ctrOp[t.dataset.v] = t.value; else return;
  pinta();
}
function montar() {
  if (host) return;
  if (!document.getElementById('mu-css')) { const st = document.createElement('style'); st.id = 'mu-css'; st.textContent = CSS; document.head.appendChild(st); }
  host = document.createElement('div'); host.id = 'mu'; host.hidden = true; (document.getElementById('app') || document.body).appendChild(host);
  host.addEventListener('click', e => { if (e.target === host) return cerrarMercado(); clic(e); });
  host.addEventListener('change', cambia);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && E.abierto) cerrarMercado(); });
}
export function abrirMercado(cid, tab) {
  if (!S() || !G().mercadoPuede) return; montar();
  const cs = mias(); E.cid = cs.indexOf(cid) >= 0 ? cid : (cs.indexOf(E.cid) >= 0 ? E.cid : cs.find(c => !G().mercadoPuede(c)) || cs[0]);
  E.tab = tab === 'rutas' || tab === 'senado' ? tab : 'prod'; E.prod = null; E.abierto = true; host.hidden = false; document.body.classList.add('mu-abierto'); pinta();
}
export function cerrarMercado() { if (!host) return; E.abierto = false; host.hidden = true; document.body.classList.remove('mu-abierto'); if (window.UI) window.UI.dirty = true; }
export const mercadoAbierto = () => E.abierto;
export const miniaturaProducto = mini;
window.MercadoUI = { abrir: abrirMercado, cerrar: cerrarMercado };
