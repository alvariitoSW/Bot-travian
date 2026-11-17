# RD4 · Siete repositorios de IA y 3D (17/11/2026)
Pedido: «Estudia los siguientes repositorios de GitHub» (lista pegada por el usuario desde un hilo de X que no se pudo abrir: error 402). Solo se leyeron `LICENSE` y `README` de cada uno (clon sin archivos, en el cuaderno de trabajo; nada entra en el proyecto). Skill `radar`. Fechas = último commit visto.

## Resumen en llano
De los siete, **uno ya lo usamos** (three.js), **uno puede servir hoy** para el trabajo de arte (mcp-for-blender) y **cuatro generan modelos 3D con IA**: sirven para ideas, pero casi todos piden una tarjeta gráfica potente (que no hay aquí ni en tu móvil) y varios tienen licencias que **no** nos valen. El séptimo (SuperSplat) es una herramienta que no encaja con el rumbo del juego.

| Repo | Qué es | Licencia (leída en su `LICENSE`) | ¿Nos vale? |
|---|---|---|---|
| mrdoob/three.js (0.187.0, 17/11/2026) | Motor 3D del juego | MIT, «Copyright © 2010-2026 three.js authors» | **Ya lo usamos** (copia 0.170 en `js/vendor/`). Subir de versión sería otra tarea, solo si hay motivo. |
| ahujasid/mcp-for-blender (15/11/2026) | Conecta Blender con un modelo de IA para modelar con órdenes escritas; puede traer piezas de Poly Haven (CC0) y Poly Pizza | MIT. Poly Haven: «every Poly Haven asset is CC0» (su README) | **Sí, como herramienta de trabajo.** El código no entra en el juego. Ver duda 1. |
| Tencent-Hunyuan/Hunyuan3D-2 (28/10/2025) | Genera modelos 3D con textura desde una imagen; 6 GB de memoria gráfica para la forma, 16 GB con textura | «Tencent Hunyuan 3D 2.0 Community License»: «DOES NOT APPLY IN THE EUROPEAN UNION, UNITED KINGDOM AND SOUTH KOREA»; uso fuera de ese territorio, «unlicensed and unauthorized» | **No.** Excluye la Unión Europea; el usuario y la mayoría de los jugadores estarían fuera de la licencia. |
| microsoft/TRELLIS (27/10/2026) | Genera modelos 3D desde texto o imagen (mallas y «gaussianas») | Código MIT, «Copyright (c) Microsoft Corporation». Los pesos del modelo no se leyeron | **Solo ideas.** Pide «NVIDIA GPU with at least 16GB». Licencia de los pesos: no verificado. |
| TencentARC/InstantMesh (03/01/2025) | Una imagen a un modelo 3D en segundos | Código Apache 2.0. Pesos y datos (Objaverse): no verificado | **Solo ideas.** Pide CUDA ≥ 12.1. Sin verificar de qué datos viene. |
| buaacyw/MeshAnything (29/04/2025) | Convierte modelos 3D densos en mallas «de artista» de menos de 800 caras | «S-Lab License 1.0»: «Redistribution and use for non-commercial purpose…»; el uso comercial pide permiso aparte | **No** para un juego que pueda venderse. Idea útil: mallas de menos de 800 caras, justo lo que buscamos. |
| playcanvas/supersplat | Editor web de «gaussian splats» (escenas escaneadas) | MIT, «Copyright (c) 2011-2026 PlayCanvas Ltd.» | **No encaja.** Los splats no sirven para tropas ni edificios animados. |

## Lo positivo (hasta cinco, como manda el radar)
1. **mcp-for-blender** acelera el trabajo de arte con nuestras skills de Blender. Va con licencia MIT y el arte que trae por defecto (Poly Haven) es CC0.
2. **MeshAnything** confirma la meta de unos pocos cientos de caras por pieza (nuestro presupuesto en `gobierno/arte.json`). Solo como idea: su licencia es no comercial.
3. **TRELLIS e InstantMesh** muestran que hoy se puede sacar un modelo de una imagen en segundos. Quedan fuera de este entorno por la tarjeta gráfica (16 GB) y por pesos sin verificar.
4. **three.js** va por la 0.187 y nosotros por la 0.170: no hay prisa mientras el juego vaya bien.

## Lo que NO se puede hacer, dicho claro
- **Hunyuan3D-2: no** (excluye la UE; el usuario está en España).
- **MeshAnything: no para uso comercial** (S-Lab, no comercial).
- Todo lo generado por IA entra en el juego **solo con licencia verificada** de pesos y salida, y con la regla de `arte`: coherencia de época (280–146 a.C.) y ficha en `js/registro.js`. De Tencent y de los otros dos, **no verificado**.

## Dudas que decides tú
1. **¿Se prueba mcp-for-blender?** Recomendación: sí, en una tarea aparte de arte, solo en el ordenador de trabajo y sin arte de Poly Pizza (varias licencias): solo Poly Haven (CC0). No toca el juego.
2. **¿Se genera arte con IA para AQVILA?** Recomendación: no por ahora. Faltan licencia de pesos clara (TRELLIS, InstantMesh), tarjeta gráfica, y que la época romana sea fiel; el arte de 0 A.D. ya cubre lo que hay.
