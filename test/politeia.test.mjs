// AQVILA — PL1+PL2 Politeia: reglas del año político. node test/politeia.test.mjs
// PL2 cambia en los de PL1: el duelo y el juicio esperan al jugador (sus pasos no cuentan como los 3 de la estación), hay 10 personas (2 de tu casa),
// negar/verdad/callar/mentir no cuestan plata ni fama al darlas (su precio está en el efecto) y los bots juegan el duelo y el juicio.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const PO = require('../js/politeia.js'); const DA = require('../js/politeia-datos.js');
let mal = 0; const ok = (c, t) => { if (!c) mal++; console.log((c ? 'bien  ' : 'MAL   ') + t); };
let FALLOS = 0;
const SEMILLAS = Array.from({ length: 20 }, (_, i) => i + 1);

// Tres bots: cada uno mira solo P y devuelve [id, objetivo] o null (pasar).
const masInfluyente = (P, a) => a.objetivos.slice().sort((x, y) => P.casas[y].influencia - P.casas[x].influencia)[0];
const PUNTOS = { favor: 5, espiar: 5, orador: 5, ostracismo: 5, ofrenda: 4, discurso: 4, contraatacar: 6, negar: 5, dar_cuentas: 4, hablar: 3, banquete: 3, convencer: 3, enviado: 2 };
// Duelo y juicio. Listo: pregunta con prueba y dice la verdad ante el aire o calla ante la prueba. Tramposo: pregunta lo que sea y miente.
const conPrueba = a => a.objetivos.find(x => x !== 'aire') || 'aire';
const listo = P => {
  if (P.duelo) { const as = PO.acciones(P); const p = as.find(x => x.id === 'preguntar'); if (p) return ['preguntar', conPrueba(p)]; if (!as.length) return null; return [P.duelo.pend.obj === 'aire' ? 'verdad' : 'callar']; }
  let mejor = null;
  for (const a of PO.acciones(P)) { const pt = PUNTOS[a.id] || 0; if (pt && (!mejor || pt > mejor.pt)) mejor = { a, pt }; }
  if (!mejor) return null;
  const a = mejor.a; let o = a.objetivos ? a.objetivos[0] : undefined;
  if (['banquete', 'convencer', 'ostracismo'].includes(a.id)) o = masInfluyente(P, a);
  if (a.id === 'espiar') o = P.rivales.slice().sort((x, y) => P.sabidos.filter(z => z.casa === x).length - P.sabidos.filter(z => z.casa === y).length)[0];
  if (a.id === 'orador') o = 'eufemo';
  if (a.id === 'contraatacar') o = a.objetivos[0];
  if (a.id === 'hablar') o = a.objetivos.find(x => x.endsWith(':+'));
  return [a.id, o];
};
const pasivo = () => null;
const tramposo = P => {
  const as = PO.acciones(P);
  if (P.duelo) { const p = as.find(x => x.id === 'preguntar'); if (p) return ['preguntar', conPrueba(p)]; return as.length ? ['mentir'] : null; }
  const atajo = { 0: 'pagar', 1: 'rumor', 2: 'comprar', 3: 'pagar_jueces' }[P.estacion];
  const orden = (P.pasos === 3 ? [atajo] : []).concat(P.estacion === 3 ? ['negar'] : [], ['espiar', 'orador', 'dar_cuentas', 'enviado']);
  for (const id of orden) { const a = as.find(x => x.id === id); if (a) return [id, a.objetivos ? (id === 'orador' ? 'eufemo' : a.objetivos[0]) : undefined]; }
  return null;
};
// Juega un año entero. «cada» se llama antes de cada paso (para vigilar el estado).
function juega(P, bot, cada, tope) {
  const pasosPorEst = [0, 0, 0, 0]; let n = 0;
  while (!P.fin && n < 80 && (tope == null || n < tope)) {
    if (cada) cada(P); const est = P.estacion, duelo = !!P.duelo;
    const m = bot(P); let r = m ? PO.jugar(P, m[0], m[1]) : PO.pasar(P);
    if (!r.ok) { if (m) FALLOS++; r = PO.pasar(P); }
    if (!duelo) pasosPorEst[est]++; n++;
  }
  return { pasosPorEst, n };
}

