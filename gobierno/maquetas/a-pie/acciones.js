/* Pieza «acciones»: lo que hace un hombre con el cuerpo, fuera de andar y correr (eso es locomocion.js).
   · poseLanza: lanzar el pilum (GM43h): armar el brazo, sostenerlo con el dedo, soltar, seguir y volver a la guardia.
   · la lucha (GP1): al chocar, cada hombre de vuestra primera fila se empareja con el galo de delante. Cada duelo lleva su
     compás: empujón de escudo, golpe (clips «attack_melee» y «attack_melee2»), parar o encajar, medio paso atrás. El que cae
     se queda en el suelo y el de detrás ocupa su hueco (relevo).
   Contrato: crearAcciones(m) recibe el mundo (m.S estado, m.HOM hombres, m.figuras, m.Son sonido y los efectos chispa,
   polvo, panDe, H, V3) y devuelve { poseLanza, poseLucha, empiezaLucha, lucha, medLucha, reinicia }.
   TP1b · tu duelo (TP0 §7): el galo que tienes delante avisa su golpe (arma el brazo despacio y se marca con un color);
     si paras a tiempo queda abierto y tu estocada entra; el empujón de escudo lo desequilibra; si no paras te hiere y a la
     tercera caes (y pasas a ser el que te releva). Las órdenes cambian la lucha: «Escudos» aguanta y cansa al galo,
     «Cargad» aprieta unos segundos, «Relevo» pone delante la fila fresca. Cuando un bando rompe, los galos huyen corriendo.
   Contrato añadido: pide(que) deja un gesto tuyo ('parar' | 'estocada' | 'empujar'); relevoOrden(), cargad(), huida();
     sAtaque(est) dice en qué punto del clip de ataque va un galo (con su aviso). Las palabras de respuesta van a S.eco.
   TP8 1a · opciones del mundo (si no vienen, todo sigue como antes):
     m.alcance(at, def, d) -> lista de 17 números: cuánto hay que apartar al que golpea (metros) a cada fracción del clip
       (0 a 1) para que la hoja pare en el escudo o en el cuerpo del otro y no lo atraviese.
     m.golpe(d, def, at, tipo, tuyo) -> el golpe llega ('escudo' o 'cuerpo'); tuyo si es tu duelo: chispa, polvo, pausa.
   TP8b-L2 · m.aliento (opcional; si no viene, todo como antes): tu soldado tiene aliento (S.fuelleY, 0 a 100) que gastan
     sus gestos y se recobra si no pulsas; la estocada sin abrir al galo te descubre y su contraataque no se para; tu duelo
     pesa en el ánimo de los dos bandos. Con S.roto (tu escudo se rompió) «Parar» es «Desviar» con la espada: ventana corta
     y el galo no queda abierto; el empujón es de hombro. S.tuyo añade fuelle, roto y lo que cuesta cada gesto. */
