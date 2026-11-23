/* AQVILA — FA7: el dibujo de los rivales de la falange a pie (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Solo dibuja: lee S (js/falange.js y js/falange-rivales.js) y no lo escribe. Lo propio del dibujo va en un Map aparte.

   CONTRATO DE ENCHUFE (fijo; FA4 lo usa desde escena.js)
     montaRivalDe(nombre, ctx)   'caballeria' → caballeria.js · 'elefantes' → elefante.js · 'falange' | 'hoplitas' → este archivo · otro → null
     montaRival(ctx)             mira ctx.estado().rival
     ctx = { escena, estado: () => S, H: (x, z) => altura (opcional), color (opcional) }
     devuelve { paso(dt), aviso(tipo, datos), quita(), peso() → { llamadas, triangulos, figuras }, desfase() → metros }
   Nunca lanza: si el arte no carga, devuelve funciones vacías y avisa por consola.

   COMÚN (lo usan caballeria.js y elefante.js)
     crearTropa(clave, cap, { escena, color })  una malla instanciada animada: pon(i, x, y, z, yaw, fotograma, { pitch, roll, esc }), oculta(i), fin()
     crearSombras(escena, cap)                  un disco oscuro por figura, en una sola llamada (sombra de contacto, sin sombras proyectadas)
     sigue(d, h, dt, vTope, gTope, opc)         la figura dibujada d va hacia el hombre h con velocidad y giro tope (quien dibuja suaviza)
     clipMarcha(C, v, vTope, t, fase)           quieto, andar o correr según la velocidad dibujada
   pitch > 0 inclina hacia delante; pitch < 0, hacia atrás (encabritarse). roll > 0 inclina a la derecha de la figura. */
import { THREE } from '../../../js/gfx/models.js';
import { preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE } from '../../../js/gfx/units.js';

export const V_PIE = 6, V_JINETE = 14, V_ELEFANTE = 11;   /* la carga de la lógica va a 9,9 m/s: el dibujo no debe quedarse atrás */
export const G_RAPIDO = 240 * Math.PI / 180, G_ELEFANTE = 120 * Math.PI / 180;
export const SARISA = 6.3;
const PULSO = 1.6;

