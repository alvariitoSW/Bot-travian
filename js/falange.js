/* AQVILA — FA1: las reglas de la falange a pie, sin pantalla (corre en Node y en el navegador). Módulo ES.
   Tú eres el oficial (lochagos) en el centro de la primera fila. No dibuja ni suena: todo sale por avisa(tipo, datos).

   ===================== CONTRATO COMÚN DE LA FALANGE (lo fija FA1; no se cambia sin avisarlo en el parte) =====================
   import { crearFalange } from './falange.js';
   const F = crearFalange(m);
     m = { semilla,            número: misma semilla, misma partida (por defecto 1)
           rival,              módulo del rival { nombre, crea(S, azar), paso(S, dt), choque(S, h) }; por defecto MANIPULOS
           avisa,              función (tipo, datos) hacia pantalla y sonido; en Node, nada
           H,                  función (x, z) → altura del suelo; por defecto 0
           hombres,            falangitas (12 de frente; por defecto 96)
           terreno,            { x, z, r } del trozo roto, null para ninguno; si falta, sale al azar con la semilla
           locomocion }        opcional { crearPaso, velocidad, pisa } (la de la maqueta) para que los pies no patinen
   F = { S, reinicia(), paso(dt), toque(), estocada(), gira(dir), fila(i, abajo), orden(n), marcado(), frente(), bot(modo), resumen() }

   EL ESTADO S (lo lee la escena para dibujar; los rivales lo leen y escriben solo lo suyo)
     S.T                 segundos de partida
     S.fase              'marcha' | 'choque' | 'fin'           S.ganador  null | 'falange' | 'rival'     S.causa  'empuje' | 'bajas' | 'flanco' | 'hueco' | 'animo'
     S.rival             'manipulos' | 'caballeria' | 'elefantes' | 'falange' | 'hoplitas' (el nombre del módulo)
     S.xF, S.zF          el pivote del muro: el centro de la primera fila, en el mundo
     S.giro              radianes; 0 = el muro mira a −z; positivo = ha girado a su derecha (+x). Gira a V_GIRO (8°/s), tope ±90°
     S.girando           −1 | 0 | 1: hacia dónde está girando ahora
     S.filas[5]          true = esa fila lleva la sarisa bajada (0 = la primera). Bajadas ensartan y cansan; alzadas paran proyectiles
     S.flanco            null | { lado: −1 | 1, hombres: [...], t0, tI, estado: 'viene' | 'parado' | 'dentro' }
                         lado 1 = por la derecha del muro. hombres son hombres de verdad de S.ene (andan por el campo). tI = cuándo llegan
     S.pulso             0–1: por dónde va el compás (0 = el «¡Ha!»). Un latido cada PULSO s; vale el toque a ±VENTANA s
     S.orden             null | 'aguantar' | 'empujar' | 'cerrar' | 'retroceder'
     S.coh               cohesión del muro, 0–100             S.ganado   metros ganados empujando desde el choque
     S.yo                { i, tEstocada, blanco, muertes }: tu índice en S.fal, cuándo clavaste por última vez, a quién marcas (o null)
     S.fal[]             tus hombres { i, f (columna), r (fila entre los vivos), r0, x, z, yaw, vivo, huye, muere, kB (0 alzada–1 bajada), tG }
     S.ene[]             los del rival { i, x, z, yaw, vivo, muere, est, tipo, toca }. est es del rival, salvo 'dentro' y 'huye', que entiende el motor
                         tipo: 'infante' | 'jinete' | 'elefante' | 'piquero'.  toca: null | 'puntas' | 'frente' | 'der' | 'izq' | 'espalda'
     S.U, S.R            las dos unidades (crearUnidad): enPie, animo, cansancio, roto. S.R la crea el rival en crea()
     S.terreno           null | { x, z, r }: el trozo roto. S.enRoto = parte de la primera fila que lo pisa (0–1)
     S.proyectiles[]     { est, p, dir, ... } pila y demás en vuelo (est 0 libre, 1 vuela, 2 clavado en asta, 3 escudo, 4 hombre, 5 suelo)
     S.motor             lo que el motor presta a los rivales (abajo)

   GEOMETRÍA. frente = (sen giro, −cos giro); derecha = (cos giro, sen giro). El hombre de columna f y fila r está en
     pivote + lx·derecha − r·DZ·frente, con lx = (f − (FILES−1)/2)·DX, y mira con yaw = π − giro.
   Las puntas cubren un rectángulo por delante de la primera fila: de 0 a frente() metros y el ancho del muro. Quien llega por ahí
   toca 'puntas'; quien llega al cuerpo por otro sitio toca 'frente' (sin puntas), 'der', 'izq' o 'espalda'.

   LOS RIVALES son módulos { nombre, crea(S, azar), paso(S, dt), choque(S, h) }:
     crea(S, azar)     mete sus hombres en S.ene y su unidad en S.R
     paso(S, dt)       los mueve y decide (cargar, lanzar, mandar un flanco con S.motor.flanco)
     choque(S, h)      el motor la llama cuando h cambia de h.toca (acaba de llegar a las puntas o al cuerpo). El rival decide qué le
                       pasa con las ayudas del motor (ensartarlo, que entre, que recule)
   S.motor = { azar(), avisa(tipo, datos),
     local(x, z)             → { delante, lado, ang }: metros por delante de la primera fila, a la derecha del pivote, y el ángulo
     puesto(f, r)            → { x, z } del puesto de columna f y fila r
     frente()                → metros que salen las puntas por delante de la primera fila (0 si no hay filas bajadas)
     bajadas()               → cuántas de las cinco filas están bajadas
     mueve(h, tx, tz, v, dt)   mueve a un hombre hacia un punto, con su paso
     ensarta(h, p)           → true si cae en las puntas (tirada p por fila bajada; por defecto P_ENSARTA)
     entra(h, por)             h se cuela ('frente' | 'der' | 'izq' | 'espalda'): pasa a est 'dentro' y el motor le hace matar
     caeRival(h), caeFalangita(h, causa), cohesion(x)
     flanco(lado, hombres, aviso)   declara el flanco: llena S.flanco y avisa('flanco', { lado, hombres })
     proyectil(desde, blanco, vuelo)   lanza un proyectil contra un falangita; al llegar, el motor tira si lo para un asta alzada }
   La escena monta el dibujo de cada rival llamando a montaRival(ctx) del archivo del rival, si existe (FA4 y FA7).

   AVISOS (avisa): 'pulso' · 'ha' { metros } · 'destiempo' · 'grito' { texto } · 'fila' { i, abajo } · 'gira' { dir } · 'flanco' { lado, hombres } ·
     'flancoParado' · 'flancoEntra' { lado } · 'dentro' { h, por } · 'cae' { h, quien } · 'estocada' { h, acierta } · 'choque' · 'salva' ·
     'clava' | 'escudo' | 'tierra' { p } · 'roto' { dentro } · 'rompe' { ganador, causa } · 'fin'

   HISTORIA (plan FA0 §5; skill historia). Histórico: oficial en la primera fila que clava su sarisa (Asclepiódoto 2); cinco puntas por
   delante y astas alzadas que frenan proyectiles (Polibio 18.29–30); flanco débil y terreno roto que abre el muro (Polibio 18.31–32;
   Pidna, Plutarco, Emilio 20). Licencia de juego: el compás a toques, los gestos, las tiradas de dado, 96 hombres en 8 filas (una
   sintagma tenía 16 de fondo), que el frente romano afloje mientras el flanco rodea, y que un giro de 8°/s baste para encarar. */

