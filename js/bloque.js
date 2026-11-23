/* AQVILA — LP1: el bloque y el frente dibujado, sin pantalla (corre en Node y en el navegador). Módulo ES.
   Diseño: gobierno/estudios/LP0-como-se-pelea-a-pie.md (§2, §3, §6 comprobaciones 1 y 2). Prueba: node test/bloque.test.mjs

   ===================== CONTRATO DEL BLOQUE (lo fija LP1; no se cambia sin avisarlo en el parte) =====================
   Mandas UNA unidad (un bloque de 120–160 hombres), no a un hombre. La mueves dibujando el frente: una raya en el suelo.
   Al soltar, el bloque gira como una puerta (el ala de fuera anda más) y marcha hasta que su primera fila queda sobre la raya.
   El enemigo vive en el campo: nada de lo que hace tu bloque mueve a nadie del otro bando (no hay cámara aquí).

   import { crearBloque, dibujaFrente, paso, crearCampo, pasoCampo, ... } from './bloque.js';

   EJES (los de js/falange.js): metros, suelo x–z. Rumbo a en radianes: frente = (sen a, −cos a); derecha = (cos a, sen a).
     a = 0 mira a −z; a positivo = ha girado a su derecha (+x). Un hombre mira con yaw = π − a (dirección (sen yaw, cos yaw)).

   const B = crearBloque(o)
     o = { id, bando ('yo' | 'amigo' | 'rival'), tipo ('manipulo' | 'falange' | 'banda'), x, z (centro de la primera fila),
           rumbo, hombres, cols (de frente), dx, dz (hueco entre hombres de lado y de fondo), avisa (tipo, datos) }
           Lo que falte sale de TIPOS[tipo].
   EL ESTADO B (lo lee la escena para dibujar; LP2 lo lee y escribe solo B.mods, B.orden y la vida de los hombres)
     B.id, B.bando, B.tipo
     B.x, B.z            el ancla: centro de la primera fila, en el mundo (se mueve con peso, nunca salta)
     B.rumbo             radianes (arriba)
     B.cols, B.filas     hombres de frente y de fondo (filas = ceil(vivos / cols))
     B.dx, B.dz          huecos (m)
     B.ancho, B.fondo    metros de la primera fila de punta a punta ((cols−1)·dx) y de la primera a la última ((filas−1)·dz)
     B.frente            { p0, p1 }: las dos puntas de la primera fila AHORA (p0 la de la izquierda, p1 la de la derecha)
     B.meta              null | { x, z, rumbo, cols, p0, p1 }: el frente dibujado al que va
     B.fase              'quieto' | 'gira' | 'marcha' | 'forma'   (forma = el ancla llegó y los hombres acaban de colocarse)
     B.bisagra           null | { x, z }: el punto de la primera fila sobre el que gira ahora (la bisagra de la puerta)
     B.coh               cohesión 0–100: baja si los hombres van lejos de su hueco o marchan de lado o hacia atrás; sube quieto
     B.hombres[]         { i, col, fila, x, z, yaw, vivo, desvio }: col y fila son su puesto; desvio = metros a su hueco ahora
     B.mods              { vel: 1, giro: 1 }: multiplicadores que pone LP2 (testudo despacio, carga deprisa). LP1 solo los lee
     B.orden             null | texto: la orden que lleva (la escribe LP2; LP1 no la mira)
     B.T                 segundos que lleva vivo el bloque

   FUNCIONES
     dibujaFrente(B, p0, p1, op)  → la meta puesta, o null si no se pudo (puntos no válidos).
                    p0, p1 = { x, z }: la raya. La primera fila quedará sobre ella, centrada en su punto medio.
                    Mira hacia el lado de la raya que queda más cerca de donde mira ahora (no se da media vuelta por dibujar
                    al revés); op.sentido = 'dibujo' obliga a mirar a la izquierda del trazo (como trazar de izquierda a derecha).
                    Una raya de CORTA m o más fija el ancho (cols); más corta, solo mueve y gira con el ancho de antes.
                    La raya se recorta al campo (op.campo = { ancho, largo }, centrado en 0,0) y el ancho a COLS_MIN–COLS_MAX.
     paso(B, dt)        avanza dt segundos (dt grandes se trocean). Mueve el ancla y el rumbo, luego a cada hombre hacia su hueco.
     puesto(B, col, fila) → { x, z }: el hueco de ese puesto con el ancla y el rumbo de ahora
     local(B, x, z)     → { delante, lado }: metros por delante de la primera fila y a la derecha del ancla
     cierraFilas(B)       reparte los puestos entre los vivos (los de atrás pasan a cubrir los huecos de delante). Lo llama LP2
     formado(B)         → true si no tiene meta pendiente y todos están a menos de LLEGA m de su hueco
     resumen(B)         → { id, x, z, rumbo, grados, cols, filas, coh, fase, vivos, desvioMax, desvioMedio }

   EL CAMPO (tu unidad, sus compañeras y el enemigo; la IA del enemigo la pone LP2)
     const C = crearCampo(m)
       m = { semilla, avisa, campo: { ancho, largo }, yo: o, amigas: [o, o], rivales: [o, ...], ia }
           ia = null | función (C, dt) que da las órdenes a los rivales y a las amigas, SIEMPRE con dibujaFrente (LP2).
           Sin ia, rivales y amigas se quedan donde están (o van a la meta que les pongas).
     C = { T, azar, campo, yo, amigas[], rivales[], todos[], avisa }
     manda(C, p0, p1, op)   dibuja el frente de tu bloque (C.yo). Con op.amigas = true, las amigas se ponen a tus lados en la misma línea
     pasoCampo(C, dt)       llama a C.ia (si hay) y da paso() a todos los bloques
     botFrente(C, modo)     bots de prueba: 'bien' (frentes limpios, espera a formar), 'mal' (al revés, cortos, fuera del campo,
                            redibuja a medio girar), 'nada' (no dibuja). Devuelve la raya que dibujó o null

   AVISOS (avisa(tipo, datos)): 'frente' { id, p0, p1, rumbo, cols } · 'corta' { id } (raya corta: solo mueve) ·
     'recortado' { id } (la raya se salía del campo) · 'gira' { id, grados, bisagra } · 'marcha' { id, metros } ·
     'formado' { id, t } · 'desorden' { id, coh } (la cohesión baja de 50) · 'ordenado' { id, coh } (vuelve a 70)

   HISTORIA (skill historia). Manípulo de 120 hombres (hastati y principes; los triarios, 60): histórico (Polibio 6.21–24).
   Formación en filas con un hueco de unos 3 pies por hombre: histórico (Polibio 18.28–30). Girar el frente pivotando sobre
   un extremo (la «conversio»): probable para la época, descrita en tratados tácticos posteriores (Asclepiódoto 10; Arriano,
   Táctica). Licencia de juego: dibujar el frente con el dedo, todas las velocidades y cifras de este archivo, que el ancho
   del frente cambie solo con la raya y que los hombres corran a su hueco sin chocar entre sí (las físicas son de FI1). */

