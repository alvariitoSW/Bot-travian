/* Maqueta GM11/GM21 — prueba de las reglas con jugadores de mentira. Uso: node gobierno/maquetas/guerra-unica/prueba.mjs
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
    else if (B.num.proxima - B.t > 12 || B.num.veces >= 3) { const v = B.sect.filter(s => !s.c[1].roto && !s.c[0].roto && !R.lejos(s)).sort((a, b) => a.c[1].moral - b.c[1].moral)[0]; if (v && v.c[1].moral < 0.6) R.ordenar(B, v.i, 'caballeria'); }
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

let mal = 0;
function tanda(H, rival, N) {
  const res = {};
  for (const [nombre, bot] of Object.entries(bots)) {
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
  pide(cab.choque >= 30 && cab.choque <= 65, 'acercarse debe durar entre medio minuto y un minuto');
}
/* un ejército hecho solo con fichas nuevas (arqueros, hoplitas, falange, tesalios) se juega sin tocar el motor */
console.log('\n== 5000 por bando contra Pirro (solo fichas nuevas) ==');
const p = tanda(5000, 'pirro', 20);
pide(Object.values(p).every(o => o.dur > 60 && o.dur < 345), 'la batalla contra Pirro debe acabar por sí sola');
pide(p['no toca nada'].pct <= 30 && p['con cabeza, escudos a tiempo'].pct > p['no toca nada'].pct, 'contra Pirro también deben mandar las decisiones');

/* ---------- ARMAS Y FORMACIONES (traídas de GM2) ---------- */
console.log('\n== Armas y formaciones ==');
{
  for (const [id, T] of Object.entries(R.TROPAS)) { pide(R.ARMAS[T.arma] && R.FORMACIONES[T.forma], `${id}: arma o formación sin definir`); if (T.cal) pide(T.cal > 0 && T.hombres > 0, `${id}: ficha incompleta`); }
  for (const f of ['falange', 'manipulos', 'cerrada', 'tropel', 'tiro', 'ligera']) pide(R.FORMACIONES[f] && R.FORMACIONES[f].frente > 0 && R.FORMACIONES[f].recibe > 0 && R.FORMACIONES[f].flanco >= 1, `formación ${f}: faltan frente, recibe o flanco`);
  for (const a of ['espada', 'lanza', 'jabalina', 'arco']) pide(R.ARMAS[a], 'falta el arma ' + a);
  pide(R.ARMAS.lanza.frena && !R.ARMAS.espada.frena, 'solo la lanza se clava en tierra');
  pide(R.ARMAS.arco.alcance > R.ARMAS.jabalina.alcance && R.ARMAS.arco.tiro > 0 && R.ARMAS.jabalina.tiro > 0, 'el arco debe llegar más lejos que la jabalina, y ambos tirar');
  pide(R.FORMACIONES.tiro.delante && R.FORMACIONES.ligera.delante && !R.FORMACIONES.falange.delante, 'tiro y tropa ligera van delante; la falange no');
  pide(R.FORMACIONES.tiro.frente < 1 && R.FORMACIONES.tiro.recibe > 1, 'la línea de tiro pega poco y encaja mucho de frente');
  /* un cuerpo contra otro, sin azar: lo mismo con distinto arma o formación en el otro lado */
  const una = (t, post, extra) => { const B = R.nueva(3, 1020, 'cartago', [[[t], [t], [t]], [[t], [t], [t]]]); const c = B.sect[0].c[0]; c.postura = post; Object.assign(c, extra || {}); return B; };
  const hs = una('hastati', 'empujar'), c0 = hs.sect[0].c[0];
  const vs = t => { const o = una(t, 'empujar').sect[0].c[0]; return R.fuerza(c0, o); };
  pide(vs('falange') < vs('hoplitas') * 0.9, 'la espada no entra en las picas: contra la falange pega menos que contra una línea cerrada');
  c0.impulso = 5; const sin = R.fuerza(c0, una('libios', 'empujar').sect[0].c[0]), con = R.fuerza(c0, una('libios', 'aguantar').sect[0].c[0]);
  pide(con < sin * 0.95, 'lanzas clavadas (aguantar) paran la carga del que llega con impulso');
  const sw = R.fuerza(c0, una('galos', 'aguantar').sect[0].c[0]); pide(Math.abs(sw - R.fuerza(c0, una('galos', 'empujar').sect[0].c[0])) < 1e-9, 'la espada no clava nada: el impulso no depende de la postura');
  const fa = una('falange', 'empujar').sect[0].c[0], ho = una('hoplitas', 'empujar').sect[0].c[0];
  pide(R.fuerza(fa) / R.TROPAS.falange.cal > R.fuerza(ho) / R.TROPAS.hoplitas.cal, 'la falange pega de frente más que la línea cerrada, a igual calidad');
  /* duelos de frente: ninguna arma gana siempre. Roma (espada) y Cartago (lanza) con la misma tropa de cada, con la mano de un jugador sensato */
  const duelo = (a, b, k) => { let g = 0; for (let n = 0; n < 20; n++) { const B = R.nueva(900 + n * 131, 1020, 'cartago', [[[a], [a], [a]], [[b], [b], [b]]]); let prox = 0; while (B.fase !== 'fin') { if (B.t >= prox) { lucha(B, false); prox = B.t + 1.5; } R.paso(B, 0.1); } if (B.resultado.como === 'victoria') g++; } return g * 5; };
  const dEL = duelo('principes', 'libios'), dLE = duelo('libios', 'principes'), dEG = duelo('principes', 'galos'), dGE = duelo('galos', 'principes');
  console.log(`   príncipes (espada) contra libios (lanza): gana ${dEL} %  ·  libios contra príncipes: ${dLE} %  ·  príncipes contra galos: ${dEG} %  ·  galos contra príncipes: ${dGE} %`);
  /* solo informativo: la tropa manda más que el arma, así que no se exige reparto; los duelos de armas de GM2 (ninguna gana a todas) quedan como duda */
}

