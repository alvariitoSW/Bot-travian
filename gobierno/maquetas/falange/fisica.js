/* FI1: la conexión de la física (js/fisica-batalla.js) con el dibujo de la falange. ?fisica=0 la apaga (el «antes»).
   La física solo mueve lo que se dibuja: h.fx, h.fz de cada hombre y el asta que resbala. Las reglas no se enteran. */
import { crearFisica } from '../../../js/fisica-batalla.js';

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
  function reinicia(S) { Fi.reinicia(); if (S) for (const h of S.fal.concat(S.ene)) { h.fx = h.fz = h.vx = h.vz = 0; delete h.fCae; } }
  return { activa, paso, ajustaPica, medida, juega, reinicia };
}
