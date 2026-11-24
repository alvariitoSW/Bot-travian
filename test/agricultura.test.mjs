// AQVILA — pruebas de js/agricultura.js SIN pantalla (Node): node test/agricultura.test.mjs
import * as A from '../js/agricultura.js';
let n = 0, bien = 0;
const ok = (c, t) => { n++; if (c) bien++; console.log((c ? 'bien  ' : 'MAL   ') + t); };
const cerca = (a, b) => Math.abs(a - b) < 1e-9;
const copia = o => JSON.parse(JSON.stringify(o));

// 1. clasificarSuelo
ok(A.clasificarSuelo({ pend: 0.02, distAgua: 30, altAgua: 3, solana: 0 }) === 'ribera', 'ribera: cerca del agua y plano');
ok(A.clasificarSuelo({ pend: 0.02, distAgua: 200, altAgua: 1.5, solana: 0 }) === 'baja', 'baja: casi a nivel del río');
ok(A.clasificarSuelo({ pend: 0.02, distAgua: 200, altAgua: 10, solana: 0, pobre: true }) === 'baja', 'baja: tierra pobre');
ok(A.clasificarSuelo({ pend: 0.02, distAgua: 200, altAgua: 10, solana: 0 }) === 'llano', 'llano');
ok(A.clasificarSuelo({ pend: 0.2, distAgua: 200, altAgua: 20, solana: 0.8 }) === 'ladera_sol', 'ladera al sol');
ok(A.clasificarSuelo({ pend: 0.2, distAgua: 200, altAgua: 20, solana: 0.2 }) === 'ladera_seca', 'ladera seca');

// 2. tabla de 25 casillas
const T = { trigo: { llano: 'bien', ladera_seca: 'no', ladera_sol: 'mal', ribera: 'regular', baja: 'mal' },
  olivar: { llano: 'regular', ladera_seca: 'bien', ladera_sol: 'regular', ribera: 'no', baja: 'no' },
  vina: { llano: 'mal', ladera_seca: 'regular', ladera_sol: 'bien', ribera: 'no', baja: 'no' },
  huerto: { llano: 'regular', ladera_seca: 'no', ladera_sol: 'no', ribera: 'bien', baja: 'regular' },
  pasto: { llano: 'regular', ladera_seca: 'regular', ladera_sol: 'mal', ribera: 'regular', baja: 'bien' } };
const R = { bien: 1, regular: 0.6, mal: 0.3, no: 0 };
let casillas = 0, todas = true;
for (const c in T) for (const s in T[c]) { const e = A.encaje(c, s); casillas++; if (e.nota !== T[c][s] || e.rinde !== R[e.nota] || !e.razon) todas = false; }
ok(casillas === 25 && todas, 'tabla del diseño: las 25 casillas con nota, rinde y razón');
ok(/pudre/.test(A.encaje('olivar', 'ribera').razon) && /ladera/.test(A.encaje('huerto', 'ladera_sol').razon), 'las casillas «no» explican por qué');

// 3. consejo
const cs = A.consejo('ladera_sol');
ok(cs[0].campo === 'vina' && cs.every(x => x.nota !== 'no') && cs.length === 4 && cs.every((x, i) => !i || cs[i - 1].rinde >= x.rinde), 'consejo ladera al sol: viña primero, sin los «no», ordenado');
ok(A.consejo('llano')[0].campo === 'trigo' && A.consejo('baja')[0].campo === 'pasto', 'consejo: trigo en llano, pasto en tierra baja');

// 4. noria
ok(A.encaje('huerto', 'llano').nota === 'regular' && A.encaje('huerto', 'llano', ['noria']).nota === 'bien', 'noria: huerto en llano pasa a bien');
ok(A.encaje('huerto', 'baja', ['noria']).nota === 'bien' && A.encaje('huerto', 'ladera_seca', ['noria']).nota === 'no', 'noria: bien en baja, sigue sin poder en ladera');

