/* Maqueta GM1 «guerra grande» — FORMACIÓN. Sin pantalla: corre en Node y en el navegador.
   Es el contrato entre el motor de combate y el dibujo. El motor solo tiene que dar, por regimiento:
     hombres (los que quedan), files (hombres por fila, fijo desde el despliegue), x, z (centro de la primera fila),
     yaw (hacia dónde mira) y paso (metros entre hombres y entre filas).
   Con eso, cada hombre tiene su sitio: el número «id» ocupa la fila floor(id / files). Al caer gente el regimiento
   pierde los últimos sitios: se queda sin filas por detrás y la última fila se acorta. Nadie se guarda uno a uno. */

/* Hombres por fila de un regimiento de «max» hombres. «ancho» = cuántas veces más ancho que hondo (3 en un móvil tumbado;
   1,2 con el móvil de pie, donde sobra alto y falta ancho) */
export const filesDe = (max, ancho) => Math.max(6, Math.round(Math.sqrt(max * (ancho || 3.2))));
export const filasDe = (hombres, files) => Math.ceil(Math.ceil(hombres) / files);
/* Los hombres que tocan al enemigo (primera fila) y los que pueden relevarlos: lo que un motor de combate necesita */
export const frenteDe = (hombres, files) => Math.min(files, Math.ceil(hombres));

const fr = x => x - Math.floor(x);
export const h1 = id => fr(id * 0.618034), h2 = id => fr(id * 0.754878 + 0.31);   // dos números fijos por hombre (desorden y compás)

/* Sitio en el campo del hombre «id» de un regimiento rg = { n, files, x, z, yaw, px, pz, giro }. Misma cuenta que el sombreador. */
export function sitio(rg, id, T, out) {
  const n = Math.ceil(rg.n), F = rg.files, fila = Math.floor(id / F), col = id - fila * F, enFila = Math.min(F, n - fila * F);
  const lx = (col - (enFila - 1) / 2) * rg.px + (h1(id) - 0.5) * 0.34, lz = fila * rg.pz + (h2(id) - 0.5) * 0.34;
  const sy = Math.sin(rg.yaw), cy = Math.cos(rg.yaw);
  out.x = rg.x - sy * lz + cy * lx; out.z = rg.z - cy * lz - sy * lx; out.yaw = rg.yaw; out.fila = fila;
  if (rg.giro) { const a = T * 0.9 + id * 0.785; out.x += Math.cos(a) * 1.6; out.z += Math.sin(a) * 3.2; out.yaw = Math.atan2(-Math.sin(a) * 1.6, Math.cos(a) * 3.2); }
  return out;
}
