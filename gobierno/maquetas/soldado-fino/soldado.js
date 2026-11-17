/* AQVILA · maqueta GM44 «soldado fino»: un hastatus hecho desde cero, por código (arte propio del proyecto).
   Referencias de época (solo para el equipo, nada copiado): relieve del «altar de Domicio Enobarbo» (Louvre Ma 975,
   hacia 100 a.C.: escudo oval con espina y umbo, casco con penacho, cinturón, túnica corta) y Polibio 6.23
   (pectoral de un palmo, tres plumas, greba, espada al costado derecho, dos pila).
   La figura es una malla con huesos: cuerpo por anillos, cara modelada por fórmulas, equipo ceñido al cuerpo. */
import { THREE } from '../../../js/gfx/models.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const gauss = (x, w) => Math.exp(-(x * x) / (w * w));

/* ---------- huesos ---------- */
const HUESOS = [
  ['cadera', null, 0, 0.95, 0], ['lomo', 'cadera', 0, 1.08, 0], ['pecho', 'lomo', 0, 1.24, 0], ['cuello', 'pecho', 0, 1.46, 0], ['cabeza', 'cuello', 0, 1.54, 0.005],
  ['brazoI', 'pecho', 0.2, 1.4, 0], ['codoI', 'brazoI', 0.232, 1.13, 0], ['manoI', 'codoI', 0.25, 0.88, 0.01],
  ['brazoD', 'pecho', -0.2, 1.4, 0], ['codoD', 'brazoD', -0.232, 1.13, 0], ['manoD', 'codoD', -0.25, 0.88, 0.01],
  ['musloI', 'cadera', 0.095, 0.92, 0], ['rodillaI', 'musloI', 0.097, 0.5, 0.005], ['pieI', 'rodillaI', 0.1, 0.075, 0],
  ['musloD', 'cadera', -0.095, 0.92, 0], ['rodillaD', 'musloD', -0.097, 0.5, 0.005], ['pieD', 'rodillaD', -0.1, 0.075, 0],
  ['escudo', 'pecho', 0, 0, 0], ['pilum', 'pecho', 0, 0, 0],
];
const IDX = {}; HUESOS.forEach((h, i) => IDX[h[0]] = i);

/* ---------- acumulador de geometría por material ---------- */
class Malla {
  constructor() { this.p = []; this.n = []; this.uv = []; this.si = []; this.sw = []; this.ix = []; }
  get tris() { return this.ix.length / 3; }
  /* Rejilla fil×col. fn(i,j) → { p:V3, uv:[u,v], w:[hueso,peso,hueso,peso] }. Normales por diferencias (con vuelta si cierra). */
  rejilla(fil, col, fn, o = {}) {
    const base = this.p.length / 3, P = [], cierra = !!o.cierra, inv = o.inv ? -1 : 1;
    for (let i = 0; i < fil; i++) for (let j = 0; j < col; j++) { const r = fn(i, j); P.push(r); this.p.push(r.p.x, r.p.y, r.p.z); this.uv.push(r.uv[0], r.uv[1]);
      const w = r.w; this.si.push(IDX[w[0]], w.length > 2 ? IDX[w[2]] : 0, 0, 0); this.sw.push(w[1], w.length > 2 ? w[3] : 0, 0, 0); }
    const at = (i, j) => P[clamp(i, 0, fil - 1) * col + (cierra ? ((j % (col - 1)) + (col - 1)) % (col - 1) : clamp(j, 0, col - 1))].p;
    const a = new V3(), b = new V3(), n = new V3();
    for (let i = 0; i < fil; i++) for (let j = 0; j < col; j++) {
      a.subVectors(at(i, j + 1), at(i, j - 1)); b.subVectors(at(i + 1, j), at(i - 1, j)); n.crossVectors(a, b).multiplyScalar(inv);
      if (n.lengthSq() < 1e-14) n.set(0, 1, 0); n.normalize(); this.n.push(n.x, n.y, n.z);
    }
    for (let i = 0; i < fil - 1; i++) for (let j = 0; j < col - 1; j++) { const q = base + i * col + j;
      if (inv > 0) this.ix.push(q, q + 1, q + col, q + 1, q + col + 1, q + col); else this.ix.push(q, q + col, q + 1, q + 1, q + col, q + col + 1); }
    return this;
  }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.ix); return g;
  }
}

/* Curva suave por puntos clave [t, ...valores]: devuelve los valores en t (Catmull-Rom). */
function curva(claves) {
  return t => { let k = 0; while (k < claves.length - 2 && t > claves[k + 1][0]) k++;
    const p1 = claves[k], p2 = claves[k + 1], p0 = claves[Math.max(0, k - 1)], p3 = claves[Math.min(claves.length - 1, k + 2)];
    const u = clamp((t - p1[0]) / (p2[0] - p1[0]), 0, 1), out = [];
    for (let c = 1; c < p1.length; c++) { const m1 = (p2[c] - p0[c]) / Math.max(1e-6, p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[c] - p1[c]) / Math.max(1e-6, p3[0] - p1[0]) * (p2[0] - p1[0]);
      const u2 = u * u, u3 = u2 * u; out.push((2 * u3 - 3 * u2 + 1) * p1[c] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[c] + (u3 - u2) * m2); }
    return out; };
}

/* Tubo de anillos horizontales. clave: [y, cx, cz, rx, rz]. pesos(y, ang) → [hueso,peso,(hueso,peso)]. forma(ang,y) → factor del radio. */
function tubo(m, claves, seg, paso, pesos, o = {}) {
  const c = curva(claves), y0 = claves[0][0], y1 = claves[claves.length - 1][0], fil = Math.max(2, Math.round((y1 - y0) / paso) + 1), tu = o.tu || 1, tv = o.tv || 1;
  m.rejilla(fil, seg + 1, (i, j) => { const y = lerp(y0, y1, i / (fil - 1)), [cx, cz, rx, rz] = c(y), ang = j / seg * TAU, f = o.forma ? o.forma(ang, y) : 1;
    const e = o.exp || 2, cs = Math.cos(ang), sn = Math.sin(ang), sx = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / e), sz = Math.sign(cs) * Math.pow(Math.abs(cs), 2 / e);
    return { p: new V3(cx + sx * rx * f, y, cz + sz * rz * f), uv: [j / seg * tu, y * tv], w: pesos(y, ang, sx) }; }, { cierra: true, inv: o.inv });
  if (o.tapa) for (const [yy, arriba] of o.tapa) { const [cx, cz, rx, rz] = c(yy);
    m.rejilla(2, seg + 1, (i, j) => { const ang = j / seg * TAU, r = i === 0 ? 1 : 0.02; return { p: new V3(cx + Math.sin(ang) * rx * r, yy + (i ? (arriba ? 0.004 : -0.004) : 0), cz + Math.cos(ang) * rz * r), uv: [j / seg * tu, yy * tv], w: pesos(yy, ang, Math.sin(ang)) }; }, { cierra: true, inv: !arriba !== !!o.inv }); }
}

