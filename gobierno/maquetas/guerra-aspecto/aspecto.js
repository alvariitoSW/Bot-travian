/* Maqueta GM32 «aspecto» — mejoras SOLO de aspecto sobre guerra-arte (GM4). No cambian reglas (reglas.js y formacion.js son idénticos).
   Interruptor: ?aspecto=0 lo apaga todo (igual que guerra-arte); ?sin=suelo,aire,filas,color,sombra,camara apaga una mejora sola.
   Botón «Aspecto: nuevo / de antes» arriba a la derecha: recarga con el otro valor. Arte: el mismo de 0 A.D. (Wildfire Games, CC BY-SA 3.0). */
import { THREE } from '../../../js/gfx/models.js';
import * as GE from './gentio.js';   /* GM33 */

const Q = new URLSearchParams(location.search), TODO = ['suelo', 'aire', 'filas', 'color', 'sombra', 'camara'];
const SIN = new Set((Q.get('sin') || '').split(',').map(s => s.trim()).filter(Boolean)), GENERAL = Q.get('aspecto') !== '0';
export const ON = Object.fromEntries(TODO.map(k => [k, GENERAL && !SIN.has(k)]));
window.__aspecto = ON;

/* botón de arriba: recarga con el otro valor */
{ const b = document.createElement('button'); b.id = 'aspecto-b'; b.textContent = GENERAL ? 'Aspecto: nuevo' : 'Aspecto: de antes';
  b.style.cssText = 'position:absolute;right:calc(env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 50px);height:26px;padding:0 10px;border-radius:13px;background:rgba(18,15,11,.82);border:1px solid rgba(184,134,43,.55);font:600 11px system-ui,sans-serif;color:#e9c063;pointer-events:auto;z-index:5';
  b.onclick = () => { const u = new URL(location.href); if (GENERAL) u.searchParams.set('aspecto', '0'); else u.searchParams.delete('aspecto'); location.href = u.toString(); };
  const poner = () => (document.getElementById('hud') || document.body).appendChild(b); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner(); }

const parche = (txt, a, b) => { if (!txt.includes(a)) { console.warn('aspecto.js: no se encontró «' + a.slice(0, 50) + '»'); return txt; } return txt.replace(a, b); };

/* 4. color: el tinte de bando que se hornea en el atlas baja ~20 % de saturación (los estandartes siguen con su color vivo) */
export function colores(COLOR) {
  if (!ON.color) { GE.colores(COLOR); return; }
  for (let i = 0; i < COLOR.length; i++) { const c = new THREE.Color(COLOR[i]), h = {}; c.getHSL(h); c.setHSL(h.h, h.s * 0.8, Math.min(0.62, h.l * 1.08)); COLOR[i] = '#' + c.getHexString(); }
  GE.colores(COLOR);   /* GM33: rojo romano y azul cobalto, encima */
}

