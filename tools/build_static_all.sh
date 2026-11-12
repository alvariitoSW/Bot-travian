#!/usr/bin/env bash
# Regenera assets/static a partir de 0 A.D.  Uso: tools/build_static_all.sh <clon de 0ad> <three/examples/jsm> <carpeta temporal>
set -euo pipefail
REPO=$1; JSM=$2; TMP=$3; HERE=$(cd "$(dirname "$0")" && pwd); A=binaries/data/mods/public/art
"$HERE/fetch_0ad.sh" "$REPO" "$TMP/art" resolve_static.py
python3 -I "$HERE/resolve_static.py" "$REPO/$A" > "$TMP/static-manifest.json"
rm -rf "$TMP/static"; NODE_PATH=$(npm root -g) node "$HERE/build_static.mjs" "$TMP/art" "$TMP/static-manifest.json" "$JSM" "$TMP/static"
# el anfiteatro pesa más del tope por edificio: se aligera y se reduce a escala de ciudad; termas y acueducto se dibujan desde cero
# (aligerar_static.mjs necesita el paquete npm meshoptimizer en NODE_PATH)
node "$HERE/aligerar_static.mjs" "$TMP/static" anfiteatro 8500 0.45
node "$HERE/propio_static.mjs" "$TMP/static"
python3 -I "$HERE/build_static_tex.py" "$TMP/art" "$TMP/static"
# piezas propias (gobierno/maquetas/piezas, lista en tools/piezas_maqueta.txt): se ponen en $TMP/static ANTES del rm para que no se pierdan
node "$HERE/piezas_propias.mjs" "$TMP/static" "$HERE/../gobierno/maquetas/piezas" "$HERE/piezas_maqueta.txt"
cp "$HERE/../assets/static/LICENSE.txt" "$TMP/static/"; rm -rf "$HERE/../assets/static"; mkdir -p "$HERE/../assets/static"; cp "$TMP/static"/* "$HERE/../assets/static/"
du -sh "$HERE/../assets/static"
