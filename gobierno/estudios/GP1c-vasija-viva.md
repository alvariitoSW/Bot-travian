# GP1c · «La vasija», segunda vuelta: viva, con diplomacia y ciudad · 25/11/2026

Sesión de diseño (Fable, por excepción del usuario). No toca el juego. Amplía `GP1b-juego-de-intrigas.md`.
**Pedido del usuario** (25/11, literal): «Me gusta pero creo que se puede mejorar la maqueta dea vasija, quiero rehacerla
y ampliar el juego de política, meter más imágenes y hacerlo un juego vivo que afecte a tu diplomacia y a citibuilder
de tu ciudsd».
Maquetas: `gp1/maqueta-vasija2.html` y `gp1/w1.jpg` – `gp1/w4.jpg`.

## 1. Qué cambia respecto a la primera vasija
- **La vasija, rehecha** (`w1.jpg`): expuesta como en un museo, con brillo y sombra, asas, palmetas y **cuatro franjas**
  (acrópolis, ágora, tu casa, **puerto**). Se gira con el dedo. Abajo, una línea de **crónica**: lo que pasó anoche.
- **Viva: lo que pasa fuera se pinta dentro.** La vasija no es un menú, es el espejo de tu partida:
  - Lo que **construyes** aparece pintado (el templo, el pórtico; la fuente a medio hacer sale en línea de puntos).
  - Si tus **hoplitas están en campaña**, sus figuras faltan en el ágora y **no votan**: mandan más los nobles y los pobres.
  - Si llega un **barco** de otra polis, se ve en el puerto con su enviado.
  - Los **rivales se mueven de noche**: al día siguiente las figuras están en otro sitio y la crónica lo cuenta.
  - La **grieta** de la discordia sigue siendo el único aviso.
- **Más imágenes**: cada golpe de mano es una **escena grande** pintada (`w4.jpg`), no un texto. Y cada persona, polis
  y edificio tiene su dibujo. Todo en el mismo estilo, hecho con código.

## 2. Diplomacia: las otras polis tienen amigos en tu casa (`w2.jpg`)
- Cada polis vecina tiene un **huésped** entre tus cabezas de familia (amistad de padres a hijos). Ese vecino habla
  por ella en tu ágora: el huésped de Mégara votará contra la guerra con Mégara.
- **Hilos** a la vista: blanco, huéspedes o boda; granate, odio; de puntos, plata o secretos.
- Los **enviados llegan en barco** (si tienes puerto) y piden algo a cambio de algo. Cuatro salidas: banquete con él
  (mejor trato), boda (alianza de 10 años), llevarlo al ágora (se vota) o destapar a quien cobra del enemigo.
- **Las polis se meten en tu política**: pagan a tus rivales, acogen a tus desterrados, y Esparta echa tiranos.
- **Tú haces lo mismo fuera**: con un huésped en Corinto puedes pagar a su bando amigo, pedir asilo si te destierran
  y volver con sus soldados.
- Efecto en la campaña: guerra y paz se votan con estos hilos; una boda es una alianza de verdad en el mapa; un
  escándalo de «cobra de Mégara» da motivo de guerra.

## 3. Ciudad: cada obra es una jugada política (`w3.jpg`)
- Al construir eliges **quién paga**: **tú** (plata, y el prestigio es tuyo), **un rico** (gratis, lleva su nombre,
  sube él y le debes un favor) o **el pueblo a jornal** (barato y lento, contenta a los pobres).
- **Cada obra abre algo en la política**: ágora → corrillos y rumores; casa grande → 5 invitados al banquete;
  fuente → oyes a los pobres; puerto → llegan enviados; templo → oráculo; gimnasio → jóvenes nobles;
  muralla → la discordia sube más despacio; teatro → fiestas que calman.
- **La política vuelve a la ciudad**: con discordia 4, las obras van un tercio más lentas; a 6, motín y arde un
  edificio. El bando contento trabaja mejor en lo suyo (mercaderes → mercado y puerto; hoplitas → campo y leva).
- **El régimen cambia las obras**: el tirano construye más barato; la democracia paga remeros; la aristocracia, jinetes.

## 4. Un día cualquiera (para ver que encaja)
Mañana: en la vasija faltan tus hoplitas (están en Mégara) y hay un barco de Corinto. Ágora: un corrillo dice que
Filón cena con megarenses. Noche: banquete con el enviado de Corinto y con Eudoro; vino fuerte; sale el secreto:
Filón cobra de Mégara. Al día siguiente, Filón entra en carro con una «diosa». Tú destapas el truco. La escena se pinta.
Corinto te da remeros. La fuente la paga Eudoro y ahora le debes un favor.

