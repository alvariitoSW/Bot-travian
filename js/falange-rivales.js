/* AQVILA · FA5 · Rivales nuevos de la falange a pie, sin pantalla (corre en Node). Diseño: gobierno/partes/2026-11-23-FA5.md.
   Cuatro rivales: caballeria, elefantes, falange y hoplitas. Cada uno es { nombre, crea(S, azar), paso(S, dt), choque(S, h) }
   y crearFalange (js/falange.js, FA1) lo recibe en m.rival. Cumple el contrato de la cabecera de js/falange.js:
     - sus hombres y bestias van en S.ene { i, x, z, yaw, vivo, muere, est, tipo, toca } (tipo 'jinete' | 'elefante' |
       'piquero' | 'infante'); su unidad, en S.R. S.riv guarda solo lo interno (fase, pasadas, oleadas, linea); S.riv.hombres
       y S.riv.bestias son vistas de los mismos objetos de S.ene.
     - S.ganador 'falange' | 'rival' y S.causa 'empuje' | 'bajas' | 'flanco' | 'hueco' | 'animo'.
   EJES (los del contrato): metros; pivote del muro en (S.xF, S.zF); frente = (sen giro, -cos giro); derecha = (cos giro,
   sen giro); S.giro positivo = el muro ha girado a su derecha (+x), tope ±90°. Ángulo absoluto a = dirección (sen a, -cos a).
   yaw como el contrato: dirección (sen yaw, cos yaw); el falangita mira con yaw = π - giro.
   azar: función () -> [0,1); crea la guarda en S.riv.azar. Sin dado del sistema: misma semilla, misma partida.
   choque(S, h): el motor la llama cuando cambia h.toca ('puntas' | 'frente' | 'der' | 'izq' | 'espalda'); si no hay motor que
   la llame, paso la llama a la llegada. Devuelve 'frena' | 'cae' | 'entra' | 'espanta' | 'hueco' | 'para'; repetida sobre el
   mismo contacto devuelve lo mismo sin volver a contar (h.contacto, h.res).
   AVISOS del contrato que usa: flanco {lado, hombres, t, rumbo, angulo} · flancoParado · flancoEntra {lado} · dentro · cae ·
   salva {t} · rompe {ganador, causa}. AVISOS PROPIOS (no están en el contrato): rumbo {lado, t, rumbo, angulo} (tras
   'flanco': de dónde y cuándo llegan) · finta {lado, angulo, t} · barrito {t} ·
   espanta {bestia, desbocada} · hueco {columna} · cerrado · oleada {latidos, t} · gastado {latidos}.
   HISTORIA (plan FA0 §5). Caballería que busca el flanco y la espalda de la falange: histórico (Heraclea 280 a.C.; el yunque
   y el martillo; Polibio 18.31-32 sobre el flanco y el terreno roto; Pidna, Plutarco, Emilio 20). Elefantes contra picas:
   probable (Rafia 217, Magnesia 190). En Benevento (275 a.C.) los elefantes de Pirro se revolvieron contra los suyos
   (Plutarco, Pirro 25; Dionisio 20.12): histórico. Falange contra falange (Selasia 222, Rafia 217, Mantinea 207): histórico;
   muro hoplita en esta época, raro (Esparta antes de 227): probable.
   Licencia de juego: que los elefantes se espanten por las filas bajadas.
   Licencia de juego: el compás, las oleadas, las fintas, los segundos de aviso y todas las cifras de este archivo. */

/* ---------- PUENTE con el estado S y el motor de FA1. Todo lo que se supone de S pasa por aquí; con S.motor se usan sus
   ayudas y, si faltan, la reserva de cada línea. Si el contrato real difiere, se cambia solo esto. ---------- */
const M = S => S.motor || {};
const giroDe = S => (typeof S.giro === 'number' ? S.giro : 0);
const pivote = S => ({ x: typeof S.xF === 'number' ? S.xF : 0, z: typeof S.zF === 'number' ? S.zF : 0 });
const bajadasDe = S => (M(S).bajadas ? M(S).bajadas() : (Array.isArray(S.filas) ? S.filas : [1, 1, 1, 1, 1]).slice(0, 5).filter(Boolean).length);
const pulsoDe = S => (typeof S.pulso === 'number' ? S.pulso : null);
const cohDe = S => (typeof S.coh === 'number' ? S.coh : 100);
const ordenDe = S => S.orden || null;
const tiempoDe = S => (typeof S.T === 'number' ? S.T : S.riv ? S.riv.T : 0);
const estocadaDe = S => Math.max(S.yo && typeof S.yo.tEstocada === 'number' ? S.yo.tEstocada : -1e9, typeof S.tEstocada === 'number' ? S.tEstocada : -1e9);
const llamaChoque = S => !!M(S).llamaChoque || !!M(S).mundo;
/* motor completo (el real de FA1): él decide el final (S.ganado ±META, S.U o S.R rotos), mata a los que entran y cierra el flanco */
const motorCompleto = S => !!M(S).mundo;
/* ¿el latido de bT fue a compás? Con el motor real, por S.kUsado (el latido del último toque bueno); aguantar cuenta como acertar,
   porque con «aguantar» el motor no deja tocar */
