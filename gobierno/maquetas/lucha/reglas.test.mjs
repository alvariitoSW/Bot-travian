/* Pruebas de las reglas de «Lucha a pie» con tres bots. Uso: node gobierno/maquetas/lucha/reglas.test.mjs */
import { crear, paso, rival, N, NUM } from './reglas.js';

const DT = 1 / 30;
function corre(bot, semilla, tope) {
  const S = crear(semilla), M = { muere: null, hechos: {} };
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
  if (y.dist < 2) return { gestos: ['adelante'] };
  const arma = g && g.estado === 'arma' && g.dur - g.t < 0.2;
  return { gestos: !arma && y.aliento > 30 ? ['estocada'] : [], escudo: arma };
};

/* «bueno»: a media distancia; para limpio, golpea al abierto, empuja, se pega cuando el galo arma y cede antes de que lo rodeen */
const bueno = (S, M) => {
  const y = S.yo, g = rival(S), ges = [];
  if (y.fila === 2) return { gestos: y.aliento > 90 ? ['adelante'] : [] };
  if (y.aliento < 20 && y.dist === 0 && !y.mov) return { gestos: [M.atras = !M.atras ? 'atras' : 'atras'] };   /* sin aliento: a la segunda fila */
  if (!g || g.estado === 'cae' || g.estado === 'llega') {                                                     /* sin rival: busca uno */
    if (g && g.estado === 'llega') return { gestos: [] };
    let mejor = null; for (let c = 0; c < N; c++) if (S.cols[c].frente && S.cols[c].frente.estado !== 'cae' && (mejor === null || Math.abs(c - y.puesto) < Math.abs(mejor - y.puesto))) mejor = c;
    if (mejor !== null && !y.mov) ges.push(mejor < y.puesto ? 'izq' : 'der'); else if (y.dist > 0 && !y.mov) ges.push('atras');
    return { gestos: ges };
  }
  if (y.pegadoT > 2.6 && !y.mov) return { gestos: ['atras'] };
  if (y.dist === 0 && !y.mov) return { gestos: ['adelante'] };
  const queda = g.estado === 'arma' ? g.dur - g.t : 9;
  if (g.estado === 'arma' && !y.acc) {
    if (y.dist === 1 && y.escudo > 0 && !g.rapido && y.aliento > 30 && queda > 0.5 && !y.mov) return { gestos: ['adelante'] };   /* se pega: arma más despacio */
    if (y.dist === 2 && queda > 0.3 && y.aliento > 14) return { gestos: ['estocada'] };                       /* pegado, la estocada entra */
    return { gestos: [], escudo: queda < 0.2 };                                                                 /* para limpio */
  }
  if (y.dist === 2 && !y.mov && !y.acc && y.pegadoT > 1) return { gestos: ['atras'] };
  if (y.acc) return { gestos: [], escudo: false };
  if (g.estado === 'abierto' || g.estado === 'encaja') return { gestos: [y.aliento > 30 ? 'tajo-' + (g.lado === 'izq' ? 'der' : 'izq') : 'estocada'] };
  if (g.estado === 'guardia' && y.aliento > 60) return { gestos: [y.aliento > 85 ? 'empujon' : 'tajo-' + (g.lado === 'izq' ? 'der' : 'izq')] };
  return { gestos: [] };
};

let mal = 0, suma = 0;
const ok = (c, txt) => { console.log((c ? 'bien ' : 'MAL  ') + txt); if (!c) mal++; };
for (const sem of [1, 2, 3, 7, 11]) {
  const a = corre(loco, sem, 60); ok(a.fin === 'caido' && a.t < 20, `loco (semilla ${sem}): ${a.fin || 'en pie'} a los ${a.t.toFixed(1)} s, mata ${a.caidos}`);
  const b = corre(bueno, sem, 60); suma += b.t; ok(b.fin !== 'caido' && b.caidos >= 5, `bueno (semilla ${sem}): ${b.fin || 'en pie'} a los ${b.t.toFixed(1)} s, mata ${b.caidos}, heridas ${b.heridas} · ${JSON.stringify(b.hechos)}`);
  const c = corre(quieto, sem, 60); ok(c.fin === 'caido' && c.t < 25, `quieto delante (semilla ${sem}): ${c.fin || 'en pie'} a los ${c.t.toFixed(1)} s, mata ${c.caidos}`);
}
ok(suma / 5 >= 25 && suma / 5 <= 45, `el bueno tarda de media ${(suma / 5).toFixed(1)} s en romper la línea (25–45)`);
/* casos sueltos */
{ const S = crear(5); S.yo.dist = 1; const g = rival(S); g.estado = 'guardia'; g.lado = 'izq'; g.t = 0; g.dur = 9;
  let H = []; H.push(...paso(S, DT, { gestos: ['estocada'] })); for (let i = 0; i < 10; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.tipo === 'rebote'), 'la estocada contra la guardia a media distancia rebota');
  for (let i = 0; i < 30; i++) paso(S, DT, {}); const lee = NUM.lee; NUM.lee = 0; H = []; H.push(...paso(S, DT, { gestos: ['tajo-der'] })); NUM.lee = lee; for (let i = 0; i < 10; i++) H.push(...paso(S, DT, {}));
  ok(H.some(h => h.tipo === 'golpe'), 'el tajo por el lado sin escudo entra'); }
{ const S = crear(6); S.yo.dist = 1; const g = rival(S); g.estado = 'arma'; g.t = 0; g.dur = 0.6; let H = [];
  for (let i = 0; i < 30; i++) H.push(...paso(S, DT, { escudo: S.t > 0.45 }));
  ok(H.some(h => h.tipo === 'parada') && rival(S).estado === 'abierto', 'escudo alzado justo antes del golpe: parada limpia y el galo queda abierto'); }
{ const S = crear(6); S.yo.dist = 1; const g = rival(S); g.estado = 'arma'; g.t = 0; g.dur = 0.6; let H = [];
  for (let i = 0; i < 30; i++) H.push(...paso(S, DT, { escudo: true }));
  ok(H.some(h => h.tipo === 'bloqueo') && S.yo.escudo === 5, 'escudo alzado de antes: bloqueo y el escudo pierde vida'); }
{ const S = crear(8); paso(S, DT, { gestos: ['atras'] }); for (let i = 0; i < 6; i++) paso(S, DT, {}); const H = paso(S, DT, { gestos: ['atras'] });
  ok(H.some(h => h.tipo === 'retirada') && S.yo.fila === 2, 'dos veces atrás estando lejos: a la segunda fila'); }
console.log(mal ? `\n${mal} prueba(s) MAL` : '\nTodo bien'); process.exit(mal ? 1 : 0);
