import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * EL SALÓN — maqueta de arquitecto low-poly, 100% procedural.
 * Toda la utilería estática se pinta con vertex colors y se mergea
 * en UN solo mesh (1 draw call). La losa flota en el vacío.
 *
 * Plano (x este→oeste, z norte→sur):
 *   LED + DJ en tarima al norte (z<0) · pista al centro flanqueada por
 *   la mesa de DISEÑO (oeste) y el escritorio de EDICIÓN (este) ·
 *   truss con cabezales/washes/strobos sobre la pista hacia la LED ·
 *   mesas al sur · barra al borde sur · lounge sureste ·
 *   set de fotos (utilería) en el rincón este.
 */

// 6 mesas en la franja entre la pista y la barra (pasillo central libre).
export const TABLES = [
  [-12, 3.5], [-4, 4.2], [4, 3.6], [12, 4.0],
  [-8, 8.6], [8, 8.4],
];

// 6 livings: tres por lateral del salón, mirando al centro.
export const LOUNGES = [
  { x: 19.5, z: -6, face: -1.27 }, { x: 20.2, z: 2, face: -1.67 }, { x: 19.5, z: 9, face: -2.0 },
  { x: -19.5, z: -6, face: 1.27 }, { x: -20.2, z: 2, face: 1.67 }, { x: -19.5, z: 9, face: 2.0 },
];

export const ANCHORS = {
  led: { pos: [0, 4.8, -22.1], size: [20, 8] },
  mapping: [
    { pos: [0, 5.1, -22.35], size: [56, 9.4], ry: 0 },
    { pos: [28.55, 4, -8], size: [19.4, 7.4], ry: -Math.PI / 2 },
    { pos: [-28.55, 4, -8], size: [19.4, 7.4], ry: Math.PI / 2 },
  ],
  // El flash dispara donde está el fotógrafo: al borde sur de la pista.
  flashAt: [7.4, 1.7, -1.7],
  // Parrilla de luces: cabezales móviles, washes y strobos.
  rig: {
    heads: [[-5.5, 5.8, -6.5], [5.5, 5.8, -6.5], [-5.5, 5.8, -13], [5.5, 5.8, -13]],
    washes: [[-5, 5.72, -19], [-2.5, 5.72, -19], [0, 5.72, -19], [2.5, 5.72, -19], [5, 5.72, -19]],
    strobes: [[-1.6, 5.6, -19], [1.6, 5.6, -19]],
  },
  // Neones acostados a AMBOS lados de la pista, mirando al cielo
  // (detalle gaming). Invertidos 180° entre sí: cada uno se lee desde
  // AFUERA de la pista. y=0.13: sobre el filo de la losa (0.09).
  neon: {
    size: [7, 1.5],
    spots: [
      { pos: [10.45, 0.13, -9], rz: Math.PI / 2 },   // este: se lee desde el este
      { pos: [-10.45, 0.13, -9], rz: -Math.PI / 2 }, // oeste: se lee desde el oeste
    ],
  },
  droneCenter: [0, 9.5, -4],
};

