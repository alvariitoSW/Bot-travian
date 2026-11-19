/* Pieza «cámara»: dónde va la cámara a pie. Detrás de ti y de tu compañero en la marcha; bajo los escudos con el testudo
   cerrado (idea de Ryse, solo la idea); se arrima cuando te vuelves a los tuyos; a tiro, se echa atrás y sigue tu pilum;
   en la lucha se aparta y sube (GP1); de costado para mirar los pies (TP1, ?costado=r|g).
   Contrato: crearCamara(m) con m = { Q, S, H, suave, lerp, YO, CMP, Z_TIRADORES, COSTADO, vertical (lectura) } devuelve
   { CAM, CAMS, camBase }: camBase() pone en CAM la posición, giro, cabeceo y abertura de ahora (el temblor va aparte). */
export function crearCamara(m) {
  const { Q, S, H, suave, lerp, YO, CMP, Z_TIRADORES } = m;
  const CAMS = {
    hm: { x: 0, d: 2.2, y: 2.0, pitch: -0.07, yaw: 0, fov: 58 }, ht: { x: 0, d: 0.85, y: 1.74, pitch: 0, yaw: 0, fov: 55 },
    vm: { x: 0, d: 4.4, y: 2.85, pitch: -0.27, yaw: 0, fov: 74 }, vt: { x: 0, d: 1.45, y: 1.76, pitch: -0.2, yaw: 0, fov: 72 },
  };
  if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number), t = m.vertical ? CAMS.vt : CAMS.ht; ['d', 'y', 'pitch', 'yaw', 'fov', 'x'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
  if (Q.get('camm')) { const c = Q.get('camm').split(',').map(Number), t = m.vertical ? CAMS.vm : CAMS.hm; ['d', 'y', 'pitch', 'yaw', 'fov', 'x'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
  /* GM43h: lo que se mueve la cámara a tiro de pilum (se suma a la de marcha) */
  const CAMP = { v: { x: -0.17, d: -2.1, y: -0.5, pitch: 0.1, fov: 0 }, h: { x: 0.1, d: -0.7, y: 0.15, pitch: 0.03, fov: 0 } };
  const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 60 };
  /* TP8b-L2: la cámara de duelo, sobre tu hombro derecho: atrás, al lado y alto (m), abertura y dónde cae tu galo en pantalla (0 a 1) */
  const CDH = { atras: 1.5, lado: 0.55, alto: 2.9, fov: 64, tx: 0.55, ty: 0.47 }, CDV = { atras: 2.4, lado: 0.9, alto: 2.5, fov: 70, tx: 0.6, ty: 0.44 }, CD = { k: 0, p: null, t: undefined };
  if (Q.get('camd')) { const c = Q.get('camd').split(',').map(Number), t = m.vertical ? CDV : CDH; ['atras', 'lado', 'alto', 'fov', 'tx', 'ty'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
    function camBase() {
    const k = suave(0, 1, S.k), yo = S.romanos[YO], co = S.romanos[CMP], mx = (yo.x + co.x) / 2, a = m.vertical ? CAMS.vm : CAMS.hm, b = m.vertical ? CAMS.vt : CAMS.ht;
    CAM.x = mx + lerp(a.x, b.x, k); CAM.z = S.zF + lerp(a.d, b.d, k); CAM.y = H(mx, S.zF) + lerp(a.y, b.y, k);
    const dist = Math.max(8, CAM.z - Z_TIRADORES), sube = Math.atan2(H(0, Z_TIRADORES) + 1.2 - CAM.y, dist);
    CAM.pitch = lerp(a.pitch, b.pitch, k) + sube * 0.6 * (1 - k); CAM.yaw = lerp(a.yaw, b.yaw, k); CAM.fov = lerp(a.fov, b.fov, k);
    /* cuando tu soldado se vuelve a gritar a los suyos, la cámara se le arrima y le mira: se le ve la cara de perfil */
    const g = suave(0, 1, yo.mira) * k; if (g > 0) { CAM.x -= 0.06 * g; CAM.z -= (m.vertical ? 0.35 : 0.15) * g; CAM.yaw += (m.vertical ? 0.12 : 0.1) * g; CAM.y -= 0.02 * g; }
    /* GM43h: a tiro de pilum la cámara se echa algo atrás, sube y se arrima a tu lado: se ve tu brazo con el pilum y, al fondo, los galos */
    const kp = suave(0, 1, S.kP) * (1 - k);
    if (kp > 0) { const c = m.vertical ? CAMP.v : CAMP.h; CAM.x += c.x * kp; CAM.z += c.d * kp; CAM.y += c.y * kp; CAM.pitch += c.pitch * kp; CAM.fov += c.fov * kp; }
    /* y sigue con la mirada tu pilum: cabecea arriba y luego abajo con él, gira un poco y cierra un pelo el encuadre */
    const p = S.ojo;
    if (p && p.est >= 2) {
      const env = p.est === 2 ? suave(0, 0.35, S.T - p.t0) : 1 - suave(0.4, 1.6, S.T - p.tFin);
      if (env > 0) {
        const dx = p.p.x - CAM.x, dz = p.p.z - CAM.z, dh = Math.hypot(dx, dz) || 1;
        CAM.pitch += (Math.atan2(p.p.y - CAM.y, dh) - CAM.pitch) * 0.4 * env; CAM.yaw += (Math.atan2(-dx, -dz) - CAM.yaw) * 0.25 * env; CAM.fov -= 5 * env;
      }
    }
    /* GP1: en la lucha la cámara se aparta un poco a la derecha y sube, para ver los duelos de medio lado y no solo espaldas */
    const w = S.choque ? suave(0, 1.4, S.T - S.tChoque) : 0;
    if (w > 0) {
    CAM.x += 1.6 * w; CAM.y += 1.0 * w; CAM.z -= 1.9 * w; CAM.yaw += 0.42 * w; CAM.pitch -= 0.36 * w;
    /* TP1: y mira al duelo de tu columna (tu hombre o el que le releva, y su rival) */
    /* TP1b: tu duelo (el tuyo, o el de quien eres tras caer); si ya no hay duelo, se queda mirando donde miraba */
    const ds = S.duelos || [], d = ds.find(d => d.activo && !d.sec && d.r === S.yo) || ds.find(d => d.activo && !d.sec && d.r.f === YO);
    if (d) { S.miraCam = { x: (d.r.x + d.g.x) / 2, z: (d.r.z + d.g.z) / 2 }; }
    const mc = S.miraCam; if (mc) CAM.yaw = lerp(CAM.yaw, Math.atan2(-(mc.x - CAM.x), -(mc.z - CAM.z)), w);
  }
    /* TP8b-L2: en tu duelo, la cámara se pone sobre tu hombro derecho y más cerca: tu soldado a la izquierda y tu galo en el
       centro libre (entre el cartel de arriba y los botones). Entra en 0,6 s al chocar y se desliza si cambia el rival */
    {
      const enLucha = S.choque && !S.huida && !S.derrota && !m.FUERA && !m.COSTADO, du = enLucha ? (S.duelos || []).find(x => x.activo && !x.sec && x.r === S.yo && x.r.vivo && x.g.vivo) : null;
      const dtc = CD.t === undefined ? 9 : Math.max(0, S.T - CD.t); CD.t = S.T;
      CD.k = enLucha && (du || CD.p) ? Math.min(1, CD.k + dtc / 0.6) : Math.max(0, CD.k - dtc / 0.6);
      if (du) { const r = du.r, g = du.g, v = { rx: r.px ?? r.x, rz: r.pz ?? r.z, gx: g.px ?? g.x, gz: g.pz ?? g.z }, a = !CD.p || dtc > 0.5 ? 1 : 1 - Math.exp(-dtc * 5); if (!CD.p) CD.p = { ...v }; for (const n in v) CD.p[n] += (v[n] - CD.p[n]) * a; }
      if (!S.choque) CD.p = null;
      if (CD.k > 0 && CD.p) {
        const c = m.vertical ? CDV : CDH, p = CD.p, l = Math.hypot(p.gx - p.rx, p.gz - p.rz) || 1, ux = (p.gx - p.rx) / l, uz = (p.gz - p.rz) / l;
        const px = p.rx - ux * c.atras - uz * c.lado, pz = p.rz - uz * c.atras + ux * c.lado, py = H(p.rx, p.rz) + c.alto, gy = H(p.gx, p.gz) + 0.92, dx = p.gx - px, dz = p.gz - pz;
        const tv = Math.tan(c.fov * Math.PI / 360), asp = typeof innerWidth !== 'undefined' ? innerWidth / innerHeight : m.vertical ? 390 / 844 : 844 / 390;
        const yaw = Math.atan2(-dx, -dz) + Math.atan((c.tx - 0.5) * 2 * tv * asp), pitch = Math.atan2(gy - py, Math.hypot(dx, dz)) - Math.atan((0.5 - c.ty) * 2 * tv), k = suave(0, 1, CD.k);
        CAM.x = lerp(CAM.x, px, k); CAM.y = lerp(CAM.y, py, k); CAM.z = lerp(CAM.z, pz, k); CAM.yaw = lerp(CAM.yaw, yaw, k); CAM.pitch = lerp(CAM.pitch, pitch, k); CAM.fov = lerp(CAM.fov, c.fov, k);
      }
    }
    /* TP1: de costado (?costado=r o g), desde la izquierda y a la altura del pecho, para mirar si los pies pisan */
    /* TP1b: desde fuera (?vista=fuera), delante y a la izquierda de la formación, a la altura de la cabeza, mirando al centurión */
    if (m.FUERA) {
      const c = S.romanos[YO], x0 = c.x - 2.4, z0 = (c.zd ?? c.z) - 3.4;
      CAM.x = x0; CAM.z = z0; CAM.y = H(x0, z0) + 2.25; const dx = c.x - x0, dz = (c.zd ?? c.z) - z0;
      CAM.yaw = Math.atan2(-dx, -dz); CAM.pitch = Math.atan2(H(c.x, c.z) + 1.85 - CAM.y, Math.hypot(dx, dz)); CAM.fov = 44;
    }
    if (m.COSTADO) {
      const gal = m.COSTADO === 'g', L = gal ? S.galos.filter(g => g.vivo) : S.romanos.filter(h => h.r <= 1);
      const zc = L.reduce((a, h) => a + h.z, 0) / Math.max(1, L.length), x0 = Math.min(...L.map(h => h.x)) - (gal ? 7 : 6);
      CAM.x = x0; CAM.z = zc; CAM.y = H(x0 + 4, zc) + 1.1; CAM.yaw = -Math.PI / 2; CAM.pitch = -0.06; CAM.fov = 40;
    }
    return CAM;
  }
  const lejos = (pt, d) => Math.hypot(pt.x - CAM.x, pt.y - CAM.y, pt.z - CAM.z) >= d;
  return { CAM, CAMS, camBase, lejos };
}
