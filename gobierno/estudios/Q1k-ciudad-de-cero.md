# Q1k · Ciudad nueva de cero: fundar, colocar, crecer

Diseño y maqueta jugable. **No cambia nada del juego**: decide el usuario después de probar la maqueta.
Maqueta: `gobierno/maquetas/ciudad3/` · https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/ciudad3/
Capturas: `gobierno/capturas-tarea/Q1k-*.jpg`. Ficha histórica: `gobierno/historia/fundacion-de-colonias.md`.

Lo que pidió el usuario (12/11/2026): «reestructurar todo lo que es el crear una ciudad de cero… para una nueva
jugabilidad». Quiere tres cosas **a la vez**: (1) fundar en un sitio vacío y verla crecer sola alrededor de lo que él
decide; (2) colocar él cada edificio con el dedo y que el sitio importe; (3) crecer por barrios que se abren, mejoran
y cambian de aspecto. Lo que falla hoy: «todo el planteamiento» (subir niveles de una lista fija en solares fijos) y
«muralla cuadrada y solares» (parece un tablero).

## 0. La idea en seis frases
- **Tú colocas lo público; lo privado nace solo.** Nunca pones una casa ni trazas una calle.
- **Fundas** eligiendo un punto del terreno vacío; el arado traza el límite y nace el foro.
- **Colocas** cada edificio donde quieras; el terreno se pinta de verde a rojo y una línea te dice por qué.
- **Las calles** salen solas del foro a cada edificio que pones: al colocar, dibujas el esqueleto de la ciudad.
- **Las casas** llenan las calles, primero donde mejor se vive, y **cambian de aspecto** cuando su barrio tiene agua,
  templo y mercado.
- **El sitio se paga**: la ribera se inunda, el barrio sin fuente arde, lo que queda fuera de la muralla se saquea.

## 1. Cómo lo resuelven otros juegos (solo ideas)
Fuentes: wikis, guías y reseñas (fiabilidad media; solo se leyeron resúmenes de búsqueda). «s. c.» = sin confirmar.

| Juego | Fundar | Colocar | Crecer |
|---|---|---|---|
| Caesar III, Pharaoh, Zeus | no hay acto: te dan el solar | todo pegado a una calle; el servicio lo reparten caminantes; hay «atractivo» del sitio [1] | **las casas suben solas** con agua, servicios y bienes; la calle pasa de tierra a empedrada [2] |
| Age of Empires II | empiezas con el centro puesto | cerca del recurso y pensando en la defensa [3] | por **edades**, que abren edificios |
| Anno 1800 y 117 | un barco funda un puesto que da la isla [4] | junto a un almacén; en 117, bonos y pegas entre vecinos [5] | la casa llena y servida sube de nivel [6] |
| Ikariam, Travian | colonos que viajan a un hueco libre del mapa [7] | huecos fijos | subir niveles (lo que hoy tiene AQVILA) |
| Grand Ages: Rome | s. c. | **radios** en vez de calles [8] | clases con rutinas visibles |
| Total War: Rome II | no se funda | huecos fijos; el edificio central abre más [9] | la población sobrante sube el centro |
| Manor Lords | s. c. | parcelas que se adaptan a la forma dibujada [10] | la parcela sube de nivel y gana patio |
| Foundation | edificio inicial (s. c.) | se pinta una zona y **las casas las pone la gente** [11] | **los caminos nacen donde se pisa** [12] |
| Townscaper | tocar | tocas y el juego elige la pieza según los vecinos [13] | el aspecto cambia solo |
| Civilization VI | un colono; junto al agua, más vivienda | distritos con **bono por vecindad** (+2, +1) [14] | por comida |
| Banished | — | verde o rojo al colocar, con el motivo [15] | — |

Lo que se toma (ideas, no arte ni código):
1. **Casas que suben solas con servicios** (Caesar) y **calles que nacen del uso** (Foundation): el jugador no pone ni
   unas ni otras. Es lo que pidió con «verla crecer sola alrededor de lo que él decide».
2. **Radio en vez de caminantes** (Grand Ages): en 390 px no se pueden seguir repartidores; un círculo se entiende.
3. **Dos o tres reglas de sitio por edificio, enseñadas al colocar en verde y rojo con una línea de motivo**
   (Civilization VI, Anno 117, Banished).
4. **Fundar con un gesto y unos colonos que viajan** (Travian, Anno).
5. **No enseñarlo todo a la vez**: las fichas se abren al crecer (edades de Age of Empires).
6. Lo que **no** se toma: trazar calles casilla a casilla, pintar zonas con precisión, huecos fijos, cadenas largas.

