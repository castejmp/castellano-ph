import * as THREE from 'three';
import { ANCHORS } from './world.js';

/**
 * LA PANTALLA LED — contenido generativo audio-reactivo (pulse.show).
 * Shader propio: grilla de píxeles LED + plasma + anillos del bajo +
 * barras de agudos. Encima, un ICONO por estación dibujado en un atlas
 * de canvas: |o| (la marca), Ai, cámara, REC, VJ, edición, drone,
 * anillos. El icono entra y sale con un crossfade al cambiar de shot.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime, uBass, uMid, uTreb, uBoost, uIconMix;
  uniform vec3 uA, uB, uC;
  uniform sampler2D uIcons;
  uniform vec2 uIconCell;
  varying vec2 vUv;

  void main() {
    vec2 grid = vec2(110.0, 44.0);
    vec2 cell = (floor(vUv * grid) + 0.5) / grid;
    vec2 cuv  = fract(vUv * grid);
    float t = uTime;

    float p = sin(cell.x * 9.0 + t * 1.1)
            + sin(cell.y * 7.0 - t * 0.8)
            + sin((cell.x + cell.y) * (9.0 + uMid * 8.0) + t * 0.6);
    p = p / 3.0 * 0.5 + 0.5;

    vec2 ar = (cell - 0.5) * vec2(2.4, 1.0);
    float d = length(ar);
    float ringR = fract(t * 0.32);
    float ring = smoothstep(0.06, 0.0, abs(d - ringR * 1.3)) * (0.25 + uBass * 1.4);

    float bh = uTreb * (0.45 + 0.55 * (0.5 + 0.5 * sin(cell.x * 34.0 + t * 2.0)));
    float bars = step(cell.y, bh * 0.55) * 0.8;

    float v = clamp(p * 0.55 + ring + bars, 0.0, 1.4);
    vec3 col = mix(uB, uA, clamp(v, 0.0, 1.0));
    col = mix(col, uC, smoothstep(0.8, 1.3, v) * (0.3 + uTreb * 0.7));

    // Icono de la estación: cuadrado central, muestreado del atlas
    // sobre la grilla de celdas para que sea "de píxeles LED".
    vec2 iuv = (cell - vec2(0.34, 0.06)) / vec2(0.32, 0.88);
    float icon = 0.0;
    if (iuv.x > 0.0 && iuv.x < 1.0 && iuv.y > 0.0 && iuv.y < 1.0) {
      icon = texture2D(uIcons, uIconCell + iuv * vec2(0.25, 0.5)).a * uIconMix;
    }
    col = mix(col, vec3(1.0) * (0.75 + uBass * 0.45), icon * 0.92);

    float px = smoothstep(0.0, 0.22, cuv.x) * smoothstep(1.0, 0.78, cuv.x)
             * smoothstep(0.0, 0.28, cuv.y) * smoothstep(1.0, 0.72, cuv.y);
    col *= 0.3 + 0.7 * px;

    col *= (0.55 + uBass * 1.1) * (1.0 + uBoost * 0.9);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Atlas 4×2 de iconos (celdas de 256), dibujado a mano en canvas. */
