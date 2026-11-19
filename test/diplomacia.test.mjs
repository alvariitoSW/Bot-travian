// AQVILA — C3: diplomacia sencilla e IA que construye. node test/diplomacia.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const DIP = require('../js/diplomacia.js');
let mal = 0; const ok = (c, t) => { if (!c) mal++; console.log((c ? 'bien  ' : 'MAL   ') + t); };
const s = G.newGame('Test'); const ciu = f => Object.keys(s.cities).filter(i => s.cities[i].owner === f);
s.res.denarios = 1000; s.t = 0;
// alianza
ok(G.dipMotivoAlianza('cartago') && /no pacta/.test(G.dipMotivoAlianza('cartago')), 'Cartago no es elegible');
const f = ['aquea', 'etruscos', 'iberos', 'siracusa'].find(x => ciu(x).length);
for (const i of ciu(f)) s.cities[i].units = { hoplitas: 5000 };
const oro0 = s.res.denarios, r = G.dipAlianza(f);
ok(r.ok && G.dipEstado(f) === 'alianza' && s.res.denarios === oro0 - 150, 'alianza con ' + f + ' por 150');
ok(DIP.pacifica(s, f) && DIP.ingresoMes(s) === 20, 'aliado: +20 oro/mes y no incursiona');
const ciudadAliada = ciu(f)[0], desde = G.myCities()[0];
ok(G.send(desde, ciudadAliada, { hastati: 1 }, false) === false, 'no se puede atacar a un aliado sin romper');
ok(G.dipRomper(f) && !G.dipEstado(f), 'romper la alianza');
// rechazo: débil, conquista reciente, sin oro
for (const i of ciu(f)) s.cities[i].units = { hoplitas: 1 };
ok(/débil/.test(G.dipMotivoAlianza(f) || ''), 'rechaza si es demasiado débil');
for (const i of ciu(f)) s.cities[i].units = { hoplitas: 5000 };
DIP.conquista(s, f); s.t = 5; ok(/hace menos de 2 años/.test(G.dipMotivoAlianza(f) || ''), 'rechaza si Roma le tomó una ciudad hace poco');
s.t = 30; ok(G.dipMotivoAlianza(f) === null, 'a los 24 meses ya acepta');
s.res.denarios = 10; s.alm.denarios = 0; ok(/150/.test(G.dipMotivoAlianza(f) || ''), 'rechaza sin oro'); s.res.denarios = 1000;
// tributo
const car = ciu('cartago'); ok(car.length > 2 && /Aún tiene/.test(G.dipMotivoTributo('cartago')), 'Cartago con muchas ciudades no paga tributo');
for (const i of car.slice(2)) s.cities[i].owner = 'roma';
const t = G.dipTributo('cartago'); ok(t.ok && t.mensual === 50, 'Cartago con 2 ciudades: tributo 50/mes');
const g0 = s.alm.denarios + s.res.denarios; G.cierreMes(); ok(s.alm.denarios >= g0 + 49, 'el cierre de mes cobra el tributo'); ok(DIP.ingresoMes(s) === 50, 'ingreso mensual por tributo 50');
ok(DIP.pacifica(s, 'cartago'), 'el tributario no incursiona');
// IA construye
const idC = ciu('cartago')[0]; const c = s.cities[idC]; const w = c.w || D.CITIES[idC].w; const m0 = c.b.muralla || 0;
s.cities[idC].owner = 'cartago'; for (const i of car.slice(2)) s.cities[i].owner = 'cartago';
const otra = Object.keys(s.cities).find(i => s.cities[i].owner === 'etruscos' || s.cities[i].owner === 'siracusa');
DIP.construye(s, idC); s.t += 37; ok(DIP.construye(s, idC) && c.b.muralla === m0 + 1, 'la IA sube 1 de muralla cada 3 años');
for (let i = 0; i < 20; i++) { s.t += 37; DIP.construye(s, idC); } ok(c.b.muralla === Math.max(m0, w + 2), 'tope de muralla = w+2 (' + c.b.muralla + ')');
const solo = ciu('cartago'); for (const i of solo.slice(1)) s.cities[i].owner = 'roma'; s.cities[solo[0]].murT = -100; ok(!DIP.construye(s, solo[0]), 'con 1 ciudad la facción no construye');
// migración
const v = JSON.parse(JSON.stringify(s)); delete v.dip; delete v.dipConq; DIP.migrar(v); ok(v.dip && v.dipConq && DIP.ingresoMes(v) === 0, 'partida vieja sin s.dip se migra');
process.exit(mal ? 1 : 0);
