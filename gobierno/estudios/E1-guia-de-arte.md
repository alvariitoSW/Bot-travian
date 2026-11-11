# E1 · Guía de arte · una página

Para que todo el juego parezca de la misma mano: Roma republicana, sobria, de piedra, bronce y rojo.
Muestra para ver en el móvil: `gobierno/estudios/E1-muestra.html` (captura: `E1-muestra.png`). **El juego no se ha tocado.**

## Paleta (8 colores)
| Nombre | Código | Para qué | Hoy |
|---|---|---|---|
| Noche | `#0b1016` | Fondo de paneles y menús | igual |
| Rojo legión | `#c0281f` | Botón principal, tu bando, peligro de guerra | igual |
| Oro | `#e9c063` | Títulos, cifras importantes, bordes activos | igual |
| Bronce | `#b8862b` | Marcos, líneas, iconos en reposo | igual |
| Mármol | `#f1ead9` | Texto principal | hoy es un blanco azulado `#eef1f5` |
| Piedra | `#9aa6b4` | Texto secundario, cosas apagadas | igual |
| Oliva | `#8fae5a` | «Va bien»: ganancias, moral alta | hoy es un verde fosforito `#7ddc5a` |
| Terracota | `#d9764a` | «Va mal»: pérdidas, avisos | hoy es un rosa `#ff7a66` |

Cinco no cambian. Cambian tres, a tonos más de tierra. Regla: el oro y el rojo se usan poco, para que manden.

## Letra
- **Títulos**: mayúsculas de inscripción (tipo Trajana), con las letras algo separadas. El juego pide la letra
  «Cinzel», pero **no está incluida**: sin conexión el móvil pone otra parecida (Palatino o Georgia). Propongo
  incluir Cinzel en el juego (licencia libre SIL OFL, unos 40 KB) para que se vea igual en todos los móviles.
- **Texto y botones**: la letra del propio móvil (rápida y clara). Mínimo 13 px; cifras alineadas en columnas.
- Números romanos solo en adornos (niveles: I, II, III). Las cantidades, en cifras normales.

## Iconos
- **Dibujo de línea**, un solo color, trazo redondeado de grosor fijo, sobre una rejilla de 24×24. Como grabados en bronce.
- Color bronce en reposo; oro si está activo; nunca a todo color.
- Un objeto por icono, reconocible a 20 px: espiga, sillar, lingote, tronco, denario, gladius.
- Hechos a mano en SVG dentro del juego: no pesan, funcionan sin conexión y no dependen de la licencia de nadie.

## Marcos
- Panel: fondo Noche, borde fino de bronce y una segunda línea interior más tenue (doble filete, como una lápida).
- Cabeceras con una **greca** (meandro) fina en bronce. Esquinas poco redondeadas (6–8 px, hoy 16 px).
- Botón principal: rojo legión con filo de oro. Botón secundario: solo borde de bronce.
- Sin brillos, sin degradados fuertes, sin sombras de colores.

## Qué emojis sustituir primero
El juego usa unos 40 emojis distintos. Cada móvil los pinta a su manera y los más nuevos (🪵 🪨 🪙 🪖) salen como
un cuadrado vacío en móviles antiguos. Orden propuesto:
1. **Recursos** de la barra de arriba (🪵 🪨 ⚒️ 🌾 🪙 👥): se ven siempre. Son los 6 de la muestra, menos población.
2. **Guerra**: ⚔️ (sale 15 veces), 🛡️, 🦅, ♞, 🚩, 🩸.
3. **Edificios** (13): 🪓 ⛏️ 🏘️ 🏛️ 🏺 ⚖️ ⚓ 🐎 🧱 🔥…
4. El resto (mapa, avisos, menú).

## Decide el usuario
- ¿Te gusta la muestra? ¿Los tres colores nuevos (mármol, oliva, terracota) sí o no?
- ¿Incluimos la letra Cinzel en el juego?
- Si dices que sí: tarea nueva «E1b: aplicar la guía» empezando por los 6 iconos de recursos.
