import type { ParticleShape } from '../state/ExperienceContext';

/**
 * Genera las posiciones objetivo para cada figura del campo de partículas.
 * El campo morfea entre la "nube" ambiente y estas figuras, una por servicio.
 *
 * Cada función rellena `count` puntos (x,y,z) dentro de un volumen de
 * aprox. [-6,6] x [-3.6,3.6] x [-1.5,1.5].
 */

type Filler = (out: Float32Array, count: number) => void;

const TAU = Math.PI * 2;

// Distribución difusa de fondo: esfera con caída suave hacia el centro.
const cloud: Filler = (out, count) => {
  for (let i = 0; i < count; i++) {
    const r = Math.cbrt(Math.random()) * 6.5;
    const theta = Math.random() * TAU;
    const phi = Math.acos(2 * Math.random() - 1);
    out[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62;
    out[i * 3 + 2] = r * Math.cos(phi) * 0.4;
  }
};

// Monograma C·PH → anillo "C" con corte + punto central.
const monogram: Filler = (out, count) => {
  const dotShare = 0.12;
  for (let i = 0; i < count; i++) {
    if (i / count < dotShare) {
      // Punto central (el "·").
      const r = Math.random() * 0.35;
      const a = Math.random() * TAU;
      out[i * 3] = Math.cos(a) * r;
      out[i * 3 + 1] = Math.sin(a) * r;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    } else {
      // Anillo "C": arco con apertura a la derecha.
      const gap = 0.9; // radianes de apertura
      const a = gap / 2 + Math.random() * (TAU - gap);
      const radius = 2.7 + (Math.random() - 0.5) * 0.18;
      out[i * 3] = Math.cos(a) * radius;
      out[i * 3 + 1] = Math.sin(a) * radius;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
  }
};

// Fotografía → diafragma: anillo exterior + láminas radiales.
const aperture: Filler = (out, count) => {
  const blades = 6;
  for (let i = 0; i < count; i++) {
    if (i % 5 === 0) {
      // Anillo exterior.
      const a = Math.random() * TAU;
      const r = 3 + (Math.random() - 0.5) * 0.12;
      out[i * 3] = Math.cos(a) * r;
      out[i * 3 + 1] = Math.sin(a) * r;
    } else {
      // Láminas (segmentos rectos rotados).
      const blade = i % blades;
      const baseA = (blade / blades) * TAU;
      const t = Math.random();
      const r = 1.1 + t * 1.9;
      const offset = (Math.random() - 0.5) * 0.1;
      out[i * 3] = Math.cos(baseA + offset) * r;
      out[i * 3 + 1] = Math.sin(baseA + offset) * r;
    }
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
};

// Video → tira de fotogramas (filmstrip horizontal con perforaciones).
const film: Filler = (out, count) => {
  const w = 9;
  const h = 2.8;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * w;
    let y = (Math.random() - 0.5) * h;
    // Bordes con "dientes" de película: forzamos bandas superior/inferior.
    if (Math.random() < 0.32) {
      const edge = y > 0 ? 1 : -1;
      y = edge * (h / 2 - 0.18 - Math.random() * 0.12);
      // Perforaciones espaciadas.
      const slot = Math.round((x + w / 2) / 0.7);
      out[i * 3] = (slot * 0.7 - w / 2) + (Math.random() - 0.5) * 0.12;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      continue;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
};

// Drone → hélice ascendente (trayectoria de vuelo).
const drone: Filler = (out, count) => {
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const a = t * TAU * 6;
    const radius = 3.4 * (1 - t * 0.55);
    out[i * 3] = Math.cos(a) * radius + (Math.random() - 0.5) * 0.18;
    out[i * 3 + 1] = (t - 0.5) * 6 + (Math.random() - 0.5) * 0.18;
    out[i * 3 + 2] = Math.sin(a) * radius * 0.5;
  }
};

// Visuales → grilla de píxeles (pantalla).
const grid: Filler = (out, count) => {
  const cols = 28;
  const rows = 16;
  const w = 9;
  const h = 5;
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols) % rows;
    out[i * 3] = (cx / (cols - 1) - 0.5) * w + (Math.random() - 0.5) * 0.05;
    out[i * 3 + 1] = (cy / (rows - 1) - 0.5) * h + (Math.random() - 0.5) * 0.05;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
};

// Web → marco de ventana con barra superior + cursor.
const web: Filler = (out, count) => {
  const w = 7.2;
  const h = 4.6;
  const hx = w / 2;
  const hy = h / 2;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (r < 0.12) {
      // Cursor (flecha) abajo a la derecha.
      const t = Math.random();
      out[i * 3] = 1.6 + t * 0.9 + (Math.random() - 0.5) * 0.1;
      out[i * 3 + 1] = -0.6 - t * 1.1 + (Math.random() - 0.5) * 0.1;
      out[i * 3 + 2] = 0.2;
      continue;
    }
    // Perímetro del marco.
    const side = Math.floor(Math.random() * 4);
    if (side === 0) {
      out[i * 3] = (Math.random() - 0.5) * w;
      out[i * 3 + 1] = hy;
    } else if (side === 1) {
      out[i * 3] = (Math.random() - 0.5) * w;
      out[i * 3 + 1] = -hy;
    } else if (side === 2) {
      out[i * 3] = -hx;
      out[i * 3 + 1] = (Math.random() - 0.5) * h;
    } else {
      out[i * 3] = hx;
      out[i * 3 + 1] = (Math.random() - 0.5) * h;
    }
    // Barra de título.
    if (Math.random() < 0.18) out[i * 3 + 1] = hy - 0.55;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
};

// Inmersivo → cubo volumétrico (puntos en la superficie de un cubo).
const volume: Filler = (out, count) => {
  const s = 2.6;
  for (let i = 0; i < count; i++) {
    const face = Math.floor(Math.random() * 6);
    const u = (Math.random() - 0.5) * 2 * s;
    const v = (Math.random() - 0.5) * 2 * s;
    let x = 0;
    let y = 0;
    let z = 0;
    switch (face) {
      case 0: x = s; y = u; z = v; break;
      case 1: x = -s; y = u; z = v; break;
      case 2: x = u; y = s; z = v; break;
      case 3: x = u; y = -s; z = v; break;
      case 4: x = u; y = v; z = s; break;
      default: x = u; y = v; z = -s; break;
    }
    // Rotación isométrica suave para que se lea como volumen.
    const ca = Math.cos(0.6);
    const sa = Math.sin(0.6);
    out[i * 3] = x * ca - z * sa;
    out[i * 3 + 1] = y * 0.92;
    out[i * 3 + 2] = x * sa + z * ca;
  }
};

// pulse.show → forma de onda (waveform) que cruza la pantalla.
const wave: Filler = (out, count) => {
  for (let i = 0; i < count; i++) {
    const x = (i / count - 0.5) * 11;
    const env = Math.cos((x / 11) * Math.PI); // envolvente central
    const y =
      Math.sin(x * 1.6) * 1.4 * env +
      Math.sin(x * 4.1 + 1.3) * 0.5 * env +
      (Math.random() - 0.5) * 0.25;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
};

const FILLERS: Record<ParticleShape, Filler> = {
  cloud,
  monogram,
  aperture,
  film,
  drone,
  grid,
  web,
  volume,
  wave,
};

const cache = new Map<string, Float32Array>();

/** Devuelve (y cachea) las posiciones objetivo de una figura. */
export function getShapePositions(shape: ParticleShape, count: number): Float32Array {
  const key = `${shape}:${count}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const arr = new Float32Array(count * 3);
  FILLERS[shape](arr, count);
  cache.set(key, arr);
  return arr;
}
