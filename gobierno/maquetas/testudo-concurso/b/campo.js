/* GM43d · participante B «Campo de batalla»: el campo de Italia donde marcha el testudo.
   Suelo con tres texturas mezcladas (hierba seca, hierba verde y tierra pisada) y una senda; matas de hierba que se mecen,
   flores, piedras, árboles de 0 A.D. (pino, ciprés y olivo), lomas lejanas, montes con bruma y un cielo panorámico con nubes.
   Las texturas y el cielo son CC0 de Poly Haven (ver LICENSE.txt); los árboles, de 0 A.D. (CC BY-SA 3.0).
   No cambia nada de lo que se juega: donde pisan los hombres la altura del suelo es la misma función H de la maqueta. */
import { THREE } from '../../../../js/gfx/models.js';
import { loadStaticIndex, loadStatic, getStatic } from '../../../../js/gfx/statics.js';

const ARTE = n => new URL('./arte/' + n, import.meta.url).href;
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let semilla = 7; const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

/* ---------- ruido propio (el mismo en la tarjeta gráfica y aquí, para que hierba y calvas casen) ----------
   256×256, se repite sin costura. Canal r: manchas grandes; g: medianas; b: finas. */
const NR = 256, RUIDO = new Float32Array(NR * NR * 3);
{
  const red = (f, s) => { const g = new Float32Array(f * f); let k = s; for (let i = 0; i < f * f; i++) { k = (k * 16807) % 2147483647; g[i] = k / 2147483647; } return g; };
  const octava = (f, s) => { const g = red(f, s), o = new Float32Array(NR * NR);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NR; i++) { const x = i / NR * f, y = j / NR * f, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const v = (a, b) => g[((b % f) * f) + (a % f)]; o[j * NR + i] = (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy; }
    return o; };
  [[4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]].forEach((fs, c) => {
    const os = fs.map((f, k) => octava(f, 11 + c * 97 + k * 13)), pesos = [0.5, 0.27, 0.15, 0.08];
    for (let i = 0; i < NR * NR; i++) { let s = 0; for (let k = 0; k < 4; k++) s += os[k][i] * pesos[k]; RUIDO[i * 3 + c] = s; }
  });
  /* estirar al rango 0..1 */
  for (let c = 0; c < 3; c++) { let lo = 1, hi = 0; for (let i = 0; i < NR * NR; i++) { const v = RUIDO[i * 3 + c]; lo = Math.min(lo, v); hi = Math.max(hi, v); } for (let i = 0; i < NR * NR; i++) RUIDO[i * 3 + c] = (RUIDO[i * 3 + c] - lo) / (hi - lo); }
}
/* muestra con interpolación, como la textura (u, v en vueltas de textura) */
function ruido(u, v, c) {
  const x = ((u % 1) + 1) % 1 * NR - 0.5, y = ((v % 1) + 1) % 1 * NR - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
  const m = (a, b) => RUIDO[((((b % NR) + NR) % NR) * NR + (((a % NR) + NR) % NR)) * 3 + c];
  return (m(x0, y0) * (1 - tx) + m(x0 + 1, y0) * tx) * (1 - ty) + (m(x0, y0 + 1) * (1 - tx) + m(x0 + 1, y0 + 1) * tx) * ty;
}
function texRuido() {
  const d = new Uint8Array(NR * NR * 4); for (let i = 0; i < NR * NR; i++) { d[i * 4] = RUIDO[i * 3] * 255; d[i * 4 + 1] = RUIDO[i * 3 + 1] * 255; d[i * 4 + 2] = RUIDO[i * 3 + 2] * 255; d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, NR, NR); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}

/* hojas y pétalos: la cara de atrás, tan clara como la de delante (si no, media mata sale negra) */
const CARA_UNICA = THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0');

