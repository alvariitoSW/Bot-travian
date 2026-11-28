# GP1e · «Politeia viva»: una sola pantalla que se mueve · 26/11/2026

Sesión de diseño (Fable, por excepción del usuario). No toca el juego. Cambia la **forma** de `GP1d-politeia.md`
(muchos lugares = muchas pantallas) por **una sola pantalla viva**. Las reglas de GP1d (año de cuatro actos, pulso de
la agenda, debate con argumentos ganados, tribunal, régimen, cargos, ostracismo, intrigas) se mantienen.
**Pedido del usuario** (26/11, literal): «Me gusta, pero no quiero que sea muchos menús con muchas oantallasz quiero hacer
como un modelo vivo de pantalla , preguntarme cosas para mejorar la maqueta en esa dirección hazme un cuestionario de
calidad y después la mejoras».

Maqueta que **se mueve y se toca**: `gp1/politeia-viva.html` (abrirla en el móvil). Capturas: `gp1/y1.jpg` – `y6.jpg`.

## 1. Cuestionario y respuestas (26/11; entre comillas, lo que escribió de su mano)
| N.º | Pregunta | Respuesta |
|---|---|---|
| 1 | Qué es la pantalla viva | «La 1 esa idea pero más que sobre un frisio sobre una ciudad como la 2 o como la 4. La vasija que gira se puede conservar para alguna otra función» |
| 2 | Al tocar | La cámara se acerca (la recomendada) |
| 3 | Ritmo | «Una mezcla de 1 y 2» (viva pero espera + en marcha de verdad) |
| 4 | Texto | «La 2 peo que esté combinando con el arte para no sobre saturar la pantalla» (etiquetas cortas, metidas en el dibujo) |
| 5 | Qué ciudad | «Una mezcla de las 3» (la tuya, pintada aparte, con el corazón en detalle) |
| 6 | Aspecto | «1 y 3» (pintura de vasija con vida + ilustración pintada del taller) |
| 7 | Momentos grandes | Zoom y escena del taller |
| 8 | Gente | 8 con nombre y pueblo (la recomendada) |

## 2. Lo que sale de esas respuestas
- **Una ciudad pintada, una sola pantalla.** La polis entera en una vista ancha que se desliza con el dedo: puerto,
  ágora, Consejo, tribunal, tu casa, y el santuario en la colina. No hay menús ni pestañas dentro de la política.
- **Es tu ciudad, pintada.** Copia lo que tienes construido (lo que está en obras sale en línea de puntos; lo que no
  tienes, no está). El **corazón** (ágora, Consejo, tribunal, templo) va con más detalle; el resto, de fondo.
- **Aspecto mezcla**: figuras de vasija (negras, granates) sobre una ciudad pintada a color (mármol claro, tejas, mar,
  cielo). El fondo y los edificios, ilustración del taller de Arte; las figuras, de código y animadas.
- **Letreros dentro del dibujo**: cada lugar con su cartel y cada persona con su nombre en una cinta pequeña. Nada más
  a la vista. El resto sale al acercarse.
- **Tocar = la cámara se acerca.** Entra en el edificio (el Consejo se ve por dentro, con su gente), sube una ficha
  corta con dos acciones y «Alejar». Nunca cambias de pantalla.
- **Momentos grandes** (debate, juicio, banquete, golpe de mano): la cámara se acerca y **funde a una ilustración del
  taller**; se juega encima y se vuelve a la ciudad.
- **Viva, mezcla de las dos**: el sol cruza el cielo y marca el día; la gente camina, los barcos llegan, el humo sube.
  Los **avisos** (círculos con un icono) tienen un anillo que se gasta: un rumor o un enviado **no esperan siempre**.
  Lo importante (agenda, debate, cuentas) **sí espera** a que tú actúes. Hay pausa.
- **8 con nombre y pueblo**: ocho personas reconocibles con su cinta, y treinta o cuarenta figuras de pueblo que
  hacen bulto y enseñan el humor (granate = en contra; mano alzada = contigo).
- **La vasija se conserva** como botón en la esquina: es tu **crónica** (lo que pasó anoche) y la **vasija de tu vida**
  (las escenas pintadas de tu partida). Ya no es el menú.
- **El año de cuatro actos** va en una barra fina abajo (Agenda, Intrigas, Debate, Cuentas): cambia la luz de la
  ciudad y dónde se junta la gente.

## 3. Qué hay en la maqueta viva
Deslizar a los lados; tocar un lugar (la cámara se acerca y sale la ficha); «Alejar»; en el ágora, «Ensayar el debate»
funde al hueco de la ilustración; tocar la vasija. Se mueven solos el sol, el pueblo, el barco, las olas, el humo del
oráculo y los anillos de los avisos. Los dibujos son de relleno; las reglas no están (es maqueta, no juego).

## 4. Técnica y gasto (para el constructor; no cambia el total de GP1d de forma apreciable)
- Una escena SVG o lienzo 2D por capas (fondo del taller en 2–3 imágenes anchas, edificios, figuras). Sin 3D: ligera
  y fluida en móvil. Presupuesto de arte: lo fija el taller (`gobierno/arte.json`).
- Cámara: desplazar y acercar con transformaciones; zonas de toque ≥ 44 px; `touch-action: none` solo en la escena.
- La lógica sigue aparte y corre en Node; la escena solo pinta lo que la lógica dice (quién está dónde, qué avisos hay).
- Sustituye a las seis u ocho pantallas de GP1d por **una escena y seis acercamientos**: algo menos de interfaz, algo
  más de arte. Total esperable igual: **≈ 40 M + arte**; prueba P0 ≈ 5 M, ahora sobre esta pantalla.

## 5. Preguntas que quedan
Siguen abiertas las 17–21 de `GP1d-politeia.md` (año de cuatro actos, qué lugares primero, el debate, instituciones
clásicas, empezar por la prueba). Nuevas:
22. ¿Vale esta dirección de una sola ciudad viva? **(A, recomendada)** sí · (B) otra vuelta. Por qué: cumple «sin muchas pantallas» y deja sitio al arte.
23. Lo que no espera (rumores, enviados): **(A, recomendada)** caduca al acabar la estación, sin reloj que agobie · (B) con reloj de verdad, en segundos. Por qué: en el móvil se juega a ratos; un reloj castiga.
24. ¿Móvil de pie o tumbado para la política? **(A, recomendada)** de pie, como el resto de la ciudad · (B) tumbado, como las batallas, para ver más ciudad. Por qué: no obliga a girar el móvil al cambiar de pestaña.

### Respuestas del usuario
*(pendientes)*
