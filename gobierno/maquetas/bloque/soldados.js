/* LP3 · Qué soldado pinta cada bando. PUNTO ÚNICO: aquí se decide quién sale y con qué armas; escena.js solo lo pinta.
   AL11 (23/11/2026): entran los soldados de Meshy de pago (AL1–AL10; CC BY-SA 3.0, Meshy como herramienta).
   romano: el hastatus de Meshy (sus armas ya van en su malla). El oficial a pie de tu manípulo es el centurión (AL3),
           el de la punta derecha de la primera fila. La maqueta no tiene fila de triarios ni tiradores romanos: el triario
           (AL4) y el vélite (AL7) no salen aquí.
   galo:   variantes repartidas por bloque (licencia de juego: quién va en cada bloque).
           centro y alas: grandes (AL1, AL9, AL10), rápidos (AL2, AL8) y el lancero (AL5); nobles: los grandes y, delante,
           el jefe galo (AL6); tiradores: los dos rápidos.
   Colores: los de su pueblo (PUEBLOS de js/gfx/soldado.js); el romano y el centurión, los de la legión. La túnica se tiñe
   por bando; las señas propias (capa y cresta del centurión, calzas del galo grande) no.
   ARMAS POR CÓDIGO: los de Meshy vienen sin escudo ni armas. Se les ponen las del soldado que las «presta» (ARMAS):
   solo los triángulos del escudo, la lanza o pila, la espada y la vaina de su malla, que son piezas hechas por código en
   AQVILA. Como todos comparten esqueleto y movimientos («escudo»), siguen las muñecas igual que en el que las presta. */
import { THREE } from '../../../js/gfx/models.js';
import { PUEBLOS } from '../../../js/gfx/soldado.js';

export const SOLDADOS = {
  r: { tropa: ['hastatus'], oficial: 'centurion' },
  g: { galos: ['galo-grande', 'galo-grande-v2a', 'galo-grande-v2b', 'galo-lancero', 'galo-rapido', 'galo-rapido-b'],
    nobles: ['galo-grande', 'galo-grande-v2a', 'galo-grande-v2b'], jefe: 'jefe-galo',
    tiradores: ['galo-rapido', 'galo-rapido-b'] }
};
/* quién presta escudo y armas a cada soldado de Meshy (null: ya las lleva en su malla) */
export const ARMAS = { centurion: 'hastatus', 'jefe-galo': 'galo', 'galo-grande': 'galo', 'galo-grande-v2a': 'galo', 'galo-grande-v2b': 'galo',
  'galo-lancero': 'galo', 'galo-rapido': 'galo', 'galo-rapido-b': 'galo' };
/* en el nivel de fondo (más de 70 m, ≈40 px de alto) las variantes parecidas se pintan con una: menos llamadas de dibujo
   (vara LP0: ≤30). De cerca y a media distancia, cada una la suya */
export const FONDO = { 'galo-grande-v2a': 'galo-grande', 'galo-grande-v2b': 'galo-grande', 'galo-rapido-b': 'galo-rapido',
  /* LP7: de media distancia en adelante (más de 26 m) el centurión se pinta como un hastatus: dos llamadas menos (≤ 30 en el choque) */
  centurion: 'hastatus' };
/* paleta de cada uno (sin entrada: la de su nombre en PUEBLOS, o la de la legión) */
const PAL = {};   /* LP7: paleta puesta por ponBandos, por bando y modelo ('g:hastatus'): el mismo modelo puede ir en los dos bandos */
export const paleta = (nombre, bando) => PAL[bando + ':' + nombre] !== undefined ? PAL[bando + ':' + nombre] || undefined : (nombre.startsWith('galo') || nombre === 'jefe-galo') ? PUEBLOS.galo : undefined;

/* LP7 («Bajar a pie» desde la batalla grande): cada bando con el soldado de su tropa. null = los de siempre (hastatus y
   centurión; los galos de Meshy). { modelo, paleta } = un soldado de js/gfx/soldado.js para todo el bando (ya lleva sus armas);
   paleta: objeto de PUEBLOS/gama o null (la suya). Si el modelo es 'hastatus' se queda el centurión de oficial */
const SERIE = { r: SOLDADOS.r, g: SOLDADOS.g };
export function ponBandos(r, g) {
  SOLDADOS.r = r && r.modelo ? { tropa: [r.modelo], oficial: r.oficial || (r.modelo === 'hastatus' ? 'centurion' : r.modelo) } : SERIE.r;   /* FU3: r.oficial (el de la falange) */
  SOLDADOS.g = g && g.modelo ? { galos: [g.modelo], nobles: [g.modelo], jefe: g.modelo, tiradores: [g.modelo] } : SERIE.g;
  for (const [b, x] of [['r', r], ['g', g]]) if (x && x.modelo) { PAL[b + ':' + x.modelo] = x.paleta || null; if (!(x.modelo in ARMAS)) ARMAS[x.modelo] = null; }
  if (r && r.oficial) { PAL['r:' + r.oficial] = r.palOficial || r.paleta || null; if (!(r.oficial in ARMAS)) ARMAS[r.oficial] = null; }
}

/* todos los modelos de un bando, sin repetir */
export function modelos(b) {
  const S = SOLDADOS[b], v = new Set();
  for (const k in S) for (const n of [].concat(S[k])) v.add(n);
  return [...v];
}
/* los que prestan armas a ese bando */
export function prestan(b) { return [...new Set(modelos(b).map(n => ARMAS[n]).filter(Boolean))]; }

/* qué modelo pinta a un hombre (f de tropas.js). Se decide una vez y se guarda en f.modelo */
const azar = s => { const v = Math.sin(s * 71.3 + 5.1) * 43758.5453; return v - Math.floor(v); };
export function modeloDe(f, oficial) {
  if (f.modelo) return f.modelo;
  const S = SOLDADOS[f.bando], b = f.b;
  let n;
  if (f.bando === 'r') n = f === oficial ? S.oficial : S.tropa[Math.floor(azar(f.semilla) * S.tropa.length)];
  else if (b.tipo === 'nobles' && f.slot === Math.floor((b.vis ? b.vis.cols : 1) / 2)) n = S.jefe;      // el jefe, delante y en medio
  else { const l = S[b.tipo] || S.galos; n = l[Math.floor(azar(f.semilla) * l.length)]; }
  return (f.modelo = n);
}
/* el oficial de tu manípulo: el hombre de la punta derecha de la primera fila */
export function eligeOficial(figs) {
  let mejor = null;
  for (const f of figs) if (f.bando === 'r' && f.h && f.h.fila === 0 && (!mejor || f.h.col > mejor.h.col)) mejor = f;
  return mejor;
}

/* solo las armas de un nivel de un soldado: los triángulos de sus piezas de equipo (los nombres del .json) */
const ES_ARMA = /^(escudo|lanza|pilum|espada|vaina)/;
export function soloArmas(nv) {
  const piezas = nv.j.piezas || {}, idx = nv.geo.index.array, nuevos = []; let t = 0;
  for (const [nom, n] of Object.entries(piezas)) { if (ES_ARMA.test(nom)) for (let k = t * 3; k < (t + n) * 3; k++) nuevos.push(idx[k]); t += n; }
  const g = new THREE.BufferGeometry(); for (const k in nv.geo.attributes) g.setAttribute(k, nv.geo.attributes[k]);
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(nuevos), 1));
  return Object.assign({}, nv, { geo: g });
}
