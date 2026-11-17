/* Maqueta GM7 — prueba de las reglas con jugadores de mentira. Uso: node gobierno/maquetas/guerra-lejos/prueba.mjs
   Lo que debe cumplirse: quien no hace nada pierde; quien solo avanza y empuja pierde; quien decide con cabeza y se cubre a
   tiempo gana casi siempre; el mismo jugador SIN cubrirse gana bastante menos y pierde más hombres; el que se queda en el
   testudo hasta el choque sale peor que el que lo deshace a tiempo; la batalla dura entre dos y cuatro minutos, con medio
   minuto largo de acercarse; y añadir un ejército con fichas nuevas (Pirro) no rompe nada. */
import * as R from './reglas.js';
import * as F from './formacion.js';

/* lo que hace un jugador sensato una vez trabado (el mismo criterio de GC1 y GM1) */
function lucha(B, jinetes) {
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto || R.lejos(s)) continue;
    const fe = R.frente(e).fatiga, fr = R.frente(c).fatiga;
    R.ordenar(B, i, (e.postura === 'aguantar' && fr < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
    const l = R.frente(c), sig = c.lineas[1];
    if (sig && sig.fatiga < 0.4 && (fr > 0.7 || l.hombres < 0.45 * l.max) && sig.hombres / sig.max > l.hombres / l.max - 0.1) R.ordenar(B, i, 'relevo');
  }
  if (jinetes !== false && B.cab.estado === 'lista' && B.fase === 'lucha') {
    if ((B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
    else if (B.num.proxima - B.t > 12 || B.num.veces >= 3) { const vs = B.sect.filter(s => !s.c[1].roto && !s.c[0].roto && !R.lejos(s)).sort((a, b) => a.c[1].moral - b.c[1].moral); const v = vs[0]; if (v && v.c[1].moral < 0.6) for (const w of [v, ...vs.slice(1)]) if (!R.ordenar(B, w.i, 'caballeria')) break; }
  }
}
/* de lejos: «como» dice qué hace el cuerpo cuando le caen proyectiles */
function lejos(B, como, hasta) {
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i], c = s.c[0]; if (c.roto || !R.lejos(s)) continue;
    const t = R.tirando(s.c[1]), leTiran = t && t.estado === 'tira';      /* se cubre en cuanto sale el aviso «¡Piedras!» */
    R.ordenar(B, i, leTiran && s.dist > (hasta || 0) ? como : 'avanzar');
  }
}
const bots = {
  'no toca nada': () => {},
  'solo avanzar y empujar': (B) => { for (let i = 0; i < 3; i++) R.ordenar(B, i, R.lejos(B.sect[i]) ? 'avanzar' : 'empujar'); },
  'con cabeza, escudos a tiempo': (B) => { lejos(B, 'escudos'); lucha(B); },
  'con cabeza, SIN cubrirse': (B) => { lucha(B); },
  'con cabeza, testudo a tiempo': (B) => { lejos(B, 'testudo', 22); lucha(B); },
  'testudo hasta el choque': (B) => { for (let i = 0; i < 3; i++) if (R.lejos(B.sect[i])) R.ordenar(B, i, 'testudo'); lucha(B); },
  'escudos todo el camino': (B) => { for (let i = 0; i < 3; i++) if (R.lejos(B.sect[i])) R.ordenar(B, i, 'escudos'); lucha(B); },
  'escudos y jinetes a los honderos': (B) => { lejos(B, 'escudos'); if (B.cab.estado === 'lista' && B.fase === 'lejos') { const s = B.sect.find(s => { const t = R.tirando(s.c[1]); return t && t.estado === 'tira'; }); if (s) R.ordenar(B, s.i, 'caballeria'); } lucha(B); },
};
/* ningún arma gana sola */
const solas = {
  'solo caballería': (B) => { for (const i of [0, 2, 1]) R.ordenar(B, i, 'caballeria'); },
  'solo escudos': (B) => { for (let i = 0; i < 3; i++) if (R.lejos(B.sect[i])) R.ordenar(B, i, 'escudos'); },
  'solo testudo': (B) => { for (let i = 0; i < 3; i++) if (R.lejos(B.sect[i])) R.ordenar(B, i, 'testudo'); },
  'jinetes al centro sin paso': (B) => { R.ordenar(B, 1, 'caballeria'); lucha(B, false); },
};

