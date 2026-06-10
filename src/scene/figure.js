import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * LAS FIGURAS — low-poly, 100% procedural, pensadas para instanciar.
 * Cuatro siluetas que comparten esqueleto y altura (~1.6):
 *   · guestMale   → traje, camisa, corbata, zapatos
 *   · guestFemale → vestido largo, brazos al aire, taco, clutch
 *   · operator    → remera negra, pantalón cargo, zapatillas
 *   · operatorSeated → idem, sentado (para el editor)
 *
 * Cada figura se parte en 4 buckets para colorear sin romper instancing:
 *   garment (instanceColor = ropa) · skin (instanceColor = piel)
 *   hair (instanceColor = pelo)    · detail (vertex colors fijos:
 *   camisa, corbata, zapatos, taco, clutch, suela, logo)
 */

class FB {
  constructor() { this.garment = []; this.skin = []; this.hair = []; this.detail = []; }

  _mk(geo, rx, ry, rz, x, y, z) {
    if (rz) geo.rotateZ(rz);
    if (rx) geo.rotateX(rx);
    if (ry) geo.rotateY(ry);
    geo.translate(x, y, z);
    return geo.toNonIndexed();
  }
  box(b, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, hex) {
    this._push(b, this._mk(new THREE.BoxGeometry(w, h, d), rx, ry, rz, x, y, z), hex);
  }
  cyl(b, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0, hex) {
    this._push(b, this._mk(new THREE.CylinderGeometry(rt, rb, h, seg), rx, ry, rz, x, y, z), hex);
  }
  sph(b, r, sx, sy, sz, x, y, z, hex) {
    const g = new THREE.SphereGeometry(r, 8, 6);
    g.scale(sx, sy, sz); g.translate(x, y, z);
    this._push(b, g.toNonIndexed(), hex);
  }
  /** Brazo: cilindro pivotado en el hombro, hacia afuera (rz) y al frente (rx). */
  arm(b, side, len, rOut, rFwd, shY, shX, rad = 0.055) {
    const g = new THREE.CylinderGeometry(rad, rad * 0.92, len, 6);
    g.translate(0, -len / 2, 0);
    g.rotateX(rFwd);
    g.rotateZ(side * rOut);
    g.translate(side * shX, shY, 0);
    this._push(b, g.toNonIndexed());
    // Punta del brazo (mano) en skin.
    const hx = side * (shX + Math.sin(rOut) * len);
    const hy = shY - Math.cos(rOut) * len * Math.cos(rFwd);
    const hz = Math.sin(rFwd) * len;
    this.sph('skin', 0.058, 1, 1, 1, hx, hy, hz);
    return [hx, hy, hz];
  }
  /** Cabeza + cuello + pelo. hairBack = melena hasta los hombros. */
  head(skinHex, hairBack = false) {
    this.cyl('skin', 0.058, 0.062, 0.1, 6, 0, 1.36, 0);          // cuello
    this.cyl('skin', 0.118, 0.118, 0.2, 9, 0, 1.5, 0);           // cabeza
    this.sph('skin', 0.118, 1, 0.7, 1, 0, 1.58, 0);              // mentón/tope
    this.sph('hair', 0.126, 1, 0.62, 1, 0, 1.605, 0);            // casquete
    this.box('hair', 0.2, 0.1, 0.16, 0, 1.62, -0.04);            // nuca
    if (hairBack) {
      this.box('hair', 0.21, 0.26, 0.12, 0, 1.42, -0.07);        // melena
      this.box('hair', 0.1, 0.14, 0.12, -0.1, 1.5, 0.04);
      this.box('hair', 0.1, 0.14, 0.12, 0.1, 1.5, 0.04);
    }
  }

