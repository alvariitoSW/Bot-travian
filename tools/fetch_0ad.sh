#!/usr/bin/env bash
# Trae de un clon parcial de 0 A.D. solo los archivos de arte que usan nuestras unidades.
# Uso: tools/fetch_0ad.sh <clon de 0ad> <carpeta de salida>
# El clon se hace con: git clone --depth 1 --filter=blob:none --sparse https://github.com/0ad/0ad
#   y: git sparse-checkout set <art>/actors/units <art>/actors/props/units <art>/meshes/skeletal <art>/skeletons <art>/variants
set -euo pipefail
REPO=$1; OUT=$2; A=binaries/data/mods/public/art; HERE=$(cd "$(dirname "$0")" && pwd)
python3 -I "$HERE/resolve_units.py" "$REPO/$A" --files > "$OUT.files"
: > "$OUT.oids"; : > "$OUT.map"
while read -r f; do
  [ -e "$OUT/$f" ] && continue
  if [ -e "$REPO/$A/$f" ]; then mkdir -p "$OUT/$(dirname "$f")"; cp "$REPO/$A/$f" "$OUT/$f"; continue; fi
  o=$(git -C "$REPO" rev-parse -q --verify "HEAD:$A/$f") || { echo "no existe: $f" >&2; continue; }
  echo "$o" >> "$OUT.oids"; echo "$o $f" >> "$OUT.map"
done < "$OUT.files"
if [ -s "$OUT.oids" ]; then
  git -C "$REPO" -c fetch.negotiationAlgorithm=noop fetch origin --no-tags --no-write-fetch-head --recurse-submodules=no --filter=blob:none --stdin < "$OUT.oids" 2>&1 | grep -v "Auto packing\|git help gc" || true
  while read -r o f; do mkdir -p "$OUT/$(dirname "$f")"; git -C "$REPO" cat-file blob "$o" > "$OUT/$f"; done < "$OUT.map"
fi
# texturas DDS -> PNG
python3 -I - "$OUT" <<'PY'
import os, sys
from PIL import Image
for d, _, fs in os.walk(os.path.join(sys.argv[1], 'textures')):
    for f in fs:
        if f.endswith('.dds') and not os.path.exists(os.path.join(d, f[:-4] + '.png')):
            Image.open(os.path.join(d, f)).convert('RGBA').save(os.path.join(d, f[:-4] + '.png'))
PY
echo "archivos: $(wc -l < "$OUT.files")"
