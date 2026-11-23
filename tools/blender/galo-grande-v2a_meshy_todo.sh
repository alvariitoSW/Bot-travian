#!/usr/bin/env bash
# AL9: galo grande v2 (primera versión) de Meshy, refine 01a20a77-63b8-71ab-9d57-bf0863662554, como soldado del juego.
# Paso A, etapa 1 (solo si se da el GLB: escala, aligerado, UV y horneado) y etapa 2 (esqueleto y exportación ligera),
# y paso B (manos de MakeHuman, falda teñible, texturas webp pequeñas) para los cuatro niveles de assets/soldados/galo-grande-v2a*.
# Sin armas ni escudo: los pone el juego por código.
# Uso: tools/blender/galo-grande-v2a_meshy_todo.sh <carpeta del paso A> [crudo.glb de Meshy: rehace también la etapa 1]
# El GLB se baja de la API de Meshy: GET https://api.meshy.ai/openapi/v2/text-to-3d/01a20a77-63b8-71ab-9d57-bf0863662554 → model_urls.glb
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de bruto_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
if [ -n "$ORIGEN" ]; then blender-py tools/blender/galo-grande-v2a_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=1
else blender-py tools/blender/galo-grande-v2a_meshy_ligero.py -- salida="$P6" etapa=2; fi
python3 tools/blender/galo-grande-v2a_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
