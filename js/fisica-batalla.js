/* AQVILA — FI1: la física de las batallas a pie. Capa fina de corrección SOBRE las reglas (js/falange.js): no decide nada
   del juego, solo DÓNDE SE DIBUJA cada hombre y cada pica. Sin pantalla: corre en Node. Prueba: test/fisica-batalla.test.mjs.
   Diseño: gobierno/estudios/FI1-diseno-fisicas.md.

   CONTRATO
   import { crearFisica } from './fisica-batalla.js';
   const Fi = crearFisica({ H, escala, parMin }); H(x, z) → altura del suelo (por defecto 0); escala de los radios (por defecto 1);
                                          parMin(a, b): distancia mínima propia de una pareja (p. ej. dos que se baten), o undefined
     Fi.paso(S, dt)                       tras el paso de las reglas: separa cuerpos, aprieta filas y aplica los empujes de las picas
     Fi.pica(h, P, D, L)                  P contera y D dirección unitaria de la sarisa de h (arrays o {x,y,z}); L su largo.
                                          → { ret, h, en }: cuánto retirar el asta (m) y contra quién ('escudo' | 'cuerpo'); o { ret: 0 }
     Fi.medir(S, picas)                   picas = [{ h, P, D, L }] ya retiradas → { distMin, puntasDentro, pisados (vivos de pie sobre un caído) }
   Solo escribe en cada hombre fx, fz (desplazamiento de dibujo, m; como mucho TOPE), vx, vz (su velocidad), ux, uz (la
   velocidad que le dan las reglas) y, al caer, fCae (hacia dónde cae: ángulo como el yaw). Las reglas no lo leen: las partidas no cambian.
   Quien dibuja suma h.fx, h.fz a la posición del hombre vivo.

   PROYECTILES (FI3): pilum, jabalina y flecha con física. Diseño y varas: gobierno/partes/2026-11-23-FI3.md.
     Fi.lanza(tipo, P, V, de)             tipo 'pilum' | 'jabalina' | 'flecha'; P la punta, V la velocidad (m/s); de: quien lanza (no se da a sí mismo)
                                          → el proyectil p: { tipo, x, y, z, vx, vy, vz, est: 'vuela' | 'clavado' | 'caido', en, doblado, rebotes, fijo }
     Fi.vuela(S, dt)                      mueve los que vuelan (con gravedad) y resuelve cada impacto → avisos [{ aviso, en, p, h, ang, v, herida }]
                                          aviso: 'clava' (en 'escudo' | 'cuerpo' | 'suelo'), 'dobla' (el pilum clavado en un escudo), 'rebota'
                                          (en 'escudo' | 'casco' | 'cuerpo' | 'suelo'), 'hiere' (en 'casco': el proyectil cae a sus pies),
                                          'cae' (en 'suelo': de plano). ang: grados entre la trayectoria y la perpendicular a lo que toca.
     Fi.dondeP(p)                         dónde dibujar p: { x, y, z, dx, dy, dz } (punta y dirección); el clavado en un hombre le sigue
     Fi.proyectiles                       la lista viva (quien dibuja la recorre; Fi.limpia() quita los quietos)
   Guardia del hombre (h.guardia): 'alto' escudo sobre la cabeza (techo del testudo); 'muro' algo agachado, con el escudo subido hasta los ojos; si no, al frente.
   Solo escribe en el hombre h.pila (pilum y jabalinas clavados en su escudo: estorban; quien lleve las reglas lo lee si quiere).
   La física no mata a nadie: avisa de la herida (herida: 'leve' | 'grave') y las reglas deciden.

   HISTORIA. Las filas de detrás empujan con el peso del cuerpo (othismos): Asclepiódoto 5; Polibio 18.30 (histórico).
   Radios, cuánto resbala el asta y cuánto pasa a la fila de detrás: licencia de juego.
   El pilum: asta de madera y hierro largo y fino (Polibio 6.23, histórico). Que se clave en el escudo, lo cargue y estorbe y el
   hierro se doble y no se pueda devolver: César, BG 1.25 (58 a.C., algo posterior a la época); el hierro blando y el pasador de
   madera de Mario (Plutarco, Mario 25, 101 a.C.) son posteriores: en 280–146 a.C. el doblado es LICENCIA DE JUEGO. Pesos,
   velocidades, ángulos y energías: licencia de juego (del orden de las pruebas modernas con réplicas). */
import { AGARRE } from './falange.js';

export const RADIO = { infante: 0.25, piquero: 0.25, falangita: 0.25, jinete: 0.45, elefante: 1.3 };
export const ALTO = { infante: 1.8, piquero: 1.8, falangita: 1.8, jinete: 2.5, elefante: 3.6 };
/* masa por tipo: un jinete o un elefante apartan a los hombres; un hombre no aparta a un elefante */
export const MASA = { infante: 1, piquero: 1, falangita: 1, jinete: 4, elefante: 20 };
export const MASA_CAIDO = 2, TOPE_CAIDO = 2.5;   /* el caído se arrastra: pesa como dos hombres */
export const RADIO_CAIDO = { infante: 0.35, piquero: 0.35, falangita: 0.35, jinete: 0.8, elefante: 1.6 };   /* el caído: estorbo bajo */
/* el escudo del infante: una caja de pie delante del cuerpo, algo a su izquierda (scutum, aspís) */
export const ESCUDO = { ancho: 0.65, grueso: 0.08, y0: 0.25, y1: 1.35, delante: 0.32, izq: 0.1 };
export const CON_ESCUDO = { infante: true, piquero: true };
export const MIN_DIST = 0.45;     /* la vara: dos hombres dibujados nunca más cerca que esto */
export const TOPE = 1.2;          /* lo más que se aparta un hombre de su sitio de las reglas (tope duro; lo normal lo frena el muelle) */
export const K_MUELLE = 9, C_FRENO = 7;   /* muelle hacia el sitio (ω = 3/s) con amortiguación algo por encima de la crítica (6) y rozamiento: no rebota */
export const V_MAX = 8;           /* m/s: más que esto en las reglas es un salto (reinicio), no una carrera */
export const CELDA = 1;           /* rejilla espacial de 1 m */
export const RESBALA = 0.5;       /* el asta resbala hacia atrás entre las manos hasta esto */
export const EMPUJA_DESDE = 0.3;  /* desde aquí la punta ya empuja (antes del tope: así el asta nunca llega a él) */
export const TOPE_EMPUJE = 0.15;  /* lo más que empuja una pica en un fotograma, a cada lado */
export const PASA_ATRAS = 0.6;    /* el de detrás recula al menos esto de lo que recula el de delante */
export const CERCA_MANO = 0.5;    /* quien está a menos de esto de la mano no para el asta (ya está dentro del bosque) */
export const PUNTA = 0.25;        /* la punta: los últimos 0,25 m */

/* FI3: los proyectiles. masa (kg), largo (m), v de lanzamiento típica (m/s); E: energía (J, sobre la perpendicular) que hace
   falta para clavarse en escudo, herir a través del casco y clavarse en el cuerpo; dobla: si su hierro se dobla en el escudo */
export const PROYECTIL = {
  pilum:    { masa: 2.0,  largo: 2.0,  v: 20, E: { escudo: 60, casco: 120, cuerpo: 15 }, dobla: true },
  jabalina: { masa: 0.8,  largo: 1.5,  v: 22, E: { escudo: 40, casco: 90,  cuerpo: 10 }, dobla: false },
  flecha:   { masa: 0.03, largo: 0.75, v: 45, E: { escudo: 8,  casco: 25,  cuerpo: 4 },  dobla: false },
};
/* ángulos límite (grados desde la perpendicular): más inclinado que esto, rebota (con algo de azar, ±AZAR_ANG) */
export const ANG = { escudo: 58, casco: 32, cuerpo: 70 };
export const AZAR_ANG = 8;
export const DOBLA_E = 250;          /* J sobre la perpendicular: desde aquí el hierro del pilum se dobla (con azar ±30 %) */
export const SUELO_CLAVA = 30;       /* grados de caída bajo la horizontal: más empinado y con V_CLAVA, se clava de pie */
export const V_CLAVA = 6;            /* m/s: más lento que esto, nada se clava: cae */
export const REBOTE = { normal: 0.25, roce: 0.55 };   /* lo que conserva el rebote: de la velocidad perpendicular y de la de roce */
export const MAX_REBOTES = 2;        /* tras dos rebotes, el siguiente toque lo deja en el suelo */
export const G = 9.81;
export const SUBPASO = 1;            /* m: largo máximo de cada tramo recto del vuelo */
export const CASCO = { r: 0.14, baja: 0.14 };        /* el casco: esfera de 0,14 m con el centro 0,14 m bajo la coronilla */
export const CUELLO = 0.28;          /* el cuerpo (cilindro) acaba 0,28 m bajo la coronilla; encima, el casco */
/* el escudo alzado (testudo, h.guardia === 'alto'): la misma caja, tumbada sobre la cabeza */
export const ESCUDO_ALTO = { y: 1.85, delante: 0.4 };   /* adelantado: tapa también la cabeza del de delante (las tejas del testudo) */
/* el muro cerrado (h.guardia === 'muro': la 1.ª fila del testudo, o quien aguanta una salva): algo agachado (la cabeza baja
   MURO.agacha) y con el escudo subido MURO.sube, hasta los ojos; por arriba casi toca el techo de la 2.ª fila */
export const MURO = { sube: 0.28, agacha: 0.1 };

const xyz = v => Array.isArray(v) ? v : [v.x, v.y, v.z];
const tipoF = h => h.tipo || 'falangita';

