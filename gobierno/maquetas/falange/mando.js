/* Pieza «mando» (LP6, falange): el control de «Manípulo a pie» (LP3) puesto a la falange. Corre en Node: no toca el DOM.
   Diseño: gobierno/estudios/LP0-como-se-pelea-a-pie.md §3. Pedido del usuario (24/11): «Me falta moverme hacia delante, y ver
   cómo luchan, que no sea solo tocar un botón, y que luchen hasta que quedan el 15 %».
   - Dibujas el frente con el dedo (dedos.js de la maqueta del bloque) y el muro marcha hasta allí: gira como una puerta y pesa.
     Lo mueve js/bloque.js (LP1) con un bloque «sombra» de 12 de frente: su ancla y su rumbo pasan al pivote del motor
     (S.xF, S.zF, S.giro). El ancho no cambia (la falange no se estira). En el choque, la raya solo gira el muro en su sitio.
   - Órdenes: Picas (bajar o alzar las cinco) · Cerrar filas · Avanzar (antes del choque, marcha de frente; en el choque,
     ¡Empujad!) · Alto (antes, para; en el choque, ¡Aguantad!) · Retirada (BT1: el «retroceder» del motor; «Alto» lo para).
   - Los hombres pelean solos: en el choque, el «¡Ha!» de cada latido y la estocada del oficial van sin tocar nada; la lucha la
     resuelve el motor (js/falange.js, lucha() con fin = FIN_LUCHA: hasta que a un bando le queda el 15 %).
   Contrato: crearMando({ S, acc, avisa }) → { frente(p0, p1), haciaDonde(p0, p1), orden(n), paso(dt), lee(), meta(), reinicia() }
     lee() → { conviene: null | 'picas' | 'cerrar' | 'avanzar' | 'alto', vigente: { picas, cerrar, avanzar, alto }, texto: {...},
               marcha: bool, gira: bool, choque: bool }
   botMando(mando, S): un jugador que juega solo por el mando: toca la orden que se ilumina y dibuja el frente hacia el flanco.
   Licencia de juego: el control entero, las distancias (16 m para bajar las picas, 40 m de avance) y la lucha sola. */
import { crearBloque, dibujaFrente, paso as pasoBloque } from '../../../js/bloque.js';
import { FILES, DX, DZ, BAJAN, PULSO, VENTANA } from '../../../js/falange.js';

export const ORDENES = ['picas', 'cerrar', 'avanzar', 'alto', 'retirada'];   /* BT1: «Retirada» es el «retroceder» del motor (js/falange.js) */
export const BAJA_A = 16, AVANCE = 40;
const difAng = d => Math.atan2(Math.sin(d), Math.cos(d));

