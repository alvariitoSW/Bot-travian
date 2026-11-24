/* AQVILA — SON7 (24/11/2026): el fragor de la lucha a pie, para las tres escenas («Testudo a pie», la falange y «Manípulo a pie»).
   Antes, el cuerpo a cuerpo era un bucle de «lucha» a volumen fijo y unos pocos golpes sueltos. Ahora este director decide, cada
   fotograma, qué golpes suenan según cuánta lucha hay y cómo va la moral, y cada hombre que cae se oye caer.
   Parte pura (también en Node; la prueba es test/fragor.test.mjs): Fragor.nuevo(semilla) y Fragor.paso(f, dt, e) → lista de sonidos.
     e = { lucha 0..1 (cuánto del frente está pegándose), moral 0..1 (la tuya), caen (hombres tuyos caídos hasta ahora),
           caenR (del rival), marcha 0..1 (lo rápido que andas; 0 parado) }
     Cada sonido: { g grupo del banco, capa 'cerca' | 'lejos', v volumen, pan, retraso, vel }. Además f.tension (0..1) y f.nivelLucha (0..1).
   Reglas (carta sonora): lo que dice algo se oye por encima; nunca más de 12 golpes por segundo; un grito de masa cada pocos segundos como mucho.
   La escena (gobierno/maquetas/a-pie/sonido.js → pulso) es quien lo toca: el banco de js/gfx/sonido.js, por Sonido.maestro. */
