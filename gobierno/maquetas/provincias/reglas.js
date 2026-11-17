// GR1 · Provincias · reglas sin pantalla (corre en Node y en navegador). Un año: 225 a.C.
export const ESTACIONES = ['primavera', 'verano', 'otoño'];
export const PRECIOS = [3, 4, 6];
export const CFG = { oroIni: 20, exigirMas: 2, exigirCalma: -25, juegosCalma: 20, calmaSola: 5, minCalma: 30,
  obras: 10, juegos: 6, veneta: 8, cosecha: 8, galos: 7, legionGrano: 4, legionArmas: 4, lista: 3, mal: 1,
  alaAliados: 4, alaGrano: 2, alaFuerza: 2, maxAlas: 2, paso: 2 };
export const OFICIOS = {
  granero: { nombre: 'Granero', prod: 'grano', base: 3, exigir: 'Diezmo' },
  forja: { nombre: 'Forja', prod: 'armas', base: 2, exigir: 'Requisa' },
  puerto: { nombre: 'Puerto', prod: 'carga', base: 2, exigir: 'Portazgo doble' },
  plaza: { nombre: 'Plaza de armas', prod: 'aliados', base: 2, exigir: 'Leva doble' } };
export const CIUDADES = [
  { id: 'capua', nombre: 'Capua', region: 'Campania', ofi: ['granero', 'plaza'], calma: 60, nota: 'Viene construida a mano: 3 campos, 1 herrería, 1 mercado.' },
  { id: 'populonia', nombre: 'Populonia', region: 'Etruria, hierro de Elba', ofi: ['forja', 'puerto'], calma: 70, nota: 'Las minas de Elba le dan hierro.' },
  { id: 'tarento', nombre: 'Tarento', region: 'Magna Grecia', ofi: ['puerto', 'granero'], calma: 45, nota: 'Sometida hace poco: está inquieta.' },
  { id: 'arimino', nombre: 'Arímino', region: 'Frontera gala', ofi: ['plaza', 'granero'], calma: 75, nota: 'Colonia latina frente a los galos.' }];
export const def = id => CIUDADES.find(c => c.id === id);
export const ciudad = (e, id) => e.ciudades.find(c => c.id === id);
const clamp = v => Math.max(0, Math.min(100, v));

export function crear(semilla = 1) {
  return { semilla, est: 0, oro: CFG.oroIni, grano: 0, armas: 0, aliados: 0, carga: 0, veneta: false, sucesoHecho: false, fin: false, hist: [], batalla: null,
    ciudades: CIUDADES.map(c => ({ id: c.id, oficio: null, rango: 1, calma: c.calma, decreto: 'ninguno', obras: false })) };
}
export function darOficio(e, id, of) {
  const c = ciudad(e, id); if (!def(id).ofi.includes(of)) throw new Error('oficio no ofrecido'); if (c.oficio) throw new Error('ya tiene oficio');
  c.oficio = of; c.rango = (id === 'capua' && of === 'granero') ? 2 : 1; return c;
}
export const tienePuerto = e => e.ciudades.some(c => c.oficio === 'puerto');
export const precio = e => PRECIOS[e.est];
export const precioSiguiente = e => e.est < 2 ? PRECIOS[e.est + 1] : null;
export const costeDecreto = (c, d) => d === 'obras' ? (c.obras ? 0 : CFG.obras) : d === 'juegos' ? CFG.juegos : 0;
export const reservado = e => e.ciudades.reduce((s, c) => s + costeDecreto(c, c.decreto), 0);
export const libre = e => e.oro - reservado(e);
export function puedeDecreto(e, id, d) {
  const c = ciudad(e, id);
  if (d === 'obras' && c.obras) return { ok: false, motivo: 'Ya la hiciste' };
  const falta = costeDecreto(c, d) - (libre(e) + costeDecreto(c, c.decreto));
  return falta > 0 ? { ok: false, motivo: 'Te faltan ' + falta + ' oro' } : { ok: true };
}
export function ponerDecreto(e, id, d) { const p = puedeDecreto(e, id, d); if (p.ok) ciudad(e, id).decreto = d; return p; }

function calmaTras(c) { const d = c.decreto; return clamp(c.calma + (d === 'exigir' ? CFG.exigirCalma : d === 'juegos' ? CFG.juegosCalma + CFG.calmaSola : CFG.calmaSola)); }
// Lo que mandará la ciudad esta estación, según su decreto.
export function prevision(e, c) {
  const calma = calmaTras(c), negada = calma < CFG.minCalma, o = OFICIOS[c.oficio], prod = [];
  if (!negada && o) {
    prod.push([o.prod, o.base * c.rango + (c.decreto === 'exigir' ? CFG.exigirMas : 0)]);
    if (c.id === 'capua' && c.oficio === 'plaza') prod.push(['grano', 1]);
  }
  return { calma, negada, prod };
}
export function vender(e) { if (!tienePuerto(e) || !e.carga) return 0; const g = e.carga * precio(e); e.oro += g; e.carga = 0; return g; }
export function ganaVender(e) { return e.carga * precio(e); }
export const COMPRA = { grano: { n: 2, oro: 4 }, armas: { n: 2, oro: 6 } };
export function comprar(e, que) { const k = COMPRA[que]; if (!tienePuerto(e) || libre(e) < k.oro) return false; e.oro -= k.oro; e[que] += k.n; return true; }

