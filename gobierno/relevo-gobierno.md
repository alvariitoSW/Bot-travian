# Relevo de la sesión de gobierno de AQVILA (13/11/2026, 11:30 UTC)

La sesión de gobierno anterior (id `session_01QiKC37LeVmFhVhw52nzhQj`) se cierra porque su contexto es demasiado largo. Esta nota es todo lo que necesita quien la sustituya. **Léela entera antes de hacer nada.**

## 1. Quién eres y qué haces
Eres la sesión de **gobierno / cuadro de mando** de AQVILA (juego de estrategia romana para móvil, PWA; repo `alvariitosw/bot-travian`; rama de trabajo `claude/roman-strategy-mobile-game-bx9oq2`; juego publicado en https://alvariitosw.github.io/Bot-travian/ desde `main`).
No construyes: **abres sesiones constructoras con `create_session`, las verificas tú mismo, las archivas, y mantienes el cuadro de mando al día.**

El usuario es **médico, no programador**. Habla en español llano, enséñale capturas a 390 px, no uses jerga. Decide él: reglas, arquitectura, quitar cosas, cambios grandes de aspecto. Lo pequeño y obvio se hace sin preguntar. Regla suya: diseño y dirección de arte con Fable; todo lo demás con Sonnet 5.5 + «ultracode».

## 2. Datos fijos
- Cuadro de mando (Artifact): https://claude.ai/artifact/4MJcdCj3qAN5T76kixaw6W. Se genera con `node gobierno/cuadro.mjs` (lee TABLERO.md, BITACORA.md, cuadro.json y `gobierno/capturas/`). Su colección de base de datos `sesiones` (ArtifactData) es lo que la página pinta como «Sesiones abiertas».
- Segunda sesión de gobierno (Opus, abierta desde el móvil, id `session_01QiKC369iQW21XMsXa35BXX`) lleva los concursos K (maquetas), las sesiones de Educación y el «vigía» (`trig_016NTe7pza27Ww83RVK2fiQR`, que pasa al tablero lo que el usuario aprueba en el cuadro). **No toques sus sesiones** (K6 a K9, Educación…) ni tareas de otros proyectos (Moncloa, mv2, Objetivo U, Nefrología…).
- Tu doc en `sesiones`: crea uno con tu propio id al empezar y borra el de `session_01QiKC37LeVmFhVhw52nzhQj`.
- Entorno de las sesiones: `environment_id` heredado; todas con `model: claude-sonnet-5-5`.

## 3. Cómo se abre una sesión constructora
`create_session` con: `source_url` https://github.com/alvariitosw/bot-travian, `source_revision` y `outcome_branch` = la rama de trabajo, `model` claude-sonnet-5-5, `title` «AQVILA · <ID> <nombre>», `tags`, y un prompt que empieza por «ultracode». **Plantilla: copia el primer evento `user` del prompt de CN15c** (`list_events` de la sesión `session_01QiKC37aaQ81cfqkdRvJMyV`, `kinds: ["user"]`, `limit: 1`) o el de CN14-C/CN22. Lleva siempre:
1. **LO PRIMERO**: `git fetch` + `git pull --rebase` y comprobar que HEAD contiene el último commit relevante (Q4b nació sobre una base vieja y tuvo 21 conflictos y +90 % de gasto). Si choca: `git rebase --abort`, nunca forzar.
2. Qué archivos son suyos y cuáles NO (para que no se pisen con otras sesiones en paralelo); archivo de historia, captura y parte PROPIOS (no editar scripts compartidos como `captura-ciudad.mjs` sin avisar).
3. Qué leer (solo lo que cita), el contrato escrito y las correcciones.
4. **Aviso de gasto**: presupuesto, tope DURO del doble (las tareas se han pasado entre +30 % y +197 %), partir en 2–3 encargos con contrato y ~30 pasos, constructores sin jueces completos, el recorrido completo `node gobierno/jueces.mjs` UNA vez al final y sin otra prueba a la vez, si falla UN paso suelto de navegador por espera de animación repetirlo una vez, esperar con un solo `until grep …; do sleep 5; done`, un revisor Sonnet al final.
5. Si los procesos en segundo plano desaparecen (reinicio del entorno), relanzarlos una vez y no quedarse esperando.
6. CERRAR: parte en `gobierno/partes/2026-11-13-<ID>.md`, su línea en TABLERO y BITACORA, capturas en `gobierno/capturas-tarea/<ID>-*.jpg`, `git pull --rebase`, commit y push a la rama (nunca a `main`, no crear PR), y `send_message` al padre «<ID> hecha, APTO, subida: <commit>». Si necesita una decisión del usuario, la deja escrita en el parte (no pregunta).
**OJO: los hijos avisan a su padre (`@parent`). Los hijos abiertos por la sesión anterior apuntan a ella; mira §6.**

## 4. Cómo se verifica una sesión (hazlo SIEMPRE tú; nunca des algo por hecho sin ver)
1. `git pull --rebase origin <rama>`, `git log`, comprobar que existen el commit y el parte.
2. `node gobierno/jueces.mjs --rapido` (≈4–7 min, solo lógica) y, si toca arte o gfx, `node gobierno/arte.mjs` (APTO; descarga < 37 MB, hoy ≈34–35 MB; ciudad ≤ 300 mil triángulos).
3. Mirar las capturas del parte con `Read` (imágenes) y juzgar lo que se ve.
4. Comprobar las cifras propias de la tarea (el parte las trae en tabla; compáralas con el encargo).
5. `node test/ref-normal.mjs` debe decir «NORMAL = HOY» (pob96 1370/1090/1535): protege que la dificultad Normal sea el juego original.
6. Archivar la sesión (`archive_session`), borrar su doc de `sesiones` (si la propia sesión ya lo borró, ignorarlo; los `if_version` fallan si cambió), quitarla de `gobierno/cuadro.json` (clave `sesiones`).
7. **Antes de publicar el cuadro**: `node gobierno/jueces.mjs` COMPLETO (≈10–14 min, sin otra prueba a la vez; deja `gobierno/capturas/` al día; si no, el cuadro muestra el recorrido viejo). `git pull --rebase` ANTES de `node gobierno/cuadro.mjs` (si va por detrás, se niega a generar). Commit + push de `cuadro.json`. Publicar con `Artifact` (`url` = el del cuadro, `file_path` = `/home/user/Bot-travian/gobierno/cuadro.html`, sin `capabilities`). Si lo rechaza por versión más nueva: leer el archivo guardado que indica (`Read` con offset/limit, los renglones largos con python), comparar por líneas (difflib), fusionar lo fresco de ambas y publicar otra vez (el `Read` y la publicación NO en el mismo lote).
8. Programar el siguiente aviso con `send_later` (texto completo con el estado y lo que hay que hacer).

Trampas conocidas: el juez «Mapa por escalones» falló una vez por carga de la máquina (ya se amplió su espera a 3 s); `sw.js` `CACHE` lo suben varias sesiones a la vez (regla: el mayor +1; hoy v71; ojo a que N15d, CN9c y CN22 no la subieron tras v71: al publicar `main` conviene subirla una vez más); `git reset --hard` está denegado (usar rama de respaldo + `git checkout -B`); los avisos programados antiguos llegan con instrucciones ya superadas: aplica solo lo que sigue pendiente.

## 5. Reglas de oro del usuario
- **`main`**: el sistema bloquea subir a `main` sin permiso explícito del usuario EN ESE MOMENTO. Se hace con `AskUserQuestion` (opción «Sí, ahora»), se une la rama a `main` con `git checkout -B publicar origin/main && git merge --no-ff <commit verificado>`, se comprueba que `git diff <commit> HEAD` está vacío y se sube con `git push origin publicar:main`. Hoy `main` está en `9ec26ef` (= rama hasta `fbb0761`, con CN5–CN10 y CN9a/b). **Falta publicar todo lo posterior** (CN14, CN15a/b, N15c/d, CN22, CN9c, CN25a…). El usuario aceptó «publicar en main» como primer paso del plan 1.0 y lo permitió UNA vez; **cuando CN15c y I8 estén hechas y verificadas, pregunta si actualizas `main`** (con `AskUserQuestion`). Desde el contenedor no se puede comprobar github.io (403 del proxy).
- Nunca abras sesiones nuevas si el uso semanal pasa a «bloqueado» (hoy «allowed_warning»; se reinicia el lunes 16/11 a las 14:00 UTC): avisa al usuario. Máximo 3 sesiones de construcción a la vez; una sola a la vez si tocan los mismos archivos (game.js, data.js, ui.js, ciudad.js, registro.js).
- No hagas nada destructivo ni de cara al exterior sin permiso (borrar la rama `q4b-respaldo`, subir a `main`, cambiar el compartido del cuadro).
- Todo en español. Frases cortas. Informa al usuario de los resultados sin adornos, con lo que gastó cada tarea (en M de tokens y en $ de `get_session` → `usage.cost_usd`).

## 6. ESTADO (13/11/2026, 11:30 UTC)
Rama `claude/roman-strategy-mobile-game-bx9oq2`, último commit de tarea: `7fe766b` (CN22), `c17ca8b` (CN9c). Jueces completos del último estado verificado: APTO 22–24 comprobaciones.

**Hecho hoy y verificado por mí** (con su parte en `gobierno/partes/2026-11-13-<ID>.md`): CN5 colonias, CN6 barrios, CN7 muralla y arrabal, CN8 sucesos, CN10 edificios de época, CN9a/b plantillas y casas por cultura, CN14 A/B/C (número vivo, sucesos apagables, tres dificultades, asesor y ajustes), CN15a/b (estaciones, fachadas, obreros, recuas), N15c y N15d (equilibrio de la batalla; N15d parcial), CN25a (medida del ritmo del mes), CN22 (avisos pequeños), CN9c (afinar Capua/Roma). Gasto típico: 1,2–2,3 M por tarea (2–6 $).

**En marcha**: **CN15c «Ciudad que suena»** (session_01QiKC37aaQ81cfqkdRvJMyV, abierta 11:19 UTC, 0,6 M, tope duro 1,2 M). Sonido sintetizado de la ciudad + interruptor (menú y fila `#aj-sonido` en Ajustes) + 2 retoques menores de ui.js (asesor «Falta un granero» en Tranquila; interruptor «Hambre de invierno» visible en Tranquila). Cuando suba: verificar (§4), marcar CN15 ✅, archivar. **Su padre es la sesión antigua**: al empezar, envíale con `send_message` el id de tu sesión y dile «tu padre ahora soy yo; avísame a mí».

**Plan «1.0 jugable» (aceptado por el usuario el 13/11)**: (1) publicar en `main` [hecho una vez, falta lo nuevo], (2) CN14 y CN15 [CN14 hecha, CN15c en marcha], (3) **I8 partida corta**, (4) equilibrio N15c [hecho, con reservas]. El resto va DESPUÉS de que el usuario juegue el 1.0.

**Lo siguiente que debes abrir: I8 «Partida corta»** (ficha en `gobierno/olas-21.md` «### I8» y línea de TABLERO; ≈1,6 M nominal, realista 2–3 M, parte en 2 sesiones si puedes). Decisión del usuario ya tomada: «A · Dos modos» (al empezar se elige «Roma y Capua en pie» o «Fundar de la nada»; CN9a ya dejó Roma y Capua en pie; CN5 dejó `UI.abrirFundar`, `G.fundarColonia`, `G.ciudadPendiente`; `D.MODOS` es nuevo). No toques `data-act="new"` (los jueces lo pulsan). I8 edita `game.js`, `data.js`, `ui.js` (menú, que CN14-C y CN15c también tocan) y el final de partida: **ábrela cuando CN15c haya subido** y lee antes los partes de CN5, CN9a, CN9c, CN14-C, CN22. Sin nota ni puntuación (P88 no aprobada).

**Esperan respuesta del usuario (pregúntale en el chat; los pendientes ya están en `gobierno/BITACORA.md`, «Esperando algo del usuario»)**:
1. **Ritmo del mes (CN25)**: informe en `gobierno/estudios/CN25-tiempos.md`. Opciones: A pausa automática con motivo (≈0,5 M, recomendada) / A y luego B «avanzar hasta lo próximo» (≈1,3 M) / C resumen único (≈0,7 M) / ninguno; y pausas «solo graves» (recomendado) / «todas» / «ninguna». Si contesta, abre CN25b.
2. **Guerra a 0,67× (N15d)**: «Aguantar» ya no gana sentado; el buen plan a 0,67× sigue en 0 %. Recomendado: aceptar que 0,67× se pierde, subir el listón del buen plan a 0,8× y parar la caída de moral mientras el menor conserve mejor proporción (≈1–2 M, N15e). Abrir solo si lo pide.
3. **Dura al −13 % de población** (CN14-C): ¿vale o más suave? **Tranquila +3,2 %** (no +5 %) y **Capua 300 de población** (no 270) quedaron así por decisión mía: se avisa, no bloquean.
4. **Antes de CN13 y CN15 de ciudad** (CN13 sale de la cola inmediata): cubos (diez segundos tocando o botón), tejas por barrio o pieza, quién dibuja el dique, coste 5–7 M. Ver BITACORA.
5. Extras de CN10: aviso en pantalla de la devolución al cargar partida vieja; circo o fornix como edificios de época.
6. ¿Sigue queriendo los vídeos cortos que algunas sesiones añaden en `gobierno/capturas-tarea/*.mp4` (0,8–2,9 MB, parecen pedidos por él por la app)? Si no, dilo en los prompts.
7. El cuadro figura compartido con «cualquiera con el enlace» (no lo cambió esta sesión): ya se le avisó.

**Aprobado por el usuario desde el cuadro (13/11 09:18) y ya en el tablero** (NO son del 1.0 inmediato): CN21 mover un edificio (0,4 M), CN23 segundo recinto de muralla, CN24 empalizada que suba en altura. CN22 avisos y CN25 ritmo ya se trabajaron. Las ideas «+N por mes junto a cada recurso» y «bandeja en verde/rojo según lo que puedes pagar» las dejó CN22 en su parte para decidir.

**Cola después del 1.0 (solo tras jugarlo)**: CN13, CN16 a CN20, N9 a N13, J3 a J8, C1 a C5, Q8 en adelante, K3, B5, V1 (ver `gobierno/TABLERO.md` y `gobierno/olas-22-ciudad.md` para CN13 a CN15 con fichas y correcciones del revisor).

## 7. Cómo seguir ahora mismo (orden)
1. Lee §2–§6. Crea tu doc en `sesiones`; borra el de la sesión antigua.
2. `git pull --rebase`, mira `git log` y `get_session` de CN15c; avísale de que eres su nuevo padre.
3. Programa `send_later` (≈15–20 min) para revisar CN15c y encadenar I8; cuando CN15c suba, verifícala (§4), abre I8, y después publica el cuadro (§4.7).
4. Responde a lo que el usuario conteste en el chat (ritmo, guerra…); cualquier decisión suya se apunta en BITACORA con la skill `bitacora`.
5. Cuando CN15c e I8 estén hechas: pregunta por `main` con `AskUserQuestion`, sube una vez, comprueba que el contenido de `main` = el commit unido, y dile cómo ver lo nuevo en el móvil (recargar dos veces por el modo sin conexión).
