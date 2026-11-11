1. Cámara baja detrás de la línea romana: se ve la batalla como un general, con moral de ambos bandos arriba, minimapa abajo a la izquierda y todo lo demás fuera del campo.
2. Se toca un regimiento y se abre una rueda de seis órdenes (avanzar, mantener, cargar, flanquear, testudo, retirar) en el rincón del pulgar derecho; la recomendada va en dorado; en el despliegue se arrastra cada regimiento con el dedo.
3. A la vista quedan 2 botones en despliegue (Triplex acies, Empezar batalla), 2 en combate (Pausa, Retirada general) y 2 en el resultado; la rueda aparece solo al tocar.
4. En js/gfx/battle3d.js: cámara baja y selección por toque; en js/ui.js: rueda radial, minimapa, barras de moral y pantalla de resultado; js/battle.js solo necesita exponer las órdenes ya existentes.
5. Unas 3 a 4 sesiones: rueda y selección, minimapa y moral, despliegue por arrastre, resultado con bajas y botín.
