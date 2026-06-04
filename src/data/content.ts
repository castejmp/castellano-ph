/** Packs escalonados. Cada uno contiene al anterior. */
export interface Pack {
  id: string;
  tier: string;
  name: string;
  tagline: string;
  price?: string;
  includes: string[];
  featured?: boolean;
}

export const PACKS: Pack[] = [
  {
    id: 'esencial',
    tier: 'Pack I',
    name: 'Esencial',
    tagline: 'Capturar y establecer la identidad del evento.',
    includes: [
      'Identidad del evento: logo/marca, paleta cromática y familia tipográfica.',
      'Invitaciones virtuales.',
      'Fotografía: cobertura completa + galería web + carrusel con las mejores fotos y clips cortos.',
      'Video: cobertura en formato Reel o Racconto.',
    ],
  },
  {
    id: 'avanzado',
    tier: 'Pack II',
    name: 'Avanzado',
    tagline: 'Todo el Esencial + multimedia ampliada.',
    includes: [
      'Todo lo del Pack I.',
      'Sesión de fotos en estudio o aire libre (incluye pre-producción).',
      'Drone: servicio aéreo estabilizado o FPV.',
      'Visuales: piezas gráficas para pantallas (entrada, loops, momentos).',
      'Web personalizada con sistema de confirmación de asistentes (RSVP).',
    ],
  },
  {
    id: 'total',
    tier: 'Pack III',
    name: 'Experiencia Total',
    tagline: 'Todo lo anterior + lo premium. A medida.',
    price: 'Costo a definir',
    featured: true,
    includes: [
      'Todo lo del Pack I y II.',
      'Identidad Full: manual completo de marca.',
      'Box de recuerdos: caja con fotolibro, postales, pendrive y sorpresas.',
      'Fotos en vivo: entrega digital inmediata para invitados durante el evento.',
      'Inmersivo: material experimental — mapping, realidad virtual y aumentada (no incluye equipamiento).',
    ],
  },
];

/** Pasos del proceso. */
export interface ProcessStep {
  n: string;
  title: string;
  desc: string;
}

export const PROCESS: ProcessStep[] = [
  { n: '01', title: 'Briefing', desc: 'Entendemos tu evento, tu gente y la sensación que buscás.' },
  { n: '02', title: 'Identidad', desc: 'Diseñamos la marca del evento: logo, paleta, tipografía y piezas.' },
  { n: '03', title: 'Producción', desc: 'Planificamos captura, visuales, web y experiencia inmersiva.' },
  { n: '04', title: 'Evento en vivo', desc: 'Foto, video, drone, fotos en vivo y pulse.show en tiempo real.' },
  { n: '05', title: 'Entrega', desc: 'Galería web, edición final y box físico de recuerdos.' },
];
