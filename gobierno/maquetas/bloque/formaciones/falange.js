/* FU3 · Formación «falange» del motor único de batalla a pie (plan: gobierno/estudios/FU0-plan-motor-batalla.md §4 FU3). TANDA 1: solo lógica.
   Las reglas de la falange NO se reescriben: se enchufan. Este archivo es un ADAPTADOR: crea la falange igual que su maqueta con el
   control del bloque (gobierno/maquetas/falange/escena.js: crearAcciones = crearFalange + lo de vestir a cada hombre, y crearMando) y la
   presenta a la escena del bloque con la forma del combate de js/bloque-ia.js. No hay ni una cifra nueva.
   Contrato de las formaciones: el de formaciones/manipulo.js (id, ordenes, objetivo, escenario, muroDelante, util, mods, guardia, monta,
   paso, alAviso), y además:
     combate(m) → C, con m = { semilla (1), rival ('manipulos' por defecto; los nombres de js/falange-rivales.js), avisa, H, hombres, fin, vestir, vivo }
       vivo (FU4): true = el rival se mueve solo y es más numeroso, y se lucha hasta el 15 % (crearFalange con vivo). C.resumen() trae perdidos y matados.
       vestir: true = crearAcciones de la maqueta (viste a cada hombre para el dibujo, y con ello cambian las tiradas); por defecto, crearFalange directo.
       fin: FIN_LUCHA por defecto (como la maqueta con el control del bloque: se lucha hasta el 15 %); null = las reglas de FA1 tal cual.
     C = { S, paso(dt), frente({ x, z, ang }), dibujaFrente(p0, p1), orden(n), ordenUtil(), giroUtil(), bot(modo), trabado(), resumen(),
           crudo (el objeto de crearFalange, o el de crearAcciones con vestir: S, reinicia, paso, bot…), mando (crearMando) }
     C.bot(modo) es UN toque del bot por paso (como en bloque-ia): 'bueno' = botMando del mando; 'compas' | 'destiempo' | 'nogira' | 'loco'
       = los bots de FA1 (crearFalange.bot). Con un bot de FA1 el mando se aparta (no toca el compás solo): mismas cifras que FA1.
     C.S (se rehace en cada paso; nadie de fuera lo escribe):
       T, ganador (null | 'tuyo' | 'enemigo'), causa, rival (nombre), escenario null, salva null, amigas [], flanco (null | { lado, de, finta: false, estado }),
       tuyo (bloque: x, z = centro de la primera fila = pivote S.xF, S.zF; ang = giro; ancho, fondo, U = la unidad de la falange, coh, estado,
             orden (la última de las cuatro), contactos, papel 'tuyo', bando 'r', tipo 'falange', fila (cansancio), relevos/vueltas/retiradas 0),
       B { hombres: los falangitas de verdad (S.fal) con fila = r y col = f añadidos }, bloques [tuyo, rival], ene { centro: rival, alas: [], reserva: null, tiradores: null },
       cuenta (los contadores de bloque-ia a 0), fal (la S de la falange, para el dibujo).
     El bloque rival se hace de S.ene: centro de su primera fila y ángulo medios de los que siguen en pie, U = S.R. Sus hombres de verdad están en S.fal.ene.
   Ejes: el «frente» del bloque (sen a, −cos a) es el de la falange (sen giro, −cos giro); yaw = π − ang en los dos.
   Licencia de juego: la de mando.js y js/falange.js (aquí no se añade ninguna regla). */
import { FIN_LUCHA, FILES, DX, DZ, BOTS as BOTS_FA1 } from '../../../../js/falange.js';
import { crearFalange } from '../../../../js/falange.js';
import { rivalDe } from '../../../../js/falange-rivales.js';
import { crearAcciones } from '../../falange/acciones.js';
import { crearPaso, velocidad, pisa } from '../../falange/locomocion.js';
import { crearMando, botMando, ORDENES } from '../../falange/mando.js';
import { T_BAJADAS } from '../falangita.js';
import { NPILA } from '../../falange/acciones.js';
import { generaTabla, filasNuevo, CJ } from '../../falange/soldados.js';   /* FU3c: los gestos de brazos de FA2 (filas de huesos), no copiados */
import { cargarSoldado } from '../../../../js/gfx/soldado.js';
import { SARISA, AGARRE, CARRIL as CARRIL_VIEJO, BAJAN, alzada, bajada, abanicoObj } from '../../falange/formacion.js';

const GANADOR = { falange: 'tuyo', rival: 'enemigo' };
const CUENTA0 = () => ({ flanqueado: 0, salvas: 0, salvasTestudo: 0, pilum: 0, relevos: 0, cargas: 0, fintas: 0, retiradas: 0, muertosSuelta: 0, rotaRetira: 0, retiradasGalas: 0 });

