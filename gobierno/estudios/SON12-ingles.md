# SON12 — Revisión de inglés en todo el audio (24/11/2026)

Regla del usuario: «No quiero nada en inglés salvo voces de galos enemigos. Soy español».
Método: faster-whisper `small` (CPU, int8). Los sonidos y la música, por trozos de 10 s, dos veces: forzando inglés (`language='en'`) y con
detección automática; se anotan las palabras con probabilidad ≥ 0,5 (dudosas ≥ 0,3). Las voces (`assets/voces/`, 182 frases cortas):
detección de idioma y transcripción automática. Whisper alucina inglés («thanks for watching», «you») sobre ruido y música, así que cada
caso se contrastó (misma alucinación en una versión sin voces, o sonido sin ninguna voz).

## Sonidos (`assets/sonido/`, 59 archivos)
| Archivo | Qué sale | Veredicto | Qué se hizo |
|---|---|---|---|
| clamor1 | «hey» ×5 (0,52–0,99), de craigsmith 480809 | inglés claro | rehecho: masa «huuu» de felix.blume (CC0) + 5 gritos sin palabra. Repetido el análisis: solo «AHH» (0,44) |
| lucha1 | «get back» ×4 (0,64–0,97), de craigsmith 675091 | inglés claro | rehecho: bucle de 10 s con masa de felix.blume + golpes y esfuerzos del juego, semilla fija. Limpio |
| coro1 | «hey» (0,43–0,47) | probable | rehecho: tres gritos sin palabra casi a la vez. Limpio |
| canto1, canto2 | «um», «do», «lululu» repetidos (sílabas, no palabras) | no es inglés (sílabas cantadas) | se quedan; solo suenan con galos enemigos (`banda.js` / `ui-guerra.js` los cambian por `clamor` si el rival no es galo) |
| madera2 | «for watching» (0,9) | alucinación (golpe de madera, sin voz) | nada |
| cuerno1 | «mhm» (0,5–0,88) | alucinación sobre el cuerno | nada |
| grito3, grito5(…), herido5, panico2 | «AARGH», «Eurgh», «AAH» | interjecciones sin palabra | nada |
| el resto (46) | nada ≥ 0,3 | limpio | — |

Los tres rehechos conservan el nombre y el grupo del banco, así que `BANCO` de `js/gfx/sonido.js` no cambia (mismos 59 archivos, mismo `sw.js`).
No se hizo grupo `clamorGalo`: la fuente inglesa se descartó del todo en vez de reasignarla (así no queda inglés suelto por error).
Fuentes quitadas: craigsmith 480809 y 675091, Jace 57204 (ya no hay nada suyo; fuera de Créditos y README).

## Música (`assets/musica/`)
| Pieza | Evidencia | Veredicto | Qué se hizo |
|---|---|---|---|
| batalla | la voz separada (versión con coro menos versión «No Vocals», idénticas salvo la voz) transcrita: idioma «la»/«en» al 50 %, trozos como «the second, the third… the final», «me, me, me», «peace, no peace» | coro con sílabas/palabras dudosas, posiblemente inglés | cambiada por «Blackmoor Colossus Loop (No Vocals)» del mismo zip, misma licencia; mismo peso (1,16 MB) y bucle (116 s, -16,5 LUFS). Sin voz, Whisper solo da las alucinaciones habituales |
| menu («Heroic Demise (New)») | etiquetas de la página «choir, Vocal»; sin letra publicada; solo alucinaciones («for watching», «ringtone») | **dudoso**: coro de orquesta, probablemente vocales («aaah») | se queda; no hay versión sin voces en su descarga. Que lo oiga el usuario |
| ciudad, mapa | sin coro (violín, flauta, tambor); solo alucinaciones | limpio | nada |
| victoria, derrota | CC0, orquesta sin voz; «thank you» al final es silencio alucinado | limpio | nada |
Demucs no está instalado ni se pudo bajar rápido: la voz de batalla se separó restando las dos versiones del mismo paquete.

## Voces sintetizadas (`assets/voces/`, 182 archivos)
Detección: 125 en español, el resto latín/griego clasificado como italiano, griego, catalán, etc. (frases de 1 s). Cinco salen como «en» con
confianza 0,13–0,53 y texto absurdo («Aquaman», «in a walk-in» por «Tenebo aciem», «See you on the next one», «Stop, stop», «Dear Holland»): son latín o
griego mal oído, no inglés. Ninguna contiene una frase inglesa real.
