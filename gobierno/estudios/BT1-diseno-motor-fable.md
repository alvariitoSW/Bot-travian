# BT1 · Diseño del motor de batalla (segundo informe independiente de Fable 5.2 · 26/11/2026)

Pedido literal del usuario: «quiero otro informe que lo haga sobre como montar el motor de batalla a nivel simulador para que las tropas
luchen y las animaciones sean reales y poder converger todo en mejorar la parte de luchar desde la visión del oficial y que sea un juego
parecido al rome 2 y ryse son of rome una mezcla quiero una honest review».
Continúa `BT1-informe-motor-fable.md` (el diagnóstico) sin repetirlo: esto es **qué se monta y en qué orden**. Solo lectura de la rama
`bt1-lo-comun`. No se ha medido nada nuevo ni probado en un móvil: los costes son los del informe anterior o estimaciones.

## 1. Honest review (una pantalla)

**¿Se puede hacer «Rome 2 + Ryse» aquí? La mezcla sí; cada juego entero, no.** Lo que se puede prometer es más pequeño y concreto:
**un muro de hoplitas contra otro, visto desde el hombro del oficial, donde cada hombre lucha de verdad, y poder subir a mandarlo desde arriba.**

| Parte | ¿Se puede? | Por qué |
|---|---|---|
| Que cada hombre luche, empuje, se canse, tenga miedo y caiga donde le dan | **Sí** | Es cálculo, y es barato: el motor de golpes que ya hay gasta 0,06 ms con 170 hombres |
| El duelo del oficial «con peso» (lo de Ryse) | **Sí, a un 7** | El peso es ritmo, parón, sacudida y sonido: código, no arte. Solo hay que mimar a 2 hombres |
| Compañeros luchando a tus lados | **Sí** | Son hombres del mismo simulador; 20–40 con todo el detalle caben |
| Mandar desde arriba y bajar sin cambiar de escena (lo de Rome 2) | **Sí** | Es una cámara sobre el mismo mundo. Hoy lo impide que «bajar» abre otra página |
| 800–1 200 hombres por bando | **Probable, sin medir** | Pide trabajo de escala al final; antes, 100–300 por bando |
| Animación «real» | **A medias** | Cada soldado tiene **12 movimientos genéricos** (andar, correr, guardia, golpear, cubrirse, encajar, morir…), no grabados para lanza y aspis. Con capas y manos atadas mejoran mucho; el techo es un 7, no un 9 |
| Ejecuciones y duelos coreografiados de Ryse | **No** | Son animaciones grabadas por parejas con actores. No las hay y no se pueden pedir |
| La escala y las caras de Rome 2 | **No** | Informe anterior, §6 |

**Lo que no se suele decir de Ryse**: de cerca solo luchan de verdad dos o tres; el resto es decorado bien colocado. Aquí se propone al
revés: todos luchan con reglas sencillas y solo se **dibuja** con mimo a los de cerca. Es más honrado y casa mejor con Rome 2.

**El riesgo de volver a gastar mucho sin que se note es alto**, por tres motivos:
1. **Es la tercera vez que se «unifica» el motor.** Hecho como fase aparte («primero el motor, luego se verá») repite BT1: 61 M y un 6,0.
2. **Aquí nadie ve lo que ve el usuario.** Este servidor dibuja por software; el peso y el movimiento solo se puntúan en su móvil.
3. **Una simulación de verdad puede ser peor juego** (hombres apelotonados, batallas de veinte segundos): ajustarlo es probar y mirar.

**Cómo se ataja (§6):** no hay fase de motor a oscuras. El núcleo crece **dentro de una pieza pequeña que se ve** (10 hombres, luego dos
muros); cada hito acaba en su móvil; y hay un freno escrito: si el duelo (hito 2) no llega a un 7 en dos vueltas, se para y se replantea.

## 2. El núcleo del simulador: cómo luchan de verdad

