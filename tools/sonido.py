# AQVILA — GM43i: corta, iguala y comprime el sonido grabado de las escenas a pie (assets/sonido/).
# Casi todo es CC0 (dominio público); los gritos de SON10 son CC BY 3.0/4.0 u OGA-BY 3.0 (ver assets/sonido/LICENSE.txt) y sale de OpenGameArt y Freesound; la lista con autor y enlace está en
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
]
# (nombre, archivo, desde, hasta, pico dB, fundido de salida) — frases largas
LARGOS = [
    ('cuerno1', 'fs539956.mp3', 0.0, 4.3, -2, 0.5),        # cuerno de guerra (tubo), el romano
    ('cuerno2', 'fs512490.mp3', 1.0, 5.4, -2, 0.9),        # cuerno de guerra lejano, el rival
]
# (nombre, archivo, desde, hasta, pico dB) — fondos que se repiten sin corte
BUCLES = [
    ('viento1', 'fs553733.mp3', 20.0, 29.6, -6),           # viento en campo abierto
]

# SON1-a: voces nuevas. (nombre, archivo, desde, hasta, pico dB, fundido de entrada, fundido de salida)
VOCES = [
    ('orden1', 'fs661242.mp3', 0.00, 1.05, -2, 0.01, 0.10),   # grito gutural sin palabra (DeqstersLab). SON2: quitadas las otras tres (podían llevar palabras no permitidas)
    ('canto1', 'fs588578.mp3', 0.25, 2.55, -2, 0.03, 0.25),   # hombres que cantan a coro (marconi68)
    ('canto2', 'fs588578.mp3', 2.55, 4.85, -2, 0.03, 0.25),
]

# ---- SON10: gritos y fragor de batalla grabados (CC0, CC BY 3.0/4.0 y OGA-BY 3.0; autor y enlace en assets/sonido/LICENSE.txt) ----
# Se igualan por volumen medio (RMS) con limitador, no por pico: son voces y multitudes que deben sonar parejas.
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def limita(x, techo=-2.6):
    # limitador con anticipación: la ganancia baja un poco antes de cada pico y se suaviza
    t = 10 ** (techo / 20)
    g = np.minimum(1, t / (np.abs(x) + 1e-9))
    w = int(0.004 * SR)
    gp = np.pad(g, (w, w), mode='edge')
    gm = np.lib.stride_tricks.sliding_window_view(gp, 2 * w + 1).min(axis=1)[:len(x)]
    k = np.hanning(2 * w + 1)
    k /= k.sum()
    gs = np.convolve(np.pad(gm, (w, w), mode='edge'), k, 'valid')[:len(x)]
    return x * np.minimum(gs, g)


def iguala_rms(x, obj=-18.0):
    for _ in range(6):
        x = limita(x * 10 ** ((obj - rms_db(x)) / 20))
    return x


def recorta(x, umbral=-32):
    # quita el silencio de los extremos (lo que queda a más de `umbral` dB bajo el máximo)
    w = int(0.01 * SR)
    e = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) + 1e-9 for i in range(0, len(x), w)])
    ok = np.where(20 * np.log10(e) > 20 * np.log10(e.max()) + umbral)[0]
    return x[max(0, ok[0] * w - int(0.02 * SR)):min(len(x), (ok[-1] + 1) * w + int(0.12 * SR))]


# (nombre, archivo, desde, hasta, recortar, fundido de entrada, fundido de salida, ¿bucle?) — cada grito, en su propio archivo.
# Freesound: vista previa «hq» (bajar el original pide cuenta); OpenGameArt: el original.
GRABADOS = [
    ('masa1', 'fs612131.mp3', 8.0, 17.5, False, 1.5, 1.5, False),       # felix.blume: 60 000 voces «huuu»; bajo el clamor, según el tamaño del ejército (CC0)
    ('grito1', 'yell/yell5.wav', 0, None, True, 0.005, 0.08, False),    # HaelDB: cuatro hombres que gritan al atacar (OGA-BY 3.0)
    ('grito2', 'yell/1yell4.wav', 0, None, True, 0.005, 0.08, False),
    ('grito3', 'yell/2yell4.wav', 0, None, True, 0.005, 0.08, False),
    ('grito4', 'yell/yell11.wav', 0, None, True, 0.005, 0.08, False),
    ('grito5', 'fs695377.mp3', 0, None, True, 0.005, 0.08, False),      # F.M.Audio: grito de ataque (CC BY 4.0)
    ('esfuerzo1', 'fs695383.mp3', 0, None, True, 0.005, 0.08, False),   # F.M.Audio: gruñidos de ataque, el esfuerzo del golpe (CC BY 4.0)
    ('esfuerzo2', 'fs695381.mp3', 0, None, True, 0.005, 0.08, False),
    ('esfuerzo3', 'fs695382.mp3', 0, None, True, 0.005, 0.08, False),
    ('herido1', 'fs695387.mp3', 0, None, True, 0.005, 0.1, False),      # F.M.Audio: gritos de muerte al caer (CC BY 4.0)
    ('herido2', 'fs695389.mp3', 0, None, True, 0.005, 0.1, False),
    ('herido3', 'fs695388.mp3', 0, None, True, 0.005, 0.1, False),
    ('herido4', 'fs695384.mp3', 0, None, True, 0.005, 0.1, False),
    ('herido5', 'mb/die1.wav', 0, None, True, 0.005, 0.1, False),       # Michel Baradari: muerte con voz grave (CC BY 3.0)
    ('quejido1', 'mb/pain2.wav', 0, None, True, 0.005, 0.1, False),     # Michel Baradari: quejidos de dolor (CC BY 3.0)
    ('quejido2', 'mb/pain4.wav', 0, None, True, 0.005, 0.1, False),
    ('quejido3', 'mb/pain5.wav', 0, None, True, 0.005, 0.1, False),
    ('aclamacion1', 'fs165492.mp3', 0.62, None, True, 0.005, 0.4, False),  # chripei: diez hombres vitorean; se corta el «yeah» inicial (CC BY 4.0)
    ('panico1', 'fs173944.mp3', 0.0, 4.2, True, 0.005, 0.3, False),     # JohnsonBrandEditing: gritos de miedo, tres tomas (CC0)
    ('panico2', 'fs173944.mp3', 6.0, 9.7, True, 0.005, 0.3, False),
    ('panico3', 'fs173944.mp3', 9.7, 12.8, True, 0.005, 0.3, False),
]

