# REF · Politeia: referencias de arte y encargo a Arte, Arte de Mapas y Mesa de la Polis · 26/11/2026

Escrito por la sesión GP1 (diseño, Fable). No toca el juego. No es un dictamen de los departamentos: es el **encargo**
para que lo den ellos, con una primera cuenta mía marcada como provisional.

**Pedido del usuario** (26/11, literal): «Tienes aquí diferentes imágenes para que el departamento de arte se coordine con
el departamento que monta el juego de política guarde todas estas imágenes para hacer algo parecido a imagen y semejanza.
Y que intervenga el director de creación de mapas y ciudades para tomar referencias de como se podría ver a nivel visual
la ciudad final y lo que costaría hacerla y como habría que crearla».

## 1. Dónde están guardadas
**Página privada del usuario**, con las seis imágenes y su ficha: https://claude.ai/artifact/1g4qTQJiTAuBbEQoTp9upv
(otra sesión suya las lee con la herramienta de artefactos; archivos `img/01`…`06`).
**No están en el repositorio**, por la regla del propio usuario del 19/11 (las referencias no se guardan aquí porque
todo lo del repositorio se publica con el juego) y porque su origen y licencia no están verificados. Si el usuario
quiere que entren en el repositorio, tiene que decirlo: cambia esa regla.

## 2. Ficha de ideas (qué se ve y qué se toma)
| N.º | Imagen | Qué se toma |
|---|---|---|
| 05 | La ciudad, **móvil de pie**: calle empedrada del mercado a la acrópolis, estandarte en primer plano, mar al fondo | La **vista principal**. Interfaz casi invisible: una línea de cifras arriba y cuatro medallones abajo |
| 04 | Política, **móvil de pie**: ciudad a vista de pájaro arriba, panel de pergamino abajo, retrato con estandarte y prestigio, pestañas, ley con su ilustración, barra de cinco botones | Cómo **conviven ciudad y panel** en vertical. El retrato del jefe de casa. Las ilustraciones pequeñas dentro del pergamino |
| 06 | Cinco lugares: Consejo (atardecer), Tu casa (noche y luna), Tribunal (rayos de luz), Santuario (fuego), Puerto (día) | **Una pintura por lugar, cada una con su luz**. Título y una línea de «qué se hace aquí». La acrópolis al fondo une todas |
| 03 | Puerto al atardecer, apaisado: vasijas, uvas, sacos, vela con emblema, minimapa redondo | El **primer plano cuenta la economía**. El emblema en velas y telas |
| 02 | Ágora de día, apaisado: toldos, estatua, pórtico, gente | Mercado vivo; pergamino con acciones y precio |
| 01 | Asamblea al atardecer, apaisado: gradas, tribuna, antorchas, visto desde detrás de un ciudadano | **Estás dentro de la sala** |
**Estilo común**: pintura realista y cálida, luz de hora dorada, mármol y teja, estandartes azules con emblema,
pergamino y bronce en la interfaz, muy poco texto.
**Lo que dicen de más**: cuatro de las seis piezas nuevas son **de pie** → encaja con la respuesta 24 del usuario
(móvil de pie) y resuelve ese choque. **Lo que no se toma**: las tarjetas «Apoyar / Rechazar / Votar ahora» (el
usuario quiso dejar atrás el «solo pulsar»); la palabra «Senado» y los dracmas en 594 a.C.; el Partenón antes de 447 a.C.

## 3. Lo que se pide a cada departamento
**Taller de Arte** (skill `arte`): 1) decir **de dónde puede salir** pintura así con licencia libre verificada
(hecha por nosotros a partir de nuestra ciudad 3D, generada con una herramienta cuyas condiciones lo permitan, o
encargada); 2) una **guía de estilo** de una página (luz, paleta, telas, emblemas, interfaz de pergamino y bronce);
3) **presupuesto de peso** por pintura y total, contra el tope de descarga (`gobierno/arte.json`: 56 MB hoy; el plan
2.0 habla de ~80 MB); 4) una **pintura de prueba** de un lugar, partida en capas.
**Arte de Mapas y ciudades** (skill `arte-mapas`, con Ciudades del Cerebro): 1) cómo se vería **la ciudad final** a
este nivel y **con qué técnica**; 2) **cuánto costaría** y en qué tandas; 3) cómo hacer que la pintura **copie lo que
el jugador ha construido** y **crezca por épocas**; 4) qué parte de la ciudad 3D actual (`js/gfx/city3d.js`, del
Cerebro/Músculo) se aprovecha. Con maqueta y capturas a 390×844, como manda su guía.
**Mesa de la Polis** (la que monte la política): dar a los dos anteriores la **lista cerrada** de lo que hay que
pintar (lugares, etapas, piezas vivas, retratos) y los **tamaños y capas** que necesita la pantalla.
**Vigía**: abrir esas sesiones y ordenar los pases; esta sesión no toca tablero, bitácora ni plan.

