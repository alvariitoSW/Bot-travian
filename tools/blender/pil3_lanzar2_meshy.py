"""PIL3: añade el clip 'lanzar2' (lanzamiento del pilum) a los soldados de Meshy que usan movimientos_escudo_*.
Su malla no cambia: el clip nuevo va al FINAL del archivo de movimientos compartido (cuadros 559..619), así que basta
con apuntarlo en su .json. Mismas reglas que lanzamiento_nuevo() de gobierno/maquetas/soldado-rome2/construir/construir.py:
si lanza un arma de asta (su 'lanzar' la esconde al soltarla y tiene piezas en el conjunto 1), la muestra va en tres tiempos
(porte · agarre de tiro, bit 8 · suelta). Uso: python3 tools/blender/pil3_lanzar2_meshy.py [carpeta] (por defecto assets/soldados)."""
import json, os, sys, glob
import numpy as np
CAR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'soldados')
MESHY = ('centurion', 'galo-grande', 'galo-grande-v2a', 'galo-grande-v2b', 'galo-lancero', 'galo-rapido', 'galo-rapido-b', 'hastatus', 'jefe-galo', 'triario', 'velite')
INI, N, CUADROS = 559, 61, 620                                  # 'lanzar2' en el archivo de movimientos (el mismo que escribe construir.py)
CAMBIO_S, SUELTA_S = 0.23, 1.10
TIRO = {'c': [-0.50003, 0.99513, 0.27178], 'n': [-0.74661, 0.66502, -0.01802]}   # palma derecha de MakeHuman (todas las manos del juego son esas)
for q in MESHY:
    for nv in ('', '_lejos', '_muylejos', '_fondo'):
        r = os.path.join(CAR, q + nv); j = json.load(open(r + '.json'))
        assert j.get('anim', '').startswith('movimientos_escudo_'), r
        assert j['cuadros'] in (559, CUADROS), (r, j['cuadros'])
        j['cuadros'] = CUADROS; j['clips']['lanzar2'] = dict(ini=INI, n=N, fps=30, bucle=0)
        b = open(r + '.bin', 'rb').read(); conj = np.frombuffer(b, np.uint8, j['verts'], j['off']['set'])
        ml = j['muestra'].get('lanzar') or [[0, 5]]
        lanza = len(ml) == 2 and ml[0][1] & 1 and not ml[1][1] & 1 and bool((conj == 1).any())
        j['muestra']['lanzar2'] = [[0, ml[0][1]], [CAMBIO_S, ml[0][1] | 8], [SUELTA_S, ml[1][1]]] if lanza else [list(x) for x in ml]
        if lanza: j['tiro'] = TIRO
        else: j.pop('tiro', None)
        json.dump(j, open(r + '.json', 'w'), separators=(',', ':'), ensure_ascii=False)
        print(q + nv, 'lanza' if lanza else 'sin arma que lanzar', j['muestra']['lanzar2'])
