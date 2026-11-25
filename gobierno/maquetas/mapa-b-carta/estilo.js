/* AQVILA · AM1 — maqueta B «Carta antigua viva»: un mapa dibujado a tinta sobre pergamino que se mueve:
   olas de tinta en la costa, sombras de nube, barcos dibujados que navegan y humo en las ciudades. Todo el arte es propio. */
import { pagina } from '../mapa-comun/pagina.js';
import { mix, paso, clamp, ruido, fbm, azar } from '../mapa-comun/motor.js';

function pintar(o, p) {
  const papel = 0.93 + 0.09 * fbm(p.x * 0.006, p.y * 0.006, 3) + (ruido(p.x * 0.9, p.y * 0.25) - 0.5) * 0.04;
  let r, g, b;
  if (p.h <= 0 || p.lago) {   // mar: aguada verde azulada, más oscura junto a la costa, con líneas de costa
    const d = p.lago ? 1.2 : -p.costa, cerca = 1 - paso(0, 9, d); r = mix(186, 150, cerca); g = mix(200, 180, cerca); b = mix(184, 170, cerca);
    const raya = Math.abs(((d * 0.62) % 1) - 0.5) < 0.09 && d < 5.2 && d > 0.5 ? 0.45 * (1 - d / 5.5) : 0; r = mix(r, 70, raya); g = mix(g, 92, raya); b = mix(b, 100, raya);
  } else {
    const a = paso(60, 900, p.h), m = paso(900, 2100, p.h); r = mix(230, 208, a); g = mix(212, 180, a); b = mix(166, 128, a); r = mix(r, 180, m); g = mix(g, 146, m); b = mix(b, 104, m);
    const t = { grano: [226, 190, 96], madera: [150, 170, 104], piedra: [222, 220, 210], hierro: [176, 132, 110] };
    for (const k in t) { const w = p.zw[k] * 0.55; if (w > 0) { r = mix(r, t[k][0], w); g = mix(g, t[k][1], w); b = mix(b, t[k][2], w); } }
    const sombra = clamp((0.62 - p.luz) * 2.4, 0, 1), trama = (Math.sin((p.x + p.y) * 1.25) > 0.1 ? 1 : 0.35), tinta = Math.min(0.75, sombra * (0.35 + 0.5 * trama)) * paso(0.02, 0.12, p.pend);
    r = mix(r, 88, tinta); g = mix(g, 60, tinta); b = mix(b, 40, tinta);
    const claro = clamp((p.luz - 0.7) * 2, 0, 1) * 0.35; r = mix(r, 250, claro); g = mix(g, 240, claro); b = mix(b, 210, claro);
  }
  const orilla = 1 - paso(0.25, 0.9, Math.abs(p.costa)); r = mix(r, 58, orilla * 0.9); g = mix(g, 40, orilla * 0.9); b = mix(b, 30, orilla * 0.9);
  o[0] = r * papel; o[1] = g * papel; o[2] = b * papel;
}
function dibujar(g, ay) {
  const rnd = azar(3), T = '#4a2f1c'; g.lineCap = g.lineJoin = 'round';
  for (const r of ay.rios) for (const l of r.l) { g.strokeStyle = 'rgba(60,96,110,.9)'; g.lineWidth = 1.5; ay.linea(l); }
  g.setLineDash([5, 4]); for (const c of ay.caminos) { g.strokeStyle = 'rgba(120,40,30,.85)'; g.lineWidth = 1.5; ay.linea(c); } g.setLineDash([]);
  // signos de cada comarca, dibujados a mano: árboles, espigas, sillares y picos
  const signo = { madera(x, y) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 3); g.stroke(); g.beginPath(); g.moveTo(x - 3, y - 2.5); g.lineTo(x, y - 9); g.lineTo(x + 3, y - 2.5); g.closePath(); g.fillStyle = '#5d7a3c'; g.fill(); g.stroke(); },
    grano(x, y) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 7); g.moveTo(x, y - 4); g.lineTo(x - 2.2, y - 6.5); g.moveTo(x, y - 4); g.lineTo(x + 2.2, y - 6.5); g.moveTo(x, y - 2); g.lineTo(x - 2.2, y - 4.5); g.moveTo(x, y - 2); g.lineTo(x + 2.2, y - 4.5); g.stroke(); },
    piedra(x, y) { g.fillStyle = '#efeadb'; g.fillRect(x - 3, y - 4, 6, 4); g.strokeRect(x - 3, y - 4, 6, 4); },
    hierro(x, y) { g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 2, y - 6); g.moveTo(x - 2, y - 6.5); g.quadraticCurveTo(x + 2.5, y - 8.5, x + 5, y - 4.5); g.stroke(); } };
  g.strokeStyle = T; g.lineWidth = 0.9;
  for (const z of ay.zonas) { const n = Math.round(z.r * (z.t === 'madera' ? 2.2 : 1.6)); for (let i = 0; i < n; i++) { const a = rnd() * 6.283, q = Math.sqrt(rnd()) * z.r * 0.95, lon = z.lon + Math.cos(a) * q / 87.7, lat = z.lat + Math.sin(a) * q / 111.3; if (ay.alt(lon, lat) < 8) continue; const c = ay.px(lon, lat); signo[z.t](c[0], c[1]); } }
  // montes «de topera» en las cumbres
  g.strokeStyle = T; g.lineWidth = 1; for (let i = 0; i < 2600; i++) { const lon = 19.4 + rnd() * 8.8, lat = 34.8 + rnd() * 6.1, h = ay.alt(lon, lat); if (h < 1250 || ay.alt(lon, lat + 0.03) > h + 60) continue; const c = ay.px(lon, lat), s = 3 + (h - 1200) / 500;
    g.beginPath(); g.moveTo(c[0] - s, c[1] + s * 0.6); g.lineTo(c[0], c[1] - s * 0.7); g.lineTo(c[0] + s, c[1] + s * 0.6); g.stroke(); g.beginPath(); g.moveTo(c[0], c[1] - s * 0.7); g.lineTo(c[0] + s * 0.25, c[1] + s * 0.5); g.stroke(); }
  // nombres de mares y comarcas, y rosa de los vientos
  const txt = (s, lon, lat, tam, color, giro, esp) => { const c = ay.px(lon, lat); g.save(); g.translate(c[0], c[1]); g.rotate(giro || 0); g.font = 'italic ' + tam + 'px Georgia, serif'; g.fillStyle = color; g.textAlign = 'center'; try { g.letterSpacing = (esp || 0) + 'px'; } catch (e) {} g.fillText(s, 0, 0); g.restore(); };
  txt('MAR EGEO', 25.3, 38.75, 30, 'rgba(50,78,92,.75)', 0.25, 10); txt('MAR JÓNICO', 20.35, 37.3, 26, 'rgba(50,78,92,.75)', 1.2, 8); txt('MAR DE CRETA', 24.6, 35.95, 24, 'rgba(50,78,92,.75)', 0, 8);
  txt('PELOPONESO', 22.05, 37.38, 17, 'rgba(74,47,28,.8)', 0, 4); txt('TESALIA', 22.3, 39.3, 17, 'rgba(74,47,28,.8)', 0, 4); txt('MACEDONIA', 22.3, 40.72, 17, 'rgba(74,47,28,.8)', 0, 4); txt('JONIA', 27.75, 38.35, 17, 'rgba(74,47,28,.8)', 0, 4); txt('CRETA', 24.9, 35.2, 16, 'rgba(74,47,28,.8)', 0, 4); txt('EUBEA', 23.95, 38.72, 12, 'rgba(74,47,28,.8)', 0.6, 2); txt('ÁTICA', 23.95, 37.87, 11, 'rgba(74,47,28,.8)', 0, 1); txt('BEOCIA', 23.05, 38.3, 11, 'rgba(74,47,28,.8)', 0, 1); txt('EPIRO', 20.7, 39.6, 16, 'rgba(74,47,28,.8)', 0, 4); txt('TRACIA', 25.4, 40.85, 16, 'rgba(74,47,28,.8)', 0, 4);
  const c = ay.px(20.5, 35.75); g.save(); g.translate(c[0], c[1]); g.strokeStyle = T; g.fillStyle = T; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 46, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 40, 0, 7); g.stroke();
  for (let i = 0; i < 16; i++) { const L = i % 4 === 0 ? 62 : i % 2 === 0 ? 44 : 26, a = i * Math.PI / 8; g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, -L); g.lineTo(5, 0); g.lineTo(-5, 0); g.closePath(); g.fillStyle = i % 2 ? '#c9b98c' : (i % 4 === 0 ? '#7a2b20' : T); g.fill(); g.stroke(); g.restore(); }
  g.font = 'bold 20px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = T; g.fillText('N', 0, -68); g.restore();
  txt('HELLAS', 20.6, 36.55, 44, 'rgba(74,47,28,.9)', 0, 14); txt('las polis y sus riquezas', 20.6, 36.33, 17, 'rgba(74,47,28,.85)', 0, 1);
}
/* ciudad dibujada: templo con frontón, casas y murallita, a tinta, con el color de la polis en el tejado */
function iconoCiudad(p) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.lineJoin = 'round'; g.strokeStyle = '#3a2416'; g.lineWidth = 3;
  g.fillStyle = 'rgba(58,36,22,.25)'; g.beginPath(); g.ellipse(64, 116, 50, 8, 0, 0, 7); g.fill();
  const casa = (x, y, w, h) => { g.fillStyle = '#f2e6c8'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w / 2, y - h * 0.6); g.lineTo(x + w + 3, y); g.closePath(); g.fillStyle = p.color; g.fill(); g.stroke(); };
  casa(12, 92, 24, 22); casa(92, 94, 24, 20); casa(30, 100, 20, 14);
  g.fillStyle = '#f7efd8'; g.fillRect(34, 60, 60, 50); g.strokeRect(34, 60, 60, 50); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(41 + i * 11.5, 62); g.lineTo(41 + i * 11.5, 108); g.stroke(); }
  g.beginPath(); g.moveTo(28, 60); g.lineTo(64, 34); g.lineTo(100, 60); g.closePath(); g.fillStyle = p.color; g.fill(); g.stroke(); g.fillStyle = '#f7efd8'; g.fillRect(28, 108, 72, 7); g.strokeRect(28, 108, 72, 7);
  return c;
}
function iconoBarco(i) {
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.lineJoin = g.lineCap = 'round'; g.strokeStyle = '#3a2416'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(10, 62); g.quadraticCurveTo(48, 92, 88, 58); g.lineTo(80, 72); g.quadraticCurveTo(48, 86, 20, 74); g.closePath(); g.fillStyle = '#8a5a33'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(48, 72); g.lineTo(48, 14); g.stroke(); g.beginPath(); g.moveTo(24, 22); g.quadraticCurveTo(52, 30, 74, 20); g.lineTo(72, 56); g.quadraticCurveTo(50, 64, 26, 56); g.closePath(); g.fillStyle = i % 2 ? '#f2e6c8' : '#c9553f'; g.fill(); g.stroke();
  return c;
}
pagina({ clase: 'piel-b', titulo: 'B · Carta antigua viva', lema: 'Un mapa de tinta y pergamino que respira: olas, nubes y barcos.',
  relieve: 5, fuerzaSombra: 4.2, luz: [-0.6, 0.55, -0.55], niebla: '#d9c9a0', nubes: 0.16, detalle: 0.07, malla: 320, lienzo: 2160, alzaEtiqueta: 1.75, detalleRelieve: 0.5, inclinaCerca: 0.98, inclinaLejos: 1.2,
  mar: { costa: '#a9c2b4', hondo: '#93b0ac', espuma: '#f4ecd6', fuerzaBrillo: 0.05, fuerzaEspuma: 0.5, alfaCosta: 0.0, ondas: 0.25, rayas: 0.7 }, marVelado: true,
  ciudades: 'dibujo', iconoCiudad, iconoBarco, humo: 'rgba(90,70,54,1)', humoOpacidad: 0.5, estela: 0.35, tamCiudad: 34, pintar, dibujar });
