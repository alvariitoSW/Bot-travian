# CN25 · Medidas del ritmo del mes

Generado por `node gobierno/medir-ritmo.mjs` (2026-11-13).

## 1. Cuánto dura un mes y un turno

Cómo avanza el reloj: en cada cuadro de pantalla `G.tick(dt × velocidad / 4)`, con dt en segundos y tope de 0,25 s por cuadro. Un mes de juego = 4 s a ×1. Un turno (estación) = 3 meses. En modo turnos (el que usa la partida nueva) solo hay «parado» y ×1, y al llegar al fin del turno el reloj se para solo (`speed = 0`) y sale el consejo del Senado.

Cifra teórica (cuadros a 4 fps o más):

| Velocidad | Mes (s) | Turno (s) | Año (s) | Dónde existe |
| --- | --- | --- | --- | --- |
| parado (II) | ∞ (no avanza) | ∞ | ∞ | ambos modos |
| ×1 (▶) | 4 | 12 | 48 | modo turnos y continuo |
| ×2 (▶▶) | 2 | 6 | 24 | solo continuo (sin turnos) |
| ×4 (▶▶▶) | 1 | 3 | 12 | solo continuo (sin turnos) |

Hallazgo de código: la partida nueva de la interfaz activa `G.turnos = true`, así que ×2 y ×4 no se pueden elegir (el botón alterna solo II y ▶). Las ×2/×4 solo existen en el modo continuo de las pruebas.
Con cuadros lentos el mes dura más: el tope dt = 0,25 s significa que por debajo de 4 cuadros/s el juego va a cámara lenta (a 2 cuadros/s un mes tarda 8 s a ×1).

Medida en navegador (Chromium con render por software, 390×844; muy por debajo de un móvil real en cuadros/s):

- Cuadros por segundo del juego en esa máquina: **5,3**.
- Reloj en «parado» durante 3 s reales: avanza **0** meses (debe ser 0).
- Errores de página durante la medida: ninguno.

| Repetición | Caso | Meses avanzados | Segundos reales | Segundos por mes | Teoría (s por mes) |
| --- | --- | --- | --- | --- | --- |
| 1 | turnos ×1, un turno | 3 | 19,6 | 6,5 | 4 |
| 1 | continuo ×1, un mes | 1,1 | 7 | 6,6 | 4 |
| 1 | continuo ×2, un mes | 1,1 | 3,3 | 3 | 2 |
| 1 | continuo ×4, un mes | 1 | 2,5 | 2,5 | 1 |
| 2 | turnos ×1, un turno | 3 | 19,9 | 6,6 | 4 |
| 2 | continuo ×1, un mes | 1 | 6,9 | 6,9 | 4 |
| 2 | continuo ×2, un mes | 1 | 3,2 | 3,1 | 2 |
| 2 | continuo ×4, un mes | 1 | 1,3 | 1,3 | 1 |

Segundos reales en que cae cada fin de mes dentro del turno medido: 1/turnos ×1, un turno → 5,2 · 12,6 · 19,6; 1/continuo ×1, un mes → 7; 1/continuo ×2, un mes → 3,1; 1/continuo ×4, un mes → 2,5; 2/turnos ×1, un turno → 7,2 · 14,1 · 19,9; 2/continuo ×1, un mes → 6,9; 2/continuo ×2, un mes → 3,2; 2/continuo ×4, un mes → 1,3.

## 2. Campaña de 60 meses: ¿cuántos meses no hay nada útil que hacer?

