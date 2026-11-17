/* Maqueta GC1 — prueba de las reglas con jugadores de mentira. Uso: node gobierno/maquetas/guerra-cero/prueba.mjs
   Lo que debe cumplirse: quien no hace nada pierde; quien solo empuja pierde; quien decide con cabeza gana casi siempre;
   y la batalla dura entre uno y tres minutos. */
import * as R from './reglas.js';

const bots = {
  'no toca nada': () => {},
  'todo empujar': (B) => { for (let i = 0; i < 3; i++) R.ordenar(B, i, 'empujar'); },
  'solo aguantar y relevar': (B) => { for (let i = 0; i < 3; i++) { const c = B.sect[i].c[0]; if (!c.roto && R.frente(c).fatiga > 0.75 && c.lineas.length > 1 && c.lineas[1].fatiga < 0.4) R.ordenar(B, i, 'relevo'); } },
  'empujar y relevar siempre': (B) => { for (let i = 0; i < 3; i++) { const c = B.sect[i].c[0]; if (c.roto) continue; R.ordenar(B, i, 'empujar'); if (R.frente(c).fatiga > 0.7 && c.lineas.length > 1 && c.lineas[1].fatiga < 0.45) R.ordenar(B, i, 'relevo'); } },
  'con cabeza': (B) => {
    if (B.fase !== 'lucha') return;
    for (let i = 0; i < 3; i++) {
      const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue;
      const fe = R.frente(e).fatiga, fr = R.frente(c).fatiga;
      const quiere = (e.postura === 'aguantar' && fr < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar';
      R.ordenar(B, i, quiere);
      const l = R.frente(c), sig = c.lineas[1];
      if (sig && sig.fatiga < 0.4 && (fr > 0.7 || l.hombres < 0.45 * l.max) && sig.hombres / sig.max > l.hombres / l.max - 0.1) R.ordenar(B, i, 'relevo');
    }
    if (B.cab.estado === 'lista') {
      if ((B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
      else if (B.num.proxima - B.t > 12 || B.num.veces >= 3) { const v = B.sect.filter(s => !s.c[1].roto && !s.c[0].roto).sort((a, b) => a.c[1].moral - b.c[1].moral)[0]; if (v && v.c[1].moral < 0.6) R.ordenar(B, v.i, 'caballeria'); }
    }
  },
};

let mal = 0;
const N = 40, cada = 1.5;                       // el bot «toca» cada segundo y medio, como una persona
for (const [nombre, bot] of Object.entries(bots)) {
  let gana = 0, dur = 0, bR = 0, bE = 0, min = 1e9, max = 0;
  for (let k = 0; k < N; k++) {
    const B = R.nueva(1000 + k * 7919); let prox = 0;
    while (B.fase !== 'fin') { if (B.t >= prox) { bot(B); prox = B.t + cada; } R.paso(B, 0.1); }
    const r = B.resultado; if (r.como === 'victoria') gana++; dur += r.t; min = Math.min(min, r.t); max = Math.max(max, r.t); bR += r.bajas[0]; bE += r.bajas[1];
  }
  const pct = Math.round(100 * gana / N);
  console.log(`${nombre.padEnd(26)} gana ${String(pct).padStart(3)} %  ·  dura ${Math.round(dur / N)} s (${Math.round(min)}–${Math.round(max)})  ·  bajas Roma ${Math.round(bR / N)} / enemigo ${Math.round(bE / N)}`);
  const pide = { 'no toca nada': p => p <= 5, 'todo empujar': p => p <= 15, 'con cabeza': p => p >= 85 }[nombre];
  if (pide && !pide(pct)) { mal++; console.log('   MAL: no cumple lo pedido'); }
  if (nombre === 'con cabeza' && (min < 60 || max > 185)) { mal++; console.log('   MAL: la batalla bien jugada debe durar entre 1 y 3 minutos'); }
}
console.log(mal ? 'NO APTO' : 'APTO');
process.exit(mal ? 1 : 0);
