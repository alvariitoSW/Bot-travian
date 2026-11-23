/* AQVILA — LP1: el bloque y el frente dibujado, sin pantalla (corre en Node y en el navegador). Módulo ES.
   Diseño: gobierno/estudios/LP0-como-se-pelea-a-pie.md (§2, §3, §6 comprobaciones 1 y 2). Prueba: node test/bloque.test.mjs

   ===================== CONTRATO DEL BLOQUE (lo fija LP1; no se cambia sin avisarlo en el parte) =====================
   Mandas UNA unidad (un bloque de 120–160 hombres), no a un hombre. La mueves dibujando el frente: una raya en el suelo.
   Al soltar, el bloque gira como una puerta (el ala de fuera anda más) y marcha hasta que su primera fila queda sobre la raya.
   El enemigo vive en el campo: nada de lo que hace tu bloque mueve a nadie del otro bando (no hay cámara aquí).

   import { crearBloque, dibujaFrente, paso, crearCampo, pasoCampo, ... } from './bloque.js';

   EJES (los de js/falange.js): metros, suelo x–z. Rumbo a en radianes: frente = (sen a, −cos a); derecha = (cos a, sen a).
     a = 0 mira a −z; a positivo = ha girado a su derecha (+x). Un hombre mira con yaw = π − a (dirección (sen yaw, cos yaw)).

   const B = crearBloque(o)
     o = { id, bando ('yo' | 'amigo' | 'rival'), tipo ('manipulo' | 'falange' | 'banda'), x, z (centro de la primera fila),
           rumbo, hombres, cols (de frente), dx, dz (hueco entre hombres de lado y de fondo), avisa (tipo, datos) }
           Lo que falte sale de TIPOS[tipo].
   EL ESTADO B (lo lee la escena para dibujar; LP2 lo lee y escribe solo B.mods, B.orden y la vida de los hombres)
     B.id, B.bando, B.tipo
     B.x, B.z            el ancla: centro de la primera fila, en el mundo (se mueve con peso, nunca salta)
     B.rumbo             radianes (arriba)
     B.cols, B.filas     hombres de frente y de fondo (filas = ceil(vivos / cols))
     B.dx, B.dz          huecos (m)
     B.ancho, B.fondo    metros de la primera fila de punta a punta ((cols−1)·dx) y de la primera a la última ((filas−1)·dz)
     B.frente            { p0, p1 }: las dos puntas de la primera fila AHORA (p0 la de la izquierda, p1 la de la derecha)
     B.meta              null | { x, z, rumbo, cols, p0, p1 }: el frente dibujado al que va
     B.fase              'quieto' | 'gira' | 'marcha' | 'forma'   (forma = el ancla llegó y los hombres acaban de colocarse)
     B.bisagra           null | { x, z }: el punto de la primera fila sobre el que gira ahora (la bisagra de la puerta)
     B.coh               cohesión 0–100: baja si los hombres van lejos de su hueco o marchan de lado o hacia atrás; sube quieto
     B.hombres[]         { i, col, fila, x, z, yaw, vivo, desvio }: col y fila son su puesto; desvio = metros a su hueco ahora
     B.mods              { vel: 1, giro: 1 }: multiplicadores que pone LP2 (testudo despacio, carga deprisa). LP1 solo los lee
     B.orden             null | texto: la orden que lleva (la escribe LP2; LP1 no la mira)
     B.T                 segundos que lleva vivo el bloque

   FUNCIONES
     dibujaFrente(B, p0, p1, op)  → la meta puesta, o null si no se pudo (puntos no válidos).
                    p0, p1 = { x, z }: la raya. La primera fila quedará sobre ella, centrada en su punto medio.
                    Mira hacia el lado de la raya que queda más cerca de donde mira ahora (no se da media vuelta por dibujar
                    al revés); op.sentido = 'dibujo' obliga a mirar a la izquierda del trazo (como trazar de izquierda a derecha).
                    Una raya de CORTA m o más fija el ancho (cols); más corta, solo mueve y gira con el ancho de antes.
                    La raya se recorta al campo (op.campo = { ancho, largo }, centrado en 0,0) y el ancho a COLS_MIN–COLS_MAX.
     paso(B, dt)        avanza dt segundos (dt grandes se trocean). Mueve el ancla y el rumbo, luego a cada hombre hacia su hueco.
     puesto(B, col, fila) → { x, z }: el hueco de ese puesto con el ancla y el rumbo de ahora
     local(B, x, z)     → { delante, lado }: metros por delante de la primera fila y a la derecha del ancla
     cierraFilas(B)       reparte los puestos entre los vivos (los de atrás pasan a cubrir los huecos de delante). Lo llama LP2
     formado(B)         → true si no tiene meta pendiente y todos están a menos de LLEGA m de su hueco
     resumen(B)         → { id, x, z, rumbo, grados, cols, filas, coh, fase, vivos, desvioMax, desvioMedio }

   EL CAMPO (tu unidad, sus compañeras y el enemigo; la IA del enemigo la pone LP2)
     const C = crearCampo(m)
       m = { semilla, avisa, campo: { ancho, largo }, yo: o, amigas: [o, o], rivales: [o, ...], ia }
           ia = null | función (C, dt) que da las órdenes a los rivales y a las amigas, SIEMPRE con dibujaFrente (LP2).
           Sin ia, rivales y amigas se quedan donde están (o van a la meta que les pongas).
     C = { T, azar, campo, yo, amigas[], rivales[], todos[], avisa }
     manda(C, p0, p1, op)   dibuja el frente de tu bloque (C.yo). Con op.amigas = true, las amigas se ponen a tus lados en la misma línea
     pasoCampo(C, dt)       llama a C.ia (si hay) y da paso() a todos los bloques
     botFrente(C, modo)     bots de prueba: 'bien' (frentes limpios, espera a formar), 'mal' (al revés, cortos, fuera del campo,
                            redibuja a medio girar), 'nada' (no dibuja). Devuelve la raya que dibujó o null

   AVISOS (avisa(tipo, datos)): 'frente' { id, p0, p1, rumbo, cols } · 'corta' { id } (raya corta: solo mueve) ·
     'recortado' { id } (la raya se salía del campo) · 'gira' { id, grados, bisagra } · 'marcha' { id, metros } ·
     'formado' { id, t } · 'desorden' { id, coh } (la cohesión baja de 50) · 'ordenado' { id, coh } (vuelve a 70)

   HISTORIA (skill historia). Manípulo de 120 hombres (hastati y principes; los triarios, 60): histórico (Polibio 6.21–24).
   Formación en filas con un hueco de unos 3 pies por hombre: histórico (Polibio 18.28–30). Girar el frente pivotando sobre
   un extremo (la «conversio»): probable para la época, descrita en tratados tácticos posteriores (Asclepiódoto 10; Arriano,
   Táctica). Licencia de juego: dibujar el frente con el dedo, todas las velocidades y cifras de este archivo, que el ancho
   del frente cambie solo con la raya y que los hombres corran a su hueco sin chocar entre sí (las físicas son de FI1). */

/* Primer commit: solo el contrato. Las funciones llegan en el siguiente. */
const falta = () => { throw new Error('LP1: por construir'); };
export const crearBloque = falta, dibujaFrente = falta, paso = falta, puesto = falta, local = falta, cierraFilas = falta,
  formado = falta, resumen = falta, crearCampo = falta, manda = falta, pasoCampo = falta, botFrente = falta;
