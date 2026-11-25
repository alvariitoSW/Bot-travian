/* LP4 · Vista del oficial (diseño: gobierno/estudios/LP0-como-se-pelea-a-pie.md §3).
   Un pellizco hacia fuera (o el botón «Oficial») baja la cámara desde el plano de mando hasta el hombro del centurión,
   en el centro de la primera fila de tu manípulo (decisión del usuario, 23/11: «Centro de la primera fila»). Otro pellizco hacia dentro (o el botón
   «Arriba») vuelve. Solo cámara: desde abajo se sigue dibujando el frente en el suelo y las cuatro órdenes siguen vivas.
   Sin mareo: la bajada dura 1,4 s con arranque y llegada suaves; abajo la cámara no copia el paso ni el giro de cada
   hombre, sigue al centurión y al rumbo del bloque con retraso (0,3 s y 0,9 s). En vertical se abre el ángulo de visión.
   Escena: después de poner la vista de arriba en la cámara, llama a aplica(dt); la vista de arriba se mezcla con la del
   oficial. Mientras hay dos dedos (o hasta que se levantan todos tras un pellizco), libre() es false y no se dibuja.
   Contrato: crearCamara({ camara, lienzo, H, estado: () => S, hud, yo?, modo? }) → { aplica(dt), libre(), cerca(), pon(modo, ya), modo() }
     yo() → el hombre que eres (FU2, oficial.js); sin él, el centurión del centro de la primera fila.
     modo() → { duelo, techo, rival { x, z } | null } (FU2): en duelo, la cámara baja a la fila, sobre tu hombro, mirando al pecho
     del rival; con el techo del testudo cerrado, baja por debajo de los escudos. Los cambios duran 0,5 s, sin saltos.
     modo 'arriba' | 'oficial' · ?vista=oficial empieza abajo (capturas).
   Licencia de juego: el puesto exacto de la cámara, las duraciones y los ángulos. */
import { THREE } from '../../../js/gfx/models.js';

const DUR = 1.4, SIGUE = 0.3, GIRA = 0.9, UMBRAL = 1.22;
/* el ojo: detrás del hombre del centro de la primera fila, algo más alto que él; mira al suelo a 16 m, de frente */
const OF = { atras: 1.5, lado: 0, alto: 2.35, mira: 16, miraAlto: 0.2, dentro: 0, fovV: 78, fovH: 52 };
/* FU2: en duelo, sobre tu hombro, en la fila, mirando al pecho del rival (a 3–4 m); bajo el techo del testudo, más bajo que los escudos */
const DU = { atras: 1.1, lado: 0.45, alto: 1.7, pecho: 1.3, mira: 3.5, fovV: 50, fovH: 40 }, TE = { alto: 1.45, atras: 2.4, lado: 0.5, miraAlto: 1.6 }   /* bajo el techo: detrás de la 2.ª fila, entre dos columnas; los escudos de delante quedan arriba en el cuadro */, CAMBIO = 0.5;
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) }), de = a => ({ x: Math.cos(a), z: Math.sin(a) });
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
const suave = t => t * t * (3 - 2 * t);

