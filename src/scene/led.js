import * as THREE from 'three';
import { ANCHORS } from './world.js';

/**
 * LA PANTALLA LED — contenido generativo audio-reactivo (pulse.show).
 * Shader propio: grilla de píxeles LED + plasma + anillos que expulsa
 * el bajo + barras que dibujan los agudos. La paleta la pone el modo
 * activo; el audio la maneja en vivo. Nada enlatado.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime, uBass, uMid, uTreb, uBoost;
  uniform vec3 uA, uB, uC;
  varying vec2 vUv;

  void main() {
    vec2 grid = vec2(110.0, 44.0);
    vec2 cell = (floor(vUv * grid) + 0.5) / grid;
    vec2 cuv  = fract(vUv * grid);
    float t = uTime;

    // Plasma de base que muta con los medios.
    float p = sin(cell.x * 9.0 + t * 1.1)
            + sin(cell.y * 7.0 - t * 0.8)
            + sin((cell.x + cell.y) * (9.0 + uMid * 8.0) + t * 0.6);
    p = p / 3.0 * 0.5 + 0.5;

    // Anillo que expulsa el bajo desde el centro.
    vec2 ar = (cell - 0.5) * vec2(2.4, 1.0);
    float d = length(ar);
    float ringR = fract(t * 0.32);
    float ring = smoothstep(0.06, 0.0, abs(d - ringR * 1.3)) * (0.25 + uBass * 1.4);

    // Barras de ecualizador abajo, dibujadas por los agudos.
    float bh = uTreb * (0.45 + 0.55 * (0.5 + 0.5 * sin(cell.x * 34.0 + t * 2.0)));
    float bars = step(cell.y, bh * 0.55) * 0.8;

    float v = clamp(p * 0.55 + ring + bars, 0.0, 1.4);
    vec3 col = mix(uB, uA, clamp(v, 0.0, 1.0));
    col = mix(col, uC, smoothstep(0.8, 1.3, v) * (0.3 + uTreb * 0.7));

    // Máscara de píxel LED: cada celda es una lamparita.
    float px = smoothstep(0.0, 0.22, cuv.x) * smoothstep(1.0, 0.78, cuv.x)
             * smoothstep(0.0, 0.28, cuv.y) * smoothstep(1.0, 0.72, cuv.y);
    col *= 0.3 + 0.7 * px;

    // El bajo bombea el brillo global; INMERSIVO lo lleva al límite.
    col *= (0.55 + uBass * 1.1) * (1.0 + uBoost * 0.9);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class LedWall {
  constructor(scene) {
    const { pos, size } = ANCHORS.led;
    this.uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreb: { value: 0 },
      uBoost: { value: 0 },
      uA: { value: new THREE.Color('#ff2b2b') },
      uB: { value: new THREE.Color('#5e0716') },
      uC: { value: new THREE.Color('#ffd166') },
    };
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms })
    );
    mesh.position.set(...pos);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);
    this.mesh = mesh;
  }

  /** boost: 0..1, peso de la estación INMERSIVO. */
  update(t, bands, boost) {
    const u = this.uniforms;
    u.uTime.value = t;
    u.uBass.value = bands.bass;
    u.uMid.value = bands.mid;
    u.uTreb.value = bands.treb;
    u.uBoost.value = boost;
  }
}
