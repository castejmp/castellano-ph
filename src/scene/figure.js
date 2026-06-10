import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * LAS FIGURAS — low-poly, 100% procedurales, para instanciar.
 * Cuatro siluetas (~1.65 de alto) inspiradas en la referencia de marca:
 *   · guestMale   → traje: saco con hombros, camisa, corbata, zapatos
 *   · guestFemale → vestido largo entallado, brazos al aire, taco, clutch
 *   · operator    → remera negra con logo, cargo, zapatillas, manos al frente
 *   · operatorSeated → idem, sentado tecleando (el editor)
 *
 * Buckets para colorear por instancia sin romper el instancing:
 *   garment (ropa) · skin (piel) · hair (pelo) · detail (colores fijos).
 *
 * Los brazos se construyen soldados: brazo y mano comparten la MISMA
 * cadena de transformaciones, así nunca se despegan del hombro.
 */

const SHIRT = '#e9e9ec', TIE = '#1d2029', SHOE = '#0a0a0c', SOLE = '#d6d6d8', LOGO = '#f0f0f2';

class FB {
  constructor() { this.garment = []; this.skin = []; this.hair = []; this.detail = []; }

  _push(bucket, g, hex) {
    g = g.toNonIndexed();
    if (bucket === 'detail') {
      const c = new THREE.Color(hex || '#888');
      const n = g.attributes.position.count;
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    this[bucket].push(g);
  }
  box(b, w, h, d, x, y, z, ry = 0, hex) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    this._push(b, g, hex);
  }
  cyl(b, rt, rb, h, seg, x, y, z, hex) {
    this._push(b, new THREE.CylinderGeometry(rt, rb, h, seg).translate(x, y, z), hex);
  }
  sph(b, r, sx, sy, sz, x, y, z, hex) {
    const g = new THREE.SphereGeometry(r, 8, 6);
    g.scale(sx, sy, sz);
    g.translate(x, y, z);
    this._push(b, g, hex);
  }

  /**
   * Brazo soldado. side ±1 · out: apertura lateral · fwd: elevación al
   * frente (0 = colgando, π/2 = horizontal). Manga y mano comparten
   * transformación: rotateX(-fwd) → rotateZ(side·out) → hombro.
   */
  arm(side, { len, out, fwd, shX, shY, rad, sleeve }) {
    const place = (g) => {
      g.rotateX(-fwd);
      g.rotateZ(side * out);
      g.translate(side * shX, shY, 0);
      return g;
    };
    this._push(sleeve, place(new THREE.CylinderGeometry(rad, rad * 0.88, len, 6).translate(0, -len / 2, 0)));
    this._push('skin', place(new THREE.SphereGeometry(rad * 1.2, 6, 5).translate(0, -len, 0)));
    // Hombro redondeado.
    this.sph(sleeve, rad * 1.35, 1, 0.9, 1, side * shX, shY + 0.01, 0);
  }

