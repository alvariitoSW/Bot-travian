# Q1b2 · Ciudad nueva, segunda vuelta al diseño · 12/11/2026

Maqueta, no juego: nada de `js/`, `css/` ni `index.html` ha cambiado. Sustituye a la maqueta Q1b, que el usuario rechazó
(«los edificios son pobres», «luz, colores y suelo», «sigue pareciendo de juguete»).

## 1. Por qué la primera parecía de juguete
1. **Se veía entera desde arriba**, como una maqueta sobre una mesa: un óvalo de muralla con cien casitas y césped liso alrededor.
2. **Casas = cajas sueltas iguales**, con el mismo tejado rojo, separadas por tierra vacía. El templo, enorme al lado: casa de muñecas.
3. **Nada daba sombra**: los edificios flotaban. Verde vivo contra rojo vivo, colores de juguete.
4. **Suelo de un color plano**; campos como fichas de colores; caminos como rayas.
5. **Horizonte de dos bandas lisas.** En la griega y la púnica las casas eran cubos.

Es la receta de la foto «de miniatura»: vista alta, color subido y contraste duro. La segunda maqueta hace lo contrario.

## 2. Qué cambia
| Fallo que marcó el usuario | Antes (Q1b) | Ahora (Q1b2) |
|---|---|---|
| Edificios pobres | ~100 cajas hechas por código | 830 casas con modelos de 0 A.D.: 4 romanas, 5 griegas, 3 cartaginesas, con giro, escala y tinte distintos |
| | Casas sueltas | Manzanas: casas pegadas a calles torcidas, con patios; denso en el centro, flojo fuera |
| Luz | Sin sombras | Sol bajo (29°) con sombras largas reales, luz de cielo fría y rebote cálido, sombra de nubes |
| Colores | Verde césped y rojo puro | Paleta apagada de final de verano; color vivo solo en los toldos del mercado |
| Suelo | Un color pintado | Seis texturas mezcladas (tierra, hierba seca, arena, losas, labrado); rodadas en las calles; losas solo en el foro |
| | Llano | Dos lomas y una vaguada, arx con el templo, río con puente y barcas |
| De juguete | Se ve el contorno entero | Cámara baja y de focal larga: la ciudad se sale de la pantalla; montes en la bruma |
| | Borde cortado | Arrabales, tumbas junto a la vía, granjas, olivares y parcelas hasta perderse |
| | Vacía | Gente a escala (1,7 m frente a casas de 8–10 m), humo, carros, pozos, ropa tendida, corrales, pájaros |

Capturas (390×844): `capturas-tarea/Q1b2-0-antes-despues-cerca.jpg` y `-lejos.jpg` (comparación), `Q1b2-1-romana-cerca`,
`-2-romana-lejos`, `-3-romana-calle`, `-4-griega-cerca`, `-5-punica-cerca`. Se regeneran con
`node gobierno/maquetas/ciudad2/captura.mjs` (unos 4 minutos).

## 3. Lo que sigue flojo (visto en las capturas)
- La ladera entre el foro y la arx queda pelada, con casas sueltas.
- El campo del fondo es soso y los montes son siluetas lisas.
- El río solo asoma por la derecha.
- Griega y púnica conservan muralla, mercado y almacén romanos. Algunas casas griegas se pisan entre sí.
- Faltan pórticos en el foro, tinajas y estandartes.
- No se hizo la vuelta de arreglos: el gasto ya había pasado del presupuesto (ver el parte).

## 4. Medidas
| | Romana | Griega | Púnica | Tope del juego |
|---|---|---|---|---|
| Triángulos de la escena | 1 499 000 | 1 207 000 | 1 065 000 | 300 000 |
| Llamadas de dibujo | 49 | 54 | 45 | — |
| Casas | 830 | 830 | 830 | — |
| Árboles | 3 212 (391 000 triángulos) | igual | igual | — |

- **La maqueta pasa el tope de triángulos entre 3,5 y 5 veces.** Tal cual no se puede llevar al juego. Vías para bajar sin que
  se note: dibujar solo lo que entra en pantalla (por sectores), casas lejanas en versión ligera, árboles lejanos como
  cartel, gente lejana con la figura ligera, sombras calculadas una sola vez, suelo con menos capas.
- **Peso**: las 25 piezas nuevas ocupan 843 KB en `gobierno/maquetas/piezas/` (fuera del juego). Si entran en `assets/`, la
  descarga pasa de 34,1 a unos 34,9 MB sobre un tope de 35.
- **El rendimiento en un móvil real no está medido.** Aquí solo hay render por software.

## 5. Arte y licencias
- Real, de 0 A.D. (Wildfire Games, CC BY-SA 3.0): casas, templos, foro, mercado, muralla, árboles, atrezo, la ciudadana y las
  texturas de suelo y agua. Crédito en `gobierno/maquetas/piezas/LICENSE.txt`. Las mallas de las casas se han aligerado.
- Hecho por código: plano, relieve, río, luz, cielo, montes, humo, toldos, tumbas, cercas, puente, barcas, pájaros.
- No cupieron por peso: stoa, mercados griego y cartaginés, templos pequeños. No hay taberna en 0 A.D.
- De otros juegos solo se tomaron ideas (`estudios/Q1b2-referencias.md`). Aviso: la red no dejó abrir vídeos ni páginas;
  ese estudio sale de resúmenes de búsqueda.

## 6. Dictamen histórico: APTO CON NOTAS
- Sin anfiteatro, termas, acueducto de arcos, arco de triunfo, ínsulas altas ni mármol. Muralla irregular.
- Calles de tierra y losas solo en el foro: el primer contrato de empedrado de Roma es de 174 a.C. (Livio 41.27).
- Tumbas junto a las vías fuera de las puertas: `histórico`. Templo en la arx, plano y relieve: `licencia de juego` (ciudad tipo).
- Las casas son las de 0 A.D., que mezclan rasgos de varios siglos: `licencia de juego`.
- Siguen `sin confirmar` las citas ya pendientes de Q1b (Vitruvio 2.3, Livio 21.62 y 5.55) y la altura de la domus.

## 7. Propuesta
P78 en la bitácora, que sustituye a P77. Empieza por lo que decide si esto es posible: una versión ligera probada en el
teléfono del usuario.
