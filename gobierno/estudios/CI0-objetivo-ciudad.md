# Cerebro · Objetivo final de la ciudad (CI0, 18/11/2026)

**Qué es esta página.** El detalle de la línea **L1** («Una ciudad que construyes y ves crecer») de
`gobierno/OBJETIVOS.md`, que manda sobre todo. No es una tarea: es la vara con la que se mide toda tarea de ciudad. Solo
la cambia el usuario. Copia la forma de la página de las batallas (TP0). No se ha construido nada.
Láminas: `historia/laminas-ciudades.md` y su hoja `capturas-tarea/CI0-laminas-hoja.jpg` (los números «L.n» de abajo).

## 1. El objetivo, en una frase
**Tu ciudad es el espejo de cómo gobiernas**: al mirarla, sin abrir menús, sabes si la plebe está contenta, quién
manda en el Senado y de qué vives; y parece una ciudad de su siglo y de su pueblo.

## 2. De dónde sale (palabras del usuario, 18/11)
- «hay que recopilar imágenes de ciudades de la época, dibujos de libros de historia, recursos de imagen para saber hacia donde tirar en esta parte de construir una ciudad».
- «lo que hay funciona, pero no tiene ninguna relación con el gobierno, y aún hay que mejorar el aspecto de gráficos y visual».
- Elegido en el cuadro: «A · Primero una página de objetivo de la ciudad con las láminas reunidas, sin construir nada».
- De PO1: «lo que no toca la ciudad, sobra»; «crucial: que todo converja ahí».

## 3. Qué hay hoy (y se queda)
Fundas, colocas cada edificio con el mapa de colores, las calles y las casas nacen solas, los barrios suben de nivel
con agua, templo y mercado, hay crecidas e incendios, estaciones, gente por la calle, y tres aspectos (romano, griego y
púnico) con las casas de 0 A.D. (`js/ciudad.js`, `js/gfx/city3d.js`). Capturas: `Q1k-5-barrios.jpg`, `Q1k-5b-cerca.jpg`,
`Q1b2-5-punica-cerca.jpg`, `Q5-2-ciudad.jpg`. **Lo que vale y no se rehace**: colocar con el dedo, el crecimiento solo,
los barrios, los peligros, las estaciones, las tres culturas.
El gobierno vive aparte: la sala del Senado (`SN2-1-sala.jpg`) y las clases son una ficha con cifras. En la ciudad
no hay curia, ni barrio de una clase, ni nada que cambie cuando el Senado vota o la plebe se enfada.

## 4. Qué se ve cuando está bien hecha (con las láminas delante)
**Lo común**: la ciudad es **apretada** (casas pared con pared, calles estrechas; L.8, L.20); los templos y los
edificios de gobierno son lo más alto y se ven desde lejos (L.5, L.12); crece en una ladera, no en un llano (L.12).
| | Latina (Roma, Capua) | Griega (Siracusa, Tarento) | Púnica (Cartago) |
|---|---|---|---|
| Plano | calles torcidas en las colinas (Livio 5.55) | cuadrícula con ágora rectangular | cuadrícula en Byrsa; puertos (L.17–21) |
| Casa | atrio cerrado a la calle, tiendas en la fachada, teja roja a cuatro aguas; ínsulas de 3 pisos al crecer (L.6, L.7) | casa de patio, muro blanco, tejado bajo | casa alta de azotea plana, estuco blanco, cisterna (L.18, L.20) |
| Templo | toscano: podio alto, columnas solo delante, alero ancho y terracotas pintadas (L.2, L.3). **No mármol** | dórico de piedra clara estucada, columnas alrededor (L.10) | santuario de patio; poco tejado rojo |
| Centro | foro alargado con tiendas, **curia** y **comicio** redondo | ágora con pórticos (estoas) y teatro en la ladera (L.9, L.11, L.12) | plaza junto al puerto; isla del almirante |
| Muralla | sillares de toba ocre-gris, lisa, sin almenas (L.1) | sillares claros con torres (Euríalo, tanda 1) | doble o triple muro hacia el istmo (L.19) |
| Colores | toba ocre, enlucido blanco, zócalo rojo, teja terracota | caliza y estuco blancos, cornisas pintadas | blanco y ocre, azoteas pardas |
**Al crecer**: chozas → casas de atrio → ínsulas; foro de tierra → foro empedrado (Livio 41.27, 174 a.C.); templo de
madera y terracota → de piedra. El mármol solo al final (146 a.C.).

## 5. Cómo se une al gobierno (lo mismo que ya funciona, ahora a la vista)
Regla: **la ciudad no inventa reglas nuevas; enseña las que ya hay** y sirve de puerta a ellas.
- **Clases**: cada una tiene su barrio. Ciudadanos, casas de atrio en la colina; plebe, ínsulas junto al río y el
  mercado; esclavos, en granjas y talleres. Su ánimo se ve en la calle: contenta, mercado lleno y humo de hornos;
  descontenta, corrillos en el foro, obras con lona parada y pintadas en los muros (las de Pompeya son reales);
  muy mal, un cortejo de protesta. Tocar un barrio dice quién vive y qué pide. Es lo que ya pide **CS2** (aprobada).
