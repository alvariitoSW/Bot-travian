/* AQVILA · AM4 — el mapa de la pestaña MAPA.
   En la campaña de Roma (y en las partidas que no son de polis) es el mapa de siempre (map3d.js), sin un solo cambio:
   esta caja le pasa todo lo que el juego le pide.
   En una partida de polis es el mapa vivo de Grecia (mapa-grecia*.js): las 8 polis, la tuya marcada, sus comarcas y recursos,
   y encima lo de la partida: tocar tu polis abre su hoja del juego, se entra en ella como en Roma, y se pintan las marchas y rutas.
   Lo del mapa romano que no cabe en el 800 a.C. (ciudades de Italia, calzadas, colonias, el Faro, el minimapa de Italia) no sale.
   Las ciudades rivales de la partida de polis siguen siendo, en la lógica, las de Italia: no se pintan; sus marchas llegan
   «de poniente» (por el mar Jonio). Si un día son polis griegas con el mismo id que en mapa-grecia-datos.js, salen en su sitio.
   Uso (pase a js/ui.js): new MapaPartida(caja, opciones) en lugar de new MapView3D(caja, opciones). */
import { MapView3D } from './map3d.js';
import { POLIS, X, Z } from './mapa-grecia-datos.js';

const PONIENTE = { lon: 20.15, lat: 37.95 };   // donde aparecen las marchas que vienen de fuera del mapa (mar Jonio, frente a Zacinto)
const CERCA = 0.42, ABRE = 12;                  // anchos en decenas de km (en un móvil de 390 px): de cerca de la polis, y al abrir la pestaña
const CSS = `
.mpg{position:absolute;inset:0;z-index:3;background:#1b2530}
.mpg .mg-polis.mia{background:#fbe7a8;border:2px solid #7a2b20;box-shadow:0 0 0 2px #e3b341,0 2px 6px #000a;font-size:14.5px}
.mpg .mg-polis.mia small{font:bold 10px Georgia,serif;letter-spacing:.4px;color:#fbeed0;background:#7a2b20;border-radius:3px;padding:1px 4px;margin-left:2px}
.mpg .mg-polis.sel{outline:3px solid #fff;outline-offset:1px}
.mpg-trazos{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.mpg-trazos path{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-dasharray:7 6;filter:drop-shadow(0 1px 1px #000a)}
.mpg-ej{position:absolute;left:0;top:0;display:flex;align-items:center;gap:4px;padding:2px 7px 2px 3px;border-radius:12px;background:#1c1610e6;color:#f6ecd0;font:bold 12px Georgia,serif;white-space:nowrap;pointer-events:none;box-shadow:0 1px 4px #000a;will-change:transform}
.mpg-ej b{width:18px;height:18px;border-radius:50%;background:var(--c);border:1.5px solid #f6ecd0;display:grid;place-items:center;font-size:11px}
.mpg-ej.foe{background:#5a1610e6}
.mpg-error{position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;color:#f1e3c0;background:#1c1610;font:15px Georgia,serif}
`;

export class MapaPartida {
  constructor(host, opts) {
    this.host = host; this.opts = opts || {};
    this.roma = new MapView3D(host, this.opts);   // si no hay WebGL lanza, igual que antes (ui.js ya lo recoge)
    this.gr = null;                               // el mapa de Grecia, mientras la partida sea de polis
    /* todo lo que esta caja no sabe (UI.map.c, .clamp, .cities… en la campaña) va al mapa que esté a la vista */
    return new Proxy(this, {
      get: (t, k) => { if (k in t) return t[k]; const a = t.gr ? t.gr : t.roma, v = a[k]; return typeof v === 'function' ? v.bind(a) : v; },
      set: (t, k, v) => { if (k in t) t[k] = v; else (t.gr || t.roma)[k] = v; return true; }
    });
  }
  /* ¿la partida abierta es de polis? (G y D son globales en el navegador) */
  get polis() { const G = globalThis.Game; try { return G && G.polis ? G.polis() : null; } catch (e) { return null; } }

  update(state, sel) {
    const p = this.polis;
    if (!p) { if (this.gr) this._quitarGrecia(); return this.roma.update(state, sel); }
    if (!this.gr || this.gr.polisId !== p) { this._quitarGrecia(); if (this.roma.miniOn) this.roma.minimapa(false); this.gr = new Grecia(this.host, this.opts, p); }
    this.gr.update(state, sel);
  }
  _quitarGrecia() { if (this.gr) { this.gr.destruir(); this.gr = null; } }

