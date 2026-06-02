import { motion } from 'framer-motion';
import { useExperience } from '../state/ExperienceContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Toggle del "Modo Vivo". Al activarlo, el campo de partículas se vuelve
 * audio-reactivo (micrófono o demo embebido). Es el guiño directo a
 * pulse.show: el visitante entra, por un momento, a una instalación.
 */
export function LiveModeToggle({ compact = false }: { compact?: boolean }) {
  const { live, toggleLive, audioSource } = useExperience();
  const reduced = useReducedMotion();

  // Con movimiento reducido no ofrecemos el modo reactivo.
  if (reduced) return null;

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={toggleLive}
        aria-pressed={live}
        className={`group inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ${
          live
            ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_30px_-8px_var(--accent)]'
            : 'border-white/20 text-white/80 hover:border-white/40'
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          {live && (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)]"
              animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              live ? 'bg-[var(--accent)]' : 'bg-white/40 group-hover:bg-white/70'
            }`}
          />
        </span>
        {live ? 'Modo Vivo activo' : 'Activá el Modo Vivo'}
      </button>

      {!compact && live && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pl-2 text-[11px] text-white/45"
        >
          {audioSource === 'mic'
            ? 'Reaccionando al sonido de tu micrófono.'
            : audioSource === 'demo'
              ? 'Sin micrófono: reproduciendo demo. Las partículas laten igual.'
              : 'Iniciando audio…'}
        </motion.span>
      )}
    </div>
  );
}
