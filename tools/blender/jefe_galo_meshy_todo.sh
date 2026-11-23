#!/usr/bin/env bash
# AL6: rehace el jefe galo (variante de los galos) a partir del modelo de Meshy del usuario (refine 01a20a7f-0b5d-70e4-b039-2918c7b43cf1).
# Paso A (aligerado, esqueleto y postura del juego) y paso B (manos de MakeHuman, capa teñible, texturas webp; sin armas)
# para los cuatro niveles de assets/soldados/jefe-galo*.
# Uso: tools/blender/jefe_galo_meshy_todo.sh <carpeta del paso A> [jefe-galo.glb de Meshy: si se da, repite también la etapa 1]
# El GLB se baja así (el proxy del taller pone la clave): GET https://api.meshy.ai/openapi/v2/text-to-3d/<refine> -> model_urls.glb
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de ligero_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
if [ -n "$ORIGEN" ]; then ETAPA=1; else ETAPA=2; fi
blender-py tools/blender/jefe_galo_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=$ETAPA
python3 tools/blender/jefe_galo_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
