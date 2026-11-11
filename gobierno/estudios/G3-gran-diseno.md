# G3 · Gran diseño · una vuelta a todo el juego

Dos páginas. Seis decisiones para ti, cada una con opciones y **mi recomendación**. Nada se construye hasta que
elijas. Las batallas van aparte: `G3-batallas-estrategicas.md`.

## La propuesta, en media página
**Un solo juego con tres ritmos.**
- **El mapa va por estaciones.** Cada estación empieza con un «consejo»: el reloj se para y decides dónde van los
  ejércitos y las flotas, qué se investiga y con quién comercias. Luego el tiempo corre.
- **La ciudad vive en tiempo real.** Mientras corre la estación ves a los aldeanos ir al bosque, a la cantera y al
  campo, y las obras subir. Lo que ves es lo que cuenta: si mandas gente a la legión, hay menos en el campo.
- **La batalla es en tiempo real con pausa**, como en el otro informe.

**La gente es el centro de la economía.** No hay recursos nuevos. Cada persona es aldeano, obrero, soldado o
marinero, y no puede ser dos cosas. Todo cuesta mantenerlo. Cada ciudad tiene sus precios: lo que sobra es barato y
lo que falta, caro; llevar grano de donde sobra a donde falta da dinero. Cortar una ruta hace daño de verdad.

**Cada ciudad tiene un oficio**: colonia (militar), emporio (comercio) o municipio (civil). Ninguna lo hace todo, así
que necesitas varias y que comercien entre sí.

**Investigar es subir escalones.** Un árbol corto: cada mejora pide un edificio y una edad, y abre algo que se ve
(una tropa, un barco, un edificio, una formación). Las edades de F1 son los pisos del árbol.

**El mar es un camino que se puede cerrar.** Primero flotas que llevan tropas y bloquean puertos. La batalla naval
jugable llega al final.

**Arte e historia, en la misma ficha.** Cada pieza del juego (tropa, edificio, ciudad, batalla, mejora) es una ficha
con sus números, su modelo 3D con licencia, y su fuente y dictamen histórico. Montar una región nueva es rellenar
fichas, no programar. Eso es el «cableado europeo».

**Encaja con F1**: la partida corta (Italia, 6–8 ciudades, fundas de cero, un dios entre Marte, Ceres y Neptuno) es
el primer mapa montado con fichas. La campaña histórica es el segundo, más grande, con el mismo sistema.

## Las seis decisiones

### (a) Turnos y tiempo real: ¿qué va en cada uno?
- **A. Todo en tiempo real, como hoy**, con pausa. Pro: no cambia nada. Contra: en el mapa pasan cosas mientras miras la ciudad.
- **B. Mapa por estaciones, ciudad y batalla en tiempo real.** Pro: piensas sin prisa lo grande y disfrutas viendo lo pequeño. Contra: hay que rehacer el reloj de la campaña.
- **C. Todo por turnos.** Pro: lo más sencillo de equilibrar. Contra: la ciudad deja de estar viva; pierdes el aire de Travian.

**Recomiendo B.** Es el «reloj mixto» que elegiste en F1: el botón «Pasar a la estación siguiente» es tu «pasar el
tiempo». En la partida corta una estación dura unos minutos; en la larga, horas reales con tope.

### (b) Economía real sin más recursos: ¿qué mecanismos?
- **A. Mínima: mano de obra y mantenimiento.** Pro: barata y ya se entiende (las tropas ya comen grano). Contra: cada ciudad sigue siendo una isla.
- **B. Media: lo anterior más precios por ciudad y rutas de comercio.** Pro: aparece la oferta y la demanda, y el comercio y el bloqueo importan. Contra: más números que ajustar.
- **C. Completa: mercaderes que deciden solos, moneda que pierde valor, deudas.** Pro: muy real. Contra: difícil de leer en un móvil y cara.

**Recomiendo B, en dos pasos**: primero mano de obra y mantenimiento (fase 1), luego precios y rutas (fase 2).

