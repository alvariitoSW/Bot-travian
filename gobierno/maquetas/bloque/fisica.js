/* LP5a · La física en «Manípulo a pie»: conecta js/fisica-batalla.js (FI1–FI3) con los hombres de tropas.js. Sin three.js:
   corre también en Node (prueba: test/bloque-fisica.test.mjs). ?fisica=0 la apaga (el «antes»).
   La física solo decide DÓNDE SE DIBUJA cada hombre: aparta la figura (f.x, f.z de tropas.js), que vuelve andando a su sitio. Las reglas
   (js/bloque.js, js/bloque-ia.js) y el sitio de cada hombre en tropas.js no la leen: la partida sale igual con y sin física.

   Al motor se le dan las figuras tal cual: tu manípulo es su «fal» (columna f = col, fila r = fila; aprieta fila a fila)
   y los demás bloques (compañeros y galos) su «ene». Dos de distinto bando no se acercan más de D_RIVAL: escudo contra
   escudo (el escudo va 0,32 m delante del cuerpo y abulta 0,04; dos frente a frente, 0,72, más la holgura del brazo).
   El caído es una cápsula tendida hacia atrás (el muñeco de morir cae de espaldas: la cabeza queda 1,2 m detrás de los
   pies) y no se arrastra: el vivo se aparta de él.
   Proyectiles (FI3u): el motor de proyectiles de js/fisica-batalla.js (crearProyectiles). El vuelo lo lleva este archivo
   (gravedad, tramos de ≤ 1 m); el motor decide en qué se para, si se clava, rebota o resbala, y lo clavado sigue a su hombre.
   Obstáculos: escudo (caja) y cuerpo (cilindro; lo alto, el casco) de los hombres cercanos a lo que se mueve; nunca el que lanza.
   La guardia de cada romano sale de la orden: en testudo, la 1.ª fila en muro y las demás con el escudo arriba.
   Medidas (D_RIVAL, TENDIDO, los tiempos de los proyectiles): licencia de juego. */
import { crearFisica, crearProyectiles, MIN_DIST, ESCUDO, RADIO, ALTO, PROYECTIL } from '../../../js/fisica-batalla.js';
import { angulos } from '../../../js/tiro.js';   /* ES3b: el ángulo bajo (directo) o alto (parábola) de cada tiro */

export const D_RIVAL = 0.95;     /* m entre dos rivales (centro a centro): los escudos se tocan, no se cruzan */
export const TENDIDO = 1.25;     /* m de los pies a la cabeza del caído */
export const RAD_CAIDO = 0.22;   /* medio ancho del caído (hombros) */
export const CAE_T = 1.8;        /* s que tarda en quedar tendido (el muñeco de morir: 2,4 s) */
export const VARA = { mismo: MIN_DIST, rival: 0.9 };   /* las varas de la medida: 0,45 m entre los de un bando; 0,9 entre rivales */
export const PROY_MAX = 200;     /* los que se dibujan (los más viejos del suelo se quitan). ES3b: 160 → 200 (tus tiradores y los vélites rivales) */
export const SUELO_VIDA = 15;    /* s que se queda en el suelo un proyectil (ES3b: 25 → 15) */
/* FI3u: la geometría del escudo y del cuerpo para los proyectiles (venía del motor viejo de fisica-batalla.js) */
export const ESCUDO_ALTO = { y: 1.85, delante: 0.4 };   /* testudo (guardia 'alto'): la caja tumbada sobre la cabeza, adelantada */
export const MURO = { sube: 0.28, agacha: 0.1 };        /* guardia 'muro': algo agachado y con el escudo subido hasta los ojos */
export const CUELLO = 0.28;      /* el casco empieza 0,28 m bajo la coronilla */
export const G_PR = 9.81, TRAMO = 1;   /* gravedad del vuelo y largo máximo (m) de cada tramo recto */
const CERCA_PR = 4;              /* m: los hombres más lejos que esto de todo proyectil que se mueve no son obstáculo */
export const V_APARTA = 1.5, A_APARTA = 2;   /* m/s y m/s²: lo más deprisa que se aparta un bloque entero de otro, y cómo acelera (sin saltos ni tirones) */
export const V_FRONTERA = 2.5;  /* m/s: lo más deprisa que la frontera devuelve a su lado a quien se ha pasado */
export const V_DIBUJO = 6.5;    /* m/s: lo más deprisa que se mueve un hombre dibujado (corre, no salta) */
export const V_SALTA = 1.6;     /* m/s: el que anda más deprisa que esto pasa por encima de los caídos (el que está quieto, nunca encima) */
export const FRENA = 0.88;       /* el que va contra alguien (k = 1) afloja su paso hasta 1 − FRENA: no se mete empujando */

/* FU1: la guardia de cada hombre tuyo según la orden: en testudo, la 1.ª fila en muro y las demás con el escudo arriba.
   Una formación (bloque/formaciones/) puede dar la suya con crearFisicaBloque({ guardia: (h, S) => ... }); null = escudo de siempre */
export const guardiaDeSerie = (h, S) => S.tuyo.orden === 'testudo' ? (h.fila === 0 ? 'muro' : 'alto') : S.tuyo.forma === 'muro' && h.fila === 0 ? 'muro' : null;   /* FU5: el muro de escudos tambien guarda en 'muro' */

