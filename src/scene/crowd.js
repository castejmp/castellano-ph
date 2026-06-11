import * as THREE from 'three';
import { TABLES, LOUNGES } from './world.js';
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
  { kind: 'op', x: -8.5, z: 19.35, face: Math.PI, tilt: 0.18, dance: 0.12 },   // DISEÑO: junto a la barra
  { kind: 'op', x: 7.5, z: -1.5, face: -2.36, tilt: 0.05, dance: 0.25 },       // FOTOGRAFÍA: fuera de la pista, apuntándole
  { kind: 'op', x: -10.3, z: -6.5, face: 1.81, tilt: 0.06, dance: 0.18 },      // VIDEO: fuera de la pista, apuntándole
  { kind: 'op', x: 4.6, z: -18.4, face: 0, tilt: 0.1, dance: 0.4 },            // VISUALES (VJ en consola)
  { kind: 'op', x: 0, y: 0.5, z: -19.45, face: 0, tilt: 0, dance: 0.95 },      // DJ en tarima, visible
  { kind: 'opSeated', x: 8.6, z: 18.4, face: Math.PI, dance: 0.08 },           // EDICIÓN: junto a la barra
  { kind: 'op', x: 13.5, z: 7, face: -2.25, tilt: -0.14, dance: 0.1 },         // DRONE: piloto
];

/* Dónde cae el spotlight "jugador seleccionado" por estación. */
export const STATION_SPOTS = {
  1: [-8.5, 19.35], 2: [7.55, -1.55], 3: [-10.3, -6.5],
  4: [4.6, -18.4], 5: [8.6, 20.3], 6: [13.5, 7],
};

/* El piso transitable queda a y≈0.1 (pista + filo de la losa). */
const FLOOR_Y = 0.1;

/* ──────────────────────────────────────────────
 * FIGURAS INDIVIDUALES — un archivo .glb = una persona.
 * Para sumar una figura nueva: poné el .glb en scripts/raw/people/,
 * corré `node scripts/optimize-people.mjs`, y agregá una línea acá.
 *   file   → public/models/people/<file>
 *   slot   → { x, z, face } en coordenadas del salón
 *   height → altura objetivo en metros (default 1.7)
 * Si el archivo no existe todavía, se saltea sin romper nada.
 * ────────────────────────────────────────────── */
// Los archivos de UNA figura (Tripo single) miran a -z → rot: PI.
// Los de fila (invitados) miran a +x → rot: -PI/2 (default).
const SINGLE = Math.PI;
// Alturas: operadores apenas por debajo de los invitados (1.66) para
// que la relación operadores/invitados/mesas cierre.
const OP_H = 1.55;
const FIGURE_FILES = [
  // FOTOGRAFÍA: dos fotógrafos JUNTOS al borde sur (un solo spot los baña),
  // apuntando al centro de la pista.
  { file: 'photographer.glb', rot: SINGLE, height: OP_H, slots: [{ x: 7.1, z: -1.4, face: -2.39 }] },
  { file: 'photographer-women.glb', rot: SINGLE, height: OP_H, slots: [{ x: 8.0, z: -1.7, face: -2.31 }] },
  // VIDEO: camarógrafo al borde oeste, apuntando hacia la barra.
  { file: 'cameraoperator.glb', rot: SINGLE, height: OP_H, slots: [{ x: -10.3, z: -6.5, face: 0.38 }] },
  // EDICIÓN: los dos editores con su mesa, pegados a la pared sur.
  { file: 'editores.glb', rot: SINGLE, slots: [{ x: 8.6, z: 20.3, face: Math.PI }], height: 1.5 },
  // VISUALES: el VJ en su consola (90° antihorario).
  { file: 'toy.glb', rot: SINGLE, height: OP_H, slots: [{ x: 4.6, z: -18.4, face: Math.PI / 2 }] },
  // DISEÑO: el diseñador en su mesa (90° a su izquierda → mira al oeste).
  { file: 'worker.glb', rot: SINGLE, height: OP_H, slots: [{ x: -8.5, z: 19.35, face: -Math.PI / 2 }] },
  // DJ con su mixer en la tarima (90° horario desde el norte → este).
  { file: 'dj.glb', rot: SINGLE, height: 1.6, slots: [{ x: 0, y: 0.4, z: -19.0, face: Math.PI / 2 }], removes: 'dj', zeroOp: 4 },
  // Mesa redonda + living (2 grupos en un archivo): 6 mesas entre la
  // pista y la barra + 6 livings en los laterales del salón.
  {
    file: 'mesas.glb', path: 'mesas.glb', removes: 'tables',
    place: [
      { fig: 0, height: 1.3, slots: TABLES.map(([x, z], i) => ({ x, z, face: i * 1.3 })) },
      { fig: 1, height: 0.85, slots: LOUNGES },
    ],
  },
];