### (c) Investigación
- **A. Sin árbol: mejoras dentro de cada edificio**, como la herrería de hoy. Pro: ya existe. Contra: no hay sensación de progreso de conjunto.
- **B. Árbol corto**: unas 16 mejoras en cuatro ramas (campo, oficios, guerra, mar) y cuatro edades. Cada una pide un edificio. La herrería pasa a ser la rama de guerra. Pro: claro, cabe en una pantalla. Contra: hay que rehacer la herrería.
- **C. Árbol grande**, de 50 o más. Pro: mucha rejugabilidad. Contra: meses de ajuste y de fuentes históricas.

**Recomiendo B.** Cada mejora llevará su fuente (skill `historia`): la investigación también enseña.

### (d) Tipos de ciudad
- **A. Eliges el tipo** al fundar o conquistar: colonia, emporio o municipio. Cada uno tiene un edificio propio y una ventaja; cambiarlo cuesta. Pro: se entiende al instante. Contra: algo rígido.
- **B. El tipo sale de lo que construyes**: hay pocos solares y el juego nombra la ciudad según lo que pongas. Pro: más libre. Contra: menos claro; más pruebas.
- **C. Lo fija el mapa**: ciudad con puerto, comercial; de frontera, militar. Pro: histórico. Contra: decides poco.

**Recomiendo A**, con un guiño de C: el mapa sugiere el tipo (Ostia, emporio), pero eliges tú.

### (e) Mar
- **A. Transporte y bloqueo primero.** Flotas en el mapa; el choque entre flotas se resuelve solo, con un parte. Pro: da juego estratégico con poco arte. Contra: no ves la batalla.
- **B. Batallas navales en 3D desde el principio.** Pro: espectacular. Contra: es un segundo motor de batalla (barcos, embestida, abordaje) y el móvil no está medido.
- **C. Dejar el mar como está.** Pro: gratis. Contra: la Primera Guerra Púnica se queda sin su mar.

**Recomiendo A**, y la batalla naval jugable como última tarea de la fase 3, si tu móvil va sobrado.

### (f) Cableado: ¿qué registro y qué contratos?
- **A. No tocar; solo un comprobador** que avise de fichas mal hechas. Pro: casi gratis. Contra: añadir contenido sigue pidiendo tocar código.
- **B. Registro único, poco a poco.** Todas las fichas en un mismo formato, con campos obligatorios, y plantillas («ciudad nueva», «batalla histórica», «región»). Un juez las comprueba. Pro: contenido nuevo sin programar; arte e historia atados a cada pieza. Contra: una sesión de orden antes de ver nada nuevo.
- **C. Rehacer el juego alrededor del registro** (o pasar a Godot). Pro: limpio. Contra: semanas sin avances; ya dijiste «Godot ahora no».

**Recomiendo B.** Contratos que harían falta: *campaña → batalla* (dos ejércitos, terreno y escenario; devuelve bajas:
ya existe a medias), *ficha → arte* (modelo, peso, licencia, crédito), *ficha → historia* (fuente y dictamen),
*mapa → campaña* (ciudades, rutas, dueños, hechos) y *partida guardada* (con número de versión).
**Qué se rehace**: se reordena `js/data.js` sin cambiar sus números; los efectos de los hechos históricos pasan a
una lista declarada; el guardado gana versiones. La lógica y las vistas 3D **no** se reescriben.

## Hoja de ruta en tres fases
M y minutos **a ojo**, con la misma vara que el otro informe (medido: tarea media ≈ 0,15 M Fable + 0,35 M Sonnet).

### Fase 1 · Cimientos y partida corta
| Tarea | Qué verás | Fable · Sonnet · min |
|---|---|---|
| Registro de piezas | Nada en pantalla; un juez nuevo y fichas con fuente y arte | 0,2 · 0,6 · 20 |
| Reloj por estaciones | «Consejo de estación» y botón «Pasar estación» | 0,2 · 0,6 · 20 |
| Mano de obra y mantenimiento | Reclutar vacía los campos; edificios y tropas cuestan | 0,15 · 0,5 · 15 |
| Tipos de ciudad | Eliges colonia, emporio o municipio | 0,15 · 0,5 · 15 |
| Investigación y edades | Pantalla con el árbol corto; subir de edad | 0,2 · 0,7 · 20 |
| Región de Italia | Mapa pequeño montado solo con fichas | 0,2 · 0,6 · 20 |
| Partida corta | Fundas de cero, un rival, un final | 0,25 · 0,8 · 25 |
| **Fase 1** | | **1,35 · 4,3 · 2 h 15 min** |

