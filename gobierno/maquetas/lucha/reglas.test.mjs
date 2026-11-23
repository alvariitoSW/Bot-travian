/* Pruebas de «Lucha a pie» (segunda versión): reglas con tres bots, ningún gesto perdido y los dedos con eventos simulados.
   Uso: node gobierno/maquetas/lucha/reglas.test.mjs */
import { crear, paso, rival, N, NUM, RACHA } from './reglas.js';
import { crearDedos } from './dedos.js';

const DT = 1 / 30;
function corre(bot, semilla, tope) {
  const S = crear(semilla), M = { hechos: {} };
  while (S.t < tope && !S.fin) {
    const pide = bot(S, M), H = paso(S, DT, pide);
    for (const h of H) M.hechos[h.tipo] = (M.hechos[h.tipo] || 0) + 1;
  }
  return { t: S.t, fin: S.fin, caidos: S.caidos, heridas: S.yo.heridas, hechos: M.hechos };
}

/* «loco»: toca sin parar (estocada en cada fotograma) */
const loco = () => ({ gestos: ['estocada'] });

/* «quieto delante»: se pega y no retrocede; golpea cuando puede y alza el escudo cuando ve venir el golpe */
const quieto = S => {
  const y = S.yo, g = rival(S);
  if (y.dist < 2) return { gestos: y.mov || y.acc ? [] : ['adelante'] };
  const arma = g && g.estado === 'arma' && g.dur - g.t < 0.2;
  return { gestos: !arma && !y.acc && y.aliento > 30 ? ['estocada'] : [], escudo: arma };
};

/* «bueno»: a media distancia; para limpio, golpea al abierto por el lado que marca la flecha, empuja y cede antes de que lo rodeen */
const bueno = (S, M) => {
  const y = S.yo, g = rival(S), libre = !y.mov && !y.acc && !y.pend;
  const lados = S.cols.map(c => c.frente).filter(k => k && k.contraYo && k.estado === 'arma');
  if (y.fila === 2) return { gestos: y.aliento > 90 && libre ? ['adelante'] : [] };
  if (y.aliento < 20 && libre) return { gestos: ['atras'] };                       /* sin aliento: atrás (dos veces lejos: a la segunda fila) */
  if (lados.length && lados[0].dur - lados[0].t < 0.2) return { gestos: [], escudo: true };
  if (!g || g.estado === 'cae' || g.estado === 'llega') {                          /* sin rival: busca uno */
    if (g && g.estado === 'llega') return { gestos: [] };
    let mejor = null; for (let c = 0; c < N; c++) if (S.cols[c].frente && S.cols[c].frente.estado !== 'cae' && (mejor === null || Math.abs(c - y.puesto) < Math.abs(mejor - y.puesto))) mejor = c;
    return { gestos: mejor !== null && libre ? [mejor < y.puesto ? 'izq' : 'der'] : [] };
  }
  if (!libre) return { gestos: [] };
  if (y.dist === 2) return { gestos: ['atras'] };
  const queda = g.estado === 'arma' ? g.dur - g.t : 9;
  if (g.estado === 'arma') return { gestos: [], escudo: queda < 0.2 };            /* para limpio */
  const abre = 'tajo-' + (g.lado === 'izq' ? 'der' : 'izq');
  if (g.estado === 'abierto' || g.estado === 'encaja' || g.estado === 'deseq') return { gestos: [y.racha >= RACHA ? 'estocada' : y.aliento > 30 ? abre : 'estocada'] };
  if (g.estado === 'guardia' && y.aliento > 70 && g.dur - g.t > 0.5) return { gestos: [y.aliento > 90 ? 'empujon' : abre] };
  return { gestos: [] };
};

