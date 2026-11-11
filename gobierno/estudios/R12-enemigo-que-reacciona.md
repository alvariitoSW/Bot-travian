# R12 · Enemigo que reacciona (Ultimate General: Gettysburg y Civil War)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte ni texto suyo. Field of Glory II no se pudo estudiar (sin búsqueda): sin confirmar.

## 1. Pregunta
¿Cómo da una IA la sensación de que piensa, y cómo se reparte el trabajo entre lo que ordena el jugador y lo que la unidad hace sola?

## 2. Observación
1. Órdenes: se arrastran flechas de movimiento para mandar fuerzas grandes sin microgestión. [Ficha oficial Gettysburg](https://www.ultimategeneral.com/ug-gettysburg.html)
2. Las unidades actúan solas en lo menudo: se realinean, cambian de objetivo, se retiran y forman línea sin que el jugador lo mande. [Misma ficha, Steam](https://store.steampowered.com/app/502520)
3. Cada general enemigo no sigue guion: intenta flanquear, asegura puntos con artillería, guarda reservas y refuerza zonas. Hay nueve personajes IA en tres dificultades y la IA no recibe bonos numéricos. [Ficha de la IA](https://www.moddb.com/games/ultimate-general-gettysburg/features/game-features-ai)
4. La IA tiene los mismos límites de visión que el jugador, así que se pueden esconder fuerzas para emboscar. [Ficha de visión](https://www.moddb.com/games/ultimate-general-gettysburg/features/game-features-los)
5. Una versión posterior hizo que la IA se replegara más al atacar con muy mala proporción. [Parche 0,96](https://www.ultimategeneral.com/blog/ultimate-general-pre-release-patch-5)
6. Quejas de jugadores: la IA a veces rompe principios tácticos y castiga un flanqueo al instante; en la secuela, un señuelo al frente la despista. Reseñas y foros, anecdótico. [Quarter to Three](https://forum.quartertothree.com/t/ultimate-general-civil-war-catch-all/127808?page=2)
7. Sin confirmar: reglas exactas de «fuego a voluntad», cómo decide un repliegue, y todo de Field of Glory II.

## 3. Por qué funciona
El jugador manda el «qué» (adónde y contra quién) y la unidad el «cómo». La IA parece lista porque hace cosas visibles que un humano reconoce: alarga la línea, guarda reserva, se retira a tiempo. Y juega con las mismas reglas de visión.

## 4. Traducción a AQVILA
Encaja con N1 (cinco planes de IA, revisión cada ronda) y N4.
- **Reparto**: el jugador da destino, acción y objetivo (1 punto de mando). El regimiento decide solo: alinearse, cerrar huecos, cambiar al blanco más cercano si el suyo huye, tirar y retroceder si es ligero. Vive en `js/battle.js`.
- **IA con gestos legibles**: cada ronda hace una de cuatro cosas visibles: alarga el ala, manda la reserva al punto débil, busca tu flanco, o se repliega si va perdiendo (umbral por dificultad). Cada una con un aviso breve en pantalla («el enemigo estira su ala izquierda»), para que el jugador lo note.
- **Sin trampas**: la IA ve lo mismo que tú (con exploradores o no). Dificultad = más cuidado y reservas, no más tropas.
- **Dibujar con el dedo** sobre 844×390: un trazo corto basta; se suaviza a 2–3 puntos de ruta. Ya vive en `js/ui.js` (entrada) y `js/gfx/battle3d.js` (trazo).
- **Fallos vistos a evitar**: la IA no debe castigar el flanco con precisión perfecta; añadir un retraso de reacción de una ronda.

## Historia (280–146 a.C.)
- **Histórico**: Cannas 216, Aníbal cede el centro y envuelve (Polibio III 113-117, por cotejar). Zama 202, Escipión abre pasillos entre manípulos contra los elefantes (Polibio XV 9, por cotejar). Los hastati se relevan por principes (Livio VIII 8, por cotejar).
- **Licencia de juego**: la unidad que «decide sola» y los avisos de la IA.

## 5. Coste y riesgo
- Autonomía de unidad + 4 gestos de IA: 1,5 M (N4 ya estima 1,5). Ajustar el equilibrio del bot (hoy gana 8 de 10): hasta 2–3 M.
- Riesgo: IA que flanquea y aniquila al jugador; probar en Node con partidas IA contra IA.

## 6. Versión mínima
La IA elige un plan por batalla, guarda una reserva y la manda al punto débil; se repliega al perder mucho. Con un aviso de una línea cada ronda.
