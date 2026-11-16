/* Maqueta GM7 — prueba de las reglas con jugadores de mentira. Uso: node gobierno/maquetas/guerra-lejos/prueba.mjs
   Lo que debe cumplirse: quien no hace nada pierde; quien solo avanza y empuja pierde; quien decide con cabeza y se cubre a
   tiempo gana casi siempre; el mismo jugador SIN cubrirse gana bastante menos y pierde más hombres; el que se queda en el
   testudo hasta el choque sale peor que el que lo deshace a tiempo; la batalla dura entre dos y cuatro minutos, con medio
   minuto largo de acercarse; y añadir un ejército con fichas nuevas (Pirro) no rompe nada. */
import * as R from './reglas.js';
import * as F from './formacion.js';

/* lo que hace un jugador sensato una vez trabado (el mismo criterio de GC1 y GM1) */
function lucha(B, jinetes) {
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto || R.lejos(s)) continue;
    const fe = R.frente(e).fatiga, fr = R.frente(c).fatiga;
    R.ordenar(B, i, (e.postura === 'aguantar' && fr < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
    const l = R.frente(c), sig = c.lineas[1];
    if (sig && sig.fatiga < 0.4 && (fr > 0.7 || l.hombres < 0.45 * l.max) && sig.hombres / sig.max > l.hombres / l.max - 0.1) R.ordenar(B, i, 'relevo');
  }
  if (jinetes !== false && B.cab.estado === 'lista' && B.fase === 'lucha') {
    if ((B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
    else if (B.num.proxima - B.t > 12 || B.num.veces >= 3) { const v = B.sect.filter(s => !s.c[1].roto && !s.c[0].roto && !R.lejos(s)).sort((a, b) => a.c[1].moral - b.c[1].moral)[0]; if (v && v.c[1].moral < 0.6) R.ordenar(B, v.i, 'caballeria'); }
  }
}
/* de lejos: «como» dice qué hace el cuerpo cuando le caen proyectiles */
function lejos(B, como, hasta) {
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i], c = s.c[0]; if (c.roto || !R.lejos(s)) continue;
    const t = R.tirando(s.c[1]), leTiran = t && t.estado === 'tira';      /* se cubre en cuanto sale el aviso «¡Piedras!» */
    R.ordenar(B, i, leTiran && s.dist > (hasta || 0) ? como : 'avanzar');
  }
}
const bots = {
  'no toca nada': () => {},
  'solo avanzar y empujar': (B) => { for (let i = 0; i < 3; i++) R.ordenar(B, i, R.lejos(B.sect[i]) ? 'avanzar' : 'empujar'); },
  'con cabeza, escudos a tiempo': (B) => { lejos(B, 'escudos'); lucha(B); },
  'con cabeza, SIN cubrirse': (B) => { lucha(B); },
  'con cabeza, testudo a tiempo': (B) => { lejos(B, 'testudo', 22); lucha(B); },
  'testudo hasta el choque': (B) => { for (let i = 0; i < 3; i++) if (R.lejos(B.sect[i])) R.ordenar(B, i, 'testudo'); lucha(B); },
  'escudos todo el camino': (B) => { for (let i = 0; i < 3; i++) if (R.lejos(B.sect[i])) R.ordenar(B, i, 'escudos'); lucha(B); },
  'escudos y jinetes a los honderos': (B) => { lejos(B, 'escudos'); if (B.cab.estado === 'lista' && B.fase === 'lejos') { const s = B.sect.find(s => { const t = R.tirando(s.c[1]); return t && t.estado === 'tira'; }); if (s) R.ordenar(B, s.i, 'caballeria'); } lucha(B); },
};

