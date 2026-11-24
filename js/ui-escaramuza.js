/* CG2a «Constructor de ejército» de Escaramuzas (estudios/ES0-objetivo-escaramuzas.md §4 y §6).
   Cuatro pasos: 1 Bandos · 2 Tu ejército · 3 Rival · 4 Campo. Se compra por manípulos (tope 24 por bando) con tope de denarios.
   Dificultad = dinero del rival. La máquina monta el ejército rival y se puede retocar.
   Solo pantalla: lee D (tropas), Simulador (tamaño de cada manípulo y formaciones) y REGISTRO (fuente histórica).
   Precios y bolsas: PROVISIONALES, licencia de juego. CG9 los cambia por los que salgan del bot. */
import { realPortrait } from './gfx/units.js';

const Dt = () => window.DATA, SIM = () => window.Simulador || {};
let dep = { pt: null, escudoSvg: () => '', campoPrev: () => '' };
export function init(d) { dep = Object.assign(dep, d); }

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const den = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const TOPE = 24;
const BOLSAS = { pequena: { n: 'Pequeña', d: 5000 }, mediana: { n: 'Mediana', d: 10000 }, grande: { n: 'Grande', d: 15000 } };
const DIF = { facil: { n: 'Fácil', k: 0.8, d: '20 % menos' }, normal: { n: 'Normal', k: 1, d: 'Lo mismo' }, dificil: { n: 'Difícil', k: 1.25, d: '25 % más' } };
const CAMPOS = { llano: 'Llano', colina: 'Colina', bosque: 'Bosque', mixto: 'Mixto' };
const FILTROS = { todas: 'Todas', inf: 'Infantería', tiro: 'Tiro', cab: 'Caballería' };
const PASOS = ['Bandos', 'Tu ejército', 'Rival', 'Campo'];
const CLAVE_GUARDADOS = 'aqvila-ejercitos-v1';

/* Seis pueblos. Roma: legión de Polibio 6.21 (hastati y príncipes iguales, triarios la mitad, vélites, équites).
   Los demás: las tropas de sus ciudades en D.CITIES (misma tabla de la campaña, con su dictamen), sin la milicia genérica.
   Los números son el peso de cada tropa en el «ejército típico». */
const PUEBLOS = ['roma', 'cartago', 'epiro', 'macedonia', 'galos', 'iberos'];
const NOMBRE = { roma: 'Roma', cartago: 'Cartago', epiro: 'Epiro', macedonia: 'Macedonia', galos: 'Galos', iberos: 'Íberos' };
let tropasCache = null;
function tropas(p) {
  if (!tropasCache) {
    tropasCache = { roma: { hastati: 360, principes: 360, triarii: 180, velites: 240, equites: 60 } };
    const C = Dt().CITIES || {};
    for (const id in C) {
      const c = C[id]; if (!PUEBLOS.includes(c.f) || c.f === 'roma') continue;
      const t = tropasCache[c.f] = tropasCache[c.f] || {};
      for (const k in c.g) if (k !== 'milicia' && Dt().UNITS[k]) t[k] = (t[k] || 0) + c.g[k];
    }
  }
  return tropasCache[p] || {};
}
const tam = t => (SIM().TAM && SIM().TAM[t]) || 120;
const cat = t => { const c = (Dt().UNITS[t] || {}).cls; return c === 'rng' ? 'tiro' : (c === 'cav' || c === 'ele') ? 'cab' : 'inf'; };
/* Precio de un manípulo (licencia de juego, provisional hasta CG9): valor por hombre según ataque, defensa, tiro y moral;
   el jinete vale 2,5 hombres y el elefante 16. Redondeado a 50. */
function precio(t) {
  const u = Dt().UNITS[t] || {}, por = (u.atk + u.def + (u.ratk || 0) * 0.8 + (u.mor || 50) / 10) * 0.25;
  const k = u.cls === 'cav' ? 2.5 : u.cls === 'ele' ? 16 : 1;
  return Math.max(50, Math.round(por * k * tam(t) / 50) * 50);
}