## 4. Primera cuenta, provisional (mía; la corrigen los departamentos)
**Qué habría que pintar para una polis** (Atenas), si la ciudad crece en tres etapas (aldea de nobles, ciudad arcaica,
ciudad clásica):
- Vista principal de la ciudad, de pie: 3 (una por etapa).
- Seis lugares (Consejo, Ágora, Tu casa, Tribunal, Santuario, Puerto): de 6 (una etapa) a 18 (tres etapas).
- Retratos de jefes de casa: 5–8. Ilustraciones pequeñas de leyes e hitos: 12–20. Emblemas: 5.
Total: **de 30 a 55 imágenes por polis**. Con ocho polis, pintarlo todo distinto no cabe: habría que compartir
lugares entre polis y cambiar solo la vista principal, los emblemas y dos o tres escenas propias.

**Tres caminos para crearlo**:
| Camino | Cómo | A favor | En contra |
|---|---|---|---|
| A · Pintura por capas | Cada escena es una imagen partida en 3–4 capas (cielo, fondo, medio, primer plano) que se mueven distinto, con luz, humo, agua y gente encima | El aspecto de las referencias. Ligero para el móvil. Es lo que enseña la maqueta | No copia de verdad lo que construyes: hay que pintar variantes o piezas sueltas que se encienden. La licencia depende de cómo se pinte |
| B · La ciudad 3D mejorada | Subir la ciudad 3D que ya hay (modelos de 0 A.D.) con mejor luz, cielo y cámara a pie de calle | Copia exactamente lo que construyes. Licencia limpia. Una sola técnica | No llega a ese nivel de pintura en un móvil. Es el trabajo más largo |
| C · Mezcla (**la que yo miraría primero**) | Sacar las vistas de **nuestra propia ciudad 3D** en un programa de 3D fuera del juego, con buena luz, y repintarlas; en el juego van como pintura por capas. Los edificios del jugador son **recortes** que aparecen sobre la pintura | Aspecto cercano a las referencias, **licencia limpia** (sale de nuestros modelos) y copia lo construido por piezas | Hay que montar esa cadena de trabajo y probar que el resultado convence |

**Peso** (cuenta gruesa): una escena de pie a buena calidad, en 3–4 capas, ronda 0,5–0,9 MB. Una polis con 30–55
imágenes: **15–35 MB**. Ocho polis sin compartir no caben en ~80 MB; compartiendo lugares, sí. Lo decide Arte.
**Gasto de construcción** (sin contar el arte en sí): escena por capas, cámara, piezas vivas y recortes de edificios,
≈ 6–8 M; ya estaba dentro de los ≈ 40 M de Politeia como «vasija y arte» (≈ 6 M) y sube algo. **El coste grande es
hacer las imágenes**, y eso no puedo cifrarlo yo: depende del camino y lo dirá el taller.

## 5. Avisos de historia (para quien pinte)
Atenas en 594 a.C. no tiene Partenón (447–432 a.C.) ni moneda de la lechuza (c. 515 a.C.); el Consejo y la Asamblea
no son «Senado». Tres etapas con edificios de su siglo; la lechuza como emblema de la polis, bien; los emblemas de las
casas (caballo, delfín, carnero, gallo, abeja) son licencia de juego.

## 6. Cambios que esto pide en la maqueta
La maqueta «en juego» está apaisada; las referencias nuevas la piden **de pie**: ciudad arriba (imagen 05), panel de
pergamino abajo (imagen 04) y una pintura por lugar (imagen 06). Siguiente vuelta, si el usuario la quiere.
