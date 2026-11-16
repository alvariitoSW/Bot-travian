/* Maqueta GM1 «guerra grande» — REGLAS. Son las de GC1 (guerra-cero/reglas.js) con una sola novedad: el tamaño.
   nueva(semilla, hombres) reparte «hombres» romanos (y el enemigo en la misma proporción que GC1) y las bajas van a escala,
   así que la batalla dura lo mismo con 1 000 que con 10 000. Cada hombre cuenta: fuerza, bajas y ánimo salen del número real.
   Sin pantalla: corre igual en Node (prueba.mjs) y en el navegador.
   Una batalla son tres duelos (ala izquierda, centro, ala derecha). Cada cuerpo romano tiene tres líneas que se relevan.
   El jugador solo da cuatro órdenes: empujar, aguantar, relevo y caballería. */

export const LADO_ROMA = 0, LADO_ENEMIGO = 1;
export const NOMBRE_SECTOR = ['Ala izquierda', 'Centro', 'Ala derecha'];
export const DONDE = ['por la izquierda', 'en el centro', 'por la derecha'];

/* cal = calidad en el choque · cansa = cuánto se fatiga al empujar · firme = aguanta mejor a pie quieto */
export const TROPAS = {
  hastati:   { n: 'hastati',   uno: 'los hastati',   cal: 1.00, cansa: 1.00, hombres: 120 },
  principes: { n: 'príncipes', uno: 'los príncipes', cal: 1.14, cansa: 0.90, hombres: 120 },
  triarii:   { n: 'triarios',  uno: 'los triarios',  cal: 1.12, cansa: 0.80, hombres: 60, firme: true },
  galos:     { n: 'galos',     uno: 'los galos',     cal: 1.34, cansa: 1.75, hombres: 230 },
  libios:    { n: 'libios',    uno: 'los libios',    cal: 1.20, cansa: 0.72, hombres: 260 },
  iberos:    { n: 'iberos',    uno: 'los iberos',    cal: 1.10, cansa: 1.05, hombres: 230 },
};
export const T_MARCHA = 7;        // segundos hasta el choque
const T_RELEVO = 3.2;             // lo que tarda una línea en pasar por los huecos de la otra
const T_CABALLERIA = 24;          // descanso de los équites entre cargas
const BASE_FATIGA = 1 / 42;       // empujando sin parar, una línea se agota en unos 40 s
const DESCANSO = 1 / 120;          // una línea en retaguardia recobra el aliento despacio
const K_BAJAS = 1.55;              // hombres por segundo que causa una fuerza de 1

