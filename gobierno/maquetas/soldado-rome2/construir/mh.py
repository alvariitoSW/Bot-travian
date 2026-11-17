"""Cuerpo humano de MakeHuman (malla base, deformadores, esqueleto y pesos: CC0) leído con numpy.
No ejecuta código de MakeHuman: solo lee sus datos. Devuelve metros, Y arriba, mirando a +Z, pies en y=0."""
import json, os, numpy as np
D = os.environ.get('MH_DATOS', '/tmp/claude-0/-home-user-bot-travian/0f749647-856b-55de-8fbb-de1ea1b71349/scratchpad/dl/mhdata')

def leer_obj():
    V, VT, F, G = [], [], [], []; g = 'x'
    for l in open(D + '/base.obj'):
        if l.startswith('v '): V.append([float(x) for x in l.split()[1:4]])
        elif l.startswith('vt '): VT.append([float(x) for x in l.split()[1:3]])
        elif l.startswith('g '): g = l.split()[1]
        elif l.startswith('f '):
            p = [[int(a) - 1 if a else -1 for a in (x.split('/') + ['', ''])[:2]] for x in l.split()[1:]]
            F.append(p); G.append(g)
    return np.array(V), np.array(VT), F, G

def deformar(V, receta):
    T = np.load(D + '/targets.npz'); V = V.copy()
    for nombre, peso in receta.items():
        k = 'targets/' + nombre
        V[T[k + '.index'].astype(int)] += T[k + '.vector'].astype(np.float64) * 1e-3 * peso
    return V

def esqueleto(V):
    d = json.load(open(D + '/default.mhskel')); J = {k: V[v].mean(0) for k, v in d['joints'].items()}
    B = d['bones']; orden = []
    def baja(k):
        orden.append(k)
        for c in B:
            if B[c]['parent'] == k: baja(c)
    for k in B:
        if B[k]['parent'] is None: baja(k)
    return orden, {k: B[k]['parent'] for k in orden}, {k: J[B[k]['head']] for k in orden}, {k: J[B[k]['tail']] for k in orden}

def pesos(nv):
    w = json.load(open(D + '/default_weights.mhw'))['weights']; out = {}
    for b, l in w.items():
        a = np.zeros(nv); 
        for i, x in l: a[i] = x
        out[b] = a
    return out

RECETA_SOLDADO = {'macrodetails/universal-male-young-maxmuscle-averageweight': 0.55, 'macrodetails/universal-male-young-averagemuscle-averageweight': 0.45,
                  'macrodetails/caucasian-male-young': 1.0}

def construir(receta=RECETA_SOLDADO, altura=1.72):
    V0, VT, F, G = leer_obj(); V = deformar(V0, receta)
    cuerpo = sorted({p[0] for f, g in zip(F, G) if g == 'body' for p in f})
    y0 = V[cuerpo, 1].min(); esc = altura / (V[cuerpo, 1].max() - y0)
    V = (V - [0, y0, 0]) * esc
    orden, padre, cab, cola = esqueleto(V)
    return dict(V=V, VT=VT, F=F, G=G, huesos=orden, padre=padre, cab=cab, cola=cola, W=pesos(len(V)), esc=esc)

if __name__ == '__main__':
    import collections
    m = construir(); V = m['V']; print('escala', m['esc'])
    c = collections.Counter(m['G']); print({k: v for k, v in c.items() if not k.startswith('joint')})
    for k in ['root', 'spine05', 'spine03', 'spine01', 'neck01', 'head', 'clavicle.L', 'shoulder01.L', 'upperarm01.L', 'lowerarm01.L', 'wrist.L', 'finger3-1.L', 'pelvis.L', 'upperleg01.L', 'lowerleg01.L', 'foot.L', 'toe3-1.L']:
        print(k, np.round(m['cab'][k], 3), np.round(m['cola'][k], 3))
    # triángulos del cuerpo por zona (hueso dominante)
    nom = list(m['W']); Wm = np.stack([m['W'][k] for k in nom], 1); dom = Wm.argmax(1); z = collections.Counter()
    def zona(b):
        for s, n in (('finger', 'mano'), ('metacarpal', 'mano'), ('wrist', 'mano'), ('toe', 'pie'), ('foot', 'pie'), ('lowerleg', 'pierna'), ('upperleg', 'muslo'), ('pelvis', 'muslo'), ('upperarm', 'brazo'), ('lowerarm', 'antebrazo'), ('shoulder', 'brazo'), ('clavicle', 'torso'), ('spine', 'torso'), ('breast', 'torso'), ('root', 'torso'), ('neck', 'cuello')):
            if s in b: return n
        return 'cabeza'
    for f, g in zip(m['F'], m['G']):
        if g == 'body': z[zona(nom[dom[f[0][0]]])] += len(f) - 2
    print(z, sum(z.values()))
