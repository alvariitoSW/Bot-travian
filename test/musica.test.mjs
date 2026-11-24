// AQVILA — SON7: pruebas de js/gfx/musica.js (Node, sin audio real): node test/musica.test.mjs
import { createRequire } from 'node:module';
import { existsSync, statSync } from 'node:fs';
const M = createRequire(import.meta.url)('../js/gfx/musica.js'), fallos = [];
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };

// la tensión sube al perder moral y con cuerpos rotos; la espera es contenida
const sano = { fase: 'lucha', moral: [1, 1], rotos: [0, 0] }, mal = { fase: 'lucha', moral: [0.35, 0.9], rotos: [1, 0] }, esp = { fase: 'lejos', moral: [1, 1], rotos: [0, 0] };
ok(M.tensionDe(mal) > M.tensionDe(sano) + 0.3, `la tensión sube al perder moral (${M.tensionDe(sano).toFixed(2)} → ${M.tensionDe(mal).toFixed(2)})`);
ok(M.tensionDe(esp) < M.tensionDe(sano) && M.tensionDe(esp) > 0.1, 'la espera es tensa pero contenida');
ok(M.tensionDe({ fase: 'lucha', moral: [0, 0], rotos: [3, 0], cansancio: 1 }) <= 1 && M.tensionDe({}) >= 0 && M.tensionDe() >= 0, 'la tensión siempre queda entre 0 y 1');
ok(M.estadoDe(esp) === 'espera' && M.estadoDe(sano) === 'lucha' && M.estadoDe(mal) === 'peligro', 'estados: espera, lucha y peligro');
ok(M.estadoDe({ fase: 'fin', resultado: 'victoria' }) === 'victoria' && M.estadoDe({ fase: 'fin', resultado: 'derrota' }) === 'derrota', 'estados finales: victoria y derrota');
// SON1 (usuario: «en función de si voy ganando o perdiendo»): ganando suena distinto de perdiendo
const gano = { fase: 'lucha', moral: [0.9, 0.4], rotos: [0, 1] };
ok(M.estadoDe(gano) === 'ventaja', 'estado: ventaja cuando el enemigo flaquea o pierde cuerpos');

// qué pista toca cada pantalla
ok(M.TEMAS.join() === 'menu,ciudad,mapa', 'hay tres temas: menú, ciudad y mapa');
ok(M.temaDe('menu') === 'menu' && M.temaDe('city') === 'ciudad' && M.temaDe('map') === 'mapa', 'menú, ciudad y mapa tocan su pista');
ok(['saber', 'army', 'imperio', 'hero', 'senado', 'xyz'].every(p => M.temaDe(p) === 'ciudad'), 'Saber, Tropas, Imperio, héroe, Senado y las desconocidas tocan la de ciudad');
let falta = 0, grandes = 0, total = 0;
for (const [k, ruta] of Object.entries(M.ARCHIVOS)) { if (!existsSync(ruta.replace(/^/, './')) ) falta++; else { const kb = statSync(ruta).size / 1024; total += kb; if (kb > 2500) grandes++; } if (ruta !== 'assets/musica/' + k + '.mp3') falta++; }
ok(Object.keys(M.ARCHIVOS).join() === 'menu,ciudad,mapa,batalla,victoria,derrota' && falta === 0, 'las seis pistas existen y se llaman como su clave');
ok(grandes === 0 && total <= 6.5 * 1024, `cada pista ≤ 2,5 MB y todas ≤ 6,5 MB (${(total / 1024).toFixed(2)} MB)`);
const e0 = { encendida: true, visible: true, activa: false, final: null, finalHecho: false, tema: 'mapa' };
ok(M.pistaDe(e0) === 'mapa' && M.pistaDe({ ...e0, tema: 'menu' }) === 'menu' && M.pistaDe({ ...e0, tema: null }) === null, 'pistaDe: la de la pantalla; sin tema, silencio');
ok(M.pistaDe({ ...e0, activa: true }) === 'batalla', 'en batalla manda la pista de batalla sobre el tema');
ok(M.pistaDe({ ...e0, activa: true, final: 'victoria' }) === 'victoria' && M.pistaDe({ ...e0, activa: true, final: 'derrota' }) === 'derrota', 'al acabar suena victoria o derrota');
ok(M.pistaDe({ ...e0, activa: true, final: 'victoria', finalHecho: true }) === null, 'acabada la victoria, silencio hasta salir de la batalla');
ok(M.pistaDe({ ...e0, activa: false }) === 'mapa', 'al salir de la batalla vuelve el tema de la pantalla');
ok(M.pistaDe({ ...e0, encendida: false }) === null && M.pistaDe({ ...e0, visible: false, activa: true }) === null, 'con «Música» apagada o la pestaña oculta, silencio');
// tensión → volumen
ok(M.volumenBatalla(0) < M.volumenBatalla(0.5) && M.volumenBatalla(0.5) < M.volumenBatalla(1), 'el volumen de la batalla sube con la tensión');
ok(M.volumenBatalla(0) >= 0.4 && M.volumenBatalla(1) <= 0.9 && M.volumenBatalla(-5) === M.volumenBatalla(0) && M.volumenBatalla(9) === M.volumenBatalla(1), 'el volumen queda entre 0,4 y 0,9');
ok(M.GANA_TEMA < M.volumenBatalla(1) && M.GANA_FINAL > M.GANA_TEMA, 'la batalla en lo alto suena más que un tema; victoria y derrota se oyen claras');
ok(M.tensionMapa(0) < M.tensionMapa(1) && M.tensionMapa(1) < M.tensionMapa(3) && M.tensionMapa(99) <= 1 && M.tensionMapa() >= 0, 'la tensión del mapa sube con los ejércitos enemigos');
ok(M.iniciar() === false && M.activa === false, 'sin audio no arranca ni falla');
M.tension(0.5); M.agacha(); M.final('victoria'); M.parar(); ok(true, 'tension, agacha, final y parar sin audio no fallan');
ok(M.tema('xyz') === false && M.tema('batalla') === false && M.tema('mapa', { tension: 0.3 }) === true && M.estadoTema().tema === 'mapa', 'M.tema acepta temas conocidos y recuerda el actual');
ok(M.estadoTema().sonando === false, 'sin audio el tema no suena ni falla');
M.on(); ok(M.encendida() === true, 'el interruptor Música arranca encendido'); M.off(); ok(M.encendida() === false, 'se apaga'); M.on();

