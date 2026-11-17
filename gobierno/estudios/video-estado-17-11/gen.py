# «¿Por qué no está ya la 1.0?» · Consejo de AQVILA, 17/11/2026 (pedido del usuario). Fábrica de La Moncloa
# (fiebres-neutropenias/autonomo/consejo/video); estilo telediario con capturas reales del juego.
#   MONCLOA=/ruta/a/autonomo/consejo/video python3 gen.py   → audio/mezcla.wav y timeline.js
# Todas las cifras salen de gobierno/estudios/estado-proyecto-17-11.md (tabla «Lo medido»).
import json, os, sys, wave
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
FAB = os.environ.get('MONCLOA', '/home/user/fiebres-neutropenias/autonomo/consejo/video'); sys.path.insert(0, FAB)
from voz import _decir; from reparto import REPARTO
SR = 22050; LLEGA = 0.55
# (quién, lo que dice la voz, subtítulo con cifras, pausa después, clave)
G = [
 ('tra', '¿Por qué no está ya la uno punto cero?', '¿Por qué no está ya la 1.0?', 0.35, 'gancho'),
 ('tra', 'Porque faltan cuatro tareas, y hoy casi nadie está en ellas.', 'Porque faltan 4 tareas, y hoy casi nadie está en ellas.', 0.35, 'faltan'),
 ('tra', 'Hechas, trece de veinte: menús romanos, Senado, cuartel y la batalla nueva.', 'Hechas, 13 de 20: menús romanos, Senado, cuartel y la batalla nueva.', 0.5, 'hechas'),
 ('p1',  '¿Qué queda?', '¿Qué queda?', 0.3, 'q_queda'),
 ('tra', 'La primera fila que lucha, las escaramuzas, el equilibrio con el bot y tu prueba en el móvil.', 'La primera fila que lucha, las escaramuzas, el equilibrio con el bot y tu prueba en el móvil.', 0.35, 'queda'),
 ('hac', 'Previsto, dos coma ocho millones. Realista, unos cinco.', 'Previsto, 2,8 millones. Realista, unos 5.', 0.5, 'coste'),
 ('p1',  '¿Y por qué no se cierra ya?', '¿Y por qué no se cierra ya?', 0.3, 'q_cierra'),
 ('tra', 'Porque la lista creció. Eran doce tareas: entraron diez y salieron dos.', 'Porque la lista creció. Eran 12 tareas: entraron 10 y salieron 2.', 0.35, 'lista'),
 ('jus', 'Los jueces siguen en rojo: treinta y cinco de treinta y siete.', 'Los jueces siguen en rojo: 35 de 37.', 0.35, 'jueces'),
 ('tra', 'Y de ocho sesiones abiertas, solo dos son de la uno punto cero.', 'Y de 8 sesiones abiertas, solo 2 son de la 1.0.', 0.5, 'sesiones'),
 ('p1',  '¿Por qué tarda tanto?', '¿Por qué tarda tanto?', 0.3, 'q_tarda'),
 ('hac', 'Porque cada tarea cuesta casi el doble. Esta semana se previeron ciento setenta y cuatro millones, y se gastaron doscientos cincuenta y cuatro.', 'Porque cada tarea cuesta casi el doble. Esta semana se previeron 174 millones, y se gastaron 254.', 0.35, 'doble'),
 ('hac', 'Hoy, un setenta y nueve por ciento de más. Casi todo, esperando a los jueces.', 'Hoy, un 79 % de más. Casi todo, esperando a los jueces.', 0.5, 'hoy'),
 ('p1',  '¿Y por qué se desvía?', '¿Y por qué se desvía?', 0.3, 'q_desvia'),
 ('tra', 'Porque lo que gusta no llega al juego. Hoy, diecisiete millones en maquetas.', 'Porque lo que gusta no llega al juego. Hoy, 17 millones en maquetas.', 0.3, 'maquetas'),
 ('tra', 'Toda la uno punto cero costaba siete coma cuatro.', 'Toda la 1.0 costaba 7,4.', 0.55, 'toda'),
 ('tra', 'Te toca decidir cinco cosas.', 'Te toca decidir cinco cosas.', 0.3, 'decide'),
 ('tra', 'Sacar el soldado nuevo a la uno punto uno.', 'Sacar el soldado nuevo a la 1.1.', 0.25, 'd1'),
 ('tra', 'Parar lo que no es uno punto cero.', 'Parar lo que no es 1.0.', 0.25, 'd2'),
 ('tra', 'Que lo nuevo espere en la nevera.', 'Que lo nuevo espere en la nevera.', 0.25, 'd3'),
 ('tra', 'Jueces en verde antes de subir nada.', 'Jueces en verde antes de subir nada.', 0.25, 'd4'),
 ('tra', 'Y un tope de gasto que corte.', 'Y un tope de gasto que corte.', 0.45, 'd5'),
 ('tra', 'Con cinco síes, la uno punto cero sale en cuatro sesiones.', 'Con cinco síes, la 1.0 sale en 4 sesiones.', 2.6, 'final'),
]
F = 'estado-proyecto-17-11.md'
from guion import preparar
preparar([(k, e, tx, sub, p) for k, tx, sub, p, e in G], llega=LLEGA, carpeta='.', cifras_libres={
 '1.0': 'versión 1.0', '1.1': 'versión 1.1', '4': F + ': 4 tareas por hacer; 4 sesiones', '13': F + ': 13 hechas', '20': F + ': 20 líneas del Carril V',
 '2,8': F + ': previsto 2,8 M', '5': F + ': realista unos 5 M', '12': 'CV1-converger.md: 12 tareas', '10': F + ': entraron 10', '2': F + ': salieron 2; 2 sesiones de la 1.0',
 '35': 'bitácora 17/11: jueces 35/37', '37': 'bitácora 17/11: jueces 35/37', '8': F + ': 8 sesiones de AQVILA', '174': F + ': previsto 174 M', '254': F + ': gastado 254 M',
 '79': F + ': +79 % el 17/11', '17': F + ': unos 17 M en maquetas', '7,4': 'CV1-converger.md: 7,4 M'})
