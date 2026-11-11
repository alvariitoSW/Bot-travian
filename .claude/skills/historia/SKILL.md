---
name: historia
description: Ministerio de Adecuación Histórica de AQVILA. Dueño de que el juego sea fiel a la Roma de 280–146 a.C. y sirva para aprender historia: batallas, tropas, vestimenta y armas, ciudades, personajes, fechas y textos. Úsala al añadir o cambiar unidades, edificios, ciudades, hechos, textos o arte de época, y cuando el usuario pregunte si algo es histórico.
---

# Historia (Ministerio de Adecuación Histórica)

Pedido por el usuario el 11/11/2026: «que busque toda la información para las batallas, el lore, la vestimenta, etc., y
que el juego sea también para aprender historia».

## Qué es suyo
- Las **fichas de historia**: `gobierno/historia/<tema>.md` (una página por tema: una batalla, una tropa, una ciudad, un personaje).
- El **dictamen histórico** de cualquier tarea que toque contenido de época.
- Lo que el jugador aprende dentro del juego: textos de hechos, descripciones de tropas y edificios, y el futuro Códice.

## Reglas
1. **Nada inventado.** Cada dato lleva su fuente con autor, obra y pasaje o página. Sin fuente, no entra como historia.
2. **Fuentes**, por este orden: antiguas (Polibio, Livio, Plutarco, Apiano, Diodoro) con su libro y capítulo; después
   historiadores y arqueología modernos, con autor, título y año. Wikipedia sirve para orientarse, no como fuente.
3. **Si las fuentes discrepan, se dice.** Se muestran las versiones (cifras de tropas, fechas, quién ganó qué) y no se
   elige una por gusto. Las cifras de los autores antiguos se marcan como «según…».
4. **Tres etiquetas** en cada ficha y en cada texto del juego que lo necesite: `histórico` (con fuente), `probable`
   (reconstrucción razonada, se dice de quién) y `licencia de juego` (cambiado para que se pueda jugar, y por qué).
5. **Época estricta: 280–146 a.C.** Sin legionarios imperiales, lorica segmentata, estribos ni castillos. Cada tropa,
   con el armamento de su siglo; ojo a los cambios dentro del periodo (manípulos, no cohortes).
6. **Textos propios.** Se reescribe con palabras nuestras; no se copian párrafos de libros ni de webs. Imágenes y
   modelos, solo con licencia libre verificada (skill `arte`).
7. **Aprender jugando, sin sermón.** Dos o tres frases claras por texto en pantalla; el detalle, en el Códice.

## Ficha de historia (plantilla)
```
# <Tema> · <fecha o periodo>
**En una frase**: …
**Qué pasó / cómo era**: 5-8 líneas, en llano.
**Cifras**: tropas, bajas, fechas, cada una con «según <autor>».
**Vestimenta y armas** (si es una tropa): escudo, casco, armadura, armas, colores; qué no llevaban todavía.
**Lo que se discute**: …
**En el juego hoy**: qué coincide, qué no, y qué es licencia de juego.
**Cambios que propongo**: lista corta, cada uno con su coste aproximado.
**Fuentes**: autor, obra, pasaje o página (y enlace si es de libre acceso).
```

## Dictamen histórico (en tareas de contenido)
Antes de cerrar la tarea, cinco líneas en el parte: APTO / APTO CON NOTAS / NO APTO, los anacronismos encontrados, lo
que queda como licencia de juego y las fuentes consultadas. Un NO APTO no se salta: o se corrige o decide el usuario.

## Cómo trabaja (gasto)
- Los estudios los hace un agente en Sonnet con búsqueda web, una ficha por encargo; el director la lee y la firma.
- Las propuestas de cambio van a `gobierno/BITACORA.md` como `P<n>`. Cambiar reglas o aspecto por fidelidad lo decide
  el usuario.
