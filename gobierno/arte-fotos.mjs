#!/usr/bin/env node
/* AQVILA — CM3: lista de las piezas de arte del juego y una foto pequeña de cada una, para el apartado «Arte» del cuadro de mando.
   Uso:  node gobierno/arte-fotos.mjs            → escribe gobierno/arte-piezas.json y las fotos que falten en gobierno/arte-fotos/
         node gobierno/arte-fotos.mjs --todas    → rehace todas las fotos
         node gobierno/arte-fotos.mjs --lista    → solo la lista (sin navegador)
   La lista sale de los datos que ya hay: assets/soldados, assets/units/units.json, assets/static/static.json, js/data.js (nombres)
   y js/registro.js (licencias). Las piezas que aún no son un modelo del juego (personajes de Meshy, escenas) usan una captura
   de gobierno/capturas-tarea/, recortada. Las fotos son JPG de 240×240 (≈8–15 KB): el cuadro tiene un tope de 16 MB. */
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..'), req = createRequire(import.meta.url);
const D = req(join(RAIZ, 'js', 'data.js')), R = req(join(RAIZ, 'js', 'registro.js'));
const existe = async f => { try { await stat(f); return true; } catch (e) { return false; } };
const OAD = '0 A.D. (Wildfire Games)', CCSA = 'CC BY-SA 3.0';
const piezas = [];
const pon = (grupo, id, nombre, origen, licencia, toma, extra) => piezas.push(Object.assign({ id: grupo + ':' + id, grupo, nombre, origen, licencia, foto: 'gobierno/arte-fotos/' + grupo + '-' + id + '.jpg', toma }, extra || {}));

/* ---- 1. Soldados de las batallas (assets/soldados): licencia de js/registro.js; los que no están en ninguna ficha son CC0 ---- */
const licSoldado = {};
for (const f of Object.values(R.fichas.tropa)) for (const a of [f.arte.batalla, f.arte.oficial, ...(f.arte.variantes || [])]) { const m = a && /assets\/soldados\/([\w-]+)\.bin/.exec(a.modelo || ''); if (m) licSoldado[m[1]] = a.licencia; }
const NOM_SOLDADO = { hastatus: 'Hastatus (legionario)', triario: 'Triario', velite: 'Vélite', centurion: 'Centurión', hondero: 'Hondero balear', peltasta: 'Peltasta', hoplita: 'Hoplita', falangita: 'Falangita macedonio',
  'oficial-falange': 'Oficial de la falange', ibero: 'Guerrero íbero', galo: 'Guerrero galo', 'galo-grande': 'Galo grande', 'galo-grande-v2a': 'Galo grande, versión 2a', 'galo-grande-v2b': 'Galo grande, versión 2b',
  'galo-rapido': 'Galo rápido', 'galo-rapido-b': 'Galo rápido B', 'galo-lancero': 'Galo lancero', 'jefe-galo': 'Jefe galo' };
const soldados = (await readdir(join(RAIZ, 'assets', 'soldados'))).filter(f => f.endsWith('.json') && !f.includes('_')).map(f => f.slice(0, -5));
const ordenS = Object.keys(NOM_SOLDADO); soldados.sort((a, b) => (ordenS.indexOf(a) + 99) % 99 - (ordenS.indexOf(b) + 99) % 99);
for (const s of soldados) { const lic = licSoldado[s] || (/galo-|jefe|centurion/.test(s) ? 'CC BY-SA 3.0 (generado con Meshy) y CC0 1.0' : 'CC0 1.0'), meshy = /Meshy/.test(lic);
  pon('soldado', s, NOM_SOLDADO[s] || s, meshy ? 'Generado por ti con Meshy y adaptado en AQVILA' : 'Hecho en AQVILA sobre MakeHuman y Quaternius', lic.replace(' (generado con Meshy)', '').replace(' (Meshy)', ''), { tipo: 'soldado', id: s }); }

/* ---- 2. Tropas del mapa y de los retratos (assets/units, 0 A.D.) ---- */
const NOM_UNIDAD = { ciudadana: 'Ciudadana', sacerdote: 'Sacerdote' };
for (const k of Object.keys(req(join(RAIZ, 'assets', 'units', 'units.json'))))
  pon('tropa', k, (D.UNITS[k] && D.UNITS[k].n) || NOM_UNIDAD[k] || k, ((R.fichas.tropa[k] || {}).arte || {}).provisional ? OAD + ' · figura provisional' : OAD, CCSA, { tipo: 'unidad', id: k });

