/* Maqueta GM33 «la tropa como gentío» — cada hombre con su piel, su tela y su bronce; el bando solo en escudo, penacho y estandarte.
   Interruptor: ?sin=gentio apaga solo esta mejora (queda el aspecto de GM32). ?aspecto=0 lo apaga todo. No cambia reglas ni baja ni sube triángulos.
   Parte de guerra-arte/arte2.js (COLOR_GLSL, METAL_GLSL, colores, pano2), copiado aquí como módulo propio: guerra-arte no se toca.
   Cómo funciona, sin arte nuevo (0 A.D., Wildfire Games, CC BY-SA 3.0, el de siempre):
   · Al hornear el cartón, la túnica (la parte con máscara de bando) se pinta de un verde-marca que no existe en ningún modelo. El escudo y el penacho llevan el color del bando.
   · Después, en la figura y en el cartón, la MISMA función gentio() lee el color: el verde-marca pasa a lino, ocre o tierra según el hombre;
     la piel recibe uno de varios tonos; el bronce, uno de varios brillos; el escudo del bando, uno de tres tonos.
   · La variación sale del atributo aVar (en la figura) y de la cuenta por hombre (en el cartón): es la misma, estable, por el número del hombre en su regimiento. */
const Q = new URLSearchParams(location.search), SIN = new Set((Q.get('sin') || '').split(',').map(s => s.trim()).filter(Boolean));
export const ON = Q.get('aspecto') !== '0' && !SIN.has('gentio');
window.__gentio = ON;

/* colores del bando: rojo romano y cobalto cartaginés (de arte2) */
export const ROMA = '#d02a1c', ENEMIGO = '#2a62c9';
export function colores(C) { if (ON) { C[0] = ROMA; C[1] = ENEMIGO; } }
export const pano = ON ? { rojo: '#d02a1c', rojo2: '#9c1c12', azul: '#2a62c9', azul2: '#1d4796' } : null;

const ALTO = 5.3;      // altura del modelo de 0 A.D.: 0 en los pies, 5,3 en lo alto del casco
/* Al hornear/pintar: la máscara del modelo deja de ser «bando» y pasa a ser tela (verde-marca) salvo en escudo (máscara casi entera) y penacho (arriba) */
const COLOR_GLSL = `{ float mk = 1.0 - tx.a;
    float esc = smoothstep(0.82, 0.95, mk) * smoothstep(0.30, 0.50, abs(vP.x)), cab = smoothstep(0.80, 0.90, vP.y / ${ALTO.toFixed(1)});
    float ft = clamp(max(esc, cab), 0.0, 1.0);
    float tl = clamp(dot(tx.rgb, vec3(0.3, 0.59, 0.11)) / 0.45, 0.7, 1.3);
    tx.rgb = mix(tx.rgb, mix(vec3(0.04, 0.60, 0.12) * tl, uTeam, ft), smoothstep(0.15, 0.4, mk)); }   /* la máscara parcial (túnica, ~0,7) también se sustituye entera: si no, queda rosa mezclado */`;
const METAL_GLSL = horneo => `
  { float noMk = (vMode > 0.5 && vMode < 1.5) ? tx.a : 1.0;
    float mx = max(tx.r, max(tx.g, tx.b)), mn = min(tx.r, min(tx.g, tx.b)), sat = (mx - mn) / max(mx, 0.001);
    float oro = smoothstep(0.52, 0.66, sat) * smoothstep(0.28, 0.45, mx) * (1.0 - smoothstep(0.30, 0.45, mn / max(mx, 0.001)));
    float lt = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lt) * vec3(1.18, 0.86, 0.5), oro * noMk * 0.55);      /* bronce menos amarillo chillón */
    float gr = texture2D(tRuido, vMapUv * 9.0).r - 0.5, fd = ${horneo ? '0.55' : '(1.0 - smoothstep(8.0, 34.0, length(vViewPosition)))'};
    diffuseColor.rgb *= 1.0 + gr * 0.45 * fd; }          /* grano de tela */`;

