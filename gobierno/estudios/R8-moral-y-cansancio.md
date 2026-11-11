# R8 · Moral y cansancio (Total War: Rome II, 2013)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Qué sube y baja la moral, cómo se contagia el pánico entre vecinos, qué hace el cansancio y qué pasa con el flanco, la retaguardia y el rally?

## 2. Observación
1. La moral baja con fuego intenso, combate largo y al ver huir a aliados. Fuente: [guía Gamepressure](https://www.gamepressure.com/totalwarromeii/mechanics/zd5798). Un análisis añade bajas de la unidad y del ejército, ritmo de pérdidas, cansancio y falta de amigos cerca: [ACOUP](https://acoup.blog/2022/07/01/collections-total-generalship-commanding-pre-modern-armies-part-iiic-morale-and-cohesion/).
2. El pánico se contagia: artillería, emboscadas o la muerte de una unidad clave pueden extenderlo. La unidad a punto de romper muestra un estandarte blanco parpadeante (misma guía Gamepressure). Cifra de contagio en Rome II: sin confirmar. (Un foro habla de hasta -12 por vecinos huyendo, pero es de Medieval II: [foro](https://forums.totalwar.org/wiki/index.php/MTW_Morale).)
3. Flanco y retaguardia: las guías dicen que bajan la moral y provocan huidas ([Ludo.guide](https://www.ludo.guide/guide/total-war-rome-ii/flanks)). Hay quien lo discute: [Steam](https://steamcommunity.com/app/325610/discussions/0/458605613413747242/?ctp=4) dice que en Rome II la caballería castigaba flancos casi sin coste y un mod afirma que el original no tiene castigo de flanco. Sin confirmar.
4. Cansancio: baja moral y combate (ACOUP lo lista como factor). Niveles y números exactos: sin confirmar.
5. Si cae el general mientras hay unidades huyendo, quedan «quebradas»: ya no se pueden reagrupar. Fuente oficial: [manual](https://r2encv2.totalwar.com/en/manual/single-player/0087_enc_page_battle_play_phase_conflict_morale/index.html).
6. El general presente y las tropas de élite elevan la moral (mismo manual). El «rally» existe como habilidad del general ([Gamepressure](https://www.gamepressure.com/totalwarromeii/leader/z45726)).

## 3. Por qué funciona
El jugador lee el campo sin números: un estandarte parpadea, algo va a ceder. Rompes la línea del rival con un golpe de flanco, no matando a todos. Y el miedo avisa: puedes acudir antes de que sea tarde.

## 4. Traducción a AQVILA
Ya existen `mor`, `fat`, `flank` y `rout` en `js/battle.js`. Falta el contagio.
- **Contagio**: en la ejecución, un regimiento que rompe resta un poco de moral a los amigos a menos de ~X m (X sale de pruebas, no de la fuente). Lo ven más lejos los que van sin reserva detrás. Lógica en `js/battle.js`.
- **Aviso en pantalla (844×390)**: sobre el estandarte, anillo que se vuelve ámbar y luego rojo parpadeante cuando está a punto de ceder. En `js/gfx/battle3d.js`. Sin texto ni números.
- **Cansancio**: dos estados visibles (fresco, cansado) con icono; en la ronda de plan se ve quién necesita relevo (encaja con N5).
- **Flanco**: el golpe a la moral se aplica al inicio del choque por flanco o espalda, una vez por regimiento y ronda.
- **Rally**: entre rondas, un regimiento en fuga puede reagruparse si hay un general cerca (ver R10). Quien huyó con el general muerto, no.
- **Maqueta**: bastan anillos de color y un regimiento que contagia a su vecino.

## 5. Historia (280–146 a.C.)
- **Histórico (por cotejar)**: Cannas 216, el cerco de las alas rompe la moral romana, no su número (Polibio III 115-117). Zama 202, el miedo de los elefantes se contagia a la línea cartaginesa (Polibio XV 12). Tres líneas romanas que se relevan para que los cansados no contagien al resto (Polibio VI 21-23).
- **Licencia de juego**: radio y número del contagio, niveles de cansancio, anillos de colores.

## 6. Coste y riesgo
0,7–1,0 M. Riesgo: tocar el equilibrio del bot de pruebas (hoy gana 8 de 10); cascadas de huida que acaben la batalla en dos rondas (hay que poner tope). Se ve en la captura.

## 7. Versión mínima
Contagio de moral a vecinos cercanos y anillo de color en el estandarte. Nada más.
