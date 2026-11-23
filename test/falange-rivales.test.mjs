/* AQVILA · FA5 · Prueba de los rivales de la falange (js/falange-rivales.js), sin pantalla.
   Uso: node test/falange-rivales.test.mjs. Una línea por comprobación; sale con 1 si algo falla.
   Lleva un crearFalange DE MENTIRA que imita el contrato de la cabecera de js/falange.js (S, S.motor, choque al cambiar
   h.toca, giro de 8°/s con tope ±90°). Al final monta cada rival sobre el js/falange.js real. */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RIVALES, variedad, rivalDe, GRADO } from '../js/falange-rivales.js';
import { crearUnidad } from '../js/falange.js';   /* FA4: la copia de la maqueta se borró; la pieza vive en el motor */

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const t0 = Date.now();
let fallos = 0;
const ok = (c, txt) => { console.log((c ? 'OK    ' : 'FALLA ') + txt); if (!c) fallos++; };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- crearFalange de mentira (contrato de js/falange.js) ---------- */
const PULSO = 1.6, VENTANA = 0.2, V_GIRO = 8 * GRADO, GIRO_MAX = Math.PI / 2, BAJA_T = 1, FILES = 12, DX = 0.78, DZ = 0.95, ALC = 4.35;
const ANCHO = FILES * DX / 2 + 0.3, HONDO = 7 * DZ + 0.3;
function crearFalange({ semilla = 1, rival, avisa, terreno = null, variedad: v = null }) {
  const azarM = mulberry32(semilla * 7919 + 13), av = avisa || (() => {});
  const S = { T: 0, fase: 'choque', ganador: null, causa: null, rival: rival.nombre, xF: 0, zF: 0, giro: 0, girando: 0, filas: [false, false, false, false, false],
    flanco: null, pulso: 0, orden: null, coh: 100, ganado: 0, pend: 0, choque: true, tChoque: 0, toques: { buenos: 0, malos: 0 }, kUsado: -1, yo: { i: 5, tEstocada: -9, blanco: null, muertes: 0 }, fal: [], ene: [], terreno, proyectiles: [], variedad: v };
  for (let i = 0; i < 96; i++) S.fal.push({ i, f: i % FILES, r: Math.floor(i / FILES), vivo: true });
  S.U = crearUnidad({ hombres: 96, nombre: 'Tu sintagma', ref: 84 });
  const fr = () => ({ x: Math.sin(S.giro), z: -Math.cos(S.giro) }), de = () => ({ x: Math.cos(S.giro), z: Math.sin(S.giro) });
  const bajadas = () => S.filas.filter(Boolean).length;
  S.motor = {
    llamaChoque: true, azar: azarM, avisa: av, unidad: o => crearUnidad(o),
    local(x, z) { const f = fr(), d = de(), dx = x - S.xF, dz = z - S.zF, delante = dx * f.x + dz * f.z, lado = dx * d.x + dz * d.z; return { delante, lado, ang: Math.atan2(lado, delante) }; },
    frente: () => (bajadas() ? ALC : 0), bajadas,
    entra(h, por) { h.est = 'dentro'; av('dentro', { h, por }); },
    caeRival(h) { h.vivo = false; h.muere = S.T; S.R.baja(1); av('cae', { h, quien: 'rival' }); },
    caeFalangita(h, causa) { h.vivo = false; S.U.baja(1); av('cae', { h, quien: 'falange', causa }); },
    cohesion(x) { S.coh = Math.max(0, Math.min(100, S.coh + x)); },
    flanco(lado, hombres, aviso = 8) { S.flanco = { lado, hombres, t0: S.T, tI: S.T + aviso, estado: 'viene', tR: null }; av('flanco', { lado, hombres }); },
    resuelveFlanco(estado) { const Fl = S.flanco; if (!Fl || Fl.estado !== 'viene') return; Fl.estado = estado; Fl.tR = S.T; av(estado === 'parado' ? 'flancoParado' : 'flancoEntra', { lado: Fl.lado }); },
    proyectil(desde, blanco) { if (!blanco.vivo) return; if (bajadas() <= 1 && azarM() < 0.6) return av('escudo', {}); S.motor.caeFalangita(blanco, 'bajas'); S.coh = Math.max(0, S.coh - 0.75); },
  };
  /* qué toca h, con los rectángulos del contrato: puntas por delante; cuerpo por el frente, los lados o la espalda */
  function toca(h) {
    const dx = h.x - S.xF, dz = h.z - S.zF; if (dx * dx + dz * dz > 60) return null; /* fuera de las puntas y del cuerpo: no toca */
    const l = S.motor.local(h.x, h.z), fx = S.motor.frente();
    if (Math.abs(l.lado) <= ANCHO && l.delante > 0.6 && l.delante <= fx + 0.6) return 'puntas';
    if (Math.abs(l.lado) <= ANCHO + 0.6 && l.delante <= 0.6 && l.delante >= -HONDO) return l.delante > -0.4 ? 'frente' : l.delante < -HONDO + 0.6 ? 'espalda' : l.lado > 0 ? 'der' : 'izq';
    return null;
  }
  let dir = 0; const obj = S.filas.slice(), tFila = [0, 0, 0, 0, 0];
  rival.crea(S, azarM);
  function paso(dt) {
    if (S.ganador) return;
    S.T += dt; S.giro = Math.max(-GIRO_MAX, Math.min(GIRO_MAX, S.giro + dir * V_GIRO * dt)); S.girando = dir;
    for (let i = 0; i < 5; i++) if (obj[i] !== S.filas[i]) { tFila[i] += dt; if (tFila[i] >= BAJA_T) { S.filas[i] = obj[i]; tFila[i] = 0; } }
    S.pulso = (S.T % PULSO) / PULSO;
    const r = S.orden === 'aguantar' ? 3 : S.orden === 'cerrar' ? 1.5 : S.orden === 'empujar' ? 0 : 1;
    S.coh = Math.min(100, S.coh + r * dt);
    if (S.orden === 'empujar' && S.coh < 60) S.orden = null;
    if (S.flanco && S.flanco.estado !== 'viene' && S.T >= S.flanco.tR + 5) S.flanco = null;
    S.U.cansa(dt, S.orden === 'empujar' ? 0.006 : -0.01); S.U.tic(dt);
    rival.paso(S, dt);
    for (const h of S.ene) { if (!h.vivo || S.ganador) continue; const t = toca(h); if (t !== h.toca) { h.toca = t; if (t) rival.choque(S, h); } }
    if (!S.ganador && S.ganado >= 15) { S.ganador = 'falange'; S.causa = 'empuje'; }
    if (!S.ganador && S.ganado <= -15) { S.ganador = 'rival'; S.causa = 'empuje'; }
    if (!S.ganador && (S.U.roto || S.coh <= 0)) { S.ganador = 'rival'; S.causa = S.causa || 'bajas'; }
  }
  return {
    S, paso,
    gira(d) { dir = Math.sign(d); S.girando = dir; },
    fila(i, bajada) { if (obj[i] !== bajada) { obj[i] = bajada; tFila[i] = 0; } },
    orden(n) { const k = n === 'empujad' ? 'empujar' : n; if (S.orden === k) { S.orden = null; return 'suelta'; } if (k === 'empujar' && S.coh < 60) return 'flojo'; S.orden = k; return k; },
    /* como el real: con aguantar, cerrar o retroceder no se toca; girando, tampoco; a compás gana medio metro (0,8 empujando) */
    toque() {
      if (S.ganador) return null; if (['aguantar', 'cerrar', 'retroceder'].includes(S.orden)) return 'nada'; if (dir) return 'gira';
      const k = Math.round(S.T / PULSO);
      if (Math.abs(S.T - k * PULSO) <= VENTANA && k !== S.kUsado) {
        S.kUsado = k; S.toques.buenos++; S.coh = Math.min(100, S.coh + 2); const em = S.orden === 'empujar';
        if (em) { S.coh -= 5; S.U.cansa(1, 0.02); } S.ganado += em ? 0.8 : 0.5; return 'bueno';
      }
      S.toques.malos++; S.coh = Math.max(0, S.coh - 8); S.ganado -= 0.25; return 'destiempo';
    },
  };
}