/* ---------- la senda que han pisado otros antes: sigue la marcha y se tuerce al pasar la loma ---------- */
const sendaX = z => 3.2 * Math.sin(z * 0.034 + 0.6) + 1.1 * Math.sin(z * 0.09) + 0.0004 * Math.max(0, -z - 110) ** 2;
const GLSL = `
uniform sampler2D uRuido;
float sendaX(float z){ return 3.2 * sin(z * 0.034 + 0.6) + 1.1 * sin(z * 0.09) + 0.0004 * pow(max(0.0, -z - 110.0), 2.0); }
float mascaraSenda(vec2 p, float n){ return (1.0 - smoothstep(0.5, 1.5, abs(p.x - sendaX(p.y)) + (n - 0.5) * 2.2)) * smoothstep(60.0, 25.0, p.y); }
`;
/* lo mismo aquí, para no poner matas en la senda ni en las calvas (mismas escalas que el sombreador del suelo) */
const masSenda = (x, z) => (1 - suave(0.5, 1.5, Math.abs(x - sendaX(z)) + (ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 2) - 0.5) * 2.2)) * suave(60, 25, z);
const masCalva = (x, z) => suave(0.72, 0.82, ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 1) + (ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 2) - 0.5) * 0.3);
const masVerde = (x, z) => suave(0.32, 0.62, ruido(x * 0.0031, z * 0.0031, 0) + (ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 1) - 0.5) * 0.5);

