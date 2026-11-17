# Maqueta GM44 · Soldado fino (hastatus hecho por código)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/soldado-fino/
Arrastra para girar, pellizca para acercar. Botones: Quieto, Andar, Lanzar, «Comparar con el de hoy», «Ver 40», «Ver la cara».

- `soldado.js`: el soldado entero (forma, huesos, texturas y movimiento), hecho desde cero con fórmulas. **Arte propio
  del proyecto**: no usa ni copia ningún modelo, textura o imagen de fuera.
- `vista.js`, `index.html`: el visor. `captura.mjs`: capturas (`node gobierno/maquetas/soldado-fino/captura.mjs <carpeta> nombre=consulta`).
- No toca `js/`, `css/` ni `sw.js`. El soldado de hoy (0 A.D., CC BY-SA 3.0) solo se carga para comparar.

## De dónde sale el detalle (referencias de época, solo para el equipo)
- **Relieve del «altar de Domicio Enobarbo»** (Louvre, hacia 100 a.C.; fotos de Wikimedia Commons, vistas el 17/11):
  escudo oval curvo con espina y umbo, casco con penacho, túnica corta, cinturón, espada al costado.
- **Polibio 6.23** (de memoria, sin cotejar): escudo de 4 por 2,5 pies con canto de hierro arriba y abajo y umbo de
  hierro; espada al muslo derecho; dos pila; casco de bronce con tres plumas negras o púrpura de un codo; pectoral
  de bronce de un palmo; greba.
- **Casco Montefortino**: forma conocida por hallazgos (cuenco con botón, cubrenuca corto, carrilleras).

## Dictamen histórico: APTO CON NOTAS
- **Licencia de juego**: el color rojo de la túnica y del escudo (no se conoce el de la época), las sandalias de
  correas (no documentadas tan pronto) y la greba solo en la pierna izquierda (probable, no seguro).
- **Pendiente (pedido del usuario, 17/11)**: él quería cuadros y láminas de libros de historia como referencia. Esta primera versión no los usó. Visto después: Henri Motte, «Batalla de Zama» (1890, dominio público): vélites con escudo redondo y venablos frente a los elefantes. Las láminas modernas (Connolly, Osprey) tienen derechos: se pueden mirar para aprender el equipo, no copiar ni meter en el juego.

## Medidas
8 698 triángulos, 19 huesos, 10 materiales, 0 MB de descarga de arte (todo se genera al abrir; el código pesa 34 KB).
Sin tarjeta gráfica aquí: las imágenes por segundo hay que mirarlas en el móvil («Ver 40» es la prueba dura: 40
soldados sin optimizar, 400 llamadas de dibujo).

## Lo que falta (primera versión)
- De cerca gana al de hoy en forma (cara con nariz y mentón, hombros, casco y escudo redondos, bronce que brilla) y
  en movimiento propio. **A media distancia el de hoy aún se ve más rico**: tiene músculos, cara y correas pintados a
  mano; el nuevo es más liso, algo de muñeco de barro.
- Manos en puño sin dedos; piernas y brazos con poco músculo; la cara es correcta pero sin carácter.
- Solo tres movimientos (quieto, andar, lanzar el pilum). Faltan golpe de espada, cubrirse, encajar y caer.
- Para el juego: hornear los movimientos como hace `js/gfx/units.js`, unir los 10 materiales en uno y dejar la figura
  fina solo para los 30–40 más cercanos.