/* ---------- bots: solo usan avisos y S.riv.fase (lo que vería un jugador); el mediano tiene su propio dado ---------- */
const baja = F => { for (let i = 0; i < 5; i++) F.fila(i, true); };
const pon = (F, n) => { const k = n === 'empujad' ? 'empujar' : n; if (F.S.orden !== k) F.orden(n); };
const difAng = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
/* gira al flanco si llega (tope ±90°); a la espalda, «Cerrar filas»; cuando se retiran, vuelve al frente */
function botCaballeria(acierta) {
  let meta = 0;
  const decide = (F, ang) => { if (Math.abs(ang) <= 110 * GRADO) { meta = Math.max(-GIRO_MAX, Math.min(GIRO_MAX, ang)); pon(F, 'aguantar'); } else pon(F, 'cerrar'); };
  return {
    inicio(F) { baja(F); },
    aviso(F, tipo, d, dado) {
      if (tipo === 'rumbo') { if (dado() < acierta) decide(F, difAng(d.angulo, 0)); }
      else if (tipo === 'finta') {
        if (dado() >= acierta) return;
        const ang = difAng(d.angulo, 0), alcanza = Math.abs(ang) <= 110 * GRADO && Math.abs(difAng(Math.max(-GIRO_MAX, Math.min(GIRO_MAX, ang)), F.S.giro)) - 20 * GRADO <= V_GIRO * d.t;
        if (alcanza) decide(F, ang); else pon(F, 'cerrar');
      }
    },
    paso(F) {
      if (F.S.riv.fase === 'vuelve') { meta = 0; pon(F, 'aguantar'); }
      const d = difAng(meta, F.S.giro); F.gira(Math.abs(d) < 1 * GRADO ? 0 : d);
    },
  };
}
const noGira = { inicio(F) { baja(F); }, aviso() {}, paso() {} };
function botElefantes(acierta) {
  return {
    inicio(F) { baja(F); pon(F, 'aguantar'); },
    aviso(F, tipo, d, dado) {
      if (tipo === 'salva' && dado() < acierta) for (let i = 0; i < 5; i++) F.fila(i, false);
      if (tipo === 'barrito' && dado() < acierta) for (let i = 0; i < 5; i++) F.fila(i, true);
      if (tipo === 'hueco') F.cuelan = true;
      if (tipo === 'cerrado') { F.cuelan = false; pon(F, 'aguantar'); }
    },
    paso(F, dt, dado) { if (F.cuelan && (F.tDec = (F.tDec || 0) + dt) >= 1) { F.tDec = 0; if (dado() < acierta) pon(F, 'cerrar'); } },
  };
}
const nuncaBaja = { inicio(F) { for (let i = 0; i < 5; i++) F.fila(i, false); }, aviso() {}, paso() {} };
const siempreBajadas = { inicio(F) { baja(F); pon(F, 'aguantar'); }, aviso(F, tipo) { if (tipo === 'hueco') pon(F, 'cerrar'); if (tipo === 'cerrado') pon(F, 'aguantar'); }, paso() {} };
function botEmpuje(acierta) {
  let prev = 0, destiempo = false;
  return {
    inicio(F) { baja(F); pon(F, 'empujar'); },
    aviso(F, tipo, d, dado) {
      if (tipo === 'oleada') pon(F, dado() < acierta ? 'aguantar' : 'empujar');
      if (tipo === 'gastado') pon(F, dado() < acierta ? 'empujar' : 'aguantar');
    },
    paso(F, dt, dado) {
      const p = F.S.pulso;
      if (p < prev && F.S.orden === null && F.S.riv.fase !== 'prepara' && F.S.riv.fase !== 'oleada') pon(F, 'empujar');
      if (p < prev) { destiempo = dado() >= acierta; if (!destiempo) F.toque(); }
      if (destiempo && prev < 0.5 && p >= 0.5) { F.toque(); destiempo = false; }
      prev = p;
    },
  };
}
const aDestiempo = () => ({ prev: 0, inicio(F) { baja(F); pon(F, 'empujar'); }, aviso() {}, paso(F) { const p = F.S.pulso; if (this.prev < 0.5 && p >= 0.5) F.toque(); this.prev = p; } });

