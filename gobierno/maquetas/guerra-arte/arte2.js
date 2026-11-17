/* Maqueta GM4c «segunda vuelta del arte» — lo NUEVO de arte.js vive aquí, para que arte.js siga siendo el GM4 y se pueda apagar.
   Interruptores: ?arte=antes lo apaga todo (queda exactamente el GM4) y ?sin=figuras,campo,color apaga una mejora sola.
   Botón «Arte: nuevo / de antes» arriba a la derecha: recarga con el otro valor.
   Todo es código (sombreadores y texturas hechas por código). Arte ajeno: solo el de siempre, los soldados de 0 A.D. (Wildfire Games, CC BY-SA 3.0).
   1. FIGURAS  (retocaFigura): luz por píxel con oclusión falsa por altura, metal (casco, umbo, armas) con brillo, grano de tela, contraluz fino, contraste.
   2. CAMPO    (suelo2, campo2): suelo a tres escalas sin rayas, manchas de tono, tierra pisada con surcos, lomas pintadas con el sol, lomas reales
                solo lejos de las tropas, sol bajo y cálido (en arte.js), bruma cálida y cielo en degradado limpio.
   3. COLOR    (colores, pano2, retocaFigura): paleta de lino, ocre y bronce; el color del bando solo en escudo, penacho y estandarte. */
import { THREE } from '../../../js/gfx/models.js';

const Q = new URLSearchParams(location.search), SIN = new Set((Q.get('sin') || '').split(',').map(s => s.trim()).filter(Boolean)), GEN = Q.get('arte') !== 'antes';
export const ON = { figuras: GEN && !SIN.has('figuras'), campo: GEN && !SIN.has('campo'), color: GEN && !SIN.has('color') };
window.__arte = ON;
export const VAR_BR = ON.color ? '0.32' : '0.24', VAR_TI = ON.color ? '0.24' : '0.16', LEJOS_BANDO = ON.color ? '0.48' : '0.42';

/* botón de arriba: recarga con el otro valor */
{ const b = document.createElement('button'); b.id = 'arte-b'; b.textContent = GEN ? 'Arte: nuevo' : 'Arte: de antes';
  b.style.cssText = 'position:absolute;right:calc(env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 50px);height:26px;padding:0 10px;border-radius:13px;background:rgba(18,15,11,.82);border:1px solid rgba(184,134,43,.55);font:600 11px system-ui,sans-serif;color:#e9d9b0;z-index:30;pointer-events:auto';
  b.onclick = () => { const u = new URL(location.href); if (GEN) u.searchParams.set('arte', 'antes'); else u.searchParams.delete('arte'); location.href = u.toString(); };
  const poner = () => (document.getElementById('hud') || document.body).appendChild(b); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner(); }

/* ---------- 3. color: el bando es rojo (Roma) y azul cobalto (enemigo); se aplica antes de que nadie hornee o pinte nada ---------- */
export const ROMA = '#d02a1c', ENEMIGO = '#2a62c9';
export function colores(C) { if (ON.color) { C[0] = ROMA; C[1] = ENEMIGO; } }
export const pano2 = ON.color ? { rojo: '#d02a1c', rojo2: '#9c1c12', azul: '#2a62c9', azul2: '#1d4796' } : { rojo: '#a8231c', rojo2: '#7e1812', azul: '#5b3a8c', azul2: '#42286b' };

/* ---------- 1. figuras (y 3. color) ---------- */
const ALTO = 5.3;      // altura del modelo de 0 A.D. en sus unidades: 0 en los pies, 5,3 en lo alto del casco
const COLOR_GLSL = `{ float mk = 1.0 - tx.a;
    float lado = smoothstep(0.40, 0.60, abs(vP.x)), cab = smoothstep(0.80, 0.90, vP.y / ${ALTO.toFixed(1)});
    float ft = clamp(0.12 + 0.88 * max(lado, cab), 0.0, 1.0);          /* el bando: entero en escudo y penacho, un 12 % en la túnica */
    tx.rgb = mix(tx.rgb, mix(vec3(0.74, 0.60, 0.40), uTeam, ft), mk); }`;
const METAL_GLSL = horneo => `
  { float noMk = (vMode > 0.5 && vMode < 1.5) ? tx.a : 1.0;
    float mx = max(tx.r, max(tx.g, tx.b)), mn = min(tx.r, min(tx.g, tx.b)), sat = (mx - mn) / max(mx, 0.001);
    float oro = smoothstep(0.52, 0.66, sat) * smoothstep(0.28, 0.45, mx) * (1.0 - smoothstep(0.30, 0.45, mn / max(mx, 0.001)));
    float acero = (1.0 - smoothstep(0.08, 0.16, sat)) * smoothstep(0.42, 0.6, mx);
    gMetal = max(oro, acero * 0.8) * noMk;
    float lt = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lt) * vec3(1.18, 0.86, 0.5), oro * noMk * ${ON.color ? '0.55' : '0.3'});      /* bronce menos amarillo chillón */
    float gr = texture2D(tRuido, vMapUv * 9.0).r - 0.5, fd = ${horneo ? '0.55' : '(1.0 - smoothstep(8.0, 34.0, length(vViewPosition)))'};
    diffuseColor.rgb *= 1.0 + gr * 0.55 * fd * (1.0 - gMetal); }          /* grano de tela */`;