import { V_GIRO, azarSemilla } from './falange.js';

/* ---------- Cifras (licencia de juego) ---------- */
export const TIPOS = {
  manipulo: { hombres: 120, cols: 12, dx: 0.9, dz: 1.2 },   /* Polibio 6.21: 120 hastati o principes por manípulo */
  falange: { hombres: 128, cols: 16, dx: 0.78, dz: 0.95 },  /* los huecos de js/falange.js */
  banda: { hombres: 140, cols: 14, dx: 1.1, dz: 1.5 },      /* galos: más sueltos */
};
export const V_MARCHA = 1.3;      /* m/s del ancla al marchar de frente (el paso de js/falange.js) */
export const V_ALA = 1.6;         /* m/s como mucho del ala de fuera al girar: cuanto más ancho, más despacio gira */
export { V_GIRO };                /* y nunca más de 8° por segundo (el de la falange): pesa */
export const V_HOMBRE = 2.6;      /* m/s de un hombre que corre a su hueco */
export const CORTA = 3;           /* m: raya más corta no cambia el ancho */
export const COLS_MIN = 6, COLS_MAX = 30;
export const LLEGA = 0.3;         /* m: a esta distancia de su hueco, un hombre está en su sitio */
export const CAMPO = { ancho: 240, largo: 240 };
const ANCLA_OK = 0.03, GIRO_OK = 0.2 * Math.PI / 180, SUB = 0.05;

/* ---------- Ayudas ---------- */
const lim = (x, a, b) => Math.max(a, Math.min(b, x));
const fin = v => typeof v === 'number' && Number.isFinite(v);
const ejes = a => ({ F: { x: Math.sin(a), z: -Math.cos(a) }, D: { x: Math.cos(a), z: Math.sin(a) } });
const difAng = d => { d = (d + Math.PI) % (2 * Math.PI); if (d < 0) d += 2 * Math.PI; return d - Math.PI; };   /* a (−π, π] */
const rota = (vx, vz, d) => ({ x: vx * Math.cos(d) - vz * Math.sin(d), z: vx * Math.sin(d) + vz * Math.cos(d) });
const nada = () => {};
const vivosDe = B => B.hombres.filter(h => h.vivo);

