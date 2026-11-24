/* FI3: los proyectiles del testudo a pie con la física de js/fisica-batalla.js (crearProyectiles). ?fisica=0 la apaga.
   Diseño: gobierno/estudios/FI3-diseno-proyectiles.md. Solo cambia CÓMO SE VE cada venablo (FL, peltastas → romanos) y cada
   pilum (PILA, romanos → galos): en vuelo se paran en lo primero que tocan; al llegar se clavan, rebotan o resbalan; lo
   clavado sigue a su escudo o a su hombre. Quién muere, qué escudo recibe el golpe y los sonidos los deciden las reglas de
   escena.js, que no leen nada de aquí. Este archivo no llama a azar(): el motor tiene su azar propio.

   Estado de dibujo: f.fi en cada proyectil (un envoltorio; el motor escribe en f.fi.fi). La escena da con conecta() lo que
   hace falta para ver cada hombre como se dibuja (S, FL, PILA, hueso del escudo de los galos, su figura, tu escudo roto).

   Obstáculos, tal como se dibujan y solo los cercanos a un proyectil:
   - escudo romano (scutum): curvo; se le dan tres tiras planas (izquierda, centro con el umbo, derecha) desde h.mEsc.
   - cuerpo romano y galo: cilindro (sin piernas: lo tumbado se pasa por encima).
   - escudo galo: caja plana desde su hueso, mirando hacia donde mira el galo.
   Los venablos solo ven a los romanos; los pila solo a los galos (salen de entre los romanos, por encima de ellos).
   Licencia de juego: grosores, tamaños de las cajas y el ángulo con que el pilum se queda en el cuerpo (60°). */
import { crearProyectiles } from '../../../js/fisica-batalla.js';
import { ESCALA } from './fisica.js';

const MANDA = 60;   /* grados: más tendido que esto (respecto a la cara del cuerpo) el pilum que mata no se queda en él */
const CERCA2 = 16;  /* (4 m)²: los hombres más lejos de todo proyectil no cuentan */
const nor = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mP = (M, p) => [M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]];
const mD = (M, p) => [M[0] * p[0] + M[4] * p[1] + M[8] * p[2], M[1] * p[0] + M[5] * p[1] + M[9] * p[2], M[2] * p[0] + M[6] * p[1] + M[10] * p[2]];
const col = (M, k) => Math.hypot(M[k * 4], M[k * 4 + 1], M[k * 4 + 2]);

