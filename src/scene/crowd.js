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
const HAIRS = ['#2b2118', '#4a3320', '#171311', '#6b4a2a', '#8a6a3f', '#1f1a14'];

/* Elenco — coordenadas del salón. kind = silueta · tilt = inclinación. */
const CAST = [
  { kind: 'op', x: -12.4, z: -9.15, face: 0, tilt: 0.18, dance: 0.12 },        // DISEÑO: al oeste de la pista
  { kind: 'op', x: 3.5, z: -6.6, face: 0.4, tilt: 0.05, dance: 0.25 },         // FOTOGRAFÍA: entre la gente
  { kind: 'op', x: -3.64, z: -4.37, face: 2.474, tilt: 0.06, dance: 0.18 },    // VIDEO: operando la cámara
  { kind: 'op', x: 4.6, z: -18.4, face: 0, tilt: 0.1, dance: 0.4 },            // VISUALES (VJ en consola)
  { kind: 'op', x: 0, y: 0.5, z: -19.45, face: 0, tilt: 0, dance: 0.95 },      // DJ en tarima, visible
  { kind: 'opSeated', x: 12.4, z: -8.5, face: Math.PI, dance: 0.08 },          // EDICIÓN: al este de la pista
  { kind: 'op', x: 13.5, z: 7, face: -2.25, tilt: -0.14, dance: 0.1 },         // DRONE: piloto
];

/* Dónde cae el spotlight "jugador seleccionado" por estación. */
export const STATION_SPOTS = {
  1: [-12.4, -9.15], 2: [3.5, -6.6], 3: [-3.64, -4.37],
  4: [4.6, -18.4], 5: [12.4, -8.5], 6: [13.5, 7],
};

export class Crowd {
  constructor(scene) {
    // Repartir el público en las siluetas (con variante bailando).
    const groups = { guestM: [], guestMDance: [], guestF: [], guestFDance: [], op: [], opSeated: [] };

    const addGuest = (x, z, dance, s, face, dancing = false) => {
      let kind = Math.random() < 0.5 ? 'guestM' : 'guestF';
      if (dancing && Math.random() < 0.55) kind += 'Dance';
      groups[kind].push({ x, z, dance, s, face });
    };

    // Pista: bailan alrededor del centro (muchos con los brazos arriba).
    for (let i = 0; i < 86; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      addGuest(Math.cos(a) * r * 8, -9 + Math.sin(a) * r * 5.4, 1, 1, undefined, true);
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
      guestM: () => buildGuestMale(false),
      guestMDance: () => buildGuestMale(true),
      guestF: () => buildGuestFemale(false),
      guestFDance: () => buildGuestFemale(true),
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
           // Baile sin estiramiento: balanceo lateral (shear por altura),
           // vaivén al frente y un saltito con todo el cuerpo rígido.
           float sw = sin(uTime * (1.8 + aDance) + aPhase * 6.2831);
           transformed.x += sw * transformed.y * (0.025 + 0.055 * aDance * uEnergy);
           transformed.z += cos(uTime * 1.1 + aPhase * 7.0) * transformed.y * 0.022 * aDance;
           float hop = abs(sin(uTime * (2.2 + aDance * 2.0) + aPhase * 3.1415));
           transformed.y += hop * 0.055 * aDance * uEnergy;`);
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
        pos.set(p.x, p.y ?? 0, p.z);
        const wide = seated ? 1 : 0.96 + Math.random() * 0.08;
        sc.set(wide, h, wide);
        m4.compose(pos, q, sc);
        mesh.setMatrixAt(i, m4);

        if (bucket === 'garment') {
          const c = kind.startsWith('guestM') ? SUITS[(Math.random() * SUITS.length) | 0]
            : kind.startsWith('guestF') ? DRESSES[(Math.random() * DRESSES.length) | 0]
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
