# FJ1 · Tropico 6 y 7 para una ciudad romana (16/11/2026)

**Pregunta**: ¿cómo hace Tropico para que gestionar una ciudad sea un juego en sí (economía, construcción, decretos) y qué
de eso sirve para una ciudad romana de 280–146 a.C. en AQVILA? Solo ideas: nada de código, arte, sonido ni textos.

**Aviso de fuentes**: las páginas de wikis y de Kalypso no se pudieron abrir desde esta sesión (red cerrada). Lo de abajo
sale de los resúmenes del buscador y de lo que se sabe del juego de jugarlo. Lo marcado **(por cotejar)** hay que
confirmarlo con una guía o un vídeo antes de construir. Los números no se usan: son nuestros.

## 1. Qué hace Tropico (observación)
1. **Todo cuelga de los puestos de trabajo.** Cada edificio abre puestos; si no hay gente (o con la formación pedida), el
   edificio no rinde. Los puestos sin cubrir «no hacen nada» por la economía; un jugador recomienda no abrir más de unos 30
   a la vez y construir al ritmo que da la mano de obra ([Steam](https://steamcommunity.com/app/492720/discussions/0/2936867947879396194), [guía](https://www.gamepressure.com/tropico-6/raids/zbc008)).
2. **El presupuesto se mueve por edificio.** Se sube o baja el sueldo de cada lugar de trabajo; pagar más mejora el nivel de
   vida y el rendimiento si hay materia prima ([Steam](https://steamcommunity.com/app/492720/discussions/0/2936867947879396194)).
3. **Exportar vale más que cobrar impuestos.** Se produce materia, se transforma en fábricas y se vende; los precios
   cambian, así que conviene diversificar. Los transportistas son el cuello de botella: sin ellos la fábrica se para
   ([guía](https://www.ibtimes.co.in/tropico-6-guide-top-10-ways-make-millions-popular-simulation-game-796601)). Las rutas con las
   potencias y sus pactos suben el valor de lo vendido ([Prima](https://primagames.com/gaming/fast-money-tropico-6-guide)).
4. **Edictos: decisiones de gobierno con precio.** Cuestan dinero, a veces cobran tasas o cambian costumbres, y se
   desbloquean investigando en bibliotecas y colegios; los hay por era ([Gamepressure](https://www.gamepressure.com/tropico-6/edicts/z9c0a5)).
   Ejemplo: uno abarata las obras en un porcentaje ([resumen del buscador](https://gamepress.pages.dev/posts/edicts-in-tropico-6)).
5. **Facciones y necesidades.** Los grupos de población puntúan tu gobierno según lo que les das (comida, culto, ocio,
   seguridad…) **(por cotejar)**. Tropico 7 (anunciado, no probado por nosotros) añade una «matriz política» que decide qué
   edictos tienes según dónde te sitúes, y zonas ajustables para plantaciones ([FAQ de Kalypso](https://www.kalypsomedia.com/post/tropico-7-faq-1), vía [mein-mmo](https://mein-mmo.de/en/the-new-tropico-delves-much-deeper-into-politics-sounding-much-like-a-hard-nosed-survival-game-on-steam,1521216)).
   Fechas de salida contradictorias en las fuentes: no contar con ellas.

## 2. Por qué funciona
- **Una sola cuenta cuadra todo**: gente → puestos → producción → dinero → más gente. Siempre hay un cuello visible
  («faltan trabajadores», «falta transporte») y el jugador sabe qué arreglar.
- **Los edictos son decisiones, no tareas**: pocas, caras, con ventaja y precio. Se piensan, no se repiten.
- **El mundo de fuera paga**: exportar da una razón para especializarse.

## 3. Lo que AQVILA ya tiene (no se propone otra vez)
| Tropico | Ya en AQVILA |
|---|---|
| Presupuesto y tesoro | Caja del mes, almacén con tope, cuentas, obras y reclutas a plazos (Q2–Q4, hechas) |
| Necesidades y facciones | Barrios 1–4 con servicios y tres clases con ánimo (Q5, Q6, CN6, hechas); Senado con favor y leyes (Q7, SN1; pantalla SN2 por hacer) |
| Colocar edificios | Ciudad nueva con solares, fantasma verde/ocre/rojo, asesor, mover (CN1–CN24) |
| Sucesos y dificultad | Crecida, incendio, hambre y tres dificultades (CN8, CN14) |
| Rutas y comercio | Rutas, tratados, mercado y puerto (B2) |
| Edictos | **Falta** (Q10, aprobada, sin hacer) |
| Decisión mensual | **Falta** (Q8 Foro, aprobada, sin hacer) |

## 4. Qué falta de verdad y cómo se traduce a Roma
**a) Puestos de trabajo visibles.** Cada edificio dice «3 de 5 puestos cubiertos» y rinde en proporción; el aviso del
asesor nombra el cuello («faltan plebeyos», «falta un carro»). Hoy la población ya trabaja, pero el jugador no ve el
puesto vacío. Encaja con el campo romano: Catón describe la finca con su vilicus, esclavos y jornaleros (*De agri cultura*, c. 160 a.C., **de memoria, por cotejar**).
**b) Decretos con precio.** Dos o tres por ciudad, no por edificio: «Obras públicas» (obras más baratas), «Leva» (más
reclutas, menos grano), «Impuesto de guerra», «Mercado libre». Históricamente los magistrados publicaban *edicta*
(Gayo, *Instituciones* 1.6; por cotejar) y el Senado repartía mandos; Sicilia pagaba el diezmo de grano (*decuma*, ley de Hierón, Cicerón *Verrinas* 3; por cotejar).
Licencia de juego: coste, duración y efectos son nuestros. **Es Q10 con otro nombre; conviene fundirlo.**
**c) Exportar con precio que se mueve.** La ciudad llena una «partida» de vino, aceite o hierro y la vende en el puerto;
el precio sube y baja por estación y por guerra. Roma exportaba vino itálico a la Galia y el Mediterráneo occidental en el siglo II a.C. (ánforas, **por cotejar**). Para no repetir B2, esto es *producir para vender*, no *ruta fija*.
**d) El transporte como cuello (carros y barcos).** Ya hay recuas (CN15) y puerto: darles un número visible, no una calle
simulada (en móvil no).

## 5. Dónde viviría, coste y riesgo
- `js/data.js`: puestos por edificio y tabla de decretos. `js/game.js`: `G.puestos`, `G.decretar`, precio de exportación y guardado (migrar en `G.load`). `js/ui.js`: ficha «Puestos» y pestaña «Decretos». `js/ciudad.js`: cuenta de puestos por solar. Nada toca `battle.js`: los dos sistemas siguen separados.
- **Coste** aproximado: puestos 1,2 M · decretos (Q10 + Q8) 1,5 M · exportación 1,3 M · afinar con el bot 1,0 M. Unas 4–6 sesiones.
- **Riesgo**: los puestos pueden hacer el juego más complicado a 390 px. Mitigación: un solo número por edificio y el cuello en el asesor. Segundo riesgo: equilibrio con el bot, que ya cuesta el doble de lo previsto (Q1 §8).

## 6. Versión mínima (ya se nota)
**«Puestos y un decreto»**: (1) cada edificio enseña sus puestos cubiertos y rinde en proporción; (2) un decreto por ciudad,
con precio y duración de tres meses; (3) el asesor dice cuál es el cuello. Sin exportar todavía. ~2 sesiones.

## 7. Propuesta de formato (entre A y B de `FJ-formato-de-juego.md`)
Tropico es *una isla, un presidente*. Su traducción es **un gobernador, una provincia**: la ciudad es el juego, no el
trámite entre guerras. Propuesta **«A+»**:
- **La Urbe y hasta dos colonias se construyen a mano** (Q1/CN ya lo permiten); las demás ciudades conquistadas se
  gobiernan por **decreto y oficio**, sin colocar solares (lo de A).
- Cada ciudad a mano tiene **puestos, decretos y una partida de exportación**: es su juego de desarrollo.
- La guerra (GC) sigue siendo lo que saca ciudades nuevas; la historia da encrucijadas (EV1), sin cambios.
- Se evita la tarea de repetir 10 ciudades: el tope de tres a mano lo impide.

**Decide el usuario**: ¿cuántas ciudades a mano? (A) tres como tope, recomendada; (B) las que quiera, con aviso de cansancio. Y ¿se empieza por «Puestos y un decreto»? (A) sí, FJ2; (B) primero Q8 y Q10 tal como están.

**Historia**: todo lo histórico de arriba va marcado «por cotejar»; la skill `historia` debe dar dictamen antes de construir. Licencia de juego: todos los números y la mecánica.
