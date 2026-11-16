# R21 · Caballería que maniobra y elefantes temibles (ingeniería reversa, 16/11/2026)

Pedido del usuario tras probar la maqueta `guerra-relevo/` en su móvil: la caballería atraviesa a todos por el centro, cuando
debería maniobrar; y los elefantes, que deberían ser la unidad más temible, mueren con una carga cualquiera de jinetes.
Solo ideas de cómo se comportan otros juegos; nada de su código ni de su arte. Hecho de memoria, sin cotejar con guías ni vídeos.

## Pregunta
¿Cómo hacen los juegos de batallas antiguas para que la caballería tenga que maniobrar y para que los elefantes den miedo sin
ser invencibles?

## Qué hacen (y qué falla hoy en AQVILA)
| Mecánica | Batalla en tiempo real, tipo Total War | Táctico por turnos, tipo Field of Glory | AQVILA hoy |
|---|---|---|---|
| Por dónde va la caballería | Es una pieza con cuerpo: no cruza una línea formada; si se mete, se queda trabada y muere. Hay que rodear por fuera | Cada unidad controla las casillas de delante: no se pasa; para dar en el costado hay que estar ya colocado al lado | Pulsas el botón y aparece en el costado o la espalda de cualquier cuerpo, también del centro, pasando por encima de todos |
| Qué vale una carga | Mucho por la espalda o el costado de tropa trabada; casi nada de frente contra lanzas; hay que sacarla y volver a cargar | Igual: el golpe es al llegar; si se queda, pierde | Siempre el mismo golpe, da igual contra quién |
| Jinetes contra jinetes | Primero hay que ganar el duelo de caballería del ala; el que gana queda libre para caer sobre la infantería | Igual | Los tuyos «espantan» a los suyos sin lucha |
| Caballos y elefantes | Los caballos se asustan cerca de los elefantes: pelean peor y pueden huir | La caballería queda desordenada junto a elefantes | Los jinetes cargan a los elefantes y matan dos de un golpe |
| Cómo se para a un elefante | Jabalinas y proyectiles, abrirles calles, lanzas a pie firme. Si se asusta, se desboca y aplasta a quien pille, también a los suyos | Tropa ligera con jabalina; la infantería pesada sufre mucho de frente | Ya está: jabalinas, calles y lanzas clavadas. Pero además los hiere cualquier golpe |
| Cuánto aguanta | Pocos animales, cada uno con mucha vida; lo que cae es su ánimo | Unidad pequeña y muy fuerte al choque | 10 bestias; con 5 heridas se desbocan. La carga de jinetes quita 2 de golpe |

## Por qué funciona
- El jinete que **no puede atravesar** obliga a pensar: qué ala gano, cuándo la suelto, por dónde rodea. Es la decisión de Cannas y de Zama.
- El elefante es un **problema con solución**: da miedo, pero quien trae vélites o abre calles lo resuelve. Si lo mata cualquiera, no da miedo; si no lo mata nadie, es injusto.

## Traducción a AQVILA (sin botones nuevos)
1. **Los jinetes viven en las alas y rodean por fuera.** El botón Caballería solo deja elegir un ala. Se les ve salir por el extremo, dar la vuelta por detrás del enemigo y entrar por la espalda. Tarda (unos 8 s), y se ve venir.
2. **Al centro solo se llega por detrás**: si mandas la caballería al centro, rodea por el ala más despejada y tarda el doble. Si las dos alas enemigas siguen enteras y con jinetes, el botón dice «no hay paso».
3. **Primero, los jinetes enemigos.** Si en esa ala hay caballería suya, hay duelo de jinetes; quien lo gana queda libre. Mandar bien aquí (cargar cuando los suyos ya están gastados) cuenta para el ánimo de la legión.
4. **La carga vale por dónde entra y contra quién**: mucho en la espalda de tropa trabada; poco de costado contra lanzas; nada de frente.
5. **Los caballos no cargan elefantes.** El botón lo dice («los caballos no se acercan a las bestias») y, si los elefantes cargan cerca de tus jinetes, estos se espantan un rato.
6. **Elefantes temibles**: se cuentan por bestia, y solo los hieren de verdad las jabalinas, las flechas y las lanzas clavadas; la espada de frente apenas. Su carga desordena y asusta más que ahora. Siguen pasando de largo si les abres calles, y siguen desbocándose contra los suyos cuando caen bastantes.

