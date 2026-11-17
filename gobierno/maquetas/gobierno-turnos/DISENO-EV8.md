# EV8 · Gobierno y ciudad juntos — diseño aprobado por el usuario (17/11/2026)

Maqueta: `gobierno/maquetas/gobierno-turnos/`. Parte de EV7 (léase la cabecera de `reglas.js`). Solo se toca esta carpeta.
NO se tocan `js/`, `css/style.css` ni `index.html` de la raíz. Nada de 3D (eso es P167).

## Lo que pidió el usuario (literal, resumido)
«Cada año puedo decir en esta ciudad quiero esto, esto y esto, y que vaya creciendo y mejorándose según lo pida yo; el Senado
cada estación vota las cuestiones de Estado, no cada cosa que hago, sino como una sesión del congreso: si lo he hecho bien,
si los ciudadanos están contentos, si nadie se rebela. Crucial: que todo converja ahí.» «Mejoras con menos niveles, que
dependan de tu tecnología, tus recursos, tu nivel del Foro. Sencillo para el público general pero artísticamente precioso.
Intrigas políticas, banquetes, asistir a los juegos o a cosas culturales de la época y ahí aprender cosas, con muchísimas
imágenes de la época, muy visual.» Delegar o hacerlo a mano. Que se vea en la ciudad qué cambia cada ley.

## El bucle (12 estaciones, 264–262 a.C., como en EV7)
1. **Consejo del año** (cada primavera: estaciones 1, 5 y 9). Tres consejeros, cada uno con cara y bando:
   - **Edil** (ciudad: Foro, granjas, mercado, muelle) — de los Mercaderes.
   - **Cónsul** (guerra: Campo de Marte, muralla, legiones) — de los Militares.
   - **Pontífice** (templo, saberes, fiestas y ritos) — de los Terratenientes.
   Cada consejero propone 3 encargos de su área («Mercado a nivel 2», «Una legión más», «Aprender el corvus»), con lo que da
   y lo que cuesta. Tú eliges hasta **3 encargos** para el año: es el **plan del año**.
2. **Cargos: delegado o a mano**, un interruptor por consejero (se puede cambiar en cualquier momento).
   - Delegado: al terminar cada estación, el consejero empieza solo las obras de SU parte del plan, por orden, si hay oro,
     guardando una reserva (p. ej. 30 oro). Cómodo, pero algo más caro o lento (licencia de juego; que valga la pena delegar
     pero no sea siempre lo mejor) y con su sesgo de bando (el Cónsul, si sobra oro, recluta).
   - A mano: tú tocas el edificio en la ciudad y pulsas «Mejorar»; empieza ya y pagas tú.
   Cumplir o no el plan del año lo juzga el Senado.
3. **La ciudad se toca.** Cada edificio abre una ficha: nombre, nivel (0–3), qué produce ahora y en el siguiente nivel, quién
   lo lleva (consejero y si está delegado), qué falta para mejorar y el botón «Mejorar (N oro)».
4. **Senado cada estación** (lo central, donde converge todo):
   a. **Juicio**: el Senado te juzga en voz alta: plebe contenta o no, grano, revuelta, plan del año (en marcha, cumplido,
      abandonado), promesas cumplidas o rotas, banquetes que molestaron a otros bandos. Da o quita favor. Pocas líneas, con
      ▲/▼ y en llano.
   b. **Cuestión de Estado**: tres leyes (guerra, impuestos, grano, saberes, pasar de edad, levas…). Las obras ya NO se votan.
      Se conservan tratos (oro o promesa), recuento senador a senador y veto del tribuno (lo que mejor funcionó en EV7).
   c. **Cada ley dice en llano qué cambia en la ciudad** («Llega una legión al Campo de Marte: +12 de fuerza; cuesta 4 oro y 4 de
      grano cada estación») y lleva el id del sitio del dibujo al que afecta. Al aprobarse, la ciudad lo señala (antes → después,
      con un aro y una etiqueta sobre el sitio) en la vista de la ciudad.
5. **Actos de la estación** (uno por estación, opcional; se hacen en la ciudad):
   - **Banquete** con un bando (intriga): cuesta oro; ese bando te quiere más (dudosos a favor en la próxima votación), los otros
     se enteran (un poco de humor menos); a veces una confidencia (pista de qué ley traerá el Senado o un senador que se pasa).
   - **Juegos**: en 264 a.C., primeros combates de gladiadores en el Foro Boario (Valerio Máximo 2.4.7) y carreras en el Circo
     Máximo (Livio 1.35). Plebe sube, cuesta oro. NO hay Coliseo (es del 80 d.C.).
   - **Rito** en el templo (sacrificio, auspicios): favor y plebe, poco oro.
   Cada acto muestra una escena ilustrada y **«Aprendes»**: un dato de la época con su fuente y una **imagen real de museo** con
   su crédito (carpeta `imagenes/`, `imagenes/creditos.json`).
6. Final como en EV7 (golpe de Cartago al acabar; siete finales). Revuelta: plebe muy baja dos estaciones seguidas → pierdes.

## Edificios: siete, niveles 0–3 (`e.edif = {foro, granja, mercado, muelle, cuartel, templo, muralla}`)
- Empieza: foro 1, granja 1, mercado 1, cuartel 1, muralla 1, templo 0, muelle 0.
- **Ningún edificio pasa del nivel del Foro.** El Foro sube con oro y su nivel 3 pide la Edad II.
- El nivel 3 de cada edificio pide un saber de su rama. Cada nivel cuesta oro (a veces grano) y tarda 1–2 estaciones.
- Cada nivel produce algo visible y medible: granja → grano; mercado → oro; muelle → oro y grano (abre saberes del mar);
  cuartel → tope de legiones y entrenamiento; templo → plebe; muralla → fuerza; Foro → tope de los demás y escaños/favor.
- Los escaños de cada bando siguen saliendo de la ciudad (como en EV7).
- Fuente y dictamen por edificio como en EV7 (skill `historia`; lo inventado para jugar, «licencia de juego»). En 264 a.C.:
  toba y terracota, madera; mármol casi nada (llega tras 146 a.C.).

## Arte (pedido: «mucho más arte», «artísticamente precioso»)
Ciudad en SVG propio por capas, cada edificio con 3 aspectos claramente distintos, tocable (`data-edif="<id>"`), con marcas de
cambio. Escenas: consejo del año, banquete (triclinio), juegos, rito, juicio del Senado. Imágenes reales: solo dominio público o
licencia libre compatible con CC BY-SA, con autor, licencia y enlace.

## Restos de EV7 (P166) que se resuelven aquí
Final y Edad II más vistosos en la ciudad; caballo del triunfo mejor; los «?» de los tres jefes del hemiciclo; promesas abiertas
no se cobran si pierdes antes de tiempo; el robot «cabeza» no debe perder por hambre.

## Hecho si
El usuario juega diez estaciones en el móvil (390×844), elige un plan del año, delega un cargo y mejora algo a mano, y ve en la
ciudad qué cambió por cada ley. `prueba.mjs` con robots pasa: nada < azar < cabeza (y «delega todo» queda entre azar y cabeza).
