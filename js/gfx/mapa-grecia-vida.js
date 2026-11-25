/* AQVILA · AM2 — mapa vivo de Grecia: lo que vive sobre el suelo. Polis (de lejos, un caserío grande que se ve a cualquier altura;
   de cerca, sus calles y sus casas una a una), puertos, humo, barcos por sus rutas, rebaños y nubes altas.
   Niveles de detalle: cada cosa se enciende solo a la altura a la que se distingue, y casi todo va por ejemplares (pocas llamadas).
   Arte: templo, casas de lejos, barcos, olivos y cipreses son de 0 A.D. (Wildfire Games, CC BY-SA 3.0) por js/gfx/statics.js.
   Casas de cerca, calles, humo, ovejas, nubes y dibujos a tinta: propios, hechos aquí. */
import { THREE } from './models.js';
import { preloadStatic, staticMesh, staticInstancedVacio } from './statics.js';
import { POLIS, X, Z } from './mapa-grecia-datos.js';
import { KY_CERCA, XI, ZN, ANCHO, FONDO } from './mapa-grecia-suelo.js';
import RUTAS from '../../assets/mapa-grecia/rutas.js';

const clamp = (x, a, b) => x < a ? a : x > b ? b : x, mix = (a, b, t) => a + (b - a) * t;
const paso = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function azar(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const MUROS = ['#efe6d0', '#e4d6b4', '#d9c8a2', '#f3ecdc', '#cdb890'], TEJ = ['#b99a5e', '#a98848', '#c2a868', '#b3855a', '#a06a44', '#978c70'];   // adobe encalado; paja, barro y alguna teja
const E = 0.019;             // escala del caserío de lejos (modelos de 0 A.D.)
const M = 2.6e-4;            // escala de cerca: 1 m de modelo = 2,6 m de mapa (las casas se agrandan para leerse en el móvil)
const A_CASAS = 1.3, A_PLANO = 9;   // por debajo de estos anchos de pantalla (decenas de km) se ven las casas / el plano de calles

/* cada polis, su forma (probable: reconstrucción nuestra a partir de lo que se sabe de cada una; ver gobierno/historia/AM2-mapa-grecia.md):
   nR calles que salen del ágora · est/ang: alargada hacia un lado · acroD/acroR/acroAng/alto: dónde está su peña, cuánto ocupa y cuánto sube
   · muralla: cerca de piedra · aldeas: no es una ciudad apiñada sino varias aldeas (Esparta) */
const FORMA = {
  atenas: { nR: 8, acroD: 0.34, acroR: 0.2, acroAng: 2.2, alto: 3.2 },
  esparta: { aldeas: 4 },
  corinto: { nR: 7, acroD: 0.8, acroR: 0.22, acroAng: 1.75, alto: 4.5, est: 1.3, ang: 0 },
  argos: { nR: 7, acroD: 0.72, acroR: 0.17, acroAng: 3.5, alto: 3 },
  tebas: { nR: 7, muralla: true, est: 1.25, ang: 1.2, acroD: 0.3, acroR: 0.12, alto: 1 },
  megara: { nR: 5, est: 1.5, ang: 0.3, acroD: 0.5, acroR: 0.14, alto: 2 },
  mileto: { nR: 6, est: 1.7, ang: 1.57, acroD: 0.45, acroR: 0.12, alto: 1 },
  calcis: { nR: 6, est: 1.6, ang: 1.4, acroD: 0.4, acroR: 0.12, alto: 1.5 }
};
function mancha(color, borde) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, color); r.addColorStop(borde || 0.5, color.replace(/[\d.]+\)$/, '0.45)')); r.addColorStop(1, color.replace(/[\d.]+\)$/, '0)')); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