export function crearMando({ S, acc, avisa = () => {} }) {
  let B = null, kAuto = -99, tFrente = -9;
  const W = (FILES - 1) * DX;
  function nuevo() { B = crearBloque({ id: 'falange', tipo: 'falange', cols: FILES, hombres: FILES, dx: DX, dz: DZ, x: S.xF, z: S.zF, rumbo: S.giro }); kAuto = -99; }
  const desdeS = () => { B.x = S.xF; B.z = S.zF; B.rumbo = S.giro; };
  const vivo = () => S.fase !== 'fin' && !S.ganador;
  /* hacia dónde mirará la primera fila con esta raya: de las dos perpendiculares, la más cerca de la de ahora (sin media
     vuelta por dibujar al revés); si eso es girar más de 50°, la raya está de lado: mira hacia fuera de donde está el muro
     (la regla de la maqueta del bloque) */
  function haciaDonde(p0, p1) {
    const c1 = Math.atan2(p1.z - p0.z, p1.x - p0.x), c2 = c1 + Math.PI, r = S.giro;
    let a = Math.abs(difAng(c1 - r)) <= Math.abs(difAng(c2 - r)) ? c1 : c2;
    if (Math.abs(difAng(a - r)) > 50 * Math.PI / 180) {
      const Fx = Math.sin(c1), Fz = -Math.cos(c1), s = (S.xF - (p0.x + p1.x) / 2) * Fx + (S.zF - (p0.z + p1.z) / 2) * Fz;
      if (Math.abs(s) > 2) a = s < 0 ? c1 : c2;
    }
    return S.giro + difAng(a - S.giro);
  }
  /* la meta en js/bloque.js: un trazo del ancho del muro, hacia la derecha del rumbo elegido (sentido «dibujo») */
  function pon(cx, cz, rumbo) {
    desdeS(); const Dx = Math.cos(rumbo), Dz = Math.sin(rumbo);
    const m = dibujaFrente(B, { x: cx - Dx * W / 2, z: cz - Dz * W / 2 }, { x: cx + Dx * W / 2, z: cz + Dz * W / 2 }, { sentido: 'dibujo' });
    B.enChoque = !!S.choque; return m;
  }
  /* soltar la raya. Antes del choque: el muro va hasta ella. En el choque: solo gira en su sitio (no se sale de la lucha) */
  function frente(p0, p1) {
    if (!vivo() || !p0 || !p1) return null;
    const r = haciaDonde(p0, p1), m = S.choque ? pon(S.xF, S.zF, r) : pon((p0.x + p1.x) / 2, (p0.z + p1.z) / 2, r);
    if (m) { tFrente = S.T; avisa('frente', { meta: m, choque: S.choque }); }
    return m;
  }
  const marchando = () => !!(B && B.meta && (B.fase === 'marcha' || B.fase === 'gira'));
  const bajadas = () => S.filas.filter(Boolean).length;
  function orden(n) {
    if (!vivo()) return null;
    if (n === 'picas') { const bajar = bajadas() < BAJAN; for (let i = 0; i < BAJAN; i++) acc.fila(i, bajar); avisa('grito', { texto: bajar ? '¡Picas abajo!' : '¡Alzad las picas!' }); return bajar ? 'bajar' : 'alzar'; }
    if (n === 'cerrar') return acc.orden('cerrar');
    if (n === 'avanzar') {
      if (S.choque) return acc.orden('empujad');
      const F = { x: Math.sin(S.giro), z: -Math.cos(S.giro) }, m = pon(S.xF + F.x * AVANCE, S.zF + F.z * AVANCE, S.giro);
      if (m) { m.sinRaya = true; avisa('grito', { texto: '¡Adelante! ¡Paso a paso!' }); } return m ? 'marcha' : null;   /* sin raya: iría encima del enemigo */
    }
    if (n === 'retirada') {   /* BT1: el muro recula paso a paso, mirando al enemigo, hasta que se dé «Alto» (regla del motor: V_RETRO, cuesta cohesión) */
      if (S.orden === 'retroceder') return 'retrocede';
      if (B.meta) { B.meta = null; B.fase = 'quieto'; B.bisagra = null; }
      return acc.orden('retroceder');
    }
    if (n === 'alto') {
      if (S.orden === 'retroceder' && !S.choque) { acc.orden('retroceder'); avisa('grito', { texto: '¡Alto!' }); return 'alto'; }   /* repetir la orden la suelta: se paran */
      if (S.choque) return acc.orden('aguantar');
      if (B.meta) { B.meta = null; B.fase = 'quieto'; B.bisagra = null; avisa('grito', { texto: '¡Alto!' }); return 'alto'; }
      return 'nada';
    }
    return null;
  }
  /* cada paso, ANTES del motor: mueve el pivote con el bloque sombra y, en el choque, el «¡Ha!» del latido */
  function paso(dt) {
    if (!B) nuevo();
    if (S.T < B.T0 - 1e-6) nuevo(); B.T0 = S.T;
    if (!vivo()) { B.meta = null; return; }
    /* al chocar se acaba la marcha (la raya que iba más allá del enemigo no le hace atravesarlo) */
    if (S.choque && B.meta && !B.enChoque) { B.meta = null; B.fase = 'quieto'; B.bisagra = null; }
    if (B.meta) {
      desdeS(); pasoBloque(B, dt); S.xF = B.x; S.zF = B.z; S.giro = B.rumbo;
      if (B.fase === 'gira') S.motor.cohesion(-dt);
      if (B.fase === 'forma' || B.fase === 'quieto') B.meta = null;
    }
    if (!S.choque) return;
    /* los hombres pelean solos: «¡Ha!» en cada latido (empuja si toca) y el oficial clava si tiene a quién */
    const k = Math.round(S.T / PULSO);
    if (k !== kAuto && Math.abs(S.T - k * PULSO) <= VENTANA * 0.5) { kAuto = k; acc.toque(); if (S.yo.blanco) acc.estocada(); }
    else if (S.yo.blanco && S.yo.blanco.est === 'dentro') acc.estocada();
  }
  /* la orden que conviene ahora (una sola, la más urgente) */
  function cerca() {
    let d = 1e9; const M = S.motor; if (!M) return d;
    for (const h of S.ene) if (h.vivo && h.est !== 'huye') { const l = M.local(h.x, h.z); if (Math.abs(l.lado) < 14 && l.delante > -1) d = Math.min(d, l.delante); }
    return d;
  }
  function conviene() {
    if (!vivo()) return null;
    const colado = S.ene.some(h => h.vivo && h.est === 'dentro' && h.por === 'frente'), vuela = S.proyectiles.some(p => p.est === 1);
    const salva = S.riv && (S.riv.fase === 'pila') && !S.riv.salva, b = bajadas(), d = cerca();
    if (colado && S.orden !== 'cerrar') return 'cerrar';
    if ((vuela || salva) && b > 0 && !S.choque) return 'picas';                       /* alzadas paran los pila */
    if (b < BAJAN && !vuela && !salva && (S.choque || d < BAJA_A)) return 'picas';    /* bajadas ensartan al que llega */
    if (S.choque && S.coh < 50 && S.orden !== 'aguantar') return 'alto';
    if (S.choque && S.orden === 'aguantar' && S.coh >= 90) return 'alto';            /* ya se rehízo: suelta el aguantar */
    if (S.choque && S.coh >= 90 && !S.orden && !S.flanco) return 'avanzar';
    if (!S.choque && !marchando() && d > 26 && S.T - tFrente > 1) return 'avanzar';
    return null;
  }
  function lee() {
    const b = bajadas(), ch = !!S.choque;
    return {
      conviene: conviene(), choque: ch, marcha: marchando(), gira: !!(B && B.fase === 'gira'),
      vigente: { picas: b === BAJAN, cerrar: S.orden === 'cerrar', avanzar: ch ? S.orden === 'empujar' : marchando(), alto: S.orden === 'aguantar', retirada: S.orden === 'retroceder' },
      texto: { picas: b === BAJAN ? 'Alzar picas' : 'Bajar picas', cerrar: 'Cerrar filas', avanzar: ch ? 'Empujad' : 'Avanzar', alto: ch ? 'Aguantad' : 'Alto', retirada: 'Retirada' },
    };
  }
  nuevo();
  return { frente, haciaDonde, orden, paso, lee, conviene, meta: () => B && B.meta, bloque: () => B, reinicia: nuevo };
}