export function combate(m = {}) {
  const vivo = !!m.vivo, fin = vivo ? FIN_LUCHA : m.fin !== undefined ? m.fin : FIN_LUCHA;   /* FU4: m.vivo (por defecto no) = rival que se mueve solo, más numeroso, hasta el 15 % */
  /* las reglas, con lo mismo que les pone crearAcciones (locomoción y zancadas de la maqueta). OJO: crearAcciones además «viste» a cada
     hombre ANTES del primer paso del motor (h.paso, h.fase) y eso cambia las tiradas: con vestir: true se usa tal cual (la partida de la
     maqueta de la falange); sin él, la de crearFalange directo (mismas cifras que FA1) */
  const nombre = m.rival || 'manipulos', semilla = m.semilla ?? 1;
  const A = m.vestir ? crearAcciones({ semilla, rival: nombre, avisa: m.avisa, H: m.H, hombres: m.hombres, fin, vivo })
    : crearFalange({ semilla, rival: rivalDe(nombre) || undefined, avisa: m.avisa, H: m.H, hombres: m.hombres, locomocion: { crearPaso, velocidad, pisa }, zancadas: { walk: 1.5, run: 2.2 }, fin, vivo });
  const F = A.S, M = crearMando({ S: F, acc: A, avisa: m.avisa });
  const tuyo = { id: 'falange', bando: 'r', tipo: 'falange', papel: 'tuyo', x: 0, z: 0, ang: 0, ancho: (FILES - 1) * DX, fondo: 0, U: F.U, coh: 100, fila: 0,
    relevos: 0, vueltas: 0, retiradas: 0, k: 0, orden: null, estado: 'forma', contactos: [], obj: null, tRelevo: -1 };
  const riv = { id: 'rival', bando: 'g', tipo: F.rival, papel: 'centro', x: 0, z: 0, ang: Math.PI, ancho: 0, fondo: 0, U: F.R, coh: 100, fila: 0,
    relevos: 0, vueltas: 0, retiradas: 0, k: 0, orden: null, estado: 'marcha', contactos: [], obj: null, tRelevo: -1 };
  const S = { T: 0, nivel: 'normal', ganador: null, causa: null, rival: m.rotulo || F.rival, escenario: null, salva: null, amigas: [], flanco: null,
    tuyo, B: { hombres: F.fal, cols: FILES, rumbo: F.giro || 0 }, bloques: [tuyo, riv], ene: { centro: riv, alas: [], reserva: null, tiradores: null }, cuenta: CUENTA0(), fal: F };
  /* FU3b: la raya del frente (la meta del mando) se queda pintada mientras el muro marcha hacia ella */
  Object.defineProperty(S.B, 'meta', { get: () => M.meta() || null, enumerable: false });
  let modoFA1 = false; const bots = {};

  /* el bloque rival: centro de su primera fila, ángulo medio, ancho y fondo de los que siguen en pie */
  function rival() {
    const v = F.ene.filter(h => h.vivo && h.est !== 'huye'), L = v.length ? v : F.ene.filter(h => h.vivo);
    riv.U = F.R; riv.tipo = F.rival;
    if (!L.length) { riv.estado = 'fuera'; return; }
    let sx = 0, sz = 0, ss = 0, sc = 0;
    for (const h of L) { sx += h.x; sz += h.z; ss += Math.sin(Math.PI - h.yaw); sc += Math.cos(Math.PI - h.yaw); }
    const cx = sx / L.length, cz = sz / L.length, a = Math.atan2(ss, sc), Fx = Math.sin(a), Fz = -Math.cos(a), Dx = Math.cos(a), Dz = Math.sin(a);
    let d0 = Infinity, d1 = -Infinity, l0 = Infinity, l1 = -Infinity;
    for (const h of L) { const d = (h.x - cx) * Fx + (h.z - cz) * Fz, l = (h.x - cx) * Dx + (h.z - cz) * Dz; d0 = Math.min(d0, d); d1 = Math.max(d1, d); l0 = Math.min(l0, l); l1 = Math.max(l1, l); }
    riv.ang = a; riv.x = cx + Fx * d1; riv.z = cz + Fz * d1; riv.ancho = Math.max(DX, l1 - l0); riv.fondo = d1 - d0;
    riv.estado = F.R.roto ? 'huye' : F.choque ? 'choque' : 'marcha';
    riv.contactos = F.choque ? [{ b: tuyo, zona: 'frente' }] : [];
  }
  /* rehace la vista de bloque desde la S de la falange */
  function sincroniza() {
    for (const h of F.fal) { h.fila = h.r; h.col = h.f; }
    const vivos = F.fal.filter(h => h.vivo), filas = vivos.length ? Math.max(...vivos.map(h => h.r)) + 1 : 0;
    tuyo.x = F.xF; tuyo.z = F.zF; tuyo.ang = F.giro; tuyo.U = F.U; tuyo.coh = F.coh; tuyo.fondo = Math.max(0, filas - 1) * DZ; tuyo.fila = F.U.cansancio ?? 0;
    const L = M.lee();
    tuyo.estado = F.fase === 'fin' ? (F.U.roto || F.ganador === 'rival' ? 'huye' : 'forma') : F.choque ? 'choque' : L.marcha ? 'marcha' : 'forma';
    tuyo.contactos = F.choque ? [{ b: riv, zona: 'frente' }] : [];
    rival();
    S.T = F.T; S.ganador = F.ganador ? GANADOR[F.ganador] || null : null; S.causa = F.causa || null; S.rival = m.rotulo || F.rival; S.B.hombres = F.fal; S.B.rumbo = F.giro || 0;   /* FU3: la cámara del oficial sigue el rumbo del muro */
    S.flanco = F.flanco ? { lado: F.flanco.lado, de: riv, finta: false, estado: F.flanco.estado } : null;
  }

  const C = {
    S, crudo: A, mando: M, motor: A.motor || (A.F && A.F.motor) || null,   /* FU3b: caeRival, caeFalangita, cohesion (para falangita.js) */
    paso(dt) { if (!modoFA1) M.paso(dt); A.paso(dt); sincroniza(); },
    /* la raya que espera el mando: perpendicular al frente pedido, del ancho del muro, centrada en (x, z) */
    frente({ x, z, ang }) { modoFA1 = false; const w = tuyo.ancho / 2, Dx = Math.cos(ang), Dz = Math.sin(ang); return M.frente({ x: x - Dx * w, z: z - Dz * w }, { x: x + Dx * w, z: z + Dz * w }); },
    dibujaFrente(p0, p1) { modoFA1 = false; return M.frente(p0, p1); },
    orden(n) { if (!ORDENES.includes(n)) return null; modoFA1 = false; const r = M.orden(n); tuyo.orden = n; return r; },
    ordenUtil() { const c = M.lee().conviene; return ORDENES.includes(c) ? c : null; },
    giroUtil: () => false,
    trabado: () => !!F.choque,
    bot(modo = 'bueno') {
      if (BOTS_FA1.includes(modo)) { modoFA1 = true; return A.bot(modo); }
      modoFA1 = false; const mm = modo === 'bueno' ? 'bien' : modo;
      return (bots[mm] || (bots[mm] = botMando(M, F, mm)))();
    },
    resumen: () => A.resumen()
  };
  sincroniza();
  return C;
}

