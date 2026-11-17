"""Atlas y texturas del soldado, pintadas por código: color, relieve (normal), oclusión/aspereza/metal y máscara de tintes.
Todo sale de la posición 3D en reposo de cada píxel y de coordenadas de dibujo de cada pieza: no usa imágenes de fuera."""
import numpy as np, geo
from PIL import Image
from piezas import MAT

def empaquetar(pz, lado):
    d = 1500.0
    while True:
        tam = [(max(8, int(p['tam'][0] * d * p['prio'])), max(8, int(p['tam'][1] * d * p['prio']))) for p in pz]; pos = geo.empaquetar(tam, lado, 8)
        if pos: return [(x, y, w, h) for (x, y), (w, h) in zip(pos, tam)]
        d *= 0.975

def _h(i, s):
    return np.modf(np.sin(i[:, 0] * 127.1 + i[:, 1] * 311.7 + i[:, 2] * 74.7 + s) * 43758.5453)[0] % 1.0
def ruido3(p, f, s=0.0):
    q = p.astype(np.float64) * f; i = np.floor(q); u = q - i; u = u * u * (3 - 2 * u); out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2]); out = out + w * _h(i + [dx, dy, dz], s)
    return out
def fbm(p, f, oct=3, s=0.0):
    a, t, k = 0.0, 0.0, 1.0
    for o in range(oct): a = a + k * ruido3(p, f * 2 ** o, s + o * 17.0); t += k; k *= 0.5
    return a / t