export class Crowd {
  constructor(scene, isMobile = false) {
    this.scene = scene;
    this.isMobile = isMobile;
    this.byKind = {};
    // Repartir el público en las siluetas (con variante bailando).
    const groups = { guestM: [], guestMDance: [], guestF: [], guestFDance: [], op: [], opSeated: [] };

    const addGuest = (x, z, dance, s, face, dancing = false) => {
      let kind = Math.random() < 0.5 ? 'guestM' : 'guestF';
      if (dancing && Math.random() < 0.55) kind += 'Dance';
      groups[kind].push({ x, z, dance, s, face });
    };

    // 10 invitados REPARTIDOS por toda la pista (jitter prolijo),
    // bailando mirando más o menos hacia el DJ.
    const SPREAD = [
      [-6.5, -5.2], [-2.8, -7.6], [0.6, -4.8], [4.1, -6.9], [7.0, -5.0],
      [-5.2, -11.2], [-1.4, -13.2], [2.3, -11.4], [5.8, -13.0], [-7.6, -13.6],
    ];
    const PISTA = SPREAD.map(([x, z], i) => {
      const face = Math.atan2(0 - x, -19.4 - z) + (i % 3 - 1) * 0.35;
      addGuest(x, z, 1, 1, face, true);
      return { x, z, dance: 1, s: 1, face };
    });
    this._pistaSpots = PISTA;
    // 3 invitados en la barra (de espaldas a la fiesta, mirando el mostrador).
    this._barSpots = [
      { x: -2.2, z: 18.6, face: 0 }, { x: 0.3, z: 18.6, face: 0 }, { x: 2.7, z: 18.5, face: 0 },
    ];
    for (const b of this._barSpots) addGuest(b.x, b.z, 0.25, 1, b.face);

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
    return this._patch(new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors }));
  }

  /** Inyecta el baile (sway + saltito) en cualquier material. */
  _patch(mat) {
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
        pos.set(p.x, p.y ?? FLOOR_Y, p.z);
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
      (this.byKind[kind] ??= { meshes: [], spots }).meshes.push(mesh);
    }
  }

  /* ──────────────────────────────────────────────
   * UPGRADE A GLB — los modelos reales del estudio.
   * · invitados.glb: 10 poses de baile → reemplazan al público.
   * · crew.glb: [0] filmmaker · [1] fotógrafo de pie · [2] fotógrafo agachado.
   * · staff.glb: [0] editores ×2 con su mesa · [1] VJ · [2] diseñador.
   * El DJ y el piloto de drone siguen procedurales.
   * ────────────────────────────────────────────── */
  async upgradeFromGLB(base, onProgress, world = {}) {
    const { loadPeopleGLB } = await import('./glbPeople.js');
    const prog = [0, 0];
    const report = () => onProgress?.((prog[0] + prog[1]) / 2);
    const [guests, ...figs] = await Promise.all([
      loadPeopleGLB(`${base}models/invitados.glb`, (p) => { prog[0] = p; report(); }),
      ...FIGURE_FILES.map((f) =>
        loadPeopleGLB(`${base}models/${f.path ?? `people/${f.file}`}`, (p) => { prog[1] = p; report(); })
          .catch(() => null)),
    ]);

    // La fila original mira a +x: girarla para que el `face` funcione.
    const ROT = -Math.PI / 2;
    const median = (arr) => arr.slice().sort((a, b) => a - b)[(arr.length / 2) | 0];

    /* ── Invitados: fuera el público procedural ── */
    const guestSpots = [];
    for (const kind of ['guestM', 'guestMDance', 'guestF', 'guestFDance']) {
      const gk = this.byKind[kind];
      if (!gk) continue;
      guestSpots.push(...gk.spots);
      for (const m of gk.meshes) {
        this.scene.remove(m);
        m.geometry.dispose();
      }
      this.meshes = this.meshes.filter((x) => !gk.meshes.includes(x));
      delete this.byKind[kind];
    }

    // 10 invitados, 1:1 con los lugares de la pista; tres figuras
    // repiten una instancia extra en la barra.
    const gScale = 1.66 / median(guests.figures.map((f) => f.height));
    const spots10 = this._pistaSpots ?? guestSpots;
    const barBy = { 1: 0, 4: 1, 7: 2 }; // figura → lugar de barra
    guests.figures.forEach((fig, i) => {
      const slot = spots10[i % spots10.length];
      if (!slot) return;
      const spots = [slot];
      if (barBy[i] !== undefined && this._barSpots) spots.push(this._barSpots[barBy[i]]);
      fig.geometry.scale(gScale, gScale, gScale);
      fig.geometry.rotateY(ROT);
      this._instanceGLB(fig.geometry, guests.material, spots, false);
    });

    /* ── Figuras individuales (un archivo = una o más piezas) ── */
    figs.forEach((g, i) => {
      if (!g) return; // archivo no disponible todavía → lo salteamos
      const entry = FIGURE_FILES[i];
      const rot = entry.rot ?? ROT;
      const places = entry.place ?? [{ fig: 0, slots: entry.slots, height: entry.height }];
      for (const pl of places) {
        const fig = g.figures[pl.fig ?? 0];
        if (!fig) continue;
        const s = (pl.height ?? entry.height ?? 1.6) / fig.height;
        fig.geometry.scale(s, s, s);
        fig.geometry.rotateY(rot);
        this._instanceGLB(fig.geometry, g.material, pl.slots, true);
      }
      // Si trae su propia utilería (cabina DJ, mesas, lounge), la
      // versión procedural se retira de escena.
      if (entry.removes && world[entry.removes]) {
        this.scene.remove(world[entry.removes]);
        world[entry.removes].geometry.dispose();
        delete world[entry.removes];
      }
      if (entry.zeroOp !== undefined) this._zeroInstances('op', [entry.zeroOp]);
    });

    // Apagar los operadores procedurales reemplazados (escala 0).
    // groups.op = [diseño, foto, video, vj, dj, piloto].
    this._zeroInstances('op', [0, 1, 2, 3]);
    this._zeroInstances('opSeated', [0]);
  }

  /** Las figuras GLB van ESTÁTICAS: material sin parche de baile. */
  _instanceGLB(geom, mat, spots, isCast) {
    const n = spots.length;
    if (!n) return;
    const mesh = new THREE.InstancedMesh(geom, mat, n);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3();
    const pos = new THREE.Vector3();
    spots.forEach((p, i) => {
      e.set(p.tilt ?? 0, p.face ?? Math.random() * Math.PI * 2, 0, 'YXZ');
      q.setFromEuler(e);
      const h = isCast ? 1 : 0.92 + Math.random() * 0.16; // escala uniforme: sin deformar
      sc.set(h, h, h);
      pos.set(p.x, (p.y ?? 0) + FLOOR_Y, p.z); // pies sobre el piso real (y≈0.1)
      m4.compose(pos, q, sc);
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
    this.meshes.push(mesh);
  }

  _zeroInstances(kind, idxs) {
    const gk = this.byKind[kind];
    if (!gk) return;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const mesh of gk.meshes) {
      for (const i of idxs) mesh.setMatrixAt(i, zero);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  update(t, bass, energy) {
    this.uni.uTime.value = t;
    // El crowd se mueve con el carácter del modo y respira con el bajo.
    this.uni.uEnergy.value += (energy * (0.55 + bass * 0.9) - this.uni.uEnergy.value) * 0.1;
  }
}
