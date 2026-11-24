/* ES3b · Tus tiradores en la escena del bloque (?formacion=combinada&tiradores=honderos|arqueros|velites). Solo pinta y engancha:
   las reglas (qué tiran, cuánto matan, cómo se retiran) están en js/tiro.js (montaTiradores, corre en Node) y el cuerpo es un
   bloque más del combate (S.apoyo), que dibuja tropas.js como a los demás hombres.
   Lo que añade a la pantalla (diseño: gobierno/estudios/ES1-escaramuza-combinada.md §3, §4 y §6):
     · su estandarte «Honderos 20» (el número es la munición) y su quinta ficha en la tira, con vida y munición;
     · con ellos elegidos, el arco de alcance dorado en el suelo; tocar un bloque rival lo marca como blanco: cinta hasta él
       (blanca si el tiro es directo, ámbar si es en parábola) y recuadro rojo. Todo en UNA malla de cintas (1 llamada);
     · las salvas con la física de bloque/fisica.js (ángulo bajo o alto de angulos(), 20 dibujados por salva de 40) y su estela
       (una sola malla para todas, 1 llamada: una cinta de cara a la cámara por proyectil en vuelo);
     · botones: «Tirar» pasa a «Alto el fuego» mientras tiran; el que conviene se ilumina; los avisos de tiro.js, arriba.
   Contrato: crearVista({ ctx, M, X }) → { tick(dt), salva(s), aviso(t), quita() }
     ctx: lo que la escena da a FORM.monta (THREE, escena, H, C, TR, FS, camara, proyecta, suelo, lienzo, Son, $) · M: mando · X: montaTiradores */
import { TIRADORES, eligeModo } from '../../../js/tiro.js';

const CSS = `
#borde-t{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 104px);transform:translateX(-50%);max-width:92vw;padding:4px 12px;border-radius:12px;background:rgba(18,15,11,.86);border:1px solid var(--ambar);font:700 12.5px Cinzel,Georgia,serif;color:#ffe0a0;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s}
#borde-t.ve{opacity:1}
.ficha small{white-space:nowrap}
.est.mun b{color:#ffe0a0}`;
const ORO = [0.91, 0.75, 0.39, 0.95], BLANCO = [1, 1, 1, 0.95], AMBAR = [1, 0.7, 0.2, 0.95], ROJO = [0.95, 0.2, 0.15, 0.95], GRIS = [0.7, 0.7, 0.7, 0.8];
const MARCAS_MAX = 700, ESTELAS_MAX = 220;

