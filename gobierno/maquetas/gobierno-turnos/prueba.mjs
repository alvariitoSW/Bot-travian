// EV8 · prueba de las reglas en Node: cinco robots × 200 semillas. Uso: node gobierno/maquetas/gobierno-turnos/prueba.mjs
// Robots: nada (sin plan, sin actos, deja pasar), azar, delegaTodo (elige plan, delega los tres cargos, vota lo que gusta),
// sensato (juega como una persona sin calcular), cabeza (calcula).
// Falla si no se cumple nada < azar < delegaTodo ≤ cabeza, si «cabeza» gana menos del 70 % o «nada» más del 5 %, si una partida
// se cuelga o da NaN, o si «cabeza» pierde por hambre. Comprueba también el plan, las fichas, los actos, las leyes y el informe.
import * as R from './reglas.js';
const N = 200, fallos = [];
if (process.env.AJUSTE) Object.assign(R.K, JSON.parse(process.env.AJUSTE)); // AJUSTE='{"base":0.5}': probar cifras sin tocar reglas.js
const mal = t => { fallos.push(t); console.log('  MAL: ' + t); };
const P = (id, k, n) => (R.EDIFICIOS[id].prod[k] || [])[n] || 0;
const balanceGrano = e => P('granja', 'grano', e.edif.granja) + P('muelle', 'grano', e.edif.muelle) + (e.saberes.includes('apio') ? 6 : 0) - Math.round(e.pob * R.K.porMil) - e.legiones * R.K.legion.grano;
const obraEn = (e, id) => e.ordenes.some(o => o.ley.tipo === 'obra' && o.ley.obj === id);

/* ---------- robots ---------- */
function nada(e) { R.dejarPasar(e); }

function azar(e, r) {
  if (e.fase === 'consejo') R.elegirPlan(e, R.encargosPropuestos(e).filter(() => r() < 0.33).slice(0, 3).map(x => x.id));
  for (const c of R.ORDEN_CARGOS) if (r() < 0.3) R.delegar(e, c, r() < 0.5);
  if (r() < 0.4) R.mejorar(e, R.ORDEN_EDIF[Math.floor(r() * 7)]);
  if (r() < 0.4) R.hacerActo(e, ['banquete', 'juegos', 'rito'][Math.floor(r() * 3)], R.BS[Math.floor(r() * 3)]);
  if (r() < 0.1) return R.dejarPasar(e);
  R.elegir(e, Math.floor(r() * e.cartas.length));
  for (const b of R.BS) { const x = r(); R.trato(e, b, x < 0.2 ? 'oro' : x < 0.3 ? 'promesa' : null); }
  R.votar(e);
}

/* delegaTodo: lee lo que pide la Edad II, elige un plan con eso y lo delega todo; vota la ley que gusta a más escaños */
function planEdad(e, props) {
  const E = R.EDADES[e.edad + 1], v = p => {
    if (E && p.tipo === 'obra' && E.edif[p.obj] >= p.n) return 3;
    if (E && p.tipo === 'saber' && e.saberes.length < E.saberes) return 2.5;
    if (p.tipo === 'obra' && p.obj === 'foro') return 2;
    if (p.tipo === 'legion') return 1.5;
    return p.puede ? 1 : 0;
  };
  return props.slice().sort((a, b) => v(b) - v(a)).slice(0, 3).map(p => p.id);
}
function delegaTodo(e) {
  if (e.fase === 'consejo') { R.elegirPlan(e, planEdad(e, R.encargosPropuestos(e))); R.ORDEN_CARGOS.forEach(c => R.delegar(e, c, true)); }
  let mejor = 0, mv = -1e9;
  e.cartas.forEach((c, i) => { const ef = R.efectoBando(c), v = R.BS.reduce((s, b) => s + ef[b] * e.escanos[b], 0); if (v > mv) { mv = v; mejor = i; } });
  R.elegir(e, mejor); R.votar(e);
}

