# SUP1 · Mesa de diseño del modo supervivencia (25/11/2026)

Estado: **diseño cerrado por la mesa, pendiente de las respuestas del usuario** (§9). Sin construir. Rama `sup1-diseno`.
Base: `SUP0-modo-supervivencia.md` (decisiones literales del usuario, no se reabren) y `PLAN-2.0.md` («Modo
supervivencia», §3 Estándar, «M2: respuesta del usuario al estándar»). Aprobado abrir SUP1 el 25/11: «Carril aparte»,
«Sí, ya». Sirve a OBJETIVOS → Corazón (guerras) y Músculo (entretenimiento).

Mesa: Corazón (Batallas + Combate), Músculo (con Arte de Mapas), Arte, Sonido e Historia, cada uno con su guía.
Todos leyeron y opinaron; ninguno tocó código. Lo que sigue es la síntesis del director; las discrepancias van a §9.

## 0. En una frase
Eres el oficial de una guarnición de hoplitas que acaba de desembarcar en tierra hostil. Cada estación se juega como
**un día**: de mañana repartes a tus hombres para talar, cavar y vigilar; por la tarde te preparas; por la noche llega
la oleada y la peleas **a pie con tus 12** mientras el resto aguanta en sus puestos. Al alba, cuentas y sigues. Ganas si
aguantas **3 años**.

## 1. El tiempo (cerrado por la mesa)
**Un día jugable por estación** (propuesta del Músculo, apoyada por Corazón e Historia).

| Pieza | Cifra | Qué pasa |
|---|---|---|
| Mañana | ~3 min reales | Trabajos: talar, agua y comida, obras, guardia, descanso |
| Tarde | ~2 min | Patrulla, colocar puestos, el aviso se hace más claro |
| Noche | ~3 min | La oleada. La vista desde arriba va a cámara lenta |
| Alba | hoja | «Pasar estación»: bajas, daños, lo recogido, la próxima oleada y la obra larga de la estación |
| Año | 4 días · ~35 min | Primavera tantean · **verano la gorda** · otoño saqueo · invierno frío y hambre |
| Partida | 3 años · 12 noches · ~1 h 45 | La última, en el invierno del año 3, la más dura |

Reglas del reloj:
- Pausa siempre a la vista; se pausa sola al salir de la aplicación. **×2 solo de día**; de noche nunca.
- «Saltar a la noche» cuando no queda nada que hacer. Rueda de órdenes abierta: el juego va a ×0,25 (no se para).
- **Siempre hay aviso** al menos medio día antes (humo, el perro, un explorador): cuántos, de dónde, qué traen.
- Guardado al empezar cada parte del día; si recargas a media oleada, esa noche vuelve a empezar.

Por qué así: tiene tiempo real para bajar a pie y vivir la noche (lo que el turno puro no da) y cada día es una parada
natural para jugar a ratos en el móvil (lo que el tiempo seguido no da). Y **una estación del campamento = un turno de
la polis**: cuando el modo entre en la campaña («primero aparte, luego dentro»), encaja sin rehacer el reloj.
Historia: los griegos guerreaban en verano (temporada de campaña); el invierno pesa por comida y leña.

## 2. La pelea en oleadas (cerrado por la mesa)
**Las dos cosas a la vez, en la misma escena**: no se carga otra pantalla.
- **A pie (lo normal)**: llevas al oficial y su grupo de **12** con la rueda. Vas a donde duele: la puerta, la brecha.
- **El resto de la guarnición** pelea sola en el **puesto** que le diste: un tramo de empalizada, la puerta, las
  torres o la reserva. Desde arriba (1 toque) solo das órdenes de puesto: «Reserva al norte», «Torres: piedras»,
  «Abandonar el oeste». No se dirige hombre a hombre.

| Pieza | Cifra |
|---|---|
| Grupo del oficial | 12 (una fila de 12 o dos de 6) |
| Guarnición | 48 al empezar (4 grupos de 12); 72 como mucho |
| Refuerzos | 2–4 por estación, por mar desde la polis. No hay reclutas a voluntad: cada hombre importa |
| Oleada | De 15–20 hombres (primera) a 120–150 (última). Las grandes llegan por tandas |
| Figuras vivas a la vez | ≤ 200 (≈ 70 propias, ≈ 130 enemigas); los caídos, con tope |

