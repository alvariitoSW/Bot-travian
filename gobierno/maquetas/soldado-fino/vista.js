/* AQVILA · maqueta GM44: visor del soldado nuevo. Arrastra para girar, pellizca para acercar. */
import { THREE } from '../../../js/gfx/models.js';
import * as U from '../../../js/gfx/units.js';
import { crearSoldado } from './soldado.js';

const Q = new URLSearchParams(location.search), lienzo = document.getElementById('c');
const r = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: Q.has('foto') });
r.setPixelRatio(Math.min(2, +Q.get('dpr') || window.devicePixelRatio || 1)); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
const escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.05, 200);

/* cielo sencillo: sirve de fondo y de reflejo para el bronce */
function cielo() { const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5f86b8'); gr.addColorStop(0.42, '#b9cfe0'); gr.addColorStop(0.5, '#e9e2cf'); gr.addColorStop(0.52, '#8c7a55'); gr.addColorStop(1, '#4a3f2a'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const e = new THREE.Scene(); e.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide })));
  const sol = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(30, 27, 22) })); sol.position.set(20, 30, 25); e.add(sol);
  const pm = new THREE.PMREMGenerator(r), env = pm.fromScene(e, 0.02).texture; pm.dispose(); return { env, fondo: t }; }
const C = cielo(); escena.environment = C.env; escena.environmentIntensity = 0.75; escena.background = new THREE.Color('#b9c6cc');
escena.add(new THREE.HemisphereLight('#fff3dc', '#5a4a36', 0.9)); const sol = new THREE.DirectionalLight('#fff1d6', 2.6); sol.position.set(2.5, 4, 3.5); escena.add(sol);
const suelo = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: '#8d7c56', roughness: 1 })); suelo.rotation.x = -Math.PI / 2; escena.add(suelo);
function sombra(x, z, e = 1) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3 * e, 1.0 * e), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.004, z); escena.add(m); return m; }

const nuevo = crearSoldado({ color: Q.get('color') || '#9c2f25', sin: (Q.get('sin') || '').split(',') }); escena.add(nuevo.grupo); const sombraN = sombra(0, 0);
let modo = Q.get('modo') || 'quieto', viejo = null, masa = [], dist = +Q.get('dist') || 4.6, giro = Q.has('giro') ? +Q.get('giro') : 0.45, alto = +Q.get('alto') || 1.0, elev = Q.has('elev') ? +Q.get('elev') : 0.12;
const dato = document.getElementById('dato');

async function comparar(si) {
  if (si && !viejo) { await U.loadIndex(); const u = await U.loadUnit('hastati'); const g = U.instancedGeometry(u, 1); const m = new THREE.InstancedMesh(g, U.unitMaterialReal(u, '#b02a20'), 1); m.frustumCulled = false;
    const esc = 1.72 / 3.95; m.setMatrixAt(0, new THREE.Matrix4().makeScale(esc, esc, esc)); m.position.set(-0.55, 0, 0); viejo = { m, g, u, s: sombra(-0.55, 0) }; escena.add(m); }
  if (viejo) { viejo.m.visible = viejo.s.visible = si; } nuevo.grupo.position.x = si ? 0.5 : 0; centro = si ? 0 : 0; sombraN.position.x = nuevo.grupo.position.x;
  document.getElementById('comp').classList.toggle('on', si);
}
let centro = 0;
function muchos(si) { for (const s of masa) { escena.remove(s.grupo); } masa = [];
  if (si) for (let i = 1; i < 40; i++) { const s = crearSoldado({ color: '#9c2f25' }); s.grupo.position.set(((i % 8) - 3.5) * 1.0 + 0.5, 0, -Math.floor(i / 8) * 1.2 - (i % 8 === 0 ? 0 : 0)); if (i < 8) s.grupo.position.x += 0; s.fase = i * 0.37; escena.add(s.grupo); masa.push(s); }
  if (si) { dist = 9; alto = 1.0; elev = 0.3; } else { dist = 4.6; elev = 0.12; }
  document.getElementById('muchos').classList.toggle('on', si); }