/* Reparto entre dos huesos alrededor de una articulación a la altura y0, con media anchura a. */
const junta = (arriba, abajo, y0, a) => y => { const t = sst(y0 - a, y0 + a, y); return t >= 0.999 ? [arriba, 1] : t <= 0.001 ? [abajo, 1] : [arriba, t, abajo, 1 - t]; };

/* ---------- la superficie de la túnica (la usan pectoral, correas y cinturón para ceñirse) ---------- */
const TUN = curva([   // y, cx, cz, rx, rz
  [0.6, 0, 0.005, 0.215, 0.165], [0.72, 0, 0.004, 0.205, 0.155], [0.86, 0, 0.002, 0.19, 0.142], [0.96, 0, 0, 0.176, 0.128], [1.03, 0, 0, 0.158, 0.112],
  [1.1, 0, 0.002, 0.168, 0.121], [1.2, 0, 0.006, 0.182, 0.128], [1.3, 0, 0.01, 0.196, 0.132], [1.38, 0, 0.006, 0.205, 0.122], [1.415, 0, 0, 0.192, 0.106], [1.44, 0, -0.004, 0.135, 0.088], [1.456, 0, -0.004, 0.088, 0.076]]);
const pliegue = (ang, y) => { const bajo = sst(1.02, 0.62, y), alto = sst(1.06, 1.16, y) * (1 - sst(1.2, 1.36, y));
  return 1 + bajo * (0.07 * Math.sin(ang * 9 + 0.6) + 0.025 * Math.sin(ang * 18 + 2.1)) + alto * 0.012 * Math.sin(ang * 13 + 1.3) + 0.012 * gauss(y - 1.075, 0.03); };
function tunica(y, ang, fuera = 0) { const [cx, cz, rx, rz] = TUN(y), f = pliegue(ang, y), e = 2.5, cs = Math.cos(ang), sn = Math.sin(ang);
  const sx = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / e), sz = Math.sign(cs) * Math.pow(Math.abs(cs), 2 / e);
  return new V3(cx + sx * (rx * f + fuera), y, cz + sz * (rz * f + fuera)); }
const pesoTronco = (y, ang, sx) => {
  if (y > 1.16) return ['pecho', 1]; if (y > 1.0) { const t = sst(1.0, 1.16, y); return ['pecho', t, 'lomo', 1 - t]; }
  if (y > 0.9) { const t = sst(0.9, 1.0, y); return ['lomo', t, 'cadera', 1 - t]; }
  const k = sst(0.9, 0.62, y) * 0.75 * sst(0.15, 0.7, Math.abs(sx)); return k < 0.01 ? ['cadera', 1] : [sx > 0 ? 'musloI' : 'musloD', k, 'cadera', 1 - k]; };

