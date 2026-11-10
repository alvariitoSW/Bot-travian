/* AQVILA — modelos 3D procedurales (soldados, caballos, elefantes) y su animación por shader */
import * as THREE from '../vendor/three.module.min.js';
export { THREE };

export const uTime = { value: 0 };

/* ---------- constructor de geometría con color y «huesos» por vértice ---------- */
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.rig = []; }
  // rig: [tipo (0 fijo, 1 pierna, 2 brazo), pivoteY, pivoteZ, signo]
  add(geo, col, rig) {
    const g = geo.index ? geo.toNonIndexed() : geo, pos = g.attributes.position, nor = g.attributes.normal, c = new THREE.Color(col), r = rig || [0, 0, 0, 0];
    for (let i = 0; i < pos.count; i++) {
      this.p.push(pos.getX(i), pos.getY(i), pos.getZ(i)); this.n.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      this.c.push(c.r, c.g, c.b); this.rig.push(r[0], r[1], r[2], r[3]);
    }
    return this;
  }
  box(w, h, d, x, y, z, col, rig, rx, rz) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz);
    g.translate(x, y, z); return this.add(g, col, rig);
  }
  cyl(rt, rb, h, seg, x, y, z, col, rig, rx, rz, sc) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    if (sc) g.scale(sc[0], sc[1], sc[2]); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz);
    g.translate(x, y, z); return this.add(g, col, rig);
  }
  sph(r, x, y, z, col, rig, sc, ws, hs) { const g = new THREE.SphereGeometry(r, ws || 6, hs || 5); if (sc) g.scale(sc[0], sc[1], sc[2]); g.translate(x, y, z); return this.add(g, col, rig); }
  dome(r, x, y, z, col) { const g = new THREE.SphereGeometry(r, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(x, y, z); return this.add(g, col); }
  // casquete que mira hacia +z (escudos redondos)
  cap(r, depth, x, y, z, col, sc) { const R = r / Math.sin(depth * 1.6), g = new THREE.SphereGeometry(R, 9, 3, 0, Math.PI * 2, 0, depth * 1.6); g.translate(0, -R * Math.cos(depth * 1.6), 0); g.scale(1, 0.45, 1); g.rotateX(Math.PI / 2); if (sc) g.scale(sc[0], sc[1], sc[2]); g.translate(x, y, z); return this.add(g, col); }
  // sector de cilindro abierto centrado en +z (escudo curvo, capa)
  arc(r, h, t0, tl, x, y, z, col) { const g = new THREE.CylinderGeometry(r, r, h, Math.max(3, Math.round(tl * 5)), 1, true, t0, tl); g.translate(x, y, z); return this.add(g, col); }
  // cimera en abanico
  fan(r, ry, x, y, z, col) { const g = new THREE.CylinderGeometry(r, r, 0.045, 7, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); g.rotateX(-Math.PI / 2); g.rotateY(ry + Math.PI / 2); g.translate(x, y, z); return this.add(g, col); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('rig', new THREE.Float32BufferAttribute(this.rig, 4));
    g.computeBoundingSphere(); g.boundingSphere.radius += 3;
    return g;
  }
}

const SKIN = '#d9a57c', BRONZE = '#c79a3e', IRON = '#9aa0a8', LEATHER = '#6b4a2c', WOOD = '#7a5a36', LINEN = '#e9e2cf', STEEL = '#d5d9de';

/* Aspecto de cada unidad. shield: scutum|round|oval|small|none · armor: bronze|mail|linen|tunic|bare
   helm: bronze|iron|hat|skin|none · weapon: sword|long|spear|sarissa|javelin|sling|club */
