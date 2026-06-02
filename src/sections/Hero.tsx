import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SITE } from '../config';
import { useSectionShape } from '../hooks/useSectionShape';
import { LiveModeToggle } from '../components/LiveModeToggle';
import { ArrowDown } from '../components/icons';

/**
 * HERO — el campo de partículas (montado en App, detrás de todo) se condensa
 * en el monograma C·PH. Acá vive el claim, el CTA y el toggle del Modo Vivo.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  // Al entrar al hero, las partículas forman el monograma.
  useSectionShape(ref, 'monogram', 0.2);

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <div className="container-px relative mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="eyebrow mb-6"
        >
          Estudio creativo de eventos · {SITE.location}
        </motion.p>

        <h1 className="font-display text-[clamp(2.6rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tightest">
          <Line text="No cubrimos tu evento." delay={0.45} />
          <Line text="Lo diseñamos." delay={0.62} glow />
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.9 }}
          className="mt-7 max-w-xl text-balance text-base text-white/65 md:text-lg"
        >
          Fotografía, producción audiovisual y experiencias inmersivas.
          Diseñamos la experiencia de tu evento de punta a punta.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.8 }}
          className="mt-10 flex flex-col items-center gap-5 sm:flex-row"
        >
          <a href="#contacto" className="btn-primary">
            Solicitá tu presupuesto
          </a>
          <LiveModeToggle compact />
        </motion.div>
      </div>

      <motion.a
        href="#manifiesto"
        aria-label="Bajar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white"
      >
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="block"
        >
          <ArrowDown />
        </motion.span>
      </motion.a>
    </section>
  );
}

function Line({ text, delay, glow }: { text: string; delay: number; glow?: boolean }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-block ${glow ? 'text-glow' : ''}`}
      >
        {text}
      </motion.span>
    </span>
  );
}