for (const b of document.querySelectorAll('button[data-m]')) b.onclick = () => { modo = b.dataset.m; document.querySelectorAll('button[data-m]').forEach(x => x.classList.toggle('on', x === b)); };
document.getElementById('comp').onclick = () => comparar(!(viejo && viejo.m.visible));
document.getElementById('muchos').onclick = () => muchos(!masa.length);
let deCara = false; document.getElementById('cara').onclick = e => { deCara = !deCara; e.target.classList.toggle('on', deCara); if (deCara) { dist = 1.25; alto = 1.6; elev = 0.02; } else { dist = 4.6; alto = 1.0; elev = 0.12; } };

/* girar y acercar con el dedo */
const dedos = new Map(); let d0 = 0;
lienzo.addEventListener('pointerdown', e => { dedos.set(e.pointerId, [e.clientX, e.clientY]); lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener('pointermove', e => { const p = dedos.get(e.pointerId); if (!p) return; if (dedos.size === 1) { giro -= (e.clientX - p[0]) * 0.008; elev = Math.max(-0.1, Math.min(1.2, elev + (e.clientY - p[1]) * 0.005)); }
  dedos.set(e.pointerId, [e.clientX, e.clientY]); if (dedos.size === 2) { const [a, b] = [...dedos.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d0) dist = Math.max(0.6, Math.min(14, dist * d0 / d)); d0 = d; } });
const fuera = e => { dedos.delete(e.pointerId); d0 = 0; }; lienzo.addEventListener('pointerup', fuera); lienzo.addEventListener('pointercancel', fuera);
lienzo.addEventListener('wheel', e => { dist = Math.max(0.6, Math.min(14, dist * (1 + e.deltaY * 0.001))); });

function medida() { const w = innerWidth, h = innerHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } addEventListener('resize', medida); medida();
if (Q.has('comparar')) await comparar(true); if (Q.has('muchos')) muchos(true); if (Q.has('cara')) { dist = +Q.get('dist') || 1.25; alto = 1.6; elev = 0.02; }
if (Q.has('alto')) alto = +Q.get('alto'); if (Q.has('elev')) elev = +Q.get('elev'); if (Q.has('dist')) dist = +Q.get('dist');
let t0 = performance.now(), cuadros = 0, tf = t0, fps = 0; const fijo = Q.has('t') ? +Q.get('t') : null;
function bucle(ahora) { const t = fijo ?? (ahora - t0) / 1000;
  nuevo.pose(t, modo); for (const s of masa) s.pose(t + s.fase, modo);
  if (viejo && viejo.m.visible) { const cl = viejo.u.clips[modo === 'andar' ? 'walk' : modo === 'golpe' ? 'attack_melee' : 'idle']; viejo.g.attributes.aFrame.array[0] = U.frameOf(cl, t); viejo.g.attributes.aFrame.needsUpdate = true; }
  const f = cam.aspect < 1 && viejo && viejo.m.visible ? 1.75 : 1, d = dist * f; cam.position.set(centro + Math.sin(giro) * Math.cos(elev) * d, alto + Math.sin(elev) * d, Math.cos(giro) * Math.cos(elev) * d); cam.lookAt(centro, alto, 0);
  r.render(escena, cam); cuadros++; if (ahora - tf > 500) { fps = cuadros * 1000 / (ahora - tf); cuadros = 0; tf = ahora;
    dato.textContent = `${nuevo.tris.toLocaleString('es')} triángulos · ${nuevo.huesos} huesos · ${Math.round(fps)} img/s · ${r.info.render.triangles.toLocaleString('es')} en pantalla`; }
  window.__listo = true; requestAnimationFrame(bucle); }
requestAnimationFrame(bucle);
window.__info = () => ({ tris: nuevo.tris, huesos: nuevo.huesos, fps });
