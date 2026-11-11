# N1b · Guerra ampliada: estrategia por rondas que se ve como un juego de hoy

Amplía el diseño N1 (`N1-guerra-nueva.md`). Pedido del usuario, 11/11/2026: «me gusta el concepto… pero es muy
simple, hay que ampliar más el modelo de guerra con juegos de ordenador y hacer ingeniería reversa». Y al ver la
maqueta 2D: «muy simplona… esto parece Windows XP 98».

Dos fallos a la vez: **poca profundidad** y **mal aspecto**. Este diseño arregla los dos.
Se queda lo que gustó: **planeas con todo parado, miras unos 20 segundos, vuelves a planear**.

Estudios de esta sesión (una mecánica cada uno, con fuentes; ideas, nunca código ni arte):
| Estudio | Juego mirado | Qué nos da |
|---|---|---|
| R8 Moral y cansancio | Total War: Rome II | El miedo se contagia; aviso en el estandarte |
| R9 Cohesión e impacto | Field of Glory II | Escalones de orden; el choque y la melé son distintos |
| R10 General y mando | Rome II, FoG II, Commands & Colors | Precedentes para limitar órdenes; radio de mando |
| R11 Turnos simultáneos | Frozen Synapse, Combat Mission | Vista previa honesta; «ver otra vez» |
| R12 Enemigo que reacciona | Ultimate General | El jugador dice qué; el regimiento decide cómo; IA con gestos legibles |
| R13 Comida y desgaste | Imperator: Rome, Hegemony | Forraje por región y estación; colores antes de marchar |
| R14 Asedios | Imperator, Rome II, Hegemony | Tiempo contra riesgo: esperar, construir o asaltar |

Maqueta: capturas de la **vista 3D real del juego** con la interfaz nueva encima
(`gobierno/capturas-tarea/N1b-*.jpg`, script `gobierno/maquetas/guerra-ampliada.mjs`). Sin tocar el juego.

## 1. La idea en cinco frases
- Rondas: plan en pausa, unos 20 s de ejecución para los dos, y vuelta a planear. Sin prisa ni reloj.
- **Tú dices qué** (adónde, contra quién, con qué condición); **el regimiento decide cómo** (alinearse, cerrar huecos,
  cambiar de blanco si el suyo huye). Así basta con pocas órdenes.
- Cada regimiento tiene un **estado que se lee de un vistazo**: firme, vacilante, desordenado o huye; fresco, cansado
  o agotado. Gana quien rompe el orden del otro, no quien mata más.
- El enemigo **piensa y se le nota**: tiene un plan y cada ronda hace un gesto que puedes leer y castigar.
- La batalla empieza en el mapa: comida, forraje, general, dónde y cuándo combates, y si el enemigo te ha visto.

## 2. La batalla: reglas nuevas
**2.1 Estado de cada regimiento (R8, R9).** Sale de la moral y el cansancio que el motor ya calcula; no hay número nuevo.
- Escalones: **Firme → Vacilante → Desordenado → Huye**. Bajan con las pérdidas de la ronda, un golpe por flanco o
  espalda, ver huir a un vecino o perder al general. Desordenado pega y aguanta peor.
- Cansancio: **Fresco, Cansado, Agotado**. Correr y cargar cansa; parar descansa. Agotado no puede cargar.
- **El miedo se contagia**: un regimiento que huye baja un escalón a los vecinos que no tengan reserva detrás. Con tope:
  un solo contagio por ronda, para que no se hunda toda la línea de golpe.
- **Reagruparse**: entre rondas, quien huye vuelve a Desordenado si el general está cerca y vivo. Sin tiradas de dado:
  regla fija, para que el jugador entienda por qué.

**2.2 Choque y melé (R9).** La ejecución tiene dos tiempos. Los primeros segundos son el **choque**: carga, jabalinas
(pila) a quemarropa, elefantes; puede bajar un escalón de golpe. Después, la **melé**: desgaste lento. Por eso
importa quién carga a quién, y cuándo.
- Caballería: fuerte en el choque, floja en melé larga. Pesada romana: el pilum antes del choque. Falange: imbatible
  de frente, frágil de lado. Ligeros: hostigar y retirarse.
- Terreno: colina da choque; bosque frena y tapa proyectiles, y quita choque a caballería y pesados; río desordena al
  que lo cruza (nuevo).

**2.3 Plan con vista previa (R11).**
- **Sombra**: al dar una orden ves dónde acabará el regimiento, simulada con el enemigo quieto. Aviso honesto: «el
  enemigo puede moverse».
