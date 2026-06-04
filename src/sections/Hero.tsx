import { motion } from 'framer-motion';
import { SITE } from '../config';
import { ArrowDown } from '../components/icons';

/**
 * HERO — apertura cinematográfica. Tipografía protagonista con un barrido de
 * luz sobre el título. Sin partículas: la fuerza está en el tipo y el contraste.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <div className="container-px relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="eyebrow mb-6"
        >
          Estudio creativo de eventos · {SITE.location}
        </motion.p>

        <h1 className="font-display text-[clamp(2.6rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tightest">
          <Line text="No cubrimos tu evento." delay={0.35} />
          <Line text="Lo diseñamos." delay={0.52} sweep />
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95, duration: 0.9 }}
          className="mt-7 max-w-xl text-balance text-base text-white/65 md:text-lg"
        >
          Capturamos, diseñamos y producimos la experiencia de tu evento de punta a
          punta. Foto, video, drone, visuales y tecnología en vivo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a href="#contacto" className="btn-primary">
            Solicitá tu presupuesto
          </a>
          <a href="#captura" className="btn-ghost">
            Ver qué hacemos
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#manifiesto"
        aria-label="Bajar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/40 hover:text-white"
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

function Line({ text, delay, sweep }: { text: string; delay: number; sweep?: boolean }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-block ${sweep ? 'hero-sweep' : ''}`}
      >
        {text}
      </motion.span>
    </span>
  );
}
