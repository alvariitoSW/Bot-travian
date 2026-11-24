#!/usr/bin/env python3
"""Prepara la banda sonora de AQVILA (SON7): recorta, cose en bucle, iguala a -16 LUFS y codifica mp3 a 80 kb/s.
Uso: python3 -I tools/musica.py <carpeta con las originales> <carpeta de salida>
Originales (de OpenGameArt, ver assets/musica/LICENSE.txt): menu.mp3, ciudad.mp3, mapa.mp3, batalla.wav (SON12: el «Blackmoor Colossus Loop (No Vocals).wav», sin coro),
victoria.wav, derrota.wav. Solo ffmpeg y numpy."""
import os, re, subprocess, sys, tempfile
import numpy as np
SR = 44100
# nombre: (origen, inicio s, fin s o None, bucle)
PISTAS = {
  'menu':     ('menu.mp3', 45.0, 190.0, True),
  'ciudad':   ('ciudad.mp3', 0.0, None, True),
  'mapa':     ('mapa.mp3', 0.0, None, True),
  'batalla':  ('batalla.wav', 0.0, None, True),
  'victoria': ('victoria.wav', 0.0, None, False),
  'derrota':  ('derrota.wav', 0.0, None, False),
}
def lee(ruta):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, dtype=np.float32).reshape(-1, 2).copy()
def bucle(x, cruce=1.5):
    """El final se mezcla (potencia constante) con el principio: al repetir, no hay salto."""
    c = int(cruce * SR); t = np.linspace(0, np.pi / 2, c)[:, None]
    mezcla = x[-c:] * np.cos(t) + x[:c] * np.sin(t)
    return np.concatenate([x[c:-c], mezcla])
def fundidos(x, ent, sal):
    x = x.copy(); a, b = int(ent * SR), int(sal * SR)
    if a: x[:a] *= np.linspace(0, 1, a)[:, None]
    if b: x[-b:] *= np.linspace(1, 0, b)[:, None]
    return x
def lufs(ruta):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', ruta, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1])
def main(ent, sal):
    os.makedirs(sal, exist_ok=True)
    for nombre, (origen, a, b, loop) in PISTAS.items():
        x = lee(os.path.join(ent, origen)); x = x[int(a * SR): int(b * SR) if b else None]
        x = bucle(x) if loop else fundidos(x, 0.01, 1.5)
        with tempfile.TemporaryDirectory() as d:
            w = os.path.join(d, 'a.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', w], input=x.astype(np.float32).tobytes(), check=True)
            g = -16.0 - lufs(w)
            out = os.path.join(sal, nombre + '.mp3')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af', f'volume={g:.2f}dB,alimiter=limit=0.89:level=disabled', '-c:a', 'libmp3lame', '-b:a', '80k', '-ar', str(SR), '-ac', '2', out], check=True)
        print(nombre, f'{len(x)/SR:.1f} s', f'{os.path.getsize(out)/1e6:.2f} MB', f'{lufs(out):.1f} LUFS', 'gan', f'{g:+.1f} dB')
if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
