// GR1 · Provincias · pantalla. Una sola cosa por pantalla y un solo botón rojo.
import * as R from './reglas.js';
const $ = s => document.querySelector(s);
let e = R.crear(+new URLSearchParams(location.search).get('semilla') || 1);
const ui = { pant: 'portada', idx: 0, sel: null, ciu: null, parte: null };
const P = (d, w = 1.7) => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ICO = {
  grano: P('<path d="M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zM12 8c2-1 3-3 3-5-2 0-3 2-3 5zM12 14c-2-1-4-1-5-3 2-1 4 0 5 3zM12 14c2-1 4-1 5-3-2-1-4 0-5 3z"/>'),
  forja: P('<path d="M3 8h14c0 3-2 4-5 4v3h3v3H8v-3h3v-3C7 12 3 11 3 8zM17 8h4c0 2-2 3-4 3"/>'),
  puerto: P('<circle cx="12" cy="5" r="2"/><path d="M12 7v13M8 10h8M5 14a7 7 0 0 0 14 0"/>'),
  plaza: P('<path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6zM12 7v10M8.5 11h7"/>'),
  oro: P('<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9.5c1-1 5-1 6 0M9 14.5c1 1 5 1 6 0"/>'),
  armas: P('<path d="M5 19l10-10M14 4h6v6M15 9l5-5M4 16l4 4M3 21l2-2"/>'),
  aliados: P('<path d="M5 14a7 7 0 0 1 14 0v4H5zM12 7V4M9 18v-4M15 18v-4"/>'),
  carga: P('<path d="M4 9l8-4 8 4v9H4zM4 9l8 4 8-4M12 13v5"/>'),
  roma: P('<path d="M3 10h18l-9-6zM6 10v9M10 10v9M14 10v9M18 10v9M3 20h18"/>'),
  sube: P('<path d="M4 16l6-6 4 4 6-7M15 7h5v5"/>'), baja: P('<path d="M4 8l6 6 4-4 6 7M15 17h5v-5"/>'), igual: P('<path d="M4 12h16"/>') };
const OF = { granero: 'grano', forja: 'forja', puerto: 'puerto', plaza: 'plaza' };
const NOM = { grano: 'grano', armas: 'armas', carga: 'carga', aliados: 'aliados' };
const est = () => R.ESTACIONES[Math.min(e.est, 2)];
const Cap = s => s[0].toUpperCase() + s.slice(1);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const prodTxt = l => l.length ? l.map(([k, n]) => n + ' de ' + NOM[k]).join(' y ') : 'nada';
const legiones = v => { const h = Math.floor(v / 2); return ['ninguna legión', 'media legión', '1 legión', '1 legión y media', '2 legiones'][Math.min(h, 4)]; };
const bar = (v, max, c = '') => '<div class="bar ' + c + '"><i style="width:' + Math.round(100 * Math.min(1, v / max)) + '%"></i></div>';
const rojo = (txt, a, x = '', dis = false) => '<button id="principal" class="rojo" data-a="' + a + '" data-x="' + x + '"' + (dis ? ' disabled' : '') + '>' + esc(txt) + '</button>';
const sec = (txt, a, x = '', dis = false) => '<button class="sec" data-a="' + a + '" data-x="' + x + '"' + (dis ? ' disabled' : '') + '>' + esc(txt) + '</button>';
const OFDATA = {
  granero: { da: 'Da de comer a las legiones y a los aliados.' },
  forja: { da: 'Sin forja, las legiones van mal armadas.' },
  puerto: { da: 'Sin puerto no hay partida que vender ni compra fuera.' },
  plaza: { da: 'Sin plaza de armas no hay alas de aliados ni caballería.' } };
function anual(id, of) {
  const o = R.OFICIOS[of], rango = id === 'capua' && of === 'granero' ? 2 : 1, v = o.base * rango * 3;
  if (of === 'granero') return v + ' de grano al año: da de comer a ' + legiones(v);
  if (of === 'forja') return v + ' de armas al año: arma ' + legiones(v);
  if (of === 'puerto') return v + ' de carga al año: unos ' + (v * 4) + ' oro si la vendes bien';
  return v + ' de aliados al año: ' + (v >= 4 ? '1 ala de aliados' : 'ni un ala entera');
}
function cab(t) { return '<span class="t ins">' + t + '</span><span class="oro">' + ICO.oro + '<span>' + e.oro + ' oro</span></span>'; }

