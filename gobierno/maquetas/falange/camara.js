/* Pieza «cámara» (TP8b-P1, falange): por encima de los cascos, algo detrás de tu fila y mirando abajo y al frente (idea
   de los clips de Rome II del usuario, «falange desde detrás»: solo la idea). Va entre tu columna y la de tu derecha, a unos
   3 m del suelo: los cascos quedan abajo, en el centro se ven el muro de puntas y el romano entre las astas alzadas.
   Al chocar baja y se acerca un poco (0,6 s) sin perder al enemigo. ?lado=1 la pone de costado (foto del muro de picas); ?alto=1, en alto (FA4).
   FA4: va con el giro del muro (detrás de ti sobre su eje, con 0,3 s de retraso) y se asoma al flanco que viene.
   ?cam=d,y,cabeceo,giro,abertura la retoca (vertical u horizontal).
   Contrato: crearCamara(m) con m = { Q, S, H, suave, lerp, DX, marcado, vertical (lectura) } devuelve { CAM, camBase }. */
export function crearCamara(m) {
  const { Q, S, H, suave, lerp, DX } = m;
  const CAMS = { v: { d: 4.6, y: 3.9, pitch: -0.4, yaw: 0, fov: 60 }, h: { d: 4.3, y: 3.6, pitch: -0.3, yaw: 0, fov: 46 } };
  if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number), t = innerHeight > innerWidth ? CAMS.v : CAMS.h; ['d', 'y', 'pitch', 'yaw', 'fov'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
  const LADO = Q.get('lado') === '1', ALTO = Q.get('alto') === '1', G = Math.PI / 180;
  const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 60 }, SUAVE = { x: null, yaw: 0, asoma: 0 };
  /* el ángulo más corto de a a b */
  const dAng = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  /* FA4: el marco del muro. frente = (sen giro, −cos giro); derecha = (cos giro, sen giro); la cámara mira con yaw = −giro */
  function camBase(dt = 0) {
    const a = m.vertical ? CAMS.v : CAMS.h, yo = S.fal[S.yo.i], g = S.giro || 0, Fx = Math.sin(g), Fz = -Math.cos(g), Dx = Math.cos(g), Dz = Math.sin(g);
    if (LADO) {
      /* de costado, a la altura del pecho, a la derecha del muro: las puntas de perfil y los caídos delante */
      CAM.x = S.xF + Dx * 9.5 + Fx * 3.4; CAM.z = S.zF + Dz * 9.5 + Fz * 3.4; CAM.y = H(CAM.x, CAM.z) + 1.7; CAM.yaw = Math.PI / 2 - g; CAM.pitch = -0.07; CAM.fov = 42; return CAM;
    }
    if (ALTO) {
      /* vista alta: 22 m sobre el pivote, mirando abajo unos 60°. No gira con el muro: así se ve cuánto ha girado, y el flanco */
      CAM.x = S.xF; CAM.z = S.zF + 12; CAM.y = H(S.xF, S.zF) + 22; CAM.yaw = 0; CAM.pitch = -60 * G; CAM.fov = 55; return CAM;
    }
    /* al chocar: baja y se acerca en 0,6 s */
    const w = S.choque ? suave(0, 0.6, S.T - S.tChoque) : 0, dd = a.d - 0.7 * w;
    /* detrás de ti sobre el eje del muro, en el hueco a tu derecha; el giro pesa: unos 0,3 s de retraso */
    const tx = yo.x - Fx * dd + Dx * 0.6 * DX, tz = yo.z - Fz * dd + Dz * 0.6 * DX;
    const Fl = S.flanco && S.flanco.estado === 'viene' ? S.flanco : null, asoma = Fl ? Fl.lado : 0;
    if (SUAVE.x === null || dt === 0) { SUAVE.x = tx; SUAVE.z = tz; SUAVE.yaw = -g; SUAVE.asoma = asoma; }
    else { const k = 1 - Math.exp(-dt / 0.3), kA = 1 - Math.exp(-dt / 0.6); SUAVE.x += (tx - SUAVE.x) * k; SUAVE.z += (tz - SUAVE.z) * k; SUAVE.yaw += dAng(SUAVE.yaw, -g) * k; SUAVE.asoma += (asoma - SUAVE.asoma) * kA; }
    CAM.x = SUAVE.x; CAM.z = SUAVE.z; CAM.y = H(CAM.x, CAM.z) + a.y - 0.45 * w;
    /* con el flanco viniendo, se asoma 14° hacia ese lado y abre 6° el campo: los ves venir sin cartel */
    CAM.fov = a.fov + 6 * Math.abs(SUAVE.asoma);
    /* filas alzadas: algo menos hacia abajo (se ve el bosque de astas); bajadas, al muro de puntas */
    const bajadas = S.filas.filter(Boolean).length / 5, arriba = (1 - bajadas) * (S.choque ? 0 : 1);
    CAM.pitch = a.pitch + 0.06 * arriba + 0.07 * w; CAM.yaw = SUAVE.yaw + a.yaw - 14 * G * SUAVE.asoma;
    /* en la lucha, algo hacia tu duelo */
    const r = m.marcado && m.marcado();
    if (r && S.choque && !Fl) { const k = suave(0, 1.2, S.T - S.tChoque), obj = Math.atan2(-(r.x - CAM.x), -(r.z - CAM.z)); CAM.yaw += lerp(0, dAng(CAM.yaw, obj) * 0.35, k); }
    /* si rompe tu falange, la cámara se vuelve con los que huyen */
    if (S.ganador === 'rival') { const k = suave(0, 1.5, S.T - S.tRompe); CAM.yaw += Math.PI * 0.9 * k; }
    return CAM;
  }
  return { CAM, camBase };
}
