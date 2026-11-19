# Encargo artístico · Renovación de los menús de AQVILA (MN0, 18/11/2026)

Encargo autosuficiente: se pega tal cual en una sesión de diseño. Lo que sale es una **maqueta HTML de todas las
pantallas** (MN4), que el usuario aprueba con capturas y luego se construye. Detalle del porqué: `MN0-objetivo-menus.md`.

---

## ENCARGO (copiar desde aquí)

**Eres director de arte de interfaz de un juego de estrategia para móvil.** Diseña la interfaz completa de **AQVILA**,
un juego ambientado en la Roma de la República (280–146 a.C.): gobiernas ciudades, tratas con el Senado y sus familias,
comercias, estudias y haces la guerra en un mapa del Mediterráneo, con batallas en 3D. Se juega en un **móvil de
390 × 844 px**, en vertical (y en horizontal en el mapa y la batalla), **sin conexión**. El jugador es un adulto que
no es experto en videojuegos y juega a ratos: debe saber **sin leer instrucciones** dónde está y adónde va cada botón.

**Entrega.** Una maqueta en HTML y CSS, sin librerías, con una pantalla por sección, a 390 × 844, y una lámina de
componentes. Todo dibujado con CSS y SVG en línea, salvo las láminas de museo indicadas abajo. Sin texto falso: usa
los textos de ejemplo de este encargo. En español.

### 1. Idea visual
Un **escritorio de magistrado romano**: lo que lees es **papiro** (rollo con varillas de madera en los extremos); lo que
decides o pactas es una **tablilla de cera** oscura en marco de madera; lo que pulsas es **bronce** pulido con relieve;
la acción principal de cada pantalla es un **sello de lacre rojo**. Los títulos van en una **tabla ansata** (cartela
con dos asas en cola de milano), como las inscripciones. Adornos: laurel, hiedra, greca y meandro, finos y a tinta.
El mundo es **griego y romano a la vez**: columnas toscanas y dóricas, cerámica de figuras rojas, monedas de plata.
La política puede tener un ambiente propio (mármol blanco y púrpura discreta en el Senado) y la guerra el suyo (cuero,
hierro y rojo de túnica en Tropas), **pero botones, letra, barra y avisos son los mismos en todo el juego**.

Ideas tomadas de otros juegos (**solo ideas; nunca su arte, logotipos, textos ni disposición exacta**):
- *Rome II Total War*: una acción grande por pantalla; la unidad o la ciudad con su estandarte; estado en palabras.
- *Ikariam*: la ciudad es la pantalla principal y los edificios se tocan sobre ella.
- *Travian*: recursos siempre arriba, con lo que entra por estación.

### 2. Paleta (usar estos valores)
| Papel | Color |
|---|---|
| Papiro claro / oscuro | `#e8d4a2` / `#d9bd84` (fibras sutiles) |
| Tinta / tinta suave | `#2b1c0a` / `#5a4220` |
| Minio (rojo de título y aviso) | `#9b2a1a` |
| Cera de tablilla / cera clara | `#2e2214` / `#3d2d1a` |
| Madera / madera oscura | `#6b4a26` / `#4a3119` |
| Bronce / bronce medio / bronce oscuro | `#b8862b` / `#7a5a1f` / `#4a3512` |
| Oro de letra sobre bronce | `#e9c063` |
| Lacre / lacre oscuro | `#a3231a` / `#6e130d` |
| Bien / mal | oliva `#46661f` / minio `#9b2a1a` |
| Fondo de noche detrás de los rollos | `#17110d` |

El contraste del texto con su fondo es de 4,5 : 1 como mínimo. El significado nunca va solo en el color: cada estado
lleva además una palabra o un icono.

### 3. Letra
- Títulos, botones y la barra: **Cinzel** (capitales romanas; 400 y 700; licencia libre OFL, ya en el juego).
- Texto corrido: una serif de libro legible a 15 px (Georgia o la serif del sistema). Nada de letra «antigua»
  decorativa en el texto que se lee.
- Tamaños: título 19 px · texto 15 px · dato pequeño 13 px · palabra de la barra 11–12 px. Nunca menos de 11 px.

### 4. Componentes (lámina aparte)
1. **Barra de abajo** (64 px + zona segura): seis botones iguales, icono de tinta de 24 px y una palabra debajo:
   **Ciudad · Senado · Saber · Tropas · Mapa · Imperio**. El activo: papiro claro con borde de minio; los demás, bronce
   oscuro con letra oro. Encima, a todo lo ancho, el sello **«Pasar turno · Invierno»**.
2. **Cabecera de arriba**: fila de recursos en pastillas (icono + cifra + ▲▼ de la estación); debajo, «ROMA ▾»,
   la fecha («Ianuarius · 280 a.C.»), la velocidad y ☰.
3. **Botón de bronce** (44 px de alto mínimo), **botón de sello** (la acción principal, uno por pantalla), **botón de
   tinta** (secundario, solo texto subrayado) y **botón apagado** (con el motivo: «Falta hierro»).
4. **Tarjeta de papiro**: título en tabla ansata, texto, y pie con botones. Variante con **lámina** arriba (imagen de
   museo con su crédito en 11 px).
5. **Tablilla de pestañas**: 2 a 4 pestañas de cera; la elegida en papiro.
6. **Aviso de estación**: carta de papiro plegada con sello de lacre, tres líneas como mucho, «Ver más» y «Seguir».
7. **Ficha de personaje** (consejero, jefe de bando): busto en medallón tipo moneda, nombre de familia, bando, humor
   en palabras («contento», «molesto») y lo que propone.
