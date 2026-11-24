/* AQVILA — FU2: el duelo del oficial en la escena única del bloque. Solo reglas: sin three.js ni DOM (corre en Node).
   Reglas copiadas del duelo de la maqueta a pie (TP1b, TP8b; gobierno/maquetas/a-pie/acciones.js), sin importar nada de allí.
   Licencia de juego: todas las cifras (tiempos, aliento, alcance del pilum, efectos en la moral).

   CONTRATO
     const O = crearOficial({ S, azar, alAviso })
       S        el estado de crearCombate (js/bloque-ia.js) con motor: S.tuyo (bloque de reglas) y S.B (bloque LP1 con B.hombres)
       azar     función 0..1 (si falta, una semilla propia)
       alAviso  (tipo, datos) opcional, para la escena:
                'arma' { tipo }  ·  'golpe' { res: 'parado'|'aguanta'|'herido'|'muere' }  ·  'estocada' { res: 'entra'|'mata'|'parada' }
                'empuja' { ok }  ·  'cae' { nuevo (hombre o null), muerto }  ·  'pilum' { de, a, dur }  ·  'pilum-cae' { mata, b }
     O.yo()                 el hombre LP1 que eres tú (h.yo = true), o null si ya no queda nadie
     O.pide(gesto, datos)   'estocada' · 'parar' (empieza a mantener) · 'suelta-parar' · 'empujar' · 'pilum-arma' (fuera del choque)
                            · 'pilum-suelta' { x, z } (punto del suelo; sin él, 18 m delante). Devuelve el lanzamiento { de, a, dur } o null
     O.paso(dt)             avanza el duelo, el aliento y los pilos en vuelo
     O.estado()             { duelo, yo, rival { fase 'guardia'|'arma'|'golpea'|'abierto'|'deseq', tipo, t (0..1 del armado), golpes, marcado } | null,
                              heridas, aliento, parando, pilum, carga (0..1 o null), eco { texto, tipo 'bien'|'mal'|'', t }, caidas, muertes }
     O.rival                el rival en curso { b, golpes, marcado, ... } o null. Al matarlo, marcado = true: la escena pasa la marca a la figura
                            que lo pinta (f.marcado, que tropas.js tira la primera) y pone rival.marcado = false.
   Hay DUELO solo si tu bloque tiene contacto y hay un bloque enemigo vivo en él. El rival es abstracto (golpes que lleva). */
import { local } from '../../../js/bloque-ia.js';

export const AVISO = 0.95, RAPIDO = 0.4, FINTA = 0.5, VENTANA = 0.45, GOLPE = 0.15;   /* armado (s) del tajo y del rápido, espera de la finta, ventana de parada, vuelo del brazo */
export const C_EST = 30, C_EMP = 25, C_PAR = 22, RECOBRA = 14, CONTRA = 0.22;           /* aliento: estocada, empujón, mantener la guardia (por s), recobro por s; contraataque (s) */
export const T_ABIERTO = 1.4, T_DESEQ = 1.5, CD_EMPUJA = 1.5, T_QUIETO = 0.35, HERIDAS = 3;
export const PILUMS = 2, T_CARGA = 0.8, CARGA_MIN = 0.3, PILUM_MIN = 8, PILUM_MAX = 30, PILUM_DEFECTO = 18, PILUM_V = 25, PILUM_COH = 3;
export const MATA_ANIMO = 0.04, MATAS_ANIMO = 0.03, CAES_ANIMO = 0.04;   /* FU2: la mitad que en el duelo viejo (0,08): con 0,08, no parar cambiaba el ganador */
export const NOMBRES = ['Tito', 'Marco', 'Lucio', 'Cayo', 'Quinto', 'Publio', 'Aulo', 'Sexto', 'Décimo', 'Gneo', 'Servio', 'Espurio', 'Manio', 'Tiberio', 'Numerio', 'Vibio', 'Póstumo', 'Opiter'];
export const nombreDe = h => h ? NOMBRES[h.i % NOMBRES.length] : '';

function semillaPropia(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) });

