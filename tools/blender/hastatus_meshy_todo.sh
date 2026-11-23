#!/usr/bin/env bash
# FA2-R: rehace el hastatus a partir del romano de Meshy (CC BY 4.0, generado por el usuario).
# Paso A, etapa 2 (esqueleto y exportación ligera; necesita los bruto_*.npz de la etapa 1) y paso B (manos de MakeHuman,
# escudo oval, pilum, espada, vaina; túnica teñible; texturas webp) para los cuatro niveles de assets/soldados/hastatus*.
# Uso: tools/blender/hastatus_meshy_todo.sh <carpeta del paso A> [r.glb de Meshy (solo si la etapa 2 lo pide)]
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de ligero_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
blender-py tools/blender/hastatus_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=2
python3 tools/blender/hastatus_meshy_juego.py entrada="$P6" salida=assets/soldados
git diff --quiet -- assets/soldados/movimientos_escudo_36.bin assets/soldados/movimientos_escudo_74.bin || echo "AVISO: cambiaron los movimientos_escudo_*.bin"
node gobierno/arte.mjs | tail -3