- **Prever choque**: un toque y ves qué pasaría si chocan ahora (quién gana el choque, de forma aproximada).
- **Una condición por orden**: «si te cargan, aguanta», «si huyen, no persigas», «espera 10 s y avanza».
- **Ver otra vez**: tras cada ronda puedes volver a mirarla. Es barato: la simulación es fija con su semilla.

**2.4 Mando y general (R10).** El general es una pieza en el campo con su escolta.
- **Radio de mando**: un círculo dorado en el suelo. Dentro, las órdenes llegan al momento. Fuera, llegan **con
  retraso** (se ve como flecha punteada) y el reagrupar no funciona.
- **Puntos de mando**: ver la pregunta del §7. Propuesta: 4 a 6 por ronda según el general.
- **Habilidades = cartas de táctica**: tres por batalla según el general (arenga, paso doble, retirada fingida,
  formación cerrada). Un general veterano tiene mejores cartas.
- **Si cae el general**: menos puntos, nadie se reagrupa y un golpe de moral a los que lo ven caer.

**2.5 Formaciones y relevos.** Tres líneas romanas que se relevan: los hastati cansados pasan por los huecos y entran
los principes (Livio VIII 8, por cotejar). Formaciones: testudo (aguanta proyectiles, lenta), cuña (choque), orbe
(rodeada, aguanta), falange para los griegos. Cada una con lo que gana y lo que pierde, escrito en una línea.

**2.6 Un enemigo que se nota que piensa (R12).**
- Antes de empezar elige un plan según tropas y terreno: centro fuerte, envolver por las alas, defender la colina,
  emboscar, hostigar y huir.
- Cada ronda hace **un gesto visible**, con una línea de aviso: estira el ala, manda la reserva al punto débil, busca
  tu flanco con los jinetes, se repliega si va perdiendo.
- **Sin trampas**: ve lo mismo que tú y no recibe tropas de más. La dificultad es más cuidado, no más soldados.
  Reacciona con una ronda de retraso, como un general de verdad, para que se le pueda engañar.
- **Generales con carácter**: Aníbal, astuto (emboscadas, retirada fingida); un caudillo galo, impetuoso (carga
  siempre); un rey helenístico, prudente (falange y elefantes en el centro).

**2.7 Antes y después.** Despliegue en tu zona, con emboscada en bosque (P72). Después: persecución (la caballería
que queda convierte huidos en bajas), heridos que vuelven y veteranía de los regimientos que sobreviven.

**2.8 Campos amplios y relieve** (pedido del usuario, 11/11: «darle una vuelta al relieve, campos de batalla mucho
más amplios»).
- Hoy el campo mide unos 600 m y casi todo es llano. Propuesta: **dos o tres veces más ancho**, con sitio para
  rodear, esconderse y elegir dónde chocar.
- **Relieve variado**: lomas suaves, un cerro que domina, una cresta que tapa la vista, un valle, un río con vados
  (cruzarlo desordena), pantano (frena a todos), bosque claro y bosque denso, una granja o un pueblo, un camino.
- **El campo sale del sitio del mapa** donde chocan los ejércitos: la llanura de Apulia no es como los montes del
  Samnio. Cada región tiene dos o tres campos posibles.
- **Pasos estrechos**: en un desfiladero o junto a un río, el ejército grande no cabe en la línea y su número vale
  menos (idea de las Termópilas y del lago Trasimeno).
- Con un campo grande hace falta un **minimapa** y saltos de cámara a cada ala.
- **De la maqueta de Estandartes** (concurso K4): la moral se lee en la tela del estandarte, los corchetes dorados de
  cada ala y la cenefa de color bajo el regimiento. L2 ya llevó parte al juego; el resto entra en N3.
- Límite honrado: más campo pinta más cosas. Se apoya en los niveles de detalle (D2), pero en un móvil real **no está
  medido**.

**2.9 Equilibrio: que no gane siempre el que tiene más tropas** (pedido del usuario, 11/11).
- **Ancho de frente**: solo cabe en la línea un número de regimientos; el resto espera de reserva. En un paso
  estrecho, el pequeño aguanta al grande.
- **Se gana rompiendo, no matando**: la batalla acaba cuando un ejército huye. Un ejército grande y bisoño, con el
  general muerto o rodeado, se deshace antes que uno pequeño y veterano.