const BOTS = {
  caballeria: { ganador: () => botCaballeria(1), perdedor: () => noGira, mediano: () => botCaballeria(0.6) },
  elefantes: { ganador: () => botElefantes(1), perdedor: () => nuncaBaja, mediano: () => botElefantes(0.6), siempre: () => siempreBajadas },
  falange: { ganador: () => botEmpuje(1), perdedor: aDestiempo, mediano: () => botEmpuje(0.6) },
  hoplitas: { ganador: () => botEmpuje(1), perdedor: aDestiempo, mediano: () => botEmpuje(0.6) },
};

/* una partida con la falange de mentira (o con la que se pase en fabrica): { ganador, T, bajas, S } */
function juega(nombre, semilla, botDe, dt = 1 / 30, vigila, fabrica = crearFalange) {
  const v = variedad(mulberry32(semilla)), dado = mulberry32(semilla + 999); v.rival = nombre;
  const cola = [], bot = botDe();
  const F = fabrica({ semilla, rival: RIVALES[nombre], avisa: (t, d) => cola.push([t, d]), terreno: v.terreno, variedad: v });
  if (bot.inicio) bot.inicio(F);
  while (!F.S.ganador && F.S.T < 300) {
    while (cola.length) { const [t, d] = cola.shift(); bot.aviso(F, t, d, dado); }
    bot.paso(F, dt, dado); F.paso(dt); if (vigila) vigila(F.S);
  }
  return { ganador: F.S.ganador || 'empate', T: F.S.T, bajas: F.S.U.hombres - F.S.U.enPie, S: F.S };
}

