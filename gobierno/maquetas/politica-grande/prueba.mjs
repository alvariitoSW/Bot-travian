// Prueba de las reglas de EV4a (sin pantalla): reglas fijas, azar guardable y cuatro robots que juegan mil años cada uno. Termina con APTO o código 1.
import * as R from './reglas.js';
const { crear, ajustar, ordenar, nombrar, candidatos, asunto, votos, votar, elegir, consultas, decidir, puedeCerrar, cerrarEstacion, cierre, visita, atender, ganarse, senadores, veredicto, asamblea, tratos, CARGOS, PERSONAS, ORDEN_CARGOS, SENADORES, CONSULTAS, VISITAS } = R;
const t0 = Date.now();
let fallos = 0; const ok = (c, t) => { if (!c) { fallos++; console.log('  MAL: ' + t); } };
const mal = [];
const sano = (e, t) => {
  for (const x of [e.oro, e.pueblo, e.ciudad.gente, e.ciudad.nivel, e.rng, ...Object.values(e.humor)]) if (!Number.isFinite(x)) mal.push('NaN ' + t);
  for (const h of Object.values(e.humor)) if (h < 0 || h > 100) mal.push('humor ' + t);
  if (e.pueblo < 0 || e.pueblo > 100) mal.push('pueblo ' + t); if (e.oro < 0) mal.push('oro ' + t); if (e.ciudad.nivel < 0 || e.ciudad.nivel > 8 || e.ciudad.obras.length !== e.ciudad.nivel) mal.push('nivel ' + t);
};
const lanza = f => { try { f(); return false; } catch { return true; } };
// generador propio de los robots: no es el del juego, que ellos no pueden leer
const gen = s => { let a = (s * 7919 + 12345) | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const mediana = v => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const firma = e => JSON.stringify([e.oro, e.pueblo, e.humor, e.ciudad.nivel, e.ciudad.gente]);
const clon = e => JSON.parse(JSON.stringify(e));

/* ---------- robots: solo usan información pública (pronósticos, deseos, chips, ánimos) ---------- */
const punt = (chips, e) => chips.reduce((s, c) => s + (c.que === 'oro' ? (c.n < 0 && e && e.oro < 110 ? c.n * 3 : c.n) : c.que === 'pueblo' ? c.n * 4 : c.que === 'obra' ? c.n * 0.3 : c.que === 'gente' ? 0 : c.n * 1.5), 0);
const libres = e => tratos(e).filter(t => !t.usado && !t.bloqueado && (t.id !== 'mer' || e.oro >= 60));
const SINTOCAR = { ajuste: 'nada', paso() {} };
const AZAR = {
  ajuste: 'grande',
  paso(e, s, c) {
    const r = c.r; if (s === 0 && r() < 0.5) ajustar(e, 'todo');
    for (const k of ORDEN_CARGOS) { if (s === 0 || r() < 0.1) { const os = CARGOS[k].ordenes; ordenar(e, k, os[Math.floor(r() * 3)].id); } if (r() < (s === 0 ? 0.3 : 0.04) && (s === 0 || e.oro >= 30)) { const cs = candidatos(e, k); nombrar(e, k, cs[Math.floor(r() * 3)].id); } }
    if (s > 3) return; if (s <= 2) {
      for (const x of senadores(e)) if (r() < 0.1 && !x.ganado && e.oro >= x.coste) ganarse(e, x.id);
      const v = visita(e); if (v && r() < 0.8) atender(e, v.opciones[Math.floor(r() * 2)].id);
      const ops = asunto(e).opciones.filter(o => !o.apagada), op = ops[Math.floor(r() * ops.length)].id, tr = libres(e).filter(() => r() < 0.15).map(t => t.id);
      const rr = votar(e, op, tr); if (s === 0 && !rr.sale) elegir(e, r() < 0.5 ? 'pueblo' : 'acatar');
      if (e.ajuste === 'todo') for (const x of consultas(e)) if (x.decidida === null && !x.laDecideElMagistrado) decidir(e, x.id, x.opciones[Math.floor(r() * 2)].id);
    }
  },
};
function cabeza(historia) {
  return { ajuste: 'todo', historia,
    paso(e, s) {
      if (s === 0) for (const k of ORDEN_CARGOS) { const cs = candidatos(e, k), mejor = cs.reduce((a, b) => (b.habil > a.habil ? b : a), cs.find(x => x.ocupa)); if (mejor.id !== e.cargos[k]) nombrar(e, k, mejor.id); }
      // órdenes de base según oro y pueblo
      ordenar(e, 'cuestor', e.oro < 130 ? 'ahorra' : 'justo'); ordenar(e, 'edil', e.pueblo < 42 ? 'juegos' : 'obras'); ordenar(e, 'pretor', 'igual'); ordenar(e, 'censor', 'antiguas'); ordenar(e, 'consul', 'refuerza');
      if (s > 2) return;
      const spring = s === 0, sinPersuadir = historia && spring;
      // deseos de los claves que aún faltan (solo los que no cuestan oro de más)
      if (!sinPersuadir) for (const x of senadores(e)) { const q = x.quiere; if (q.cumplido) continue; if (q.tipo === 'orden') ordenar(e, q.cargo, q.valor); else if (q.tipo === 'cargo' && (spring || e.oro > 160)) nombrar(e, q.cargo, q.valor); }
      const v = visita(e); if (v) atender(e, v.opciones.map(o => ({ id: o.id, p: punt(o.chips, e) })).sort((a, b) => b.p - a.p)[0].id);
      const as = asunto(e), ops = as.opciones.filter(o => !o.apagada); let op;
      if (spring) op = 'cruzar';
      else if (historia && (s === 2 || e.marcas.cruza)) op = s === 1 ? 'alianza' : 'permitir';
      else op = ops.map(o => ({ id: o.id, p: punt(o.chips) + 40 * (votos(e, o.id, []).sale ? 1 : votos(e, o.id, []).puedeSalir ? 0.5 : 0) })).sort((a, b) => b.p - a.p)[0].id;
      const sel = [];
      if (!sinPersuadir) {
        let vo = votos(e, op, sel); const peor = s === 1 ? Math.max(0, ...ops.map(o => -(o.chips.find(c => c.que === 'oro') || { n: 0 }).n)) : 0, reserva = Math.max(70, peor ? peor + 35 : 0); // guarda oro por si cae la propuesta y sale la peor
        for (const animo of ['dudoso', 'en contra']) for (const x of senadores(e, op, sel)) { if (vo.si >= 18) break; if (x.animo === animo && !x.ganado && e.oro - x.coste >= reserva) { ganarse(e, x.id); vo = votos(e, op, sel); } }
        if (vo.si < 17 && e.oro >= 180 && libres(e).some(t => t.id === 'mer')) { sel.push('mer'); }
      }
      const rr = votar(e, op, sel);
      if (spring && !rr.sale) elegir(e, historia || asamblea(e).animo !== 'en contra' ? 'pueblo' : 'acatar');
      for (const x of consultas(e)) if (x.decidida === null && !x.laDecideElMagistrado) decidir(e, x.id, x.opciones.map(o => ({ id: o.id, p: punt(o.chips, e) })).sort((a, b) => b.p - a.p)[0].id);
    } };
}
// juega un año entero con un robot; rt = pasar el estado por JSON entre estaciones
function juega(robot, semilla, rt = false, ctx = {}) {
  let e = crear(semilla); ajustar(e, robot.ajuste); ctx.r = gen(semilla + 99);
  for (let s = 0; s < 4; s++) {
    robot.paso(e, s, ctx);
    if (!puedeCerrar(e).ok) throw new Error('el robot no puede cerrar en ' + s + ': ' + puedeCerrar(e).falta.join('; '));
    cerrarEstacion(e); sano(e, 'robot' + semilla + 'e' + s); if (rt) e = clon(e);
  }
  return e;
}

/* ---------- 1. el año se completa con los tres ajustes ---------- */
for (const a of ['todo', 'grande', 'nada']) {
  const e = crear(7); ajustar(e, a); let llamadas = 0;
  for (let s = 0; s < 4; s++) {
    if (e.ajuste !== 'nada' && s <= 2) { llamadas++; const r = votar(e, asunto(e).opciones[0].id, []); if (s === 0 && !r.sale) elegir(e, 'pueblo'); }
    if (e.ajuste === 'todo') for (const c of consultas(e)) if (!c.decidida && !c.laDecideElMagistrado) decidir(e, c.id, c.opciones[0].id);
    ok(puedeCerrar(e).ok, 'puede cerrar s' + s); cerrarEstacion(e); sano(e, 'est' + s);
  }
  ok(e.cerrado && e.despachos.length === 20, 'año completo con ' + a + ' (' + e.despachos.length + ' partes)');
  ok(e.despachos.every(d => d.texto && d.cargo && d.persona && d.orden && Array.isArray(d.cambios)), 'partes bien formados ' + a);
  ok(e.hilo.length >= 3, 'hilo de tres asuntos ' + a); const ci = cierre(e);
  ok(ci.ciudad.obras.length === ci.ciudad.nivel && ci.magistrados.length === 5 && ci.magistrados.every(m => ['bien', 'regular', 'mal'].includes(m.juicio)), 'cierre con ciudad y magistrados ' + a);
  ok(ci.veredicto && ['honores', 'gris', 'casa'].includes(ci.veredicto.grado) && ci.veredicto.nota >= 0 && ci.veredicto.nota <= 100 && ci.veredicto.causas.length >= 4 && ci.veredicto.dictamen, 'cierre trae veredicto ' + a);
  ok(e.consultas.length === 6 && new Set(e.consultas.map(c => c.id)).size === 6, 'seis consultas distintas ' + a);
  if (a === 'nada') { ok(llamadas === 0, 'nada: sin llamadas'); ok(e.consultas.every(c => c.por === 'magistrado'), 'nada: consultas por los magistrados'); const p = e.despachos.filter(d => d.cargo === 'consul')[0]; ok(/Sin que me lo pidieras, llevé al Senado: «(Cruzar a Sicilia|no cruzar)»/.test(p.texto), 'nada: el parte dice el título, no el id: ' + p.texto.slice(-60)); }
  if (a === 'grande') ok(e.consultas.every(c => c.por === 'magistrado'), 'grande: consultas por los magistrados');
  if (a === 'todo') ok(e.consultas.filter(c => c.por === 'jugador').length === e.consultas.filter(c => CONSULTAS.find(x => x.id === c.id).cargo !== 'consul').length, 'todo: las decide el jugador salvo el cónsul Apio (no pide permiso)');
}
// puedeCerrar y errores
{ const e = crear(); ok(!puedeCerrar(e).ok && puedeCerrar(e).falta.length >= 1, 'falta votar'); ok(lanza(() => cerrarEstacion(e)), 'cerrar sin votar falla'); ajustar(e, 'nada'); ok(puedeCerrar(e).ok, 'con nada se puede cerrar'); ok(lanza(() => ajustar(e, 'otro')), 'ajuste inválido falla'); ok(lanza(() => ordenar(e, 'edil', 'xx')), 'orden inválida falla'); }
{ const e = crear(); ajustar(e, 'todo'); votar(e, 'cruzar', ['ter', 'mer', 'mil']); if (e.marcas.pendiente) elegir(e, 'acatar'); ok(!puedeCerrar(e).ok, 'todo: faltan consultas'); ok(lanza(() => votar(e, 'cruzar', [])), 'no se vota dos veces'); }
{ const e = crear(); votar(e, 'cruzar', []); ok(!lanza(() => 1) && lanza(() => votar(e, 'cruzar', [])), 'una votación a la vez'); }
// la visita no se exige para cerrar
{ const e = crear(); ajustar(e, 'nada'); ok(visita(e) && !visita(e).atendida && puedeCerrar(e).ok, 'la visita no se exige'); }

/* ---------- 2. azar guardable ---------- */
{ const a = juega(cabeza(false), 11), b = juega(cabeza(false), 11); ok(JSON.stringify(a) === JSON.stringify(b), 'misma semilla y mismas jugadas, mismo año');
  const c = juega(cabeza(false), 11, true); ok(JSON.stringify(a) === JSON.stringify(c), 'pasar por JSON entre estaciones no cambia nada');
  const d = juega(AZAR, 5), f = juega(AZAR, 5, true); ok(JSON.stringify(d) === JSON.stringify(f), 'JSON entre pasos también con el robot al azar');
  const fi = new Set(); for (let s = 1; s <= 20; s++) { const e = juega(SINTOCAR, s); fi.add(JSON.stringify([e.sorteo.consultas, e.sorteo.visitas])); } ok(fi.size >= 8, 'semillas distintas, años distintos (' + fi.size + ' combinaciones en 20)');
  const e = crear(3); const r0 = e.rng, sn = JSON.stringify(e); asunto(e); consultas(e); visita(e); senadores(e); votos(e, 'cruzar', ['mer']); veredicto(e); cierre(e); asamblea(e); tratos(e);
  ok(e.rng === r0 && JSON.stringify(e) === sn, 'las consultas no gastan azar ni mutan'); }
// el pronóstico no revela el voto
{ let si = 0, n = 500; for (let s = 1; s <= n; s++) { const e = crear(s); ajustar(e, 'grande'); if (votar(e, 'cruzar', []).sale) si++; } ok(si > n * 0.1 && si < n * 0.9, 'cruzar por el Senado sale a veces sí y a veces no: ' + si + ' de ' + n);
  const e = crear(1), v = votos(e, 'cruzar', []); ok(!v.sale && v.puedeSalir, 'con el estado inicial cruzar ni es seguro ni imposible'); }

/* ---------- 3. el pronóstico, los claves y los favores ---------- */
{ const e = crear(2), v = votos(e, 'cruzar', []);
  ok(v.ter.si + v.ter.duda + v.ter.no === 12 && v.mer.si + v.mer.duda + v.mer.no === 8 && v.mil.si + v.mil.duda + v.mil.no === 10 && v.si + v.duda + v.no === 30, 'el pronóstico reparte 12/8/10');
  ok(v.claves.length === 6 && v.claves.every(c => c.animo && c.quiere.texto && c.arrastra === 3 && c.nombre && c.fuente && c.dictamen), 'seis claves con ánimo y deseo');
  const sn = senadores(e); ok(SENADORES.length === 6 && ['ter', 'mer', 'mil'].every(b => SENADORES.filter(s => s.bando === b).length === 2) && SENADORES.every(s => /^Fasti Capitolini, año \d+$/.test(s.fuente) && /licencia de juego/.test(s.dictamen)), 'senadores: dos por bando con fuente y dictamen');
  ok(['Marco Atilio Régulo', 'Lucio Julio Libón', 'Quinto Ogulnio Galo', 'Lucio Mamilio Vítulo', 'Publio Sempronio Sofo', 'Cayo Fabio Píctor'].every(n => sn.some(s => s.nombre === n)), 'los seis senadores del encargo');
  const x = sn[0], oro = e.oro; const g = ganarse(e, x.id); ok(e.oro <= oro - 22 && g.cambios.length && senadores(e)[0].ganado, 'ganarse cuesta oro y marca ganado'); ok(lanza(() => ganarse(e, x.id)), 'ganarse una vez por estación y senador'); ok(lanza(() => ganarse(e, 'nadie')), 'senador inválido falla');
  ordenar(e, 'consul', 'ataque'); ok(votos(e, 'cruzar', []).si + votos(e, 'cruzar', []).duda >= v.si + v.duda, 'el cónsul «al ataque» ayuda a la guerra');
  const m1 = votos(e, 'cruzar', ['mil', 'mer']); ok(m1.si >= v.si, 'los tratos empujan');
  const bajo = crear(2); bajo.oro = 10; ok(lanza(() => ganarse(bajo, 'regulo')), 'sin oro no se gana a nadie'); }
// con trabajo, cruzar sube mucho sin llegar a certeza
{ let sin = 0, con = 0, n = 400; for (let s = 1; s <= n; s++) { const e = crear(s); if (votar(e, 'cruzar', []).sale) sin++; const f = crear(s); for (const k of ['regulo', 'libon', 'ogulnio', 'mamilio', 'sofo', 'pictor']) { const q = senadores(f).find(z => z.id === k).quiere; if (q.tipo === 'orden') ordenar(f, q.cargo, q.valor); else if (q.tipo === 'cargo') nombrar(f, q.cargo, q.valor); }
  for (const x of senadores(f)) if (f.oro >= x.coste + 60) ganarse(f, x.id); if (votar(f, 'cruzar', ['mer']).sale) con++; }
  ok(con > sin * 1.5 && con < n * 0.99, 'trabajando los claves, cruzar sube (' + sin + ' → ' + con + ' de ' + n + ') sin ser seguro'); }

/* ---------- 4. si tu propuesta cae, se vota otra de verdad ---------- */
{ let rivales = 0, nadas = 0, textos = 0, mejor = 0;
  for (let s = 1; s <= 300; s++) { const e = crear(s); e.estacion = 1; e.marcas.cruza = true; e.sorteo.consultas[1] = e.sorteo.consultas[1] || []; const r = votar(e, 'alianza', []);
    if (!r.sale) { rivales++; ok(r.rival && r.rival.senador && r.rival.votos && typeof r.rival.sale === 'boolean' && r.rival.votos.duda === 0, 'rival con nombre y voto'); if (r.salio === null) { nadas++; ok(e.marcas.hieron === 'nada' && e.marcas.sinResolver === 1, 'sin resolver queda apuntado'); } else ok(r.salio === r.rival.opcion && r.rival.sale, 'salio es lo del rival');
      if (/^Tu propuesta cae \(\d+ de 16\)\. \S+ \S+ propone .+: (sale con \d+|tampoco sale \(\d+ de 16\))\./.test(r.linea) && !/No sale:/.test(r.linea)) textos++; } else mejor++; }
  ok(rivales > 20 && nadas > 0 && textos === rivales, 'rival: ' + rivales + ' cae, ' + nadas + ' sin resolver, ' + textos + ' líneas bien'); ok(R.cierre(Object.assign(crear(), { marcas: { ...crear().marcas, cruza: true, hieron: 'nada' } })).rumbo.id === 'sinrumbo', 'rumbo «guerra sin rumbo»'); }
{ let privados = 0; for (let s = 1; s <= 300 && !privados; s++) { const e = crear(s); e.estacion = 2; e.oro = 30; const r = votar(e, 'grandes' === 'x' ? 'permitir' : 'prohibir', []); if (r.salio === null) { privados++; ok(e.marcas.juegos === 'privado' && /Junios|Foro Boario/.test(r.linea) && e.hilo.includes('2:nada'), 'otoño sin resolver: los Junios lo dan por su cuenta'); } } ok(privados === 1, 'se alcanza el otoño sin resolver'); }
// primavera: Senado, pueblo, asamblea
{ let senado = 0, pueblo = 0, cae = 0;
  for (let s = 1; s <= 300; s++) { const e = crear(s); const r = votar(e, 'cruzar', []); if (r.sale) { senado++; ok(e.marcas.via === 'senado', 'vía senado'); } else { ok(e.marcas.pendiente, 'pendiente'); const q = elegir(e, 'pueblo'); if (q.sale) { pueblo++; ok(e.marcas.cruza && e.marcas.via === 'pueblo', 'vía pueblo'); } else { cae++; ok(!e.marcas.cruza, 'asamblea no vota'); } } }
  ok(senado > 0 && pueblo > senado && cae < pueblo / 4, 'primavera: senado ' + senado + ', pueblo ' + pueblo + ', cae ' + cae);
  const e = crear(); e.pueblo = 15; ok(asamblea(e).animo === 'en contra', 'pueblo harto: la asamblea se resiste'); ok(asamblea(crear()).animo === 'a favor', 'pueblo contento: la asamblea va'); }
{ let a = null, b = null; for (let s = 1; s <= 200 && !(a && b); s++) { const e = crear(s); const r = votar(e, 'cruzar', []); if (r.sale && !a) { a = e; } else if (!r.sale && !b) { const q = elegir(e, 'pueblo'); if (q.sale) b = e; } }
  const com = x => { const e = x; ajustar(e, 'nada'); e.marcas.hecho1 = e.marcas.hecho2 = true; e.estacion = 3; e.cerrado = true; return cierre(e); };
  ok(a && b, 'hay caminos por Senado y por pueblo'); if (a && b) { const ca = com(a), cb = com(b); ok(ca.nudos[0].igual && ca.nudos[0].matiz && /pueblo/.test(ca.nudos[0].matiz), 'cruzar por el Senado: igual, con matiz'); ok(cb.nudos[0].igual && !cb.nudos[0].matiz, 'cruzar por el pueblo: igual a la historia, sin matiz'); } }
// el asunto de primavera lleva la nota de Polibio
{ const as = asunto(crear()); ok(/Polibio/.test(as.nota) && /asamblea/.test(as.nota), 'la nota sobre «los muchos» de Polibio'); }

/* ---------- 5. promesas, tratos y nombrar ---------- */
{ let hecho = false; for (let s = 1; s <= 100 && !hecho; s++) { const e = crear(s); ordenar(e, 'consul', 'refuerza'); e.estacion = 1; e.marcas.cruza = true; const mil0 = e.humor.mil; e.promesas.push('botin', 'levas'); const r = votar(e, 'alianza', []); if (r.salio === 'alianza') { hecho = true;
    const rota = r.cambios.find(c => c.nota === 'rota' && c.que === 'mil'); ok(rota && rota.n === -15 && /Rompes tu promesa a los militares/.test(r.linea) && cierre(e).promesas.some(p => p.id === 'botin' && p.estado === 'rota'), 'botín roto con alianza se cobra'); ok(e.humor.mil < mil0 - 5, 'los militares se enfadan'); } } ok(hecho, 'se prueba la promesa rota'); }
{ let hecho = false; for (let s = 1; s <= 200 && !hecho; s++) { const e = crear(s); e.estacion = 1; e.marcas.cruza = true; e.humor.mil = 100; e.promesas.push('botin', 'levas'); const r = votar(e, 'sitio', []); if (r.salio === 'sitio') { hecho = true; ok(r.cambios.some(c => c.que === 'ter' && c.n === -15 && c.nota === 'rota') && cierre(e).promesas.some(p => p.id === 'levas' && p.estado === 'rota') && cierre(e).promesas.some(p => p.id === 'botin' && p.estado === 'cumplida'), 'levas rotas y botín cumplido'); } } ok(hecho, 'se prueba levas rotas'); }
{ const e = crear(); votar(e, 'cruzar', ['mer', 'mer']); ok(e.marcas.tratos.length === 1, 'repetir un bando en la misma lista no falla ni cobra dos veces'); ok(e.oro === 140, 'trato mer cobra 60'); }
{ const e = crear(); e.estacion = 1; e.marcas.cruza = true; votar(e, 'alianza', ['mer']); e.marcas.hecho1 = false; delete e.marcas.pendiente; ok(lanza(() => votar(e, 'sitio', ['mer'])), 'un trato solo una vez al año'); }
{ const e = crear(); e.marcas.contra = true; ok(tratos(e).every(t => t.bloqueado), 'Senado en contra: tratos bloqueados'); ok(lanza(() => votar(e, 'cruzar', ['mer'])), 'con el Senado en contra los tratos no valen'); const a = votos(e, 'cruzar', ['mil', 'mer']), b = votos(e, 'cruzar', []); ok(a.si === b.si && a.duda === b.duda, 'el pronóstico ignora los tratos'); }
{ const e = crear(); const a = nombrar(e, 'edil', 'junio'); ok(a.coste === 0 && e.oro === 200 && e.cargos.edil === 'junio' && e.humor.mer === 50 && e.humor.ter === 50, 'nombrar en primavera es gratis y no da favor');
  nombrar(e, 'edil', 'fabio'); nombrar(e, 'edil', 'junio'); ok(e.humor.mer === 50, 'no se puede sacar partido nombrando de ida y vuelta');
  ajustar(e, 'nada'); cerrarEstacion(e); const oro = e.oro, mil = e.humor.mil; const b = nombrar(e, 'edil', 'duilio'); ok(b.coste === 30 && e.oro === oro - 30 && e.humor.mil === mil + 3, 'nombrar cuesta 30 y da +3 al bando nombrado');
  const e3 = crear(); ajustar(e3, 'nada'); cerrarEstacion(e3); const h3 = structuredClone(e3.humor); nombrar(e3, 'edil', 'junio'); ok(e3.humor.ter === h3.ter - 6 && e3.humor.mer === h3.mer + 3, 'enfada (−6) al bando del destituido');
  const e4 = crear(); e4.estacion = 1; e4.oro = 10; ok(lanza(() => nombrar(e4, 'edil', 'junio')), 'sin oro no se nombra'); }

/* ---------- 6. ciudad, órdenes y candidatos ---------- */
const prom = (n, f) => { let s = 0; for (let i = 1; i <= n; i++) s += f(i); return s / n; };
const anioNada = (mut, sem) => { const e = crear(sem); mut && mut(e); ajustar(e, 'nada'); for (let s = 0; s < 4; s++) { cerrarEstacion(e); sano(e, 'nada' + s); } return e; };
{ const m = (c, o) => prom(40, s => anioNada(e => ordenar(e, c, o), s).ciudad.nivel), obras = m('edil', 'obras'), juegos = m('edil', 'juegos'), grano = m('edil', 'grano');
  ok(obras >= 3 && obras <= 8, 'obras: de 3 a 8 de media (' + obras.toFixed(1) + ')'); ok(juegos < obras - 1 && grano < obras - 1, 'sin obras, menos ciudad (' + juegos.toFixed(1) + ', ' + grano.toFixed(1) + ')');
  const pu = o => prom(40, s => anioNada(e => ordenar(e, 'edil', o), s).pueblo); ok(pu('juegos') > pu('obras'), 'juegos más pueblo que obras'); }
for (const c of ORDEN_CARGOS) { const f = CARGOS[c].ordenes.map(o => prom(30, s => { const e = anioNada(e => ordenar(e, c, o.id), s); return e.oro * 7 + e.pueblo * 13 + e.humor.ter * 3 + e.humor.mer * 5 + e.humor.mil * 11; })); ok(new Set(f.map(x => Math.round(x))).size === 3, 'las tres órdenes de ' + c + ' dan resultados distintos'); }
for (const c of ORDEN_CARGOS) { const f = candidatos(crear(), c).map(p => prom(30, s => { const e = anioNada(e => { e.cargos[c] = p.id; }, s); return e.oro * 7 + e.pueblo * 13 + e.humor.ter * 3 + e.humor.mer * 5 + e.humor.mil * 11; })); ok(candidatos(crear(), c).length === 3 && new Set(f.map(x => Math.round(x))).size === 3, 'los tres candidatos de ' + c + ' dan resultados distintos'); }
{ const ds = (c, o) => prom(30, s => anioNada(e => ordenar(e, c, o), s).oro); ok(ds('cuestor', 'ahorra') - ds('cuestor', 'gasta') >= 60, 'cuestor: ahorrar o gastar se nota (≥60 de oro de media)'); }

/* ---------- 7. personajes, fuentes y dictamen en todo ---------- */
{ ok(PERSONAS.length === 15 && PERSONAS.every(p => p.id && p.nombre && p.bando && p.habil >= 1 && p.habil <= 3 && p.bueno.titulo && p.malo.texto && p.nota && p.fuente && p.dictamen), '15 personajes completos'); const e = crear();
  ok(ORDEN_CARGOS.every(c => candidatos(e, c).filter(x => x.ocupa).length === 1), 'cada cargo tiene un ocupante');
  ok(CARGOS.consul.ordenes.length === 3 && Object.values(CARGOS).every(c => c.latin && c.lleva && c.ordenes.every(o => o.id && o.titulo && o.texto)), 'cargos con orden'); }
for (const [cruza, p] of [[true, 0], [true, 1], [false, 1], [true, 2], [true, 3]]) { const e = crear(); e.estacion = p; e.marcas.cruza = cruza; const s = asunto(e); ok(s.fuente && s.dictamen && s.fecha && s.texto, 'fuente y dictamen en ' + s.id); }
ok(CONSULTAS.length === 14 && CONSULTAS.every(c => c.fuente && /licencia de juego: asunto típico/.test(c.dictamen) && c.opciones.length === 2 && c.opciones.every(o => lanza(() => 0) || Object.keys(o.ef).length) && ORDEN_CARGOS.includes(c.cargo) && ['ahorra', 'justo', 'gasta', 'obras', 'grano', 'juegos', 'dura', 'igual', 'aliados', 'estricto', 'antiguas', 'abre', 'prudente', 'refuerza', 'ataque'].some(k => c.elige[k])), 'mazo de 14 asuntos con fuente y dictamen');
ok(VISITAS.length >= 10 && VISITAS.filter(v => v.tipo === 'pide').length >= 5 && VISITAS.filter(v => v.tipo === 'choque').length >= 4 && VISITAS.every(v => v.fuente && /licencia de juego/.test(v.dictamen)), 'visitas con fuente y dictamen');
{ const tipos = new Set(); let ver = 0;
  for (let s = 1; s <= 60; s++) { const e = crear(s); ajustar(e, 'nada'); const ts = []; for (let k = 0; k < 3; k++) { const cs = consultas(e); ok(cs.length === 2 && cs[0].cargo !== cs[1].cargo && cs.every(c => c.opciones.length === 2 && c.opciones.every(o => o.chips.length) && c.fuente && c.dictamen), 'dos consultas de cargos distintos en ' + k);
      const v = visita(e); ok(v && v.opciones.length === 2 && v.opciones.every(o => o.chips.length && o.titulo) && v.fuente && v.dictamen && v.persona && (v.tipo === 'pide' || (v.cargoB && v.personaB)) && !v.atendida, 'visita completa'); ts.push(v.tipo); cerrarEstacion(e); }
    ok(ts.includes('pide') && ts.includes('choque'), 'al menos una visita de cada tipo en el año: ' + ts); ver++; }
  ok(ver === 60, 'visitas de ambos tipos en 60 años'); }
{ const cs = new Set(); for (let s = 1; s <= 300; s++) { const e = crear(s); if (e.sorteo.consultas.flat().includes('remeros')) mal.push('remeros sin cruzar en primavera'); ajustar(e, 'nada'); cerrarEstacion(e); if (!e.marcas.cruza && e.sorteo.consultas.flat().includes('remeros')) mal.push('remeros sin cruzar'); } }
{ const e = crear(4); const v = visita(e); const op = v.opciones[0]; const antes = JSON.stringify([e.oro, e.pueblo]); const r = atender(e, op.id); ok(r.linea && Array.isArray(r.cambios) && visita(e).atendida, 'atender aplica y marca'); ok(lanza(() => atender(e, op.id)), 'no se atiende dos veces'); ok(lanza(() => atender(crear(4), 'zz')), 'opción de visita inválida falla'); }

/* ---------- 8. castigos y veredicto ---------- */
{ const e = crear(); ajustar(e, 'nada'); e.oro = 0; const p = cerrarEstacion(e); ok(e.sucesos.some(s => s.id === 'arca') && p.sucesos.length >= 1, 'arca vacía: suceso apuntado'); ok(e.marcas.progreso <= 0 || e.ciudad.obras.length === 0, 'arca vacía: la obra se para'); ok(e.sucesos.every(s => s.estacion === 0 && s.id && s.titulo && s.texto && Array.isArray(s.cambios)), 'sucesos bien formados'); }
{ const e = crear(); ajustar(e, 'nada'); e.pueblo = 10; cerrarEstacion(e); ok(e.sucesos.some(s => s.id === 'tumulto') && /Janículo/.test(e.sucesos.find(s => s.id === 'tumulto').texto), 'pueblo harto: tumulto'); ok(e.marcas.progreso === 0, 'tumulto: se pierde la obra en curso'); }
{ const e = crear(); ajustar(e, 'nada'); e.humor = { ter: 20, mer: 20, mil: 20 }; cerrarEstacion(e); ok(e.sucesos.some(s => s.id === 'contra') && e.marcas.contra, 'Senado en contra: apuntado y activo'); const v = veredicto(e); ok(v.juicio === undefined || v.juicio.multa > 0, 'juicio con multa si lo hay'); }
{ const e = crear(); const v = veredicto(e); ok(v && v.grado && v.causas.length, 'veredicto no rompe antes de cerrar'); cierre(e); }
{ const e = crear(); ajustar(e, 'nada'); e.humor = { ter: 5, mer: 5, mil: 5 }; e.pueblo = 10; for (let k = 0; k < 4; k++) cerrarEstacion(e); const v = veredicto(e); ok(v.grado === 'casa' && v.titulo === 'A casa' && v.desastres >= 2 && e.sucesos.some(x => x.continua) && v.juicio && v.juicio.multa && /Postumio/.test(v.juicio.texto), 'dos desastres: a casa, con juicio'); ok(/Livio 7.42/.test(v.dictamen) && /licencia de juego/.test(v.dictamen), 'dictamen del veredicto'); }
{ let fl = 0, partes = 0; for (let s = 1; s <= 100; s++) { const e = juega(cabeza(false), s); for (const d of e.despachos) { partes++; if (d.fallo) { fl++; ok(/no ha|no he|no hemos|se me|tropezado|cruzado|enredado|atascado|parado/i.test(d.texto), 'el parte de un fallo lo dice en llano'); } } } ok(fl > 0 && fl < partes * 0.3, 'los magistrados a veces fallan (' + fl + ' de ' + partes + ')'); }
ok(mal.length === 0, 'estados sanos: ' + mal.slice(0, 3).join(' | '));

/* ---------- 9. los robots ---------- */
const N = 1000, ROBOTS = [['sin tocar', SINTOCAR], ['al azar', AZAR], ['con cabeza', cabeza(false)], ['sigue la historia', cabeza(true)]], res = {};
console.log('\nRobot              honores  gris  casa   nota(med)  oro(med)  pueblo(med)  obras(med)');
for (const [nombre, rb] of ROBOTS) {
  const g = { honores: 0, gris: 0, casa: 0 }, notas = [], oros = [], pus = [], obs = [], rumbos = new Set();
  for (let s = 1; s <= N; s++) { const e = juega(rb, s), v = veredicto(e); g[v.grado]++; notas.push(v.nota); oros.push(e.oro); pus.push(e.pueblo); obs.push(e.ciudad.nivel); if (nombre === 'al azar') rumbos.add(cierre(e).rumbo.id); }
  res[nombre] = { ...Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v / N * 100])), nota: mediana(notas), media: notas.reduce((a, b) => a + b, 0) / N, rumbos };
  const p = k => (g[k] / N * 100).toFixed(1).padStart(5) + '%'; console.log(nombre.padEnd(18) + p('honores') + ' ' + p('gris') + ' ' + p('casa') + '   ' + String(mediana(notas)).padStart(6) + '     ' + String(mediana(oros)).padStart(6) + '    ' + String(mediana(pus)).padStart(6) + '       ' + String(mediana(obs)).padStart(6));
}
const R1 = res['sin tocar'], R2 = res['al azar'], R3 = res['con cabeza'], R4 = res['sigue la historia'];
ok(R1.casa >= 80 && R1.honores <= 1, 'sin tocar: a casa ≥ 80 % y honores ≤ 1 % (' + R1.casa.toFixed(1) + ' / ' + R1.honores.toFixed(1) + ')');
ok(R2.gris > R2.casa && R2.gris > R2.honores && R2.honores < 20 && R2.casa >= 15 && R2.casa <= 50, 'al azar: lo más frecuente «Año gris», honores < 20 %, a casa 15–50 % (' + R2.honores.toFixed(1) + ' / ' + R2.gris.toFixed(1) + ' / ' + R2.casa.toFixed(1) + ')');
ok(R3.honores >= 55 && R3.honores <= 92 && R3.casa <= 8, 'con cabeza: honores 55–92 %, a casa ≤ 8 % (' + R3.honores.toFixed(1) + ' / ' + R3.casa.toFixed(1) + ')');
ok(R4.media >= R3.media - 5, 'sigue la historia: nota media no más de 5 por debajo de con cabeza (' + R4.media.toFixed(1) + ' frente a ' + R3.media.toFixed(1) + ')');
ok(R2.rumbos.size === 6, 'el robot al azar alcanza los 6 rumbos (' + R2.rumbos.size + ')');
const seg = (Date.now() - t0) / 1000; console.log('\nTiempo: ' + seg.toFixed(1) + ' s'); ok(seg < 20, 'la prueba tarda menos de 20 s (' + seg.toFixed(1) + ')');
// Truco que cazó el revisor (16/11): sin votar nada, nombrar a todos en primavera y atender las visitas con la primera opción no debe dar honores
{ let h = 0, err = 0; for (let sm = 1; sm <= 500; sm++) { const e = R.crear(sm); R.ajustar(e, 'nada'); for (const c of R.ORDEN_CARGOS) for (const p of R.candidatos(e, c)) R.nombrar(e, c, p.id);
    for (let k = 0; k < 4; k++) { const v = R.visita(e); if (v && !v.atendida) R.atender(e, v.opciones[0].id); R.cerrarEstacion(e); } if (R.veredicto(e).grado === 'honores') h++; }
  ok(h <= 25, 'truco «nombrar a todos y atender sin votar»: honores ≤ 5 % (' + (h / 5).toFixed(1) + ' %)'); console.log('Truco sin votar: honores ' + (h / 5).toFixed(1) + ' %');
  for (let sm = 1; sm <= 300; sm++) { const e = R.crear(sm); const r = R.votar(e, 'cruzar', []); if (!r.sale) { R.ajustar(e, 'nada'); try { R.cerrarEstacion(e); } catch (_) { err++; } } } ok(err === 0, 'pasar a «nada» con el voto caído no rompe el cierre (' + err + ')'); }
console.log(fallos ? 'NO APTO · ' + fallos + ' fallos' : 'APTO'); process.exit(fallos ? 1 : 0);
