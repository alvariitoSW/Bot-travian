# R14 · Asedios (Imperator: Rome, Total War: Rome II, Hegemony)

Estudio de ingeniería reversa. Solo cómo se comportan los juegos; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Qué decide el jugador en un asedio y cuánto dura?

## 2. Observación
1. Imperator: cada fuerte tiene muros y guarnición propios. Hay tantos niveles de brecha como nivel del fuerte; el asedio tiene dos fines: matar de hambre o preparar el asalto. [Guía de fuertes, GamePressure](https://www.gamepressure.com/imperator-rome/forts-and-control-zone/z8c2a2)
2. Cada tirada puede cerrar una brecha, golpear a los defensores o abrir brecha, si hay artillería. El asalto es lo más rápido y lo más sucio: los defensores pelean desesperados. Guía, fuente de jugadores. (misma fuente)
3. Unidades como la caballería cuentan para el asedio pero no pueden asaltar. Quien ataca a un ejército que asedia es el atacante: el de socorro tiene la iniciativa (diario de desarrollo). [Diario 25-3-2019](https://forum.paradoxplaza.com/forum/threads/imperator-development-diary-25th-of-march-2019.1162743/)
4. Rome II: el equipo se construye en el sitio y tarda varios turnos; cada pieza cuesta mano de obra y esta depende del tamaño del ejército. Las escaleras no se construyen. [Manual de asedios](https://r2enc.totalwar.com/en/manual/single-player/0021_enc_page_campaign_play_military_sieges/index.html)
5. Rome II: cercar mata de hambre sin perder tropas, pero el rival puede reforzarse o atacar en el último turno. Un puerto dobla el tiempo; bloquearlo lo acorta. Edificios como un almacén de grano dan menos desgaste y +1 turno de aguante. [Manual](https://r2enc.totalwar.com/en/manual/single-player/0016_enc_page_campaign_play_military_attack) · [Edificio](https://r2enc.totalwar.com/en/tech/rom_gaul_engineering_siege_great_food_vault)
6. Hegemony: la serie hace del corte de suministros y del incendio de cosechas un arma de asedio. [Ficha Steam](https://store.steampowered.com/app/227060/)
7. Sin confirmar: duración en turnos, el número de fases de Imperator, y cómo cierra Hegemony el cerco.

## 3. Por qué funciona
Es una decisión de tiempo contra riesgo: esperar es barato pero deja entrar al socorro; asaltar es rápido y cuesta vidas. Los turnos de aguante dan un reloj visible.

## 4. Traducción a AQVILA
Encaja con N9 (cercar, asaltar, socorrer) y N8 (comida). Mapa por estaciones: un turno es una estación.
- **Cercar**: el ejército se planta; la ciudad tiene «aguante» en turnos = grano almacenado ÷ consumo (3–5 estaciones; puerto doble). Se resta cada turno. `js/game.js`.
- **Tres elecciones**: esperar (gratis, riesgo de socorro y de hambre propia), construir máquinas (2 turnos, depende de ingenieros), o asaltar ya (batalla con muros: la batalla recibe «muralla y brecha» como contexto y devuelve bajas).
- **Brecha**: máquinas bajan la muralla de 3 a 0 niveles; menos muralla, menos bajas en el asalto.
- **Socorro**: un ejército amigo que llega rompe el cerco y da la batalla con ventaja de iniciativa.
- **Pantalla**: barra de aguante sobre la ciudad, a 390 px, con tres botones. `js/ui.js`, `js/gfx/map3d.js`.
- **Contexto de batalla**: muro y nivel de brecha entran por `js/battle.js`; la batalla no sabe de grano.

## Historia (280–146 a.C.)
- **Histórico**: Siracusa 213–211, Arquímedes y el corte de la ciudad por tierra y mar (Polibio VIII 3–7 y Livio XXIV 33–34, por cotejar). Capua 211, cerco con fosos y hambre (Livio XXVI 4–6, por cotejar). Lilibeo 250–241 (Polibio I 41–48, por cotejar). Cartago 149–146, bloqueo del puerto, hambre y asalto final con Escipión Emiliano (Polibio, Apiano Libyca; por cotejar). Numancia 134–133: cerco de hambre sin asalto (Apiano, Iberica; por cotejar; fuera de fechas).
- **Licencia de juego**: aguante numérico, construir máquinas en turnos, brechas de 3 niveles.

## 5. Coste y riesgo
- N9 estima 1,5 M. Con brecha y muralla en 3D: 2,0 M. Ajuste de equilibrio, el doble.
- Riesgos: la IA debe saber cercar y socorrer; el jugador ve un asedio largo sin acción: ofrecer «saltar turno».

## 6. Versión mínima
Cercar con aguante en turnos y dos botones: «Esperar» y «Asaltar», sin máquinas. El asalto da la batalla con un bono para el defensor.