import { FILES, YO, CMP, HOMBRES } from './formacion.js';
import { velocidad, pisa } from './locomocion.js';
import { posturaDePose, mul, punto, H as HU } from './esqueleto.js';   /* CB2 */
let semillaL = 11; const azarL = () => { semillaL = (semillaL * 16807) % 2147483647; return (semillaL - 1) / 2147483646; };
/* TP8b-L3: cuántos galos de refuerzo guarda la escena (enemigo.js los crea; la lucha los trae) */
/* TP8b-E2: galos que cargan (dos filas de FILES + 2) y los de reserva, hasta HOMBRES (al menos 30, como antes) */
export const N_GF = 2 * (FILES + 2), RESERVA_G = Math.max(14, HOMBRES - N_GF), W_REF = (1 + Math.min(1, 16 / N_GF)) / 2;
export function crearAcciones(m) {
  const { S, Son, panDe, chispa, V3, H, PIES, azarV, CJ, suave } = m, fns = {}, FX = !!m.golpe, L2 = !!m.aliento;   /* FX: TP8 1a, golpes con peso */
  /* TP8b-L2: lo que cuesta cada gesto (de 100 de aliento), lo que se recobra por segundo sin pulsar, y la ventana del desvío */
  const C_EST = 30, C_EMP = 25, C_HOM = 35, C_PAR = 8, RECOBRA = 14, VR = 0.18, CONTRA = 0.22;
  fns.reinicia = () => { semillaL = 11; };
  /* GM43h: el lanzamiento. Tu soldado arma más el brazo (atrás y alto, la postura que sostiene el dedo) */
  fns.poseLanza = function poseLanza(h, tl, b, esYo) {
    const L = m.HOM.L, L0 = esYo ? L + 4 : L;
    if (!Number.isFinite(L)) return [b, b, 0];   /* TP9a: seguro; si L no es una fila (p. ej. un objeto), postura base y no huesos NaN */
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
      if (d.reb) { const tg = d.ts - d.t0; if (t > tg) return [Math.round(clipPos(cl, (tg - tb) / cl.dur)), G, suave(tg, tg + 0.2, t)]; }   /* TP8b-L1: su escudo te para y el brazo vuelve de golpe */
      if (t < tb + cl.dur) { const x = clipPos(cl, (t - tb) / cl.dur), a = Math.floor(x); return [a, Math.min(a + 1, cl.c.start + cl.c.frames - 1), x - a]; }
      return [Math.round(clipPos(cl, 1)), G, suave(tb + cl.dur, tb + cl.dur + 0.25, t)];
    }
    /* TP8b-L2: sin escudo desvía con la espada: el brazo del gladio cruza delante (el arranque del clip de ataque), nunca la pose de escudo */
    if (e.modo === 'desvia') return [G, Math.round(clipPos(clipDe('r', 'attack_melee'), 0.16)), e.t < 0.1 ? suave(0, 0.1, e.t) : 1 - suave(0.3, 0.55, e.t)];
    if (e.modo === 'cubre') return [G, fila(CJ.cubre, b), e.t < 0.3 ? suave(0, 0.3, e.t) : 1 - suave(0.45, 0.75, e.t)];
    if (e.modo === 'empuja') return [G, fila(CJ.empuje, b), e.t < 0.15 ? suave(0, 0.15, e.t) : 1 - suave(0.3, 0.6, e.t)];
    /* «Escudos» en la lucha: la primera fila se queda medio cubierta tras la madera */
    if (S.muro && h.duelo && !(h === S.yo && S.roto)) return [G, fila(CJ.cubre, b), 0.65];
    if (e.modo === 'recibe') return [G, fila(CJ.recibe, b), e.t < 0.12 ? suave(0, 0.12, e.t) : 1 - suave(0.35, 0.8, e.t)];
    /* TP8b-L2: sin aliento tu soldado jadea: los hombros suben y bajan */
    if (L2 && h === S.yo && h.duelo && S.fuelleY < C_EST) return [G, fila(CJ.recibe, b), 0.16 + 0.1 * Math.sin(S.T * 8.5)];
    return [G, G, 0];
  }
  /* ---------- GP1 · la lucha: al chocar, cada hombre de vuestra primera fila se empareja con el galo que tiene delante.
     Cada duelo lleva su compás: empujón de escudo, golpe (clips «attack_melee» y «attack_melee2» del modelo), el otro para
     o lo recibe, medio paso atrás y vuelta a la guardia. El que cae se queda en el suelo y el de detrás ocupa su hueco.
     Quién gana no se decide aquí: la tarjeta sigue contando los que llegaron al choque. ---------- */
  const D_DUELO = 1.5, V_PUESTO = 1.5;
  /* TP8b-L3: refuerzos galos. RESERVA en total, como mucho 2 corriendo a la vez y uno cada R_CADA s. Al empezar la lucha
     los galos se rehacen (ven llegar a los suyos) hasta ANIMO_G; cada refuerzo que entra les da R_ANIMO y les quita parte del mal recuerdo (balance) */
  const R_CADA = 1.5, ANIMO_G = 0.8, R_ANIMO = 0.05, V_CORRE = 5.2;
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
    const R = S.romanos; S.tChoque = S.T; S.duelos = []; S.fuelleY = 100; S.tPulsa = -9; S.ecoSin = false; S.ecoRoto = false; S.misMuertes = 0; S.misCaidas = 0;
    S.nRefuerzos = 0; S.tRefuerzo = -9; S.unidadG.anima(Math.max(0, ANIMO_G - S.unidadG.animo));
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
  const finA = d => d.corte ?? d.tb + d.clip.dur + 0.3;   /* TP8b-L1: si el galo para tu estocada, tu brazo rebota y acabas antes */
  const ocupado = (d, T) => d.t0 > 0 && T - d.t0 < finA(d);
  const eco = (texto, tipo = '') => { S.eco = { texto, tipo, t: S.T }; };
  function empiezaCiclo(d) {
    const T = S.T, UR = S.unidad, UG = S.unidadG, carga = T < S.cargaHasta; d.n++; d.t0 = T; d.ataR = !d.sec && d.n % 2 === 0; d.aviso = false; d.jEco = null; d.corte = null; d.reb = false;
    d.clip = clipDe(d.ataR ? 'r' : 'g', (d.n >> 1) % 2 ? 'attack_melee2' : 'attack_melee'); d.tb = d.ataR ? 0.28 : 0.15;
    d.ts = T + d.tb + d.clip.dur * d.clip.golpe;
    const def = d.ataR ? d.g : d.r, prot = def.lado === 'r' && def.i === CMP;
    /* TP1b: lo que pesa en cada golpe: el cansancio de los dos, la carga y los escudos (tras ellos casi no entra nada, y
       apenas se golpea: se empuja) */
    const p = d.ataR ? (S.muro ? 0.12 : 0.5) * (1 - 0.4 * UR.fatiga) * (1 + 0.4 * UG.fatiga) * (carga ? 1.6 : 1)
      : (d.sec ? 0.2 : 0.28) * (1 - 0.4 * UG.fatiga) * (1 + 0.4 * UR.fatiga) * (S.muro ? 0.3 : 1) * (carga ? 1.2 : 1);
    const exito = azarL() < p;
    /* el gladio remata antes (a la segunda herida, o la mitad de las veces) que la espada larga del galo (a la tercera) */
    d.res = !exito ? 'cubre' : !prot && !d.sec && (d.ataR ? def.golpes >= 1 || azarL() < 0.5 : def.golpes >= 2 || azarL() < 0.35) ? 'muere' : 'recibe';
    d.resuelto = false; d.lado = azarL() < 0.5 ? 1 : -1; d.next = T + d.P * (0.85 + azarL() * 0.3);
    if (d.ataR) Son.madera(0.35, panDe(d.r.x), 0.12);   /* el empujón de escudo */
    alcanza(d);
  }
  /* TP8 1a: que nadie atraviese. Lo que hay que apartar al que golpea mientras dura su golpe (lo mide la escena) */
  function alcanza(d) { d.alc = m.alcance ? m.alcance(d.ataR ? d.r : d.g, d.ataR ? d.g : d.r, d) : null; }
  /* en qué fracción del clip va el golpe (s) y cuánto pesa aún (f: se apaga al volver a la guardia); null si no golpea */
  function fracGolpe(d, T) {
    const t = T - d.t0, fin = d.aviso ? d.tb + d.dr : d.tb + d.clip.dur;
    if (t < 0 || t > fin + 0.4) return null;
    if (d.aviso) return { s: t < d.tb ? d.w0 * suave(0, d.tA || d.tb, t) : Math.min(1, d.w0 + (t - d.tb) / d.dr * (1 - d.w0)), f: 1 - suave(fin, fin + 0.3, t) };
    return { s: t < d.tb ? 0 : Math.min(1, (t - d.tb) / d.clip.dur), f: 1 - suave(fin, fin + 0.3, t) };
  }
  function aparta(d, T) {
    if (!d.alc) return 0; const q = fracGolpe(d, T); if (!q) return 0;
    const x = q.s * (d.alc.length - 1), i = Math.min(d.alc.length - 2, Math.floor(x)), w = x - i;
    return (d.alc[i] * (1 - w) + d.alc[i + 1] * w) * q.f;
  }
  function resuelve(d) {
    d.resuelto = true; const def = d.ataR ? d.g : d.r, at = d.ataR ? d.r : d.g;
    if (!def.vivo || !at.vivo) return;
    const pan = panDe(def.x);
    /* TP1b: el golpe del galo a ti: si paraste a tiempo da en tu escudo y él queda abierto; si no, te hiere (a la tercera, caes) */
    if (d.aviso) {
      const roto = !!S.roto, par = !d.imparable && S.tParar > d.ts - (roto ? VR : VENTANA) && S.tParar <= d.ts + 0.06;
      /* TP8b-L2: desviado con la espada: no te hiere, pero el galo no queda abierto */
      if (par && roto) { d.res = 'cubre'; d.t0 = -9; eco('¡Desviado!', 'bien'); } else
      /* parado: su golpe da en tu escudo, se le va el brazo y recula un poco (queda abierto); su golpe acaba ahí */
      if (par) { d.res = 'cubre'; d.abierto = S.T + 1.4; d.empR = S.T; d.empOk = 'parada'; d.t0 = -9; eco('¡Parado!', 'bien'); }
      else { const n = Math.min(3, (def.golpes || 0) + 1), pronto = d.tipo === 'finta' && S.tParar > d.t0; d.res = n >= 3 ? 'muere' : 'recibe'; def.golpes = n - 1; eco(n >= 3 ? 'Herido de muerte' : d.imparable ? 'Te has descubierto: herido' : pronto ? 'Paraste pronto: herido' : 'Herido (' + n + ' de 3)', 'mal');
        if (L2) S.unidad.anima(-0.05 * S.unidad.peso); }   /* TP8b-L2: cada herida tuya pesa en los tuyos */
    }
    if (d.jEco) eco(d.jEco, d.res === 'cubre' ? '' : 'bien');
    /* TP8 1a: el golpe llega: la escena pone chispa o polvo en el sitio del impacto (y, en tu duelo, la pausa y el tirón) */
    const tuyo = !d.sec && d.r === S.yo; if (tuyo && d.ataR && d.res === 'cubre') { d.reb = true; d.corte = S.T - d.t0 + 0.24; }
    if (tuyo && d.ataR && d.res === 'muere') def.atras = true;   /* TP8b-L1: tu estocada lo mata: cae hacia atrás */
    /* TP8b-L2: matarlo limpio hunde a los galos y sube a los tuyos; si te para la estocada, te has descubierto: contraataca */
    if (L2 && tuyo && d.ataR && d.res === 'muere') { S.unidadG.anima(-0.04); S.unidad.anima(0.03); S.misMuertes = (S.misMuertes || 0) + 1; }
    if (L2 && tuyo && d.ataR && d.res === 'cubre') d.contraT = S.T + CONTRA;
    if (m.golpe) { def.tGolpe = S.T; def.tipoGolpe = d.res === 'cubre' ? 'escudo' : 'cuerpo'; m.golpe(d, def, at, def.tipoGolpe, tuyo); }
    if (d.res === 'cubre') { Son.hierro(pan, 0, tuyo ? 1 : 0.5); Son.madera(tuyo ? 0.9 : 0.45, pan); if (!m.golpe && azarL() < 0.5) chispa(V3.set((def.x + at.x) / 2, H(def.x, def.z) + 1.2, (def.z + at.z) / 2), 0.35); return; }
    def.golpes++; Son.madera(tuyo ? 0.7 : 0.3, pan); Son.tierra(pan); if (tuyo) Son.esfuerzo(pan, d.ataR ? 1 : 0.6); if (tuyo) Son.trueno(d.ataR ? 0.45 : 0.3); polvoEn(def.x, def.z, tuyo ? 9 : 5);
    if (d.res === 'muere') { def.vivo = false; def.muere = S.T + 0.12; Son.tierra(pan, 0.5); Son.herido(pan, 0.1); polvoEn(def.x, def.z, 8); }
  }
  /* el que cae deja hueco: lo ocupa el de detrás dando un paso al frente (un poco a un lado, para no pisar al caído) */
  function relevo(d) {
    const muerto = !d.r.vivo ? d.r : d.g, lado = muerto.px < 0 ? 1 : -1, eraYo = muerto === S.yo;
    let n = null;
    if (muerto.lado === 'r') {
      const col = S.romanos.filter(h => h.vivo && h.f === muerto.f && !h.duelo).sort((a, b) => a.j - b.j); n = col[0];
      if (n) { col.slice(1).forEach((h, k) => { h.j = k + 1; }); n.j = 0; d.r = n; n.duelo = d; }   /* los de más atrás no se mueven: no cruzan por la cámara */
    } else {
      let dm = 1e9; for (const g of S.galos) if (g.vivo && !g.duelo) { const dd = Math.abs(g.x - muerto.px); if (dd < dm) { dm = dd; n = g; } }
      if (!n) { n = refuerzo(muerto); if (n === 'espera') { d.espera = S.T + 0.4; return; } }
      if (n) { d.g = n; n.duelo = d; if (!d.sec && d.r === S.yo) { d.agr = (d.agr || 0) + 1; n.pisa = S.T; d.tipo = null; } }
    }
    if (eraYo) pasaA(n, muerto);
    if (!n) { d.activo = false; return; }
    n.px = muerto.px + 0.3 * lado; n.pz = muerto.pz + (muerto.lado === 'r' ? 0.1 : -0.1);
    for (const x of S.duelos) if (x.sec && x.r === muerto) x.r = d.r;
    d.next = S.T + 0.6 + azarL() * 0.8; d.espera = 0; d.t0 = -9; d.ts = -9; d.resuelto = true;
  }
  /* TP8b-L3: no queda galo libre: sale uno de reserva lejos, tras su línea, y llega corriendo. 'espera' si ya corren dos */
  function refuerzo(muerto) {
    const res = S.galos.filter(x => x.reserva); if (!res.length || S.huida || S.derrota) return null;
    if (S.galos.filter(x => x.vivo && x.corre).length >= 2 || S.T - S.tRefuerzo < R_CADA) return 'espera';
    /* TP8b-E2: sale de la masa de reserva el que está más cerca del hueco (delante y a su altura) */
    const g = res.sort((a, b) => (Math.abs(a.x - muerto.px) - 2 * a.z) - (Math.abs(b.x - muerto.px) - 2 * b.z))[0];
    Object.assign(g, { reserva: false, entra: true, vivo: true, lado: 'g', duelo: null, corre: true, golpes: 0, jy: (azarL() - 0.5) * 0.1, rit: 0.5 + azarL() * 0.5, camino: 0, off: 0, v: 0, est: { modo: 'guardia' } });
    g.xd = g.x; g.zd = g.z; g.yaw = 0;
    S.tRefuerzo = S.T; S.nRefuerzos++; S.unidadG.hombres++; S.unidadG.enPie++; S.unidadG.anima(R_ANIMO * W_REF); S.unidadG.balance *= 1 - 0.6 * W_REF;   /* ven llegar a los suyos: se rehacen (TP8b-E2: con más galos, cada refuerzo pesa menos) */
    return g;
  }
  function estado(m, T) {
    /* TP1b: tus gestos se ven en el acto: subir el escudo al pulsar «Parar», el empujón */
    if (m === S.yo && T - S.tParar < 0.75) return { modo: S.roto ? 'desvia' : 'cubre', t: T - S.tParar };
    if (m === S.yo && T - S.tEmpR < 0.6) return { modo: 'empuja', t: T - S.tEmpR };
    const de = m.duelo; if (m.lado === 'g' && de && de.empOk && T - de.empR < 1.1) return { modo: 'recibe', t: (T - de.empR) * 0.75, d: { lado: -1 } };
    const ds = S.duelos.filter(d => d.activo && d.t0 > 0 && (d.r === m || d.g === m));
    for (const d of ds) if ((d.ataR ? d.r : d.g) === m && T - d.t0 < finA(d)) return { modo: 'ataca', t: T - d.t0, d };
    for (const d of ds) {
      if ((d.ataR ? d.g : d.r) !== m) continue;
      if (d.res === 'cubre' && T > d.ts - 0.3 && T < d.ts + 0.45) return { modo: S.roto && m === S.yo ? 'desvia' : 'cubre', t: T - d.ts + 0.3, d };
      if (d.res !== 'cubre' && T > d.ts && T < d.ts + 0.8) return { modo: 'recibe', t: T - d.ts, d };
    }
    return { modo: m.duelo ? 'guardia' : 'detras' };
  }
  /* medio paso atrás: el que golpea, después del golpe; el que lo recibe, en el acto */
  function retroceso(m, T) {
    let o = 0, ap = 0;
    for (const d of S.duelos) {
      if (!d.activo || d.t0 < 0 || (d.r !== m && d.g !== m)) continue;
      if ((d.ataR ? d.r : d.g) === m) { const t = T - d.t0 - d.tb - d.clip.dur; o = Math.max(o, 0.32 * (suave(-0.1, 0.25, t) - suave(0.45, 1.0, t))); ap = Math.max(ap, aparta(d, T));
        if (d.aviso && FX) { const ta = T - d.t0; o = Math.max(o, 0.3 * (suave(0, d.tA || d.tb, ta) - suave(d.tb, d.tb + 0.1, ta))); } }   /* TP8b-L1: al armar da un paso atrás y lo suelta de golpe */
      else if (d.res && d.res !== 'cubre') { const t = T - d.ts; o = Math.max(o, (FX ? (d.ataR && !d.sec && d.r === S.yo ? 0.6 : 0.36) : 0.3) * (suave(0, FX ? 0.12 : 0.22, t) - suave(0.5, 1.1, t))); }
    }
    /* el empujón de tu escudo le hace recular */
    const de = m.duelo; if (m.lado === 'g' && de && de.empOk) { const t = T - de.empR; o = Math.max(o, (de.empOk === 'parada' ? 0.12 : 0.25) * (suave(0, 0.2, t) - suave(0.8, 1.4, t))); }
    /* TP8 1a: el golpe en el escudo le echa atrás un palmo */
    if (FX && m.tipoGolpe === 'escudo' && T - m.tGolpe < 0.6) { const t = T - m.tGolpe; o = Math.max(o, 0.1 * (suave(0, 0.07, t) - suave(0.15, 0.5, t))); }
    return o + ap;
  }
  function lucha(dt) {
    const T = S.T, pide = S.pide; S.pide = null;
    /* TP8b-F1: si rompen los tuyos, la reserva gala se viene a la carrera hasta detrás de los suyos */
    if (S.derrota && !S.resAvanza) { S.resAvanza = true; for (const g of S.galos) if (g.reserva) Object.assign(g, { reserva: false, vivo: true, lado: 'g', duelo: null, corre: true, golpes: 0, jy: 0, rit: 0.5, camino: 0, off: 0, v: 0, est: { modo: 'guardia' }, px: g.x, pz: Math.min(S.zF - 1.6 - (g.fila - 2) * 0.9, g.z + 6) }); }
    if (!S.huida && !S.derrota) for (const d of S.duelos) {
      if (!d.activo) continue;
      if (!d.resuelto && T >= d.ts) resuelve(d);
      if (!d.r.vivo || !d.g.vivo) { if (d.sec) { if (!d.g.vivo) d.activo = false; continue; } if (!d.espera) d.espera = T + 0.8 + azarL() * 0.5; if (T >= d.espera) relevo(d); continue; }
      if (d.relevoPend && !ocupado(d, T)) cambiaFila(d);
      if (d.g.corre) continue;   /* TP8b-L3: su refuerzo aún viene corriendo */
      if (!d.sec && d.r === S.yo) { tuDuelo(d, T, pide, dt); continue; }
      if (T >= d.next && listo(d.r) && listo(d.g)) empiezaCiclo(d);
    }
    /* el que rompe: los galos dan la espalda y huyen corriendo, cada uno a su tiempo (con su paso: locomocion.js) */
    if (S.huida) for (const g of S.galos) {
      if (!g.vivo) continue;
      if (!g.huye) { g.huye = true; g.salHuye = T + azarL() * 0.7; g.px = undefined; g.duelo = null; g.vx = (azarL() - 0.5) * 0.8; g.giro = azarL() < 0.5 ? Math.PI : -Math.PI; }
      const vObj = T >= g.salHuye ? 4.4 * g.vMas : 0; velocidad(g.paso, vObj, dt); const dd = g.paso.v * dt;
      g.z -= dd; g.x += g.vx * dd * 0.25; pisa(g.paso, dd, dt); g.dist += dd;
      if (T >= g.salHuye - 0.25) g.yaw += (g.giro - g.yaw) * Math.min(1, dt * 7);
      g.xd = g.x; g.zd = g.z; g.jy = 0; g.anda = true; g.est = { modo: 'huye' };
    }
    for (const m of [...S.romanos, ...S.galos]) {
      if (!m.vivo || m.px === undefined || m.huye) continue;
      const dx = m.px - m.x, dz = m.pz - m.z, dd = Math.hypot(dx, dz), v = Math.min(dd, (m.corre ? Math.min(V_CORRE, V_PUESTO + dd * 1.5) : V_PUESTO) * dt); if (m.corre && dd < 0.3) m.corre = false;
      if (dd > 1e-4) { m.x += dx / dd * v; m.z += dz / dd * v; }
      const off = retroceso(m, T), doff = Math.abs(off - m.off); m.off = off; m.camino += v + doff; m.anda = dd > 0.03 || doff > 0.2 * dt;
      /* mira a su rival; los de detrás, al frente enemigo */
      const d = m.duelo, riv = d && d.activo && !S.huida ? (m === d.r ? d.g : d.r) : null;
      const tx = riv && riv.vivo ? riv.x : m.x * 0.8, tz = riv && riv.vivo ? riv.z : m.lado === 'r' ? S.zF - 3 : S.zF + 2;
      m.yaw = Math.atan2(tx - m.x, tz - m.z); const yj = m.yaw + (m.jy || 0);
      m.xd = m.x - Math.sin(yj) * off; m.zd = m.z - Math.cos(yj) * off;
      if (m.lado === 'r' && !m.duelo) { m.xd += Math.sin(T * m.rit * 1.3 + m.fase) * 0.04; m.zd += Math.sin(T * m.rit + m.fase * 2) * 0.05; }   /* los de detrás se balancean */
      m.est = estado(m, T);
    }
  }
  /* ---------- TP1b · tu duelo ----------
     El galo de delante avisa: arma el brazo despacio (AVISO segundos) y se le marca; luego golpea deprisa. «Parar» a
     tiempo (desde que empieza a armar hasta el golpe) lo deja abierto; «Estocada» entra si está abierto o desequilibrado
     y, si no, la para él; «Empujar» lo desequilibra (y corta su golpe si aún está armando). */
  /* TP8b-L1: tres golpes del galo (tajo, rápido y finta), una ventana de parada corta (VENTANA s antes del golpe) y «Parar»
     que no se ignora: cada CD_PARAR s se puede, y el botón lo dice (S.tuyo, para el hud) */
  const AVISO = 0.95, RAPIDO = 0.4, FINTA = 0.5, VENTANA = 0.45, CD_PARAR = 0.75;
  function tuDuelo(d, T, pide, dt) {
    const oc = ocupado(d, T), pan = panDe(d.r.x), roto = !!S.roto, cE = roto ? C_HOM : C_EMP, F = () => L2 ? S.fuelleY : 999, gasta = c => { if (L2) S.fuelleY -= c; };
    /* TP8b-L2: el aliento se recobra si no pulsas; con poco, jadea y el eco lo dice una vez */
    if (L2) {
      if (pide) S.tPulsa = T;
      if (T - S.tPulsa > 0.35) S.fuelleY = Math.min(100, S.fuelleY + RECOBRA * dt);
      if (S.fuelleY < C_EST && !S.ecoSin) { S.ecoSin = true; eco('Sin aliento', 'mal'); } else if (S.fuelleY > 60) S.ecoSin = false;
      if (d.contraT && T >= d.contraT) { d.contraT = 0; avisa(d, T, 'contra'); }
    }
    if (roto && !S.ecoRoto) { S.ecoRoto = true; eco('Sin escudo: desvía con la espada'); }
    if (pide === 'parar' && T - S.tParar >= CD_PARAR && F() >= C_PAR) { S.tParar = T; gasta(C_PAR); Son.madera(roto ? 0.2 : 0.5, pan, 0.04); }
    if (d.aviso && oc && d.tipo === 'finta' && !d.ecoF && T - d.t0 > d.tA + 0.05) { d.ecoF = true; eco('¡Finta!'); }
    /* el galo nuevo llega pisando fuerte */
    if (d.g.pisa && listo(d.g)) { d.g.pisa = 0; Son.tierra(pan); Son.madera(0.5, pan); Son.trueno(0.25); polvoEn(d.g.x, d.g.z, 7); S.sacude = Math.max(S.sacude || 0, 0.25); }
    /* TP8 duda: tras herirte se quedaba lejos; vuelve a distancia de duelo antes del siguiente golpe */
    if (!oc && d.g.px !== undefined) { const dx = d.g.px - d.r.px, dz = d.g.pz - d.r.pz, l = Math.hypot(dx, dz) || 1; if (Math.abs(l - D_DUELO) > 0.2) { d.g.px = d.r.px + dx / l * D_DUELO; d.g.pz = d.r.pz + dz / l * D_DUELO; } }
    if (pide === 'empujar' && T >= S.tEmpuja && F() >= cE) {
      S.tEmpuja = T + 1.5; gasta(cE); S.tEmpR = T; Son.madera(0.5, pan); Son.esfuerzo(pan, 0.8); S.unidad.fatiga = Math.min(1, S.unidad.fatiga + 0.01);
      const armando = oc && d.aviso && T - d.t0 < d.tb * 0.9;
      if (!oc || armando) {
        if (armando) { d.t0 = -9; d.ts = -9; d.resuelto = true; }
        d.empR = T; d.empOk = true; d.deseq = T + (roto ? 0.75 : 1.5); d.next = Math.max(d.next, T + (roto ? 1.6 : 2.4)); eco(armando ? '¡Le cortas el golpe! Estocada' : roto ? 'Empujón de hombro: ¡estocada!' : 'Lo desequilibras: ¡estocada!', 'bien');
      } else eco('Tarde: para su golpe', 'mal');
    }
    if (pide === 'estocada') { if (oc) eco(d.ataR ? 'Ya golpeas' : 'Espera: para su golpe', 'mal'); else if (F() >= C_EST) { gasta(C_EST); estocada(d, T); return; } }
    if (!oc && T >= d.next && T >= (d.deseq || 0) && listo(d.r) && listo(d.g)) avisa(d, T);
    const oc2 = ocupado(d, T);
    S.tuyo = { parar: T - S.tParar >= CD_PARAR, ventana: !!(d.aviso && oc2 && !d.imparable && T > d.ts - (roto ? VR : VENTANA) && T <= d.ts + 0.06), estocada: !oc2, abierto: T < (d.abierto || 0) || T < (d.deseq || 0), empujar: T >= S.tEmpuja, roto };
    if (L2) Object.assign(S.tuyo, { fuelle: S.fuelleY, cP: C_PAR, cE, cS: C_EST });
  }
  function avisa(d, T, forz) {
    /* TP8b-L2: 'contra' es el golpe que te llega tras una estocada parada: casi sin armar, y no se puede parar */
    const r = azarL(), tipo = forz || S.forzarGolpe || (r < 0.3 ? 'rapido' : r < 0.58 && d.tipo !== 'finta' ? 'finta' : 'tajo');   /* nunca dos fintas seguidas */
    d.tipo = tipo; d.ecoF = false; d.corte = null; d.reb = false; d.tA = tipo === 'rapido' ? RAPIDO : tipo === 'contra' ? 0.1 : AVISO; d.imparable = tipo === 'contra'; d.contraT = 0;
    d.n++; d.t0 = T; d.ataR = false; d.aviso = true; d.jEco = null; d.empOk = false; d.clip = clipDe('g', d.n % 2 ? 'attack_melee2' : 'attack_melee'); d.tb = d.tA + (tipo === 'finta' ? FINTA : 0);
    const w0 = 0.8 * d.clip.golpe; d.w0 = w0; d.dr = d.clip.dur * (1 - w0); d.ts = T + d.tb + d.dr * (d.clip.golpe - w0) / (1 - w0);
    d.res = null; d.resuelto = false; d.lado = azarL() < 0.5 ? 1 : -1; d.next = T + d.tb + d.dr + (1.3 + azarL() * 1.3) * Math.max(0.5, 1 - 0.15 * (d.agr || 0));   /* cada galo nuevo descansa menos */
    alcanza(d);
  }
  function estocada(d, T) {
    const abierto = T < (d.abierto || 0) || T < (d.deseq || 0);
    d.n++; d.t0 = T; d.ataR = true; d.aviso = false; d.corte = null; d.reb = false; d.clip = clipDe('r', 'attack_melee'); d.tb = 0.04;   /* TP8b-L1: el gesto arranca en el acto */ d.ts = T + d.tb + d.clip.dur * d.clip.golpe;
    d.res = abierto ? ((d.g.golpes || 0) >= 1 ? 'muere' : 'recibe') : 'cubre';
    d.jEco = abierto ? (d.res === 'muere' ? '¡Buen golpe! Cae' : '¡Buen golpe!') : 'Te para: ábrelo antes';
    d.resuelto = false; d.lado = azarL() < 0.5 ? 1 : -1; d.abierto = 0; d.deseq = 0; d.empOk = false; d.next = Math.max(d.next, T + 1.6 + azarL() * 0.8);
    alcanza(d);
  }
  /* en qué punto (0 a 1) del clip de ataque va un galo; null si no ataca. Con aviso: arma despacio y suelta deprisa */
  function sAtaque(e) {
    if (!e || e.modo !== 'ataca') return null; const d = e.d, t = e.t;
    if (!d.aviso) return t >= d.tb && t < d.tb + d.clip.dur ? (t - d.tb) / d.clip.dur : null;
    if (t < d.tb) return d.w0 * suave(0, d.tA || d.tb, t);
    return t < d.tb + d.dr ? d.w0 + (t - d.tb) / d.dr * (1 - d.w0) : null;
  }
  /* has caído: pasas a ser el que te releva (o, si no queda nadie en tu columna, otro de la primera fila) */
  function pasaA(n, muerto) {
    if (!n) { const d = S.duelos.find(x => x.activo && !x.sec && x.r.vivo && x.r !== muerto); n = d ? d.r : null; }
    const eraCent = muerto.i === YO; if (eraCent) S.unidad.centurionCae();
    if (L2) { S.misCaidas = (S.misCaidas || 0) + 1; S.unidad.anima(-0.08 * S.unidad.peso); S.fuelleY = 100; }   /* TP8b-L2: tu caída pesa en los tuyos */
    S.yo = n; if (!n) { m.cinta(eraCent ? 'El centurión ha caído' : 'Has caído', false); return; }
    n.golpes = 0; S.tParar = -9; S.tEmpR = -9;
    m.cinta((eraCent ? 'El centurión ha caído: ahora eres ' : 'Has caído: ahora eres ') + m.nombre(n), false);
  }
  /* «Relevo»: en cada pareja de la primera fila (menos la tuya), el de detrás pasa delante y el cansado se queda detrás.
     Se cruzan cada uno por un lado, para no pisarse. Si están en mitad de un golpe, en cuanto acaben */
  function relevoOrden() {
    let n = 0;
    for (const d of S.duelos) { if (!d.activo || d.sec || !d.r.vivo || d.r === S.yo) continue; d.relevoPend = true; n++; }
    S.unidad.relevo(); S.nRelevos = (S.nRelevos || 0) + 1; return n;
  }
  function cambiaFila(d) {
    d.relevoPend = false; const viejo = d.r, col = S.romanos.filter(h => h.vivo && h.f === viejo.f && !h.duelo && h !== viejo).sort((a, b) => a.j - b.j), nu = col[0];
    if (!nu) return;
    nu.j = 0; viejo.j = 1; col.slice(1).forEach((h, k) => { h.j = k + 2; });
    viejo.duelo = null; nu.duelo = d; d.r = nu; nu.golpes = 0;
    const x0 = viejo.px, z0 = viejo.pz; nu.px = x0 + 0.26; nu.pz = z0; viejo.px = x0 - 0.26; viejo.pz = S.zF + 0.85;
    d.next = S.T + 0.9 + azarL() * 0.9; d.t0 = -9; d.ts = -9; d.resuelto = true;
  }
  /* «Cargad» en la lucha: unos segundos de empuje con todo (golpean más, se cansan más; al galo le pesa) */
  function cargad() { S.cargaHasta = S.T + 4; S.unidadG.anima(-0.05); S.unidad.fatiga = Math.min(1, S.unidad.fatiga + 0.1); }
  function huida() { S.huida = S.T; for (const d of S.duelos) d.activo = false; for (const g of S.galos) if (g.reserva) Object.assign(g, { reserva: false, vivo: true, lado: 'g', duelo: null, corre: false, yaw: 0, jy: 0, camino: 0, off: 0 }); }   /* TP8b-F1: la reserva también da la espalda y huye */
  function polvoEn(x, z, n) { for (let i = 0; i < n; i++) { const p = PIES.find(p => S.T - p.t > 1.8); if (!p) return; p.t = S.T; p.x = x + (azarV() - 0.5) * 0.8; p.z = z + (azarV() - 0.5) * 0.6; p.y = H(p.x, p.z) + 0.15; p.vx = (azarV() - 0.5) * 0.6; p.vy = 0.3 + azarV() * 0.3; p.vz = (azarV() - 0.5) * 0.6; p.s = 0.8 + azarV() * 0.8; } }
  /* para las pruebas: los luchadores en pie, los caídos y los duelos que están en marcha */
  function medLucha() {
    const L = [...S.romanos, ...S.galos].filter(m => m.vivo && m.xd !== undefined); let dmin = 9;
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) dmin = Math.min(dmin, Math.hypot(L[a].xd - L[b].xd, L[a].zd - L[b].zd));
    const act = S.duelos.filter(d => d.activo && !d.sec && d.r.vivo && d.g.vivo && d.t0 > 0 && S.T - d.t0 < d.P * 1.2);
    const fases = new Set(act.map(d => Math.floor((S.T - d.t0) / 0.15)));
    return { dmin: +dmin.toFixed(2), duelos: act.length, fases: fases.size, caidosR: S.romanos.filter(h => !h.vivo).length, caidosG: S.galos.filter(g => !g.vivo).length };
  }
  /* la primera fila de ahora (para las pruebas de «Relevo») */
  const primera = () => S.duelos.filter(d => d.activo && !d.sec).map(d => d.r.i);
  Object.assign(fns, { RESERVA: RESERVA_G, VENTANA, clipPos, poseLucha, empiezaLucha, lucha, medLucha, polvoEn, sAtaque, relevoOrden, cargad, huida, primera, ocupado: d => ocupado(d, S.T) });
  return fns;
}