function aciertoLatido(S, bT) {
  if (ordenDe(S) === 'aguantar') return true;
  if (typeof S.kUsado === 'number') return S.kUsado === Math.round(bT / PULSO);
  return Math.abs(estocadaDe(S) - bT) <= 0.25;
}
/* metros que gana (+) o cede (-) el muro por el empuje del rival: con S.ganado, los cuenta el motor (y su META manda) */
function metros(S, riv, m) { if (typeof S.ganado === 'number') { S.ganado += m; S.pend = (S.pend || 0) + m; riv.linea = S.ganado; } else riv.linea += m; }
const mandaMeta = S => typeof S.ganado === 'number';
function marcaChoque(S) { if (S.choque === false) { S.choque = true; S.tChoque = tiempoDe(S); S.fase = 'choque'; S.pend = 0; avisa(S, 'choque', {}); } }
function local(S, x, z) {
  if (M(S).local) return M(S).local(x, z);
  const p = pivote(S), g = giroDe(S), dx = x - p.x, dz = z - p.z, delante = dx * Math.sin(g) - dz * Math.cos(g), lado = dx * Math.cos(g) + dz * Math.sin(g);
  return { delante, lado, ang: Math.atan2(lado, delante) };
}
function terrenoLado(S) { const t = S.terreno; if (!t || typeof t.x !== 'number') return 0; return Math.sign(local(S, t.x, t.z).lado); }
function avisa(S, tipo, datos = {}) { const f = M(S).avisa || S.avisa || (S.riv && S.riv.avisa); if (typeof f === 'function') f(tipo, datos); }
function cambiaCoh(S, d) { if (M(S).cohesion) M(S).cohesion(d); else S.coh = Math.max(0, Math.min(100, cohDe(S) + d)); }
function bajas(S, n, causa) {
  if (n <= 0) return;
  if (M(S).caeFalangita && Array.isArray(S.fal)) { let k = 0; for (const h of S.fal) { if (k >= n) break; if (h.vivo) { M(S).caeFalangita(h, causa); k++; } } return; }
  if (S.U && S.U.baja) S.U.baja(n);
}
function causa(S, n) { if (n > 0 && S.U && S.U.causa) S.U.causa(n); }
function anima(S, x) { if (S.U && S.U.anima) S.U.anima(x); }
function cansa(S, dt, x) { if (S.U && S.U.cansa) S.U.cansa(dt, x); }
const cansancioDe = S => (S.U && typeof S.U.cansancio === 'number' ? S.U.cansancio : 0);
function caeRival(S, h) {
  if (!h.vivo) return; if (M(S).caeRival) { M(S).caeRival(h); if (!h.vivo) return; }
  h.vivo = false; h.muere = tiempoDe(S); if (S.R && S.R.baja) S.R.baja(1); avisa(S, 'cae', { h, quien: 'rival' });
}
function entra(S, h, por) { if (M(S).entra) M(S).entra(h, por); else { h.est = 'dentro'; avisa(S, 'dentro', { h, por }); } }
function declaraFlanco(S, lado, hombres, aviso) {
  if (M(S).flanco) M(S).flanco(lado, hombres, aviso.t);
  else { S.flanco = { lado, hombres, t0: tiempoDe(S), tI: tiempoDe(S) + aviso.t, estado: 'viene' }; avisa(S, 'flanco', { lado, hombres }); }
  avisa(S, 'rumbo', { lado, ...aviso });
}
function estadoFlanco(S, estado) { if (M(S).resuelveFlanco) M(S).resuelveFlanco(estado); else if (S.flanco) S.flanco.estado = estado; }
function quitaFlanco(S) { if (!M(S).resuelveFlanco) S.flanco = null; }
/* la salva: por proyectiles del motor si existen (él decide si los para un asta alzada); si no, devuelve false */
function salvaMotor(S, desde, n) {
  if (!M(S).proyectil || !Array.isArray(S.fal)) return false;
  const vivos = S.fal.filter(h => h.vivo); if (!vivos.length) return true;
  for (let k = 0; k < n; k++) M(S).proyectil(desde[k % desde.length], vivos[Math.floor(S.riv.azar() * vivos.length) % vivos.length], 1.2);
  return true;
}
function unidadRival(S, hombres, nombre) {
  if (M(S).unidad) return M(S).unidad({ hombres, nombre });
  const u = { nombre, hombres, enPie: hombres, animo: 1, cansancio: 0, roto: false, T: 0,
    baja(n = 1) { u.enPie = Math.max(0, u.enPie - n); }, causa() {}, anima(x) { if (!u.roto) u.animo = Math.min(1, Math.max(0, u.animo + x)); },
    cansa(dt, x) { u.cansancio = Math.min(1, Math.max(0, u.cansancio + dt * x)); }, tic(dt) { u.T += dt; } };
  return u;
}
function sincroniza(S) { const R = S.R, r = S.riv; if (R && !R.roto && R.anima) R.anima(r.animo - R.animo); if (R && r.roto) R.roto = true; }
function decide(S, ganador, porque) {
  if (S.ganador) return;
  if (motorCompleto(S)) { const u = ganador === 'falange' ? S.R : S.U; if (u) { u.roto = true; u.animo = 0; } S.causa = porque; return; }
  S.ganador = ganador; S.causa = porque; avisa(S, 'rompe', { ganador, causa: porque });
}
const rotaFalange = S => !!(S.U && S.U.roto) || cohDe(S) <= 0;
/* ---------- fin del puente ---------- */

