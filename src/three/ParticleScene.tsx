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
 *  - Siempre se muestran las partículas (incluso con prefers-reduced-motion,
 *    pero quietas) para no perder la identidad visual.
 *  - mobile → menos partículas, partículas más grandes y SIN postprocessing
 *    (el Bloom falla en algunas GPUs móviles y dejaba el canvas vacío).
 *  - Un degradado de respaldo queda detrás por si el navegador no soporta WebGL.
 */
export function ParticleScene() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  const count = isMobile ? 2600 : 6500;
  // En mobile no hay Bloom, así que agrandamos un poco las partículas.
  const size = isMobile ? 2.6 : 1.6;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(60% 60% at 50% 32%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), #0a0a0b',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 11], fov: 52 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <ParticleField count={count} size={size} calm={reduced} />
        {/* Bloom solo en desktop: en mobile es la causa más común de canvas en negro. */}
        {!isMobile && !reduced && (
          <EffectComposer>
            <Bloom
              intensity={1.4}
              luminanceThreshold={0.05}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
