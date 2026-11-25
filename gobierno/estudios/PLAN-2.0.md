# Plan de la 2.0 — BORRADOR (en debate con el usuario)

Abierto el 25/11/2026 por pedido del usuario (literal, ~11:20 Madrid): «como hacemos el plan para el 2.0 y le incluimos
las críticas que haré al 1.0? Necesito debatirlo en una nueva sesión donde me aparezca todo lo que haya en bitácora».
Rama `plan-2.0`. **Sin aprobar**: hasta su «sí» no se toca TABLERO, BITACORA, lista.json ni el cuadro (los lleva el vigía).

Estado: 1.0 en `main` = v168 (SB6). La subida final SB7 (v171) está en prueba.

## 1. Críticas del usuario a la 1.0
Literales y con fecha. Fuente: este chat y el botón «Juzgar la 1.0» del cuadro (colección `juicio`: vacía el 25/11 ~11:40).

- (pendiente: el usuario juega la v171 cuando llegue)

## 2. Inventario de partida (todo lo que había en la bitácora el 25/11)
Fuentes: `BITACORA.md` (rama del juego, 67d0671), entradas del 24/11 solo en `ccr-ee9e87a2-wh0o23`, `lista.json`,
`camino.json`, `TABLERO.md` (105 tareas «en pausa») y la colección `pedidos` del cuadro (194, todas aplicadas).

### 2a. Nevera «Después de la 1.0», por área
**Batallas**
- Arqueros y honderos contra la falange a pie; brazos que no atraviesan escudos ni picas; rival a pie con soldados de Meshy (P186–P188).
- Maquetas de luz y hora del día (CR4, CR4b) y «motor de lucha» (CB1), acabadas solo como maqueta.
- Elefante que empuja: tus filas reculan y se doblan (FE3).
- Regla del 15 % también con caballería, falange y hoplitas; hoplitas y Batallón Sagrado bajan a pie con lanza corta.
- Jinete con movimientos propios (caballería y elefantes con el soldado nuevo).
- Pellizcar para acercar la cámara en la batalla.
- Escaramuzas como Rome II: hora y clima, presupuesto en monedas, batallas históricas con escenario.
- Batallas famosas (Heraclea, Cannas, Zama), retos y medallas; edificio sanitario; mezcla libre de pueblos.
- Asalto a la muralla completo (escalas, torres, ariete, calles), refuerzos, emboscadas, clima, máquinas, minimapa, repetición, modo foto (BG1; sin confirmar).
- Batalla dentro de la ciudad (P161; estudio rescatado en rama).
- Asedio entero de las ciudades (L10).
- Detalles de mando «como Rome II»: brillo bajo la tropa, ruta de la orden, minimapa, avisos del asesor, portaestandarte (P163).
- Más tipos de tropa: de 20 a ~35 (P159).
- Más civilizaciones jugables: Cartago primero (P160).
- Tarjetas de tropa con dibujo de tinta propio (P162).
- Guerra «como Rome II», el resto tras GM22 (P158/GM42).
- Dificultad que cambie también al enemigo (V10a).
- Escaramuza combinada: ES5 (flanco débil, arte de itálicos y tiradores).
**Ciudades**
- Calibrar el camino de la ciudad con bots que crezcan, hasta 4–7 de 10 (CE12).
- Mirar por qué Aníbal toma Roma hacia el 216 a.C. con 600 de guarnición.
- Embellecer la ciudad (CD6).
- Pulido de la ciudad (CI1c): casas sin cuadrícula, río, arco, templo, granja.
- «Más ciudad de verdad» y dos mapas: el vivo y una Roma grande (Roma 3D, RM1–RM7).
- Ciudad «tipo Nova Roma» (P164; tres decisiones pendientes).
- Ciudad griega y púnica de su siglo (CI2).
- Edificios: estudiar, rehacer y crear nuevos; herrería, campo de entrenamiento, mercenarios; con Meshy (ED0).
- Bot que ponga servicios (baños, mercados); el asesor aún habla de la «bandeja».
- Detalles del mapa: sitio con colonos que se esconde, fecha partida en dos líneas.
**Política**
- Calibrar el camino de la política con bots (Senado activo) hasta 4–7 de 10 (CE12).
- Camino de la ciencia (CE11), fuera de la 1.0.
- Senado: nombres de cónsul (SN3), dictador, triunfo y fama, pantalla de resultado más rica, títulos largos.
- Votaciones de verdad con hemiciclo (maqueta MR1-4).
- Plan del año; senadores en 3D; otras formas de ganar.
- Imagen de época (moneda, relieve, mosaico) en cada suceso y en el Senado (P158); vídeos con piezas de museo (P165).
**Mapa y menús**
- Pequeños de aspecto: hoja de Escaramuzas, aviso de pausa, «Pirro» y «Tu manípulo» cortados, aviso tapado.
- Mundo más ancho: ~45 ciudades (P183).
- Mapa hacia Grecia y el Egeo (P175).
- Mapa libre (C14, GM25a–h).
**Arte**
- Texturas de Poly Haven (CC0) para ciudad y suelo (aprobado «Ok»).
- Aspecto griego: tropas y edificios (P173); ciudades y cultura griegas (P174); modo Grecia y mitología (MG1).
- Meshy no obedece negaciones: galo afeitado desde imagen libre; piel de lobo del vélite aparte.
- Galo nuevo y realista con tatuajes (AR1), espera créditos de Meshy.
- Idea de suavizado de movimientos (`ai-3d-animator-skill`).
**Gobierno**
- Medir las skills con `skill-creator` antes de cambiarlas.
- Control de gasto según el catálogo awesome-claude-code.
- Auditoría: piezas sin identificador estable.

