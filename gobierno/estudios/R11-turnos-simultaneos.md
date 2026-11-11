# R11 · Turnos simultáneos (Frozen Synapse y Combat Mission en modo WEGO)

Estudio de ingeniería reversa. Solo cómo se comportan los juegos; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Cómo se planean órdenes a la vez y se ejecutan juntas sin que resulte injusto?

## 2. Observación
1. Frozen Synapse: cada ronda empieza con una fase de plan donde se ponen en cola las órdenes de cada soldado. Luego vienen 5 segundos de acción y otra vez plan. Los dos bandos planean a la vez: se prepara lo que se cree que hará el rival, no se reacciona a lo que acaba de hacer. [Búsqueda: PlayStation Blog, GiantBomb](https://blog.playstation.com/2014/09/11/frozen-synapse-prime-combat-basics-on-ps-vita/comment-page-1/)
2. Simular el plan antes de confirmarlo: solo confirmado para la secuela. Se simula tu plan, pero las acciones del rival suelen ser desconocidas; hay que elegir entre cubrir varias posibilidades o apostar todo a una. [TechRaptor, reseña de la secuela](https://techraptor.net/content/frozen-synapse-2-review/) Del primer juego: sin confirmar.
3. Combat Mission (WEGO): turno de 60 segundos; en tiempo real hay una pausa forzada cada 60 s y los puntos de ruta se pueden ajustar. Hay repetición de los 60 s en correo (PBEM); en multijugador en red, según un jugador, no. Fuente de foro. [Foro Battlefront](https://community.battlefront.com/topic/123049-wego-tcp-option/)
4. Retraso de orden: los jugadores cuentan un retraso de unos 10 s antes de cumplir una orden; si una unidad aún tiene órdenes del turno anterior, el retraso se aplica entre la vieja y la nueva. Foros. [Battlefront](https://community.battlefront.com/topic/97649-pause-and-face-commands/)
5. Órdenes encadenadas: mover, pausa, apuntar. Un arco de tiro corto y circular puede impedir que un mando dispare a lo lejos. Foros. (misma fuente)
6. Sin confirmar: la duración exacta de turno en Frozen Synapse por modo, si la vista previa del enemigo existe en el primero, y si Combat Mission obliga a confirmar. No pude abrir manuales.

## 3. Por qué funciona
Es justo porque nadie reacciona al otro: los dos se juegan la cabeza a ciegas. La vista previa quita el miedo a equivocarse con el dedo, y la repetición enseña por qué se perdió. Las órdenes con condición permiten prever imprevistos sin repetir ronda.

## 4. Traducción a AQVILA
Encaja con N1 (planear y luego mirar). Sin tocar la regla: la batalla recibe dos ejércitos y contexto, devuelve bajas.
- **Vista previa**: la «sombra» de N1 se calcula con una simulación corta que supone al enemigo quieto o con su última orden. Honesta: avisa «el enemigo puede cambiar». `js/battle.js` (función pura sobre un clon), dibujada en `js/gfx/battle3d.js`.
- **Ronda**: 20 s de ejecución, no 60, por el móvil. El plan no tiene reloj; el jugador pulsa «Ejecutar». Sin límite de tiempo contra la IA.
- **Órdenes con condición o retraso**: una sola condición por orden («si te cargan, aguanta») y «esperar N segundos» como retraso. Pocas, para que quepan en 844×390.
- **Repetición**: botón «Ver otra vez» tras cada ronda, con el estado guardado al inicio. Barato: la simulación es determinista.
- **IA**: planea con las mismas reglas, sin ver tu plan; se comprueba en Node.
- **Pantalla**: plan arriba (fichas, sombras, flechas); ejecución en 3D con barra de tiempo.

## Historia (280–146 a.C.)
- **Histórico**: los generales daban la orden antes y el mando se perdía al empezar el choque; señales con trompeta y estandarte (Polibio VI 24, por cotejar). Cannas 216: el plan de Aníbal fue ordenado de antemano y ejecutado sin él cambiarlo (Polibio III 113-117, por cotejar).
- **Licencia de juego**: las rondas, la vista previa y la repetición no existen en la época.

## 5. Coste y riesgo
- Vista previa + repetición: 1,0–1,5 M (tarea media 0,7–1,5 M); condiciones y retrasos: otro 0,7 M. Ajustar la IA con ellas, el doble.
- Riesgo: si la vista previa es exacta con enemigo quieto, el jugador la toma por verdad; el juez debe probar que la sombra coincide con la ejecución cuando el rival no cambia.

## 6. Versión mínima
Botón «Ver sombra» que enseña dónde acabará cada regimiento si el enemigo sigue como estaba, y «Ver otra vez» tras la ronda. Sin condiciones.