/* ---------- Constantes de ajuste (licencia de juego) ---------- */
export const PULSO = 1.6;                 /* compás del muro (s), como js/falange.js */
export const GRADO = Math.PI / 180;
export const ENCARA = 25 * GRADO;         /* sin motor: el muro encara a quien llega si está a ±25° de su frente */
export const COLUMNA = 8;                 /* hombres de una columna (fondo de la sintagma de 96) */
export const ALCANCE = 4.35;              /* cuánto salen las puntas por delante de la primera fila (m) */
export const CUERPO = 3.3;                /* del pivote al centro del cuerpo del muro, hacia atrás (m) */
/* caballería */
export const CAB_RUMBOS = [60, 90, 150];  /* rumbo de cada pasada respecto a tu frente (grados); desde la 3.ª, espalda */
export const CAB_AVISOS = [8, 11, 17];    /* segundos de aviso de cada pasada */
export const CAB_FINTA = 0.3;             /* desde la 2.ª pasada, parte de las pasadas son finta */
export const CAB_TERRENO = 0.7;           /* con terreno roto a un lado, estas pasadas van por el otro */
export const CAB_FORMA = 3;               /* segundos antes de la primera pasada */
export const CAB_RADIO = 45;              /* distancia al centro del muro a la que se reagrupan (m) */
export const CAB_FONDO = 3;               /* hasta dónde apuntan al llegar (m del centro del muro): tocan lo que encuentren antes */
export const CAB_VUELVE = 6;              /* segundos que tardan en reagruparse */
export const CAB_ENTRA_DURA = 4;          /* segundos que pasan dentro del muro */
export const CAB_FRENA_ANIMO = 0.25;      /* ánimo que pierde el ala cuando se frena contra las puntas */
export const CAB_CIERRA_ANIMO = 0.15;     /* ánimo que pierde cuando la espalda la para «Cerrar filas» */
export const CAB_ENTRA_ANIMO = 0.05;      /* ánimo que gana el ala cuando entra */
export const CAB_ROMPE = 0.2;             /* con este ánimo o menos, el ala rompe */
export const CAB_COH = { flanco: 45, espalda: 70 };   /* cohesión que se hunde al entrar; «Cerrar filas»: flanco a la mitad */
export const CAB_ESPALDA_CERRADA = 20;    /* espalda con «Cerrar filas»: las de atrás dan media vuelta; cae 1 jinete de cada 8 */
export const CAB_MUERTOS = { flanco: 6, espalda: 10 }; /* hombres que matan al entrar (mitad con «Cerrar filas») */
/* elefantes */
export const ELE_ESCOLTA = 16;            /* tiradores de escolta */
export const ELE_FORMA = 10;              /* segundos hasta la primera salva */
export const ELE_ESPERA = 6;              /* segundos entre que están listas y la salva */
export const ELE_SALVA_AVISO = 3;         /* segundos de aviso de la salva */
export const ELE_SALVA_PARA = 0.6;        /* sin motor: con las filas alzadas, la salva se para estas veces */
export const ELE_SALVA_MUERTOS = 4;       /* muertos (o proyectiles) de una salva entera */
export const ELE_SALVA_CANSA = 0.06;      /* cansancio de una salva con las filas bajadas */
export const ELE_PAUSA = 2;               /* segundos entre la salva y el barrito */
export const ELE_BARRITO = 4;             /* segundos de aviso del barrito (carga) */
export const ELE_VUELVE = [10, 14];       /* la espantada vuelve a los 10-14 s */
export const ELE_DESBOCA = 1 / 3;         /* espantadas que se desbocan y no vuelven */
export const ELE_ESPANTA_ANIMO = 0.06;    /* ánimo del rival por cada espantada (y 2 de escolta atropellados) */
export const ELE_DESBOCA_ANIMO = 0.1;     /* ánimo extra por cada desbocada */
export const ELE_PARA_MUERTOS = 3;        /* con 3 filas bajadas la paras, con estas bajas */
export const ELE_HUECO_COH = 30;          /* cohesión que se pierde al abrirse un hueco */
export const ELE_CUELA = { coh: 4, bajas: 0.6 }; /* por segundo, mientras la escolta se cuela por el hueco */
export const ELE_ROMPE = 0.15;            /* con este ánimo o menos, el rival rompe */
export const ELE_ESTOCADA = 0.5;          /* tu estocada vale si es de hace menos de esto al chocar (s) */
/* empuje (falange rival y hoplitas) */
export const EMP_META = 10;               /* metros que se ganan (o se pierden) para acabar */
export const EMP_METROS = 0.7;            /* metros por unidad de diferencia de fuerza en un latido */
export const EMP_COH = 5;                 /* cohesión que cede el perdedor por unidad de diferencia */
export const EMP_FUERZA = { empuje: 0.8, prepara: 0.8, oleada: 1.35, gastado: 0.4 }; /* fuerza del rival en cada fase */
export const EMP_FALLO = 0.4;             /* fuerza de un empuje a destiempo */
export const EMP_FALLA_RIVAL = { falange: 0.1, hoplitas: 0 }; /* latidos en que el rival pierde el compás */
export const EMP_HOPL_PICAS = 1;          /* cohesión hoplita por latido con 4-5 filas bajadas (lanza corta) */
export const EMP_HOPL_DEBAJO = 1.5;       /* con menos de 3 filas bajadas, el hoplita se mete bajo las puntas y pesa esto */
export const EMP_MUERTOS = 0.8;         /* falangitas que caen por unidad de diferencia cuando el muro cede */
export const EMP_OLEADA = 3, EMP_GASTADO = 2; /* latidos de oleada y de cansancio después */