/* ---------- comprobaciones ---------- */
const N = 100, tabla = [], tablaReal = [];
/* varas contra el real que dependen de una regla de js/falange.js: se imprimen sin romper la prueba */
const PENDIENTE_MOTOR = [];
for (const nombre of Object.keys(RIVALES)) {
  ok(RIVALES[nombre].nombre === nombre, `${nombre}: el módulo lleva su nombre`);
  const fila = { rival: nombre };
  for (const b of Object.keys(BOTS[nombre])) {
    let gana = 0, T = 0, bj = 0;
    let fuera = 0; const causas = {};
    for (let s = 1; s <= N; s++) { const r = juega(nombre, s, BOTS[nombre][b]); if (r.ganador === 'falange') gana++; T += r.T; bj += r.bajas; if (r.ganador === 'falange' && (r.T < 40 || r.T > 180)) fuera++; causas[r.S.causa] = (causas[r.S.causa] || 0) + 1; }
    fila[b] = { gana: gana / N, T: T / N, bajas: bj / N, fuera, causas };
  }
  tabla.push(fila);
  ok(fila.ganador.gana >= 0.9, `${nombre}: el bot ganador gana ${(fila.ganador.gana * 100).toFixed(0)} % (≥ 90 %)`);
  ok(fila.perdedor.gana <= 0.1, `${nombre}: el bot perdedor pierde ${(100 - fila.perdedor.gana * 100).toFixed(0)} % (≥ 90 %)`);
  ok(fila.ganador.T >= 40 && fila.ganador.T <= 180, `${nombre}: con el ganador la lucha dura ${fila.ganador.T.toFixed(0)} s de media (40–180)`);
  console.log(`      ${nombre}: el mediano (acierta 6 de 10) gana ${(fila.mediano.gana * 100).toFixed(0)} %: ${fila.mediano.gana > fila.perdedor.gana && fila.mediano.gana < fila.ganador.gana ? 'entre el perdedor y el ganador' : 'NO queda entre los dos'} (sin vara)`);
  if (fila.siempre) ok(fila.siempre.bajas >= 2 * fila.ganador.bajas, `${nombre}: «siempre bajadas» sufre ${fila.siempre.bajas.toFixed(1)} bajas, ganador ${fila.ganador.bajas.toFixed(1)} (≥ 2×)`);
}
for (const f of tabla) console.log(`      ${f.rival}: ganadas por el ganador fuera de 40–180 s: ${f.ganador.fuera} de ${N}; causas ${JSON.stringify(f.ganador.causas)} (sin vara)`);
/* ganador y causa con los nombres del contrato */
{
  let malo = 0; for (const nombre of Object.keys(RIVALES)) for (const b of Object.keys(BOTS[nombre])) for (let s = 1; s <= 5; s++) {
    const r = juega(nombre, s, BOTS[nombre][b]); if (!['falange', 'rival'].includes(r.ganador) || !['empuje', 'bajas', 'flanco', 'hueco', 'animo'].includes(r.S.causa)) malo++;
  }
  ok(!malo, `S.ganador es 'falange' o 'rival' y S.causa es del contrato (${malo} fuera)`);
}
/* determinismo */
for (const nombre of Object.keys(RIVALES)) {
  const a = juega(nombre, 42, BOTS[nombre].mediano), b = juega(nombre, 42, BOTS[nombre].mediano);
  const foto = S => JSON.stringify(S.ene.map(h => [h.x, h.z, h.vivo, h.est]));
  ok(a.ganador === b.ganador && a.T === b.T && a.bajas === b.bajas && foto(a.S) === foto(b.S), `${nombre}: misma semilla, mismo final`);
}
/* rangos sin NaN */
for (const nombre of Object.keys(RIVALES)) {
  let malo = '';
  const vig = S => {
    if (malo) return; const r = S.riv;
    if (!(r.animo >= 0 && r.animo <= 1) || !(S.R.animo >= 0 && S.R.animo <= 1)) malo = 'ánimo ' + r.animo;
    if (!(S.coh >= 0 && S.coh <= 100)) malo = 'cohesión ' + S.coh;
    if (!Number.isFinite(r.linea) || !Number.isFinite(r.T)) malo = 'línea o tiempo';
    if (!S.ene.length) malo = 'S.ene vacío';
    for (const h of S.ene) if (!Number.isFinite(h.x) || !Number.isFinite(h.z) || !Number.isFinite(h.yaw)) { malo = 'posición de ' + h.i; break; }
  };
  for (let s = 1; s <= 5; s++) for (const b of Object.keys(BOTS[nombre])) juega(nombre, s, BOTS[nombre][b], 1 / 30, vig);
  ok(!malo, `${nombre}: ningún número se sale de rango${malo ? ' (' + malo + ')' : ''}`);
}
/* choque idempotente (con y sin h.toca) */
for (const nombre of Object.keys(RIVALES)) for (const toca of [null, 'der']) {
  const F = crearFalange({ semilla: 5, rival: RIVALES[nombre], variedad: { rival: nombre, lado: 1, terreno: null, fuerza: 0.5 } });
  let h;
  if (nombre === 'caballeria') { for (let i = 0; i < 400 && F.S.riv.fase !== 'rodea'; i++) F.paso(1 / 30); h = F.S.riv.hombres[0]; }
  else if (nombre === 'elefantes') { F.S.riv.carga = 1; h = F.S.riv.bestias[0]; }
  else h = toca ? F.S.ene[0] : { bT: 0, contacto: null, res: null };
  h.toca = toca;
  const foto = () => JSON.stringify([F.S.coh, F.S.U.enPie, F.S.U.animo, F.S.riv.animo, F.S.riv.linea, F.S.riv.coh || 0, F.S.ene.filter(x => x.vivo).length]);
  const r1 = RIVALES[nombre].choque(F.S, h), e1 = foto(), r2 = RIVALES[nombre].choque(F.S, h), e2 = foto();
  ok(r1 === r2 && e1 === e2 && ['frena', 'cae', 'entra', 'espanta', 'hueco', 'para'].includes(r1), `${nombre}: choque repetido no cuenta dos veces (toca ${toca}: ${r1})`);
}
/* variedad */
{
  const vis = { rival: new Set(), lado: new Set(), terreno: new Set() };
  for (let s = 1; s <= 200; s++) { const v = variedad(mulberry32(s)); vis.rival.add(v.rival); vis.lado.add(v.lado); vis.terreno.add(v.terreno ? Math.sign(v.terreno.x) : 0); }
  ok(vis.rival.size === 4 && vis.lado.size === 2 && vis.terreno.size === 3, `variedad reparte: ${vis.rival.size} rivales, ${vis.lado.size} lados, ${vis.terreno.size} terrenos (izquierda, derecha, ninguno)`);
  ok(JSON.stringify(variedad(mulberry32(7))) === JSON.stringify(variedad(mulberry32(7))), 'variedad: misma semilla, misma partida');
  ok(rivalDe('elefantes') === RIVALES.elefantes && rivalDe('nada') === null, 'rivalDe encuentra por nombre');
}
/* sin pantalla */
{
  const fuente = readFileSync(RAIZ + 'js/falange-rivales.js', 'utf8');
  ok(!/\b(document|window)\b/.test(fuente) && !/Math\.random/.test(fuente), 'el archivo no nombra document ni window ni usa Math.random');
}
/* mismo resultado de clase con dt 1/30 y 1/60 */
for (const nombre of Object.keys(RIVALES)) {
  let igual = 0, n = 0;
  for (const b of ['ganador', 'perdedor']) for (let s = 1; s <= 8; s++) { n++; if (juega(nombre, s, BOTS[nombre][b], 1 / 30).ganador === juega(nombre, s, BOTS[nombre][b], 1 / 60).ganador) igual++; }
  ok(igual / n >= 0.9, `${nombre}: dt 1/30 y 1/60 dan el mismo final en ${igual} de ${n}`);
}
/* la falange real: monta cada rival, 600 pasos de 1/30 con filas bajadas; sin error, sin NaN y con gente en S.ene */
{
  const ruta = RAIZ + 'js/falange.js';
  if (!existsSync(ruta)) console.log('      falange.js real: aún no');
  else {
    const real = await import(pathToFileURL(ruta).href);
    let listo = true;
    for (const nombre of Object.keys(RIVALES)) {
      let err = '';
      try {
        const F = real.crearFalange({ semilla: 3, rival: RIVALES[nombre] });
        if (!(typeof F.bot === 'function' && Array.isArray(F.S.ene) && F.S.ene.length > 0)) listo = false;
        for (let i = 0; i < 5; i++) F.fila(i, true);
        for (let k = 0; k < 600; k++) F.paso(1 / 30);
        const S = F.S;
        if (!Array.isArray(S.ene) || !S.ene.length) { if (listo) err = 'S.ene vacío'; else console.log(`      falange.js real con ${nombre}: S.ene vacío (el esqueleto aún no llama a crea)`); }
        else if (S.ene.some(h => !Number.isFinite(h.x) || !Number.isFinite(h.z))) err = 'NaN en S.ene';
      } catch (e) { err = 'error: ' + e.message; listo = false; }
      ok(!err, `falange.js real con ${nombre}: monta y da 600 pasos${err ? ' (' + err + ')' : ''}`);
    }
    if (!listo) console.log('      real: esqueleto, varas en espera');
    else for (const nombre of Object.keys(RIVALES)) {
      /* varas contra el real: se activan solas cuando F.bot y S.fase === 'choque' funcionan */
      const fab = m => real.crearFalange({ semilla: m.semilla, rival: m.rival, avisa: m.avisa }), fila = { rival: nombre };
      for (const b of ['ganador', 'perdedor']) {
        let g = 0, T = 0, bj = 0; const cs = {};
        for (let s = 1; s <= 50; s++) { const r = juega(nombre, s, BOTS[nombre][b], 1 / 30, null, fab); if (r.ganador === 'falange') g++; T += r.T; bj += r.bajas; cs[r.S.causa] = (cs[r.S.causa] || 0) + 1; }
        fila[b] = { gana: g / 50, T: T / 50, bajas: bj / 50, causas: cs };
      }
      tablaReal.push(fila);
      const v = [fila.ganador.gana >= 0.9, fila.perdedor.gana <= 0.1, fila.ganador.T >= 40 && fila.ganador.T <= 180];
      const txt = `real con ${nombre}: ganador gana ${(fila.ganador.gana * 100).toFixed(0)} % en ${fila.ganador.T.toFixed(0)} s, perdedor gana ${(fila.perdedor.gana * 100).toFixed(0)} %; causas ganador ${JSON.stringify(fila.ganador.causas)}, perdedor ${JSON.stringify(fila.perdedor.causas)}`;
      if (PENDIENTE_MOTOR.includes(nombre) && !v.every(Boolean)) console.log('PENDIENTE (motor) ' + txt); else ok(v.every(Boolean), txt);
    }
  }
}

console.log(`\n  % de victorias de la falange (${N} semillas, falange de mentira) · duración media (s) · bajas medias`);
console.log('  rival        ganador            mediano            perdedor           siempre bajadas');
const c = x => x ? `${(x.gana * 100).toFixed(0).padStart(3)} % ${x.T.toFixed(0).padStart(4)} s ${x.bajas.toFixed(1).padStart(5)}` : '        —         ';
for (const f of tabla) console.log('  ' + f.rival.padEnd(12) + ' ' + [f.ganador, f.mediano, f.perdedor, f.siempre].map(c).join('  '));
if (tablaReal.length) { console.log('\n  Contra js/falange.js real (50 semillas)'); for (const f of tablaReal) console.log('  ' + f.rival.padEnd(12) + ' ' + [f.ganador, f.mediano, f.perdedor, f.siempre].map(c).join('  ')); }
console.log(`\n  ${fallos ? fallos + ' FALLOS' : 'TODO EN VERDE'} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fallos ? 1 : 0);
