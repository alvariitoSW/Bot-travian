// EV7 · prueba de las reglas en Node: tres robots × 200 semillas. Uso: node gobierno/maquetas/gobierno-turnos/prueba.mjs
// Robots: nada (deja pasar), primera (vota la primera ley sin tratos), azar, cabeza.
// Falla si: «nada» o «primera» gana más del 10 %, «cabeza» menos del 55 %, «azar» no queda entre medias, una partida se cuelga o da NaN,
// o una partida acaba antes de 10 estaciones sin haber perdido.
import * as R from './reglas.js';
const N = 200, fallos = [];
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

if (process.env.TRAZA) { /* TRAZA=semilla: cuenta una partida de «cabeza» estación a estación */
  let e = R.crear(+process.env.TRAZA);
  while (e.fase !== 'fin') { const t = `${e.turno} oro ${e.oro} grano ${e.grano} plebe ${e.plebe} favor ${e.favor} leg ${e.legiones} F ${R.fuerza(e)}/${e.amenaza}→${R.amenazaFinal(e)} edad ${e.edad} [${e.saberes}] ${JSON.stringify(e.edif)} ${e.suceso.titulo}`; cabeza(e); const r = e.recuento; console.log(t + '\n   ' + e.cartas.map(c => R.leyTexto(c).titulo).join(' / ') + ' → ' + (r ? R.leyTexto(r.ley).titulo + ' ' + r.si + (r.aprobada ? ' SÍ' : ' NO') + ' tratos ' + JSON.stringify(e.tratos) : 'pasa')); R.terminar(e); }
  console.log(e.fin); process.exit(0); }
const res = {};
for (const [nombre, robot] of Object.entries({ nada, primera, azar, cabeza })) {
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
if (t('cabeza') < 0.55) mal(`«cabeza» gana ${(100 * t('cabeza')).toFixed(1)} % (mínimo 55 %)`);
if (!(t('azar') >= t('nada') && t('azar') <= t('cabeza'))) mal('«azar» no queda entre «nada» y «cabeza»');
/* el mismo estado con la misma semilla da lo mismo */
{ const a = jugar(cabeza, 7).e, b = jugar(cabeza, 7).e; if (JSON.stringify(a.historial) !== JSON.stringify(b.historial)) mal('la misma semilla no repite la partida'); }
/* el recuento tiene duda: con la misma previsión, los dudosos no siempre votan igual */
{ let distintos = 0; for (let s = 1; s <= 30; s++) { const e = R.crear(s); R.elegir(e, 0); const p = R.prevision(e); const r = R.votar(e); if (p.dudosos > 0 && r.si !== p.seguros) distintos++; } if (!distintos) mal('los dudosos no se sortean'); }
console.log(fallos.length ? `\nNO APTO (${fallos.length} fallos)` : '\nAPTO');
process.exit(fallos.length ? 1 : 0);
