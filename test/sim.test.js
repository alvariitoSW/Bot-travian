/* Pruebas sin navegador: node test/sim.test.js */
const assert = require('assert');
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const G = require('../js/game.js');
const CIUDADES_0 = JSON.stringify(D.CITIES);   // I8-a: pruebas anteriores retocan guarniciones de D.CITIES y no las devuelven; el bloque de la partida corta las restaura

const side = (units, extra) => Object.assign({ units, name: 'x', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, extra || {});
function fight(a, b, opt) { const bt = new Battle(Object.assign({ sides: [side(a), side(b)], defender: 1, wall: 0, seed: 42 }, opt || {})); bt.finish(); return bt.result(); }

// 1. Las batallas terminan y gana el más fuerte
let r = fight({ hastati: 300, velites: 60, equites: 40 }, { milicia: 100 });
assert.strictEqual(r.winner, 0, 'ejército superior debe ganar');
r = fight({ hastati: 60 }, { falange: 300, tesalios: 80, elefantes: 10 });
assert.strictEqual(r.winner, 1, 'ejército inferior debe perder');
assert(r.time < 1500, 'toda batalla termina antes del tope de seguridad');

// 2. Igualdad: resultado razonable y con bajas en ambos bandos
r = fight({ hastati: 200 }, { libios: 200 });
assert(r.dead[0] > 20 && r.dead[1] > 20, 'ambos bandos sufren bajas');

// 2b. Ritmo (A8): una batalla igualada dura entre 3,5 y 7 minutos (R1; antes 5 a 12) de juego
for (const sd of [1, 2, 3, 4]) {
  const q = fight({ hastati: 200 }, { libios: 200 }, { seed: sd });
  assert(q.time >= 150 && q.time <= 420, 'igualada 200 vs 200 (semilla ' + sd + '): ' + Math.round(q.time) + ' s');
  const m = fight({ hastati: 300, velites: 60, equites: 40 }, { libios: 265, numidas: 52, jinetes: 33 }, { seed: sd });
  assert(m.time >= 150 && m.time <= 420, 'igualada mixta (semilla ' + sd + '): ' + Math.round(m.time) + ' s');
  assert(fight({ hastati: 300, velites: 60, equites: 40 }, { milicia: 100 }, { seed: sd }).time > 20, "la desigual no dura segundos");
}

// 2c. La moral no cae en cadena: nunca se rompe más de la mitad de un bando en 10 s
for (const sd of [1, 2, 3]) {
  const bt = new Battle({ sides: [side({ hastati: 300, velites: 60, equites: 40 }), side({ libios: 265, numidas: 52, jinetes: 33 })], defender: 1, wall: 0, seed: sd });
  const tot = [0, 0]; for (const g of bt.regs) tot[g.side]++;
  const hist = []; let worst = 0;
  while (!bt.over) {
    bt.step(0.1);
    const n = [0, 0]; for (const g of bt.regs) if (g.st !== 'ok') n[g.side]++;
    hist.push(n); if (hist.length > 101) hist.shift();
    if (hist.length > 100) for (let k = 0; k < 2; k++) worst = Math.max(worst, (n[k] - hist[0][k]) / tot[k]);
  }
  assert(worst <= 0.5, 'cadena de huidas: ' + worst + ' (semilla ' + sd + ')');
}

// 2d. El cansancio sube peleando y baja descansando
{
  const bt = new Battle({ sides: [side({ hastati: 100 }), side({ libios: 100 })], defender: 1, wall: 0, seed: 5 });
  for (let i = 0; i < 3000; i++) bt.step(0.1);
  const g = bt.regs.filter(x => x.st === 'ok');
  assert(g.length && g.every(x => x.fat >= 0 && x.fat <= 100) && Math.max.apply(null, g.map(x => x.fat)) > 20, 'peleando se cansan');
  const x = g[0]; x.fat = 50; x.order = { k: 'move', x: x.x, y: x.y }; x.tgt = null; x.fight = 0;
  for (const o of bt.regs) if (o.side !== x.side) o.st = 'fled'; // sin enemigos: descansa
  bt.over = false; for (let i = 0; i < 100; i++) bt.step(0.1);
  assert(x.fat < 50, 'descansando baja el cansancio');
}

// 2e. Toda batalla termina antes del tope, incluso con muralla alta y fuerzas parejas
for (let sd = 1; sd <= 5; sd++) { const q = fight({ principes: 150, triarii: 50 }, { hoplitas: 200 }, { seed: sd, wall: 10 }); assert(q.time < 1500 && q.winner !== null, 'termina (semilla ' + sd + ')'); }

// 2g. Despliegue (A5a)
{
  const mk = o => new Battle(Object.assign({ sides: [side({ hastati: 400, principes: 300, velites: 80, equites: 60 }, { gen: { n: 'Cónsul' } }), side({ libios: 200, numidas: 60, honderos: 40 })], defender: 1, wall: 0, seed: 11 }, o || {}));
  const bd = mk({ despliegue: true });
  assert.strictEqual(bd.fase, 'despliegue'); bd.step(5); bd.step(5); assert.strictEqual(bd.t, 0, 'despliegue: el tiempo no avanza');
  const mio = bd.regs.find(r => r.side === 0 && r.u.cls === 'inf'), ene = bd.regs.find(r => r.side === 1), e0 = [ene.x, ene.y], z = bd.zona(0);
  assert(bd.colocar(mio, -500, -500), 'colocar devuelve true'); assert(mio.x === z.x0 && mio.y === z.y0, 'colocar recorta a la zona');
  assert(!bd.colocar(ene, 300, 800), 'no se coloca al enemigo'); assert.deepStrictEqual([ene.x, ene.y], e0);
  const anchoFila1 = () => { const inf = bd.regs.filter(r => r.side === 0 && (r.u.cls === 'inf' || r.u.cls === 'spear')), yf = Math.min(...inf.map(r => r.y)), fila = inf.filter(r => Math.abs(r.y - yf) < 1); return Math.max(...fila.map(r => r.x)) - Math.min(...fila.map(r => r.x)); };
  const w = {};
  for (const [nom] of Battle.PLANTILLAS) {
    bd.formar(0, nom); w[nom] = anchoFila1();
    for (const r of bd.regs.filter(r => r.side === 0)) assert(r.x >= z.x0 && r.x <= z.x1 && r.y >= z.y0 - 0.01 && r.y <= z.y1 + 0.01 || nom === 'clasica' && r.x >= 20 && r.x <= bd.W - 20, 'plantilla ' + nom + ' dentro del campo y la zona');
  }
  assert(w.ancha > w.clasica && w.centro < w.clasica, 'anchuras de primera fila: ' + JSON.stringify(w));
  bd.empezar(); bd.step(1); assert(bd.t > 0, 'tras empezar el tiempo corre');
  const bf = mk({ despliegue: true }); bf.finish(); assert(bf.over, 'finish() desde despliegue termina');
  const ba = mk(), bb = mk({ despliegue: true }); bb.empezar(); ba.finish(); bb.finish();
  assert.deepStrictEqual(ba.result().dead, bb.result().dead, 'despliegue + empezar() = batalla de siempre');
}

// 2h. Plantillas de despliegue (A5c): todo dentro de la zona y sin regimientos apilados; colocar() solo en despliegue
{
  const ejercitos = [
    { hastati: 400, principes: 300, triarii: 120, velites: 80, equites: 60 },
    { hastati: 900, velites: 200 },
    { hastati: 200, principes: 200, triarii: 100, velites: 60, equites: 120, elefantes: 6 },
    { principes: 90 }
  ];
  ejercitos.forEach((u, ei) => [true, false].forEach(conGen => {
    const bt = new Battle({ sides: [side(u, conGen ? { gen: { n: 'Cónsul' } } : {}), side({ libios: 200, numidas: 60 })], defender: 1, wall: 0, seed: 5, despliegue: true });
    for (const lado of [0, 1]) for (const [nom] of Battle.PLANTILLAS) {
      bt.formar(lado, nom); const z = bt.zona(lado), mios = bt.regs.filter(r => r.side === lado);
      mios.forEach(r => assert(r.x >= z.x0 && r.x <= z.x1 && r.y >= z.y0 - 0.01 && r.y <= z.y1 + 0.01, 'plantilla ' + nom + ' (ejército ' + ei + ', lado ' + lado + ') dentro de la zona'));
      for (let i = 0; i < mios.length; i++) for (let j = i + 1; j < mios.length; j++) assert(Math.hypot(mios[i].x - mios[j].x, mios[i].y - mios[j].y) >= 20, 'plantilla ' + nom + ' (ejército ' + ei + '): dos regimientos apilados');
    }
  }));
  const bt = new Battle({ sides: [side({ hastati: 300 }), side({ libios: 100 })], defender: 1, wall: 0, seed: 3, despliegue: true });
  const m = bt.regs.find(r => r.side === 0); bt.empezar(); const p0 = [m.x, m.y];
  assert(!bt.colocar(m, 300, 800) && m.x === p0[0] && m.y === p0[1], 'colocar() no hace nada fuera del despliegue');
}

// 2f. Formación y marcha (A9)
{
  const mix = () => side({ hastati: 200, velites: 80, equites: 60 }), enemigo = () => side({ libios: 200, numidas: 60, honderos: 40, jinetes: 60 });
  const bt = new Battle({ sides: [mix(), enemigo()], defender: 1, wall: 0, seed: 7 });
  for (const sd of [0, 1]) {
    const mine = bt.regs.filter(r => r.side === sd), f = sd === 0 ? 1 : -1; // f>0: más lejos del enemigo = y mayor
    const inf = mine.filter(r => r.u.cls === 'inf' || r.u.cls === 'spear'), rng = mine.filter(r => r.u.cls === 'rng'), cav = mine.filter(r => r.u.cls === 'cav');
    assert(inf.length && rng.length && cav.length, 'hay de todo (lado ' + sd + ')');
    const front = Math.max(...inf.map(r => r.y * -f));
    for (const t of rng) assert(t.y * -f < front, 'tirador detrás de la primera fila (lado ' + sd + ')');
    const xmin = Math.min(...inf.map(r => r.x)), xmax = Math.max(...inf.map(r => r.x));
    assert(cav.some(c => c.x < xmin) && cav.some(c => c.x > xmax), 'caballería en las dos alas (lado ' + sd + ')');
    for (const r of mine) assert(r.x >= 20 && r.x <= bt.W - 20, 'dentro del campo');
  }
  // lejos del enemigo: paso de marcha
  const r0 = bt.regs.find(r => r.side === 0 && r.u.cls === 'inf'), y0 = r0.y;
  bt.step(0.2);
  assert(Math.abs(r0.y - y0) <= r0.u.spd * 0.5 * 0.2 + 1.5, 'de marcha no pasa de spd x 0.5');
  // los tiradores con munición no pelean por iniciativa propia mientras quede infantería
  const bt2 = new Battle({ sides: [mix(), enemigo()], defender: 1, wall: 0, seed: 7 });
  while (bt2.t < 60 && !bt2.over) {
    bt2.step(0.2);
    for (const sd of [0, 1]) {
      const inf = bt2.regs.filter(r => r.side === sd && r.st === 'ok' && (r.u.cls === 'inf' || r.u.cls === 'spear'));
      if (!inf.length) continue;
      const f = sd === 0 ? 1 : -1, front = Math.min(...inf.map(r => r.y * f));
      for (const t of bt2.regs) if (t.side === sd && t.st === 'ok' && t.u.cls === 'rng' && t.ammo > 0) assert(t.y * f > front - 20, 'tirador no se adelanta a su infantería (t=' + bt2.t.toFixed(0) + ')');
    }
  }
}

// 2i. Combate que se ve (A3): los tiradores causan bajas antes del cuerpo a cuerpo; la caballería persigue a un regimiento roto
{
  const bt = new Battle({ sides: [side({ hastati: 150, velites: 80 }), side({ libios: 150, honderos: 80 })], defender: 1, wall: 0, seed: 3 });
  const bajas = () => bt.regs.reduce((n, g) => n + (g.max - g.men), 0);
  let cuerpo = false, antes = 0, vistos = 0;
  while (!bt.over && bt.t < 120 && !cuerpo) {
    bt.step(0.2);
    if (bt.regs.some(g => g.fight > 0)) cuerpo = true; else { antes = bajas(); if (bt.fx.length) vistos++; }
  }
  assert(cuerpo, 'llega el cuerpo a cuerpo'); assert(vistos > 0 && antes > 0, 'los tiradores causan bajas antes del choque: ' + antes);
  const bp = new Battle({ sides: [side({ equites: 40 }), side({ libios: 90, hastati: 30 })], defender: 1, wall: 0, seed: 4 });
  const cab = bp.regs.find(g => g.side === 0 && g.u.cls === 'cav'), huye = bp.regs.find(g => g.side === 1);
  for (const g of bp.regs) { if (g === cab || g === huye) continue; if (g.side === 0) { g.x = 40; g.y = 880; } else { g.x = 560; g.y = 40; } }
  cab.x = 300; cab.y = 400; huye.x = 300; huye.y = 330; huye.st = 'rout'; const h0 = huye.men, c0 = cab.men;
  for (let i = 0; i < 40; i++) bp.step(0.2);
  assert(huye.men < h0, 'la caballería causa bajas al que huye: ' + h0 + ' -> ' + huye.men); assert(cab.men === c0, 'el que huye no hace daño a la caballería');
}

// 2j. Papeles de la infantería (A4): los lanceros detienen la carga; la ligera pierde el choque contra la pesada
{
  assert(Battle.PAPEL.triarii === 'lanceros' && Battle.PAPEL.principes === 'pesada' && Battle.papelDe('iberos', D.UNITS.iberos) === 'ligera', 'tabla de papeles');
  for (const k in D.UNITS) assert(Battle.papelDe(k, D.UNITS[k]), 'papel para ' + k);
  // mismo molde y coste, distinto papel
  D.UNITS.t_lan = Object.assign({}, D.UNITS.hastati, { cls: 'spear' }); D.UNITS.t_med = Object.assign({}, D.UNITS.hastati);
  D.UNITS.t_lig = Object.assign({}, D.UNITS.hastati); D.UNITS.t_pes = Object.assign({}, D.UNITS.hastati);
  Battle.PAPEL.t_lan = 'lanceros'; Battle.PAPEL.t_med = 'media'; Battle.PAPEL.t_lig = 'ligera'; Battle.PAPEL.t_pes = 'pesada';
  const carga = k => {
    const bt = new Battle({ sides: [side({ equites: 40 }), side({ [k]: 90 })], defender: 1, wall: 0, seed: 5 });
    const cab = bt.regs.find(g => g.side === 0 && g.u.cls === 'cav'), inf = bt.regs.find(g => g.side === 1 && g.k === k);
    for (const g of bt.regs) { if (g === cab || g === inf) continue; if (g.side === 0) { g.x = 40; g.y = 880; } else { g.x = 560; g.y = 40; } }
    cab.x = 300; cab.y = 600; inf.x = 300; inf.y = 300; cab.order = { k: 'atk', r: inf }; inf.order = { k: 'move', x: 300, y: 300 };
    let cargo = false; const c0 = cab.men, i0 = inf.men;
    for (let i = 0; i < 400 && cab.st === 'ok' && inf.st === 'ok'; i++) { bt.step(0.1); if (cab.charge > 0) cargo = true; if (bt.t > 40) break; }
    return { cab: c0 - cab.men, inf: i0 - inf.men, cargo };
  };
  const L = carga('t_lan'), M = carga('t_med');
  assert(L.cab > M.cab, 'los lanceros hacen más bajas a la caballería que la infantería media: ' + L.cab + ' vs ' + M.cab);
  const dc = new Battle({ sides: [side({ equites: 40 }), side({ t_lan: 90 })], defender: 1, wall: 0, seed: 5 });
  const c2 = dc.regs.find(g => g.side === 0 && g.u.cls === 'cav'), l2 = dc.regs.find(g => g.side === 1 && g.k === 't_lan');
  c2.x = 300; c2.y = 400; l2.x = 300; l2.y = 340; l2.ang = Math.PI / 2; c2.charge = 2.5; c2.run = 100; const f0 = c2.fat;
  dc.hit(c2, l2, 10, false);
  assert(c2.charge === 0 && c2.fat > f0, 'la carga contra lanceros se detiene (sin arrollar)');
  const ganaLig = []; let gl = 0;
  for (let sd = 1; sd <= 6; sd++) { const q = fight({ t_lig: 150 }, { t_pes: 150 }, { seed: sd }); if (q.winner === 0) gl++; ganaLig.push(q.dead[0] - q.dead[1]); }
  assert(gl === 0, 'la ligera pierde el choque frontal contra la pesada de igual tamaño y coste (' + gl + '/6 victorias)');
  assert(ganaLig.every(x => x > 0), 'la ligera sufre más bajas que la pesada');
  for (const k of ['t_lan', 't_med', 't_lig', 't_pes']) { delete D.UNITS[k]; delete Battle.PAPEL[k]; }
}

// 3. Las lanzas frenan a la caballería; la muralla ayuda al defensor
const cavVsSpear = fight({ equites: 120 }, { hoplitas: 120 }), cavVsInf = fight({ equites: 120 }, { milicia: 160 });
assert(cavVsSpear.dead[0] > cavVsInf.dead[0], 'la caballería sufre más contra lanzas');
let wins = 0; for (let s = 1; s <= 10; s++) if (fight({ hastati: 200 }, { libios: 190 }, { wall: 6, seed: s }).winner === 1) wins++;
assert(wins >= 7, 'la muralla debe inclinar la batalla (' + wins + '/10)');

// 4. Mapa coherente
for (const e of D.EDGES) assert(D.CITIES[e[0]] && D.CITIES[e[1]], 'ruta inválida ' + e);
for (const id in D.CITIES) { assert(D.FACTIONS[D.CITIES[id].f]); for (const k in D.CITIES[id].g) assert(D.UNITS[k], k); }

// 4b. Rutas comerciales (B2)
{
  G.newGame('Test'); let s = G.state; assert(Array.isArray(s.rutas) && !s.rutas.length, 'newGame crea rutas');
  s.res.oro = 1000;
  assert(G.rutaPuede('roma', 'capua'), 'sin mercado no se abre');
  s.cities.roma.b.mercado = 1; s.cities.capua.b.mercado = 1;
  assert.strictEqual(G.rutaPuede('roma', 'mediolanum'), 'No hay camino', 'sin vecindad no se abre');
  const oro0 = G.prod().oro;
  assert.strictEqual(G.rutaPuede('roma', 'capua'), null); assert(G.rutaAbrir('roma', 'capua'));
  assert.strictEqual(s.res.oro, 1000 - D.RUTA_COSTE, 'cuesta oro');
  assert(!G.rutaAbrir('capua', 'roma') && G.rutaPuede('capua', 'roma'), 'sin duplicados a-b = b-a');
  const renta = G.rutaRenta(s.rutas[0]); assert.strictEqual(renta, D.RUTA_BASE + 2, 'Roma-Capua con mercados 1: ' + renta);
  assert(Math.abs(G.prod().oro - oro0 - renta) < 1e-9 && G.prod().rutas === renta, 'la renta entra en prod().oro');
  assert(G.rutaPuede('roma', 'volsinii') === 'Sin hueco: mejora el mercado', 'máximo 1 ruta con mercado 1-2');
  s.cities.roma.b.mercado = 3; assert.strictEqual(G.rutaPuede('roma', 'volsinii'), null, 'mercado 3 da un hueco más');
  s.res.oro = 50; assert(/oro/.test(G.rutaPuede('roma', 'volsinii')), 'exige oro'); s.res.oro = 1000;
  // por mar: puerto y más renta
  s.cities.roma.b.mercado = 6;
  assert.strictEqual(G.rutaPuede('roma', 'emporion'), 'Hace falta un puerto');
  s.cities.roma.b.puerto = 1; assert(G.rutaAbrir('roma', 'emporion'));
  const rm = s.rutas.find(r => r.b === 'emporion'), rr = G.rutaRenta(rm);
  assert(G.rutaMar(rm) && Math.abs(rr - (D.RUTA_BASE + 6 + D.RUTA_W * (s.cities.emporion.w || D.CITIES.emporion.w)) * D.RUTA_MAR * (D.TIPOS[s.cities.roma.tipo].oroCom || 1)) < 1e-9, 'por mar rinde más');
  // tratado: da acceso al bien del aliado
  assert.strictEqual(D.CITIES.emporion.esp, 'vino'); assert(G.especiales().vino, 'el tratado con Emporion da su bien');
  // se rompe al atacar a esa facción
  s.cities.roma.units = { hastati: 50 }; assert(G.send('roma', 'emporion', { hastati: 20 }));
  assert(!G.rutaDe('roma', 'emporion'), 'atacar a la facción cierra el tratado'); assert(!G.especiales().vino, 'sin tratado se pierde el bien');
  assert(G.rutaPuede('roma', 'emporion') && /guerra/i.test(G.rutaPuede('roma', 'emporion')), 'no se firma en guerra');
  // cambio de dueño de b ajena
  G.newGame('Test'); s = G.state; s.res.oro = 1000; s.cities.roma.b.mercado = 3; s.cities.capua.b.mercado = 1;
  assert(G.rutaAbrir('roma', 'volsinii')); s.cities.volsinii.owner = 'galos'; G.rutasRevisar(); assert(!G.rutaDe('roma', 'volsinii'), 'b cambia de dueño: se cierra');
  assert(G.rutaAbrir('roma', 'capua')); s.cities.capua.owner = 'cartago'; G.rutasRevisar(); assert(!G.rutaDe('roma', 'capua'), 'b nuevo dueño enemigo cierra');
  s.cities.capua.owner = 'roma'; assert(G.rutaAbrir('roma', 'capua')); s.cities.roma.owner = 'cartago'; G.rutasRevisar(); assert(!s.rutas.length, 'perder a cierra');
  // b ajena que pasa a ser tuya: queda interior
  G.newGame('Test'); s = G.state; s.res.oro = 1000; s.cities.roma.b.mercado = 3; assert(G.rutaAbrir('roma', 'volsinii')); s.cities.volsinii.owner = 'roma'; G.rutasRevisar(); assert(G.rutaDe('roma', 'volsinii') && s.rutas[0].f === 'roma', 'se queda como interior');
  // cierre a mano
  assert(G.rutaCerrar('volsinii', 'roma') && !s.rutas.length && !G.rutaCerrar('roma', 'volsinii'));
  // migración de partida sin rutas
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  G.newGame('Test'); delete G.state.rutas; G.save(); assert(G.load() && Array.isArray(G.state.rutas), 'migra partidas sin rutas'); delete global.localStorage;
}

// 2k. Terreno (A5b): quien ocupa la colina gana más y pierde menos; el bosque frena, reduce los proyectiles y quita la carga
{
  assert(Battle.terrenoDe('agrigentum', 1) === 'colina' && Battle.terrenoDe('roma', 1) === 'cerro' && Battle.terrenoDe('zzz', 6) === 'bosque', 'terreno por ciudad o por semilla');
  for (const id of ['colina', 'bosque', 'mixto']) { // cada bando tiene colina/bosque en su zona de despliegue
    const bt = new Battle({ sides: [side({ hastati: 100 }), side({ libios: 100 })], defender: 1, wall: 0, seed: 1, terreno: id });
    for (const sd of [0, 1]) { const z = bt.zona(sd); let n = 0; for (let y = z.y0; y <= z.y1; y += 20) for (let x = z.x0; x <= z.x1; x += 20) { const t = bt.terrenoEn(x, y); if (t.alt > 0 || t.bosque) n++; } assert(n > 5, id + ': el bando ' + sd + ' tiene terreno en su zona'); }
  }
  const alto = (bt, lado) => { const T = bt.tr; T.plano = false; for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) T.alt[r * T.cols + c] = (r * 40 + 20 < bt.H / 2) === (lado === 1) ? 1 : 0; bt.celdas = {}; };
  let gana = 0, bajasAlto = 0, bajasBajo = 0, ganaIz = 0;
  for (let sd = 1; sd <= 6; sd++) for (const lado of [0, 1]) {
    const bt = new Battle({ sides: [side({ hastati: 150, velites: 40 }), side({ hastati: 150, velites: 40 })], defender: 1, wall: 0, seed: sd, terreno: 'colina' }); alto(bt, lado); bt.finish(); const q = bt.result();
    if (q.winner === lado) gana++; bajasAlto += q.dead[lado]; bajasBajo += q.dead[1 - lado];
  }
  assert(gana >= 8, 'el que ocupa la colina gana más veces (' + gana + '/12)'); assert(bajasAlto < bajasBajo, 'y sufre menos bajas: ' + bajasAlto + ' vs ' + bajasBajo);
  // bosque: menos daño de proyectiles, más lento, sin bonificación de carga
  const bos = en => { const bt = new Battle({ sides: [side({ hastati: 60, velites: 60 }), side({ libios: 60 })], defender: 1, wall: 0, seed: 2, terreno: 'bosque' }); bt.tr.plano = false; bt.tr.bos.fill(en ? 1 : 0); bt.tr.alt.fill(0); bt.celdas = {}; return bt; };
  const dmg = en => { const bt = bos(en), a = bt.regs.find(g => g.k === 'velites'), b = bt.regs.find(g => g.side === 1); const h0 = b.hp; bt.hit(a, b, 100, true); return h0 - b.hp; };
  assert(dmg(true) < dmg(false) * 0.8, 'el bosque reduce el daño de proyectiles: ' + dmg(true).toFixed(2) + ' vs ' + dmg(false).toFixed(2));
  const mueve = en => { const bt = bos(en), a = bt.regs.find(g => g.side === 0); a.x = 300; a.y = 600; bt.moveTo(a, 300, 100, 1, 1); return 600 - a.y; };
  assert(mueve(true) < mueve(false) * 0.8, 'el bosque frena');
  const carga = en => { const bt = bos(en), a = bt.regs.find(g => g.side === 0), b = bt.regs.find(g => g.side === 1); a.charge = 2; bt.hit(a, b, 100, false); return 1e9 - 1e9 + (b.max * (b.u.hp || 1) - b.hp); };
  assert(carga(true) < carga(false) * 0.7, 'la carga pierde fuerza en el bosque');
}

// 5. Campaña completa con un bot sencillo: no debe lanzar excepciones y debe terminar
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function campaign(aggressive, seed, region, opciones) {
  const rndOrig = Math.random; if (seed) Math.random = mulberry32(seed);
  try { return campaign1(aggressive, region, opciones); } finally { Math.random = rndOrig; }
}
function campaign1(aggressive, region, opciones) {
  const s = G.newGame('Test', region, opciones); const meta = G.capitalRival(); const events = [];
  G.onEvent = (t, p) => { events.push(t); if (process.env.V && t === 'log' && /⚠|🔥|🏆|💀|rechaza|📜/.test(p.x)) console.log('  ', G.yearOf(s.t), p.x); };
  if (G.fundando()) { const sitio = G.modo().inicio.fundar.sitio; let pt = G.notaFundar(sitio, 172, -196).vale ? [172, -196] : null; for (let x = -300; x <= 300 && !pt; x += 20) for (let z = -300; z <= 300 && !pt; z += 20) if (G.notaFundar(sitio, x, z).vale) pt = [x, z]; assert(pt, 'hay un punto válido para fundar'); assert(G.fundarColonia(sitio, pt[0], pt[1]).ok); }   // I8: el bot funda su primera ciudad
  const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  let guard = 0;
  while (!s.over && guard++ < 200000) {
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); if (process.env.DBG) console.log(G.yearOf(s.t), JSON.stringify(info.cfg.sides.map(x => x.units)), 'def', info.cfg.defender, 'wall', info.cfg.wall, '->', b.result().winner, Math.round(b.t)); G.applyBattle(b.result()); }
    if (guard % 8) continue;
    if (D.SENADO.sala && s.senado && s.senado.votacion) G.votar(G.tratos(s.senado.votacion.id).filter(t => t.etiqueta === 'Favorable'));   // SN1: el bot vota con la tarjeta Favorable (o deja pasar)
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); let hizo = false; for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; } if (!hizo) break; }
      G.levantarMuralla(id);   // CN7: la muralla de la guerra sale de la obra de ciudad, no de c.b.muralla
      if (!aggressive) continue;
      const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;   // el bot se atrinchera ante la invasión de Aníbal
      // concentración: las tropas avanzan por la ruta más corta hacia Carthago mientras la siguiente plaza sea romana
      const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
      if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === G.capital() ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === G.capital() ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { if (s.senado) s.senado.permisos[t.owner] = 99999; G.send(id, n, u, G.heroAvailable(id)); break; }   // SN1: el bot declara la guerra por su cuenta
      }
    }
  }
  assert(s.over, 'la campaña debe terminar');
  assert(events.includes('event'));
  return s;
}
// 10 semillas del azar de la IA: el agresivo debe tomar Carthago antes del 146 a.C. en la mayoría; el pasivo, nunca
const res = { pas: [], agr: [] }; let activo = null;
for (const ag of [false, true]) for (let sd = 1; sd <= 10; sd++) { const s = campaign(ag, sd); res[ag ? 'agr' : 'pas'].push(s); if (ag && sd === 1) activo = s; }
const resumen = l => l.map(s => (s.over.win ? 'V' : 'd') + G.yearOf(s.t)).join(' ');
console.log('Bot pasivo   →', resumen(res.pas)); console.log('Bot agresivo →', resumen(res.agr));
const ganaAgr = res.agr.filter(s => s.over.win).length, ganaPas = res.pas.filter(s => s.over.win).length;
assert(ganaAgr >= 6, 'el bot agresivo debe tomar Carthago en al menos 6 de 10 semillas (' + ganaAgr + '/10)');
assert.strictEqual(ganaPas, 0, 'un bot pasivo no debe ganar nunca (' + ganaPas + '/10)');
const active = activo;
assert(JSON.parse(JSON.stringify(active)).v === 1, 'el estado debe ser serializable');
assert(G.myCities().length >= 3, 'un bot agresivo debe poder conquistar ciudades');
// I6: regiones. Italia es jugable (el agresivo gana alguna vez, el pasivo nunca) y se juega solo con sus ciudades
{ const ri = { pas: [], agr: [] };
  for (const ag of [false, true]) for (let sd = 1; sd <= 10; sd++) { const s = campaign(ag, sd, 'italia'); ri[ag ? 'agr' : 'pas'].push(s);
    assert.strictEqual(s.region, 'italia'); const dentro = new Set(D.regionCiudades('italia'));
    for (const id in s.cities) assert(dentro.has(id), 'ciudad fuera de Italia: ' + id);
    for (const r of s.rutas) assert(dentro.has(r.a) && dentro.has(r.b), 'ruta fuera de Italia');
    for (const m of s.marches) assert((!m.from || dentro.has(m.from)) && dentro.has(m.to), 'marcha fuera de Italia'); }
  console.log('Italia pasivo  →', resumen(ri.pas)); console.log('Italia agresivo →', resumen(ri.agr));
  const gi = ri.agr.filter(s => s.over.win).length, pi = ri.pas.filter(s => s.over.win).length;
  assert(gi >= 5, 'Italia: el bot agresivo debe ganar en la mayoría (' + gi + '/10)'); assert.strictEqual(pi, 0, 'Italia: el pasivo no gana (' + pi + '/10)');
  assert(ri.agr.some(s => /Tarento/.test(s.over.why)) || gi === 0, 'el texto de victoria es el de la región');
  assert(ri.pas.every(s => /230/.test(s.over.why) || !s.over.win)); }
// I6: una región inventada solo con datos se juega sin tocar código
{ D.REGIONES.prueba = { n: 'Prueba', ciudades: ['roma', 'capua', 'tarentum', 'messana'], hechos: [280, 275], capitalRival: 'messana', hasta: 250, final: { gana: 'Messana cae en {anio}.', agota: 'Se acabó el plazo.' }, camara: { lon: 14, lat: 40, zoom: 2 } };
  try {
    assert.deepStrictEqual(D.regionCiudades('prueba'), ['roma', 'capua', 'tarentum', 'messana']); assert(D.regionEdges('prueba').every(e => D.regionCiudades('prueba').includes(e[0]) && D.regionCiudades('prueba').includes(e[1])));
    const s0 = G.newGame('P', 'prueba'); assert.strictEqual(G.regionId(), 'prueba'); assert.deepStrictEqual(Object.keys(s0.cities).sort(), ['capua', 'messana', 'roma', 'tarentum']); assert(!G.edge('roma', 'volsinii'));
    for (const ag of [false, true]) for (let sd = 1; sd <= 3; sd++) { const s = campaign(ag, sd, 'prueba'); assert(s.over); assert(!ag ? !s.over.win : true); }
  } finally { delete D.REGIONES.prueba; } }