/* ---------- El bloque ---------- */
export function crearBloque(o = {}) {
  const t = TIPOS[o.tipo] || TIPOS.manipulo, n = Math.max(1, Math.round(o.hombres || t.hombres));
  const B = {
    id: o.id || 'yo', bando: o.bando || 'yo', tipo: TIPOS[o.tipo] ? o.tipo : 'manipulo',
    x: fin(o.x) ? o.x : 0, z: fin(o.z) ? o.z : 0, rumbo: fin(o.rumbo) ? o.rumbo : 0,
    cols: lim(Math.round(o.cols || t.cols), 1, COLS_MAX), filas: 1, dx: o.dx || t.dx, dz: o.dz || t.dz,
    ancho: 0, fondo: 0, frente: null, meta: null, fase: 'quieto', bisagra: null, coh: 100,
    hombres: [], mods: { vel: 1, giro: 1 }, orden: null, T: 0,
    avisa: typeof o.avisa === 'function' ? o.avisa : nada, campo: o.campo || null,
    desvioMax: 0, desvioMedio: 0, _bajo: false,
  };
  B.cols = Math.min(B.cols, n);
  for (let i = 0; i < n; i++) B.hombres.push({ i, col: i % B.cols, fila: Math.floor(i / B.cols), x: 0, z: 0, yaw: Math.PI - B.rumbo, vivo: true, desvio: 0 });
  medidas(B);
  for (const h of B.hombres) { const p = puesto(B, h.col, h.fila); h.x = p.x; h.z = p.z; }
  return B;
}

function medidas(B) {
  const n = vivosDe(B).length;
  B.filas = Math.max(1, Math.ceil(n / B.cols));
  B.ancho = (Math.min(B.cols, Math.max(n, 1)) - 1) * B.dx;
  B.fondo = (B.filas - 1) * B.dz;
  const { D } = ejes(B.rumbo), w = B.ancho / 2;
  B.frente = { p0: { x: B.x - w * D.x, z: B.z - w * D.z }, p1: { x: B.x + w * D.x, z: B.z + w * D.z } };
}

export function puesto(B, col, fila) {
  const { F, D } = ejes(B.rumbo), lx = (col - (B.cols - 1) / 2) * B.dx, r = fila * B.dz;
  return { x: B.x + lx * D.x - r * F.x, z: B.z + lx * D.z - r * F.z };
}

export function local(B, x, z) {
  const { F, D } = ejes(B.rumbo), dx = x - B.x, dz = z - B.z;
  return { delante: dx * F.x + dz * F.z, lado: dx * D.x + dz * D.z };
}

/* reparte los puestos entre los vivos: los de delante, delante; de izquierda a derecha. La última fila, centrada */
function asignaPuestos(B) {
  const V = vivosDe(B).map(h => ({ h, l: local(B, h.x, h.z) }));
  V.sort((a, b) => b.l.delante - a.l.delante || a.h.i - b.h.i);
  for (let k = 0; k < V.length; k += B.cols) {
    const fila = V.slice(k, k + B.cols).sort((a, b) => a.l.lado - b.l.lado || a.h.i - b.h.i);
    const off = Math.floor((B.cols - fila.length) / 2);
    fila.forEach((e, j) => { e.h.col = off + j; e.h.fila = k / B.cols; });
  }
  medidas(B);
}
export function cierraFilas(B) { B.cols = Math.max(1, Math.min(B.cols, vivosDe(B).length)); asignaPuestos(B); }

