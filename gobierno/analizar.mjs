#!/usr/bin/env node
/* AQVILA — «Analizar» (SK1, 27/11/2026): repaso de coherencia antes de construir.
   Idea tomada de spec-kit (github/spec-kit, licencia MIT, comando /analyze): solo lee, no cambia nada, y da una
   tabla de hallazgos con su gravedad. Aquí cruza lo que decide el usuario con lo que hay que hacer:
     · decisiones de la bitácora  ↔ tareas del tablero
     · planes (estudios)          ↔ tareas del tablero
     · partes                     ↔ estado en el tablero
     · especificaciones (gobierno/specs/*.md, plantilla gobierno/plantillas/especificacion.md):
       decisión → criterio → tarea, y el tope de la convergencia.
   Sin navegador ni red: segundos.

   Uso:
     node gobierno/analizar.mjs                          tablero + bitácora + partes + todas las specs
     node gobierno/analizar.mjs <plan.md> [rama:ruta.md]  añade planes (de esta rama o de otra: origin/<rama>)
     node gobierno/analizar.mjs --spec gobierno/specs/X.md   solo esa especificación (el paso del plan socialista)
     --desde DD/MM    decisiones desde ese día (por defecto, los 3 últimos días con decisiones)
     --md archivo     además escribe el informe en ese archivo
     --estricto       sale con error si hay algún CRÍTICO (lo usa el plan socialista antes de construir)
     --todo           también el historial viejo (tareas y partes anteriores a --desde)

   Gravedad: CRÍTICO = una decisión del usuario o un criterio sin tarea que lo cumpla, o una spec aprobada con dudas;
             ALTO = contradicción (tablero ≠ parte, cerrada bajo la vara, regla contraria a CLAUDE.md);
             MEDIO = cabo suelto o gasto desbordado; BAJO = orden y nombres. Máximo 50 en la tabla. */
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const G = p => join(RAIZ, 'gobierno', p);
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = n => { const i = args.indexOf(n); if (i < 0) return false; args.splice(i, 1); return true; };
const DESDE = opt('--desde'), MD = opt('--md'), SPEC = opt('--spec'), ESTRICTO = flag('--estricto'), TODO = flag('--todo');
const PLANES = args;

