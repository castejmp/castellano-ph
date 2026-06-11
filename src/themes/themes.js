import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * EL MOTOR DE MODOS — la misma geometría, otra puesta.
 * Mantiene un estado "vivo" de toda la iluminación y lo interpola hacia
 * el modo objetivo (~0.9 s). Empieza en negro: elegir en el gate es,
 * literalmente, encender el mundo.
 */
export class ThemeEngine {
  constructor({ scene, renderer, rig, led, extras, worldMats = [] }) {
    this.scene = scene;
    this.renderer = renderer;
    this.rig = rig;
    this.led = led;
    this.extras = extras;
    this.worldMats = worldMats; // materiales del salón: se tiñen por modo

    const black = () => new THREE.Color('#000000');
    // Estado vivo: arranca apagado.
    this.live = {
      bg: black(), fog: black(), fogDensity: 0.02,
      hemiSky: black(), hemiGround: black(), hemiI: 0,
      key: black(), keyI: 0, wash: black(), washI: 0,
      practical: black(), practicalI: 0,
      led0: black(), led1: black(), led2: black(),
      particles: black(), particleOpacity: 0,
      tint: black(),
      exposure: 0.4, crowdEnergy: 0.3,
    };
    this.target = null;
    this.mode = null;

    scene.background = this.live.bg;
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    scene.fog.color = this.live.fog;
  }

  setMode(name) {
    this.mode = name;
    const t = CONFIG.modes[name].theme;
    this.target = {
      bg: new THREE.Color(t.bg), fog: new THREE.Color(t.fog), fogDensity: t.fogDensity,
      hemiSky: new THREE.Color(t.hemiSky), hemiGround: new THREE.Color(t.hemiGround), hemiI: t.hemiI,
      key: new THREE.Color(t.key), keyI: t.keyI,
      wash: new THREE.Color(t.wash), washI: t.washI,
      practical: new THREE.Color(t.practical), practicalI: t.practicalI,
      led0: new THREE.Color(t.led[0]), led1: new THREE.Color(t.led[1]), led2: new THREE.Color(t.led[2]),
      particles: new THREE.Color(t.particles), particleOpacity: t.particleOpacity,
      tint: new THREE.Color(t.tint ?? '#ffffff'),
      exposure: t.exposure, crowdEnergy: t.crowdEnergy,
    };
    // Acento de UI.
    document.documentElement.style.setProperty('--accent', CONFIG.modes[name].accent);
  }

  update(dt) {
    if (!this.target) return;
    const k = 1 - Math.exp(-dt * 4.2); // ~0.9 s de crossfade
    const L = this.live, T = this.target;

    for (const key of ['bg', 'fog', 'hemiSky', 'hemiGround', 'key', 'wash', 'practical', 'led0', 'led1', 'led2', 'particles', 'tint']) {
      L[key].lerp(T[key], k);
    }
    // Tinte del salón: piso y mobiliario cambian de temperatura por modo.
    for (const m of this.worldMats) m.color.copy(L.tint);
    for (const key of ['fogDensity', 'hemiI', 'keyI', 'washI', 'practicalI', 'particleOpacity', 'exposure', 'crowdEnergy']) {
      L[key] += (T[key] - L[key]) * k;
    }

    // Aplicar al mundo.
    this.scene.fog.density = L.fogDensity;
    this.renderer.toneMappingExposure = L.exposure;
    this.rig.apply(L);

    const lu = this.led.uniforms;
    lu.uA.value.copy(L.led0);
    lu.uB.value.copy(L.led1);
    lu.uC.value.copy(L.led2);

    const mu = this.extras.mapUniforms;
    mu.uA.value.copy(L.led0);
    mu.uB.value.copy(L.led1);

    this.extras.applyTheme(L);
  }

  get crowdEnergy() {
    return this.live.crowdEnergy;
  }
}