/* ---------- trazado de una polis: ágora, calles que salen de ella, casas a los lados ---------- */
export function trazar(p, alt, casasMax, radio, semilla, F) {
  F = F || {}; const rnd = azar(semilla), cx = p.x !== undefined ? p.x : X(p.lon), cz = p.z !== undefined ? p.z : Z(p.lat), R = radio, calles = [], casas = [], nR = F.nR || 5 + (rnd() * 2 | 0), giro = rnd() * 6.28, est = F.est || 1, eAng = F.ang || 0;
  const seco = (x, z) => alt(x, z) > 1.5, ocup = new Map(), celda = 0.0045, clave = (x, z) => Math.round(x / celda) + ',' + Math.round(z / celda);
  const agora = { x: cx + (rnd() - 0.5) * R * 0.1, z: cz + (rnd() - 0.5) * R * 0.1, r: R * 0.12 };
  const aA = F.acroAng !== undefined ? F.acroAng : giro + 2.4, acro = { x: agora.x + Math.cos(aA) * R * (F.acroD || 0.3), z: agora.z + Math.sin(aA) * R * (F.acroD || 0.3), r: R * (F.acroR || 0.13), alto: F.alto || 1 };
  /* calles radiales, con quiebros */
  const radiales = [];
  for (let i = 0; i < nR; i++) { let a = giro + i / nR * 6.283 + (rnd() - 0.5) * 0.5, x = agora.x + Math.cos(a) * agora.r * 0.8, z = agora.z + Math.sin(a) * agora.r * 0.8; const L = R * (0.75 + rnd() * 0.45) * (1 + (est - 1) * Math.abs(Math.cos(a - eAng))) / Math.sqrt(est), pts = [[x, z]], pasoL = R * 0.11;
    for (let s = 0; s < L; s += pasoL) { a += (rnd() - 0.5) * 0.38; const nx = x + Math.cos(a) * pasoL, nz = z + Math.sin(a) * pasoL; if (!seco(nx, nz)) break; x = nx; z = nz; pts.push([x, z]); }
    if (pts.length > 2) { calles.push({ p: pts, w: 1.3 }); radiales.push(pts); } }
  /* dos rondas que las unen */
  for (const f of [0.42, 0.78]) { const pts = []; for (const r of radiales) { const q = r[Math.min(r.length - 1, Math.round((r.length - 1) * f))]; if (q) pts.push([q[0] + (rnd() - 0.5) * R * 0.03, q[1] + (rnd() - 0.5) * R * 0.03]); }
    if (pts.length > 2) { pts.push(pts[0]); calles.push({ p: pts, w: 1 }); } }
  /* muralla: una cerca que rodea el corazón de la ciudad */
  let muralla = null; if (F.muralla) { muralla = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.283, r = R * 0.62 * (1 + (est - 1) * Math.abs(Math.cos(a - eAng))) / Math.sqrt(est) * (0.94 + 0.12 * Math.sin(a * 3 + giro)); muralla.push([agora.x + Math.cos(a) * r, agora.z + Math.sin(a) * r]); } }
  /* casas a los dos lados de cada calle, más apretadas cerca del ágora */
  const pon = (x, z, ang, tam) => { if (!seco(x, z)) return false; const dA = Math.hypot(x - agora.x, z - agora.z), dT = Math.hypot(x - acro.x, z - acro.z); if (dA < agora.r * 1.25 || dT < acro.r * 1.1) return false;
    const k = clave(x, z); if (ocup.has(k)) return false; for (const o of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = ocup.get(Math.round(x / celda + o[0]) + ',' + Math.round(z / celda + o[1])); if (q && Math.hypot(q[0] - x, q[1] - z) < celda * 0.92) return false; }
    ocup.set(k, [x, z]); casas.push({ x, z, ang, w: tam * (0.85 + rnd() * 0.5), d: tam * (0.7 + rnd() * 0.3), h: tam * (0.42 + rnd() * 0.22), t: rnd(), u: rnd() }); return true; };
  const tam = 0.0036;
  for (let vuelta = 0; vuelta < 3 && casas.length < casasMax; vuelta++) for (const c of calles) { const P = c.p; for (let i = 0; i < P.length - 1 && casas.length < casasMax; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ang = Math.atan2(ux, uz);
    for (let s = celda * 0.5; s < L; s += celda * (1 + vuelta * 0.15)) for (const lado of [1, -1]) { const dist = Math.hypot(a[0] + ux * s - agora.x, a[1] + uz * s - agora.z) / R; if (rnd() < dist * 0.55 - 0.1 + vuelta * 0.1) continue;
      const off = (0.0012 * c.w + tam * 0.55 + vuelta * celda * 0.95) * lado; pon(a[0] + ux * s - uz * off, a[1] + uz * s + ux * off, ang + (lado > 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, tam); } } }
  return { cx, cz, R, agora, acro, calles, casas, muralla, color: p.color || '#8c6a3d' };
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
  if (T.muralla) { g.strokeStyle = B ? '#3a2416' : 'rgba(50,40,28,.5)'; g.lineWidth = 0.0026 * k; traza(T.muralla); g.strokeStyle = B ? '#e9dcb8' : '#b9ad92'; g.lineWidth = 0.0016 * k; traza(T.muralla); }
  /* ágora: explanada clara con su borde */
  { const q = px(T.agora.x, T.agora.z), r = T.agora.r * k; g.fillStyle = B ? '#f4e8c8' : '#e2d2a6'; g.strokeStyle = B ? '#4a2f1c' : 'rgba(110,88,58,.7)'; g.lineWidth = B ? 2 : 3; g.beginPath(); g.arc(q[0], q[1], r, 0, 7); g.fill(); g.stroke();
    const rr = azar(T.casas.length * 7 + 3); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + rr() * 0.4, d = r * (0.5 + rr() * 0.3), x = q[0] + Math.cos(a) * d, y = q[1] + Math.sin(a) * d, w = r * 0.2; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = B ? '#3a2416' : 'rgba(40,30,20,.3)'; g.fillRect(-w / 2 + 2, -w / 3 + 2, w, w * 0.66); g.fillStyle = ['#c9553f', '#e9dcb8', '#b7791f', '#f2e6c8'][i % 4]; g.fillRect(-w / 2, -w / 3, w, w * 0.66); g.restore(); }
    g.fillStyle = B ? '#4a2f1c' : '#bfb49a'; g.beginPath(); g.arc(q[0], q[1], r * 0.12, 0, 7); g.fill(); }
  /* peña de la acrópolis */
  { const q = px(T.acro.x, T.acro.z), r = T.acro.r * k, gr = g.createRadialGradient(q[0] - r * 0.2, q[1] - r * 0.2, r * 0.1, q[0], q[1], r * 1.25); gr.addColorStop(0, B ? '#e9dcb8' : '#cfc3a8'); gr.addColorStop(0.75, B ? '#c9b68c' : '#a39880'); gr.addColorStop(1, B ? 'rgba(120,90,60,0)' : 'rgba(90,80,64,0)'); g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], r * 1.25, 0, 7); g.fill();
    if (B) { g.strokeStyle = '#4a2f1c'; g.lineWidth = 2; g.beginPath(); g.arc(q[0], q[1], r, 0.6, 5.2); g.stroke(); g.fillStyle = '#f7efd8'; g.fillRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.6); g.strokeRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.6); g.fillStyle = T.color; g.fillRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.18); g.strokeRect(q[0] - r * 0.55, q[1] - r * 0.3, r * 1.1, r * 0.18); } }
  /* casas: en A, su sombra en el suelo; en B, la casa entera dibujada a tinta, con el tejado del color de la polis en algunas */
  for (const h of T.casas) { const q = px(h.x, h.z); g.save(); g.translate(q[0], q[1]); g.rotate(-h.ang); const w = h.w * k, d = h.d * k;
    if (B) { g.fillStyle = h.t < 0.18 ? T.color : h.t < 0.6 ? '#c9a070' : '#e6d6ae'; g.strokeStyle = '#3a2416'; g.lineWidth = 1.6; g.fillRect(-w / 2, -d / 2, w, d); g.fillStyle = 'rgba(58,36,22,.28)'; g.fillRect(-w / 2, 0, w, d / 2); g.strokeRect(-w / 2, -d / 2, w, d); g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.stroke(); }
    else { g.save(); g.rotate(h.ang); g.fillStyle = 'rgba(40,30,20,.34)'; g.translate(h.h * k * 0.75, h.h * k * 0.6); g.rotate(-h.ang); g.fillRect(-w / 2, -d / 2, w, d); g.restore();
      const cT = TEJ[(h.u * 6) | 0]; g.fillStyle = cT; g.fillRect(-w / 2, -d / 2, w, d); g.fillStyle = 'rgba(255,240,200,.22)'; g.fillRect(-w / 2, -d / 2, w, d / 2); g.strokeStyle = 'rgba(60,40,20,.45)'; g.lineWidth = 1; g.strokeRect(-w / 2, -d / 2, w, d); }   // el tejado visto desde arriba: la polis se lee ya a media altura
    g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
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
    await preloadStatic(['grie_templo', 'grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_trirreme', 'barco', 'olivo', 'cipres']); this.amarrados = []; this.tBase = mancha('rgba(226,206,160,1)', 0.7);
    this.tHumoA = mancha('rgba(235,228,214,1)'); this.tHumoB = mancha('rgba(90,70,54,1)'); this.tEstela = mancha('rgba(255,255,255,1)', 0.3);
    this.geo = geoCasa(); this.matMuro = new THREE.MeshLambertMaterial({ color: '#ffffff' }); this.matTejado = new THREE.MeshLambertMaterial({ color: '#ffffff' }); const alt = this.m.rel.altura;
    for (const p of POLIS) this.polis.push(this._polis(p, alt));
    this._barcos(); this._rebanos(); this._nubes(); this._arboles();
    /* márgenes de la carta (solo estilo B, de lejos): título arriba y rosa de los vientos abajo, para que el pergamino no quede vacío */
    this.margenes = []; const T = '#4a2f1c', lam = (dib, z) => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'); g.textAlign = 'center'; g.fillStyle = T; g.strokeStyle = T; g.lineJoin = 'round'; dib(g);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const me = new THREE.Mesh(new THREE.PlaneGeometry(56, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, opacity: 0 })); me.position.set(XI + ANCHO / 2, 0.05, z); me.renderOrder = 8; me.frustumCulled = false; me.visible = false; this.g.add(me); this.margenes.push(me); };
    lam(g => { g.font = 'italic 96px Georgia, serif'; try { g.letterSpacing = '30px'; } catch (e) {} g.fillText('ΕΛΛΑΣ', 512, 120); try { g.letterSpacing = '6px'; } catch (e) {} g.font = 'italic 34px Georgia, serif'; g.fillText('Carta de las polis de Grecia y de sus riquezas', 512, 180);
      g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(512 + s * 130, 214); g.lineTo(512 + s * 430, 214); g.stroke(); g.beginPath(); g.arc(512 + s * 110, 214, 6, 0, 7); g.fill(); } }, ZN - 9.5);
    lam(g => { g.translate(512, 128); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 84, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 74, 0, 7); g.stroke();
      for (let i = 0; i < 16; i++) { const L = i % 4 === 0 ? 116 : i % 2 === 0 ? 82 : 50; g.save(); g.rotate(i * Math.PI / 8); g.beginPath(); g.moveTo(0, -L); g.lineTo(9, 0); g.lineTo(-9, 0); g.closePath(); g.fillStyle = i % 2 ? '#c9b98c' : (i % 4 === 0 ? '#7a2b20' : T); g.fill(); g.stroke(); g.restore(); }
      g.fillStyle = T; g.font = 'italic 30px Georgia, serif'; g.fillText('Céfiro', -300, 10); g.fillText('Euro', 300, 10); g.font = 'bold 26px Georgia, serif'; g.fillText('N', 0, -92); }, ZN + FONDO + 9.5);
    /* ejemplares compartidos del caserío de lejos */
    this.lejosInst = {}; for (const k of ['grie_templo', 'grie_casa', 'grie_casa_b', 'grie_casa_c', 'olivo', 'cipres']) { const g = staticInstancedVacio(k, 40, '#b0623c'); if (g) { this.g.add(g); this.lejosInst[k] = { g, n: 0 }; } }
  }

  /* ---------- una polis ---------- */
  _polis(p, alt) {
    const rnd = this.rnd, P = { p, x: X(p.lon), z: Z(p.lat) }, com = this.m.com;
    /* de lejos (A): templo y casas de 0 A.D. (ejemplares compartidos por las ocho polis: pocas llamadas) sobre una mancha de tierra pisada */
    const lejos = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.tBase, transparent: true, depthWrite: false, opacity: 0.85 })); lejos.renderOrder = 2;
    lejos.position.set(P.x, 0, P.z); this.g.add(lejos); P.lejos = lejos; P.piezas = [{ k: 'grie_templo', x: 0, z: 0, r: 0.5, e: 1.15 }];
    const nc = p.pri === 1 ? 6 : 4; for (let i = 0; i < nc; i++) { const a = i / nc * Math.PI * 2 + rnd() * 0.5, r = 27 + (i % 2) * 9 + rnd() * 4; P.piezas.push({ k: ['grie_casa', 'grie_casa_b', 'grie_casa_c'][i % 3], x: Math.cos(a) * r, z: Math.sin(a) * r, r: -a + Math.PI / 2 + (rnd() - 0.5) * 0.6, e: 0.95 }); }
    for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, r = 40 + rnd() * 8; P.piezas.push({ k: i % 2 ? 'olivo' : 'cipres', x: Math.cos(a) * r, z: Math.sin(a) * r, r: rnd() * 6, e: i % 2 ? 0.9 : 1.4 }); }
    /* de lejos (B): la ciudad dibujada a tinta */
    const sello = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconoCiudad(p), transparent: true, depthWrite: false })); sello.center.set(0.5, 0.08); sello.renderOrder = 5; sello.position.set(P.x, 0, P.z); this.g.add(sello); P.sello = sello;
    /* de cerca: plano de calles tendido sobre el relieve y casas una a una (la polis y, si tiene, su puerto) */
    const R = 0.05 + p.casas / 300 * 0.032, F = FORMA[p.id] || {}, sem = POLIS.indexOf(p) * 97 + 11; P.R = R;
    if (F.aldeas) { P.barrios = []; for (let i = 0; i < F.aldeas; i++) { const a = 0.6 + i / (F.aldeas - 1) * 6.283, d = i ? R * 1.05 : 0; P.barrios.push(this._barrio({ x: P.x + Math.cos(a) * d, z: P.z + Math.sin(a) * d, color: p.color }, alt, Math.round(p.casas / F.aldeas), R * 0.4, sem + i * 13, i === 0, { nR: 5, acroD: 0.5, acroR: 0.2, alto: 1 })); } }
    else P.barrios = [this._barrio(p, alt, p.casas, R, sem, true, F)];
    if (p.puerto) { /* el puerto: un caserío en la tierra firme más cercana al fondeadero */
      let px = X(p.puerto[0]), pz = Z(p.puerto[1]), mejor = null; for (let r = 0; r < 0.2 && !mejor; r += 0.012) for (let k = 0; k < 16; k++) { const an = k / 16 * 6.283, x = px + Math.cos(an) * r, z = pz + Math.sin(an) * r; if (alt(x, z) > 4 && this.m.rel.costaKm(x, z) > 0.2) { mejor = [x, z]; break; } }
      if (mejor) { const b = this._barrio({ x: mejor[0], z: mejor[1], color: p.color }, alt, 30, 0.024, POLIS.indexOf(p) * 131 + 5, false); if (b.T.casas.length > 3) P.barrios.push(b); }
      /* barcas amarradas frente al puerto */
      for (let i = 0, n = 0; i < 40 && n < 4; i++) { const an = rnd() * 6.283, r = 0.004 + rnd() * 0.02, x = px + Math.cos(an) * r, z = pz + Math.sin(an) * r, hh = alt(x, z); if (hh < -3 && hh > -40) { this.amarrados.push({ fijo: true, x, z, rumbo: rnd() * 6.283, ri: n, guerra: n === 0 }); n++; } } }
    /* humo de los hogares */
    P.humo = new THREE.Group(); P.humo.position.set(P.x, 0, P.z); this.g.add(P.humo); P.humos = [];
    for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tHumoA, transparent: true, depthWrite: false, opacity: 0 })); s.renderOrder = 6; P.humo.add(s); P.humos.push({ s, f: i / 6, vx: 0.5 + rnd() * 0.3, o: i < 4 ? [8, 16, -6] : [-22, 10, 14], tam: i < 4 ? 1 : 0.7 }); }
    return P;
  }
  _barrio(p, alt, casas, R, semilla, conTemplo, F) {
    const T = trazar(p, alt, casas, R, semilla, F), lado = R * 2.9, B = { T, lado, tex: {} };
    B.plano = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado, 24, 24).rotateX(-Math.PI / 2), materialTendido(this.m.com, null)); B.plano.position.set(T.cx, 0, T.cz); B.plano.renderOrder = 2; B.plano.frustumCulled = false; B.plano.visible = false; this.g.add(B.plano);
    const n = T.casas.length, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const muros = new THREE.InstancedMesh(this.geo.muro, this.matMuro, n), tej = new THREE.InstancedMesh(this.geo.tejado, this.matTejado, n);
    T.casas.forEach((h, i) => { v.set(h.x, Math.max(0, alt(h.x, h.z)) * KY_CERCA, h.z); q.setFromAxisAngle(eje, h.ang); s.set(h.w, h.h, h.d); m4.compose(v, q, s); muros.setMatrixAt(i, m4); tej.setMatrixAt(i, m4);
      muros.setColorAt(i, col.set(MUROS[(h.t * 5) | 0])); tej.setColorAt(i, col.set(TEJ[(h.u * 6) | 0])); });
    for (const im of [muros, tej]) { im.frustumCulled = false; im.visible = false; this.g.add(im); } B.muros = muros; B.tejados = tej;
    if (conTemplo) { const g = new THREE.Group(), y = Math.max(0, alt(T.acro.x, T.acro.z)) * KY_CERCA; g.position.set(T.acro.x, y, T.acro.z);
      const hr = 0.0022 * T.acro.alto, roca = new THREE.Mesh(new THREE.CylinderGeometry(T.acro.r * 0.78, T.acro.r * 1.08, hr, 9), new THREE.MeshLambertMaterial({ color: '#b8ad94', flatShading: true })); roca.position.y = hr / 2; roca.rotation.y = semilla; g.add(roca);
      const tp = staticMesh('grie_templo', p.color); if (tp) { tp.scale.setScalar(M * 1.25); tp.position.y = hr + 5 * M * 1.25; tp.rotation.y = 0.5; g.add(tp); }
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, c = staticMesh(i % 2 ? 'olivo' : 'cipres'); if (c) { c.scale.setScalar(M * (i % 2 ? 1.5 : 2)); c.position.set(Math.cos(a) * T.acro.r * 1.3, -0.0002, Math.sin(a) * T.acro.r * 1.3); g.add(c); } }
      g.visible = false; this.g.add(g); B.acro = g; }
    return B;
  }

  /* ---------- barcos por las rutas del mar ---------- */
  _barcos() {
    this.barcos = []; const lista = [];
    RUTAS.forEach((r, ri) => { const pts = r.l.map(q => new THREE.Vector3(X(q[0]), 0, Z(q[1]))), lon = [0]; for (let i = 1; i < pts.length; i++) lon.push(lon[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const total = lon[lon.length - 1], cuantos = total > 30 ? 2 : 1; for (let b = 0; b < cuantos; b++) lista.push({ pts, lon, total, s: ((b / cuantos + ri * 0.137) % 1) * total, sentido: b % 2 ? -1 : 1, ri, guerra: ri % 3 === 0 }); });
    for (const am of this.amarrados) lista.push(am);
    const n = lista.length, casco = new THREE.BufferGeometry();
    casco.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.07, 0.5, 0, 0.1, -0.5, -0.13, 0.07, -0.05, 0.13, 0.07, -0.05, 0, -0.03, 0, -0.1, 0.07, -0.42, 0.1, 0.07, -0.42], 3)); casco.setIndex([0, 2, 4, 0, 4, 3, 2, 5, 4, 3, 4, 6, 5, 1, 4, 1, 6, 4, 0, 3, 2, 2, 3, 6, 2, 6, 5, 5, 6, 1]); casco.computeVertexNormals();
    const vela = new THREE.PlaneGeometry(0.42, 0.34).translate(0, 0.32, 0.06), palo = new THREE.PlaneGeometry(0.02, 0.5).translate(0, 0.3, 0.05).rotateY(Math.PI / 2), estela = new THREE.PlaneGeometry(0.34, 1.3).rotateX(-Math.PI / 2).translate(0, 0.004, -0.95);
    const I = (g, mat) => { const im = new THREE.InstancedMesh(g, mat, n); im.frustumCulled = false; this.g.add(im); return im; };
    this.bCascos = I(casco, new THREE.MeshLambertMaterial({ color: '#7a5230' })); this.bVelas = I(vela, new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide })); this.bEstelas = I(estela, new THREE.MeshBasicMaterial({ map: this.tEstela, transparent: true, opacity: 0.5, depthWrite: false })); this.bEstelas.renderOrder = 2;
    this.bDib = I(new THREE.PlaneGeometry(1.5, 1.5).translate(0, 0.45, 0), new THREE.MeshBasicMaterial({ map: iconoBarco(0), transparent: true, depthWrite: false })); this.bDib.renderOrder = 5;
    const col = new THREE.Color(); lista.forEach((b, i) => { this.bVelas.setColorAt(i, col.set(b.guerra ? '#c9553f' : i % 2 ? '#f2e6c8' : '#e2d2a8')); b.modelo = null; this.barcos.push(b); });
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._v = new THREE.Vector3(); this._eje = new THREE.Vector3(0, 1, 0); this._cero = new THREE.Matrix4().makeScale(0, 0, 0);
  }
  /* ---------- árboles de cerca: pinos y encinas con volumen, solo alrededor de la cámara (se recolocan al moverse) ---------- */
  _arboles() {
    const N = 2200, pino = new THREE.ConeGeometry(0.5, 1.6, 5, 1, true).translate(0, 0.9, 0), copa = new THREE.OctahedronGeometry(0.66, 0).scale(1, 0.8, 1).translate(0, 0.6, 0), mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const I = g => { const im = new THREE.InstancedMesh(g, mat, N); im.count = 0; im.frustumCulled = false; im.visible = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.g.add(im); return im; };
    this.arb = { pinos: I(pino), copas: I(copa), N, clave: '', col: new THREE.Color() };
  }
  _plantar(w, h) {
    const m = this.m, A = this.arb, upx = m.V.upx, ver = this.est === 'a' && m.ancho < 0.75; A.pinos.visible = A.copas.visible = ver; if (!ver) return;
    const paso = Math.max(0.0034, upx * 9), rx = w * upx * 0.62, rz = h * upx * 0.95, cx = Math.round(m.V.x / (rx * 0.25)), cz = Math.round(m.V.z / (rz * 0.25)), clave = cx + ',' + cz + ',' + Math.round(Math.log2(upx) * 3); if (clave === A.clave) return; A.clave = clave;
    const alt = m.rel.altura, masc = m.masc, m4 = this._m4, q = this._q, s = this._s, v = new THREE.Vector3(), x0 = Math.floor((m.V.x - rx) / paso), x1 = Math.ceil((m.V.x + rx) / paso), z0 = Math.floor((m.V.z - rz * 1.25) / paso), z1 = Math.ceil((m.V.z + rz * 0.75) / paso); let np = 0, nc = 0;
    const dado = (i, j, k) => { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + k * 974711; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const PINO = ['#4f7340', '#5a8048', '#456838'], COPA = ['#5a7a3c', '#6b8a46', '#4d6c36', '#7a8f4e'];
    for (let j = z1; j >= z0; j--) for (let i = x0; i <= x1; i++) { const x = (i + dado(i, j, 1)) * paso, z = (j + dado(i, j, 2)) * paso, bos = masc(x, z, 1), cam = masc(x, z, 0), r = dado(i, j, 3);
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
    for (const P of this.polis) { for (const h of P.humos) { h.s.material.map = B ? this.tHumoB : this.tHumoA; h.s.material.needsUpdate = true; }
      for (const b of P.barrios) { b.plano.material.uniforms.tPlano.value = null; } }
    this.bCascos.visible = this.bVelas.visible = !B; this.bDib.visible = B; this.bEstelas.material.opacity = B ? 0.3 : 0.4; for (const b of this.barcos) if (b.modelo) b.modelo.visible = false;
    this.reb.im.material.color.set(B ? '#fbf4e2' : '#f4f0e6'); if (this.arb) this.arb.clave = '';
  }
  texturas(tx) { for (const t of [this.tHumoA, this.tHumoB, this.tEstela]) if (t) tx.add(t); for (const P of this.polis) for (const b of P.barrios) for (const k in b.tex) tx.add(b.tex[k]); }
  alzaRotulo() { return 0; }
  radioPolisPx() { return this._radioPx || 16; }

  cuadro(t, dt, w, h) {
    const m = this.m, upx = m.V.upx, a = m.ancho, ky = m.com.uKy.value, alt = m.rel.altura, B = this.est === 'b';
    /* el caserío de lejos mide siempre unos 21 px de radio (nunca menos que la polis real); por debajo de ~16 km de ancho deja paso al plano y a las casas */
    const fuera = paso(0.9, 1.3, a), cerca = a < 1.3, plano = a < A_PLANO, I = this.lejosInst; for (const k in I) I[k].n = 0;
    this._radioPx = cerca ? clamp(0.06 / upx, 12, 46) : mix(30, 21, paso(3, 12, a));
    for (const P of this.polis) { const y = Math.max(0, alt(P.x, P.z)) * ky, esc = clamp(Math.max(mix(30, 21, paso(3, 12, a)) * upx, P.R * 0.9) / 0.95, 0.02, 2.6) * (0.6 + 0.4 * fuera), ee = E * esc;
      const enVista = Math.abs(P.x - m.V.x) < w * upx * 0.75 + 3 * esc && Math.abs(P.z - m.V.z) < h * upx * 1.3 + 3 * esc;
      P.lejos.visible = !B && fuera > 0.02 && enVista; if (P.lejos.visible) { P.lejos.position.y = y + upx * 0.6; P.lejos.scale.setScalar(esc); P.lejos.material.opacity = 0.85 * fuera;
        for (const z of P.piezas) { const L = I[z.k]; if (!L || L.n >= 40) continue; this._m4.compose(this._v.set(P.x + z.x * ee, y + (z.k === 'grie_templo' ? 5 : 4.6) * ee * z.e, P.z + z.z * ee), this._q.setFromAxisAngle(this._eje, z.r), this._s.setScalar(ee * z.e)); for (const im of L.g.children) im.setMatrixAt(L.n, this._m4); L.n++; } }
      P.sello.visible = B && a > 0.9; if (P.sello.visible) { P.sello.position.y = y; const sz = Math.max(34 * upx, P.R * 1.6); P.sello.scale.set(sz, sz, 1); P.sello.material.opacity = fuera; }
      for (const b of P.barrios) { const ver = plano && Math.abs(b.T.cx - m.V.x) < w * upx + b.lado && Math.abs(b.T.cz - m.V.z) < h * upx * 1.6 + b.lado; b.plano.visible = ver;
        if (ver) { const u = b.plano.material.uniforms; if (!b.tex[this.est]) b.tex[this.est] = pintarPlano(b.T, this.est, b.lado); u.tPlano.value = b.tex[this.est]; u.uOp.value = paso(A_PLANO, A_PLANO * 0.6, a); }
        else if (!plano) for (const k in b.tex) { b.tex[k].dispose(); delete b.tex[k]; }   // al alejarse se suelta la memoria del plano
        const casas = ver && !B && a < A_CASAS; b.muros.visible = b.tejados.visible = casas; if (b.acro) b.acro.visible = casas;
      }
      /* humo: sube y se deshace; su tamaño sigue al de la polis */
      const eh = Math.max(ee * 1.5, cerca ? 0.00042 : 0), hx = cerca ? P.barrios[0].T.agora.x - P.x : 0, hz = cerca ? P.barrios[0].T.agora.z - P.z : 0; P.humo.position.y = y;
      for (const H of P.humos) { const q = (t * 0.11 + H.f) % 1, e = (5 + q * 15) * H.tam * eh; H.s.position.set(hx + (H.o[0] + q * q * 26 * H.vx * H.tam) * eh, (H.o[1] + q * 34 * H.tam) * eh, hz + (H.o[2] + Math.sin(H.f * 9) * 2 * H.tam) * eh); H.s.scale.set(e, e, 1); H.s.material.opacity = (B ? 0.5 : 0.8) * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (1 - q * 0.5); }
    }
    for (const k in I) for (const im of I[k].g.children) { im.count = I[k].n; im.instanceMatrix.needsUpdate = true; }
    /* barcos: de lejos miden unos 20 px (barquito propio); de cerca, su tamaño agrandado y, en A, el modelo de 0 A.D. */
    const tb = clamp(16 * upx, 46 * M, 1.5), vb = clamp(10 * upx, 0.0003, 0.09) * dt / 1000, real = !B && a < 2.2, cam = m.cam, q = this._q, cx = m.V.x, cz = m.V.z, rx = w * upx * 0.8 + tb, rz = h * upx * 1.4 + tb;
    this.bCascos.visible = this.bVelas.visible = !B;
    for (let i = 0; i < this.barcos.length; i++) { const b = this.barcos[i];
      if (b.fijo) { /* barca amarrada: solo de cerca, sin estela, meciéndose */ this.bEstelas.setMatrixAt(i, this._cero); const ta = clamp(8 * upx, 30 * M, 0.2), M0 = a < 5 ? this._m4.compose(this._v.set(b.x, ta * 0.02, b.z), q.setFromAxisAngle(this._eje, b.rumbo + Math.sin(t * 0.4 + b.ri) * 0.1), this._s.setScalar(ta)) : this._cero;
        if (!B) { this.bCascos.setMatrixAt(i, M0); this.bVelas.setMatrixAt(i, this._cero); } else this.bDib.setMatrixAt(i, a < 5 ? this._m4.compose(this._v.set(b.x, ta * 0.02, b.z), this._q2.copy(cam.quaternion), this._s.setScalar(ta * 0.8)) : this._cero); continue; }
      b.s = (b.s + b.sentido * vb + b.total) % b.total; let k = 1; while (k < b.lon.length - 1 && b.lon[k] < b.s) k++;
      const u = (b.s - b.lon[k - 1]) / (b.lon[k] - b.lon[k - 1] || 1), p0 = b.pts[k - 1], p1 = b.pts[k], v = this._v; v.lerpVectors(p0, p1, u); const x = v.x, z = v.z, y = tb * (0.02 + Math.sin(t * 1.7 + b.ri) * 0.006), rumbo = Math.atan2((p1.x - p0.x) * b.sentido, (p1.z - p0.z) * b.sentido);
      const cercaYo = real && Math.abs(x - cx) < rx && Math.abs(z - cz) < rz;
      if (cercaYo && !b.modelo) { const tipo = b.guerra ? 'grie_trirreme' : 'barco', c = staticMesh(tipo, POLIS[b.ri % POLIS.length].color); if (c) { c.scale.setScalar(1 / (b.guerra ? 46 : 28)); b.modelo = new THREE.Group(); b.modelo.add(c); this.g.add(b.modelo); } }
      if (b.modelo) { b.modelo.visible = !!cercaYo; if (cercaYo) { b.modelo.position.set(x, y, z); b.modelo.rotation.set(0, rumbo, Math.sin(t * 1.3 + b.ri * 2) * 0.05); b.modelo.scale.setScalar(tb); } }
      q.setFromAxisAngle(this._eje, rumbo); this._m4.compose(v.set(x, y, z), q, this._s.setScalar(tb)); const M4 = this._m4;
      this.bEstelas.setMatrixAt(i, M4); if (!B) { const z0 = cercaYo ? this._cero : M4; this.bCascos.setMatrixAt(i, z0); this.bVelas.setMatrixAt(i, z0); }
      else { this._q2.copy(cam.quaternion); this._m4.compose(v.set(x, y, z), this._q2, this._s.setScalar(tb)); this.bDib.setMatrixAt(i, this._m4); } }
    this.bEstelas.instanceMatrix.needsUpdate = true; if (!B) { this.bCascos.instanceMatrix.needsUpdate = this.bVelas.instanceMatrix.needsUpdate = true; } else this.bDib.instanceMatrix.needsUpdate = true;
    this._plantar(w, h);
    /* rebaños: ovejas que pacen despacio (no se pintan desde muy lejos) */
    const R = this.reb; R.im.visible = a < 60; if (R.im.visible) { const e = clamp(2.1 * upx, 0.0009, 0.05), disp = clamp(14 * upx, 0.012, 0.9);
      for (let i = 0; i < R.pastos.length; i++) { const Pp = R.pastos[i], cx = X(Pp[0]) + Math.sin(t * 0.02 + i) * disp * 0.4, cz = Z(Pp[1]) + Math.cos(t * 0.017 + i * 2) * disp * 0.4;
        for (let j = 0; j < R.n; j++) { const S = R.sem[i * R.n + j], an = S[0] + Math.sin(t * 0.05 + S[2]) * 0.8, r = S[1] * disp, x = cx + Math.cos(an) * r, z = cz + Math.sin(an) * r, hh = alt(x, z);
          R.v.set(x, Math.max(0, hh) * ky + e * 0.8, z); R.q.setFromAxisAngle(R.eje, -an + Math.cos(t * 0.05 + S[2])); R.s.setScalar(hh > 1 ? e : 0); R.m4.compose(R.v, R.q, R.s); R.im.setMatrixAt(i * R.n + j, R.m4); } }
      R.im.instanceMatrix.needsUpdate = true; }
    for (const me of this.margenes) { const o = B ? paso(34, 46, a) : 0; me.visible = o > 0.01; me.material.opacity = o * 0.9; }
    /* nubes altas: pasan de oeste a este y se apartan al acercarse */
    const fn = (B ? 0 : 0.55) * paso(9, 26, a); for (const N of this.nubes) { N.m.visible = fn > 0.01; if (!N.m.visible) continue; const f = (N.x0 + t * 0.0035) % 1; N.m.position.set(XI - 10 + f * (ANCHO + 20), N.y, N.z0); N.m.material.opacity = fn * Math.sin(Math.PI * f); }
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