let mal = 0, suma = 0;
const ok = (c, txt) => { console.log((c ? 'bien ' : 'MAL  ') + txt); if (!c) mal++; };
for (const sem of [1, 2, 3, 7, 11]) {
  const a = corre(loco, sem, 60), b = corre(bueno, sem, 60), c = corre(quieto, sem, 60); suma += b.t;
  ok(a.caidos < b.caidos / 2, `loco (semilla ${sem}): ${a.fin || 'en pie'} a los ${a.t.toFixed(1)} s, mata ${a.caidos} (el bueno, ${b.caidos})`);
  ok(b.fin === 'rompe' && b.t >= 25 && b.t <= 60, `bueno (semilla ${sem}): ${b.fin || 'en pie'} a los ${b.t.toFixed(1)} s, mata ${b.caidos}, heridas ${b.heridas} · ${JSON.stringify(b.hechos)}`);
  ok(c.fin === 'caido' && c.hechos.rodeado > 0, `quieto delante (semilla ${sem}): ${c.fin || 'en pie'} a los ${c.t.toFixed(1)} s, rodeado ${c.hechos.rodeado || 0}, mata ${c.caidos}`);
}
console.log(`  el bueno tarda de media ${(suma / 5).toFixed(1)} s en romper la línea`);

/* ningún gesto se pierde: 200 gestos al azar, en cualquier momento; cada uno acaba en un hecho que se ve, o lo sustituye otro más nuevo */
{ const S = crear(4); S.yo.heridas = -1000; let k = 77; const az = () => { k = (k * 16807) % 2147483647; return (k - 1) / 2147483646; };
  const TODOS = ['estocada', 'tajo-izq', 'tajo-der', 'empujon', 'izq', 'der', 'adelante', 'atras'], FINAL = new Set(['golpe', 'rebote', 'flojo', 'empujon', 'hueco', 'paso', 'distancia', 'retirada', 'vuelve', 'borde', 'sustituido']);
  let lanzados = 0, finales = 0, sust = 0, sig = 0;
  while ((lanzados < 200 || S.yo.pend || S.yo.acc || S.yo.mov) && S.t < 400) {
    const ges = []; if (lanzados < 200 && S.t >= sig) { ges.push(TODOS[Math.floor(az() * TODOS.length)]); lanzados++; sig = S.t + az() * 0.6; }
    const H = paso(S, DT, { gestos: ges, escudo: az() < 0.1 });
    /* 'distancia' con acerca y 'vuelve' antes de un golpe guardado son pasos intermedios del mismo gesto */
    for (const h of H) if (FINAL.has(h.tipo) && !h.acerca && !(h.tipo === 'vuelve')) { finales++; if (h.tipo === 'sustituido') sust++; }
    for (const h of H) if (h.tipo === 'vuelve') finales += 0;
    if (S.caidos >= 8) S.fin = null;
  }
  ok(finales >= lanzados && lanzados === 200, `200 gestos al azar: ${finales} acaban en algo que se ve (${sust} sustituidos por uno más nuevo); ninguno se tira`); }

/* casos sueltos */
{ const S = crear(5); const g = rival(S); g.estado = 'guardia'; g.lado = 'izq'; g.t = 0; g.dur = 9;
  let H = []; H.push(...paso(S, DT, { gestos: ['estocada'] })); for (let i = 0; i < 10; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.tipo === 'rebote'), 'la estocada contra la guardia a media distancia rebota');
  for (let i = 0; i < 30; i++) paso(S, DT, {}); const lee = NUM.lee; NUM.lee = 0; H = []; H.push(...paso(S, DT, { gestos: ['tajo-der'] })); NUM.lee = lee; for (let i = 0; i < 10; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.tipo === 'golpe'), 'el tajo por el lado sin escudo entra'); }
{ const S = crear(5); S.yo.dist = 0; const g = rival(S); g.estado = 'abierto'; g.t = 0; g.dur = 9; const H = []; H.push(...paso(S, DT, { gestos: ['estocada'] })); for (let i = 0; i < 15; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.acerca) && H.some(h => h.tipo === 'golpe') && S.yo.dist === 1, 'lejos, la estocada es paso y estocada'); }
{ const S = crear(5); S.yo.aliento = 3; const H = []; H.push(...paso(S, DT, { gestos: ['estocada'] })); for (let i = 0; i < 10; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.tipo === 'sinAliento') && H.some(h => h.tipo === 'flojo'), 'sin aliento el golpe sale igual, flojo'); }
{ const S = crear(5); S.yo.racha = RACHA; const g = rival(S); g.estado = 'guardia'; g.t = 0; g.dur = 9; const H = []; H.push(...paso(S, DT, { gestos: ['estocada'] })); for (let i = 0; i < 10; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.tipo === 'golpe' && h.fuerte) && S.caidos === 1, 'racha de 5: la estocada es un golpe fuerte que tumba'); }
{ const S = crear(6); const g = rival(S); g.estado = 'arma'; g.t = 0; g.dur = 0.6; let H = [];
  for (let i = 0; i < 30; i++) H.push(...paso(S, DT, { escudo: S.t > 0.45 }));
  ok(H.some(h => h.tipo === 'parada') && rival(S).estado === 'abierto', 'escudo alzado justo antes del golpe: parada limpia y el galo queda abierto'); }
{ const S = crear(6); const g = rival(S); g.estado = 'arma'; g.t = 0; g.dur = 0.6; let H = [];
  for (let i = 0; i < 30; i++) H.push(...paso(S, DT, { escudo: true }));
  ok(H.some(h => h.tipo === 'bloqueo') && S.yo.escudo === 5, 'escudo alzado de antes: bloqueo y el escudo pierde vida'); }
{ const S = crear(8); S.yo.dist = 0; paso(S, DT, { gestos: ['atras'] }); for (let i = 0; i < 6; i++) paso(S, DT, {}); const H = paso(S, DT, { gestos: ['atras'] });
  ok(H.some(h => h.tipo === 'retirada') && S.yo.fila === 2, 'dos veces atrás estando lejos: a la segunda fila'); }

