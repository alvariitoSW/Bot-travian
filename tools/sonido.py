# AQVILA — GM43i: corta, iguala y comprime el sonido grabado de las escenas a pie (assets/sonido/).
# Todo es CC0 (dominio público) y sale de OpenGameArt y Freesound; la lista con autor y enlace está en
# assets/sonido/LICENSE.txt. Uso:
#   sh tools/sonido-fuentes.sh <carpeta>        # baja las fuentes (una vez)
#   python3 -I tools/sonido.py <carpeta> assets/sonido
# Necesita ffmpeg (con libmp3lame) y numpy. Salida: mp3 mono a 32 kHz, VBR calidad 7 (unos 45-60 kb/s).
import os, subprocess, sys
import numpy as np

SR = 32000
FUENTE, SALIDA = sys.argv[1], sys.argv[2]


def lee(ruta):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(FUENTE, ruta), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def escribe(nombre, x, calidad=7):
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame',
                    '-q:a', str(calidad), os.path.join(SALIDA, nombre + '.mp3')], input=x.tobytes(), check=True)


def trozo(x, a, b):
    return x[int(a * SR):int(b * SR)].copy()


def iguala(x, pico_db=-1.0):
    m = np.abs(x).max()
    return x * (10 ** (pico_db / 20) / m) if m > 0 else x


def fundidos(x, ent=0.004, sal=0.08):
    n, m = int(ent * SR), int(sal * SR)
    if n: x[:n] *= np.linspace(0, 1, n)
    if m: x[-m:] *= np.linspace(1, 0, m) ** 2
    return x


def bucle(x, cruce=0.6):
    # el final se funde con el principio: al repetirse no se oye el corte
    n = int(cruce * SR)
    cola, resto = x[-n:], x[:-n].copy()
    t = np.linspace(0, 1, n)
    resto[:n] = resto[:n] * np.sqrt(t) + cola * np.sqrt(1 - t)
    return resto


def suave(x, hz=6000):
    # paso bajo sencillo (media móvil) para quitar siseo de grabaciones viejas
    k = max(1, int(SR / hz))
    return np.convolve(x, np.ones(k) / k, mode='same')


R1 = '100-CC0-SFX'          # rubberduck, OpenGameArt
R2 = '80-CC0-RPG-SFX'       # rubberduck, OpenGameArt
KEN = 'RPGsounds_Kenney'    # Kenney, OpenGameArt
SW = 'swishes'              # artisticdude, OpenGameArt

# (nombre, archivo, desde, hasta, pico dB) — golpes cortos
GOLPES = [
    ('madera1', f'{R1}/wooden_01.ogg', 0, None, -1), ('madera2', f'{R1}/wooden_02.ogg', 0, None, -1),
    ('madera3', f'{R2}/wood_03.ogg', 0, None, -1), ('madera4', f'{R2}/wood_05.ogg', 0, None, -1),
    ('hierro1', f'{R1}/metal_01.ogg', 0, None, -2), ('hierro2', f'{R1}/metal_03.ogg', 0, None, -2),
    ('hierro3', f'{R1}/metal_07.ogg', 0, 0.6, -2), ('hierro4', 'fs588278.mp3', 3.42, 3.95, -2),
    ('escudo1', 'fs588278.mp3', 6.45, 7.0, -1), ('escudo2', 'fs588278.mp3', 9.03, 9.6, -1),
    ('escudo3', f'{R1}/slam_03.ogg', 0, None, -1), ('escudo4', f'{R1}/slam_02.ogg', 0, None, -1),
    ('paso1', f'{KEN}/footstep00.ogg', 0, None, -2), ('paso2', f'{KEN}/footstep02.ogg', 0, None, -2),
    ('paso3', f'{KEN}/footstep05.ogg', 0, None, -2), ('paso4', f'{KEN}/footstep08.ogg', 0, None, -2),
    ('vuelo1', f'{SW}/swish-1.wav', 0, None, -2), ('vuelo2', f'{SW}/swish-5.wav', 0, None, -2), ('vuelo3', f'{SW}/swish-9.wav', 0, None, -2),
    ('esfuerzo1', 'fs511023.mp3', 0.50, 0.95, -3), ('esfuerzo2', 'fs511023.mp3', 5.32, 5.75, -3),
    ('esfuerzo3', 'fs511023.mp3', 9.02, 9.5, -3), ('esfuerzo4', 'fs511023.mp3', 26.27, 26.85, -3),
    ('herido1', 'fs803168.mp3', 4.20, 4.75, -3), ('herido2', 'fs803168.mp3', 11.58, 12.25, -3),
    ('coro1', 'fs57204.mp3', 0.02, 0.7, -2),
    ('grito1', 'fs521830.mp3', 0.05, 1.5, -2), ('grito2', 'fs521831.mp3', 0.0, 2.5, -2), ('grito3', 'fs521832.mp3', 0.03, 0.95, -2),
]
# (nombre, archivo, desde, hasta, pico dB, fundido de salida) — frases largas
LARGOS = [
    ('clamor1', 'fs621374.mp3', 1.9, 6.4, -2, 0.8),       # vikingos que gritan antes de la batalla
    ('clamor2', 'fs563011.mp3', 11.0, 15.0, -2, 0.8),      # gente que grita al cargar
    ('cuerno1', 'fs539956.mp3', 0.0, 4.3, -2, 0.5),        # cuerno de guerra (tubo), el romano
    ('cuerno2', 'fs512490.mp3', 1.0, 5.4, -2, 0.9),        # cuerno de guerra lejano, el rival
]
# (nombre, archivo, desde, hasta, pico dB) — fondos que se repiten sin corte
BUCLES = [
    ('lucha1', 'fs376646.mp3', 70.0, 77.6, -3),            # recreadores vikingos: espadas y escudos de verdad
    ('lucha2', 'fs177084.mp3', 0.3, 9.9, -3),              # guerreros con espada y escudo
    ('viento1', 'fs553733.mp3', 20.0, 29.6, -6),           # viento en campo abierto
]

os.makedirs(SALIDA, exist_ok=True)
for nombre, ruta, a, b, pico in GOLPES:
    x = lee(ruta)
    x = trozo(x, a, b if b is not None else len(x) / SR)
    escribe(nombre, fundidos(iguala(x, pico), 0.002, min(0.06, len(x) / SR / 4)))
for nombre, ruta, a, b, pico, sal in LARGOS:
    escribe(nombre, fundidos(iguala(trozo(lee(ruta), a, b), pico), 0.01, sal))
for nombre, ruta, a, b, pico in BUCLES:
    x = trozo(lee(ruta), a, b)
    if nombre.startswith('viento'): x = suave(x, 5000)
    escribe(nombre, iguala(bucle(x), pico), 8)
print('hecho:', len(GOLPES) + len(LARGOS) + len(BUCLES), 'sonidos en', SALIDA)
