/* Maqueta TP9-0 «Lucha a pie»: las reglas de la lucha en la primera fila. Lógica pura: sin pantalla ni three (corre en Node).
   crear(semilla) -> S (el estado). paso(S, dt, pide) -> lista de hechos de este paso.
   pide = { gestos: ['estocada' | 'tajo-izq' | 'tajo-der' | 'empujon' | 'izq' | 'der' | 'adelante' | 'atras'], escudo: true mientras se mantiene }.
   Hechos: { tipo: 'golpe' | 'rebote' | 'parada' | 'bloqueo' | 'rajado' | 'roto' | 'herido' | 'cae' | 'remate' | 'hueco' | 'corto' | 'falla'
     | 'contra' | 'descubierto' | 'sinAliento' | 'rodeado' | 'libre' | 'flanco' | 'empujon' | 'paso' | 'distancia' | 'retirada' | 'vuelve'
     | 'avanza' | 'arma' | 'llega' | 'ajeno' | 'rompe', ... }.
   Columnas 0..6 de izquierda a derecha (vistas desde los romanos); tú empiezas en la 3. Lado del escudo del galo y de tus tajos:
   'izq' o 'der' tal como se ve en la pantalla. */

export const DIST = [2.0, 1.2, 0.6];                  /* lejos, media, pegado (m) */
export const N = 7, YO0 = 3, VIDA_ESC = 6, MAX_HERIDAS = 3, META = 8;
export const NUM = {
  arma: 0.95, rapido: 0.4, pRapido: 0.25, pegadoK: 1.6,      /* galo: armar el golpe (s); uno de cada cuatro, rápido; pegado, 60 % más lento */
  guardia: [1.3, 2.4], cambio: [1.2, 2], tras: 0.5, llega: 0.9, lee: 0.5,   /* lee: probabilidad de que el galo, en guardia, lleve el escudo al lado de tu tajo */ avanza: 2,
  abierto: 1.4, deseq: 1.5, encaja: 0.35, remate: [0.45, 0.8],
  limpia: 0.25, rebote: 0.4, rodea: 4, flanco: 1.5, cola: 0.25, descubierto: 0.5,
  aliento: 100, recobra: 10,   /* era 16; 10 da fluidez y, con la meta en 8, el bot bueno tarda 25–45 s (segunda fila: el triple) */ recobra2: 3, escudoGasto: 10,
  paso: 0.25, grado: 0.3, retirada: 0.8, dobleAtras: 0.8, herida: 0.35,
};
/* tus golpes: cuándo entra (imp) y cuándo acaba (dur), en segundos, y su coste de aliento */
export const ACC = {
  estocada: { imp: 0.15, dur: 0.35, coste: 14 },        /* anticipo 60 ms + golpe 90 ms + recobro 200 ms */
  tajo: { imp: 0.22, dur: 0.5, coste: 18 },
  empujon: { imp: 0.25, dur: 0.55, coste: 22 },
};
export const NOMBRES = { 1: 'Tito', '-1': 'Marco', 2: 'Lucio', '-2': 'Cayo', 3: 'Tito', '-3': 'Marco' };

function azar(S) { S.sem = (S.sem * 16807) % 2147483647; return (S.sem - 1) / 2147483646; }
const entre = (S, [a, b]) => a + (b - a) * azar(S);

function nuevoGalo(S, c, llega) {
  return { c, vida: 2, estado: llega ? 'llega' : 'guardia', t: 0, dur: llega ? NUM.llega : entre(S, NUM.guardia), lado: azar(S) < 0.5 ? 'izq' : 'der',
    tLado: entre(S, NUM.cambio), rapido: false, imparable: false, talla: 0.96 + 0.08 * azar(S), semilla: azar(S) * 100, tLejos: 0 };
}

export function crear(semilla = 1) {
  const S = { sem: (Math.abs(Math.floor(semilla)) % 2147483646) + 1, t: 0, fin: null, caidos: 0,
    yo: { puesto: YO0, dist: 0, fila: 1, heridas: 0, aliento: NUM.aliento, escudo: VIDA_ESC, alzado: false, tAlzo: -9,
      acc: null, mov: null, bloq: 0, desc: 0, pegadoT: 0, rodeado: false, tRod: 0, rebotes: 0, tAtras: -9, enc: 0 },
    cols: [], muertos: [], remates: [], comp: [] };
  for (let c = 0; c < N; c++) { S.cols.push({ frente: nuevoGalo(S, c, false), reserva: 1 }); S.comp.push({ clip: 'guardia', t0: 0, sig: entre(S, [1, 3]) }); }
  return S;
}

