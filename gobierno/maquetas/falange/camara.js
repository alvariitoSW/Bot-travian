/* Pieza «cámara» (TP7a, falange): a ras de suelo detrás de tu fila, entre el bosque de astas (idea de los clips de Rome II
   del usuario, solo la idea). Va en el hueco entre tú y el de tu derecha, a la altura de las cabezas: tú a la izquierda, tu
   compañero a la derecha y, delante, las puntas y el enemigo. Con las picas alzadas cabecea un poco hacia arriba para
   que se vea el bosque; en la lucha mira a tu duelo. ?cam=d,y,cabeceo,giro,abertura la retoca (vertical u horizontal).
   Contrato: crearCamara(m) con m = { Q, S, H, suave, lerp, DX, marcado, vertical (lectura) } devuelve { CAM, camBase }. */
export function crearCamara(m) {
  const { Q, S, H, suave, lerp, DX } = m;
  const CAMS = { v: { d: 1.9, y: 2.12, pitch: -0.1, yaw: 0, fov: 72 }, h: { d: 1.75, y: 2.02, pitch: -0.08, yaw: 0, fov: 52 } };
  if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number), t = innerHeight > innerWidth ? CAMS.v : CAMS.h; ['d', 'y', 'pitch', 'yaw', 'fov'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
  const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 60 }, SUAVE = { x: null };
  function camBase(dt = 0) {
    const a = m.vertical ? CAMS.v : CAMS.h, yo = S.fal[S.yo];
    /* la cámara sigue a tu hombre con algo de retraso (no da saltos cuando pasas a otro) */
    const tx = yo.x + DX * 0.5, tz = yo.z + a.d;
    if (SUAVE.x === null || dt === 0) { SUAVE.x = tx; SUAVE.z = tz; } else { const k = Math.min(1, dt * 3); SUAVE.x += (tx - SUAVE.x) * k; SUAVE.z += (tz - SUAVE.z) * k; }
    CAM.x = SUAVE.x; CAM.z = SUAVE.z; CAM.y = H(CAM.x, CAM.z) + a.y; CAM.fov = a.fov;
    /* picas alzadas: mira algo arriba (el bosque); bajadas: al frente, a las puntas */
    const arriba = (1 - S.kFrente) * (S.choque ? 0.3 : 1) * (S.mirarArriba ? 2.4 : 1);
    CAM.pitch = a.pitch + 0.1 * arriba; CAM.yaw = a.yaw;
    /* en la lucha, a tu duelo */
    const r = m.marcado && m.marcado();
    if (r && S.choque) { const w = suave(0, 1.2, S.T - S.tChoque); CAM.yaw = lerp(CAM.yaw, Math.atan2(-(r.x - CAM.x), -(r.z - CAM.z)) * 0.6, w); }
    /* en el choque sube un palmo y mira abajo: se ven las puntas por encima de los hombros */
    if (S.choque) { const w = suave(0, 1.2, S.T - S.tChoque); CAM.y += 0.32 * w; CAM.pitch -= 0.13 * w; }
    /* si rompe tu falange, la cámara se vuelve con los que huyen */
    if (S.ganador === 'romanos') { const w = suave(0, 1.5, S.T - S.tRoto); CAM.yaw += Math.PI * 0.9 * w; }
    return CAM;
  }
  return { CAM, camBase };
}
