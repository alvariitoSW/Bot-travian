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

export const D_RIVAL = 0.95;     /* m entre dos rivales (centro a centro): los escudos se tocan, no se cruzan */
export const TENDIDO = 1.25;     /* m de los pies a la cabeza del caído */
export const RAD_CAIDO = 0.22;   /* medio ancho del caído (hombros) */
export const CAE_T = 1.8;        /* s que tarda en quedar tendido (el muñeco de morir: 2,4 s) */
export const VARA = { mismo: MIN_DIST, rival: 0.9 };   /* las varas de la medida: 0,45 m entre los de un bando; 0,9 entre rivales */
export const PROY_MAX = 160;     /* los que se dibujan (los más viejos del suelo se quitan) */
export const SUELO_VIDA = 25;    /* s que se queda en el suelo un proyectil */
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

export function crearFisicaBloque({ S, TR, H = () => 0, activa = true, semilla = 1 }) {
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
    const testudo = S.tuyo.orden === 'testudo'; despierta();
    for (const f of TR.figs) {
      if (!despiertos.has(f.b)) continue;
      const c = cuerpo(f); c.x = f.x; c.z = f.z; c.yaw = f.yaw; c.vivo = true; c.salta = f.v > V_SALTA;
      if (f.h) { c.f = f.h.col; c.r = f.h.fila; c.guardia = testudo ? (f.h.fila === 0 ? 'muro' : 'alto') : null; SF.fal.push(c); }
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
  const guardiaDe = f => S.tuyo.orden === 'testudo' && f.h ? (f.h.fila === 0 ? 'muro' : 'alto') : null;
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
     que llegan en unos dur s. Devuelve cuántos salieron */
  function salva(de, a, n, dur, tipo, punto) {
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
