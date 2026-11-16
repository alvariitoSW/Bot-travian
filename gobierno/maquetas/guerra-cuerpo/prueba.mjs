/* Maqueta GM2 — prueba de las reglas, sin pantalla. Uso: node gobierno/maquetas/guerra-cuerpo/prueba.mjs
   Qué debe cumplirse:
   A) Armas: en duelos de frente, ninguna arma gana a todas ni pierde con todas.
   B) Flanco: con menos hombres se pierde de frente y se gana cogiendo el costado; con muchos menos, ni así (no es trampa).
   C) Formación: cogida de costado, la falange se hunde mucho antes que los manípulos, y la reserva que se vuelve lo nota.
   D) Batalla entera contra los dos rivales: no tocar nada o solo empujar pierde; jugar con cabeza gana; buscar el flanco ahorra bajas y tiempo.
   F) Legión mermada: con tres cuartos de los hombres solo se gana buscando el flanco; con la mitad, ni así.
   E) El enemigo también lo intenta: en las batallas hay avisos de costado o espalda contra Roma. */
import * as R from './reglas.js';

let mal = 0;
const falla = (cond, texto) => { if (!cond) { mal++; console.log('   MAL: ' + texto); } };
const correr = (B, bot, cada = 1.5) => { let prox = 0; while (B.fase !== 'fin') { if (bot && B.t >= prox) { bot(B); prox = B.t + cada; } R.paso(B, 0.1); } return B.resultado; };
const duelo = (a, b, semilla, prep) => { const B = R.nueva(semilla, { ejercitos: [[[a]], [[b]]], auto: [true, true], sinJinetes: true }); if (prep) prep(B); return correr(B, prep && prep.bot ? prep.bot : null); };
const N = 30;

/* ---------- A) armas ---------- */
console.log('A) DUELOS DE FRENTE (240 hombres contra 240; los elefantes, 10 bestias). % de victorias de la fila sobre la columna');
const campeones = { espada: { tipo: 'principes', hombres: 240 }, lanza: { tipo: 'falange', hombres: 240 }, jabalina: { tipo: 'velites', hombres: 240 }, arco: { tipo: 'arqueros', hombres: 240 }, elefante: { tipo: 'elefantes', hombres: 150 } };
const armas = Object.keys(campeones), gana = {};
console.log(''.padEnd(10) + armas.map(a => a.padStart(9)).join(''));
for (const a of armas) {
  gana[a] = {}; let fila = a.padEnd(10);
  for (const b of armas) {
    if (a === b) { fila += '        ·'; continue; }
    let g = 0; for (let k = 0; k < N; k++) { if (duelo(campeones[a], campeones[b], 500 + k * 131).como === 'victoria') g++; if (duelo(campeones[b], campeones[a], 900 + k * 137).como !== 'victoria') g++; }
    gana[a][b] = Math.round(100 * g / (2 * N)); fila += (gana[a][b] + ' %').padStart(9);
  }
  console.log(fila);
}
for (const a of armas) { const v = armas.filter(b => b !== a && gana[a][b] >= 60).length, d = armas.filter(b => b !== a && gana[a][b] <= 40).length; console.log(`   ${a}: gana a ${v}, pierde con ${d}`); falla(v < 4, a + ' gana a todas'); falla(d < 4, a + ' pierde con todas'); falla(v >= 1, a + ' no gana a ninguna'); }

/* ---------- B) flanco contra número ---------- */
console.log('\nB) FLANCO CONTRA NÚMERO: príncipes contra 260 libios');
const costado = B => { B.sect[0].c[1].envuelto = true; };
const pct = (h, prep) => { let g = 0; for (let k = 0; k < N; k++) if (duelo({ tipo: 'principes', hombres: h }, 'libios', 70 + k * 211, prep).como === 'victoria') g++; return Math.round(100 * g / N); };
const b1 = pct(260), b2 = pct(170), b3 = pct(170, costado), b4 = pct(90, costado);
console.log(`   260 de frente: ${b1} %   ·   170 de frente: ${b2} %   ·   170 por el costado: ${b3} %   ·   90 por el costado: ${b4} %`);
falla(b2 <= 25, 'con dos tercios de los hombres y de frente se debería perder'); falla(b3 >= 70, 'el costado debería compensar ir en inferioridad'); falla(b4 <= 25, 'el costado no puede ganar solo: con un tercio de los hombres se debería perder');