export function crearFisica(op = {}) {
  const H = op.H || (() => 0), ESC = op.escala || 1, parMin = op.parMin;   /* FI2: escala de los radios (1 en la falange) y, si se da, parMin(a, b) → distancia mínima propia de esa pareja (o undefined) */
  /* LP5a: caidoFijo (el caído no se arrastra: el vivo se aparta entero); parMax (m): con él, parMin también puede ALARGAR la
     distancia de una pareja hasta parMax (escudo contra escudo). Sin ellos, todo como antes */
  const fijoC = !!op.caidoFijo, DMAX_PAR = op.parMax || 0;
  let rivales = [], empujes = new Map();
  /* FI5: el paso no pide memoria nueva: listas, radios, masas y rejillas se reutilizan de un paso a otro (crecen si hace falta) */
  const L = [], C = [];
  let R, M, RC;   /* radios, masas (vivos) y radios de los caídos: arrays tipados, ver carga() */

  /* cuerpos que cuentan: tus hombres vivos y no huidos, y los del rival vivos */
  function cuerpos(S, L = []) {   /* paso le da su lista (reutilizada); medir y vuela, una nueva */
    L.length = 0;
    for (const h of S.fal) if (h.vivo && !h.huye) L.push(h);
    for (const h of S.ene) if (h.vivo) L.push(h);
    return L;
  }
  /* los caídos: estorbo bajo, quietos donde cayeron (masa infinita) */
  function caidos(S, C = []) {
    C.length = 0;
    for (const h of S.fal) if (!h.vivo) C.push(h);
    for (const h of S.ene) if (!h.vivo) C.push(h);
    return C;
  }
  const rad = h => (RADIO[tipoF(h)] ?? 0.25) * ESC, radC = h => h.tendido && h.tendido.r ? h.tendido.r : (RADIO_CAIDO[tipoF(h)] ?? 0.35) * ESC, masa = h => MASA[tipoF(h)] || 1;
  /* dónde se dibuja un caído: donde cayó (h.x, h.z; la escena lo guarda en h.caido) más lo que lo han arrastrado (fx, fz) */
  const dondeC = h => [h.x + (h.fx || 0), h.z + (h.fz || 0)];
  const clave = (ix, iz) => ((ix + 32768) << 16) | ((iz + 32768) & 0xffff);
  /* FI5: rejilla espacial de 1 m en arrays tipados que se reutilizan. Densa sobre la caja que ocupan los cuerpos (celda
     (ix, iz) → (ix - x0)·alto + (iz - z0)): las celdas de una misma columna quedan seguidas, y un tramo de items las recorre
     en el orden de siempre (dz creciente; dentro de cada celda, índices crecientes). Si la caja es enorme (alguien muy
     lejos), tabla hash abierta. En los dos modos el orden de los choques es el de la rejilla con Map de antes. */
  function nuevaRejilla() {
    let T = 0, mask = 0, llave = null, sello = null, cuenta = null, inicio = null, gen = 0, usadas = null;
    let celdaDe = new Int32Array(0), items = new Int32Array(0), CI = new Int32Array(0), CZ = new Int32Array(0), arranque = new Int32Array(0);
    let densa = false, x0 = 0, z0 = 0, ancho = 0, alto = 0;
    const G = {
      ini: 0, fin: 0,
      haz(n, X, Z, FX, FZ) {
        if (celdaDe.length < n) { const c = n * 2; celdaDe = new Int32Array(c); items = new Int32Array(c); CI = new Int32Array(c); CZ = new Int32Array(c); }
        let mx = Infinity, Mx = -Infinity, mz = Infinity, Mz = -Infinity;
        for (let i = 0; i < n; i++) {
          const ix = Math.floor((X[i] + FX[i]) / CELDA), iz = Math.floor((Z[i] + FZ[i]) / CELDA); CI[i] = ix; CZ[i] = iz;
          if (ix < mx) mx = ix; if (ix > Mx) Mx = ix; if (iz < mz) mz = iz; if (iz > Mz) Mz = iz;
        }
        const nc = n ? (Mx - mx + 1) * (Mz - mz + 1) : 0;
        densa = nc <= Math.max(4096, n * 16);
        if (densa) {
          x0 = mx; z0 = mz; ancho = n ? Mx - mx + 1 : 0; alto = n ? Mz - mz + 1 : 0;
          if (arranque.length < nc + 1) arranque = new Int32Array(Math.max(nc + 1, 1024));
          arranque.fill(0, 0, nc + 1);
          for (let i = 0; i < n; i++) { const c = (CI[i] - x0) * alto + (CZ[i] - z0); celdaDe[i] = c; arranque[c + 1]++; }
          for (let c = 0; c < nc; c++) arranque[c + 1] += arranque[c];
          for (let i = 0; i < n; i++) items[arranque[celdaDe[i]]++] = i;
          for (let c = nc; c > 0; c--) arranque[c] = arranque[c - 1];   /* deshace el corrimiento: arranque[c] vuelve a ser el inicio de c */
          arranque[0] = 0;
          return;
        }
        let t = 64; while (t < n * 4) t <<= 1;
        if (t > T) { T = t; mask = t - 1; llave = new Int32Array(t); sello = new Int32Array(t); cuenta = new Int32Array(t); inicio = new Int32Array(t); usadas = new Int32Array(t); gen = 0; }
        if (++gen > 0x3fffffff) { sello.fill(0); gen = 1; }
        let nu = 0;
        for (let i = 0; i < n; i++) {
          const k = clave(CI[i], CZ[i]);
          let s = Math.imul(k, 0x9E3779B1) >>> 0 & mask;
          while (sello[s] === gen && llave[s] !== k) s = (s + 1) & mask;
          if (sello[s] !== gen) { sello[s] = gen; llave[s] = k; cuenta[s] = 0; usadas[nu++] = s; }
          cuenta[s]++; celdaDe[i] = s;
        }
        let a = 0; for (let u = 0; u < nu; u++) { const s = usadas[u]; inicio[s] = a; a += cuenta[s]; cuenta[s] = inicio[s]; }
        for (let i = 0; i < n; i++) items[cuenta[celdaDe[i]]++] = i;   /* al acabar, cuenta[s] es el fin de la celda s */
      },
      /* deja en G.ini, G.fin el tramo de items de las celdas (ix, iz0..iz1), seguidas y en orden; false si no hay nadie */
      columna(ix, iz0, iz1) {
        if (densa) {
          if (ix < x0 || ix >= x0 + ancho) return false;
          const a = Math.max(iz0, z0) - z0, b = Math.min(iz1, z0 + alto - 1) - z0; if (a > b) return false;
          const base = (ix - x0) * alto; G.ini = arranque[base + a]; G.fin = arranque[base + b + 1]; return G.ini < G.fin;
        }
        return false;
      },
      get densa() { return densa; },
      /* solo en modo hash: una celda */
      celda(ix, iz) {
        const k = clave(ix, iz); let s = Math.imul(k, 0x9E3779B1) >>> 0 & mask;
        while (sello[s] === gen) { if (llave[s] === k) { G.ini = inicio[s]; G.fin = cuenta[s]; return true; } s = (s + 1) & mask; }
        return false;
      },
      get items() { return items; },
    };
    return G;
  }
  const GV = nuevaRejilla(), GC = nuevaRejilla();
  const posV = h => [h.x + (h.fx || 0), h.z + (h.fz || 0)];
  function rejilla(L, pos) {   /* la de siempre, con Map: para medir y vuela (fuera del paso) */
    const G = new Map();
    for (let i = 0; i < L.length; i++) { const p = pos(L[i], i), k = clave(Math.floor(p[0] / CELDA), Math.floor(p[1] / CELDA)); let c = G.get(k); if (!c) G.set(k, c = []); c.push(i); }
    return G;
  }
  /* tope duro: nadie se aparta más de TOPE de su sitio; si lo toca, pierde la velocidad hacia fuera */
  const tope = h => { const m = Math.hypot(h.fx, h.fz); if (m > TOPE) { const ux = h.fx / m, uz = h.fz / m, vn = h.vx * ux + h.vz * uz; h.fx = ux * TOPE; h.fz = uz * TOPE; if (vn > 0) { h.vx -= ux * vn; h.vz -= uz * vn; } } };
  /* velocidad que dan las reglas (lo que se movió x, z en este paso); con tope, por si hubo un salto.
     antes: por hombre, dónde lo puso la regla en el paso anterior y si estaba vivo ({ x, z, vivo }; se reescribe, no se crea) */
  let antes = new WeakMap();
  function velReglas(h, dt, p) {
    let ux = 0, uz = 0;
    if (p && dt > 0) { ux = (h.x - p.x) / dt; uz = (h.z - p.z) / dt; const m = Math.hypot(ux, uz); if (m > V_MAX) { ux *= V_MAX / m; uz *= V_MAX / m; } }
    h.ux = ux; h.uz = uz;
  }

  /* FI5: durante el paso, los vivos (L) y los caídos (C) se copian a arrays tipados (Float64: las mismas cuentas, bit a bit)
     y se devuelven al final. X, Z: sitio de las reglas; FX, FZ: desplazamiento; VX, VZ: velocidad; UX, UZ: la de las reglas */
  let cap = 0, X, Z, FX, FZ, VX, VZ, UX, UZ, capC = 0, CX, CZ, CFX, CFZ;
  function carga() {
    const n = L.length, m = C.length;
    if (n > cap) { cap = n * 2; X = new Float64Array(cap); Z = new Float64Array(cap); FX = new Float64Array(cap); FZ = new Float64Array(cap); VX = new Float64Array(cap); VZ = new Float64Array(cap); UX = new Float64Array(cap); UZ = new Float64Array(cap); R = new Float64Array(cap); M = new Float64Array(cap); }
    if (m > capC) { capC = m * 2 + 8; CX = new Float64Array(capC); CZ = new Float64Array(capC); CFX = new Float64Array(capC); CFZ = new Float64Array(capC); RC = new Float64Array(capC); }
    for (let i = 0; i < n; i++) { const h = L[i]; X[i] = h.x; Z[i] = h.z; FX[i] = h.fx; FZ[i] = h.fz; VX[i] = h.vx; VZ[i] = h.vz; UX[i] = h.ux; UZ[i] = h.uz; }
    for (let j = 0; j < m; j++) { const h = C[j]; CX[j] = h.x; CZ[j] = h.z; CFX[j] = h.fx; CFZ[j] = h.fz; }
  }
  function descarga() {
    for (let i = 0, n = L.length; i < n; i++) { const h = L[i]; h.fx = FX[i]; h.fz = FZ[i]; h.vx = VX[i]; h.vz = VZ[i]; }
    for (let j = 0, m = C.length; j < m; j++) { const h = C[j]; h.fx = CFX[j]; h.fz = CFZ[j]; }
  }
  const TOPE2 = TOPE * TOPE * (1 - 1e-9);   /* por debajo de esto el tope ni se mira (sin raíz) */
  function topeI(i) {
    const fx = FX[i], fz = FZ[i]; if (fx * fx + fz * fz < TOPE2) return;
    const m = Math.hypot(fx, fz); if (m > TOPE) { const ux = fx / m, uz = fz / m, vn = VX[i] * ux + VZ[i] * uz; FX[i] = ux * TOPE; FZ[i] = uz * TOPE; if (vn > 0) { VX[i] -= ux * vn; VZ[i] -= uz * vn; } }
  }

  /* una pasada de choques entre vivos: se apartan a la suma de radios (cada uno según su masa) y el choque es
     inelástico: la velocidad que se acercaban se reparte por masa (el impulso pasa de uno a otro) */
  function choca(rMax) {
    const nL = L.length; GV.haz(nL, X, Z, FX, FZ); const I = GV.items;
    for (let i = 0; i < nL; i++) {
      const ra = R[i], n = Math.ceil((ra + Math.max(rMax, DMAX_PAR / 2)) / CELDA), ax = X[i] + FX[i], az = Z[i] + FZ[i];
      const cx = Math.floor(ax / CELDA), cz = Math.floor(az / CELDA), ia = 1 / M[i];
      const densa = GV.densa;
      for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) {
        if (densa) { if (!GV.columna(cx + dx, cz - n, cz + n)) { dz = n; continue; } dz = n; } else if (!GV.celda(cx + dx, cz + dz)) continue;   /* densa: la columna entera de una vez */
        for (let q = GV.ini, fin = GV.fin; q < fin; q++) {
          const j = I[q];
          if (j <= i) continue;
          const rs = ra + R[j], rl = rs > DMAX_PAR ? rs : DMAX_PAR;
          let vx = (X[j] + FX[j]) - (X[i] + FX[i]), vz = (Z[j] + FZ[j]) - (Z[i] + FZ[i]);
          if (vx * vx + vz * vz >= rl * rl * (1 + 1e-9)) continue;   /* lejos, sin raíz (sin parMax, parMin solo acorta la distancia mínima) */
          const pm = parMin ? parMin(L[i], L[j]) : undefined, min = pm === undefined ? rs : DMAX_PAR ? Math.min(pm, DMAX_PAR) : Math.min(rs, pm); let d = Math.hypot(vx, vz);
          if (d >= min) continue;
          if (d < 1e-6) { const g = (i * 2.399 + j) % 6.283; vx = Math.cos(g); vz = Math.sin(g); d = 0; } else { vx /= d; vz /= d; }
          const ib = 1 / M[j], wa = ia / (ia + ib), o = min - d;
          FX[i] -= vx * o * wa; FZ[i] -= vz * o * wa; FX[j] += vx * o * (1 - wa); FZ[j] += vz * o * (1 - wa);
          const vr = (UX[j] + VX[j] - UX[i] - VX[i]) * vx + (UZ[j] + VZ[j] - UZ[i] - VZ[i]) * vz;
          if (vr < 0) { const J = -vr / (ia + ib); VX[i] -= vx * J * ia; VZ[i] -= vz * J * ia; VX[j] += vx * J * ib; VZ[j] += vz * J * ib; }
          topeI(i); topeI(j);
        }
      }
    }
  }
  /* los vivos no pisan a los caídos: se apartan los dos según su masa (el caído pesa MASA_CAIDO y se arrastra, sin muelle:
     queda donde lo dejan, como mucho a TOPE_CAIDO de donde cayó); el vivo pierde la velocidad que llevaba hacia él */
  /* LP5a: el caído puede ser una cápsula tendida (h.tendido = { dx, dz, largo, r }: de los pies hacia la cabeza); con caidoFijo
     no se arrastra (el vivo se aparta entero); el vivo con h.salta (va deprisa) pasa por encima */
  const TOPE_C2 = (TOPE_CAIDO - 1e-6) * (TOPE_CAIDO - 1e-6) * (1 - 1e-9);
  let largoC = 0;
  function noPisa() {
    const nC = C.length; if (!nC) return;
    GC.haz(nC, CX, CZ, CFX, CFZ); const I = GC.items, n = Math.ceil((1.3 + 1.6 + largoC) / CELDA), densa = GC.densa;
    for (let i = 0, nL = L.length; i < nL; i++) {
      if (L[i].salta) continue;
      const ra = R[i], k = ra > 0.5 ? n : Math.ceil((1 + largoC) / CELDA), wa = fijoC ? 1 : (1 / M[i]) / (1 / M[i] + 1 / MASA_CAIDO);
      for (let pase = 0, movido = true; pase < 2 && movido; pase++) {   /* la 2.ª pasada, solo si la 1.ª movió algo (si no, daría lo mismo) */
        movido = false;
        const ax = X[i] + FX[i], az = Z[i] + FZ[i], cx = Math.floor(ax / CELDA), cz = Math.floor(az / CELDA);
        for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) {
          if (densa) { if (!GC.columna(cx + dx, cz - k, cz + k)) { dz = k; continue; } dz = k; } else if (!GC.celda(cx + dx, cz + dz)) continue;
          for (let q = GC.ini, fin = GC.fin; q < fin; q++) {
            const j = I[q], min = ra + RC[j], t = C[j].tendido; let vx = X[i] + FX[i] - CX[j] - CFX[j], vz = Z[i] + FZ[i] - CZ[j] - CFZ[j];
            if (t) { const s = Math.max(0, Math.min(t.largo, vx * t.dx + vz * t.dz)); vx -= t.dx * s; vz -= t.dz * s; }   /* al punto más cercano del cuerpo tendido */
            if (vx * vx + vz * vz >= min * min * (1 + 1e-9)) continue;   /* lejos, sin raíz */
            let d = Math.hypot(vx, vz);
            if (d >= min) continue;
            if (d < 1e-6) { vx = t ? -t.dz : 1; vz = t ? t.dx : 0; } else { vx /= d; vz /= d; }
            /* el caído ya no se deja arrastrar más: el vivo pasa por encima (las reglas lo llevan allí) */
            const bx = CFX[j], bz = CFZ[j]; if (!fijoC && bx * bx + bz * bz >= TOPE_C2 && Math.hypot(bx, bz) >= TOPE_CAIDO - 1e-6) continue;
            movido = true; const o = min - d; FX[i] += vx * o * wa; FZ[i] += vz * o * wa; if (!fijoC) { CFX[j] -= vx * o * (1 - wa); CFZ[j] -= vz * o * (1 - wa); }
            const vn = (UX[i] + VX[i]) * vx + (UZ[i] + VZ[i]) * vz; if (vn < 0) { VX[i] -= vx * vn * wa; VZ[i] -= vz * vn * wa; }
            topeI(i); const m = Math.hypot(CFX[j], CFZ[j]); if (m > TOPE_CAIDO) { CFX[j] *= TOPE_CAIDO / m; CFZ[j] *= TOPE_CAIDO / m; }
          }
        }
      }
    }
  }

  /* compresión fila a fila: si el de delante recula, el de detrás recula al menos PASA_ATRAS de eso.
     Los primeros nF de L son S.fal vivos y no huidos, en su orden: se trabaja por índice. Las columnas se guardan entre pasos */
  const col = new Map(), porR = (a, b) => L[a].r - L[b].r;
  let nF = 0;
  function aprieta(S) {
    const Fx = Math.sin(S.giro || 0), Fz = -Math.cos(S.giro || 0);
    for (const c of col.values()) c.length = 0;
    if (col.size > 4096) col.clear();
    for (let i = 0; i < nF; i++) { const f = L[i].f; let c = col.get(f); if (!c) col.set(f, c = []); c.push(i); }
    for (const c of col.values()) {
      if (c.length < 2) continue;
      c.sort(porR);
      for (let k = 1; k < c.length; k++) {
        const a = c[k - 1], b = c[k], ra = -(FX[a] * Fx + FZ[a] * Fz), rb = -(FX[b] * Fx + FZ[b] * Fz), falta = PASA_ATRAS * ra - rb;
        if (ra > 0 && falta > 0) { FX[b] -= Fx * falta; FZ[b] -= Fz * falta; topeI(b); }
      }
    }
  }

  function muelle(h, dt) {
    h.fx = h.fx || 0; h.fz = h.fz || 0; h.vx = h.vx || 0; h.vz = h.vz || 0;
    let p = antes.get(h);
    if (h.vivo) {
      velReglas(h, dt, p);
      const ax = -K_MUELLE * h.fx - C_FRENO * h.vx, az = -K_MUELLE * h.fz - C_FRENO * h.vz;
      h.vx += ax * dt; h.vz += az * dt; h.fx += h.vx * dt; h.fz += h.vz * dt;
    } else if (p && p.vivo) {
      /* acaba de caer: hacia donde iba (su velocidad de dibujo y la de las reglas) o hacia donde le empujaban */
      const e = empujes.get(h), gx = h.vx + (h.ux || 0) * 0.3 + (e ? e.x / Math.max(dt, 1e-3) : 0), gz = h.vz + (h.uz || 0) * 0.3 + (e ? e.z / Math.max(dt, 1e-3) : 0);
      if (Math.hypot(gx, gz) > 0.05) h.fCae = Math.atan2(gx, gz);
      h.vx = h.vz = 0;
    }
    if (!p) antes.set(h, p = { x: 0, z: 0, vivo: false });
    p.vivo = h.vivo; p.x = h.x; p.z = h.z;
  }
  function paso(S, dt) {
    /* muelle amortiguado hacia el sitio de las reglas (sin rebote) y rozamiento */
    for (const h of S.fal) muelle(h, dt);
    for (const h of S.ene) muelle(h, dt);
    /* los empujes que dejaron las picas en el último fotograma: mueven ya y dejan velocidad */
    for (const [h, e] of empujes) if (h.vivo) { h.fx += e.x; h.fz += e.z; if (dt > 0) { h.vx += e.x / dt * 0.5; h.vz += e.z / dt * 0.5; } tope(h); }
    empujes.clear();
    cuerpos(S, L); caidos(S, C); carga();
    nF = 0; for (const h of S.fal) if (h.vivo && !h.huye) nF++;
    let rMax = 0; for (let i = 0; i < L.length; i++) { const h = L[i]; R[i] = rad(h); M[i] = masa(h); rMax = Math.max(rMax, R[i]); }
    largoC = 0; for (let j = 0; j < C.length; j++) { RC[j] = radC(C[j]); const t = C[j].tendido; if (t && t.largo > largoC) largoC = t.largo; }
    choca(rMax); noPisa(); aprieta(S); noPisa(); choca(rMax); choca(rMax);   /* al final, que los vivos no se solapen */
    if (fijoC) { noPisa(); choca(rMax); }   /* LP5a: con caídos fijos, otra vuelta: que nadie acabe sobre un caído */
    descarga();
    rivales.length = 0; for (const h of S.ene) if (h.vivo) rivales.push(h);
  }

  /* tramo [tin, tout] del rayo P + D·t dentro del volumen de h (cuerpo o escudo), o null */
  function tramoCuerpo(h, P, D) {
    const r = rad(h), cx = h.x + (h.fx || 0), cz = h.z + (h.fz || 0), g = H(cx, cz), ox = P[0] - cx, oz = P[2] - cz, a = D[0] * D[0] + D[2] * D[2];
    let tin = -Infinity, tout = Infinity;
    if (a < 1e-9) { if (ox * ox + oz * oz > r * r) return null; }
    else { const b = ox * D[0] + oz * D[2], c = ox * ox + oz * oz - r * r, q = b * b - a * c; if (q < 0) return null; const s = Math.sqrt(q); tin = (-b - s) / a; tout = (-b + s) / a; }
    const y0 = g, y1 = g + (ALTO[tipoF(h)] || 1.8);
    if (Math.abs(D[1]) < 1e-9) { if (P[1] < y0 || P[1] > y1) return null; }
    else { let t0 = (y0 - P[1]) / D[1], t1 = (y1 - P[1]) / D[1]; if (t0 > t1) [t0, t1] = [t1, t0]; tin = Math.max(tin, t0); tout = Math.min(tout, t1); }
    return tin <= tout ? [tin, tout] : null;
  }
  function tramoEscudo(h, P, D) {
    if (!CON_ESCUDO[tipoF(h)]) return null;
    const y = h.yaw || 0, fx = Math.sin(y), fz = Math.cos(y), lx = Math.cos(y), lz = -Math.sin(y);   /* frente e izquierda del hombre */
    const px = h.x + (h.fx || 0), pz = h.z + (h.fz || 0), g = H(px, pz);
    const cx = px + fx * ESCUDO.delante + lx * ESCUDO.izq, cz = pz + fz * ESCUDO.delante + lz * ESCUDO.izq, cy = g + (ESCUDO.y0 + ESCUDO.y1) / 2;
    const ox = P[0] - cx, oy = P[1] - cy, oz = P[2] - cz;
    const ejes = [[ox * fx + oz * fz, D[0] * fx + D[2] * fz, ESCUDO.grueso / 2], [ox * lx + oz * lz, D[0] * lx + D[2] * lz, ESCUDO.ancho / 2], [oy, D[1], (ESCUDO.y1 - ESCUDO.y0) / 2]];
    let tin = -Infinity, tout = Infinity;
    for (const [o, d, m] of ejes) {
      if (Math.abs(d) < 1e-9) { if (Math.abs(o) > m) return null; continue; }
      let t0 = (-m - o) / d, t1 = (m - o) / d; if (t0 > t1) [t0, t1] = [t1, t0]; tin = Math.max(tin, t0); tout = Math.min(tout, t1); if (tin > tout) return null;
    }
    return [tin, tout];
  }
  /* el primer rival (escudo o cuerpo) que entra en el tramo [t0, t1] del asta; lista: los rivales a mirar */
  function primero(P, D, t0, t1, lista) {
    let mejor = null;
    const sx = Math.min(P[0] + D[0] * t0, P[0] + D[0] * t1) - 1.6, ex = Math.max(P[0] + D[0] * t0, P[0] + D[0] * t1) + 1.6;
    const sz = Math.min(P[2] + D[2] * t0, P[2] + D[2] * t1) - 1.6, ez = Math.max(P[2] + D[2] * t0, P[2] + D[2] * t1) + 1.6;
    for (const h of lista) {
      if (!h.vivo) continue;
      const x = h.x + (h.fx || 0), z = h.z + (h.fz || 0); if (x < sx || x > ex || z < sz || z > ez) continue;
      for (const [T, en] of [[tramoEscudo(h, P, D), 'escudo'], [tramoCuerpo(h, P, D), 'cuerpo']]) {
        if (!T || T[1] < t0 || T[0] > t1) continue;
        const t = Math.max(T[0], t0); if (!mejor || t < mejor.t) mejor = { t, h, en };
      }
    }
    return mejor;
  }

  /* la pica bajada de h: ¿qué corta de la mano hacia delante? */
  function pica(h, P0, D0, L) {
    if (!h.vivo || h.huye || !(h.kB > 0.5)) return { ret: 0 };
    const P = xyz(P0), D = xyz(D0), mano = AGARRE + CERCA_MANO;
    let m = primero(P, D, mano, L, rivales);
    /* a un rival pegado a la mano no se le hace caso (el asta pasa por su lado)... salvo que la punta acabe dentro de él:
       entonces cuenta desde donde lo corta el asta; resbala hasta 0,5 y lo que sobra lo empuja */
    if (!m) { const c = primero(P, D, L - PUNTA, L, rivales); if (c) m = primero(P, D, AGARRE, L, [c.h]) || c; }
    if (!m) return { ret: 0 };
    const o = L - m.t + 0.02; let ret = Math.min(o, RESBALA); const e = Math.min(TOPE_EMPUJE, (o - EMPUJA_DESDE) / 2);
    const n = Math.hypot(D[0], D[2]) || 1, ux = D[0] / n, uz = D[2] / n;
    /* si el asta ya no resbala más (de golpe: la pica baja o el rival da un paso), el rival recula ya lo que sobra */
    if (o > RESBALA) {
      const b = m.h, x0 = b.fx || 0, z0 = b.fz || 0; b.fx = x0 + ux * (o - RESBALA); b.fz = z0 + uz * (o - RESBALA); b.vx = b.vx || 0; b.vz = b.vz || 0; tope(b);
      /* si el rival ya está a tope y no recula todo, el asta resbala lo que falta (solo entonces pasa de 0,5) */
      const hecho = (b.fx - x0) * ux + (b.fz - z0) * uz; ret = Math.min(o, Math.max(ret, o - hecho));
    }
    if (e > 0) { apunta(m.h, ux * e, uz * e); apunta(h, -ux * e, -uz * e); }
    return { ret, h: m.h, en: m.en };
  }
  /* cada hombre se lleva el mayor empujón del fotograma (no la suma: varias picas, o la misma dibujada dos veces) */
  function apunta(h, x, z) { const v = empujes.get(h); if (!v || x * x + z * z > v.x * v.x + v.z * v.z) empujes.set(h, { x, z }); }

  function medir(S, picas = []) {
    const L = cuerpos(S), G = rejilla(L, posV); let dMin = Infinity, pisados = 0;
    const C = caidos(S); if (C.length) { const pc = C.map(dondeC); for (const a of L) { const ax = a.x + (a.fx || 0), az = a.z + (a.fz || 0); if (pc.some((p, j) => Math.hypot(ax - p[0], az - p[1]) < radC(C[j]))) pisados++; } }
    for (let i = 0; i < L.length; i++) {
      const a = L[i], ax = a.x + (a.fx || 0), az = a.z + (a.fz || 0), cx = Math.floor(ax / CELDA), cz = Math.floor(az / CELDA);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const c = G.get(clave(cx + dx, cz + dz)); if (!c) continue;
        for (const j of c) if (j > i) { const b = L[j]; dMin = Math.min(dMin, Math.hypot(b.x + (b.fx || 0) - ax, b.z + (b.fz || 0) - az)); }
      }
    }
    const ene = S.ene.filter(h => h.vivo); let dentro = 0;
    const detalle = [];
    for (const p of picas) { const P = xyz(p.P), D = xyz(p.D), c = primero(P, D, p.L - PUNTA, p.L, ene); if (c) { dentro++; const t = primero(P, D, 0, p.L, [c.h]); detalle.push({ i: p.h.i, r: p.h.r, kB: +(p.h.kB || 0).toFixed(2), deMano: +((t ? t.t : c.t) - AGARRE).toFixed(2), en: c.en, est: c.h.est, tipo: c.h.tipo, f: +Math.hypot(c.h.fx || 0, c.h.fz || 0).toFixed(2) }); } }
    return { distMin: dMin, puntasDentro: dentro, pisados, detalle };
  }

  /* ---------- FI3: proyectiles ---------- */
  let semilla = (op.semilla ?? 1) >>> 0;
  const azar = op.azar || (() => { semilla = (semilla + 0x6D2B79F5) >>> 0; let t = semilla; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; });
  const proyectiles = [];
  const marco = h => { const y = h.yaw || 0; return { fx: Math.sin(y), fz: Math.cos(y), lx: Math.cos(y), lz: -Math.sin(y) }; };
  const altoDe = h => ((ALTO[tipoF(h)] || 1.8) - (h.guardia === 'muro' ? MURO.agacha : 0)) * ESC;

  function lanza(tipo, P0, V0, de) {
    const P = xyz(P0), V = xyz(V0);
    const p = { tipo, x: P[0], y: P[1], z: P[2], vx: V[0], vy: V[1], vz: V[2], est: 'vuela', en: null, doblado: false, rebotes: 0, de: de || null, t: 0, fijo: null };
    proyectiles.push(p); return p;
  }
  /* la caja del escudo de h en su marco: centro y ejes (frente, izquierda, arriba) con sus medias medidas */
  function cajaEscudo(h) {
    if (!CON_ESCUDO[tipoF(h)]) return null;
    const m = marco(h), px = h.x + (h.fx || 0), pz = h.z + (h.fz || 0), g = H(px, pz);
    const ancho = ESCUDO.ancho / 2 * ESC, alto = (ESCUDO.y1 - ESCUDO.y0) / 2 * ESC, grueso = ESCUDO.grueso / 2 * ESC;
    if (h.guardia === 'alto') {
      /* tumbado: su cara mira arriba; lo largo va hacia delante */
      const c = [px + m.fx * ESCUDO_ALTO.delante * ESC, g + ESCUDO_ALTO.y * ESC, pz + m.fz * ESCUDO_ALTO.delante * ESC];
      return { c, ejes: [[[0, 1, 0], grueso], [[m.lx, 0, m.lz], ancho], [[m.fx, 0, m.fz], alto]] };
    }
    const sube = h.guardia === 'muro' ? MURO.sube : 0;
    const c = [px + (m.fx * ESCUDO.delante + m.lx * ESCUDO.izq) * ESC, g + ((ESCUDO.y0 + ESCUDO.y1) / 2 + sube) * ESC, pz + (m.fz * ESCUDO.delante + m.lz * ESCUDO.izq) * ESC];
    return { c, ejes: [[[m.fx, 0, m.fz], grueso], [[m.lx, 0, m.lz], ancho], [[0, 1, 0], alto]] };
  }
  /* primer t ∈ [0, 1] en que el tramo A→A+D entra en la caja; normal: el eje de la cara (la cara del escudo es el eje 0) */
  function cortaCaja(K, A, D) {
    let tin = -Infinity, tout = Infinity, cara = 0;
    for (let k = 0; k < 3; k++) {
      const [e, m] = K.ejes[k], o = (A[0] - K.c[0]) * e[0] + (A[1] - K.c[1]) * e[1] + (A[2] - K.c[2]) * e[2], d = D[0] * e[0] + D[1] * e[1] + D[2] * e[2];
      if (Math.abs(d) < 1e-12) { if (Math.abs(o) > m) return null; continue; }
      let t0 = (-m - o) / d, t1 = (m - o) / d; if (t0 > t1) [t0, t1] = [t1, t0];
      if (t0 > tin) { tin = t0; cara = k; } tout = Math.min(tout, t1); if (tin > tout) return null;
    }
    if (tin > 1 || tout < 0) return null;
    const t = Math.max(0, tin), e = K.ejes[0][0];   /* la normal es siempre la de la cara ancha: el canto no cuenta aparte */
    return { t, n: e };
  }
  function cortaCasco(h, A, D) {
    const px = h.x + (h.fx || 0), pz = h.z + (h.fz || 0), r = CASCO.r * ESC, c = [px, H(px, pz) + altoDe(h) - CASCO.baja * ESC, pz];
    const o = [A[0] - c[0], A[1] - c[1], A[2] - c[2]], a = D[0] * D[0] + D[1] * D[1] + D[2] * D[2], b = o[0] * D[0] + o[1] * D[1] + o[2] * D[2], cc = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - r * r;
    if (a < 1e-12) return null;
    const q = b * b - a * cc; if (q < 0) return null;
    const t = cc <= 0 ? 0 : (-b - Math.sqrt(q)) / a; if (t < 0 || t > 1) return null;
    const P = [A[0] + D[0] * t - c[0], A[1] + D[1] * t - c[1], A[2] + D[2] * t - c[2]], m = Math.hypot(...P) || 1;
    return { t, n: [P[0] / m, P[1] / m, P[2] / m] };
  }
  function cortaCuerpo(h, A, D) {
    const r = rad(h), cx = h.x + (h.fx || 0), cz = h.z + (h.fz || 0), g = H(cx, cz), y1 = g + altoDe(h) - CUELLO * ESC;
    const ox = A[0] - cx, oz = A[2] - cz, a = D[0] * D[0] + D[2] * D[2];
    let tin = -Infinity, tout = Infinity, tapa = false;
    if (a < 1e-12) { if (ox * ox + oz * oz > r * r) return null; }
    else { const b = ox * D[0] + oz * D[2], c = ox * ox + oz * oz - r * r, q = b * b - a * c; if (q < 0) return null; const s = Math.sqrt(q); tin = (-b - s) / a; tout = (-b + s) / a; }
    if (Math.abs(D[1]) < 1e-12) { if (A[1] < g || A[1] > y1) return null; }
    else { let t0 = (g - A[1]) / D[1], t1 = (y1 - A[1]) / D[1]; if (t0 > t1) [t0, t1] = [t1, t0]; if (t0 > tin) { tin = t0; tapa = true; } tout = Math.min(tout, t1); }
    if (tin > tout || tin > 1 || tout < 0) return null;
    /* entra por arriba (los hombros: lo que cae casi en vertical) → normal hacia arriba; si no, la del costado */
    if (tapa && tin >= 0) return { t: tin, n: [0, Math.sign(-D[1]) || 1, 0] };
    const t = Math.max(0, tin), x = A[0] + D[0] * t - cx, z = A[2] + D[2] * t - cz, m = Math.hypot(x, z) || 1;
    return { t, n: [x / m, 0, z / m] };
  }
  /* lo primero que toca el tramo A→A+D: escudo, casco o cuerpo de alguien (no de quien lo lanzó ni del que acaba de rebotar).
     Solo mira las celdas de la rejilla Rj que cubre el tramo (más 1,6 m: el elefante) */
  function toca(p, A, D, L, Rj) {
    let mejor = null;
    const cx0 = Math.floor((Math.min(A[0], A[0] + D[0]) - 1.6) / CELDA), cx1 = Math.floor((Math.max(A[0], A[0] + D[0]) + 1.6) / CELDA);
    const cz0 = Math.floor((Math.min(A[2], A[2] + D[2]) - 1.6) / CELDA), cz1 = Math.floor((Math.max(A[2], A[2] + D[2]) + 1.6) / CELDA);
    for (let ix = cx0; ix <= cx1; ix++) for (let iz = cz0; iz <= cz1; iz++) {
      const c = Rj.get(clave(ix, iz)); if (!c) continue;
      for (const j of c) {
        const h = L[j]; if (h === p.de || h === p.ignora) continue;
        const K = cajaEscudo(h);
        let r = K && cortaCaja(K, A, D); if (r && (!mejor || r.t < mejor.t - 1e-9)) mejor = { ...r, h, en: 'escudo' };
        r = cortaCasco(h, A, D); if (r && (!mejor || r.t < mejor.t - 1e-9)) mejor = { ...r, h, en: 'casco' };
        r = cortaCuerpo(h, A, D); if (r && (!mejor || r.t < mejor.t - 1e-9)) mejor = { ...r, h, en: 'cuerpo' };
      }
    }
    return mejor;
  }
  const grados = r => r * 180 / Math.PI;
  /* deja p quieto donde está; si se clava en un hombre, guarda dónde en su marco para seguirle */
  function fija(p, h) {
    p.vx = p.vy = p.vz = 0;
    if (!h) return;
    const m = marco(h), ox = p.x - (h.x + (h.fx || 0)), oz = p.z - (h.z + (h.fz || 0)), d = p.dir;
    p.fijo = { h, f: ox * m.fx + oz * m.fz, l: ox * m.lx + oz * m.lz, y: p.y - H(h.x + (h.fx || 0), h.z + (h.fz || 0)), df: d[0] * m.fx + d[2] * m.fz, dl: d[0] * m.lx + d[2] * m.lz, dy: d[1] };
  }
  function rebota(p, n, av, en, h, ang, v) {
    const vn = p.vx * n[0] + p.vy * n[1] + p.vz * n[2], tx = p.vx - vn * n[0], ty = p.vy - vn * n[1], tz = p.vz - vn * n[2];
    /* sale por el lado de donde vino, con lo que conserva y un poco de azar (el asta gira) */
    const k = REBOTE.roce * (0.7 + 0.6 * azar()), s = -vn * REBOTE.normal;
    p.vx = tx * k + n[0] * s + (azar() - 0.5) * 1.5; p.vy = ty * k + n[1] * s + (azar() - 0.5) * 1.0; p.vz = tz * k + n[2] * s + (azar() - 0.5) * 1.5;
    /* lo saca un poco de la superficie para que no la vuelva a tocar en el acto */
    p.x += n[0] * 0.02 * Math.sign(-vn || 1); p.y += n[1] * 0.02 * Math.sign(-vn || 1); p.z += n[2] * 0.02 * Math.sign(-vn || 1);
    p.rebotes++; p.ignora = h || null; av.push({ aviso: 'rebota', en, p, h: h || null, ang, v });
  }

  /* un impacto: decide clavar, rebotar, herir o caer */
  function impacto(p, c, av) {
    const T = PROYECTIL[p.tipo] || PROYECTIL.jabalina, v = Math.hypot(p.vx, p.vy, p.vz) || 1e-9, n = c.n;
    const cosA = Math.min(1, Math.abs(p.vx * n[0] + p.vy * n[1] + p.vz * n[2]) / v), ang = grados(Math.acos(cosA));
    const En = 0.5 * T.masa * v * v * cosA * cosA, lento = v < V_CLAVA || p.rebotes >= MAX_REBOTES;
    p.dir = [p.vx / v, p.vy / v, p.vz / v];
    const lim = (ANG[c.en] ?? 60) + (azar() * 2 - 1) * AZAR_ANG;
    if (c.en === 'escudo') {
      if (!lento && ang < lim && En > T.E.escudo) {
        p.est = 'clavado'; p.en = 'escudo'; fija(p, c.h); av.push({ aviso: 'clava', en: 'escudo', p, h: c.h, ang, v });
        if (T.masa >= 0.5) c.h.pila = (c.h.pila || 0) + 1;   /* un pilum o una jabalina clavados estorban; una flecha, no */
        if (T.dobla && En > DOBLA_E * (0.7 + 0.6 * azar())) { p.doblado = true; av.push({ aviso: 'dobla', en: 'escudo', p, h: c.h, ang, v }); }
        return;
      }
      if (lento) return cae(p, av, c.h);
      return rebota(p, n, av, 'escudo', c.h, ang, v);
    }
    if (c.en === 'casco') {
      if (!lento && ang < lim && En > T.E.casco) { av.push({ aviso: 'hiere', en: 'casco', p, h: c.h, ang, v, herida: 'grave' }); return cae(p, av, c.h, true); }
      if (lento) return cae(p, av, c.h);
      return rebota(p, n, av, 'casco', c.h, ang, v);
    }
    /* cuerpo */
    if (!lento && ang < lim && En > T.E.cuerpo) {
      p.est = 'clavado'; p.en = 'cuerpo'; fija(p, c.h);
      av.push({ aviso: 'clava', en: 'cuerpo', p, h: c.h, ang, v, herida: En > 3 * T.E.cuerpo + 30 ? 'grave' : 'leve' });
      return;
    }
    if (lento) return cae(p, av, c.h);
    return rebota(p, n, av, 'cuerpo', c.h, ang, v);
  }
  /* cae al suelo bajo donde está (a los pies de h si se dio con él); sin aviso propio si ya hubo uno */
  function cae(p, av, h, callado) {
    const g = H(p.x, p.z); p.y = g + 0.03; p.est = 'caido'; p.en = 'suelo'; p.plano = true;
    const v = Math.hypot(p.vx, p.vz) || 1; p.dir = [p.vx / v, 0, p.vz / v]; if (!(Math.abs(p.dir[0]) + Math.abs(p.dir[2]))) p.dir = [1, 0, 0];
    p.vx = p.vy = p.vz = 0; if (!callado) av.push({ aviso: 'cae', en: 'suelo', p, h: h || null, ang: 90, v });
  }
  function suelo(p, t, A, D, av) {
    p.x = A[0] + D[0] * t; p.z = A[2] + D[2] * t; const g = H(p.x, p.z); p.y = g;
    const vh = Math.hypot(p.vx, p.vz), v = Math.hypot(vh, p.vy), caida = grados(Math.atan2(-p.vy, vh));
    if (!(p.rebotes >= MAX_REBOTES) && v >= V_CLAVA && caida > SUELO_CLAVA) {
      p.est = 'clavado'; p.en = 'suelo'; p.dir = [p.vx / v, p.vy / v, p.vz / v]; p.plano = false; p.vx = p.vy = p.vz = 0;
      av.push({ aviso: 'clava', en: 'suelo', p, h: null, ang: 90 - caida, v }); return;
    }
    /* de plano: si viene rápido y rasante, rebota una vez en la tierra; si no, se queda tendido */
    if (p.rebotes < 1 && v > 12 && caida < 15) return rebota(p, [0, 1, 0], av, 'suelo', null, 90 - caida, v);
    cae(p, av, null);
  }

  /* mueve los que vuelan y resuelve sus impactos. Cada tramo se corta de forma exacta con escudos, cascos y cuerpos (no se
     salta ninguno); los subpasos de ≤ SUBPASO solo siguen la curva de la gravedad */
  function vuela(S, dt) {
    const av = []; if (!proyectiles.some(p => p.est === 'vuela')) return av;
    const L = cuerpos(S), Rj = rejilla(L, posV);
    for (const p of proyectiles) {
      if (p.est !== 'vuela') continue;
      const v0 = Math.hypot(p.vx, p.vy, p.vz), n = Math.max(1, Math.ceil(v0 * dt / SUBPASO)), h = dt / n;
      for (let k = 0; k < n && p.est === 'vuela'; k++) {
        p.t += h;
        const A = [p.x, p.y, p.z], vy1 = p.vy - G * h, D = [p.vx * h, (p.vy + vy1) / 2 * h, p.vz * h];
        const c = toca(p, A, D, L, Rj);
        /* el suelo: primer t en que la punta baja de H */
        let ts = null; const gB = H(A[0] + D[0], A[2] + D[2]);
        if (A[1] + D[1] <= gB) { const gA = H(A[0], A[2]), fa = A[1] - gA, fb = A[1] + D[1] - gB; ts = fa <= 0 ? 0 : fa / (fa - fb); }
        if (c && (ts === null || c.t <= ts)) {
          p.x = A[0] + D[0] * c.t; p.y = A[1] + D[1] * c.t; p.z = A[2] + D[2] * c.t; p.vy = p.vy - G * h * c.t; p.ignora = null;
          impacto(p, c, av);
        } else if (ts !== null) { p.vy = p.vy - G * h * ts; suelo(p, ts, A, D, av); }
        else { p.x += D[0]; p.y += D[1]; p.z += D[2]; p.vy = vy1; if (p.ignora && p.rebotes && p.t > 0) { /* se aleja: deja de ignorarlo al salir de su alcance */ const q = p.ignora; if (Math.hypot(p.x - q.x - (q.fx || 0), p.z - q.z - (q.fz || 0)) > 1) p.ignora = null; } }
        if (p.t > 20 && p.est === 'vuela') cae(p, av, null);   /* seguro: nada vuela más de 20 s */
      }
    }
    return av;
  }
  /* dónde dibujar p: punta y dirección; el clavado en un hombre le sigue (y si el hombre gira, gira con él) */
  function dondeP(p) {
    if (p.fijo) {
      const f = p.fijo, h = f.h, m = marco(h), hx = h.x + (h.fx || 0), hz = h.z + (h.fz || 0);
      return { x: hx + m.fx * f.f + m.lx * f.l, y: H(hx, hz) + f.y, z: hz + m.fz * f.f + m.lz * f.l, dx: m.fx * f.df + m.lx * f.dl, dy: f.dy, dz: m.fz * f.df + m.lz * f.dl };
    }
    const v = Math.hypot(p.vx, p.vy, p.vz), d = v > 1e-6 ? [p.vx / v, p.vy / v, p.vz / v] : (p.dir || [1, 0, 0]);
    return { x: p.x, y: p.y, z: p.z, dx: d[0], dy: d[1], dz: d[2] };
  }
  /* quita de la lista los que ya no vuelan (los clavados en un hombre muerto o los del suelo, cuando quien dibuja no los quiera) */
  function limpia(quedar = () => false) { for (let i = proyectiles.length - 1; i >= 0; i--) { const p = proyectiles[i]; if (p.est !== 'vuela' && !quedar(p)) proyectiles.splice(i, 1); } }

  return { paso, pica, medir, lanza, vuela, dondeP, limpia, proyectiles, reinicia() { empujes = new Map(); rivales = []; antes = new WeakMap(); proyectiles.length = 0; } };
}