export function crearVista({ ctx, M, X }) {
  const { THREE, escena, H, TR, FS, camara, proyecta, suelo, lienzo, Son, $, C } = ctx;
  const S = C.S, T = X.T, b = X.b, Cf = TIRADORES[X.tipo];
  const estilo = document.createElement('style'); estilo.id = 'tiradores-css'; estilo.textContent = CSS; document.head.appendChild(estilo);

  /* ---------- una malla de cintas en el suelo: arco, cinta al blanco y recuadro ---------- */
  const pos = new Float32Array(MARCAS_MAX * 6 * 3), col = new Float32Array(MARCAS_MAX * 6 * 4), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); geo.setDrawRange(0, 0);
  const marcas = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  marcas.frustumCulled = false; marcas.renderOrder = 19; escena.add(marcas);
  let nv = 0;
  const vert = (x, z, c) => { if (nv >= MARCAS_MAX * 6) return; pos[nv * 3] = x; pos[nv * 3 + 1] = H(x, z) + 0.3; pos[nv * 3 + 2] = z; col.set(c, nv * 4); nv++; };
  /* una cinta de ancho w por los puntos P ([x, z]); dash: m de raya y de hueco (0 = continua) */
  function cinta(P, w, c, raya = 0, hueco = 0) {
    let acum = 0;
    for (let i = 0; i + 1 < P.length; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az); if (L < 1e-4) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz * w / 2, nz = ux * w / 2;
      if (raya && (acum % (raya + hueco)) >= raya) { acum += L; continue; }
      vert(ax + nx, az + nz, c); vert(bx + nx, bz + nz, c); vert(bx - nx, bz - nz, c); vert(ax + nx, az + nz, c); vert(bx - nx, bz - nz, c); vert(ax - nx, az - nz, c); acum += L;
    }
  }
  const vivoT = () => T.hombres > 0 && !T.roto && b.estado !== 'fuera';
  function pintaMarcas() {
    nv = 0;
    if (vivoT() && M.elegido === 'tiradores') {
      const f = { x: Math.sin(T.ang), z: -Math.cos(T.ang) }, arco = r => { const P = []; for (let i = 0; i <= 40; i++) { const a = T.ang + (i / 40 - 0.5) * 2.4; P.push([T.x + Math.sin(a) * r, T.z - Math.cos(a) * r]); } return P; };
      cinta(arco(Cf.alcance), 0.55, ORO); if (Cf.maximo > Cf.alcance) cinta(arco(Cf.maximo), 0.3, [ORO[0], ORO[1], ORO[2], 0.5], 1.2, 1.2);
      void f;
      const bl = X.blancoBloque();
      if (bl && bl.estado !== 'fuera' && bl.U.enPie > 0) {
        const cx = bl.x - Math.sin(bl.ang) * bl.fondo / 2, cz = bl.z + Math.cos(bl.ang) * bl.fondo / 2;
        const tuyos = S.bloques.filter(q => q.bando === 'r' && q !== b).map(q => ({ x: q.x - Math.sin(q.ang) * q.fondo / 2, z: q.z + Math.cos(q.ang) * q.fondo / 2, ang: q.ang, ancho: q.ancho, fondo: q.fondo }));
        const modo = eligeModo(X.tipo, { x: T.x, z: T.z }, { x: cx, z: cz }, tuyos), P = [];
        for (let i = 0; i <= 30; i++) P.push([T.x + (cx - T.x) * i / 30, T.z + (cz - T.z) * i / 30]);
        cinta(P, 0.5, modo === 'directo' ? BLANCO : modo === 'parabola' ? AMBAR : GRIS, modo === 'parabola' ? 1.6 : 0, 1.0);
        /* recuadro rojo alrededor del bloque marcado */
        const D = { x: Math.cos(bl.ang), z: Math.sin(bl.ang) }, F = { x: Math.sin(bl.ang), z: -Math.cos(bl.ang) }, hl = bl.ancho / 2 + 1.2, hp = bl.fondo / 2 + 1.2;
        const q = (l, p) => [cx + D.x * l + F.x * p, cz + D.z * l + F.z * p];
        cinta([q(-hl, -hp), q(hl, -hp), q(hl, hp), q(-hl, hp), q(-hl, -hp)], 0.5, ROJO);
      }
    }
    geo.setDrawRange(0, nv); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; marcas.visible = nv > 0;
  }

  /* ---------- las estelas: una cinta de cara a la cámara por proyectil en vuelo, todas en UNA malla ---------- */
  const ep = new Float32Array(ESTELAS_MAX * 4 * 3), ec = new Float32Array(ESTELAS_MAX * 4 * 4), ei = new Uint16Array(ESTELAS_MAX * 6), eg = new THREE.BufferGeometry();
  for (let i = 0; i < ESTELAS_MAX; i++) ei.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); eg.setAttribute('color', new THREE.BufferAttribute(ec, 4)); eg.setIndex(new THREE.BufferAttribute(ei, 1)); eg.setDrawRange(0, 0);
  const estelas = new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  estelas.frustumCulled = false; estelas.renderOrder = 6; escena.add(estelas);
  const COL_E = { piedra: [0.93, 0.9, 0.82], flecha: [0.95, 0.9, 0.78], jabalina: [0.95, 0.9, 0.78], pilum: [0.95, 0.9, 0.78] };
  function pintaEstelas() {
    let n = 0; const cp = camara.position;
    for (const p of FS.proyectiles) {
      if (n >= ESTELAS_MAX) break; if (p.fi && p.fi.modo !== 'vuela') continue;
      const v = p.v, sp = Math.hypot(v[0], v[1], v[2]); if (sp < 3) continue;
      const dx = v[0] / sp, dy = v[1] / sp, dz = v[2] / sp, L = Math.min(5, 0.14 * sp), hx = p.p[0], hy = p.p[1], hz = p.p[2];
      const tx = hx - dx * L, ty = hy - dy * L, tz = hz - dz * L;
      let sx = dy * (hz - cp.z) - dz * (hy - cp.y), sy = dz * (hx - cp.x) - dx * (hz - cp.z), sz = dx * (hy - cp.y) - dy * (hx - cp.x);   /* dir × (cabeza − cámara) */
      const sl = Math.hypot(sx, sy, sz) || 1, w = p.tipo === 'piedra' ? 0.16 : 0.1; sx = sx / sl * w; sy = sy / sl * w; sz = sz / sl * w;
      const k = n * 12, c = COL_E[p.tipo] || COL_E.flecha, a = n * 16;
      ep[k] = tx + sx; ep[k + 1] = ty + sy; ep[k + 2] = tz + sz; ep[k + 3] = hx + sx; ep[k + 4] = hy + sy; ep[k + 5] = hz + sz;
      ep[k + 6] = hx - sx; ep[k + 7] = hy - sy; ep[k + 8] = hz - sz; ep[k + 9] = tx - sx; ep[k + 10] = ty - sy; ep[k + 11] = tz - sz;
      const al = [0, 0.75, 0.75, 0];
      for (let j = 0; j < 4; j++) { ec[a + j * 4] = c[0]; ec[a + j * 4 + 1] = c[1]; ec[a + j * 4 + 2] = c[2]; ec[a + j * 4 + 3] = al[j]; }
      n++;
    }
    eg.setDrawRange(0, n * 6); eg.attributes.position.needsUpdate = true; eg.attributes.color.needsUpdate = true; estelas.visible = n > 0;
  }

  /* ---------- la salva se ve volar con la física ---------- */
  let azar = 12345; const rnd = () => { azar = (azar * 16807) % 2147483647; return (azar - 1) / 2147483646; };
  function salva(s) {
    if (!FS || !FS.activa || !s.a) return;
    const men = TR.figs.filter(f => f.b === s.a), nd = Math.max(1, Math.ceil(s.n / 2));   /* 20 dibujados de cada 40 */
    const punto = () => { if (!men.length) { const c = { x: s.a.x, z: s.a.z }; return c; } const f = men[Math.floor(rnd() * men.length)]; return { x: f.x + (rnd() - 0.5) * 1.6, z: f.z + (rnd() - 0.5) * 1.6 }; };
    FS.salva(s.de, s.a, nd, s.vuelo, s.proyectil, punto, { v: s.v, alto: s.modo === 'parabola' });
    TR.lanzan(s.de, S.T);
    try { Son.salva && Son.salva(Math.min(2.5, s.vuelo)); } catch (e) { /* sin sonido */ }
  }

  /* ---------- avisos en el borde ---------- */
  const borde = document.createElement('div'); borde.id = 'borde-t'; $('hud').appendChild(borde); let tAviso = 0;
  function aviso(t) { borde.textContent = t; borde.classList.add('ve'); tAviso = 3.2; }

  /* ---------- su estandarte, tocable ---------- */
  const est = document.createElement('div'); est.className = 'est r'; est.innerHTML = '<i></i><s></s><b></b>'; $('ests').appendChild(est);
  est.style.pointerEvents = 'auto'; est.addEventListener('pointerdown', e => e.stopPropagation()); est.addEventListener('click', e => { e.stopPropagation(); M.elige('tiradores'); });
  const estB = est.querySelector('b'); let estT = '', estC = '';

  /* ---------- tocar un bloque rival con los tiradores elegidos: blanco ---------- */
  let dedo = null;
  const onDown = e => { dedo = e.target === lienzo ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, lejos: false } : null; };
  const onMove = e => { if (dedo && e.pointerId === dedo.id && Math.hypot(e.clientX - dedo.x, e.clientY - dedo.y) > 14) dedo.lejos = true; };
  const onUp = e => {
    const d = dedo; dedo = null; if (!d || d.id !== e.pointerId || d.lejos || e.timeStamp - d.t > 400 || M.elegido !== 'tiradores') return;
    const p = suelo(e.clientX, e.clientY); if (!p) return;
    let mejor = null, dm = 5;
    for (const q of S.bloques) {
      if (q.bando !== 'g' || q.estado === 'fuera' || q.U.enPie <= 0) continue;
      const cx = q.x - Math.sin(q.ang) * q.fondo / 2, cz = q.z + Math.cos(q.ang) * q.fondo / 2, dx = p.x - cx, dz = p.z - cz;
      const l = Math.abs(dx * Math.cos(q.ang) + dz * Math.sin(q.ang)), pr = Math.abs(dx * Math.sin(q.ang) - dz * Math.cos(q.ang));
      const out = Math.hypot(Math.max(0, l - q.ancho / 2), Math.max(0, pr - q.fondo / 2)); if (out < dm) { dm = out; mejor = q; }
    }
    if (mejor) { X.marca(mejor); try { Son.toque && Son.toque(); } catch (err) { /* sin sonido */ } }
  };
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);

  /* ---------- cada fotograma ---------- */
  let base = null;
  function tick(dt) {
    pintaMarcas(); pintaEstelas();
    if (tAviso > 0 && (tAviso -= dt) <= 0) borde.classList.remove('ve');
    /* en marcha por un hueco, la columna se estrecha (los hombres se aprietan); parados, abren la línea */
    if (b.vis) {
      if (base == null) base = b.vis.sx; const paso = T.orden === 'retirarse' || (T.orden === 'hostigar' && T.hostiga && !T.hostiga.salio) || (T.orden === 'hostigar' && T.hostiga && T.hostiga.fase === 'vuelve');
      const meta = paso ? Math.min(base, 0.7) : base; b.vis.sx += (meta - b.vis.sx) * Math.min(1, dt * 3);
    }
    /* estandarte: «Honderos 20» */
    const [px, py, vis] = proyecta(T.x, 3.6, T.z);
    if (!vis || b.estado === 'fuera') est.style.display = 'none';
    else {
      est.style.display = ''; est.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%)`;
      const t = Cf.nombre + ' ' + T.municion + (T.roto ? ' · huyen' : ''), c = T.roto ? 'rojo' : (T.municion <= 0 || T.hombres < 20) ? 'ambar' : 'verde';
      if (t !== estT) { estB.textContent = t; estT = t; } if (c !== estC) { est.classList.remove('verde', 'ambar', 'rojo'); est.classList.add(c); estC = c; }
    }
    /* la ficha: hombres y munición */
    const fi = document.querySelector('#tira .ficha[data-id="tiradores"] small'), txt = T.hombres + ' · ' + T.municion + '▪';
    if (fi && fi.textContent !== txt) fi.textContent = txt;
    /* los botones, solo con los tiradores elegidos */
    if (M.elegido === 'tiradores') {
      const u = X.util();
      for (const el of document.querySelectorAll('.orden')) {
        const o = el.dataset.o; if (!['tirar', 'hostigar', 'retirarse', 'alto'].includes(o)) continue;
        const vig = (o === 'tirar' && T.orden === 'tirar') || (o === 'hostigar' && T.orden === 'hostigar') || (o === 'retirarse' && T.orden === 'retirarse');
        const apaga = T.roto || T.hombres <= 0 || (o === 'hostigar' && T.municion <= 0);
        el.classList.toggle('vigente', vig && o !== 'tirar'); el.classList.toggle('luz', !!u && o === u); el.classList.toggle('apagada', apaga);
        if (o === 'tirar') { const bt = el.querySelector('b'), t = T.orden === 'tirar' ? 'Alto el fuego' : 'Tirar'; if (bt && bt.textContent !== t) { bt.textContent = t; el.setAttribute('aria-label', t); } }
      }
    }
  }
  function quita() {
    removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp);
    for (const m of [marcas, estelas]) { escena.remove(m); m.geometry.dispose(); m.material.dispose(); }
    est.remove(); borde.remove(); estilo.remove();
  }
  return { tick, salva, aviso, quita, marcas, estelas };
}
