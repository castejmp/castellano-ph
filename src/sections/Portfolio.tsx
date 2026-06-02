import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WORKS, WORK_FILTERS, type Work } from '../data/content';
import { useSectionShape } from '../hooks/useSectionShape';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { PlayIcon } from '../components/icons';
import { Reveal } from '../components/ui/Reveal';

gsap.registerPlugin(ScrollTrigger);

/**
 * PORTFOLIO — galería horizontal estilo "zapping".
 * En desktop, el scroll vertical se convierte en desplazamiento horizontal
 * (ScrollTrigger + pin). En mobile y con movimiento reducido, cae a un
 * carrusel con swipe nativo.
 */
export function Portfolio() {
  const ref = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<(typeof WORK_FILTERS)[number]>('Todos');

  useSectionShape(ref, 'film', 0.3);

  const works = useMemo(
    () => (filter === 'Todos' ? WORKS : WORKS.filter((w) => w.category === filter)),
    [filter]
  );

  useLayoutEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return;

    const mm = gsap.matchMedia();
    // Sólo activamos el scroll horizontal "pineado" en desktop.
    mm.add('(min-width: 768px)', () => {
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(track, { x: 0 });
      };
    });

    return () => mm.revert();
  }, [reduced, works.length]);

  return (
    <section id="trabajos" ref={ref} className="relative py-24 md:py-0">
      {/* Encabezado + filtros */}
      <div className="container-px mx-auto max-w-7xl pb-10 md:pb-0 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-4">Trabajos</p>
        </Reveal>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal i={1}>
            <h2 className="max-w-2xl font-display text-[clamp(1.8rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight">
              Cambiá de canal.
            </h2>
          </Reveal>
          <div className="flex flex-wrap gap-2">
            {WORK_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
                  filter === f
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-white/15 text-white/55 hover:border-white/35 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pista horizontal (desktop pin / mobile swipe) */}
      <div ref={pinRef} className="md:flex md:h-screen md:items-center md:overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto px-6 pb-4 md:overflow-visible md:px-12 lg:px-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {works.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
          <div className="hidden w-[20vw] shrink-0 md:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}

function WorkCard({ work }: { work: Work }) {
  return (
    <article className="group relative h-[58vh] w-[78vw] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:w-[60vw] md:h-[64vh] md:w-[34vw] lg:w-[26vw]">
      {/* Placeholder visual (reemplazable por foto/video real). */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          background: `linear-gradient(150deg,
            hsl(${work.hue} 55% 18%) 0%,
            hsl(${work.hue + 25} 45% 9%) 60%,
            #08080a 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />

      {work.kind === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 text-white/90 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
            <PlayIcon className="h-6 w-6 translate-x-0.5" />
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {work.category}
          </p>
          <h3 className="mt-1 font-display text-xl font-medium">{work.title}</h3>
        </div>
      </div>
    </article>
  );
}
