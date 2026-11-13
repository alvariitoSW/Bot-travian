// AQVILA — referencia «Normal = hoy»: node test/ref-normal.mjs [guardar]  (huella de aDatos a 60 meses, 3 semillas, y población a 96 meses)
import * as R from '../js/ciudad.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
const arch = new URL('./ref-normal.json', import.meta.url);
const sal = { huellas: {}, pob96: {} };
for (const sem of [1, 2, 3]) {
  const E = R.crear(sem); R.fundar(E, 172, -196);
  for (const t of ['fuente', 'granero', 'granja']) { const s = R.mejorSitio(E, t); if (s) R.colocar(E, t, s[0], s[1], true); }
  let avisos = 0, pob = 0;
  for (let i = 1; i <= 96; i++) { avisos += R.mes(E).length; if (i === 60) sal.huellas[sem] = crypto.createHash('sha1').update(JSON.stringify(R.aDatos(E))).digest('hex') + ':' + avisos; }
  sal.pob96[sem] = R.estado(E).poblacion;
}
if (process.argv[2] === 'guardar') { fs.writeFileSync(arch, JSON.stringify(sal, null, 1)); console.log('guardado', JSON.stringify(sal)); }
else { const ref = JSON.parse(fs.readFileSync(arch)); const igual = JSON.stringify(ref) === JSON.stringify(sal); console.log(igual ? 'NORMAL = HOY' : 'DISTINTO', JSON.stringify(sal)); process.exit(igual ? 0 : 1); }