let mal = 0;
function tanda(H, rival, N, lista) {
  const res = {};
  for (const [nombre, bot] of Object.entries(lista || bots)) {
    let gana = 0, dur = 0, bR = 0, bE = 0, min = 1e9, max = 0, choque = 0, bLejos = 0, tE = 0, bLin = 0;
    for (let k = 0; k < N; k++) {
      const B = R.nueva(1000 + k * 7919, H, rival); let prox = 0, visto = false;
      while (B.fase !== 'fin') {
        if (B.t >= prox) { bot(B); prox = B.t + 1.5; }                      // el bot «toca» cada segundo y medio, como una persona
        R.paso(B, 0.1);
        if (!visto && B.sect.every(s => !R.lejos(s))) { visto = true; choque += B.t; }
      }
      const r = B.resultado; if (r.como === 'victoria') gana++; dur += r.t; min = Math.min(min, r.t); max = Math.max(max, r.t); bR += r.bajas[0] / r.inicial[0]; bE += r.bajas[1] / r.inicial[1]; bLejos += B.porTiro[0] / r.inicial[0]; bLin += B.porTiroLinea[0] / r.inicial[0]; tE += B.porTiro[1] / r.inicial[1];
    }
    const o = res[nombre] = { pct: Math.round(100 * gana / N), dur: dur / N, min, max, bR: 100 * bR / N, bE: 100 * bE / N, choque: choque / N, bLejos: 100 * bLejos / N, tE: 100 * tE / N, bLin: 100 * bLin / N };
    console.log(`${nombre.padEnd(33)} gana ${String(o.pct).padStart(3)} % · dura ${Math.round(o.dur)} s (${Math.round(min)}–${Math.round(max)}) · todos trabados a los ${Math.round(o.choque)} s · bajas Roma ${o.bR.toFixed(0)} % (por proyectil ${o.bLejos.toFixed(1)} %, en las líneas ${o.bLin.toFixed(1)} %) / enemigo ${o.bE.toFixed(0)} % (${o.tE.toFixed(1)} %)`);
  }
  return res;
}
const pide = (ok, texto) => { if (!ok) { mal++; console.log('   MAL: ' + texto); } };
for (const H of [1000, 5000, 10000]) {
  const B0 = R.nueva(1, H); console.log(`\n== ${H} por bando contra Cartago: ${R.inicialLado(B0, 0)} romanos contra ${R.inicialLado(B0, 1)} ==`);
  /* cada hombre tiene un sitio distinto, y al caer gente siguen cabiendo justo los que quedan */
  for (const l of B0.sect[1].c[0].lineas) for (const q of [1, 0.63, 0.07]) {
    const n = Math.ceil(l.max * q), files = F.filesDe(l.max), rg = { n, files, x: 0, z: 0, yaw: Math.PI, px: 1, pz: 1.15 }, vistos = new Set(), o = {};
    for (let id = 0; id < n; id++) { F.sitio(rg, id, 0, o); vistos.add(Math.round(o.x * 2) + ':' + Math.round(o.z * 2)); }
    pide(vistos.size === n && F.filasDe(n, files) * files >= n, `${l.tipo} con ${n} hombres no caben uno a uno`);
  }
  const r = tanda(H, 'cartago', 40), cab = r['con cabeza, escudos a tiempo'], sin = r['con cabeza, SIN cubrirse'];
  pide(r['no toca nada'].pct <= 5, 'quien no toca nada debe perder');
  pide(r['solo avanzar y empujar'].pct <= 15, 'quien solo avanza y empuja debe perder');
  pide(cab.pct >= 85, 'quien decide con cabeza y se cubre a tiempo debe ganar casi siempre');
  pide(sin.pct <= cab.pct - 20, 'no cubrirse debe costar: bastantes menos victorias');
  pide(sin.bLin >= cab.bLin * 1.8, 'sin cubrirse, los proyectiles deben tumbar casi el doble de legionarios');
  pide(r['testudo hasta el choque'].pct <= cab.pct - 10, 'quedarse en el testudo hasta el choque debe salir peor');
  pide(r['con cabeza, testudo a tiempo'].pct >= 70, 'el testudo a tiempo debe ser una jugada válida');
  pide(cab.min >= 100 && cab.max <= 250, 'la batalla bien jugada debe durar entre dos y cuatro minutos');
  const so = tanda(H, 'cartago', 20, solas);
  for (const [n, o] of Object.entries(so)) pide(o.pct <= 15, n + ' no debe ganar: ningún arma gana a todas');
  if (H !== 5000) { console.log(`-- ${H} contra Cartago con elefantes`); const zz = tanda(H, 'zama', 10); pide(zz['no toca nada'].pct <= 5 && zz['con cabeza, escudos a tiempo'].pct >= 50, `con ${H} hombres, contra elefantes: quien no hace nada pierde y quien manda con cabeza gana`); }
  pide(cab.choque >= 30 && cab.choque <= 65, 'acercarse debe durar entre medio minuto y un minuto');
}
/* un ejército hecho solo con fichas nuevas (arqueros, hoplitas, falange, tesalios) se juega sin tocar el motor */
console.log('\n== 5000 por bando contra Pirro (solo fichas nuevas) ==');
const p = tanda(5000, 'pirro', 20);
pide(Object.values(p).every(o => o.dur > 60 && o.dur < 345), 'la batalla contra Pirro debe acabar por sí sola');
pide(p['no toca nada'].pct <= 30 && p['con cabeza, escudos a tiempo'].pct > p['no toca nada'].pct, 'contra Pirro también deben mandar las decisiones');

