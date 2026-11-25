/* AQVILA · PN3 — comarca aleatoria alrededor de la polis elegida en «Partida nueva».
   Sin pantalla: corre también en Node (test/comarca.test.mjs). game.js la recibe con G.usarComarca(modulo).
   Con una semilla distinta en cada partida sale una comarca distinta, pero siempre coherente con su polis:
   terreno (y su agua con nombre), sitio del ágora, bosques (la semilla de la ciudad) y las casas del arranque.
   Los nombres de lugares y recursos son los del mapa de Grecia (js/gfx/mapa-grecia-datos.js, con su fuente en AM2).
   LICENCIA DE JUEGO: qué terrenos tiene cada polis y con qué peso, los textos del sitio y el reparto de casas. */
import { POLIS, comarca as cercanos } from './gfx/mapa-grecia-datos.js';

/* Azar con semilla (mulberry32): la misma semilla da siempre la misma comarca */
export function azar(semilla) {
  let a = (semilla >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* Por polis: su comarca (nombre de época), su tierra de cultivo y los terrenos posibles con [peso, agua con nombre].
   Polis de costa: costa o río (Argos, llanura sobre todo). Tebas: llanura o el lago Copais. Esparta: el Eurotas o terrazas. */
export const PERFILES = {
  atenas: { n: 'Ática', cultivo: 'llanura del Cefiso', terrenos: { costa: [3, 'golfo Sarónico'], rio: [2, 'río Cefiso'] } },
  esparta: { n: 'Laconia', cultivo: 'vega del Eurotas', terrenos: { rio: [3, 'río Eurotas'], terrazas: [2, 'río Eurotas'] } },
  corinto: { n: 'Corintia', cultivo: 'llanura costera del istmo', terrenos: { costa: [3, 'golfo de Corinto'], rio: [1, 'fuente Pirene'] } },
  argos: { n: 'Argólide', cultivo: 'llanura de Argos', terrenos: { llanura: [3, 'llanura argiva, sin río a la vista'], costa: [1, 'golfo de Argos'] } },
  tebas: { n: 'Beocia', cultivo: 'llanura beocia', terrenos: { llanura: [3, 'llanura beocia, sin río a la vista'], pantano: [2, 'lago Copais'] } },
  megara: { n: 'Megáride', cultivo: 'llano de Mégara', terrenos: { costa: [3, 'golfo Sarónico'], rio: [1, 'torrentes de la Megáride'] } },
  mileto: { n: 'Jonia', cultivo: 'vega del Meandro', terrenos: { costa: [3, 'golfo Latmio'], rio: [2, 'río Meandro'] } },
  calcis: { n: 'Eubea', cultivo: 'llanura Lelantina', terrenos: { costa: [3, 'estrecho del Euripo'], rio: [1, 'río Lelanto'] } }
};

/* Dónde se levanta el ágora, en palabras (el sitio de verdad lo elige la ciudad con la semilla) */
export const SITIOS = {
  rio: ['en una loma sobre la vega', 'junto al vado del río', 'al pie de la acrópolis'],
  costa: ['en alto, sobre la bahía', 'tras la playa, al resguardo del viento', 'al pie de la acrópolis, mirando al mar'],
  llanura: ['en medio del llano', 'en un otero del llano', 'junto al camino del llano'],
  pantano: ['en un altozano junto a la marisma', 'en la orilla firme del lago'],
  terrazas: ['en las terrazas de la ladera', 'en un rellano de la ladera']
};

/* Casas del arranque: de 5 a 8, de nivel I (15 personas) y II (25), entre 100 y 200 personas en total */
export const CABEN = { 1: 15, 2: 25 };
export function casasArranque(rnd) {
  const n = 5 + Math.floor(rnd() * 4), min2 = Math.max(0, Math.ceil((100 - 15 * n) / 10)), max2 = Math.min(n, Math.floor((200 - 15 * n) / 10));
  const n2 = min2 + Math.floor(rnd() * (max2 - min2 + 1));
  return Array.from({ length: n }, (_, i) => i < n2 ? 2 : 1);
}
export const personas = casas => casas.reduce((s, k) => s + CABEN[k], 0);

const elige = (rnd, pesos) => { const ks = Object.keys(pesos), tot = ks.reduce((s, k) => s + pesos[k][0], 0); let r = rnd() * tot; for (const k of ks) { r -= pesos[k][0]; if (r < 0) return k; } return ks[ks.length - 1]; };

/* La comarca de una partida nueva. Devuelve lo que se guarda en s.comarca. null si la polis no existe. */
export function generar(polisId, semilla) {
  const P = POLIS.find(p => p.id === polisId), F = PERFILES[polisId]; if (!P || !F) return null;
  semilla = Math.max(1, Math.floor(Number(semilla) || 1)) % 99991 || 1;
  const rnd = azar(semilla * 2654435761 + 97), terreno = elige(rnd, F.terrenos), sitios = SITIOS[terreno];
  const c = cercanos(P), cerca = [];
  for (const t of Object.keys(c.tiene)) for (const n of c.tiene[t]) cerca.push({ t, n });
  return {
    v: 1, polis: polisId, semilla, nombre: F.n, terreno, agua: F.terrenos[terreno][1],
    costa: !!P.costa, puerto: P.puertoN || null, cultivo: F.cultivo, sitio: sitios[Math.floor(rnd() * sitios.length)], agora: true,
    cerca, lujo: { id: P.lujo, de: P.lujoDe }, faltan: c.faltan.slice(), casas: casasArranque(rnd)
  };
}

/* Un renglón para la ficha del ágora */
export function texto(k) {
  if (!k) return '';
  const cerca = k.cerca.length ? k.cerca.map(z => z.n).join(', ') : 'nada';
  return 'Comarca de ' + k.nombre + ': ' + k.agua + (k.puerto ? ', puerto en ' + k.puerto : '') + '. Cerca: ' + cerca + '.' + (k.faltan.length ? ' Falta: ' + k.faltan.join(', ') + '.' : '');
}
