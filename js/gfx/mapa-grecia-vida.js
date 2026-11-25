/* AQVILA · AM2 — mapa vivo de Grecia: lo que vive sobre el suelo. Polis (de lejos, un caserío grande que se ve a cualquier altura;
   de cerca, sus calles y sus casas una a una), puertos, humo, barcos por sus rutas, rebaños y nubes altas.
   Niveles de detalle: cada cosa se enciende solo a la altura a la que se distingue, y casi todo va por ejemplares (pocas llamadas).
   Arte: templo, casas de lejos, barcos, olivos y cipreses son de 0 A.D. (Wildfire Games, CC BY-SA 3.0) por js/gfx/statics.js.
   Casas de cerca, calles, humo, ovejas, nubes y dibujos a tinta: propios, hechos aquí. */
import { THREE } from './models.js';
import { preloadStatic, staticMesh } from './statics.js';
import { POLIS, X, Z } from './mapa-grecia-datos.js';
import { KY_CERCA, XI, ZN, ANCHO, FONDO } from './mapa-grecia-suelo.js';
import RUTAS from '../../assets/mapa-grecia/rutas.js';

const clamp = (x, a, b) => x < a ? a : x > b ? b : x, mix = (a, b, t) => a + (b - a) * t;
const paso = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function azar(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const MUROS = ['#efe6d0', '#e4d6b4', '#d9c8a2', '#f3ecdc', '#cdb890'], TEJ = ['#b99a5e', '#a98848', '#c2a868', '#b3855a', '#a06a44', '#978c70'];   // adobe encalado; paja, barro y alguna teja
const E = 0.019;             // escala del caserío de lejos (modelos de 0 A.D.)
const M = 2.6e-4;            // escala de cerca: 1 m de modelo = 2,6 m de mapa (las casas se agrandan para leerse en el móvil)
const A_CASAS = 3.4, A_PLANO = 9;   // por debajo de estos anchos de pantalla (decenas de km) se ven las casas / el plano de calles

function mancha(color, borde) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, color); r.addColorStop(borde || 0.5, color.replace(/[\d.]+\)$/, '0.45)')); r.addColorStop(1, color.replace(/[\d.]+\)$/, '0)')); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

