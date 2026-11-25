/* FU1 · Formación «testudo» del motor único de batalla a pie (plan: gobierno/estudios/FU0-plan-motor-batalla.md §3 y §4 FU1).
   Escenario «cruzar bajo las salvas» (js/bloque-ia.js, m.escenario = 'testudo'): cruzas el campo hasta una colina, los tiradores
   galos lanzan dos salvas, tocas «Testudo» y se cierra el TECHO DE ESCUDOS; después los galos cargan y se lucha hasta el 15 %.
   Los mismos cuatro botones y el mismo control del manípulo (dibujar el frente con el dedo); solo cambian el objetivo, la guardia
   de la física (primera fila en muro, las demás con el escudo arriba: fisica.js) y esto de aquí: el techo.

   EL TECHO: un InstancedMesh (UNA llamada de dibujo) de escudos rectangulares (scutum rojo) tumbados sobre la cabeza de cada hombre
   de la 2.ª fila en adelante, en la caja donde la física hace chocar las jabalinas (ESCUDO_ALTO: y = 1,85 m, 0,4 m delante del hombre),
   así las jabalinas se clavan en lo que se ve. Cada pieza mide 0,95 × 1,3 m (la caja de la física, 0,65 × 1,1, más lo que se solapa
   con la vecina: los huecos son de 0,9–1,0 m de lado y 1,2 de fondo) y las de las filas impares van 1,2 cm más altas, para que se vean
   solapadas y no parpadeen. MEDIDA ANTES DE DIBUJAR: el hastatus de Meshy mide 1,751 m de coronilla (assets/soldados/hastatus.json,
   punto más alto de su malla) y su talla va de 0,95 a 1,05: 1,84 m como mucho; el techo (centro a 1,88 m, 1,5 cm sobre la caja de la física para que se vean las jabalinas clavadas) queda a 1,855 m por debajo. Se cierra
   en 0,6 s subiendo desde los hombros (1,15 m) y se abre igual. Sonido: al cerrarlo, lo de fuera se oye apagado (Son.bajoTecho).
   La colina: un aro dorado en el suelo (una llamada más). Licencia de juego: el techo (histórico: Polibio 28.11, Livio 44.9, testudo en asaltos). */
import { ESCUDO_ALTO, guardiaDeSerie } from '../fisica.js';

export const TECHO = { ancho: 0.95, largo: 1.3, grueso: 0.05, delante: ESCUDO_ALTO.delante, alto: ESCUDO_ALTO.y + 0.03, sube: 1.15, t: 0.6, impar: 0.012, max: 160 };
const suave = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/* el scutum visto desde arriba: rojo con borde oscuro, lomo y un umbo de bronce; el largo va en la v (de adelante a atrás) */
export function texturaScutum(THREE) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 176; const g = c.getContext('2d');
  g.fillStyle = '#9c2a1e'; g.fillRect(0, 0, 128, 176);
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 176);
  g.strokeStyle = '#4a1510'; g.lineWidth = 9; g.strokeRect(4, 4, 120, 168);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.strokeRect(12, 12, 104, 152);
  g.fillStyle = '#6a1a12'; g.fillRect(58, 14, 12, 148);
  g.fillStyle = '#b8862b'; g.beginPath(); g.arc(64, 88, 19, 0, 7); g.fill(); g.fillStyle = '#e9c063'; g.beginPath(); g.arc(64, 88, 11, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function crear() {
  let ctx = null, techo = null, aro = null, k = 0, cerrado = false, nSitios = 0;
  const bajo = v => { try { ctx && ctx.Son && ctx.Son.bajoTecho && ctx.Son.bajoTecho(v); } catch (e) { /* sin sonido */ } };
  return {
    id: 'testudo', ordenes: ['testudo', 'avanzar', 'cargar', 'alto', 'relevo', 'retirada'], objetivo: 'Cruza hasta la colina', escenario: 'testudo', muroDelante: true,
    util: () => (ctx && ctx.C ? ctx.C.ordenUtil() : null),
    mods: () => null,
    guardia: guardiaDeSerie,   /* 1.ª fila 'muro', las demás 'alto' (ESCUDO_ALTO): donde se dibuja el techo */
    /* una partida nueva: el techo y el aro se crean una vez y se reaprovechan */
    monta(c) {
      ctx = c; const T = c.THREE; k = 0; cerrado = false; bajo(0);
      if (!techo) {
        const geo = new T.BoxGeometry(TECHO.ancho, TECHO.grueso, TECHO.largo);
        techo = new T.InstancedMesh(geo, new T.MeshLambertMaterial({ map: texturaScutum(T) }), TECHO.max);
        techo.frustumCulled = false; techo.count = 0; techo.visible = false; techo.renderOrder = 2; c.escena.add(techo);
        const ring = new T.RingGeometry(0.82, 1, 48); ring.rotateX(-Math.PI / 2);
        aro = new T.Mesh(ring, new T.MeshBasicMaterial({ color: 0xe9c063, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); aro.renderOrder = 3; c.escena.add(aro);
      }
      const m = c.S.escenario && c.S.escenario.meta;
      if (m) { aro.visible = true; aro.scale.set(m.r, 1, m.r); aro.position.set(m.x, c.H(m.x, m.z) + 0.12, m.z); } else aro.visible = false;
      c.texto && this.objetivo && c.texto(this.objetivo);
    },
    paso(dt) {
      if (!ctx || !techo) return; const { S, TR, H, THREE } = ctx, tu = S.tuyo;
      aro.visible = !!S.escenario && S.escenario.fase === 'cruza';   /* en la lucha ya no hace falta: una llamada de dibujo menos */
      const activo = tu.orden === 'testudo' && !tu.U.roto && tu.estado !== 'huye';
      k = Math.min(1, Math.max(0, k + (activo ? dt : -dt) / TECHO.t));
      if (activo !== cerrado) { cerrado = activo; bajo(activo ? 1 : 0); }
      if (k <= 0) { techo.visible = false; techo.count = 0; return; }
      const e = suave(k), y0 = TECHO.sube + (TECHO.alto - TECHO.sube) * e, p = ctx.P3 || (ctx.P3 = new THREE.Vector3()), q = ctx.QT || (ctx.QT = new THREE.Quaternion()),
        s = ctx.E3 || (ctx.E3 = new THREE.Vector3(1, 1, 1)), m4 = ctx.M4 || (ctx.M4 = new THREE.Matrix4()), eje = ctx.Y || (ctx.Y = new THREE.Vector3(0, 1, 0));
      let n = 0;
      for (const f of TR.figs) {
        if (f.b !== tu || !f.h || f.h.fila < 1 || n >= TECHO.max) continue;   /* la 1.ª fila lleva el escudo de frente (muro) */
        const sn = Math.sin(f.yaw), cs = Math.cos(f.yaw), x = f.x + sn * TECHO.delante, z = f.z + cs * TECHO.delante;
        p.set(x, H(f.x, f.z) + y0 + (f.h.fila & 1) * TECHO.impar, z); q.setFromAxisAngle(eje, f.yaw); m4.compose(p, q, s); techo.setMatrixAt(n++, m4);
      }
      techo.count = n; techo.visible = n > 0; techo.instanceMatrix.needsUpdate = true; nSitios = n;
    },
    alAviso(tipo, d) {
      if (!ctx) return;
      if (tipo === 'escenario' && d.fase === 'carga' && ctx.texto) ctx.texto('Aguanta la carga y rompe su centro');
    },
    sitios: () => nSitios, cerrado: () => k >= 1
  };
}
