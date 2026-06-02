import { motion } from 'framer-motion';
import { whatsappLink } from '../config';
import { WhatsAppIcon } from './icons';

/**
 * Botón flotante de WhatsApp, persistente en todo el sitio.
 * Clave para Argentina: es el canal de consulta principal.
 */
export function WhatsAppFloat() {
  return (
    <motion.a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablemos por WhatsApp"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, type: 'spring', stiffness: 200, damping: 16 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-ink shadow-[0_8px_30px_-6px_rgba(37,211,102,0.6)] md:bottom-7 md:right-7"
    >
      <span className="absolute inset-0 animate-pulseGlow rounded-full bg-[#25D366]/40 blur-md" />
      <WhatsAppIcon className="relative h-7 w-7" />
    </motion.a>
  );
}
