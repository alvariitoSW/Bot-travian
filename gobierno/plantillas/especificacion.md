# Especificación · <ID> <nombre corto>

<!-- Plantilla del método mezclado (SK1, 27/11/2026). Idea y estructura tomadas de spec-kit (github/spec-kit,
     licencia MIT, `templates/spec-template.md`), adaptadas a AQVILA. Copiar a `gobierno/specs/<ID>.md` y rellenar.
     La comprueba `node gobierno/analizar.mjs --spec gobierno/specs/<ID>.md --estricto` (segundos, sin navegador).
     Reglas: frases cortas, en llano; nada técnico en «Qué verá el jugador»; como mucho 3 [POR ACLARAR]. -->

**Estado**: borrador <!-- borrador → aclarada → aprobada → en obra → convergiendo → cerrada -->
**Sirve a**: <línea de gobierno/OBJETIVOS.md o meta del plan (p. ej. PLAN-2.0 M1)>
**Área**: <cerebro | musculo | batallas | combate | animacion | graficos | mapas | arte | sonido | gobierno>
**Rama**: <rama>
**Creada**: <fecha>

## Qué verá el jugador
<!-- Dos o tres frases: lo que cambia en el móvil al terminar. Es el criterio de hecho del plan socialista §1.5. -->

## Decisiones del usuario
<!-- Copiadas LITERALES de la bitácora o del chat, con fecha. Una por línea, con su número D1, D2…
     Cada D tiene que salir en algún criterio («de D1») o en la columna «Cumple» de una tarea: si no, «analizar»
     da CRÍTICO. Aquí se pierden las cosas: lo dicho en el chat y no apuntado («te dije de dejar solo victoria por
     conquista», 25/11) se copia aquí antes de construir. -->
- **D1** (dd/mm): «…»

## Criterios de aceptación
<!-- Comprobables, numerados CA1, CA2… Cada uno dice de qué decisión sale y CÓMO se comprueba:
     un comando (`node test/x.mjs`), un juez (`juez-area`, `juez-aspecto <ficha>`), una captura con su nombre,
     el examen de quien no construyó, o «el usuario dice Bien». Nada de «que quede bonito». -->
- **CA1** (de D1): <qué se ve o qué pasa> · Se comprueba: <comando / juez / captura / examen / usuario>

## Fuera de esta tarea
<!-- Lo que NO se hace aquí (y a dónde va: tarea con ID o nevera). Evita que la tarea crezca. -->

## Por aclarar
<!-- Máximo 3. Cada una como pregunta al usuario: (A) … [recomendado]; (B) … Por qué: una frase.
     Mientras quede alguna, el estado no pasa de «borrador». Al contestar: «- P: … → R: … (fecha)» y se quita la marca. -->
- [POR ACLARAR] …

## Plan y presupuesto
<!-- Plan socialista §2–§3: tamaño, quién trabaja, modelo y M. «Esperable» = declarado × 1,5–2 (medido en la 1.0). -->
| Pieza | Quién | Modelo | M decl. (esperable) |
|---|---|---|---|
| … | constructor | opus | … |

## Tareas
<!-- Las del tablero (ID). «Cumple» lista los CA y D que cubre. Toda CA en al menos una fila. -->
| Tarea | Qué se ve al acabar | Cumple | Tamaño |
|---|---|---|---|
| <ID> | … | CA1 (D1) | pequeña |

## Convergencia
<!-- Repetir construir → comprobar hasta que todos los CA estén ✔. Tope = presupuesto × 2.
     Al pasar el tope, «analizar» da CRÍTICO: se para y se pregunta al usuario (seguir, recortar o dejarlo). -->
**Tope: N M** · aviso al usuario al pasar el tope o con 3 vueltas sin subir la nota.
| Vuelta | M gastados | CA cumplidos | Qué falta |
|---|---|---|---|
| 1 | 0 | 0/1 | … |

## Referencias
<!-- Estudios, fichas de aspecto (gobierno/aspecto/<id>.md), partes anteriores, REF-*.md. -->
