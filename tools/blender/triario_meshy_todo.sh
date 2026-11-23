#!/usr/bin/env bash
# AL4: rehace el triario a partir del de Meshy (generado por el usuario, plan de pago; CC BY-SA 3.0, Meshy como herramienta).
# Paso A, etapa 1 si falta (aligerado y horneado, ≈15 min) y etapa 2 (esqueleto), y paso B (manos de MakeHuman, escudo oval,
# lanza, espada, vaina; túnica teñible; texturas webp) para los cuatro niveles de assets/soldados/triario*.
# El GLB se baja de la API de Meshy: GET /openapi/v2/text-to-3d/01a20a83-9e6f-73f8-b12f-867ede383d49 -> model_urls.glb.
# Uso: tools/blender/triario_meshy_todo.sh <carpeta del paso A> [triario.glb de Meshy (solo si falta la etapa 1)]
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de ligero_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
[ -f "$P6/bruto_fondo.npz" ] || blender-py tools/blender/triario_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=1
blender-py tools/blender/triario_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=2
python3 tools/blender/triario_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
