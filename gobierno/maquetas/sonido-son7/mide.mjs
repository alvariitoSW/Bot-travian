/* SON7: mide qué suena en las tres escenas a pie (Testudo a pie, Falange, Manípulo a pie) durante la lucha.
   Cuenta cada sonido que sale del banco (Sonido.toca) por grupo y por capa, y las cifras del director del fragor.
   node gobierno/maquetas/sonido-son7/mide.mjs [puerto]  → gobierno/maquetas/sonido-son7/medida.json y un resumen en pantalla.
   Aquí no se oye: es «medido, sin oír». */
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'), { chromium } = createRequire(import.meta.url)('playwright'), PUERTO = +(process.argv[2] || 8737);
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ESPIA = `(() => { const S = window.Sonido, c = window.__son7 = { grupos: {}, n: 0, fondo: {} }; const t = S.toca;
  S.toca = function (ctx, a, g, o) { const r = t.apply(this, arguments); if (r) { c.grupos[g] = (c.grupos[g] || 0) + 1; c.n++; } return r; };
  const f = S.fondo; S.fondo = function (g, v) { c.fondo[g] = Math.max(c.fondo[g] || 0, v); return f.apply(this, arguments); }; return true; })()`;
const errores = [], salida = {};
const SOLO = process.argv[3];
async function escena(nombre, url, arranca, corre) {
  if (SOLO && SOLO !== nombre) return;
  const p = await nav.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', e => errores.push(nombre + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(nombre + ': ' + m.text()); });
  console.error('abre ' + nombre); await p.goto(`http://localhost:${PUERTO}/${url}`); await p.waitForTimeout(9000);
  await p.mouse.click(420, 200); await p.waitForTimeout(1500);
  await p.evaluate(ESPIA); if (arranca) await arranca(p); await p.waitForTimeout(1500);
  const r = await corre(p);
  const c = await p.evaluate(() => window.__son7); console.error('hecha ' + nombre + ' ' + JSON.stringify(r));
  salida[nombre] = { ...r, sonidos: c.n, grupos: c.grupos, fondoMax: c.fondo };
  await p.close();
}
const FR = 'const f = window.Fragor && window.Fragor.vivo; return { golpes: f ? f.golpes : 0, caidas: f ? f.caidas : 0, masas: f ? f.masas : 0, tension: f ? +f.tension.toFixed(2) : 0 };';
/* Testudo a pie: el tiempo corre a mano (salta) hasta pasado el choque; ordena «cargad» al llegar */
await escena('testudo', 'gobierno/maquetas/a-pie/index.html?fase=lucha', null, p => p.evaluate(`(async () => { const t = window.__tp; t.parar(true);
  for (let i = 0; i < 90; i++) { t.salta(0.5); if (t.S.choque && !t.__c) { t.__c = 1; t.ordena('cargad'); } await new Promise(r => setTimeout(r, 30)); }
  ${FR.replace('return {', 'return { choque: !!t.S.choque, fase: t.S.fase, caidosR: t.S.romanos.filter(h => !h.vivo).length, caidosG: t.S.galos.filter(g => !g.vivo).length,')} })()`));
/* Falange: con su bot */
await escena('falange', 'gobierno/maquetas/falange/index.html?inicio=0', null, p => p.evaluate(`(async () => { const t = window.__tp; t.parar(true);
  for (let i = 0; i < 90 && !t.S.choque; i++) { t.salta(0.5); await new Promise(r => setTimeout(r, 30)); }
  t.parar(false); await new Promise(r => setTimeout(r, 25000));   /* la falange suena en su propio bucle: se suelta la pausa */
  ${FR.replace('return {', 'return { choque: !!t.S.choque, fase: t.S.fase, caidosF: t.S.fal.filter(h => !h.vivo).length,')} })()`));
/* Manípulo a pie: nivel normal, salto al choque y 25 s de lucha en tiempo real (el bucle de la escena) */
await escena('manipulo', 'gobierno/maquetas/bloque/index.html', async p => { await p.evaluate(() => { const b = document.querySelector('[data-nivel="normal"]'); if (b) b.click(); }); await p.waitForTimeout(1500); await p.evaluate(() => window.__bloque.salta('choque')); },
  async p => { await p.waitForTimeout(25000); return p.evaluate(() => { const S = window.__bloque.S, b = window.__bloque, f = window.Fragor && window.Fragor.vivo; return { golpes: f ? f.golpes : 0, caidas: f ? f.caidas : 0, masas: f ? f.masas : 0, T: +S.T.toFixed(1), contactos: S.tuyo.contactos.length, caenTuyos: S.tuyo.U.sufrio, banda: !!(b.banda && b.banda.iniciada) }; }); });
await nav.close(); srv.kill();
salida.errores = errores;
writeFileSync(join(RAIZ, 'gobierno/maquetas/sonido-son7/medida' + (SOLO ? '-' + SOLO : '') + '.json'), JSON.stringify(salida, null, 1));
console.log(JSON.stringify(salida, null, 1));