export const FILES = 12, DX = 0.78, DZ = 0.95, BAJAN = 5;          /* 12 de frente, prietos (Polibio: unos 3 pies); bajan cinco filas */
export const SARISA = 6.3, AGARRE = 1.7, ALCANCE = SARISA - AGARRE - 0.25;   /* cuánto sale la punta de la primera fila */
export const PULSO = 1.6, VENTANA = 0.2;                            /* el compás (s) y su ventana (±s). TP9-0 §2.7 */
export const V_GIRO = 8 * Math.PI / 180, GIRO_MAX = Math.PI / 2;    /* el muro gira con peso: 8° por segundo */
export const AVISO_FLANCO = 8;                                      /* segundos entre el aviso y la llegada del flanco */
export const META = 15;                                             /* metros que hay que ganar para que el rival ceda */
export const PASO_HA = 0.5, P_ENSARTA = 0.05, P_PARA_PILA = 0.6;    /* medio metro por «¡Ha!»; tirada por fila bajada; 6 de cada 10 pila con todo alzado */
export const ORDENES = ['aguantar', 'empujad', 'cerrar', 'retroceder'];
export const BOTS = ['compas', 'destiempo', 'nogira', 'loco'];
export const RIVALES = ['manipulos', 'caballeria', 'elefantes', 'falange', 'hoplitas'];

/* ===================== FA1: las reglas (pasadas de gobierno/maquetas/falange/acciones.js) =====================
   Añadidos al contrato (no cambian nada de arriba):
     S.choque, S.tChoque     si ya hubo choque y cuándo          S.toques { buenos, malos }: toques al compás y a destiempo
     S.tOrden                cuándo se dio la orden de ahora      S.riv     el estado propio del rival (lo crea y lo lee el rival)
     S.flanco.tR             cuándo se resolvió el flanco (null mientras viene)
     S.motor.centro()        → { x, z } del centro del cuerpo     S.motor.mundo(delante, lado) → { x, z } (inversa de local)
     S.motor.bajadas(), S.motor.resuelveFlanco(estado)            ('parado' | 'dentro': cambia S.flanco y avisa)
     m.zancadas              { walk, run } para crearPaso de la locomoción fina (por defecto 1,5 y 2,2 m)
   Regla añadida (licencia de juego): con S.ganado ≤ −META cede la falange (causa 'empuje'). */