print('palabras:', sum(len(g[2].split()) for g in G))
os.makedirs('audio', exist_ok=True); t = LLEGA; clips = []
for i, (k, tx, sub, p, esc) in enumerate(G):
    f = f'audio/c{i:02d}.wav'; ft = f + '.txt'
    if not (os.path.exists(f) and os.path.exists(ft) and open(ft).read() == tx + k): _decir(tx, REPARTO[k], f); open(ft, 'w').write(tx + k)
    w = wave.open(f); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
    fuerte = np.where(np.abs(a) > 500)[0]
    if len(fuerte): a = a[max(0, fuerte[0] - int(0.03 * SR)):min(len(a), fuerte[-1] + int(0.08 * SR))]
    clips.append(dict(k=k, esc=esc, sub=sub, tx=tx, t0=round(t, 3), d=round(len(a) / SR, 3), a=a)); t += len(a) / SR + p
T = t; mix = np.zeros(int(T * SR) + SR, np.float32)
for c in clips:
    s = int(c['t0'] * SR); mix[s:s + len(c['a'])] += c['a']; del c['a']
E = {c['esc']: c for c in clips}
rng = np.random.default_rng(7)
def soplo(t0, d=0.42, g=1500):
    n = int(d * SR); r = rng.standard_normal(n).astype(np.float32); k = np.linspace(0.02, 0.5, n); y = np.zeros(n, np.float32); z = 0.0
    for i in range(n): z += k[i] * (r[i] - z); y[i] = z
    y *= np.sin(np.linspace(0, np.pi, n)) ** 2 * g; s = max(0, int(t0 * SR)); mix[s:s + n] += y[:len(mix) - s]
def nota(t0, hz, d=0.5, g=1300):
    n = int(d * SR); x = np.arange(n) / SR
    y = (np.sin(2 * np.pi * hz * x) + 0.35 * np.sin(2 * np.pi * hz * 2 * x)) * np.exp(-x * 9) * g
    y[:60] *= np.linspace(0, 1, 60); s = int(t0 * SR); mix[s:s + n] += y[:len(mix) - s].astype(np.float32)
nota(0.05, 196, 0.9, 1500); nota(0.22, 293.66, 0.9, 1300)
for q in ('q_queda', 'q_cierra', 'q_tarda', 'q_desvia', 'decide'): soplo(E[q]['t0'] - 0.3)
for i, e in enumerate(('hechas', 'coste', 'lista', 'jueces', 'sesiones', 'doble', 'hoy', 'maquetas', 'toda')): nota(E[e]['t0'] + 0.1, (261.63, 329.63, 392)[i % 3], 0.5, 900)
for i, e in enumerate(('d1', 'd2', 'd3', 'd4', 'd5')): nota(E[e]['t0'], 294 + 30 * i, 0.25, 800)
fin = E['final']['t0'] + E['final']['d'] + 0.3
for hz, g in ((196, 1700), (293.66, 1200), (392, 900)): nota(fin, hz, 1.4, g)
mix += rng.standard_normal(len(mix)).astype(np.float32) * 14
mix = mix[:int(T * SR)]; mix[-int(0.25 * SR):] *= np.linspace(1, 0, int(0.25 * SR))
with wave.open('audio/mezcla.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(np.clip(mix * 0.9, -32767, 32767).astype(np.int16).tobytes())
open('timeline.js', 'w').write('window.TL=' + json.dumps(dict(total=round(T, 2), sello=round(fin, 3), clips=clips), ensure_ascii=False) + ';')
print(round(T, 2), 's')