// CA1 — el año acaba sin error y pasa por las cuatro estaciones con 3 pasos cada una
{
  let errores = 0, orden = true, fines = 0, completos = 0;
  for (const bot of [listo, pasivo]) for (const s of SEMILLAS) {
    try {
      const P = PO.nueva({ polis: 'atenas', semilla: s }); const r = juega(P, bot);
      if (P.fin) fines++;
      if (r.pasosPorEst.some(x => x > 3)) orden = false;
      if (P.fin && P.fin.resultado === 'sigue') { completos++; if (r.pasosPorEst.join() !== '3,3,3,3') orden = false; }
      else { const a = r.pasosPorEst; for (let i = 1; i < 4; i++) if (a[i] > 0 && a[i - 1] < 3) orden = false; }
    } catch (e) { errores++; console.log('   error: ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
  ok(errores === 0, 'PL1 CA1 listo y pasivo juegan 20 semillas sin error');
  ok(fines === 40, 'PL1 CA1 los 40 años acaban con un final (' + fines + '/40; completos ' + completos + ')');
  ok(orden, 'PL1 CA1 cuatro estaciones en orden y 3 pasos cada una');
}
// CA2 — cinco casas, ocho personas, dos rivales que juegan cada estación
{
  let casas = true, pers = true, riv = true, juegan = true, tuvieron = 0;
  for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo);
    if (Object.keys(P.casas).length !== 5 || !P.casas.tuya) casas = false;
    if (P.personas.length !== 10 || P.personas.some(p => !p.nombre)) pers = false;
    if (P.rivales.length !== 2 || P.rivales[0] === P.rivales[1] || P.rivales.includes('tuya') || P.rivales.some(r => !P.casas[r])) riv = false;
    const hasta = P.fin ? P.fin.estacion : 4;
    for (let e = 0; e < hasta; e++) for (const r of P.rivales) { tuvieron++; if (!P.cronica.some(c => c.estacion === e && c.quien === r)) juegan = false; }
  }
  ok(casas && DA.polis.atenas.casas.length === 5, 'PL1 CA2 hay 5 casas (4 + la tuya)');
  ok(pers && DA.polis.atenas.personas.length === 10, 'PL1 CA2 hay 10 personas con nombre (8 de PL1 + 2 de tu casa)');
  ok(riv, 'PL1 CA2 en cada partida 2 de las 4 casas son rivales');
  ok(juegan && tuvieron > 0, 'PL1 CA2 cada rival juega en cada estación (' + tuvieron + ' comprobaciones)');
}
// CA3 — todo cuesta (sin contar el paso), alguien sale perjudicado, nada negativo
{
  let costes = true, perj = true, neg = true, disc = true, votos = 0, acc = 0; const vistas = new Set();
  const vigila = P => {
    for (const a of PO.acciones(P)) { acc++; vistas.add(a.id); if (!['verdad', 'callar', 'mentir', 'negar'].includes(a.id) && !Object.entries(a.coste).some(([k, v]) => k !== 'pasos' && v > 0)) costes = false; }
    for (const c of Object.values(P.casas)) if (c.plata < 0 || c.influencia < 0) neg = false;
    if (P.discordia < 0 || P.discordia > 6) disc = false;
  };
  for (const bot of [listo, pasivo, tramposo]) for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, bot, vigila); vigila(P);
    for (const v of P.votos) { votos++; if (!v.perjudicadas.length) perj = false; }
  }
  ok(costes && acc > 0 && vistas.size >= 13, 'PL1 CA3 toda acción tiene coste (' + vistas.size + ' acciones distintas vistas)');
  ok(perj && votos > 0, 'PL1 CA3 todo asunto votado perjudica a alguna casa (' + votos + ' votos)');
  ok(neg, 'PL1 CA3 plata e influencia nunca negativas');
  ok(disc, 'PL1 CA3 discordia siempre entre 0 y 6');
  ok(FALLOS === 0, 'PL1 CA3 toda acción ofrecida por acciones() se puede jugar (fallos: ' + FALLOS + ')');
  let rep = true, trasFin = true;
  for (const bot of [listo, pasivo, tramposo]) for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, bot);
    const vistos = new Set(); for (const c of P.cronica) { if (c.quien === 'tuya') continue; const k = c.estacion + c.texto; if (vistos.has(k)) rep = false; vistos.add(k); }
    if (P.fin && P.fin.resultado !== 'sigue') { const u = P.cronica[P.cronica.length - 1]; if (u.quien !== 'ciudad' || P.fin.cronica.indexOf(u.texto) < 0) trasFin = false; }
  }
  ok(rep, 'PL1 CA3 ninguna línea de la crónica (rivales y ciudad) se repite en la misma estación');
  ok(trasFin, 'PL1 CA3 tras revuelta o destierro no hay líneas después de la última');
  const asu = DA.polis.atenas.asuntos;
  ok(asu.length === 8 && asu.every(a => a.etiqueta && a.fuente && a.efectos.si.perjudica.length && a.efectos.no.perjudica.length), 'PL1 CA3 8 asuntos con etiqueta, fuente y perjudicados');
}
// CA4 — dos partidas cuentan historias distintas
{
  const firmas = new Set(), cr = {};
  for (const s of SEMILLAS) { const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo); firmas.add(PO.firma(P)); if (s < 3) cr[s] = P.cronica.map(c => c.texto).join('\n'); }
  ok(firmas.size >= 16, 'PL1 CA4 al menos 16 crónicas distintas en 20 semillas (' + firmas.size + ')');
  ok(cr[1] !== cr[2], 'PL1 CA4 las semillas 1 y 2 dan crónicas distintas');
}
// CA5 — se puede perder
{
  let des = 0, bien = true;
  for (const s of SEMILLAS) { const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, tramposo); if (P.fin && P.fin.resultado === 'desterrado') des++; else if (!P.fin) bien = false; }
  ok(des >= 1 && bien, 'PL1 CA5 el tramposo acaba desterrado en ' + des + ' de 20 semillas');
}
// CA6 — determinista, guardable, sin pantalla ni Math.random, rápido
{
  const a = PO.nueva({ polis: 'atenas', semilla: 7 }), b = PO.nueva({ polis: 'atenas', semilla: 7 }); juega(a, listo); juega(b, listo);
  ok(JSON.stringify(a) === JSON.stringify(b), 'PL1 CA6 misma semilla y mismas jugadas, mismo final');
  let igual = true;
  for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo, null, 5);
    const Q = JSON.parse(JSON.stringify(P)); juega(P, listo); juega(Q, listo);
    if (JSON.stringify(P) !== JSON.stringify(Q)) igual = false;
  }
  ok(igual, 'PL1 CA6 guardar a mitad con JSON y seguir da el mismo final (20 semillas)');
  const fuente = ['../js/politeia.js', '../js/politeia-datos.js'].map(f => fs.readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
  ok(!/\bdocument\b|\bwindow\b|Math\.random/.test(fuente), 'PL1 CA6 los módulos no usan document, window ni Math.random');
  juega(PO.nueva({ semilla: 1 }), listo);
  let max = 0; for (const s of SEMILLAS) { const t0 = process.hrtime.bigint(); juega(PO.nueva({ semilla: s }), listo); max = Math.max(max, Number(process.hrtime.bigint() - t0) / 1e6); }
  ok(max < 200, 'PL1 CA6 un año del bot tarda ' + max.toFixed(1) + ' ms (< 200)');
}
// ====================== PL2: secretos, duelo, piedras, tribunal ======================
const BOTS = { listo, pasivo, tramposo }; const ATAJOS = ['pagar', 'rumor', 'comprar', 'pagar_jueces'];
const R = {}; // reparto por bot
const vistas = { duelo: new Set(), juicio: new Set(), respRival: new Set(), respTuya: new Set(), veredictos: new Set() };
let malSec = 0, malAcus = 0, malPreg = 0, malFase = 0, malJuez = 0, malCosto = 0, malPiedras = 0, atajos = 0, pillado = 0, errores = 0;
for (const nb of Object.keys(BOTS)) {
  const r = R[nb] = { ganados: 0, perdidos: 0, juicios: 0, tipos: { limpio: 0, multa: 0, cargo: 0, destierro: 0, ninguno: 0 }, fin: { sigue: 0, desterrado: 0, revuelta: 0 }, cronicas: [] };
  for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s });
    const cada = Q => {
      if (Q.duelo) {
        const as = PO.acciones(Q), ids = as.map(a => a.id).join();
        if (Q.duelo.fase === 'tuya' && !(ids === 'preguntar' || ids === '')) malFase++;
        if (Q.duelo.fase === 'rival' && ids !== 'verdad,callar,mentir') malFase++;
        if (Q.duelo.fase === 'tuya' && as[0]) for (const o of as[0].objetivos) {
          if (o === 'aire') continue;
          if (o === 'grieta') { if (!Q.sabidos.some(x => x.casa === Q.duelo.rival && !x.sec)) malPreg++; continue; }
          const sc = Q.secretos.find(x => x.id === o.slice(4)); if (!sc || sc.de !== Q.duelo.rival || !sc.sabe.includes('tuya')) malPreg++;
        }
        if (Q.duelo.pend && Q.duelo.pend.obj !== 'aire') { const sc = Q.secretos.find(x => x.id === Q.duelo.pend.obj.slice(4)); if (!sc || sc.de !== 'tuya' || !sc.sabe.includes(Q.duelo.rival)) malPreg++; }
        vistas.duelo.add(Q.duelo.fase);
      }
      if (Q.juicio) {
        const J = Q.juicio; vistas.juicio.add('juicio'); if (J.jueces.length !== 5 || J.jueces.some(j => j.inc < -1 || j.inc > 1)) malJuez++;
        for (const i of J.cargos) { const sc = Q.secretos.find(x => x.id === i); if (!sc || sc.de !== 'tuya' || !(sc.sabe.includes(J.acusador) || sc.fuera)) malAcus++; }
        for (const a of PO.acciones(Q)) vistas.juicio.add(a.id);
      }
      JSON.parse(JSON.stringify(Q));
      for (const x of Q.secretos) if (x.sabe.some(c => c !== 'tuya' && !Q.casas[c]) || (x.de === 'tuya' && x.sabe.includes('tuya'))) malSec++;
    };
    try {
      let n = 0;
      while (!P.fin && n++ < 80) {
        cada(P); const m = BOTS[nb](P);
        const antes = P.secretos.filter(x => x.de === 'tuya').length, esAtajo = m && ATAJOS.includes(m[0]) && PO.acciones(P).some(a => a.id === m[0]);
        const rr = m ? PO.jugar(P, m[0], m[1]) : PO.pasar(P); if (!rr.ok) PO.pasar(P);
        if (esAtajo && rr.ok) { atajos++; if (P.secretos.filter(x => x.de === 'tuya').length !== antes + 1) malSec++; }
      }
    } catch (e) { errores++; console.log('   error PL2 ' + nb + ' ' + s + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
    for (const v of P.votos) {
      if (v.gana) r.ganados++; else r.perdidos++;
      for (const x of v.duelo) {
        (x.r === 'rival' ? vistas.respRival : vistas.respTuya).add(x.resp);
        if (!x.fama && !x.mio && !x.suyo) malCosto++;
        if (x.resp === 'mentir' && x.prueba) { pillado++; if (x.mio > -3 || x.fama > -2) malCosto++; }
      }
      if (typeof v.piedras.si !== 'number' || typeof v.piedras.no !== 'number' || !Array.isArray(v.duelo)) malPiedras++;
    }
    if (P.veredicto) { r.tipos[P.veredicto.tipo]++; vistas.veredictos.add(P.veredicto.tipo); if (P.veredicto.tipo !== 'ninguno') r.juicios++; }
    r.fin[P.fin.resultado]++; r.cronicas.push(P.cronica.map(c => c.texto).join('\n'));
  }
}
console.log('\n--- Reparto por bot (20 semillas) ---');
for (const nb of Object.keys(R)) { const r = R[nb]; console.log(nb.padEnd(9) + 'debates ganados ' + r.ganados + ' / perdidos ' + r.perdidos + ' · juicios ' + r.juicios + ' (limpio ' + r.tipos.limpio + ', multa ' + r.tipos.multa + ', cargo perdido ' + r.tipos.cargo + ', destierro ' + r.tipos.destierro + ', sin juicio ' + r.tipos.ninguno + ') · año: ' + JSON.stringify(r.fin)); }
ok(errores === 0 && malSec === 0 && atajos > 0, 'PL2 CA1 cada atajo tuyo apunta un secreto y los secretos solo los saben casas que existen (' + atajos + ' atajos)');
ok(malAcus === 0 && malPreg === 0 && vistas.juicio.has('juicio'), 'PL2 CA1 acusaciones y preguntas del rival solo con secretos tuyos reales que sabe; las tuyas, con lo que sabes (fallos ' + (malAcus + malPreg) + ')');
ok(malFase === 0 && vistas.duelo.has('tuya') && vistas.duelo.has('rival'), 'PL2 CA2 en el duelo acciones() solo da preguntar, y luego verdad/callar/mentir');
ok(['verdad', 'callar', 'mentir'].every(x => vistas.respRival.has(x)) && ['verdad', 'callar', 'mentir'].every(x => vistas.respTuya.has(x)), 'PL2 CA2 el rival responde de los tres modos y tú también (' + [...vistas.respRival] + ' / ' + [...vistas.respTuya] + ')');
{
  let ok2 = true, dos = true, asuntos = 0;
  for (const s of SEMILLAS) { const Q = PO.nueva({ semilla: s }); juega(Q, listo); for (const v of Q.votos) { asuntos++; if (v.duelo.filter(x => x.q === 'tuya').length !== 2) dos = false; if (!v.piedras || !v.duelo) ok2 = false; } }
  ok(dos && ok2 && asuntos > 0 && malPiedras === 0, 'PL2 CA2 el bot listo hace dos preguntas por asunto y P.votos guarda piedras y detalle del duelo (' + asuntos + ' asuntos)');
  const Q = PO.nueva({ semilla: 4 }); let n = 0; while (!Q.fin && !Q.duelo && n++ < 40) { const m = listo(Q); const r2 = m ? PO.jugar(Q, m[0], m[1]) : PO.pasar(Q); if (!r2.ok) PO.pasar(Q); }
  const A = JSON.parse(JSON.stringify(Q)); juega(Q, listo); juega(A, listo);
  ok(!!Q.fin && Q.votos.length > 0 && JSON.stringify(Q) === JSON.stringify(A), 'PL2 CA7 guardar con JSON en pleno duelo y seguir da el mismo final');
}
ok(malCosto === 0 && pillado > 0, 'PL2 CA3 cada respuesta del duelo cuesta (fama, piedras o secreto) y mentir con prueba sale caro: −3 piedras y −2 de fama (' + pillado + ' pillados)');
{
  let sinAcus = true;
  for (const s of SEMILLAS) { const P = PO.nueva({ semilla: s }); juega(P, pasivo); if ((P.veredicto && P.veredicto.tipo !== 'ninguno') || P.secretos.some(x => x.de === 'tuya')) sinAcus = false; }
  ok(sinAcus, 'PL2 CA4 sin secretos tuyos no hay acusación ni juicio (el bot pasivo, 20 semillas)');
  ok(malJuez === 0 && ['negar', 'pagar_jueces', 'contraatacar'].every(x => vistas.juicio.has(x)), 'PL2 CA4 con acusación hay 5 jueces con inclinación y las tres defensas (' + [...vistas.juicio] + ')');
  ok(vistas.veredictos.size >= 4, 'PL2 CA4 salen al menos 3 de los 4 veredictos, más «sin juicio» (' + [...vistas.veredictos] + ')');
  const Q = PO.nueva({ semilla: 5 }); let n = 0; while (!Q.fin && !Q.juicio && n++ < 60) { const m = tramposo(Q); const r2 = m ? PO.jugar(Q, m[0], m[1]) : PO.pasar(Q); if (!r2.ok) PO.pasar(Q); }
  const A = JSON.parse(JSON.stringify(Q)); juega(Q, tramposo); juega(A, tramposo);
  ok(!!Q.fin && n < 60 && JSON.stringify(Q) === JSON.stringify(A), 'PL2 CA7 guardar con JSON en pleno juicio y seguir da el mismo final (semilla 5)');
}
{
  const g = nb => R[nb].ganados, d = nb => R[nb].fin.desterrado;
  ok(g('listo') > g('pasivo'), 'PL2 CA5 el listo gana más debates que el pasivo (' + g('listo') + ' contra ' + g('pasivo') + ')');
  ok(d('listo') < d('tramposo'), 'PL2 CA5 el listo es desterrado menos que el tramposo (' + d('listo') + ' contra ' + d('tramposo') + ')');
  ok(g('tramposo') >= 1 && R.tramposo.juicios - R.tramposo.tipos.limpio >= 1, 'PL2 CA5 el tramposo gana algún debate (' + g('tramposo') + ') y pierde algún juicio (' + (R.tramposo.juicios - R.tramposo.tipos.limpio) + ')');
  ok(Object.keys(R).every(nb => R[nb].ganados > 0 && R[nb].perdidos > 0), 'PL2 CA5 ningún bot gana o pierde todos los debates');
  ok(R.tramposo.tipos.limpio > 0, 'PL2 CA5 al tramposo a veces lo absuelven (' + R.tramposo.tipos.limpio + ')');
}
{
  const cr = new Set(R.listo.cronicas); let distintas = true;
  for (let i = 0; i < SEMILLAS.length; i++) if (R.listo.cronicas[i] === R.tramposo.cronicas[i]) distintas = false;
  console.log('Crónicas distintas del listo: ' + cr.size + ' de 20 · listo y tramposo distintos en la misma semilla: ' + distintas);
  ok(cr.size === 20, 'PL2 CA6 20 de 20 semillas dan crónica distinta');
  ok(distintas, 'PL2 CA6 en cada semilla, listo y tramposo dejan crónicas distintas');
}

