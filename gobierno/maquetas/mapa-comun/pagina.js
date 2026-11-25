/* AQVILA · AM1 — monta la página de una maqueta (título, botones, leyenda) y arranca el motor con su estilo */
import { crear } from './motor.js';
import { BASICOS } from './datos.js';
import { ICONOS } from './iconos.js';
export function pagina(est) {
  const rec = (k, o, lujo) => '<span class="rec' + (lujo ? ' lujo' : '') + '"><i style="--c:' + o.color + '">' + ICONOS[k] + '</i>' + o.n + '</span>';
  document.body.classList.add(est.clase);
  document.body.insertAdjacentHTML('beforeend', '<canvas id="lienzo"></canvas><div id="etiquetas"></div>' +
    '<div id="titulo"><b>' + est.titulo + '</b><span>' + est.lema + '</span></div>' +
    '<div id="leyenda"><span class="fila">' + Object.keys(BASICOS).map(k => rec(k, BASICOS[k])).join('') + '</span><span class="fila"><span class="rec lujo"><i style="--c:#cfd6dd">' + ICONOS.plata + '</i>Aro dorado: lujo, solo en esa ciudad</span></span><em>Lo que no tienes: por comercio o conquista.</em></div>' +
    '<div id="ficha" hidden></div>' +
    '<div id="botones"><button id="b-recursos" aria-pressed="false">Recursos</button><button data-vista="entera">Grecia entera</button><button data-vista="corazon">Las polis</button><button data-vista="atenas">De cerca</button></div>' +
    '<div id="cargando">Pintando Grecia…</div>');
  crear(est).then(() => document.getElementById('b-recursos').setAttribute('aria-pressed', document.body.classList.contains('con-recursos')));
}
