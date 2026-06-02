import { useRef } from 'react';
import { useSectionShape } from '../hooks/useSectionShape';
import { SplitText } from '../components/ui/SplitText';

/**
 * MANIFIESTO — una sola declaración grande sobre mucho aire negro.
 * El campo de partículas se dispersa a nube: la luz aún no tomó forma.
 */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  useSectionShape(ref, 'cloud', 0.4);

  return (
    <section
      id="manifiesto"
      ref={ref}
      className="relative flex min-h-[80vh] items-center py-32"
    >
      <div className="container-px mx-auto max-w-5xl">
        <p className="eyebrow mb-10">Manifiesto</p>
        <h2 className="font-display text-[clamp(1.8rem,5vw,4rem)] font-medium leading-[1.08] tracking-tight">
          <SplitText
            text="Empezamos donde otros terminan. Cuando la última foto ya se tomó, nosotros recién encendemos las luces."
            highlight={['encendemos', 'luces.', 'terminan.']}
          />
        </h2>
      </div>
    </section>
  );
}
