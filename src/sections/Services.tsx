import { useRef } from 'react';
import { useExperience } from '../state/ExperienceContext';
import { useSectionShape } from '../hooks/useSectionShape';
import { DISCIPLINES } from '../data/content';
import { Reveal } from '../components/ui/Reveal';

/**
 * QUÉ HACEMOS — la prueba de que no es "solo foto".
 * Al pasar el mouse por cada disciplina, el campo de partículas del fondo
 * morfea hacia una figura que representa ese servicio.
 */
export function Services() {
  const ref = useRef<HTMLElement>(null);
  const { setShape } = useExperience();
  // Estado base de la sección mientras no hay hover.
  useSectionShape(ref, 'cloud', 0.3);

  return (
    <section id="que-hacemos" ref={ref} className="relative py-28 md:py-36">
      <div className="container-px mx-auto max-w-7xl">
        <Reveal>
          <p className="eyebrow mb-4">Qué hacemos</p>
        </Reveal>
        <Reveal i={1}>
          <h2 className="max-w-3xl font-display text-[clamp(1.8rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight">
            Foto, video, drone, visuales, web y tecnología en vivo.{' '}
            <span className="text-white/45">Un solo estudio para toda la experiencia.</span>
          </h2>
        </Reveal>

        <ul
          className="mt-14 divide-y divide-white/10 border-y border-white/10"
          onMouseLeave={() => setShape('cloud')}
        >
          {DISCIPLINES.map((d, i) => (
            <Reveal as="li" key={d.id} i={i}>
              <button
                type="button"
                onMouseEnter={() => setShape(d.shape)}
                onFocus={() => setShape(d.shape)}
                className="group grid w-full grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 py-6 text-left transition-colors md:grid-cols-[5rem_minmax(0,16rem)_1fr] md:items-center md:py-8"
              >
                <span className="font-display text-sm text-white/30 tabular-nums">
                  0{i + 1}
                </span>
                <span className="font-display text-2xl font-medium tracking-tight transition-transform duration-300 group-hover:translate-x-2 group-hover:text-[var(--accent)] md:text-3xl">
                  {d.name}
                </span>
                <span className="col-span-2 max-w-md text-sm text-white/55 md:col-span-1 md:text-right">
                  {d.blurb}
                </span>
              </button>
            </Reveal>
          ))}
        </ul>

        <Reveal>
          <p className="mt-10 max-w-2xl text-white/55">
            Donde el fotógrafo común termina entregando fotos,{' '}
            <span className="text-white">Castellano PH recién empieza.</span> La promesa es
            simple: tu evento se vive, no solo se documenta.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