**Regla madre: los hombres son la verdad; el bloque solo da órdenes.** Hoy es al revés (el rectángulo decide y los hombres se tumban para
cuadrar la cuenta). El contador «quedan 143» pasa a ser una **suma**, nunca una entrada.

**Cada hombre lleva su ficha** (números en tablas, sin pantalla): dónde está, a dónde mira y a qué velocidad va; su hueco (fila y
columna); vida y heridas; **aliento**; estado del escudo y de la mano del arma (guardia, armando, golpea, recupera, para); **aplomo**
(cuánto aguanta antes de recular o caer); **miedo**; a quién tiene delante; su semilla de azar.

**Un paso, veinte veces por segundo, siempre en este orden:**
1. **Órdenes.** El bloque (`js/bloque.js`: dibujar el frente, girar como una puerta) dice a cada hombre cuál es su hueco. Nada más.
2. **Intención.** Cada hombre decide: ir a su hueco, sostener, empujar, luchar o huir, según lo que tiene alrededor.
3. **Cuerpos (la física manda).** Tres fuerzas: la que le lleva a su hueco, la que impide pisar al vecino y **la del que empuja detrás**.
   Lo que salga es su posición de verdad. Se acabó el muelle que lo devuelve «a su sitio de las reglas».
4. **Golpes.** Quien tiene un enemigo al alcance y en su cono, ataca. Vale para todas las filas que lleguen (lanza de hoplita, dos;
   sarisa, cinco). Un golpe tiene tres tiempos: **armar** (0,3–0,5 s), **impacto** y **recuperar**.
5. **Consecuencias en el impacto**, con la geometría real: por dónde llega, si cae en el arco del escudo, cuánto aliento tiene el que
   para. Sale parado (gasta escudo y aplomo), herida leve (recula un paso de verdad) o grave (**cae ahí, hacia donde le empuja el
   golpe**). Esto ya lo hace bien `js/combate.js`; solo falta dejarle mandar.
6. **Moral**, hombre a hombre (abajo). 7. **Avisos**: lista de lo ocurrido (golpe, parada, caída, orden, huida) para dibujo y sonido.

- **Quién lucha con quién**: el de enfrente; si no hay, el más cercano en su cono. El que recibe por el lado sin escudo o por la espalda
  no puede parar bien: **el flanqueo sale solo**, sin tabla de «+30 % por flanco».
- **Empuje de formación (othismos).** Con «Empujar», cada hombre aprieta el escudo contra la espalda del de delante. La presión se suma por
  la columna. Donde una columna aprieta más que la de enfrente, **gana un palmo de suelo**; el que cede pierde aplomo y, si cede mucho, cae
  o se da la vuelta. Así ocho filas vencen a cuatro y la línea se **comba** por donde es más débil. Empujar gasta aliento deprisa.
  (Historia: que el othismos fuera un empujón físico lo discuten los historiadores; licencia de juego, a dictaminar con la skill `historia`.)
- **Relevo y respiros.** Cuando cae el de delante, el de detrás da el paso (ya existe: `cerrarFilas`). El herido leve o agotado cambia el
  sitio con el de detrás. Cuando el aliento de las primeras filas baja, los dos muros se separan un par de pasos, jadean y vuelven: da
  ritmo y ventanas para ordenar (plausible; cifras, licencia de juego). El relevo de líneas enteras llegará con Roma, como dato.
- **Moral que sale de lo que pasa.** El miedo de cada hombre **sube** si ve caer al de al lado, si se queda sin nadie detrás o a un
  costado, si le llegan golpes por el lado o la espalda, si su columna recula, si cae el oficial. **Baja** si los vecinos aguantan, si se
  gana terreno, si el oficial está cerca y mata, con el grito. Un hombre con mucho miedo deja de empujar y da un paso atrás; su columna
  afloja; la línea cede ahí; los vecinos lo ven. **El pánico se contagia solo**, y la huida empieza por las filas de atrás, que son las
  que pueden darse la vuelta. La «moral de la unidad» de la pantalla es solo la media. No hay tabla de moral.