Partida de arranque real (`G.newGame`: 2 ciudades al empezar: roma y capua), semillas 1, 2, 3. Se mira el estado **al empezar cada mes, antes de que el bot actúe**: eso es lo que ve el jugador.
«Acción útil» = algo que el juego permite ahora y cuyo primer pago (cuota 1) alcanza con los recursos libres: **construir/mejorar** un edificio (hueco de obra libre, sin obra igual, solares, requisitos), **reclutar** un lote de hasta 10 (cola < 5, reclutas disponibles), **herrería** (mejora de armas), **marchar** (ejército ≥ 50 hombres, ciudad enemiga vecina, sin marcha en curso), **mercado** (hay mercado y ≥ 100 de algún recurso para cambiar). **Mes muerto** = 0 acciones útiles. No se cuentan misiones del Senado ni investigación (no son acciones de un clic con coste inmediato medible aquí) ni órdenes de batalla.
Perfiles: **pasivo** = construye y recluta cada 2 meses, nunca ataca (el «jugador despistado»); **gastador** = gasta en cuanto puede, cada cuarto de mes, y además ataca (el «jugador atento»).

| Perfil | Semilla | Meses | Meses muertos | Racha más larga | Meses con ≤ 1 acción | Meses sin construir/reclutar/forjar | Ciudades perdidas | Media de acciones | Meses con todos los huecos de obra llenos | Meses sin cola de reclutas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pasivo | 1 | 60 | 0 (0 %) | 0 | 0 | 10 | 1 | 15,4 | 11 | 60 |
| pasivo | 2 | 60 | 0 (0 %) | 0 | 0 | 10 | 1 | 15,4 | 11 | 60 |
| pasivo | 3 | 60 | 0 (0 %) | 0 | 0 | 10 | 1 | 15,4 | 11 | 60 |
| gastador | 1 | 60 | 0 (0 %) | 0 | 0 | 41 | 1 | 4,1 | 40 | 0 |
| gastador | 2 | 60 | 0 (0 %) | 0 | 0 | 41 | 1 | 4,1 | 40 | 0 |
| gastador | 3 | 60 | 0 (0 %) | 0 | 0 | 41 | 1 | 4,1 | 40 | 0 |

Nota: las semillas del azar dan resultados casi idénticos porque el arranque no depende de ellas en estos 60 meses. «Muerto» cuenta mercado y marcha como acción; la columna «sin construir/reclutar/forjar» es la medida estricta de economía.

Meses muertos concretos: pasivo/1: ninguno · pasivo/2: ninguno · pasivo/3: ninguno · gastador/1: ninguno · gastador/2: ninguno · gastador/3: ninguno.

Detalle, perfil **pasivo**, semilla 1 (recursos libres = suma de los 5; mín = el recurso más escaso; obras/huecos; colas de reclutas; acciones por tipo C=construir R=reclutar F=forja M=marchar $=mercado):

| Mes | Ciud. | Recursos | Mín. | Obras/huecos | Colas | C | R | F | M | $ | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | 2 | 841 | 57 | 1/4 | 0 | 22 | 2 | 0 | 2 | 1 | 27 |
| 6 | 2 | 969 | 59 | 1/4 | 0 | 22 | 4 | 0 | 2 | 1 | 29 |
| 9 | 2 | 978 | 58 | 0/4 | 0 | 23 | 2 | 0 | 2 | 1 | 28 |
| 12 | 2 | 1186 | 90 | 0/4 | 0 | 23 | 4 | 0 | 2 | 1 | 30 |
| 15 | 2 | 1186 | 109 | 0/4 | 0 | 23 | 2 | 0 | 2 | 1 | 28 |
| 18 | 2 | 1326 | 134 | 0/4 | 0 | 23 | 4 | 0 | 2 | 1 | 30 |
| 21 | 2 | 1337 | 132 | 0/4 | 0 | 23 | 2 | 0 | 2 | 1 | 28 |
| 24 | 2 | 1337 | 119 | 4/4 | 0 | 0 | 2 | 0 | 2 | 1 | 5 |
| 27 | 2 | 1403 | 133 | 3/4 | 0 | 11 | 2 | 0 | 2 | 1 | 16 |
| 30 | 2 | 1288 | 127 | 4/4 | 0 | 0 | 2 | 0 | 2 | 1 | 5 |
| 33 | 1 | 1293 | 127 | 2/2 | 0 | 0 | 1 | 0 | 1 | 1 | 3 |
| 36 | 1 | 1306 | 116 | 1/2 | 0 | 11 | 1 | 0 | 1 | 1 | 14 |
| 39 | 1 | 1192 | 68 | 2/2 | 0 | 0 | 0 | 0 | 1 | 1 | 2 |
| 42 | 1 | 1017 | 1 | 2/2 | 0 | 0 | 0 | 0 | 1 | 1 | 2 |
| 45 | 1 | 1256 | 27 | 1/2 | 0 | 10 | 0 | 0 | 1 | 1 | 12 |
| 48 | 1 | 1105 | 2 | 1/2 | 0 | 0 | 0 | 0 | 1 | 1 | 2 |
| 51 | 1 | 1320 | 15 | 1/2 | 0 | 4 | 0 | 0 | 1 | 1 | 6 |
| 54 | 1 | 1334 | 9 | 1/2 | 0 | 1 | 0 | 0 | 1 | 1 | 3 |
| 57 | 1 | 1473 | 15 | 1/2 | 0 | 4 | 0 | 0 | 1 | 1 | 6 |
| 60 | 1 | 1616 | 20 | 1/2 | 0 | 7 | 0 | 0 | 1 | 1 | 9 |