(function (raiz) {
  'use strict';
  const F = {};
  const lim = (x, a, b) => Math.max(a, Math.min(b, x));
  function azarSemilla(s) { let a = (s >>> 0) || 1; return () => { a ^= a << 13; a >>>= 0; a ^= a >>> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; }; }

  /* golpes del cuerpo a cuerpo y cuánto pesa cada uno (escudo contra escudo, el empujón, el hierro, el gladio, la madera) */
  F.GOLPES = [['escudo', 0.28], ['empuje', 0.17], ['hierro', 0.2], ['tajo', 0.2], ['madera', 0.15]];
  F.MAX_GOLPES = 12;      /* por segundo, como mucho */
  F.MAX_CAIDAS = 3;       /* caídas que se oyen por segundo; las demás esperan su turno (o se pierden si se amontonan) */
  F.CALMA_MASA = 7;       /* segundos entre dos gritos de masa (clamor, pánico, aclamación) */

  F.nuevo = semilla => ({ azar: azarSemilla((semilla || 7) * 2654435761), t: 0, acum: 0, deuda: 0, deudaR: 0, caen: null, caenR: null,
    tCaida: 0, tMasa: -99, tension: 0, nivelLucha: 0, prevTension: 0, golpes: 0, caidas: 0, masas: 0 });

  /* la tensión: cuánta lucha y qué mal va (0 calma, 1 a punto de romperse) */
  F.tensionDe = e => lim(0.15 + 0.5 * lim(e.lucha || 0, 0, 1) + 0.45 * (1 - lim(e.moral === undefined ? 0.8 : e.moral, 0, 1)) * (e.lucha > 0 ? 1 : 0.5), 0, 1);

  function elige(lista, r) { let s = 0; for (const [, p] of lista) s += p; let x = r * s; for (const [g, p] of lista) { x -= p; if (x <= 0) return g; } return lista[lista.length - 1][0]; }

  F.paso = function (f, dt, e) {
    e = e || {}; const az = f.azar, al = (a, b) => a + az() * (b - a), sale = []; dt = lim(dt || 0, 0, 0.25); f.t += dt;
    const lucha = lim(e.lucha || 0, 0, 1), ten = F.tensionDe(e);
    f.tension += (ten - f.tension) * Math.min(1, dt * 1.5);
    f.nivelLucha = lucha > 0 ? lim(0.35 + 0.65 * lucha * (0.55 + 0.45 * f.tension), 0, 1) : 0;

    /* 1. los golpes: más cuanto más frente pega y más tensión; la mitad cerca (tu fila), la mitad lejos (el resto del frente) */
    const ritmo = lucha > 0 ? Math.min(F.MAX_GOLPES, lucha * (3 + 8 * f.tension)) : 0;
    f.acum += ritmo * dt;
    while (f.acum >= 1) {
      f.acum -= 1 + al(-0.35, 0.35); const g = elige(F.GOLPES, az()), cerca = az() < 0.45, r = al(0, Math.min(0.2, dt + 0.05));
      sale.push({ g, capa: cerca ? 'cerca' : 'lejos', v: cerca ? al(0.4, 0.75) : al(0.18, 0.38), pan: cerca ? al(-0.55, 0.55) : al(-1, 1), retraso: r, vel: al(0.88, 1.12) });
      if (cerca && (g === 'empuje' || g === 'tajo') && az() < 0.35) sale.push({ g: 'esfuerzo', capa: 'cerca', v: al(0.3, 0.5), pan: al(-0.5, 0.5), retraso: r + 0.02, vel: al(0.92, 1.08) });
      f.golpes++;
    }

    /* 2. los que caen: cada baja nueva, una caída (y a veces su quejido); se reparten para no amontonarse */
    if (f.caen === null) { f.caen = e.caen || 0; f.caenR = e.caenR || 0; }
    const nuevo = Math.max(0, (e.caen || 0) - f.caen), nuevoR = Math.max(0, (e.caenR || 0) - f.caenR);
    f.caen = Math.max(f.caen, e.caen || 0); f.caenR = Math.max(f.caenR, e.caenR || 0);
    f.deuda = Math.min(4, f.deuda + nuevo); f.deudaR = Math.min(4, f.deudaR + nuevoR);
    f.tCaida -= dt;
    while (f.tCaida <= 0 && (f.deuda >= 1 || f.deudaR >= 1)) {
      const tuyo = f.deuda >= 1 && (f.deudaR < 1 || az() < 0.5); if (tuyo) f.deuda -= 1; else f.deudaR -= 1;
      const pan = tuyo ? al(-0.5, 0.5) : al(-0.9, 0.9), v = tuyo ? al(0.55, 0.8) : al(0.3, 0.5);
      sale.push({ g: 'caida', capa: tuyo ? 'cerca' : 'lejos', v, pan, retraso: 0, vel: al(0.9, 1.08) });
      if (az() < (tuyo ? 0.6 : 0.35)) sale.push({ g: az() < 0.5 ? 'herido' : 'quejido', capa: tuyo ? 'cerca' : 'lejos', v: v * 0.8, pan, retraso: al(0.05, 0.25), vel: al(0.92, 1.06) });
      f.tCaida += 1 / F.MAX_CAIDAS; f.caidas++;
    }
    if (f.tCaida < 0) f.tCaida = 0;

    /* 3. la masa: al subir la tensión, el clamor; si la tuya flaquea, el pánico; si el rival cae a montones, la aclamación */
    if (f.t - f.tMasa >= F.CALMA_MASA && lucha > 0) {
      let g = null;
      if (f.tension > 0.72 && f.prevTension <= 0.72) g = 'clamor';
      else if ((e.moral !== undefined && e.moral < 0.28) && az() < dt * 0.6) g = 'panico';
      else if (nuevoR >= 2 && az() < 0.5) g = 'aclamacion';
      else if (az() < dt * 0.08 * lucha) g = 'clamor';
      if (g) { sale.push({ g, capa: 'lejos', v: g === 'clamor' ? 0.5 : 0.45, pan: al(-0.3, 0.3), retraso: 0, vel: al(0.95, 1.03) }); f.tMasa = f.t; f.masas++; }
    }
    f.prevTension = f.tension;
    return sale;
  };

  raiz.Fragor = F;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof window !== 'undefined' ? window : globalThis);
