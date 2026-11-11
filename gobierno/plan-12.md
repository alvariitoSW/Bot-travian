# Plan socialista de las doce tareas prioritarias

Pedido por el usuario el 11/11/2026: estudiar cómo hacer, en simple y gastando poco, las doce tareas que priorizó en
el cuadro, **antes** de aplicar nada. Nada de esto se construye hasta que apruebe cada propuesta (P2 a P13).

## Cómo se mide
- **M** = millones de tokens equivalentes, lo que imprime `node gobierno/gasto.mjs`.
- **Medido**: montar el gobierno (G1) costó 0,75 M de Fable. La charla posterior en la misma sesión, otros 0,5 M.
- **Estimado**: todo lo demás de esta página. Tras la primera tarea se corrige con el gasto real.
- Para pasarlo a tu porcentaje: mira cuánto bajó tu uso semanal de Fable con esta sesión (1,3 M) y haz la regla de tres.

## Cómo se trabaja (lo que abarata)
1. **El director (Fable) no construye**: presupuesta, encarga, pasa los jueces, mira las capturas y decide.
2. **Los agentes van en Sonnet**: constructor, revisor y estudios. Fable solo para diseño que decides tú (F1, E1).
3. **Una tarea, una sesión nueva**, abierta por el director. La conversación larga es el gasto más tonto.
4. **Sin verificador como agente**: los jueces son un comando. El revisor entra solo si se tocan partidas guardadas.
5. **Tope por tarea**: su presupuesto. Con un 25 % de exceso se para y se te cuenta. Una sola vuelta de arreglos.
   Si Sonnet falla dos veces, no se sube de modelo sin preguntarte.

## Las doce, en tres tandas

### Tanda 1 · Pensar y medir (tú decides con lo que salga)
| Tarea | Qué se hace, en simple | Quién | Fable | Sonnet | Tiempo |
|---|---|---|---|---|---|
| F1 | Página con tres preguntas de diseño y mi recomendación | director | 0,25 | — | 8 min |
| E1 | Página con paleta, letra y estilo de iconos | director | 0,30 | — | 8 min |
| D3 | Estudio: qué se gana, qué se pierde y cuánto cuesta pasar a Godot | estudio | 0,10 | 0,3 | 8 min |
| E3 | El comprobador de arte suma triángulos de una batalla y una ciudad típicas | director | 0,12 | — | 4 min |
| D1 | Contador de fluidez en el menú; tú mides en tu móvil | constructor | 0,12 | 0,25 | 8 min |
| | **Tanda 1** | | **0,89** | **0,55** | **36 min** |

### Tanda 2 · Reglas del juego (después de F1, por si cambia el diseño)
| Tarea | Qué se hace, en simple | Quién | Fable | Sonnet | Tiempo |
|---|---|---|---|---|---|
| B6 | Ajustar números hasta que el bot de pruebas tome Cartago | constructor | 0,12 | 0,5 | 12 min |
| B8 | Herrería: mejoras de armas (+ataque) y armaduras (+defensa) por niveles | constructor + revisor | 0,15 | 0,8 | 15 min |
| B3 | Impuestos bajo, normal o alto; felicidad que frena la población | constructor + revisor | 0,15 | 0,9 | 15 min |
| F3 | Repartir aldeanos entre los cuatro recursos con más y menos; sin 3D | constructor + revisor | 0,15 | 0,9 | 15 min |
| | **Tanda 2** | | **0,57** | **3,1** | **57 min** |

### Tanda 3 · Lo visual (después de D1, por si tu móvil va justo)
| Tarea | Qué se hace, en simple | Quién | Fable | Sonnet | Tiempo |
|---|---|---|---|---|---|
| B4 | Termas, acueducto y anfiteatro con modelos que ya hay | constructor | 0,15 | 0,6 | 12 min |
| D2 | Soldados lejanos con figura ligera | constructor | 0,20 | 1,1 | 25 min |
| B9 | Solo Roma: Tíber y colinas con el suelo y edificios que ya hay | constructor | 0,25 | 1,3 | 25 min |
| | **Tanda 3** | | **0,60** | **3,0** | **62 min** |

## Total
| | Fable | Sonnet | Tiempo |
|---|---|---|---|
| Las doce con plan socialista | **2,1 M** | **6,7 M** | unas 2 h 40 min |
| Las doce hechas solo con Fable, sin agentes | unos 3 M | — | parecido |

## Riesgos que suben el gasto
- **D2 y B9** son 3D: aquí solo hay render por software, así que se ven pero no se mide la fluidez. Son las más
  propensas a una segunda vuelta.
- **B3, B8 y F3** cambian la partida guardada: si F1 cambia el diseño después, parte se rehace. Por eso F1 va antes.
- **D3**: si decides pasar a Godot, D2 y parte de B9 dejan de tener sentido en la versión web.
- No sé cómo cuenta tu plan el uso de Sonnet frente al límite semanal de Fable. Si cuenta aparte, el ahorro es mayor.

## Qué queda fuera de las versiones simples
B4 con modelos nuevos de 0 A.D. · E1 con iconos propios en todo el juego · F3 con aldeanos visibles en 3D · B9 para
las demás ciudades · B3 con revueltas y eventos · D3 como paso real a Godot. Cada una sería tarea aparte.