const RIM = 'outgoingLight += diffuseColor.rgb * pow(1.0 - nv, 2.4) * (0.05 + 0.2 * contra) * vec3(1.0, 0.9, 0.75);';
const LUZ_GLSL = `
  vec3 vv = normalize(vViewPosition), up = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  float hy = clamp(vP.y / ${ALTO.toFixed(1)}, 0.0, 1.0), arriba = dot(n, up) * 0.5 + 0.5;
  outgoingLight *= mix(0.5, 1.0, smoothstep(0.0, 0.5, hy)) * mix(0.8, 1.0, arriba);                 /* oclusión falsa: más oscuro hacia los pies y en lo que mira al suelo */
  outgoingLight += diffuseColor.rgb * pow(1.0 - nv, 3.0) * (0.04 + 0.4 * contra * (0.4 + 0.6 * (1.0 - arriba))) * vec3(1.0, 0.86, 0.66);   /* contraluz fino */
  float esp = pow(clamp(dot(n, normalize(sV + vv)), 0.0, 1.0), 30.0);
  outgoingLight = mix(outgoingLight, outgoingLight * 0.78, gMetal) + gMetal * (esp * vec3(1.0, 0.84, 0.58) * 0.85 + pow(1.0 - nv, 2.0) * mix(vec3(0.10, 0.08, 0.06), vec3(0.18, 0.26, 0.40), arriba) * 0.9);   /* metal: brillo del sol y reflejo del cielo */
  outgoingLight = max((outgoingLight - 0.16) * 1.1 + 0.16, 0.0);                                    /* algo más de contraste */`;
/* Se llama con el sombreador ya armado por arte.js (que a su vez parte del de js/gfx/units.js): solo se le añaden cosas */
export function retocaFigura(sh, horneo, RUIDO) {
  sh.uniforms.tRuido = { value: RUIDO };
  sh.vertexShader = sh.vertexShader.replace('varying vec4 vH;', 'varying vec4 vH; varying vec3 vP;').replace('vH = aVar;', 'vP = transformed; vH = aVar;');
  let f = sh.fragmentShader.replace('varying vec4 vH;', 'varying vec4 vH; varying vec3 vP; uniform sampler2D tRuido; float gMetal = 0.0;');
  if (ON.color) f = f.replace('tx.rgb = mix(uTeam, tx.rgb, tx.a);', COLOR_GLSL);
  if (ON.figuras) f = f.replace('diffuseColor.rgb *= tx.rgb;', 'diffuseColor.rgb *= tx.rgb;' + METAL_GLSL(horneo)).replace(RIM, LUZ_GLSL);
  sh.fragmentShader = f;
}