- **Senado**: la **curia** y el **comicio** están en el foro y tocarlos abre la sala de hoy. Lo votado se ve:
  la obra votada aparece con su andamio, el triunfo cruza la ciudad, los juegos levantan gradas de madera, el reparto
  de grano hace cola en el granero. Los bandos salen de tu ciudad (granjas, mercados, cuarteles): cada barrio luce
  los colores de su bando, y así se ve de dónde salen tus escaños.
- **Economía**: graneros llenos o vacíos, montones en el almacén, barcos en el puerto según tus rutas; con el oro en
  rojo, las obras se paran a la vista.
- **La ciudad responde**: un barrio contento da sus votos en la sala; uno enfadado los quita y lo dice.
- **Supuesto**: PO1 recomendó un solo Senado, el del juego, y CE1 lo está cerrando con el usuario. Si CE1 elige en su
  lugar el «modo Gobierno» de EV8, la ciudad del juego sigue siendo la misma, pero las escenas (banquete, juicio del
  Senado, plan del año) se pondrían en el foro en vez de en su ciudad dibujada: cambia dónde se ven, no esta página.
  Si CE1 elige la barra de Autoridad con cargos, tu casa en la colina crece con cada cargo y el foro gana tu estatua.

## 6. Qué falla hoy en el aspecto (capturas citadas en §3)
1. **Casa medieval**: una casa de entramado de madera, como de aldea del norte, en pleno barrio romano (`Q1k-5b`, derecha).
2. **Murallas de castillo**: almenas y torres medievales (`Q1k-5`, `Q1k-5b`); la de Roma era lisa (L.1).
3. **Templo de mármol blanco**: en Roma, de 280 a 146 a.C., era de toba y terracota pintada (L.2, L.3).
4. **Ciudad suelta**: casas separadas sobre la tierra, mucho hueco; parece un pueblo, no una urbe (L.8, L.20).
5. **Sin centro**: el foro es una fuente en una explanada; falta curia, comicio y tiendas.
6. **Dos caras**: la ciudad de `Q1k` tiene su barra y sus botones; la del juego (`Q5-2`), otros, con iconos flotando
   y un panel oscuro que tapa dos tercios. Va con L13 (un solo aspecto).
7. **Suelo**: textura que se repite a la vista (`Q5-2`).
Lo que está bien: la púnica blanca y apretada (`Q1b2-5`) es la que más se parece a las láminas.

## 7. Tareas que saldrían (PROPUESTAS; nada entra sin el sí del usuario)
Pocas, a propósito («converger»). Ninguna abre línea nueva: L1, L3 y L4 ya están en la 1.0.
1. **Que el gobierno se vea en la ciudad** → **se mete en CS2** (aprobada, L3), que crece de ≈0,6 a ≈0,9 M: barrio por
   clase, ánimo en la calle, curia y comicio en el foro que abren la sala. Las escenas de lo votado (obra, triunfo,
   juegos, grano) van **dentro del plan de CE1**, sin tarea aparte. **Cabe en la 1.0.**
2. **CI1 · Roma de su siglo** (≈1,0 M; Opus; skills `arte` e `historia`): templo toscano de terracota, muralla de toba
   sin almenas, fuera la casa medieval, manzanas apretadas, foro con tiendas. Con piezas libres (0 A.D. tiene romanas
   republicanas). **Cabe en la 1.0 dentro de L1**; si no se quiere sumar, no sale otra línea: va detrás.
3. **CI2 · Griega y púnica de su siglo** (≈0,8 M): **detrás de la 1.0**. La campaña se juega desde Roma.
Suma para la 1.0: **≈1,3 M** (0,3 dentro de CS2 + 1,0 de CI1).

## 8. Historia (dictamen: APTO CON NOTAS)
- Calles torcidas de Roma por reconstruir deprisa tras los galos: Livio 5.55 (**histórico**). Casas de tres pisos en 218
  a.C. (un buey sube a un tercer piso): Livio 21.62 (**histórico**). Empedrado de calles por los censores en 174 a.C.:
  Livio 41.27 (**histórico**). Primer templo de mármol en Roma, h. 146 a.C.: Veleyo Patérculo 1.11 (**histórico**).
  Primera basílica, la Porcia, 184 a.C.: Livio 39.44 (**histórico**). Templo toscano: Vitruvio 4.7 (**histórico**).
- Casa de atrio: Vitruvio 6.3; Casa del Fauno, s. II a.C. (**histórico**). Cartago con casas de seis pisos y puerto circular:
  Apiano, *Púnica* 96 y 128 (**según Apiano**); barrio de Byrsa: S. Lancel, *Carthage*, 1995 (**histórico**). Azoteas planas y
  estuco blanco: **probable**. Cuadrícula griega: Aristóteles, *Política* 2.8 (**histórico**).
- **Licencia de juego**: barrios separados por clase (en Roma ricos y pobres vivían más mezclados), colores de bando en
  los barrios, y que un barrio dé votos en el Senado.
- Anacronismos hoy: almenas medievales, casa de entramado y templo de mármol (§6).
