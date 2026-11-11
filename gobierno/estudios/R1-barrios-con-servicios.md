# R1 · Barrios que suben y bajan según sus servicios (Caesar III)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos del juego.

## 1. Pregunta
¿Cómo hace Caesar III para que una casa pase de choza a villa (y vuelva atrás) según lo que la rodea, sin que el jugador toque la casa?

## 2. Observación
- La casa no se construye ni se mejora: el jugador pone calles y servicios, y la casa **evoluciona sola**. Con agua, la tienda pequeña pasa a grande; los niveles siguientes piden más. [Gamicus](https://gamicus.fandom.com/wiki/Caesar_III)
- Cada nivel pide una mezcla de **servicios** (agua, religión, ocio, educación), **bienes** (comida, cerámica…) y **entorno agradable**. [Gamicus](https://gamicus.fandom.com/wiki/Caesar_III), [Gamicus, serie](https://gamicus.fandom.com/wiki/City_Building_Series)
- Un entorno sucio y ruidoso (taller, fuerte) no gusta a las casas altas; estatuas, jardines y templos sí. [Gamicus](https://gamicus.fandom.com/wiki/Caesar_III)
- Los niveles altos piden **variedad de comida**, no un alimento concreto. [Gamicus](https://gamicus.fandom.com/wiki/Caesar_III)
- Si falta algo, la casa no sube; y si sigue faltando, **baja, pero con retraso**: un contador evita que baje a la primera falta. (Visto en una reimplementación libre; puede no coincidir con el original.) [Augustus, house_evolution](https://grok.dragonflybsd.org/xref/dports/games/augustus/augustus-3.1.0/src/building/house_evolution.c)
- El servicio llega por **personajes que caminan por la calle** y «marcan» las casas que tocan; la marca caduca cada mes si no vuelven. (Documento de un motor derivado, vale como analogía.) [Akhenaten, wiki](https://dalerank.github.io/Akhenaten/wiki/dev/housing/services.html)
- Sin confirmar: cuántos niveles hay, la lista exacta de requisitos por nivel y los umbrales de atractivo. No se pudo abrir la guía detallada (la red del contenedor bloquea esas webs).

## 3. Por qué funciona
El jugador no gestiona casas, gestiona **barrios**. Ve qué calle no sube y entiende por qué (le falta algo). Es un acertijo de colocación, y la recompensa (más impuestos, más gente) se nota sola.

## 4. Traducción a AQVILA
- Hoy: ciudad con 7–10 solares (I4), felicidad e impuestos (B3), termas, acueducto y anfiteatro (B4), templo (F5).
- Propuesta: **no hay calles ni casas sueltas**. Cada ciudad tiene un «nivel de barrio» (1 a 4) que depende de qué servicios tiene: agua (acueducto), comida (grano que sobra), ocio (anfiteatro), religión (templo), higiene (termas). Más nivel = más población máxima e impuestos; sin servicios, **baja un nivel tras 2–3 meses** (retraso, para no castigar un descuido).
- Cada servicio ocupa solar (ya lo declaran con `solar: 1`), así que el reparto de solares se vuelve la decisión central. Encaja con I4.
- Lógica en `js/data.js` (tabla de niveles y requisitos) y `js/game.js` (cálculo mensual junto a la felicidad B3; migrar el campo en `G.load`). Visual en `js/ui.js`: una fila de 5 iconos en la ficha de ciudad (relleno si lo cubre, gris si falta) y la medalla de J6 con el nivel. La ciudad 3D podría cambiar de aspecto en `js/gfx/city3d.js` (más tarde, es arte).
- Con J3 (capital y pueblos): la capital pide todo; los pueblos pocos servicios. Con P65 (Foro y chips): los chips de servicio son el sitio natural. Choca con B3 si felicidad y nivel se calculan por separado: hay que decidir que el nivel **sea** parte de la felicidad.
- Época: **licencia de juego** (Roma sí tenía acueductos, termas y ludi, pero el sistema por niveles no es histórico).
- Móvil: 5 iconos caben a 390 px. Offline: no afecta.

## 5. Coste y riesgo
- Una tarea media: 1 sesión, 0,7–1,5 M de tokens (dato del tablero); unos 1,0 M con ajuste de números (A8 costó el doble por eso).
- Riesgo: el bot de las pruebas (hoy gana 9 de 10) puede cambiar. Si el nivel bloquea el crecimiento sin que se vea por qué, frustra: lo mitiga el consejo de J6 («te falta agua»).

## 6. Versión mínima
Tres niveles por ciudad que dependen de agua, comida y templo, con un solo aviso en la ficha («sube al tener agua») y bajada con retraso.
