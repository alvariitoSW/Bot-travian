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
   FE1 (24/11): los elefantes ya no se espantan por las filas bajadas: embisten, rompen picas, alguno se ensarta, y se lucha hasta el 15 %.
   Elefantes heridos que se desbocan contra los suyos: histórico (Benevento 275, Plutarco, Pirro 25; Metauro 207, Polibio 11.1).
   Sarisas que hieren a la bestia: histórico (Hidaspes 326, Arriano 5.17, antes de la época). Picas que se parten y bestias
   ensartadas: probable. Luchar hasta el 15 % y todas las cifras: licencia de juego. Ficha: gobierno/historia/FE1-elefantes-contra-picas.md.
   Licencia de juego: el compás, las oleadas, las fintas, los segundos de aviso y todas las cifras de este archivo. */

import { FIN_LUCHA, crearUnidad, sigueMuro } from './falange.js';   /* FU4: la unidad con fin y el ancla que sigue tu muro (modo vivo) */   /* FE1: la regla del 15 % es una sola, la del motor */
export { FIN_LUCHA };

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
/* FU4 (A1 midió que en vivo el bot bueno siempre pierde): solo en vivo, contra las puntas cae 1 de cada `cada`, de los que entran
   cae 1 de cada `caeEntra` (le reciben las espadas) y pasan dentro `dura` veces el tiempo. Licencia de juego */
export const CAB_VIVO = { cada: 3, caeEntra: 3, dura: 0.6 };
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
/* FE1: la lucha contra las picas (licencia de juego: todas las cifras) */
export const ELE_VIDA = 30;               /* heridas que aguanta una bestia */
export const ELE_ACIERTA = 0.75;          /* cada pica bajada que la alcanza da con esta tirada */
export const ELE_HIERE_1 = 0.8, ELE_HIERE = 0.5; /* herida de la pica de la 1.ª fila y de las de detrás, a la carrera */
export const ELE_ENSARTA_PICAS = 11, ELE_ENSARTA = 0.4; /* con 11 picas o más a la carrera, 4 de cada 10 se quedan ensartadas */
export const ELE_ROMPE_PICA = [0.4, 0.22, 0.15, 0.1, 0.08]; /* que la pica de cada fila se parta en el impacto (la de delante, más) */
export const ELE_CLAVA_TROZO = 0.5;       /* puntas rotas que se quedan clavadas en la bestia (el resto, al suelo) */
export const ELE_AGONIA = 7;              /* segundos que tarda en caer la ensartada */
export const ELE_AGONIA_MUERTOS = 2;      /* hombres que aplasta en su agonía */
export const ELE_PARA_PICAS = 6;          /* con estas picas o más en el impacto, no pisa a nadie al llegar */
export const ELE_HONDO = 2.2;             /* hasta dónde se mete (m por delante de tu primera fila) */
export const ELE_EMPUJA = 0.9;            /* m/s que se mete sin picas delante */
export const ELE_HIERE_CERCA = 0.3;       /* por segundo: los de cerca (picas rotas, espadas, la contera) la hieren aunque no queden picas */
export const ELE_ESTOCADA = 1;            /* tu estocada a una bestia de tus columnas */
export const ELE_HIERE_LUCHA = 0.06;      /* herida por segundo de cada pica que le queda delante */
export const ELE_ROMPE_LUCHA = 0.012;     /* por segundo, cada pica que le queda delante puede partirse */
export const ELE_MATA = 0.5;              /* hombres por segundo que pisa sin picas delante (menos cuantas más quedan) */
export const ELE_HUECO_PICAS = 2;         /* con estas picas o menos delante, abre un hueco */
export const ELE_DESBOCA_VIDA = 0.4, ELE_DESBOCA = 0.3; /* muy herida (40 % de vida), 3 de cada 10 se desbocan contra los suyos */
export const ELE_DESBOCA_ANIMO = 0.1;     /* ánimo extra del rival por cada desbocada */
export const ELE_HUECO_COH = 25;          /* cohesión que se pierde al abrirse un hueco */
export const ELE_CUELA = { coh: 4, bajas: 0.6 }; /* por segundo, mientras la escolta se cuela por el hueco */
/* FU4 (usuario, 24/11: «los elefantes se atraviesan y deberían ser más duros y realistas, romper algunas picas y ser el enemigo más
   duro del juego»). Solo en vivo. Licencia de juego: todas las cifras. Bestias y escolta andan por el mundo (x, z, yaw propios). */
export const ELE_VIVO = {
  bestias: 6, ola: 3, escolta: 40,        /* 6 bestias en oleadas de 3; 40 de escolta que al final cargan y luchan */
  lados: [-3.3, 0, 3.3],                  /* puesto de cada bestia de la oleada (m a la derecha de tu pivote) */
  vida: 1.5, pisa: 2, pisaPara: 1,        /* vida ×1,5; al embestir pisa 2 (1 si la paran las picas) */
  rompe: 1.5, rompeLucha: 2,              /* picas rotas ×1,5 en el impacto y ×2 en la lucha */
  mata: 0.45, ensarta: 0.25,              /* por segundo en la lucha, × (1 − picas/15); se ensartan menos */
  vCarga: 8, acel: 2.2, giro: 40 * GRADO, /* carga: hasta 8 m/s, giro tope 40°/s */
  vVuelve: 1, giroVuelve: 30 * GRADO,     /* fuera de tu frente, vuelve a apretarte despacio */
  vAtras: 2.5, vDesboca: 7,               /* recula si tu muro se le echa encima; desbocada */
  sepBestias: 3, sepHombre: 1.65,         /* de centro a centro: entre bestias y de bestia a falangita */
  vEscolta: 3,                            /* la escolta, a la carrera */
  hiereCerca: 0.7,                       /* por segundo: en vivo, espadas y trozos de pica la hieren más (si no, aguanta sin fin) */
  cuelan: 3,                              /* los de la escolta que se cuelan por cada hueco */
  cuela: 0.5,                             /* × ELE_CUELA.bajas: los que se cuelan ya luchan ellos mismos (lucha() del motor) */
};
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

