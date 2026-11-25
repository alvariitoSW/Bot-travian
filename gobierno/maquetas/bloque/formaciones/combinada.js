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
import { montaTiradores, DETRAS } from '../../../../js/tiro.js';   /* ES3b: tus tiradores (reglas, sin pantalla) */
import { crearVista } from '../tiradores.js';   /* ES3b: cómo se ven y se tocan */
import { crearSarisas, pintaSarisas, gestoSarisa } from './falange.js';   /* BT1: las sarisas de los falangitas, las mismas que en la falange a pie */

export const HOMBRES_FALANGE = 128;
/* ES4: ?escenario=asculo&bando=pirro|roma. pirro: tu falange y dos manípulos itálicos contra la legión (tres manípulos y vélites rivales).
   roma: tres manípulos (el motor da el Testudo) y vélites tuyos contra la falange de Pirro y honderos rivales. Sin escenario, los galos de siempre */
export function escenarioAsculo(q) { const e = q.get('escenario') === 'asculo', b = q.get('bando') === 'roma' ? 'roma' : q.get('bando') === 'pirro' ? 'pirro' : null; return e && b ? { bando: b, objetivo: b === 'pirro' ? 'Ásculo, 279 a.C. · Rompe la línea romana' : 'Ásculo, 279 a.C. · Aguanta y rompe la falange' } : null; }
export function crear() {
  const ASC = escenarioAsculo(new URLSearchParams(location.search)), ROMA = !!(ASC && ASC.bando === 'roma');
  let ctx = null, M = null, tira = null, vista = null, aros = [], tAro = 0;
  let MS = null;   /* BT1: las sarisas de los bloques de falange (Ásculo) */
  const camaras = { v: { d: 110, alto: 88, ad: 30, fov: 56 }, h: { d: 52, alto: 34, ad: 22, fov: 44 } };
  /* BT1: los falangitas de Ásculo (bloques 'falange' de js/bloque.js, pintados a hueco por tropas.js) llevan la sarisa de formaciones/falange.js
     (pintaSarisas: mismo carril, mismo apartado). La bajan las cinco primeras filas al trabarse, al cargar o con el rival a menos de 30 m */
  function sarisas(dt) {
    const S = ctx.C.S, lista = [], baja = new Map();
    for (const b of S.bloques) if (b.tipo === 'falange' && b.vis) baja.set(b, (b.contactos && b.contactos.length) || b.orden === 'cargar' || S.bloques.some(o => o.bando !== b.bando && o.estado !== 'fuera' && Math.hypot(o.x - b.x, o.z - b.z) < 30) ? 1 : 0);
    for (const f of ctx.TR.figs) {
      const b = f.b; if (!b || !baja.has(b) || f.slot === undefined) continue;
      if (!f.tallaBT1) { f.talla = 1 + ((f.talla || 1) - 1) * 0.2; f.tallaBT1 = true; }   /* de una talla, como en la falange */
      const h = f.hs || (f.hs = { i: Math.round(f.semilla * 7), kB: 0 }), cols = b.vis.cols; h.r = Math.floor(f.slot / cols); h.f = f.slot % cols; h.huye = b.estado === 'huye' || b.estado === 'fuera'; h.vivo = f.vivo !== false;
      const quiere = h.r < 5 && !h.huye ? baja.get(b) : 0; h.kB += (quiere - h.kB) * Math.min(1, dt * 1.2); if (Math.abs(quiere - h.kB) < 0.002) h.kB = quiere;
      lista.push({ h, f, kB: h.kB, pinta: true });
      /* los brazos, como en la falange: en las cinco primeras filas, con la sarisa bajada y quietos, en guardia y con las manos en el asta */
      if (!f.gesto) f.gesto = gestoSarisa(f, h, () => S.T);
      f.gk = h.r < 5 && h.vivo && !h.huye && h.alzaBT1 === undefined ? h.kB : 0; f.gg = 0;
      if (h.vivo && !h.huye && h.r < 5 && h.kB > 0.5 && !(f.v > 0.3) && f.clip !== 'morir' && f.clip !== 'guardia') { f.clip = 'guardia'; f.t = (h.i % 97) * 0.03; }
    }
    const bandos = new Set([...baja.keys()].map(b => b.bando)), rivales = ctx.TR.figs.filter(f => f.vivo !== false && f.b && !bandos.has(f.b.bando));   /* el asta no pasa por dentro de un rival */
    pintaSarisas(MS, lista, { H: ctx.H, Tm: S.T, rivales, caidos: ctx.TR.caidos });
  }
  function monta(c) {
    ctx = c; const { THREE } = c;
    if (tira) tira.quita(); if (vista) vista.quita(); vista = null;
    M = crearMando(c.C, { MO: c.BL, avisa: t => { try { c.hud && c.hud.grito(t); } catch (e) { /* sin aviso */ } } });
    if (ROMA) ['Manípulo I|Man. I', 'Manípulo II|Man. II', 'Manípulo III|Man. III'].forEach((n, i) => { const q = M.cuerpos[i]; q.tipo = 'manipulo'; [q.nombre, q.corto] = n.split('|'); });
    /* el aro dorado: un anillo plano por cuerpo (el mismo dibujo, 1 llamada cada uno; «Todos» enseña los tres) */
    if (!aros.length) {
      const geo = new THREE.RingGeometry(0.93, 1, 48), mat = new THREE.MeshBasicMaterial({ color: 0xe9c063, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false });
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 18; m.frustumCulled = false; m.visible = false; c.escena.add(m); aros.push(m); }
    }
    /* ES3b: los tiradores (?tiradores=honderos|arqueros|velites) entran como quinta ficha, antes de armar la tira */
    const tp = new URLSearchParams(location.search).get('tiradores') || (ROMA ? 'velites' : null), X = montaTiradores(c.C, M, { tipo: tp, semilla: c.semilla, alSalva: s => vista && vista.salva(s), avisa: t => vista && vista.aviso(t) });
    if (ASC) { const R = montaTiradores(c.C, M, { rival: true, tipo: ROMA ? 'honderos' : 'velites', semilla: (c.semilla || 7) + 11, alSalva: s => vista && vista.salva(s) }); window.__bloque && (window.__bloque.tiradoresRival = R); }   /* ES4: los del rival, con su juicio */
    tira = crearTira({ mando: M, hud: c.hud, $: c.$, dedos: c.dedos });
    if (X) { vista = crearVista({ ctx: c, M, X }); window.__bloque && (window.__bloque.tiradores = X, window.__bloque.proyecta = c.proyecta); }
    c.texto && c.texto(ASC ? ASC.objetivo : 'Rompe su centro con la falange y los dos manípulos');
    window.__bloque && (window.__bloque.mando = M);
    if (MS) MS.quita(); MS = ASC ? crearSarisas(THREE, c.escena, 600) : null;
  }
  return {
    id: 'combinada', ordenes: ['avanzar', 'alto', 'cargar', 'retirada'], hud: { retirada: false }, objetivo: ASC ? ASC.objetivo : 'Rompe su centro con la falange y los dos manípulos', escenario: null, muroDelante: false, camaras,
    opcCombate: BL => ASC ? (ROMA ? { fuerzas: { tuyo: 120, alas: [0, 0], reserva: 0, tiradores: 40 }, rival: 'falange', tiroRival: true, apoyo: { x: 0, z: DETRAS, hombres: 40 } }
      : { bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: HOMBRES_FALANGE, reserva: 0, tiradores: 40 }, rival: 'romanos', tiroRival: true, apoyo: { x: 0, z: DETRAS, hombres: 40 } })
      : ({ bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: HOMBRES_FALANGE }, apoyo: { x: 0, z: DETRAS, hombres: 40 } }),
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
      void S; if (MS) sarisas(dt);
    },
    despues(dt) { if (tira) tira.tick(dt); if (vista) vista.tick(dt); },
    alAviso() {}
  };
}
