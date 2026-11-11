#!/usr/bin/env node
/* AQVILA — Hacienda: cuánto ha gastado esta sesión, por modelo y por agente.
   Uso:  node gobierno/gasto.mjs [--desde AAAA-MM-DDTHH:MM] [--presupuesto 1,2]
   Lee las transcripciones que guarda Claude Code (~/.claude/projects/<proyecto>/): la del director y las de sus agentes.
   Unidad: «M» = millones de tokens equivalentes (misma cuenta que en fiebres-neutropenias):
   entrada ×1, escritura en caché ×1,25, lectura de caché ×0,1, salida ×5. No mezcla modelos: cada fila dice el suyo. */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const arg = n => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const desde = arg('--desde') ? new Date(arg('--desde')).getTime() : 0;
const base = join(homedir(), '.claude', 'projects');
if (!existsSync(base)) { console.log('No hay transcripciones en este equipo.'); process.exit(0); }

// la sesión más reciente de cualquier proyecto
let sesion = null;
for (const p of readdirSync(base)) for (const f of readdirSync(join(base, p))) {
  if (!f.endsWith('.jsonl')) continue; const ruta = join(base, p, f), t = statSync(ruta).mtimeMs;
  if (!sesion || t > sesion.t) sesion = { ruta, t };
}
if (!sesion) { console.log('No hay transcripciones.'); process.exit(0); }

function suma(ruta) {
  const vistos = new Set(), porModelo = {}; let pasos = 0;
  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    if (!linea.includes('"usage"')) continue;
    let j; try { j = JSON.parse(linea); } catch (e) { continue; }
    const m = j.message; if (!m || !m.usage || j.type !== 'assistant') continue;
    if (desde && new Date(j.timestamp).getTime() < desde) continue;
    if (m.id) { if (vistos.has(m.id)) continue; vistos.add(m.id); }      // un mensaje sale en varias líneas: se cuenta una vez
    const u = m.usage, eq = (u.input_tokens || 0) + 1.25 * (u.cache_creation_input_tokens || 0) + 0.1 * (u.cache_read_input_tokens || 0) + 5 * (u.output_tokens || 0);
    const k = (m.model || '?').replace(/^claude-/, ''); porModelo[k] = (porModelo[k] || 0) + eq; pasos++;
  }
  return { porModelo, pasos };
}
const M = n => (n / 1e6).toFixed(2).replace('.', ',') + ' M';
const filas = [['director', suma(sesion.ruta)]];
const sub = join(sesion.ruta.replace(/\.jsonl$/, ''), 'subagents');
if (existsSync(sub)) for (const f of readdirSync(sub, { recursive: true })) {
  if (!String(f).endsWith('.jsonl')) continue;
  let nombre = String(f).replace(/\.jsonl$/, '');
  try { const meta = JSON.parse(readFileSync(join(sub, nombre + '.meta.json'), 'utf8')); nombre = meta.description || meta.agentType || nombre; } catch (e) { }
  filas.push([nombre, suma(join(sub, String(f)))]);
}

const total = {};
for (const [nombre, s] of filas) for (const k in s.porModelo) { total[k] = (total[k] || 0) + s.porModelo[k]; console.log(nombre.slice(0, 40).padEnd(42) + k.padEnd(14) + String(s.pasos).padStart(4) + ' pasos  ' + M(s.porModelo[k])); }
const todo = Object.values(total).reduce((a, b) => a + b, 0);
console.log('TOTAL' + (desde ? ' desde ' + arg('--desde') : '') + ': ' + M(todo) + ' · ' + Object.keys(total).map(k => k + ' ' + M(total[k])).join(' · '));
const P = arg('--presupuesto');
if (P) { const n = parseFloat(P.replace(',', '.')) * 1e6, pc = Math.round((todo / n - 1) * 100); console.log('Presupuesto ' + P + ' M · gastado ' + M(todo) + ' (' + (pc >= 0 ? '+' : '') + pc + ' %)' + (todo > 1.25 * n ? ' · ALERTA +25 %: parar y contarlo al usuario' : '')); if (todo > 1.25 * n) process.exit(2); }
