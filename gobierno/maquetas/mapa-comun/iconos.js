/* AQVILA · AM1 — iconos de recursos, dibujados aquí (arte propio). Cada uno es un SVG de 24x24 que hereda el color del texto. */
const s = d => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
const L = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
export const ICONOS = {
  grano: s('<path ' + L + ' d="M12 22V9"/><path fill="currentColor" d="M12 2c2 2 2 4 0 6-2-2-2-4 0-6zM7 6c2.6.4 3.8 1.8 4 4-2.6-.4-3.8-1.8-4-4zm10 0c-.2 2.2-1.4 3.6-4 4 .2-2.2 1.4-3.6 4-4zM7 11c2.6.4 3.8 1.8 4 4-2.6-.4-3.8-1.8-4-4zm10 0c-.2 2.2-1.4 3.6-4 4 .2-2.2 1.4-3.6 4-4z"/>'),
  madera: s('<path fill="currentColor" d="M12 2l5 7h-3l4 6h-4.5v0H10.5 6l4-6H7z"/><path ' + L + ' d="M12 15v7"/>'),
  piedra: s('<path fill="currentColor" d="M3 9l9-5 9 5-9 5z" opacity=".55"/><path fill="currentColor" d="M3 10.5l8.3 4.6V21L3 16.4zM21 10.5l-8.3 4.6V21l8.3-4.6z"/>'),
  hierro: s('<path ' + L + ' d="M5 20L15 8"/><path ' + L + ' stroke-width="2.6" d="M8 5c4-2 9-1 12 4-3-2-6-2.4-9-1"/>'),
  plata: s('<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="6" fill="none" stroke="#0006" stroke-width="1.4"/><circle cx="10" cy="11" r="1.3" fill="#0007"/><circle cx="14" cy="11" r="1.3" fill="#0007"/><path d="M11 14.5l1 1.5 1-1.5" fill="none" stroke="#0007" stroke-width="1.2"/>'),
  purpura: s('<path fill="currentColor" d="M4 9c0-4 5-6 9-4 4 2 6 6 4 10l4 6-7-3c-6 1-10-3-10-9z"/><path fill="none" stroke="#fff9" stroke-width="1.3" stroke-linecap="round" d="M8 9c1-2 4-2 5 0s-1 4-3 3"/>'),
  ceramica: s('<path fill="currentColor" d="M9 2h6v2l-1 2c4 2 5 6 3 10l-2 4 1 2H8l1-2-2-4C5 12 6 8 10 6L9 4z"/><path ' + L + ' stroke-width="1.5" d="M9 5C6 5 5 8 7 10M15 5c3 0 4 3 2 5"/>'),
  caballos: s('<path fill="currentColor" d="M7 22c0-5 1-7 3-9-2 0-3 1-4 2l-2-2 5-8 1-3 2 2c5 1 8 5 8 11v7z"/><circle cx="10.5" cy="8" r="1" fill="#0008"/>'),
  anguilas: s('<path ' + L + ' stroke-width="3" d="M3 8c3-4 6-2 6 2s3 7 6 4 0-8 5-8"/><circle cx="19.6" cy="5.6" r=".9" fill="#fff"/>'),
  sal: s('<path fill="currentColor" d="M2 20l6-9 3 3 3-7 8 13z"/><path ' + L + ' stroke-width="1.4" d="M18 3v4M16 5h4M5 5v3M3.5 6.5h3"/>'),
  lana: s('<path fill="currentColor" d="M6 18a4 4 0 01-1-7.5A4.5 4.5 0 0112 6a4.5 4.5 0 017 4.5A4 4 0 0118 18z"/><path ' + L + ' stroke-width="1.3" stroke="#0005" d="M8 13c1-1.5 3-1.5 4 0s3 1.5 4 0"/>'),
  bronce: s('<path fill="currentColor" d="M3 4c3 2 15 2 18 0-2 5-2 11 0 16-3-2-15-2-18 0 2-5 2-11 0-16z"/>')
};