/* lee un archivo local o «rama:ruta» de git (sin tocar la copia de trabajo) */
function leer(ref) {
  const local = existsSync(ref) ? ref : join(RAIZ, ref);
  if (existsSync(local)) return readFileSync(local, 'utf8');
  const m = ref.match(/^([^:]+):(.+)$/);
  if (m) for (const r of [m[1], 'origin/' + m[1]]) {
    try { return execFileSync('git', ['-C', RAIZ, 'show', r + ':' + m[2]], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* sigue */ }
  }
  throw new Error('No encuentro ' + ref + ' (ni en local ni en git)');
}

const hallazgos = [];
const N = { CRÍTICO: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
function h(grav, tipo, donde, que, hacer) { N[grav]++; hallazgos.push({ grav, tipo, donde, que, hacer }); }
const corto = (s, n = 110) => { s = s.replace(/\s+/g, ' ').replace(/\|/g, '/').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const ID_RE = /\b([A-Z][A-Za-z]{0,4}\d{1,3}[a-z]?)\b/g;
const ids = txt => [...new Set([...txt.matchAll(ID_RE)].map(m => m[1]))];
const num = s => parseFloat(String(s).replace(',', '.'));

/* ---------- tablero: id → {estado, linea, n, seccion} ---------- */
const TAB = leer('gobierno/TABLERO.md').split('\n');
const tablero = new Map();
let seccion = '';
TAB.forEach((l, i) => {
  if (l.startsWith('## ')) seccion = l.slice(3);
  const m = l.match(/^\s*- (\S+) (?:\([^)]*\) )*([A-Za-z]+\d+[a-z]?)\b/);
  if (m && !tablero.has(m[2])) tablero.set(m[2], { estado: m[1], linea: l, n: i + 1, seccion, pausa: /en pausa/i.test(l) });
});
const TABTXT = TAB.join('\n');
/* existe: es tarea con su línea, o una sub-tarea suya (SUP5 → SUP5a), o cae en un tramo «ES2–ES4» */
const enTablero = id => {
  if (tablero.has(id)) return true;
  if ([...tablero.keys()].some(k => k.startsWith(id) && /^[a-z]$/.test(k.slice(id.length)))) return true;
  const m = id.match(/^([A-Za-z]+)(\d+)$/);
  return !!m && [...TABTXT.matchAll(new RegExp('\\b' + m[1] + '(\\d+)[–-]' + m[1] + '(\\d+)\\b', 'g'))].some(r => +r[1] <= +m[2] && +m[2] <= +r[2]);
};
const mencionado = id => new RegExp('\\b' + id + '\\b').test(TABTXT);   // sale en el texto (p. ej. dentro de otra tarea)
const abierta = e => ['⬜', '🔶', '🟨'].includes(e);

/* ---------- especificación suelta (paso del plan socialista) ---------- */
if (SPEC) { analizarSpec(SPEC); informe(); }

/* ---------- 1. decisiones de la bitácora ↔ tablero ---------- */
const BIT = leer('gobierno/BITACORA.md').split('\n');
const ini = BIT.findIndex(l => /^## Decisiones del usuario/.test(l));
const decisiones = [];
for (let i = ini + 1; i < BIT.length && !/^##/.test(BIT[i]); i++) {
  const m = BIT[i].match(/^- (\d{1,2})\/(\d{1,2})(?:\/\d{4})?\b/);
  if (m) decisiones.push({ dia: +m[1], mes: +m[2], txt: BIT[i], n: i + 1 });
}
const clave = d => d.mes * 100 + d.dia;
let desde;
if (DESDE) { const [d, m] = DESDE.split('/').map(Number); desde = m * 100 + d; }
else { const dias = [...new Set(decisiones.map(clave))].sort((a, b) => b - a); desde = dias[Math.min(2, dias.length - 1)] ?? 0; }
const SIN_OBRA = /\(no pide obra\)|regla del usuario|\bnorma\b|sin tope de gasto|relevo del vigía|ningún aviso de noche|se deja(n)? así|dejarlo así|subid[ao]s? a main|copiad[ao] a main|la 1\.0 \(v\d+\) subida|no se toca|ya decidid|cerrad[ao]s?\b|«A», se dejan/i;
const recientes = decisiones.filter(d => clave(d) >= desde);
const vistasDec = new Map();
for (const d of recientes) {
  const donde = 'BITACORA:' + d.n;
  const firma = d.txt.slice(0, 90);
  if (vistasDec.has(firma)) { h('BAJO', 'decisión repetida', donde, `igual que BITACORA:${vistasDec.get(firma)}`, 'dejar una sola'); continue; }
  vistasDec.set(firma, d.n);
  if (SIN_OBRA.test(d.txt)) continue;                                   // decisión que no pide obra
  const citados = ids(d.txt);
  const tareas = citados.filter(x => enTablero(x) || mencionado(x));
  const flecha = (d.txt.split('→')[1] || '');
  const prometidas = ids(flecha).filter(x => !enTablero(x) && !mencionado(x) && /^[A-Z]{2,}\d/.test(x));
  if (prometidas.length) h('CRÍTICO', 'decisión sin tarea', donde, `apunta a ${prometidas.join(', ')} y no está en el tablero: ${corto(d.txt, 80)}`, 'meter la tarea (vigía) o corregir la flecha');
  else if (!tareas.length) h('ALTO', 'decisión sin tarea', donde, corto(d.txt), 'decir qué tarea la cumple o escribir «(no pide obra)»');
  const pend = d.txt.match(/Pendiente[^.]*\./i);
  if (pend) h('MEDIO', 'cabo suelto', donde, corto(pend[0], 100), 'pregunta en «Esperando algo del usuario» o tarea con ID');
}

/* ---------- 2. planes ↔ tablero ---------- */
const NORMA_TOPE = /tope (de )?1[,.]5 M|pasa de \*\*1[,.]5 M/;
for (const ref of PLANES) {
  let txt; try { txt = leer(ref); } catch (e) { h('ALTO', 'plan ilegible', ref, e.message, 'revisar la ruta'); continue; }
  const nombre = basename(ref);
  const aprobado = /APROBAD|aprobad[ao] por el usuario|«1A»|aprueba/i.test(txt);
  const filas = txt.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(f => /^\|/.test(f.l) && !/^\|[\s-|]+$/.test(f.l));
  const vistos = new Set();
  for (const f of filas) {
    const celdas = f.l.split('|').slice(1, 3).map(c => c.replace(/\*/g, '').trim());
    for (const c of celdas) {
      if (!/^[A-Z]{1,4}\d{1,3}[a-z]?$/.test(c) || /^M\d$/.test(c) || vistos.has(c)) continue;  // M1–M5 son metas, no tareas
      vistos.add(c);
      if (!enTablero(c)) {
        h(aprobado ? 'CRÍTICO' : 'MEDIO', 'plan sin tarea', `${nombre}:${f.n}`, `${c} está en el plan${aprobado ? ' aprobado' : ''} y no en el tablero: ${corto(f.l, 70)}`, 'el vigía la mete con su orden, o el plan la quita');
        if (mencionado(c)) h('BAJO', 'ID repetido', `${nombre}:${f.n}`, `${c} ya sale en el tablero con otro sentido`, 'darle otro ID antes de que entre al tablero');
        const choca = existsSync(G('estudios')) && readdirSync(G('estudios')).find(x => x.startsWith(c + '-'));
        if (choca) h('BAJO', 'ID repetido', `${nombre}:${f.n}`, `${c} ya nombra otra cosa: estudios/${choca}`, 'darle otro ID antes de que entre al tablero');
      }
    }
  }
  if (!vistos.size) h('MEDIO', 'plan sin tareas', nombre, 'el plan no tiene ninguna tarea con ID en sus tablas', 'partirlo en tareas con ID, tamaño y gasto');
  const abiertos = (txt.match(/○/g) || []).length - (txt.match(/Marcas:.*○/) ? 1 : 0);
  const propuestos = (txt.match(/◐/g) || []).length - (txt.match(/Marcas:.*◐/) ? 1 : 0);
  if (aprobado && abiertos + propuestos > 0) h('MEDIO', 'aprobado con dudas', nombre, `${abiertos} puntos abiertos (○) y ${propuestos} propuestos sin «sí» (◐)`, 'aclarar los que use cada tarea ANTES de construirla');
  txt.split('\n').forEach((l, i) => { if (NORMA_TOPE.test(l)) h('ALTO', 'regla contraria', `${nombre}:${i + 1}`, 'dice «tope 1,5 M por tarea»; CLAUDE.md §7: sin tope ni corte (usuario 24/11)', 'quitar el tope del plan o que el usuario lo vuelva a poner'); });
}
/* la propia skill del plan socialista */
leer('.claude/skills/plan-socialista/SKILL.md').split('\n').forEach((l, i) => {
  if (NORMA_TOPE.test(l)) h('ALTO', 'regla contraria', `plan-socialista/SKILL.md:${i + 1}`, 'manda parar si pasa de 1,5 M; CLAUDE.md §7: sin tope ni corte', 'decide el usuario (pregunta del parte SK1)');
});

/* ---------- 3. tablero por sí solo y contra los partes ---------- */
/* una tarea es «de ahora» si su línea lleva una fecha ≥ --desde, o si está abierta y no en pausa */
const fechas = l => [...l.matchAll(/\b(\d{1,2})\/(\d{1,2})\b/g)].map(m => +m[2] * 100 + +m[1]).filter(k => k >= 1101 && k <= 1231);
const deAhora = t => TODO || fechas(t.linea).some(k => k >= desde) || (abierta(t.estado) && !t.pausa);
for (const [id, t] of tablero) {
  if (!deAhora(t)) continue;
  const donde = 'TABLERO:' + t.n;
  const relevo = [...t.linea.matchAll(/→ \**([A-Za-z]+\d+[a-z]?)\b/g)].map(m => m[1]).find(x => tablero.get(x)?.estado === '✅');
  if (relevo) continue;                                                 // lo terminó otra tarea ya hecha (AM2 → AM2b)
  if (t.estado === '✅' && /(\*\*|— |hech[ao] |construid[ao],? )a medias/i.test(t.linea)) h('ALTO', 'cerrada a medias', donde, `${id} está ✅ y dice «a medias»`, 'dejarla 🔶 o abrir la tarea que la termina (como PN3b)');
  const asp = t.linea.match(/[Aa]specto \**(\d+,\d+)/);
  if (t.estado === '✅' && asp && num(asp[1]) < 8.5 && !/8,5 en|aspecto 8,[5-9]|aspecto 9/i.test(t.linea.slice(asp.index + 12)))
    h('ALTO', 'bajo la vara', donde, `${id} ✅ con aspecto ${asp[1]} (vara 8,5)`, 'converger: otra vuelta o el «Bien» del usuario por escrito');
  const pct = t.linea.match(/\+(\d{3,})\s?%/), sobre = t.linea.match(/(\d+(?:,\d+)?) M sobre (\d+(?:,\d+)?)/), gordo = t.linea.match(/Gasto (\d+(?:,\d+)?) M/);
  if (pct) h('MEDIO', 'gasto desbordado', donde, `${id}: +${pct[1]} % sobre lo previsto`, 'tope de convergencia en su especificación');
  else if (sobre && num(sobre[1]) > 2 * num(sobre[2])) h('MEDIO', 'gasto desbordado', donde, `${id}: ${sobre[1]} M sobre ${sobre[2]}`, 'tope de convergencia en su especificación');
  else if (gordo && num(gordo[1]) > 10) h('MEDIO', 'gasto desbordado', donde, `${id}: ${gordo[1]} M sin presupuesto`, 'presupuesto y tope antes de la siguiente vuelta');
  if (abierta(t.estado) && !t.pausa && !/usuario|aprobad|aprueba|«/i.test(t.linea + t.seccion)) h('BAJO', 'tarea sin decisión', donde, `${id} abierta sin decisión del usuario a la vista`, 'citar su decisión o sacarla');
}
const PARTES = existsSync(G('partes')) ? readdirSync(G('partes')).filter(f => /^\d{4}-\d{2}-\d{2}-[A-Za-z]+\d+[a-z]?\.md$/.test(f)) : [];
for (const f of PARTES) {
  const id = f.slice(11, -3), t = tablero.get(id), k = +f.slice(5, 7) * 100 + +f.slice(8, 10);
  if (!TODO && k < desde) continue;
  const res = (readFileSync(G('partes/' + f), 'utf8').match(/\*\*Resultado\*\*:?\s*([^.\n]*)/i) || [])[1] || '';
  if (!t || !res) continue;
  const medias = /medias|bloquead|no apto/i.test(res), hecho = /^\s*hech/i.test(res);
  if (t.estado === '✅' && medias && !/a medias/i.test(t.linea)) h('ALTO', 'tablero ≠ parte', 'partes/' + f, `${id}: el parte dice «${corto(res, 30)}» y el tablero ✅`, 'el vigía corrige el tablero o abre la tarea que falta');
  if (abierta(t.estado) && hecho) h('MEDIO', 'tablero ≠ parte', 'partes/' + f, `${id}: el parte dice «hecho» y el tablero ${t.estado}`, 'el vigía la pasa a ✅');
}

/* ---------- 4. especificaciones ---------- */
if (existsSync(G('specs'))) for (const f of readdirSync(G('specs')).filter(x => x.endsWith('.md'))) analizarSpec('gobierno/specs/' + f, true);

informe();

/* Una especificación: decisión (D) → criterio (CA) → tarea, dudas y convergencia */
function analizarSpec(ref, enLote) {
  const txt = leer(ref), nom = basename(ref), L = txt.split('\n');
  const sec = t => { const i = L.findIndex(l => new RegExp('^## ' + t, 'i').test(l)); if (i < 0) return null; const out = []; for (let j = i + 1; j < L.length && !/^## /.test(L[j]); j++) out.push({ l: L[j], n: j + 1 }); return out; };
  const estado = ((txt.match(/\*\*Estado\*\*:[ \t]*([^<\n]+)/) || [])[1] || '?').trim();
  const aprobada = /aprobad|en obra|convergiendo|cerrad/i.test(estado);
  for (const s of ['Qué verá el jugador', 'Decisiones del usuario', 'Criterios de aceptación', 'Tareas', 'Convergencia'])
    if (!sec(s)) h('ALTO', 'spec incompleta', nom, `falta la sección «${s}»`, 'copiarla de gobierno/plantillas/especificacion.md');
  const dec = (sec('Decisiones del usuario') || []).filter(x => /^- \*\*D\d+\*\*/.test(x.l));
  const cas = (sec('Criterios de aceptación') || []).filter(x => /^- \*\*CA\d+\*\*/.test(x.l));
  const tar = (sec('Tareas') || []).filter(x => /^\|\s*[A-Z]/.test(x.l) && !/^\|\s*Tarea/i.test(x.l));
  const textoCasTar = cas.map(x => x.l).join('\n') + tar.map(x => x.l).join('\n');
  for (const d of dec) {
    const id = d.l.match(/D\d+/)[0];
    if (!new RegExp('\\b' + id + '\\b').test(textoCasTar)) h('CRÍTICO', 'decisión sin tarea', `${nom}:${d.n}`, `${id} no la cumple ningún criterio ni tarea: ${corto(d.l, 70)}`, 'añadir el criterio (CA «de ' + id + '») y su tarea');
  }
  if (!dec.length) h('MEDIO', 'spec sin decisiones', nom, 'no copia ninguna decisión del usuario (D1…)', 'copiarlas literales de la bitácora o del chat');
  for (const c of cas) {
    const id = c.l.match(/CA\d+/)[0];
    if (!/Se comprueba:/i.test(c.l)) h('ALTO', 'criterio sin prueba', `${nom}:${c.n}`, `${id} no dice cómo se comprueba`, 'comando, juez, ficha de aspecto o examen');
    if (!tar.some(t => new RegExp('\\b' + id + '\\b').test(t.l))) h('CRÍTICO', 'criterio sin tarea', `${nom}:${c.n}`, `${id} no lo cumple ninguna tarea`, 'añadirlo a la columna «Cumple» de una tarea');
  }
  for (const t of tar) {
    const id = t.l.split('|')[1].trim();
    if (aprobada && /^[A-Z]{1,4}\d{1,3}[a-z]?$/.test(id) && !enTablero(id)) h('ALTO', 'tarea fuera del tablero', `${nom}:${t.n}`, `${id} está en la spec aprobada y no en el tablero`, 'el vigía la mete');
  }
  const dudas = (txt.match(/\[POR ACLARAR/g) || []).length;
  if (dudas > 3) h('ALTO', 'demasiadas dudas', nom, `${dudas} marcas [POR ACLARAR] (máximo 3)`, 'aclarar con el usuario o decidir lo pequeño');
  if (dudas && aprobada) h('CRÍTICO', 'aprobada con dudas', nom, `estado «${estado}» con ${dudas} [POR ACLARAR]`, 'aclarar antes de construir');
  const conv = (sec('Convergencia') || []).map(x => x.l).join('\n');
  const tope = conv.match(/Tope:\s*\**(\d+(?:,\d+)?)\s*M/i);
  if (sec('Convergencia') && !tope) h('ALTO', 'sin tope', nom, 'la convergencia no tiene «Tope: N M»', 'poner el tope (presupuesto × 2) y el aviso al usuario');
  const vueltas = [...conv.matchAll(/^\|\s*\d+\s*\|\s*(\d+(?:,\d+)?)\s*\|/gm)].map(m => num(m[1]));
  const gastado = vueltas.reduce((a, b) => a + b, 0);
  if (tope && gastado > num(tope[1])) h('CRÍTICO', 'tope pasado', nom, `${vueltas.length} vueltas, ${String(gastado).replace('.', ',')} M de ${tope[1]}`, 'parar y preguntar al usuario: seguir, recortar o dejarlo');
  if (!enLote) console.log(`Spec ${nom}: ${dec.length} decisiones · ${cas.length} criterios · ${tar.length} tareas · ${dudas} dudas · estado ${estado}${tope ? ' · tope ' + tope[1] + ' M, gastado ' + String(gastado).replace('.', ',') + ' M' : ''}`);
}

function informe() {
  const orden = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
  hallazgos.sort((a, b) => orden.indexOf(a.grav) - orden.indexOf(b.grav));
  const todas = hallazgos.map((x, i) => `| A${i + 1} | ${x.grav} | ${x.tipo} | ${x.donde} | ${x.que} | ${x.hacer} |`);
  const pinta = filas => [
    `# Analizar · ${new Date().toISOString().slice(0, 10)}`,
    SPEC ? `Especificación: ${SPEC}` : `Tablero: ${tablero.size} tareas · bitácora: ${recientes.length} decisiones desde ${desde % 100}/${Math.floor(desde / 100)} · partes: ${PARTES.length} · planes: ${PLANES.join(', ') || 'ninguno'}`,
    '', '| # | Gravedad | Tipo | Dónde | Qué | Qué hacer |', '|---|---|---|---|---|---|', ...filas,
    hallazgos.length > filas.length ? `\n(${hallazgos.length - filas.length} más sin enseñar: todos con --md)` : '',
    '', `**${orden.map(g => g + ' ' + N[g]).join(' · ')}** → ${N['CRÍTICO'] ? 'NO APTO para construir' : 'APTO para construir'}`,
  ].join('\n');
  console.log(pinta(todas.slice(0, 50)));          // en pantalla, como spec-kit, como mucho 50
  if (MD) writeFileSync(MD, pinta(todas) + '\n');  // en el archivo, todos
  process.exit(ESTRICTO && N['CRÍTICO'] ? 1 : 0);
}