/* ---------- trazado de una polis: ágora, calles que salen de ella, casas a los lados ---------- */
export function trazar(p, alt, casasMax, radio, semilla) {
  const rnd = azar(semilla), cx = p.x !== undefined ? p.x : X(p.lon), cz = p.z !== undefined ? p.z : Z(p.lat), R = radio, calles = [], casas = [], nR = 6 + (rnd() * 3 | 0), giro = rnd() * 6.28;
  const seco = (x, z) => alt(x, z) > 1.5, ocup = new Map(), celda = 0.0045, clave = (x, z) => Math.round(x / celda) + ',' + Math.round(z / celda);
  const agora = { x: cx + (rnd() - 0.5) * R * 0.1, z: cz + (rnd() - 0.5) * R * 0.1, r: R * 0.12 };
  const acro = { x: agora.x + Math.cos(giro + 2.4) * R * 0.3, z: agora.z + Math.sin(giro + 2.4) * R * 0.3, r: R * 0.13 };
  /* calles radiales, con quiebros */
  const radiales = [];
  for (let i = 0; i < nR; i++) { let a = giro + i / nR * 6.283 + (rnd() - 0.5) * 0.5, x = agora.x + Math.cos(a) * agora.r * 0.8, z = agora.z + Math.sin(a) * agora.r * 0.8; const L = R * (0.75 + rnd() * 0.45), pts = [[x, z]], pasoL = R * 0.11;
    for (let s = 0; s < L; s += pasoL) { a += (rnd() - 0.5) * 0.38; const nx = x + Math.cos(a) * pasoL, nz = z + Math.sin(a) * pasoL; if (!seco(nx, nz)) break; x = nx; z = nz; pts.push([x, z]); }
    if (pts.length > 2) { calles.push({ p: pts, w: 1.3 }); radiales.push(pts); } }
  /* dos rondas que las unen */
  for (const f of [0.42, 0.78]) { const pts = []; for (const r of radiales) { const q = r[Math.min(r.length - 1, Math.round((r.length - 1) * f))]; if (q) pts.push([q[0] + (rnd() - 0.5) * R * 0.03, q[1] + (rnd() - 0.5) * R * 0.03]); }
    if (pts.length > 2) { pts.push(pts[0]); calles.push({ p: pts, w: 1 }); } }
  /* casas a los dos lados de cada calle, más apretadas cerca del ágora */
  const pon = (x, z, ang, tam) => { if (!seco(x, z)) return false; const dA = Math.hypot(x - agora.x, z - agora.z), dT = Math.hypot(x - acro.x, z - acro.z); if (dA < agora.r * 1.25 || dT < acro.r * 1.1) return false;
    const k = clave(x, z); if (ocup.has(k)) return false; for (const o of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = ocup.get(Math.round(x / celda + o[0]) + ',' + Math.round(z / celda + o[1])); if (q && Math.hypot(q[0] - x, q[1] - z) < celda * 0.92) return false; }
    ocup.set(k, [x, z]); casas.push({ x, z, ang, w: tam * (0.85 + rnd() * 0.5), d: tam * (0.7 + rnd() * 0.3), h: tam * (0.42 + rnd() * 0.22), t: rnd(), u: rnd() }); return true; };
  const tam = 0.0036;
  for (let vuelta = 0; vuelta < 3 && casas.length < casasMax; vuelta++) for (const c of calles) { const P = c.p; for (let i = 0; i < P.length - 1 && casas.length < casasMax; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ang = Math.atan2(ux, uz);
    for (let s = celda * 0.5; s < L; s += celda * (1 + vuelta * 0.15)) for (const lado of [1, -1]) { const dist = Math.hypot(a[0] + ux * s - agora.x, a[1] + uz * s - agora.z) / R; if (rnd() < dist * 0.55 - 0.1 + vuelta * 0.1) continue;
      const off = (0.0012 * c.w + tam * 0.55 + vuelta * celda * 0.95) * lado; pon(a[0] + ux * s - uz * off, a[1] + uz * s + ux * off, ang + (lado > 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, tam); } } }
  return { cx, cz, R, agora, acro, calles, casas, color: p.color || '#8c6a3d' };
}

/* el plano de la polis pintado en una textura: tierra pisada, calles, ágora y (en la carta) las casas dibujadas a tinta */
function pintarPlano(T, estilo, lado) {
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), k = N / lado, px = (x, z) => [(x - T.cx + lado / 2) * k, (z - T.cz + lado / 2) * k], B = estilo === 'b';
  g.lineCap = g.lineJoin = 'round';
  /* suelo del caserío: tierra clara pisada (un borrón por casa: sigue la forma real del pueblo) */
  g.fillStyle = B ? 'rgba(236,222,186,.5)' : 'rgba(205,184,140,.42)'; for (const h of T.casas) { const q = px(h.x, h.z); g.beginPath(); g.arc(q[0], q[1], 0.0052 * k, 0, 7); g.fill(); }
  { const q = px(T.agora.x, T.agora.z); g.beginPath(); g.arc(q[0], q[1], T.agora.r * 1.5 * k, 0, 7); g.fill(); }
  const traza = (P) => { g.beginPath(); P.forEach((q, i) => { const a = px(q[0], q[1]); i ? g.lineTo(a[0], a[1]) : g.moveTo(a[0], a[1]); }); g.stroke(); };
  for (const cl of T.calles) { g.strokeStyle = B ? 'rgba(74,47,28,.55)' : 'rgba(110,88,58,.55)'; g.lineWidth = 0.0023 * cl.w * k; traza(cl.p); }
  for (const cl of T.calles) { g.strokeStyle = B ? '#f1e3bd' : '#dcc898'; g.lineWidth = 0.0015 * cl.w * k; traza(cl.p); }
  /* ágora: explanada clara con su borde */
  { const q = px(T.agora.x, T.agora.z), r = T.agora.r * k; g.fillStyle = B ? '#f4e8c8' : '#e2d2a6'; g.strokeStyle = B ? '#4a2f1c' : 'rgba(110,88,58,.7)'; g.lineWidth = B ? 2 : 3; g.beginPath(); g.arc(q[0], q[1], r, 0, 7); g.fill(); g.stroke();
    const rr = azar(T.casas.length * 7 + 3); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + rr() * 0.4, d = r * (0.5 + rr() * 0.3), x = q[0] + Math.cos(a) * d, y = q[1] + Math.sin(a) * d, w = r * 0.2; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = B ? '#3a2416' : 'rgba(40,30,20,.3)'; g.fillRect(-w / 2 + 2, -w / 3 + 2, w, w * 0.66); g.fillStyle = ['#c9553f', '#e9dcb8', '#b7791f', '#f2e6c8'][i % 4]; g.fillRect(-w / 2, -w / 3, w, w * 0.66); g.restore(); }
    g.fillStyle = B ? '#4a2f1c' : '#bfb49a'; g.beginPath(); g.arc(q[0], q[1], r * 0.12, 0, 7); g.fill(); }
  /* peña de la acrópolis */
  { const q = px(T.acro.x, T.acro.z), r = T.acro.r * k, gr = g.createRadialGradient(q[0] - r * 0.2, q[1] - r * 0.2, r * 0.1, q[0], q[1], r * 1.25); gr.addColorStop(0, B ? '#e9dcb8' : '#cfc3a8'); gr.addColorStop(0.75, B ? '#c9b68c' : '#a39880'); gr.addColorStop(1, B ? 'rgba(120,90,60,0)' : 'rgba(90,80,64,0)'); g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], r * 1.25, 0, 7); g.fill();
    if (B) { g.strokeStyle = '#4a2f1c'; g.lineWidth = 2; g.beginPath(); g.arc(q[0], q[1], r, 0.6, 5.2); g.stroke(); g.fillStyle = '#f7efd8'; g.fillRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.6); g.strokeRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.6); g.fillStyle = T.color; g.fillRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.18); g.strokeRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.18); } }
  /* casas: en A, su sombra en el suelo; en B, la casa entera dibujada a tinta, con el tejado del color de la polis en algunas */
  for (const h of T.casas) { const q = px(h.x, h.z); g.save(); g.translate(q[0], q[1]); g.rotate(-h.ang); const w = h.w * k, d = h.d * k;
    if (B) { g.fillStyle = h.t < 0.18 ? T.color : h.t < 0.6 ? '#c9a070' : '#e6d6ae'; g.strokeStyle = '#3a2416'; g.lineWidth = 1.6; g.fillRect(-w / 2, -d / 2, w, d); g.strokeRect(-w / 2, -d / 2, w, d); g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.stroke(); }
    else { g.rotate(h.ang); g.fillStyle = 'rgba(40,30,20,.34)'; g.translate(h.h * k * 0.75, h.h * k * 0.6); g.rotate(-h.ang); g.fillRect(-w / 2, -d / 2, w, d); }
    g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t;
}