export const rival = S => S.cols[S.yo.puesto].frente;
export const enLinea = S => S.yo.fila === 1 && !(S.yo.mov && (S.yo.mov.tipo === 'retirada' || S.yo.mov.tipo === 'vuelve'));
export function nombreCerca(S) { const p = S.yo.puesto; return p < N - 1 ? NOMBRES[1] : NOMBRES[-1]; }

/* estado resumido para la interfaz y las pruebas */
export function resumen(S) {
  const y = S.yo, g = rival(S);
  return { t: +S.t.toFixed(2), fin: S.fin, caidos: S.caidos, heridas: y.heridas, aliento: Math.round(y.aliento), escudo: y.escudo, alzado: y.alzado, dist: y.dist,
    fila: y.fila, puesto: y.puesto, rodeado: y.rodeado, accion: y.acc && y.acc.tipo, rival: g ? { estado: g.estado, lado: g.lado, vida: g.vida, rapido: g.rapido } : null };
}

function herir(S, H, como) {
  const y = S.yo; y.heridas++; y.acc = null; y.bloq = Math.max(y.bloq, NUM.herida); y.enc = S.t; y.alzado = false;
  H.push({ tipo: 'herido', como, heridas: y.heridas });
  if (y.heridas >= MAX_HERIDAS && !S.fin) { S.fin = 'caido'; H.push({ tipo: 'cae', yo: true }); }
}
function galoCae(S, H, g, como) {
  g.estado = 'cae'; g.t = 0; g.dur = NUM.llega; g.vida = 0; S.caidos++; S.muertos.push({ c: g.c, talla: g.talla, semilla: g.semilla, t: S.t, z: g.z || 0 });
  H.push({ tipo: 'cae', c: g.c, como, caidos: S.caidos });
  if (S.caidos >= META && !S.fin) { S.fin = 'rompe'; H.push({ tipo: 'rompe' }); }
}

/* tu golpe llega a su punto: ¿entra? */
function resolverMio(S, H) {
  const y = S.yo, a = y.acc, g = rival(S);
  if (!g || g.estado === 'cae' || g.estado === 'llega') { H.push({ tipo: 'hueco' }); return; }
  if (y.dist === 0) { H.push({ tipo: 'corto' }); return; }
  const abierto = g.estado === 'abierto' || g.estado === 'deseq' || g.estado === 'encaja';
  if (a.tipo === 'empujon') {
    g.estado = 'deseq'; g.t = 0; g.dur = NUM.deseq; g.imparable = false; y.rebotes = 0;
    S.remates.push({ c: g.c, g, t: S.t + entre(S, NUM.remate), nombre: nombreCerca(S) }); H.push({ tipo: 'empujon' }); return;
  }
  const entra = abierto || (a.tipo === 'estocada' ? y.dist === 2 : g.lado !== a.lado);
  if (entra) {
    const dano = a.n >= 3 ? 2 : 1; g.vida -= dano; y.rebotes = 0;
    if (g.vida <= 0) { H.push({ tipo: 'golpe', dano, mata: true, accion: a.tipo }); galoCae(S, H, g, a.tipo); }
    else { g.estado = 'encaja'; g.t = 0; g.dur = NUM.encaja; g.imparable = false; H.push({ tipo: 'golpe', dano, accion: a.tipo }); }
  } else {
    a.dur += NUM.rebote; y.rebotes++; H.push({ tipo: 'rebote', accion: a.tipo, rebotes: y.rebotes });
    if (y.rebotes >= 3) { y.rebotes = 0; g.estado = 'arma'; g.t = 0; g.dur = 0.5; g.rapido = true; g.imparable = true; H.push({ tipo: 'contra' }); }
  }
}

/* el golpe de un galo llega: a ti si es tu rival y estás en la línea; si no, a un compañero (que siempre para) */
function resolverGalo(S, H, g) {
  const y = S.yo;
  if (g.c !== y.puesto || !enLinea(S)) { H.push({ tipo: 'ajeno', c: g.c }); const k = S.comp[g.c]; k.clip = 'cubrirse'; k.t0 = S.t - 0.3; k.sig = S.t + 0.6; return; }
  if (y.dist === 0) { H.push({ tipo: 'falla' }); return; }
  if (g.imparable) { herir(S, H, 'contra'); return; }
  if (y.alzado) {
    if (S.t - y.tAlzo <= NUM.limpia) { g.estado = 'abierto'; g.t = 0; g.dur = NUM.abierto; H.push({ tipo: 'parada' }); return 'parada'; }
    if (y.escudo > 0) { y.escudo--; H.push({ tipo: 'bloqueo', escudo: y.escudo }); if (y.escudo === 3) H.push({ tipo: 'rajado' }); if (y.escudo === 0) H.push({ tipo: 'roto' }); return; }
  }
  herir(S, H, 'galo');
}

