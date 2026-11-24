// FI3 «Pilum que rebotan o se clavan»: las varas del diseño (gobierno/estudios/FI3-diseno-proyectiles.md) en el testudo a pie.
// Una descarga de venablos contra el testudo cerrado y dos salvas de pila contra los galos, con y sin física, a saltos y sin
// dibujar (navegador por software). Falla (código ≠ 0) si una vara no se cumple o hay errores de consola.
// Uso: node gobierno/maquetas/a-pie/mide-fi3.mjs   (basado en captura-fi2.mjs; no hace fotos)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8384 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/a-pie/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
function escucha(page) {
  /* FU1: a-pie/ ahora lleva al bloque (testudo); estas pruebas miden la escena vieja: &antiguo=1 */
  { const ir = page.goto.bind(page); page.goto = (u, o) => ir(/a-pie\/(\?|$)/.test(u) ? u + (u.includes("?") ? "&" : "?") + "antiguo=1" : u, o); }
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
async function abre(q, w, h, d) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q); await lista(page); await page.waitForTimeout(1500); return { ctx, page };
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

/* una partida a saltos, sin dibujar: la descarga de venablos (testudo cerrado) o dos salvas de pila */
async function juega(q, que) {
  const { ctx, page } = await abre('?fase=' + (que === 'venablos' ? 'testudo' : 'pila') + q, 844, 390, 1);
  const r = await page.evaluate((que) => { const t = window.__tp, S = t.S; let malos = 0, muestras = 0, peor = 0, mano = 0; const detalle = [], sigue = { n: 0, mal: 0, max: 0 };
    const mide = () => { const m = t.proyectilesMide(); malos += m.malos; muestras += m.muestras; peor = Math.max(peor, m.malos); mano += m.mano || 0; if (m.sigue) { sigue.n += m.sigue.n; sigue.mal += m.sigue.mal; sigue.max = Math.max(sigue.max, m.sigue.max); } for (const d of m.detalle) if (detalle.length < 8) detalle.push({ T: +S.T.toFixed(2), ...d }); };
    const anda = n => { for (let i = 0; i < n; i++) { t.salta(0.1); mide(); } };
    if (que === 'venablos') { S.proxima = S.T + 0.2; anda(45); }
    else { for (let k = 0; k < 2; k++) { t.armar(); t.salta(0.84); t.soltar(); anda(32); } }
    const e = t.estado(), g = t.galos();
    return { activa: t.proyectilesActiva, T: +S.T.toFixed(2), malos, muestras, peor, detalle, sigue, mano, med: t.proyectiles(),
      reglas: { salvas: S.salvas, caidos: S.caidos, golpes: S.golpes, roto: S.roto, vivosR: S.romanos.filter(h => h.vivo).length, vivosG: S.galos.filter(h => h.vivo).length, porPila: g.porPila, venablosClavados: e.clavados, enHombre: e.enHombre, pilaClavados: g.clavados, pilaTierra: g.enTierra, pilaAire: g.enAire } };
  }, que);
  await cuadro(page); await cuadro(page);
  r.llamadas = await page.evaluate(() => window.__tp.renderer.info.render.calls);
  await ctx.close(); return r;
}
const pct = t => { const n = t.clava + t.rebota + t.resbala; return n ? `${Math.round(100 * t.clava / n)}% clava, ${Math.round(100 * t.rebota / n)}% rebota, ${Math.round(100 * t.resbala / n)}% resbala (${n})` : 'sin casos'; };
for (const que of ['venablos', 'pila'].filter(q => !op.solo || q === op.solo)) {   /* solo=venablos o solo=pila para medir una parte */
  console.log('— ' + que);
  const sin = await juega('&fisica=0', que), con = await juega('', que);
  console.log('  sin física ' + JSON.stringify({ T: sin.T, reglas: sin.reglas, llamadas: sin.llamadas }));
  console.log('  con física ' + JSON.stringify({ T: con.T, reglas: con.reglas, llamadas: con.llamadas, modos: con.med.modos, saltos: con.med.saltos, llegan: con.med.llegan, ms: con.med.ms }));
  bien(con.activa && !sin.activa, 'con y sin física');
  bien(JSON.stringify(con.reglas) === JSON.stringify(sin.reglas) && con.T === sin.T, 'reglas iguales (salvas, caídos, golpes, estado)');
  bien(con.muestras > 50 && con.malos === 0, `nada atraviesa: ${con.malos} muestras con el astil dentro de ${con.muestras} (peor ${con.peor}; aparte, el pilum aún en la mano de su lanzador: ${con.mano} puntos)${con.detalle.length ? ' ' + JSON.stringify(con.detalle) : ''}`);
  const T = con.med.tramos, A = con.med.aparte; console.log(`  por ángulo (solo cara de escudo, cuerpo y suelo): 0–30° ${pct(T[0])} · 30–60° ${pct(T[1])} · >60° ${pct(T[2])}`);
  console.log(`  aparte (por el sitio, no por el ángulo): ${Object.entries(A).map(([k, v]) => k + ' ' + v.clava + ' clava / ' + v.rebota + ' rebota').join(' · ')}`);
  bien(con.sigue.n === 0 || (con.sigue.mal === 0 && con.sigue.max < 0.01), `sigue a su dueño: ${con.sigue.n} medidas de clavados, ${con.sigue.mal} se separan ≥ 1 cm del hueso (máx ${(con.sigue.max * 100).toFixed(2)} cm)`);
  const fr = T.map(t => { const n = t.clava + t.rebota + t.resbala; return n >= 3 ? t.clava / n : null; }).filter(x => x !== null);
  bien(fr.every((x, i) => i === 0 || x <= fr[i - 1] + 1e-9), 'los clavados bajan al subir el ángulo');
  bien(con.med.ms.media <= 1, `coste: media ${con.med.ms.media} ms por paso (vara ≤ 1 ms); p95 ${con.med.ms.p95}, máx ${con.med.ms.max} informativos (${con.med.ms.pasos} pasos)`);
  bien(con.llamadas === sin.llamadas, `llamadas de dibujo iguales: ${con.llamadas} con física, ${sin.llamadas} sin ella`);
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
