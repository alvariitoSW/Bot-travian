# K6b · Fusión del concurso y dónde encaja en el juego (17/11/2026)
Solo estudio: no toca `js/`. El gobierno ya decidió por el usuario: mezcla A+B, quitar las tarjetas y cuatro órdenes.
Mirado: las diez capturas K6, el código de la batalla, tablero, bitácora y **el juego real en un navegador** (§6).

## Lo que hay hoy (importa para todo lo demás)
- La batalla del juego es `js/ui-guerra.js` (GC4): campo 3D con soldados de 0 A.D., **tres cuerpos** (ala izquierda,
  centro, ala derecha) más los jinetes, **cuatro órdenes** (Empujar, Aguantar, Relevo, Caballería) y «Retirarse» arriba.
- Las maquetas K6 mandan 10 a 20 regimientos sueltos con seis órdenes, vistos desde arriba en 2D. Eso **no existe en
  el motor**: en GM10 se decidió «cuatro piezas, no veinte» y tú elegiste el manejo «tocar y elegir».
- Por eso K6 no sustituye la batalla: le presta **cómo se lee** y **cómo se ordena la franja de abajo**.
- Ya está en el juego sin que se note: la tela del estandarte encoge con la moral (idea de D) y la franja fija de
  botones (idea de B). En horizontal esa franja son 7 bloques de lado a lado: tapa un 16,6 % de la pantalla (medido);
  con los rótulos y «Retirarse», un 19,9 %.

## 1. Veredicto
- **A bloques: fusionar su lectura.** Icono por tipo de tropa y anillo de moral, encogidos a un «sello» sobre cada
  cuerpo. Se descarta su menú flotante (tapa tropas) y sus dos cajas de abajo.
- **B miniaturas: fusionar su manejo.** Tocar la tropa y ordenar abajo, sin menús. Sus soldaditos dibujados sobran
  (ya hay soldados 3D) y sus rótulos con nombre siempre a la vista se pisan.
- **D estandartes: rescatar una idea.** Pintar el tipo de tropa en la tela del estandarte 3D (te gustó en K10).
- **C trazo: rescatar una idea.** La flecha en el suelo que enseña la orden recién dada. Dibujar con el dedo, no.
- **E cartas: descartar en la batalla.** Tapan el campo. Solo vale la palabra de estado junto a la tropa
  («cansado», «rodeado»); sus tácticas ya son las cinco disposiciones del despliegue (GM21).

## 2. La fusión
Horizontal, 844×390. El campo 3D ocupa toda la pantalla; el centro de abajo queda libre.
```
[⚑ Retirarse]        «Los galos cargan por la izquierda»              [❚❚ Pausa]

                      (◔)      (◕)      (◕)              (◔)♞ jinetes enemigos
                     ▓▓▓▓▓    ▓▓▓▓▓    ▓▓▓▓▓    enemigo, 3D
                     ░░░░░    ░░░░░    ░░░░░    tus tropas, 3D
                      (◕)••    (◑)••    (◕)••
                             [marca dorada]                  [ Empujar ][Aguantar ]
[◀ CENTRO ▶          ]         ♞♞♞♞ (◕)                      [ pega más][ −bajas  ]
[1 020 h · moral ▮▮▮▯]     tus jinetes, a la vista           [ Relevo  ][Caballería]
 pulgar izquierdo                                              pulgar derecho
```
- **En el campo (siempre):** un sello redondo de 36 px por cuerpo. Los del enemigo van **encima** de su tropa (donde
  hoy están sus rótulos) y los tuyos **debajo** de la tuya: en el choque los dos bandos se tocan y no caben en medio. Dentro, el icono del tipo que
  lucha delante (escudo, lanza, jabalina, caballo, elefante). El borde es el anillo de moral: se vacía y pasa de verde
  a rojo. El aro exterior dice el bando (rojo Roma, morado rival). Debajo, un punto por cada línea de reserva, verde,
  ámbar o rojo según su cansancio. Sin nombre ni números.
- **Palabra de estado:** solo cuando cambia y 3 segundos: «cargan», «flaquean», «cansados», «rodeado» (≥11 px).
- **Fijo abajo:** a la izquierda, una ficha del cuerpo elegido (nombre, hombres, moral, líneas) con ◀ ▶ para cambiar.
  En la esquina derecha, las cuatro órdenes en dos filas de dos (100×48 px cada una) con su línea de «qué da y
  qué cuesta». La franja baja del 16,6 % al 10 % (cálculo); todo lo fijo junto, del 19,9 % al 15 % aproximadamente.
