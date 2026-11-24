/* AQVILA · CG8a: la cámara de cine de la batalla grande de manípulos (js/ui-mando.js).
   Idea de las referencias del usuario (gobierno/estudios/REF-batallas-referencias.md §2 y BG1): plano ancho de apertura con los
   dos ejércitos, la cámara que baja sola al sitio de mando, un temblor cuando llega una carga y, en el primer choque, que se
   acerque a la línea y la siga. Solo mueve la cámara: no toca el simulador ni las figuras.
   Uso: const cine = crearCine({ THREE, camara, cam, ponCamara, S });
     cine.apertura(t?) tras colocar la cámara de mando (cam ya en su sitio): plano ancho y bajada (unos 5 s; un toque la acaba)
     cine.tick()       en cada cuadro, antes de dibujar (usa el reloj real: también corre en pausa)
     cine.toca()       el dedo toca el lienzo: acaba la apertura al instante
     cine.libre()      el jugador mueve la cámara: deja de seguir el choque
     cine.evento(e)    un momento del registro del simulador (choque, carga, carga-frenada, ruptura…)
   Coordenadas: X = x del simulador, Z = −y. */
const suave = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const QUIETO = 2.4, BAJADA = 3.2;          /* segundos del plano ancho y de la bajada hasta el mando */
const DESCANSO = 12;                       /* tras mover tú la cámara, tantos segundos sin que el cine la coja */

export function crearCine({ THREE, camara, cam, ponCamara, S }) {
  const reloj = () => performance.now() / 1000;
  let modo = 'mando', t0 = 0, tAnt = reloj(), temblor = 0, tLibre = -1e9, primer = true, siguiendo = null;
  const A = { p: new THREE.Vector3(), l: new THREE.Vector3() }, B = { p: new THREE.Vector3(), l: new THREE.Vector3() };
  const P = new THREE.Vector3(), L = new THREE.Vector3();
  const vivo = u => u.estado === 'firme' || u.estado === 'duda';

  /* el plano ancho: desde detrás y a un lado de Roma, bajo (unos 20 grados), con los dos ejércitos dentro */
  function planoAncho() {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const u of S.man) if (vivo(u)) { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x); z0 = Math.min(z0, -u.y); z1 = Math.max(z1, -u.y); }
    if (x0 > x1) return false;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ancho = Math.max(120, x1 - x0 + 40), hondo = Math.max(80, z1 - z0 + 40);
    const tanV = Math.tan(camara.fov * Math.PI / 360), tanH = tanV * camara.aspect;
    const d = Math.min(900, Math.max(ancho / 2 / tanH, hondo * 0.55 / tanV) * 0.92);
    const el = 0.42, lado = 0.22;          /* elevación y giro hacia la derecha (rad) */
    A.l.set(cx, 0, cz - hondo * 0.08);
    A.p.set(cx + Math.sin(lado) * Math.cos(el) * d, Math.sin(el) * d + 6, cz + Math.cos(lado) * Math.cos(el) * d);
    return true;
  }
  function poseMando(o) { ponCamara(); o.p.copy(camara.position); o.l.set(cam.x, 0, cam.z); }

  /* fijo: para las capturas de prueba, el plano se queda quieto en ese segundo de la apertura */
  let fijo = null;
  function apertura(t) { if (!planoAncho()) return; modo = 'apertura'; t0 = reloj(); fijo = typeof t === 'number' ? t : null; }
  function acabaApertura() { fijo = null; if (modo === 'apertura') { modo = 'mando'; ponCamara(); } }

  function centroLucha() {
    let x = 0, z = 0, n = 0;
    for (const u of S.man) if (vivo(u) && S.cont && S.cont[u.id] && S.cont[u.id].length) { x += u.x; z -= u.y; n++; }
    return n ? { x: x / n, z: z / n } : null;
  }

  function tick() {
    const ahora = reloj(), dt = Math.min(0.1, Math.max(0, ahora - tAnt)); tAnt = ahora;
    if (modo === 'apertura') {
      const t = fijo !== null ? fijo : ahora - t0;
      if (t >= QUIETO + BAJADA) acabaApertura();
      else {
        poseMando(B);
        /* quieto: un travelling lento de lado; luego baja con suavidad al sitio de mando */
        const desliza = (t / (QUIETO + BAJADA) - 0.5) * 40, k = suave((t - QUIETO) / BAJADA);
        P.copy(A.p); P.x += desliza; P.lerp(B.p, k); L.copy(A.l).lerp(B.l, k);
        camara.position.copy(P); camara.lookAt(L); camara.updateMatrixWorld();
      }
    }
    if (modo !== 'apertura') {
      if (siguiendo) {
        const c = centroLucha() || siguiendo.c;   /* sin lucha un momento (huyen unos), se queda donde estaba */
        if (ahora > siguiendo.hasta) siguiendo = null;
        else { siguiendo.c = c;
          const k = 1 - Math.exp(-dt * (ahora - siguiendo.t0 < 2.5 ? 1.4 : 0.8));
          cam.x += (c.x - cam.x) * k; cam.z += (c.z + 25 - cam.z) * k; cam.d += (siguiendo.d - cam.d) * k;
        }
      }
      ponCamara();
    }
    /* el temblor: unos centímetros por metro de distancia, que se apaga en medio segundo */
    if (temblor > 0.002) {
      const a = temblor * Math.max(0.25, camara.position.y * 0.006), w = ahora * 47;
      camara.position.x += Math.sin(w) * a; camara.position.y += Math.sin(w * 1.3 + 1) * a * 0.7; camara.position.z += Math.cos(w * 0.9) * a * 0.5;
      camara.updateMatrixWorld(); temblor *= Math.exp(-dt * 5);
    } else temblor = 0;
  }

  /* qué tan cerca de la cámara (0 lejos, 1 en el centro) cae un punto del campo */
  function cerca(x, z) { const d = Math.hypot(x - cam.x, z - cam.z); return Math.max(0, 1 - d / Math.max(150, cam.d * 1.2)); }

  function evento(e) {
    const u = e.id !== undefined ? S.man[e.id] : null, v = e.con !== undefined ? S.man[e.con] : null; if (!u) return;
    const x = v ? (u.x + v.x) / 2 : u.x, z = -(v ? (u.y + v.y) / 2 : u.y);
    if (e.tipo === 'carga' || e.tipo === 'carga-frenada') temblor = Math.max(temblor, (e.tipo === 'carga' ? 1 : 0.7) * (0.35 + 0.65 * cerca(x, z)));
    else if (e.tipo === 'choque') {
      temblor = Math.max(temblor, 0.55 * (0.3 + 0.7 * cerca(x, z)));
      /* el primer choque: si no estás moviendo tú la cámara, se acerca a la línea y la sigue un rato */
      if (primer && (u.lado === 0 || (v && v.lado === 0)) && reloj() - tLibre > DESCANSO) {
        primer = false; acabaApertura(); siguiendo = { t0: reloj(), hasta: reloj() + 40, d: Math.min(cam.d, 170), c: { x, z } };
      }
    } else if (e.tipo === 'ruptura' || e.tipo === 'desboque') temblor = Math.max(temblor, 0.4 * cerca(x, z));
  }

  return {
    apertura, tick, evento,
    toca() { acabaApertura(); },
    libre() { acabaApertura(); siguiendo = null; tLibre = reloj(); },
    get modo() { return modo === 'apertura' ? 'apertura' : siguiendo ? 'sigue' : 'mando'; },
    get temblor() { return temblor; }
  };
}
