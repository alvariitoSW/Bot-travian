/* AQVILA — LP2: las cuatro órdenes del bloque y el enemigo que piensa, sin pantalla (corre en Node y en el navegador). Módulo ES.
   Diseño: gobierno/estudios/LP0-como-se-pelea-a-pie.md §2–§4 y §6 (comprobaciones 5, 6 y 7). Tú mandas un manípulo, no a un hombre.
   No dibuja ni suena: todo sale por avisa(tipo, datos). Reutiliza crearUnidad y azarSemilla de js/falange.js (no los cambia).

   ===================== CONTRATO DE LP2 =====================
   import { crearCombate } from './bloque-ia.js';
   const C = crearCombate(m);
     m = { semilla   número (por defecto 1): misma semilla, misma partida
           nivel     'facil' | 'normal' | 'dificil' (por defecto 'normal')
           avisa     función (tipo, datos) hacia pantalla y sonido; en Node, nada
           motor     opcional: el módulo de LP1 (import * as BL from './bloque.js'); mueve tu manípulo (ver PUENTE)
           bloque    opcional, con motor: un B de LP1 ya creado para tu manípulo
           LP7 (bajar a pie desde la batalla grande; sin estas tres, todo como siempre):
           fuerzas   { tuyo, centro, amigas: [i, d], alas: [i, d], reserva, tiradores }: hombres de cada bloque. 0 = no está
                     (se queda en S.amigas / S.ene con estado 'fuera', fuera de S.bloques). Lo que falte, el de serie
           lejos     metros entre tu primera fila y la suya al empezar (por defecto 70; los demás bloques, igual de corridos)
           fin       FIN_LUCHA de js/falange.js (0,15): todos luchan hasta que les queda ese tanto por uno, sin miedo por bajas
           FU1 escenario 'testudo' («cruzar bajo las salvas»; sin él, todo como siempre): tu manípulo cruza el campo hacia una colina
                     (S.escenario.meta { x, z, r }); los tiradores galos están ya en el campo y lanzan exactamente DOS salvas mientras
                     cruzas (se quedan quietos); el resto de los galos espera. Cuando la segunda ha caído, el centro galo CARGA (aviso
                     'escenario' { fase: 'carga' }) y se lucha como siempre (pasa fin: FIN_LUCHA para luchar hasta el 15 %).
                     S.escenario = { meta, fase 'cruza'|'carga', tCarga } }
   C = { S, paso(dt), orden(n), frente({ x, z, ang }), dibujaFrente(a, b), ordenUtil(), bot(modo), resumen(), trabado() }

   EJES (los de js/falange.js): metros; ang = 0 mira a −z; frente = (sen ang, −cos ang); derecha = (cos ang, sen ang);
   ang positivo = ha girado a su derecha. (x, z) de un bloque = el centro de su PRIMERA FILA (el pivote).
   Tu manípulo empieza en (0, 0) mirando a −z; sus dos compañeras a los lados; los galos a 70 m, mirando a +z.

   EL ESTADO S (lo lee la escena; nadie de fuera lo escribe)
     S.T, S.nivel, S.ganador (null | 'tuyo' | 'enemigo' | 'tablas'), S.causa
     S.bloques[]   todos los bloques. Cada uno:
       { id, bando 'r'|'g', tipo 'manipulo'|'galos'|'nobles'|'tiradores', papel 'tuyo'|'amiga'|'centro'|'ala'|'reserva'|'tiradores',
         x, z, ang, ancho, fondo, U (crearUnidad: enPie, animo, roto), coh 0–100, fila 0–1 (cansancio de la fila que pelea),
         relevos (filas frescas que quedan), orden null|'marcha'|'cargar'|'alto'|'testudo', tRelevo (fin del relevo en curso o −1),
         estado 'forma'|'marcha'|'choque'|'retira'|'reforma'|'huye'|'fuera', obj { x, z, ang } | null, contactos [{ b, zona }],
         retiradas (las que le quedan a un manípulo), tContacto (último roce) }
     S.tuyo, S.amigas[2], S.ene { centro, alas[2], reserva, tiradores }
     S.salva   null | { t (llega), blanco }: jabalinas en el aire
     S.flanco  null | { lado −1|1, de (bloque), finta (bool) }: el aviso de flanco que está vivo
     S.ia      el plan del jefe enemigo { fase, lado, finta, tPlan, ... } (para la escena y las pruebas)
     S.cuenta  { flanqueado, salvas, salvasTestudo, pilum, relevos, cargas, fintas, retiradas, muertosSuelta, rotaRetira, retiradasGalas }

   LAS CUATRO ÓRDENES (LP0 §2–§3; romanos: Cargar · Alto · Testudo · Relevo)
     'cargar'   corren hacia el enemigo de delante; a 15 m lanzan el pilum (una vez); al chocar, golpe de carga 3 s. Cansa la fila.
                Si persigues a uno que huye o se retira, tu orden se desordena (pierdes cohesión): «Alto» se ilumina.
     'alto'     se paran y forman: recuperan cohesión y aliento fuera del choque. Quita el testudo y la carga.
     'testudo'  techo de escudos: las jabalinas casi no matan; anda despacio y pega poco en el choque.
     'relevo'   la segunda fila pasa delante por los huecos: la fila que pelea vuelve fresca. 3 s flojos. Quedan S.tuyo.relevos.
     'retirada' (LP4b) solo trabado: ver TRABADOS Y RETIRADA. Tocar 'testudo' cuando ya lo tienes lo quita (queda en 'alto').
   ordenUtil() → la orden que conviene ahora (la que se ilumina), o null. Nunca un texto: la pantalla solo la ilumina.

   TRABADOS Y RETIRADA (LP4b; pedido del usuario 23/11: «que cueste, con salida»)
     trabado() = tu manípulo está en el choque (o salió hace menos de T_TRABADO s). Trabado gira a la mitad (B.mods.giro 0,5)
       y no avanza a través del enemigo: el frente que dibujes solo le hace girar donde está (aviso 'trabado').
     'retirada' se suelta y retrocede D_RETIRA m formado, sin dar la espalda, a V_RETIRA. Al soltarse paga: el enemigo pega a gusto
       T_SUELTA s (al menos cae uno), SUELTA_COH de cohesión y SUELTA_ANIMO de moral. Si la cohesión queda por debajo de
       COH_ROMPE, puede romperse en huida ('desbanda'). Si no, al llegar se rehace T_REFORMA s ('reforma') y vuelve con la fila
       descansada y REFORMA_ANIMO de moral ('vuelve'). Mientras retrocede no oye otra orden ('retirandose'). Quedan RETIRADAS.
       Disciplina del manípulo: ya suelto, deja de ir «perdiendo» y recobra CALMA de moral por segundo (los galos no).
       Un enemigo no persigue una retirada en orden (cohesión ≥ COH_ORDEN): se para y toma aliento; si va desordenada, carga,
       y la golpea como al que huye. Se ilumina (ordenUtil) cuando, trabado, se va perdiendo sin relevo que lo arregle y
       la cohesión aguanta el precio (≥ COH_ORDEN + SUELTA_COH).
     La IA usa la MISMA función: sus bandas en Normal y Difícil se retiran a formar (24 m) cuando su moral baja de 0,3.

   EL ENEMIGO (LP0 §3–§4): vive en el campo, no en tu cámara. Piensa cada «reacción» segundos (Fácil 3 · Normal 2 · Difícil 1,2):
     entre dos planes sigue andando hacia el punto que eligió, con su velocidad y su giro; nunca salta. Si giras tu bloque,
     no gira contigo: lo verá en su próximo plan. Tiene jefe (S.ia), reserva de nobles y tiradores de jabalina.
     Fácil    va de frente; la reserva se queda detrás (solo pelea si vas a por ella); jabalinas a ritmo fijo. Es el enemigo de hoy.
     Normal   el centro te fija; a los 8 s la reserva rodea por fuera (ruta fijada en el campo: si giras, no te sigue) y entra
              andando por tu flanco más débil; jabalinas cuando no estás en testudo; si cede, se retira a formar una vez.
     Difícil  además espera a que tu fila se canse antes de soltar la reserva; siempre finta (amaga un lado y entra por el otro);
              si te ve girar más de 30° antes de llegar, rehace la ruta una vez; carga; lanza cuando estás abierto (cargando o
              relevando); contracarga si cargas; sus alas, si rompen a tu compañera, vienen a tu flanco; se retira a formar dos veces.
     Si pierde el contacto contigo (porque giraste), vuelve a por ti en línea recta. Ganas si rompes su centro y su reserva no
     está ya pegada a ti («Rompe su línea antes de que llegue su jefe»). Pierdes si rompe tu manípulo (con 15 s de persecución).
   COMBATE (resumen): cada bloque pega según hombres en pie, cansancio de su fila, cohesión y orden; el golpe pesa más cuanto
     más de lado o de espalda entra (pesoDe, sin saltos entre 45° y 75°); un frente solo cabe a tantos (dos de frente pegan como
     1,3); el ánimo y la rotura son los de crearUnidad (js/falange.js).

   BOTS (comprobaciones 5–7): 'bueno' (toca la orden iluminada salvo «Retirada»: aguanta, como en LP2, y, cuando la reserva está a 32 m y se le va de frente,
     redibuja el frente hacia ella sin dar la espalda al centro galo) · 'quieto' (no hace nada) · 'sinOrdenes' (como el bueno, sin Testudo, Relevo ni Cargar) · 'sinTestudo' ·
     'sinRelevo' · 'sinCargar' · 'retira' (el bueno que además se retira cuando se ilumina «Retirada»).

   AVISOS (avisa): 'orden' { n, texto } · 'ilumina' { n } · 'salva' { t, blanco } · 'jabalinas' { muertos, testudo } ·
     'pilum' { blanco, muertos } · 'carga' { de, a } · 'choque' { a, b, zona } · 'flanco' { lado, de, finta } · 'finta' { lado } ·
     'relevo' { de } · 'agotada' { de } · 'cede' { de } · 'reforma' { de } · 'vuelve' { de } · 'huye' { de } · 'rompe' { de } ·
     'fin' { ganador, causa } · LP4b: 'trabado' { de } · 'retirandose' { de } · 'suelta' { de, muertos } · 'retira' { de } ·
     'desbanda' { de } (se rompió al retirarse) · 'vuelve' { de } (también el tuyo, al rehacerse)

   PUENTE CON LP1 (js/bloque.js). Con m.motor (el módulo de LP1) tu manípulo lo mueve su bloque B (S.B): la orden de frente
     va a su dibujaFrente, cada paso se llama a su paso(B, dt) con B.mods (testudo despacio, carga deprisa, giro a la mitad en
     el choque) y B.orden, y se copian x, z, rumbo, ancho y fondo. Las bajas matan a sus hombres de delante y cierran filas.
     Sin m.motor, un mover de reserva (girar sobre el centro y andar) hace lo mismo para las pruebas. El enemigo y las
     compañeras usan siempre el mover de reserva: nada de lo que hace tu bloque los mueve. Todo lo que supone el contrato
     de LP1 vive en creaB / poseDe / medidasDe / mandaFrente / pasoBloque / bajasB, abajo.

   HISTORIA (skill historia; LP0 §7). Relevo de líneas por los huecos del manípulo: histórico (Polibio 6.21–23; Livio 8.8);
   relevo de filas dentro del manípulo: probable (Sabin, JRS 90, 2000). Pilum antes del choque: histórico (Polibio 6.23;
   César BG 1.25). Testudo en campo abierto contra jabalinas: licencia de juego (atestiguado en asaltos: Polibio 28.11,
   Livio 44.9). Galos por bandas con jefes y nobles: histórico (Polibio 2.28–33); que su reserva flanquee con método, finte y
   se retire a formar: licencia de juego (para que no sea fácil). Persecución que desordena: histórico (Polibio 2.33, 18.26).
   LP4b: retroceder formado sin dar la espalda (pedem referre): histórico (Livio 8.8.9–11 y César BG 1.25 lo nombran; César es
   algo posterior). Que soltarse del choque cueste y que una línea gastada se retire tras otra fresca: histórico (Polibio
   6.21–23; Livio 8.8). Que retirarse con las filas deshechas acabe en huida: histórico (Polibio 15.13–14, Zama; 2.33).
   Que el enemigo no persiga a una línea que se retira formada: probable (Goldsworthy 1996, sobre la persecución). Licencia
   de juego: la orden única «Retirada» para un manípulo suelto (lo histórico es la retirada de la línea entera por los
   huecos), la «calma» del manípulo, el número de retiradas y todas las cifras.
   Licencia de juego: todas las cifras de este archivo. */
