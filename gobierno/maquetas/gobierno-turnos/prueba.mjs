// EV7 · prueba de las reglas en Node: tres robots × 200 semillas. Uso: node gobierno/maquetas/gobierno-turnos/prueba.mjs
// Robots: nada (deja pasar), primera (vota la primera ley sin tratos), azar, sensato (juega como una persona sin calcular), cabeza.
// Falla si: «nada» o «primera» gana más del 10 %, «azar» más del 15 %, «sensato» fuera de 35-55 %, «cabeza» menos del 70 %,
// una partida se cuelga o da NaN, o acaba antes de 10 estaciones sin haber perdido. Comprueba también las promesas, los tratos inútiles,
// las leyes que no llegan, la horquilla del golpe y el informe de lo nuevo.
import * as R from './reglas.js';
const N = 200, fallos = [];
if (process.env.AJUSTE) Object.assign(R.K, JSON.parse(process.env.AJUSTE)); // AJUSTE='{"base":0.5}': probar cifras sin tocar reglas.js
const mal = t => { fallos.push(t); console.log('  MAL: ' + t); };

/* robot «nada»: no vota nunca; deja pasar cada estación */
function nada(e) { R.dejarPasar(e); }
/* robot «primera»: vota siempre la primera ley, sin tratos ni pensar */
function primera(e) { R.elegir(e, 0); R.votar(e); }

/* robot «azar»: ley al azar, tratos al azar, a veces deja pasar */
function azar(e, r) {
  if (r() < 0.1) return R.dejarPasar(e);
  R.elegir(e, Math.floor(r() * e.cartas.length));
  for (const b of R.BS) { const x = r(); R.trato(e, b, x < 0.2 ? 'oro' : x < 0.3 ? 'promesa' : null); }
  R.votar(e);
}

/* robot «sensato»: lo que haría una persona mirando la pantalla, sin cuentas. Pasa de edad en cuanto puede; si no, vota la ley que
   más ayuda a lo que más falta (grano si escasea, plebe si se hunde, fuerza si va por detrás del golpe, si no la edad); ofrece trato
   solo a los bandos con dudosos (oro si sobra, si no promesa); con mucho oro y por detrás del golpe, paga una leva. */
function ayuda(e, ley, que) {
  const t = ley.tipo, o = ley.obj;
  if (que === 'grano') return t === 'ampliar' && o === 'granja';
  if (que === 'plebe') return t === 'juegos' || t === 'granoBarato';
  if (que === 'fuerza') return t === 'reclutar' || (t === 'ampliar' && o === 'muralla') || (t === 'estudiar' && R.SABERES[o].rama === 'guerra') || (t === 'estudiar' && o === 'corvus');
  if (que === 'oro') return t === 'impuestos' || (t === 'ampliar' && o === 'mercado');
  if (que === 'edad') { // mira también la cola de mando, como haría quien lee la pestaña «Mando»
    const E = R.EDADES[e.edad + 1], cola = (tp, ob) => e.ordenes.filter(x => x.ley.tipo === tp && (ob == null || x.ley.obj === ob)).length;
    return !!E && ((t === 'ampliar' && E.edif[o] > e.edif[o] + cola('ampliar', o)) || (t === 'estudiar' && E.saberes > e.saberes.length + cola('estudiar')));
  }
  return false;
}
function sensato(e) {
  const g = R.golpe(e);
  if (g.falta > 0 && e.oro > 140 && R.puedeLeva(e).ok) R.levaPagada(e);
  let i = e.cartas.findIndex(c => c.tipo === 'edad');
  if (i < 0) {
    const faltas = [];
    if (e.grano < 30) faltas.push('grano');
    if (e.plebe < 35) faltas.push('plebe');
    if (e.oro < 30) faltas.push('oro');
    // lo que más falta, en proporción: fuerza que falta / golpe esperado frente a requisitos de edad que faltan / requisitos
    const E = R.EDADES[e.edad + 1], tot = E ? E.saberes + Object.values(E.edif).reduce((a, b) => a + b, 0) : 1;
    const hecho = E ? Math.min(e.saberes.length, E.saberes) + Object.keys(E.edif).reduce((a, k) => a + Math.min(e.edif[k], E.edif[k]), 0) : tot;
    const dF = g.falta / Math.max(1, g.esperado), dE = e.edad < 2 ? 1 - hecho / tot : 0;
    (dF >= dE ? ['fuerza', 'edad'] : ['edad', 'fuerza']).forEach(q => { if (q === 'fuerza' ? dF > 0 : dE > 0) faltas.push(q); });
    for (const q of faltas) { i = e.cartas.findIndex(c => !c.noLlega && ayuda(e, c, q)); if (i >= 0) break; }
    if (i < 0) i = e.cartas.findIndex(c => !c.noLlega);
    if (i < 0) return R.dejarPasar(e);
  }
  R.elegir(e, i);
  const pv = R.prevision(e);
  for (const b of R.BS) if (pv.bandos[b].dudosos > 0 && !R.trato(e, b, e.oro > 80 ? 'oro' : 'promesa')) R.trato(e, b, 'oro');
  R.votar(e);
}

