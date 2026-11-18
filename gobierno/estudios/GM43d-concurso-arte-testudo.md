# GM43d · Concurso de arte del testudo a pie: reglas (17/11/2026)

Pedido del usuario (17/11, tras probar GM43c en su móvil): «a nivel artístico se ve muy mal, hay que embellecerlo
artísticamente, busca packs o cosas en internet para mejorarlo». Y después: «Abre un concurso de arte con unas reglas
definidas, que los participantes sean Opus con acceso a todas las herramientas que necesiten, incluso todas las de
GitHub y de donde más sitios haya, y mejoren la parte estética del testudo. Que se abra otra sesión con el concurso de
arte a ver qué sale mejorado de ahí».
Es una excepción suya a «sin concursos hasta la 1.0». No abre más tareas ni toca el plan de la 1.0.

## Qué se concursa
Solo el **aspecto** de la maqueta `gobierno/maquetas/testudo-a-pie/` (GM43c): que parezca un juego cuidado y no una
prueba. Lo que hoy se ve pobre, por orden de lo que más pesa en la pantalla del móvil (mirar `capturas-tarea/GM43c-v-*.jpg`
y las dos capturas del usuario del 17/11):
1. **Suelo y hierba**: plano, de un color, matas iguales y a cuadros. Sin tierra pisada, piedras ni flores.
2. **Cielo y fondo**: degradado liso, montes sin detalle, sin nubes ni sol, sin árboles ni nada en el horizonte.
3. **Luz**: plana. Los hombres no dan sombra, no hay contraluz ni polvo; bajo los escudos no hay penumbra de verdad.
4. **Soldados de cerca**: nuca negra lisa, piel y tela sin relieve, todos iguales. (Los modelos nuevos son de GM44: aquí
   solo se puede mejorar cómo se ven los de hoy: sombreado, variación de color, suciedad.)
5. **Escudos, pila y venablos**: madera limpia, sin desgaste; venablos sin plumas ni sombra.
6. **Pantalla**: botones y cintas correctos pero sin marco de época; falta viñeta, grano o color que dé ambiente.
No se concursa: reglas, botones, cámara, gestos ni sonido (se quedan como están; si algo estorba, se dice, no se cambia).

## Participantes
**Tres agentes Opus** (`constructor`), cada uno a su aire y sin ver a los otros. Dirige y arbitra la sesión (Fable): no
construye. Cada participante trabaja en **su copia**, que parte de la maqueta de hoy:
`gobierno/maquetas/testudo-concurso/a/`, `…/b/` y `…/c/` (direcciones nuevas: así el móvil no enseña una copia vieja guardada).
Para que no salgan tres veces lo mismo, cada uno lleva una línea (puede tocar lo demás si le sobra):
- **A · «Luz de cine»**: sombras, contraluz, niebla y polvo, color y contraste, penumbra de verdad bajo los escudos.
- **B · «Campo de batalla»**: suelo, hierba, piedras, árboles, cielo con nubes y horizonte, usando texturas y piezas libres.
- **C · «Hombres y hierro»**: cómo se ven de cerca soldados, escudos, pila y venablos; desgaste, variación, brillo del bronce.

## Herramientas y fuentes
- Todo lo que haga falta: navegador con Playwright, red, las herramientas de GitHub (leer y clonar repositorios públicos
  con arte libre), `tools/` y la skill `arte`.
- **Licencia antes que píxeles.** Solo arte con licencia libre comprobada **en su fuente**: CC0, CC BY, CC BY-SA 3.0 u
  OGA-BY. Fuentes ya admitidas: Kenney, Quaternius, OpenGameArt y 0 A.D. Para este concurso el usuario pidió «de donde
  más sitios haya»: valen también Poly Haven y ambientCG (CC0) y repositorios públicos de GitHub con licencia clara.
  Se descartan GPL, CC BY-SA 4.0, «uso no comercial» y todo lo que no diga su licencia.
- **Nada de juegos comerciales**: ni extraído, ni calcado. De Ryse, solo la idea.
- Época 280–146 a.C.: escudo ovalado, casco montefortino, sin legionarios imperiales.
- Cada pieza traída lleva su línea en `LICENSE.txt` dentro de la copia: qué es, autor, licencia y enlace.

## Límites
- Solo su carpeta. Nada de `js/`, `css/`, `assets/`, `sw.js` ni de la maqueta original.
- **Peso**: lo añadido, 6 MB como mucho por propuesta. **Móvil**: sin efectos que un teléfono no mueva (nada de sombras
  de toda la escena a 4K ni varias pasadas de pantalla completa); decir cuántas llamadas de dibujo añade.
- Tiene que seguir funcionando: su `captura.mjs` en APTO (encuadre, partida entera, «Correr», sin errores de consola).
- Presupuesto: 1,2 M por participante y 0,6 M para dirigir. Total 4,2 M. Con alerta de `node gobierno/gasto.mjs`, parar y contarlo.

## Entrega de cada participante
- Seis capturas a 390×844 (marcha, salva, testudo, golpe, cara, carga) y dos a 844×390, en
  `capturas-tarea/GM43d-<a|b|c>-*.jpg`, sacadas con su `captura.mjs`.
- Media página: qué cambió, qué trajo de fuera (con licencia), megas que suma y qué quedó flojo.

## Jurado
1. El director monta una **lámina de comparación** (hoy, A, B y C, la misma escena lado a lado, en vertical) y un informe
   corto `estudios/GM43d-concurso.md` con una nota por criterio: se lee a 390 px (30), ambiente de batalla antigua (30),
   coherencia con el resto del juego (20), peso y fluidez (10), licencias limpias (10).
2. **Decide el usuario**, mirando la lámina y probando los tres enlaces en su móvil. Puede mezclar («la luz de A con el
   campo de B»). Lo elegido se construye después, como tarea aparte, sobre la maqueta original.
3. Para darle enlaces hay que subir las tres copias a la rama del juego: solo con su «sí» y con los jueces como manden
   las reglas del proyecto.

## Cierre
Tablero (GM43d), bitácora, parte, commit y push a la rama de la sesión del concurso. Contarle en llano, con la lámina.