/* Estado de la pantalla. ej[0] tuyo, ej[1] rival: {tropa: manípulos}. */
const S = { paso: 1, pueblo: ['roma', 'cartago'], bolsa: 'mediana', dif: 'normal', gusto: false, dGusto: [10000, 10000],
  ej: [{}, {}], rivMano: false, editaRiv: false, filtro: 'todas', ficha: null, campo: 'llano', scroll: 0, aviso: '', rivFal: false };
const dinero = l => S.gusto ? S.dGusto[l] : l === 0 ? BOLSAS[S.bolsa].d : Math.round(BOLSAS[S.bolsa].d * DIF[S.dif].k);
const gasto = l => Object.keys(S.ej[l]).reduce((s, t) => s + S.ej[l][t] * precio(t), 0);
const cuenta = l => Object.values(S.ej[l]).reduce((s, n) => s + n, 0);
const hombres = l => Object.keys(S.ej[l]).reduce((s, t) => s + S.ej[l][t] * tam(t), 0);

/* La máquina monta un ejército típico: compra un manípulo cada vez de la tropa que más se aleja de su parte, mientras quepa. */
function tipico(p, dineroMax) {
  const w = tropas(p), tot = Object.values(w).reduce((a, b) => a + b, 0) || 1, m = {}; let gastado = 0, n = 0;
  while (n < TOPE) {
    let mejor = null, peor = Infinity;
    for (const t in w) {
      if (gastado + precio(t) > dineroMax) continue;
      const r = ((m[t] || 0) + 1) * tam(t) / (w[t] / tot);
      if (r < peor) { peor = r; mejor = t; }
    }
    if (!mejor) break;
    m[mejor] = (m[mejor] || 0) + 1; gastado += precio(mejor); n++;
  }
  return m;
}
/* si el dinero baja, se quitan manípulos (los más caros primero) hasta que quepa */
function recorta(l) {
  while (gasto(l) > dinero(l)) {
    const t = Object.keys(S.ej[l]).filter(k => S.ej[l][k] > 0).sort((a, b) => precio(b) - precio(a))[0]; if (!t) break;
    if (--S.ej[l][t] <= 0) delete S.ej[l][t];
  }
}
function rehazRival() { if (!S.rivMano) S.ej[1] = tipico(S.pueblo[1], dinero(1)); else recorta(1); }
let empezado = false;
function asegura() { if (empezado) return; empezado = true; S.ej[0] = tipico(S.pueblo[0], dinero(0)); rehazRival(); }