[1] caesar3augustus.com/book/engineeringtransport/roads · [2] caesar3augustus.com/book/info/answerstocommonquestions y
manual (sierrachest.com) · [3] forgottenempires.net/powergaming-101-building-placement ·
[4] anno1800.fandom.com/wiki/Trading_Post · [5] anno-union.com/tag/anno-117-en · [6] anno-union.com/en/devblog-residential-tiers ·
[7] support.travian.com (settling villages) · [8] gamewatcher.com/grand-ages-rome/review ·
[9] gamepressure.com/totalwarromeii (expansion and development of the province) ·
[10] wiki.hoodedhorse.com/Manor_Lords/Burgage_plots · [11] wiki.polymorph.games/foundation/Buildings ·
[12] pcgamer.com (you don't have to place roads in this medieval city builder) ·
[13] gamedeveloper.com (how Townscaper works) · [14] civilization.fandom.com/wiki/List_of_districts_in_Civ6 ·
[15] gamepressure.com/banished/buildings

## 2. El bucle de juego
Un solo bucle, el mismo desde la primera choza hasta la ciudad grande:

**mirar la ciudad → elegir una ficha → buscar el sitio (verde o rojo, con su razón) → construir → pasar meses y ver
qué nace → ver qué falta en cada barrio → otra ficha.**

### 2.1 Fundar (una vez por ciudad)
- Terreno vacío: dos lomas, vaguada, río, bosque (el de Q1d). Tocas o arrastras: mapa de calor del sitio y una línea:
  «Agua cerca +2 · En la loma: se defiende mejor +2 · Llano para crecer +1». La ribera baja avisa: «Se inunda −3».
- «Fundar aquí»: el arado traza el **surco** (un anillo que se adapta al relieve, no un cuadrado). Dentro es ciudad;
  fuera, campo. Nace la plaza del foro, dos calles (al río y a la loma), una puerta donde cada calle cruza el surco y
  las chozas de los primeros colonos.
- Lo que decides aquí pesa toda la partida: en alto se defiende y no se inunda, pero el agua queda lejos y hay menos
  llano; junto al río hay agua, muelle y vega, pero crecidas.

### 2.2 Colocar (la decisión de cada mes)
Una bandeja abajo con fichas. Tocas una, aparece el edificio fantasma con **su** mapa de calor; lo mueves; «Construir
aquí». Cada pieza tiene dos o tres reglas que se leen en una línea:

| Pieza | Dónde rinde | Qué da |
|---|---|---|
| Fuente | donde cubra más casas; junto al río no hace falta | agua al barrio (nivel 2) |
| Templo | en alto llega más lejos; junto al foro | calma y nivel 3 |
| Mercado | junto al foro o a una calle principal | oro por las casas de su radio; nivel 4 |
| Granero | dentro del surco, cerca de una puerta | sin él, hambre en invierno |
| Taller | en la orilla; lejos de las casas (humo) | hierro, armas, oro |
| Granja | fuera del surco, en llano fértil; mejor en la vega | grano; en la ribera baja se inunda |
| Serrería, cantera | junto al bosque; en la ladera de roca | madera, piedra |
| Muelle | solo en la orilla, cerca de una calle | comercio |
| Cuartel | junto a una puerta | reclutar; sale antes la guarnición |
| Muralla | no se coloca: sigue el surco, empalizada y luego piedra | defensa; lo de fuera es arrabal |
| Capilla de cruce | fuera de lo construido, junto a un camino | **abre un barrio nuevo** |

- No se enseña todo de golpe: cuatro fichas al fundar; las demás se abren con la población (idea de las edades de Age
  of Empires, sin árbol que leer).
- Un edificio colocado se **mejora** en su sitio (I, II, III): llega más lejos o rinde más. Se puede **mover** pagando
  parte, y **derribar**. Ya no hay veinte niveles: la ciudad crece por tener más piezas bien puestas, no por subir
  un número.

### 2.3 Crecer sola
- Cada mes llegan familias si hay grano y parcelas libres. Nacen casas a los lados de las calles, primero donde el
  sitio atrae más (agua, mercado y templo cerca; lejos del humo; sin crecidas; sin cuesta).
- Cuando una calle se llena le salen callejones y se forman manzanas. El plano sale **irregular** porque sigue al
  relieve y a lo que tú colocaste: dos partidas no dan la misma ciudad.
- Lo que se ve crecer: choza → casa de adobe → casa con teja → casa grande; calle de tierra → empedrada; empalizada →
  muralla de piedra con torres; campos fuera; humo, gente.

### 2.4 Barrios
- La ciudad es una suma de barrios: el del Foro y los que abras con una capilla de cruce. Cada barrio tiene nivel I a
  IV según los servicios que le llegan **por radio**: II pide agua; III, además templo; IV, además mercado (y el lujo
  de Q5). Sus casas cambian de aspecto al subir y bajan con retraso si lo pierden (regla de Q5, ya hecha).
- Tocar una casa dice una línea: «Barrio del Foro · nivel II · para subir falta templo». Con la cámara lejos, una
  etiqueta pequeña por barrio. Nada más en pantalla.
- Especializar sale solo: el barrio del río con talleres y muelle será pobre y productivo; el de la loma con templo,
  rico y caro.

### 2.5 Lo que puede salir mal
| Suceso | Por qué | Cómo se evita |
|---|---|---|
| Crecida de primavera | casas o granjas en la ribera baja | no construir ahí; el mapa de calor lo avisa |
| Incendio | barrio de más de diez casas sin fuente | fuente en radio |
| Hambre en invierno | sin granero o sin granjas | granero y campo |
| Humo y ruido | talleres pegados a las casas | ponerlos río abajo, lejos |
| Saqueo del arrabal | casas fuera de la muralla cuando llega un enemigo | muralla, o ampliarla |
| Barrio estancado | le falta un servicio | la línea del barrio dice cuál |
Castigan sin hundir: una casa quemada o inundada queda en ruina unos meses y se rehace sola.

### 2.6 Los primeros cinco minutos
1. (0:00) El Senado: «Lleva 300 familias y funda una colonia». Terreno vacío. Arrastras el dedo, lees dos sitios.
2. (0:40) Fundas. Arado, surco, foro, dos calles, diez chozas. Ya es tuya.
3. (1:00) Cuatro fichas. Pones la **fuente** donde cubre más chozas; nace su calle.
4. (1:30) Pasan meses. Llegan familias. Las chozas con agua pasan a casa de adobe.
5. (2:30) **Granja** en la vega y **granero** junto a la puerta. Primer invierno sin hambre.
6. (3:30) Se abre la ficha del **templo**: lo subes a la loma. El barrio del Foro pasa a nivel III; tejas.
7. (4:30) La calle del río está llena. Primera crecida: se moja la granja que pusiste en la ribera. Lección aprendida.
8. (5:00) Abres un **barrio** al otro lado y levantas la empalizada.

### 2.7 Qué decides cada mes
Una cosa: **en qué gastas la caja del mes** (Q2 a Q4, ya hecho). Una pieza nueva, una mejora o un barrio. La obra se
paga a plazos y ocupa un hueco de obra (Q4b: más huecos con el foro). Si no quieres decidir, la ciudad sigue
creciendo sola con lo que tiene.

## 3. Pantalla (390 px)
- El 3D ocupa todo. Arriba, **una línea**: fecha, población, caja. Abajo, **una bandeja** de fichas.
- Solo tres estados, nunca dos paneles a la vez: **mirar** (bandeja), **colocar** (la bandeja se va; línea de razones
  arriba, «Construir aquí» y «Cancelar» abajo) y **ficha** (tocas un edificio o una casa: una línea y dos o tres
  botones: Mejorar, Mover, Derribar).
- Sin medallas flotantes sobre cada edificio, sin lista de edificios, sin ventana de solares.

## 4. Cómo encaja con lo demás
- **Mapa por turnos (I2)**: igual que hoy. El mapa avanza por estaciones; la ciudad, por meses mientras la miras. Las
  ciudades que no miras siguen con sus números; sus casas se calculan al entrar (no se guardan una a una).
- **Economía del mes (Q2 a Q6)**: se conserva entera. Cambia de dónde salen los números:
  - producción = piezas colocadas × lo bueno del sitio (una granja en la vega da más que en la ladera);
  - población máxima = casas, y las casas dependen de calles y barrios (hoy sale de niveles de «viviendas»);
  - nivel de barrio (Q5): pasa de uno por ciudad a uno por barrio; el de la ciudad es la media;
  - clases (Q6): plebeyos en casas de nivel I y II, ciudadanos en III y IV, esclavos en granjas y talleres;
  - obras a plazos, almacén con tope y cuentas del mes: sin cambios.
- **Varias ciudades**: Roma y Capua empiezan **ya en pie**, hechas con estas mismas reglas (una plantilla coloca sus
  edificios y la ciudad «crece» sola hasta su población). Las sigues tú desde ahí. Fundar de cero se vive con las
  **colonias**: el mapa marca sitios donde Roma fundó de verdad en estos años (Arímino y Benevento 268, Brundisio 244,
  Placentia y Cremona 218…); envías colonos (cuestan población, grano y oro) y al llegar se abre la pantalla de
  fundar. Las ciudades conquistadas y las enemigas se montan con la misma plantilla, según su cultura.
- **Guerra**: la batalla no cambia (recibe dos ejércitos). La muralla cuenta por su estado (sin, empalizada, piedra) y
  lo que queda fuera se puede saquear. El enemigo coloca con el mismo «mejor sitio» automático.
- **P69 Radio de efecto** queda dentro de esto (ya no hace falta aparte).

## 5. Reglas que cambian (decide el usuario)
1. Desaparecen los **solares fijos** y la lista de edificios con niveles. Cada edificio es una pieza colocada, con
   tres mejoras.
2. Las **viviendas** dejan de ser un edificio: son las casas que nacen solas.
3. La **muralla** deja de ser un rectángulo con nivel: sigue el surco en tres estados.
4. El **nivel de barrio** es por barrio.
5. Nuevos: fundar colonias desde el mapa, crecidas e incendios, arrabales.
6. Los números de equilibrio (producción, población, precios) habrá que afinarlos con las pruebas del bot.

## 6. Partidas guardadas
No se pierden. Al cargar una partida vieja, cada ciudad se convierte sola: se funda en el sitio de su plantilla, cada
edificio que tenías se coloca en su mejor sitio y su nivel se traduce a mejora I, II o III; la población y los
almacenes se respetan. Se guarda poco más que hoy: dónde se fundó y la lista de piezas con su sitio (las casas no se
guardan: salen siempre igual con la misma semilla). Riesgo: una ciudad convertida puede rendir algo distinto que
antes; se avisaría una vez al cargar.

## 7. Qué se aprovecha de lo hecho
| Hecho | ¿Se aprovecha? | Por qué |
|---|---|---|
| Relieve, río, suelo, luz, cielo (Q1d, `mundo.js`, `ground.js`) | **Sí, entero** | es el terreno vacío donde se funda; falta que las calles se pinten al jugar |
| Casas reales y tintes (`maquetas/ciudad2/`, `piezas/`) | **Sí** | son los cuatro niveles de casa |
| Muralla irregular de la maqueta | **Sí, la idea** | ahora sigue el surco que traza el jugador |
| Aligerado de Q1c (recorte, versiones ligeras) | **Sí** | mismo tope de 300 000 triángulos |
| Economía Q2 a Q6 | **Sí, entera** | solo cambia de dónde salen producción y población (§4) |
| Edificios de 0 A.D. del juego (templo, mercado, cuartel…) | **Sí** | son las piezas de la bandeja |
| Solares (`SLOTS`), medallas, paneles de lista de edificios | **No** | es justo lo que no divierte |
| Recinto rectangular, cardo y decumano pintados | **No** | «parece un tablero» |
| Plano fijo de manzanas de `ciudad2` | **No como plano** | sirve su manera de orientar casas a la calle |
| Q1e a Q1j (en pausa) | **Se funden** en el plan nuevo (§9) | casco, edificios de época, culturas, vida, revisión |

## 8. Historia (dictamen)
Ficha con fuentes: `gobierno/historia/fundacion-de-colonias.md`. **Dictamen: APTO CON NOTAS.**
- `histórico`: Roma fundó colonias en estos años, dirigidas por tres comisionados; las de ciudadanos, de unas 300
  familias (livius.org, cotejado; los pasajes de Livio, por cotejar). El surco con arado de toro y vaca, levantado en
  las puertas (Plutarco, *Rómulo* 11, cotejado). El pomerium como límite sagrado (Gelio 13.14, cotejado). Agua por
  fuentes y conductos casi enterrados (Appia 312, Anio Vetus 272). Murallas que siguen la loma con calles regulares
  dentro (Cosa, Alba Fucens: Brown 1980, Sewell 2010; detalles por cotejar).
- `probable`: que el rito del surco se hiciera en las colonias de 338 a 146 (lo cuentan autores posteriores); barrios
  con capilla de cruce (los *compita* se atestiguan, su papel como barrio en esta época no); crecidas e incendios como
  peligro corriente (pasajes de Livio por cotejar).
- `licencia de juego`: que el jugador coloque templos y mercados a su gusto; que las calles salgan irregulares en una
  colonia (las reales tendían a la retícula, y aun eso se discute: Pelgrom frente a Sewell); que el arrabal se
  proteja ampliando la muralla.
- **Anacronismos a evitar**: bomberos (*vigiles*, son de Augusto: en la época, los *tresviri capitales* y los ediles);
  acueducto de arcos antes de 144; **ampliar el pomerium** (solo se atribuye a Servio, Sila y César: en el juego se
  amplía la **muralla**, no el límite sagrado); bloques de pisos generalizados; llamar *triumvir* al jugador.
- Por cotejar (carril Historia): Varrón *LL* 5.143, Livio 1.44, cifras y fechas de cada colonia (Brundisio: 244 o
  246), las fechas del mapa de §4. En la maqueta, «273 a. C.» y «300 familias» son de muestra.

## 9. Plan para llevarlo al juego
Una tarea, una sesión. Construir sobre este diseño va en Sonnet; lo que decide aspecto, en Fable. Las cifras son
presupuesto, no medida. Las tareas que tocan `js/game.js` y `js/data.js` van **de una en una con el carril Economía**.

**P80 · Primer tramo: colocar y crecer en una ciudad del juego** (≈7,3 M). Al acabar, en el juego se coloca y crece.
| Tarea | Qué se ve al terminar | Toca | M |
|---|---|---|---|
| C1 Reglas sin pantalla | nada aún: terreno, nota de sitio, calles, parcelas, casas y barrios como números, con pruebas | `js/ciudad.js` nuevo, `test/` | 1,5 |
| C2 Guardado y economía | las partidas viejas cargan convertidas; producción y población salen de piezas y casas | `js/game.js`, `js/data.js` | 1,8 |
| C3 Ciudad que nace | terreno vacío, calles pintadas al jugar, casas reales por nivel (pasan a `assets/`, tope 37 MB) | `js/gfx/city3d.js`, `ground.js`, `assets/` | 2,5 |
| C4 Colocar con el dedo | bandeja, fantasma, verde y rojo con su razón; fuera solares, medallas y lista | `js/ui.js`, `css/` | 1,5 |

**P81 · Segundo tramo: fundar, barrios, muralla y sucesos** (≈4,7 M).
| Tarea | Qué se ve al terminar | M |
|---|---|---|
| C5 Fundar colonias | sitios en el mapa, colonos que viajan, pantalla de fundar con el arado; misión del Senado | 1,5 |
| C6 Barrios | capilla de cruce, nivel por barrio (mueve Q5), casas y calles que cambian, etiquetas | 1,2 |
| C7 Muralla y arrabal | empalizada y piedra sobre el surco, puertas, saqueo de lo de fuera | 1,2 |
| C8 Sucesos | crecida, incendio y hambre con su aviso y su remedio | 0,8 |

**P82 · Tercer tramo: todas las ciudades y acabado** (≈3,7 M). Funde las tareas en pausa.
| Tarea | Qué se ve al terminar | Funde | M |
|---|---|---|---|
| C9 Roma, Capua, conquistadas y enemigas | plantillas por cultura y tamaño; el enemigo coloca solo | Q1h | 1,5 |
| C10 Edificios de época y revisión | fuera anfiteatro, termas y arcos; citas cotejadas | Q1g, Q1j | 1,2 |
| C11 Vida y peso | gente, humo, carros; guarnición ligera; medir triángulos | Q1i, P79 | 1,0 |

Total ≈15,7 M. Las tareas en pausa Q1e a Q1j sumaban 7,6 M y quedan dentro: lo nuevo son unos 8 M. Q4b (huecos de
obra según el foro) y Q11 (luz y humo) siguen valiendo y van después de C4.
Versión mínima que ya se nota: **P80**. Orden recomendado: P80 → probar en el móvil → P81 → P82.

## 10. Lo que decide el usuario
1. **¿Convence esta manera de jugar** (probando la maqueta)? Sí / otra vuelta / qué falla.
2. **Cómo empieza la partida**: (A) Roma y Capua ya en pie y la primera misión es fundar una colonia (recomendada: es
   lo histórico en 280 a. C.); (B) empezar fundando tu ciudad de la nada (eso sería la «Partida corta», I8).
3. **Edificios con tres mejoras** en vez de muchos niveles: sí / no.
4. **P80**: aprobar el primer tramo (≈7,3 M) o esperar.

## 11. Lo que no se sabe
- El rendimiento en un móvil real no está medido; la maqueta cuenta triángulos en ordenador, nada más.
- El equilibrio: los números de la maqueta son de muestra. Afinar con el bot costó el doble en A8.
- Si calles y casas «solas» dan siempre ciudades bonitas en cualquier sitio del terreno: la maqueta lo prueba en uno.
