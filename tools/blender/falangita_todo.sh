#!/bin/bash
# FA2: construye el falangita macedonio y su oficial en los cuatro niveles de detalle, dentro de assets/soldados.
# Necesita el entorno del taller (MakeHuman y Quaternius, CC0): source /opt/aqvila-taller/entorno.sh
set -e
cd "$(dirname "$0")/../.."
source /opt/aqvila-taller/entorno.sh
for s in falangita oficial-falange; do
  for n in "" --lod --lod2 --lod3; do
    echo "== $s $n"
    blender-py tools/blender/falangita_macedonio.py $s $n --salida=assets/soldados
  done
done
