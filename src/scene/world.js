import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * EL SALÓN — maqueta de arquitecto low-poly, 100% procedural.
 * Toda la utilería estática se pinta con vertex colors y se mergea
 * en UN solo mesh (1 draw call). La losa flota en el vacío.
 *
 * Plano (x este→oeste, z norte→sur):
 *   LED + DJ al norte (z<0) · pista al centro · mesas al sur ·
 *   mesa de diseño oeste · set de fotos este · edición noroeste ·
 *   barra al borde sur · lounge sureste.
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
  flashAt: [22.2, 2.1, -12.4],
  editScreen: { pos: [-23.0, 1.78, -13.45], ry: 0.95 },
  festoonPoles: [
    [-9.8, 3.8, -2.8], [9.8, 3.8, -2.8],
    [-9.8, 3.8, -15.2], [9.8, 3.8, -15.2],
  ],
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
  // Filo superior apenas más claro: el borde de la maqueta se lee.
  box(66.3, 0.14, 46.3, '#3a3a44', 0, 0.02, 0);

  /* ── Paredes escenográficas (lienzos del mapping) ── */
  box(58, 10.4, 0.6, '#15151a', 0, 5.2, -22.7);
  box(0.6, 8, 20, '#15151a', 29, 4, -8);
  box(0.6, 8, 20, '#15151a', -29, 4, -8);

  /* ── Cabina DJ + PA ── */
  box(4.2, 1.45, 1.25, '#1d1d23', 0, 0.72, -18.6);
  box(3.6, 0.16, 0.9, '#101014', 0, 1.52, -18.6); // tapa
  box(0.62, 0.1, 0.5, '#2c2c34', -1.05, 1.62, -18.6); // deck izq
  box(0.62, 0.1, 0.5, '#2c2c34', 1.05, 1.62, -18.6); // deck der
  box(0.5, 0.07, 0.36, '#34343e', 0, 1.6, -18.55); // mixer
  box(0.95, 1.95, 0.95, '#121216', -7.6, 0.97, -18.4); // PA izq
  box(0.95, 1.95, 0.95, '#121216', 7.6, 0.97, -18.4); // PA der
  cyl(0.26, 0.26, 0.1, 10, '#08080a', -7.6, 1.45, -17.87, 0, Math.PI / 2);
  cyl(0.26, 0.26, 0.1, 10, '#08080a', 7.6, 1.45, -17.87, 0, Math.PI / 2);

  /* ── Postes del festón sobre la pista ── */
  for (const [px, , pz] of ANCHORS.festoonPoles) {
    cyl(0.06, 0.08, 3.8, 6, '#3c3c46', px, 1.9, pz);
    cyl(0.3, 0.34, 0.1, 8, '#2c2c34', px, 0.05, pz);
  }

  /* ── Mesas redondas con mantel + sillas ── */
  for (const [tx, tz] of TABLES) {
    cyl(1.05, 1.2, 0.78, 9, '#d6cebc', tx, 0.39, tz); // mantel
    cyl(1.22, 1.22, 0.07, 9, '#e6dfd0', tx, 0.81, tz); // tapa
    cyl(0.16, 0.2, 0.16, 7, '#b9b1a0', tx, 0.93, tz); // centro de mesa
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
  box(9.4, 0.1, 1.4, '#4a4a55', 0, 1.16, 19.6); // tapa
  box(9, 2.6, 0.42, '#1c1c22', 0, 1.3, 21.6); // estantería
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
  cyl(0.55, 0.62, 0.42, 8, '#3c3630', 18.6, 0.21, 14.9); // mesa ratona

  /* ── Mesa de trabajo de DISEÑO (oeste) ── */
  box(3.2, 0.12, 1.75, '#4a4038', -22.5, 0.96, 5.5);
  for (const [lx, lz] of [[-1.4, -0.72], [1.4, -0.72], [-1.4, 0.72], [1.4, 0.72]]) {
    cyl(0.05, 0.06, 0.92, 6, '#2e2822', -22.5 + lx, 0.46, 5.5 + lz);
  }
  // Papeles e invitaciones desplegadas.
  const paperRots = [0.2, -0.4, 0.9, -0.15, 0.55, -0.75];
  for (let i = 0; i < 6; i++) {
    const px = -23.5 + (i % 3) * 1.0;
    const pz = 5.0 + Math.floor(i / 3) * 0.85;
    box(0.46, 0.012, 0.62, i % 2 ? '#e9e4d8' : '#dcd5c6', px, 1.03, pz, paperRots[i]);
  }
  // Chips de color — la brand bar sobre la mesa (bien adentro del borde).
  const brand = ['#f63f2f', '#fe720c', '#feca0d', '#7fc527', '#1f93e0'];
  brand.forEach((c, i) => box(0.2, 0.016, 0.2, c, -23.45 + i * 0.27, 1.04, 5.95, 0.12));
  // Laptop.
  box(0.62, 0.045, 0.44, '#26262e', -21.55, 1.05, 5.15, -0.5);
  const lap = new THREE.BoxGeometry(0.62, 0.42, 0.03);
  lap.rotateX(-0.35); lap.rotateY(-0.5); lap.translate(-21.74, 1.26, 5.0);
  push(lap, '#1b1b22');

  /* ── Set de FOTOGRAFÍA (este) ── */
  const bdRy = -0.99;
  box(4.4, 3.3, 0.1, '#cfcbc2', 23.9, 1.66, -14.3, bdRy); // fondo
  box(4.6, 0.16, 0.7, '#2c2c34', 23.9, 0.06, -14.3, bdRy); // base
  // Softboxes (la cabeza emisiva la pone extras.js).
  for (const [sx, sz, sr] of [[21.0, -10.8, -0.6], [25.4, -11.6, -1.45]]) {
    cyl(0.045, 0.06, 2.3, 6, '#2a2a32', sx, 1.15, sz);
    cyl(0.4, 0.46, 0.1, 7, '#22222a', sx, 0.04, sz);
    box(0.78, 0.78, 0.3, '#e8e8e4', sx, 2.42, sz, sr);
  }
  // Trípode + cámara.
  for (let l = 0; l < 3; l++) {
    const a = (l / 3) * Math.PI * 2;
    cyl(0.025, 0.035, 1.5, 5, '#33333b', 21.9 + Math.cos(a) * 0.3, 0.72, -12.5 + Math.sin(a) * 0.3, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
  }
  box(0.36, 0.24, 0.3, '#16161c', 21.9, 1.45, -12.5, bdRy);
  cyl(0.07, 0.09, 0.16, 8, '#0c0c10', 21.9, 1.45, -12.32, 0, Math.PI / 2);

  /* ── Rincón de EDICIÓN (noroeste) ── */
  box(2.9, 0.1, 1.35, '#4a4038', -23.1, 0.96, -13.4, 0.95);
  for (const [lx, lz] of [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]]) {
    cyl(0.05, 0.06, 0.92, 6, '#2e2822', -23.1 + Math.cos(0.95) * lx - Math.sin(0.95) * lz, 0.46, -13.4 + Math.sin(0.95) * lx + Math.cos(0.95) * lz);
  }
  box(1.5, 0.92, 0.08, '#101016', -23.0, 1.78, -13.55, 0.95); // marco monitor
  cyl(0.06, 0.16, 0.32, 6, '#1c1c24', -23.0, 1.18, -13.5); // pie
  // Silla de oficina del editor (alineada con el escritorio).
  cyl(0.27, 0.31, 0.05, 8, '#101014', -22.2, 0.03, -12.75); // base
  cyl(0.045, 0.05, 0.52, 6, '#15151a', -22.2, 0.3, -12.75); // columna
  box(0.52, 0.06, 0.5, '#1d1d23', -22.2, 0.59, -12.75, -2.19); // asiento
  box(0.5, 0.55, 0.06, '#1d1d23', -22.0, 0.95, -12.61, -2.19); // respaldo
  // Tendedero de polaroids.
  cyl(0.035, 0.045, 2.6, 5, '#3c3c46', -25.6, 1.3, -11.2);
  cyl(0.035, 0.045, 2.6, 5, '#3c3c46', -22.4, 1.3, -16.4);
  const wire = new THREE.CylinderGeometry(0.012, 0.012, 6.1, 4);
  wire.rotateZ(Math.PI / 2); wire.rotateY(-1.02); wire.translate(-24, 2.52, -13.8);
  push(wire, '#55555f');
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6 - 0.5;
    box(0.23, 0.27, 0.012, '#e9e6dd', -24 + Math.cos(-1.02 + Math.PI / 2) * u * 6.1, 2.34, -13.8 + Math.sin(-1.02 + Math.PI / 2) * u * 6.1, -1.02 + (i % 2 ? 0.12 : -0.1));
  }

  /* ── Cámara de VIDEO en trípode, al borde de la pista ── */
  const vRy = 2.474; // apunta al centro de la pista
  for (let l = 0; l < 3; l++) {
    const a = (l / 3) * Math.PI * 2;
    cyl(0.025, 0.035, 1.38, 5, '#33333b', -3.3 + Math.cos(a) * 0.32, 0.66, -4.8 + Math.sin(a) * 0.32, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
  }
  box(0.42, 0.28, 0.55, '#16161c', -3.3, 1.48, -4.8, vRy);
  cyl(0.07, 0.1, 0.2, 8, '#0c0c10', -3.3 + 0.22, 1.48, -4.8 - 0.28, 0, Math.PI / 2); // lente
  box(0.2, 0.14, 0.03, '#26262e', -3.3 - 0.3, 1.56, -4.8 + 0.18, vRy + 0.5); // visor

  /* ── Consola VJ junto a la cabina (VISUALES) ── */
  box(1.7, 0.08, 0.85, '#1d1d23', 4.6, 0.96, -17.6);
  box(0.08, 0.95, 0.7, '#15151a', 3.85, 0.48, -17.6);
  box(0.08, 0.95, 0.7, '#15151a', 5.35, 0.48, -17.6);
  box(0.55, 0.04, 0.4, '#26262e', 4.35, 1.02, -17.5, 0.25); // laptop base
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
