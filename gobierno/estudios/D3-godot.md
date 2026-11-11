# D3 — ¿Pasar AQVILA a Godot 4?

Estudio de una página. Sin tocar el juego.

## 1. Qué se ganaría
- **Más soldados a la vez.** Godot dibuja miles de copias de un modelo (MultiMesh) con menos trabajo que three.js. Hoy la animación va «horneada» en una textura de huesos: es un truco nuestro para que el móvil aguante.
- **Editor.** Colocar edificios, cámaras y luces con el ratón, sin escribir código. Útil para ciudad y mapa.
- **Animación y colisiones ya hechas.** Hoy lo hacemos a mano.
- **Exportar a Android/iOS** como app nativa, con icono y tienda.
- **Poco más.** La lógica de batalla es nuestra y no usa la física de Godot.

## 2. Qué se perdería
- **Un enlace y a jugar.** Hoy: GitHub Pages, sin instalar nada. Una app nativa pide tienda o archivo APK; iOS exige cuenta de pago de Apple y Mac.
- **Cero compilación.** Hoy se edita y se recarga. Godot pide editor y exportar cada vez.
- **Pruebas en Node** (`test/sim.test.js`, 73 líneas): la lógica pura corre en tres minutos. En Godot habría que reescribirla en GDScript y probarla con otra herramienta.
- **Los jueces** (`gobierno/jueces.mjs`, 185 líneas, Playwright a 390×844) no sirven con una app nativa.
- **Que una sesión de IA edite todo.** El editor de Godot es visual; las sesiones aquí trabajan con texto y terminal.
- **Exportación web de Godot 4** (para no perder el enlace):
  - Peso: el motor son unos 35–40 MB, unos 9 MB comprimido, antes del juego (cifra de memoria, a comprobar). Hoy three.js son 0,7 MB.
  - Hilos: hasta Godot 4.2 la versión web exigía hilos, que piden cabeceras especiales que GitHub Pages **no deja poner**. Desde Godot 4.3 se puede exportar sin hilos, algo más lento. A comprobar aquí: no se ha instalado nada.
  - iOS Safari: más lento y con límites de memoria; a comprobar con el móvil real.
  - Offline: se puede, pero con otro service worker y archivos grandes.

## 3. Qué se reaprovecha
**Datos reales del repo:**
- `assets/`: 31 MB (unidades 20 MB, edificios/barcos/árboles 12 MB). Son 90 imágenes WebP y 45 archivos `.bin` propios.
- Los `.bin` son un formato **nuestro** (cuerpo, esqueleto y animación horneados). Godot no los lee: habría que escribir un importador, o reconvertir.
- El arte original de 0 A.D. (Collada/DAE + PNG/DDS) sí entra en Godot (admite glTF, y DAE con pérdidas). Lo sensato: volver a convertir DAE a glTF.
- Se tiran 6 scripts de `tools/` que hornean a nuestro formato. Se salvan `resolve_*.py` (deciden qué actor es cada unidad) y `fetch_0ad.sh`.
- Licencia CC BY-SA 3.0: se mantiene igual.

**Código (2.388 líneas JS en `js/`, pero muy densas):**

| Archivo | Líneas | Destino |
|---|---|---|
| `data.js` | 150 | Se pasa a recurso/JSON, fácil |
| `game.js` | 319 | Reescribir en GDScript |
| `battle.js` | 353 | Reescribir (o reusar vía JSON y puerto) |
| `ui.js` | 336 | Rehacer con nodos de Godot |
| `gfx/*` | 1.230 | Tirar y rehacer en el editor |

## 4. Coste a ojo (sesiones de 10–25 min)

| Bloque | Sesiones |
|---|---|
| Lógica (`data`, `game`) | 4–6 |
| Batalla (simulación + 3D) | 8–12 |
| Mapa | 4–6 |
| Ciudad | 4–6 |
| Interfaz móvil | 6–10 |
| Guardado | 1–2 |
| Arte (reconvertir 31 MB) | 5–8 |
| Pruebas nuevas | 5–8 |
| **Total** | **37–58** |

**Riesgo principal:** aquí no hay GPU ni móvil. Solo medimos con render por software. No sabríamos si Godot rinde mejor hasta haberlo pagado todo.

## 5. Alternativas más baratas
- **Quedarse en web y optimizar:** menos detalle a distancia (LOD), instancias (varias copias en una sola orden de dibujo), menos animaciones a la vez. Unas 3–6 sesiones.
- **Envolver la PWA** como app (TWA en Android, Capacitor en iOS/Android): mismo código, icono y tienda. Unas 2–4 sesiones; en iOS pide cuenta Apple de pago.

## 6. Recomendación
**No migrar a Godot ahora. Primero medir la fluidez en tu móvil (tarea D1), optimizar en web, y envolver como app solo si quieres tienda.**

Cambiaría si: D1 muestra que, ya optimizado, el móvil va por debajo de ~30 imágenes/s con una batalla grande; o si quieres vender en tiendas con juego nativo y aceptas perder el enlace único.
