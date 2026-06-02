/**
 * Configuración central editable de Castellano PH.
 * Caste: cambiá acá los datos de contacto, links y el color de marca.
 * Todo lo demás del sitio lee desde este archivo.
 */

export const SITE = {
  name: 'Castellano PH',
  monogram: 'C·PH',
  motto: 'Diseñamos soluciones.',
  location: 'Córdoba, Argentina',
  locationDetail: 'Villa María, Córdoba — Argentina',
  tagline: 'La luz se vuelve experiencia.',
} as const;

export const CONTACT = {
  // Número de WhatsApp en formato internacional, sin "+" ni espacios.
  // Ej: Argentina (Villa María) → 549353XXXXXXX
  whatsapp: '5493530000000',
  whatsappLabel: '+54 9 353 000-0000',
  email: 'agustincastellanofotografia@gmail.com',
  instagram: 'https://instagram.com/castellano.ph',
  instagramHandle: '@castellano.ph',
} as const;

/** Mensaje pre-cargado al abrir WhatsApp. */
export const WHATSAPP_MESSAGE =
  'Hola Castellano PH 👋 Quiero diseñar la experiencia de mi evento. ¿Hablamos?';

export function whatsappLink(message: string = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Sistema de diseño — color de acento.
 * Si Castellano PH ya tiene paleta de marca, reemplazá estos valores
 * (también están reflejados en src/index.css como variables CSS).
 */
export const BRAND = {
  accent: '#5FE3C0', // verde-luz frío (la luz que escriben)
  accentWarm: '#FF7A45', // acento cálido secundario
  bg: '#0A0A0B',
} as const;

/** Si querés mostrar precios en las cards de packs, poné esto en true. */
export const SHOW_PRICES = false;

/** Nota legal (letra chica) sobre cotización en dólares. */
export const LEGAL_NOTE =
  'Todos los montos en dólares estadounidenses. En caso de pago en pesos argentinos, se toma como referencia el Dólar Oficial a la fecha de cierre/pago estipulada.';
