/* FI1: la conexión de la física (js/fisica-batalla.js) con el dibujo de la falange. ?fisica=0 la apaga (el «antes»).
   La física solo mueve lo que se dibuja: h.fx, h.fz de cada hombre y el asta que resbala. Las reglas no se enteran.
   FI3: los pila (S.proyectiles) se paran en lo que tocan y se clavan, rebotan o resbalan. Su estado de dibujo va en P.fi;
   las reglas no lo leen. La escena da con conecta() cómo se dibuja cada falangita (hueso del escudo y del pecho, sarisa). */
import { crearFisica, crearProyectiles, PR } from '../../../js/fisica-batalla.js';   /* FI3: crearProyectiles, PR */

export function crearFisicaEscena({ H, SARISA }) {
  const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const activa = Q.get('fisica') !== '0', Fi = crearFisica({ H });
  let msPaso = 0, nPaso = 0, msPica = 0;
  const ahora = () => performance.now();
  function paso(S, dt) { if (!activa) return; const a = ahora(); Fi.paso(S, dt); msPaso += ahora() - a; nPaso++; }
  /* retira la contera P a lo largo de D lo que diga la física (THREE.Vector3) */
  function ajustaPica(h, P, D) { if (!activa) return; const a = ahora(), r = Fi.pica(h, P, D, SARISA); if (r.ret) P.addScaledVector(D, -r.ret); msPica += ahora() - a; }
  /* las picas bajadas tal como se dibujan; pose(h) → [P, D] en arrays (ya ajustadas) */
  function picas(S, pose) { const L = []; for (const h of S.fal) if (h.vivo && !h.huye && h.kB > 0.5) { const [P, D] = pose(h); L.push({ h, P, D, L: SARISA }); } return L; }
  function medida(S, pose) { const m = Fi.medir(S, picas(S, pose)); return { activa, distMin: +m.distMin.toFixed(3), puntasDentro: m.puntasDentro, pisados: m.pisados, ms: nPaso ? +(msPaso / nPaso).toFixed(3) : 0 }; }
  /* juega n segundos con el bot sin dibujar; cada 0,1 s calcula las poses de las picas y mide */
  function juega(n, ACC, pose, bot = 'compas') {
    const S = ACC.S, T0 = S.T; let total = 0, peor = 0, tPeor = null, detalle = [], dMin = Infinity, pis = 0, muestras = 0, k = 0;
    msPaso = nPaso = msPica = 0; let msPicaM = 0;
    while (S.T - T0 < n && S.fase !== 'fin') {
      ACC.bot(bot); ACC.paso(1 / 30);
      if (++k % 3 === 0) { const a = msPica; const m = Fi.medir(S, picas(S, pose)); msPicaM += msPica - a; total += m.puntasDentro; if (m.puntasDentro > peor) { peor = m.puntasDentro; tPeor = S.T; } if (m.puntasDentro && detalle.length < 6) detalle.push({ T: +S.T.toFixed(2), ...m.detalle[0] }); dMin = Math.min(dMin, m.distMin); pis += m.pisados; muestras++; }
    }
    return { activa, segundos: +(S.T - T0).toFixed(1), muestras, puntasTotal: total, puntasPeor: peor, tPeor, detalle, distMin: +dMin.toFixed(3), pisados: pis, ms: +((nPaso ? msPaso / nPaso : 0) + (muestras ? msPicaM / muestras : 0)).toFixed(3) };
  }
  /* ---------- FI3: los pila ---------- */
  const Pr = crearProyectiles({ H, semilla: 20261123 }), EST = { 2: 'asta', 3: 'escudo', 4: 'cuerpo' };
  let E = null, tObst = 0, tMueve = 0, tPose = 0, tAntes = null, msPr = 0, nPr = 0;
  /* E = { prepara(h), matriz(h, 'escudo'|'pecho') → elements, centroEscudo(h) → [x,y,z] en su cara, sarisa(h) → { P, D } (arrays), matSarisa(h) → elements } */
  function conecta(e) { E = e; }
  let msPrep = 0; const prep = h => { const a = ahora(); E.prepara(h); msPrep += ahora() - a; };   /* lo que cuesta posar al hombre (en el juego ya lo hace el dibujo) */
  const frente = S => [Math.sin(S.giro), 0, -Math.cos(S.giro)], derecha = S => [Math.cos(S.giro), 0, Math.sin(S.giro)];
  /* los obstáculos de un falangita tal como se dibuja: su escudo (desde el hueso), su cuerpo y, si va alzada, su sarisa */
  function obstDe(S, h, M) {
    if (M.has(h)) return M.get(h);
    const n = frente(S), c = E.centroEscudo(h), x = h.x + (h.fx || 0), z = h.z + (h.fz || 0), y = H(x, z), r = { lista: [] };
    r.escudo = { tipo: 'escudo', c: [c[0] - n[0] * 0.03, c[1], c[2] - n[2] * 0.03], n, u: derecha(S), v: [0, 1, 0], m: [0.03, 0.31, 0.31], umbo: 0.06, dueno: h };
    r.cuerpo = { tipo: 'cuerpo', x, z, y0: y + 0.35, y1: y + 1.8, r: 0.2, dueno: h };   /* las piernas no cuentan: se pasa por encima de lo tumbado */
    if (h.vivo && !h.huye) r.lista.push(r.escudo, r.cuerpo);
    if (!(h.kB > 0.5) || !h.vivo) { const s = E.sarisa(h); r.asta = { tipo: 'asta', a: s.P, b: s.P.map((v, k) => v + s.D[k] * SARISA), r: 0.03, dueno: h }; if (h.vivo && !h.huye) r.lista.push(r.asta); }
    M.set(h, r); return r;
  }
  const matDe = (h, que) => que === 'escudo' ? E.matriz(h, 'escudo') : que === 'cuerpo' ? E.matriz(h, 'pecho') : que === 'asta' ? E.matSarisa(h) : null;
  /* cada fotograma (o paso medido): → poses [{ punta, dir }] por índice de S.proyectiles, o null con ?fisica=0 */
  function proyectiles(S, prepara = false) {
    if (!activa || !E) return null;
    const a0 = ahora(), dt = tAntes === null ? 0 : Math.min(0.1, Math.max(0, S.T - tAntes)); tAntes = S.T;
    const L = S.proyectiles, salida = new Array(L.length).fill(null), vivos = [];
    for (const P of L) { if (P.fi && P.fi.t0 !== P.t0) P.fi = null; if (P.est && !(P.est === 1 && S.T < P.t0)) vivos.push(P); }
    if (!vivos.length) return salida;
    /* los sitios donde hay algo que se mueve o que llega: solo los falangitas a menos de 4 m cuentan como obstáculo */
    const sitios = []; for (const P of vivos) { const f = P.fi; if (!f || f.modo === 'vuela' || f.modo === 'rebota' || f.modo === 'cae' || f.modo === 'resbala' || f.modo === 'clava') sitios.push(f && f.pose ? f.pose.punta : P.p); }   /* FI3: también el clavado (que su astil no entre en el vecino) */
    const MO = new Map(), obst = [];
    if (sitios.length) for (const h of S.fal) { if (!h.vivo || h.huye) continue; const x = h.x + (h.fx || 0), z = h.z + (h.fz || 0); if (!sitios.some(s => (s[0] - x) ** 2 + (s[2] - z) ** 2 < 7)) continue;   /* a menos de 2,6 m: el largo del pilum y un poco */ if (prepara) prep(h); obst.push(...obstDe(S, h, MO).lista); }
    tObst = ahora() - a0 - msPrep; tMueve = tPose = 0;
    vivos.forEach(P => {
      const i = L.indexOf(P); let f = P.fi;
      if (P.est === 1) { const d = P.dir, l = Math.hypot(d[0], d[1], d[2]) || 1, punta = [P.p[0] + d[0] / l * 0.46, P.p[1] + d[1] / l * 0.46, P.p[2] + d[2] / l * 0.46]; salida[i] = Pr.vuela(P, punta, d, obst); P.fi.t0 = P.t0; return; }
      if (!f) { f = Pr.vuela(P, P.p, P.dir, obst) && P.fi; f.t0 = P.t0; }   /* llegó sin verlo volar (salto de tiempo) */
      if (f.modo === 'vuela') {
        const tipo = EST[P.est] || 'suelo', h = P.est === 5 ? null : P.h;
        if (h && prepara) prep(h);
        const o = h ? obstDe(S, h, MO)[tipo] : null;
        /* asta (est 2) o escudo (est 3): la regla solo dice que lo paró la falange y nadie muere; vale cualquier asta o escudo que tocó.
           El cuerpo no: ese hombre muere y lo lleva él */
        Pr.llega(P, { tipo, dueno: h, o, otroVale: tipo === 'asta' || tipo === 'escudo', vale: tipo === 'asta' || tipo === 'escudo' ? ['asta', 'escudo'] : null }, obst, (d, q) => matDe(d, q));
      }
      if (P.fi.modo === 'clava' && P.fi.que === 'asta' && P.fi.dueno && (P.fi.dueno.kB > 0.3 || !P.fi.dueno.vivo)) Pr.suelta(P);   /* el asta se baja (o cae su hombre): el pilum se suelta y cae */
      const a1 = ahora(); Pr.mueve(P, dt, obst); tMueve += ahora() - a1;
      const cl = P.fi.modo === 'clava' && P.fi.que !== 'suelo'; if (cl && prepara) prep(P.fi.dueno);
      const a2 = ahora(); salida[i] = Pr.pose(P, cl ? matDe(P.fi.dueno, P.fi.que) : null, obst); tPose += ahora() - a2;
    });
    ultimo = obst; msPr += ahora() - a0; nPr++; return salida;
  }
  let ultimo = [];
  /* para medir: los obstáculos de todos los falangitas vivos a menos de 2,6 m de cualquier pilum, se mueva o no */
  function obstTodos(S) {
    const ps = S.proyectiles.filter(P => P.fi && P.fi.pose).map(P => P.fi.pose.punta), MO = new Map(), o = [];
    for (const h of S.fal) { if (!h.vivo || h.huye) continue; const x = h.x + (h.fx || 0), z = h.z + (h.fz || 0); if (!ps.some(s => (s[0] - x) ** 2 + (s[2] - z) ** 2 < 7)) continue; E.prepara(h); o.push(...obstDe(S, h, MO).lista); }
    return o;
  }
  function medidaPr(S) { const m = Pr.medir(S.proyectiles, ultimo); return { activa, ...m, ms: nPr ? +(msPr / nPr).toFixed(3) : 0 }; }
  /* juega n segundos sin dibujar (el bot manda) y mide cada 0,1 s: la salva entera. Devuelve también lo que dicen las reglas
     (estados de los pila y bajas) para comparar con ?fisica=0 */
  function juegaPr(n, ACC, bot = 'compas') {
    const S = ACC.S, T0 = S.T; let total = 0, peor = 0, muestras = 0, k = 0, msPeor = 0; const detalle = [], costes = []; let prepPeor = 0, msPeor0 = 0, parte = null;
    msPr = nPr = 0; tAntes = null;
    while (S.T - T0 < n && S.fase !== 'fin') {
      ACC.bot(bot); ACC.paso(1 / 30); const a = ahora(); msPrep = 0; proyectiles(S, true); const ms = ahora() - a - msPrep; prepPeor = Math.max(prepPeor, msPrep); if (ms > msPeor0) { msPeor0 = ms; parte = { obst: +tObst.toFixed(2), mueve: +tMueve.toFixed(2), pose: +tPose.toFixed(2), T: +S.T.toFixed(2), modos: S.proyectiles.reduce((o, P) => { const q = P.fi ? P.fi.modo : '-'; o[q] = (o[q] || 0) + 1; return o; }, {}) }; } msPeor = Math.max(msPeor, ms); if (S.proyectiles.some(P => P.est)) costes.push(ms);
      if (activa && ++k % 3 === 0) { const m = Pr.medir(S.proyectiles, obstTodos(S)); total += m.dentro; peor = Math.max(peor, m.dentro); muestras++; for (const d of m.detalle) if (detalle.length < 16) detalle.push({ T: +S.T.toFixed(2), ...d }); }
    }
    const m = activa ? Pr.medir(S.proyectiles, ultimo) : null;
    return { activa, segundos: +(S.T - T0).toFixed(1), muestras, dentroTotal: total, dentroPeor: peor, detalle, tramos: m && m.tramos, aparte: m && m.aparte, saltos: m && m.saltos, saltosPor: m && m.saltosPor, llegan: m && m.llegan,
      modos: S.proyectiles.reduce((o, P) => { const q = P.fi ? P.fi.modo : '-'; o[q] = (o[q] || 0) + 1; return o; }, {}),
      ms: nPr ? +(msPr / nPr).toFixed(3) : 0, msMedia: costes.length ? +(costes.reduce((a, b) => a + b, 0) / costes.length).toFixed(3) : 0, msPeor: +msPeor.toFixed(3), posarPeor: +prepPeor.toFixed(3), parte, msP95: costes.length ? +costes.sort((a, b) => a - b)[Math.floor(costes.length * 0.95)].toFixed(3) : 0, reglas: S.proyectiles.map(P => P.est).join(''), bajas: S.fal.filter(h => !h.vivo).length, T: +S.T.toFixed(2) };
  }
  function reinicia(S) { Pr.reinicia(); tAntes = null; ultimo = []; if (S) for (const P of S.proyectiles) delete P.fi; Fi.reinicia(); if (S) for (const h of S.fal.concat(S.ene)) { h.fx = h.fz = h.vx = h.vz = 0; delete h.fCae; } }
  return { activa, paso, ajustaPica, medida, juega, reinicia, conecta, proyectiles, medidaPr, juegaPr, LARGO: PR.LARGO };   /* FI3: conecta … juegaPr */
}
