# GM1 · Ejércitos grandes sin miles de figuras (16/11/2026)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-grande/
Empieza sola con 5 000 hombres por bando. Arriba a la derecha: el botón con el número cambia a 1 000 o 10 000; «De cerca»
baja la cámara al cuerpo elegido. Maqueta aparte: no cambia el juego ni la maqueta GC1, que es su base (mismas reglas y botones).

## La idea en una frase
**Todos los hombres están en el campo, pero casi ninguno es una figura**: cada soldado es un *cartón* (su foto, pintada en
dos triángulos) y solo los que tienes delante de la cámara son figuras completas, nunca más de 220.

## Cómo funciona
1. **El regimiento es lo que se simula y lo que se mueve.** Una línea de hastati de 667 hombres es *un* objeto con seis
   números: cuántos quedan, cuántos van por fila, dónde está su primera fila, hacia dónde mira, y la separación.
2. **Cada hombre tiene su sitio sin que nadie lo guarde.** El hombre número 137 va en la fila y la columna que le tocan por
   su número. Esa cuenta la hace la tarjeta gráfica del móvil, no el programa: mover 10 000 hombres cuesta lo mismo que mover 12 regimientos.
3. **El cartón.** Al cargar, la maqueta fotografía al soldado real de 0 A.D. desde ocho lados y en once poses (quieto,
   andando, golpeando, cayendo). De lejos se pinta esa foto. Una figura completa son unos 2 200 triángulos; un cartón, 2.
4. **De cerca salen las figuras.** Cuando la cámara baja (sola, como en GC1, o con «De cerca»), los 220 hombres más próximos
   al punto que miras cambian su cartón por la figura completa. Los demás siguen de cartón detrás.
5. **Cada soldado cuenta.** Las reglas trabajan con hombres de verdad: fuerza, bajas y ánimo salen del número real
   (`reglas.js`). Cuando cae gente, el regimiento **pierde filas por detrás** y la última se acorta; los caídos quedan en
   el suelo donde se luchó. La cuenta de arriba («Roma 4 397 · Enemigo 3 350») y la de cada cuerpo bajan hombre a hombre.
6. **La formación se adapta al móvil.** De pie, los regimientos forman más hondos que anchos (cabe más alto que ancho);
   tumbado, tres veces más anchos que hondos. El campo, la niebla, los árboles y la cámara crecen con el ejército.

## Medidas
Medido aquí con `captura.mjs` y un navegador a 390×844. **Ojo**: este entorno pinta sin tarjeta gráfica, así que los
milisegundos solo sirven para comparar unas filas con otras; en un móvil real **sigue sin medir**.

| Batalla | Hombres en el campo | Figuras completas | Triángulos de lejos · de cerca | ms por imagen de lejos · de cerca |
|---|---|---|---|---|
| GC1 (la vara) | 1 620, a una figura por 9 | 230 siempre | 495 000 · 495 000 | 206 · 614 |
| GM1 · 1 000 por bando | 1 800 + 146 jinetes | 0 de lejos, 220 de cerca | 93 000 · 569 000 | 68 · 577 |
| GM1 · 5 000 por bando | 9 000 + 734 jinetes | 0 de lejos, 220 de cerca | 107 000 · 575 000 | 87 · 544 |
| GM1 · 10 000 por bando | 18 000 + 1 466 jinetes | 0 de lejos, 220 de cerca | 128 000 · 596 000 | 190 · 681 |

- **Dieciocho mil hombres cuestan lo mismo que los 1 620 de GC1**, y de lejos menos (cuatro veces menos triángulos).
- De lejos, casi todo el gasto es el suelo y los árboles (unos 90 000 triángulos); los hombres son 2 triángulos cada uno.
- De cerca manda el tope de 220 figuras: da igual el tamaño del ejército. El tope se puede bajar con `?figuras=120` en la dirección.
- Llamadas de dibujo: unas 60 (una por regimiento, no por hombre). El programa no hace ninguna cuenta por soldado en cada imagen.
- **Peso**: ni un archivo nuevo que descargar (los cartones se fotografían al cargar, unos 2 s). Ocupan unos 30 MB de memoria
  de vídeo; se pueden dejar en la mitad si un móvil va justo. Presupuesto apuntado en `gobierno/arte.json` (`batallaGrande`).