### 2b. Lo que espera al usuario o está sin aprobar
- «Sin confirmar» en OBJETIVOS: ¿una sola política (Senado del juego o maquetas «Gobierno por turnos»)? ¿Roma 3D, modo Grecia, Egeo?
- BG1 asalto a la muralla: propuesta del director sin confirmar.
- Nova Roma (P164): tres decisiones antes de abrirla.
- Maquetas viejas de batalla (GM2, GM7, GM8, GM9) «esperan prueba» desde el 16/11: probablemente superadas por el motor nuevo.
- Mini guía de juego (`GUIA-JUGAR.md`): rehacer tras la batalla nueva en campaña.

### 2c. Lo que la 1.0 deja a medias o con riesgo
- Caminos: con los bots se gana por armas y comercio; ciudad y política 0 de 10.
- Aníbal toma una Roma que no recluta hacia el 215 (decidido: así se queda).
- Tu prueba en el móvil (fluido y sin red): la última, el 13/11.
- Hoplitas y Batallón Sagrado no bajan a pie; 15 % sin caballería, falange ni hoplitas.
- Física en la escaramuza: 1,31 ms por paso (tope 1 ms).
- Descarga 55,6 de 56 MB: no cabe más arte sin subir el tope.
- Meshy sin créditos hasta el mes que viene.
- Jueces completos ~1 h; el bot investigador se pasa de plazo; «Construir un edificio» falla a veces.
- Gasto real ×1,5 a ×2,7 sobre lo previsto; límite semanal de uso en aviso.
- Tablero: 105 tareas «en pausa», muchas de carriles viejos que el motor nuevo ya dejó atrás.

### 2d. Decisiones que marcan el rumbo (resumen)
EL JUEGO (cita en OBJETIVOS); caminos de victoria sin plazo, 2 de 3 en la 1.0; un juego, un menú, aspecto antiguo;
arte solo libre (0 A.D., Meshy publicado CC BY-SA 3.0, CC0); batalla «tipo Rome II» con el bloque y un solo motor a
pie; ciudad desde arriba, pantalla mínima, agricultura y mercado; construir hasta parecerse a las referencias, sin
tiritas; solo Opus; ministerios «A»; cadenas sin supervisión y subidas con jueces APTO; descarga hasta ~56 MB.

## 3. Metas de la 2.0
(en debate)

## 4. Orden
(en debate)

## 5. Lo que queda fuera de la 2.0
(en debate)
