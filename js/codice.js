/* AQVILA — Códice: fichas cortas de tropas, ciudades y hechos, con su etiqueta y su fuente.
   NO guarda textos. Una sola fuente (P55): lee js/registro.js (historia.texto, .fuente, .dictamen) y los nombres de js/data.js.
   Muestra solo las fichas que traen texto y ya tienen dictamen (nunca «por cotejar»). Se arma la primera vez que se pide,
   así que no importa el orden de los <script>. */
(function (root) {
  const C = {};
  C.TAGS = ['histórico', 'probable', 'licencia de juego'];
  const TAG = { historico: 'histórico', probable: 'probable', 'licencia de juego': 'licencia de juego' };
  const dep = (g, f) => root[g] || (typeof require !== 'undefined' ? require(f) : null);

  // lista del Códice para un tipo de ficha; nombre(id) da el título que sale de data.js
  function lista(tipo, nombre) {
    const R = dep('REGISTRO', './registro.js'), F = (R && R.fichas[tipo]) || {}, o = [];
    for (const k of Object.keys(F)) {
      const hi = F[k].historia;
      if (!hi || !hi.texto || !TAG[hi.dictamen]) continue;
      const id = tipo === 'hecho' ? k.split('-')[0] : k;
      o.push({ id, t: nombre(id), tag: TAG[hi.dictamen], x: hi.texto, src: hi.fuente });
    }
    return tipo === 'hecho' ? o.sort((a, b) => Number(b.id) - Number(a.id)) : o;   // hechos: del más antiguo al más reciente (años a.C.)
  }
  const memo = {};
  function def(clave, tipo, nombre) {
    Object.defineProperty(C, clave, { enumerable: true, get() { return memo[clave] || (memo[clave] = lista(tipo, nombre)); } });
  }
  const D = () => dep('DATA', './data.js');
  def('tropas', 'tropa', id => D().UNITS[id].n);
  def('ciudades', 'ciudad', id => D().CITIES[id].n);
  def('hechos', 'hecho', id => D().EVENTS.find(e => String(e.y) === id).t);

  root.CODICE = C;
  if (typeof module !== 'undefined') module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