## Qué necesita saber el motor de combate (para GM2 y para llevarlo al juego)
El dibujo no pide nada hombre a hombre. Le basta esto **por regimiento**, y lo demás lo deduce (`formacion.js`, sin pantalla):

| Dato | Para qué | Quién lo fija |
|---|---|---|
| `hombres` (los que quedan; puede llevar decimales) y `max` | Cuántos cartones se pintan; filas que quedan | El motor, cada paso |
| `files` (hombres por fila) | Ancho del regimiento. Fijo desde el despliegue | `filesDe(max, proporción)` |
| `x`, `z` del centro de la primera fila y `yaw` (hacia dónde mira) | Dónde está y a quién da la cara, el costado o la espalda | El motor (hoy lo calcula la pantalla a partir del frente del sector) |
| Separación entre hombres y entre filas | Apretar al empujar, abrir al descansar | La postura |
| Estado: marcha, lucha (cuántas filas golpean), relevo, huida | Qué pose pone cada cartón | El motor |

De ahí salen, sin guardar nada más: `filasDe(hombres, files)` (fondo), `frenteDe(hombres, files)` (hombres que tocan al
enemigo) y `sitio(regimiento, número)` (dónde está cada hombre). **Para GM2**: si el combate quiere que solo pegue la primera
fila, que el fondo dé aguante, o que un golpe por el costado o la espalda cuente más, ya tiene el frente, el fondo, la
posición y la orientación de cada regimiento. Lo que GM2 no debe hacer es guardar hombres sueltos: con hombres por
regimiento basta, y es lo que hace que 10 000 cuesten lo mismo que 1 000.
Hoy la maqueta usa las reglas de GC1 tal cual, con las bajas a escala: se comprobó que la batalla dura y se decide igual con
1 000, 5 000 y 10 000 (`prueba.mjs`: sin tocar nada se pierde, con cabeza se gana, unos 113 s).

## Lo que no hace (a propósito, o queda para después)
- **Los caídos pintados tienen tope** (140 por tipo de tropa, se borran a los 45 s). La cuenta de bajas sí es exacta.
- **Las figuras de cerca no mueren con animación propia**: el que cae es un cartón que se desploma.
- **El relevo y la huida se cruzan a través de los suyos**, como en GC1.
- **Sin medir en un móvil real.** La pantalla final dice las imágenes por segundo de *tu* móvil: ese es el dato que falta.
- Primera persona (GM3) y aspecto (GM4) van encima de esto: la figura completa ya existe junto a la cámara.

## Historia (dictamen: APTO CON NOTAS)
- **Histórico**: tres líneas por legión con la tercera a la mitad de hombres (Polibio 6.21–23); ejércitos consulares de
  unos 20 000 hombres y más en las grandes batallas (Polibio 3.107 y 3.113, Cannas), así que 10 000 por bando ya no es exagerar.
  La caballería ronda el 7 % de la infantería (300 jinetes por legión, Polibio 6.20).
- **Licencia de juego**: el fondo de las líneas (hasta 30 filas con el móvil de pie; las fuentes hablan de 3 a 12, y de más
  solo en Cannas, Polibio 3.113); líneas continuas, sin los huecos entre manípulos; el enemigo en un solo bloque por cuerpo;
  los jinetes esperan detrás. Fuentes citadas de memoria, sin cotejar pasaje a pasaje.

## Lo que decide el usuario tras probarla
1. ¿Así se dibujan los ejércitos grandes? (A) sí; (B) sí, con cambios; (C) no, otra idea.
2. ¿Qué tamaño va por defecto en el juego? (A) el que traiga la campaña, hombre a hombre; (B) un tope (por ejemplo 5 000 por bando).
3. Dime las «imágenes por segundo» que marca tu móvil con 10 000: con eso se fija el tope de figuras de cerca.
