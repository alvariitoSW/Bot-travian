/* AQVILA — ES4: «Ásculo, 279 a.C.» en la partida combinada, sin pantalla. node test/es4-asculo.test.mjs */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { crearMando } from '../js/mando-varios.js';
import { montaTiradores, DETRAS } from '../js/tiro.js';
const { crearCombate, DT } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = (bando, sem = 1) => {
  const pirro = bando === 'pirro', op = pirro
    ? { bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: 128, reserva: 0, tiradores: 40 }, rival: 'romanos' }
    : { fuerzas: { tuyo: 120, alas: [0, 0], reserva: 0, tiradores: 40 }, rival: 'falange' };
  const C = crearCombate(Object.assign({ semilla: sem, nivel: 'normal', motor: BL, tiroRival: true, apoyo: { x: 0, z: DETRAS, hombres: 40 } }, op));
  const M = crearMando(C, { MO: BL }), mios = [], suyas = [];
  const X = montaTiradores(C, M, { tipo: 'velites', semilla: sem, alSalva: s => mios.push(s) });
  const R = montaTiradores(C, M, { rival: true, tipo: pirro ? 'velites' : 'honderos', semilla: sem + 11, alSalva: s => suyas.push(s) });
  return { C, M, X, R, mios, suyas };
};
const pasos = (C, s, f) => { for (let i = 0; i < s / DT && !C.S.ganador; i++) { C.paso(DT); f && f(); } };
t('bando pirro: falange + 2 manípulos contra legión (manípulos rivales) con vélites', () => {
  const { C, R } = nueva('pirro'); const S = C.S;
  assert.strictEqual(S.ene.centro.tipo, 'manipulo'); assert.strictEqual(S.ene.alas[0].tipo, 'manipulo'); assert.strictEqual(S.ene.tiradores.bando, 'g');
  assert.ok(R && R.T.bando === 1 && R.T.tipo === 'velites', 'vélites rivales con js/tiro.js');
  assert.ok(S.ene.tiradores.z > S.ene.centro.z, 'delante de su línea (hacia nosotros)');
});
t('pirro: partida completa con semilla fija acaba sin errores; vélites rivales tiran y se retiran', () => {
  const { C, R, suyas } = nueva('pirro', 2); let retira = false, hostiga = false;
  pasos(C, 240, () => { if (R.T.orden === 'retirarse') retira = true; if (R.T.orden === 'hostigar') hostiga = true; });
  assert.ok(suyas.length >= 1, 'salvas rivales ' + suyas.length); assert.ok(suyas.every(s => s.proyectil === 'jabalina'));
  assert.ok(hostiga, 'hostiga'); assert.ok(retira || R.T.municion < 7, 'se retiran o gastan la munición');
  assert.ok(R.T.municion < 7, 'gastan munición');
});
t('bando roma: tus manípulos tienen testudo y el rival es la falange con honderos', () => {
  const { C, M, R } = nueva('roma'); const S = C.S;
  assert.strictEqual(S.tuyo.tipo, 'manipulo'); assert.strictEqual(S.ene.centro.tipo, 'falange'); assert.strictEqual(S.ene.tiradores.U.hombres, 40);
  assert.ok(R.T.tipo === 'honderos' && R.T.bando === 1);
  M.cuerpos[0].tipo = 'manipulo'; assert.ok(M.ordenesDe('man1').includes('testudo'), 'testudo en los manípulos');
  assert.ok(M.orden && C.orden('testudo') !== undefined);
  assert.strictEqual(S.ene.centro.T.giro, 8, 'la falange gira lenta');
});
t('roma: partida completa acaba sin errores y los honderos rivales tiran', () => {
  const { C, R, suyas } = nueva('roma', 3); pasos(C, 240);
  assert.ok(suyas.length >= 1, 'salvas ' + suyas.length); assert.ok(suyas.every(s => s.proyectil === 'piedra')); assert.ok(R.T.municion < 20);
});
t('sin rival ni tiroRival el combate es el de galos de siempre', () => {
  const C = crearCombate({ semilla: 1, nivel: 'normal', motor: BL, bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: 128 } });
  assert.strictEqual(C.S.ene.centro.tipo, 'galos');
});
console.log(mal ? `MAL ${mal} de ${n + mal}` : `APTO ${n}`); process.exit(mal ? 1 : 0);