function portada() {
  return { cab: '<span class="t ins">Aqvila · Provincias</span>', cuerpo: '<div class="portada" style="display:flex;flex-direction:column">' + ICO.roma.replace('width="24" height="24"', 'width="56" height="56"') +
    '<div class="suave ins">Año 225 a.C.</div><h1 class="ins">Los galos bajan en otoño</h1><p>Tienes tres estaciones para preparar la región.</p>' +
    '<p class="suave">Gobiernas cuatro ciudades. No construyes nada: a cada una le das un oficio y, cada estación, un decreto.</p></div>', pie: rojo('Empezar', 'empezar') };
}
function reparto() {
  const d = R.CIUDADES[ui.idx], capua = d.id === 'capua';
  const tarj = d.ofi.map(of => {
    const o = R.OFICIOS[of]; let extra = '';
    if (capua && of === 'granero') extra = '<div class="linea dato">Tus 3 campos cuentan: empieza en rango II.</div>';
    if (capua && of === 'plaza') extra = '<div class="linea dato">Empieza en rango I, pero tus 3 campos siguen dando 1 de grano por estación.</div>';
    if (d.id === 'arimino' && of === 'plaza') extra = '<div class="linea dato">Corta el paso: los galos tienen 1 de fuerza menos.</div>';
    return '<button class="marco tarj' + (ui.sel === of ? ' sel' : '') + '" data-a="oficio" data-x="' + of + '"><div class="cab">' + ICO[OF[of]] + '<span class="nom">' + o.nombre + '</span></div>' +
      '<div class="linea">' + anual(d.id, of) + '.</div><div class="linea suave">' + OFDATA[of].da + '</div>' + extra + '</button>';
  }).join('');
  const ult = ui.idx === 3;
  return { cab: cab('Reparto · ' + (ui.idx + 1) + ' de 4'), cuerpo: '<div><h1 class="ins">' + d.nombre + '</h1><div class="suave">' + d.region + '. Calma ' + d.calma + '. ' + d.nota + '</div></div>' +
    '<div class="suave">Elige su oficio. Es para todo el año.</div>' + tarj + (ui.idx === 0 ? '<div class="suave">' + ICO.roma.replace('width="24" height="24"', 'width="18" height="18"') + 'La Urbe: la construyes a mano (aquí no). Pone 2 legiones y 1 de grano por estación.</div>' : ''),
    pie: rojo(ui.sel ? (ult ? 'Dar el oficio y empezar el año' : 'Dar el oficio a ' + d.nombre) : 'Elige un oficio', 'dar', '', !ui.sel) };
}
function region() {
  const cc = e.ciudades, alas = Math.min(R.CFG.maxAlas, Math.floor(e.aliados / R.CFG.alaAliados));
  const cont = (ico, txt, sub, v, max, num, c = '') => '<div class="cont">' + ICO[ico] + '<span>' + txt + '</span><span class="num">' + num + '</span><span class="sub">' + sub + '</span>' + bar(v, max, c) + '</div>';
  const lleno = '<div class="marco pad" style="display:grid;gap:12px"><h2 class="ins">Para el otoño</h2>' +
    cont('grano', 'Comida de las legiones', (e.grano < 2 ? 'Aún no da de comer a ninguna legión' : 'Da de comer a ' + legiones(e.grano)), e.grano, 8, Math.min(e.grano, 99) + '/8') +
    cont('armas', 'Armas de las legiones', (e.armas < 2 ? 'Aún no arma ni media legión' : 'Arma ' + legiones(e.armas)), e.armas, 8, e.armas + '/8') +
    cont('aliados', 'Alas de aliados', alas + ' de 2 alas (4 aliados y 2 de grano cada una)', e.aliados, 8, e.aliados + '/8') + '</div>';
  const roma = '<div class="suave fila" style="gap:8px">' + ICO.roma.replace('width="24" height="24"', 'width="18" height="18"') + '<span>La Urbe pone 2 legiones y 1 de grano por estación.</span></div>';
  const ciu = cc.map(c => {
    const d = R.def(c.id), pv = R.prevision(e, c), o = R.OFICIOS[c.oficio], dn = decNombre(c);
    return '<button class="marco tarj ciu" data-a="ciudad" data-x="' + c.id + '"><div class="t2"><span class="cab" style="display:flex;gap:10px;align-items:center;color:var(--oro)">' + ICO[OF[c.oficio]] + '<span class="nom">' + d.nombre + '</span></span><span class="rango">' + o.nombre + ' · rango ' + (c.rango === 2 ? 'II' : 'I') + '</span></div>' +
      '<div class="calma"><span>Calma ' + c.calma + '</span>' + bar(c.calma, 100, c.calma < R.CFG.minCalma ? 'mal' : '') + '</div>' +
      '<div class="manda ' + (pv.negada ? 'alerta' : 'dato') + '">' + (pv.negada ? 'Se negará esta estación: no manda nada' : 'Esta estación manda ' + prodTxt(pv.prod)) + '</div>' +
      '<div class="dec">Decreto: <b>' + dn + '</b></div></button>';
  }).join('');
  const part = R.tienePuerto(e) ? '<button class="marco tarj" data-a="partida"><div class="cab">' + ICO.carga + '<span class="nom">La partida</span></div><div class="linea">Tienes ' + e.carga + ' de carga. Precio de hoy: ' + R.precio(e) + ' oro cada una.</div></button>' : '';
  return { cab: cab(est() + ' · 225 a.C.'), cuerpo: lleno + roma + ciu + part, pie: rojo('Cerrar la ' + est(), 'cerrar') };
}
function decNombre(c) { return { ninguno: 'Sin decreto', exigir: R.OFICIOS[c.oficio].exigir, obras: 'Obras públicas', juegos: 'Juegos y ofrendas' }[c.decreto]; }
function ciudadPant() {
  const c = R.ciudad(e, ui.ciu), d = R.def(c.id), o = R.OFICIOS[c.oficio], base = o.base * c.rango;
  const ops = [
    ['ninguno', 'Sin decreto', 'No cuesta nada. La calma sube 5 por sí sola.'],
    ['exigir', o.exigir, 'Da ' + R.CFG.exigirMas + ' más de ' + NOM[o.prod] + ' (' + (base + R.CFG.exigirMas) + ' en total). La calma baja 25.'],
    ['obras', 'Obras públicas', c.obras ? 'Ya hechas: es rango II.' : 'Cuesta ' + R.CFG.obras + ' oro, una sola vez. Desde la estación siguiente es rango II: ' + base * 2 + ' de ' + NOM[o.prod] + '.'],
    ['juegos', 'Juegos y ofrendas', 'Cuesta ' + R.CFG.juegos + ' oro. La calma sube 25.']];
  const tarj = ops.map(([id, n, t]) => {
    const p = R.puedeDecreto(e, c.id, id), prev = R.prevision(e, { ...c, decreto: id }), sel = c.decreto === id;
    const av = id === 'exigir' || id === 'juegos' || id === 'ninguno' ? (prev.negada ? '<div class="motivo">Con esto la calma queda en ' + prev.calma + ': se negaría y no mandaría nada.</div>' : '<div class="suave" style="margin-top:6px">La calma quedaría en ' + prev.calma + '.</div>') : '';
    return '<button class="marco tarj' + (sel ? ' sel' : '') + '" data-a="decreto" data-x="' + id + '"' + (p.ok ? '' : ' disabled') + '><div class="cab"><span class="nom">' + n + '</span></div><div class="linea">' + t + '</div>' + (p.ok ? av : '<div class="motivo">' + p.motivo + '</div>') + '</button>';
  }).join('');
  return { cab: cab(d.nombre + ' · ' + est()), cuerpo: '<div><h1 class="ins">' + d.nombre + '</h1><div class="suave">' + o.nombre + ' · rango ' + (c.rango === 2 ? 'II' : 'I') + ' · calma ' + c.calma + '</div></div><div class="suave">Un decreto por estación. Elige cuál.</div>' + tarj, pie: rojo('Volver a la región', 'volver') };
}
function partida() {
  const sig = R.precioSiguiente(e), p = R.precio(e), gana = R.ganaVender(e), fl = sig === null ? '' : sig > p ? 'sube' : sig < p ? 'baja' : 'igual';
  const comp = ['grano', 'armas'].map(q => { const k = R.COMPRA[q]; return '<button class="sec" data-a="comprar" data-x="' + q + '"' + (R.libre(e) < k.oro ? ' disabled' : '') + '>Comprar ' + k.n + ' de ' + q + ' (' + k.oro + ' oro)</button>'; }).join('');
  return { cab: cab('La partida · ' + est()), cuerpo: '<h1 class="ins">La partida</h1><div class="marco pad" style="display:grid;gap:10px"><div class="fila">' + ICO.carga + '<span>Carga guardada</span><span class="gran" style="margin-left:auto;font-size:26px">' + e.carga + '</span></div>' + bar(e.carga, 8, 'oro') +
    '<div class="fila"><span>Hoy se paga</span><span class="gran" style="margin-left:auto;font-size:26px">' + p + ' oro</span></div>' + (sig === null ? '<div class="suave">Es la última estación: lo que no vendas se pierde.</div>' : '<div class="flecha">' + ICO[fl] + 'En ' + R.ESTACIONES[e.est + 1] + ' pagarán ' + sig + ' oro: la guerra sube el precio.</div>') + '</div>' +
    sec(e.carga ? 'Vender ahora (+' + gana + ' oro)' : 'Vender ahora (no tienes carga)', 'vender', '', !e.carga) + '<h2 class="ins">Comprar fuera</h2><div class="suave">Grano a 2 oro y armas a 3 oro la unidad.</div>' + comp,
    pie: rojo(sig === null ? 'Volver a la región' : 'Guardar para ' + R.ESTACIONES[e.est + 1], 'volver') };
}
function sucesoPant() {
  const s = R.suceso(e);
  return { cab: cab(est() + ' · suceso'), cuerpo: '<h1 class="ins">' + s.titulo + '</h1><p>' + s.texto + '</p><div class="suave">Toca una opción. Se cierra la estación.</div>' + s.opciones.map(o =>
    '<button class="marco tarj" data-a="suceso" data-x="' + o.id + '"' + (o.activa ? '' : ' disabled') + '><div class="cab"><span class="nom">' + o.txt + '</span></div><div class="linea coste">Cuesta: ' + o.coste + '</div><div class="linea dato">' + o.da + '</div>' + (o.activa ? '' : '<div class="motivo">' + o.motivo + '</div>') + '</button>').join(''), pie: '<div class="suave" style="text-align:center">Elige una opción para seguir.</div>' };
}
function partePant() {
  const p = ui.parte, f = p.filas, sig = p.est === 2 ? 'Ver la batalla' : 'Pasar al ' + R.ESTACIONES[p.est + 1];
  const filas = f.map(x => {
    const n = x.id === 'roma' ? 'La Urbe' : R.def(x.id).nombre, ic = x.id === 'roma' ? ICO.roma : ICO[OF[x.oficio]];
    return '<div class="marco pad fila">' + ic + '<div style="flex:1"><b>' + n + '</b><div class="' + (x.negada ? 'alerta' : 'dato') + '">' + (x.negada ? 'Se negó: la calma es ' + x.calma + ' y no mandó nada' : 'Mandó ' + prodTxt(x.prod)) + '</div></div></div>';
  }).join('');
  return { cab: cab('Parte · fin de ' + R.ESTACIONES[p.est]), cuerpo: '<h1 class="ins">Qué mandó cada ciudad</h1>' + filas, pie: rojo(sig, 'seguir') };
}
function batallaPant() {
  const b = e.batalla, j = b.ej, g = b.gala, lin = [];
  if (j.listas) lin.push(j.listas + (j.listas > 1 ? ' legiones listas' : ' legión lista') + ' x3 = ' + j.listas * 3);
  if (j.mal) lin.push(j.mal + (j.mal > 1 ? ' legiones mal armadas' : ' legión mal armada') + ' x1 = ' + j.mal);
  if (j.alas) lin.push(j.alas + (j.alas > 1 ? ' alas de aliados' : ' ala de aliados') + ' x2 = ' + j.alas * 2);
  if (!lin.length) lin.push('Nadie marcha: no hubo comida');
  const gl = ['Galos: ' + R.CFG.galos]; if (g.paso) gl.push('Arímino corta el paso: -1'); if (g.ven) gl.push('Ayuda véneta: -1');
  const mal = b.res.id === 'derrota' || b.res.id === 'desastre';
  return { cab: cab('Telamón · otoño'), cuerpo: '<div class="cuenta"><div class="marco pad"><span class="suave">Tu fuerza</span><span class="gran">' + j.fuerza + '</span></div><div class="marco pad"><span class="suave">Los galos</span><span class="gran">' + g.total + '</span></div></div>' +
    '<div class="cols"><div class="suave">' + lin.join('<br>') + '</div><div class="suave">' + gl.join('<br>') + '</div></div><h1 class="res' + (mal ? ' mal' : '') + '">' + b.res.titulo + '</h1><p>' + b.res.texto + '</p>', pie: rojo('Ver las cuentas del invierno', 'cuentas') };
}
function cuentasPant() {
  const b = e.batalla, ids = ['capua', 'populonia', 'tarento', 'arimino', 'roma'];
  const cel = (h, id) => { const f = h.filas.find(x => x.id === id); return f.negada ? '<td class="n">Se negó</td>' : '<td>' + f.prod.map(([k, n]) => n + ' ' + NOM[k]).join(' y ') + '</td>'; };
  const tabla = '<table><tr><th>Ciudad</th>' + R.ESTACIONES.map(s => '<th>' + Cap(s) + '</th>').join('') + '</tr>' + ids.map(id => '<tr><td><b>' + (id === 'roma' ? 'La Urbe' : R.def(id).nombre) + '</b></td>' + e.hist.map(h => cel(h, id)).join('') + '</tr>').join('') + '</table>';
  const mal = b.res.id === 'derrota' || b.res.id === 'desastre';
  return { cab: cab('Invierno · cuentas'), cuerpo: '<h1 class="res' + (mal ? ' mal' : '') + '">' + b.res.titulo + '</h1><p>Tu fuerza ' + b.ej.fuerza + ' contra ' + b.gala.total + '.</p>' + '<div class="marco pad"><p><b>' + R.cuello(e) + '</b></p></div>' +
    tabla + '<h2 class="ins">Lo que pasó de verdad</h2><p class="hist">' + R.HISTORIA + '</p>', pie: rojo('Probar otro reparto', 'otra') };
}
const VISTAS = { portada, reparto, region, ciudad: ciudadPant, partida, suceso: sucesoPant, parte: partePant, batalla: batallaPant, cuentas: cuentasPant };
function pinta() {
  const v = VISTAS[ui.pant](); $('#cab').innerHTML = v.cab; $('#cuerpo').innerHTML = v.cuerpo; $('#pie').innerHTML = v.pie; $('#cuerpo').scrollTop = 0;
}
function cerrarEstacion() { ui.parte = R.cerrar(e); ui.pant = 'parte'; }
const ACC = {
  empezar() { ui.pant = 'reparto'; ui.idx = 0; ui.sel = null; },
  oficio(x) { ui.sel = x; },
  dar() { R.darOficio(e, R.CIUDADES[ui.idx].id, ui.sel); ui.sel = null; if (++ui.idx > 3) ui.pant = 'region'; },
  ciudad(x) { ui.ciu = x; ui.pant = 'ciudad'; },
  decreto(x) { R.ponerDecreto(e, ui.ciu, x); },
  volver() { ui.pant = 'region'; },
  partida() { ui.pant = 'partida'; },
  vender() { R.vender(e); },
  comprar(x) { R.comprar(e, x); },
  cerrar() { if (R.listoParaCerrar(e)) cerrarEstacion(); else ui.pant = 'suceso'; },
  suceso(x) { if (R.resolver(e, x)) cerrarEstacion(); },
  seguir() { ui.pant = e.fin ? 'batalla' : 'region'; },
  cuentas() { ui.pant = 'cuentas'; },
  otra() { e = R.crear(e.semilla); ui.pant = 'reparto'; ui.idx = 0; ui.sel = null; }
};
document.addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; ACC[b.dataset.a](b.dataset.x); pinta(); });
window.__gr1 = { estado: () => JSON.parse(JSON.stringify(e)), pantalla: () => ui.pant, lista: true };
pinta();
