# GM7 · La batalla empieza de lejos: proyectiles, escudos y testudo (16/11/2026)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-lejos/
Maqueta aparte, copia de la de GM1 (`guerra-grande/`, que no se toca): mismos cartones, mismas figuras de cerca, mismos
tres cuerpos. No cambia el juego. Otro rival, hecho solo con fichas nuevas: añade `?rival=pirro` a la dirección.

## Qué cambia, en llano
1. **Empieza de lejos.** Las líneas salen a 150 m. Delante van tus vélites y sus honderos. Tardan unos 40 s en chocar,
   y cada cuerpo choca cuando llega (los galos, antes). Arriba, cada enemigo dice «a 96 m» o «tiran piedras».
2. **Los proyectiles se ven y hacen bajas.** Piedras (blancas, en arco alto), jabalinas de los vélites y, justo antes
   del choque, la descarga de pila de los legionarios. Los tiradores se retiran solos por los huecos antes de chocar.
3. **Te cubres o pagas.** Mientras el cuerpo está lejos, sus cuatro botones dicen otra cosa:

| Botón (lejos) | Qué hace | Qué cuesta |
|---|---|---|
| **Avanzar** | Marcha normal, sin cubrirse. Llega antes y carga con empuje | Cada piedra hace baja y el ánimo cae |
| **Escudos** | Escudos arriba: menos de la mitad de bajas | Va a medio paso y **cansa a las tres líneas** |
| **Testudo** | Tejado de escudos: una baja de cada diez | Casi no anda, agota, no puede lanzar pila, tarda 3,5 s en deshacerse; **si le chocan dentro, se deshace** |
| **Caballería** | Si sus tiradores siguen delante, va **a por ellos** («a sus honderos») | Los jinetes tardan 24 s en rehacerse |

   Al chocar, los mismos botones vuelven a ser Empujar, Aguantar, Relevo y Caballería. Ni un botón más en pantalla.
   El botón que conviene late: «Escudos» cuando te tiran y vas descubierto; «Avanzar» cuando dejan de tirar o cuando
   la carga se te echa encima con el testudo formado.
4. **Más espacio y más tiempo.** De 7 s de marcha se pasa a unos 40 s con decisiones; la batalla entera dura unos dos
   minutos (antes, 113 s). La cámara empieza alta y baja sola según se cierran las líneas.
5. **Una ficha por tropa.** Cada tropa es una línea de datos: arma, formación, cartón y cuatro números. Ver abajo.

## Comprobado con jugadores de mentira (`node gobierno/maquetas/guerra-lejos/prueba.mjs`: APTO)
40 batallas por jugador, a 1 000, 5 000 y 10 000 hombres. Cifras a 5 000 contra Cartago:

| Jugador | Gana | Dura | Legionarios caídos por proyectil |
|---|---|---|---|
| No toca nada / solo avanza y empuja | 0 % | 67 s | 9 % del ejército |
| Con cabeza y **escudos a tiempo** (se cubre al aviso, avanza cuando paran) | **98 %** | 125 s | 4 % |
| El mismo, **sin cubrirse nunca** | **33 %** | 108 s | 9 % |
| Con cabeza y testudo, deshecho a tiempo | 100 % | 124 s | 2 % |
| **Testudo hasta el choque** | **0 %** | 85 s | 1 % |
| Escudos todo el camino (aunque no le tiren) | 95 % | 133 s | 4 % |
| Escudos y jinetes a por los honderos | 100 % | 114 s | 3 % |

- **Las decisiones mandan**: cubrirse a tiempo gana casi siempre; no cubrirse pierde dos de cada tres; el testudo es la
  mejor defensa y la peor idea si no se deshace. Los tres cuerpos traban combate entre los 36 y los 49 s.
- **Contra Pirro** (arqueros, hoplitas, falange, tesalios: solo fichas nuevas) las reglas aguantan sin tocar el motor:
  0 % sin hacer nada, 100 % con cabeza, 80 % sin cubrirse.
- **Sin medir**: cómo se siente en un móvil real, y si 40 s de acercarse se hacen largos o cortos. Eso lo dice la prueba.

## Añadir una tropa o un arma (lo que pedía P121)
Todo está en `reglas.js`, en cuatro tablas. El motor y el dibujo no nombran ninguna tropa.
- `TROPAS`: `honderos: { arma: 'honda', forma: 'tiro', carton: 'honderos', cal, cansa, blanco, hombres, mun }`.
  `cubre` = sabe formar escudos y testudo; `arroja` = descarga antes de chocar; `genio` = cómo decide sola; `montado`.
