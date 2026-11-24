# AQVILA — SON3-b: las frases habladas de los soldados (assets/voces/<id>.mp3), hechas con Piper (síntesis de voz libre).
# Cada frase romana de js/voces.js trae un campo «pron» (latín restituido, escrito para una voz española: signos de exclamación,
# tilde donde cae el acento latino, c y g duras, v = b entre vocales). Piper lo lee con la voz es_ES-sharvard-medium,
# locutor masculino (speaker 0), y aquí solo se la deja natural: nada de saturación, ni tono cambiado, ni compresión fuerte,
# y SIN fragor de batalla (el juego ya pone el fragor debajo).
# Receta (elegida por el usuario el 23/11, muestras C = centurión y F = soldados):
#   Piper: noise_scale 0,8, noise_w 0,9 (el soldado y el griego varían el ruido de cada toma).
#   Tratamiento «natural»: paso alto 90 Hz, compresión suave 3:1, sala corta (dos ecos suaves).
#   centurión y optio: una toma, length_scale 0,9.
#   soldado: dos tomas del mismo locutor (length_scale 0,88 y 0,95, ruido distinto); la segunda a −8 dB y desfasada 60 ms.
#   griego: tres tomas (varios hombres), desfases 45 y 90 ms.
# Uso:
#   pip install piper-tts
#   (bajar es_ES-sharvard-medium.onnx y .onnx.json de https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/sharvard/medium)
#   python3 -I tools/voces.py <carpeta-con-la-voz> assets/voces [ids a rehacer...] [--faltan]
#   (SON9: también las frases de js/dialogos.js, ids dl-*: arengas del general, preguntas de los oficiales y el clamor de la tropa;
#    SON10: y las mismas en español de Cartago, los galos y los íberos, ids dl-ca-*, dl-ga-*, dl-ib-*, con la misma receta que los gritos españoles)
#   (SON5: también las frases griegas de la falange propia, ids gr-*, y los gritos en español de Cartago, galos e íberos, ids ca-*, ga-*, ib-*)
# Necesita ffmpeg (con libmp3lame) y numpy. Salida: mp3 mono a 32 kHz. Solo se usa al hacer los archivos; el juego lleva el audio ya grabado.
import json, os, subprocess, sys
import numpy as np
from piper import PiperVoice, SynthesisConfig

SR = 32000
VOZ, SALIDA = sys.argv[1], sys.argv[2]
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_OBJETIVO = -18.0     # dB de volumen medio (el juez pide entre −26 y −12)
PICO = -1.5                # dB (el juez pide ≤ −1)

# gritos griegos atestiguados (ver gobierno/historia/SON1-voces.md): alalá (grito de guerra), eleleú, peán («iè paián»)
GRIEGO = [('griego1', '¡Alalá! ¡Alalá!'), ('griego2', '¡Eleleú! ¡Eleleú!'), ('griego3', '¡Yé, yé, paián!')]

# papel → tomas: (length_scale, noise_scale, retraso en s, ganancia en dB). La primera toma manda; las otras son «otros hombres».
PAPEL = {
    'centurion': [(0.90, 0.80, 0.0, 0.0)],
    'optio':     [(0.90, 0.80, 0.0, 0.0)],
    'soldado':   [(0.88, 0.80, 0.0, 0.0), (0.95, 0.70, 0.060, -8.0)],
    'griego':    [(0.86, 0.80, 0.0, 0.0), (0.93, 0.70, 0.045, -6.0), (0.98, 0.90, 0.090, -9.0)],
}


def ff(entrada, filtro):
    """pasa un vector float32 (SR) por una cadena de filtros de ffmpeg y lo devuelve"""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', filtro,
                        '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-'], input=entrada.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def remuestra(x, de, a):
    n = int(round(len(x) * a / de))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def sin_bordes(x, umbral=0.02):
    v = np.nonzero(np.abs(x) > umbral * np.abs(x).max())[0]
    return x[max(0, v[0] - int(0.02 * SR)):v[-1] + int(0.05 * SR)] if len(v) else x


