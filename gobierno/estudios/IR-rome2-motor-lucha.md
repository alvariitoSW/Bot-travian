# IR · Cómo lucha y cómo se manda en Rome II, y qué hacemos con ello (26/11/2026)

Pedido del usuario (crítica 8 de BT1), literal: «el menú de abajo hay que cambiarlo entero, no sirve, luego en motor de lucha hay que
reformularlo y enfocarlo a ingenieria-reversa con el del rome 2 total war».
Skill `ingenieria-reversa`: de Rome II solo **cómo se comporta**. Nada de código, arte, textos, nombres ni su interfaz tal cual.
**Qué se pudo leer**: solo los resúmenes del buscador [B]. Las páginas no se abrieron: la red de la sesión no llega a totalwar.com,
gamepressure.com, gamenguides.com ni feralinteractive.com. Lo que viene de BG1 o GM32 va marcado [C]; lo de memoria, [M]. Ningún
número está comprobado en el juego: son **órdenes de magnitud** para arrancar el ajuste, no cifras que copiar.

## 1. Las preguntas
¿Cómo decide Rome II quién gana el cuerpo a cuerpo? ¿Y cómo manda el jugador desde la barra de abajo?

## 2. Observación: cómo lucha
| Tema | Cómo se comporta | Fuente |
|---|---|---|
| **Tirada de golpe** | Cada golpe es una tirada: acierto de base de un 30–40 %, más el ataque del que pega, menos la defensa del que para. En la saga hermana, con topes de ~8 % y ~90 % | [B] guía de gamenguides; post oficial «Feature Focus: Damage» (de Warhammer) |
| **Daño en dos partes** | Daño normal, que la armadura frena, y **daño perforante**, que la ignora. Por eso hay tropas «abrelatas» | [C] BG1 §1.4; [B] mismo post |
| **Emparejamiento** | Los hombres se buscan por parejas. A veces se lanza un **duelo animado** de dos (en el juego base, un 35 % de las veces según un mod; nunca entre formaciones cerradas). Los jugadores se quejaron de que **los duelos alargan la batalla** | [B] avance de PC Gamer 2012; descripción de un mod en Steam |
| **Carga** | Un bono de ataque y daño **solo al llegar**, que **se apaga en ~10–13 s**. De ahí el ir y volver de la caballería. Cuesta abajo, más; contra picas de frente, se mata sola | [B] post oficial (13 s, juego sin nombrar); [C] BG1 |
| **Masa y derribo** | Cada hombre tiene masa: si el que carga pesa más que el que recibe, lo **tumba** y se abre hueco. Un escudo o una pica bien plantada lo frena | [M]; [B] un mod de Rome II afina «empujones» y derribos |
| **Falange** | Va más lenta pero **cuesta más darle**, y **aguanta mejor la carga**. Por delante no se entra: varias filas de picas pegan. Gira mal; flanco y espalda, débiles | [B] manual oficial (habilidades); [C] BG1 [V] |
| **Muro de escudos, testudo** | Más defensa a cambio de velocidad. El testudo frena flechas, pero no del todo (los jugadores se quejan de que entra alguna) | [B] manual; foros de Steam |
| **Escudo contra proyectiles** | Cada escudo tiene su % de parar flechas (un mod da 50 % al scutum), **solo de frente y por la izquierda** | [B] mod y foros de Steam; [C] BG1 |
| **Cansancio** | Por escalones, de fresca a agotada (cinco o seis). Lo suben correr, luchar, la formación cerrada y el calor; agotada pega menos, corre menos y huye antes | [B] guía de ludo.guide; [M] escalones |
| **Moral** | Barra por unidad: verde; **amarilla** (algo la asusta); **roja, flaquea**; rota, **huye**. Se rehace si el general está cerca y usa «reagrupar»; si está **deshecha**, ya no vuelve. La bajan las bajas rápidas, el flanco y **sobre todo la espalda**, el cansancio, el enemigo que da miedo, verse superada, **ver huir a los vecinos** y perder al general. La suben el general cerca, la veteranía y los flancos cubiertos | [B] manual oficial (moral); [C] BG1 |
| **Cadena de huidas** | Un parche dobló el contagio. Un mod cuenta unos −9 de moral con tres vecinos huyendo | [C] BG1 (parche 4); [B] mod |
| **Proyectiles** | Munición contada (barra marrón en la tarjeta). Al acabarse, solo queda luchar. **Fuego amigo** si se tira a una melé | [B] Total War Academy; [M] fuego amigo |