- **Niveles de simulación sin que el resultado dependa de dónde mires.** Regla dura: **la cámara no entra en el núcleo**. El nivel lo
  decide la **situación** del hombre: **dormido** (su bloque no tiene enemigo a 30 m: va pegado a su hueco, coste casi cero), **en marcha**
  (solo cuerpos) o **en contacto** (todo), igual para el que miras y para el que no. Con la cámara solo cambia el **dibujo** (§3). Si un
  día el cálculo no cabe, se reparte por turnos fijos (columnas pares un paso, impares el siguiente), igual para todos. Agrupar hombres
  «a bulto» queda solo para «Resolver sin jugar», donde no hay cámara.
- **Determinista y en Node.** Paso fijo, hombres recorridos siempre en el mismo orden, todo el azar de una semilla (`crearAzar`), sin reloj
  real. El jugador entra como **órdenes con su número de paso**: misma semilla y mismas órdenes, misma batalla; una partida grabada sirve
  de prueba. El parón de impacto y la cámara lenta son del dibujo; el núcleo ni se entera.

## 3. Animación real con el arte que hay

**Lo que hay** (comprobado en `assets/soldados/`): 18 soldados en cuatro niveles; el fino tiene 74 huesos (con dedos) y unos 14 000
triángulos; 12 movimientos cada uno, **horneados** en una textura que lee la gráfica (`js/gfx/soldado.js`). **El hoplita ya lleva la
lanza y el aspis en su propia malla**, colgados de sus huesos: en la primera batalla, «la lanza en la mano» sale gratis.

**Vía A · Horneado ampliado (para todos, coste cero por fotograma).** Al cargar se fabrican movimientos nuevos combinando los que hay y
se añaden a la textura (ya se hace algo así con los brazos de la sarisa, `generaTabla`):
- **Piernas de un movimiento y tronco de otro**: andar con el escudo alzado, andar con la lanza baja, golpear sin mover los pies. Se
  cuelga el tronco de un movimiento sobre la cadera del otro; no pide arte nuevo.
- **Empujar con el escudo** (cuerpo echado adelante), **estocada alta de lanza** (del «lanzar», sin soltar), **guardia de muro**.
- Tres o cuatro **finales de caída** distintos y versiones algo más rápidas y más lentas de cada movimiento.

**Vía B · En vivo (solo los 20–40 más cercanos al oficial).** Una «textura viva» pequeña que se rellena cada fotograma; misma malla y
misma llamada de dibujo. Por cada hombre cercano:
1. **Piernas** según su velocidad **real**; el ciclo avanza con los metros recorridos, no con el reloj: **los pies no patinan** (la
   zancada ya está medida en `soldado.js`: `zw`, `zr`). Al frenar o empujar, el pie de apoyo se clava.
2. **Tronco y brazos** con el movimiento de la acción, fundido en 0,15 s. Encima, la **reacción**: al recibir, el tronco gira hacia
   donde le empuja el golpe y vuelve como un muelle (0,25 s).
3. **Manos atadas (IK de dos huesos)**: la punta de la lanza va **al punto real** donde está el rival; el antebrazo izquierdo lleva el
   aspis hacia el golpe que viene; hombro y codo se calculan solos. Con sarisa, la segunda mano va al asta. La cabeza mira a su rival.
Coste estimado: 40 hombres × 74 huesos, unas 3 000 cuentas de matriz por fotograma; menos de un milisegundo en un móvil medio.

- **Golpe y parada que casan sin animaciones por parejas.** El núcleo anuncia el golpe **al empezar a armar**, medio segundo antes del
  impacto. El defensor que va a parar sube el escudo para llegar a la vez, y la punta va al escudo o al cuerpo, donde toque. Parece
  coreografía y no lo es. Es la pieza que más «realidad» da por menos dinero.