import { azarSemilla, crearUnidad } from './falange.js';

export const NIVELES = ['facil', 'normal', 'dificil'];
export const ORDENES = ['cargar', 'alto', 'testudo', 'relevo', 'retirada'];
export const BOTS = ['bueno', 'quieto', 'sinOrdenes', 'sinTestudo', 'sinRelevo', 'sinCargar', 'retira'];
export const GRADO = Math.PI / 180;
export const DT = 0.1, T_MAX = 300;                                  /* paso de las pruebas y tope de partida (s) */
export const V_MARCHA = 1.2, V_CARGA = 3.4, V_TESTUDO = 0.5, V_HUYE = 2.6, V_RODEA = 2.4;   /* m/s */
export const V_GIRO = 8 * GRADO, V_GIRO_CHOQUE = 4 * GRADO;          /* el bloque pesa: 8°/s; en pleno choque, la mitad */
export const D_CARGA = 30, D_PILUM = 15, PILUM_MUERTOS = 9, PILUM_COH = 20;
export const T_IMPACTO = 3, T_RELEVO = 3, SALVA_VUELO = 2.5, SALVA_MUERTOS = 8, SALVA_RECARGA = 13, SALVAS = 5, D_SALVA = 38;
export const K_GOLPE = 0.85;                                          /* hombres por segundo de un frente lleno, fresco y formado */
export const ZONA = { frente: 1, flanco: 2.1, espalda: 2.8 };         /* cuánto pesa el golpe según por dónde entra */
export const ANG_FRENTE = 60 * GRADO, ANG_ESPALDA = 120 * GRADO;   /* para el nombre de la zona (avisos); el golpe va por pesoDe */
export const AGOTADA = 0.7;
export const D_BOT = 32, OFF_BOT = 20, D_BOT_VUELTA = 50;                               /* el bot bueno gira hacia la reserva cuando está a 32 m y a más de 20° */
export const VAR = 0.08;                                             /* suerte de cada banda galo: ±8 % de fuerza */
export const T_PERSIGUE = 15;                                       /* segundos de persecución si tu manípulo rompe */
/* LP4b · trabados y retirada ordenada (licencia de juego: todas las cifras) */
export const T_TRABADO = 1.0;          /* tras el último roce, sigue «trabado» 1 s (sin parpadeos) */
export const V_RETIRA = 0.9, D_RETIRA = 16, RETIRADAS = 2;   /* paso atrás formado (m/s), cuánto se retira (m) y cuántas veces */
export const T_SUELTA = 1.5;           /* al soltarse, el enemigo pega a gusto lo que pegaría en 1,5 s (y al menos cae uno) */
export const SUELTA_COH = 12, SUELTA_ANIMO = 0.03;   /* lo que cuesta soltarse en cohesión y moral */
export const COH_ROMPE = 35;           /* con menos cohesión, retirarse puede acabar en huida */
export const COH_ORDEN = 50;           /* con esta cohesión o más, la retirada va en orden: el enemigo no se atreve a perseguir */
export const T_REFORMA = 6, REFORMA_ANIMO = 0.2;     /* al llegar atrás, segundos para rehacerse y moral que vuelve */
export const CALMA = 0.008;           /* moral por segundo que vuelve al retirarse, ya suelto */
export const ANIMO_RETIRA = 0.42;      /* con la moral así de baja y perdiendo, «Retirada» se ilumina */

/* lo que cambia con el nivel (licencia de juego: todas las cifras) */
export const NIVEL = {
  facil:   { reaccion: 3.0, fuerza: 0.85, flanquea: false, espera: false, finta: 0,   reformas: 0, cargaReserva: true, alas: 1, reserva: 70, salva: 'ritmo',   contracarga: false, alasVienen: false },
  normal:  { reaccion: 2.0, fuerza: 1.0,  flanquea: true,  espera: false, finta: 0,   reformas: 1, cargaReserva: false, alas: 1, reserva: 50, salva: 'abierto', contracarga: false, alasVienen: false },
  dificil: { reaccion: 1.2, fuerza: 1.15, flanquea: true,  espera: true,  finta: 1,   reformas: 2, cargaReserva: true, alas: 1, reserva: 70, salva: 'acecha',  contracarga: true,  alasVienen: true },
};
/* cada tipo: hombres, ancho y fondo (m), ataque, cuánto le entra (armadura y escudo), relevos, lo que cansa la fila por s y giro (°/s).
   El manípulo formado gira con peso (8°/s, LP0); las bandas galas, más sueltas, giran antes; los nobles y los tiradores, en columna, aún más */
export const TIPOS = {
  manipulo:  { hombres: 120, ancho: 20, fondo: 7, atk: 1.45, rec: 0.8,  relevos: 3, cansa: 1 / 45, giro: 8 },
  galos:     { hombres: 140, ancho: 22, fondo: 8, atk: 1.05, rec: 1.0,  relevos: 0, cansa: 1 / 55, giro: 18 },
  nobles:    { hombres: 70,  ancho: 12, fondo: 6, atk: 1.35, rec: 0.9,  relevos: 0, cansa: 1 / 60, giro: 30 },
  tiradores: { hombres: 40,  ancho: 16, fondo: 3, atk: 0.4,  rec: 1.3,  relevos: 0, cansa: 1 / 40, giro: 30 },
};
const TEXTO = { cargar: '¡Pila! ¡A la carga!', alto: '¡Alto! ¡Formad!', testudo: '¡Testudo!', abre: '¡Abrid el testudo! ¡Formad!', relevo: '¡Relevo! ¡Segunda fila, adelante!', retirada: '¡Atrás, paso a paso!' };

const lim = (x, a, b) => Math.max(a, Math.min(b, x));
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) }), de = a => ({ x: Math.cos(a), z: Math.sin(a) });
const angHacia = (dx, dz) => Math.atan2(dx, -dz);                     /* el ang que mira en la dirección (dx, dz) */
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const centro = b => { const f = fr(b.ang); return { x: b.x - f.x * b.fondo / 2, z: b.z - f.z * b.fondo / 2 }; };
/* metros por delante de la primera fila y a su derecha */
export function local(b, x, z) { const f = fr(b.ang), d = de(b.ang), dx = x - b.x, dz = z - b.z; return { delante: dx * f.x + dz * f.z, lado: dx * d.x + dz * d.z }; }
/* por dónde entra «a» en «b»: por el ángulo entre el frente de b y la recta de su centro al de a */
export function anguloDe(b, a) { const cb = centro(b), ca = centro(a); return Math.abs(angDif(angHacia(ca.x - cb.x, ca.z - cb.z), b.ang)); }
export function zonaDe(b, a) { const t = anguloDe(b, a); return t < ANG_FRENTE ? 'frente' : t < ANG_ESPALDA ? 'flanco' : 'espalda'; }
/* cuánto pesa el golpe según el ángulo, sin saltos: de frente 1; entre 45° y 75° sube al del flanco; entre 115° y 145°, al de la espalda */
export function pesoDe(t) {
  const g = t / GRADO, k = (a, b, x) => lim((x - a) / (b - a), 0, 1);
  return ZONA.frente + (ZONA.flanco - ZONA.frente) * k(45, 75, g) + (ZONA.espalda - ZONA.flanco) * k(115, 145, g);
}
/* ¿se tocan? el pivote de uno dentro del rectángulo del otro, con margen */
function tocan(a, b) {
  const den = (p, q) => { const l = local(q, p.x, p.z); return l.delante <= 1.4 && l.delante >= -q.fondo - 1.4 && Math.abs(l.lado) <= q.ancho / 2 + 1.4; };
  const ca = centro(a), cb = centro(b);
  return den(a, b) || den(b, a) || den(ca, b) || den(cb, a);
}
const vivo = b => b && !b.U.roto && b.estado !== 'fuera';

