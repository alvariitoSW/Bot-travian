#!/usr/bin/env bash
# Regenera assets/units a partir de 0 A.D.  Uso: tools/build_all.sh <clon de 0ad> <three/examples/jsm> <carpeta temporal>
set -euo pipefail
REPO=$1; JSM=$2; TMP=$3; HERE=$(cd "$(dirname "$0")" && pwd); A=binaries/data/mods/public/art
"$HERE/fetch_0ad.sh" "$REPO" "$TMP/art"
python3 -I "$HERE/resolve_units.py" "$REPO/$A" > "$TMP/manifest.json"
rm -rf "$TMP/units"; NODE_PATH=$(npm root -g) node "$HERE/build_units.mjs" "$TMP/art" "$TMP/manifest.json" "$JSM" "$TMP/units"
python3 -I "$HERE/build_atlas.py" "$TMP/art" "$TMP/units"
rm -rf "$HERE/../assets/units"; mkdir -p "$HERE/../assets/units"; cp "$TMP/units"/* "$HERE/../assets/units/"
du -sh "$HERE/../assets/units"
