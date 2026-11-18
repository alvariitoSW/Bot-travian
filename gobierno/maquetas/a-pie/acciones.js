/* Pieza «acciones»: lo que hace un hombre con el cuerpo, fuera de andar y correr (eso es locomocion.js).
   · poseLanza: lanzar el pilum (GM43h): armar el brazo, sostenerlo con el dedo, soltar, seguir y volver a la guardia.
   · la lucha (GP1): al chocar, cada hombre de vuestra primera fila se empareja con el galo de delante. Cada duelo lleva su
     compás: empujón de escudo, golpe (clips «attack_melee» y «attack_melee2»), parar o encajar, medio paso atrás. El que cae
     se queda en el suelo y el de detrás ocupa su hueco (relevo).
   Contrato: crearAcciones(m) recibe el mundo (m.S estado, m.HOM hombres, m.figuras, m.Son sonido y los efectos chispa,
   polvo, panDe, H, V3) y devuelve { poseLanza, poseLucha, empiezaLucha, lucha, medLucha, reinicia }.
   Después: acciones más finas (parar, empujar, golpear, caer) con las mismas fichas. */
import { FILES, YO, CMP } from './formacion.js';
let semillaL = 11; const azarL = () => { semillaL = (semillaL * 16807) % 2147483647; return (semillaL - 1) / 2147483646; };
export function crearAcciones(m) {
  const { S, Son, panDe, chispa, V3, H, PIES, azarV, CJ, suave } = m, fns = {};
  fns.reinicia = () => { semillaL = 11; };
  /* GM43h: el lanzamiento. Tu soldado arma más el brazo (atrás y alto, la postura que sostiene el dedo) */
  fns.poseLanza = function poseLanza(h, tl, b, esYo) {
    const L = m.HOM.L, L0 = esYo ? L + 4 : L;
    if (tl > 0.47) h.tiro = true;
    if (tl < 0.3) return [b, L0, suave(0, 0.3, tl)];
    if (tl < 0.42) return [L0, L + 1, (tl - 0.3) / 0.12];
    if (tl < 0.52) return [L + 1, L + 2, (tl - 0.42) / 0.1];
    if (tl < 0.7) return [L + 2, L + 3, (tl - 0.52) / 0.18];
    return [L + 3, b, suave(0.7, 1.1, tl)];
  };
  /* un clip de ataque (o un trozo) puesto en el tiempo de un golpe: dónde está a la fracción s */
  const clipPos = (cl, s) => cl.c.start + (cl.s0 + Math.min(1, Math.max(0, s)) * (cl.s1 - cl.s0)) * (cl.c.frames - 1);
  function poseLucha(h, bI) {
    const C = m.HOM.C, fila = (c, b) => m.HOM.N0 + c * 120 + b, b = h.anda ? C.walk.start + Math.floor(((h.camino / (C.walk.zancada * m.E)) % 1) * C.walk.frames) : bI, G = fila(CJ.guardia, b), e = h.est || { modo: 'guardia' };
    if (e.modo === 'detras') { const w = Math.max(0, Math.min(1, (Math.sin(S.T * h.rit + h.fase * 3) - 0.25) * 1.5)); return [fila(CJ.empuja, b), fila(CJ.alza, b), w]; }
    if (e.modo === 'ataca') {
      const t = e.t, d = e.d, cl = d.clip, tb = d.tb;
      if (t < 0.12) return [G, fila(CJ.empuje, b), suave(0, 0.12, t)];
      if (t < tb) return [fila(CJ.empuje, b), Math.round(clipPos(cl, 0)), suave(0.16, tb, t)];
      if (t < tb + cl.dur) { const x = clipPos(cl, (t - tb) / cl.dur), a = Math.floor(x); return [a, Math.min(a + 1, cl.c.start + cl.c.frames - 1), x - a]; }
      return [Math.round(clipPos(cl, 1)), G, suave(tb + cl.dur, tb + cl.dur + 0.25, t)];
    }
    if (e.modo === 'cubre') return [G, fila(CJ.cubre, b), e.t < 0.3 ? suave(0, 0.3, e.t) : 1 - suave(0.45, 0.75, e.t)];
    if (e.modo === 'recibe') return [G, fila(CJ.recibe, b), e.t < 0.12 ? suave(0, 0.12, e.t) : 1 - suave(0.35, 0.8, e.t)];
    return [G, G, 0];
  }
  /* ---------- GP1 · la lucha: al chocar, cada hombre de vuestra primera fila se empareja con el galo que tiene delante.
     Cada duelo lleva su compás: empujón de escudo, golpe (clips «attack_melee» y «attack_melee2» del modelo), el otro para
     o lo recibe, medio paso atrás y vuelta a la guardia. El que cae se queda en el suelo y el de detrás ocupa su hueco.
     Quién gana no se decide aquí: la tarjeta sigue contando los que llegaron al choque. ---------- */
  const D_DUELO = 1.5, V_PUESTO = 1.5;
  function clipDe(lado, n) {
    const c = lado === 'r' ? m.HOM.C[n] : m.figuras.galos.u.clips[n], seg = n === 'attack_melee' ? [0, 1] : lado === 'r' ? [0.1, 0.85] : [0.2, 0.7];
    const g = lado === 'r' ? (m.HOM.golpe[n] - seg[0]) / (seg[1] - seg[0]) : 0.5;
    return { c, s0: seg[0], s1: seg[1], dur: n === 'attack_melee' ? 0.85 : 1.2, golpe: Math.min(0.85, Math.max(0.3, g)) };
  }
  function nuevoDuelo(r, g, sec) {
    const d = { r, g, sec, P: sec ? 2.8 + azarL() : 2.3 + azarL() * 0.9, n: azarL() < 0.5 ? 0 : 1, next: S.T + 0.3 + azarL() * 1.3, t0: -9, ts: -9, resuelto: true, activo: true, espera: 0 };
    if (!sec) r.duelo = d; g.duelo = d;
    if (r.i === YO && !sec) { d.n = 1; d.next = S.T + 0.7; }   /* tu soldado golpea el primero: que se le vea */
    return d;
  }
  function empiezaLucha() {
    const R = S.romanos; S.tChoque = S.T; S.duelos = [];
    const frente = [];
    for (let f = 0; f < FILES; f++) {
      const col = R.filter(h => h.vivo && h.f === f).sort((a, b) => a.r - b.r);
      col.forEach((h, j) => { h.lado = 'r'; h.j = j; h.duelo = null; h.rit = 0.6 + azarL() * 0.7; h.px = h.x + (azarL() - 0.5) * 0.08; h.pz = S.zF + (j === 0 ? 0 : j === 1 ? 0.85 : 2.6 * j) + (azarL() - 0.5) * 0.12; });
      if (col[0]) frente.push(col[0]);
    }
    const libres = new Set(S.galos.filter(g => g.vivo));
    for (const g of libres) { g.lado = 'g'; g.duelo = null; g.jy = (azarL() - 0.5) * 0.1; g.rit = 0.5 + azarL() * 0.5; }
    /* emparejar en orden, de izquierda a derecha (nadie cruza por delante de otro); los que sobran por los lados, dos contra uno */
    const GF = S.galos.filter(g => g.vivo).sort((a, b) => b.z - a.z).slice(0, FILES + 2).sort((a, b) => a.x - b.x), nR = frente.length;
    let o = 0, mejor = 1e9; for (let k = 0; k + nR <= GF.length; k++) { let c = 0; for (let i = 0; i < nR; i++) c += Math.abs(GF[k + i].x - frente[i].x); if (c < mejor) { mejor = c; o = k; } }
    frente.forEach((h, i) => { const g = GF[o + i]; if (!g) return; libres.delete(g); g.px = h.px + (azarL() - 0.5) * 0.14; g.pz = h.pz - D_DUELO - azarL() * 0.12; S.duelos.push(nuevoDuelo(h, g, false)); });
    [[GF[o - 1], frente[0], -1], [GF[o + nR], frente[nR - 1], 1]].forEach(([g, h, l]) => { if (!g || !h) return; libres.delete(g); g.px = h.px + 0.9 * l; g.pz = h.pz - 1.3; S.duelos.push(nuevoDuelo(h, g, true)); });
    for (const g of libres) { g.px = g.x + (azarL() - 0.5) * 0.2; g.pz = S.zF - D_DUELO - 1.25 - azarL() * 0.3; }
    /* cada duelo arranca a su tiempo, en orden barajado y separados al menos un cuarto de segundo: nunca a la vez que el vecino */
    const orden = S.duelos.filter(d => !d.sec && d.r.i !== YO).map(d => [azarL(), d]).sort((a, b) => a[0] - b[0]);
    orden.forEach(([, d], i) => { d.next = S.T + 0.3 + i * 0.27 + azarL() * 0.12; });
  }
  const listo = m => m.vivo && !m.anda && Math.hypot(m.px - m.x, m.pz - m.z) < 0.05;
  function empiezaCiclo(d) {
    const T = S.T; d.n++; d.t0 = T; d.ataR = !d.sec && d.n % 2 === 0;
    d.clip = clipDe(d.ataR ? 'r' : 'g', (d.n >> 1) % 2 ? 'attack_melee2' : 'attack_melee'); d.tb = d.ataR ? 0.28 : 0.15;
    d.ts = T + d.tb + d.clip.dur * d.clip.golpe;
    const def = d.ataR ? d.g : d.r, prot = def.i === YO || def.i === CMP;
    const exito = azarL() < (d.ataR ? 0.55 : d.sec ? 0.22 : 0.3) * (def.i === YO ? 0.4 : 1);
    d.res = !exito ? 'cubre' : !prot && !d.sec && (def.golpes >= 2 || azarL() < 0.35) ? 'muere' : 'recibe';
    d.resuelto = false; d.lado = azarL() < 0.5 ? 1 : -1; d.next = T + d.P * (0.85 + azarL() * 0.3);
    if (d.ataR) Son.madera(0.35, panDe(d.r.x), 0.12);   /* el empujón de escudo */
  }
  function resuelve(d) {
    d.resuelto = true; const def = d.ataR ? d.g : d.r, at = d.ataR ? d.r : d.g;
    if (!def.vivo || !at.vivo) return;
    const pan = panDe(def.x);
    if (d.res === 'cubre') { Son.hierro(pan, 0, 0.5); Son.madera(0.45, pan); if (azarL() < 0.5) chispa(V3.set((def.x + at.x) / 2, H(def.x, def.z) + 1.2, (def.z + at.z) / 2), 0.35); return; }
    def.golpes++; Son.madera(0.3, pan); Son.tierra(pan); polvoEn(def.x, def.z, 5);
    if (d.res === 'muere') { def.vivo = false; def.muere = S.T + 0.12; Son.tierra(pan, 0.5); polvoEn(def.x, def.z, 8); }
  }
  /* el que cae deja hueco: lo ocupa el de detrás dando un paso al frente (un poco a un lado, para no pisar al caído) */
  function relevo(d) {
    const muerto = !d.r.vivo ? d.r : d.g, lado = muerto.px < 0 ? 1 : -1;
    let n = null;
    if (muerto.lado === 'r') {
      const col = S.romanos.filter(h => h.vivo && h.f === muerto.f && !h.duelo).sort((a, b) => a.j - b.j); n = col[0];
      if (n) { col.slice(1).forEach((h, k) => { h.j = k + 1; }); n.j = 0; d.r = n; n.duelo = d; }   /* los de más atrás no se mueven: no cruzan por la cámara */
    } else {
      let dm = 1e9; for (const g of S.galos) if (g.vivo && !g.duelo) { const dd = Math.abs(g.x - muerto.px); if (dd < dm) { dm = dd; n = g; } }
      if (n) { d.g = n; n.duelo = d; }
    }
    if (!n) { d.activo = false; return; }
    n.px = muerto.px + 0.3 * lado; n.pz = muerto.pz + (muerto.lado === 'r' ? 0.1 : -0.1);
    for (const x of S.duelos) if (x.sec && x.r === muerto) x.r = d.r;
    d.next = S.T + 0.6 + azarL() * 0.8; d.espera = 0; d.t0 = -9; d.ts = -9; d.resuelto = true;
  }
  function estado(m, T) {
    const ds = S.duelos.filter(d => d.activo && d.t0 > 0 && (d.r === m || d.g === m));
    for (const d of ds) if ((d.ataR ? d.r : d.g) === m && T - d.t0 < d.tb + d.clip.dur + 0.3) return { modo: 'ataca', t: T - d.t0, d };
    for (const d of ds) {
      if ((d.ataR ? d.g : d.r) !== m) continue;
      if (d.res === 'cubre' && T > d.ts - 0.3 && T < d.ts + 0.45) return { modo: 'cubre', t: T - d.ts + 0.3, d };
      if (d.res !== 'cubre' && T > d.ts && T < d.ts + 0.8) return { modo: 'recibe', t: T - d.ts, d };
    }
    return { modo: m.duelo ? 'guardia' : 'detras' };
  }
  /* medio paso atrás: el que golpea, después del golpe; el que lo recibe, en el acto */
  function retroceso(m, T) {
    let o = 0;
    for (const d of S.duelos) {
      if (!d.activo || d.t0 < 0 || (d.r !== m && d.g !== m)) continue;
      if ((d.ataR ? d.r : d.g) === m) { const t = T - d.t0 - d.tb - d.clip.dur; o = Math.max(o, 0.32 * (suave(-0.1, 0.25, t) - suave(0.45, 1.0, t))); }
      else if (d.res !== 'cubre') { const t = T - d.ts; o = Math.max(o, 0.3 * (suave(0, 0.22, t) - suave(0.5, 1.1, t))); }
    }
    return o;
  }
  function lucha(dt) {
    const T = S.T;
    for (const d of S.duelos) {
      if (!d.activo) continue;
      if (!d.resuelto && T >= d.ts) resuelve(d);
      if (!d.r.vivo || !d.g.vivo) { if (d.sec) { if (!d.g.vivo) d.activo = false; continue; } if (!d.espera) d.espera = T + 0.8 + azarL() * 0.5; if (T >= d.espera) relevo(d); continue; }
      if (T >= d.next && listo(d.r) && listo(d.g)) empiezaCiclo(d);
    }
    for (const m of [...S.romanos, ...S.galos]) {
      if (!m.vivo || m.px === undefined) continue;
      const dx = m.px - m.x, dz = m.pz - m.z, dd = Math.hypot(dx, dz), v = Math.min(dd, V_PUESTO * dt);
      if (dd > 1e-4) { m.x += dx / dd * v; m.z += dz / dd * v; }
      const off = retroceso(m, T), doff = Math.abs(off - m.off); m.off = off; m.camino += v + doff; m.anda = dd > 0.03 || doff > 0.2 * dt;
      /* mira a su rival; los de detrás, al frente enemigo */
      const d = m.duelo, riv = d && d.activo ? (m === d.r ? d.g : d.r) : null;
      const tx = riv && riv.vivo ? riv.x : m.x * 0.8, tz = riv && riv.vivo ? riv.z : m.lado === 'r' ? S.zF - 3 : S.zF + 2;
      m.yaw = Math.atan2(tx - m.x, tz - m.z); const yj = m.yaw + (m.jy || 0);
      m.xd = m.x - Math.sin(yj) * off; m.zd = m.z - Math.cos(yj) * off;
      if (m.lado === 'r' && !m.duelo) { m.xd += Math.sin(T * m.rit * 1.3 + m.fase) * 0.04; m.zd += Math.sin(T * m.rit + m.fase * 2) * 0.05; }   /* los de detrás se balancean */
      m.est = estado(m, T);
    }
  }
  function polvoEn(x, z, n) { for (let i = 0; i < n; i++) { const p = PIES.find(p => S.T - p.t > 1.8); if (!p) return; p.t = S.T; p.x = x + (azarV() - 0.5) * 0.8; p.z = z + (azarV() - 0.5) * 0.6; p.y = H(p.x, p.z) + 0.15; p.vx = (azarV() - 0.5) * 0.6; p.vy = 0.3 + azarV() * 0.3; p.vz = (azarV() - 0.5) * 0.6; p.s = 0.8 + azarV() * 0.8; } }
  /* para las pruebas: los luchadores en pie, los caídos y los duelos que están en marcha */
  function medLucha() {
    const L = [...S.romanos, ...S.galos].filter(m => m.vivo && m.xd !== undefined); let dmin = 9;
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) dmin = Math.min(dmin, Math.hypot(L[a].xd - L[b].xd, L[a].zd - L[b].zd));
    const act = S.duelos.filter(d => d.activo && !d.sec && d.r.vivo && d.g.vivo && d.t0 > 0 && S.T - d.t0 < d.P * 1.2);
    const fases = new Set(act.map(d => Math.floor((S.T - d.t0) / 0.15)));
    return { dmin: +dmin.toFixed(2), duelos: act.length, fases: fases.size, caidosR: S.romanos.filter(h => !h.vivo).length, caidosG: S.galos.filter(g => !g.vivo).length };
  }
  Object.assign(fns, { clipPos, poseLucha, empiezaLucha, lucha, medLucha, polvoEn });
  return fns;
}