// I6: una partida vieja (sin región) carga como Mediterráneo; una región desconocida también
{ const raw = require('fs').readFileSync(__dirname + '/partida-vieja.json', 'utf8'); assert(!JSON.parse(raw).region);
  global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} }; assert(G.load()); assert.strictEqual(G.state.region, 'mediterraneo'); assert.strictEqual(G.regionId(), 'mediterraneo');
  const med = G.newGame('M'); assert.strictEqual(med.region, 'mediterraneo'); assert.strictEqual(Object.keys(med.cities).length, Object.keys(D.CITIES).length); assert.strictEqual(G.newGame('X', 'noexiste').region, 'mediterraneo'); }
// CN2b: las pruebas de economía que siguen miden los números de c.b (sin ciudad nueva); la ciudad nueva se prueba al final del archivo
const CIMOD = require('../js/ciudad.js'); G.usarCiudad(null);
// 7. Bien especial por ciudad (B1): abre niveles altos y tropas de élite; los bonos cambian números
{ const s = G.newGame('Esp'), roma = s.cities.roma;
  for (const id in D.CITIES) assert(D.ESPECIAL[D.CITIES[id].esp], 'la ciudad ' + id + ' debe tener un bien válido');
  for (const k in D.ESPECIAL) { assert(G.dondeEspecial(k).length >= 1, 'bien sin ciudad ' + k); if (D.ESPECIAL[k].abre.edificios || D.ESPECIAL[k].abre.tropas) assert(G.dondeEspecial(k).length >= 2 && (k === 'marmol' || G.dondeEspecial(k).some(i => ['roma', 'volsinii', 'capua', 'tarentum', 'messana', 'syracusae', 'agrigentum', 'panormus', 'lilybaeum'].includes(i))), 'bien ' + k + ': al menos dos ciudades y una en Italia o Sicilia (mármol es griego: excepción histórica)'); }
  assert(G.especiales().sal && !G.especiales().hierro, 'Roma tiene sal y aún no hierro');
  roma.b.cuartel = 5; roma.b.establo = 1; roma.b.foro = D.ESP_NIVEL; roma.b.puerto = D.ESP_NIVEL;
  assert(G.faltaEspecial('tropa', 'triarii') === 'hierro' && !G.unitOk(roma, 'triarii'), 'sin hierro no hay triarios');
  s.res = { madera: 1e6, piedra: 1e6, hierro: 1e6, grano: 1e6, oro: 1e6 };
  assert(G.faltaEspecial('edificio', 'foro', D.ESP_NIVEL) === 'marmol' && !G.upgrade('roma', 'foro'), 'sin mármol no se pasa del nivel ' + D.ESP_NIVEL);
  assert(G.faltaEspecial('edificio', 'foro', D.ESP_NIVEL - 1) === null && G.faltaEspecial('edificio', 'aserradero', 9) === null, 'solo los edificios señalados piden bien y solo pasado el nivel');
  const bonoAntes = { fel: G.felicidad(roma), pop: G.bonoMul('crece'), oro: G.prod().oro };
  s.cities.volsinii.owner = 'roma'; s.cities.volsinii.units = {};   // hierro
  assert(G.especiales().hierro && G.unitOk(roma, 'triarii') && G.faltaEspecial('tropa', 'triarii') === null, 'con Volsinii hay hierro y triarios');
  assert(G.fuentesEspecial('hierro').join() === 'volsinii');
  s.cities.pella.owner = 'roma'; assert(G.faltaEspecial('edificio', 'foro', D.ESP_NIVEL) === null && G.upgrade('roma', 'foro'), 'con Pella hay mármol y sube el foro');
  s.cities.pella.owner = 'macedonia'; assert(G.faltaEspecial('edificio', 'foro', D.ESP_NIVEL) === 'marmol', 'al perder la ciudad vuelve a bloquear');
  s.cities.volsinii.owner = 'etruscos'; assert(!G.unitOk(roma, 'triarii'), 'al perder Volsinii vuelve a bloquear los triarios');
  // extensión para rutas comerciales (B2)
  G.fuentesExtra.push(k => k === 'plata' ? ['carthagonova'] : []); assert(G.especiales().plata); G.fuentesExtra.pop(); assert(!G.especiales().plata);
  // bonos
  const own = k => { s.cities[G.dondeEspecial(k).find(i => !G.myCities().includes(i))].units = {}; s.cities[G.dondeEspecial(k).find(i => !G.myCities().includes(i))].owner = 'roma'; };
  const f0 = G.felicidad(roma); own('vino'); assert.strictEqual(G.felicidad(roma), f0 + 5, 'vino: +5 de felicidad');
  const o0 = G.prod().oro; own('plata'); assert(G.prod().oro > o0, 'plata: más oro de impuestos');
  roma.units = { hastati: 100 }; const m0 = G.mantenimiento().tropas; own('pieles'); assert(Math.abs(G.mantenimiento().tropas - m0 * 0.9) < 1e-9, 'pieles: la paga cuesta un 10 % menos');
  assert.strictEqual(G.bonoMul('crece'), 1.1, 'sal: +10 % de crecimiento');
  const b0 = G.buildTime(roma, 'cantera'); own('marmol'); assert(G.buildTime(roma, 'cantera') < b0, 'mármol: obras más rápidas');
  const fc0 = G.forjaCost('armas', 0, 'roma').hierro; own('hierro'); assert(G.forjaCost('armas', 0, 'roma').hierro < fc0, 'hierro: forja más barata');
  assert(G.especiales().caballos && G.bonoMul('instr') === 0.9, 'caballos (Capua desde el inicio): instrucción un 10 % más rápida');
  own('maderanaval'); assert(G.bonoMul('viajeMar') === 0.9, 'madera naval: viajes por mar más rápidos');
  own('purpura'); assert(G.bonoMul('oroCom') === 1.1, 'púrpura: más oro de comercio');
}
// 6. Ciudad: población, mercado y puerto
{ const s = G.newGame('Eco'), roma = s.cities.roma;
  assert(roma.pop > 100 && roma.pop <= G.popCap(roma), 'población inicial dentro del tope');
  const before = roma.pop; assert(G.train('roma', 'hastati', 20)); assert.strictEqual(Math.round(before - roma.pop), 20, 'los reclutas salen de la población');
  assert(!G.train('roma', 'hastati', 5000), 'no se recluta más gente de la que hay');
  const mercCapua = s.cities.capua.b.mercado; s.cities.capua.b.mercado = 0;   // Capua (aliada romana) trae su propio mercado
  assert.strictEqual(G.trade('madera', 'hierro', 100), 0, 'sin mercado no hay comercio');
  s.cities.capua.b.mercado = mercCapua;
  roma.b.mercado = 2; const got = G.trade('madera', 'hierro', 100); assert(got > 40 && got < 100, 'el mercado cambia con comisión: ' + got);
  assert(!G.send('roma', 'carales', { hastati: 10 }, false), 'sin puerto no se embarca');
  roma.b.puerto = 1; assert(G.send('roma', 'carales', { hastati: 10 }, false), 'con puerto sí');
  assert(!G.upgrade('volsinii', 'puerto'), 'ciudad ajena o sin mar no construye puerto');
  for (let i = 0; i < 400; i++) G.tick(0.25); assert(roma.pop > before - 20, 'la población se recupera con el tiempo'); }
// 7. Herrería: mejoras de armas y armaduras
{ const s = G.newGame('Forja'), roma = s.cities.roma;
  assert(!G.forjaUp('roma', 'armas'), 'sin herrería no se forja');
  roma.b.herreria = 1; s.res = { madera: 5000, piedra: 5000, hierro: 5000, grano: 5000, oro: 5000 };
  const h0 = s.res.hierro, pb = { kind: 'attack', m: { to: 'volsinii', units: { hastati: 10 }, hero: false, id: 1 } };
  assert.strictEqual(G.battleInfo(pb).cfg.sides[0].atkMul, 1, 'sin mejoras el ataque es 1');
  assert(G.forjaUp('roma', 'armas'), 'se compra la mejora'); assert(s.res.hierro < h0, 'cobra');
  assert(!G.forjaUp('roma', 'armaduras'), 'solo una mejora a la vez');
  for (let i = 0; i < 400 && s.forja.armas < 1; i++) G.tick(0.1);
  assert.strictEqual(s.forja.armas, 1, 'sube el nivel tras el tiempo'); assert.strictEqual(s.forja.cola, null);
  assert(Math.abs(G.battleInfo(pb).cfg.sides[0].atkMul - 1.05) < 1e-9, 'ataque +5 %');
  assert(!G.forjaUp('roma', 'armas'), 'no pasa del nivel de la herrería');
  roma.b.herreria = 5; assert(G.forjaUp('roma', 'armaduras'));
  for (let i = 0; i < 400 && s.forja.armaduras < 1; i++) G.tick(0.1);
  assert(Math.abs(G.battleInfo(pb).cfg.sides[0].defMul - 1.05) < 1e-9, 'defensa +5 %');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  localStorage.setItem('aqvila-save-v1', JSON.stringify(Object.assign({}, s, { forja: undefined })));
  assert(G.load() && G.state.forja.armas === 0 && G.state.forja.cola === null, 'una partida vieja se migra'); }
// CN10: acueducto, termas y anfiteatro se retiran (no existían entre 280 y 146 a.C.); mercado y templo recogen su efecto
{ const s = G.newGame('Edif'), c = s.cities.roma; const cap0 = G.popCap(c), f0 = G.felicidad(c);
  for (const b of ['acueducto', 'termas', 'anfiteatro']) { assert(!D.BUILD[b], b + ' ya no está en D.BUILD'); assert(!(b in c.b), b + ' no está en c.b'); assert(!(b in D.POP_EDIF) && !(b in D.FELICIDAD_EDIF), b + ' sin efecto'); assert(!/acueducto|termas|anfiteatro/.test(JSON.stringify(D.ESPECIAL)), 'ningún especial los abre'); }
  assert.deepStrictEqual(Object.keys(G.servicios(c, true)).sort(), ['agua', 'grano', 'lujo', 'mercado', 'templo'], 'servicios sin ocio ni termas');
  // compensación: una ciudad bien servida (templo 3, mercado 3) queda en la misma banda que antes con 1-2 de los edificios retirados (antes: pob +120 y fel +9 o más)
  c.b.templo = 3; c.b.mercado = 3; const capS = G.popCap(c), fS = G.felicidad(c);
  assert.strictEqual(capS - cap0, 90, 'templo y mercado: +90 de población máxima'); assert.strictEqual(fS - f0, 18, 'templo y mercado: +18 de felicidad'); assert(fS <= 100);
  const a = G.animoClases(c, true); assert(a.ciu >= 40 && a.ciu <= 90, 'ánimo de ciudadanos en banda');
  c.b.templo = 0; c.b.mercado = 0;
  // partida vieja con los edificios retirados: se quitan y se devuelve el coste hasta el tope del almacén
  const v = JSON.parse(JSON.stringify(s)); G.state = s;
  const r = v.cities.roma, o = v.cities.volsinii; r.b.termas = 2; r.b.anfiteatro = 1; r.b.acueducto = 3; r.heredado = { acueducto: 1 }; o.b.termas = 4; o.owner = 'etruscos';
  r.obras = [{ b: 'termas', nc: 2, pag: 1, cuota: { oro: 40 }, costo: { oro: 80 }, t0: 0, t1: 5 }, { b: 'granja', nc: 1, pag: 1, cuota: {}, costo: {}, t0: 0, t1: 5 }];
  const alm0 = v.alm.oro, madera0 = v.alm.madera, capAlm = (G.state = v, G.cap()); v.alm.madera = capAlm - 100;
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, x) => { mem[k] = x; } };
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v));
  assert(G.load(), 'la partida vieja carga'); const q = G.state;
  for (const id in q.cities) for (const b of ['acueducto', 'termas', 'anfiteatro']) assert(!(b in q.cities[id].b) && !(q.cities[id].heredado && b in q.cities[id].heredado), 'se quita ' + b + ' de ' + id);
  assert.deepStrictEqual(q.cities.roma.obras.map(x => x.b), ['granja'], 'la obra de termas se quita');
  const rr = (b, n) => { let t = 0; for (let l = 0; l < n; l++) t += Math.round(D.RETIRADOS[b].oro * Math.pow(1.5, l) / 5) * 5; return t; };
  const oroDev = rr('termas', 2) + rr('anfiteatro', 1) + rr('acueducto', 3) + 40;   // niveles de Roma + lo ya pagado de la obra
  assert(q.devuelto && q.devuelto.total.oro === Math.min(oroDev, Math.max(0, G.cap() - alm0)), 'oro devuelto con tope (' + (q.devuelto && q.devuelto.total.oro) + ' de ' + oroDev + ')');
  assert.strictEqual(q.alm.madera, G.cap(), 'la madera no pasa del tope del almacén'); assert(q.devuelto.perdido.madera > 0, 'se anota lo perdido por el tope');
  assert.strictEqual(q.devuelto.termas, 6, 'niveles quitados de termas (2 de Roma + 4 ajena)'); assert.strictEqual(G.ultimaMigracion, q.devuelto);
  // otro dueño: sin devolución
  assert.strictEqual(q.cities.volsinii.owner, 'etruscos');
  // una partida sin esos campos carga igual y no devuelve nada
  const w = JSON.parse(JSON.stringify(G.newGame('Limpia'))); localStorage.setItem('aqvila-save-v1', JSON.stringify(w)); assert(G.load() && !G.state.devuelto, 'partida limpia carga sin devolución');
  delete global.localStorage; G.state = s; }
// Impuestos y felicidad
{ const prodOro = k => { const s = G.newGame('Imp'); s.cities.roma.imp = k; return G.prod().oro; };
  const bajo = prodOro('bajo'), normal = prodOro('normal'), alto = prodOro('alto');
  assert(alto > normal && normal > bajo, 'oro: alto > normal > bajo');
  const crece = k => { const s = G.newGame('Imp2'), c = s.cities.roma; G.setImp('roma', k); c.pop = 150; const p0 = c.pop; for (let i = 0; i < 40; i++) G.tick(0.25); return c.pop - p0; };
  assert(G.felicidad(G.newGame('F').cities.roma) === 60, 'felicidad normal = 60');
  assert(crece('alto') === 0, 'con impuestos altos la población no crece');
  assert(crece('normal') > 0, 'con impuestos normales sí crece');
  const s = G.newGame('Imp3'); const ene = Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma'); assert(!G.setImp(ene, 'alto') && s.cities[ene].imp !== 'alto', 'no se tocan ciudades enemigas');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  for (const id in s.cities) delete s.cities[id].imp;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(s));
  assert(G.load() && G.state.cities.roma.imp === 'normal' && G.felicidad(G.state.cities.roma) === 60, 'partida vieja sin imp carga'); }

// Aldeanos: reparto de la población trabajadora
{ const s = G.newGame('Ald'), c = s.cities.roma; const p0 = G.prod();
  assert(G.repartoValido(c.reparto) && c.reparto.madera === 5, 'reparto por defecto 5/5/5/5');
  assert(G.reparto('roma', 'madera', 1) && G.reparto('roma', 'madera', 1), 'se puede subir la madera');
  const p1 = G.prod(); const sum = () => G.REPARTO_RES.reduce((a, k) => a + c.reparto[k], 0);
  assert(p1.madera > p0.madera && p1.piedra + p1.hierro + p1.grano - p0.piedra - p0.hierro - p0.grano < 0 || p1.piedra < p0.piedra || p1.hierro < p0.hierro || p1.grano < p0.grano, 'subir madera baja la de otro');
  assert(sum() === 20 && c.reparto.madera === 7, 'la suma sigue en 20');
  for (let i = 0; i < 30; i++) G.reparto('roma', 'madera', 1);
  assert(c.reparto.madera === 11 && sum() === 20 && !G.reparto('roma', 'madera', 1), 'tope de 11 partes');
  for (let i = 0; i < 40; i++) G.reparto('roma', 'madera', -1);
  assert(c.reparto.madera === 1 && sum() === 20 && !G.reparto('roma', 'madera', -1), 'mínimo de 1 parte');
  const ene = Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma'); assert(!G.reparto(ene, 'madera', 1), 'no se toca el reparto enemigo');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  for (const id in s.cities) delete s.cities[id].reparto;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(s));
  assert(G.load() && G.state.cities.roma.reparto.grano === 5 && G.repartoValido(G.state.cities.roma.reparto), 'partida vieja sin reparto carga 5/5/5/5');
  const n = G.newGame('Ald2'); assert(Math.abs(G.prod().madera - p0.madera) < 1e-9, 'por defecto la producción es la de siempre'); }

// Mano de obra y mantenimiento (I3)
{ const s = G.newGame('MO'), c = s.cities.roma; c.pop = G.puestos(c); const p0 = G.prod();
  assert(G.manoObra(c) === 1, 'con pop >= puestos la mano de obra es 100 %');
  c.pop = G.puestos(c) / 2; const p1 = G.prod();
  assert(p1.madera < p0.madera && p1.grano < p0.grano && Math.abs(G.manoObra(c) - 0.5) < 1e-9, 'menos población baja la producción de la ciudad');
  c.pop = 0; assert(G.manoObra(c) === D.MANO_MIN, 'la mano de obra tiene suelo');
  c.pop = 400; s.res.hierro = s.res.oro = 5000; s.res.grano = 5000; s.res.madera = 5000; s.res.piedra = 5000; c.b.cuartel = 3;
  const a = G.prod().madera; assert(G.train('roma', 'hastati', 100), 'se recluta'); assert(G.prod().madera <= a, 'reclutar no sube la producción');
  const s2 = G.newGame('Mant'); const m = G.mantenimiento(), pr = G.prod();
  assert(m.edificios > 0 && m.tropas > 0 && Math.abs(m.total - m.edificios - m.tropas) < 1e-9 && pr.mant.total === m.total, 'mantenimiento con edificios y paga');
  s2.cities.roma.units = {}; const sinT = G.prod().oro; s2.cities.roma.units = { hastati: 200 }; assert(G.prod().oro < sinT, 'las tropas cuestan oro (paga)');
  const s3 = G.newGame('Paga'); s3.res.oro = 0; s3.cities.roma.units = { hastati: 5000 }; s3.cities.roma.b.foro = 0; const n0 = G.men(s3.cities.roma.units);
  assert(G.prod().oro < 0, 'con 5000 hastati el balance de oro es negativo'); for (let i = 0; i < 8; i++) G.tick(0.5);
  assert(G.men(s3.cities.roma.units) < n0, 'sin oro desertan tropas'); }
/* I3b: la paga de las tropas se cobra de verdad */
{ const s = G.newGame('Deuda'); assert.strictEqual(s.deudaPaga, 0, 'partida nueva sin deuda'); delete s.deudaPaga; G.migrarDeuda(s); assert.strictEqual(s.deudaPaga, 0, 'partida vieja carga sin deuda');
  s.res.oro = 0; s.alm.oro = 0; s.cities.roma.units = { hastati: 5000 }; s.cities.roma.b.foro = 0; const n0 = G.men(s.cities.roma.units);
  for (let i = 0; i < 4; i++) G.tick(0.5); assert(s.deudaPaga > 0, 'lo que no se paga se debe'); const d1 = s.deudaPaga;
  for (let i = 0; i < 8; i++) G.tick(0.5); assert(s.deudaPaga > d1, 'la deuda crece mientras falta oro'); assert(G.men(s.cities.roma.units) < n0, 'la deuda hace desertar');
  assert(G.cuentas().oro.deuda > 0, 'las cuentas muestran la deuda');
  const f0 = s.favor.senado; G.cierreMes(); assert(s.favor.senado < f0, 'con deuda el Senado baja el favor');
  s.cities.roma.units = {}; s.cities.roma.b.foro = 3; s.res.oro = 0; const dd = s.deudaPaga; G.tick(0.5); assert(s.deudaPaga <= dd, 'los ingresos pagan primero la deuda'); }
assert(!G.cityGen('carthago', 280) && !G.cityGen('carthago', 150), 'Cartago no tiene general con nombre antes de 149 a.C.');
assert(G.cityGen('carthago', 149) && G.cityGen('carthago', 146), 'Asdrúbal defiende Cartago desde 149 a.C.');
// Registro de piezas: carga en Node y toda tropa y edificio tiene ficha
{ const R = require('../js/registro.js');
  for (const t of Object.keys(D.UNITS)) assert(R.de('tropa', t) && R.de('tropa', t).historia, 'falta la ficha de la tropa ' + t);
  for (const b of Object.keys(D.BUILD)) assert(R.de('edificio', b) && R.de('edificio', b).arte, 'falta la ficha del edificio ' + b);
  assert(R.de('hecho', D.EVENTS[0].y), 'falta la ficha del primer hecho'); }


// H7. Mapa de 280 a.C. con sus dueños reales
{ const s = G.newGame('H7');
  assert.strictEqual(s.cities.agrigentum.owner, 'akragas'); assert.strictEqual(s.cities.corinthus.owner, 'macedonia');
  assert.strictEqual(s.cities.capua.owner, 'roma'); assert.strictEqual(s.cities.messana.owner, 'mamertinos');
  for (const id in s.cities) assert(D.FACTIONS[s.cities[id].owner], 'dueño inexistente en ' + id);
  s.t = (280 - 264) * 12 - 0.5; s.marches = []; G.tick(1);   // sin la marcha de Pirro, que llega antes y abriría una batalla
  assert.strictEqual(s.cities.agrigentum.owner, 'cartago', 'en 264 Agrigentum pasa a Cartago'); assert.strictEqual(s.cities.agrigentum.units.libios, 140);
  assert.strictEqual(s.cities.corinthus.owner, 'macedonia');
  s.t = (280 - 243) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1);
  assert.strictEqual(s.cities.corinthus.owner, 'aquea', 'en 243 Arato libera Corinto'); assert.strictEqual(s.cities.corinthus.units.hoplitas, 300);
  // partida antigua con dueños de antes: carga sin error y conserva su mapa
  const v = G.newGame('Vieja'); v.cities.messana.owner = 'campanos'; v.cities.capua.owner = 'campanos'; v.cities.agrigentum.owner = 'cartago'; delete v.evN;
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, x) => { mem[k] = x; } };
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v));
  assert(G.load()); assert.strictEqual(G.state.cities.messana.owner, 'mamertinos'); assert.strictEqual(G.state.cities.capua.owner, 'campanos'); assert.strictEqual(G.state.cities.agrigentum.owner, 'cartago'); }

// H8. Carthago Nova: poblado íbero en 280, cartaginesa hacia 228
{ const s = G.newGame('H8'); const c0 = s.cities.carthagonova;
  assert.strictEqual(c0.owner, 'iberos', 'en 280 es poblado íbero'); assert(c0.units.iberos > 0 && !c0.units.libios && c0.b.muralla === 1);
  s.t = (280 - 228) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1);
  const c = s.cities.carthagonova;
  assert.strictEqual(c.owner, 'cartago', 'hacia 228 pasa a Cartago'); assert.strictEqual(c.units.libios, 220); assert.strictEqual(c.b.muralla, 3); assert.strictEqual(c.w, 4);
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, x) => { mem[k] = x; } };
  G.save(); assert(G.load()); assert.strictEqual(G.state.cities.carthagonova.owner, 'cartago'); assert.strictEqual(G.state.cities.carthagonova.units.libios, 220);
  // si ya era romana, no cambia
  const r = G.newGame('H8b'); r.cities.carthagonova.owner = 'roma'; const u = JSON.stringify(r.cities.carthagonova.units);
  r.t = (280 - 228) * 12 - 0.5; r.pending = []; r.marches = []; G.tick(1);
  assert.strictEqual(r.cities.carthagonova.owner, 'roma'); assert.strictEqual(JSON.stringify(r.cities.carthagonova.units), u);
  // partida antigua ya cartaginesa pasado 228: sigue igual al cargar
  const v = G.newGame('Vieja2'); v.t = (280 - 200) * 12; v.cities.carthagonova.owner = 'cartago'; v.cities.carthagonova.units = { libios: 5 }; delete v.evN;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v)); assert(G.load());
  assert.strictEqual(G.state.cities.carthagonova.owner, 'cartago'); assert.strictEqual(G.state.cities.carthagonova.units.libios, 5); }

// licencia de juego: lo inventado para poder jugar lleva su etiqueta
{ const DD = require('../js/data.js');
  DD.EVENTS.filter(e => e.fx).forEach(e => assert(e.lic, 'hecho con efecto sin lic: ' + e.t));
  ['milicia', 'jinetes', 'vigiles'].forEach(k => assert(DD.UNITS[k].lic, 'unidad sin lic: ' + k));
  assert(!DD.UNITS.hastati.lic, 'hastati no es licencia de juego'); }

// refuerzos de guarnición posteriores a un cambio de manos (Agrigentum púnica) y riqueza de partida antigua
{ const s = G.newGame('Post1'); s.t = (280 - 264) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1);
  const a = s.cities.agrigentum; assert.strictEqual(a.owner, 'cartago');
  assert(G.guarnicionBase('agrigentum', 'cartago') && G.guarnicionBase('corinthus', 'aquea'));
  a.units = { libios: 10 }; for (let i = 0; i < 40; i++) { s.pending = []; s.marches = s.marches.filter(m => m.owner === 'roma'); G.tick(12 * 30); if (a.owner !== 'cartago') break; }
  if (a.owner === 'cartago') assert((a.units.libios || 0) > 10, 'Agrigentum púnica debe recibir refuerzos');
  const v = G.newGame('Vieja3'); v.cities.carthagonova.owner = 'cartago'; delete v.cities.carthagonova.w; delete v.evN;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v)); assert(G.load());
  assert.strictEqual(G.state.cities.carthagonova.w, 4); }

// ---- H3 Códice: toda unidad, ciudad y hecho tiene ficha válida ----
{ const CO = require('../js/codice.js'); const T = ['histórico', 'probable', 'licencia de juego'];
  const ids = l => new Set(l.map(f => f.id));
  const ut = ids(CO.tropas), ci = ids(CO.ciudades), he = ids(CO.hechos);
  Object.keys(D.UNITS).forEach(k => assert(ut.has(k), 'Códice: falta tropa ' + k));
  Object.keys(D.CITIES).forEach(k => assert(ci.has(k), 'Códice: falta ciudad ' + k));
  D.EVENTS.forEach(e => assert(he.has(String(e.y)), 'Códice: falta hecho ' + e.y));
  [].concat(CO.tropas, CO.ciudades, CO.hechos).forEach(f => {
    assert(T.includes(f.tag), 'Códice: etiqueta no válida en ' + f.id);
    assert(f.src && f.src.trim(), 'Códice: sin fuente en ' + f.id);
    assert(f.t && f.x.length >= 40 && f.x.length <= 420, 'Códice: texto fuera de 40-420 en ' + f.id + ' (' + f.x.length + ')'); });
  Object.keys(D.UNITS).forEach(k => assert.strictEqual(CO.tropas.find(f => f.id === k).t, D.UNITS[k].n, 'Códice: nombre de ' + k));
  Object.keys(D.CITIES).forEach(k => assert.strictEqual(CO.ciudades.find(f => f.id === k).t, D.CITIES[k].n, 'Códice: nombre de ' + k));
  D.EVENTS.forEach(e => assert(CO.hechos.some(f => f.id === String(e.y) && f.t === e.t), 'Códice: título de ' + e.y)); }

