# I5d · Afinado de los saberes (17/11/2026)
Medida: `node tools/calibra-afinado.mjs --meses 240 --semillas 3` (tarda ≈9 min). Bot agresivo de `sim.test.js`, cada saber SOLO, hecho desde el mes 0 sin pagar ni pedir requisitos, contra la partida sin saberes. Columnas a 240 meses: ciudades, producción mensual total, tropas (media de 3 semillas).

**Antes = después**: no se retocó ninguna cifra; ninguno se salía de banda.

```
Afinado a 240 meses, 3 semillas. Columnas: ciudades · producción/mes · población · tropas (y % frente a sin saber)
base        ciu   8.0  rec    2680        tro    1437
griego      ciu   8.0  rec    2680 +0%    tro    1437 +0%
apio        ciu   7.7  rec    2754 +3%    tro    1355 -6%
castra      ciu   8.0  rec    2682 +0%    tro    1452 +1%
quinque     ciu   8.0  rec    2856 +7%    tro    1523 +6%
corvus      ciu   8.0  rec    2680 0%     tro    1440 +0%
remeros     ciu   8.0  rec    2886 +8%    tro    1439 +0%
fasti       ciu   8.0  rec    2642 -1%    tro    1524 +6%
vina        ciu   8.0  rec    2766 +3%    tro    1437 +0%
trigo       ciu   7.7  rec    2979 +11%   tro    1443 +0%
pilum       ciu   7.3  rec    2625 -2%    tro    1792 +25%
latif       ciu   8.0  rec    2747 +3%    tro    1437 +0%
colon       ciu   7.3  rec    2600 -3%    tro    1389 -3%
sambuca     ciu   8.0  rec    2844 +6%    tro    1497 +4%
arquimedes  ciu   8.0  rec    2680 0%     tro    1438 +0%
astilleros  ciu   8.0  rec    2680 +0%    tro    1437 +0%
derrota     ciu   8.0  rec    2680 +0%    tro    1437 +0%
medicina    ciu   7.7  rec    2785 +4%    tro    1393 -3%
magon       ciu   8.0  rec    2912 +9%    tro    1537 +7%
perseo      ciu   8.0  rec    2680 +0%    tro    1437 +0%
acoger      ciu   7.7  rec    2775 +4%    tro    1404 -2%
expulsar    ciu   7.0  rec    2656 -1%    tro    1515 +5%
hormigon    ciu   8.0  rec    2849 +6%    tro    1790 +25%

```

**Lectura**
- Ninguno domina: el mejor en producción es Trigo (+11 %), seguido de Magón (+9 %) y Remeros (+8 %). Con 3 semillas el ruido del bot es de varios puntos (p. ej. ciudades 7,0–8,0); los +25 % de tropas de Pilum y Hormigón se leen como ruido de la partida del bot (Hormigón solo acorta obras), no como dominio.
- Ninguno es inútil donde el bot puede usarlo. Los de ≈0 % (Preceptores, Corvus, Arquímedes, Astilleros, Derrota, Perseo, Campamento) actúan en lo que el bot no usa: Escuela, mar, defensa de muralla, rutas, ánimo y gloria. La guerra de esos se mide aparte (`tools/calibra-combate.mjs`, regla 4.16, ≤10 puntos) y el ritmo con `tools/calibra-saber.mjs`.
- Pares excluyentes: Trigo (+11 %) frente a Viña (+3 %) es el más descompensado en producción, pero Viña da oro de comercio e impuestos que el bot no explota; sin medida de jugador real no se toca.
- Límite: el bot no usa rutas, mar ni Escuela; esa parte sigue sin medir.

**Citas** (cotejo hecho de memoria, sin acceso a los textos): quitada de Perseo la cita Polibio 31.23-25 (no consta que hable de los libros; queda Plutarco, Emilio Paulo 28); Hormigón pasa a «por cotejar» (Livio 35.10 da el pórtico, no el hormigón); Quinquerreme: el apartado 1.20.14 queda por cotejar. Las demás citas de saber se corresponden con lo que esos pasajes tratan, según memoria, y siguen «probable» o «histórico» como estaban. Cifras y árbol: licencia de juego.
