import { ExperienceProvider } from './state/ExperienceContext';
import { useLenis } from './hooks/useLenis';
import { useReducedMotion } from './hooks/useReducedMotion';
import { ParticleScene } from './three/ParticleScene';
import { Nav } from './components/Nav';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { Hero } from './sections/Hero';
import { Manifesto } from './sections/Manifesto';
import { Services } from './sections/Services';
import { Portfolio } from './sections/Portfolio';
import { Packs } from './sections/Packs';
import { PulseShow } from './sections/PulseShow';
import { Process } from './sections/Process';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';

export default function App() {
  const reduced = useReducedMotion();
  // El scroll suave se apaga si el usuario pidió reducir movimiento.
  useLenis(!reduced);

  return (
    <ExperienceProvider>
      {/* Hilo conductor: el campo de partículas detrás de todo el contenido. */}
      <ParticleScene />

      <Nav />
      <WhatsAppFloat />

      <main className="relative">
        <Hero />
        <Manifesto />
        <Services />
        <Portfolio />
        <Packs />
        <PulseShow />
        <Process />
        <Contact />
      </main>

      <Footer />
    </ExperienceProvider>
  );
}