/* ---- 3. Edificios, barcos, árboles y objetos (assets/static, 0 A.D.) ---- */
const NOM_STATIC = { aserradero: 'Aserradero', cantera: 'Cantera', mina: 'Mina de hierro', granja: 'Granja', foro: 'Foro', almacen: 'Almacén', mercado: 'Mercado', puerto: 'Puerto', cuartel: 'Cuartel', establo: 'Establo',
  templo: 'Templo (0 A.D.)', vesta: 'Templo redondo de Vesta', arco: 'Arco', casa: 'Casa romana', casa_b: 'Casa romana B', casa_c: 'Casa romana C', casa_d: 'Casa romana D', muro: 'Tramo de muralla', torre: 'Torre', puerta: 'Puerta de la muralla',
  barco: 'Barco mercante', trirreme: 'Trirreme romano', cart_trirreme: 'Trirreme púnico', grie_trirreme: 'Trirreme griego',
  cart_templo: 'Templo púnico', grie_templo: 'Templo griego', galo_centro: 'Casa grande gala', iber_centro: 'Centro íbero',
  grie_casa: 'Casa griega', grie_casa_b: 'Casa griega B', grie_casa_c: 'Casa griega C', grie_casa_d: 'Casa griega D', grie_casa_e: 'Casa griega E', cart_casa: 'Casa púnica', cart_casa_b: 'Casa púnica B', cart_casa_c: 'Casa púnica C',
  cipres: 'Ciprés', olivo: 'Olivo', pino: 'Pino', algarrobo: 'Algarrobo',
  prop_paja: 'Bala de paja', prop_paja_grande: 'Almiar', prop_pozo: 'Pozo', prop_carreta: 'Carreta', prop_puesto_cart: 'Puesto de mercado púnico', prop_mesa: 'Mesa', prop_cesto: 'Cesto', prop_sacos: 'Sacos', prop_vaso: 'Vasija', prop_caja: 'Caja', prop_cajas: 'Cajas' };
const grupoStatic = k => /trirreme|^barco$/.test(k) ? 'barco' : /^(cipres|olivo|pino|algarrobo)$/.test(k) ? 'arbol' : /^prop_/.test(k) ? 'objeto' : /^(cart|grie|galo|iber)_/.test(k) ? 'cultura' : 'edificio';
for (const k of Object.keys(req(join(RAIZ, 'assets', 'static', 'static.json')))) if (!k.startsWith('__'))
  pon(grupoStatic(k), k, NOM_STATIC[k] || k, OAD, CCSA, { tipo: 'static', id: k });

/* ---- 4. Personajes de las clases y de la política (MS3 y MS4): generados con Meshy, aún fuera del juego ---- */
const MESHY = 'Generado por ti con Meshy (plan de pago) · aún no está en el juego', LIC_M = 'tuya; se publicará como CC BY-SA 3.0';
const PERSONAJES = [['MS3', 'patricio', 'Patricio'], ['MS3', 'ecuestre', 'Ecuestre'], ['MS3', 'plebeyo', 'Plebeyo'], ['MS3', 'artesano-b', 'Artesano'], ['MS3', 'liberto-b', 'Liberto'], ['MS3', 'esclavo', 'Esclavo'],
  ['MS4', 'matrona', 'Matrona'], ['MS4', 'dama', 'Dama'], ['MS4', 'plebeya', 'Plebeya'], ['MS4', 'artesana', 'Artesana'], ['MS4', 'liberta', 'Liberta'], ['MS4', 'esclava', 'Esclava'],
  ['MS4', 'consul', 'Cónsul'], ['MS4', 'censor', 'Censor'], ['MS4', 'pontifice', 'Pontífice'], ['MS4', 'tribuno', 'Tribuno de la plebe'], ['MS4', 'edil', 'Edil'], ['MS4', 'cuestor', 'Cuestor'], ['MS4', 'legado', 'Legado'], ['MS4', 'publicano', 'Publicano']];
for (const [t, k, n] of PERSONAJES) { const src = 'gobierno/capturas-tarea/' + t + '-' + k + '-retrato.jpg'; if (await existe(join(RAIZ, src))) pon('personaje', k, n, MESHY, LIC_M, { tipo: 'imagen', src, pos: '50% 12%' }); }

