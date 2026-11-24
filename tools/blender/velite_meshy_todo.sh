#!/usr/bin/env bash
# AL7: rehace el vélite a partir del modelo de Meshy (generado por el usuario; CC BY-SA 3.0 citando a Meshy). Copia de hastatus_meshy_todo.sh.
# Paso A entero (si se da el .glb: escala, cresta, aligerado, horneado; si no, solo la etapa 2 sobre los bruto_*.npz)
# y paso B (manos de MakeHuman, parma, jabalinas, espada; texturas webp) para los cuatro niveles de assets/soldados/velite*.
# Uso: tools/blender/velite_meshy_todo.sh <carpeta del paso A> [velite.glb de Meshy] [tenir=0|1]
# El .glb se baja por su identificador: GET https://api.meshy.ai/openapi/v2/text-to-3d/01a20a85-7229-71f3-9ed0-2b3c976a8313 → model_urls.glb
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de ligero_*.npz)}"; ORIGEN="${2:-}"; TENIR="${3:-tenir=0}"
source /opt/aqvila-taller/entorno.sh
if [ -n "$ORIGEN" ]; then ETAPA=1; else ETAPA=2; fi
blender-py tools/blender/velite_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=$ETAPA
python3 tools/blender/velite_meshy_juego.py entrada="$P6" salida=assets/soldados "$TENIR"
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
