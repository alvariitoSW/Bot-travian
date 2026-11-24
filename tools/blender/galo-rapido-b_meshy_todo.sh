#!/usr/bin/env bash
# AL8: el galo rápido «B» de Meshy (generado por el usuario; CC BY-SA 3.0 citando a Meshy) como soldado del juego.
# Paso A, etapa 2 (esqueleto y exportación ligera; necesita los bruto_*.npz de la etapa 1) y paso B (manos de MakeHuman,
# sin armas; túnica teñible; zapatos y hebilla repintados; texturas webp) para los cuatro niveles de assets/soldados/galo-rapido-b*.
# Uso: tools/blender/galo-rapido-b_meshy_todo.sh <carpeta del paso A> [r.glb de Meshy]
# Etapa 1 (aligerado y horneado, ≈10 min): blender-py tools/blender/galo-rapido-b_meshy_ligero.py -- origen=<r.glb> salida=<carpeta> etapa=1
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de bruto_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
blender-py tools/blender/galo-rapido-b_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=2
python3 tools/blender/galo-rapido-b_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
