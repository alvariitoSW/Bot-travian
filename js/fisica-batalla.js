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
  let rivales = [], empujes = new Map();

  /* cuerpos que cuentan: tus hombres vivos y no huidos, y los del rival vivos */
  function cuerpos(S) {
    const L = [];
    for (const h of S.fal) if (h.vivo && !h.huye) L.push(h);
    for (const h of S.ene) if (h.vivo) L.push(h);
    return L;
  }
  /* los caídos: estorbo bajo, quietos donde cayeron (masa infinita) */
  function caidos(S) {
    const L = [];
    for (const h of S.fal) if (!h.vivo) L.push(h);
    for (const h of S.ene) if (!h.vivo) L.push(h);
    return L;
  }
  const rad = h => (RADIO[tipoF(h)] ?? 0.25) * ESC, radC = h => (RADIO_CAIDO[tipoF(h)] ?? 0.35) * ESC, masa = h => MASA[tipoF(h)] || 1;
  /* dónde se dibuja un caído: donde cayó (h.x, h.z; la escena lo guarda en h.caido) más lo que lo han arrastrado (fx, fz) */
  const dondeC = h => [h.x + (h.fx || 0), h.z + (h.fz || 0)];
  const clave = (ix, iz) => ((ix + 32768) << 16) | ((iz + 32768) & 0xffff);
  function rejilla(L, pos) {
    const G = new Map();
    for (let i = 0; i < L.length; i++) { const p = pos(L[i], i), k = clave(Math.floor(p[0] / CELDA), Math.floor(p[1] / CELDA)); let c = G.get(k); if (!c) G.set(k, c = []); c.push(i); }
    return G;
  }
  const posV = h => [h.x + (h.fx || 0), h.z + (h.fz || 0)];
  /* tope duro: nadie se aparta más de TOPE de su sitio; si lo toca, pierde la velocidad hacia fuera */
  const tope = h => { const m = Math.hypot(h.fx, h.fz); if (m > TOPE) { const ux = h.fx / m, uz = h.fz / m, vn = h.vx * ux + h.vz * uz; h.fx = ux * TOPE; h.fz = uz * TOPE; if (vn > 0) { h.vx -= ux * vn; h.vz -= uz * vn; } } };
  /* velocidad que dan las reglas (lo que se movió x, z en este paso); con tope, por si hubo un salto */
  let prev = new WeakMap(), vivoAntes = new WeakMap();
  function velReglas(h, dt) {
    const p = prev.get(h); let ux = 0, uz = 0;
    if (p && dt > 0) { ux = (h.x - p[0]) / dt; uz = (h.z - p[1]) / dt; const m = Math.hypot(ux, uz); if (m > V_MAX) { ux *= V_MAX / m; uz *= V_MAX / m; } }
    h.ux = ux; h.uz = uz;
  }

  /* una pasada de choques entre vivos: se apartan a la suma de radios (cada uno según su masa) y el choque es
     inelástico: la velocidad que se acercaban se reparte por masa (el impulso pasa de uno a otro) */
  function choca(L, rMax, M) {
    const G = rejilla(L, posV);
    for (let i = 0; i < L.length; i++) {
      const a = L[i], ra = rad(a), n = Math.ceil((ra + rMax) / CELDA), ax = a.x + a.fx, az = a.z + a.fz;
      const cx = Math.floor(ax / CELDA), cz = Math.floor(az / CELDA), ia = 1 / M[i];
      for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) {
        const c = G.get(clave(cx + dx, cz + dz)); if (!c) continue;
        for (const j of c) {
          if (j <= i) continue;
          const b = L[j], pm = parMin ? parMin(a, b) : undefined, min = pm === undefined ? ra + rad(b) : Math.min(ra + rad(b), pm); let vx = (b.x + b.fx) - (a.x + a.fx), vz = (b.z + b.fz) - (a.z + a.fz), d = Math.hypot(vx, vz);
          if (d >= min) continue;
          if (d < 1e-6) { const g = (i * 2.399 + j) % 6.283; vx = Math.cos(g); vz = Math.sin(g); d = 0; } else { vx /= d; vz /= d; }
          const ib = 1 / M[j], wa = ia / (ia + ib), o = min - d;
          a.fx -= vx * o * wa; a.fz -= vz * o * wa; b.fx += vx * o * (1 - wa); b.fz += vz * o * (1 - wa);
          const vr = (b.ux + b.vx - a.ux - a.vx) * vx + (b.uz + b.vz - a.uz - a.vz) * vz;
          if (vr < 0) { const J = -vr / (ia + ib); a.vx -= vx * J * ia; a.vz -= vz * J * ia; b.vx += vx * J * ib; b.vz += vz * J * ib; }
          tope(a); tope(b);
        }
      }
    }
  }
  /* los vivos no pisan a los caídos: se apartan los dos según su masa (el caído pesa MASA_CAIDO y se arrastra, sin muelle:
     queda donde lo dejan, como mucho a TOPE_CAIDO de donde cayó); el vivo pierde la velocidad que llevaba hacia él */
  function noPisa(L, M, C) {
    if (!C.length) return;
    const G = rejilla(C, posV), n = Math.ceil((1.3 + 1.6) / CELDA);
    for (let i = 0; i < L.length; i++) {
      const a = L[i], ra = rad(a), k = ra > 0.5 ? n : 1, wa = (1 / M[i]) / (1 / M[i] + 1 / MASA_CAIDO);
      for (let pase = 0; pase < 2; pase++) {
        const ax = a.x + a.fx, az = a.z + a.fz, cx = Math.floor(ax / CELDA), cz = Math.floor(az / CELDA);
        for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) {
          const c = G.get(clave(cx + dx, cz + dz)); if (!c) continue;
          for (const j of c) {
            const b = C[j], min = ra + radC(b); let vx = a.x + a.fx - b.x - b.fx, vz = a.z + a.fz - b.z - b.fz, d = Math.hypot(vx, vz);
            if (d >= min) continue;
            if (d < 1e-6) { vx = 1; vz = 0; } else { vx /= d; vz /= d; }
            /* el caído ya no se deja arrastrar más: el vivo pasa por encima (las reglas lo llevan allí) */
            if (Math.hypot(b.fx, b.fz) >= TOPE_CAIDO - 1e-6) continue;
            const o = min - d; a.fx += vx * o * wa; a.fz += vz * o * wa; b.fx -= vx * o * (1 - wa); b.fz -= vz * o * (1 - wa);
            const vn = (a.ux + a.vx) * vx + (a.uz + a.vz) * vz; if (vn < 0) { a.vx -= vx * vn * wa; a.vz -= vz * vn * wa; }
            tope(a); const m = Math.hypot(b.fx, b.fz); if (m > TOPE_CAIDO) { b.fx *= TOPE_CAIDO / m; b.fz *= TOPE_CAIDO / m; }
          }
        }
      }
    }
  }

  /* compresión fila a fila: si el de delante recula, el de detrás recula al menos PASA_ATRAS de eso */
  function aprieta(S) {
    const Fx = Math.sin(S.giro || 0), Fz = -Math.cos(S.giro || 0), col = new Map();
    for (const h of S.fal) if (h.vivo && !h.huye) { let c = col.get(h.f); if (!c) col.set(h.f, c = []); c.push(h); }
    for (const c of col.values()) {
      c.sort((a, b) => a.r - b.r);
      for (let k = 1; k < c.length; k++) {
        const a = c[k - 1], b = c[k], ra = -(a.fx * Fx + a.fz * Fz), rb = -(b.fx * Fx + b.fz * Fz), falta = PASA_ATRAS * ra - rb;
        if (ra > 0 && falta > 0) { b.fx -= Fx * falta; b.fz -= Fz * falta; tope(b); }
      }
    }
  }

  function paso(S, dt) {
    /* muelle amortiguado hacia el sitio de las reglas (sin rebote) y rozamiento */
    const todos = S.fal.concat(S.ene);
    for (const h of todos) {
      h.fx = h.fx || 0; h.fz = h.fz || 0; h.vx = h.vx || 0; h.vz = h.vz || 0;
      if (h.vivo) {
        velReglas(h, dt);
        const ax = -K_MUELLE * h.fx - C_FRENO * h.vx, az = -K_MUELLE * h.fz - C_FRENO * h.vz;
        h.vx += ax * dt; h.vz += az * dt; h.fx += h.vx * dt; h.fz += h.vz * dt;
      } else if (vivoAntes.get(h)) {
        /* acaba de caer: hacia donde iba (su velocidad de dibujo y la de las reglas) o hacia donde le empujaban */
        const e = empujes.get(h), gx = h.vx + (h.ux || 0) * 0.3 + (e ? e.x / Math.max(dt, 1e-3) : 0), gz = h.vz + (h.uz || 0) * 0.3 + (e ? e.z / Math.max(dt, 1e-3) : 0);
        if (Math.hypot(gx, gz) > 0.05) h.fCae = Math.atan2(gx, gz);
        h.vx = h.vz = 0;
      }
      vivoAntes.set(h, h.vivo); prev.set(h, [h.x, h.z]);
    }
    /* los empujes que dejaron las picas en el último fotograma: mueven ya y dejan velocidad */
    for (const [h, e] of empujes) if (h.vivo) { h.fx += e.x; h.fz += e.z; if (dt > 0) { h.vx += e.x / dt * 0.5; h.vz += e.z / dt * 0.5; } tope(h); }
    empujes = new Map();
    const L = cuerpos(S), M = L.map(masa), C = caidos(S); let rMax = 0; for (const h of L) rMax = Math.max(rMax, rad(h));
    choca(L, rMax, M); noPisa(L, M, C); aprieta(S); noPisa(L, M, C); choca(L, rMax, M); choca(L, rMax, M);   /* al final, que los vivos no se solapen */
    rivales = S.ene.filter(h => h.vivo);
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

  return { paso, pica, medir, lanza, vuela, dondeP, limpia, proyectiles, reinicia() { empujes = new Map(); rivales = []; prev = new WeakMap(); vivoAntes = new WeakMap(); proyectiles.length = 0; } };
}
