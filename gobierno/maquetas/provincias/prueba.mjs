// GR1 · prueba de equilibrio. Acaba con APTO o código 1.
import * as R from './reglas.js';
let fallos = 0; const ok = (c, t) => { console.log((c ? '  bien: ' : '  MAL:  ') + t); if (!c) fallos++; };
const IDS = R.CIUDADES.map(c => c.id);
const reparto = ofi => ofi;
const BAL = ['granero', 'forja', 'puerto', 'plaza'], GRA = ['granero', 'puerto', 'granero', 'granero'];
function fuerzaTras(e) { const c = structuredClone(e); const s = R.suceso(c); if (s) R.resolver(c, s.id === 'venetos' ? 'rechazar' : 'aguantar'); R.cerrar(c); return c.batalla.ej.fuerza; }
// op: obras (ids en primavera), exigir (ids, todas las estaciones), mercado (vende y compra en otoño), veneta
function jugar(ofi, op = {}) {
  const e = R.crear(1); IDS.forEach((id, i) => R.darOficio(e, id, ofi[i]));
  for (let s = 0; s < 3; s++) {
    for (const id of IDS) { if (s === 0 && (op.obras || []).includes(id)) R.ponerDecreto(e, id, 'obras'); if ((op.exigir || []).includes(id)) R.ponerDecreto(e, id, 'exigir'); }
    if (s === 2 && op.mercado) { R.vender(e); for (let k = 0; k < 10; k++) { const f0 = fuerzaTras(e); let m = null; for (const q of ['armas', 'grano']) { const t = structuredClone(e); if (R.comprar(t, q) && fuerzaTras(t) > f0) { m = q; break; } } if (!m) break; R.comprar(e, m); } }
    const su = R.suceso(e); if (su) { let o = su.id === 'venetos' ? (op.veneta && su.opciones[0].activa ? 'pagar' : 'rechazar') : 'aguantar'; R.resolver(e, o); }
    R.cerrar(e);
  }
  return e;
}
const sub = (a, n) => a.filter((_, i) => n & (1 << i));
const nom = e => e.batalla.res.id + ' (' + e.batalla.ej.fuerza + ' contra ' + e.batalla.gala.total + ')';
const rk = { desastre: 0, derrota: 1, costosa: 2, telamon: 3 };
console.log('Equilibrio');
const a = jugar(GRA), b = jugar(BAL); console.log('  (a) ' + nom(a) + '  (b) ' + nom(b));
ok(['derrota', 'desastre'].includes(a.batalla.res.id), '(a) granero donde se puede (Populonia, puerto): Derrota o Desastre');
ok(b.batalla.res.id === 'costosa', '(b) reparto equilibrado sin decretos: Victoria costosa');
let mejor = null, mejorOp;
for (let n = 0; n < 16; n++) for (const ve of [false, true]) { const op = { obras: sub(IDS, n), mercado: true, veneta: ve }; const e = jugar(BAL, op); if (!mejor || e.batalla.ej.fuerza - e.batalla.gala.total > mejor.batalla.ej.fuerza - mejor.batalla.gala.total) { mejor = e; mejorOp = op; } }
console.log('  (c) ' + nom(mejor) + ' con obras en ' + mejorOp.obras.join(',') + ' veneta ' + mejorOp.veneta);
ok(mejor.batalla.res.id === 'telamon', '(c) el mejor juego: Victoria en Telamón');
const d = jugar(BAL, { exigir: IDS }); console.log('  (d) ' + nom(d));
ok(d.hist.some(h => h.filas.some(f => f.negada)), '(d) «Exigir más» en todas: alguna ciudad se niega');
ok(rk[d.batalla.res.id] < rk[b.batalla.res.id] || d.batalla.ej.fuerza < b.batalla.ej.fuerza, '(d) sale peor que (b)');
const vistos = new Set(); for (let n = 0; n < 16; n++) vistos.add(jugar(IDS.map((id, i) => R.def(id).ofi[(n >> i) & 1])).batalla.res.id);
console.log('  (e) resultados distintos en los 16 repartos: ' + [...vistos].join(', '));
ok(vistos.size >= 3, '(e) los 16 repartos dan al menos 3 resultados');
// (f) partidas al azar: nada baja de 0 ni da NaN
let malos = 0, r = 12345; const az = () => (r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let k = 0; k < 400; k++) {
  const e = R.crear(k); IDS.forEach(id => R.darOficio(e, id, R.def(id).ofi[az() < .5 ? 0 : 1]));
  for (let s = 0; s < 3; s++) {
    for (const id of IDS) R.ponerDecreto(e, id, ['ninguno', 'exigir', 'obras', 'juegos'][Math.floor(az() * 4)]);
    if (az() < .5) R.vender(e); if (az() < .5) R.comprar(e, az() < .5 ? 'grano' : 'armas');
    const su = R.suceso(e); if (su) R.resolver(e, su.opciones[az() < .5 ? 0 : 1].id); if (R.listoParaCerrar(e)) R.cerrar(e); else { R.resolver(e, su.opciones[1].id); R.cerrar(e); }
  }
  for (const v of [e.oro, e.grano, e.armas, e.aliados, e.carga, ...e.ciudades.map(c => c.calma), e.batalla.ej.fuerza]) if (!Number.isInteger(v) || v < 0) malos++;
  for (const c of e.ciudades) if (c.calma > 100) malos++;
}
ok(malos === 0, '(f) 400 partidas al azar: nada baja de 0, nada es NaN (' + malos + ' fallos)');
const c = R.crear(1); R.darOficio(c, 'capua', 'granero'); const p = R.crear(1); R.darOficio(p, 'capua', 'plaza');
ok(c.ciudades[0].rango === 2 && p.ciudades[0].rango === 1, '(g) Capua granero nace en rango II; como plaza, en rango I');
const q = R.crear(1); R.darOficio(q, 'capua', 'plaza'); IDS.slice(1).forEach(id => R.darOficio(q, id, R.def(id).ofi[1])); R.cerrar(q);
ok(q.grano >= 1 + 1 + 3 + 3, 'los campos de Capua dan 1 grano aunque sea plaza de armas (grano ' + q.grano + ')');
const s0 = R.crear(1); IDS.forEach(id => R.darOficio(s0, id, R.def(id).ofi[0])); s0.est = 1; s0.ciudades.forEach(x => x.oficio = x.oficio === 'granero' ? 'forja' : x.oficio);
ok(R.suceso(s0) === null, 'sin granero no hay mala cosecha');
const s1 = R.crear(1); ['granero', 'forja', 'granero', 'plaza'].forEach((o, i) => R.darOficio(s1, IDS[i], o)); s1.est = 1;
const so = R.suceso(s1); ok(so && !so.opciones[0].activa && so.opciones[0].motivo === 'No tienes puerto', 'mala cosecha sin puerto: comprar trigo apagado con su motivo');
console.log(fallos ? 'NO APTO · ' + fallos + ' fallos' : 'APTO'); process.exit(fallos ? 1 : 0);
