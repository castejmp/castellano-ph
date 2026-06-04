import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { whatsappLink } from '../../config';

gsap.registerPlugin(ScrollTrigger);

/**
 * BLOQUE 3 · EXPERIENCIA — eje de movimiento en PROFUNDIDAD (túnel).
 * Volás hacia adentro de la experiencia: planos que vienen desde el fondo y
 * pasan a los costados, hasta el reveal de pulse.show. Es lo inmersivo.
 */

const LAYERS = [
  { title: 'Mapping', sub: 'Proyección sobre superficies', x: -22, y: -14, hue: 188 },
  { title: 'Realidad Aumentada', sub: 'Capas digitales en vivo', x: 24, y: -10, hue: 268 },
  { title: 'Realidad Virtual', sub: 'Mundos a medida', x: -26, y: 14, hue: 150 },
  { title: 'Partículas reactivas', sub: 'Kinect + TouchDesigner', x: 22, y: 16, hue: 320 },
  { title: 'Luces sincronizadas', sub: 'DMX al ritmo del show', x: -16, y: -2, hue: 40 },
  { title: 'pulse.show', sub: 'Pulseras NFC reactivas', x: 0, y: 0, hue: 168 },
] as const;

export function Experiencia() {
  const root = useRef<HTMLElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const planes = gsap.utils.toArray<HTMLElement>('.tunnel-plane', world.current!);

      planes.forEach((p, i) => {
        const { x, y } = LAYERS[i];
        gsap.set(p, { xPercent: -50, yPercent: -50, x: `${x}vw`, y: `${y}vh`, z: -2800 - i * 700, opacity: 0 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=320%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Cada plano viaja desde el fondo hacia la cámara y pasa de largo.
      planes.forEach((p, i) => {
        const at = i * 0.14;
        tl.fromTo(
          p,
          { z: -2800 - i * 700, opacity: 0 },
          { z: 250, opacity: 1, duration: 0.5, ease: 'none' },
          at
        ).to(p, { opacity: i === planes.length - 1 ? 1 : 0, z: 650, duration: 0.25, ease: 'none' }, at + 0.5);
      });

      // Reveal final del título.
      tl.fromTo(title.current, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4 }, 0.85);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });
    return () => mm.revert();
  }, [reduced]);

  return (
    <section id="pulse-show" ref={root} className="relative overflow-hidden md:h-screen">
      {/* Encabezado del acto */}
      <div className="container-px relative left-0 top-0 z-30 w-full pt-24 md:absolute md:pt-28">
        <p className="eyebrow mb-2">Acto 03</p>
        <h2 className="font-display text-4xl font-bold tracking-tightest md:text-6xl">
          Experiencia<span className="text-[var(--accent)]">.</span>
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/55">
          Donde el evento se vive. Material inmersivo y tecnología en vivo: tu fiesta,
          convertida en un show.
        </p>
      </div>

      {/* Túnel 3D (desktop) */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{ perspective: '900px', perspectiveOrigin: '50% 50%' }}
      >
        <div ref={world} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {LAYERS.map((l) => (
            <div
              key={l.title}
              className="tunnel-plane absolute left-1/2 top-1/2 h-[34vh] w-[26vw] overflow-hidden rounded-2xl border border-white/15"
              style={{
                background: `linear-gradient(150deg, hsl(${l.hue} 60% 22%), hsl(${l.hue + 25} 50% 9%) 70%, #08080a)`,
                boxShadow: `0 0 60px -10px hsl(${l.hue} 70% 40% / 0.5)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-2xl font-semibold tracking-tight">{l.title}</p>
                <p className="mt-1 text-sm text-[var(--accent)]">{l.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Título que se revela al final del túnel */}
        <div
          ref={title}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center opacity-0"
        >
          <p className="font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-none tracking-tightest">
            pulse<span className="text-[var(--accent)]" style={{ textShadow: '0 0 40px var(--accent)' }}>.show</span>
          </p>
          <p className="mt-4 max-w-md text-balance text-white/70">
            Pulseras NFC, visuales reactivos en tiempo real y luces sincronizadas
            estilo show de estadio.
          </p>
          <a
            href={whatsappLink('Hola Castellano PH 👋 Quiero saber más de pulse.show para mi evento.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary pointer-events-auto mt-8"
          >
            Quiero esto en mi evento
          </a>
        </div>
      </div>

      {/* Fallback mobile / reduced-motion: lista vertical */}
      <div className="container-px relative z-10 mx-auto flex max-w-md flex-col gap-3 pb-24 pt-6 md:hidden">
        {LAYERS.map((l) => (
          <div
            key={l.title}
            className="rounded-xl border border-white/10 p-4"
            style={{ background: `linear-gradient(120deg, hsl(${l.hue} 50% 16%), transparent)` }}
          >
            <p className="font-display text-lg font-semibold">{l.title}</p>
            <p className="text-xs text-[var(--accent)]">{l.sub}</p>
          </div>
        ))}
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3">
          Quiero esto en mi evento
        </a>
      </div>
    </section>
  );
}
