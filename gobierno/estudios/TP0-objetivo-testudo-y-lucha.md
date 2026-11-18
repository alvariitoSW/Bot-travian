# TP0 · Objetivo final de las batallas: dos alturas, general y a pie (borrador 2 para el usuario, 18/11/2026)

Esto no es una tarea: es la vara con la que se mide toda tarea de batalla y del testudo a pie. Borrador hasta que el
usuario lo apruebe. Sale de sus palabras del 18/11:
- «puedo ser o el romano de la fila o el centurión de la unidad; si el centurión cae y le estaba controlando, paso a ser otro soldado de la fila».
- «me gustaría que en las batallas pueda controlar una unidad como en testudo, o en falange de picas o muro hoplita, etc., y esta parte de testudo que sea la evolución de las batallas que hay ahora en el juego».
- «habría que reformular bien el objetivo final, que no parece claro en las batallas grandes, porque no tienen nada que ver con la parte que estamos creando de testudo».
- Elegido de listas: batalla en «Dos alturas: general y a pie»; el resto de la batalla, a pie, «Se ve y cuenta»; lo primero, «La lucha»; terminado, «Cuando se parezca a Ryse»; versión del pilum, la mezcla (lanzar de A + lucha de B).

## El objetivo, en una frase
Cada batalla del juego se juega a dos alturas: arriba eres el general y mandas al ejército; cuando quieres, bajas a una
unidad y la vives a pie, como su centurión, con el aspecto y la sensación de Ryse hasta donde aguante un móvil.
El testudo a pie de hoy es la primera unidad de esa segunda altura, no una escena aparte.

## Altura 1 · General (lo que ya hay, y se queda)
- Vista desde arriba: colocas los cuerpos y les das órdenes. Es el motor de guerra de hoy (`js/guerra.js`), que gustó.
- Novedad: tocar un cuerpo propio y «Bajar a pie».

## Altura 2 · A pie (lo nuevo)
- **Quién eres**: el centurión de esa unidad. Mandas (Escudos · Pila · Cargad · Relevo) y peleas tu duelo (lanzar, parar,
  empujar con el escudo, estocada). Si caes, pasas a ser otro soldado de la fila y sigues; sin centurión, la unidad obedece peor.
- **La unidad tiene formación**, y cada formación es una ficha: testudo (hecha), línea manipular; después falange de
  picas, muro hoplita, vélites, caballería.
- **El resto de la batalla se ve y cuenta**: las unidades vecinas pelean a tus lados (más sencillas de lejos), te llegan
  avisos («el flanco izquierdo cede») y, si tu ala se hunde, te envuelven.
- **Subir y bajar**: puedes volver a general o cambiar de unidad. Mientras estás a pie, el resto lo lleva el motor de guerra.

## Cómo encajan (lo que hoy no estaba dicho)
- Una sola batalla y una sola verdad: el motor de guerra lleva la cuenta de todos los cuerpos (hombres, ánimo, cansancio, posición).
- Al bajar, la unidad elegida se despliega hombre a hombre con esos mismos números y su enemigo de enfrente.
- Lo que haces a pie se devuelve al motor: bajas de los dos, ánimo y si rompe uno. Un buen centurión gana su trozo de línea; no gana solo la batalla.
- La batalla sigue recibiendo dos ejércitos y devolviendo bajas: la economía no se entera (arquitectura de `CLAUDE.md` §2, intacta).

## La lucha a pie: qué tiene que verse y sentirse (lo primero)
- **Tu duelo**: el enemigo de delante avisa su golpe con el cuerpo; si levantas el escudo a tiempo, para (madera, sacudida);
  parado, queda abierto y tu estocada entra; el empujón de escudo lo desequilibra. Si fallas, te hiere: a la tercera caes.
- **Golpes con peso**: cada golpe llega a algo (escudo o cuerpo) y el que lo recibe reacciona: retrocede, se dobla, cae.
  Nada de espadas que cortan el aire ni de figuras que se atraviesan.
- **Tu fila pelea de verdad**: por parejas; los caídos se quedan en el suelo; los huecos se cierran.
- **Tus órdenes cambian la lucha**: «Relevo» mete la fila fresca; «Escudos» aguanta y cansa al enemigo; cargar a tiempo empuja.
- **Se gana y se pierde por algo que se ve**: bajas y ánimo; el que rompe, huye, y se le ve huir.
- **Cámara**: cerca, tras tu hombro; no pierde a tu enemigo ni la tapan los escudos.

## El listón «Ryse», dentro de un móvil
Se toma la sensación, no su arte ni su código: cámara pegada al soldado, peso en cada impacto, formación cerrada, tensión
bajo los proyectiles. Lo que un móvil no da (caras de miles de polígonos, ejecuciones de cine) se dice y no se promete.
Medida: fluido en el móvil del usuario; si no, se recorta antes de darlo por bueno.

## La base, para no construir trozos fijos
Una sola «escena a pie» hecha de piezas que se cambian sin rehacer lo demás:
- **Unidad** (entra y sale con los números del motor de guerra) · **Formación** (ficha) · **Soldado** (hoy el de 0 A.D.,
  luego el nuevo con manos, brazos y caras) · **Acciones** (lanzar, parar, empujar, golpear, caer: fichas con gesto, tiempo y
  efecto) · **Enemigo** (ficha) · **Vecinos y avisos** · **Cámara** · **Sonido**.
- Cada mejora posterior entra en su pieza. El testudo de Escaramuzas es esa misma escena con una unidad de ejemplo.

## Orden propuesto (una tarea cada vez; cada una se prueba en el móvil antes de la siguiente)
1. **TP1 · La escena a pie sobre la base, con la lucha** (la única que se abre ahora): unir el lanzar de A y la lucha de B
   sobre esas piezas; centurión con relevo a soldado; lucha como arriba; con los muñecos de hoy; se juega desde Escaramuzas.
   La unidad ya entra y sale con los números del motor de guerra, aunque aún no se baje desde una batalla.
   Presupuesto honrado: 4 a 5 M (solo el pilum costó 2,8 M).
2. **TP2 · Bajar a pie desde la batalla grande**: botón en un cuerpo, despliegue, devolver el resultado, subir.
3. **TP3 · Vecinos que se ven y avisos**; que te envuelvan si tu ala cede.
4. **TP4 · Soldado nuevo** en la escena (manos, brazos, movimientos); luego caras.
5. **TP5 · Sonido grabado**.
6. **TP6 · Más formaciones**: falange de picas, muro hoplita, vélites, caballería (una ficha cada vez).
Al aprobar este documento, GM43g a GM43l y GP1 a GP6 del tablero se funden en TP1 a TP6 (nada nuevo: son las mismas, ordenadas).

## Lo que queda fuera (de momento)
Moverte suelto por el campo fuera de tu unidad, campaña a pie, ejecuciones de cine, batallas navales a pie.

## Historia
Dos pila por hastatus (Polibio 6.23, cotejado). Centurión en primera fila y elegido por su firmeza (Polibio 6.24, cotejado).
Relevo de filas: descrito para la legión manipular (Livio 8.8); el cómo exacto se discute: licencia de juego en el detalle.
Empujón con el umbo: probable. Testudo contra proyectiles: histórico. Falange de picas y muro hoplita: históricos; se fichan al llegar.