/* ---------- FLANCOS, HUECO, VENCEDOR QUE SE VUELVE, CONTAGIO (traídos de GM2) ---------- */
console.log('\n== Flancos, hueco, vencedor, contagio ==');
{
  const N = 24, correr = (B, bot, cada) => { let prox = 0; while (B.fase !== 'fin') { if (bot && B.t >= prox) { bot(B); prox = B.t + (cada || 1.5); } R.paso(B, 0.1); } return B.resultado; };
  /* un sector, un cuerpo contra otro; se mira quién rompe primero en el sector 0. «flanco» deja al enemigo cogido de costado desde el primer segundo */
  const sector0 = (h, seed, flanco) => {
    const B = R.nueva(seed, 1020, 'cartago', [[['principes'], ['principes'], ['principes']], [['libios'], ['libios'], ['libios']]]), c = B.sect[0].c[0], e = B.sect[0].c[1];
    c.lineas[0].hombres = c.lineas[0].max = h; c.inicial = h; let prox = 0, on = 0;
    while (!c.roto && !e.roto && B.fase !== 'fin' && B.t < 300) { if (flanco && !on && !R.lejos(B.sect[0])) on = e.flanqueado = true; if (B.t >= prox) { R.ordenar(B, 0, 'empujar'); prox = B.t + 1.5; } R.paso(B, 0.1); }
    return e.roto && !c.roto;
  };
  const pct = (h, flanco) => { let g = 0; for (let k = 0; k < N; k++) if (sector0(h, 70 + k * 211, flanco)) g++; return Math.round(100 * g / N); };
  const p260 = pct(260, false), f260 = pct(260, true), f90 = pct(90, true);
  console.log(`   260 príncipes de frente contra 260 libios: ${p260} %  ·  los mismos con el enemigo cogido de costado: ${f260} %  ·  solo 90 por el costado: ${f90} %`);
  pide(p260 <= 25 && f260 >= 70, 'coger al enemigo de costado debería decidir una pelea igualada');
  pide(f90 <= 25, 'el costado no puede ganar solo: con un tercio de los hombres se debería perder');
  /* la formación manda ante el costado: la falange encaja más que los manípulos, y volver la reserva (aguantar) rebaja el golpe y alarga la resistencia */
  const con = (t, cos) => { const B = R.nueva(3, 1020, 'cartago', [[[t, t], [t], [t]], [['iberos'], ['iberos'], ['iberos']]]), c = B.sect[0].c[0]; c.flanco.costado = cos; return { B, c }; };
  const gF = R.agravante(con('falange', 1).c), gM = R.agravante(con('hastati', 1).c), g0 = R.agravante(con('hastati', 0).c);
  pide(g0 === 1 && gM > 1 && gF > gM, 'el costado agrava el golpe, y más a la falange que a los manípulos');
  { const { c } = con('hastati', 1); c.flanco.cubre = true; pide(R.agravante(c) < gM && R.agravante(c) > 1, 'la reserva que se vuelve rebaja el golpe de costado sin anularlo'); }
  const aguanta = (t, post) => { let tt = 0; for (let k = 0; k < N; k++) { const B = R.nueva(40 + k * 97, 1020, 'cartago', [[[t, t], [t, t], [t, t]], [['iberos'], ['iberos'], ['iberos']]]), c = B.sect[0].c[0]; let prox = 0, t0 = 0; while (!c.roto && B.fase !== 'fin' && B.t < 300) { if (!t0 && !R.lejos(B.sect[0])) { c.flanqueado = true; t0 = B.t; } if (B.t >= prox) { if (!R.lejos(B.sect[0])) R.ordenar(B, 0, post); prox = B.t + 1.5; } R.paso(B, 0.1); } tt += B.t - t0; } return tt / N; };
  const tM = aguanta('hastati', 'empujar'), tR = aguanta('hastati', 'aguantar');
  console.log(`   manípulos cogidos de costado hasta romperse: empujando ${tM.toFixed(0)} s  ·  aguantando (la reserva se vuelve) ${tR.toFixed(0)} s`);
  pide(tR > tM * 1.15, 'volver la reserva debería notarse');
  { const B = R.nueva(3, 1020, 'cartago', [[['hastati', 'principes'], ['hastati'], ['hastati']], [['iberos'], ['iberos'], ['iberos']]]); while (B.sect.some(s => R.lejos(s))) R.paso(B, 0.1); const c = B.sect[0].c[0]; c.flanqueado = true; c.postura = 'aguantar'; R.paso(B, 0.1); pide(c.flanco.cubre && B.eventos.some(e => e.tipo === 'cubre'), 'aguantando con reserva, los manípulos cubren el costado y se avisa');
    c.postura = 'empujar'; R.paso(B, 0.1); pide(!c.flanco.cubre, 'empujando no se cubre el costado'); }
  /* HUECO: si el vecino ha cedido mucho terreno, por ese hueco entra el enemigo; y se avisa */
  const trabados = () => { const B = R.nueva(5, 1020, 'cartago'); while (B.sect.some(s => R.lejos(s))) { R.paso(B, 0.1); for (const s of B.sect) { s.c[0].moral = s.c[1].moral = 1; } } return B; };
  { const B = trabados(); B.sect[1].frente = -0.9; R.paso(B, 0.1); const fl = B.sect[0].c[0].flanco, fl2 = B.sect[2].c[0].flanco;
    pide(fl.costado === 1 && fl.causa === 'hueco' && fl2.costado === 0 || fl2.costado === 1, 'si el centro ha cedido, el ala vecina debe quedar con el costado al aire por el hueco');
    pide(B.eventos.some(e => e.tipo === 'flanco' && e.causa === 'hueco'), 'el hueco debe avisarse');
    const B2 = trabados(); B2.sect[1].frente = -0.3; R.paso(B2, 0.1); pide(B2.sect[0].c[0].flanco.costado === 0, 'sin ceder tanto terreno no hay hueco');
    const B3 = trabados(); B3.sect[1].frente = 0.9; R.paso(B3, 0.1); pide(B3.sect[0].c[0].flanco.costado === 0 && B3.sect[0].c[1].flanco.costado === 1, 'quien gana terreno no abre hueco: lo abre el rival'); }
  /* EL VENCEDOR SE VUELVE y CONTAGIO DE MORAL: al huir un cuerpo, sus vecinos pierden ánimo, los del otro bando lo ganan, y a los pocos segundos el vencedor envuelve al vecino */
  { const B = trabados(); for (const s of B.sect) { s.c[0].moral = 0.8; s.c[1].moral = 0.8; } B.sect[2].c[1].moral = 0; R.paso(B, 0.1);
    pide(B.sect[2].c[1].roto, 'un cuerpo sin moral debe huir');
    pide(B.sect[0].c[1].moral < 0.8 - 0.1 && B.sect[1].c[1].moral < 0.8 - 0.1, 'los vecinos del que huye deben perder moral (contagio)'); pide(B.sect[0].c[0].moral > 0.8 && B.sect[1].c[0].moral > 0.8, 'los del bando vencedor deben ganar moral');
    pide(!B.sect[1].c[1].flanqueado, 'al principio el vencedor aún no se ha vuelto');
    for (let t = 0; t < 80; t++) { for (const s of B.sect) { s.c[0].moral = Math.max(s.c[0].moral, 0.9); s.c[1].moral = Math.max(s.c[1].moral, 0.9); } R.paso(B, 0.1); }
    pide(B.sect[1].c[1].flanqueado && B.eventos.some(e => e.tipo === 'envuelve'), 'el vencedor debe volverse y envolver al vecino enemigo'); }
}

