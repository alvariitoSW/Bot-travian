/* FU5 · El muro de escudos (plan: gobierno/estudios/FU0-plan-motor-batalla.md §FU5). Solo dibujo: las reglas son de js/bloque-ia.js
   (S.tuyo.forma === 'muro') y la guardia de la física, de bloque/fisica.js (1.ª fila en guardia 'muro').

   EL MURO: un InstancedMesh (UNA llamada de dibujo) de scuta VERTICALES, uno delante de cada hombre de la 1.ª fila de tu manípulo
   (f.b === S.tuyo && f.h.fila === 0), en la caja donde la física hace chocar lo que viene: 0,32 m delante (ESCUDO.delante) y 0,10 m
   de lado (ESCUDO.izq), a la altura del centro del escudo subido (ESCUDO.y0..y1 + MURO.sube). Se dibuja 1,5 cm más adelante que la
   caja para que se vea sobre ella. Cada pieza mide 0,90 × 1,15 × 0,05 m: más ancha que el hueco de 0,78 m del muro (dx de FORMAS), así
   que SE SOLAPAN y no deja rendijas; las columnas impares van 1,5 cm más adelante para que no parpadeen donde se tocan.
   Se cierra en 0,4 s (los escudos suben desde el suelo) y se abre igual. Textura: el scutum de formaciones/testudo.js.
   Historia: el manípulo cerraba escudos contra la carga y los vélites peleaban sueltos (Polibio 6.21–23; Livio 8.8). Que sea una
   forma que eliges con un toque, y todas las medidas: licencia de juego.
   Contrato: crearMuro() → { monta(ctx), paso(dt), visible(), cerrado(), sitios() } con ctx = { THREE, escena, H, C, S, TR, Son }. */
import { ESCUDO } from '../../../../js/fisica-batalla.js';
import { MURO } from '../fisica.js';
import { texturaScutum } from './testudo.js';

export const PIEZA = { ancho: 0.9, alto: 1.15, grueso: 0.05, sobra: 0.015, impar: 0.015, t: 0.4, max: 40 };
const suave = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export function crearMuro() {
  let ctx = null, malla = null, k = 0, n = 0;
  return {
    monta(c) {
      ctx = c; k = 0; n = 0; const T = c.THREE;
      if (!malla) {
        const geo = new T.BoxGeometry(PIEZA.ancho, PIEZA.alto, PIEZA.grueso);
        malla = new T.InstancedMesh(geo, new T.MeshLambertMaterial({ map: texturaScutum(T) }), PIEZA.max);
        malla.frustumCulled = false; malla.count = 0; malla.visible = false; malla.renderOrder = 2; c.escena.add(malla);
      }
      malla.count = 0; malla.visible = false;
    },
    paso(dt) {
      if (!ctx || !malla) return; const { S, TR, H, THREE } = ctx, tu = S.tuyo;
      const activo = tu.forma === 'muro' && !tu.U.roto && tu.estado !== 'huye' && tu.orden !== 'testudo';
      k = Math.min(1, Math.max(0, k + (activo ? dt : -dt) / PIEZA.t));
      if (k <= 0) { malla.visible = false; malla.count = 0; n = 0; return; }
      const e = suave(k), p = ctx.P3 || (ctx.P3 = new THREE.Vector3()), q = ctx.QM || (ctx.QM = new THREE.Quaternion()), s = ctx.E3 || (ctx.E3 = new THREE.Vector3(1, 1, 1)),
        m4 = ctx.M4 || (ctx.M4 = new THREE.Matrix4()), eje = ctx.Y || (ctx.Y = new THREE.Vector3(0, 1, 0));
      const yFinal = (ESCUDO.y0 + ESCUDO.y1) / 2 + MURO.sube, ad = ESCUDO.delante + PIEZA.sobra;
      let i = 0;
      for (const f of TR.figs) {
        if (f.b !== tu || !f.h || f.h.fila !== 0 || f.h.yo || i >= PIEZA.max) continue;   /* el que eres tú (FU2) no se tapa la vista con su propio escudo */
        const sn = Math.sin(f.yaw), cs = Math.cos(f.yaw), mas = (f.h.col & 1) * PIEZA.impar, d = ad + mas;
        const x = f.x + sn * d + cs * ESCUDO.izq, z = f.z + cs * d - sn * ESCUDO.izq;
        /* sube desde el suelo: el centro pasa de media pieza sobre el suelo a su altura final */
        const y = H(f.x, f.z) + PIEZA.alto / 2 + (yFinal - PIEZA.alto / 2) * e;
        p.set(x, y, z); q.setFromAxisAngle(eje, f.yaw); m4.compose(p, q, s); malla.setMatrixAt(i++, m4);
      }
      malla.count = i; malla.visible = i > 0; malla.instanceMatrix.needsUpdate = true; n = i;
    },
    visible: () => !!malla && malla.visible, cerrado: () => k >= 1, sitios: () => n
  };
}
