#!/usr/bin/env bash
# FA2: rehace el falangita y el oficial de la falange a partir del soldado de Meshy (CC BY 4.0, generado por el usuario).
# Paso A, etapa 2 (esqueleto y exportación ligera; necesita los bruto_*.npz de la etapa 1) y paso B (manos de MakeHuman,
# escudo, sarisa, correa, penacho; texturas webp) para los ocho archivos: falangita y oficial-falange, cuatro niveles.
# Uso: tools/blender/falangita_meshy_todo.sh <carpeta del paso A> [carpeta origen con m.fbx]
set -euo pipefail
cd "$(dirname "$0")/../.."
P6="${1:?falta la carpeta del paso A (la de ligero_*.npz)}"; ORIGEN="${2:-}"
source /opt/aqvila-taller/entorno.sh
blender-py tools/blender/falangita_meshy_ligero.py -- origen="$ORIGEN" salida="$P6" etapa=2
python3 tools/blender/falangita_meshy_juego.py entrada="$P6" quien=todos salida=assets/soldados
node gobierno/arte.mjs | tail -3