/* La función común de figura y cartón. c = color ya iluminado; h = variación del hombre; team = color del bando; lejos 0..1 */
export const GLSL = `
vec3 gentio(vec3 c, vec4 h, vec3 team, float lejos) {
  const vec3 L = vec3(0.3, 0.59, 0.11);
  float l = dot(c, L), mxc = max(c.r, max(c.g, c.b)), mnc = min(c.r, min(c.g, c.b));
  /* 1. tela: el verde-marca pasa a lino, ocre o tierra */
  float wG = smoothstep(1.8, 3.0, c.g / max(max(c.r, c.b), 0.004)) * smoothstep(0.01, 0.04, c.g);
  float k = floor(h.y * 2.999);
  vec3 tela = k < 0.5 ? vec3(0.66, 0.54, 0.34) : (k < 1.5 ? vec3(0.52, 0.27, 0.05) : vec3(0.22, 0.13, 0.06));   /* lino, ocre, tierra (lineal) */
  tela *= 0.86 + 0.28 * h.z;
  /* 2. piel: naranja suave, ni bronce ni madera */
  float br = c.b / max(c.r, 0.004), gr = c.g / max(c.r, 0.004);
  float wS = smoothstep(0.50, 0.58, br) * (1.0 - smoothstep(0.80, 0.92, br)) * smoothstep(0.68, 0.76, gr) * (1.0 - smoothstep(0.92, 1.0, gr)) * smoothstep(0.03, 0.08, l);
  float sk = fract(h.x * 5.7 + h.w * 3.3);
  vec3 piel = mix(vec3(1.14, 1.08, 1.04), vec3(0.70, 0.50, 0.38), smoothstep(0.05, 0.95, sk));
  /* 3. bronce: más rojizo y oscuro o más claro y dorado */
  float wB = (1.0 - smoothstep(0.42, 0.52, br)) * smoothstep(0.50, 0.62, (mxc - mnc) / max(mxc, 0.004)) * smoothstep(0.08, 0.2, l);
  float bz = fract(h.z * 4.1 + h.x * 2.3);
  vec3 bronce = mix(vec3(1.18, 1.04, 0.82), vec3(0.78, 0.66, 0.56), bz);
  /* 4. bando: el escudo y el penacho (mucho croma); tres tonos de escudo por tropa */
  vec3 cc = c - l, bb = team - dot(team, L);
  float croma = length(cc) / max(l, 0.04);
  float wT = smoothstep(0.65, 1.1, croma) * smoothstep(0.7, 0.9, dot(cc, bb) / max(length(cc) * length(bb), 1e-4));
  float tv = fract(h.w * 5.0 + h.y * 3.0);
  vec3 tono = tv < 0.33 ? vec3(0.72, 0.70, 0.72) : (tv < 0.66 ? vec3(1.0) : vec3(1.22, 1.12, 1.0));
  c = mix(c, tela * (l / 0.38), wG);
  c = mix(c, c * piel, wS * (1.0 - wG));
  c = mix(c, c * bronce, wB * (1.0 - wG));
  c = mix(c, c * tono, wT);
  c = mix(c, team * (0.25 + 1.8 * l), lejos * clamp(0.36 + wT * 0.6, 0.0, 1.0));    /* de lejos, el bando manda: poco en el hombre, mucho en el escudo; de cerca, solo escudo y penacho */
  return c;
}`;

/* Se llama con el sombreador ya armado por arte.js: se le añaden el color y el metal */
export function retocaFigura(sh, horneo, RUIDO) {
  sh.uniforms.tRuido = { value: RUIDO };
  sh.vertexShader = sh.vertexShader.replace('varying vec4 vH;', 'varying vec4 vH; varying vec3 vP;').replace('vH = aVar;', 'vP = transformed; vH = aVar;');
  let f = sh.fragmentShader.replace('varying vec4 vH;', 'varying vec4 vH; varying vec3 vP; uniform sampler2D tRuido;');
  f = f.replace('tx.rgb = mix(uTeam, tx.rgb, tx.a);', COLOR_GLSL).replace('diffuseColor.rgb *= tx.rgb;', 'diffuseColor.rgb *= tx.rgb;' + METAL_GLSL(horneo));
  if (!horneo) f = f.replace('outgoingLight = varC(vH, outgoingLight);', 'outgoingLight = gentio(varC(vH, outgoingLight), vH, uTeam, 0.0);');
  sh.fragmentShader = f;
}
