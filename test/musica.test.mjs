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
// SON1 (usuario: «en función de si voy ganando o perdiendo»): ganando suena distinto de perdiendo
const gano = { fase: 'lucha', moral: [0.9, 0.4], rotos: [0, 1] };
ok(M.estadoDe(gano) === 'ventaja', 'estado: ventaja cuando el enemigo flaquea o pierde cuerpos');
const notasDe = (e, c) => { const l = []; for (let k = 0; k < 32; k++) for (const x of M.patron(0.6, k, 5, e)) if (!c || x.c === c) l.push(x); return l; };
const roces = e => notasDe(e, 'bordon').filter(x => x.n === 50 + 13 || x.n === 50 + 6).length;
ok(roces('ventaja') === 0 && roces('peligro') > 0, `ganando no hay roces; perdiendo sí (${roces('peligro')})`);
ok(notasDe('ventaja', 'cornu').length > notasDe('peligro', 'cornu').length, 'ganando suena más el cornu');
ok(notasDe('ventaja', 'tibia').some(x => (x.n - 50) % 12 === 4) && !notasDe('peligro', 'tibia').some(x => (x.n - 50) % 12 === 4), 'ganando, modo brillante (fa#); perdiendo, nunca');
M.tension(0.5); M.agacha(); M.final('victoria'); M.parar(); ok(true, 'tension, agacha, final y parar sin audio no fallan');
ok(Math.abs(M.hz(69) - 440) < 1e-9 && Math.abs(M.hz(57) - 220) < 1e-9, 'hz: la3 = 440 Hz');

// SON6: temas del resto del juego (menú, ciudad, mapa, Senado)
const CAPAS = ['bordon', 'tambor', 'tibia', 'cornu', 'lira'];
ok(M.TEMAS.join() === 'menu,ciudad,mapa,senado', 'hay cuatro temas: menú, ciudad, mapa y Senado');
ok(M.temaDe('city') === 'ciudad' && M.temaDe('map') === 'mapa' && M.temaDe('senado') === 'senado' && M.temaDe('saber') === 'ciudad' && M.temaDe('menu') === 'menu' && M.temaDe('xyz') === 'ciudad', 'cada pantalla de la interfaz toca su tema (las desconocidas, la de ciudad)');
for (const t of M.TEMAS) {
  const a = M.temaPatron(t, 5, { sem: 3, estacion: 1, tension: 0.4 });
  ok(igual(a, M.temaPatron(t, 5, { sem: 3, estacion: 1, tension: 0.4 })), `${t}: el patrón es determinista`);
  let malos2 = 0, vacios = 0;
  for (const est of [0, 1, 2, 3]) for (const ten of [0, 0.5, 1]) for (let k = 0; k < 24; k++) {
    const p = M.temaPatron(t, k, { sem: 9, estacion: est, tension: ten }); if (!p.notas.length) vacios++;
    if (!(p.bpm >= 50 && p.bpm <= 100)) malos2++;
    for (const n of p.notas) if (!(n.t >= 0 && n.t < 4 && n.d > 0 && n.v > 0 && n.v <= 1 && n.n >= 30 && n.n <= 96 && CAPAS.includes(n.c))) malos2++;
  }
  ok(malos2 === 0 && vacios === 0, `${t}: notas dentro del compás, en rango, capa conocida y tempo sereno (50-100)`);
  const ci = M.ciclo(t); ok(ci.suena >= 40 && ci.suena <= 220 && ci.calla >= 40, `${t}: suena ${ci.suena} s y calla ${ci.calla} s (no es un bucle eterno)`);
}
ok(M.ciclo('menu').suena >= 40 && M.ciclo('menu').suena <= 60, 'el menú suena entre 40 y 60 s');
const cap = (t, c, o) => { let n = 0; for (let k = 0; k < 48; k++) n += M.temaPatron(t, k, o).notas.filter(x => x.c === c).length; return n; };
ok(cap('menu', 'cornu', {}) > 0 && cap('menu', 'tibia', {}) > 0 && cap('menu', 'tambor', {}) > 0, 'el menú tiene cornu lejano, tibia y tympanum');
ok(cap('ciudad', 'lira', { estacion: 1 }) > 0 && cap('ciudad', 'tibia', { estacion: 1 }) > 0 && cap('ciudad', 'cornu', { estacion: 1 }) === 0, 'la ciudad es de lira y tibia, sin cornu');
ok(cap('ciudad', 'lira', { estacion: 1 }) > cap('ciudad', 'lira', { estacion: 3 }) && M.temaPatron('ciudad', 0, { estacion: 3 }).bpm < M.temaPatron('ciudad', 0, { estacion: 1 }).bpm, 'la ciudad cambia con la estación: en invierno, más lenta y con menos notas');
const fa = (t, o) => { let n = 0; for (let k = 0; k < 32; k++) n += M.temaPatron(t, k, o).notas.filter(x => x.c === 'tibia' && (x.n - 50) % 12 === 4).length; return n; };
ok(fa('ciudad', { estacion: 1 }) + fa('ciudad', { estacion: 0 }) > 0 && fa('ciudad', { estacion: 2 }) === 0, 'primavera y verano, modo brillante; otoño, dorio');
ok(M.tensionMapa(0) < M.tensionMapa(1) && M.tensionMapa(1) < M.tensionMapa(3) && M.tensionMapa(99) <= 1 && M.tensionMapa() >= 0, 'la tensión del mapa sube con los ejércitos enemigos');
ok(M.temaPatron('mapa', 0, { tension: 0.7 }).bpm > M.temaPatron('mapa', 0, { tension: 0.1 }).bpm, 'el mapa va más rápido con enemigos cerca');
ok(cap('mapa', 'tambor', { tension: 0.7 }) > cap('mapa', 'tambor', { tension: 0.1 }) && cap('mapa', 'cornu', { tension: 0.7 }) > cap('mapa', 'cornu', { tension: 0.1 }), 'el mapa, con enemigos, suma tambor y cornu');
const rz = (o) => { let n = 0; for (let k = 0; k < 32; k++) n += M.temaPatron('mapa', k, o).notas.filter(x => x.c === 'tibia' && x.n === 70).length; return n; };
ok(rz({ tension: 0.7 }) > 0 && rz({ tension: 0.1 }) === 0, 'con enemigos cerca, frigio (segunda menor); en paz, dorio');
ok(cap('senado', 'tambor', {}) < cap('mapa', 'tambor', {}) / 4 && cap('senado', 'lira', {}) > 0, 'el Senado es sobrio: casi sin tambor y con lira');
ok(M.tema('xyz') === false && M.tema('mapa', { tension: 0.3 }) === true && M.estadoTema().tema === 'mapa', 'M.tema acepta temas conocidos y recuerda el actual');
ok(M.estadoTema().sonando === false, 'sin audio el tema no suena ni falla');
M.on(); ok(M.encendida() === true, 'el interruptor Música arranca encendido'); M.off(); ok(M.encendida() === false, 'se apaga'); M.on();
M.tema(null); ok(M.estadoTema().tema === null, 'M.tema(null) quita el tema');
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else console.log('\nTodo bien');