/* ---- GM9: peso, jinetes por las alas, duelo, carrera, elefantes ---- */
console.log('\n== GM9: caballería y elefantes ==');
const P = R.TROPAS;
pide(P.elefantes.peso > P.tesalios.peso && P.tesalios.peso > P.equites.peso && P.equites.peso > P.hastati.peso && P.hastati.peso > P.velites.peso && P.equites.peso > P.numidas.peso, 'el peso debe ir elefante > jinete pesado > infantería pesada > ligera');
/* rutas: ala por fuera; centro solo con un ala enemiga despejada */
{ const B = R.nueva(5, 1000, 'cartago');
  pide(/^no hay paso/.test(R.ordenar(B, 1, 'caballeria')) && B.cab.estado === 'lista', 'jinetes al centro con las dos alas guardadas: «no hay paso» y no hacen nada');
  pide(R.ordenar(B, 0, 'caballeria') === '' && B.cab.fase === 'sale' && B.cab.ala === 0, 'ordenar al ala: salen por esa ala');
  const vistos = new Set(); let guts = 0; while (B.cab.estado !== 'lista' && guts++ < 3000) { R.paso(B, 0.1); vistos.add(B.cab.fase); }
  pide(['sale', 'rodea', 'entra', 'golpe', 'vuelve'].every(f => vistos.has(f)), 'la caballería debe pasar por sale, rodea, entra, golpe y vuelve');
  pide(B.num.guarda[0] === 0 || B.cab.hombres < B.cab.max, 'el duelo del ala debe dejar huella');
  if (B.num.guarda[0] === 0) { const o = R.ordenar(B, 1, 'caballeria'); pide(o === '' && B.cab.doble && B.cab.ala === 0, 'ala enemiga despejada: el centro se rodea por ahí y tarda el doble'); }
  else console.log('   (duelo perdido en la semilla de prueba: se omite la comprobación del centro)');
}
/* el duelo: Roma gana más contra númidas ligeros que contra tesalios pesados */
function duelos(rival, N) { let g = 0, n = 0; for (let k = 0; k < N; k++) { const B = R.nueva(300 + k * 31, 5000, rival); R.ordenar(B, 0, 'caballeria'); let x = 0; while (B.cab.fase !== 'entra' && x++ < 500) R.paso(B, 0.1); R.paso(B, 0.1); n++; if (B.eventos.some(e => e.tipo === 'cab-huye' && e.bando === 1)) g++; } return Math.round(100 * g / n); }
const dN = duelos('cartago', 40), dT = duelos('pirro', 40); console.log(`   duelo de jinetes: Roma gana ${dN} % contra númidas y ${dT} % contra tesalios`);
pide(dN >= 70 && dT < dN, 'los jinetes ligeros deben perder más el duelo que los pesados');
/* la carga: por la espalda de tropa trabada vale; de frente contra tropa que viene, nada, y salen mal */
function golpe(semilla, trabados, tipo) {
  const B = R.nueva(semilla, 5000, 'cartago'); if (tipo) B.sect[0].c[1].lineas[0].tipo = tipo;
  if (trabados) { let x = 0; while (!(B.fase === 'lucha' && !R.lejos(B.sect[0])) && x++ < 4000) R.paso(B, 0.1); }
  B.num.guarda[0] = 0; R.ordenar(B, 0, 'caballeria'); const h0 = B.cab.hombres; let x = 0; while (B.cab.fase !== 'golpe' && x++ < 500) R.paso(B, 0.1);
  const g = B.eventos.filter(e => e.tipo === 'cab-golpe' && e.bando === 0).pop(); return { g, perdida: 1 - B.cab.hombres / h0, B };
}
const gE = golpe(11, true), gF = golpe(11, false), gL = golpe(11, true, 'libios'), gP = (() => { const B = R.nueva(11, 5000, 'cartago'); B.num.guarda[0] = 0; R.ordenar(B, 0, 'caballeria'); B.cab.carrera = 5; let x = 0; while (B.cab.fase !== 'golpe' && x++ < 500) R.paso(B, 0.1); return B.eventos.filter(e => e.tipo === 'cab-golpe').pop(); })();
console.log(`   golpe por la espalda ${gE.g.valor.toFixed(2)} · contra lanzas ${gL.g.valor.toFixed(2)} · de frente ${gF.g.valor.toFixed(2)} (pierde ${(100 * gF.perdida).toFixed(0)} % de los jinetes)`);
pide(gE.g.lado === 'espalda' && gE.g.valor > 0.5, 'por la espalda de tropa trabada la carga debe valer mucho');
pide(gF.g.lado === 'frente' && gF.g.valor === 0 && gF.perdida > 0.05, 'de frente no vale nada y los jinetes pierden hombres');
pide(gL.g.valor < gE.g.valor && gL.perdida > gE.perdida, 'contra lanzas a pie firme vale menos y salen peor parados');
pide(gP.valor < 0.35 * gE.g.valor, 'pegados al enemigo (sin carrera) la carga casi no vale');
/* elefantes */
const E = (semilla, H, bot, hasta) => { const B = R.nueva(semilla, H || 5000, 'zama'); let prox = 0; while (B.fase !== 'fin' && B.t < (hasta || 400)) { if (B.t >= prox) { bot(B); prox = B.t + 1.5; } R.paso(B, 0.1); } return B; };
{ const B = R.nueva(3, 5000, 'zama');
  pide(/bestias/.test(R.ordenar(B, 0, 'caballeria')) && B.cab.estado === 'lista', 'los caballos no cargan elefantes: ordenar lo dice');
  let x = 0; while (!B.eventos.some(e => e.tipo === 'elefantes-cargan') && x++ < 3000) R.paso(B, 0.1);
  pide(B.eventos.some(e => e.tipo === 'elefantes-cargan') && B.cab.espanto > B.t - 0.2, 'si las bestias cargan, los caballos se espantan un rato');
  pide(/espantados/.test(R.ordenar(B, 2, 'caballeria')), 'espantados no cargan nada'); }