// 5. labores
const cosechas = { trigo: [5, 6], olivar: [0, 10, 11], vina: [8, 9], huerto: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], pasto: [3, 4] };
let lab = true;
for (const c in cosechas) for (let m = 0; m < 12; m++) { const l = A.labor(c, m); if (l.cosecha !== cosechas[c].includes(m) || !l.nombre || !l.verbo || !l.id) lab = false; }
ok(lab, 'labor: cada campo cosecha justo en sus meses');
ok(A.labor('trigo', 5).id === 'siega' && A.labor('vina', 8).id === 'vendimia' && A.labor('pasto', 3).id === 'esquileo' && A.labor('olivar', 0).id === 'aceituna', 'labor: siega, vendimia, esquileo y aceituna');
ok(A.laborEstacion('trigo', 1).id === 'siega' && A.laborEstacion('olivar', 3).id === 'aceituna' && A.laborEstacion('vina', 2).id === 'vendimia' && A.laborEstacion('pasto', 0).id === 'esquileo', 'laborEstacion usa el mes central');
ok(A.labor('vina', 12).id === A.labor('vina', 0).id, 'labor: el mes da la vuelta al año');

// 6. mejoras
ok(A.mejorasDe('trigo').join() === 'estercolero,era' && A.mejorasDe('vina').length === 2 && A.mejorasDe('huerto')[0] === 'noria', 'mejorasDe');
ok(A.puedeMejorar({ campo: 'olivar', suelo: 'ladera_seca', mejoras: [] }, 'almazara').ok, 'puedeMejorar: almazara en olivar');
ok(!A.puedeMejorar({ campo: 'trigo', suelo: 'llano', mejoras: [] }, 'lagar').ok && !A.puedeMejorar({ campo: 'olivar', suelo: 'llano', mejoras: ['almazara'] }, 'almazara').ok && !A.puedeMejorar({ campo: 'trigo', suelo: 'llano' }, 'xx').ok, 'puedeMejorar: campo equivocado, repetida o inexistente');

// 7. producción anual
const olivar = { campo: 'olivar', suelo: 'ladera_seca', nivel: 2, mejoras: [] };
ok(cerca(A.produccionAnual(olivar).aceite, 10), 'olivar nivel 2 bien sin almazara: 10 × 2 × 0,5 = 10');
ok(cerca(A.produccionAnual({ ...olivar, mejoras: ['almazara'] }).aceite, 20), 'olivar con almazara: 20');
const vina = { campo: 'vina', suelo: 'ladera_sol', nivel: 1, mejoras: [] };
ok(cerca(A.produccionAnual(vina).vino, 5) && cerca(A.produccionAnual({ ...vina, mejoras: ['lagar'] }).vino, 10), 'viña: ×0,5 sin lagar, entera con lagar');
const trigo = { campo: 'trigo', suelo: 'llano', nivel: 3, mejoras: [] };
ok(cerca(A.produccionAnual(trigo).grano, 108), 'trigo nivel 3 en llano: 108');
ok(A.produccionAnual({ campo: 'olivar', suelo: 'ribera', nivel: 5 }).aceite === 0, 'donde no se puede, produce 0');

// 8. estercolero
const est = { ...trigo, mejoras: ['estercolero'] };
ok(cerca(A.produccionAnual(est).grano, 129.6), 'estercolero solo: ×1,2');
ok(cerca(A.produccionAnual(est, [{ campo: 'pasto', suelo: 'baja', nivel: 1, mejoras: [] }]).grano, 145.8), 'estercolero con pasto vecino: ×1,35');
ok(cerca(A.produccionAnual(est, [{ campo: 'pasto', mejoras: ['redil'] }]).grano, 145.8) && cerca(A.produccionAnual(est, [{ campo: 'huerto', mejoras: [] }]).grano, 129.6), 'estercolero con redil vecino ×1,35; con otro vecino ×1,2');