function moverse(S, H, ge) {
  const y = S.yo;
  if (y.fila === 2) { if (ge === 'adelante' && !y.mov) { y.mov = { tipo: 'vuelve', t: 0, dur: NUM.retirada }; y.fila = 1; y.dist = 0; H.push({ tipo: 'vuelve' }); } return; }
  if (y.mov || y.acc || y.bloq > 0) return;
  if (ge === 'izq' || ge === 'der') {
    const p = y.puesto + (ge === 'izq' ? -1 : 1); if (p < 0 || p >= N) return;
    y.puesto = p; y.mov = { tipo: 'paso', lado: ge, t: 0, dur: NUM.paso }; y.rebotes = 0; H.push({ tipo: 'paso', lado: ge, puesto: p });
    const g = rival(S); if (!g || g.estado === 'cae') H.push({ tipo: 'hueco' });
  } else if (ge === 'adelante') {
    if (y.dist >= 2) return; y.dist++; y.mov = { tipo: 'grado', t: 0, dur: NUM.grado }; H.push({ tipo: 'distancia', dist: y.dist });
    const g = rival(S); if (y.dist === 2 && g && g.estado === 'arma') g.dur = g.t + (g.dur - g.t) * NUM.pegadoK;
  } else if (ge === 'atras') {
    if (y.dist === 0) {
      if (S.t - y.tAtras <= NUM.dobleAtras) { y.fila = 2; y.alzado = false; y.mov = { tipo: 'retirada', t: 0, dur: NUM.retirada }; y.pegadoT = 0; H.push({ tipo: 'retirada' }); }
      y.tAtras = S.t; return;
    }
    y.dist--; y.tAtras = S.t; y.mov = { tipo: 'grado', t: 0, dur: NUM.grado }; H.push({ tipo: 'distancia', dist: y.dist });
  }
}

function atacar(S, H, ge) {
  const y = S.yo, tipo = ge.startsWith('tajo') ? 'tajo' : ge, lado = ge === 'tajo-izq' ? 'izq' : ge === 'tajo-der' ? 'der' : null, A = ACC[tipo];
  if (y.fila === 1 && y.mov && y.mov.dur - y.mov.t <= NUM.cola) { y.pend = ge; return; }      /* llega al acabar el paso: se guarda */
  if (y.fila !== 1 || y.mov || y.bloq > 0 || y.desc > 0) return;
  let n = 1;
  if (y.acc) {      /* encadenar: solo en los últimos 250 ms y después de que el golpe haya llegado; corta el recobro */
    if (!y.acc.hecho || y.acc.dur - y.acc.t > NUM.cola || y.acc.n >= 3) return;
    n = y.acc.n + 1;
  }
  if (y.aliento < A.coste) { H.push({ tipo: 'sinAliento' }); return; }
  y.aliento -= A.coste; y.alzado = false;
  y.acc = { tipo, lado, t: 0, imp: A.imp, dur: A.dur, n, hecho: false, t0: S.t };
  const g = rival(S); if (tipo === 'tajo' && g && (g.estado === 'guardia' || g.estado === 'tras') && g.lado !== lado && azar(S) < NUM.lee) { g.lado = lado; g.tLado = entre(S, NUM.cambio); }
}