/* sensato: plan con lo de la edad, lo hace a mano; juegos si la plebe cae; vota lo que más falta */
function ayuda(e, ley, que) {
  const t = ley.tipo, o = ley.obj;
  if (que === 'plebe') return t === 'granoBarato';
  if (que === 'fuerza') return t === 'reclutar' || t === 'socios' || (t === 'estudiar' && (R.SABERES[o].rama === 'guerra' || o === 'corvus'));
  if (que === 'oro') return t === 'impuestos';
  if (que === 'edad') return t === 'estudiar';
  return false;
}
function sensato(e) {
  if (e.fase === 'consejo') R.elegirPlan(e, planEdad(e, R.encargosPropuestos(e)));
  for (const p of R.planDelAnio(e)) if (!p.hecho && !p.enCurso) { if (R.empezarEncargo(e, p.id).ok) break; if (p.tipo === 'obra' && R.mejorar(e, 'foro').ok) break; }
  if (balanceGrano(e) < 0 && e.grano < 50) R.mejorar(e, 'granja');
  if (e.plebe < 40) R.hacerActo(e, 'juegos');
  let i = e.cartas.findIndex(c => c.tipo === 'edad');
  if (i < 0) {
    const g = R.golpe(e), faltas = [];
    if (e.plebe < 35) faltas.push('plebe'); if (e.oro < 30) faltas.push('oro'); if (g.falta > 0) faltas.push('fuerza'); if (e.edad < 2) faltas.push('edad');
    for (const q of faltas) { i = e.cartas.findIndex(c => !c.noLlega && ayuda(e, c, q)); if (i >= 0) break; }
    if (i < 0) i = e.cartas.findIndex(c => !c.noLlega);
    if (i < 0) return R.dejarPasar(e);
  }
  R.elegir(e, i);
  const pv = R.prevision(e);
  for (const b of R.BS) if (pv.bandos[b].dudosos > 0 && !R.trato(e, b, e.oro > 80 ? 'oro' : 'promesa')) R.trato(e, b, 'oro');
  R.votar(e);
}

