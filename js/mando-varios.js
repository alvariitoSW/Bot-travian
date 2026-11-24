/* ES2 · Mando de varios cuerpos (gobierno/estudios/ES1-escaramuza-combinada.md §2, §3 y §5). Corre en Node: sin pantalla.
   Una línea tuya de tres cuerpos: la falange (S.tuyo, un bloque tipo 'falange' de js/bloque.js) al centro y dos manípulos
   (S.amigas) a sus lados, con un hueco de HUECO m. Siempre hay UNO elegido (o «Todos») y todo gesto es para él.
   Se pone encima de un combate de js/bloque-ia.js (crearCombate) y cambia sus entradas: C.orden, C.frente, C.dibujaFrente y C.paso.
   Lo que no cambia: sin crearMando, el combate es el de siempre.

   crearMando(C, { MO, avisa, hueco }) → M
     M.cuerpos          [{ id, nombre, corto, tipo: 'falange'|'manipulo'|'extra', b }] (sin «todos»; «todos» es un id más)
     M.elegido          id del cuerpo elegido ('todos' al empezar)
     M.elige(id)        true si existe. Avisa a los que escuchan (M.escucha(f))
     M.ordenesDe(id)    los cuatro botones del cuerpo: ids de js/../hud.js (picas, cerrar, avanzar, alto, testudo, cargar, relevo, retirada)
     M.orden(n)         orden del cuerpo elegido (en pausa, se guarda y se cumple al reanudar). Devuelve true si la acepta
     M.dibujaFrente(a,b) frente del elegido: un cuerpo se coloca en la raya; «todos», la línea entera (falange al centro,
                        manípulos a sus lados con el hueco, los que ya estaban a esa mano)
     M.pausa / M.pon(true|false)   el tiempo se para; al reanudar, se cumplen las órdenes dadas en pausa, en su orden
     M.paso(dt)         un paso del combate (no hace nada en pausa)
     M.vida(id)         { n, de, f } hombres en pie, de cuántos, fracción
     M.util(id)         la orden que conviene iluminar al elegido, o null
     M.anade({ id, nombre, corto, ordenes, vida, alOrden, alFrente, b })   ES3: un cuerpo más (los tiradores) en la tira */
import { centro, GRADO, D_CARGA } from './bloque-ia.js';

const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) }), de = a => ({ x: Math.cos(a), z: Math.sin(a) });
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
export const HUECO = 8;
export const ORDENES_DE = { falange: ['picas', 'cerrar', 'avanzar', 'alto'], manipulo: ['testudo', 'cargar', 'relevo', 'alto'], todos: ['avanzar', 'alto', 'cargar', 'retirada'] };
const T_CIERRA = 6;

