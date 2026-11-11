---
name: radar
description: Rastrea fuera lo que puede servir a AQVILA (arte con licencia libre, técnicas de three.js para móvil, juegos parecidos, historia de la época) y devuelve una lista corta y filtrada. Úsala cuando el usuario pida «mira qué hay», antes de una tarea de arte o técnica, o si una dependencia envejece.
---

# Radar (Exteriores)

Mira fuera con una pregunta concreta. Devuelve pocas cosas y bien filtradas.

## Qué se rastrea
| Zona | Qué se busca | Filtro |
|---|---|---|
| Arte | Modelos, texturas y sonidos de época | Licencia libre **comprobada en la fuente** (CC0, CC BY, CC BY-SA). Nada «gratis para uso personal». Nada generado a partir de juegos comerciales. |
| Técnica | Rendimiento de three.js en móvil, niveles de detalle, compresión | Que funcione sin compilación y sin conexión. Hoy se usa three.js 0.170, copiado en `js/vendor/`. |
| Juegos | Estrategia para móvil, romanos, mezcla ciudad y batalla | Solo ideas (ver `ingenieria-reversa`). |
| Historia | 280–146 a.C.: ciudades, tropas, edificios, hechos | Fuente citada. Si los historiadores discuten, se dice. |

## Pasos
1. Escribe la pregunta y para qué tarea del tablero sirve. Sin tarea, no hay rastreo.
2. Busca. Para cada hallazgo apunta: qué es, enlace, licencia (con el enlace donde lo pone), peso o coste, y a qué tarea ayuda.
3. Descarta sin piedad. Quedan **cinco como mucho**.
4. No se descarga ni se instala nada en el proyecto: eso es otra tarea, aprobada.

## Salida
- Lista en el chat, en llano, con una recomendación.
- Lo que merezca hacerse: propuesta `P<n>` en `gobierno/BITACORA.md`.
- Las dudas de licencia se dicen, no se resuelven a ojo.
