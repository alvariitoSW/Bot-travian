# GM43c · Encargo para la sesión nueva: el testudo a pie, hecho bien (17/11/2026)

Pedido del usuario: «abrir otra sesión para que lo construya Fable 5.2 en alto […] para hacerlo bien con lo que ya hemos
creado». Excepción, solo para el testudo, a «Fable dirige y Opus construye». Aquí **Fable construye**.

## Qué hay (no empezar de cero)
- Maqueta `gobierno/maquetas/testudo-a-pie/` (`index.html`, `vista.js`, `captura.mjs`). No toca `js/`.
- El usuario la probó en su móvil, **en vertical**: «Me encanta… como base es perfecta. Hay que pulir ahora cosas».
- Publicada (versión anterior al pulido): https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/testudo-a-pie/
- Capturas: `gobierno/capturas-tarea/GM43-*.jpg` y `GM43b-*.jpg`. Fases por URL: `?fase=avance|flechas|testudo|cara|roto|pila|carga|final`.
- Ya funciona: avanzar (mantener), correr con aliento, escudos arriba, salvas con ~40 % de fallos, venablos finos que no
  se clavan en figuras, escudo propio que se agrieta y se parte en 4 golpes, sacudida de cámara, gritos escritos,
  lanzar pila, cargar, tarjeta final.

## Lo que pide el usuario (literal)
«que se te rompa el escudo, hacer los pilum más realistas y que no atraviesen así al personaje, que algunos se caigan al
suelo y no impacten, poder avanzar más rápido o correr unos metros, y luego en la formación de testudo se ve el escudo
del compañero […] basándonos más en el juego de Ryse […] quiero poder ver la cara a mi personaje y que ponga gestos y se
mueva la pantalla cuando caen las salvas de flechas o de lanzas». Y: «Falta el sonido también, los gritos de los
soldados, las salvas cayendo».

## Lo que sigue mal (mirar las capturas antes de tocar)
1. **Encuadre bajo los escudos (lo principal).** No se logró el de Ryse. Hoy tu soldado sale de espaldas (nuca negra del
   modelo) y en vertical queda fuera de cuadro. En `GM43b-h-cara.jpg` y `GM43-v-3-testudo.jpg` el techo está
   descolocado: escudos torcidos, huecos por los que se ve cielo, una mitad a oscuras.
2. **Desfase sin explicar** entre donde la cámara cree que está la figura y donde se dibuja (el constructor lo ajustó a
   ojo). Encontrar la causa antes de encuadrar nada: sospechar de `UNIT_SCALE`, del origen del modelo y de la matriz por instancia.
3. Vertical: el techo ocupa casi media pantalla; en marcha solo se ven dos hombres.
4. Aún asoma el escudo propio del modelo vecino (rojo, abajo a la derecha). Es parte de la malla de 0 A.D.
5. Los hastati llevan espada en la mano, no pila. No hay animación de lanzar ni de cubrirse.
6. Sonido: solo cuatro ruidos hechos por código. Faltan gritos, salva y golpes creíbles.

## Lo visto de Ryse (solo miniaturas de tres vídeos; YouTube no deja reproducirlos; ideas, nunca su arte)
- **Bajo los escudos** la cámara va **dentro y de lado**: el perfil o tres cuartos del protagonista llena el tercio
  izquierdo (cara, hombro, brazo), la espalda del compañero el derecho; arriba, el canto de los escudos del techo; en
  medio, un hueco estrecho con el enemigo. Poca luz dentro, fuerte fuera.
- **En marcha**, cámara detrás de cuatro hombres en fila, a la altura de los hombros.
- Arriba a la derecha, objetivo en una línea («Mata a los arqueros») y barra de salud de los romanos. Gritos subtitulados.

## Qué se espera
1. Arreglar la causa del desfase y rehacer el testudo con orden: techo de escudos solapados como tejas, sin huecos, y
   pared delantera; todo colocado desde la posición real de cada hombre.
2. Cámara de Ryse bajo los escudos, **en vertical y en horizontal**. Si la nuca y la cara del modelo no aguantan de
   cerca, decirlo y proponer (skill `arte`, licencia libre comprobada); no inventar arte de juegos comerciales.
3. Gestos con lo que hay: encogerse, agachar la cabeza, girar al escudo; compañeros con desfase.
4. Sonido: mejorar lo sintetizado (salva que silba y cae, golpes en madera, cuerno, pasos). Voces: solo con audio
   CC0/CC BY comprobado y crédito; si la red no llega, dejarlo propuesto.
5. Probar jugando de verdad (Playwright, 390×844 y 844×390), mirar cada captura y no dar nada por hecho sin verlo.

## Límites y reglas
- Solo `gobierno/maquetas/testudo-a-pie/` y capturas. Nada de `js/`, `css/`, `assets/`, `sw.js`.
- Época 280–146 a.C.: escudo ovalado, cota de malla o pectoral. Testudo en campo abierto: licencia de juego aprobada.
- Los que tiran son peltastas: «venablos», no flechas (no hay arqueros en el arte).
- Presupuesto: 2 M. Con alerta de `node gobierno/gasto.mjs`, parar y contar al usuario.
- Cierre: `captura.mjs` APTO, `node gobierno/jueces.mjs` APTO, tablero (GM43c), bitácora, parte, commit y push a su
  rama. **No subir a la rama del juego sin el sí literal del usuario.** Enseñarle capturas en vertical.
