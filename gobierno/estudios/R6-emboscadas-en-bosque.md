# R6 · Emboscadas en bosque (Praetorians, 2003)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Cómo deja Praetorians esconder tropas en bosque o hierba alta, cómo se descubren y qué gana quien emboscada?

## 2. Observación
1. Quien está fuera del bosque no ve lo que hay dentro. [GameSpot, reseña](https://gamespot.com/reviews/praetorians-review/1900-6023333/)
2. La infantería puede echarse en la hierba alta para esconderse. No toda unidad puede esconderse en árboles. [Impresiones GameSpot](https://gamespot.com/articles/praetorians-impressions/1100-2911675/)
3. Lo escondido sigue invisible salvo que una unidad enemiga entre en la misma zona. Fuente: resumen en [wiki](https://www.doc.surf/wiki/praetorians-video-game) (secundaria).
4. Los exploradores animales: el halcón mira de lejos (colina, camino); el lobo encuentra unidades entre los árboles. [Reseña WorthPlaying](https://www.worthplaying.com/article/2003/5/8/reviews/9948-pc-review-praetorians/)
5. La hierba se puede quemar para sacar una emboscada. (Misma fuente 2.)
6. Sin confirmar: alcances de detección, bono exacto de la primera descarga, papel de la altura. Una guía de fans ([FAQ 2004](https://the-spoiler.com/STRATEGY/Pyro.studios/praetorians.1.html)) lo trataría, pero la red del contenedor no la abre.

## 3. Por qué funciona
El jugador piensa antes de la batalla: dónde esconderse y dónde mirar. Ganas por saber, no por clics. El enemigo también puede ser listo, así que explorar tiene valor.

## 4. Traducción a AQVILA
Se apoya en lo que ya hay: bosque en `terrenoEn` y `BOSQUE_*` (A5b), zona de despliegue (A5a/A5c), estandartes (L2).
- **Quién entra**: solo un regimiento colocado dentro del bosque en el despliegue. Infantería ligera y media, tiradores y vélites; no elefantes ni caballería pesada (licencia de juego).
- **Escondido**: el enemigo no ve su estandarte ni su carta. La IA enemiga lo ignora como objetivo. Vive en `js/battle.js` (campo `oculto`) y se dibuja en `js/gfx/battle3d.js` (oculto = sombra tenue para el dueño, nada para el rival).
- **Descubrir**: se revela cuando (a) un enemigo se acerca a unos 25 m, (b) el regimiento ataca o dispara, o (c) un explorador lo ve. Explorador = caballería ligera o vélites, con alcance mayor; el halcón/lobo es licencia. La altura (colina A5b) amplía el alcance del que mira.
- **Ventaja**: la primera carga o descarga sale con bono y causa un golpe a la moral del rival (A8). Un regimiento flanqueado por sorpresa se desordena.
- **Con L3**: las cartas de táctica podrían incluir «emboscada». Choca con I2 en nada. Amplía A5b y A8. Aporta la mitad de lo que G3 llamaba «Río y emboscada» (tarea 6).
- **Móvil**: horizontal, un toque más en el despliegue («Esconder»). Sin niebla de guerra nueva. Offline.

## Historia (280–146 a.C.)
- **Histórico**: Trasimeno 217, Aníbal esconde a su ejército en las colinas y la niebla del lago (Polibio III 83-84; Livio XXII 4-6). Trebia 218, Magón con unos 2.000 hombres oculto en un cauce (Polibio III 71-74; Livio XXI 54-56).
- **Licencia de juego**: ocultar por zona de bosque en un campo pequeño; halcón o lobo; el bono numérico; quemar hierba. El bosque romano es en parte invento del campo de batalla de 4 tipos.

## 5. Coste y riesgo
- 1 sesión media-grande: 1,0–1,5 M de tokens (una tarea media ha costado 0,7–1,5 M; afinar números de batalla cuesta el doble, así que si hay ajuste, hasta 2–3 M).
- Riesgos: la IA enemiga debe saber emboscar o el truco solo sirve al jugador; tocar el bot de pruebas (hoy gana 8 de 10); ocultar en 3D sin que parezca un fallo; si el rival no ve, ¿cómo lo comprueba el juez? Hay que probar la lógica en Node.

## 6. Versión mínima
Un regimiento de tiradores o infantería ligera colocado en bosque se oculta hasta que un enemigo está a 25 m o ataca, y su primera descarga hace más daño. Sin exploradores aún.
