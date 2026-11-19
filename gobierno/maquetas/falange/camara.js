/* Pieza «cámara» (TP8b-P1, falange): por encima de los cascos, algo detrás de tu fila y mirando abajo y al frente (idea
   de los clips de Rome II del usuario, «falange desde detrás»: solo la idea). Va entre tu columna y la de tu derecha, a unos
   3 m del suelo: los cascos quedan abajo, en el centro se ven el muro de puntas y el romano entre las astas alzadas.
   Al chocar baja y se acerca un poco (0,6 s) sin perder al enemigo. ?lado=1 la pone de costado (foto del muro de picas).
   ?cam=d,y,cabeceo,giro,abertura la retoca (vertical u horizontal).
   Contrato: crearCamara(m) con m = { Q, S, H, suave, lerp, DX, marcado, vertical (lectura) } devuelve { CAM, camBase }. */
export function crearCamara(m) {
  const { Q, S, H, suave, lerp, DX } = m;
  const CAMS = { v: { d: 4.6, y: 3.9, pitch: -0.4, yaw: 0, fov: 60 }, h: { d: 4.3, y: 3.6, pitch: -0.3, yaw: 0, fov: 46 } };
  if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number), t = innerHeight > innerWidth ? CAMS.v : CAMS.h; ['d', 'y', 'pitch', 'yaw', 'fov'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
  const LADO = Q.get('lado') === '1';
  const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 60 }, SUAVE = { x: null };
  function camBase(dt = 0) {
    const a = m.vertical ? CAMS.v : CAMS.h, yo = S.fal[S.yo];
    if (LADO) {
      /* de costado, a la altura del pecho, a la derecha de la falange: el muro de puntas de perfil y los caídos delante */
      CAM.x = 9.5; CAM.z = S.zF - 3.4; CAM.y = H(CAM.x, CAM.z) + 1.7; CAM.yaw = Math.PI / 2; CAM.pitch = -0.07; CAM.fov = 42; return CAM;
    }
    /* al chocar: baja y se acerca en 0,6 s */
    const w = S.choque ? suave(0, 0.6, S.T - S.tChoque) : 0;
    /* la cámara sigue a tu hombre con algo de retraso (no da saltos cuando pasas a otro); va en el hueco a tu derecha */
    const tx = yo.x + DX * 0.75, tz = yo.z + a.d - 0.7 * w;
    if (SUAVE.x === null || dt === 0) { SUAVE.x = tx; SUAVE.z = tz; } else { const k = Math.min(1, dt * 3); SUAVE.x += (tx - SUAVE.x) * k; SUAVE.z += (tz - SUAVE.z) * k; }
    CAM.x = SUAVE.x; CAM.z = SUAVE.z; CAM.y = H(CAM.x, CAM.z) + a.y - 0.45 * w; CAM.fov = a.fov;
    /* picas alzadas: algo menos hacia abajo (se ve el bosque de astas); bajadas, al muro de puntas */
    const arriba = (1 - S.kFrente) * (S.choque ? 0 : 1) * (S.mirarArriba ? 3 : 1);
    CAM.pitch = a.pitch + 0.06 * arriba + 0.07 * w; CAM.yaw = a.yaw;
    /* en la lucha, algo hacia tu duelo */
    const r = m.marcado && m.marcado();
    if (r && S.choque) { const k = suave(0, 1.2, S.T - S.tChoque); CAM.yaw = lerp(CAM.yaw, Math.atan2(-(r.x - CAM.x), -(r.z - CAM.z)) * 0.35, k); }
    /* si rompe tu falange, la cámara se vuelve con los que huyen */
    if (S.ganador === 'romanos') { const k = suave(0, 1.5, S.T - S.tRoto); CAM.yaw += Math.PI * 0.9 * k; }
    return CAM;
  }
  return { CAM, camBase };
}
