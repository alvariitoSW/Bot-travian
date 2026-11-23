# FI1 · Físicas en las batallas: qué cabe en el móvil (23/11/2026)

Sirve a **L17** (formaciones a pie). Pedido del usuario (23/11): «que no se atraviesen las picas ni los brazos y que haya
físicas en el juego». Diseña y construye Opus. Sin motor de físicas externo (solo three.js en ejecución).

## La idea de fondo
No hay un motor de cuerpos rígidos: con ≈200 hombres en un móvil no cabe, y las reglas (`js/falange.js`) ya deciden quién
cae y dónde está cada uno. La física es una **capa fina de corrección encima de las reglas**: no decide nada del juego, solo
**dónde se dibuja** cada hombre y cada pica. Cada hombre lleva un desplazamiento propio (`h.fx`, `h.fz`, como mucho 0,6 m)
que un muelle devuelve a cero; las reglas no lo leen, así que las partidas y sus pruebas no cambian.

## Lo que cabe, por orden de lo que se nota
| | Qué se ve | Cómo se hace | Cómo se mide (número) | Coste |
|---|---|---|---|---|
| **(a) Los cuerpos no se atraviesan** — SE HACE | Los colados, los del flanco y los que llegan sin picas se aprietan contra el muro en vez de meterse dentro; si el de delante recula, el de detrás también | Cada hombre es un círculo de 0,25 m (jinete 0,45; elefante 1,3). Rejilla de 1 m, dos pasadas de separación por paso, el muelle a 0 y la **compresión fila a fila**: el de detrás recula al menos 0,6 de lo que recula el de delante | Distancia mínima entre dos hombres vivos dibujados **≥ 0,45 m** en 60 s de lucha con el bot (hoy, colados a 0 m) | < 0,5 ms por paso con 200 hombres |
| **(b) Las picas no atraviesan cuerpos ni escudos** — SE HACE | La punta se para en el escudo o en el pecho; el asta resbala hacia atrás entre las manos (hasta 0,5 m); lo que sobra empuja: el herido recula y el piquero cede un poco, y eso pasa a las filas de detrás | Cada pica bajada es un segmento; se busca el primer escudo (caja de 0,65 × 1,1 m delante del hombre) o cuerpo (cilindro) que corta y se acorta hasta él. Una pasada por fotograma, solo contra los rivales cercanos de la rejilla | **Cero puntas dentro** de un cuerpo o un escudo en 60 s de lucha con el bot (y el mismo número con la física apagada, `?fisica=0`, para ver el antes) | < 0,5 ms por fotograma; **ninguna llamada de dibujo ni triángulo nuevo** |
| (c) Caídas con peso — PROPUESTA | El que cae lo hace hacia donde le empujan; los vivos no pisan a los caídos | Dirección de la caída = su desplazamiento; los caídos entran en la rejilla como estorbo bajo | Ángulo de caída ↔ empuje; nadie de pie sobre un caído | Barato (≈ 0,2 ms); necesita tocar `soldado.js` (FA6/FA8) para la animación de caída de lado |
| (d) Choque con masa — PROPUESTA | El elefante o el caballo que entra aparta y tumba; el muro se abre y se rehace | Masa por tipo en la separación (elefante 20, jinete 4, hombre 1) y una regla de derribo | Hombres desplazados y tumbados por choque | Medio: toca las reglas de los rivales (`js/falange-rivales.js`) y su dibujo (FA7) |
| (e) Proyectiles que rebotan o se clavan — PROPUESTA | El pilum rebota en el casco, se clava en el escudo y lo dobla | Ángulo de llegada decide clavar o rebotar; el rebote es un vuelo corto | % de rebotes según ángulo | Barato en cálculo; pide un modelo de pilum doblado (arte) |

**Lo que no cabe**: cuerpos rígidos de verdad (muñecos de trapo), picas que se doblan de verdad (pide deformar la malla en
el sombreador de cada asta: lo dejaría para el modelo nuevo de FA2/FA8) y brazos que no se atraviesan (son animaciones: FA6).

## Dónde vive
- `js/fisica-batalla.js`: las reglas de la física, sin pantalla (corre en Node). Prueba: `test/fisica-batalla.test.mjs`.
- `gobierno/maquetas/falange/fisica.js`: la conexión con la escena (medidas para el guion, interruptor `?fisica=0`).
- `escena.js`: solo líneas de conexión (listadas en el parte).

## Guion de fotos (`gobierno/capturas-tarea/FI1-*.jpg`)
`h-choque` y `v-choque` (las puntas tocan los escudos del manípulo, 844×390 y 390×844) · `h-choque-antes` (lo mismo con
`?fisica=0`: el antes) · `h-colados` (un colado apretado contra la primera fila) · `h-flanco` (el flanco que llega a los cuerpos)
· `v-cerca` (plano a ras de las puntas).

## Historia
El empuje de las filas de detrás sobre las de delante (*othismos*) es histórico para la falange (Asclepiódoto 5; Polibio
18.30: las filas de detrás empujan con el peso del cuerpo). Las medidas (radios, cuánto resbala el asta, cuánto pasa a la fila de
detrás) son licencia de juego.
