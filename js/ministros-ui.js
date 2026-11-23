/* AQVILA — CD3b: pantalla «Tus ministros». Solo pantalla: la lógica está en ministros.js (window.MINISTROS).
   Hoja de papiro que sube desde abajo. Estilos propios con prefijo mn-, inyectados una sola vez. */
(function (root) {
  'use strict';
  const M = () => root.MINISTROS, D = () => root.DATA;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* nombre visible: «termas» se llama siempre «Baños» */
  const vis = t => String(t == null ? '' : t).replace(/termas/g, 'baños').replace(/Termas/g, 'Baños').replace(/TERMAS/g, 'BAÑOS');
  const txt = t => esc(vis(t));
  const nomB = b => b === 'termas' ? 'Baños' : ((D().BUILD[b] && D().BUILD[b].n) || b);
  const nomC = id => (D().CITIES[id] && D().CITIES[id].n) || id;
  const nomU = u => (D().UNITS[u] && D().UNITS[u].n) || u;
  const RECURSO = { grano: 'grano', denarios: 'denarios', materiales: 'materiales', hierro: 'hierro' };
  const ACTO = { ruta: 'abrir una ruta de comercio', juegos: 'dar unos juegos', ofrenda: 'hacer una ofrenda', leva: 'hacer una leva', grano: 'repartir grano' };
  const IMP = { bajo: 'bajos', normal: 'normales', alto: 'altos' };

  const CSS = '' +
    '.mn-fondo{position:fixed;left:0;right:0;bottom:76px;top:auto;z-index:60;display:flex;justify-content:center;pointer-events:none;overflow:clip}' +
    '.mn-hoja{--tinta:#2b1c0a;--tinta2:#5a4220;--oliva:#46661f;pointer-events:auto;box-sizing:border-box;width:100%;max-width:560px;max-height:min(85vh,calc(100vh - 84px));display:flex;flex-direction:column;color:var(--tinta);font-family:var(--libro,Georgia,serif);' +
    'background-color:var(--papiro,#e8d4a2);background-image:var(--fibras),var(--manchas),radial-gradient(ellipse at 20% 0%,rgba(255,246,214,.7),transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(140,92,36,.38),transparent 60%);' +
    'border-radius:4px 4px 0 0;box-shadow:inset 14px 0 18px -12px rgba(100,60,18,.8),inset -14px 0 18px -12px rgba(100,60,18,.8),0 -14px 40px #000c;padding:0 14px;animation:mn-sube .22s ease-out}' +
    '@keyframes mn-sube{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
    '.mn-asa{flex:none;position:relative;height:22px;margin:0 -14px 8px;border-radius:9px;background:var(--veta),linear-gradient(#9a6c38,#6a4520 40%,#3a230c);box-shadow:0 3px 5px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,220,160,.35)}' +
    '.mn-asa::before,.mn-asa::after{content:"";position:absolute;top:-4px;width:16px;height:30px;border-radius:6px/10px;background:radial-gradient(ellipse at 40% 28%,#fff1c0 0 8%,#e2b860 22%,#a8781f 55%,#4e3409 100%);box-shadow:inset 0 0 0 1px rgba(60,35,5,.7),0 2px 3px #000}' +
    '.mn-asa::before{left:-6px}.mn-asa::after{right:-6px}' +
    '.mn-cab{flex:none;display:flex;align-items:center;gap:8px;margin-bottom:8px}' +
    '.mn-cab .ro-ansata{flex:1;min-width:0;height:40px;margin:0 22px 0 20px;font-size:17px;letter-spacing:.08em}' +
    '.mn-cerrar{flex:none;min-height:44px;padding:0 12px;color:var(--tinta);font:700 15px var(--serif,serif);border-radius:8px;border:1px solid rgba(60,35,10,.7);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.mn-lista{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 0 14px;display:flex;flex-direction:column;gap:8px;scrollbar-width:none}' +
    '.mn-lista::-webkit-scrollbar{display:none}' +
    '.mn-card{flex:none;border-radius:6px;border:1px solid rgba(60,35,10,.4);background:rgba(255,246,214,.35);overflow:clip}' +
    '.mn-card.abierta{background:rgba(255,246,214,.6);border-color:var(--minio,#9b2a1a)}' +
    '.mn-cab1{display:flex;align-items:flex-start;gap:10px;width:100%;min-height:56px;padding:10px;border:0;background:none;color:inherit;font:inherit;text-align:left}' +
    '.mn-ins{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:22px;line-height:1;background:radial-gradient(circle at 35% 30%,#4a3519,#1f160a);box-shadow:0 0 0 2px #b8862b,inset 0 0 0 2px rgba(0,0,0,.6),0 2px 3px rgba(0,0,0,.4)}' +
    '.mn-cuerpo{flex:1;min-width:0}' +
    '.mn-area{font:700 17px/1.2 var(--serif,serif);letter-spacing:.03em;color:var(--tinta)}' +
    '.mn-cargo{font-size:14px;color:var(--tinta2);margin-top:1px}' +
    '.mn-bando{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--tinta2);margin-top:1px}' +
    '.mn-pt{flex:none;width:12px;height:12px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(255,255,255,.35),0 0 0 1px rgba(60,35,10,.5)}' +
    '.mn-enc{margin-top:6px;font-size:14px;line-height:1.3;color:var(--tinta)}' +
    '.mn-sin{color:var(--tinta2);font-style:italic}' +
    '.mn-barra{height:7px;margin-top:5px;border-radius:4px;background:rgba(60,35,10,.18);box-shadow:inset 0 1px 1px rgba(60,35,10,.35);overflow:clip}' +
    '.mn-barra i{display:block;height:100%;background:linear-gradient(90deg,#5f7d2e,var(--oliva))}' +
    '.mn-quedan{font-size:13px;color:var(--tinta2);margin-top:3px}' +
    '.mn-aviso{margin-top:5px;font-size:14px;line-height:1.3;color:var(--minio,#9b2a1a);font-weight:700}' +
    '.mn-prop{margin:0 10px 10px;padding:8px 10px;border-radius:6px;border:1px dashed rgba(60,35,10,.55);background:rgba(255,250,230,.45);font-size:14px;line-height:1.35}' +
    '.mn-prop b{display:block;color:var(--minio,#9b2a1a);font:700 13px var(--serif,serif);letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}' +
    '.mn-bots{display:flex;gap:8px;margin-top:8px}' +
    '.mn-b{flex:1;min-width:0;min-height:44px;padding:4px 8px;border-radius:8px;font:700 15px var(--serif,serif);letter-spacing:.03em;color:var(--tinta);border:1px solid rgba(60,35,10,.7);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.mn-b.sello{color:#fbe9c7;text-shadow:0 1px 0 rgba(0,0,0,.5);border:1px solid #6e130d;background:radial-gradient(ellipse at 30% 0%,rgba(255,190,160,.3),transparent 60%),linear-gradient(#b8321f,#7e1910 70%,#6a140c);box-shadow:0 0 0 2px #6a4a18,0 0 0 3px rgba(233,192,99,.55),0 3px 8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,220,200,.4)}' +
    '.mn-b.bronce{color:#ecd9a8;border:1px solid #7a5a1f;background:radial-gradient(ellipse at 50% 0%,rgba(233,192,99,.22),transparent 70%),linear-gradient(#3e2e16,#1f160a);box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),inset 0 0 0 3px rgba(184,134,43,.28),0 2px 4px rgba(0,0,0,.4)}' +
    '.mn-det{padding:0 10px 10px;border-top:1px solid rgba(60,35,10,.25)}' +
    '.mn-cont{margin-top:8px;font-size:13px;color:var(--tinta2)}' +
    '.mn-cont b{color:var(--tinta)}' +
    '.mn-opc{display:flex;flex-direction:column;gap:6px;margin-top:8px}' +
    '.mn-opc h4{margin:4px 0 0;font:700 13px var(--serif,serif);letter-spacing:.08em;text-transform:uppercase;color:var(--minio,#9b2a1a)}' +
    '.mn-o{display:block;width:100%;min-height:44px;padding:7px 10px;text-align:left;border-radius:6px;font:600 14px/1.3 var(--libro,serif);color:var(--rasgado,#ead9b0);border:0;background:repeating-linear-gradient(-28deg,transparent 0 9px,rgba(255,230,190,.05) 9px 10px),linear-gradient(#3f2e1b,#2a1e10);box-shadow:inset 0 3px 5px rgba(0,0,0,.7),inset 0 -1px 0 rgba(255,220,160,.12)}' +
    '.mn-o.no{background:rgba(60,35,10,.12);color:var(--tinta2);box-shadow:inset 0 0 0 1px rgba(60,35,10,.3)}' +
    '.mn-o small{display:block;font-size:13px;font-weight:400;color:#f0c9a8;margin-top:1px}' +
    '.mn-o.no small{color:var(--minio,#9b2a1a);font-weight:700}' +
    '.mn-err{margin-top:6px;font-size:14px;font-weight:700;color:var(--minio,#9b2a1a)}' +
    '.mn-vacio{font-size:14px;color:var(--tinta2);padding:6px 0}';

  const meter = () => { if (document.getElementById('ministros-ui-css')) return; const st = document.createElement('style'); st.id = 'ministros-ui-css'; st.textContent = CSS; document.head.appendChild(st); };

  const U = { s: null, op: null, el: null, abierta: null, lista: null, err: {} };

  /* ---- candidatos para «Encargar» ---- */
  const ciudadMayor = s => Object.keys(s.cities).filter(id => s.cities[id].owner === 'roma').sort((a, b) => (s.cities[b].pop || 0) - (s.cities[a].pop || 0) || (a < b ? -1 : 1))[0];
  const frase = (s, e) => {
    const c = e.ciudad ? nomC(e.ciudad) : '';
    switch (e.tipo) {
      case 'nivel': return 'Subir ' + nomB(e.b) + ' a nivel ' + e.objetivo + ' en ' + c;
      case 'tropas': return 'Reclutar ' + e.n + ' ' + nomU(e.u) + ' en ' + c;
      case 'saber': return 'Investigar ' + ((D().INVEST[e.saber] && D().INVEST[e.saber].n) || e.saber);
      case 'impuesto': return 'Poner impuestos ' + (IMP[e.nivel] || e.nivel) + ' en ' + c;
      case 'reserva': return 'Reunir ' + e.objetivo + ' de ' + (RECURSO[e.recurso] || e.recurso);
      case 'acto': return 'Pedir ' + e.n + ' acto: ' + (ACTO[e.acto] || e.acto);
    }
    return '';
  };
  const candidatos = (s, f) => {
    const d = D(), cid = ciudadMayor(s), c = cid ? s.cities[cid] : null, out = [];
    if (!c) return out;
    for (const t of f.tipos) {
      if (t === 'nivel') f.edificios.filter(b => d.BUILD[b]).forEach(b => out.push({ tipo: 'nivel', ciudad: cid, b, objetivo: ((c.b && c.b[b]) || 0) + 1 }));
      if (t === 'tropas') ['hastati', 'principes', 'triarii', 'velites', 'equites'].filter(u => d.UNITS[u]).forEach(u => out.push({ tipo: 'tropas', ciudad: cid, u, n: 100 }));
      if (t === 'saber') {
        const h = (s.inv && s.inv.hechas) || {}, ed = (s.inv && s.inv.edad) || 1, coste = i => { let n = 0; for (const k in (i.cost || {})) n += i.cost[k] || 0; return n; };
        Object.keys(d.INVEST).filter(id => !h[id] && (d.INVEST[id].edad || 1) <= ed).sort((a, b) => coste(d.INVEST[a]) - coste(d.INVEST[b]) || (a < b ? -1 : 1)).slice(0, 6).forEach(id => out.push({ tipo: 'saber', saber: id }));
      }
      if (t === 'impuesto') Object.keys(d.IMPUESTOS).filter(n => n !== (c.imp || 'normal')).forEach(n => out.push({ tipo: 'impuesto', ciudad: cid, nivel: n }));
      if (t === 'reserva') ['grano', 'denarios', 'materiales', 'hierro'].forEach(r => out.push({ tipo: 'reserva', recurso: r, objetivo: Math.ceil((s.res && s.res[r]) || 0) + 300 }));
      if (t === 'acto') (f.actos || []).forEach(a => out.push({ tipo: 'acto', acto: a, n: 1 }));
    }
    return out;
  };
  /* ¿vale? se prueba sobre una copia profunda; no toca la partida */
  const motivoDe = (s, mid, e) => {
    const copia = JSON.parse(JSON.stringify(s));
    const r = M().encargar(copia, mid, Object.assign({}, e), U.op.mes);
    return r.ok ? '' : (r.motivo || 'No se puede');
  };

  /* ---- pintado ---- */
  const tarjeta = (s, f, st) => {
    const D0 = D(), B = f.bando ? D0.BANDOS[f.bando] : null, ab = U.abierta === f.id;
    let h = '<div class="mn-card' + (ab ? ' abierta' : '') + '" data-mid="' + f.id + '">';
    h += '<button class="mn-cab1" data-acc="abrir" data-mid="' + f.id + '" aria-expanded="' + ab + '"><span class="mn-ins">' + esc(f.i) + '</span><span class="mn-cuerpo">';
    h += '<div class="mn-area">' + txt(f.area) + '</div><div class="mn-cargo">' + txt(f.cargo) + (st.familia ? ' · ' + txt(st.familia) : '') + '</div>';
    h += '<div class="mn-bando">' + (B ? '<span class="mn-pt" style="background:' + esc(B.col) + '"></span>' + txt(B.n) : 'Sin bando') + '</div>';
    if (st.encargo) {
      const p = Math.round(st.encargo.progreso * 100), q = st.encargo.plazoEst;
      h += '<div class="mn-enc">' + txt(st.encargo.texto) + '</div><div class="mn-barra"><i style="width:' + p + '%"></i></div><div class="mn-quedan">' + p + ' % · ' + (q > 1 ? 'quedan ' + q + ' estaciones' : q === 1 ? 'queda 1 estación' : 'último plazo') + '</div>';
    } else h += '<div class="mn-enc mn-sin">Sin encargo</div>';
    if (st.aviso) h += '<div class="mn-aviso">⚠ ' + txt(st.aviso) + '</div>';
    h += '</span></button>';
    if (st.propuesta) h += '<div class="mn-prop"><b>Propone</b>' + txt(st.propuesta.texto) + '<div class="mn-bots"><button class="mn-b sello" data-acc="aceptar" data-mid="' + f.id + '">Aceptar</button><button class="mn-b" data-acc="descartar" data-mid="' + f.id + '">Descartar</button></div></div>';
    if (ab) {
      h += '<div class="mn-det"><div class="mn-bots"><button class="mn-b bronce" data-acc="encargar" data-mid="' + f.id + '">' + (U.lista === f.id ? 'Cerrar la lista' : 'Encargar') + '</button>' + (st.encargo ? '<button class="mn-b" data-acc="cancelar" data-mid="' + f.id + '">Cancelar encargo</button>' : '') + '</div>';
      h += '<div class="mn-cont">Cumplidos <b>' + st.hechos + '</b> · Fallidos <b>' + st.fallos + '</b></div>';
      if (U.err[f.id]) h += '<div class="mn-err">' + txt(U.err[f.id]) + '</div>';
      if (U.lista === f.id) h += lista(s, f);
      h += '</div>';
    }
    return h + '</div>';
  };
  const lista = (s, f) => {
    const cs = candidatos(s, f); if (!cs.length) return '<div class="mn-vacio">No hay nada que encargar ahora.</div>';
    let h = '<div class="mn-opc">', ult = '';
    const TIT = { nivel: 'Obras', tropas: 'Tropas', saber: 'Saberes', impuesto: 'Impuestos', reserva: 'Reservas', acto: 'Actos' };
    cs.forEach((e, i) => {
      if (e.tipo !== ult) { h += '<h4>' + TIT[e.tipo] + '</h4>'; ult = e.tipo; }
      const mot = motivoDe(s, f.id, e);
      h += '<button class="mn-o' + (mot ? ' no' : '') + '" data-acc="elegir" data-mid="' + f.id + '" data-i="' + i + '"' + (mot ? ' aria-disabled="true"' : '') + '>' + txt(frase(s, e)) + (mot ? '<small>' + txt(mot) + '</small>' : '') + '</button>';
    });
    return h + '</div>';
  };

  const pintar = () => {
    if (!U.el || !U.s) return;
    const s = U.s, est = M().estado(s, U.op.mes), lista0 = U.el.querySelector('.mn-lista'), y = lista0 ? lista0.scrollTop : 0;
    let h = '<div class="mn-hoja" role="dialog" aria-label="Tus ministros"><div class="mn-asa"></div><div class="mn-cab"><h2 class="ro-ansata" style="margin:0 22px 0 20px">Tus ministros</h2><button class="mn-cerrar" data-acc="cerrar">Cerrar</button></div><div class="mn-lista">';
    est.forEach(st => { h += tarjeta(s, M().DATOS.find(x => x.id === st.id), st); });
    h += '</div></div>';
    U.el.innerHTML = h;
    const n = U.el.querySelector('.mn-lista'); if (n) n.scrollTop = y;
  };

  /* sube la tarjeta abierta al principio de la lista, para ver su lista de encargos */
  const verAbierta = () => { const l = U.el && U.el.querySelector('.mn-lista'), c = l && l.querySelector('.mn-card.abierta'); if (c) l.scrollTop = c.offsetTop - l.offsetTop - 4; };
  const cambio = () => { pintar(); if (U.op.alCambiar) U.op.alCambiar(U.s); };
  const clic = ev => {
    const b = ev.target.closest('[data-acc]'); if (!b || !U.el.contains(b)) return;
    const acc = b.dataset.acc, mid = b.dataset.mid, s = U.s, m = M();
    if (acc === 'cerrar') return cerrar();
    if (acc === 'abrir') { U.abierta = U.abierta === mid ? null : mid; U.lista = null; U.err = {}; pintar(); return verAbierta(); }
    if (acc === 'encargar') { U.lista = U.lista === mid ? null : mid; U.err = {}; pintar(); return verAbierta(); }
    if (acc === 'aceptar') { const r = m.aceptar(s, mid, U.op.mes); if (!r.ok) { U.err[mid] = r.motivo; U.abierta = mid; return pintar(); } U.err = {}; return cambio(); }
    if (acc === 'descartar') { m.migrar(s); s.ministros.propuestas[mid] = null; return cambio(); }
    if (acc === 'cancelar') { m.cancelar(s, mid); U.lista = null; return cambio(); }
    if (acc === 'elegir') {
      const e = candidatos(s, m.DATOS.find(x => x.id === mid))[+b.dataset.i];
      const r = e ? m.encargar(s, mid, e, U.op.mes) : { ok: false, motivo: 'Ya no está disponible' };
      if (!r.ok) { U.err[mid] = r.motivo; return pintar(); }
      U.lista = null; U.err = {}; return cambio();
    }
  };

  const abrir = (s, op) => {
    meter(); cerrar();
    U.s = s; U.op = Object.assign({ mes: Math.floor((s.t || 0) + 1e-9) }, op || {}); U.abierta = null; U.lista = null; U.err = {};
    M().migrar(s);
    U.el = document.createElement('div'); U.el.className = 'mn-fondo'; U.el.id = 'mn-fondo';
    (U.op.contenedor || document.body).appendChild(U.el);
    U.el.addEventListener('click', clic);
    pintar();
  };
  const cerrar = () => { if (U.el) { U.el.remove(); U.el = null; } };
  const api = { abrir, cerrar, pintar, abre: id => { U.abierta = id; U.lista = null; pintar(); verAbierta(); }, lista: id => { U.abierta = id; U.lista = id; pintar(); verAbierta(); }, nombreVisible: vis };
  root.MINISTROS_UI = api;
})(typeof window !== 'undefined' ? window : globalThis);