/* ---------- PUENTE con LP1 (js/bloque.js, contrato de su cabecera). Solo estas funciones suponen su contrato ----------
   m.motor = el módulo de js/bloque.js (import * as BL from './bloque.js'); m.bloque = un B ya creado (si falta, se crea uno
   de 20 de frente, como el manípulo de este archivo). LP2 solo escribe en B: mods, orden y la vida de los hombres. */
const V_MARCHA_LP1 = 1.3;
function creaB(M, b) { return M.crearBloque({ id: 'yo', bando: 'yo', tipo: 'manipulo', x: b.x, z: b.z, rumbo: b.ang, hombres: b.U.hombres, cols: 20, dx: 1.0, dz: 1.2 }); }
function poseDe(B) { return { x: B.x, z: B.z, ang: B.rumbo }; }
function medidasDe(B, b) { b.ancho = B.ancho + B.dx; b.fondo = B.fondo + B.dz; }
function mandaFrente(M, B, o) {
  const m = B.meta; if (m && Math.hypot(m.x - o.x, m.z - o.z) < 0.5 && Math.abs(angDif(m.rumbo, o.ang)) < GRADO) return;
  const d = de(o.ang), w = B.ancho / 2;
  M.dibujaFrente(B, { x: o.x - d.x * w, z: o.z - d.z * w }, { x: o.x + d.x * w, z: o.z + d.z * w }, { sentido: 'dibujo' });
}
function pasoBloque(M, B, dt, v, enChoque, orden) {
  B.mods.vel = Math.max(0.2, v / (M.V_MARCHA || V_MARCHA_LP1)); B.mods.giro = enChoque ? V_GIRO_CHOQUE / V_GIRO : 1; B.orden = orden; M.paso(B, dt);
}
/* las bajas: caen los de delante y los de atrás cierran filas */
function bajasB(M, B, enPie) {
  const V = B.hombres.filter(h => h.vivo); let n = V.length - enPie; if (n <= 0) return;
  /* FU2: el hombre que eres tú (h.yo) no cae por las reglas mientras quede otro vivo: va el último (solo lo mata el duelo) */
  /* CB3: el que el motor de lucha tumbó (h.marcado) cae el primero */
  V.sort((a, b) => (a.yo ? 1 : 0) - (b.yo ? 1 : 0) || (b.marcado ? 1 : 0) - (a.marcado ? 1 : 0) || a.fila - b.fila || Math.abs(a.col - (B.cols - 1) / 2) - Math.abs(b.col - (B.cols - 1) / 2));
  for (const h of V) { if (n-- <= 0) break; h.vivo = false; }
  M.cierraFilas(B);
}

