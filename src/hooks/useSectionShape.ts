import { useEffect, type RefObject } from 'react';
import { useExperience, type ParticleShape } from '../state/ExperienceContext';

/**
 * Cuando la sección entra en viewport, el campo de partículas morfea hacia
 * la figura indicada. Así el "hilo de luz" cuenta en qué parte del relato
 * estamos sin que el usuario tenga que hacer nada.
 */
export function useSectionShape(
  ref: RefObject<HTMLElement>,
  shape: ParticleShape,
  threshold = 0.45
) {
  const { setShape } = useExperience();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setShape(shape);
        });
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, shape, threshold, setShape]);
}
