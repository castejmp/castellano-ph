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

export const TABLES = [
  [-13, 4], [-5, 5], [3, 4], [11, 5],
  [-9, 11], [-1, 12], [7, 11], [14, 12],
];

export const ANCHORS = {
  led: { pos: [0, 4.8, -22.1], size: [20, 8] },
  mapping: [
    { pos: [0, 5.1, -22.35], size: [56, 9.4], ry: 0 },
    { pos: [28.55, 4, -8], size: [19.4, 7.4], ry: -Math.PI / 2 },
    { pos: [-28.55, 4, -8], size: [19.4, 7.4], ry: Math.PI / 2 },
  ],
  // El flash dispara donde está el fotógrafo: entre la gente.
  flashAt: [3.62, 1.7, -6.35],
  editScreen: { pos: [12.4, 1.78, -9.89], ry: Math.PI },
  // Parrilla de luces: cabezales móviles, washes y strobos.
  rig: {
    heads: [[-5.5, 5.8, -6.5], [5.5, 5.8, -6.5], [-5.5, 5.8, -13], [5.5, 5.8, -13]],
    washes: [[-5, 5.72, -19], [-2.5, 5.72, -19], [0, 5.72, -19], [2.5, 5.72, -19], [5, 5.72, -19]],
    strobes: [[-1.6, 5.6, -19], [1.6, 5.6, -19]],
  },
  // Neón acostado al lado ESTE de la pista, mirando al cielo (detalle gaming).
  neon: { pos: [10.45, 0.05, -9], size: [7, 1.5] },
  droneCenter: [0, 9.5, -4],
};