const FILES = 12;
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
    const riv = base(S, azar, 'caballeria'), v = variedadDe(S, riv), n0 = 10 + Math.min(4, Math.floor(v.fuerza * 5)), n = S.vivo ? Math.round(n0 * 1.5) : n0;   /* FU4: en vivo, ×1,5 */
    Object.assign(riv, { n0: n, lado1: v.lado, ang: 0, pasada: 0, p: null, tFase: 0 });
    for (let i = 0; i < n; i++) { const h = hombre(i, 'jinete', 'forma'); h.off = (i - (n - 1) / 2) * 1.8; riv.hombres.push(h); }
    S.ene = riv.hombres.slice(); S.R = S.vivo ? crearUnidad({ hombres: n, nombre: 'Ala de jinetes', ref: n, fin: FIN_LUCHA, miedo: false }) : unidadRival(S, n, 'Ala de jinetes');
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
      if (T - riv.tFase >= (p.res === 'entra' ? CAB_ENTRA_DURA * (p.cierra ? 0.5 : 1) * (S.vivo ? CAB_VIVO.dura : 1) : 1.5)) {   /* FU4: en vivo, menos tiempo dentro */
        quitaFlanco(S); riv.fase = 'vuelve'; riv.tFase = T;
        for (const h of riv.hombres) if (h.vivo) { h.est = 'vuelve'; h.toca = null; }
      }
    } else if (riv.fase === 'vuelve') {
      colocaJinetes(S, riv, riv.ang, CAB_FONDO + (CAB_RADIO - CAB_FONDO) * suave((T - riv.tFase) / CAB_VUELVE), true);
      if (T - riv.tFase >= CAB_VUELVE) nuevaPasada(S, riv);
    }
    const vivos = riv.hombres.filter(h => h.vivo).length;
    if (!S.vivo && (riv.animo <= CAB_ROMPE || vivos < riv.n0 / 3)) rompe(S, riv, 'animo');   /* FU4: en vivo rompe su unidad, al 15 % */
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
        p.res = 'frena'; p.cada = S.vivo ? CAB_VIVO.cada : 4; riv.animo = Math.max(0, riv.animo - CAB_FRENA_ANIMO); anima(S, 0.03);
        causa(S, Math.floor(riv.hombres.filter(x => x.vivo).length / 4)); estadoFlanco(S, 'parado'); avisa(S, 'flancoParado', { lado: p.lado });
      } else if (espalda && cierra) {
        p.res = 'frena'; p.cada = 8; riv.animo = Math.max(0, riv.animo - CAB_CIERRA_ANIMO); cambiaCoh(S, -CAB_ESPALDA_CERRADA);
        causa(S, Math.floor(riv.hombres.filter(x => x.vivo).length / 8)); estadoFlanco(S, 'parado'); avisa(S, 'flancoParado', { lado: p.lado });
      } else {
        p.res = 'entra'; p.por = espalda ? 'espalda' : h.toca && h.toca !== 'puntas' ? h.toca : p.lado > 0 ? 'der' : 'izq';
        const donde = espalda ? 'espalda' : 'flanco', k = cierra ? 0.5 : 1; p.cierra = cierra;
        /* con el motor real, los que entran matan por su cuenta (motor.entra): no se duplican bajas ni cohesión */
        if (!motorCompleto(S)) { cambiaCoh(S, -CAB_COH[donde] * k); bajas(S, Math.round(CAB_MUERTOS[donde] * k), 'flanco'); }
        if (!S.vivo) anima(S, -0.05);   /* FU4: en vivo, sin miedo */
        riv.animo = Math.min(1, riv.animo + CAB_ENTRA_ANIMO); riv.causa = 'flanco';
        estadoFlanco(S, 'dentro'); avisa(S, 'flancoEntra', { lado: p.lado });
      }
    }
    let r = 'entra';
    if (p.res === 'frena') { r = p.k % p.cada === p.cada - 1 ? 'cae' : 'frena'; p.k++; if (r === 'cae') caeRival(S, h); else h.est = 'frena'; }
    else if (S.vivo && p.k++ % CAB_VIVO.caeEntra === CAB_VIVO.caeEntra - 1) { r = 'cae'; caeRival(S, h); }   /* FU4 */
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

/* ================= ELEFANTES: embisten, rompen picas y luchan (FE1) ================= */
/* FE1 (usuario, 24/11: «llegan, tocan las lanzas y huyen, cuando deberían romperlas y alguno clavarse en el elefante»).
   Ya no se espantan por ver las filas bajadas. Cada carga:
   1. EL IMPACTO (choque): las picas bajadas de las tres columnas que cubre la bestia le dan, cada una con su tirada. Cada pica que
      da hiere y puede ROMPERSE (más la de delante, que recibe el golpe): su hombre queda con el trozo (h.picaRota) y esa pica deja
      de contar en las cargas siguientes. Parte de las puntas rotas se quedan clavadas en la bestia (S.riv.trozos).
   2. ENSARTADA: si las heridas del impacto pasan de su vida, se queda clavada en las puntas, sin avanzar; aplasta a alguno en su
      agonía y cae despacio (est 'ensartada', luego muerta).
   3. LUCHA: si aguanta, empuja contra el muro unos segundos: pisa a los de sus columnas (más cuantas menos picas le quedan delante),
      las picas le siguen hiriendo y rompiéndose, y si ya no queda casi ninguna abre un HUECO por el que se cuela la escolta.
      No recula: lucha hasta caer. Muy herida, puede DESBOCARSE contra los suyos (Benevento) y salir de la lucha.
   4. EL FINAL (regla del 15 %, FIN_LUCHA): el rival rompe cuando le queda el 15 % de su manada en lucha; tu muro, cuando le queda el
      15 % de sus hombres o se le acaba la cohesión (reglas de js/falange.js). Nadie huye antes por miedo. */
