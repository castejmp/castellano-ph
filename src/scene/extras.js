import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ANCHORS } from './world.js';

/**
 * LOS MOMENTOS — todo lo que se mueve o emite luz propia:
 * festón sobre la pista, drone en loop, flash real del set de fotos,
 * pantalla de edición, superficies de mapping y haze de partículas.
 */

/* Shader compartido del mapping: versión gruesa del LED, con opacidad. */
const MAP_FRAG = /* glsl */ `
  uniform float uTime, uBass, uMid, uOpacity;
  uniform vec3 uA, uB;
  varying vec2 vUv;
  void main() {
    vec2 grid = vec2(34.0, 12.0);
    vec2 cell = (floor(vUv * grid) + 0.5) / grid;
    float t = uTime * 0.7;
    float p = sin(cell.x * 7.0 + t) + sin(cell.y * 5.0 - t * 1.3) + sin((cell.x - cell.y) * 9.0 + t * 0.5);
    p = p / 3.0 * 0.5 + 0.5;
    float wave = smoothstep(0.12, 0.0, abs(vUv.x - fract(t * 0.23))) * uBass;
    vec3 col = mix(uB, uA, clamp(p + wave, 0.0, 1.0)) * (0.4 + uBass * 1.2 + uMid * 0.4);
    gl_FragColor = vec4(col, uOpacity);
  }
`;
const MAP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export class Extras {
  constructor(scene) {
    this.scene = scene;

    /* ── Festón de luces sobre la pista (1 draw call, color por modo) ── */
    const bulbs = [];
    const poles = ANCHORS.festoonPoles;
    const pairs = [ [poles[0], poles[3]], [poles[1], poles[2]] ];
    for (const [a, b] of pairs) {
      for (let i = 0; i <= 18; i++) {
        const u = i / 18;
        const x = a[0] + (b[0] - a[0]) * u;
        const z = a[2] + (b[2] - a[2]) * u;
        const y = a[1] - Math.sin(u * Math.PI) * 0.85; // caída de catenaria
        bulbs.push(new THREE.SphereGeometry(0.07, 5, 4).translate(x, y, z).toNonIndexed());
      }
    }
    this.festoon = new THREE.Mesh(
      mergeGeometries(bulbs),
      new THREE.MeshBasicMaterial({ color: '#ffd9a0' })
    );
    this.festoon.matrixAutoUpdate = false;
    scene.add(this.festoon);

    /* ── Drone en loop ── */
    const droneParts = [
      new THREE.BoxGeometry(0.5, 0.14, 0.5).toNonIndexed(),
      new THREE.CylinderGeometry(0.2, 0.2, 0.02, 8).translate(-0.32, 0.1, -0.32).toNonIndexed(),
      new THREE.CylinderGeometry(0.2, 0.2, 0.02, 8).translate(0.32, 0.1, -0.32).toNonIndexed(),
      new THREE.CylinderGeometry(0.2, 0.2, 0.02, 8).translate(-0.32, 0.1, 0.32).toNonIndexed(),
      new THREE.CylinderGeometry(0.2, 0.2, 0.02, 8).translate(0.32, 0.1, 0.32).toNonIndexed(),
    ];
    this.drone = new THREE.Mesh(
      mergeGeometries(droneParts),
      new THREE.MeshLambertMaterial({ color: '#2a2a32' })
    );
    this.droneLight = new THREE.PointLight('#ff3030', 4, 7);
    this.drone.add(this.droneLight);
    this.dronePos = new THREE.Vector3();
    scene.add(this.drone);

    /* ── Flash real del set de fotos ── */
    this.flash = new THREE.PointLight('#ffffff', 0, 40, 1.6);
    this.flash.position.set(...ANCHORS.flashAt);
    scene.add(this.flash);
    this.flashEnergy = 0;

    /* ── Pantalla de edición: timeline dibujado a mano ── */
    const cnv = document.createElement('canvas');
    cnv.width = 256; cnv.height = 160;
    const c2 = cnv.getContext('2d');
    c2.fillStyle = '#101014'; c2.fillRect(0, 0, 256, 160);
    c2.fillStyle = '#1c1c24'; c2.fillRect(0, 96, 256, 64); // zona timeline
    const clipCols = ['#f63f2f', '#fe720c', '#feca0d', '#7fc527', '#1f93e0'];
    let cx = 6;
    for (let i = 0; i < 9; i++) {
      const w = 14 + ((i * 37) % 30);
      c2.fillStyle = clipCols[i % 5];
      c2.fillRect(cx, 104 + (i % 3) * 18, w, 12);
      cx += w + 4;
    }
    c2.fillStyle = '#2e2e3a'; c2.fillRect(8, 8, 150, 80); // visor
    c2.fillStyle = '#e9e6dd'; c2.fillRect(168, 8, 80, 36); // panel
    c2.fillStyle = '#55555f'; c2.fillRect(168, 52, 80, 36);
    c2.fillStyle = '#fff'; c2.fillRect(127, 96, 2, 64); // playhead
    const tex = new THREE.CanvasTexture(cnv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const es = ANCHORS.editScreen;
    this.editScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.84),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    this.editScreen.position.set(...es.pos);
    this.editScreen.rotation.y = es.ry;
    this.editScreen.translateZ(0.05);
    this.editScreen.matrixAutoUpdate = false;
    this.editScreen.updateMatrix();
    scene.add(this.editScreen);

    /* ── Superficies de mapping (INMERSIVO) ── */
    this.mapUniforms = {
      uTime: { value: 0 }, uBass: { value: 0 }, uMid: { value: 0 },
      uOpacity: { value: 0 },
      uA: { value: new THREE.Color('#ff2b2b') },
      uB: { value: new THREE.Color('#5e0716') },
    };
    this.mapPanels = ANCHORS.mapping.map((m) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(m.size[0], m.size[1]),
        new THREE.ShaderMaterial({
          vertexShader: MAP_VERT, fragmentShader: MAP_FRAG,
          uniforms: this.mapUniforms, transparent: true, depthWrite: false,
        })
      );
      mesh.position.set(...m.pos);
      mesh.rotation.y = m.ry;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.visible = false;
      this.scene.add(mesh);
      return mesh;
    });

    /* ── Haze / partículas ── */
    const N = 520;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 58;
      pos[i * 3 + 1] = Math.random() * 11 + 0.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particleMat = new THREE.PointsMaterial({
      color: '#ff5a6e', size: 0.16, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    this.particles = new THREE.Points(pg, this.particleMat);
    scene.add(this.particles);
  }

  fireFlash() {
    this.flashEnergy = 1;
  }

  /**
   * t: tiempo · bands: {bass,mid,treb} · immersiveW: peso estación 7 (0..1)
   */
  update(t, dt, bands, immersiveW) {
    // Drone: órbita con deriva vertical; siempre vuela, la cámara lo busca en la 6.
    const dc = ANCHORS.droneCenter;
    const a = t * 0.42;
    this.dronePos.set(
      dc[0] + Math.cos(a) * 15,
      dc[1] + Math.sin(t * 0.9) * 1.3,
      dc[2] + Math.sin(a) * 9.5
    );
    this.drone.position.copy(this.dronePos);
    this.drone.rotation.y = -a + Math.PI / 2;
    this.drone.rotation.z = Math.sin(t * 0.42) * 0.12; // banking
    this.droneLight.intensity = 2 + ((t * 2) % 1 > 0.5 ? 3 : 0); // baliza

    // Flash: pico inmediato, decaimiento rápido.
    if (this.flashEnergy > 0.001) {
      this.flash.intensity = this.flashEnergy * 1600;
      this.flashEnergy *= Math.pow(0.000001, dt); // ~300 ms de cola
    } else {
      this.flash.intensity = 0;
    }

    // Mapping: solo visible cuando INMERSIVO pesa (ahorra fill-rate).
    const mu = this.mapUniforms;
    mu.uTime.value = t;
    mu.uBass.value = bands.bass;
    mu.uMid.value = bands.mid;
    mu.uOpacity.value += (immersiveW * 0.92 - mu.uOpacity.value) * 0.08;
    const visible = mu.uOpacity.value > 0.02;
    for (const p of this.mapPanels) p.visible = visible;

    // Haze: deriva lenta + pulso con agudos.
    this.particles.rotation.y = t * 0.011;
    this.particleMat.size = 0.16 * (1 + bands.treb * 0.9);
  }
}
