#!/bin/sh
# AQVILA — GM43i: baja las fuentes del sonido grabado (todas CC0) a la carpeta que se le dé.
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
for p in 588/588278_6461270 511/511023_1484610 803/803168_17274093 57/57204_60285 521/521830_3718141 521/521831_3718141 \
         521/521832_3718141 621/621374_13749321 563/563011_6253486 539/539956_4366671 512/512490_2866779 376/376646_6972943 \
         177/177084_499617 553/553733_4905159; do
  id=$(basename "$p" | cut -d_ -f1); curl -sfL --retry 3 --max-time 180 -o "fs$id.mp3" "$FS/$p-hq.mp3"
done
# SON1-a: voces nuevas (órdenes, aclamación, pánico, canto, quejidos). Freesound; todas CC0 1.0 salvo que la ficha diga otra cosa
for p in 623/623449_13749321 396/396230_5338586 264/264377_1654262 491/491405_9616576 588/588578_11109094 \
         556/556006_12424405 325/325548_2826150 477/477756_1192746 661/661242_189858; do
  id=$(basename "$p" | cut -d_ -f1); curl -sfL --retry 3 --max-time 180 -o "fs$id.mp3" "$FS/$p-hq.mp3" || echo "no se pudo bajar fs$id"
done
echo "fuentes en $D"
