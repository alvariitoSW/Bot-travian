# Corazón · LP0 Cómo se pelea a pie, desde cero (23/11/2026)

**Qué es.** La vara del **control** y de **lo que se entiende en pantalla** en la lucha a pie (testudo, manípulo y
falange). Sirve a **L11** (testudo a pie) y **L17** (formaciones a pie). Hablada con el usuario el 23/11 en dos rondas de
preguntas con bocetos en papel (`estudios/LP0-bocetos/`). **Sustituye** el control de `TP9-objetivo-lucha-a-pie.md` §3–§4
(dedos libres, oficial con gestos) y el de `FA0-plan-falange.md` §2 (compás, rayas de filas, estocada propia). Lo demás de
esos estudios (siluetas, movimientos, historia, la regla de la distancia como idea) se conserva donde no choque.
Estado: **borrador a la espera del visto bueno del usuario** (§10).

## 1. Por qué fallaron las dos formas (sus palabras)
| Intento | Qué dijo | La raíz |
|---|---|---|
| TP9-0, maqueta «Lucha a pie» | «si le doy a la izquierda o derecha me mueve una persona sin sentido, el lucha no tiene sentido… solo estás poniendo parches a algo que no funciona» | Mandabas **un solo hombre** con gestos invisibles |
| FA4, falange | «si giro me siguen los enemigos y se teletransportan, no se bajan bien las lanzas, no entiendo bien la lucha» | El mundo giraba **contigo**; las filas se tocaban en rayas pequeñas que nadie explicaba |
| Lo que pide | «le falta moverse en bloque con las tropas… mejorar los gráficos y las animaciones… que no se atraviesen las picas ni los brazos y que haya físicas» | Quiere **mandar una unidad**, verla moverse como un cuerpo y que parezca real |

## 2. Lo que decidió (23/11, chat de LP0)
| Pregunta | Eligió |
|---|---|
| Qué controlas (boceto 1) | **(A) El bloque**: cámara detrás y un poco por encima de tu unidad; tus hombres pelean solos, con físicas; tú das las órdenes |
| Cómo se mueve (boceto 2) | **(A) Dibujar el frente** con el dedo, como en Rome II: sueltas y marchan juntos, girando como una puerta. El enemigo no se mueve contigo |
| Modelos | **Los dos de Meshy** (falangita y romano que ya pasó); si tiene un galo, lo pasa |
| Pantalla (boceto 3) | Lo del boceto 3 **y además**: «la vista desde el oficial de pie», «la opción de más datos pero que se vea la pantalla de jugabilidad amplia», y «hacer la IA enemiga más difícil… que no sea tan fácil la batalla» |
| Cuántas unidades | **Una, con compañeras** que lleva el juego a los lados |
| Acercar la cámara | **Sí, con un pellizco**, hasta el hombro del oficial (§3) |
| Orientación | Prefiere **vertical**; le vale horizontal (dicho en FA4). Se diseña en vertical primero |

## 3. El control elegido, en una página
**Tú mandas tu unidad, no a un hombre.** Un manípulo (o una falange) de 120–160 hombres que se mueve, gira y pelea como un
solo cuerpo. A los lados, unidades amigas que lleva el juego. Enfrente, un enemigo que piensa.

| Gesto | Dónde | Qué pasa en pantalla |
|---|---|---|
| **Arrastrar** desde un punto a otro del suelo | En el campo | Se pinta una raya azul discontinua: **ahí formará tu primera fila, mirando hacia delante de la raya**. Al soltar, marchan en bloque; para girar, el ala de fuera anda más (como una puerta). Tarda unos segundos: pesa |
| **Tocar una orden** | Cuatro botones grandes abajo | Romanos: **Cargar · Alto · Testudo · Relevo**. Falange: **Empujad · Alto · Picas ↑↓ · Atrás**. La orden que conviene ahora **se ilumina** (sin decirte cuál tocar con texto) |
| **Pellizcar** | En el campo | La cámara baja del plano de mando al **hombro del oficial** en la primera fila («vista del oficial a pie»), y vuelve. Solo cámara: sigues mandando el bloque con los mismos botones; nunca mueves a un solo hombre |
| **Tocar «Datos ▾»** | Esquina de arriba | Se despliega una tira fina con cifras (hombres, moral, cohesión de los dos bandos). Plegada por defecto; nunca tapa el centro |

