// AQVILA — pruebas de js/necesidades.js SIN pantalla (Node): node test/necesidades.test.mjs
import * as R from '../js/necesidades.js';
const fallos = [], ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const N = 30;
// calle recta horizontal en fila 10 (columnas 0..29) y una perpendicular en columna 5 (filas 10..29); hueco: columna 20 sin calle
const calles = new Set();
for (let i = 0; i < N; i++) if (i !== 20) calles.add(10 * N + i);
for (let j = 10; j < N; j++) calles.add(j * N + 5);
const red = R.redDeRejilla(N, k => calles.has(k));
const cel = (i, j) => j * N + i;

// 1. datos
ok(R.NECESIDADES.length === 8, '8 necesidades');
ok(Object.keys(R.SERVICIOS).length === 11, '11 servicios');
const ids = R.NECESIDADES.map(n => n.id);
ok(Object.values(R.SERVICIOS).every(s => s.cubre.every(c => ids.includes(c))), 'cada servicio cubre necesidades que existen');
ok(ids.every(id => Object.values(R.SERVICIOS).some(s => s.cubre.includes(id))), 'cada necesidad la cubre algún servicio');
ok(Object.values(R.PESOS).every(f => Math.abs(Object.values(f).reduce((a, b) => a + b, 0) - 1) < 1e-9 && ids.every(id => id in f)), 'cada fila de pesos suma 1 y tiene las 8 claves');

// 2. alcance por calle
const casas = [{ id: 'a', celda: cel(15, 9), barrio: 1 }, { id: 'b', celda: cel(17, 9), barrio: 1 }, { id: 'c', celda: cel(24, 9), barrio: 1 }, { id: 'd', celda: cel(21, 9), barrio: 1 }];
const fuente = { id: 's1', tipo: 'fuente', celda: cel(5, 9) };   // puerta junto a la calle, a 5 pasos de la columna 5 con la calle de fila 10
let r = R.calcularAlcances(red, [{ id: 's1', tipo: 'fuente', celda: cel(6, 9) }], casas);
// fuente en (6,9): acceso (6,10). casa a (15,9): acceso (15,10): 9 pasos. casa (17,9): 11 pasos
ok(r.porCasa.a.agua === true, 'casa a 9 pasos de la fuente: tiene agua');
ok(!r.porCasa.b.agua, 'casa a 11 pasos de la fuente: no tiene agua');
ok(!r.porCasa.d.agua && !r.porCasa.c.agua, 'casa al otro lado del hueco sin calle: no tiene agua');
r = R.calcularAlcances(red, [{ id: 's2', tipo: 'fuente', celda: cel(12, 5) }], casas);
ok(r.porServicio.s2.length === 0, 'servicio sin calle al lado no llega a nada');
const tuberia = R.calcularAlcances(red, [{ id: 's3', tipo: 'mercado', celda: cel(6, 9) }], casas);
ok(tuberia.porServicio.s3.length >= 2 && tuberia.porCasa.a.alimento && tuberia.porCasa.a.trabajo, 'un mercado cubre alimento y trabajo');

// 3. 80 %
const cob = (n, tot) => { const c = Object.fromEntries(ids.map(i => [i, 0])); c.agua = n / tot; return c; };
const diez = Array.from({ length: 10 }, (_, i) => 'c' + i);
const pc = k => Object.fromEntries(diez.map((id, i) => [id, i < k ? { agua: true } : {}]));
ok(R.estadoNecesidad(R.coberturaBarrio(diez, pc(8)).agua) === 'cubierta', '8 de 10 casas: cubierta');
ok(R.estadoNecesidad(R.coberturaBarrio(diez, pc(7)).agua) === 'falta', '7 de 10 casas: falta');
ok(R.estadoNecesidad(R.coberturaBarrio(diez, pc(2)).agua) === 'mal', '2 de 10 casas: mal');
ok(Object.values(R.coberturaBarrio([], {})).every(v => v === 0), 'barrio sin casas: todo 0');

// 4. nivel
const conCubiertas = n => Object.fromEntries(ids.map((id, i) => [id, i < n ? 1 : 0]));
ok(R.nivelBarrio(conCubiertas(3)).id === 'chozas', '3 cubiertas: chozas');
ok(R.nivelBarrio(conCubiertas(4)).id === 'atrio', '4 cubiertas: atrio');
ok(R.nivelBarrio(conCubiertas(6)).id === 'insulas', '6 cubiertas: ínsulas');

// 5. ánimo
const todo = Object.fromEntries(ids.map(i => [i, 1])), nada = Object.fromEntries(ids.map(i => [i, 0]));
const sinAlim = { ...todo, alimento: 0 };
const cl = { ple: 100, ciu: 0, esc: 0 }, cc = { ple: 0, ciu: 100, esc: 0 };
ok(R.animo(sinAlim, cl) < R.animo(sinAlim, cc), 'la plebe sin alimento baja más que los ciudadanos');
ok(R.animo(todo, { ple: 50, ciu: 30, esc: 20 }) === 100, 'con todo cubierto, ánimo 100');
ok(R.animo(nada, { ple: 50, ciu: 30, esc: 20 }) === 0, 'sin nada, ánimo 0');
ok(R.animo(todo, { ple: 0, ciu: 0, esc: 0 }) === 100, 'sin personas: media simple');
ok(R.humor(60) === 'contento' && R.humor(39) === 'descontento' && R.humor(50) === 'normal', 'humor por umbrales');

