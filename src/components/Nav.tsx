import { useEffect, useState } from 'react';
import { SITE } from '../config';

const LINKS = [
  { href: '#captura', label: 'Captura' },
  { href: '#diseno', label: 'Diseño' },
  { href: '#pulse-show', label: 'Experiencia' },
  { href: '#packs', label: 'Packs' },
  { href: '#contacto', label: 'Contacto' },
];

/** Barra superior minimalista; se vuelve sólida al scrollear. */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-ink/70 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <nav className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between">
        <a href="#top" className="font-display text-lg font-bold tracking-tightest">
          {SITE.monogram}
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-white/65 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#contacto" className="btn-ghost !px-5 !py-2 text-xs">
          Presupuesto
        </a>
      </nav>
    </header>
  );
}