/* dedos con eventos simulados */
function dedosFalsos() {
  const oy = {}, el = { addEventListener: (n, f) => { oy[n] = f; }, setPointerCapture() {} }; let t = 0;
  const D = crearDedos(el, {}, { ahora: () => t, ancho: () => 844, teclado: false });
  const ev = (n, id, x, y) => oy[n]({ type: n, pointerId: id, clientX: x, clientY: y });
  return { D, ev, pasa: ms => { t += ms; }, todo: [] };
}
const recoge = (F, n) => { const g = []; let esc = false; for (let i = 0; i < n; i++) { F.pasa(16); const p = F.D.toma(); g.push(...p.gestos); esc = esc || p.escudo; } return { g, esc }; };
{ const F = dedosFalsos(); F.ev('pointerdown', 1, 600, 200); let r = recoge(F, 9); F.ev('pointermove', 1, 612, 209); r = recoge(F, 9); F.ev('pointerup', 1, 612, 209); const p = F.D.toma();
  ok(p.gestos.includes('estocada'), `toque de 300 ms con 15 px de temblor -> ${p.gestos.join(',') || 'nada'}`); }
{ const F = dedosFalsos(); F.ev('pointerdown', 1, 600, 200); const g = [];
  for (let i = 1; i <= 15; i++) { F.pasa(40); F.ev('pointermove', 1, 600 - i * 2.7, 200); g.push(...F.D.toma().gestos); } F.ev('pointerup', 1, 560, 200); g.push(...F.D.toma().gestos);
  ok(g.length === 1 && g[0] === 'tajo-izq', `deslizar lento (40 px en 600 ms) -> ${g.join(',') || 'nada'}`); }
{ const F = dedosFalsos(); F.ev('pointerdown', 1, 600, 200); const r = recoge(F, 25); F.ev('pointerup', 1, 600, 200); const p = F.D.toma();
  ok(r.esc && !p.escudo && !p.gestos.length && !r.g.length, `mantener 400 ms -> escudo ${r.esc ? 'arriba' : 'no'}, y al soltar baja sin golpe`); }
{ const F = dedosFalsos(); F.ev('pointerdown', 1, 100, 300); F.pasa(120); F.ev('pointermove', 1, 104, 302); F.ev('pointerup', 1, 104, 302); const p = F.D.toma();
  ok(p.gestos.includes('estocada'), `toque en la zona izquierda sin arrastre -> ${p.gestos.join(',') || 'nada'}`); }
{ const F = dedosFalsos(); F.ev('pointerdown', 1, 100, 300); F.pasa(100); F.ev('pointermove', 1, 100, 250); const p = F.D.toma();
  ok(p.gestos.includes('adelante'), `zona izquierda arrastrando arriba -> palanca: ${p.gestos.join(',') || 'nada'}`); }
console.log(mal ? `\n${mal} prueba(s) MAL` : '\nTodo bien'); process.exit(mal ? 1 : 0);
