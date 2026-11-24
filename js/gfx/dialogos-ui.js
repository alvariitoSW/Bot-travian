/* AQVILA — SON9: la pantalla de la arenga y de las preguntas de los oficiales, para las dos batallas (js/ui-guerra.js y js/ui-mando.js).
   La lógica (qué se pregunta, qué hace cada respuesta) está en js/dialogos.js; aquí solo se dibuja y se oye.
   DialogosUI.crea({ padre, abajo, abajoH, pueblo }) → { quiere(cfg), arenga(alAcabar(id|null)), pregunta(p, { alElegir(k), alTiempo() }), habla(dicho), cerrar(), get abierto }
     · padre: el HUD de la batalla (#gu-hud o #mn-hud). abajo / abajoH: separación del subtítulo al borde de abajo, en vertical y en horizontal.
       pueblo (SON10): 'cartago' | 'galos' | 'iberos' si tu bando habla en español como ellos; sin él, los romanos (latín).
     · arenga(): un panel abajo, sobre el campo ya montado (no lo tapa entero), con las 3 arengas y «Sin arenga». Al elegir: el general la dice en voz alta
       (latín, con subtítulo en castellano) y la tropa responde con un clamor; después llama a alAcabar(id).
     · pregunta(p): panel con el oficial, su frase en latín (voz y subtítulo) y 2–4 botones grandes. Cuenta atrás de p.tope segundos: si pasa, alTiempo().
   Todo el sonido sale por Sonido.maestro (Sonido.voz, Sonido.muestra) y agacha la música. Estilo: el de css/guerra.css y css/mando.css (oro, bronce, vidrio). */