- **Al tocar:** la tropa en el suelo la elige (ya funciona así) y se enciende la marca dorada. Tocar un sello abre sus
  números 3 s (hombres por línea). Tocar un enemigo enseña su ficha. Nunca sale un menú encima de las tropas.
- **Si otro cuerpo te necesita:** su sello late y la ficha avisa («◀ Ala izquierda pide relevo»). **Pausa:** botón
  arriba a la derecha; parado, todos los sellos enseñan números y estado, y se puede ordenar.
- **Con 20 o más regimientos:** hoy no pasa. Un ejército de 5 000 hombres no son más piezas: son líneas más gordas.
  Máximo 8 sellos (3 tuyos, 3 enemigos, 2 de jinetes). Si un día llegan los manípulos (GM22), tres reglas: de lejos
  un sello por cuerpo; solo el cuerpo elegido despliega los sellos de sus líneas; dos sellos a menos de 40 px se
  funden en uno con «×3». El dedo siempre toca la tropa, no el sello.
- **Vertical:** solo cambian los sellos; las tres tarjetas de abajo se quedan (ahí no estorban). K6 no diseñó vertical.

## 3. Dónde encaja
| Pieza de hoy | Qué pasa |
|---|---|
| Soldados 3D, suelo, cámara, sonido, reglas, guardado | Se conservan tal cual |
| Estandartes 3D cuya tela encoge con la moral | Se conservan; ganan el icono del tipo (idea D) |
| Marca dorada del cuerpo elegido y elegir tocando el campo | Se conservan |
| Rótulos del enemigo («cargan» con barrita) | **Se sustituyen** por sellos, y los tuyos también los llevan |
| Tres tarjetas de cuerpo abajo (horizontal) | **Se sustituyen** por una ficha; sus escudos pasan a los puntos del sello |
| Cuatro botones de orden | Se conservan; se juntan a la derecha |
| Aviso de una línea arriba | Se conserva |
| Pausa (el motor ya sabe pararse; no hay botón) | **Se añade** el botón |

Cuándo se nota:
- **Marcha** (7 s hasta el choque): los sellos dicen qué tropa tienes delante antes de chocar.
- **Choque:** anillo, puntos de reserva y palabra de estado; la flecha en el suelo confirma la orden. **Pausa:** leer y ordenar.
- **Despliegue:** aún no está en el juego (GM21 vive en maqueta y su panel tapa un 42 %). Cuando GM5 lo traiga, las
  fichas de A sirven para colocar los cuerpos en un plano pequeño. No se abre antes.

Lo que NO se mete:
- **La vista 2D desde arriba como batalla.** Pediste ver luchar a las tropas con el arte 3D de 0 A.D.
- **Seis órdenes** (Mover, Atacar, Cargar…). El motor solo tiene reglas para cuatro; un botón sin regla engaña.
- **Veinte regimientos sueltos.** Decidido en GM10: cuatro piezas.
- **Menú flotante** (A), **cartas grandes** (E), **barra de título arriba** (B): más marco, rechazado en K10.
- **Dibujar la orden con el dedo** (C): elegiste «tocar y elegir».
- **«Ejecutar» por turnos** (B, C): la batalla es en vivo; la pausa cubre el «pensar con calma».
- **Color de relleno distinto por tipo** (A): choca con rojo = Roma y morado = rival, que ya visten los soldados.

