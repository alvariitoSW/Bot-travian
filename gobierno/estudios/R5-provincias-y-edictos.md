# R5 · Provincias y edictos (estudio de ingeniería reversa)

Solo ideas de cómo se comporta el juego. Nada de código, arte, textos ni nombres copiados. Nada entra al tablero sin tu
aprobación.

## 1. Pregunta
¿Cómo hace *Total War: Rome II* para que controlar un grupo de ciudades dé más que la suma de sus partes, sin que el
jugador se pierda gestionando cada una?

## 2. Observación
1. **Provincia = hasta cuatro regiones**, cada una con un asentamiento donde se construye.
   [Manual oficial](https://r2encv2.totalwar.com/en/manual/single-player/0044_enc_page_campaign_play_province_regions/index.html)
2. **Capital con más solares.** La capital de la provincia tiene más huecos de construcción que las demás (la guía
   dice seis frente a cuatro). [Guía](https://www.gamepressure.com/totalwarromeii/expansion-and-development-of-the-province/ze5711)
3. **Edictos.** Un decreto por provincia, que se emite desde la capital y **solo si controlas toda la provincia**.
   Dura hasta que lo cambias. Da más impuestos, comida u orden público. Cuántos puedes tener depende del poder de tu
   facción. [Manual oficial](https://r2encv2.totalwar.com/en/manual/single-player/0044_enc_page_campaign_play_province_regions/index.html)
   (la regla de «provincia entera» también en una [guía](https://gamepressure.com/totalwarromeii/edicts/zf5712))
4. **Orden público compartido.** Un templo en la capital sube el orden en todas las regiones de la provincia.
   [Guía](https://www.gamepressure.com/totalwarromeii/expansion-and-development-of-the-province/ze5711)
5. **Se ve el porqué.** Al pasar el dedo (ratón) sobre la cifra de orden salen las causas, buenas y malas; descuidar la
   suciedad acaba dañando el orden. [Guías de estrategia](https://www.gamepressure.com/totalwarromeii/domestic-policy/za579e)
6. **El tipo de gobierno cambia cuántos edictos y cuánto orden** (parche posterior).
   [Notas del parche](https://wiki.totalwar.com/w/Total_War_ROME_II:_Patch_15)

**Sin confirmar**: números exactos de cada edicto, su coste, y el reparto de solares por tipo de ciudad. Las webs de guías
estaban bloqueadas en este contenedor y solo he leído fragmentos de búsqueda. No pongo cifras.

## 3. Por qué funciona
- **Objetivo de conquista claro**: «toma las tres que faltan y se abre el decreto».
- **Un solo botón por provincia** en vez de veinte decisiones por ciudad: encaja con pantallas pequeñas.
- La capital importa: perderla duele más que perder una aldea.

## 4. Traducción a AQVILA
**Qué es histórico.** Roma organizó *provinciae* a partir de 241 a.C. (Sicilia; Cerdeña y Córcega en 227, con pretores
para cada una): probable, por cotejar con Livio, *Períocas* XX y Polibio I. Cada provincia tenía su estatuto propio
(Cicerón, *Verrinas*, sobre la ley de Hierón en Sicilia). Los magistrados publicaban *edicta*. **Licencia de juego**:
que el decreto dé bonus en cifras, y la regla «solo con la provincia entera».

**Qué se apoya en lo que ya existe**
- *J4 mapa por regiones*: **es la base**. Cada región ya tiene capital y núcleos; el edicto se añade encima. Sin J4 no
  hay provincia. Después de J3 y J4.
- *I4 solares y tipos de ciudad*: la capital recibe +2 solares (dato en `D.TIPOS` o regla nueva en `js/data.js`).
  Amplía, no choca.
- *B3 felicidad e impuestos*: los edictos tocan impuestos y ánimo. Orden público «por provincia» = media de la
  felicidad de sus ciudades, con el desglose visible al tocarla.
- *F5 templos e inquietud*: el templo de la capital calma a toda la provincia (hoy calma solo la propia ciudad).
- *B2 rutas*: edicto de «calzada»: rutas dentro de la provincia dan más oro.
- *J5 Senado*: el apartado «Senado» muestra los edictos y los planes. **Se une a J5**; comparten pantalla.
- *I5 investigación*: el número de edictos puede subir con las edades. Se decide después.
- *C3 diplomacia*: ninguna colisión.
- *J1/J6/P65*: la provincia sale como chip en la pestaña Gobierno; la ciudad sigue siendo la pantalla principal.

Lógica en `js/data.js` (provincias, edictos) y `js/game.js` (efectos, guardado migrado); lo visual, una tarjeta
por provincia en `js/ui.js`, a 390 px. Offline sin problema.

## 5. Coste y riesgo
Una tarea media ha costado 0,7–1,5 M.
- Etapa 1, provincias agrupadas y capital con solares: ~0,2 + 0,6 M.
- Etapa 2, edictos (3–4) y orden público por provincia con desglose: ~0,25 + 0,8 M. Más ajuste del bot, ~0,5 M.
- Total orientativo: **2–2,8 M**, en dos sesiones.
- Riesgo: depende de que J3 y J4 estén hechas. El bot de pruebas puede cambiar su ritmo. Se vería como números de ciudad
  que de repente cambian; hay que mostrar siempre «de dónde viene».

## 6. Versión mínima
**Agrupar las ciudades actuales en provincias y permitir UN edicto (ej. «bajar impuestos») solo si las tienes todas.**
Sin tocar solares ni orden público todavía.