function buildIconAtlas() {
  const cnv = document.createElement('canvas');
  cnv.width = 1024; cnv.height = 512;
  const c = cnv.getContext('2d');
  c.fillStyle = '#fff';
  c.strokeStyle = '#fff';
  c.lineCap = 'round';

  const inCell = (i, draw) => {
    c.save();
    c.translate((i % 4) * 256, Math.floor(i / 4) * 256);
    draw();
    c.restore();
  };
  const text = (s, size, y = 128) => {
    c.font = `900 ${size}px system-ui, -apple-system, Arial, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(s, 128, y);
  };

  // 0 · |o| — la marca.
  inCell(0, () => {
    c.fillRect(52, 76, 24, 104);
    c.fillRect(180, 76, 24, 104);
    c.lineWidth = 24;
    c.beginPath(); c.arc(128, 128, 44, 0, Math.PI * 2); c.stroke();
  });
  // 1 · Ai — diseño.
  inCell(1, () => {
    c.lineWidth = 14;
    c.strokeRect(44, 44, 168, 168);
    text('Ai', 104);
  });
  // 2 · cámara de fotos.
  inCell(2, () => {
    c.fillRect(92, 62, 64, 26);
    c.fillRect(44, 84, 168, 112);
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(128, 140, 36, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.lineWidth = 14;
    c.beginPath(); c.arc(128, 140, 36, 0, Math.PI * 2); c.stroke();
  });
  // 3 · REC.
  inCell(3, () => {
    c.beginPath(); c.arc(128, 104, 40, 0, Math.PI * 2); c.fill();
    text('REC', 56, 196);
  });
  // 4 · VJ.
  inCell(4, () => text('VJ', 120));
  // 5 · edición: play + clips de timeline.
  inCell(5, () => {
    c.beginPath(); c.moveTo(100, 52); c.lineTo(100, 116); c.lineTo(162, 84); c.closePath(); c.fill();
    c.fillRect(44, 144, 76, 22);
    c.fillRect(130, 144, 84, 22);
    c.fillRect(44, 178, 122, 22);
  });
  // 6 · drone: 4 rotores + cuerpo.
  inCell(6, () => {
    c.lineWidth = 12;
    for (const [dx, dy] of [[80, 80], [176, 80], [80, 176], [176, 176]]) {
      c.beginPath(); c.arc(dx, dy, 28, 0, Math.PI * 2); c.stroke();
    }
    c.lineWidth = 16;
    c.beginPath(); c.moveTo(92, 92); c.lineTo(164, 164); c.moveTo(164, 92); c.lineTo(92, 164); c.stroke();
    c.fillRect(112, 112, 32, 32);
  });
  // 7 · inmersivo: anillos concéntricos.
  inCell(7, () => {
    c.lineWidth = 13;
    for (const r of [32, 64, 96]) {
      c.beginPath(); c.arc(128, 128, r, 0, Math.PI * 2); c.stroke();
    }
  });

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Estación → celda del atlas. */
const ICON_BY_STATION = [0, 1, 2, 3, 4, 5, 6, 7, 0];
const cellUV = (i) => [(i % 4) * 0.25, Math.floor(i / 4) === 0 ? 0.5 : 0.0];

export class LedWall {
  constructor(scene) {
    const { pos, size } = ANCHORS.led;
    this.uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreb: { value: 0 },
      uBoost: { value: 0 },
      uIconMix: { value: 0 },
      uIcons: { value: buildIconAtlas() },
      uIconCell: { value: new THREE.Vector2(0, 0.5) },
      uA: { value: new THREE.Color('#ff2b2b') },
      uB: { value: new THREE.Color('#5e0716') },
      uC: { value: new THREE.Color('#ffd166') },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      side: THREE.DoubleSide, // las curvas se ven desde adentro
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
    mesh.position.set(...pos);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);
    this.mesh = mesh;

    // Pantallas CURVAS en las esquinas: comparten material y uniforms,
    // así reaccionan exactamente igual que la principal.
    for (const sign of [-1, 1]) {
      const arc = new THREE.CylinderGeometry(
        3.5, 3.5, size[1], 14, 1, true,
        sign > 0 ? Math.PI - 0.95 : Math.PI, 0.95
      );
      const corner = new THREE.Mesh(arc, mat);
      corner.position.set(sign * 10, pos[1], -18.6);
      corner.matrixAutoUpdate = false;
      corner.updateMatrix();
      scene.add(corner);
    }
    this._icon = 0;
  }

  /** boost: peso de INMERSIVO · station: estación flotante (icono). */
  update(t, bands, boost, station, dt = 0.016) {
    const u = this.uniforms;
    u.uTime.value = t;
    u.uBass.value = bands.bass;
    u.uMid.value = bands.mid;
    u.uTreb.value = bands.treb;
    u.uBoost.value = boost;

    // Crossfade de icono al cambiar de estación.
    const target = ICON_BY_STATION[Math.max(0, Math.min(8, Math.round(station)))];
    if (target !== this._icon) {
      u.uIconMix.value -= dt * 5;
      if (u.uIconMix.value <= 0) {
        this._icon = target;
        u.uIconCell.value.set(...cellUV(target));
        u.uIconMix.value = 0;
      }
    } else {
      u.uIconMix.value = Math.min(1, u.uIconMix.value + dt * 3);
    }
  }
}