export function crearFisicaBloque({ S, TR, H = () => 0, activa = true, semilla = 1, guardia = guardiaDeSerie }) {
  const Fi = crearFisica({ H, caidoFijo: true, parMax: D_RIVAL, semilla, parMin: (a, b) => a.bando !== b.bando ? D_RIVAL : undefined });
  const SF = { fal: [], ene: [], giro: 0 };
  const ahora = () => (typeof performance !== 'undefined' ? performance : Date).now();
  let msPaso = 0, nPaso = 0, T = 0, msMotor = 0;   /* LP7: msMotor, solo el motor (Fi.paso); msPaso, todo el enganche */

  /* al motor no se le dan las figuras (objetos de formas muy distintas: el motor iría lento) sino un cuerpo por figura,
     todos de la misma forma. Entra dónde está y cómo; sale cuánto lo aparta la física (fx, fz) */
  const cuerpo = f => f._c || (f._c = { salta: false, x: 0, z: 0, fx: 0, fz: 0, vx: 0, vz: 0, ux: 0, uz: 0, yaw: 0, vivo: true, huye: false, f: 0, r: 0,
    bando: f.bando, tipo: 'infante', guardia: null, tendido: null, pila: 0, kB: 0, fig: f });
  /* el caído: tendido de espaldas desde donde estaba dibujado al caer */
  function tiende(c, f) {
    if (c.tendido) return;
    const y = f.yawCae ?? f.yaw; c.tendido = { dx: -Math.sin(y), dz: -Math.cos(y), largo: 0, r: RAD_CAIDO }; f.tendido = c.tendido;
    c.vx = c.vz = 0; c.tCae = 0;
  }
  /* mientras cae, el cuerpo se alarga en el suelo poco a poco (los de detrás se apartan a su paso, no de golpe) */
  function alarga(c, dt) { if (c.tCae < CAE_T) { c.tCae += dt; const u = Math.min(1, c.tCae / CAE_T); c.tendido.largo = TENDIDO * u * u * (3 - 2 * u); } }
  /* LP7: al motor solo van los bloques despiertos: los que están a menos de DESPIERTA m (borde con borde, a lo grueso) de otro
     bloque, los que huyen o se retiran y, mientras vuela algo, todos. Los demás los guarda en su sitio su formación (tropas.js).
     (Despertar solo la línea del choque se probó: los de atrás, dormidos, se meten entre los de delante. No vale) */
  const DESPIERTA = 10, despiertos = new Set();
  function despierta() {
    despiertos.clear();
    const L = S.bloques.filter(b => b.estado !== 'fuera'), vuela = proyectiles.some(p => !p.fi || p.fi.modo === 'vuela');   /* FI3u */
    for (const a of L) if (vuela || a.U.roto || a.estado === 'huye' || a.estado === 'retira') despiertos.add(a);   /* el que corre pasa entre otros */
    for (const a of L) for (const b of L) {
      if (a.id >= b.id) continue;   /* rivales y también amigos que se cruzan (la reserva por detrás de su centro) */
      if (Math.hypot(a.x - b.x, a.z - b.z) - (Math.hypot(a.ancho, a.fondo) + Math.hypot(b.ancho, b.fondo)) / 2 < DESPIERTA) { despiertos.add(a); despiertos.add(b); }
    }
  }
  function lee(dt) {
    SF.fal.length = 0; SF.ene.length = 0; SF.giro = S.B ? S.B.rumbo : S.tuyo.ang;
    despierta();
    for (const f of TR.figs) {
      if (!despiertos.has(f.b)) continue;
      const c = cuerpo(f); c.x = f.x; c.z = f.z; c.yaw = f.yaw; c.vivo = true; c.salta = f.v > V_SALTA;
      if (f.h) { c.f = f.h.col; c.r = f.h.fila; c.guardia = guardia(f.h, S); SF.fal.push(c); }
      else { c.guardia = null; SF.ene.push(c); }
    }
    for (const f of TR.caidos) { if (!despiertos.has(f.b)) continue; const c = cuerpo(f); if (c.vivo) { c.vivo = false; c.x = f.x; c.z = f.z; c.yaw = f.yaw; } tiende(c, f); alarga(c, dt); (f.h ? SF.fal : SF.ene).push(c); }
  }
  /* la frontera: dos bloques rivales no se meten uno en otro, aunque las reglas metan un rectángulo en otro (o unos tiradores
     que huyen pasen por encima de tus filas). Para cada par de bloques rivales cuyos rectángulos (los de sus hombres, con MARGEN) se tocan: la
     raya que los separa es la del eje de menor solape (el frente de uno, o su costado si le entran de flanco), a medio camino
     entre el borde de uno y el del otro; cada hombre se queda a D_RIVAL/2 de su lado, a todo lo largo (si no, los de la punta
     rodean la esquina para llegar a su hueco). Aparta despacio (V_FRONTERA), sin saltos */
  const MARGEN = 0.5;
  /* el rectángulo de un bloque: el de los sitios que dan las reglas a sus hombres (f.tx, f.tz: sin lo que se aparta el
     bloque, así la raya no se mueve al apartarlo), en su marco: de lado y de fondo, sin el 3 % de cada punta (un hombre suelto
     no lo estira), más MARGEN */
  const esquinas = (b, men) => {
    const F = { x: Math.sin(b.ang), z: -Math.cos(b.ang) }, D = { x: Math.cos(b.ang), z: Math.sin(b.ang) };
    const Ls = [], Ds = [];
    for (const f of men) { const x = (f.tx ?? f.x) - b.x, z = (f.tz ?? f.z) - b.z; Ls.push(x * D.x + z * D.z); Ds.push(x * F.x + z * F.z); }
    Ls.sort((p, q) => p - q); Ds.sort((p, q) => p - q); const k = Math.floor(men.length * 0.03), u = men.length - 1 - k;
    const l0 = Ls[k] - MARGEN, l1 = Ls[u] + MARGEN, d0 = Ds[k] - MARGEN, d1 = Ds[u] + MARGEN;
    const P = [[l0, d0], [l1, d0], [l0, d1], [l1, d1]].map(([l, d]) => [b.x + D.x * l + F.x * d, b.z + D.z * l + F.z * d]);
    return { F, D, P };
  };
  const pr = (P, ex, ez) => { let lo = Infinity, hi = -Infinity; for (const p of P) { const v = p[0] * ex + p[1] * ez; if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; };
  const vivoB = b => b.estado !== 'fuera' && b.U && b.U.enPie > 0;
  let ultimas = []; const ejes = new Map(), metas = new Map();
  /* la frontera. Para cada par de bloques rivales cuyos rectángulos se tocan, la raya que los separa: la del eje de menor
     solape (el frente de uno, o su costado si le entran de flanco; con memoria, para que no salte de un eje a otro), a medio
     camino entre el borde de uno y el del otro. Cada bloque entero se aparta lo que le toca (la mitad del solape más D_RIVAL/2):
     tropas.js lleva a sus hombres a su sitio más eso (TR.ofs), sin deformar las filas. Se aparta despacio (V_APARTA) */
  function frontera(dt) {
    const men = new Map(); for (const f of TR.figs) { let l = men.get(f.b); if (!l) men.set(f.b, l = []); l.push(f); }
    const rayas = [], B = S.bloques.filter(b => vivoB(b) && men.has(b)), E = new Map(B.map(b => [b, esquinas(b, men.get(b))])), quiere = new Map();
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const b = B[i], o = B[j]; if (b.bando === o.bando) continue;
      const Eb = E.get(b), Eo = E.get(o), clave = b.id + '-' + o.id, antes = ejes.get(clave); let mejor = null, sigue = null;
      for (const [q, e] of [[0, Eb.F], [1, Eb.D], [2, Eo.F], [3, Eo.D]]) {
        const [b0, b1] = pr(Eb.P, e.x, e.z), [o0, o1] = pr(Eo.P, e.x, e.z), sol = Math.min(b1, o1) - Math.max(b0, o0);
        if (sol <= 0) { mejor = sigue = null; break; }   /* hay un eje que los separa: no se tocan */
        /* orientado de b hacia o (por el medio de cada uno en ese eje); bb y bo: los bordes (sin margen) que se miran */
        const k = (o0 + o1) - (b0 + b1) >= 0 ? 1 : -1, bb = (k > 0 ? b1 : -b0) - MARGEN, bo = (k > 0 ? o0 : -o1) + MARGEN;
        const r = { q, sol, nx: e.x * k, nz: e.z * k, s0: (bb + bo) / 2, bb, bo };
        if (!mejor || sol < mejor.sol) mejor = r;
        if (antes && antes.q === q && antes.nx * r.nx + antes.nz * r.nz > 0) sigue = r;
      }
      if (mejor && sigue && sigue.sol < mejor.sol * 1.5 + 1) mejor = sigue;
      if (!mejor) { ejes.delete(clave); continue; }
      ejes.set(clave, mejor); rayas.push({ b, o, ...mejor });
      /* lo que se aparta cada uno para que sus bordes queden a D_RIVAL/2 de la raya */
      const sb = Math.min(0, mejor.s0 - D_RIVAL / 2 - mejor.bb), so = Math.max(0, mejor.s0 + D_RIVAL / 2 - mejor.bo);
      for (const [x, m] of [[b, sb], [o, so]]) { const q = quiere.get(x) || { x: 0, z: 0 }; q.x += mejor.nx * m; q.z += mejor.nz * m; quiere.set(x, q); }
    }
    /* cada bloque va hacia lo que le toca apartarse: la meta, suavizada (τ = 0,8 s: las reglas la mueven a tirones); y el
       bloque, hacia ella despacio, con su velocidad (acelera y frena: no tiembla) */
    const kq = 1 - Math.exp(-dt / 0.8);
    for (const b of S.bloques) {
      const q0 = quiere.get(b) || { x: 0, z: 0 }; let q = metas.get(b); if (!q) metas.set(b, q = { x: 0, z: 0, vx: 0, vz: 0 });
      q.x += (q0.x - q.x) * kq; q.z += (q0.z - q.z) * kq;
      const o = TR.ofs.get(b) || { x: 0, z: 0 }, dx = q.x - o.x, dz = q.z - o.z, d = Math.hypot(dx, dz);
      /* velocidad que querría: proporcional a lo que falta, con tope V_APARTA; la de ahora va hacia ella con aceleración A_APARTA */
      const vq = Math.min(V_APARTA, d * 1.5), wx = d > 1e-6 ? dx / d * vq : 0, wz = d > 1e-6 ? dz / d * vq : 0, ax = wx - q.vx, az = wz - q.vz, a = Math.hypot(ax, az), am = A_APARTA * dt;
      if (a > am) { q.vx += ax / a * am; q.vz += az / a * am; } else { q.vx = wx; q.vz = wz; }
      o.x += q.vx * dt; o.z += q.vz * dt;
      if (Math.hypot(o.x, o.z) < 1e-3 && !q0.x && !q0.z) TR.ofs.delete(b); else TR.ofs.set(b, o);
    }
    /* para la frontera por hombre, la raya de cada uno donde está su bloque apartado ahora */
    for (const r of rayas) { const ob = TR.ofs.get(r.b) || { x: 0, z: 0 }, oo = TR.ofs.get(r.o) || { x: 0, z: 0 }; r.sb = Math.min(r.s0, r.bb + ob.x * r.nx + ob.z * r.nz + D_RIVAL / 2); r.so = Math.max(r.s0, r.bo + oo.x * r.nx + oo.z * r.nz - D_RIVAL / 2); }
    ultimas = rayas; aplica(dt);
  }
  /* cada hombre a su lado de cada raya, despacio (tope): el que se ha pasado vuelve, sin saltos */
  function aplica(dt) {
    if (!ultimas.length) return;
    const tope = V_FRONTERA * dt;
    for (const f of TR.figs) for (const r of ultimas) {
      const lado = f.b === r.b ? -1 : f.b === r.o ? 1 : 0; if (!lado) continue;
      const s = f.x * r.nx + f.z * r.nz, lim = (lado < 0 ? r.sb : r.so) + lado * D_RIVAL / 2, falta = lado < 0 ? s - lim : lim - s;   /* metros que se ha pasado */
      if (falta > 0) { const m = Math.min(falta, tope) * lado; f.x += r.nx * m; f.z += r.nz * m; }
    }
  }
  function paso(dt) {
    const a = ahora(); T += dt;
    for (const f of TR.figs) { f._x0 = f.x; f._z0 = f.z; }
    if (activa && dt > 0) frontera(dt);
    lee(dt);
    if (activa && dt > 0) {
      { const m0 = ahora(); Fi.paso(SF, dt); msMotor += ahora() - m0; }
      /* lo que aparta la física se queda en el hombre dibujado (tropas.js lo devuelve andando a su sitio): sin tope ni muelle */
      for (const f of TR.figs) {
        const c = f._c; if (!c || !despiertos.has(f.b)) continue;   /* LP7: dormido, no lo movió el motor */
        f.x += c.fx; f.z += c.fz;
        /* nadie va más deprisa que V_DIBUJO (su paso más lo que le empujan): un empujón grande se reparte en varios fotogramas */
        { const x0 = f._x0 - (f.px || 0), z0 = f._z0 - (f.pz || 0), mx = f.x - x0, mz = f.z - z0, m = Math.hypot(mx, mz), t = V_DIBUJO * dt; if (m > t) { f.x = x0 + mx * t / m; f.z = z0 + mz * t / m; } }
        c.x = f.x; c.z = f.z; c.fx = c.fz = 0; c.vx = c.vz = 0;
        /* si la frontera y la física le apartan (va contra alguien), tropas.js lo sabe por f.bn: hacia dónde está el estorbo
           (contra lo que le empujan) y cuánto estorba (k, 0–1, sube deprisa y baja despacio): no se mete, resbala y rodea */
        const ex = f.x - f._x0, ez = f.z - f._z0, e = Math.hypot(ex, ez), b = f.bn || (f.bn = { x: 0, z: 0, k: 0 });
        if (e > 0.004) { const nx = -ex / e, nz = -ez / e, w = Math.min(1, e / (0.02 + 0.5 * Math.hypot(f.px || 0, f.pz || 0))); b.x += (nx - b.x) * w; b.z += (nz - b.z) * w; const m = Math.hypot(b.x, b.z) || 1; b.x /= m; b.z /= m; b.k = Math.min(1, b.k + w * 0.5); }
        else b.k = Math.max(0, b.k - dt * 0.4);
      }
      if (proyectiles.length) mueveProyectiles(dt);
    }
    msPaso += ahora() - a; nPaso++;
  }
  let avisos = null;

  /* ---------- FI3u: proyectiles con crearProyectiles ----------
     Cada proyectil: { tipo, largo, p (punta), v (m/s), de (el cuerpo de quien lo lanzó), t, tFin }; el motor escribe en p.fi.
     El dueño de un escudo o de un cuerpo es el cuerpo del hombre (cuerpo(f)); su marco sale de su figura (f.x, f.z, f.yaw) */
  const Pr = crearProyectiles({ H, semilla }), proyectiles = [];
  const mueveEl = p => !p.fi || p.fi.modo === 'vuela' || p.fi.modo === 'rebota' || p.fi.modo === 'cae' || p.fi.modo === 'resbala';
  const guardiaDe = f => f.h ? guardia(f.h, S) : null;
  /* marco del hombre: columnas izquierda, arriba, frente (frente = (sen yaw, 0, cos yaw)) y su sitio en el suelo */
  function marcoDe(f) { const y = f.yaw || 0, s = Math.sin(y), c = Math.cos(y); return { fx: s, fz: c, lx: c, lz: -s, x: f.x, z: f.z, g: H(f.x, f.z) }; }
  const matriz = (u, v, n, o) => [u[0], u[1], u[2], 0, v[0], v[1], v[2], 0, n[0], n[1], n[2], 0, o[0], o[1], o[2], 1];
  /* el escudo de un hombre: caja (obstáculo) y su matriz (para seguirle lo clavado) */
  function escudoDe(f, c, gu) {
    const m = marcoDe(f), F = [m.fx, 0, m.fz], I = [m.lx, 0, m.lz], A = [0, 1, 0], ancho = ESCUDO.ancho / 2, alto = (ESCUDO.y1 - ESCUDO.y0) / 2, grueso = ESCUDO.grueso / 2;
    let o;
    if (gu === 'alto') o = { tipo: 'escudo', c: [m.x + m.fx * ESCUDO_ALTO.delante, m.g + ESCUDO_ALTO.y, m.z + m.fz * ESCUDO_ALTO.delante], n: A, u: I, v: F, m: [grueso, ancho, alto], dueno: c };
    else { const sube = gu === 'muro' ? MURO.sube : 0; o = { tipo: 'escudo', c: [m.x + m.fx * ESCUDO.delante + m.lx * ESCUDO.izq, m.g + (ESCUDO.y0 + ESCUDO.y1) / 2 + sube, m.z + m.fz * ESCUDO.delante + m.lz * ESCUDO.izq], n: F, u: I, v: A, m: [grueso, ancho, alto], dueno: c }; }
    o.M = matriz(o.u, o.v, o.n, o.c); return o;
  }
  /* el cuerpo: cilindro del suelo a la coronilla; lo alto (desde CUELLO bajo la coronilla, PR.CASCO en el motor) es el casco */
  function cuerpoDe(f, c, gu) { const m = marcoDe(f), alto = ALTO.infante - (gu === 'muro' ? MURO.agacha : 0); return { tipo: 'cuerpo', x: m.x, z: m.z, y0: m.g, y1: m.g + alto - CUELLO + 0.25, r: RADIO.infante, dueno: c }; }
  /* la matriz de lo que lleva un clavado: el escudo o el marco del hombre */
  function matrizDe(c, tipo) {
    const f = c && c.fig; if (!f) return null; const gu = guardiaDe(f);
    if (tipo === 'escudo') return escudoDe(f, c, gu).M;
    const m = marcoDe(f); return matriz([m.lx, 0, m.lz], [0, 1, 0], [m.fx, 0, m.fz], [m.x, m.g, m.z]);
  }
  /* los obstáculos: escudo y cuerpo de los hombres vivos a menos de CERCA_PR m de algún proyectil o de lo que vuele en este
     paso (rejilla de CERCA_PR m; el que vuela marca todo su tramo: a 50 m/s recorre 5 m en 0,1 s) */
  function obstaculos(vivos, dt) {
    const celdas = new Set(), k = (x, z) => Math.floor(x / CERCA_PR) * 65536 + Math.floor(z / CERCA_PR), O = [];
    for (const p of proyectiles) {
      const q = p.fi && p.fi.pose ? p.fi.pose.punta : p.p; celdas.add(k(q[0], q[2]));
      if (p.fi && p.fi.modo !== 'vuela') continue;
      const n = Math.ceil(Math.hypot(p.v[0], p.v[2]) * dt / CERCA_PR); for (let i = 1; i <= n; i++) celdas.add(k(p.p[0] + p.v[0] * dt * i / n, p.p[2] + p.v[2] * dt * i / n));
    }
    for (const f of vivos) {
      const cx = Math.floor(f.x / CERCA_PR), cz = Math.floor(f.z / CERCA_PR); let cerca = false;
      for (let dx = -1; dx <= 1 && !cerca; dx++) for (let dz = -1; dz <= 1; dz++) if (celdas.has((cx + dx) * 65536 + cz + dz)) { cerca = true; break; }
      if (!cerca) continue;
      const c = cuerpo(f), gu = guardiaDe(f); O.push(escudoDe(f, c, gu), cuerpoDe(f, c, gu));
    }
    return O;
  }
  function mueveProyectiles(dt) {
    const vivos = new Set(TR.figs), obst = obstaculos(TR.figs, dt);
    for (const p of proyectiles) {
      if (!p.fi) Pr.vuela(p, p.p, p.v, []);   /* el primer punto: desde aquí mira el motor */
      if (p.fi.modo === 'vuela') {
        const ob = obst.filter(o => o.dueno !== p.de), sp = Math.hypot(p.v[0], p.v[1], p.v[2]), n = Math.max(1, Math.ceil(sp * dt / TRAMO)), h = dt / n;
        for (let i = 0; i < n && !p.fi.toca; i++) {
          p.p = [p.p[0] + p.v[0] * h, p.p[1] + (p.v[1] - 0.5 * G_PR * h) * h, p.p[2] + p.v[2] * h]; p.v = [p.v[0], p.v[1] - G_PR * h, p.v[2]]; p.t += h;
          Pr.vuela(p, p.p, p.v, ob);
        }
        const toca = p.fi.toca;
        if (toca && toca.tipo !== 'suelo') Pr.llega(p, { tipo: toca.tipo, dueno: toca.dueno, o: toca.o }, ob, matrizDe(toca.dueno, toca.tipo));
        else if (toca || p.p[1] < H(p.p[0], p.p[2]) || p.t > 20) Pr.llega(p, { tipo: 'suelo' }, ob);
        continue;
      }
      Pr.mueve(p, dt, obst);
      if (p.fi.modo === 'clava' && p.fi.que !== 'suelo') Pr.pose(p, matrizDe(p.fi.dueno, p.fi.que), obst); else Pr.pose(p);
    }
    if (avisos) for (const a of Pr.avisos()) avisos({ ...a, h: a.dueno || null }); else Pr.avisos();
    /* fuera: los clavados en un caído (de pie en un muerto no se ven bien), los quietos del suelo viejos y lo que pase del tope */
    for (let i = proyectiles.length - 1; i >= 0; i--) {
      const p = proyectiles[i], f = p.fi; if (!f || mueveEl(p)) continue;
      const enHombre = f.modo === 'clava' && f.que !== 'suelo';
      if (enHombre ? !(f.dueno && vivos.has(f.dueno.fig)) : (T - (p.tFin ?? (p.tFin = T))) >= SUELO_VIDA) { Pr.olvida(p); proyectiles.splice(i, 1); }
    }
    if (proyectiles.length > PROY_MAX) { let quita = proyectiles.length - PROY_MAX; for (let i = 0; i < proyectiles.length && quita > 0; i++) if (!mueveEl(proyectiles[i])) { Pr.olvida(proyectiles[i]); proyectiles.splice(i--, 1); quita--; } }
  }
  /* dónde dibujar p: punta y dirección (el clavado sigue a su escudo o a su hombre) */
  function dondeP(p) {
    const q = p.fi && p.fi.pose; if (q) return { x: q.punta[0], y: q.punta[1], z: q.punta[2], dx: q.dir[0], dy: q.dir[1], dz: q.dir[2] };
    const v = Math.hypot(p.v[0], p.v[1], p.v[2]) || 1; return { x: p.p[0], y: p.p[1], z: p.p[2], dx: p.v[0] / v, dy: p.v[1] / v, dz: p.v[2] / v };
  }
  /* una salva: n proyectiles de los hombres de delante del bloque de (figuras con f.b === de) a puntos del bloque a,
     que llegan en unos dur s. Devuelve cuántos salieron.
     ES3b: con op = { v, alto } cada proyectil sale a v m/s con el ángulo bajo (alto: false) o alto (alto: true) de angulos() hacia su punto (y dur no cuenta);
     si el punto no está a su alcance, sale como hasta ahora */
  function salva(de, a, n, dur, tipo, punto, op) {
    if (!activa) return 0;
    const men = TR.figs.filter(f => f.b === de); if (!men.length) return 0;
    const F = { x: Math.sin(de.ang), z: -Math.cos(de.ang) };
    men.sort((p, q) => ((q.x - de.x) * F.x + (q.z - de.z) * F.z) - ((p.x - de.x) * F.x + (p.z - de.z) * F.z));   /* los de delante primero */
    const delante = men.slice(0, Math.max(1, Math.min(men.length, n * 2)));
    let k = 0;
    for (let i = 0; i < n; i++) {
      const f = delante[(i * 7) % delante.length], q = punto(i), t = dur * (0.9 + 0.2 * ((i * 0.618) % 1));
      const x0 = f.x + F.x * 0.4, z0 = f.z + F.z * 0.4, y0 = H(x0, z0) + 1.9, y1 = H(q.x, q.z) + 0.9;
      const V = [(q.x - x0) / t, (y1 - y0 + 0.5 * 9.81 * t * t) / t, (q.z - z0) / t];
      if (op && op.v) {
        const dh = Math.hypot(q.x - x0, q.z - z0), an = angulos(dh, op.v, G_PR, y1 - y0);
        if (an) { const th = op.alto ? an.alto : an.bajo, c = Math.cos(th), s = Math.sin(th), u = [(q.x - x0) / dh, (q.z - z0) / dh]; V[0] = u[0] * op.v * c; V[1] = op.v * s; V[2] = u[1] * op.v * c; }
      }
      proyectiles.push({ tipo, largo: (PROYECTIL[tipo] || PROYECTIL.jabalina).largo, p: [x0, y0, z0], v: V, de: cuerpo(f), t: 0 }); k++;   /* FI3u */
    }
    return k;
  }

  /* la medida de solapes de lo que se ve: distancia mínima entre dos de un bando y entre rivales, escudos que se cruzan con
     un rival (escudo o cuerpo), vivos de pie sobre un caído. Solo mira a los que están cerca (rejilla de 2 m) */
  function medir() {
    const L = TR.figs, C = TR.caidos, G = new Map(), k = (x, z) => Math.floor(x / 2) * 65536 + Math.floor(z / 2);
    const P = f => [f.x, f.z];
    for (const f of L) { const [x, z] = P(f), c = k(x, z); let l = G.get(c); if (!l) G.set(c, l = []); l.push(f); }
    let mismo = Infinity, rival = Infinity, escudos = 0, pisados = 0, pares = 0;
    for (const a of L) {
      const [ax, az] = P(a), cx = Math.floor(ax / 2), cz = Math.floor(az / 2);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const l = G.get((cx + dx) * 65536 + cz + dz); if (!l) continue;
        for (const b of l) {
          if (b === a) continue; const [bx, bz] = P(b), d = Math.hypot(bx - ax, bz - az);
          if (a.bando === b.bando) { if (a.semilla < b.semilla) mismo = Math.min(mismo, d); continue; }
          if (a.semilla < b.semilla) { rival = Math.min(rival, d); if (d < 1.6) pares++; }
          if (d < 2.2) (a._ang || (a._ang = [])).push(Math.atan2(bz - az, bx - ax));
          if (d < 1.6 && escudoDentro(a, b)) escudos++;
        }
      }
    }
    /* colado: los rivales que tiene a menos de 2,2 m no caben en medio plano (está metido entre ellos, no en una línea) */
    let colados = 0;
    for (const a of L) { const A = a._ang; if (A && A.length >= 3) { A.sort((p, q) => p - q); let gap = A[0] + 2 * Math.PI - A[A.length - 1]; for (let i = 1; i < A.length; i++) gap = Math.max(gap, A[i] - A[i - 1]); if (gap < Math.PI - 0.2) colados++; } a._ang = null; }
    for (const c of C) {
      if (!c.tendido) continue; const px = c.x, pz = c.z, t = c.tendido;
      for (const f of L) { if (f.v > V_SALTA) continue; const [x, z] = P(f); if (Math.abs(x - px) > 2 || Math.abs(z - pz) > 2) continue;
        const s = Math.max(0, Math.min(t.largo, (x - px) * t.dx + (z - pz) * t.dz)); if (Math.hypot(x - px - t.dx * s, z - pz - t.dz * s) < RAD_CAIDO + 0.1) pisados++; }
    }
    return { mismo: +mismo.toFixed(3), rival: +rival.toFixed(3), escudos, pisados, colados, pares, ms: +(msPaso / Math.max(1, nPaso)).toFixed(3), motor: +(msMotor / Math.max(1, nPaso)).toFixed(3) };
  }
  /* ¿el escudo de a (rectángulo visto desde arriba) entra en el escudo o en el cuerpo de b? (con un margen de 1 cm) */
  function escudoDentro(a, b) {
    const ra = rect(a), cb = [b.x, b.z];
    if (rectCirculo(ra, cb, RADIO.infante - 0.01)) return true;
    return rectRect(ra, rect(b));
  }
  function rect(f) {
    const y = f.yaw || 0, fx = Math.sin(y), fz = Math.cos(y), lx = Math.cos(y), lz = -Math.sin(y), px = f.x, pz = f.z;
    return { c: [px + fx * ESCUDO.delante + lx * ESCUDO.izq, pz + fz * ESCUDO.delante + lz * ESCUDO.izq], e: [[fx, fz, ESCUDO.grueso / 2], [lx, lz, ESCUDO.ancho / 2]] };
  }
  function rectCirculo(R, c, r) {
    const ox = c[0] - R.c[0], oz = c[1] - R.c[1]; let qx = 0, qz = 0;
    for (const [ex, ez, m] of R.e) { const t = Math.max(-m, Math.min(m, ox * ex + oz * ez)); qx += ex * t; qz += ez * t; }
    return Math.hypot(ox - qx, oz - qz) < r;
  }
  function rectRect(A, B) {
    const ox = B.c[0] - A.c[0], oz = B.c[1] - A.c[1];
    for (const [ex, ez] of A.e.concat(B.e)) {
      const pa = A.e.reduce((s, [x, z, m]) => s + Math.abs(x * ex + z * ez) * m, 0), pb = B.e.reduce((s, [x, z, m]) => s + Math.abs(x * ex + z * ez) * m, 0);
      if (Math.abs(ox * ex + oz * ez) > pa + pb - 0.01) return false;
    }
    return true;
  }
  return { Fi, Pr, paso, salva, medir, proyectiles, dondeP, rayas: () => ultimas, activa, set alAviso(f) { avisos = f; }, reinicia() { Fi.reinicia(); Pr.reinicia(); proyectiles.length = 0; msPaso = 0; nPaso = 0; msMotor = 0; } };
}