/* material que tiende un plano pintado sobre el relieve (lee la textura de alturas, como el suelo) */
function materialTendido(com, tex) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: Object.assign({ tPlano: { value: tex }, uOp: { value: 1 } }, com),
    vertexShader: 'uniform sampler2D tAlt; uniform vec4 uMarco; uniform float uKy, uPx; varying vec2 vUv; varying vec2 vP; void main(){ vUv = uv; vec2 p = (modelMatrix * vec4(position, 1.0)).xz; vP = p; float a = texture2D(tAlt, clamp((p - uMarco.xy) * uMarco.zw, 0.0003, 0.9997)).r; gl_Position = projectionMatrix * viewMatrix * vec4(p.x, max(a, 0.0) * uKy + uPx * 0.8, p.y, 1.0); }',
    fragmentShader: 'uniform sampler2D tPlano, tRuido; uniform float uOp, uNubes, t; varying vec2 vUv; varying vec2 vP; void main(){ vec4 c = texture2D(tPlano, vUv); float n = texture2D(tRuido, vP * 0.011 + vec2(t * 0.0042, t * 0.0017)).b, m = texture2D(tRuido, vP * 0.031 - vec2(t * 0.003, -t * 0.002)).b; c.rgb *= 1.0 - uNubes * smoothstep(0.50, 0.66, n * 0.7 + m * 0.3); gl_FragColor = vec4(c.rgb, c.a * uOp); }' });
}

/* una casa sencilla: muros y tejado a dos aguas (o azotea), en dos piezas para darles color aparte */
function geoCasa() {
  const muro = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const t = new THREE.BufferGeometry(), v = [-0.56, 1, -0.56, 0.56, 1, -0.56, 0.56, 1, 0.56, -0.56, 1, 0.56, -0.56, 1.5, 0, 0.56, 1.5, 0];
  t.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); t.setIndex([0, 4, 5, 0, 5, 1, 3, 2, 5, 3, 5, 4, 0, 3, 4, 1, 5, 2]); t.computeVertexNormals();
  return { muro, tejado: t.toNonIndexed() };
}

export class Vida {
  constructor(mapa) { this.m = mapa; this.g = new THREE.Group(); mapa.escena.add(this.g); this.vivos = []; this.polis = []; this.est = 'a'; this.rnd = azar(7); this._esc = 1; }
  async iniciar() {
    await preloadStatic(['grie_templo', 'grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_casa_d', 'grie_casa_e', 'grie_trirreme', 'barco', 'olivo', 'cipres']);
    this.tHumoA = mancha('rgba(235,228,214,1)'); this.tHumoB = mancha('rgba(90,70,54,1)'); this.tEstela = mancha('rgba(255,255,255,1)', 0.3);
    this.geo = geoCasa(); this.matMuro = new THREE.MeshLambertMaterial({ color: '#ffffff' }); this.matTejado = new THREE.MeshLambertMaterial({ color: '#ffffff' }); const alt = this.m.rel.altura;
    for (const p of POLIS) this.polis.push(this._polis(p, alt));
    this._barcos(); this._rebanos(); this._nubes(); this._arboles();
  }