**A golpe de vista** (boceto 3), solo seis cosas:
1. Arriba, el **objetivo y cómo va, en palabras** («Rompe su línea · vais ganando»).
2. La **línea de choque**: chispas y polvo donde se pega.
3. Sobre cada bloque, su **estandarte con un aro de color y una palabra** (verde «fresca», ámbar «cede/cansada», rojo «huye»).
4. **Avisos en el borde** de la pantalla (una franja roja del lado por donde viene el peligro), nunca un cartel en medio.
5. Una sola **raya: cansancio de la fila que pelea**; al agotarse, «Relevo» se ilumina.
6. Las **cuatro órdenes**. En la falange, además, las picas **se ven** bajadas o alzadas en el propio muro: ya no hay rayas de filas.

**El enemigo** (más difícil, pedido suyo): vive en el campo, no en tu cámara. Al girar tú, **no gira contigo** ni salta.
Tiene su propio jefe y su reserva; busca tu flanco, espera a que tu primera fila se canse, lanza su salva cuando estás
abierto y, si cede, se retira para volver a formar en vez de morir quieto. Tres niveles: Fácil · Normal · Difícil.

## 4. Qué verás, qué harás, qué sentirás (la prueba en papel, bocetos `LP0-4` y `LP0-5`)
| # | Qué verás | Qué harás | Qué sentirás |
|---|---|---|---|
| 1 | Plano ancho: tu manípulo al centro, dos amigas a los lados, los galos enfrente. «Rompe su línea antes de que llegue su jefe» | Mirar | Que eres el que manda |
| 2 | Los galos se desplazan a tu derecha | Arrastras una raya en diagonal: tu bloque marcha y gira como una puerta | Peso: girar 160 hombres tarda |
| 3 | Lluvia de jabalinas; «Testudo» se ilumina | Tocas: techo de escudos, «¡Testudo!» escrito y dicho | Alivio: rebotan |
| 4 | A 30 pasos, «Cargar» se ilumina | Tocas: lanzan el pilum y corren | Empuje; sabes que cansa |
| 5 | Choque | Pellizcas: al hombro del centurión de cresta roja, en la primera fila; ves golpes, escudos que se empujan sin atravesarse | Estar dentro |
| 6 | Franja roja a la izquierda: «¡Su reserva va a tu izquierda!» | Vuelves arriba y dibujas un frente nuevo hacia la reserva | Tensión: el enemigo piensa |
| 7 | Raya roja, «agotada»; «Relevo» se ilumina | Tocas: la segunda fila pasa delante **por los huecos** | Respiro: lo hiciste a tiempo |
| 8 | (opcional) | Abres «Datos ▾»: hombres, moral y cohesión de los dos | Control, sin perder el campo |
| 9 | Su estandarte en rojo, «huye»; los caídos se quedan | Eliges: Cargar (perseguir, cansa y desordena) o Alto (formar) | Decisión con riesgo |
| 10 | Tarjeta: «Victoria», tiempo, bajas, **qué más pesó y qué costó** | Volver | Entiendes por qué ganaste |

**Falange** (mismo esquema, boceto 3 derecha): formas y giras igual, dibujando el frente. Las tres primeras filas bajan
las picas y el resto las alza en abanico; «Picas ↑↓» las alza todas ante la salva o las baja ante la carga. «Empujad» hace
avanzar el muro mientras la cohesión aguante. Contra elefantes y caballería, el peligro es el flanco: lo ves llegar por el
borde y redibujas el frente a tiempo (lento) o te rompen.