// 9. producción mensual
const parcelas = [trigo, olivar, { ...olivar, mejoras: ['almazara'] }, vina, { campo: 'huerto', suelo: 'ribera', nivel: 4, mejoras: ['noria'] }, { campo: 'pasto', suelo: 'baja', nivel: 2, mejoras: ['redil'] }];
let suma = true;
for (const p of parcelas) {
  const anual = A.produccionAnual(p), k = Object.keys(anual)[0];
  for (const rep of [true, false]) { let t = 0; for (let m = 0; m < 12; m++) t += A.produccionMes(p, m, [], { granoRepartido: rep })[k]; if (!cerca(t, anual[k])) suma = false; }
}
ok(suma, 'los 12 meses suman la producción anual (grano repartido o no)');
ok(cerca(A.produccionMes(trigo, 0)[ 'grano'], 9) && A.produccionMes(trigo, 0, [], { granoRepartido: false }).grano === 0 && cerca(A.produccionMes(trigo, 5, [], { granoRepartido: false }).grano, 54), 'grano: 1/12 al mes, o todo en la siega');
ok(A.produccionMes(olivar, 3).aceite === 0 && A.produccionMes(olivar, 10).aceite > 0 && A.produccionMes({ campo: 'huerto', suelo: 'ribera', nivel: 1 }, 7).verdura > 0, 'otros productos solo en meses de cosecha (el huerto, siempre)');

// 10. pérdida mensual
ok(A.perdidaMes('verdura') === 0.3 && A.perdidaMes('vino') === 0.07 && A.perdidaMes('vino', ['bodega']) === 0, 'perdidaMes: verdura 0,3; vino 0,07 sin bodega y 0 con ella');
ok(A.perdidaMes('grano') === 0 && A.perdidaMes('aceite') === 0 && A.perdidaMes('lana') === 0 && A.perdidaMes('xx') === 0, 'perdidaMes: el resto no se pierde');

// 11. productos, dieta y valor
const P = A.PRODUCTOS;
ok(Object.keys(P).join() === 'grano,aceite,vino,verdura,lana' && Object.values(P).every(p => !('precio' in p) && p.campo && p.nombre && Array.isArray(p.usos) && typeof p.alimento === 'number' && typeof p.estropea === 'number' && ['si', 'bodega', 'no'].includes(p.guarda)), 'PRODUCTOS: sin precio, con campo, guarda, estropea, usos y alimento');
ok(P.vino.guarda === 'bodega' && P.verdura.guarda === 'no' && P.grano.guarda === 'si' && P.verdura.estropea === 0.3 && P.vino.estropea === 0.07, 'PRODUCTOS: guarda y estropea');
ok(P.vino.suelos.join() === 'ladera_sol' && P.grano.suelos.join() === 'llano' && P.verdura.suelos.join() === 'ribera' && P.pasto === undefined && P.lana.suelos.join() === 'baja', 'PRODUCTOS.suelos sale de la tabla');
const d = A.dieta({ grano: 50, aceite: 20, verdura: 10 }, 100);
ok(d.variedad === 3 && d.faltan.join() === 'vino' && cerca(d.cubre, 0.68 + 0.1) && d.texto === 'Comen pan, aceite y verdura; falta vino.', 'dieta: variedad 3, +0,1 y texto');
ok(A.dieta({ grano: 500 }, 100).cubre === 1 && A.dieta({ grano: 50 }, 100).cubre === 0.5 && A.dieta({}, 10).texto === 'No comen nada.', 'dieta: tope 1, sin variedad, sin nada');
ok(A.dieta({ grano: 100, aceite: 100, vino: 100, verdura: 100 }, 100).texto === 'Comen pan, aceite, vino y verdura.', 'dieta completa');
const pr = { grano: 1, aceite: 5, vino: 6, verdura: 2, lana: 4 };
ok(A.valor({ grano: 10, aceite: 2, vino: 1, verdura: 5, lana: 3 }, pr) === 48 && A.valor({ grano: 10 }) === 0 && A.valor({ grano: 10, xx: 3 }, pr) === 10, 'valor: con los precios que se le dan; sin ellos 0');

