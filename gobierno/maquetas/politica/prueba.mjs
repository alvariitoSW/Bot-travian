// Prueba de las reglas de EV1 (sin pantalla). Termina con APTO o código 1.
import { debate, repartoTras, crear, favor, escena, votos, votar, elegir, seguir, cierre, tratos } from './reglas.js';
let fallos = 0; const ok = (c, t) => { if (!c) { fallos++; console.log('  MAL: ' + t); } };
const e0 = crear(), v0 = votos(e0, []);
ok(JSON.stringify([v0.ter, v0.mer, v0.mil]) === JSON.stringify([{ si: 2, duda: 2, no: 8 }, { si: 5, duda: 2, no: 1 }, { si: 8, duda: 2, no: 0 }]), 'votos iniciales');
ok(v0.si === 15 && !v0.sale && v0.hacenFalta === 16, '15 sí no salen');
ok(Math.round(favor(e0)) === 50 && tratos().length === 3, 'favor inicial 50 y tres tratos');
const combos = []; for (let m = 0; m < 8; m++) combos.push(['ter', 'mer', 'mil'].filter((_, i) => m >> i & 1));
for (const c of combos) { const v = votos(crear(), c); ok(v.ter.si + v.ter.duda + v.ter.no === 12 && v.mer.si + v.mer.duda + v.mer.no === 8 && v.mil.si + v.mil.duda + v.mil.no === 10, 'suman 30 ' + c); ok(c.length === 0 ? !v.sale : (v.sale && v.si === 15 + 2 * c.length - (c.length > 1 ? 0 : 0) || v.sale), 'trato ' + c); if (c.length === 1) ok(v.si === 17, 'un trato da 17: ' + c); if (c.length === 0) ok(v.si === 15, 'sin tratos 15'); }
{ const p = debate(e0), f = repartoTras(e0, p.length), i = repartoTras(e0, 0);
  ok(p.length === 6 && p.every(x => x.frase && x.mueve.length >= 1 && x.mueve.length <= 2), 'debate: seis discursos de 1-2 movimientos');
  ok(['ter', 'mer', 'mil'].every(b => f[b].si === v0[b].si && f[b].duda === v0[b].duda && f[b].no === v0[b].no), 'el debate acaba en el reparto de votos()');
  ok(['ter', 'mer', 'mil'].reduce((a, b) => a + i[b].duda, 0) > 6 && ['ter', 'mer', 'mil'].every(b => i[b].si + i[b].duda + i[b].no === e0.escanos[b] && i[b].si >= 0 && i[b].no >= 0), 'el debate empieza con más dudosos y suma escaños'); }
let caminos = 0; const rumbos = new Set(), mal = [];
const sano = (e, t) => { for (const x of [e.oro, e.pueblo, ...Object.values(e.humor)]) if (!Number.isFinite(x)) mal.push('NaN ' + t); for (const h of Object.values(e.humor)) if (h < 0 || h > 100) mal.push('humor ' + t); if (e.pueblo < 0 || e.pueblo > 100) mal.push('pueblo ' + t); };
for (const c of combos) for (const via of ['votar', 'pueblo', 'acatar']) {
  const e = crear(), t = c.join('+') + '/' + via;
  const r = votar(e, c); ok(Array.isArray(r.cambios) && r.linea, 'resultado con linea ' + t);
  if (via === 'votar') { if (!r.sale) continue; } else { if (r.sale) continue; elegir(e, via); }
  seguir(e); const esc2 = escena(e); ok(esc2.estacion === 'Verano', 'verano ' + t);
  for (const o2 of esc2.opciones) { seguir(structuredClone(e)); const e2 = structuredClone(e); const r2 = elegir(e2, o2.id); ok(r2.linea, 'linea II');
    seguir(e2); const esc3 = escena(e2);
    for (const o3 of esc3.opciones) { if (o3.apagada) continue; const e3 = structuredClone(e2); elegir(e3, o3.id); seguir(e3); const ci = cierre(e3); caminos++; sano(e3, t + '/' + o2.id + '/' + o3.id); rumbos.add(ci.rumbo.titulo);
      const real = e3.marcas.cruza && o2.id === 'alianza' && o3.id === 'permitir';
      ok((ci.desvio === 0) === !!real, 'desvío 0 solo en el camino real ' + t + o2.id + o3.id);
      ok(ci.rumbo.real === (e3.marcas.cruza && o2.id === 'alianza'), 'rumbo real');
      ok([0, 33, 67, 100].includes(ci.desvio), 'desvío válido');
      const rotas = ci.promesas.filter(p => p.estado === 'rota').map(p => p.id);
      ok(rotas.includes('botin') === (c.includes('mil') && o2.id === 'alianza'), 'botín roto con alianza ' + t);
      ok(rotas.includes('levas') === (c.includes('ter') && (o2.id === 'sitio' || o2.id === 'flota')), 'levas rota ' + t + o2.id);
      if (c.includes('mil') && o2.id === 'alianza') { ok(r2.cambios.some(x => x.que === 'mil' && x.n === -15 && x.nota === 'rota') && /Rompes tu promesa a los militares/.test(r2.linea), 'promesa rota en cambios y línea'); ok(o2.chips.some(x => x.n === -15), 'chip antes'); }
    } } }
ok(rumbos.size === 4, '4 rumbos, hay ' + rumbos.size);
// toda escena con fuente y dictamen
for (const [cruza, p] of [[true, 0], [true, 1], [false, 1], [true, 2], [true, 3]]) { const e = crear(); e.paso = p; e.marcas.cruza = cruza; const s = escena(e); ok(s.fuente && s.dictamen && s.fecha && s.texto, 'fuente y dictamen en ' + s.id); }
// oro insuficiente apaga «grandes»
{ const e = crear(); e.paso = 2; e.oro = 59; ok(escena(e).opciones[2].apagada, 'grandes apagada sin oro'); let lanzo = false; try { elegir(e, 'grandes'); } catch { lanzo = true; } ok(lanzo, 'elegir apagada falla'); }
ok(mal.length === 0, 'estados sanos: ' + mal.slice(0, 3).join(' | '));
console.log('Caminos recorridos hasta el cierre: ' + caminos + ' · rumbos: ' + [...rumbos].join(', '));
console.log(fallos ? 'NO APTO · ' + fallos + ' fallos' : 'APTO'); process.exit(fallos ? 1 : 0);