/* ---------- BT1 · «Nada atraviesa nada»: la medida de choques con la geometría que SE PINTA ----------
   medirChoques(escena, op) recorre las mallas de la escena y mide con lo mismo que usa la tarjeta gráfica:
     · soldados (InstancedMesh de js/gfx/soldado.js, userData.nivel): la matriz de cada instancia, sus filas de huesos (aCuadro: A, B y la mezcla;
       la textura de huesos del nivel o la tabla de gestos de la falange, material.userData.huesos) y su muestra (aMuestra: piezas ocultas).
       De cada hombre: sus TRIÁNGULOS de cuerpo ya en pose (los mismos que se dibujan), unas cápsulas por hueso (el «núcleo» de cada parte:
       radio = la mediana de la distancia de sus vértices al eje, en reposo), los vértices de su escudo y el segmento de cada arma de la malla.
     · astas sueltas (userData.asta = { tipo, largo, radio, duenos }: las sarisas y los muñones de formaciones/falange.js): la matriz de cada
       instancia (la contera en la posición, la punta a lo largo de +z).
     · escudos sueltos (userData.escudoSuelto, con userData.duenos: el techo del testudo y el muro): su caja por la matriz de cada instancia.
   op.figs: las figuras de tropas.js (vivos y caídos), para saber el bando y quién está caído (se casan por la posición de la matriz).
   Choques (devuelve una lista; vacía = nada atraviesa nada):
     'asta-companero' un asta (sarisa, muñón, lanza, pilum, espada) corta un triángulo del cuerpo de un compañero vivo (nunca el suyo)
     'asta-caido'     un asta corta el cuerpo de un caído (de cualquier bando)
     'asta-rival'     un asta ATRAVIESA a un rival vivo: lo corta lejos de la punta (la punta que llega a él es un golpe, no un cruce)
     'brazo'          el núcleo de un brazo o una mano dentro del núcleo del tronco, los hombros o la cabeza de un compañero vivo
     'escudo'         el escudo dentro del núcleo del tronco, los hombros o la cabeza de un compañero vivo
     'caidos'         dos caídos cruzados (sus núcleos) · 'caido-vivo' un vivo metido en un caído
   Márgenes (cuánto tiene que entrar para contar): licencia de medida, en MARGEN. Sin three.js: solo lee arreglos. */