Viviría en las reglas de la maqueta (`gobierno/maquetas/guerra-cuerpo/reglas.js` o la copia de GM7) y en su vista; nada en `js/` hasta GM5.

## Historia (dictamen: histórico, con licencias)
- Los caballos que no conocen a los elefantes se espantan: Heraclea, 280 a.C. (Plutarco, *Pirro* 17). *Histórico.*
- La caballería decide cuando gana su ala y vuelve sobre la espalda enemiga: Cannas (Polibio 3.115–116) y Zama (Polibio 15.12–14). *Histórico.*
- Contra elefantes: vélites y calles en Zama (Polibio 15.9 y 15.12); se revuelven contra los suyos (Livio 30.33). *Histórico.*
- Licencia de juego: los tiempos, y que el jugador elija el ala con un botón. Citas de memoria, sin cotejar.

## Enfoque Rome II (decisión del usuario, 16/11: «hazlo todo enfocado en parecernos a un Rome 2 Total War»)
Se imita **cómo se comporta**, no su código, su arte ni su interfaz. De memoria, sin cotejar. Lo que se toma, traducido a nuestras reglas:
| En Rome II | En AQVILA (GM9) |
|---|---|
| Cada tropa tiene **peso**: el pesado empuja al ligero y lo atraviesa; el ligero rebota | Un número de peso por tropa: elefante, jinete pesado, infantería pesada, ligera. Decide quién cede terreno en el choque |
| La carga necesita **carrera** y pega solo al llegar | Los jinetes necesitan sitio para arrancar: desde lejos pegan entero; pegados al enemigo, casi nada |
| El jinete que **se queda** en la melé pierde: hay que sacarlo y volver a cargar | Tras el golpe se retiran solos y se rehacen; si el enemigo tiene lanzas a pie firme, salen mal parados |
| De frente contra lanzas o picas, la caballería se estrella | Ya está en parte (lanzas clavadas); se extiende a los jinetes |
| Los caballos **temen** a elefantes (y a camellos) | Los jinetes no los cargan y se espantan si las bestias cargan cerca |
| El elefante mete **terror** a quien tiene cerca y lanza a los hombres por el aire | Su carga baja el ánimo de todo el cuerpo y de los vecinos, y desordena las filas |
| El elefante herido **se desboca** y arrolla a quien pille | Ya está (se revuelven contra los suyos); además podrá arrollar al cuerpo vecino |
| A los elefantes los paran jabalinas, flechas y fuego | Jabalinas, flechas y lanzas clavadas; la espada de frente, apenas |
| Se gana haciendo **huir**: el ánimo cae por flanco, espalda, cansancio y ver huir al vecino; las bajas llegan en la persecución | Ya hay ánimo, flanco y contagio; se añade que los jinetes libres persigan a los que huyen (está en GM8) |
| El cansancio se ve y pesa | Ya está (fatiga por línea y relevo) |
| Veinte unidades que el jugador mueve una a una | **No se toma** salvo que el usuario lo pida: seguimos con tres cuerpos y cuatro órdenes (pregunta abierta en la bitácora) |

## Coste y riesgo
- Entra casi entero en **GM8** (ya aprobada: caballería con arranque, galope, choque y vuelta, y que rodee en vez de pasar por encima). Lo nuevo son las reglas 2, 3, 5 y 6. Unos 0,8 M más sobre GM8, con Sonnet y encargos partidos.
- Riesgo: con jinetes más lentos y elefantes más duros, Pirro y Cartago se vuelven más difíciles; hay que volver a pasar la prueba de equilibrio. El jugador lo vería como «ya no gano igual».

## Versión mínima (lo más pequeño que ya se nota)
Tres reglas: los jinetes no cargan elefantes; al centro no se llega si no se ha roto o rodeado un ala; y la carga se dibuja rodeando por fuera. Unos 0,4 M.
