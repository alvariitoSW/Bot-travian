# G3 · Batallas más estratégicas · plan y presupuesto

Una página. Nada se construye hasta que apruebes. Ideas de Total War; nunca su código ni su arte.

## Qué falla hoy, en cinco líneas
1. **Duran poco**: entre 1 y 4 minutos, y a los 4 minutos se cortan solas y gana el defensor.
2. **El terreno es decorado**: las colinas se ven, pero no dan ni quitan nada. No hay bosque ni río.
3. **No despliegas**: el juego coloca siempre igual (ligeros delante, línea, caballería en las alas).
4. **No hay formaciones**: una falange y unos vélites se colocan y pelean del mismo modo.
5. **Se deciden de golpe**: la moral cae en cadena y solo puedes mandar «ve allí» o «ataca a ese».

## Cómo se mide
**M** = millones de tokens, como en `plan-12.md`. **Medido**: una tarea media de la tanda anterior costó de verdad
unos 0,15 M de Fable y 0,35 M de Sonnet (los presupuestos de Sonnet se gastaron al 36 %). **A ojo**: todo lo de
abajo; ya va rebajado a la mitad respecto a la tanda anterior, con margen. Los minutos son de trabajo de la sesión.
Quién: el director (Fable) encarga y mira capturas; construye un agente en Sonnet; revisor en Sonnet si cambia reglas.

## El plan: diez tareas, una sesión cada una
Cada una se nota al jugar el mismo día. Reescribe y parte las tareas A1 a A6 del tablero; no duplica ninguna.

| Nº | Qué verás | Fable · Sonnet · min |
|---|---|---|
| 1 | **Ritmo y moral.** Batallas de 8 a 12 minutos. La moral baja poco a poco; las tropas se cansan | 0,15 · 0,4 · 12 |
| 2 | **Despliegue.** Antes de empezar colocas tus regimientos en tu mitad y pulsas «Empezar batalla» | 0,2 · 0,7 · 20 |
| 3 | **Terreno: colina y bosque.** Arriba se pega más y se dispara más lejos; el bosque esconde y frena | 0,25 · 0,9 · 25 |
| 4 | **Formaciones.** Cada regimiento elige: línea, cerrada (falange, testudo), abierta o cuña | 0,2 · 0,7 · 20 |
| 5 | **Órdenes y pausa táctica.** Pausas, das órdenes y sigues: mantener, ceder terreno, reserva | 0,2 · 0,6 · 20 |
| 6 | **Río y emboscada.** Cruzar frena y cansa; tropas escondidas que entran tarde por la espalda | 0,2 · 0,7 · 20 |
| 7 | **Combate realista.** Solo pelean las primeras filas, relevo de líneas, persecución, armas y armaduras | 0,2 · 0,7 · 20 |
| 8 | **Batallas históricas.** Botón en el menú: Zama, Cannas… con su ficha y un rival que sigue el guion | 0,2 · 0,6 · 20 |
| 9 | **Verlo mejor.** Lanzas bajadas, testudo, cámara que sigue las cargas, polvo y sonido | 0,2 · 0,8 · 25 |
| 10 | **Mando fino.** Arrastrar para dar ancho y frente, columna de marcha, grupos | 0,15 · 0,5 · 15 |
| | **Total** | **1,95 · 6,6 · unas 3 h 20 min** |

**Versión simple y de qué depende cada una**
1. Solo números del motor y sus pruebas; se quita el corte a los 4 minutos. *Viene de A4 (equilibrio). No depende de nada.*
2. Tres plantillas con un toque (línea, tres líneas, alas fuertes) y arrastrar cada regimiento. El rival despliega
   solo. *Viene de A5. No depende de nada.*
3. Cuatro campos tipo (llano, colina, bosque, mixto), uno por ciudad. Una cuadrícula gruesa que usan igual el motor
   y la vista. Árboles de los que ya hay en la ciudad. *Viene de A5. Mejor después de la 2: sin elegir sitio, el
   terreno no se aprovecha.*
4. Un botón por regimiento, dos o tres formaciones según la tropa. Cerrada: aguanta de frente, lenta, débil por el
   flanco. Abierta: menos bajas por proyectiles. Sin animaciones nuevas. *Viene de A1. No depende de nada.*
5. La pausa ya existe; se añaden tres órdenes y la cola. «Reserva» = no entra hasta que la llames. *Nueva. Mejor tras la 1.*
6. El río es una franja del campo con uno o dos vados. La emboscada es una reserva que no se ve. *Nueva. Depende de 3 y 5.*
7. *Viene de A3 y A4.* Cambia mucho el equilibrio: lleva revisor y la prueba del bot. *Depende de 1 y 4.*
8. Solo con fichas ya cotejadas por Historia (H2b). El rival cede el centro o guarda la tercera línea. *Depende de 5 y de H2b.*
9. *Viene de A2 y A6.* Solo después de que midas la fluidez en tu móvil (D1). *Depende de 4 y D1.*
10. *Resto de A1.* Es comodidad; puede no hacerse.

A7 (ciudades enemigas con su cultura) no entra aquí: es arte, no táctica.

## Qué batallas quedan jugables tras cada paso
| Batalla | Qué necesita | Tras la tarea |
|---|---|---|
| **Zama** | Campo llano, tres líneas, pasillos (formación abierta), reserva | 5 (bien: 8) |
| **Cannas** | Centro que cede, alas que giran, caballería por detrás | 5 (bien: 8) |
| **Pidna** | Terreno quebrado que desordena la falange | 4 |
| **Trebia** | Río helado, emboscada de Magón | 6 |
| **Trasimeno** | Colinas, lago, sorpresa, niebla | 6 (sin niebla) |

«Bien» = con el rival jugando como el general histórico. Las fichas son **provisionales** hasta el cotejo H2b.
Los pasillos de Zama, el frío de Trebia y la niebla de Trasimeno serán simplificaciones marcadas «licencia de juego».
El motor aguanta unos 12 regimientos por bando: son las proporciones de cada batalla, no sus cifras reales.

## Riesgos
- **Tu móvil, sin medir.** Aquí solo hay render por software. Batallas más largas calientan más el teléfono; el
  bosque añade árboles. La tarea 3 pone pocos árboles y la 9 espera a tu medida (D1).
- **Equilibrio.** Las tareas 1, 3, 4 y 7 cambian quién gana. El bot de pruebas debe seguir tomando Cartago; si no,
  una vuelta de ajuste (+0,3 M de Sonnet, a ojo).
- **Pantalla pequeña.** Desplegar doce regimientos con el dedo cansa: por eso las plantillas de un toque.
- **Resolución rápida.** «Resolver sin ver» usa el mismo motor: tardará algo más en calcular. Se vigila en la 1.
- **Pantalla sin medir aquí**: cómo de cómodo es arrastrar en horizontal. Lo dirás tú con la tarea 2.

## Recomendación: las tres primeras
**1 (ritmo), 2 (despliegue) y 3 (colina y bosque)**, en ese orden: **0,6 M de Fable, 2,0 M de Sonnet, 1 hora**.
Con las tres ya tienes lo que pediste: batallas largas, pausadas, donde eliges dónde plantarte. La 4 (formaciones)
iría justo después. Si prefieres las formaciones antes que el terreno, se cambian de sitio sin coste.