  /** Cuello + cabeza facetada. hairStyle: 'short' | 'bob' | 'bun'. */
  head(baseY, hairStyle = 'short') {
    this.cyl('skin', 0.055, 0.06, 0.09, 6, 0, baseY + 0.045, 0);
    this.cyl('skin', 0.115, 0.112, 0.2, 9, 0, baseY + 0.2, 0);
    this.sph('skin', 0.115, 1, 0.68, 1, 0, baseY + 0.29, 0);
    this.sph('skin', 0.11, 1, 0.5, 1, 0, baseY + 0.11, 0); // mentón
    // Pelo: casquete que abraza la coronilla + nuca.
    this.sph('hair', 0.124, 1, 0.6, 1, 0, baseY + 0.305, 0);
    this.box('hair', 0.19, 0.16, 0.09, 0, baseY + 0.21, -0.09);
    if (hairStyle === 'bob') {
      this.box('hair', 0.23, 0.24, 0.1, 0, baseY + 0.14, -0.08);
      this.box('hair', 0.06, 0.18, 0.14, -0.115, baseY + 0.18, 0.01);
      this.box('hair', 0.06, 0.18, 0.14, 0.115, baseY + 0.18, 0.01);
    } else if (hairStyle === 'bun') {
      this.sph('hair', 0.07, 1, 1, 1, 0, baseY + 0.3, -0.12);
    }
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

/* ── Invitado de traje (~1.66) · dance = un brazo arriba ── */
export function buildGuestMale(dance = false) {
  const f = new FB();
  // Zapatos + pantalón de vestir.
  f.box('detail', 0.16, 0.09, 0.32, -0.1, 0.045, 0.05, 0, SHOE);
  f.box('detail', 0.16, 0.09, 0.32, 0.1, 0.045, 0.05, 0, SHOE);
  f.box('garment', 0.15, 0.76, 0.18, -0.1, 0.47, 0);
  f.box('garment', 0.15, 0.76, 0.18, 0.1, 0.47, 0);
  // Saco: cintura + pecho con hombros marcados.
  f.box('garment', 0.32, 0.26, 0.21, 0, 0.96, 0);
  f.box('garment', 0.38, 0.34, 0.23, 0, 1.23, 0);
  // Camisa, corbata, cinturón.
  f.box('detail', 0.14, 0.4, 0.025, 0, 1.18, 0.115, 0, SHIRT);
  f.box('detail', 0.045, 0.32, 0.02, 0, 1.14, 0.135, 0, TIE);
  f.box('detail', 0.34, 0.05, 0.2, 0, 0.835, 0, 0, SHOE);
  // Brazos con manga de saco. Bailando: el derecho al cielo.
  f.arm(-1, { len: 0.52, out: dance ? 0.2 : 0.14, fwd: dance ? 0.4 : 0.12, shX: 0.2, shY: 1.36, rad: 0.052, sleeve: 'garment' });
  f.arm(1, { len: 0.52, out: dance ? 0.3 : 0.14, fwd: dance ? 2.55 : 0.12, shX: 0.2, shY: 1.36, rad: 0.052, sleeve: 'garment' });
  f.head(1.4, 'short');
  return f.build();
}

/* ── Invitada de vestido largo (~1.62) · dance = brazo arriba ── */
export function buildGuestFemale(dance = false) {
  const f = new FB();
  // Tacos.
  f.box('detail', 0.09, 0.05, 0.17, -0.09, 0.025, 0.03, 0, SHOE);
  f.box('detail', 0.09, 0.05, 0.17, 0.09, 0.025, 0.03, 0, SHOE);
  // Vestido: falda larga acampanada → cintura entallada → corpiño.
  f.cyl('garment', 0.135, 0.3, 0.88, 9, 0, 0.49, 0);
  f.cyl('garment', 0.125, 0.145, 0.28, 9, 0, 1.05, 0);
  f.cyl('garment', 0.145, 0.125, 0.26, 9, 0, 1.31, 0);
  // Breteles.
  f.box('garment', 0.025, 0.16, 0.025, -0.085, 1.5, 0.02);
  f.box('garment', 0.025, 0.16, 0.025, 0.085, 1.5, 0.02);
  // Brazos al aire. Bailando: uno al cielo; si no, clutch en la mano.
  f.arm(-1, { len: 0.48, out: 0.18, fwd: dance ? 0.35 : 0.1, shX: 0.16, shY: 1.42, rad: 0.04, sleeve: 'skin' });
  f.arm(1, { len: 0.48, out: dance ? 0.28 : 0.2, fwd: dance ? 2.5 : 0.32, shX: 0.16, shY: 1.42, rad: 0.04, sleeve: 'skin' });
  if (!dance) f.box('detail', 0.15, 0.1, 0.04, 0.28, 0.97, 0.2, 0.3, TIE); // clutch
  f.head(1.46, dance ? 'bun' : 'bob');
  return f.build();
}

/* ── Base del operador: cargo + zapatillas + remera con logo ── */
function operatorBase(f) {
  f.box('detail', 0.17, 0.07, 0.3, -0.105, 0.065, 0.05, 0, SHOE);
  f.box('detail', 0.17, 0.07, 0.3, 0.105, 0.065, 0.05, 0, SHOE);
  f.box('detail', 0.18, 0.035, 0.31, -0.105, 0.018, 0.05, 0, SOLE);
  f.box('detail', 0.18, 0.035, 0.31, 0.105, 0.018, 0.05, 0, SOLE);
  f.box('garment', 0.17, 0.74, 0.2, -0.105, 0.47, 0);
  f.box('garment', 0.17, 0.74, 0.2, 0.105, 0.47, 0);
  f.box('garment', 0.06, 0.15, 0.22, -0.155, 0.52, 0.01); // bolsillos cargo
  f.box('garment', 0.06, 0.15, 0.22, 0.155, 0.52, 0.01);
}

/* ── Operador de pie: manos al frente, a la altura del gear ── */
export function buildOperator() {
  const f = new FB();
  operatorBase(f);
  f.box('garment', 0.36, 0.5, 0.22, 0, 1.13, 0); // remera
  f.box('detail', 0.11, 0.045, 0.03, 0, 1.24, 0.115, 0, LOGO);
  f.arm(-1, { len: 0.48, out: 0.12, fwd: 0.8, shX: 0.19, shY: 1.34, rad: 0.048, sleeve: 'skin' });
  f.arm(1, { len: 0.48, out: 0.12, fwd: 0.8, shX: 0.19, shY: 1.34, rad: 0.048, sleeve: 'skin' });
  f.head(1.4, 'short');
  return f.build();
}

/* ── Operador sentado: muslos al frente, manos sobre el escritorio ── */
export function buildOperatorSeated() {
  const f = new FB();
  // Muslos sobre el asiento (cadera a ~0.62) + tibias al piso.
  f.box('garment', 0.17, 0.16, 0.44, -0.105, 0.6, 0.18);
  f.box('garment', 0.17, 0.16, 0.44, 0.105, 0.6, 0.18);
  f.box('garment', 0.15, 0.5, 0.16, -0.105, 0.27, 0.38);
  f.box('garment', 0.15, 0.5, 0.16, 0.105, 0.27, 0.38);
  f.box('detail', 0.17, 0.07, 0.28, -0.105, 0.04, 0.46, 0, SHOE);
  f.box('detail', 0.17, 0.07, 0.28, 0.105, 0.04, 0.46, 0, SHOE);
  // Torso.
  f.box('garment', 0.36, 0.48, 0.22, 0, 0.92, 0);
  f.box('detail', 0.11, 0.045, 0.03, 0, 1.0, 0.115, 0, LOGO);
  // Brazos casi horizontales: las manos llegan al escritorio.
  f.arm(-1, { len: 0.46, out: 0.14, fwd: 1.45, shX: 0.19, shY: 1.12, rad: 0.048, sleeve: 'skin' });
  f.arm(1, { len: 0.46, out: 0.14, fwd: 1.45, shX: 0.19, shY: 1.12, rad: 0.048, sleeve: 'skin' });
  f.head(1.18, 'short');
  return f.build();
}
