#!/usr/bin/env node
/* AQVILA — CM3 (24/11) probaba las pestañas «Arte» y «Equipos». Desde CM6 (usuario 25/11, «1A») el cuadro tiene cuatro pestañas
   (Para ti · Ahora · Tu móvil · Más): el arte vive en «Más» y los equipos en «Ahora». La prueba es gobierno/captura-cm6.mjs;
   este archivo la llama para que los encargos viejos sigan funcionando. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const r = spawnSync(process.execPath, [fileURLToPath(new URL('./captura-cm6.mjs', import.meta.url))], { stdio: 'inherit' });
process.exit(r.status ?? 1);
