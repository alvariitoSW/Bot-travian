---
name: plan-socialista
description: El «plan socialista» del usuario. Presupuesta y reparte UNA tarea del tablero de AQVILA entre constructor, verificador y revisor, y cierra la sesión con su parte. Úsala al empezar cualquier tarea de `gobierno/TABLERO.md` («haz la tarea A1», «sigue con el tablero»).
---

# Plan socialista

Tú eres el **director**. Una sesión, una tarea. No se empieza otra aunque sobre tiempo.

## 1. Antes de tocar nada
1. Lee `CLAUDE.md`, `gobierno/BITACORA.md` y `gobierno/TABLERO.md`.
2. Aplica los pedidos del cuadro de mando (skill `cuadro-de-mando`). Pueden cambiar la tarea del día.
3. Elige la tarea: la que diga el usuario; si no, el «Encargo de la próxima sesión» de la bitácora.
4. Si la tarea pide una decisión del usuario (reglas, arquitectura, quitar cosas, aspecto grande), **pregunta antes**.
5. Escribe en dos o tres frases qué se va a ver distinto en el móvil al terminar. Eso es el criterio de hecho.

## 2. Presupuesto antes de gastar (obligatorio)
Unidad: **M** = millones de tokens equivalentes, lo que imprime `node gobierno/gasto.mjs`. Referencia medida: montar
el gobierno (G1) costó 0,75 M de Fable.
1. Escribe el presupuesto en el chat, en una tabla de ≤8 líneas: cada pieza con su agente, su **modelo** y sus M; el
   total por modelo. Si la tarea viene de `gobierno/plan-12.md`, su fila es el presupuesto.
2. Hacienda (tú mismo, sin agentes): quita el agente que sobra, baja de modelo lo que copia algo ya hecho, parte el
   encargo si pasa de una pieza.
3. Si el total pasa de **1,5 M**, o de lo que el usuario aprobó, no empieces: díselo.
4. Antes de cada vuelta de arreglos y al cerrar: `node gobierno/gasto.mjs --desde <hora de inicio> --presupuesto N`.
   Con «ALERTA +25 %» se para y se cuenta al usuario. No se sigue gastando.

**Política de modelos (una sola).** El director es el modelo de la sesión y **no construye**: encarga, mira capturas y
decide. Sonnet para todo lo que sigue un patrón que ya existe en el código: constructor, verificador, revisor,
estudios. El modelo potente solo para diseño que decide el usuario (F1, E1) y para lo primero de su clase si Sonnet
falla dos veces; entonces se para y se pregunta antes de subir de modelo. Haiku no se usa para escribir código.

## 3. Tamaño y reparto
| Tamaño | Señal | Quién trabaja |
|---|---|---|
| Pequeña | un archivo, menos de ~50 líneas, sin dudas | El director solo. Sin agentes (lanzar uno cuesta más que hacerlo). |
| Media | varios archivos o toca lógica y pantalla | `constructor` (sonnet); los jueces los pasa el director y mira él las capturas |
| Grande | sistema nuevo o cambio de datos guardados | `constructor` → `revisor` (sonnet); `verificador` solo si hay que mirar algo que los jueces no recorren |

- La descripción de cada agente empieza por la clave entre corchetes (`[B8] Constructor`): así `gasto.mjs` dice qué gastó cada uno.
- Encargos de **una pieza** y con tope de pasos. Di qué apartado leer; un agente que relee todo lo vuelve a pagar.
- **Sesión corta**: una tarea por sesión. Una conversación larga del director es el gasto más tonto (medido: 0,5 M en charla).
- Al **constructor** se le da: la tarea literal, los archivos que puede tocar y los que no, y el criterio de hecho.
- Al **verificador** no se le cuenta cómo se hizo: solo qué debe verse. Mira las capturas a 390 px.
- Al **revisor** se le da el diff (`git diff`), no las conclusiones del constructor.
- Lo que digan se comprueba: un agente puede equivocarse con el mismo aplomo con el que acierta.
- Si verificador o revisor encuentran fallos, vuelve al constructor **una vez**. Si sigue mal, para y apúntalo.

## 4. Rama
La rama es la que asigne la sesión. Si no asigna ninguna, la de `CLAUDE.md` §5. Nunca a otra sin permiso. Sin PR.

## 5. Cierre (obligatorio, en este orden)
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
**Cuentas**: presupuesto N M · gastado X M (±P %) · por modelo: … · dónde se fue y cómo se ahorraría la próxima vez.
**Queda pendiente**: …
**Decide el usuario**: …
```