def r2(x, y, f, s=0.0): return ruido3(np.stack([x, y, np.zeros_like(x)], 1), f, s)
def sst(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def gau(p, c, s): return np.exp(-(((p - np.asarray(c)) / np.asarray(s)) ** 2).sum(1))
def mez(c, col, w): return c * (1 - w[:, None]) + np.asarray(col, float) * w[:, None]

def oclusion(pz):
    """Oclusión barata: rejilla de 1 cm con la superficie del soldado en reposo, desenfocada."""
    o = np.array([-0.8, -0.06, -0.5]); dim = (160, 225, 130); G = np.zeros(dim, np.float32)
    for p in pz:
        if p['conj'] or any(k in p['nombre'] for k in ('pilum', 'espada', 'lanza')): continue
        a, b, c = [p['P'][p['T'][:, k]] for k in range(3)]; ar = np.linalg.norm(np.cross(b - a, c - a), axis=1) / 2; n = np.maximum(1, (ar / 4e-5).astype(int)); rep = np.repeat(np.arange(len(a)), n); r = np.random.default_rng(1).random((len(rep), 2))
        f = r.sum(1) > 1; r[f] = 1 - r[f]; q = a[rep] + (b[rep] - a[rep]) * r[:, :1] + (c[rep] - a[rep]) * r[:, 1:]; i = ((q - o) / 0.01).astype(int); ok = ((i >= 0) & (i < dim)).all(1); np.add.at(G, tuple(i[ok].T), (ar[rep] / n[rep])[ok] / 1e-4)
    for ax in range(3):
        for _ in range(2):
            c = np.cumsum(np.pad(G, [(3, 2) if k == ax else (0, 0) for k in range(3)]), axis=ax); G = (np.take(c, np.arange(5, c.shape[ax]), axis=ax) - np.take(c, np.arange(0, c.shape[ax] - 5), axis=ax)) / 5
    def mira(q):
        f = (q - o) / 0.01 - 0.5; i0 = np.floor(f).astype(int); t = f - i0; out = 0.0; lim = np.array(dim) - 1      # entre celdas, mezcla suave: sin escalones de 1 cm
        for dx in (0, 1):
            for dy in (0, 1):
                for dz in (0, 1):
                    i = np.clip(i0 + [dx, dy, dz], 0, lim); out = out + (t[:, 0] if dx else 1 - t[:, 0]) * (t[:, 1] if dy else 1 - t[:, 1]) * (t[:, 2] if dz else 1 - t[:, 2]) * G[i[:, 0], i[:, 1], i[:, 2]]
        return out
    return mira

ESTILO = dict(pelo=[0.13, 0.09, 0.065], calzado='caligae')
def pintar(pz, lado, ruta, m):
    N = lado; B = dict(pos=np.zeros((N, N, 3), np.float32), nor=np.zeros((N, N, 3), np.float32), prm=np.zeros((N, N, 2), np.float32), aux=np.zeros((N, N, 2), np.float32)); mat = np.zeros((N, N), np.int16); pid = -np.ones((N, N), np.int16); mpp = np.ones((N, N), np.float32); M = np.zeros((N, N), bool)
    for k, p in enumerate(pz):
        out, masc = geo.rasterizar(N, p['uvpx'], p['T'], dict(pos=p['P'], nor=p['N'], prm=p['prm'], aux=p['aux'], mat=p['mat'][:, None].astype(np.float32)))
        for c in B: B[c][masc] = out[c][masc]
        mat[masc] = np.round(out['mat'][..., 0][masc]); pid[masc] = k; M |= masc
        T = p['T']; a3 = np.linalg.norm(np.cross(p['P'][T[:, 1]] - p['P'][T[:, 0]], p['P'][T[:, 2]] - p['P'][T[:, 0]]), axis=1).sum(); e1 = p['uvpx'][T[:, 1]] - p['uvpx'][T[:, 0]]; e2 = p['uvpx'][T[:, 2]] - p['uvpx'][T[:, 0]]
        mpp[masc] = np.sqrt(a3 / max(np.abs(e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]).sum(), 1e-9))
    I = np.nonzero(M); P = B['pos'][I].astype(np.float64); Nn = B['nor'][I].astype(np.float64); Nn /= np.maximum(np.linalg.norm(Nn, axis=1, keepdims=True), 1e-9); PR = B['prm'][I].astype(np.float64); AX = B['aux'][I].astype(np.float64); MT = mat[I]; PID = pid[I]; n = len(P)
    nombres = [p['nombre'] for p in pz]; es = lambda *pref: np.isin(PID, [k for k, nm in enumerate(nombres) if any(nm.startswith(q) for q in pref)])
    x, y, z = P.T; ax_ = np.abs(x)
    C = np.full((n, 3), 0.5); H = np.zeros(n); R = np.full(n, 0.8); ME = np.zeros(n); TI = np.zeros((n, 3))     # color, altura (m), aspereza, metal, tintes
    mira = oclusion(pz); d1 = mira(P + Nn * 0.025); d2 = mira(P + Nn * 0.06); ao = d1 * 0.6 + d2 * 0.4; ref = np.percentile(ao, 25); AO = np.clip(1 - (ao - ref) / max(np.percentile(ao, 99) - ref, 1e-6) * 0.8, 0.25, 1)
    grano = fbm(P, 60, 3, 3.0); mancha = fbm(P, 9, 3, 11.0); fino = ruido3(P, 420, 5.0)

    # ---------- piel ----------
    s = MT == MAT['piel']
    if s.any():
        p = P[s]; xs, ys, zs = p.T; axs = np.abs(xs); c = np.tile([0.78, 0.575, 0.45], (len(p), 1)) * (0.955 + 0.09 * mancha[s])[:, None]; c[:, 0] *= 1 + 0.03 * (grano[s] - 0.5)
        rojo = 0.26 * gau(np.stack([axs, ys, zs], 1), [0.047, 1.583, 0.118], [0.022, 0.02, 0.03]) + 0.30 * gau(p, [0, 1.579, 0.168], [0.013, 0.012, 0.014]) + 0.28 * ((axs > 0.078) & (ys > 1.565) & (ys < 1.64) & (zs < 0.06)) \
            + 0.16 * gau(np.stack([axs, ys, zs], 1), [0.15, 0.50, 0.06], [0.04, 0.045, 0.04]) + 0.16 * gau(np.stack([axs, ys, zs], 1), [0.35, 1.19, 0.0], [0.035, 0.035, 0.035]) + 0.10 * ((axs > 0.44) & (ys < 1.1) & (ys > 0.9))
        c = mez(c, [0.72, 0.40, 0.34], np.clip(rojo, 0, 0.5))
        cara = (ys > 1.47) & (zs > 0.03)
        pz_ = m['cola']['breast.L']; fr_ = zs > 0.03; q3 = np.stack([axs, ys, zs], 1)       # torso desnudo: pezones, ombligo, surcos y vello
        c = mez(c, [0.56, 0.34, 0.29], 0.75 * fr_ * (np.hypot(axs - abs(pz_[0]), ys - pz_[1]) < 0.0085)); c = mez(c, [0.42, 0.26, 0.21], 0.7 * fr_ * gau(q3, [0, 1.048, 0.1], [0.006, 0.008, 0.2]) * (axs < 0.03))
        surco = fr_ * (ys > 1.0) * (ys < 1.40) * (0.5 * np.exp(-(axs / 0.006) ** 2) * (ys < pz_[1] + 0.07) + 0.4 * np.exp(-((ys - (pz_[1] - 0.045 - 1.5 * (axs - abs(pz_[0])) ** 2)) / 0.009) ** 2) * (axs < 0.17) * (axs > 0.015)
                 + 0.3 * (axs < 0.075) * sum(np.exp(-((ys - yy_) / 0.006) ** 2) for yy_ in (1.215, 1.16, 1.105)))
        c = mez(c, [0.52, 0.34, 0.27], np.clip(0.45 * surco, 0, 0.4)); vp = fr_ * (ys > 0.98) * (ys < 1.42) * (gau(q3, [0, 1.33, 0.1], [0.11, 0.07, 0.3]) + 0.6 * gau(q3, [0, 1.01, 0.1], [0.03, 0.06, 0.3])); c = mez(c, [0.40, 0.29, 0.23], 0.30 * vp * (fino[s] > 0.5))
        ojo = gau(np.stack([axs, ys, zs], 1), [0.030, 1.613, 0.135], [0.020, 0.011, 0.03]); c = mez(c, [0.50, 0.33, 0.28], 0.38 * ojo * cara)
        barba = cara * sst(1.578, 1.556, ys) * sst(1.455, 1.485, ys) * (1 - sst(0.150, 0.162, zs) * sst(1.560, 1.570, ys)) * sst(0.03, 0.06, zs + 0.6 * axs); c = mez(c, [0.40, 0.34, 0.33], 0.22 * barba * (0.55 + 0.45 * fino[s]))
        dx = axs / 0.0255; dy = ys - 1.5485; lab = (dx < 1) * (zs > 0.132) * sst(0.0, 0.0012, np.where(dy > 0, 0.0078 * np.sqrt(np.clip(1 - dx ** 2, 0, 1)) * (1 - 0.25 * np.exp(-(axs / 0.004) ** 2)) - dy, 0.0098 * np.sqrt(np.clip(1 - dx ** 2, 0, 1)) + dy))
        c = mez(c, [0.66, 0.40, 0.35], 0.6 * lab); c = mez(c, [0.25, 0.12, 0.11], 0.8 * (dx < 0.97) * (zs > 0.132) * np.exp(-(dy / 0.0008) ** 2))
        t = np.clip((axs - 0.010) / 0.046, 0, 1); yc = 1.6335 + 0.0042 * np.sin(np.pi * t * 0.8) - 0.011 * t ** 3; gro = 0.0034 * (1 - 0.6 * t ** 2); ceja = cara * (axs > 0.010) * (axs < 0.056) * np.exp(-((ys - yc) / gro) ** 2) * (0.55 + 0.45 * r2(xs * 1.0 + ys * 0.6, ys, 2400, 2.0))
        c = mez(c, [0.15, 0.10, 0.075], np.clip(1.0 * ceja, 0, 0.8))
        cab = ys > 1.5; oreja = (axs > 0.076) & (ys > 1.562) & (ys < 1.642) & (zs > -0.012) & (zs < 0.058)
        pelo = cab * (~oreja) * np.clip(sst(0.062, 0.035, zs) * sst(1.545, 1.572, ys - 0.25 * np.clip(zs, -0.1, 0.05)) + sst(1.628, 1.648, ys - 0.5 * (zs - 0.08)) * (zs < 0.125) + (axs > 0.066) * sst(0.092, 0.07, zs) * sst(1.588, 1.6, ys), 0, 1)
        hebra = r2(xs * 900 + np.sin(ys * 300) * 0.4, ys * 60, 1.0, 9.0); c = mez(c, ESTILO['pelo'], pelo * (0.82 + 0.18 * hebra)); H[s] += pelo * (0.0006 + 0.0007 * hebra)
        # sandalias (caligae): correas pintadas con relieve
        pie = ys < 0.175; lado_ = np.sign(xs); eje_x = lado_ * (0.193 + (zs - 0.019) * 0.093); arriba = Nn[s][:, 1] > -0.15
        cor = pie * (((ys > 0.086) & (ys < 0.106)) | ((ys > 0.138) & (ys < 0.157)) | (arriba & (ys < 0.10) & ((np.abs(zs - 0.062) < 0.007) | (np.abs(zs - 0.098) < 0.007) | (np.abs(zs - 0.132) < 0.006))) | ((Nn[s][:, 1] > 0.25) & (np.abs(xs - eje_x) < 0.006) & (zs > 0.03) & (zs < 0.165) & (ys < 0.12)) | ((zs < -0.012) & (ys < 0.09)) | ((ys < 0.022) & (zs < 0.15)))
        if ESTILO['calzado'] == 'zapato': cor = (pie * (ys < 0.118)).astype(float)
        c = mez(c, np.array([0.27, 0.17, 0.10]) * (0.8 + 0.4 * grano[s])[:, None] if ESTILO['calzado'] == 'zapato' else np.array([0.27, 0.17, 0.10]), cor * 0.96); H[s] += cor * 0.0016 + 0.00012 * fino[s] * (1 - cor)
        vello = (((axs > 0.33) & (ys < 1.2) & (ys > 1.05)) | ((ys < 0.47) & (ys > 0.15))) * (1 - cor); c = mez(c, [0.42, 0.30, 0.24], 0.16 * vello * (fino[s] > 0.55))
        C[s] = c; R[s] = 0.56 - 0.13 * gau(p, [0, 1.6, 0.15], [0.05, 0.07, 0.05]) - 0.14 * lab + 0.2 * pelo + 0.1 * cor; TI[s, 1] = (1 - np.clip(pelo + cor + ceja, 0, 1)) * (1 - 0.6 * lab); pm = pelo > 0.5; TI[s, 0] = np.where(pm, 1.0, 0.5 * barba * (0.6 + 0.4 * fino[s])); TI[s, 2] = pm      # pelo: rojo y azul a la vez; barba: rojo sobre piel
    # ---------- ojos ----------
    s = MT == MAT['ojo']
    if s.any():
        r = AX[s, 0]; ang = np.arctan2(y[s] - 1.613, ax_[s] - 0.030); iris = np.array([0.30, 0.19, 0.09]) * (0.75 + 0.5 * r2(ang * 6, r * 300, 1.0, 4.0))[:, None] * (0.6 + 0.6 * sst(0.0022, 0.0058, r))[:, None]
        c = np.tile([0.86, 0.83, 0.80], (int(s.sum()), 1)); c = mez(c, [0.72, 0.5, 0.46], 0.35 * sst(0.008, 0.013, r)); w = sst(0.0064, 0.0056, r); c = c * (1 - w[:, None]) + iris * w[:, None]; c = mez(c, [0.02, 0.02, 0.02], sst(0.0026, 0.0020, r)); c = mez(c, [0.08, 0.05, 0.03], 0.7 * np.exp(-((r - 0.006) / 0.0006) ** 2))
        C[s] = c; R[s] = 0.12
    # ---------- tela (túnica) ----------
    s = MT == MAT['tela']
    if s.any():
        u, v = PR[s].T; hilo = 0.5 + 0.25 * np.sin((u + v) * 2100) + 0.25 * np.sin((u - v) * 2100 * 0.93); arr = fbm(np.stack([u * 0.6, v * 2.2, z[s] * 0.3], 1), 14, 3, 5.0)
        falda = es('faldon_tunica')[s]; manga = es('manga')[s]; borde = np.where(falda, AX[s, 0], np.where(manga, AX[s, 0], 0)); dob = sst(0.90, 0.93, borde) * sst(1.0, 0.985, borde); cost = np.exp(-((borde - 0.915) / 0.008) ** 2)
        c = np.full((int(s.sum()), 3), 0.46) * (0.80 + 0.22 * arr + 0.08 * hilo)[:, None] * (1 - 0.18 * mancha[s] * sst(0.3, 1.0, borde))[:, None]; c *= (1 - 0.22 * cost * (np.sin(u * 900) > 0))[:, None]
        tt = -np.pi + 2 * np.pi * AX[s, 1]; pli = 0.5 + 0.5 * np.sin(tt * 13 + 2 * np.sin(tt * 3)); prof = falda * sst(0.0, 0.55, AX[s, 0]); c = c * (1 - 0.42 * prof * (1 - pli) ** 1.5)[:, None] * (1 + 0.10 * prof * pli ** 3)[:, None]
        arrm = manga * (0.5 + 0.5 * np.sin(u * 190 + 3 * np.sin(v * 40))) * sst(0.2, 0.7, AX[s, 0]); c = c * (1 - 0.22 * arrm)[:, None]
        C[s] = c; H[s] = 0.00025 * hilo + 0.0035 * (arr - 0.5) + 0.0009 * dob + 0.002 * arrm; R[s] = 0.93; TI[s, 0] = 1
    # ---------- cota de malla ----------
    s = MT == MAT['malla']
    if s.any():
        u, v = PR[s].T; px_, py_ = 0.0088, 0.0066; fila = np.floor(v / py_); vv = v / py_ - fila - 0.5; uu = u / px_ + 0.5 * (fila % 2); uu = uu - np.floor(uu) - 0.5; sl = np.where(fila % 2 == 0, 0.55, -0.55); ur = uu + sl * vv
        d = np.sqrt((ur / 0.40) ** 2 + (vv / 0.60) ** 2); h = np.exp(-((d - 0.78) / 0.27) ** 2); ox = fbm(P[s], 22, 3, 7.0); oxi = sst(0.56, 0.72, ox) * 0.6
        oxi = oxi * 0.6; c = np.tile([0.47, 0.48, 0.51], (int(s.sum()), 1)) * (0.40 + 0.60 * h)[:, None] * (0.90 + 0.20 * mancha[s])[:, None]; c = mez(c, [0.30, 0.19, 0.12], oxi * (0.4 + 0.6 * h))
        co = es('cota')[s]; xa = ax_[s]; ys = y[s]; zs = z[s]
        dent = np.maximum(sst(0.047, 0.056, xa) * sst(0.172, 0.163, xa) * sst(1.222, 1.232, ys + 0.10 * (xa - 0.10)) * (zs >= 0.0), sst(1.322, 1.332, ys) * (zs < 0.0)) * co * sst(1.452, 1.445, ys)
        bo = np.clip(4 * dent * (1 - dent) * 1.6, 0, 1); yc_ = ys - 0.02 * np.clip(-zs, -0.05, 0.1); tel = co * sst(1.4475, 1.4505, yc_); bo = np.maximum(bo, co * sst(1.434, 1.440, yc_)) * (1 - tel)
        broche = co * (zs > 0) * (np.hypot(xa - 0.108, ys - 1.262) < 0.011)
        c = mez(c, np.array([0.30, 0.185, 0.11]) * 0.9, bo); pun = bo * (np.sin((u + v) * 900) > 0.3) * 0.5
        c = mez(c, [0.62, 0.55, 0.42], 0.5 * pun); c = mez(c, np.array([0.46, 0.46, 0.46]) * 0.9, tel); c = mez(c, [0.85, 0.62, 0.28], broche)
        C[s] = c; H[s] = (0.0007 * h + 0.0012 * dent) * (1 - bo) * (1 - tel) + 0.0022 * bo + 0.003 * broche; R[s] = np.where(bo + tel > 0.5, 0.7, 0.52 + 0.25 * oxi + 0.2 * (1 - h)); R[s] = np.where(broche > 0.5, 0.3, R[s])
        ME[s] = np.where(bo + tel > 0.5, 0.0, 0.15 + 0.6 * h); ME[s] = np.where(broche > 0.5, 1.0, ME[s]); TI[s, 0] = tel
    # ---------- bronce ----------
    s = MT == MAT['bronce']
    if s.any():
        v = AX[s, 0]; u = AX[s, 1]; cu = es('yelmo_cuenco')[s]; ca = es('yelmo_carrillera')[s]; gr = es('greba')[s]; pat = sst(0.45, 0.8, fbm(P[s], 30, 3, 2.0)); ray = sst(0.72, 0.9, r2(PR[s, 0] * 900, PR[s, 1] * 40, 1.0, 3.0))
        c = np.tile([0.63, 0.44, 0.22], (int(s.sum()), 1)) * (0.92 + 0.16 * mancha[s])[:, None] * (1 + cu * (0.22 * sst(0.25, 0.9, v) - 0.10))[:, None]; c = mez(c, [0.33, 0.26, 0.14], (0.30 * pat + 0.55 * (1 - AO[s]) ** 1.2) * (1 - 0.75 * gr)); c = c * (1 + 0.18 * gr)[:, None]; c = mez(c, [0.30, 0.42, 0.33], 0.16 * sst(0.75, 0.95, fbm(P[s], 55, 2, 8.0)))
        soga = cu * (v < 0.062) * (v > 0.012) * (0.5 + 0.5 * np.sin(u * 2 * np.pi * 46 + v * 220)); escam = cu * (v > 0.9) * (0.5 + 0.5 * np.sin(u * 2 * np.pi * 12) * np.sin(v * 260)); filo = ca * (np.minimum(np.minimum(u, 1 - u), np.minimum(v, 1 - v) * 1.4) < 0.07) + gr * (np.minimum(v, 1 - v) < 0.03)
        nerv = gr * np.exp(-(x[s] - 0.0 - (0.15 + (y[s] - 0.5) * -0.105)) ** 2 / 0.006 ** 2) * 0
        C[s] = c * (1 - 0.12 * soga)[:, None]; H[s] = 0.0007 * soga + 0.0025 * gr * np.exp(-((u - 0.5) / 0.05) ** 2) * 0 + 0.001 * escam + 0.0012 * filo + 0.00010 * (grano[s] - 0.5); R[s] = 0.47 + 0.20 * pat * (1 - 0.6 * gr) + 0.05 * grano[s]; ME[s] = 1.0
    # ---------- hierro ----------
    s = MT == MAT['hierro']
    if s.any():
        hoja = es('espada_hoja')[s]; canto = es('escudo_canto')[s]; umbo = es('escudo_espina', 'escudo_frente')[s]; pil = es('pilum', 'lanza')[s]; osc = sst(0.4, 0.75, fbm(P[s], 40, 3, 6.0)); ox = sst(0.62, 0.82, fbm(P[s], 26, 3, 14.0))
        c = np.tile([0.70, 0.70, 0.72], (int(s.sum()), 1)) * np.where(hoja, 1.0, 0.85)[:, None] * (0.85 + 0.25 * mancha[s])[:, None]; c = mez(c, [0.26, 0.25, 0.25], 0.45 * osc * (1 - hoja * 0.7)); c = mez(c, [0.36, 0.20, 0.11], 0.5 * ox * (1 - hoja * 0.8))
        fil = hoja * sst(0.55, 0.95, AX[s, 0]); c = c * (1 + 0.25 * fil)[:, None]; rem = umbo * 0
        C[s] = np.clip(c, 0, 1); R[s] = np.where(hoja, 0.22 + 0.2 * (1 - fil) * grano[s], 0.42 + 0.3 * osc + 0.2 * ox); ME[s] = 1.0 - 0.6 * ox * (1 - hoja); H[s] = 0.0003 * (grano[s] - 0.5) * (1 - hoja)
    # ---------- madera, tablas, hueso ----------
    s = (MT == MAT['madera']) | (MT == MAT['tablas'])
    if s.any():
        u, v = PR[s].T; tab = MT[s] == MAT['tablas']; veta = fbm(np.stack([u * 1.0, v * 0.06, z[s] * 0.0], 1), 260, 3, 3.0); nudo = fbm(np.stack([u, v * 0.3, z[s] * 0], 1), 30, 2, 9.0)
        c = np.tile([0.47, 0.32, 0.19], (int(s.sum()), 1)) * (0.62 + 0.55 * veta)[:, None] * (0.85 + 0.3 * nudo)[:, None]; junta = tab * (np.abs(((u + 0.33) / 0.066) % 1 - 0.5) > 0.46); trav = tab * ((np.abs(np.abs(v) - 0.33) < 0.016) | (np.abs(v) < 0.02)); c = mez(c, [0.13, 0.09, 0.06], 0.8 * junta); c = mez(c, [0.36, 0.25, 0.15], 0.9 * trav * (1 - junta))
        pomo = es('espada')[s]; c = np.where(pomo[:, None], c * [0.75, 0.62, 0.55], c); C[s] = c * np.where(tab, 0.8, 1.0)[:, None]; H[s] = 0.0005 * veta - 0.0012 * junta + 0.004 * trav; R[s] = 0.62 + 0.2 * veta
    s = MT == MAT['hueso']
    if s.any():
        v = AX[s, 0]; an = 0.5 + 0.5 * np.sin(v * 2 * np.pi * 9.5); C[s] = np.array([0.80, 0.73, 0.58]) * (0.72 + 0.28 * an)[:, None] * (0.9 + 0.15 * mancha[s])[:, None]; H[s] = 0.0012 * an; R[s] = 0.45
    # ---------- cuero: cinturón, vaina, suela ----------
    s = (MT == MAT['cuero']) | (MT == MAT['suela'])
    if s.any():
        v = AX[s, 0]; u = AX[s, 1]; cin = es('cinturon')[s]; vai = es('vaina')[s]; c = np.tile([0.25, 0.15, 0.09], (int(s.sum()), 1)) * (0.75 + 0.5 * grano[s])[:, None]; c = np.where(vai[:, None], c * [1.25, 0.72, 0.62], c)
        fr = np.abs(u - 0.5); placa = cin * (fr < 0.30) * (np.abs((u * 14) % 1 - 0.5) < 0.36) * (np.abs(v - 0.5) < 0.40); heb = cin * (fr < 0.028) * (np.abs(v - 0.5) < 0.46)
        marco_ = vai * ((u > 0.90) | (v < 0.035) | (np.abs(v - 0.27) < 0.014) | (np.abs(v - 0.55) < 0.014) | (v > 0.88)); met = np.clip(placa + heb + marco_, 0, 1); rem = met * (np.sin(u * 14 * 2 * np.pi * 2) > 0.8) * (np.abs(np.abs(v - 0.5) - 0.3) < 0.07) * cin
        c = mez(c, np.array([0.80, 0.58, 0.27]) * (0.8 + 0.3 * mancha[s].mean()), met); C[s] = c; H[s] = 0.0012 * met + 0.0008 * rem + 0.0003 * (grano[s] - 0.5); R[s] = np.where(met > 0.5, 0.36 + 0.2 * grano[s], 0.66); ME[s] = met
    # ---------- escudo: frente pintado ----------
    s = MT == MAT['escudo']
    if s.any():
        u, v = PR[s].T; fr = es('escudo_frente')[s]; vn = AX[s, 0]; ray = sst(0.80, 0.93, r2(u * 55 + v * 16, v * 9, 1.0, 5.0)) * sst(0.35, 0.7, mancha[s]) + sst(0.83, 0.95, r2(u * 300, v * 300, 1.0, 12.0)) * 0.7; ray = np.clip(ray, 0, 1) * fr
        tabl = 0.5 + 0.5 * np.cos((u / 0.066) * 2 * np.pi); c = np.full((int(s.sum()), 3), 0.56) * (0.80 + 0.25 * fbm(P[s], 16, 3, 4.0) + 0.05 * (grano[s] - 0.5))[:, None]; c = c * (1 - 0.07 * (tabl < 0.04))[:, None]
        banda = fr * (np.abs(vn) > 0.925); placa = fr * (np.abs(u) < 0.115) * (np.abs(v) < 0.070 - 0.02 * (np.abs(u) / 0.115) ** 2) ; rem = placa * (gau(np.stack([np.abs(u), np.abs(v), 0 * u], 1), [0.095, 0.045, 0], [0.007, 0.007, 1]) > 0.5); hi = np.clip(banda + placa, 0, 1)
        ray = ray * 0.55; un = AX[s, 1]; ed = np.minimum(1 - np.abs(un), (1 - np.abs(vn)) * 1.6); gas = fr * np.clip(sst(0.16, 0.0, ed) * (0.35 + 0.9 * fbm(P[s], 34, 3, 21.0)) + 0.5 * sst(0.62, 0.8, fbm(P[s], 13, 3, 31.0)) * sst(0.3, 0.9, -vn + 0.3), 0, 1) * (1 - hi)
        barro_ = fr * sst(-0.35, -1.0, vn) * (0.35 + 0.65 * fbm(P[s], 20, 3, 41.0)) * (1 - hi); c = c * (1 + 0.10 * sst(-0.2, 0.9, vn))[:, None]
        c = mez(c, [0.52, 0.43, 0.33], 0.55 * ray * (1 - hi)); c = mez(c, [0.40, 0.31, 0.22], 0.42 * gas); c = mez(c, [0.30, 0.24, 0.17], 0.36 * barro_); c = mez(c, np.array([0.47, 0.47, 0.49]), hi); c = c * (1 - 0.4 * sst(0.5, 0.8, fbm(P[s], 30, 3, 6.0)) * hi)[:, None]; c = mez(c, [0.75, 0.75, 0.78], rem * 1.0)
        C[s] = c; H[s] = -0.0006 * ray + 0.0015 * hi + 0.002 * rem - 0.0004 * (tabl < 0.04) + 0.0002 * (grano[s] - 0.5); R[s] = np.where(hi > 0.5, 0.58, 0.80 - 0.1 * ray); ME[s] = hi; TI[s, 2] = (1 - hi) * (1 - 0.8 * ray) * (1 - 0.6 * gas) * (1 - 0.5 * barro_)
    # ---------- plumas ----------
    s = MT == MAT['pluma']
    if s.any():
        a = AX[s, 0]; v = AX[s, 1]; barb = 0.5 + 0.5 * np.sin((v * 0.33 - a * 0.030 * 0.9) * 5200); raq = np.exp(-(a / 0.07) ** 2); c = np.tile([0.035, 0.03, 0.045], (int(s.sum()), 1)) * (0.6 + 0.9 * barb)[:, None]; c = mez(c, [0.42, 0.36, 0.30], 0.8 * raq)
        C[s] = c; H[s] = 0.0004 * barb + 0.001 * raq; R[s] = 0.5
    # ---------- pantalón de cuadros, escudo galo, oro, pelo (galo) ----------
    s = MT == MAT['cuadros']
    if s.any():
        u, v = PR[s].T; a = (np.abs((u / 0.07) % 1 - 0.5) < 0.16).astype(float); b = (np.abs((v / 0.07) % 1 - 0.5) < 0.16).astype(float); f1 = (np.abs((u / 0.07 + 0.5) % 1 - 0.5) < 0.035).astype(float) + (np.abs((v / 0.07 + 0.5) % 1 - 0.5) < 0.035)
        hilo = 0.5 + 0.25 * np.sin((u + v) * 2100) + 0.25 * np.sin((u - v) * 1950); arr = fbm(np.stack([u * 2.0, v * 0.5, z[s] * 0.3], 1), 16, 3, 5.0)
        c = np.full((int(s.sum()), 3), 0.44) * (1 - 0.30 * a)[:, None] * (1 - 0.30 * b)[:, None]; c = mez(c, [0.62, 0.55, 0.36], 0.7 * np.clip(f1, 0, 1)); C[s] = c * (0.80 + 0.22 * arr + 0.08 * hilo)[:, None]; H[s] = 0.00025 * hilo + 0.004 * (arr - 0.5); R[s] = 0.93; TI[s, 0] = 1 - 0.7 * np.clip(f1, 0, 1)
    s = MT == MAT['escudo_galo']
    if s.any():
        u, v = PR[s].T; fr = es('escudo_frente')[s]; rr = np.hypot(u, v * 0.62); ray = np.clip(sst(0.80, 0.93, r2(u * 55 + v * 16, v * 9, 1.0, 5.0)) * sst(0.35, 0.7, mancha[s]) + sst(0.84, 0.95, r2(u * 300, v * 300, 1.0, 12.0)) * 0.7, 0, 1) * fr
        th = np.arctan2(v, u); esp = fr * (np.abs(np.hypot(np.abs(u) - 0.0, np.abs(v) - 0.27) - 0.105 - 0.0 * th) < 0.011) * (np.abs(v) > 0.2); orla = fr * (np.abs(AX[s, 0]) < 0.0) ; cir = fr * (np.abs(rr - 0.17) < 0.010); mot = np.clip(esp + cir, 0, 1)
        c = np.full((int(s.sum()), 3), 0.47) * (0.80 + 0.25 * fbm(P[s], 16, 3, 4.0))[:, None]; c = mez(c, [0.80, 0.72, 0.50], 0.9 * mot * (1 - ray)); c = mez(c, [0.60, 0.54, 0.44], 0.75 * ray * (1 - mot))
        C[s] = c; H[s] = -0.0006 * ray; R[s] = 0.76; TI[s, 2] = (1 - mot) * (1 - 0.8 * ray)
    s = MT == MAT['oro']
    if s.any():
        tw = 0.5 + 0.5 * np.sin(AX[s, 1] * 2 * np.pi * 26 + AX[s, 0] * 2 * np.pi * 2); C[s] = np.array([0.95, 0.72, 0.30]) * (0.75 + 0.25 * tw)[:, None]; H[s] = 0.0012 * tw; R[s] = 0.28; ME[s] = 1
    s = MT == MAT['pelo']
    if s.any():
        u, v = AX[s].T; heb = r2(u * 300, v * 7, 1.0, 9.0); heb2 = r2(u * 900, v * 12, 1.0, 19.0); c = np.tile(ESTILO.get('melena', [0.74, 0.66, 0.47]), (int(s.sum()), 1)) * (0.50 + 0.45 * heb + 0.3 * heb2)[:, None]
        C[s] = c; H[s] = 0.0022 * heb + 0.001 * heb2; R[s] = 0.6; TI[s, 0] = 1; TI[s, 2] = 1
    # ---------- salida ----------
    C = np.clip(C * (0.52 + 0.48 * AO)[:, None] * (0.93 + 0.11 * Nn[:, 1])[:, None], 0, 1)
    def lienzo(v, k, fondo):
        a = np.full((N, N, k), fondo, np.float32); a[I] = v.reshape(n, k); return a
    col = lienzo(C, 3, 0.4); alt = lienzo(H, 1, 0.0); orm = lienzo(np.stack([AO, R, ME], 1), 3, 0.5); tin = lienzo(TI, 3, 0.0)
    h = alt[..., 0]; gx = np.zeros_like(h); gy = np.zeros_like(h); mx = M[:, 1:] & M[:, :-1]; my = M[1:] & M[:-1]; dx = np.where(mx, h[:, 1:] - h[:, :-1], 0); dy = np.where(my, h[1:] - h[:-1], 0)
    gx[:, 1:] += dx * 0.5; gx[:, :-1] += dx * 0.5; gy[1:] += dy * 0.5; gy[:-1] += dy * 0.5; nx = -gx / mpp * 1.6; ny = -gy / mpp * 1.6; l = np.sqrt(nx * nx + ny * ny + 1); nor = np.stack([nx / l, ny / l, 1 / l], -1) * 0.5 + 0.5
    capas = [col, nor, orm, tin]; geo.dilatar(M, capas, 20)
    b = lambda a: np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8); base = ruta.split('/')[-1]
    Image.fromarray(b(col)).save(ruta + '_color.webp', quality=93, method=4); Image.fromarray(b(nor)).save(ruta + '_normal.webp', quality=92, method=4); Image.fromarray(b(orm)).save(ruta + '_orm.webp', quality=88, method=4)
    Image.fromarray(b(tin)).resize((N // 2, N // 2), Image.LANCZOS).save(ruta + '_masc.webp', quality=90, method=4)
    return dict(color=base + '_color.webp', normal=base + '_normal.webp', orm=base + '_orm.webp', masc=base + '_masc.webp')