export const LOOK = {
  hastati: { shield: 'scutum', armor: 'tunic', chest: BRONZE, helm: 'bronze', weapon: 'sword' },
  principes: { shield: 'scutum', armor: 'mail', helm: 'bronze', crest: '#1c1c1c', weapon: 'sword' },
  triarii: { shield: 'scutum', armor: 'mail', helm: 'bronze', crest: '#f2efe6', crestT: 1, weapon: 'spear', greaves: 1 },
  velites: { shield: 'small', armor: 'tunic', helm: 'skin', weapon: 'javelin' },
  vigiles: { shield: 'small', armor: 'tunic', helm: 'none', weapon: 'club' },
  equites: { mount: '#6b4630', shield: 'small', armor: 'mail', helm: 'bronze', crest: '#b3261e', weapon: 'spear' },
  general: { mount: '#e9e6df', shield: 'none', armor: 'bronze', helm: 'bronze', crest: '#c8102e', crestT: 1, cloak: '#b3151c', weapon: 'sword' },
  milicia: { shield: 'small', armor: 'tunic', helm: 'none', weapon: 'spear' },
  hoplitas: { shield: 'round', armor: 'linen', helm: 'bronze', crest: '#f2efe6', weapon: 'spear', greaves: 1 },
  falange: { shield: 'small', armor: 'linen', helm: 'bronze', weapon: 'sarissa' },
  peltastas: { shield: 'small', armor: 'tunic', helm: 'hat', weapon: 'javelin' },
  honderos: { shield: 'none', armor: 'tunic', tunic: LINEN, helm: 'none', weapon: 'sling' },
  libios: { shield: 'oval', shieldCol: LINEN, armor: 'linen', helm: 'bronze', weapon: 'spear' },
  iberos: { shield: 'oval', armor: 'tunic', tunic: LINEN, helm: 'hat', weapon: 'sword' },
  galos: { shield: 'oval', armor: 'bare', helm: 'none', hair: '#c9a24a', legs: '#4a6a8c', weapon: 'long' },
  sagrada: { shield: 'round', shieldCol: '#f4f1e8', armor: 'bronze', helm: 'bronze', crest: '#f4f1e8', weapon: 'spear', greaves: 1 },
  jinetes: { mount: '#5a3c26', shield: 'small', armor: 'tunic', helm: 'bronze', weapon: 'spear' },
  numidas: { mount: '#8a6a48', shield: 'small', armor: 'tunic', tunic: LINEN, helm: 'none', hair: '#1a1410', skin: '#8a5a3c', weapon: 'javelin' },
  tesalios: { mount: '#3a2a20', shield: 'none', armor: 'bronze', helm: 'bronze', crest: '#f2efe6', cloak: 1, weapon: 'spear' },
  elefantes: { elephant: 1 }
};

