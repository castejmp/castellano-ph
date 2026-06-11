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
  instagram: 'https://instagram.com/castellano.ph',
  instagramLabel: 'IG @CASTELLANO.PH',

  // Brand bar — intocable.
  brandBar: ['#f63f2f', '#fe720c', '#feca0d', '#7fc527', '#1f93e0'],

  // Placa final centrada (estación 8), espejo de la bienvenida.
  finale: {
    kicker: 'FINALMENTE',
    pre: 'ESTAMOS',
    title: 'LISTOS PARA EMPEZAR',
    verMas: 'VER MÁS',
  },

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
      kicker: '01 · LA IMAGEN DEL EVENTO',
      body: 'La imagen del evento se construye junto a los protagonistas y el planner: nace en el save the date y las invitaciones, y se ejecuta en cada pieza hasta el final de la noche.',
      items: ['Save the date', 'Invitaciones', 'Identidad', 'Merchandising', 'Piezas gráficas'],
    },
    {
      id: 'fotografia',
      name: 'FOTOGRAFÍA',
      kicker: '02 · DOS CÁMARAS',
      body: 'Dos cámaras, todos los ángulos, ningún momento afuera. Te entregamos una galería digital completa con todas las fotos editadas — 10 horas de cobertura.',
      items: ['2 cámaras', 'Galería digital', 'Fotos editadas', '10 hs'],
    },
    {
      id: 'video',
      name: 'VIDEO',
      kicker: '03 · CONTENIDO FINAL',
      body: 'Filmamos pensando en el contenido final: reels que dan ganas de compartir, con un estilo elegido para que coincida con la identidad de tu evento.',
      items: ['Reels', 'Dirección', 'Estilo a medida'],
    },
    {
      id: 'visuales',
      name: 'VISUALES ▲',
      kicker: '04 · PANTALLAS LED',
      body: 'Las pantallas acompañan el diseño del evento sin perder nunca el hilo conductor: la entrada, cada momento clave y los loops que los unen.',
      items: ['Entrada', 'Momentos', 'Loops', 'Pantallas LED'],
    },
    {
      id: 'edicion',
      name: 'EDICIÓN',
      kicker: '05 · LA ISLA DE EDICIÓN',
      body: 'La isla de edición trabaja durante toda la noche: hay material listo antes de que termine la fiesta — no un mes después.',
      items: ['Same-night', 'Selección', 'Color', 'Export'],
    },
    {
      id: 'drone',
      name: 'DRONE',
      kicker: '06 · DESDE EL AIRE',
      body: 'Si el lugar y la noche lo ameritan, nuestros drones están listos para despegar — y sumar el plano que nadie más tiene.',
      items: ['FPV', 'Aéreas', 'Interiores'],
    },
    {
      id: 'inmersivo',
      name: 'INMERSIVO ▲',
      kicker: '07 · EXPERIENCIAS COLECTIVAS',
      body: 'Experiencias audiovisuales colectivas: conectamos la tecnología con los invitados — pulseras, pantallas, sonido — para sorprenderlos en momentos únicos de la fiesta.',
      items: ['Pulseras NFC', 'Pantallas reactivas', 'Momentos'],
    },
    {
      id: 'finalmente',
      name: 'FINALMENTE',
      kicker: '01:30 — FINALMENTE',
      body: 'Lo que recorriste es un mapa — ya sabés cómo llegar.',
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
  // Estilo isométrico de diorama en los generales; en las estaciones de
  // operador la cámara mira hacia el norte: el protagonista en foco y la
  // pantalla LED de fondo (desenfocada en desktop por el DoF).
  shots: [
    { pos: [45, 36, 45], look: [0, 0, 0], fov: 30 },                // 0 PLANO GENERAL (iso)
    // Players a media distancia: de cerca la compresión de malla se nota.
    { pos: [-12.6, 8.6, 22.6], look: [-14.5, 0.95, 18.3], fov: 30 }, // 1 DISEÑO: cenital sobre la mesa de trabajo
    { pos: [2.8, 2.4, -8.2], look: [7.5, 1.4, -1.6], fov: 30 },     // 2 FOTOGRAFÍA: de FRENTE a los fotógrafos, desde la pista
    { pos: [-14.6, 2.7, -1.7], look: [-10.4, 1.3, -6.3], fov: 32 }, // 3 VIDEO: borde oeste, pista y LED detrás
    { pos: [4.9, 3.3, -8.8], look: [4.6, 1.8, -18.5], fov: 32 },    // 4 VISUALES: el VJ y la pantalla encima
    { pos: [17.3, 3.0, 27.6], look: [14.5, 1.2, 20.2], fov: 30 },   // 5 EDICIÓN: rincón sureste, contra la pared
    { pos: [17, 14.5, 15], look: [0, 9, -4], fov: 55 },             // 6 DRONE → POV del drone (path.js)
    { pos: [12, 4.5, 7], look: [-3, 4, -16], fov: 50 },             // 7 INMERSIVO
    { pos: [-45, 36, 45], look: [0, 1, 0], fov: 30 },               // 8 FINALMENTE (iso opuesto)
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
        // Ambiente neutro oscuro; el ROJO vive en key/wash/LED/beams.
        bg: '#070104', fog: '#0b0407', fogDensity: 0.010,
        hemiSky: '#3d2a31', hemiGround: '#0c0709', hemiI: 0.75,
        key: '#ff2330', keyI: 1000, wash: '#e0334e', washI: 420,
        practical: '#ffac63', practicalI: 85, // contrapunto dorado
        led: ['#ff2b2b', '#47060e', '#ffe9c4'], // highlight casi blanco
        particles: '#ff7a5e', particleOpacity: 0.4,
        tint: '#aaa4ad', exposure: 1.12, crowdEnergy: 1.0,
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
      accent: '#e0a84f',
      trackUrl: null,
      theme: {
        // Marfil luminoso con acentos ORO/ÁMBAR (chau verde oliva).
        bg: '#ece5d4', fog: '#f0e9d8', fogDensity: 0.006,
        hemiSky: '#fff8ea', hemiGround: '#b09a72', hemiI: 1.75,
        key: '#ffe3ae', keyI: 1500, wash: '#ffedce', washI: 750,
        practical: '#ffc06a', practicalI: 60,
        // [principal, BASE OSCURA, highlight] — oro, ámbar profundo, marfil.
        led: ['#e8b558', '#4a3414', '#fff3da'],
        particles: '#ffe9b8', particleOpacity: 0.4,
        tint: '#fff2e2', exposure: 1.08, crowdEnergy: 0.55,
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
        // Azul más neutro (nada de cian en el ambiente: mata las pieles)
        // + practicals cálidos que devuelven el tono de piel.
        bg: '#020609', fog: '#04080f', fogDensity: 0.008,
        hemiSky: '#36425c', hemiGround: '#0a0d13', hemiI: 0.9,
        key: '#3d8fe0', keyI: 1100, wash: '#7fb4ff', washI: 420,
        practical: '#ffd9a8', practicalI: 72, // contrapunto cálido (pieles)
        led: ['#1f93e0', '#06223c', '#eaf6ff'],
        particles: '#9fd0ff', particleOpacity: 0.4,
        tint: '#a4b2c6', exposure: 1.1, crowdEnergy: 0.4,
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
