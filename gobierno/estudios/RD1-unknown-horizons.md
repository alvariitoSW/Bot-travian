# RD1 · `unknown-horizons/unknown-horizons` (GPL-2.0) — ciudad y suministro tipo Anno (16/11/2026)
**Para**: formato de ciudades (FJ1, P113). Licencia GPL-2.0 según su README (la ficha de GitHub no la indicaba): **solo ideas**. Python con motor propio, no sirve de código.
**Enlace**: https://github.com/unknown-horizons/unknown-horizons · clon temporal; leídos `content/objects/buildings/*.yaml` (52 edificios) y `horizons/world/building/settler.py`.

## Qué hace
1. **Edificios como datos**: un archivo YAML por edificio con tamaño, coste, **radio de servicio**, habitantes, **líneas de producción** («consume 1 harina, produce 1 comida cada 15 s») y **almacén por huecos** (8 de cada materia). El panadero del ejemplo: radio 8, 2×2 casillas, cuesta oro + tablas + ladrillos.
2. **Suministro con «recogedores»**: el edificio no entrega solo; una unidad camina a recoger lo producido. Si no llega, el edificio se queda parado: **el cuello de botella se ve**.
3. **Ciudadanos por niveles** (`settler.py`): casas que **suben o bajan de nivel** según su felicidad (comida, servicios dentro del radio); pagan impuesto (`pay_tax`); si todo falla quedan en ruina. Una **plaza principal** debe estar en rango.
4. **Cada isla es su propio almacén**; entre islas, rutas comerciales con barcos.

## Qué enseña a AQVILA
- **El radio de servicio** es la mecánica estrella: el jugador planifica el mapa de la ciudad (fuente cerca de las casas). Coincide con «barrios con servicios» (R1) y el almacén con tope (R17).
- **Subir y bajar de nivel** según necesidades cubiertas: una cuenta clara que cuadra todo (parecido a Tropico: gente → puestos → producción → dinero).
- **Cadena corta y visible** (trigo → harina → pan) con el cuello a la vista: encaja con R18.
- Lo que **no** sirve: el transporte por unidades que caminan (caro en CPU y en pantalla de 390 px) y la gestión de varias islas a mano: choca con la decisión P113 de ciudades por oficio.

## Traducción
Datos de edificios: `js/data.js` (campo `radio`, líneas de producción) con su ficha en `js/registro.js`; lógica en `js/game.js` (cálculo por distancia, **sin recogedores animados**: suministro por cobertura); vista en `js/gfx/city3d.js` (círculo del radio al elegir edificio). Guardado: campos nuevos migrados en `G.load`.
**Coste**: medio-grande (toca datos guardados). **Riesgo**: medio: complejidad de la ciudad en pantalla pequeña.
**Versión mínima**: un edificio de servicio (p. ej. fuente o mercado) con radio visible y casas que mejoran si los tienen dentro; nada de recogedores. Comprobar con captura a 390 px que el radio se entiende.