/* ---- 5. Escenas: lo que se dibuja por código (mapa, ciudad, campos, batalla), con una captura del juego ---- */
const PROPIO = 'Hecho por código en AQVILA', MIXTO = 'Código de AQVILA con piezas de 0 A.D.';
const ESCENAS = [['mapa', 'Mapa de Italia', 'C18-italia.jpg', PROPIO, 'propia', '50% 40%'], ['mapamundi', 'Mapa del Mediterráneo', 'C18-mare.jpg', PROPIO, 'propia', '50% 40%'],
  ['ciudad', 'Roma desde lejos', 'CI3a-lejos.jpg', MIXTO, 'propia y ' + CCSA, '50% 45%'], ['barrios', 'Barrios e ínsulas', 'CI1-despues-barrios.jpg', MIXTO, 'propia y ' + CCSA, '50% 45%'],
  ['muralla', 'Muralla de toba', 'CI1-despues-muralla.jpg', PROPIO, 'propia', '50% 45%'], ['templo', 'Templo romano', 'CI1-despues-templo.jpg', PROPIO, 'propia', '50% 45%'],
  ['campos', 'Campos por suelos', 'AG1-cerca-verano.jpg', PROPIO, 'propia', '50% 45%'], ['ciudad-arriba', 'Ciudad desde arriba', 'CD5b-arriba.jpg', MIXTO, 'propia y ' + CCSA, '50% 45%'],
  ['senado', 'Sala del Senado', 'CE6-crecida-sala.jpg', PROPIO, 'propia', '50% 35%'], ['batalla', 'Batalla de manípulos', 'CG4-5-choque-v.jpg', MIXTO, 'propia y ' + CCSA, '50% 45%'],
  ['a-pie', 'Manípulo a pie', 'LP7-choque-v.jpg', 'Código de AQVILA con los soldados nuevos', 'propia, CC0 y CC BY', '50% 45%'], ['falange', 'Falange y elefantes', 'FE2-1-soldados-v.jpg', 'Código de AQVILA con los soldados nuevos', 'propia, CC0 y CC BY', '50% 45%'],
  ['menus', 'Menús de papiro y tablilla', 'MR2a-1-imperio.jpg', PROPIO, 'propia', '50% 30%']];
for (const [k, n, f, o, l, pos] of ESCENAS) { const src = 'gobierno/capturas-tarea/' + f; if (await existe(join(RAIZ, src))) pon('escena', k, n, o, l, { tipo: 'imagen', src, pos }); }

/* ---- fotos ---- */
const soloLista = process.argv.includes('--lista'), todas = process.argv.includes('--todas');
await mkdir(join(AQUI, 'arte-fotos'), { recursive: true });
const faltan = []; for (const p of piezas) if (todas || !(await existe(join(RAIZ, p.foto)))) faltan.push(p);
if (faltan.length && !soloLista) {
  const { chromium } = req('playwright');
  const srv = spawn('python3', ['-m', 'http.server', '8796', '-d', RAIZ], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const p of faltan) {
      const pag = await b.newPage({ viewport: { width: 240, height: 240 }, deviceScaleFactor: 1 });
      try {
        await pag.goto('http://localhost:8796/gobierno/arte-fotos.html?' + new URLSearchParams(p.toma));
        await pag.waitForFunction('window.__listo', null, { timeout: 120000 });
        if (await pag.evaluate('window.__listo') === true) { await pag.waitForTimeout(250); await pag.screenshot({ path: join(RAIZ, p.foto), type: 'jpeg', quality: p.toma.tipo === 'imagen' ? 72 : 78 }); console.log('foto', p.id); }
        else console.warn('SIN FOTO (no carga): ' + p.id);
      } catch (e) { console.warn('SIN FOTO: ' + p.id + ' · ' + String(e.message).split('\n')[0]); }
      await pag.close();
    }
  } finally { await b.close(); srv.kill(); }
}
let peso = 0, sin = [];
for (const p of piezas) { try { peso += (await stat(join(RAIZ, p.foto))).size; } catch (e) { sin.push(p.id); p.foto = ''; } delete p.toma; }
await writeFile(join(AQUI, 'arte-piezas.json'), JSON.stringify({ _ayuda: 'Lo escribe gobierno/arte-fotos.mjs; no se edita a mano. Lo lee gobierno/cuadro.mjs para el apartado «Arte».', piezas }, null, 1) + '\n');
console.log(piezas.length + ' piezas · fotos: ' + Math.round(peso / 1024) + ' KB' + (sin.length ? ' · SIN FOTO: ' + sin.join(', ') : ''));