/* ---------- PREMIO Y CASTIGO: ÁNIMO DE LA LEGIÓN Y JUICIO DE CADA ORDEN (traído de GM6) ---------- */
console.log('\n== Ánimo de la legión y juicio de las órdenes ==');
{
  const N = 20, correr = (B, bot, cada) => { let prox = 0; while (B.fase !== 'fin') { if (bot && B.t >= prox) { bot(B); prox = B.t + (cada || 1.5); } R.paso(B, 0.1); } return B.resultado; };
  const trabados = () => { const B = R.nueva(9, 1020, 'cartago', [[['hastati', 'principes'], ['hastati', 'principes'], ['hastati', 'principes']], [['iberos'], ['iberos'], ['iberos']]]); while (B.sect.some(s => R.lejos(s))) R.paso(B, 0.1); B.animo = 0.5; B.fijo = true; for (const s of B.sect) for (const c of s.c) { c.postura = 'aguantar'; c.tPost = 20; c.relevo = 0; c.moral = 1; c.empuje = 0; } return B; };
  const prepara = (fat, enemigoCarga) => { const B = trabados(), c = B.sect[0].c[0], e = B.sect[0].c[1]; R.frente(c).fatiga = fat; R.frente(e).fatiga = 0; if (enemigoCarga) { e.postura = 'empujar'; e.tPost = 1; } return B; };
  /* el juicio, caso por caso */
  pide(R.juicioRelevo(prepara(0.1), 0) === 'sin-necesidad', 'relevar con la línea fresca es sin necesidad');
  pide(R.juicioRelevo(prepara(0.8), 0) === 'a-tiempo', 'relevar con la línea agotada es a tiempo');
  pide(R.juicioRelevo(prepara(0.8, true), 0) === 'bajo-carga', 'relevar justo cuando el enemigo carga es bajo la carga');
  { const B = prepara(0.8); B.sect[0].c[0].lineas[1].fatiga = 0.8; pide(R.juicioRelevo(B, 0) === 'sin-aliento', 'relevar con una reserva cansada es sin aliento'); }
  /* lo que da y quita cada relevo: el ánimo, el empuje y el desorden */
  const rel = (fat, carga) => { const B = prepara(fat, carga), c = B.sect[0].c[0]; R.ordenar(B, 0, 'relevo'); return { animo: B.animo, empuje: c.empuje, desorden: c.desorden, relevo: c.relevo, ev: B.eventos.filter(e => e.tipo === 'mando').length }; };
  const a = rel(0.8), b = rel(0.1), d = rel(0.8, true);
  console.log(`   relevo a tiempo: ánimo ${a.animo.toFixed(2)}, empuje ${a.empuje}, entran en ${a.relevo.toFixed(1)} s  ·  sin necesidad: ánimo ${b.animo.toFixed(2)}, desorden ${b.desorden}  ·  bajo la carga: ánimo ${d.animo.toFixed(2)}, desorden ${d.desorden}, entran en ${d.relevo.toFixed(1)} s`);
  pide(a.animo > 0.5 && a.empuje > 0 && a.ev === 1, 'el relevo a tiempo debe subir el ánimo y entrar con empuje');
  pide(b.animo < 0.5 && b.desorden > 0, 'el relevo sin necesidad debe bajar el ánimo y desordenar'); pide(d.animo < 0.5 && d.desorden > b.desorden && d.relevo > a.relevo, 'el relevo bajo la carga debe ser peor: más desorden y más lento');
  /* órdenes sueltas: bien visto, mal visto, y dudar */
  { const B = trabados(), c = B.sect[0].c[0]; R.frente(B.sect[0].c[1]).fatiga = 0.8; c.postura = 'aguantar'; B.t += 5; R.ordenar(B, 0, 'empujar'); pide(B.animo > 0.5, 'empujar cuando flaquean debe subir el ánimo'); }
  { const B = trabados(), c = B.sect[0].c[0]; R.frente(c).fatiga = 0.9; B.t += 5; R.ordenar(B, 0, 'empujar'); pide(B.animo < 0.5, 'empujar con hombres agotados debe bajar el ánimo'); }
  { const B = trabados(), c = B.sect[0].c[0]; B.t += 5; R.ordenar(B, 0, 'empujar'); const a1 = B.animo; B.t += 0.5; R.ordenar(B, 0, 'aguantar'); pide(B.animo < a1 || B.animo < 0.5, 'dar una orden y la contraria al instante debe quitar ánimo'); }
  { const B = trabados(), e = B.sect[0].c[1]; e.postura = 'empujar'; e.tPost = 1; B.sect[0].c[0].postura = 'empujar'; B.t += 5; R.ordenar(B, 0, 'aguantar'); pide(B.animo > 0.5, 'aguantar la carga debe subir el ánimo'); }
  { const B = R.nueva(3, 1020, 'cartago'); const B0 = B.animo; let n = 0; while (R.lejos(B.sect[0]) && B.t < 60) { R.paso(B, 0.1); if (R.tirando(B.sect[0].c[1]) && R.tirando(B.sect[0].c[1]).estado === 'tira' && !n) { B.sect[0].c[0].fuego = B.t; R.ordenar(B, 0, 'escudos'); n = 1; } } pide(!n || B.mando.bien >= 1, 'cubrirse bajo los proyectiles cuenta como acierto'); }
  /* batalla entera: quien manda con cabeza acaba con el ánimo alto; quien marea a la tropa, con el ánimo por los suelos y perdiendo; quien no toca, sin premio */
  const marea = B => { for (let i = 0; i < 3; i++) { const c = B.sect[i].c[0]; if (c.roto || R.lejos(B.sect[i])) continue; R.ordenar(B, i, c.postura === 'empujar' ? 'aguantar' : 'empujar'); R.ordenar(B, i, 'relevo'); } };
  const cabeza = B => { lejos(B, 'escudos'); lucha(B); };
  for (const rival of ['cartago', 'pirro']) {
    const media = (bot, cada) => { let an = 0, bien = 0, mal2 = 0, g = 0; for (let k = 0; k < N; k++) { const r = correr(R.nueva(5000 + k * 4099, 1020, rival), bot, cada); an += r.animo; bien += r.mando.bien; mal2 += r.mando.mal; if (r.como === 'victoria') g++; } return { a: an / N, bien: bien / N, mal: mal2 / N, p: Math.round(100 * g / N) }; };
    const c = media(cabeza), m = media(marea, 1.2), q = media(() => {});
    console.log(`   contra ${rival}: con cabeza, ánimo ${c.a.toFixed(2)} (${c.bien.toFixed(1)} aciertos, ${c.mal.toFixed(1)} errores), gana ${c.p} %  ·  mareando, ánimo ${m.a.toFixed(2)} (${m.bien.toFixed(1)} / ${m.mal.toFixed(1)}), gana ${m.p} %  ·  sin tocar, ánimo ${q.a.toFixed(2)}`);
    pide(c.a > 0.5 && c.bien > c.mal, 'mandar con cabeza debe dejar el ánimo por encima de lo normal'); pide(m.a < c.a - 0.15 && m.mal > m.bien, 'marear a la tropa debe hundir el ánimo'); pide(q.a <= 0.5, 'no hacer nada no debe premiarse');
  }
  /* el ánimo pesa, sin mandar: la misma batalla con el ánimo fijado abajo, en medio y arriba */
  const conAnimo = (x) => { let g = 0; for (let k = 0; k < N; k++) { const B = R.nueva(8000 + k * 577, 700, 'cartago', [[['hastati', 'principes', 'triarii'], ['hastati', 'principes', 'triarii'], ['hastati', 'principes', 'triarii']], [['iberos'], ['iberos'], ['iberos']]]); B.animo = x; B.fijo = true; if (correr(B, lucha).como === 'victoria') g++; } return Math.round(100 * g / N); };
  const g0 = conAnimo(0), g5 = conAnimo(0.5), g1 = conAnimo(1);
  console.log(`   el ánimo solo (misma batalla): por los suelos gana ${g0} %, normal ${g5} %, por las nubes ${g1} %`);
  pide(g1 >= g5 && g5 >= g0 && g1 > g0, 'con más ánimo se debería ganar más');
}

