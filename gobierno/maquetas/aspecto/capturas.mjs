// Capturas de la maqueta del aspecto (MN4a). Uso: node gobierno/maquetas/aspecto/capturas.mjs
import { createRequire } from 'module'; import { fileURLToPath, pathToFileURL } from 'url'; import path from 'path';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const aqui = path.dirname(fileURLToPath(import.meta.url)), sal = path.join(aqui, '../../capturas-tarea');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(path.join(aqui, 'index.html')).href); await p.waitForTimeout(800);
const ids = ['ciudad', 'construir', 'senado-ministros', 'imperio', 'saber', 'tropas'];
for (let i = 0; i < ids.length; i++) await (await p.$('#' + ids[i])).screenshot({ path: path.join(sal, `MN4a-${i + 1}-${ids[i]}.jpg`), type: 'jpeg', quality: 80 });
// tira sola con 9 recursos
await (await p.$('#tira')).screenshot({ path: path.join(sal, 'MN4a-0-tira.jpg'), type: 'jpeg', quality: 80 });
await b.close();
