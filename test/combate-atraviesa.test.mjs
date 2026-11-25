/* AQVILA — BT1 · «Nada atraviesa nada» (F0): picas, lanzas, brazos, escudos y caídos, en TODAS las escenas a pie.
   node test/combate-atraviesa.test.mjs            → recorre las escenas; código 1 si algo atraviesa algo
   node test/combate-atraviesa.test.mjs --viejo    → lo mismo con el carril de las sarisas de antes (FU3c, ?carril=viejo): debe FALLAR
   node test/combate-atraviesa.test.mjs falange    → solo las escenas cuyo nombre contiene «falange»
   Cada escena (la página gobierno/maquetas/bloque/ con sus parámetros) se abre a 390×844 congelada en marcha, se mide desde arriba y
   desde la vista del oficial, salta a la lucha y se mide otra vez desde los dos sitios. La medida es window.__bloque.choques()
   (gobierno/maquetas/bloque/fisica.js, medirChoques): la geometría que se pinta (matrices de las instancias, filas de huesos, triángulos
   del cuerpo, sarisas y muñones). Cualquier choque, o un error de consola, hace fallar la prueba. Tarda unos minutos (render por software). */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const RAIZ = new URL('../', import.meta.url).pathname, PUERTO = 8496;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const VIEJO = process.argv.includes('--viejo'), FILTRO = process.argv.slice(2).find(a => !a.startsWith('--')) || '';
const LP7_MAN = { semilla: 11, nivel: 'normal', fuerzas: { tuyo: 120, centro: 120, amigas: [0, 0], alas: [0, 0], reserva: 0, tiradores: 0 }, lejos: 30, r: null, g: null, rival: { los: 'los galos', Los: 'Galos' }, objetivo: 'Rompe su centro: se lucha hasta el 15 %' };
const LP7_FAL = { semilla: 11, lejos: 30, unidad: 'hastati', color: '#b8462e', rival: { Los: 'Hastati' }, objetivo: 'Rompe su línea: se lucha hasta el 15 %' };
/* [nombre, parámetros, fase de marcha] (la lucha es siempre ?fase=lucha, saltando desde la marcha) */
const ESCENAS = [
  ['manipulo', '', 'carga'],
  ['testudo', 'formacion=testudo', 'testudo'],
  ['falange-manipulos', 'formacion=falange&rival=manipulos', 'picas'],
  ['falange-caballeria', 'formacion=falange&rival=caballeria', 'picas'],
  ['falange-elefantes', 'formacion=falange&rival=elefantes', 'picas'],
  ['falange-falange', 'formacion=falange&rival=falange', 'picas'],
  ['asculo-pirro', 'formacion=combinada&escenario=asculo&bando=pirro', 'carga'],
  ['asculo-roma', 'formacion=combinada&escenario=asculo&bando=roma', 'carga'],
  ['bajar-manipulo', 'lp7=' + encodeURIComponent(JSON.stringify(LP7_MAN)), 'carga'],
  ['bajar-falange', 'formacion=falange&lp7=' + encodeURIComponent(JSON.stringify(LP7_FAL)), 'picas']
].filter(e => e[0].includes(FILTRO));

let srv = null;
async function servidor() {   /* si otro proceso tumba el servidor a mitad de recorrido, se levanta otra vez */
  if (srv && srv.exitCode === null && !srv.killed) return;
  srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
}
await servidor();
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let malos = 0; const tabla = [];
const mide = p => p.evaluate(() => { const r = window.__bloque.choques(); return { hombres: r.hombres, astas: r.astas, caidos: r.caidos, total: r.total, sarisas: r.choques.filter(c => c.arma === 'sarisa' || c.arma === 'muñón').length, cuenta: r.cuenta, muestra: r.choques.slice(0, 4).map(c => `${c.tipo} ${c.arma || c.parte || ''}: ${c.de} → ${c.en} (${c.cuanto} m)`) }; });
const espera = (p, ms) => p.waitForTimeout(ms);
try {
  for (const [nom, q, marcha] of ESCENAS) {
    await servidor();
    const p = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) err.push(m.text()); });
    const url = `http://localhost:${PUERTO}/gobierno/maquetas/bloque/?semilla=7&nivel=normal&fase=${marcha}${q ? '&' + q : ''}${VIEJO ? '&carril=viejo' : ''}`;
    try {
      await p.goto(url, { waitUntil: 'load' });
      await p.waitForFunction(() => window.__bloque && window.__bloque.listo && window.__bloque.choques && window.__bloque.gestos, null, { timeout: 240000 }); await espera(p, 6000);   /* gestos: los brazos de la tabla de gestos (espada y sarisa) ya se pintan */
      for (const fase of ['marcha', 'lucha']) {
        if (fase === 'lucha') { await p.evaluate(() => window.__bloque.salta('lucha')); await espera(p, 2500); }
        for (const vista of ['arriba', 'oficial']) {
          await p.evaluate(v => window.__bloque.vista && window.__bloque.vista.pon(v, true), vista); await espera(p, 1800);
          const r = await mide(p); tabla.push({ nom, fase, vista, ...r });
          const bien = r.total === 0 && r.hombres > 0;
          if (!bien) malos++;
          console.log(`${bien ? 'bien' : 'MAL '} ${nom} · ${fase} · ${vista}: ${r.total} choques, ${r.sarisas} de sarisas (${r.hombres} hombres, ${r.astas} astas, ${r.caidos} caídos) ${JSON.stringify(r.cuenta)}`);
          for (const m of bien ? [] : r.muestra) console.log('       ' + m);
        }
      }
    } catch (e) { malos++; console.log('MAL ', nom, '— no se pudo medir:', e.message.split('\n')[0]); }
    if (err.length) { malos++; console.log('MAL ', nom, '— errores de consola:', err.slice(0, 3).join(' | ')); }
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
const suma = tabla.reduce((s, r) => s + r.total, 0), sar = tabla.reduce((s, r) => s + r.sarisas, 0);
console.log(`\n${malos ? 'MAL' : 'bien'}: ${tabla.length} medidas, ${suma} choques en total, ${sar} de sarisas${VIEJO ? ' (con el carril viejo de las sarisas)' : ''}`);
process.exit(malos ? 1 : 0);
