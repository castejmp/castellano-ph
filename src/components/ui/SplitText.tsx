import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Palabras que se iluminan con el color de acento. */
  highlight?: string[];
  delay?: number;
}

/**
 * Tipografía cinética: revela el texto palabra por palabra con máscara y un
 * leve stagger. Las palabras clave se iluminan con el acento de marca.
 */
export function SplitText({ text, className, highlight = [], delay = 0 }: SplitTextProps) {
  const words = text.split(' ');
  const norm = (w: string) => w.toLowerCase().replace(/[.,;:]/g, '');
  const isHot = (w: string) => highlight.some((h) => norm(w) === norm(h));

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden className="inline-block align-baseline">
          <span className="inline-block overflow-hidden align-baseline">
            <motion.span
              className={`inline-block ${isHot(word) ? 'text-glow' : ''}`}
              initial={{ y: '110%' }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.85,
                delay: delay + i * 0.045,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