/* ---------- construcción ---------- */
export function construir(op = {}) {
  const M = { piel: new Malla(), cara: new Malla(), tela: new Malla(), cuero: new Malla(), bronce: new Malla(), hierro: new Malla(), madera: new Malla(), escudo: new Malla(), pluma: new Malla(), sandalia: new Malla() };

  /* piernas (de medio muslo al tobillo) y pies con calzado */
  for (const s of [1, -1]) { const L = s > 0 ? 'I' : 'D', x = 0.095 * s;
    tubo(M.piel, [[0.07, x * 1.05, 0, 0.038, 0.045], [0.16, x * 1.04, -0.002, 0.042, 0.048], [0.33, x * 1.03, -0.02, 0.062, 0.075], [0.45, x * 1.02, -0.002, 0.049, 0.053], [0.5, x * 1.02, 0.008, 0.054, 0.06],
      [0.57, x * 1.01, 0.004, 0.063, 0.068], [0.7, x, 0, 0.081, 0.088]], 12, 0.04, junta('muslo' + L, 'rodilla' + L, 0.5, 0.07), { tu: 2, tv: 6 });
    /* pie: anillos a lo largo de Z, planta plana */
    const pie = curva([[-0.07, 0.03, 0.03], [-0.045, 0.04, 0.05], [0, 0.043, 0.075], [0.05, 0.047, 0.05], [0.11, 0.05, 0.032], [0.16, 0.042, 0.024], [0.185, 0.02, 0.012]]);
    M.sandalia.rejilla(10, 11, (i, j) => { const z = lerp(-0.07, 0.185, i / 9), [rx, ry] = pie(z), ang = j / 10 * TAU, yy = Math.max(0, ry * 0.55 + Math.cos(ang) * ry * 0.62);
      return { p: new V3(x * 1.05 + Math.sin(ang) * rx * (yy <= 0.001 ? 0.92 : 1), yy, z + 0.01), uv: [j / 10, (z + 0.07) * 2.2], w: ['pie' + L, 1] }; }, { cierra: true, inv: true });
    tubo(M.sandalia, [[0.035, x * 1.05, 0.004, 0.04, 0.05], [0.075, x * 1.05, 0, 0.039, 0.046], [0.115, x * 1.045, -0.001, 0.0395, 0.0465], [0.15, x * 1.04, -0.002, 0.0425, 0.0485]], 12, 0.04, y => ['pie' + L, sst(0.13, 0.05, y), 'rodilla' + L, 1 - sst(0.13, 0.05, y)], { tu: 1, tv: 3.2 });
  }
  /* greba de bronce en la pierna izquierda (la adelantada tras el escudo) */
  { const x = 0.095, c = curva([[0.105, x * 1.045, -0.001, 0.045, 0.052], [0.16, x * 1.04, -0.002, 0.046, 0.052], [0.33, x * 1.03, -0.01, 0.06, 0.066], [0.45, x * 1.02, 0, 0.052, 0.057], [0.5, x * 1.02, 0.008, 0.058, 0.064], [0.545, x * 1.015, 0.006, 0.056, 0.058]]);
    M.bronce.rejilla(16, 11, (i, j) => { const y = lerp(0.105, 0.545, i / 15), [cx, cz, rx, rz] = c(y), ang = lerp(-1.75, 1.75, j / 10), borde = 1 + 0.03 * gauss(j - 5, 0.9);
      return { p: new V3(cx + Math.sin(ang) * rx, y, cz + Math.cos(ang) * rz * borde), uv: [j / 10, y * 3], w: junta('musloI', 'rodillaI', 0.56, 0.03)(y) }; });
  }
  /* brazos (bajo la manga) y puños */
  for (const s of [1, -1]) { const L = s > 0 ? 'I' : 'D', bx = y => lerp(0.25, 0.2, sst(0.88, 1.4, y)) * s;
    tubo(M.piel, [[0.9, bx(0.9), 0.008, 0.027, 0.03], [0.97, bx(0.97), 0.006, 0.033, 0.036], [1.07, bx(1.07), 0.002, 0.046, 0.047], [1.13, bx(1.13), 0, 0.037, 0.041], [1.2, bx(1.2), 0.004, 0.045, 0.054], [1.29, bx(1.29), 0.002, 0.049, 0.056], [1.37, bx(1.37), 0, 0.05, 0.056]],
      12, 0.034, junta('brazo' + L, 'codo' + L, 1.13, 0.06), { tu: 2, tv: 6 });
    /* puño: elipsoide con nudillos */
    M.piel.rejilla(7, 11, (i, j) => { const la = lerp(-1.45, 1.45, i / 6), lo = j / 10 * TAU, nud = 1 + 0.07 * gauss(la + 0.5, 0.5) * Math.max(0, Math.cos(lo)) * (0.6 + 0.4 * Math.cos(lo * 8));
      return { p: new V3(0.25 * s + Math.cos(la) * Math.sin(lo) * 0.034 * nud, 0.852 + Math.sin(la) * 0.043, 0.012 + Math.cos(la) * Math.cos(lo) * 0.04 * nud), uv: [j / 10, i / 6 * 0.5], w: ['mano' + L, 1] }; }, { cierra: true });
    M.piel.rejilla(5, 7, (i, j) => { const la = lerp(-1.4, 1.4, i / 4), lo = j / 6 * TAU;   // pulgar
      return { p: new V3(0.25 * s - s * 0.03 + Math.cos(la) * Math.sin(lo) * 0.013, 0.868 + Math.sin(la) * 0.03, 0.04 + Math.cos(la) * Math.cos(lo) * 0.014), uv: [j / 6, i / 4 * 0.3], w: ['mano' + L, 1] }; }, { cierra: true });
    /* manga corta */
    tubo(M.tela, [[1.245, bx(1.245), 0, 0.066, 0.072], [1.3, bx(1.3), 0, 0.064, 0.07], [1.36, bx(1.36) * 0.98, 0, 0.066, 0.07], [1.41, bx(1.41) * 0.9, 0, 0.06, 0.064], [1.44, bx(1.44) * 0.72, 0, 0.045, 0.05]], 16, 0.035,
      y => { const t = sst(1.4, 1.3, y); return ['brazo' + L, 0.35 + 0.65 * t, 'pecho', 0.65 - 0.65 * t]; }, { tu: 3, tv: 10, forma: (a, y) => 1 + 0.03 * Math.sin(a * 7) * sst(1.36, 1.25, y) });
  }
  /* túnica */
  { const fil = 23, seg = 34; M.tela.rejilla(fil, seg + 1, (i, j) => { const y = lerp(0.6, 1.456, Math.pow(i / (fil - 1), 0.92)), ang = j / seg * TAU;
      return { p: tunica(y, ang), uv: [j / seg * 8, y * 9], w: pesoTronco(y, ang, Math.sin(ang)) }; }, { cierra: true });
    M.tela.rejilla(2, seg + 1, (i, j) => { const ang = j / seg * TAU, p = tunica(0.6, ang); if (i) { p.multiplyScalar(0.9); p.y = 0.66; } return { p, uv: [j / seg * 8, 5 + i * 0.3], w: pesoTronco(0.6, ang, Math.sin(ang)) }; }, { cierra: true, inv: true });   // vuelta del bajo
  }
  /* cuello y cabeza */
  tubo(M.piel, [[1.42, 0, -0.008, 0.085, 0.07], [1.455, 0, -0.006, 0.06, 0.06], [1.5, 0, -0.002, 0.052, 0.056], [1.55, 0, 0.002, 0.051, 0.056], [1.6, 0, 0.004, 0.053, 0.058]], 12, 0.036, junta('cabeza', 'cuello', 1.52, 0.04), { tu: 2, tv: 6 });
  const CAB = new V3(0, 1.627, 0.012);
  const cabeza = (a, h) => {   // a: giro desde el frente (0 = cara); h: −1 barbilla … 1 coronilla
    const ca = Math.cos(a), fr = Math.max(0, ca), lat = Math.abs(Math.sin(a));
    let rx = 0.077, rz = ca > 0 ? 0.093 : 0.098; const ry = 0.118, r = h < 0 ? Math.pow(Math.max(0, 1 - Math.pow(-h, 2.7)), 1 / 2.7) : Math.sqrt(Math.max(0, 1 - h * h));
    const quij = sst(-0.1, -0.95, h); rx *= 1 - 0.24 * quij; if (ca < 0) rz *= 1 - 0.25 * quij; let x = Math.sin(a) * rx * r, z = ca * rz * r, y = h * ry;
    if (ca > 0) z *= 1 - 0.22 * quij * (1 - fr * 0.5);
    const A = Math.abs(a);
    z += 0.021 * gauss(a, 0.13) * sst(0.3, 0.02, h) * sst(-0.26, -0.12, h) * (0.55 + 0.45 * sst(0.3, -0.1, h));          // nariz
    z += 0.006 * gauss(a, 0.2) * gauss(h + 0.12, 0.05);                                                                       // aletas
    z += 0.007 * gauss(h - 0.3, 0.07) * sst(0.95, 0.3, A) * fr;                                                              // arco de las cejas
    z -= 0.011 * gauss(A - 0.36, 0.17) * gauss(h - 0.17, 0.07) * fr;                                                         // cuencas
    z += 0.004 * gauss(A - 0.36, 0.1) * gauss(h - 0.165, 0.035) * fr;                                                        // globo del ojo
    z += 0.006 * gauss(A - 0.62, 0.22) * gauss(h + 0.02, 0.13) * fr;                                                         // pómulos
    z += 0.0075 * gauss(a, 0.3) * gauss(h + 0.36, 0.06) + 0.004 * gauss(a, 0.24) * gauss(h + 0.46, 0.04);                    // labios
    z -= 0.004 * gauss(a, 0.3) * gauss(h + 0.41, 0.018);                                                                      // boca
    z += 0.008 * gauss(a, 0.45) * gauss(h + 0.72, 0.16);                                                                      // mentón
    z -= 0.006 * gauss(a, 0.4) * gauss(h + 0.56, 0.05);                                                                       // surco bajo el labio
    x *= 1 + 0.05 * gauss(h + 0.5, 0.2) * lat;                                                                                // ángulo de la mandíbula
    return new V3(CAB.x + x, CAB.y + y, CAB.z + z);
  };
  { const fil = 21, seg = 26; M.cara.rejilla(fil, seg + 1, (i, j) => { const h = Math.sin(lerp(-1.5, 1.5, i / (fil - 1))) / Math.sin(1.5), a = (j / seg - 0.5) * TAU;
      return { p: cabeza(a, h), uv: [j / seg, i / (fil - 1)], w: ['cabeza', 1] }; }, { cierra: true });
  }
  /* casco Montefortino: cuenco, botón, cubrenuca, carrilleras y tres plumas (Polibio 6.23) */
  { const cy = 1.682, perfil = curva([[0, 0.096, 0], [0.12, 0.099, 0.01], [0.3, 0.099, 0.032], [0.5, 0.092, 0.056], [0.7, 0.072, 0.078], [0.85, 0.045, 0.092], [0.94, 0.02, 0.099], [0.97, 0.011, 0.104], [1, 0.0105, 0.112]]);
    M.bronce.rejilla(14, 23, (i, j) => { const t = i / 13, [r, yy] = perfil(t), a = j / 22 * TAU, nuca = 1 + 0.2 * sst(0.1, 0, t) * sst(-0.3, -1, Math.cos(a));
      return { p: new V3(Math.sin(a) * r * 0.92 * (1 + 0.02 * sst(0.06, 0, t)), cy + yy - 0.012 * sst(0.1, 0, t) * sst(-0.3, -1, Math.cos(a)), 0.008 + Math.cos(a) * r * 1.13 * nuca), uv: [j / 22 * 3, t * 2], w: ['cabeza', 1] }; }, { cierra: true });
    M.bronce.rejilla(5, 9, (i, j) => { const la = lerp(-1.3, 1.5, i / 4), lo = j / 8 * TAU; return { p: new V3(Math.cos(la) * Math.sin(lo) * 0.014, cy + 0.12 + Math.sin(la) * 0.012, 0.008 + Math.cos(la) * Math.cos(lo) * 0.014), uv: [j / 8, i / 4 * 0.3], w: ['cabeza', 1] }; }, { cierra: true });
    for (const s of [1, -1]) M.bronce.rejilla(8, 6, (i, j) => { const t = i / 7, u = j / 5, an = 1 - 0.55 * sst(0.35, 1, t), a = lerp(1.3, lerp(1.75, 0.9, u), an) * s, h = lerp(0.47, -0.5 + 0.2 * Math.abs(u - 0.5), t);   // carrilleras
      const p = cabeza(a, h), k = 1.07 + 0.05 * sst(0.3, 0, t); p.x = CAB.x + (p.x - CAB.x) * k; p.z = CAB.z + (p.z - CAB.z) * k; return { p, uv: [u, t], w: ['cabeza', 1] }; }, { inv: s < 0 });
    for (let k = -1; k <= 1; k++) for (const cara of [1]) M.pluma.rejilla(9, 4, (i, j) => { const t = i / 8, an = (0.004 + 0.02 * Math.sin(Math.PI * Math.pow(t, 0.8))) * (j / 3 - 0.5) * 2;
      const dx = k * 0.07 * t + Math.sin(t * 1.4) * k * 0.012, dz = -0.06 * t * t + (k === 0 ? 0.01 * t : 0); return { p: new V3(dx + an * Math.cos(k * 0.5), cy + 0.13 + t * 0.3, 0.008 + dz + an * Math.sin(k * 0.5) + Math.abs(j / 3 - 0.5) * 0.012), uv: [j / 3, t], w: ['cabeza', 1] }; }, { inv: cara < 0 });
  }
  /* cinturón, pectoral cuadrado y sus correas, ceñidos a la túnica */
  { const seg = 36; M.cuero.rejilla(4, seg + 1, (i, j) => { const y = [1.0, 1.006, 1.054, 1.06][i], ang = j / seg * TAU; return { p: tunica(y, ang, i === 0 || i === 3 ? 0.001 : 0.009), uv: [j / seg * 6, i / 3 * 0.25], w: pesoTronco(y, ang, Math.sin(ang)) }; }, { cierra: true });
    M.bronce.rejilla(4, 4, (i, j) => ({ p: tunica(lerp(0.995, 1.065, i / 3), lerp(-0.2, 0.2, j / 3), 0.014), uv: [j / 3, i / 3], w: ['lomo', 0.6, 'cadera', 0.4] }));   // hebilla
    const placa = (m, y0, y1, a0, a1, fuera, fi, co) => m.rejilla(fi, co, (i, j) => { const u = j / (co - 1), v = i / (fi - 1), borde = Math.min(u, 1 - u, v, 1 - v), alza = sst(0, 0.12, borde) * 0.006 + sst(0.3, 0.5, borde) * 0.004;
      return { p: tunica(lerp(y0, y1, v), lerp(a0, a1, u), fuera + alza), uv: [u, v], w: ['pecho', 1] }; });
    placa(M.bronce, 1.17, 1.375, -0.62, 0.62, 0.006, 9, 9);     // pectoral de un palmo (unos 22 cm)
    placa(M.bronce, 1.19, 1.36, Math.PI - 0.5, Math.PI + 0.5, 0.006, 7, 7);   // placa de la espalda
    const correa = (y0, a0, y1, a1, an) => M.cuero.rejilla(8, 3, (i, j) => { const t = i / 7, y = lerp(y0, y1, t) + (j - 1) * an * 0.5 * (Math.abs(y1 - y0) < 0.02 ? 1 : 0), ang = lerp(a0, a1, t) + (j - 1) * an * (Math.abs(y1 - y0) < 0.02 ? 0 : 2.6);
      return { p: tunica(Math.min(1.452, y), ang, j === 1 ? 0.008 : 0.003), uv: [j / 2, t * 3], w: ['pecho', 1] }; });
    for (const s of [1, -1]) { correa(1.28, 0.62 * s, 1.28, (Math.PI - 0.5) * s, 0.03);                                   // por el costado
      correa(1.37, 0.5 * s, 1.43, 1.2 * s, 0.022); correa(1.43, 1.2 * s, 1.355, (Math.PI - 0.42) * s, 0.022); }           // sobre el hombro
  }
  /* espada (gladius hispaniensis) en su vaina, al costado derecho */
  { const O = new V3(-0.205, 0.985, 0.03), inc = 0.2, pt = (x, y, z) => new V3(O.x + x - y * Math.sin(inc) * 0.4, O.y + y * Math.cos(inc), O.z + z + y * Math.sin(inc));
    const caja = (m, y0, y1, ax0, ax1, az0, az1, n = 5) => m.rejilla(n, 9, (i, j) => { const t = i / (n - 1), y = lerp(y0, y1, t), a = j / 8 * TAU, rx = lerp(ax0, ax1, t), rz = lerp(az0, az1, t);
      return { p: pt(Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.5) * rz, y, Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.7) * rx), uv: [j / 8, y * 4], w: ['cadera', 1] }; }, { cierra: true });
    caja(M.madera, -0.6, -0.02, 0.012, 0.032, 0.008, 0.011); caja(M.bronce, -0.62, -0.57, 0.004, 0.02, 0.006, 0.012, 4); caja(M.bronce, -0.06, -0.01, 0.034, 0.035, 0.013, 0.013, 3);
    caja(M.bronce, -0.3, -0.27, 0.027, 0.028, 0.012, 0.012, 3); caja(M.madera, -0.01, 0.02, 0.04, 0.036, 0.017, 0.015, 3); caja(M.cuero, 0.02, 0.105, 0.015, 0.014, 0.013, 0.012, 5);
    M.madera.rejilla(7, 9, (i, j) => { const la = lerp(-1.5, 1.5, i / 6), lo = j / 8 * TAU; return { p: pt(Math.cos(la) * Math.sin(lo) * 0.02, 0.125 + Math.sin(la) * 0.024, Math.cos(la) * Math.cos(lo) * 0.024), uv: [j / 8, i / 6 * 0.3], w: ['cadera', 1] }; }, { cierra: true });
  }
  /* escudo oval curvo (scutum): cara, dorso, canto, espina de madera y umbo de hierro. Su hueso lo coloca la pose. */
  { const R = 0.48, ALTO = 1.18, ANCHO = 0.66, fi = 17, co = 9, G = 0.014;
    const pto = (u, v, fuera) => { const hw = ANCHO / 2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v), 2.6)), 0.5), x = u * hw, ph = x / R; return new V3(Math.sin(ph) * (R + fuera), v * ALTO / 2, Math.cos(ph) * (R + fuera) - R); };
    const vv = i => Math.sin(lerp(-1.5708, 1.5708, i / (fi - 1)));
    M.escudo.rejilla(fi, co, (i, j) => ({ p: pto(j / (co - 1) * 2 - 1, vv(i), G / 2), uv: [j / (co - 1) * 0.5, i / (fi - 1)], w: ['escudo', 1] }));
    M.escudo.rejilla(fi, co, (i, j) => ({ p: pto(j / (co - 1) * 2 - 1, vv(i), -G / 2), uv: [0.5 + j / (co - 1) * 0.5, i / (fi - 1)], w: ['escudo', 1] }), { inv: true });
    for (const s of [1, -1]) M.hierro.rejilla(fi, 3, (i, j) => ({ p: pto(s, vv(i), [G / 2 + 0.002, 0, -G / 2 - 0.002][j]).add(new V3(s * (j === 1 ? 0.004 : 0), 0, 0)), uv: [j / 2, i / (fi - 1) * 6], w: ['escudo', 1] }), { inv: s < 0 });
    for (const s of [1, -1]) M.hierro.rejilla(3, co, (i, j) => { const u = j / (co - 1) * 2 - 1, v = s * lerp(0.9, 1.0, i / 2) ; const b = pto(u * 0.999, v, G / 2 + 0.003); if (i === 2) b.y += s * 0.004; return { p: b, uv: [j / (co - 1) * 3, i / 2 * 0.3], w: ['escudo', 1] }; }, { inv: s < 0 });
    M.madera.rejilla(17, 5, (i, j) => { const v = lerp(-0.94, 0.94, i / 16), a = lerp(-1.5, 1.5, j / 4), panza = gauss(v, 0.2), w = 0.014 + 0.05 * panza, h = 0.012 + 0.045 * panza;   // espina con panza
      const b = pto(Math.sin(a) * w / (ANCHO / 2), v, G / 2); b.z += Math.cos(a) * h * (1 - Math.pow(Math.abs(v) / 0.94, 6)); return { p: b, uv: [j / 4, v * 3], w: ['escudo', 1] }; });
    M.hierro.rejilla(7, 9, (i, j) => { const v = lerp(-0.105, 0.105, i / 6), u = lerp(-0.42, 0.42, j / 8), panza = gauss(v, 0.2) * gauss(u, 0.2); const b = pto(u, v, G / 2 + 0.004); b.z += 0.058 * panza * 0.96; return { p: b, uv: [j / 8, i / 6], w: ['escudo', 1] }; });   // umbo de hierro con alas
    M.madera.rejilla(2, 9, (i, j) => { const a = j / 8 * TAU; return { p: new V3(lerp(-0.07, 0.07, i), Math.sin(a) * 0.014, -0.03 + Math.cos(a) * 0.014 - R + R - 0.012), uv: [i, j / 8], w: ['escudo', 1] }; }, { cierra: true });   // asa horizontal
  }
  /* pilum: asta de madera, bloque y hierro largo con punta */
  { const cil = (m, y0, y1, r0, r1, n = 2) => m.rejilla(n, 9, (i, j) => { const t = i / (n - 1), a = j / 8 * TAU, r = lerp(r0, r1, t); return { p: new V3(Math.sin(a) * r, lerp(y0, y1, t), Math.cos(a) * r), uv: [j / 8, lerp(y0, y1, t) * 3], w: ['pilum', 1] }; }, { cierra: true });
    cil(M.madera, -0.95, 0.42, 0.013, 0.014, 6); cil(M.madera, 0.42, 0.52, 0.02, 0.016); cil(M.hierro, 0.52, 1.02, 0.0065, 0.0045, 3); cil(M.hierro, 1.02, 1.045, 0.011, 0.009); cil(M.hierro, 1.045, 1.1, 0.009, 0.0008); cil(M.hierro, -0.99, -0.95, 0.002, 0.012);
  }
  return M;
}

