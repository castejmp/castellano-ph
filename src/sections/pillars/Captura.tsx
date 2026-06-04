import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PlayIcon } from '../../components/icons';

gsap.registerPlugin(ScrollTrigger);

/**
 * BLOQUE 1 · CAPTURA — eje de movimiento HORIZONTAL a la izquierda.
 * Un travelling de cámara: el scroll vertical se traduce en desplazamiento
 * lateral, con capas a distintas velocidades (parallax). Es lo audiovisual.
 */

const SHOTS = [
  { title: 'Fotografía', tag: 'Dirección de imagen', kind: 'foto', hue: 22 },
  { title: 'Video · Reel', tag: 'Narrativa audiovisual', kind: 'video', hue: 168 },
  { title: 'Drone FPV', tag: 'Aéreas inmersivas', kind: 'video', hue: 268 },
  { title: 'Fotos en vivo', tag: 'Entrega inmediata', kind: 'foto', hue: 200 },
  { title: 'Racconto', tag: 'El relato del evento', kind: 'video', hue: 320 },
] as const;

export function Captura() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const t = track.current!;
      const dist = () => t.scrollWidth - window.innerWidth + 80;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      tl.to(t, { x: () => -dist(), ease: 'none' }, 0);
      // La palabra gigante de fondo viaja más lento (capa profunda).
      tl.to(word.current, { x: () => -dist() * 0.4, ease: 'none' }, 0);
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set([t, word.current], { x: 0 });
      };
    });
    return () => mm.revert();
  }, [reduced]);

  return (
    <section id="captura" ref={root} className="relative h-screen overflow-hidden">
      {/* Palabra de fondo (capa lenta) */}
      <div
        ref={word}
        className="pointer-events-none absolute left-0 top-1/2 z-0 -translate-y-1/2 select-none whitespace-nowrap font-display text-[28vw] font-bold leading-none tracking-tightest text-white/[0.04] md:text-[22vw]"
      >
        CAPTURA — CAPTURA —
      </div>

      {/* Encabezado fijo del acto */}
      <div className="container-px absolute left-0 top-0 z-20 w-full pt-24 md:pt-28">
        <p className="eyebrow mb-2">Acto 01</p>
        <h2 className="font-display text-4xl font-bold tracking-tightest md:text-6xl">
          Captura<span className="text-[var(--accent)]">.</span>
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/55">
          Escribir con luz. Foto, video, drone y fotos en vivo — la materia prima
          de tu evento.
        </p>
      </div>

      {/* Pista horizontal */}
      <div className="flex h-full items-center">
        <div
          ref={track}
          className="flex items-center gap-6 px-6 md:gap-10 md:px-[8vw] [scrollbar-width:none] max-md:overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          <div className="hidden w-[18vw] shrink-0 md:block" aria-hidden />
          {SHOTS.map((s, i) => (
            <article
              key={s.title}
              className="group relative h-[62vh] w-[80vw] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:w-[56vw] md:w-[38vw] lg:w-[30vw]"
            >
              <div
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                style={{
                  background: `linear-gradient(150deg, hsl(${s.hue} 55% 20%), hsl(${s.hue + 30} 45% 8%) 65%, #08080a)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
              {s.kind === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 text-white/90 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                    <PlayIcon className="h-6 w-6 translate-x-0.5" />
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-display text-3xl font-medium tracking-tight">{s.title}</p>
                <p className="mt-1 text-sm text-[var(--accent)]">{s.tag}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-white/35">
                  0{i + 1} / 0{SHOTS.length}
                </p>
              </div>
            </article>
          ))}
          <div className="hidden w-[20vw] shrink-0 md:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
