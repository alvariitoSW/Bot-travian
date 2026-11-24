/* AQVILA — FA7: el dibujo de los elefantes y su escolta contra la falange (elefantes y peltastas de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Elefantes (tipo 'elefante'): lista → quieto. Aviso 'barrito' → trompa arriba (attack_melee2) una vez y luego carga a la carrera.
     FE1: lucha → empuja contra las picas y pisa (attack_melee en bucle), cabeceando. ensartada → clavada en las puntas: se alza de dolor
     (pitch atrás) y barrita, sin avanzar; al morir cae despacio (la muerte a 0,45 de velocidad); FE2: hinca la cabeza y se va de costado. desbocada → se alza, gira despacio
     (120°/s) y se va contra los suyos. muerta → muerte una vez y se queda delante del muro. fuera → no se dibuja.
     Trozos de pica (S.riv.trozos, FE1): la punta rota clavada en la bestia (sigue a su figura) o tirada en el suelo.
   Escolta (tipo 'infante', peltastas): tira → quieta; con el aviso 'salva', lanza una vez (attack_ranged) cuando la salva sale.
     cuela → corre al hueco a 6 m/s y ataca (los peltastas solo tienen el gesto de lanzar: lo usan en bucle). pisado → muerte.
   La lógica coloca a saltos (la escolta de 46 m a 0,8 m; la desbocada cambia de rumbo de golpe): aquí se suaviza. Contrato: rival.js. */
import { THREE } from '../../../js/gfx/models.js';
import { cargaArte, vacio, crearTropa, crearTropaNueva, crearSombras, figura, sigue, clipMarcha, muerte, dado, V_PIE, V_ELEFANTE, G_RAPIDO, G_ELEFANTE } from './rival.js';
import { frameOf, frameOnce } from '../../../js/gfx/units.js';

const CAP_E = 5, CAP_P = 16, ALZA = 1.2;   /* segundos que dura el alzarse */
const CAP_T = 48;                           /* FE1: trozos de pica que se dibujan */
/* FE1: la punta rota de una sarisa: hoja de hierro (z 0–0,27), manguito, 1,6 m de asta (más clara y algo más gruesa que la sarisa,
   para que se lea a 390 px) y la astilla. Una llamada para todos.
   pon(i, x, y, z, yaw, elev): la hoja en (x, y, z) y el asta saliendo hacia el rumbo yaw, alzada elev radianes */
