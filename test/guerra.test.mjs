// AQVILA — GC3: motor de la guerra nueva sin pantalla. node test/guerra.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const R = require('../js/guerra.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

const ROMA = { hastati: 360, principes: 360, triarii: 180, equites: 60 };
const ENEM = { galos: 690, libios: 780, iberos: 690, numidas: 60 };
const mult = (ej, k) => { const o = {}; for (const x in ej) o[x] = Math.round(ej[x] * k); return o; };

const bots = {
  'no toca nada': () => {},
  'todo empujar': (B) => { for (let i = 0; i < 3; i++) R.ordenar(B, i, 'empujar'); },
  'solo aguantar y relevar': (B) => { for (let i = 0; i < 3; i++) { const c = B.sect[i].c[0]; if (!c.roto && R.frente(c).fatiga > 0.75 && c.lineas.length > 1 && c.lineas[1].fatiga < 0.4) R.ordenar(B, i, 'relevo'); } },
  'empujar y relevar siempre': (B) => { for (let i = 0; i < 3; i++) { const c = B.sect[i].c[0]; if (c.roto) continue; R.ordenar(B, i, 'empujar'); if (R.frente(c).fatiga > 0.7 && c.lineas.length > 1 && c.lineas[1].fatiga < 0.45) R.ordenar(B, i, 'relevo'); } },
  'con cabeza': (B) => {
    R.cubrirse(B);                     /* GM5: escudos bajo los proyectiles, avanzar para el choque */
    if (B.fase !== 'lucha') return;
    for (let i = 0; i < 3; i++) {
      const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue;
      const fe = R.frente(e).fatiga, fr = R.frente(c).fatiga;
      const quiere = (e.postura === 'aguantar' && fr < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar';
      R.ordenar(B, i, quiere);
      const l = R.frente(c), sig = c.lineas[1];
      if (sig && sig.fatiga < 0.4 && (fr > 0.7 || l.hombres < 0.45 * l.max) && sig.hombres / sig.max > l.hombres / l.max - 0.1) R.ordenar(B, i, 'relevo');
    }
    if (B.cab.estado === 'lista') {
      if ((B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
      else if (B.num.proxima - B.t > 12 || B.num.veces >= 3) { const v = B.sect.filter(s => !s.c[1].roto && !s.c[0].roto).sort((a, b) => a.c[1].moral - b.c[1].moral)[0]; if (v && v.c[1].moral < 0.6) R.ordenar(B, v.i, 'caballeria'); }
    }
  },
};
const cada = 1.5;
function juega(ej0, ej1, bot, semilla) {
  const B = R.crear({ semilla, ejercitos: [ej0, ej1] }); let prox = 0;
  while (B.fase !== 'fin') { if (B.t >= prox) { bot(B); prox = B.t + cada; } R.paso(B, 0.1); }
  return B;
}
function serie(ej0, ej1, bot, N) {
  let gana = 0, dur = 0, min = 1e9, max = 0;
  for (let k = 0; k < N; k++) { const B = juega(ej0, ej1, bot, 1000 + k * 7919), r = B.resultado; if (r.como === 'victoria') gana++; dur += r.t; min = Math.min(min, r.t); max = Math.max(max, r.t); }
  return { pct: Math.round(100 * gana / N), dur: Math.round(dur / N), min, max };
}

// (a) ejércitos parejos de campaña
const N = 24, pide = { 'no toca nada': p => p <= 5, 'todo empujar': p => p <= 15, 'con cabeza': p => p >= 85 };
const SER = {};
for (const [nombre, bot] of Object.entries(bots)) {
  const s = serie(ROMA, ENEM, bot, N); SER[nombre] = s;
  console.log(`   ${nombre.padEnd(26)} gana ${String(s.pct).padStart(3)} %  ·  dura ${s.dur} s (${Math.round(s.min)}–${Math.round(s.max)})`);
  if (pide[nombre]) t('parejos · ' + nombre + ' gana ' + s.pct + ' %', () => assert(pide[nombre](s.pct), 'no cumple lo pedido'));
}
t('parejos · la batalla bien jugada dura entre 100 y 245 s (GM5: más unos 50 s de acercamiento)', () => { const s = SER['con cabeza']; assert(s.min >= 100 && s.max <= 245, s.min + '–' + s.max); });

// (b) ejércitos desiguales
t('desiguales · Roma el doble de grande gana con claridad aun sin tocar mucho', () => {
  const s = serie(mult(ROMA, 2), ENEM, bots['solo aguantar y relevar'], 16), c = serie(mult(ROMA, 2), ENEM, bots['con cabeza'], 16);
  console.log('   doble: solo aguantar y relevar ' + s.pct + ' %, con cabeza ' + c.pct + ' %');
  assert(c.pct >= 90 && s.pct >= 90, 'doble: ' + s.pct + ' / ' + c.pct);
});
t('desiguales · Roma a la mitad pierde aun con cabeza', () => {
  const c = serie(mult(ROMA, 0.5), ENEM, bots['con cabeza'], 16);
  console.log('   mitad: con cabeza ' + c.pct + ' %');
  assert(c.pct <= 25 && c.pct < SER['con cabeza'].pct, 'mitad: ' + c.pct);
});

// (c) sin caballería
t('sin caballería romana: sin cargas, la orden devuelve el motivo, y la batalla termina', () => {
  const B = R.crear({ semilla: 3, ejercitos: [{ hastati: 360, principes: 360, triarii: 180 }, ENEM] });
  assert.strictEqual(R.puede(B, 0, 'caballeria'), 'No tienes caballería'); assert.strictEqual(R.ordenar(B, 0, 'caballeria'), 'No tienes caballería');
  const f = juega({ hastati: 360, principes: 360, triarii: 180 }, ENEM, bots['con cabeza'], 5);
  assert(f.fase === 'fin' && !f.eventos.some(e => e.tipo === 'caballeria' || e.tipo === 'impacto'));
  const r = R.resumen(f); assert(!r.bajas.some(x => x.tipo === 'equites'));
});
t('sin jinetes enemigos: no hay hostigamiento', () => {
  const f = juega(ROMA, { galos: 690, libios: 780, iberos: 690 }, bots['no toca nada'], 5);
  assert.strictEqual(f.fase, 'fin'); assert(!f.eventos.some(e => e.tipo === 'numidas-aviso'));
});
t('sin caballería en ningún bando termina', () => {
  const f = juega({ hastati: 300, principes: 300, triarii: 150 }, { galos: 600, libios: 600, iberos: 600 }, bots['con cabeza'], 9); assert.strictEqual(f.fase, 'fin');
});

// (d) guardar y cargar
t('guardar y cargar a mitad da lo mismo que no guardar; el estado no tiene funciones', () => {
  const sinFunc = (o, ruta) => { if (typeof o === 'function') throw new Error('función en ' + ruta); if (o && typeof o === 'object') for (const k in o) sinFunc(o[k], ruta + '.' + k); };
  for (const sem of [11, 222, 3333]) {
    const A = R.crear({ semilla: sem, ejercitos: [ROMA, ENEM] }), C = R.crear({ semilla: sem, ejercitos: [ROMA, ENEM] });
    let X = C, prox = 0, prox2 = 0, guardado = false;
    while (A.fase !== 'fin') {
      if (A.t >= prox) { bots['con cabeza'](A); prox = A.t + cada; }
      R.paso(A, 0.1);
      if (X.t >= prox2) { bots['con cabeza'](X); prox2 = X.t + cada; }
      R.paso(X, 0.1);
      if (!guardado && A.t > 40) { guardado = true; sinFunc(X, 'B'); X = R.cargar(R.guardar(X)); }
    }
    assert(guardado, 'no se guardó'); assert.strictEqual(R.guardar(A), R.guardar(X), 'distinto con semilla ' + sem);
  }
  const A = juega(ROMA, ENEM, bots['con cabeza'], 77), B2 = juega(ROMA, ENEM, bots['con cabeza'], 77); assert.strictEqual(R.guardar(A), R.guardar(B2), 'misma semilla, distinto resultado');
});

// (e) reparto y bajas por tipo
const total = o => Object.values(o).reduce((a, x) => a + x, 0);
const compCuerpo = c => c.lineas.map(l => l.tipo + ':' + Math.round(total(l.comp)));
t('reparto de Roma: tres líneas, vélites delante tirando (GM5), caballería fuera', () => {
  const B = R.crear({ semilla: 1, ejercitos: [{ hastati: 360, principes: 360, triarii: 180, velites: 90, equites: 60 }, ENEM] });
  for (const s of B.sect) { const c = s.c[0]; assert.deepStrictEqual(c.lineas.map(l => l.tipo), ['hastati', 'principes', 'triarii']); assert.strictEqual(c.tir.comp.velites, 30); assert.strictEqual(c.lineas[0].hombres, 120); assert.strictEqual(R.hombres(c), 330); }
  assert.strictEqual(B.cab.h, 60); assert(!B.sect.some(s => s.c[0].lineas.some(l => l.comp.equites)));
  const B2 = R.crear({ semilla: 1, ejercitos: [{ hastati: 100, principes: 10 }, ENEM] }); assert.deepStrictEqual(compCuerpo(B2.sect[1].c[0]), ['hastati:34', 'principes:4']); assert.deepStrictEqual(compCuerpo(B2.sect[0].c[0]), ['hastati:33', 'principes:3']);
  const B3 = R.crear({ semilla: 1, ejercitos: [{ velites: 90, milicia: 30 }, ENEM] }); assert.deepStrictEqual(B3.sect[0].c[0].lineas.map(l => l.tipo), ['hastati']); assert.strictEqual(B3.sect[0].c[0].lineas[0].hombres, 10); assert.strictEqual(B3.sect[0].c[0].tir.hombres, 30);
  const B4 = R.crear({ semilla: 1, ejercitos: [{ velites: 90 }, ENEM] }); assert.strictEqual(B4.sect[0].c[0].lineas[0].hombres, 30, 'solo vélites: forman la línea'); assert.strictEqual(B4.sect[0].c[0].tir, null);
});
t('reparto del enemigo: cuatro tipos, dos tipos y tipo desconocido', () => {
  const B = R.crear({ semilla: 1, ejercitos: [ROMA, { galos: 690, libios: 780, iberos: 600, honderos: 90, numidas: 60 }] });
  assert.strictEqual(B.sect[1].c[1].lineas[0].tipo, 'libios'); assert.strictEqual(B.sect[0].c[1].lineas[0].tipo, 'galos'); assert.strictEqual(B.sect[2].c[1].lineas[0].tipo, 'iberos');
  for (const s of B.sect) assert.strictEqual(s.c[1].tir.tipo, 'honderos', 'honderos delante (GM5)'); assert.strictEqual(B.num.h, 60);
  const B5 = R.crear({ semilla: 1, ejercitos: [ROMA, { galos: 690, libios: 780, iberos: 600, sagrada: 90 }] }); assert.strictEqual(B5.sect[2].c[1].lineas.length, 2, 'refresco en el cuerpo más flojo');
  const D2 = R.crear({ semilla: 1, ejercitos: [ROMA, { hoplitas: 300, peltastas: 90 }] });
  for (const s of D2.sect) { assert.deepStrictEqual(s.c[1].lineas.map(l => l.tipo + ':' + l.hombres), ['hoplitas:100']); assert.strictEqual(s.c[1].tir.hombres, 30); }
  const G = R.crear({ semilla: 1, ejercitos: [ROMA, { quimeras: 300 }] });
  assert.strictEqual(G.sect[0].c[1].lineas[0].tipo, 'quimeras'); for (let k = 0; k < 120 && G.fase === 'lejos'; k++) R.paso(G, 1); assert.strictEqual(G.fase, 'lucha');
  const T = R.CARACTER; assert(T.galos.cal === 1.34 && T.libios.cansa === 0.72 && T.galos.mente === 'furia' && T.libios.mente === 'paciencia' && R.GENERICO.mente === 'media');
});
t('las bajas por tipo suman las del total y no superan lo que había', () => {
  const ej1 = { galos: 690, libios: 780, iberos: 600, honderos: 90, numidas: 60 }, ej0 = { hastati: 360, principes: 360, triarii: 180, velites: 90, equites: 60 };
  for (const sem of [1, 2, 3, 4]) {
    const B = juega(ej0, ej1, bots['todo empujar'], sem), r = R.resumen(B);
    assert.strictEqual(r.bajas.length, 5 + 5); assert.strictEqual(r.victoria, r.ganador === 0);
    for (const x of r.bajas) { assert(x.bajas >= 0 && x.bajas <= x.n0 && x.n === x.n0 - x.bajas, x.tipo); assert(Number.isInteger(x.bajas)); }
    for (let b = 0; b < 2; b++) { const s = r.bajas.filter(x => x.bando === b).reduce((a, x) => a + x.bajas, 0); assert.strictEqual(s, r.bajasTotal[b]); }
    assert.strictEqual(r.general, null);
    const vivosE = r.bajas.filter(x => x.bando === 1).reduce((a, x) => a + x.n, 0); assert.strictEqual(r.prisioneros, r.ganador === 0 ? Math.round(0.25 * vivosE) : 0);
  }
  const B = R.crear({ semilla: 1, ejercitos: [ROMA, ENEM] }); R.paso(B, 8); const q = R.resumen(B); assert.strictEqual(q.ganador, 1, 'retirada = derrota');
});
t('la caballería entra en las bajas', () => {
  let hay = false;
  for (let k = 0; k < 6 && !hay; k++) { const r = R.resumen(juega(ROMA, ENEM, bots['con cabeza'], 40 + k)); hay = r.bajas.some(x => x.tipo === 'equites' && x.bajas > 0) || r.bajas.some(x => x.tipo === 'numidas' && x.bajas > 0); }
  assert(hay, 'ni cargas ni hostigamiento dejaron bajas de caballo');
});

// (f) ejércitos diminutos y vacíos
t('ejército diminuto (5 hombres) y vacío no rompen el motor', () => {
  for (const [a, b] of [[{ hastati: 5 }, ENEM], [ROMA, { galos: 5 }], [{ hastati: 5 }, { galos: 5 }], [{}, ENEM], [ROMA, {}], [{}, {}], [{ equites: 60 }, ENEM], [ROMA, { numidas: 60 }]]) {
    const B = juega(a, b, bots['con cabeza'], 5), r = R.resumen(B);
    assert.strictEqual(B.fase, 'fin'); assert(Number.isFinite(B.t) && B.t < 300);
    for (const x of r.bajas) assert(x.bajas >= 0 && x.bajas <= x.n0);
    JSON.parse(R.guardar(B));
  }
  assert.strictEqual(R.resumen(juega({ equites: 60 }, ENEM, bots['no toca nada'], 5)).ganador, 1, 'sin infantería pierde');
  assert.strictEqual(R.resumen(juega(ROMA, {}, bots['no toca nada'], 5)).ganador, 0, 'enemigo sin infantería pierde');
});

/* GC5: rivales con carácter */
const PIRRO = { falange: 700, hoplitas: 400, peltastas: 200, elefantes: 12, tesalios: 100 };
t('elefantes: línea propia delante en el centro, con su referencia; sin ellos no hay línea', () => {
  const B = R.crear({ semilla: 3, ejercitos: [ROMA, PIRRO] });
  const c = B.sect[1].c[1]; assert.strictEqual(c.lineas[0].tipo, 'elefantes'); assert.strictEqual(c.lineas[0].hombres, 12);
  assert(B.sect[0].c[1].lineas.every(l => l.tipo !== 'elefantes') && B.sect[2].c[1].lineas.every(l => l.tipo !== 'elefantes'));
  assert(R.crear({ semilla: 3, ejercitos: [ROMA, { falange: 700, hoplitas: 400, peltastas: 200 }] }).sect[1].c[1].lineas.every(l => l.tipo !== 'elefantes'));
  const solo = R.crear({ semilla: 3, ejercitos: [ROMA, { elefantes: 6 }] }); assert(R.hombresLado(solo, 1) > 0, 'solo elefantes cuentan como infantería');
});
t('elefantes: se desbocan una sola vez, avisan y las bajas suman bien', () => {
  let visto = 0, todos = 0;
  for (let sem = 1; sem <= 12; sem++) {
    const B = juega(ROMA, PIRRO, bots['con cabeza'], sem), r = R.resumen(B), d = B.eventos.filter(e => e.tipo === 'elefantes-desbocados');
    assert(d.length <= 1, 'más de un desboque'); if (d.length) { visto++; assert(/elefantes/i.test(d[0].texto)); } todos++;
    for (const x of r.bajas) assert(x.bajas >= 0 && x.bajas <= x.n0);
    JSON.parse(R.guardar(B));
  }
  assert(visto >= 6, 'los elefantes casi siempre acaban desbocándose (' + visto + '/' + todos + ')');
});
t('falange: el flanco la hunde más que a otra tropa', () => {
  assert(R.CARACTER.falange.flanco > 1.5 && R.CARACTER.falange.firme);
  const gana = e => { let v = 0; for (let s = 1; s <= 10; s++) if (R.resumen(juega(ROMA, e, bots['con cabeza'], s)).victoria) v++; return v; };
  const f = gana({ falange: 900, peltastas: 300, tesalios: 100 }); assert(f >= 1 && f <= 10, 'falange: ni imposible ni trivial (' + f + '/10)');
});
t('textos: cuadran con cada rival (género, número y sitio)', () => {
  const F = R.FRASE;
  assert.strictEqual(F.carga('falange', 'en el centro'), 'La falange avanza con las sarisas bajas en el centro');
  assert.strictEqual(F.carga('elefantes', 'por la izquierda'), 'Los elefantes arremeten por la izquierda');
  assert.strictEqual(F.carga('hoplitas', 'por la derecha'), 'Los hoplitas cargan por la derecha');
  assert.strictEqual(F.carga('galos', 'por la izquierda'), 'Los guerreros galos se lanzan a la carga por la izquierda');
  assert.strictEqual(F.cede('falange', 'en el centro'), 'La falange se detiene en el centro');
  assert.strictEqual(F.cede('libios', 'por la derecha'), 'La infantería libia flaquea por la derecha');
  assert.strictEqual(F.huye('sagrada', 'en el centro'), 'Los ciudadanos de Cartago huyen en el centro');
  assert.strictEqual(F.cede('libios', 'en el centro'), 'La infantería libia flaquea en el centro');
  assert.strictEqual(F.huye('milicia', 'por la izquierda'), 'La milicia huye por la izquierda');
  for (const rival of [PIRRO, { galos: 500 }, { hoplitas: 300, milicia: 100 }, { libios: 400, iberos: 300, honderos: 100, sagrada: 200 }]) {
    const B = juega(ROMA, rival, bots['con cabeza'], 4);
    for (const e of B.eventos) assert(!/ undefined|\bDe\b|Carga de|Huye el cuerpo de|Flaquea el empuje/.test(e.texto || ''), 'texto raro: ' + e.texto);
  }
});

console.log(mal ? 'MAL: ' + mal + ' de ' + (n + mal) : 'APTO: ' + n + ' comprobaciones');
process.exit(mal ? 1 : 0);