/* cabeza: plan que lleva a la Edad II y al golpe, todo a mano, actos con intención y votos comprados */
function prioridad(e, p) {
  const g = R.golpe(e), II = e.edad < 2;
  if (p.tipo === 'obra') {
    const o = p.obj;
    if (o === 'granja') return balanceGrano(e) < 2 ? 92 : 20;
    if (o === 'foro') return p.n === 2 ? 90 : 25;
    if (o === 'mercado') return II && p.n === 2 ? 85 : 30;
    if (o === 'muelle') return II && p.n === 1 ? 80 : 22;
    if (o === 'muralla') return g.falta > 0 ? 60 : 15;
    if (o === 'templo') return e.plebe < 50 ? 40 : 18;
    if (o === 'cuartel') return 28;
  }
  if (p.tipo === 'saber') { if (II && e.saberes.length < 2) return p.obj === 'quinque' && e.edif.muelle ? 78 : 74; if (p.obj === 'corvus') return 70; return 35; }
  if (p.tipo === 'legion') return g.falta > 0 ? 55 : 10;
  return 0;
}
function valor(e, ley) {
  const g = R.golpe(e), falta = g.falta, quedan = R.K.turnos - e.turno;
  switch (ley.tipo) {
    case 'edad': return ley.obj === 2 ? 100 : 30;
    case 'reclutar': case 'socios': return falta > 0 ? 40 + falta / 2 - (e.oro < 40 ? 15 : 0) - (e.grano < 40 || balanceGrano(e) < 0 ? 30 : 0) : 5;
    case 'estudiar': {
      const s = R.SABERES[ley.obj];
      if (e.edad < 2 && e.saberes.length + e.ordenes.filter(o => o.ley.tipo === 'estudiar').length < 2) return 60 + (s.rama === 'mar' ? 5 : 0);
      if (ley.obj === 'corvus') return falta > 0 ? 55 : 15;
      if (ley.obj === 'castra' || ley.obj === 'pilum') return falta > 0 ? 30 + e.legiones * 2 : 10;
      return quedan > 4 ? 15 : 3;
    }
    case 'impuestos': return e.oro < 60 ? 50 : e.oro < 120 ? 25 : 4;
    case 'granoBarato': return e.plebe < 40 ? 54 - e.plebe / 4 : e.plebe < 50 ? 15 : 1;
  }
  return 0;
}
function cabeza(e) {
  if (e.fase === 'consejo') { const props = R.encargosPropuestos(e).sort((a, b) => prioridad(e, b) - prioridad(e, a)); R.elegirPlan(e, props.slice(0, 3).map(p => p.id)); }
  // obras a mano: primero el grano, luego el plan, luego lo que pide la edad y el golpe
  if (balanceGrano(e) < 2 && !obraEn(e, 'granja')) { if (!R.mejorar(e, 'granja').ok && e.edif.granja >= e.edif.foro) R.mejorar(e, 'foro'); }
  for (const p of R.planDelAnio(e)) if (!p.hecho && !p.enCurso) { if (!R.empezarEncargo(e, p.id).ok && p.tipo === 'obra' && p.n > e.edif.foro) R.mejorar(e, 'foro'); }
  const reserva = 25;
  const quiero = [];
  if (e.edad < 2) quiero.push('foro', 'mercado', 'muelle');
  if (R.golpe(e).falta > 0) quiero.push('muralla');
  quiero.push('mercado', 'templo', 'foro');
  for (const id of quiero) { const f = R.fichaEdificio(e, id); if (f.puede && e.oro - f.coste.oro >= reserva && (id !== 'muelle' || e.edif.muelle < 1) && (id !== 'mercado' || e.edif.mercado < 2 || e.edad >= 2)) R.mejorar(e, id); }
  if (e.edad < 2 && e.saberes.length + e.ordenes.filter(o => o.ley.tipo === 'estudiar').length < 2 && e.oro > 60) { const s = R.saberesPosibles(e)[0]; if (s) R.empezarEncargo(e, 'saber-' + s); }
  // acto
  if (e.plebe < 45) R.hacerActo(e, 'juegos');
  else if (e.favor < 40) R.hacerActo(e, 'rito');
  // ley
  let mejor = 0, mv = -1;
  e.cartas.forEach((c, i) => { let v = valor(e, c); const gg = R.gustoLey(c); e.promesas.forEach(p => { if (gg[p.bando] > 0.15) v += p.vence - e.turno <= 1 ? 25 : 8; }); if (R.prevision(e, i).veto) v = -1; if (c.noLlega) v = -1; if (v > mv) { mv = v; mejor = i; } });
  R.elegir(e, mejor);
  const ley = e.cartas[mejor], g = R.gustoLey(ley);
  if (R.prevision(e).esperado < 21 && e.oro > 60 && R.actos(e)[0].puede) { const b = R.BS.slice().sort((a, c) => R.prevision(e).bandos[c].dudosos - R.prevision(e).bandos[a].dudosos)[0]; R.hacerActo(e, 'banquete', b); }
  const orden = R.BS.slice().sort((a, b) => { const pa = R.prevision(e).bandos[a], pb = R.prevision(e).bandos[b]; return (pb.dudosos + pb.contra) - (pa.dudosos + pa.contra); });
  for (const b of orden) {
    if (R.prevision(e).esperado >= 21) break;
    if (R.prevision(e).bandos[b].seguros === e.escanos[b]) continue;
    if (g[b] > 0.15 && !e.promesas.some(p => p.bando === b)) { R.trato(e, b, 'promesa'); continue; }
    if (e.oro - R.costeTrato(e, b) > 40) R.trato(e, b, 'oro');
    else if (!e.promesas.some(p => p.bando === b) && e.favor > 35) R.trato(e, b, 'promesa');
  }
  R.votar(e);
}

