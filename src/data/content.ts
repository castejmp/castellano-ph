import type { ParticleShape } from '../state/ExperienceContext';

/** Disciplinas — la prueba de que no es "solo foto". */
export interface Discipline {
  id: string;
  name: string;
  blurb: string;
  shape: ParticleShape;
}

export const DISCIPLINES: Discipline[] = [
  {
    id: 'foto',
    name: 'Fotografía',
    blurb: 'Cobertura completa y dirección de imagen. Escribir con luz.',
    shape: 'aperture',
  },
  {
    id: 'video',
    name: 'Video',
    blurb: 'Reel y Racconto. Narrativa audiovisual con ritmo cinematográfico.',
    shape: 'film',
  },
  {
    id: 'drone',
    name: 'Drone FPV',
    blurb: 'Aéreas estabilizadas y vuelos FPV inmersivos.',
    shape: 'drone',
  },
  {
    id: 'visuales',
    name: 'Visuales',
    blurb: 'Piezas para pantallas: entradas, loops y momentos destacados.',
    shape: 'grid',
  },
  {
    id: 'web',
    name: 'Web + RSVP',
    blurb: 'Sitio del evento con sistema de confirmación de asistentes.',
    shape: 'web',
  },
  {
    id: 'inmersivo',
    name: 'Inmersivo',
    blurb: 'Mapping, realidad virtual y aumentada. Esculpir luz en el espacio.',
    shape: 'volume',
  },
  {
    id: 'pulse',
    name: 'pulse.show',
    blurb: 'Pulseras NFC, visuales reactivos y luces sincronizadas en vivo.',
    shape: 'wave',
  },
];

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

/** Piezas del portfolio (placeholders editables). */
export interface Work {
  id: string;
  title: string;
  category: 'XV' | 'Casamiento' | 'Comercial' | 'Inmersivo';
  kind: 'foto' | 'video';
  hue: number; // tono base del placeholder (0..360)
}

export const WORKS: Work[] = [
  { id: 'w1', title: 'Mili · XV', category: 'XV', kind: 'video', hue: 168 },
  { id: 'w2', title: 'Lucas & Jor', category: 'Casamiento', kind: 'foto', hue: 24 },
  { id: 'w3', title: 'Bodega Aurora', category: 'Comercial', kind: 'video', hue: 280 },
  { id: 'w4', title: 'pulse.show · Live', category: 'Inmersivo', kind: 'video', hue: 150 },
  { id: 'w5', title: 'Caro · XV', category: 'XV', kind: 'foto', hue: 320 },
  { id: 'w6', title: 'Festival Ñ', category: 'Comercial', kind: 'video', hue: 200 },
  { id: 'w7', title: 'Vale & Tomi', category: 'Casamiento', kind: 'foto', hue: 40 },
  { id: 'w8', title: 'Mapping Catedral', category: 'Inmersivo', kind: 'video', hue: 188 },
];

export const WORK_FILTERS = ['Todos', 'XV', 'Casamiento', 'Comercial', 'Inmersivo'] as const;

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