  /* ---------- una polis ---------- */
  _polis(p, alt) {
    const rnd = this.rnd, P = { p, x: X(p.lon), z: Z(p.lat) }, com = this.m.com;
    /* de lejos (A): caserío grande de 0 A.D., como en la maqueta */
    const lejos = new THREE.Group(), m = new THREE.Group(); m.scale.setScalar(E); lejos.add(m);
    const base = new THREE.Mesh(new THREE.CircleGeometry(44, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: mancha('rgba(226,206,160,1)', 0.7), transparent: true, depthWrite: false, opacity: 0.8 })); base.position.y = 0.6; m.add(base);
    const roca = new THREE.Mesh(new THREE.CylinderGeometry(15, 21, 7, 9), new THREE.MeshLambertMaterial({ color: '#cfc4a8' })); roca.position.y = 4; m.add(roca);
    const tp = staticMesh('grie_templo', p.color); if (tp) { tp.position.y = 9.5; tp.rotation.y = 0.5; tp.scale.setScalar(0.9); m.add(tp); }
    const nc = p.pri === 1 ? 16 : 12, mu = new THREE.InstancedMesh(this.geo.muro, this.matMuro, nc), te = new THREE.InstancedMesh(this.geo.tejado, this.matTejado, nc), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    for (let i = 0; i < nc; i++) { const a = i / nc * Math.PI * 2 + rnd() * 0.4, r = 22 + (i % 3) * 8 + rnd() * 4; v.set(Math.cos(a) * r, 0.6, Math.sin(a) * r); q.setFromAxisAngle(eje, -a + Math.PI / 2 + (rnd() - 0.5) * 0.6); s.set(9 + rnd() * 4, 5 + rnd() * 2, 7 + rnd() * 2); m4.compose(v, q, s); mu.setMatrixAt(i, m4); te.setMatrixAt(i, m4);
      mu.setColorAt(i, col.set(MUROS[(rnd() * 5) | 0])); te.setColorAt(i, col.set(['#d9b98a', '#cfa070', '#e2cba0', '#c98f66'][(rnd() * 4) | 0])); }
    mu.frustumCulled = te.frustumCulled = false; m.add(mu, te);
    lejos.position.set(P.x, 0, P.z); this.g.add(lejos); P.lejos = lejos;
    /* de lejos (B): la ciudad dibujada a tinta */
    const sello = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconoCiudad(p), transparent: true, depthWrite: false })); sello.center.set(0.5, 0.08); sello.renderOrder = 5; sello.position.set(P.x, 0, P.z); this.g.add(sello); P.sello = sello;
    /* de cerca: plano de calles tendido sobre el relieve y casas una a una (la polis y, si tiene, su puerto) */
    const R = 0.05 + p.casas / 300 * 0.032; P.R = R; P.barrios = [this._barrio(p, alt, p.casas, R, POLIS.indexOf(p) * 97 + 11, true)];
    if (p.puerto) { /* el puerto: un caserío en la tierra firme más cercana al fondeadero */
      let px = X(p.puerto[0]), pz = Z(p.puerto[1]), mejor = null; for (let r = 0; r < 0.2 && !mejor; r += 0.012) for (let k = 0; k < 16; k++) { const an = k / 16 * 6.283, x = px + Math.cos(an) * r, z = pz + Math.sin(an) * r; if (alt(x, z) > 4 && this.m.rel.costaKm(x, z) > 0.2) { mejor = [x, z]; break; } }
      if (mejor) { const b = this._barrio({ x: mejor[0], z: mejor[1], color: p.color }, alt, 30, 0.024, POLIS.indexOf(p) * 131 + 5, false); if (b.T.casas.length > 3) P.barrios.push(b); } }
    /* humo de los hogares */
    P.humo = new THREE.Group(); P.humo.position.set(P.x, 0, P.z); this.g.add(P.humo); P.humos = [];
    for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tHumoA, transparent: true, depthWrite: false, opacity: 0 })); s.renderOrder = 6; P.humo.add(s); P.humos.push({ s, f: i / 6, vx: 0.5 + rnd() * 0.3, o: i < 4 ? [8, 16, -6] : [-22, 10, 14], tam: i < 4 ? 1 : 0.7 }); }
    return P;
  }
  _barrio(p, alt, casas, R, semilla, conTemplo) {
    const T = trazar(p, alt, casas, R, semilla), lado = R * 2.9, B = { T, lado, tex: {} };
    B.plano = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado, 24, 24).rotateX(-Math.PI / 2), materialTendido(this.m.com, null)); B.plano.position.set(T.cx, 0, T.cz); B.plano.renderOrder = 2; B.plano.frustumCulled = false; B.plano.visible = false; this.g.add(B.plano);
    const n = T.casas.length, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const muros = new THREE.InstancedMesh(this.geo.muro, this.matMuro, n), tej = new THREE.InstancedMesh(this.geo.tejado, this.matTejado, n);
    T.casas.forEach((h, i) => { v.set(h.x, Math.max(0, alt(h.x, h.z)) * KY_CERCA, h.z); q.setFromAxisAngle(eje, h.ang); s.set(h.w, h.h, h.d); m4.compose(v, q, s); muros.setMatrixAt(i, m4); tej.setMatrixAt(i, m4);
      muros.setColorAt(i, col.set(MUROS[(h.t * 5) | 0])); tej.setColorAt(i, col.set(TEJ[(h.u * 6) | 0])); });
    for (const im of [muros, tej]) { im.frustumCulled = false; im.visible = false; this.g.add(im); } B.muros = muros; B.tejados = tej;
    if (conTemplo) { const g = new THREE.Group(), y = Math.max(0, alt(T.acro.x, T.acro.z)) * KY_CERCA; g.position.set(T.acro.x, y, T.acro.z);
      const roca = new THREE.Mesh(new THREE.CylinderGeometry(T.acro.r * 0.8, T.acro.r * 1.05, 0.0026, 10), new THREE.MeshLambertMaterial({ color: '#b3a88f' })); roca.position.y = 0.0013; g.add(roca);
      const tp = staticMesh('grie_templo', p.color); if (tp) { tp.scale.setScalar(M * 1.25); tp.position.y = 0.0026 + 5 * M * 1.25; tp.rotation.y = 0.5; g.add(tp); }
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, c = staticMesh(i % 2 ? 'olivo' : 'cipres'); if (c) { c.scale.setScalar(M * (i % 2 ? 1.5 : 2)); c.position.set(Math.cos(a) * T.acro.r * 1.25, -0.0002, Math.sin(a) * T.acro.r * 1.25); g.add(c); } }
      g.visible = false; this.g.add(g); B.acro = g; }
    return B;
  }

  /* ---------- barcos por las rutas del mar ---------- */
  _barcos() {
    this.barcos = []; const lista = [];
    RUTAS.forEach((r, ri) => { const pts = r.l.map(q => new THREE.Vector3(X(q[0]), 0, Z(q[1]))), lon = [0]; for (let i = 1; i < pts.length; i++) lon.push(lon[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const total = lon[lon.length - 1], cuantos = total > 30 ? 2 : 1; for (let b = 0; b < cuantos; b++) lista.push({ pts, lon, total, s: ((b / cuantos + ri * 0.137) % 1) * total, sentido: b % 2 ? -1 : 1, ri, guerra: ri % 3 === 0 }); });
    const n = lista.length, casco = new THREE.BufferGeometry();
    casco.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.07, 0.5, 0, 0.1, -0.5, -0.13, 0.07, -0.05, 0.13, 0.07, -0.05, 0, -0.03, 0, -0.1, 0.07, -0.42, 0.1, 0.07, -0.42], 3)); casco.setIndex([0, 2, 4, 0, 4, 3, 2, 5, 4, 3, 4, 6, 5, 1, 4, 1, 6, 4, 0, 3, 2, 2, 3, 6, 2, 6, 5, 5, 6, 1]); casco.computeVertexNormals();
    const vela = new THREE.PlaneGeometry(0.42, 0.34).translate(0, 0.32, 0.06), palo = new THREE.PlaneGeometry(0.02, 0.5).translate(0, 0.3, 0.05).rotateY(Math.PI / 2), estela = new THREE.PlaneGeometry(0.34, 1.3).rotateX(-Math.PI / 2).translate(0, 0.004, -0.95);
    const I = (g, mat) => { const im = new THREE.InstancedMesh(g, mat, n); im.frustumCulled = false; this.g.add(im); return im; };
    this.bCascos = I(casco, new THREE.MeshLambertMaterial({ color: '#7a5230' })); this.bVelas = I(vela, new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide })); this.bEstelas = I(estela, new THREE.MeshBasicMaterial({ map: this.tEstela, transparent: true, opacity: 0.5, depthWrite: false })); this.bEstelas.renderOrder = 2;
    this.bDib = I(new THREE.PlaneGeometry(1.5, 1.5).translate(0, 0.45, 0), new THREE.MeshBasicMaterial({ map: iconoBarco(0), transparent: true, depthWrite: false })); this.bDib.renderOrder = 5;
    const col = new THREE.Color(); lista.forEach((b, i) => { this.bVelas.setColorAt(i, col.set(b.guerra ? '#c9553f' : i % 2 ? '#f2e6c8' : '#e2d2a8')); b.modelo = null; this.barcos.push(b); });
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._eje = new THREE.Vector3(0, 1, 0); this._cero = new THREE.Matrix4().makeScale(0, 0, 0);
  }
  /* ---------- árboles de cerca: pinos y encinas con volumen, solo alrededor de la cámara (se recolocan al moverse) ---------- */
  _arboles() {
    const N = 2200, pino = new THREE.ConeGeometry(0.5, 1.6, 5, 1, true).translate(0, 0.9, 0), copa = new THREE.OctahedronGeometry(0.66, 0).scale(1, 0.8, 1).translate(0, 0.6, 0), mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const I = g => { const im = new THREE.InstancedMesh(g, mat, N); im.count = 0; im.frustumCulled = false; im.visible = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.g.add(im); return im; };
    this.arb = { pinos: I(pino), copas: I(copa), N, clave: '', col: new THREE.Color() };
  }
  _plantar(w, h) {
    const m = this.m, A = this.arb, upx = m.V.upx, ver = this.est === 'a' && m.ancho < 0.75; A.pinos.visible = A.copas.visible = ver; if (!ver) return;
    const paso = 0.0034, rx = w * upx * 0.62, rz = h * upx * 0.95, cx = Math.round(m.V.x / (rx * 0.25)), cz = Math.round(m.V.z / (rz * 0.25)), clave = cx + ',' + cz + ',' + Math.round(Math.log2(upx) * 3); if (clave === A.clave) return; A.clave = clave;
    const alt = m.rel.altura, masc = m.masc, m4 = this._m4, q = this._q, s = this._s, v = new THREE.Vector3(), x0 = Math.floor((m.V.x - rx) / paso), x1 = Math.ceil((m.V.x + rx) / paso), z0 = Math.floor((m.V.z - rz * 1.25) / paso), z1 = Math.ceil((m.V.z + rz * 0.75) / paso); let np = 0, nc = 0;
    const dado = (i, j, k) => { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + k * 974711; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const PINO = ['#4f7340', '#5a8048', '#456838'], COPA = ['#5a7a3c', '#6b8a46', '#4d6c36', '#7a8f4e'];
    for (let j = z0; j <= z1; j++) for (let i = x0; i <= x1; i++) { const x = (i + dado(i, j, 1)) * paso, z = (j + dado(i, j, 2)) * paso, bos = masc(x, z, 1), cam = masc(x, z, 0), r = dado(i, j, 3);
      const dens = bos > 0.25 ? 0.5 + 0.4 * bos : cam > 0.4 ? 0.035 : 0.09; if (r > dens) continue; const a = alt(x, z); if (a < 3) continue;
      let enPueblo = false; for (const P of this.polis) for (const b of P.barrios) if (Math.hypot(x - b.T.cx, z - b.T.cz) < b.T.R * 1.05 && Math.hypot(x - b.T.agora.x, z - b.T.agora.z) < b.T.R) { enPueblo = dado(i, j, 5) > 0.12; break; } if (enPueblo) continue;
      const e = 0.0016 + 0.0016 * dado(i, j, 4), esPino = bos > 0.25 ? dado(i, j, 6) < 0.7 : dado(i, j, 6) < 0.15; v.set(x, a * KY_CERCA, z); q.setFromAxisAngle(this._eje, r * 40); s.set(e, e * (esPino ? 1.25 : 1), e); m4.compose(v, q, s);
      if (esPino) { if (np < A.N) { A.pinos.setMatrixAt(np, m4); A.pinos.setColorAt(np++, A.col.set(PINO[(r * 300 | 0) % 3])); } } else if (nc < A.N) { A.copas.setMatrixAt(nc, m4); A.copas.setColorAt(nc++, A.col.set(COPA[(r * 400 | 0) % 4])); } }
    A.pinos.count = np; A.copas.count = nc; A.pinos.instanceMatrix.needsUpdate = A.copas.instanceMatrix.needsUpdate = true; if (A.pinos.instanceColor) A.pinos.instanceColor.needsUpdate = true; if (A.copas.instanceColor) A.copas.instanceColor.needsUpdate = true;
  }
  /* ---------- rebaños ---------- */
  _rebanos() {
    const pastos = [[22.25, 37.55], [22.5, 39.45], [23.2, 38.38], [23.85, 38.0], [22.5, 37.15], [27.45, 37.6], [23.3, 38.05], [22.65, 37.68], [21.5, 37.8], [23.5, 38.5], [22.76, 37.61], [23.7, 38.02], [22.46, 37.09], [22.9, 37.89]], n = 14;
    const geo = new THREE.SphereGeometry(1, 6, 4).scale(1.5, 1, 1), im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#f4f0e6' }), pastos.length * n); im.frustumCulled = false; this.g.add(im);
    const sem = []; for (let i = 0; i < pastos.length * n; i++) sem.push([this.rnd() * 6.28, 0.25 + this.rnd() * 0.75, this.rnd() * 6.28]);
    this.reb = { im, pastos, n, sem, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), eje: new THREE.Vector3(0, 1, 0) };
  }
  /* ---------- nubes altas (solo de lejos) ---------- */
  _nubes() { this.nubes = []; const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'), rr = azar(41);
    for (let i = 0; i < 26; i++) { const x = 40 + rr() * 176, y = 44 + rr() * 44, r = 16 + rr() * 26, gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    const tN = new THREE.CanvasTexture(c); tN.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tN, transparent: true, depthWrite: false, opacity: 0 }));
      const sx = 12 + this.rnd() * 12; m.scale.set(sx, 1, sx * 0.5); m.rotation.y = (this.rnd() - 0.5) * 0.5; m.renderOrder = 7; m.frustumCulled = false; this.g.add(m); this.nubes.push({ m, x0: this.rnd(), z0: (this.rnd() - 0.5) * FONDO, y: 5.5 + this.rnd() * 2 }); } }

  estilo(k) {
    this.est = k; const B = k === 'b';
    for (const P of this.polis) { P.lejos.userData.on = !B; P.sello.userData.on = B; for (const h of P.humos) { h.s.material.map = B ? this.tHumoB : this.tHumoA; h.s.material.needsUpdate = true; }
      for (const b of P.barrios) { b.plano.material.uniforms.tPlano.value = null; } }
    this.bCascos.visible = this.bVelas.visible = !B; this.bDib.visible = B; this.bEstelas.material.opacity = B ? 0.3 : 0.4; for (const b of this.barcos) if (b.modelo) b.modelo.visible = false;
    this.reb.im.material.color.set(B ? '#fbf4e2' : '#f4f0e6'); if (this.arb) this.arb.clave = '';
  }
  alzaRotulo() { return 0; }
  radioPolisPx() { return this._radioPx || 16; }

  cuadro(t, dt, w, h) {
    const m = this.m, upx = m.V.upx, a = m.ancho, ky = m.com.uKy.value, alt = m.rel.altura, B = this.est === 'b';
    /* tamaño del caserío de lejos: unos 17 px de radio; al acercarse se encoge hasta el tamaño real y deja paso a las casas */
    const esc = clamp(21 * upx / (0.95), 0.02, 2.6), fuera = paso(A_CASAS * 0.75, A_CASAS * 1.5, a), cerca = a < A_CASAS * 1.5, plano = a < A_PLANO;
    this._radioPx = cerca ? clamp(0.06 / upx, 12, 46) : 0.95 * esc / upx;
    for (const P of this.polis) { const y = Math.max(0, alt(P.x, P.z)) * ky;
      P.lejos.visible = P.lejos.userData.on && fuera > 0.02; if (P.lejos.visible) { P.lejos.position.y = y; P.lejos.scale.setScalar(esc * (0.35 + 0.65 * fuera)); }
      P.sello.visible = P.sello.userData.on && a > A_PLANO * 0.55; if (P.sello.visible) { P.sello.position.y = y; const s = 34 * upx; P.sello.scale.set(s, s, 1); P.sello.material.opacity = paso(A_PLANO * 0.55, A_PLANO * 0.8, a); }
      for (const b of P.barrios) { const ver = plano && Math.abs(b.T.cx - m.V.x) < w * upx + b.lado && Math.abs(b.T.cz - m.V.z) < h * upx * 1.6 + b.lado; b.plano.visible = ver;
        if (ver) { const u = b.plano.material.uniforms; if (!b.tex[this.est]) b.tex[this.est] = pintarPlano(b.T, this.est, b.lado); u.tPlano.value = b.tex[this.est]; u.uOp.value = paso(A_PLANO, A_PLANO * 0.6, a); }
        const casas = ver && !B && a < A_CASAS; b.muros.visible = b.tejados.visible = casas; if (b.acro) b.acro.visible = casas;
        if (casas) { const k = paso(A_CASAS, A_CASAS * 0.7, a); b.muros.scale.y = b.tejados.scale.y = Math.max(0.02, k); } }
      /* humo: sube y se deshace; su tamaño sigue al de la polis */
      const eh = Math.max(esc * E * (0.35 + 0.65 * fuera), cerca ? 0.00042 : 0), hx = cerca ? P.barrios[0].T.agora.x - P.x : 0, hz = cerca ? P.barrios[0].T.agora.z - P.z : 0; P.humo.position.y = y;
      for (const H of P.humos) { const q = (t * 0.11 + H.f) % 1, e = (5 + q * 15) * H.tam * eh; H.s.position.set(hx + (H.o[0] + q * q * 26 * H.vx * H.tam) * eh, (H.o[1] + q * 34 * H.tam) * eh, hz + (H.o[2] + Math.sin(H.f * 9) * 2 * H.tam) * eh); H.s.scale.set(e, e, 1); H.s.material.opacity = (B ? 0.5 : 0.8) * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (1 - q * 0.5); }
    }
    /* barcos: de lejos miden unos 20 px (barquito propio); de cerca, su tamaño agrandado y, en A, el modelo de 0 A.D. */
    const tb = clamp(16 * upx, 46 * M, 1.5), vb = clamp(10 * upx, 0.0003, 0.09) * dt / 1000, real = !B && a < 2.2, cam = m.cam, q = this._q, cx = m.V.x, cz = m.V.z, rx = w * upx * 0.8 + tb, rz = h * upx * 1.4 + tb;
    this.bCascos.visible = this.bVelas.visible = !B;
    for (let i = 0; i < this.barcos.length; i++) { const b = this.barcos[i]; b.s = (b.s + b.sentido * vb + b.total) % b.total; let k = 1; while (k < b.lon.length - 1 && b.lon[k] < b.s) k++;
      const u = (b.s - b.lon[k - 1]) / (b.lon[k] - b.lon[k - 1] || 1), p0 = b.pts[k - 1], p1 = b.pts[k], v = this._s; v.lerpVectors(p0, p1, u); const x = v.x, z = v.z, y = tb * (0.02 + Math.sin(t * 1.7 + b.ri) * 0.006), rumbo = Math.atan2((p1.x - p0.x) * b.sentido, (p1.z - p0.z) * b.sentido);
      const cercaYo = real && Math.abs(x - cx) < rx && Math.abs(z - cz) < rz;
      if (cercaYo && !b.modelo) { const tipo = b.guerra ? 'grie_trirreme' : 'barco', c = staticMesh(tipo, POLIS[b.ri % POLIS.length].color); if (c) { c.scale.setScalar(1 / (b.guerra ? 46 : 28)); b.modelo = new THREE.Group(); b.modelo.add(c); this.g.add(b.modelo); } }
      if (b.modelo) { b.modelo.visible = !!cercaYo; if (cercaYo) { b.modelo.position.set(x, y, z); b.modelo.rotation.set(0, rumbo, Math.sin(t * 1.3 + b.ri * 2) * 0.05); b.modelo.scale.setScalar(tb); } }
      q.setFromAxisAngle(this._eje, rumbo); this._m4.compose(v.set(x, y, z), q, this._s.setScalar(tb)); const M4 = this._m4;
      this.bEstelas.setMatrixAt(i, M4); if (!B) { const z0 = cercaYo ? this._cero : M4; this.bCascos.setMatrixAt(i, z0); this.bVelas.setMatrixAt(i, z0); }
      else { this._q2.copy(cam.quaternion); this._m4.compose(v.set(x, y, z), this._q2, this._s.setScalar(tb)); this.bDib.setMatrixAt(i, this._m4); } }
    this.bEstelas.instanceMatrix.needsUpdate = true; if (!B) { this.bCascos.instanceMatrix.needsUpdate = this.bVelas.instanceMatrix.needsUpdate = true; } else this.bDib.instanceMatrix.needsUpdate = true;
    this._plantar(w, h);
    /* rebaños: ovejas que pacen despacio (no se pintan desde muy lejos) */
    const R = this.reb; R.im.visible = a < 60; if (R.im.visible) { const e = clamp(1.6 * upx, 0.0009, 0.05), disp = clamp(14 * upx, 0.012, 0.9);
      for (let i = 0; i < R.pastos.length; i++) { const Pp = R.pastos[i], cx = X(Pp[0]) + Math.sin(t * 0.02 + i) * disp * 0.4, cz = Z(Pp[1]) + Math.cos(t * 0.017 + i * 2) * disp * 0.4;
        for (let j = 0; j < R.n; j++) { const S = R.sem[i * R.n + j], an = S[0] + Math.sin(t * 0.05 + S[2]) * 0.8, r = S[1] * disp, x = cx + Math.cos(an) * r, z = cz + Math.sin(an) * r, hh = alt(x, z);
          R.v.set(x, Math.max(0, hh) * ky + e * 0.8, z); R.q.setFromAxisAngle(R.eje, -an + Math.cos(t * 0.05 + S[2])); R.s.setScalar(hh > 1 ? e : 0); R.m4.compose(R.v, R.q, R.s); R.im.setMatrixAt(i * R.n + j, R.m4); } }
      R.im.instanceMatrix.needsUpdate = true; }
    /* nubes altas: pasan de oeste a este y se apartan al acercarse */
    const fn = (B ? 0 : 0.5) * paso(16, 46, a); for (const N of this.nubes) { N.m.visible = fn > 0.01; if (!N.m.visible) continue; const f = (N.x0 + t * 0.0035) % 1; N.m.position.set(XI - 10 + f * (ANCHO + 20), N.y, N.z0); N.m.material.opacity = fn * Math.sin(Math.PI * f); }
  }
}