function columnasDe(S, b) { const c = []; for (let k = -1; k <= 1; k++) { const f = b.columna + k; if (f >= 0 && f < FILES) c.push(f); } return c; }
/* las picas que alcanzan a la bestia: en cada columna, los cinco primeros vivos (por su fila), con su fila bajada y la pica entera */
function picasContra(S, b) {
  const out = [], filas = Array.isArray(S.filas) ? S.filas : [true, true, true, true, true];
  if (!Array.isArray(S.fal)) return out;
  for (const f of columnasDe(S, b)) {
    const col = S.fal.filter(h => h.vivo && !h.huye && h.f === f).sort((a, c) => a.r - c.r);
    for (let k = 0; k < Math.min(5, col.length); k++) if (filas[k] && !col[k].picaRota) out.push({ h: col[k], k });
  }
  return out;
}
/* mata a n de las columnas de la bestia, de delante atrás (con el motor: a esos hombres; sin él, n bajas sin nombre) */
function pisa(S, b, n, por) {
  if (n <= 0) return 0;
  if (!M(S).caeFalangita || !Array.isArray(S.fal)) { bajas(S, n, por); return n; }
  const cols = columnasDe(S, b), L = S.fal.filter(h => h.vivo && !h.huye && cols.includes(h.f)).sort((a, c) => a.r - c.r || Math.abs(a.f - b.columna) - Math.abs(c.f - b.columna));
  let k = 0; for (const h of L) { if (k >= n) break; M(S).caeFalangita(h, por); k++; }
  if (k < n) bajas(S, n - k, por);
  return n;
}
/* una pica se parte: el hombre se queda con el trozo; la punta cae al suelo o se queda clavada en la bestia */
function rompePica(S, riv, b, p) {
  const h = p.h; h.picaRota = true; h.tRota = tiempoDe(S); riv.rotas++;
  const clavada = riv.azar() < ELE_CLAVA_TROZO, l = (h.f - (FILES - 1) / 2) * 0.78;
  const q = (S.vivo ? enMuro : enCampo)(S, b.d - 1.6 - riv.azar() * 1.2, l + (riv.azar() - 0.5) * 0.5);   /* FU4: en vivo, con los ejes de tu muro de ahora: queda fijo en el mundo */
  riv.trozos.push({ i: riv.trozos.length, hombre: h.i, f: h.f, k: p.k, bestia: clavada ? b.i : -1, x: q.x, z: q.z, yaw: (S.vivo ? -giroDe(S) : 0) + Math.PI + (riv.azar() - 0.5) * 1.2,
    alto: 1.2 + riv.azar() * 1.1, lado: (riv.azar() - 0.5) * 1.4, t: tiempoDe(S) });
  avisa(S, 'picaRota', { h, bestia: b.i, clavada, fila: p.k });
}
function hiereEle(S, riv, b, x) { b.vida -= x; b.heridas += x; }
const enLucha = b => b.vivo && !b.fuera && !b.desbocada;
const finManada = riv => Math.floor(riv.n0 * FIN_LUCHA + 1e-9);
const elefantes = {
  nombre: 'elefantes',
  crea(S, azar) {
    const riv = base(S, azar, 'elefantes'), v = variedadDe(S, riv), V = ELE_VIVO, n = S.vivo ? V.bestias : 3 + Math.min(2, Math.floor(v.fuerza * 3)), nE = S.vivo ? V.escolta : ELE_ESCOLTA;
    Object.assign(riv, { fase: 'espera', tFase: ELE_FORMA - ELE_ESPERA, carga: 0, hueco: false, cuela: 0, n0: n, tl: 0, trozos: [], rotas: 0, ensartadas: 0 });
    if (S.vivo) Object.assign(riv, { vivo: true, ola: 0, olas: Math.ceil(n / V.ola), escCarga: false, nE });   /* FU4 */
    for (let i = 0; i < n; i++) {
      const h = hombre(i, 'elefante', 'lista'), l = S.vivo ? V.lados[i % V.ola] : (i - (n - 1) / 2) * 2.2;
      Object.assign(h, { l, l0: l, d: 40, fuera: false, heridas: 0, vida: ELE_VIDA, columna: columnaDe(l), tPisa: 0, dio: 0 });
      /* FU4: en vivo cada bestia está en el mundo (no se recoloca con tu pivote): la 2.ª oleada espera 7 m detrás */
      if (S.vivo) { const ola = Math.floor(i / V.ola), q = enCampo(S, 40 + ola * 7, l); Object.assign(h, { ola, d: 40 + ola * 7, vida: ELE_VIDA * V.vida, x: q.x, z: q.z, yaw: -giroDe(S), v: 0, lObj: l, cargaN: 0 }); }
      riv.bestias.push(h);
    }
    for (let i = 0; i < nE; i++) {
      const h = hombre(n + i, 'infante', 'tira'); h.l = (i - (ELE_ESCOLTA - 1) / 2) * 1.2;
      if (S.vivo) { h.f = i % FILES; h.l = (h.f - (FILES - 1) / 2) * 0.9; const q = enCampo(S, 54 + Math.floor(i / FILES) * 1.2, h.l); Object.assign(h, { x: q.x, z: q.z, x0: q.x, z0: q.z, yaw: -giroDe(S) }); }
      riv.hombres.push(h);
    }
    S.ene = riv.bestias.concat(riv.hombres); S.R = unidadRival(S, n + nE, 'Elefantes y escolta');
    /* FE1: regla del 15 % en los dos bandos; el rival rompe por su manada (abajo), no por las bajas de su unidad */
    if (S.U) { S.U.fin = FIN_LUCHA; S.U.miedo = false; }
    if (S.R) { S.R.fin = 0; S.R.miedo = false; }
    if (!S.vivo) colocaEle(S, riv);
  },
  paso(S, dt) {
    const riv = S.riv; if (!riv || S.ganador) return; riv.T += dt; const T = riv.T, az = riv.azar;
    if (S.R && S.R.tic) S.R.tic(dt);
    if (riv.vivo) { pasoEleVivo(S, riv, dt); return; }   /* FU4 */
    const libres = riv.bestias.filter(b => enLucha(b) && b.est !== 'ensartada');
    if (riv.fase === 'espera') {
      /* la escolta sigue tirando mientras las bestias luchan; carga la que esté lista */
      if (libres.some(b => b.est === 'lista') && libres.every(b => b.est === 'lista' || b.est === 'lucha') && T - riv.tFase >= ELE_ESPERA) {
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
      for (const b of libres) {
        if (b.est !== 'lista') continue;
        /* FA4: carga desde donde está, sin salto. FE1: cada carga busca otro sitio del muro (hasta 1,5 m de su puesto) */
        b.est = 'carga'; b.toca = null; b.d0 = b.d;
        if (riv.carga > 1) { b.l = Math.max(-4.6, Math.min(4.6, b.l0 + (az() - 0.5) * 3)); b.columna = columnaDe(b.l); }
      }
    } else if (riv.fase === 'carga') {
      const u = (T - riv.tFase) / ELE_BARRITO;
      for (const b of libres) if (b.est === 'carga' && b.contacto !== riv.carga) { const d0 = b.d0 ?? 40; b.d = d0 - (d0 - 0.5) * Math.min(1, u); }
      if (T >= riv.tl) { for (const b of libres) if (b.est === 'carga' && (!llamaChoque(S) || b.contacto !== riv.carga)) elefantes.choque(S, b); riv.fase = 'espera'; riv.tFase = T; }
    }
    for (const b of riv.bestias) {
      if (!b.vivo || b.fuera) continue;
      if (b.est === 'ensartada') {
        /* clavada en las puntas: no avanza; en su agonía aplasta a alguno y cae despacio */
        if (b.dio < ELE_AGONIA_MUERTOS && T >= b.tPisa) { pisa(S, b, 1, 'elefante'); b.dio++; b.tPisa = T + ELE_AGONIA / (ELE_AGONIA_MUERTOS + 1); }
        if (T >= b.tMuere) { caeRival(S, b); riv.animo = Math.max(0, riv.animo - 0.1); }
      } else if (b.est === 'lucha') luchaEle(S, riv, b, dt);
      else if (b.est === 'desbocada') { b.d += 7 * dt; if (b.d > 90) b.fuera = true; }
    }
    if (riv.hueco) {
      if (ordenDe(S) === 'cerrar') { riv.hueco = false; avisa(S, 'cerrado', {}); for (const h of riv.hombres) if (h.est === 'cuela') h.est = 'tira'; }
      else { cambiaCoh(S, -ELE_CUELA.coh * dt); riv.cuela += ELE_CUELA.bajas * dt; if (riv.cuela >= 1) { bajas(S, Math.floor(riv.cuela), 'hueco'); riv.cuela -= Math.floor(riv.cuela); } }
    }
    colocaEle(S, riv);
    /* FE1, regla del 15 %: rompe cuando le queda el 15 % de la manada en lucha (con 3 a 5 bestias: ninguna) */
    if (riv.bestias.filter(enLucha).length <= finManada(riv)) { riv.causa = 'bajas'; rompe(S, riv, 'bajas'); }
    mira(S, riv);
  },
  choque(S, h) {
    const riv = S.riv; if (h.tipo !== 'elefante') return 'para';
    const kC = riv.vivo ? h.cargaN : riv.carga;   /* FU4: en vivo, el contacto es de la carga de cada bestia */
    if (h.contacto === kC) return h.res;
    if (!enLucha(h) || h.est === 'ensartada' || (riv.vivo && h.est !== 'carga')) { if (riv.vivo) return h.res || 'para'; h.contacto = kC; h.res = 'para'; return 'para'; }
    const T = riv.T, az = riv.azar, P = picasContra(S, h), vel = h.est === 'carga' ? 1 : 0.5;
    let dano = 0, dan = 0;
    for (const p of P) {
      if (az() >= ELE_ACIERTA) continue; dan++;
      dano += (p.k === 0 ? ELE_HIERE_1 : ELE_HIERE) * vel;
      if (az() < ELE_ROMPE_PICA[p.k] * vel * (riv.vivo ? ELE_VIVO.rompe : 1)) rompePica(S, riv, h, p);
    }
    hiereEle(S, riv, h, dano); causa(S, dan > 0 ? 1 : 0);
    let r;
    if (h.vida <= 0 || (vel === 1 && dan >= ELE_ENSARTA_PICAS && az() < (riv.vivo ? ELE_VIVO.ensarta : ELE_ENSARTA))) {
      /* ensartada: clavada en las puntas que la alcanzaron de frente a la carrera */
      r = 'cae'; h.est = 'ensartada'; h.tMuere = T + ELE_AGONIA; h.tPisa = T + 0.4; h.dio = 0; riv.ensartadas++;
      avisa(S, 'ensarta', { bestia: h.i, picas: dan });
    } else {
      r = dan >= ELE_PARA_PICAS ? 'para' : 'entra';
      h.est = 'lucha'; h.tPisa = T + 0.5; h.yaHueco = false;
      pisa(S, h, riv.vivo ? (dan >= ELE_PARA_PICAS ? ELE_VIVO.pisaPara : ELE_VIVO.pisa) : dan >= ELE_PARA_PICAS ? 0 : 1, 'elefante');
      if (riv.vivo) h.v = r === 'para' ? 0 : 2;   /* FU4: la parada la frena en seco; si entra, aún empuja */
      avisa(S, 'embiste', { bestia: h.i, picas: dan });
    }
    h.contacto = kC; h.res = r; return r;
  },
};
const columnaDe = l => Math.max(0, Math.min(FILES - 1, Math.round(l / 0.78 + (FILES - 1) / 2)));
/* la bestia empuja contra el muro: pisa, la hieren y le rompen picas; si se queda sin picas delante, abre un hueco */
function luchaEle(S, riv, b, dt) {
  if (riv.vivo && !b.enFrente) return;   /* FU4: fuera de tu frente no lucha: anda a volver a apretarte */
  const T = riv.T, az = riv.azar, P = picasContra(S, b), n = P.length;
  if (riv.vivo) b.nPicas = n; else b.d = Math.max(ELE_HONDO, b.d - ELE_EMPUJA * (1 - n / 15) * dt);   /* cuantas menos picas, más se mete (en vivo la mueve pasoEleVivo) */
  hiereEle(S, riv, b, ((riv.vivo ? ELE_VIVO.hiereCerca : ELE_HIERE_CERCA) + n * ELE_HIERE_LUCHA) * dt);
  /* tu estocada, si es en sus columnas (tú estás en la 6.ª), hiere más */
  const tE = estocadaDe(S); if (tE > (b.tEst ?? -1e9) && Math.abs(b.columna - 5) <= 1) { b.tEst = tE; hiereEle(S, riv, b, ELE_ESTOCADA); }
  for (const p of P) if (az() < ELE_ROMPE_LUCHA * dt * (riv.vivo ? ELE_VIVO.rompeLucha : 1)) rompePica(S, riv, b, p);
  if (T >= b.tPisa) { b.tPisa = T + 1; const m = riv.vivo ? ELE_VIVO.mata * (1 - n / 15) : ELE_MATA * (1 - n / 15) * (1 - n / 15); if (az() < m) pisa(S, b, 1, 'elefante'); }
  if (n <= ELE_HUECO_PICAS && !b.yaHueco && !riv.hueco) {
    b.yaHueco = true; cambiaCoh(S, -ELE_HUECO_COH); riv.hueco = true; riv.causa = 'hueco'; riv.huecoL = b.l; riv.huecoB = b;
    let k = 0; for (const e of riv.hombres) if (e.vivo && e.est === (riv.vivo ? 'tira' : e.est) && k < (riv.vivo ? ELE_VIVO.cuelan : 6)) { e.est = 'cuela'; k++; }
    avisa(S, 'hueco', { columna: b.columna });
  }
  if (b.vida <= 0) { caeRival(S, b); b.est = 'muerta'; riv.animo = Math.max(0, riv.animo - 0.1); return; }
  /* muy herida, a veces se desboca y se vuelve contra los suyos (Benevento, 275 a.C.): sale de la lucha */
  if (!b.tiroDesboca && b.vida <= ELE_VIDA * ELE_DESBOCA_VIDA) {
    b.tiroDesboca = true;
    if (az() < ELE_DESBOCA) {
      b.est = 'desbocada'; b.desbocada = true; let k = 0; for (const e of riv.hombres) if (e.vivo && k < 2) { caeRival(S, e); e.est = 'pisado'; k++; }
      riv.animo = Math.max(0, riv.animo - ELE_DESBOCA_ANIMO); avisa(S, 'desboca', { bestia: b.i }); return;
    }
  }
}
/* bestias y escolta, en el eje del campo por delante de tu pivote (d = metros por delante del pivote) */
function colocaEle(S, riv) {
  const g = 0;
  for (const b of riv.bestias) { if (!b.vivo) continue; const q = enCampo(S, b.d, b.l); b.x = q.x; b.z = q.z; b.yaw = (b.est === 'desbocada' ? Math.PI - g : -g); }
  for (const h of riv.hombres) { if (!h.vivo) continue; const q = enCampo(S, h.est === 'cuela' ? 0.8 : 46, h.l); h.x = q.x; h.z = q.z; h.yaw = -g; }
}

/* ---------- FU4 · ELEFANTES EN VIVO: bestias y escolta en el mundo, sin espejo ----------
   Cada bestia tiene x, z, yaw y velocidad propios; no se recoloca con tu pivote. Carga por oleadas de 3 hacia el sitio de su
   columna en tu frente (el punto se recalcula: un animal te apunta), acelerando hasta ELE_VIVO.vCarga, con giro tope. En la lucha
   se queda donde está y empuja hacia tu muro hasta ELE_HONDO delante de tu primera fila; columna y d salen de local(x, z).
   Fuera de tu frente vuelve despacio a apretarte. La escolta carga al final (o se cuela por los huecos) y lucha con lucha() del
   motor. Rompe cuando no le quedan bestias por luchar y su escolta está en el 15 %. Licencia de juego: todas las cifras. */
const frenteDe = S => (M(S).frente ? M(S).frente() : ALCANCE);
const MEDIO = FILES * 0.78 / 2;
const giraHacia = (y, obj, tope) => angDif(y + Math.max(-tope, Math.min(tope, angDif(obj, y))), 0);
/* a la carrera: gira su rumbo hacia el punto con tope y avanza por él */
function corre(b, tx, tz, vmax, giro, dt) {
  b.yaw = giraHacia(b.yaw, Math.atan2(tx - b.x, tz - b.z), giro * dt);
  b.v = Math.min(vmax, (b.v || 0) + ELE_VIVO.acel * dt); b.x += Math.sin(b.yaw) * b.v * dt; b.z += Math.cos(b.yaw) * b.v * dt;
}
/* de paso corto: va al punto (sin pasarse) y mira hacia yawObj con tope */
function arrima(b, tx, tz, v, yawObj, giro, dt) {
  const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz), k = Math.min(d, v * dt);
  if (d > 1e-6) { b.x += dx / d * k; b.z += dz / d * k; }
  b.yaw = giraHacia(b.yaw, yawObj, giro * dt);
}
/* sitio de carga: el puesto de su oleada más libre (a ≥ 3,2 m de las que luchan o agonizan y de las ya elegidas) */
function eligeLado(riv, b, ocupados) {
  const C = [b.l0, -3.3, 0, 3.3, -1.65, 1.65], libre = l => ocupados.every(o => Math.abs(o - l) >= 3.2);
  const l = C.find(libre) ?? b.l0; ocupados.push(l); return l;
}
function mueveBestias(S, riv, dt) {
  const V = ELE_VIVO, g = giroDe(S), Fp = frenteDe(S), p = pivote(S);
  for (const b of riv.bestias) {
    if (!b.vivo || b.fuera) continue;
    let l = local(S, b.x, b.z); b.l = l.lado; b.d = l.delante; b.columna = columnaDe(b.l);
    if (b.est === 'carga') {
      const q = enMuro(S, ELE_HONDO, b.lObj); corre(b, q.x, q.z, V.vCarga, V.giro, dt);
      l = local(S, b.x, b.z); b.l = l.lado; b.d = l.delante; b.columna = columnaDe(b.l);
      /* el impacto: lo llama el motor al llegar a tus puntas; si no (sin puntas o sin motor), al llegar a su sitio */
      if (b.contacto !== b.cargaN && (b.d <= ELE_HONDO + 0.3 || (!llamaChoque(S) && Fp > 0 && b.d <= Fp && Math.abs(b.l) <= MEDIO))) elefantes.choque(S, b);
    } else if (b.est === 'lucha') {
      b.enFrente = Math.abs(b.l) <= MEDIO - 0.4 && b.d <= ELE_HONDO + 3 && b.d > -1;
      if (!b.enFrente) {
        /* giraste y se ha quedado fuera de tu frente: anda despacio a volver a apretarte */
        const q = enMuro(S, ELE_HONDO, Math.max(-MEDIO + 0.9, Math.min(MEDIO - 0.9, b.l))); b.v = 0;
        arrima(b, q.x, q.z, V.vVuelve, Math.atan2(q.x - b.x, q.z - b.z), V.giroVuelve, dt);
      } else {
        const vE = ELE_EMPUJA * (1 - (b.nPicas ?? 15) / 15); b.v = Math.max(vE, (b.v || 0) - 6 * dt);
        const atras = b.d < ELE_HONDO, q = enMuro(S, atras ? ELE_HONDO : Math.max(ELE_HONDO, b.d - b.v * dt), b.l);
        arrima(b, q.x, q.z, atras ? V.vAtras : b.v, -g, V.giro, dt);   /* empuja hacia tu muro (−frente de tu muro), mirándolo */
      }
    } else if (b.est === 'desbocada') {
      /* corre hacia atrás por su propio rumbo: se aleja de tu pivote girando con tope */
      const a = Math.atan2(b.x - p.x, b.z - p.z); corre(b, b.x + Math.sin(a) * 20, b.z + Math.cos(a) * 20, V.vDesboca, V.giro, dt);
      if (Math.hypot(b.x - p.x, b.z - p.z) > 90) b.fuera = true;
    } else b.v = 0;
  }
  /* nadie se mete en nadie: entre bestias ELE_VIVO.sepBestias y de bestia a falangita vivo sepHombre (empujones con tope) */
  const B = riv.bestias.filter(b => b.vivo && !b.fuera);
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], c = B[j], dx = c.x - a.x, dz = c.z - a.z, d = Math.hypot(dx, dz) || 1e-6;
    if (d < V.sepBestias) { const k = Math.min(0.12, (V.sepBestias - d) / 2); a.x -= dx / d * k; a.z -= dz / d * k; c.x += dx / d * k; c.z += dz / d * k; }
  }
  if (Array.isArray(S.fal)) for (const b of B) for (const h of S.fal) {
    if (!h.vivo || h.huye) continue; const dx = b.x - h.x, dz = b.z - h.z, d = Math.hypot(dx, dz) || 1e-6;
    if (d < V.sepHombre) { const k = Math.min(0.15, V.sepHombre - d); b.x += dx / d * k; b.z += dz / d * k; }
  }
}
/* la escolta: tira desde su sitio; se cuela por el hueco; al final carga en filas contra tus puntas (la 1.ª fila, est 'muro') */
function mueveEscolta(S, riv, dt) {
  const V = ELE_VIVO, g = giroDe(S), Fp = frenteDe(S), d0 = Fp > 0 ? Fp - 0.35 : 1.2, cnt = new Array(FILES).fill(0), mv = M(S).mueve;
  const va = (h, q, v) => { const x = h.x, z = h.z; if (mv) mv(h, q.x, q.z, v, dt); else { const dx = q.x - x, dz = q.z - z, d = Math.hypot(dx, dz), k = Math.min(d, v * dt); if (d > 1e-6) { h.x += dx / d * k; h.z += dz / d * k; } }
    const m = Math.hypot(h.x - x, h.z - z); h.yaw = giraHacia(h.yaw, m > 0.02 * dt * 30 && Math.hypot(q.x - h.x, q.z - h.z) > 0.6 ? Math.atan2(h.x - x, h.z - z) : -g, 4 * dt); };
  for (const h of riv.hombres) {
    if (!h.vivo || h.est === 'huye' || h.est === 'dentro') continue;
    if (h.est === 'cuela') { va(h, enMuro(S, 0.8, (riv.huecoL || 0) + ((h.i % 3) - 1) * 0.7), V.vEscolta); continue; }
    if (!riv.escCarga) { if (Math.hypot(h.x - h.x0, h.z - h.z0) > 0.3) va(h, { x: h.x0, z: h.z0 }, V.vEscolta); else { const p = pivote(S); h.yaw = giraHacia(h.yaw, Math.atan2(p.x - h.x, p.z - h.z), 2 * dt); } continue; }   /* vuelve a su sitio a tirar */
    const r = cnt[h.f]++, q = enMuro(S, d0 + r * 0.95, (h.f - (FILES - 1) / 2) * 0.78), lejos = Math.hypot(q.x - h.x, q.z - h.z);
    h.est = r === 0 && lejos < 1.5 ? 'muro' : lejos < 1.5 ? 'marcha' : 'carga';
    va(h, q, lejos > 3 ? V.vEscolta : 1.6);
  }
}
const porLuchar = b => b.vivo && !b.fuera && (b.est === 'lista' || b.est === 'carga' || b.est === 'lucha');
function pasoEleVivo(S, riv, dt) {
  const T = riv.T, az = riv.azar, V = ELE_VIVO;
  const activas = riv.bestias.filter(b => b.vivo && !b.fuera && (b.est === 'carga' || b.est === 'lucha'));
  const ola = riv.bestias.filter(b => b.vivo && !b.fuera && b.est === 'lista' && b.ola <= riv.ola);
  if (riv.fase === 'espera') {
    /* la oleada siguiente sale cuando la anterior ya no tiene bestias luchando */
    if (!ola.length && riv.ola < riv.olas - 1 && !activas.length) riv.ola++;
    else if (ola.length && !activas.length && T - riv.tFase >= ELE_ESPERA) { riv.fase = 'salva'; riv.tl = T + ELE_SALVA_AVISO; avisa(S, 'salva', { t: ELE_SALVA_AVISO }); }
  } else if (riv.fase === 'salva' && T >= riv.tl) {
    const b = bajadasDe(S), escolta = riv.hombres.filter(h => h.vivo && h.est === 'tira'), m = Math.round(ELE_SALVA_MUERTOS * escolta.length / riv.nE);
    if (m > 0 && !salvaMotor(S, escolta, m)) { bajas(S, m, 'bajas'); cambiaCoh(S, -3); avisa(S, 'salva_cae', { muertos: m }); }
    if (b >= 2) cansa(S, 1, ELE_SALVA_CANSA);
    riv.fase = 'pausa'; riv.tl = T + ELE_PAUSA;
  } else if (riv.fase === 'pausa' && T >= riv.tl) {
    riv.fase = 'carga'; riv.tFase = T; riv.tl = T + ELE_BARRITO; riv.carga++; avisa(S, 'barrito', { t: ELE_BARRITO });
    const ocupados = riv.bestias.filter(b => b.vivo && !b.fuera && (b.est === 'lucha' || b.est === 'ensartada')).map(b => b.l);
    for (const b of ola) { b.est = 'carga'; b.toca = null; b.cargaN = riv.carga * 10 + b.i; b.v = 0; b.lObj = eligeLado(riv, b, ocupados); }
    riv.ola++;
  } else if (riv.fase === 'carga' && T >= riv.tl) { riv.fase = 'espera'; riv.tFase = T; }
  mueveBestias(S, riv, dt);
  for (const b of riv.bestias) {
    if (!b.vivo || b.fuera) continue;
    if (b.est === 'ensartada') {
      if (b.dio < ELE_AGONIA_MUERTOS && T >= b.tPisa) { pisa(S, b, 1, 'elefante'); b.dio++; b.tPisa = T + ELE_AGONIA / (ELE_AGONIA_MUERTOS + 1); }
      if (T >= b.tMuere) caeRival(S, b);
    } else if (b.est === 'lucha') luchaEle(S, riv, b, dt);
  }
  if (riv.hueco) {
    /* en vivo el hueco se cierra solo cuando la bestia que lo abrió ya no empuja (cae, se ensarta o se desboca) */
    if (ordenDe(S) === 'cerrar' || !(riv.huecoB && riv.huecoB.vivo && riv.huecoB.est === 'lucha')) { riv.hueco = false; avisa(S, 'cerrado', {}); for (const h of riv.hombres) if (h.est === 'cuela') h.est = riv.escCarga ? 'carga' : 'tira'; }
    else { cambiaCoh(S, -ELE_CUELA.coh * dt); riv.cuela += ELE_CUELA.bajas * V.cuela * dt; if (riv.cuela >= 1) { bajas(S, Math.floor(riv.cuela), 'hueco'); riv.cuela -= Math.floor(riv.cuela); } }
  }
  /* el final: sin bestias por luchar, carga la escolta; rompe cuando le queda el 15 % */
  const quedan = riv.bestias.some(porLuchar);
  if (!quedan && !riv.escCarga) { riv.escCarga = true; avisa(S, 'escolta', {}); for (const h of riv.hombres) if (h.vivo && h.est === 'tira') h.est = 'carga'; }
  mueveEscolta(S, riv, dt);
  if (!quedan && riv.hombres.filter(h => h.vivo).length <= Math.floor(riv.nE * FIN_LUCHA)) { riv.causa = 'bajas'; rompe(S, riv, 'bajas'); }
  mira(S, riv);
}

