import * as THREE from 'three';
import { TABLES } from './world.js';
import { buildFigureParts } from './figure.js';

/**
 * LA GENTE — público + elenco, todos con la misma morfología de muñeco.
 * 3 InstancedMeshes (ropa / piel / pelo) que comparten matrices y el
 * idle por instancia en el vertex shader. 3 draw calls para ~160 figuras.
 *
 * EL ELENCO: un protagonista por estación, en su puesto de trabajo.
 * Los props (cámaras, trípodes, consolas) viven en world.js; acá va el
 * cuerpo: posición, hacia dónde mira, inclinación y cuánta energía tiene.
 */

const GARMENTS = [
  '#cfc9bd', '#a39a8a', '#6e6a63', '#8e8378', '#56514b',
  '#3f3c38', '#b5ada0', '#7d7468', '#94897a', '#615c55',
];
const SKINS = ['#e8b98f', '#d9a06b', '#c98e62', '#b67847', '#8d5a3b', '#f0c9a2'];
const HAIRS = ['#2b2118', '#4a3320', '#171311', '#6b4a2a', '#8a8378', '#1f1a14'];
const STAFF_TEE = '#1b1b1f'; // el estudio trabaja de negro

/* Elenco — coordenadas del salón. tilt = inclinación hacia su tarea. */
const CAST = [
  { x: -22.5, z: 6.75, face: Math.PI, tilt: 0.2, s: 1, dance: 0.15 },   // DISEÑO: dibujando sobre la mesa
  { x: 21.2, z: -11.7, face: 2.34, tilt: 0.12, s: 1, dance: 0.22 },     // FOTO: detrás de la cámara
  { x: -3.9, z: -4.0, face: 2.48, tilt: 0.08, s: 1, dance: 0.2 },       // VIDEO: operando el trípode
  { x: 4.6, z: -18.55, face: 0, tilt: 0.14, s: 1, dance: 0.35 },        // VISUALES: el VJ en su consola
  { x: 0, z: -19.45, face: 0, tilt: 0, s: 1, dance: 0.95 },             // el DJ (baila, claro)
  { x: -21.6, z: -12.35, face: -2.26, tilt: 0.1, s: 0.74, dance: 0.1 }, // EDICIÓN: sentado en la compu
  { x: 13.5, z: 7, face: -2.25, tilt: -0.12, s: 1, dance: 0.12 },       // DRONE: piloto mirando al cielo
];

export class Crowd {
  constructor(scene) {
    const spots = [];

    // Pista: bailan alrededor del centro.
    for (let i = 0; i < 88; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      spots.push({ x: Math.cos(a) * r * 8, z: -9 + Math.sin(a) * r * 5.4, dance: 1, s: 1 });
    }
    // Sentados en las mesas.
    for (const [tx, tz] of TABLES) {
      for (let c = 0; c < 5; c++) {
        const a = (c / 5) * Math.PI * 2 + tx;
        spots.push({ x: tx + Math.cos(a) * 1.75, z: tz + Math.sin(a) * 1.75, dance: 0.18, s: 0.74, face: a + Math.PI });
      }
    }
    // En la barra y el lounge.
    for (let i = 0; i < 6; i++) spots.push({ x: -3.4 + i * 1.35, z: 18.5, dance: 0.3, s: 1, face: 0 });
    for (let i = 0; i < 4; i++) spots.push({ x: 16.6 + i * 1.1, z: 13.6 + (i % 2) * 1.6, dance: 0.15, s: 0.74 });

    // El elenco entra al final, marcado para vestirlo de staff.
    const castStart = spots.length;
    for (const c of CAST) spots.push(c);

    const n = spots.length;
    this.uni = { uTime: { value: 0 }, uEnergy: { value: 0.5 } };

    // Un solo material compartido: el color real lo pone instanceColor.
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.uni.uTime;
      sh.uniforms.uEnergy = this.uni.uEnergy;
      sh.vertexShader = sh.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           attribute float aPhase;
           attribute float aDance;
           uniform float uTime;
           uniform float uEnergy;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float amp = aDance * (0.03 + uEnergy * 0.10) + 0.012;
           transformed.y *= 1.0 + sin(uTime * (2.2 + aDance * 2.6) + aPhase * 6.2831) * amp;
           transformed.x += sin(uTime * 1.4 + aPhase * 8.0) * 0.05 * aDance * uEnergy;`
        );
    };

    const parts = buildFigureParts();
    const phases = new Float32Array(n);
    const dances = new Float32Array(n);
    spots.forEach((p, i) => {
      phases[i] = Math.random();
      dances[i] = p.dance * (0.7 + Math.random() * 0.5);
    });

    const meshes = ['body', 'skin', 'hair'].map((k) => {
      const g = parts[k];
      g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
      g.setAttribute('aDance', new THREE.InstancedBufferAttribute(dances, 1));
      const m = new THREE.InstancedMesh(g, mat, n);
      scene.add(m);
      return m;
    });
    const [bodyM, skinM, hairM] = meshes;

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const col = new THREE.Color();

    spots.forEach((p, i) => {
      const isCast = i >= castStart;
      const h = (isCast ? 1 : 0.88 + Math.random() * 0.24) * p.s;
      // YXZ: primero orienta (yaw), después inclina hacia la tarea (pitch).
      e.set(p.tilt ?? 0, p.face ?? Math.random() * Math.PI * 2, 0, 'YXZ');
      q.setFromEuler(e);
      pos.set(p.x, 0, p.z);
      sc.set((isCast ? 1 : 0.85 + Math.random() * 0.3), h, (isCast ? 1 : 0.85 + Math.random() * 0.3));
      m4.compose(pos, q, sc);
      for (const m of meshes) m.setMatrixAt(i, m4);

      bodyM.setColorAt(i, col.set(isCast ? STAFF_TEE : GARMENTS[(Math.random() * GARMENTS.length) | 0]));
      skinM.setColorAt(i, col.set(SKINS[(Math.random() * SKINS.length) | 0]));
      hairM.setColorAt(i, col.set(HAIRS[(Math.random() * HAIRS.length) | 0]));
    });
    for (const m of meshes) m.instanceMatrix.needsUpdate = true;

    this.meshes = meshes;
  }

  update(t, bass, energy) {
    this.uni.uTime.value = t;
    // El crowd se mueve con el carácter del modo y respira con el bajo.
    this.uni.uEnergy.value += (energy * (0.55 + bass * 0.9) - this.uni.uEnergy.value) * 0.1;
  }
}