const conVel = [], sinVel = [], vivas = (B) => B.sect[0].c[1].lineas.filter(l => l.tipo === 'elefantes').reduce((a, l) => a + l.hombres, 0) / R.nueva(1, 5000, 'zama').sect[0].c[1].lineas[0].max;
const cuerposRoma = JSON.parse(JSON.stringify(R.EJERCITOS.roma.cuerpos));
let desb = 0, gana = { solo: 0, cab: 0, escudos: 0, sin: 0, con: 0 }; const N = 20;
const botCab = (B) => { lejos(B, 'escudos'); lucha(B); };
for (let k = 0; k < N; k++) {
  gana.solo += E(100 + k, 5000, solas['solo caballería']).resultado?.como === 'victoria' ? 1 : 0;
  const Bc = E(100 + k, 5000, botCab); gana.cab += Bc.resultado.como === 'victoria' ? 1 : 0; if (Bc.eventos.some(e => e.tipo === 'bestias-desbocadas' && e.bando === 1)) desb++;
  conVel.push(vivas(E(200 + k, 5000, botCab, 52)));
  R.EJERCITOS.roma.cuerpos = cuerposRoma.map(c => c.filter(t => t !== 'velites'));
  sinVel.push(vivas(E(200 + k, 5000, botCab, 52))); gana.sin += E(300 + k, 5000, botCab).resultado.como === 'victoria' ? 1 : 0;
  R.EJERCITOS.roma.cuerpos = cuerposRoma; gana.con += E(300 + k, 5000, botCab).resultado.como === 'victoria' ? 1 : 0;
}
R.EJERCITOS.roma.cuerpos = cuerposRoma;
const med = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`   contra elefantes (5 000): jinetes solos ganan ${gana.solo * 5} % · con cabeza ${gana.cab * 5} % · se desbocan en ${desb * 5} % · bestias vivas a los 52 s: con vélites ${(100 * med(conVel)).toFixed(0)} %, sin ${(100 * med(sinVel)).toFixed(0)} % · gana con vélites ${gana.con * 5} %, sin ${gana.sin * 5} %`);
pide(gana.solo * 5 <= 5, 'los jinetes solos no ganan contra elefantes');
pide(med(conVel) < med(sinVel) - 0.1, 'las jabalinas deben parar a los elefantes (vivos con vélites muy por debajo de sin ellos)');
pide(gana.con >= gana.sin, 'con jabalinas se gana al menos tanto como sin ellas');
pide(gana.cab * 5 >= 60 && gana.cab * 5 <= 100, 'contra elefantes quien manda con cabeza gana, pero no es un paseo');
pide(desb >= 3, 'los elefantes heridos deben desbocarse en bastantes batallas');
const z = tanda(5000, 'zama', 20); pide(z['no toca nada'].pct <= 5, 'contra elefantes quien no toca nada pierde');