export function dibujaFrente(B, p0, p1, op = {}) {
  if (!p0 || !p1 || ![p0.x, p0.z, p1.x, p1.z].every(fin)) return null;
  const campo = op.campo || B.campo;
  let a = { x: p0.x, z: p0.z }, b = { x: p1.x, z: p1.z }, recorta = false;
  if (campo) {
    const hx = campo.ancho / 2, hz = campo.largo / 2;
    for (const p of [a, b]) { const x = lim(p.x, -hx, hx), z = lim(p.z, -hz, hz); if (x !== p.x || z !== p.z) recorta = true; p.x = x; p.z = z; }
  }
  if (recorta) B.avisa('recortado', { id: B.id });
  const dX = b.x - a.x, dZ = b.z - a.z, L = Math.hypot(dX, dZ), vivos = vivosDe(B).length;
  let rumbo = B.rumbo, cols = B.cols;
  if (L >= 0.5) {
    const aDib = Math.atan2(dZ, dX);   /* derecha = la dirección del trazo */
    rumbo = op.sentido === 'dibujo' ? aDib : (Math.abs(difAng(aDib - B.rumbo)) <= Math.PI / 2 ? aDib : aDib + Math.PI);
  }
  if (L >= CORTA) cols = lim(Math.round(L / B.dx) + 1, Math.min(COLS_MIN, vivos), Math.min(COLS_MAX, vivos));
  else B.avisa('corta', { id: B.id });
  rumbo = B.rumbo + difAng(rumbo - B.rumbo);
  if (op.sentido === 'dibujo' && Math.abs(difAng(rumbo - B.rumbo)) > Math.PI - 1e-9) rumbo = B.rumbo + Math.PI;   /* media vuelta: por la derecha */
  if (cols !== B.cols) { B.cols = cols; asignaPuestos(B); }
  const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2, { D } = ejes(rumbo), w = (Math.min(B.cols, vivos) - 1) * B.dx / 2;
  B.meta = { x: cx, z: cz, rumbo, cols: B.cols, p0: { x: cx - w * D.x, z: cz - w * D.z }, p1: { x: cx + w * D.x, z: cz + w * D.z } };
  B.avisa('frente', { id: B.id, p0: B.meta.p0, p1: B.meta.p1, rumbo, cols: B.cols });
  planea(B);
  return B.meta;
}

/* elige la bisagra: donde la primera fila de ahora corta a la raya, sin salirse de las puntas */
function planea(B) {
  const m = B.meta, giro = difAng(m.rumbo - B.rumbo);
  if (Math.abs(giro) <= GIRO_OK) { B.bisagra = null; B.fase = 'marcha'; B.avisa('marcha', { id: B.id, metros: Math.hypot(m.x - B.x, m.z - B.z) }); return; }
  const D = ejes(B.rumbo).D, E = ejes(m.rumbo).D, w = B.ancho / 2;
  /* B + s·D = M + u·E  →  s */
  const det = -D.x * E.z + D.z * E.x, rx = m.x - B.x, rz = m.z - B.z;
  let s = Math.abs(det) < 1e-9 ? 0 : (-rx * E.z + rz * E.x) / det;
  s = lim(s, -w, w);
  B.bisagra = { x: B.x + s * D.x, z: B.z + s * D.z, s };
  B.fase = 'gira';
  B.avisa('gira', { id: B.id, grados: giro * 180 / Math.PI, bisagra: { x: B.bisagra.x, z: B.bisagra.z } });
}

export function paso(B, dt) {
  if (!(dt > 0)) return;
  const n = Math.ceil(dt / SUB), h = dt / n;
  for (let k = 0; k < n; k++) pasito(B, h);
}