/* ---------- EL RELEVO SE VE PASAR (encargo C): lo que se anima dura lo que dicen las reglas ---------- */
console.log('\n== Relevo visible: duración y juicio ==');
{
  const trab = () => { const B = R.nueva(9, 1020, 'cartago', [[['hastati', 'principes'], ['hastati', 'principes'], ['hastati', 'principes']], [['iberos'], ['iberos'], ['iberos']]]); while (B.sect.some(s => R.lejos(s)) && B.t < 120) R.paso(B, 0.1); return B; };
  const casos = [['a-tiempo', f => { f.fatiga = 0.8; }, 0.6], ['sin-necesidad', f => { f.fatiga = 0.1; }, 1], ['bajo-carga', (f, B) => { f.fatiga = 0.8; B.sect[0].c[1].postura = 'empujar'; B.sect[0].c[1].tPost = 1; }, 1.4]];
  const dur = {};
  for (const [j, prep, k] of casos) {
    const B = trab(), c = B.sect[0].c[0]; prep(R.frente(c), B); R.frente(B.sect[0].c[1]).fatiga = 0;
    const antes = c.lineas.slice(), juicio = R.juicioRelevo(B, 0); R.ordenar(B, 0, 'relevo');
    pide(juicio === j, 'el juicio de ' + j + ' sale ' + juicio);
    pide(c.lineas[0] === antes[1] && c.lineas[c.lineas.length - 1] === antes[0], 'tras el relevo la línea de refresco está delante y la cansada detrás (' + j + ')');
    pide(Math.abs(c.relevoDe - R.T_RELEVO * k) < 1e-9 && R.progresoRelevo(c) === 0, 'la duración visible del relevo ' + j + ' es ' + k + ' × T_RELEVO (' + c.relevoDe.toFixed(2) + ' s)');
    /* se avanza con el reloj de las reglas: el progreso sube sin saltos y llega a 1 justo cuando se acaba el relevo */
    let t = 0, prev = 0, salto = 0; const t0 = B.t; while (c.relevo > 0 && t < 10) { R.paso(B, 0.05); t += 0.05; const u = R.progresoRelevo(c); if (u < prev - 1e-9) salto++; prev = u; }
    dur[j] = t; pide(R.progresoRelevo(c) === 1 && salto === 0 && Math.abs(t - c.relevoDe) <= 0.1, 'el progreso del relevo ' + j + ' sube de 0 a 1 en ' + c.relevoDe.toFixed(2) + ' s (medido ' + t.toFixed(2) + ' s)');
  }
  console.log(`   relevo visible: a tiempo ${dur['a-tiempo'].toFixed(2)} s, sin necesidad ${dur['sin-necesidad'].toFixed(2)} s, bajo la carga ${dur['bajo-carga'].toFixed(2)} s`);
  pide(dur['a-tiempo'] < dur['sin-necesidad'] && dur['sin-necesidad'] < dur['bajo-carga'] && Math.abs(dur['a-tiempo'] / dur['sin-necesidad'] - 0.6) < 0.05, 'a tiempo entra en ~60 % del tiempo; bajo la carga es el más lento');
  { const B = trab(), c = B.sect[0].c[0]; pide(R.progresoRelevo(c) === 0, 'sin relevo el progreso es 0'); }
}


