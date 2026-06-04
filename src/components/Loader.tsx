import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SITE } from '../config';

/**
 * Intro cinematográfica / loader.
 *
 * three.js + las fuentes tardan un instante en cargar; en vez de dejar la
 * pantalla en negro (mala percepción de performance), mostramos el monograma
 * con una línea de luz que se completa, y revelamos el sitio.
 *
 * Regla "progressive-loading" de la skill UI/UX: usar feedback en operaciones
 * >1s en lugar de un blanco/negro frío. Respeta prefers-reduced-motion.
 */
export function Loader() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), reduced ? 300 : 1700);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
        >
          <motion.span
            className="font-display text-5xl font-bold tracking-tightest"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {SITE.monogram}
          </motion.span>

          {!reduced && (
            <div className="mt-6 h-px w-40 overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-[var(--accent)]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ boxShadow: '0 0 16px var(--accent)' }}
              />
            </div>
          )}

          <motion.span
            className="mt-5 text-[11px] uppercase tracking-[0.3em] text-white/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            La luz se vuelve experiencia
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