const NOMBRES = ['caballeria', 'elefantes', 'falange', 'hoplitas'];
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
const suave = u => { const t = Math.min(1, Math.max(0, u)); return t * t * (3 - 2 * t); };
/* centro del cuerpo del muro, en el mundo */
const centro = S => { const p = pivote(S), g = giroDe(S); return { x: p.x - Math.sin(g) * CUERPO, z: p.z + Math.cos(g) * CUERPO }; };
/* punto del mundo a la vista del muro: delante (m por delante del pivote) y lado (m a su derecha) */
/* FA4 (nota del usuario, 23/11: «si giro me siguen los enemigos»): elefantes y muros rivales no giran con tu muro. Se colocan en el
   eje del campo (giro 0) por delante de tu pivote; si tú giras, te llegan de lado. La regla ya medía «encarada» con |giro| ≤ ENCARA. */
const enCampo = (S, delante, lado) => { const p = pivote(S); return { x: p.x + lado, z: p.z - delante }; };
const enMuro = (S, delante, lado) => { const p = pivote(S), g = giroDe(S); return { x: p.x + Math.sin(g) * delante + Math.cos(g) * lado, z: p.z - Math.cos(g) * delante + Math.sin(g) * lado }; };

/* Variedad de una partida (con el pivote en el origen y el muro mirando a -z): qué rival, por qué lado llega el primer flanco
   (-1 izquierda, 1 derecha), el trozo roto { x, z, r } o null, y la fuerza (0-1): cuántos jinetes (10-14) o bestias (3-5). */
export function variedad(azar) {
  const rival = NOMBRES[Math.floor(azar() * 4) % 4], lado = azar() < 0.5 ? -1 : 1, t = Math.floor(azar() * 3) % 3 - 1;
  return { rival, lado, terreno: t === 0 ? null : { x: t * 8, z: 2, r: 3 }, fuerza: azar() };
}
export function rivalDe(nombre) { return RIVALES[nombre] || null; }
function base(S, azar, nombre) {
  const az = azar || (M(S).azar ? () => M(S).azar() : null);
  const riv = { tipo: nombre, fase: 'forma', T: 0, animo: 1, roto: false, hombres: [], bestias: [], linea: 0, azar: az, causa: 'bajas', avisa: S.riv && S.riv.avisa };
  S.riv = riv; return riv;
}
const variedadDe = (S, riv) => S.variedad || variedad(riv.azar);
function hombre(i, tipo, est) { return { i, x: 0, z: 0, yaw: 0, vivo: true, muere: 0, est, tipo, toca: null, contacto: -1, res: null }; }
function rompe(S, riv, porque) { if (riv.roto) return; riv.roto = true; riv.fase = 'huye'; sincroniza(S); for (const h of S.ene) if (h.vivo) h.est = 'huye'; decide(S, 'falange', porque); }
function mira(S, riv) { sincroniza(S); if (!S.ganador && !motorCompleto(S) && rotaFalange(S)) decide(S, 'rival', riv.causa); }

