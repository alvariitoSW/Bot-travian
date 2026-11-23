/* Maqueta TP9-0 «Lucha a pie»: las reglas de la lucha en la primera fila. Lógica pura: sin pantalla ni three (corre en Node).
   crear(semilla) -> S (el estado). paso(S, dt, pide) -> lista de hechos de este paso.
   pide = { gestos: ['estocada' | 'tajo-izq' | 'tajo-der' | 'empujon' | 'izq' | 'der' | 'adelante' | 'atras'], escudo: true mientras se mantiene }.
   Regla de oro (segunda versión): NINGÚN gesto se tira. Si llega mientras haces otra cosa, se guarda (uno solo: el último sustituye
   al anterior) y sale en cuanto acabas o en el punto de corte (tu golpe ya ha llegado). Sin aliento, el golpe sale igual, pero flojo.
   Hechos de tus gestos: 'sale' (empieza un golpe), 'guardado', 'sustituido'; al llegar: 'golpe' | 'rebote' | 'flojo' | 'empujon' | 'hueco'.
   Movimiento: 'paso' | 'distancia' | 'retirada' | 'vuelve' | 'borde'. Del galo: 'arma' | 'parada' | 'bloqueo' | 'herido' | 'cae' | 'llega' | ...
   Columnas 0..6 de izquierda a derecha (vistas desde los romanos); tú empiezas en la 3, a media distancia. Lado del escudo del galo y
   de tus tajos: 'izq' o 'der' tal como se ve en la pantalla. */

export const DIST = [2.0, 1.2, 0.6];                  /* lejos, media, pegado (m) */
export const N = 7, YO0 = 3, VIDA_ESC = 6, MAX_HERIDAS = 3, META = 8, RACHA = 5;
export const NUM = {
  arma: 0.95, rapido: 0.45, pRapido: 0.2, pegadoK: 1.6,      /* galo: armar el golpe (s); uno de cada cinco, rápido; pegado, 60 % más lento */
  guardia: [0.8, 1.6], cambio: [1.2, 2], tras: 0.5, llega: 1.8, lee: 0.5, avanza: 1.0,   /* avanza: el galo vuelve a media distancia si te alejas */
  abierto: 1.4, deseq: 1.5, encaja: 0.35, remate: [0.45, 0.8],
  limpia: 0.25, rebote: 0.15, rodea: 4, flanco: 1.5, corte: 0.08,
  aliento: 100, recobra: 10, recobra2: 3, escudoGasto: 10,
  paso: 0.25, grado: 0.3, retirada: 0.8, dobleAtras: 0.8, herida: 0.35, acerca: 0.2,
  lado: 6, ladoCada: [2.5, 4.5], ladoArma: 1.1,   /* 6 s sin matar: los galos de los lados también te tiran un golpe */
};
/* tus golpes: cuándo entra (imp) y cuándo acaba (dur), en segundos, y su coste de aliento */
export const ACC = {
  estocada: { imp: 0.12, dur: 0.30, coste: 14 },
  tajo: { imp: 0.18, dur: 0.38, coste: 18 },
  empujon: { imp: 0.22, dur: 0.45, coste: 22 },
};
const MOV = new Set(['izq', 'der', 'adelante', 'atras']);
export const NOMBRES = { 1: 'Tito', '-1': 'Marco' };

function azar(S) { S.sem = (S.sem * 16807) % 2147483647; return (S.sem - 1) / 2147483646; }
const entre = (S, [a, b]) => a + (b - a) * azar(S);

function nuevoGalo(S, c, llega) {
  return { c, vida: 2, estado: llega ? 'llega' : 'guardia', t: 0, dur: llega ? NUM.llega : entre(S, NUM.guardia), lado: azar(S) < 0.5 ? 'izq' : 'der',
    tLado: entre(S, NUM.cambio), rapido: false, imparable: false, contraYo: false, talla: 0.96 + 0.08 * azar(S), semilla: azar(S) * 100, tLejos: 0 };
}