## 4. Plan (cada tarea, una sesión de Sonnet)
| Id | Qué | Archivos | Coste | «Se ve en el móvil» si… |
|---|---|---|---|---|
| **GM-K6a** (primera) | Sellos en el campo, con interruptor «Interfaz de batalla: nueva / de antes» en Ajustes | `js/ui-guerra.js`, `css/guerra.css`, una línea en `js/ui.js`, ajuste nuevo migrado en `G.load` (`js/game.js`), `gobierno/juez-guerra.mjs` | 0,6 M | Capturas en horizontal y vertical, al empezar y en el choque: 8 sellos sin pisarse, se distingue el tipo sin leer, el anillo baja al caer la moral |
| GM-K6b | Franja corta: ficha a la izquierda, órdenes en dos filas a la derecha, centro libre; cámara más cerca (solo horizontal); letra a 11 px y «Retirarse» a 44 px | `js/ui-guerra.js`, `css/guerra.css`, `gobierno/juez-guerra.mjs`, `gobierno/jueces.mjs` | 0,6 M | El centro de abajo enseña campo y tus jinetes; la batalla ocupa al menos la mitad del ancho; botones ≥44 px; se cambia de cuerpo con ◀ ▶ y tocando la tropa; el aviso de relevo se ve |
| GM-K6c | Tocar un sello para ver números y botón Pausa que deja leer | `js/ui-guerra.js`, `css/guerra.css` | 0,4 M | En pausa se leen hombres y estado de los seis cuerpos y se puede dar una orden |
| GM-K6d | Icono del tipo en la tela del estandarte y flecha de la orden en el suelo | `js/ui-guerra.js` | 0,5 M | De cerca se reconoce la tropa por su estandarte; tras «Caballería» se ve por dónde entran |
| GM-K6e (parada) | Fichas para el despliegue | las que traiga GM5 | 0,8 M | No abrir hasta que el despliegue esté en el juego |

- Total sin la parada: unos 2,1 M. Orden: a → b → c → d.
- **Se prueba sin romper nada: GM-K6a.** Con el interruptor en «de antes» la batalla es idéntica a la de hoy. Las
  demás cuelgan del mismo interruptor hasta que digas «me quedo con la nueva».
- GM-K6a **es la tarea GM38** («carteles discretos», ya aprobada): propongo que la absorba para no hacerla dos veces.
  GM-K6c se solapa con la pausa de GM12 y GM23: quien llegue antes, la hace.
- Cada tarea sube la versión de `sw.js` y cierra con jueces APTO. No hay arte nuevo: los iconos son dibujos propios.

## 5. Riesgos
1. **GM5 puede tirar este trabajo.** Cuando la maqueta `guerra-unica/` pase al juego, su pantalla reemplazará la de
   hoy. Remedio: sellos y franja escritos como piezas sueltas que solo leen, por cuerpo, tipo, moral, hombres y
   cansancio. No he comprobado que la maqueta dé esos mismos datos con los mismos nombres.
2. **Los jueces cuentan piezas concretas** (tres rótulos enemigos, tres tarjetas, cuatro órdenes). Si la tarea no los
   actualiza, saldrá NO APTO aunque el juego esté bien.
3. **Acercar la cámara cambia las distancias** entre sellos: repetir las capturas de §6 tras GM-K6b.
4. **Pulgar izquierdo:** la ficha con ◀ ▶ es una apuesta; si no convence, se elige solo tocando el campo.
   Y la fluidez con 8 rótulos en vez de 3 no está medida en un móvil real.

## 6. Comprobado en el navegador (17/11)
Juego real, 300 romanos contra 240 campanos, a 844×390 y 390×844, sin errores de consola. Capturas
`capturas-tarea/K6b-juego-{H1-lejos,H2-choque,H3-elegido-ala-izquierda,H4-cerca,H5-caballeria,V1-lejos,V2-choque,V4-cerca}.jpg`.
- **La cifra del 17 % era buena** (16,6 %). C, D y E, vistas también antes de tocar: el veredicto sigue igual.
- **La franja tapa a tus jinetes.** En horizontal la reserva de caballería queda detrás de «Ala derecha» y
  «Empujar» (H1 a H3). Es la mejor razón para quitar las tarjetas: confirma la decisión 1A.
- **En horizontal la batalla se ve pequeña:** ocupa unos 300 de los 844 px de ancho; el resto es hierba. Lo que más
  campo da no es quitar marco sino **acercar la cámara**. Se añade a GM-K6b.
- **Los rótulos de hoy ya se pisan:** miden 66×32 px y los cuerpos distan 51 px al empezar y 67 px en el choque.
  Un sello de 36 px cabe en los dos casos (zona de toque de 44 px incluida). En vertical distan 97 px: sobra.
- **Los 8 sellos caben con dos reglas:** enemigos arriba y tuyos abajo (corregido en §2), y el sello de los jinetes
  se esconde mientras cargan, porque entran dentro del cuerpo del centro (H5).
- **Dos faltas a tus reglas que ya están en el juego:** la línea pequeña de los botones mide 10,5 px (mínimo 11) y
  «Retirarse» mide 40 px de alto (mínimo 44). Se arreglan en GM-K6b.
- Sigue sin medir: fluidez en móvil real (aquí solo hay render por software).
