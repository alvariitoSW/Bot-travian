"""Prueba 3 de FA2 (soldado más realista): prepara las texturas de foto para falangita_prueba_3.py.

Uso (Python del taller, aislado; no hace falta Blender):
  /opt/aqvila-taller/blender/bin/python -I tools/blender/falangita_prueba_3_texturas.py <carpeta_bajada> <carpeta_salida>

Lee las fotos bajadas de OpenGameArt (lista de obras y licencias en la cabecera de falangita_prueba_3.py),
les quita el degradado de luz de la foto, las hace repetibles sin costura y deja:
  lino_det, bronce_mart, bronce_ray, cuero_col, madera_col, hierro_ray (1024 px, PNG) y escudo_relieve (máscara
  de la estrella de ocho puntas y los semicírculos, dibujada aquí: arte propio).
También guarda la versión de 512 px en WebP de cada una, para medir lo que pesarían en el juego.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ENT, SAL = sys.argv[1], sys.argv[2]
os.makedirs(SAL, exist_ok=True)

def carga(nombre, lado=None, gris=False):
    im = Image.open(os.path.join(ENT, nombre)).convert('L' if gris else 'RGB')
    w, h = im.size; s = min(w, h) if lado is None else min(lado, w, h)
    x0, y0 = (w - s) // 2, (h - s) // 2
    return im.crop((x0, y0, x0 + s, y0 + s))

def sin_degradado(im, radio):
    """Quita la luz desigual de la foto: resta un desenfoque grande y devuelve la media."""
    a = np.asarray(im, np.float32); b = np.asarray(im.filter(ImageFilter.GaussianBlur(radio)), np.float32)
    m = a.reshape(-1, a.shape[-1] if a.ndim == 3 else 1).mean(0)
    return Image.fromarray(np.clip(a - b + m, 0, 255).astype(np.uint8))

def sin_costura(im):
    """Funde la imagen con su copia desplazada media vuelta: los bordes casan al repetirla."""
    a = np.asarray(im, np.float32); n = a.shape[0]
    t = np.minimum(np.arange(n), n - 1 - np.arange(n)) / (n / 2)          # 0 en el borde, 1 en el centro
    w = np.minimum.outer(t, t); w = np.clip(w * 2.2, 0, 1)
    if a.ndim == 3: w = w[..., None]
    r = np.roll(a, (n // 2, n // 2), (0, 1))
    return Image.fromarray(np.clip(w * a + (1 - w) * r, 0, 255).astype(np.uint8))

def guarda(im, nombre):
    im = im.resize((1024, 1024), Image.LANCZOS); im.save(os.path.join(SAL, nombre + '.png'))
    im.resize((512, 512), Image.LANCZOS).save(os.path.join(SAL, nombre + '_512.webp'), quality=82)

def normaliza(im, media=128, contraste=1.0):
    a = np.asarray(im, np.float32); a = (a - a.mean()) * contraste + media
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

# Lino: foto de tela clara (rubberduck, CC0). Solo el detalle, en gris, con media 128: el color lo pone el atlas.
lino = sin_degradado(carga('textil/IMGP6310.JPG', 1600, gris=True), 40)
guarda(sin_costura(normaliza(lino, 128, 2.2)), 'lino_det')
# Bronce: «Mottled» (golpes del martillo) y «DullScratched» (rayas finas), Keith333 (CC-BY 3.0).
guarda(normaliza(carga('Mottled_S.jpg', gris=True), 128, 1.3), 'bronce_mart')
guarda(sin_costura(normaliza(sin_degradado(carga('DullScratched_S.jpg', gris=True), 60), 128, 1.6)), 'bronce_ray')
guarda(sin_costura(normaliza(sin_degradado(carga('DullScratched_S.jpg', gris=True), 60), 128, 1.0)), 'hierro_ray')
# Cuero: «Old Leather 2», Keith333 (CC-BY 3.0). Madera: «wood1», Luke.RUSTLTD (CC0), ya repetible.
guarda(sin_costura(sin_degradado(carga('OldLeather2_S.jpg', 2300), 80)), 'cuero_col')
guarda(carga('wood1_1.png'), 'madera_col')

# Escudo: estrella de ocho puntas en el centro y corona de semicírculos junto al borde (relieve repujado).
N = 2048; m = Image.new('L', (N, N), 0); d = ImageDraw.Draw(m); c = N / 2
def estrella(r_ext, r_int, puntas, giro=0.0):
    pts = []
    for i in range(puntas * 2):
        r = r_ext if i % 2 == 0 else r_int; a = giro + np.pi * i / puntas
        pts.append((c + r * np.cos(a), c + r * np.sin(a)))
    return pts
d.ellipse((c - 0.08 * N, c - 0.08 * N, c + 0.08 * N, c + 0.08 * N), outline=255, width=int(0.012 * N))
d.polygon(estrella(0.30 * N, 0.075 * N, 8, -np.pi / 2), fill=255)
d.ellipse((c - 0.045 * N, c - 0.045 * N, c + 0.045 * N, c + 0.045 * N), fill=0)
d.ellipse((c - 0.025 * N, c - 0.025 * N, c + 0.025 * N, c + 0.025 * N), fill=255)
d.ellipse((c - 0.355 * N, c - 0.355 * N, c + 0.355 * N, c + 0.355 * N), outline=255, width=int(0.010 * N))   # anillo que cierra el campo
for k in range(8):                                                     # ocho semicírculos con su punto, abiertos hacia el borde
    a = 2 * np.pi * k / 8 + np.pi / 8; R = 0.355 * N; rr = 0.085 * N
    x, y = c + R * np.cos(a), c + R * np.sin(a); ang = np.degrees(a)
    d.arc((x - rr, y - rr, x + rr, y + rr), ang - 90, ang + 90, fill=255, width=int(0.011 * N))
    x2, y2 = c + (R + 0.035 * N) * np.cos(a), c + (R + 0.035 * N) * np.sin(a)
    d.ellipse((x2 - 0.016 * N, y2 - 0.016 * N, x2 + 0.016 * N, y2 + 0.016 * N), fill=255)
m = m.filter(ImageFilter.GaussianBlur(5))                              # canto redondeado del repujado
m.resize((1024, 1024), Image.LANCZOS).save(os.path.join(SAL, 'escudo_relieve.png'))
m.resize((512, 512), Image.LANCZOS).save(os.path.join(SAL, 'escudo_relieve_512.webp'), quality=82)
tot = sum(os.path.getsize(os.path.join(SAL, f)) for f in os.listdir(SAL) if f.endswith('_512.webp'))
print('texturas listas; en el juego (512 px, WebP): %.2f MB' % (tot / 1e6))
