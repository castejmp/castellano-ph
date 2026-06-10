import * as THREE from 'three';
import { TABLES } from './world.js';
import {
  buildGuestMale, buildGuestFemale, buildOperator, buildOperatorSeated,
} from './figure.js';

/**
 * LA GENTE — público de gala + elenco del estudio, todos en figuras
 * low-poly procedurales e instanciadas.
 *
 * Una InstancedMesh por (tipo × bucket). 4 tipos × 4 buckets ≈ 14 draw
 * calls para ~160 personas. El idle (bob + sway) corre en el vertex
 * shader con fase por instancia: cero CPU por frame.
 *
 * EL ELENCO: un operador por estación, vestido de negro, en su puesto.
 * Los props (cámaras, trípodes, consolas) viven en world.js.
 */

const SUITS = ['#161619', '#101015', '#15151b', '#1b1d27', '#14140f'];
const DRESSES = ['#21324f', '#1d3a30', '#5a2230', '#27314f', '#3a2a1d', '#143b3a'];
const TEE = '#121215';
const SKINS = ['#e8b98f', '#d9a06b', '#c98e62', '#b67847', '#8d5a3b', '#f0c9a2'];
const HAIRS = ['#2b2118', '#4a3320', '#171311', '#6b4a2a', '#8a8378', '#1f1a14'];

/* Elenco — coordenadas del salón. kind = silueta · tilt = inclinación. */
const CAST = [
  { kind: 'op', x: -22.5, z: 6.75, face: Math.PI, tilt: 0.18, dance: 0.12 },   // DISEÑO
  { kind: 'op', x: 21.2, z: -11.7, face: 2.34, tilt: 0.12, dance: 0.2 },       // FOTOGRAFÍA
  { kind: 'op', x: -3.9, z: -4.0, face: 2.48, tilt: 0.08, dance: 0.18 },       // VIDEO
  { kind: 'op', x: 4.6, z: -18.4, face: 0, tilt: 0.1, dance: 0.4 },            // VISUALES (VJ)
  { kind: 'op', x: 0, z: -19.45, face: 0, tilt: 0, dance: 0.95 },              // DJ
  { kind: 'opSeated', x: -21.6, z: -12.35, face: -2.26, dance: 0.08 },         // EDICIÓN
  { kind: 'op', x: 13.5, z: 7, face: -2.25, tilt: -0.14, dance: 0.1 },         // DRONE
];

export class Crowd {
  constructor(scene) {
    // Repartir el público en las 4 siluetas.
    const groups = { guestM: [], guestF: [], op: [], opSeated: [] };

    const addGuest = (x, z, dance, s, face) => {
      const kind = Math.random() < 0.5 ? 'guestM' : 'guestF';
      groups[kind].push({ x, z, dance, s, face });
    };

    // Pista: bailan alrededor del centro.
    for (let i = 0; i < 86; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      addGuest(Math.cos(a) * r * 8, -9 + Math.sin(a) * r * 5.4, 1, 1);
    }
    // Alrededor de las mesas (de pie, charlando).
    for (const [tx, tz] of TABLES) {
      for (let c = 0; c < 5; c++) {
        const a = (c / 5) * Math.PI * 2 + tx;
        addGuest(tx + Math.cos(a) * 1.9, tz + Math.sin(a) * 1.9, 0.22, 0.96, a + Math.PI);
      }
    }
    // Barra y lounge.
    for (let i = 0; i < 6; i++) addGuest(-3.4 + i * 1.35, 18.4, 0.3, 1, 0);
    for (let i = 0; i < 4; i++) addGuest(16.6 + i * 1.1, 13.6 + (i % 2) * 1.6, 0.15, 0.96);

    // El elenco.
    for (const c of CAST) groups[c.kind].push(c);

    this.uni = { uTime: { value: 0 }, uEnergy: { value: 0.5 } };

    const builders = {
      guestM: buildGuestMale, guestF: buildGuestFemale,
      op: buildOperator, opSeated: buildOperatorSeated,
    };
    this.meshes = [];
    for (const kind of Object.keys(groups)) {
      if (groups[kind].length) this._group(scene, kind, builders[kind](), groups[kind]);
    }
  }

  _material(vertexColors) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.uni.uTime;
      sh.uniforms.uEnergy = this.uni.uEnergy;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
           attribute float aPhase; attribute float aDance;
           uniform float uTime; uniform float uEnergy;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
           float amp = aDance * (0.025 + uEnergy * 0.085) + 0.008;
           transformed.y *= 1.0 + sin(uTime * (2.2 + aDance * 2.6) + aPhase * 6.2831) * amp;
           transformed.x += sin(uTime * 1.4 + aPhase * 8.0) * 0.045 * aDance * uEnergy;`);
    };
    return mat;
  }

  _group(scene, kind, parts, spots) {
    const n = spots.length;
    const phases = new Float32Array(n);
    const dances = new Float32Array(n);
    spots.forEach((p, i) => {
      phases[i] = Math.random();
      dances[i] = (p.dance ?? 0.4) * (0.7 + Math.random() * 0.5);
    });

    const matGarment = this._material(false);
    const matDetail = this._material(true);

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const col = new THREE.Color();
    const seated = kind === 'opSeated';

    for (const bucket of ['garment', 'skin', 'hair', 'detail']) {
      const geo = parts[bucket];
      if (!geo) continue;
      geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
      geo.setAttribute('aDance', new THREE.InstancedBufferAttribute(dances, 1));
      const mesh = new THREE.InstancedMesh(geo, bucket === 'detail' ? matDetail : matGarment, n);

      spots.forEach((p, i) => {
        const h = seated ? 1 : (p.s ?? 1) * (0.94 + Math.random() * 0.12);
        e.set(p.tilt ?? 0, p.face ?? Math.random() * Math.PI * 2, 0, 'YXZ');
        q.setFromEuler(e);
        pos.set(p.x, 0, p.z);
        const wide = seated ? 1 : 0.96 + Math.random() * 0.08;
        sc.set(wide, h, wide);
        m4.compose(pos, q, sc);
        mesh.setMatrixAt(i, m4);

        if (bucket === 'garment') {
          const c = kind === 'guestM' ? SUITS[(Math.random() * SUITS.length) | 0]
            : kind === 'guestF' ? DRESSES[(Math.random() * DRESSES.length) | 0]
            : TEE;
          mesh.setColorAt(i, col.set(c));
        } else if (bucket === 'skin') {
          mesh.setColorAt(i, col.set(SKINS[(Math.random() * SKINS.length) | 0]));
        } else if (bucket === 'hair') {
          mesh.setColorAt(i, col.set(HAIRS[(Math.random() * HAIRS.length) | 0]));
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  update(t, bass, energy) {
    this.uni.uTime.value = t;
    // El crowd se mueve con el carácter del modo y respira con el bajo.
    this.uni.uEnergy.value += (energy * (0.55 + bass * 0.9) - this.uni.uEnergy.value) * 0.1;
  }
}