// ---- I4 Tipos de ciudad (los solares ya no se ofrecen en pantalla) ----
{ const tasa = tipo => { const s = G.newGame('Tipos'); s.res.oro = 1000; const c = s.cities.roma; if (tipo) c.tipo = tipo; return { s, c, p: G.prod() }; };
  const base = tasa('municipio'), ag = tasa('agraria');
  ['madera', 'piedra', 'hierro'].forEach(r => assert(Math.abs(ag.p[r] / base.p[r] - 1.25) < 0.02 || ag.p[r] > base.p[r] * 1.1, 'agraria sube ' + r));
  assert(ag.p.grano > base.p.grano, 'agraria sube el grano');
  // municipio da +5 de felicidad; el resto, no
  assert.strictEqual(G.felicidad(base.c) - G.felicidad(ag.c), 5, 'municipio +5 de felicidad');
  // militar: instrucción 25 % más rápida y paga 25 % menor
  const tr = tipo => { const s = G.newGame('M'); s.cities.roma.tipo = tipo; s.res.oro = 1e5; G.train('roma', 'hastati', 20); const q = s.cities.roma.train[0]; return q.t1 - q.t0; };
  assert(Math.abs(tr('militar') / tr('municipio') - 0.8) < 1e-9, 'militar entrena un 25 % más rápido');
  { const mi = tasa('militar'); let up = 0; for (const k in mi.c.units) up += mi.c.units[k] * D.UNITS[k].up; assert(Math.abs(base.p.mant.tropas - mi.p.mant.tropas - 0.25 * up * D.MANT_TROPA) < 1e-9, 'militar paga un 25 % menos'); }
  // emporio: más oro de foro y puerto, y cambio mejor con mercado
  const em = tasa('emporio'); assert(em.p.oro > base.p.oro, 'emporio gana más oro');
  const tr0 = G.tradeRate(); assert(tr0 > 0, 'hay mercado en alguna parte'); em.c.b.mercado = 0; const sinM = G.tradeRate(); em.c.b.mercado = 1; assert(Math.abs(G.tradeRate() - sinM) >= 0 && G.tradeRate() >= sinM, 'emporio con mercado no empeora el cambio');
  { const s = G.newGame('E'); for (const id of G.myCities()) s.cities[id].b.mercado = 1; const r0 = G.tradeRate(); s.cities.roma.tipo = 'emporio'; assert(Math.abs(G.tradeRate() - r0 - 0.05) < 1e-9, 'emporio +0,05 al cambio'); s.cities.roma.b.mercado = 0; assert.strictEqual(G.tradeRate(), r0, 'sin mercado en el emporio no mejora'); }
  // naval: oro por puerto y viajes por mar más rápidos; solo con mar
  { const s = G.newGame('N'); const c = s.cities.roma; c.b.puerto = 2; const t0 = G.travel('roma', 'carales'), o0 = G.prod().oro; c.tipo = 'naval';
    assert(Math.abs(G.travel('roma', 'carales') / t0 - 0.75) < 1e-9, 'naval viaja un 25 % más rápido por mar'); assert(Math.abs(G.prod().oro - o0 - 6) < 1e-9, 'naval +3 de oro por nivel de puerto');
    assert(Math.abs(G.travel('roma', 'volsinii') - G.travel('roma', 'volsinii')) < 1e-9);
    s.cities.capua.tipo = 'municipio'; assert(!G.setTipo('capua', 'naval') && s.cities.capua.tipo === 'municipio', 'naval sin mar se rechaza'); assert(G.tipoOk('roma', 'naval') === !!D.CITIES.roma.sea); }
  // saber: herrería más barata y rápida
  { const s = G.newGame('S'); const c = s.cities.roma; c.b.herreria = 3; s.res = { madera: 1e5, piedra: 1e5, hierro: 1e5, grano: 1e5, oro: 1e5 }; const c0 = G.forjaCost('armas', 0, 'roma'), t0 = G.forjaTime('armas', 0, 'roma'); c.tipo = 'saber';
    for (const r in c0) assert(G.forjaCost('armas', 0, 'roma')[r] <= Math.round(c0[r] * 0.75 / 5) * 5 + 5 && G.forjaCost('armas', 0, 'roma')[r] < c0[r], 'saber abarata la forja');
    assert(Math.abs(G.forjaTime('armas', 0, 'roma') / t0 - 0.75) < 1e-9); assert(G.forjaUp('roma', 'armas') && Math.abs((s.forja.cola.t1 - s.forja.cola.t0) / t0 - 0.75) < 1e-9, 'saber acorta la forja'); }
  // elegir: la primera vez gratis, después cobra
  { const s = G.newGame('Elegir'); s.res.oro = 300; assert.strictEqual(s.cities.roma.tipo, 'municipio'); assert(!G.setTipo('roma', 'inexistente'));
    assert(G.setTipo('roma', 'militar') && s.res.oro === 300 && s.cities.roma.tipoElegido, 'primera elección gratis');
    assert(G.setTipo('roma', 'agraria') && s.res.oro === 300 - D.TIPO_CAMBIO, 'la segunda cuesta ' + D.TIPO_CAMBIO);
    s.res.oro = 100; assert(!G.setTipo('roma', 'emporio') && s.cities.roma.tipo === 'agraria', 'sin oro no se cambia');
    assert(!G.setTipo(Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma'), 'militar'), 'solo ciudades propias');
    assert(G.tipoSugerido('capua') === 'agraria' && G.tipoSugerido('tarentum') === 'naval'); for (const id in D.CITIES) if (D.CITIES[id].tipo) assert(G.tipoOk(id, D.CITIES[id].tipo), 'sugerencia válida en ' + id); }
  // migración de una partida sin tipo
  { const s = G.newGame('Vieja4'); for (const id in s.cities) { delete s.cities[id].tipo; delete s.cities[id].tipoElegido; } s.cities.roma.tipo = 'basura'; delete s.evN;
    localStorage.setItem('aqvila-save-v1', JSON.stringify(s)); assert(G.load()); const r = G.state.cities.roma; assert(r.tipo === 'municipio' && r.tipoElegido === false && G.state.cities.capua.tipo === 'municipio', 'la partida vieja carga con municipio');
    assert(G.setTipo('roma', 'militar') && G.state.res.oro === s.res.oro, 'y su primera elección es gratis'); } }
// ---- F5 Templos a un dios ----
{ const s = G.newGame('Templos'), c = s.cities.roma; s.res = { madera: 1e5, piedra: 1e5, hierro: 1e5, grano: 1e5, oro: 1e5 };
  assert(D.BUILD.templo.solar === 1, 'el templo ocupa solar'); assert(!G.diosDe(c), 'sin templo no hay dios');
  assert(!G.elegirDios('roma', 'zeus') && !G.elegirDios('roma', 'neptuno') === false, 'Roma tiene mar: Neptuno vale'); assert(G.elegirDios('roma', 'ceres') && c.dios === 'ceres');
  const g0 = G.prod().grano; c.b.templo = 0; c.b.templo = 2; assert(G.prod().grano > g0 + 0.5, 'Ceres sube el grano'); const f2 = G.felicidad(c); c.b.templo = 0; assert(f2 - G.felicidad(c) === 2 * D.FELICIDAD_EDIF.templo, 'templo +' + D.FELICIDAD_EDIF.templo + ' de felicidad por nivel');
  c.b.templo = 1; assert(!G.elegirDios('roma', 'marte'), 'con templo levantado no se cambia de dios');
  assert(!G.elegirDios('carthago', 'marte'), 'una ciudad ajena no elige dios'); }
{ const s = G.newGame('Rebeldes'); const o = Object.keys(s.cities).find(i => s.cities[i].owner === 'cartago' && !D.CITIES[i].sea) || Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma');
  const c = s.cities[o]; c.owner = 'roma'; c.prev = 'cartago'; c.inq = D.INQ_MESES; c.units = { hastati: 10 }; c.pop = G.popCap(c);
  const cc = G.felicidad(c); assert(cc >= D.INQ_REBELION, 'felicidad normal no rebela'); G.tick(0.5); assert(c.owner === 'roma' && c.inq < D.INQ_MESES, 'la inquietud baja con el tiempo');
  const i1 = c.inq; c.b.templo = 3; c.dios = 'marte'; G.tick(0.5); assert(G.inqMul(c) < 1 && G.inqMul(c) >= 1 - D.INQ_PROD);
  c.imp = 'alto'; c.b.templo = 0; assert(G.felicidad(c) < D.INQ_REBELION); c.inq = D.INQ_MESES; G.tick(0.25); assert(c.owner !== 'roma' && c.inq === 0, 'con felicidad baja la ciudad conquistada se rebela'); }
{ const s = G.newGame('Vieja5'); s.cities.roma.b.templo = 2; delete s.cities.roma.dios; delete s.cities.roma.inq; delete s.evN; localStorage.setItem('aqvila-save-v1', JSON.stringify(s)); assert(G.load()); assert(G.state.cities.roma.dios === 'marte' && G.state.cities.roma.inq === 0, 'migración del templo antiguo'); }
// ---- B7 Saqueo ----
{ const s = G.newGame('Saqueo'); s.marches = []; const o = 'volsinii', c = s.cities[o]; s.res = { madera: 100, piedra: 100, hierro: 100, grano: 100, oro: 100 };
  const b1 = G.botin(o); assert(b1.madera > 0 && b1.oro < b1.madera, 'botín con oro al 60 %'); c.b.muralla = 3; assert(G.botin(o).madera < b1.madera, 'la muralla recorta el botín'); c.b.muralla = 0; c.b.almacen += 2; assert(G.botin(o).madera > b1.madera, 'el almacén ajeno lo sube');
  s.cities.roma.units = { hastati: 60 }; assert(G.send('roma', o, { hastati: 40 }, false, 'saqueo')); assert(s.marches[0].mision === 'saqueo'); const r = G.send('roma', 'capua', { hastati: 5 }, false, 'saqueo'); assert(r && !s.marches[1].mision, 'no se saquea una ciudad propia');
  s.pending.push({ kind: 'attack', m: s.marches.shift() }); const res = { winner: 0, dead: [5, 20], surv: [{ hastati: 35 }, {}], lost: [{ hastati: 5 }, { hastati: 20 }], genDead: [false, false] };
  const prev = c.owner, antes = s.res.madera, bo = G.botin(o), out = G.applyBattle(res);
  assert(c.owner === prev && out.saqueo && s.res.madera === antes + bo.madera, 'el saqueo da botín y no conquista'); assert(s.cities.roma.units.hastati >= 15 + 35, 'las tropas vuelven a casa'); assert(G.botin(o).madera < bo.madera, 'una ciudad recién saqueada da menos'); }
{ const s = G.newGame('Robo'); s.res = { madera: 1000, piedra: 1000, hierro: 1000, grano: 1000, oro: 1000 }; for (const r of D.RES) { s.alm[r] = 0; s.cuarto[r] = 0; } const c = s.cities.roma; c.b.almacen = 0; c.units = { hastati: 10 };
  const m = { id: 99, owner: 'cartago', from: 'carthago', to: 'roma', units: { libios: 50 }, mision: 'saqueo', t0: 0, t1: 1 }; s.pending.push({ kind: 'defense', m });
  G.applyBattle({ winner: 1, dead: [10, 0], surv: [{}, { libios: 50 }], lost: [{ hastati: 10 }, {}], genDead: [false, false] });
  assert(c.owner === 'roma' && !s.over && s.res.madera === 800, 'te saquean el 20 % y Roma no cae');
  s.res.madera = 1000; c.b.almacen = 8; s.pending.push({ kind: 'defense', m }); G.applyBattle({ winner: 1, dead: [0, 0], surv: [{}, { libios: 50 }], lost: [{}, {}], genDead: [false, false] }); assert(s.res.madera === 1000 - Math.round(Math.min(200, 1000 - 960)), 'el almacén esconde recursos'); }
// I2. Mapa por turnos: una estación = 3 meses; las marchas llegan al cambio de estación
{ const s = G.newGame('Turnos'); G.turnos = true;
  assert.strictEqual(G.finTurno(), 3, 'el primer turno acaba en el mes 3');
  assert.strictEqual(G.estacion(0), 'Invierno'); assert.strictEqual(G.estacion(3), 'Primavera'); assert.strictEqual(G.estacion(11), 'Otoño');
  // G.tick no pasa del final del turno
  G.tick(10); assert(Math.abs(s.t - 3) < 1e-9, 'tick recortado al final del turno: ' + s.t); G.tick(1); assert(Math.abs(s.t - 4) < 1e-9);
  assert(Math.abs(G.finTurno() - 6) < 1e-9);
  // una marcha lanzada no llega antes del cambio de estación
  const from = G.myCities().find(id => G.neighbors(id).some(n => s.cities[n].owner !== 'roma'));
  const to = G.neighbors(from).find(n => s.cities[n].owner !== 'roma');
  s.cities[from].units = { hastati: 50 };
  assert(G.send(from, to, { hastati: 50 }), 'la marcha sale');
  const m = s.marches[s.marches.length - 1];
  assert(Math.abs(m.t1 / 3 - Math.round(m.t1 / 3)) < 1e-9 && m.t1 >= 6, 'llega en un múltiplo de 3: ' + m.t1);
  assert(G.turnosFaltan(m) >= 1);
  const antes = s.pending.length; G.tick(1.5); assert(s.pending.length === antes && s.marches.includes(m), 'no llega a mitad de estación');
  while (s.t < m.t1 - 1e-9 && !s.pending.length) { if (!G.pasarTurno()) break; }
  assert(s.pending.length && s.pending[0].kind === 'attack', 'llega al cambiar de estación');
  // pasarTurno se detiene ante una batalla pendiente
  const t0 = s.t; assert.strictEqual(G.pasarTurno(), false); assert.strictEqual(s.t, t0, 'con batalla pendiente no avanza');
  G.turnos = false; }
{ const s = G.newGame('PasarTurno'); G.turnos = false; s.t = 6;
  assert.strictEqual(G.pasarTurno(), true); assert(Math.abs(s.t - 9) < 1e-6, 'pasarTurno avanza 3 meses exactos: ' + s.t);
  s.t = 7.2; G.pasarTurno(); assert(Math.abs(s.t - 9) < 1e-6, 'desde mitad de estación llega al final: ' + s.t); }
// I2. Consejo de estación y partidas antiguas
{ const s = G.newGame('Consejo'); G.turnos = true; s.t = 3;
  const antes = G.consejo(); assert(antes.length >= 2 && antes.length <= 5 && antes[0].x.includes('Primavera'), 'consejo corto con la estación');
  const to = G.myCities()[0];
  s.marches.push({ id: 900, owner: 'cartago', from: 'carthago', to, units: { libios: 80 }, t0: 0, t1: 6 });
  const c = G.consejo(); assert(c.length <= 5 && c.some(l => l.k === 'bad' && l.x.includes('Cartago')), 'avisa de la marcha inminente');
  G.turnos = false; }
{ const s = G.newGame('Antigua'); s.marches.push({ id: 901, owner: 'roma', from: 'roma', to: 'capua', units: { hastati: 5 }, hero: false, t0: 0, t1: 4.4 }); delete s.turnos;
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  G.save(); G.turnos = false; assert(G.load(), 'carga'); assert.strictEqual(G.turnos, true, 'la partida antigua pasa a turnos');
  const m = G.state.marches.find(x => x.id === 901); assert(Math.abs(m.t1 - 6) < 1e-9, 'la marcha se ajusta al siguiente múltiplo de 3: ' + m.t1);
  delete global.localStorage; G.turnos = false; }

/* Caja del mes y almacén (Q2) */
{ const s = G.newGame('Caja'), cap = G.cap(); G.turnos = false;
  assert(s.alm && s.cuarto && Array.isArray(s.informe), 'la partida nueva trae almacén, cuarto e informe');
  // cierre: guarda hasta el tope y pierde el resto
  s.res = { madera: 100, piedra: 5000, hierro: 0, grano: 50, oro: 10 }; s.alm = { madera: 0, piedra: cap - 300, hierro: 0, grano: 0, oro: 0 };
  G.cierreMes();
  assert.strictEqual(s.alm.madera, 100); assert.strictEqual(s.alm.piedra, cap, 'el almacén no pasa del tope');
  const inf = s.informe[s.informe.length - 1]; assert.strictEqual(inf.r.piedra.gua, 300); assert.strictEqual(inf.r.piedra.per, 4700, 'lo que no cabe se pierde');
  assert.strictEqual(s.res.piedra, 0, 'la caja queda a cero'); assert.strictEqual(s.cuarto.madera, 25, 'el cuarto se fija al cerrar');
  // el cuarto limita lo que se saca; gastar usa caja y luego cuarto
  s.res = { madera: 10, piedra: 0, hierro: 0, grano: 0, oro: 0 }; s.alm.madera = 1000; s.cuarto.madera = 250;
  assert.strictEqual(G.disponible('madera'), 260); assert(G.canAfford({ madera: 260 })); assert(!G.canAfford({ madera: 261 }), 'no se puede sacar más de un cuarto');
  assert(G.setTipo && G.maxTrain('hastati') >= 0);
  const r0 = G.rutaPuede; s.res.madera = 10; G.gasta('madera', 100);
  assert.strictEqual(s.res.madera, 0); assert.strictEqual(s.alm.madera, 910); assert.strictEqual(s.cuarto.madera, 160, 'primero la caja, luego el almacén y el cuarto');
  // déficit de grano: sale de la caja y, si no alcanza, del almacén (sin tocar el cuarto)
  const sd = G.newGame('Deficit'); sd.res.grano = 0; sd.alm.grano = 500; sd.cuarto.grano = 125; sd.cities.roma.pop = 50;
  const p = G.prod(); const antes = sd.alm.grano; sd.res.grano = 0; sd.res.grano += 0;
  for (const id in sd.cities) if (id !== 'roma') sd.cities[id].owner = 'cartago';
  sd.cities.roma.units = { hastati: 2000 }; const pd = G.prod(); assert(pd.grano < 0, 'hay déficit de grano con 2000 hombres');
  G.tick(0.1); assert(sd.alm.grano < antes && sd.res.grano === 0, 'el déficit sale del almacén'); assert.strictEqual(sd.cuarto.grano, 125, 'el déficit no gasta el cuarto');
  // el cierre ocurre solo al cruzar el mes y deja el informe
  const sm = G.newGame('Mes'); sm.res.madera = 50; for (let i = 0; i < 4; i++) G.tick(0.25);
  assert(sm.informe.length === 1 && sm.alm.madera > 0 && sm.res.madera < 400, 'al pasar el mes la caja se cierra sola');
}
{ // el informe de la estación suma tres meses
  const s = G.newGame('Informe'); G.turnos = true; s.speed = 0; let turno = 0; G.onEvent = t => { if (t === 'turno') turno++; };
  s.cities.roma.b.almacen = 0; for (let i = 0; i < 12; i++) G.tick(0.25);
  assert.strictEqual(s.informe.length, 3, 'tres cierres en la estación'); const inf = G.informeEstacion();
  assert.strictEqual(inf.r.madera.gua, s.informe.reduce((a, e) => a + e.r.madera.gua, 0)); assert(inf.r.oro.gan !== undefined);
  G.onEvent = null; G.turnos = false; }
{ // aviso de pérdida con el mes avanzado
  const s = G.newGame('Aviso'); G.turnos = false; s.t = 0.8; s.res.madera = 1e5; assert(G.avisoCierre().some(x => /Madera: sobran/.test(x) && /se perderán/.test(x)), 'avisa de lo que se perderá');
  s.t = 0.2; assert.strictEqual(G.avisoCierre().length, 0, 'sin aviso al principio del mes'); }
{ // migración de una partida vieja: nada se pierde
  const s = G.newGame('Vieja'); delete s.alm; delete s.cuarto; delete s.informe; delete s.gan; G.state = s; const cap = G.cap(); s.res = { madera: cap + 500, piedra: 100, hierro: 0, grano: 20, oro: 7 };
  G.migrarCaja(s); assert.strictEqual(s.alm.madera, cap); assert.strictEqual(s.res.madera, 500, 'lo que no cabe se queda en la caja'); assert.strictEqual(s.alm.piedra, 100);
  assert.strictEqual(s.cuarto.piedra, 25); assert.deepStrictEqual(s.informe, []); }
// ---- N2 Rondas, vista previa, condiciones y «ver otra vez» ----
{ const mkR = (seed, ex) => new Battle(Object.assign({ sides: [side({ hastati: 150, equites: 40 }), side({ libios: 150, numidas: 40 })], defender: 1, wall: 0, seed: seed || 8, rondas: true }, ex || {}));
  const huella = b => JSON.stringify(b.estado());
  // rondas: el plan está parado; ejecutar corre 20 s y vuelve al plan con la ronda siguiente
  let b = mkR(); assert.strictEqual(b.fase, 'plan'); assert.strictEqual(b.ronda, 1);
  const f0 = huella(b); for (let i = 0; i < 100; i++) b.step(0.05); assert.strictEqual(huella(b), f0, 'en el plan no pasa el tiempo');
  assert(b.ejecutar() && b.fase === 'ejecucion'); assert(!b.ejecutar(), 'no se ejecuta dos veces');
  let n = 0; while (b.fase === 'ejecucion' && n++ < 1000) b.step(0.05);
  assert.strictEqual(b.fase, 'plan'); assert.strictEqual(b.ronda, 2); assert(Math.abs(b.t - 20) < 0.1, 'la ronda dura unos 20 s de simulación'); assert(b.hechos.length >= 2 && b.hechos.length <= 3, 'informe de 2 o 3 hechos');
  b.ejecutar(); n = 0; while (b.fase === 'ejecucion' && n++ < 1000) b.step(0.05); assert.strictEqual(b.ronda, 3, 'las rondas alternan');
  // sin rondas todo sigue igual: finish() resuelve sola y da el mismo resultado que sin la opción
  { const a = new Battle({ sides: [side({ hastati: 150 }), side({ libios: 150 })], defender: 1, wall: 0, seed: 8 }), c = new Battle({ sides: [side({ hastati: 150 }), side({ libios: 150 })], defender: 1, wall: 0, seed: 8, rondas: true });
    a.finish(); c.finish(); assert.deepStrictEqual(c.result(), a.result(), 'finish() ignora las rondas'); assert(c.over); }
  // la batalla puede acabar a mitad de ronda y entonces no hay más plan
  { const c = new Battle({ sides: [side({ hastati: 300, equites: 40 }), side({ milicia: 30 })], defender: 1, wall: 0, seed: 3, rondas: true }); let g = 0; while (!c.over && g++ < 60) { c.ejecutar(); let k = 0; while (c.fase === 'ejecucion' && !c.over && k++ < 1000) c.step(0.05); } assert(c.over && c.winner === 0, 'la batalla termina por rondas'); }
  // vista previa: no toca la batalla real y mueve a los propios hacia donde se les ordena
  b = mkR(9); const reg = b.regs.find(r => r.side === 0 && r.k === 'hastati'); reg.order = { k: 'move', x: reg.x + 120, y: reg.y - 150 };
  const antes = huella(b), px = reg.x, py = reg.y, pr = b.prevision(); assert.strictEqual(huella(b), antes, 'la previsión no modifica la batalla'); assert.strictEqual(b.fase, 'plan');
  const sombra = pr.find(q => q.id === reg.id); assert(sombra && Math.hypot(sombra.x - px, sombra.y - py) > 20, 'la sombra se aleja del punto de partida'); assert(Math.abs(sombra.y - (py - 150)) < 120 && sombra.x > px, 'y va hacia el destino');
  const pc = b.preverChoque(); assert(pc.f0 >= 0 && pc.f0 <= 1 && pc.f1 >= 0 && pc.f1 <= 1 && huella(b) === antes, 'prever el choque tampoco toca la batalla');
  { const fuerte = new Battle({ sides: [side({ hastati: 300, principes: 200 }), side({ milicia: 60 })], defender: 1, wall: 0, seed: 2, rondas: true }).preverChoque(); assert(fuerte.gana === 0 && fuerte.claro, 'el choque desigual lo gana el fuerte'); }
  // «ver otra vez»: la repetición sale idéntica y vuelve al final guardado
  b = mkR(11); b.regs.filter(r => r.side === 0 && r.u.cls === 'cav').forEach(r => { r.order = { k: 'atk', r: b.regs.find(e => e.side === 1 && e.u.cls === 'inf') }; });
  b.ejecutar(); n = 0; while (b.fase === 'ejecucion' && n++ < 1000) b.step(0.05);
  const fin = huella(b), ronda = b.ronda; assert(b.repetir() && b.fase === 'ejecucion' && b.t < 1, 'repetir vuelve al inicio de la ronda');
  n = 0; while (b.fase === 'ejecucion' && n++ < 1000) b.step(0.05); assert.strictEqual(huella(b), fin, 'la repetición acaba idéntica'); assert.strictEqual(b.ronda, ronda); assert.strictEqual(b.fase, 'plan');
  // condiciones: «si huyen, no persigas», «si te cargan, aguanta» y «espera 10 s y avanza»
  { const mk2 = (o, ex) => new Battle(Object.assign({ sides: [side(o[0]), side(o[1])], defender: 1, wall: 0, seed: 5, rondas: true }, ex || {}));
    const c = mk2([{ hastati: 60 }, { libios: 60 }]), r = c.regs.find(q => q.side === 0), e = c.regs.find(q => q.side === 1);
    r.order = { k: 'atk', r: e }; assert(c.condicion(r, 'nopersigue') && r.order.cond === 'nopersigue'); assert(!c.condicion(e, 'aguanta'), 'solo se da condición a los propios'); assert(!c.condicion(r, 'basura'));
    e.st = 'rout'; c.ejecutar(); c.step(0.05); assert(r.order && r.order.k === 'quieto', 'el objetivo huye y no lo persigue');
    const g = mk2([{ equites: 20 }, { libios: 60 }]), gq = g.regs.find(x => x.side === 0), gw = g.regs.find(x => x.side === 1); gq.order = { k: 'move', x: gq.x, y: gq.y - 200 }; g.condicion(gq, 'aguanta'); gw.x = gq.x; gw.y = gq.y - 80; gw.corre = true; gw.charge = 2;
    g.ejecutar(); g.step(0.05); assert(gq.order && gq.order.k === 'quieto', 'si lo cargan, aguanta y deja de avanzar');
    const h = mk2([{ hastati: 60 }, { libios: 60 }]), hq = h.regs.find(x => x.side === 0), y0 = hq.y; hq.order = { k: 'move', x: hq.x, y: hq.y - 200 }; assert(h.condicion(hq, 'espera') && hq.order.cond === 'espera'); h.ejecutar(); for (let i = 0; i < 190; i++) h.step(0.05); assert(Math.abs(hq.y - y0) < 1, 'espera: no se mueve en los primeros 9,5 s'); for (let i = 0; i < 100; i++) h.step(0.05); assert(hq.y < y0 - 20, 'y después avanza'); }
}
/* Cuentas del mes (Q3) */
{ const s = G.newGame('Cuentas'); G.turnos = false;
  // colchón inicial
  for (const r of ['madera', 'piedra', 'hierro', 'grano']) { assert.strictEqual(s.alm[r], 200, 'colchón de almacén ' + r); assert.strictEqual(s.cuarto[r], 50, 'cuarto inicial ' + r); }
  assert.strictEqual(G.disponible('madera'), s.res.madera + 50, 'el primer mes ya hay cuarto que sacar');
  // las cuentas cuadran con G.prod
  const p = G.prod(), c = G.cuentas(), o = c.oro, m = G.mantenimiento();
  assert(Math.abs(o.impuestos + o.foro + o.rutas - o.edificios - o.legiones - p.oro) < 1e-9, 'ingresos menos mantenimiento = G.prod().oro');
  assert(Math.abs(o.saldo - (p.oro - 0)) < 1e-9, 'sin obras gastadas el saldo es el neto');
  for (const r of ['madera', 'piedra', 'hierro']) assert(Math.abs(c.mat[r].entra - p[r]) < 1e-9);
  assert(Math.abs(c.mat.grano.entra - c.mat.grano.comprometido - p.grano) < 1e-9, 'grano: entra menos comida = producción neta');
  // gastar apunta en gastoMes; vender no; el cierre lo pone a 0
  const g0 = s.gastoMes.madera; G.gasta('madera', 30); assert.strictEqual(s.gastoMes.madera, g0 + 30); assert.strictEqual(G.cuentas().mat.madera.comprometido, g0 + 30);
  G.gasta('oro', 12); assert.strictEqual(G.cuentas().oro.obras, 0, 'oro suelto no es de obras'); assert.strictEqual(G.cuentas().oro.otros, 12); assert(Math.abs(G.cuentas().oro.saldo - (p.oro - 12)) < 1e-9, 'las obras restan del saldo');
  // venta del sobrante
  s.res.madera = 1e4; s.alm.madera = G.cap() - 100; const per = G.previsionCierre().madera.perdera; assert(per > 0);
  s.cities.roma.b.mercado = 0; for (const id of G.myCities()) s.cities[id].b.mercado = 0; assert.strictEqual(G.venderSobrante('madera'), 0, 'sin mercado no se vende');
  s.cities.roma.b.mercado = 2; const gm = s.gastoMes.madera, oro0 = s.res.oro, got = G.venderSobrante('madera');
  assert(got > 0 && s.res.oro === oro0 + got, 'se cobra en oro'); assert(G.previsionCierre().madera.perdera < per, 'se pierde menos'); assert.strictEqual(s.gastoMes.madera, gm, 'vender no es gastar');
  assert.strictEqual(G.venderSobrante('oro'), 0);
  G.cierreMes(); assert.strictEqual(s.gastoMes.madera, 0, 'el cierre pone el gasto a cero'); }
{ // migración: partida sin gastoMes
  const s = G.newGame('Mig'); delete s.gastoMes; G.state = s; G.migrarCaja(s); assert.strictEqual(s.gastoMes.madera, 0); assert.strictEqual(s.gastoMes.oro, 0); G.cuentas(); }
{ // consejo en turnos avisa de la pérdida del mes entero
  const s = G.newGame('Consejo'); G.turnos = true; s.t = 3; s.res.madera = 0; s.alm.madera = G.cap() - 10; s.cities.roma.b.almacen = 0;
  assert(G.consejo().concat(G.avisoCierre(true).map(x => ({ x }))).some(q => /Madera: sobran/.test(q.x)), 'avisa con el mes completo'); G.turnos = false; }
{ // Q3 arreglos: gasto solo de caja, venta limitada por el hueco de oro y venta parcial
  const s = G.newGame('Q3b'); G.turnos = false; for (const id of G.myCities()) s.cities[id].b.mercado = 3;
  s.res.madera = 10; s.alm.madera = 1000; s.cuarto.madera = 250; G.gasta('madera', 100); assert.strictEqual(s.gastoMes.madera, 10, 'el cuarto del almacén no cuenta como gasto del mes');
  s.res.madera = 1e4; s.alm.madera = G.cap() - 100; s.res.oro = G.cap(); s.alm.oro = 0; assert.strictEqual(G.venderSobrante('madera'), 0); assert.strictEqual(G.ultimaVenta.motivo, 'orolleno', 'oro lleno: causa real');
  s.res.oro = G.cap() - 40; const got = G.venderSobrante('madera'); assert(got > 0 && got <= 40 && s.res.oro <= G.cap(), 'el cobro no crea pérdida de oro'); assert.strictEqual(G.ultimaVenta.motivo, 'parcial', 'venta parcial con aviso');
  s.res.oro = 0; s.res.madera = 5; s.alm.madera = G.cap() - 100; s.t = 0.1; const sp = G.prod().madera; // la pérdida depende de producción futura
  const g2 = G.venderSobrante('madera'); assert(G.ultimaVenta.vendido <= 5, 'solo vende lo que hay en caja'); if (G.previsionCierre().madera.perdera >= 1) assert.strictEqual(G.ultimaVenta.motivo, 'parcial'); }
/* Obras y reclutas a plazos (Q4) */
{ const s = G.newGame('Plazos'); G.turnos = false; const c = s.cities.roma;
  for (const r of ['madera', 'piedra', 'hierro', 'grano', 'oro']) { s.res[r] = 5000; s.alm[r] = 5000; s.cuarto[r] = 1250; }
  s.t = 10.2; let b = null;
  for (const k of Object.keys(D.BUILD)) { if (D.BUILD[k].sea || D.BUILD[k].solar || (c.b[k] || 0) < 1) continue; for (let L = 0; L < 5; L++) { c.b[k] = L; if (G.buildTime(c, k) >= 2.5 && G.buildTime(c, k) <= 3 && !G.faltaEspecial('edificio', k, L)) { b = k; break; } } if (b) break; }
  assert(b, 'hay una obra de 3 meses'); const L0 = c.b[b], cost = G.cost(b, L0), dur = G.buildTime(c, b), n = Math.ceil(dur - 1e-9);
  const m0 = s.res.madera + s.alm.madera; assert(G.upgrade('roma', b));
  const q = c.queue; assert.strictEqual(q.nc, n); assert.strictEqual(q.pag, 1, 'se paga la primera cuota al empezar');
  const rest = G.cuotasRestantes(q), c1 = G.cuotaSig(q); for (const r in cost) assert.strictEqual(rest[r] + Math.floor(cost[r] / n), cost[r], 'cuotas suman el coste exacto ' + r);
  if (cost.madera) assert(Math.abs((m0 - (s.res.madera + s.alm.madera)) - Math.floor(cost.madera / n)) < 1e-9, 'solo salió una cuota');
  // comprometido refleja el plazo que vence al cerrar este mes
  const pl = G.plazos(), cu = G.cuentas(); for (const r of ['madera', 'piedra', 'hierro']) if (cost[r]) { assert.strictEqual(pl[r], c1[r]); assert.strictEqual(cu.mat[r].plazos, c1[r]); assert.strictEqual(cu.mat[r].comprometido, s.gastoMes[r] + c1[r]); }
  // la previsión descuenta el plazo y el cierre cuadra
  s.t = 11 - 1e-6; const sob = G.previsionCierre(); const ant = {}; for (const r of ['madera', 'piedra', 'hierro']) ant[r] = s.alm[r];
  G.tick(2e-6); for (const r of ['madera', 'piedra', 'hierro']) { const reg = s.informe[s.informe.length - 1].r[r]; assert(Math.abs(reg.sob - sob[r].sobra) <= 1.5, 'previsión y cierre cuadran ' + r + ' ' + reg.sob + ' vs ' + sob[r].sobra); }
  assert.strictEqual(q.pag, 2, 'el cierre de mes paga la segunda cuota'); assert.strictEqual(s.obrasMes, 0, 'obrasMes se pone a 0 en el cierre');
  // fila Obras: solo oro de obras
  s.res.oro = 100; const o1 = G.cuentas().oro; G.gasta('oro', 7); assert.strictEqual(G.cuentas().oro.otros, o1.otros + 7); assert.strictEqual(G.cuentas().oro.obras, o1.obras);
  // adelantar paga el resto de golpe
  if (q.pag < q.nc) { assert(G.adelantarObra('roma')); assert.strictEqual(q.pag, q.nc); assert.strictEqual(G.plazos().madera, 0); }
  // pausa y reanudación
  c.queue = null; c.b[b] = L0; G.upgrade('roma', b); const q2 = c.queue; for (const r of D.RES) { s.res[r] = 0; s.alm[r] = 0; s.cuarto[r] = 0; }
  s.t = Math.floor(s.t) + 0.9999; const t1a = q2.t1; G.tick(0.0002 + 0.001);
  assert(q2.pausa, 'sin fondos la obra se pausa'); assert(q2.pag === 1); const t1b = q2.t1; G.tick(0.25); assert(Math.abs(q2.t1 - t1b - 0.25) < 1e-9, 'en pausa el plazo corre');
  for (const r of D.RES) { s.res[r] = 5000; } G.tick(0.01); assert(!q2.pausa && q2.pag === 2, 'con fondos se reanuda y paga');
  // sin fondos: la previsión no resta un plazo que el cierre no cobrará (la obra se pausa)
  { c.queue = null; c.b[b] = L0; for (const r of D.RES) { s.res[r] = 5000; s.alm[r] = 5000; s.cuarto[r] = 1250; } s.t = Math.floor(s.t) + 0.1; G.upgrade('roma', b); const q3 = c.queue;
    for (const r of D.RES) { s.res[r] = 0; s.alm[r] = 0; s.cuarto[r] = 0; } s.res.madera = 1; s.t = Math.floor(s.t) + 1 - 1e-6;
    const sob3 = G.previsionCierre(); G.tick(2e-6); assert(q3.pausa, 'pausada por falta de fondos');
    for (const r of ['madera', 'piedra', 'hierro']) { const reg = s.informe[s.informe.length - 1].r[r]; assert(Math.abs(reg.sob - sob3[r].sobra) <= 1.5, 'previsión sin fondos cuadra ' + r + ' ' + reg.sob + ' vs ' + sob3[r].sobra); }
    c.queue = null; }
  // el tope de reclutas por ciudad usa la primera cuota
  { for (const r of D.RES) { s.res[r] = 3000; s.alm[r] = 0; s.cuarto[r] = 0; } c.pop = 5000; assert(G.maxTrain('hastati', 'roma') >= G.maxTrain('hastati'), 'tope por cuotas no menor que por total'); }
  // reclutas por lote
  c.queue = null; s.t = Math.floor(s.t) + 0.1; c.train = []; c.pop = 5000; const antes = s.res.oro + s.alm.oro; assert(G.train('roma', 'hastati', 200));
  const l = c.train[0]; assert(l.nc >= 1 && l.pag === 1 && l.n === 200, 'lote con cuotas'); if (l.nc > 1) { assert(G.plazos().madera + G.plazos().hierro + G.plazos().oro + G.plazos().grano > 0, 'el lote cuenta como plazo'); }
  // partida vieja
  const v = G.newGame('Vieja'); v.cities.roma.queue = { b: 'granja', t0: 0, t1: 1 }; v.cities.roma.train = [{ u: 'hastati', n: 5, t0: 0, t1: 1 }]; delete v.obrasMes; G.migrarCaja(v);
  assert.strictEqual(v.cities.roma.obras.length, 1, 'queue única migra a una obra'); assert.strictEqual(v.cities.roma.obras[0].b, 'granja'); assert.strictEqual(v.cities.roma.queue.nc, 1); assert.strictEqual(v.cities.roma.queue.pag, 1); assert.strictEqual(v.cities.roma.train[0].pag, 1); assert.strictEqual(v.obrasMes, 0); G.state = v; G.plazos(); G.cuentas();
}
// Barrios (P67, CN6): camino sin ciudad nueva (servicios de la ciudad: grano, agua, templo, mercado, lujo)
{ G.usarCiudad(null); const s = G.newGame('Barrio'), c = s.cities.roma; G.state = s;   // sin ciudad nueva el agua se da por cubierta (CN10 retiró el acueducto)
  const cierra = () => { s.t = Math.floor(s.t) + 1; G.cierreMes(); };
  assert.strictEqual(c.barrio, 1); assert.strictEqual(c.bdef, 0); assert.strictEqual(G.barrioInfo(c).nivel, 1); assert.deepStrictEqual(G.barrioInfo(c).barrios, [], 'sin ciudad nueva no hay lista de barrios');
  assert.deepStrictEqual(Object.keys(D.BARRIO_SERV), ['grano', 'agua', 'templo', 'mercado', 'lujo'], 'ocio y termas se sustituyen por mercado');
  assert.deepStrictEqual(D.BARRIO[2].pide, ['grano', 'agua']); assert.deepStrictEqual(D.BARRIO[3].pide, ['grano', 'agua', 'templo']); assert.deepStrictEqual(D.BARRIO[4].pide, ['grano', 'agua', 'templo', 'mercado', 'lujo']);
  s.cities.capua && assert.strictEqual(s.cities.capua.barrio, 1, 'ciudad incorporada empieza en 1');
  const pr = () => G.prod().oro;
  const cap1 = G.popCap(c); assert(G.prod().grano >= 0, 'grano neto >= 0'); assert.deepStrictEqual(G.barrioInfo(c).falta, []); assert.strictEqual(G.barrioInfo(c).objetivo, 2);
  cierra(); assert.strictEqual(c.barrio, 2, 'sube a Villa'); assert.strictEqual(G.popCap(c), Math.round(cap1 * 1.25), 'popCap x1,25');
  assert.deepStrictEqual(G.barrioInfo(c).falta, ['templo']);
  c.b.templo = 1; assert.strictEqual(G.barrioInfo(c).objetivo, 3); cierra(); assert.strictEqual(c.barrio, 3);
  assert.deepStrictEqual(G.barrioInfo(c).falta.sort(), ['lujo', 'mercado']); c.b.mercado = 1; assert.deepStrictEqual(G.barrioInfo(c).falta, ['lujo']);
  assert.strictEqual(G.barrioInfo(c).objetivo, 3, 'Urbs pide lujo');
  // impuestos: factor del nivel (Urbs x1,15) y población (Urbs x1,8)
  c.barrio = 3; const o3 = pr(), p3 = G.popCap(c); c.barrio = 4; const o4 = pr(); assert(o4 > o3, 'impuestos suben en Urbs'); assert.strictEqual(D.BARRIO[4].imp, 1.15); assert(Math.abs(G.popCap(c) - p3 / 1.5 * 1.8) <= 1, 'popCap x1,8 en Urbs'); c.barrio = 3;
  // bajar: tarda BARRIO_RETRASO meses; recuperar reinicia
  c.b.templo = 0; assert.strictEqual(G.barrioInfo(c).objetivo, 2); assert.strictEqual(G.barrioInfo(c).meses, D.BARRIO_RETRASO);
  cierra(); cierra(); assert.strictEqual(c.barrio, 3); assert.strictEqual(c.bdef, 2); c.b.templo = 1; cierra(); assert.strictEqual(c.bdef, 0); assert.strictEqual(c.barrio, 3, 'recuperar no baja');
  c.b.templo = 0; for (let i = 0; i < D.BARRIO_RETRASO; i++) cierra(); assert.strictEqual(c.barrio, 2, 'baja tras el retraso'); assert.strictEqual(c.bdef, 0);
  // migración de partida vieja
  const st = {}; global.localStorage = { getItem: () => JSON.stringify(st.s), setItem() {} };
  const v = JSON.parse(JSON.stringify(s)); for (const id in v.cities) { delete v.cities[id].barrio; delete v.cities[id].bdef; } v.cities.roma.b.templo = 0; v.cities.roma.b.mercado = 0;
  st.s = v; assert(G.load(), 'carga'); assert.strictEqual(G.state.cities.roma.barrio, 2, 'migra al objetivo'); assert.strictEqual(G.state.cities.roma.bdef, 0);
  for (const id in G.state.cities) assert(G.state.cities[id].barrio >= 1);
  delete global.localStorage; G.usarCiudad(require('../js/ciudad.js')); }


// N4. Estados, contagio con tope, reagrupar, agotado y determinismo
{
  const mkN = (ex) => new Battle(Object.assign({ sides: [side({ hastati: 120 }, { gen: { n: 'Cónsul' } }), side({ libios: 120 })], defender: 1, wall: 0, seed: 5, rondas: true, fw: 600 }, ex || {}));
  const pon = (r, x, y) => { r.x = x; r.y = y; };
  // estadoMoral: umbrales fijos y única fuente
  { const c = mkN(), r = c.regs[0]; r.mor = r.morMax; assert.strictEqual(Battle.estadoMoral(r), 0); r.mor = r.morMax * 0.4; assert.strictEqual(Battle.estadoMoral(r), 1); r.mor = r.morMax * 0.2; assert.strictEqual(Battle.estadoMoral(r), 2); r.st = 'rout'; assert.strictEqual(Battle.estadoMoral(r), 3); }
  // contagio con tope: un escalón, una vez por ronda, y nada si hay reserva detrás
  { const c = mkN(), A = c.regs.filter(r => r.side === 0 && r.k === 'hastati'); const [b, v1, v2] = A;
    pon(b, 300, 500); pon(v1, 300, 440); pon(v2, 360, 500); for (const r of A.slice(3)) pon(r, 20, 700);
    v1.mor = v1.morMax * 0.57; v2.mor = v2.morMax * 0.57;
    b.st = 'rout'; c.onBreak(b);
    assert.strictEqual(Battle.estadoMoral(v1), 1, 'el vecino baja un escalón (Firme a Vacilante)'); assert(v1.mor >= v1.morMax * 0.5, 'baja poco, no se hunde');
    const m1 = v1.mor, b2 = A[3]; pon(b2, 310, 450); b2.st = 'rout'; c.onBreak(b2);
    assert.strictEqual(v1.mor, m1, 'como mucho un contagio por regimiento y ronda'); assert(c.notas.some(n => /se contagia del miedo de/.test(n)), 'la crónica lo anota');
    const d = mkN(), B = d.regs.filter(r => r.side === 0 && r.k === 'hastati'), rb = B[0], rv = B[1], res = B[2];
    pon(rb, 300, 500); pon(rv, 300, 440); pon(res, 300, 500); res.ala = 'reserva'; for (const r of B.slice(3)) pon(r, 20, 700);
    rv.mor = rv.morMax * 0.57; rb.st = 'rout'; d.onBreak(rb); assert.strictEqual(Battle.estadoMoral(rv), 0, 'con reserva detrás no hay contagio'); }
  // reagrupar: general vivo y cerca vuelve Desordenado; lejos sigue huyendo
  for (const cerca of [true, false]) {
    const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), h = c.regs.find(r => r.k === 'hastati' && r.side === 0);
    c.ejecutar(); pon(g, 300, 600); pon(h, 300, cerca ? 520 : 300); h.st = 'rout'; c.finRonda();
    if (cerca) { assert.strictEqual(h.st, 'ok'); assert.strictEqual(Battle.estadoMoral(h), 2, 'vuelve Desordenado'); assert(c.hechos.some(x => /se reagrupa/.test(x)), 'sale en «Lo que pasó»'); }
    else assert.strictEqual(h.st, 'rout', 'lejos del general sigue huyendo');
  }
  { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), h = c.regs.find(r => r.k === 'hastati' && r.side === 0);
    c.ejecutar(); g.st = 'dead'; pon(h, 300, 520); h.st = 'rout'; c.finRonda(); assert.strictEqual(h.st, 'rout', 'sin general vivo no se reagrupa'); }
  // agotado no carga (la orden se degrada y se anota); parar descansa
  { const c = mkN(), e = c.regs.find(r => r.side === 1), q = c.regs.find(r => r.side === 0 && r.k === 'hastati');
    pon(q, 300, 600); pon(e, 300, 300); q.fat = 80; q.order = { k: 'atk', r: e, tipo: 'cargar' }; c.ejecutar(); c.step(0.1);
    assert.strictEqual(q.order.tipo, 'avanzar'); assert(c.notas.some(n => /no puede cargar/.test(n))); assert.strictEqual(q.charge, 0);
    const d = mkN(), p = d.regs.find(r => r.side === 0 && r.k === 'hastati'); pon(p, 300, 700); p.fat = 50; p.order = { k: 'quieto', tipo: 'aguantar' }; d.ejecutar(); for (let i = 0; i < 50; i++) d.step(0.1); assert(p.fat < 50, 'parar descansa solo sin pelear'); }
  // determinismo: misma semilla, mismo resultado y misma crónica
  { const run = () => { const c = mkN({ seed: 11 }); let g = 0; while (!c.over && g++ < 60) { c.ejecutar(); let k = 0; while (c.fase === 'ejecucion' && !c.over && k++ < 1000) c.step(0.05); } return JSON.stringify([c.t, c.men(0), c.men(1), c.hechos, c.regs.map(r => [r.st, r.men, Math.round(r.mor * 1000)])]); };
    assert.strictEqual(run(), run(), 'misma semilla = mismo resultado'); }
}
// Clases (Q6)
{ const s = G.newGame('Clases'), c = s.cities.roma; G.state = s; const K = D.CLASES;
  assert.strictEqual(c.esc, 0); assert.strictEqual(c.ciu, 0);
  // conquista: el 25 % pasa a esclavos
  { const id = Object.keys(D.CITIES).find(i => D.CITIES[i].f !== 'roma' && i !== 'roma'), q = s.cities[id]; G.incorporar(q, { hastati: 5 }, true);
    assert.strictEqual(q.owner, 'roma'); assert.strictEqual(q.esc, Math.round(q.pop * K.escConquista)); assert(q.esc > 0 && q.ciu === 0, 'la conquista crea esclavos');
    const t = s.cities.capua; G.incorporar(t, {}, false); assert.strictEqual(t.esc, 0, 'la aliada no'); }
  // dar ciudadanía: barrio, plebeyos, oro
  c.barrio = 1; c.pop = 300; assert(G.motivoCiudadania(c), 'barrio 1 no puede'); assert(!G.darCiudadania('roma'));
  c.barrio = 2; s.res.oro = 500; s.alm.oro = 0; const oro0 = G.disponible('oro'); assert.strictEqual(G.motivoCiudadania(c), null); assert(G.darCiudadania('roma'));
  assert.strictEqual(c.ciu, K.ciudadaniaLote); assert.strictEqual(oro0 - G.disponible('oro'), K.ciudadaniaCoste, 'cobra 60');
  s.res.oro = 0; s.alm.oro = 0; assert(!G.darCiudadania('roma'), 'sin oro no'); assert.strictEqual(G.motivoCiudadania(c), 'Faltan denarios');
  s.res.oro = 5000; c.ciu = 118; c.pop = 300; assert(!G.darCiudadania('roma'), 'tope 40 %');
  // ciudadanos pagan más
  c.ciu = 0; const o0 = G.prod().oro; c.ciu = 60; const o1 = G.prod().oro; assert(o1 > o0, 'ciudadanos pagan x2,5');
  // ánimo cae sin templo y sin grano; esclavos inquietos bajan la felicidad
  c.ciu = 0; c.esc = 0; c.b.templo = 1; const a1 = G.animoClases(c, true).ple; c.b.templo = 0; const a2 = G.animoClases(c, true).ple; assert(a2 < a1, 'sin templo cae el ánimo');
  assert(G.animoClases(c, false).esc < G.animoClases(c, true).esc, 'sin grano caen los esclavos');
  for (const k of ['ciu', 'ple', 'esc']) { const a = G.animoClases(c, true)[k]; assert(a >= 0 && a <= 100); }
  c.pop = 200; c.esc = 100; const sinEsc = G.manoObra(Object.assign({}, c, { esc: 0 })); assert(G.manoObra(c) >= sinEsc, 'esclavos trabajan más');
  // plebeyos nunca negativos: reclutar o perder población recorta
  c.ciu = 80; c.esc = 100; c.pop = 120; const cl = G.clases(c); assert(cl.ple >= 0 && cl.ciu + cl.esc <= 120, 'recorta'); c.pop = 0; const c0 = G.clases(c); assert(c0.ple >= 0 && c0.ciu >= 0 && c0.esc >= 0);
  // manumisión mensual
  c.pop = 300; c.ciu = 0; c.esc = 40; c.b.templo = 1; s.res.grano = 5000; s.alm.grano = 5000; c.imp = 'bajo';   // impuestos bajos: la felicidad no depende de piezas que el cierre del mes recalcula
  for (const b in D.FELICIDAD_EDIF) c.b[b] = 3; assert(G.animoClases(c, true).esc >= K.manumision, 'esclavos contentos'); const e0 = c.esc; s.t = Math.floor(s.t) + 1; G.cierreMes(); assert(c.esc < e0 && c.esc >= 0, 'manumisión');
  // migración
  const st = {}; global.localStorage = { getItem: () => JSON.stringify(st.s), setItem() {} };
  const v = JSON.parse(JSON.stringify(s)); for (const id in v.cities) { delete v.cities[id].ciu; delete v.cities[id].esc; } v.cities.roma.pop = 300; v.cities.roma.barrio = 3; v.cities.roma.owner = 'roma';
  st.s = v; assert(G.load()); for (const id in G.state.cities) { const q = G.state.cities[id]; assert.strictEqual(q.esc, 0); assert(q.ciu >= 0); } assert.strictEqual(G.state.cities.roma.ciu, 30);
  delete global.localStorage; }

