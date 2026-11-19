# TP8 · Mejoras del testudo y del combate (lista cerrada)

Hablada con el usuario el 19/11/2026. Sirve a **L11** (testudo a pie) y **L17** (formaciones a pie).
Presupuesto: 1,5 M (corte duro 2,25 M). Lo que no quepa pasa a **TP8b**, en el mismo orden.

## Lo que dijo
- Ha probado las tres: «Testudo a pie», «Falange a pie» y la batalla nueva.
- Flojo hoy: **sonido**, **lucha cuerpo a cuerpo**, **manos, brazos y pilum**. Andar y correr no lo marcó: ya vale.
- Orden, literal: «Lucha brazos y gráficos y animaciones y luego sonido».
- De la lucha le falla todo: **es sosa**, **atraviesan**, **se lee mal** y **le falta peso al golpe**.
- Después, literal: «Hay que hacer más épica la batalla, que parezca de verdad, te he pasado muchos vídeos ya, puedes
  usarlos para crear lo que te pido». Las dos batallas (escenas a pie y la de manípulos). Le falta todo: más gente y
  vecinos, cámara de cine, polvo, luz y suelo, escudos y estandartes.

## La lista, en su orden
| # | Mejora | Qué se verá | Tamaño | De quién |
|---|---|---|---|---|
| 1a | Lucha: nadie atraviesa y el golpe pesa | La espada para en el escudo o el cuerpo; quien recibe se dobla y recula; pausa mínima, tirón de cámara y polvo al acertar | media | TP8 (escenas aparte) |
| 1b | Lucha: se lee y no es sosa | El aviso del galo, claro y a tiempo; tus botones responden en el acto; el galo varía (golpe alto, bajo, finta); tu fila pelea viva | media | TP8 |
| 2 | Manos, brazos y pilum | Brazos menos tiesos; el lanzado con impulso del cuerpo; el segundo pilum se saca, no aparece | media | TP8 |
| 3 | Gráficos y animaciones: «más épica, que parezca de verdad» | Con las ideas de sus vídeos (TP0 §3): 3a cámara de cine (plano ancho de los dos ejércitos, temblor en la carga, más cerca en el choque); 3b polvo, luz y suelo (polvo de marcha y choque, sombras largas, hierba alta, caídos y sangre en el suelo); 3c escudos sucios y golpeados que se solapan, y estandartes; 3d más gente: unidades vecinas peleando a los lados (la más cara: se mide en móvil antes de darla por buena) | grande | TP8 en las escenas; la misma lista a CG6 |
| 4 | Sonido grabado | Pasos, gritos, hierro en madera, el pilum al volar; libre (CC0 o CC BY) con su crédito | media | TP8 |

Primero en «Testudo a pie»; la falange recibe lo mismo si cabe en el presupuesto.

## Para CG6 (dentro de la batalla nueva; no lo construye TP8)
Lo mismo de 1a y 1b cuando bajas a pie desde el hombro: que nadie atraviese, que el golpe pese (pausa, tirón de
cámara, reacción del herido), aviso del enemigo claro, respuesta inmediata a tus botones, enemigo que varía.
Si TP8 cambia una pieza compartida (acciones, soldado, cámara, enemigo, locomoción), mantiene su interfaz y avisa.

## Fuera
Caras de los soldados (GM43j, aparte). Andar y correr (vale hoy). Lo nuevo que pida va a la bitácora.

## Estado al cerrar TP8 (19/11) y lo que queda: TP8b
- **Hecha 1a** (en «Testudo a pie»): de 17 golpes atravesaban 7, ahora 1 (peor caso 6 cm, antes casi 1 m); chispa en el
  escudo, polvo y chispa en el pecho; el herido se encoge y recula; en tu duelo, pausa de 65–90 ms y tirón de cámara.
  Falta que el usuario la apruebe en su móvil. Duda: el galo, con lanza larga, se queda a unos 3 m al herirte.
- **TP8b** (la abre el vigía; nada empieza sin que el usuario apruebe la 1a), en su orden:
  1. **1b** Lucha que se lee y no es sosa (aviso claro, respuesta inmediata, galo que varía, fila viva); y el impacto de tu estocada, que quedó sin hacer.
  2. **2** Manos, brazos y pilum.
  3. **3** Más épica en las escenas a pie: 3a cámara de cine, 3b polvo, luz y suelo, 3c escudos y estandartes, 3d más gente.
  4. **4** Sonido grabado libre, con su crédito.
