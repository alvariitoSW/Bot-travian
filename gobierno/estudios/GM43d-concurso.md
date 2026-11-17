# GM43d · Concurso de arte del testudo a pie: resultado (17/11/2026)

Reglas: `GM43d-concurso-arte-testudo.md`. Tres participantes Opus, cada uno en su copia y sin ver a los otros.
Arbitra el director (Fable). **Decide el usuario**, y puede mezclar.

## Láminas (hoy, A, B y C, la misma escena)
`gobierno/capturas-tarea/GM43d-lamina-{marcha,salva,testudo,golpe,cara,carga}.jpg`.
Capturas sueltas: `GM43d-<a|b|c>-v-*.jpg` (seis en vertical) y `GM43d-<a|b|c>-h-*.jpg` (dos en horizontal).
Informe de cada participante: `gobierno/maquetas/testudo-concurso/<a|b|c>/INFORME.md`.

## Qué propone cada uno
- **A · «Luz de cine»**: sol bajo de frente, sombras de verdad de hombres y escudos, borde de luz en cascos y hombros,
  penumbra real bajo el techo, rayos por la rendija, polvo, bruma dorada, viñeta y grano. Cielo de foto (Poly Haven, CC0).
  Suma 0,09 MB y de 5 a 8 llamadas de dibujo.
- **B · «Campo de batalla»**: suelo de tres fotos mezcladas con una senda de tierra, hierba variada que se mece, flores,
  piedras, cipreses, pinos y olivos de 0 A.D., lomas y cielo con nubes (5 piezas de Poly Haven, CC0). Suma 1,1 MB,
  7 llamadas de dibujo y dos veces y media más triángulos (de 197 000 a 492 000).
- **C · «Hombres y hierro»**: cada hombre con su piel, su rojo y su pelo; la nuca negra pasa a pelo corto; trama de lino,
  barro en las piernas, bronce con brillo, escudos distintos y gastados, pilum con virolas, sombra bajo cada hombre.
  (Tres texturas de Poly Haven, CC0.) Suma 0,7 MB y 2 llamadas de dibujo.

## Notas del director (mirando las láminas a 390 px)
| Criterio | Máx. | A | B | C |
|---|---|---|---|---|
| Se lee a 390 px | 30 | 17 | 27 | 24 |
| Ambiente de batalla antigua | 30 | 25 | 23 | 16 |
| Coherencia con el resto del juego | 20 | 12 | 18 | 17 |
| Peso y fluidez | 10 | 9 | 6 | 8 |
| Licencias limpias | 10 | 10 | 10 | 10 |
| **Total** | 100 | **73** | **84** | **75** |

Por qué:
- **A** es la que más ambiente tiene (la marcha a contraluz y el rayo en el testudo son lo mejor del concurso), pero se
  pasa de oscura: bajo los escudos los hombres quedan casi negros, y en la carga el enemigo y los tuyos se leen peor que
  hoy. El suelo sigue a cuadros. El resto del juego es claro: desentona.
- **B** es la que más cambia la pantalla a primera vista: deja de parecer una prueba. La senda guía hacia el enemigo y los
  árboles dan escala. Flojo: los hombres siguen igual (nuca negra, luz plana), los árboles de cerca se ven recortados y
  es la más cara de mover; no está medida en un móvil.
- **C** arregla lo que más molesta de cerca (la nuca negra, todos iguales, el bronce mate). Flojo: el campo sigue igual, así
  que de lejos se parece a hoy; el rayado de la placa del pecho se ve como ruido; el brillo del casco roza lo plástico.

## Recomendación (decide el usuario)
Mezclar, no elegir una: **el campo de B + los hombres de C + de A el sol con sombras y el borde de luz, a media fuerza**
(sin oscurecer tanto bajo los escudos ni en la carga). Las tres se hicieron sin pisarse: B vive en `campo.js`, C en los
sombreadores de los hombres y A en luces y sombras. Se construye después, como tarea aparte, sobre la maqueta original, y
se mide en su móvil antes de darla por buena.

## Comprobaciones
- `captura.mjs` de cada copia: **APTO** según cada participante (encuadre, partida entera, «Correr», sin errores de
  consola). El director no las ha vuelto a pasar.
- Licencias: todo lo traído es de Poly Haven (CC0), con su línea en cada `LICENSE.txt`. Nada de juegos comerciales. Los
  árboles son los de 0 A.D. que ya tenía el juego. ambientCG no se pudo usar: su descarga salta a un sitio que la red
  no deja pasar.
- Peso: A 0,09 MB, B 1,1 MB, C 0,7 MB (tope: 6 MB). Ninguna toca `js/`, `css/`, `assets/` ni `sw.js`.
- Ninguna está medida en un móvil real. Los «carteles» de ChatGPT/Gemini del usuario no llegaron a esta sesión.
