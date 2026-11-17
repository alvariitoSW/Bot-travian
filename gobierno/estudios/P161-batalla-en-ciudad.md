# P161 · Batalla dentro de la ciudad «como defender Esparta» (17/11/2026)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte, mapa ni texto suyo.
Pedido del usuario: vídeo «Defendiendo ESPARTA | Una Batalla Realista en Total War ROME 2» (canal hugothester).

## Qué he visto de verdad
- **Visto**: ningún vídeo. YouTube entero bloquea a esta sesión (probado: descarga, página y navegador). Del vídeo, solo título y canal.
- **Leído y comprobado (17/11)**: el manual oficial de Rome II y la guía de GamePressure (enlaces abajo).
- **De memoria**: lo que no lleva enlace. **No sé**: qué ejércitos salen en el vídeo ni si lleva modificaciones.

## 1. Pregunta
¿Por qué una batalla dentro de una ciudad se siente tan distinta, y cuánto de eso cabe en AQVILA?

## 2. Observación (Rome II)
1. **La ciudad es el campo entero**, pero solo en las capitales de provincia: tienen mapa de ciudad propio. En los
   pueblos menores la batalla es en campo abierto «con el pueblo a lo lejos», que es lo que AQVILA hace hoy en todas. [Wiki oficial, capitales](https://wiki.totalwar.com/w/Capital_Cities_(TWR2).html)
2. **Se gana por los puntos de la ciudad**: hay varios puntos de captura que el defensor tiene que guardar; hay reloj. [Manual oficial](https://r2enc.totalwar.com/en/manual/single-player/0016_enc_page_campaign_play_military_attack)
3. **La calle manda**: las calles estrechas entre casas son «sitios excelentes para lanceros o falange». Pocos
   aguantan a muchos porque nadie los rodea. [Guía GamePressure](https://www.gamepressure.com/totalwarromeii/battlefield/ze5799)
4. **Muralla y máquinas**: una ciudad por provincia tiene muralla; para entrar se construyen escalas y tortugas en el
   sitio, antes del asalto. [Manual oficial](https://r2enc.totalwar.com/en/manual/single-player/0016_enc_page_campaign_play_military_attack)
5. **Edificios grandes** dentro de la ciudad sirven de puesto para los tiradores; conviene tomarlos o taparlos. (Guía GamePressure)
6. De memoria: el atacante elige por dónde entra y se reparte en varias calles; cuando una calle cae, el que pasa sale
   a la espalda de los demás y la batalla se decide de golpe.

## 3. Por qué funciona
Cambia la pregunta del jugador: en campo abierto es «¿por dónde flanqueo?»; en la ciudad es «¿qué calle tapo y con
quién?». El débil tiene una oportunidad real. Y el jugador pelea por algo que reconoce: sus casas y su plaza.

## 4. Traducción a AQVILA
Nuestro motor nuevo (`js/guerra.js`) ya piensa en **tres cuerpos**: ala izquierda, centro y ala derecha. Encaja solo:
- **Tres calles = tres cuerpos.** Cada cuerpo pelea en su calle hacia la plaza. Mismas cuatro órdenes de hoy.
- **Frente estrecho** (regla nueva, pequeña): en la calle solo luchan los que caben, unos 8 a 12 hombres de frente.
  El número cuenta menos; cuentan la calidad, el fondo y los relevos. Las lanzas largas valen más; la caballería, casi nada.
- **Sin flancos hasta que cae una calle.** Si un cuerpo rompe, sale a la plaza y coge a los otros por la espalda.
- **La plaza con reloj**: el atacante gana si la tiene 60 segundos; el defensor, si aguanta o lo echa.
- **Solo las ciudades grandes** tienen batalla de calles (como en Rome II); las pequeñas siguen en campo abierto.
- **Tamaño de la ciudad**: unos 400 × 400 m, de 150 a 300 casas de 0 A.D. en manzanas, calles de 8 a 10 m y una plaza
  de 60 m. La maqueta de ciudad densa (Q1c) ya midió 184 000 a 276 000 triángulos por cuadro; cabe en el móvil.
  Hoy la ciudad en batalla es un racimo pequeño al fondo.
- **Tu ciudad de verdad**, más adelante: las calles, casas y muralla que colocaste (`E.muralla.geo`) son el campo. Es CN12.
- **Dónde vive**: reglas en `js/guerra.js` (recibe «calles: ancho y largo» como contexto; sigue sin saber de economía);
  dibujo en `js/ui-guerra.js` y `js/gfx/`; el aviso de asalto, en `js/game.js`.
- **Pantalla a 390 px**: en horizontal, cámara alta sobre los tejados; al tocar una calle, baja a esa calle.

## Historia (280–146 a.C.)
- **Histórico (por cotejar con la skill `historia`)**: Esparta no tuvo muralla completa hasta Nabis (hacia 207–195);
  Pirro la atacó en 272 y lo frenaron con fosos y carros (Plutarco, *Pirro* 27–29). Combates de calle: Pirro muere
  en las calles de Argos, 272 (Plutarco, *Pirro* 32–34); Cartago, 146, seis días casa por casa (Apiano, *Libyca* 128–130).
- **Licencia de juego**: tres calles justas, el reloj de la plaza, el ancho fijo del frente.

## 5. Coste y riesgo
| Paso | Qué se vería | M aprox. |
|---|---|---|
| A. Maqueta «tres calles y una plaza» | Una ciudad griega sin muralla, grande; la defiendes en el móvil | 1,0 |
| B. Al juego: asalto a ciudad sin muralla o con brecha | Atacar o defender una ciudad ya es esta batalla | 1,5 |
| C. Muralla, puertas, brecha y escalas (absorbe CN12) | El asalto empieza fuera y entra | 2,5 |
| D. Tu propia ciudad como campo | Peleas en las calles que tú trazaste | 1,5 |

- Riesgos: fluidez con tantas casas y soldados a la vez (se mide en la maqueta A, en tu móvil); que el bot no sepa
  elegir calle; que defender sea demasiado fácil (se ajusta con el bot, como V10a).
- El arte es de 0 A.D. (ya lo tenemos, CC BY-SA 3.0). No se copia ningún mapa de Rome II.

## 6. Versión mínima
El paso A: una maqueta fuera del juego, con una ciudad de 400 m, tres calles y la plaza, y la regla del frente
estrecho. En diez minutos de móvil se sabe si esto es lo que el usuario vio en el vídeo.

## Decidido por el usuario (17/11)
- **Cuándo**: la maqueta A, lo primero tras la 1.0. No retrasa la 1.0.
- **Qué importa**: las cuatro cosas: tamaño de la ciudad, luchar en las calles, muralla y asalto, y su propia ciudad.
  Los cuatro pasos A a D quedan pedidos, en ese orden.
- **El vídeo**: «da igual, mira cualquier gameplay de Rome 2 en YouTube». No se pudo (YouTube bloqueado); se cotejó con fuentes escritas.
