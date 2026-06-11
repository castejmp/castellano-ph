import * as THREE from 'three';

/**
 * FX MANAGER — los 4 conceptos de estética, conmutables en vivo:
 *   cine  → la curada: bloom + DoF + viñeta (post.js)
 *   flat  → cel shading: materiales toon (3 bandas) + contorno negro
 *           por casco invertido en figuras y mobiliario instanciado
 *   retro → 32 bits: render interno ~480px reescalado nearest +
 *           cuantización con dithering (post.js)
 *   vhs   → la cámara del estudio: scanlines + chroma + ruido + ● REC
 *
 * El estilo persiste en localStorage. El swap de materiales es
 * reversible (se guardan los originales) y re-aplicable cuando los
 * GLB terminan de cargar (refresh()).
 */

export const FX_STYLES = ['cine', 'flat', 'retro', 'vhs'];

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

    // Gradiente de 3 bandas para el toon.
    const grad = new Uint8Array([70, 160, 255]);
    this._gradient = new THREE.DataTexture(grad, 3, 1, THREE.RedFormat);
    this._gradient.minFilter = THREE.NearestFilter;
    this._gradient.magFilter = THREE.NearestFilter;
    this._gradient.needsUpdate = true;

    let saved = 'cine';
    try { saved = localStorage.getItem('fxStyle') || 'cine'; } catch { /* sin storage */ }
    this.style = FX_STYLES.includes(saved) ? saved : 'cine';
  }

  cycle() {
    const next = FX_STYLES[(FX_STYLES.indexOf(this.style) + 1) % FX_STYLES.length];
    this.apply(next);
    return next;
  }

  apply(style) {
    this.style = style;
    try { localStorage.setItem('fxStyle', style); } catch { /* sin storage */ }
    document.body.dataset.fx = style;

    // Materiales y contornos.
    if (style === 'flat') this._toonify();
    else this._restore();
    for (const h of this._outlines) h.visible = style === 'flat';

    // Resolución interna: retro renderiza a ~480 px de ancho.
    const pr = style === 'retro'
      ? Math.min(0.5, Math.max(0.18, 480 / innerWidth))
      : this._basePR;
    this.renderer.setPixelRatio(pr);

    this.post?.setStyle(style);
    this.post?.setSize(innerWidth, innerHeight);
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

      // Contorno por casco invertido: solo instanciados (figuras,
      // mesas, livings, DJ) — el salón estático no lo necesita.
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
