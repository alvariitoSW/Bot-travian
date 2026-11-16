# GC1 · Guerra desde cero — la batalla nueva (16/11/2026)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-cero/
Maqueta aparte: no cambia nada del juego publicado. Hoja en blanco: no reutiliza `battle.js` ni `batalla2.js`.

## La idea en una frase
Una batalla son **tres pulsos** a la vez (ala izquierda, centro, ala derecha) y tú haces de cónsul con **cuatro órdenes**:
Empujar, Aguantar, Relevo y Caballería. Nada más.

## Qué se ve
- **Una sola pantalla.** El campo ocupa todo; abajo, tus tres cuerpos y las cuatro órdenes; arriba, «Retirarse».
  No hay despliegue previo, ni mapa de maniobra, ni paneles que se abren.
- **Empieza sola.** Las líneas ya marchan una hacia otra. No hay «En pausa» ni botón de empezar.
- **Cada cuerpo se lee de un vistazo**: tres escudos (sus tres líneas: hastati, príncipes, triarios). El escudo se vacía
  cuando caen hombres y pasa de verde a ámbar y a rojo cuando están cansados. Debajo, una barra roja: el ánimo.
- **El enemigo lleva un solo rótulo por cuerpo**, de una palabra: «cargan», «aguantan» o «flaquean».
- **La cámara baja sola** al sitio donde pasa algo (un relevo, la carga de los jinetes, un cuerpo que huye) y vuelve a subir.
- **Una línea de aviso** arriba, que se va sola: «Los galos cargan por la izquierda», «Tus hastati están agotados en el centro».
- **Salir**: «Retirarse» está siempre arriba. Pregunta una vez. Dos toques y estás fuera.

## Cómo se juega (lo que hay que decidir)
| Orden | Qué hace | Qué cuesta |
|---|---|---|
| **Empujar** | Tus hombres pegan más y ganan terreno | Se cansan deprisa y sufren más bajas |
| **Aguantar** | Escudos juntos: muchas menos bajas y recobran algo de aliento | Ceden terreno poco a poco |
| **Relevo** | La línea de delante se retira y entra la siguiente, fresca | Tres segundos de desorden; la línea retirada tarda en descansar |
| **Caballería** | Los jinetes cargan el costado enemigo de ese cuerpo, o espantan a los númidas | Tardan unos 25 segundos en rehacerse |

El enemigo siempre **avisa** antes de hacer daño, y cada uno tiene su carácter:
- **Galos** (su ala izquierda): cargan con furia al principio y se agotan pronto. Aguanta, y empuja cuando «flaquean».
- **Libios** (centro): veteranos pesados que no se cansan. Hay que relevar bien o ganar por las alas.
- **Iberos** (su ala derecha): alternan cargas y pausas.
- **Jinetes númidas**: aparecen dos o tres veces y hostigan un ala. O mandas tu caballería, o pones triarios a aguantar.

Quien rompe un cuerpo enemigo se vuelve contra el costado del vecino. Gana quien rompe **dos de los tres** cuerpos.

## Por qué así (lo que falló dos veces y lo que se quita)
| Antes | Ahora |
|---|---|
| Mapa de maniobra, despliegue, rondas, tarjetas de tribuno, mini pantallas | Una pantalla, cuatro botones |
| Rótulos sobre cada unidad, que tapaban la tropa | Un estandarte por cuerpo y una palabra por cuerpo enemigo |
| Reglas que había que leer | Cada botón dice lo que hace en dos o tres palabras; el botón que conviene late |
| Empezaba en pausa y no se podía salir | Empieza sola; «Retirarse» siempre arriba |
| Ganaba quien traía más tropas | Con las mismas tropas se gana o se pierde según lo que mandes |

## Comprobado
- **Las decisiones mandan.** Cuarenta batallas por cada manera de jugar (`node gobierno/maquetas/guerra-cero/prueba.mjs`):
  quien no toca nada pierde siempre (unos 150 s); quien solo empuja pierde siempre (unos 75 s); quien aguanta las cargas,
  empuja cuando flaquean, releva a tiempo y usa la caballería gana siempre (unos 115 s, con menos bajas que el enemigo).
- **Dura entre uno y tres minutos.**
- **Jugada en móvil simulado**, vertical (390×844) y horizontal (844×390), con toques de dedo, sin errores de consola
  (`node gobierno/maquetas/guerra-cero/captura.mjs`): botones enteros y de más de 40 px, primer toque útil, relevo,
  caballería, final y retirada en dos toques.
- **Sin medir**: la fluidez en un móvil real (aquí solo hay render por software). Son unas 230 figuras; si el móvil va
  justo, la maqueta baja sola la nitidez.

## Historia (dictamen: APTO CON NOTAS)
- **Histórico.** La legión en tres líneas, hastati, príncipes y triarios, con 1.200, 1.200 y 600 hombres por legión
  (Polibio 6.21–23; Livio 8.8). El relevo entre líneas y el dicho «la cosa ha llegado a los triarios» (Livio 8.8.9–11).
  Los aliados forman las dos alas a los lados de las legiones (Polibio 6.26). La caballería que vuelve y cae sobre la
  espalda enemiga decide Zama (Polibio 15.12–14). Los galos, temibles en el primer choque y pronto agotados (Polibio 2.33;
  Livio 10.28, Sentino). Los jinetes númidas que hostigan y se escabullen (Polibio 3.71–72, Trebia). Los libios como
  infantería pesada de Cartago (Polibio 3.114, Cannas).
- **Probable.** Cómo pasaba una línea entre los huecos de la otra no lo cuenta ninguna fuente con detalle y se discute
  (Goldsworthy, *The Roman Army at War*, 1996; Sabin, «The Face of Roman Battle», *JRS* 90, 2000; Taylor, «Roman Infantry
  Tactics in the Mid-Republic», *Historia* 63, 2014). Aquí la línea entera retrocede andando entre la siguiente.
- **Licencia de juego.** Una batalla de horas dura dos minutos. Cada figura vale por unos nueve hombres. Una línea
  retirada puede volver al frente tras descansar. Los jinetes esperan detrás como reserva (iban en los extremos de las
  alas). Faltan los vélites. Los aliados de las alas se dibujan como romanos. El ejército púnico es una mezcla tipo, no
  una batalla concreta.

## Lo que la maqueta no tiene (a propósito)
Sonido, elefantes, falange macedónica, terreno con relieve, general, y la unión con la campaña (qué tropas entran y qué
bajas vuelven). Todo eso cabe después sin tocar la idea: más rivales con su carácter, no más botones.

## Lo que decide el usuario tras probarla
1. ¿Esta es la batalla nueva? (A) sí, llevarla al juego; (B) sí, con cambios; (C) no, otra vuelta.
2. ¿Vertical, horizontal o las dos? La maqueta funciona en las dos.
3. ¿Ritmo? Ahora dura unos dos minutos.