// el reproductor con un audio de mentira: qué pista suena en cada paso y a qué volumen
const reloj = { t: 0 };
const param = () => ({ value: 1, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.meta = v; this.value = v; }, setTargetAtTime(v) { this.meta = v; this.value = v; } });
const nodo = () => ({ gain: param(), connect() { return this; }, disconnect() {} });
const ctx = { state: 'running', get currentTime() { return reloj.t; }, createGain: () => nodo(), createMediaElementSource: e => ({ connect(g) { e.ganancia = g; return g; } }) };
globalThis.Sonido = { activo: true, ctx, maestro: nodo(), contexto: () => ctx };
const els = []; globalThis.Audio = class { constructor() { this.paused = true; this.currentTime = 7; this.loop = false; els.push(this); } addEventListener(n, f) { (this['on' + n] = this['on' + n] || []).push(f); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
const el = n => M.audio(n), volDe = n => el(n).ganancia.gain.value;
M.tema('menu'); ok(M.pista() === 'menu' && !el('menu').paused && el('menu').src === 'assets/musica/menu.mp3' && el('menu').loop === true, 'en el menú suena menu.mp3, en bucle');
M.tema('ciudad'); ok(M.pista() === 'ciudad' && !el('ciudad').paused && Math.abs(volDe('menu') - 0.0001) < 1e-9, 'a la ciudad: fundido cruzado, el menú baja y la ciudad sube');
M.tema('ciudad'); ok(M.pista() === 'ciudad', 'repetir el mismo tema no lo reinicia');
M.tema('mapa'); ok(M.pista() === 'mapa', 'al mapa suena mapa.mp3');
M.iniciar({ tension: 0.1 }); ok(M.activa && M.pista() === 'batalla' && el('batalla').currentTime === 0 && el('batalla').loop === true, 'empieza la batalla: suena batalla.mp3 desde el principio, en bucle');
const v0 = volDe('batalla'); M.tension(1); for (let i = 0; i < 12; i++) { reloj.t += 0.4; M.tic(); }
ok(Math.abs(v0 - M.volumenBatalla(0.1)) < 1e-6, 'la batalla arranca al volumen de su tensión');
ok(volDe('batalla') > v0 + 0.2 && Math.abs(volDe('batalla') - M.volumenBatalla(1)) < 1e-6, 'al subir la tensión, la pista sube de volumen');
ok(M.pista() === 'batalla', 'sigue la batalla mientras no acabe');
M.final('derrota'); ok(M.pista() === 'derrota' && !el('derrota').paused && el('derrota').loop === false && el('derrota').currentTime === 0, 'al perder suena derrota.mp3 una vez, desde el principio');
M.final('victoria'); ok(M.pista() === 'derrota', 'el final solo se decide una vez');
el('derrota').onended.forEach(f => f()); ok(M.pista() === null, 'acabada la derrota, silencio');
M.parar(); ok(!M.activa && M.pista() === 'mapa', 'al salir de la batalla vuelve el tema de la pantalla');
M.off(); ok(M.pista() === null, 'con «Música» apagada no suena nada'); M.on(); ok(M.pista() === 'mapa', 'al encenderla vuelve el tema');
ctx.state = 'suspended'; M.tema('ciudad'); ok(M.pista() === null, 'con el audio dormido (sin toque o pestaña oculta) no suena nada'); ctx.state = 'running'; M.tema('ciudad'); ok(M.pista() === 'ciudad', 'al despertar suena el tema');
M.iniciar(); M.final('victoria'); ok(M.pista() === 'victoria' && el('victoria').loop === false, 'al ganar suena victoria.mp3'); M.parar();
M.tema(null); ok(M.pista() === null, 'M.tema(null) quita el tema');
if (fallos.length) { console.log('\nFALLAN ' + fallos.length); process.exit(1); } else { console.log('\nTodo bien'); process.exit(0); }