/* CB2: pone en la tabla de huesos la pose del motor de lucha para un hombre. tab: lo que da generaTabla (T, esq, hues);
   fila: fila libre de la tabla para ese hombre; base: fila de partida (reposo); pose: poseDe(h, t) de js/combate-poses.js.
   Devuelve la fila (para aFrame). Quien llama pone needsUpdate en la textura de huesos. */
export function aplicaPoseCombate(tab, fila, base, pose, E, filaArma = null) {
  const o = fila * tab.hues * 12;
  tab.T.set(posturaDePose(tab.esq, base, pose, E), o);
  /* el arma en la mano: en reposo el gladius va envainado. Si se da filaArma (un cuadro con el arma empuñada), la espada
     se pone donde la lleva ese cuadro respecto al antebrazo: espada = antebrazo · antebrazo(filaArma)⁻¹ · espada(filaArma) */
  if (filaArma != null) {
    const m = h => Array.from(tab.T.subarray(o + h * 12, o + h * 12 + 12));
    const rel = mul(inversa(tab.esq.mat(filaArma, HU.anteD)), tab.esq.mat(filaArma, HU.espada));
    tab.T.set(mul(m(HU.anteD), rel), o + HU.espada * 12);
    /* el scutum derecho: guarda el giro que tiene respecto al pecho en filaArma (de pie, no tumbado hacia delante) y se
       traslada para que el asa siga en la muñeca */
    const E2 = tab.esq, ip = inversa(E2.mat(filaArma, HU.pecho)), P = m(HU.pecho);
    const esc = mul(P, mul(ip, E2.mat(filaArma, HU.escudo))), ant = mul(P, mul(ip, E2.mat(filaArma, HU.anteI)));
    const w1 = punto(m(HU.anteI), E2.J.munecaI), w0 = punto(ant, E2.J.munecaI);
    esc[3] += w1[0] - w0[0]; esc[7] += w1[1] - w0[1]; esc[11] += w1[2] - w0[2];
    tab.T.set(esc, o + HU.escudo * 12);
  }
  return fila;
}
/* inversa de una matriz 3×4 (afín) */
function inversa(a) {
  const [m0, m1, m2, t0, m3, m4, m5, t1, m6, m7, m8, t2] = a;
  const c0 = m4 * m8 - m5 * m7, c1 = m5 * m6 - m3 * m8, c2 = m3 * m7 - m4 * m6, d = 1 / (m0 * c0 + m1 * c1 + m2 * c2);
  const r = [c0 * d, (m2 * m7 - m1 * m8) * d, (m1 * m5 - m2 * m4) * d, 0, c1 * d, (m0 * m8 - m2 * m6) * d, (m2 * m3 - m0 * m5) * d, 0,
    c2 * d, (m1 * m6 - m0 * m7) * d, (m0 * m4 - m1 * m3) * d, 0];
  r[3] = -(r[0] * t0 + r[1] * t1 + r[2] * t2); r[7] = -(r[4] * t0 + r[5] * t1 + r[6] * t2); r[11] = -(r[8] * t0 + r[9] * t1 + r[10] * t2);
  return r;
}
