/* CE2: lo que hace en el mercado el bot de las pruebas (test/sim.test.js y test/economia.js).
   Fuera de las vetas no hay hierro: el bot lo compra con denarios para su próxima leva. Y vende lo que el tope del almacén va a tirar
   (recursos y bienes), como haría un jugador atento. Guarda una reserva de denarios para la paga. */
module.exports = function botMercado(G, D) {
  const s = G.state; if (!s || s.over) return;
  const rate = G.tradeRate();
  // 1) vender lo que sobra (lo que se perdería al cerrar el mes) y los bienes que no son de lujo cuando pasan de la mitad del tope
  if (rate) for (const r of ['grano', 'materiales', 'hierro']) if (G.previsionCierre()[r].perdera >= 1) G.venderSobrante(r);
  const b = G.bienes();
  for (const k in b) { if (G.bienesPerdera()[k] >= 1) G.venderSobrante(k); const guarda = D.LUJO.indexOf(k) >= 0 ? D.BIEN_TOPE / 2 : 0; if (b[k] > guarda + 5) G.venderBien(k, b[k] - guarda); }
  // 2) comprar hierro para la leva siguiente: 150 de la tropa que más hierro pide entre las que puede reclutar
  if (!rate) return;
  let quiere = 0; for (const id of G.myCities()) { const c = s.cities[id]; for (const k of ['triarii', 'principes', 'equites', 'hastati']) if (G.unitOk(c, k)) { quiere = Math.max(quiere, (D.UNITS[k].cost.hierro || 0) * 150); break; } }
  // ES20: el bot pasa por el mercado una vez por estación (antes, varias al mes): compra en varias operaciones, hasta 6
  for (let k = 0; k < 6; k++) {
    const falta = quiere - G.disponible('hierro'); if (falta <= 0) return;
    const reserva = 150 + 3 * Math.max(0, -G.prod().denarios), gastable = G.disponible('denarios') - reserva; if (gastable < 20) return;
    if (!G.trade('denarios', 'hierro', Math.min(gastable, Math.ceil(falta / (rate * D.HIERRO_COMPRA))))) return;
  }
};