(Se muestra un mes de cada tres, más los meses muertos.)

Detalle, perfil **gastador**, semilla 1 (recursos libres = suma de los 5; mín = el recurso más escaso; obras/huecos; colas de reclutas; acciones por tipo C=construir R=reclutar F=forja M=marchar $=mercado):

| Mes | Ciud. | Recursos | Mín. | Obras/huecos | Colas | C | R | F | M | $ | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | 2 | 376 | 28 | 3/4 | 1 | 11 | 0 | 0 | 2 | 1 | 14 |
| 6 | 2 | 369 | 28 | 3/4 | 1 | 7 | 0 | 0 | 2 | 1 | 10 |
| 9 | 2 | 422 | 23 | 4/4 | 1 | 0 | 0 | 0 | 2 | 1 | 3 |
| 12 | 2 | 508 | 16 | 4/4 | 1 | 0 | 0 | 0 | 2 | 1 | 3 |
| 15 | 2 | 575 | 15 | 3/4 | 1 | 1 | 0 | 0 | 2 | 1 | 4 |
| 18 | 2 | 620 | 15 | 3/4 | 1 | 1 | 0 | 0 | 2 | 1 | 4 |
| 21 | 2 | 707 | 22 | 4/4 | 1 | 0 | 0 | 0 | 2 | 1 | 3 |
| 24 | 2 | 828 | 35 | 2/4 | 1 | 7 | 0 | 0 | 2 | 1 | 10 |
| 27 | 2 | 934 | 46 | 2/4 | 1 | 16 | 0 | 0 | 2 | 1 | 19 |
| 30 | 2 | 1002 | 46 | 4/4 | 1 | 0 | 0 | 0 | 2 | 1 | 3 |
| 33 | 1 | 1046 | 45 | 1/2 | 1 | 7 | 0 | 0 | 1 | 1 | 9 |
| 36 | 1 | 1072 | 49 | 2/2 | 1 | 0 | 0 | 0 | 1 | 1 | 2 |
| 39 | 1 | 1095 | 47 | 2/2 | 1 | 0 | 0 | 0 | 1 | 1 | 2 |
| 42 | 1 | 1113 | 45 | 2/2 | 1 | 0 | 0 | 0 | 1 | 1 | 2 |
| 45 | 1 | 1109 | 33 | 2/2 | 1 | 0 | 0 | 0 | 1 | 1 | 2 |
| 48 | 1 | 1020 | 45 | 2/2 | 2 | 0 | 0 | 0 | 1 | 1 | 2 |
| 51 | 1 | 1013 | 45 | 2/2 | 2 | 0 | 0 | 0 | 1 | 1 | 2 |
| 54 | 1 | 1102 | 38 | 2/2 | 2 | 0 | 0 | 0 | 1 | 1 | 2 |
| 57 | 1 | 1243 | 32 | 2/2 | 2 | 0 | 0 | 0 | 1 | 1 | 2 |
| 60 | 1 | 1451 | 26 | 2/2 | 2 | 0 | 0 | 0 | 1 | 1 | 2 |