export const PASO_MARCHA = 1.3, PASO_EMPUJE = 0.8, CEDE = 0.25, V_RETRO = 0.6, V_PIVOTE = 1.6;
export const P_FLANCO = 0.35, ANG_FLANCO = 97 * Math.PI / 180, R_FLANCO = 14, MATA_FLANCO = 0.6, MATA_FRENTE = 2.5;
export const ENFRIA = 1.2, P_COMPAS = 0.7, P_FUERA = 0.35, P_COLADO = 0.9;
export const V_ROM = 1.3, V_CARGA = 4.0, V_HUYE = 4.6, D_PILA = 19;
export const COLS_R = 12, DX_R = 0.85, DZ_R = 1.4, N_R = 96;
const GIRO_BOT = 57 * Math.PI / 180;
const lim = (x, a, b) => Math.max(a, Math.min(b, x));
const hacia = (v, o, d) => v < o ? Math.min(o, v + d) : Math.max(o, v - d);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
/* azar con semilla (mulberry32): misma semilla, misma partida */
export function azarSemilla(s) {
  let a = (s >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* Pieza «unidad» (copiada de la maqueta): enPie, animo, cansancio, roto. Con ánimo 0,12 o menos, o con menos de un tercio, rompe */
export const ROMPE = 0.12;
export function crearUnidad({ hombres, nombre = '', ref = hombres }) {
  const peso = 0.75 / ref;
  const u = {
    nombre, hombres, enPie: hombres, animo: 0.8, cansancio: 0, roto: false, tRoto: -1, hizo: 0, sufrio: 0, T: 0,
    get aliento() { return 1 - u.cansancio; },
    baja(n = 1) { u.enPie = Math.max(0, u.enPie - n); u.sufrio += n; u.anima(-peso * n); },
    causa(n = 1) { u.hizo += n; u.anima(0.012 * n); },
    anima(x) { if (u.roto) return; u.animo = Math.min(1, Math.max(0, u.animo + x)); u.mira(); },
    cansa(dt, x) { u.cansancio = Math.min(1, Math.max(0, u.cansancio + dt * x)); },
    mira() { if (!u.roto && (u.animo <= ROMPE || u.enPie < u.hombres / 3)) { u.roto = true; u.tRoto = u.T; u.animo = 0; } },
    tic(dt) {
      u.T += dt; const k = Math.pow(0.5, dt / 6); u.hizo *= k; u.sufrio *= k;
      if (u.cansancio > 0.7) u.anima(-0.004 * dt);
      if (u.combate() === 'perdiendo') u.anima(-0.006 * dt);
    },
    combate() { return u.hizo > u.sufrio * 1.3 + 0.3 ? 'ganando' : u.sufrio > u.hizo * 1.3 + 0.3 ? 'perdiendo' : 'igualado'; },
    palabras() {
      return { enPie: u.enPie, animo: u.roto ? 'rompe' : u.animo > 0.45 ? 'firme' : 'duda',
        cansancio: u.cansancio < 0.35 ? 'fresca' : u.cansancio < 0.7 ? 'cansada' : 'agotada', combate: u.combate() };
    },
  };
  return u;
}

/* ---------- El rival de manípulos (primer módulo) ---------- */
const ejes = a => ({ F: { x: Math.sin(a), z: -Math.cos(a) }, D: { x: Math.cos(a), z: Math.sin(a) } });
export const MANIPULOS = {
  nombre: 'manipulos',
  crea(S, azar) {
    const { F, D } = ejes(S.giro);
    const v = S.riv = { x: S.xF + F.x * 52, z: S.zF + F.z * 52, ang: S.giro, ang0: S.giro, fase: 'marcha', tPila: -9, tSalva: -9, salva: false, tChoque: -9, tFlanco: 1e9, tCalma: -9, flActivo: false, calma: false };
    S.ene = [];
    for (let i = 0; i < N_R; i++) {
      const c = i % COLS_R, r = Math.floor(i / COLS_R), l = (c - (COLS_R - 1) / 2) * DX_R + (azar() - 0.5) * 0.25, d = r * DZ_R;
      S.ene.push({ i, c, r, r0: r, x: v.x + D.x * l + F.x * d, z: v.z + D.z * l + F.z * d, yaw: Math.atan2(-F.x, -F.z), vivo: true, muere: 0, est: 'marcha', tipo: 'infante', toca: null,
        jz: (azar() - 0.5) * 0.35, vMas: 0.92 + azar() * 0.16, fase: azar() * 3, pilum: r <= 1, intento: 0, tAtk: -9, tRecibe: -9, sinP: 0, llego: false });
    }
    S.R = crearUnidad({ hombres: N_R, nombre: 'El manípulo', ref: N_R });
  },
  paso(S, dt) {
    const M = S.motor, v = S.riv; if (!v || S.ganador) return;
    const Fp = M.frente(), dA = Math.max(Fp - 0.2, 0.3);
    if (S.fase === 'choque' && v.fase !== 'choque') { v.fase = 'choque'; v.tChoque = S.T; v.tFlanco = S.T + 14; v.ang0 = v.ang; }
    if (v.fase !== 'choque') {
      const dx = S.xF - v.x, dz = S.zF - v.z, dd = Math.hypot(dx, dz) || 1;
      v.ang = Math.atan2(-dx / dd, dz / dd);
      const gap = M.local(v.x, v.z).delante; let vel = 0;
      if (v.fase === 'marcha') { if (S.T > 1.5) vel = V_ROM; if (gap < D_PILA) { v.fase = 'pila'; v.tPila = S.T; M.avisa('grito', { texto: '¡Pila! ¡Cuidado!' }); } }
      else if (v.fase === 'pila') {
        if (!v.salva && S.T - v.tPila > 1.1) {
          v.salva = true; v.tSalva = S.T; const bl = S.fal.filter(h => h.vivo && !h.huye);
          for (const h of S.ene) if (h.vivo && h.pilum && bl.length) { h.pilum = false; h.tAtk = S.T; M.proyectil(h, bl[Math.floor(M.azar() * bl.length)], 1.35 * (0.9 + M.azar() * 0.2)); }
          M.avisa('salva', {});
        }
        if (v.salva && S.T - v.tSalva > 1.9) { v.fase = 'carga'; M.avisa('carga', {}); }
      } else if (v.fase === 'carga') vel = V_CARGA;
      const d = Math.max(0, Math.min(vel * dt, gap - dA)); v.x += dx / dd * d; v.z += dz / dd * d;
    } else {
      const Fl = S.flanco;
      if (Fl && Fl.tR != null) v.tCalma = Fl.tR + 4;
      v.calma = !!(Fl && Fl.estado === 'viene') || S.T < v.tCalma;
      v.ang = v.calma ? S.giro : hacia(v.ang, v.ang0, V_GIRO * dt);
      const { F } = ejes(v.ang); v.x = S.xF + F.x * dA; v.z = S.zF + F.z * dA;
      if (v.flActivo && !Fl) { v.flActivo = false; v.tFlanco = S.T + 20 + M.azar() * 10; }
      if (!Fl && !v.flActivo && S.T >= v.tFlanco) {
        const lado = M.azar() < 0.5 ? 1 : -1, n = 8 + Math.floor(M.azar() * 3);
        const L = S.ene.filter(h => h.vivo && h.est === 'marcha' && h.r >= 2).map(h => ({ h, l: M.local(h.x, h.z) })).sort((a, b) => lado * (b.l.lado - a.l.lado)).slice(0, n);
        if (L.length < 4) v.tFlanco = S.T + 5;
        else {
          const Cl = M.local(M.centro().x, M.centro().z), a = ANG_FLANCO, rl = lado * Math.sin(a), rd = Math.cos(a);
          L.forEach((o, k) => {
            const off = (k - (L.length - 1) / 2) * 1.0, h = o.h;
            h.w1 = M.mundo(Math.max(2, o.l.delante), lado * (FILES * DX / 2 + 8));
            h.w2 = M.mundo(Cl.delante + R_FLANCO * rd + off * lado * Math.sin(a), Cl.lado + R_FLANCO * rl - off * Math.cos(a) * lado * lado);
            h.est = 'rodea'; h.paso1 = false;
          });
          v.flActivo = true; M.flanco(lado, L.map(o => o.h), AVISO_FLANCO);
        }
      }
    }
    const { F, D } = ejes(v.ang), yawM = Math.atan2(-F.x, -F.z), cnt = new Array(COLS_R).fill(0), C = M.centro();
    for (const h of S.ene) {
      if (!h.vivo || h.est === 'huye' || h.est === 'dentro') continue;
      if (h.est === 'marcha' || h.est === 'muro') {
        h.r = cnt[h.c]++;
        if (v.fase === 'choque' && h.r === 0 && h.est === 'marcha') h.est = 'muro';
        if (h.r > 0 && h.est === 'muro') h.est = 'marcha';
        const l = (h.c - (COLS_R - 1) / 2) * DX_R; let d, vel;
        if (v.fase === 'choque') {
          const pul = 0.5 + 0.5 * Math.sin(S.T * (1.5 + h.vMas) + h.fase * 2.1);
          d = h.r === 0 ? dA - 0.4 * pul * pul : dA + 0.4 + h.r * 1.2 + 0.3 * Math.sin(S.T * (0.8 + 0.5 * h.vMas) + h.fase * 2.3); vel = h.r === 0 ? 2.5 : 2.2;
        } else { d = h.r * DZ_R + h.jz; vel = (v.fase === 'carga' ? V_CARGA : V_ROM * 1.3) * h.vMas; }
        M.mueve(h, v.x + D.x * l + F.x * d, v.z + D.z * l + F.z * d, vel, dt); h.yaw = yawM;
        if (h.est === 'muro') {
          if (!v.calma && h.toca !== 'puntas') { h.sinP += dt; if (h.sinP >= 3) h.est = 'asalta'; } else h.sinP = 0;
          if (S.T >= h.intento) { h.intento = S.T + 1.6 + M.azar() * 0.9; if (M.azar() < 0.01 * (S.coh / 100) * (S.orden === 'empujar' ? 1.5 : 1)) M.caeRival(h); else h.tAtk = S.T; }
        }
      } else if (h.est === 'asalta') {
        M.mueve(h, C.x, C.z, 2.5, dt); h.yaw = Math.atan2(C.x - h.x, C.z - h.z);
        if (h.toca && h.toca !== 'puntas') M.entra(h, h.toca);
      } else if (h.est === 'rodea') {
        const Fl = S.flanco, tI = Fl ? Fl.tI : S.T, w = h.paso1 ? h.w2 : h.w1, rest = h.paso1 ? dist(h, h.w2) : dist(h, h.w1) + dist(h.w1, h.w2);
        const vel = lim(rest / Math.max(0.3, tI - S.T), 1.2, 5.5); h.yaw = Math.atan2(w.x - h.x, w.z - h.z); M.mueve(h, w.x, w.z, vel, dt);
        if (!h.paso1 && dist(h, h.w1) < 1) h.paso1 = true;
        if ((h.paso1 && dist(h, h.w2) < 0.8) || S.T >= tI) h.est = 'carga';
      } else if (h.est === 'carga') {
        M.mueve(h, C.x, C.z, V_CARGA * h.vMas, dt); h.yaw = Math.atan2(C.x - h.x, C.z - h.z);
        if (h.toca && h.toca !== 'puntas' && S.flanco && S.flanco.estado === 'dentro') M.entra(h, h.toca);
      } else if (h.est === 'vuelve') {
        const l = (h.c - (COLS_R - 1) / 2) * DX_R, d = dA + 10, tx = v.x + D.x * l + F.x * (d - dA), tz = v.z + D.z * l + F.z * (d - dA);
        M.mueve(h, tx, tz, 3, dt); h.yaw = Math.atan2(tx - h.x, tz - h.z);
        if (Math.hypot(tx - h.x, tz - h.z) < 1.5) { h.est = 'marcha'; h.toca = null; }
      }
    }
  },
  choque(S, h) {
    const M = S.motor, Fl = S.flanco, t = h.toca, v = S.riv;
    if (h.est === 'rodea' || h.est === 'carga') {
      if (t === 'puntas') {
        if (Fl && Fl.estado === 'viene') {
          for (const g of Fl.hombres) if (g.vivo && (g.est === 'rodea' || g.est === 'carga') && !M.ensarta(g, P_FLANCO, true)) g.est = 'vuelve';
          M.resuelveFlanco('parado');
        } else if (!M.ensarta(h, P_FLANCO, true)) h.est = 'vuelve';
      } else { if (Fl && Fl.estado === 'viene') M.resuelveFlanco('dentro'); M.entra(h, t); }
      return;
    }
    if (h.est === 'vuelve') return;
    if (t === 'puntas') {
      if (h.est === 'asalta') { if (!M.ensarta(h)) { h.est = 'muro'; h.sinP = 0; } return; }
      if (!h.llego) { h.llego = true; if (v && (v.fase !== 'choque' || S.T - v.tChoque < 3)) M.ensarta(h, S.orden === 'aguantar' ? 0.08 : P_ENSARTA); }
      return;
    }
    if (t === 'frente' && M.bajadas() === 0) M.entra(h, 'frente');
    else if (h.est === 'asalta') M.entra(h, t);
  },
};

/* ---------- El motor ---------- */
export function crearFalange(m = {}) {
  const rival = m.rival || MANIPULOS, avisaExt = m.avisa || (() => {});
  const N = Math.max(24, Math.min(192, Math.round(m.hombres || 96))), FILAS = Math.max(2, Math.round(N / FILES)), MF = FILES * FILAS;
  const LOC = m.locomocion || null, ZAN = m.zancadas || { walk: 1.5, run: 2.2 }, semilla = m.semilla ?? 1;
  const S = {}; let azar, azarB, caja = null, kPulso = 0, tLoco = -9, kBot = -99;
  const avisa = (tipo, datos = {}) => avisaExt(tipo, datos);
  const medio = FILES * DX / 2;
  /* ---- geometría ---- */
  const ejesM = () => ejes(S.giro);
  function local(x, z) {
    const dx = x - S.xF, dz = z - S.zF, s = Math.sin(S.giro), c = Math.cos(S.giro), delante = dx * s - dz * c, lado = dx * c + dz * s;
    return { delante, lado, ang: Math.atan2(lado, delante) };
  }
  function mundo(delante, lado) { const { F, D } = ejesM(); return { x: S.xF + F.x * delante + D.x * lado, z: S.zF + F.z * delante + D.z * lado }; }
  const puesto = (f, r) => mundo(-r * DZ, (f - (FILES - 1) / 2) * DX);
  const bajadas = () => S.filas.reduce((a, b) => a + (b ? 1 : 0), 0);
  function frente() { for (let r = 0; r < BAJAN; r++) if (S.filas[r]) return ALCANCE - r * DZ; return 0; }
  function centro() { return caja ? mundo((caja.d0 + caja.d1) / 2, (caja.l0 + caja.l1) / 2) : { x: S.xF, z: S.zF }; }
  const cohesion = x => { S.coh = lim(S.coh + x, 0, 100); };
  function mueve(h, tx, tz, vmax, dt) {
    const dx = tx - h.x, dz = tz - h.z, d0 = Math.hypot(dx, dz);
    let d;
    if (LOC) {
      if (!h.paso) h.paso = LOC.crearPaso({ zW: ZAN.walk, zR: ZAN.run, fase: azarB(), prisa: 0.85 + azarB() * 0.3 });
      d = Math.min(d0, LOC.velocidad(h.paso, Math.min(vmax, d0 * 2.2), dt, S.T) * dt);
    } else d = Math.min(d0, Math.min(vmax, d0 * 3) * dt);
    if (d0 > 1e-4) { h.x += dx / d0 * d; h.z += dz / d0 * d; }
    if (LOC && h.paso) LOC.pisa(h.paso, d, dt);
  }
  function muevePivote(d) {
    const { F } = ejesM(); S.xF += F.x * d; S.zF += F.z * d;
    for (const h of S.ene) if (h.vivo && h.est === 'dentro' && h.por !== 'frente') { h.x += F.x * d; h.z += F.z * d; }
  }
  function ensarta(h, p = P_ENSARTA, total = false) {
    const b = bajadas(); if (!h.vivo || (!total && !b)) return false;
    const pr = total ? p : 1 - Math.pow(1 - p, b);
    if (azar() < pr) { caeRival(h); return true; }
    return false;
  }
  function caeRival(h) { if (!h.vivo) return; h.vivo = false; h.muere = S.T; h.toca = null; S.R.baja(1); S.U.causa(1); avisa('cae', { h, quien: 'r' }); }
  function caeFalangita(h, causa) {
    if (!h.vivo) return; h.vivo = false; h.muere = S.T; S.U.baja(1); if (S.R) S.R.causa(1);
    avisa('cae', { h, quien: 'f', causa }); if (h.i === S.yo.i) cambiaYo();
  }
  function cambiaYo() {
    const yo = S.fal[S.yo.i], L = S.fal.filter(h => h.vivo && !h.huye); if (!L.length) return;
    const otro = L.filter(h => h.f === yo.f).sort((a, b) => a.r0 - b.r0)[0] || L.sort((a, b) => Math.abs(a.f - yo.f) + a.r * 0.1 - Math.abs(b.f - yo.f) - b.r * 0.1)[0];
    S.yo.i = otro.i; S.yo.blanco = null; avisa('grito', { texto: 'Has caído. Sigues como otro falangita' });
  }
  function entra(h, por) {
    if (!h.vivo || h.est === 'dentro') return;
    h.est = 'dentro'; h.por = por; h.tDentro = S.T; h.tMata = S.T + 1.0; h.lado0 = local(h.x, h.z).lado;
    if (por === 'frente' && bajadas() === 0 && !S.entraronFrente) { S.entraronFrente = true; cohesion(-50); }
    if (por !== 'frente' && !S.hayFl) S.tMataFl = S.T + MATA_FLANCO;
    avisa('dentro', { h, por });
  }
  function flanco(lado, hombres, aviso = AVISO_FLANCO) {
    S.flanco = { lado, hombres, t0: S.T, tI: S.T + aviso, estado: 'viene', tR: null };
    avisa('flanco', { lado, hombres });
  }
  function resuelveFlanco(estado) {
    const Fl = S.flanco; if (!Fl || Fl.estado !== 'viene') return;
    Fl.estado = estado; Fl.tR = S.T; avisa(estado === 'parado' ? 'flancoParado' : 'flancoEntra', { lado: Fl.lado });
  }
  function proyectil(desde, b, vuelo = 1.35) {
    const G = 9.8, Hd = H(desde.x, desde.z), p0 = [desde.x, Hd + 2, desde.z], p1 = [b.x + (azar() - 0.5) * 1.2, H(b.x, b.z) + 1.1, b.z + (azar() - 0.5) * 1.4];
    const P = { est: 1, p0, p: p0.slice(), t0: S.T + azar() * 0.35, dur: vuelo, b, h: null, dir: [0, 0, 1] };
    P.v = [(p1[0] - p0[0]) / vuelo, (p1[1] - p0[1] + 0.5 * G * vuelo * vuelo) / vuelo, (p1[2] - p0[2]) / vuelo];
    S.proyectiles.push(P); return P;
  }
  const H = m.H || (() => 0);
  const motor = { azar: () => azar(), avisa, local, mundo, puesto, frente, bajadas, centro, mueve, ensarta, entra, caeRival, caeFalangita, cohesion, flanco, resuelveFlanco, proyectil };

  function reinicia() {
    azar = azarSemilla(semilla); azarB = azarSemilla((semilla * 2654435761) ^ 0x5bd1e995); caja = null; kPulso = 0; tLoco = -9; kBot = -99;
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, { T: 0, fase: 'marcha', ganador: null, causa: null, rival: rival.nombre, xF: 0, zF: -10, giro: 0, girando: 0, filas: [false, false, false, false, false],
      flanco: null, pulso: 0, orden: null, coh: 100, ganado: 0, yo: { i: FILES / 2 - 1, tEstocada: -9, blanco: null, muertes: 0 }, fal: [], ene: [], U: null, R: null,
      terreno: null, enRoto: 0, proyectiles: [], motor,
      choque: false, tChoque: -9, tOrden: -9, toques: { buenos: 0, malos: 0 }, riv: null, kUsado: -99, seguidos: 0, pend: 0, tMataFl: 0, hayFl: false, entraronFrente: false, tRompe: -9 });
    for (let i = 0; i < MF; i++) {
      const f = i % FILES, r = Math.floor(i / FILES), p = puesto(f, r);
      S.fal.push({ i, f, r, r0: r, x: p.x, z: p.z, yaw: Math.PI, vivo: true, huye: false, muere: 0, kB: 0, objB: 0, tB: 0, tG: -9, az: azarB() });
    }
    if ('terreno' in m) S.terreno = m.terreno ? { ...m.terreno } : null;
    else { const d = 6 + azar() * 8, l = (azar() - 0.5) * 6, r = 4 + azar() * 2, w = mundo(d, l); S.terreno = { x: w.x, z: w.z, r }; }
    S.U = crearUnidad({ hombres: MF, nombre: 'Tu sintagma', ref: Math.min(MF, 84) });
    rival.crea(S, azar);
    if (!S.R) S.R = crearUnidad({ hombres: Math.max(1, S.ene.length), nombre: rival.nombre });
    for (const h of S.ene) { h.toca ??= null; h.est ??= 'marcha'; h.tipo ??= 'infante'; h.vivo ??= true; h.muere ??= 0; h.yaw ??= 0; }
  }

  /* ---------- un paso ---------- */
  function paso(dt) {
    if (!S.U) return;
    S.T += dt; const T = S.T, U = S.U, R = S.R, enChoque = S.choque && !S.ganador;
    S.pulso = (T % PULSO) / PULSO;
    const kN = Math.floor(T / PULSO), latido = kN !== kPulso; if (latido) { kPulso = kN; avisa('pulso', { n: kN }); }
    /* el giro */
    if (S.girando && !S.ganador) {
      S.giro = lim(S.giro + S.girando * V_GIRO * dt, -GIRO_MAX, GIRO_MAX);
      if (Math.abs(S.giro) >= GIRO_MAX - 1e-9) S.girando = 0;
      cohesion(-1 * dt);
    }
    /* la caja del cuerpo (los vivos) y las filas entre los vivos */
    const cnt = new Array(FILES).fill(0); let l0 = 1e9, l1 = -1e9, rM = 0, vivos = 0;
    for (const h of S.fal) if (h.vivo && !h.huye) { h.r = cnt[h.f]++; const lx = (h.f - (FILES - 1) / 2) * DX; l0 = Math.min(l0, lx); l1 = Math.max(l1, lx); rM = Math.max(rM, h.r); vivos++; }
    caja = vivos ? { l0, l1, d0: -rM * DZ, d1: 0 } : null;
    /* dentro: quién hay */
    let nFl = 0, nFr = 0, cx = 0, cz = 0;
    for (const h of S.ene) if (h.vivo && h.est === 'dentro') { if (h.por === 'frente') nFr++; else { nFl++; cx += h.x; cz += h.z; } }
    S.hayFl = nFl > 0;
    /* las órdenes */
    if (!S.ganador) {
      const o = S.orden, rehace = nFl === 0;
      if (o === 'aguantar') { if (rehace) cohesion(10 * dt); U.cansa(dt, -0.02); }
      else if (o === 'cerrar') { if (rehace) cohesion(5 * dt); }
      else if (o === 'empujar') { U.cansa(dt, 0.01); if (S.coh < 60) { S.orden = null; avisa('grito', { texto: 'El muro se afloja: dejad de empujar' }); } }
      else if (o === 'retroceder') { muevePivote(-V_RETRO * dt); cohesion(-dt); if (S.choque) S.ganado -= V_RETRO * dt; }
      if (S.choque) cohesion(-dt); else if (!o && !S.girando) cohesion(3 * dt);
      U.cansa(dt, 0.004 * bajadas());
    }
    /* el muro avanza o cede lo que le queda pendiente */
    if (S.pend && !S.ganador) { const d = Math.sign(S.pend) * Math.min(Math.abs(S.pend), V_PIVOTE * dt); S.pend -= d; muevePivote(d); }
    /* tus hombres */
    const { F } = ejesM();
    for (const h of S.fal) {
      if (!h.vivo) { if (LOC && h.paso) { h.paso.v = 0; LOC.pisa(h.paso, 0, dt); } continue; }
      if (h.huye) { h.yaw = S.giro; mueve(h, h.x - F.x * 30, h.z - F.z * 30, V_HUYE, dt); continue; }
      const obj = h.r < BAJAN && S.filas[h.r] ? 1 : 0;
      if (obj !== h.objB) { h.objB = obj; h.tB = T + h.r * 0.14 + h.az * 0.03; }
      if (T >= h.tB) h.kB = hacia(h.kB, obj, dt / 0.95);
      h.yaw = Math.PI - S.giro; const p = puesto(h.f, h.r); mueve(h, p.x, p.z, 2, dt);
    }
    /* el rival */
    rival.paso(S, dt);
    /* el contacto */
    const Fp = frente();
    for (const h of S.ene) {
      if (!h.vivo || h.est === 'huye' || h.est === 'dentro') continue;
      let t = null; const l = local(h.x, h.z);
      if (Fp > 0 && l.delante >= 0 && l.delante <= Fp && Math.abs(l.lado) <= medio + 0.4) t = 'puntas';
      else if (caja && l.delante <= caja.d1 + 0.6 && l.delante >= caja.d0 - 0.6 && l.lado >= caja.l0 - 0.6 && l.lado <= caja.l1 + 0.6) {
        const c = [[caja.d1 + 0.6 - l.delante, 'frente'], [l.delante - caja.d0 + 0.6, 'espalda'], [caja.l1 + 0.6 - l.lado, 'der'], [l.lado - caja.l0 + 0.6, 'izq']];
        t = c.reduce((a, b) => b[0] < a[0] ? b : a)[1];
      }
      if (t !== h.toca) {
        h.toca = t;
        if (t && !S.ganador) {
          if (!S.choque) { S.choque = true; S.tChoque = T; S.fase = 'choque'; S.pend = 0; avisa('choque', {}); }
          rival.choque(S, h);
        }
      }
    }
    /* los de dentro */
    if (!S.ganador) {
      for (const h of S.ene) {
        if (!h.vivo || h.est !== 'dentro') continue;
        if (h.por === 'frente') {
          const p = mundo(-0.4, h.lado0); mueve(h, p.x, p.z, 1.8, dt); h.yaw = Math.PI - S.giro + Math.PI;
          if (S.orden === 'cerrar' && T - Math.max(S.tOrden, h.tDentro) >= 1.1) { caeRival(h); avisa('grito', { texto: '¡Cerrad! La segunda fila remata' }); continue; }
          if (T >= h.tMata) {
            h.tMata = T + MATA_FRENTE; h.tAtk = T; let v = null, dm = 1e9;
            for (const f of S.fal) if (f.vivo && !f.huye && f.r <= 1) { const d = dist(f, h); if (d < dm) { dm = d; v = f; } }
            if (v) { caeFalangita(v, 'colado'); cohesion(-6); U.anima(-0.02); }
          }
        } else {
          const l = local(h.x, h.z);
          if (Fp > 0 && l.delante >= 0 && l.delante <= Fp && Math.abs(l.lado) <= medio + 0.4) { if (azar() < 0.5) caeRival(h); else { h.est = 'vuelve'; h.toca = 'puntas'; } }
        }
      }
      if (nFl && T >= S.tMataFl) {
        S.tMataFl = T + MATA_FLANCO; cx /= nFl; cz /= nFl; let v = null, dm = 1e9;
        for (const f of S.fal) if (f.vivo && !f.huye) { const d = Math.hypot(f.x - cx, f.z - cz); if (d < dm) { dm = d; v = f; } }
        if (v) { caeFalangita(v, 'flanco'); cohesion(-8); U.anima(-0.01); }
      }
      if ((nFl || nFr) && S.coh <= 0) U.anima(-0.15 * dt);
      if (S.choque && S.coh < 25) U.anima(-0.03 * dt);
      /* el muro que cede pierde el ánimo (licencia de juego): cuanto más terreno perdido, más deprisa */
      if (S.choque && S.ganado < 0) U.anima(0.01 * S.ganado * dt);
    }
    /* el flanco: se acaba unos segundos después de resolverse */
    const Fl = S.flanco;
    if (Fl) {
      if (Fl.estado === 'viene' && (T > Fl.tI + 10 || !Fl.hombres.some(h => h.vivo && (h.est === 'rodea' || h.est === 'carga')))) resuelveFlanco('parado');
      else if (Fl.estado !== 'viene' && T >= Fl.tR + 5) S.flanco = null;
    }
    /* proyectiles */
    for (const P of S.proyectiles) {
      if (P.est !== 1) continue; const t = T - P.t0; if (t < 0) continue;
      P.p = [P.p0[0] + P.v[0] * t, P.p0[1] + P.v[1] * t - 4.9 * t * t, P.p0[2] + P.v[2] * t]; P.dir = [P.v[0], P.v[1] - 9.8 * t, P.v[2]];
      if (t < P.dur) continue;
      const b = P.b, alz = BAJAN - bajadas(), dado = azar(), pPara = P_PARA_PILA * alz / BAJAN;
      if (dado < pPara) { P.est = 2; P.h = S.fal.find(h => h.vivo && h.f === b.f && h.r >= BAJAN) || b; avisa('clava', { p: P.p }); }
      else if (b.vivo && b.r <= 1 && dado < pPara + 0.45) { P.est = 3; P.h = b; avisa('escudo', { p: P.p }); }
      else if (b.vivo && dado < pPara + 0.61) { P.est = 4; P.h = b; caeFalangita(b, 'pila'); }
      else { P.est = 5; P.p[1] = H(P.p[0], P.p[2]) + 0.6; avisa('tierra', { p: P.p }); }
    }
    /* el terreno roto */
    const Tr = S.terreno; let er = 0;
    if (Tr) { let n = 0, dn = 0; for (const h of S.fal) if (h.vivo && !h.huye && h.r === 0) { n++; if (Math.hypot(h.x - Tr.x, h.z - Tr.z) < Tr.r) dn++; } er = n ? dn / n : 0; }
    if ((er > 0) !== (S.enRoto > 0)) avisa('roto', { dentro: er > 0 });
    S.enRoto = er; if (er > 0 && !S.ganador) cohesion(-6 * er * dt);
    /* huecos: dos a destiempo los abre toque(); aquí, la tirada de cada latido */
    if (latido && enChoque && !nFr) {
      const p = (S.coh < 40 ? 0.3 : 0.01) * (1 + 0.4 * (BAJAN - bajadas())) * (1 + 2 * S.enRoto);
      if (azar() < p) abreHueco();
    }
    S.yo.blanco = marcado();
    /* las unidades, la ruptura y el fin */
    if (S.choque) { U.tic(dt); R.tic(dt); if (S.orden !== 'aguantar') R.cansa(dt, 0.008); }
    if (!S.ganador && S.ganado >= META && !R.roto) { R.roto = true; R.animo = 0; S.causa = 'empuje'; }
    if (!S.ganador && S.ganado <= -META && !U.roto) { U.roto = true; U.animo = 0; S.causa = 'empuje'; }
    if (!S.ganador && (U.roto || R.roto)) {
      S.ganador = U.roto ? 'rival' : 'falange'; S.tRompe = T; S.orden = null; S.girando = 0;
      if (!S.causa) {
        const u = U.roto ? U : R;
        S.causa = U.roto && nFl ? 'flanco' : U.roto && nFr ? 'hueco' : u.enPie < u.hombres / 3 ? 'bajas' : 'animo';
      }
      if (U.roto) for (const h of S.fal) { if (h.vivo) h.huye = true; } else for (const h of S.ene) { if (h.vivo) h.est = 'huye'; }
      avisa('rompe', { ganador: S.ganador, causa: S.causa });
    }
    if (S.ganador) for (const h of S.ene) if (h.vivo && h.est === 'huye') { const l = local(h.x, h.z), a = mundo(l.delante + 30, l.lado * 1.5); mueve(h, a.x, a.z, V_HUYE, dt); h.yaw = Math.atan2(a.x - h.x, a.z - h.z); }
    if (S.ganador && S.fase !== 'fin' && T - S.tRompe > 4) { S.fase = 'fin'; avisa('fin', {}); }
  }
  /* se abre un hueco: el romano de primera fila más cercano a ti se cuela */
  function abreHueco() {
    const yo = S.fal[S.yo.i]; if (!yo) return; let c = null, dm = 1e9;
    for (const h of S.ene) if (h.vivo && (h.toca === 'puntas' || h.est === 'muro') && h.est !== 'dentro' && h.est !== 'rodea' && h.est !== 'carga' && h.est !== 'vuelve') { const d = dist(h, yo); if (d < dm) { dm = d; c = h; } }
    if (c) { entra(c, 'frente'); avisa('grito', { texto: 'Hueco: se cuela uno' }); }
  }
  /* ---------- lo que hace el jugador ---------- */
  const alCompas = () => { const k = Math.round(S.T / PULSO); return { k, en: Math.abs(S.T - k * PULSO) <= VENTANA + 1e-9 }; };
  function toque() {
    if (S.fase === 'fin' || S.ganador) return null;
    if (S.orden === 'aguantar' || S.orden === 'cerrar' || S.orden === 'retroceder') return 'nada';
    if (S.girando) return 'gira';
    const { k, en } = alCompas();
    if (en && k !== S.kUsado) {
      S.kUsado = k; S.toques.buenos++; S.seguidos = 0; cohesion(2);
      for (const h of S.fal) if (h.vivo && h.r === 0) h.tG = S.T + azarB() * 0.04;
      if (!S.choque) { S.pend += PASO_MARCHA; avisa('ha', { metros: PASO_MARCHA }); return 'bueno'; }
      const em = S.orden === 'empujar', d = em ? PASO_EMPUJE : PASO_HA;
      if (em) { cohesion(-5); S.U.cansa(1, 0.02); }
      S.pend += d; S.ganado += d; S.R.anima(-0.002);
      for (const h of S.ene) if (h.vivo && h.toca === 'puntas' && h.est === 'muro') { h.tRecibe = S.T; if (azar() < 0.02) caeRival(h); }
      avisa('ha', { metros: d }); return 'bueno';
    }
    S.toques.malos++; S.seguidos++; cohesion(-8);
    for (const h of S.fal) if (h.vivo && h.r === 0) h.tG = S.T + azarB() * 0.55;
    if (S.choque) { S.pend -= CEDE; S.ganado -= CEDE; S.U.anima(-0.01); if (S.seguidos >= 2) { S.seguidos = 0; abreHueco(); } }
    avisa('destiempo', {}); return 'destiempo';
  }
  function marcado() {
    const yo = S.fal[S.yo.i]; if (!yo || !yo.vivo || S.ganador) return null;
    const ly = local(yo.x, yo.z); let mejor = null, dm = 1e9, col = null, dc = 1.6;
    for (const h of S.ene) {
      if (!h.vivo || h.est === 'huye') continue;
      if (h.est === 'dentro') { const d = dist(h, yo); if (d < dc) { dc = d; col = h; } continue; }
      const l = local(h.x, h.z), dl = Math.abs(l.lado - ly.lado), dd = l.delante - ly.delante;
      if (dl < 1.5 && dd > 0 && dd <= ALCANCE + 0.5) { const s = dd + dl * 2; if (s < dm) { dm = s; mejor = h; } }
    }
    return col || mejor;
  }
  function estocada() {
    const yo = S.fal[S.yo.i]; if (S.fase === 'fin' || S.ganador || !yo || !yo.vivo) return null;
    if (S.T - S.yo.tEstocada < ENFRIA) return 'espera';
    S.yo.tEstocada = S.T; yo.tG = S.T; const b = marcado();
    if (!b) { avisa('estocada', { h: null, acierta: false }); return 'aire'; }
    const p = b.est === 'dentro' ? P_COLADO : alCompas().en ? P_COMPAS : P_FUERA, ac = azar() < p;
    if (ac) { caeRival(b); cohesion(3); S.yo.muertes++; }
    b.tRecibe = S.T; avisa('estocada', { h: b, acierta: ac }); return ac ? 'acierta' : 'falla';
  }
  function gira(dir) { const d = Math.sign(dir || 0); if (d !== S.girando) { S.girando = d; avisa('gira', { dir: d }); } }
  function fila(i, abajo) { if (i < 0 || i >= BAJAN) return; S.filas[i] = abajo === undefined ? !S.filas[i] : !!abajo; avisa('fila', { i, abajo: S.filas[i] }); }
  const TEXTO = { aguantar: '¡Aguantad! ¡Firmes!', empujar: '¡Empujad! ¡Todos a una!', cerrar: '¡Cerrad filas!', retroceder: '¡Atrás, paso a paso!' };
  function orden(n) {
    if (S.fase === 'fin' || S.ganador) return null;
    const k = n === 'empujad' ? 'empujar' : n; if (!TEXTO[k]) return null;
    if (S.orden === k) { S.orden = null; avisa('grito', { texto: '¡A la lucha!' }); return 'suelta'; }
    if (k === 'empujar' && S.coh < 60) { avisa('grito', { texto: 'El muro no está firme' }); return 'flojo'; }
    S.orden = k; S.tOrden = S.T; avisa('grito', { texto: TEXTO[k] }); return k;
  }
  /* ---------- bots de las pruebas ---------- */
  function bot(modo = 'compas') {
    if (S.ganador || S.fase === 'fin') return;
    const T = S.T;
    let cerca = 1e9; for (const h of S.ene) if (h.vivo && h.est !== 'huye') { const l = local(h.x, h.z); if (Math.abs(l.lado) < 12 && l.delante > -1) cerca = Math.min(cerca, l.delante); }
    const vuela = S.proyectiles.some(p => p.est === 1), bajar = S.choque || (cerca < 11 && !vuela);
    for (let i = 0; i < BAJAN; i++) if (S.filas[i] !== bajar) fila(i, bajar);
    if (modo === 'loco') { if (T - tLoco >= 0.3) { tLoco = T; toque(); estocada(); orden('empujad'); gira(Math.floor(azarB() * 3) - 1); } return; }
    if (modo !== 'nogira') {
      const Fl = S.flanco, obj = Fl && Fl.estado === 'viene' ? Fl.lado * GIRO_BOT : 0, dif = obj - S.giro;
      gira(Math.abs(dif) < 0.006 ? 0 : Math.sign(dif));
    }
    const colado = S.ene.some(h => h.vivo && h.est === 'dentro' && h.por === 'frente');
    if (colado) { if (S.orden !== 'cerrar') orden('cerrar'); }
    else if (S.orden === 'cerrar') orden('cerrar');
    else if (S.orden === 'aguantar') { if (S.coh >= 90) orden('aguantar'); }
    else if (S.choque && S.coh < 50) orden('aguantar');
    else if (S.choque && S.orden !== 'empujar' && S.coh >= 90) orden('empujad');
    if (S.yo.blanco && S.yo.blanco.est === 'dentro') estocada();
    const fase = ((T % PULSO) + PULSO) % PULSO, objT = modo === 'destiempo' ? PULSO / 2 : 0, d = Math.min(Math.abs(fase - objT), PULSO - Math.abs(fase - objT)), k = Math.round((T - objT) / PULSO);
    if (d < 0.05 && k !== kBot) { kBot = k; toque(); if (S.yo.blanco) estocada(); }
  }
  function resumen() {
    return { ganador: S.ganador, causa: S.causa, T: +S.T.toFixed(3), ganado: +S.ganado.toFixed(3), coh: +S.coh.toFixed(2), enPieU: S.U.enPie, enPieR: S.R.enPie,
      tuyas: S.yo.muertes, toquesBuenos: S.toques.buenos, toquesMalos: S.toques.malos };
  }
  reinicia();
  return { S, reinicia, paso, toque, estocada, gira, fila, orden, marcado, frente, bot, resumen };
}
