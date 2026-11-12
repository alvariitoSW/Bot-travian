/* Pruebas sin navegador: node test/sim.test.js */
const assert = require('assert');
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const G = require('../js/game.js');

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

// 2b. Ritmo (A8): una batalla igualada dura entre 8 y 12 minutos de juego
for (const sd of [1, 2, 3, 4]) {
  const q = fight({ hastati: 200 }, { libios: 200 }, { seed: sd });
  assert(q.time >= 480 && q.time <= 720, 'igualada 200 vs 200 (semilla ' + sd + '): ' + Math.round(q.time) + ' s');
  const m = fight({ hastati: 300, velites: 60, equites: 40 }, { libios: 265, numidas: 52, jinetes: 33 }, { seed: sd });
  assert(m.time >= 480 && m.time <= 720, 'igualada mixta (semilla ' + sd + '): ' + Math.round(m.time) + ' s');
  assert(fight({ hastati: 300, velites: 60, equites: 40 }, { milicia: 100 }, { seed: sd }).time > 90, 'la desigual no dura segundos');
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
function campaign(aggressive, seed) {
  const rndOrig = Math.random; if (seed) Math.random = mulberry32(seed);
  try { return campaign1(aggressive); } finally { Math.random = rndOrig; }
}
function campaign1(aggressive) {
  const s = G.newGame('Test'); const events = [];
  G.onEvent = (t, p) => { events.push(t); if (process.env.V && t === 'log' && /⚠|🔥|🏆|💀|rechaza|📜/.test(p.x)) console.log('  ', G.yearOf(s.t), p.x); };
  const dist = { carthago: 0 }; for (let q = ['carthago'], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  let guard = 0;
  while (!s.over && guard++ < 200000) {
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); if (process.env.DBG) console.log(G.yearOf(s.t), JSON.stringify(info.cfg.sides.map(x => x.units)), 'def', info.cfg.defender, 'wall', info.cfg.wall, '->', b.result().winner, Math.round(b.t)); G.applyBattle(b.result()); }
    if (guard % 8) continue;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      if (!c.queue) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'acueducto', 'termas', 'anfiteatro'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); for (const b of bs) if (G.upgrade(id, b)) break; }
      if (!aggressive) continue;
      const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;   // el bot se atrinchera ante la invasión de Aníbal
      // concentración: las tropas avanzan por la ruta más corta hacia Carthago mientras la siguiente plaza sea romana
      const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
      if (id !== 'carthago' && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === "roma" ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === 'roma' ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { G.send(id, n, u, G.heroAvailable(id)); break; }
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
// Acueducto, termas y anfiteatro: tope de población y felicidad
{ const s = G.newGame('Edif'), c = s.cities.roma; const cap0 = G.popCap(c), f0 = G.felicidad(c);
  assert(c.b.acueducto === 0 && c.b.termas === 0 && c.b.anfiteatro === 0, 'empiezan a nivel 0');
  c.b.acueducto = 1; assert.strictEqual(G.popCap(c), cap0 + 40, 'acueducto +40 de población'); c.b.acueducto = 0;
  c.b.termas = 1; assert.strictEqual(G.popCap(c), cap0 + 15, 'termas +15 de población'); assert.strictEqual(G.felicidad(c), f0 + 4, 'termas +4 de felicidad'); c.b.termas = 0;
  c.b.anfiteatro = 1; assert.strictEqual(G.felicidad(c), f0 + 6, 'anfiteatro +6 de felicidad');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  for (const id in s.cities) for (const b of ['acueducto', 'termas', 'anfiteatro']) delete s.cities[id].b[b];
  localStorage.setItem('aqvila-save-v1', JSON.stringify(s));
  assert(G.load() && G.state.cities.roma.b.termas === 0 && G.state.cities.volsinii.b.anfiteatro === 0, 'una partida vieja sin estos edificios carga'); }
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
  s.t = (280 - 264) * 12 - 0.5; G.tick(1);
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
  D.EVENTS.forEach(e => assert.strictEqual(CO.hechos.find(f => f.id === String(e.y)).t, e.t, 'Códice: título de ' + e.y)); }