// N5. General y mando: puntos, radio, retraso y cartas de táctica
{
  const mkN = (ex) => new Battle(Object.assign({ sides: [side({ hastati: 240 }, { gen: { n: 'Cónsul' } }), side({ libios: 120 })], defender: 1, wall: 0, seed: 5, rondas: true }, ex || {}));
  const pon = (r, x, y) => { r.x = x; r.y = y; };
  const propios = (c) => c.regs.filter(r => r.side === 0 && r.k !== 'general');
  const ordena = (rs, n) => rs.forEach((r, i) => { r.order = i < n ? { k: 'move', x: r.x, y: r.y - 100 } : null; });
  // puntos: 5 con general; «Aguantar» no gasta; ejecutar rechaza si te pasas
  { const c = mkN(), P = propios(c); assert(P.length >= 6, 'hay regimientos de sobra');
    ordena(P, 5); let m = c.mandoPuntos(); assert.deepStrictEqual([m.usados, m.max, m.libres], [5, 5, 0]);
    P[5].order = { k: 'quieto' }; assert.strictEqual(c.mandoPuntos().usados, 5, 'Aguantar no gasta');
    P[5].order = { k: 'move', x: P[5].x, y: P[5].y - 50 }; assert.strictEqual(c.ejecutar(), false); assert.strictEqual(c.motivo, 'Tienes 6 órdenes y solo 5 puntos de mando'); assert.strictEqual(c.fase, 'plan');
    P[5].order = null; assert.strictEqual(c.ejecutar(), true); }
  // sin rondas nada cambia
  { const c = mkN({ rondas: false }); ordena(propios(c), 9); assert.strictEqual(c.fase, 'lucha'); assert.strictEqual(c.ejecutar(), false); c.step(0.1); }
  // general muerto: 2 puntos y la crónica lo anota
  { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), P = propios(c);
    g.st = 'dead'; ordena(P, 3); assert.strictEqual(c.mandoPuntos().max, 2); assert.strictEqual(c.ejecutar(), false); assert(/solo 2 puntos/.test(c.motivo)); ordena(P, 2); assert.strictEqual(c.ejecutar(), true);
    const d = mkN(), g2 = d.regs.find(r => r.k === 'general' && r.side === 0), a = d.regs.find(r => r.side === 1); d.ejecutar(); g2.men = 1; d.hit(a, g2, 1e6, false); assert(d.genDown[0]); assert(d.notas.some(n => /Sin general: solo 2 órdenes por ronda/.test(n))); }
  // radio: fuera llega con 6 s de retraso; dentro, al momento; sin general no hay radio
  for (const modo of ['dentro', 'fuera', 'sin']) {
    const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), P = propios(c), r = P[0];
    pon(g, 300, 600); pon(r, modo === 'fuera' ? 300 : 300, modo === 'fuera' ? 300 : 500); if (modo === 'sin') { pon(r, 300, 300); g.st = 'dead'; }
    r.order = { k: 'move', x: 300, y: 250 }; c.ejecutar();
    if (modo === 'fuera') { assert.strictEqual(r.order.k, 'quieto'); assert(r.pend && r.pendT === 6); for (let i = 0; i < 55; i++) c.step(0.1); assert.strictEqual(r.order.k, 'quieto', 'aún no (5,5 s)'); for (let i = 0; i < 10; i++) c.step(0.1); assert.strictEqual(r.order.k, 'move', 'a los 6 s la orden llega'); assert.strictEqual(r.pend, null); }
    else { assert.strictEqual(r.order.k, 'move', 'obedece al momento'); assert(!r.pend); }
  }
  // «espera» y retraso a la vez: vale la mayor
  { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), r = propios(c)[0]; pon(g, 300, 600); pon(r, 300, 300); r.order = { k: 'move', x: 300, y: 250, cond: 'espera' }; c.ejecutar(); assert.strictEqual(r.pendT, 10); }
  // cartas: se gastan, una por ronda, solo en el plan y con general vivo
  { const c = mkN(); assert.strictEqual(c.cartas.length, 3);
    assert(c.jugarCarta('arenga')); assert(!c.jugarCarta('paso'), 'una por ronda'); assert(!c.jugarCarta('arenga'), 'ya gastada'); assert.strictEqual(c.cartas.length, 2);
    c.ejecutar(); assert(!c.jugarCarta('paso'), 'no en ejecución'); while (c.fase === 'ejecucion') c.step(0.2);
    assert(c.jugarCarta('paso'), 'otra ronda, otra carta'); assert(!c.jugarCarta('inventada'));
    const d = mkN(); d.regs.find(r => r.k === 'general' && r.side === 0).st = 'dead'; assert(!d.jugarCarta('arenga'), 'sin general no hay cartas'); }
  // efectos: arenga sube moral dentro del radio; paso doble acelera; cerrada reduce el daño; se limpia al acabar
  { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), P = propios(c), a = P[0], lejos = P[1];
    pon(g, 300, 600); pon(a, 300, 560); pon(lejos, 300, 200); a.mor = a.morMax * 0.5; lejos.mor = lejos.morMax * 0.5; const m0 = a.mor;
    assert(c.jugarCarta('arenga')); c.ejecutar(); assert(Math.abs(a.mor - (m0 + 0.15 * a.morMax)) < 1e-6 && lejos.mor === lejos.morMax * 0.5, 'solo dentro del radio');
    while (c.fase === 'ejecucion') c.step(0.2); assert.strictEqual(a.cartaFx, null, 'se limpia al acabar la ronda'); }
  { const dist = (carta) => { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), r = propios(c)[0]; pon(g, 300, 600); pon(r, 300, 580); r.order = { k: 'move', x: 300, y: 400 }; if (carta) c.jugarCarta(carta); c.ejecutar(); for (let i = 0; i < 3; i++) c.step(0.1); const y0 = r.y; for (let i = 0; i < 6; i++) c.step(0.1); return y0 - r.y; };
    const n = dist(null), p = dist('paso'); assert(p > n * 1.2 && p < n * 1.3, 'paso doble ~x1,25: ' + p / n); }
  { const daño = (carta) => { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), r = propios(c)[0], e = c.regs.find(q => q.side === 1); pon(g, 300, 600); pon(r, 300, 580); if (carta) c.jugarCarta(carta); c.ejecutar(); const m = r.men; c.hit(e, r, 200, false); return m - r.men; };
    const n = daño(null), k = daño('cerrada'); assert(k < n && Math.abs(k / n - 0.85) < 0.1, 'cerrada recibe ~x0,85: ' + k / n); }
  // «Ver otra vez» sigue siendo idéntico con carta y retraso
  { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), P = propios(c); pon(g, 300, 600); pon(P[0], 300, 560); pon(P[1], 300, 250);
    P[0].order = { k: 'move', x: 300, y: 450 }; P[1].order = { k: 'move', x: 300, y: 400 }; c.jugarCarta('paso'); c.ejecutar(); while (c.fase === 'ejecucion') c.step(0.2);
    const fin = JSON.stringify(c.snapFin.regs.map(r => [r.x, r.y, r.men, r.mor])); assert(c.repetir()); while (c.fase === 'ejecucion') c.step(0.2);
    assert.strictEqual(JSON.stringify(c.regs.map(r => [r.x, r.y, r.men, r.mor])), fin, 'la repetición es idéntica'); assert.strictEqual(c.cartas.length, 2, 'la repetición no devuelve ni gasta cartas'); }
}


// N14. Campos amplios y relieve nuevo
{
  const mk = (ter, ex) => new Battle(Object.assign({ sides: [side({ hastati: 200, velites: 80, equites: 60 }, { gen: { n: 'C' } }), side({ libios: 200, numidas: 60, honderos: 40, jinetes: 60 }, { gen: { n: 'S' } })], defender: 1, wall: 0, seed: 3, terreno: ter }, ex || {}));
  // ancho variable: por defecto 800 (R1); 1000 con más de 700 hombres; cfg.fw manda; mínimo 600
  assert.strictEqual(mk('llano').W, 800, 'ancho por defecto');
  assert.strictEqual(new Battle({ sides: [side({ hastati: 500 }), side({ libios: 400 })], defender: 1, wall: 0, seed: 1 }).W, 1000, 'ejército grande: campo de 1000');
  assert.strictEqual(mk('llano', { fw: 600 }).W, 600); assert.strictEqual(mk('llano', { fw: 300 }).W, 600, 'mínimo 600'); assert.strictEqual(mk('llano', { fw: 900 }).W, 900);
  for (const fw of [600, 1200, 1500]) for (const tpl of ['clasica', 'linea', 'ancha', 'tres', 'centro', 'alas']) {
    const b = mk('llano', { fw }); b.formar(0, tpl); b.formar(1, tpl);
    for (const r of b.regs) assert(r.x >= 20 && r.x <= b.W - 20, 'nadie fuera de 20..W-20 (' + tpl + ' fw ' + fw + ' x=' + r.x + ')');
  }
  // terrenos nuevos: ids, ciudades y simetría entre bandos
  for (const id of ['cerro', 'rio', 'pantano', 'paso']) assert(Battle.TERRENOS[id], 'existe el terreno ' + id);
  assert.strictEqual(Battle.terrenoDe('capua', 1), 'rio'); assert.strictEqual(Battle.terrenoDe('carales', 1), 'pantano'); assert.strictEqual(Battle.terrenoDe('ambracia', 1), 'paso'); assert.strictEqual(Battle.terrenoDe('messana', 1), 'cerro');
  for (const id of ['cerro', 'rio', 'pantano', 'paso']) for (const fw of [600, 1200, 1500]) {
    const b = mk(id, { fw }), cnt = [0, 0], z = [b.zona(0), b.zona(1)];
    for (const sd of [0, 1]) for (let y = z[sd].y0; y <= z[sd].y1; y += 20) for (let x = z[sd].x0; x <= z[sd].x1; x += 20) { const t = b.terrenoEn(x, y); cnt[sd] += (t.alt > 0 ? 1 : 0) + (t.bosque ? 1 : 0) + (t.pantano ? 3 : 0) + (t.bloq ? 7 : 0); }
    assert(Math.abs(cnt[0] - cnt[1]) <= 0.5 * Math.max(cnt[0], cnt[1], 1) + 4, id + ' fw ' + fw + ': terreno parecido en las dos zonas ' + cnt);
    const T = b.tr; for (const sd of [0, 1]) for (const r of b.regs.filter(q => q.side === sd)) assert(!b.terrenoEn(r.x, r.y).bloq, id + ': nadie empieza en el agua ni en la roca');
    if (T.banda) { assert(Math.abs(T.banda.y0 + T.banda.y1 - b.H) <= 40, id + ': franja centrada'); const cs = T.banda.cr.map(c => c.xc); assert(cs.every(x => cs.some(y => Math.abs((x + y) - b.W) <= 40)), id + ': pasos simétricos ' + cs + ' W=' + b.W); }
  }
  assert(mk('cerro').tr.alt.some(a => a > 1), 'el cerro es más alto que la colina');
  // el agua no se cruza salvo por los vados; cruzar un vado desordena; todo termina sin colgarse
  for (const id of ['rio', 'paso']) for (const sd of [1, 2, 3]) {
    const b = mk(id, { seed: sd, fw: sd === 3 ? 600 : 1200 }); let malos = 0, crucesVado = 0, t = 0;
    const B = b.tr.banda;
    while (!b.over && b.t < 1500) {
      b.step(0.2); t++;
      for (const r of b.regs) if (r.st === 'ok') { if (b.terrenoEn(r.x, r.y).bloq) malos++; if (b.terrenoEn(r.x, r.y).vado) crucesVado++; }
    }
    assert.strictEqual(malos, 0, id + ' seed ' + sd + ': nadie entra en el agua ni en la roca'); assert(b.over, id + ': la batalla termina (' + b.t.toFixed(0) + ' s)');
    if (id === 'rio') assert(crucesVado > 0, 'cruzan por los vados');
  }
  // un regimiento al otro lado del río llega a su destino por un vado; no se queda en la orilla
  { const b = mk('rio', { fw: 1200 }), r = b.regs.find(q => q.side === 0 && q.k === 'hastati'); r.x = 100; r.y = b.H - 200;
    let n = 0, rest = 1e9; while (rest >= 6 && n++ < 4000) { rest = b.moveTo(r, 130, 150, 0.2, 1); assert(!b.terrenoEn(r.x, r.y).bloq, 'nunca en el agua'); } assert(rest < 6 && r.y < 200 && Math.abs(r.x - 130) < 10, 'cruza el río por un vado hasta el destino (' + r.x.toFixed(0) + ',' + r.y.toFixed(0) + ')'); }
  // vado: baja la moral y frena
  { const b = mk('rio', { fw: 1200 }), c = b.tr.banda.cr[1], r = b.regs.find(q => q.side === 0 && q.k === 'hastati'); const m0 = r.mor; r.x = c.xc; r.y = b.tr.banda.y1 + 4; r.enVado = false;
    b.moveTo(r, c.xc, 100, 0.2, 1); assert(b.terrenoEn(r.x, r.y).vado && r.mor < m0, 'entrar en el vado quita moral'); r.enVado = true; r.mor = r.morMax; const y0 = r.y; b.moveTo(r, c.xc, 100, 1, 1); const dv = y0 - r.y;
    const l = b.regs.find(q => q.side === 0 && q.k === 'hastati' && q !== r); l.x = 100; l.y = b.H - 200; const y1 = l.y; b.moveTo(l, 100, 100, 1, 1); assert(dv < (y1 - l.y) * 0.8, 'el vado frena'); }
  // el pantano frena a todos y cansa
  { const b = mk('pantano', { fw: 1200 }), T = b.tr, i = T.ter.indexOf(3); assert(i >= 0, 'hay pantano'); const cx = (i % T.cols + 0.5) * 40, cy = (Math.floor(i / T.cols) + 0.5) * 40;
    const r = b.regs.find(q => q.side === 0 && q.k === 'hastati'), l = b.regs.find(q => q.side === 0 && q.k === 'velites');
    r.x = cx; r.y = cy; r.fat = 0; l.x = 20; l.y = 20; l.fat = 0; T.bos.fill(0); T.alt.fill(0); b.celdas = {};
    // mismo regimiento, mismo paso, dentro y fuera del pantano
    const mov = (x, y) => { r.x = x; r.y = y; r.fat = 0; b.moveTo(r, x, y - 500, 1, 1); return y - r.y; };
    const dentro = mov(cx, cy), fatD = r.fat; let fx = 20, fy = 880; while (b.terrenoEn(fx, fy).pantano || b.terrenoEn(fx, fy - 40).pantano) fy -= 40; const fuera = mov(fx, fy), fatF = r.fat;
    assert(dentro < fuera * 0.7, 'el pantano frena (' + dentro.toFixed(2) + ' vs ' + fuera.toFixed(2) + ')'); assert(fatD > fatF, 'y cansa'); }
}