export function suceso(e) {
  const puerto = tienePuerto(e);
  if (e.est === 1 && e.ciudades.some(c => c.oficio === 'granero'))
    return { id: 'cosecha', titulo: 'Mala cosecha', texto: 'El granizo arrasa parte del trigo de la región.', opciones: [
      { id: 'comprar', txt: 'Comprar trigo de fuera', coste: CFG.cosecha + ' oro', da: 'No pierdes grano', activa: puerto && libre(e) >= CFG.cosecha, motivo: puerto ? 'No te alcanza el oro' : 'No tienes puerto' },
      { id: 'aguantar', txt: 'Aguantar', coste: 'Pierdes 2 de grano', da: 'No gastas oro', activa: true }] };
  if (e.est === 2)
    return { id: 'venetos', titulo: 'Vénetos y cenomanos ofrecen ayuda', texto: 'Dos pueblos del norte se ofrecen a hostigar a los galos.', opciones: [
      { id: 'pagar', txt: 'Pagar su ayuda', coste: CFG.veneta + ' oro', da: 'Los galos tienen 1 de fuerza menos', activa: libre(e) >= CFG.veneta, motivo: 'No te alcanza el oro' },
      { id: 'rechazar', txt: 'Rechazar', coste: 'No gastas oro', da: 'Los galos vienen enteros', activa: true }] };
  return null;
}
export function resolver(e, op) {
  const s = suceso(e); const o = s && s.opciones.find(x => x.id === op); if (!o || !o.activa) return false;
  if (op === 'comprar') e.oro -= CFG.cosecha; if (op === 'aguantar') e.grano = Math.max(0, e.grano - 2);
  if (op === 'pagar') { e.oro -= CFG.veneta; e.veneta = true; }
  e.sucesoHecho = true; return true;
}
export const listoParaCerrar = e => !suceso(e) || e.sucesoHecho;

export function cerrar(e) {
  if (e.fin) throw new Error('el año ya acabó'); if (!listoParaCerrar(e)) throw new Error('falta resolver el suceso');
  const filas = [], est = e.est;
  for (const c of e.ciudades) {
    const coste = costeDecreto(c, c.decreto); if (coste > e.oro) c.decreto = 'ninguno'; else e.oro -= coste;
    const pv = prevision(e, c); c.calma = pv.calma;
    for (const [k, n] of pv.prod) e[k] += n;
    filas.push({ id: c.id, oficio: c.oficio, decreto: c.decreto, negada: pv.negada, calma: pv.calma, prod: pv.prod });
    if (c.decreto === 'obras') { c.obras = true; c.rango = 2; } c.decreto = 'ninguno';
  }
  e.grano += 1; filas.push({ id: 'roma', negada: false, prod: [['grano', 1]] });
  e.hist.push({ est, filas }); e.sucesoHecho = false;
  if (est === 2) { e.fin = true; e.batalla = batalla(e); } else e.est++;
  return { est, filas };
}
// Reparte el ejército lo mejor posible: legiones listas, mal armadas y alas.
export function ejercito(e) {
  let mejor = null;
  for (let x = 0; x <= 2; x++) for (let y = 0; x + y <= 2; y++) for (let z = 0; z <= CFG.maxAlas; z++) {
    if (e.armas < CFG.legionArmas * x || e.grano < CFG.legionGrano * (x + y) + CFG.alaGrano * z || e.aliados < CFG.alaAliados * z) continue;
    const f = CFG.lista * x + CFG.mal * y + CFG.alaFuerza * z;
    if (!mejor || f > mejor.fuerza) mejor = { listas: x, mal: y, alas: z, fuerza: f };
  }
  return mejor;
}
export function fuerzaGala(e) {
  const paso = ciudad(e, 'arimino').oficio === 'plaza' ? 1 : 0, ven = e.veneta ? 1 : 0;
  return { total: CFG.galos - paso - ven, paso, ven };
}
export function resultado(f, g) {
  if (f >= g + 2) return { id: 'telamon', titulo: 'Victoria en Telamón', texto: 'Los galos quedan cercados y Roma celebra.' };
  if (f >= g) return { id: 'costosa', titulo: 'Victoria costosa', texto: 'Ganas, pero a un precio que se nota.' };
  if (f >= g - 3) return { id: 'derrota', titulo: 'Derrota: los galos saquean Etruria', texto: 'Las legiones ceden y los campos arden.' };
  return { id: 'desastre', titulo: 'Desastre: los galos llegan a tres jornadas de Roma', texto: 'La Urbe tiembla y nadie para al enemigo.' };
}
export function batalla(e) { const ej = ejercito(e), g = fuerzaGala(e); return { ej, gala: g, res: resultado(ej.fuerza, g.total) }; }
export function cuello(e) {
  const b = e.batalla; if (!b) return '';
  if (b.res.id === 'telamon') return 'Repartiste bien: tuviste de todo y los galos no pasaron.';
  for (const h of e.hist) for (const f of h.filas) if (f.negada) return def(f.id).nombre + ' se negó en ' + ESTACIONES[h.est] + ': la exprimiste.';
  const tiene = o => e.ciudades.some(c => c.oficio === o);
  if (!tiene('forja')) return 'Te faltaron armas: nadie forjaba.';
  if (b.ej.listas < 2) return 'Te faltaron armas: una forja sola no basta.';
  if (!tiene('plaza')) return 'Te faltaron aliados: ninguna plaza de armas.';
  return 'Te faltó fuerza: los galos eran demasiados.';
}
export const HISTORIA = 'Roma movilizó a sus aliados itálicos y venció en Telamón, el año 225 a.C. (Polibio 2.23–31).';
export function sumaAnio(e) { return e.hist.map(h => h.filas); }
