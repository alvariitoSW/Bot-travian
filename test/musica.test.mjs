// AQVILA — SON1-b: pruebas puras de js/gfx/musica.js (Node, sin audio): node test/musica.test.mjs
import { createRequire } from 'node:module';
const M = createRequire(import.meta.url)('../js/gfx/musica.js'), fallos = [];
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

ok(igual(M.patron(0.5, 3, 7), M.patron(0.5, 3, 7)), 'el patrón es determinista con la misma semilla');
ok(!igual(M.patron(0.5, 3, 7), M.patron(0.5, 3, 8)) || !igual(M.patron(0.5, 4, 7), M.patron(0.5, 4, 8)), 'otra semilla da otra música');
ok(Math.round(M.tempoDe(0)) === 66 && Math.round(M.tempoDe(1)) === 120 && M.tempoDe(0.5) > 66 && M.tempoDe(0.5) < 120, 'el tempo va de 66 a 120 pulsos');
const cuenta = (t, c) => { let n = 0; for (let k = 0; k < 64; k++) n += M.patron(t, k, 5).filter(x => x.c === c).length; return n; };
ok(cuenta(0.9, 'tambor') > 2 * cuenta(0.1, 'tambor'), `más tambor con tensión (${cuenta(0.1, 'tambor')} → ${cuenta(0.9, 'tambor')} golpes en 64 compases)`);
ok(cuenta(0.9, 'tibia') > cuenta(0.1, 'tibia'), 'más notas de tibia con tensión');
const media = (t, c) => { const l = []; for (let k = 0; k < 64; k++) for (const x of M.patron(t, k, 5)) if (x.c === c) l.push(x.n); return l.reduce((a, b) => a + b, 0) / l.length; };
ok(media(0.9, 'tibia') > media(0.1, 'tibia') + 6, 'el registro sube con la tensión');
// disonancia: segunda menor (13 sobre el bordón) y tritono solo con tensión
const roce = t => { let n = 0; for (let k = 0; k < 32; k++) n += M.patron(t, k, 5).filter(x => x.c === 'bordon' && x.n === 50 + 13 || x.c === 'bordon' && x.n === 50 + 6).length; return n; };
ok(roce(0.9) > 0 && roce(0.1) === 0, 'la disonancia (segunda menor y tritono) solo aparece con tensión');
let malos = 0;
for (const t of [0, 0.2, 0.5, 0.8, 1]) for (let k = 0; k < 16; k++) for (const n of M.patron(t, k, 3)) {
  if (!(n.t >= 0 && n.t < 4 && n.d > 0 && n.v > 0 && n.v <= 1 && n.n >= 30 && n.n <= 96 && ['bordon', 'tambor', 'tibia', 'cornu'].includes(n.c))) malos++;
}
ok(malos === 0, 'todas las notas caen dentro del compás, en rango y con capa conocida');
// la tensión sube al perder moral y con cuerpos rotos; la espera es contenida
const sano = { fase: 'lucha', moral: [1, 1], rotos: [0, 0] }, mal = { fase: 'lucha', moral: [0.35, 0.9], rotos: [1, 0] }, esp = { fase: 'lejos', moral: [1, 1], rotos: [0, 0] };
ok(M.tensionDe(mal) > M.tensionDe(sano) + 0.3, `la tensión sube al perder moral (${M.tensionDe(sano).toFixed(2)} → ${M.tensionDe(mal).toFixed(2)})`);
ok(M.tensionDe(esp) < M.tensionDe(sano) && M.tensionDe(esp) > 0.1, 'la espera es tensa pero contenida');
ok(M.tensionDe({ fase: 'lucha', moral: [0, 0], rotos: [3, 0], cansancio: 1 }) <= 1 && M.tensionDe({}) >= 0 && M.tensionDe() >= 0, 'la tensión siempre queda entre 0 y 1');
ok(M.estadoDe(esp) === 'espera' && M.estadoDe(sano) === 'lucha' && M.estadoDe(mal) === 'peligro', 'estados: espera, lucha y peligro');
ok(M.estadoDe({ fase: 'fin', resultado: 'victoria' }) === 'victoria' && M.estadoDe({ fase: 'fin', resultado: 'derrota' }) === 'derrota', 'estados finales: victoria y derrota');
for (const r of ['victoria', 'derrota']) {
  const f = M.fraseFinal(r), fin = Math.max(...f.map(n => n.s + n.d));
  ok(fin >= 5 && fin <= 10, `la frase de ${r} dura entre 5 y 10 s (${fin.toFixed(1)} s)`);
}
ok(M.fraseFinal('victoria').some(n => n.c === 'cornu') && !M.fraseFinal('derrota').every(n => n.c === 'cornu') && M.fraseFinal('derrota').filter(n => n.c === 'tibia').length >= 4, 'victoria con cornu; derrota con tibia sola que baja');
ok(M.iniciar() === false && M.activa === false, 'sin audio no arranca ni falla');
M.tension(0.5); M.agacha(); M.final('victoria'); M.parar(); ok(true, 'tension, agacha, final y parar sin audio no fallan');
ok(Math.abs(M.hz(69) - 440) < 1e-9 && Math.abs(M.hz(57) - 220) < 1e-9, 'hz: la3 = 440 Hz');
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else console.log('\nTodo bien');