- `ARMAS`: alcance, bajas por tirador y **cómo se pinta el proyectil** (`vuelo`: segundos, altura, largo, grosor, color).
- `FORMACIONES`: separación entre hombres, velocidad, si pelea delante y cuánto se adelanta.
- `EJERCITOS`: un ejército es una lista de nombres por cuerpo. La tropa «delante» sale a tirar; las demás son las líneas.
- `POSTURAS` y `ORDENES`: las maneras de cubrirse y lo que dice cada botón.
Los arqueros ya tienen ficha, pero **no tienen modelo propio**: usan el cartón del hondero hasta que Arte convierta uno.
Lo que sí pide tocar el motor: un tipo de combate nuevo de verdad (elefantes que se revuelven, falange que no se deja
entrar). Las reglas de eso están estudiadas en GM2 y GM6 (`guerra-cuerpo/reglas.js`); aquí no se han traído.

## Dónde engancha GM8 (flanqueo natural y caballería con cámara)
- **Flanqueo**: `vista.js`, función `colocar()`, bloque `fl`: hoy el cuerpo vencedor salta a un punto junto al costado
  del vecino. Ahí va el giro en rueda y la entrada andando. El motor ya dice cuándo (`c.libre`, `flanqueado`, `R.vecino`).
- **Caballería**: `vista.js`, `jinetes()` (recorrido) y `reglas.js`, bloque «Caballería romana» de `paso()` (estados
  `lista`, `yendo`, `cargando`, `volviendo`). La carga ya distingue si va a por tiradores o al flanco: perseguir a los
  que huyen es añadir un estado.
- **Cámara que la sigue**: `camaraMeta()`: una rama más que mire a `rc.x, rc.z` mientras `B.cab.estado` no sea `lista`.
- **Proyectiles**: `lanza(de, a, arma)` sirve para cualquier regimiento, también jinetes (los númidas ya la usan).

## Lo que no hace (a propósito, o queda)
- **El testudo y los escudos se pintan como un tejado de escudos** sobre el bloque. Las figuras no levantan el escudo:
  no hay esa animación en el arte de 0 A.D. convertido. Es trabajo de GM4 (aspecto).
- Los tiradores cruzan a través de los suyos al retirarse, como el relevo. Los vélites no vuelven a salir.
- No se han traído las armas, formaciones y el premio o castigo de GM2 y GM6: el usuario no las ha probado aún.
- El enemigo no se cubre: su aguante a los proyectiles es un número de su ficha (`blanco`).

## Historia (dictamen: APTO CON NOTAS)
- **Histórico**: los vélites abren la batalla con jabalinas y se retiran por los huecos de los manípulos (Polibio 6.22
  y 6.24; Livio 30.33, Zama). Los honderos baleares en el ejército de Cartago (Polibio 3.72 y 3.113; Livio 21.55).
  La descarga de pila antes del choque (Polibio 6.23). Los galos, mal protegidos, sufren bajo las jabalinas (Polibio
  2.30, Telamón). Pirro trajo arqueros y honderos a Italia (Plutarco, *Pirro* 15).
- **Probable**: aguantar una lluvia de proyectiles tras el escudo, rodilla en tierra. Es lo que el scutum permite; las
  fuentes de esta época no lo cuentan como orden de batalla.
- **Licencia de juego (y casi anacronismo)**: el **testudo en campo abierto**. En 280–146 a.C. solo está atestiguado
  para asaltar murallas (Polibio 28.11 y Livio 44.9, Heracleo, 169 a.C.). Contra proyectiles en batalla campal aparece
  más tarde (Plutarco, *Craso* 24 y *Antonio* 45; Dion Casio 49.30). Se deja porque el usuario lo pidió, marcado.
- **Licencia de juego**: Roma no tenía arqueros propios en esta época (los pedía a aliados: cretenses de Hierón, Livio
  22.37); por eso el rival por defecto lleva honderos y los arqueros quedan para Pirro. Tiempos y distancias
  comprimidos (150 m en 40 s). 40 vélites por cada 300 legionarios (eran más: 1 200 por legión, Polibio 6.21).
  Los jinetes barren a los honderos de una sola carga.
- Citas hechas de memoria, sin cotejar pasaje a pasaje.

## Lo que decide el usuario tras probarla
1. ¿Así empieza la batalla? (A) sí; (B) sí, con cambios; (C) no.
2. Acercarse dura unos 40 s. (A) está bien; (B) más largo; (C) más corto.
3. El testudo en campo abierto no es de esta época. (A) se queda, marcado como licencia; (B) solo «Escudos».