export function crearMando(C, { MO, avisa = () => {}, hueco = HUECO } = {}) {
  const S = C.S, orig = { orden: C.orden, frente: C.frente, dibujaFrente: C.dibujaFrente, paso: C.paso };
  const cuerpos = [
    { id: 'falange', nombre: 'Falange', corto: 'Falange', tipo: 'falange', b: S.tuyo },
    { id: 'man1', nombre: 'Manípulo I', corto: 'Man. I', tipo: 'manipulo', b: S.amigas[0] },
    { id: 'man2', nombre: 'Manípulo II', corto: 'Man. II', tipo: 'manipulo', b: S.amigas[1] }
  ];
  const M = { cuerpos, elegido: 'todos', pausa: false, cola: [], oyentes: [] };
  const aviso = t => { try { avisa(t); } catch (e) { /* la pantalla no tumba el mando */ } };
  const por = id => cuerpos.find(c => c.id === id) || null;
  const vivo = c => c.b && c.b.estado !== 'fuera' && !(c.b.U && c.b.U.roto);
  const avisaCambio = () => { for (const f of M.oyentes) try { f(M); } catch (e) { /* idem */ } };
  M.escucha = f => { M.oyentes.push(f); };
  let tCierra = -99;

  /* ---------- despliegue: la falange en el centro, un manípulo a cada lado con el hueco ---------- */
  function despliega() {
    const f = S.tuyo, wf = f.ancho;
    S.amigas.forEach((a, i) => { const lado = i === 0 ? -1 : 1; a.x = lado * (wf / 2 + hueco + a.ancho / 2); a.z = f.z; a.ang = f.ang; });
  }
  despliega();

  M.ordenesDe = id => ((por(id) || {}).ordenes) || ORDENES_DE[(por(id) || {}).tipo || 'todos'] || ORDENES_DE.todos;
  M.vida = id => {
    if (id === 'todos') { const L = cuerpos.filter(c => c.b), n = L.reduce((s, c) => s + c.b.U.enPie, 0), d = L.reduce((s, c) => s + c.b.U.hombres, 0); return { n, de: d, f: d ? n / d : 0 }; }
    const c = por(id); if (!c) return { n: 0, de: 0, f: 0 };
    if (c.vida) return c.vida();
    const n = c.b.U.enPie, d = c.b.U.hombres; return { n, de: d, f: d ? n / d : 0 };
  };

  /* ---------- una orden a un cuerpo ---------- */
  function avanza(c, m) {
    const b = c.b, f = fr(b.ang), o = { x: b.x + f.x * m, z: b.z + f.z * m, ang: b.ang };
    if (c.tipo === 'falange') orig.frente(o); else C.frenteDe(b, o);
  }
  function cierra() {
    const f = S.tuyo; if (!vivo({ b: f }) || S.T - tCierra < T_CIERRA) return false;
    tCierra = S.T; if (MO && S.B) MO.cierraFilas(S.B); f.coh = Math.min(100, f.coh + 8); aviso('Cerrad filas'); return true;
  }
  function ordenA(c, n) {
    if (c.alOrden) return !!c.alOrden(n);
    if (!vivo(c)) return false;
    if (n === 'avanzar') { avanza(c, 25); return true; }
    if (c.tipo === 'falange') {
      if (n === 'picas' || n === 'cargar') return orig.orden('cargar');
      if (n === 'cerrar') return cierra();
      if (n === 'alto' || n === 'retirada') return orig.orden(n);
      return false;
    }
    if (n === 'picas') n = 'cargar';
    if (n === 'cargar' && c.b.orden === 'testudo') return false;   /* bajo el techo de escudos no se carga: antes, «Testudo» otra vez lo abre */
    return C.ordenDe(c.b, n);
  }
  function aplicaOrden(id, n) {
    if (id !== 'todos') return ordenA(por(id), n);
    let ok = false;
    for (const c of cuerpos) ok = ordenA(c, n === 'cargar' && c.tipo === 'falange' ? 'picas' : n) || ok;
    return ok;
  }
  M.orden = n => {
    const id = M.elegido;
    if (!M.ordenesDe(id).includes(n)) return false;
    if (M.pausa) { M.cola.push(() => aplicaOrden(id, n)); aviso('Orden dada: se cumple al reanudar'); avisaCambio(); return true; }
    return aplicaOrden(id, n);
  };

  /* ---------- el frente de un cuerpo o de la línea entera ---------- */
  /* de los dos lados de la raya, el que ya mira más o menos así; si la raya está de lado, mira hacia fuera de donde está el bloque */
  function rumboDe(b, a, p) {
    const dx = p.x - a.x, dz = p.z - a.z, c1 = Math.atan2(dz, dx), c2 = c1 + Math.PI, c = centro(b);
    let r = Math.abs(angDif(c1, b.ang)) <= Math.abs(angDif(c2, b.ang)) ? c1 : c2;
    if (Math.abs(angDif(r, b.ang)) > 50 * GRADO) { const F = fr(c1), s = (c.x - (a.x + p.x) / 2) * F.x + (c.z - (a.z + p.z) / 2) * F.z; if (Math.abs(s) > 2) r = s < 0 ? c1 : c1 + Math.PI; }
    return Math.atan2(Math.sin(r), Math.cos(r));
  }
  /* el frente tal como lo dibuja la escena: la primera fila va en el punto medio de la raya y el ancho del bloque no cambia */
  function frenteDe(c, a, p) {
    if (c.alFrente) return c.alFrente(a, p);
    if (!vivo(c)) return;
    const o = { x: (a.x + p.x) / 2, z: (a.z + p.z) / 2, ang: rumboDe(c.b, a, p) };
    if (c.tipo === 'falange') orig.frente(o); else C.frenteDe(c.b, o);
  }
  function frenteTodos(a, p) {
    const f = S.tuyo; if (!vivo({ b: f })) return;
    const lado = cuerpos.filter(c => c.tipo === 'manipulo').map(c => ({ c, l: Math.sign(Math.sin(angDif(Math.atan2(c.b.x - f.x, -(c.b.z - f.z)), f.ang))) || 1 }));
    const o = { x: (a.x + p.x) / 2, z: (a.z + p.z) / 2, ang: rumboDe(f, a, p) };
    orig.frente(o);
    const d = de(o.ang), wf = f.ancho;
    for (const { c, l } of lado) {
      if (!vivo(c)) continue;
      const off = l * (wf / 2 + hueco + c.b.ancho / 2);
      C.frenteDe(c.b, { x: o.x + d.x * off, z: o.z + d.z * off, ang: o.ang });
    }
    for (const c of cuerpos) if (c.alFrente && c.tipo === 'extra') c.alFrente(a, p, { todos: true });
  }
  M.dibujaFrente = (a, p) => {
    const id = M.elegido, hace = () => { if (id === 'todos') frenteTodos(a, p); else frenteDe(por(id), a, p); };
    if (M.pausa) { M.cola.push(hace); avisaCambio(); return; }
    hace();
  };

  /* ---------- elegir, pausa y paso ---------- */
  M.elige = id => { if (id !== 'todos' && !por(id)) return false; if (M.elegido !== id) { M.elegido = id; avisaCambio(); } return true; };
  M.pon = p => {
    p = !!p; if (p === M.pausa) return M.pausa; M.pausa = p;
    if (!p) { const L = M.cola; M.cola = []; for (const f of L) try { f(); } catch (e) { console.warn('mando', e); } }
    avisaCambio(); return M.pausa;
  };
  M.paso = dt => { if (M.pausa) return false; orig.paso(dt); return true; };

  /* lo que conviene al elegido: la falange, lo que dice el manípulo de siempre (cargar ↔ picas); un manípulo, cargar si hay uno cerca */
  M.util = (id = M.elegido) => {
    if (S.ganador) return null;
    if (id === 'falange') { const u = C.ordenUtil(); return u === 'cargar' ? 'picas' : u === 'alto' ? 'alto' : null; }
    const c = por(id); if (!c || !c.b || c.alOrden || !vivo(c)) return null;
    const b = c.b, ch = b.contactos.length > 0;
    if (b.orden === 'testudo') return null;   /* en testudo, «Cargar» no se ilumina */
    if (ch) return b.fila >= 0.7 && b.relevos > 0 && b.tRelevo < S.T ? 'relevo' : null;
    const k = centro(b);
    for (const e of S.bloques) { if (e.bando === b.bando || e.estado === 'fuera' || e.U.roto) continue; const q = centro(e); if (Math.hypot(q.x - k.x, q.z - k.z) - (e.fondo + b.fondo) / 2 < D_CARGA) return b.orden === 'cargar' ? null : 'cargar'; }
    return null;
  };

  M.anade = def => {
    if (!def || !def.id || por(def.id)) return false;
    cuerpos.push({ tipo: 'extra', corto: def.nombre, ...def }); avisaCambio(); return true;
  };

  C.orden = n => M.orden(n);
  C.dibujaFrente = (a, p) => M.dibujaFrente(a, p);
  C.paso = dt => M.paso(dt);
  C.mando = M;
  return M;
}
