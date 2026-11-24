/* ES2 · Formación «combinada» (?formacion=combinada): tu falange al centro y dos manípulos a sus lados (hueco de 8 m) contra los galos de hoy.
   Estudio: gobierno/estudios/ES1-escaramuza-combinada.md §2, §3 y §5. La falange es un bloque tipo 'falange' de js/bloque.js (no la simulación
   pica a pica de js/falange.js). El mando (js/mando-varios.js) reparte órdenes y frente al cuerpo elegido; la tira (tira-mando.js) lo enseña.
   Mismo contrato que las demás formaciones (ver manipulo.js) y tres ganchos más que la escena usa solo si existen:
     opcCombate(BL)   opciones extra de crearCombate: la falange como tu bloque
     camaras          { v, h }: la cámara más abierta, para ver los tres cuerpos
     pausada()        true: la escena no avanza el mundo (pausa con órdenes)
     despues(dt)      tras pintar el HUD de siempre: la tira y los botones del elegido */
import { guardiaDeSerie } from '../fisica.js';
import { crearMando } from '../mando.js';
import { crearTira } from '../tira-mando.js';

export const HOMBRES_FALANGE = 128;
export function crear() {
  let ctx = null, M = null, tira = null, aros = [], tAro = 0;
  const camaras = { v: { d: 110, alto: 88, ad: 30, fov: 56 }, h: { d: 52, alto: 34, ad: 22, fov: 44 } };
  function monta(c) {
    ctx = c; const { THREE } = c;
    if (tira) tira.quita();
    M = crearMando(c.C, { MO: c.BL, avisa: t => { try { c.hud && c.hud.grito(t); } catch (e) { /* sin aviso */ } } });
    /* el aro dorado: un anillo plano por cuerpo (el mismo dibujo, 1 llamada cada uno; «Todos» enseña los tres) */
    if (!aros.length) {
      const geo = new THREE.RingGeometry(0.93, 1, 48), mat = new THREE.MeshBasicMaterial({ color: 0xe9c063, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false });
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 18; m.frustumCulled = false; m.visible = false; c.escena.add(m); aros.push(m); }
    }
    tira = crearTira({ mando: M, hud: c.hud, $: c.$, dedos: c.dedos });
    c.texto && c.texto('Rompe su centro con la falange y los dos manípulos');
    window.__bloque && (window.__bloque.mando = M);
  }
  return {
    id: 'combinada', ordenes: ['avanzar', 'alto', 'cargar', 'retirada'], hud: { retirada: false }, objetivo: 'Rompe su centro con la falange y los dos manípulos', escenario: null, muroDelante: false, camaras,
    opcCombate: BL => ({ bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: HOMBRES_FALANGE } }),
    util: () => (M ? M.util() : null),
    mods: () => null,
    guardia: guardiaDeSerie,
    monta,
    pausada: () => !!(M && M.pausa),
    paso(dt) {
      if (!M) return;
      tAro += dt; const S = ctx.C.S, ids = M.elegido === 'todos' ? ['falange', 'man1', 'man2'] : [M.elegido], k = 1 + 0.03 * Math.sin(tAro * 4);
      aros.forEach((m, i) => {
        const c = M.cuerpos.find(q => q.id === ids[i]); if (!c || !c.b || c.b.estado === 'fuera') { m.visible = false; return; }
        const b = c.b, cx = b.x - Math.sin(b.ang) * b.fondo / 2, cz = b.z + Math.cos(b.ang) * b.fondo / 2;
        m.visible = true; m.position.set(cx, ctx.H(cx, cz) + 0.35, cz); m.rotation.z = -b.ang; m.scale.set((b.ancho / 2 + 1.5) * k, (b.fondo / 2 + 1.5) * k, 1);
      });
      void S;
    },
    despues(dt) { if (tira) tira.tick(dt); },
    alAviso() {}
  };
}