Escalones del enemigo (Historia: lore de Tasos, §5): saqueadores y piratas con jabalina → tracios en grupo con escudo
de media luna, honderos → guerreros con hacha y fuego contra la madera → **muro hoplita** de otra polis o jinetes
tracios al final. Escala en número, en mezcla, en lados de entrada y en herramientas.

Las defensas cambian la pelea:
- **Foso**: el que lo cruza va a menos de la mitad y queda abajo, a tiro.
- **Empalizada**: no se cruza. Solo por la puerta o por una **brecha** (cae tras un rato de hacha o fuego).
- **Puerta**: hueco de 3–4 m, el cuello de botella. Tu fila de 12 con los escudos solapados la tapona.
- **Torres**: 2–4 hombres tiran piedras y jabalinas desde arriba; gastan lo que traen los trabajadores.

Heridos y bajas: muerto no vuelve; grave, fuera 1–2 estaciones en la tienda de heridos; leve, vuelve al alba cansado.
Se gana la noche cuando el enemigo pierde la mitad y huye. **Se pierde la partida** si muere el oficial (en «Normal» el
segundo toma el mando una vez), si el enemigo ocupa el fuego del centro 20 s, o si la guarnición baja de una cuarta parte.

**Motor**: se usa el de hoy, sin fijar motor nuevo. Tal cual: lucha hombre a hombre con escudo y heridas
(`js/combate.js`), física que no deja atravesarse (`js/fisica-batalla.js`), tiradores (`js/tiro.js`), columna y línea
(`js/bloque.js`), muro hoplita rival (`js/falange-rivales.js`). **Depende del rediseño de la batalla** (sesión de
debate 2.0): animaciones (golpe, caída, subir a la torre, hachazo a madera), cámara detrás del oficial y pintar
150–200 figuras en el móvil. **Piezas que faltan** (pases a Combate): muros fijos en la física (empalizada, foso,
puerta), enemigos sueltos que piensen (hoy la IA piensa por bloques), la lanza hoplita (dory) en la tabla de armas y
hacha contra madera.

## 3. El campamento (cerrado por la mesa)
«Otro juego, nada que ver con la ciudad». Lo que lo hace distinto:
1. **Tus hombres son el recurso.** No hay oro ni colas. Cada hombre talando no vigila ni descansa; el que no descansa
   pelea cansado de noche. El panel de abajo es solo eso: cuántos a cada trabajo (`−` / `+`).
2. **Se levanta a mano, en el sitio.** Tocas el suelo para marcar una obra; la ves avanzar (foso al 62 %, estacas que
   suben una a una). Lo que traen de fuera (leña → estacas, piedra, comida, agua) es lo que limita.
3. **Cuanto más grande, más cuesta defenderlo.** Más empalizada = más tramos que cubrir con los mismos hombres.
4. **Se rompe y se repara.** Cada noche deja brechas y quemaduras; al alba eliges reparar o avanzar.
5. **Salir es arriesgar.** Talar y cazar lejos da más, pero el bosque es donde espera el enemigo.

Cinco etapas visibles, mismo encuadre (captura `SUP1-etapas.jpg`): **Vivac** (carros, hogueras, mantas) → **Tiendas**
en filas, leña y grano → **Foso** (se ve cavar) → **Empalizada con puerta** → **Torres y talleres** (fragua, horno,
altar). Todo madera, tierra, cuero y lona; ni piedra labrada, ni tejas, ni edificios de la ciudad.
Licencia de juego (Historia): el plano ordenado, las torres de madera, el campamento que crece durante años y los
talleres. Base real: la *Ilíada* (muro, foso y estacas del campamento aqueo, 7.436–441, 12.52–66), el *charax* de
Tucídides 6.66 y el muro de piedra suelta de Pilos (Tuc. 4.4).

## 4. Las dos vistas y la rueda
- **Desde arriba** (vertical, como la ciudad): campamento entero, panel de hombres, obras. Botón «A pie» arriba a la
  derecha (1 toque) y pellizco.