// 6. estaciones duro
const mala = { ...nada, alimento: 0.5 };   // orden en 'mal', alimento 'falta'
let m = R.memoriaNueva(), e = R.estacion(m, mala, 10);
ok(!e.sucesos.some(s => s.tipo === 'consecuencia'), 'una estación descontento: sin consecuencia');
e = R.estacion(e.mem, mala, 10);
const cons = e.sucesos.filter(s => s.tipo === 'consecuencia');
ok(cons.length === 2 && cons.every(s => s.efecto), 'dos estaciones descontento: consecuencia con su efecto (máx. 2)');
ok(cons[0].efecto === 'fiebres' || cons[0].efecto === 'paran_obras' || cons[0].efecto === 'se_van', 'se empieza por la peor necesidad');
m = R.memoriaNueva();
const sinOrden = { ...todo, orden: 0 };
let evs = [];
for (let i = 0; i < 4; i++) { e = R.estacion(i ? e.mem : m, sinOrden, 90); evs = e.sucesos; }
ok(e.mem.revuelta && evs.some(s => s.tipo === 'revuelta' && s.necesidad === 'orden'), '4 estaciones con orden en mal: revuelta');
e = R.estacion(e.mem, todo, 90);
ok(e.mem.revuelta && e.sucesos.some(s => s.tipo === 'en_revuelta'), 'la revuelta no se va sola');
const c = R.calmar(e.mem, 'juegos');
ok(c.ok && !c.mem.revuelta && c.mem.desc === 0 && Object.keys(c.mem.mal).length === 0, 'calmar con juegos quita la revuelta');
ok(!R.calmar(R.memoriaNueva(), 'juegos').ok && !R.calmar(e.mem, 'rezos').ok, 'calmar sin revuelta o con remedio raro: no vale');

// 7. avisos
const un = R.estacion(R.memoriaNueva(), { ...nada, agua: 0.5 }, 10);
const f1 = R.fichaBarrio({ cobertura: { ...nada, agua: 0.5 }, clases: { ple: 10, ciu: 5, esc: 5 }, mem: un.mem });
ok(f1.avisos.some(t => /ministro de infraestructura|ministro de/.test(t) && /estaci/.test(t)), 'tras 1 estación descontento: aviso antes de la consecuencia con ministro: ' + f1.avisos[0]);
let mm = R.memoriaNueva();
for (let i = 0; i < 3; i++) mm = R.estacion(mm, sinOrden, 90).mem;
const f3 = R.fichaBarrio({ cobertura: sinOrden, clases: { ple: 10, ciu: 5, esc: 5 }, mem: mm });
ok(f3.avisos.some(t => /revuelta/.test(t) && /orden/.test(t)), 'tras 3 en mal: aviso de revuelta: ' + f3.avisos[0]);
ok(f3.necesidades.length === 8, 'la ficha trae las 8 necesidades');
const fr = R.fichaBarrio({ cobertura: sinOrden, clases: { ple: 1, ciu: 1, esc: 1 }, mem: { desc: 0, mal: {}, revuelta: true } });
ok(fr.avisos.some(t => /En revuelta/.test(t)), 'en revuelta: aviso de cálmala');

// 8. remedio
const hogares = [{ id: 'h1', celda: cel(8, 9) }, { id: 'h2', celda: cel(9, 9) }, { id: 'h3', celda: cel(10, 9) }, { id: 'h4', celda: cel(5, 25) }];
const sinNada = Object.fromEntries(hogares.map(h => [h.id, {}]));
const rem = R.remedio(red, hogares, sinNada, 'agua', [cel(5, 26), cel(9, 9)]);
ok(rem.servicio === 'fuente' && rem.celda === cel(9, 9) && rem.casas === 3 && rem.ministro === 'infraestructura', 'remedio elige el candidato que cubre más casas');
const rem0 = R.remedio(red, hogares, sinNada, 'agua', []);
ok(rem0.celda === null && rem0.casas === 0 && rem0.servicio === 'fuente', 'remedio sin candidatos: servicio más barato, sin celda');
const fr2 = R.fichaBarrio({ cobertura: { ...Object.fromEntries(ids.map(i => [i, 0.25])), agua: 0.2 }, clases: { ple: 1, ciu: 1, esc: 1 }, mem: { desc: 1, mal: {}, revuelta: false }, remedios: [{ ...rem, necesidad: 'agua' }] });
ok(fr2.avisos.some(t => /cubriría 3 casas/.test(t)), 'el aviso usa el remedio: ' + fr2.avisos[0]);

// 9. pureza
const antes = JSON.stringify(m = { desc: 1, mal: { orden: 2 }, revuelta: true });
R.estacion(m, sinOrden, 10); R.calmar(m, 'grano');
ok(JSON.stringify(m) === antes, 'estacion y calmar no cambian la memoria recibida');
const al = R.calcularAlcances(red, [fuente], casas);
ok(JSON.stringify(JSON.parse(JSON.stringify(al))) === JSON.stringify(al), 'calcularAlcances pasa por JSON igual');

// 10. redDeCiudad
const E = { ocup: new Uint8Array(N * N) };
for (let i = 0; i < N; i++) E.ocup[10 * N + i] = 1;
const rc = R.redDeCiudad(E);
ok(rc.N === N && rc.esCalle(10 * N + 3) && !rc.esCalle(3), 'redDeCiudad con un E falso funciona');
ok(R.accesos(rc, 9 * N + 3)[0] === 10 * N + 3, 'accesos: la casa toca la calle');

console.log(fallos.length ? '\n' + fallos.length + ' FALLOS' : '\ntodo bien');
process.exit(fallos.length ? 1 : 0);