export function crearOficial({ S, azar, alAviso } = {}) {
  const rnd = azar || semillaPropia(20251124);
  const aviso = (t, d) => { try { if (alAviso) alAviso(t, d); } catch (e) { /* la pantalla no tumba las reglas */ } };
  const B = S && S.B, mitad = B ? (B.cols - 1) / 2 : 0;
  let T = 0, yoH = null, heridas = 0, aliento = 100, tPulsa = -9, manten = false, tManten = -9, tEmpuja = -9;
  let pilum = PILUMS, carga = null, tCarga = 0, caidas = 0, muertes = 0, rival = null;
  const vuelos = [], eco = { texto: '', tipo: '', t: -9 };
  const dice = (texto, tipo = '') => { eco.texto = texto; eco.tipo = tipo; eco.t = T; };
  const vivos = () => B ? B.hombres.filter(h => h.vivo) : [];
  const ponYo = h => { if (yoH) yoH.yo = false; yoH = h || null; if (yoH) yoH.yo = true; };
  /* al empezar: el vivo del centro de la primera fila */
  { const V = vivos().filter(h => h.fila === 0).sort((a, b) => Math.abs(a.col - mitad) - Math.abs(b.col - mitad)); ponYo(V[0]); }
  const centurion = yoH;

  const delEnemigo = b => b && b.bando !== S.tuyo.bando && b.estado !== 'fuera' && !b.U.roto && b.U.enPie > 0;
  function rivalEnContacto() { if (!yoH || !S.tuyo || !S.tuyo.contactos.length) return null; const c = S.tuyo.contactos.find(c => delEnemigo(c.b)); return c ? c.b : null; }
  const nuevoRival = b => ({ b, golpes: 0, marcado: false, tipo: null, t0: -9, tA: 0, tb: 0, ts: -9, pendiente: false, abierto: 0, deseq: 0, next: T + 1 + rnd() * 0.8, previo: null });
  const enDuelo = () => !!(rival && rivalEnContacto() === rival.b);

  /* el galo avisa: arma el brazo tA segundos (la finta espera FINTA más) y suelta en ts. 'contra' no se puede parar */
  function arma(forz) {
    const r = rnd(), tipo = forz || (r < 0.3 ? 'rapido' : r < 0.58 && rival.previo !== 'finta' ? 'finta' : 'tajo');   /* nunca dos fintas seguidas */
    rival.tipo = tipo; rival.previo = tipo; rival.t0 = T; rival.tA = tipo === 'rapido' ? RAPIDO : tipo === 'contra' ? CONTRA : AVISO;
    rival.tb = rival.tA + (tipo === 'finta' ? FINTA : 0); rival.ts = T + (tipo === 'contra' ? CONTRA : rival.tb + GOLPE); rival.pendiente = true;
    if (tipo !== 'contra') aviso('arma', { tipo });
  }
  function caes() {
    const muerto = yoH; muerto.vivo = false; caidas++;
    const U = S.tuyo.U; U.baja(1); U.anima(-CAES_ANIMO * (U.peso || 1));
    /* el siguiente de la fila: el de detrás en tu columna; si no, el de la primera fila más cerca */
    const V = vivos(); let n = V.filter(h => h.col === muerto.col).sort((a, b) => a.fila - b.fila)[0];
    if (!n && V.length) { const f0 = Math.min(...V.map(h => h.fila)); n = V.filter(h => h.fila === f0).sort((a, b) => Math.hypot(a.x - muerto.x, a.z - muerto.z) - Math.hypot(b.x - muerto.x, b.z - muerto.z))[0]; }
    ponYo(n); muerto.yo = false; heridas = 0; aliento = 100; manten = false; carga = null;
    if (rival) { rival.pendiente = false; rival.next = T + 1.5; }
    const era = muerto === centurion ? 'El centurión ha caído' : 'Has caído';
    dice(n ? era + ': ahora eres ' + nombreDe(n) : era, 'mal'); aviso('cae', { nuevo: n || null, muerto });
  }
  function golpe() {
    rival.pendiente = false; rival.next = T + 1.3 + rnd() * 1.3;
    if (rival.tipo !== 'contra' && manten && aliento > 0) {
      if (tManten >= rival.ts - VENTANA) { rival.abierto = T + T_ABIERTO; dice('¡Parado!', 'bien'); aviso('golpe', { res: 'parado' }); }
      else { dice('Lo aguantas', ''); aviso('golpe', { res: 'aguanta' }); }
      return;
    }
    heridas++;
    if (heridas >= HERIDAS) { aviso('golpe', { res: 'muere' }); caes(); return; }
    dice('Herido (' + heridas + ' de ' + HERIDAS + ')', 'mal'); aviso('golpe', { res: 'herido' });
  }
  function matas() {
    const b = rival.b; muertes++; rival.marcado = true;
    b.U.baja(1); S.tuyo.U.causa(1); b.U.anima(-MATA_ANIMO); S.tuyo.U.anima(MATAS_ANIMO);
    /* el siguiente galo da un paso al frente: mismo objeto rival (para que la escena vea la marca), golpes a cero */
    rival.golpes = 0; rival.next = T + 1.5 + rnd() * 0.8;
  }
  function estocada() {
    if (!enDuelo() || aliento < C_EST) { if (enDuelo()) dice('Sin aliento', 'mal'); return; }
    if (rival.pendiente && rival.tipo !== 'contra') { dice('Espera: para su golpe', 'mal'); return; }   /* FU2: como el duelo viejo: mientras arma o golpea, la estocada no sale */
    aliento -= C_EST; const ab = T < rival.abierto || T < rival.deseq; rival.abierto = 0; rival.deseq = 0;
    if (ab) {
      rival.golpes++; rival.pendiente = false;
      if (rival.golpes >= 2 || rnd() < 0.5) { matas(); dice('¡Buen golpe! Cae', 'bien'); aviso('estocada', { res: 'mata' }); }
      else { rival.next = Math.max(rival.next, T + 1.6 + rnd() * 0.8); dice('¡Buen golpe!', 'bien'); aviso('estocada', { res: 'entra' }); }
    } else { dice('Te para: ábrelo antes', 'mal'); aviso('estocada', { res: 'parada' }); arma('contra'); }
  }
  function empuja() {
    if (!enDuelo() || T < tEmpuja || aliento < C_EMP) return;
    tEmpuja = T + CD_EMPUJA; aliento -= C_EMP;
    const armando = rival.pendiente && rival.tipo !== 'contra' && T - rival.t0 < rival.tA * 0.9;
    if (!rival.pendiente || armando) {
      rival.pendiente = false; rival.deseq = T + T_DESEQ; rival.next = Math.max(rival.next, T + 2.4);
      dice(armando ? '¡Le cortas el golpe! Estocada' : 'Lo desequilibras: ¡estocada!', 'bien'); aviso('empuja', { ok: true });
    } else { dice('Tarde: para su golpe', 'mal'); aviso('empuja', { ok: false }); }
  }
  function lanza(p) {
    const c = carga; carga = null; if (c == null || c < CARGA_MIN || pilum <= 0 || !yoH) return null;
    pilum--; const de = { x: yoH.x, z: yoH.z }; let dx, dz;
    if (p && Number.isFinite(p.x) && Number.isFinite(p.z)) { dx = p.x - de.x; dz = p.z - de.z; } else { const f = fr(S.tuyo.ang); dx = f.x * PILUM_DEFECTO; dz = f.z * PILUM_DEFECTO; }
    const l = Math.hypot(dx, dz) || 1, max = PILUM_MIN + (PILUM_MAX - PILUM_MIN) * (c - CARGA_MIN) / (1 - CARGA_MIN), d = Math.max(PILUM_MIN, Math.min(l, max));
    const v = { de, a: { x: de.x + dx / l * d, z: de.z + dz / l * d }, dur: 0.6 + d / PILUM_V }; v.tCae = T + v.dur; vuelos.push(v);
    aviso('pilum', { de: v.de, a: v.a, dur: v.dur }); return { de: v.de, a: v.a, dur: v.dur };
  }
  function caePilum(v) {
    const b = S.bloques.find(b => delEnemigo(b) && (() => { const l = local(b, v.a.x, v.a.z); return l.delante <= 0 && l.delante >= -b.fondo && Math.abs(l.lado) <= b.ancho / 2 + 1; })());
    if (b) { b.U.baja(1); b.coh = Math.max(0, b.coh - PILUM_COH); dice('¡Pilum! Cae uno', 'bien'); } else dice('Al suelo', '');
    aviso('pilum-cae', { mata: !!b, b: b || null });
  }

  function pide(gesto, datos) {
    if (gesto !== 'pilum-arma' && gesto !== 'pilum-suelta') tPulsa = T;
    if (gesto === 'parar') { if (!manten) { manten = true; tManten = T; } }
    else if (gesto === 'suelta-parar') manten = false;
    else if (gesto === 'empujar') empuja();
    else if (gesto === 'estocada') estocada();
    else if (gesto === 'pilum-arma') { if (yoH && pilum > 0 && !S.tuyo.contactos.length && carga == null) { carga = 0; tCarga = T; } }
    else if (gesto === 'pilum-suelta') return lanza(datos);
    return null;
  }

  function paso(dt) {
    T += dt;
    /* el aliento: mantener la guardia gasta y no deja recobrar; si no pulsas un rato, se recobra */
    if (manten) aliento = Math.max(0, aliento - C_PAR * dt);
    else if (T - tPulsa > T_QUIETO) aliento = Math.min(100, aliento + RECOBRA * dt);
    if (carga != null) { if (S.tuyo.contactos.length) carga = null; else carga = Math.min(1, (T - tCarga) / T_CARGA); }
    for (let k = vuelos.length - 1; k >= 0; k--) if (T >= vuelos[k].tCae) { const v = vuelos.splice(k, 1)[0]; caePilum(v); }
    if (yoH && !yoH.vivo) ponYo(null);   /* por si otra regla lo mató siendo el último */
    const b = rivalEnContacto();
    if (!b) { if (rival) rival.pendiente = false; return; }
    if (!rival || rival.b !== b) rival = nuevoRival(b);
    if (rival.pendiente && T >= rival.ts) golpe();
    else if (!rival.pendiente && T >= rival.next && T >= rival.deseq && T >= rival.abierto) arma();
  }

  function estado() {
    const d = enDuelo(); let rv = null;
    if (d) {
      const fase = T < rival.abierto ? 'abierto' : T < rival.deseq ? 'deseq' : !rival.pendiente ? 'guardia' : T < rival.t0 + rival.tb ? 'arma' : 'golpea';
      rv = { fase, tipo: rival.tipo, t: rival.pendiente ? Math.min(1, (T - rival.t0) / (rival.tA || 1)) : 0, golpes: rival.golpes, marcado: rival.marcado };
    }
    return { duelo: d, yo: yoH, rival: rv, heridas, aliento, parando: manten, pilum, carga, eco: { ...eco }, caidas, muertes };
  }

  return { yo: () => yoH, pide, paso, estado, get rival() { return rival; } };
}