(Se muestra un mes de cada tres, más los meses muertos.)

## 3. Cuánto tarda una obra y una marcha

Una obra dura `tiempo × 1,35^nivel actual × (1 − 0,04 × nivel del foro)` meses y se paga en `ceil(meses)` cuotas mensuales (Q4: una por fin de mes; mínimo 1). Hay 1 hueco de obra con foro 1, hasta 4 con foro 8+ (Q4b: 1-2-2-3-3-3-4-4-4-4). A ×1 un mes son 4 s reales. Foro de Roma al empezar: nivel 1 (1 hueco(s)).

| Edificio | Subir a nivel 1 | Subir a nivel 3 | Subir a nivel 5 |
| --- | --- | --- | --- |
| Aserradero | 1,4 meses · 2 cuota(s) · 5,8 s | 2,6 meses · 3 cuota(s) · 10,5 s | 4,8 meses · 5 cuota(s) · 19,1 s |
| Granja | 1,4 meses · 2 cuota(s) · 5,8 s | 2,6 meses · 3 cuota(s) · 10,5 s | 4,8 meses · 5 cuota(s) · 19,1 s |
| Ínsulas | 1,7 meses · 2 cuota(s) · 6,9 s | 3,1 meses · 4 cuota(s) · 12,6 s | 5,7 meses · 6 cuota(s) · 23 s |
| Cuartel | 2,4 meses · 3 cuota(s) · 9,6 s | 4,4 meses · 5 cuota(s) · 17,5 s | 8 meses · 8 cuota(s) · 31,9 s |
| Mercado | 2,4 meses · 3 cuota(s) · 9,6 s | 4,4 meses · 5 cuota(s) · 17,5 s | 8 meses · 8 cuota(s) · 31,9 s |
| Puerto | 2,9 meses · 3 cuota(s) · 11,5 s | 5,2 meses · 6 cuota(s) · 21 s | 9,6 meses · 10 cuota(s) · 38,3 s |
| Templo | 2,9 meses · 3 cuota(s) · 11,5 s | 5,2 meses · 6 cuota(s) · 21 s | 9,6 meses · 10 cuota(s) · 38,3 s |

(Cada celda: duración en meses de juego · cuotas · segundos reales a ×1. Con foro nivel 1.) Con foro 5 las obras duran un 17 % menos. En modo turnos una obra de menos de 3 meses sigue acabando en su mes exacto (el reloj corre mes a mes dentro del turno); lo que se redondea al turno son las llegadas de marchas.

| Marcha (a pie, sin héroe) | Meses de juego | Segundos a ×1 | Con turnos (llega al fin de turno) | Segundos con turnos |
| --- | --- | --- | --- | --- |
| Roma → Capua (tramo directo) | 2 | 7,8 | 3 meses | 12 |
| Tramo más corto del mapa: Panormus ↔ Lilybaeum | 1 | 4 | 3 meses | 12 |
| Tramo más largo del mapa: Poblado íbero ↔ Carthago | 9,5 | 37,8 | 12 meses | 48 |
| Roma → Poblado íbero (la más lejana, suma de tramos) | 14 | 56 | 15 meses | 60 |

Marchas por mar: 8 de 24 tramos (con el multiplicador `mods.sea`, el puerto y la ciencia). Mínimo 0,5 mes por tramo. En modo turnos toda marcha llega a un fin de turno, así que el mínimo real es **un turno entero (12 s a ×1)** aunque el tramo sea de medio mes; ida y vuelta, 2 turnos.

Cobro en cuotas: un lote de reclutas o una obra de d meses cobra `ceil(d)` cuotas, una por fin de mes (cierreMes). Si en ese fin de mes no hay recursos, la obra se **pausa** y su plazo se corre (G.reintentarPlazos), de modo que la obra «pasa» sin avanzar. Eso es lo que el jugador percibe como «pasa sin que hagas nada» cuando le faltan recursos.

