/* AQVILA — FA1: las reglas de la falange a pie, sin pantalla (corre en Node y en el navegador). Módulo ES.
   Tú eres el oficial (lochagos) en el centro de la primera fila. No dibuja ni suena: todo sale por avisa(tipo, datos).

   ===================== CONTRATO COMÚN DE LA FALANGE (lo fija FA1; no se cambia sin avisarlo en el parte) =====================
   import { crearFalange } from './falange.js';
   const F = crearFalange(m);
     m = { semilla,            número: misma semilla, misma partida (por defecto 1)
           rival,              módulo del rival { nombre, crea(S, azar), paso(S, dt), choque(S, h) }; por defecto MANIPULOS
           avisa,              función (tipo, datos) hacia pantalla y sonido; en Node, nada
           H,                  función (x, z) → altura del suelo; por defecto 0
           hombres,            falangitas (12 de frente; por defecto 96)
           terreno,            { x, z, r } del trozo roto, null para ninguno; si falta, sale al azar con la semilla
           locomocion }        opcional { crearPaso, velocidad, pisa } (la de la maqueta) para que los pies no patinen
   F = { S, reinicia(), paso(dt), toque(), estocada(), gira(dir), fila(i, abajo), orden(n), marcado(), frente(), bot(modo), resumen() }

   EL ESTADO S (lo lee la escena para dibujar; los rivales lo leen y escriben solo lo suyo)
     S.T                 segundos de partida
     S.fase              'marcha' | 'choque' | 'fin'           S.ganador  null | 'falange' | 'rival'     S.causa  'empuje' | 'bajas' | 'flanco' | 'hueco' | 'animo'
     S.rival             'manipulos' | 'caballeria' | 'elefantes' | 'falange' | 'hoplitas' (el nombre del módulo)
     S.xF, S.zF          el pivote del muro: el centro de la primera fila, en el mundo
     S.giro              radianes; 0 = el muro mira a −z; positivo = ha girado a su derecha (+x). Gira a V_GIRO (8°/s), tope ±90°
     S.girando           −1 | 0 | 1: hacia dónde está girando ahora
     S.filas[5]          true = esa fila lleva la sarisa bajada (0 = la primera). Bajadas ensartan y cansan; alzadas paran proyectiles
     S.flanco            null | { lado: −1 | 1, hombres: [...], t0, tI, estado: 'viene' | 'parado' | 'dentro' }
                         lado 1 = por la derecha del muro. hombres son hombres de verdad de S.ene (andan por el campo). tI = cuándo llegan
     S.pulso             0–1: por dónde va el compás (0 = el «¡Ha!»). Un latido cada PULSO s; vale el toque a ±VENTANA s
     S.orden             null | 'aguantar' | 'empujar' | 'cerrar' | 'retroceder'
     S.coh               cohesión del muro, 0–100             S.ganado   metros ganados empujando desde el choque
     S.yo                { i, tEstocada, blanco, muertes }: tu índice en S.fal, cuándo clavaste por última vez, a quién marcas (o null)
     S.fal[]             tus hombres { i, f (columna), r (fila entre los vivos), r0, x, z, yaw, vivo, huye, muere, kB (0 alzada–1 bajada), tG }
     S.ene[]             los del rival { i, x, z, yaw, vivo, muere, est, tipo, toca }. est es del rival, salvo 'dentro' y 'huye', que entiende el motor
                         tipo: 'infante' | 'jinete' | 'elefante' | 'piquero'.  toca: null | 'puntas' | 'frente' | 'der' | 'izq' | 'espalda'
     S.U, S.R            las dos unidades (crearUnidad): enPie, animo, cansancio, roto. S.R la crea el rival en crea()
     S.terreno           null | { x, z, r }: el trozo roto. S.enRoto = parte de la primera fila que lo pisa (0–1)
     S.proyectiles[]     { est, p, dir, ... } pila y demás en vuelo (est 0 libre, 1 vuela, 2 clavado en asta, 3 escudo, 4 hombre, 5 suelo)
     S.motor             lo que el motor presta a los rivales (abajo)

   GEOMETRÍA. frente = (sen giro, −cos giro); derecha = (cos giro, sen giro). El hombre de columna f y fila r está en
     pivote + lx·derecha − r·DZ·frente, con lx = (f − (FILES−1)/2)·DX, y mira con yaw = π − giro.
   Las puntas cubren un rectángulo por delante de la primera fila: de 0 a frente() metros y el ancho del muro. Quien llega por ahí
   toca 'puntas'; quien llega al cuerpo por otro sitio toca 'frente' (sin puntas), 'der', 'izq' o 'espalda'.

   LOS RIVALES son módulos { nombre, crea(S, azar), paso(S, dt), choque(S, h) }:
     crea(S, azar)     mete sus hombres en S.ene y su unidad en S.R
     paso(S, dt)       los mueve y decide (cargar, lanzar, mandar un flanco con S.motor.flanco)
     choque(S, h)      el motor la llama cuando h cambia de h.toca (acaba de llegar a las puntas o al cuerpo). El rival decide qué le
                       pasa con las ayudas del motor (ensartarlo, que entre, que recule)
   S.motor = { azar(), avisa(tipo, datos),
     local(x, z)             → { delante, lado, ang }: metros por delante de la primera fila, a la derecha del pivote, y el ángulo
     puesto(f, r)            → { x, z } del puesto de columna f y fila r
     frente()                → metros que salen las puntas por delante de la primera fila (0 si no hay filas bajadas)
     bajadas()               → cuántas de las cinco filas están bajadas
     mueve(h, tx, tz, v, dt)   mueve a un hombre hacia un punto, con su paso
     ensarta(h, p)           → true si cae en las puntas (tirada p por fila bajada; por defecto P_ENSARTA)
     entra(h, por)             h se cuela ('frente' | 'der' | 'izq' | 'espalda'): pasa a est 'dentro' y el motor le hace matar
     caeRival(h), caeFalangita(h, causa), cohesion(x)
     flanco(lado, hombres, aviso)   declara el flanco: llena S.flanco y avisa('flanco', { lado, hombres })
     proyectil(desde, blanco, vuelo)   lanza un proyectil contra un falangita; al llegar, el motor tira si lo para un asta alzada }
   La escena monta el dibujo de cada rival llamando a montaRival(ctx) del archivo del rival, si existe (FA4 y FA7).

   AVISOS (avisa): 'pulso' · 'ha' { metros } · 'destiempo' · 'grito' { texto } · 'fila' { i, abajo } · 'gira' { dir } · 'flanco' { lado, hombres } ·
     'flancoParado' · 'flancoEntra' { lado } · 'dentro' { h, por } · 'cae' { h, quien } · 'estocada' { h, acierta } · 'choque' · 'salva' ·
     'clava' | 'escudo' | 'tierra' { p } · 'roto' { dentro } · 'rompe' { ganador, causa } · 'fin'

   HISTORIA (plan FA0 §5; skill historia). Histórico: oficial en la primera fila que clava su sarisa (Asclepiódoto 2); cinco puntas por
   delante y astas alzadas que frenan proyectiles (Polibio 18.29–30); flanco débil y terreno roto que abre el muro (Polibio 18.31–32;
   Pidna, Plutarco, Emilio 20). Licencia de juego: el compás a toques, los gestos, las tiradas de dado, 96 hombres en 8 filas (una
   sintagma tenía 16 de fondo), que el frente romano afloje mientras el flanco rodea, y que un giro de 8°/s baste para encarar. */

