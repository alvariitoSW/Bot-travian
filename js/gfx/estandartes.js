/* AQVILA · CG8a: el estandarte de cada manípulo en la batalla grande (js/ui-mando.js).
   Idea de las referencias del usuario (REF-batallas-referencias.md §2, fichas BG1): a altura de general cada unidad se lee como
   un bloque con su estandarte alto y la inicial de su tropa. Asta de madera con travesaño y disco de bronce (el signum del
   manípulo llevaba discos y una mano en lo alto; aquí, simplificado) y un paño del color del bando que se mece.
   Crece con la distancia para que de lejos siga viéndose (licencia de vista, como en los juegos de referencia).
   Coste: dos llamadas de dibujo en total (astas y paños, instanciados) y ~60 triángulos por unidad. Arte propio, dibujado aquí.
   Uso: const E = crearEstandartes({ THREE, escena, n, talla, letras: [[letra, lado], …] });
     E.pon(i, x, z, celda, lado, estado)   estado: 0 normal, 1 elegido, 2 roto (huye), -1 oculto
     E.fin(camara, altoPx, t)              al acabar de ponerlos, una vez por cuadro
     E.alto(i)                             alto (m) del último estandarte puesto en i: para colgar debajo las barras
     E.soltar() */
const CELDAS = 8, CW = 96, CH = 128;
const PANO = ['#b3261e', '#5b3a8c'], ORLA = ['#e8c25a', '#d8d0b8'];

function atlas(THREE, letras) {
  const c = document.createElement('canvas'); c.width = CW * CELDAS; c.height = CH * 2; const g = c.getContext('2d');
  for (let lado = 0; lado < 2; lado++) for (let k = 0; k < CELDAS; k++) {
    const x = k * CW, y = lado * CH;
    g.fillStyle = PANO[lado]; g.fillRect(x, y, CW, CH);
    /* pliegues: bandas verticales más oscuras y más claras */
    for (let b = 0; b < 6; b++) { g.fillStyle = b % 2 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.06)'; g.fillRect(x + b * CW / 6, y, CW / 6, CH - 16); }
    g.strokeStyle = ORLA[lado]; g.lineWidth = 6; g.strokeRect(x + 7, y + 5, CW - 14, CH - 26);
    /* flecos abajo */
    g.fillStyle = ORLA[lado]; for (let f = 0; f < 9; f++) g.fillRect(x + 6 + f * (CW - 12) / 9, y + CH - 18, 5, 16);
    const l = letras.find(q => q[2] === k && q[1] === lado);
    g.fillStyle = ORLA[lado]; g.font = 'bold 62px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 4;
    g.fillText(l ? l[0] : '', x + CW / 2, y + CH / 2 - 6); g.shadowBlur = 0;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* el asta en una sola geometría: palo, travesaño y disco en lo alto. Alto 1 (se escala); colores por vértice */
function asta(THREE) {
  const partes = [], col = (geo, c) => { const n = geo.attributes.position.count, a = new Float32Array(n * 3), C = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.deleteAttribute('uv'); partes.push(geo.toNonIndexed()); };
  col(new THREE.CylinderGeometry(0.011, 0.014, 1, 5, 1, true).translate(0, 0.5, 0), '#5a3e22');
  col(new THREE.BoxGeometry(0.5, 0.016, 0.016).translate(0, 0.9, 0), '#c9a24a');
  col(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 10).rotateX(Math.PI / 2).translate(0, 1.0, 0), '#e0b84e');
  col(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 10).rotateX(Math.PI / 2).translate(0, 0.94, 0), '#e0b84e');
  const n = partes.reduce((s, p) => s + p.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), co = new Float32Array(n * 3);
  let o = 0; for (const p of partes) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); co.set(p.attributes.color.array, o * 3); o += p.attributes.position.count; p.dispose(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(co, 3));
  return g;
}