/* ===== GM10: manejo ===== */
console.log('\nGM10 · reglas de manejo');
import * as V from '../guerra-lejos/reglas.js';
const trabar = (B, ps = 400) => { for (let k = 0; k < ps * 10 && B.sect.some(s => R.lejos(s)); k++) R.paso(B, 0.1); };
{
  // 1. misma semilla sin usar lo nuevo = exactamente igual que guerra-lejos
  let igual = true;
  for (const [sem, H, riv] of [[1000, 5000, 'cartago'], [1007, 1020, 'cartago'], [3, 3000, 'zama'], [9, 5000, 'pirro']]) {
    const A = R.nueva(sem, H, riv), O = V.nueva(sem, H, riv);
    const guion = (X, M) => { for (let k = 0; k < 4000 && X.fase !== 'fin'; k++) { if (k % 15 === 0) { for (let i = 0; i < 3; i++) M.ordenar(X, i, M.lejos(X.sect[i]) ? (k % 30 ? 'escudos' : 'avanzar') : (k % 45 ? 'empujar' : 'aguantar')); if (k % 60 === 0) M.ordenar(X, k % 180 === 0 ? 1 : 0, 'caballeria'); } M.paso(X, 0.1); } return X; };
    guion(A, R); guion(O, V);
    const f = X => JSON.stringify([X.t.toFixed(3), X.resultado, X.sect.map(s => [s.frente, s.c.map(c => [c.moral, c.lineas.map(l => l.hombres)])]), X.eventos.length]);
    if (f(A) !== f(O)) igual = false;
  }
  pide(igual, 'sin usar lo nuevo, la batalla sale idéntica a la de guerra-lejos');

  // 2. ala elegida y doble
  let B = R.nueva(5, 1020, 'cartago'); for (let i = 0; i < 3; i++) B.num.guarda[i] = 0;
  pide(R.puede(B, 0, 'caballeria', { ala: 0 }) === '' && R.puede(B, 0, 'caballeria') === '', 'ala propia: se puede, igual que sin elegir');
  R.ordenar(B, 0, 'caballeria', { ala: 2 }); pide(B.cab.ala === 2 && B.cab.doble === true, 'ala contraria a la del objetivo: rodeo largo (doble)');
  B = R.nueva(5, 1020, 'cartago'); R.ordenar(B, 1, 'caballeria', { ala: 0 }); pide(B.cab.ala === 0 && B.cab.doble === true && B.cab.obj === 1, 'objetivo el centro con ala elegida: doble');
  B = R.nueva(5, 1020, 'cartago'); R.ordenar(B, 0, 'caballeria', { ala: 0 }); pide(B.cab.doble === false, 'ala propia: rodeo corto');
  B = R.nueva(5, 1020, 'cartago'); B.num.guarda = [50, 0, 50];
  pide(R.puede(B, 1, 'caballeria') !== '' && R.puede(B, 1, 'caballeria', { ala: 0 }) === '', 'ala guardada por jinetes enemigos: sin elegir no hay paso, eligiéndola sí (habrá duelo)');
  const rc = R.rutasCab(B, 1); pide(rc.length === 2 && rc[0].ala === 0 && rc[1].ala === 2 && rc.every(r => r.doble && r.duelo && r.no === ''), 'rutasCab: dos rutas, doble y con duelo');
  B.sect[2].c[1].lineas[0].tipo = 'elefantes' in R.TROPAS ? 'elefantes' : B.sect[2].c[1].lineas[0].tipo;
  const bes = Object.keys(R.TROPAS).find(t => R.TROPAS[t].bestia);
  if (bes) { B.sect[2].c[1].lineas[0].tipo = bes; B.sect[2].c[1].lineas[0].hombres = 10; const r2 = R.rutasCab(B, 1); pide(r2[1].no !== '' && r2[0].no === '', 'rutasCab: las bestias cierran su ala y dicen por qué'); }
  const antes = B.eventos.length; R.ordenar(B, 1, 'caballeria', { ala: 0 }); pide(B.eventos.slice(antes).some(e => e.tipo === 'cab-sale' && e.ala === 0), 'la carga con ala elegida sale por esa ala');

  // 3. marcar dispara la carga
  B = R.nueva(7, 1020, 'cartago'); for (let i = 0; i < 3; i++) B.num.guarda[i] = 0;
  pide(B.objetivo === -1, 'objetivo empieza en -1');
  pide(R.marcar(B, 2) === '' && B.objetivo === 2 && B.eventos.some(e => e.tipo === 'objetivo' && e.marca === true), 'marcar pone el objetivo y avisa');
  R.marcar(B, 2); pide(B.objetivo === -1, 'marcar otra vez lo quita');
  R.marcar(B, 0); B.cab.estado = 'volviendo'; B.cab.t = 99; R.paso(B, 0.1); pide(B.cab.estado === 'volviendo' && B.objetivo === 0, 'con los jinetes ocupados no carga y sigue marcado');
  B.cab.estado = 'lista'; B.cab.fase = null; R.paso(B, 0.1);
  pide(B.cab.estado === 'yendo' && B.cab.obj === 0 && B.objetivo === -1, 'marcado + jinetes listos y paso libre: carga sola y borra la marca');
  B = R.nueva(7, 1020, 'cartago'); R.marcar(B, 1); B.sect[1].c[1].roto = true; R.paso(B, 0.1); pide(B.objetivo === -1 && B.cab.estado === 'lista', 'si el enemigo marcado se rompe, se borra la marca');
  B = R.nueva(7, 1020, 'cartago'); B.sect[1].c[1].roto = true; pide(R.marcar(B, 1) !== '' && B.objetivo === -1, 'no se marca un cuerpo roto');
  pide(!R.ordenesDe(B, 0).some(o => ['esperar', 'ceder', 'rehusar'].includes(o)) && ['esperar', 'ceder', 'rehusar'].every(o => R.ORDENES[o] && R.ORDENES[o].que && R.ORDENES[o].sub), 'las órdenes nuevas están en ORDENES y no en ordenesDe');

  // 4. esperar
  B = R.nueva(11, 1020, 'cartago'); const z0 = B.sect[0].c[0].z, z1 = B.sect[1].c[0].z;
  pide(R.ordenar(B, 0, 'esperar') === '' && R.ordenar(B, 0, 'esperar') === 'Ya lo están haciendo', 'esperar se puede una vez');
  B.sect[0].c[0].lineas[0].fatiga = 0.5; for (let k = 0; k < 100; k++) R.paso(B, 0.1);
  pide(B.sect[0].c[0].z === z0 && B.sect[1].c[0].z < z1 && B.sect[0].c[0].lineas[0].fatiga < 0.5, 'el que espera no avanza, el otro sí, y descansa');
  pide(B.eventos.some(e => e.tipo === 'espera'), 'evento espera');
  R.ordenar(B, 0, 'avanzar'); pide(B.sect[0].c[0].postura === 'avanzar', 'avanzar quita esperar');
  R.ordenar(B, 0, 'esperar'); for (let k = 0; k < 1500 && B.sect[0].dist > 0; k++) R.paso(B, 0.1);
  pide(B.sect[0].dist === 0 && B.sect[0].c[0].postura === 'aguantar', 'si el enemigo llega, chocan y aguanta');
  pide(R.puede(B, 0, 'esperar') !== '', 'esperar ya no vale luchando');

  // 5. ceder
  const duelo = ceder => { const X = R.nueva(21, 1020, 'cartago'); trabar(X); const c = X.sect[1].c[0]; const h0 = R.hombres(c), f0 = X.sect[1].frente, tr = X.t; if (ceder) R.ordenar(X, 1, 'ceder'); else R.ordenar(X, 1, 'empujar'); for (let k = 0; k < 100; k++) R.paso(X, 0.1); return { X, bajas: h0 - R.hombres(c), frente: X.sect[1].frente - f0, fatE: R.frente(X.sect[1].c[1]).fatiga }; };
  const a = duelo(false), b = duelo(true);
  console.log(`   ceder (frente a empujar): bajas ${a.bajas.toFixed(1)} → ${b.bajas.toFixed(1)} · frente ${a.frente.toFixed(2)} → ${b.frente.toFixed(2)} · fatiga rival ${a.fatE.toFixed(2)} → ${b.fatE.toFixed(2)}`);
  pide(b.bajas < a.bajas * 0.75, 'ceder baja claramente las bajas propias');
  pide(b.frente < a.frente - 0.3, 'ceder pierde terreno');
  pide(b.fatE > a.fatE, 'el que sigue al que cede se cansa más');
  { const X = R.nueva(21, 1020, 'cartago'); pide(R.puede(X, 1, 'ceder') !== '', 'ceder no vale lejos'); trabar(X); R.ordenar(X, 1, 'ceder'); pide(R.ordenar(X, 1, 'ceder') === 'Ya lo están haciendo', 'ceder repetido avisa');
    let sin = false; for (let k = 0; k < 400 && !sin && X.fase !== 'fin'; k++) { R.paso(X, 0.1); if (X.sect[1].c[0].roto) break; if (X.eventos.some(e => e.tipo === 'sin-sitio')) sin = true; }
    pide(sin && X.sect[1].c[0].postura === 'aguantar' && X.eventos.some(e => e.tipo === 'cede'), 'al llegar al tope pasa solo a aguantar y avisa «sin-sitio»'); }

  // 6. rehusar
  B = R.nueva(31, 1020, 'cartago'); pide(R.puede(B, 0, 'rehusar') !== '', 'rehusar sin costado: no vale');
  pide(R.ordenar(B, 0, 'rehusar', { costado: -1 }) === '' && B.sect[0].c[0].rehusa === -1, 'rehusar lejos guarda el costado');
  pide(R.ordenar(B, 0, 'rehusar', { costado: -1 }) === 'Ya lo están haciendo' && R.ordenar(B, 0, 'rehusar', { costado: 1 }) === '' && B.sect[0].c[0].rehusa === 1, 'mismo costado avisa, el otro cambia');
  pide(B.eventos.some(e => e.tipo === 'rehusa' && e.costado === -1), 'evento rehusa con costado');
  R.ordenar(B, 0, 'avanzar'); pide(B.sect[0].c[0].rehusa === 0, 'avanzar quita rehusar');
  const hostiga = reh => { const X = R.nueva(41, 1020, 'cartago'); X.num.guarda = [200, 0, 200]; X.sect[0].c[0].rehusa = reh ? 1 : 0; Object.assign(X.num, { estado: 'hostiga', sect: 0, t: 15, fase: 'golpe', ala: 0 }); const c = X.sect[0].c[0]; const m0 = c.moral, h0 = R.hombres(c); for (let k = 0; k < 100; k++) { X.num.t = 15; R.paso(X, 0.1); } return { m: m0 - c.moral, h: h0 - R.hombres(c) }; };
  const h1 = hostiga(false), h2 = hostiga(true); console.log(`   rehusar vs jinetes: ánimo ${h1.m.toFixed(3)} → ${h2.m.toFixed(3)} · bajas ${h1.h.toFixed(1)} → ${h2.h.toFixed(1)}`);
  pide(h2.m < h1.m * 0.5 && h2.h < h1.h * 0.5, 'rehusar reduce el hostigamiento de los jinetes rivales');
  const flanco = reh => { const X = R.nueva(51, 1020, 'cartago'); trabar(X); const c = X.sect[0].c[0]; c.flanqueado = true; c.rehusa = reh ? -1 : 0; const m0 = c.moral, h0 = R.hombres(c); for (let k = 0; k < 100; k++) { c.flanqueado = true; R.paso(X, 0.1); } return { m: m0 - c.moral, h: h0 - R.hombres(c) }; };
  const f1 = flanco(false), f2 = flanco(true); console.log(`   rehusar vs envolvimiento: ánimo ${f1.m.toFixed(3)} → ${f2.m.toFixed(3)} · bajas ${f1.h.toFixed(1)} → ${f2.h.toFixed(1)}`);
  pide(f2.m < f1.m && f2.h < f1.h, 'rehusar reduce el daño del flanqueo');
  B = R.nueva(61, 1020, 'cartago'); trabar(B); R.ordenar(B, 0, 'rehusar', { costado: 1 }); R.ordenar(B, 0, 'empujar'); pide(B.sect[0].c[0].rehusa === 0, 'empujar quita rehusar');
}

console.log(mal ? 'NO APTO' : 'APTO');
process.exit(mal ? 1 : 0);