/* ---------- 2. campo ---------- */
export function suelo2(mesh, zona, UNI, RUIDO) {
  const m = mesh.material, prev = m.onBeforeCompile; if (!prev) return;
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r); sh.uniforms.uZ = { value: new THREE.Vector3(zona[0], zona[1], zona[2]) }; sh.uniforms.tRuido = { value: RUIDO }; sh.uniforms.uSolV = UNI.uSolV;
    sh.fragmentShader = 'uniform vec3 uZ, uSolV; uniform sampler2D tRuido;\n float vn(vec2 p) { return texture2D(tRuido, p / 128.0).r; }\n'
      + sh.fragmentShader.replace('diffuseColor.rgb *= terr * macro * 1.05;', `
      /* varias escalas y un giro: la misma baldosa no se repite en filas */
      vec2 uA = mat2(0.82, -0.57, 0.57, 0.82) * vXZ * uScale * 0.43 + 3.7;
      float kL = dot(texture2D(tGrass, uA).rgb, vec3(0.3, 0.59, 0.11));                                      /* una sola lectura más: la luminancia de otra baldosa, a otra escala y giro */
      terr *= clamp(mix(1.0, kL / 0.4, 0.55), 0.6, 1.5);
      float kB = clamp((macro - 0.75) * 2.0, 0.0, 1.0);                                                    /* las manchas salen de la lectura que ya hacía el suelo (macro): gratis */
      vec3 kMancha = mix(vec3(0.84, 0.88, 0.70), vec3(1.16, 1.10, 0.86), smoothstep(0.2, 0.8, kB));       /* manchas grandes: seco, fresco */
      diffuseColor.rgb *= terr * macro * 1.05 * kMancha;
      /* lomas pintadas: la altura no cambia, el sol sí las lee */
      float kx = vXZ.x, kz = vXZ.y;
      float kdx = 3.0 * 0.021 * cos(kx * 0.021 + 0.7) * sin(kz * 0.017 + 1.9) + 1.1 * 0.043 * cos(kx * 0.043 + kz * 0.031), kdz = 3.0 * 0.017 * sin(kx * 0.021 + 0.7) * cos(kz * 0.017 + 1.9) + 1.1 * 0.031 * cos(kx * 0.043 + kz * 0.031);
      float kLoma = clamp(dot(normalize(vec3(-kdx * 1.5, 1.0, -kdz * 1.5)), uSolV) / max(uSolV.y, 0.2), 0.66, 1.4);
      diffuseColor.rgb *= mix(1.0, kLoma, 0.9);
      float dc = length(vViewPosition), cerca = 1.0 - smoothstep(30.0, 170.0, dc), g1 = 0.5, g3 = vn(vXZ * 0.35 + 3.0), g4 = 0.5 + 0.5 * sin(vXZ.x * 0.11 + vXZ.y * 0.07) * sin(vXZ.y * 0.05 - vXZ.x * 0.03);
      if (cerca > 0.01) { g1 = vn(vXZ * 4.0); float g2 = vn(vXZ * 15.0 + 7.0); diffuseColor.rgb *= 1.0 + ((g1 - 0.5) * 0.34 + (g2 - 0.5) * 0.28) * cerca; }
      float caja = (1.0 - smoothstep(0.0, 16.0, abs(vXZ.x) - uZ.x)) * smoothstep(uZ.y - 12.0, uZ.y + 8.0, vXZ.y) * (1.0 - smoothstep(uZ.z - 8.0, uZ.z + 14.0, vXZ.y));
      float surco = vn(vec2(vXZ.x * 2.2, vXZ.y * 0.1));                                                   /* surcos largos en el sentido de la marcha */
      float pis = caja * (0.55 + 0.45 * g3) * (0.8 + 0.4 * g4);
      vec3 tierra = vec3(0.80, 0.60, 0.40) * (0.78 + 0.4 * g1) * (0.82 + 0.3 * surco);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * tierra, clamp(pis * 1.15, 0.0, 0.93));      /* tierra pisada, bien visible */`);
  };
  m.needsUpdate = true;
}
const CIELO_FS = `varying vec3 vD; uniform vec3 uSol, uH; void main(){ vec3 d = normalize(vD); float h = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uH, vec3(0.66, 0.76, 0.90), smoothstep(0.0, 0.10, h)); c = mix(c, vec3(0.28, 0.48, 0.82), smoothstep(0.06, 0.6, h));
  float s = max(dot(d, uSol), 0.0); c += vec3(1.0, 0.72, 0.42) * (pow(s, 5.0) * 0.30 + pow(s, 90.0) * 0.8);
  gl_FragColor = vec4(c, 1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const liso = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function campo2(o) {
  const e = o.escena, HAZ = '#e4c9a0', [zx, z0, z1] = o.zona;
  e.fog.color.set(HAZ); o.COMUN.uNieblaC.value.set(HAZ); e.fog.far *= 0.8; o.COMUN.uNiebla.value.set(e.fog.near, e.fog.far);      // bruma lejana, cálida
  const cg = e.children.find(c => c.isGroup && c.children[0] && c.children[0].renderOrder === -10);
  if (cg) { const sk = cg.children[0]; sk.material.uniforms.uH.value.set(HAZ); sk.material.fragmentShader = CIELO_FS; sk.material.needsUpdate = true; }
  const g = o.suelo && o.suelo.geometry; if (!g) return; const P = g.attributes.position, W = g.attributes.color;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i);
    if (W) W.array[i * 3 + 1] = Math.max(0, W.array[i * 3 + 1] - 0.08 * Math.max(0, Math.sin(x * 0.21) * Math.sin(z * 0.17)));        // fuera el ajedrez de tierra de GM4
    const d = Math.max(Math.abs(x) - zx - 40, z0 - 40 - z, z - z1 - 40);                                                              // lomas de verdad: solo fuera de la zona de juego
    if (d > 0) P.setY(i, P.getY(i) + liso(0, 380, d) * (6 + 7 * Math.sin(x * 0.012 + 1.1) * Math.cos(z * 0.01 + 0.6) + 3 * Math.sin(x * 0.03 + z * 0.02)));
  }
  P.needsUpdate = true; if (W) W.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}