/* ciudad dibujada a tinta para la carta (de lejos): templo con frontón y casas, con el color de la polis en los tejados */
function iconoCiudad(p) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.lineJoin = 'round'; g.strokeStyle = '#3a2416'; g.lineWidth = 3;
  g.fillStyle = 'rgba(58,36,22,.25)'; g.beginPath(); g.ellipse(64, 116, 50, 8, 0, 0, 7); g.fill();
  const casa = (x, y, w, h) => { g.fillStyle = '#f2e6c8'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w / 2, y - h * 0.6); g.lineTo(x + w + 3, y); g.closePath(); g.fillStyle = p.color; g.fill(); g.stroke(); };
  casa(12, 92, 24, 22); casa(92, 94, 24, 20); casa(30, 100, 20, 14);
  g.fillStyle = '#f7efd8'; g.fillRect(34, 60, 60, 50); g.strokeRect(34, 60, 60, 50); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(41 + i * 11.5, 62); g.lineTo(41 + i * 11.5, 108); g.stroke(); }
  g.beginPath(); g.moveTo(28, 60); g.lineTo(64, 34); g.lineTo(100, 60); g.closePath(); g.fillStyle = p.color; g.fill(); g.stroke(); g.fillStyle = '#f7efd8'; g.fillRect(28, 108, 72, 7); g.strokeRect(28, 108, 72, 7);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function iconoBarco(i) {
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.lineJoin = g.lineCap = 'round'; g.strokeStyle = '#3a2416'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(10, 62); g.quadraticCurveTo(48, 92, 88, 58); g.lineTo(80, 72); g.quadraticCurveTo(48, 86, 20, 74); g.closePath(); g.fillStyle = '#8a5a33'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(48, 72); g.lineTo(48, 14); g.stroke(); g.beginPath(); g.moveTo(24, 22); g.quadraticCurveTo(52, 30, 74, 20); g.lineTo(72, 56); g.quadraticCurveTo(50, 64, 26, 56); g.closePath(); g.fillStyle = i % 2 ? '#f2e6c8' : '#c9553f'; g.fill(); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
