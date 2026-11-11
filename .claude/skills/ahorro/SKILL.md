---
name: ahorro
description: Revisa el gasto de una tanda de trabajo en AQVILA (agentes, ejecuciones de jueces, tiempo, lecturas) y propone recortes. Úsala al cerrar una sesión larga, cada cinco partes, o cuando el usuario diga que se gasta mucho.
---

# Ahorro

El gasto se mide: `node gobierno/gasto.mjs` (millones de tokens equivalentes, por modelo y agente) y la línea **Cuentas** de cada parte en `gobierno/partes/`.

## Revisión
1. Lee los últimos cinco partes (o el de hoy). Suma: agentes lanzados, jueces completos, minutos.
2. Compara con lo conseguido: ¿cuántas tareas cerradas? ¿cuántas vueltas al constructor?
3. Busca estos derroches:

| Derroche | Recorte |
|---|---|
| Agentes para una tarea pequeña | El director solo (ver tamaños en `plan-socialista`) |
| Jueces completos (3 min) en cada cambio | `--rapido` mientras se trabaja; completos una vez, al cierre |
| Leer archivos enteros de líneas larguísimas | Grep y `cut -c1-400`; leer solo el tramo |
| Releer `CLAUDE.md`, tablero y bitácora dentro de cada agente | Pasar al agente el trozo que necesita |
| Regenerar arte sin cambio en `tools/` | No tocar `assets/` si no es la tarea |
| Dos vueltas por un encargo ambiguo | Criterio de hecho por escrito antes de empezar |
| Sesiones que mezclan tareas | Una sesión, una tarea |
| Capturas a doble resolución para comprobar | Escala 1 para comprobar; 2 solo si las ve el usuario |

4. Escribe **como mucho tres recortes**, cada uno con lo que ahorra y lo que arriesga.

## Qué se hace con los recortes
- Los que no cambian reglas ni calidad: se aplican y se anotan en el parte.
- Los que quitan una comprobación o cambian cómo se trabaja: a la bitácora como propuesta. Decide el usuario.
- Nunca se ahorra en: mirar las capturas, los jueces completos al cierre, las licencias del arte.
