---
name: plan-equipos
description: Reparte UNA tarea del tablero de AQVILA entre constructor, verificador y revisor, y cierra la sesión con su parte. Úsala al empezar cualquier tarea de `gobierno/TABLERO.md` («haz la tarea A1», «sigue con el tablero»).
---

# Plan por equipos

Tú eres el **director**. Una sesión, una tarea. No se empieza otra aunque sobre tiempo.

## 1. Antes de tocar nada
1. Lee `CLAUDE.md`, `gobierno/BITACORA.md` y `gobierno/TABLERO.md`.
2. Aplica los pedidos del cuadro de mando (skill `cuadro-de-mando`). Pueden cambiar la tarea del día.
3. Elige la tarea: la que diga el usuario; si no, el «Encargo de la próxima sesión» de la bitácora.
4. Si la tarea pide una decisión del usuario (reglas, arquitectura, quitar cosas, aspecto grande), **pregunta antes**.
5. Escribe en dos o tres frases qué se va a ver distinto en el móvil al terminar. Eso es el criterio de hecho.

## 2. Tamaño y reparto
| Tamaño | Señal | Quién trabaja |
|---|---|---|
| Pequeña | un archivo, menos de ~50 líneas, sin dudas | El director solo. Sin agentes. |
| Media | varios archivos o toca lógica y pantalla | `constructor` → `verificador` |
| Grande | sistema nuevo o cambio de datos guardados | `constructor` → `verificador` + `revisor` a la vez |

- Al **constructor** se le da: la tarea literal, los archivos que puede tocar y los que no, y el criterio de hecho.
- Al **verificador** no se le cuenta cómo se hizo: solo qué debe verse. Mira las capturas a 390 px.
- Al **revisor** se le da el diff (`git diff`), no las conclusiones del constructor.
- Lo que digan se comprueba: un agente puede equivocarse con el mismo aplomo con el que acierta.
- Si verificador o revisor encuentran fallos, vuelve al constructor **una vez**. Si sigue mal, para y apúntalo.

## 3. Rama
La rama es la que asigne la sesión. Si no asigna ninguna, la de `CLAUDE.md` §5. Nunca a otra sin permiso. Sin PR.

## 4. Cierre (obligatorio, en este orden)
1. `node gobierno/jueces.mjs` completo: debe decir **APTO**. Mira tú las capturas.
2. Si se tocó arte: `node gobierno/arte.mjs`.
3. `TABLERO.md`: la tarea pasa a ✅ en una línea y se quita el detalle. Lo que quede, como tarea nueva ⬜.
4. `BITACORA.md`: lo que el usuario deba decidir y el encargo recomendado para la próxima sesión.
5. Parte en `gobierno/partes/AAAA-MM-DD-ID.md` (plantilla abajo). Máximo 25 líneas.
6. Regenera y publica el cuadro (skill `cuadro-de-mando`).
7. Commit y push. Al usuario: qué cambia, en llano, y **capturas**.

## Plantilla del parte
```
# Parte · <ID> <título> · <fecha>
**Resultado**: hecho / a medias / bloqueado.
**Qué cambia para el jugador**: …
**Archivos**: …
**Jueces**: APTO n/n · arte APTO (si aplica).
**Gasto**: agentes lanzados n · jueces completos n · rápidos n · minutos aprox. n.
**Queda pendiente**: …
**Decide el usuario**: …
```
