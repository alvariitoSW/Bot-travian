/* AQVILA · CG4: el entorno de la pantalla de mando (js/ui-mando.js): luz, niebla, cielo, suelo, piedras, árboles y polvo.
   A1 lo puso con la luz de ui-guerra; A2 (este archivo) trae la luz y el campo de la maqueta GM43e («testudo-luz-campo»,
   aprobada por el usuario): sol bajo con sombras alargadas, gradación de color dentro del tonemapping, cielo con nubes
   teñido por el sol, bruma cálida, suelo de fotos con senda, calvas, manchas verdes y flores, piedras, árboles de 0 A.D.,
   lomas y montes con bruma, y polvo que levantan los pies. Adaptado a un campo de 1 200 × 700 m visto desde arriba.
   Arte: texturas y cielo de Poly Haven (CC0) y árboles de 0 A.D. (CC BY-SA 3.0); ver gobierno/maquetas/testudo-luz-campo/LICENSE.txt.
   Uso: prepararLuz(THREE, renderer) antes de compilar nada; const E = await montarEntorno({ THREE, escena, Gr, St, UNIT_SCALE, campo });
   E.alt(x, z) da la altura; E.sombra dice hacia dónde cae la sombra; E.tick(dt, S, Sim, camara, altoPx) mueve el polvo; E.soltar() lo quita.
   Coordenadas de la escena: X = x del simulador, Z = −y (Roma, en y < 0, queda hacia +Z, cerca de la cámara). */
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* campo de la escaramuza: solo paisaje (lomas, piedras y árboles alrededor); el simulador aún no tiene terreno */
const CAMPOS = { llano: { h: 0.35, arb: 140, pie: 120 }, colina: { h: 2.6, arb: 300, pie: 260 }, bosque: { h: 0.9, arb: 900, pie: 160 }, mixto: { h: 1, arb: 400, pie: 200 } };
export const LLANO = { x: 640, z: 390 };      /* la zona llana donde se lucha (las figuras van a ras de suelo, y = 0) */
const ARTE = n => 'gobierno/maquetas/testudo-luz-campo/arte/' + n;   /* las fotos de la maqueta GM43e (ya en la caché de sw.js) */
/* el sol: bajo (unos 30 grados), a la derecha y algo por delante. De lado y no de frente como en la maqueta: desde tan alto, a contraluz los hombres salían negros */
const SOL_DIR = [0.82, 0.5, -0.28];

/* ---------- la gradación de color de la maqueta (luz de A): ACES y luego algo más de contraste y color, sombras frías y luces cálidas.
   Va dentro del tonemapping de cada material: ninguna pasada de pantalla completa. Solo la usa el renderer que la pide (CustomToneMapping) ---------- */
export function prepararLuz(THREE, renderer) {
  const C = THREE.ShaderChunk, viejo = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
  if (C.tonemapping_pars_fragment.includes(viejo)) C.tonemapping_pars_fragment = C.tonemapping_pars_fragment.replace(viejo, `vec3 CustomToneMapping( vec3 color ) {
  vec3 p = sqrt( ACESFilmicToneMapping( color ) );
  float l = dot( p, vec3( 0.299, 0.587, 0.114 ) );
  p = mix( vec3( l ), p, 1.14 );
  p = mix( p, p * p * ( 3.0 - 2.0 * p ), 0.35 );
  p += vec3( -0.012, 0.004, 0.022 ) * ( 1.0 - l ) * ( 1.0 - l ) + vec3( 0.03, 0.012, -0.03 ) * l * l;
  p = clamp( p, 0.0, 1.0 );
  return p * p;
}`);
  renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = 1.22;
}

