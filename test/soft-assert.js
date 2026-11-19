// Herramienta de diagnóstico (no es una prueba): node -r ./test/soft-assert.js test/sim.test.js
// Las aserciones que fallan se anotan y la prueba SIGUE; al final lista TODOS los fallos con su línea (así una sola pasada los destapa todos).
const Module = require('module');
const real = require('assert');
const fallos = [];
function suave(f) {
  return function (...a) {
    try { return f.apply(this, a); }
    catch (e) {
      if (!e || e.name !== 'AssertionError') throw e;
      const l = String(e.stack || '').split('\n').find(x => /\.test\.js:\d+/.test(x));
      const m = l && l.match(/([\w.\-]+\.test\.js:\d+)/);
      fallos.push((m ? m[1] : '?') + ' :: ' + String(e.message).split('\n')[0].slice(0, 200));
    }
  };
}
const soft = suave(real);
for (const k of Object.keys(real)) if (typeof real[k] === 'function' && /^[a-z]/.test(k)) soft[k] = suave(real[k]);
const orig = Module.prototype.require;
Module.prototype.require = function (id) {
  const m = orig.apply(this, arguments);
  return (id === 'assert' || id === 'node:assert') ? soft : m;
};
process.on('exit', () => {
  console.error('\n=== SOFT-ASSERT: ' + fallos.length + ' aserciones fallidas ===');
  fallos.forEach(f => console.error(' - ' + f));
  if (fallos.length && !process.exitCode) process.exitCode = 1;
});