function human(b, L, col, oy, oz, mounted) {
  const skin = L.skin || SKIN, tunic = L.tunic || col, y = oy || 0, z = oz || 0, PI = Math.PI;
  const legCol = L.legs || (L.greaves ? BRONZE : skin);
  if (!mounted) {
    for (const [x, sg] of [[-0.1, 1], [0.1, -1]]) {
      const R = [1, 0.86 + y, z, sg];
      b.cyl(0.09, 0.062, 0.84, 6, x, 0.44 + y, z, legCol, R); b.box(0.12, 0.07, 0.25, x, 0.035 + y, z + 0.05, LEATHER, R);
    }
  } else for (const x of [-0.3, 0.3]) { b.cyl(0.09, 0.065, 0.7, 6, x, 0.52 + y, z + 0.1, legCol, null, 0.35); b.box(0.11, 0.07, 0.22, x, 0.2 + y, z + 0.28, LEATHER); }
  // túnica, cinturón y torso
  b.cyl(0.2, 0.275, 0.36, 8, 0, 0.84 + y, z, L.armor === 'bare' ? (L.legs || tunic) : tunic);
  const torso = L.armor === 'bronze' ? BRONZE : L.armor === 'mail' ? IRON : L.armor === 'linen' ? LINEN : L.armor === 'bare' ? skin : tunic;
  b.cyl(0.25, 0.2, 0.56, 8, 0, 1.24 + y, z, torso, null, 0, 0, [1, 1, 0.7]);
  b.cyl(0.215, 0.215, 0.07, 8, 0, 0.99 + y, z, LEATHER, null, 0, 0, [1, 1, 0.72]);
  if (L.chest) b.box(0.22, 0.22, 0.05, 0, 1.3 + y, z + 0.155, L.chest);
  if (L.armor === 'mail' || L.armor === 'bronze') { b.sph(0.115, -0.25, 1.44 + y, z, torso); b.sph(0.115, 0.25, 1.44 + y, z, torso); }
  if (L.armor === 'linen') for (let i = 0; i < 6; i++) b.box(0.07, 0.16, 0.03, Math.sin(i * 1.05) * 0.24, 0.88 + y, z + Math.cos(i * 1.05) * 0.2, LINEN);
  if (L.cloak) b.arc(0.3, 0.95, -PI - 0.9, 1.8, 0, 1.05 + y, z + 0.05, L.cloak === 1 ? col : L.cloak);
  // cabeza y casco
  b.cyl(0.06, 0.07, 0.1, 6, 0, 1.54 + y, z, skin); b.sph(0.125, 0, 1.67 + y, z, skin);
  if (L.helm === 'bronze' || L.helm === 'iron') {
    const hc = L.helm === 'bronze' ? BRONZE : IRON;
    b.dome(0.148, 0, 1.68 + y, z, hc); b.box(0.24, 0.035, 0.1, 0, 1.6 + y, z - 0.15, hc, null, 0.5); b.box(0.035, 0.13, 0.09, -0.13, 1.61 + y, z + 0.05, hc); b.box(0.035, 0.13, 0.09, 0.13, 1.61 + y, z + 0.05, hc);
    if (L.crest) b.fan(0.21, L.crestT ? PI / 2 : 0, 0, 1.8 + y, z, L.crest);
  } else if (L.helm === 'hat') b.cyl(0.03, 0.21, 0.13, 8, 0, 1.8 + y, z, LEATHER);
  else if (L.helm === 'skin') { b.dome(0.15, 0, 1.68 + y, z, '#7d7468'); b.box(0.2, 0.34, 0.05, 0, 1.47 + y, z - 0.16, '#7d7468'); b.box(0.05, 0.07, 0.05, -0.08, 1.84 + y, z, '#7d7468'); b.box(0.05, 0.07, 0.05, 0.08, 1.84 + y, z, '#7d7468'); }
  else b.dome(0.135, 0, 1.69 + y, z, L.hair || '#3a2a1c');
  // brazo izquierdo y escudo
  b.cyl(0.055, 0.045, 0.52, 5, -0.28, 1.24 + y, z + 0.1, skin, null, -0.55);
  const sc = L.shieldCol || col, sx = -0.3, sz = z + 0.27;
  if (L.shield === 'scutum') {
    b.arc(0.42, 1.02, -0.6, 1.2, sx, 1.06 + y, sz - 0.42, sc); b.arc(0.425, 0.05, -0.6, 1.2, sx, 1.57 + y, sz - 0.42, BRONZE); b.arc(0.425, 0.05, -0.6, 1.2, sx, 0.55 + y, sz - 0.42, BRONZE);
    b.arc(0.426, 0.86, -0.07, 0.14, sx, 1.06 + y, sz - 0.42, '#e3b54a'); b.arc(0.426, 0.1, -0.38, 0.76, sx, 1.06 + y, sz - 0.42, '#e3b54a'); b.sph(0.075, sx, 1.06 + y, sz + 0.01, BRONZE);
  } else if (L.shield === 'round') { b.cap(0.47, 0.5, sx, 1.15 + y, sz - 0.02, BRONZE); b.cap(0.4, 0.42, sx, 1.15 + y, sz + 0.01, sc); }
  else if (L.shield === 'oval') { b.cap(0.36, 0.4, sx, 1.08 + y, sz, sc, [0.85, 1.65, 1]); b.box(0.06, 0.9, 0.05, sx, 1.08 + y, sz + 0.06, WOOD); b.sph(0.07, sx, 1.08 + y, sz + 0.07, IRON); }
  else if (L.shield === 'small') { b.cap(0.27, 0.4, sx, 1.2 + y, sz - 0.03, sc); b.sph(0.06, sx, 1.2 + y, sz + 0.03, BRONZE); }
  // brazo derecho + arma (animados)
  const A = [2, 1.45 + y, z, 1], ax = 0.3;
  b.cyl(0.058, 0.046, 0.54, 5, ax, 1.19 + y, z, skin, A); b.sph(0.055, ax, 0.9 + y, z + 0.02, skin, A);
  const w = L.weapon;
  if (w === 'sword') { b.box(0.05, 0.02, 0.52, ax, 0.92 + y, z + 0.34, STEEL, A); b.box(0.15, 0.04, 0.04, ax, 0.92 + y, z + 0.08, BRONZE, A); }
  else if (w === 'long') b.box(0.055, 0.02, 0.9, ax, 0.92 + y, z + 0.5, STEEL, A);
  else if (w === 'club') b.cyl(0.05, 0.03, 0.6, 5, ax, 0.92 + y, z + 0.3, WOOD, A, PI / 2);
  else if (w === 'spear') { b.cyl(0.022, 0.022, 2.4, 4, ax, 1.45 + y, z + 0.12, WOOD, A, 0.12); b.cyl(0.001, 0.045, 0.26, 4, ax, 2.75 + y, z + 0.28, STEEL, A, 0.12); }
  else if (w === 'sarissa') { b.cyl(0.024, 0.024, 4.8, 4, ax, 2.25 + y, z + 0.5, WOOD, A, 0.32); b.cyl(0.001, 0.05, 0.32, 4, ax, 4.65 + y, z + 1.3, STEEL, A, 0.32); }
  else if (w === 'javelin') { b.cyl(0.018, 0.018, 1.5, 4, ax, 1.5 + y, z + 0.1, WOOD, A, 0.5); b.cyl(0.001, 0.035, 0.22, 4, ax, 2.23 + y, z + 0.5, STEEL, A, 0.5); }
  else if (w === 'sling') b.cyl(0.015, 0.015, 0.5, 4, ax, 0.72 + y, z + 0.08, LEATHER, A, 0.3);
}