- **El oficial a pie** (horizontal, como las batallas; también vale en vertical): cámara a la espalda, palanca a la
  izquierda, **rueda** a la derecha con tres partes: **Tú · Tu grupo · Perro**. Cada orden en 2 toques: Línea,
  Columna de dos, Sígueme, Defender aquí, Trabajar conmigo. Botones ≥ 44 px. Se cierra al tocar fuera.
- **Tu animal: el perro** (Historia: APTO; Argos, *Odisea* 17.290–327): avisa de noche, sigue al oficial. Las mulas,
  parte del campamento (acarrean leña, *Ilíada* 23.110–126).

## 5. Época y lore (Historia)
- **Hoplitas en el 800 a.C.: NO APTO tal cual.** El escudo hoplita y el casco corintio aparecen hacia el 700 a.C.
  (Snodgrass 1964; coraza de Argos T45, ~720 a.C.); la falange cerrada, en el vaso Chigi (~650 a.C.) y Tirteo.
  Recomendación de Historia: **situar el modo en 700–650 a.C.** (es aparte de la campaña, puede tener su fecha) → §9.
- Primer lore propuesto: **Tasos, ~650 a.C.**: colonos de Paros frente a la costa de Tracia (Arquíloco, que luchó allí,
  fr. 5 West). Otros: la frontera de Argos con Esparta (Hisias, ~669 a.C., Pausanias 2.24.7) y Leontinos en Sicilia
  (729 a.C., Tucídides 6.3). Monte Ira (Pausanias 4.17–20), como leyenda.
- Lo que se tiene que ver: escudo redondo grande **con emblema pintado** (gorgona, toro, ave; todos los de la
  guarnición, el mismo), casco corintio con cimera, grebas, coraza de campana. Evitar: lino, cascos ático y tracio,
  todo lo romano y el escudo de rayos de los vídeos de referencia. Tracios: escudo de media luna (pelta), gorro de zorro (probable).
- Las citas son de memoria: Historia las comprueba antes de que salga texto en pantalla.

## 6. Sonido (Director de Sonido)
- Día: hachazos, mazo en estacas, palas, voces cortas, viento; donde trabaja cada hombre. Sin música.
- Noche: fuego, grillos, un búho, el perro; un bordón grave casi inaudible. El silencio da el miedo.
- Aviso de oleada: **sálpinx** (trompeta griega de bronce; Il. 18.219); 30 s antes lejos, 10 s antes cerca. Peán y
  «Alalá» antes de cargar (las voces ya existen en `assets/voces/`).
- Amanecer: pájaros, sálpinx corto, música de victoria (ya existe). Derrota: el fuego solo, sin voces.
- Todo aviso tiene también su icono: nada depende solo del oído.
- Peso: audio hoy 8,9 MB de 10 MB; lo nuevo, 150–250 KB (cabe). Ambiente por código, 0 KB.

## 7. FICHA DE OBJETIVO y juez de aspecto (nota ≥ 8,5)
Doce cosas que se tienen que **ver**. Cada una se comprueba en una captura fija (encuadre y hora fijados por el
script de capturas de cada tanda) a 390×844 o 844×390.

| # | Se tiene que ver | Captura | Tanda |
|---|---|---|---|
| 1 | Cinco etapas del campamento con el mismo encuadre; cada una con al menos una pieza nueva | 5 desde arriba, mediodía | SUP4 |
| 2 | ≥ 3 hombres a la vez con herramienta en la mano y en postura de trabajo (talar, cavar, clavar); no quietos | arriba, mañana | SUP4 |
| 3 | Un hombre acarreando un tronco o un saco entre el bosque y el campamento | arriba, mañana | SUP4 |
| 4 | Foso: franja más oscura que el suelo, con borde de tierra; a medias se ve el tramo sin cavar | arriba, etapa 3 | SUP4 |
| 5 | Empalizada que rodea con un hueco de puerta reconocible | arriba, etapa 4 | SUP4 |
| 6 | ≥ 2 hogueras con humo que sube de día | arriba, mediodía | SUP2 |
| 7 | Noche: cielo más oscuro que el campamento; ≥ 4 antorchas con su círculo de luz en el suelo | arriba y a pie, noche | SUP2 |
| 8 | El oficial de espaldas con penacho y su grupo, en columna de dos y en línea (dos capturas) | a pie, tarde | SUP3 |
| 9 | ≥ 10 escudos de la guarnición con el mismo emblema, de color distinto al enemigo | a pie | SUP3 |
| 10 | Oleada con antorchas a < 20 m de la empalizada, saliendo del bosque | arriba, noche | SUP5 |
| 11 | La fila de 12 tapando la puerta o una brecha, con enemigos amontonados en el hueco | a pie, noche | SUP5 |
| 12 | Después de la noche: caídos fuera del foso y un tramo roto por reparar. En **todas**: ni piedra labrada, ni tejas, ni edificios de la ciudad | arriba, alba | SUP5 |

