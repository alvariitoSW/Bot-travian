# CV · La ciudad como constructor de ciudades (aprobado el 23/11/2026)

**Qué es.** El objetivo de la ciudad tras el pedido del usuario del 23/11. **Aprobado con «1-A 2-B 3-A»**: el tiempo corre
solo en la ciudad; se construye directamente en el juego (sin maqueta aparte); Roma primero, luego griega y púnica, íbera y gala al final. Completa `CI0-objetivo-ciudad.md` (aspecto) y `CE1-objetivo-cerebro.md`
(economía); donde choque con ellos, decide el usuario. No se ha construido nada.

## 1. Pedido (literal)
«Me gusta pero se tiene que parecer más a los vídeos. Además hay que enfocarla en city builder, o sea la ciudad tiene
que tener necesidades, tiene su ritmo de juego, que no vale con darle a pasar estación. Tienes que repensarlo y tener eso
en cuenta, además habrá diferentes tipos de ciudades, diferentes culturas etc». Volvió a subir tres de los clips del
constructor de Iberia (pueblo, estaciones, tamaño); su ficha está en `REF-batallas-referencias.md`, «Fichas del 23/11».

## 2. El objetivo, en una frase
**La ciudad es un sitio donde siempre pasa algo y siempre falta algo**: la miras desde arriba, ves a quién le falta qué,
y lo arreglas construyendo; si no haces nada, se nota en la calle.

## 3. Qué hay hoy y qué falla
Hay: barrios que suben con agua, templo y mercado; crecidas, incendios y hambre de invierno; estaciones; 56 vecinos, humo,
cuadrillas de obra; tres aspectos (latino, griego, púnico); tipos de terreno. Falla: el tiempo solo avanza al pulsar
«Pasar turno»; las necesidades son cifras en una ficha; la urbe es una diana con cuatro casas repetidas; en plano se ve
oscura y sucia frente a la referencia (clara, cálida, colores planos, sombras nítidas).

## 4. Los cuatro cambios
1. **Ritmo propio.** Dentro de la ciudad el tiempo corre solo, con pausa y dos velocidades. Una estación dura lo
   bastante para hacer cosas (a medir en maqueta; hoy son 12 s). «Pasar estación» queda como atajo, no como forma de jugar.
2. **Necesidades en escalera.** Cada casa pide según su nivel: agua → grano → leña en invierno → templo → mercado →
   bienes (vino, aceite) → ocio (juegos, termas). Cubiertas, la casa sube (choza → casa → atrio → ínsula); sin cubrir un
   tiempo, baja o se vacía. Se ve sobre el sitio (letrero, cola, corrillo), no en una ficha. Parte de lo que ya hay
   (`nivelBarrio`, `sirve` en `js/ciudad.js`).
3. **Cadenas con gente.** Granja → granero → mercado; cantera y bosque → obra. Hacen falta manos y la distancia cuenta:
   lejos, rinde menos. Los vecinos que ya pasean llevan esa carga. Los montones junto a cada edificio son el almacén real.
4. **Parecerse a los vídeos.** Vista de plano clara y cálida, colores planos, sombras nítidas, hierba con flores, campos a
   rayas, agua azul, árboles de copa redonda; urbe sin diana, con calles que nacen del foro, casas distintas y un edificio
   que manda (CV4a, CV4b, ya aprobadas).

## 5. Tipos de ciudad y culturas
- **Por sitio** (ya existen terrenos): ribera (riego y crecidas), costa (puerto, sal, pesca), cerro (defensa, poca agua),
  llano de grano, sierra minera. Cada uno cambia qué sobra y qué falta, no las reglas.
- **Por cultura**: mismo motor, distinto plano, casas, edificio mayor y un gusto propio.
  | Cultura | Plano | Casa | Edificio que manda | Pide además |
  |---|---|---|---|---|
  | Latina | calles torcidas, foro | atrio, ínsula | templo toscano en lo alto | juegos, foro |
  | Griega | cuadrícula, ágora | casa de patio | templo dórico, teatro | teatro, gimnasio |
  | Púnica | cuadrícula y puertos | casa alta de azotea | santuario, puerto | puerto, cisternas |
  | Íbera, gala | cerro cercado, sin cuadrícula | choza redonda o de adobe | casa del jefe | ganado, hierro |
  Latina, griega y púnica ya tienen aspecto (CI0). Íbera y gala piden arte nuevo de 0 A.D. (skill `arte`) y dictamen de
  `historia`.

## 6. Lo que no se promete
Un vecino simulado por habitante; agua que corre de verdad; miles de casas con detalle de cerca. En un móvil: unas 100
figuras, casas ligeras de lejos, y el salto de ciudad a mapa sigue siendo un cambio de pantalla.

## 7. Riesgos
- **Choca con la 1.0**: es más que la lista corta. CE1 fijó «cada estación te falta algo y eliges», por turnos.
- **Toca reglas** (`js/ciudad.js`, `js/game.js`): pruebas, bot de campaña y partidas guardadas.
- **El ritmo no se acierta sobre el papel**: hay que jugarlo. Por eso se propone una maqueta jugable antes de tocar el juego.