function horse(b, col) {
  const dark = new THREE.Color(col).multiplyScalar(0.62).getStyle(), PI = Math.PI;
  b.sph(1, 0, 1.22, 0, col, null, [0.3, 0.34, 0.82], 8, 6);
  b.cyl(0.14, 0.24, 0.85, 7, 0, 1.68, 0.74, col, null, 0.75); b.cyl(0.085, 0.13, 0.52, 6, 0, 2.0, 1.17, col, null, 1.95);
  b.box(0.04, 0.09, 0.05, -0.06, 2.2, 1.0, col); b.box(0.04, 0.09, 0.05, 0.06, 2.2, 1.0, col);
  b.box(0.05, 0.62, 0.14, 0, 1.82, 0.6, dark, null, 0.75); b.cyl(0.07, 0.02, 0.75, 5, 0, 1.05, -0.92, dark, null, -0.35);
  for (const [x, z, s] of [[-0.16, 0.55, 1], [0.16, 0.55, -1], [-0.16, -0.58, -1], [0.16, -0.58, 1]]) { const R = [1, 1.0, z, s]; b.cyl(0.085, 0.045, 1.0, 5, x, 0.5, z, col, R); b.cyl(0.055, 0.06, 0.1, 5, x, 0.05, z, '#221a14', R); }
  b.box(0.62, 0.05, 0.62, 0, 1.56, -0.05, '#7d1712'); b.box(0.5, 0.06, 0.4, 0, 1.6, -0.05, LEATHER);
}

function elephant(b, col) {
  const G = '#7b766f', GD = '#635e58', PI = Math.PI;
  b.sph(1, 0, 2.35, 0, G, null, [0.98, 1.02, 1.6], 9, 7); b.sph(1, 0, 2.7, 1.75, G, null, [0.7, 0.78, 0.72], 8, 6);
  b.cyl(0.62, 0.62, 0.08, 8, -0.8, 2.75, 1.5, GD, null, 0, PI / 2 - 0.35); b.cyl(0.62, 0.62, 0.08, 8, 0.8, 2.75, 1.5, GD, null, 0, PI / 2 + 0.35);
  b.cyl(0.24, 0.1, 1.8, 6, 0, 1.55, 2.5, GD, [2, 2.4, 2.35, 0.3]);
  b.cyl(0.07, 0.02, 0.95, 5, -0.34, 1.95, 2.75, '#f1ead8', null, PI / 2 - 0.35); b.cyl(0.07, 0.02, 0.95, 5, 0.34, 1.95, 2.75, '#f1ead8', null, PI / 2 - 0.35);
  for (const [x, z, s] of [[-0.55, 1.0, 1], [0.55, 1.0, -1], [-0.55, -1.0, -1], [0.55, -1.0, 1]]) b.cyl(0.3, 0.27, 1.6, 7, x, 0.8, z, GD, [1, 1.6, z, s * 0.55]);
  b.box(2.05, 0.5, 2.1, 0, 3.15, -0.1, col); b.box(2.07, 0.08, 2.12, 0, 2.9, -0.1, '#e3b54a');
  b.box(1.4, 0.85, 1.5, 0, 3.75, -0.1, WOOD); b.box(1.5, 0.12, 1.6, 0, 4.2, -0.1, col);
  for (const x of [-0.72, 0.72]) for (const z of [-0.85, 0.65]) b.box(0.12, 0.3, 0.12, x, 4.35, z, WOOD);
  human(b, { shield: 'none', armor: 'tunic', helm: 'bronze', weapon: 'javelin' }, col, 2.95, -0.1, true);
  human(b, { shield: 'none', armor: 'tunic', helm: 'none', weapon: 'club' }, col, 2.15, 1.45, true);
}