/* ---------- DESPLIEGUE Y PLAN (GM21): fondo, disposición, caballería, vélites ---------- */
console.log('\n== Despliegue y plan (GM21) ==');
{
  const N = 12, H = 5000, SEM = k => 1000 + k * 7919;
  const juega = (rival, plan, bot, k, nParam) => {
    const B = nParam === 4 ? R.nueva(SEM(k), H, rival) : R.nueva(SEM(k), H, rival, undefined, plan); let prox = 0;
    while (B.fase !== 'fin') { if (B.t >= prox) { bot(B); prox = B.t + 1.5; } R.paso(B, 0.1); }
    return B;
  };
  const huella = B => JSON.stringify([B.resultado.como, B.resultado.t.toFixed(2), B.resultado.bajas]);
  const mide = (rival, plan, bot) => { let g = 0, bR = 0, bE = 0, desb = 0, t = 0; for (let k = 0; k < N; k++) { const B = juega(rival, plan, bot, k), r = B.resultado; if (r.como === 'victoria') g++; bR += r.bajas[0] / r.inicial[0]; bE += r.bajas[1] / r.inicial[1]; t += r.t; if (B.eventos.some(e => e.tipo === 'flanco' && e.causa === 'desborde')) desb++; } return { pct: Math.round(100 * g / N), bR: Math.round(100 * bR / N), bE: Math.round(100 * bE / N), t: Math.round(t / N), desb }; };
  /* (a) sin plan, lo mismo que antes: mismo resultado y mismas bajas que la llamada de cuatro parámetros */
  { let igual = 0, tot = 0; for (const rival of ['cartago', 'pirro']) for (let k = 0; k < 4; k++) { tot++; if (huella(juega(rival, undefined, bots['con cabeza, escudos a tiempo'], k, 4)) === huella(juega(rival, R.PLAN_BASE, bots['con cabeza, escudos a tiempo'], k, 5))) igual++; }
    console.log(`   sin plan o con el plan base, igual que antes: ${igual} de ${tot}`); pide(igual === tot, 'sin plan, el resultado debe ser idéntico a nueva de cuatro parámetros'); }
  const planes = [];
  for (const f of Object.keys(R.FONDOS)) for (const d of Object.keys(R.DISPOSICIONES)) planes.push([`fondo ${f} + ${d}`, { fondo: f, disposicion: d }]);
  for (const c of Object.keys(R.SITIOS_CABALLERIA)) planes.push([`caballería ${c}`, { caballeria: c }]);
  planes.push(['vélites delante: sí', { velites: true }], ['vélites delante: no', { velites: false }]);
  console.log('   plan                                  | con cabeza: Cartago (gana, bajas Roma/enemigo) · Pirro   | torpe: Cartago · Pirro');
  const todos = [];
  for (const [n, plan] of planes) {
    const o = {}; for (const rival of ['cartago', 'pirro']) { o[rival] = mide(rival, plan, bots['con cabeza, escudos a tiempo']); o[rival + 'T'] = mide(rival, plan, bots['con cabeza, SIN cubrirse']); }
    todos.push([n, o]);
    console.log(`   ${n.padEnd(37)} | ${String(o.cartago.pct).padStart(3)} % (${o.cartago.bR}/${o.cartago.bE}) · ${String(o.pirro.pct).padStart(3)} % (${o.pirro.bR}/${o.pirro.bE}) | ${String(o.cartagoT.pct).padStart(3)} % · ${String(o.pirroT.pct).padStart(3)} %`);
  }
  /* (c) ningún plan gana siempre, ni siquiera con el bot torpe */
  for (const [n, o] of todos) pide(!(o.cartagoT.pct === 100 && o.pirroT.pct === 100), `el plan «${n}» gana el 100 % contra los dos rivales con el bot torpe`);
  /* (c) el fondo se nota: ningún fondo da el mismo resultado exacto que otro */
  { const por = f => mide('cartago', { fondo: f }, bots['con cabeza, escudos a tiempo']), huellas = Object.keys(R.FONDOS).map(f => { const m = por(f); return f + ':' + JSON.stringify(m); });
    console.log('   por fondo, contra Cartago: ' + huellas.join('  ·  ')); pide(new Set(huellas.map(h => h.split(':').slice(1).join(':'))).size === 3, 'cada fondo debe dar un resultado distinto'); }
  { const B = (f, g) => { const x = R.nueva(77, H, 'cartago', undefined, { fondo: [f, g, f] }); return x; }; const x = B('ancho', 'hondo');
    pide(x.sect[0].c[0].ff === R.FONDOS.ancho && x.sect[1].c[0].ff === R.FONDOS.hondo, 'cada cuerpo toma su propio fondo'); }
  /* (d) el desborde: Roma ancha contra la falange lo provoca; Roma normal, no; Roma honda es desbordada */
  { const corto = (plan, rival) => { const B = R.nueva(5, H, rival, undefined, plan); let prox = 0; while (B.fase !== 'fin' && B.t < 90) { if (B.t >= prox) { bots['con cabeza, escudos a tiempo'](B); prox = B.t + 1.5; } R.paso(B, 0.1); } return B.eventos.filter(e => e.tipo === 'flanco' && e.causa === 'desborde'); };
    const a = corto({ fondo: 'ancho' }, 'pirro'), n = corto({ fondo: 'normal' }, 'pirro'), h = corto({ fondo: 'hondo' }, 'cartago');
    console.log(`   desborde: ancho contra la falange «${(a[0] || {}).texto}» · normal: ${n.length} avisos · hondo contra Cartago «${(h[0] || {}).texto}»`);
    pide(a.some(e => e.lado === 1 && /Desbordas su línea/.test(e.texto)), 'Roma ancha contra la falange debe desbordarla (aviso «Desbordas su línea…»)');
    pide(n.length === 0, 'Roma en fondo normal contra la falange no la desborda ni la desbordan');
    pide(h.some(e => e.lado === 0 && /Te desbordan/.test(e.texto)), 'Roma honda frente a un rival normal es desbordada (aviso «Te desbordan…»)');
    const B6 = R.nueva(5, H, 'pirro', undefined, { fondo: 'ancho' }); while (R.lejos(B6.sect[1]) && B6.t < 120) R.paso(B6, 0.1); const t0 = B6.t; while (B6.t < t0 + 5) R.paso(B6, 0.1); pide(B6.sect[1].c[1].flanco.causa !== 'desborde', 'el desborde no llega antes de 6 s del choque'); while (B6.t < t0 + 8) R.paso(B6, 0.1); pide(B6.sect[1].c[1].flanco.causa === 'desborde' && B6.sect[1].c[1].flanco.costado < 1, 'a los 6 s llega el desborde, con menos peso que un flanqueo completo'); }
  /* disposición: reparto de hombres y metros */
  { const total = B => R.inicialLado(B, 0), base = R.nueva(1, H, 'cartago'), hs = (B, i) => B.sect[i].c[0].inicial;
    for (const d of Object.keys(R.DISPOSICIONES)) { const B = R.nueva(1, H, 'cartago', undefined, { disposicion: d }); pide(total(B) === total(base), `${d}: los hombres se reparten sin perder ni ganar ninguno`); }
    const cf = R.nueva(1, H, 'cartago', undefined, { disposicion: 'centro-fuerte' }), ai = R.nueva(1, H, 'cartago', undefined, { disposicion: 'ala-izquierda' }), ad = R.nueva(1, H, 'cartago', undefined, { disposicion: 'ala-derecha' }), ca = R.nueva(1, H, 'cartago', undefined, { disposicion: 'centro-atras' });
    pide(hs(cf, 1) > hs(cf, 0) * 1.5 && hs(cf, 0) < hs(base, 0), 'centro fuerte: el centro es mucho mayor y las alas menores');
    pide(hs(ai, 0) > hs(ai, 1) && hs(ai, 0) > hs(ai, 2) && ai.sect[2].dist === base.sect[2].dist + 30 && ai.sect[0].dist === base.sect[0].dist, 'ala izquierda fuerte: la izquierda es mayor y la derecha sale 30 m más atrás');
    pide(hs(ad, 2) > hs(ad, 1) && ad.sect[0].dist === base.sect[0].dist + 30, 'ala derecha fuerte: espejo de la izquierda');
    pide(ca.sect[1].dist === base.sect[1].dist + 35 && ca.sect[0].dist === base.sect[0].dist, 'centro atrás: el centro sale 35 m más atrás');
    const t = c => c.lineas.map(l => l.tipo + ':' + (l.max / (c.lineas[0].max || 1)).toFixed(1)).join(','); pide(t(cf.sect[1].c[0]) === t(base.sect[1].c[0]), 'el reparto mantiene la proporción de cada tropa'); }
  /* caballería y vélites */
  { const llega = (plan, i) => { const B = R.nueva(2, H, 'cartago', undefined, { caballeria: plan }); R.ordenar(B, i, 'caballeria'); return B.cab.t; };
    pide(llega('izquierda', 0) < llega('reserva', 0) && llega('izquierda', 2) > llega('reserva', 2), 'caballería en el ala izquierda: llega antes a la izquierda y después a las demás');
    pide(llega('derecha', 2) < llega('reserva', 2) && llega('derecha', 0) > llega('reserva', 0), 'caballería en el ala derecha: espejo');
    pide(llega('repartida', 0) < llega('reserva', 0) && llega('repartida', 2) < llega('reserva', 2), 'caballería repartida: llega antes a las dos alas');
    const golpe = plan => { const B = R.nueva(2, H, 'cartago', undefined, { caballeria: plan }); while (B.sect.some(s => R.lejos(s))) R.paso(B, 0.1); const e = B.sect[0].c[1]; e.moral = 1; R.ordenar(B, 0, 'caballeria'); const antes = R.hombres(e); let k = 0; while (B.cab.estado === 'yendo' && k++ < 400) R.paso(B, 0.05); return antes - R.hombres(e); };
    pide(golpe('repartida') < golpe('reserva') * 0.8, 'la caballería repartida golpea con la mitad de fuerza');
    const num = plan => { const B = R.nueva(2, H, 'cartago', undefined, { caballeria: plan }); B.num.sect = 0; B.num.proxima = 0; B.t = 1; R.paso(B, 0.1); return B.num.estado === 'llega' ? B.num.t : -1; };
    const nIz = (() => { let r = []; for (const plan of ['reserva', 'izquierda']) { let tot = 0, n = 0; for (let sd = 1; sd < 40; sd++) { const B = R.nueva(sd, H, 'cartago', undefined, { caballeria: plan }); B.num.proxima = 0; B.t = 1; R.paso(B, 0.1); if (B.num.estado === 'llega' && B.num.sect === 0) { tot += B.num.t; n++; } } r.push(n ? tot / n : 0); } return r; })();
    pide(nIz[0] > 0 && Math.abs(nIz[1] / nIz[0] - 2) < 0.05, 'los jinetes enemigos que van al ala de tu caballería tardan el doble en llegar');
    const velites = v => { const B = R.nueva(2, H, 'cartago', undefined, { velites: v }); let n = 0; while (R.lejos(B.sect[1]) && B.t < 120) { R.paso(B, 0.1); } return { tiran: B.eventos.some(e => e.tipo === 'tir-tiran' && e.lado === 0), t: B.sect.reduce((a, s) => a + (s.c[0].tir ? s.c[0].tir.hombres : 0), 0), ini: B.sect.reduce((a, s) => a + (s.c[0].tir ? s.c[0].tir.max : 0), 0) }; };
    const vs = velites(true), vn = velites(false); pide(vs.tiran && !vn.tiran, 'sin vélites delante no tiran; con ellos, sí'); pide(vn.t === vn.ini, 'los vélites que se quedan detrás no sufren bajas de proyectil'); }
  /* partidas con plan: todas terminan solas */
  pide(todos.every(([n, o]) => o.cartago.t > 60 && o.cartago.t < 345 && o.pirro.t > 60 && o.pirro.t < 345), 'toda batalla con plan debe terminar entre uno y cinco minutos y medio');
}

console.log(mal ? 'NO APTO' : 'APTO');
process.exit(mal ? 1 : 0);