## 2 bis. Observación: cómo se manda
- **Tarjetas abajo**, una por unidad: retrato, **barras verdes = hombres**, galones de veteranía y **barra marrón de munición**. La moral y
  el cansancio se ven en el estandarte y en el panel al elegir [B] Academy. Las tarjetas cambian de dibujo según la cultura [B] PC Gamer.
- **Botones de la unidad** sobre las tarjetas: correr o andar, alto, retirarse, y tres interruptores: **mantener posición**, **escaramuza**
  (los tiradores se apartan solos), **a discreción**. Además, dos o tres **formaciones o habilidades** propias, con precio: la falange frena,
  el látigo cansa [C] BG1 §1.3; [B] manual.
- **Arrastrar en el suelo dibuja la línea**: el largo da el ancho y, con él, el fondo [C] BG1 (vídeo oficial de la Academy).
- **Pausa con órdenes**, cámara lenta y dos velocidades rápidas [C] BG1.
- **En la tableta** (el *Rome* de 2004 llevado a iPad y móvil): pellizcar y girar para la cámara, **dibujar el camino con el dedo** (dicen
  que da más precisión que el ratón) y, después, **mantener sobre el destino** para mover. La prensa lo llama «algo enredoso» en batalla [B] Feral.

## 3. Por qué funciona
1. **Se gana haciendo huir, no matando**: la moral es el marcador, y sus causas son pocas y visibles (flanco, espalda, general, cansancio).
2. **Cada tropa son seis números** (ataque, defensa, armadura, daño, perforante, carga): se equilibra con una tabla y el jugador entiende
   «la espada gana a la lanza en la melé larga».
3. **La carga y el cansancio crean ritmo**: cargar, salir, guardar reserva.
4. **La tarjeta deja ver todo el ejército de un vistazo** sin buscar por el campo. El arrastre da forma a la línea con un gesto.
5. **Lo que no conviene copiar**: los duelos que alargan; la moral como cifra oculta (el jugador no sabe *por qué* huyen); veinte unidades con
   barra de botones de ratón. Con el dedo, la propia versión de tableta salió «enredosa».

## 4. Traducción a AQVILA
**Motor de lucha** (encaja en el diseño de Fable, `BT1-diseno-motor-fable.md` §2 y §5, sin cambiar su regla «los hombres son la verdad»):
| Idea de Rome II | En AQVILA | Archivo |
|---|---|---|
| Tirada ataque − defensa, daño + perforante | Cada tropa como **seis números** en una tabla. El golpe de cada hombre sigue en `combate.js` (arco del escudo, flanco ×1,35, espalda ×1,7, cansancio, ya hechos) pero el acierto sale de *base 35 % + ataque − defensa*, entre 8 % y 90 %. La defensa del escudo solo cuenta si el golpe entra por su arco | `js/batalla/formaciones.js` (números), `js/batalla/lucha.js` (sale de `js/combate.js`) |
| Emparejamiento sin duelos largos | Cada hombre en contacto tiene **un rival fijo** (el de enfrente). El que sobra se suma a un vecino: **dos contra uno es lo que hace mortal el flanco**. Nada de duelos que paran la batalla: el «duelo» es solo el ritmo armar–golpe–recuperar de Fable | `js/batalla/lucha.js` |
| Carga que decae, masa y derribo | Bono de carga que baja a cero en **10 s**. Masa por tropa (hoplita con aspis, pesado; peltasta, ligero): si la carga pesa más que el aguante del que recibe, este **cae o recula un paso** y se abre hueco. Contra lanzas o picas de frente y quietas, la carga se anula y el que carga sufre | `js/batalla/cuerpos.js` |
| Falange, muro, testudo | **Datos**, no reglas aparte: cuántas filas pegan (hoplita 2, sarisa 5), bono de defensa **solo de frente**, giro lento, más cansancio. El testudo, al llegar Roma | `js/batalla/formaciones.js` |
| Cansancio por escalones | El aliento de Fable sigue continuo por dentro, pero **se enseña en cinco palabras** (fresca, en marcha, sin aliento, cansada, agotada) y **cada escalón quita algo claro**: ataque, velocidad, moral | `js/batalla/lucha.js`, `moral.js` |
| Moral por unidad, con causas | **Cambio sobre Fable**: el miedo hombre a hombre se queda para *quién* se da la vuelta primero (se ve la ola desde atrás). Pero el bloque lleva **una moral que es la suma de causas a la vista**: bajas recientes, flanco, espalda, oficial cerca, cansancio, superado, vecinos huyendo. Cuatro estados: **firme · flaquea · huye · se rehace**. Así el jugador sabe *por qué* | `js/batalla/moral.js` |
| Proyectiles | Munición por tropa; el escudo de frente para su %; **fuego amigo** al tirar a una melé, con aviso al elegir el blanco (crítica 6) | `js/batalla/proyectiles.js` |