const geoCache = new Map();
export function unitGeometry(key, col) {
  const id = key + col; if (geoCache.has(id)) return geoCache.get(id);
  const L = LOOK[key] || LOOK.milicia, b = new Builder();
  if (L.elephant) elephant(b, col);
  else if (L.mount) { horse(b, L.mount); human(b, L, col, 0.72, -0.05, true); }
  else human(b, L, col, 0, 0, false);
  const g = b.build(); geoCache.set(id, g); return g;
}

/* Material con animación en el shader de vértices: piernas que caminan y brazos que golpean.
   anim (por instancia): x = marcha, y = ataque, z = fase */
let mat = null;
export function unitMaterial() {
  if (mat) return mat;
  mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'attribute vec4 rig;\nattribute vec3 anim;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `
      vec3 transformed = vec3(position);
      float ph = anim.z;
      if (rig.x > 0.5) {
        float a = 0.0;
        if (rig.x < 1.5) a = sin(uTime * 9.0 + ph) * anim.x * 0.75 * rig.w;
        else a = -anim.y * (0.35 + 1.1 * max(0.0, sin(uTime * 6.5 + ph * 3.7))) * rig.w - sin(uTime * 9.0 + ph) * anim.x * 0.25;
        vec3 q = transformed - vec3(0.0, rig.y, rig.z);
        float c = cos(a), s = sin(a);
        q.yz = vec2(c * q.y - s * q.z, s * q.y + c * q.z);
        transformed = q + vec3(0.0, rig.y, rig.z);
      }
      transformed.y += abs(sin(uTime * 9.0 + ph)) * 0.05 * anim.x;
      transformed.z += max(0.0, sin(uTime * 6.5 + ph * 3.7)) * 0.12 * anim.y;
    `);
  };
  return mat;
}

/* Retratos de unidad para la interfaz (se dibujan una vez y se guardan como imagen) */
const portraits = new Map(); let pr = null;
export function portrait(key, col) {
  const id = key + col; if (portraits.has(id)) return portraits.get(id);
  let url = '';
  try {
    if (!pr) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(220, 220, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e0', '#4a3a30', 1.6)); const d = new THREE.DirectionalLight('#fff', 3); d.position.set(3, 4, 5); sc.add(d);
      pr = { r: r, sc: sc, cam: new THREE.PerspectiveCamera(30, 1, 0.1, 50), mesh: null };
    }
    const L = LOOK[key] || {}, g = unitGeometry(key, col);
    if (!g.attributes.anim) g.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array([0, 0.25, 1]), 3));
    const m = new THREE.Mesh(g, unitMaterial()); m.rotation.y = 0.55;
    pr.sc.add(m);
    if (L.elephant) { pr.cam.position.set(0, 3.6, 15); pr.cam.lookAt(0, 2.7, 0.4); }
    else if (L.mount) { pr.cam.position.set(0, 2.0, 7.2); pr.cam.lookAt(0, 1.55, 0.1); }
    else { pr.cam.position.set(0, 1.55, 4.0); pr.cam.lookAt(0, 1.25, 0); }
    pr.r.render(pr.sc, pr.cam); url = pr.r.domElement.toDataURL('image/png'); pr.sc.remove(m);
  } catch (e) { url = ''; }
  portraits.set(id, url); return url;
}
