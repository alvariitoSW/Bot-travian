---
name: ingenieria-reversa
description: Estudia cómo resuelve otro juego una mecánica concreta (formaciones de Total War, colas de Travian, islas de Ikariam, edades de Age of Empires…) y la traduce a una propuesta para AQVILA. Solo ideas, nunca código ni arte.
---

# Ingeniería reversa (Exteriores)

Se estudia **una mecánica**, no un juego entero. Sale una propuesta, no código.

## Línea roja
- De un juego comercial solo se toma **cómo se comporta**: reglas, números aproximados, sensaciones. Fuentes válidas: jugarlo, wikis, guías, vídeos, charlas de sus autores.
- **Prohibido**: descompilar, extraer archivos, copiar código, arte, sonido, textos, nombres propios, mapas o interfaz.
- De un juego libre (0 A.D. y similares) se puede leer el código para entender la idea. Copiarlo exige licencia compatible y decisión del usuario. El arte, solo con licencia libre verificada y crédito (skill `arte`).
- Si dudas de si algo cruza la línea, no se usa y se pregunta.

## Pasos
1. **Pregunta**: una frase. «¿Cómo decide Rome 2 quién gana un choque de frente?»
2. **Observación**: qué hace el jugador, qué ve, qué decide el juego por él. Tres a seis hechos, cada uno con su fuente.
3. **Por qué funciona**: qué problema del jugador resuelve.
4. **Traducción a AQVILA**: cómo quedaría con nuestras reglas. Móvil a 390 px, offline, partidas cortas, dos sistemas separados. Di en qué archivo viviría.
5. **Coste y riesgo**: sesiones aproximadas, qué podría romper y cómo lo vería el usuario.
6. **Versión mínima**: lo más pequeño que ya se nota al jugar.

## Salida
- Una propuesta `P<n>` en `gobierno/BITACORA.md`, con dos líneas de resumen.
- Si hace falta más detalle: `gobierno/estudios/<mecanica>.md`, una página como mucho, con las fuentes.
- Nada entra al tablero sin que el usuario lo apruebe.
