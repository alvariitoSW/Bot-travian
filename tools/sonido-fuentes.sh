#!/bin/sh
# AQVILA — GM43i: baja las fuentes del sonido grabado (casi todas CC0; los gritos de SON10, no) a la carpeta que se le dé.
# Luego: python3 -I tools/sonido.py <carpeta> assets/sonido
set -e
D=${1:?carpeta de destino}; mkdir -p "$D"; cd "$D"
OGA=https://opengameart.org/sites/default/files
# OpenGameArt: «100 CC0 SFX» y «80 CC0 RPG SFX» (rubberduck), «50 RPG sound effects» (Kenney), «Swishes sound pack» (artisticdude)
for z in 100-CC0-SFX_0.zip:100-CC0-SFX 80-CC0-RPG-SFX_0.zip:80-CC0-RPG-SFX RPGsounds_Kenney.zip:RPGsounds_Kenney swishes.zip:swishes; do
  f=${z%%:*}; c=${z##*:}; curl -sfL -o "$f" "$OGA/$f"; mkdir -p "$c" t; unzip -q -o "$f" -d t
  find t -type f ! -name '._*' \( -name '*.ogg' -o -name '*.wav' \) -exec mv {} "$c"/ \; ; rm -rf t
done
# Freesound (vista previa «hq» de cada sonido; misma licencia CC0)
FS=https://cdn.freesound.org/previews
for p in 588/588278_6461270 539/539956_4366671 512/512490_2866779 553/553733_4905159; do
  id=$(basename "$p" | cut -d_ -f1); curl -sfL --retry 3 --max-time 180 -o "fs$id.mp3" "$FS/$p-hq.mp3"
done
# SON1-a: voces nuevas (canto, orden). Freesound; CC0 1.0
for p in 588/588578_11109094 661/661242_189858; do
  id=$(basename "$p" | cut -d_ -f1); curl -sfL --retry 3 --max-time 180 -o "fs$id.mp3" "$FS/$p-hq.mp3" || echo "no se pudo bajar fs$id"
done
# SON10 (24/11/2026): gritos y fragor reales. Freesound, vista previa «hq» (el original pide cuenta). Licencias en assets/sonido/LICENSE.txt
#   (SON12: quitados craigsmith 480809 y 675091 y Jace 57204, que decían inglés) felix.blume 612131 (CC0), JohnsonBrandEditing 173944 (CC0),
#   F.M.Audio 695377 695383 695381 695382 695387 695389 695388 695384 (CC BY 4.0), chripei 165492 (CC BY 4.0)
for p in 612/612131_1661766 173/173944_3229685 695/695377_7805242 695/695383_7805242 \
         695/695381_7805242 695/695382_7805242 695/695387_7805242 695/695389_7805242 695/695388_7805242 695/695384_7805242 165/165492_1617412; do
  id=$(basename "$p" | cut -d_ -f1); curl -sfL --retry 3 --max-time 180 -o "fs$id.mp3" "$FS/$p-hq.mp3" || echo "no se pudo bajar fs$id"
done
# OpenGameArt, originales: HaelDB «Male grunt/yelling sounds» (OGA-BY 3.0) y Michel Baradari «11 male human pain/death sounds» (CC BY 3.0).
# La segunda viene en .7z: hace falta `7z` o `pip install py7zr` (python3 -m py7zr x)
mkdir -p yell mb
curl -sfL --retry 3 -o yelling.zip "$OGA/yelling%20sounds.zip"
for f in yell5 1yell4 2yell4 yell11; do unzip -q -o -j yelling.zip "*/$f.wav" -d yell 2>/dev/null || unzip -q -o -j yelling.zip "$f.wav" -d yell; done
curl -sfL --retry 3 -o mb.7z "$OGA/michelbaradari-human.7z"
if command -v 7z >/dev/null 2>&1; then 7z x -y -o"mb_t" mb.7z >/dev/null; else python3 -m py7zr x mb.7z mb_t; fi
find mb_t -name '*.wav' -exec mv {} mb/ \; ; rm -rf mb_t yelling.zip mb.7z
echo "fuentes en $D"