/* el jugador de las pruebas: solo usa el mando. Toca lo que se ilumina (como mucho una orden por segundo) y, si viene el flanco,
   dibuja una raya girada 57° hacia ese lado; resuelto, otra de frente. modo 'picas': solo picas y avanzar (ni cerrar, ni aguantar,
   ni empujar). modo 'nada': solo avanza, nunca baja las picas */
export function botMando(mando, S, modo = 'bien') {
  let t = -9, girado = 0;
  return function juega() {
    if (S.ganador || S.fase === 'fin') return;
    if (modo === 'nada') { if (S.T - t > 1 && !S.choque && !mando.meta()) { t = S.T; mando.orden('avanzar'); } return; }
    const Fl = S.flanco, obj = Fl && Fl.estado === 'viene' ? Fl.lado : 0;
    if (obj !== girado && S.choque) {
      girado = obj; const r = obj * 57 * Math.PI / 180, Dx = Math.cos(r), Dz = Math.sin(r);
      mando.frente({ x: S.xF - Dx * 4, z: S.zF - Dz * 4 }, { x: S.xF + Dx * 4, z: S.zF + Dz * 4 });
    }
    const c = mando.conviene(); if (c && S.T - t >= 1 && (modo !== 'picas' || c === 'picas' || (c === 'avanzar' && !S.choque))) { t = S.T; mando.orden(c); }
  };
}