  /* lo que ui.js pide al mapa */
  get cities() { return this.gr ? {} : this.roma.cities; }
  get esc() { return this.gr ? this.gr.esc : this.roma.esc; }
  get miniOn() { return this.gr ? false : this.roma.miniOn; }
  minimapa(on) { return this.gr ? false : this.roma.minimapa(on); }     // el minimapa es el de Italia: en Grecia no se abre
  center(id) { return this.gr ? this.gr.center(id) : this.roma.center(id); }
  encuadre() { return this.gr ? this.gr.encuadre() : this.roma.encuadre(); }
  entrarCiudad(id) { return this.gr ? this.gr.entrarCiudad(id) : this.roma.entrarCiudad(id); }
  restaurar() { return this.gr ? this.gr.restaurar() : this.roma.restaurar(); }
  zoom(f) { return this.gr ? this.gr.zoom(f) : this.roma.zoom(f); }
  resize() { this.roma.resize(); if (this.gr) this.gr.resize(); }
}

/* ---------- el mapa vivo de Grecia dentro de la partida ---------- */
class Grecia {
  constructor(host, opts, polisId) {
    this.host = host; this.opts = opts; this.polisId = polisId; this.p = POLIS.find(q => q.id === polisId);
    this.esc = { entrando: false }; this.state = null; this.sel = null; this.ultUpdate = performance.now(); this.vuelta = null;
    if (!document.getElementById('mpg-css')) { const s = document.createElement('style'); s.id = 'mpg-css'; s.textContent = CSS; document.head.appendChild(s); }
    this.caja = document.createElement('div'); this.caja.className = 'mpg'; host.appendChild(this.caja);
    this.margen = [56, 8, 150, 8]; this.marcas = new Map(); this.rutas = new Map(); this.pend = [];
    const vista = this.p ? { lon: this.p.lon, lat: this.p.lat, a: this._abre() } : 'corazon';
    import('./mapa-grecia-pantalla.js').then(m => m.montarMapaGrecia(this.caja, {
      enPartida: true, vista, margen: this.margen, huecosExtra: r0 => this._huecosJuego(r0),
      alTocarPolis: q => this._tocarPolis(q), alToque: () => { if (this.opts.onSelect) this.opts.onSelect(null); }, alCuadro: m => this._cuadro(m)
    })).then(P => {
      if (this.muerto) { P.cerrar(); return; }
      this.P = P; this.mapa = P.mapa; this._medir(); this._marcarMia();
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.svg.setAttribute('class', 'mpg-trazos'); this.mapa.host.insertBefore(this.svg, this.mapa.rot);
      for (const f of this.pend.splice(0)) f();
    }).catch(err => { console.error('No se pudo abrir el mapa de Grecia', err); if (!this.muerto) this.caja.innerHTML = '<div class="mpg-error">No se pudo desplegar el mapa de Grecia en este dispositivo. Puedes jugar desde las pestañas Ciudad y Tropas.</div>'; });
  }
  destruir() { this.muerto = true; if (this.P) this.P.cerrar(); this.caja.remove(); }
  /* en vertical, un poco más cerca que el mapa de Partida nueva (decisión del usuario); en horizontal cabe más */
  _abre() { const w = this.host.clientWidth || 390, h = this.host.clientHeight || 844; return h > w ? ABRE : ABRE * 1.5; }
  _luego(f) { if (this.mapa) f(); else this.pend.push(f); }

