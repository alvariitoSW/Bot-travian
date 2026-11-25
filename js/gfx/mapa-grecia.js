/* AQVILA · AM2 — MAPA VIVO DE GRECIA (para la Partida nueva). Motor: cámara, dedos, rótulos y bucle.
   Uso:  const m = new MapaGrecia(caja, { estilo: 'a', onPolis: p => …, onCambio: () => … }); await m.iniciar();
   Un solo mapa que se amplía con dos dedos, de Grecia entera (~840 km de ancho de pantalla) a las calles de una polis (~1,2 km).
   Dos estilos que se cambian al vuelo: 'a' relieve natural, 'b' carta antigua viva.
   El suelo y el mar están en mapa-grecia-suelo.js; las ciudades, barcos, rebaños, humo y nubes, en mapa-grecia-vida.js;
   los datos (polis, comarcas de recursos, nombres), en mapa-grecia-datos.js. No toca la lógica del juego. */
import { THREE } from './models.js';
import { MARCO, POLIS, ZONAS, BASICOS, LUJOS, CAMINOS, LUGARES, CLASES, VISTAS, X, Z, LON, LAT } from './mapa-grecia-datos.js';
import { Suelo, cargarRelieve, leerImagen, cintas, suave, materialLinea, ESTILOS, ANCHO, FONDO, XI, ZN, KY_CERCA, KY_LEJOS } from './mapa-grecia-suelo.js';
import { Vida } from './mapa-grecia-vida.js';
import { ICONOS } from './mapa-grecia-iconos.js';
import RIOS from '../../assets/mapa-grecia/rios.js';

const clamp = (x, a, b) => x < a ? a : x > b ? b : x, mix = (a, b, t) => a + (b - a) * t;
const paso = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const UPX_MIN = 0.12 / 390;          // lo más cerca: 1,2 km de ancho en un móvil de 390 px
const DESVIOS = [[0, -30], [0, 30], [-32, 0], [32, 0], [-28, -28], [28, 28]];   // si el icono de una comarca choca, se aparta un poco
const FOV = 30, EL_CERCA = 0.86, EL_LEJOS = 1.2;

