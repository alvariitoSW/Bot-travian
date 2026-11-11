1. La ciudad se gobierna sobre una rueda del año romano (Martius a Februarius) con presagios sobre el aro, y una franja de Calendas, Nonas e Idus donde se planifica.
2. Se desliza la rueda para cambiar de mes y se arrastran cartas (obra, juegos, ley, levas) desde abajo a una fecha; las intrigas se resuelven arrastrando el sello SPQR a una decisión.
3. Casi ninguno: solo las cuatro cartas de la bandeja, que son gestos y no botones; el resto es rueda, franja y medidores sin pulsar.
4. Nueva vista de calendario en js/ui.js (rueda SVG, franja, bandeja y hoja de decisión) alimentada por el sistema de eventos y colas de js/game.js, con un pequeño módulo de arrastre reutilizable.
5. Unas 4 sesiones: rueda y franja (1), arrastre y planificación contra colas (1), presagios e intrigas en game.js (1), crisis y pulido (1).