(function (raiz) {
  'use strict';
  const D = raiz.Dialogos;
  const CSS = `
.dlg-velo{position:absolute;inset:0;z-index:7;background:linear-gradient(to top,rgba(10,8,6,.55),rgba(10,8,6,0) 60%);pointer-events:auto;touch-action:none}
.dlg{position:absolute;z-index:8;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 8px);width:min(640px,calc(100% - 16px));box-sizing:border-box;padding:10px 12px 12px;border-radius:16px;background:rgba(18,15,11,.94);border:1.5px solid rgba(184,134,43,.7);box-shadow:0 8px 28px rgba(0,0,0,.6);color:#f1ead9;font:14px/1.25 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;pointer-events:auto;touch-action:manipulation}
.dlg h2{margin:0 0 2px;font:700 17px Cinzel,Georgia,serif;letter-spacing:.05em;color:#e9c063}
.dlg p{margin:0 0 8px;color:#cdbf9d;font-size:13px}
.dlg .dlg-op{display:grid;gap:7px}
.dlg button{font:inherit;color:inherit;border:0;margin:0;cursor:pointer;pointer-events:auto;touch-action:manipulation;text-align:left;min-height:48px;padding:7px 12px;border-radius:12px;background:linear-gradient(#8a2a20,#5c1b15);border:1.5px solid #e9c063;display:flex;flex-direction:column;justify-content:center;gap:1px}
.dlg button b{font:700 14.5px/1.2 Cinzel,Georgia,serif;letter-spacing:.02em}
.dlg button i{font-style:normal;font-size:12.5px;color:#f0d9a0}
.dlg button.sin{background:linear-gradient(#3a2c14,#241b0d);border-color:#b8862b;min-height:48px;align-items:center;text-align:center}
.dlg button.sin b{font-size:14px}
.dlg button:active{filter:brightness(1.25)}
.dlg .dlg-q{display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline;margin-bottom:6px}
.dlg .dlg-q b{font:700 12.5px Cinzel,Georgia,serif;letter-spacing:.03em;color:#e9c063}
.dlg .dlg-q em{font-style:normal;font-size:12px;color:#cdbf9d}
.dlg .dlg-lat{font-weight:700;color:#fff;font-size:15px}
.dlg .dlg-es{color:#cdbf9d;font-size:13px}
.dlg .dlg-cuenta{height:5px;margin:7px 0 8px;border-radius:3px;background:rgba(255,255,255,.12);overflow:clip}
.dlg .dlg-cuenta i{display:block;height:100%;width:100%;background:#e9c063;transform-origin:left}
.dlg-sub{position:absolute;z-index:8;left:50%;transform:translateX(-50%);width:max-content;max-width:min(78%,calc(100% - 24px));padding:8px 14px;border-radius:14px;background:rgba(14,12,9,.88);border:1.5px solid #e9c063;font:600 15px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f1ead9;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s}
.dlg-sub.ve{opacity:1}
.dlg-sub b{display:block;font:700 12px Cinzel,Georgia,serif;letter-spacing:.04em;color:#e9c063}
.dlg-sub i{display:block;font-style:normal;font-weight:700;color:#fff}
.dlg-sub span{display:block;color:#cdbf9d;font-weight:500;font-size:13.5px}
@media (orientation:landscape){
.dlg{width:min(780px,calc(100% - 16px));padding:8px 12px 10px}
.dlg.arenga .dlg-op{grid-template-columns:repeat(3,1fr)}
.dlg.arenga{padding-top:8px}
.dlg.arenga .sin{position:absolute;top:8px;right:12px;min-height:44px;padding:0 16px}
.dlg.arenga p{margin-right:150px}
.dlg.pregunta .dlg-op{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.dlg p{margin-bottom:6px}
}`;

  const C = {};
  C.quiere = function (cfg) {   // ¿se muestra la arenga? No en pruebas automáticas (navigator.webdriver), salvo ?arenga=1; ?sinarenga lo apaga siempre
    if (cfg && cfg.sinArenga) return false;
    const q = raiz.location && raiz.location.search || '';
    if (/[?&]sinarenga\b/.test(q)) return false;
    if (/[?&]arenga=1\b/.test(q)) return true;
    return !(raiz.navigator && raiz.navigator.webdriver);
  };

  C.crea = function (opc) {
    opc = opc || {}; const doc = raiz.document; if (!doc || !opc.padre || !D) return null;
    if (!doc.getElementById('dlg-css')) { const st = doc.createElement('style'); st.id = 'dlg-css'; st.textContent = CSS; doc.head.appendChild(st); }
    const padre = opc.padre, So = () => raiz.Sonido, PU = opc.pueblo || null;
    const sub = doc.createElement('div'); sub.className = 'dlg-sub'; sub.setAttribute('aria-live', 'polite'); sub.style.bottom = opc.abajo || '120px'; sub.innerHTML = '<b></b><i></i><span></span>'; padre.appendChild(sub);
    const mq = raiz.matchMedia ? raiz.matchMedia('(orientation:landscape)') : null, ajusta = () => { sub.style.bottom = (mq && mq.matches ? opc.abajoH || opc.abajo : opc.abajo) || '120px'; };
    ajusta(); if (mq && mq.addEventListener) mq.addEventListener('change', ajusta);
    let velo = null, panel = null, tCuenta = 0, tSub = 0, tFin = 0, cerrado = false;

    function quita() { clearInterval(tCuenta); if (velo) velo.remove(); if (panel) panel.remove(); velo = panel = null; }
    function rotulo(nombre, lat, es, seg) { sub.children[0].textContent = nombre + ':'; sub.children[1].textContent = lat; sub.children[2].textContent = es ? '— ' + es : ''; sub.classList.add('ve'); clearTimeout(tSub); tSub = setTimeout(() => sub.classList.remove('ve'), (seg || 3.4) * 1000); }
    /* dice una frase (de D.DICHOS o D.TIEMPO): subtítulo y voz. Devuelve cuántos segundos dura, para esperarla. */
    function habla(f, o) {
      o = o || {}; const nombre = o.nombre || D.nombreDe(f.quien, PU) || '', S = So(), b = S && S.vbuf && S.vbuf[f.id];
      const dur = b && b.duration ? b.duration + 0.4 : 3.2;
      if (!o.sinRotulo) rotulo(nombre, f.lat, f.es, Math.max(3.2, dur + 0.8));
      if (S && S.voz && b) { if (raiz.Musica && raiz.Musica.agacha) raiz.Musica.agacha(); S.voz(f.id, { v: f.quien === 'tropa' ? 0.85 : 0.95, retraso: o.retraso === undefined ? 0.1 : o.retraso, espera: o.espera === undefined ? 2.5 : o.espera }); }
      return dur;
    }
    function clamor() {   // la tropa responde: la voz que aclama y el griterío del banco
      const S = So(), V = raiz.Voces, f = D.clamorDe(PU);
      if (S && S.muestra && V) { const g = V.grupoDisponible('aclamacion', S.tiene); if (g) S.muestra(g, { v: 0.8, vel: 1, retraso: 0.05 }); }
      return habla(f, { nombre: D.nombreDe('tropa', PU), retraso: 0.15, espera: 0.5 });
    }
    function html(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
    function monta(clase, cuerpo) {
      quita(); velo = doc.createElement('div'); velo.className = 'dlg-velo'; panel = doc.createElement('div'); panel.className = 'dlg ' + clase; panel.setAttribute('role', 'dialog'); panel.innerHTML = cuerpo;
      padre.appendChild(velo); padre.appendChild(panel); return panel;
    }

    return {
      get abierto() { return !!panel; },
      habla, clamor,
      arenga(alAcabar) {
        const p = monta('arenga', '<h2>Arenga a tus tropas</h2><p>Elige lo que les dirás. Cada discurso cambia un poco la batalla.</p><div class="dlg-op">'
          + D.arengas(PU).map(a => '<button type="button" data-a="' + a.id + '"><b>' + html(a.nombre) + '</b><i>' + html(a.efecto) + '</i></button>').join('') + '</div><button type="button" class="sin" data-a=""><b>Sin arenga</b></button>');
        p.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b || cerrado) return; const id = b.dataset.a || null;
          if (!id) { quita(); alAcabar(null); return; }
          p.remove(); panel = null;   // el velo se queda mientras habla el general: la batalla espera
          const a = D.arenga(id, PU), d1 = habla({ id: a.voz || 'dl-arenga-' + id, quien: 'general', lat: a.lat, es: a.es });
          setTimeout(() => { if (cerrado) return; const d2 = clamor(); setTimeout(() => { if (!cerrado) { quita(); alAcabar(id); } }, Math.min(2500, d2 * 1000)); }, d1 * 1000);
        });
        const S = So(); if (S && S.cargaVoces) { try { S.cargaVoces(D.dichosDe(PU).map(f => f.id)); } catch (e) { /* sin voz: solo subtítulo */ } }
        return p;
      },
      pregunta(q, cb) {
        const ops = q.opciones.map((o, k) => '<button type="button" data-k="' + k + '"><b>' + html(o.txt) + '</b><i>' + html(o.sub) + '</i></button>').join('');
        const p = monta('pregunta', '<div class="dlg-q"><b>' + html(q.nombre) + '</b><em>' + html(q.donde) + '</em></div><div class="dlg-lat">' + html(q.lat) + '</div><div class="dlg-es">' + html(q.es) + '</div><div class="dlg-cuenta"><i></i></div><div class="dlg-op">' + ops + '</div>');
        const barra = p.querySelector('.dlg-cuenta i'); let resta = q.tope, ult = performance.now(), fin = false;
        const acaba = () => { fin = true; quita(); };
        p.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || fin || cerrado) return; acaba(); cb.alElegir(+b.dataset.k); });
        clearInterval(tCuenta); tCuenta = setInterval(() => {
          const ahora = performance.now(), dt = Math.min(2, (ahora - ult) / 1000); ult = ahora; if (doc.hidden || cerrado) return;   // tiempo real (un móvil lento pinta a pocos fotogramas); al volver de segundo plano no salta más de 2 s
          resta -= dt; barra.style.transform = 'scaleX(' + Math.max(0, resta / q.tope) + ')';
          if (resta <= 0 && !fin) { acaba(); cb.alTiempo(); }
        }, 100);
        habla({ id: q.audio, quien: q.ofi, lat: q.lat, es: q.es }, { nombre: q.nombre, espera: 0.5, sinRotulo: true });   // el panel ya lleva el texto
        return p;
      },
      cerrar() { cerrado = true; quita(); clearTimeout(tSub); clearTimeout(tFin); sub.remove(); if (mq && mq.removeEventListener) mq.removeEventListener('change', ajusta); },
    };
  };

  raiz.DialogosUI = C;
})(typeof window !== 'undefined' ? window : globalThis);