### Fase 2 · Economía viva y mar
| Tarea | Qué verás | Fable · Sonnet · min |
|---|---|---|
| Precios por ciudad | Cada mercado con sus precios, que se mueven | 0,15 · 0,5 · 15 |
| Rutas de comercio | Caravanas y mercantes en el mapa | 0,2 · 0,7 · 20 |
| Flotas: transporte y bloqueo | Embarcar tropas; cerrar un puerto | 0,2 · 0,8 · 25 |
| Choque naval automático | Parte de la batalla en el mar | 0,15 · 0,5 · 15 |
| La ciudad crece a la vista | Aldeanos que recolectan, obras con andamio | 0,2 · 0,8 · 25 |
| Saqueo | Robar sin conquistar; que te roben | 0,2 · 0,7 · 20 |
| Tres dioses | Un poder con recarga | 0,15 · 0,5 · 15 |
| **Fase 2** | | **1,25 · 4,5 · 2 h 15 min** |

### Fase 3 · El mundo grande
| Tarea | Qué verás | Fable · Sonnet · min |
|---|---|---|
| Campaña larga con el sistema nuevo | El Mediterráneo, de cero, con edades | 0,25 · 0,9 · 25 |
| Reloj con el juego cerrado | Resumen al volver | 0,2 · 0,6 · 20 |
| Mapa realista | Costa y relieve mejores | 0,2 · 0,8 · 25 |
| Diplomacia y rivales que construyen | Alianzas, tributos | 0,2 · 0,8 · 25 |
| Culturas enemigas | Ciudades y barcos de cada pueblo | 0,2 · 0,8 · 25 |
| Batalla naval jugable | Embestida y abordaje en 3D | 0,25 · 1,0 · 30 |
| **Fase 3** | | **1,3 · 4,9 · 2 h 30 min** |

**Total del gran diseño**: 3,9 M de Fable, 13,7 M de Sonnet, unas 7 horas en 20 sesiones. Las batallas suman
1,95 + 6,6 M aparte. Lo de la fase 3 es lo menos fiable: depende de tu móvil y de lo que enseñen las fases 1 y 2.

### Qué pasa con el tablero actual
| Tarea de hoy | Qué le pasa |
|---|---|
| F1b partida corta | Es la fase 1 entera |
| F4 edades | Dentro de «Investigación y edades» |
| B8 herrería (hecha) | Se convierte en la rama de guerra del árbol |
| F3 aldeanos (hecha) | Base de «Mano de obra» |
| B1 recurso especial por ciudad | **Sin sentido**: pediste no añadir recursos; lo sustituyen tipos de ciudad y precios |
| B2 rutas, B5 marina, B7 saqueo, F5 dioses | Fase 2, tal cual |
| F2 reloj cerrado, C2 mapa, C3 diplomacia, A7 y E2 culturas | Fase 3 |
| C1 zoom continuo, E1b guía de arte, E4 arte propio | Siguen aparte; no cambian |
| H3 Códice | Leerá las fichas del registro: cada pieza con su historia |

## Ideas que se toman (solo ideas; nunca código ni arte)
- **Total War**: mapa por turnos y batalla en tiempo real; ejércitos que cuestan cada turno.
- **Travian**: la ciudad que sigue viva y las colas de obra; saquear para ganar materiales.
- **Ikariam**: ciudades que se especializan y se necesitan; el mar como vía de comercio; trabajadores repartidos a mano.
- **Age of Empires**: aldeanos que se ven trabajar; edades que abren edificios y tropas; árbol corto y legible.
- **Age of Mythology**: un dios elegido al empezar, con un poder de recarga.

## Riesgos
- **Partidas guardadas**: las fases 1 y 3 las cambian. Propongo darlas por perdidas con aviso, como en F1.
- **Equilibrio**: mano de obra, mantenimiento y precios se tocan entre sí. El bot de pruebas tendrá que aprender a
  jugar con ellos; cuenta con una sesión extra de ajuste por fase (≈0,5 M de Sonnet, a ojo).
- **Móvil sin medir**: aldeanos visibles y batalla naval son lo más pesado; por eso van al final de su fase.
- **Dos sesiones a la vez** sobre `js/data.js` se pisan: el registro (primera tarea) debe ir sola.