/* ---------- TANDA 2: el dibujo de las sarisas (solo en la escena: monta y paso reciben THREE por ctx; nada de esto corre en Node) ----------
   Una InstancedMesh para las sarisas y otra para los muñones (h.picaRota): dos llamadas de dibujo. La sarisa va en la mano del
   falangita que se ve (la figura de tropas.js que sigue a ese hombre): alzada en abanico (alzada(): las filas de atrás inclinadas
   hacia delante) y bajada al frente según h.kB, la mano a la altura del carril de su fila (CARRIL). Sin gestos de brazos de FA2.
   La geometría es la de falange/escena.js (geoSarisa y geoMunon: mismas piezas y colores), rehecha aquí porque aquella escena no la exporta. */
/* FU3c: el carril de cada sarisa en ESTA escena: la 1.ª fila, a la cadera como siempre; las de detrás, todas en el mismo pasillo (a 33 cm a la derecha de su hombre: justo fuera
   de su hombro y entre el hombro y el escudo del vecino de la derecha, que cuelga al pecho) y a la altura de su fila, sin cruzar cascos ni escudos. Solo dibujo */
const CARRIL_FU3C = r => { const c = CARRIL_VIEJO(r); return r === 0 ? c : { x: 0.33, y: c.y }; };
/* BT1 (F0, «las sarisas atraviesan a los compañeros»): las filas 2.ª a 5.ª llevan la sarisa POR ENCIMA de los hombros de los de delante y del
   escudo del vecino (su borde de arriba va a 1,57 m), en dos pasillos que se alternan fila a fila: A, a 48 cm de su hombre (entre su brazo y la
   cabeza del vecino), y B, a 28 cm (entre su cabeza y el brazo del de delante). Así el asta de una fila nunca pasa por el antebrazo de la de al
   lado; en el pasillo B se va por encima del brazo izquierdo que los del pasillo A cruzan hasta su asta, y en un mismo pasillo cada fila va
   12 cm más alta que la de delante (por encima de sus manos). La 1.ª fila, a la cadera, a 30 cm (su regatón pasa junto a la cadera del de
   detrás). Alturas a talla 1. Medido con __bloque.choques (bloque/fisica.js).
   ?carril=viejo vuelve al de FU3c (para la prueba test/combate-atraviesa.test.mjs, que debe fallar con él). Solo dibujo */
