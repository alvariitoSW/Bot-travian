// AQVILA — CG9: los 12 datos de cada tropa. node test/tropas.test.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const Tropas = require('../js/tropas.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const LISTA = 'hastati velites principes triarii equites vigiles milicia hoplitas falange peltastas honderos libios iberos galos sagrada jinetes numidas tesalios elefantes general'.split(' ');
const NUM = ['acierto', 'dano', 'perfora', 'carga', 'vida', 'armadura', 'escudo', 'defensa', 'moral', 'resistencia', 'velocidad'];

t('define globalThis.Tropas', () => assert.strictEqual(globalThis.Tropas, Tropas));
t('las 20 tropas tienen los 12 campos', () => {
  assert.strictEqual(LISTA.length, 20);
  for (const id of LISTA) {
    const d = Tropas.datos(id);
    for (const k of NUM) assert.ok(Number.isFinite(d[k]), id + '.' + k);
    assert.ok(d.tiro === null || (typeof d.tiro === 'object' && ['alc', 'dano', 'perfora', 'mun'].every(k => Number.isFinite(d.tiro[k]))), id + '.tiro');
    assert.ok(Tropas.DATOS[id].lleva.length <= 140, id + ' lleva');
    assert.ok(Tropas.DATOS[id].fuente && Tropas.DATOS[id].licencia, id + ' textos');
  }
  assert.strictEqual(Tropas.CAMPOS.length, 12);
});
t('veterano sube acierto, defensa y moral; no vida ni armadura', () => {
  const c = Tropas.datos('hastati', 'roma', 'curtido'), v = Tropas.datos('hastati', 'roma', 'veterano'), no = Tropas.datos('hastati', 'roma', 'novato');
  assert.ok(v.acierto > c.acierto && v.defensa > c.defensa && v.moral > c.moral);
  assert.ok(no.acierto < c.acierto && no.moral < c.moral);
  assert.strictEqual(v.vida, c.vida); assert.strictEqual(v.armadura, c.armadura);
});
t('el pueblo retoca: libios de Cartago más armadura; elefantes de Epiro con tiro', () => {
  assert.ok(Tropas.datos('libios', 'cartago').armadura > Tropas.datos('libios', 'roma').armadura);
  assert.ok(Tropas.datos('elefantes', 'epiro').tiro && !Tropas.datos('elefantes', 'cartago').tiro);
  assert.ok(Tropas.datos('jinetes', 'galos').carga > Tropas.datos('jinetes', 'iberos').carga);
  assert.ok(Tropas.datos('jinetes', 'iberos').acierto > Tropas.datos('jinetes', 'galos').acierto);
});
t('no se contaminan los datos base y se memoriza', () => {
  Tropas.datos('elefantes', 'epiro');
  assert.strictEqual(Tropas.DATOS.elefantes.tiro, null);
  assert.strictEqual(Tropas.datos('galos', 'galos'), Tropas.datos('galos', 'galos', 'curtido'));
});
t('tropa desconocida usa los de milicia', () => assert.strictEqual(Tropas.datos('xyz').acierto, Tropas.datos('milicia').acierto));
t('barras entre 0 y 1', () => {
  for (const id of LISTA) for (const v of ['novato', 'curtido', 'veterano']) {
    const b = Tropas.barras(id, 'roma', v);
    for (const k of ['ataque', 'armadura', 'vida', 'moral']) assert.ok(b[k] >= 0 && b[k] <= 1, id + k);
  }
  assert.ok(Tropas.barras('elefantes').vida < 1.0001);
});
t('coherencia: galos menos armadura que príncipes; triarios y falange contra caballería', () => {
  assert.ok(Tropas.datos('galos').armadura < Tropas.datos('principes').armadura);
  assert.ok(Tropas.datos('principes').armadura > Tropas.datos('hastati').armadura);
  assert.ok(Tropas.datos('triarii').contra.cab > 1 && Tropas.datos('falange').contra.cab > 1);
  assert.ok(Tropas.datos('velites').contra.ele > 1);
});
t('BOLSAS y PRECIO', () => { assert.strictEqual(Tropas.BOLSAS.mediana, 10000); assert.deepStrictEqual(Tropas.PRECIO, {}); });
t('el archivo no usa Math.random, Date ni process', () => {
  const s = readFileSync(new URL('../js/tropas.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|\bDate\b|\bprocess\b/.test(s));
});
t('carga como módulo ES', async () => { await import('../js/tropas.js'); });
console.log(mal ? 'FALLOS: ' + mal : 'TODO BIEN (' + n + ')'); process.exit(mal ? 1 : 0);