/* ---------- C) formación ante el costado ---------- */
console.log('\nC) CUÁNTO TARDA EN ROMPERSE cogida de costado (s desde el choque), contra 230 iberos');
const aguanta = (lineas, postura) => { let t = 0, n = 0; for (let k = 0; k < N; k++) { const B = R.nueva(40 + k * 97, { ejercitos: [[lineas], [['iberos']]], auto: [postura === 'auto', true], sinJinetes: true }); const c = B.sect[0].c[0]; c.envuelto = true; if (postura !== 'auto') c.postura = postura; let t0 = 0; while (B.fase !== 'fin') { R.paso(B, 0.1); if (!t0 && B.chocado) t0 = B.t; if (postura !== 'auto' && B.sect[0].dist > 3) c.postura = 'empujar'; else if (postura !== 'auto') c.postura = postura; } if (c.roto) { t += B.t - t0; n++; } else { t += 280; n++; } } return Math.round(t / n); };
const cF = aguanta([{ tipo: 'falange', hombres: 256 }], 'auto'), cM = aguanta(['hastati', 'principes'], 'empujar'), cR = aguanta(['hastati', 'principes'], 'aguantar');
console.log(`   falange: ${cF} s   ·   manípulos empujando: ${cM} s   ·   manípulos aguantando (la reserva se vuelve): ${cR} s`);
falla(cF < cM * 0.8, 'la falange debería hundirse bastante antes que los manípulos'); falla(cR > cM * 1.3, 'volver la reserva debería notarse');

/* ---------- D) y E) batalla entera ---------- */
const cabeza = usaFlanco => B => {
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue;
    const le = R.frente(e), l = R.frente(c), fr = l.fatiga, lejos = s.dist > 3;
    let quiere;
    if (lejos) quiere = le.tipo === 'elefantes' ? 'aguantar' : le.tipo === 'arqueros' ? 'empujar' : s.dist < 40 ? 'empujar' : 'aguantar';      // calles a los elefantes; a los arqueros, encima cuanto antes
    else if (c.flanco.costado || c.flanco.espalda) quiere = 'aguantar';                                                                       // la reserva se vuelve
    else quiere = (e.postura === 'aguantar' && fr < 0.75) || le.fatiga > 0.6 || e.flanco.costado || e.flanco.espalda || e.desorden > 0.5 ? 'empujar' : 'aguantar';
    if (le.tipo === 'falange' && !lejos && !(e.flanco.costado || e.flanco.espalda || e.desorden > 0.5)) quiere = 'aguantar';                 // de frente contra las picas, no
    R.ordenar(B, i, quiere);
    const sig = c.lineas.slice(1).find(x => !x.tras);
    if (!lejos && sig && sig.fatiga < 0.4 && (fr > 0.7 || l.hombres < 0.45 * l.max) && sig.hombres / sig.max > l.hombres / l.max - 0.1) R.ordenar(B, i, 'relevo');
  }
  if (usaFlanco && B.cab.estado === 'lista') {
    if (B.num.estado === 'hostiga' || B.num.estado === 'llega') R.ordenar(B, B.num.sect, 'caballeria');
    else if (B.chocado && (B.num.proxima - B.t > 12 || B.num.veces >= 3)) { const v = B.sect.filter(s => !s.c[1].roto && !s.c[0].roto && s.dist <= 3).sort((a, b) => (R.ocasion(B, b.i) === 'espalda') - (R.ocasion(B, a.i) === 'espalda') || a.c[1].moral - b.c[1].moral)[0]; if (v) R.ordenar(B, v.i, 'caballeria'); }
  }
};
const bots = {
  'no toca nada': () => {},
  'todo empujar': B => { for (let i = 0; i < 3; i++) R.ordenar(B, i, 'empujar'); },
  'con cabeza, sin jinetes': cabeza(false),
  'con cabeza': cabeza(true),
};
for (const rival of Object.keys(R.RIVALES)) {
  console.log(`\nD) BATALLA ENTERA contra ${R.RIVALES[rival].n}`);
  const res = {};
  for (const [nombre, bot] of Object.entries(bots)) {
    let g = 0, dur = 0, bR = 0, bE = 0, min = 1e9, max = 0, avisos = 0, propios = 0;
    for (let k = 0; k < N; k++) {
      const B = R.nueva(1000 + k * 7919, { rival }), r = correr(B, bot);
      if (r.como === 'victoria') g++; dur += r.t; min = Math.min(min, r.t); max = Math.max(max, r.t); bR += r.bajas[0]; bE += r.bajas[1];
      avisos += B.eventos.filter(e => e.por && e.lado === 0).length; propios += B.eventos.filter(e => e.por && e.lado === 1).length;
    }
    res[nombre] = { p: Math.round(100 * g / N), bR: bR / N, dur: dur / N, min, max, avisos: avisos / N, propios: propios / N };
    console.log(`   ${nombre.padEnd(24)} gana ${String(res[nombre].p).padStart(3)} %  ·  dura ${Math.round(dur / N)} s (${Math.round(min)}–${Math.round(max)})  ·  bajas Roma ${Math.round(bR / N)} / rival ${Math.round(bE / N)}  ·  flancos sufridos ${(avisos / N).toFixed(1)}, logrados ${(propios / N).toFixed(1)}`);
  }
  falla(res['no toca nada'].p <= 5, 'quien no toca nada debería perder'); falla(res['todo empujar'].p <= 15, 'quien solo empuja debería perder');
  falla(res['con cabeza'].p >= 85, 'quien juega con cabeza debería ganar');
  falla(res['con cabeza'].bR <= 0.9 * res['con cabeza, sin jinetes'].bR && res['con cabeza'].dur < res['con cabeza, sin jinetes'].dur, 'buscar el flanco debería ahorrar bajas y tiempo');
  /* F) la legión mermada: con tres cuartos de los hombres solo se gana buscando costado y espalda; con la mitad, ni así */
  for (const merma of [0.75, 0.5]) {
    const mermada = R.ROMA.map(c => c.map(t => ({ tipo: t, hombres: Math.round(R.TROPAS[t].hombres * merma) }))), f = {};
    for (const n of ['con cabeza, sin jinetes', 'con cabeza']) { let g = 0; for (let k = 0; k < N; k++) if (correr(R.nueva(3000 + k * 6151, { rival, ejercitos: [mermada, R.RIVALES[rival].cuerpos] }), bots[n]).como === 'victoria') g++; f[n] = Math.round(100 * g / N); }
    console.log(`   F) legión mermada al ${merma * 100} %: sin buscar el flanco gana ${f['con cabeza, sin jinetes']} %  ·  buscándolo gana ${f['con cabeza']} %`);
    if (merma === 0.75) falla(f['con cabeza'] >= 70 && f['con cabeza, sin jinetes'] <= 30, 'F) con tres cuartos de los hombres, el flanco debería marcar la diferencia');
    else falla(f['con cabeza'] <= 20, 'F) con la mitad de los hombres no debería bastar el flanco: sería trampa');
  }
}

