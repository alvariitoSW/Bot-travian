# Ficha de objetivo · Animación

Departamento de Animación (skill `ministerio-animacion`). La lee y la comprueba `node gobierno/juez-aspecto.mjs animacion`.
Regla del usuario (25/11, PLAN-2.0 «Departamentos de batalla»): juez de aspecto con **nota ≥ 8,5** y ficha de objetivo.
Cambiar las cosas de esta lista es decisión del usuario; el departamento puede proponerlo en su parte.

Nota mínima: 8,5

## Lo que se tiene que ver
1. Ningún escudo, lanza ni cuerpo atraviesa a otro: ni al chocar dos filas ni dentro de la misma fila.
2. El soldado se cubre con el escudo (mano izquierda) y golpea con la otra mano, y se ve qué hace cada mano (estado del motor, `js/combate-poses.js`).
3. Cada hombre lleva su propio ritmo: nadie se mueve a la vez que su vecino como un muñeco repetido.
4. Andar y correr sin pies que patinan; arrancar, frenar e inclinarse al correr.
5. La caída se ve: el herido trastabilla, cae y queda en una postura creíble, no tumbado plano de golpe.
6. El pilum y la jabalina se lanzan con el cuerpo entero (paso, brazo atrás, soltar) y el hombre vuelve a cubrirse.
7. El empujón con el umbo y la estocada corta del gladius se distinguen del tajo largo de la espada gala.
8. En la falange las primeras filas bajan la sarisa y las de atrás la alzan en abanico; cada asta oscila a su ritmo.
9. Los jinetes galopan, se inclinan al girar y el caballo se encabrita ante las picas.
10. Los elefantes cargan, empujan, barritan con la trompa arriba y caen despacio.
11. Los barcos cabecean con el oleaje y los remos baten a compás (cuando haya batallas en el mar; en la 2.0 se simulan).
12. Vistos a 390 px, de cerca y desde la altura de general, ninguno de estos movimientos se ve robótico.

## Referencias
- `gobierno/estudios/REF-batallas-referencias.md` §2 («A pie, testudo», «A pie, picas», «Batalla grande y épica»): cada hombre con su paso, encogidos tras el escudo, inclinados al correr; picas en abanico; elefantes contra las picas.
- `gobierno/estudios/TP0-objetivo-testudo-y-lucha.md` §3: andar y correr de los vídeos del usuario (Rome II y Ryse; solo ideas).
- Petición del usuario del 24/11 («defenderte con el escudo y luchar con la otra mano, que dependa del arma»): `MINISTERIOS.md` §4c.

## Captura de partida
- `gobierno/capturas-tarea/CB3-2-horizontal-choque.jpg`: choque de manípulos a pie. Las filas se leen, pero los caídos quedan tumbados planos y en fila, y las poses se repiten de un hombre a otro.
- `gobierno/capturas-tarea/CB2-1-vertical-estocada.jpg`: duelo del motor de lucha (estocada).
- `gobierno/capturas-tarea/FE2-2-carga-h.jpg`: elefantes contra la falange. Picas bajadas, cascos de las filas iguales.
- `gobierno/capturas-tarea/FI3-fal-h-salva.jpg`: salva contra la falange.

## Exámenes
Una fila por examen. Lo juzga una sesión que **no** construyó la tarea, mirando las capturas contra la lista y las referencias.
«Cierra: sí» quiere decir que la tarea pide darse por terminada: entonces la nota tiene que ser ≥ 8,5 o el juez da NO APTO.

| Fecha | Tarea | Quién juzga | Nota | Cierra | Capturas |
|---|---|---|---|---|---|
| 25/11/2026 | DB0 (línea de partida) | DB0, que no construyó nada de esto | 5,0 | no | gobierno/capturas-tarea/CB3-2-horizontal-choque.jpg |