let mal = 0;
function tanda(H, rival, N) {
  const res = {};
  for (const [nombre, bot] of Object.entries(bots)) {
    let gana = 0, dur = 0, bR = 0, bE = 0, min = 1e9, max = 0, choque = 0, bLejos = 0, tE = 0, bLin = 0;
    for (let k = 0; k < N; k++) {
      const B = R.nueva(1000 + k * 7919, H, rival); let prox = 0, visto = false;
      while (B.fase !== 'fin') {
        if (B.t >= prox) { bot(B); prox = B.t + 1.5; }                      // el bot «toca» cada segundo y medio, como una persona
        R.paso(B, 0.1);
        if (!visto && B.sect.every(s => !R.lejos(s))) { visto = true; choque += B.t; }
      }
      const r = B.resultado; if (r.como === 'victoria') gana++; dur += r.t; min = Math.min(min, r.t); max = Math.max(max, r.t); bR += r.bajas[0] / r.inicial[0]; bE += r.bajas[1] / r.inicial[1]; bLejos += B.porTiro[0] / r.inicial[0]; bLin += B.porTiroLinea[0] / r.inicial[0]; tE += B.porTiro[1] / r.inicial[1];
    }
    const o = res[nombre] = { pct: Math.round(100 * gana / N), dur: dur / N, min, max, bR: 100 * bR / N, bE: 100 * bE / N, choque: choque / N, bLejos: 100 * bLejos / N, tE: 100 * tE / N, bLin: 100 * bLin / N };
    console.log(`${nombre.padEnd(33)} gana ${String(o.pct).padStart(3)} % · dura ${Math.round(o.dur)} s (${Math.round(min)}–${Math.round(max)}) · todos trabados a los ${Math.round(o.choque)} s · bajas Roma ${o.bR.toFixed(0)} % (por proyectil ${o.bLejos.toFixed(1)} %, en las líneas ${o.bLin.toFixed(1)} %) / enemigo ${o.bE.toFixed(0)} % (${o.tE.toFixed(1)} %)`);
  }
  return res;
}
const pide = (ok, texto) => { if (!ok) { mal++; console.log('   MAL: ' + texto); } };
for (const H of [1000, 5000, 10000]) {
  const B0 = R.nueva(1, H); console.log(`\n== ${H} por bando contra Cartago: ${R.inicialLado(B0, 0)} romanos contra ${R.inicialLado(B0, 1)} ==`);
  /* cada hombre tiene un sitio distinto, y al caer gente siguen cabiendo justo los que quedan */
  for (const l of B0.sect[1].c[0].lineas) for (const q of [1, 0.63, 0.07]) {
    const n = Math.ceil(l.max * q), files = F.filesDe(l.max), rg = { n, files, x: 0, z: 0, yaw: Math.PI, px: 1, pz: 1.15 }, vistos = new Set(), o = {};
    for (let id = 0; id < n; id++) { F.sitio(rg, id, 0, o); vistos.add(Math.round(o.x * 2) + ':' + Math.round(o.z * 2)); }
    pide(vistos.size === n && F.filasDe(n, files) * files >= n, `${l.tipo} con ${n} hombres no caben uno a uno`);
  }
  const r = tanda(H, 'cartago', 40), cab = r['con cabeza, escudos a tiempo'], sin = r['con cabeza, SIN cubrirse'];
  pide(r['no toca nada'].pct <= 5, 'quien no toca nada debe perder');
  pide(r['solo avanzar y empujar'].pct <= 15, 'quien solo avanza y empuja debe perder');
  pide(cab.pct >= 85, 'quien decide con cabeza y se cubre a tiempo debe ganar casi siempre');
  pide(sin.pct <= cab.pct - 20, 'no cubrirse debe costar: bastantes menos victorias');
  pide(sin.bLin >= cab.bLin * 1.8, 'sin cubrirse, los proyectiles deben tumbar casi el doble de legionarios');
  pide(r['testudo hasta el choque'].pct <= cab.pct - 10, 'quedarse en el testudo hasta el choque debe salir peor');
  pide(r['con cabeza, testudo a tiempo'].pct >= 70, 'el testudo a tiempo debe ser una jugada válida');
  pide(cab.min >= 100 && cab.max <= 250, 'la batalla bien jugada debe durar entre dos y cuatro minutos');
  pide(cab.choque >= 30 && cab.choque <= 65, 'acercarse debe durar entre medio minuto y un minuto');
}
/* un ejército hecho solo con fichas nuevas (arqueros, hoplitas, falange, tesalios) se juega sin tocar el motor */
console.log('\n== 5000 por bando contra Pirro (solo fichas nuevas) ==');
const p = tanda(5000, 'pirro', 20);
pide(Object.values(p).every(o => o.dur > 60 && o.dur < 345), 'la batalla contra Pirro debe acabar por sí sola');
pide(p['no toca nada'].pct <= 30 && p['con cabeza, escudos a tiempo'].pct > p['no toca nada'].pct, 'contra Pirro también deben mandar las decisiones');
console.log(mal ? 'NO APTO' : 'APTO');
process.exit(mal ? 1 : 0);