function azar(semilla) { let s = semilla >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function cuerpo(lado, i, tipos, k) {
  const lineas = tipos.map(t => { const h = Math.round(TROPAS[t].hombres * k); return { tipo: t, hombres: h, max: h, fatiga: 0 }; });
  return { lado, i, lineas, postura: 'aguantar', moral: 1, roto: false, relevo: 0, golpe: 0, flanqueado: false, libre: 0, tPost: 0, inicial: lineas.reduce((a, l) => a + l.max, 0) };
}

export const BASE_HOMBRES = 900;   // romanos de la batalla de GC1 (tres cuerpos de 120 + 120 + 60)
export function nueva(semilla, hombresRoma) {
  const k = Math.max(0.3, (hombresRoma || BASE_HOMBRES) / BASE_HOMBRES), lejos = 2.2 * (Math.sqrt(Math.max(1, k)) - 1);   // el campo crece: los jinetes tardan más en llegar
  const B = { k, lejos, t: 0, fase: 'marcha', rnd: azar(semilla || 7), sect: [], eventos: [], resultado: null, ordenes: 0,
    cab: { estado: 'lista', sect: -1, t: 0, hombres: Math.round(66 * k) },                         // équites romanos
    num: { estado: 'lejos', sect: -1, t: 0, veces: 0, proxima: 30, hombres: Math.round(66 * k) } };  // jinetes númidas
  const enemigo = ['galos', 'libios', 'iberos'];
  for (let i = 0; i < 3; i++) B.sect.push({ i, frente: 0, c: [cuerpo(0, i, ['hastati', 'principes', 'triarii'], k), cuerpo(1, i, [enemigo[i]], k)] });
  B.num.proxima = 28 + B.rnd() * 8;
  return B;
}

export const frente = c => c.lineas[0];
export const hombres = c => c.lineas.reduce((a, l) => a + l.hombres, 0);
export const hombresLado = (B, lado) => B.sect.reduce((a, s) => a + hombres(s.c[lado]), 0);
export const inicialLado = (B, lado) => B.sect.reduce((a, s) => a + s.c[lado].inicial, 0);

function ev(B, tipo, sect, texto, mas) { B.eventos.push(Object.assign({ tipo, sect, texto, t: B.t }, mas || {})); }

function fuerza(c) {
  const l = frente(c), T = TROPAS[l.tipo];
  const fondo = Math.max(0.3, Math.min(1, l.hombres / (0.4 * l.max)));          // pega con todo hasta que la línea se queda en el 40 %
  return T.cal * fondo * (1 - 0.55 * l.fatiga) * (c.postura === 'empujar' ? 1.25 : 0.8) * (c.relevo > 0 ? 0.7 : 1) * (0.7 + 0.3 * c.moral);
}

/* Qué puede hacer el jugador ahora mismo en un sector. Devuelve '' si se puede, o el motivo en llano. */
export function puede(B, i, orden) {
  const c = B.sect[i].c[0];
  if (B.fase === 'fin') return 'La batalla ha terminado';
  if (orden === 'caballeria') {
    if (B.cab.estado !== 'lista') return 'Los jinetes se están rehaciendo';
    if (B.sect[i].c[1].roto) return 'Ahí ya no queda enemigo';
    return '';
  }
  if (c.roto) return 'Ese cuerpo ha huido';
  if (orden === 'relevo') { if (c.lineas.length < 2) return 'No queda línea de refresco'; if (c.relevo > 0) return 'El relevo ya está en marcha'; return ''; }
  if (orden === 'empujar' || orden === 'aguantar') return c.postura === orden ? 'Ya lo están haciendo' : '';
  return 'Orden desconocida';
}

export function ordenar(B, i, orden) {
  const no = puede(B, i, orden); if (no) return no;
  const c = B.sect[i].c[0]; B.ordenes++;
  if (orden === 'empujar' || orden === 'aguantar') { c.postura = orden; ev(B, 'orden', i, orden === 'empujar' ? '¡Adelante!' : 'Escudos juntos', { orden }); }
  else if (orden === 'relevo') {
    c.lineas.push(c.lineas.shift()); c.relevo = T_RELEVO; c.moral = Math.min(1, c.moral + 0.1);
    ev(B, 'relevo', i, 'Entran ' + TROPAS[frente(c).tipo].uno, { orden });
  } else if (orden === 'caballeria') { B.cab.estado = 'yendo'; B.cab.sect = i; B.cab.t = 3 + B.lejos; ev(B, 'caballeria', i, 'Los jinetes cargan ' + DONDE[i], { orden }); }
  return '';
}

function romper(B, s, lado) {
  const c = s.c[lado]; if (c.roto) return; c.roto = true; c.moral = 0;
  const quien = lado === 0 ? 'Tu ' + NOMBRE_SECTOR[s.i].toLowerCase() : TROPAS[frente(c).tipo].uno.replace(/^l/, 'L');
  ev(B, 'roto', s.i, lado === 0 ? quien + ' huye' : quien + ' huyen', { lado });
  for (const o of B.sect) { if (o === s) continue; if (!o.c[lado].roto) o.c[lado].moral = Math.max(0.02, o.c[lado].moral - 0.13); if (!o.c[1 - lado].roto) o.c[1 - lado].moral = Math.min(1, o.c[1 - lado].moral + 0.1); }
  s.c[1 - lado].libre = 4;                                          // el vencedor tarda un poco en volverse contra el flanco vecino
  if (lado === 0 && B.num.estado === 'hostiga' && B.num.sect === s.i) { B.num.estado = 'lejos'; B.num.proxima = B.t + 25; }
}

/* El vecino más cercano que aún lucha, para envolverlo */
export function vecino(B, i, ladoRival) {
  for (const j of i === 1 ? [0, 2] : [1, 2 - i]) { const o = B.sect[j]; if (!o.c[ladoRival].roto && !o.c[1 - ladoRival].roto) return o; }
  for (const j of i === 1 ? [0, 2] : [1, 2 - i]) { const o = B.sect[j]; if (!o.c[ladoRival].roto) return o; }
  return null;
}

function bajas(c, n) {
  const l = frente(c); l.hombres = Math.max(0, l.hombres - n);
  if (l.hombres < 0.15 * l.max && c.lineas.length > 1) { c.lineas.shift(); c.relevo = Math.max(c.relevo, 1.5); return true; }   // la línea deshecha se retira sola
  return false;
}

/* El enemigo decide solo, y siempre avisa: su postura se ve antes de que haga daño */
function mente(B, s, dt) {
  const e = s.c[1], r = s.c[0], l = frente(e), tipo = l.tipo; e.tPost += dt; let quiere = e.postura;
  if (tipo === 'galos') quiere = e.postura === 'empujar' ? (l.fatiga > 0.78 ? 'aguantar' : 'empujar') : (l.fatiga < 0.5 || e.tPost > 16 ? 'empujar' : 'aguantar');
  else if (tipo === 'libios') { if (B.t < T_MARCHA + 14) quiere = 'aguantar'; else quiere = e.postura === 'empujar' ? (e.tPost > 15 || l.fatiga > 0.85 ? 'aguantar' : 'empujar') : ((e.tPost > 9 && l.fatiga < 0.7) || (!r.roto && frente(r).fatiga > 0.6 && e.tPost > 4) ? 'empujar' : 'aguantar'); }
  else quiere = e.postura === 'empujar' ? (e.tPost > 11 || l.fatiga > 0.8 ? 'aguantar' : 'empujar') : (e.tPost > 8 && l.fatiga < 0.65 ? 'empujar' : 'aguantar');
  if (quiere !== e.postura) { e.postura = quiere; e.tPost = 0; if (!r.roto) ev(B, quiere === 'empujar' ? 'carga-enemiga' : 'enemigo-cede', s.i, quiere === 'empujar' ? TROPAS[tipo].uno.replace(/^l/, 'L') + ' cargan ' + DONDE[s.i] : TROPAS[tipo].uno.replace(/^l/, 'L') + ' flaquean ' + DONDE[s.i]); }
}

export function paso(B, dt) {
  if (B.fase === 'fin') return;
  B.t += dt;
  if (B.fase === 'marcha') { if (B.t >= T_MARCHA) { B.fase = 'lucha'; for (const s of B.sect) { s.c[1].tPost = 0; } B.sect[0].c[1].postura = 'empujar'; ev(B, 'choque', 1, 'Las líneas chocan'); ev(B, 'carga-enemiga', 0, 'Los galos cargan por la izquierda'); } return; }

  for (const s of B.sect) {
    const r = s.c[0], e = s.c[1];
    for (const c of s.c) { if (c.relevo > 0) c.relevo = Math.max(0, c.relevo - dt); if (c.golpe > 0) c.golpe = Math.max(0, c.golpe - dt); for (let k = 1; k < c.lineas.length; k++) c.lineas[k].fatiga = Math.max(0, c.lineas[k].fatiga - DESCANSO * dt); }
    if (r.roto && e.roto) continue;
    if (r.roto || e.roto) {                                           // el vencedor se vuelve contra el flanco del vecino
      const v = r.roto ? e : r; if (v.libre > 0) { v.libre -= dt; if (v.libre <= 0) { const o = vecino(B, s.i, 1 - v.lado); if (o) { const w = o.c[1 - v.lado]; if (!w.flanqueado) { w.flanqueado = true; ev(B, 'envuelve', o.i, v.lado === 0 ? 'Tus hombres envuelven ' + (o.i === 1 ? 'el centro enemigo' : 'el ala enemiga') : 'El enemigo te envuelve ' + DONDE[o.i], { lado: v.lado }); } } } }
      frente(v).fatiga = Math.max(0, frente(v).fatiga - DESCANSO * dt); continue;
    }
    mente(B, s, dt);
    const fr = fuerza(r), fe = fuerza(e), ruido = 0.9 + 0.2 * B.rnd();
    for (const [c, f, rival] of [[r, fe, e], [e, fr, r]]) {
      const l = frente(c), T = TROPAS[l.tipo];
      let d = f * K_BAJAS * B.k * dt * ruido * (c.postura === 'aguantar' ? (T.firme ? 0.45 : 0.6) : 1) * (c.flanqueado ? 1.5 : 1) * (c.golpe > 0 ? 1.4 : 1);
      if (c.postura === 'empujar' && rival.postura === 'aguantar') d *= 1.12; if (c.postura === 'empujar' && rival.postura === 'empujar') d *= 1.2;      // quien se lanza contra un muro de escudos paga más
      const total = c.inicial;
      c.moral -= d / total * 1.2 + (c.flanqueado ? 0.028 : 0) * dt + (f > fuerza(c) ? 0.013 * (f - fuerza(c)) * dt : 0) + (l.fatiga > 0.85 ? 0.006 * dt : 0);
      if (c.postura === 'aguantar' && !c.flanqueado) c.moral += 0.004 * dt;
      l.fatiga = Math.max(0, Math.min(1, l.fatiga + (c.postura === 'empujar' ? BASE_FATIGA * T.cansa : -BASE_FATIGA * 0.22) * dt));
      const cayo = bajas(c, d);
      if (cayo && c.lado === 0) ev(B, 'linea-deshecha', s.i, 'Línea deshecha: entran ' + TROPAS[frente(c).tipo].uno);
      c.moral = Math.min(1, c.moral);
    }
    s.frente = Math.max(-1, Math.min(1, s.frente + (fr - fe) * 0.045 * dt));
    if (Math.abs(s.frente) >= 1) (s.frente > 0 ? e : r).moral -= 0.02 * dt;      // sin sitio para ceder más
    for (const c of s.c) { const l = frente(c); if (c.moral <= 0 || (c.lineas.length === 1 && l.hombres < 0.15 * l.max)) romper(B, s, c.lado); }
    if (!r.roto && !r.avisado && frente(r).fatiga > 0.8 && r.lineas.length > 1 && r.relevo <= 0) { r.avisado = B.t; ev(B, 'cansados', s.i, 'Tus ' + TROPAS[frente(r).tipo].n + ' están agotados ' + DONDE[s.i]); }
    if (r.avisado && (frente(r).fatiga < 0.6)) r.avisado = 0;
  }

  /* Caballería romana: va, golpea el flanco (o espanta a los númidas) y vuelve a rehacerse */
  const cab = B.cab, num = B.num;
  if (cab.estado !== 'lista') {
    cab.t -= dt;
    if (cab.t <= 0) {
      if (cab.estado === 'yendo') {
        const s = B.sect[cab.sect], e = s.c[1];
        if ((num.estado === 'hostiga' || num.estado === 'llega') && num.sect === cab.sect) { num.estado = 'lejos'; num.proxima = B.t + 34 + B.rnd() * 10; ev(B, 'numidas-fuera', cab.sect, 'Tus jinetes espantan a los númidas'); }
        else if (!e.roto) { e.moral -= 0.2; bajas(e, 22 * B.k); e.golpe = 6; ev(B, 'impacto', cab.sect, 'Carga en el flanco enemigo'); if (e.moral <= 0) romper(B, s, 1); }
        cab.estado = 'cargando'; cab.t = 4;
      } else if (cab.estado === 'cargando') { cab.estado = 'volviendo'; cab.t = T_CABALLERIA - 7; }
      else { cab.estado = 'lista'; cab.sect = -1; ev(B, 'caballeria-lista', -1, 'Jinetes listos'); }
    }
  }
  /* Númidas: avisan, rodean un ala y la hostigan hasta que alguien los eche o se cansen */
  if (num.estado === 'lejos' && B.t >= num.proxima && num.veces < 3) {
    const alas = [0, 2].filter(i => !B.sect[i].c[0].roto);
    if (alas.length) { alas.sort((a, b) => B.sect[a].c[0].moral - B.sect[b].c[0].moral); num.sect = B.rnd() < 0.7 ? alas[0] : alas[alas.length - 1]; num.estado = 'llega'; num.t = 5 + B.lejos; num.veces++; ev(B, 'numidas-aviso', num.sect, '¡Númidas ' + DONDE[num.sect] + '!'); }
    else num.proxima = B.t + 20;
  } else if (num.estado === 'llega') { num.t -= dt; if (num.t <= 0) { num.estado = 'hostiga'; num.t = 15; } }
  else if (num.estado === 'hostiga') {
    num.t -= dt; const s = B.sect[num.sect], r = s.c[0];
    if (!r.roto) { const m = frente(r).tipo === 'triarii' && r.postura === 'aguantar' ? 0.35 : 1; r.moral -= 0.024 * m * dt; bajas(r, 1.3 * B.k * m * dt); if (r.moral <= 0) romper(B, s, 0); }
    if (num.t <= 0 || r.roto) { num.estado = 'lejos'; num.proxima = B.t + 30 + B.rnd() * 10; if (!r.roto) ev(B, 'numidas-fuera', num.sect, 'Los númidas se alejan'); }
  }

  const rotos = [0, 1].map(l => B.sect.filter(s => s.c[l].roto).length);
  if (rotos[1] >= 2) fin(B, 'victoria'); else if (rotos[0] >= 2) fin(B, 'derrota');
  else if (B.t > 260) fin(B, hombresLado(B, 0) / inicialLado(B, 0) > hombresLado(B, 1) / inicialLado(B, 1) ? 'victoria' : 'derrota', 'Cae la tarde y los ejércitos se separan');
}

export function fin(B, como, motivo) {
  if (B.fase === 'fin') return;
  B.fase = 'fin';
  const cuales = l => B.sect.filter(s => s.c[l].roto).map(s => ['ala izquierda', 'centro', 'ala derecha'][s.i]).join(' y ');
  if (!motivo) motivo = como === 'victoria' ? 'Rompiste su ' + cuales(1) + ': el resto huye.' : como === 'derrota' ? 'Cedieron tu ' + cuales(0) + ': la legión se deshace.' : 'Sacas a la legión en orden. El campo queda para el enemigo.';
  B.resultado = { como, motivo, t: B.t, bajas: [inicialLado(B, 0) - Math.round(hombresLado(B, 0)), inicialLado(B, 1) - Math.round(hombresLado(B, 1))], inicial: [inicialLado(B, 0), inicialLado(B, 1)], ordenes: B.ordenes };
  ev(B, 'fin', -1, '');
}
export const retirarse = B => fin(B, 'retirada');