// 11b. estación, oferta y ciudad
const sumaEst = [0, 1, 2, 3].reduce((a, e) => a + A.produccionEstacion(olivar, e).aceite, 0);
ok(cerca(sumaEst, A.produccionAnual(olivar).aceite) && cerca(A.produccionEstacion(olivar, 2).aceite, [8, 9, 10].reduce((a, m) => a + A.produccionMes(olivar, m).aceite, 0)), 'produccionEstacion: las 4 estaciones suman el año; otoño = meses 8-10');
ok(A.produccionEstacion(olivar, 3).aceite > 0 && A.produccionEstacion(olivar, 1).aceite === 0, 'produccionEstacion: invierno = meses 11, 0, 1 (aceituna)');
const of = A.ofertaPorEstacion('vina', 'ladera_sol');
ok(of.length === 4 && cerca(of.reduce((a, b) => a + b, 0), 5) && of[2] > 0 && of[0] === 0 && A.ofertaPorEstacion('olivar', 'ribera').every(x => x === 0), 'ofertaPorEstacion: 4 números, nivel 1 sin mejoras (vendimia en otoño)');
const sc = { agro: { v: 1, parcelas: [{ id: 'a', ciudad: 'roma', campo: 'trigo', suelo: 'llano', nivel: 1, mejoras: ['estercolero'] }, { id: 'b', ciudad: 'roma', campo: 'pasto', suelo: 'baja', nivel: 1, mejoras: [] }, { id: 'c', ciudad: 'capua', campo: 'trigo', suelo: 'llano', nivel: 1, mejoras: [] }] } };
const pc = A.produccionCiudad(sc, 'roma', 3);
ok(Object.keys(pc).join() === 'grano,aceite,vino,verdura,lana' && cerca(pc.grano, 36 * 1.35 / 12) && cerca(pc.lana, 8 / 2) && A.produccionCiudad(sc, 'nada', 3).grano === 0 && A.produccionCiudad({}, 'roma', 0).lana === 0, 'produccionCiudad: suma las parcelas de la ciudad, con vecinos y todas las claves');

// 12. encargos
const e0 = A.encargosAgricultura({ parcelas: [], libres: [{ id: 'l1', suelo: 'ladera_sol' }], almacen: { grano: 1000 }, bocas: 10, mes: 0 });
ok(e0.length === 1 && e0[0].tipo === 'campo' && e0[0].campo === 'vina' && e0[0].parcela === 'l1' && e0[0].texto === 'Plantar viña en la ladera al sol', 'encargo: plantar viña en la ladera al sol');
const e1 = A.encargosAgricultura({ parcelas: [{ id: 'p1', campo: 'olivar', suelo: 'ladera_seca', nivel: 1, mejoras: [] }], libres: [], almacen: { grano: 1000 }, bocas: 10, mes: 0 });
ok(e1.length === 1 && e1[0].tipo === 'mejora' && e1[0].mejora === 'almazara' && e1[0].texto === 'Poner almazara y prensa en el olivar', 'encargo: mejora que falta (almazara)');
const e2 = A.encargosAgricultura({ parcelas: [{ id: 'p2', campo: 'trigo', suelo: 'ladera_sol', nivel: 1, mejoras: [] }], libres: [], almacen: { grano: 1000 }, bocas: 10, mes: 0 });
ok(e2.length === 1 && e2[0].tipo === 'cambiar' && e2[0].campo === 'vina' && e2[0].texto === 'Cambiar el trigo de la ladera por viña', 'encargo: cambiar un campo mal puesto');
const e3 = A.encargosAgricultura({ parcelas: [{ id: 'a', campo: 'trigo', suelo: 'ladera_sol', mejoras: [] }, { id: 'b', campo: 'olivar', suelo: 'llano', mejoras: [] }, { id: 'c', campo: 'vina', suelo: 'ladera_sol', mejoras: [] }],
  libres: [{ id: 'l1', suelo: 'llano' }, { id: 'l2', suelo: 'baja' }], almacen: { grano: 0 }, bocas: 10, mes: 0 });
ok(e3.length === 3 && e3[0].tipo === 'reserva' && e3[0].recurso === 'grano' && e3[0].objetivo === 30, 'encargos: máximo 3, con la reserva de grano urgente la primera');
ok(A.encargosAgricultura({ parcelas: [], libres: [], almacen: { grano: 1000 }, bocas: 10 }).length === 0, 'encargos: nada que proponer, lista vacía');

// 13. migrar
const s1 = A.migrar({ oro: 5, bienes: { roma: { grano: 3 } } });
ok(s1.oro === 5 && s1.bienes.roma.grano === 3 && s1.agro.v === 1 && s1.agro.parcelas.length === 0 && !('almacen' in s1.agro) && JSON.stringify(s1.agro.villas) === '{}', 'migrar: crea agro {v, parcelas, villas} sin tocar el resto ni bienes');
const s2 = A.migrar({ agro: { v: 1, parcelas: [{ id: 'x', ciudad: 'roma' }] } });
ok(s2.agro.parcelas[0].id === 'x' && s2.agro.parcelas.length === 1, 'migrar: no pisa datos existentes');