## 5. Lo que NO es
- No mandas a un soldado: ni palanca de hombre, ni estocadas, ni tajos con el dedo (lo de TP9).
- No hay gestos invisibles: todo lo que tocas es una raya que se ve o un botón con su nombre.
- La cámara no arrastra al mundo: el enemigo y el campo se quedan donde están (lo de FA4).
- No hay rayas de filas ni compás que marcar con toques (lo de FA4).
- No hay consejos que digan «toca X»: la orden útil se ilumina y basta.
- No hay planos de cine automáticos (no los eligió; quedan como idea).
- No es la batalla grande de varias unidades (CG8): aquí mandas una, con amigas que lleva el juego.

## 6. Comprobaciones medibles
| # | Qué | Cómo se mide | Vara |
|---|---|---|---|
| 1 | Se mueve en bloque | Prueba sin pantalla: frente nuevo a 60° | Todos los hombres llegan; ninguno a más de 1,5 m de su hueco; tarda 6–12 s |
| 2 | El enemigo no te sigue | Girar 90° tu bloque | Ningún enemigo cambia de sitio por tu giro; ningún salto mayor de 0,5 m por paso |
| 3 | Nadie se atraviesa | Con las físicas de FI1, choque de 60 s | 0 cuerpos solapados más de 10 cm; picas y escudos sin cruzar cuerpos (lo mide el juez de FI1) |
| 4 | Se entiende sin explicar | Captura en cada fase de la prueba en papel | En cada captura, 6 elementos o menos en pantalla; el centro libre; la orden útil iluminada |
| 5 | El enemigo piensa | Bot «que no reacciona» frente a la IA en Normal | La IA flanquea en 8 de 10 partidas; el bot quieto pierde en Normal |
| 6 | No es fácil | Bot «que juega bien» en Difícil | Gana entre 4 y 7 de cada 10, no 10 de 10 |
| 7 | Las órdenes cuentan | Bots que usan Testudo, Relevo y Cargar a tiempo frente a bots que no | Los primeros pierden menos de la mitad de hombres |
| 8 | Vista del oficial | Pellizco en pleno choque | Se llega al hombro en menos de 1 s y se vuelve igual; los botones siguen funcionando |
| 9 | Vertical | Capturas a 390×844 (y 844×390) | Nada cortado; botones de 44 px o más |
| 10 | Peso | Contador de la escena | Llamadas ≤ 30; triángulos ≤ 750 mil |
| 11 | La nota | El usuario, en su móvil | Él la pone |

## 7. Historia (dictamen: **APTO CON NOTAS**)
- **Manípulo y relevo de líneas**: hastati, principes y triarios en tablero, con huecos para relevarse — `histórico`
  (Polibio 6.21–23; Livio 8.8). El relevo de **filas dentro de un mismo manípulo** por los huecos es `probable`
  (reconstrucción de Sabin, «The Face of Roman Battle», JRS 90, 2000; Goldsworthy, *The Roman Army at War*, 1996).
- **Pilum antes de cargar**: `histórico` (Polibio 6.23 describe el pilum; la salva antes del choque, César, *BG* 1.25,
  es algo posterior pero recoge la práctica).
- **Testudo**: atestiguado en el periodo en asaltos (Polibio 28.11 y Livio 44.9, 169 a.C.). En campo abierto contra una
  salva gala es `licencia de juego`.
- **Falange**: sarisa larga, cinco puntas por delante, las filas de atrás con el asta alzada que frena proyectiles; rígida
  y débil por el flanco y en terreno roto — `histórico` (Polibio 18.29–32). Las tres filas bajadas son una simplificación.
- **Galos con reserva que busca el flanco**: los galos sí combatían por bandas y con jefes (Polibio 2.28–33, Telamón);
  una IA que flanquea con método es `licencia de juego` para que no sea fácil.