## 5. Dictamen de historia (de memoria, por cotejar)
| Pieza | Fuente | Etiqueta |
|---|---|---|
| Huéspedes de padres a hijos (xenía) | Homero, *Ilíada* 6.212–236 (Glauco y Diomedes); Heródoto 1.69 | probable |
| El vecino que representa a otra polis (próxeno) | inscripciones desde el s. VII (Corcira, tumba de Menécrates) | probable |
| Bodas entre casas de distintas polis | Heródoto 6.126–130 (Agarista de Sición) | histórico |
| Volver del destierro con plata y soldados de fuera | Heródoto 1.61–62 (Pisístrato, con Tebas, Argos y Eretria) | histórico |
| Esparta echa tiranos | Heródoto 5.63–65; Tucídides 1.18 | histórico |
| Golpe mientras la tropa está fuera | Tucídides 8.63–70 (411 a.C., la flota en Samos) | histórico, de época posterior; aquí, licencia de juego |
| Los ricos pagan obras y les ponen nombre | Heródoto 5.62 (los Alcmeónidas y el templo de Delfos) | histórico |
| El tirano constructor; la fuente de nueve caños | Tucídides 2.15; Aristóteles, *Política* 1313b | histórico |
| La «diosa» era una vendedora de coronas | Heródoto 1.60; *Const. aten.* 14 | histórico (según ellos) |
| Letras en los escudos de cada polis | la lambda espartana es del s. V (Eupolis, fr. 394) | licencia de juego: sirve para distinguirlas |
| Que cada obra abra una opción política; cifras | — | licencia de juego |

## 6. Encaje y reglas de la casa
- **Arquitectura**: la intriga es lógica pura (`js/polis-politica.js`, corre en Node). Lee la ciudad y la campaña por
  funciones que ya existen (qué hay construido, dónde está el ejército, con quién hay guerra) y devuelve efectos
  (votos, coste y ritmo de obra, tratos). La vasija solo pinta. La batalla no se entera de nada.
- **Áreas**: reglas, Cerebro (Política y Ciudades); la vasija y las escenas, Músculo (menús); dibujo, taller de Arte;
  sonido, taller de Sonido. Hace falta un pase entre ministerios: lo ordena el vigía.
- **Arte**: todo SVG propio, 0 KB ajenos. Si más adelante se quieren escenas pintadas de más calidad, se encargan al
  taller de Arte con licencia libre; no hace falta para empezar.

## 7. Tamaño y gasto (honrado)
Sobre los ≈ 14 M de GP1b (IN1–IN8), la ampliación suma:
| Paso | Qué | Quién | Gasto esperable |
|---|---|---|---|
| IN9 | Vasija viva: lee ciudad y campaña (obras pintadas, tropas fuera, barcos), crónica, girar | Sonnet | 2,0 M |
| IN10 | Diplomacia: huéspedes, enviados, bodas, polis que se meten; unión con guerra y paz del mapa | Sonnet (diseño fino Opus) | 3,0 M |
| IN11 | Ciudad: quién paga cada obra, qué abre cada edificio, discordia que frena o quema | Sonnet | 2,5 M |
| IN12 | Escenas grandes: 8 golpes de mano dibujados y animados | Sonnet + Haiku (textos) | 2,0 M |
| IN13 | Examen ampliado: liga de bots con ciudad y diplomacia, jugabilidad, historia | Opus que no construyó | 1,0 M |
| | **Ampliación** | | **≈ 10,5 M** |
| | **Todo el juego de política** (GP1 + GP1b + GP1c) | | **≈ 33 M** |
Es del tamaño de una meta entera del plan. **Prueba barata** (recomendada, ≈ 4 M): reglas en Node con ciudad y
diplomacia de mentira, una vasija viva sin adornos, un banquete y una escena. Diez minutos de juego y se decide.

## 8. Preguntas al usuario
Siguen abiertas las 1–7 (`GP1-menus-politica.md`) y las 8–12 (`GP1b-juego-de-intrigas.md`). Nuevas:
13. ¿Vale esta vasija rehecha? **(A, recomendada)** sí, este es el camino · (B) otra vuelta: dime qué no te gusta. Por qué: ya es espejo de la partida, no un menú.
14. ¿Cuánto debe mandar la política sobre la ciudad y la diplomacia? **(A, recomendada)** mucho pero con salida: siempre puedes construir o pactar pagando más, sin intrigar · (B) del todo: sin política no hay obra ni pacto. Por qué: quien solo quiera construir no debe quedar atascado.
15. ¿Dónde entra en el plan? **(A, recomendada)** como meta nueva después de M4 («M4b · Intrigas»), con la prueba barata de 4 M antes · (B) sustituye a M4 entera ya (≈ 33 M) · (C) después de la 2.0. Por qué: M4 da la base (regímenes y ágora) y la prueba dice si divierte antes de gastar.
16. ¿Las escenas grandes? **(A, recomendada)** dibujadas con código en estilo de vasija, como en la maqueta · (B) encargar ilustraciones más ricas al taller de Arte (más caro y más lento). Por qué: el estilo propio ya luce y no pesa.

### Respuestas del usuario
Todas las respuestas (1–16) están juntas en `GP1-menus-politica.md` §7.
