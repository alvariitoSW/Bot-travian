# AG1 · Agricultura por suelos — diseño del director (24/11/2026)

Pedido del usuario (24/11): «mejorar la parte de agricultura y poner diferentes tipos de campos que tengan una acción en el
suelo diferentes y tengan mejoras y que […] hay que tenerlos en diferentes tipos de sitios por las características del suelo».
Eligió cinco campos (Catón, *De agri cultura* 1.7) y cuatro productos nuevos: aceite, vino, verdura y lana.
Todos los números son **licencia de juego**; las labores y mejoras llevan fuente.

## 1. Suelos (id → nombre)
| id | Nombre | Cómo se reconoce (entrada `{pend, distAgua, altAgua, solana}`) |
|---|---|---|
| `ribera` | Junto al agua | `distAgua < 70` y `pend < 0.08` y `altAgua < 6` |
| `baja` | Tierra baja o pobre | no ribera, `pend < 0.08` y (`altAgua < 2.5` o `pobre` true) |
| `llano` | Llano de tierra honda | `pend < 0.08` y no lo anterior |
| `ladera_sol` | Ladera al sol | `pend >= 0.08` y `solana >= 0.5` (cara al sur) |
| `ladera_seca` | Ladera seca | `pend >= 0.08` y `solana < 0.5` |
`pend` = pendiente (alto/horizontal), `distAgua` en metros del juego, `altAgua` = metros sobre el nivel del río,
`solana` 0..1 = cuánto mira la ladera al sur (en la ciudad, sur = +z… lo fija `campos.js` y lo dice en un comentario).

## 2. Campos y suelo (rinde: bien 1, regular 0,6, mal 0,3, «no» = no se puede)
| Campo | Produce | llano | ladera_seca | ladera_sol | ribera | baja |
|---|---|---|---|---|---|---|
| `trigo` (Trigo) | grano | **bien** | no | mal | regular | mal |
| `olivar` (Olivar) | aceite | regular | **bien** | regular | no | no |
| `vina` (Viña) | vino | mal | regular | **bien** | no | no |
| `huerto` (Huerto) | verdura | regular | no | no | **bien** | regular |
| `pasto` (Pasto) | lana | regular | regular | mal | regular | **bien** |
Razón en una frase por casilla «no»: el olivo y la vid se pudren con el pie en agua; sin agua no hay huerto en ladera;
el trigo no se ara en ladera pedregosa. Fuentes: Catón 1.7 y 6 (qué plantar en cada sitio), Varrón *Res rusticae* 1.7–1.9.

## 3. Calendario (mes 0 = Ianuarius … 11 = December). Labor = `{id, nombre, verbo, cosecha:bool}`
- **trigo**: 0–2 `escarda` (escardar) · 3–4 `crece` · 5–6 `siega` (segar, cosecha) · 7 `trilla` (trillar en la era) ·
  8 `barbecho`/`arada` (arar) · 9–10 `siembra` (sembrar) · 11 `nace`. Varrón 1.32–1.37; Catón 35.
- **olivar**: 0 `aceituna` (varear y recoger, cosecha) · 1–2 `poda` · 3–4 `arada` entre hileras · 5–9 `crece` ·
  10–11 `aceituna` (cosecha). Catón 44 (poda), 64–65 (recogida y aceite).
- **vina**: 0 `reposo` · 1–2 `poda` · 3–4 `cava`/`atar` (atar a la espaldera) · 5–7 `crece` · 8–9 `vendimia`
  (vendimiar, cosecha) · 10 `pisado` (pisar en el lagar) · 11 `reposo`. Catón 33 y 23–26; Varrón 1.34.
- **huerto**: todo el año; 5–7 `riego` (regar), 2–3 y 8–9 `siembra`, resto `huerta`; **cosecha todos los meses**.
  Catón 1.7 (hortus irriguus).
- **pasto**: 0–2 `paridera` (paren las ovejas) · 3–4 `esquileo` (esquilar, cosecha) · 5 `heno` (segar el heno) ·
  6–8 `trashumancia` (el rebaño sube a los montes: el pasto queda casi vacío) · 9–11 `pasto`. Varrón 2.2 y 2.11.
Función por estación: `laborEstacion(campo, est)` (est 0 primavera, 1 verano, 2 otoño, 3 invierno) = la labor del mes
central de la estación (primavera = mes 3, verano 6, otoño 9, invierno 0).

## 4. Mejoras (una o dos por campo; coste en materiales y denarios, licencia de juego)
| id | Campo | Nombre | Efecto | Fuente |
|---|---|---|---|---|
| `estercolero` | trigo | Estercolero | ×1,2; si hay `pasto` vecino, ×1,35 | Catón 5.8, 36–37 |
| `era` | trigo | Era empedrada | ×1,15 | Varrón 1.51 |
| `almazara` | olivar | Almazara y prensa | sin ella el aceite rinde ×0,5; con ella ×1 | Catón 20–22 (trapetum), 18 (prensa) |
| `lagar` | vina | Lagar | sin él el vino rinde ×0,5; con él ×1 | Catón 18, 23–26 |
| `bodega` | vina | Bodega de dolias | el vino se guarda (no se pierde) y vale ×1,3 | Catón 10–11 (dolia) |
| `noria` | huerto | Noria o riego | ×1,3 y el huerto pasa a rendir **bien** en `llano` y `baja` | rueda de agua: Filón de Bizancio (s. III a.C.); `probable` |
| `redil` | pasto | Redil | ×1,25 en lana y da estiércol: cuenta como `pasto` vecino para el estercolero | Varrón 2.2.8–9 |

