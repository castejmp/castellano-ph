import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface RevealProps {
  children: ReactNode;
  i?: number;
  className?: string;
  as?: 'div' | 'li' | 'span' | 'p' | 'h2' | 'h3';
}

/** Aparición suave al entrar en viewport (con stagger opcional vía `i`). */
export function Reveal({ children, i = 0, className, as = 'div' }: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      custom={i}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </MotionTag>
  );
}
