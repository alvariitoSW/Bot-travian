/* AQVILA — PL1 Politeia: datos del año político (sin lógica). Atenas, 594 a.C.
   Etiquetas: «histórico», «probable», «licencia de juego». Fuentes en cada pieza. Ver gobierno/specs/PL1.md. */
(function (root) {
  'use strict';
  const FUENTE_COMARCAS = 'Heródoto 1.59; Aristóteles, Const. Aten. 13 (las tres comarcas son históricas, de algo después)';
  const DATOS = {
    ESTACIONES: ['primavera', 'verano', 'otoño', 'invierno'],
    ACTOS: ['La agenda', 'Las intrigas', 'El debate', 'Las cuentas'],
    CARACTERES: ['ambicioso', 'astuto', 'piadoso', 'rico'],
    // Coste de cada acción del jugador (además de 1 paso). «favor» = 1 punto de trato con la casa a la que se lo pides.
    COSTES: {
      hablar: { fama: 1 }, favor: { favor: 1 }, pagar: { plata: 30 },
      banquete: { plata: 25 }, rumor: { fama: 1 }, enviado: { fama: 1 }, ofrenda: { plata: 20 },
      discurso: { fama: 1 }, convencer: { plata: 20 }, comprar: { plata: 40 },
      pagar_jueces: { plata: 30 }, dar_cuentas: { fama: 1 }, ceder_cargo: { fama: 1 }, ostracismo: { fama: 1 }
    },
    ACCIONES: {
      hablar: 'Hablar en el Consejo', favor: 'Pedir un favor', pagar: 'Pagar apoyo',
      banquete: 'Dar un banquete', rumor: 'Soltar un rumor', enviado: 'Mandar un enviado al puerto', ofrenda: 'Hacer una ofrenda en el santuario',
      discurso: 'Dar un discurso', convencer: 'Convencer a una casa', comprar: 'Comprar piedras de voto',
      pagar_jueces: 'Pagar a los jueces', dar_cuentas: 'Dar cuentas', ceder_cargo: 'Ceder el cargo', ostracismo: 'Pedir el ostracismo'
    },
    LUGARES: { hablar: 'Consejo', favor: 'Consejo', pagar: 'Consejo', banquete: 'casa', rumor: 'ágora', enviado: 'puerto', ofrenda: 'santuario',
      discurso: 'asamblea', convencer: 'asamblea', comprar: 'asamblea', pagar_jueces: 'tribunal', dar_cuentas: 'tribunal', ceder_cargo: 'tribunal', ostracismo: 'ágora' },
    // Acciones que no son de la época tal cual
    HISTORIA: { ostracismo: { etiqueta: 'licencia de juego', fuente: 'Lo introduce Clístenes hacia 508 a.C. (Arist., Const. Aten. 22); aquí, adelantado para poder jugar' } },
    polis: {
      atenas: {
        nombre: 'Atenas', anio: -594, etiqueta: 'histórico', fuente: 'Aristóteles, Const. Aten. 5–12 (Solón, arconte en 594/3)',
        // influencia = votos; plata y fama de partida (la semilla varía ±20 % plata e influencia)
        casas: [
          { id: 'caballo', nombre: 'Caballo', emblema: 'Caballo', comarca: 'Llanura', lema: 'La tierra recuerda', grieta: 'una maldición vieja sobre la casa',
            influencia: 4, plata: 110, fama: 4, etiqueta: 'licencia de juego', fuente: 'Inspirada en la maldición de los Alcmeónidas por Cilón (Plutarco, Solón 12; Heródoto 5.71). ' + FUENTE_COMARCAS },
          { id: 'delfin', nombre: 'Delfín', emblema: 'Delfín', comarca: 'Costa', lema: 'El mar no pregunta apellidos', grieta: 'una deuda con acreedores de fuera',
            influencia: 3, plata: 140, fama: 2, etiqueta: 'licencia de juego', fuente: 'Casa de mercaderes de la costa. ' + FUENTE_COMARCAS },
          { id: 'carnero', nombre: 'Carnero', emblema: 'Carnero', comarca: 'Monte', lema: 'Somos más', grieta: 'su jefe no sabe leer, pero su hija sí',
            influencia: 3, plata: 60, fama: 2, etiqueta: 'licencia de juego', fuente: 'Casa de pobres del monte. ' + FUENTE_COMARCAS },
          { id: 'gallo', nombre: 'Gallo', emblema: 'Gallo', comarca: 'Llanura', lema: 'Primero en la fila', grieta: 'un juramento de sangre que no puede romper',
            influencia: 3, plata: 80, fama: 3, etiqueta: 'licencia de juego', fuente: 'Casa de hoplitas. Los hoplitas como clase: Arist., Const. Aten. 7.' },
          { id: 'tuya', nombre: 'Lechuza', emblema: 'Lechuza', comarca: 'Ciudad', lema: 'Ver de noche', grieta: 'tus propios atajos',
            influencia: 3, plata: 120, fama: 4, etiqueta: 'licencia de juego', fuente: 'La casa del jugador.' }
        ],
        personas: [
          { id: 'megacles', nombre: 'Megacles', casa: 'caballo', etiqueta: 'probable', fuente: 'Nombre repetido en la familia alcmeónida (Heródoto 6.125)' },
          { id: 'timonax', nombre: 'Timónax', casa: 'caballo', etiqueta: 'licencia de juego', fuente: 'Inventado' },
          { id: 'hiponico', nombre: 'Hipónico', casa: 'delfin', etiqueta: 'licencia de juego', fuente: 'Inventado' },
          { id: 'nausicrates', nombre: 'Nausícrates', casa: 'delfin', etiqueta: 'licencia de juego', fuente: 'Inventado' },
          { id: 'lico', nombre: 'Lico', casa: 'carnero', etiqueta: 'licencia de juego', fuente: 'Inventado: jefe de la casa' },
          { id: 'clito', nombre: 'Clito', casa: 'carnero', etiqueta: 'licencia de juego', fuente: 'Inventada: la hija que sí sabe leer' },
          { id: 'ariston', nombre: 'Aristón', casa: 'gallo', etiqueta: 'licencia de juego', fuente: 'Inventado' },
          { id: 'solon', nombre: 'Solón', casa: null, etiqueta: 'histórico', fuente: 'Arconte en 594/3 y árbitro: Aristóteles, Const. Aten. 5–12; Plutarco, Solón' }
        ],
        // pro / contra: casas a favor o en contra. pueblo: lo que quiere el pueblo. Cada resultado perjudica al menos a una casa.
        asuntos: [
          { id: 'deudas', nombre: 'Perdonar las deudas', pista: 3, pro: ['carnero', 'gallo'], contra: ['caballo', 'delfin'], pueblo: 'si',
            efectos: { si: { fama: 1, discordia: -1, trato: { carnero: 1 }, perjudica: ['caballo'] }, no: { discordia: 1, trato: { carnero: -1 }, perjudica: ['carnero'] } },
            etiqueta: 'histórico', fuente: 'Seisáchtheia: Aristóteles, Const. Aten. 6; Plutarco, Solón 15' },
          { id: 'esclavitud', nombre: 'Prohibir la esclavitud por deudas', pista: 3, pro: ['carnero', 'gallo'], contra: ['caballo'], pueblo: 'si',
            efectos: { si: { fama: 1, trato: { carnero: 1, gallo: 1 }, perjudica: ['caballo'] }, no: { discordia: 1, perjudica: ['carnero'] } },
            etiqueta: 'histórico', fuente: 'Aristóteles, Const. Aten. 6; Plutarco, Solón 15' },
          { id: 'salamina', nombre: 'Recuperar Salamina de Mégara', pista: 3, pro: ['gallo', 'caballo'], contra: ['delfin'], pueblo: 'si',
            efectos: { si: { plata: -20, fama: 2, trato: { gallo: 1 }, perjudica: ['delfin'] }, no: { fama: -1, trato: { gallo: -1 }, perjudica: ['gallo'] } },
            etiqueta: 'licencia de juego', fuente: 'Plutarco, Solón 8–10: Solón la recupera antes de su arcontado; aquí se juega en 594' },
          { id: 'aceite', nombre: 'Solo se exporta aceite', pista: 3, pro: ['caballo'], contra: ['delfin', 'carnero'], pueblo: 'no',
            efectos: { si: { plata: 20, trato: { caballo: 1 }, perjudica: ['delfin'] }, no: { trato: { delfin: 1 }, perjudica: ['caballo'] } },
            etiqueta: 'histórico', fuente: 'Plutarco, Solón 24' },
          { id: 'pozos', nombre: 'Pozos públicos y reparto de agua', pista: 3, pro: ['carnero', 'gallo'], contra: ['caballo'], pueblo: 'si',
            efectos: { si: { fama: 1, trato: { carnero: 1 }, perjudica: ['caballo'] }, no: { discordia: 1, perjudica: ['carnero'] } },
            etiqueta: 'histórico', fuente: 'Plutarco, Solón 23' },
          { id: 'censo', nombre: 'Clases por cosecha (censo)', pista: 3, pro: ['caballo', 'delfin'], contra: ['carnero'], pueblo: 'no',
            efectos: { si: { plata: 20, trato: { delfin: 1 }, perjudica: ['carnero'] }, no: { discordia: 1, trato: { carnero: 1 }, perjudica: ['caballo'] } },
            etiqueta: 'histórico', fuente: 'Aristóteles, Const. Aten. 7' },
          { id: 'apelacion', nombre: 'Apelar al tribunal del pueblo', pista: 3, pro: ['carnero', 'delfin'], contra: ['caballo'], pueblo: 'si',
            efectos: { si: { fama: 1, discordia: -1, trato: { carnero: 1 }, perjudica: ['caballo'] }, no: { trato: { caballo: 1 }, perjudica: ['carnero'] } },
            etiqueta: 'histórico', fuente: 'Aristóteles, Const. Aten. 9' },
          { id: 'entierros', nombre: 'Ley contra el lujo en los entierros', pista: 3, pro: ['carnero', 'gallo'], contra: ['caballo', 'delfin'], pueblo: 'si',
            efectos: { si: { plata: -10, fama: 1, trato: { carnero: 1 }, perjudica: ['caballo'] }, no: { plata: 10, perjudica: ['carnero'] } },
            etiqueta: 'histórico', fuente: 'Plutarco, Solón 21' }
        ]
      }
    }
  };
  if (typeof module !== 'undefined') module.exports = DATOS; else root.POLITEIA_DATOS = DATOS;
})(typeof self !== 'undefined' ? self : globalThis);