  /* sitio libre entre la barra de arriba, «Marchas», los botones de zoom del juego, «Pasar estación» y las pestañas */
  _medir() {
    const r0 = this.host.getBoundingClientRect(), vis = id => { const e = document.getElementById(id); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? r : null; };
    let arriba = 8, abajo = 8, izq = 8; for (const id of ['top', 'bmarchas']) { const r = vis(id); if (r && r.top < r0.top + r0.height / 2) arriba = Math.max(arriba, r.bottom - r0.top + 6); }
    for (const id of ['turno', 'tabs3']) { const r = vis(id); if (!r) continue; if (r.height > r0.height * 0.6) izq = Math.max(izq, r.right - r0.left + 6);   // en horizontal, las pestañas van en columna a la izquierda
      else if (r.bottom > r0.top + r0.height / 2) abajo = Math.max(abajo, r0.bottom - r.top + 6); }
    this.margen[0] = arriba; this.margen[2] = abajo + 54; this.margen[3] = izq;   // los rótulos no se meten bajo los botones del mapa (Recursos, regla)
    for (const [k, v] of [['arriba', arriba], ['abajo', abajo], ['izq', izq]]) this.caja.style.setProperty('--mgp-' + k, Math.round(v) + 'px');
    if (this.P) this.P.rehacerHuecos();
  }
  _huecosJuego(r0) { const o = []; for (const id of ['zoom', 'bmarchas', 'top', 'turno']) { const e = document.getElementById(id); if (!e || e.hidden) continue; const r = e.getBoundingClientRect(); if (r.width && r.height) o.push([r.left - r0.left - 4, r.top - r0.top - 4, r.right - r0.left + 4, r.bottom - r0.top + 4]); } return o; }
  resize() { if (this.mapa) this._medir(); }

  /* la tuya, marcada: fondo dorado, borde rojo y «tu polis» */
  _marcarMia() {
    const e = this.mapa.etq.find(q => q.polis && q.polis.id === this.polisId); if (!e) return;
    e.d.classList.add('mia'); if (!e.d.querySelector('small')) e.d.insertAdjacentHTML('beforeend', '<small>tu polis</small>'); e.w = 0; this.etqMia = e;
    e.pri = 0; this.mapa.etq.sort((a, b) => a.pri - b.pri);   // la tuya se rotula antes que ninguna: nunca la tapa una vecina
  }
  /* id de la partida → polis del mapa: la tuya es «roma» por dentro; las demás, si algún día están en la partida con su id */
  _polisDe(id) { if (id === 'roma') return this.p; return POLIS.find(q => q.id === id) || null; }
  _idDe(p) { if (p.id === this.polisId) return 'roma'; return this.state && this.state.cities[p.id] ? p.id : null; }
  _lugar(id) { const p = id && this._polisDe(id); return p ? [X(p.lon), Z(p.lat)] : null; }
  _tocarPolis(p) {
    const id = this._idDe(p); if (!id) { if (this.opts.onSelect) this.opts.onSelect(null); return false; }   // polis que no está en la partida: su ficha de comarca y recursos
    if (this.opts.onSelect) this.opts.onSelect(id); return true;   // la tuya: la hoja del juego (y otro toque entra, como en Roma)
  }