export async function crearCampo(escena, { H, SOL }) {
  const SIN = (new URLSearchParams(location.search).get('sin') || '').split(',');
  const cargar = n => new THREE.TextureLoader().loadAsync(ARTE(n)).then(t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; });
  const [tSeca, tVerde, tTierra, tRoca, tCielo] = await Promise.all(['hierba_seca.jpg', 'hierba_verde.jpg', 'tierra.jpg', 'roca.jpg', 'cielo.jpg'].map(cargar));
  tCielo.generateMipmaps = false; tCielo.minFilter = THREE.LinearFilter;   /* sin mipmaps: si no, la costura del panorama sale como una raya */
  const uRuido = { value: texRuido() }, uT = { value: 0 };

  /* el color de la bruma es el del cielo junto al horizonte */
  const BRUMA = new THREE.Color('#b9c2cb');
  escena.background = BRUMA.clone(); escena.fog = new THREE.FogExp2(BRUMA, 0.0019);

  /* lomas: solo lejos de donde se juega (fuera de ahí, H tal cual) */
  const HF = (x, z) => {
    const r = Math.max(-z - 150, Math.abs(x) - 95, z - 70); if (r <= 0) return H(x, z);
    const a = suave(0, 300, r), n = ruido(x * 0.0011 + 0.2, z * 0.0011 + 0.6, 0), m = ruido(x * 0.004, z * 0.004, 1);
    return H(x, z) + a * (4 + 85 * n * n + 22 * m);
  };

  /* ---------- cielo: panorama con nubes (Poly Haven, CC0), girado para que su sol caiga donde el de la escena ---------- */
  {
    const uOff = 0.6 - (Math.atan2(SOL.z, SOL.x) / (2 * Math.PI) + 0.5);
    const m = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uCielo: { value: tCielo }, uOff: { value: uOff }, uB: { value: BRUMA } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vD; uniform sampler2D uCielo; uniform float uOff; uniform vec3 uB;
        void main(){ vec3 d = normalize(vD); float el = asin(clamp(d.y, -1.0, 1.0));
          float u = fract(atan(d.z, d.x) / 6.2831853 + 0.5 + uOff), v = clamp((el + 0.0733) / 1.6441, 0.002, 0.998);
          vec3 c = texture2D(uCielo, vec2(u, v)).rgb;
          float l = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(l), 0.18) * vec3(1.03, 1.0, 0.95);   /* algo menos saturado y más cálido, como el resto del juego */
          c = mix(c, uB, (1.0 - smoothstep(-0.01, 0.16, d.y)) * 0.7);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }` }));
    m.renderOrder = -10; m.frustumCulled = false; escena.add(m);
    escena.userData.cielo = m;
  }

  /* ---------- montes: dos cordilleras con silueta, pliegues y bruma al pie ---------- */
  [[2600, 230, '#5f6e66', 0.42, 7.0], [5600, 820, '#7d8ea3', 0.55, 3.0]].forEach(([r, alt, col, bruma, fq], k) => {
    const n = 420, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = t * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const h = alt * (0.18 + 0.75 * ruido(t * fq, 0.13 + k * 0.4, 0) ** 1.5 + 0.22 * ruido(t * fq * 4, 0.7 + k * 0.2, 1) + 0.06 * ruido(t * fq * 16, 0.4, 2));
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
          #include <colorspace_fragment>
        }` }));
    m.renderOrder = -9 + (1 - k); m.frustumCulled = false; escena.add(m);
  });

  /* ---------- suelo: hierba seca, manchas verdes, calvas y senda de tierra; dos escalas para que no se vea la repetición ---------- */
  /* dos materiales: el de cerca, completo; el de lejos (lomas), con menos lecturas de textura */
  const sueloMat = lejos => { const matSuelo = new THREE.MeshLambertMaterial({ color: 0xffffff }); matSuelo.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uRuido, uSeca: { value: tSeca }, uVerde: { value: tVerde }, uTierra: { value: tTierra } });
    sh.vertexShader = 'varying vec3 vW; varying float vNy;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vNy = objectNormal.y;');
    sh.fragmentShader = 'varying vec3 vW; varying float vNy; uniform sampler2D uSeca, uVerde, uTierra;\n' + GLSL + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 p = vW.xz; const mat2 GIRO = mat2(0.8, -0.6, 0.6, 0.8);
      float n1 = texture2D(uRuido, p * 0.0031).r;
      #ifdef LEJOS
      vec3 seca = texture2D(uSeca, GIRO * p * 0.073 + 0.37).rgb * vec3(1.06, 1.1, 0.82), verde = texture2D(uVerde, p * 0.061 + 0.6).rgb * vec3(1.12, 1.18, 0.92);
      vec3 c = mix(seca, verde, smoothstep(0.32, 0.62, n1) * 0.85);
      #else
      vec2 nn = texture2D(uRuido, p * 0.013 + 0.3).gb; float n2 = nn.x, n3 = nn.y;
      vec3 seca = mix(texture2D(uSeca, p * 0.21).rgb, texture2D(uSeca, GIRO * p * 0.073 + 0.37).rgb, 0.45) * vec3(1.06, 1.1, 0.82);
      vec3 verde = texture2D(uVerde, GIRO * p * 0.12).rgb * vec3(1.12, 1.18, 0.92);
      vec3 tierra = texture2D(uTierra, p * 0.26).rgb;
      float mV = smoothstep(0.32, 0.62, n1 + (n2 - 0.5) * 0.5);
      vec3 c = mix(seca, verde, mV * 0.85);
      float calva = smoothstep(0.72, 0.82, n2 + (n3 - 0.5) * 0.3), senda = mascaraSenda(p, n3);
      float orilla = mascaraSenda(p * vec2(0.5, 1.0) + vec2(sendaX(p.y) * 0.5, 0.0), n2);   /* hierba pisada a los lados */
      c = mix(c, tierra, max(max(senda * 0.85, calva * 0.6), orilla * 0.3));
      #endif
      c = mix(c, seca * vec3(1.08, 1.0, 0.86), smoothstep(0.97, 0.85, vNy) * 0.5);   /* laderas, más secas */
      /* lejos, matorral mediterráneo: manchas de verde oscuro por las lomas */
      { float mq = texture2D(uRuido, p * 0.0093 + 0.71).g, lj = smoothstep(80.0, 220.0, max(abs(p.x), -p.y - 60.0));
        c = mix(c, vec3(0.2, 0.25, 0.12), smoothstep(0.52, 0.68, mq) * 0.65 * lj); }
      c *= mix(0.84, 1.1, n1);
      diffuseColor.rgb *= c * 1.08;`);
    if (lejos) sh.fragmentShader = '#define LEJOS\n' + sh.fragmentShader;
  }; matSuelo.customProgramCacheKey = () => 'campo-suelo-' + lejos; return matSuelo; };
  {
    const plano = (lado, seg, cx, cz, hunde) => {
      const g = new THREE.PlaneGeometry(lado, lado, seg, seg); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, HF(x, z) - (hunde ? hunde(x, z) : 0)); }
      g.computeVertexNormals(); g.deleteAttribute('uv');
      if (hunde) { const I = g.index.array, q = []; for (let i = 0; i < I.length; i += 3) { if (![I[i], I[i + 1], I[i + 2]].every(k => hunde(p.getX(k), p.getZ(k)) > 0)) q.push(I[i], I[i + 1], I[i + 2]); } g.setIndex(q); }   /* lo que tapa el suelo de cerca no se dibuja */
      const m = new THREE.Mesh(g, sueloMat(!!hunde)); if (!(hunde && SIN.includes('lejos'))) escena.add(m); return m;
    };
    plano(700, 175, 0, -80);
    /* lejos, más grueso; por debajo del de cerca donde se solapan */
    plano(3200, 120, 0, -300, (x, z) => (Math.abs(x) < 344 && z < 264 && z > -424) ? 2.5 : 0);
  }

  /* ---------- matas de hierba: hojas curvas de verdad, cada mata distinta de tamaño, tono e inclinación, sin rejilla ---------- */
  const matHierba = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  matHierba.onBeforeCompile = sh => {
    sh.uniforms.uT = uT; sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', CARA_UNICA);   /* la cara de atrás de la hoja, tan clara como la de delante */
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]); float h = transformed.y * transformed.y;
        float w = sin(uT * 1.6 + ip.x * 0.31 + ip.y * 0.17) * 0.7 + sin(uT * 2.7 + ip.x * 0.8 - ip.y * 0.5) * 0.3;
        transformed.x += w * h * 0.16; transformed.z += w * h * 0.07; }`);
  };
  {
    const pos = [], col = [], nor = [], idx = []; let v = 0;
    const HOJAS = 7;
    for (let b = 0; b < HOJAS; b++) {
      const a = azar() * Math.PI * 2, r = Math.sqrt(azar()) * 0.17, bx = Math.cos(a) * r, bz = Math.sin(a) * r;
      const h = 0.5 + azar() * 0.5, w = 0.018 + azar() * 0.014, cara = azar() * Math.PI, px = Math.cos(cara) * w, pz = Math.sin(cara) * w;
      const dl = a + (azar() - 0.5) * 1.2, l = (0.12 + azar() * 0.4) * h, lx = Math.cos(dl) * l, lz = Math.sin(dl) * l;
      const pt = t => [bx + lx * t * t, h * t * (1 - 0.15 * t * t * (l / h)), bz + lz * t * t];
      const m = pt(0.5), tp = pt(1);
      pos.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, m[0] - px * 0.7, m[1], m[2] - pz * 0.7, m[0] + px * 0.7, m[1], m[2] + pz * 0.7, tp[0], tp[1], tp[2]);
      const g0 = 0.55, g1 = 0.85; col.push(g0, g0, g0, g0, g0, g0, g1, g1, g1, g1, g1, g1, 1, 1, 1);
      for (let i = 0; i < 5; i++) nor.push(0, 1, 0);
      idx.push(v, v + 1, v + 3, v, v + 3, v + 2, v + 2, v + 3, v + 4); v += 5;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    const lista = [], o = new THREE.Object3D(), c = new THREE.Color();
    const SECA = [new THREE.Color('#c9b46c'), new THREE.Color('#b3a05a'), new THREE.Color('#a8a85a')], VERDE = [new THREE.Color('#7e9440'), new THREE.Color('#6b8436'), new THREE.Color('#94a050')];
    const pon = (x, z, esc) => {
      const mv = masVerde(x, z), pal = azar() < mv ? VERDE : SECA; c.copy(pal[Math.floor(azar() * 3)]).multiplyScalar(0.85 + azar() * 0.3);
      o.position.set(x, H(x, z) - 0.02, z); o.rotation.set((azar() - 0.5) * 0.25, azar() * 6.28, (azar() - 0.5) * 0.25);
      const s = esc * (0.6 + azar() * azar() * 1.0); o.scale.set(s * (0.8 + azar() * 0.5), s * (0.7 + azar() * 0.6), s * (0.8 + azar() * 0.5)); o.updateMatrix();
      lista.push([o.matrix.clone(), c.clone()]);
    };
    /* cerca de la marcha, densas; más allá, sueltas y más altas (dan silueta contra el suelo) */
    let n = 0;
    while (n < 5000) { const x = (azar() - 0.5) * 56, z = 22 - azar() * 150; const d = (1 - masSenda(x, z) * 0.9) * (1 - masCalva(x, z) * 0.85) * (0.45 + 0.55 * ruido(x * 0.03, z * 0.03, 2) ** 0.7); if (azar() < d) { pon(x, z, 0.62); n++; } }
    n = 0;
    while (n < 1100) { const x = (azar() - 0.5) * 200, z = 30 - azar() * 260; if (Math.abs(x) < 27 && z > -125) continue; const d = (1 - masCalva(x, z)) * ruido(x * 0.02, z * 0.02, 1); if (azar() < d) { pon(x, z, 0.95); n++; } }
    const im = new THREE.InstancedMesh(g, matHierba, lista.length); lista.forEach(([m, cc], i) => { im.setMatrixAt(i, m); im.setColorAt(i, cc); });
    im.frustumCulled = false; if (!SIN.includes('hierba')) escena.add(im);
  }

  /* ---------- flores silvestres en corros: amapolas, manzanilla, crisantemo amarillo y aciano ---------- */
  {
    const pos = [], col = [], nor = [], cab = [], idx = []; let v = 0;
    const q = (a, b, c2, d, cc, k) => { for (const p of [a, b, c2, d]) { pos.push(...p); col.push(...cc); nor.push(0, 1, 0); cab.push(k); } idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4; };
    const TALLO = [0.34, 0.45, 0.2];
    q([-0.006, 0, 0], [0.006, 0, 0], [0.006, 0.34, 0], [-0.006, 0.34, 0], TALLO, 0);
    q([0, 0, -0.006], [0, 0, 0.006], [0, 0.34, 0.006], [0, 0.34, -0.006], TALLO, 0);
    /* corola: seis pétalos en abanico, algo inclinada hacia arriba */
    const R0 = 0.045; pos.push(0, 0.35, 0); col.push(0.7, 0.6, 0.2); nor.push(0, 1, 0); cab.push(1); const centro = v++;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = i % 2 ? R0 * 0.75 : R0; pos.push(Math.cos(a) * r, 0.35 + r * 0.35, Math.sin(a) * r); col.push(1, 1, 1); nor.push(0, 1, 0); cab.push(1); }
    for (let i = 0; i < 12; i++) idx.push(centro, centro + 1 + i, centro + 1 + (i + 1) % 12);
    v += 12;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aCab', new THREE.Float32BufferAttribute(cab, 1)); g.setIndex(idx);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', CARA_UNICA); sh.vertexShader = 'attribute float aCab; uniform float uT;\n' + sh.vertexShader.replace('#include <color_vertex>', 'vColor = vec3(1.0); vColor *= color; vColor *= mix(vec3(1.0), instanceColor.xyz, aCab);')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n { vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]); float w = sin(uT * 1.6 + ip.x * 0.31 + ip.y * 0.17); transformed.x += w * transformed.y * transformed.y * 0.25; }'); };
    const COLORES = [['#c0261b', 0.45], ['#efe9d6', 0.25], ['#e2b52a', 0.2], ['#5a63b5', 0.1]].map(([h, p]) => [new THREE.Color(h), p]);
    const lista = [], o = new THREE.Object3D();
    for (let k = 0; k < 170; k++) {
      let cx = (azar() - 0.5) * 50, cz = 18 - azar() * 140; if (masSenda(cx, cz) > 0.3) cx += 6;
      let r = azar(), color = COLORES[0][0]; for (const [cc, p] of COLORES) { if (r < p) { color = cc; break; } r -= p; }
      const cuantas = 6 + Math.floor(azar() * 22), radio = 1 + azar() * 2.5;
      for (let i = 0; i < cuantas; i++) {
        const a = azar() * 6.28, d = Math.sqrt(azar()) * radio, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (masSenda(x, z) > 0.4) continue;
        o.position.set(x, H(x, z) - 0.02, z); o.rotation.set((azar() - 0.5) * 0.4, azar() * 6.28, (azar() - 0.5) * 0.4); o.scale.setScalar(1.0 + azar() * 0.5); o.updateMatrix();
        lista.push([o.matrix.clone(), color.clone().multiplyScalar(0.85 + azar() * 0.25)]);
      }
    }
    const im = new THREE.InstancedMesh(g, mat, lista.length); lista.forEach(([m, cc], i) => { im.setMatrixAt(i, m); im.setColorAt(i, cc); });
    im.frustumCulled = false; escena.add(im);
  }

  /* ---------- piedras: guijarros en la senda, piedras sueltas y algún peñasco lejos de la marcha ---------- */
  {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, uv = [], col = [], P = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      P.fromBufferAttribute(p, i); const n = ruido(P.x * 0.21 + 0.5, P.z * 0.21 + P.y * 0.13, 1), f = 0.78 + 0.42 * n;
      P.multiplyScalar(f); P.y *= 0.62; if (P.y < -0.15) P.y = -0.15 + (P.y + 0.15) * 0.3; p.setXYZ(i, P.x, P.y, P.z);
      uv.push((P.x + P.z * 0.6) * 0.45, (P.y + P.z * 0.4) * 0.45);
      const ao = 0.55 + 0.45 * suave(-0.2, 0.5, P.y); col.push(ao, ao, ao * 0.97);
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const lista = [], o = new THREE.Object3D(), c = new THREE.Color();
    const pon = (x, z, s) => { o.position.set(x, H(x, z) - s * 0.12, z); o.rotation.set((azar() - 0.5) * 0.5, azar() * 6.28, (azar() - 0.5) * 0.5); o.scale.set(s * (0.8 + azar() * 0.5), s * (0.7 + azar() * 0.6), s * (0.8 + azar() * 0.5)); o.updateMatrix(); c.setHSL(0.09 + azar() * 0.04, 0.12 + azar() * 0.1, 0.62 + azar() * 0.2); lista.push([o.matrix.clone(), c.clone()]); };
    for (let i = 0; i < 260; i++) { const z = 20 - azar() * 135, x = sendaX(z) + (azar() - 0.5) * 3; pon(x, z, 0.04 + azar() * 0.07); }
    for (let i = 0; i < 190; i++) { const x = (azar() - 0.5) * 90, z = 20 - azar() * 160; pon(x, z, (0.08 + azar() * azar() * 0.35) * (1 + masCalva(x, z))); }
    for (let i = 0; i < 18; i++) { let x = (azar() - 0.5) * 160, z = 10 - azar() * 220; if (Math.abs(x) < 18) x += Math.sign(x || 1) * 18; pon(x, z, 0.7 + azar() * 1.4); }
    const mat = new THREE.MeshLambertMaterial({ map: tRoca, vertexColors: true });
    const im = new THREE.InstancedMesh(g, mat, lista.length); lista.forEach(([m, cc], i) => { im.setMatrixAt(i, m); im.setColorAt(i, cc); });
    im.frustumCulled = false; escena.add(im);
  }

  /* ---------- árboles de 0 A.D.: hilera de cipreses junto a un lindero, pinos en corro tras la loma, un olivar y árboles sueltos por las lomas ---------- */
  try {
    await loadStaticIndex(); await Promise.all(['cipres', 'pino', 'olivo'].map(loadStatic));
    const L = { cipres: [], pino: [], olivo: [] }, Q = new THREE.Quaternion(), ARR = new THREE.Vector3(0, 1, 0);
    const arbol = (k, x, z, s) => { Q.setFromAxisAngle(ARR, azar() * 6.28); const e = s * (0.85 + azar() * 0.3); L[k].push(new THREE.Matrix4().compose(new THREE.Vector3(x, HF(x, z) - 0.3, z), Q, new THREE.Vector3(e, e * (0.9 + azar() * 0.25), e))); };
    for (let z = -6; z > -260; z -= 7 + azar() * 5) { if (azar() < 0.15) continue; arbol('cipres', 36 + z * 0.06 + (azar() - 0.5) * 1.5, z, 1.7); }
    for (const [cx, cz, n] of [[-24, -182, 5], [30, -222, 6], [-70, -150, 4], [-130, -260, 7], [95, -175, 5], [-12, -300, 6], [60, -330, 6]]) for (let i = 0; i < n; i++) arbol('pino', cx + (azar() - 0.5) * 22, cz + (azar() - 0.5) * 18, 1.05);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) { if (azar() < 0.12) continue; arbol('olivo', -62 - i * 11 + (azar() - 0.5) * 2, -40 - j * 12 + (azar() - 0.5) * 2, 0.62); }
    /* bosquetes por las lomas: más olivos y cipreses (baratos) que pinos */
    for (let i = 0; i < 450; i++) { const a = -Math.PI * (0.02 + azar() * 0.96), d = 230 + azar() * 950, x = Math.cos(a) * d * 1.3, z = Math.sin(a) * d - 60; if (ruido(x * 0.0035, z * 0.0035, 1) < 0.56) continue; const k = azar(); if (k < 0.55) arbol('olivo', x, z, 0.9); else if (k < 0.93) arbol('cipres', x, z, 1.9); else arbol('pino', x, z, 1.3); }
    /* material propio, más barato que el del juego (Lambert sin mapas de relieve ni brillo): las hojas son muchas tarjetas con recorte */
    const texA = new Map(), matA = f => { if (!texA.has(f)) { const t = new THREE.TextureLoader().load('assets/static/' + f); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; texA.set(f, new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.45, side: THREE.DoubleSide })); } return texA.get(f); };
    for (const k in L) { const st = getStatic(k); if (!st || !L[k].length || SIN.includes('arboles')) continue;
      for (const p of st.parts) { const im = new THREE.InstancedMesh(p.geo, matA(p.file), L[k].length); L[k].forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; escena.add(im); } }
  } catch (e) { console.warn('Sin árboles', e); }

  /* ---------- sombra de contacto: una mancha suave bajo cada hombre, echada hacia donde cae la sombra (una sola llamada de dibujo) ---------- */
  const NS = 64, cS = document.createElement('canvas'); cS.width = cS.height = 64;
  { const g = cS.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.45, 'rgba(0,0,0,.7)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const tS = new THREE.CanvasTexture(cS), gS = new THREE.PlaneGeometry(1, 1); gS.rotateX(-Math.PI / 2);
  const sombras = new THREE.InstancedMesh(gS, new THREE.MeshBasicMaterial({ map: tS, transparent: true, opacity: 0.5, depthWrite: false, color: 0x1a1408, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), NS);
  sombras.frustumCulled = false; sombras.renderOrder = 1; escena.add(sombras);
  const SX = -SOL.x / SOL.y, SZ = -SOL.z / SOL.y, MS = new THREE.Matrix4(), PS = new THREE.Vector3(), QS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(SX, SZ)), ES = new THREE.Vector3();
  let nS = 0;
  const sombra = (x, z, tumbado) => { if (nS >= NS) return; const y = H(x, z) + 0.02; if (tumbado) { PS.set(x, y, z); ES.set(1.1, 1, 2.2); } else { PS.set(x + SX * 0.35, y, z + SZ * 0.35); ES.set(0.95, 1, 1.25 + 0.6); } MS.compose(PS, QS, ES); sombras.setMatrixAt(nS++, MS); };
  const sombrasFin = () => { sombras.count = nS; sombras.instanceMatrix.needsUpdate = true; nS = 0; };

  return { HF, tick: t => { uT.value = t; }, sombra, sombrasFin };
}