export function crear(semilla = 1) {
  const S = { sem: (Math.abs(Math.floor(semilla)) % 2147483646) + 1, t: 0, fin: null, caidos: 0,
    yo: { puesto: YO0, dist: 1, fila: 1, heridas: 0, aliento: NUM.aliento, escudo: VIDA_ESC, alzado: false, tAlzo: -9,
      acc: null, mov: null, pend: null, bloq: 0, pegadoT: 0, rodeado: false, tRod: 0, rebotes: 0, tAtras: -9, enc: -9, racha: 0, tMata: 0, tLadoSig: 0 },
    cols: [], muertos: [], remates: [], comp: [] };
  for (let c = 0; c < N; c++) { S.cols.push({ frente: nuevoGalo(S, c, false), reserva: 1 }); S.comp.push({ clip: 'guardia', t0: 0, sig: entre(S, [1, 3]) }); }
  return S;
}

export const rival = S => S.cols[S.yo.puesto].frente;
export const enLinea = S => S.yo.fila === 1 && !(S.yo.mov && (S.yo.mov.tipo === 'retirada' || S.yo.mov.tipo === 'vuelve'));
export const abierto = g => !!g && (g.estado === 'abierto' || g.estado === 'deseq' || g.estado === 'encaja');
export function nombreCerca(S) { const p = S.yo.puesto; return p < N - 1 ? NOMBRES[1] : NOMBRES[-1]; }

/* estado resumido para la interfaz y las pruebas */
export function resumen(S) {
  const y = S.yo, g = rival(S);
  return { t: +S.t.toFixed(2), fin: S.fin, caidos: S.caidos, heridas: y.heridas, aliento: Math.round(y.aliento), escudo: y.escudo, alzado: y.alzado, dist: y.dist,
    fila: y.fila, puesto: y.puesto, rodeado: y.rodeado, accion: y.acc && y.acc.tipo, pend: y.pend, racha: y.racha, fuerte: y.racha >= RACHA,
    rival: g ? { estado: g.estado, lado: g.lado, vida: g.vida, rapido: g.rapido, t: g.t, dur: g.dur, abierto: abierto(g) } : null };
}

function herir(S, H, como) {
  const y = S.yo; y.heridas++; y.racha = 0;
  if (y.acc && !y.acc.hecho) { if (y.pend) H.push({ tipo: 'sustituido', ge: y.acc.ge }); else y.pend = y.acc.ge; }   /* el golpe cortado no se tira: vuelve a la cola */
  y.acc = null; y.bloq = Math.max(y.bloq, NUM.herida); y.enc = S.t; y.alzado = false;
  H.push({ tipo: 'herido', como, heridas: y.heridas });
  if (y.heridas >= MAX_HERIDAS && !S.fin) { S.fin = 'caido'; H.push({ tipo: 'cae', yo: true }); }
}
function galoCae(S, H, g, como) {
  g.estado = 'cae'; g.t = 0; g.dur = NUM.llega; g.vida = 0; g.contraYo = false; S.caidos++; S.yo.tMata = S.t;
  S.muertos.push({ c: g.c, talla: g.talla, semilla: g.semilla, t: S.t });
  H.push({ tipo: 'cae', c: g.c, como, caidos: S.caidos });
  if (S.caidos >= META && !S.fin) { S.fin = 'rompe'; H.push({ tipo: 'rompe' }); }
}

