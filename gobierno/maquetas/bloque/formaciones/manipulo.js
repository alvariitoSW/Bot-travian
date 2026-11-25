/* FU1 · Formación «manípulo» del motor único de batalla a pie (plan: gobierno/estudios/FU0-plan-motor-batalla.md §3).
   Es EXACTAMENTE lo de hoy, con el contrato de las formaciones: la escena le pide a su formación qué órdenes hay, cuál se ilumina,
   cómo lleva el escudo cada hombre en la física y qué dibuja o suena de más. El manípulo no dibuja ni suena nada de más:
   delega todo en las reglas (js/bloque-ia.js) y en la física (fisica.js, guardiaDeSerie).
   Contrato (todas las formaciones; sin pantalla dentro salvo monta y paso):
     crear() → { id, ordenes, objetivo, escenario, muroDelante, util(S), mods(S), guardia(h, S), monta(ctx), paso(dt), alAviso(tipo, d) }
     ordenes      los seis huecos de la barra común (BT1: js/mando-varios.js BARRA), cada uno con su orden o null
     objetivo     texto de arriba al empezar (null = el de siempre)
     escenario    opción de crearCombate (js/bloque-ia.js) o null
     muroDelante  true: en testudo la primera fila lleva el escudo de frente (tropas.js)
     util(S)      la orden que se ilumina (la lee de las reglas; S no la trae, la da ctx.C)
     mods(S)      cambios de velocidad y golpe (null: los de las reglas; hoy los pone js/bloque-ia.js)
     guardia(h, S) cómo lleva el escudo cada hombre tuyo en la física: null | 'muro' | 'alto'
     monta(ctx)   la escena la llama en cada partida nueva: ctx = { THREE, escena, H, C, S, TR, Son, texto(s) }
     paso(dt)     cada fotograma (dt grande al congelar para capturas); alAviso(tipo, d) cada aviso de las reglas */
import { guardiaDeSerie } from '../fisica.js';

export function crear() {
  let ctx = null;
  return {
    id: 'manipulo', ordenes: ['testudo', 'avanzar', 'cargar', 'alto', 'relevo', 'retirada'], objetivo: null, escenario: null, muroDelante: false,
    util: () => (ctx && ctx.C ? ctx.C.ordenUtil() : null),
    mods: () => null,
    guardia: guardiaDeSerie,
    monta(c) { ctx = c; },
    paso() {},
    alAviso() {}
  };
}