- **Calidad**: veteranía de los regimientos, rasgos del general y cartas pesan tanto como el número. Las levas recién
  reclutadas empiezan en Vacilante.
- **Un ejército grande cuesta**: come más forraje del que da la región (R13), marcha más lento y paga más cada mes.
  Juntar tropas sin más te mata de hambre antes de combatir.
- **Objetivos**: no todas las batallas son «mátalos a todos». Aguantar un vado tres rondas hasta que llegue ayuda,
  salvar el bagaje, tomar el paso, escapar con el general vivo.
- **Victorias caras**: las bajas son de verdad en la campaña. Ganar perdiendo media legión (victoria pírrica, 280–279)
  deja la ciudad sin hombres.
- **Retirada en orden**: el pequeño puede retirarse antes de romperse y conservar el ejército.
- **Equilibrio medido**: el bot de pruebas juega cientos de batallas con ejércitos de distinto tamaño y calidad. Meta:
  con buen terreno y buen plan, un ejército de dos tercios gana a menudo; sin plan, el grande gana casi siempre.

## 3. El aspecto: que parezca un juego de hoy
Referencias de las que se toman **ideas** (nunca su arte): Total War (cámara baja que sigue el choque, estandartes
sobre cada regimiento), Ultimate General (flechas de orden pintadas en el suelo, mapa de mesa), Frozen Synapse (siluetas
del plan), Field of Glory II (fichas que se leen de un vistazo).
- **Siempre en 3D con los soldados de verdad** (modelos de 0 A.D. que ya tenemos). Se acaban los rectángulos.
- **Plan**: cámara alta, todo parado, un poco de color apagado. Encima: flechas curvas en el suelo, siluetas del
  final, círculo del general, intención enemiga en rojo tenue si tienes exploradores.
- **Ejecución**: la cámara baja sola al choque más importante y lo dice en una cinta («Mirando: choque del centro»).
  Polvo al cargar, jabalinas con arco, caídos que se quedan en el suelo, la línea que cede poco a poco.
- **Interfaz**: paneles de cristal oscuro con filete de bronce, letra Cinzel, iconos de línea propios (guía E1),
  estandartes pequeños con el escalón dibujado (borde entero, partido, bajado), sin barras ni números flotando.
- **Informe de ronda**: un panel corto «Lo que pasó» con 2 o 3 hechos y un consejo del lugarteniente.
- **Límite honrado**: un móvil con navegador y arte libre. Puede verse mucho mejor que hoy, no como Total War en un
  ordenador. Y la fluidez de la batalla grande en un móvil real **sigue sin medir**.

## 4. La campaña militar (el mapa)
**4.1 Ejércitos con general (N1).** Un ejército es una pieza con su general y sus regimientos. El mapa va por
estaciones (I2). Posturas: marcha, marcha forzada (llegas antes y cansado), campamento (defiendes mejor, P73),
emboscada (P72), forrajear.

**4.2 Comida y forraje (R13).**
- Cada región da un **forraje por estación**: mucho en cosecha, poco en invierno.
- Si juntas más soldados de los que la región alimenta, hay **hambre**: baja la moral y hay deserciones.
- **Antes de marchar** ves cada región en verde, ámbar o rojo. Decides con la información delante.
- El **bagaje** lleva grano para unas estaciones; si te lo cogen en marcha, pierdes la mitad.
- Forrajear da comida pero frena; saquear deja la región vacía unas estaciones.

**4.3 Asedios (R14).** Tiempo contra riesgo.
- La ciudad tiene **aguante** en estaciones (su grano entre lo que come). Con puerto abierto, el doble.
- Tres decisiones: **esperar** (barato, pero tú también comes y puede llegar socorro), **construir máquinas** (unas
  estaciones; bajan la muralla por niveles) o **asaltar ya** (batalla con muros, rápida y sangrienta).
- **Socorro**: un ejército que llega rompe el cerco o da batalla al sitiador.
- La batalla solo recibe «muralla y brecha»; no sabe nada del grano.

**4.4 Exploración.** Del enemigo solo ves el tamaño aproximado, salvo con jinetes exploradores cerca. Con ellos ves
también su intención en la batalla.

## 5. Qué se tira y qué se guarda
- **Se rehace** lo que se toca y se ve: rondas, órdenes, cámara, interfaz, enemigo, ejércitos en el mapa.
- **Se guarda** el motor: moral, cansancio, flanqueo, papeles de tropa y terreno ya funcionan y están probados.
- La regla de la casa sigue: la batalla recibe dos ejércitos y su contexto (terreno, tiempo, general, cartas,
  muralla) y devuelve bajas. No sabe de economía.