/* ---------- partidas ---------- */
function semRnd(s) { let a = s * 7919 + 13; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ROBOTS = { nada, azar, delegaTodo, sensato, cabeza };
function jugar(robot, semilla, mirar) {
  let e = R.crear(semilla); const r = semRnd(semilla);
  for (let paso = 0; paso < 40 && e.fase !== 'fin'; paso++) {
    robot(e, r); const inf = R.terminar(e); if (mirar) mirar(e, inf);
    e = JSON.parse(JSON.stringify(e));
    for (const k of ['oro', 'grano', 'plebe', 'favor', 'legiones', 'amenaza']) if (!Number.isFinite(e[k])) { mal(`semilla ${semilla}: ${k} es NaN`); return { colgada: true, e }; }
  }
  if (e.fase !== 'fin') { mal(`semilla ${semilla}: la partida no acaba`); return { colgada: true, e }; }
  return { e };
}

if (process.env.TRAZA) { /* TRAZA=semilla [ROBOT=sensato]: cuenta una partida estación a estación (por omisión, «cabeza») */
  const robot = ROBOTS[process.env.ROBOT || 'cabeza'], rr = semRnd(+process.env.TRAZA);
  const e = R.crear(+process.env.TRAZA);
  while (e.fase !== 'fin') {
    const t = `${e.turno} oro ${e.oro} grano ${e.grano} plebe ${e.plebe} favor ${e.favor} leg ${e.legiones} F ${R.fuerza(e)}/${e.amenaza}→${R.amenazaFinal(e)} edad ${e.edad} [${e.saberes}] ${JSON.stringify(e.edif)} ${e.suceso.titulo}\n   juicio ${R.juicio(e).lineas.map(l => l.marca + l.n).join(' ')}`;
    robot(e, rr); const rc = e.recuento;
    console.log(t + '\n   plan ' + e.plan.map(p => p.titulo + (p.hecho ? '✓' : '')).join(', ') + ' · ' + e.cartas.map(c => R.leyTexto(c).titulo).join(' / ') + ' → ' + (rc ? R.leyTexto(rc.ley).titulo + ' ' + rc.si + (rc.aprobada ? ' SÍ' : ' NO') : 'pasa'));
    const inf = R.terminar(e); if (inf.delegaron.length) console.log('   ' + inf.delegaron.join(' '));
  }
  console.log(e.fin); process.exit(0);
}

const res = {};
for (const [nombre, robot] of Object.entries(ROBOTS)) {
  const r = { gana: 0, turnos: 0, oro: 0, plebe: 0, legiones: 0, edad2: 0, saberes: 0, aprobadas: 0, causas: {}, nota: 0, plan: 0 };
  for (let s = 1; s <= N; s++) {
    const { e, colgada } = jugar(robot, s); if (colgada) continue;
    const f = e.fin; r.causas[f.titulo] = (r.causas[f.titulo] || 0) + 1;
    if (f.gana) { r.gana++; r.nota += f.nota; }
    r.turnos += e.turno + 1; r.oro += e.oro; r.plebe += e.plebe; r.legiones += e.legiones; r.edad2 += e.edad >= 2; r.saberes += e.saberes.length;
    r.aprobadas += e.historial.filter(h => h.aprobada).length;
    const perdioPronto = ['Revuelta de la plebe', 'Hambre en Roma', 'El arca está vacía', 'El Senado te depone'].includes(f.titulo);
    if (!perdioPronto && e.turno + 1 < 10) mal(`${nombre} semilla ${s}: acabó en ${e.turno + 1} estaciones sin perder antes`);
  }
  res[nombre] = r;
  const m = k => (r[k] / N).toFixed(1);
  console.log(`${nombre.padEnd(10)} gana ${(100 * r.gana / N).toFixed(1)} % · estaciones ${m('turnos')} · oro ${m('oro')} · plebe ${m('plebe')} · legiones ${m('legiones')} · saberes ${m('saberes')} · leyes aprobadas ${m('aprobadas')} · Edad II ${(100 * r.edad2 / N).toFixed(0)} %${r.gana ? ' · nota media ' + (r.nota / r.gana).toFixed(1) : ''}`);
  console.log('           ' + Object.entries(r.causas).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
}
const t = k => res[k].gana / N, pc = k => (100 * t(k)).toFixed(1) + ' %';
if (t('nada') > 0.05) mal(`«nada» gana ${pc('nada')} (tope 5 %)`);
if (!(t('nada') < t('azar'))) mal(`«nada» (${pc('nada')}) no queda por debajo de «azar» (${pc('azar')})`);
if (!(t('azar') < t('delegaTodo'))) mal(`«azar» (${pc('azar')}) no queda por debajo de «delegaTodo» (${pc('delegaTodo')})`);
if (!(t('delegaTodo') <= t('cabeza'))) mal(`«delegaTodo» (${pc('delegaTodo')}) supera a «cabeza» (${pc('cabeza')})`);
if (t('cabeza') < 0.70) mal(`«cabeza» gana ${pc('cabeza')} (mínimo 70 %)`);
if (res.cabeza.causas['Hambre en Roma']) mal(`«cabeza» pierde ${res.cabeza.causas['Hambre en Roma']} partidas por hambre`);

/* la misma semilla repite la partida */
{ const a = jugar(cabeza, 7).e, b = jugar(cabeza, 7).e; if (JSON.stringify(a.historial) !== JSON.stringify(b.historial)) mal('la misma semilla no repite la partida'); }
/* los dudosos se sortean */
{ let distintos = 0; for (let s = 1; s <= 30; s++) { const e = R.crear(s); R.elegir(e, 0); const p = R.prevision(e); const r = R.votar(e); if (p.dudosos > 0 && r.si !== p.seguros) distintos++; } if (!distintos) mal('los dudosos no se sortean'); }
/* reglas finas, recorriendo partidas de «sensato» y «delegaTodo» */
for (let s = 1; s <= 60; s++) {
  for (const robot of [sensato, delegaTodo]) {
    let e = R.crear(s);
    while (e.fase !== 'fin') {
      if (e.turno % 4 === 0 && e.fase !== 'consejo') mal(`semilla ${s}: primavera sin consejo`);
      if (e.fase === 'consejo') { const pr = R.encargosPropuestos(e); for (const c of R.ORDEN_CARGOS) { const k = pr.filter(p => p.cargo === c).length; if (k > 3 || k < (e.turno === 0 ? 3 : 1)) mal(`semilla ${s}: el ${c} propone ${k} encargos`); } if (pr.some(p => !p.titulo || !p.da || !p.cuestaTexto)) mal(`semilla ${s}: encargo sin textos`); }
      const pp = R.plazoPromesa(e); if (pp.vence > R.K.turnos - 1) mal(`semilla ${s}: promesa con plazo fuera de la partida`);
      if (e.turno === R.K.turnos - 1 && pp.puede) mal(`semilla ${s}: se puede prometer en la última estación`);
      e.cartas.forEach(c => { if (!R.llega(e, c) && !c.noLlega) mal(`semilla ${s}: ${c.tipo} no llega y no está marcada`); if (c.tipo === 'obra') mal(`semilla ${s}: el Senado vota una obra`); const lt = R.leyTexto(c, e); if (!lt.ciudad || !lt.sitio) mal(`semilla ${s}: ley ${c.tipo} sin «ciudad» o «sitio»`); });
      const g = R.golpe(e); if (!(g.min <= g.esperado && g.esperado <= g.max && g.ahora === e.amenaza)) mal(`semilla ${s}: horquilla del golpe desordenada`);
      for (const id of R.ORDEN_EDIF) { const f = R.fichaEdificio(e, id); if (id !== 'foro' && f.nivel > e.edif.foro) mal(`semilla ${s}: ${id} pasa del nivel del Foro`); if (f.puede === !!f.falta.length) mal(`semilla ${s}: ficha de ${id} incoherente`); if (!f.produce || !f.cargo) mal(`semilla ${s}: ficha de ${id} incompleta`); }
      const j = R.juicio(e); if (!j.lineas.length || j.lineas.some(l => !['▲', '▼', '·'].includes(l.marca) || !l.texto)) mal(`semilla ${s}: juicio mal formado`);
      robot(e);
      const inf = R.terminar(e);
      for (const n of inf.nuevo) if (!['edificio', 'legion', 'saber', 'edad'].includes(n.tipo) || !n.id) mal(`semilla ${s}: «nuevo» mal formado ${JSON.stringify(n)}`);
      if (inf.nuevo.some(n => n.tipo === 'edificio') && !inf.cambiosCiudad.some(c => R.ORDEN_EDIF.includes(c.sitio))) mal(`semilla ${s}: obra terminada sin cambio en la ciudad`);
      for (const c of inf.cambiosCiudad) if (!c.sitio || !c.antes || !c.despues || !c.porque) mal(`semilla ${s}: cambiosCiudad mal formado ${JSON.stringify(c)}`);
    }
    if (e.promesas.length && (e.fin.gana || ['Roma saqueada', 'Sin triunfo'].includes(e.fin.titulo))) mal(`semilla ${s}: quedan promesas sin cobrar al final`);
    if (!R.consejo(e)) mal(`semilla ${s}: sin consejo al final`);
  }
}
{ // trato a un bando que ya vota todo sí: se rechaza
  let hallado = 0;
  for (let s = 1; s <= 80 && !hallado; s++) { const e = R.crear(s); e.favor = 100; R.BS.forEach(b => e.humor[b] = 100); for (let i = 0; i < e.cartas.length; i++) { R.elegir(e, i); const pv = R.prevision(e); for (const b of R.BS) if (pv.bandos[b].yaTeVotan) { hallado++; if (R.trato(e, b, 'promesa') || R.trato(e, b, 'oro')) mal(`semilla ${s}: trato aceptado a un bando que ya vota sí`); } } }
  if (!hallado) mal('ninguna semilla con un bando que ya vote todo sí: no se ha podido probar');
}
{ // en Edad II, «Reclutar» dice dos legiones
  const e = R.crear(3); e.edad = 2; if (!/Dos legiones/.test(R.leyTexto({ tipo: 'reclutar' }, e).efecto)) mal('el texto de «Reclutar» no dice dos legiones en Edad II');
}
{ // plan, delegar, mejorar, actos
  const e = R.crear(5);
  if (e.fase !== 'consejo') mal('la partida no empieza en el consejo del año');
  if (R.elegirPlan(e, ['a', 'b', 'c', 'd']).ok) mal('se aceptan más de 3 encargos');
  const ids = R.encargosPropuestos(e).slice(0, 3).map(p => p.id);
  if (!R.elegirPlan(e, ids).ok || e.plan.length !== 3 || e.fase !== 'senado') mal('elegirPlan no deja el plan');
  if (R.mejorar(e, 'templo').ok !== true) mal('no se puede subir el templo a 1 a mano');
  if (R.mejorar(e, 'mercado').ok) mal('el mercado sube a 2 con el Foro en 1');
  if (!/Foro/.test(R.fichaEdificio(e, 'mercado').falta.join(' '))) mal('la ficha del mercado no dice que falta el Foro');
  const r1 = R.hacerActo(e, 'banquete', 'mer'); if (!r1.ok || !r1.aprende || !r1.aprende.fuente || !r1.imagen) mal('el banquete no devuelve «aprende» con fuente e imagen');
  if (R.hacerActo(e, 'juegos').ok) mal('dos actos en la misma estación');
  R.delegar(e, 'edil', true); if (!e.delegados.edil) mal('delegar no guarda el cargo');
  const e2 = R.crear(6); R.elegirPlan(e2, []); const rj = R.hacerActo(e2, 'juegos'); if (!rj.ok || !/Valerio|Livio|Suetonio/.test(rj.aprende.fuente)) mal('los juegos no enseñan su fuente');
  if (JSON.stringify(R.juicio(e2)).includes('Coliseo') ) mal('el juicio habla del Coliseo');
}
console.log(fallos.length ? `\nNO APTO (${fallos.length} fallos)` : '\nAPTO');
process.exit(fallos.length ? 1 : 0);