export const FILES = 12, DX = 0.78, DZ = 0.95, BAJAN = 5;          /* 12 de frente, prietos (Polibio: unos 3 pies); bajan cinco filas */
export const SARISA = 6.3, AGARRE = 1.7, ALCANCE = SARISA - AGARRE - 0.25;   /* cuánto sale la punta de la primera fila */
export const PULSO = 1.6, VENTANA = 0.2;                            /* el compás (s) y su ventana (±s). TP9-0 §2.7 */
export const V_GIRO = 8 * Math.PI / 180, GIRO_MAX = Math.PI / 2;    /* el muro gira con peso: 8° por segundo */
export const AVISO_FLANCO = 8;                                      /* segundos entre el aviso y la llegada del flanco */
export const META = 15;                                             /* metros que hay que ganar para que el rival ceda */
export const PASO_HA = 0.5, P_ENSARTA = 0.05, P_PARA_PILA = 0.6;    /* medio metro por «¡Ha!»; tirada por fila bajada; 6 de cada 10 pila con todo alzado */
export const ORDENES = ['aguantar', 'empujad', 'cerrar', 'retroceder'];
export const BOTS = ['compas', 'destiempo', 'nogira', 'loco'];
export const RIVALES = ['manipulos', 'caballeria', 'elefantes', 'falange', 'hoplitas'];

/* El rival de manípulos (primer módulo). ESQUELETO: lo rellena FA1 en esta misma sesión */
export const MANIPULOS = { nombre: 'manipulos', crea(S, azar) {}, paso(S, dt) {}, choque(S, h) {} };

/* ESQUELETO del contrato: el estado con sus campos y las órdenes sin efecto. Las reglas llegan en el siguiente commit de FA1 */
export function crearFalange(m = {}) {
  const rival = m.rival || MANIPULOS, avisa = m.avisa || (() => {});
  const S = {};
  function reinicia() {
    Object.assign(S, { T: 0, fase: 'marcha', ganador: null, causa: null, rival: rival.nombre, xF: 0, zF: -10, giro: 0, girando: 0, filas: [false, false, false, false, false],
      flanco: null, pulso: 0, orden: null, coh: 100, ganado: 0, yo: { i: FILES / 2 - 1, tEstocada: -9, blanco: null, muertes: 0 }, fal: [], ene: [], U: null, R: null,
      terreno: null, enRoto: 0, proyectiles: [], motor: { avisa } });
  }
  reinicia();
  return { S, reinicia, paso(dt) { S.T += dt; S.pulso = (S.T % PULSO) / PULSO; }, toque() { return null; }, estocada() { return null; }, gira(dir) { S.girando = Math.sign(dir || 0); },
    fila(i, abajo) { if (i >= 0 && i < BAJAN) S.filas[i] = abajo === undefined ? !S.filas[i] : !!abajo; }, orden(n) {}, marcado() { return null; }, frente() { return 0; }, bot(modo) {}, resumen() { return {}; } };
}