**Tú en la fila** (lo de Ryse): tu hombre es uno más con los mismos seis números. Tu duelo no es una tirada: es tu toque a tiempo (Fable §4).
Matar o caer tú es una **causa de moral** más, y se ve en tu bloque.

**El mando de abajo**: sustituye la barra de seis botones redondos (`BARRA` de `js/mando-varios.js`, pintada por `gobierno/maquetas/bloque/hud.js`).
Batalla en horizontal (844 × 390). Tres maneras:

**A · Tarjetas finas y abanico al pulgar (recomendada)**
```
┌────────────────────────────────────────────────────────────┐
│ ⏸  1× 2×                                        [mapa] ⚔ │  ⏸ pausa (se ordena parado) · ⚔ bajar a la fila
│                                                            │
│              el campo: más de tres cuartos                 │
│                                       ╭ Correr             │  abanico: solo las 3–4 órdenes de la
│                                       ├ Alto               │  tropa elegida, al alcance del pulgar
│                                       ├ Bajar lanzas       │  derecho; «⋯» guarda Guardia,
│                                       ╰ ⋯                  │  Escaramuza y A discreción
│ [▲Hoplitas ▮▮▮▯ ●] [◆Peltastas ▮▮ ● ⁞⁞] [♞Jinetes ▮▮▮ ●]   │  tarjetas de 44 px
└────────────────────────────────────────────────────────────┘
```
- **Tarjeta**: sello de la tropa, barra de hombres, punto de moral (verde; ámbar = flaquea; rojo que late = huye), raya fina de cansancio,
  munición si tira (⁞⁞). Toque: elegir. Doble toque: la cámara va allí. Mantener: elegir varias.
- **En el campo**: toque en el suelo = ir; en un enemigo = atacar; **arrastrar desde la tropa = dibujar el frente** (`js/bloque.js`); doble
  toque en el destino = correr. El estandarte también elige.
- Al flaquear, la tarjeta enseña **la causa en un icono** (flecha por la espalda, calavera, gota de sudor).

**B · Solo campo y tres botones**: sin tarjetas. Se elige tocando el estandarte. Abajo a la derecha, tres botones: Pausa, Órdenes (abre el
abanico) y Fila. Gana pantalla, pero no deja ver el ejército de un vistazo ni a quién le va mal. Vale si hay dos o tres bloques; con cinco, no.

**C · Rueda al mantener**: mantener el dedo sobre una tropa abre una rueda de cuatro órdenes alrededor del dedo; soltar encima la da. Nada
fijo en pantalla. Es rápido cuando se aprende, pero no se descubre solo, tapa justo lo que miras y choca con el «mantener» del arrastre.

**En la fila (vista del oficial)**, con cualquiera de las tres: sin tarjetas. Gestos del duelo en el centro (Fable §4). A la derecha, **tres
botones grandes** de tu muro: Empujar, Aguantar, Paso atrás; el grito, deslizando hacia arriba con dos dedos. Arriba, **una sola línea** con el
estado de tu bloque y su causa («Flaquea: os entran por la derecha»). Nada de franjas laterales ni textos encima de las barras (crítica 3 y 5).

**Recomiendo A**: es lo que el jugador de Rome II espera y lo único que deja leer la moral de todo el ejército. Ojo: en K10 al usuario **no le
gustaron las tarjetas porque se comían la pantalla**. Por eso aquí miden 44 px (un 11 % del alto), **sin retrato ni texto largo**, y se esconden
con un toque en ⏬. Si aun así le sobran, se cae a B.
Archivos: `js/ui-batalla/tarjetas.js`, `abanico.js` y `fila.js` (nuevos). Las órdenes de cada tropa, como datos en `js/batalla/formaciones.js`.
Se retiran `BARRA`, `HUECOS` y `NO_HAY` de `js/mando-varios.js`. Se aprovechan los gestos de `maquetas/bloque/dedos.js` y los iconos de `ICONO`.

