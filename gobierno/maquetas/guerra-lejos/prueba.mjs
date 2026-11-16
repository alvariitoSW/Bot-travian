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
console.log(mal ? 'NO APTO' : 'APTO');
process.exit(mal ? 1 : 0);
