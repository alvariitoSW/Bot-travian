#!/usr/bin/env bash
# AL1: hace el soldado «galo-grande» a partir del galo grande de Meshy (generado por el usuario; CC BY-SA 3.0, herramienta Meshy).
# Paso A (aligerado, esqueleto, horneado) y paso B (manos de MakeHuman, texturas webp pequeñas) para los cuatro niveles
# de assets/soldados/galo-grande*. Sin escudo ni armas (se ponen por código).
# Uso: tools/blender/galo-grande_meshy_todo.sh <carpeta de trabajo> [r.glb de Meshy]
#   Con r.glb hace el paso A entero (etapa 1, ≈ media hora); sin él, solo la etapa 2 sobre los bruto_*.npz que ya haya.
#   r.glb se baja de la API de Meshy: GET /openapi/v2/text-to-3d/01a20a6f-1e10-7476-8ca9-4cd8c2c89660 -> model_urls.glb
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta de trabajo}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
if [ -n "$ORIGEN" ]; then ETAPA=1; else ETAPA=2; fi
blender-py tools/blender/galo-grande_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" fotos="$P6/fotos" etapa=$ETAPA
python3 tools/blender/galo-grande_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