// N6. Enemigo que piensa (modo por rondas): planes, gestos, mando, carácter, dificultad
{
  const mkI = (u1, ter, ex, s1) => new Battle(Object.assign({ sides: [side({ hastati: 150, equites: 30 }, { gen: { n: 'Cónsul' } }), side(u1, Object.assign({ gen: { n: 'Rival' } }, s1 || {}))], defender: 1, wall: 0, seed: 5, rondas: true, terreno: ter }, ex || {}));
  const jugar = (b, n) => { const gs = []; let g = 0, maxPts = 0; while (!b.over && g++ < n) { assert(b.ejecutar(), 'ejecuta'); gs.push(b.gesto); let k = 0; while (b.fase === 'ejecucion' && k++ < 400) { b.step(0.1); maxPts = Math.max(maxPts, b.regs.filter(r => r.side === 1 && r.st === 'ok' && ((r.order && r.order.k !== 'quieto') || r.pend)).length); } } return { gs, maxPts }; };
  const libios = { libios: 150, iberos: 60, numidas: 60 }, falange = { falange: 200, hoplitas: 60, elefantes: 6 }, ligeros = { numidas: 150, honderos: 80 };
  // plan según tropas y terreno
  assert.strictEqual(mkI(falange, 'llano').ia.plan, 'centro', 'falange: centro fuerte');
  assert.strictEqual(mkI(ligeros, 'llano').ia.plan, 'alas', 'jinetes ligeros en llano: alas');
  assert.strictEqual(mkI(libios, 'bosque').ia.plan, 'emboscar', 'bosque: emboscar');
  assert.strictEqual(mkI(libios, 'cerro', {}, { car: 'prudente' }).ia.plan, 'cerro', 'prudente con cerro: defender');
  assert(Battle.PLANES[mkI(libios, 'mixto').ia.plan], 'el plan es uno de los cinco');
  { const b = mkI(falange, 'llano'); assert.strictEqual(b.ia.dif, 'normal', 'dificultad por defecto'); }
  // gesto no vacío cada ronda, puntos de mando respetados, mismo resultado al repetir
  for (const [u, ter] of [[libios, 'llano'], [falange, 'cerro'], [ligeros, 'bosque'], [libios, 'mixto']]) {
    const b = mkI(u, ter), { gs, maxPts } = jugar(b, 7);
    assert(gs.length >= 3 && gs.every(x => x && x.length > 4 && x.length < 90), ter + ': gesto corto cada ronda: ' + gs.join(' | '));
    assert(maxPts <= 5, 'el enemigo no pasa de 5 puntos de mando (' + maxPts + ')');
  }
  { const b = mkI(libios, 'llano'); b.regs.find(r => r.side === 1 && r.k === 'general').st = 'dead'; b.genDown[1] = true; const { maxPts } = jugar(b, 5); assert(maxPts <= 2, 'sin general solo 2 puntos (' + maxPts + ')'); }
  // determinismo: dos batallas iguales, la repetición de ronda y un clon dan lo mismo
  { const a = mkI(libios, 'mixto'), c = mkI(libios, 'mixto'); const ja = jugar(a, 5), jc = jugar(c, 5);
    assert.deepStrictEqual(ja.gs, jc.gs, 'mismos gestos'); assert.strictEqual(a.men(0), c.men(0)); assert.strictEqual(a.men(1), c.men(1));
    const d = mkI(libios, 'mixto'); jugar(d, 2); const e = d.clona(); assert.deepStrictEqual(e.ia, d.ia, 'el clon lleva el estado de la IA'); assert.strictEqual(e.gesto, d.gesto);
    e.ejecutar(); d.ejecutar(); assert.strictEqual(e.gesto, d.gesto, 'el clon decide igual'); let k = 0; while ((e.fase === 'ejecucion' || d.fase === 'ejecucion') && k++ < 400) { e.step(0.1); d.step(0.1); }
    assert.strictEqual(e.men(0), d.men(0)); assert.strictEqual(e.men(1), d.men(1));
    // ver otra vez: la ronda se repite igual y no cambia el gesto ni el plan
    const gest = d.gesto, pl = d.ia.plan, m1 = d.men(1), m0 = d.men(0); assert(d.repetir()); k = 0; while (d.fase === 'ejecucion' && k++ < 400) d.step(0.1);
    assert.strictEqual(d.men(1), m1); assert.strictEqual(d.men(0), m0); assert.strictEqual(d.ia.plan, pl); assert.strictEqual(d.gesto, gest, 'ver otra vez conserva el gesto');
    // la previsión no mueve al enemigo ni cambia su plan
    const p = d.ia.gestos; d.prevision(); assert.strictEqual(d.ia.gestos, p, 'la previsión no hace pensar al enemigo'); }
  // sin trampas: no mira las órdenes del jugador (mismo resultado con órdenes distintas en el plan antes de la foto)
  { const a = mkI(libios, 'llano'), c = mkI(libios, 'llano'); c.regs.filter(r => r.side === 0 && r.k !== 'general').slice(0, 4).forEach(r => { r.order = { k: 'move', x: 100, y: 100 }; });
    a.ejecutar(); c.ejecutar(); assert.strictEqual(a.gesto, c.gesto, 'el gesto no depende de las órdenes recién dadas'); }
  // cruza un vado a propósito en terreno 'rio' (Normal y Difícil; Fácil no)
  { for (const dif of ['normal', 'dificil', 'facil']) { const b = mkI(falange, 'rio', { dificultad: dif }); let vados = 0, g = 0, vg = 0;
      while (!b.over && g++ < 6) { b.ejecutar(); if (/vado/.test(b.gesto)) vg++; let k = 0; while (b.fase === 'ejecucion' && k++ < 400) { b.step(0.1); for (const r of b.regs) if (r.side === 1 && r.st === 'ok' && b.terrenoEn(r.x, r.y).vado) vados++; } }
      if (dif === 'facil') assert.strictEqual(vg, 0, 'Fácil no cruza a propósito'); else assert(vg > 0 && vados > 0, dif + ': cruza el vado (' + vg + ' gestos, ' + vados + ')'); } }
  // caracteres con planes distintos sobre las mismas tropas y terreno
  { const ps = ['astuto', 'impetuoso', 'prudente', 'equilibrado'].map(c => mkI(libios, 'mixto', {}, { car: c }).ia.plan); assert(new Set(ps).size >= 3, 'los caracteres dan planes distintos: ' + ps.join()); }
  assert(Battle.CARACTER.astuto && Battle.CARACTER.impetuoso && Battle.CARACTER.prudente && Battle.CARACTER.equilibrado, 'tabla de caracteres');
  assert.strictEqual(Battle.caracterDe({ sides: [{}, { name: 'Cartago', gen: { n: 'Aníbal Barca' } }] }), 'astuto'); assert.strictEqual(Battle.caracterDe({ sides: [{}, { name: 'Galos ínsubres' }] }), 'impetuoso');
  assert.strictEqual(Battle.caracterDe({ sides: [{}, { name: 'Epiro', gen: { n: 'Pirro de Epiro' } }] }), 'prudente'); assert.strictEqual(Battle.caracterDe({ sides: [{}, { name: 'Íberos' }] }), 'equilibrado');
  { const b = mkI(libios, 'llano', {}, { car: 'impetuoso' }); const { gs } = jugar(b, 4); assert(gs.some(x => /carga|adelanta|flanco|aprieta/.test(x)), 'el impetuoso ataca: ' + gs.join(' | ')); }
  { const b = mkI(libios, 'llano', {}, { car: 'astuto', name: 'Cartago' }); b.ia.plan = 'centro'; b.regs.forEach(r => { if (r.side === 1 && r.k !== 'general') { r.men = Math.floor(r.men * 0.6); r.hp *= 0.6; } }); b.start[1] = b.men(1) / 0.6;
    b.ejecutar(); let k = 0; while (b.fase === 'ejecucion' && k++ < 400) b.step(0.1); b.start[1] = Math.round(b.men(1) * 1.3); b.start[0] = b.men(0); b.ejecutar(); assert(/finge|repliega|cruza|adelanta|flanco|reserva|aprieta|bosque|emboscad/.test(b.gesto), 'astuto reacciona: ' + b.gesto); }
  // tres dificultades: Fácil menos gestos y sin cartas; Difícil juega cartas
  { const cuenta = (dif) => { const b = mkI(libios, 'mixto', { dificultad: dif }); const { gs } = jugar(b, 8); return { reales: gs.filter(x => !/mantiene/.test(x)).length, cartas: gs.filter(x => / juega /.test(x)).length, b: b, gs: gs }; };
    const f = cuenta('facil'), n = cuenta('normal'), d = cuenta('dificil');
    assert(f.reales < n.reales && f.cartas === 0, 'Fácil: gesto cada dos rondas y sin cartas'); assert(d.cartas >= 1 && d.cartas <= 3, 'Difícil juega cartas (' + d.cartas + ')'); assert(d.reales === n.reales, 'Difícil y Normal hacen un gesto cada ronda');
    assert.strictEqual(f.b.men(1) > 0 && n.b.men(1) > 0, true); assert(d.b.ia.cartas.length >= 0 && n.b.ia.cartas.length <= 3);
    assert.notStrictEqual(f.gs.join(), n.gs.join()); assert.notStrictEqual(n.gs.join(), d.gs.join(), 'Normal y Difícil se distinguen'); }
  // el enemigo no recibe tropas de más: mismas unidades en las tres dificultades
  { const t = d => mkI(libios, 'llano', { dificultad: d }).men(1); assert.strictEqual(t('facil'), t('dificil')); }
  // modo antiguo (sin rondas): la IA no existe y nada cambia
  { const a = new Battle({ sides: [side({ hastati: 150 }), side({ libios: 150 })], defender: 1, wall: 0, seed: 8 }); assert.strictEqual(a.ia, null); assert.strictEqual(a.gesto, '');
    const c = new Battle({ sides: [side({ hastati: 150 }), side({ libios: 150 })], defender: 1, wall: 0, seed: 8, dificultad: 'dificil' }); a.finish(); c.finish(); assert.strictEqual(a.men(0), c.men(0)); assert.strictEqual(a.t, c.t); assert.strictEqual(c.ia, null);
    const z = new Battle({ sides: [side({ hastati: 150 }), side({ libios: 150 })], defender: 1, wall: 0, seed: 8, rondas: true, ia: false }); assert.strictEqual(z.ia, null); z.ejecutar(); assert.strictEqual(z.gesto, ''); }
}

// ---------- CN2b: la ciudad nueva conectada con la economía ----------
G.usarCiudad(CIMOD);
const ticks = (m) => { for (let i = 0; i < Math.round(m * 4); i++) G.tick(0.25); };
const hasta = (c, ped) => { let n = 0; while (c.queue && n++ < 400) { ped(); G.state.pending.length = 0; G.state.marches.length = 0; G.tick(1); } ped(); };   // deja pasar los meses (con caja siempre llena) hasta que acabe la obra
const tipado = o => { if (ArrayBuffer.isView(o)) return true; if (o && typeof o === 'object') for (const k in o) if (tipado(o[k])) return true; return false; };
{ // (a) una partida vieja real (guardada antes de este cambio) carga convertida y sigue jugando
  const fs = require('fs'), raw = fs.readFileSync(__dirname + '/partida-vieja.json', 'utf8'), vieja = JSON.parse(raw);
  global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} };
  assert(G.load(), 'la partida vieja carga'); const s = G.state, c = s.cities.roma, v = vieja.cities.roma;
  assert.strictEqual(c.pop, v.pop, 'misma población'); assert.deepStrictEqual(s.res, vieja.res); assert.deepStrictEqual(s.alm, vieja.alm);
  assert(c.ciudad && G.ciudadE('roma') && G.ciudadE('capua'), 'Roma y Capua tienen ciudad nueva');
  for (const b of ['aserradero', 'cantera', 'mina', 'granja', 'almacen', 'mercado', 'cuartel', 'templo']) assert(c.b[b] >= v.b[b], b + ' no baja: ' + c.b[b] + ' >= ' + v.b[b]);
  assert.strictEqual(c.b.muralla, v.b.muralla, 'la muralla sigue siendo un número'); assert.strictEqual(c.b.viviendas, 0); assert(c.b.foro >= 1);
  assert(c.queue && c.queue.b === 'almacen' && c.queue.t1 === v.queue.t1 && c.queue.pieza === 'almacen' && c.queue.nc === 3 && c.queue.pag === 1, 'su obra de almacén sigue en curso');
  assert(G.popCap(c) >= c.pop - 1, 'el cupo de casas alcanza la población'); const a0 = c.b.almacen;
  ticks(24); assert(!c.queue && c.b.almacen > a0, 'la obra se completa y sube el almacén'); assert(s.cities.capua.b.cantera >= vieja.cities.capua.b.cantera);
  assert(!tipado(s), 'el estado no lleva arrays tipados'); }
{ // (c) Roma y Capua nuevas: población y producción como las de siempre
  G.usarCiudad(null); G.newGame('CN2b-viejo'); const pv = G.prod(); G.usarCiudad(CIMOD);   // referencia: la economía de números de hoy, en este mismo proceso
  const s = G.newGame('CN2b'), p = G.prod(), cerca = (x, ref) => Math.abs(x / ref - 1) <= 0.10;
  assert(Math.abs(s.cities.roma.pop / 287 - 1) <= 0.10 && Math.abs(s.cities.capua.pop / 280 - 1) <= 0.45, 'CN9a: la plantilla manda la población de arranque (Roma ' + s.cities.roma.pop + ', Capua ' + s.cities.capua.pop + ')')   // CN10: el mercado de Capua suma población máxima;
  assert(['madera', 'piedra', 'hierro', 'grano'].every(r => cerca(p[r], pv[r])) && p.oro / pv.oro <= 1.75 && p.oro >= pv.oro * 0.9, 'producción ±10 % (el oro hasta +75 %: la plantilla trae más población y renta, CN9a) de la de números: ' + ['madera', 'piedra', 'hierro', 'grano', 'oro'].map(r => p[r].toFixed(1) + ' (antes ' + pv[r].toFixed(1) + ')').join(' · '));
  console.log('Roma+Capua nuevas, madera/piedra/hierro/grano/oro:', ['madera', 'piedra', 'hierro', 'grano', 'oro'].map(r => p[r].toFixed(1)).join('/'), 'antes', ['madera', 'piedra', 'hierro', 'grano', 'oro'].map(r => pv[r].toFixed(1)).join('/'));
  for (const id of ['roma', 'capua']) { const c = s.cities[id], E = G.ciudadE(id); assert(E && E.modoJuego && c.ciudad, id); assert(CIMOD.poblacion(E) >= c.pop, 'casas para ' + id); assert(c.b.foro >= 1 && c.b.viviendas === 0); }
  assert.strictEqual(G.ciudadE('roma').mesN, 9, 'enero en t = 0: mesN = floor(t) + 9'); ticks(5); assert.strictEqual(G.ciudadE('roma').mesN, Math.floor(s.t) + 9, 'el calendario sigue alineado');
  assert(CIMOD.fecha(G.ciudadE('roma')).mes === Math.floor(s.t) % 12);
  // (b) guardar -> cargar: misma ciudad, misma población, mismas casas
  const sa = JSON.parse(JSON.stringify(s)), E1 = G.ciudadE('roma'), casas1 = CIMOD.casas(E1).length, pob1 = CIMOD.poblacion(E1), cj = JSON.stringify(sa.cities.roma.ciudad), pop1 = s.cities.roma.pop;
  global.localStorage = { getItem: () => JSON.stringify(sa), setItem: () => {}, removeItem: () => {} }; assert(G.load());
  const E2 = G.ciudadE('roma'); assert.strictEqual(CIMOD.casas(E2).length, casas1); assert.strictEqual(CIMOD.poblacion(E2), pob1); assert.strictEqual(G.state.cities.roma.pop, pop1);
  assert.strictEqual(JSON.stringify(G.state.cities.roma.ciudad), cj, 'mismo c.ciudad');
  assert.strictEqual(JSON.stringify(Object.assign(CIMOD.aDatos(E2), { n0: E2.n0 }, E2.mur0 ? { mur0: E2.mur0 } : {})), cj, 'ida y vuelta exacta'); }
{ // (d) G.upgrade coloca, completa y mejora hasta III
  const s = G.newGame('CN2b-up'), c = s.cities.roma, ped = () => { for (const r of D.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; } };
  ped(); assert.strictEqual(c.b.mercado, 0); assert(G.upgrade('roma', 'mercado'), 'coloca el mercado'); let q = c.queue;
  assert(q.pieza === 'mercado' && q.nuevo === true && q.mejora === 0 && typeof q.x === 'number' && q.t1 > q.t0 && q.nc >= 1, 'formato de la obra'); assert(c.obras.length === 1 && G.huecos(c) === 1 && !G.upgrade('roma', 'granja'));
  assert(!Object.keys(c).includes('queue') && !JSON.stringify(c).includes('"queue"'), 'queue es un alias que no se guarda');
  hasta(c, ped); assert(!c.queue && c.b.mercado === 1 && G.ciudadE('roma').edificios.some(e => e.tipo === 'mercado' && !e.obra), 'el mercado se levanta y sube c.b');
  for (const [m, niv] of [[1, 3], [2, 6], [3, 10]]) { ped(); assert(G.upgrade('roma', 'mercado'), 'mejora ' + m); assert(c.queue.nuevo === false && c.queue.mejora === m && c.queue.eid); hasta(c, ped); assert.strictEqual(c.b.mercado, niv, 'mercado nivel ' + niv); }
  assert(!G.upgrade('roma', 'mercado'), 'tope'); assert(!G.upgrade('roma', 'viviendas') && !G.upgrade('roma', 'foro'), 'viviendas y foro salen de las casas'); }
{ // CN2c: duración de las mejoras acotada, viviendas/foro no se ofrecen y el foro no baja de lo que había
  const s = G.newGame('CN2c'), c = s.cities.roma, ped = () => { for (const r of D.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; } };
  ped(); G.upgrade('roma', 'mercado'); hasta(c, ped); let mx = 0;
  for (let m = 1; m <= 3; m++) { ped(); assert(G.upgrade('roma', 'mercado')); const q = c.queue; mx = Math.max(mx, q.t1 - q.t0); assert(q.t1 - q.t0 <= 30, 'mejora ' + m + ' dura ' + (q.t1 - q.t0).toFixed(1) + ' meses'); hasta(c, ped); }
  assert(mx > 0 && mx <= 30, 'la mejora III dura ' + mx.toFixed(1) + ' meses');
  assert(G.derivado(c, 'viviendas') && G.derivado(c, 'foro') && !G.derivado(c, 'granja'), 'viviendas y foro son derivados con ciudad nueva');
  c.foroMin = 3; G.sincronizar('roma'); assert(c.b.foro >= 3, 'el foro no baja del nivel previo'); }
{ // (f) API de colocar
  const s = G.newGame('CN2b-api'), c = s.cities.roma, ped = () => { for (const r of D.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; } }; ped(); const E = G.ciudadE('roma');
  const sitio = CIMOD.mejorSitio(E, 'fuente'), nota = G.notaSitio('roma', 'fuente', sitio[0], sitio[1]); assert(nota && nota.vale); assert(G.mapaCalor('roma', 'fuente').length > 1000);
  assert(!G.colocar('roma', 'fuente', E.foro.x, E.foro.z).ok, 'sobre el foro no'); let r = G.colocar('roma', 'fuente', sitio[0], sitio[1]); assert(r.ok, r.motivo); assert(!G.colocar('roma', 'granero', sitio[0], sitio[1]).ok, 'un solo hueco');
  hasta(c, ped); const f = E.edificios.find(e => e.tipo === 'fuente'); assert(f && !c.queue); ped();
  r = G.mejorarPieza('roma', f.id); assert(r.ok, r.motivo); hasta(c, ped); assert.strictEqual(f.mejora, 1); ped();
  const nE = E.edificios.length; assert(G.derribarPieza('roma', f.id).ok && E.edificios.length === nE - 1 && c.pop <= G.popCap(c)); assert(!G.derribarPieza('roma', f.id).ok);
  const m0 = c.b.muralla, ro = G.levantarMuralla('roma'); assert(ro.ok && c.b.muralla === m0 && E.muralla.obra > 0, 'la muralla de ciudad.js no cambia c.b.muralla');
  const E3 = G.ciudadE('roma'); ticks(3); assert.strictEqual(JSON.stringify(Object.assign(CIMOD.aDatos(E3), { n0: E3.n0 }, E3.mur0 ? { mur0: E3.mur0 } : {})), JSON.stringify(c.ciudad), 'c.ciudad siempre al día');
  const sa = JSON.parse(JSON.stringify(s)); global.localStorage = { getItem: () => JSON.stringify(sa), setItem: () => {}, removeItem: () => {} }; assert(G.load());
  assert.strictEqual(CIMOD.poblacion(G.ciudadE('roma')), CIMOD.poblacion(E3), 'el derribo se repite al cargar'); assert.strictEqual(G.ciudadE('roma').edificios.length, E3.edificios.length); }
{ // (g) una ciudad conquistada se convierte; (e) 18 ciudades propias: estado pequeño y sin arrays tipados
  const s = G.newGame('CN2b-conq'); const v = s.cities.volsinii; assert(!G.ciudadE('volsinii'), 'ajena: solo números');
  G.incorporar(v, { hastati: 20 }, true); const E = G.ciudadE('volsinii'); assert(E && v.ciudad && v.owner === 'roma' && v.queue === null && v.obras.length === 0, 'conquistada: ciudad nueva');
  assert(CIMOD.poblacion(E) >= v.pop || v.pop <= G.popCap(v) + 1, 'población respetada'); assert(v.b.viviendas === 0 && v.b.foro >= 1);
  const t = Date.now(); let n = 0; for (const id of Object.keys(D.CITIES)) { if (n >= 18) break; const c = s.cities[id]; if (c.owner !== 'roma') { c.owner = 'roma'; c.pop = 300; c.units = {}; c.reparto = G.repartoBase(); } if (G.ciudadE(id)) n++; }
  assert.strictEqual(G.myCities().length, 18); const tam = JSON.stringify(s).length; console.log('18 ciudades propias: estado de', Math.round(tam / 1024), 'KB; conversión', Math.round((Date.now() - t) / 18), 'ms por ciudad');
  assert(tam < 300000, 'estado < 300 KB (' + tam + ')'); assert(!tipado(s), 'sin arrays tipados');
  const t2 = Date.now(); ticks(12); console.log('12 meses con 18 ciudades:', Date.now() - t2, 'ms'); assert(!tipado(s)); G.usarCiudad(null); }

// 8. Senado (Q7): favor, misiones, partida vieja, favor bajo
{
  D.SENADO.sala = false;   // SN1: este bloque prueba el Senado de Q7 (la sala nueva se prueba en test/senado.test.js)
  const s = G.newGame('Test'); G.turnos = false;
  assert(s.favor.senado === 50 && s.favor.pueblo === 50, 'favor inicial 50/50');
  let ma = G.misionActual(); assert(ma && ma.m.id === 'levas-heraclea' && ma.t1 === ma.t0 + ma.m.plazo && typeof ma.falta === 'string', 'misión nueva al empezar');
  assert.deepStrictEqual(G.favor(), { senado: 50, pueblo: 50 }); assert(!G.favorBajo() && G.senadoMotivo() === '');
  for (const m of Object.values(D.MISIONES)) { assert(G.MISION_TIPOS[m.cond.tipo], 'tipo de condición registrado: ' + m.cond.tipo); assert(!/termas|anfiteatro|acueducto|vigiles/i.test(m.texto + m.n + JSON.stringify(m.cond)), 'misión sin piezas retiradas'); assert(!m.cond.b || D.BUILD[m.cond.b], 'pieza real'); }
  // cumplida: premio y siguiente misión tras la pausa
  s.cities.roma.units.hastati += 400; const o0 = s.res.oro;
  s.t = 1; G.cierreMes(); assert(s.misionesHechas['levas-heraclea'] === 'ok' && s.favor.senado > 50 && s.res.oro + s.alm.oro >= o0 + 80, 'misión cumplida da premio');
  assert(G.misionActual() === null, 'pausa tras la misión'); s.t = 13; G.cierreMes(); assert(G.misionActual() && G.misionActual().m.id === 'presidio-regio', 'sigue la siguiente por orden');
  // vencida: castigo
  const x = s.mision, antes = s.favor.senado; s.cities.capua.units = {}; s.t = x.t1 + 0.01; s.mision.id = 'presidio-regio'; G.cierreMes();
  assert(s.misionesHechas['presidio-regio'] === 'fallo' && s.favor.senado < antes && !s.mision, 'misión vencida castiga');
  // topes
  s.favor.senado = 99; s.favor.pueblo = 99; s.mision = { id: 'levas-heraclea', t0: 0, t1: 1 }; s.misionesHechas = {}; s.cities.roma.units.hastati += 400; G.cierreMes(); assert(s.favor.senado <= 100 && s.favor.pueblo <= 100, 'tope 100');
  s.favor.senado = 1; s.mision = { id: 'presidio-regio', t0: 0, t1: 1 }; s.cities.capua.units = {}; s.res.oro = -50; s.t += 5; G.cierreMes(); assert(s.favor.senado >= 0 && s.favor.senado < 1, 'tope 0 y oro en rojo baja el favor'); s.res.oro = 100;
  // el pueblo tiende al ánimo medio
  s.favor.pueblo = 0; s.t += 1; G.cierreMes(); assert(s.favor.pueblo > 0 && s.favor.pueblo < 30, 'pueblo sube con inercia');
  // favor bajo: niega tratado ajeno y quinta leva; lo propio sigue
  s.favor.senado = 10; assert(G.favorBajo() && /malos ojos/.test(G.senadoMotivo()));
  const c = s.cities.roma; c.b.mercado = 3; c.b.puerto = 3; const aj = G.neighbors('roma').find(i => s.cities[i].owner !== 'roma');
  if (aj) { s.rutas = []; assert(/Senado/.test(G.rutaPuede('roma', aj) || ''), 'favor bajo niega tratado ajeno'); s.favor.senado = 60; assert(!/Senado/.test(G.rutaPuede('roma', aj) || ''), 'con favor normal no lo niega'); s.favor.senado = 10; }
  assert(G.rutaPuede('roma', 'capua') === null || !/Senado/.test(G.rutaPuede('roma', 'capua')), 'rutas propias no se niegan');
  c.train = [1, 2, 3, 4].map(() => ({ u: 'hastati', n: 1, t0: 0, t1: 9 })); c.pop = 5000; const nl = c.train.length; assert.strictEqual(G.train('roma', 'hastati', 10), false, 'favor bajo niega leva extra'); assert.strictEqual(c.train.length, nl);
  // partida vieja sin favor
  const vieja = JSON.parse(JSON.stringify(s)); delete vieja.favor; delete vieja.mision; delete vieja.misionesHechas; delete vieja.proxMision; G.migrarSenado(vieja);
  assert(vieja.favor.senado === 50 && vieja.favor.pueblo === 50 && vieja.mision === null, 'partida vieja: favor 50 y sin misión');
  D.SENADO.sala = true;
}