function crearTrozos(escena, cap) {
  const piezas = [[0.002, 0.05, 0, 0.27, '#d0cdc6'], [0.05, 0.016, 0.27, 0.38, '#b9b5ad'], [0.021, 0.021, 0.38, 0.46, '#3d3b39'], [0.034, 0.034, 0.46, 2.05, '#cdbf9c'], [0.034, 0.008, 2.05, 2.3, '#efe4c8']];
  const pos = [], col = [], c = new THREE.Color();
  for (const [r0, r1, z0, z1, hex] of piezas) {
    const g = new THREE.CylinderGeometry(r1, r0, z1 - z0, 6, 1, false).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(0, 0, (z0 + z1) / 2);
    const p = g.attributes.position.array; c.set(hex); for (let k = 0; k < p.length; k += 3) { pos.push(p[k], p[k + 1], p[k + 2]); col.push(c.r, c.g, c.b); } g.dispose();
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), m = new THREE.InstancedMesh(geo, mat, cap), O = new THREE.Object3D(), CERO = new THREE.Matrix4().makeScale(0, 0, 0);
  m.frustumCulled = false; for (let i = 0; i < cap; i++) m.setMatrixAt(i, CERO); escena.add(m);
  return {
    pon(i, x, y, z, yaw, elev) { O.position.set(x, y, z); O.rotation.set(-elev, yaw, 0, 'YXZ'); O.scale.set(1, 1, 1); O.updateMatrix(); m.setMatrixAt(i, O.matrix); },
    oculta(i) { m.setMatrixAt(i, CERO); }, fin() { m.instanceMatrix.needsUpdate = true; },
    triangulos: () => (pos.length / 9) * cap, quita() { escena.remove(m); geo.dispose(); mat.dispose(); },
  };
}
export async function montaRival(ctx) {
  try {
    /* FE2: la escolta es el peltasta nuevo (assets/soldados/, nivel _muylejos: siempre a más de 8 m de la cámara); si no carga, el de 0 A.D. */
    const nueva = await crearTropaNueva('peltasta', CAP_P, { escena: ctx.escena, nivel: 2 });
    if (!(await cargaArte(nueva ? ['elefantes'] : ['elefantes', 'peltastas']))) { if (nueva) nueva.quita(); return vacio(); }
    const H = ctx.H || (() => 0), az = dado(37);
    const ele = crearTropa('elefantes', CAP_E, { escena: ctx.escena, color: ctx.color || '#8a5a1e' });
    /* FE2: a contraluz (el sol de la escena les da por detrás) salían negros: un poco de su propio color como luz propia */
    if (ele && ele.malla.material.emissive) { const m = ele.malla.material; m.emissive.setScalar(0.32); m.emissiveMap = m.map; m.needsUpdate = true; }
    const pel = nueva || crearTropa('peltastas', CAP_P, { escena: ctx.escena, color: ctx.color || '#8a5a1e' });
    const sombras = crearSombras(ctx.escena, CAP_E + CAP_P), CE = ele.C, CP = pel.C, D = new Map(), trozos = crearTrozos(ctx.escena, CAP_T);
    let T = 0, Sv = null, tBarrito = -99, tSalva = -99;
    const fig = h => { let d = D.get(h); if (!d) { d = figura(az); d.retraso = az() * 0.35; D.set(h, d); } return d; };
    return {
      paso(dt) {
        const S = ctx.estado(); if (!S || !S.ene) return;
        if (S !== Sv) { Sv = S; D.clear(); T = 0; tBarrito = tSalva = -99; }
        T += dt;
        const g = S.giro || 0;
        let ie = 0, ip = 0;
        for (const h of S.ene) {
          const d = fig(h);
          if (d.est !== h.est) { d.est = h.est; d.t0 = T; d.yaw0 = d.yaw; }
          if (h.tipo === 'elefante') {
            if (ie >= CAP_E) continue; const i = ie++;
            if (h.fuera) { ele.oculta(i); sombras.oculta(i); continue; }
            const alzado = h.est === 'desbocada' && T - d.t0 < ALZA * 0.6;   /* se alza y luego gira */
            const clavada = h.est === 'ensartada' || (!h.vivo && d.est === 'ensartada');
            if (h.vivo) sigue(d, h, dt, V_ELEFANTE, G_ELEFANTE, { rumbo: h.est === 'carga' || h.est === 'desbocada' || h.est === 'huye', umbral: 1.5, yaw: alzado ? d.yaw0 : h.est === 'lucha' || clavada ? -g : undefined });
            const y = H(d.x, d.z); let fr, pitch = 0;
            let roll = 0;
            if (!h.vivo) {
              if (d.tMuere < 0) d.tMuere = T; const vel = clavada ? 0.45 : 1; fr = frameOnce(CE.death, (T - d.tMuere) * vel);   /* FE1: la ensartada cae despacio */
              /* FE2: la ensartada se vence: hinca la cabeza al doblar las manos y se va de costado (cada una hacia un lado) */
              if (clavada) { const k = Math.min(1, (T - d.tMuere) * vel / CE.death.dur), lado = h.i % 2 ? 1 : -1; pitch = 0.14 * Math.sin(Math.PI * Math.min(1, k * 1.5)); roll = lado * 0.5 * k * k * (3 - 2 * k); }
            }
            else if (clavada) {
              /* FE1: clavada en las puntas: se alza de dolor una vez, barrita y se queda, cabeceando */
              const u = (T - d.t0) / (ALZA * 1.4); pitch = u < 1 ? -0.35 * Math.sin(Math.PI * u) : -0.06 - 0.04 * Math.sin(T * 2.1 + d.fase);
              fr = u < 1 ? frameOf(CE.attack_melee2, T - d.t0) : frameOf(CE.idle, (T + d.fase) * 0.5);
            } else if (h.est === 'lucha') { pitch = 0.05 * Math.sin(T * 3.3 + d.fase); fr = frameOf(CE.attack_melee, T + d.fase); }   /* FE1: empuja y pisa */
            else if (h.est === 'carga' && T - tBarrito < CE.attack_melee2.dur) fr = frameOnce(CE.attack_melee2, T - tBarrito);
            else if (h.est === 'desbocada') {
              const u = (T - d.t0) / ALZA; if (u < 1) pitch = -0.45 * Math.sin(Math.PI * u);
              fr = frameOf(CE.run, T + d.fase);
            } else if (h.est === 'carga') fr = frameOf(CE.run, T + d.fase);
            else fr = clipMarcha(CE, d.v, V_ELEFANTE, T + d.fase);
            ele.pon(i, d.x, y + (h.vivo ? Math.sin(-pitch) * 1.9 : 0), d.z, d.yaw, fr, { pitch, roll, esc: d.esc });
            sombras.pon(i, d.x, y, d.z, d.yaw, h.vivo ? 2.2 : 3.2, h.vivo ? 4.2 : 4.6);
          } else {
            if (ip >= CAP_P) continue; const i = ip++;
            if (h.vivo) sigue(d, h, dt, V_PIE, G_RAPIDO, { rumbo: true, umbral: 1.5 });
            const y = H(d.x, d.z); let fr;
            const ts = T - tSalva - d.retraso;
            if (pel.nuevo) {   /* FE2: el peltasta nuevo, por clips con nombre */
              let c = 'quieto', t = T + d.fase;
              if (!h.vivo) { if (d.tMuere < 0) d.tMuere = T; c = 'morir'; t = T - d.tMuere; }
              else if (h.est === 'cuela' && d.v < 0.5) { c = 'golpear'; t = (T + d.fase) % (pel.dur('golpear') + 0.4); }
              else if (d.v >= 0.3) c = d.v < V_PIE / 2 ? 'andar' : 'correr';
              else if (ts >= 0 && ts < pel.dur('lanzar')) { c = 'lanzar'; t = ts; }
              pel.pon(i, d.x, y, d.z, d.yaw, c, t, { esc: d.esc });
              sombras.pon(CAP_E + i, d.x, y, d.z, d.yaw, h.vivo ? 0.8 : 1, h.vivo ? 0.8 : 1.8);
              continue;
            }
            if (!h.vivo) fr = muerte(d, CP, T);
            else if (h.est === 'cuela' && d.v < 0.5) fr = frameOf(CP.attack_ranged, T + d.fase);
            else if (d.v >= 0.3) fr = clipMarcha(CP, d.v, V_PIE, T + d.fase);
            else if (ts >= 0 && ts < CP.attack_ranged.dur) fr = frameOnce(CP.attack_ranged, ts);
            else fr = frameOf(CP.idle, T + d.fase);
            pel.pon(i, d.x, y, d.z, d.yaw, fr, { esc: d.esc });
            sombras.pon(CAP_E + i, d.x, y, d.z, d.yaw, h.vivo ? 0.8 : 1, h.vivo ? 0.8 : 1.8);
          }
        }
        for (let i = ie; i < CAP_E; i++) { ele.oculta(i); sombras.oculta(i); }
        /* FE1: los trozos de pica: clavados en su bestia (siguen a su figura) o en el suelo */
        const tz = (S.riv && S.riv.trozos) || [];
        for (let j = 0; j < CAP_T; j++) {
          const t = tz[j]; if (!t) { trozos.oculta(j); continue; }
          const b = t.bestia >= 0 ? S.ene.find(e => e.tipo === 'elefante' && e.i === t.bestia) : null, d = b && D.get(b);
          if (d && d.ini && !(b.fuera)) {
            /* en el pecho o la paletilla, hacia tu muro; si la bestia cae, baja con ella */
            const cae = d.tMuere >= 0 ? Math.min(1, (T - d.tMuere) * 0.45 / Math.max(0.1, CE.death.dur)) : 0;
            const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw), rx = Math.cos(d.yaw), rz = -Math.sin(d.yaw), del = 1.7 + 0.3 * (t.k || 0) / 4;
            const x = d.x + fx * del + rx * t.lado, z = d.z + fz * del + rz * t.lado, yy = H(x, z) + t.alto * (1 - 0.65 * cae);
            trozos.pon(j, x, yy, z, d.yaw + (t.yaw - Math.PI) * 0.5, 0.15 + 0.5 * (t.alto - 1.2) / 1.1 - 0.5 * cae);   /* el asta sale hacia arriba: se lee contra la piel oscura */
          } else trozos.pon(j, t.x, H(t.x, t.z) + 0.04, t.z, t.yaw, -0.02);
        }
        trozos.fin();
        for (let i = ip; i < CAP_P; i++) { pel.oculta(i); sombras.oculta(CAP_E + i); }
        ele.fin(); pel.fin(); sombras.fin();
      },
      aviso(tipo, datos = {}) {
        if (tipo === 'barrito') tBarrito = T;
        else if (tipo === 'salva') tSalva = T + Math.max(0, (datos.t || 0) - 1.2);   /* lanzan cuando la salva sale, no al aviso */
      },
      quita() { ele.quita(); pel.quita(); sombras.quita(); trozos.quita(); D.clear(); },
      peso() { return { llamadas: 4, triangulos: ele.triangulos() + pel.triangulos() + sombras.triangulos() + trozos.triangulos(), figuras: ele.figuras() + pel.figuras() }; },
      desfase() {
        const S = ctx.estado(); let m = 0; if (!S || !S.ene) return 0;
        for (const h of S.ene) { const d = D.get(h); if (d && h.vivo && !h.fuera && !(h.est === 'cuela' && d.v > 0.3)) m = Math.max(m, Math.hypot(d.x - h.x - (h.fx || 0), d.z - h.z - (h.fz || 0))); }   /* la escolta que corre al hueco no cuenta: la lógica la pone allí de un salto */
        return m;
      },
    };
  } catch (e) { console.warn('FA7: no se pudo montar a los elefantes', e); return vacio(); }
}