8. **Sello «Lo lleva …»**: señal pequeña de que algo está delegado en un consejero o gobernador; se toca para quitarlo.
9. **Barra de avance**: cinta de bronce que se llena; con su cifra y su palabra («Comercio 2 de 3 metas»).

### 5. Pantallas (una cada una, 390 × 844, con estos contenidos)
1. **Ciudad**: la ciudad en 3D ocupa todo (déjala como un hueco gris con una nota). Encima, solo la cabecera, la barra
   y la **bandeja «Construir»** plegada abajo. Abierta: pestañas **Lo hago yo · Encargar · Gobernador**. «Lo hago yo»:
   tarjetas de edificio (Fuente, Granero, Granja, Aserradero) con su coste. «Encargar»: tres fichas de consejero
   (Fabio, terratenientes: «Granja nueva en el Lacio»; Emilio, mercaderes: «Mercado mayor»; Escipión, militares:
   «Cuartel»), cada una con «Encargárselo». «Gobernador»: interruptor «Que la lleve un gobernador», qué prioriza
   (comida, oro, defensa) y el sello «Lo lleva el gobernador».
2. **Ficha de la ciudad** (al tocar ROMA ▾): felicidad en corona de laurel, «Falta: vino, hierro», las clases (plebe,
   ricos, patricios, veteranos) con su humor, y accesos a Mercado, Rutas y Crónica. Cambiar de ciudad arriba.
3. **Senado** con pestañas **Hoy se vota · Bandos · Tu carrera · Fiestas**. «Hoy se vota»: la ley propuesta en tarjeta
   con lámina («Nuevas levas tras Heraclea»), hemiciclo de escaños por color de bando, recuento «12 sí · 6 dudan ·
   12 no», tratos en tablilla y el sello «Votar». «Bandos»: siete familias con su medallón y su humor. «Tu carrera»:
   barra de Autoridad y los cargos Edil → Pretor → Cónsul → Príncipe del Senado. «Fiestas»: banquete, juegos y rito
   con su lámina.
4. **Saber**: árbol de saberes por edades en un rollo ancho que se desplaza; tres grandes obras (acueducto, calzada,
   puerto de hormigón) como láminas con su avance.
5. **Tropas**: lista de ejércitos con estandarte, general, hombres y estado en palabras; «Reclutar» con sello.
6. **Mapa**: el mapamundi es un hueco (3D); encima, la cabecera, la barra, la lista corta de marchas y la ficha de una
   ciudad tocada («Tarentum · griega · hostil»: Atacar, Tratar, Ver).
7. **Imperio**: arriba **Tus caminos**, cuatro barras (Armas, Comercio, Política, Ciencia) y «Ganas con tres»; debajo,
   tus ciudades; accesos a «Este año» (cuentas y tributo) y General.
8. **Menú ☰**: hoja de papiro que sube: Códice · Crónica · Ayuda · Ajustes · Postal · Créditos; al fondo, separado,
   «Volver al menú principal» con confirmación.
9. **Avisos**: aviso de estación, confirmación («¿Volver al menú principal? Tu partida se guarda sola.») y aviso de
   batalla («Choque en Heraclea: victoria por poco»), todos en carta de papiro.
10. **Horizontal (844 × 390)**: el mapa con la barra en columna a la izquierda (solo iconos) y una hoja abierta a la
    derecha que no pasa de media pantalla.

### 6. Imágenes
Solo piezas antiguas o láminas **de dominio público o CC0**, con su autor y su licencia escritos en pequeño: monedas
de la República, relieves, vasos griegos, frescos, láminas del siglo XIX (p. ej. *Atenas* de Klenze, 1846; el castillo
Euríalo de Rivela, 1905). Lista y enlaces en `gobierno/historia/laminas-roma-grecia.md` y `laminas-ciudades.md`. Si
no hay lámina, un dibujo a tinta en SVG. Recorta las imágenes en óvalo, medallón o franja; nunca a pantalla completa
salvo la carga.

### 7. Reglas de legibilidad en el móvil
- Lo importante a un toque; todo a dos. Un solo sello rojo por pantalla.
- Zonas de toque de 44 × 44 px como mínimo y 8 px entre ellas. Nada a menos de 8 px del borde.
- Cada botón dice lo que hace con una palabra o un verbo («Votar», «Construir», «Encargárselo»), y la misma palabra
  se repite en el título de la pantalla a la que lleva.
- Texto corrido a 15 px y líneas de 45 caracteres como mucho. Tres líneas por aviso.
- Las texturas (fibras, vetas) quedan detrás y muy suaves: nunca bajo letra pequeña.
- Sin scroll horizontal. Las hojas se cierran tirando hacia abajo o con ✕.

### 8. Lo que NO se hace
- Nada de arte, logotipos, iconos, letras ni capturas de *Total War*, *Ikariam*, *Travian* ni de otros juegos comerciales.
- Nada de imágenes generadas sin licencia clara, ni de fotos con derechos.
- Nada de pantallas oscuras «de ordenador» (vidrio, neón, gris azulado), de emojis en los menús ni de degradados brillantes.
- Nada de botones sin palabra, de dos botones con el mismo nombre que hacen cosas distintas, ni de modos ocultos.
- Nada de letra decorativa en el texto que se lee, ni de texto en latín sin traducir.
- Nada de mármol imperial dorado de película: la época es la República, de toba, teja y estuco pintado.

## FIN DEL ENCARGO
