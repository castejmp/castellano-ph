/**
 * CONFIG ÚNICO — acá vive todo el contenido editable.
 * Copy de las 9 estaciones, shots de cámara, paletas de los 3 modos,
 * tracks de audio y datos de contacto. Cambiar contenido = tocar solo este archivo.
 */

export const CONFIG = {
  studio: 'CASTELLANO PH',
  tagline: 'Diseñamos soluciones.',
  location: 'Villa María · Argentina',
  whatsapp: 'https://wa.me/5493536563678',
  whatsappLabel: 'WHATSAPP · wa.me/5493536563678',

  // Brand bar — intocable.
  brandBar: ['#f63f2f', '#fe720c', '#feca0d', '#7fc527', '#1f93e0'],

  /* ──────────────────────────────────────────────
   * LAS 9 ESTACIONES — copy de cards.
   * Voz: español argentino, primera persona, frases cortas, cero humo.
   * ────────────────────────────────────────────── */
  stations: [
    {
      id: 'general',
      name: 'PLANO GENERAL',
      kicker: '00 · DESDE ARRIBA',
      body: 'Esto que ves es un evento armado pieza por pieza. La web es la maqueta; el scroll, la cámara. Bajá: cada parada es algo que hacemos de verdad.',
      items: [],
    },
    {
      id: 'diseno',
      name: 'DISEÑO',
      kicker: '01 · LA MESA DE TRABAJO',
      body: 'Todo evento empieza en papel. Acá definimos la identidad: paleta, tipografía, sistema. Lo que está sobre esta mesa después aparece en cada rincón de la fiesta.',
      items: ['Identidad del evento', 'Invitaciones y piezas', 'Sistema gráfico completo'],
    },
    {
      id: 'fotografia',
      name: 'FOTOGRAFÍA',
      kicker: '02 · EL SET',
      body: '¿Viste el flash? Así de rápido pasa el momento. Set propio armado en el salón, luz medida y un ojo entrenado para lo que no se repite.',
      items: ['Cobertura completa', 'Set de fotos en vivo', 'Selección editada en 72 h'],
    },
    {
      id: 'video',
      name: 'VIDEO',
      kicker: '03 · ENTRE LA GENTE',
      body: 'Filmamos a la altura de los cuerpos, desde adentro de la pista. La fiesta no se mira desde afuera: se camina. Eso se nota en el material.',
      items: ['Film del evento', 'Highlight de 90 segundos', 'Plano secuencia'],
    },
    {
      id: 'visuales',
      name: 'VISUALES',
      kicker: '04 · PULSE.SHOW',
      body: 'La pantalla escucha la música y dibuja en vivo. Nada enlatado: cada golpe de bajo genera el contenido que estás viendo ahora mismo. Esto es pulse.show.',
      items: ['Contenido generativo', 'Audio-reactivo real', 'Operación en vivo'],
    },
    {
      id: 'edicion',
      name: 'EDICIÓN',
      kicker: '05 · POSTPRODUCCIÓN',
      body: 'El material sale editado mientras la fiesta sigue. Los invitados se van con fotos en la mano y el reel está listo antes del brindis.',
      items: ['Edición en vivo', 'Reel la misma noche', 'Copias impresas al instante'],
    },
    {
      id: 'drone',
      name: 'DRONE',
      kicker: '06 · DESDE EL AIRE',
      body: 'Una mirada desde arriba que no interrumpe nada: vuela, mira y vuelve. La toma que abre y cierra tu video sale de acá.',
      items: ['Tomas aéreas del salón', 'Apertura y cierre del film', 'Vuelo coordinado con el show'],
    },
    {
      id: 'inmersivo',
      name: 'INMERSIVO',
      kicker: '07 · EL ESPACIO RESPIRA',
      body: 'El salón entero se vuelve pantalla. Mapping sobre superficies, luz y música respirando juntas. El espacio deja de ser fondo y pasa a ser parte del show.',
      items: ['Mapping de superficies', 'Diseño lumínico', 'Show sincronizado con la música'],
    },
    {
      id: 'finalmente',
      name: 'FINALMENTE',
      kicker: '08 · TODO JUNTO',
      body: 'Esto fue una demo corriendo en tu navegador. Ahora imaginalo en tu salón, con tu gente. Contanos qué celebrás y lo diseñamos.',
      items: [],
      cta: 'HABLEMOS',
    },
  ],

  /* ──────────────────────────────────────────────
   * SHOTS DE CÁMARA — uno por estación.
   * pos/look en coordenadas del salón (losa 64×44, piso y=0).
   * fov amplio = plano abierto · fov corto = tele.
   * track:'drone' → el lookAt persigue al drone.
   * ────────────────────────────────────────────── */
  // Estilo isométrico de diorama: teles largas que aplanan la perspectiva.
  // Apertura y cierre desde el ángulo clásico de maqueta (45° / ~35°).
  shots: [
    { pos: [45, 36, 45], look: [0, 0, 0], fov: 30 },           // 0 PLANO GENERAL (iso)
    { pos: [-14.5, 5.5, 13.5], look: [-22.5, 1.0, 5.5], fov: 24 },  // 1 DISEÑO: el que dibuja
    { pos: [13.5, 6.2, -4.2], look: [22.0, 1.4, -12.6], fov: 26 },  // 2 FOTOGRAFÍA: tras la cámara
    { pos: [-6.5, 3.0, 1.0], look: [-2.5, 1.6, -6.0], fov: 44 },    // 3 VIDEO: cámara + trípode
    { pos: [2.5, 3.6, -10.5], look: [2.0, 2.5, -19.5], fov: 38 },   // 4 VISUALES: VJ, compu y pantallas
    { pos: [-14.8, 5.3, -5.8], look: [-22.4, 1.3, -12.9], fov: 24 },// 5 EDICIÓN: sentado en la compu
    { pos: [17, 14.5, 15], look: [0, 9, -4], fov: 32, track: 'drone' }, // 6 DRONE
    { pos: [12, 4.5, 7], look: [-3, 4, -16], fov: 50 },         // 7 INMERSIVO
    { pos: [-45, 36, 45], look: [0, 1, 0], fov: 30 },           // 8 FINALMENTE (iso opuesto)
  ],

  /* ──────────────────────────────────────────────
   * MODOS — puestas de luz y sonido sobre el mismo salón.
   * trackUrl: URL de streaming opcional; si falla o es null,
   * suena el synth procedural definido en music.
   * ────────────────────────────────────────────── */
  modeOrder: ['quince', 'boda', 'corporativo'],
  modes: {
    quince: {
      label: 'QUINCE',
      accent: '#ff2b2b',
      trackUrl: null,
      theme: {
        bg: '#070104', fog: '#12030a', fogDensity: 0.010,
        hemiSky: '#52121f', hemiGround: '#08020a', hemiI: 0.55,
        key: '#ff2b2b', keyI: 900, wash: '#ff3355', washI: 500,
        practical: '#ff7a45', practicalI: 60,
        led: ['#ff2b2b', '#5e0716', '#ffd166'],
        particles: '#ff5a6e', particleOpacity: 0.65,
        exposure: 1.15, crowdEnergy: 1.0,
      },
      music: {
        bpm: 128, swing: 0, root: 33, // A1 — techno oscuro
        kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        hat:  [0,0,2,0, 0,0,2,0, 0,0,2,0, 0,0,2,1],
        rim:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        bass: [0,null,0,12, 0,null,0,null, 0,null,3,null, 0,null,12,null],
        bassType: 'sawtooth', bassCut: 420, bassGain: 0.5,
        chord: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        chordEvery: 2, chordNotes: [12, 15, 19], chordLen: 0.4, chordSend: 0.5,
        chordType: 'sawtooth', chordCut: 900, kickTone: 150,
      },
    },
    boda: {
      label: 'BODA',
      accent: '#9caf88',
      trackUrl: null,
      theme: {
        bg: '#d9d2c0', fog: '#e3dccb', fogDensity: 0.007,
        hemiSky: '#fff4dd', hemiGround: '#8fa080', hemiI: 1.5,
        key: '#ffe2b0', keyI: 1400, wash: '#f7ecd9', washI: 700,
        practical: '#ffd9a0', practicalI: 40,
        led: ['#9caf88', '#f4ead8', '#e0a868'],
        particles: '#fff3d8', particleOpacity: 0.5,
        exposure: 1.05, crowdEnergy: 0.55,
      },
      music: {
        bpm: 118, swing: 0.14, root: 38, // D2 — deep house cálido
        kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        hat:  [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,2,1],
        rim:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        bass: [0,null,null,0, null,null,7,null, 0,null,null,5, null,null,3,null],
        bassType: 'sine', bassCut: 700, bassGain: 0.55,
        chord: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        chordEvery: 1, chordNotes: [12, 16, 19, 23], chordLen: 0.22, chordSend: 0.25,
        chordType: 'triangle', chordCut: 1600, kickTone: 120,
      },
    },
    corporativo: {
      label: 'CORPORATIVO',
      accent: '#1f93e0',
      trackUrl: null,
      theme: {
        bg: '#020609', fog: '#04101c', fogDensity: 0.009,
        hemiSky: '#0e3a5c', hemiGround: '#020508', hemiI: 0.7,
        key: '#1f93e0', keyI: 1000, wash: '#2fc4ff', washI: 450,
        practical: '#9adcff', practicalI: 35,
        led: ['#1f93e0', '#062742', '#7fdcff'],
        particles: '#8fd4ff', particleOpacity: 0.45,
        exposure: 1.08, crowdEnergy: 0.4,
      },
      music: {
        bpm: 96, swing: 0.08, root: 36, // C2 — dub lounge
        kick: [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
        hat:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        rim:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        bass: [0,null,null,null, null,null,0,null, 3,null,null,null, 5,null,null,null],
        bassType: 'sine', bassCut: 380, bassGain: 0.6,
        chord: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        chordEvery: 1, chordNotes: [12, 15, 19], chordLen: 0.12, chordSend: 0.85,
        chordType: 'square', chordCut: 1100, kickTone: 100,
      },
    },
  },
};