/* ================= EMPUJE: falange rival y muro hoplita ================= */
function creaEmpuje(nombre) {
  const R = {
    nombre,
    crea(S, azar) {
      const riv = base(S, azar, nombre);
      Object.assign(riv, { fase: 'empuje', cuenta: 4, coh: 100, cans: 0, pendientes: [], prev: null, latido: 0, muertos: 0, contacto: nombre === 'falange' ? 2 * ALCANCE : ALCANCE + 0.3 });
      const n = S.vivo ? 144 : 96, nom = nombre === 'falange' ? 'Falange rival' : 'Muro hoplita';   /* FU4: en vivo, 144 */
      for (let i = 0; i < n; i++) { const h = hombre(i, nombre === 'falange' ? 'piquero' : 'infante', 'empuja'); h.f = i % 12; h.r = Math.floor(i / 12); riv.hombres.push(h); }
      S.ene = riv.hombres.slice(); S.R = S.vivo ? crearUnidad({ hombres: n, nombre: nom, ref: n, fin: FIN_LUCHA, miedo: false }) : unidadRival(S, n, nom);
      if (S.vivo) { riv.vivo = true; const p = pivote(S); Object.assign(riv, { x: p.x, z: p.z, ang: giroDe(S), gVisto: giroDe(S), tVe: null }); colocaVivo(S, riv, 0, true); }
      else coloca(S, riv, 5);
    },
    paso(S, dt) {
      const riv = S.riv; if (!riv || S.ganador) return; riv.T += dt;
      if (S.R && S.R.tic) S.R.tic(dt);
      marcaChoque(S); const pu = pulsoDe(S), Tn = tiempoDe(S);
      if (pu !== null) { if (riv.prev !== null && pu < riv.prev - 0.5) riv.pendientes.push({ bT: Tn - pu * PULSO, contacto: null, res: null }); riv.prev = pu; }
      while (riv.pendientes.length && Tn >= riv.pendientes[0].bT + 0.3 && !S.ganador) R.choque(S, riv.pendientes.shift());
      if (!riv.roto) { if (riv.vivo) colocaVivo(S, riv, dt, false); else coloca(S, riv, bajadasDe(S)); }
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
      if (riv.muertos >= 1 && !riv.vivo) { bajas(S, Math.floor(riv.muertos), 'empuje'); riv.muertos -= Math.floor(riv.muertos); }
      riv.cans = Math.max(0, Math.min(1, riv.cans + (riv.fase === 'oleada' ? 0.03 : riv.fase === 'gastado' ? -0.04 : 0.005)));
      riv.coh = Math.max(0, Math.min(100, riv.coh)); if (!riv.vivo) riv.animo = riv.coh / 100; riv.latido++;
      if (!riv.vivo) {   /* FU4: en vivo las bajas de los dos bandos las hace lucha() del motor */
        const vivos = riv.hombres.filter(x => x.vivo), quedan = Math.round(96 * (0.5 + 0.5 * riv.coh / 100));
        for (let k = vivos.length - 1; k >= quedan && k >= 0; k--) { caeRival(S, vivos[k]); vivos[k].est = 'cae'; causa(S, 1); }
      }
      if (--riv.cuenta <= 0) {
        const sig = { empuje: 'prepara', prepara: 'oleada', oleada: 'gastado', gastado: 'empuje' }[riv.fase];
        riv.fase = sig; riv.cuenta = sig === 'prepara' ? 1 : sig === 'oleada' ? EMP_OLEADA : sig === 'gastado' ? EMP_GASTADO : 2 + Math.floor(riv.azar() * 2);
        if (sig === 'prepara') avisa(S, 'oleada', { latidos: EMP_OLEADA, t: PULSO });
        if (sig === 'gastado') avisa(S, 'gastado', { latidos: EMP_GASTADO });
      }
      if (!mandaMeta(S) && riv.linea >= EMP_META) rompe(S, riv, 'empuje');
      else if (riv.coh <= 0 && !riv.vivo) rompe(S, riv, 'animo');   /* FU4: en vivo no rompe por cohesión */
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
  /* FU4 (modo vivo): la línea tiene ancla y ángulo propios (sigueMuro: retraso y tope de giro) y sus hombres andan a su puesto.
     La fila se cuenta entre los vivos de cada columna: cuando cae uno de delante, el de detrás da un paso. La falange rival se
     queda a ALCANCE + 2 m (las puntas cruzadas: así le alcanza la lucha del motor); el hoplita, como siempre */
  function colocaVivo(S, riv, dt, salta) {
    const b = bajadasDe(S), z0 = nombre === 'hoplitas' ? (b < 3 ? 1.5 : riv.contacto) : ALCANCE + 2;
    if (salta) { const p = pivote(S); riv.x = p.x + Math.sin(riv.ang) * z0; riv.z = p.z - Math.cos(riv.ang) * z0; } else sigueMuro(S, riv, z0, dt);   /* el ancla: el centro de su primera fila */
    const Fx = Math.sin(riv.ang), Fz = -Math.cos(riv.ang), Dx = Math.cos(riv.ang), Dz = Math.sin(riv.ang), yaw = Math.atan2(-Fx, -Fz), cnt = new Array(FILES).fill(0);
    for (const h of riv.hombres) {
      if (!h.vivo || h.est === 'huye' || h.est === 'dentro') continue;
      h.r = cnt[h.f]++; const l = (h.f - 5.5) * 0.78, d = h.r * 0.95, tx = riv.x + Fx * d + Dx * l, tz = riv.z + Fz * d + Dz * l;
      if (salta || !M(S).mueve) { h.x = tx; h.z = tz; } else M(S).mueve(h, tx, tz, 2.2, dt);
      h.yaw = yaw;
    }
  }
  return R;
}

export const RIVALES = { caballeria, elefantes, falange: creaEmpuje('falange'), hoplitas: creaEmpuje('hoplitas') };
