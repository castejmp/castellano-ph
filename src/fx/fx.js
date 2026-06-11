import * as THREE from 'three';

/**
 * FX MANAGER — estética RETRO por defecto, con 4 VARIANTES navegables
 * por teclado (1-4) para elegir pixelaje y técnica:
 *   1 · PS1 480   → 480 px, 5 bits/canal, Bayer medio (la original)
 *   2 · PS1 320   → 320 px, 4 bits/canal, dither fuerte (más cruda)
 *   3 · CRT       → 560 px, máscara de fósforos RGB + scanlines de tubo
 *   4 · MD 9-BIT  → 320 px, 3 bits/canal estilo Mega Drive, saturado
 *
 * Los otros estilos (cine/flat/vhs) siguen implementados por si se
 * retoman, pero no hay botón: el estilo es retro fijo.
 */

// ELEGIDA: la PS1 480 original. Las otras variantes quedan apuntadas
// por si se retoman, pero el switcheo está desactivado.
export const RETRO_VARIANTS = [
  { name: 'PS1 480', width: 480, levels: 31, dither: 0.9, sat: 1.0, crt: 0 },
];

export class FXManager {
  constructor({ renderer, scene, isMobile }) {
    this.renderer = renderer;
    this.scene = scene;
    this.isMobile = isMobile;
    this.post = null; // se conecta cuando carga (desktop)
    this._orig = new Map();
    this._toon = new Map();
    this._outlines = [];
    this._outlined = new Set();
    this._basePR = Math.min(devicePixelRatio, isMobile ? 1.5 : 2);

    // Gradiente de 3 bandas para el toon (estilo flat, sin botón).
    const grad = new Uint8Array([70, 160, 255]);
    this._gradient = new THREE.DataTexture(grad, 3, 1, THREE.RedFormat);
    this._gradient.minFilter = THREE.NearestFilter;
    this._gradient.magFilter = THREE.NearestFilter;
    this._gradient.needsUpdate = true;

    this.style = 'retro';
    this.variant = 1; // PS1 480, fija
  }

  apply(style) {
    this.style = style;
    document.body.dataset.fx = style;

    if (style === 'flat') this._toonify();
    else this._restore();
    for (const h of this._outlines) h.visible = style === 'flat';

    // Resolución interna según la variante retro activa. En desktop el
    // ancho objetivo sube ~55%: con 480 fijos el píxel quedaba gigante
    // en monitores grandes (en el celu 480 ya es casi nativo).
    const cfg = RETRO_VARIANTS[this.variant - 1];
    const targetW = this.isMobile ? cfg.width : Math.round(cfg.width * 1.55);
    const pr = style === 'retro'
      ? Math.min(0.6, Math.max(0.12, targetW / innerWidth))
      : this._basePR;
    this.renderer.setPixelRatio(pr); // camino sin composer (móvil)
    this.post?.setPixelRatio(pr);    // el composer captura el suyo propio

    // Las pantallas LED apagan su grilla de píxeles en retro: la doble
    // pixelación (lamparitas × render lowres) hacía moiré feo.
    if (this.led) {
      this.led.uniforms.uMask.value = style === 'retro' ? 0 : 1;
      this.led.uniforms.uGrid.value.set(
        style === 'retro' ? 44 : 110,
        style === 'retro' ? 18 : 44
      );
    }

    this.post?.setRetroVariant(cfg);
    this.post?.setStyle(style);
  }

  /** Re-aplica el estilo (p. ej. cuando los GLB cargan tarde). */
  refresh() {
    this.apply(this.style);
  }

  _toonify() {
    this.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      if (o.userData.isOutline) return;
      const m = o.material;
      if (this._orig.has(o)) { o.material = this._toon.get(o); return; }
      if (!m || !(m.isMeshLambertMaterial || m.isMeshStandardMaterial)) return;
      const t = new THREE.MeshToonMaterial({
        color: m.color ? m.color.clone() : new THREE.Color('#ffffff'),
        map: m.map ?? null,
        vertexColors: m.vertexColors ?? false,
        gradientMap: this._gradient,
        transparent: m.transparent,
        opacity: m.opacity,
      });
      this._orig.set(o, m);
      this._toon.set(o, t);
      o.material = t;

      if (o.isInstancedMesh && !this._outlined.has(o)) {
        this._outlined.add(o);
        const om = new THREE.MeshBasicMaterial({ color: '#050508', side: THREE.BackSide });
        om.onBeforeCompile = (sh) => {
          sh.vertexShader = sh.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\n transformed += objectNormal * 0.016;'
          );
        };
        const hull = new THREE.InstancedMesh(o.geometry, om, o.count);
        hull.instanceMatrix = o.instanceMatrix; // comparte matrices
        hull.userData.isOutline = true;
        this._outlines.push(hull);
        this.scene.add(hull);
      }
    });
  }

  _restore() {
    for (const [o, m] of this._orig) o.material = m;
  }
}