/* tu golpe llega a su punto: ¿entra? */
function resolverMio(S, H) {
  const y = S.yo, a = y.acc, g = rival(S);
  if (!g || g.estado === 'cae' || g.estado === 'llega') { H.push({ tipo: 'hueco' }); return; }
  if (a.flojo) { y.racha = 0; H.push({ tipo: 'flojo', accion: a.tipo }); return; }       /* sin aliento: no hiere, solo lo empuja un poco */
  if (a.tipo === 'empujon') {
    g.estado = 'deseq'; g.t = 0; g.dur = NUM.deseq; g.imparable = false; y.rebotes = 0;
    S.remates.push({ c: g.c, g, t: S.t + entre(S, NUM.remate), nombre: nombreCerca(S) }); H.push({ tipo: 'empujon' }); return;
  }
  if (a.fuerte) { y.racha = 0; y.rebotes = 0; H.push({ tipo: 'golpe', dano: 2, mata: true, fuerte: true, accion: a.tipo, racha: 0 }); galoCae(S, H, g, 'fuerte'); return; }
  const entra = abierto(g) || (a.tipo === 'estocada' ? y.dist === 2 : g.lado !== a.lado);
  if (entra) {
    g.vida -= 1; y.rebotes = 0; y.racha++;
    if (g.vida <= 0) { H.push({ tipo: 'golpe', dano: 1, mata: true, accion: a.tipo, racha: y.racha }); galoCae(S, H, g, a.tipo); }
    else { g.estado = 'encaja'; g.t = 0; g.dur = NUM.encaja; g.imparable = false; g.contraYo = false; H.push({ tipo: 'golpe', dano: 1, accion: a.tipo, racha: y.racha }); }
  } else {
    a.dur += NUM.rebote; y.rebotes++; y.racha = 0; H.push({ tipo: 'rebote', accion: a.tipo, lado: g.lado, rebotes: y.rebotes });
    if (y.rebotes >= 3) { y.rebotes = 0; g.estado = 'arma'; g.t = 0; g.dur = 0.5; g.rapido = true; g.imparable = true; H.push({ tipo: 'contra' }); H.push({ tipo: 'arma', c: g.c, rapido: true, dur: 0.5 }); }
  }
}

/* el golpe de un galo llega: a ti si va contra ti y estás en la línea; si no, a un compañero (que siempre para) */
function resolverGalo(S, H, g) {
  const y = S.yo, contra = g.c === y.puesto || g.contraYo; g.contraYo = false;
  if (!contra || !enLinea(S)) { H.push({ tipo: 'ajeno', c: g.c }); const k = S.comp[g.c]; k.clip = 'cubrirse'; k.t0 = S.t - 0.3; k.sig = S.t + 0.6; return; }
  if (g.c === y.puesto && y.dist === 0) { H.push({ tipo: 'falla' }); return; }
  if (g.imparable) { herir(S, H, 'contra'); return; }
  if (y.alzado) {
    if (S.t - y.tAlzo <= NUM.limpia) { g.estado = 'abierto'; g.t = 0; g.dur = NUM.abierto; H.push({ tipo: 'parada', c: g.c }); return 'parada'; }
    if (y.escudo > 0) { y.escudo--; H.push({ tipo: 'bloqueo', c: g.c, escudo: y.escudo }); if (y.escudo === 3) H.push({ tipo: 'rajado' }); if (y.escudo === 0) H.push({ tipo: 'roto' }); return; }
  }
  herir(S, H, g.c === y.puesto ? 'galo' : 'lado');
}

function moverse(S, H, ge) {
  const y = S.yo;
  if (ge === 'izq' || ge === 'der') {
    const p = y.puesto + (ge === 'izq' ? -1 : 1); if (p < 0 || p >= N) { H.push({ tipo: 'borde', ge }); return; }
    y.puesto = p; y.mov = { tipo: 'paso', lado: ge, t: 0, dur: NUM.paso }; y.rebotes = 0; H.push({ tipo: 'paso', lado: ge, puesto: p });
    const g = rival(S); if (!g || g.estado === 'cae') H.push({ tipo: 'hueco' });
  } else if (ge === 'adelante') {
    if (y.dist >= 2) { H.push({ tipo: 'borde', ge }); return; }
    y.dist++; y.mov = { tipo: 'grado', t: 0, dur: NUM.grado }; H.push({ tipo: 'distancia', dist: y.dist });
    const g = rival(S); if (y.dist === 2 && g && g.estado === 'arma') g.dur = g.t + (g.dur - g.t) * NUM.pegadoK;
  } else if (ge === 'atras') {
    if (y.dist === 0) {
      if (S.t - y.tAtras <= NUM.dobleAtras) { y.fila = 2; y.alzado = false; y.mov = { tipo: 'retirada', t: 0, dur: NUM.retirada }; y.pegadoT = 0; H.push({ tipo: 'retirada' }); }
      else H.push({ tipo: 'borde', ge });
      y.tAtras = S.t; return;
    }
    y.dist--; y.tAtras = S.t; y.mov = { tipo: 'grado', t: 0, dur: NUM.grado }; H.push({ tipo: 'distancia', dist: y.dist });
  }
}

