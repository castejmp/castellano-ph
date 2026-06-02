import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSectionShape } from '../hooks/useSectionShape';
import { useExperience } from '../state/ExperienceContext';
import { LiveModeToggle } from '../components/LiveModeToggle';
import { Reveal } from '../components/ui/Reveal';

/**
 * PULSE.SHOW — la sección estrella, el diferencial.
 * El campo de partículas pasa a su estado más vivo (waveform) y, si el
 * visitante activa el Modo Vivo, todo late con el audio: la web se vuelve,
 * literalmente, una demo de pulse.show.
 */
export function PulseShow() {
  const ref = useRef<HTMLElement>(null);
  const { live } = useExperience();
  useSectionShape(ref, 'wave', 0.4);

  return (
    <section
      id="pulse-show"
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden py-28"
    >
      {/* "Encendido de show": blackout que se abre al entrar a la sección. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-ink"
        initial={{ opacity: 1 }}
        whileInView={{ opacity: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      <div className="container-px relative z-20 mx-auto max-w-5xl text-center">
        <Reveal>
          <p className="eyebrow mb-5">Experiencia inmersiva</p>
        </Reveal>
        <Reveal i={1}>
          <h2 className="font-display text-[clamp(2.6rem,9vw,7rem)] font-bold leading-none tracking-tightest">
            pulse<span className="text-glow">.show</span>
          </h2>
        </Reveal>
        <Reveal i={2}>
          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg text-white/70">
            Pulseras NFC, visuales reactivos en tiempo real y luces sincronizadas
            estilo show de estadio. Tu evento, convertido en un show.
          </p>
        </Reveal>

        {/* Pulseras "encendiéndose" */}
        <Reveal i={3}>
          <div className="mt-12 flex justify-center gap-2.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="h-10 w-2.5 rounded-full bg-[var(--accent)]"
                animate={
                  live
                    ? { opacity: [0.25, 1, 0.25], scaleY: [0.6, 1.25, 0.6] }
                    : { opacity: 0.35, scaleY: 1 }
                }
                transition={
                  live
                    ? { duration: 0.9, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }
                    : { duration: 0.4 }
                }
                style={{ transformOrigin: 'center' }}
              />
            ))}
          </div>
        </Reveal>

        <Reveal i={4}>
          <div className="mt-12 flex flex-col items-center gap-4">
            <LiveModeToggle />
            <p className="max-w-md text-sm text-white/45">
              {live
                ? 'Eso que ves moverse es el sonido. Imaginá una pista entera respondiendo así.'
                : 'Activá el Modo Vivo y mové el cursor: las partículas reaccionan como en una de nuestras instalaciones.'}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