/* 3. filas (posición de cada hombre) y 4. color (por hombre) en los sombreadores del cartón y de su sombra */
export function carton(o, caido) {
  const mats = [o.malla.material]; if (o.malla.children[0]) mats.push(o.malla.children[0].material);
  for (const m of mats) {
    if (ON.filas && !caido) m.vertexShader = parche(m.vertexShader, 'vec2 loc = vec2((col - (enFila - 1.0) * 0.5) * uPaso.x + (h1 - 0.5) * 0.34, fila * uPaso.y + (h2 - 0.5) * 0.34);',
      `float borde = (col < 0.5 ? -1.0 : (col > enFila - 1.5 ? 1.0 : 0.0));
  float ondaF = sin(fila * 1.7 + uFiles * 0.37) * 0.11 * uPaso.x, ondaC = sin(col * 0.43 + fila * 0.61) * 0.13 * uPaso.y;   /* filas que ondulan un poco */
  vec2 loc = vec2((col - (enFila - 1.0) * 0.5) * uPaso.x + (h1 - 0.5) * 0.5 * uPaso.x + ondaF + borde * (h2 * 0.5 - 0.1) * uPaso.x,   /* cada hombre se desvía hasta ±0,25 del intervalo; el borde, algo más */
    fila * uPaso.y + (h2 - 0.5) * 0.5 * uPaso.y + ondaC);`);
  }
  if (ON.color) { const m = mats[0];
    m.fragmentShader = parche(m.fragmentShader, '(h.x - 0.5) * 0.24', '(h.x - 0.5) * 0.42');                        /* más variación de valor por hombre (±20 %) */
    if (!GE.ON) m.fragmentShader = parche(m.fragmentShader, 'vLejos * 0.42', 'vLejos * 0.28');                                  /* de lejos el tinte de bando pesa menos */
    m.fragmentShader = parche(m.fragmentShader, 'gl_FragColor = vec4(mix(c, uNieblaC, vNiebla), 1.0);',
      `{ float ll = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(vec3(ll), c, 0.84 - ${ON.aire ? '0.35' : '0.0'} * vNiebla); }
  gl_FragColor = vec4(mix(c, uNieblaC, vNiebla), 1.0);`); }
  else if (ON.aire) { const m = mats[0];
    m.fragmentShader = parche(m.fragmentShader, 'gl_FragColor = vec4(mix(c, uNieblaC, vNiebla), 1.0);', '{ float ll = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(c, vec3(ll), 0.35 * vNiebla); }\n  gl_FragColor = vec4(mix(c, uNieblaC, vNiebla), 1.0);'); }
}