function atacar(S, H, ge) {
  const y = S.yo, tipo = ge.startsWith('tajo') ? 'tajo' : ge, lado = ge === 'tajo-izq' ? 'izq' : ge === 'tajo-der' ? 'der' : null, A = ACC[tipo];
  let imp = A.imp, dur = A.dur, acerca = false;
  if (y.dist === 0) { y.dist = 1; acerca = true; imp += NUM.acerca; dur += NUM.acerca; H.push({ tipo: 'distancia', dist: 1, acerca: true }); }   /* lejos: paso y golpe */
  if (tipo === 'tajo' && y.dist === 2) { imp *= 1.5; dur *= 1.5; }                                                                             /* pegado, el tajo no tiene sitio */
  const flojo = y.aliento < A.coste, fuerte = tipo === 'estocada' && y.racha >= RACHA && !flojo;
  y.aliento = Math.max(0, y.aliento - A.coste); y.alzado = false;
  y.acc = { tipo, lado, ge, t: 0, imp, dur, hecho: false, t0: S.t, flojo, fuerte };
  H.push({ tipo: 'sale', accion: tipo, lado, flojo, fuerte, acerca });
  if (flojo) H.push({ tipo: 'sinAliento' });
  const g = rival(S); if (tipo === 'tajo' && g && (g.estado === 'guardia' || g.estado === 'tras') && g.lado !== lado && azar(S) < NUM.lee) { g.lado = lado; g.tLado = entre(S, NUM.cambio); }
}

const ocupado = y => !!(y.mov || y.acc || y.bloq > 0);
function guarda(S, H, ge) { const y = S.yo; if (y.pend) H.push({ tipo: 'sustituido', ge: y.pend }); y.pend = ge; H.push({ tipo: 'guardado', ge }); }
function pedir(S, H, ge) {
  const y = S.yo;
  if (ocupado(y)) { guarda(S, H, ge); return; }
  if (y.fila === 2) {                                   /* en la segunda fila, cualquier gesto (salvo atrás) te devuelve a la primera */
    if (ge === 'atras') { H.push({ tipo: 'borde', ge }); return; }
    y.mov = { tipo: 'vuelve', t: 0, dur: NUM.retirada }; y.fila = 1; y.dist = 1; H.push({ tipo: 'vuelve' });
    if (!MOV.has(ge)) guarda(S, H, ge);
    return;
  }
  if (MOV.has(ge)) moverse(S, H, ge); else if (ACC[ge.startsWith('tajo') ? 'tajo' : ge]) atacar(S, H, ge);
}