- **Persecución que desordena**: `histórico` como riesgo conocido (Polibio 2.33 y 18.26, Cinoscéfalas).
- Sin anacronismos en el control. Pendiente de leer los pasajes exactos al construir (lo hace la tarea LP2 con la skill).

## 8. Reparto en tareas pequeñas (≤ 30 pasos cada una; Opus; en este orden)
Reutiliza: `js/falange.js` y `js/falange-rivales.js` (reglas sin pantalla, rivales, bots), `gobierno/maquetas/falange/`
(escena, campo, cámara, formación), el soldado nuevo de `js/gfx/soldado.js` con su esqueleto, las **físicas de FI1**
(`js/fisica-batalla.js`, aún sin subir: LP se conecta a ellas, no las rehace) y los modelos de Meshy aligerados por FA2.

| # | Tarea | Qué verá el usuario | Archivos | Pasos | Coste |
|---|---|---|---|---|---|
| 1 | **LP1 · Bloque y frente dibujado (reglas)** | Nada aún: prueba en Node de que el bloque gira como una puerta y el enemigo no le sigue (comprobaciones 1 y 2) | `js/bloque.js` (nuevo, sin pantalla), `test/bloque.test.mjs` | 25 | ≈0,8 M |
| 2 | **LP2 · Órdenes y enemigo que piensa** | Nada aún: bots que prueban Testudo, Cargar, Relevo y la IA en tres niveles (comprobaciones 5–7) | `js/bloque.js`, `js/bloque-ia.js` (nuevo), tests; usa reglas de `js/falange.js` | 30 | ≈1,0 M |
| 3 | **LP3 · Maqueta «Manípulo a pie» en vertical** | Escaramuzas → Pruebas rápidas: tu manípulo contra galos; dibujas el frente, cuatro órdenes, estandartes con aro y palabra, raya, avisos en el borde, «Datos ▾» | `gobierno/maquetas/bloque/*` (nuevo, reutiliza escena y campo de la falange), pase → común: entrada en `js/ui.js` y `sw.js` | 30 | ≈1,3 M |
| 4 | **LP4 · Pellizco y vista del oficial** | Acercar hasta el hombro del centurión y volver, con los botones vivos | `gobierno/maquetas/bloque/camara.js` | 20 | ≈0,6 M |
| 5 | **LP5 · Físicas y soldados de Meshy** | Escudos que se empujan sin atravesarse; relevo por los huecos; romanos de Meshy | conexión a FI1; `assets/soldados/` (taller, skill `arte`) | 30 | ≈1,5 M |
| 6 | **LP6 · Falange con el mismo control** | La falange de hoy pasa a dibujar el frente y a cuatro botones; picas visibles bajadas/alzadas; sin rayas de filas | `gobierno/maquetas/falange/hud.js`, `dedos.js`, `escena.js` | 25 | ≈1,0 M |
| 7 | **LP7 · Llevarlo a «Bajar a pie»** | En la batalla grande, al bajar a tu unidad, el mismo control | `js/ui-mando.js`, `js/simulador.js` | 30 | ≈1,2 M |

**Total declarado ≈7,4 M; esperable 9–10 M** (las tareas de batalla se pasan un 25–40 %). El usuario prueba cada una con
pantalla (LP3 en adelante) en su móvil antes de abrir la siguiente. LP1 y LP2 pueden ir a la vez. LP5 espera a FI1.
**Qué se deja en pausa del todo**: TP9b–g y FA6, FA8, FA9, FA10 tal como estaban escritas (su control queda sustituido).

## 9. Ideas que no entran ahora
- Planos de cine automáticos al cargar o romper (no elegidos; el pellizco cubre «verlo de cerca»).
- Mandar varias unidades tocando su estandarte (se dejó en «una, con compañeras»).
- Voces dichas además de escritas en las órdenes (depende del sonido de GM43i).

## 10. Visto bueno
Pendiente. Con su «sí», las tareas LP1–LP7 pasan a «Propuestas por aprobar» de la bitácora (las escribe el vigía).
