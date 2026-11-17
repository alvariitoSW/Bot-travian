# GM4c · Arte de la batalla, segunda vuelta (17/11/2026)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-arte/
Botón arriba «Arte: nuevo / de antes». «De antes» es exactamente lo que se probó el 16/11 (GM4).
Cada mejora se apaga sola: `?sin=figuras`, `?sin=campo`, `?sin=color` (o varias con comas).

## Qué cambia a la vista
1. **Figuras**: más oscuro hacia los pies y en lo que mira al suelo; el bronce y el hierro brillan con el sol; la tela
   tiene grano; contraluz más fino. Sin triángulos nuevos: es todo sombreador, y sale también en los cartones lejanos.
2. **Campo**: suelo mezclado a dos escalas con manchas grandes (menos rayas); tierra pisada con surcos donde se marcha y
   se lucha; lomas pintadas con el sol (la altura bajo la tropa no cambia) y lomas de verdad solo fuera; sol más bajo y
   cálido, sombras por hombre más largas; bruma cálida y cielo en degradado.
3. **Color y estandartes**: Roma rojo, enemigo azul cobalto (antes morado). La túnica pasa a lino y ocre con un 12 % de
   bando; el bando entero queda en lo lateral y en la cabeza. Estandartes 1,75 veces más grandes.

Capturas (844×390 y una 390×844): `gobierno/capturas-tarea/GM4c-0-antes-*`, `-1-figuras-*`, `-2-campo-*`, `-3-todo-*`,
`GM4c-primer-plano-antes/despues.jpg`. Se repiten con `node gobierno/maquetas/guerra-arte/comparar.mjs`.

## Medidas (10 000 por bando, 844×390, render por software: solo comparan)
| Estado | Lejos: triángulos · llamadas · ms | Cerca: triángulos · llamadas · ms | Cartones |
|---|---|---|---|
| de antes | 132 319 · 56 · 1 286 | 628 603 · 54 · 2 603 | 29,7 MB |
| nuevo | 132 347 · 56 · 1 664 | 628 535 · 54 · 3 125 | 29,7 MB |

Dentro de `arte.json` (150 000, 650 000, 32 MB, descarga 0). **Pintar cuesta más: +18 % de lejos y +15 % de cerca**
(se pedía no pasar de +10 %; la medida baila mucho). Hay que mirar las imágenes por segundo en el móvil. Si baja de 50,
se recorta primero el suelo (baldosa girada y surcos) y luego el grano de tela.

## Lo que ha quedado mal (mirado por el director en las capturas)
- **De cerca el romano queda de color hueso**: túnica y piel casi del mismo tono, parece sin ropa. Se pasó de frenada al
  quitar el rojo. Arreglo corto: túnica con un 35 a 45 % de rojo apagado y más distancia con la piel.
- **El escudo romano no lleva el bando**: la máscara de color de 0 A.D. no cae en él y no se pudo separar por pieza.
  El rojo solo queda en capas, flecos y estandarte. El enemigo sí lleva azul en el escudo.
- De lejos Roma sigue salmón y el enemigo lila: mejor separados que antes, pero aún alfombra.
- Las rayas del suelo se ven menos, no han desaparecido. Las lomas pintadas apenas se notan bajo la tropa.
- Los carteles «cargan / aguantan» siguen en morado (no se tocó el manejo).
- Sin vuelta de arreglos: se llegó al tope de pasos y el gasto se pasó (ver el parte).

## Coincidencias, para no duplicar
- **GM33 (la tropa como gentío, en `guerra-aspecto/`)**: ya está aquí la variación de tono por hombre más fuerte y el
  bando concentrado en lo lateral y la cabeza. Sigue siendo de GM33: variantes de escudo y túnica, tono de piel por
  hombre, penacho, lanzas que asoman. Lo de aquí vive en `guerra-arte/arte2.js` y se puede copiar.
- **GM35 (campo y aire)**: se solapa casi entera con la mejora 2. Antes de abrirla, decidir qué suelo manda (el de
  `guerra-aspecto/` o el de `arte2.js`) para no tener dos sombreadores.

## Archivos
`guerra-arte/arte2.js` (nuevo: interruptores, botón y todo lo nuevo), 14 parches `/* GM4c */` en `arte.js`, 2 enganches
en `vista.js`, `comparar.mjs` (nuevo). Reglas sin tocar; `prueba.mjs` APTO.

## Historia
Túnica de lana sin teñir u ocre: verosímil para el legionario republicano (el rojo uniforme es convención moderna).
Enemigo en azul: **licencia de juego** para distinguir bandos. Sin fuente nueva consultada.
