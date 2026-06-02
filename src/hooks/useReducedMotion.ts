import { useEffect, useState } from 'react';

/**
 * Devuelve true si el usuario pidió reducir el movimiento.
 * Cuando es true, el sitio degrada a una versión calma:
 * sin partículas reactivas, sin glitch, sin scroll-jacking pesado.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
