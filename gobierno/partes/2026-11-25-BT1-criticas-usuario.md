# BT1 · Críticas del usuario al ver «antes y ahora» (25/11, noche)

Las apunta la sesión BT1 al dictado, literal, para recopilar y definir después con el usuario.

1. **Batalla grande (captura 4 de 6, «BT1-antes-ahora-grande.jpg»)**, literal: «esta batalla yo pensé que la habíamos quitado
   para mejorar la parte de manipuló a pie y unificar el motor de batalla y así quitar esta mierda que funciona mal y no puede
   apenas mover a las tropas».
   - Contexto que consta: EB1 §4 («la batalla grande mantiene su simulador», con la cita del usuario del 25/11 «De momento hay que
     mantener lo que tenemos») y Plan A paso 3 «Una batalla entera». Queda por definir con él.

2. **Maquetas de los otros tipos de batalla**, literal: «que pasa con las maquetas de los otros tipos de batalla se pueden aprovechar». Pregunta abierta: qué se reaprovecha de las demás maquetas (falange vieja, testudo-luz-campo, combate-*, soldado-*…) al unificar.

3. **Falange jugada en su móvil (26/11, 0:41–0:42; 8 capturas)**. OJO: son de la versión publicada (v178: cuatro botones «Bajar picas · Cerrar filas · Avanzar · Alto» y franja roja de lado), todavía sin BT1. Literal:
   1) «la vista desde arriba bien, le doy un 8, pero cuando empiezan a moverse las tropas baja a un 4 porque empiezan los fallos, como que los gráficos y la animación son de videojuego de la ps1 y no se los criterios para crear los soldados pero son una mierda y hay que replantearlo».
   2) «el oficial su lanza vuela no la lleva en la mano, los soldados cuando caminan y bajan la lanza no se siente real, se siente un muñeco, hay que mejorar el movimiento de las tropas y sus animaciones».
   3) «en la visión del oficial se ven muchas filas de lanzas volando en el aire sin nadie cogiéndolas».
   «Creo que hay que replantear las cosas.»
   Visto además en sus capturas: franja roja lateral con «¡Su jefe va a tu izquierda/derecha!» que tapa media pantalla; flechas azules de giro flotando sobre el enemigo; caídos traslúcidos/fantasma; «Se oye: (Entre el estruendo…)» encima de la raya de cansancio; reloj del compás «¡Othismos! Toca al compás» en medio.

4. **Imagen objetivo (3 imágenes, 26/11)**, literal: «quiero que la guardes por qué quiero que el juego sea lo más parecido a lo que te mando, y quiero saber cómo podemos replicar eso». Ficha de ideas en `estudios/REF-batallas-referencias.md` («BT1 · Imagen objetivo de la falange»).

5. **Testudo jugado en su móvil (26/11, 1:06–1:07; 16 capturas, versión publicada v178, sin BT1)**, literal: «la parte de testudo es una mierda. Está bien que se haya unificado el motor de juego pero tiene que sentirse así como las imágenes que te mando y parecido a lo que teníamos ya hecho con lo de ryse son of rome».
   Visto en sus capturas: desde el oficial, al cerrar el testudo la cámara queda dentro de dos losas rojas planas y enormes con una raja de cielo (T7 de EB1); el techo desde arriba son rectángulos idénticos; franja roja lateral «¡Su jefe va a tu derecha!» sobre media pantalla; etiquetas sueltas «fresca» sin nombre; «Se oye: (…)» encima de «Heridas/Aliento» y de la ayuda de dedos; grito «¡Relevo! ¡Segunda fila, adelan» cortado; flechas azules de giro sobre la tropa; galos de pocos polígonos y caras planas; caídos que flotan.
   Lo de «Ryse»: la escena vieja del testudo a pie (`gobierno/maquetas/a-pie/`, TP0–TP8, quitada en FU6: está en la historia de git) y las fichas `estudios/TP0-objetivo-testudo-y-lucha.md` y `TP8-mejoras-testudo-combate.md`.
   + 2 imágenes objetivo del testudo: ficha en `estudios/REF-batallas-referencias.md` («BT1 · Imagen objetivo del testudo»).

6. **Tropas de tiro jugables (26/11)**, literal: «la parte de las tropas de tiro no la veo, habría que crear la funcionalidad de esta nueva tropa para poder jugarla, te doy una imagen pero estaría bien que pudieras moverla y apostarla en algún lado o que tengan en modo escaramuza y se alejen automáticamente de los enemigos para poder disparar de lejos y que tú puedas también disparar las flechas y ver la munición que tienes».
   Pide: (a) mover a los tiradores y apostarlos en un sitio; (b) modo escaramuza: se alejan solos del enemigo y tiran de lejos; (c) disparar tú las flechas (vista del oficial/arquero); (d) ver la munición. Hoy solo existen como cuerpo de apoyo dentro de Ásculo (`bloque/tiradores.js`, `js/tiro.js`: «Tirar», «Hostigar», «Retirarse», munición en la ficha). Es tropa jugable NUEVA: por la regla de la 1.0 y del Plan A («nada nuevo»), la decide el usuario al recopilar (entra en un paso o va a «Después»).
   + 2 imágenes objetivo de arqueros: ficha en `estudios/REF-batallas-referencias.md` («BT1 · Imagen objetivo de los arqueros»).

## Dónde está todo guardado (pedido del usuario, 26/11: «guarda absolutamente todas las imágenes con las notas que te he hecho y las críticas»)
- Sus capturas jugando (nuestro juego): `gobierno/capturas-tarea/BT1-usuario-c1-grande-01.jpg`, `BT1-usuario-c3-falange-01…08.jpg`, `BT1-usuario-c5-testudo-01…16.jpg` (reducidas a 600 px).
- Sus 7 imágenes objetivo (origen y licencia sin confirmar; todo el repositorio se publica con el juego): en su Google Drive, carpeta
  «AQVILA · Imágenes objetivo de las batallas (BT1, 26-11-2026)» (1–3 falange, 4–5 testudo, 6–7 arqueros). Lo que se ve en cada una: `estudios/REF-batallas-referencias.md`.
- Nueva dirección propuesta con todo esto: `estudios/BT1-direccion-batallas.md`.

7. **Cómo hacerlo (26/11)**, literal: «no puedes pedir a meshy más cosas tienes que tirar con lo que ya hay hecho y reusarlo. Lo de las animaciones ya hay unas animaciones en la app que no se cómo mejorar y habría que crear el departamento de animaciones de batalla para encargarse de mejorar esto. El motor de guerra es lo que hay que mejorar quiero saber cómo funciona exactamente lo que hemos creado. Los gráficos me aparecen bien y habría que meterle eso como si tuviera mods. Falta la jugabilidad y los menús cambiarlos por qué hay botones que han perdido funcionalidad. Los paisajes y los mapas habría que encargarse de hacerlos bien para las batallas y que se vea desde la visión del oficial exactamente como te he mandado en las imágenes».
   Y antes (26/11): «¡Pero ahora no estamos en roma estamos en Grecia!» → la pieza de muestra pasa a ser el muro de hoplitas (pendiente de su «sí»).
