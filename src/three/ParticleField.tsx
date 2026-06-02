import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { useExperience } from '../state/ExperienceContext';
import { getShapePositions } from './particleShapes';
import { particleFragmentShader, particleVertexShader } from './particleShaders';
import { BRAND } from '../config';

interface ParticleFieldProps {
  count: number;
}

/**
 * El campo de partículas: un único sistema de puntos que recorre todo el
 * sitio. Morfea entre figuras según la sección/servicio activo, reacciona al
 * puntero y, en Modo Vivo, late al ritmo del audio.
 */
export function ParticleField({ count }: ParticleFieldProps) {
  const { pointer, bands, live, shape } = useExperience();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const { viewport } = useThree();

  // Atributos estáticos generados una sola vez.
  const { positions, targets, seeds, scales } = useMemo(() => {
    const positions = getShapePositions('cloud', count).slice();
    const targets = getShapePositions('monogram', count).slice();
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      scales[i] = 0.6 + Math.random() * 1.1;
    }
    return { positions, targets, seeds, scales };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerActive: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uLevel: { value: 0 },
      uLive: { value: 0 },
      uSize: { value: 1.5 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new THREE.Color(BRAND.accent) },
      uColorB: { value: new THREE.Color(BRAND.accentWarm) },
    }),
    []
  );

  // Morphing al cambiar la figura objetivo. Pasamos siempre por la nube
  // (la luz se dispersa y se reagrupa) para una transición orgánica.
  useEffect(() => {
    const mat = matRef.current;
    const geom = geomRef.current;
    if (!mat || !geom) return;
    const uMorph = mat.uniforms.uMorph;
    gsap.killTweensOf(uMorph);

    const swapTarget = () => {
      const arr = getShapePositions(shape, count);
      const attr = geom.getAttribute('aTarget') as THREE.BufferAttribute;
      (attr.array as Float32Array).set(arr);
      attr.needsUpdate = true;
    };

    if (shape === 'cloud') {
      gsap.to(uMorph, { value: 0, duration: 1.2, ease: 'power2.inOut' });
    } else {
      gsap
        .timeline()
        .to(uMorph, { value: 0, duration: 0.45, ease: 'power2.in' })
        .add(swapTarget)
        .to(uMorph, { value: 1, duration: 0.95, ease: 'power2.out' });
    }
  }, [shape, count]);

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime.value += delta;

    // Puntero → coordenadas del mundo (al plano z=0).
    const p = pointer.current;
    u.uPointer.value.set((p.x * viewport.width) / 2, (p.y * viewport.height) / 2);
    // El "active" decae suavemente cuando el puntero se queda quieto.
    const targetActive = p.active ? 1 : 0;
    u.uPointerActive.value += (targetActive - u.uPointerActive.value) * 0.06;

    // Audio (Modo Vivo).
    u.uBass.value = bands.bass;
    u.uMid.value = bands.mid;
    u.uTreble.value = bands.treble;
    u.uLevel.value = bands.level;
    u.uLive.value += ((live ? 1 : 0) - u.uLive.value) * 0.08;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aTarget" args={[targets, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