export function crearCombate(m = {}) {
  const semilla = m.semilla ?? 1, nivel = NIVEL[m.nivel] ? m.nivel : 'normal', P = NIVEL[nivel];
  const avisa = (t, d) => { try { (m.avisa || (() => {}))(t, d); } catch (e) { /* la pantalla no tumba las reglas */ } };
  /* CB3: m.lucha === 'motor': los muertos de la lucha formada los decide js/combate.js (js/combate-tropas.js crearLucha, hombre a
     hombre, y llama a C.baja). Las reglas siguen con la cohesión, la moral, la rotura, la huida, el pilum, las salvas y el soltarse.
     Las reglas quedan de SUELO: cada caído del motor descuenta uno de lo que golpes() iba a tumbar en ese bloque (b.acum, hasta
     DEUDA de adelanto). Si los hombres que se ven no llegan a tocarse (dos bloques que las reglas meten uno en otro y la física
     aparta, un choque de esquina, una persecución), caen por reglas como antes; si el motor mata más deprisa, decide él.
     DEUDA: licencia de juego. Sin m.lucha, todo como antes */
  const DEUDA = 6;
  const LUCHA = m.lucha === 'motor';
  const azar = azarSemilla(semilla * 7919 + NIVELES.indexOf(nivel) * 31 + 3);
  const S = { T: 0, nivel, ganador: null, causa: null, bloques: [], salva: null, flanco: null, cuenta: { flanqueado: 0, salvas: 0, salvasTestudo: 0, pilum: 0, relevos: 0, cargas: 0, fintas: 0, retiradas: 0, muertosSuelta: 0, rotaRetira: 0, retiradasGalas: 0 } };
  let id = 0, kIlumina = null, tBot = -9, tGiro = -9;
  /* LP7: fuerzas reales, distancia y final al 15 % (ver el contrato). F(k, i) = hombres pedidos o null (el de serie) */
  const ESC = m.escenario === 'testudo';   /* FU1: cruzar bajo las salvas */
  const FU = m.fuerzas || {}, FIN = m.fin == null ? null : m.fin, DZ = 70 - (m.lejos == null ? 70 : Math.max(12, m.lejos));
  const F = (k, i) => { const v = i == null ? FU[k] : (FU[k] || [])[i]; return v == null ? null : Math.max(0, Math.round(v)); };
  const n0 = v => v == null ? undefined : v;

  function crea(tipo, papel, bando, x, z, ang, n) {
    const T = TIPOS[tipo], hombres = n || T.hombres;
    const b = { id: id++, tipo, papel, bando, x, z, ang, ancho: T.ancho, fondo: T.fondo, T, U: crearUnidad({ hombres, nombre: papel, fin: FIN, miedo: FIN == null }),
      coh: 100, fila: 0, relevos: T.relevos, orden: null, tOrden: 0, tRelevo: -1, tImpacto: -9, cargaAl: false, pilum: bando === 'r' ? 1 : 0,
      estado: 'forma', obj: null, v: 0, contactos: [], tContacto: -9, retiradas: tipo === 'manipulo' ? RETIRADAS : 0, reformas: bando === 'g' ? P.reformas : 0, tReforma: -1, golpes: 0, cedido: false, agotada: false };
    S.bloques.push(b); return b;
  }
  /* el despliegue (LP0 §4, boceto 1): tu manípulo al centro, dos amigas, los galos a 70 m con su reserva y sus tiradores */
  const tuyo = crea('manipulo', 'tuyo', 'r', 0, 0, 0, n0(F('tuyo')));
  const amigas = [crea('manipulo', 'amiga', 'r', -36, 2, 0, n0(F('amigas', 0))), crea('manipulo', 'amiga', 'r', 36, 2, 0, n0(F('amigas', 1)))];
  const lado0 = azar() < 0.5 ? -1 : 1;
  const ene = {
    centro: crea('galos', 'centro', 'g', 0, -70 + DZ, Math.PI, n0(F('centro'))),
    alas: [crea('galos', 'ala', 'g', -36, -70 + DZ, Math.PI, F('alas', 0) ?? 120), crea('galos', 'ala', 'g', 36, -70 + DZ, Math.PI, F('alas', 1) ?? 120)],
    reserva: crea('nobles', 'reserva', 'g', lado0 * 6, -92 + DZ, Math.PI, F('reserva') ?? P.reserva),
    tiradores: crea('tiradores', 'tiradores', 'g', 0, -58 + DZ, Math.PI, n0(F('tiradores'))),
  };
  /* LP7: el que no está (0 hombres pedidos) sale de S.bloques y queda 'fuera' (vivo() lo da por perdido) */
  for (const [b, v] of [[amigas[0], F('amigas', 0)], [amigas[1], F('amigas', 1)], [ene.alas[0], F('alas', 0)], [ene.alas[1], F('alas', 1)], [ene.reserva, F('reserva')], [ene.tiradores, F('tiradores')]])
    if (v === 0) { b.estado = 'fuera'; b.x += 2000; S.bloques.splice(S.bloques.indexOf(b), 1); }
  /* FU1: el escenario «cruzar bajo las salvas»: los galos más lejos (al pie de la loma), los tiradores en medio del campo y solo dos salvas.
     La colina es el punto al que cruzas (el suelo sube detrás de los galos, escena.js). Licencia de juego: todas las cifras */
  if (ESC) {
    ene.centro.z = -78; for (const a of ene.alas) a.z = -78; ene.reserva.z = -100; ene.tiradores.z = -50;
    S.escenario = { meta: { x: 0, z: -62, r: 9 }, fase: 'cruza', tCarga: -1 };
  }
  /* cada partida, su suerte: la fuerza de cada banda galo varía ±VAR con la semilla */
  for (const b of S.bloques) b.atkNivel = b.bando === 'g' ? P.fuerza * (b.papel === 'ala' ? P.alas : 1) * (1 - VAR + azar() * 2 * VAR) : 1;
  S.tuyo = tuyo; S.amigas = amigas; S.ene = ene;
  S.ia = { fase: 'avanza', lado: 0, finta: azar() < P.finta, fintaHecha: false, tPlan: -9, tChoque: -1, salvas: ESC ? 2 : SALVAS, tSalva: 0, tEspera: 0 };
  const MO = m.motor || null, B = MO ? (m.bloque || creaB(MO, tuyo)) : null;
  if (B) { const p = poseDe(B); tuyo.x = p.x; tuyo.z = p.z; tuyo.ang = p.ang; medidasDe(B, tuyo); }
  S.B = B;

  const enemigos = b => S.bloques.filter(o => o.bando !== b.bando && o.estado !== 'fuera');
  const delanteDe = (b, rango, cono = 50 * GRADO) => {
    let mejor = null, dm = rango;
    for (const o of enemigos(b)) {
      if (o.U.roto) continue; const c = centro(o), cb = centro(b), d = dist(c, cb) - o.fondo / 2 - b.fondo / 2;
      if (d < dm && Math.abs(angDif(angHacia(c.x - cb.x, c.z - cb.z), b.ang)) < cono) { dm = d; mejor = o; }
    }
    return mejor ? { o: mejor, d: dm } : null;
  };
  function enChoque(b) { return b.contactos.length > 0; }
  /* trabado: en el choque, o recién salido de él (1 s). Dentro, girar cuesta el doble y no se avanza: solo se sale con «Retirada» */
  function trabado(b) { return b.contactos.length > 0 || S.T - b.tContacto < T_TRABADO; }
  const retirando = b => b.estado === 'retira' || b.estado === 'reforma';
  /* matar anima, pero menos que en la falange (aquí caen muchos): +0,003 por muerto */
  function causa(b, k) { b.U.causa(k); b.U.anima(-0.009 * k); }
  function flanqueado(b) { return acoso(b) > 0.5; }
  /* 0 (todo de frente) a 1 (de lleno por el flanco o la espalda), sin saltos */
  function acoso(b) { let k = 0; for (const c of b.contactos) k = Math.max(k, (c.peso - 1) / (ZONA.flanco - 1)); return Math.min(1, k); }

  /* ---------- las órdenes de tu manípulo ---------- */
  function orden(n) {
    if (S.ganador || !ORDENES.includes(n) || tuyo.U.roto) return false;
    if (n === 'retirada') return retirada(tuyo, D_RETIRA);
    if (tuyo.estado === 'retira') { avisa('retirandose', { de: tuyo }); return false; }   /* mientras retrocede, no se le puede mandar otra cosa */
    if (tuyo.estado === 'reforma') tuyo.estado = enChoque(tuyo) ? 'choque' : 'forma';   /* otra orden corta el rehacerse (sin su premio) */
    if (n === 'testudo' && tuyo.orden === 'testudo') { tuyo.orden = 'alto'; tuyo.tOrden = S.T; tuyo.obj = null; if (B) MO.dibujaFrente(B, B.frente.p0, B.frente.p1, { sentido: 'dibujo' }); avisa('orden', { n: 'alto', texto: TEXTO.abre }); return true; }   /* tocar Testudo otra vez lo quita */
    if (n === 'relevo') {
      if (tuyo.relevos <= 0 || tuyo.tRelevo > S.T) return false;
      tuyo.relevos--; tuyo.tRelevo = S.T + T_RELEVO; tuyo.coh = Math.max(0, tuyo.coh - 4); S.cuenta.relevos++; tuyo.agotada = false;
      avisa('orden', { n, texto: TEXTO[n] }); avisa('relevo', { de: tuyo }); return true;
    }
    if (n === 'cargar') { if (tuyo.orden !== 'cargar') { S.cuenta.cargas++; tuyo.cargaAl = true; } tuyo.obj = null; }
    if (n === 'alto') { tuyo.obj = null; if (B) MO.dibujaFrente(B, B.frente.p0, B.frente.p1, { sentido: 'dibujo' }); }
    tuyo.orden = n; tuyo.tOrden = S.T; avisa('orden', { n, texto: TEXTO[n] }); return true;
  }
  function frente(o) {
    if (S.ganador || tuyo.U.roto || !o) return;
    if (tuyo.estado === 'retira') { avisa('retirandose', { de: tuyo }); return; }
    if (trabado(tuyo)) avisa('trabado', { de: tuyo });   /* se acepta el giro, pero solo se gira (despacio) donde se está */
    tuyo.obj = { x: o.x, z: o.z, ang: o.ang }; if (tuyo.orden === 'cargar' || tuyo.orden === 'alto' || tuyo.orden === null) tuyo.orden = 'marcha';
    if (B) mandaFrente(MO, B, tuyo.obj);
  }
  /* la raya que dibuja el dedo, de a a b: ahí la primera fila, mirando al lado de la raya que no es el de tu bloque */
  function dibujaFrente(a, b) {
    if (B) {   /* con LP1, la raya la interpreta él (qué lado es «delante»); se copia su meta */
      if (S.ganador || tuyo.U.roto) return;
      if (tuyo.estado === 'retira') { avisa('retirandose', { de: tuyo }); return; }
      if (trabado(tuyo)) avisa('trabado', { de: tuyo });
      const M = MO.dibujaFrente(B, a, b); if (!M) return;
      tuyo.obj = { x: M.x, z: M.z, ang: M.rumbo }; if (tuyo.orden === 'cargar' || tuyo.orden === 'alto' || tuyo.orden === null) tuyo.orden = 'marcha'; return;
    }
    const x = (a.x + b.x) / 2, z = (a.z + b.z) / 2, dx = b.x - a.x, dz = b.z - a.z;
    let ang = angHacia(dz, -dx); const c = centro(tuyo), f = fr(ang);
    if ((c.x - x) * f.x + (c.z - z) * f.z > 0) ang += Math.PI;
    frente({ x, z, ang: angDif(ang, 0) });
  }
  /* ---------- la retirada ordenada (LP4b): la misma regla para tu manípulo y para los galos ----------
     Solo trabado. Al soltarse, el enemigo pega a gusto (T_SUELTA s de golpes) y se pierden cohesión y moral. Con la cohesión
     baja, puede romperse en huida. Si no, el bloque retrocede formado, sin dar la espalda, «atras» metros; allí se rehace
     T_REFORMA s y vuelve con la fila descansada y moral. Un enemigo no persigue una retirada en orden (cohesión ≥ COH_ORDEN). */
  function retirada(b, atras) {
    if (S.ganador || b.U.roto || retirando(b) || !enChoque(b)) return false;
    if (b === tuyo && b.retiradas <= 0) return false;
    if (b.bando === 'r') b.retiradas--;
    let k = 0;
    for (const c of b.contactos) { const o = c.b; k += ataque(o) / Math.max(1, o.contactos.length) * c.peso * recibe(b) * T_SUELTA; }
    k = Math.min(b.U.enPie, Math.max(1, Math.round(k))); b.U.baja(k); for (const c of b.contactos) causa(c.b, k / b.contactos.length);
    b.coh = Math.max(0, b.coh - SUELTA_COH); b.U.anima(-SUELTA_ANIMO);
    b.orden = b.bando === 'r' ? 'retirada' : null; b.tOrden = S.T; b.cargaAl = false;
    if (b === tuyo) { S.cuenta.retiradas++; S.cuenta.muertosSuelta += k; avisa('orden', { n: 'retirada', texto: TEXTO.retirada }); }
    else S.cuenta.retiradasGalas++;
    avisa('suelta', { de: b, muertos: k });
    /* ¿aguanta la retirada? con poca cohesión, la mitad o más salen corriendo */
    if (b.coh < COH_ROMPE && !b.U.roto) {
      const p = 0.25 + 0.6 * (COH_ROMPE - b.coh) / COH_ROMPE;
      if (azar() < p) { b.U.animo = 0; b.U.roto = true; b.U.tRoto = b.U.T; if (b === tuyo) S.cuenta.rotaRetira++; avisa('desbanda', { de: b }); return true; }
    }
    if (b.U.roto) return true;
    const f = fr(b.ang); b.obj = { x: b.x - f.x * atras, z: b.z - f.z * atras, ang: b.ang }; b.estado = 'retira'; b.tReforma = -1;
    avisa('retira', { de: b }); if (b.bando === 'g') avisa('reforma', { de: b });
    return true;
  }
  /* llega atrás: se rehace; pasado T_REFORMA vuelve formado y con la fila descansada. Si le alcanzan antes, se acabó el respiro */
  function rehace(b, dt) {
    /* disciplina del manípulo: ya suelto, el miedo se calma (no se sigue «perdiendo») y la moral vuelve poco a poco.
       Los galos no la tienen: se rehacen solo al llegar (como en LP2) */
    if (!enChoque(b) && b.tipo === 'manipulo') { b.U.sufrio = Math.min(b.U.sufrio, b.U.hizo); b.U.anima(CALMA * dt); }
    if (b.estado === 'retira' && (!b.obj || dist(b, b.obj) < 0.4)) { b.estado = 'reforma'; b.obj = null; b.tReforma = S.T + T_REFORMA; if (b === tuyo) b.orden = 'alto'; }
    if (b.estado === 'reforma') {
      if (b.tReforma > 0 && S.T >= b.tReforma) {
        b.estado = 'forma'; b.U.anima(REFORMA_ANIMO); b.coh = Math.max(b.coh, 75); b.fila = Math.min(b.fila, 0.15); b.tReforma = -1; b.agotada = false; b.cedido = false;
        if (b === tuyo) tuyo.vueltas = (tuyo.vueltas || 0) + 1;
        avisa('vuelve', { de: b });
      }
    }
  }

  /* la orden que conviene ahora (la que se ilumina) */
  function ordenUtil(sinRetirada = false) {
    if (S.ganador || tuyo.U.roto || tuyo.estado === 'retira') return null;
    const ch = enChoque(tuyo);
    /* jabalinas en el aire: testudo, salvo si ya vas cargando y el enemigo está a menos de 15 m (mejor llegar) */
    const cerca = tuyo.orden === 'cargar' && delanteDe(tuyo, 15);
    if (S.salva && S.salva.blanco === tuyo && S.salva.t - S.T <= SALVA_VUELO + 0.2 && !ch && !cerca) return tuyo.orden === 'testudo' ? null : 'testudo';
    if (ch && tuyo.fila >= AGOTADA && tuyo.relevos > 0 && tuyo.tRelevo < S.T) return 'relevo';
    /* trabado y perdiendo, sin relevo que lo arregle: retirarse a tiempo, mientras la cohesión aguanta */
    if (ch && !sinRetirada && conviene()) return 'retirada';
    if (tuyo.estado === 'reforma') return null;
    if (!ch && tuyo.vueltas && giroUtil()) return null;   /* rehecho y con su jefe a un lado: primero girar hacia él (la raya dorada), no cargar */
    if (tuyo.orden === 'cargar' && !ch) { const v = delanteDe(tuyo, 60); if (!v || v.o.estado === 'huye' || retirando(v.o)) return 'alto'; }
    if (tuyo.orden === 'testudo' && !S.salva) return ch ? 'testudo' : (delanteDe(tuyo, D_CARGA) ? 'cargar' : 'alto');   /* trabado: tocar Testudo otra vez lo quita */
    if (tuyo.orden !== 'cargar' && !ch) { const v = delanteDe(tuyo, D_CARGA); if (v && v.o.estado !== 'huye' && !retirando(v.o)) return 'cargar'; }
    if (!ch && tuyo.coh < 45 && tuyo.orden !== 'alto') return 'alto';
    return null;
  }
  function conviene() {
    const u = tuyo.U;
    /* solo se ilumina si la retirada puede ir en orden: tras pagar al soltarse, la cohesión queda en COH_ORDEN o más */
    if (tuyo.retiradas <= 0 || tuyo.tRelevo > S.T || tuyo.coh < COH_ORDEN + SUELTA_COH || S.T - tuyo.tImpacto < T_IMPACTO) return false;
    const mal = u.combate() === 'perdiendo', agotada = tuyo.fila >= AGOTADA && tuyo.relevos <= 0;
    if (u.animo < ANIMO_RETIRA && (mal || agotada)) return true;   /* la moral se va y nada la va a traer de vuelta ahí dentro */
    if (flanqueado(tuyo) && mal && u.animo < 0.6) return true;
    return agotada && mal;
  }

  /* ---------- mover: el bloque va hacia su objetivo con su velocidad y su giro; nunca salta ---------- */
  function velocidad(b) {
    if (b.estado === 'huye') return V_HUYE;
    if (b.estado === 'retira') return V_RETIRA;
    if (b.orden === 'testudo') return V_TESTUDO;
    if (b.orden === 'cargar') return V_CARGA;
    if (b.papel === 'reserva' && S.ia.fase === 'rodea') return V_RODEA;
    return V_MARCHA;
  }
  function mueve(b, dt) {
    const o = b.obj; let v = 0;
    if (o) {
      const ret = b.estado === 'retira', ch = enChoque(b) && b.estado !== 'huye' && !retirando(b);
      const giro = (b.T.giro * GRADO) * (ch ? V_GIRO_CHOQUE / V_GIRO : 1), d = dist(b, o);
      const dir = angHacia(o.x - b.x, o.z - b.z);   /* un bloque formado avanza sin girar si el punto está dentro de ±35° de su frente final */
      const angObj = !ret && d > 2.5 && !ch && Math.abs(angDif(dir, o.ang)) > 35 * GRADO ? dir : o.ang;   /* la retirada no da la espalda */
      const g = angDif(angObj, b.ang), c0 = centro(b); b.ang = angDif(b.ang + lim(g, -giro * dt, giro * dt), 0);
      if (d <= 2.5 || ch) {   /* girar a pie quieto: sobre su centro (el mover de reserva; la puerta de verdad es de LP1) */
        const f = fr(b.ang), nx = c0.x + f.x * b.fondo / 2, nz = c0.z + f.z * b.fondo / 2;
        if (o) { o.x += nx - b.x; o.z += nz - b.z; } b.x = nx; b.z = nz;
      }
      /* anda si mira más o menos hacia donde va (si no, primero gira, como una puerta) */
      if (!ch && d > 0.15 && (ret || Math.abs(angDif(dir, b.ang)) < 40 * GRADO)) {
        v = velocidad(b); const paso = Math.min(d, v * dt); b.x += (o.x - b.x) / d * paso; b.z += (o.z - b.z) / d * paso;
      }
      if (d <= 0.15 && Math.abs(angDif(o.ang, b.ang)) < 0.5 * GRADO && (b !== tuyo || ret)) b.obj = null;
    }
    b.v = v;
    if (b.estado === 'marcha' && !o) b.estado = 'forma';
    if (o && b.estado === 'forma') b.estado = 'marcha';
  }
  /* tu manípulo: con «Cargar» va solo hacia el de delante; si no, a su raya */
  function mueveTuyo(dt) {
    if (tuyo.U.roto) return mueveHuida(tuyo, dt);
    if (tuyo.orden === 'cargar' && !enChoque(tuyo)) {
      const v = delanteDe(tuyo, 80, 70 * GRADO);
      if (v) { const c = centro(v.o), f = fr(tuyo.ang), k = v.o.fondo / 2 + 8;   /* apunta más allá: corre sin frenar hasta el choque */
        tuyo.obj = { x: c.x + f.x * k, z: c.z + f.z * k, ang: tuyo.ang };
        if (v.o.estado === 'huye' || retirando(v.o)) tuyo.coh = Math.max(0, tuyo.coh - 2.5 * dt); /* perseguir desordena */
        if (v.d <= D_PILUM && tuyo.pilum > 0) pilum(v.o);
      } else tuyo.obj = null;
    }
    if (tuyo.orden === 'alto') tuyo.obj = null;
    if (B) {
      const ret = tuyo.estado === 'retira';
      /* en el choque no se avanza a través del enemigo: solo se gira donde se está (la retirada sí se mueve: hacia atrás) */
      if (enChoque(tuyo) && !ret) {
        if (tuyo.obj) { tuyo.obj.x = tuyo.x; tuyo.obj.z = tuyo.z; }
        else if (B.meta && Math.hypot(B.meta.x - B.x, B.meta.z - B.z) > 0.3) MO.dibujaFrente(B, B.frente.p0, B.frente.p1, { sentido: 'dibujo' });
      }
      if (tuyo.obj) mandaFrente(MO, B, tuyo.obj);
      /* LP1 marcha hacia atrás a la mitad de paso: la retirada le pide el doble para ir a V_RETIRA */
      pasoBloque(MO, B, dt, ret ? V_RETIRA / 0.5 : velocidad(tuyo), trabado(tuyo) && !ret, tuyo.orden);   /* trabado: sin parpadeos del roce */
      const p = poseDe(B); tuyo.v = dist(p, tuyo) / dt; tuyo.x = p.x; tuyo.z = p.z; tuyo.ang = p.ang; medidasDe(B, tuyo);
      if (!B.meta && tuyo.obj && tuyo.orden !== 'cargar') tuyo.obj = null;
    }
    else mueve(tuyo, dt);
    if (tuyo.orden === 'marcha' && !tuyo.obj) tuyo.orden = null;
  }
  function mueveHuida(b, dt) {
    const e = enemigos(b).filter(vivo); let ax = 0, az = 0;
    for (const o of e) { const d = Math.max(1, dist(o, b)); ax += (b.x - o.x) / d; az += (b.z - o.z) / d; }
    if (!ax && !az) az = b.bando === 'r' ? 1 : -1;
    const n = Math.hypot(ax, az); b.ang = angHacia(ax / n, az / n); b.x += ax / n * V_HUYE * dt; b.z += az / n * V_HUYE * dt; b.obj = null; b.v = V_HUYE;
    if (Math.hypot(b.x, b.z) > 110) { b.estado = 'fuera'; b.contactos = []; }
  }
  function pilum(o) {
    tuyo.pilum--; const k = Math.min(o.U.enPie, Math.round(PILUM_MUERTOS * (0.85 + azar() * 0.3)));
    o.U.baja(k); causa(tuyo, k); o.coh = Math.max(0, o.coh - PILUM_COH); S.cuenta.pilum++; avisa('pilum', { blanco: o, muertos: k });
  }

  /* ---------- el choque ---------- */
  function contactos() {
    for (const b of S.bloques) b.prev = new Set(b.contactos.map(c => c.b.id)), b.contactos = [];
    const L = S.bloques.filter(b => b.estado !== 'fuera');
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j]; if (a.bando === b.bando || !tocan(a, b)) continue;
      const ta = anguloDe(a, b), tb = anguloDe(b, a);
      a.contactos.push({ b, zona: zonaDe(a, b), peso: pesoDe(ta) }); b.contactos.push({ b: a, zona: zonaDe(b, a), peso: pesoDe(tb) });
    }
    for (const b of S.bloques) if (b.contactos.length) b.tContacto = S.T;
    for (const b of S.bloques) for (const c of b.contactos) {
      /* choque nuevo de verdad: no lo era en el paso anterior ni en los 3 s de antes (un roce que se abre y se cierra no cuenta) */
      const visto = b.visto || (b.visto = new Map()), antes = visto.get(c.b.id); visto.set(c.b.id, S.T);
      if (b.prev.has(c.b.id) || (antes != null && S.T - antes < 3)) continue;
      /* choque nuevo: el que llega cargando golpea; flanco y espalda hunden la cohesión */
      const o = c.b, zona = c.zona; if (b.id < o.id) avisa('choque', { a: b, b: o, zona });
      if (b.estado !== 'huye' && !retirando(b)) b.estado = 'choque';
      if (c.peso > 1.05) { const k = (c.peso - 1) / (ZONA.flanco - 1); b.coh = Math.max(0, b.coh - 21 * k); b.U.anima(-0.05 * Math.min(1, k)); }
      if (b === tuyo && zona !== 'frente') S.cuenta.flanqueado++;
      const cargaO = (o.orden === 'cargar' || o.cargaAl) && o.v > 1.5 && S.T - o.tImpacto > 6;   /* un golpe de carga, no uno por roce */
      if (cargaO) { o.tImpacto = S.T; o.cargaAl = false; const mismo = b.orden === 'cargar' && b.v > 1.5;
        if (!mismo) b.coh = Math.max(0, b.coh - (b.orden === 'testudo' ? 6 : 18)); avisa('carga', { de: o, a: b }); }
      if (b.tipo === 'tiradores' && b.estado !== 'huye') { b.U.anima(-0.3); }
    }
  }
  function ataque(a) {
    if (a.estado === 'huye' || a.estado === 'fuera') return 0;
    let k = K_GOLPE * a.T.atk * a.atkNivel * Math.sqrt(a.U.enPie / a.U.hombres) * (1 - 0.55 * a.fila) * (0.45 + 0.55 * a.coh / 100);
    if (a.orden === 'testudo') k *= 0.35;
    if (a.tRelevo > S.T) k *= 0.4;
    if (S.T - a.tImpacto < T_IMPACTO) k *= 2.0;
    if (a.tipo === 'galos' || a.tipo === 'nobles') k *= 1 + 0.3 * Math.max(0, 1 - (S.T - (a.tPrimer ?? S.T)) / 20); /* el ímpetu galo, que se gasta */
    k *= 1 - 0.3 * acoso(a);
    if (a.estado === 'reforma') k *= 0.3;
    if (a.estado === 'retira') k *= 0.5;   /* retrocediendo se para más de lo que se pega */
    return k;
  }
  function recibe(b) {
    let r = b.T.rec; if (b.orden === 'testudo') r *= 0.6; if (b.tRelevo > S.T) r *= 1.3; return r;
  }
  function golpes(dt) {
    const daño = new Map();
    for (const a of S.bloques) {
      if (!a.contactos.length) continue; if (a.tPrimer == null) a.tPrimer = S.T;
      const k = ataque(a) / a.contactos.length;
      for (const c of a.contactos) {
        const b = c.b, enB = c.b.contactos.find(x => x.b === a);
        /* al que huye se le pega por la espalda; a una retirada formada, por donde se le alcance; desordenada, como al que huye */
        const z = b.estado === 'huye' || (retirando(b) && b.coh < COH_ORDEN) ? ZONA.espalda : enB.peso;
        /* un frente solo cabe a tantos: si dos te atacan de frente a la vez, entre los dos pegan como 1,3 */
        const nF = b.contactos.filter(x => x.peso < 1.5).length, cabe = enB.peso < 1.5 && nF > 1 ? 1.3 / nF : 1;
        const d = k * z * cabe * recibe(b) * dt; daño.set(b, (daño.get(b) || 0) + d); a.golpes += d;
        b.coh = Math.max(0, b.coh - d * 0.5 * (1 + 2 * (enB.peso - 1) / (ZONA.flanco - 1)));
      }
    }
    for (const [b, d] of daño) {
      b.acum = (b.acum || 0) + d; const n = Math.floor(b.acum); if (n <= 0) continue;
      b.acum -= n; const k = Math.min(n, b.U.enPie); b.U.baja(k);
      for (const c of b.contactos) causa(c.b, k / b.contactos.length);
    }
  }
  /* cansancio, cohesión y ánimo de cada bloque */
  function estado(b, dt) {
    const ch = enChoque(b);
    if (!ch && b.estado === 'choque') b.estado = b.obj ? 'marcha' : 'forma';
    if (ch) b.fila = Math.min(1, b.fila + dt * b.T.cansa * (b.orden === 'testudo' ? 0.65 : b.orden === 'cargar' ? 1.4 : 1));
    else if (b.orden === 'cargar' && b.v > 1.5) b.fila = Math.min(1, b.fila + dt / 28);
    else if (b.orden === 'testudo') b.fila = Math.min(1, b.fila + dt / 200);
    else b.fila = Math.max(0, b.fila - dt / (b.orden === 'alto' ? 45 : 80));
    if (b.tRelevo > 0 && b.tRelevo <= S.T) { b.fila = 0.05; b.tRelevo = -1; b.coh = Math.min(100, b.coh + 12); }   /* la fila fresca llega formada */
    if (!ch && b.estado !== 'huye') b.coh = Math.min(100, b.coh + dt * (b.orden === 'alto' ? 6 : b.orden === 'cargar' ? 0 : 3));
    if (ch && b.U.combate() !== 'perdiendo') b.coh = Math.min(100, b.coh + dt * (b.U.combate() === 'ganando' ? 1.2 : 0.6));
    b.U.anima(-0.02 * acoso(b) * dt);
    if (b.coh < 25) b.U.anima(-0.01 * dt);
    b.U.cansancio = b.fila; b.U.tic(dt);
    if (b.fila >= AGOTADA && !b.agotada && ch) { b.agotada = true; avisa('agotada', { de: b }); }
    if (!b.cedido && !b.U.roto && b.U.animo < 0.35 && ch) { b.cedido = true; avisa('cede', { de: b }); }
    if (b.U.roto && b.estado !== 'huye' && b.estado !== 'fuera') { b.estado = 'huye'; b.orden = null; avisa('rompe', { de: b }); avisa('huye', { de: b }); moralDeRotura(b); }
  }
  function moralDeRotura(b) {
    for (const o of S.bloques) {
      if (o === b || o.U.roto) continue;
      if (o.bando === b.bando) o.U.anima(b.papel === 'centro' || b.papel === 'reserva' ? -0.15 : b.papel === 'tuyo' ? -0.2 : -0.07);
      else o.U.anima(0.05);
    }
  }

  /* ---------- las jabalinas de los tiradores galos ---------- */
  function abierto(b) { return b.orden !== 'testudo' && (b.orden === 'cargar' || b.tRelevo > S.T || enChoque(b)); }
  function tiradores(dt) {
    const t = ene.tiradores, I = S.ia; if (!vivo(t)) return;
    if (S.salva) {
      if (S.T >= S.salva.t) {
        const b = S.salva.blanco, test = b.orden === 'testudo', ch = enChoque(b);
        let k = SALVA_MUERTOS * (test ? 0.12 : b.orden === 'cargar' ? 1.3 : 1) * (ch ? 0.7 : 1) * Math.sqrt(t.U.enPie / t.U.hombres) * (0.85 + azar() * 0.3);
        k = Math.min(b.U.enPie, Math.round(k)); b.U.baja(k); causa(t, k); b.coh = Math.max(0, b.coh - (test ? 1 : 10));
        S.cuenta.salvas++; if (test) S.cuenta.salvasTestudo++; avisa('jabalinas', { muertos: k, testudo: test, blanco: b }); S.salva = null;
      }
      return;
    }
    if (I.salvas <= 0 || S.T < I.tSalva || t.estado === 'huye' || enChoque(t)) return;
    const blanco = nivel === 'facil' ? cercano(t, 'r') : vivo(tuyo) ? tuyo : cercano(t, 'r'); if (!blanco) return;
    const d = dist(centro(t), centro(blanco)); if (d > D_SALVA) return;
    let lanza = true;
    if (P.salva === 'abierto' && !ESC) lanza = blanco.orden !== 'testudo' || S.T - I.tListo > 7;   /* FU1: en el escenario lanzan siempre (dos salvas, sin esperar) */
    if (P.salva === 'acecha' && !ESC) lanza = abierto(blanco) || S.T - I.tListo > 9;
    if (I.tListo == null || I.tListo < I.tSalva) I.tListo = S.T;
    if (!lanza) return;
    I.salvas--; I.tSalva = S.T + SALVA_RECARGA; S.salva = { t: S.T + SALVA_VUELO, blanco }; avisa('salva', { t: S.salva.t, blanco });
  }
  function cercano(b, bando) {
    let m = null, dm = 1e9; for (const o of S.bloques) { if (o.bando !== bando || !vivo(o)) continue; const d = dist(o, b); if (d < dm) { dm = d; m = o; } } return m;
  }

  /* ---------- el jefe galo: piensa cada «reacción» segundos y da a cada bloque un punto del campo ---------- */
  const puntoFrente = (obj, quien) => { const c = centro(obj), cq = centro(quien), a = angHacia(c.x - cq.x, c.z - cq.z), f = fr(a);
    const r = obj.fondo / 2 + 0.6; return { x: c.x - f.x * r, z: c.z - f.z * r, ang: a }; };
  /* un punto a un lado de tu bloque (lado 1 = su derecha), «fuera» metros hacia fuera; mira hacia tu centro */
  function puntoLado(obj, lado, fuera) {
    const c = centro(obj), d = de(obj.ang), r = obj.ancho / 2 + fuera;
    const x = c.x + d.x * lado * r, z = c.z + d.z * lado * r; return { x, z, ang: angHacia(c.x - x, c.z - z) };
  }
  function ladoDebil() {
    /* el lado de tu bloque con la compañera más gastada (o sin ella); si iguales, al azar de la partida */
    const v = a => vivo(a) ? a.U.animo * (a.U.enPie / a.U.hombres) : -1, l = local(tuyo, amigas[0].x, amigas[0].z).lado < 0 ? 0 : 1;
    const izq = amigas[l], der = amigas[1 - l], a = v(izq), b = v(der);
    return Math.abs(a - b) > 0.08 ? (a < b ? -1 : 1) : lado0;
  }
  /* punto del campo a la vista de un bloque: «delante» m por delante de su primera fila y «lado» m a su derecha */
  function mundo(b, delante, lado) { const f = fr(b.ang), d = de(b.ang); const p = { x: b.x + f.x * delante + d.x * lado, z: b.z + f.z * delante + d.z * lado };
    return { ...p, ang: angHacia(centro(b).x - p.x, centro(b).z - p.z) }; }
  function ladoDe(r) { return local(tuyo, r.x, r.z).lado < 0 ? -1 : 1; }
  function piensa() {
    const I = S.ia; if (S.T - I.tPlan < P.reaccion) return; I.tPlan = S.T;
    const { centro: C, alas, reserva: R, tiradores: Ti } = ene;
    /* retirarse a formar en vez de morir quieto (Normal y Difícil) */
    /* retirarse a formar en vez de morir quieto (Normal y Difícil): la misma «Retirada» que la tuya, con su precio */
    for (const b of [C, ...alas, R]) {
      if (!vivo(b) || b.estado === 'huye' || retirando(b)) continue;
      if (b.reformas > 0 && b.U.animo < 0.3 && enChoque(b)) { b.reformas--; retirada(b, 24); continue; }
    }
    if (tuyo.U.roto && tuyo.estado === 'huye') {   /* persecución: el centro y la reserva corren tras los que huyen */
      for (const b of [C, R]) if (vivo(b) && !retirando(b)) { const c = centro(tuyo); b.obj = { x: c.x, z: c.z, ang: angHacia(c.x - b.x, c.z - b.z) }; b.orden = 'cargar'; }
      return;
    }
    const blanco = vivo(tuyo) ? tuyo : cercano(C, 'r');
    if (!blanco) return;
    /* FU1: mientras cruzas, el campo espera quieto; solo los tiradores lanzan (dos salvas). Con la segunda caída (o tras 120 s), carga el centro */
    if (ESC && S.escenario.fase === 'cruza') {
      if ((I.salvas <= 0 && !S.salva) || S.T > 120) { S.escenario.fase = 'carga'; S.escenario.tCarga = S.T; avisa('escenario', { fase: 'carga' }); }
      else { for (const b of [C, ...alas, R, Ti]) if (vivo(b)) { b.obj = null; b.orden = null; } return; }
    }
    /* una retirada en orden no se persigue (se deja ir y se toma aliento); una desordenada, sí, a la carga */
    const seVa = retirando(blanco), enOrden = seVa && blanco.coh >= COH_ORDEN;
    /* centro: va a por ti. En Difícil espera fuera del pilum mientras quedan jabalinas, y contracarga si cargas */
    if (vivo(C) && !retirando(C) && !enChoque(C) && seVa) { C.obj = enOrden ? null : puntoFrente(blanco, C); C.orden = enOrden ? null : 'cargar'; if (C.orden && !C.cargaAl) C.cargaAl = true; }
    else if (vivo(C) && !retirando(C) && !enChoque(C)) {
      const d = dist(centro(C), centro(blanco)) - C.fondo / 2 - blanco.fondo / 2;
      if (P.espera && I.fase === 'avanza' && I.salvas > 1 && S.T < 45 && blanco.orden !== 'cargar' && d < 36) C.obj = null;
      else C.obj = puntoFrente(blanco, C);
      C.orden = (d < 22 && nivel !== 'facil') || (P.contracarga && blanco.orden === 'cargar' && d < 32) ? 'cargar' : null;
      if (C.orden === 'cargar' && !C.cargaAl) C.cargaAl = true;
    } else if (vivo(C) && enChoque(C)) { C.orden = null; if (I.tChoque < 0) I.tChoque = S.T; }
    if (ESC && vivo(C) && !retirando(C) && !enChoque(C) && !seVa) { C.orden = 'cargar'; if (!C.cargaAl) C.cargaAl = true; }   /* FU1: tras las salvas, los galos cargan */
    /* alas: contra tus compañeras; en Difícil, si la rompen, vienen a tu flanco */
    alas.forEach((A, i) => {
      if (!vivo(A) || retirando(A) || enChoque(A)) { if (vivo(A) && enChoque(A)) A.orden = null; return; }
      const am = amigas.find(a => vivo(a) && Math.sign(a.x) === Math.sign(A.x)) || null;
      if (am) { A.obj = puntoFrente(am, A); const d = dist(centro(A), centro(am)); A.orden = d < 24 && nivel !== 'facil' ? 'cargar' : null; if (A.orden && !A.cargaAl) A.cargaAl = true; }
      else if (P.alasVienen && vivo(tuyo)) { A.obj = puntoLado(tuyo, ladoDe(A), 0.8); A.orden = null; }
      else A.obj = vivo(C) ? null : puntoFrente(blanco, A);
    });
    /* tiradores: se acercan a tiro y se apartan del choque */
    if (vivo(Ti) && Ti.estado !== 'huye') {
      const c = centro(blanco), cT = centro(Ti), d = dist(c, cT);
      if (I.salvas > 0 && d > D_SALVA - 4) { const k = (d - (D_SALVA - 6)) / d; Ti.obj = { x: cT.x + (c.x - cT.x) * k, z: cT.z + (c.z - cT.z) * k, ang: angHacia(c.x - cT.x, c.z - cT.z) }; }
      else if (d < 26 || I.salvas <= 0) { const a = angHacia(cT.x - c.x, cT.z - c.z), f = fr(a); Ti.obj = { x: cT.x + f.x * 10, z: cT.z + f.z * 10, ang: angDif(a + Math.PI, 0) }; }
      else Ti.obj = null;
    }
    reserva(blanco);
  }
  function reserva(blanco) {
    const I = S.ia, R = ene.reserva; if (!vivo(R) || retirando(R) || R.estado === 'huye') return;
    if (enChoque(R)) { I.fase = 'choque'; R.orden = null; return; }
    if (I.fase === 'choque' && retirando(blanco) && blanco.coh >= COH_ORDEN) { R.obj = null; R.orden = null; return; }   /* te dejan ir */
    if (I.fase === 'choque') {   /* perdió el contacto (giraste, o te soltaste): vuelve a por ti en línea recta */
      const c = centro(blanco); R.obj = { x: c.x, z: c.z, ang: angHacia(c.x - R.x, c.z - R.z) }; R.orden = 'cargar'; return;
    }
    if (!P.flanquea) {               /* Fácil: la reserva se queda quieta detrás; solo pelea si la buscas */
      const d = dist(centro(R), centro(blanco)); R.obj = d < 22 ? puntoFrente(blanco, R) : null; I.fase = d < 22 ? 'frente' : 'quieta'; return;
    }
    if (I.fase === 'avanza') {
      /* Normal: suelta la reserva cuando el centro ya te tiene fijado. Difícil: además espera a que tu fila se canse */
      const fijo = I.tChoque >= 0 && S.T - I.tChoque >= (nivel === 'dificil' ? 4 : 8);
      const listo = !P.espera || blanco.fila >= 0.45 || blanco.tRelevo > S.T || blanco.relevos === 0 || S.T - I.tChoque > 22;
      if (!fijo || !listo) { /* sigue al centro, 14 m detrás */
        const C = ene.centro; if (vivo(C)) { const c = centro(C), f = fr(C.ang); R.obj = { x: c.x - f.x * 14 + lado0 * 4, z: c.z - f.z * 14, ang: C.ang }; } return; }
      I.lado = ladoDebil(); if (I.finta) I.lado = -I.lado; I.fase = 'rodea';
      S.flanco = { lado: I.lado, de: R, finta: I.finta }; avisa('flanco', { lado: I.lado, de: R, finta: false });
    }
    if (I.fase === 'rodea') {
      /* finta (Difícil): amaga un lado; cuando ya estás girando hacia él, o a 24 m, entra por el otro */
      const dC = dist(centro(R), centro(blanco));
      if (I.tRodea == null) I.tRodea = S.T;
      if (I.finta && !I.fintaHecha && S.T - I.tRodea > 6 && (dC < 24 || Math.abs(angDif(blanco.ang, I.angVisto ?? blanco.ang)) > 15 * GRADO)) {
        I.fintaHecha = true; I.lado = -I.lado; I.ataque = null; I.ruta = null; S.cuenta.fintas++; S.flanco = { lado: I.lado, de: R, finta: true };
        avisa('finta', { lado: I.lado }); avisa('flanco', { lado: I.lado, de: R, finta: true });
      }
      if (I.angVisto == null) I.angVisto = blanco.ang;
      /* rodea por fuera y entra de lado. La ruta (esquina de fuera y costado) se fija en el CAMPO al decidir: si giras, no te
         sigue. Difícil, si te ve girar más de 30° antes de llegar, rehace la ruta una vez (otro rodeo). Al acabarla, o a 15 m, carga */
      const fuera = blanco.ancho / 2 + 8;
      const ruta = () => { const l = local(blanco, centro(R).x, centro(R).z), alLado = Math.sign(l.lado) === I.lado && Math.abs(l.lado) > blanco.ancho / 2 + 4;
        I.angRuta = blanco.ang; return alLado ? [mundo(blanco, -blanco.fondo / 2, I.lado * fuera)] : [mundo(blanco, 16, I.lado * fuera), mundo(blanco, -blanco.fondo / 2, I.lado * fuera)]; };
      if (!I.ruta) I.ruta = ruta();
      if (!I.ataque && nivel === 'dificil' && !I.rodeo && Math.abs(angDif(blanco.ang, I.angRuta)) > 30 * GRADO) { I.rodeo = true; I.ruta = ruta(); }
      if (!I.ataque) {
        while (I.ruta.length && dist(R, I.ruta[0]) < 3) I.ruta.shift();
        if (!I.ruta.length || dC < 15) I.ataque = puntoLado(blanco, I.lado, 0.6);
      }
      R.obj = I.ataque || I.ruta[0];
      R.orden = I.ataque && P.cargaReserva ? 'cargar' : null; if (R.orden && !R.cargaAl) R.cargaAl = true;   /* en Normal entra andando: menos golpe */
      S.flanco = { lado: I.lado, de: R, finta: I.fintaHecha };
    }
  }

  /* ---------- un paso ---------- */
  function paso(dt = DT) {
    if (S.ganador) return;
    S.T += dt;
    piensa();
    mueveTuyo(dt);
    for (const b of amigas) if (b.estado !== 'fuera') amiga(b, dt);
    for (const b of S.bloques) {
      if (b.bando !== 'g' || b.estado === 'fuera') continue;
      if (b.U.roto) mueveHuida(b, dt); else mueve(b, dt);
    }
    contactos();
    for (const b of S.bloques) if (!b.U.roto && retirando(b)) rehace(b, dt); golpes(dt); if (B) bajasB(MO, B, tuyo.U.enPie);
    for (const b of S.bloques) {
      if (b.estado === 'fuera') continue;
      if (b.orden === 'cargar' && enChoque(b) && S.T - b.tImpacto >= T_IMPACTO) b.orden = null;   /* tras el golpe, a pelear */
      estado(b, dt);
    }
    tiradores(dt); if (B) bajasB(MO, B, tuyo.U.enPie);
    if (S.flanco && (!vivo(S.flanco.de) || enChoque(S.flanco.de))) S.flanco = null;
    const u = ordenUtil(); if (u !== kIlumina) { kIlumina = u; if (u) avisa('ilumina', { n: u }); }
    fin();
  }
  function amiga(b, dt) {
    if (b.U.roto) return mueveHuida(b, dt);
    /* ES2: una compañera con orden del mando (js/mando-varios.js) carga o para como tu manípulo; sin orden, todo como antes */
    if (b.orden === 'cargar' && !enChoque(b)) {
      const v = delanteDe(b, 80, 70 * GRADO);
      if (v) { const c = centro(v.o), f = fr(b.ang), k = v.o.fondo / 2 + 8; b.obj = { x: c.x + f.x * k, z: c.z + f.z * k, ang: b.ang };
        if (v.o.estado === 'huye' || retirando(v.o)) b.coh = Math.max(0, b.coh - 2.5 * dt); } else b.obj = null;
    }
    if (b.orden === 'alto') b.obj = null;
    if (enChoque(b) && b.fila >= AGOTADA && b.relevos > 0 && b.tRelevo < S.T) { b.relevos--; b.tRelevo = S.T + T_RELEVO; }
    mueve(b, dt);
    if (b.orden === 'marcha' && !b.obj) b.orden = null;
  }
  /* ES2: las órdenes y el frente de cualquier bloque tuyo (la falange es S.tuyo; los manípulos, S.amigas). Para tuyo, las de siempre */
  function ordenDe(b, n) {
    if (b === tuyo) return orden(n);
    if (S.ganador || !ORDENES.includes(n) || b.U.roto || b.estado === 'fuera' || b.estado === 'retira') return false;
    if (n === 'retirada') return retirada(b, D_RETIRA);
    if (b.estado === 'reforma') b.estado = enChoque(b) ? 'choque' : 'forma';
    if (n === 'testudo' && b.orden === 'testudo') { b.orden = 'alto'; b.tOrden = S.T; b.obj = null; return true; }
    if (n === 'relevo') { if (b.relevos <= 0 || b.tRelevo > S.T) return false; b.relevos--; b.tRelevo = S.T + T_RELEVO; b.coh = Math.max(0, b.coh - 4); S.cuenta.relevos++; b.agotada = false; return true; }
    if (n === 'cargar') { if (b.orden !== 'cargar') { S.cuenta.cargas++; b.cargaAl = true; } b.obj = null; }
    if (n === 'alto') b.obj = null;
    b.orden = n; b.tOrden = S.T; return true;
  }
  function frenteDe(b, o) {
    if (b === tuyo) return frente(o);
    if (S.ganador || !o || b.U.roto || b.estado === 'fuera' || b.estado === 'retira') return;
    b.obj = { x: o.x, z: o.z, ang: o.ang }; if (b.orden === 'cargar' || b.orden === 'alto' || b.orden === null) b.orden = 'marcha';
  }
  function fin() {
    const { centro: C, reserva: R, alas } = ene;
    if (tuyo.U.roto) {
      /* tu manípulo rompe: los galos le persiguen T_PERSIGUE s (los caídos de la huida también cuentan) */
      if (S.tRoto == null) { S.tRoto = S.T; S.causaRoto = flanqueado(tuyo) || S.cuenta.flanqueado ? 'flanco' : 'bajas'; }
      if (S.T - S.tRoto < T_PERSIGUE && tuyo.estado !== 'fuera') return;
      S.ganador = 'enemigo'; S.causa = S.causaRoto;
    }
    else if (!vivo(C) && (!vivo(R) || !enChoque(R))) { S.ganador = 'tuyo'; S.causa = vivo(R) ? 'centro' : 'rompe'; }   /* «Rompe su línea»: roto el centro, el jefe se retira si no está ya en el choque */
    else if (S.T >= T_MAX) { S.ganador = 'tablas'; S.causa = 'tiempo'; }
    else return;
    for (const b of S.bloques) if (b.U.roto && b.estado !== 'fuera') b.estado = 'huye';
    void alas; avisa('fin', { ganador: S.ganador, causa: S.causa });
  }

  /* ---------- bots ---------- */
  function bot(modo = 'bueno') {
    if (S.ganador || modo === 'quieto' || S.T - tBot < 0.5) return; tBot = S.T;
    const no = { sinOrdenes: ['testudo', 'relevo', 'cargar'], sinTestudo: ['testudo'], sinRelevo: ['relevo'], sinCargar: ['cargar'] }[modo] || [];
    let u = ordenUtil(modo !== 'retira');   /* solo el bot «retira» se retira; los demás aguantan (como en LP2) */
    if (u && no.includes(u)) u = null;
    if (u) orden(u);
    else if (no.includes('testudo') && tuyo.orden === 'testudo') orden('alto');
    /* el flanco: cuando su jefe se acerca por un lado, redibuja el frente hacia él (giroUtil) */
    if (S.T - tGiro > 3) { const g = giroUtil(); if (g) { tGiro = S.T; const prev = tuyo.orden; frente(g); if (prev === 'testudo') tuyo.orden = 'testudo'; } }
  }
  /* ---------- girar hacia su jefe (LP4b, pedido del usuario 24/11: «4B») ----------
     El jefe que viene: el del aviso de flanco; y, si ya te retiraste y te rehiciste, su reserva aunque ya no haya aviso
     (al soltarte te deja ir y luego vuelve a por ti en línea recta, casi siempre por un lado). */
  function jefeQueViene() {
    if (S.flanco && vivo(S.flanco.de)) return S.flanco.de;
    const R = ene.reserva;
    if (tuyo.vueltas > 0 && vivo(R) && !retirando(R) && R.estado !== 'huye') return R;
    return null;
  }
  /* el frente que conviene dibujar ahora: cuando su jefe está cerca (D_BOT) y se te va a más de OFF_BOT del frente, girar hacia
     él sin dar la espalda al centro galo (que los dos queden dentro del frente), nunca más de 50° de una vez. Si no, null */
  function giroUtil() {
    if (S.ganador || tuyo.U.roto || tuyo.estado === 'retira') return null;   /* rehaciéndose sí se puede ir girando */
    const J = jefeQueViene(); if (!J) return null;
    const c = centro(tuyo), r = centro(J), dC = dist(r, c), aR = angHacia(r.x - c.x, r.z - c.z), off = angDif(aR, tuyo.ang);
    const lejos = tuyo.vueltas && J === ene.reserva && !S.flanco ? D_BOT_VUELTA : D_BOT;   /* tras rehacerte, con tiempo: girar pesa */
    if (!(dC < lejos && Math.abs(off) > OFF_BOT * GRADO)) return null;
    const C0 = vivo(ene.centro) && enChoque(tuyo) ? centro(ene.centro) : null, l = Math.sign(off);
    let a = aR - l * 30 * GRADO;
    if (C0) {   /* con el centro galo encima: si caben los dos en el frente, mira entre ambos; si no, deja el centro a 50° */
      const aC = angHacia(C0.x - c.x, C0.z - c.z), dd = angDif(aC, a), abre = angDif(aR, aC);
      if (Math.abs(dd) > 50 * GRADO) a = Math.abs(abre) < 2 * ANG_FRENTE - 6 * GRADO ? aC + abre / 2 : aC - Math.sign(dd) * 50 * GRADO;
    }
    a = tuyo.ang + lim(angDif(a, tuyo.ang), -50 * GRADO, 50 * GRADO);
    return { x: tuyo.x, z: tuyo.z, ang: angDif(a, 0), de: J };
  }
  function resumen() {
    const muertosG = S.bloques.filter(b => b.bando === 'g').reduce((s, b) => s + b.U.hombres - b.U.enPie, 0);
    return { ganador: S.ganador, causa: S.causa, T: +S.T.toFixed(1), nivel, perdidos: tuyo.U.hombres - tuyo.U.enPie, enPie: tuyo.U.enPie,
      matados: muertosG, flanqueado: S.cuenta.flanqueado > 0, ...S.cuenta, reservaFase: S.ia.fase, ladoReserva: S.ia.lado };
  }
  /* CB3: una baja que decide el motor de lucha (combate-tropas.js): cuenta como las de golpes() */
  function baja(b, n = 1) {
    const k = Math.min(n, b.U.enPie); if (k <= 0) return 0; b.U.baja(k);
    if (LUCHA) b.acum = Math.max(-DEUDA, (b.acum || 0) - k);   /* lo que ya tumbó el motor no lo tumban las reglas */
    for (const c of b.contactos) causa(c.b, k / b.contactos.length);
    if (B && b === tuyo) bajasB(MO, B, tuyo.U.enPie);
    return k;
  }
  S.lucha = LUCHA ? 'motor' : 'reglas';
  return { S, paso, orden, ordenDe, frenteDe, baja, frente, dibujaFrente, ordenUtil: () => ordenUtil(), giroUtil, bot, resumen, trabado: () => trabado(tuyo) };
}

/* una partida entera con un bot (para las pruebas y el juez) */
export function juega(nivel, modo, semilla, dt = DT, motor = null) {
  const C = crearCombate({ semilla, nivel, motor });
  while (!C.S.ganador) { C.bot(modo); C.paso(dt); }
  return C.resumen();
}
