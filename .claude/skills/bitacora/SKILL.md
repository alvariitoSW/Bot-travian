---
name: bitacora
description: Lleva la bitácora de AQVILA. Úsala cuando el usuario pida o decida algo («quiero que…», «apunta», «aprobado», «quita eso») y cuando pregunte «¿a dónde vamos?», «¿qué queda?» o «¿qué hacemos ahora?».
---

# Bitácora

Dos archivos, dos papeles:
- `gobierno/BITACORA.md`: lo que el usuario **pide y decide**, lo que **espera algo suyo** y el encargo siguiente.
- `gobierno/TABLERO.md`: solo tareas **aprobadas**, por carriles.

Regla de oro: lo nuevo entra por la bitácora. Solo pasa al tablero cuando el usuario lo aprueba.

## Apuntar un pedido
1. Escríbelo en «Decisiones del usuario» con fecha y **con sus palabras** (literal o casi). Tu lectura, si la añades, va marcada como tuya.
2. Si es una decisión clara («hazlo», «aprobado»), pasa al paso de aprobar.
3. Si es una idea, conviértela en propuesta: `- P<n> <qué se haría, en una frase> (pedido del <fecha>)` en «Propuestas por aprobar». Numera sin reutilizar.
4. Si para avanzar hace falta que conteste algo, añádelo a «Esperando algo del usuario», como pregunta que se responde en una línea.

## Aprobar al tablero
1. Borra la propuesta de la bitácora y apunta la decisión con fecha.
2. Añádela al carril que toque de `TABLERO.md` con el siguiente número libre (`- ⬜ B10 …`). Una tarea = una sesión corta; si es mayor, pártela.
3. Rechazada: se borra de propuestas y se apunta «rechazada» con fecha, para no volver a proponerla.

## Informe «¿a dónde vamos?»
Respuesta corta, en llano, sin jerga:
1. **Dónde estamos**: qué se puede hacer hoy en el juego (dos o tres frases) y el enlace para jugar.
2. **Qué espera algo tuyo**: la lista, tal cual.
3. **Los tres pasos siguientes** que recomiendas y por qué en una línea cada uno. Primero lo que desbloquea a lo demás.
4. **Lo que no sabemos**: riesgos sin medir (hoy: rendimiento en un móvil real).
Acaba con el enlace al cuadro de mando (`gobierno/cuadro.json`).

## Limpieza
- La bitácora no es un diario: lo ya aplicado se resume en una línea o se borra.
- Las notas de aviso se revisan: si el motivo ya no vale, fuera.
