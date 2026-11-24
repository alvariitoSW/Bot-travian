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
import { SARISA, AGARRE, CARRIL, BAJAN, alzada, bajada, abanicoObj } from '../../falange/formacion.js';

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
const PIEZAS_SARISA = (() => {
  const MAD = ['#5a4430', '#51402c', '#614b35', '#574330', '#4b3a28', '#5e4833'], pz = [[0.005, 0.023, 0, 0.3, '#2a2928'], [0.034, 0.034, 0.3, 0.38, '#6e5430']];   /* FU3b: fresno oscuro; regatón de hierro oscuro */
  for (let i = 0; i < 12; i++) { const z0 = 0.38 + i * 5.57 / 12, r = 0.031 - 0.005 * i / 12; pz.push([r, r - 0.0004, z0, z0 + 5.57 / 12, MAD[(i * 5) % 6]]); }
  pz.push([0.035, 0.035, 3.06, 3.2, '#6e5430'], [0.021, 0.015, 5.95, 6.03, '#2c2b2a'], [0.015, 0.052, 6.03, 6.15, '#4a4b4e'], [0.052, 0.002, 6.15, SARISA, '#5c5d61']);
  return pz;
})();
const PIEZAS_MUNON = (() => {
  const pz = [[0.005, 0.023, 0, 0.3, '#2a2928'], [0.034, 0.034, 0.3, 0.38, '#6e5430']];
  for (let i = 0; i < 5; i++) { const z0 = 0.38 + i * 2.2 / 5; pz.push([0.031, 0.0306, z0, z0 + 2.2 / 5, ['#5a4430', '#51402c', '#614b35'][i % 3]]); }
  pz.push([0.031, 0.008, 2.58, 2.86, '#d8ccb0']);
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

export function crear() {
  let ctx = null, sar = null, mun = null, pil = null, V = null, rotas = new WeakMap(), tB = -9, bajadasAntes = false;
  const forma = { bajadas: false };   /* FU3b: lo pone la escena cada fotograma (falangita.js estado().bajadas): las sarisas de la 1.ª fila bajan de golpe y estocan. Solo dibujo */
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
          DA: new T.Vector3(), DB: new T.Vector3(), Mn: new T.Vector3(), E: new T.Vector3(1, 1, 1), Z1: new T.Vector3(0, 0, 1), Y: new T.Vector3(0, 1, 0), M0: new T.Matrix4().makeScale(0, 0, 0), G: new T.Vector3(), Pg: new T.Vector3() };
      }
      rotas = new WeakMap(); tB = -9; bajadasAntes = false;
      sar = new T.InstancedMesh(V.gs, V.mat, n); mun = new T.InstancedMesh(V.gm, V.mat, n); pil = new T.InstancedMesh(V.gp, V.mat, NPILA);
      for (const m of [sar, mun, pil]) { m.frustumCulled = false; m.count = m === pil ? NPILA : n; c.escena.add(m); }
    },
    paso() {
      if (!ctx || !sar) return;
      const F = ctx.S.fal, H = ctx.H, figs = new Map(), Tm = ctx.S.T;
      for (const f of ctx.TR.figs) if (f.h) figs.set(f.h, f);
      if (forma.bajadas && !bajadasAntes) tB = Tm; bajadasAntes = forma.bajadas;
      const uB = (Tm - tB) / T_BAJADAS, estoca = uB >= 0 && uB < 1 ? Math.sin(Math.PI * uB) : 0;
      let ns = 0, nm = 0; const yo = ctx.ocultaYo ? ctx.ocultaYo() : null, FI = ctx.FI;   /* FU4 */
      if (forma.mide) forma.picas = [];
      for (const h of F.fal) {
        const f = figs.get(h); if (!f || !h.vivo || h === yo) continue;   /* FU4: en la vista del oficial su propia sarisa (o muñón) no tapa la cámara */
        const primera = h.r === 0, kB = h.huye ? 0 : suave(primera && forma.bajadas ? 1 : (h.kB || 0)), al = alzada(h.f, h.r, h.kA ?? abanicoObj(h.r, 0)), pb = bajada(h.r), giro = f.yaw - Math.PI;
        V.DA.set(Math.sin(al.lado), Math.cos(al.delante), -Math.sin(al.delante)).normalize(); V.DB.set(0, Math.sin(pb), -Math.cos(pb));
        V.D.copy(V.DA).lerp(V.DB, kB).normalize().applyAxisAngle(V.Y, giro);
        /* la mano: junto al cuerpo con la pica alzada; en el carril de su fila con la pica bajada (marco del hombre: derecha +x, frente −z) */
        const cr = CARRIL(h.r), s = h.r < BAJAN ? kB : 0, t = f.talla || 1;
        V.Mn.set(0.2 + (cr.x - 0.2) * s, (1.05 + (cr.y - 1.05) * s) * t, -0.15 - 0.05 * s).applyAxisAngle(V.Y, giro);
        V.P.set(f.x + V.Mn.x, H(f.x, f.z) + V.Mn.y, f.z + V.Mn.z).addScaledVector(V.D, -AGARRE + (primera ? 0.6 * estoca : 0));
        if (h.picaRota) {
          /* FU3b: el muñón se suelta y cae junto al hombre, inclinado, apoyado en el suelo (0,45 s) */
          let r = rotas.get(h); if (!r) { r = { t0: Tm, P: V.P.clone(), D: V.D.clone() }; rotas.set(h, r); }
          const k = Math.min(1, Math.max(0, (Tm - r.t0) / 0.45)), g = k * k, a = giro + (hashH(h) - 0.5) * 1.6 + 1.2, lado = 0.55 + 0.25 * hashH(h);
          V.Pg.set(f.x + Math.cos(giro) * lado, 0, f.z + Math.sin(giro) * lado); V.Pg.y = H(V.Pg.x, V.Pg.z) + 0.05;
          V.G.set(Math.sin(a), 0.1, -Math.cos(a)).normalize();
          V.P.copy(r.P).lerp(V.Pg, g); V.D.copy(r.D).lerp(V.G, g).normalize();
        }
        if (!h.picaRota && FI) { const r = FI.pica(h, V.P, V.D, SARISA); if (r && r.ret) V.P.addScaledVector(V.D, -r.ret); }   /* FU4: la punta se para en el cuerpo o el escudo que toca (js/fisica-batalla.js) */
        if (forma.mide && !h.picaRota && kB > 0.5) forma.picas.push({ h, P: V.P.toArray(), D: V.D.toArray(), L: SARISA });
        V.Q.setFromUnitVectors(V.Z1, V.D); V.M.compose(V.P, V.Q, V.E);
        if (h.picaRota) mun.setMatrixAt(nm++, V.M); else sar.setMatrixAt(ns++, V.M);
      }
      /* FU3b: los brazos siguen a la pica (la figura no tiene hueso accesible desde aquí): con la sarisa bajada, la guardia con el arma al frente; con la 1.ª fila
         estocando (bajadas), el golpe; alzada, en reposo. Marchando se deja su andar */
      for (const [h, f] of figs) {
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
        V.Q.setFromUnitVectors(V.Z1, V.D); V.M.compose(V.P, V.Q, V.E); pil.setMatrixAt(np++, V.M);
      }
      pil.count = np; pil.visible = np > 0; pil.instanceMatrix.needsUpdate = true;
    },
    alAviso() {}
  };
}
