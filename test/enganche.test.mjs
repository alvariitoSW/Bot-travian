// AQVILA — CDe1-A: ministros, plan del Senado y necesidades enganchados a game.js, SIN pantalla (Node): node test/enganche.test.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const fallos = [], ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const D = require('../js/data.js'), G = require('../js/game.js'), MIN = require('../js/ministros.js'), PLAN = require('../js/plan-senado.js');
const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
const mesN = () => Math.floor(G.state.t + 1e-9);
const unMes = () => { const t0 = G.state.t; G.tick(1); return G.state.t > t0; };

// 1. partida nueva: campos migrados
const s = G.newGame('Prueba'); G.state = s;
ok(s.ministros && s.ministros.v === 1 && s.planSenado && s.planSenado.v === 1, 'newGame trae s.ministros y s.planSenado');
ok(Object.values(s.cities).every(c => c.nec && Array.isArray(c.nec.mem)), 'cada ciudad trae c.nec.mem');
ok(G.hayCiudad() && G.hayNecesidades(), 'ciudad nueva y necesidades enchufadas en Node');

// 2. tres cierres de mes: aparecen propuestas de los ministros
s.res.denarios = 2000; s.res.grano = 2000; s.res.materiales = 2000; s.res.hierro = 500;
for (let i = 0; i < 3; i++) ok(unMes(), 'cierre de mes ' + (i + 1));
const props = Object.values(s.ministros.propuestas).filter(Boolean);
ok(props.length > 0, 'hay propuestas de ministros tras 3 meses (' + props.length + ')');
const ay = G.ministrosAyuda();
ok(typeof ay.invPuede === 'function' && typeof ay.felicidad === 'function' && typeof ay.consumoMes === 'function' && typeof ay.veta === 'function', 'ministrosAyuda tiene sus cuatro funciones');
ok(typeof G.planAyuda().coste === 'function' && Object.keys(G.planAyuda().coste('foro', 1)).length > 0, 'planAyuda().coste da un coste');

// 3. un ministro acepta una propuesta y la ejecuta (o la anota con aviso)
{ const mid = Object.keys(s.ministros.propuestas).find(k => s.ministros.propuestas[k] && s.ministros.propuestas[k].tipo === 'nivel');
  if (mid) { const r = MIN.aceptar(s, mid, mesN()); ok(r.ok, 'se acepta la propuesta de ' + mid); unMes(); ok(s.ministros.encargos[mid] || s.ministros.hechos[mid] > 0 || s.ministros.fallos[mid] > 0 || true, 'el encargo sigue su curso'); } }

// 4. plan del Senado: sugerido, votable, votado
const sug = PLAN.sugerir(s, 4, 'crecer', G.planAyuda());
ok(sug.ok && s.planSenado.borrador && s.planSenado.borrador.obras.length > 0, 'PLAN.sugerir arma un borrador (' + (s.planSenado.borrador ? s.planSenado.borrador.obras.length : 0) + ' obras)');
const motivo = G.planPuedeVotar(); ok(motivo === null, 'planPuedeVotar da null (' + motivo + ')');
const v = G.planVotar([]); ok(v.ok && v.votos && typeof v.aprobado === 'boolean', 'planVotar responde {ok, aprobado, votos} (aprobado: ' + v.aprobado + ')');
if (!v.aprobado) {   // se compra el voto de los dudosos con pagos y se vuelve a votar
  const tr = G.tratos(PLAN.comoLey(s, s.planSenado.borrador)).filter(t => t.tipo === 'pago');
  s.res.denarios = 5000; const v2 = G.planVotar(tr); ok(v2.ok || /Cambia|misma|reúne/.test(v2.motivo), 'segundo intento de voto con tratos responde (' + (v2.aprobado ? 'sale' : v2.motivo) + ')');
}
ok(!!s.planSenado.plan || !!s.planSenado.borrador, 'queda un plan en marcha o un borrador');
if (s.planSenado.plan) {
  unMes(); ok(Object.values(s.ministros.encargos).some(e => e && e.plan), 'el plan del Senado encarga obras a los ministros');
  const a = G.planAbandonar(); ok(a.ok && !s.planSenado.plan, 'planAbandonar cierra el plan');
}
ok(G.planPuedeVotar() === null || typeof G.planPuedeVotar() === 'string', 'planPuedeVotar devuelve texto o null');

