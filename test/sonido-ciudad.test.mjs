// AQVILA — pruebas puras de js/gfx/sonido-ciudad.js (Node, sin audio): node test/sonido-ciudad.test.mjs
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../js/gfx/sonido-ciudad.js'), fallos = [];
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
// ks: 0 primavera, 1 verano, 2 otoño, 3 invierno (como estacionActual().ks)
const base = { camD: 40, hora: 12, nObras: 2, nObrasActivas: 2, dRio: 30 };
const ver = S.ambiente({ ...base, estacion: 1 });
ok(ver.martillo > 0.6 && ver.rio > 0.6, `verano de día con obras y río cerca: martillo ${ver.martillo.toFixed(2)}, río ${ver.rio.toFixed(2)}`);
ok(ver.cigarras > 0.3 && ver.pajaros > 0.2 && ver.grillos === 0, 'verano de día: cigarras y pájaros, sin grillos');
const inv = S.ambiente({ camD: 40, hora: 2, estacion: 3, nObras: 0, nObrasActivas: 0, dRio: 400 });
const otros = Object.entries(inv).filter(([k]) => k !== 'viento').map(([, v]) => v);
ok(inv.viento > 0.6 && Math.max(...otros) < 0.1, `invierno de noche sin obras: viento ${inv.viento.toFixed(2)}, lo demás ≤ ${Math.max(...otros).toFixed(2)}`);
ok(S.ambiente({ ...base, estacion: 1, nObrasActivas: 0 }).martillo === 0, 'obra pausada: martillo 0');
const cer = S.ambiente({ ...base, camD: 20, estacion: 1 }), lej = S.ambiente({ ...base, camD: 400, estacion: 1 });
ok(cer.martillo > lej.martillo && cer.rio > lej.rio && cer.pajaros > lej.pajaros, 'cerca suena más que lejos');
ok(S.ambiente({ estacion: 1, hora: 23 }).cigarras === 0 && S.ambiente({ estacion: 1, hora: 23 }).grillos > 0, 'grillos de noche, cigarras no');
ok(S.ambiente({ estacion: 1, hora: 12, fuego: 1 }).fuego > 0 && S.ambiente({ estacion: 1 }).fuego === 0, 'fuego solo si arde una casa');
const v = S.ambiente(); ok(Object.keys(v).length === 10 && Object.values(v).every(x => x >= 0 && x <= 1), 'sin datos: todo en rango (defaults)');
let malos = 0, n = 0;
for (const estacion of [0, 1, 2, 3]) for (const hora of [0, 3, 6, 7, 12, 18, 20, 23.9]) for (const camD of [0, 20, 90, 400, 5000]) for (const dRio of [0, 50, 200, 1e6]) for (const nObrasActivas of [0, 1, 9]) for (const f of [0, 1, 9]) {
  const r = S.ambiente({ estacion, hora, camD, dRio, nObrasActivas, nObras: nObrasActivas, forja: f, mercado: f, granjas: f, fuego: f, hambre: f, crecida: f }); n++;
  if (Object.values(r).some(x => !(x >= 0 && x <= 1))) malos++;
}
ok(malos === 0, `barrido de ${n} combinaciones: todo entre 0 y 1`);
ok(S.nivel() === 0, 'sin contexto de audio: nivel 0');
S.actualizar({}); ok(true, 'actualizar sin audio no falla');
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else console.log('\nTodo bien');