export function paso(S, dt, pide = {}) {
  const H = [], y = S.yo;
  if (S.fin) { S.t += dt; S.remates.length = 0; return H; }
  S.t += dt;
  for (const ge of pide.gestos || []) {
    if (ge === 'izq' || ge === 'der' || ge === 'adelante' || ge === 'atras') moverse(S, H, ge); else if (ACC[ge.startsWith('tajo') ? 'tajo' : ge]) atacar(S, H, ge);
  }
  /* temporizadores tuyos */
  y.bloq = Math.max(0, y.bloq - dt); y.desc = Math.max(0, y.desc - dt);
  if (y.mov) { y.mov.t += dt; if (y.mov.t >= y.mov.dur) { y.mov = null; if (y.pend) { const p = y.pend; y.pend = null; atacar(S, H, p); } } }
  if (y.acc) {
    const a = y.acc; a.t += dt;
    if (!a.hecho && a.t >= a.imp) { a.hecho = true; resolverMio(S, H); }
    if (y.acc === a && a.t >= a.dur) { if (a.n >= 3) { y.desc = NUM.descubierto; H.push({ tipo: 'descubierto' }); } y.acc = null; }
  }
  /* escudo: arriba mientras se mantenga, si se puede y queda aliento */
  const puede = pide.escudo && y.fila === 1 && !y.acc && y.bloq <= 0 && y.desc <= 0 && y.aliento > 0;
  if (puede && !y.alzado) { y.alzado = true; y.tAlzo = S.t; } else if (!puede) y.alzado = false;
  if (y.alzado) y.aliento = Math.max(0, y.aliento - NUM.escudoGasto * dt);
  else if (!y.acc) y.aliento = Math.min(NUM.aliento, y.aliento + NUM.recobra * dt * (y.fila === 2 ? NUM.recobra2 : 1));
  /* pegado mucho rato: te rodean */
  if (enLinea(S) && y.dist === 2) {
    y.pegadoT += dt;
    if (!y.rodeado && y.pegadoT > NUM.rodea) { y.rodeado = true; y.tRod = 0; H.push({ tipo: 'rodeado' }); }
    if (y.rodeado) { y.tRod += dt; if (y.tRod >= NUM.flanco) { y.tRod -= NUM.flanco; H.push({ tipo: 'flanco', lado: azar(S) < 0.5 ? 'izq' : 'der' }); herir(S, H, 'flanco'); } }
  } else { y.pegadoT = 0; if (y.rodeado) { y.rodeado = false; H.push({ tipo: 'libre' }); } }
  /* remates de los compañeros */
  for (let i = S.remates.length - 1; i >= 0; i--) { const r = S.remates[i]; if (S.t < r.t) continue; S.remates.splice(i, 1);
    if (r.g.estado === 'deseq' && S.cols[r.c].frente === r.g && !S.fin) { const k = S.comp[r.c === y.puesto ? Math.min(N - 1, Math.max(0, y.puesto + (r.nombre === 'Tito' ? 1 : -1))) : r.c]; k.clip = 'golpear'; k.t0 = S.t - 0.45; k.sig = S.t + 1.2;
      H.push({ tipo: 'remate', nombre: r.nombre, c: r.c }); galoCae(S, H, r.g, 'remate'); } }
  /* galos */
  for (const col of S.cols) {
    const g = col.frente; if (!g || S.fin === 'rompe') continue;
    g.t += dt; const mio = g.c === y.puesto && enLinea(S);
    if (g.estado !== 'cae') { g.tLado -= dt; if (g.tLado <= 0 && (g.estado === 'guardia' || g.estado === 'tras')) { g.lado = g.lado === 'izq' ? 'der' : 'izq'; g.tLado = entre(S, NUM.cambio); } }
    if (mio && y.dist === 0) { g.tLejos += dt; if (g.tLejos > NUM.avanza) { g.tLejos = 0; y.dist = 1; H.push({ tipo: 'avanza', c: g.c }); } } else g.tLejos = 0;
    if (g.t < g.dur) continue;
    switch (g.estado) {
      case 'llega': g.estado = 'guardia'; g.t = 0; g.dur = entre(S, NUM.guardia); H.push({ tipo: 'llega', c: g.c }); break;
      case 'guardia': g.rapido = azar(S) < NUM.pRapido; g.estado = 'arma'; g.t = 0;
        g.dur = (g.rapido ? NUM.rapido : NUM.arma) * (mio && y.dist === 2 ? NUM.pegadoK : 1); if (mio) H.push({ tipo: 'arma', rapido: g.rapido, dur: g.dur }); break;
      case 'arma': { const r = resolverGalo(S, H, g); g.imparable = false; if (r !== 'parada' && g.estado === 'arma') { g.estado = 'tras'; g.t = 0; g.dur = NUM.tras; } break; }
      case 'tras': case 'abierto': case 'deseq': case 'encaja': g.estado = 'guardia'; g.t = 0; g.dur = entre(S, NUM.guardia); break;
      case 'cae': if (col.reserva > 0) { col.reserva--; col.frente = nuevoGalo(S, g.c, true); H.push({ tipo: 'llega', c: g.c, viene: true }); } else { col.frente = null; if (g.c === y.puesto) H.push({ tipo: 'hueco' }); } break;
    }
  }
  /* compañeros: golpean de vez en cuando (solo se ve) */
  for (let c = 0; c < N; c++) { const k = S.comp[c]; if (S.t >= k.sig) { k.clip = azar(S) < 0.55 ? 'golpear' : 'cubrirse'; k.t0 = S.t; k.sig = S.t + entre(S, [1.6, 3.4]);
    const g = S.cols[c].frente; if (k.clip === 'golpear' && g && g.estado === 'guardia' && !(c === y.puesto && enLinea(S))) H.push({ tipo: 'ajeno', c, golpea: true }); } }
  return H;
}
