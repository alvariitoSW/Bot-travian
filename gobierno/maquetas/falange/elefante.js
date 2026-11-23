/* AQVILA — FA7: el dibujo de los elefantes y su escolta contra la falange (elefantes y peltastas de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Elefantes (tipo 'elefante'): lista → quieto. Aviso 'barrito' → trompa arriba (attack_melee2) una vez y luego carga a la carrera.
     espantada / desbocada → se alza de cara a las picas (pitch atrás 0,45 rad en 1,2 s), gira despacio (120°/s) y se va. retira → anda hacia atrás.
     Aviso 'hueco' → pisa (attack_melee) el que lo abrió. muerta → muerte una vez y se queda delante del muro. fuera → no se dibuja.
   Escolta (tipo 'infante', peltastas): tira → quieta; con el aviso 'salva', lanza una vez (attack_ranged) cuando la salva sale.
     cuela → corre al hueco a 6 m/s y ataca (los peltastas solo tienen el gesto de lanzar: lo usan en bucle). pisado → muerte.
   La lógica coloca a saltos (la escolta de 46 m a 0,8 m; la espantada cambia de rumbo de golpe): aquí se suaviza. Contrato: rival.js. */
import { cargaArte, vacio, crearTropa, crearSombras, figura, sigue, clipMarcha, muerte, dado, V_PIE, V_ELEFANTE, G_RAPIDO, G_ELEFANTE } from './rival.js';
import { frameOf, frameOnce } from '../../../js/gfx/units.js';

const CAP_E = 5, CAP_P = 16, ALZA = 1.2;   /* segundos que dura el alzarse */
export async function montaRival(ctx) {
  try {
    if (!(await cargaArte(['elefantes', 'peltastas']))) return vacio();
    const H = ctx.H || (() => 0), az = dado(37);
    const ele = crearTropa('elefantes', CAP_E, { escena: ctx.escena, color: ctx.color || '#8a5a1e' });
    const pel = crearTropa('peltastas', CAP_P, { escena: ctx.escena, color: ctx.color || '#8a5a1e' });
    const sombras = crearSombras(ctx.escena, CAP_E + CAP_P), CE = ele.C, CP = pel.C, D = new Map();
    let T = 0, Sv = null, tBarrito = -99, tSalva = -99;
    const huecos = new Set();
    const fig = h => { let d = D.get(h); if (!d) { d = figura(az); d.retraso = az() * 0.35; d.tHueco = -99; D.set(h, d); } return d; };
    return {
      paso(dt) {
        const S = ctx.estado(); if (!S || !S.ene) return;
        if (S !== Sv) { Sv = S; D.clear(); T = 0; tBarrito = tSalva = -99; huecos.clear(); }
        T += dt;
        const g = S.giro || 0;
        let ie = 0, ip = 0;
        for (const h of S.ene) {
          const d = fig(h);
          if (d.est !== h.est) { d.est = h.est; d.t0 = T; d.yaw0 = d.yaw; }
          if (h.tipo === 'elefante') {
            if (ie >= CAP_E) continue; const i = ie++;
            if (h.fuera) { ele.oculta(i); sombras.oculta(i); continue; }
            const atras = h.est === 'retira';
            const alzado = (h.est === 'espantada' || h.est === 'desbocada') && T - d.t0 < ALZA * 0.6;   /* se alza de cara a las picas y luego gira */
            if (h.vivo) sigue(d, h, dt, V_ELEFANTE, G_ELEFANTE, { rumbo: !atras && h.est !== 'lista', umbral: 1.5, yaw: atras ? -g : alzado ? d.yaw0 : undefined });
            if (huecos.has(h.columna) && h.est === 'retira') { d.tHueco = T; huecos.delete(h.columna); }
            const y = H(d.x, d.z); let fr, pitch = 0;
            if (!h.vivo) fr = muerte(d, CE, T);
            else if (T - d.tHueco < CE.attack_melee.dur * 2) fr = frameOf(CE.attack_melee, T - d.tHueco);
            else if (h.est === 'carga' && T - tBarrito < CE.attack_melee2.dur) fr = frameOnce(CE.attack_melee2, T - tBarrito);
            else if (h.est === 'espantada' || h.est === 'desbocada') {
              const u = (T - d.t0) / ALZA; if (u < 1) pitch = -0.45 * Math.sin(Math.PI * u);
              fr = frameOf(CE.run, T + d.fase);
            } else if (atras && d.v > 0.3) { const w = CE.walk, t = (T + d.fase) % w.dur; fr = frameOf(w, w.dur - t - 1e-3); }   /* el andar al revés */
            else if (h.est === 'carga') fr = frameOf(CE.run, T + d.fase);
            else fr = clipMarcha(CE, d.v, V_ELEFANTE, T + d.fase);
            ele.pon(i, d.x, y + Math.sin(-pitch) * 1.9, d.z, d.yaw, fr, { pitch, esc: d.esc });
            sombras.pon(i, d.x, y, d.z, d.yaw, h.vivo ? 2.2 : 3.2, h.vivo ? 4.2 : 4.6);
          } else {
            if (ip >= CAP_P) continue; const i = ip++;
            if (h.vivo) sigue(d, h, dt, V_PIE, G_RAPIDO, { rumbo: true, umbral: 1.5 });
            const y = H(d.x, d.z); let fr;
            const ts = T - tSalva - d.retraso;
            if (!h.vivo) fr = muerte(d, CP, T);
            else if (h.est === 'cuela' && d.v < 0.5) fr = frameOf(CP.attack_ranged, T + d.fase);
            else if (d.v >= 0.3) fr = clipMarcha(CP, d.v, V_PIE, T + d.fase);
            else if (ts >= 0 && ts < CP.attack_ranged.dur) fr = frameOnce(CP.attack_ranged, ts);
            else fr = frameOf(CP.idle, T + d.fase);
            pel.pon(i, d.x, y, d.z, d.yaw, fr, { esc: d.esc });
            sombras.pon(CAP_E + i, d.x, y, d.z, d.yaw, h.vivo ? 0.8 : 1, h.vivo ? 0.8 : 1.8);
          }
        }
        for (let i = ie; i < CAP_E; i++) { ele.oculta(i); sombras.oculta(i); }
        for (let i = ip; i < CAP_P; i++) { pel.oculta(i); sombras.oculta(CAP_E + i); }
        ele.fin(); pel.fin(); sombras.fin();
      },
      aviso(tipo, datos = {}) {
        if (tipo === 'barrito') tBarrito = T;
        else if (tipo === 'salva') tSalva = T + Math.max(0, (datos.t || 0) - 1.2);   /* lanzan cuando la salva sale, no al aviso */
        else if (tipo === 'hueco') huecos.add(datos.columna);
      },
      quita() { ele.quita(); pel.quita(); sombras.quita(); D.clear(); },
      peso() { return { llamadas: 3, triangulos: ele.triangulos() + pel.triangulos() + sombras.triangulos(), figuras: ele.figuras() + pel.figuras() }; },
      desfase() {
        const S = ctx.estado(); let m = 0; if (!S || !S.ene) return 0;
        for (const h of S.ene) { const d = D.get(h); if (d && h.vivo && !h.fuera && !(h.est === 'cuela' && d.v > 0.3)) m = Math.max(m, Math.hypot(d.x - h.x, d.z - h.z)); }   /* la escolta que corre al hueco no cuenta: la lógica la pone allí de un salto */
        return m;
      },
    };
  } catch (e) { console.warn('FA7: no se pudo montar a los elefantes', e); return vacio(); }
}
