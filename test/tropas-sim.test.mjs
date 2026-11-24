// AQVILA — CG9 pieza B: el simulador con los datos de js/tropas.js (sanos, heridos, muertos). node test/tropas-sim.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Z = require('../js/simulador.js');
const Tropas = require('../js/tropas.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

const ROMA = { hastati: 1200, principes: 1200, triarii: 600, velites: 480, equites: 240 };
const GALOS = { galos: 3600, jinetes: 240 };
/* Dos manípulos frente a frente, a punto de tocarse */
function cara(a, b, seg, sem) {
  const S = Z.crear({ semilla: sem || 3, manipulos: [Object.assign({ lado: 0, x: 0, y: -8, mando: 'jugador' }, a), Object.assign({ lado: 1, x: 0, y: 8, mando: 'jugador' }, b)] });
  Z.avanzar(S, seg, [{ t: 0, id: 0, orden: 'empujar' }, { t: 0, id: 1, orden: 'empujar' }]);
  return S;
}
const perdida = u => 1 - u.n / u.n0;

t('hay heridos y muertos y suman con los sanos', () => {
  const S = Z.crear({ semilla: 5, ejercitos: [ROMA, GALOS] }); Z.avanzar(S, 60);
  for (const l of [0, 1]) {
    const us = S.man.filter(u => u.lado === l), ini = us.reduce((a, u) => a + u.n0, 0), sum = us.reduce((a, u) => a + u.n + u.her + u.muertos, 0);
    assert.ok(Math.abs(ini - sum) < 1e-6, 'suma ' + l);
    assert.ok(us.reduce((a, u) => a + u.her, 0) > 0 && us.reduce((a, u) => a + u.muertos, 0) > 0, 'hay heridos y muertos');
  }
  const v = Z.vista(S)[0]; assert.ok('her' in v && 'muertos' in v);
});
t('galos sin armadura sufren más por golpe que príncipes', () => {
  const S = cara({ tropa: 'principes', n: 100 }, { tropa: 'galos', n: 100 }, 12);
  assert.ok(perdida(S.man[1]) > perdida(S.man[0]), 'galos ' + perdida(S.man[1]) + ' príncipes ' + perdida(S.man[0]));
});
t('el veterano gana más a menudo que el novato (10 semillas)', () => {
  let vet = 0, nov = 0;
  for (let s = 1; s <= 10; s++) {
    const S = Z.crear({ semilla: s, manipulos: [
      { lado: 0, tropa: 'hastati', n: 60, x: -20, y: -8, vet: 'veterano' }, { lado: 0, tropa: 'hastati', n: 60, x: 20, y: -8, vet: 'veterano' },
      { lado: 1, tropa: 'hastati', n: 60, x: -20, y: 8, vet: 'novato' }, { lado: 1, tropa: 'hastati', n: 60, x: 20, y: 8, vet: 'novato' }].map(m => Object.assign({ mando: 'tribuno' }, m)) });
    Z.avanzar(S, 400); const r = Z.resumen(S); if (r.victoria) vet++; else nov++;
  }
  assert.ok(vet > nov, 'veteranos ' + vet + ' novatos ' + nov);
});
t('un manípulo de elefantes aguanta lo que no aguantaría infantería normal', () => {
  const E = cara({ tropa: 'hastati', n: 80 }, { tropa: 'elefantes', n: 8 }, 6), H = cara({ tropa: 'hastati', n: 80 }, { tropa: 'hastati', n: 8 }, 6);
  assert.ok(E.man[1].n > 6, 'elefantes en pie ' + E.man[1].n);
  assert.ok(perdida(E.man[1]) < perdida(H.man[1]) / 2, 'frente a hastati');
});
t('el resultado trae sanos, heridos, muertos, prisioneros y recuperados', () => {
  const S = Z.crear({ semilla: 4, ejercitos: [ROMA, GALOS] }); Z.avanzar(S, 900); const f = S.resultado;
  assert.ok(f && f.sanos && f.heridos && f.muertos);
  for (const l of [0, 1]) assert.strictEqual(f.sanos[l] + f.heridos[l] + f.muertos[l], f.inicial[l]);
  const r = Z.resumen(S);
  if (f.como === 'victoria') { assert.strictEqual(f.prisioneros, f.heridos[1]); assert.strictEqual(f.recuperados, f.heridos[0]); assert.strictEqual(r.prisioneros, f.prisioneros); }
  else { assert.strictEqual(f.cautivos, f.heridos[0]); assert.strictEqual(f.prisioneros, 0); }
  for (const x of r.bajas) assert.strictEqual(x.n + x.bajas, x.n0, 'n + bajas = n0 en ' + x.id);
  const gan = r.ganador; const fg = r.bajas.filter(x => x.bando === gan), fp = r.bajas.filter(x => x.bando !== gan);
  assert.ok(fg.every(x => x.bajas === x.muertos) && fp.every(x => x.bajas === x.muertos + x.prisioneros));
});
t('determinista: la misma semilla da la misma batalla', () => {
  const a = Z.crear({ semilla: 9, ejercitos: [ROMA, GALOS] }), b = Z.crear({ semilla: 9, ejercitos: [ROMA, GALOS] }); Z.avanzar(a, 90); Z.avanzar(b, 90);
  assert.strictEqual(Z.guardar(a), Z.guardar(b));
});
t('una partida vieja sin heridos ni muertos se carga con ceros', () => {
  const S = Z.crear({ semilla: 2, ejercitos: [ROMA, GALOS] }); Z.avanzar(S, 20);
  const o = JSON.parse(Z.guardar(S)); for (const u of o.man) { delete u.her; delete u.muertos; }
  const C = Z.cargar(JSON.stringify(o)); assert.ok(C.man.every(u => u.her === 0 && u.muertos >= 0));
});
t('sin Tropas sigue dando una batalla (reserva)', () => {
  Z.sinTropas(true);
  try { const S = Z.crear({ semilla: 5, ejercitos: [ROMA, GALOS] }); Z.avanzar(S, 900); assert.ok(S.fase === 'fin' && S.resultado.bajas[0] > 0); }
  finally { Z.sinTropas(false); }
});
console.log(mal ? 'FALLOS: ' + mal : 'TODO BIEN (' + n + ')'); process.exit(mal ? 1 : 0);