// N15. Equilibrio y objetivos: ancho de frente, bisoñas, objetivos de batalla, curva de equilibrio y dificultad por contexto
{
  const T15 = Date.now(), EQ = require('./equilibrio.js');
  const mk = (a, b, o, ea, eb) => new Battle(Object.assign({ sides: [side(a, ea), side(b, eb)], defender: 1, wall: 0, seed: 7 }, o || {}));
  const gana = (n, f) => { let g = 0; for (let sd = 1; sd <= n; sd++) { const q = fight.apply(null, f(sd)); if (q.winner === 0) g++; } return g / n; };
  // ancho de frente: más de ATAC_MAX regimientos sobre el mismo objetivo no suman daño; con uno solo se pega menos
  {
    const dano = n => {
      const bt = mk({ hastati: 480 }, { hastati: 480 }), B = bt.regs.find(r => r.side === 1 && r.k === 'hastati'), A = bt.regs.filter(r => r.side === 0 && r.k === 'hastati').slice(0, n);
      for (const r of bt.regs) { r.atkMul = 1; r.defMul = 1; r.fat = 0; r.think = 9; r.cd = 9; }
      B.x = 400; B.y = 300; B.ang = Math.PI / 2; B.order = { k: 'quieto' };
      const xs = [-26, 26, 0, -13, 13, -39, 39, 0];
      A.forEach((r, i) => { r.x = B.x + xs[i]; r.y = B.y + 40; r.order = { k: 'atk', r: B, tipo: 'avanzar' }; r.tgt = B; r.ang = -Math.PI / 2; });
      for (const r of bt.regs) if (r.side === 1 && r !== B) { r.x = 1500; r.y = 100; r.order = { k: 'quieto' }; }
      for (const r of bt.regs) if (r.side === 0 && A.indexOf(r) < 0) { r.x = 1700; r.y = 800; r.order = { k: 'quieto' }; }
      const h0 = B.hp; for (let i = 0; i < 4; i++) bt.step(0.05); return h0 - B.hp;
    };
    const d1 = dano(1), d2 = dano(2), d6 = dano(6);
    assert(d2 > d1 * 1.3, 'dos regimientos pegan más que uno (' + d1.toFixed(4) + ' / ' + d2.toFixed(4) + ')');
    assert(d6 < d2 * 1.5, 'seis sobre el mismo objetivo no suman seis veces: tope de frente (' + d2.toFixed(4) + ' / ' + d6.toFixed(4) + ')');
  }
  // bisoñas: empiezan Vacilantes, la moral tiene tope que sube peleando, y pegan menos que la veterana
  {
    const bt = mk({ hastati: 240 }, { hastati: 240 }, {}, { bis: 1 }), bs = bt.regs.filter(r => r.side === 0 && r.k !== 'general'), vs = bt.regs.filter(r => r.side === 1 && r.k !== 'general');
    assert(bs.every(r => r.bis === 1 && Battle.esBisono(r) && Battle.estadoMoral(r) === 1), 'bisoñas: Vacilantes al empezar y marcadas (r.bis)');
    assert(bs[0].morMax < vs[0].morMax * 0.9 && vs.every(r => !r.bis && !Battle.esBisono(r)), 'bisoña: menos moral máxima; la veterana no está marcada');
    const x = bs[0]; x.mor = x.morMax; x.x = 100; x.y = 900; x.order = { k: 'quieto' }; for (const r of bt.regs) if (r.side === 1) { r.x = 1800; r.y = 50; r.order = { k: 'quieto' }; }
    for (let i = 0; i < 100; i++) bt.step(0.1); assert(Battle.estadoMoral(x) <= 1, 'sin pelear, la moral de la bisoña no pasa del tope (no llega a Firme)');
    x.curt = Battle.BIS_CURTIDO / 2; x.mor = x.morMax; for (let i = 0; i < 20; i++) bt.step(0.1); assert(x.mor > UMBRAL(x) && x.mor < x.morMax - 1, 'el tope sube con lo curtida que está');
    x.curt = Battle.BIS_CURTIDO; assert(!Battle.esBisono(x) && Battle.topeMor(x) === x.morMax, 'curtida del todo: sin tope');
    const hitDe = bis => { const b2 = mk({ hastati: 240 }, { hastati: 240 }, {}, { bis: bis }), a = b2.regs.find(r => r.side === 0 && r.k === 'hastati'), t = b2.regs.find(r => r.side === 1 && r.k === 'hastati'); a.atkMul = t.defMul = 1; a.mor = a.morMax; a.fat = 0; a.ang = t.ang + Math.PI; a.x = t.x; a.y = t.y + 30; const h0 = t.hp; b2.hit(a, t, 10, false); return h0 - t.hp; };
    assert(hitDe(1) < hitDe(0), 'la bisoña pega menos que la veterana');
    const m = mk({ milicia: 100 }, { hastati: 100 }); assert(m.regs.filter(r => r.side === 0 && r.k === 'milicia').every(r => r.bis === 1), 'la milicia cuenta como bisoña entera');
    function UMBRAL(r) { return 0.55 * r.morMax; }
  }
  // objetivos de batalla
  {
    const g = { gen: { n: 'General' } };
    // sin objetivo: nada cambia
    { const a = fight({ hastati: 150 }, { libios: 150 }, { seed: 3 }); const bt = mk({ hastati: 150 }, { libios: 150 }, { seed: 3 }); bt.finish(); assert.strictEqual(bt.result().objetivo, undefined); assert.strictEqual(bt.progresoObjetivo(), null); assert.strictEqual(a.winner, bt.result().winner); }
    // resistir por segundos: el débil aguanta 60 s ante un ejército mayor
    { const bt = mk({ hastati: 600 }, { hastati: 150 }, { objetivo: { tipo: 'resistir', lado: 1, seg: 60 } }); bt.finish(); const r = bt.result();
      assert(r.objetivo && r.objetivo.tipo === 'resistir' && r.objetivo.cumplido && r.winner === 1 && r.time >= 60 && r.time < 70, 'resistir: gana el que aguanta (' + r.time + ' s)');
      const bt2 = mk({ hastati: 600 }, { hastati: 60 }, { objetivo: { tipo: 'resistir', lado: 1, seg: 3000 } }); bt2.finish(); const r2 = bt2.result(); assert(r2.winner === 0 && r2.objetivo && !r2.objetivo.cumplido && /no/i.test(r2.objetivo.texto), 'resistir: destruido, no cumplido'); }
    // resistir por rondas y progreso para el HUD
    { const bt = mk({ hastati: 480 }, { hastati: 200 }, { rondas: true, ia: false, objetivo: { tipo: 'resistir', lado: 1, rondas: 2 } }); let p = bt.progresoObjetivo();
      assert(p.tipo === 'resistir' && p.frac === 0 && /2 rondas más/.test(p.texto), 'progreso inicial: ' + p.texto);
      const juega = () => { assert(bt.ejecutar()); let k = 0; while (bt.fase === 'ejecucion' && !bt.over && k++ < 400) bt.step(0.1); };
      juega(); p = bt.progresoObjetivo(); assert(!bt.over && p.frac === 0.5 && /1 ronda más/.test(p.texto), 'tras una ronda: ' + p.texto);
      const e = bt.estado(); juega(); assert(bt.over && bt.winner === 1 && bt.result().objetivo.cumplido, 'rondas: al cumplirse gana el que aguanta');
      bt.aplicar(e); assert(!bt.over && bt.progresoObjetivo().frac === 0.5, 'estado()/aplicar() conserva el objetivo'); }
    // tomar la zona
    { const zona = { x: 0.3, y: 0.4, w: 0.4, h: 0.2 };
      const prep = (dentro0, dentro1) => { const bt = mk({ hastati: 240 }, { hastati: 240 }, { objetivo: { tipo: 'tomar', lado: 0, zona: zona, seg: 5 } }); const z = bt.zonaObjetivo(); let i = 0;
        for (const r of bt.regs) { r.order = { k: 'quieto' }; r.tgt = null; const dentro = r.side === 0 ? dentro0 : dentro1; if (dentro && i++ < 1) { r.x = (z.x0 + z.x1) / 2; r.y = (z.y0 + z.y1) / 2; } else if (r.side === 0) { r.x = 50; r.y = bt.H - 40; } else { r.x = bt.W - 50; r.y = 40; } if (dentro) i = 0; }
        return bt; };
      const a = prep(true, false); for (let i = 0; i < 40; i++) a.step(0.1); const pa = a.progresoObjetivo(); assert(pa.frac > 0 && pa.frac < 1, 'tomar: progreso a medias'); const e = a.estado(), t0 = a.obj.tZona[0];
      for (let i = 0; i < 40; i++) a.step(0.1); assert(a.over && a.winner === 0 && a.result().objetivo.cumplido, 'tomar: la zona sola 5 s gana'); a.aplicar(e); assert(!a.over && Math.abs(a.obj.tZona[0] - t0) < 1e-9, 'estado()/aplicar() conserva el tiempo en la zona');
      const b = prep(true, true); for (let i = 0; i < 100; i++) b.step(0.1); assert(!b.over, 'tomar: con enemigo dentro no se cumple');
      const c = prep(false, true); const rr = c.regs.find(r => r.side === 0); c.regs.forEach(r => { r.order = { k: 'quieto' }; }); for (let i = 0; i < 120; i++) c.step(0.1); assert(c.over && c.winner === 1 && !c.result().objetivo.cumplido, 'tomar: lo toma el rival y el objetivo no se cumple'); }
    // escapar con el general
    { const bt = mk({ hastati: 240 }, { hastati: 240 }, { objetivo: { tipo: 'escapar', lado: 0 } }, g, g); const G = bt.regs.find(r => r.side === 0 && r.k === 'general'); for (const r of bt.regs) r.order = { k: 'quieto' };
      assert(bt.progresoObjetivo().tipo === 'escapar' && bt.progresoObjetivo().frac < 0.1, 'escapar: al principio lejos'); G.y = 300; bt.step(0.1); const f1 = bt.progresoObjetivo().frac; assert(f1 > 0.3 && !bt.over, 'escapar: progreso según la posición'); G.y = 50; bt.step(0.1);
      assert(bt.over && bt.winner === 0 && bt.result().objetivo.cumplido, 'escapar: el general llega al borde enemigo');
      const b2 = mk({ hastati: 240 }, { hastati: 240 }, { objetivo: { tipo: 'escapar', lado: 0 } }, g, g); b2.regs.find(r => r.side === 0 && r.k === 'general').st = 'dead'; for (const r of b2.regs) r.order = { k: 'quieto' }; b2.step(0.1);
      assert(b2.over && b2.winner === 1 && !b2.result().objetivo.cumplido, 'escapar: sin general no se cumple'); }
  }
  // curva de equilibrio (auto-batalla, 10 semillas, tolerancias anchas)
  {
    const N = 8, curva = (k, q) => gana(N, sd => [{ hastati: Math.round(480 * k) }, { hastati: 480 }, { seed: sd }]), conQ = (k, q) => { let g = 0; for (let sd = 1; sd <= N; sd++) if (EQ.una({ k: k, seed: sd, A: { atkMul: q, defMul: q } }).gana) g++; return g / N; };
    const c15 = curva(1.5), c1 = curva(1), c85 = curva(0.85), c67 = curva(0.67), c5 = curva(0.5);
    assert(c15 >= 0.9, 'el 1,5× gana casi siempre (' + c15 + ')'); assert(c1 >= 0.2 && c1 <= 0.85, 'igualados: reñido (' + c1 + ')'); assert(c85 <= 0.5 && c85 < c1, '0,85×: pierde casi siempre (' + c85 + ')'); assert(c67 <= 0.25 && c5 <= 0.1, 'el chico no gana sin plan (' + c67 + ', ' + c5 + ')');
    assert(conQ(0.85, 1.2) >= 0.5, 'calidad 1,2× con 0,85× gana a menudo'); assert(conQ(0.67, 1.2) <= 0.3, 'calidad 1,2× con 0,67× casi nunca');
    const c05 = conQ(1, 1.05); assert(c05 < 0.95 || c1 < 0.85, 'un 5 % de calidad no lo decide todo (' + c05 + ')');
    let t = 0; for (let sd = 1; sd <= 3; sd++) t += EQ.una({ k: 0.5, seed: sd }).t; assert(t / 3 >= 70, 'muy desiguales: duran más de 70 s (R1) (' + Math.round(t / 3) + ' s)');
    const bis = (b) => { let g = 0; for (let sd = 1; sd <= N; sd++) if (EQ.una({ seed: sd, A: { bis: b } }).gana) g++; return g / N; }; assert(bis(1) <= 0.3 && bis(1) < c1, 'la leva bisoña pierde contra la veterana (' + bis(1) + ')');
  }
  // dificultad por contexto: ficha con factores, y el nivel ordena el resultado
  {
    const e0 = EQ.ESCENARIOS, d = e0.map(e => new Battle(EQ.configEscenario(e, 1)).dif);
    assert(d.every(x => typeof x.nivel === 'number' && x.nivel >= -1 && x.nivel <= 1 && Array.isArray(x.factores) && x.factores.length >= 6 && /^Rival: /.test(x.texto) && x.factores.every(f => f.n && f.txt && typeof f.v === 'number')), 'ficha {nivel, factores, texto}');
    assert(d[0].nivel < d[1].nivel && d[1].nivel < d[2].nivel && d[2].nivel <= d[3].nivel, 'los escenarios van de fácil a duro: ' + d.map(x => x.nivel).join(' < '));
    assert.deepStrictEqual(Battle.dificultadContexto(EQ.configEscenario(e0[2], 1)), d[2], 'es una función pura');
    assert(/cerro/.test(d[3].texto) && d[3].factores.some(f => f.n === 'Terreno' && f.v > 0), 'el texto nombra lo que más pesa: ' + d[3].texto);
    const w = e0.map(e => EQ.escenario(e, 12).pct);
    assert(w[0] >= w[1] && w[1] >= w[2] && w[2] >= w[3], 'la victoria baja al subir el nivel: ' + w.join(' ≥ ')); assert(w[0] - w[3] >= 15 && w[0] - w[2] >= 15, 'al menos 15 puntos entre el escenario fácil y el duro: ' + w.join(', '));
    const bt = new Battle(Object.assign(EQ.configEscenario(e0[3], 1), { rondas: true })); assert.strictEqual(bt.ia.dif, 'normal'); assert.strictEqual(bt.ia.nivel, bt.dif.nivel, 'la IA usa el nivel de contexto');
  }
  console.log('N15: ' + Math.round((Date.now() - T15) / 1000) + ' s');
}

// N7. Relevos y formaciones: formaciones por regimiento, ancho de frente, columna, marcha agrupada, tres líneas, atajos y previsión por tiempos
{
  const T7 = Date.now();
  const mk = (a, b, o) => new Battle(Object.assign({ sides: [side(a), side(b)], defender: 1, wall: 0, seed: 7, rondas: true }, o || {}));
  const R = (bt, s, k) => bt.regs.filter(r => r.side === s && r.k === k);
  // tabla y reglas de quién puede qué
  {
    const bt = mk({ hastati: 240, principes: 120, triarii: 80, velites: 60, equites: 40 }, { falange: 200, hoplitas: 80, galos: 100 });
    for (const k of ['normal', 'testudo', 'cuna', 'orbe', 'falange']) { const f = Battle.FORM[k]; assert(f && f.n && f.gana && f.pierde && f.t >= 0 && f.vel > 0, 'ficha de ' + k); }
    const pos = (s, k) => bt.formacionesPosibles(R(bt, s, k)[0]);
    assert(pos(0, 'hastati').indexOf('testudo') >= 0 && pos(0, 'principes').indexOf('cuna') >= 0 && pos(0, 'equites').indexOf('cuna') >= 0 && pos(0, 'velites').indexOf('orbe') >= 0, 'cada papel tiene las suyas');
    assert(pos(0, 'triarii').indexOf('testudo') < 0 && pos(0, 'triarii').indexOf('falange') >= 0 && pos(0, 'equites').indexOf('testudo') < 0 && pos(1, 'galos').indexOf('testudo') < 0, 'los lanceros y la ligera no forman testudo');
    assert.strictEqual(R(bt, 1, 'falange')[0].form, 'falange', 'la falange parte cerrada (regla unificada)'); assert.strictEqual(R(bt, 0, 'hastati')[0].form, 'normal');
  }
  // orden de formación: gasta punto de mando, se aplica al ejecutar
  {
    const bt = mk({ hastati: 240, velites: 120 }, { hastati: 240 }); bt.empezar();
    const h = R(bt, 0, 'hastati'), v = R(bt, 0, 'velites')[0], mp0 = bt.mandoPuntos().usados;
    assert.strictEqual(bt.ponerFormacion(v, 'testudo'), false); assert(/no es para/.test(bt.motivo), 'rechaza con motivo: ' + bt.motivo);
    assert.strictEqual(bt.ponerFormacion(h[0], 'testudo'), true); assert.strictEqual(bt.mandoPuntos().usados, mp0 + 1, 'gasta un punto de mando');
    assert.strictEqual(h[0].form, 'normal', 'en el plan aún no cambia'); assert.strictEqual(h[0].order.form, 'testudo');
    assert(bt.prevision().length > 0, 'la previsión sigue funcionando');
    assert(bt.ejecutar()); assert.strictEqual(h[0].form, 'testudo'); assert(h[0].trans > 0, 'transición en marcha'); assert(!('form' in (h[0].order || {})), 'la orden se consume'); assert.strictEqual(h[0].order, null, 'la orden formar se libera'); assert.strictEqual(bt.mandoPuntos().usados, 0, 'los puntos vuelven a 0');
  }
  // efectos
  {
    const bt = mk({ hastati: 240, velites: 120 }, { hastati: 240, velites: 120 });
    const A = R(bt, 0, 'velites')[0], B = R(bt, 1, 'hastati')[0];
    const dano = (form, trans, ang, ranged) => { const q = bt.clona(); const a = q.regs[bt.regs.indexOf(A)], b = q.regs[bt.regs.indexOf(B)]; for (const r of q.regs) { r.atkMul = 1; r.defMul = 1; r.fat = 0; r.mor = r.morMax; } a.x = 300; a.y = 300; b.x = 300; b.y = 280; b.form = form; b.trans = trans; b.ang = ang; const h0 = b.hp; q.hit(a, b, 10, ranged); return h0 - b.hp; };
    const f0 = dano('normal', 0, Math.PI / 2, true), ft = dano('testudo', 0, Math.PI / 2, true);
    assert(ft < f0 * 0.5, 'la testudo aguanta proyectiles: ' + ft + ' vs ' + f0);
    assert(dano('normal', 4, Math.PI / 2, true) > f0 * 1.15, 'cambiando de formación está más vulnerable');
    const lado0 = dano('normal', 0, 0, false), ladoT = dano('testudo', 0, 0, false), ladoO = dano('orbe', 0, 0, false), ladoF = dano('falange', 0, 0, false);
    assert(ladoT > lado0 * 1.1, 'testudo floja por el flanco'); assert(ladoO < lado0 * 0.9, 'el orbe no tiene flancos débiles'); assert(ladoF > lado0 * 1.2, 'la falange es frágil de lado');
    assert(dano('falange', 0, Math.PI / 2, false) < dano('normal', 0, Math.PI / 2, false), 'la falange aguanta de frente');
  }
  // dimensiones
  {
    const bt = mk({ hastati: 480 }, { hastati: 480 }), r = R(bt, 0, 'hastati')[0], f0 = Battle.forma(r);
    assert(f0.ancho > 0 && f0.fondo > 0 && f0.sep > 0 && Math.abs(f0.files * f0.fondo - r.men) < f0.files, 'forma normal coherente: ' + JSON.stringify(f0));
    const fh0 = Battle.frenteHombres(r);
    assert(bt.fijarFrente(r, { x: 300, y: 500, ang: -Math.PI / 2, ancho: f0.ancho * 2 })); const f1 = Battle.forma(r);
    assert(f1.ancho > f0.ancho * 1.6 && f1.fondo < f0.fondo, 'más ancho, menos fondo: ' + f0.ancho + '/' + f0.fondo + ' -> ' + f1.ancho + '/' + f1.fondo);
    assert(Battle.frenteHombres(r) > fh0 * 1.6, 'el frente efectivo sigue al ancho');
    bt.fijarFrente(r, { ancho: 1 }); assert(r.frente.ancho >= f0.sep, 'recorta por abajo'); bt.fijarFrente(r, { ancho: 99999 }); const fm = Battle.forma(r); assert(fm.fondo >= 1 && fm.files <= r.men, 'recorta por arriba');
    bt.fijarFrente(r, { x: 300, y: 500, ang: 0, ancho: f0.ancho }); assert(r.order.k === 'move' && r.order.ang === 0);
    r.form = 'testudo'; assert(Battle.forma(r).sep < f0.sep, 'la testudo se aprieta'); r.form = 'orbe'; const fo = Battle.forma(r); assert(Math.abs(fo.files - fo.fondo) <= 1, 'el orbe es un cuadro'); r.form = 'normal';
  }
  // columna y marcha agrupada
  {
    const bt = mk({ hastati: 240, equites: 60, velites: 100 }, { hastati: 240 }, { fw: 1200 }); bt.empezar();
    const hs = R(bt, 0, 'hastati')[0], eq = R(bt, 0, 'equites')[0], ve = R(bt, 0, 'velites')[0];
    const antes = Battle.forma(hs); hs.columna = true; const col = Battle.forma(hs); hs.columna = false;
    assert(col.ancho < antes.ancho && col.fondo > antes.fondo, 'la columna es larga y estrecha');
    for (const r of [hs, eq]) { r.x = 100 + r.id * 30; r.y = 780; r.order = { k: 'move', x: r.x, y: 700, tipo: 'avanzar' }; }
    for (const r of bt.regs) if (r.side === 1) { r.x = 700; r.y = 60; }
    ve.order = null; const n = bt.agrupar([hs, eq]); assert.strictEqual(n, 2); assert(hs.agrupado && eq.order.vmax && eq.order.vmax < eq.vel, 'la caballería baja a su ritmo');
    for (const r of bt.regs) if (![hs, eq].includes(r) && r.side === 0) r.order = { k: 'quieto' };
    assert(bt.ejecutar()); let marcho = false; const tiempos = {};
    for (let i = 0; i < 190; i++) { bt.step(0.1); if (hs.columna) marcho = true; for (const r of [hs, eq]) if (!r.order && !tiempos[r.id]) tiempos[r.id] = bt.tRonda; if (bt.fase !== 'ejecucion') break; }
    assert(marcho, 'marchando lejos del enemigo va en columna');
    const ts = Object.values(tiempos); assert.strictEqual(ts.length, 2, 'los dos llegan'); assert(Math.max.apply(null, ts) - Math.min.apply(null, ts) < 4, 'llegan juntos: ' + ts.join(', '));
  }
  // tres líneas y relevos
  {
    const bt = new Battle({ sides: [side({ hastati: 360, principes: 240, triarii: 120, velites: 60 }), side({ galos: 400 })], defender: 1, wall: 0, seed: 7, rondas: true, despliegue: true });
    bt.formar(0, 'tres');
    const li = n => bt.regs.filter(r => r.side === 0 && r.linea === n);
    assert(li(1).length && li(2).length && li(3).length, 'tres líneas: ' + [1, 2, 3].map(n => li(n).length));
    assert(li(1).every(r => r.k === 'hastati') && li(3).every(r => r.k === 'triarii'), 'hastati delante, triarii detrás');
    bt.empezar();
    for (const r of li(1)) r.fat = 60;
    const n = bt.relevarLinea(0, 1); assert(n >= 1, 'relevo: ' + n + ' ' + bt.motivo);
    assert(bt.relevarLinea(0, 3) === 0 && bt.motivo, 'sin línea 4 no hay relevo');
    assert(bt.notas.some(t => /releva a/.test(t)), 'avisa del relevo'); assert(li(1).some(r => r.k === 'principes'), 'las líneas se intercambian');
    const ib = new Battle({ sides: [side({ hastati: 200 }), side({ hastati: 360, principes: 240 })], defender: 0, wall: 0, seed: 7, rondas: true, despliegue: true });
    ib.formar(1, 'tres'); ib.empezar();
    const e1 = ib.regs.filter(r => r.side === 1 && r.linea === 1), e2 = ib.regs.filter(r => r.side === 1 && r.linea === 2); assert(e1.length && e2.length);
    for (const r of e1) r.fat = 70; assert(ib.autoRelevo(1) >= 1, 'la IA releva a los cansados'); assert(e1.some(r => r.order && r.order.tipo === 'relevar'));
    const ib2 = new Battle({ sides: [side({ hastati: 200 }), side({ hastati: 360, principes: 240 })], defender: 0, wall: 0, seed: 7, rondas: true, despliegue: true, relevoAuto: false });
    ib2.formar(1, 'tres'); ib2.empezar(); for (const r of ib2.regs.filter(r => r.side === 1 && r.linea === 1)) r.fat = 70; ib2.iaRonda(); assert(!ib2.regs.some(r => r.order && r.order.tipo === 'relevar'), 'relevoAuto false lo apaga');
  }
  // previsión por tiempos
  {
    const bt = mk({ hastati: 240 }, { hastati: 240 }); bt.empezar(); const h = R(bt, 0, 'hastati')[0]; h.order = { k: 'move', x: h.x, y: h.y - 200, tipo: 'avanzar' };
    const pr = bt.prevision([5, 10, 30]); assert(Array.isArray(pr) && pr.length === 3 && pr[0].t === 5 && pr[2].t <= 20, 'tiempos recortados a la ronda');
    const yy = i => pr[i].sombras.find(s => s.id === h.id).y; assert(yy(0) > yy(1) && yy(1) >= yy(2), 'la sombra avanza con el tiempo');
    const fin = bt.prevision(); assert(Array.isArray(fin) && fin[0].id !== undefined && Math.abs(fin.find(s => s.id === h.id).y - yy(2)) < 1e-6, 'sin argumento = lo de siempre');
    assert.strictEqual(bt.fase, 'plan', 'prever no toca la batalla real');
  }
  // atajos
  {
    const bt = new Battle({ sides: [side({ hastati: 240, principes: 120, equites: 60, triarii: 100 }, { gen: { n: 'Cónsul' } }), side({ galos: 200, velites: 100 })], defender: 1, wall: 0, seed: 7, rondas: true }); bt.empezar(); assert(bt.mandoPuntos().max >= 4, 'con general hay puntos');
    const h = R(bt, 0, 'hastati')[0], p = R(bt, 0, 'principes')[0], e = R(bt, 0, 'equites')[0], t = R(bt, 0, 'triarii')[0];
    let a = bt.atajo('testudo', [h, p, e]); assert(a && a.n === 2 && /testudo/.test(a.txt) && h.order.form === 'testudo' && !e.order, 'testudo solo a quien puede');
    a = bt.atajo('carga', [e]); assert(a && a.n === 1 && e.order.k === 'atk' && e.order.tipo === 'cargar', 'la caballería carga');
    a = bt.atajo('retirada', [p]); assert(a && p.order.tipo === 'retirarse' && p.order.y > p.y, 'retirada hacia atrás');
    h.men = Math.round(h.max * 0.4); h.fat = 70; t.y = h.y + 80; t.x = h.x; t.order = null;
    a = bt.atajo('refuerzo', [h]); assert(a && /releva a/.test(a.txt) && t.order.tipo === 'relevar', 'el reserva releva al más castigado');
    assert.strictEqual(bt.atajo('nada', [h]), null); assert.strictEqual(bt.atajo('carga', []), null);
    const b2 = mk({ hastati: 800 }, { galos: 100 }); b2.empezar(); const mias = b2.regs.filter(r => r.side === 0 && r.k !== 'general');
    const a2 = b2.atajo('retirada', mias); assert(a2 && b2.mandoPuntos().usados <= b2.mandoPuntos().max, 'no pasa de los puntos de mando');
  }
  // la formación persiste
  {
    const bt = mk({ hastati: 240 }, { hastati: 240 }); bt.empezar(); const h = R(bt, 0, 'hastati')[0]; bt.ponerFormacion(h, 'testudo'); bt.ejecutar();
    const c = bt.clona(); assert.strictEqual(c.regs[bt.regs.indexOf(h)].form, 'testudo'); for (let i = 0; i < 200 && bt.fase === 'ejecucion'; i++) bt.step(0.1); assert.strictEqual(h.form, 'testudo', 'la formación persiste entre rondas');
  }
  console.log('N7: ' + Math.round((Date.now() - T7) / 1000) + ' s');
}

{ // N8b: elección del choque que sigue la cámara (lógica pura)
  const So = require('../js/gfx/sonido.js'), R = (x, y, men, o) => Object.assign({ st: 'ok', x, y, men, fight: 0, charge: 0, u: { cls: 'inf' } }, o || {});
  assert.strictEqual(So.elegirChoque([R(0, 0, 100)]), null, 'sin combate no hay choque');
  const ch = So.elegirChoque([R(100, 100, 50, { fight: 1 }), R(120, 100, 50, { fight: 1 }), R(900, 300, 80, { fight: 1 }), R(0, 0, 500)]);
  assert.ok(ch && ch.x < 200 && ch.regs.length === 2, 'elige el grupo cercano con más hombres');
  const cg = So.elegirChoque([R(900, 300, 120, { fight: 1 }), R(100, 100, 100, { charge: 1, u: { cls: 'cav' } })]);
  assert.ok(cg.cab && cg.x === 100, 'prioriza la carga'); assert.strictEqual(So.etiqueta(cg, 1000), 'carga de caballería');
  assert.strictEqual(So.etiqueta({ x: 100 }, 1000), 'ala izquierda'); assert.strictEqual(So.etiqueta({ x: 500 }, 1000), 'choque del centro'); assert.strictEqual(So.etiqueta({ x: 900 }, 1000), 'ala derecha');
  console.log('N8b: elegir choque OK');
}

// ---- H13 Pirro ataca en 280 (Plutarco, Pirro 17), no en 277 ----
{ const ev = D.EVENTS.filter(e => e.k === 'pirro'); assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].y, 280); assert(ev[0].lic && ev[0].fx === 'pirro');
  assert(!D.EVENTS.some(e => e.y === 277), 'ya no hay hecho de 277'); assert(!/277/.test(ev[0].lic + ev[0].x));
  for (const r of ['italia', 'mediterraneo']) { const s = G.newGame('Pirro', r); assert(s.marches.some(m => m.owner === 'epiro' && m.label === 'Pirro'), 'Pirro marcha al empezar (' + r + ')'); assert(s.ev[D.EVENTS.indexOf(ev[0])]); }
  assert(require('../js/registro.js').de('hecho', '280-pirro') && require('../js/registro.js').de('hecho', 280));
  // partida vieja guardada en 278 (antes Pirro era 277): no lo lanza de golpe
  const v = G.newGame('Vieja'); v.marches = []; v.t = (280 - 278) * 12; v.ev = {}; D.EVENTS.forEach((e, i) => { if (278 <= e.y) v.ev[i] = 1; }); delete v.ev[D.EVENTS.indexOf(ev[0])]; delete v.evV;
  global.localStorage = { _: null, getItem() { return this._; }, setItem(k, x) { this._ = x; }, removeItem() {} }; localStorage.setItem('aqvila-save-v1', JSON.stringify(v));
  assert(G.load()); G.tick(0.25); assert(!G.state.marches.some(m => m.label === 'Pirro'), 'una partida vieja no lanza a Pirro de golpe'); delete global.localStorage; }

// ---- H13b Pirro llega antes con tres vías: ejército menor, levas iniciales y dos oleadas (licencia de juego) ----
{ for (const r of ['italia', 'mediterraneo']) { const s = G.newGame('Pirro', r); const ms = s.marches.filter(m => m.owner === 'epiro');
    assert.strictEqual(ms.length, 2, 'dos oleadas (' + r + ')'); const [a, b] = ms.sort((x, y) => x.t1 - y.t1);
    assert(a.t1 >= 30 && a.t1 <= 34 && b.t1 > a.t1 && b.t1 <= 44, 'oleadas a 30-44 meses: ' + a.t1 + ', ' + b.t1);
    assert(G.men(a.units) + G.men(b.units) < 173, 'menos hombres que el ejército único de H13'); assert(G.men(a.units) < G.men(b.units) + 10);
    assert(s.cities.roma.units.hastati === 80 + D.LEVA_INICIAL.hastati, 'levas iniciales en Roma'); }
  const tex = D.EVENTS.find(e => e.k === 'pirro'); assert(/oleadas/.test(tex.lic)); }

// ---- H12 Capua se pasa a Aníbal en 216 si no está guarnecida (Livio 23.2-7; el umbral es licencia de juego) ----
{ assert.strictEqual(D.CAPUA_LEALTAD.hombres, 150); const e216 = D.EVENTS.find(e => e.y === 216); assert(e216.fx.split(',')[0] === 'capuaSePasa' && e216.fx.split(',')[1] === 'anibal2' && e216.lic);
  const a216 = (hombres, dueno, region) => { const s = G.newGame('C', region); s.marches = []; s.res.grano = 1e6; const c = s.cities.capua; if (dueno) c.owner = dueno; c.units = hombres ? { hastati: hombres } : {}; c.train = []; c.queue = null; s.hero.city = 'capua'; s.pending = []; s.t = (280 - 216) * 12 - 0.5; G.tick(1); return s; };
  const mock = () => { global.localStorage = { _: null, getItem() { return this._; }, setItem(k, x) { this._ = x; }, removeItem() {} }; };
  { const s = a216(0), c = s.cities.capua;   // (a) sin hombres: se pasa
    assert.strictEqual(G.yearOf(s.t), 216); assert.strictEqual(c.owner, 'cartago'); assert.deepStrictEqual(c.units, D.CITIES.capua.post.cartago); assert(!c.queue && c.train.length === 0);
    assert.strictEqual(G.ciudadE('capua'), null); assert(!G.myCities().includes('capua')); assert(!c.ciudad); assert.strictEqual(s.hero.city, 'roma');
    assert(s.log.some(l => /Capua, mal guarnecida, se pasa a Aníbal/.test(l.x || l.t || JSON.stringify(l))));
    assert(s.marches.some(m => m.label === 'Aníbal'), 'anibal2 sigue lanzándose');
    mock(); G.save(); assert(G.load()); assert.strictEqual(G.state.cities.capua.owner, 'cartago'); assert.strictEqual(G.ciudadE('capua'), null); G.tick(1); delete global.localStorage; }   // (d)
  { const s = a216(150), c = s.cities.capua;   // (b) con 150: resiste
    assert.strictEqual(c.owner, 'roma'); assert(s.log.some(l => /bien guarnecida, resiste a Aníbal/.test(JSON.stringify(l)))); }
  { const s = a216(149); assert.strictEqual(s.cities.capua.owner, 'cartago', '149 no basta'); }
  { const s = a216(0, 'campanos'); assert.strictEqual(s.cities.capua.owner, 'campanos'); assert(!s.log.some(l => /Capua, mal guarnecida|bien guarnecida/.test(JSON.stringify(l)))); }   // (c) ajena
  { assert(!D.REGIONES.italia.hechos.includes(216)); const s = G.newGame('I', 'italia'); s.marches = []; s.cities.capua.units = {}; s.t = (280 - 231) * 12 - 0.5; G.tick(1);   // (e) Italia no la toca
    assert.strictEqual(s.cities.capua.owner, 'roma'); }
}

// ---- H14 Poblado íbero: el nombre de Carthago Nova depende de la fecha ----
{ const ci = D.CITIES.carthagonova; assert.deepStrictEqual(ci.antes, { n: 'Poblado íbero', hasta: 228 });
  assert.strictEqual(D.nombreCiudad('carthagonova', 280), 'Poblado íbero'); assert.strictEqual(D.nombreCiudad('carthagonova', 229), 'Poblado íbero'); assert.strictEqual(D.nombreCiudad('carthagonova', 228), 'Carthago Nova'); assert.strictEqual(D.nombreCiudad('roma', 280), 'Roma');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, x) => { mem[k] = x; } };
  const s = G.newGame('H14'); assert.strictEqual(ci.n, 'Poblado íbero', 'en 280'); assert.strictEqual(typeof ci.n, 'string');
  s.t = (280 - 228) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1); assert.strictEqual(G.yearOf(s.t), 228); assert.strictEqual(ci.n, 'Carthago Nova', 'tras pasar 228'); assert(s.ev[D.EVENTS.findIndex(e => e.y === 228)]);
  G.save(); G.newGame('H14b'); assert.strictEqual(ci.n, 'Poblado íbero', 'una partida nueva vuelve a 280'); assert(G.load()); assert.strictEqual(ci.n, 'Carthago Nova', 'cargar una partida de 228'); assert.strictEqual(D.EVENTS.find(e => e.y === 228).t, 'Asdrúbal funda Carthago Nova');
  const v = G.newGame('H14c'); v.t = 10 * 12; G.save(); assert(G.load()); assert.strictEqual(ci.n, 'Poblado íbero', 'cargar una de 270'); assert.strictEqual(JSON.parse(JSON.stringify(ci)).n, 'Poblado íbero');
  G.newGame('H14d'); delete global.localStorage; }