export function crearProyectilesEscena({ H, ySup, geoV, geoP }) {
  const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const activa = Q.get('fisica') !== '0', Pr = crearProyectiles({ H, escala: ESCALA, semilla: 20261123, mismo: (a, b) => a === b || (!!a && !!b && !!a.h && a.h === b.h), clave: d => (d && d.h) || d });   /* FI3u: el lastre se cuenta por hombre, no por tira */   /* las tres tiras de un scutum son el mismo escudo */
  /* lo dibujado de cada asta: de la punta al origen de la malla (TIP) y largo entero (LD) */
  const caja = g => { g.computeBoundingBox(); return { TIP: g.boundingBox.max.z, LD: g.boundingBox.max.z - g.boundingBox.min.z }; };
  const MV = caja(geoV), MPI = caja(geoP);
  let X = null, pecho = -1, tAntes = null;
  const ahora = () => (typeof performance !== 'undefined' ? performance : Date).now(), tiempos = [];
  function conecta(x) { X = x; }

  /* el hueso del pecho del galo: el que más mueve el vértice más cercano a la mitad alta del cuerpo */
  function huesoPecho() {
    if (pecho >= 0) return pecho; const F = X.figG(); if (!F) return -1;
    const A = F.u.geo.attributes, P = A.position.array, SI = A.aSkinI.array, SW = A.aSkinW.array, n = P.length / 3;
    let cx = 0, cz = 0, my = -1e9; for (let i = 0; i < n; i++) { cx += P[i * 3]; cz += P[i * 3 + 2]; my = Math.max(my, P[i * 3 + 1]); } cx /= n; cz /= n;
    let mejor = 1e9, k = -1; for (let i = 0; i < n; i++) { const d = (P[i * 3] - cx) ** 2 + (P[i * 3 + 1] - 0.68 * my) ** 2 + (P[i * 3 + 2] - cz) ** 2; if (d < mejor) { mejor = d; k = i; } }
    let b = 0; for (let j = 1; j < 4; j++) if (SW[k * 4 + j] > SW[k * 4 + b]) b = j; return (pecho = SI[k * 4 + b]);
  }
  const mats = new Map();   /* matrices de este paso (Matrix4 de la escena) */
  const matGaloEsc = g => { let m = mats.get(g); if (!m) { m = X.galoEsc(g, new X.M4()).elements.slice(); mats.set(g, m); } return m; };
  const matsP = new Map(), matGaloPecho = g => { let c = matsP.get(g); if (!c) { const s = huesoPecho(); c = s < 0 ? g.inst.elements.slice() : X.galoHueso(g, s, new X.M4()).elements.slice(); matsP.set(g, c); } return c; };

  /* las tres tiras del scutum en sus medidas (modelo): de canto a canto, curvo con ySup; la cara de fuera mira a −y */
  const TIRAS = [[-0.79, -0.27], [-0.27, 0.27], [0.27, 0.79]].map(([a, b], k) => {
    const A = [a, ySup(a)], B = [b, ySup(b)], t = nor([B[0] - A[0], B[1] - A[1], 0]), n = [t[1], -t[0], 0], g = 0.05;
    return { k, c: [(a + b) / 2 - n[0] * g, (A[1] + B[1]) / 2 - n[1] * g, 0], n, t, med: Math.hypot(B[0] - A[0], B[1] - A[1]) / 2, g };
  });
  const DUENOS = new WeakMap();
  const tirasDe = h => { let d = DUENOS.get(h); if (!d) DUENOS.set(h, d = TIRAS.map(t => ({ h, k: t.k }))); return d; };
  const rotoYo = h => h === X.yo() && X.roto();
  function obstRomano(h, L) {
    const M = h.mEsc.elements, sx = col(M, 0), sy = col(M, 1), sz = col(M, 2), D = tirasDe(h);
    if (!rotoYo(h)) for (const t of TIRAS) L.push({ tipo: 'escudo', c: mP(M, t.c), n: nor(mD(M, t.n)), u: nor(mD(M, t.t)), v: nor(mD(M, [0, 0, 1])), m: [t.g * sy, t.med * sx, 1.49 * sz], umbo: t.k === 1 ? 0.12 / ESCALA : 0, dueno: D[t.k] });
    const x = h.inst.elements[12], z = h.inst.elements[14], y = H(x, z); L.push({ tipo: 'cuerpo', x, z, y0: y + 0.35, y1: y + 1.75, r: 0.2 * ESCALA, dueno: h });
  }
  function obstGalo(g, L, solo) {
    const I = g.inst.elements, x = I[12], z = I[14], y = H(x, z), G = X.gesc(), r = {};
    if (G && !g.sinEscudo) { /* FI3u: sin escudo, sin obstáculo */ const M = matGaloEsc(g), f = nor([I[8], 0, I[10]]); r.escudo = { tipo: 'escudo', c: mP(M, [G.c.x, G.c.y, G.c.z]), n: f, u: [f[2], 0, -f[0]], v: [0, 1, 0], m: [0.03, 0.3, 0.45], umbo: 0.08 / ESCALA, dueno: g }; }
    r.cuerpo = { tipo: 'cuerpo', x, z, y0: y + 0.35, y1: y + 2.05, r: 0.22 * ESCALA, dueno: g };
    if (L) { if (r.escudo) L.push(r.escudo); L.push(r.cuerpo); } return solo ? r[solo] : r;
  }
  /* rejilla de 4 m con los sitios: cada hombre mira solo las 9 casillas de su alrededor */
  function rejilla(sitios) {
    const R = new Map(), k = (i, j) => i * 100003 + j;
    for (const s of sitios) { const c = k(Math.floor(s[0] / 4), Math.floor(s[2] / 4)); let l = R.get(c); if (!l) R.set(c, l = []); l.push(s); }
    return (x, z) => { const i = Math.floor(x / 4), j = Math.floor(z / 4); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = R.get(k(i + a, j + b)); if (l) for (const s of l) if ((s[0] - x) ** 2 + (s[2] - z) ** 2 < CERCA2) return true; } return false; };
  }
  function listaR(S, sitios) { const L = []; if (sitios.length) { const cerca = rejilla(sitios); for (const h of S.romanos) if (h.vivo && cerca(h.inst.elements[12], h.inst.elements[14])) obstRomano(h, L); } return L; }
  function listaG(S, sitios) { const L = []; if (sitios.length) { const cerca = rejilla(sitios); for (const g of S.galos) if (g.vivo && !g.reserva && cerca(g.inst.elements[12], g.inst.elements[14])) obstGalo(g, L); } return L; }

  const dirDe = q => { const x = q.x, y = q.y, z = q.z, w = q.w; return [2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)]; };   /* Z1 girado por q */
  const clavadoEn = w => !!w.fi && w.fi.modo === 'clava' && w.fi.que !== 'suelo';
  const mueveSi = w => { const f = w && w.fi; return !!f && (f.modo === 'vuela' || f.modo === 'rebota' || f.modo === 'cae' || f.modo === 'resbala' || (f.modo === 'clava' && f.que === 'suelo')); };
  /* el último tramo del vuelo, hasta donde lo deja la regla (y un poco más): lo que toque primero es lo que manda */
  function remata(w, fin, d, obst) { const f = w.fi; if (!f || f.toca || !f.prev) return; Pr.vuela(w, [fin[0] + d[0] * 0.3, fin[1] + d[1] * 0.3, fin[2] + d[2] * 0.3], f.v || d, obst); }
  const nuevo = (t0, largo, tipo) => ({ t0, est: 1, fi: null, prev: null, dib: null, largo, tipo });   /* largo: el de la malla (venablo, pilum); tipo (FI3u): 'jabalina' | 'pilum' */

  /* ---------- cada paso de las reglas (al final de paso() de la escena) ---------- */
  function paso(S, dt) {
    if (!activa || !X) return;
    const a0 = ahora(), T = S.T; dt = tAntes === null ? dt : Math.min(0.1, Math.max(0, T - tAntes)); tAntes = T; mats.clear(); matsP.clear();
    /* FI3u (César, BG 1.25): el galo vivo con dos pila clavados en el escudo lo suelta; los pila siguen en el escudo del suelo */
    if (X.sueltaEscudo) for (const g of S.galos) { const n = g.vivo ? Pr.pila(g) : 0; if (n > pilaMax) pilaMax = n; if (n >= 2 && !g.sinEscudo && X.sueltaEscudo(g)) { sueltos++; for (const q of X.PILA) { const w = q.fi; if (w && w.fi && w.fi.modo === 'clava' && w.fi.que === 'escudo' && w.fi.dueno === g) Pr.suelta(w); } } }   /* FI3u: el escudo cae; sus pila caen con él (si no, el astil se mete en la tierra) */
    const sV = [], sP = [];
    for (const f of X.FL) { if (f.est === 1 && T >= f.t0) { sV.push([f.p.x, f.p.y, f.p.z]); if ((T - f.t0) / f.dur > 0.85) sV.push([f.p1.x, f.p1.y, f.p1.z]); } else if (f.fi && f.fi.dib && (mueveSi(f.fi) || f.fi.est !== f.est || clavadoEn(f.fi))) sV.push(f.fi.dib.punta); }
    for (const p of X.PILA) { if (p.est === 2) { sP.push([p.p.x, p.p.y, p.p.z]); if ((T - p.t0) / p.dur > 0.8) sP.push([p.p1.x, p.p1.y, p.p1.z]); } else if (p.fi && p.fi.dib && (mueveSi(p.fi) || p.fi.est !== p.est || clavadoEn(p.fi))) sP.push(p.fi.dib.punta); }
    const oR = listaR(S, sV), oG = listaG(S, sP);
    const matR = d => d && d.h ? d.h.mEsc.elements : null;
    /* venablos */
    for (const f of X.FL) {
      if (f.est === 0 || (f.est === 1 && T < f.t0)) { if (f.fi) Pr.olvida(f.fi); f.fi = null; continue; }   /* FI3u: olvida = deja de lastrar */
      let w = f.fi;
      if (f.est === 1) {
        if (!w || w.t0 !== f.t0) { if (w) Pr.olvida(w); w = f.fi = nuevo(f.t0, MV.LD, 'jabalina'); }
        const s = Math.min(1, (T - f.t0) / f.dur), d = nor(dirDe(f.q)), punta = [f.p.x + d[0] * MV.TIP, f.p.y + d[1] * MV.TIP, f.p.z + d[2] * MV.TIP];
        const vel = [(f.p1.x - f.p0.x) / f.dur, ((f.p1.y - f.p0.y) + f.alto * 4 * (1 - 2 * s)) / f.dur, (f.p1.z - f.p0.z) / f.dur];
        Pr.vuela(w, punta, vel, oR);
      } else if (!w) { f.fi = null; continue; }   /* llegó sin verlo volar: como antes */
      else if (w.est === 1) {   /* acaba de llegar: lo que diga la regla */
        const fv = w.fi, d = nor(fv.v || [0, -1, 0]);
        if (f.est === 2) {
          const fin = [f.p1.x, f.p1.y, f.p1.z]; remata(w, fin, d, oR);
          const c = fv.toca, tira = c && c.tipo === 'escudo' ? c.dueno : tirasDe(f.h)[Math.abs(f.rel.x) < 0.27 ? 1 : f.rel.x < 0 ? 0 : 2];
          const o = oR.find(o => o.dueno === tira) || (() => { const L = []; obstRomano(f.h, L); return L.find(o => o.dueno === tira); })();
          Pr.llega(w, { tipo: 'escudo', dueno: tira, o, otroVale: true }, oR, du => matR(du));
        } else { remata(w, [f.p1.x, H(f.p1.x, f.p1.z), f.p1.z], d, oR); Pr.llega(w, { tipo: 'suelo' }, oR); }
      } else if (w.est === 2 && f.est !== 2 && w.fi.modo === 'clava') Pr.suelta(w);   /* la regla lo suelta (escudo bajado, hombre caído, tu escudo roto) */
      const fv = w.fi;
      /* clavado en el escudo de otro (lo tocó en vuelo): cae con lo mismo que haría caer al suyo */
      if (fv.modo === 'clava' && fv.que === 'escudo' && fv.dueno && fv.dueno.h) { const h = fv.dueno.h; if (!h.vivo || h.k < 0.7 || rotoYo(h) || (f.est !== 2 && h !== f.h)) Pr.suelta(w); }
      if (w.est === 1 && f.est !== 1) desclava(w, oR, matR(fv.dueno));
      w.est = f.est; Pr.mueve(w, dt, oR);
      const cl = fv.modo === 'clava' && fv.que === 'escudo' && fv.dueno && fv.dueno.h;
      w.dib = Pr.pose(w, cl ? matR(fv.dueno) : null, cl ? oR : undefined);   /* con los cercanos: si su astil entra en el escudo vecino, gira o sale */
    }
    /* pila */
    for (const p of X.PILA) {
      if (p.est < 2) { if (p.fi) Pr.olvida(p.fi); p.fi = null; continue; }
      let w = p.fi;
      if (p.est === 2) {
        if (!w || w.t0 !== p.t0) { if (w) Pr.olvida(w); w = p.fi = nuevo(p.t0, MPI.LD, 'pilum'); w.est = 2; }
        const d = nor(dirDe(p.q)), punta = [p.p.x + d[0] * MPI.TIP, p.p.y + d[1] * MPI.TIP, p.p.z + d[2] * MPI.TIP];
        const vel = w.prev && dt > 0 ? [(punta[0] - w.prev[0]) / dt, (punta[1] - w.prev[1]) / dt, (punta[2] - w.prev[2]) / dt] : [d[0] * 20, d[1] * 20, d[2] * 20];
        w.prev = punta; Pr.vuela(w, punta, vel, oG);
      } else if (!w) { p.fi = null; continue; }
      else if (w.est === 2) {   /* acaba de llegar */
        const fv = w.fi, d = nor(fv.v || [0, -1, 0]), g = p.g;
        const fin = p.tipo === 'falla' || !g ? [p.p1.x, H(p.p1.x, p.p1.z), p.p1.z] : [p.p1.x, p.p1.y, p.p1.z];
        if (g && (p.tipo === 'mata' || p.est === 4)) { const L = []; obstGalo(g, L); if (!g.vivo) oG.push(...L); }   /* el que acaba de caer aún se dibuja de pie */
        remata(w, fin, d, oG); const c = fv.toca;
        if (p.est === 4 && !g.sinEscudo) Pr.llega(w, { tipo: 'escudo', dueno: g, o: obstGalo(g, null, 'escudo') }, oG, () => matGaloEsc(g));
        else if (p.tipo === 'mata' && g && g.porPila && g.muere === S.T) {
          /* mata: en su escudo si dio en él; en el cuerpo si el ángulo lo permite; si no, como antes (al suelo, a su lado) */
          if (c && c.tipo === 'escudo' && c.dueno === g) Pr.llega(w, { tipo: 'escudo', dueno: g, o: obstGalo(g, null, 'escudo') }, oG, () => matGaloEsc(g));
          else { const ang = c && c.tipo === 'cuerpo' && c.dueno === g ? Math.acos(Math.min(1, Math.abs(d[0] * c.normal[0] + d[1] * c.normal[1] + d[2] * c.normal[2]))) * 180 / Math.PI : Math.max(50, Math.asin(Math.min(1, Math.abs(d[1]))) * 180 / Math.PI);
            if (ang <= MANDA) Pr.llega(w, { tipo: 'cuerpo', dueno: g, o: obstGalo(g, null, 'cuerpo') }, oG, () => matGaloPecho(g)); else Pr.llega(w, { tipo: 'suelo' }, oG); }
        } else Pr.llega(w, { tipo: 'suelo' }, oG);
      }
      const fv = w.fi; if (w.est === 2 && p.est !== 2 && fv.dueno) desclava(w, oG, fv.que === 'escudo' ? matGaloEsc(fv.dueno) : fv.que === 'cuerpo' ? matGaloPecho(fv.dueno) : null);
      w.est = p.est; Pr.mueve(w, dt, oG);
      const cl = fv.modo === 'clava' && fv.que !== 'suelo' && fv.dueno;
      w.dib = Pr.pose(w, cl ? (fv.que === 'escudo' ? matGaloEsc(fv.dueno) : matGaloPecho(fv.dueno)) : null, cl ? oG : undefined);
      if (cl && w.dib && fv.modo === 'clava' && w.dib.punta[1] < H(w.dib.punta[0], w.dib.punta[2]) + 0.03) { Pr.suelta(w); Pr.mueve(w, 1e-3, oG); w.dib = Pr.pose(w); }   /* FI3u: el galo cae y su escudo toca tierra: el pilum se suelta (si no, la punta entra en el suelo) */
    }
    ultimo = { oR, oG };
    tiempos.push(ahora() - a0); if (tiempos.length > 4000) tiempos.shift();
  }
  let ultimo = { oR: [], oG: [] }, sueltos = 0, pilaMax = 0;   /* FI3u: escudos soltados en la partida; lo más que ha llevado un galo vivo */
  /* el clavado que se hunde (PR.HUNDE) en el escudo de debajo (el techo va en tejas) sale lo justo: la punta en su escudo */
  function desclava(w, L, M) {
    const f = w.fi; if (!f || f.modo !== 'clava' || !f.loc || !M) return;
    const q = Pr.pose(w, M); if (!q || !L.some(o => dentro(o, q.punta) && !suyo(f, o))) return;
    for (let k = 0; k < 3; k++) f.loc[k] -= f.dloc[k] * 0.1;
  }

  /* lo que se dibuja: origen de la malla y dirección; null = como antes */
  function pose(f, cual) {
    if (!activa || !f.fi || !f.fi.dib) return null;
    const q = f.fi.dib, k = (cual === 'p' ? MPI : MV).TIP;
    return { o: [q.punta[0] - q.dir[0] * k, q.punta[1] - q.dir[1] * k, q.punta[2] - q.dir[2] * k], dir: q.dir };
  }

  /* ---------- la medida (para mide-fi3.mjs): astiles dentro de escudo, cuerpo o suelo, a lo largo de lo DIBUJADO ---------- */
  function dentro(o, q, tol = 0.005) {
    if (o.tipo === 'escudo') { const w = [q[0] - o.c[0], q[1] - o.c[1], q[2] - o.c[2]], l = [o.n, o.u, o.v].map(e => e[0] * w[0] + e[1] * w[1] + e[2] * w[2]); return l.every((x, k) => Math.abs(x) < o.m[k] - tol); }
    return q[1] > o.y0 && q[1] < o.y1 && Math.hypot(q[0] - o.x, q[2] - o.z) < o.r - tol;
  }
  /* el pilum que sale de la mano (≤ 0,25 s) cruza el cilindro de su lanzador, que lo lleva en la mano: se cuenta aparte */
  const enMano = (p, cual, o, S, s) => cual === 'p' && p.est === 2 && ((o.tipo === 'cuerpo' && o.dueno === p.h && S.T - p.t0 <= 0.25)
    || (s >= MPI.LD - 0.3 && S.T - p.t0 <= 0.1 && o.dueno && (o.dueno.h || o.dueno.r !== undefined) && !S.galos.includes(o.dueno)));   /* FI3u: y la contera, al salir de la mano (≤ 0,1 s), contra el escudo o el cuerpo de un compañero */
  const suyo = (fv, o) => fv.modo === 'clava' && o.tipo === fv.que && (o.dueno === fv.dueno || (o.dueno && fv.dueno && o.dueno.h && o.dueno.h === fv.dueno.h));
  function mide(S) {
    let malos = 0, muestras = 0, mano = 0; const detalle = [], sigue = { n: 0, mal: 0, max: 0 };
    if (!activa || !X) return { malos, muestras, detalle, sigue, mano };
    const todos = [...X.FL.map(f => [f, MV, 'v']), ...X.PILA.map(p => [p, MPI, 'p'])].filter(([f]) => f.fi && f.fi.dib && f.est > 0 && !(f.est === 1 && S.T < f.t0));
    if (!todos.length) return { malos, muestras, detalle, sigue, mano };
    const sit = todos.map(([f]) => f.fi.dib.punta), O = listaR(S, sit).concat(listaG(S, sit));
    for (const [f, G, cual] of todos) {
      const fv = f.fi.fi, q0 = f.fi.dib; muestras++; let mal = null;
      for (let s = 0.05; s <= G.LD && !mal; s += 0.15) {
        const q = [q0.punta[0] - q0.dir[0] * s, q0.punta[1] - q0.dir[1] * s, q0.punta[2] - q0.dir[2] * s], perdona = fv.modo === 'clava' && s <= 0.25;
        if (q[1] < H(q[0], q[2]) - 0.02 && !(perdona && fv.que === 'suelo')) mal = { en: 'suelo', s };
        else for (const o of O) if (dentro(o, q) && !(perdona && suyo(fv, o))) { if (enMano(f, cual, o, S, s)) { mano++; continue; } mal = { en: o.tipo, s }; break; }
      }
      if (mal) { malos++; if (detalle.length < 8) detalle.push({ cual, modo: fv.modo, que: fv.que, ...mal, s: +mal.s.toFixed(2) }); }
      /* sigue a su dueño: la punta dibujada guarda su sitio respecto al hueso de ahora (matriz recién calculada), entre medidas */
      const w = f.fi, M = fv.modo === 'clava' && fv.que !== 'suelo' && fv.dueno ? (cual === 'v' ? (fv.dueno.h ? fv.dueno.h.mEsc.elements : null) : fv.que === 'escudo' ? X.galoEsc(fv.dueno, new X.M4()).elements : X.galoHueso(fv.dueno, huesoPecho(), new X.M4()).elements) : null;
      if (!M) { w.sig = null; continue; }
      if (w.sig && w.sig.aj === (fv.ajustes || 0)) { const q = mP(M, w.sig.l), d = Math.hypot(q[0] - q0.punta[0], q[1] - q0.punta[1], q[2] - q0.punta[2]); sigue.n++; sigue.max = Math.max(sigue.max, d); if (d >= 0.01) sigue.mal++; }
      w.sig = { l: mP(new X.M4().fromArray(M).invert().elements, q0.punta), aj: fv.ajustes || 0 };
    }
    return { malos, muestras, detalle, sigue, mano };
  }
  function medida() {
    const m = Pr.medir([], []), L = tiempos.slice().sort((a, b) => a - b), media = L.length ? L.reduce((a, b) => a + b, 0) / L.length : 0;
    const modos = {}; for (const f of [...X.FL, ...X.PILA]) if (f.fi && f.fi.fi) modos[f.fi.fi.modo] = (modos[f.fi.fi.modo] || 0) + 1;
        const dos = X.S.galos.filter(g => Pr.pila(g) >= 2).length, uno = X.S.galos.filter(g => Pr.pila(g) === 1).length;   /* FI3u: galos con 1 y con ≥ 2 en el escudo ahora */
    return { activa, sueltos, pilaEnEscudo: { uno, dos, max: pilaMax }, tramos: m.tramos, aparte: m.aparte, saltos: m.saltos, llegan: m.llegan, modos, ms: { media: +media.toFixed(3), p95: +(L[Math.floor(L.length * 0.95)] || 0).toFixed(3), max: +(L[L.length - 1] || 0).toFixed(3), pasos: L.length } };
  }
  function reinicia() { sueltos = 0; pilaMax = 0; Pr.reinicia(); tiempos.length = 0; tAntes = null; }
  return { activa, conecta, paso, pose, mide, medida, reinicia };
}
