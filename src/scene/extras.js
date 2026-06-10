import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ANCHORS } from './world.js';
import { STATION_SPOTS } from './crowd.js';

/**
 * LOS MOMENTOS — todo lo que se mueve o emite luz propia:
 * el neón "castellano" al borde de la pista, la parrilla de luces
 * (beams de cabezales, washes, strobos), el spotlight de "jugador
 * seleccionado" sobre el operador activo, el drone, el flash real,
 * la pantalla de edición, el mapping y el haze.
 */

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

/** Texto blanco sobre canvas transparente → textura para el neón. */
function neonTexture(text) {
  const cnv = document.createElement('canvas');
  cnv.width = 1024; cnv.height = 224;
  const c = cnv.getContext('2d');
  c.font = '900 150px system-ui, -apple-system, Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.shadowColor = 'rgba(255,255,255,0.9)';
  c.shadowBlur = 26;
  c.fillStyle = '#ffffff';
  c.fillText(text, 512, 118);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Extras {
  constructor(scene) {
    this.scene = scene;

    /* ── Neones "castellano" a ambos lados de la pista, mirando arriba ── */
    const neon = ANCHORS.neon;
    this.neonMat = new THREE.MeshBasicMaterial({
      map: neonTexture('castellano'), transparent: true, depthWrite: false,
    });
    const neonGeo = new THREE.PlaneGeometry(...neon.size);
    for (const spot of neon.spots) {
      const m = new THREE.Mesh(neonGeo, this.neonMat);
      m.position.set(...spot.pos);
      m.rotation.set(-Math.PI / 2, 0, spot.rz); // al piso, legible desde afuera
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      scene.add(m);
    }

    /* ── Parrilla: beams de cabezales móviles ── */
    this.beamMat = new THREE.MeshBasicMaterial({
      color: '#ff2b2b', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const beamGeo = new THREE.ConeGeometry(1.35, 7.5, 10, 1, true);
    beamGeo.translate(0, -3.75, 0); // pivote en el cabezal
    this.beams = ANCHORS.rig.heads.map((p, i) => {
      const g = new THREE.Group();
      g.position.set(p[0], p[1], p[2]);
      const cone = new THREE.Mesh(beamGeo, this.beamMat);
      g.add(cone);
      g.userData.i = i;
      this.scene.add(g);
      return g;
    });

    /* ── Washes: lentes que pulsan con el bajo ── */
    this.washMat = new THREE.MeshBasicMaterial({
      color: '#ff3355', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const washGeo = new THREE.CircleGeometry(0.17, 10);
    for (const [wx, wy, wz] of ANCHORS.rig.washes) {
      const lens = new THREE.Mesh(washGeo, this.washMat);
      lens.position.set(wx, wy - 0.16, wz + 0.12);
      lens.rotation.x = -Math.PI / 2 + 0.9;
      lens.matrixAutoUpdate = false;
      lens.updateMatrix();
      scene.add(lens);
    }

    /* ── Strobos: barras blancas que destellan con los agudos ── */
    this.strobeMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (const [sx, sy, sz] of ANCHORS.rig.strobes) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.09), this.strobeMat);
      bar.position.set(sx, sy - 0.07, sz + 0.08);
      bar.matrixAutoUpdate = false;
      bar.updateMatrix();
      scene.add(bar);
    }
    this.strobeE = 0;
    this._strobeCd = 0;

    /* ── Spotlight "jugador seleccionado" — suave, y el haz llega al piso ── */
    this.spot = new THREE.SpotLight('#ffffff', 0, 20, 0.34, 0.9, 1.4);
    this.spot.position.set(0, 6.6, -9);
    scene.add(this.spot, this.spot.target);
    this.spotConeMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const spotConeGeo = new THREE.ConeGeometry(1.05, 6.7, 12, 1, true);
    spotConeGeo.translate(0, -3.35, 0); // del cabezal hasta el piso
    this.spotCone = new THREE.Mesh(spotConeGeo, this.spotConeMat);
    this.spotCone.position.copy(this.spot.position);
    scene.add(this.spotCone);

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

    /* ── Flash real (donde está el fotógrafo, entre la gente) ── */
    this.flash = new THREE.PointLight('#ffffff', 0, 40, 1.6);
    this.flash.position.set(...ANCHORS.flashAt);
    scene.add(this.flash);
    this.flashEnergy = 0;

    // La pantalla de edición ya no hace falta: el modelo GLB del editor
    // viene con su propia PC.

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

  /** Llamado por el ThemeEngine con el estado interpolado del modo. */
  applyTheme(L) {
    this.particleMat.color.copy(L.particles);
    this.particleMat.opacity = L.particleOpacity;
    this.beamMat.color.copy(L.led0);
    this.washMat.color.copy(L.key);
  }

  /**
   * t/dt: tiempo · bands · immersiveW: peso estación 7 ·
   * stationFloat: para el spotlight de jugador seleccionado.
   */
  update(t, dt, bands, immersiveW, stationFloat = 0) {
    // Drone: órbita con deriva vertical.
    const dc = ANCHORS.droneCenter;
    const a = t * 0.42;
    this.dronePos.set(
      dc[0] + Math.cos(a) * 15,
      dc[1] + Math.sin(t * 0.9) * 1.3,
      dc[2] + Math.sin(a) * 9.5
    );
    this.drone.position.copy(this.dronePos);
    this.drone.rotation.y = -a + Math.PI / 2;
    this.drone.rotation.z = Math.sin(t * 0.42) * 0.12;
    this.droneLight.intensity = 2 + ((t * 2) % 1 > 0.5 ? 3 : 0);

    // Flash del fotógrafo.
    if (this.flashEnergy > 0.001) {
      this.flash.intensity = this.flashEnergy * 1600;
      this.flashEnergy *= Math.pow(0.000001, dt);
    } else {
      this.flash.intensity = 0;
    }

    // Beams de cabezales: barren la pista a distintas velocidades.
    this.beamMat.opacity = 0.05 + bands.bass * 0.13 + immersiveW * 0.06;
    for (const g of this.beams) {
      const i = g.userData.i;
      g.rotation.z = Math.sin(t * (0.55 + i * 0.13) + i * 1.7) * 0.55;
      g.rotation.x = -0.25 + Math.sin(t * 0.4 + i * 2.3) * 0.35;
    }

    // Washes pulsan con el bajo; strobos destellan con picos de agudos.
    this.washMat.opacity = 0.25 + bands.bass * 0.7;
    this._strobeCd -= dt;
    if (bands.treb > 0.72 && this._strobeCd <= 0) {
      this.strobeE = 1;
      this._strobeCd = 0.22;
    }
    this.strobeE *= Math.pow(0.000001, dt);
    this.strobeMat.opacity = this.strobeE;

    // Spotlight "jugador seleccionado": solo en estaciones con operador.
    const st = Math.round(stationFloat);
    const sp = STATION_SPOTS[st];
    const w = sp ? Math.max(0, 1 - Math.abs(stationFloat - st) * 2.2) : 0;
    if (sp) {
      this.spot.position.set(sp[0], 6.6, sp[1]);
      this.spot.target.position.set(sp[0], 1, sp[1]);
      this.spotCone.position.set(sp[0], 6.6, sp[1]);
    }
    this.spot.intensity = 240 * w;
    this.spotConeMat.opacity = 0.05 * w;
    this.spotCone.visible = w > 0.02;

    // Neón: respira apenas con los medios.
    this.neonMat.opacity = 0.82 + bands.mid * 0.18;

    // Mapping.
    const mu = this.mapUniforms;
    mu.uTime.value = t;
    mu.uBass.value = bands.bass;
    mu.uMid.value = bands.mid;
    mu.uOpacity.value += (immersiveW * 0.92 - mu.uOpacity.value) * 0.08;
    const visible = mu.uOpacity.value > 0.02;
    for (const p of this.mapPanels) p.visible = visible;

    // Haze.
    this.particles.rotation.y = t * 0.011;
    this.particleMat.size = 0.16 * (1 + bands.treb * 0.9);
  }
}