## 5. Productos y para qué sirven
| id | Nombre | Alimento (por unidad, grano = 1) | Precio (denarios) | Se guarda | Usos |
|---|---|---|---|---|---|
| `grano` | Grano | 1 | 1 | sí | comida, tropas |
| `aceite` | Aceite | 0,5 | 5 | sí | comida, comercio, culto (lámparas, ofrendas), baños |
| `vino` | Vino | 0,3 | 6 (= `D.BIENES.vino`) | solo con bodega; sin ella se pierde un 20 % por estación | comercio, fiestas, culto (libaciones), tropas (posca) |
| `verdura` | Verdura | 0,8 | 2 | **no**: se come o se pierde en el mes | comida, mercado del barrio |
| `lana` | Lana | 0 | 4 | sí | comercio, taller (trabajo), ropa de tropas |
`dieta({grano, aceite, vino, verdura}, bocas)` → `{cubre (0..1), variedad (0..4), faltan:[ids], texto}`: cubre = comida
equivalente / bocas (tope 1); con 3 o 4 productos la variedad suma +0,1 a la cobertura (tope 1). Ración de Catón 56–58
(grano, vino, aceite, aceitunas y sal para la familia). `texto` en llano: «Comen pan, aceite y verdura; falta vino».

**Cambio (usuario, 24/11: «Que esos productos tengan peso en el mercado»)**: los precios NO van aquí; los pone CE4
(`js/mercado.js`). PRODUCTOS lleva `campo`, `guarda`, `estropea`, `usos`, `alimento` y `suelos` (donde rinde bien);
`valor(productos, precios)`; y además `produccionEstacion(parcela, est)` y `ofertaPorEstacion(campo, suelo)`.

## 6. API (ESM, funciones puras, sin `window`, sin azar, sin mutar entradas)
```
SUELOS, CAMPOS, PRODUCTOS, MEJORAS, LABORES   // tablas exportadas
clasificarSuelo({pend, distAgua, altAgua, solana, pobre}) → id de suelo
encaje(campo, suelo, mejoras=[]) → {nota:'bien'|'regular'|'mal'|'no', rinde:número|0, razon:texto}
consejo(suelo, mejoras=[]) → [{campo, nota, rinde}] ordenado de mejor a peor, sin los «no»
labor(campo, mes) → {id, nombre, verbo, cosecha}
laborEstacion(campo, est) → igual
mejorasDe(campo) → [ids] ; puedeMejorar(parcela, mejora) → {ok, motivo}
produccionAnual(parcela, vecinos=[]) → {producto: n}      // parcela = {campo, suelo, nivel (1..5), mejoras:[]}
produccionMes(parcela, mes, vecinos=[], {granoRepartido=true}) → {producto: n}
   // la anual se reparte entre los meses de cosecha; el grano se reparte en 12 (licencia de juego: el granero lo reparte,
   // para no romper el equilibrio de CE2) salvo granoRepartido:false
base anual por nivel: grano 36, aceite 10, vino 10, verdura 24, lana 8 (× nivel × rinde × mejoras)
guardar(almacen, mes, mejorasCiudad) → almacén nuevo: verdura a 0 al cerrar el mes; vino −20 % por estación sin bodega
dieta(productos, bocas) → ver §5
valor(productos) → denarios al precio de §5
encargosAgricultura(estado) → propuestas para el ministro (edil del grano), máx. 3, ordenadas:
   estado = {parcelas:[{id, campo, suelo, nivel, mejoras}], libres:[{id, suelo}], almacen, bocas, mes}
   tipos: {tipo:'campo', parcela, campo, texto:'Plantar viña en la ladera al sol'}
          {tipo:'mejora', parcela, mejora, texto:'Poner almazara en el olivar'}
          {tipo:'cambiar', parcela, campo, texto:'Cambiar el trigo de la ladera por olivar'} (si rinde «mal» o peor)
          {tipo:'reserva', recurso, objetivo, texto}
migrar(s) → s.agro = {v:1, parcelas:[]} si falta (las existencias viven en s.bienes, pactado con CE4)
```
Textos en español, frases cortas.

## 7. Dibujo (`js/gfx/campos.js`), estilo CD0b «3D real con suelo pintado»
Cada cuadro de la vega se clasifica con `clasificarSuelo` (pendiente de `C.altura`, distancia de `C.distRio`, altura
sobre `C.NIVEL_RIO`, solana por el gradiente) y lleva el campo que mejor encaja (con algo de variedad por `hash`).
Desde arriba se distingue: **trigo** en tiras con surcos; **olivar** en hileras de olivos sobre tierra parda;
**viña** en espalderas (postes y líneas verdes); **huerto** en cuadros pequeños con acequias azules junto al río;
**pasto** verde con ovejas blancas. La labor de la estación se ve (rastrojo y haces en la siega, uva morada y cestos en la
vendimia, mantos bajo los olivos en la aceituna, ovejas esquiladas y fardos de lana, tierra arada parda…). La mejora se ve
como una pieza pequeña en la esquina (almazara, lagar, noria con su rueda, redil con cerca, era redonda, estercolero).