const CSS = `
.mg-caja{overflow:clip;touch-action:none;user-select:none;-webkit-user-select:none;background:#1b2530}
.mg-caja canvas.mg-gl{position:absolute;inset:0;width:100%;height:100%;display:block}
.mg-rot{position:absolute;inset:0;overflow:clip;pointer-events:none;font-family:Georgia,'Times New Roman',serif;color:#2a2119}
.mg-e{position:absolute;left:0;top:0;display:flex;align-items:center;gap:4px;white-space:nowrap;will-change:transform}
.mg-e svg{width:100%;height:100%;display:block}
.mg-polis{pointer-events:auto;padding:2px 5px 2px 5px;border-radius:4px;background:rgba(250,243,224,.93);border:1px solid #6b5335;box-shadow:0 1px 3px #0006;font-size:13.5px;font-weight:bold;letter-spacing:.3px;min-height:24px;cursor:pointer}
.mg-polis::after{content:'';position:absolute;inset:-10px -6px}
.mg-polis.pri3{font-size:12.5px}
.mg-polis b{width:9px;height:9px;border-radius:50%;background:var(--c);border:1px solid #0008;flex:none}
.mg-polis .lujo{width:20px;height:20px;border-radius:50%;padding:3px;background:var(--c);color:#fff;box-shadow:0 0 0 1.5px #e3b341;display:none;flex:none}
.mg-rec .mg-polis .lujo{display:block}
.mg-zona{font-size:11px;font-style:italic;color:#fff;text-shadow:0 1px 2px #000,0 0 3px #000;flex-direction:column;gap:1px}
.mg-zona i{width:24px;height:24px;border-radius:50%;padding:4px;background:var(--c);color:#fff;border:1.5px solid #fff;box-shadow:0 1px 3px #0009;font-style:normal}
.mg-zona.compacta span{display:none}
.mg-zona svg,.mg-polis .lujo svg{filter:drop-shadow(0 0 .6px #000) drop-shadow(0 0 .6px #000)}
.mg-l{color:#fff;text-shadow:0 1px 2px #000,0 0 4px #000c,0 0 2px #000,1px 0 1px #0008,-1px 0 1px #0008;font-size:12.5px}
.mg-l.mar{font-style:italic;font-size:15px;letter-spacing:3px;color:#dcecf6;text-shadow:0 1px 2px #0a2740,0 0 5px #0a2740}
.mg-l.golfo{font-style:italic;font-size:11.5px;color:#dcecf6;text-shadow:0 1px 2px #0a2740,0 0 4px #0a2740}
.mg-l.region{font-variant:small-caps;font-size:16px;letter-spacing:4px;color:#fff6dc}
.mg-l.comarca{font-variant:small-caps;font-size:13px;letter-spacing:2px;color:#fff6dc}
.mg-l.isla,.mg-l.islaG{font-style:italic;font-size:12px}
.mg-l.monte{font-size:11.5px;color:#f3e9d2}.mg-l.monte::before{content:'▲';font-size:8px;margin-right:2px;opacity:.9}
.mg-l.lugar{font-size:12px}.mg-l.lugar::before{content:'';width:6px;height:6px;border-radius:50%;background:#f6ecd0;border:1px solid #2a2119;margin-right:1px;flex:none}
.mg-l.lugar.s-santuario::before{border-radius:1px;background:#e3b341;transform:rotate(45deg)}.mg-l.lugar.s-ruina::before{border-radius:0;background:#9a8f7c}
.mg-b .mg-polis{background:#f4e8c8;border:1px solid #4a2f1c;border-radius:2px;font-variant:small-caps;font-size:14.5px;letter-spacing:.6px;box-shadow:1px 1px 0 #4a2f1c88}
.mg-b .mg-polis.pri3{font-size:13px}
.mg-b .mg-polis .lujo{box-shadow:0 0 0 1.5px #3d120c,0 0 0 3px #b34233}
.mg-b .mg-zona{color:#3a2416;text-shadow:0 0 3px #f4e8c8,0 0 2px #f4e8c8,0 0 2px #f4e8c8;font-weight:bold}
.mg-b .mg-zona i{border-color:#4a2f1c;box-shadow:1px 1px 0 #4a2f1c}
.mg-b .mg-l{color:#4a2f1c;text-shadow:0 0 3px #f1e3bd,0 0 2px #f1e3bd,0 0 2px #f1e3bd;font-style:italic}
.mg-b .mg-l.mar,.mg-b .mg-l.golfo{color:#32505c;text-shadow:0 0 3px #c9d6c4,0 0 2px #c9d6c4}
.mg-b .mg-l.region,.mg-b .mg-l.comarca{font-style:italic;font-variant:normal;text-transform:uppercase}
`;

