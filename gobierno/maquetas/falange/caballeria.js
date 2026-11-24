/* AQVILA — FA7: el dibujo del ala de jinetes contra la falange (equites de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Estados de js/falange-rivales.js: forma, rodea, frena, dentro, vuelve, huye (y muertos).
   · rodea: galope en arco; el caballo se inclina hacia dentro del giro (roll por la velocidad angular, tope 0,2 rad).
   · frena: se planta y se encabrita ante las puntas (pitch atrás hasta 0,5 rad, sube y baja en 1 s; clip quieto).
   · dentro: ataca en bucle metido en el muro. · vuelve y huye: galope alejándose (si la lógica no los mueve, 10 m/s desde el pivote).
   · caídos: la muerte una vez y el cuerpo se queda donde cayó. Contrato de enchufe: rival.js. */
import { cargaArte, vacio, crearTropa, crearSombras, figura, sigue, clipMarcha, muerte, dado, lim, angDif, V_JINETE, G_RAPIDO } from './rival.js';
import { frameOf } from '../../../js/gfx/units.js';

export async function montaRival(ctx) {
  try {
    if (!(await cargaArte(['equites']))) return vacio();
    const H = ctx.H || (() => 0), cap = 16, az = dado(29);
    const tropa = crearTropa('equites', cap, { escena: ctx.escena, color: ctx.color || '#b02a22' }), sombras = crearSombras(ctx.escena, cap);
    const C = tropa.C, D = new Map();
    let T = 0, Sv = null;
    const fig = h => { let d = D.get(h); if (!d) { d = figura(az); d.lx = 0; d.lz = 0; d.propio = false; D.set(h, d); } return d; };
    return {
      paso(dt) {
        const S = ctx.estado(); if (!S || !S.ene) return;
        if (S !== Sv) { Sv = S; D.clear(); T = 0; }
        T += dt;
        const cx = S.xF || 0, cz = S.zF || 0;
        for (let i = 0; i < S.ene.length && i < cap; i++) {
          const h = S.ene[i], d = fig(h);
          if (d.est !== h.est) { d.est = h.est; d.t0 = T; }
          if (h.vivo) {
            /* en huida, si la lógica no los mueve, se alejan del pivote a 10 m/s */
            const quieto = Math.hypot(h.x - d.lx, h.z - d.lz) < 1e-4;
            if (h.est === 'huye' && quieto && d.ini) {
              d.propio = true; const v = 10, gir = lim(angDif(Math.atan2(d.x - cx, d.z - cz), d.yaw), -G_RAPIDO * dt, G_RAPIDO * dt);
              d.yaw += gir; d.w = dt > 0 ? gir / dt : 0; d.x += Math.sin(d.yaw) * v * dt; d.z += Math.cos(d.yaw) * v * dt; d.v = v;
            } else { d.propio = false; sigue(d, h, dt, V_JINETE, G_RAPIDO, { rumbo: h.est !== 'frena' && h.est !== 'dentro', umbral: 2 }); }
          }
          d.lx = h.x; d.lz = h.z;
          const y = H(d.x, d.z); let fr, pitch = 0, alto = 0;
          if (!h.vivo) { fr = muerte(d, C, T); d.roll *= 0.8; }
          else if (h.est === 'frena') {
            const u = (T - d.t0) / 1.0; if (u < 1) pitch = -0.5 * Math.sin(Math.PI * u); alto = 1.0 * Math.sin(-pitch);   /* gira sobre las patas traseras (≈1 m detrás del centro) */
            fr = frameOf(C.idle, T + d.fase);
          } else if (h.est === 'dentro') fr = frameOf(C.attack_melee, T + d.fase);
          else fr = clipMarcha(C, d.v, V_JINETE, T + d.fase);
          /* inclinación hacia dentro del giro: girar a la izquierda (w > 0) inclina a la izquierda (roll < 0) */
          const rollObj = h.vivo ? lim(-d.w * Math.min(1, d.v / 8) * 0.3, -0.2, 0.2) : 0;
          d.roll += (rollObj - d.roll) * Math.min(1, dt * 6);
          tropa.pon(i, d.x, y + alto, d.z, d.yaw, fr, { pitch, roll: d.roll, esc: d.esc });
          sombras.pon(i, d.x, y, d.z, d.yaw, h.vivo ? 1.1 : 1.6, h.vivo ? 2.6 : 2.6);
        }
        for (let i = S.ene.length; i < cap; i++) { tropa.oculta(i); sombras.oculta(i); }
        tropa.fin(); sombras.fin();
      },
      aviso() {},
      quita() { tropa.quita(); sombras.quita(); D.clear(); },
      peso() { return { llamadas: 2, triangulos: tropa.triangulos() + sombras.triangulos(), figuras: tropa.figuras() }; },
      desfase() {
        const S = ctx.estado(); let m = 0; if (!S || !S.ene) return 0;
        for (const h of S.ene) { const d = D.get(h); if (d && h.vivo && !d.propio) m = Math.max(m, Math.hypot(d.x - h.x - (h.fx || 0), d.z - h.z - (h.fz || 0))); }
        return m;
      },
    };
  } catch (e) { console.warn('FA7: no se pudo montar la caballería', e); return vacio(); }
}
