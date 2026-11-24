/* AQVILA — CE5: pantalla «Este año» (cuentas del año y tributo de guerra). Solo pantalla: la lógica está en este-ano.js.
   Hoja de papiro que sube desde abajo. Estilos propios con prefijo ea-, inyectados una sola vez. Los data-act los conecta quien la use. */
(function (root) {
  'use strict';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Math.round(Number(n) || 0).toLocaleString('es-ES');
  const sg = n => (n > 0 ? '+' : n < 0 ? '−' : '') + num(Math.abs(n));
  const NOM = { impuestos: 'Impuestos', comercio: 'Comercio', cosecha: 'Cosecha', botin: 'Botín', indemnizacion: 'Indemnización', tributo: 'Tributo', aliados: 'Aliados',
    comida: 'Comida', edificios: 'Edificios', obras: 'Obras', legiones: 'Paga de legiones', tributoGuerra: 'Tributo de guerra', sabios: 'Sabios', senado: 'Senado y fiestas', compras: 'Compras', perdido: 'Se pierde' };
  const CAM = { guerra: ['⚔️', 'Guerra', '#9b2a1a'], ciudad: ['🏛️', 'Ciudad', '#b8862b'], comercio: ['⚖️', 'Comercio', '#2f6f8f'], politica: ['📜', 'Política', '#6a3f8a'],
    ciencia: ['🦉', 'Ciencia', '#46661f'], otros: ['🧺', 'Otros', '#7a6a50'], perdido: ['💨', 'Se pierde', '#555a5e'] };
  const RES = { denarios: '🪙', grano: '🌾', materiales: '🧱', hierro: '⚒️', aceite: '🫒', vino: '🍷', verdura: '🥬', lana: '🐑' };
  const RNOM = { denarios: 'Denarios', grano: 'Grano', materiales: 'Materiales', hierro: 'Hierro', aceite: 'Aceite', vino: 'Vino', verdura: 'Verdura', lana: 'Lana' };
  const icono = r => { const D = root.DATA; return (D && D.RES_ICON && D.RES_ICON[r]) || RES[r] || '📦'; };
  const nomR = r => RNOM[r] || (r ? r[0].toUpperCase() + r.slice(1) : '');
  const nomM = m => NOM[m] || m;

  const CSS = '' +
    '.ea-fondo{position:fixed;left:0;right:0;bottom:76px;top:auto;z-index:60;display:flex;justify-content:center;pointer-events:none;overflow:clip}' +
    '.ea-hoja{--tinta:#2b1c0a;--tinta2:#5a4220;--verde:#2f6b1f;--rojo:#9b2a1a;pointer-events:auto;box-sizing:border-box;width:100%;max-width:560px;max-height:min(85vh,calc(100vh - 84px));display:flex;flex-direction:column;color:var(--tinta);font-family:var(--libro,Georgia,serif);' +
    'background-color:var(--papiro,#e8d4a2);background-image:var(--fibras),var(--manchas),radial-gradient(ellipse at 20% 0%,rgba(255,246,214,.7),transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(140,92,36,.38),transparent 60%);' +
    'border-radius:4px 4px 0 0;box-shadow:inset 14px 0 18px -12px rgba(100,60,18,.8),inset -14px 0 18px -12px rgba(100,60,18,.8),0 -14px 40px #000c;padding:0 14px;animation:ea-sube .22s ease-out}' +
    '@keyframes ea-sube{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
    '.ea-asa{flex:none;height:22px;margin:0 -14px 8px;border-radius:9px;background:var(--veta),linear-gradient(#9a6c38,#6a4520 40%,#3a230c);box-shadow:0 3px 5px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,220,160,.35)}' +
    '.ea-cab{flex:none;display:flex;align-items:center;gap:8px;margin-bottom:8px}' +
    '.ea-tit{flex:1;min-width:0;font:700 20px/1.15 var(--serif,serif);letter-spacing:.04em;text-align:center}' +
    '.ea-tit small{display:block;font:400 15px var(--libro,serif);color:var(--tinta2);letter-spacing:0}' +
    '.ea-btn{flex:none;min-height:44px;padding:0 14px;color:var(--tinta);font:700 15px var(--serif,serif);border-radius:8px;border:1px solid rgba(60,35,10,.7);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.ea-btn[disabled]{opacity:.45}' +
    '.ea-cuerpo{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:2px 0 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:none}' +
    '.ea-cuerpo::-webkit-scrollbar{display:none}' +
    '.ea-fichas{flex:none;display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.ea-fichas::-webkit-scrollbar{display:none}' +
    '.ea-ficha{flex:none;min-height:44px;padding:0 14px;border-radius:22px;font:700 16px var(--serif,serif);color:var(--tinta);border:1px solid rgba(60,35,10,.5);background:rgba(255,246,214,.5)}' +
    '.ea-ficha.on{color:#fff3d0;background:linear-gradient(#b3402c,#7e1f12);border-color:#4a0f08}' +
    '.ea-card{flex:none;border-radius:6px;border:1px solid rgba(60,35,10,.4);background:rgba(255,246,214,.4);padding:10px}' +
    '.ea-h{font:700 17px/1.2 var(--serif,serif);margin:0 0 8px;letter-spacing:.02em}' +
    '.ea-apil{display:flex;height:34px;border-radius:6px;overflow:hidden;border:1px solid rgba(40,25,5,.6);background:rgba(0,0,0,.12)}' +
    '.ea-apil>div{display:grid;place-items:center;font-size:17px;min-width:0;overflow:clip}' +
    '.ea-ley{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin-top:10px}' +
    '.ea-ley>div{display:flex;align-items:center;gap:6px;font-size:15px;min-width:0}' +
    '.ea-ley i{flex:none;width:14px;height:14px;border-radius:3px;border:1px solid rgba(0,0,0,.4)}' +
    '.ea-ley b{font:700 20px var(--serif,serif);margin-left:auto}' +
    '.ea-frase{margin:10px 0 0;font-size:16px;color:var(--tinta2)}.ea-frase b{color:var(--tinta)}' +
    '.ea-faltan{flex:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;border-radius:6px;background:linear-gradient(#b3402c,#7e1f12);color:#fff3d0;font:700 17px var(--serif,serif);border:1px solid #4a0f08}' +
    '.ea-faltan span{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;background:rgba(0,0,0,.28)}' +
    '.ea-fila{flex:none;border-radius:6px;border:1px solid rgba(60,35,10,.4);background:rgba(255,246,214,.35);overflow:clip}.ea-fila.abierta{background:rgba(255,246,214,.6);border-color:var(--rojo)}' +
    '.ea-fb{display:flex;align-items:center;gap:10px;width:100%;min-height:64px;padding:8px 10px;border:0;background:none;color:inherit;font:inherit;text-align:left;box-sizing:border-box}' +
    '.ea-ic{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:26px;background:radial-gradient(circle at 35% 30%,#4a3519,#1f160a);border:3px solid #b8862b;box-sizing:border-box}' +
    '.ea-bar{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}' +
    '.ea-b{display:flex;align-items:center;gap:6px;height:14px}.ea-b em{display:block;height:100%;border-radius:3px;min-width:2px}.ea-b span{font-size:13px;line-height:1;color:var(--tinta2);white-space:nowrap}' +
    '.ea-v{background:linear-gradient(#5f9a3a,#2f6b1f)}.ea-r{background:linear-gradient(#c8553f,#8c2415)}' +
    '.ea-saldo{flex:none;width:92px;text-align:right}.ea-saldo b{display:block;font:700 19px var(--serif,serif)}.ea-saldo small{font-size:13px;color:var(--tinta2)}' +
    '.ea-pos{color:var(--verde)}.ea-neg{color:var(--rojo)}.ea-ig{color:var(--tinta2)}' +
    '.ea-det{padding:2px 10px 10px;display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.ea-det h4{margin:0 0 4px;font:700 15px var(--serif,serif)}.ea-det div>div{display:flex;justify-content:space-between;gap:6px;font-size:15px;padding:2px 0;border-bottom:1px dotted rgba(60,35,10,.3)}' +
    '.ea-sello{padding:12px;border:3px double var(--rojo);border-radius:6px;color:var(--rojo);font:700 17px/1.25 var(--serif,serif);text-align:center;transform:rotate(-1.5deg)}' +
    '.ea-acc{display:flex;flex-direction:column;gap:8px;margin-top:10px}.ea-acc .ea-btn{width:100%;font-size:16px}' +
    '.ea-pie{margin:8px 0 0;font-size:13px;color:var(--tinta2);font-style:italic}' +
    '.ea-gu{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center}.ea-gu>div{padding:8px 4px;border-radius:6px;background:rgba(255,250,230,.5);border:1px solid rgba(60,35,10,.3)}' +
    '.ea-gu span{display:block;font-size:24px}.ea-gu b{display:block;font:700 19px var(--serif,serif)}.ea-gu small{font-size:14px;color:var(--tinta2)}';

  const inyectar = () => {
    if (typeof document === 'undefined' || document.getElementById('ea-css')) return;
    const s = document.createElement('style'); s.id = 'ea-css'; s.textContent = CSS; document.head.appendChild(s);
  };

  const flecha = f => f.tendencia === 'sube' ? '<span class="ea-pos">▲</span>' : f.tendencia === 'baja' ? '<span class="ea-neg">▼</span>' : f.tendencia === 'igual' ? '<span class="ea-ig">=</span>' : '';
  const motivos = (l, vacio) => l && l.length ? l.map(x => '<div><span>' + esc(nomM(x.m)) + '</span><b>' + num(x.n) + '</b></div>').join('') : '<div><span>' + vacio + '</span></div>';

  const filas = (lista, abierta) => {
    const mx = Math.max(1, ...lista.map(f => Math.max(f.entra || 0, f.sale || 0)));
    return lista.map(f => {
      const ab = abierta === f.r, cl = f.saldo > 0 ? 'ea-pos' : f.saldo < 0 ? 'ea-neg' : 'ea-ig';
      return '<div class="ea-fila' + (ab ? ' abierta' : '') + '"><button class="ea-fb" data-act="eafila" data-v="' + esc(f.r) + '" aria-expanded="' + ab + '">' +
        '<span class="ea-ic">' + icono(f.r) + '</span><span class="ea-bar">' +
        '<span class="ea-b"><em class="ea-v" style="width:' + (f.entra / mx * 70).toFixed(1) + '%"></em><span>' + num(f.entra) + '</span></span>' +
        '<span class="ea-b"><em class="ea-r" style="width:' + (f.sale / mx * 70).toFixed(1) + '%"></em><span>' + num(f.sale) + '</span></span></span>' +
        '<span class="ea-saldo"><b class="' + cl + '">' + flecha(f) + ' ' + sg(f.saldo) + '</b><small>' + esc(nomR(f.r)) + '</small></span></button>' +
        (ab ? '<div class="ea-det"><div><h4>Entra</h4>' + motivos(f.motivosEntra, 'Nada') + '</div><div><h4>Sale</h4>' + motivos(f.motivosSale, 'Nada') + '</div></div>' : '') + '</div>';
    }).join('');
  };

  const tributo = t => {
    if (!t) return '';
    const cub = (t.cubre && ((t.cubre.botin || 0) + (t.cubre.indemnizacion || 0))) || 0, co = Math.max(1, t.coste || 0);
    const pb = Math.min(100, (t.cubre && t.cubre.botin || 0) / co * 100), pi = Math.min(100 - pb, (t.cubre && t.cubre.indemnizacion || 0) / co * 100);
    const op = t.opciones || {}, tr = op.tributo || {}, ca = op.caja || {};
    return '<div class="ea-card"><h3 class="ea-h">🛡️ Tributo de guerra (primavera)</h3>' +
      '<div class="ea-apil" title="Coste"><div style="width:' + pb.toFixed(1) + '%;background:#b8862b">' + (pb > 12 ? '💰' : '') + '</div><div style="width:' + pi.toFixed(1) + '%;background:#2f6f8f">' + (pi > 12 ? '📜' : '') + '</div><div style="flex:1;background:#9b2a1a;color:#fff3d0;font:700 15px serif">' + (t.falta > 0 ? num(t.falta) : '') + '</div></div>' +
      '<div class="ea-ley"><div><i style="background:#b8862b"></i>Botín<b>' + num(t.cubre && t.cubre.botin) + '</b></div><div><i style="background:#2f6f8f"></i>Indemniz.<b>' + num(t.cubre && t.cubre.indemnizacion) + '</b></div>' +
      '<div><i style="background:#9b2a1a"></i>Falta<b>' + num(t.falta) + '</b></div><div>Coste<b>' + num(t.coste) + '</b></div></div>' +
      (t.suspendido ? '<div class="ea-sello" style="margin-top:10px">Este año no hay tributo: lo paga el botín</div>' :
        '<div class="ea-acc"><button class="ea-btn" data-act="eatributo"' + (tr.posible === false ? ' disabled' : '') + '>Cobrar tributo · −' + num(Math.abs(tr.humor || 0)) + ' humor</button>' +
        '<button class="ea-btn" data-act="eacaja"' + (ca.alcanza === false ? ' disabled' : '') + '>Pagar de la caja · ' + num(ca.paga) + '</button></div>') +
      '<p class="ea-pie">Stipendium: la paga del soldado (Livio 4.59)</p></div>';
  };

  const html = (cu, opts) => {
    cu = cu || {}; opts = opts || {};
    const amb = opts.ambito || 'imperio', nombres = opts.nombres || {};
    const ids = Object.keys(cu.ciudades || {}), lista = (amb === 'imperio' ? cu.imperio : (cu.ciudades || {})[amb]) || [];
    const ad = cu.adonde || { total: 0, partes: [], caminos: [] }, cam = (ad.caminos || []).filter(c => c.pc > 0);
    const gu = cu.guerra || { cuesta: 0, gana: 0, saldo: 0 };
    return '<div class="ea-fondo"><div class="ea-hoja" role="dialog" aria-label="Este año"><div class="ea-asa"></div>' +
      '<div class="ea-cab"><div class="ea-tit">Este año<small>' + esc(opts.anioTexto || cu.anio || '') + '</small></div><button class="ea-btn" data-act="eacerrar">Cerrar</button></div>' +
      '<div class="ea-cuerpo"><div class="ea-fichas"><button class="ea-ficha' + (amb === 'imperio' ? ' on' : '') + '" data-act="eaambito" data-v="imperio">Imperio</button>' +
      ids.map(id => '<button class="ea-ficha' + (amb === id ? ' on' : '') + '" data-act="eaambito" data-v="' + esc(id) + '">' + esc(nombres[id] || id) + '</button>').join('') + '</div>' +
      '<div class="ea-card"><h3 class="ea-h">¿A dónde va tu dinero?</h3><div class="ea-apil">' +
      cam.map(c => { const k = CAM[c.camino] || CAM.otros; return '<div style="width:' + c.pc + '%;background:' + k[2] + '">' + (c.pc >= 9 ? k[0] : '') + '</div>'; }).join('') + '</div>' +
      '<div class="ea-ley">' + cam.map(c => { const k = CAM[c.camino] || CAM.otros; return '<div><i style="background:' + k[2] + '"></i>' + k[0] + ' ' + k[1] + '<b>' + Math.round(c.pc) + '%</b></div>'; }).join('') + '</div>' +
      (ad.mayor ? '<p class="ea-frase">Lo que más gasta: <b>' + esc(nomM(ad.mayor.motivo || ad.mayor)) + '</b></p>' : (ad.partes && ad.partes[0] ? '<p class="ea-frase">Lo que más gasta: <b>' + esc(nomM(ad.partes[0].motivo)) + '</b></p>' : '')) + '</div>' +
      (cu.faltan && cu.faltan.length ? '<div class="ea-faltan">Te falta: ' + cu.faltan.map(r => '<span>' + icono(r) + ' ' + esc(nomR(r)) + '</span>').join('') + '</div>' : '') +
      filas(lista, opts.abierta) + tributo(opts.tributo) +
      '<div class="ea-card"><h3 class="ea-h">⚔️ La guerra este año</h3><div class="ea-gu"><div><span>📉</span><b>' + num(gu.cuesta) + '</b><small>Cuesta</small></div><div><span>💰</span><b>' + num(gu.gana) + '</b><small>Gana</small></div>' +
      '<div><span>' + (gu.saldo >= 0 ? '▲' : '▼') + '</span><b class="' + (gu.saldo >= 0 ? 'ea-pos' : 'ea-neg') + '">' + sg(gu.saldo) + '</b><small>Saldo</small></div></div></div>' +
      '</div></div></div>';
  };

  const montar = (el, cu, opts) => { inyectar(); const sc = el.querySelector && el.querySelector('.ea-cuerpo'), y = sc ? sc.scrollTop : 0; el.innerHTML = html(cu, opts); const n = el.querySelector('.ea-cuerpo'); if (n && y) n.scrollTop = y; };

  root.ESTEANO_UI = { css: CSS, html, montar };
})(typeof window !== 'undefined' ? window : globalThis);
