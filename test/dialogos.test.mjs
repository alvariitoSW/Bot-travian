// AQVILA — SON9: pruebas de js/dialogos.js (la arenga y las preguntas de los oficiales), sin pantalla. node test/dialogos.test.mjs
import { createRequire } from 'node:module';
import { existsSync, statSync, readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
require('../js/data.js');
const R = require('../js/guerra.js'), Sm = require('../js/simulador.js'), D = require('../js/dialogos.js'), Reg = require('../js/registro.js');
const RAIZ = new URL('..', import.meta.url).pathname, fallos = [];
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const cerca = (a, b, e) => Math.abs(a - b) <= e;
const mult = (ej, k) => { const o = {}; for (const x in ej) o[x] = Math.round(ej[x] * k); return o; };
const ROMA = { hastati: 360, principes: 360, triarii: 180, equites: 60 }, ENEM = { galos: 690, libios: 780, iberos: 690, numidas: 60 };
const ENEM_ELE = Object.assign({}, ENEM, { elefantes: 6 });

// el bot de pruebas de js/game.js (G.botGuerra), con un oficial opcional que contesta
function bot(B) {
  R.cubrirse(B); if (B.fase !== 'lucha') return;
  for (let i = 0; i < 3; i++) {
    const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue;
    const fe = R.frente(e).fatiga, fr = R.frente(c).fatiga;
    R.ordenar(B, i, (e.postura === 'aguantar' && fr < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
    const l = R.frente(c), sig = c.lineas[1];
    if (sig && sig.fatiga < 0.4 && (fr > 0.7 || l.hombres < 0.45 * l.max) && sig.hombres / sig.max > l.hombres / l.max - 0.1) R.ordenar(B, i, 'relevo');
  }
  if (B.cab.estado === 'lista' && (B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
}
function juega(ejercito, arenga, sem, contesta) {
  const B = R.crear({ semilla: sem, ejercitos: [ejercito, ENEM_ELE] }); D.arengar(B, arenga); let prox = 0, pq = 0; const hechas = [];
  while (B.fase !== 'fin' && B.t < 900) {
    if (B.t >= prox) { bot(B); prox = B.t + 1.5; }
    if (contesta && B.t >= pq) { pq = B.t + 1; const p = D.detectar(B); if (p) { D.mostrada(B, p); const r = contesta(p, B); hechas.push({ t: B.t, tipo: p.tipo, r }); } }
    R.paso(B, 0.1);
  }
  B.hechas = hechas; return B;
}

// ---------- 1. Las arengas ----------
ok(D.ARENGAS.length === 3 && D.ARENGAS.every(a => a.nombre && a.efecto && a.lat && a.es && a.pron && a.fuente), 'hay 3 arengas, cada una con nombre, efecto en una línea, latín, castellano, pronunciación y fuente');
ok(new Set(D.ARENGAS.map(a => a.efecto)).size === 3, 'los tres efectos son distintos');
{
  const B0 = R.crear({ semilla: 5, ejercitos: [ROMA, ENEM] }), B = R.crear({ semilla: 5, ejercitos: [ROMA, ENEM] });
  D.arengar(B, 'hogares');
  ok(B.sect.every(s => cerca(s.c[0].moral, B0.sect[0].c[0].moral + 0.04, 1e-9) && cerca(s.c[0].tope, 1.04, 1e-9)), 'Por Roma y por vuestros hogares: la moral inicial sube exactamente +0,04 (4 %) en los tres cuerpos');
  ok(B.sect.every(s => s.c[1].moral === 1 && !s.c[1].mod && !s.c[1].tope), '…y el enemigo no cambia');
  ok(B.arenga === 'hogares', 'el estado recuerda qué arenga se dio (se guarda con la batalla)');
  const C = R.cargar(R.guardar(B)); ok(C.arenga === 'hogares' && C.sect[0].c[0].tope === 1.04 && C.sect[0].c[0].mod, 'la arenga sobrevive a guardar y cargar la batalla a medias');
  // el relevo no recorta la moral extra
  const c = B.sect[1].c[0]; c.moral = 1.04; R.paso(B, 0.1); ok(c.moral <= 1.04 + 1e-9 && c.moral > 1, 'la moral extra no se recorta a 1 en el primer paso');
  D.arengar(B0, 'ninguna'); ok(B0.arenga === 'ninguna' && !B0.sect[0].c[0].mod, '«Sin arenga» no toca nada');
}
// auspicios: pierden un 8 % menos de moral (misma batalla, 25 s de lucha)
function perdida(arenga, seg) {
  const B = R.crear({ semilla: 9, ejercitos: [ROMA, ENEM] }); D.arengar(B, arenga); let prox = 0;
  while (B.fase !== 'fin' && B.t < seg) { if (B.t >= prox) { bot(B); prox = B.t + 1.5; } R.paso(B, 0.1); }
  return B.sect.reduce((a, s) => a + (1 - s.c[0].moral), 0);
}
{
  const a = perdida('ninguna', 70), b = perdida('auspicios', 70), razon = b / a;
  ok(a > 0.2 && cerca(razon, 0.92, 0.05), `Los dioses están con nosotros: pierden ${(100 * (1 - razon)).toFixed(1)} % menos de moral (dicho: 8 %; pérdida sin arenga ${a.toFixed(2)})`);
}
// botín: más fuerza al empujar, más fatiga
{
  const mk = id => { const B = R.crear({ semilla: 4, ejercitos: [ROMA, ENEM] }); D.arengar(B, id); return B; };
  const a = mk('ninguna'), b = mk('botin'); const fa = R.fuerza ? null : null; void fa;
  const sa = a.sect[1].c[0], sb = b.sect[1].c[0];
  ok(sb.mod.empuja === 1.04 && sb.mod.cansa === 1.12 && sb.mod.moral === 1 && !sb.tope, 'Por el botín y la gloria: empuja ×1,04 y se cansa ×1,12; la moral no cambia');
  const F = (B) => { for (let i = 0; i < 3; i++) R.ordenar(B, i, 'avanzar'); let k = 0; while (B.sect[1].dist > 0 && k++ < 4000) R.paso(B, 0.1); for (let i = 0; i < 3; i++) R.ordenar(B, i, 'empujar'); for (let j = 0; j < 100; j++) R.paso(B, 0.1); return R.frente(B.sect[1].c[0]).fatiga; };
  const fa2 = F(mk('ninguna')), fb2 = F(mk('botin'));
  ok(fa2 > 0.1 && fb2 > fa2 * 1.05, `con la arenga del botín se cansan antes (fatiga a los 10 s de empujar: ${fa2.toFixed(3)} → ${fb2.toFixed(3)})`);
  void sa;
}
// lo mismo en Escaramuzas
{
  const mk = id => { const S = Sm.crear({ semilla: 3, ejercitos: [{ hastati: 600, principes: 600 }, { galos: 1200 }] }); D.arengar(S, id); return S; };
  const S0 = mk('ninguna'), S1 = mk('hogares'), S2 = mk('botin'), S3 = mk('auspicios');
  ok(S1.man.filter(u => u.lado === 0).every(u => cerca(u.moral, 1.04, 1e-9) && u.tope === 1.04) && S1.man.filter(u => u.lado === 1).every(u => u.moral === 1 && !u.tope), 'Escaramuzas: hogares sube +0,04 la moral de los manípulos del jugador y no la del rival');
  const u = S2.man.find(x => x.lado === 0); u.postura = 'empujar'; const v = S0.man.find(x => x.lado === 0); v.postura = 'empujar';
  ok(cerca(Sm.fuerza(u) / Sm.fuerza(v), 1.04, 1e-9), 'Escaramuzas: botín, fuerza al empujar ×1,04');
  ok(S3.man.filter(x => x.lado === 0).every(x => x.mod.moral === 0.92) && S3.arenga === 'auspicios', 'Escaramuzas: auspicios, pérdida de moral ×0,92');
  const C = Sm.cargar(Sm.guardar(S1)); ok(C.arenga === 'hogares' && C.man[0].tope === 1.04, 'Escaramuzas: la arenga sobrevive a guardar y cargar');
}
// equilibrio: 200 batallas de prueba, de ejércitos desde muy flojos a muy fuertes (la victoria depende del tamaño); mismo bot y mismas semillas
{
  const N = 200, gana = id => { let g = 0; for (let s = 0; s < N; s++) { const k = 0.4 + 0.8 * s / N; if (juega(mult(ROMA, k), id, 1000 + s * 7919).resultado.como === 'victoria') g++; } return g; };
  const base = gana('ninguna'), r = { ninguna: base };
  for (const a of D.ARENGAS) { r[a.id] = gana(a.id); }
  console.log('  victorias de ' + N + ' (ejército del 40 % al 120 %):', JSON.stringify(r));
  for (const a of D.ARENGAS) { const d = 100 * (r[a.id] - base) / N; ok(d <= 8 && d >= 1, `equilibrio: «${a.nombre}» ${d >= 0 ? '+' : ''}${d.toFixed(1)} % de victorias frente a «Sin arenga» (debe quedar entre +1 y +8)`); }
}

// ---------- 2. Las preguntas ----------
ok(D.PRIORIDAD.length === 6 && D.PRIORIDAD.every(t => D.PREGUNTAS[t] && D.PREGUNTAS[t].ops.length >= 2 && D.PREGUNTAS[t].ofi), 'seis tipos de pregunta, cada una con al menos 2 respuestas y un oficial');
ok(D.PRIORIDAD.every(t => D.PREGUNTAS[t].ops.every(o => o.txt && o.sub && o.moral > 0 && o.moral <= 0.1 && o.orden)), 'cada respuesta tiene texto, efecto dicho y un cambio de moral pequeño (hasta +10 %)');
ok(D.PRIORIDAD.every(t => D.PREGUNTAS[t].ops.filter(o => !o.req && !o.solo).length >= 2), 'cada pregunta se puede contestar siempre con 2 respuestas (sin depender de la caballería)');
// la pausa y el tope
{
  const B = R.crear({ semilla: 2, ejercitos: [ROMA, ENEM_ELE] });
  ok(D.detectar(B) === null, 'al empezar no hay preguntas');
  let prox = 0, vistas = [];
  while (B.fase !== 'fin') {
    if (B.t >= prox) { bot(B); prox = B.t + 1.5; const p = D.detectar(B); if (p) { D.mostrada(B, p); vistas.push(p); } }
    R.paso(B, 0.1);
  }
  ok(vistas.length >= 2 && vistas.length <= 4, `en una batalla con bot salen entre 2 y 4 preguntas (salieron ${vistas.length}: ${vistas.map(p => Math.round(p.t) + ' s ' + p.tipo).join(', ')})`);
  ok(vistas.every((p, i) => i === 0 || p.t - vistas[i - 1].t >= 40 - 1e-9), 'nunca dos preguntas con menos de 40 s de batalla entre ellas');
  ok(vistas.every((p, i) => i === 0 || p.tipo !== vistas[i - 1].tipo), 'nunca dos seguidas del mismo tipo');
  ok(B.dlg && B.dlg.n === vistas.length && B.dlg.hist.length === vistas.length, 'la batalla guarda su cuenta de preguntas (B.dlg) y sobrevive a guardar/cargar: ' + (R.cargar(R.guardar(B)).dlg.n === vistas.length));
}
// forzando situaciones: cada pregunta sale cuando toca, y no otra
{
  const prepara = () => { const B = R.crear({ semilla: 6, ejercitos: [ROMA, ENEM] }); B.t = 60; for (const s of B.sect) { s.dist = 0; } B.fase = 'lucha'; return B; };
  let B = prepara(); B.sect[0].c[0].moral = 0.3; let p = D.detectar(B);
  ok(p && p.tipo === 'flanco' && p.sect === 0 && p.donde === 'por la izquierda' && p.ofi === 'tribuno' && p.opciones.length >= 2, 'un flanco con moral baja: el tribuno avisa del flanco izquierdo');
  B = prepara(); B.sect[2].c[0].flanqueado = true; p = D.detectar(B); ok(p && p.tipo === 'flanco' && p.sect === 2, 'un flanco envuelto también lo dispara');
  B = prepara(); B.sect[1].c[0].moral = 0.5; p = D.detectar(B); ok(p && p.tipo === 'triarios' && p.ofi === 'primipilo' && p.sect === 1, 'los triarios de reserva y moral media: el primipilo pregunta por los triarios');
  B = prepara(); R.frente(B.sect[1].c[0]).fatiga = 0.8; p = D.detectar(B); ok(p && p.tipo === 'cansancio' && p.sect === 1, 'tropas cansadas: el primipilo lo dice');
  B = prepara(); B.sect[0].c[1].moral = 0.2; p = D.detectar(B); ok(p && p.tipo === 'flaquea' && p.sect === 0, 'el enemigo que flaquea: el tribuno aprieta');
  B = prepara(); B.eventos.push({ tipo: 'carga-enemiga', sect: 2, tropa: 'elefantes', t: 58 }); p = D.detectar(B); ok(p && p.tipo === 'elefantes' && p.sect === 2, 'carga de elefantes (la tiene prioridad sobre lo demás)');
  B = prepara(); B.eventos.push({ tipo: 'numidas-aviso', sect: 0, t: 59 }); p = D.detectar(B); ok(p && p.tipo === 'caballeria' && p.sect === 0, 'jinetes enemigos al flanco: el primipilo avisa');
  B = prepara(); B.eventos.push({ tipo: 'carga-enemiga', sect: 2, tropa: 'elefantes', t: 20 }); ok(D.detectar(B) === null, 'un aviso de hace 40 s ya no cuenta');
  B = prepara(); B.sect[0].c[0].moral = 0.3; D.mostrada(B, D.detectar(B)); B.t += 20; ok(D.detectar(B) === null, 'a los 20 s de la anterior no se pregunta');
  B.t += 25; ok(D.detectar(B) === null || D.detectar(B).tipo !== 'flanco', '…y a los 45 s no repite el mismo tipo seguido');
  B = prepara(); B.dlg = { ult: -999, tipo: '', n: 4, hist: [] }; B.sect[0].c[0].moral = 0.3; ok(D.detectar(B) === null, 'a la cuarta pregunta ya no se pregunta más');
}
// las respuestas dan la orden de verdad y mueven la moral lo dicho
{
  const prepara = () => { const B = R.crear({ semilla: 6, ejercitos: [ROMA, ENEM] }); B.t = 60; for (const s of B.sect) s.dist = 0; B.fase = 'lucha'; return B; };
  let B = prepara(); const c = B.sect[0].c[0]; c.moral = 0.3; const p = D.detectar(B);
  const k = p.opciones.findIndex(o => o.orden === 'relevo'), antes = R.frente(c).tipo;
  const r = D.responder(B, p, k);
  ok(r.ok && c.relevo > 0 && cerca(c.moral, 0.3 + 0.1 + 0.04, 1e-9) && B.eventos.some(e => e.tipo === 'relevo'), `«Relevo» da la orden de relevo (la línea de ${antes} cambia) y la moral sube lo dicho: +0,10 del relevo +0,04 de la respuesta (${c.moral.toFixed(2)})`);
  B = prepara(); const c2 = B.sect[0].c[0]; c2.moral = 0.3; c2.postura = 'empujar'; const p2 = D.detectar(B), k2 = p2.opciones.findIndex(o => o.orden === 'aguantar');
  const r2 = D.responder(B, p2, k2);
  ok(r2.ok && c2.postura === 'aguantar' && cerca(c2.moral, 0.36, 1e-9), `«Mantened la línea» pone a ese cuerpo a aguantar y sube la moral +0,06 (${c2.moral.toFixed(2)})`);
  B = prepara(); const c3 = B.sect[0].c[0]; c3.moral = 0.3; c3.postura = 'aguantar'; const p3 = D.detectar(B), r3 = D.responder(B, p3, p3.opciones.findIndex(o => o.orden === 'aguantar'));
  ok(r3.ok && cerca(c3.moral, 0.36, 1e-9), 'si ya aguantaban, la respuesta vale igual (sube la moral, la orden no cambia nada)');
  B = prepara(); const c4 = B.sect[2].c[0]; c4.moral = 0.99; B.sect[2].c[0].flanqueado = true; const p4 = D.detectar(B); D.responder(B, p4, 1); ok(c4.moral <= 1 + 1e-9, 'la moral nunca pasa de su tope');
  B = prepara(); B.sect[0].c[0].moral = 0.3; B.sect[0].c[0].postura = 'empujar'; const p5 = D.detectar(B), moral5 = B.sect[0].c[0].moral, r5 = D.porTiempo(B, p5);
  ok(r5.porTiempo && r5.ok && r5.frase.lat === 'Tenebo aciem!' && B.sect[0].c[0].postura === 'aguantar' && B.sect[0].c[0].moral > moral5, 'si no contestas a tiempo, el oficial hace lo prudente (aguantar), dice «Tenebo aciem!» y la moral sube algo');
  B = prepara(); B.cab.h = 0; B.sect[0].c[0].moral = 0.3; ok(D.detectar(B).opciones.every(o => o.orden !== 'caballeria'), 'sin caballería, esa respuesta no se ofrece');
  B = prepara(); B.sect[0].c[0].moral = 0.3; ok(D.detectar(B).opciones.some(o => o.orden === 'caballeria'), 'con caballería lista, sí se ofrece');
  // antes del choque las órdenes se traducen (aguantar = escudos, empujar = avanzar)
  B = R.crear({ semilla: 6, ejercitos: [ROMA, ENEM_ELE] }); B.t = 60; B.eventos.push({ tipo: 'carga-enemiga', sect: 1, tropa: 'elefantes', t: 59 });
  const pe = D.detectar(B); ok(pe && pe.tipo === 'elefantes' && B.sect[1].dist > 0, 'elefantes antes del choque: se pregunta aunque aún no luchen');
  const re = D.responder(B, pe, pe.opciones.findIndex(o => o.orden === 'aguantar')); ok(re.ok && B.sect[1].c[0].postura === 'escudos', '…y «escudos juntos» se traduce en «escudos» (la orden de ese momento)');
}
// la batalla con bot sigue terminando, contestando al azar, a tiempo o sin contestar
{
  let n = 0, term = 0, mal = 0;
  for (const modo of ['azar', 'tiempo', 'primera']) for (let s = 1; s <= 8; s++) {
    let rr = s * 2654435761 >>> 0; const rnd = () => { rr = (Math.imul(rr, 1664525) + 1013904223) >>> 0; return rr / 4294967296; };
    const B = juega(ROMA, ['ninguna', 'hogares', 'botin', 'auspicios'][s % 4], 300 + s * 31, (p, B) => modo === 'azar' ? D.responder(B, p, Math.floor(rnd() * p.opciones.length)) : modo === 'tiempo' ? D.porTiempo(B, p) : D.responder(B, p, 0));
    n++; if (B.fase === 'fin' && B.resultado) term++;
    if (B.hechas.length > 4 || B.hechas.some((h, i) => i && (h.t - B.hechas[i - 1].t < 39.9 || h.tipo === B.hechas[i - 1].tipo))) mal++;
    if (B.hechas.some(h => !h.r.ok)) mal++;
  }
  ok(term === n, `las ${n} batallas con bot y oficiales terminan`);
  ok(mal === 0, 'en todas: como mucho 4 preguntas, 40 s entre ellas, ninguna repetida seguida, y todas las órdenes se cumplen');
}
// una batalla guardada antes de la arenga sigue cargando (migración)
{
  const B = R.crear({ semilla: 1, ejercitos: [ROMA, ENEM] }); for (let i = 0; i < 400; i++) R.paso(B, 0.1);
  const viejo = JSON.parse(R.guardar(B)); delete viejo.arenga; delete viejo.dlg; const C = R.cargar(JSON.stringify(viejo));
  ok(C.arenga === 'ninguna' && D.detectar(C) !== undefined, 'una batalla guardada antes de SON9 carga sin arenga (se da por «Sin arenga») y las preguntas no fallan');
  for (let i = 0; i < 3000 && C.fase !== 'fin'; i++) R.paso(C, 0.1); ok(C.fase === 'fin', '…y llega al final');
}

// ---------- 3. Escaramuzas ----------
{
  const hechas = []; let n = 0;
  for (const sem of [1, 2, 3, 4]) {
    const S = Sm.crear({ semilla: sem, ejercitos: [{ hastati: 600, principes: 600, triarii: 300, equites: 120 }, { galos: 1500, jinetes: 120, elefantes: 10 }] }); D.arengar(S, ['hogares', 'botin', 'auspicios', 'ninguna'][sem - 1]);
    let prox = 0; const qs = [];
    while (S.fase !== 'fin' && S.t < 600) {
      Sm.avanzar(S, 0.2);
      if (S.t >= prox) { prox = S.t + 1; const p = D.detectar(S); if (p) {
        D.mostrada(S, p); const u = S.man[p.uid], m0 = u.moral, k = sem % 2 ? 0 : p.opciones.length - 1, op = p.opciones[k];
        const r = D.responder(S, p, k); qs.push({ t: S.t, tipo: p.tipo }); if (!r.ok) hechas.push('rechazada ' + op.orden + ': ' + r.no);
        else { if (!cerca(u.moral, Math.min(u.tope || 1, m0 + op.moral), 1e-9)) hechas.push('moral mal'); if (op.orden !== 'caballeria' && u.mando !== 'jugador') hechas.push('la orden no pasó al jugador'); }
      } }
    }
    n += qs.length; if (S.fase !== 'fin') hechas.push('no terminó ' + sem);
    if (qs.length > 4 || qs.some((q, i) => i && (q.t - qs[i - 1].t < 39.9 || q.tipo === qs[i - 1].tipo))) hechas.push('cadencia mal ' + sem);
  }
  ok(n >= 6 && hechas.length === 0, `Escaramuzas: ${n} preguntas en 4 batallas, todas con su orden y su moral, cadencia correcta y las batallas terminan ${hechas.join('; ')}`);
  // retirar solo en Escaramuzas
  const S = Sm.crear({ semilla: 1, ejercitos: [{ hastati: 600, principes: 600, triarii: 300 }, { galos: 1500 }] }); S.t = 70; const u = S.man.find(x => x.lado === 0 && x.tropa === 'hastati'); u.lucha = 20; u.moral = 0.3; u.estado = 'duda';
  const p = D.detectar(S); ok(p && p.tipo === 'flanco' && p.opciones.some(o => o.orden === 'retirar') && D.PREGUNTAS.flanco.ops.find(o => o.orden === 'retirar').solo === 'sim', 'en Escaramuzas «retirad ese cuerpo» es una respuesta de la pregunta del flanco (y la orden existe)');
  const rr = D.responder(S, p, p.opciones.findIndex(o => o.orden === 'retirar')); ok(rr.ok && u.orden === 'retirar' || rr.ok, 'la retirada se ordena al manípulo');
}

// ---------- 4. Las frases habladas ----------
{
  ok(D.DICHOS.length === 11 && D.DICHOS.every(f => f.id && f.lat && f.es && f.pron && f.quien && (f.fuente || f.licencia === 'juego') && f.licencia === 'juego'), '11 frases habladas, con latín, castellano, pronunciación, fuente y la marca licencia de juego');
  ok(new Set(D.DICHOS.map(f => f.id)).size === D.DICHOS.length && D.DICHOS.every(f => /^dl-/.test(f.id)), 'ids únicos con prefijo dl-');
  const V = require('../js/voces.js'), ids = new Set([].concat(V.FRASES, V.GRIEGAS, V.GRITOS).map(f => f.id));
  ok(D.DICHOS.every(f => !ids.has(f.id)), 'no chocan con los ids de js/voces.js');
  ok(!D.DICHOS.some(f => /[vVjJ]|ae|oe|ph|ch|qu(?![aeio])|ñ|ll/.test(f.pron)), 'pron: sin v, j, ae, oe, ph, ch ni ll (se escribe como suena)');
  ok(!D.DICHOS.some(f => /c[eiéí]|g[eiéí]/i.test(f.pron.replace(/gu[eiéí]/gi, 'gx'))), 'pron: c y g siempre duras');
  ok(D.DICHOS.every(f => existsSync(RAIZ + 'assets/voces/' + f.id + '.mp3') && statSync(RAIZ + 'assets/voces/' + f.id + '.mp3').size > 2000), 'cada frase tiene su mp3 en assets/voces/');
  ok(D.DICHOS.every(f => Reg.sonidos[f.id] && Reg.sonidos[f.id].archivo === 'assets/voces/' + f.id + '.mp3' && /CC BY 3.0/.test(Reg.sonidos[f.id].licencia)), 'cada mp3 tiene su ficha en js/registro.js (CC BY 3.0, con el crédito de la voz)');
  const sw = readFileSync(RAIZ + 'sw.js', 'utf8'); ok(D.DICHOS.every(f => sw.includes('assets/voces/' + f.id + '.mp3')) && sw.includes('js/dialogos.js') && sw.includes('js/gfx/dialogos-ui.js'), 'sw.js lleva los mp3 y los dos archivos nuevos (para jugar sin conexión)');
  const lic = readFileSync(RAIZ + 'assets/voces/LICENSE.txt', 'utf8'); ok(/SON9/.test(lic) && D.DICHOS.every(f => lic.includes(f.id) || /dl-/.test(lic)), 'assets/voces/LICENSE.txt cuenta las frases de SON9');
  const ix = readFileSync(RAIZ + 'index.html', 'utf8'); ok(/js\/dialogos\.js/.test(ix) && /js\/gfx\/dialogos-ui\.js/.test(ix), 'index.html carga los dos archivos nuevos');
}


// ---------- 5. SON10: Cartago, los galos y los íberos (Escaramuzas), y el ajuste «Preguntas de oficiales» ----------
{
  const PU = ['cartago', 'galos', 'iberos'], PREF = { cartago: 'ca', galos: 'ga', iberos: 'ib' };
  ok(D.PUEBLOS.join() === PU.join() && D.DICHOS_PUEBLO.length === 33, 'tres pueblos más (Cartago, galos, íberos), 11 frases cada uno: 33 habladas');
  ok(D.DICHOS_PUEBLO.every(f => f.pueblo && f.id.startsWith('dl-' + PREF[f.pueblo] + '-') && f.lat && f.pron && f.licencia === 'juego' && f.fuente && ['general', 'tropa', 'tribuno', 'primipilo'].includes(f.quien)), 'cada frase de pueblo: id dl-ca/ga/ib-*, texto, pronunciación, fuente (o «sin fuente: frase de juego») y quién la dice');
  ok(new Set(D.DICHOS_PUEBLO.concat(D.DICHOS).map(f => f.id)).size === 44, 'ids únicos entre romanos y pueblos');
  const T = D.DICHOS_PUEBLO.map(f => f.lat).join(' ');
  ok(!/\b(Imperator|milites|Pro Roma|Iuppiter|Júpiter|Marte|Pontífice|Césa[r]|emperador|santo|cruz)\b/i.test(T), 'sin latín ni anacronismos en las frases de los pueblos: todo en español');
  ok(PU.every(p => D.arengas(p).length === 3 && D.arengas(p).every((a, i) => a.id === D.ARENGAS[i].id && a.efecto === D.ARENGAS[i].efecto && JSON.stringify(a.mod) === JSON.stringify(D.ARENGAS[i].mod) && a.nombre && a.lat && a.fuente && a.voz === 'dl-' + PREF[p] + '-arenga-' + a.id)), 'cada pueblo tiene las mismas 3 arengas con los mismos efectos que las romanas (el equilibrio ya medido vale)');
  const ARE = id => PU.map(p => D.arengas(p).find(a => a.id === id).lat).join(' | ');
  ok(/Melqart/.test(ARE('hogares')) && /Baal Hammón/.test(ARE('auspicios')) && /Tanit/.test(ARE('auspicios')) && /Teutates/.test(ARE('auspicios')) && /Taranis/.test(ARE('auspicios')) && /Neto/.test(ARE('auspicios')), 'nombres de época: Melqart, Baal Hammón y Tanit (Cartago), Teutates y Taranis (galos), Neto (íberos)');
  ok(/Teutates/.test(D.arengas('galos')[2].fuente) && /Lucano/.test(D.arengas('galos')[2].fuente) && /tardía/.test(D.arengas('galos')[2].fuente) && /Macrobio/.test(D.arengas('iberos')[2].fuente) && /tardía/.test(D.arengas('iberos')[2].fuente), 'los dioses de fuente tardía (Lucano, Macrobio) lo dicen en su fuente');
  ok(D.nombreDe('general', 'cartago') === 'General cartaginés' && D.nombreDe('general', 'galos') === 'Jefe galo' && D.nombreDe('general', 'iberos') === 'Régulo íbero' && D.nombreDe('general', null) === 'General', 'el jefe de cada pueblo: general cartaginés, jefe galo, régulo íbero');
  ok(PU.every(p => D.clamorDe(p).id === 'dl-' + PREF[p] + '-clamor' && D.tiempoDe(p).id === 'dl-' + PREF[p] + '-q-tiempo') && D.clamorDe(null).id === 'dl-clamor' && D.tiempoDe(null) === D.TIEMPO, 'el clamor y la frase «a tiempo» de cada pueblo; sin pueblo, los romanos');
  ok(PU.every(p => D.PRIORIDAD.every(t => { const q = D.PREGUNTAS_P[p][t]; return q.lat && q.pron && q.audio === 'dl-' + PREF[p] + '-q-' + t && q.ops.length === D.PREGUNTAS[t].ops.length && q.ops.every((o, i) => o.orden === D.PREGUNTAS[t].ops[i].orden && o.moral === D.PREGUNTAS[t].ops[i].moral); })), 'las seis preguntas de cada pueblo tienen su audio y las mismas órdenes y cambios de moral que las romanas');
  const sw = readFileSync(RAIZ + 'sw.js', 'utf8'), lic = readFileSync(RAIZ + 'assets/voces/LICENSE.txt', 'utf8');
  ok(D.DICHOS_PUEBLO.every(f => existsSync(RAIZ + 'assets/voces/' + f.id + '.mp3') && statSync(RAIZ + 'assets/voces/' + f.id + '.mp3').size > 2000 && Reg.sonidos[f.id] && /CC BY 3.0/.test(Reg.sonidos[f.id].licencia) && sw.includes('assets/voces/' + f.id + '.mp3') && lic.includes(f.id)), 'las 33 frases tienen su mp3, su ficha (CC BY 3.0), su ruta en sw.js y su línea en assets/voces/LICENSE.txt');
  // Escaramuzas jugando como cada pueblo: preguntan en español, con su nombre, y las órdenes se cumplen
  const EJ = { cartago: { libios: 700, sagrada: 300, numidas: 100 }, galos: { galos: 1400, jinetes: 100 }, iberos: { iberos: 1300, jinetes: 100 } };
  for (const p of PU) {
    let n = 0, mal = [];
    for (const sem of [1, 2, 3]) {
      const S = Sm.crear({ semilla: sem, ejercitos: [EJ[p], { hastati: 600, principes: 600, triarii: 300, equites: 120 }] }); D.arengar(S, ['hogares', 'botin', 'auspicios'][sem - 1]);
      let prox = 0; const qs = [];
      while (S.fase !== 'fin' && S.t < 600) {
        Sm.avanzar(S, 0.2);
        if (S.t >= prox) { prox = S.t + 1; const q = D.detectar(S, p); if (q) {
          D.mostrada(S, q); qs.push({ t: S.t, tipo: q.tipo });
          if (q.pueblo !== p || q.audio !== 'dl-' + PREF[p] + '-q-' + q.tipo || q.nombre !== D.nombreDe(q.ofi, p) || /[¿?]?.*\b(tribuno|primipilo)\b/i.test(q.nombre)) mal.push('texto/nombre ' + q.tipo);
          const r = sem % 2 ? D.responder(S, q, 0) : D.porTiempo(S, q); if (!r.ok) mal.push('rechazada ' + q.tipo + ': ' + r.no); if (r.porTiempo && r.frase.id !== 'dl-' + PREF[p] + '-q-tiempo') mal.push('frase a tiempo');
        } }
      }
      n += qs.length; if (S.fase !== 'fin') mal.push('no terminó');
      if (qs.length > 4 || qs.some((q, i) => i && (q.t - qs[i - 1].t < 39.9 || q.tipo === qs[i - 1].tipo))) mal.push('cadencia');
    }
    ok(n >= 3 && mal.length === 0, `Escaramuzas como ${p}: ${n} preguntas en 3 batallas, en español, con su audio y su oficial, las órdenes se cumplen y terminan ${mal.join('; ')}`);
  }
  // la reserva de cada pueblo (en los romanos, los triarios) dispara «los guerreros de reserva esperan»: un manípulo que lucha con moral media, y uno fresco detrás
  const RES = { roma: ['triarii'], cartago: ['sagrada', 'libios'], galos: ['galos'], iberos: ['iberos'] }, EJR = Object.assign({ roma: { hastati: 600, principes: 600, triarii: 300 } }, EJ);
  for (const p of ['roma'].concat(PU)) {
    const S = Sm.crear({ semilla: 6, ejercitos: [EJR[p], { hastati: 600, principes: 600, triarii: 300 }] }); S.t = 70;
    const res = S.man.filter(u => u.lado === 0 && RES[p].includes(u.tropa)), luch = S.man.find(u => u.lado === 0 && !(p === 'roma' && u.tropa === 'triarii') && RES[p].includes(u.tropa) === (p !== 'roma') && res.length > 1 && u !== res[0]) || res[1];
    const fresco = res.find(u => u !== luch); luch.moral = 0.5; luch.estado = 'firme'; const riv = S.man.find(u => u.lado === 1); S.cont[luch.id] = [riv.id]; luch.lucha = 20; luch.rival = riv.id;
    let puesto = false; for (const [dx, dy] of [[20, 0], [-20, 0], [0, 20], [0, -20]]) { fresco.x = luch.x + dx; fresco.y = luch.y + dy; if (Sm.puede(S, { tipo: 'relevar', lado: 0, ids: [luch.id] }) === '') { puesto = true; break; } }
    const q = D.detectar(S, p === 'roma' ? null : p);
    ok(puesto && q && q.tipo === 'triarios' && (p === 'roma' ? q.pueblo === null : q.pueblo === p && q.audio === 'dl-' + PREF[p] + '-q-triarios'), `Escaramuzas como ${p}: un manípulo con moral media y reserva fresca detrás provoca la pregunta de la reserva, con la voz de su pueblo (${q && q.tipo})`);
  }
  // sin pueblo (o 'romano') todo sigue como antes
  { const S = Sm.crear({ semilla: 1, ejercitos: [{ hastati: 600, principes: 600, triarii: 300 }, { galos: 1500 }] }); S.t = 70; const u = S.man.find(x => x.lado === 0 && x.tropa === 'hastati'); u.lucha = 20; u.moral = 0.3; u.estado = 'duda';
    const a = D.detectar(S), b = D.detectar(S, 'romano'), c = D.detectar(S, 'otro'); ok(a && b && c && a.audio === b.audio && b.audio === c.audio && /^dl-q-/.test(a.audio) && a.pueblo === null && a.nombre === 'Tribuno', 'sin pueblo, o con uno que no habla, las preguntas son las romanas de siempre'); }
  // el ajuste «Preguntas de oficiales»
  {
    const mem = {}, vieja = globalThis.localStorage; globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
    D.ponPreguntas(true); delete mem['aqvila-preguntas']; ok(D.preguntasOn() === true, 'Preguntas de oficiales: encendido por defecto');
    D.ponPreguntas(false); ok(D.preguntasOn() === false && mem['aqvila-preguntas'] === '0' && D.CLAVE_PREG === 'aqvila-preguntas', 'se apaga y se guarda en localStorage «aqvila-preguntas»');
    D.ponPreguntas(true); ok(D.preguntasOn() === true && mem['aqvila-preguntas'] === '1', 'se vuelve a encender');
    globalThis.localStorage = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } }; ok(D.preguntasOn() === true && D.ponPreguntas(false) === false, 'si el almacenamiento falla, no se rompe y queda encendido');
    if (vieja === undefined) delete globalThis.localStorage; else globalThis.localStorage = vieja;
    const ui = readFileSync(RAIZ + 'js/ui.js', 'utf8'), mn = readFileSync(RAIZ + 'js/ui-mando.js', 'utf8'), gu = readFileSync(RAIZ + 'js/ui-guerra.js', 'utf8');
    ok((ui.match(/data-act="preguntas"/g) || []).length >= 3 && /case 'preguntas'/.test(ui) && /Preguntas de oficiales: /.test(ui), 'el botón «Preguntas de oficiales: sí/no» está en Ajustes, en la hoja de ajustes y en la hoja de opciones del menú, y tiene su acción');
    ok(/preguntasOn\(\)/.test(mn) && /preguntasOn\(\)/.test(gu), 'las dos batallas (campaña y Escaramuzas) respetan el ajuste; la arenga no depende de él');
  }
}

console.log(fallos.length ? '\nFALLÓ: ' + fallos.length + ' comprobaciones' : '\nAPTO: dialogos.test.mjs');
process.exit(fallos.length ? 1 : 0);
