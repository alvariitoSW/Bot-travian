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

// Crónicas de muestra, para leerlas
for (const s of [1, 2]) {
  const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo);
  console.log('\n--- Crónica de la semilla ' + s + ' (' + PO.resumen(P) + ') ---');
  for (const c of P.cronica.filter(c => c.quien !== 'tuya' || c.estacion === 2).slice(0, 12)) console.log('[' + DA.ESTACIONES[Math.min(c.estacion, 3)] + '] ' + c.texto);
}
console.log('\n' + (mal ? mal + ' MAL' : '0 MAL'));
process.exit(mal ? 1 : 0);
