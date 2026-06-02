import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { PROCESS } from '../data/content';
import { useSectionShape } from '../hooks/useSectionShape';
import { Reveal } from '../components/ui/Reveal';

/**
 * PROCESO — el ciclo del evento como timeline vertical.
 * La línea se "dibuja" a medida que scrolleás (scaleY ligado al scroll).
 */
export function Process() {
  const ref = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  useSectionShape(ref, 'drone', 0.3);

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 70%', 'end 60%'],
  });
  const lineScale = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="proceso" ref={ref} className="relative py-28 md:py-36">
      <div className="container-px mx-auto max-w-5xl">
        <Reveal>
          <p className="eyebrow mb-4">Proceso</p>
        </Reveal>
        <Reveal i={1}>
          <h2 className="mb-16 max-w-2xl font-display text-[clamp(1.8rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight">
            De la idea a la experiencia. Un solo equipo, todo el camino.
          </h2>
        </Reveal>

        <ol ref={listRef} className="relative ml-3 md:ml-6">
          {/* Riel de fondo + línea que se dibuja */}
          <div className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px bg-white/10" />
          <motion.div
            className="absolute left-0 top-2 w-px origin-top bg-[var(--accent)]"
            style={{ height: 'calc(100% - 1rem)', scaleY: lineScale }}
          />

          {PROCESS.map((step) => (
            <li key={step.n} className="relative grid grid-cols-[auto_1fr] gap-x-6 pb-12 pl-8 last:pb-0">
              <Reveal className="contents">
                <span className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--accent)] bg-ink" />
                <span className="font-display text-sm text-[var(--accent)] tabular-nums">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-display text-xl font-medium md:text-2xl">{step.title}</h3>
                  <p className="mt-1.5 max-w-md text-sm text-white/55">{step.desc}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