export const MARGEN = { brazo: 0.025, escudo: 0.025, escudoVerts: 3, caido: 0.04, puntaRival: 0.45 };
const CADENAS = [   /* [nombre, hueso de un extremo, hueso del otro, huesos cuyos vértices dan el radio, parte] */
  ['tronco', 'spine05', 'spine01', ['spine05', 'spine04', 'spine03', 'spine02', 'spine01'], 'tronco'],
  ['hombros', 'shoulder01.L', 'shoulder01.R', ['clavicle.L', 'clavicle.R', 'shoulder01.L', 'shoulder01.R'], 'tronco'],
  ['cabeza', 'neck02', 'head', ['neck01', 'neck02', 'neck03', 'head'], 'cabeza'],
  ['brazoI', 'upperarm01.L', 'lowerarm01.L', ['upperarm01.L', 'upperarm02.L'], 'brazo'], ['antebrazoI', 'lowerarm01.L', 'wrist.L', ['lowerarm01.L', 'lowerarm02.L'], 'brazo'], ['manoI', 'wrist.L', 'finger3-1.L', ['wrist.L', 'metacarpal2.L', 'metacarpal3.L'], 'brazo'],
  ['brazoD', 'upperarm01.R', 'lowerarm01.R', ['upperarm01.R', 'upperarm02.R'], 'brazo'], ['antebrazoD', 'lowerarm01.R', 'wrist.R', ['lowerarm01.R', 'lowerarm02.R'], 'brazo'], ['manoD', 'wrist.R', 'finger3-1.R', ['wrist.R', 'metacarpal2.R', 'metacarpal3.R'], 'brazo'],
  ['musloI', 'upperleg01.L', 'lowerleg01.L', ['upperleg01.L', 'upperleg02.L'], 'pierna'], ['piernaI', 'lowerleg01.L', 'foot.L', ['lowerleg01.L', 'lowerleg02.L'], 'pierna'],
  ['musloD', 'upperleg01.R', 'lowerleg01.R', ['upperleg01.R', 'upperleg02.R'], 'pierna'], ['piernaD', 'lowerleg01.R', 'foot.R', ['lowerleg01.R', 'lowerleg02.R'], 'pierna']];
