# Entorno «Batallas y su taller de arte»: guion de instalación

Guion: `gobierno/entornos/batallas-taller.sh` (85 líneas). Se pega como *setup script* del entorno en la nube.
Corre como root al construir el contenedor, desde la carpeta que contiene el repositorio. Todo va a
`/opt/aqvila-taller/`, fuera del repositorio. Si una descarga falla, avisa y sigue (termina siempre con 0).
Probado el 23/11/2026 en una sesión de la nube (4 núcleos, Python 3.13.18, Ubuntu 24.04).

## Qué instala
| Pieza | Versión | Dónde | Licencia |
|---|---|---|---|
| Blender sin pantalla: módulo `bpy` de PyPI, con numpy y Pillow, en su propio entorno de Python | bpy 5.3.0 (exige Python 3.13) | `/opt/aqvila-taller/blender/`, atajo `blender-py` | GPL (herramienta; no se reparte con el juego) |
| EGL de Mesa por apt (`libegl1`, `libgl1`, `libegl-mesa0`), solo para el motor Eevee | la de Ubuntu 24.04 | sistema | — |
| Quaternius, Universal Animation Library 1 (Standard) | zip de OpenGameArt | `ual/ual1/AnimationLibrary_Godot_Standard.glb` (+ zip abierto en `ual1/zip/`) | CC0 |
| Quaternius, Universal Animation Library 2 (Standard) | zip de OpenGameArt | `ual/ual2/UAL2_Standard.glb` (+ `ual2/zip/`) | CC0 |
| MakeHuman, solo datos: `base.obj`, `default.mhskel`, `default_weights.mhw`, `targets/` (1 280 deformadores) y su `LICENSE.md` | commit `a8bc2d5` de `master` | `mhdata/` | CC0 (los datos; el código es AGPL y no se baja) |

URLs exactas: `https://opengameart.org/sites/default/files/universal_animation_librarystandard.zip` (14 541 205 bytes)
y `https://opengameart.org/sites/default/files/universal_animation_library_2standard.zip` (10 257 419 bytes).
MakeHuman: `https://github.com/makehumancommunity/makehuman`, clon parcial (solo esos archivos) del commit
`a8bc2d54ff0ac92e78ff71431b1023eda42bf482`. Deja también `entorno.sh` (y `/etc/profile.d/aqvila-taller.sh`) con
`MH_DATOS` y `UAL_DATOS`, las variables que leen `gobierno/maquetas/soldado-rome2/construir/`, y un `LEEME.txt` con rutas y versiones.

**Ojo con la versión de MakeHuman**: el proyecto la llama «1.3.2», pero en GitHub no hay etiqueta 1.3.2 (la última
es `v1.3.0`) y `master` dice `1.3.0 alpha`. Los datos de `master` sirven: el hastatus sale con los mismos 1 033
triángulos que apunta `soldado-rome2/LEEME.md`. De dónde sacó la sesión GM44 su «1.3.2» no está apuntado en el repositorio.

## Medido aquí
- **Tiempo**: 26 a 28 s instalando desde cero; 1 a 3 s si ya está (no repite nada).
- **Disco**: 1,3 GB en `/opt/aqvila-taller` (Blender 1,1 GB, MakeHuman 129 MB, Quaternius 105 MB). No deja caché de pip.

## Hosts de red
| Host | Para qué | ¿Permitido hoy? |
|---|---|---|
| `pypi.org`, `files.pythonhosted.org` | bpy, numpy, Pillow | Sí (registro de paquetes) |
| `archive.ubuntu.com`, `security.ubuntu.com` | apt (EGL) | Sí (registro de paquetes) |
| `opengameart.org` | Quaternius | Sí, está en la lista |
| `github.com` | MakeHuman (git) | Sí en la sesión, por el proxy de git de la sesión, no por la lista. **No comprobado** que ese proxy exista mientras corre el guion |
| `download.blender.org` | Blender oficial | **Bloqueado (403)**. No hace falta: se usa `bpy` de PyPI |

