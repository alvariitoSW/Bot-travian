#!/bin/bash
# AQVILA · Ministerio de Batallas y su taller de arte. Guion de instalación del entorno en la nube.
# Corre como root al construir el contenedor. Idempotente, no interactivo, sin secretos, sin demonios.
# Instala todo en /opt/aqvila-taller (fuera del repositorio). Ningún fallo corta: cada paso avisa y sigue.
T=/opt/aqvila-taller; mkdir -p "$T"/ual "$T"/mhdata; LOG="$T/instalacion.log"
aviso() { echo "AVISO aqvila-taller: $*" | tee -a "$LOG"; }
echo "== $(date -u +%FT%TZ) inicio" >> "$LOG"
PY=$(command -v python3.13 || command -v python3)

# 1) Blender sin pantalla: módulo bpy 5.3.0 de PyPI (exige Python 3.13) en un entorno propio.
if [ ! -x "$T/blender/bin/python" ]; then "$PY" -m venv "$T/blender" || aviso "no se pudo crear el entorno de Python"; fi
if ! "$T/blender/bin/python" -c "import bpy" >/dev/null 2>&1; then
  "$T/blender/bin/pip" install -q --no-cache-dir "bpy==5.3.0" numpy pillow >> "$LOG" 2>&1 || aviso "falló pip install bpy (PyPI)"
fi
"$T/blender/bin/python" -c "import bpy; print('bpy', bpy.app.version_string)" >> "$LOG" 2>&1 || aviso "bpy no importa"
cat > "$T/blender-py" <<'EOF'
#!/bin/bash
# Ejecuta un guion de bpy sin pantalla: blender-py guion.py [-- argumentos]
exec /opt/aqvila-taller/blender/bin/python "$@"
EOF
chmod +x "$T/blender-py"; ln -sf "$T/blender-py" /usr/local/bin/blender-py || aviso "no se pudo enlazar blender-py"

# 2) Quaternius, Universal Animation Library 1 y 2 (Standard), CC0, desde OpenGameArt.
OGA=https://opengameart.org/sites/default/files
baja_ual() { # $1 = zip, $2 = carpeta, $3 = ruta del .glb dentro del zip
  [ -s "$T/ual/$2/$(basename "$3")" ] && return 0
  curl -fsSL --retry 3 -m 600 -o "$T/ual/$1" "$OGA/$1" || { aviso "falló la descarga de $OGA/$1"; return 0; }
  "$PY" -I - "$T/ual/$1" "$T/ual/$2" "$3" <<'EOF' || aviso "no se pudo descomprimir $1"
import sys, zipfile, os, shutil
z = zipfile.ZipFile(sys.argv[1]); d = sys.argv[2]; os.makedirs(d, exist_ok=True); z.extractall(d + '/zip')
shutil.copy(d + '/zip/' + sys.argv[3], d + '/' + os.path.basename(sys.argv[3]))
os.remove(sys.argv[1])
EOF
}
baja_ual universal_animation_librarystandard.zip ual1 "Animation Library[Standard]/Godot/AnimationLibrary_Godot_Standard.glb"
baja_ual universal_animation_library_2standard.zip ual2 "Universal Animation Library 2 [Standard]/Unreal-Godot/UAL2_Standard.glb"

# 3) MakeHuman: solo datos (CC0), commit fijo de makehumancommunity/makehuman. No se usa su código (AGPL).
MHC=a8bc2d54ff0ac92e78ff71431b1023eda42bf482; MH="$T/mhdata"
if [ ! -s "$MH/default_weights.mhw" ] || [ ! -d "$MH/targets/macrodetails" ]; then
  rm -rf "$T/mh-git"
  ( set -e; git init -q "$T/mh-git"; cd "$T/mh-git"
    git remote add origin https://github.com/makehumancommunity/makehuman
    git config core.sparseCheckout true
    printf '%s\n' /LICENSE.md /makehuman/data/3dobjs/base.obj /makehuman/data/rigs/default.mhskel \
      /makehuman/data/rigs/default_weights.mhw /makehuman/data/targets/ > .git/info/sparse-checkout
    GIT_LFS_SKIP_SMUDGE=1 git fetch -q --depth 1 --filter=blob:none origin "$MHC"
    GIT_LFS_SKIP_SMUDGE=1 git checkout -q FETCH_HEAD ) >> "$LOG" 2>&1 || aviso "falló la descarga de MakeHuman (github.com)"
  D="$T/mh-git/makehuman/data"
  if [ -s "$D/rigs/default_weights.mhw" ]; then
    cp -f "$D/3dobjs/base.obj" "$D/rigs/default.mhskel" "$D/rigs/default_weights.mhw" "$MH/"
    rm -rf "$MH/targets"; cp -r "$D/targets" "$MH/targets"; cp -f "$T/mh-git/LICENSE.md" "$MH/LICENSE-MakeHuman.md"
    rm -rf "$T/mh-git"
  fi
fi

# 4) LEEME.txt y variables para los guiones del proyecto.
cat > "$T/entorno.sh" <<'EOF'
export MH_DATOS=/opt/aqvila-taller/mhdata UAL_DATOS=/opt/aqvila-taller/ual
EOF
grep -q aqvila-taller /etc/profile.d/aqvila-taller.sh 2>/dev/null || cp "$T/entorno.sh" /etc/profile.d/aqvila-taller.sh
V=$("$T/blender/bin/python" -c "import bpy; print(bpy.app.version_string)" 2>/dev/null || echo "NO INSTALADO")
cat > "$T/LEEME.txt" <<EOF
AQVILA · taller de arte del ministerio de Batallas (instalado $(date -u +%F))
Guion: gobierno/entornos/batallas-taller.sh del repositorio. Registro: $LOG
- Blender sin pantalla (módulo bpy de PyPI): $V
  Python con bpy: $T/blender/bin/python  (atajo: blender-py guion.py -- args)
- Quaternius UAL 1 (CC0): $T/ual/ual1/AnimationLibrary_Godot_Standard.glb
- Quaternius UAL 2 (CC0): $T/ual/ual2/UAL2_Standard.glb   (zip completo en ual*/zip)
  Fuente: $OGA/universal_animation_librarystandard.zip y ..._2standard.zip
- MakeHuman, solo datos (CC0): $MH (base.obj, default.mhskel, default_weights.mhw, targets/)
  Fuente: github.com/makehumancommunity/makehuman, commit $MHC
Variables: source $T/entorno.sh  (MH_DATOS y UAL_DATOS, las que leen los guiones de soldado-rome2/construir)
EOF
for f in "$T/ual/ual1/AnimationLibrary_Godot_Standard.glb" "$T/ual/ual2/UAL2_Standard.glb" "$MH/base.obj" "$MH/default_weights.mhw"; do
  [ -s "$f" ] || { aviso "falta $f"; echo "FALTA: $f" >> "$T/LEEME.txt"; }
done
echo "== $(date -u +%FT%TZ) fin" >> "$LOG"
exit 0
