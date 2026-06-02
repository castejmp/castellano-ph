import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AudioEngine, type AudioBands, type AudioSourceKind } from '../three/audioEngine';

/**
 * Estado compartido de la "experiencia": el Modo Vivo (audio reactivo),
 * el puntero como fuente de luz, y la sección/servicio activos que hacen
 * morfear el campo de partículas.
 *
 * Los datos que se leen en cada frame (puntero, audio) viven en refs
 * mutables para no disparar re-renders del árbol React.
 */

export interface PointerState {
  x: number; // -1..1 (normalizado, centro = 0)
  y: number; // -1..1
  vx: number;
  vy: number;
  active: boolean;
}

/** Figuras hacia las que el campo de partículas puede morfear. */
export type ParticleShape =
  | 'cloud' // estado ambiente difuso
  | 'monogram' // C·PH condensado
  | 'aperture' // fotografía
  | 'film' // video
  | 'drone' // drone
  | 'grid' // visuales
  | 'web' // web
  | 'volume' // inmersivo
  | 'wave'; // pulse.show

interface ExperienceValue {
  live: boolean;
  audioSource: AudioSourceKind;
  toggleLive: () => void;
  pointer: React.MutableRefObject<PointerState>;
  bands: AudioBands;
  shape: ParticleShape;
  setShape: (s: ParticleShape) => void;
}

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSourceKind>(null);
  const [shape, setShape] = useState<ParticleShape>('cloud');

  const engineRef = useRef<AudioEngine | null>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0, vx: 0, vy: 0, active: false });

  // Las bandas son el objeto mutable del engine (o ceros si está apagado).
  const idleBands = useRef<AudioBands>({ bass: 0, mid: 0, treble: 0, level: 0 });
  const bands = engineRef.current?.bands ?? idleBands.current;

  const toggleLive = useCallback(() => {
    setLive((prev) => {
      const next = !prev;
      if (next) {
        const engine = new AudioEngine();
        engineRef.current = engine;
        engine.start().then((src) => setAudioSource(src));
      } else {
        engineRef.current?.stop();
        engineRef.current = null;
        setAudioSource(null);
      }
      return next;
    });
  }, []);

  // Seguimiento global del puntero (mouse + touch) como fuente de luz.
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    const update = (cx: number, cy: number) => {
      const nx = (cx / window.innerWidth) * 2 - 1;
      const ny = -((cy / window.innerHeight) * 2 - 1);
      const p = pointer.current;
      p.vx = nx - lastX;
      p.vy = ny - lastY;
      lastX = nx;
      lastY = ny;
      p.x = nx;
      p.y = ny;
      p.active = true;
    };
    const onMouse = (e: MouseEvent) => update(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) update(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Limpieza del audio al desmontar.
  useEffect(() => () => engineRef.current?.stop(), []);

  const value = useMemo<ExperienceValue>(
    () => ({ live, audioSource, toggleLive, pointer, bands, shape, setShape }),
    [live, audioSource, toggleLive, bands, shape]
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience debe usarse dentro de <ExperienceProvider>');
  return ctx;
}
