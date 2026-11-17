# GM10 · Mover con el dedo, a nuestra manera (diseño corto) · 16/11/2026

Pedido del usuario: «A y algo adaptado a nosotros para B». Se imita **cómo se manda** en Rome II (de memoria; solo
ideas), no su interfaz. Maqueta: `gobierno/maquetas/guerra-manejo/` (copia de `guerra-lejos/`). No toca `js/`.

## Qué se toma de Rome II y qué no
| En Rome II | En AQVILA (GM10) |
|---|---|
| Eliges una unidad y arrastras: dibujas dónde va y hacia dónde mira | Arrastras un **cuerpo** (ala izquierda, centro, ala derecha): adelante, atrás o de lado |
| Botón derecho sobre un enemigo: «ataca a ese» | Tocar un cuerpo enemigo lo **marca**: los jinetes cargan ahí en cuanto están listos |
| A la caballería la llevas tú por fuera para entrar por la espalda | Arrastras a los jinetes: el lado por el que pasa el dedo es **por dónde rodean**; donde sueltas, **a quién cargan** |
| Pausa para dar órdenes con calma | Mientras el dedo dibuja, el tiempo va **a cámara lenta** |
| Veinte unidades sueltas | **No se toma**: tres cuerpos y los jinetes. Cuatro piezas, no veinte |

Las cuatro órdenes de abajo siguen igual. **Nada de esto es obligatorio**: quien no arrastre juega como hasta ahora.

## Reglas nuevas (pocas; el enemigo no cambia)
1. **Jinetes con ruta elegida.** El jugador elige el ala por la que rodean (izquierda o derecha) y el cuerpo al que
   cargan. Ir por el ala contraria al objetivo, o al centro, es el rodeo largo: tarda el doble y entra por detrás.
   Si en esa ala hay jinetes enemigos, primero hay duelo. Las bestias siguen cerrando el paso.
2. **Objetivo marcado.** Un cuerpo enemigo marcado: en cuanto los jinetes están listos y hay paso, cargan solos ahí,
   una vez. Se desmarca tocándolo otra vez.
3. **Retrasar un cuerpo.** Lejos: **esperar** (se planta, descansa, deja venir al enemigo). Ya luchando: **ceder**
   (retrocede paso a paso: recibe la mitad de bajas, apenas pega, pierde terreno; el que le sigue se cansa). Sin sitio
   para ceder más, vuelve a aguantar. Fuente de la idea: el centro de Aníbal en Cannas (Polibio 3.115) cedió a
   propósito mientras las alas envolvían. Que lo pueda hacer cualquier cuerpo a una orden es **licencia de juego**.
4. **Rehusar un costado.** El cuerpo dobla un extremo hacia atrás: los jinetes que lo hostigan y el envolvimiento le
   hacen mucho menos daño, a cambio de pegar algo menos de frente. Se quita adelantando. Fuente de la idea: el orden
   oblicuo y las alas rehusadas de la táctica helenística; simplificado, **licencia de juego**.
5. **Adelantar** es lo que ya hay: avanzar (lejos) o empujar (luchando).

## API en `reglas.js` (para quien construya)
- `puede(B, i, orden, mas)` y `ordenar(B, i, orden, mas)`: `mas` es opcional. Con `orden === 'caballeria'` admite
  `{ ala: 0 | 2 }`. Sin `mas`, todo se comporta como antes (la prueba de equilibrio no debe moverse).
- Órdenes nuevas (solo por gesto, no llevan botón): `'esperar'` (solo lejos), `'ceder'` (solo en lucha),
  `'rehusar'` con `{ costado: -1 | 1 }` (−1 izquierda, 1 derecha; `c.rehusa` guarda el costado, 0 si no).
  `'avanzar'` y `'empujar'` quitan `rehusa`. Deben estar en `ORDENES` con `que` y `sub`, y fuera de `ordenesDe()`.
- `rutasCab(B, i)` → `[{ ala, doble, duelo, no }]`, una por ala (0 y 2): `no` es el motivo si no se puede ('' si sí).
- `marcar(B, i)` → pone o quita `B.objetivo` (−1 si no hay). `paso()` lanza la carga cuando se puede y lo borra.
- Eventos nuevos: `objetivo`, `cede`, `espera`, `rehusa`, `sin-sitio`.

## Tres maneras de manejarlo (para que el usuario elija)
Se cambia con `?manejo=a|b|c` y con un botón arriba («Manejo A · B · C»). Las tres dan las mismas órdenes.
- **A · Arrastrar en el campo.** El dedo sobre tu cuerpo o tus jinetes, en el campo 3D; se pinta una flecha en el
  suelo; al soltar, la orden. Lo más parecido a Rome II. Riesgo: en vertical los cuerpos son pequeños bajo el dedo.
- **B · Tocar y elegir.** Tocas tu cuerpo y salen alrededor tres o cuatro flechas grandes (adelantar, retrasar,
  rehusar a un lado); tocas los jinetes y cada cuerpo enemigo enseña dos rutas (por la izquierda, por la derecha).
  Sin arrastrar: lo más fácil con el pulgar. Riesgo: más toques.
- **C · Tablilla de mando.** Un plano pequeño visto desde arriba, encima de las órdenes, con fichas grandes; se
  arrastra ahí y el campo queda limpio para mirar. Riesgo: quita sitio a la batalla en vertical.

## Criterio de hecho
En el móvil, en la maqueta: arrastrar (o tocar) un cuerpo lo adelanta, lo retrasa o le hace rehusar un costado, con
flecha visible; a los jinetes se les dibuja por dónde rodean y a quién cargan; tocar un enemigo lo marca. Las cuatro
órdenes siguen. Hay tres manejos para comparar. `prueba.mjs` y `captura.mjs` APTO, en vertical y en horizontal.
