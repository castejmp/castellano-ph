import * as THREE from 'three';

/**
 * EL RIG DE LUCES — acá vive el trabajo emocional.
 * La geometría nunca cambia entre modos: cambia esta puesta.
 * Sin sombras dinámicas (presupuesto móvil); la lectura del volumen
 * la dan el hemisferio + el key + los practicals.
 */
export class LightRig {
  constructor(scene) {
    this.hemi = new THREE.HemisphereLight('#52121f', '#08020a', 0.5);
    scene.add(this.hemi);

    // Key: el seguidor sobre la pista.
    this.key = new THREE.SpotLight('#ff2b2b', 0, 0, 0.72, 0.65, 1.8);
    this.key.position.set(10, 17, 2);
    this.key.target.position.set(0, 0, -7);
    scene.add(this.key, this.key.target);

    // Wash: baño amplio sobre las mesas.
    this.wash = new THREE.SpotLight('#ff3355', 0, 0, 1.0, 0.95, 1.8);
    this.wash.position.set(-12, 15, 8);
    this.wash.target.position.set(0, 0, 6);
    scene.add(this.wash, this.wash.target);

    // El resplandor de la LED sobre el DJ y la pista (bombea con el bajo).
    this.ledGlow = new THREE.PointLight('#ff2b2b', 0, 26, 1.7);
    this.ledGlow.position.set(0, 5, -19);
    scene.add(this.ledGlow);

    // Practicals: lamparitas que hacen legibles los rincones en modos oscuros.
    this.practical = new THREE.PointLight('#ff7a45', 0, 22, 1.6);
    this.practical.position.set(2, 4.5, 9);
    scene.add(this.practical);

    this.deskLamp = new THREE.PointLight('#ffd9a8', 5, 9, 1.6);
    this.deskLamp.position.set(-14.5, 2.8, 18.6);
    scene.add(this.deskLamp);

    this.editLamp = new THREE.PointLight('#cfe6ff', 7, 9, 1.6);
    this.editLamp.position.set(14.5, 2.7, 19.8);
    scene.add(this.editLamp);

    // (El set de fotografía salió de escena: su lámpara también.)
  }

  /** Lo llama el ThemeEngine con el estado YA interpolado. */
  apply(s) {
    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGround);
    this.hemi.intensity = s.hemiI;
    this.key.color.copy(s.key);
    this.key.intensity = s.keyI;
    this.wash.color.copy(s.wash);
    this.wash.intensity = s.washI;
    this.practical.color.copy(s.practical);
    this.practical.intensity = s.practicalI;
    this.ledGlow.color.copy(s.led0);
    this._glowBase = s.washI;
  }

  /** Pulso por frame: la LED ilumina el salón al ritmo del bajo. */
  update(bands) {
    this.ledGlow.intensity = (this._glowBase || 0) * (0.25 + bands.bass * 0.9);
  }
}