def habla(voz, texto, ls, ruido):
    cfg = SynthesisConfig(length_scale=ls, noise_scale=ruido, noise_w_scale=0.9, speaker_id=0)
    x = np.concatenate([c.audio_float_array for c in voz.synthesize(texto, cfg)]).astype(np.float32)
    return sin_bordes(remuestra(x, voz.config.sample_rate, SR))


def natural(x):
    """tratamiento natural: paso alto 90 Hz, compresión suave 3:1, sala corta; sin saturar"""
    x = x / np.abs(x).max() * 0.9
    x = ff(x, 'highpass=f=90,acompressor=threshold=0.125:ratio=3:attack=10:release=150:makeup=2,aecho=0.9:0.6:35|70:0.18|0.10')
    return np.concatenate([x, np.zeros(int(0.25 * SR), np.float32)])


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


def frase(voz, texto, papel):
    copias = []
    for ls, ruido, ret, g in PAPEL[papel]:
        x = natural(habla(voz, texto, ls, ruido))
        copias.append((int(ret * SR), x / np.abs(x).max() * 10 ** (g / 20)))
    m = np.zeros(max(o + len(x) for o, x in copias), dtype=np.float32)
    for o, x in copias: m[o:o + len(x)] += x
    a, b = int(0.004 * SR), int(0.10 * SR)
    m[:a] *= np.linspace(0, 1, a); m[-b:] *= np.linspace(1, 0, b) ** 2
    m = sin_bordes(m, 0.004)
    # ganancia al volumen medio objetivo, sin pasar del pico (si el pico manda, queda algo más bajo; sin limitador)
    gan = min(MEDIA_OBJETIVO - db(m), PICO - 20 * np.log10(np.abs(m).max() + 1e-9))
    return m * 10 ** (gan / 20)


def escribe(nombre, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-q:a', '6',
                    os.path.join(SALIDA, nombre + '.mp3')], input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    os.makedirs(SALIDA, exist_ok=True)
    todo = json.loads(subprocess.run(['node', '-e', "const V = require('./js/voces.js'); const Dl = require('./js/dialogos.js'); console.log(JSON.stringify({ romanas: V.FRASES, griegas: V.GRIEGAS, gritos: V.GRITOS, dialogos: Dl.DICHOS.concat(Dl.DICHOS_PUEBLO) }))"], cwd=RAIZ, capture_output=True, check=True).stdout)
    voz = PiperVoice.load(os.path.join(VOZ, 'es_ES-sharvard-medium.onnx'))
    hechas = 0
    args = sys.argv[3:]
    faltan = '--faltan' in args   # solo las que aún no tienen mp3 (no toca lo ya grabado: Piper no repite exactamente la misma toma)
    solo = set(a for a in args if not a.startswith('--'))   # opcional: ids a rehacer
    # SON5: papel de cada frase → receta de tomas. lochagos = oficial (una toma); falangita = grupo (dos tomas); jefe/guerrero: gritos en español (jefe una toma, guerrero dos).
    PAPEL_DE = {'centurion': 'centurion', 'optio': 'optio', 'soldado': 'soldado', 'lochagos': 'centurion', 'falangita': 'soldado', 'jefe': 'centurion', 'guerrero': 'soldado',
               'general': 'centurion', 'tribuno': 'centurion', 'primipilo': 'centurion', 'tropa': 'soldado'}   # SON9: el general y los oficiales, una toma; la tropa que aclama, dos
    for f in todo['romanas'] + todo['griegas'] + todo['gritos'] + todo['dialogos']:
        if f['quien'] == 'enemigo': continue
        if solo and f['id'] not in solo: continue
        if faltan and os.path.exists(os.path.join(SALIDA, f['id'] + '.mp3')): continue
        escribe(f['id'], frase(voz, f['pron'], PAPEL_DE[f['quien']])); hechas += 1
    for nombre, texto in GRIEGO:
        if solo and nombre not in solo: continue
        if faltan and os.path.exists(os.path.join(SALIDA, nombre + '.mp3')): continue
        escribe(nombre, frase(voz, texto, 'griego')); hechas += 1
    print('hecho:', hechas, 'frases en', SALIDA)