/* 5. sombra: mancha oscura suave bajo cada bloque, con borde difuso e irregular */
export function regimiento(rg) {
  if (!ON.sombra) return;
  const g = new THREE.PlaneGeometry(1.3, 1.3).rotateX(-Math.PI / 2).translate(0, 0, 0.5), semilla = Math.random() * 20;
  rg.manto.geometry = g; rg.manto.material.dispose();
  rg.manto.material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uS: { value: semilla } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uS; void main() {
      vec2 q = (vUv - 0.5) * 2.0; float d = pow(abs(q.x), 3.0) + pow(abs(q.y), 3.0);
      d += 0.10 * sin(q.x * 6.0 + uS) * sin(q.y * 4.0 + uS * 1.7) + 0.06 * sin(q.x * 15.0 + q.y * 9.0 + uS);
      float a = (1.0 - smoothstep(0.30, 1.0, d)) * 0.5; if (a < 0.01) discard;
      gl_FragColor = vec4(0.07, 0.05, 0.03, a);
    }` });
}

/* 1. suelo (dos escalas giradas + manchas de tono + tierra pisada irregular) y 2. aire (niebla, cielo, colinas) */
const HORIZ_NUEVO = '#cdd6d9';
export function campo(o) {
  if (ON.suelo && o.suelo) { const m = o.suelo.material, prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); let f = sh.fragmentShader;
      f = parche(f, 'diffuseColor.rgb *= terr * macro * 1.05;', `
      vec2 u2 = (mat2(0.8, 0.6, -0.6, 0.8) * vXZ) * uScale * 0.41 + 3.7, u3 = (mat2(0.6, -0.8, 0.8, 0.6) * vXZ) * uScale * 0.17 + 9.1;
      vec3 terr2 = texture2D(tGrass, u2).rgb * w.r + texture2D(tDirt, u2 * 0.8).rgb * w.g + texture2D(tPave, u2 * 1.6).rgb * w.b + texture2D(tDry, u2).rgb * w4;
      vec3 terr3 = texture2D(tGrass, u3).rgb * w.r + texture2D(tDirt, u3 * 0.8).rgb * w.g + texture2D(tPave, u3 * 1.6).rgb * w.b + texture2D(tDry, u3).rgb * w4;
      vec3 terrM = terr * 0.42 + terr2 * 0.38 + terr3 * 0.20; float lm = dot(terrM, vec3(0.3, 0.59, 0.11)); terrM = (terrM - lm) * 1.25 + lm;        /* la misma textura a tres escalas giradas: no hay rayas que se repitan */
      float nb = texture2D(tRuido, vXZ / 15360.0 + 0.3).r * 0.6 + texture2D(tRuido, vXZ / 5760.0 + 0.7).g * 0.4;                              /* mancha grande: 50-200 m */
      nb = smoothstep(0.25, 0.75, nb); vec3 tono = mix(vec3(1.10, 1.02, 0.80), vec3(0.86, 1.06, 0.88), nb) * (0.86 + 0.28 * texture2D(tRuido, vXZ / 8960.0 + 0.1).b);
      diffuseColor.rgb *= terrM * tono * 1.05;`);
      f = parche(f, 'abs(vXZ.x) - uZ.x', 'abs(vXZ.x + (vn(vXZ * 0.07 + 40.0) - 0.5) * 22.0 + (vn(vXZ * 0.25 + 7.0) - 0.5) * 7.0) - uZ.x');          /* bordes de la tierra pisada: difusos e irregulares */
      f = parche(f, 'smoothstep(uZ.y - 12.0, uZ.y + 8.0, vXZ.y)', 'smoothstep(uZ.y - 12.0, uZ.y + 8.0, vXZ.y + (vn(vXZ * 0.07 + 70.0) - 0.5) * 24.0 + (vn(vXZ * 0.25 + 3.0) - 0.5) * 7.0)');
      f = parche(f, 'smoothstep(uZ.z - 8.0, uZ.z + 14.0, vXZ.y)', 'smoothstep(uZ.z - 8.0, uZ.z + 14.0, vXZ.y + (vn(vXZ * 0.07 + 90.0) - 0.5) * 24.0 + (vn(vXZ * 0.25 + 5.0) - 0.5) * 7.0)');
      sh.fragmentShader = f; };
    m.needsUpdate = true; }
  if (ON.aire) {
    const H = new THREE.Color(HORIZ_NUEVO), e = o.escena; e.fog.color.copy(H); e.fog.near *= 0.7; e.fog.far *= 0.9; o.COMUN.uNieblaC.value.copy(H); o.COMUN.uNiebla.value.set(e.fog.near, e.fog.far);
    const cielo = e.children.find(c => c.isGroup && c.children.some(k => k.material && k.material.uniforms && k.material.uniforms.uSol));
    if (cielo) for (const k of cielo.children) { const u = k.material.uniforms;
      if (u.uSol) { u.uH.value.copy(H); k.material.fragmentShader = `varying vec3 vD; uniform vec3 uSol, uH; void main() { vec3 d = normalize(vD); float h = clamp(d.y, 0.0, 1.0);
        vec3 c = mix(uH, vec3(0.50, 0.68, 0.90), smoothstep(0.0, 0.16, h)); c = mix(c, vec3(0.20, 0.38, 0.70), smoothstep(0.10, 0.70, h));
        float s = max(dot(d, uSol), 0.0); c += vec3(1.0, 0.80, 0.52) * (pow(s, 5.0) * 0.20 + pow(s, 60.0) * 0.5) * (1.0 - smoothstep(0.0, 0.5, h) * 0.4);
        gl_FragColor = vec4(c, 1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`; k.material.needsUpdate = true; }
      else if (u.uBruma) { u.uH.value.copy(H); const hsl = {}; u.uC.value.getHSL(hsl); u.uC.value.setHSL(hsl.h, hsl.s * 0.7, hsl.l); u.uBruma.value = Math.min(0.85, u.uBruma.value * 0.6 + 0.42); } }   /* las colinas se destiñen */
  }
}

/* 6. cámara de mando más baja y tendida: arriba se ve horizonte y cielo */
export function camara(m, vertical) { if (ON.camara) { m.p = vertical ? 0.29 : 0.22; } return m; }
