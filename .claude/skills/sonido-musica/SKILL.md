---
name: sonido-musica
description: Habilidad del Director de Sonido de AQVILA para la banda sonora (P164): música de época para menú, ciudad, mapa y batalla, de dónde sale con licencia libre o hecha por nosotros, cuánto pesa y cómo pasa de una pieza a otra. Úsala antes de meter cualquier música.
---

# Banda sonora

Primero lee la skill `sonido`. Pedido del usuario (17/11, P164): «habría que crear una banda sonora también para el
juego». Aún no hay música en AQVILA: **todo lo de aquí es nuevo y pasa por su sí** (tamaño de descarga y estilo).

## Qué música, y dónde
| Pantalla | Carácter | Instrumentos de partida |
|---|---|---|
| Menú | Solemne, corta, entra y calla | cornu y tuba lejos, tympanum suave |
| Ciudad | Tranquila, de trabajo; debajo del ambiente | lira o cítara, tibia (flauta doble) |
| Mapa de campaña | Paso de marcha, de pensar | tibia, tambor lento |
| Batalla | Sube con el choque, baja en la espera | tuba y cornu (órdenes), tambores, coro corto |
| Victoria / derrota | Una frase de 5–10 s, no un bucle | cornu / tibia sola |
Escalas: modos antiguos (dorio, frigio, mixolidio) y melodía sobre un bordón. Sin acordes modernos (séptimas, progresiones
de pop). Si se usa algo «de película» para que emocione, se marca **licencia de juego** en la ficha. Dictamen: `historia`.

## De dónde sale (por orden)
1. **Hecha por nosotros, por código** (WebAudio en `js/gfx/musica.js`): bordón + melodía en modo antiguo con timbres de
   flauta, cuerda pulsada y tambor. Pesa 0 KB y es «propia». Sirve para ciudad y mapa. Suena sencilla: enséñala antes.
2. **Grabada con licencia libre**: OpenGameArt (CC0, CC BY, OGA-BY), Kenney, Incompetech solo si la pieza dice CC BY.
   Comprobar en la página que no sea «no comercial» ni de un disco. Línea en `assets/musica/LICENSE.txt`.
3. Nunca: música de juegos, películas o discos, ni «inspirada» calcando melodías.

## Peso (decirlo antes de meterla)
mp3 estéreo 44,1 kHz a ≈ 96 kb/s ≈ 0,7 MB por minuto. Tope por pista 900 KB (≈ 75 s de bucle). Cinco pistas ≈ 4 MB:
es todo el presupuesto de audio. Por eso: bucles cortos que encadenan bien, y lo largo por código.
Escribe la cuenta en el parte («+3,2 MB de descarga: de 41 a 44,2 MB») y espera su sí si pasa del tope.

## Cómo suena dentro del juego
- Un reproductor, `js/gfx/musica.js` (del taller), conectado a `Sonido.maestro` por una ganancia propia (capa «música»).
- Cambio de pantalla: **fundido cruzado de 2 s**; nunca corte seco. Al sonar una orden (cuerno), la música baja ≈ 6 dB un segundo.
- Bucles sin costura (`bucle` de `tools/sonido.py`); la música para al ocultar la pestaña (como ya hace `sonido.js`).
- Se carga después de la primera pantalla y nunca bloquea el arranque; sin red, suena la de la caché o la de código.
- Para enchufarlo en cada pantalla: **pase** a su área (`ui.js` es común; `ui-guerra.js` es de Batallas).

## Pruebas
`node gobierno/juez-sonido.mjs --carta` (peso, nivel, licencia, caché). Una prueba en Node de `musica.js` si tiene lógica
(qué pieza toca en cada pantalla). Y la pregunta al usuario: qué escuchar, dónde y qué decidir (sí / otra / sin música).