/* ---------- texturas hechas por código ---------- */
function lienzo(n, pinta) { const c = document.createElement('canvas'); c.width = c.height = n; pinta(c.getContext('2d'), n); return c; }
function tex(c, rep, srgb = true) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep, rep); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function manchas(g, n, veces, a0, a1, tam) { for (let i = 0; i < veces; i++) { const x = Math.random() * n, y = Math.random() * n, r = tam * (0.5 + Math.random()), o = Math.random() < 0.5 ? '0,0,0' : '255,255,255', gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${o},${lerp(a0, a1, Math.random())})`); gr.addColorStop(1, `rgba(${o},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }
function ruido(g, n, veces, a0, a1, tam) { for (let i = 0; i < veces; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${lerp(a0, a1, Math.random())})`; const s = tam * (0.5 + Math.random()); g.fillRect(Math.random() * n, Math.random() * n, s, s); } }
/* De un lienzo de alturas (gris) saca el mapa de relieve. */
function relieve(c, fuerza) { const n = c.width, g = c.getContext('2d'), d = g.getImageData(0, 0, n, n).data, o = document.createElement('canvas'); o.width = o.height = n; const og = o.getContext('2d'), im = og.createImageData(n, n);
  const h = (x, y) => d[(((y + n) % n) * n + ((x + n) % n)) * 4];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dx = (h(x + 1, y) - h(x - 1, y)) / 255 * fuerza, dy = (h(x, y + 1) - h(x, y - 1)) / 255 * fuerza, l = Math.hypot(dx, dy, 1), k = (y * n + x) * 4;
    im.data[k] = (-dx / l * 0.5 + 0.5) * 255; im.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; im.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; im.data[k + 3] = 255; }
  og.putImageData(im, 0, 0); return o; }

function texturas(color) {
  const T = {};
  const tejido = lienzo(256, (g, n) => { g.fillStyle = '#808080'; g.fillRect(0, 0, n, n); for (let i = 0; i < n; i += 4) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(i, 0, 2, n); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, i, n, 2); } ruido(g, n, 5000, 0.02, 0.1, 3); });
  T.telaN = tex(relieve(tejido, 2.2), 0, false);
  T.tela = tex(lienzo(256, (g, n) => { g.fillStyle = color; g.fillRect(0, 0, n, n); manchas(g, n, 120, 0.01, 0.035, 40); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,10,0,0.05)'; g.fillRect(Math.random() * n, 0, 2 + Math.random() * 5, n); } }));
  const martillado = lienzo(256, (g, n) => { g.fillStyle = '#808080'; g.fillRect(0, 0, n, n); for (let i = 0; i < 500; i++) { const x = Math.random() * n, y = Math.random() * n, r = 5 + Math.random() * 11, gr = g.createRadialGradient(x, y, 0, x, y, r); const o = Math.random() < 0.5; gr.addColorStop(0, o ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } ruido(g, n, 1500, 0.02, 0.07, 2); });
  T.metalN = tex(relieve(martillado, 1.3), 0, false);
  T.bronce = tex(lienzo(256, (g, n) => { g.fillStyle = '#bd8f45'; g.fillRect(0, 0, n, n); manchas(g, n, 160, 0.02, 0.06, 30); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(60,35,5,0.05)'; g.beginPath(); g.arc(Math.random() * n, Math.random() * n, 4 + Math.random() * 16, 0, TAU); g.fill(); } }));
  T.hierro = tex(lienzo(128, (g, n) => { g.fillStyle = '#7d8087'; g.fillRect(0, 0, n, n); manchas(g, n, 120, 0.03, 0.1, 16); }));
  const veta = lienzo(256, (g, n) => { g.fillStyle = '#808080'; g.fillRect(0, 0, n, n); for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},0,0)`; g.strokeStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'; g.lineWidth = 1 + Math.random() * 2; const x = Math.random() * n; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, n / 3, x - 6, n * 2 / 3, x + 2, n); g.stroke(); } });
  T.maderaN = tex(relieve(veta, 1.6), 0, false);
  T.madera = tex(lienzo(256, (g, n) => { g.fillStyle = '#6e4b2a'; g.fillRect(0, 0, n, n); for (let i = 0; i < 160; i++) { g.strokeStyle = Math.random() < 0.5 ? 'rgba(30,15,5,0.25)' : 'rgba(190,140,90,0.15)'; g.lineWidth = 1 + Math.random() * 2; const x = Math.random() * n; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, n / 3, x - 6, n * 2 / 3, x + 2, n); g.stroke(); } }));
  const cueroH = lienzo(256, (g, n) => { g.fillStyle = '#808080'; g.fillRect(0, 0, n, n); ruido(g, n, 7000, 0.03, 0.14, 3); });
  T.cueroN = tex(relieve(cueroH, 1.5), 0, false);
  T.cuero = tex(lienzo(128, (g, n) => { g.fillStyle = '#5a3a22'; g.fillRect(0, 0, n, n); manchas(g, n, 120, 0.03, 0.09, 16); }));
  T.sandalia = tex(lienzo(256, (g, n) => { g.fillStyle = '#b5805c'; g.fillRect(0, 0, n, n); g.fillStyle = '#4a2f1b'; for (let i = 0; i < 9; i++) g.fillRect(0, n - 22 - i * 26, n, 9); g.fillRect(n * 0.46, 0, n * 0.08, n); g.fillRect(0, n * 0.02, n, 4);
    g.fillStyle = '#3a2416'; g.fillRect(0, n - 14, n, 14); }));
  T.pielN = tex(relieve(lienzo(128, (g, n) => { g.fillStyle = '#808080'; g.fillRect(0, 0, n, n); ruido(g, n, 4000, 0.02, 0.07, 2); }), 0.6), 0, false);
  T.piel = tex(lienzo(128, (g, n) => { const gr = g.createLinearGradient(0, 0, n, 0); for (let k = 0; k <= 8; k++) gr.addColorStop(k / 8, k % 2 ? '#bb8560' : '#9c6a4a'); g.fillStyle = gr; g.fillRect(0, 0, n, n); manchas(g, n, 60, 0.01, 0.04, 22); }));
  /* cara: u = giro (0,5 = frente), v = altura (0 barbilla, 1 coronilla). h = sin(lerp(-1.5,1.5,v)) / sin(1.5) */
  T.cara = tex(lienzo(1024, (g, n) => {
    const U = a => (a / TAU + 0.5) * n, Vh = h => (1 - (Math.asin(clamp(h * Math.sin(1.5), -1, 1)) / 3 + 0.5)) * n;
    g.fillStyle = '#b98560'; g.fillRect(0, 0, n, n);
    const mancha = (a, h, ra, rh, col) => { const x = U(a), y = Vh(h), rx = ra / TAU * n, ry = Math.abs(Vh(h - rh) - y); g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); };
    mancha(0, -0.1, 1.5, 0.5, 'rgba(214,160,125,0.5)');                                   // luz del centro de la cara
    for (const s of [1, -1]) { mancha(0.62 * s, -0.02, 0.4, 0.2, 'rgba(190,105,80,0.28)'); mancha(0.36 * s, 0.17, 0.26, 0.09, 'rgba(90,50,35,0.4)'); }   // mejillas y ojeras
    { const gs = g.createLinearGradient(0, Vh(0.55), 0, Vh(0.25)); gs.addColorStop(0, 'rgba(40,20,10,0.55)'); gs.addColorStop(1, 'rgba(40,20,10,0)'); g.fillStyle = gs; g.fillRect(0, Vh(0.55), n, Vh(0.25) - Vh(0.55)); }
    mancha(0, -0.62, 1.1, 0.34, 'rgba(60,42,38,0.45)'); mancha(0, -0.36, 0.5, 0.1, 'rgba(70,50,45,0.2)');   // sombra de barba
    mancha(0, -0.21, 0.16, 0.03, 'rgba(80,40,30,0.25)');                                    // bajo la nariz
    for (const s of [1, -1]) { const x = U(0.36 * s), y = Vh(0.17), w = 0.15 / TAU * n, hh = Math.abs(Vh(0.2) - Vh(0.14)) * 0.55;
      g.fillStyle = '#e9e2d6'; g.beginPath(); g.ellipse(x, y, w, hh, 0, 0, TAU); g.fill();
      g.fillStyle = '#4a321e'; g.beginPath(); g.arc(x - s * w * 0.08, y, hh * 0.95, 0, TAU); g.fill(); g.fillStyle = '#120c08'; g.beginPath(); g.arc(x - s * w * 0.08, y, hh * 0.45, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x - s * w * 0.08 - hh * 0.5, y - hh * 0.5, hh * 0.3, hh * 0.3);
      g.strokeStyle = '#2a1a12'; g.lineWidth = n / 300; g.beginPath(); g.ellipse(x, y, w, hh, 0, Math.PI, TAU); g.stroke();                         // párpado de arriba
      g.strokeStyle = 'rgba(90,50,40,0.6)'; g.lineWidth = n / 500; g.beginPath(); g.ellipse(x, y, w, hh, 0, 0, Math.PI); g.stroke();
      g.strokeStyle = '#2b1c14'; g.lineWidth = n / 110; g.lineCap = 'round'; g.beginPath(); g.moveTo(U(0.16 * s), Vh(0.27)); g.quadraticCurveTo(U(0.36 * s), Vh(0.335), U(0.6 * s), Vh(0.285)); g.stroke(); }   // cejas
    g.strokeStyle = 'rgba(105,45,40,0.85)'; g.lineWidth = n / 220; g.beginPath(); g.moveTo(U(-0.27), Vh(-0.405)); g.quadraticCurveTo(U(0), Vh(-0.425), U(0.27), Vh(-0.405)); g.stroke();   // boca
    mancha(0, -0.37, 0.24, 0.035, 'rgba(160,80,70,0.45)'); mancha(0, -0.455, 0.2, 0.035, 'rgba(165,85,72,0.4)');
    for (const s of [1, -1]) mancha(0.085 * s, -0.15, 0.04, 0.014, 'rgba(40,20,15,0.5)');   // orificios de la nariz
    g.fillStyle = '#241812'; g.fillRect(0, 0, n, Vh(0.62)); g.fillRect(0, 0, U(-1.75), Vh(-0.25)); g.fillRect(U(1.75), 0, n - U(1.75), Vh(-0.25));   // pelo corto
    for (const s of [1, -1]) { g.beginPath(); g.moveTo(U(1.75 * s), Vh(0.62)); g.lineTo(U(1.2 * s), Vh(0.62)); g.lineTo(U(1.45 * s), Vh(0.0)); g.lineTo(U(1.75 * s), Vh(-0.25)); g.fill(); }   // patillas
  }));
  T.cara.wrapS = T.cara.wrapT = THREE.ClampToEdgeWrapping;
  /* escudo: mitad izquierda la cara pintada, mitad derecha el dorso de tablas */
  T.escudo = tex(lienzo(512, (g, n) => { g.fillStyle = color; g.fillRect(0, 0, n / 2, n); manchas(g, n, 500, 0.02, 0.07, 34); g.strokeStyle = 'rgba(40,10,5,0.35)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(n / 2 * (i + 0.5) / 5 + 6, 0); g.lineTo(n / 2 * (i + 0.5) / 5 - 6, n); g.stroke(); }
    g.fillStyle = '#6e5334'; g.fillRect(n / 2, 0, n / 2, n); for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(30,15,5,0.5)'; g.fillRect(n / 2 + i * n / 18, 0, 2, n); } for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(20,10,0,0.08)'; g.fillRect(n / 2 + Math.random() * n / 2, Math.random() * n, 2, 30 + Math.random() * 60); }
    for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(30,10,5,0.25)'; g.lineWidth = 1; g.beginPath(); const x = Math.random() * n / 2, y = Math.random() * n; g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 50); g.stroke(); } }));
  T.escudo.wrapS = T.escudo.wrapT = THREE.ClampToEdgeWrapping;
  return T;
}

/* Lo que comparten todos los soldados del mismo color: geometría, texturas y materiales. */
const CACHE = {};
function hacerComun(color) { const M = construir(), T = texturas(color), geos = {}; for (const k in M) if (M[k].ix.length) geos[k] = { g: M[k].geometria(), tris: M[k].tris };
  const S = (o) => new THREE.MeshStandardMaterial(o), rep = (t, n) => { const c = t.clone(); c.repeat.set(n, n); c.needsUpdate = true; return c; };
  const mats = {
    piel: S({ map: T.piel, normalMap: T.pielN, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.62, side: THREE.DoubleSide }),
    cara: S({ map: T.cara, roughness: 0.6 }),
    tela: S({ map: T.tela, normalMap: T.telaN, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.92, side: THREE.DoubleSide }),
    cuero: S({ map: T.cuero, normalMap: T.cueroN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.6, side: THREE.DoubleSide }),
    bronce: S({ map: T.bronce, normalMap: T.metalN, normalScale: new THREE.Vector2(0.35, 0.35), metalness: 0.9, roughness: 0.34, side: THREE.DoubleSide }),
    hierro: S({ map: T.hierro, normalMap: T.metalN, normalScale: new THREE.Vector2(0.3, 0.3), metalness: 0.85, roughness: 0.45, side: THREE.DoubleSide }),
    madera: S({ map: T.madera, normalMap: T.maderaN, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.7 }),
    escudo: S({ map: T.escudo, normalMap: rep(T.cueroN, 3), normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.85 }),
    sandalia: S({ map: T.sandalia, roughness: 0.75, side: THREE.DoubleSide }),
    pluma: S({ color: '#1c1320', roughness: 0.75, side: THREE.DoubleSide }),
  };
  return { geos, mats }; }

/* ---------- el soldado: mallas con huesos y una pose con movimiento ---------- */
export function crearSoldado(op = {}) {
  const color = op.color || '#9c2f25', comun = (CACHE[color] ||= hacerComun(color)), geos = comun.geos, mats = comun.mats;
  const bones = HUESOS.map(h => { const b = new THREE.Bone(); b.name = h[0]; return b; });
  HUESOS.forEach((h, i) => { const b = bones[i], p = h[1] ? HUESOS[IDX[h[1]]] : null; b.position.set(h[2] - (p ? p[2] : 0), h[3] - (p ? p[3] : 0), h[4] - (p ? p[4] : 0)); if (p) bones[IDX[h[1]]].add(b); });
  const inv = HUESOS.map(h => new THREE.Matrix4().makeTranslation(-h[2], -h[3], -h[4]));
  const esq = new THREE.Skeleton(bones, inv), grupo = new THREE.Group(); grupo.add(bones[0]);
  let tris = 0; const mallas = [];
  for (const k in geos) { if ((op.sin || []).includes(k)) continue; const m = new THREE.SkinnedMesh(geos[k].g, mats[k]); m.bind(esq, new THREE.Matrix4()); m.frustumCulled = false; grupo.add(m); mallas.push(m); tris += geos[k].tris; }
  const B = {}; bones.forEach(b => B[b.name] = b);
  const reposo = {}; bones.forEach(b => reposo[b.name] = b.position.clone());
  const q = new THREE.Quaternion(), qp = new THREE.Quaternion(), e = new THREE.Euler(), v = new V3(), m4 = new THREE.Matrix4();
  /* Pone un hueso (hijo de «pecho») en un sitio y giro del mundo del soldado. */
  function fijar(b, pos, rx, ry, rz) { b.parent.updateWorldMatrix(true, false); m4.copy(b.parent.matrixWorld).invert(); const gi = new THREE.Matrix4().copy(grupo.matrixWorld);
    v.copy(pos).applyMatrix4(gi).applyMatrix4(m4); b.position.copy(v).add(new V3(0, 0, 0)); b.parent.getWorldQuaternion(qp); grupo.getWorldQuaternion(q); q.multiply(new THREE.Quaternion().setFromEuler(e.set(rx, ry, rz, 'YXZ'))); b.quaternion.copy(qp.invert().multiply(q)); }
  const P = new V3();
  function pose(t, modo) {
    for (const b of bones) { b.rotation.set(0, 0, 0); b.position.copy(reposo[b.name]); }
    const anda = modo === 'andar', golpe = modo === 'golpe', w = t * (anda ? 6.6 : 1.5), s = Math.sin(w), c = Math.cos(w);
    const g = golpe ? (t % 1.6) / 1.6 : 0, atras = golpe ? sst(0, 0.35, g) * (1 - sst(0.42, 0.55, g)) : 0, lanza = golpe ? sst(0.42, 0.56, g) * (1 - sst(0.75, 1, g)) : 0;
    /* tronco y cabeza */
    B.cadera.position.y += anda ? Math.abs(c) * 0.018 - 0.012 : Math.sin(t * 1.5) * 0.002 - 0.008 - lanza * 0.03;
    B.cadera.rotation.y = -0.28 + (anda ? s * 0.07 : 0) - atras * 0.35 + lanza * 0.45; B.cadera.rotation.x = anda ? 0.05 : 0.02 + lanza * 0.12;
    B.lomo.rotation.y = (anda ? -s * 0.1 : 0) - atras * 0.25 + lanza * 0.3; B.pecho.rotation.x = Math.sin(t * 1.5) * 0.012 + lanza * 0.08; B.pecho.rotation.y = -0.06;
    B.cabeza.rotation.y = 0.24 + (anda || golpe ? 0 : Math.sin(t * 0.45) * 0.22); B.cabeza.rotation.x = 0.03 + (anda ? 0 : Math.sin(t * 0.3 + 1) * 0.04);
    /* piernas: la izquierda adelantada, tras el escudo */
    const zan = anda ? 0.4 : 0;
    B.musloI.rotation.x = anda ? -s * zan - 0.08 : -0.2 - lanza * 0.25; B.rodillaI.rotation.x = anda ? Math.max(0, c) * 0.5 + 0.08 : 0.24 + lanza * 0.3; B.pieI.rotation.x = anda ? -0.05 : -0.05 - lanza * 0.05;
    B.musloD.rotation.x = anda ? s * zan - 0.08 : 0.16 + lanza * 0.2; B.rodillaD.rotation.x = anda ? Math.max(0, -c) * 0.5 + 0.08 : 0.1; B.pieD.rotation.x = anda ? -0.05 : -0.2 - lanza * 0.2;
    B.musloI.rotation.z = 0.04; B.musloD.rotation.z = -0.05; B.musloD.rotation.y = 0.02; B.musloI.rotation.y = 0.24;
    /* brazo del escudo: codo doblado, puño en el asa */
    B.brazoI.rotation.set(-0.12 - (anda ? s * 0.04 : 0), 0, 0.2); B.codoI.rotation.set(-0.5, 0, -0.1);
    /* brazo del pilum */
    if (golpe) { B.brazoD.rotation.set(lerp(-0.35, 0.9, atras) - lanza * 2.3, 0, -0.45 - atras * 0.5); B.codoD.rotation.set(lerp(-1.25, -2.1, atras) + lanza * 1.5, 0, 0); }
    else { B.brazoD.rotation.set(0.12 + (anda ? s * 0.06 : 0), 0, -0.16); B.codoD.rotation.set(-1.05, 0, 0.12); }
    grupo.updateMatrixWorld(true);
    /* escudo: el asa en el puño izquierdo, de frente, algo ladeado */
    const gi = new THREE.Matrix4().copy(grupo.matrixWorld).invert();
    B.manoI.getWorldPosition(P).applyMatrix4(gi); P.y -= 0.035; P.z += 0.035; P.y -= 0.02; fijar(B.escudo, P.clone().add(new V3(0.02, -0.05, 0.03)), 0.04 + (anda ? s * 0.015 : 0), 0.3, 0.02);
    /* pilum: en el puño derecho; en reposo, vertical con el regatón casi en el suelo */
    B.manoD.getWorldPosition(P).applyMatrix4(gi); P.y -= 0.03;
    if (golpe) fijar(B.pilum, P, 1.35 + atras * 0.1 - lanza * 0.15, B.cadera.rotation.y * 0.5, 0); else fijar(B.pilum, P, 0.06 + (anda ? 0.25 : 0), 0, 0.03);
    return grupo;
  }
  pose(0, 'quieto');
  return { grupo, pose, tris, mallas, huesos: bones.length, materiales: Object.keys(mats).length };
}