## 6. Carril N reescrito (sustituye N2 a N10 de N1)
| Tarea | Qué se nota al jugar | M aprox. |
|---|---|---|
| N2 Rondas y vista previa | Plan en pausa, 20 s de ejecución, sombras, una condición, «ver otra vez» | 1,5 |
| N3 Interfaz nueva de batalla | La de las capturas N1b: estandartes con estado, flechas en el suelo, informe de ronda | 1,2 |
| N4 Estados, choque y contagio | Firme a Huye, cansancio visible, el miedo se contagia, choque y melé | 1,2 |
| N5 General y mando | Radio de mando, órdenes con retraso, cartas del general, muerte del general | 1,0 |
| N6 Enemigo que piensa | Cinco planes, un gesto visible por ronda, generales con carácter, 3 dificultades | 1,5 |
| N7 Relevos y formaciones | Tres líneas que se relevan; testudo, cuña, orbe, falange | 1,2 |
| N8 Espectáculo | Cámara que sigue el choque, polvo, jabalinas, caídos, luz y tiempo | 1,5 |
| N9 Ejércitos con general | Piezas con posturas en el mapa por estaciones (pide I2) | 1,5 |
| N10 Comida y forraje | Colores al marchar, hambre, bagaje, forrajear y saquear | 1,0 |
| N11 Asedios | Aguante, máquinas, brecha, asalto y socorro | 1,5 |
| N12 Exploración y emboscadas | Niebla, exploradores, intención enemiga, P72 | 1,2 |
| N13 Después de la batalla | Persecución, heridos, veteranía | 0,8 |
| N14 Campos amplios y relieve | Campo dos o tres veces más ancho, cerros, río con vados, pantano, pasos; el campo sale de la región; minimapa | 1,5 |
| N15 Equilibrio y objetivos | Ancho de frente, levas bisoñas, objetivos de batalla, bot que mide cientos de batallas | 1,2 |

**Total: unos 18 M, de quince a diecisiete sesiones** (N1 decía 12 M; sube por la interfaz y el aspecto, que N1 no
contaba aparte, por N4 y N13, y por los campos amplios y el equilibrio que pidió el usuario). Afinar números de batalla suele costar el doble de lo previsto: el riesgo es al alza.

**Orden recomendado**: N2 → N3 → N4 → N5 (cuatro sesiones: con eso la batalla ya juega y se ve distinta), después N14,
N6, N15, N7 y N8. N15 se repite al final: el equilibrio se ajusta cuando todo lo demás está. La campaña (N9 a N13) cuando I2 esté hecha.
**Absorbe**: L3, L1b, A1, A2, A6, A8b, P72 y P73.

## 7. Lo que decide el usuario
1. ¿Te convence el aspecto de las capturas N1b? Son la vista 3D de verdad con la interfaz nueva encima.
2. ¿Aprobamos el carril N entero (P74, unos 18 M) o solo el primer bloque (N2 a N5, unos 5 M)?
3. **Puntos de mando** (sigue sin contestar). Tres opciones:
   - **A. Puntos y radio** (recomendada): 4 a 6 órdenes por ronda; las que van fuera del radio del general llegan con
     retraso. Obliga a elegir, como en los juegos de cartas de mando (R10).
   - B. Solo radio: órdenes libres dentro del círculo; fuera, con retraso.
   - C. Libres: todas las órdenes que quieras, cada ronda.

## 8. Historia
- **Histórico** (por cotejar con la skill `historia`; citas de memoria): las tres líneas y el relevo (Livio VIII 8;
  Polibio VI 21–23); el pilum antes del choque (Polibio VI 23); el campamento de marcha (Polibio VI 27–42); Cannas,
  216, envolver por las alas (Polibio III 113–117); emboscadas del Trebia y Trasimeno (Polibio III 71–84); el forrajeo
  y el grano del ejército (Polibio VI 39); asedios de Lilibeo (250–241), Siracusa (213–211), Capua (211) y Cartago
  (149–146).
- **Licencia de juego**: las rondas, los puntos de mando, los escalones con nombre, el contagio con tope, las cartas,
  los colores del forraje y todos los números.
- Las cifras de los otros juegos que los estudios no pudieron cotejar van marcadas «sin confirmar» en cada estudio y
  no se usan: los números de AQVILA saldrán de nuestras pruebas.
