import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { PACKS, type Pack } from '../data/content';
import { SHOW_PRICES, LEGAL_NOTE, whatsappLink } from '../config';
import { useSectionShape } from '../hooks/useSectionShape';
import { Reveal } from '../components/ui/Reveal';
import { Plus, WhatsAppIcon } from '../components/icons';

/**
 * LOS PACKS — tres tiers escalonados (cada uno contiene al anterior).
 * Cards con tilt 3D, detalle desplegable y CTA a WhatsApp.
 * El Pack III ("Experiencia Total") recibe tratamiento premium.
 */
export function Packs() {
  const ref = useRef<HTMLElement>(null);
  useSectionShape(ref, 'volume', 0.3);

  return (
    <section id="packs" ref={ref} className="relative py-28 md:py-36">
      <div className="container-px mx-auto max-w-7xl">
        <Reveal>
          <p className="eyebrow mb-4">Los packs</p>
        </Reveal>
        <Reveal i={1}>
          <h2 className="max-w-3xl font-display text-[clamp(1.8rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight">
            Tres formas de encender tu evento.{' '}
            <span className="text-white/45">Cada pack contiene al anterior y escala.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PACKS.map((pack, i) => (
            <Reveal key={pack.id} i={i}>
              <PackCard pack={pack} />
            </Reveal>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-[11px] leading-relaxed text-white/35">{LEGAL_NOTE}</p>
      </div>
    </section>
  );
}

function PackCard({ pack }: { pack: Pack }) {
  const [open, setOpen] = useState(pack.featured ?? false);

  // Tilt 3D suave siguiendo el mouse.
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const rotateX = useTransform(rx, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(ry, [-0.5, 0.5], ['-7deg', '7deg']);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rx.set((e.clientY - r.top) / r.height - 0.5);
    ry.set((e.clientX - r.left) / r.width - 0.5);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`relative flex h-full flex-col rounded-2xl border p-7 transition-colors ${
        pack.featured
          ? 'border-[var(--accent)]/50 bg-gradient-to-b from-[color-mix(in_srgb,var(--accent)_8%,transparent)] to-transparent shadow-[0_0_60px_-20px_var(--accent)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
      }`}
    >
      {pack.featured && (
        <span className="absolute right-6 top-7 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
          Premium
        </span>
      )}

      <p className="eyebrow">{pack.tier}</p>
      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight">{pack.name}</h3>
      <p className="mt-2 text-sm text-white/55">{pack.tagline}</p>

      {SHOW_PRICES && pack.price && (
        <p className="mt-4 font-display text-xl text-[var(--accent)]">{pack.price}</p>
      )}
      {!SHOW_PRICES && pack.featured && (
        <p className="mt-4 font-display text-lg text-[var(--accent)]">Costo a definir · a medida</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-white/70 transition-colors hover:text-white"
      >
        ¿Qué incluye?
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}>
          <Plus className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-4">
              {pack.includes.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-white/70">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>

      <a
        href={whatsappLink(`Hola Castellano PH 👋 Me interesa el ${pack.tier} — ${pack.name}. ¿Hablamos?`)}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
          pack.featured
            ? 'bg-[var(--accent)] text-ink hover:scale-[1.03]'
            : 'border border-white/20 text-white hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        <WhatsAppIcon className="h-4 w-4" />
        Solicitar presupuesto
      </a>
    </motion.div>
  );
}
