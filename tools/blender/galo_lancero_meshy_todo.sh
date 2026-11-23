#!/usr/bin/env bash
# AL5: el galo lancero de Meshy (lote MS2, generado por el usuario con plan de pago; CC BY-SA 3.0 citando a Meshy) como
# soldado del juego «galo-lancero». Baja el GLB por su identificador si falta, paso A (etapa 1 si no hay bruto_*.npz;
# etapa 2 siempre) y paso B (manos de MakeHuman, túnica y capa teñibles; texturas webp), cuatro niveles. Sin armas ni escudo.
# Uso: tools/blender/galo_lancero_meshy_todo.sh [carpeta de trabajo, por defecto /opt/aqvila-taller/meshy/galo-lancero]
set -euo pipefail
cd "$(dirname "$0")/../.."
DIR="${1:-/opt/aqvila-taller/meshy/galo-lancero}"; GLB="$DIR/galo-lancero.glb"; P6="$DIR/pasoA"
REFINE=01a20a7d-30d2-7087-b698-51522e21f7b7
mkdir -p "$P6"
if [ ! -f "$GLB" ]; then     # la API de Meshy necesita la clave (la pone el proxy del entorno); la descarga sale de assets.meshy.ai
  curl -sf -H "Authorization: Bearer x" "https://api.meshy.ai/openapi/v2/text-to-3d/$REFINE" -o "$DIR/refine.json"
  curl -sf -o "$GLB" "$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['model_urls']['glb'])" "$DIR/refine.json")"
fi
source /opt/aqvila-taller/entorno.sh
[ -f "$P6/bruto_fondo.npz" ] || blender-py tools/blender/galo_lancero_meshy_ligero.py -- origen="$GLB" salida="$P6" etapa=1
blender-py tools/blender/galo_lancero_meshy_ligero.py -- origen="$GLB" salida="$P6" etapa=2
python3 tools/blender/galo_lancero_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