// ---- PL4: santuario, puerto, tribunal, vasija e hitos ----
{
  const verano = sem => { const P = PO.nueva({ semilla: sem }); let n = 0; while (!P.fin && P.estacion < 1 && n++ < 20) PO.pasar(P); P.casas.tuya.plata = 300; P.casas.tuya.fama = 5; P.pasos = 3; return P; };
  const P0 = verano(3); const ids = PO.acciones(P0).map(a => a.id);
  ok(P0.v === 3 && ['oraculo', 'inclinar', 'huesped', 'boda', 'ofrenda', 'enviado'].every(x => ids.includes(x)), 'PL4 en verano salen oráculo, regalo, huésped y boda (' + ids.join(',') + ')');
  ok(!PO.acciones(PO.nueva({ semilla: 3 })).some(a => ['oraculo', 'inclinar', 'huesped', 'boda'].includes(a.id)), 'PL4 en primavera no están');
  // oráculo: una vez al año; a veces añade a sabidos; siempre dice una frase
  let con = 0, sin = 0, frases = true, una = true;
  for (const s of SEMILLAS) {
    const P = verano(s), n0 = P.sabidos.length; const r = PO.jugar(P, 'oraculo');
    if (!r.ok || !P.oraculo || !P.oraculo.frase || !/«/.test(r.texto)) frases = false;
    if (P.sabidos.length > n0) { con++; if (!P.sabidos.some(x => x.oraculo)) frases = false; } else sin++;
    if (PO.acciones(P).some(a => a.id === 'oraculo')) una = false;
  }
  ok(frases && una && con > 0 && sin > 0, 'PL4 el oráculo se consulta una vez al año, dice su frase y a veces (' + con + ' de 20) añade a lo que sabes');
  { const P = verano(3); PO.jugar(P, 'inclinar'); ok(P.ventaja === 2 && P.secretos.some(x => x.de === 'tuya' && x.t === 'compró al oráculo') && P.casas.tuya.plata === 270, 'PL4 el regalo al oráculo da +2 de ventaja y deja un secreto tuyo'); }
  // huésped y boda
  { const P = verano(3), a = PO.acciones(P).find(x => x.id === 'huesped');
    ok(a && ['corinto', 'egina', 'megara'].every(x => a.objetivos.includes(x)), 'PL4 el huésped ofrece Corinto, Egina y Mégara');
    const f0 = P.casas.tuya.fama; const r = PO.jugar(P, 'huesped', 'corinto');
    ok(r.ok && P.huesped.polis === 'corinto' && P.casas.tuya.fama === f0 - 1 && !PO.acciones(P).some(x => x.id === 'huesped'), 'PL4 el huésped queda en P.huesped y solo uno al año'); }
  { const efectos = new Set(); const foto = P => JSON.stringify([P.casas.tuya.plata, P.ventaja, Object.values(P.casas).map(c => c.trato), P.sabidos.length]);
    for (const v of ['corinto', 'egina', 'megara']) { const P = verano(5), t0 = foto(P); PO.jugar(P, 'huesped', v); efectos.add(foto(P)); ok(foto(P) !== t0, 'PL4 el huésped de ' + v + ' cambia algo'); }
    ok(efectos.size === 3, 'PL4 cada huésped tiene un efecto distinto'); }
  { const P = verano(3), a = PO.acciones(P).find(x => x.id === 'boda'); let c = a && a.objetivos[0];
    if (!c) { P.casas.caballo.trato = 0; c = 'caballo'; }
    const antes = {}; for (const i of Object.keys(P.casas)) antes[i] = P.casas[i].trato; const pl = P.casas.tuya.plata;
    const r = PO.jugar(P, 'boda', c); const bajan = Object.keys(P.casas).filter(i => i !== 'tuya' && i !== c && P.casas[i].trato < antes[i]);
    ok(r.ok && P.casas[c].trato === Math.min(3, antes[c] + 2) && P.casas.tuya.plata === pl - 30 && P.boda.casa === c && bajan.length <= 1 && !PO.acciones(P).some(x => x.id === 'boda'), 'PL4 la boda sube +2 el trato con ' + c + ', ofende a otra casa y es una al año'); }
  { const P = verano(3); ok(PO.acciones(P).find(x => x.id === 'boda').objetivos.every(c => P.casas[c].trato >= 0), 'PL4 la boda solo se ofrece a casas con trato ≥ 0'); }
  // testigo
  { let probado = 0, bien = true, sinHuesped = true;
    for (const s of SEMILLAS) {
      const P = verano(s); PO.jugar(P, 'huesped', 'egina'); const P2 = JSON.parse(JSON.stringify(P)); P2.huesped = null;
      for (const Q of [P, P2]) { let n = 0; while (!Q.fin && !Q.juicio && n++ < 60) { const m = tramposo(Q); const r = m ? PO.jugar(Q, m[0], m[1]) : PO.pasar(Q); if (!r.ok) PO.pasar(Q); } }
      if (P.juicio) {
        if (P2.juicio && PO.acciones(P2).some(a => a.id === 'testigo')) sinHuesped = false;
        const t = PO.acciones(P).find(a => a.id === 'testigo'); if (!t) { if (P.juicio.jueces.some(j => j.inc < 1)) bien = false; continue; }
        const suma = P.juicio.jueces.reduce((a, j) => a + j.inc, 0); const r = PO.jugar(P, 'testigo'); const suma2 = P.juicio.jueces.reduce((a, j) => a + j.inc, 0);
        if (!r.ok || suma2 <= suma || suma2 > suma + 2 || PO.acciones(P).some(a => a.id === 'testigo')) bien = false; probado++;
      }
    }
    ok(probado > 0 && bien && sinHuesped, 'PL4 con huésped y juicio sale «testigo»: sube a dos jueces y solo una vez (' + probado + ' juicios probados)'); }
  // vasija e hitos
  { let bien = true, minE = 99, maxE = 0, cubre = true, sinRep = true, hitosOk = true, algunHito = 0;
    for (const bot of [listo, tramposo, pasivo]) for (const s of SEMILLAS) {
      const P = PO.nueva({ semilla: s }); juega(P, bot); const E = PO.escenas(P); minE = Math.min(minE, E.length); maxE = Math.max(maxE, E.length);
      if (new Set(E.map(x => x.texto)).size !== E.length) sinRep = false;
      const est = new Set(P.cronica.map(c => c.estacion)); for (const e of est) if (!E.some(x => x.estacion === e)) cubre = false;
      if (!E.every(x => x.texto && x.tipo && x.quien != null && x.estacion != null)) bien = false;
      const H = PO.hitos(P), si = P.votos.filter(v => v.resultado === 'si').map(v => v.asunto).sort();
      if (H.map(h => h.id).sort().join() !== si.join() || !H.every(h => h.cinta && h.texto && h.etiqueta && h.fuente)) hitosOk = false; algunHito += H.length;
    }
    ok(bien && sinRep && minE >= 1 && maxE <= 8 && maxE >= 4, 'PL4 escenas da de ' + minE + ' a ' + maxE + ', sin repetir ni vacías');
    ok(cubre, 'PL4 las escenas cubren cada estación jugada');
    ok(hitosOk && algunHito > 0, 'PL4 hitos = asuntos con voto «sí», con texto, etiqueta y fuente (' + algunHito + ' en 60 años)'); }
  { const D = DA, malHist = []; for (const k of ['ORACULO', 'HUESPED', 'BODA', 'TESTIGO']) if (!D[k].etiqueta || !D[k].fuente) malHist.push(k);
    for (const k of Object.keys(D.VECINAS)) if (!D.VECINAS[k].etiqueta || !D.VECINAS[k].fuente) malHist.push(k);
    for (const a of D.polis.atenas.asuntos) if (!a.hito || !a.hito.etiqueta || !a.hito.fuente || !a.hito.texto) malHist.push(a.id);
    ok(!malHist.length, 'PL4 cada pieza nueva lleva etiqueta y fuente ' + malHist.join(','));
    ok(!/Senado|Parten[oó]n|moneda/i.test(JSON.stringify([D.ORACULO, D.HUESPED, D.VECINAS, D.BODA, D.TESTIGO, D.HITOS])), 'PL4 sin Senado, Partenón ni moneda en lo nuevo'); }
  // un guardado v2 (sin los campos nuevos) sigue jugando un año entero
  { let bien = 0;
    for (const s of SEMILLAS) { const P = PO.nueva({ semilla: s }); P.v = 2; delete P.oraculo; delete P.huesped; delete P.boda; delete P.testigo;
      const f = FALLOS; juega(P, listo); if (P.fin && f === FALLOS && PO.escenas(P).length >= 1) bien++; PO.hitos(P); }
    const P = PO.nueva({ semilla: 2 }); P.v = 2; delete P.huesped; PO.migra(P);
    ok(bien === 20 && P.v === 3 && P.huesped === null && P.oraculo === null && P.testigo === false, 'PL4 un P v2 (sin campos nuevos) juega el año entero y migra a v3 (' + bien + ' de 20)'); }
  { const A = verano(9), B = verano(9); PO.jugar(A, 'oraculo'); PO.jugar(B, 'oraculo'); ok(JSON.stringify(A) === JSON.stringify(B), 'PL4 el oráculo es determinista con la misma semilla'); }
  ok(!/Math\.random/.test(fs.readFileSync(new URL('../js/politeia.js', import.meta.url), 'utf8')), 'PL4 politeia.js no usa Math.random');
}

// Crónicas de muestra, para leerlas
for (const s of [1, 2]) {
  const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo);
  console.log('\n--- Crónica de la semilla ' + s + ' (' + PO.resumen(P) + ') ---');
  for (const c of P.cronica.filter(c => c.quien !== 'tuya' || c.estacion === 2).slice(0, 12)) console.log('[' + DA.ESTACIONES[Math.min(c.estacion, 3)] + '] ' + c.texto);
}
console.log('\n' + (mal ? mal + ' MAL' : '0 MAL'));
process.exit(mal ? 1 : 0);