/* ---------- G) PREMIO Y CASTIGO (GM6): mandar bien sube el ánimo de la legión y ayuda; mandar mal lo baja y se paga ---------- */
console.log('\nG) PREMIO Y CASTIGO');
{
  /* G1: el mismo relevo, a tiempo y a destiempo. Hastati y príncipes contra iberos; se releva una sola vez. */
  const unRelevo = cuando => { let animo = 0, terreno = 0, saldo = 0, n = 0; for (let k = 0; k < N; k++) {
    const B = R.nueva(77 + k * 313, { ejercitos: [[['hastati', 'principes']], [['iberos']]], auto: [false, true], sinJinetes: true }); let t0 = 0, f0 = 0, h0 = 0, a1 = 0; R.ordenar(B, 0, 'empujar');
    while (B.fase !== 'fin' && !(t0 && B.t > t0 + 10)) { R.paso(B, 0.1); const c = B.sect[0].c[0], e = B.sect[0].c[1]; if (B.chocado && c.postura === 'empujar' && !t0) R.ordenar(B, 0, 'aguantar');
      if (!t0 && B.chocado && !c.roto && cuando(B, c, e) && !R.puede(B, 0, 'relevo')) { t0 = B.t; f0 = B.sect[0].frente; h0 = R.hombres(e) - R.hombres(c); R.ordenar(B, 0, 'relevo'); a1 = B.animo; R.ordenar(B, 0, 'empujar'); } }
    if (t0) { n++; animo += a1; terreno += B.sect[0].frente - f0; saldo += h0 - (R.hombres(B.sect[0].c[1]) - R.hombres(B.sect[0].c[0])); } }
    return { animo: animo / n, terreno: terreno / n, saldo: saldo / n, n }; };
  const J = R.juicioRelevo, aTiempo = unRelevo(B => J(B, 0) === 'a-tiempo'), pronto = unRelevo(B => J(B, 0) === 'sin-necesidad' && B.t > 30), carga = unRelevo((B, c) => J(B, 0) === 'bajo-carga');
  const linea = (n, x) => `${n}: ánimo ${x.animo.toFixed(2)}, terreno ${(x.terreno * 22).toFixed(1)} m, saldo de bajas ${x.saldo.toFixed(0)}`;
  console.log('   un relevo y empujar, 10 s después (terreno ganado y bajas enemigas menos propias)\n   ' + linea('a tiempo', aTiempo) + '\n   ' + linea('sin necesidad', pronto) + '\n   ' + linea('bajo la carga', carga));
  falla(aTiempo.n && pronto.n && carga.n, 'no se dieron los tres casos de relevo');
  falla(aTiempo.animo > 0.5 && pronto.animo < 0.5 && carga.animo < 0.5, 'el relevo a tiempo debería subir el ánimo y el relevo a destiempo bajarlo');
  falla(aTiempo.terreno > pronto.terreno && aTiempo.terreno > carga.terreno, 'el relevo a tiempo debería ganar más terreno que el relevo a destiempo');
  /* G2: batalla entera. El que manda con cabeza acaba con el ánimo alto; el que marea a la tropa, con el ánimo por los suelos y peor resultado. */
  const marea = B => { for (let i = 0; i < 3; i++) { const c = B.sect[i].c[0]; if (c.roto) continue; R.ordenar(B, i, c.postura === 'empujar' ? 'aguantar' : 'empujar'); R.ordenar(B, i, 'relevo'); } };
  for (const rival of Object.keys(R.RIVALES)) {
    const media = (bot, cada) => { let a = 0, bien = 0, mal2 = 0, g = 0; for (let k = 0; k < N; k++) { const r = correr(R.nueva(5000 + k * 4099, { rival }), bot, cada); a += r.animo; bien += r.mando.bien; mal2 += r.mando.mal; if (r.como === 'victoria') g++; } return { a: a / N, bien: bien / N, mal: mal2 / N, p: Math.round(100 * g / N) }; };
    const c = media(bots['con cabeza']), m = media(marea, 1.2), q = media(bots['no toca nada']);
    console.log(`   ${R.RIVALES[rival].n}: con cabeza, ánimo ${c.a.toFixed(2)} (${c.bien.toFixed(1)} aciertos, ${c.mal.toFixed(1)} errores), gana ${c.p} %  ·  mareando a la tropa, ánimo ${m.a.toFixed(2)} (${m.bien.toFixed(1)} / ${m.mal.toFixed(1)}), gana ${m.p} %  ·  sin tocar, ánimo ${q.a.toFixed(2)}`);
    falla(c.a >= 0.6 && c.a <= 0.95, 'mandar con cabeza debería dejar el ánimo alto'); falla(m.a <= 0.25 && m.p <= 10, 'marear a la tropa debería hundir el ánimo y perder'); falla(q.a <= 0.5, 'no hacer nada no debería premiarse');
  }
  /* G3: el ánimo pesa, sin mandar. La misma batalla en automático con el ánimo fijado arriba, en medio y abajo. */
  const conAnimo = (a, H = 330) => { let g = 0; for (let k = 0; k < N; k++) { const B = R.nueva(8000 + k * 577, { ejercitos: [[['hastati', 'principes', 'triarii']], [[{ tipo: 'iberos', hombres: H }]]], auto: [true, true], sinJinetes: true }); B.animo = a; B.fijo = true; if (correr(B).como === 'victoria') g++; } return Math.round(100 * g / N); };
  const g0 = conAnimo(0), g5 = conAnimo(0.5), g1 = conAnimo(1), h0 = conAnimo(0, 300), h5 = conAnimo(0.5, 300);
  console.log(`   el ánimo solo (misma batalla en automático): contra 330 iberos, por los suelos gana ${g0} %, normal ${g5} %, por las nubes ${g1} %  ·  contra 300, por los suelos ${h0} %, normal ${h5} %`);
  falla(g1 >= g5 && g5 >= g0 && g1 > g0 && h5 > h0, 'con más ánimo se debería ganar más');
}
console.log(mal ? '\nNO APTO' : '\nAPTO');
process.exit(mal ? 1 : 0);
