/* AQVILA — FI1: la física de las batallas a pie. Capa fina de corrección SOBRE las reglas (js/falange.js): no decide nada
   del juego, solo DÓNDE SE DIBUJA cada hombre y cada pica. Sin pantalla: corre en Node. Prueba: test/fisica-batalla.test.mjs.
   Diseño: gobierno/estudios/FI1-diseno-fisicas.md.

   CONTRATO
   import { crearFisica } from './fisica-batalla.js';
   const Fi = crearFisica({ H });         H(x, z) → altura del suelo (por defecto 0)
     Fi.paso(S, dt)                       tras el paso de las reglas: separa cuerpos, aprieta filas y aplica los empujes de las picas
     Fi.pica(h, P, D, L)                  P contera y D dirección unitaria de la sarisa de h (arrays o {x,y,z}); L su largo.
                                          → { ret, h, en }: cuánto retirar el asta (m) y contra quién ('escudo' | 'cuerpo'); o { ret: 0 }
     Fi.medir(S, picas)                   picas = [{ h, P, D, L }] ya retiradas → { distMin, puntasDentro, pisados (vivos de pie sobre un caído) }
   Solo escribe en cada hombre fx, fz (desplazamiento de dibujo, m; como mucho TOPE), vx, vz (su velocidad), ux, uz (la
   velocidad que le dan las reglas) y, al caer, fCae (hacia dónde cae: ángulo como el yaw). Las reglas no lo leen: las partidas no cambian.
   Quien dibuja suma h.fx, h.fz a la posición del hombre vivo.

   HISTORIA. Las filas de detrás empujan con el peso del cuerpo (othismos): Asclepiódoto 5; Polibio 18.30 (histórico).
   Radios, cuánto resbala el asta y cuánto pasa a la fila de detrás: licencia de juego. */
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

const xyz = v => Array.isArray(v) ? v : [v.x, v.y, v.z];
const tipoF = h => h.tipo || 'falangita';

export function crearFisica(op = {}) {
  const H = op.H || (() => 0);
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
  const rad = h => RADIO[tipoF(h)] ?? 0.25, radC = h => RADIO_CAIDO[tipoF(h)] ?? 0.35, masa = h => MASA[tipoF(h)] || 1;
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
          const b = L[j], min = ra + rad(b); let vx = (b.x + b.fx) - (a.x + a.fx), vz = (b.z + b.fz) - (a.z + a.fz), d = Math.hypot(vx, vz);
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

  return { paso, pica, medir, reinicia() { empujes = new Map(); rivales = []; prev = new WeakMap(); vivoAntes = new WeakMap(); } };
}