export function crearCamara({ camara, lienzo, H, estado, hud, inicial = 'arriba', yo = null, modo = null }) {
  let meta = inicial === 'oficial' ? 1 : 0, t = meta, kd = 0, kt = 0;   /* kd: cuánto de duelo; kt: cuánto bajo el techo (0..1, en 0,5 s) */
  const O = { x: 0, z: 0, yaw: 0, listo: false, B: null, h: null };
  const P0 = new THREE.Vector3(), Q0 = new THREE.Quaternion(), ojo = new THREE.PerspectiveCamera();   /* cámara: lookAt mira por −z */

  /* ---------- el botón (lo crea este archivo: no toca index.html) ---------- */
  const st = document.createElement('style');
  st.textContent = `#vista{position:absolute;right:calc(env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 76px);height:44px;padding:0 13px 0 9px;display:flex;align-items:center;gap:5px;border-radius:22px;background:rgba(18,15,11,.82);border:1px solid rgba(184,134,43,.55);font-weight:600;font-size:13px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.4)}
#vista svg{width:20px;height:20px}
#vista.abajo{border-color:#e9c063;color:#e9c063}
#hud:has(#datos:not([hidden])) #vista{top:calc(env(safe-area-inset-top) + 130px)}
@media (orientation:landscape){#vista{top:calc(env(safe-area-inset-top) + 60px);right:calc(env(safe-area-inset-right) + 112px)}#hud:has(#datos:not([hidden])) #vista{top:calc(env(safe-area-inset-top) + 60px)}}`;
  document.head.appendChild(st);
  const boton = document.createElement('button'); boton.id = 'vista';
  const OJO = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>';
  const SUBE = '<svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/><path d="M12 8v12"/><path d="M4 4h16"/></svg>';
  const rotula = () => { const ab = meta > 0.5; boton.innerHTML = ab ? SUBE + 'Arriba' : OJO + 'Oficial'; boton.classList.toggle('abajo', ab); boton.setAttribute('aria-label', ab ? 'Volver a la vista de arriba' : 'Bajar a la vista del oficial'); };
  /* BT1: el toque cuenta al bajar el dedo (en Ásculo el clic se perdía entre la tira y el dedo que dibuja); el clic que le sigue no repite */
  let porDedo = false;   /* el clic que sigue a un dedo no repite (aunque llegue tarde, con la máquina lenta); el del teclado sí cuenta */
  boton.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); porDedo = true; pon(meta > 0.5 ? 'arriba' : 'oficial'); });
  boton.addEventListener('click', e => { e.stopPropagation(); if (porDedo) { porDedo = false; return; } pon(meta > 0.5 ? 'arriba' : 'oficial'); }); rotula();
  (hud || document.body).appendChild(boton);

  function pon(m, ya = false) { meta = m === 'oficial' ? 1 : 0; if (ya) t = meta; rotula(); }

  /* ---------- el pellizco: dos dedos que se abren (bajar) o se cierran (subir); uno solo por gesto ---------- */
  const dedos = new Map(); let d0 = 0, pellizco = false, usado = false;
  const dist = () => { const [a, b] = [...dedos.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  /* en captura: se cuenta el dedo antes de que dedos.js decida si dibuja */
  addEventListener('pointerdown', e => {
    if (e.target !== lienzo) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 2) { pellizco = true; usado = false; d0 = dist(); }
  }, true);
  addEventListener('pointermove', e => {
    const p = dedos.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
    if (dedos.size !== 2 || usado || d0 < 1) return;
    const r = dist() / d0;
    if (r > UMBRAL) { pon('oficial'); usado = true; } else if (r < 1 / UMBRAL) { pon('arriba'); usado = true; }
  }, true);
  const quita = e => { dedos.delete(e.pointerId); if (!dedos.size) pellizco = false; else if (dedos.size < 2) d0 = 0; };
  addEventListener('pointerup', quita, true); addEventListener('pointercancel', quita, true);
  /* en el ordenador: la rueda */
  addEventListener('wheel', e => { if (e.target === lienzo && Math.abs(e.deltaY) > 4) pon(e.deltaY < 0 ? 'oficial' : 'arriba'); }, { passive: true });

  /* ---------- el centurión: el del centro de la primera fila, vivo ---------- */
  function centurion(B) {
    if (O.h && O.h.vivo && O.B === B && O.h.fila === 0) return O.h;
    const mid = (B.cols - 1) / 2, lejos = h => Math.abs(h.col - mid);
    let m = null; for (const h of B.hombres) if (h.vivo && (!m || h.fila < m.fila || (h.fila === m.fila && lejos(h) < lejos(m)))) m = h;
    O.h = m; O.B = B; return m;
  }

  let tReal = performance.now();
  function aplica0(dt) {
    /* BT1: la bajada cuenta en tiempo real (con la máquina lenta el tiempo de juego casi no avanza y parecía que no bajaba); al congelar (dt grande), de golpe */
    const ahora = performance.now(), dr = dt >= 1 ? dt : Math.min(0.5, (ahora - tReal) / 1000); tReal = ahora;
    const v = meta > t ? 1 : -1; if (t !== meta) t = Math.min(1, Math.max(0, t + v * dr / DUR));
    const S = estado(), B = S && S.B; if (!B) return;
    const h = (yo && yo()) || centurion(B); if (!h) return;
    const M = modo ? modo() || {} : {}, va = (k, sí) => Math.min(1, Math.max(0, k + (sí ? 1 : -1) * dt / CAMBIO));
    kd = va(kd, !!M.duelo); kt = va(kt, !!M.techo);
    /* sigue al centurión y al rumbo del bloque con retraso; siempre, para que al bajar ya esté en su sitio */
    const rumbo = B.rumbo;
    if (!O.listo || O.Bref !== B) { O.x = h.x; O.z = h.z; O.yaw = rumbo; O.listo = true; O.Bref = B; }
    const k = 1 - Math.exp(-dt / SIGUE), ky = 1 - Math.exp(-dt / GIRA);
    O.x += (h.x - O.x) * k; O.z += (h.z - O.z) * k; O.yaw += angDif(rumbo, O.yaw) * ky;
    if (t <= 0) return;
    const F = fr(O.yaw), D = de(O.yaw), ed = suave(kd), et = suave(kt), mezcla = (a, b) => a + (b - a) * ed;
    const bajo = (v, w) => v + (w - v) * et, atras = bajo(mezcla(OF.atras, DU.atras), TE.atras), lado = bajo(mezcla(OF.lado, DU.lado), TE.lado), x = O.x - F.x * atras + D.x * lado, z = O.z - F.z * atras + D.z * lado;
    let alto = mezcla(OF.alto, DU.alto); alto += (Math.min(alto, TE.alto) - alto) * et;
    ojo.position.set(x, H(x, z) + alto, z);
    /* adónde mira: al suelo a 16 m o, en duelo, al pecho del rival (si no hay figura, 3,5 m delante) */
    const mx0 = O.x + (F.x - D.x * OF.dentro) * OF.mira, mz0 = O.z + (F.z - D.z * OF.dentro) * OF.mira;
    const R0 = M.rival || { x: O.x + F.x * DU.mira, z: O.z + F.z * DU.mira };
    if (O.rx === undefined || !ed) { O.rx = R0.x; O.rz = R0.z; } else { const kr = 1 - Math.exp(-dt / 0.25); O.rx += (R0.x - O.rx) * kr; O.rz += (R0.z - O.rz) * kr; }   /* al cambiar de rival, sin salto */
    const R = { x: O.rx, z: O.rz }, mx = mezcla(mx0, R.x), mz = mezcla(mz0, R.z);
    const my = mezcla(OF.miraAlto, DU.pecho); ojo.lookAt(mx, H(mx, mz) + my + (TE.miraAlto - my) * et, mz);   /* bajo el techo mira algo arriba: se ven los escudos de la fila de delante */
    const e = suave(t), fov1 = mezcla(camara.aspect < 1 ? OF.fovV : OF.fovH, camara.aspect < 1 ? DU.fovV : DU.fovH);
    P0.copy(camara.position); Q0.copy(camara.quaternion);
    camara.position.lerpVectors(P0, ojo.position, e); camara.quaternion.slerpQuaternions(Q0, ojo.quaternion, e);
    camara.fov = camara.fov + (fov1 - camara.fov) * e; camara.updateProjectionMatrix();
  }

  /* FU3c: cámara fija de prueba (capturas): fija({ p:[x,y,z], mira:[x,y,z], fov }) la pone ahí tras el cálculo normal; fija(null) la suelta. Solo la usan las pruebas */
  let fijo = null;
  function aplica(dt) {
    aplica0(dt);
    if (fijo) { camara.position.set(...fijo.p); camara.lookAt(...fijo.mira); if (fijo.fov) { camara.fov = fijo.fov; camara.updateProjectionMatrix(); } }
  }
  return { aplica, fija: p => { fijo = p; }, libre: () => !pellizco, cerca: () => t > 0.5, pon, modo: () => meta > 0.5 ? 'oficial' : 'arriba', t: () => t };
}