# ---- SON12 (24/11/2026): mezclas sin una sola palabra ----
# Regla del usuario: nada que suene en el juego lleva inglés (salvo la voz de los galos enemigos). Whisper oyó «hey» y «come on» en clamor1
# (craigsmith 480809), «get back» en lucha1 (craigsmith 675091) y «hey» en coro1 (fs57204): se quitaron. Ahora se hacen mezclando la masa
# «huuu» de felix.blume (CC0, sin palabras) con los gritos sin palabra de HaelDB y F.M.Audio ya cortados arriba, y los golpes del juego.
def lee_sal(nombre):
    return lee(os.path.abspath(os.path.join(SALIDA, nombre + '.mp3')))   # os.path.join ignora FUENTE si la ruta es absoluta


def pon(base, x, t, g):
    i = int(t * SR); n = min(len(x), len(base) - i)
    if n > 0: base[i:i + n] += x[:n] * g


def mezclas():
    masa = lee('fs612131.mp3')
    # clamor1: hombres que cargan; masa de fondo y cinco gritos, uno tras otro
    x = trozo(masa, 20.0, 26.0) * 0.8
    for k, (n, t, g) in enumerate([('grito1', 0.15, 0.9), ('grito3', 0.8, 0.8), ('grito5', 1.5, 0.9), ('grito2', 2.2, 0.8), ('grito4', 3.0, 0.7)]):
        pon(x, lee_sal(n), t, g)
    escribe('clamor1', iguala_rms(fundidos(x, 0.3, 1.0), -18.0), 7)
    # coro1: el grito corto de la falange; tres voces casi a la vez
    x = np.zeros(int(0.8 * SR), dtype=np.float32)
    for n, t, g in [('grito2', 0.0, 0.8), ('grito4', 0.03, 0.8), ('grito5', 0.06, 0.8)]: pon(x, lee_sal(n), t, g)
    escribe('coro1', iguala_rms(fundidos(x, 0.004, 0.25), -18.0), 7)
    # lucha1: bucle de 10 s del fragor (golpes y esfuerzos al azar sobre un lecho de masa); semilla fija
    rng = np.random.default_rng(12)
    x = trozo(masa, 30.0, 40.0) * 0.35
    golpes = [f'{g}{i}' for g, k in (('hierro', 4), ('escudo', 4), ('madera', 4), ('tajo', 2), ('clava', 2), ('empuje', 2)) for i in range(1, k + 1)]
    voces = [f'{g}{i}' for g, k in (('esfuerzo', 3), ('grito', 5), ('herido', 5), ('quejido', 3)) for i in range(1, k + 1)]
    for _ in range(45): pon(x, lee_sal(golpes[rng.integers(len(golpes))]), rng.uniform(0, 9.6), rng.uniform(0.3, 0.7))
    for _ in range(14): pon(x, lee_sal(voces[rng.integers(len(voces))]), rng.uniform(0, 9.0), rng.uniform(0.25, 0.5))
    escribe('lucha1', iguala_rms(bucle(x, 1.0), -18.0), 7)

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
for nombre, ruta, a, b, pico, ent, sal in VOCES:
    escribe(nombre, fundidos(iguala(trozo(lee(ruta), a, b), pico), ent, sal))
for nombre, ruta, a, b, rec, ent, sal, es_bucle in GRABADOS:
    x = lee(ruta)
    x = trozo(x, a, b if b is not None else len(x) / SR)
    if rec: x = recorta(x)
    if es_bucle: x = bucle(x, 1.0)
    else: x = fundidos(x, ent, sal)
    escribe(nombre, iguala_rms(x, -18.0), 7)
mezclas()
print('hecho:', len(GOLPES) + len(LARGOS) + len(BUCLES) + len(VOCES) + len(GRABADOS) + 3, 'sonidos en', SALIDA)
