import { SITE, CONTACT, whatsappLink } from '../config';
import { InstagramIcon, WhatsAppIcon } from '../components/icons';

/** FOOTER — monograma, redes, ubicación y lema. Minimalista. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-white/10 py-14">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-4xl font-bold tracking-tightest">{SITE.monogram}</p>
            <p className="mt-3 max-w-xs text-sm text-white/50">
              {SITE.motto} Estudio creativo de eventos.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {SITE.name}. {SITE.locationDetail}.
          </span>
          <span>Diseñamos soluciones.</span>
        </div>
      </div>
    </footer>
  );
}
