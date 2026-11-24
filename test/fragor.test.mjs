/* SON7: el director del fragor (js/gfx/fragor.js). node test/fragor.test.mjs */
import { createRequire } from 'module';
const F = createRequire(import.meta.url)('../js/gfx/fragor.js');
let mal = 0; const ok = (c, m) => { if (!c) { mal++; console.log('MAL  ' + m); } else console.log('bien ' + m); };
const corre = (seg, e, f = F.nuevo(3), dt = 1 / 60) => { const todo = []; for (let t = 0; t < seg; t += dt) { const x = typeof e === 'function' ? e(t) : e; for (const s of F.paso(f, dt, x)) todo.push({ ...s, t }); } return { f, todo }; };

/* 1. sin lucha y sin bajas: silencio (solo suenan los golpes cuando hay contacto) */
{ const { todo } = corre(20, { lucha: 0, moral: 0.8, caen: 0, caenR: 0 }); ok(todo.length === 0, 'sin lucha no suena nada (' + todo.length + ')'); }

/* 2. lucha plena: golpes entre 3 y 12 por segundo, de todos los tipos, cerca y lejos */
{ const { todo, f } = corre(30, { lucha: 1, moral: 0.7, caen: 0, caenR: 0 });
  const golpes = todo.filter(s => F.GOLPES.some(([g]) => g === s.g)), ps = golpes.length / 30;
  ok(ps >= 3 && ps <= F.MAX_GOLPES, 'lucha plena: ' + ps.toFixed(1) + ' golpes/s');
  ok(F.GOLPES.every(([g]) => golpes.some(s => s.g === g)), 'suenan los cinco golpes (escudo, empuje, hierro, tajo, madera)');
  ok(golpes.some(s => s.capa === 'cerca') && golpes.some(s => s.capa === 'lejos'), 'unos cerca y otros lejos');
  ok(golpes.every(s => s.v > 0 && s.v <= 0.8 && Math.abs(s.pan) <= 1), 'volúmenes y paneo en rango');
  ok(f.nivelLucha > 0.6, 'el bucle de lucha sube (' + f.nivelLucha.toFixed(2) + ')'); }

/* 3. más lucha y peor moral = más golpes (la tensión manda) */
{ const n = (l, m) => corre(30, { lucha: l, moral: m }).todo.filter(s => F.GOLPES.some(([g]) => g === s.g)).length;
  const a = n(0.4, 0.9), b = n(1, 0.9), c = n(1, 0.2); ok(a < b && b < c, 'crece con la lucha y con el miedo: ' + a + ' < ' + b + ' < ' + c); }

/* 4. cada caído se oye caer, sin pasar de 3 por segundo */
{ const { todo } = corre(20, t => ({ lucha: 1, moral: 0.6, caen: Math.floor(t / 2), caenR: Math.floor(t / 1.5) }));
  const caidas = todo.filter(s => s.g === 'caida'); ok(caidas.length >= 18 && caidas.length <= 24, 'caídas oídas: ' + caidas.length + ' (bajas 9 + 13)');
  let peor = 0; for (const c of caidas) peor = Math.max(peor, caidas.filter(d => d.t >= c.t && d.t < c.t + 1).length);
  ok(peor <= F.MAX_CAIDAS, 'nunca más de ' + F.MAX_CAIDAS + ' caídas en un segundo (' + peor + ')'); }

/* 5. una matanza de golpe no amontona: 40 bajas a la vez → como mucho 4 caídas seguidas */
{ const { todo } = corre(5, t => ({ lucha: 1, moral: 0.6, caen: 0, caenR: t > 1 ? 40 : 0 })); const n = todo.filter(s => s.g === 'caida').length;
  ok(n >= 3 && n <= 5, '40 bajas de golpe: ' + n + ' caídas'); }

/* 6. gritos de masa: con calma entre ellos */
{ const { todo } = corre(90, t => ({ lucha: 1, moral: t > 45 ? 0.15 : 0.7, caen: Math.floor(t), caenR: Math.floor(t * 1.4) }));
  const m = todo.filter(s => ['clamor', 'panico', 'aclamacion'].includes(s.g)); let junto = false;
  for (let i = 1; i < m.length; i++) if (m[i].t - m[i - 1].t < F.CALMA_MASA - 0.01) junto = true;
  ok(m.length >= 2 && !junto, 'gritos de masa: ' + m.length + ' (' + m.map(s => s.g).join(', ') + '), separados ≥ ' + F.CALMA_MASA + ' s');
  ok(m.some(s => s.g === 'panico'), 'con la moral por los suelos se oye el pánico'); }

/* 7. misma semilla, mismo sonido */
{ const a = corre(10, { lucha: 0.8, moral: 0.5 }, F.nuevo(9)).todo.map(s => s.g).join(), b = corre(10, { lucha: 0.8, moral: 0.5 }, F.nuevo(9)).todo.map(s => s.g).join(); ok(a === b, 'determinista con la semilla'); }

/* 8. la primera lectura no cuenta las bajas que ya había (entrar en una batalla empezada no suelta 30 caídas) */
{ const { todo } = corre(3, { lucha: 0, moral: 0.8, caen: 30, caenR: 30 }); ok(todo.length === 0, 'bajas previas no suenan'); }

console.log(mal ? 'MAL: ' + mal : 'fragor: todo bien'); process.exit(mal ? 1 : 0);