// ---- I4 Solares y tipos de ciudad ----
{ const urb = Object.keys(D.BUILD).filter(b => D.BUILD[b].solar);
  assert.strictEqual(urb.length, 12, '12 edificios urbanos'); ['aserradero', 'cantera', 'mina', 'granja', 'muralla'].forEach(b => assert(!D.BUILD[b].solar, b + ' no ocupa solar'));
  const s = G.newGame('Solares'), c = s.cities.roma; s.res = { madera: 1e5, piedra: 1e5, hierro: 1e5, grano: 1e5, oro: 1e5 };
  assert.strictEqual(G.solares('roma'), 10); assert.strictEqual(G.solares('carales'), 8); for (const id in D.CITIES) assert(G.solares(id) < 12, 'ninguna ciudad tiene los 12 solares');
  const libres = G.solaresLibres('roma'); assert(libres > 0 && G.solaresUsados(c) === 10 - libres);
  // llenar todos los solares: ya no se levanta un edificio urbano nuevo, pero sí se mejora uno existente y se levantan campos
  for (const b of urb) { if (G.solaresUsados(c) >= 10) break; c.b[b] = Math.max(c.b[b] || 0, 1); }
  const sin = urb.find(b => !(c.b[b] > 0)); assert.strictEqual(G.solaresUsados(c), 10); assert(sin, 'queda un edificio sin levantar');
  assert(!G.upgrade('roma', sin) && !c.queue, 'sin solares no se levanta ' + sin);
  assert(G.upgrade('roma', 'viviendas'), 'mejorar uno levantado no gasta solar'); c.queue = null;
  assert(G.upgrade('roma', 'granja'), 'los campos no ocupan solar'); c.queue = null;
  // derribar libera el solar; el foro no se derriba; lo que se está mejorando tampoco
  c.b.almacen = 2; const antes = G.solaresUsados(c); assert(G.derribar('roma', 'almacen') && c.b.almacen === 0 && G.solaresUsados(c) === antes - 1, 'derribar libera el solar');
  assert(!G.derribar('roma', 'foro') && !G.derribar('roma', 'granja') && !G.derribar('roma', 'almacen'), 'no se derriba foro, campos ni lo que no existe');
  assert(G.upgrade('roma', sin) && c.b[sin] === 0, 'con el solar libre se levanta el nuevo'); assert(!G.derribar('roma', sin), 'no se derriba en obras');
  c.queue = null; c.b.viviendas = 6; c.pop = G.popCap(c); G.derribar('roma', 'viviendas'); assert(c.pop <= G.popCap(c), 'la población se recorta al tope');
  // una ciudad con más edificios que solares no pierde nada
  const cap = s.cities.capua; for (const b of urb) cap.b[b] = 1; assert.strictEqual(G.solaresUsados(cap), 12); assert(!G.upgrade('capua', 'foro') === false, 'mejorar sigue valiendo'); }
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
  const g0 = G.prod().grano; c.b.templo = 0; c.b.templo = 2; assert(G.prod().grano > g0 + 0.5, 'Ceres sube el grano'); const f2 = G.felicidad(c); c.b.templo = 0; assert(f2 - G.felicidad(c) === 6, 'templo +3 de felicidad por nivel');
  c.b.templo = 1; assert(!G.elegirDios('roma', 'marte'), 'con templo levantado no se cambia de dios');
  assert(!G.elegirDios('carthago', 'marte'), 'una ciudad ajena no elige dios'); }
{ const s = G.newGame('Rebeldes'); const o = Object.keys(s.cities).find(i => s.cities[i].owner === 'cartago' && !D.CITIES[i].sea) || Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma');
  const c = s.cities[o]; c.owner = 'roma'; c.prev = 'cartago'; c.inq = D.INQ_MESES; c.units = { hastati: 10 }; c.pop = G.popCap(c);
  const cc = G.felicidad(c); assert(cc >= D.INQ_REBELION, 'felicidad normal no rebela'); G.tick(0.5); assert(c.owner === 'roma' && c.inq < D.INQ_MESES, 'la inquietud baja con el tiempo');
  const i1 = c.inq; c.b.templo = 3; c.dios = 'marte'; G.tick(0.5); assert(G.inqMul(c) < 1 && G.inqMul(c) >= 1 - D.INQ_PROD);
  c.imp = 'alto'; c.b.templo = 0; assert(G.felicidad(c) < D.INQ_REBELION); c.inq = D.INQ_MESES; G.tick(0.25); assert(c.owner !== 'roma' && c.inq === 0, 'con felicidad baja la ciudad conquistada se rebela'); }
{ const s = G.newGame('Vieja5'); s.cities.roma.b.templo = 2; delete s.cities.roma.dios; delete s.cities.roma.inq; delete s.evN; localStorage.setItem('aqvila-save-v1', JSON.stringify(s)); assert(G.load()); assert(G.state.cities.roma.dios === 'marte' && G.state.cities.roma.inq === 0, 'migración del templo antiguo'); }
// ---- B7 Saqueo ----
{ const s = G.newGame('Saqueo'); const o = 'volsinii', c = s.cities[o]; s.res = { madera: 100, piedra: 100, hierro: 100, grano: 100, oro: 100 };
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
  assert.strictEqual(v.cities.roma.queue.nc, 1); assert.strictEqual(v.cities.roma.queue.pag, 1); assert.strictEqual(v.cities.roma.train[0].pag, 1); assert.strictEqual(v.obrasMes, 0); G.state = v; G.plazos(); G.cuentas();
}
// Barrios (P67)
{ const s = G.newGame('Barrio'), c = s.cities.roma; G.state = s;
  const cierra = () => { s.t = Math.floor(s.t) + 1; G.cierreMes(); };
  assert.strictEqual(c.barrio, 1); assert.strictEqual(c.bdef, 0); assert.strictEqual(G.barrioInfo(c).nivel, 1);
  s.cities.capua && assert.strictEqual(s.cities.capua.barrio, 1, 'ciudad incorporada empieza en 1');
  const cap1 = G.popCap(c); const pr = () => G.prod().oro;
  c.b.templo = 1; assert(G.prod().grano >= 0, 'grano neto >= 0'); assert.deepStrictEqual(G.barrioInfo(c).falta, []); assert.strictEqual(G.barrioInfo(c).objetivo, 2);
  const oro1 = pr(); cierra(); assert.strictEqual(c.barrio, 2, 'sube a Villa'); assert.strictEqual(G.popCap(c), Math.round(cap1 * 1.25), 'popCap x1,25');
  assert(G.popCap(c) > cap1, 'popCap sube'); assert.strictEqual(G.barrioInfo(c).objetivo, 2);
  assert.deepStrictEqual(G.barrioInfo(c).falta.sort(), ['agua', 'ocio']);
  c.b.acueducto = 1; assert.strictEqual(G.barrioInfo(c).objetivo, 2, 'sin ocio no hay Ciudad'); c.b.anfiteatro = 1; assert.strictEqual(G.barrioInfo(c).objetivo, 3);
  cierra(); assert.strictEqual(c.barrio, 3);
  assert.deepStrictEqual(G.barrioInfo(c).falta.sort(), ['lujo', 'termas']); c.b.termas = 1; assert.deepStrictEqual(G.barrioInfo(c).falta, ['lujo']);
  assert.strictEqual(G.barrioInfo(c).objetivo, 3, 'Urbs pide lujo');
  // impuestos: factor del nivel (Urbs x1,15)
  c.barrio = 3; const o3 = pr(); c.barrio = 4; const o4 = pr(); assert(o4 > o3, 'impuestos suben en Urbs'); c.barrio = 3;
  // bajar: tarda BARRIO_RETRASO meses; recuperar reinicia
  c.b.anfiteatro = 0; assert.strictEqual(G.barrioInfo(c).objetivo, 2); assert.strictEqual(G.barrioInfo(c).meses, D.BARRIO_RETRASO);
  cierra(); cierra(); assert.strictEqual(c.barrio, 3); assert.strictEqual(c.bdef, 2); c.b.anfiteatro = 1; cierra(); assert.strictEqual(c.bdef, 0); assert.strictEqual(c.barrio, 3, 'recuperar no baja');
  c.b.anfiteatro = 0; for (let i = 0; i < D.BARRIO_RETRASO; i++) cierra(); assert.strictEqual(c.barrio, 2, 'baja tras el retraso'); assert.strictEqual(c.bdef, 0);
  // migración de partida vieja
  const st = {}; global.localStorage = { getItem: () => JSON.stringify(st.s), setItem() {} };
  const v = JSON.parse(JSON.stringify(s)); for (const id in v.cities) { delete v.cities[id].barrio; delete v.cities[id].bdef; } v.cities.roma.b.templo = 1; v.cities.roma.b.acueducto = 0; v.cities.roma.b.anfiteatro = 0;
  st.s = v; assert(G.load(), 'carga'); assert.strictEqual(G.state.cities.roma.barrio, 2, 'migra al objetivo'); assert.strictEqual(G.state.cities.roma.bdef, 0);
  for (const id in G.state.cities) assert(G.state.cities[id].barrio >= 1);
  delete global.localStorage; }


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
  c.pop = 300; c.ciu = 0; c.esc = 40; c.b.templo = 1; s.res.grano = 5000; s.alm.grano = 5000; c.imp = 'normal';
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
  { const daño = (carta) => { const c = mkN(), g = c.regs.find(r => r.k === 'general' && r.side === 0), r = propios(c)[0], e = c.regs.find(q => q.side === 1); pon(g, 300, 600); pon(r, 300, 580); if (carta) c.jugarCarta(carta); c.ejecutar(); const m = r.men; c.hit(e, r, 600, false); return m - r.men; };
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
  // ancho variable: por defecto 1200; 1500 con más de 700 hombres; cfg.fw manda; mínimo 600
  assert.strictEqual(mk('llano').W, 1200, 'ancho por defecto');
  assert.strictEqual(new Battle({ sides: [side({ hastati: 500 }), side({ libios: 400 })], defender: 1, wall: 0, seed: 1 }).W, 1500, 'ejército grande: campo de 1500');
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

console.log('OK — todas las pruebas superadas');
