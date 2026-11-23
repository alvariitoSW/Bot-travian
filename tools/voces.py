# AQVILA — SON2: las frases habladas de los soldados (assets/voces/<id>.mp3), hechas con Piper (síntesis de voz libre).
# Cada frase romana de js/voces.js trae un campo «pron» (el latín con pronunciación restituida, escrito para una voz española).
# Piper lo lee con la voz es_ES-davefx-medium (datos CC0), y aquí se le da carácter de grito de soldado:
# más rápida, más grave el centurión, preénfasis, saturación suave, compresión fuerte, banda 150–4000 Hz, sala corta;
# el «soldado» va doblado con 3 copias desfasadas y con tono algo distinto (varios hombres a la vez).
# Los gritos griegos del enemigo (alalá, eleleú, peán) salen por el mismo camino, con un grupo de hombres más ancho.
# Uso:
#   pip install piper-tts
#   (bajar es_ES-davefx-medium.onnx y .onnx.json de https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium)
#   python3 -I tools/voces.py <carpeta-con-la-voz> assets/voces
# Necesita ffmpeg (con libmp3lame) y numpy. Salida: mp3 mono a 32 kHz. Solo se usa al hacer los archivos; el juego lleva el audio ya grabado.
import json, os, subprocess, sys
import numpy as np
from piper import PiperVoice, SynthesisConfig

SR = 32000
VOZ, SALIDA = sys.argv[1], sys.argv[2]
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_OBJETIVO = -17.0     # dB de volumen medio (el juez pide entre −26 y −12)
PICO = -1.5                # dB

# gritos griegos atestiguados (ver gobierno/historia/SON1-voces.md): alalá (grito de guerra), eleleú, peán («iè paián»)
GRIEGO = [('griego1', '¡Alalá! ¡Alalá!'), ('griego2', '¡Eleleú! ¡Eleleú!'), ('griego3', '¡Yé, yé, paián!')]

# papel → (length_scale de cada copia, factor de tono de cada copia, retraso en s de cada copia, ganancia de cada copia)
PAPEL = {
    'centurion': dict(ls=[0.74, 0.76], r=[0.90, 0.88], ret=[0.0, 0.016], g=[1.0, 0.45]),
    'optio':     dict(ls=[0.76, 0.80], r=[0.97, 1.03], ret=[0.0, 0.020], g=[1.0, 0.40]),
    'soldado':   dict(ls=[0.78, 0.80, 0.76], r=[1.00, 0.95, 1.06], ret=[0.0, 0.024, 0.044], g=[1.0, 0.55, 0.45]),
    'griego':    dict(ls=[0.80, 0.84, 0.77], r=[1.00, 0.93, 1.07], ret=[0.0, 0.030, 0.060], g=[1.0, 0.65, 0.55]),
}


def ff(entrada, filtro, extra=()):
    """pasa un vector float32 (SR) por una cadena de filtros de ffmpeg y lo devuelve"""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', filtro, *extra,
                        '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-'], input=entrada.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def remuestra(x, de, a):
    n = int(round(len(x) * a / de))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def sin_bordes(x, umbral=0.02):
    v = np.nonzero(np.abs(x) > umbral * np.abs(x).max())[0]
    return x[max(0, v[0] - int(0.01 * SR)):v[-1] + int(0.02 * SR)] if len(v) else x


def habla(voz, texto, ls):
    cfg = SynthesisConfig(length_scale=ls, noise_scale=0.75, noise_w_scale=0.8)
    x = np.concatenate([c.audio_float_array for c in voz.synthesize(texto, cfg)]).astype(np.float32)
    return remuestra(x, voz.config.sample_rate, SR)


def grito(voz, texto, papel):
    p = PAPEL[papel]; copias = []
    for ls, r, ret, g in zip(p['ls'], p['r'], p['ret'], p['g']):
        x = sin_bordes(habla(voz, texto, ls))
        x = remuestra(x, r, 1.0)                          # r < 1: más grave (y más larga); r > 1: más aguda
        x = np.append(x[0], x[1:] - 0.55 * x[:-1])        # preénfasis: más brillo, voz más tensa
        x = x / (np.abs(x).max() + 1e-9)
        x = np.tanh(2.0 * x) / np.tanh(2.0)               # saturación suave: la garganta forzada
        copias.append((int(ret * SR), g * x))
    n = max(o + len(x) for o, x in copias) + int(0.3 * SR)
    m = np.zeros(n, dtype=np.float32)
    for o, x in copias: m[o:o + len(x)] += x
    m /= np.abs(m).max()
    # banda 150–4000 Hz, compresión fuerte, sala corta (dos ecos rápidos), limitador
    m = ff(m, 'highpass=f=150,highpass=f=150,lowpass=f=4000,lowpass=f=4000,'
              'acompressor=threshold=0.05:ratio=10:attack=4:release=90:makeup=4,'
              'aecho=0.85:0.5:23|47:0.28|0.16,alimiter=limit=0.9:level=disabled')
    # fundidos y ganancia hasta el volumen medio objetivo (sin pasar del pico)
    a, b = int(0.004 * SR), int(0.12 * SR)
    m[:a] *= np.linspace(0, 1, a); m[-b:] *= np.linspace(1, 0, b) ** 2
    m = sin_bordes(m, 0.004)
    rms = 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9)
    m = m * 10 ** ((MEDIA_OBJETIVO - rms) / 20)
    pico = 20 * np.log10(np.abs(m).max() + 1e-9)
    if pico > PICO:   # el pico manda: comprime lo alto con tanh y vuelve a medir
        m = np.tanh(m / 10 ** (PICO / 20) * 0.9) / np.tanh(0.9) * 10 ** (PICO / 20)
        pico = 20 * np.log10(np.abs(m).max() + 1e-9)
        if pico > PICO: m *= 10 ** ((PICO - pico) / 20)
    return m


def escribe(nombre, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-q:a', '6',
                    os.path.join(SALIDA, nombre + '.mp3')], input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    os.makedirs(SALIDA, exist_ok=True)
    frases = json.loads(subprocess.run(['node', '-e', "console.log(JSON.stringify(require('./js/voces.js').FRASES))"], cwd=RAIZ, capture_output=True, check=True).stdout)
    voz = PiperVoice.load(os.path.join(VOZ, 'es_ES-davefx-medium.onnx'))
    hechas = 0
    solo = set(sys.argv[3:])   # opcional: ids a rehacer
    for f in frases:
        if f['quien'] == 'enemigo': continue
        if solo and f['id'] not in solo: continue
        escribe(f['id'], grito(voz, f['pron'], f['quien'])); hechas += 1
    for nombre, texto in GRIEGO:
        if solo and nombre not in solo: continue
        escribe(nombre, grito(voz, texto, 'griego')); hechas += 1
    print('hecho:', hechas, 'frases en', SALIDA)
