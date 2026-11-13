/* AQVILA — obras cívicas de la ciudad 3D (CN15d): dique contra la crecida y arca del foro. El tejado por barrio es un
   cambio de color que hace city3d.js (tinteC) y se enciende con CIVICAS_TEJADO. Solo dibujo: no guarda nada ni toca la lógica.
   Lee, sin inventar nada si faltan:
     · E.edificios con tipo 'dique' (x, z, ang, y e.obra si está en obra): un tramo de terraplén de tierra con empalizada.
     · E.arca: cantidad que sobra en el almacén (número, o un objeto con n / cantidad / total): montón de sacos y cajas junto al foro.
     · E.barrios[i].tejas: barrio con tejas (tejado rojo, en city3d.js).
   Arte: todo por código (cajas de un color por vértice) y el prop_sacos / prop_caja de 0 A.D. (Wildfire Games, CC BY-SA 3.0)
   ya usados por fachadas.js. Una malla, SIN sombra. Se rehace solo cuando cambia E.rev. Constante en false = cero triángulos. */
import { THREE } from './models.js';

export const CIVICAS_DIQUE = true;
export const CIVICAS_ARCA = true;
export const CIVICAS_TEJADO = true;
export const N_DIQUE_MAX = 6;            // tramos de dique dibujados (los lee gobierno/arte.mjs)
export const N_ARCA_MAX = 14;            // sacos y cajas del montón del arca
const CAM_VER = 700;                     // más lejos que esto no se dibuja

let C = null, rev = -1, malla = null, ver = true, sacosL = null, cajasL = null, lSacos = [], lCajas = [];

export function iniciar(ctx) { C = ctx; }
export function reiniciar() { quita(); rev = -1; }
function quita() { if (malla) { C.scene.remove(malla); malla.geometry.dispose(); malla = null; } lSacos = []; lCajas = []; if (sacosL) aplicar(); }
function lotes() {
  if (sacosL) return;
  sacosL = C.lote('prop_sacos', N_ARCA_MAX, { sinTeja: true, sombra: false }); cajasL = C.lote('prop_caja', N_ARCA_MAX, { sinTeja: true, sombra: false });
}
function aplicar() { lotes(); sacosL.poner(ver ? lSacos : []); cajasL.poner(ver ? lCajas : []); if (malla) malla.visible = ver; C.pedirReparto(); }

/* un tramo de dique: largo 34 a lo largo del ángulo, cuerpo de tierra con coronación y estacas; en obra, solo la mitad de alto */
function dique(B, e) {
  const alt = C.altura, y0 = alt(e.x, e.z), prog = e.obra ? Math.max(0.25, 1 - e.obra / ((e.total || 1) + 0.6)) : 1, h = 3.2 * prog, L = 34, g = -e.ang;
  B.caja(L, h, 7, e.x, y0 + h / 2 - 0.2, e.z, '#7d6a4a', g);
  B.caja(L, 0.5, 3.2, e.x, y0 + h + 0.05, e.z, '#9a8760', g);
  if (e.obra) return;
  const c = Math.cos(e.ang), s = Math.sin(e.ang);
  for (let i = -4; i <= 4; i++) { const u = i * 4, px = e.x + c * u - s * 3.7, pz = e.z + s * u + c * 3.7; B.caja(0.5, h + 1.8, 0.5, px, alt(px, pz) + (h + 1.8) / 2 - 0.2, pz, '#5a4632', 0); }
}

function reconstruir(E) {
  quita();
  if (!E || !E.fundada) return;
  const B = new C.Bulto();
  if (CIVICAS_DIQUE) E.edificios.filter(e => e.tipo === 'dique' && !e.ruina).slice(0, N_DIQUE_MAX).forEach(e => dique(B, e));
  const a = E.arca, q = typeof a === 'number' ? a : a ? (a.n ?? a.cantidad ?? a.total ?? 0) : 0;
  if (CIVICAS_ARCA && E.foro && q > 0) {
    const f = E.foro, n = Math.min(N_ARCA_MAX, 2 + Math.floor(q / 150)), rnd = C.azar((E.semilla || 1) * 53 + 7), M = C.matriz, c = Math.cos(f.ang), s = Math.sin(f.ang);
    const bx = f.x + c * 26 + s * 14, bz = f.z + s * 26 - c * 14;                       // rincón de la plaza, a un lado del foro
    for (let i = 0; i < n; i++) {
      const x = bx + (i % 4) * 3.4 - 5 + rnd(), z = bz + Math.floor(i / 4) * 3.2 + rnd(), y = C.altura(x, z);
      (i % 3 === 2 ? lCajas : lSacos).push({ m: M(x, y + 0.3 + (i > 7 ? 1.1 : 0), z, rnd() * 6, i % 3 === 2 ? 1.2 : 1.5) });   // los últimos, encima de los primeros
    }
    B.caja(14, 0.3, 11, bx + 1.6, C.altura(bx, bz) + 0.15, bz + 3.2, '#8a6b45', 0);      // tarima de madera bajo el montón
  }
  malla = B.p.length ? Object.assign(new THREE.Mesh(B.geo(), C.matBulto), { castShadow: false, receiveShadow: false, frustumCulled: false }) : null;
  if (malla) C.scene.add(malla);
  aplicar();
}
export function actualizar(E, camD) {
  if (!C || !E) return;
  if (E.rev !== rev) { rev = E.rev; reconstruir(E); }
  const v = camD < CAM_VER; if (v !== ver) { ver = v; aplicar(); }
}
