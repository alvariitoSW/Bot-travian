/* AQVILA — MR3b: pantalla de carga. La portada está ya en index.html (se ve desde el primer instante, sin pantalla vacía);
   aquí se le pone un dato del Códice (con su fuente y su dictamen) y se mueve la barra por fases.
   Script clásico: va después de codice.js. ui.js llama a Carga.fase(), Carga.progreso(), Carga.menuListo() y Carga.velo().
   Solo toca la pantalla de carga (#carga); no sabe nada del juego. */
(function () {
  const $ = id => document.getElementById(id), C = {};
  let pct = 0, todo = false, menu = false, tFin = 0, tOculta = 0, alListo = [];
  C.t0 = performance.now();
  // dato del Códice: un hecho con texto corto, al azar. Si el Códice no está, la caja no se enseña.
  C.dato = function () {
    const caja = $('cg-dato'); if (!caja) return;
    let l = []; try { l = (window.CODICE && window.CODICE.hechos || []).filter(h => h.x && h.x.length <= 240); } catch (e) { l = []; }
    if (!l.length) { caja.hidden = true; return; }
    const h = l[Math.floor(Math.random() * l.length)];
    $('cg-dt').textContent = h.t + ' · ' + h.id + ' a.C.';
    $('cg-dx').textContent = h.x;
    $('cg-df').textContent = 'Fuente: ' + h.src + ' · Dictamen: ' + h.tag + '.';
    caja.hidden = false;
  };
  C.fase = function (txt, p) {
    if (p != null && p > pct) pct = Math.min(100, p);
    const b = $('cg-barra'), t = $('cg-fase'), n = $('cg-pct');
    if (b) b.style.width = pct + '%'; if (t && txt) t.textContent = txt; if (n) n.textContent = Math.round(pct) + ' %';
  };
  // soldados y edificios: de 55 a 100 %
  C.progreso = function (hechos, total) { C.fase('Soldados y edificios: ' + Math.min(hechos, total) + ' de ' + total, 55 + 40 * (total ? Math.min(1, hechos / total) : 0)); };   // el 100 % solo lo da todoListo
  C.listo = () => todo;
  const quita = () => {
    const c = $('carga'); if (!c || c.hidden) return;
    c.classList.add('fuera'); clearTimeout(tOculta); tOculta = setTimeout(() => { c.hidden = true; c.classList.remove('fuera', 'velo'); }, 450);
  };
  // la portada se va cuando están el menú y los modelos, o como mucho 2,5 s después del menú (los modelos siguen en segundo plano)
  C.menuListo = function () { menu = true; C.fase('Menú listo', 55); if (todo) quita(); else { clearTimeout(tFin); tFin = setTimeout(quita, 2500); } };
  C.todoListo = function () {
    todo = true; C.fase('Todo listo', 100); const f = alListo; alListo = [];
    if (menu || f.length) setTimeout(quita, 250); f.forEach(fn => { try { fn(); } catch (e) { } });
    C.ms = Math.round(performance.now() - C.t0);
  };
  // velo: al entrar en la partida antes de que lleguen soldados y edificios. Tapa como mucho 15 s.
  C.velo = function (txt) {
    if (todo) return; const c = $('carga'); if (!c) return;
    clearTimeout(tFin); clearTimeout(tOculta); c.hidden = false; c.classList.add('velo'); c.classList.remove('fuera'); C.dato(); C.fase(txt || 'Preparando las legiones');
    tFin = setTimeout(quita, 15000); alListo.push(() => { });
  };
  window.Carga = C;
  C.dato(); C.fase('Leyendo las crónicas', 15);
})();
