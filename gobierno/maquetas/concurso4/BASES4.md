# Bases de las rondas K6b y K6c (12/11/2026)

## Qué decidió el usuario
- Del concurso K6 (batalla y tropas) descarta **L Casillas, N Mensajeros y O A pie**. Le gusta **P Friso** por su diseño (1.º, 34 puntos) y **M Cuaderno de campo** (2.º, 31 puntos).
- Quiere **dos concursos separados**:
  - **K6b · Batir a Friso**: cinco maquetas nuevas que superen a Friso.
  - **K6c · Batir a Cuaderno**: cinco maquetas nuevas que superen al Cuaderno.
- Quiere además, en las dos rondas: **ver el mapa en grande** (todo el campo desde arriba) y **dirigir por turnos**, y que sea **entretenido**. Cómo se resuelve lo decide cada concursante.

## Lo que hay que batir (mira solo las capturas de referencia; no abras los HTML de otros)
- K6b: `gobierno/maquetas/concurso3/capturas/K6-B-1.jpg` (despliegue) y `K6-B-2.jpg` (choque con órdenes).
- K6c: `gobierno/maquetas/concurso3/capturas/K6-E-1.jpg` y `K6-E-2.jpg`.
- Friso gana por arte y por escala. Sus dos problemas: los cuatro botones fijos sobran, y arrastrar una orden no se descubre solo.
- Cuaderno gana por legibilidad para un jugador nuevo. Su problema: a 30 regimientos por bando hay que pasar muchas páginas.

## Lo que pide la ronda (todas las propuestas)
1. **Mapa en grande**: se ve el campo entero desde arriba, con los regimientos como símbolos y el enemigo a la vista. Desde ahí se toca un regimiento y se da la orden. Se puede entrar a la escena para ver el choque.
2. **Turnos**: en cada turno se planean órdenes con pausa y luego el turno se ejecuta para los dos bandos. Se ve cuánto dura el turno y cuánto falta.
3. **Entretenido**: algo que tenga gracia de jugar, con riesgo visible o decisiones con consecuencia, sin volverse un formulario.
4. Como antes: artístico, escalable (20 y 30 regimientos, 1.500 m de campo, un río) e intuitivo (prueba de los 5 segundos, prueba del pulgar, pocos botones).

## Los conceptos (uno por concursante; no cambies de concepto)
**K6b · Batir a Friso**
- **K6b-1 · Mapa-tablero**: cuadrícula de terreno en cenital con fichas de legión; turnos por pasos; zoom a la escena.
- **K6b-2 · Dados y fortuna**: cada turno cada legión tira dados a la vista; las probabilidades se ven antes de decidir.
- **K6b-3 · Consejo de tribunos**: cada turno un informe con tres opciones de los tribunos; el terreno y la tropa deciden el resultado.
- **K6b-4 · Ruta y relevo**: las legiones avanzan por caminos del mapa, por turnos; la batalla empieza cuando se cruzan.
- **K6b-5 · Reloj de agua**: cada turno tiene un reloj de agua con un presupuesto de órdenes que se gasta al planear.

**K6c · Batir a Cuaderno**
- **K6c-1 · Tabula de caminos**: mapa de caminos en estilo de tabla itineraria; turnos de marcha; batalla al llegar.
- **K6c-2 · Tablero de juego**: piezas de marfil y madera en un tablero de juego de mesa romano; turnos y fichas.
- **K6c-3 · Cartas de campaña**: en cada turno se elige una carta de maniobra; el mapa en grande muestra el efecto.
- **K6c-4 · Señales de campo**: turnos marcados por cuernos y banderas; el mapa muestra las señales que recibe cada legión.
- **K6c-5 · Planos de arquitecto**: planta y corte del campo; cada turno se ve el plano y el corte de la línea.

## Reglas comunes
- Un solo HTML autocontenido, sin dependencias externas. La letra Cinzel puede cargarse desde `../../../assets/fuentes/cinzel-700.woff2`.
- **Horizontal, 844×390**, sin scroll en cada pantalla.
- Español; frases cortas; cada botón dice lo que hace.
- Arte: solo de 0 A.D. (CC BY-SA, en `assets/`) o hecho a mano en SVG/CSS.
- Tocas **solo** tus archivos en `gobierno/maquetas/concurso4/` (HTML, nota y capturas). No toques `js/`, `css/`, `index.html`, `sw.js`, `gobierno/estudios/` ni nada de `gobierno/maquetas/concurso3/`, salvo leer las capturas de referencia.
- **Cuatro pantallas**, en este orden: (1) mapa en grande con el turno planeado; (2) escena o choque con 20 o más regimientos; (3) dos turnos seguidos o un momento de riesgo; (4) resultado o retirada.
- **Presupuesto: 0,2 M de tokens como máximo, y como mucho 12 llamadas de herramienta.** Una sola pasada: escribir el HTML (400 a 700 líneas), capturar las cuatro pantallas una vez con Playwright, mirar tus cuatro capturas una vez y arreglar solo lo roto. **Sin rondas de pulido y sin mirar otras capturas.**
- Playwright: Chromium ya está instalado. `require('playwright')` funciona desde cualquier carpeta; `chromium.launch()` sin opciones; viewport 844×390 y `deviceScaleFactor: 2`. No instales nada.

## Entrega (K6b-N o K6c-N, por ejemplo K6b-1 · nombre en el archivo)
1. `gobierno/maquetas/concurso4/K6X-N-nombre.html`
2. Capturas JPG en `gobierno/maquetas/concurso4/capturas/K6X-N-1.jpg` a `-4.jpg`.
3. `gobierno/maquetas/concurso4/K6X-N-nombre-nota.md`, con **siete líneas numeradas**:
   1. La idea (en una frase).
   2. Cómo se maneja con el pulgar, y cómo se pasa del mapa en grande a la escena.
   3. Cuántos botones a la vista.
   4. Dirección de arte y de dónde sale.
   5. Cómo escala (a 20 y 30 regimientos, a 1.500 m) y cómo se vive el turno.
   6. Qué habría que cambiar en el juego (`js/ui.js`, `js/gfx/battle3d.js`, `js/battle.js`). Solo proponer.
   7. Coste estimado en tareas.
   **La nota es ciega**: no pongas el nombre del concepto ni de la ronda, ni la palabra «Friso» ni «Cuaderno».
4. Al terminar responde con tres líneas: el HTML, las capturas y la nota. Nada más.
