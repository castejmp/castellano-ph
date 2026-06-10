import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * LA FIGURA — morfología tipo muñeco de juguete (~1.5 de alto).
 * Piernas bloque, torso trapezoidal (más ancho abajo), brazos cilíndricos
 * apenas adelantados (manos listas para sostener cosas), cabeza cilíndrica
 * con casquete y pelo.
 *
 * Se parte en 3 geometrías para colorear por instancia sin romper el
 * instancing: body (ropa) · skin (cabeza/cuello/manos) · hair (pelo).
 * Todo el público y los protagonistas comparten esta morfología.
 */
export function buildFigureParts() {
  const body = [];
  const skin = [];
  const hair = [];

  const put = (list, g) => list.push(g.toNonIndexed());

  /* Piernas: dos bloques. */
  for (const side of [-1, 1]) {
    put(body, new THREE.BoxGeometry(0.16, 0.5, 0.2).translate(side * 0.09, 0.25, 0));
  }
  /* Cadera. */
  put(body, new THREE.BoxGeometry(0.37, 0.14, 0.23).translate(0, 0.55, 0));
  /* Torso trapezoidal: más ancho en el ruedo, como el muñeco. */
  put(body, new THREE.CylinderGeometry(0.17, 0.26, 0.52, 8).translate(0, 0.87, 0));

  /* Brazos: cuelgan apenas hacia afuera y adelante. */
  for (const side of [-1, 1]) {
    const a = new THREE.CylinderGeometry(0.05, 0.057, 0.42, 6);
    a.translate(0, -0.21, 0);   // pivote en el hombro
    a.rotateX(-0.3);            // adelante
    a.rotateZ(side * 0.5);      // afuera
    a.translate(side * 0.17, 1.06, 0);
    put(body, a);
    /* Mano al final del brazo. */
    put(skin, new THREE.SphereGeometry(0.06, 6, 5).translate(side * 0.36, 0.71, 0.12));
  }

  /* Cuello + cabeza cilíndrica con casquete. */
  put(skin, new THREE.CylinderGeometry(0.06, 0.065, 0.1, 6).translate(0, 1.16, 0));
  put(skin, new THREE.CylinderGeometry(0.135, 0.135, 0.18, 10).translate(0, 1.3, 0));
  put(skin, new THREE.SphereGeometry(0.135, 10, 6).scale(1, 0.65, 1).translate(0, 1.39, 0));

  /* Pelo: casquete sobre la cabeza. */
  put(hair, new THREE.SphereGeometry(0.143, 9, 6).scale(1, 0.55, 1).translate(0, 1.43, 0));

  const finish = (list) => {
    const g = mergeGeometries(list);
    g.computeVertexNormals();
    return g;
  };

  return { body: finish(body), skin: finish(skin), hair: finish(hair) };
}
