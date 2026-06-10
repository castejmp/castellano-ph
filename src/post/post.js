import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * POSTPROCESO — solo desktop, y con kill-switch.
 * Bloom suave (la LED y los practicals respiran), DoF real con Bokeh
 * (los teles enfocan de verdad) y viñeta de óptica. Nada de aberraciones
 * ni glitch: la imagen es limpia, como una cámara de cine.
 */

const VIGNETTE = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.42 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - smoothstep(0.42, 0.95, d) * uStrength;
      gl_FragColor = c;
    }
  `,
};

export class Post {
  constructor(renderer, scene, camera) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bokeh = new BokehPass(scene, camera, {
      focus: 20, aperture: 0.0001, maxblur: 0.0075,
    });
    this.composer.addPass(this.bokeh);

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight), 0.38, 0.7, 0.82
    );
    this.composer.addPass(this.bloom);

    this.composer.addPass(new ShaderPass(VIGNETTE));
    this.composer.addPass(new OutputPass());

    this.bokehOn = true;
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
  }

  setBokeh(on) {
    this.bokehOn = on;
    this.bokeh.enabled = on;
  }

  /** focus: distancia cámara→lookAt · fov: para escalar la apertura. */
  render(focus, fov) {
    if (this.bokehOn) {
      const u = this.bokeh.uniforms;
      u.focus.value = focus;
      // Tele = más DoF; gran angular = casi todo en foco.
      u.aperture.value = Math.max(0, (70 - fov) / 70) * 0.00012;
    }
    this.composer.render();
  }
}