- **Regla de encargo para TP8b**: cada encargo, una pieza y **30 pasos como máximo**, con corte por encargo; medir el
  gasto al volver cada uno. El render por software es lento: las capturas, una sola tanda al final del encargo.

## TP8b · La vara y las referencias (19/11)
Índice común de todo lo que ha enseñado el usuario: `estudios/REF-batallas-referencias.md` (estas fichas son las de su fila «19/11, chat de TP8b»).
- **Vara** (palabras del usuario en `BITACORA.md`, 19/11): las cuatro frases del testudo y las cuatro de las picas son
  el suelo («eso es un 5… hazlo a ver cómo queda y después lo vuelvo a evaluar»); el 8 lo pone él al verlo.
  De las picas de hoy: «muñecos sin gracia que pinchas y baja una línea q se supone que es la pica y encima se
  atraviesan entre ellas»; echa de menos lo que sí tiene el testudo (voces, agachar la cabeza bajo la salva).
- **Tres clips suyos** (Rome II, subidos al chat el 19/11; solo ideas, nada se guarda en el repositorio):
  1. *Falange contra elefantes, desde detrás.* La cámara va **por encima de los cascos** (a unos 3 m, mirando hacia
     abajo y al frente): se ve al enemigo entre las astas. Astas gruesas, de color madera clara, con sombra larga en
     el suelo; las de atrás, alzadas en abanico; sol bajo y cálido; filas prietas con escudo redondo de bronce.
  2. *Muro de picas de lado, contra caballería.* Cinco hileras de puntas asoman horizontales un buen trecho por
     delante de la primera fila; el que carga muere en las puntas y los caídos se amontonan delante; polvo y sangre
     en el suelo; estandarte grande sobre cada unidad.
  3. *Cohortes romanas marchando.* Plano ancho con los bloques formados antes de bajar; de cerca, filas densas, escudos
     que se solapan, hierba alta en primer plano.
- **Qué se toma**: picas → cámara alta sobre los cascos, astas con cuerpo y sombra, cinco hileras de puntas, caídos
  amontonados delante del muro; épica a pie → plano ancho de apertura, estandarte, hierba en primer plano, sol bajo.
  4. *Testudo de Ryse (cuarto clip, 19/11).* Al dar la orden, la cámara se mete **dentro del testudo, pegada a la cara
     del que grita**; cada orden sale escrita abajo («¡Escudos!», «¡Esperad! ¡Aguantad!», «¡Formad!»); los hombres
     asoman medio cuerpo por encima de los escudos para lanzar y vuelven a cubrirse; cielo oscuro, flechas con fuego
     y golpes secos en la madera. Se toma: plano corto al dar la orden, voces escritas y dichas, asomar para lanzar.
     Lo que un móvil no da (caras de cine) se dice y no se promete.
  5. *Testudo de Ryse, otro corte (quinto clip, 19/11).* Antes de avanzar, **arenga**: el centurión alza la espada y
     habla a los suyos; la vista alterna entre el plano de detrás (cascos asomando por el borde de los escudos, la
     cresta roja en el centro) y el plano corto del centurión cubriéndose cuando llega la salva. Se toma: arenga
     breve al empezar y el vaivén entre plano de detrás y plano corto en los momentos fuertes.
  6. *Testudo de Rome II ante una muralla (sexto clip, 19/11; el usuario aclara que es Rome II, no Ryse).* La cámara
     va **a ras del techo de escudos de una cohorte entera** (más de cien hombres), mirando por encima hacia la
     muralla; hierba alta y clara; proyectiles con estela de humo que caen en arco y humo donde pegan. Se toma: el
     testudo visto como techo de toda la unidad, no de ocho hombres; estelas de humo en los proyectiles; objetivo
     lejano siempre a la vista. **Pedido del usuario**: llevar esta forma de jugar y de verse a la batalla grande
     (campaña y escaramuza normal). Eso es CG6 y CG8, no TP8b: pasado al vigía; TP8b mantiene las piezas para que sirvan allí.