No falta ningún host para lo que instala el guion.

## Cómo se usa
```
source /opt/aqvila-taller/entorno.sh
blender-py mi_modelo.py -- argumentos            # cualquier guion con «import bpy», sin pantalla
node tools/glb_a_static.mjs modelo.glb clave textura.webp carpeta   # .glb → formato de assets/static
cd gobierno/maquetas/soldado-rome2/construir && blender-py construir.py hastatus --lod2 --salida=/tmp/x
```
Prueba hecha: `cuartel_build.py` de la rama `ccr-eda89860-50oj5c` construye el cuartel (1 832 triángulos, igual que en la
nube de Patch), se despliega UV, se hornea el color con Cycles en CPU (0,3 s a 256 px), se exporta `cuartel.glb`
(124 KB) y `glb_a_static.mjs` lo convierte (1 832 triángulos, 126 KB). Todo en una carpeta temporal.
Render de prueba a 320 px: Cycles en CPU 0,9 s; Eevee 76 s (va por software, con avisos de EGL): **usar Cycles**.

## «Blender en la nube (Patch)»: qué es y por qué no está en el guion
Patch (`patch.gg`) es un servicio de pago que ejecuta Blender (5.2/5.3) **en sus propios servidores**. La sesión
«Ciudad generada por IA» lo usó así (23/11): clonó `github.com/patch-gg/cloud-blender-skills` (29 skills de Blender,
MIT) en `/home/user/patch-gg/`, instaló la herramienta `@patchgg/cli` 1.4.0 de npm (orden `pch`) en su carpeta temporal,
el usuario aprobó el inicio de sesión en `https://patch.gg/device` con su cuenta, y desde ahí todo fue
`python3 …/skills/blender-cloud/scripts/cloud.py run|push|look|exec|stop` (sube el guion, lo ejecuta allí y baja el
resultado). Gasta créditos (1 crédito = 0,01 $; sesión pequeña ≈0,83 créditos por minuto). Hacen falta la cuenta del
usuario y un `PCH_TOKEN` o inicio de sesión: un guion de instalación no puede hacerlo (sin secretos).
**Aquí no lo instalé**: el permiso de esta sesión denegó `npm install @patchgg/cli`. El guion usa en su lugar Blender
local (`bpy`), que no pide cuenta ni cuesta créditos y hace lo mismo para modelar, hornear y exportar.

## La «prueba del lanzamiento de pilum»
Era un guion de Blender (`tiro.py`) que, sobre el maniquí y el esqueleto de Quaternius UAL2, hace un lanzamiento de
pilum con poses clave, cinemática inversa, agarre de la mano y el pilum saliendo volando; renderizaba 40 cuadros y
montaba dos vídeos con ffmpeg, todo en la nube de Patch (`cloud.py run tiro.py -- vista=tres lente=62 w=520
cuadros=…`, luego `cloud.py exec "ffmpeg …"`). En aquel contenedor estaba en
`/tmp/claude-0/-home-user-Bot-travian/7cb2ac4b-aaed-5cf0-8daa-bff5b7882e56/scratchpad/pilum/tiro.py`.
**Ya está guardado**: commit `f6f292d` de la rama `origin/ccr-eda89860-50oj5c`, como `tools/blender/pilum_tiro.py`,
con los vídeos y las capturas en `gobierno/capturas-tarea/PIL-*`. No hay que pedírselo a esa sesión.

## Lo que no pude comprobar
- Que el guion funcione al construir un contenedor nuevo (lo ejecuté a mano aquí, como root, desde `/home/user`).
- Que `github.com` sea alcanzable durante la instalación (fuera de la sesión puede no haber proxy de git).
- La rama de reserva para un Python que no sea 3.13 (`uv venv --python 3.13`): aquí hay 3.13 y no se usó.
- `pilum_tiro.py` con el Blender local (usa el maniquí de UAL2, debería ir; no lo ejecuté).
- Patch: ni su herramienta ni su nube (permiso denegado; además pide la cuenta del usuario).