/* grupo de cada pieza del .json: 0 cuerpo, 1 escudo, 2 lanza, 3 pilum, 4 jabalina en mano, 5 espada en mano, 9 lo demás (vaina, correa, repuestos: no cuentan) */
const GRUPO = nom => /^escudo/.test(nom) ? 1 : /^lanza|^sarisa/.test(nom) ? 2 : /^pilum/.test(nom) ? 3 : /^jabalina_(asta|punta)$/.test(nom) ? 4 : /^espada_(puno|guarda|hoja)$/.test(nom) ? 5
  : /^(cuerpo|piel|ojo|melena|bigote|calzon|pernera|cota|manga|faldon|yelmo|hombrera|pteruges|greba|zorro|suela)/.test(nom) ? 0 : 9;
const ARMA_N = { 2: 'lanza', 3: 'pilum', 4: 'jabalina', 5: 'espada' };
function h2f(h) { const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff; return e === 0 ? s * Math.pow(2, -14) * (m / 1024) : e === 31 ? (m ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + m / 1024); }
/* lo que no cambia de un nivel de soldado: grupo de cada vértice, centros de los huesos en reposo y radios de las cápsulas */
const PREP = new WeakMap();
function prepara(nv) {
  let P = PREP.get(nv); if (P) return P;
  const j = nv.j, g = nv.geo, po = g.attributes.position.array, si = g.attributes.aSkinI.array, sw = g.attributes.aSkinW.array, n = po.length / 3, nb = j.huesos.length;
  const grupo = new Uint8Array(n).fill(9), idx = nv.idx0 || g.index.array; let t = 0;
  for (const [nom, k] of Object.entries(j.piezas || { cuerpo: idx.length / 3 })) { const gr = GRUPO(nom); for (let q = t * 3; q < (t + k) * 3 && q < idx.length; q++) if (gr < grupo[idx[q]]) grupo[idx[q]] = gr; t += k; }
  const cen = new Float64Array(nb * 3), cnt = new Uint32Array(nb);
  const pes = new Float64Array(nb);   /* el centro de cada hueso: la media de los vértices que mueve, por su peso */
  for (let i = 0; i < n; i++) if (grupo[i] === 0) for (let q = 0; q < 4; q++) { const w = sw[i * 4 + q] / 255, b = si[i * 4 + q]; if (w <= 0.05) continue; cen[b * 3] += po[i * 3] * w; cen[b * 3 + 1] += po[i * 3 + 1] * w; cen[b * 3 + 2] += po[i * 3 + 2] * w; pes[b] += w; cnt[b]++; }
  for (let b = 0; b < nb; b++) if (pes[b] > 0) for (let k = 0; k < 3; k++) cen[b * 3 + k] /= pes[b];
  const hb = nom => j.huesos.indexOf(nom), cad = [];
  for (const [nom, a, b, deq, parte] of CADENAS) {
    const ia = hb(a), ib = hb(b); if (ia < 0 || ib < 0 || !cnt[ia] || !cnt[ib]) continue;
    const set = new Set(deq.map(hb)), A = [cen[ia * 3], cen[ia * 3 + 1], cen[ia * 3 + 2]], B = [cen[ib * 3], cen[ib * 3 + 1], cen[ib * 3 + 2]], d = [];
    for (let i = 0; i < n; i++) if (grupo[i] === 0 && set.has(si[i * 4])) d.push(distPS([po[i * 3], po[i * 3 + 1], po[i * 3 + 2]], A, B));
    d.sort((x, y) => x - y); if (!d.length) continue;
    cad.push({ nom, ia, ib, parte, r: Math.min(0.16, d[Math.floor(d.length * 0.5)]), rFuera: d[Math.floor(d.length * 0.95)] });
  }
  const esc = [], armas = {}; for (let i = 0; i < n; i++) { const gr = grupo[i]; if (gr === 1) esc.push(i); else if (gr >= 2 && gr <= 5) (armas[gr] = armas[gr] || []).push(i); }
  P = { grupo, cen, cad, esc, armas, nb, n, clipMorir: j.clips && j.clips.morir }; PREP.set(nv, P); return P;
}
function distPS(p, a, b) { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], L = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2; let t = L > 1e-12 ? (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t); }
/* distancia entre los segmentos p1q1 y p2q2 → [d, s (en el 1), t (en el 2)] */
function distSS(p1, q1, p2, q2) {
  const d1 = [q1[0] - p1[0], q1[1] - p1[1], q1[2] - p1[2]], d2 = [q2[0] - p2[0], q2[1] - p2[1], q2[2] - p2[2]], r = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
  const a = d1[0] ** 2 + d1[1] ** 2 + d1[2] ** 2, e = d2[0] ** 2 + d2[1] ** 2 + d2[2] ** 2, f = d2[0] * r[0] + d2[1] * r[1] + d2[2] * r[2]; let s, t;
  if (a < 1e-12 && e < 1e-12) { s = t = 0; }
  else if (a < 1e-12) { s = 0; t = Math.max(0, Math.min(1, f / e)); }
  else { const c = d1[0] * r[0] + d1[1] * r[1] + d1[2] * r[2];
    if (e < 1e-12) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
    else { const b = d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2], den = a * e - b * b; s = den > 1e-12 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0; t = (b * s + f) / e;
      if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); } } }
  return [Math.hypot(p1[0] + d1[0] * s - p2[0] - d2[0] * t, p1[1] + d1[1] * s - p2[1] - d2[1] * t, p1[2] + d1[2] * s - p2[2] - d2[2] * t), s, t];
}
/* los cortes del segmento P→Q con los triángulos de cuerpo del hombre H (ya en pose): fracciones s ∈ [0, 1] a lo largo del segmento */
function cortes(H, P, Q) {
  const C = H.cuerpo, v = pielDe(H), T = C.tris, o = [], dx = Q[0] - P[0], dy = Q[1] - P[1], dz = Q[2] - P[2];
  for (let k = 0; k < T.length; k += 3) {
    const a = T[k] * 3, b = T[k + 1] * 3, c = T[k + 2] * 3;
    const e1x = v[b] - v[a], e1y = v[b + 1] - v[a + 1], e1z = v[b + 2] - v[a + 2], e2x = v[c] - v[a], e2y = v[c + 1] - v[a + 1], e2z = v[c + 2] - v[a + 2];
    const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-12) continue;
    const inv = 1 / det, tx = P[0] - v[a], ty = P[1] - v[a + 1], tz = P[2] - v[a + 2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, w = (dx * qx + dy * qy + dz * qz) * inv; if (w < 0 || u + w > 1) continue;
    const s = (e2x * qx + e2y * qy + e2z * qz) * inv; if (s >= 0 && s <= 1) o.push(s);
  }
  return o;
}
/* los vértices de cuerpo del hombre H en el mundo (se calculan una vez por medida, solo si hace falta) */
function pielDe(H) {
  const C = H.cuerpo; if (C.v) return C.v;
  const { nv, X, e, Pp } = C, po = nv.geo.attributes.position.array, si = nv.geo.attributes.aSkinI.array, sw = nv.geo.attributes.aSkinW.array, v = new Float32Array(po.length), usa = C.usa;
  for (let i = 0; i < Pp.n; i++) {
    if (!usa[i]) continue; const x = po[i * 3], y = po[i * 3 + 1], z = po[i * 3 + 2]; let ox = 0, oy = 0, oz = 0;
    for (let q = 0; q < 4; q++) { const w = sw[i * 4 + q] / 255; if (w <= 0) continue; const m = si[i * 4 + q] * 12; ox += w * (X[m] * x + X[m + 1] * y + X[m + 2] * z + X[m + 3]); oy += w * (X[m + 4] * x + X[m + 5] * y + X[m + 6] * z + X[m + 7]); oz += w * (X[m + 8] * x + X[m + 9] * y + X[m + 10] * z + X[m + 11]); }
    v[i * 3] = e[0] * ox + e[4] * oy + e[8] * oz + e[12]; v[i * 3 + 1] = e[1] * ox + e[5] * oy + e[9] * oz + e[13]; v[i * 3 + 2] = e[2] * ox + e[6] * oy + e[10] * oz + e[14];
  }
  return (C.v = v);
}
export function medirChoques(escena, op = {}) {
  const figs = new Map(), clave = (x, z) => Math.round(x * 50) + ',' + Math.round(z * 50);
  for (const f of op.figs || []) figs.set(clave(f.x, f.z), f);
  const hombres = new Map(), astas = [], escSueltos = [];
  const mallas = []; escena.traverse(o => { if (o.isInstancedMesh && o.visible !== false && o.count > 0) mallas.push(o); });
  for (const m of mallas) {
    const ud = m.userData || {}, A = m.instanceMatrix.array;
    if (ud.asta) { for (let i = 0; i < m.count; i++) { const e = A.subarray(i * 16, i * 16 + 16), sz = Math.hypot(e[8], e[9], e[10]); if (sz < 1e-6) continue; const L = ud.asta.largo * sz, P = [e[12], e[13], e[14]], D = [e[8] / sz, e[9] / sz, e[10] / sz];
      astas.push({ tipo: ud.asta.tipo || 'sarisa', P, Q: [P[0] + D[0] * L, P[1] + D[1] * L, P[2] + D[2] * L], L, r: ud.asta.radio * Math.hypot(e[0], e[1], e[2]), dueno: ud.asta.duenos ? ud.asta.duenos[i] : null }); } continue; }
    if (ud.escudoSuelto) { const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const lo = g.boundingBox.min, hi = g.boundingBox.max;
      for (let i = 0; i < m.count; i++) { const e = A.subarray(i * 16, i * 16 + 16), pts = []; if (Math.hypot(e[0], e[1], e[2]) < 1e-6) continue;
        for (const u of [0, 0.5, 1]) for (const v of [0, 0.5, 1]) for (const w of [0, 0.5, 1]) { const x = lo.x + (hi.x - lo.x) * u, y = lo.y + (hi.y - lo.y) * v, z = lo.z + (hi.z - lo.z) * w; pts.push([e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]); }
        escSueltos.push({ pts, dueno: ud.duenos ? ud.duenos[i] : null }); } continue; }
    const nv = ud.nivel; if (!nv || !m.geometry.attributes.aCuadro) continue;
    const Pp = prepara(nv), cu = m.geometry.attributes.aCuadro.array, mu = m.geometry.attributes.aMuestra ? m.geometry.attributes.aMuestra.array : null;
    const tab = m.material.userData && m.material.userData.huesos, src = tab || nv.crudo, half = !tab, nb = Pp.nb, aset = nv.geo.attributes.aSet ? nv.geo.attributes.aSet.array : null;
    const po = nv.geo.attributes.position.array, si = nv.geo.attributes.aSkinI.array, sw = nv.geo.attributes.aSkinW.array, filas = src.length / (nb * 12);
    /* lo que dibuja esta malla: sus vértices y sus triángulos de cuerpo (una vez por geometría) */
    if (!ud.bt1 || ud.bt1.ix !== m.geometry.index) {
      const ix = m.geometry.index.array, dib = new Uint8Array(Pp.n), tris = [];
      for (let q = 0; q < ix.length; q += 3) { dib[ix[q]] = dib[ix[q + 1]] = dib[ix[q + 2]] = 1; if (Pp.grupo[ix[q]] === 0 && Pp.grupo[ix[q + 1]] === 0 && Pp.grupo[ix[q + 2]] === 0) tris.push(ix[q], ix[q + 1], ix[q + 2]); }
      const usa = new Uint8Array(Pp.n); for (const q of tris) usa[q] = 1;
      ud.bt1 = { ix: m.geometry.index, dib, tris: new Uint32Array(tris), usa };
    }
    const { dib, tris, usa } = ud.bt1;
    for (let i = 0; i < m.count; i++) {
      const e = Float64Array.from(A.subarray(i * 16, i * 16 + 16)); if (Math.hypot(e[0], e[1], e[2]) < 1e-6) continue;
      const fa = Math.round(cu[i * 3]), fb = Math.round(cu[i * 3 + 1]), mz = cu[i * 3 + 2]; if (fa >= filas || fb >= filas) continue;
      const k = clave(e[12], e[14]); let H = hombres.get(k);
      const f = figs.get(k) || null, morir = Pp.clipMorir && fa >= Pp.clipMorir.ini && fa < Pp.clipMorir.ini + Pp.clipMorir.n;
      if (!H) { H = { f, bando: f ? f.bando : null, caido: f ? f.clip === 'morir' || !!(f.h && f.h.vivo === false) : morir, x: e[12], z: e[14], caps: [], escudos: [], armas: [], cuerpo: null }; hombres.set(k, H); }
      /* las matrices de sus huesos en este cuadro (la mezcla de las filas A y B, como el sombreador) */
      const X = new Float64Array(nb * 12), base = fr => fr * nb * 12;
      for (let q = 0; q < nb * 12; q++) { const a = half ? h2f(src[base(fa) + q]) : src[base(fa) + q], b = half ? h2f(src[base(fb) + q]) : src[base(fb) + q]; X[q] = a * (1 - mz) + b * mz; }
      const mundo = p => [e[0] * p[0] + e[4] * p[1] + e[8] * p[2] + e[12], e[1] * p[0] + e[5] * p[1] + e[9] * p[2] + e[13], e[2] * p[0] + e[6] * p[1] + e[10] * p[2] + e[14]];
      const huesoP = (b, p) => { const m0 = b * 12; return mundo([X[m0] * p[0] + X[m0 + 1] * p[1] + X[m0 + 2] * p[2] + X[m0 + 3], X[m0 + 4] * p[0] + X[m0 + 5] * p[1] + X[m0 + 6] * p[2] + X[m0 + 7], X[m0 + 8] * p[0] + X[m0 + 9] * p[1] + X[m0 + 10] * p[2] + X[m0 + 11]]); };
      const vert = v => { const p = [po[v * 3], po[v * 3 + 1], po[v * 3 + 2]], o = [0, 0, 0]; for (let q = 0; q < 4; q++) { const w = sw[v * 4 + q] / 255; if (w <= 0) continue; const b = si[v * 4 + q] * 12;
        o[0] += w * (X[b] * p[0] + X[b + 1] * p[1] + X[b + 2] * p[2] + X[b + 3]); o[1] += w * (X[b + 4] * p[0] + X[b + 5] * p[1] + X[b + 6] * p[2] + X[b + 7]); o[2] += w * (X[b + 8] * p[0] + X[b + 9] * p[1] + X[b + 10] * p[2] + X[b + 11]); } return mundo(o); };
      const oculto = v => { if (!aset || !mu) return false; const s = aset[v]; return s > 0.5 && Math.floor(mu[i] / Math.pow(2, s - 1) + 0.001) % 2 < 0.5; };
      const esc = Math.hypot(e[0], e[1], e[2]);
      if (tris.length && !H.cuerpo) {
        H.cuerpo = { nv, X, e, Pp, tris, usa, v: null };
        const cen = b => [Pp.cen[b * 3], Pp.cen[b * 3 + 1], Pp.cen[b * 3 + 2]];
        for (const c of Pp.cad) H.caps.push({ nom: c.nom, parte: c.parte, a: huesoP(c.ia, cen(c.ia)), b: huesoP(c.ib, cen(c.ib)), r: c.r * esc, rFuera: c.rFuera * esc });
      }
      /* escudo y armas: solo los vértices que esta malla dibuja y no oculta */
      const paso = l => Math.max(1, Math.floor(l.length / 80));
      if (Pp.esc.length) { const pts = []; for (let q = 0; q < Pp.esc.length; q += paso(Pp.esc)) { const v = Pp.esc[q]; if (dib[v] && !oculto(v)) pts.push(vert(v)); } if (pts.length > 4) H.escudos.push(pts); }
      for (const gr in Pp.armas) {
        const L = Pp.armas[gr], pts = []; for (let q = 0; q < L.length; q += paso(L)) { const v = L[q]; if (dib[v] && !oculto(v)) pts.push(vert(v)); } if (pts.length < 4) continue;
        const lejos = a => pts.reduce((m0, p) => { const d = (p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2 + (p[2] - a[2]) ** 2; return d > m0[0] ? [d, p] : m0; }, [-1, null])[1];
        const p1 = lejos(pts[0]), p2 = lejos(p1), L2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]); if (L2 < 0.3) continue;
        H.armas.push({ tipo: ARMA_N[gr], P: p1, Q: p2, L: L2, r: 0.012 });
      }
    }
  }
  const L = [...hombres.values()].filter(H => H.caps.length && H.bando);
  for (const H of L) for (const a of H.armas) astas.push(Object.assign(a, { duenoH: H }));
  for (const a of astas) if (a.dueno && !a.duenoH) a.duenoH = hombres.get(clave(a.dueno.x, a.dueno.z)) || null;
  for (const s of escSueltos) { if (s.dueno) { const H = hombres.get(clave(s.dueno.x, s.dueno.z)); if (H) H.escudos.push(s.pts); } }
  /* rejilla de 1 m por el pie de cada hombre */
  const G = new Map();
  for (const H of L) { const k = Math.floor(H.x) + ',' + Math.floor(H.z); (G.get(k) || G.set(k, []).get(k)).push(H); }
  const cerca = (x0, z0, x1, z1) => { const o = []; for (let x = Math.floor(Math.min(x0, x1)) - 2; x <= Math.floor(Math.max(x0, x1)) + 2; x++) for (let z = Math.floor(Math.min(z0, z1)) - 2; z <= Math.floor(Math.max(z0, z1)) + 2; z++) { const c = G.get(x + ',' + z); if (c) o.push(...c); } return o; };
  const choques = [], r2 = v => Math.round(v * 100) / 100;
  const quien = H => !H ? '?' : (H.f && H.f.h && H.f.h.r != null && H.f.h.f != null ? 'fila ' + H.f.h.r + ' col ' + H.f.h.f + ' ' : H.f && H.f.h && H.f.h.fila != null ? 'fila ' + H.f.h.fila + ' col ' + H.f.h.col + ' ' : '') + H.bando + '@' + r2(H.x) + ',' + r2(H.z) + (H.caido ? ' (caído)' : '');
  const apunta = (tipo, a, b, cuanto, extra) => choques.push(Object.assign({ tipo, de: quien(a), en: quien(b), cuanto: r2(cuanto) }, extra));
  /* 1. astas: cortan triángulos del cuerpo de otro */
  for (const a of astas) {
    const dH = a.duenoH, vistos = new Set();
    if (a.dueno && !dH) continue;   /* su dueño no se pinta (fuera de cámara): su asta tampoco cuenta */
    for (const H of cerca(a.P[0], a.P[2], a.Q[0], a.Q[2])) {
      if (H === dH || vistos.has(H)) continue; vistos.add(H);
      let cerca0 = false; for (const c of H.caps) if (distSS(a.P, a.Q, c.a, c.b)[0] < c.rFuera + 0.12) { cerca0 = true; break; }
      if (!cerca0) continue;
      const S = cortes(H, a.P, a.Q); if (!S.length) continue;
      const smin = Math.min(...S), smax = Math.max(...S), dePunta = (1 - smin) * a.L, dentro = (smax - smin) * a.L;
      const comp = dH ? H.bando === dH.bando : false, extra = { arma: a.tipo, cortes: S.length, dePunta: r2(dePunta) };
      if (H.caido) apunta('asta-caido', dH, H, dentro, extra);
      else if (comp) apunta('asta-companero', dH, H, dentro, extra);
      else if (dePunta > MARGEN.puntaRival) apunta('asta-rival', dH, H, dentro, extra);
    }
  }
  /* 2. brazos y escudos contra el tronco, los hombros y la cabeza de un compañero; 3. caídos */
  for (const A of L) for (const B of cerca(A.x, A.z, A.x, A.z)) {
    if (A === B || Math.hypot(A.x - B.x, A.z - B.z) > 2.6) continue;
    const nucleo = B.caps.filter(c => c.parte === 'tronco' || c.parte === 'cabeza');
    if (!A.caido && !B.caido && A.bando === B.bando) {
      let peor = null; for (const ca of A.caps) if (ca.parte === 'brazo') for (const cb of nucleo) { const [d] = distSS(ca.a, ca.b, cb.a, cb.b), pen = ca.r + cb.r - d; if (pen > MARGEN.brazo && (!peor || pen > peor.pen)) peor = { pen, ca, cb }; }
      if (peor) apunta('brazo', A, B, peor.pen, { parte: peor.ca.nom + '→' + peor.cb.nom });
      for (const pts of A.escudos) { let n = 0, pm = 0; for (const p of pts) for (const cb of nucleo) { const pen = cb.r - distPS(p, cb.a, cb.b); if (pen > MARGEN.escudo) { n++; pm = Math.max(pm, pen); break; } } if (n >= MARGEN.escudoVerts) apunta('escudo', A, B, pm, { vertices: n }); }
    }
    if (A.caido && (B.caido ? A.x < B.x || (A.x === B.x && A.z < B.z) : true)) {
      let peor = null; const cuerpoB = B.caido ? nucleo : B.caps;
      for (const ca of A.caps) if (ca.parte !== 'brazo') for (const cb of cuerpoB) { const [d] = distSS(ca.a, ca.b, cb.a, cb.b), pen = ca.r + cb.r - d; if (pen > MARGEN.caido && (!peor || pen > peor.pen)) peor = { pen, ca, cb }; }
      if (peor) apunta(B.caido ? 'caidos' : 'caido-vivo', A, B, peor.pen, { parte: peor.ca.nom + '→' + peor.cb.nom });
    }
  }
  const cuenta = {}; for (const c of choques) cuenta[c.tipo] = (cuenta[c.tipo] || 0) + 1;
  const R = { hombres: L.length, astas: astas.length, caidos: L.filter(H => H.caido).length, total: choques.length, cuenta, choques };
  if (op.depura) R.depura = { L, astas };   /* para mirar a mano (no es JSON) */
  return R;
}