  _push(b, g, hex) {
    if (b === 'detail') {
      const c = new THREE.Color(hex);
      const n = g.attributes.position.count;
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    this[b].push(g);
  }
  build() {
    const m = (arr) => {
      if (!arr.length) return null;
      const g = mergeGeometries(arr);
      g.computeVertexNormals();
      return g;
    };
    return { garment: m(this.garment), skin: m(this.skin), hair: m(this.hair), detail: m(this.detail) };
  }
}

const SHIRT = '#e9e9ec', TIE = '#1d2029', SHOE = '#0a0a0c', SOLE = '#d6d6d8', LOGO = '#f0f0f2';

/* ── Invitado de traje ── */
export function buildGuestMale() {
  const f = new FB();
  // Piernas (pantalón de vestir).
  f.box('garment', 0.155, 0.8, 0.19, -0.1, 0.4, 0);
  f.box('garment', 0.155, 0.8, 0.19, 0.1, 0.4, 0);
  f.box('detail', 0.17, 0.1, 0.34, -0.1, 0.05, 0.07, 0, 0, 0, SHOE);
  f.box('detail', 0.17, 0.1, 0.34, 0.1, 0.05, 0.07, 0, 0, 0, SHOE);
  // Saco (torso trapezoidal) + solapas.
  f.cyl('garment', 0.2, 0.28, 0.54, 8, 0, 1.07, 0);
  f.box('garment', 0.07, 0.3, 0.05, -0.1, 1.18, 0.21, 0, 0, 0.25);
  f.box('garment', 0.07, 0.3, 0.05, 0.1, 1.18, 0.21, 0, 0, -0.25);
  // Camisa + corbata.
  f.box('detail', 0.13, 0.34, 0.04, 0, 1.16, 0.21, 0, 0, 0, SHIRT);
  f.box('detail', 0.04, 0.27, 0.02, 0, 1.12, 0.235, 0, 0, 0, TIE);
  f.box('detail', 0.42, 0.06, 0.26, 0, 0.81, 0, 0, 0, 0, SHOE); // cinturón
  // Brazos (mangas del saco) algo abiertos.
  f.arm('garment', -1, 0.52, 0.2, 0.12, 1.28, 0.2);
  f.arm('garment', 1, 0.52, 0.2, 0.12, 1.28, 0.2);
  f.head();
  return f.build();
}

/* ── Invitada de vestido largo ── */
export function buildGuestFemale() {
  const f = new FB();
  // Falda larga acampanada + tajo insinuado por el ancho.
  f.cyl('garment', 0.16, 0.34, 0.92, 8, 0, 0.46, 0);
  // Corpiño.
  f.cyl('garment', 0.145, 0.165, 0.42, 8, 0, 1.12, 0);
  // Breteles.
  f.box('garment', 0.03, 0.2, 0.03, -0.1, 1.36, 0.02);
  f.box('garment', 0.03, 0.2, 0.03, 0.1, 1.36, 0.02);
  // Brazos al aire (piel).
  f.arm('skin', -1, 0.48, 0.22, 0.15, 1.3, 0.16, 0.045);
  f.arm('skin', 1, 0.48, 0.22, 0.15, 1.3, 0.16, 0.045);
  // Taco + clutch.
  f.box('detail', 0.1, 0.06, 0.18, -0.11, 0.03, 0.04, 0, 0, 0, SHOE);
  f.box('detail', 0.1, 0.06, 0.18, 0.11, 0.03, 0.04, 0, 0, 0, SHOE);
  f.box('detail', 0.14, 0.09, 0.04, 0.34, 0.78, 0.16, 0, 0, 0, TIE); // clutch
  f.head('#e8b98f', true);
  return f.build();
}

/* ── Operador de pie: remera negra + cargo + zapatillas ── */
function operatorLegsTorso(f) {
  // Pantalón cargo (más holgado).
  f.box('garment', 0.18, 0.82, 0.22, -0.11, 0.43, 0);
  f.box('garment', 0.18, 0.82, 0.22, 0.11, 0.43, 0);
  f.box('garment', 0.1, 0.16, 0.24, -0.17, 0.5, 0.02); // bolsillo cargo
  f.box('garment', 0.1, 0.16, 0.24, 0.17, 0.5, 0.02);
  // Zapatillas (suela blanca).
  f.box('detail', 0.18, 0.08, 0.32, -0.11, 0.09, 0.07, 0, 0, 0, SHOE);
  f.box('detail', 0.18, 0.08, 0.32, 0.11, 0.09, 0.07, 0, 0, 0, SHOE);
  f.box('detail', 0.19, 0.04, 0.33, -0.11, 0.03, 0.07, 0, 0, 0, SOLE);
  f.box('detail', 0.19, 0.04, 0.33, 0.11, 0.03, 0.07, 0, 0, 0, SOLE);
  // Remera.
  f.cyl('garment', 0.2, 0.25, 0.46, 8, 0, 1.08, 0);
  f.box('detail', 0.12, 0.05, 0.04, 0, 1.16, 0.215, 0, 0, 0, LOGO); // logo al pecho
}
export function buildOperator() {
  const f = new FB();
  operatorLegsTorso(f);
  // Brazos al frente (sosteniendo el gear).
  f.arm('skin', -1, 0.5, 0.16, 0.62, 1.28, 0.18, 0.05);
  f.arm('skin', 1, 0.5, 0.16, 0.62, 1.28, 0.18, 0.05);
  f.head();
  return f.build();
}

/* ── Operador sentado: muslos al frente + tibias abajo ── */
export function buildOperatorSeated() {
  const f = new FB();
  // Muslos horizontales sobre la silla (cadera a ~0.5).
  f.box('garment', 0.18, 0.18, 0.46, -0.11, 0.48, 0.2);
  f.box('garment', 0.18, 0.18, 0.46, 0.11, 0.48, 0.2);
  // Tibias hacia el piso.
  f.box('garment', 0.16, 0.46, 0.17, -0.11, 0.23, 0.42);
  f.box('garment', 0.16, 0.46, 0.17, 0.11, 0.23, 0.42);
  f.box('detail', 0.18, 0.08, 0.3, -0.11, 0.06, 0.5, 0, 0, 0, SHOE);
  f.box('detail', 0.18, 0.08, 0.3, 0.11, 0.06, 0.5, 0, 0, 0, SHOE);
  // Torso desde la cadera sentada.
  f.cyl('garment', 0.2, 0.25, 0.44, 8, 0, 0.78, 0);
  f.box('detail', 0.12, 0.05, 0.04, 0, 0.86, 0.215, 0, 0, 0, LOGO);
  // Brazos al frente, tecleando.
  f.arm('skin', -1, 0.46, 0.18, 0.95, 0.98, 0.18, 0.05);
  f.arm('skin', 1, 0.46, 0.18, 0.95, 0.98, 0.18, 0.05);
  // Cabeza (cuello/cabeza relativos al torso sentado).
  f.cyl('skin', 0.058, 0.062, 0.1, 6, 0, 1.06, 0);
  f.cyl('skin', 0.118, 0.118, 0.2, 9, 0, 1.2, 0);
  f.sph('skin', 0.118, 1, 0.7, 1, 0, 1.28, 0);
  f.sph('hair', 0.126, 1, 0.62, 1, 0, 1.305, 0);
  f.box('hair', 0.2, 0.1, 0.16, 0, 1.32, -0.04);
  return f.build();
}
