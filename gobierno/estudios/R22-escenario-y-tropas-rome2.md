# R22 · El escenario y cómo lucha cada tropa, mirando Rome II (ingeniería reversa, 16/11/2026)

Pedido del usuario: «Busca imágenes y vídeos de batallas en Rome 2 Total War y videojuegos tipo Rome 2 para que te hagas
una idea de cómo deberíamos orientar el escenario y cómo luchan los diferentes tipos de tropas».
Se toma **cómo se comporta y cómo se lee**; nunca su arte, su interfaz ni su código. Completa a R21 (caballería y elefantes).

## Qué he podido mirar (y qué no)
- **Visto de verdad**: hojas de fotogramas de siete vídeos de YouTube (unas 150 imágenes pequeñas): Zama, Cannas y Ásculo
  jugadas en Rome II, un tutorial de hostigadores, dos pruebas del testudo y una carga masiva de caballería.
- **Leído**: resúmenes de buscador de guías y foros (GamePressure, Steam, PC Gamer, manual oficial).
- **No he podido**: ver los vídeos en movimiento ni oírlos (solo fotogramas sueltos, sin subtítulos), ni abrir las guías
  enteras: la red de esta sesión no deja pasar esas páginas. Lo que va de memoria está marcado. Solo Rome II; no he
  mirado otros juegos del género.

## El escenario: lo que se ve en los fotogramas
1. **Campo ancho y casi vacío, con relieve suave.** Lomas largas, horizonte lejano y mucho cielo con nubes. El ejército
   ocupa poco: sobra campo por los lados y por detrás. Eso es lo que deja rodear.
2. **Un rasgo de terreno por batalla, y manda.** Un río con su vado, un bosque, una loma, un poblado. En el tutorial
   las tropas cruzan un vado bajo los proyectiles; en los avances del juego se cuenta que una loma de 30 m esconde quince
   unidades y que el bosque oculta tropas (PC Gamer, 2013). Arriba se tira más lejos y se carga mejor.
3. **Cada región, su color.** Zama es tierra roja y cielo de tormenta; Cannas, ocre seco; Ásculo, hierba verde; hay
   batalla en la nieve. Se reconoce dónde estás sin leer nada.
4. **Los ejércitos son filas de bloques separados**, cada uno con un estandarte flotando encima; el bando se lee por
   el color del estandarte, no por el del soldado. Entre bloque y bloque hay hueco.
5. **Las órdenes se pintan en el suelo**: flechas rojas gruesas desde la tropa hasta su objetivo.
6. **Dos alturas de cámara.** Alta y oblicua para mandar (se ve el horizonte, no es cenital); a ras de suelo para
   mirar: picas bajadas en filas, escudos rojos en línea, jinetes entrando.

## Cómo lucha cada tropa
| Tropa | Cómo lucha en Rome II | Fuente | En AQVILA hoy | Qué falta |
|---|---|---|---|---|
| Hostigadores (vélites, peltastas) | Delante de la línea, tiran y se retiran solos cuando se les echan encima; poca munición; una carga de jinetes los barre | Guía de combate y GamePressure (buscador); tutorial visto | GM7: salen, tiran, vuelven; los jinetes los barren | Que se vea la munición; que huyan de los jinetes |
| Honderos y arqueros | Más alcance que la jabalina; tiran en arco por encima de los suyos; indefensos de cerca | Foro de Steam (buscador); de memoria | GM7: honderos 80 m, arqueros 110 m | Modelo de arquero; que la altura dé alcance |
| Infantería de espada (legionarios) | Descarga de pila al cargar y luego melé larga; el testudo los vuelve lentos y los deja vendidos por los lados | Vídeo «Defensive Testudo» (descripción); de memoria | GM7: pila y testudo; GM2: espada | Nada urgente |
| Lanceros y hoplitas | Muro de escudos a pie firme; paran a la caballería de frente | Buscador (GameStar); de memoria | GM2: lanza clavada | Llevarlo a la batalla de GM7 |
| Piqueros (falange) | De frente casi no se les puede entrar: las picas llegan antes; giran mal; por el costado o la espalda se deshacen | Guías de Steam (buscador); fotogramas de Ásculo | GM2: falange | Que se vean las picas bajadas |
| Caballería de choque | Rodea, carga, sale y vuelve a cargar; quedarse en la melé la mata | Foro de Steam (buscador); R21 | GM9 aprobada | — |
| Caballería ligera y de proyectil | Hostiga y persigue a tiradores y a los que huyen | GamePressure (buscador) | Númidas de GM7 | Perseguir (GM8) |
| Elefantes | Ver R21 | R21 | GM9 aprobada | — |

**Lo común**: gana quien hace huir, no quien mata más; el ánimo cae por la espalda, el cansancio y ver huir al vecino.
**Ojo con el testudo**: un vídeo de pruebas concluye que en el juego original casi no protege de los proyectiles, y otro
dice que sí protege pero inmoviliza. En AQVILA protege mucho y agota: es decisión nuestra, no copia.

## Traducción a AQVILA (propuesta P128)
Sobre la maqueta de GM7 (`gobierno/maquetas/guerra-lejos/`), sin botones nuevos:
1. **Campo con relieve y sitio a los lados**: lomas suaves, horizonte y cielo; el campo, el doble de ancho que el ejército.
2. **Un rasgo de terreno por batalla, con regla**: loma (quien está arriba tira más lejos y carga mejor), bosque (esconde
   a los jinetes y frena la carga) o río con vado (quien cruza llega desordenado). Un dato más en la ficha del campo.
3. **Color por región**: tierra, hierba y cielo según dónde se lucha (África, Italia, Galia, Hispania). Solo texturas
   que ya tenemos de 0 A.D.; pasa por Arte.
4. **La orden se pinta en el suelo**: una flecha del cuerpo a su objetivo al dar la orden. Encaja con GM10.
5. **Cada tropa se reconoce por su figura**: picas bajadas, escudos juntos, tiradores sueltos. Parte es de GM4.

**Coste**: 1 y 4, una sesión (0,8 M). 2, una sesión de reglas y prueba (1,0 M). 3, media sesión con Arte (0,5 M).
**Riesgo**: el relieve puede tapar tropas en un móvil de pie; se prueba primero con lomas muy suaves.
**Versión mínima**: campo más ancho con lomas y horizonte, una loma que da ventaja y la flecha de la orden.

## Fuentes
- Vídeos (fotogramas): youtube.com/watch?v=Yg-cn-7r26Y (Zama), B_uxww127KY (Cannas), pD_kGEni0q0 (Ásculo),
  rrNjqoz7mcE (hostigadores), SMxdQNpKtvg y AJ8h3xL5xo0 (testudo), jKyhqA7xC1M (caballería).
- pcgamer.com: avance de Rome II (línea de visión, lomas y bosques). gamepressure.com: guía de Rome II (unidades,
  campo de batalla). steamcommunity.com: guías de piqueros y de mecánicas. Solo sus resúmenes en el buscador.