function pasito(B, dt) {
  B.T += dt;
  const m = B.meta, vel = B.mods.vel > 0 ? B.mods.vel : 1, gm = B.mods.giro > 0 ? B.mods.giro : 1;
  let lado = 0;   /* 0 de frente … 1 de lado o atrás: desordena */
  if (m && B.fase === 'gira') {
    const g = difAng(m.rumbo - B.rumbo), s = B.bisagra.s, w = B.ancho / 2;
    const radio = Math.max(Math.abs(s + w), Math.abs(s - w), 2), om = Math.min(V_ALA / radio, V_GIRO) * gm;
    const d = Math.sign(g) * Math.min(Math.abs(g), om * dt), q = rota(B.x - B.bisagra.x, B.z - B.bisagra.z, d);
    B.x = B.bisagra.x + q.x; B.z = B.bisagra.z + q.z; B.rumbo += d;
    if (Math.abs(g) - Math.abs(d) <= GIRO_OK) { B.rumbo = m.rumbo; B.bisagra = null; B.fase = 'marcha'; B.avisa('marcha', { id: B.id, metros: Math.hypot(m.x - B.x, m.z - B.z) }); }
  } else if (m && B.fase === 'marcha') {
    const rx = m.x - B.x, rz = m.z - B.z, dist = Math.hypot(rx, rz), { F } = ejes(B.rumbo);
    const c = dist > 1e-9 ? (rx * F.x + rz * F.z) / dist : 1, f = c >= 0 ? 0.6 + 0.4 * c : 0.6 + 0.1 * c;
    lado = dist > 0.2 ? 1 - Math.max(0, c) : 0;
    const v = V_MARCHA * vel * f * Math.min(1, 0.3 + dist / 1.5);   /* frena al llegar, sin saltos */
    const st = Math.min(dist, v * dt);
    if (dist > 1e-9) { B.x += rx / dist * st; B.z += rz / dist * st; }
    const g = difAng(m.rumbo - B.rumbo); B.rumbo += Math.sign(g) * Math.min(Math.abs(g), V_GIRO * gm * dt);
    if (dist - st <= ANCLA_OK && Math.abs(difAng(m.rumbo - B.rumbo)) <= 1e-6) { B.x = m.x; B.z = m.z; B.rumbo = m.rumbo; B.fase = 'forma'; }
  }
  medidas(B);
  /* los hombres corren a su hueco */
  const vh = V_HOMBRE * Math.max(1, vel), yawB = Math.PI - B.rumbo;
  let suma = 0, max = 0, nv = 0;
  for (const h of B.hombres) {
    if (!h.vivo) continue;
    const p = puesto(B, h.col, h.fila), rx = p.x - h.x, rz = p.z - h.z, d = Math.hypot(rx, rz), st = Math.min(d, vh * dt);
    if (d > 1e-9) { h.x += rx / d * st; h.z += rz / d * st; }
    h.desvio = d - st;
    h.yaw = h.desvio > 1 ? Math.atan2(rx, rz) : yawB;
    suma += h.desvio; if (h.desvio > max) max = h.desvio; nv++;
  }
  B.desvioMax = max; B.desvioMedio = nv ? suma / nv : 0;
  if (B.fase === 'forma' && max <= LLEGA) { B.fase = 'quieto'; B.meta = null; B.avisa('formado', { id: B.id, t: B.T }); }
  else if (B.fase === 'quieto' && B.meta === null && max > LLEGA) B.fase = 'forma';   /* p. ej. tras cerrar filas */
  if (B.fase === 'forma' && !B.meta && max <= LLEGA) B.fase = 'quieto';
  /* cohesión */
  const obj = lim(100 - 25 * B.desvioMedio - 30 * lado * (B.fase === 'marcha' ? 1 : 0), 0, 100);
  B.coh = obj < B.coh ? Math.max(obj, B.coh - 12 * dt) : Math.min(obj, B.coh + 4 * dt);
  if (!B._bajo && B.coh < 50) { B._bajo = true; B.avisa('desorden', { id: B.id, coh: B.coh }); }
  else if (B._bajo && B.coh >= 70) { B._bajo = false; B.avisa('ordenado', { id: B.id, coh: B.coh }); }
}

export function formado(B) { return !B.meta && B.hombres.every(h => !h.vivo || h.desvio <= LLEGA); }

export function resumen(B) {
  return { id: B.id, x: B.x, z: B.z, rumbo: B.rumbo, grados: B.rumbo * 180 / Math.PI, cols: B.cols, filas: B.filas, coh: B.coh,
    fase: B.fase, vivos: vivosDe(B).length, desvioMax: B.desvioMax, desvioMedio: B.desvioMedio };
}

/* ---------- El campo ---------- */
export function crearCampo(m = {}) {
  const avisa = typeof m.avisa === 'function' ? m.avisa : nada, campo = m.campo || CAMPO;
  const hace = (o, def) => crearBloque({ ...def, ...o, avisa, campo });
  const yo = hace(m.yo, { id: 'yo', bando: 'yo', tipo: 'manipulo', x: 0, z: 0, rumbo: 0 });
  const sep = 4, wy = yo.ancho;
  const amigas = (m.amigas || [{}, {}]).map((o, k) => {
    const t = TIPOS[(o && o.tipo) || 'manipulo'], wa = (t.cols - 1) * t.dx, lado = k % 2 ? 1 : -1;
    return hace(o, { id: 'amiga' + (k + 1), bando: 'amigo', tipo: 'manipulo', x: lado * (wy / 2 + sep + wa / 2) * (1 + Math.floor(k / 2)), z: 0, rumbo: 0 });
  });
  const rivales = (m.rivales || [{}]).map((o, k) => hace(o, { id: 'rival' + (k + 1), bando: 'rival', tipo: 'banda', x: 0, z: -60, rumbo: Math.PI }));
  const C = { T: 0, azar: azarSemilla(m.semilla || 1), campo, yo, amigas, rivales, todos: [yo, ...amigas, ...rivales], avisa,
    ia: typeof m.ia === 'function' ? m.ia : null, bot: { t: -1e9, k: 0 } };
  return C;
}