export function crearEstandartes({ THREE, escena, n, talla = 1, letras = [] }) {
  const tex = atlas(THREE, letras);
  const gA = asta(THREE), mA = new THREE.MeshLambertMaterial({ vertexColors: true });
  const astas = new THREE.InstancedMesh(gA, mA, n); astas.frustumCulled = false;
  /* el paño: cuelga del travesaño (arriba en y = 0), 0,46 de ancho por 0,6 de alto; algo curvado; la celda del atlas va por instancia */
  const gP = new THREE.PlaneGeometry(0.46, 0.6, 4, 3).translate(0, -0.3, 0), pp = gP.attributes.position;
  for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i); pp.setZ(i, 0.035 * Math.sin(x * 22) - 0.04 * y); }
  gP.computeVertexNormals();
  const aCel = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2); gP.setAttribute('aCel', aCel);
  const mP = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  mP.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute vec2 aCel;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = vec2((aCel.x + uv.x) / ' + CELDAS.toFixed(1) + ', (aCel.y + uv.y) / 2.0);\n#endif');
  };
  mP.customProgramCacheKey = () => 'cg8a-pano';
  const panos = new THREE.InstancedMesh(gP, mP, n); panos.frustumCulled = false;
  for (let i = 0; i < n; i++) panos.setColorAt(i, new THREE.Color(1, 1, 1));
  astas.renderOrder = panos.renderOrder = 5;
  escena.add(astas); escena.add(panos);

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), SC = new THREE.Vector3(), C = new THREE.Color();
  const altos = new Float32Array(n), puestos = [];
  const BASE = 8 * talla;    /* metros, de cerca: algo más de tres hombres */

  function pon(i, x, z, celda, lado, estado) { puestos.push([i, x, z, celda, lado, estado]); }
  function fin(camara, altoPx, t) {
    const kpx = altoPx / (2 * Math.tan(camara.fov * Math.PI / 360)), cp = camara.position;
    for (const [i, x, z, celda, lado, estado] of puestos) {
      if (estado < 0) { M.makeScale(0, 0, 0); astas.setMatrixAt(i, M); panos.setMatrixAt(i, M); altos[i] = 0; continue; }
      const d = Math.hypot(x - cp.x, cp.y, z - cp.z);
      /* de lejos crece: como poco unos 46 px de alto en pantalla */
      const H = Math.max(BASE, 46 * d / kpx) * (estado === 1 ? 1.15 : 1), roto = estado === 2;
      altos[i] = H;
      const yawC = Math.atan2(cp.x - x, cp.z - z), inc = roto ? 0.5 : 0;
      E.set(0, yawC, inc, 'YXZ'); Q.setFromEuler(E); M.compose(P.set(x, 0, z), Q, SC.set(H, H, H)); astas.setMatrixAt(i, M);
      /* el paño, del travesaño hacia abajo; se mece al viento */
      const mece = 0.16 * Math.sin(t * 1.7 + i * 1.3) + 0.06 * Math.sin(t * 3.1 + i);
      P.set(0, 0.9 * H, 0).applyQuaternion(Q).add(SC.set(x, 0, z));
      E.set(mece, yawC + 0.18 * Math.sin(t * 0.9 + i * 2.1), inc, 'YXZ'); Q.setFromEuler(E);
      M.compose(P, Q, SC.set(H, H, H)); panos.setMatrixAt(i, M);
      aCel.setXY(i, celda % CELDAS, 1 - lado);
      C.setScalar(estado === 1 ? 1.25 : roto ? 0.45 : 0.9); panos.setColorAt(i, C);
    }
    puestos.length = 0;
    astas.instanceMatrix.needsUpdate = panos.instanceMatrix.needsUpdate = true; aCel.needsUpdate = true; panos.instanceColor.needsUpdate = true;
  }
  return {
    pon, fin, alto: i => altos[i],
    soltar() { escena.remove(astas); escena.remove(panos); gA.dispose(); gP.dispose(); mA.dispose(); mP.dispose(); tex.dispose(); }
  };
}