// Q4b: varias obras según el nivel del foro
G.usarCiudad(CIMOD);
{ const s = G.newGame('Q4b'), c = s.cities.roma, ped = () => { for (const r of D.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; } }; G.state = s; ped();
  assert.deepStrictEqual(D.HUECOS_OBRA, [0, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4]);
  c.foroMin = 1; c.obras.length = 0; G.sincronizar('roma');
  const f0 = c.b.foro; assert.strictEqual(G.huecosObra(c), D.HUECOS_OBRA[f0], 'huecos según c.b.foro'); assert.strictEqual(G.huecos(c), G.huecosObra(c));
  if (G.huecosObra(c) === 1) {
    assert(G.upgrade('roma', 'granja')); assert.strictEqual(G.huecosLibres(c), 0);
    assert(!G.upgrade('roma', 'cantera') && G.ultimoMotivo === 'Ya hay una obra en curso en esta ciudad', 'motivo con un hueco: ' + G.ultimoMotivo);
    c.obras.length = 0; c.foroMin = f0 + 1; G.sincronizar('roma'); assert(c.b.foro >= f0 + 1 && G.huecosObra(c) > 1, 'sube con el foro');
  } else c.foroMin = Math.max(c.foroMin, 2);
  c.foroMin = 2; G.sincronizar('roma'); c.obras.length = 0; const h = G.huecosObra(c); assert(h >= 2);
  assert(G.upgrade('roma', 'granja') && G.upgrade('roma', 'cantera'), 'dos obras a la vez'); assert.strictEqual(c.obras.length, 2); assert(c.obras[0].b !== c.obras[1].b);
  assert(G.obraDe(c, 'granja') === c.obras[0] && !G.obraDe(c, 'mina'));
  assert(!G.upgrade('roma', 'granja') && G.ultimoMotivo === 'Ya se está mejorando', 'misma pieza dos veces: ' + G.ultimoMotivo);
  while (G.huecosLibres(c) > 0) { const bs = Object.keys(D.BUILD).filter(b => !G.obraDe(c, b) && !G.derivado(c, b) && !D.BUILD[b].sea && !D.BUILD[b].solar && (c.b[b] || 0) < D.MAX_LVL); assert(G.upgrade('roma', bs[0]), 'llena ' + bs[0]); }
  const libre = Object.keys(D.BUILD).find(b => !G.obraDe(c, b) && !G.derivado(c, b) && !D.BUILD[b].sea && (c.b[b] || 0) < D.MAX_LVL); assert(!G.upgrade('roma', libre) && G.ultimoMotivo === 'Sube el foro para otra obra', 'motivo con foro>1: ' + G.ultimoMotivo);
  // cuotas de todas; cuentas y comprometido suman todas
  const ob = c.obras.filter(q => q.nc > q.pag); assert(ob.length >= 2, 'varias obras con cuotas pendientes');
  const suma = {}; for (const q of ob) for (const r of D.RES) suma[r] = (suma[r] || 0) + ((G.cuotaSig(q)[r]) || 0);
  const pl = G.plazos(); const mesSig = ob.every(q => q.t1 > Math.floor(s.t + 1e-9) + 1); if (mesSig) for (const r of D.RES) assert.strictEqual(pl[r], suma[r], 'plazos suman todas ' + r);
  // obraMayor y adelantarObra
  const mayor = G.obraMayor(); assert(mayor && mayor.id && typeof mayor.i === 'number' && c.obras.includes(mayor.q));
  const tot = q => D.RES.reduce((a, r) => a + (G.cuotasRestantes(q)[r] || 0), 0); for (const q of c.obras) assert(tot(mayor.q) >= tot(q) || G.state.cities[mayor.id] !== c, 'obraMayor es la mayor');
  const antesPag = c.obras.map(q => q.pag); assert(G.adelantarObra('roma', 1)); assert.strictEqual(c.obras[1].pag, c.obras[1].nc); assert.strictEqual(c.obras[0].pag, antesPag[0], 'solo adelanta esa obra');
  // una se pausa sola si falta caja y la otra no (al cerrar el mes cada una paga su cuota)
  const lib = c.obras.filter(q => q.pag < q.nc); if (lib.length >= 2) {
    s.t = Math.floor(s.t) + 0.99; for (const q of c.obras) q.t1 = Math.max(q.t1, s.t + 5);
    const c0 = G.cuotaSig(lib[0]); for (const r of D.RES) { s.res[r] = 0; s.alm[r] = 0; s.cuarto[r] = 0; } for (const r in c0) { s.res[r] = c0[r] + 1; }
    const p1 = lib[0].pag, p2 = lib[1].pag; G.cierreMes(); assert.strictEqual(lib[0].pag, p1 + 1, 'la primera paga'); assert(lib[1].pausa && lib[1].pag === p2, 'la segunda se pausa sola'); }
  // terminan varias en un mismo tick sin saltarse ninguna
  { const s2 = G.newGame('Q4b2'), c2 = s2.cities.roma; G.state = s2; for (const r of D.RES) { s2.res[r] = 1e5; s2.alm[r] = 1e5; s2.cuarto[r] = 1e5; } c2.foroMin = 4; G.sincronizar('roma'); c2.obras.length = 0; assert.strictEqual(G.huecosObra(c2), 3);
    assert(G.upgrade('roma', 'granja') && G.upgrade('roma', 'cantera') && G.upgrade('roma', 'aserradero')); const l0 = [c2.b.granja, c2.b.cantera, c2.b.aserradero]; for (const q of c2.obras) { q.t1 = s2.t + 0.01; q.nc = 1; q.pag = 1; }
    G.tick(0.05); assert.strictEqual(c2.obras.length, 0, 'las tres terminan en el mismo tick'); assert([c2.b.granja, c2.b.cantera, c2.b.aserradero].every((x, i) => x > l0[i])); }
  // vaciar al conquistar
  { const s3 = G.newGame('Q4b3'); G.state = s3; const v = s3.cities.capua; v.obras.push({ b: 'granja', t0: 0, t1: 9, nc: 1, pag: 1, cuota: {}, costo: {}, pausa: false }, { b: 'cantera', t0: 0, t1: 9, nc: 1, pag: 1, cuota: {}, costo: {}, pausa: false });
    v.queue = null; assert.strictEqual(v.obras.length, 0, 'el alias null vacía la lista'); }
}
G.usarCiudad(null);

console.log('OK — todas las pruebas superadas');

// C6: zonas del mapa. Cada ciudad está en una sola zona y D.zonaDe la encuentra
{
  const cuenta = {}; for (const z in D.ZONAS) for (const id of D.ZONAS[z].ciudades) { assert(D.CITIES[id], 'zona ' + z + ': la ciudad ' + id + ' no existe'); cuenta[id] = (cuenta[id] || 0) + 1; }
  for (const id in D.CITIES) assert.strictEqual(cuenta[id], 1, id + ' debe estar en una sola zona');
  assert.strictEqual(D.zonaDe('roma'), 'italia'); assert.strictEqual(D.zonaDe('carthago'), 'africa'); assert.strictEqual(D.zonaDe('nada'), null);
  assert.strictEqual(Object.keys(D.ZONAS).length, 6, 'seis zonas');
  console.log('C6: zonas OK');
}

// ---- N15b: levas bisoñas, general con mando/disc, objetivo de batalla ----
{
  const s = G.newGame('N15b'); s.marches = []; s.pending = [];
  const c = s.cities.roma; c.units = { hastati: 100 }; c.levas = [{ u: 'hastati', n: 40, t: s.t - 2 }, { u: 'hastati', n: 30, t: s.t - 10 }];
  assert.strictEqual(G.fraccionBis('roma'), 0.4, 'solo cuentan las levas de menos de 6 meses'); assert.strictEqual(c.levas.length, 1, 'se podan las viejas');
  c.units = { hastati: 20, milicia: 500 }; assert.strictEqual(G.fraccionBis('roma'), 1, 'acotada a 1');
  c.units = {}; assert.strictEqual(G.fraccionBis('roma'), 0);
  c.units = { hastati: 100 }; c.levas = []; assert.strictEqual(G.fraccionBis('roma'), 0);
  // el reclutamiento apunta la leva al terminar
  c.res = c.res; s.res = { madera: 1e5, barro: 1e5, hierro: 1e5, trigo: 1e5, oro: 1e5 }; const antes = c.units.hastati;
  if (G.recruit && G.recruit('roma', 'hastati', 5)) { G.tick(24); assert(c.levas.some(l => l.u === 'hastati' && l.n === 5), 'leva apuntada'); }
  // general con mando/disc
  s.hero.city = 'roma'; s.hero.wound = 0;
  for (const k in D.CITIES) { const g = D.CITIES[k].gen; if (g) assert(typeof g.mando === 'number' && typeof g.disc === 'number', 'gen de ' + k); }
  const mk = (kind, mine, theirs, wall, hero) => { c.units = Object.assign({}, mine); c.levas = []; c.b.muralla = wall || 0; const t = s.cities.tarentum; t.owner = 'epiro'; t.units = Object.assign({}, theirs); t.b.muralla = wall || 0;
    const m = { id: 1, from: 'roma', to: kind === 'attack' ? 'tarentum' : 'roma', units: kind === 'attack' ? Object.assign({}, mine) : Object.assign({}, theirs), owner: 'epiro', hero: !!hero, gen: null };
    return G.battleInfo({ kind: kind, m: m }); };
  { const bi = mk('attack', { hastati: 100 }, { falange: 100 }, 0, true); assert.deepStrictEqual(Object.keys(bi.cfg.sides[0].gen).sort(), ['disc', 'lvl', 'mando', 'n']); assert.strictEqual(bi.cfg.objetivo, undefined, 'sin objetivo en el resto'); assert.strictEqual(bi.cfg.sides[1].bis, 0); }
  { const bi = mk('attack', { hastati: 10 }, { falange: 300 }, 0, true); assert.deepStrictEqual(bi.cfg.objetivo, { tipo: 'escapar', lado: 0 }); }
  { const bi = mk('attack', { hastati: 10 }, { falange: 300 }, 0, false); assert.strictEqual(bi.cfg.objetivo, undefined, 'sin héroe no se escapa'); }
  { const bi = mk('attack', { hastati: 300 }, { falange: 100 }, 3, true); assert.strictEqual(bi.cfg.objetivo.tipo, 'tomar'); assert.strictEqual(bi.cfg.objetivo.seg, 40); }
  { const bi = mk('defend', { hastati: 100 }, { falange: 300 }, 0, false); assert.deepStrictEqual(bi.cfg.objetivo, { tipo: 'resistir', lado: 0, rondas: 7 }); }
  { const bi = mk('defend', { hastati: 300 }, { falange: 100 }, 0, false); assert.strictEqual(bi.cfg.objetivo, undefined); }
  // bis del jugador entra en cfg
  c.units = { hastati: 100 }; c.levas = [{ u: 'hastati', n: 50, t: s.t }]; { const bi = G.battleInfo({ kind: 'defend', m: { id: 2, from: 'tarentum', to: 'roma', units: { falange: 10 }, owner: 'epiro', gen: null } }); assert.strictEqual(bi.cfg.sides[0].bis, 0.5); }
  // escapar no cuenta como victoria
  { const mkres = (esc) => ({ winner: 0, dead: [1, 1], lost: [{}, {}], surv: [{ hastati: 5 }, { falange: 5 }], genDead: [false, false], objetivo: { tipo: 'escapar', cumplido: true, fin: esc } });
    for (const esc of [true, false]) { const s2 = G.newGame('N15b2'); s2.marches = []; s2.pending = []; const t = s2.cities.tarentum; t.owner = 'epiro'; s2.hero.city = 'roma';
      s2.pending.push({ kind: 'attack', m: { id: 3, from: 'roma', to: 'tarentum', units: { hastati: 5 }, owner: 'roma', hero: true, mision: null } });
      const out = G.applyBattle(mkres(esc)); assert.strictEqual(out.win, !esc); assert.strictEqual(t.owner, esc ? 'epiro' : 'roma'); assert.strictEqual(out.lines.some(l => /escapó del campo/.test(l)), esc); } }
  // copia sin ciencia no sube
  { const s3 = G.newGame('N15b3'); s3.inv.copia = {}; const pb = { kind: 'attack' }, m = { to: 'tarentum' }, res = { dead: [500, 500] };
    const out = G.copiaActualiza(pb, m, res, 'epiro'); assert.strictEqual(G.copiaDe('epiro'), 0); assert.strictEqual(out.length, 0); }
  // sin levas ni objetivo, cfg igual que antes (sin campos nuevos de objetivo)
  { const bi = mk('defend', { hastati: 300 }, { falange: 100 }, 0, false); assert(!('objetivo' in bi.cfg)); }
  // (N15b) la cuña vale para elefantes y general
  { const bc = new Battle({ sides: [{ units: { equites: 20, elefantes: 3 }, gen: { n: 'G' }, name: 'a', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, { units: { hastati: 50 }, name: 'b', col: '#000', atkMul: 1, defMul: 1, mor: 0 }], defender: 1, wall: 0, seed: 1 });
    const ele = bc.regs.find(r => r.side === 0 && r.papel === 'elefante'), gen = bc.regs.find(r => r.side === 0 && r.k === 'general');
    assert(bc.formacionesPosibles(ele).indexOf('cuna') >= 0, 'elefantes en cuña'); assert(bc.formacionesPosibles(gen).indexOf('cuna') >= 0, 'general en cuña');
    assert(bc.formacionesPosibles(gen).indexOf('testudo') < 0, 'general sin testudo'); }
  // (N15b) batalla muy desigual (1,5x) acotada a 6 minutos de media y gana el mayor
  { let tt = 0, gan = 0; for (let sd = 1; sd <= 6; sd++) { const bd = new Battle({ sides: [{ units: { hastati: 480 }, name: 'a', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, { units: { hastati: 320 }, name: 'b', col: '#000', atkMul: 1, defMul: 1, mor: 0 }], defender: 1, wall: 0, seed: sd }); bd.finish(); const rd = bd.result(); tt += rd.time; if (rd.winner === 0) gan++; }
    assert(tt / 6 <= 360, 'desigual dura ' + Math.round(tt / 6) + ' s'); assert.strictEqual(gan, 6); }
  // (N15b) rondas sin órdenes con ventaja 1,5x: el jugador gana casi siempre
  { let g15 = 0; for (let sd = 1; sd <= 6; sd++) { const bs = new Battle({ sides: [{ units: { hastati: 360 }, gen: { n: 'C' }, name: 'a', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, { units: { hastati: 240 }, gen: { n: 'R' }, name: 'b', col: '#000', atkMul: 1, defMul: 1, mor: 0 }], defender: 1, wall: 0, seed: sd, rondas: true, terreno: 'llano' }); let gu = 0;
      while (!bs.over && gu++ < 90) { bs.ejecutar(); let k = 0; while (bs.fase === 'ejecucion' && !bs.over && k++ < 400) bs.step(0.1); } if (bs.over ? bs.winner === 0 : bs.men(0) > bs.men(1)) g15++; }
    assert(g15 >= 5, 'sin órdenes con ventaja 1,5x gana ' + g15 + '/6'); }
  console.log('N15b: levas, general y objetivo OK');
}
// CN5: colonias. Enviar colonos, llegada, fundar, 12 meses, guardar/cargar en cada fase, newGame limpio, partida vieja sin colonias
{
  G.usarCiudad(CIMOD);
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const ids = Object.keys(D.COLONIAS), n0 = Object.keys(D.CITIES).length;
  assert(ids.length >= 6, 'D.COLONIAS trae 6 sitios o más');
  const s = G.newGame('Colonias'); const sitio = 'cosa';
  assert.deepStrictEqual(G.coloniasLibres().sort(), ids.slice().sort(), 'al empezar todos los sitios están libres');
  assert(ids.every(i => !D.CITIES[i]) && Object.keys(D.CITIES).length === n0, 'los sitios no están en D.CITIES');
  assert.strictEqual(G.lugar(sitio).n, 'Cosa'); assert(G.pos(sitio)[0] > 0 && G.edge('roma', sitio) && G.travel('roma', sitio) >= 0.5, 'pos/edge/travel aceptan un sitio');
  assert.strictEqual(G.send('roma', sitio, { hastati: 1 }), false, 'un ejército no marcha a un sitio vacío');
  s.res.grano = 1000; s.res.oro = 1000; s.cities.roma.pop = 500;
  const antes = { g: G.disponible('grano'), o: G.disponible('oro'), p: s.cities.roma.pop };
  assert.strictEqual(G.puedeEnviarColonos('roma', 'noexiste').ok, false);
  const e = G.enviarColonos('roma', sitio); assert(e.ok, e.motivo);
  assert.strictEqual(s.colonias[sitio].estado, 'camino'); assert.strictEqual(G.disponible('grano'), antes.g - G.COLONOS.grano); assert.strictEqual(G.disponible('oro'), antes.o - G.COLONOS.oro); assert.strictEqual(s.cities.roma.pop, antes.p - G.COLONOS.pop);
  const m = s.marches.find(q => q.colonos); assert(m && m.mision === 'colonia' && m.to === sitio && m.owner === 'roma', 'marcha de colonos');
  assert.strictEqual(G.enviarColonos('roma', sitio).ok, false, 'no se envía dos veces'); assert.strictEqual(G.coloniasLibres().length, ids.length - 1);
  const ciclo = () => { G.save(); const a = JSON.stringify(G.state.colonias); assert(G.load()); assert.strictEqual(JSON.stringify(G.state.colonias), a, 'las colonias sobreviven a guardar y cargar'); };
  ciclo(); assert.strictEqual(G.state.marches.filter(q => q.colonos).length, 1, 'los colonos en marcha se guardan');
  const evs = []; G.onEvent = (t, p) => evs.push(t);
  let g = 0; while (G.state.colonias[sitio].estado === 'camino' && g++ < 60) G.tick(1);
  const s2 = G.state; assert.strictEqual(s2.colonias[sitio].estado, 'pendiente', 'los colonos llegan'); assert(!s2.pending.length, 'sin batalla'); assert(evs.includes('colonos'));
  assert(G.consejo().some(l => /Los colonos han llegado a Cosa/.test(l.x)), 'el consejo avisa'); assert.deepStrictEqual(G.coloniasPendientes(), [sitio]);
  assert(!s2.cities[sitio] && !D.CITIES[sitio], 'aún no es ciudad'); ciclo();
  const mala = G.fundarColonia(sitio, 0, -430); assert.strictEqual(mala.ok, false, 'no se funda en el agua o fuera de rango'); assert(mala.motivo);
  assert(G.notaFundar(sitio, 172, -196).vale && G.mapaCalorFundar(sitio).length > 100, 'nota y mapa de calor');
  assert.strictEqual(G.MISION_TIPOS.colonia.cumple(G.state, { n: 1 }), false);
  const f = G.fundarColonia(sitio, 172, -196); assert(f.ok, f.motivo);
  const s3 = G.state; assert.strictEqual(s3.colonias[sitio].estado, 'fundada'); assert(D.CITIES[sitio] && G.myCities().includes(sitio), 'cuenta en G.myCities');
  assert(G.neighbors(sitio).length, 'la colonia tiene rutas'); assert(G.MISION_TIPOS.colonia.cumple(s3, { n: 1 }));
  const E = G.ciudadE(sitio); assert(E && E.fundada && CIMOD.casas(E).length >= 20 && E.puertas.length >= 2, 'nace con foro, calles, puertas y chozas');
  { const bi = G.barrioInfo(G.state.cities[sitio]); assert(bi.barrios.length >= 1 && bi.barrios[0].nivel === 1 && bi.barrios[0].casas >= 20 && bi.nivel === 1, 'CN6: la colonia fundada tiene sus barrios (nivel I)'); }
  ciclo(); assert(D.CITIES[sitio] && G.state.cities[sitio].owner === 'roma' && G.ciudadE(sitio).fundada, 'fundada tras cargar');
  const r0 = G.state.cities[sitio].pop; assert(r0 > 0);
  G.state.res.madera = 2000; G.state.res.piedra = 2000; G.state.res.hierro = 2000; G.state.res.grano = 2000; const pAntes = G.prod().madera; assert(G.upgrade(sitio, 'aserradero'), 'la colonia puede construir: ' + G.ultimoMotivo);
  for (let i = 0; i < 12; i++) G.tick(1);
  assert(G.myCities().includes(sitio) && !G.state.over, 'a los 12 meses sigue siendo tuya'); assert(G.state.cities[sitio].b.aserradero >= 1 && G.prod().madera > pAntes, 'la colonia produce madera (' + pAntes + ' → ' + G.prod().madera + ')'); assert(G.state.cities[sitio].pop >= r0 * 0.8, 'vive');
  ciclo(); assert.strictEqual(G.enviarColonos('roma', sitio).ok, false);
  G.state.res.grano = 1000; G.state.res.oro = 1000; G.state.cities.roma.pop = Math.max(G.state.cities.roma.pop, 500);
  assert(G.enviarColonos('roma', 'ariminum').ok); ciclo(); g = 0; while (G.state.colonias.ariminum.estado === 'camino' && g++ < 60) G.tick(1);
  assert.strictEqual(G.state.colonias.ariminum.estado, 'pendiente'); ciclo(); assert(G.ciudadPendiente('ariminum')); ciclo();
  G.newGame('Limpia'); assert(Object.keys(D.CITIES).length === n0 && !D.CITIES[sitio], 'newGame quita las colonias fundadas'); assert.strictEqual(G.coloniasFundadas(), 0); assert.strictEqual(G.coloniasLibres().length, ids.length);
  assert(!D.EDGES.some(e => e[0] === sitio || e[1] === sitio), 'sin aristas de colonias');
  { const raw = require('fs').readFileSync(__dirname + '/partida-vieja.json', 'utf8'); assert(!JSON.parse(raw).colonias); global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} };
    assert(G.load()); assert.strictEqual(G.coloniasLibres().length, ids.length); assert.strictEqual(G.coloniasFundadas(), 0); assert(ids.every(i => G.state.colonias[i].estado === 'libre')); }
  G.newGame('Bot'); for (let i = 0; i < 24; i++) G.tick(1); assert.strictEqual(G.coloniasLibres().length, ids.length, 'nada envía colonos solo');
  G.newGame('Fin'); delete global.localStorage; G.onEvent = null; G.usarCiudad(null);
  console.log('CN5: colonias OK (enviar, llegar, fundar, 12 meses, guardar/cargar, newGame, partida vieja)');
}

// ---------- CN6: el nivel de la ciudad sale de sus barrios ----------
{ G.usarCiudad(CIMOD);
  assert.strictEqual(CIMOD.RETRASO_BARRIO, D.BARRIO_RETRASO, 'una sola cifra de retraso');
  const s = G.newGame('CN6'), c = s.cities.roma; G.state = s; G.convertir('roma'); const E = G.ciudadE('roma'),   /* Roma sin plantilla: la prueba parte de una ciudad pelada */ cierra = () => { s.t = Math.floor(s.t) + 1; G.cierreMes(); };
  const pon = id => { const q = CIMOD.mejorSitio(E, id); const r = q && CIMOD.colocar(E, id, q[0], q[1], true); if (r && r.ok) r.e.obra = 0; E.rev++; return !!(r && r.ok); };
  let bi = G.barrioInfo(c); assert(bi.barrios.length === 1 && bi.barrios[0].nivel === 1 && bi.nivel === 1 && bi.barrios[0].falta === 'agua (una fuente)', 'empieza con un barrio de nivel I');
  assert(/^Barrio del Foro · nivel I/.test(bi.barrios[0].texto) && bi.barrios[0].texto === CIMOD.textoBarrio(E, 0));
  // sube de uno en uno aunque el objetivo sea IV
  assert(pon('fuente') && pon('templo') && pon('mercado')); assert.strictEqual(CIMOD.nivelBarrio(E, 0).nivel, 4, 'objetivo IV');
  assert(/subirá pronto/.test(CIMOD.textoBarrio(E, 0)) && G.barrioInfo(c).barrios[0].objetivo === 4);
  const sube = []; for (let i = 0; i < 4; i++) { CIMOD.mes(E); sube.push(E.barrios[0].nivel); } assert.deepStrictEqual(sube.slice(0, 3), [2, 3, 4], 'sube un nivel por mes'); assert.strictEqual(sube[3], 4);
  // segundo barrio con casas propias y otro nivel: la ciudad es la media por casas, redondeada
  E.barrios.push({ nombre: 'Barrio Prueba', corto: 'Prueba', x: 0, z: 0, tipo: 'compitum', nivel: 1, bdef: 0 });
  const cs = E.parcelas.filter(l => l.casa && !l.fuera); const n1 = Math.floor(cs.length / 4); cs.slice(0, n1).forEach(l => { l.barrio = 1; }); E.rev++;
  const nb = G.barrioInfo(c).barrios; assert.strictEqual(nb.length, 2); assert.strictEqual(nb[1].casas, n1); assert.strictEqual(nb[0].casas, cs.length - n1);
  E.barrios[0].nivel = 4; E.barrios[1].nivel = 1; E.rev++; const media = Math.round((4 * (cs.length - n1) + 1 * n1) / cs.length);   // 3/4 de las casas en nivel 4: media 3,25 = 3
  assert.strictEqual(media, 3); assert.strictEqual(G.nivelDeBarrios(c), 3, 'nivel de ciudad = media ponderada redondeada'); assert.notStrictEqual(nb[0].nivel, nb[1].nivel, 'dos barrios, dos niveles');
  E.barrios[0].nivel = 2; E.barrios[1].nivel = 1; E.rev++; assert.strictEqual(G.nivelDeBarrios(c), 2, '1,75 -> 2'); E.barrios[0].nivel = 1; E.rev++; assert.strictEqual(G.nivelDeBarrios(c), 1);
  // los servicios de la ciudad recortan: sin lujo no hay Urbs
  E.barrios[0].nivel = 4; E.barrios[1].nivel = 4; E.rev++; assert.strictEqual(G.nivelDeBarrios(c), 3, 'sin lujo no pasa de III');
  // c.barrio sale de los barrios al cerrar el mes, y de ahí popCap, impuestos y Dar ciudadanía
  E.barrios[0].nivel = 2; E.barrios[1].nivel = 2; E.rev++; G.state.t = Math.floor(s.t) + 1; s.t = Math.floor(s.t) + 1; G.cierreMes(); const b2 = E.barrios.map(b => b.nivel);
  assert(c.barrio >= 2 && c.barrio === G.barrioInfo(c).nivel, 'c.barrio = media de los barrios: ' + c.barrio + ' de ' + b2);
  c.pop = 300; s.res.oro = 500; s.alm.oro = 0; c.barrio = 1; assert(G.motivoCiudadania(c), 'barrio I no puede'); c.barrio = 2; assert.strictEqual(G.motivoCiudadania(c), null, 'barrio 2 puede dar ciudadanía');
  const base = G.popCap(c); c.barrio = 4; assert(Math.abs(G.popCap(c) - base / 1.25 * 1.8) <= 1, 'popCap de Urbs x1,8'); assert.strictEqual(D.BARRIO[4].imp, 1.15, 'impuestos de Urbs x1,15'); c.barrio = 2;
  // retraso de 3 meses POR BARRIO: el que pierde servicios baja tras 3; el otro no se entera
  E.barrios[1].nivel = 4; E.barrios[0].nivel = 1; E.barrios[0].bdef = 0; E.barrios[1].bdef = 0; E.edificios.forEach(e => { if (e.tipo === 'fuente') e.ruina = true; }); E.rev++;
  const ob1 = CIMOD.nivelBarrio(E, 1).nivel; assert(ob1 < 4 && CIMOD.nivelBarrio(E, 0).nivel >= 1);
  CIMOD.mes(E); CIMOD.mes(E); assert.strictEqual(E.barrios[1].nivel, 4, 'a los 2 meses sigue igual'); assert.strictEqual(E.barrios[1].bdef, 2); assert.strictEqual(G.barrioInfo(c).barrios[1].meses, 1);
  assert(/bajará en 1 mes\b/.test(CIMOD.textoBarrio(E, 1)), CIMOD.textoBarrio(E, 1)); CIMOD.mes(E); assert.strictEqual(E.barrios[1].nivel, 3, 'al tercer mes baja un nivel'); assert.strictEqual(E.barrios[1].bdef, 0);
  // rehacer la ciudad desde semilla y acciones da los mismos niveles
  { const s6 = G.newGame('CN6b'), E1 = G.ciudadE('roma'); const q = CIMOD.mejorSitio(E1, 'fuente'); const r = CIMOD.colocar(E1, 'fuente', q[0], q[1], true); r.e.obra = 0; E1.rev++;
    for (let i = 0; i < 5; i++) { s6.t = Math.floor(s6.t) + 1; G.cierreMes(); } const antes = E1.barrios.map(b => [b.nivel, b.bdef]), cb = s6.cities.roma.barrio;
    const sa = JSON.parse(JSON.stringify(s6)); global.localStorage = { getItem: () => JSON.stringify(sa), setItem: () => {}, removeItem: () => {} }; assert(G.load());
    assert.deepStrictEqual(G.ciudadE('roma').barrios.map(b => [b.nivel, b.bdef]), antes, 'mismos niveles de barrio al rehacer desde semilla y acciones'); assert.strictEqual(G.state.cities.roma.barrio, cb); delete global.localStorage; }
  // partida vieja real: carga y c.barrio sale de los barrios rehechos
  { const raw = require('fs').readFileSync(__dirname + '/partida-vieja.json', 'utf8'); global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} };
    assert(G.load(), 'carga'); const cr = G.state.cities.roma; assert(cr.barrio >= 1 && cr.barrio <= 4 && G.barrioInfo(cr).barrios.length >= 1, 'la partida vieja trae su barrio calculado'); delete global.localStorage; }
  G.usarCiudad(null);
  console.log('CN6: barrios OK (media, retraso por barrio, ciudadanía, popCap, partida vieja, colonia)'); }

// ---------- CN7: la guerra lee la muralla de la fase ----------
{ G.usarCiudad(CIMOD);
  const s = G.newGame('CN7'); G.state = s; const c = s.cities.roma, E = G.ciudadE('roma'); assert(E, 'Roma tiene ciudad nueva');
  const nivel = f => { E.muralla.fase = f; delete E.muralla.nivel; E.rev++; return G.nivelMuralla(c); };
  assert([0, 1, 2].map(nivel).join() === '0,3,6', 'fases 0, 3 y 6'); assert(G.faseMuralla(c) === 2);
  const bot = f => { nivel(f); return G.botin('roma').madera; };
  const b0 = bot(0), b2 = bot(2); assert(b2 < b0, 'el botín baja con muralla de piedra: ' + b2 + ' < ' + b0);
  nivel(2); const bi = G.battleInfo({ kind: 'defend', m: { id: 1, to: 'roma', from: 'capua', owner: 'cartago', units: { libios: 100 }, mision: 'saqueo' } }); assert(bi.cfg.wall === 6, 'wall 6 en la defensa');
  nivel(0); assert(G.battleInfo({ kind: 'defend', m: { id: 1, to: 'roma', from: 'capua', owner: 'cartago', units: { libios: 100 }, mision: 'saqueo' } }).cfg.wall === 0);
  assert(G.faseMuralla({ owner: 'cartago', b: { muralla: 2 } }) === 1 && G.faseMuralla({ owner: 'cartago', b: { muralla: 5 } }) === 2 && G.nivelMuralla({ owner: 'cartago', b: { muralla: 5 } }) === 5, 'enemigas: fase por wl');
  // partida vieja: c.b.muralla = 5 -> fase 2 y nivel 5
  const raw = JSON.parse(JSON.stringify(s)); delete raw.cities.roma.ciudad; raw.cities.roma.b.muralla = 5;
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } }; localStorage.setItem('aqvila-save-v1', JSON.stringify(raw));
  assert(G.load()); const E2 = G.ciudadE('roma'); assert(E2.muralla.fase === 2 && E2.muralla.nivel === 5 && G.nivelMuralla(G.state.cities.roma) === 5, 'partida vieja con muralla 5 conserva su defensa');
  G.save(); assert(G.load() && G.nivelMuralla(G.state.cities.roma) === 5, 'y sigue igual tras guardar y cargar'); delete global.localStorage;
  console.log('CN7: muralla por fases OK (tabla, botín, wall, partida vieja)'); G.usarCiudad(null); }

