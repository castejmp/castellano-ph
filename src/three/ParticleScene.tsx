import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { ParticleField } from './ParticleField';
import { useIsMobile } from '../hooks/useIsMobile';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Lienzo fijo a pantalla completa que aloja el campo de partículas detrás de
 * todo el contenido. Es el hilo conductor visual del sitio.
 *
 * Degradación con gracia:
 *  - prefers-reduced-motion → no se monta el canvas; queda un gradiente animado.
 *  - mobile → menos partículas y menor pixel ratio.
 */
export function ParticleScene() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 35%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%), #0a0a0b',
        }}
      />
    );
  }

  const count = isMobile ? 2600 : 6500;

  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 52 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <ParticleField count={count} />
        <EffectComposer>
          <Bloom
            intensity={isMobile ? 0.9 : 1.4}
            luminanceThreshold={0.05}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