  update(state, sel) {
    this.state = state; this.ultUpdate = performance.now();
    if (sel !== this.sel) { this.sel = sel; for (const e of (this.mapa ? this.mapa.etq : [])) if (e.polis) e.d.classList.toggle('sel', !!sel && this._idDe(e.polis) === sel); }
    if (this.caja.hidden) this.caja.hidden = false;
    if (this.mapa && !this.mapa._raf && !this.muerto) { this._medir(); this.mapa.pausa(false); }   // vuelve a la pestaña MAPA
  }
  /* cada cuadro del mapa de Grecia: si el juego dejó de pedir el mapa (otra pestaña), se para; si no, marchas y rutas */
  _cuadro(m) {
    if (performance.now() - this.ultUpdate > 700) { m.pausa(true); this.caja.hidden = true; return; }   // otra pestaña: ni se pinta ni se ven sus botones
    const st = this.state; if (!st || !this.svg) return;
    const w = m.host.clientWidth, h = m.host.clientHeight, v = m._v3, ky = m.com.uKy.value;
    const aPx = q => { v.set(q[0], Math.max(0, m.rel.altura(q[0], q[1])) * ky, q[1]).project(m.cam); return v.z > 1 ? null : [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h]; };
    const fuera = [X(PONIENTE.lon), Z(PONIENTE.lat)], D = globalThis.DATA, G = globalThis.Game; let d = '';
    const trazos = [], vistas = new Set(), r0 = m.host.getBoundingClientRect(), ocupado = [];
    for (const e of m.etq) if (e.polis && e.visto) { const r = e.d.getBoundingClientRect(); ocupado.push([r.left - r0.left, r.top - r0.top, r.right - r0.left, r.bottom - r0.top]); }   // las píldoras de las marchas no tapan los nombres de las polis
    const libre = (x, y, an, al) => { for (let i = 0; i < 14; i++) { const yy = y + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (al + 3), c = [x, yy, x + an, yy + al]; if (yy > this.margen[0] && yy + al < h - this.margen[2] && !ocupado.some(o => c[0] < o[2] && c[2] > o[0] && c[1] < o[3] && c[3] > o[1])) { ocupado.push(c); return yy; } } ocupado.push([x, y, x + an, y + al]); return y; };
    for (const r of (st.rutas || [])) {   // rutas de comercio: línea dorada
      const a = this._lugar(r.a) || fuera, b = this._lugar(r.b) || fuera; if (a === fuera && b === fuera) continue;
      const pa = aPx(a), pb = aPx(b); if (pa && pb) trazos.push(['#e3b341', pa, pb]);
    }
    for (const mc of (st.marches || [])) {
      if (mc.colonos) continue;   // las colonias de Italia no son de esta partida
      const a = this._lugar(mc.from) || fuera, b = this._lugar(mc.to) || fuera; if (a === fuera && b === fuera) continue;
      const f = Math.max(0, Math.min(1, (st.t - mc.t0) / Math.max(1e-6, mc.t1 - mc.t0))), q = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      const mio = mc.owner === 'roma', col = (D && D.FACTIONS[mc.owner] && D.FACTIONS[mc.owner].col) || '#888';
      const pa = aPx(a), pb = aPx(b), pq = aPx(q); if (pa && pb) trazos.push([mio ? '#f6ecd0' : '#d24a3a', pa, pb]);
      vistas.add(mc.id); let el = this.marcas.get(mc.id);
      if (!el) { el = document.createElement('div'); el.className = 'mpg-ej ' + (mio ? 'mine' : 'foe'); el.style.setProperty('--c', col); this.mapa.rot.appendChild(el); this.marcas.set(mc.id, el); }
      const hombres = G && G.men ? G.men(mc.units || {}) : 0, n = hombres ? hombres.toLocaleString('es-ES') : '', txt = mio ? (b === fuera ? n + ' → poniente' : n) : (a === fuera ? 'De poniente · ' : b === fuera ? 'Hacia poniente · ' : '') + n;
      if (el.dataset.t !== txt) { el.dataset.t = txt; el.innerHTML = '<b>⚔</b>' + txt; el._w = 0; }
      if (!pq || pq[0] < -40 || pq[0] > w + 40 || pq[1] < -40 || pq[1] > h + 40) el.style.display = 'none';
      else { el.style.display = ''; if (!el._w) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
        const x = Math.max(this.margen[3], Math.min(w - el._w - 8, pq[0] - el._w / 2)), y = libre(x, Math.max(this.margen[0], Math.min(h - this.margen[2] - el._h, pq[1] - el._h - 6)), el._w, el._h);   // dentro de la pantalla y sin pisar nada
        el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }
    }
    for (const [id, el] of this.marcas) if (!vistas.has(id)) { el.remove(); this.marcas.delete(id); }
    for (const [c, a, b] of trazos) d += '<path stroke="' + c + '" d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '"/>';
    if (d !== this.svgD) { this.svgD = d; this.svg.innerHTML = d; }
  }

  /* lo que pide ui.js, en el mapa de Grecia */
  center(id) { const l = this._lugar(id) || this._lugar('roma'); if (l) this._luego(() => this.mapa.irA(l[0], l[1], Math.min(this.mapa.V.upx, ABRE / 390), 700)); }
  encuadre() { this._luego(() => { if (this.p) this.mapa.irA(X(this.p.lon), Z(this.p.lat), this._abre() / 390, 0); }); }
  zoom(f) { this._luego(() => { const V = this.mapa.V; this.mapa.irA(V.x, V.z, V.upx / f, 300); }); }
  /* como en Roma: la cámara baja hasta la polis y se abre la ciudad; al volver, el mapa queda como estaba */
  entrarCiudad(id) {
    const l = this._lugar(id); if (!l || !this.mapa || this.esc.entrando || !this.opts.onEntrar) return;
    const V = this.mapa.V; this.vuelta = { x: V.x, z: V.z, upx: V.upx }; this.esc.entrando = true;
    this.mapa.irA(l[0], l[1], CERCA / 390, 1100);
    setTimeout(() => { if (this.muerto || !this.esc.entrando) return; this.esc.entrando = false; this.opts.onEntrar(id); }, 1150);
  }
  restaurar() { this.esc.entrando = false; const v = this.vuelta; this.vuelta = null; if (v && this.mapa) this.mapa.irA(v.x, v.z, v.upx, 0); }
}
