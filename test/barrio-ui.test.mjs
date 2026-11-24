/* CD5b: pruebas de la parte pura de js/barrio-ui.js (sin pantalla). Uso: node test/barrio-ui.test.mjs */
import assert from 'node:assert/strict';
import { datosCiudad, calleCerca, remedioBarrio, zonaNecesidad, zonaServicio, casasSin } from '../js/barrio-ui.js';
import * as NEC from '../js/necesidades.js';

/* ciudad de mentira: rejilla 30x30 de celdas de 1 unidad; una calle recta en la fila 10 */
const N = 30, ocup = new Uint8Array(N * N); for (let i = 2; i < 28; i++) ocup[10 * N + i] = 1;
const casa = (id, x, z, barrio = 0) => ({ id, x, z, barrio, fuera: false, casa: { nivel: 1 } });
const E = { geo: { X0: 0, Z0: 0, C: 1 }, ocup, fundada: true,
  parcelas: [casa(1, 4.5, 12.5), casa(2, 20.5, 8.5), casa(3, 26.5, 12.5), { id: 4, x: 6, z: 6, barrio: 0, casa: null }],
  edificios: [{ id: 7, tipo: 'fuente', x: 3.5, z: 12.5, w: 2, d: 2, obra: 0, ruina: 0 }, { id: 8, tipo: 'templo', x: 14, z: 13, w: 2, d: 2, obra: 1, ruina: 0 }],
  barrios: [{ nombre: 'Barrio de prueba', x: 14, z: 10 }] };
const G = { N, X0: 0, Z0: 0, C: 1 };

assert.equal(calleCerca(NEC.redDeCiudad(E), G, 4.5, 12.5, 5), 10 * N + 4, 'la calle más cercana a una casa');
assert.equal(calleCerca(NEC.redDeCiudad(E), G, 4.5, 25.5, 5), -1, 'sin calle cerca');
const D = datosCiudad(E, { ple: 70, ciu: 20, esc: 10 }, null);
assert.equal(D.casas.length, 3, 'solo cuentan las parcelas con casa');
assert.equal(D.servicios.length, 1, 'una obra a medias aún no sirve');
const b = D.barrios[0];
assert.equal(b.n, 3); assert.equal(b.dom, 'ple'); assert.equal(b.claseNombre, 'plebe');
assert.equal(b.pop, 45, 'vecinos = suma de lo que caben las casas');
assert.ok(b.cob.agua > 0 && b.cob.agua < 1, 'la fuente llega a una casa pero no a todas: ' + b.cob.agua);
assert.equal(b.cob.salud, 0); assert.equal(b.estado, 'mal');
assert.ok(zonaNecesidad(D, 'agua').has(10 * N + 4), 'la zona de agua incluye la calle junto a la fuente');
assert.equal(zonaNecesidad(D, 'salud').size, 0);
assert.equal(zonaServicio(D, 'fuente', -1).size, 0);
assert.equal(casasSin(D, 'agua', 0).length, 3 - Math.round(b.cob.agua * 3));
const r = remedioBarrio(D, b);
assert.ok(r && NEC.SERVICIOS[r.servicio] && typeof r.ministro === 'string', 'hay un remedio con ministro');
assert.equal(b.ficha.necesidades.length, 8);
/* en revuelta el barrio se pinta rojo y lo dice */
const R = datosCiudad(E, { ple: 70, ciu: 20, esc: 10 }, { mem: [{ desc: 0, mal: {}, revuelta: true }] });
assert.equal(R.barrios[0].estado, 'mal'); assert.equal(R.barrios[0].revuelta, true);
console.log('barrio-ui: todo bien');