/* robot «cabeza»: mira qué falta para el triunfo y compra los votos justos */
function valor(e, ley) {
  const falta = R.amenazaFinal(e) - R.fuerza(e) - e.ordenes.filter(o => o.ley.tipo === 'reclutar').length * R.fuerzaLegion(e), quedan = R.K.turnos - e.turno;
  const cola = (t, o) => e.ordenes.filter(x => x.ley.tipo === t && (o == null || x.ley.obj === o)).length;
  switch (ley.tipo) {
    case 'edad': return ley.obj === 2 ? 100 : 30;
    case 'reclutar': return falta > 0 ? 40 + falta / 2 - (e.oro < 40 ? 15 : 0) - (e.grano < 30 ? 25 : 0) : 5;
    case 'ampliar': {
      if (e.edad < 2 && R.EDADES[2].edif[ley.obj] > e.edif[ley.obj] + cola('ampliar', ley.obj)) return 60;
      if (ley.obj === 'muralla') return falta > 0 ? 35 : 5;
      if (ley.obj === 'mercado') return 30;
      if (ley.obj === 'granja') return e.grano < 60 ? 45 : 12;
      if (ley.obj === 'templo') return e.plebe < 45 ? 28 : 12;
      if (ley.obj === 'muelle') return 25;
      return quedan > 6 ? 18 : 6;
    }
    case 'estudiar': {
      const s = R.SABERES[ley.obj];
      if (e.edad < 2 && e.saberes.length + cola('estudiar') < 2) return 55 + (s.rama === 'mar' ? 5 : 0);
      if (ley.obj === 'corvus') return falta > 0 ? 50 : 15;
      if (ley.obj === 'castra' || ley.obj === 'pilum') return falta > 0 ? 30 + e.legiones * 2 : 10;
      return 15;
    }
    case 'impuestos': return e.oro < 60 ? 50 : e.oro < 120 ? 22 : 2;
    case 'granoBarato': return e.plebe < 40 ? 54 - e.plebe / 4 : e.plebe < 50 ? 15 : 1;
    case 'juegos': return e.favor < 25 ? 70 : e.plebe < 40 ? 55 - e.plebe / 4 : e.plebe < 50 ? 14 : (e.favor < 35 ? 30 : 1);
  }
  return 0;
}
function cabeza(e) {
  if (R.golpe(e).falta > 0 && e.oro > 110 && R.puedeLeva(e).ok) R.levaPagada(e);
  if (e.plebe < 22) { const i = e.cartas.findIndex(c => c.tipo === 'juegos' || c.tipo === 'granoBarato'); if (i >= 0) return comprarYVotar(e, i); }
  let mejor = 0, mv = -1;
  e.cartas.forEach((c, i) => { let v = valor(e, c); const g = R.gustoLey(c); e.promesas.forEach(p => { if (g[p.bando] > 0.15 && p.vence - e.turno <= 1) v += 25; else if (g[p.bando] > 0.15) v += 8; }); const p = R.prevision(e, i); if (p.veto) v = -1; if (v > mv) { mv = v; mejor = i; } });
  comprarYVotar(e, mejor);
}
function comprarYVotar(e, i) {
  R.elegir(e, i);
  const ley = e.cartas[i], g = R.gustoLey(ley);
  // bandos por los que más se gana: los que dudan, del que más escaños tiene
  const orden = R.BS.slice().sort((a, b) => { const pa = R.prevision(e, i).bandos[a], pb = R.prevision(e, i).bandos[b]; return (pb.dudosos + pb.contra) - (pa.dudosos + pa.contra); });
  for (const b of orden) {
    if (R.prevision(e).esperado >= 21) break;
    if (R.prevision(e).bandos[b].seguros === e.escanos[b]) continue;
    if (g[b] > 0.15 && !e.promesas.some(p => p.bando === b)) { R.trato(e, b, 'promesa'); continue; }
    if (e.oro - R.costeTrato(e, b) > 50) R.trato(e, b, 'oro');
    else if (!e.promesas.some(p => p.bando === b) && e.favor > 35) R.trato(e, b, 'promesa');
  }
  R.votar(e);
}

