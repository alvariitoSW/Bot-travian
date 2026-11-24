#!/usr/bin/env bash
# AL2: rehace el galo rápido a partir del modelo de Meshy (MS2, refine 01a20a86-e8e0-717d-b1bc-1fdc351c7609;
# generado por el usuario, plan de pago; publicado CC BY-SA 3.0 citando a Meshy).
# Paso A, etapa 2 (esqueleto y exportación ligera; necesita los bruto_*.npz de la etapa 1) y paso B (manos de MakeHuman,
# sin armas ni escudo; texturas webp) para los cuatro niveles de assets/soldados/galo-rapido*.
# Etapa 1 (aligerado y horneado, ≈15 min), aparte:
#   blender-py tools/blender/galo-rapido_meshy_ligero.py -- origen=<galo-rapido.glb> salida=<carpeta> etapa=1
# Uso: tools/blender/galo-rapido_meshy_todo.sh <carpeta del paso A>
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de bruto_*.npz)}"
source /opt/aqvila-taller/entorno.sh
blender-py tools/blender/galo-rapido_meshy_ligero.py -- salida="$P6" fotos="$P6/fotos" etapa=2
python3 tools/blender/galo-rapido_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