const Qc = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
const CARRIL_BT1 = (() => { try { const v = Qc && Qc.get('carrilxy'); if (v) return JSON.parse(v); } catch (e) { /* el de serie */ } return [[0.3, 1.0], [0.48, 1.64], [0.28, 1.72], [0.48, 1.76], [0.28, 1.84]]; })();
const SIN_APARTAR = !!(Qc && Qc.get('carril') === 'viejo');   /* con el carril viejo, tampoco se apartan (el «antes») */
const CARRIL = Qc && Qc.get('carril') === 'viejo' ? CARRIL_FU3C : r => { const c = CARRIL_VIEJO(r), k = Math.min(4, r); return CARRIL_BT1[k] ? { x: CARRIL_BT1[k][0], y: CARRIL_BT1[k][1] } : c; };
const PIEZAS_SARISA = (() => {
  /* FU3c: sarisa fina (≈3,6 cm de diámetro), fresno con veta (color por vértice que varía a lo largo), regatón de bronce atrás, manguito fino de bronce y punta de hierro clara y estrecha */
  const pz = [[0.004, 0.02, 0, 0.22, '#8a6a3c']], N = 24, ruido = i => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < N; i++) {
    const z0 = 0.22 + i * 5.7 / N, z1 = z0 + 5.7 / N, r0 = 0.0195 - 0.0045 * i / N, r1 = 0.0195 - 0.0045 * (i + 1) / N, t = 0.5 + 0.5 * Math.sin(i * 0.9) * 0.6 + (ruido(i) - 0.5) * 0.35;
    pz.push([r0, r1, z0, z1, '#' + [0xa5, 0x82, 0x56].map((c, k) => Math.round(c * (0.72 + 0.4 * t) * (k === 2 ? 0.95 : 1)).toString(16).padStart(2, '0')).join('')]);
  }
  pz.push([0.0225, 0.0225, 3.0, 3.07, '#a07c3a'], [0.017, 0.017, 5.92, 6.0, '#6b6b6e'], [0.011, 0.016, 6.0, 6.06, '#8f9195'], [0.016, 0.002, 6.06, SARISA, '#cfd2d6']);
  return pz;
})();
const PIEZAS_MUNON = (() => {
  /* FU3c: el muñón en el suelo se perdía contra la tierra: fresno algo más claro (se sigue leyendo «oscuro») y la rotura astillada, blanca */
  const pz = [[0.005, 0.023, 0, 0.3, '#2a2928'], [0.034, 0.034, 0.3, 0.38, '#8a6a44']];
  for (let i = 0; i < 5; i++) { const z0 = 0.38 + i * 2.2 / 5; pz.push([0.031, 0.0306, z0, z0 + 2.2 / 5, ['#7a5c3a', '#6e5333', '#85643f'][i % 3]]); }
  pz.push([0.031, 0.008, 2.58, 2.86, '#f0e6c8']);
  return pz;
})();
/* un palo a lo largo de +z: piezas [radio0, radio1, z0, z1, color] (cono truncado cada una) */
function geoPalo(T, piezas, lados, plana) {
  const pos = [], nor = [], col = [], c = new T.Color();
  for (const [r0, r1, z0, z1, hex] of piezas) {
    const g = new T.CylinderGeometry(Math.max(r1, 0.001), Math.max(r0, 0.001), z1 - z0, lados, 1, false).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(0, 0, (z0 + z1) / 2);
    c.set(hex); const P = g.attributes.position.array, N = g.attributes.normal.array;
    for (let k = 0; k < P.length; k += 3) { pos.push(P[k], plana && P[k + 2] > 6.02 ? P[k + 1] * 0.28 : P[k + 1], P[k + 2]); nor.push(N[k], N[k + 1], N[k + 2]); col.push(c.r, c.g, c.b); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  return g;
}
/* FU3b: el pilum de los manípulos (la geometría de falange/escena.js: asta, aro, cuello y punta) */
const PIEZAS_PILUM = [[0.016, 0.016, 0, 1.2, '#b48a5a'], [0.019, 0.019, 1.2, 1.26, '#58585a'], [0.006, 0.006, 1.26, 1.95, '#505052'], [0.013, 0.001, 1.95, 2.06, '#6a6a6c']];
const suave = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/* BT1: el cuerpo de un falangita para APARTAR las astas de los compañeros (marco del modelo: izquierda +x, arriba y, frente +z; m, a talla 1).
   Cápsulas [ax, ay, az, bx, by, bz, radio] algo más gordas que la malla (medidas con __bloque.choques en lucha), y el escudo al pecho
   (soldados.js paraFalange) como una caja fina: centro, eje a lo ancho (u), medio ancho, medio alto y medio grueso. Solo dibujo */
const CUERPO_FAL = [[0, 0.12, 0, 0, 0.9, 0, 0.2], [0, 0.9, 0, 0, 1.36, 0, 0.21], [0.18, 1.36, 0, -0.18, 1.36, 0, 0.11], [0, 1.42, 0.04, 0, 1.6, 0.03, 0.13]];
const ESCUDO_FAL = { c: [0.205, 1.25, 0.17], n: [-0.64, 0, 0.77], R: 0.29, g: 0.03 };   /* el disco: centro, normal, radio y medio grueso */
const R_ASTA = 0.02, HOLGURA = 0.01;
/* desvíos que se prueban (giro sobre la mano: de lado, arriba/abajo), del más pequeño al más grande */
const DESVIOS = (() => { const o = [[0, 0]]; for (const a of [0.015, 0.03, 0.05, 0.08, 0.11, 0.15]) for (const p of [0, 0.02, -0.02, 0.04]) for (const sg of [1, -1]) o.push([a * sg, p]); for (const p of [0.02, 0.04, 0.06, -0.02]) o.push([0, p]);
  return o.sort((x, y) => Math.hypot(x[0], x[1] * 1.4) - Math.hypot(y[0], y[1] * 1.4)); })();
function dSS(p1, d1, L1, p2, q2) {   /* distancia del segmento p1 + d1·[0, L1] (d1 unitario) al segmento p2q2 */
  const ux = d1[0] * L1, uy = d1[1] * L1, uz = d1[2] * L1, vx = q2[0] - p2[0], vy = q2[1] - p2[1], vz = q2[2] - p2[2], wx = p1[0] - p2[0], wy = p1[1] - p2[1], wz = p1[2] - p2[2];
  const a = ux * ux + uy * uy + uz * uz, b = ux * vx + uy * vy + uz * vz, c = vx * vx + vy * vy + vz * vz, d = ux * wx + uy * wy + uz * wz, e = vx * wx + vy * wy + vz * wz, den = a * c - b * b;
  let sN = den > 1e-12 ? (b * e - c * d) / den : 0; sN = Math.max(0, Math.min(1, sN)); let tN = c > 1e-12 ? (b * sN + e) / c : 0;
  if (tN < 0) { tN = 0; sN = Math.max(0, Math.min(1, -d / a)); } else if (tN > 1) { tN = 1; sN = Math.max(0, Math.min(1, (b - d) / a)); }
  return Math.hypot(wx + ux * sN - vx * tN, wy + uy * sN - vy * tN, wz + uz * sN - vz * tN);
}
/* ¿el asta (P, D, L en el mundo) toca a este compañero c = { x, y, z, co, se, t, brazos }? */
function tocaCompanero(P, D, L, c) {
  const rx = (P[0] - c.x) / c.t, ry = (P[1] - c.y) / c.t, rz = (P[2] - c.z) / c.t, Lm = L / c.t;
  const p = [rx * c.co - rz * c.se, ry, rx * c.se + rz * c.co], d = [D[0] * c.co - D[2] * c.se, D[1], D[0] * c.se + D[2] * c.co];
  for (let q = 0; q < CUERPO_FAL.length; q++) { const k = CUERPO_FAL[q]; if (dSS(p, d, Lm, [k[0], k[1], k[2]], [k[3], k[4], k[5]]) < k[6] + R_ASTA + HOLGURA) return 'c' + q; }
  for (let q = 0; q < c.brazos.length; q++) { const k = c.brazos[q]; if (dSS(p, d, Lm, [k[0], k[1], k[2]], [k[3], k[4], k[5]]) < k[6] + R_ASTA + HOLGURA) return 'b' + q; }
  /* el escudo (un disco): el tramo del asta dentro de su grosor (agrandado por el del asta) y, en él, lo más cerca de su eje */
  const E = ESCUDO_FAL, o = [p[0] - E.c[0], p[1] - E.c[1], p[2] - E.c[2]], on = o[0] * E.n[0] + o[1] * E.n[1] + o[2] * E.n[2], dn = d[0] * E.n[0] + d[1] * E.n[1] + d[2] * E.n[2], m = E.g + R_ASTA + HOLGURA;
  let t0 = 0, t1 = Lm;
  if (Math.abs(dn) < 1e-9) { if (Math.abs(on) > m) return false; } else { let a = (-m - on) / dn, b = (m - on) / dn; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false; }
  /* radio al eje: |o + d·t − n·(on + dn·t)|², cuadrática en t; su mínimo en [t0, t1] */
  const ux = o[0] - E.n[0] * on, uy = o[1] - E.n[1] * on, uz = o[2] - E.n[2] * on, vx = d[0] - E.n[0] * dn, vy = d[1] - E.n[1] * dn, vz = d[2] - E.n[2] * dn, vv = vx * vx + vy * vy + vz * vz;
  const t = Math.max(t0, Math.min(t1, vv > 1e-12 ? -(ux * vx + uy * vy + uz * vz) / vv : t0)), R2 = (ux + vx * t) ** 2 + (uy + vy * t) ** 2 + (uz + vz * t) ** 2, Rm = E.R + R_ASTA + HOLGURA;
  return R2 < Rm * Rm ? 'escudo' : false;
}

export function crear() {
  let ctx = null, sar = null, mun = null, pil = null, V = null, rotas = new WeakMap(), tB = -9, bajadasAntes = false;
  const desvios = new WeakMap();   /* BT1: el desvío de cada asta (giro sobre la mano) que la deja pasar limpia */
  const forma = { bajadas: false };   /* FU3b: lo pone la escena cada fotograma (falangita.js estado().bajadas): las sarisas de la 1.ª fila bajan de golpe y estocan. Solo dibujo */
  /* FU3c: brazos de FA2. Los hombres de cerca (nivel 0 de tropas) usan una tabla de huesos con las filas «sarisa bajada en el carril de la fila r»
     (soldados.js de la maqueta de la falange); aquí solo se elige la fila de cada uno. Los de lejos siguen con su clip */
  const kBde = (h, primera) => h.huye ? 0 : suave(primera && forma.bajadas ? 1 : (h.kB || 0)), primera0 = h => h.r === 0;
  const kits = new WeakMap(); let punos = null, prep = null;
  const aFloat = c => { const T = new Float32Array(c.length), h2f = ctx.THREE.DataUtils.fromHalfFloat; for (let i = 0; i < T.length; i++) T[i] = h2f(c[i]); return T; };
  const geoDe = nv => { const a = nv.geo.attributes; return { position: a.position.array, aSkinI: a.aSkinI.array, aSkinW: a.aSkinW.array }; };
  function conHuesos(mat, tex) { const m = mat.clone(), ob = mat.onBeforeCompile; m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.uniforms.uHuesos = { value: tex }; }; m.customProgramCacheKey = mat.customProgramCacheKey; m.userData.huesos = tex.image.data; return m; }   /* BT1: la medida de choques lee esta tabla */
  /* los puños del esqueleto fino (nivel 0 del falangita): los de lejos (36 huesos) los toman de él. Se prepara en segundo plano al montar */
  function preparaPunos() {
    if (prep) return prep;
    return (prep = cargarSoldado('falangita').then(s => { const nv = s && s.niveles[0]; if (!nv) return; const tab = generaTabla(aFloat(nv.crudo), nv.j, geoDe(nv), CARRIL); punos = { D: tab.esq.B.D.puno, I: tab.esq.B.I.puno }; }).catch(e => { console.warn('[FU3c] sin gestos de brazos', e); }));
  }
  function kitDe(t) {
    let k = kits.get(t); if (k !== undefined) return k;
    if (!punos) return null;
    try {
      const nv = t.s, j = nv.j, tab = generaTabla(aFloat(nv.crudo), j, geoDe(nv), CARRIL, punos), T = ctx.THREE, nb = j.huesos.length;
      const tex = new T.DataTexture(tab.T, nb * 3, tab.T.length / (nb * 12), T.RGBAFormat, T.FloatType); tex.minFilter = tex.magFilter = T.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
      t.malla.material = conHuesos(nv.mat, tex);
      const q = j.clips.quieto; k = { tab, fig: { C: { idle: { start: q.ini, dur: (q.n - 1) / q.fps }, death: { start: 0 } }, tabla: tab } };
    } catch (e) { console.warn('[FU3c] tabla de gestos', e); k = false; }
    kits.set(t, k); return k;
  }
  function hazGesto(f, h) {
    const g = { vivo: true, r: 0, kB: 0, kG: 0, huye: false, i: h.i };
    return (t, i, n) => {
      if (n !== 0 || !ctx || !ctx.S) return;
      const k = kitDe(t); if (!k || !(f.gk > 0.002)) return;
      const cu = t.malla.geometry.attributes.aCuadro;
      if (f.clip === 'guardia' || f.clip === 'golpear' || f.clip === 'cubrirse') t.pose(i, 'quieto', f.t, 0);   /* la tabla de gestos se apoya en «quieto» y «andar» */
      g.r = Math.min(4, h.r); g.kB = f.gk; g.kG = f.gg || 0;
      filasNuevo(k.fig, g, ctx.S.T, [cu.getX(i), cu.getY(i), cu.getZ(i)]); cu.setXYZ(i, g.A, g.B, g.mx); cu.needsUpdate = true;
    };
  }
  const hashH = h => { const v = Math.sin((h.i || 0) * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  return {
    id: 'falange', ordenes: ORDENES.slice(), objetivo: 'Baja las picas y rompe a los manípulos', escenario: null, muroDelante: false,
    vis: forma,
    hud: { retirada: false, tuyo: 'Tu falange' },   /* el cuarto botón no pasa a «Retirada» (la falange no la tiene) */
    duelo: false,   /* el duelo de dedos del oficial (FU2) no va en la falange: su estocada la da el motor solo */
    util: () => (ctx && ctx.C ? ctx.C.ordenUtil() : null),
    mods: () => null,
    guardia: () => null,   /* los falangitas llevan la sarisa, no el escudo de muro */
    combate,
    monta(c) {
      ctx = c; if (!c.THREE || !c.S || !c.S.fal) return;   /* sin pantalla (pruebas de Node): solo el contexto */
      const T = c.THREE, n = c.S.fal.fal.length;
      if (sar) { c.escena.remove(sar); c.escena.remove(mun); c.escena.remove(pil); }
      if (!V) {
        const mat = new T.MeshLambertMaterial({ vertexColors: true });
        V = { gs: geoPalo(T, PIEZAS_SARISA, 6, true), gm: geoPalo(T, PIEZAS_MUNON, 6, false), gp: geoPalo(T, PIEZAS_PILUM, 4, false), mat, M: new T.Matrix4(), Q: new T.Quaternion(), P: new T.Vector3(), D: new T.Vector3(),
          DA: new T.Vector3(), DB: new T.Vector3(), Mn: new T.Vector3(), E: new T.Vector3(1, 1, 1), Z1: new T.Vector3(0, 0, 1), Em: new T.Vector3(1.7, 1.7, 1), Ep: new T.Vector3(2, 2, 1),   /* FU3c: el muñón y los pila, más gruesos (a 10 m un asta de 6 cm no se ve) */ Y: new T.Vector3(0, 1, 0), M0: new T.Matrix4().makeScale(0, 0, 0), G: new T.Vector3(), Pg: new T.Vector3() };
      }
      rotas = new WeakMap(); tB = -9; bajadasAntes = false; preparaPunos();
      sar = new T.InstancedMesh(V.gs, V.mat, n); mun = new T.InstancedMesh(V.gm, V.mat, n); pil = new T.InstancedMesh(V.gp, V.mat, NPILA);
      V.camP = null; sar.onBeforeRender = (r, sc, cam) => { V.camP = cam.position; };   /* FU3c: dónde está la cámara (para no pintar tu propia sarisa ante ella) */
      sar.userData.asta = { tipo: 'sarisa', largo: SARISA, radio: 0.0195, duenos: [] }; mun.userData.asta = { tipo: 'muñón', largo: 2.86, radio: 0.031, duenos: [] };   /* BT1: medirChoques (bloque/fisica.js) */
      for (const m of [sar, mun, pil]) { m.frustumCulled = false; m.count = m === pil ? NPILA : n; c.escena.add(m); }
      if (typeof window !== 'undefined' && window.__bloque) window.__bloque.mallas = { sar, mun, pil, V, forma };   /* FU3c: gancho de captura */
    },
    paso() {
      if (!ctx || !sar) return;
      const F = ctx.S.fal, H = ctx.H, figs = new Map(), Tm = ctx.S.T;
      for (const f of ctx.TR.figs) if (f.h) { figs.set(f.h, f); if (!f.tallaBT1) { f.talla = 1 + ((f.talla || 1) - 1) * 0.2; f.tallaBT1 = true; } }   /* BT1: en la falange, todos de una talla (±1 %): las manos de cada fila, a su altura (los carriles van a 10–12 cm) */
      if (forma.bajadas && !bajadasAntes) tB = Tm; bajadasAntes = forma.bajadas;
      const uB = (Tm - tB) / T_BAJADAS, estoca = uB >= 0 && uB < 1 ? Math.sin(Math.PI * uB) : 0;
      let ns = 0, nm = 0; const yo = ctx.ocultaYo ? ctx.ocultaYo() : null, FI = ctx.FI;   /* FU4 */
      if (forma.mide) forma.picas = [];
      forma.desviadas = 0;   /* BT1: cuántas astas van desviadas (y ×1000 las que no encuentran paso limpio) */
      /* BT1: los compañeros que se pintan (para apartar las astas): posición, giro, talla y sus brazos según su sarisa (bajada: en su carril) */
      const comp = [], rejilla = new Map(), cel = (x, z) => Math.floor(x / 2) + ',' + Math.floor(z / 2);
      if (!SIN_APARTAR) for (const h of F.fal) {
        const f = figs.get(h); if (!f || !h.vivo) continue;
        const kb = h.huye || h.r >= BAJAN ? 0 : kBde(h, primera0(h)), cr = CARRIL(h.r), hx = -(0.2 + (cr.x - 0.2) * kb), hy = 1.05 + (cr.y - 1.05) * kb;
        const c = { h, x: f.x, y: H(f.x, f.z), z: f.z, co: Math.cos(f.yaw), se: Math.sin(f.yaw), t: f.talla || 1,
          brazos: [[-0.17, 1.36, 0, hx + 0.05, hy - 0.14, -0.19 * kb + 0.1 * (1 - kb), 0.06], [hx + 0.05, hy - 0.14, -0.19 * kb + 0.1 * (1 - kb), hx - 0.04, hy + 0.06, -0.21 * kb + 0.15 * (1 - kb), 0.05],
            [0.15, 1.34, 0, hx + 0.03, hy - 0.01, 0.3, 0.05]] };
        comp.push(c); const k = cel(c.x, c.z); (rejilla.get(k) || rejilla.set(k, []).get(k)).push(c);
      }
      const cerca = (P, Q) => { const o = []; for (let x = Math.floor(Math.min(P[0], Q[0]) / 2) - 1; x <= Math.floor(Math.max(P[0], Q[0]) / 2) + 1; x++) for (let z = Math.floor(Math.min(P[2], Q[2]) / 2) - 1; z <= Math.floor(Math.max(P[2], Q[2]) / 2) + 1; z++) { const l = rejilla.get(x + ',' + z); if (l) o.push(...l); } return o; };
      const Pa = [0, 0, 0], Da = [0, 0, 0], Qa = [0, 0, 0];
      for (const h of F.fal) {
        const f = figs.get(h); if (!f || !h.vivo || h === yo) continue;   /* FU4: en la vista del oficial su propia sarisa (o muñón) no tapa la cámara */
        if (V.camP && F.yo && h === F.fal[F.yo.i] && !h.picaRota && Math.hypot(V.camP.x - f.x, V.camP.z - f.z) < 1.7 && V.camP.y < 3.4) continue;   /* FU3c: en la vista del oficial su sarisa no se pinta (salía como una tabla ante la cámara) */
        const primera = h.r === 0, kB = h.huye ? 0 : suave(primera && forma.bajadas ? 1 : (h.kB || 0)), al = alzada(h.f, h.r, h.kA ?? abanicoObj(h.r, 0)), pb = bajada(h.r), giro = f.yaw - Math.PI;
        V.DA.set(Math.sin(al.lado), Math.cos(al.delante), -Math.sin(al.delante)).normalize(); V.DB.set(0, Math.sin(pb), -Math.cos(pb));
        V.D.copy(V.DA).lerp(V.DB, kB).normalize().applyAxisAngle(V.Y, giro);
        /* la mano: junto al cuerpo con la pica alzada; en el carril de su fila con la pica bajada (marco del hombre: derecha +x, frente −z) */
        const cr = CARRIL(h.r), s = h.r < BAJAN ? kB : 0, t = f.talla || 1;
        V.Mn.set(0.2 + (cr.x - 0.2) * s, (1.05 + (cr.y - 1.05) * s) * t, -0.15 - 0.05 * s).applyAxisAngle(V.Y, giro);
        /* BT1: cuánto asta queda detrás de la mano. Bajada, AGARRE (el contrapeso); alzada, el regatón se apoya en el suelo (no lo atraviesa ni llega
           a los pies del de detrás); al bajarla o alzarla, el asta corre entre las manos y el regatón se queda junto a su hombre (al girar sobre la
           mano barría el cuerpo del de detrás). Solo dibujo: la punta de las reglas (bajada) no cambia */
        let atras = AGARRE - (primera ? 0.6 * estoca : 0);
        if (!SIN_APARTAR) { const ymano = V.Mn.y; if (V.D.y > 0.05) atras = Math.min(atras, (ymano - 0.06) / V.D.y); if (kB > 0.02 && kB < 0.98) atras = Math.min(atras, AGARRE * (1 - 0.72 * Math.sin(Math.PI * kB))); atras = Math.max(0.35, atras); }
        V.P.set(f.x + V.Mn.x, H(f.x, f.z) + V.Mn.y, f.z + V.Mn.z).addScaledVector(V.D, -atras);
        if (h.picaRota) {
          /* FU3b: el muñón se suelta y cae junto al hombre, inclinado, apoyado en el suelo (0,45 s) */
          let r = rotas.get(h); if (!r) { r = { t0: Tm, P: V.P.clone(), D: V.D.clone() }; rotas.set(h, r); }
          const k = Math.min(1, Math.max(0, (Tm - r.t0) / 0.45)), g = k * k, a = giro + (hashH(h) - 0.5) * 1.6 + 1.2, lado = 0.55 + 0.25 * hashH(h);
          /* FU3c: los de la primera fila lo dejan DELANTE de la línea (a 1,2–2 m, en el suelo limpio que se ve desde atrás); entre los hombres no se veía */
          const ade = h.r === 0 ? 1.2 + 0.8 * hashH(h) : 0, fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
          V.Pg.set(f.x + Math.cos(giro) * lado * (ade ? 0.4 : 1) + fx * ade, 0, f.z + Math.sin(giro) * lado * (ade ? 0.4 : 1) + fz * ade); V.Pg.y = H(V.Pg.x, V.Pg.z) + 0.05;
          V.G.set(Math.sin(a), 0.1, -Math.cos(a)).normalize();
          V.P.copy(r.P).lerp(V.Pg, g); V.D.copy(r.D).lerp(V.G, g).normalize();
        }
        if (!h.picaRota && !SIN_APARTAR) {
          /* BT1: si el asta tocaría a un compañero, gira un poco sobre la mano (de lado o arriba) hasta que pasa limpia; se queda con el último desvío que valía */
          const W = [V.P.x + V.D.x * atras, V.P.y + V.D.y * atras, V.P.z + V.D.z * atras];
          Pa[0] = V.P.x; Pa[1] = V.P.y; Pa[2] = V.P.z; Qa[0] = V.P.x + V.D.x * SARISA; Qa[1] = V.P.y + V.D.y * SARISA; Qa[2] = V.P.z + V.D.z * SARISA;
          const vecinos = cerca(Pa, Qa).filter(c => c.h !== h), libre = (dy, dp) => {
            const cy = Math.cos(dy), sy = Math.sin(dy), x = V.D.x * cy + V.D.z * sy, z = -V.D.x * sy + V.D.z * cy, hz = Math.hypot(x, z) || 1, yy = V.D.y * Math.cos(dp) + hz * Math.sin(dp), hz2 = hz * Math.cos(dp) - V.D.y * Math.sin(dp);
            Da[0] = x / hz * hz2; Da[1] = yy; Da[2] = z / hz * hz2; const nd = Math.hypot(Da[0], Da[1], Da[2]); Da[0] /= nd; Da[1] /= nd; Da[2] /= nd;
            Pa[0] = W[0] - Da[0] * atras; Pa[1] = W[1] - Da[1] * atras; Pa[2] = W[2] - Da[2] * atras;
            let n = 0; for (const c of vecinos) if (tocaCompanero(Pa, Da, SARISA, c) && ++n > peor) return false; return n === 0; };
          let peor = 0;   /* con todos tocando, se queda el desvío que toca a menos */
          let d0 = desvios.get(h) || DESVIOS[0], hecho = vecinos.length === 0 || libre(d0[0], d0[1]);
          if (!hecho && d0 !== DESVIOS[0]) { d0 = DESVIOS[0]; hecho = libre(0, 0); }
          if (!hecho) for (const d of DESVIOS) if (libre(d[0], d[1])) { d0 = d; hecho = true; break; }
          if (!hecho) { let mejor = Infinity; peor = 99; for (const d of DESVIOS) { libre(d[0], d[1]); const n = vecinos.reduce((a, c) => a + (tocaCompanero(Pa, Da, SARISA, c) ? 1 : 0), 0); if (n < mejor) { mejor = n; d0 = d; } } peor = 0; }
          desvios.set(h, d0); forma.desviadas = (forma.desviadas || 0) + (d0 !== DESVIOS[0] ? 1 : 0) + (hecho ? 0 : 1000); if (d0 !== DESVIOS[0]) { libre(d0[0], d0[1]); V.D.set(Da[0], Da[1], Da[2]); V.P.set(Pa[0], Pa[1], Pa[2]); }
        }
        if (!h.picaRota && FI) { const r = FI.pica(h, V.P, V.D, SARISA); if (r && r.ret) V.P.addScaledVector(V.D, -r.ret); }   /* FU4: la punta se para en el cuerpo o el escudo que toca (js/fisica-batalla.js) */
        if (forma.mide && !h.picaRota && kB > 0.5) forma.picas.push({ h, P: V.P.toArray(), D: V.D.toArray(), L: SARISA });
        V.Q.setFromUnitVectors(V.Z1, V.D); V.M.compose(V.P, V.Q, h.picaRota ? V.Em : V.E);
        if (h.picaRota) { mun.userData.asta.duenos[nm] = f; mun.setMatrixAt(nm++, V.M); } else { sar.userData.asta.duenos[ns] = f; sar.setMatrixAt(ns++, V.M); }
      }
      /* FU3b: los brazos siguen a la pica (la figura no tiene hueso accesible desde aquí): con la sarisa bajada, la guardia con el arma al frente; con la 1.ª fila
         estocando (bajadas), el golpe; alzada, en reposo. Marchando se deja su andar */
      for (const [h, f] of figs) {
        if (!f.gesto) f.gesto = hazGesto(f, h);
        f.gk = h.picaRota || h.r >= BAJAN ? 0 : kBde(h, primera0(h)); f.gg = h.r === 0 ? estoca : 0;
        if (!h.vivo || h.huye || f.clip === 'morir' || f.v > 0.3) continue;
        if (h.r === 0 && uB >= 0 && uB < 1) { f.clip = 'golpear'; f.t = uB * 1.3; }
        else if (h.r < BAJAN && (h.kB || 0) > 0.5) { if (f.clip !== 'guardia') { f.clip = 'guardia'; f.t = hashH(h) * 3; } }
        else if (f.clip === 'golpear' || f.clip === 'cubrirse') { f.clip = 'quieto'; f.t = hashH(h) * 3; }
      }
      sar.count = ns; mun.count = nm; sar.visible = ns > 0; mun.visible = nm > 0;   /* sin muñones, una llamada menos */
      sar.instanceMatrix.needsUpdate = true; mun.instanceMatrix.needsUpdate = true;
      /* FU3b: los pila de los manípulos (los avisos de proyectil del motor: S.proyectiles). En el aire, clavados o en el suelo; el pilum acaba en su punta (P.p) */
      let np = 0; const PR = F.proyectiles || [];
      for (let i = 0; i < PR.length && np < NPILA; i++) {
        const P = PR[i]; if (!P.est || (P.est === 1 && Tm < P.t0) || !P.p || !P.dir) continue;
        V.D.set(P.dir[0], P.dir[1], P.dir[2]); if (V.D.lengthSq() < 1e-6) continue; V.D.normalize();
        V.P.set(P.p[0], P.p[1], P.p[2]).addScaledVector(V.D, -1.6);
        V.Q.setFromUnitVectors(V.Z1, V.D); V.M.compose(V.P, V.Q, V.Ep); pil.setMatrixAt(np++, V.M);
      }
      pil.count = np; pil.visible = np > 0; pil.instanceMatrix.needsUpdate = true;
    },
    alAviso() {}
  };
}
