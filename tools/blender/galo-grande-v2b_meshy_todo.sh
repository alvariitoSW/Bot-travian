#!/usr/bin/env bash
# AL10: galo grande v2b de Meshy (generado por el usuario, plan de pago; CC BY-SA 3.0 citando a Meshy) -> soldado del juego.
# Paso A, etapa 2 (esqueleto; necesita los bruto_*.npz de la etapa 1) y paso B (manos de MakeHuman, botas a cuero liso,
# falda teñible; texturas webp) para los cuatro niveles de assets/soldados/galo-grande-v2b*. Sin armas ni escudo.
# Bajar el crudo: GET https://api.meshy.ai/openapi/v2/text-to-3d/01a20a79-d04a-75f0-b92b-1d9e329f50f4 -> model_urls.glb.
# Etapa 1 (larga, hornea): blender-py tools/blender/galo-grande-v2b_meshy_ligero.py -- origen=<r.glb> salida=<carpeta> etapa=1
# Uso: tools/blender/galo-grande-v2b_meshy_todo.sh <carpeta del paso A> [r.glb]
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de bruto_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
blender-py tools/blender/galo-grande-v2b_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=2
python3 tools/blender/galo-grande-v2b_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