export function buildWorld(scene) {
  const parts = [];
  // Utilería procedural que los GLB reemplazan al cargar (mesas, cabina DJ):
  // va en meshes aparte para poder sacarla de escena.
  const partsTables = [];
  const partsDJ = [];
  let target = parts;
  const col = new THREE.Color();

  /** Pinta una geometría con un color plano y la apila para el merge. */
  function push(geom, hex) {
    const g = geom.toNonIndexed();
    col.set(hex);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    target.push(g);
  }

  function box(w, h, d, hex, x, y, z, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    push(g, hex);
  }
  function cyl(rT, rB, h, seg, hex, x, y, z, rz = 0, rx = 0) {
    const g = new THREE.CylinderGeometry(rT, rB, h, seg);
    if (rz) g.rotateZ(rz);
    if (rx) g.rotateX(rx);
    g.translate(x, y, z);
    push(g, hex);
  }

  /* ── La losa que flota en el vacío ── */
  box(66, 2, 46, '#26262d', 0, -1, 0);
  box(66.3, 0.14, 46.3, '#3a3a44', 0, 0.02, 0); // filo del borde

  /* ── Paredes escenográficas (lienzos del mapping) ── */
  box(58, 10.4, 0.6, '#15151a', 0, 5.2, -22.7);
  box(0.6, 8, 20, '#15151a', 29, 4, -8);
  box(0.6, 8, 20, '#15151a', -29, 4, -8);

  /* ── Tarima + cabina DJ (la cabina la reemplaza dj.glb) ── */
  box(4.6, 0.5, 2.2, '#17171c', 0, 0.25, -19.4); // tarima
  target = partsDJ;
  box(4.2, 1.1, 1.0, '#1d1d23', 0, 1.05, -18.7); // cabina
  box(3.6, 0.14, 0.85, '#101014', 0, 1.66, -18.7); // tapa
  box(0.62, 0.1, 0.5, '#2c2c34', -1.05, 1.76, -18.7); // deck izq
  box(0.62, 0.1, 0.5, '#2c2c34', 1.05, 1.76, -18.7); // deck der
  box(0.5, 0.07, 0.36, '#34343e', 0, 1.74, -18.65); // mixer
  target = parts;
  box(0.95, 1.95, 0.95, '#121216', -7.6, 0.97, -18.4); // PA izq
  box(0.95, 1.95, 0.95, '#121216', 7.6, 0.97, -18.4); // PA der
  cyl(0.26, 0.26, 0.1, 10, '#08080a', -7.6, 1.45, -17.87, 0, Math.PI / 2);
  cyl(0.26, 0.26, 0.1, 10, '#08080a', 7.6, 1.45, -17.87, 0, Math.PI / 2);

  /* ── TRUSS: dos vigas hacia la pantalla + parrilla frontal ── */
  for (const tx of [-5.5, 5.5]) {
    box(0.12, 0.12, 17.6, '#3c3c46', tx - 0.18, 6.25, -11);
    box(0.12, 0.12, 17.6, '#3c3c46', tx + 0.18, 6.25, -11);
    box(0.12, 0.12, 17.6, '#3c3c46', tx, 5.93, -11);
    for (let z = -19; z <= -3; z += 2.3) box(0.07, 0.34, 0.07, '#34343e', tx, 6.09, z);
    cyl(0.07, 0.09, 6.2, 6, '#2c2c34', tx, 3.1, -2.4); // pata sur
    cyl(0.07, 0.09, 6.2, 6, '#2c2c34', tx, 3.1, -19.6); // pata norte
  }
  // Parrilla transversal frente a la LED.
  box(11.6, 0.12, 0.12, '#3c3c46', 0, 6.25, -19.18);
  box(11.6, 0.12, 0.12, '#3c3c46', 0, 6.25, -18.82);
  box(11.6, 0.12, 0.12, '#3c3c46', 0, 5.93, -19);
  for (let x = -5; x <= 5; x += 2) box(0.07, 0.34, 0.07, '#34343e', x, 6.09, -19);
  // Cuerpos de fixtures (la luz/beam la anima extras.js).
  for (const [hx, hy, hz] of ANCHORS.rig.heads) {
    box(0.22, 0.12, 0.22, '#1c1c22', hx, hy + 0.2, hz); // yugo
    cyl(0.11, 0.14, 0.3, 8, '#101016', hx, hy, hz); // cabezal
  }
  for (const [wx, wy, wz] of ANCHORS.rig.washes) {
    cyl(0.13, 0.17, 0.36, 8, '#15151a', wx, wy, wz, 0, 0.9); // wash inclinado a pista
  }
  for (const [sx, sy, sz] of ANCHORS.rig.strobes) {
    box(1.3, 0.1, 0.14, '#101014', sx, sy, sz); // barra de strobo
  }

  /* ── Mesas redondas con mantel + sillas (las reemplaza mesas.glb) ── */
  target = partsTables;
  for (const [tx, tz] of TABLES) {
    cyl(1.05, 1.2, 0.78, 9, '#d6cebc', tx, 0.39, tz);
    cyl(1.22, 1.22, 0.07, 9, '#e6dfd0', tx, 0.81, tz);
    cyl(0.16, 0.2, 0.16, 7, '#b9b1a0', tx, 0.93, tz);
    for (let c = 0; c < 6; c++) {
      const a = (c / 6) * Math.PI * 2 + tx * 0.7;
      const cx = tx + Math.cos(a) * 1.85;
      const cz = tz + Math.sin(a) * 1.85;
      box(0.42, 0.45, 0.42, '#55504a', cx, 0.225, cz, -a);
      box(0.42, 0.55, 0.08, '#55504a', cx - Math.cos(a) * 0.2, 0.72, cz - Math.sin(a) * 0.2, -a + Math.PI / 2);
    }
  }
  target = parts;

  /* ── Barra al borde sur ── */
  box(9, 1.12, 1.15, '#33333b', 0, 0.56, 19.6);
  box(9.4, 0.1, 1.4, '#4a4a55', 0, 1.16, 19.6);
  box(9, 2.6, 0.42, '#1c1c22', 0, 1.3, 21.6);
  box(9, 0.07, 0.5, '#3c3c46', 0, 1.5, 21.45);
  box(9, 0.07, 0.5, '#3c3c46', 0, 2.2, 21.45);
  const bottleCols = ['#7a2620', '#7a4d1c', '#7a701c', '#3f6420', '#1c4a70', '#5e3550'];
  for (let i = 0; i < 14; i++) {
    const bx = -4 + (i * 8.2) / 13 + (i % 3) * 0.08;
    const by = i % 2 ? 1.74 : 2.44;
    cyl(0.06, 0.075, 0.42, 6, bottleCols[i % 6], bx, by, 21.42);
  }

  /* ── Lounge sureste (lo reemplaza el living de mesas.glb) ── */
  target = partsTables;
  for (const [sx, sz, sr] of [[17.5, 13, 0.5], [20.5, 16.5, -0.9]]) {
    box(2.5, 0.5, 1.0, '#6b5048', sx, 0.32, sz, sr);
    box(2.5, 0.62, 0.22, '#7a5c52', sx - Math.sin(sr) * 0.42, 0.78, sz - Math.cos(sr) * 0.42, sr);
  }
  cyl(0.55, 0.62, 0.42, 8, '#3c3630', 18.6, 0.21, 14.9);
  target = parts;

  /* ── Mesa de DISEÑO al rincón suroeste (lejos de la barra) ── */
  box(2.2, 0.1, 1.2, '#4a4038', -14.5, 0.93, 18.2);
  for (const [lx, lz] of [[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]]) {
    cyl(0.045, 0.055, 0.9, 6, '#2e2822', -14.5 + lx, 0.45, 18.2 + lz);
  }
  const paperRots = [0.2, -0.4, 0.7, -0.15];
  for (let i = 0; i < 4; i++) {
    // Papel apagado: que no queme bajo la lámpara.
    box(0.4, 0.012, 0.54, i % 2 ? '#b9b3a4' : '#a8a294', -15.05 + (i % 2) * 0.7, 0.99, 17.95 + Math.floor(i / 2) * 0.55, paperRots[i]);
  }
  // Chips de la brand bar sobre la mesa.
  const brand = ['#f63f2f', '#fe720c', '#feca0d', '#7fc527', '#1f93e0'];
  brand.forEach((c, i) => box(0.16, 0.014, 0.16, c, -15.0 + i * 0.22, 1.0, 18.62, 0.12));
  // Laptop.
  box(0.5, 0.04, 0.36, '#26262e', -13.85, 1.0, 18.05, -0.4);
  const lap = new THREE.BoxGeometry(0.5, 0.36, 0.03);
  lap.rotateX(-0.35); lap.rotateY(-0.4); lap.translate(-14.0, 1.18, 17.92);
  push(lap, '#1b1b22');
  // El escritorio de EDICIÓN ya no existe acá: el modelo del editor
  // trae su propia mesa y PC.

  // El set de fotografía salió de escena: los fotógrafos trabajan
  // entre la gente y sus cámaras vienen en los modelos GLB.

  /* ── Consola VJ junto a la cabina (VISUALES) ──
     El VJ está al NORTE de la mesa: los monitores van al borde SUR,
     con las pantallas mirando hacia él (extras.js las enciende). */
  box(1.7, 0.08, 0.85, '#1d1d23', 4.6, 0.96, -17.6);
  box(0.08, 0.95, 0.7, '#15151a', 3.85, 0.48, -17.6);
  box(0.08, 0.95, 0.7, '#15151a', 5.35, 0.48, -17.6);
  box(0.55, 0.04, 0.4, '#26262e', 4.35, 1.02, -17.62, 0.2);
  const vjLap = new THREE.BoxGeometry(0.55, 0.38, 0.03);
  vjLap.rotateX(0.42); vjLap.rotateY(0.2); vjLap.translate(4.32, 1.2, -17.42);
  push(vjLap, '#101016');
  for (const mx of [-0.55, 0.45]) {
    const mon = new THREE.BoxGeometry(0.52, 0.36, 0.04);
    mon.rotateX(0.18); mon.rotateY(mx < 0 ? 0.28 : -0.28);
    mon.translate(4.6 + mx + 0.1, 1.38, -17.3);
    push(mon, '#15151c');
    cyl(0.04, 0.05, 0.3, 5, '#22222a', 4.6 + mx + 0.1, 1.12, -17.3);
  }

  /* ── Control remoto del piloto de DRONE ── */
  box(0.22, 0.06, 0.15, '#1c1c22', 13.22, 0.97, 6.78, -2.25);
  cyl(0.008, 0.008, 0.22, 4, '#44444e', 13.18, 1.12, 6.74);

  /* ── Merge: estáticos + dos meshes removibles (mesas, cabina DJ) ── */
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mkMesh = (list) => {
    const g = mergeGeometries(list);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m);
    return m;
  };
  const statics = mkMesh(parts);
  const tablesMesh = mkMesh(partsTables);
  const djMesh = mkMesh(partsDJ);

  /* ── Pista de baile (textura damero, 1 draw call) ── */
  const cnv = document.createElement('canvas');
  cnv.width = 288; cnv.height = 208;
  const ctx = cnv.getContext('2d');
  for (let yy = 0; yy < 13; yy++) {
    for (let xx = 0; xx < 18; xx++) {
      ctx.fillStyle = (xx + yy) % 2 ? '#1b1b21' : '#2e2e38';
      ctx.fillRect(xx * 16, yy * 16, 16, 16);
    }
  }
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const dance = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 13),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  dance.rotation.x = -Math.PI / 2;
  dance.position.set(0, 0.1, -9);
  dance.matrixAutoUpdate = false;
  dance.updateMatrix();
  scene.add(dance);

  return { statics, dance, tablesMesh, djMesh };
}
