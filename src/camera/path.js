import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * LA CÁMARA — un plano secuencia con gramática de cine.
 * Path Catmull-Rom por las 9 posiciones de shot; el lookAt viaja por su
 * propia curva. FOV interpolado por segmento: abierto en los generales,
 * tele en los detalles. Damping en todo. La óptica es nativa: nada de
 * filtros truchos.
 *
 * prefers-reduced-motion → cortes directos al shot asentado, sin vuelo.
 */
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    const shots = CONFIG.shots;
    this.shots = shots;
    this.max = shots.length - 1;

    const v3 = (a) => new THREE.Vector3(...a);
    // getPoint (no getPointAt): t = i/8 cae EXACTO en el control point i.
    this.posCurve = new THREE.CatmullRomCurve3(shots.map((s) => v3(s.pos)), false, 'catmullrom', 0.55);
    this.lookCurve = new THREE.CatmullRomCurve3(shots.map((s) => v3(s.look)), false, 'catmullrom', 0.55);

    this.pos = v3(shots[0].pos);
    this.look = v3(shots[0].look);
    this.fov = shots[0].fov;
    this._tp = new THREE.Vector3();
    this._tl = new THREE.Vector3();
  }

  /**
   * progress: 0..1 · dronePos: Vector3 (la estación DRONE lo persigue)
   */
  update(progress, dt, dronePos, reduced) {
    const f = progress * this.max;
    const i = Math.min(Math.floor(f), this.max - 1);
    const u = f - i;
    // Ease dentro del segmento: la cámara "asienta" en cada estación.
    const eu = u * u * (3 - 2 * u);
    let targetFov = this.shots[i].fov + (this.shots[i + 1].fov - this.shots[i].fov) * eu;

    if (reduced) {
      // Corte directo al shot más cercano. Sin vuelo.
      const r = Math.round(f);
      this.pos.fromArray(this.shots[r].pos);
      this.look.fromArray(this.shots[r].look);
      this.fov = this.shots[r].fov;
      if (r === 6 && dronePos) {
        // POV del drone también en reduced-motion (es un corte).
        this.pos.copy(dronePos).y += 0.25;
        this.look.set(0, 1.2, -9);
      }
    } else {
      this.posCurve.getPoint(progress, this._tp);
      this.lookCurve.getPoint(progress, this._tl);

      // Estación DRONE → POV: la cámara SE SUBE al drone y mira la fiesta.
      if (dronePos) {
        const w = Math.max(0, 1 - Math.abs(f - 6) * 1.4);
        if (w > 0) {
          this._pov ??= new THREE.Vector3();
          this._pov.copy(dronePos).y += 0.25;
          this._tp.lerp(this._pov, w);
          this._tl.lerp(this._party ??= new THREE.Vector3(0, 1.2, -9), w);
        }
      }

      const k = 1 - Math.exp(-dt * 3.4);
      this.pos.lerp(this._tp, k);
      this.look.lerp(this._tl, k);
      this.fov += (targetFov - this.fov) * k;
    }

    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Distancia de foco para el DoF (desktop). */
  get focusDistance() {
    return this.pos.distanceTo(this.look);
  }
}
