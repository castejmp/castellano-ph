import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * POSTPROCESO — solo desktop, con kill-switch y 4 ESTILOS:
 *   cine  → bloom + DoF real + viñeta (la estética curada)
 *   flat  → viñeta suave (el look lo ponen los materiales toon + contornos)
 *   retro → cuantización 5 bits + dithering Bayer (la resolución baja
 *           la pone el FXManager vía pixelRatio + nearest)
 *   vhs   → scanlines, chroma shift, ruido y glitches de tracking
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

/* Cuantización 15 bpp + Bayer: el color de una consola de los 90. */
const RETRO = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: VIGNETTE.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
    float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float d = bayer4(gl_FragCoord.xy) - 0.5;
      c = floor(c * 31.0 + 0.5 + d * 0.9) / 31.0; // 5 bits por canal
      c = pow(c, vec3(1.05)); // leve crush de sombras
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

/* VHS: el evento visto por la cámara del estudio. */
const VHS = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: VIGNETTE.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float t = uTime;
      // Tracking: micro-ondulación horizontal.
      uv.x += sin(uv.y * 720.0 + t * 7.0) * 0.0007;
      // Chroma shift que respira.
      float off = 0.0017 * (0.6 + 0.4 * sin(t * 1.7));
      vec3 c;
      c.r = texture2D(tDiffuse, uv + vec2(off, 0.0)).r;
      c.g = texture2D(tDiffuse, uv).g;
      c.b = texture2D(tDiffuse, uv - vec2(off, 0.0)).b;
      // Scanlines + ruido de cinta.
      c *= 0.88 + 0.12 * sin(uv.y * 3390.0);
      c += rnd(uv * vec2(640.0, 480.0) + fract(t) * 9.0) * 0.05 - 0.025;
      // Línea de glitch ocasional.
      float gl = step(0.997, rnd(vec2(floor(uv.y * 220.0), floor(t * 8.0))));
      c = mix(c, vec3(rnd(uv + t)), gl * 0.45);
      // Viñeta de lente.
      float d = distance(uv, vec2(0.5));
      c *= 1.0 - smoothstep(0.45, 0.95, d) * 0.45;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

export class Post {
  constructor(renderer, scene, camera) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bokeh = new BokehPass(scene, camera, {
      focus: 20, aperture: 0.0001, maxblur: 0.0055,
    });
    this.composer.addPass(this.bokeh);

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight), 0.38, 0.7, 0.82
    );
    this.composer.addPass(this.bloom);

    this.vignette = new ShaderPass(VIGNETTE);
    this.composer.addPass(this.vignette);

    this.composer.addPass(new OutputPass());

    // Estilizadores finales (después del tonemapping).
    this.retro = new ShaderPass(RETRO);
    this.composer.addPass(this.retro);
    this.vhs = new ShaderPass(VHS);
    this.composer.addPass(this.vhs);

    this.bokehOn = true;
    this.setStyle('cine');
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
  }

  setBokeh(on) {
    this.bokehOn = on;
    this.bokeh.enabled = on && this.style === 'cine';
  }

  setStyle(style) {
    this.style = style;
    this.bokeh.enabled = this.bokehOn && style === 'cine';
    this.bloom.enabled = style === 'cine' || style === 'flat' || style === 'vhs';
    this.bloom.strength = style === 'flat' ? 0.22 : style === 'vhs' ? 0.3 : 0.38;
    this.vignette.enabled = style === 'cine' || style === 'flat';
    this.vignette.uniforms.uStrength.value = style === 'flat' ? 0.28 : 0.42;
    this.retro.enabled = style === 'retro';
    this.vhs.enabled = style === 'vhs';
  }

  /**
   * focus: distancia cámara→lookAt · fov: escala la apertura ·
   * dofBoost: 0..1 jugador seleccionado · t: tiempo (vhs)
   */
  render(focus, fov, dofBoost = 0, t = 0) {
    if (this.bokeh.enabled) {
      const u = this.bokeh.uniforms;
      u.focus.value = focus;
      u.aperture.value = Math.max(0, (70 - fov) / 70) * 0.00012 + dofBoost * 0.00028;
    }
    if (this.vhs.enabled) this.vhs.uniforms.uTime.value = t;
    this.composer.render();
  }
}