// 14. no mutan
const ent = { parcela: copia(est), vec: [{ campo: 'pasto', mejoras: ['redil'] }], est: { parcelas: [{ id: 'a', campo: 'trigo', suelo: 'ladera_sol', mejoras: [] }], libres: [{ id: 'l', suelo: 'llano' }], almacen: { grano: 0 }, bocas: 10, mes: 3 }, prod: { grano: 5, vino: 3 }, mj: ['bodega'] };
const antes = JSON.stringify(ent);
A.produccionAnual(ent.parcela, ent.vec); A.produccionMes(ent.parcela, 5, ent.vec); A.perdidaMes('vino', ent.mj); A.produccionCiudad({ agro: { parcelas: [ent.parcela] } }, 'x', 3); A.produccionEstacion(ent.parcela, 1, ent.vec); A.ofertaPorEstacion('trigo', 'llano'); A.encargosAgricultura(ent.est);
A.dieta(ent.prod, 10); A.valor(ent.prod, pr); A.encaje('huerto', 'llano', ent.mj); A.consejo('llano', ent.mj); A.puedeMejorar(ent.parcela, 'era');
ok(JSON.stringify(ent) === antes, 'ninguna función cambia lo que recibe');
ok(Object.values(A.CAMPOS).every(c => c.d && c.fuente && c.nombre) && Object.values(A.SUELOS).every(s => s.d && s.nombre) && Object.values(A.MEJORAS).every(m => m.fuente && m.nombre), 'tablas con nombre, frase y fuente');

// 14. ciencia (usuario, 24/11)
ok(A.consejo('ladera_sol', [], []).every(x => x.campo !== 'vina' && x.campo !== 'olivar'), 'ciencia: sin «Viña y olivar» no se aconseja viña ni olivar');
ok(A.consejo('ladera_sol', [], ['vina'])[0].campo === 'vina' && A.consejo('ladera_sol')[0].campo === 'vina', 'ciencia: con el saber, o sin filtro, la viña vuelve');
ok(A.consejo('ladera_seca', [], []).length > 0 && A.consejo('ladera_seca', [], []).every(x => x.campo === 'pasto'), 'ciencia: en ladera seca sin saber queda el pasto');
ok(!A.puedeMejorar({ campo: 'huerto', suelo: 'ribera', mejoras: [] }, 'noria', { vina: true }).ok && /Magón/.test(A.puedeMejorar({ campo: 'huerto', suelo: 'ribera', mejoras: [] }, 'noria', []).motivo), 'ciencia: la noria pide el Tratado de Magón y lo dice');
ok(A.puedeMejorar({ campo: 'huerto', suelo: 'ribera', mejoras: [] }, 'noria', ['magon']).ok && A.puedeMejorar({ campo: 'trigo', suelo: 'llano', mejoras: [] }, 'era', []).ok, 'ciencia: con Magón hay noria; la era está abierta desde el principio');
ok(A.abierto('villa', []).falta === 'latif' && A.abierto('trigo', []).ok, 'ciencia: la villa pide «Villa esclavista»; el trigo, nada');
const sv = { agro: { v: 1, parcelas: [{ id: 'a', ciudad: 'roma', campo: 'trigo', suelo: 'llano', nivel: 1, mejoras: [] }], villas: { roma: 1 } } };
const sn = { agro: { v: 1, parcelas: sv.agro.parcelas, villas: {} } };
ok(Math.abs(A.produccionCiudad(sv, 'roma', 3).grano - A.produccionCiudad(sn, 'roma', 3).grano * 1.1) < 1e-9, 'villa: los campos de la ciudad rinden ×1,1');
const enc = A.encargosAgricultura({ parcelas: [], libres: [{ id: 'l1', suelo: 'ladera_sol' }], almacen: { grano: 999 }, bocas: 10, mes: 0, saberes: [] });
ok(enc.length && enc[0].campo !== 'vina', 'ciencia: el ministro no propone viña sin el saber');

console.log('\n' + bien + '/' + n);
process.exit(bien === n ? 0 : 1);
