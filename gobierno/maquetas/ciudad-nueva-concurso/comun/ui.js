/* Capa de interfaz común (HTML sobre el dibujo). Uso: montarUI({modo:'ciudad'|'construir'|'necesidades'}).
   Si no se da modo, lo toma de ?p=. Pone el HTML dentro de #ui. Lee window.ESCENA para colocar los halos. */
(function () {
  const g = (d, extra = '') => `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</g>`;
  const sv = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  /* los 8 iconos de necesidades, a mano */
  const ICONOS = {
    agua: g('<path d="M12 3.5C9 8 6.5 11 6.5 14.5a5.5 5.5 0 0 0 11 0C17.5 11 15 8 12 3.5z" fill="currentColor"/>'),
    alimentacion: g('<path d="M12 21V9"/><ellipse cx="8.8" cy="10.5" rx="2" ry="3.3" transform="rotate(-35 8.8 10.5)" fill="currentColor"/><ellipse cx="15.2" cy="10.5" rx="2" ry="3.3" transform="rotate(35 15.2 10.5)" fill="currentColor"/><ellipse cx="8.8" cy="16" rx="2" ry="3.3" transform="rotate(-35 8.8 16)" fill="currentColor"/><ellipse cx="15.2" cy="16" rx="2" ry="3.3" transform="rotate(35 15.2 16)" fill="currentColor"/><ellipse cx="12" cy="5.8" rx="1.8" ry="3" fill="currentColor"/>'),
    limpieza: g('<path d="M19 3.5L12.5 11"/><path d="M8.2 10.2l5.6 5.6-3.4 5.3L3.5 17.6z" fill="currentColor"/><path d="M8 15l-2 3M11 17l-1.5 2.5" stroke="#0007" stroke-width="1"/>'),
    salud: g('<path d="M12 3v18"/><path d="M15.5 6.5c-7 0-7 5 0 5.500s-7 5.500 0 6" stroke-width="1.7"/><circle cx="15.8" cy="6.4" r="1.2" fill="currentColor"/><path d="M8.5 5.500h7"/>'),
    trabajo: g('<path d="M12.5 10.5l6 10" stroke-width="2.4"/><path d="M3.5 8.5l8-4.500 3.500 6-8 4z" fill="currentColor"/>'),
    cultura: g('<path d="M8 4h10v12a4 4 0 0 1-4 4H6a3.500 3.500 0 0 0 3.500-3.500V7.500A3.500 3.500 0 0 0 8 4z"/><path d="M12.500 9h3.500M12.500 13h3.500"/>'),
    culto_ocio: g('<path d="M5 5h14v7a7 7 0 0 1-14 0z M8.200 9.200l2.800 1.300-2.800 1.200z M15.800 9.200l-2.800 1.300 2.800 1.200z M8.800 15c1.800 2.200 4.600 2.200 6.400 0-2 .6-4.400.6-6.400 0z" fill="currentColor" fill-rule="evenodd" stroke="none"/>'),
    orden: g('<path d="M12 3l7 2.500v6c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9v-6z"/><circle cx="12" cy="11" r="2.200" fill="currentColor"/>')
  };
  const PUNO = g('<path d="M8 11V6.500a1.500 1.500 0 0 1 3 0V10M11 9.500V5a1.500 1.500 0 0 1 3 0v5M14 9.500V6a1.500 1.500 0 0 1 3 0v6c0 4-2 7-5.500 7S6 16.500 6 13.500V12a1.500 1.500 0 0 1 2-1.400" fill="currentColor"/><path d="M3 21h18"/>');
  const FAM = {
    prin: '<path d="M4 20V10l8-6 8 6v10zM9 20v-6h6v6"/>',
    infra: '<path d="M3 17h18M3 11h18M6 11V7M12 11V7M18 11V7M3 21h18"/>',
    pol: '<path d="M3 20h18M5 20V9M10 20V9M14 20V9M19 20V9M3 9l9-6 9 6z"/>',
    mil: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M12 7v10"/>',
    prod: '<path d="M4 20V9l5 3V9l5 3V6h6v14z"/>',
    viv: '<path d="M3 11l9-7 9 7M6 10v10h12V10M10 20v-5h4v5"/>',
    puer: '<circle cx="12" cy="6" r="2.400"/><path d="M12 9v12M6 14c0 4 3 6 6 6s6-2 6-6M8 13H4M20 13h-4"/>'
  };
  const PIEZAS = [
    ['Calle', '2 mat.', '<path d="M8 3l-3 18M16 3l3 18M12 5v3M12 11v3M12 17v3"/>'],
    ['Fuente', '60 mat.', '<circle cx="12" cy="15" r="6.500"/><path d="M12 12V4M9 7l3-3 3 3"/>'],
    ['Acueducto', '180 mat.', '<path d="M3 8h18M3 8v12M9 8v12M15 8v12M21 8v12M3 20h18M3 14a3 3 0 0 1 6 0M9 14a3 3 0 0 1 6 0M15 14a3 3 0 0 1 6 0"/>'],
    ['Termas', '400 mat.', '<path d="M4 20V10h16v10zM4 10c0-4 3-6 8-6s8 2 8 6M8 15c1-1.500 2-1.500 3 0s2 1.500 3 0"/>'],
    ['Cloaca', '90 mat.', '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M7 7l10 10M17 7L7 17"/>'],
    ['Jardín', '30 mat.', '<path d="M12 21v-8M12 13c-5 0-6-4-6-7 4 0 6 2 6 7zM12 13c5 0 6-4 6-7-4 0-6 2-6 7z"/>']
  ];
  const RES = [
    ['grano', '1 240', ICONOS.alimentacion],
    ['denarios', '860', g('<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="5" stroke-width="1.200"/>')],
    ['madera', '530', g('<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="18" cy="12" r="2.500"/><path d="M7 10v4M11 9v6"/>')],
    ['piedra', '210', g('<path d="M3 18l3-9 7-4 6 6 2 7z"/><path d="M6 9l7 3 6 0M13 12l-2 6"/>')],
    ['población', '4 870', g('<circle cx="9" cy="8" r="3.200"/><circle cx="17" cy="9" r="2.600"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6zM15 14.500c3 0 6 1.500 6 5.500"/>')]
  ];
  const BTN = {
    m: sv(g('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/>', 'stroke-width="2"')),
    c: sv(g('<path d="M4 20V10l8-6 8 6v10z"/>', 'stroke-width="2"')),
    s: sv(g('<path d="M3 20h18M5 20V9M10 20V9M14 20V9M19 20V9M3 9l9-6 9 6z"/>', 'stroke-width="2"'))
  };
  let PROY = null; // opcional: (x,y)=>[sx,sy], para vistas en perspectiva
  const E = () => window.ESCENA;
  const icono = (k, estado) => `<div class="ic ${estado}" title="${k}" style="background:var(--ui-${estado})">${sv(ICONOS[k])}</div>`;
  const top = () => `<div class="top">${RES.map(([n, v, d]) => `<div class="r" title="${n}">${sv(d)}<b>${v}</b></div>`).join('')}</div><div class="fecha">${E().fecha}</div>`;
  const barra = (on) => `<div class="barra"><button>${BTN.m}Ministros</button><button class="gran${on ? ' on' : ''}">${BTN.c}Construir</button><button>${BTN.s}Senado</button></div>`;
  const listaTxt = (b, est) => { const n = E().NECESIDADES.filter(([k]) => b.necesidades[k] === est).map(([, t]) => t.toLowerCase().replace('alimentación', 'comida')); return n.length ? n.join(' y ') : ''; };

  function ciudad() {
    const etq = (x, y, h, c = '') => { if (PROY) [x, y] = PROY(x, y); return `<div class="etq ${c}" style="left:${x}px;top:${y}px">${h}</div>`; };
    return top() + etq(195, 360, '<b>Foro</b>', 'foro') + E().barrios.map(b => etq(b.centro[0], b.centro[1] + 8, b.nombre, "bar")).join('') + barra(false);
  }
  function construir() {
    const fam = [['prin', 'Principales'], ['infra', 'Infra&shy;estructura'], ['pol', 'Política y culto'], ['mil', 'Militar'], ['prod', 'Producción'], ['viv', 'Viviendas'], ['puer', 'Puerto']];
    return `<div class="vela"></div>` + top() + `<div class="menu"><div class="linea">Elige familia y pieza. Luego toca la ciudad.</div>
      <div class="tira">${PIEZAS.map(p => `<div class="t">${sv(g(p[2]))}<span>${p[0]}<small>${p[1]}</small></span></div>`).join('')}</div>
      <div class="fam">${fam.map(([k, n]) => `<div class="f ${k === 'infra' ? 'on' : ''}"><div class="c">${sv(g(FAM[k], 'stroke-width="1.8"'))}</div><span>${n}</span></div>`).join('')}</div></div>` + barra(true);
  }
  function necesidades() {
    const e = E(), rio = e.barrios.find(b => b.id === 'rio'); rio.revuelta = true; // dureza «Duro»: mal mucho tiempo = revuelta
    let o = top() + `<div class="leyenda"><span><i style="background:var(--ui-bien)"></i>Bien</span><span><i style="background:var(--ui-falta)"></i>Falta algo</span><span><i style="background:var(--ui-mal)"></i>Mal</span></div>`;
    for (const b of e.barrios) {
      const [x, y] = b.centro, r = b.radio, w = 8 * 16 + 7 * 1.5, hl = (rr) => { if (!PROY) return `left:${x - rr}px;top:${y - rr}px;width:${2 * rr}px;height:${2 * rr}px`; const [cx, cy] = PROY(x, y), rx = Math.abs(PROY(x + rr, y)[0] - cx), ry = Math.abs(PROY(x, y + rr)[1] - cy); return `left:${cx - rx}px;top:${cy - ry}px;width:${2 * rx}px;height:${2 * ry}px`; };
      const [ax, ay] = PROY ? PROY(x, y - r) : [x, y - r], lx = Math.max(3, Math.min(387 - w, ax - w / 2)), rev = b.revuelta;
      o += `<div class="halo e-${b.estado}${rev ? ' revuelta' : ''}" style="${hl(r)}"></div>`;
      if (b === rio) o += `<div class="halo sel" style="${hl(r + 5)}"></div>`;
      if (rev) { const [cx, cy] = PROY ? PROY(x, y) : [x, y]; o += `<div class="rev" style="left:${cx}px;top:${cy}px">${sv(PUNO)}Revuelta</div>`; }
      o += `<div class="iconos" style="left:${lx}px;top:${ay - 19}px">${e.NECESIDADES.map(([k]) => icono(k, b.necesidades[k])).join('')}</div>`;
    }
    const falta = listaTxt(rio, 'falta'), mal = listaTxt(rio, 'mal');
    o += `<div class="ficha"><h3>${rio.nombre} · ${rio.clase}</h3><div class="vec">1 200 vecinos</div>
      ${rio.revuelta ? '<div class="revtxt"><b>En revuelta:</b> no paga ni obedece. Cálmala con tropas, grano o juegos.</div>' : ''}<p>${falta ? `<b class="mal">Falta:</b> ${falta}. ` : ''}${mal ? `<b class="mal">Mal:</b> ${mal}.` : ''}<br>Si sigue así 2 estaciones: <b>fiebres y protesta</b>.<br><b>Remedio:</b> fuente y termas.</p>${rio.revuelta ? '<div class="chicos"><button class="btn2">Repartir grano</button><button class="btn2">Dar juegos</button></div>' : ''}
      <button class="btn">Encargar a Infraestructura</button></div>` + barra(false);
    return o;
  }
  window.montarUI = function (op = {}) {
    const modo = op.modo || new URLSearchParams(location.search).get('p') || 'ciudad';
    const host = document.getElementById(op.destino || 'ui');
    PROY = typeof op.proyectar === 'function' ? op.proyectar : null;
    host.innerHTML = ({ ciudad, construir, necesidades }[modo] || ciudad)();
    return modo;
  };
  window.UIComun = { ICONOS, montarUI: window.montarUI };
})();