/* ===================== FI3: proyectiles que se clavan, rebotan o resbalan =====================
   Solo decide CÓMO SE VE cada pilum (o venablo). Quién muere y qué para cada uno lo deciden las reglas. Azar propio con
   semilla: nunca toca el azar de las reglas. Diseño: gobierno/estudios/FI3-diseno-proyectiles.md. Contrato en la cabecera
   de crearProyectiles. Ángulo de llegada: 0° = de frente a la cara (escudo, cuerpo), al suelo (vertical) o al asta (de lado). */
export const PR = {
  LARGO: 2.06, CM: 0.85,        /* largo del pilum y su centro de masas desde la punta (el hierro pesa delante) */
  PUNTA: 0.25, HUNDE: 0.12,     /* lo que puede quedar dentro de lo que lo lleva; lo que se hunde al clavarse (≤ 0,15) */
  CLAVA_ESCUDO: 60, CLAVA_SUELO: 25, CLAVA_ASTA: 35,   /* grados: escudo de frente, suelo bajo la horizontal, asta casi de frente */
  CANTO: 0.06, CASCO: 0.25,     /* a menos de 6 cm del borde del escudo rebota; lo alto del cuerpo (casco) rebota */
  E: 0.25, MU: 0.5, G: 9.8,     /* elasticidad del rebote, rozamiento, gravedad */
  RADIO: 0.02, T_MAX: 2.5        /* grosor del asta; segundos máximos dando tumbos antes de quedarse tumbado */
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], sum = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
const nor = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const gira = (v, e, w) => { const c = Math.cos(w), s = Math.sin(w), k = dot(e, v) * (1 - c), x = cruz(e, v); return [v[0] * c + x[0] * s + e[0] * k, v[1] * c + x[1] * s + e[1] * k, v[2] * c + x[2] * s + e[2] * k]; };
/* matrices 4×4 por columnas (como THREE.Matrix4.elements) */
const mPunto = (M, p) => [M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]];
const mDir = (M, p) => [M[0] * p[0] + M[4] * p[1] + M[8] * p[2], M[1] * p[0] + M[5] * p[1] + M[9] * p[2], M[2] * p[0] + M[6] * p[1] + M[10] * p[2]];
function mInv(M) {   /* inversa de una matriz afín */
  const [a, b, c, d, e, f, g, h, i] = [M[0], M[4], M[8], M[1], M[5], M[9], M[2], M[6], M[10]];
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C || 1e-12;
  const R = [A / det, (c * h - b * i) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, (c * d - a * f) / det, C / det, (b * g - a * h) / det, (a * e - b * d) / det];
  const t = [M[12], M[13], M[14]], T = [-(R[0] * t[0] + R[1] * t[1] + R[2] * t[2]), -(R[3] * t[0] + R[4] * t[1] + R[5] * t[2]), -(R[6] * t[0] + R[7] * t[1] + R[8] * t[2])];
  return [R[0], R[3], R[6], 0, R[1], R[4], R[7], 0, R[2], R[5], R[8], 0, T[0], T[1], T[2], 1];
}
function generador(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashI = i => { let h = Math.imul(i + 1, 2654435761) >>> 0; h ^= h >>> 16; return Math.imul(h, 2246822507) >>> 0; };

/* CONTRATO (FI3)
   import { crearProyectiles } from './fisica-batalla.js';
   const Pr = crearProyectiles({ H, escala, semilla, largo, mismo });   H(x, z) suelo; escala de los grosores (1); semilla del azar
                                  propio; largo del asta (PR.LARGO; cada proyectil puede traer el suyo en p.largo, y su centro de
                                  masas se escala con él); mismo(a, b): dos dueños que cuentan como uno (p. ej. tiras de un escudo)
   Obstáculos (los da el adaptador cada fotograma, como se dibujan; mejor solo los cercanos):
     { tipo: 'escudo', c: [x,y,z] centro, n normal hacia fuera, u ancho, v alto (unitarios), m: [½ grueso, ½ ancho, ½ alto], umbo?: radio, dueno }
     { tipo: 'cuerpo', x, z, y0, y1, r, dueno }              cilindro; lo alto (PR.CASCO) es el casco
     { tipo: 'asta', a: [x,y,z], b: [x,y,z], r, dueno }      cápsula (sarisa alzada)
   Pr.vuela(p, punta, vel, obst)  en vuelo (manda la regla): punta del pilum y su velocidad. Si el tramo desde la punta anterior
                                  toca algo, o el astil (cola→punta) cruza algo, se para en el contacto (p.fi.toca) y sigue a ese
                                  escudo o cuerpo. → pose { punta, dir }
   Pr.llega(p, que, obst, M)      la regla decide: que = { tipo: 'escudo'|'cuerpo'|'asta'|'suelo', dueno, o? (su obstáculo) };
                                  M = matriz del hueso o del asta que lo lleva. → modo: 'clava' | 'rebota' | 'resbala' | 'cae'
                                  ('cae': la regla dijo suelo y aún no lo toca: sigue cayendo y decide al tocar).
                                  Si el vuelo tocó otra cosa (o nada), vale lo de la regla y cuenta p.fi.salto = 'otro' | 'nada'
                                  (y llega desde ≥ 50° de alto, para no cruzar a los de delante). que.otroVale = true: vale
                                  cualquier obstáculo de ese tipo (p. ej. un asta alzada cualquiera); p.fi.dueno dice cuál.
                                  que.vale = ['asta', 'escudo']: también vale lo tocado de esos tipos (decide como él).
                                  M puede ser una función (dueno, tipo) → matriz, para el dueño y el tipo que resulten
   Pr.mueve(p, dt, obst)          rebotes, caídas y resbalones (nunca atraviesa suelo ni obstáculos); el clavado en el suelo que
                                  queda dentro de un hombre que pasa se tumba
   Pr.pose(p, M, obst?)           → { punta, dir } a dibujar; el clavado sigue a M (la matriz actual de lo que lo lleva).
                                  Con obst: si el astil del clavado entra en algo que no es su dueño, gira sobre la punta
                                  (hasta 30°) o sale hasta 15 cm (p.fi.ajustes cuenta cada arreglo); si no basta, se suelta y cae
   Pr.medir(lista, obst)          → { dentro, muestras, detalle, tramos, saltos }: astiles dentro de escudo, cuerpo o suelo
                                  (al clavado se le perdona la punta, PR.PUNTA, en lo que lo lleva), la cuenta por tramo de ángulo
                                  (tramos: solo caras de escudo y cuerpo, y suelo) y aparte { canto, umbo, casco, asta, cae }
   Pr.suelta(p)                   lo clavado cae desde donde está (el asta que lo lleva se baja, el escudo se suelta…)
   Pr.reinicia()                  pone a cero la cuenta
   Escribe solo en p.fi (las reglas no lo leen). Quien dibuja pone la cola en punta − largo·dir. */
export function crearProyectiles(op = {}) {
  const H = op.H || (() => 0), ESC = op.escala || 1, SEM = (op.semilla ?? 1) | 0, RA = PR.RADIO * ESC, L0 = op.largo || PR.LARGO;
  const mismo = op.mismo || ((a, b) => a === b);   /* dos dueños que son lo mismo (p. ej. las tiras de un mismo escudo) */
  let cuenta, contador = 0;
  function reinicia() { cuenta = { tramos: [0, 1, 2].map(() => ({ clava: 0, rebota: 0, resbala: 0 })), aparte: { canto: { clava: 0, rebota: 0 }, umbo: { clava: 0, rebota: 0 }, casco: { clava: 0, rebota: 0 }, asta: { clava: 0, rebota: 0 }, cae: { clava: 0, rebota: 0 } }, saltos: { otro: 0, nada: 0 }, saltosPor: {}, llegan: 0 }; }
  reinicia();
  const fi = p => p.fi || (p.fi = { modo: 'vuela', k: contador, az: generador(SEM ^ hashI(contador++)), L: p.largo || L0, CM: (p.largo || L0) * PR.CM / PR.LARGO });
  const suelo = q => H(q[0], q[2]);
  /* centro y radio de un obstáculo, para descartar los lejanos */
  function esfera(o) { return o.esf || (o.esf = esferaDe(o)); }
  function esferaDe(o) {
    if (o.tipo === 'escudo') return [o.c, Math.hypot(o.m[0], o.m[1], o.m[2])];
    if (o.tipo === 'cuerpo') return [[o.x, (o.y0 + o.y1) / 2, o.z], Math.hypot(o.r, (o.y1 - o.y0) / 2)];
    return [[(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2, (o.a[2] + o.b[2]) / 2], len(sub(o.b, o.a)) / 2 + o.r];
  }
  function cerca(obst, A, B, extra = 0) {   /* los obstáculos a menos de su radio del tramo AB */
    const L = [], dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], dd = dx * dx + dy * dy + dz * dz || 1e-9;   /* sin arrays nuevos: es el camino caliente */
    for (let i = 0; i < obst.length; i++) { const o = obst[i], e = esfera(o), c = e[0], R = e[1] + extra + 0.05, cx = c[0] - A[0], cy = c[1] - A[1], cz = c[2] - A[2], t = Math.max(0, Math.min(1, (cx * dx + cy * dy + cz * dz) / dd)), ex = cx - dx * t, ey = cy - dy * t, ez = cz - dz * t; if (ex * ex + ey * ey + ez * ez < R * R) L.push(o); }
    return L;
  }
  const local = (o, q) => { const w = sub(q, o.c); return [dot(w, o.n), dot(w, o.u), dot(w, o.v)]; };
  /* primer corte del tramo A→B (t en 0–1) con un obstáculo: { t, punto, normal, cara, canto, umbo } */
  function corta(o, A, B) {
    if (o.tipo === 'escudo') {
      const a = local(o, A), b = local(o, B); let t0 = 0, t1 = 1, k0 = -1, s0 = 1;
      for (let k = 0; k < 3; k++) {
        const d = b[k] - a[k], m = o.m[k];
        if (Math.abs(d) < 1e-12) { if (Math.abs(a[k]) > m) return null; continue; }
        let ta = (-m - a[k]) / d, tb = (m - a[k]) / d, s = -1; if (ta > tb) { [ta, tb] = [tb, ta]; s = 1; }
        if (ta > t0) { t0 = ta; k0 = k; s0 = s; } t1 = Math.min(t1, tb); if (t0 > t1) return null;
      }
      if (k0 < 0) k0 = 0, s0 = Math.sign(a[0]) || 1;   /* ya dentro: sale por la cara */
      const ax = [o.n, o.u, o.v][k0], normal = [ax[0] * s0, ax[1] * s0, ax[2] * s0], q = a.map((x, k) => x + (b[k] - x) * t0);
      return { t: t0, punto: sum(A, sub(B, A), t0), normal, cara: k0 === 0, canto: Math.min(o.m[1] - Math.abs(q[1]), o.m[2] - Math.abs(q[2])), umbo: !!o.umbo && Math.hypot(q[1], q[2]) < o.umbo * ESC };
    }
    if (o.tipo === 'cuerpo') {
      const dx = B[0] - A[0], dz = B[2] - A[2], ax = A[0] - o.x, az = A[2] - o.z, aa = dx * dx + dz * dz, bb = 2 * (ax * dx + az * dz), cc = ax * ax + az * az - o.r * o.r;
      let mejor = null;
      if (cc <= 0 && A[1] >= o.y0 && A[1] <= o.y1) return { t: 0, punto: A.slice(), normal: nor([ax, 0, az]) };
      if (aa > 1e-12) { const D = bb * bb - 4 * aa * cc; if (D >= 0) { const t = (-bb - Math.sqrt(D)) / (2 * aa); if (t >= 0 && t <= 1) { const y = A[1] + (B[1] - A[1]) * t; if (y >= o.y0 && y <= o.y1) mejor = { t, punto: sum(A, sub(B, A), t), normal: nor([ax + dx * t, 0, az + dz * t]) }; } } }
      if (A[1] > o.y1 && B[1] <= o.y1) { const t = (A[1] - o.y1) / (A[1] - B[1]), x = ax + dx * t, z = az + dz * t; if (x * x + z * z <= o.r * o.r && (!mejor || t < mejor.t)) mejor = { t, punto: sum(A, sub(B, A), t), normal: [0, 1, 0] }; }
      return mejor;
    }
    /* asta: segmentos más cercanos */
    const u = sub(B, A), v = sub(o.b, o.a), w = sub(A, o.a), a = dot(u, u), b = dot(u, v), c = dot(v, v), d = dot(u, w), e = dot(v, w), D = a * c - b * b;
    let s = D > 1e-12 ? (b * e - c * d) / D : 0; s = Math.max(0, Math.min(1, s)); let t = c > 1e-12 ? (b * s + e) / c : 0; t = Math.max(0, Math.min(1, t)); s = a > 1e-12 ? Math.max(0, Math.min(1, (b * t - d) / a)) : 0;
    const p = sum(A, u, s), q = sum(o.a, v, t), dist = len(sub(p, q)); if (dist > o.r + RA) return null;
    return { t: s, punto: p, normal: dist > 1e-6 ? nor(sub(p, q)) : nor(cruz(v, cruz(u, v))), eje: nor(v) };
  }
  function cortaSuelo(A, B) {
    if (B[1] >= suelo(B)) return null; let lo = 0, hi = 1;
    if (A[1] < suelo(A)) return { t: 0, punto: A.slice(), normal: [0, 1, 0] };
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2, q = sum(A, sub(B, A), m); if (q[1] < suelo(q)) hi = m; else lo = m; }
    const q = sum(A, sub(B, A), hi); q[1] = suelo(q); return { t: hi, punto: q, normal: [0, 1, 0] };
  }
  function primero(A, B, obst) {
    let m = cortaSuelo(A, B); if (m) m.tipo = 'suelo';
    for (const o of cerca(obst, A, B)) { const c = corta(o, A, B); if (c && (!m || c.t < m.t)) { c.tipo = o.tipo; c.dueno = o.dueno; c.o = o; m = c; } }
    return m;
  }
  function dentro(o, q, tol = 0.005) {
    if (o.tipo === 'escudo') { const wx = q[0] - o.c[0], wy = q[1] - o.c[1], wz = q[2] - o.c[2], n = o.n, u = o.u, v = o.v, m = o.m; return Math.abs(wx * n[0] + wy * n[1] + wz * n[2]) < m[0] - tol && Math.abs(wx * u[0] + wy * u[1] + wz * u[2]) < m[1] - tol && Math.abs(wx * v[0] + wy * v[1] + wz * v[2]) < m[2] - tol; }
    if (o.tipo === 'cuerpo') return q[1] > o.y0 && q[1] < o.y1 && Math.hypot(q[0] - o.x, q[2] - o.z) < o.r - tol;
    return false;   /* el asta es fina: no se cuenta */
  }
  /* saca un punto de un obstáculo: → vector de salida y su normal */
  function saca(o, q) {
    if (o.tipo === 'escudo') { const l = local(o, q), ax = [o.n, o.u, o.v]; let k = 0, pen = Infinity; for (let i = 0; i < 3; i++) { const p = o.m[i] - Math.abs(l[i]) + (i ? 0.02 : 0); if (p < pen) { pen = p; k = i; } } const s = Math.sign(l[k]) || 1, n = [ax[k][0] * s, ax[k][1] * s, ax[k][2] * s]; return [n, o.m[k] - Math.abs(l[k]) + 0.01]; }
    const n = nor([q[0] - o.x, 0, q[2] - o.z]); return [n, o.r - Math.hypot(q[0] - o.x, q[2] - o.z) + 0.01];
  }
  const grados = (d, n) => Math.acos(Math.min(1, Math.abs(dot(d, n)))) * 180 / Math.PI;
  const extremos = f => [sum(f.x, f.d, f.CM), sum(f.x, f.d, f.CM - f.L * 0.5), sum(f.x, f.d, f.CM - f.L)];

  function vuela(p, punta, vel, obst) {
    const f = fi(p); if (f.modo !== 'vuela') return pose(p);
    if (f.toca) {   /* parado en el contacto: sigue al escudo o al cuerpo que tocó, que se mueve */
      const c = f.toca, o = c.o && obst.find(x => x.tipo === c.tipo && x.dueno === c.dueno);
      if (o && c.l) { const pt = o.tipo === 'escudo' ? sum(sum(sum(o.c, o.n, c.l[0]), o.u, c.l[1]), o.v, c.l[2]) : [o.x + c.l[0], o.y0 + c.l[1], o.z + c.l[2]]; c.punto = pt; f.pose = { punta: pt, dir: f.pose.dir }; }
      return f.pose;
    }
    const d = nor(vel);
    let c = f.prev ? primero(f.prev, punta, obst) : null;
    if (!c && f.prev) { const cola = sum(punta, d, -f.L); for (const o of cerca(obst, cola, punta)) { const k = corta(o, cola, punta); if (k && (!c || k.t < c.t)) { k.tipo = o.tipo; k.dueno = o.dueno; k.o = o; c = k; } } }   /* el astil entra en algo que la punta ya pasó: se para ahí */
    if (c) { if (c.o) c.l = c.o.tipo === 'escudo' ? local(c.o, c.punto) : c.o.tipo === 'cuerpo' ? [c.punto[0] - c.o.x, c.punto[1] - c.o.y0, c.punto[2] - c.o.z] : null; f.toca = c; f.v = vel.slice(); f.pose = { punta: c.punto, dir: d }; return f.pose; }
    f.prev = punta.slice(); f.v = vel.slice(); f.pose = { punta: punta.slice(), dir: d }; return f.pose;
  }
  /* la cuenta por ángulo solo para los golpes en la CARA (escudo, cuerpo) y en el suelo; canto, umbo, casco, asta y lo que
     encuentra al caer (la regla dijo suelo) van aparte: rebotan (o se clavan, el asta) por el sitio, no por el ángulo */
  function anota(f, ang, modo, sitio) { f.ang = ang; if (sitio) { cuenta.aparte[sitio][modo === 'clava' ? 'clava' : 'rebota']++; f.sitio = sitio; return; } const k = ang < 30 ? 0 : ang < 60 ? 1 : 2; cuenta.tramos[k][modo]++; }
  const sitioEscudo = c => !c.cara || c.canto <= PR.CANTO ? 'canto' : c.umbo ? 'umbo' : null;
  function clava(f, c, d, M) {
    const punta = sum(c.punto, d, PR.HUNDE); f.modo = 'clava';
    if (M) { const I = mInv(M); f.loc = mPunto(I, punta); f.dloc = mDir(I, d); } else { f.punta = punta; f.d = d; }
    return 'clava';
  }
  function rebota(f, c, v) {
    let n = c.normal; if (dot(v, n) > 0) n = [-n[0], -n[1], -n[2]];
    const d = nor(v), vn = dot(v, n), vt = sum(v, n, -vn), az = f.az;
    f.v = sum(sum([0, 0, 0], n, -PR.E * vn), vt, 1 - PR.MU);
    f.d = d; f.x = sum(sum(c.punto, n, 0.01), d, -f.CM);
    let e = cruz(d, n); if (len(e) < 1e-3) e = cruz(d, [0, 1, 0]); if (len(e) < 1e-3) e = [1, 0, 0];
    f.eje = nor(e); f.w = (4 + 6 * az()) * (az() < 0.5 ? -1 : 1); f.t = 0; f.modo = 'rebota'; return 'rebota';
  }
  function resbala(f, c, v) {
    const h = [v[0], 0, v[2]], s = len(h); f.dh = s > 1e-6 ? [h[0] / s, 0, h[2] / s] : nor([f.az() - 0.5, 0, f.az() - 0.5]);
    f.s = s * 0.7; f.punta = c.punto.slice(); f.modo = 'resbala'; asienta(f); return 'resbala';
  }
  /* pone el asta tumbada a ras de suelo, con la punta en f.punta y a lo largo de f.dh */
  function asienta(f) {
    const t = f.punta, c = sum(t, f.dh, -f.L); t[1] = suelo(t) + RA; c[1] = suelo(c) + RA; f.d = nor(sub(t, c));
  }
  function tumba(f) {
    const t = f.x ? sum(f.x, f.d, f.CM) : f.punta; let h = [f.d[0], 0, f.d[2]];
    f.dh = len(h) > 1e-3 ? nor(h) : nor([f.az() - 0.5, 0, f.az() - 0.5]); f.punta = t.slice(); f.modo = 'tumbado'; asienta(f);
  }
  function decideSuelo(f, c, v) {
    const d = nor(v), ang = grados(d, [0, 1, 0]);
    if (90 - ang > PR.CLAVA_SUELO) { anota(f, ang, 'clava'); return clava(f, c, d, null); }
    anota(f, ang, 'resbala'); return resbala(f, c, v);
  }
  function llega(p, que, obst = [], M = null) {
    const f = fi(p); if (f.modo !== 'vuela') return f.modo;
    cuenta.llegan++; f.que = que.tipo; f.dueno = que.dueno ?? null;
    const v = f.v || [0, -1, 0]; let d = nor(v), c = f.toca;
    const casa = c && (c.tipo === que.tipo || (que.vale && que.vale.includes(c.tipo))) && (que.tipo === 'suelo' || c.dueno === que.dueno || que.otroVale);
    if (casa && que.otroVale) f.dueno = c.dueno;
    if (casa && c.tipo !== que.tipo) { que = { ...que, tipo: c.tipo, o: c.o }; f.que = c.tipo; }   /* vale otro tipo (que.vale): decide como lo tocado */
    if (typeof M === 'function') M = (casa ? c.tipo : que.tipo) === 'suelo' ? null : M(f.dueno, casa ? c.tipo : que.tipo);
    if (!casa) { f.salto = c ? 'otro' : 'nada'; if (que.tipo !== 'suelo' || c) { cuenta.saltos[f.salto]++; const k = que.tipo + '←' + (c ? c.tipo : 'nada'); cuenta.saltosPor[k] = (cuenta.saltosPor[k] || 0) + 1; } c = null; }
    if (que.tipo === 'suelo') {
      if (c) return decideSuelo(f, c, v);
      if (f.salto === 'nada') { delete f.salto; }   /* aún en el aire: no es salto, sigue cayendo */
      f.x = sum(f.pose ? f.pose.punta : p.p, d, -f.CM); f.d = d; f.modo = 'cae'; f.t = 0; return 'cae';
    }
    if (!c) {   /* lo de la regla: proyecta la llegada sobre su obstáculo */
      if (que.tipo !== 'asta') { const hz = Math.hypot(d[0], d[2]) || 1, b = Math.max(Math.atan2(-d[1], hz), 50 * Math.PI / 180); d = [d[0] / hz * Math.cos(b), -Math.sin(b), d[2] / hz * Math.cos(b)]; }   /* licencia visual */
      const o = que.o || obst.find(o => o.tipo === que.tipo && o.dueno === que.dueno);
      if (o) { const [cc] = esfera(o), A = sum(o.tipo === 'asta' ? cc : (o.tipo === 'escudo' ? o.c : [o.x, (o.y0 + o.y1) / 2 + 0.2, o.z]), d, -3), B = sum(A, d, 6); c = corta(o, A, B); if (c) { c.tipo = o.tipo; c.o = o; } else c = { punto: o.tipo === 'asta' ? cc : sum(A, d, 3), normal: [-d[0], -d[1], -d[2]], tipo: o.tipo, o, cara: true, canto: 1 }; }
      else { f.x = sum(f.pose ? f.pose.punta : p.p, d, -f.CM); f.d = d; f.modo = 'cae'; f.t = 0; return 'cae'; }
    }
    const o = c.o;
    if (que.tipo === 'escudo') { const ang = grados(d, c.normal), si = sitioEscudo(c); if (si || ang >= PR.CLAVA_ESCUDO) { anota(f, ang, 'rebota', si); return rebota(f, c, v); } anota(f, ang, 'clava'); return clava(f, c, d, M); }
    if (que.tipo === 'cuerpo') { const ang = grados(d, c.normal); if (o && c.punto[1] > o.y1 - PR.CASCO * ESC) { anota(f, ang, 'rebota', 'casco'); return rebota(f, c, v); } anota(f, ang, 'clava'); return clava(f, c, d, M); }
    const eje = c.eje || (o ? nor(sub(o.b, o.a)) : [0, 1, 0]), ang = 90 - grados(d, eje);
    if (ang < PR.CLAVA_ASTA) { anota(f, ang, 'clava', 'asta'); return clava(f, c, d, M); }
    anota(f, ang, 'rebota', 'asta'); return rebota(f, { punto: c.punto, normal: c.normal }, v);
  }
  function mueve(p, dt, obst = []) {
    const f = p.fi; if (!f || dt <= 0 || f.modo === 'tumbado' || f.modo === 'vuela' || (f.modo === 'clava' && f.que !== 'suelo')) return;
    { const c0 = f.x || f.punta, vv = f.v || [0, 0, 0]; obst = cerca(obst, sum(c0, vv, -dt), sum(c0, vv, dt), f.L + (f.s || 0) * dt); }   /* solo los cercanos, una vez por fotograma */
    if (f.modo === 'clava' && f.que === 'suelo') {   /* lo pisa quien pasa: se tumba */
      for (let s = PR.PUNTA; s < f.L; s += 0.3) { const q = sum(f.punta, f.d, -s); if (obst.some(o => dentro(o, q))) { tumba(f); break; } }
      return;
    }
    if (f.modo === 'resbala') {
      const n = Math.max(1, Math.ceil(dt / 0.017)), h = dt / n;
      for (let i = 0; i < n && f.modo === 'resbala'; i++) {
        f.s = Math.max(0, f.s - PR.MU * PR.G * h); const t = sum(f.punta, f.dh, f.s * h); t[1] = suelo(t) + RA;
        if (f.s <= 0 || obst.some(o => dentro(o, t, 0))) { f.modo = 'tumbado'; break; }
        f.punta = t; asienta(f);
      }
      return;
    }
    if (f.modo !== 'rebota' && f.modo !== 'cae') return;
    const n = Math.min(6, Math.max(1, Math.ceil((Math.abs(f.w || 0) * 1.2 + len(f.v)) * dt / 0.05))), h = dt / n;   /* cada subpaso mueve el asta ≤ 5 cm (el escudo tiene 6 de grueso y el asta se mira entera) */
    let cer = null, esf = null;   /* los cercanos, una vez por fotograma, con su esfera para descartar sin cortar */
    const MED = f.CM - f.L / 2, R2 = f.L / 2 + 0.05;
    const choca = (x, d) => {
      if (!cer.length) return null; const mx = x[0] + d[0] * MED, my = x[1] + d[1] * MED, mz = x[2] + d[2] * MED; let T = null, C;
      for (let i = 0; i < cer.length; i++) { const e = esf[i], c = e[0], r = e[1] + R2; if ((c[0] - mx) ** 2 + (c[1] - my) ** 2 + (c[2] - mz) ** 2 > r * r) continue; if (!T) { T = sum(x, d, f.CM); C = sum(x, d, f.CM - f.L); } if (corta(cer[i], C, T)) return cer[i]; }
      return null;
    };
    const fuera = (o, x) => o.tipo === 'escudo' ? (dot(sub(x, o.c), o.n) >= 0 ? o.n : o.n.map(v => -v)) : nor([x[0] - o.x, 0, x[2] - o.z]);
    for (let i = 0; i < n; i++) {
      const A = sum(f.x, f.d, f.CM);
      f.v[1] -= PR.G * h; f.t += h;
      if (f.modo === 'cae') {   /* cae hasta tocar: decide como en el suelo; si da en un escudo o un hombre, rebota */
        f.x = sum(f.x, f.v, h); f.d = nor(f.v); const B = sum(f.x, f.d, f.CM), c = primero(A, B, obst);
        if (c && c.tipo === 'suelo') { decideSuelo(f, c, f.v); return; }
        if (c) { const ang = grados(f.d, c.normal); anota(f, ang, 'rebota', 'cae'); rebota(f, c, f.v); }   /* la regla dijo suelo: lo que encuentre al caer, rebota siempre (aparte) */
        else { if (!cer) { cer = obst.filter(o => o.tipo !== 'asta'); esf = cer.map(esfera); } const o = choca(f.x, f.d); if (o) { f.x = sum(f.x, f.v, -h); const nn = fuera(o, f.x); anota(f, grados(f.d, nn), 'rebota', 'cae'); rebota(f, { punto: sum(f.x, f.d, f.CM), normal: nn }, f.v); for (let k = 0, q; k < 10 && (q = choca(f.x, f.d)); k++) f.x = sum(f.x, fuera(q, f.x), 0.03); } }   /* el astil (no la punta) da en algo: rebota de canto */
        continue;
      }
      /* el asta entera (segmento) contra escudos y cuerpos: si girar la mete, no gira; si avanzar la mete, rebota y no avanza */
      if (!cer) { cer = obst.filter(o => o.tipo !== 'asta'); esf = cer.map(esfera);   /* si algo se le ha metido encima, primero sale (hasta 30 cm) */
        for (let k = 0, o; k < 10 && (o = choca(f.x, f.d)); k++) f.x = sum(f.x, fuera(o, f.x), 0.03);
        if (choca(f.x, f.d)) { tumba(f); return; } }   /* no sale: cae a ras de suelo (bajo el escudo y por debajo del cuerpo) */
      const d1 = nor(gira(f.d, f.eje, f.w * h));
      if (!choca(f.x, d1)) f.d = d1; else f.w *= -0.3;
      const x1 = sum(f.x, f.v, h), o = choca(x1, f.d);
      if (!o) f.x = x1;
      else {
        const nn = fuera(o, f.x), vn = dot(f.v, nn); if (vn < 0) f.v = sum(f.v, nn, -(1 + PR.E * 0.6) * vn); f.w *= 0.3; f.apoya = true;
        for (let k = 0, q; k < 10 && (q = choca(f.x, f.d)); k++) f.x = sum(f.x, fuera(q, f.x), 0.03);   /* el obstáculo se ha movido encima: se aparta */
      }
      let toca = false;
      for (const q of extremos(f)) { const pen = suelo(q) + RA - q[1]; if (pen > 0) { f.x[1] += pen; toca = true; } }
      if (toca && f.v[1] < 0) { f.v[1] *= -PR.E; f.v[0] *= 1 - PR.MU; f.v[2] *= 1 - PR.MU; f.w *= 0.5; }
      if (((toca || f.apoya) && (len(f.v) < 0.7 || f.t > 1)) || f.t > PR.T_MAX) { tumba(f); return; }   /* lento y apoyado (suelo o escudo): cae y se queda tumbado */
    }
    if (f.modo === 'rebota' && cer && choca(f.x, f.d)) tumba(f);   /* lo levantó el suelo contra un escudo: a ras de suelo */
  }
  /* el astil de un clavado (salvo la punta) no puede quedar dentro de nada que no sea su dueño: margen de 3 cm */
  const Q = [0, 0, 0];   /* vector de trabajo reutilizado */
  function astilLibre(f, punta, d, obst) {
    const cola = sum(punta, d, -f.L); if (cola[1] < suelo(cola) - 0.01) return false;
    for (const o of cerca(obst, punta, cola)) {
      if (o.tipo === 'asta') continue;
      const suyo = o.tipo === f.que && mismo(o.dueno, f.dueno);
      for (let s = suyo ? PR.PUNTA + 0.05 : 0.05; s <= f.L; s += 0.15) { Q[0] = punta[0] - d[0] * s; Q[1] = punta[1] - d[1] * s; Q[2] = punta[2] - d[2] * s; if (dentro(o, Q, -0.03)) return false; }
    }
    return true;
  }
  /* si el astil entra en otro (p. ej. el hombre que lo lleva cae sobre su vecino): gira sobre la punta hasta 30°; si no basta, se suelta */
  function libra(p, f, M, r, obst) {
    if (astilLibre(f, r.punta, r.dir, obst)) return r;
    let e1 = cruz(r.dir, [0, 1, 0]); if (len(e1) < 1e-3) e1 = [1, 0, 0]; e1 = nor(e1); const e2 = nor(cruz(r.dir, e1));
    const ejes = [e2, e1, e2.map(x => -x), e1.map(x => -x)];
    for (const k of [0, 0.05, 0.1, 0.15]) {   /* sacarlo k metros (la punta sigue en su escudo: se hunde PR.HUNDE) y girar sobre la punta */
      const pt = sum(r.punta, r.dir, -k);
      for (const w of k ? [0, 0.14, 0.28, 0.42, 0.52] : [0.14, 0.28, 0.42, 0.52]) for (const e of w ? ejes : [e1]) {
        const d = w ? nor(gira(r.dir, e, w)) : r.dir; if (!astilLibre(f, pt, d, obst)) continue;
        const I = mInv(M); f.dloc = mDir(I, d); f.loc = mPunto(I, pt); f.ajustes = (f.ajustes || 0) + 1; return { punta: pt, dir: d };
      }
    }
    f.pose = r; suelta(p); mueve(p, 1e-3, obst); return pose(p);   /* suelto: sale de lo que lo tiene metido */
  }
  function pose(p, M, obst) {
    const f = fi(p); let r;
    if (f.modo === 'vuela') return f.pose || null;
    if (f.modo === 'clava' && f.loc) { r = M ? { punta: mPunto(M, f.loc), dir: nor(mDir(M, f.dloc)) } : (f.pose || null); if (r && M && obst) r = libra(p, f, M, r, obst); if (f.modo !== 'clava') return f.pose; }
    else if (f.modo === 'rebota' || f.modo === 'cae') r = { punta: sum(f.x, f.d, f.CM), dir: f.d.slice() };
    else r = { punta: f.punta.slice(), dir: f.d.slice() };
    return (f.pose = r);
  }
  function medir(lista, obst = []) {
    let malos = 0, muestras = 0; const detalle = [];
    for (const p of lista) {
      const f = p.fi, q0 = f && f.pose; if (!q0) continue; muestras++;
      const suyo = o => f.modo === 'clava' && o.tipo === f.que && mismo(o.dueno, f.dueno);
      let mal = null;
      for (let s = 0.05; s <= f.L && !mal; s += 0.15) {
        const q = sum(q0.punta, q0.dir, -s), perdona = f.modo === 'clava' && s <= PR.PUNTA;
        if (q[1] < suelo(q) - 0.02 && !(perdona && f.que === 'suelo')) mal = { en: 'suelo', s };
        else for (const o of obst) if (dentro(o, q) && !(perdona && suyo(o))) { mal = { en: o.tipo, s, propio: o.dueno === f.dueno }; break; }
      }
      if (mal) { malos++; if (detalle.length < 6) detalle.push({ modo: f.modo, que: f.que, ...mal, s: +mal.s.toFixed(2) }); }
    }
    return { dentro: malos, muestras, detalle, tramos: JSON.parse(JSON.stringify(cuenta.tramos)), aparte: JSON.parse(JSON.stringify(cuenta.aparte)), saltos: { ...cuenta.saltos }, saltosPor: { ...cuenta.saltosPor }, llegan: cuenta.llegan };
  }
  /* lo clavado se suelta (p. ej. el asta que lo llevaba se baja): cae desde donde está, con un poco de giro */
  function suelta(p) { const f = p.fi, q = f && f.pose; if (!q || f.modo !== 'clava') return; f.x = sum(q.punta, q.dir, -f.CM); f.d = q.dir.slice(); f.v = [0, -0.5, 0]; f.eje = nor(cruz(f.d, [0, 1, 0]).map((x, k) => x || (k ? 0 : 1))); f.w = (1 + 2 * f.az()) * (f.az() < 0.5 ? -1 : 1); f.t = 0; f.modo = 'rebota'; delete f.loc; }
  return { vuela, llega, mueve, pose, medir, reinicia, suelta };
}