export function paso(S, dt, pide = {}) {
  const H = [], y = S.yo;
  if (S.fin) { S.t += dt; S.remates.length = 0; return H; }
  S.t += dt;
  for (const ge of pide.gestos || []) pedir(S, H, ge);
  /* temporizadores tuyos */
  y.bloq = Math.max(0, y.bloq - dt);
  if (y.mov) { y.mov.t += dt; if (y.mov.t >= y.mov.dur) y.mov = null; }
  if (y.acc) {
    const a = y.acc; a.t += dt;
    if (!a.hecho && a.t >= a.imp) { a.hecho = true; resolverMio(S, H); }
    if (y.acc === a && (a.t >= a.dur || (y.pend && a.hecho && a.t >= a.imp + NUM.corte))) y.acc = null;      /* acaba, o se corta si hay otro guardado */
  }
  if (y.pend && !ocupado(y) && !S.fin) { const p = y.pend; y.pend = null; pedir(S, H, p); }
  /* escudo: arriba mientras se mantenga, si se puede y queda aliento */
  const puede = pide.escudo && y.fila === 1 && !y.acc && y.bloq <= 0 && y.aliento > 0;
  if (puede && !y.alzado) { y.alzado = true; y.tAlzo = S.t; } else if (!puede) y.alzado = false;
  if (y.alzado) y.aliento = Math.max(0, y.aliento - NUM.escudoGasto * dt);
  else if (!y.acc) y.aliento = Math.min(NUM.aliento, y.aliento + NUM.recobra * dt * (y.fila === 2 ? NUM.recobra2 : 1));
  /* pegado mucho rato: te rodean */
  if (enLinea(S) && y.dist === 2) {
    y.pegadoT += dt;
    if (!y.rodeado && y.pegadoT > NUM.rodea) { y.rodeado = true; y.tRod = 0; H.push({ tipo: 'rodeado' }); }
    if (y.rodeado) { y.tRod += dt; if (y.tRod >= NUM.flanco) { y.tRod -= NUM.flanco; H.push({ tipo: 'flanco', lado: azar(S) < 0.5 ? 'izq' : 'der' }); herir(S, H, 'flanco'); } }
  } else { y.pegadoT = 0; if (y.rodeado) { y.rodeado = false; H.push({ tipo: 'libre' }); } }
  /* mucho rato sin matar: un galo de al lado te tira un golpe (con aviso) */
  if (enLinea(S) && !S.fin && S.t - y.tMata > NUM.lado && S.t >= y.tLadoSig) {
    y.tLadoSig = S.t + entre(S, NUM.ladoCada);
    const cand = [y.puesto - 1, y.puesto + 1].filter(c => c >= 0 && c < N && S.cols[c].frente && S.cols[c].frente.estado === 'guardia');
    if (cand.length) { const g = S.cols[cand[Math.floor(azar(S) * cand.length)]].frente; g.estado = 'arma'; g.t = 0; g.dur = NUM.ladoArma; g.rapido = false; g.contraYo = true;
      H.push({ tipo: 'arma', c: g.c, lado: true, dur: g.dur }); }
  }
  /* remates de los compañeros */
  for (let i = S.remates.length - 1; i >= 0; i--) { const r = S.remates[i]; if (S.t < r.t) continue; S.remates.splice(i, 1);
    if (r.g.estado === 'deseq' && S.cols[r.c].frente === r.g && !S.fin) { const k = S.comp[r.c === y.puesto ? Math.min(N - 1, Math.max(0, y.puesto + (r.nombre === 'Tito' ? 1 : -1))) : r.c]; k.clip = 'golpear'; k.t0 = S.t - 0.45; k.sig = S.t + 1.2;
      H.push({ tipo: 'remate', nombre: r.nombre, c: r.c }); galoCae(S, H, r.g, 'remate'); } }
  /* galos */
  for (const col of S.cols) {
    const g = col.frente; if (!g || S.fin === 'rompe') continue;
    g.t += dt; const mio = g.c === y.puesto && enLinea(S);
    if (g.estado !== 'cae') { g.tLado -= dt; if (g.tLado <= 0 && (g.estado === 'guardia' || g.estado === 'tras')) { g.lado = g.lado === 'izq' ? 'der' : 'izq'; g.tLado = entre(S, NUM.cambio); } }
    if (mio && y.dist === 0 && !y.mov && g.estado !== 'cae') { g.tLejos += dt; if (g.tLejos > NUM.avanza) { g.tLejos = 0; y.dist = 1; H.push({ tipo: 'avanza', c: g.c }); } } else g.tLejos = 0;
    if (g.t < g.dur) continue;
    switch (g.estado) {
      case 'llega': g.estado = 'guardia'; g.t = 0; g.dur = entre(S, NUM.guardia); H.push({ tipo: 'llega', c: g.c }); break;
      case 'guardia': g.rapido = azar(S) < NUM.pRapido; g.estado = 'arma'; g.t = 0;
        g.dur = (g.rapido ? NUM.rapido : NUM.arma) * (mio && y.dist === 2 ? NUM.pegadoK : 1); if (mio) H.push({ tipo: 'arma', c: g.c, rapido: g.rapido, dur: g.dur }); break;
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
