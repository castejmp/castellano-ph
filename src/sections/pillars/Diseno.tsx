import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * BLOQUE 2 · DISEÑO — eje de movimiento VERTICAL hacia arriba.
 * Las piezas de diseño se elevan y se construyen a distintas velocidades
 * (parallax vertical) mientras scrolleás. Es el área de identidad y gráfica.
 */

type Card = { label: string; sub: string; render: () => JSX.Element };

const swatch = (c: string) => (
  <span key={c} className="h-8 flex-1 rounded" style={{ background: c }} />
);

const COLUMNS: Card[][] = [
  [
    {
      label: 'Identidad',
      sub: 'Logo + marca del evento',
      render: () => (
        <div className="flex h-32 items-center justify-center">
          <span className="font-display text-5xl font-bold tracking-tightest">C·PH</span>
        </div>
      ),
    },
    {
      label: 'Tipografía',
      sub: 'Familia del evento',
      render: () => (
        <div className="flex h-28 items-end gap-1 leading-none">
          <span className="font-display text-6xl font-bold">Aa</span>
          <span className="font-body text-3xl text-white/50">Gg</span>
        </div>
      ),
    },
  ],
  [
    {
      label: 'Paleta',
      sub: 'Sistema cromático',
      render: () => (
        <div className="flex h-20 gap-1.5">
          {['#5FE3C0', '#0A0A0B', '#FF7A45', '#F4F4F5'].map(swatch)}
        </div>
      ),
    },
    {
      label: 'Web + RSVP',
      sub: 'Confirmación de asistentes',
      render: () => (
        <div className="h-32 overflow-hidden rounded-lg border border-white/10">
          <div className="flex h-5 items-center gap-1 bg-white/5 px-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          </div>
          <div className="space-y-2 p-3">
            <span className="block h-2 w-2/3 rounded bg-white/15" />
            <span className="block h-2 w-1/2 rounded bg-white/10" />
            <span className="mt-3 block h-6 w-24 rounded bg-[var(--accent)]/80" />
          </div>
        </div>
      ),
    },
  ],
  [
    {
      label: 'Visuales',
      sub: 'Piezas para pantallas',
      render: () => (
        <div className="grid h-32 grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="rounded"
              style={{ background: `hsl(${168 + i * 14} 50% ${18 + (i % 3) * 8}%)` }}
            />
          ))}
        </div>
      ),
    },
    {
      label: 'Invitaciones',
      sub: 'Piezas virtuales',
      render: () => (
        <div className="flex h-32 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[var(--accent)]/15 to-transparent">
          <span className="font-display text-lg tracking-[0.3em] text-white/70">RSVP</span>
        </div>
      ),
    },
  ],
];

export function Diseno() {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  // El parallax solo tiene sentido en desktop: en mobile las columnas se apilan
  // en una sola, así que mover cada una a distinta velocidad las descuadra.
  const parallax = !isMobile && !reduced;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Cada columna se eleva a distinta velocidad → parallax vertical (desktop).
  const yCols = [
    useTransform(scrollYProgress, [0, 1], ['12%', '-34%']),
    useTransform(scrollYProgress, [0, 1], ['28%', '-12%']),
    useTransform(scrollYProgress, [0, 1], ['4%', '-44%']),
  ];
  const yWord = useTransform(scrollYProgress, [0, 1], ['40%', '-40%']);

  return (
    <section id="diseno" ref={ref} className="relative overflow-hidden py-32 md:py-48">
      {/* Palabra de fondo que se eleva */}
      <motion.div
        style={{ y: parallax ? yWord : 0 }}
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 select-none text-center font-display text-[26vw] font-bold leading-none tracking-tightest text-white/[0.04]"
      >
        DISEÑO
      </motion.div>

      <div className="container-px relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 md:mb-20">
          <p className="eyebrow mb-2">Acto 02</p>
          <h2 className="font-display text-4xl font-bold tracking-tightest md:text-6xl">
            Diseño<span className="text-[var(--accent)]">.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/55">
            La identidad del evento de punta a punta: marca, tipografía, visuales,
            invitaciones y la web con RSVP.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 md:grid-cols-3">
          {COLUMNS.map((col, ci) => (
            <Column key={ci} cards={col} y={parallax ? yCols[ci] : undefined} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Column({ cards, y }: { cards: Card[]; y?: MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="space-y-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm"
        >
          {card.render()}
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="font-display text-lg font-medium">{card.label}</p>
            <p className="text-xs text-white/45">{card.sub}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
