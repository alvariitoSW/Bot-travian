# Retoque artístico de las escenas (MN4c): tono cálido de atardecer, viñeta y degradado. Uso: python3 -I tools/laminas/retoque.py <carpeta_escenas> <salida>
import sys, os
from PIL import Image, ImageEnhance, ImageChops, ImageDraw, ImageFilter
ent, sal = sys.argv[1], sys.argv[2]
def grade(im, fuerza=1.0, ancho=None):
    im = im.convert('RGB'); w, h = im.size
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    cal = Image.new('RGB', im.size, (255, 196, 120))                      # luz dorada
    im = ImageChops.multiply(im, Image.blend(Image.new('RGB', im.size, (255, 255, 255)), cal, 0.45 * fuerza))
    cie = Image.new('RGB', im.size, (70, 40, 90))                          # cielo/sombras con matiz violeta-lacre
    im = Image.blend(im, ImageChops.screen(im, Image.new('RGB', im.size, (34, 14, 20))), 0.35)
    # viñeta
    m = Image.new('L', im.size, 0); d = ImageDraw.Draw(m); d.ellipse([-w * .25, -h * .15, w * 1.25, h * 1.15], fill=255); m = m.filter(ImageFilter.GaussianBlur(min(w, h) * .22))
    osc = Image.new('RGB', im.size, (18, 10, 8)); im = Image.composite(im, Image.blend(im, osc, .72), m)
    return ImageEnhance.Brightness(im).enhance(1.04)
def abajo(im, ini=.55, fin=.93):      # degradado oscuro hacia abajo, para leer el menú
    w, h = im.size; g = Image.linear_gradient('L').resize((w, h)); g = g.point(lambda v: int(max(0, (v / 255 - ini) / (1 - ini)) * 255 * fin)); return Image.composite(Image.new('RGB', im.size, (14, 9, 7)), im, g)
def guarda(im, nombre, q=72): im.save(os.path.join(sal, nombre), 'WEBP', quality=q, method=6)
os.makedirs(sal, exist_ok=True)
guarda(abajo(grade(Image.open(f'{ent}/pv/c0.png')), .5, .9), 'portada-v.webp')
guarda(grade(Image.open(f'{ent}/ph/c0.png')), 'portada-h.webp')
for i, n in enumerate(['saber', 'senado', 'tropas', 'imperio']): guarda(grade(Image.open(f'{ent}/lm/c{i}.png'), .9), n + '.webp', 74)