/* ================= CABALLERÍA: busca flanco y espalda ================= */
const caballeria = {
  nombre: 'caballeria',
  crea(S, azar) {
    const riv = base(S, azar, 'caballeria'), v = variedadDe(S, riv), n = 10 + Math.min(4, Math.floor(v.fuerza * 5));
    Object.assign(riv, { n0: n, lado1: v.lado, ang: 0, pasada: 0, p: null, tFase: 0 });
    for (let i = 0; i < n; i++) { const h = hombre(i, 'jinete', 'forma'); h.off = (i - (n - 1) / 2) * 1.8; riv.hombres.push(h); }
    S.ene = riv.hombres.slice(); S.R = unidadRival(S, n, 'Ala de jinetes');
    colocaJinetes(S, riv, 0, CAB_RADIO, false);
  },
  paso(S, dt) {
    const riv = S.riv; if (!riv || S.ganador) return; riv.T += dt; const T = riv.T, p = riv.p;
    if (S.R && S.R.tic) S.R.tic(dt);
    if (riv.roto) return;
    if (riv.fase === 'forma') { if (T >= CAB_FORMA) nuevaPasada(S, riv); }
    else if (riv.fase === 'rodea') {
      if (p.finta && !p.fintaHecha && T >= (p.tIni + p.tl) / 2) {
        p.fintaHecha = true; p.lado = -p.lado; p.a0 = riv.ang; p.t0 = T; p.a = p.gBase + p.lado * p.rumbo;
        if (S.flanco) S.flanco.lado = p.lado; avisa(S, 'finta', { lado: p.lado, angulo: p.a, t: p.tl - T });
      }
      riv.ang = p.a0 + angDif(p.a, p.a0) * suave((T - p.t0) / Math.max(0.01, p.tl - p.t0));
      colocaJinetes(S, riv, riv.ang, CAB_FONDO + (CAB_RADIO - CAB_FONDO) * (1 - suave((T - p.tIni) / (p.tl - p.tIni))), false);
      if (T >= p.tl) {
        /* a la llegada, los que el motor no vio tocar (o todos, si no hay motor que llame) */
        for (const h of riv.hombres) if (h.vivo && h.contacto !== p.n) caballeria.choque(S, h);
        riv.fase = 'choque'; riv.tFase = T;
      }
    } else if (riv.fase === 'choque') {
      if (T - riv.tFase >= (p.res === 'entra' ? CAB_ENTRA_DURA * (p.cierra ? 0.5 : 1) : 1.5)) {
        quitaFlanco(S); riv.fase = 'vuelve'; riv.tFase = T;
        for (const h of riv.hombres) if (h.vivo) { h.est = 'vuelve'; h.toca = null; }
      }
    } else if (riv.fase === 'vuelve') {
      colocaJinetes(S, riv, riv.ang, CAB_FONDO + (CAB_RADIO - CAB_FONDO) * suave((T - riv.tFase) / CAB_VUELVE), true);
      if (T - riv.tFase >= CAB_VUELVE) nuevaPasada(S, riv);
    }
    const vivos = riv.hombres.filter(h => h.vivo).length;
    if (riv.animo <= CAB_ROMPE || vivos < riv.n0 / 3) rompe(S, riv, 'animo');
    mira(S, riv);
  },
  choque(S, h) {
    const riv = S.riv, p = riv && riv.p; if (!p) return 'frena';
    if (h.contacto === p.n) return h.res;
    if (!p.res) {
      const d = Math.abs(angDif(p.a, giroDe(S)));
      const encara = h.toca ? h.toca === 'puntas' : d <= ENCARA && bajadasDe(S) >= 4;
      const espalda = h.toca ? h.toca === 'espalda' : d >= 120 * GRADO;
      const cierra = ordenDe(S) === 'cerrar';
      if (encara) {
        p.res = 'frena'; p.cada = 4; riv.animo = Math.max(0, riv.animo - CAB_FRENA_ANIMO); anima(S, 0.03);
        causa(S, Math.floor(riv.hombres.filter(x => x.vivo).length / 4)); estadoFlanco(S, 'parado'); avisa(S, 'flancoParado', { lado: p.lado });
      } else if (espalda && cierra) {
        p.res = 'frena'; p.cada = 8; riv.animo = Math.max(0, riv.animo - CAB_CIERRA_ANIMO); cambiaCoh(S, -CAB_ESPALDA_CERRADA);
        causa(S, Math.floor(riv.hombres.filter(x => x.vivo).length / 8)); estadoFlanco(S, 'parado'); avisa(S, 'flancoParado', { lado: p.lado });
      } else {
        p.res = 'entra'; p.por = espalda ? 'espalda' : h.toca && h.toca !== 'puntas' ? h.toca : p.lado > 0 ? 'der' : 'izq';
        const donde = espalda ? 'espalda' : 'flanco', k = cierra ? 0.5 : 1; p.cierra = cierra;
        /* con el motor real, los que entran matan por su cuenta (motor.entra): no se duplican bajas ni cohesión */
        if (!motorCompleto(S)) { cambiaCoh(S, -CAB_COH[donde] * k); bajas(S, Math.round(CAB_MUERTOS[donde] * k), 'flanco'); }
        anima(S, -0.05);
        riv.animo = Math.min(1, riv.animo + CAB_ENTRA_ANIMO); riv.causa = 'flanco';
        estadoFlanco(S, 'dentro'); avisa(S, 'flancoEntra', { lado: p.lado });
      }
    }
    let r = 'entra';
    if (p.res === 'frena') { r = p.k % p.cada === p.cada - 1 ? 'cae' : 'frena'; p.k++; if (r === 'cae') caeRival(S, h); else h.est = 'frena'; }
    else entra(S, h, p.por);
    h.contacto = p.n; h.res = r; return r;
  },
};
function nuevaPasada(S, riv) {
  const az = riv.azar, n = ++riv.pasada, k = Math.min(n, 3) - 1, ter = terrenoLado(S);
  const lado = n === 1 ? riv.lado1 : (ter !== 0 ? (az() < CAB_TERRENO ? -ter : ter) : (az() < 0.5 ? -1 : 1));
  const rumbo = CAB_RUMBOS[k] * GRADO, t = CAB_AVISOS[k], g = giroDe(S), finta = n >= 2 && az() < CAB_FINTA;
  riv.p = { n, lado, rumbo, gBase: g, a: g + lado * rumbo, a0: riv.ang, t0: riv.T, tIni: riv.T, tl: riv.T + t, finta, fintaHecha: false, res: null, k: 0, cada: 4 };
  riv.fase = 'rodea'; riv.tFase = riv.T;
  const vivos = riv.hombres.filter(h => h.vivo); for (const h of vivos) { h.est = 'rodea'; h.toca = null; }
  declaraFlanco(S, lado, vivos, { t, rumbo: CAB_RUMBOS[k], angulo: riv.p.a });
}
/* el ala va en línea, centrada en el ángulo a y a r metros del centro del muro; al llegar se aprieta */
function colocaJinetes(S, riv, a, r, sale) {
  const c = centro(S), aprieta = Math.min(1, Math.max(0.08, (r - CAB_FONDO) / 20));
  for (const h of riv.hombres) {
    if (!h.vivo || (riv.fase === 'rodea' && h.contacto === (riv.p && riv.p.n))) continue;
    const x = c.x + Math.sin(a) * r + Math.cos(a) * h.off * aprieta, z = c.z - Math.cos(a) * r + Math.sin(a) * h.off * aprieta;
    const yaw = sale ? Math.atan2(x - c.x, z - c.z) : Math.atan2(c.x - x, c.z - z);
    h.x = x; h.z = z; h.yaw = yaw;
  }
}

