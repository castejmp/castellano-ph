import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TABLES } from './world.js';

/**
 * LOS INVITADOS — ~150 figuras low-poly en un solo InstancedMesh.
 * El idle (bob + sway) corre en el vertex shader con fase por instancia:
 * cero costo de CPU por frame. La energía del baile la maneja el modo
 * activo y el bajo de la música.
 */

const GARMENTS = [
  '#cfc9bd', '#a39a8a', '#6e6a63', '#8e8378', '#56514b',
  '#3f3c38', '#b5ada0', '#7d7468', '#94897a', '#615c55',
];

export class Crowd {
  constructor(scene) {
    // Figura: cono (cuerpo) + icosaedro (cabeza). ~70 triángulos.
    const body = new THREE.ConeGeometry(0.34, 1.25, 5).translate(0, 0.625, 0);
    const head = new THREE.IcosahedronGeometry(0.155, 0).translate(0, 1.42, 0);
    const person = mergeGeometries([body.toNonIndexed(), head.toNonIndexed()]);
    person.computeVertexNormals();

    const spots = [];
    // Pista: bailan alrededor del centro.
    for (let i = 0; i < 92; i++) {
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

    const n = spots.length;
    this.uni = { uTime: { value: 0 }, uEnergy: { value: 0.5 } };

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

    const mesh = new THREE.InstancedMesh(person, mat, n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const phases = new Float32Array(n);
    const dances = new Float32Array(n);

    spots.forEach((p, i) => {
      const h = (0.88 + Math.random() * 0.24) * p.s;
      q.setFromAxisAngle(up, p.face ?? Math.random() * Math.PI * 2);
      m.compose(
        new THREE.Vector3(p.x, 0, p.z),
        q,
        new THREE.Vector3(0.85 + Math.random() * 0.3, h, 0.85 + Math.random() * 0.3)
      );
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.set(GARMENTS[(Math.random() * GARMENTS.length) | 0]));
      phases[i] = Math.random();
      dances[i] = p.dance * (0.7 + Math.random() * 0.5);
    });

    person.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    person.setAttribute('aDance', new THREE.InstancedBufferAttribute(dances, 1));
    mesh.instanceMatrix.needsUpdate = true;

    this.mesh = mesh;
    scene.add(mesh);
  }

  update(t, bass, energy) {
    this.uni.uTime.value = t;
    // El crowd se mueve con el carácter del modo y respira con el bajo.
    this.uni.uEnergy.value += (energy * (0.55 + bass * 0.9) - this.uni.uEnergy.value) * 0.1;
  }
}
