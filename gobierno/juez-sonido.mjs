#!/usr/bin/env node
/* AQVILA — juez del Taller de Sonido (skill `sonido`; presupuesto en gobierno/arte.json → "sonido").
   Uso:  node gobierno/juez-sonido.mjs            mide cada sonido y comprueba licencia, ficha, caché, banco, peso y nivel
         node gobierno/juez-sonido.mjs --carta    además dibuja la «carta de sonidos» (la forma de onda de cada uno)
                                                  en gobierno/capturas-tarea/SON-carta.png, para enseñarla al usuario
   Aquí no se puede oír: el juez mide (peso, duración, volumen medio y pico) y el usuario escucha en su móvil.
   Sale con código 1 si algo falla. Los «aviso» no paran, pero van al parte. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);
const P = JSON.parse(readFileSync(join(RAIZ, 'gobierno', 'arte.json'), 'utf8')).sonido;
if (!P) { console.error('Falta el bloque "sonido" en gobierno/arte.json'); process.exit(2); }
const fallos = [], avisos = [];
const hayFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
if (!hayFfmpeg) avisos.push('no hay ffmpeg: no se miden duración ni volumen');

function mide(ruta) {
  if (!hayFfmpeg) return {};
  const pr = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=sample_rate,channels', '-of', 'json', ruta], { encoding: 'utf8' });
  const j = JSON.parse(pr.stdout || '{}'), s = (j.streams || [])[0] || {};
  const vd = spawnSync('ffmpeg', ['-nostats', '-i', ruta, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const num = re => { const m = vd.match(re); return m ? Number(m[1]) : NaN; };
  return { dur: Number(j.format?.duration), sr: Number(s.sample_rate), canales: Number(s.channels), media: num(/mean_volume: (-?[\d.]+) dB/), pico: num(/max_volume: (-?[\d.]+) dB/) };
}

const sw = readFileSync(join(RAIZ, 'sw.js'), 'utf8');
const REG = req(join(RAIZ, 'js', 'registro.js'));
const filas = [];
let total = 0;
for (const [carpeta, regla] of Object.entries(P.carpetas)) {
  const dir = join(RAIZ, carpeta);
  if (!existsSync(dir)) continue;
  let lic = ''; try { lic = readFileSync(join(dir, 'LICENSE.txt'), 'utf8'); } catch (e) { fallos.push(carpeta + 'LICENSE.txt no existe'); }
  for (const f of readdirSync(dir).filter(x => /\.(mp3|ogg|m4a|opus|wav)$/.test(x)).sort()) {
    const ruta = join(dir, f), kb = statSync(ruta).size / 1024, rel = carpeta + f, k = f.replace(/\.[^.]+$/, '');
    total += kb;
    const m = mide(ruta), r = (REG.sonidos || {})[k];
    filas.push({ rel, kb, ...m });
    if (!/\.(mp3)$/.test(f)) fallos.push(rel + ': formato no admitido (solo mp3, que suena en todos los móviles)');
    if (!lic.includes(f)) fallos.push(rel + ': no está en ' + carpeta + 'LICENSE.txt');
    if (!r || !r.credito || !r.fuente || !P.licencias.includes(r.licencia)) fallos.push(rel + ': falta su ficha completa en js/registro.js (R.sonidos) o su licencia no está admitida');
    if (!sw.includes("'" + rel + "'")) fallos.push(rel + ': no está en la caché de sw.js (no sonaría sin conexión)');
    if (kb > regla.archivoKB) fallos.push(`${rel}: ${kb.toFixed(0)} KB, tope ${regla.archivoKB} KB`);
    if (m.pico > P.picoMaxDB) fallos.push(`${rel}: pico ${m.pico} dB, satura (tope ${P.picoMaxDB})`);
    if (m.media < P.mediaDB[0] || m.media > P.mediaDB[1]) avisos.push(`${rel}: volumen medio ${m.media} dB, fuera de ${P.mediaDB[0]}…${P.mediaDB[1]} (sonará ${m.media < P.mediaDB[0] ? 'flojo' : 'fuerte'} junto al resto)`);
    if (m.canales && m.canales !== regla.canales) avisos.push(`${rel}: ${m.canales} canal(es); la regla de ${carpeta} pide ${regla.canales}`);
    if (m.sr && m.sr !== regla.hz) avisos.push(`${rel}: ${m.sr} Hz; la regla de ${carpeta} pide ${regla.hz}`);
    if (m.dur > regla.maxSeg) avisos.push(`${rel}: dura ${m.dur.toFixed(1)} s (regla: ≤ ${regla.maxSeg} s)`);
  }
}
if (total > P.descargaKB) fallos.push(`todo el sonido pesa ${total.toFixed(0)} KB; tope ${P.descargaKB} KB (subirlo lo decide el usuario)`);

// el banco de la batalla (js/gfx/sonido.js) y los archivos casan
try {
  const S = req(join(RAIZ, 'js', 'gfx', 'sonido.js'));
  const pide = new Set(S.archivos()), hay = new Set(filas.map(f => f.rel));
  for (const a of pide) if (!hay.has(a)) fallos.push(`js/gfx/sonido.js pide ${a} y no existe`);
  for (const a of hay) if (a.startsWith('assets/sonido/') && !pide.has(a)) avisos.push(`${a} no lo usa el banco de js/gfx/sonido.js (peso muerto)`);
} catch (e) { fallos.push('js/gfx/sonido.js no carga en Node: ' + e.message); }

// un solo grifo: todo el audio sale por Sonido.maestro (así el interruptor «Sonido» y el volumen valen para todo)
const recorre = d => readdirSync(join(RAIZ, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'vendor' ? [] : recorre(join(d, e.name))) : e.name.endsWith('.js') ? [join(d, e.name)] : []);
for (const f of recorre('js')) {
  if (f === join('js', 'gfx', 'sonido.js')) continue;
  const t = readFileSync(join(RAIZ, f), 'utf8');
  if (/\.destination\b/.test(t)) fallos.push(`${f} conecta directo a los altavoces (.destination): debe pasar por Sonido.maestro`);
  if (/new\s+(window\.)?(webkit)?AudioContext\b/.test(t)) fallos.push(`${f} crea su propio AudioContext: debe usar Sonido.contexto()`);
}

console.log('Juez de sonido · ' + filas.length + ' sonidos · ' + total.toFixed(0) + ' KB de ' + P.descargaKB + ' KB');
for (const f of filas) console.log(`  ${f.rel.padEnd(30)} ${f.kb.toFixed(1).padStart(6)} KB ${(f.dur || 0).toFixed(2).padStart(5)} s  media ${String(f.media).padStart(6)} dB  pico ${String(f.pico).padStart(5)} dB`);

if (process.argv.includes('--carta') && hayFfmpeg) {
  const tmp = mkdtempSync(join(tmpdir(), 'carta-'));
  filas.forEach((f, i) => spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', join(RAIZ, f.rel), '-filter_complex', 'showwavespic=s=360x70:colors=#c8a24a', '-frames:v', '1', join(tmp, i + '.png')]));
  const py = `import sys,json
from PIL import Image,ImageDraw
t,salida,f=sys.argv[1],sys.argv[2],json.loads(sys.argv[3])
col=2;w,h=380,100;filas=(len(f)+col-1)//col
im=Image.new('RGB',(w*col,h*filas+40),(32,26,20));d=ImageDraw.Draw(im)
d.text((10,12),'AQVILA - carta de sonidos (forma de onda; mas alta = mas fuerte)',fill=(240,225,190))
for i,x in enumerate(f):
  X,Y=(i%col)*w,(i//col)*h+40
  try: im.paste(Image.open(t+'/'+str(i)+'.png').convert('RGB'),(X+10,Y+24))
  except Exception: pass
  d.text((X+10,Y+6),x,fill=(240,225,190))
im.save(salida)`;
  const salida = join(RAIZ, 'gobierno', 'capturas-tarea', 'SON-carta.png');
  const r = spawnSync('python3', ['-I', '-c', py, tmp, salida, JSON.stringify(filas.map(f => `${f.rel.split('/').pop()} · ${(f.dur || 0).toFixed(1)} s · ${f.media} dB`))], { encoding: 'utf8' });
  console.log(r.status === 0 ? 'Carta: gobierno/capturas-tarea/SON-carta.png' : 'Carta no dibujada: ' + (r.stderr || '').trim().split('\n').pop());
}
for (const a of avisos) console.log('  aviso ' + a);
for (const x of fallos) console.log('  FALLA ' + x);
console.log(fallos.length ? `NO APTO · ${fallos.length} fallo(s)` : `APTO · ${avisos.length} aviso(s)`);
process.exit(fallos.length ? 1 : 0);