/* ================= ELEFANTES: se espantan o te abren ================= */
const elefantes = {
  nombre: 'elefantes',
  crea(S, azar) {
    const riv = base(S, azar, 'elefantes'), v = variedadDe(S, riv), n = 3 + Math.min(2, Math.floor(v.fuerza * 3));
    Object.assign(riv, { fase: 'espera', tFase: ELE_FORMA - ELE_ESPERA, carga: 0, hueco: false, cuela: 0, n0: n, tl: 0 });
    for (let i = 0; i < n; i++) {
      const h = hombre(i, 'elefante', 'lista'), l = (i - (n - 1) / 2) * 2.2;
      Object.assign(h, { l, d: 40, fuera: false, heridas: 0, vuelveEn: 0, columna: Math.max(0, Math.min(11, Math.round(l / 0.78 + 5.5))) });
      riv.bestias.push(h);
    }
    for (let i = 0; i < ELE_ESCOLTA; i++) { const h = hombre(n + i, 'infante', 'tira'); h.l = (i - (ELE_ESCOLTA - 1) / 2) * 1.2; riv.hombres.push(h); }
    S.ene = riv.bestias.concat(riv.hombres); S.R = unidadRival(S, n + ELE_ESCOLTA, 'Elefantes y escolta');
    colocaEle(S, riv);
  },
  paso(S, dt) {
    const riv = S.riv; if (!riv || S.ganador) return; riv.T += dt; const T = riv.T, az = riv.azar;
    if (S.R && S.R.tic) S.R.tic(dt);
    const enJuego = riv.bestias.filter(b => b.vivo && !b.fuera);
    if (riv.fase === 'espera') {
      if (enJuego.length && enJuego.every(b => b.est === 'lista') && T - riv.tFase >= ELE_ESPERA) {
        riv.fase = 'salva'; riv.tl = T + ELE_SALVA_AVISO; avisa(S, 'salva', { t: ELE_SALVA_AVISO });
      }
    } else if (riv.fase === 'salva' && T >= riv.tl) {
      const b = bajadasDe(S), escolta = riv.hombres.filter(h => h.vivo), m = Math.round(ELE_SALVA_MUERTOS * escolta.length / ELE_ESCOLTA);
      if (!salvaMotor(S, escolta.length ? escolta : riv.bestias, m)) {
        if (b <= 1 && az() < ELE_SALVA_PARA) avisa(S, 'salva_cae', { muertos: 0 });
        else { bajas(S, m, 'bajas'); cambiaCoh(S, -3); avisa(S, 'salva_cae', { muertos: m }); }
      }
      if (b >= 2) cansa(S, 1, ELE_SALVA_CANSA);
      riv.fase = 'pausa'; riv.tl = T + ELE_PAUSA;
    } else if (riv.fase === 'pausa' && T >= riv.tl) {
      riv.fase = 'carga'; riv.tFase = T; riv.tl = T + ELE_BARRITO; riv.carga++; avisa(S, 'barrito', { t: ELE_BARRITO });
      for (const b of enJuego) { b.est = 'carga'; b.toca = null; b.d0 = b.d; }   /* FA4: carga desde donde está, sin salto */
    } else if (riv.fase === 'carga') {
      const u = (T - riv.tFase) / ELE_BARRITO;
      for (const b of enJuego) if (b.est === 'carga' && b.contacto !== riv.carga) { const d0 = b.d0 ?? 40; b.d = d0 - (d0 - 0.5) * Math.min(1, u); }
      if (T >= riv.tl) { for (const b of enJuego) if (b.est === 'carga' && (!llamaChoque(S) || b.contacto !== riv.carga)) elefantes.choque(S, b); riv.fase = 'espera'; riv.tFase = T; }
    }
    for (const b of riv.bestias) {
      if (!b.vivo || b.fuera) continue;
      if (b.est === 'desbocada') { b.d += 7 * dt; if (b.d > 90) b.fuera = true; }
      else if (b.est === 'espantada' || b.est === 'retira') { b.d = Math.min(40, b.d + 5 * dt); if (T >= b.vuelveEn) { b.est = 'lista'; b.toca = null; } }
    }
    if (riv.hueco) {
      if (ordenDe(S) === 'cerrar') { riv.hueco = false; avisa(S, 'cerrado', {}); for (const h of riv.hombres) if (h.est === 'cuela') h.est = 'tira'; }
      else { cambiaCoh(S, -ELE_CUELA.coh * dt); riv.cuela += ELE_CUELA.bajas * dt; if (riv.cuela >= 1) { bajas(S, Math.floor(riv.cuela), 'hueco'); riv.cuela -= Math.floor(riv.cuela); } }
    }
    colocaEle(S, riv);
    if (riv.animo <= ELE_ROMPE || !riv.bestias.some(b => b.vivo && !b.fuera && b.est !== 'desbocada')) rompe(S, riv, 'animo');
    mira(S, riv);
  },
  choque(S, h) {
    const riv = S.riv; if (h.tipo !== 'elefante') return 'para';
    if (h.contacto === riv.carga) return h.res;
    const b = bajadasDe(S), encara = h.toca ? h.toca === 'puntas' : Math.abs(giroDe(S)) <= ENCARA, T = riv.T; let r;
    if (b >= 4 && encara) {
      r = 'espanta'; h.est = 'espantada'; riv.animo = Math.max(0, riv.animo - ELE_ESPANTA_ANIMO); anima(S, 0.02);
      let k = 0; for (const e of riv.hombres) if (e.vivo && k < 2) { caeRival(S, e); e.est = 'pisado'; k++; } causa(S, k + 1);
      const estocada = tiempoDe(S) - estocadaDe(S) <= ELE_ESTOCADA && Math.abs(h.columna - 5) <= 1;
      if (estocada || riv.azar() < ELE_DESBOCA) { h.est = 'desbocada'; riv.animo = Math.max(0, riv.animo - ELE_DESBOCA_ANIMO); }
      else h.vuelveEn = T + ELE_VUELVE[0] + (ELE_VUELVE[1] - ELE_VUELVE[0]) * riv.azar();
      avisa(S, 'espanta', { bestia: h.i, desbocada: h.est === 'desbocada' });
    } else if (b >= 3) {
      r = 'para'; h.est = 'retira'; h.vuelveEn = T + 8; bajas(S, ELE_PARA_MUERTOS, 'bajas'); causa(S, 1); h.heridas++;
      if (h.heridas >= 2) { caeRival(S, h); h.est = 'muerta'; riv.animo = Math.max(0, riv.animo - 0.1); }
    } else {
      r = 'hueco'; h.est = 'retira'; h.vuelveEn = T + 10; bajas(S, COLUMNA, 'hueco'); cambiaCoh(S, -ELE_HUECO_COH); anima(S, -0.03);
      riv.hueco = true; riv.causa = 'hueco'; let k = 0; for (const e of riv.hombres) if (e.vivo && k < 6) { e.est = 'cuela'; k++; }
      avisa(S, 'hueco', { columna: h.columna });
    }
    h.contacto = riv.carga; h.res = r; return r;
  },
};
/* bestias y escolta, a la vista del muro (por delante; d = metros por delante del pivote) */
function colocaEle(S, riv) {
  const g = 0;
  for (const b of riv.bestias) { if (!b.vivo) continue; const q = enCampo(S, b.d, b.l); b.x = q.x; b.z = q.z; b.yaw = (b.est === 'carga' || b.est === 'lista' ? -g : Math.PI - g); }
  for (const h of riv.hombres) { if (!h.vivo) continue; const q = enCampo(S, h.est === 'cuela' ? 0.8 : 46, h.l); h.x = q.x; h.z = q.z; h.yaw = -g; }
}