- **Caída.** Para todos: el «morir» horneado, orientado según el golpe, con el empujón heredado, acabado en uno de los finales, pegado al
  suelo y sin transparencia. Para el que matas tú y los de 5–6 m: **muñeco de trapo barato**, once puntos unidos por palos (cabeza, pecho,
  cadera, codos, manos, rodillas, pies) que caen 0,8 s y se congelan. Es lo más arriesgado: mal hecho da risa. Va al final y con interruptor.
- **Variedad y niveles de dibujo.** A talla, cabeza, piel y tela se suman desfase, velocidad y tiempo de reacción por semilla. Dibujo (aquí
  sí manda la cámara): 0–8 m, fino en vivo; 8–30 m, horneado con mezcla; 30–90 m, sin mezcla y a media cadencia; más lejos, cartón.

## 4. La vista del oficial como centro del juego (lo de Ryse)

**Tú eres un hombre del simulador**, el de la cresta, en primera fila. Si te empujan, te mueves; si te hieren, es tu vida.
- **Cámara**: por encima del hombro derecho, medio metro detrás, a la altura de los ojos, colgada de ti con un muelle suave. Mira al
  rival fijado; ves tu aspis a la izquierda, tu lanza a la derecha y a los compañeros de los lados. En horizontal.
- **El duelo con un dedo** (gestos ya hechos en `maquetas/bloque/dedos.js` y `oficial.js`): **toque** = estocada; **mantener** = escudo;
  **deslizar arriba** = empujón de aspis. Se añaden: **deslizar a un lado** = cambiar de rival; **deslizar abajo** = paso atrás (te
  releva el de detrás y recuperas aliento).
- **El rival es un hombre real** (hoy es un contador de golpes): el de enfrente, con su vida, escudo y aliento; si cae, el de detrás da
  el paso. **Se le lee**: arma el golpe 0,4–0,6 s (se ve y se oye); parar justo a tiempo lo deja abierto 0,8 s; aporrear la pantalla te
  deja sin aliento. Es el bucle de Ryse sin sus ejecuciones.
- **Golpes con peso** (todo en el dibujo): parón de 60–100 ms al impacto; sacudida de 3–5 cm; sonido en tres capas (madera o bronce,
  carne, gruñido); polvo o astillas; vibración (Android; el iPhone no deja); el herido **recula de verdad**; medio segundo de cámara
  lenta solo cuando matas tú.
- **Los de los lados luchan a la vez** (mismo simulador) y te importan: si cae el de tu derecha, te entran por el lado sin escudo.
- **Órdenes desde la fila**: la barra común de BT1 con las órdenes de un muro, **Avanzar · Alto · Empujar · Aguantar · Paso atrás**, y
  el grito. La orden se oye y **se ve propagarse** fila a fila en uno o dos segundos. Matar a tu rival baja el miedo de los tuyos. Si
  caes, pasas al siguiente oficial (ya previsto en `oficial.js`).
- **Subir a general sin cambiar de escena**: pellizco, y la cámara sube en una curva continua. Desde unos 8 m, tu hombre lucha solo;
  arriba dibujas el frente con el dedo (`bloque.js`). Al bajar, eliges bloque y entras en su oficial. El núcleo no cambia nada.
  **Plano corto de un segundo** en el choque, al dar «Empujar» y cuando el enemigo rompe.

## 5. Arquitectura: un mundo, una escena, dos alturas

```
 dedos y botones ──órdenes (con nº de paso)──▶  NÚCLEO js/batalla/  ──foto del estado + avisos──▶  DIBUJO js/gfx/batalla/ y SONIDO
   js/ui-batalla/                               (sin pantalla, Node)                               (solo leen)
```
El dibujo **nunca** escribe en el núcleo; pinta a 30–60 imágenes por segundo mezclando las dos últimas fotos del estado (20 por segundo).
Con este contrato, llevar el núcleo a un hilo aparte más adelante no obliga a rehacer nada.

