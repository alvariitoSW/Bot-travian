// AQVILA — SON9: pruebas de js/dialogos.js (la arenga y las preguntas de los oficiales), sin pantalla. node test/dialogos.test.mjs
import { createRequire } from 'node:module';
import { existsSync, statSync, readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Sm = require('../js/simulador.js'), D = require('../js/dialogos.js'), Reg = require('../js/registro.js');
const RAIZ = new URL('..', import.meta.url).pathname, fallos = [];
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const cerca = (a, b, e) => Math.abs(a - b) <= e;

// ---------- 1. Las arengas ----------
ok(D.ARENGAS.length === 3 && D.ARENGAS.every(a => a.nombre && a.efecto && a.lat && a.es && a.pron && a.fuente), 'hay 3 arengas, cada una con nombre, efecto en una línea, latín, castellano, pronunciación y fuente');
ok(new Set(D.ARENGAS.map(a => a.efecto)).size === 3, 'los tres efectos son distintos');
// las arengas en el simulador (campaña y Escaramuzas desde CG4b; las pruebas de la batalla vieja, js/guerra.js, se retiraron con ella)
{
  const mk = id => { const S = Sm.crear({ semilla: 3, ejercitos: [{ hastati: 600, principes: 600 }, { galos: 1200 }] }); D.arengar(S, id); return S; };
  const S0 = mk('ninguna'), S1 = mk('hogares'), S2 = mk('botin'), S3 = mk('auspicios');
  ok(S1.man.filter(u => u.lado === 0).every(u => cerca(u.moral, 1.04, 1e-9) && u.tope === 1.04) && S1.man.filter(u => u.lado === 1).every(u => u.moral === 1 && !u.tope), 'Escaramuzas: hogares sube +0,04 la moral de los manípulos del jugador y no la del rival');
  const u = S2.man.find(x => x.lado === 0); u.postura = 'empujar'; const v = S0.man.find(x => x.lado === 0); v.postura = 'empujar';
  ok(cerca(Sm.fuerza(u) / Sm.fuerza(v), 1.04, 1e-9), 'Escaramuzas: botín, fuerza al empujar ×1,04');
  ok(S3.man.filter(x => x.lado === 0).every(x => x.mod.moral === 0.92) && S3.arenga === 'auspicios', 'Escaramuzas: auspicios, pérdida de moral ×0,92');
  const C = Sm.cargar(Sm.guardar(S1)); ok(C.arenga === 'hogares' && C.man[0].tope === 1.04, 'Escaramuzas: la arenga sobrevive a guardar y cargar');
}
// ---------- 2. Las preguntas ----------
ok(D.PRIORIDAD.length === 6 && D.PRIORIDAD.every(t => D.PREGUNTAS[t] && D.PREGUNTAS[t].ops.length >= 2 && D.PREGUNTAS[t].ofi), 'seis tipos de pregunta, cada una con al menos 2 respuestas y un oficial');
ok(D.PRIORIDAD.every(t => D.PREGUNTAS[t].ops.every(o => o.txt && o.sub && o.moral > 0 && o.moral <= 0.1 && o.orden)), 'cada respuesta tiene texto, efecto dicho y un cambio de moral pequeño (hasta +10 %)');
ok(D.PRIORIDAD.every(t => D.PREGUNTAS[t].ops.filter(o => !o.req && !o.solo).length >= 2), 'cada pregunta se puede contestar siempre con 2 respuestas (sin depender de la caballería)');
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
        /* CG9 (autorizado por el vigía, 24/11): «retirar» trabado en lucha cuesta 0,05 de moral en el simulador (despegarse del enemigo, js/simulador.js) */
        const despega = op.o && op.o.tipo === 'retirar' && !!(S.cont && S.cont[u.id] && S.cont[u.id].length) ? 0.05 : 0;
        const r = D.responder(S, p, k); qs.push({ t: S.t, tipo: p.tipo }); if (!r.ok) hechas.push('rechazada ' + op.orden + ': ' + r.no);
        else { if (!cerca(u.moral, Math.min(u.tope || 1, Math.max(0, m0 - despega + op.moral)), 1e-9)) hechas.push('moral mal'); if (op.orden !== 'caballeria' && u.mando !== 'jugador') hechas.push('la orden no pasó al jugador'); }
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
    const ui = readFileSync(RAIZ + 'js/ui.js', 'utf8'), mn = readFileSync(RAIZ + 'js/ui-mando.js', 'utf8');
    ok((ui.match(/data-act="preguntas"/g) || []).length >= 3 && /case 'preguntas'/.test(ui) && /Preguntas de oficiales: /.test(ui), 'el botón «Preguntas de oficiales: sí/no» está en Ajustes, en la hoja de ajustes y en la hoja de opciones del menú, y tiene su acción');
    ok(/preguntasOn\(\)/.test(mn) && !existsSync(RAIZ + 'js/ui-guerra.js'), 'la batalla (una sola desde CG4b: campaña y Escaramuzas) respeta el ajuste; la arenga no depende de él');
  }
}

console.log(fallos.length ? '\nFALLÓ: ' + fallos.length + ' comprobaciones' : '\nAPTO: dialogos.test.mjs');
process.exit(fallos.length ? 1 : 0);
