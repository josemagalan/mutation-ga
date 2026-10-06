/*
 * Catálogo de representaciones y operadores de mutación.
 * Un operador con `ready: true` necesita dos ficheros con su mismo id:
 *   js/operators/<id>.js  (lógica y traza)   y   js/content/<id>.js  (contenido docente)
 * Los demás aparecen en la pantalla inicial como «próximamente».
 */
(function (root) {
  'use strict';

  const representations = [
    {
      id: 'binary',
      name: { es: 'Binaria', en: 'Binary' },
      desc: {
        es: 'Cada gen es un bit (0 o 1). La mutación clásica invierte cada bit con una probabilidad pequeña, independiente en cada posición.',
        en: 'Each gene is a bit (0 or 1). Classic mutation flips each bit with a small probability, independently at every position.',
      },
      sample: ['1', '0', '1', '1', '0', '0', '1', '0'],
      operators: [
        {
          id: 'bit-flip',
          ready: true,
          name: { es: 'Inversión de bits', en: 'Bit-flip mutation' },
          summary: { es: 'Cada bit se invierte, por separado, con probabilidad pm.', en: 'Each bit is flipped, independently, with probability pm.' },
          subtitle: {
            es: 'Mutación por inversión de bits: cada posición se sortea y, con probabilidad pm, su bit cambia',
            en: 'Bit-flip mutation: every position is drawn and, with probability pm, its bit changes',
          },
        },
        {
          id: 'one-bit',
          ready: true,
          name: { es: 'Mutación de un bit', en: 'Single-bit mutation' },
          summary: { es: 'Se elige una posición al azar y se invierte solo ese bit.', en: 'One position is chosen at random and only that bit is flipped.' },
          subtitle: {
            es: 'Mutación de un bit: exactamente un gen cambia, en una posición elegida al azar',
            en: 'Single-bit mutation: exactly one gene changes, at a randomly chosen position',
          },
        },
      ],
    },
    {
      id: 'integer',
      name: { es: 'Entera', en: 'Integer' },
      desc: {
        es: 'Cada gen es un número entero dentro de un rango (aquí, de 0 a 9). Según el problema, los valores pueden ser categorías sin orden o cantidades ordenadas, y eso decide qué mutación tiene sentido.',
        en: 'Each gene is an integer within a range (here, 0 to 9). Depending on the problem, values may be unordered categories or ordered quantities, and that decides which mutation makes sense.',
      },
      sample: ['3', '7', '1', '4', '6'],
      operators: [
        {
          id: 'random-resetting',
          ready: true,
          subtitle: {
            es: 'Reinicio aleatorio: con probabilidad pm, el gen toma un valor cualquiera del rango',
            en: 'Random resetting: with probability pm, the gene takes any value in the range',
          },
          name: { es: 'Reinicio aleatorio', en: 'Random resetting' },
          summary: { es: 'Con probabilidad pm, el gen toma un valor cualquiera del rango.', en: 'With probability pm, the gene takes any value in the range.' },
        },
        {
          id: 'creep',
          ready: true,
          subtitle: {
            es: 'Mutación por deslizamiento: con probabilidad pm, el gen sube o baja un paso pequeño',
            en: 'Creep mutation: with probability pm, the gene moves up or down by a small step',
          },
          name: { es: 'Mutación por deslizamiento', en: 'Creep mutation' },
          summary: { es: 'Con probabilidad pm, el gen sube o baja un paso pequeño.', en: 'With probability pm, the gene moves up or down by a small step.' },
        },
      ],
    },
    {
      id: 'real',
      name: { es: 'Real', en: 'Real-valued' },
      desc: {
        es: 'Cada gen es un número real dentro de unos límites (aquí, de 0 a 10). La mutación suma una perturbación, pequeña casi siempre, o reinicia el gen dentro de su intervalo.',
        en: 'Each gene is a real number within bounds (here, 0 to 10). Mutation adds a perturbation, usually small, or resets the gene within its interval.',
      },
      sample: ['4.2', '1.7', '8.5', '2.1'],
      operators: [
        {
          id: 'uniform-real',
          ready: true,
          subtitle: {
            es: 'Mutación uniforme: con probabilidad pm, el gen se sustituye por un valor al azar de su intervalo',
            en: 'Uniform mutation: with probability pm, the gene is replaced by a random value from its interval',
          },
          name: { es: 'Mutación uniforme', en: 'Uniform mutation' },
          summary: { es: 'El gen se sustituye por un valor al azar dentro de sus límites.', en: 'The gene is replaced by a random value within its bounds.' },
        },
        {
          id: 'non-uniform',
          ready: true,
          subtitle: {
            es: 'Mutación no uniforme: el salto se estrecha a medida que avanza la búsqueda',
            en: 'Non-uniform mutation: the jump narrows as the search progresses',
          },
          name: { es: 'Mutación no uniforme', en: 'Non-uniform mutation' },
          summary: { es: 'El salto se va reduciendo a medida que avanzan las generaciones.', en: 'The jump shrinks as the generations go by.' },
        },
        {
          id: 'gaussian',
          ready: true,
          subtitle: {
            es: 'Mutación gaussiana: al gen se le suma un ruido normal de media 0 y desviación σ',
            en: 'Gaussian mutation: normal noise with mean 0 and standard deviation σ is added to the gene',
          },
          name: { es: 'Mutación gaussiana', en: 'Gaussian mutation' },
          summary: { es: 'Se suma un ruido normal de media 0 y desviación σ.', en: 'Normal noise with mean 0 and standard deviation σ is added.' },
        },
        {
          id: 'polynomial',
          ready: true,
          subtitle: {
            es: 'Mutación polinómica: perturbación acotada que se concentra cerca del padre según η',
            en: 'Polynomial mutation: a bounded perturbation that concentrates near the parent depending on η',
          },
          name: { es: 'Mutación polinómica', en: 'Polynomial mutation' },
          summary: { es: 'Perturbación con distribución polinómica; η_m controla su tamaño.', en: 'Perturbation with a polynomial distribution; η_m controls its size.' },
        },
      ],
    },
    {
      id: 'permutation',
      name: { es: 'Permutacional', en: 'Permutation' },
      desc: {
        es: 'El cromosoma es una ordenación de n elementos, sin repetidos. Mutar no puede cambiar valores: solo recolocarlos, para que el mutante siga siendo una permutación.',
        en: 'The chromosome is an ordering of n elements with no repeats. Mutation cannot change values, only move them, so that the mutant is still a permutation.',
      },
      sample: ['3', '1', '4', '2', '5'],
      operators: [
        {
          id: 'reset-perm',
          ready: true,
          subtitle: {
            es: 'Qué ocurre si se aplica a una permutación la mutación de reinicio aleatorio de los enteros',
            en: 'What happens when the random-resetting mutation for integers is applied to a permutation',
          },
          name: { es: 'Contraejemplo: reinicio aleatorio', en: 'Counterexample: random resetting' },
          summary: { es: 'Por qué hacen falta operadores específicos: aparecen genes repetidos.', en: 'Why specific operators are needed: genes get repeated.' },
        },
        {
          id: 'swap',
          ready: true,
          subtitle: {
            es: 'Mutación por intercambio: dos genes elegidos al azar se intercambian las posiciones',
            en: 'Swap mutation: two randomly chosen genes swap positions',
          },
          name: { es: 'Mutación por intercambio', en: 'Swap mutation' },
          summary: { es: 'Dos genes elegidos al azar intercambian sus posiciones.', en: 'Two randomly chosen genes swap positions.' },
        },
        {
          id: 'insert',
          ready: true,
          subtitle: {
            es: 'Mutación por inserción: un gen se mueve a otra posición y los intermedios se desplazan',
            en: 'Insert mutation: a gene moves to another position and the ones in between shift',
          },
          name: { es: 'Mutación por inserción', en: 'Insert mutation' },
          summary: { es: 'Un gen se saca de su sitio y se inserta junto a otro.', en: 'A gene is taken out and inserted next to another.' },
        },
        {
          id: 'inversion',
          ready: true,
          subtitle: {
            es: 'Mutación por inversión: un tramo se invierte; en una ruta es el movimiento 2-opt',
            en: 'Inversion mutation: a stretch is reversed; on a route it is the 2-opt move',
          },
          name: { es: 'Mutación por inversión', en: 'Inversion mutation' },
          summary: { es: 'Se invierte el orden de un tramo del cromosoma.', en: 'The order of a stretch of the chromosome is reversed.' },
        },
        {
          id: 'scramble',
          ready: true,
          subtitle: {
            es: 'Mutación por mezcla: los genes de un tramo se reordenan al azar',
            en: 'Scramble mutation: the genes of a stretch are randomly reordered',
          },
          name: { es: 'Mutación por mezcla', en: 'Scramble mutation' },
          summary: { es: 'Los genes de un tramo se reordenan al azar.', en: 'The genes of a stretch are randomly reordered.' },
        },
      ],
    },
    {
      id: 'tree',
      name: { es: 'Árbol', en: 'Tree' },
      desc: {
        es: 'En programación genética el cromosoma es un árbol de funciones y terminales, como una expresión. Mutar es cambiar un nodo o sustituir un subárbol entero.',
        en: 'In genetic programming the chromosome is a tree of functions and terminals, like an expression. Mutating means changing a node or replacing a whole subtree.',
      },
      sample: ['+', '×', 'x', '2', 'y'],
      operators: [
        {
          id: 'subtree',
          ready: false,
          name: { es: 'Mutación de subárbol', en: 'Subtree mutation' },
          summary: { es: 'Un subárbol se sustituye por otro generado al azar.', en: 'A subtree is replaced by a randomly generated one.' },
        },
        {
          id: 'point-gp',
          ready: false,
          name: { es: 'Mutación puntual', en: 'Point mutation' },
          summary: { es: 'Un nodo cambia por otro del mismo número de argumentos.', en: 'A node changes into another with the same number of arguments.' },
        },
      ],
    },
  ];

  const byId = {};
  representations.forEach((rep) => rep.operators.forEach((op) => { byId[op.id] = Object.assign({ representation: rep.id }, op); }));

  function getOperator(id) { return byId[id] || null; }
  function getRepresentation(id) { return representations.find((r) => r.id === id) || null; }
  function isReady(id) { return !!(byId[id] && byId[id].ready); }

  const api = { representations, getOperator, getRepresentation, isReady };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).registry = api;
})(typeof self !== 'undefined' ? self : this);
