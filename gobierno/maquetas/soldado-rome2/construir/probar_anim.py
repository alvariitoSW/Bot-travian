import numpy as np, mh, anim
m = mh.construir(); g = anim.Glb(anim.ARCH[1])
print({k: np.round(v[:3, 3], 2) for k, v in g.reposo.items() if k in ('DEF-hips', 'DEF-upper_arm.L', 'DEF-forearm.L', 'DEF-hand.L', 'DEF-thigh.L', 'DEF-foot.L', 'DEF-head', 'DEF-toe.L')})
D, P, dur = anim.retarget(m, 1, 'A_TPose', G=g); ix = {b: i for i, b in enumerate(m['huesos'])}
for b in ('root', 'head', 'wrist.L', 'finger3-3.L', 'foot.L', 'foot.R'): print(b, np.round(P[0, ix[b]], 2), 'reposo', np.round(m['cab'][b], 2))
D, P, dur = anim.retarget(m, 1, 'Walk_Loop', G=g); print(D.shape, dur, np.round(P[:, ix['foot.L']][::8], 2))
print('det', np.linalg.det(D).min(), np.linalg.det(D).max())
