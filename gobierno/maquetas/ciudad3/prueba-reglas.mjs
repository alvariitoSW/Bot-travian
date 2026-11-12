// Maqueta Q1k — prueba de las reglas SIN pantalla (Node): node gobierno/maquetas/ciudad3/prueba-reglas.mjs
// Funda, coloca cada ficha en su mejor sitio y deja pasar 5 años. Falla (código 1) si algo básico no se cumple.
import * as R from './reglas.js';
const E = R.crear(+(process.argv[2] || 1)), fallos = [], ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const loma = R.notaFundar(E, 160, 20), ribera = R.notaFundar(E, 200, -320), alto = R.notaFundar(E, 172, -196);
ok(loma.razones.some(t => /loma/.test(t)), 'en la loma se defiende mejor: ' + loma.razones.join(' · '));
ok(ribera.razones.some(t => /inunda/.test(t)), 'la ribera baja se inunda: ' + ribera.razones.join(' · '));
ok(!R.notaFundar(E, 100, -450).vale, 'en el agua no se funda');
ok(R.fundar(E, 172, -196), 'se funda en ' + alto.razones.join(' · '));
let e = R.estado(E); ok(e.casas === 20 && e.vias === 3 && e.puertas >= 2, `al fundar: ${e.casas} chozas, ${e.vias - 1} calles del foro, ${e.puertas} puertas`);
const pon = id => { const s = R.mejorSitio(E, id); const r = s && R.colocar(E, id, s[0], s[1], true); return !!(r && r.ok); };
ok(!R.notaSitio(E, 'granja', E.foro.x + 60, E.foro.z).vale, 'la granja no vale dentro del surco'); ok(!R.notaSitio(E, 'muelle', E.foro.x, E.foro.z + 40).vale, 'el muelle solo vale en la orilla');
ok(pon('fuente') && pon('granero') && pon('granja'), 'fuente, granero y granja colocados'); const v0 = E.vias.length;
const sucesos = {}; for (let i = 1; i <= 60; i++) { for (const a of R.mes(E)) { const k = /Crecida/.test(a.t) ? 'crecida' : /Incendio/.test(a.t) ? 'incendio' : /apagó/.test(a.t) ? 'fuego apagado' : /hambre/.test(a.t) ? 'hambre' : /Nueva obra/.test(a.t) ? 'ficha' : ''; if (k) sucesos[k] = (sucesos[k] || 0) + 1; }
  if (i === 6) pon('templo'); if (i === 10) pon('mercado'); if (i === 14) { pon('taller'); pon('muelle'); pon('fuente'); } if (i === 16) R.levantarMuralla(E, true); if (i === 22) { pon('compitum'); pon('granja'); } if (i === 28) R.levantarMuralla(E, true); }
e = R.estado(E); console.log(JSON.stringify(e, null, 1)); console.log('sucesos en 5 años:', JSON.stringify(sucesos));
ok(e.casas > 80 && e.casas <= 200, e.casas + ' casas nacidas solas'); ok(e.callejones > 5, e.callejones + ' callejones salidos solos'); ok(e.niveles[2] + e.niveles[3] > 10, 'hay casas de nivel III y IV: ' + e.niveles.join('/'));
ok(e.empedradas > 0, e.empedradas + ' calles empedradas'); ok(e.muralla.fase === 2, 'muralla de piedra'); ok(e.barrios.length === 2, 'dos barrios'); ok(e.abiertas.length === 9, 'las 9 fichas abiertas'); ok(sucesos.crecida >= 4, 'crecidas de primavera');
process.exit(fallos.length ? 1 : 0);