/* ---------- ruido propio (el de la maqueta): 256×256, se repite sin costura. r: manchas grandes; g: medianas; b: finas ---------- */
let RUIDO = null; const NR = 256;
function hazRuido() {
  if (RUIDO) return RUIDO; RUIDO = new Float32Array(NR * NR * 3);
  const red = (f, s) => { const g = new Float32Array(f * f); let k = s; for (let i = 0; i < f * f; i++) { k = (k * 16807) % 2147483647; g[i] = k / 2147483647; } return g; };
  const octava = (f, s) => { const g = red(f, s), o = new Float32Array(NR * NR);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NR; i++) { const x = i / NR * f, y = j / NR * f, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const v = (a, b) => g[((b % f) * f) + (a % f)]; o[j * NR + i] = (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy; }
    return o; };
  [[4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]].forEach((fs, c) => {
    const os = fs.map((f, k) => octava(f, 11 + c * 97 + k * 13)), pesos = [0.5, 0.27, 0.15, 0.08];
    for (let i = 0; i < NR * NR; i++) { let s = 0; for (let k = 0; k < 4; k++) s += os[k][i] * pesos[k]; RUIDO[i * 3 + c] = s; }
  });
  for (let c = 0; c < 3; c++) { let lo = 1, hi = 0; for (let i = 0; i < NR * NR; i++) { const v = RUIDO[i * 3 + c]; lo = Math.min(lo, v); hi = Math.max(hi, v); } for (let i = 0; i < NR * NR; i++) RUIDO[i * 3 + c] = (RUIDO[i * 3 + c] - lo) / (hi - lo); }
  return RUIDO;
}
function ruido(u, v, c) {
  const R = hazRuido(), x = ((u % 1) + 1) % 1 * NR - 0.5, y = ((v % 1) + 1) % 1 * NR - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
  const m = (a, b) => R[((((b % NR) + NR) % NR) * NR + (((a % NR) + NR) % NR)) * 3 + c];
  return (m(x0, y0) * (1 - tx) + m(x0 + 1, y0) * tx) * (1 - ty) + (m(x0, y0 + 1) * (1 - tx) + m(x0 + 1, y0 + 1) * tx) * ty;
}
function texRuido(THREE) {
  const R = hazRuido(), d = new Uint8Array(NR * NR * 4); for (let i = 0; i < NR * NR; i++) { d[i * 4] = R[i * 3] * 255; d[i * 4 + 1] = R[i * 3 + 1] * 255; d[i * 4 + 2] = R[i * 3 + 2] * 255; d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, NR, NR); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}
/* la senda: un camino de tierra que cruza el campo por detrás de las líneas romanas y se tuerce (misma fórmula aquí y en el sombreador) */
const sendaZ = x => 300 + 38 * Math.sin(x * 0.0042 + 0.6) + 12 * Math.sin(x * 0.013) - 0.00009 * x * x;
const GLSL_SENDA = 'float sendaZ(float x){ return 300.0 + 38.0 * sin(x * 0.0042 + 0.6) + 12.0 * sin(x * 0.013) - 0.00009 * x * x; }\n';