**Cómo puntúa el juez de aspecto** (un agente que solo mira las capturas, sin leer el código):
- Cada punto: **1** se ve claro; **0,5** se ve pero cuesta; **0** no se ve. Nota = suma ÷ 12 × 10.
- **Aprueba con ≥ 8,5** (≥ 10,5 de 12) y **ningún punto a 0** en los de su tanda.
- Cada tanda se juzga solo con sus puntos (nota sobre los suyos) y la SUP5 cierra con los 12 juntos.
- Calibración: la captura de partida (§8) saca **0 de 12**: hoy no hay campamento. Las maquetas son el objetivo de
  composición, no de acabado: el acabado lo da el arte 3D real.

Referencias de **ideas** (nunca su código ni su arte): los vídeos del usuario (`REF-supervivencia.md`: oficial con su
grupo, rueda de tres partes, campamento que crece, noche con antorchas); Total War (puestos en la muralla, cuello de
botella de la puerta); juegos de defensa de colonia (repartir hombres entre trabajar y vigilar).

## 8. Capturas
Captura de partida (lo que hay hoy en el juego; el modo no existe):
- `gobierno/capturas-tarea/SUP1-partida-oficial-h.jpg`: el oficial a pie de hoy (FU5), cámara al hombro.
- `gobierno/capturas-tarea/SUP1-partida-falange-v.jpg`: la falange a pie de hoy (FU6), en vertical.

Maquetas (bocetos 2D del objetivo; fuentes en `gobierno/maquetas/supervivencia/`, se rehacen con
`node gobierno/maquetas/supervivencia/_captura.mjs`):
- `SUP1-menu.jpg`: entrar en 2 toques; tipo de partida y lore (Tasos) con «Acampar».
- `SUP1-arriba-dia.jpg`: desde arriba de mañana; reloj del día, aviso de humo, panel de hombres.
- `SUP1-etapas.jpg`: las cinco etapas del campamento.
- `SUP1-oficial.jpg` (844×390): el oficial a pie, su grupo en línea, el perro y la rueda.
- `SUP1-noche.jpg`: la oleada desde arriba, brecha tapada por tu grupo, puestos.
- `SUP1-amanecer.jpg`: la hoja del alba (pasar estación).
- `SUP1-tiempo.jpg`: cómo pasa el tiempo.

## 9. Lo que decide el usuario
Preguntas en el chat de SUP1 (formato numerado A/B). Respuestas literales: §11.
1. Tiempo: (A) un día jugado por estación + hoja del alba [recomendada]; (B) tiempo seguido.
2. Duración de «Mantener la posición»: (A) 3 años, ~1 h 45 [recomendada]; (B) 5 años, ~3 h.
3. Fecha: (A) 700–650 a.C., hoplitas reales [recomendada]; (B) 800 a.C. con la panoplia marcada como licencia de juego.
4. Primer lugar: (A) Tasos, colonos contra tracios [recomendada]; (B) frontera de Argos con Esparta.
5. Pelea: (A) las dos a la vez: tú a pie con 12, el resto en sus puestos [recomendada]; (B) solo tu grupo a pie.
6. Peso: Arte avisa de que la descarga está en 55,6 de 56 MB. (A) subir el tope a 60 MB [recomendada]; (B) quitar otra cosa.
7. Reparto SUP2–SUP5 de §10: (A) aprobado [recomendada]; (B) cambiarlo.

