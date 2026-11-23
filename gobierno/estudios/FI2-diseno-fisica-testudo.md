# FI2 · La física en el testudo a pie (23/11/2026)

Sirve a **L17** (formaciones a pie; el testudo a pie se alcanza desde el juego: Escaramuzas → «Testudo a pie»). Aprobada por el
usuario el 23/11 («Si hazlo ya»), tras FI1. Diseña y construye Opus. Usa el motor de FI1 (`js/fisica-batalla.js`) sin copiarlo.

## Qué se ve
1. **Los galos chocan contra el muro, no se meten dentro.** Al llegar la carga, la primera fila romana cede unos centímetros y el
   empujón pasa a las filas de detrás. El muro se rehace en un segundo, sin rebotar.
2. **Los galos no se pisan entre ellos.** Corren como una masa: se apartan unos a otros y los de detrás se frenan contra los de delante.
3. **En la lucha, cada pareja se empuja de verdad.** El empujón de escudo (ya existe en las reglas de la maqueta) mueve al galo
   según su masa, y el que cae lo hace hacia donde le empujaron. Los caídos estorban y se arrastran.
4. Interruptor `?fisica=0` para ver el antes.

## Cómo se hace
- Nada nuevo en las reglas de la maqueta: la física solo cambia dónde se dibuja cada hombre (`fx`, `fz`), como en FI1.
- Un adaptador en la maqueta, `gobierno/maquetas/a-pie/fisica.js`, da al motor las dos listas (`romanos` como el bloque
  propio, con columna y fila; `galos` como rivales). Si el motor necesita algo para no depender de nombres de la falange, se generaliza
  sin cambiar lo que da en FI1 (su prueba, en verde).
- La escala de las figuras del testudo es otra (2,15 «m» por hombre, contra 1,9 de la falange): los radios se escalan.

## Cómo se mide
| Vara | Número |
|---|---|
| Nadie dentro de nadie | distancia mínima entre dos hombres vivos dibujados ≥ 0,45 m (escalada) desde la carga hasta el final de la lucha |
| El choque se nota | la primera fila romana recula ≥ 0,1 m al llegar la carga, y la segunda al menos la mitad |
| Coste | ≤ 1 ms por fotograma la física; sin llamadas de dibujo nuevas |
| Lo de antes sigue | `captura.mjs` de la maqueta y el juez de área de batallas en APTO |

## Guion de fotos (`gobierno/capturas-tarea/FI2-*.jpg`)
`h-carga` y `h-carga-antes` (el instante del choque, con y sin física) · `v-lucha` (390×844) · `h-caidos`.

## Historia
El testudo que aguanta una carga y se rehace es plausible (Plutarco, Antonio 45, para el testudo; Polibio 2.33 para los galos
contra los manípulos). Las medidas del empuje son licencia de juego.