export async function montarEntorno({ THREE, escena, Gr, St, UNIT_SCALE, campo, renderer }) {
  const CV = CAMPOS[campo] || CAMPOS.mixto, HORIZ = '#dcb888', puestos = [], texs = [];
  const pon = o => { escena.add(o); puestos.push(o); return o; };
  let semilla = 99; const rnd = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };
  const SOL = new THREE.Vector3(...SOL_DIR).normalize();
  /* luz: la de la maqueta, a la escala del campo. Bruma cálida y exponencial (se ven las lomas, se pierden los montes) */
  escena.background = new THREE.Color(HORIZ);
  escena.fog = new THREE.FogExp2('#c3c0a4', 0.00052);   /* CG8a: bruma menos parda (antes #cdb08a, 0.00062) */
  pon(new THREE.HemisphereLight(0xb4c4dc, 0x5c5e34, 1.35));
  const sol = pon(new THREE.DirectionalLight(0xffdcb0, 3.5)); sol.position.copy(SOL).multiplyScalar(200);
  /* relleno desde detrás de la cámara (el cielo que rebota): sin él las espaldas, lejos del sol, quedarían negras */
  pon(new THREE.DirectionalLight(0xc0cce0, 1.7)).position.set(-0.15, 0.75, 1);

  const cargar = n => new THREE.TextureLoader().loadAsync(ARTE(n)).then(t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.push(t); return t; }).catch(() => null);
  const [tSeca, tVerde, tTierra, tRoca, tCielo] = await Promise.all(['hierba_seca.jpg', 'hierba_verde.jpg', 'tierra.jpg', 'roca.jpg', 'cielo.jpg'].map(cargar));
  const uRuido = { value: texRuido(THREE) }; texs.push(uRuido.value);
  const BRUMA = escena.fog.color.clone();

  /* relieve: llano donde se lucha; fuera, lomas suaves y, lejos, un horizonte de colinas */
  function alt(x, z) {
    const dx = Math.max(0, Math.abs(x) - LLANO.x), dz = Math.max(0, Math.abs(z) - LLANO.z), d = Math.hypot(dx, dz), f = suave(0, 220, d);
    let h = CV.h * 3 * f * (1.4 + 1.8 * Math.sin(x * 0.009 + 1.7) * Math.cos(z * 0.008 - 0.6) + 0.9 * Math.sin(x * 0.02 + z * 0.013)) * (1 + d / 400);
    h += f * 30 * ruido(x * 0.0011 + 0.2, z * 0.0011 + 0.6, 0) ** 2;
    const r = Math.hypot(x * 0.8, z); h += 160 * suave(1150, 1700, r) * (0.65 + 0.35 * Math.sin(Math.atan2(x, z) * 4 + 1));
    return Math.max(0, h);
  }

  /* ---------- cielo: la foto con nubes (Kloofendal 48d, Poly Haven, CC0) teñida por el sol, como en la maqueta ---------- */
  if (tCielo) {
    tCielo.generateMipmaps = false; tCielo.minFilter = THREE.LinearFilter;
    const cielo = new THREE.Mesh(new THREE.SphereGeometry(9000, 40, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uCielo: { value: tCielo }, uSol: { value: SOL }, uH: { value: new THREE.Color(HORIZ) } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vD; uniform sampler2D uCielo; uniform vec3 uSol, uH;
      void main(){ vec3 d = normalize(vD); float e = asin(clamp(d.y, -1.0, 1.0));
        vec3 c = texture2D(uCielo, vec2(fract((atan(d.z, d.x) - atan(uSol.z, uSol.x)) / 6.2831853 + 0.1), clamp((e + 0.0733) / 1.6441, 0.002, 0.998))).rgb; c = pow(c, vec3(1.2)) * 1.06;
        float s = max(dot(d, uSol), 0.0);
        c *= mix(vec3(0.84, 0.92, 1.04), vec3(1.22, 0.98, 0.72), pow(s, 2.0)) * mix(vec3(1.12, 0.95, 0.76), vec3(1.0), smoothstep(0.02, 0.4, e));
        c = mix(c, c * vec3(0.66, 0.8, 1.0), smoothstep(0.06, 0.5, e) * (1.0 - pow(s, 2.0)) * 0.8);
        c = mix(uH, c, smoothstep(-0.01, 0.12, e));
        c += vec3(1.0, 0.72, 0.42) * (pow(s, 8.0) * 0.5 + pow(s, 90.0) * 1.1) + vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s) * 6.0;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` }));
    cielo.renderOrder = -10; cielo.frustumCulled = false; pon(cielo);
    /* el mismo cielo, como reflejo para el bronce y el hierro de los soldados (sin él, el metal sale negro); se calcula una vez */
    if (renderer) try { const pm = new THREE.PMREMGenerator(renderer), tc = tCielo.clone(); tc.mapping = THREE.EquirectangularReflectionMapping; tc.needsUpdate = true;
      const rt = pm.fromEquirectangular(tc); pm.dispose(); tc.dispose(); escena.environment = rt.texture; escena.environmentIntensity = 0.42; texs.push({ dispose: () => rt.dispose() });
    } catch (e) { console.warn('sin reflejo del cielo', e); }
  }

  /* ---------- montes: dos cordilleras con silueta, pliegues y bruma al pie (de la maqueta, a esta escala) ---------- */
  [[2700, 260, '#4a5246', 0.32, 7.0], [5600, 820, '#636a78', 0.48, 3.0]].forEach(([r, altM, col, bruma, fq], k) => {
    const n = 300, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = t * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const h = altM * (0.18 + 0.75 * ruido(t * fq, 0.13 + k * 0.4, 0) ** 1.5 + 0.22 * ruido(t * fq * 4, 0.7 + k * 0.2, 1) + 0.06 * ruido(t * fq * 16, 0.4, 2));
      pos.push(x, -60, z, x, h, z); uv.push(t, 0, t, 1);
      if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: false, depthWrite: false, uniforms: { uRuido, uC: { value: new THREE.Color(col) }, uB: { value: BRUMA }, uBruma: { value: bruma }, uFq: { value: fq } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform sampler2D uRuido; uniform vec3 uC, uB; uniform float uBruma, uFq;
        void main(){ float x = vUv.x * uFq;
          float pl = texture2D(uRuido, vec2(x * 2.3 + vUv.y * 0.18, vUv.y * 0.12)).g, n = texture2D(uRuido, vec2(x * 6.0, vUv.y * 0.9)).b, b = texture2D(uRuido, vec2(x * 3.0, vUv.y * 0.6 + 0.4)).r;
          vec3 c = uC * mix(0.72, 1.18, smoothstep(0.3, 0.75, pl + (n - 0.5) * 0.3));
          c = mix(c, uC * vec3(0.62, 0.74, 0.6), smoothstep(0.45, 0.65, b + (0.5 - vUv.y) * 0.4) * 0.7);
          c = mix(c, uB, uBruma); c = mix(c, uB, (1.0 - smoothstep(0.08, 0.6, vUv.y)) * 0.85);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` }));
    m.renderOrder = -9 + (1 - k); m.frustumCulled = false; pon(m);
  });

  /* ---------- suelo: hierba seca, manchas verdes, calvas, flores, tierra pisada donde se lucha y la senda; dos escalas contra la repetición ---------- */
  const g = new THREE.PlaneGeometry(4200, 4200, 160, 160).rotateX(-Math.PI / 2), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setY(i, alt(P.getX(i), P.getZ(i)));
  g.computeVertexNormals(); g.deleteAttribute('uv');
  const matSuelo = new THREE.MeshLambertMaterial({ color: 0xffffff });
  if (tSeca && tVerde && tTierra) matSuelo.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uRuido, uSeca: { value: tSeca }, uVerde: { value: tVerde }, uTierra: { value: tTierra } });
    sh.vertexShader = 'varying vec3 vW; varying float vNy;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vNy = objectNormal.y;');
    sh.fragmentShader = 'varying vec3 vW; varying float vNy; uniform sampler2D uRuido, uSeca, uVerde, uTierra;\n' + GLSL_SENDA + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 p = vW.xz; const mat2 GIRO = mat2(0.8, -0.6, 0.6, 0.8);
      float n1 = texture2D(uRuido, p * 0.0031).r; vec2 nn = texture2D(uRuido, p * 0.009 + 0.3).gb; float n2 = nn.x, n3 = nn.y;
      vec3 seca = mix(texture2D(uSeca, p * 0.09).rgb, texture2D(uSeca, GIRO * p * 0.053 + 0.37).rgb, 0.5) * vec3(0.98, 1.06, 0.86);
      vec3 verde = mix(texture2D(uVerde, GIRO * p * 0.05).rgb, texture2D(uVerde, p * 0.029 + 0.6).rgb, 0.4) * vec3(1.12, 1.18, 0.92);
      vec3 tierra = mix(texture2D(uTierra, p * 0.11).rgb, texture2D(uTierra, GIRO * p * 0.037).rgb, 0.4);
      vec3 c = mix(seca * vec3(0.9, 1.0, 0.78), verde, 0.45 + 0.5 * smoothstep(0.12, 0.5, n1 + (n2 - 0.5) * 0.5)) * vec3(0.9, 1.04, 0.84);   /* CG8a: más verde (el usuario: campo menos pardo) */
      /* flores silvestres en corros: manzanilla y crisantemo (amarillo y blanco; el rojo de las amapolas se confundiría con Roma) */
      float fl = smoothstep(0.74, 0.86, texture2D(uRuido, p * 0.021 + 0.17).b) * smoothstep(0.35, 0.55, n1);
      c = mix(c, mix(vec3(0.8, 0.7, 0.28), vec3(0.62, 0.66, 0.3), n3), fl * 0.1);
      float calva = smoothstep(0.78, 0.9, n2 + (n3 - 0.5) * 0.3);
      /* tierra pisada donde se lucha, con manchas; y la senda */
      float pis = exp(-(p.y * p.y) / 14000.0) * exp(-(p.x * p.x) / 90000.0) * smoothstep(0.25, 0.65, n2 + 0.25);
      float ds = abs(p.y - sendaZ(p.x)) + (n3 - 0.5) * 6.0, senda = 1.0 - smoothstep(2.6, 4.6, ds), orilla = 1.0 - smoothstep(4.0, 10.0, ds);
      c = mix(c, tierra, max(max(senda * 0.9, calva * 0.2), max(pis * 0.3, orilla * 0.3)));
      c = mix(c, seca * vec3(1.08, 1.0, 0.86), smoothstep(0.97, 0.85, vNy) * 0.5);   /* laderas, más secas */
      { float mq = texture2D(uRuido, p * 0.0047 + 0.71).g, lj = smoothstep(700.0, 950.0, max(abs(p.x), abs(p.y) * 1.6));
        c = mix(c, vec3(0.2, 0.25, 0.12), smoothstep(0.52, 0.68, mq) * 0.65 * lj); }   /* lejos, matorral mediterráneo por las lomas */
      c *= mix(0.88, 1.12, n1);
      diffuseColor.rgb *= c * 1.2;`);
  };
  matSuelo.customProgramCacheKey = () => 'cg4-campo-suelo';
  pon(new THREE.Mesh(g, matSuelo));

  /* ---------- piedras: sueltas por el campo y algún peñasco fuera de donde se lucha (una llamada; 80 triángulos cada una) ---------- */
  const FIJAS = [];   /* [x, z, ancho, largo] de lo que echa sombra fija */
  {
    const gp = new THREE.IcosahedronGeometry(1, 1), pp = gp.attributes.position, uv = [], col = [], V = new THREE.Vector3();
    for (let i = 0; i < pp.count; i++) {
      V.fromBufferAttribute(pp, i); const n = ruido(V.x * 0.21 + 0.5, V.z * 0.21 + V.y * 0.13, 1), f = 0.78 + 0.42 * n;
      V.multiplyScalar(f); V.y *= 0.62; if (V.y < -0.15) V.y = -0.15 + (V.y + 0.15) * 0.3; pp.setXYZ(i, V.x, V.y, V.z);
      uv.push((V.x + V.z * 0.6) * 0.45, (V.y + V.z * 0.4) * 0.45);
      const ao = 0.55 + 0.45 * suave(-0.2, 0.5, V.y); col.push(ao, ao, ao * 0.97);
    }
    gp.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gp.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gp.computeVertexNormals();
    const lista = [], o = new THREE.Object3D(), c = new THREE.Color();
    const piedra = (x, z, s) => { o.position.set(x, alt(x, z) - s * 0.12, z); o.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5); o.scale.set(s * (0.8 + rnd() * 0.5), s * (0.7 + rnd() * 0.6), s * (0.8 + rnd() * 0.5)); o.updateMatrix(); c.setHSL(0.09 + rnd() * 0.04, 0.12 + rnd() * 0.1, 0.62 + rnd() * 0.2); lista.push([o.matrix.clone(), c.clone()]); };
    for (let i = 0; i < CV.pie; i++) { const x = (rnd() - 0.5) * 1500, z = (rnd() - 0.5) * 900; piedra(x, z, 0.35 + rnd() * rnd() * 1.4); }
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 2 * (LLANO.x + 500), z = (rnd() - 0.5) * 2 * (LLANO.z + 450); if (Math.abs(x) < LLANO.x + 20 && Math.abs(z) < LLANO.z + 20) continue; piedra(x, z, 2.5 + rnd() * 4); }
    for (let i = 0; i < 70; i++) { const x = (rnd() - 0.5) * 1400; piedra(x, sendaZ(x) + (rnd() - 0.5) * 12, 0.3 + rnd() * 0.5); }   /* guijarros junto a la senda */
    const mat = new THREE.MeshLambertMaterial({ map: tRoca, vertexColors: true });
    const im = new THREE.InstancedMesh(gp, mat, lista.length); lista.forEach(([m, cc], i) => { im.setMatrixAt(i, m); im.setColorAt(i, cc); });
    im.frustumCulled = false; pon(im);
    for (const [m] of lista) { const e = m.elements, s = Math.hypot(e[0], e[1], e[2]); if (s > 1.2) FIJAS.push([e[12], e[14], s * 1.6, s * 3.2]); }
  }

  /* ---------- árboles de 0 A.D. alrededor del llano, nunca dentro (taparían a los soldados); una hilera de cipreses junto a la senda ---------- */
  {
    const arboles = { cipres: [], olivo: [], pino: [] }, E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    const arbol = (tipo, x, z, k) => { const e = UNIT_SCALE * k * (0.75 + rnd() * 0.6) * (tipo === 'pino' ? 0.8 : 1); arboles[tipo].push(new THREE.Matrix4().compose(V.set(x, alt(x, z) - 0.2, z), Q.setFromEuler(E.set(0, rnd() * 6.28, 0)), SC.set(e, e * (0.9 + rnd() * 0.25), e))); FIJAS.push([x, z, (tipo === 'cipres' ? 1.3 : 2.6) * e, (tipo === 'cipres' ? 6 : 7) * e]); };
    for (let k = 0, intentos = 0; k < CV.arb && intentos < CV.arb * 6; intentos++) {
      const x = (rnd() - 0.5) * 2 * (LLANO.x + 420), z = (rnd() - 0.5) * 2 * (LLANO.z + 380);
      if (Math.abs(x) < LLANO.x + 30 && Math.abs(z) < LLANO.z + 30) continue;
      if (CV.arb > 200 && ruido(x * 0.0016, z * 0.0016, 1) < 0.42) continue;   /* en bosquetes, no salpicados */
      k++; arbol(rnd() < 0.45 ? 'olivo' : rnd() < 0.6 ? 'cipres' : 'pino', x, z, 1);
    }
    for (let x = -LLANO.x - 300; x < LLANO.x + 300; x += 9 + rnd() * 7) { if (Math.abs(x) < LLANO.x + 30 || rnd() < 0.2) continue; arbol('cipres', x, sendaZ(x) - 9, 1.15); }
    for (const t in arboles) { const m = St.staticInstances(t, arboles[t]); if (m) pon(m); }
  }

  /* ---------- sombra fija de árboles y peñascos, echada hacia donde cae la sombra del sol (una llamada) ---------- */
  const L2 = Math.hypot(SOL.x, SOL.z), DX = -SOL.x / L2, DZ = -SOL.z / L2, largoSol = L2 / SOL.y;   /* metros de sombra por metro de alto */
  {
    const cS = document.createElement('canvas'); cS.width = cS.height = 64;
    const gc = cS.getContext('2d'), r = gc.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.45, 'rgba(0,0,0,.7)'); r.addColorStop(1, 'rgba(0,0,0,0)'); gc.fillStyle = r; gc.fillRect(0, 0, 64, 64);
    const tS = new THREE.CanvasTexture(cS), gS = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); texs.push(tS);
    const som = new THREE.InstancedMesh(gS, new THREE.MeshBasicMaterial({ map: tS, transparent: true, opacity: 0.42, depthWrite: false, color: 0x1a1408, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), Math.max(1, FIJAS.length));
    const Qs = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(DX, DZ)), M = new THREE.Matrix4(), Ps = new THREE.Vector3(), Es = new THREE.Vector3();
    FIJAS.forEach(([x, z, an, la], i) => { const px = x + DX * la * 0.35, pz = z + DZ * la * 0.35; Ps.set(px, alt(px, pz) + 0.08, pz); Es.set(an, 1, la); M.compose(Ps, Qs, Es); som.setMatrixAt(i, M); });
    som.count = FIJAS.length; som.frustumCulled = false; som.renderOrder = 1; pon(som);
  }

  /* ---------- polvo que levantan los pies: nubecillas donde se marcha o se lucha; a contraluz se doran (una llamada, 420 puntos). CG8a: y una nube grande donde chocan (golpe) ---------- */
  const NP = 420, pPos = new Float32Array(NP * 3), pVida = new Float32Array(NP).fill(1), pTam = new Float32Array(NP), pVel = new Float32Array(NP * 2);
  const gPol = new THREE.BufferGeometry(); gPol.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); gPol.setAttribute('aVida', new THREE.BufferAttribute(pVida, 1)); gPol.setAttribute('aTam', new THREE.BufferAttribute(pTam, 1));
  const POL_U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSol: { value: SOL }, uEsc: { value: 400 } };
  const polvo = new THREE.Points(gPol, new THREE.ShaderMaterial({ uniforms: POL_U, transparent: true, depthWrite: false, fog: true,
    vertexShader: `attribute float aVida, aTam; uniform float uEsc; uniform vec3 uSol; varying float vA; varying float vLuz;
      #include <fog_pars_vertex>
      void main(){ vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        float t = clamp(aVida, 0.0, 1.0); vA = t < 1.0 ? smoothstep(0.0, 0.15, t) * (1.0 - t) : 0.0;
        gl_PointSize = t < 1.0 ? aTam * (0.6 + 1.4 * t) * uEsc / max(1.0, -mvPosition.z) : 0.0;
        vec3 vista = normalize(position - cameraPosition); vLuz = pow(max(dot(vista, normalize(vec3(uSol.x, 0.3, uSol.z))), 0.0), 3.0);
        #include <fog_vertex>
      }`,
    fragmentShader: `varying float vA; varying float vLuz;
      #include <fog_pars_fragment>
      void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q, q) * 4.0; if (r > 1.0) discard;
        vec3 c = mix(vec3(0.66, 0.56, 0.42), vec3(1.0, 0.82, 0.55), vLuz);
        gl_FragColor = vec4(c, vA * 0.34 * (1.0 - r) * (1.0 - r));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` }));
  polvo.frustumCulled = false; polvo.renderOrder = 4; pon(polvo);
  let sigP = 0; const antes = new Map();
  function soltarPolvo(x, z, tam) { const i = sigP; sigP = (sigP + 1) % NP; pPos[i * 3] = x; pPos[i * 3 + 1] = 0.6 + rnd() * 0.8; pPos[i * 3 + 2] = z; pVida[i] = 0; pTam[i] = tam; pVel[i * 2] = (rnd() - 0.5) * 1.2; pVel[i * 2 + 1] = (rnd() - 0.5) * 1.2; }
  /* CG8a: el golpe de un choque o una carga: una cortina de polvo a lo largo del frente (x, z del centro, ancho en m, a = dirección del frente) */
  function golpe(x, z, ancho, a, fuerza) {
    const n = Math.round(14 + 10 * fuerza), ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < n; k++) { const l = (rnd() - 0.5) * ancho; soltarPolvo(x + ca * l + (rnd() - 0.5) * 4, z - sa * l + (rnd() - 0.5) * 4, (10 + rnd() * 9) * fuerza); const i = (sigP + NP - 1) % NP; pVel[i * 2] *= 3; pVel[i * 2 + 1] *= 3; pPos[i * 3 + 1] = 0.5 + rnd() * 2.5; }
  }
  function tick(dt, S, Sim, camara, altoPx) {
    if (camara && altoPx) POL_U.uEsc.value = altoPx / (2 * Math.tan(camara.fov * Math.PI / 360));
    if (!(dt > 0) || !S) return;
    for (let i = 0; i < NP; i++) if (pVida[i] < 1) { pVida[i] = Math.min(1, pVida[i] + dt / 3.2); pPos[i * 3] += pVel[i * 2] * dt; pPos[i * 3 + 2] += pVel[i * 2 + 1] * dt; pPos[i * 3 + 1] += dt * 0.9; }
    for (const u of S.man) {
      if (u.estado !== 'firme' && u.estado !== 'duda' && u.estado !== 'huye') { antes.delete(u.id); continue; }
      const a = antes.get(u.id), v = a ? Math.hypot(u.x - a.x, u.y - a.y) / dt : 0; antes.set(u.id, { x: u.x, y: u.y });
      const lucha = S.cont && S.cont[u.id] && S.cont[u.id].length > 0, ritmo = (lucha ? 2.2 : 0) + (v > 0.6 ? Math.min(2.6, v * 0.55) : 0);
      if (ritmo <= 0 || rnd() > ritmo * dt * 3) continue;
      const fr = Sim && Sim.frente ? Sim.frente(u) : 30, l = (rnd() - 0.5) * fr, lx = -Math.sin(u.a), ly = Math.cos(u.a), atras = lucha ? 0 : -6 * rnd();
      soltarPolvo(u.x + lx * l + Math.cos(u.a) * atras, -(u.y + ly * l + Math.sin(u.a) * atras), lucha ? 7 + rnd() * 6 : 5 + rnd() * 4);
    }
    gPol.attributes.position.needsUpdate = true; gPol.attributes.aVida.needsUpdate = true; gPol.attributes.aTam.needsUpdate = true;
  }

  return { alt, sol, SOL, HORIZ, sombra: { dx: DX, dz: DZ, largo: largoSol }, tick, golpe,
    soltar() {
      for (const o of puestos) { escena.remove(o); if (o.geometry) o.geometry.dispose(); }   /* los árboles (grupos) comparten geometría con el resto del juego: no se sueltan */
      for (const t of texs) t.dispose(); puestos.length = 0; texs.length = 0; escena.fog = null; escena.environment = null;
    } };
}