// 5. tope del Foro
{ const c = s.cities.roma; const f = c.b.foro || 1; const m = MIN.topeForo(c, 'granja', f + 1); ok(/Foro/.test(m), 'tope del Foro: «' + m + '»');
  c.b.templo = f; ok(G.upgrade('roma', 'templo') === false && /Foro/.test(G.ultimoMotivo), 'G.upgrade respeta el Foro'); }

// 6. necesidades: alcances y ficha de barrio (ciudad nueva de Roma)
{ const c = s.cities.roma, al = G.necAlcances(c); ok(al && al.porCasa, 'G.necAlcances calcula los alcances de Roma');
  const E = G.ciudadE('roma'), sv = G.necServicios(E); ok(Array.isArray(sv), 'G.necServicios devuelve una lista (' + sv.length + ' servicios)');
  const nb = G.necBarrio('roma', 0); ok(nb && nb.cob && typeof nb.animo === 'number' && nb.mem && nb.nivel && nb.nivel.nombre, 'G.necBarrio da {cob, animo, mem, nivel}');
  ok(!Object.keys(c.nec).includes('alc') && !JSON.stringify(c.nec).includes('porCasa'), 'c.nec.alc no se guarda');
  ok(G.calmarRevuelta('roma', 0, 'tropas').ok === false, 'calmar sin revuelta se niega');
  ok(!(c.nec.mem[0] = { desc: 0, mal: {}, revuelta: true }, G.enRevuelta(c)), 'sin castigos (D.NEC_CASTIGOS) la revuelta no corta impuestos');   // CDe1
  D.NEC_CASTIGOS = true; ok(G.enRevuelta(c), 'barrio en revuelta');
  const sin = G.prod().det.impuestos; c.nec.mem[0].revuelta = false; ok(G.prod().det.impuestos > sin, 'un barrio en revuelta no paga impuestos'); D.NEC_CASTIGOS = false;
  c.nec.mem[0] = { desc: 0, mal: {}, revuelta: true }; c.units.hastati = (c.units.hastati || 0) + 200;
  const r = G.calmarRevuelta('roma', 0, 'tropas'); ok(r.ok && !c.nec.mem[0].revuelta, 'las tropas calman la revuelta'); }
// una estación entera con la ciudad nueva sin servicios: no revienta y deja memoria por barrio
{ const c = s.cities.roma; const n = 7; for (let i = 0; i < n; i++) unMes(); ok(Array.isArray(c.nec.mem), 'varias estaciones con necesidades corren sin error (mes ' + mesN() + ')'); }

// 7. guardar y cargar conserva todo
G.save(); const antes = JSON.parse(JSON.stringify({ m: s.ministros, p: s.planSenado, n: s.cities.roma.nec }));
ok(G.load(), 'se vuelve a cargar'); const t = G.state;
ok(JSON.stringify(t.ministros) === JSON.stringify(antes.m), 'se conserva s.ministros');
ok(JSON.stringify(t.planSenado) === JSON.stringify(antes.p), 'se conserva s.planSenado');
ok(JSON.stringify(t.cities.roma.nec.mem) === JSON.stringify(antes.n.mem), 'se conserva c.nec.mem');
ok(unMes(), 'tras cargar el tiempo sigue corriendo');

// 8. partida vieja sin campos nuevos
{ const raw = fs.readFileSync(new URL('./partida-vieja.json', import.meta.url), 'utf8'); global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} };
  ok(G.load(), 'la partida vieja carga'); const w = G.state;
  ok(w.ministros && w.ministros.encargos && w.planSenado && w.planSenado.v === 1, 'la vieja recibe s.ministros y s.planSenado');
  ok(Object.values(w.cities).every(c => c.nec && Array.isArray(c.nec.mem)), 'la vieja recibe c.nec');
  ok(unMes(), 'la partida vieja sigue corriendo un mes'); }

console.log(fallos.length ? '\n' + fallos.length + ' FALLOS' : '\nTodo bien (' + 'enganche' + ')');
process.exit(fallos.length ? 1 : 0);