| Módulo nuevo | Qué hace | Sale de |
|---|---|---|
| `js/batalla/estado.js`, `nucleo.js` | Las fichas de hombres y bloques; el paso en orden, los avisos, la foto | nuevo |
| `js/batalla/formaciones.js` | Cada tropa como **datos**: huecos, arma, escudo, guardia, órdenes | `combate.js` (`ARMAS`, `ESCUDOS`, `GUARDIAS`, `FALANGE`, `TESTUDO`), `maquetas/bloque/formaciones/` |
| `js/batalla/mando.js` | Órdenes y huecos de cada bloque | `js/bloque.js`, casi tal cual |
| `js/batalla/cuerpos.js` | Separar, empujar, ganar y ceder suelo | rejilla y separación de `js/fisica-batalla.js`, **sin** muelle ni tope |
| `js/batalla/lucha.js` | Golpe, parada, herida, caída, cansancio | `js/combate.js` (`golpear`, `arcoEscudo`, `relevo`), casi tal cual |
| `js/batalla/moral.js` | Miedo por hombre y contagio | nuevo (cifras de partida, de `simulador.js`) |
| `js/batalla/proyectiles.js` | Jabalinas, flechas, piedras | `crearProyectiles` de `fisica-batalla.js`, tal cual |
| `js/batalla/jugador.js` | Tus gestos convertidos en intenciones de tu hombre | reglas del duelo de `maquetas/bloque/oficial.js` |
| `js/batalla/rival.js` | El general enemigo: qué ordena cada bloque | decisiones de `js/bloque-ia.js`, reescritas |
| `js/gfx/batalla/escena.js`, `camara.js`, `tropas.js` | Una escena; cámara de la fila a lo alto; nivel de cada hombre | `maquetas/bloque/escena.js`, `camara.js`, `campo-mando.js`, `soldado.js` |
| `js/gfx/batalla/anim.js`, `anim-viva.js`, `impacto.js` | Qué movimiento toca (vía A), la capa en vivo (vía B), parón, sacudida, polvo, caídos | `js/combate-poses.js`, `generaTabla`; lo demás, nuevo |
| `js/ui-batalla/` | Dedos, barra de órdenes, fichas del duelo | `maquetas/bloque/dedos.js`, `duelo-hud.js`, `tira-mando.js` |

- **Se conserva**: `js/gfx/soldado.js`, todo `assets/soldados/`, `js/combate.js`, `js/bloque.js`, proyectiles y rejilla de
  `fisica-batalla.js`, `dedos.js`, `duelo-hud.js`, `campo-mando.js`, sonido y voces.
- **Se reescribe**: `js/bloque-ia.js` (861 líneas de reglas por bloque) como `rival.js`; `oficial.js` (rival real); el bucle de
  `maquetas/bloque/escena.js`; `js/combate-poses.js` (pasa a elegir movimientos); `js/ui-mando.js`.
- **Se tira al acabar** (no antes: lo publicado sigue con lo viejo hasta que lo nuevo lo supere): `maquetas/bloque/tropas.js` y
  `fisica.js`, `js/combate-tropas.js`, el muelle y el tope de `fisica-batalla.js`, `js/falange.js`, `falange-rivales.js`,
  `mando-varios.js`, los carriles de sarisas, el marco de «Bajar a pie», `js/battle.js`. `js/simulador.js` queda solo para «Resolver».

## 6. Hoja de ruta convergente

Cada hito acaba en **el móvil del usuario** con una pregunta y su nota; lo viejo sigue publicado hasta que lo nuevo lo supere. S, una sesión; M, dos o tres; L, varias.