export function buildWorld(scene) {
  const parts = [];
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
    parts.push(g);
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

  /* ── Tarima + cabina DJ (el DJ va arriba, visible) ── */
  box(4.6, 0.5, 2.2, '#17171c', 0, 0.25, -19.4); // tarima
  box(4.2, 1.1, 1.0, '#1d1d23', 0, 1.05, -18.7); // cabina
  box(3.6, 0.14, 0.85, '#101014', 0, 1.66, -18.7); // tapa
  box(0.62, 0.1, 0.5, '#2c2c34', -1.05, 1.76, -18.7); // deck izq
  box(0.62, 0.1, 0.5, '#2c2c34', 1.05, 1.76, -18.7); // deck der
  box(0.5, 0.07, 0.36, '#34343e', 0, 1.74, -18.65); // mixer
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

  /* ── Mesas redondas con mantel + sillas (zona sur) ── */
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

  /* ── Lounge sureste ── */
  for (const [sx, sz, sr] of [[17.5, 13, 0.5], [20.5, 16.5, -0.9]]) {
    box(2.5, 0.5, 1.0, '#6b5048', sx, 0.32, sz, sr);
    box(2.5, 0.62, 0.22, '#7a5c52', sx - Math.sin(sr) * 0.42, 0.78, sz - Math.cos(sr) * 0.42, sr);
  }
  cyl(0.55, 0.62, 0.42, 8, '#3c3630', 18.6, 0.21, 14.9);

  /* ── Mesa de DISEÑO al borde OESTE de la pista ── */
  box(3.2, 0.12, 1.75, '#4a4038', -12.4, 0.96, -8.4);
  for (const [lx, lz] of [[-1.4, -0.72], [1.4, -0.72], [-1.4, 0.72], [1.4, 0.72]]) {
    cyl(0.05, 0.06, 0.92, 6, '#2e2822', -12.4 + lx, 0.46, -8.4 + lz);
  }
  const paperRots = [0.2, -0.4, 0.9, -0.15, 0.55, -0.75];
  for (let i = 0; i < 6; i++) {
    const px = -13.4 + (i % 3) * 1.0;
    const pz = -8.85 + Math.floor(i / 3) * 0.8;
    box(0.46, 0.012, 0.62, i % 2 ? '#e9e4d8' : '#dcd5c6', px, 1.03, pz, paperRots[i]);
  }
  // Chips de la brand bar sobre la mesa.
  const brand = ['#f63f2f', '#fe720c', '#feca0d', '#7fc527', '#1f93e0'];
  brand.forEach((c, i) => box(0.2, 0.016, 0.2, c, -13.35 + i * 0.27, 1.04, -7.78, 0.12));
  // Laptop.
  box(0.62, 0.045, 0.44, '#26262e', -11.5, 1.05, -8.75, -0.5);
  const lap = new THREE.BoxGeometry(0.62, 0.42, 0.03);
  lap.rotateX(-0.35); lap.rotateY(-0.5); lap.translate(-11.69, 1.26, -8.9);
  push(lap, '#1b1b22');

  /* ── Escritorio de EDICIÓN al borde ESTE de la pista ── */
  box(2.9, 0.1, 1.35, '#4a4038', 12.4, 0.96, -9.5);
  for (const [lx, lz] of [[-1.25, -0.55], [1.25, -0.55], [-1.25, 0.55], [1.25, 0.55]]) {
    cyl(0.05, 0.06, 0.92, 6, '#2e2822', 12.4 + lx, 0.46, -9.5 + lz);
  }
  box(1.5, 0.92, 0.08, '#101016', 12.4, 1.78, -10.0, Math.PI); // marco monitor
  cyl(0.06, 0.16, 0.32, 6, '#1c1c24', 12.4, 1.18, -9.95); // pie
  // Silla del editor (mirando al norte, hacia el escritorio).
  cyl(0.27, 0.31, 0.05, 8, '#101014', 12.4, 0.03, -8.5);
  cyl(0.045, 0.05, 0.52, 6, '#15151a', 12.4, 0.3, -8.5);
  box(0.52, 0.06, 0.5, '#1d1d23', 12.4, 0.59, -8.5);
  box(0.5, 0.55, 0.06, '#1d1d23', 12.4, 0.95, -8.26);
  // Tendedero de polaroids al costado.
  cyl(0.035, 0.045, 2.6, 5, '#3c3c46', 15.3, 1.3, -7.6);
  cyl(0.035, 0.045, 2.6, 5, '#3c3c46', 15.3, 1.3, -10.4);
  const wire = new THREE.CylinderGeometry(0.012, 0.012, 2.8, 4);
  wire.rotateX(Math.PI / 2); wire.translate(15.3, 2.52, -9.0);
  push(wire, '#55555f');
  for (let i = 0; i < 6; i++) {
    box(0.23, 0.27, 0.012, '#e9e6dd', 15.3, 2.34, -7.8 - i * 0.48, Math.PI / 2 + (i % 2 ? 0.12 : -0.1));
  }

  /* ── Set de FOTOGRAFÍA (utilería, rincón este) ── */
  const bdRy = -0.99;
  box(4.4, 3.3, 0.1, '#cfcbc2', 23.9, 1.66, -14.3, bdRy);
  box(4.6, 0.16, 0.7, '#2c2c34', 23.9, 0.06, -14.3, bdRy);
  for (const [sx, sz, sr] of [[21.0, -10.8, -0.6], [25.4, -11.6, -1.45]]) {
    cyl(0.045, 0.06, 2.3, 6, '#2a2a32', sx, 1.15, sz);
    cyl(0.4, 0.46, 0.1, 7, '#22222a', sx, 0.04, sz);
    box(0.78, 0.78, 0.3, '#e8e8e4', sx, 2.42, sz, sr);
  }
  for (let l = 0; l < 3; l++) {
    const a = (l / 3) * Math.PI * 2;
    cyl(0.025, 0.035, 1.5, 5, '#33333b', 21.9 + Math.cos(a) * 0.3, 0.72, -12.5 + Math.sin(a) * 0.3, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
  }
  box(0.36, 0.24, 0.3, '#16161c', 21.9, 1.45, -12.5, bdRy);
  cyl(0.07, 0.09, 0.16, 8, '#0c0c10', 21.9, 1.45, -12.32, 0, Math.PI / 2);

  /* ── Cámara EN MANO del fotógrafo (que está entre la gente) ── */
  box(0.3, 0.2, 0.16, '#16161c', 3.62, 1.08, -6.32, 0.4);
  cyl(0.06, 0.08, 0.14, 8, '#0c0c10', 3.66, 1.08, -6.2, 0, Math.PI / 2);

  /* ── Cámara de VIDEO en trípode, al borde de la pista ── */
  const vRy = 2.474;
  for (let l = 0; l < 3; l++) {
    const a = (l / 3) * Math.PI * 2;
    cyl(0.025, 0.035, 1.38, 5, '#33333b', -3.3 + Math.cos(a) * 0.32, 0.66, -4.8 + Math.sin(a) * 0.32, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
  }
  box(0.42, 0.28, 0.55, '#16161c', -3.3, 1.48, -4.8, vRy);
  cyl(0.07, 0.1, 0.2, 8, '#0c0c10', -3.3 + 0.22, 1.48, -4.8 - 0.28, 0, Math.PI / 2);
  box(0.2, 0.14, 0.03, '#26262e', -3.3 - 0.3, 1.56, -4.8 + 0.18, vRy + 0.5);

  /* ── Consola VJ junto a la cabina (VISUALES) ── */
  box(1.7, 0.08, 0.85, '#1d1d23', 4.6, 0.96, -17.6);
  box(0.08, 0.95, 0.7, '#15151a', 3.85, 0.48, -17.6);
  box(0.08, 0.95, 0.7, '#15151a', 5.35, 0.48, -17.6);
  box(0.55, 0.04, 0.4, '#26262e', 4.35, 1.02, -17.5, 0.25);
  const vjLap = new THREE.BoxGeometry(0.55, 0.38, 0.03);
  vjLap.rotateX(-0.4); vjLap.rotateY(0.25); vjLap.translate(4.32, 1.22, -17.68);
  push(vjLap, '#101016');
  for (const mx of [-0.55, 0.45]) {
    const mon = new THREE.BoxGeometry(0.52, 0.36, 0.04);
    mon.rotateX(-0.18); mon.rotateY(mx < 0 ? 0.3 : -0.3);
    mon.translate(4.6 + mx + 0.1, 1.38, -17.85);
    push(mon, '#15151c');
    cyl(0.04, 0.05, 0.3, 5, '#22222a', 4.6 + mx + 0.1, 1.12, -17.85);
  }

  /* ── Control remoto del piloto de DRONE ── */
  box(0.22, 0.06, 0.15, '#1c1c22', 13.22, 0.97, 6.78, -2.25);
  cyl(0.008, 0.008, 0.22, 4, '#44444e', 13.18, 1.12, 6.74);

  /* ── Merge: todo lo estático en un draw call ── */
  const merged = mergeGeometries(parts);
  merged.computeVertexNormals();
  const statics = new THREE.Mesh(
    merged,
    new THREE.MeshLambertMaterial({ vertexColors: true })
  );
  statics.matrixAutoUpdate = false;
  scene.add(statics);

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

  return { statics, dance };
}
