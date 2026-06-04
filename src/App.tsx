import { useLenis } from './hooks/useLenis';
import { useReducedMotion } from './hooks/useReducedMotion';
import { Backdrop } from './components/Backdrop';
import { Loader } from './components/Loader';
import { Nav } from './components/Nav';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { Hero } from './sections/Hero';
import { Manifesto } from './sections/Manifesto';
import { Captura } from './sections/pillars/Captura';
import { Diseno } from './sections/pillars/Diseno';
import { Experiencia } from './sections/pillars/Experiencia';
import { Packs } from './sections/Packs';
import { Process } from './sections/Process';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';

export default function App() {
  const reduced = useReducedMotion();
  // El scroll suave se apaga si el usuario pidió reducir movimiento.
  useLenis(!reduced);

  return (
    <>
      {/* Intro cinematográfica mientras carga la web. */}
      <Loader />

      {/* Fondo cinematográfico (sin partículas): halo de luz + viñeta + grano. */}
      <Backdrop />

      <Nav />
      <WhatsAppFloat />

      <main className="relative z-10">
        <Hero />
        <Manifesto />

        {/* Los 3 actos — cada uno con su propio eje de movimiento. */}
        <Captura />
        <Diseno />
        <Experiencia />

        <Packs />
        <Process />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
