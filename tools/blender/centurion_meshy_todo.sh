#!/usr/bin/env bash
# AL3: rehace el centurión (el oficial a pie del jugador) a partir del modelo de Meshy (plan de pago; CC BY-SA 3.0 citando a Meshy).
# Copia de hastatus_meshy_todo.sh. Paso A entero (etapa 1: aligerado y horneado; etapa 2: esqueleto y exportación ligera)
# y paso B (manos de MakeHuman, sin armas ni escudo, cresta y capa avivadas de lejos; texturas webp) para los cuatro niveles
# de assets/soldados/centurion*.
# El GLB no está en el repositorio: se baja con la tarea refine 01a20a81-6441-70c2-9f9f-06a46097040d de la API de Meshy
# (GET https://api.meshy.ai/openapi/v2/text-to-3d/<id> → model_urls.glb, en assets.meshy.ai).
# Uso: tools/blender/centurion_meshy_todo.sh <carpeta del paso A> [centurion.glb]   (sin GLB: solo etapa 2, con los bruto_*.npz ya hechos)
set -euo pipefail
cd "$(dirname "$0")/../.."
PA="${1:?falta la carpeta del paso A}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
if [ -n "$ORIGEN" ]; then ETAPA=1; else ETAPA=2; fi
blender-py tools/blender/centurion_meshy_ligero.py -- origen="$ORIGEN" salida="$PA" etapa=$ETAPA
python3 tools/blender/centurion_meshy_juego.py entrada="$PA" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