## 10. Reparto propuesto SUP2–SUP5
Archivos propios del modo (área nueva «supervivencia» en `areas.json`, la da de alta el vigía). Guardado propio
`aqvila-superv-v1`, sin tocar `aqvila-save-v1` ni `G.load`. Lógica sin pantalla, probada en Node.
Gasto medido en esta sesión: 1,6 M (director + 5 departamentos, todo Opus). Lo de abajo es estimación.

| Tanda | Qué entrega | Archivos nuevos | Tamaño | Gasto esperable | Depende de |
|---|---|---|---|---|---|
| **SUP2** | Botón «Supervivencia» (2 toques), tipo y lore, campamento inicial (vivac), reloj del día y la estación, hoja del alba vacía, dos vistas con su botón, día/noche con antorchas y humo, ambiente sonoro, guardado propio | `js/superv.js`, `js/ui-superv.js`, `js/gfx/superv3d.js`, `css/superv.css`, `test/superv.test.mjs` | Grande | 8–12 M | Pases: una línea en el menú (`js/ui.js`), `sw.js` (subida), cámara del oficial de la maqueta del bloque (Batallas) |
| **SUP3** | Oficial con su grupo de 12, rueda Tú·Grupo·Perro, columna/línea/sígueme/defender/trabajar, perro, escudos con emblema | `js/sup-grupo.js`, `js/ui-sup-rueda.js`, `js/gfx/sup-camara.js`, `test/sup-grupo.test.mjs` | Grande | 8–12 M | Motor a pie de hoy (`bloque.js`); animaciones del rediseño (si no llegan, las de hoy) |
| **SUP4** | Trabajos y campamento que crece: panel de hombres, obras tocando el suelo, 5 etapas, foso, empalizada, puerta, torres, talleres; hombres trabajando de verdad; sonidos de trabajo | `js/sup-campamento.js`, `js/gfx/sup-obras.js`, `test/sup-campamento.test.mjs` | Grande (el arte más gordo: 4 movimientos de trabajo, tiendas, puerta, torre) | 12–18 M | Tope de descarga (pregunta 6); movimientos de 0 A.D. (talar, cavar, martillear, acarrear) |
| **SUP5a** | Oleadas en reglas: calendario, escalado, tipos, bajas, refuerzos, derrota y victoria a los 3 años; defensas con vida; bot bueno aguanta 8/10, bot vago cae 10/10 | `js/sup-oleadas.js`, `js/sup-defensas.js`, `test/sup-oleadas.test.mjs` | Medio | 5–8 M | Nada (no depende del rediseño) |
| **SUP5b** | La oleada en vivo: enemigos, puestos, brecha, torre, tu fila en la puerta, sálpinx y avisos, hoja del alba con datos, juez de aspecto con los 12 puntos | `js/sup-lucha.js`, `js/ui-sup-oleada.js` | Grande | 10–15 M | **Rediseño de la batalla** (animaciones, cámara, 200 figuras); pases a Combate: muros fijos, enemigos sueltos, dory, hacha contra madera |

Orden: SUP2 → SUP3 → SUP4, con **SUP5a en paralelo** desde SUP2 (solo reglas). SUP5b, cuando el rediseño de la
batalla haya fijado animaciones y cámara. Total esperable: **45–65 M**.

Estándar del carril (de SUP0, se mantiene): aspecto ≥ 8,5 con la ficha de §7; se entiende (≤ 2 toques entrar, 1 toque
cambiar de vista, ≤ 2 toques cada orden, a 390 px y en horizontal); bot de reglas 8/10 y 10/10; sin errores ni red;
fichas de Historia; el «Bien» del usuario en su móvil.

## 11. Respuestas del usuario
*(pendiente: se apuntan aquí, literales, con fecha)*

## 12. Fuera de este diseño
Supervivientes, Mitología y Libre (después); batallas de agua («sguaz», tema aparte); conectar con la campaña (después
de que funcione aparte); nada de código ni arte de juegos comerciales.