export const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
export const lim = (x, a, b) => Math.max(a, Math.min(b, x));
/* dado propio del dibujo (no toca el de la partida) */
export function dado(s) { let a = s | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- carga del arte ---------- */
export async function cargaArte(claves) {
  try { await preload(claves); } catch (e) { console.warn('FA7: no se pudo cargar el arte', e); return false; }
  const faltan = claves.filter(k => !getUnit(k)); if (faltan.length) { console.warn('FA7: falta el arte de ' + faltan.join(', ')); return false; }
  return true;
}
export const vacio = () => ({ paso() {}, aviso() {}, quita() {}, peso: () => ({ llamadas: 0, triangulos: 0, figuras: 0 }), desfase: () => 0 });

/* ---------- una tropa: malla instanciada con su fotograma por figura ---------- */
const O = new THREE.Object3D(), CERO = new THREE.Matrix4().makeScale(0, 0, 0);
export function crearTropa(clave, cap, { escena, color = '#a0302a' }) {
  const unit = getUnit(clave); if (!unit) return null;
  const geo = instancedGeometry(unit, cap), fr = geo.attributes.aFrame;
  const m = new THREE.InstancedMesh(geo, unitMaterialReal(unit, color), cap); m.frustumCulled = false; m.count = cap;
  for (let i = 0; i < cap; i++) m.setMatrixAt(i, CERO);
  escena.add(m);
  const vis = new Uint8Array(cap);
  return {
    unit, C: unit.clips, malla: m, cap,
    pon(i, x, y, z, yaw, fotograma, o = {}) {
      const e = UNIT_SCALE * (o.esc || 1);
      O.position.set(x, y, z); O.rotation.set(o.pitch || 0, yaw, -(o.roll || 0), 'YXZ'); O.scale.set(e, e, e); O.updateMatrix();
      m.setMatrixAt(i, O.matrix); fr.array[i] = fotograma; vis[i] = 1;
    },
    oculta(i) { m.setMatrixAt(i, CERO); vis[i] = 0; },
    fin() { m.instanceMatrix.needsUpdate = true; fr.needsUpdate = true; },
    figuras() { let n = 0; for (let i = 0; i < cap; i++) n += vis[i]; return n; },
    triangulos() { return unit.tris * cap; },     /* la GPU dibuja todas las instancias (las ocultas, a escala cero) */
    quita() { escena.remove(m); geo.dispose(); },
  };
}

/* ---------- sombras de contacto: un disco oscuro por figura ---------- */
export function crearSombras(escena, cap) {
  const geo = new THREE.CircleGeometry(0.5, 14).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: '#1c140c', transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const m = new THREE.InstancedMesh(geo, mat, cap); m.frustumCulled = false; m.renderOrder = 1;
  for (let i = 0; i < cap; i++) m.setMatrixAt(i, CERO);
  escena.add(m);
  return {
    malla: m,
    pon(i, x, y, z, yaw, ancho, largo) { O.position.set(x, y + 0.03, z); O.rotation.set(0, yaw, 0); O.scale.set(ancho, 1, largo); O.updateMatrix(); m.setMatrixAt(i, O.matrix); },
    oculta(i) { m.setMatrixAt(i, CERO); },
    fin() { m.instanceMatrix.needsUpdate = true; },
    triangulos: () => 14 * cap,
    quita() { escena.remove(m); geo.dispose(); mat.dispose(); },
  };
}

/* ---------- sarisas: una caja fina de 6,3 m por hombre, en una llamada (el eje va de z = 0 a z = 6,3) ---------- */
export function crearSarisas(escena, cap, color = '#7a6646') {
  const geo = new THREE.BoxGeometry(0.04, 0.04, SARISA).translate(0, 0, SARISA / 2), mat = new THREE.MeshLambertMaterial({ color });
  const m = new THREE.InstancedMesh(geo, mat, cap); m.frustumCulled = false;
  for (let i = 0; i < cap; i++) m.setMatrixAt(i, CERO);
  escena.add(m);
  return {
    malla: m,
    /* desde (x, y, z) hacia el rumbo yaw, alzada elev radianes sobre la horizontal */
    pon(i, x, y, z, yaw, elev) { O.position.set(x, y, z); O.rotation.set(-elev, yaw, 0, 'YXZ'); O.scale.set(1, 1, 1); O.updateMatrix(); m.setMatrixAt(i, O.matrix); },
    oculta(i) { m.setMatrixAt(i, CERO); },
    fin() { m.instanceMatrix.needsUpdate = true; },
    triangulos: () => 12 * cap,
    quita() { escena.remove(m); geo.dispose(); mat.dispose(); },
  };
}

/* ---------- la figura dibujada sigue al hombre de la lógica ----------
   opc.rumbo: mira hacia donde va si se mueve a más de opc.umbral m/s. opc.yaw: rumbo forzado. opc.salto: metros a partir de los que salta (reinicio) */
export function figura(az) { return { x: 0, z: 0, yaw: 0, v: 0, w: 0, ini: false, fase: az() * 10, esc: 0.96 + az() * 0.08, t0: 0, est: null, tMuere: -1, roll: 0 }; }
export function sigue(d, h, dt, vTope, gTope, opc = {}) {
  if (!d.ini || dt <= 0) { if (!d.ini) { d.x = h.x; d.z = h.z; d.yaw = h.yaw; d.ini = true; } d.v = 0; d.w = 0; return; }
  const dx = h.x - d.x, dz = h.z - d.z, dist = Math.hypot(dx, dz);
  if (dist > (opc.salto || 80)) { d.x = h.x; d.z = h.z; d.yaw = h.yaw; d.v = 0; d.w = 0; return; }
  const mv = Math.min(dist, vTope * dt);
  if (dist > 1e-6) { d.x += dx / dist * mv; d.z += dz / dist * mv; }
  d.v = mv / dt;
  const obj = opc.yaw !== undefined ? opc.yaw : (opc.rumbo && d.v > (opc.umbral || 1) ? Math.atan2(dx, dz) : h.yaw);
  const g = lim(angDif(obj, d.yaw), -gTope * dt, gTope * dt); d.yaw = angDif(d.yaw + g, 0); d.w = g / dt;
}
export function clipMarcha(C, v, vTope, t) { return v < 0.3 ? frameOf(C.idle, t) : v < vTope / 2 ? frameOf(C.walk || C.idle, t) : frameOf(C.run || C.walk, t); }
export const unaVez = frameOnce;
export { frameOf };
/* marca el instante en que cae (con el reloj del dibujo) y da el fotograma de la muerte */
export function muerte(d, C, T) { if (d.tMuere < 0) d.tMuere = T; return frameOnce(C.death, T - d.tMuere); }

/* ================= falange rival y muro hoplita ================= */
const COLOR_RIVAL = { falange: '#c9a227', hoplitas: '#7a2a8c' };
export async function montaRival(ctx) {
  const S = ctx.estado && ctx.estado(); return montaRivalDe(S && S.rival, ctx);
}
export async function montaRivalDe(nombre, ctx) {
  try {
    if (nombre === 'caballeria') return await (await import('./caballeria.js')).montaRival(ctx);
    if (nombre === 'elefantes') return await (await import('./elefante.js')).montaRival(ctx);
    if (nombre === 'falange' || nombre === 'hoplitas') return await montaEmpuje(nombre, ctx);
  } catch (e) { console.warn('FA7: no se pudo montar el rival ' + nombre, e); return vacio(); }
  return null;
}

async function montaEmpuje(nombre, ctx) {
  const clave = nombre === 'falange' ? 'falange' : 'hoplitas';
  if (!(await cargaArte([clave]))) return vacio();
  const H = ctx.H || (() => 0), cap = 96, az = dado(nombre === 'falange' ? 71 : 73);
  const tropa = crearTropa(clave, cap, { escena: ctx.escena, color: ctx.color || COLOR_RIVAL[nombre] });
  const sombras = crearSombras(ctx.escena, cap), sar = nombre === 'falange' ? crearSarisas(ctx.escena, cap) : null;
  const C = tropa.C, D = new Map();
  let T = 0, Sv = null, tEmpuje = -9, incl = 0, avance = 0, linea0 = null, desp = 0, medio0 = null;
  const fig = h => { let d = D.get(h); if (!d) { d = figura(az); d.alza = (70 + az() * 15) * Math.PI / 180; d.abre = (az() - 0.5) * 0.12; D.set(h, d); } return d; };
  function empuja() { if (T - tEmpuje < 0.3) return; tEmpuje = T; }
  return {
    paso(dt) {
      const S = ctx.estado(); if (!S || !S.ene) return;
      if (S !== Sv) { Sv = S; D.clear(); T = 0; tEmpuje = -9; incl = 0; avance = 0; linea0 = null; desp = 0; medio0 = null; }
      T += dt;
      const riv = S.riv || {}, fase = riv.fase, g = S.giro || 0, fx = Math.sin(g), fz = -Math.cos(g);   /* frente de mi muro: el rival retrocede por ahí */
      const ola = fase === 'oleada' || fase === 'prepara', gast = fase === 'gastado' || riv.roto;
      incl += ((ola ? 0.12 : 0) - incl) * Math.min(1, dt * 3); avance += ((ola ? -0.5 : 0) - avance) * Math.min(1, dt * 2);
      /* si la línea cambia y los hombres no se han movido, el bloque se desplaza esos metros */
      let sx = 0, sz = 0, n = 0; for (const h of S.ene) if (h.vivo) { sx += h.x; sz += h.z; n++; }
      const medio = n ? [sx / n, sz / n] : null, linea = typeof riv.linea === 'number' ? riv.linea : 0;
      if (linea0 === null) linea0 = linea;
      if (medio && medio0 && Math.hypot(medio[0] - medio0[0], medio[1] - medio0[1]) > 0.01) desp = 0; else desp += linea - linea0;
      linea0 = linea; medio0 = medio;
      const off = desp + avance;
      for (let i = 0; i < S.ene.length && i < cap; i++) {
        const h = S.ene[i], d = fig(h);
        const obj = { x: h.x + fx * off, z: h.z + fz * off, yaw: h.yaw };
        if (h.vivo) sigue(d, obj, dt, V_PIE, G_RAPIDO, { rumbo: h.est === 'huye', umbral: 1.5 });
        const y = H(d.x, d.z); let fr, pitch = 0;
        if (!h.vivo) fr = muerte(d, C, T);
        else if (h.est === 'huye') fr = clipMarcha(C, d.v, V_PIE, T + d.fase);
        else {
          const ta = T - tEmpuje - (h.r || 0) * 0.08;
          if (!gast && ta >= 0 && ta < C.attack_melee.dur) fr = frameOnce(C.attack_melee, ta);
          else fr = d.v > 0.3 ? clipMarcha(C, d.v, V_PIE, T + d.fase) : frameOf(C.idle, T + d.fase);
          pitch = incl;
        }
        tropa.pon(i, d.x, y, d.z, d.yaw, fr, { pitch, esc: d.esc });
        sombras.pon(i, d.x, y, d.z, d.yaw, h.vivo ? 0.9 : 1.1, h.vivo ? 0.9 : 1.9);
        if (sar) {
          if (!h.vivo || h.est === 'huye') sar.oculta(i);
          else {
            const r = h.r || 0, baja = r < 5, sx2 = Math.sin(d.yaw), sz2 = Math.cos(d.yaw);
            /* bajadas: agarradas a 1,7 m de la contera y escalonadas (cada fila un poco más alta); alzadas: abanico de 70–85° */
            if (baja) sar.pon(i, d.x - sx2 * 1.7 + Math.cos(d.yaw) * 0.18, y + 1.05 + r * 0.06, d.z - sz2 * 1.7 - Math.sin(d.yaw) * 0.18, d.yaw, -0.03 + r * 0.035 - incl * 0.3);
            else sar.pon(i, d.x + Math.cos(d.yaw) * 0.2, y + 0.3, d.z - Math.sin(d.yaw) * 0.2, d.yaw + d.abre, d.alza - incl);
          }
        }
      }
      for (let i = S.ene.length; i < cap; i++) { tropa.oculta(i); sombras.oculta(i); if (sar) sar.oculta(i); }
      tropa.fin(); sombras.fin(); if (sar) sar.fin();
    },
    aviso(tipo) { if (tipo === 'ha' || tipo === 'pulso') empuja(); },
    quita() { tropa.quita(); sombras.quita(); if (sar) sar.quita(); D.clear(); },
    peso() { return { llamadas: sar ? 3 : 2, triangulos: tropa.triangulos() + sombras.triangulos() + (sar ? sar.triangulos() : 0), figuras: tropa.figuras() }; },
    desfase() {
      const S = ctx.estado(); let m = 0; if (!S || !S.ene) return 0;
      for (const h of S.ene) { const d = D.get(h); if (d && h.vivo && h.est !== 'huye') m = Math.max(m, Math.hypot(d.x - h.x, d.z - h.z)); }
      return m;
    },
  };
}
export { PULSO };