function semRnd(s) { let a = s * 7919 + 13; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function jugar(robot, semilla) {
  let e = R.crear(semilla); const r = semRnd(semilla);
  for (let paso = 0; paso < 40 && e.fase !== 'fin'; paso++) {
    robot(e, r); R.terminar(e);
    e = JSON.parse(JSON.stringify(e)); // el estado sobrevive a guardarse
    for (const k of ['oro', 'grano', 'plebe', 'favor', 'legiones', 'amenaza']) if (!Number.isFinite(e[k])) { mal(`semilla ${semilla}: ${k} es NaN`); return { colgada: true, e }; }
  }
  if (e.fase !== 'fin') { mal(`semilla ${semilla}: la partida no acaba`); return { colgada: true, e }; }
  return { e };
}

if (process.env.TRAZA) { /* TRAZA=semilla [ROBOT=sensato]: cuenta una partida estación a estación (por omisión, «cabeza») */
  const robot = { sensato, cabeza, azar, primera }[process.env.ROBOT || "cabeza"];
  let e = R.crear(+process.env.TRAZA);
  while (e.fase !== 'fin') { const t = `${e.turno} oro ${e.oro} grano ${e.grano} plebe ${e.plebe} favor ${e.favor} leg ${e.legiones} F ${R.fuerza(e)}/${e.amenaza}→${R.amenazaFinal(e)} edad ${e.edad} [${e.saberes}] ${JSON.stringify(e.edif)} ${e.suceso.titulo}`; robot(e, Math.random); const r = e.recuento; console.log(t + '\n   ' + e.cartas.map(c => R.leyTexto(c).titulo).join(' / ') + ' → ' + (r ? R.leyTexto(r.ley).titulo + ' ' + r.si + (r.aprobada ? ' SÍ' : ' NO') + ' tratos ' + JSON.stringify(e.tratos) : 'pasa')); R.terminar(e); }
  console.log(e.fin); process.exit(0); }
const res = {};
for (const [nombre, robot] of Object.entries({ nada, primera, azar, sensato, cabeza })) {
  const r = { gana: 0, turnos: 0, oro: 0, plebe: 0, legiones: 0, edad2: 0, saberes: 0, aprobadas: 0, causas: {}, nota: 0 };
  for (let s = 1; s <= N; s++) {
    const { e, colgada } = jugar(robot, s); if (colgada) continue;
    const f = e.fin; r.causas[f.titulo] = (r.causas[f.titulo] || 0) + 1;
    if (f.gana) { r.gana++; r.nota += f.nota; }
    r.turnos += e.turno + 1; r.oro += e.oro; r.plebe += e.plebe; r.legiones += e.legiones; r.edad2 += e.edad >= 2; r.saberes += e.saberes.length;
    r.aprobadas += e.historial.filter(h => h.aprobada).length;
    const perdioPronto = ['Motín de la plebe', 'Hambre en Roma', 'El arca está vacía', 'El Senado te depone'].includes(f.titulo);
    if (!perdioPronto && e.turno + 1 < 10) mal(`${nombre} semilla ${s}: acabó en ${e.turno + 1} estaciones sin perder antes`);
  }
  res[nombre] = r;
  const m = k => (r[k] / N).toFixed(1);
  console.log(`${nombre.padEnd(7)} gana ${(100 * r.gana / N).toFixed(1)} % · estaciones ${m('turnos')} · oro ${m('oro')} · plebe ${m('plebe')} · legiones ${m('legiones')} · saberes ${m('saberes')} · leyes aprobadas ${m('aprobadas')} · Edad II ${(100 * r.edad2 / N).toFixed(0)} %${r.gana ? ' · nota media ' + (r.nota / r.gana).toFixed(1) : ''}`);
  console.log('        ' + Object.entries(r.causas).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
}
const t = k => res[k].gana / N;
if (t('nada') > 0.10) mal(`«nada» gana ${(100 * t('nada')).toFixed(1)} % (tope 10 %)`);
if (t('primera') > 0.10) mal(`«primera» gana ${(100 * t('primera')).toFixed(1)} % (tope 10 %)`);
if (t('azar') > 0.15) mal(`«azar» gana ${(100 * t('azar')).toFixed(1)} % (tope 15 %)`);
if (t('sensato') < 0.35 || t('sensato') > 0.55) mal(`«sensato» gana ${(100 * t('sensato')).toFixed(1)} % (debe quedar entre 35 y 55 %)`);
if (t('cabeza') < 0.70) mal(`«cabeza» gana ${(100 * t('cabeza')).toFixed(1)} % (mínimo 70 %)`);
/* el mismo estado con la misma semilla da lo mismo */
{ const a = jugar(cabeza, 7).e, b = jugar(cabeza, 7).e; if (JSON.stringify(a.historial) !== JSON.stringify(b.historial)) mal('la misma semilla no repite la partida'); }
/* el recuento tiene duda: con la misma previsión, los dudosos no siempre votan igual */
{ let distintos = 0; for (let s = 1; s <= 30; s++) { const e = R.crear(s); R.elegir(e, 0); const p = R.prevision(e); const r = R.votar(e); if (p.dudosos > 0 && r.si !== p.seguros) distintos++; } if (!distintos) mal('los dudosos no se sortean'); }
/* reglas finas de la revisión */
for (let s = 1; s <= 60; s++) {
  let e = R.crear(s);
  while (e.fase !== 'fin') {
    // ninguna promesa vence después de la última estación, y en la última no se puede prometer
    const pp = R.plazoPromesa(e); if (pp.vence > R.K.turnos - 1) mal(`semilla ${s}: promesa con plazo fuera de la partida`);
    if (e.turno === R.K.turnos - 1 && pp.puede) mal(`semilla ${s}: se puede prometer en la última estación`);
    // ninguna carta que no llega sin marcar
    e.cartas.forEach(c => { if (!R.llega(e, c) && !c.noLlega) mal(`semilla ${s}: ${c.tipo} no llega y no está marcada`); });
    // horquilla del golpe ordenada
    const g = R.golpe(e); if (!(g.min <= g.esperado && g.esperado <= g.max && g.ahora === e.amenaza)) mal(`semilla ${s}: horquilla del golpe desordenada ${JSON.stringify(g)}`);
    sensato(e);
    // no se paga trato a un bando que ya votaba todo «sí»
    const inf = R.terminar(e);
    for (const n of inf.nuevo) if (!['edificio', 'legion', 'saber', 'edad'].includes(n.tipo) || !n.id) mal(`semilla ${s}: «nuevo» mal formado ${JSON.stringify(n)}`);
    if (inf.cambios.some(c => c.motivo && c.motivo.startsWith('Orden cumplida: Ampliar')) && !inf.nuevo.some(n => n.tipo === 'edificio')) mal(`semilla ${s}: obra cumplida sin «nuevo»`);
  }
  if (e.promesas.length && (e.fin.gana || ['Roma saqueada', 'Sin triunfo'].includes(e.fin.titulo))) mal(`semilla ${s}: quedan promesas sin cobrar al final`);
  if (!R.consejo(e)) mal(`semilla ${s}: sin consejo al final`);
}
{ // trato a un bando que ya vota todo sí: se rechaza
  let hallado = 0;
  for (let s = 1; s <= 80 && !hallado; s++) { const e = R.crear(s); e.favor = 100; R.BS.forEach(b => e.humor[b] = 100); for (let i = 0; i < e.cartas.length; i++) { R.elegir(e, i); const pv = R.prevision(e); for (const b of R.BS) if (pv.bandos[b].yaTeVotan) { hallado++; if (R.trato(e, b, 'promesa') || R.trato(e, b, 'oro')) mal(`semilla ${s}: trato aceptado a un bando que ya vota sí`); } } }
  if (!hallado) mal('ninguna semilla con un bando que ya vote todo sí: no se ha podido probar');
}
{ // en Edad II, «Reclutar» dice dos legiones
  const e = R.crear(3); e.edad = 2; if (!/Dos legiones/.test(R.leyTexto({ tipo: 'reclutar' }, e).efecto)) mal('el texto de «Reclutar» no dice dos legiones en Edad II');
  if (/escaño/.test(R.leyTexto({ tipo: 'reclutar' }, e).efecto)) mal('el texto de «Reclutar» aún habla de escaños');
}
console.log(fallos.length ? `\nNO APTO (${fallos.length} fallos)` : '\nAPTO');
process.exit(fallos.length ? 1 : 0);