function guardados() { try { const x = JSON.parse(localStorage.getItem(CLAVE_GUARDADOS) || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; } }
function guarda(lista) { try { localStorage.setItem(CLAVE_GUARDADOS, JSON.stringify(lista.slice(0, 5))); } catch (e) { /* sin almacenamiento */ } }

/* ---------- acciones (data-act="escel", data-v="clave:valor") ---------- */
export function accion(v) {
  asegura();
  const i = v.indexOf(':'), k = v.slice(0, i), x = v.slice(i + 1), cuerpo = document.querySelector('#hoja .cg2-cuerpo');
  S.scroll = cuerpo ? cuerpo.scrollTop : 0; S.aviso = '';
  const lado = S.paso === 3 ? 1 : 0, mismoPaso = !['paso', 'ficha', 'fichax'].includes(k);
  if (!mismoPaso) S.scroll = 0;
  switch (k) {
    case 'paso': S.paso = Math.max(1, Math.min(4, +x)); S.ficha = null; break;
    case 'mio': if (PUEBLOS.includes(x)) { if (x === S.pueblo[1]) { S.pueblo[1] = S.pueblo[0]; S.rivMano = false; } S.pueblo[0] = x; S.ej[0] = tipico(x, dinero(0)); rehazRival(); } break;
    case 'riv': if (PUEBLOS.includes(x)) { if (x === S.pueblo[0]) { S.pueblo[0] = S.pueblo[1]; S.ej[0] = tipico(S.pueblo[0], dinero(0)); } S.pueblo[1] = x; S.rivMano = false; rehazRival(); } break;
    case 'bolsa':
      if (x === 'gusto') { if (!S.gusto) S.dGusto = [dinero(0), dinero(1)]; S.gusto = true; }
      else if (BOLSAS[x]) { const antes = dinero(0); S.gusto = false; S.bolsa = x; if (dinero(0) > antes && !cuenta(0)) S.ej[0] = tipico(S.pueblo[0], dinero(0)); }
      recorta(0); rehazRival(); break;
    case 'dif': if (DIF[x]) { S.dif = x; rehazRival(); } break;
    case 'gusto': { const [l, d] = x.split(','); S.dGusto[+l] = Math.max(2000, Math.min(30000, S.dGusto[+l] + (+d))); recorta(+l); rehazRival(); break; }
    case 'filtro': if (FILTROS[x]) S.filtro = x; break;
    case 'mas': case 'menos': {
      const l = S.ficha ? S.ficha.lado : lado, e = S.ej[l];
      if (k === 'mas') {
        if (cuenta(l) >= TOPE) S.aviso = 'Tope de ' + TOPE + ' manípulos por bando.';
        else if (gasto(l) + precio(x) > dinero(l)) S.aviso = 'No llega el dinero para otro manípulo de ' + Dt().UNITS[x].n + '.';
        else e[x] = (e[x] || 0) + 1;
      } else if (e[x] > 0 && --e[x] <= 0) delete e[x];
      if (l === 1) S.rivMano = true;
      break;
    }
    case 'tipico': S.ej[lado] = tipico(S.pueblo[lado], dinero(lado)); if (lado === 1) S.rivMano = false; break;
    case 'vacia': S.ej[lado] = {}; if (lado === 1) S.rivMano = true; break;
    case 'editariv': S.editaRiv = x === '1'; break;
    case 'ficha': { const [t, l] = x.split(','); S.ficha = Dt().UNITS[t] ? { t, lado: +l || 0 } : null; break; }
    case 'fichax': S.ficha = null; break;
    case 'campo': if (CAMPOS[x]) S.campo = x; break;
    case 'rivfal': S.rivFal = !S.rivFal; break;   /* FA7: pliega o despliega «Elige rival» de la prueba Falange a pie */
    case 'guarda': {
      if (!cuenta(0)) { S.aviso = 'Tu ejército está vacío.'; break; }
      const g = guardados(), n = NOMBRE[S.pueblo[0]] + ' · ' + den(gasto(0)) + ' ◎ · ' + cuenta(0) + ' manípulos';
      g.unshift({ n, pueblo: S.pueblo[0], m: Object.assign({}, S.ej[0]) }); guarda(g); S.aviso = 'Guardado: «' + n + '». Lo tienes en el paso 1.'; break;
    }
    case 'carga': { const g = guardados()[+x]; if (g && PUEBLOS.includes(g.pueblo)) { if (g.pueblo === S.pueblo[1]) { S.pueblo[1] = S.pueblo[0]; S.rivMano = false; } S.pueblo[0] = g.pueblo; S.ej[0] = {}; let n = 0; for (const t in (g.m || {})) { const q = Math.min(TOPE - n, g.m[t] | 0); if (q > 0 && tropas(g.pueblo)[t]) { S.ej[0][t] = q; n += q; } } recorta(0); rehazRival(); S.aviso = 'Cargado. Míralo en «Tu ejército».'; } break; }
    case 'borra': { const g = guardados(); g.splice(+x, 1); guarda(g); break; }
  }
}
/* tras repintar la hoja: la lista vuelve a donde estaba (si no se cambió de paso) */
export function restaura() { const c = document.querySelector('#hoja .cg2-cuerpo'); if (c && S.scroll) c.scrollTop = S.scroll; }

/* ---------- lo que necesita la batalla ---------- */
export function listo() { asegura(); return cuenta(0) > 0 && cuenta(1) > 0; }
export function batalla() {
  asegura(); S.paso = 1; S.ficha = null;   /* la próxima vez se abre en el paso 1 */
  const hom = l => { const r = {}; for (const t in S.ej[l]) if (S.ej[l][t] > 0) r[t] = S.ej[l][t] * tam(t); return r; };
  const ejercitos = [hom(0), hom(1)]; ejercitos.pueblo = S.pueblo[0];   /* SON5: el pueblo nuestro (decide en qué lengua gritan los nuestros) viaja en el propio arreglo: js/ui.js solo reenvía semilla, ejercitos y campo */
  return { semilla: (Math.random() * 1e9) >>> 0, campo: S.campo, fac: S.pueblo[1], pueblo: S.pueblo[0], ejercitos };
}

/* ---------- pintar ---------- */
const col = p => (Dt().FACTIONS[p] || { col: '#555' }).col;
function retrato(t, p) {
  const c = col(p), u = (() => { try { return realPortrait(t, c); } catch (e) { return ''; } })();
  if (u) return '<img src="' + u + '" alt="">';
  return dep.pt ? dep.pt(t, c) : '<span>' + esc((Dt().UNITS[t] || {}).g || '?') + '</span>';
}
function sabe(t) {
  const F = SIM().FORMAS || {}, s = ((SIM().SABE || {})[t] || []).filter(f => f !== 'linea' && f !== 'columna').map(f => (F[f] && F[f].n) || f);
  const u = Dt().UNITS[t] || {}; if (u.ratk) s.push('Tiro');
  if (t === 'hastati' || t === 'principes') s.push('Pilum');
  return s.length ? s : ['Línea'];
}
const BARRAS = [['Ataque', u => u.atk + (u.ratk || 0) * 0.5, 16], ['Defensa', u => u.def, 16], ['Moral', u => u.mor, 100], ['Velocidad', u => u.spd, 82]];
const barras = u => '<div class="cg2-barras">' + BARRAS.map(([n, f, m]) => '<span>' + n + '</span><i><b style="width:' + Math.round(100 * Math.min(1, f(u) / m)) + '%"></b></i>').join('') + '</div>';
const queEs = t => ({ inf: 'infantería', tiro: 'tiro', cab: Dt().UNITS[t].cls === 'ele' ? 'elefantes' : 'caballería' })[cat(t)];
const unidadTxt = t => tam(t) + (Dt().UNITS[t].cls === 'ele' ? ' elefantes' : Dt().UNITS[t].cls === 'cav' ? ' jinetes' : ' hombres');

function tarjeta(t, l, edita) {
  const u = Dt().UNITS[t], n = S.ej[l][t] || 0, p = precio(t);
  const caro = gasto(l) + p > dinero(l) || cuenta(l) >= TOPE;
  return '<div class="cg2-tar' + (n ? ' on' : '') + '"><button class="cg2-ret" data-act="escel" data-v="ficha:' + t + ',' + l + '" aria-label="Ficha de ' + esc(u.n) + '">' + retrato(t, S.pueblo[l]) + '</button>' +
    '<b class="cg2-n">' + esc(u.n) + '</b><small>' + unidadTxt(t) + ' · ' + queEs(t) + '</small><em>' + sabe(t).map(esc).join(' · ') + '</em>' + barras(u) +
    '<div class="cg2-com"><span class="cg2-pr">' + den(p) + ' ◎</span>' + (edita
      ? '<button class="cg2-bt" data-act="escel" data-v="menos:' + t + '" aria-label="Quitar un manípulo"' + (n ? '' : ' disabled') + '>−</button><b class="cg2-cant">' + n + '</b><button class="cg2-bt" data-act="escel" data-v="mas:' + t + '" aria-label="Añadir un manípulo"' + (caro ? ' aria-disabled="true"' : '') + '>+</button>'
      : '<b class="cg2-cant">× ' + n + '</b>') + '</div></div>';
}
function rejilla(l, edita) {
  const ts = Object.keys(edita ? tropas(S.pueblo[l]) : S.ej[l]).filter(t => (edita || S.ej[l][t] > 0) && (S.filtro === 'todas' || !edita || cat(t) === S.filtro));
  return ts.length ? '<div class="cg2-rej">' + ts.map(t => tarjeta(t, l, edita)).join('') + '</div>' : '<p class="cg2-nota">Nada que mostrar.</p>';
}
const herramientas = l => '<div class="cg2-herr"><button class="chip" data-act="escel" data-v="tipico:">Ejército típico</button><button class="chip" data-act="escel" data-v="vacia:">Vaciar</button>' +
  (l === 0 ? '<button class="chip" data-act="escel" data-v="guarda:">Guardar este ejército</button>' : '<button class="chip" data-act="escel" data-v="editariv:0">Listo</button>') + '</div>';
const filtros = () => '<div class="cg2-filtros">' + Object.keys(FILTROS).map(f => '<button class="chip' + (S.filtro === f ? ' on' : '') + '" data-act="escel" data-v="filtro:' + f + '">' + FILTROS[f] + '</button>').join('') + '</div>';
const escudos = (k, l) => '<div class="cg2-pueblos">' + PUEBLOS.map(p => '<button class="cg2-pue' + (S.pueblo[l] === p ? ' on' : '') + '" data-act="escel" data-v="' + k + ':' + p + '">' + dep.escudoSvg(col(p)) + '<span>' + NOMBRE[p] + '</span></button>').join('') + '</div>';
const tabl = (ops, sel, k) => '<div class="ro-tablilla cg2-tab">' + ops.map(([v, n, d]) => '<button class="' + (sel === v ? 'on' : '') + '" data-act="escel" data-v="' + k + ':' + v + '">' + esc(n) + (d ? '<small>' + esc(d) + '</small>' : '') + '</button>').join('') + '</div>';

function paso1() {
  const g = guardados();
  const gusto = l => '<div class="cg2-gusto"><span>' + (l ? 'Rival' : 'Tú') + '</span><button class="cg2-bt" data-act="escel" data-v="gusto:' + l + ',-1000" aria-label="Mil denarios menos">−</button><b>' + den(S.dGusto[l]) + ' ◎</b><button class="cg2-bt" data-act="escel" data-v="gusto:' + l + ',1000" aria-label="Mil denarios más">+</button></div>';
  return '<p class="ro-rubrica cg2-r">Tu pueblo</p>' + escudos('mio', 0) +
    '<p class="ro-rubrica cg2-r">Rival</p>' + escudos('riv', 1) +
    '<p class="ro-rubrica cg2-r">Dinero para gastar</p>' + tabl(Object.keys(BOLSAS).map(b => [b, BOLSAS[b].n, den(BOLSAS[b].d)]).concat([['gusto', 'A mi gusto', 'Tú eliges']]), S.gusto ? 'gusto' : S.bolsa, 'bolsa') +
    (S.gusto ? gusto(0) + gusto(1)
      : '<p class="ro-rubrica cg2-r">Dificultad · dinero del rival</p>' + tabl(Object.keys(DIF).map(d => [d, DIF[d].n, DIF[d].d]), S.dif, 'dif')) +
    (g.length ? '<p class="ro-rubrica cg2-r">Mis ejércitos</p><div class="cg2-guard">' + g.map((x, i) => '<div><button class="chip" data-act="escel" data-v="carga:' + i + '">' + esc(x.n) + '</button><button class="cg2-bx" data-act="escel" data-v="borra:' + i + '" aria-label="Borrar">×</button></div>').join('') + '</div>' : '') +
    '<p class="ro-rubrica cg2-r">Pruebas rápidas</p><div class="cg2-pruebas"><a class="esc-testudo" href="gobierno/maquetas/a-pie/"><span><b>Testudo a pie</b><small>Cruza el campo bajo los venablos</small></span><i></i></a>' +
    '<button class="esc-falange' + (S.rivFal ? ' on' : '') + '" data-act="escel" data-v="rivfal:" aria-expanded="' + S.rivFal + '"><span><b>Falange a pie</b><small>Elige entre cuatro rivales</small></span><i></i></button>' + (S.rivFal ? rivalesFalange() : '') +
    '<a class="esc-lucha esc-manipulo" href="gobierno/maquetas/bloque/"><span><b>Manípulo a pie</b><small>Dibuja el frente y manda el bloque</small></span><i></i></a></div>';
}
/* LP3: «Manípulo a pie» sustituye a «Lucha a pie» (aprobado por el usuario: «A, cuando salga LP3»); usa el estilo de esc-lucha.
   FA7: los cuatro rivales de la prueba Falange a pie; cada uno abre la maqueta con ?rival= */
const RIV_FAL = [['manipulos', 'Manípulos', 'Romanos con pila'], ['caballeria', 'Caballería', 'Busca tu flanco'], ['elefantes', 'Elefantes', 'Se estrellan o te abren'], ['falange', 'Falange', 'Muro contra muro']];
const rivalesFalange = () => '<div class="esc-rv"><p class="esc-rv-t">Elige rival</p><div class="esc-rv-g">' + RIV_FAL.map(([k, n, d]) => '<a class="esc-rv-b" href="gobierno/maquetas/falange/?rival=' + k + '"><b>' + n + '</b><small>' + d + '</small></a>').join('') + '</div></div>';
function paso3() {
  const rotulo = '<p class="cg2-nota">' + (S.rivMano ? 'Ejército retocado por ti.' : 'La máquina ha comprado un ejército típico de ' + NOMBRE[S.pueblo[1]] + ' con su dinero.') + '</p>';
  if (S.editaRiv) return rotulo + herramientas(1) + filtros() + rejilla(1, true);
  return rotulo + '<div class="cg2-herr"><button class="chip" data-act="escel" data-v="editariv:1">Cambiar</button>' + (S.rivMano ? '<button class="chip" data-act="escel" data-v="tipico:">Que lo monte la máquina</button>' : '') + '</div>' + rejilla(1, false);
}
function paso4() {
  return '<p class="ro-rubrica cg2-r">Campo</p><div class="esc-campos cg2-campos">' + Object.keys(CAMPOS).map(k => '<button class="esc-campo' + (S.campo === k ? ' on' : '') + '" data-act="escel" data-v="campo:' + k + '">' + dep.campoPrev(k, col(S.pueblo[1])) + '<span>' + CAMPOS[k] + '</span></button>').join('') + '</div>' +
    '<p class="cg2-nota">El campo cambia el paisaje; la pelea aún no depende de él. Pronto podrás colocar tus tropas antes de empezar.</p>' +
    '<p class="cg2-nota">' + den(hombres(0)) + ' hombres tuyos contra ' + den(hombres(1)) + ' de ' + NOMBRE[S.pueblo[1]] + '.</p>';
}
function ficha() {
  const { t, lado } = S.ficha, u = Dt().UNITS[t], R = window.REGISTRO || {}, n = S.ej[lado][t] || 0;
  let h = null; for (const k in R) if (R[k] && typeof R[k] === 'object' && R[k][t] && R[k][t].historia) { h = R[k][t].historia; break; }
  const datos = [['Ataque', u.atk], ['Defensa', u.def], ['Moral', u.mor], ['Velocidad', u.spd]].concat(u.ratk ? [['Tiro', u.ratk], ['Alcance', u.range + ' m']] : []).concat(u.hp ? [['Vida', u.hp + ' hombres']] : []);
  const c = u.cls, bueno = c === 'spear' ? 'caballería y elefantes' : c === 'cav' ? 'tiradores y flancos al descubierto' : c === 'rng' ? 'tropas lentas, desde lejos' : c === 'ele' ? 'infantería en línea' : 'infantería ligera';
  const flojo = c === 'spear' ? 'flancos y tiro' : c === 'cav' ? 'lanzas y picas de frente' : c === 'rng' ? 'cuerpo a cuerpo y caballería' : c === 'ele' ? 'tiro y orden abierto' : 'caballería por el flanco';
  const edita = lado === 0 || S.editaRiv;
  return '<div class="cg2-ficha" role="dialog" aria-label="Ficha de ' + esc(u.n) + '"><div class="cg2-fcab"><b>' + esc(u.n) + '</b><button class="cg2-bt" data-act="escel" data-v="fichax:" aria-label="Cerrar la ficha">×</button></div>' +
    '<div class="cg2-fcu"><div class="cg2-fret">' + retrato(t, S.pueblo[lado]) + '</div><p class="cg2-nota">' + unidadTxt(t) + ' por manípulo · ' + den(precio(t)) + ' ◎' + (n ? ' · tienes ' + n : '') + '</p>' +
    '<div class="cg2-datos">' + datos.map(([k, v]) => '<span>' + k + '</span><b>' + v + '</b>').join('') + '</div>' +
    '<p class="cg2-r2">Sabe hacer</p><p>' + sabe(t).map(esc).join(' · ') + '</p>' +
    '<p class="cg2-r2">Bueno contra</p><p>' + bueno + '</p><p class="cg2-r2">Flojo contra</p><p>' + flojo + '</p>' +
    (h && h.texto ? '<p class="cg2-r2">Lleva</p><p>' + esc(h.texto) + '</p><p class="cg2-fte">Fuente: ' + esc(h.fuente) + '</p>' : u.d ? '<p>' + esc(u.d) + '</p>' : '') +
    '<p class="cg2-nota">Veteranía y los doce datos de cada tropa llegan con la próxima entrega.</p></div>' +
    (edita ? '<button class="btn ro-sello cg2-fadd" data-act="escel" data-v="mas:' + t + '">Añadir manípulo</button>' : '') + '</div>';
}
function pie() {
  const l = S.paso === 3 ? 1 : 0, quedan = dinero(l) - gasto(l), e = S.ej[l];
  const fichas = Object.keys(e).filter(t => e[t] > 0).map(t => (l === 0 || S.editaRiv)
    ? '<button class="cg2-fi" data-act="escel" data-v="menos:' + t + '" aria-label="Quitar un manípulo de ' + esc(Dt().UNITS[t].n) + '">' + esc(Dt().UNITS[t].n) + ' ×' + e[t] + '</button>'
    : '<span class="cg2-fi">' + esc(Dt().UNITS[t].n) + ' ×' + e[t] + '</span>').join('');
  const sig = S.paso < 4 ? '<button class="btn cg2-sig" data-act="escel" data-v="paso:' + (S.paso + 1) + '">' + PASOS[S.paso] + ' ›</button>' : '';
  return '<div class="cg2-pie"><div class="cg2-fichas">' + (fichas || '<span class="cg2-vacio">' + (l ? 'El rival' : 'Tu ejército') + ' está vacío</span>') + '</div>' +
    (S.aviso ? '<p class="cg2-aviso" role="status">' + esc(S.aviso) + '</p>' : '') +
    '<div class="cg2-din"><span>' + (l ? 'Al rival le quedan' : 'Te quedan') + '<b>' + den(quedan) + ' ◎</b><small>de ' + den(dinero(l)) + ' · ' + cuenta(l) + '/' + TOPE + ' manípulos</small></span>' +
    '<div class="cg2-bts">' + sig + '<button class="btn ro-sello cg2-go esc-go" data-act="escempieza">Al combate</button></div></div></div>';
}
export function html() {
  asegura();
  const lado = l => '<div class="cg2-lado">' + dep.escudoSvg(col(S.pueblo[l])) + '<span><b>' + NOMBRE[S.pueblo[l]] + '</b><small>' + (l ? (S.gusto ? 'a tu gusto' : DIF[S.dif].n) : 'tú') + ' · ' + den(dinero(l)) + ' ◎</small></span></div>';
  const cuerpo = S.paso === 1 ? paso1() : S.paso === 2 ? herramientas(0) + filtros() + rejilla(0, true) : S.paso === 3 ? paso3() : paso4();
  return '<div class="esc cg2" data-paso="' + S.paso + '">' +
    '<div class="cg2-ff">' + lado(0) + '<span class="cg2-vs">contra</span>' + lado(1) + '</div>' +
    '<div class="ro-tablilla cg2-pasos">' + PASOS.map((p, i) => '<button class="' + (S.paso === i + 1 ? 'on' : '') + '" data-act="escel" data-v="paso:' + (i + 1) + '">' + (i + 1) + ' ' + p + '</button>').join('') + '</div>' +
    '<div class="cg2-cuerpo">' + cuerpo + '</div>' + pie() + (S.ficha ? ficha() : '') + '</div>';
}
