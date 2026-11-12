# R20 · Bajar de nivel en el mapa (de three-scope-map a AQVILA)

Pedido del usuario, 12/11/2026: «Instala este repositorio para que nos sirva para las regiones». Eligió A, B y C. Esto es la B.
Se estudia una mecánica, no se copia nada. El kit es de 宋夏天Dazzle, con licencia LicenseRef-Summer-Platform-Restriction-1.1, que **no es libre**. Copia de consulta en `.claude/skills/three-scope-map/`.

## Pregunta
¿Cómo pasa ese kit de mundo a país, provincia y ciudad sin que el jugador se pierda y sin que el móvil se atasque?

## Qué hace (fuentes: `references/map-drilldown.md`, `map-scope-switching.md` y `performance-pipeline.md` del kit)
1. **Escalones fijos.** Cada nivel tiene sus bordes, sus nombres, lo que se puede tocar y su encuadre de cámara. Lejos se ven pocos nombres y pequeños; cerca, más (*scope-switching*).
2. **Tocar baja, solo si hay algo debajo.** Pasar el dedo resalta; tocar entra. El último nivel no baja más y se queda señalado (*drilldown*, «Runtime Behavior»).
3. **«Volver» exacto.** Guarda el nivel entero (datos, cámara, nombres) en una pila y vuelve al mismo sitio (*drilldown*).
4. **Cambio limpio.** Lo de arriba se apaga, se cambian los datos y aparece lo nuevo. No queda nada del nivel anterior: ni nombres, ni rutas, ni brillos (*drilldown*, «Visual Continuity»).
5. **Rendimiento.**
   - El primer nivel va dentro del juego.
   - Los demás se preparan antes, con bordes simplificados, se guardan en caché y se precargan cuando el dedo se posa.
   - Solo se construye el nivel pedido, y el anterior sigue a la vista hasta que el nuevo pinta su primer cuadro (*performance-pipeline*).

## Por qué funciona
El jugador siempre sabe dónde está y cómo volver, sin pelearse con el pellizco. Y el móvil nunca carga más de un nivel pesado a la vez.

## En AQVILA
Tres escalones sobre el relieve real que ya hay (C2b y C2c), con código propio:

| Escalón | Qué se ve | Qué se toca |
|---|---|---|
| **Mare Nostrum** | Mapa entero; solo nombres de región (Italia, Sicilia, Hispania, África, Grecia…) | Una región |
| **Región** | Ciudades, pueblos y rutas de esa región; lo de fuera, apagado (I6 ya lo hace) | Una ciudad |
| **Ciudad** | La ciudad 3D (C1: zoom continuo del mapa a la ciudad) | Edificios |

- **Arriba**, migas de pan: «Mare Nostrum › Italia › Roma», con «← volver», que restaura el encuadre exacto.
- **El pellizco libre se queda.** Los escalones son un atajo, no una jaula.
- **Archivos**:
  - `js/gfx/map3d.js`: escalón actual, pila de volver, encuadre por región sacado de sus ciudades, nombres por escala.
  - `js/ui.js`: migas y «volver».
  - Región de cada ciudad: lo deja I6 (y J3) en `js/data.js`.
  - Si hacen falta bordes dibujados: `tools/` los genera simplificados en `assets/mapa/regiones.json`, con bordes de la época sacados de fuentes (skill `historia`), nunca de los mapas de China del kit.
- **Rendimiento**: la ciudad 3D se prepara al bajar, y el mapa sigue dibujado hasta su primer cuadro.

## Coste y riesgo
- **Versión mínima**: una sesión, unos 0,8 M. **Completa**, con la transición a la ciudad (C1): unos 2 M.
- **Choca con I6**, en marcha ahora en `map3d.js`, **y con J4**. Va después de I6 y dentro de J4. C4 (ríos) dibuja encima sin tocar los escalones.
- **Riesgo que vería el usuario**: que el mapa parezca encorsetado. Por eso el pellizco libre se mantiene.

## Versión mínima
Tocar el nombre de una región acerca la cámara a ella, cambia los nombres a los de sus ciudades y enseña «← Mare Nostrum». Sin bordes dibujados todavía.