export function manda(C, p0, p1, op = {}) {
  const r = dibujaFrente(C.yo, p0, p1, op);
  if (!r || !op.amigas) return r;
  const { D } = ejes(r.rumbo), sep = 4;
  let izq = r.p0, der = r.p1;
  C.amigas.forEach((A, k) => {
    const wa = (A.cols - 1) * A.dx;
    if (k % 2 === 0) { const b = { x: izq.x - sep * D.x, z: izq.z - sep * D.z }, a = { x: b.x - wa * D.x, z: b.z - wa * D.z }; dibujaFrente(A, a, b, { sentido: 'dibujo' }); izq = a; }
    else { const a = { x: der.x + sep * D.x, z: der.z + sep * D.z }, b = { x: a.x + wa * D.x, z: a.z + wa * D.z }; dibujaFrente(A, a, b, { sentido: 'dibujo' }); der = b; }
  });
  return r;
}

export function pasoCampo(C, dt) {
  if (!(dt > 0)) return;
  if (C.ia) C.ia(C, dt);
  for (const B of C.todos) paso(B, dt);
  C.T += dt;
}

/* ---------- Bots de prueba ---------- */
/* la raya de una puerta: gira g radianes sobre la punta de dentro y queda «adelante» metros más allá */
export function rayaPuerta(B, g, adelante = 0) {
  const a = B.rumbo + g, { F, D } = ejes(a), fr = B.frente, w = B.ancho;
  const bis = g >= 0 ? fr.p1 : fr.p0;
  let p0, p1;
  if (g >= 0) { p1 = { x: bis.x, z: bis.z }; p0 = { x: bis.x - w * D.x, z: bis.z - w * D.z }; }
  else { p0 = { x: bis.x, z: bis.z }; p1 = { x: bis.x + w * D.x, z: bis.z + w * D.z }; }
  for (const p of [p0, p1]) { p.x += adelante * F.x; p.z += adelante * F.z; }
  return { p0, p1 };
}

export const BOTS = ['bien', 'mal', 'nada'];
export function botFrente(C, modo) {
  const B = C.yo, b = C.bot;
  if (modo === 'bien') {
    if (!formado(B) || C.T - b.t < 1) return null;
    const g = (b.k % 2 ? -1 : 1) * Math.PI / 3; b.k++; b.t = C.T;
    const r = rayaPuerta(B, g, 2); manda(C, r.p0, r.p1); return r;
  }
  if (modo === 'mal') {
    if (C.T - b.t < 0.7) return null;
    b.t = C.T; const k = b.k++ % 8, z = C.azar, fr = B.frente, { F, D } = ejes(B.rumbo);
    let r;
    if (k === 0) r = { p0: fr.p1, p1: fr.p0 };                                                     /* al revés */
    else if (k === 1) r = { p0: { x: B.x, z: B.z }, p1: { x: B.x + 0.2, z: B.z } };                 /* un toque */
    else if (k === 2) r = { p0: { x: 500, z: -400 }, p1: { x: 520, z: -380 } };                     /* fuera del campo */
    else if (k === 3) r = { p0: { x: B.x, z: B.z }, p1: { x: B.x, z: B.z } };                       /* raya nula */
    else if (k === 4) r = { p0: { x: B.x - 40 * D.x, z: B.z - 40 * D.z }, p1: { x: B.x + 40 * D.x, z: B.z + 40 * D.z } };   /* larguísima */
    else if (k === 5) r = { p0: { x: NaN, z: 0 }, p1: { x: 1, z: 1 } };                             /* basura */
    else if (k === 6) r = { p0: fr.p1, p1: fr.p0, sentido: 'dibujo' };                              /* media vuelta de verdad */
    else { const a = z() * 2 * Math.PI, c = { x: B.x + (z() - 0.5) * 30, z: B.z + (z() - 0.5) * 30 }, L = 2 + z() * 14;
      r = { p0: { x: c.x - L / 2 * Math.cos(a), z: c.z - L / 2 * Math.sin(a) }, p1: { x: c.x + L / 2 * Math.cos(a), z: c.z + L / 2 * Math.sin(a) } }; }
    void F; manda(C, r.p0, r.p1, r.sentido ? { sentido: r.sentido } : {}); return r;
  }
  return null;
}
