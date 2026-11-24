#!/usr/bin/env python3
# AQVILA — SON7 (24/11/2026): compone los golpes que faltaban en la lucha a pie, a partir de sonidos CC0 de OpenGameArt.
#   caida  (×3): un hombre con escudo y hierro cae al suelo (golpe sordo, cuero, cadenas y el escudo que rebota)
#   clava  (×2): un pilum o un venablo se clava en un escudo (madera que suena hueca y un chasquido de hierro)
#   empuje (×2): escudo contra escudo al empujar (golpe grave de tablas y ropa)
#   tajo   (×2): un gladio que da en un escudo o en un cuerpo (golpe corto con filo)
# Fuentes (todas CC0 1.0): «100 CC0 SFX» y «80 CC0 RPG SFX» (rubberduck) y «50 RPG sound effects» (Kenney), de OpenGameArt.
# Se bajan con tools/sonido-fuentes.sh (las tres ya estaban en el banco). Uso:
#   python3 -I tools/sonido-fragor.py <carpeta de fuentes> assets/sonido
# Salida: mp3 mono a 32 kHz, pico −1 dB (las reglas de gobierno/arte.json → sonido).
import os, subprocess, sys
import numpy as np

SR = 32000
FUENTE, SALIDA = sys.argv[1], sys.argv[2]
_cache = {}


def lee(nombre):
    if nombre in _cache: return _cache[nombre]
    ruta = None
    for r, _, fs in os.walk(FUENTE):
        if nombre + '.ogg' in fs: ruta = os.path.join(r, nombre + '.ogg'); break
    if not ruta: sys.exit('falta la fuente ' + nombre)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    _cache[nombre] = x
    return x


def tono(x, semitonos):
    # cambia el tono (y la duración, como una cinta más lenta): más grave = más pesado
    if not semitonos: return x
    k = 2 ** (semitonos / 12)
    n = int(len(x) / k)
    return np.interp(np.arange(n) * k, np.arange(len(x)), x)


def grave(x, hz):
    # paso bajo de un polo: quita el brillo (lo lejano, lo blando)
    a = np.exp(-2 * np.pi * hz / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
    return y


def capa(nombre, t=0.0, db=0.0, st=0, lp=None):
    x = tono(lee(nombre), st)
    if lp: x = grave(x, lp)
    return int(t * SR), x * 10 ** (db / 20)


def mezcla(capas, cola=0.08):
    n = max(o + len(x) for o, x in capas)
    y = np.zeros(n)
    for o, x in capas: y[o:o + len(x)] += x
    # recorta silencio final y funde
    umbral = np.max(np.abs(y)) * 0.003
    fin = len(y)
    while fin > 1 and abs(y[fin - 1]) < umbral: fin -= 1
    y = y[:min(len(y), fin + int(0.02 * SR))]
    f = min(len(y), int(cola * SR)); y[-f:] *= np.linspace(1, 0, f)
    y[:32] *= np.linspace(0, 1, 32)
    return y / np.max(np.abs(y)) * 10 ** (-1 / 20)


def escribe(nombre, y):
    ruta = os.path.join(SALIDA, nombre + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-q:a', '6', ruta],
                   input=y.astype(np.float32).tobytes(), check=True)
    rms = 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-9)
    print(f'{nombre:8s} {len(y) / SR:5.2f} s  media {rms:6.1f} dB  {os.path.getsize(ruta) / 1024:5.1f} KB')


RECETAS = {
    # el cuerpo (golpe grave y cuero), las piezas de hierro (cadenas, muy bajas) y el escudo que da en el suelo un momento después
    'caida1': [('slam_03', 0, 0, -6, 2200), ('dropLeather', 0.03, -2, -3, None), ('chain_01', 0.05, -14, -2, 5000), ('wooden_01', 0.21, -7, -4, 2500)],
    'caida2': [('slam_01', 0, 0, -7, 2000), ('cloth1', 0, -6, 0, None), ('dropLeather', 0.06, -3, -5, None), ('chain_02', 0.09, -15, -1, 5000), ('item_wood_01', 0.27, -9, -5, 2500)],
    'caida3': [('slam_05', 0, 0, -5, 2400), ('dropLeather', 0.02, -1, -2, None), ('stones_02', 0.12, -16, -3, 3000), ('wood_03', 0.18, -8, -6, 2200)],
    # la punta entra en la madera: golpe hueco y un chasquido de hierro encima
    'clava1': [('chop', 0, 0, -2, None), ('wood_01', 0.005, -4, -5, 3000), ('blade_01', 0, -13, 2, None)],
    'clava2': [('chop', 0, 0, -4, None), ('wooden_01', 0.01, -5, -3, 3500), ('blade_02', 0, -14, 3, None)],
    # escudo contra escudo: tablas que chocan con todo el peso, y la ropa
    'empuje1': [('slam_01', 0, 0, -9, 1600), ('wooden_01', 0.01, -3, -6, 2200), ('cloth3', 0.02, -7, -2, None)],
    'empuje2': [('slam_03', 0, 0, -10, 1500), ('item_wood_01', 0.0, -4, -7, 2000), ('cloth1', 0.03, -8, -3, None)],
    # gladio que da: golpe seco y filo
    'tajo1': [('hit_02', 0, 0, -3, 4000), ('blade_01', 0.0, -6, 0, None), ('cloth3', 0.02, -10, 0, None)],
    'tajo2': [('hit_04', 0, 0, -4, 4000), ('blade_02', 0.0, -7, -1, None), ('beltHandle1', 0.03, -10, -2, None)],
}

if __name__ == '__main__':
    for nombre, cs in RECETAS.items():
        escribe(nombre, mezcla([capa(*c) for c in cs]))
