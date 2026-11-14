# Kit «Blender Skills» (instalado el 14/11/2026, pedido del usuario)

- **Qué es**: 94 habilidades de texto (modelado, materiales, animación, optimización para juegos, estilos low poly / PSX / isométrico, exportar a glb) para agentes con Blender. Origen: https://github.com/arjun988/blender-skills, commit `904f095` (06/11/2026). Licencia **MIT** (copia en `gobierno/kits/blender-skills-LICENSE.txt`; crédito: autor arjun988).
- **Dónde está**: `.claude/skills/` (94 carpetas y `references/`). Solo texto, sin scripts. No chocan con las habilidades del proyecto.
- **Qué NO se instaló**: `.mcp.json` (arranca `uvx blender-mcp`, un paquete de terceros, y está escrito para Windows con `cmd /c`).
- **Para qué sirven sin Blender**: como guía de estilo, presupuestos de polígonos y canal de exportación (`references/polycount-budgets.md`, `asset-pipeline.md`, `naming-conventions.md`). Útil al afinar las piezas propias (`tools/piezas_maqueta.txt`).
- **Para que ejecuten de verdad** hace falta Blender abierto con el complemento BlenderMCP (https://github.com/ahujasid/blender-mcp) y `uv`; no hay Blender en las sesiones en la nube. Habría que probar Blender sin ventana o usar un ordenador del usuario.
- **Reglas del juego que siguen mandando** (CLAUDE.md §2): arte nuevo solo con licencia libre verificada y su crédito; todo lo que salga en glb se pasa por `node gobierno/arte.mjs` (peso y triángulos).