export class MapaGrecia {
  constructor(host, opts) {
    this.host = host; this.o = opts || {}; this.est = this.o.estilo === 'b' ? 'b' : 'a'; this.listo = false; this.recursosOn = false;
    if (!document.getElementById('mg-css')) { const s = document.createElement('style'); s.id = 'mg-css'; s.textContent = CSS; document.head.appendChild(s); }
    host.classList.add('mg-caja'); if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.dprMax = Math.min(window.devicePixelRatio || 1, 2); this.dpr = this.o.dpr || this.dprMax; this.r.setPixelRatio(this.dpr);
    this.cv = this.r.domElement; this.cv.className = 'mg-gl'; host.insertBefore(this.cv, host.firstChild);
    this.rot = document.createElement('div'); this.rot.className = 'mg-rot'; host.insertBefore(this.rot, this.cv.nextSibling);
    this.escena = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(FOV, 1, 0.01, 800);
    this.escena.add(new THREE.HemisphereLight('#fff6e4', '#6b6a55', 1.5)); const sol = new THREE.DirectionalLight('#fff1d6', 2.2); sol.position.set(-40, 60, -40); this.escena.add(sol);
    this.V = { x: X(23.05), z: Z(37.75), upx: 21 / 390 }; this.vel = { x: 0, z: 0 }; this.anim = null; this.t = 0; this.t0 = performance.now(); this.medida = { n: 0, ms: 0, lento: 0 };
    this._cuadro = this._cuadro.bind(this); this._v3 = new THREE.Vector3();
  }
  async iniciar() {
    const t0 = performance.now();
    this.rel = await cargarRelieve(); this.suelo = new Suelo(this.escena, this.rel); this.com = this.suelo.com;
    const [E, masc] = await Promise.all([this.suelo.estilo(this.est), leerImagen('mascaras-a.webp')]); this.masc = masc; this.r.setClearColor(ESTILOS[this.est].niebla);
    this._lineas(); this._rotulos(); this._dedos();
    this.vida = new Vida(this); await this.vida.iniciar(); this.vida.estilo(this.est);
    for (const P of this.vida.polis) if (P.puertoXZ) { const e = this.etq.find(q => q.lugar && q.lugar.n === P.p.puertoN); if (e) { e.x = P.puertoXZ[0]; e.z = P.puertoXZ[1] - P.puertoR * 1.25; } }   // el rótulo del puerto, sobre su caserío y su muelle
    this.host.classList.toggle('mg-b', this.est === 'b');
    this.vista(this.o.vista || 'corazon'); this.listo = true; this.arranqueMs = Math.round(performance.now() - t0);
    this._ro = new ResizeObserver(() => { for (const e of this.etq) e.w = 0; }); this._ro.observe(this.host);
    this._raf = requestAnimationFrame(this._cuadro); return this;
  }
  /* suelta todo lo que ocupa memoria de vídeo (se puede abrir y cerrar el mapa muchas veces desde el menú) */
  destruir() { cancelAnimationFrame(this._raf); this._raf = 0; this.listo = false; if (this._ro) this._ro.disconnect();
    const tx = new Set(), mat = m => { for (const k in m) if (m[k] && m[k].isTexture) tx.add(m[k]); if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k].value; if (v && v.isTexture) tx.add(v); } m.dispose(); };
    this.escena.traverse(o => { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach(mat); });
    if (this.suelo) for (const k in this.suelo.tex) for (const t of this.suelo.tex[k]) tx.add(t); if (this.vida) this.vida.texturas(tx);
    for (const t of tx) t.dispose(); this.r.dispose(); try { this.r.forceContextLoss(); } catch (e) {} this.cv.remove(); this.rot.remove(); }
  pausa(si) { if (si && this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; } else if (!si && !this._raf && this.listo) this._raf = requestAnimationFrame(this._cuadro); }

  /* ---------- lo que se pide desde fuera ---------- */
  async estilo(k) { if (k !== 'a' && k !== 'b') k = this.est === 'a' ? 'b' : 'a'; await this.suelo.estilo(k); this.est = k; this.r.setClearColor(ESTILOS[k].niebla); this._estiloLineas(); this.vida.estilo(k); this.host.classList.toggle('mg-b', k === 'b'); for (const e of this.etq) e.w = 0; return k; }
  recursos(si) { this.recursosOn = si === undefined ? !this.recursosOn : !!si; this.host.classList.toggle('mg-rec', this.recursosOn); this.com.uRec.value = this.recursosOn ? 1 : 0; this.cercos.visible = this.recursosOn; for (const e of this.etq) e.w = 0; return this.recursosOn; }
  get ancho() { return this.V.upx * 390; }   // ancho que se vería en un móvil de 390 px, en decenas de km (la «altura» del zoom)
  vista(n, ms) { const v = typeof n === 'string' ? (VISTAS[n] || POLIS.find(p => p.id === n) || VISTAS.corazon) : n; this.irA(X(v.lon), Z(v.lat), (v.a || 0.5) / 390, ms || 0); }
  irA(x, z, upx, ms) { if (!ms) { this.V.x = x; this.V.z = z; if (upx) this.V.upx = upx; this.anim = null; this.vel.x = this.vel.z = 0; return; }
    this.anim = { x0: this.V.x, z0: this.V.z, u0: Math.log(this.V.upx), x1: x, z1: z, u1: Math.log(upx || this.V.upx), t0: performance.now(), ms }; }
  /* escala gráfica: cuántos km son 100 px de pantalla */
  kmPor100px() { return this.V.upx * 1000; }
  info() { const i = this.r.info; return { arranqueMs: this.arranqueMs, triangulos: i.render.triangles, llamadas: i.render.calls, texturas: i.memory.textures, geometrias: i.memory.geometries, msPorCuadro: +(this.medida.ms / Math.max(1, this.medida.n)).toFixed(1), cuadros: this.medida.n, dpr: this.dpr, ancho: +this.ancho.toFixed(2), estilo: this.est }; }
  medir() { this.medida.n = 0; this.medida.ms = 0; }

  /* ---------- ríos, caminos y cercos de las comarcas ---------- */
  _lineas() {
    const aXZ = l => l.map(q => [X(q[0]), Z(q[1])]);
    this.rios = new THREE.Mesh(cintas(RIOS.map(r => ({ p: suave(aXZ(r.l), 1), w: 0.55 + 0.35 * r.w }))), materialLinea(this.com, { ancho: 0.006, minPx: 1.7, color: '#5fa2bd', borde: '#2c5a70' }));
    this.caminos = new THREE.Mesh(cintas(CAMINOS.map(c => ({ p: suave(aXZ(c), 3), w: 1 }))), materialLinea(this.com, { ancho: 0.0022, minPx: 1.8, color: '#e6d2a2', borde: '#6a543a' }));
    const aros = ZONAS.map(z => { const p = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; p.push([X(z.lon) + Math.cos(a) * z.r / 10, Z(z.lat) + Math.sin(a) * z.r / 10]); } return { p, w: 1, z }; });
    this.cercos = new THREE.Group(); this.cercos.visible = false;
    for (const t in BASICOS) { const m = new THREE.Mesh(cintas(aros.filter(a => a.z.t === t)), materialLinea(this.com, { ancho: 0, minPx: 2.6, color: BASICOS[t].color, opacidad: 0.9, trazo: 4, alza: 2.5 })); m.frustumCulled = false; m.renderOrder = 3; this.cercos.add(m); }
    for (const m of [this.rios, this.caminos]) { m.frustumCulled = false; m.renderOrder = 2; this.escena.add(m); } this.escena.add(this.cercos); this._estiloLineas();
  }
  _estiloLineas() { const E = ESTILOS[this.est], pon = (m, o) => { const u = m.material.uniforms; u.uColor.value.copy(new THREE.Color().setRGB(...hex(o.color), THREE.LinearSRGBColorSpace)); u.uColor2.value.copy(new THREE.Color().setRGB(...hex(o.borde), THREE.LinearSRGBColorSpace)); u.uOpacidad.value = o.opacidad; u.uTrazo.value = o.trazo || 0; u.uMinPx.value = o.minPx || 1.8; if (m.userData.ancho0 === undefined) m.userData.ancho0 = u.uAncho.value; u.uAncho.value = o.ancho || m.userData.ancho0; };
    pon(this.rios, E.rio); pon(this.caminos, E.camino); }

  /* ---------- rótulos (HTML: nítidos a 390 px) ---------- */
  _rotulos() {
    this.etq = []; const pon = (html, clase, x, z, pri, rango) => { const d = document.createElement('div'); d.className = 'mg-e ' + clase; d.innerHTML = html; d.style.display = 'none'; this.rot.appendChild(d); const e = { d, x, z, pri, rango, w: 0, h: 0, alza: 0, ancla: 'centro', visto: false }; this.etq.push(e); return e; };
    for (const p of POLIS) { const e = pon('<b style="--c:' + p.color + '"></b><span>' + p.n + '</span><i class="lujo" style="--c:' + LUJOS[p.lujo].color + '">' + ICONOS[p.lujo] + '</i>', 'mg-polis pri' + p.pri, X(p.lon), Z(p.lat), p.pri, [0, 1e3]);
      e.polis = p; e.ancla = p.et || 'arriba'; e.d.dataset.polis = p.id; e.d.addEventListener('click', ev => { ev.stopPropagation(); if (this.o.onPolis) this.o.onPolis(p); }); }
    for (const z of ZONAS) { const e = pon('<i style="--c:' + BASICOS[z.t].color + '">' + ICONOS[z.t] + '</i><span>' + z.n + '</span>', 'mg-zona', X(z.lon), Z(z.lat), 4, [Math.max(0.6, z.r / 14), 1e3]); e.zona = z; }
    const PRI = { region: 5, mar: 5, islaG: 6, comarca: 6, golfo: 7, monte: 7, isla: 7, lugar: 8 };
    for (const l of LUGARES) pon('<span>' + l.n + '</span>', 'mg-l ' + l.c + (l.s ? ' s-' + l.s : ''), X(l.lon), Z(l.lat), PRI[l.c], l.a || CLASES[l.c]).lugar = l;
    this.etq.sort((a, b) => a.pri - b.pri);
  }
  _pintaRotulos(w, h) {
    const a = this.ancho, cajas = this.o.huecos ? this.o.huecos().slice() : [], v3 = this._v3, ky = this.com.uKy.value, alzaPolis = this.vida.alzaRotulo();
    for (const e of this.etq) {
      let ver = a >= e.rango[0] && a <= e.rango[1] && (!e.zona || this.recursosOn);
      if (ver) { v3.set(e.x, Math.max(0, this.rel.altura(e.x, e.z)) * ky + (e.polis ? alzaPolis : 0), e.z).project(this.cam); if (v3.z > 1) ver = false; }
      if (ver) { const x = (v3.x * 0.5 + 0.5) * w, y = (-v3.y * 0.5 + 0.5) * h; let an = e.ancla;
        if (!e.w) { e.d.classList.remove('compacta'); e.d.style.display = ''; e.w = e.d.offsetWidth; e.h = e.d.offsetHeight; e.visto = true; }
        const compacta = e.zona && a > e.zona.r * 0.9, bw = compacta ? 24 : e.w, sep = e.polis ? clamp(this.vida.radioPolisPx(), 10, 46) : 0;
        if (an === 'izq' && x - sep - bw < 4) an = 'der'; else if (an === 'der' && x + sep + bw > w - 4) an = 'izq';
        const c = an === 'izq' ? [x - sep - bw, y - e.h / 2, x - sep, y + e.h / 2] : an === 'der' ? [x + sep, y - e.h / 2, x + sep + bw, y + e.h / 2] : an === 'abajo' ? [x - bw / 2, y + sep * 0.6 + 4, x + bw / 2, y + sep * 0.6 + 4 + e.h] : an === 'arriba' ? [x - bw / 2, y - sep * 0.6 - e.h, x + bw / 2, y - sep * 0.6] : [x - bw / 2, y - e.h / 2, x + bw / 2, y + e.h / 2];
        const m = this.o.margen || [44, 8, 60, 8];   // arriba, derecha, abajo, izquierda: sitio de los botones de la pantalla
        if (c[2] < m[3] || c[0] > w - m[1] || c[1] < m[0] || c[3] > h - m[2]) ver = false;
        else if (!e.polis && (c[0] < 2 || c[2] > w - 2)) ver = false;
        else { const choca = q => { for (const o of cajas) if (q[0] < o[2] + 3 && q[2] > o[0] - 3 && q[1] < o[3] + 2 && q[3] > o[1] - 2) return true; return false; };
          if (choca(c)) { ver = false; if (e.zona) for (const d of DESVIOS) { const q = [c[0] + d[0], c[1] + d[1], c[2] + d[0], c[3] + d[1]]; if (q[0] > 2 && q[2] < w - 2 && q[1] > m[0] && q[3] < h - m[2] && !choca(q)) { c[0] = q[0]; c[1] = q[1]; c[2] = q[2]; c[3] = q[3]; ver = true; break; } } } }
        if (ver) { cajas.push(c); if (e.zona) e.d.classList.toggle('compacta', !!compacta); const tr = 'translate(' + Math.round(c[0]) + 'px,' + Math.round(c[1]) + 'px)'; if (e.tr !== tr) { e.tr = tr; e.d.style.transform = tr; } } }
      if (ver !== e.visto) { e.visto = ver; e.d.style.display = ver ? '' : 'none'; }
    }
  }

  /* ---------- dedos: arrastrar, pellizcar (anclado bajo los dedos), inercia, doble toque y rueda ---------- */
  _dedos() {
    const cv = this.cv, D = new Map(); let pell = 0, ultimo = 0, ux = 0, uy = 0, movido = 0, tPrev = 0, tx0 = 0, ty0 = 0;
    const sinEl = () => Math.sin(this._el || 1), punto = (cx, cy) => { const r = cv.getBoundingClientRect(); return [cx - r.left - r.width / 2, cy - r.top - r.height / 2]; };
    const zoom = (f, cx, cy) => { const [ox, oy] = punto(cx, cy), u0 = this.V.upx, u1 = clamp(u0 * f, UPX_MIN, this._upxMax || 0.2); this.V.x += ox * (u0 - u1); this.V.z += oy * (u0 - u1) / sinEl(); this.V.upx = u1; };
    cv.addEventListener('pointerdown', e => { D.set(e.pointerId, [e.clientX, e.clientY]); try { cv.setPointerCapture(e.pointerId); } catch (x) {} pell = 0; movido = 0; this.anim = null; this.vel.x = this.vel.z = 0; tPrev = performance.now(); });
    cv.addEventListener('pointermove', e => { const a = D.get(e.pointerId); if (!a) return; const dx = e.clientX - a[0], dy = e.clientY - a[1]; D.set(e.pointerId, [e.clientX, e.clientY]); movido += Math.abs(dx) + Math.abs(dy);
      if (D.size === 1) { const k = this.V.upx, mx = -dx * k, mz = -dy * k / sinEl(), ahora = performance.now(), dt = Math.max(8, ahora - tPrev); tPrev = ahora; this.V.x += mx; this.V.z += mz; this.vel.x = mix(this.vel.x, mx / dt, 0.5); this.vel.z = mix(this.vel.z, mz / dt, 0.5); }
      else if (D.size === 2) { const q = [...D.values()], d = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]), cx = (q[0][0] + q[1][0]) / 2, cy = (q[0][1] + q[1][1]) / 2;
        if (pell && d > 1) { zoom(pell / d, cx, cy); this.V.x -= (cx - ux) * this.V.upx; this.V.z -= (cy - uy) * this.V.upx / sinEl(); } pell = d; ux = cx; uy = cy; this.vel.x = this.vel.z = 0; } });
    const suelta = e => { if (!D.has(e.pointerId)) return; D.delete(e.pointerId); pell = 0; const ahora = performance.now();
      if (D.size === 0 && movido < 8) { this.vel.x = this.vel.z = 0; if (ahora - ultimo < 320 && Math.hypot(e.clientX - tx0, e.clientY - ty0) < 40) { const [ox, oy] = punto(e.clientX, e.clientY), u1 = clamp(this.V.upx / 2.2, UPX_MIN, 1); this.irA(this.V.x + ox * (this.V.upx - u1), this.V.z + oy * (this.V.upx - u1) / sinEl(), u1, 320); ultimo = 0; } else { ultimo = ahora; tx0 = e.clientX; ty0 = e.clientY; if (this.o.onToque) this.o.onToque(); } }
      else if (D.size === 0 && ahora - tPrev > 90) this.vel.x = this.vel.z = 0; };
    cv.addEventListener('pointerup', suelta); cv.addEventListener('pointercancel', e => { D.delete(e.pointerId); pell = 0; this.vel.x = this.vel.z = 0; });
    cv.addEventListener('wheel', e => { e.preventDefault(); this.anim = null; zoom(Math.exp(clamp(e.deltaY, -120, 120) * 0.0022), e.clientX, e.clientY); }, { passive: false });
  }

  /* ---------- cámara ---------- */
  _colocar(dt) {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1, V = this.V, R = this.r;
    if (this._w !== w || this._h !== h || this._dpr !== this.dpr) { this._w = w; this._h = h; this._dpr = this.dpr; R.setPixelRatio(this.dpr); R.setSize(w, h, false); }
    if (this.anim) { const A = this.anim, f = clamp((performance.now() - A.t0) / A.ms, 0, 1), s = f * f * (3 - 2 * f); V.x = mix(A.x0, A.x1, s); V.z = mix(A.z0, A.z1, s); V.upx = Math.exp(mix(A.u0, A.u1, s)); if (f >= 1) this.anim = null; }
    else if (this.vel.x || this.vel.z) { V.x += this.vel.x * dt; V.z += this.vel.z * dt; const k = Math.exp(-dt / 260); this.vel.x *= k; this.vel.z *= k; if (Math.abs(this.vel.x) + Math.abs(this.vel.z) < V.upx * 0.01) this.vel.x = this.vel.z = 0; }
    const lz = Math.log(V.upx * 390), el = mix(EL_CERCA, EL_LEJOS, paso(Math.log(1.2), Math.log(60), lz)); this._el = el;
    this._upxMax = Math.min(ANCHO / w, FONDO * 1.8 * Math.sin(el) / h); V.upx = clamp(V.upx, UPX_MIN, this._upxMax);
    const mx = Math.min(ANCHO / 2, w * V.upx * 0.42), mz = Math.min(FONDO / 2, h * V.upx / Math.sin(el) * 0.42); V.x = clamp(V.x, XI + mx, XI + ANCHO - mx); V.z = clamp(V.z, ZN + mz * 0.86, ZN + FONDO - Math.min(mz, FONDO * 0.35));
    const a = V.upx * 390, ky = mix(KY_CERCA, KY_LEJOS, paso(Math.log(4), Math.log(40), Math.log(a))), U = this.com;
    U.uKy.value = ky; U.uPx.value = V.upx; U.uCerca.value = 1 - paso(0.004, 0.02, V.upx);
    const cam = this.cam, d = h * V.upx / (2 * Math.tan(FOV * Math.PI / 360)), yT = Math.max(0, this.rel.altura(V.x, V.z)) * ky;
    cam.aspect = w / h; cam.near = d * 0.08; cam.far = d * 6 + 30; cam.position.set(V.x, yT + d * Math.sin(el), V.z + d * Math.cos(el)); cam.lookAt(V.x, yT, V.z); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    /* la malla del suelo cubre lo que se ve (más un margen: lo de arriba queda más lejos y abarca más) */
    this.suelo.rejilla(V.x, V.z - h * V.upx / Math.sin(el) * 0.12, w * V.upx * 1.5, h * V.upx / Math.sin(el) * 1.55, w > h);
    return [w, h];
  }
  _cuadro(ahora) {
    this._raf = requestAnimationFrame(this._cuadro); const t0 = performance.now(), dt = Math.min(100, ahora - (this._ult || ahora)); this._ult = ahora;
    this.t = this.o.tFijo !== undefined ? this.o.tFijo : (ahora - this.t0) / 1000; this.com.t.value = this.t;
    const [w, h] = this._colocar(dt); this.vida.cuadro(this.t, dt, w, h);
    this.r.render(this.escena, this.cam); this._pintaRotulos(w, h);
    if (this.o.onCambio) this.o.onCambio(this);
    /* fluidez: si el móvil no llega, se pinta con menos puntos (nunca al revés de golpe) */
    const ms = performance.now() - t0; this.medida.n++; this.medida.ms += ms;
    if (!this.o.calidadFija) { this.medida.lento = dt > 40 ? this.medida.lento + 1 : Math.max(0, this.medida.lento - 2); if (this.medida.lento > 45 && this.dpr > 1) { this.dpr = Math.max(1, this.dpr - 0.25); this.medida.lento = 0; } }
  }
}
function hex(c) { return [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255]; }
export { POLIS, ZONAS, BASICOS, LUJOS, VISTAS, ESTILOS, LON, LAT };