// CN9a: Roma y Capua en pie con plantilla; conquistada conserva cultura; enemiga bajo demanda fuera del guardado
{
  G.usarCiudad(CIMOD);
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const t0 = Date.now(); const s = G.newGame('CN9a'); const tN = Date.now() - t0;
  const Er = G.ciudadE('roma'), Ec = G.ciudadE('capua');
  assert(Er && Ec && Er.cultura === 'roma' && Er.tinte === 'roma' && Ec.cultura === 'roma' && Ec.tinte === 'campanos', 'Roma y Capua nacen con plantilla (cultura y tinte)');
  assert(CIMOD.poblacion(Er) > 0 && CIMOD.poblacion(Ec) > 0 && s.cities.roma.plantilla && s.cities.capua.plantilla, 'nacen con población');
  assert(Er.mesN === Math.floor(s.t + 1e-9) + 9, 'el calendario de la plantilla alinea con la partida');
  for (const id of ['roma', 'capua']) { const c = s.cities[id], b = G.edificiosBase(id, D.CITIES[id].w, D.CITIES[id].wl);
    for (const k of ['granja', 'aserradero', 'cantera', 'mina', 'almacen', 'cuartel', 'muralla']) assert.strictEqual(c.b[k], b[k], id + ' ' + k + ': ' + c.b[k] + ' vs ' + b[k]);
    assert(c.pop > 0 && c.pop <= G.popCap(c), id + ' población ' + c.pop + ' dentro del tope'); }
  const huella = id => JSON.stringify([G.ciudadE(id).edificios.map(e => [e.tipo, e.mejora || 0, Math.round(e.x), Math.round(e.z)]), CIMOD.poblacion(G.ciudadE(id)), G.state.cities[id].pop]);
  const h1 = huella('roma') + huella('capua'), t1 = Date.now(); G.newGame('CN9a'); const tM = Date.now() - t1;
  assert.strictEqual(huella('roma') + huella('capua'), h1, 'newGame dos veces: misma ciudad'); console.log('CN9a newGame: 1ª ' + tN + ' ms, 2ª ' + tM + ' ms');
  // conquistadas: griega y púnica conservan cultura tras guardar y cargar
  G.newGame('CN9a'); G.state.t = 3;
  for (const [id, cu] of [['tarentum', 'grie'], ['carthago', 'cart']]) { const c = G.state.cities[id]; c.owner = D.CITIES[id].f; G.incorporar(c, {}, true); const E = G.ciudadE(id); assert(E && E.cultura === cu && c.ciudad && c.ciudad.cultura === cu, id + ' conquistada con cultura ' + cu); }
  const antes = ['tarentum', 'carthago'].map(id => G.ciudadE(id).edificios.length + '|' + CIMOD.poblacion(G.ciudadE(id)));
  G.save(); assert(G.load()); ['tarentum', 'carthago'].forEach((id, i) => { const E = G.ciudadE(id); assert(E.cultura === (i ? 'cart' : 'grie') && E.edificios.length + '|' + CIMOD.poblacion(E) === antes[i], id + ' conserva cultura y piezas tras cargar'); });
  { const c = G.state.cities.volsinii; c.owner = D.CITIES.volsinii.f; c.b.templo = 2; c.b.herreria = 2; c.b.puerto = 1; G.incorporar(c, {}, true); G.ciudadE('volsinii');
    assert(c.b.templo >= 2 && c.b.herreria >= 2, 'la conquistada conserva los niveles de edificio que traía (templo ' + c.b.templo + ', herrería ' + c.b.herreria + ')'); }
  // enemiga bajo demanda: idéntica y fuera del guardado
  const tam0 = JSON.stringify(G.state).length, e1 = G.ciudadEnemiga('syracusae'), e2 = G.ciudadEnemiga('syracusae');
  assert(e1 && e1 === e2 && e1.cultura === 'grie' && e1.edificios.length > 0, 'ciudadEnemiga idéntica dos veces');
  assert.strictEqual(JSON.stringify(G.state).length, tam0, 'la enemiga no crece el guardado'); assert.strictEqual(G.ciudadEnemiga('roma'), null); assert.strictEqual(G.ciudadEnemiga('nada'), null);
  assert.strictEqual(CIMOD.nivelMuralla(e1), G.nivelMuralla(G.state.cities.syracusae), 'muralla enemiga coincide con la de la batalla');
  const vj = require('fs').readFileSync(__dirname + '/partida-vieja.json', 'utf8'); store['aqvila-save-v1'] = vj; assert(G.load() && G.ciudadE('roma'), 'partida vieja carga y convierte');
  delete global.localStorage; G.usarCiudad(null); console.log('CN9a: plantillas, conquistada, enemiga y partida vieja OK');
}
{ // CN14-B: ajustes de partida (dificultad, sucesos, asesor)
  const fs = require('fs'), CIM = require('../js/ciudad.js'); G.usarCiudad(CIM);
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const snap = () => JSON.stringify(G.myCities().map(id => [id, G.state.cities[id].pop, G.state.cities[id].ciudad]));
  const vj = JSON.parse(fs.readFileSync(__dirname + '/partida-vieja.json', 'utf8')); delete vj.ajustes; store['aqvila-save-v1'] = JSON.stringify(vj);
  assert(G.load()); let a = G.ajustes(); assert(a.dif === 'normal' && a.asesor === false && a.suc.crecida && a.suc.fuego && a.suc.hambre && a.hist.length === 0 && a.v === 0, 'partida vieja migra a Normal sin asesor');
  G.migrarAjustes(G.state); assert.deepStrictEqual(G.ajustes(), a, 'migrar es idempotente');
  const sN = G.newGame('Test', 'mediterraneo'); const nor = snap(); assert(G.avisoMeses() === 3 && G.ajustes().asesor === true, 'Normal avisa a 3 meses; asesor por defecto');
  const sD = G.newGame('Test', 'mediterraneo', { dificultad: 'dura' }); assert(sD.ajustes.dif === 'dura' && G.avisoMeses() === 2); assert(snap() === nor, 'Roma y Capua nacen igual con dificultad dura');
  assert(G.sucesosEn(0).dif === 'normal' && G.sucesosEn(9999).dif === 'dura'); assert(G.newGame('T', 'mediterraneo', { dificultad: 'rara' }).ajustes.dif === 'normal');
  const v0 = G.ajustes().v, h0 = G.ajustes().hist.length;
  for (const mal of [{ dif: 'x' }, { suc: { crecida: 1 } }, { suc: { lluvia: true } }, { asesor: 'si' }]) assert(!G.ponerAjustes(mal).ok, 'rechaza ' + JSON.stringify(mal));
  assert.deepStrictEqual([G.ajustes().v, G.ajustes().hist.length], [v0, h0], 'lo rechazado no cambia nada');
  assert(G.ponerAjustes({ asesor: false }).ok && G.ajustes().hist.length === h0 && G.ajustes().asesor === false);
  // guardar/cargar con crecida apagada y un cambio a mitad: la ciudad no cambia
  G.ponerAjustes({ suc: { crecida: false } }); for (let i = 0; i < 30; i++) G.tick(0.25); G.ponerAjustes({ dif: 'tranquila' }); for (let i = 0; i < 30; i++) G.tick(0.25);
  const antes = snap(), hist = JSON.stringify(G.ajustes().hist); G.save(); assert(G.load()); assert.strictEqual(snap(), antes, 'cargar da la misma ciudad'); assert.strictEqual(JSON.stringify(G.ajustes().hist), hist);
  assert(G.sucesosEn(G.state.ajustes.hist[G.state.ajustes.hist.length - 1][0]).on.crecida === false);
  delete global.localStorage; G.usarCiudad(null); console.log('CN14-B: ajustes, migración y reproducibilidad OK (consejo del granero: solo en ui.js, para la captura)');
}
{ // I8-a: «Partida corta» (D.MODOS.corta): datos, fundar de la nada, equilibrio del bot, duración, final, campaña intacta y migración
  const fs = require('fs'); G.usarCiudad(CIMOD); { const c0 = JSON.parse(CIUDADES_0); for (const id in c0) if (D.CITIES[id]) for (const k of ['g', 'w', 'wl', 'f', 'post', 'en228']) if (c0[id][k] !== undefined) D.CITIES[id][k] = c0[id][k]; }
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const M = D.MODOS.corta, du = M.duracion, sitio = M.inicio.fundar.sitio;
  assert(D.MODOS.campana && M.id === 'corta' && M.region === 'italia' && M.edades === 3 && D.REGIONES[M.region], 'D.MODOS: campaña y corta');
  assert(D.COLONIAS[sitio] && D.CITIES[M.capitalRival] && D.FACTIONS[M.rival] && D.CITIES[M.capitalRival].f === M.rival, 'el sitio, la capital rival y el rival existen');
  assert.strictEqual(du.segPorTurno, du.segReloj + du.segDecision, 'segPorTurno = reloj + decisión'); assert.strictEqual(du.segReloj, 3 * 4, 'el reloj de un turno: 3 meses a 4 s/mes');
  assert(M.hasta < D.START_YEAR && /\{anio\}/.test(M.final.gana) && /\{anio\}/.test(M.final.pierde) && /\{hasta\}/.test(M.final.agota), 'textos finales con sus huecos');

  // (c) campaña histórica intacta: sin modo (o con 'campana') la partida es la de siempre
  { const a = JSON.stringify(G.newGame('Igual', 'italia')), sa = G.state, b = JSON.stringify(G.newGame('Igual', 'italia', { modo: 'campana' }));
    assert.strictEqual(a, b, "modo 'campana' = sin modo, bit a bit"); assert.strictEqual(sa.modo, null); assert.strictEqual(sa.capital, undefined);
    assert(G.modo() === null && G.modoFase() === null && !G.fundando() && G.factor('instr') === 1 && G.factor('guarnicion') === 1 && G.hasta() === 230 && G.capital() === 'roma' && G.edadMax() === 4 && G.capitalRival() === 'tarentum', 'sin modo todo vale como antes');
    G.newGame('M'); assert(G.hasta() === D.END_YEAR && G.capitalRival() === 'carthago', 'Mediterráneo intacto'); }

  // arranque «en pie»
  { const s = G.newGame('Pie', null, { modo: 'corta', inicio: 'enPie' });
    assert.deepStrictEqual(s.modo, { id: 'corta', inicio: 'enPie', fase: 'jugando' }); assert.strictEqual(s.region, 'italia'); assert.strictEqual(s.capital, 'roma'); assert.deepStrictEqual(G.myCities().sort(), ['capua', 'roma']);
    assert(G.modo() === M && G.hasta() === 232 && G.factor('instr') === 1.6 && G.factor('saber') === 1 && G.edadMax() === 3 && !G.fundando());
    assert(G.bonoMul('instr') > 0 && G.factor('guarnicion') === 3 && s.cities.tarentum.units.falange === Math.round(D.CITIES.tarentum.g.falange * 3), 'el rival parte con la guarnición del modo'); }
  // arranque «fundar de la nada»
  { const s = G.newGame('Nada', null, { modo: 'corta', inicio: 'fundar' });
    assert.deepStrictEqual(s.modo, { id: 'corta', inicio: 'fundar', fase: 'fundando' }); assert(G.fundando() && G.modoFase() === 'fundando');
    assert.deepStrictEqual(G.myCities(), [], 'sin ciudad'); assert(!s.cities.roma && !s.cities.capua && s.cities.tarentum && s.cities.volsinii, 'ni Roma ni Capua; el resto de Italia sí');
    assert.strictEqual(s.colonias[sitio].estado, 'pendiente'); assert.deepStrictEqual(G.coloniasPendientes(), [sitio]); assert.strictEqual(s.hero.city, null); assert.strictEqual(s.capital, undefined);
    const t0 = s.t; G.tick(1); G.tick(0.25); assert.strictEqual(s.t, t0, 'el tiempo no corre hasta fundar'); assert(!s.over && !s.pending.length && G.pasarTurno() === false);
    assert(G.prod() && G.cap() === 0 && G.consejo() !== undefined, 'nada se rompe sin ciudades');   // G.consejo lee la partida
    G.save(); assert(G.load()); assert(G.fundando() && G.state.colonias[sitio].estado === 'pendiente' && G.myCities().length === 0, 'guardar y cargar antes de fundar');
    assert.strictEqual(G.fundarColonia(sitio, 0, -430).ok, false); assert(G.fundando(), 'un intento fallido no arranca la partida');
    let pt = null; for (let x = -300; x <= 300 && !pt; x += 20) for (let z = -300; z <= 300 && !pt; z += 20) if (G.notaFundar(sitio, x, z).vale) pt = [x, z];
    const f = G.fundarColonia(sitio, pt[0], pt[1]); assert(f.ok, f.motivo); const s2 = G.state;
    assert(!G.fundando() && s2.modo.fase === 'jugando' && s2.capital === sitio && s2.hero.city === sitio && G.capital() === sitio && G.myCities().join() === sitio, 'fundada: capital, héroe y fase jugando');
    assert(G.neighbors(sitio).includes(M.capitalRival) && !G.neighbors(sitio).some(n => !s2.cities[n]), 'la colonia llega a Tarento y a ningún lugar ausente');
    const t1 = s2.t; for (let i = 0; i < 8; i++) G.tick(0.25); assert(s2.t > t1 && !s2.over, 'ya corre el tiempo');
    G.save(); assert(G.load()); assert(G.state.modo.fase === 'jugando' && G.state.capital === sitio && G.myCities().join() === sitio, 'guardar y cargar tras fundar'); }
  // sin la ciudad nueva no se puede fundar: cae a «en pie» (la interfaz siempre la tiene)
  { G.usarCiudad(null); assert.strictEqual(G.newGame('S', null, { modo: 'corta', inicio: 'fundar' }).modo.inicio, 'enPie'); G.usarCiudad(CIMOD); }

  // edades: el tope del modo
  { const s = G.newGame('Ed', null, { modo: 'corta' }); s.inv.edad = 3; const r = G.edadUp(); assert(!r.ok && /última edad/.test(r.motivo), 'tope de 3 edades en la corta'); assert(G.invEstado('E4').e === 'edad');
    const c = G.newGame('Ed2', 'italia'); c.inv.edad = 3; assert(G.edadMax() === 4 && G.invEstado('E4').e !== 'edad', 'la campaña sigue llegando a la edad IV'); }

  // (a)+(b) el bot agresivo y el pasivo juegan la corta, en 10 semillas y en los dos inicios; se mide la duración
  const horas = s => s.over.resumen.turnos * du.segPorTurno / 3600, tabla = [], todas = { agr: [], pas: [] };
  for (const ini of ['enPie', 'fundar']) for (const ag of [true, false]) {
    const l = []; for (let sd = 1; sd <= 10; sd++) {
      const s = campaign(ag, sd, null, { modo: 'corta', inicio: ini }); l.push(s); todas[ag ? 'agr' : 'pas'].push(s);
      assert(s.over && s.over.resumen && s.over.resumen.modo === 'corta' && s.over.resumen.inicio === ini && s.over.resumen.turnos > 0 && Math.abs(s.over.resumen.horas - horas(s)) < 0.01, 'resumen del final');
      assert(['ciudades', 'fundadas', 'batallas', 'bajasEnemigas', 'bajasPropias', 'edad', 'anio', 'victorias'].every(k => typeof s.over.resumen[k] === 'number'), 'el resumen trae los datos de la pantalla final');
      const dentro = new Set(D.regionCiudades('italia', true)); for (const id in s.cities) assert(dentro.has(id), 'ciudad fuera de la región: ' + id);
      assert(s.region === 'italia' && s.inv.edad <= 3, 'región e edades de la corta');
      if (ini === 'fundar') assert(!('roma' in s.cities) && !('capua' in s.cities) && s.capital === sitio, 'fundar: sin Roma ni Capua y capital = primera colonia');
      assert(!/\{/.test(s.over.why), 'el texto final no deja huecos sin rellenar: ' + s.over.why);
      if (s.over.win) assert(/Tarento ha caído en \d+ a\.C\./.test(s.over.why) && s.over.resumen.ciudades >= 2, 'victoria = capital rival tomada'); else assert(/capital ha caído|Tarento sigue libre/.test(s.over.why), 'derrota: capital perdida o año tope');
    }
    const w = l.filter(s => s.over.win), hs = l.map(horas), hw = w.map(horas);
    tabla.push([ini, ag ? 'agresivo' : 'pasivo', w.length + '/10', hw.length ? Math.min(...hw).toFixed(2) + '-' + Math.max(...hw).toFixed(2) + ' h' : '-', (hs.reduce((a, b) => a + b, 0) / 10).toFixed(2) + ' h', l.map(s => (s.over.win ? 'V' : 'd') + G.yearOf(s.t)).join(' ')]);
    if (ag) assert(w.length >= 6, 'partida corta ' + ini + ': el agresivo gana la mayoría (' + w.length + '/10)'); else assert.strictEqual(w.length, 0, 'partida corta ' + ini + ': el pasivo no gana nunca');
    for (const x of hw) assert(x >= du.horasMin && x <= du.horasMax, 'una victoria en ' + ini + ' dura ' + x.toFixed(2) + ' h, fuera de ' + du.horasMin + '-' + du.horasMax + ' h');
    for (const x of hs) assert(x <= du.horasMax, 'ninguna partida pasa de ' + du.horasMax + ' h (' + x.toFixed(2) + ' h)');
  }
  console.log('Partida corta (' + du.segPorTurno + ' s por turno):'); for (const f of tabla) console.log('  ' + f[0].padEnd(7) + f[1].padEnd(9) + 'gana ' + f[2].padEnd(6) + 'victorias ' + f[3].padEnd(15) + 'media ' + f[4] + '  ' + f[5]);
  assert(todas.agr.some(s => !s.over.win), 'el agresivo debe poder perder alguna'); assert(todas.agr.some(s => s.over.win && s.over.resumen.edad >= 1));

  // (d) migración: partida vieja = campaña; una corta guarda y carga igual
  { const raw = fs.readFileSync(__dirname + '/partida-vieja.json', 'utf8'); assert(JSON.parse(raw).modo === undefined); store['aqvila-save-v1'] = raw;
    assert(G.load()); assert.strictEqual(G.state.modo, null); assert(G.modo() === null && G.capital() === 'roma' && G.edadMax() === 4 && !G.fundando(), 'partida vieja = campaña');
    const m = G.migrarModo; const raro = { modo: { id: 'inventada' }, cities: {}, colonias: {} }; m(raro); assert.strictEqual(raro.modo, null, 'modo desconocido = campaña');
    const s = G.newGame('Guarda', null, { modo: 'corta', inicio: 'enPie' }); for (let i = 0; i < 12; i++) G.tick(0.25); const antes = JSON.stringify({ m: s.modo, c: s.capital, t: s.t, ci: G.myCities() });
    G.save(); assert(G.load()); assert.strictEqual(JSON.stringify({ m: G.state.modo, c: G.state.capital, t: G.state.t, ci: G.myCities() }), antes, 'la corta guarda y carga igual'); assert(G.modo() === M);
    delete G.state.modo.fase; G.state.modo.inicio = 'rara'; G.migrarModo(G.state); assert(G.state.modo.inicio === 'enPie' && G.state.modo.fase === 'jugando', 'migrarModo repara un modo estropeado'); }
  delete global.localStorage; G.onEvent = null; G.usarCiudad(null);
  console.log('I8-a: partida corta OK (datos, fundar, equilibrio del bot, duración 2-4 h, final, campaña intacta, migración)');
}
{ // CN13a: arca del foro, ofrenda, juegos, ración y granero (bucles cortos)
  const CIM = require('../js/ciudad.js'); G.usarCiudad(CIM);
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const s = G.newGame('Fiestas', 'mediterraneo'), c = s.cities.roma;
  assert(c.fiesta && c.fiesta.ofrenda === -99 && c.rac === 'normal', 'newGame trae c.fiesta y c.rac');
  // coste = múltiplo del ingreso bruto mensual (foro + impuestos), con mínimo fijo; baja con menos ingreso
  c.pop = 4000; c.imp = 'alto'; const pa = G.prod(), ia = pa.det.foro + pa.det.impuestos, ca = G.fiestaCoste('juegos');
  assert.strictEqual(ca, Math.max(D.FIESTAS.juegos.min, Math.round(D.FIESTAS.juegos.mult * ia)), 'coste = múltiplo del ingreso');
  c.imp = 'bajo'; const pb = G.prod(), cb = G.fiestaCoste('juegos'); assert(pb.det.impuestos < pa.det.impuestos && cb < ca, 'con menos ingreso, la fiesta cuesta menos (' + cb + ' < ' + ca + ')');
  c.pop = 0; c.imp = 'normal'; assert(G.fiestaCoste('ofrenda') >= D.FIESTAS.ofrenda.min && G.fiestaCoste('juegos') >= D.FIESTAS.juegos.min, 'mínimo fijo');
  // sin templo y sin oro no se puede
  assert(G.fiestaInfo('roma', 'ofrenda').motivo, 'ofrenda sin templo: no se puede'); assert(!G.hacerFiesta('roma', 'ofrenda'));
  s.res.oro = 0; s.alm.oro = 0; s.cuarto.oro = 0; assert(/oro/i.test(G.fiestaInfo('roma', 'juegos').motivo) && !G.hacerFiesta('roma', 'juegos'), 'juegos sin oro');
  assert.strictEqual(G.fiestaInfo('capua', 'juegos').motivo !== null || s.cities.capua.owner === 'roma', true);
  // juegos: efecto en favor, inquietud, felicidad y reposo
  s.res.oro = 900; c.inq = 8; const f0 = G.favor().pueblo, fel0 = G.felicidadBase(c), oro0 = s.res.oro, co = G.fiestaInfo('roma', 'juegos').coste;
  assert(G.hacerFiesta('roma', 'juegos'), 'hace los juegos'); assert.strictEqual(oro0 - s.res.oro, co, 'cobra su coste en oro');
  assert(G.favor().pueblo > f0 && c.inq === 8 - D.FIESTAS.juegos.inq && G.felicidadBase(c) === fel0 + D.FIESTAS.juegos.fel, 'favor, inquietud y felicidad');
  let fi = G.fiestaInfo('roma', 'juegos'); assert(fi.activa && fi.quedan >= 1 && fi.reposo > 0 && fi.motivo, 'activa y en reposo'); assert(!G.hacerFiesta('roma', 'juegos'), 'no se repite en reposo');
  s.t += D.FIESTAS.juegos.dura + 0.1; assert(!G.fiestaInfo('roma', 'juegos').activa && G.felicidadBase(c) === fel0, 'el efecto acaba'); s.t += D.FIESTAS.juegos.reposo; assert(!G.fiestaInfo('roma', 'juegos').motivo, 'tras el reposo se puede');
  // ofrenda: con templo; duplica el don de Ceres un mes; se paga con grano / lo que sobra
  c.b.templo = 2; c.dios = 'ceres'; s.res.grano = 800; const g0 = G.prod().grano, gr0 = s.res.grano;
  fi = G.fiestaInfo('roma', 'ofrenda'); assert(!fi.motivo && fi.pago && fi.pago.grano > 0, 'ofrenda pagable con grano: ' + JSON.stringify(fi));
  assert(G.hacerFiesta('roma', 'ofrenda') && s.res.grano < gr0, 'la ofrenda gasta'); assert(G.diosNivel(c) === 4 && G.prod().grano > g0 - D.FIESTAS.ofrenda.min, 'duplica el nivel del dios'); assert(G.prod().grano > g0 - 100);
  assert.strictEqual(G.ciudadE('roma').fiesta, 'ofrenda', 'E.fiesta marca la ofrenda'); assert(!G.hacerFiesta('roma', 'ofrenda'), 'una al mes');
  s.t += 1.1; assert.strictEqual(G.diosNivel(c), 2, 'tras un mes el don vuelve a su nivel');
  // el arca y los campos de pantalla
  s.res.madera = G.cap() * 2; const ar = G.arca('roma'); assert(ar.nivel >= 1 && ar.nivel <= 4 && ar.sobra.madera > 0 && ar.oro > 0 && ar.cap === G.cap() && ar.pct >= 0, 'arca ve lo que se perderá'); assert.strictEqual(G.ciudadE('roma').arca, ar.nivel);
  const pagoArca = G.fiestaPago('ofrenda', 100); assert(pagoArca && pagoArca.madera > 0, 'la ofrenda se paga con lo que sobra');
  const E = G.ciudadE('roma'); assert(E.mendigos >= 0 && E.mendigos <= 8 && E.arca >= 0 && E.arca <= 4);
  // ración: baja el consumo de grano
  s.res.madera = 0; c.pop = 400; const cm = G.prod().comida; assert(G.setRacion('roma', 'escasa') && !G.setRacion('roma', 'x')); const cm2 = G.prod().comida; assert(cm2 < cm, 'ración escasa gasta menos'); c.rac = 'normal';
  // granero
  const gi = G.graneroInfo('roma'); assert(gi.pct >= 0 && gi.pct <= 100 && typeof gi.invierno === 'boolean' && typeof gi.hambre === 'boolean' && (gi.meses === null || gi.meses >= 0), 'graneroInfo');
  s.res.grano = 0; s.alm.grano = 0; assert.strictEqual(G.graneroInfo('roma').hambre, G.prod().grano < 0, 'hambre = sin grano y consumo mayor que producción');
  // guardar y cargar con fiesta y ración
  s.res.oro = 900; s.t += 6; G.hacerFiesta('roma', 'juegos'); c.rac = 'escasa'; G.save(); assert(G.load()); const c2 = G.state.cities.roma;
  assert(c2.fiesta.juegos === c.fiesta.juegos && c2.rac === 'escasa' && G.fiestaActiva(c2, 'juegos'), 'c.fiesta y c.rac sobreviven a guardar y cargar');
  delete c2.fiesta; delete c2.rac; store['aqvila-save-v1'] = JSON.stringify(G.state); assert(G.load() && G.state.cities.roma.fiesta.juegos === -99 && G.state.cities.roma.rac === 'normal', 'partida vieja sin c.fiesta/c.rac migra');
  delete global.localStorage; G.usarCiudad(null); console.log('CN13a: arca, ofrenda, juegos, ración y granero OK');
}
{   // NB7: batalla nueva conectada con la campaña, tribunos-generales e interruptor (test/nb7.test.mjs)
  const r = require('child_process').spawnSync(process.execPath, [__dirname + '/nb7.test.mjs'], { encoding: 'utf8', timeout: 120000 });
  assert(r.status === 0, 'NB7: ' + String(r.stdout).split('\n').filter(l => /^MAL/.test(l)).join(' | ') + String(r.stderr).slice(0, 300)); console.log('NB7: batalla nueva, tribunos e interruptor OK');
}
{ // CN13b: dique y techado de barrio por la API del juego, y guardar/cargar por G.load
  const CIM = require('../js/ciudad.js'); G.usarCiudad(CIM);
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const s = G.newGame('Tejas', 'mediterraneo'), c = s.cities.roma; for (const r of ['madera', 'piedra', 'hierro', 'grano', 'oro']) { s.res[r] = 5000; s.alm[r] = 0; }
  let E = G.ciudadE('roma'), t = G.techoInfo('roma', 0); assert(E.abiertas.includes('dique'), 'Roma tiene el dique en la bandeja');
  assert(t.coste && t.coste.madera > 0 && t.plazo === CIM.TECHO_MESES && !t.motivo && t.casas > 0, 'techoInfo trae coste y plazo: ' + JSON.stringify(t));
  assert(!G.techoInfo('no', 0).coste === true || G.techoInfo('no', 0).motivo, 'solo en tus ciudades'); assert(G.techoInfo('roma', 99).motivo, 'barrio inexistente');
  const m0 = s.res.madera; assert(G.techarBarrio('roma', 0), 'techar el barrio'); assert(s.res.madera < m0, 'cobra'); E = G.ciudadE('roma');
  assert(typeof E.barrios[0].tejas === 'number' && E.barrios[0].tejas === E.mesN + CIM.TECHO_MESES, 'plazo en meses'); assert(!G.techarBarrio('roma', 0) && /marcha/.test(G.techoInfo('roma', 0).motivo), 'no se repite');
  assert(c.ciudad.acciones.some(a => a.a === 'j' && a.i === 0), 'la acción va al diario guardado');
  // dique por la cola de obras del juego
  let sitio = null; for (const e of [E]) sitio = CIM.mejorSitio(e, 'dique'); assert(sitio, 'hay sitio para el dique'); const rd = G.colocar('roma', 'dique', sitio[0], sitio[1]); assert(rd.ok, 'dique encargado: ' + JSON.stringify(rd));
  const ped = () => { for (const r of D.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; } };
  assert(c.obras.some(o => o.pieza === 'dique'), 'el dique está en la cola de obras'); hasta(c, ped); G.state.pending.length = 0; E = G.ciudadE('roma'); assert(E.edificios.some(e => e.tipo === 'dique' && !e.obra) || c.obras.length === 0, 'el dique se termina');
  const tej = E.barrios[0].tejas, nE = E.edificios.length, ark = JSON.stringify(c.ciudad.acciones);
  G.save(); assert(G.load(), 'carga'); const c2 = G.state.cities.roma, E2 = G.ciudadE('roma');
  assert(E2.barrios[0].tejas === tej, 'el techado sobrevive a G.load'); assert(E2.edificios.some(e => e.tipo === 'dique') && E2.edificios.length === nE, 'el dique sobrevive a G.load'); assert(JSON.stringify(c2.ciudad.acciones) === ark, 'mismo diario');
  // partida vieja: sin tejas ni marcas
  const F = JSON.parse(JSON.stringify(G.state)); F.cities.roma.ciudad.acciones = F.cities.roma.ciudad.acciones.filter(a => a.a !== 'j' && !(a.a === 'c' && a.tipo === 'dique')); store['aqvila-save-v1'] = JSON.stringify(F); assert(G.load(), 'carga vieja');
  const E3 = G.ciudadE('roma'); assert(E3.barrios[0].tejas === undefined && Array.isArray(E3.marcas), 'sin tejas ni marcas: valores por defecto');
  delete global.localStorage; G.usarCiudad(null); console.log('CN13b: techado, dique, guardar y cargar OK');
}
{ // J3: pueblos satélite de cada capital
  const s = G.newGame('Pueblos'); G.turnos = false; G.state = s; const c = s.cities.roma;
  assert(G.esCapital('roma') && c.pueblos.length === D.CITIES.roma.pueblos.length && c.pueblos.every(n => n === 0) && c.pobra === null, 'estado inicial: todo a 0');
  for (const id in D.CITIES) { const n = D.CITIES[id].pueblos.length; assert(n >= 2 && n <= 4, id + ': 2 a 4 huecos'); assert(s.cities[id].pueblos.length === n); }
  const ag = D.CITIES.roma.pueblos.indexOf('agricolas'), p0 = G.prod(), cap0 = G.popCap(c), m0 = G.mantenimiento().total;
  assert(G.puebloOk('roma', ag), 'se puede fundar'); s.res.madera = s.res.piedra = s.res.grano = s.res.oro = 1000; s.alm.madera = s.alm.piedra = s.alm.grano = 1000;
  const c1 = G.puebloCoste('roma', ag), r0 = s.res.madera + s.alm.madera; assert(G.puebloMejorar('roma', ag), 'se funda'); assert(s.res.madera + s.alm.madera < r0, 'cuesta');
  assert(!G.puebloMejorar('roma', ag) && !G.puebloOk('roma', ag), 'una obra de pueblo a la vez'); assert(G.pueblosDe('roma')[ag].obra, 'obra en curso');
  s.pending.length = 0; G.tick(0.01); assert.strictEqual(c.pueblos[ag], 0, 'tarda');
  s.t = c.pobra.t1; G.tick(0.01); assert.strictEqual(c.pueblos[ag], 1, 'termina en el tick'); assert(c.pobra === null);
  const c2 = G.puebloCoste('roma', ag), t1 = G.puebloTiempo('roma', ag); assert(c2.madera > c1.madera && t1 > D.PUEBLO_TIPOS.agricolas.time, 'el siguiente nivel cuesta y tarda más');
  const pp = G.puebloProd('roma'); assert(pp.grano > 0 && pp.madera === 0, 'produce grano'); assert(G.prod().grano > p0.grano, 'G.prod lo suma');
  assert(G.puebloPop('roma') === D.PUEBLO_TIPOS.agricolas.pop && G.popCap(c) === cap0 + D.PUEBLO_TIPOS.agricolas.pop, 'sube la población máxima');
  assert(Math.abs(G.mantenimiento().total - m0 - D.MANT_EDIF * 0.5) < 1e-9, 'mantenimiento por nivel');
  assert(G.pueblosResumen().n === 1 && G.pueblosResumen().niveles === 1);
  c.pueblos[ag] = D.PUEBLO_MAX; assert(!G.puebloOk('roma', ag) && !G.puebloMejorar('roma', ag), 'no pasa del nivel máximo');
  // pescadores solo con mar
  const sinMar = Object.keys(D.CITIES).filter(id => !D.CITIES[id].sea), conMar = Object.keys(D.CITIES).filter(id => D.CITIES[id].sea);
  assert(sinMar.every(id => D.CITIES[id].pueblos.indexOf('pescadores') < 0), 'ciudades sin costa no tienen pescadores'); assert(conMar.some(id => D.CITIES[id].pueblos.indexOf('pescadores') >= 0));
  const f0 = D.CITIES.volsinii.pueblos.slice(); D.CITIES.volsinii.pueblos[0] = 'pescadores'; s.cities.volsinii.owner = 'roma'; assert(!G.puebloOk('volsinii', 0), 'pescadores sin mar: no'); D.CITIES.volsinii.pueblos = f0;
  assert(!G.puebloOk('syracusae', 0), 'ciudad ajena no se funda');
  const pes = D.CITIES.tarentum.pueblos.indexOf('pescadores'); s.cities.tarentum.owner = 'roma'; s.cities.tarentum.pueblos[pes] = 2; const pt = G.puebloProd('tarentum'); assert(pt.grano > 0 && pt.oro > 0, 'pescadores dan grano y oro');
  // partida vieja
  const v = JSON.parse(JSON.stringify(s)); for (const id in v.cities) { delete v.cities[id].pueblos; delete v.cities[id].pobra; } G.migrarPueblos(v);
  assert(v.cities.roma.pueblos.length === D.CITIES.roma.pueblos.length && v.cities.roma.pueblos.every(n => n === 0) && v.cities.roma.pobra === null, 'migración de partida vieja'); G.state = s; }
