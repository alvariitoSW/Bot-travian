// AQVILA — PL1 Politeia: reglas del año político. node test/politeia.test.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const PO = require('../js/politeia.js'); const DA = require('../js/politeia-datos.js');
let mal = 0; const ok = (c, t) => { if (!c) mal++; console.log((c ? 'bien  ' : 'MAL   ') + t); };
let FALLOS = 0;
const SEMILLAS = Array.from({ length: 20 }, (_, i) => i + 1);

// Tres bots: cada uno mira solo P y devuelve [id, objetivo] o null (pasar).
const masInfluyente = (P, a) => a.objetivos.slice().sort((x, y) => P.casas[y].influencia - P.casas[x].influencia)[0];
const PUNTOS = { favor: 5, ostracismo: 5, ofrenda: 4, discurso: 4, dar_cuentas: 4, hablar: 3, banquete: 3, convencer: 3, enviado: 2 };
const listo = P => {
  let mejor = null;
  for (const a of PO.acciones(P)) { const pt = PUNTOS[a.id] || 0; if (pt && (!mejor || pt > mejor.pt)) mejor = { a, pt }; }
  if (!mejor) return null;
  const a = mejor.a; let o = a.objetivos ? a.objetivos[0] : undefined;
  if (['banquete', 'convencer', 'ostracismo'].includes(a.id)) o = masInfluyente(P, a);
  if (a.id === 'hablar') o = a.objetivos.find(x => x.endsWith(':+'));
  return [a.id, o];
};
const pasivo = () => null;
const tramposo = P => {
  const as = PO.acciones(P);
  for (const id of ['pagar', 'rumor', 'comprar', 'pagar_jueces', 'enviado']) { const a = as.find(x => x.id === id); if (a) return [id, a.objetivos ? a.objetivos[0] : undefined]; }
  return null;
};
// Juega un año entero. «cada» se llama antes de cada paso (para vigilar el estado).
function juega(P, bot, cada, tope) {
  const pasosPorEst = [0, 0, 0, 0]; let n = 0;
  while (!P.fin && n < 60 && (tope == null || n < tope)) {
    if (cada) cada(P); const est = P.estacion;
    const m = bot(P); let r = m ? PO.jugar(P, m[0], m[1]) : PO.pasar(P);
    if (!r.ok) { if (m) FALLOS++; r = PO.pasar(P); }
    pasosPorEst[est]++; n++;
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
  ok(errores === 0, 'CA1 listo y pasivo juegan 20 semillas sin error');
  ok(fines === 40, 'CA1 los 40 años acaban con un final (' + fines + '/40; completos ' + completos + ')');
  ok(orden, 'CA1 cuatro estaciones en orden y 3 pasos cada una');
}
// CA2 — cinco casas, ocho personas, dos rivales que juegan cada estación
{
  let casas = true, pers = true, riv = true, juegan = true, tuvieron = 0;
  for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo);
    if (Object.keys(P.casas).length !== 5 || !P.casas.tuya) casas = false;
    if (P.personas.length !== 8 || P.personas.some(p => !p.nombre)) pers = false;
    if (P.rivales.length !== 2 || P.rivales[0] === P.rivales[1] || P.rivales.includes('tuya') || P.rivales.some(r => !P.casas[r])) riv = false;
    const hasta = P.fin ? P.fin.estacion : 4;
    for (let e = 0; e < hasta; e++) for (const r of P.rivales) { tuvieron++; if (!P.cronica.some(c => c.estacion === e && c.quien === r)) juegan = false; }
  }
  ok(casas && DA.polis.atenas.casas.length === 5, 'CA2 hay 5 casas (4 + la tuya)');
  ok(pers && DA.polis.atenas.personas.length === 8, 'CA2 hay 8 personas con nombre');
  ok(riv, 'CA2 en cada partida 2 de las 4 casas son rivales');
  ok(juegan && tuvieron > 0, 'CA2 cada rival juega en cada estación (' + tuvieron + ' comprobaciones)');
}
// CA3 — todo cuesta (sin contar el paso), alguien sale perjudicado, nada negativo
{
  let costes = true, perj = true, neg = true, disc = true, votos = 0, acc = 0; const vistas = new Set();
  const vigila = P => {
    for (const a of PO.acciones(P)) { acc++; vistas.add(a.id); if (!Object.entries(a.coste).some(([k, v]) => k !== 'pasos' && v > 0)) costes = false; }
    for (const c of Object.values(P.casas)) if (c.plata < 0 || c.influencia < 0) neg = false;
    if (P.discordia < 0 || P.discordia > 6) disc = false;
  };
  for (const bot of [listo, pasivo, tramposo]) for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, bot, vigila); vigila(P);
    for (const v of P.votos) { votos++; if (!v.perjudicadas.length) perj = false; }
  }
  ok(costes && acc > 0 && vistas.size >= 13, 'CA3 toda acción tiene coste (' + vistas.size + ' acciones distintas vistas)');
  ok(perj && votos > 0, 'CA3 todo asunto votado perjudica a alguna casa (' + votos + ' votos)');
  ok(neg, 'CA3 plata e influencia nunca negativas');
  ok(disc, 'CA3 discordia siempre entre 0 y 6');
  ok(FALLOS === 0, 'CA3 toda acción ofrecida por acciones() se puede jugar (fallos: ' + FALLOS + ')');
  let rep = true, trasFin = true;
  for (const bot of [listo, pasivo, tramposo]) for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, bot);
    const vistos = new Set(); for (const c of P.cronica) { if (c.quien === 'tuya') continue; const k = c.estacion + c.texto; if (vistos.has(k)) rep = false; vistos.add(k); }
    if (P.fin && P.fin.resultado !== 'sigue') { const u = P.cronica[P.cronica.length - 1]; if (u.quien !== 'ciudad' || P.fin.cronica.indexOf(u.texto) < 0) trasFin = false; }
  }
  ok(rep, 'CA3 ninguna línea de la crónica (rivales y ciudad) se repite en la misma estación');
  ok(trasFin, 'CA3 tras revuelta o destierro no hay líneas después de la última');
  const asu = DA.polis.atenas.asuntos;
  ok(asu.length === 8 && asu.every(a => a.etiqueta && a.fuente && a.efectos.si.perjudica.length && a.efectos.no.perjudica.length), 'CA3 8 asuntos con etiqueta, fuente y perjudicados');
}
// CA4 — dos partidas cuentan historias distintas
{
  const firmas = new Set(), cr = {};
  for (const s of SEMILLAS) { const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo); firmas.add(PO.firma(P)); if (s < 3) cr[s] = P.cronica.map(c => c.texto).join('\n'); }
  ok(firmas.size >= 16, 'CA4 al menos 16 crónicas distintas en 20 semillas (' + firmas.size + ')');
  ok(cr[1] !== cr[2], 'CA4 las semillas 1 y 2 dan crónicas distintas');
}
// CA5 — se puede perder
{
  let des = 0, bien = true;
  for (const s of SEMILLAS) { const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, tramposo); if (P.fin && P.fin.resultado === 'desterrado') des++; else if (!P.fin) bien = false; }
  ok(des >= 1 && bien, 'CA5 el tramposo acaba desterrado en ' + des + ' de 20 semillas');
}
// CA6 — determinista, guardable, sin pantalla ni Math.random, rápido
{
  const a = PO.nueva({ polis: 'atenas', semilla: 7 }), b = PO.nueva({ polis: 'atenas', semilla: 7 }); juega(a, listo); juega(b, listo);
  ok(JSON.stringify(a) === JSON.stringify(b), 'CA6 misma semilla y mismas jugadas, mismo final');
  let igual = true;
  for (const s of SEMILLAS) {
    const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo, null, 5);
    const Q = JSON.parse(JSON.stringify(P)); juega(P, listo); juega(Q, listo);
    if (JSON.stringify(P) !== JSON.stringify(Q)) igual = false;
  }
  ok(igual, 'CA6 guardar a mitad con JSON y seguir da el mismo final (20 semillas)');
  const fuente = ['../js/politeia.js', '../js/politeia-datos.js'].map(f => fs.readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
  ok(!/\bdocument\b|\bwindow\b|Math\.random/.test(fuente), 'CA6 los módulos no usan document, window ni Math.random');
  juega(PO.nueva({ semilla: 1 }), listo);
  let max = 0; for (const s of SEMILLAS) { const t0 = process.hrtime.bigint(); juega(PO.nueva({ semilla: s }), listo); max = Math.max(max, Number(process.hrtime.bigint() - t0) / 1e6); }
  ok(max < 200, 'CA6 un año del bot tarda ' + max.toFixed(1) + ' ms (< 200)');
}
// Crónicas de muestra, para leerlas
for (const s of [1, 2]) {
  const P = PO.nueva({ polis: 'atenas', semilla: s }); juega(P, listo);
  console.log('\n--- Crónica de la semilla ' + s + ' (' + PO.resumen(P) + ') ---');
  for (const c of P.cronica.filter(c => c.quien !== 'tuya' || c.estacion === 2).slice(0, 12)) console.log('[' + DA.ESTACIONES[Math.min(c.estacion, 3)] + '] ' + c.texto);
}
process.exit(mal ? 1 : 0);