/* ================= EMPUJE: falange rival y muro hoplita ================= */
function creaEmpuje(nombre) {
  const R = {
    nombre,
    crea(S, azar) {
      const riv = base(S, azar, nombre);
      Object.assign(riv, { fase: 'empuje', cuenta: 4, coh: 100, cans: 0, pendientes: [], prev: null, latido: 0, muertos: 0, contacto: nombre === 'falange' ? 2 * ALCANCE : ALCANCE + 0.3 });
      for (let i = 0; i < 96; i++) { const h = hombre(i, nombre === 'falange' ? 'piquero' : 'infante', 'empuja'); h.f = i % 12; h.r = Math.floor(i / 12); riv.hombres.push(h); }
      S.ene = riv.hombres.slice(); S.R = unidadRival(S, 96, nombre === 'falange' ? 'Falange rival' : 'Muro hoplita');
      coloca(S, riv, 5);
    },
    paso(S, dt) {
      const riv = S.riv; if (!riv || S.ganador) return; riv.T += dt;
      if (S.R && S.R.tic) S.R.tic(dt);
      marcaChoque(S); const pu = pulsoDe(S), Tn = tiempoDe(S);
      if (pu !== null) { if (riv.prev !== null && pu < riv.prev - 0.5) riv.pendientes.push({ bT: Tn - pu * PULSO, contacto: null, res: null }); riv.prev = pu; }
      while (riv.pendientes.length && Tn >= riv.pendientes[0].bT + 0.3 && !S.ganador) R.choque(S, riv.pendientes.shift());
      if (!riv.roto) coloca(S, riv, bajadasDe(S));
      mira(S, riv);
    },
    choque(S, h) {
      const riv = S.riv;
      if (h.tipo) { if (h.contacto !== 'cuerpo') { h.contacto = 'cuerpo'; h.res = 'para'; } return h.res; } /* un hombre que toca: el empuje va por latidos */
      if (h.contacto === 'latido') return h.res;
      const b = bajadasDe(S), o = ordenDe(S), acierto = aciertoLatido(S, h.bT);
      const mia = (acierto ? 1 : EMP_FALLO) * (cohDe(S) / 100) * (1 - 0.4 * cansancioDe(S)) * (0.5 + 0.1 * b) * (o === 'aguantar' ? 0.9 : o === 'empujar' || o === 'empujad' ? 1 : 0.7);
      const empuja = o === 'empujar' || o === 'empujad';
      /* con el motor real los metros hacia delante los da su toque (PASO_HA, PASO_EMPUJE) y su META manda; aquí solo lo que cede el muro */
      let suya = EMP_FUERZA[riv.fase] * (riv.coh / 100) * (1 - 0.4 * riv.cans);
      if (riv.azar() < EMP_FALLA_RIVAL[nombre]) suya *= EMP_FALLO;
      if (nombre === 'hoplitas') { if (b < 3) suya *= EMP_HOPL_DEBAJO; if (b >= 4) riv.coh -= EMP_HOPL_PICAS; }
      const d = mia - suya; let r;
      if (d >= 0) {
        if (empuja) { if (!mandaMeta(S)) metros(S, riv, EMP_METROS * d); riv.coh -= EMP_COH * d; r = 'frena'; } else { riv.coh -= 3 * d; r = 'para'; }
      } else if (o === 'aguantar' && acierto) { cambiaCoh(S, 2 * d); r = 'para'; }
      else { metros(S, riv, EMP_METROS * d); cambiaCoh(S, EMP_COH * d); riv.muertos -= EMP_MUERTOS * d; riv.causa = 'empuje'; r = 'entra'; }
      if (riv.muertos >= 1) { bajas(S, Math.floor(riv.muertos), 'empuje'); riv.muertos -= Math.floor(riv.muertos); }
      riv.cans = Math.max(0, Math.min(1, riv.cans + (riv.fase === 'oleada' ? 0.03 : riv.fase === 'gastado' ? -0.04 : 0.005)));
      riv.coh = Math.max(0, Math.min(100, riv.coh)); riv.animo = riv.coh / 100; riv.latido++;
      const vivos = riv.hombres.filter(x => x.vivo), quedan = Math.round(96 * (0.5 + 0.5 * riv.coh / 100));
      for (let k = vivos.length - 1; k >= quedan && k >= 0; k--) { caeRival(S, vivos[k]); vivos[k].est = 'cae'; causa(S, 1); }
      if (--riv.cuenta <= 0) {
        const sig = { empuje: 'prepara', prepara: 'oleada', oleada: 'gastado', gastado: 'empuje' }[riv.fase];
        riv.fase = sig; riv.cuenta = sig === 'prepara' ? 1 : sig === 'oleada' ? EMP_OLEADA : sig === 'gastado' ? EMP_GASTADO : 2 + Math.floor(riv.azar() * 2);
        if (sig === 'prepara') avisa(S, 'oleada', { latidos: EMP_OLEADA, t: PULSO });
        if (sig === 'gastado') avisa(S, 'gastado', { latidos: EMP_GASTADO });
      }
      if (!mandaMeta(S) && riv.linea >= EMP_META) rompe(S, riv, 'empuje');
      else if (riv.coh <= 0) rompe(S, riv, 'animo');
      else if (!mandaMeta(S) && riv.linea <= -EMP_META) decide(S, 'rival', 'empuje');
      h.contacto = 'latido'; h.res = r; return r;
    },
  };
  /* filas del rival delante del muro; la línea (S.riv.linea) no las mueve: eso lo decide quien dibuja */
  function coloca(S, riv, b) {
    const z0 = nombre === 'hoplitas' && b < 3 ? 1.5 : riv.contacto /* el hoplita se queda a la punta de las sarisas; con menos de 3 filas se mete debajo */, g = 0;
    const clave = z0 + '|' + g + '|' + pivote(S).x + '|' + pivote(S).z + '|' + riv.hombres.filter(h => h.vivo).length; if (riv.clave === clave) return; riv.clave = clave;
    for (const h of riv.hombres) { if (!h.vivo) continue; const q = enCampo(S, z0 + h.r * 0.95, (h.f - 5.5) * 0.78); h.x = q.x; h.z = q.z; h.yaw = -g; }
  }
  return R;
}

export const RIVALES = { caballeria, elefantes, falange: creaEmpuje('falange'), hoplitas: creaEmpuje('hoplitas') };
