import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSectionShape } from '../hooks/useSectionShape';
import { CONTACT, whatsappLink } from '../config';
import { Reveal } from '../components/ui/Reveal';
import { InstagramIcon, WhatsAppIcon } from '../components/icons';

interface FormState {
  nombre: string;
  tipo: string;
  fecha: string;
  mensaje: string;
}

const EVENT_TYPES = ['XV', 'Casamiento', 'Comercial / Marca', 'Otro'];

/**
 * CONTACTO — formulario tipo RSVP. La calma final: las partículas se
 * reagrupan en el monograma.
 *
 * Nota: manejado 100% con estado (sin <form> con submit nativo). El "enviar"
 * arma un mensaje y abre WhatsApp con todo pre-cargado.
 */
export function Contact() {
  const ref = useRef<HTMLElement>(null);
  useSectionShape(ref, 'monogram', 0.35);

  const [form, setForm] = useState<FormState>({ nombre: '', tipo: '', fecha: '', mensaje: '' });
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const nameError = touched && form.nombre.trim().length < 2;

  const send = () => {
    setTouched(true);
    if (form.nombre.trim().length < 2) return;
    const msg = [
      `Hola Castellano PH 👋 Soy ${form.nombre}.`,
      form.tipo && `Tipo de evento: ${form.tipo}.`,
      form.fecha && `Fecha estimada: ${form.fecha}.`,
      form.mensaje && `Mensaje: ${form.mensaje}`,
    ]
      .filter(Boolean)
      .join(' ');
    window.open(whatsappLink(msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="contacto" ref={ref} className="relative py-28 md:py-36">
      <div className="container-px mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">Contacto</p>
          </Reveal>
          <Reveal i={1}>
            <h2 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[0.98] tracking-tightest">
              Diseñemos tu <span className="text-glow">experiencia</span>.
            </h2>
          </Reveal>
          <Reveal i={2}>
            <p className="mt-6 max-w-md text-white/60">
              Contanos de tu evento y te armamos una propuesta a medida. La forma más
              rápida es por WhatsApp.
            </p>
          </Reveal>

          <Reveal i={3}>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <WhatsAppIcon className="h-4 w-4" />
                Hablemos por WhatsApp
              </a>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <InstagramIcon className="h-4 w-4" />
                {CONTACT.instagramHandle}
              </a>
            </div>
          </Reveal>
        </div>

        {/* Formulario RSVP-style */}
        <Reveal i={2}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 md:p-9">
            <div className="space-y-7">
              <Field
                label="Tu nombre"
                value={form.nombre}
                onChange={(v) => set('nombre', v)}
                error={nameError ? 'Decinos cómo te llamás.' : undefined}
              />

              <div>
                <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-white/45">
                  Tipo de evento
                </span>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('tipo', t)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        form.tipo === t
                          ? 'border-[var(--accent)] text-[var(--accent)]'
                          : 'border-white/15 text-white/60 hover:border-white/35'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Fecha estimada"
                value={form.fecha}
                onChange={(v) => set('fecha', v)}
                placeholder="Ej: octubre 2026"
              />
              <Field
                label="Contanos un poco más"
                value={form.mensaje}
                onChange={(v) => set('mensaje', v)}
                multiline
              />

              <button type="button" onClick={send} className="btn-primary w-full">
                <WhatsAppIcon className="h-4 w-4" />
                Enviar consulta
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Input con label flotante y validación suave. */
function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  const shared =
    'peer w-full bg-transparent pt-6 pb-2 text-white outline-none transition-colors placeholder:text-white/25';

  return (
    <div className="relative border-b border-white/15 focus-within:border-[var(--accent)]">
      <motion.label
        className="pointer-events-none absolute left-0 text-white/45"
        animate={{
          top: active ? 0 : 18,
          fontSize: active ? '0.7rem' : '1rem',
          letterSpacing: active ? '0.15em' : '0em',
        }}
        transition={{ duration: 0.2 }}
      >
        {active ? label.toUpperCase() : label}
      </motion.label>

      {multiline ? (
        <textarea
          rows={3}
          value={value}
          placeholder={focused ? placeholder : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${shared} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={focused ? placeholder : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={shared}
        />
      )}
      {error && <span className="absolute -bottom-5 left-0 text-xs text-red-400">{error}</span>}
    </div>
  );
}