| Hito | Qué se monta | Qué ve y puntúa el usuario | Tamaño | Riesgo |
|---|---|---|---|---|
| 1 · El hoplita de cerca | Doce hoplitas con el **nivel fino**, lanza y aspis en su malla, pies atados a la zancada, fundido entre movimientos; cámara del oficial. Sin lucha | «¿Parecen hombres y andan sin patinar?» | **S** | Bajo |
| 2 · El duelo con peso | Cinco contra cinco. Núcleo mínimo (cuerpos y lucha) para diez hombres. Rival real, armado que se ve, parada que casa, parón, sacudida, sonido, recular, caer hacia donde le dan | «¿Pesa el golpe? ¿Sé cuándo parar?» **Freno: menos de 7 en dos vueltas, se para** | M | Medio |
| 3 · Muro contra muro | Dos muros de 48–96. Empuje, relevo de fila, miedo y contagio, respiros, huida desde atrás. Vía A completa | «¿Veo ceder la línea y romper al enemigo sin que me lo diga un letrero?» | L | **Alto** (ajuste) |
| 4 · Mandar y subir | Órdenes desde la fila que se ven propagarse, pellizco hasta la vista de general, dibujar el frente. Una página, sin marco | «¿Mando y bajo sin cambiar de mundo?» | M | Medio |
| 5 · La batalla | Tres o cuatro bloques por bando, general rival, niveles dormido/marcha/contacto, medición en su móvil, interruptores de calidad | «¿Es una batalla y va fluida?» | L | Alto |
| 6 · Más tropas, como datos | Peltastas y arqueros (mover, apostar, escaramuza, tirar tú, munición: crítica 6); luego sarisa; el testudo, al llegar Roma | Una tropa nueva cada vez | M cada una | Bajo |
| 7 · Escala y remate | Hilo aparte, cartones al fondo, muñeco de trapo; sustituir la batalla publicada y borrar lo viejo | De cientos a unos mil por bando | L | Medio |

**Cómo se prueba (por propiedades, nunca «que salga igual que antes»):**
- **Repetible**: misma semilla y mismas órdenes grabadas, misma batalla. **Sin cámara**: nada de `js/batalla/` importa de `js/gfx/`.
- **Causa y efecto**: nadie muere sin un golpe o proyectil que lo explique. **Cuerpos**: dos hombres en pie nunca a menos de 0,45 m.
- **Sentido común en veinte semillas** (bandas, no cifras exactas): dos muros iguales duran de 3 a 10 minutos; ocho filas empujan a
  cuatro; el flanqueado pierde casi siempre; mueren más en la huida que en el choque; el que no tiene aliento para peor.
- **Coste**: milisegundos por paso con 2 × 600 hombres en Node, con techo escrito, para ver venir el problema antes del móvil.
- **Aspecto**: capturas y juez de aspecto como filtro; **la vara es la nota del usuario en su móvil** y el examen de jugabilidad de una
  sesión que no lo construyó.

## 7. Lo que no se promete

- **Ryse entero**: ejecuciones y remates coreografiados. Sí su cámara, su ritmo y su peso.
- **Rome 2 entero**: miles de hombres con duelo animado y caras. Sí su mando desde arriba y su lectura de la línea.
- **Animación de captura de movimiento.** Con 12 movimientos genéricos se llega a «creíble», no a «de película». Para más harían falta
  movimientos nuevos con licencia libre; hoy no los hay en el proyecto.
- **Que el simulador salga divertido a la primera** (el hito 3 pedirá vueltas de ajuste), **ni que el muñeco de trapo quede bien**.
- **Cifras en móvil.** Nada está medido en un móvil real; los hitos 1, 2 y 5 incluyen medirlo en el del usuario. Objetivo honrado:
  treinta imágenes por segundo estables, no sesenta con todo al máximo.
- **Aviso de historia** (skill `historia`): el muro de hoplitas clásico es de hacia el 700–650 a.C., no del 800; la sarisa, de hacia el
  350 a.C. Empezar en el 800 con muro de hoplitas es licencia de juego y debe marcarse.