## 5. Coste y riesgo
- **Motor**: no es una fase aparte. Entra en los hitos 2 y 3 de Fable. Los seis números, la carga y la moral con causas suman **una sesión (S)**.
- **Mando A**: maqueta con capturas a 844 × 390, elección del usuario y construcción: **dos sesiones (M)**, más el examen de jugabilidad de
  otra sesión. La vista de fila: una (S), con el hito 4.
- **Riesgos**: (1) la tirada al azar puede hacer **sentir aleatorio** tu duelo; por eso tu duelo no tira dados. (2) Volver a equilibrar: con
  seis números por tropa se ajusta en tabla y con el bot, pero llevará vueltas. (3) Las tarjetas pueden volver a parecer que tapan: se verá en
  la primera captura. (4) Nada se mide aquí en un móvil: la nota es la del usuario.

## 6. Versión mínima (lo que ya se nota al jugar)
En la maqueta de muro contra muro: **tres tarjetas finas con su punto de moral y la causa**, el **abanico de tres órdenes**, **arrastrar para el
frente** y **pausa**. En el motor: moral del bloque con causas y cuatro estados, **carga que se apaga en 10 s** y **falange fuerte solo de frente**.
Prueba: «cargo por la espalda y su tarjeta pasa a rojo con la flecha; lo veo huir desde atrás». Una sesión y media.

## Fuentes (resúmenes del buscador; páginas sin abrir: hay que permitir esos dominios para leerlas)
- Manual oficial de Rome II, moral: https://r2encv2.totalwar.com/en/manual/single-player/0087_enc_page_battle_play_phase_conflict_morale/index.html
- Manual oficial, habilidades (falange, muro de escudos): https://r2encv2.totalwar.com/en/manual/single-player/0085_enc_page_battle_play_phase_conflict_abilities
- Manual oficial, interfaz de batalla: https://r2encv2.totalwar.com/en/manual/single-player/0092_enc_page_battle_play_interface/index.html
- Total War Academy, «Battle: What the UI is and Does»: https://academy.totalwar.com/battle-what-the-ui-is-and-does/
- Total War, «Feature Focus #2: Damage» (carga que decae, topes del acierto; es de Warhammer): https://totalwar.com/?p=19917
- Gamenguides, ataque y defensa en Rome II: https://www.gamenguides.com/how-melee-attack-and-defense-work-in-total-war-rome-ii
- Gamepressure, mecánicas de Rome II: https://www.gamepressure.com/totalwarromeii/mechanics/zd5798
- Ludo.guide, cansancio y moral en Rome II: https://www.ludo.guide/guide/total-war-rome-ii/fatigue
- PC Gamer, avance del motor de Rome II (duelos casados): https://www.pcgamer.com/total-war-rome-2-preview-every-detail-about-the-new-engine-naval-combat-multiplayer-and-mods
- Mod «More Matched Combat» (35 % de duelos en el juego base): https://catalogue.smods.ru/archives/175327
- Mod «Chain Routs and Morale Tweaks» (contagio de la huida): https://catalogue.smods.ru/archives/252097
- Foro de Steam, escudos y testudo (valores de mods): https://steamcommunity.com/workshop/filedetails/discussion/2490681903/3109152828471517782
- Feral Interactive, mandos táctiles de *Rome* en iPad: https://feralinteractive.com/en/news/685
- De casa: `BG1-estudio-rome2-batalla-grande.md` §1.3–1.5 y §2.6, `GM32`, `GM42`, `R22`, `BT1-diseno-motor-fable.md`, `BT1-informe-motor-fable.md`, crítica 8.

Propuesta P-BT1-IR: el motor de BT1 adopta de Rome II seis números por tropa (tirada ataque − defensa, daño perforante), la carga que se apaga en 10 s,
la falange fuerte solo de frente y una moral de bloque con causas a la vista. La barra de seis botones se cambia por tarjetas finas y un abanico al pulgar (A).
