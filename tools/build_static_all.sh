#!/usr/bin/env bash
# Regenera assets/static a partir de 0 A.D.  Uso: tools/build_static_all.sh <clon de 0ad> <three/examples/jsm> <carpeta temporal>
set -euo pipefail
REPO=$1; JSM=$2; TMP=$3; HERE=$(cd "$(dirname "$0")" && pwd); A=binaries/data/mods/public/art
"$HERE/fetch_0ad.sh" "$REPO" "$TMP/art" resolve_static.py
python3 -I "$HERE/resolve_static.py" "$REPO/$A" > "$TMP/static-manifest.json"
rm -rf "$TMP/static"; NODE_PATH=$(npm root -g) node "$HERE/build_static.mjs" "$TMP/art" "$TMP/static-manifest.json" "$JSM" "$TMP/static"
python3 -I "$HERE/build_static_tex.py" "$TMP/art" "$TMP/static"
cp "$HERE/../assets/static/LICENSE.txt" "$TMP/static/"; rm -rf "$HERE/../assets/static"; mkdir -p "$HERE/../assets/static"; cp "$TMP/static"/* "$HERE/../assets/static/"
du -sh "$HERE/../assets/static"
