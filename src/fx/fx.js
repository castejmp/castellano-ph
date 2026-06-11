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

export const RETRO_VARIANTS = [
  { name: 'PS1 480', width: 480, levels: 31, dither: 0.9, sat: 1.0, crt: 0 },
  { name: 'PS1 320', width: 320, levels: 15, dither: 1.1, sat: 1.0, crt: 0 },
  { name: 'CRT', width: 560, levels: 31, dither: 0.6, sat: 1.05, crt: 1 },
  { name: 'MD 9-BIT', width: 320, levels: 7, dither: 1.1, sat: 1.22, crt: 0 },
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
    let v = 1;
    try { v = parseInt(localStorage.getItem('fxRetroVar') || '1', 10); } catch { /* sin storage */ }
    this.variant = Math.min(RETRO_VARIANTS.length, Math.max(1, v || 1));

    // Teclas 1-4: navegar variantes retro.
    addEventListener('keydown', (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= RETRO_VARIANTS.length) this.setVariant(n);
    });
  }

  setVariant(n) {
    this.variant = n;
    try { localStorage.setItem('fxRetroVar', String(n)); } catch { /* sin storage */ }
    this.apply(this.style);
    this._toast(`RETRO ${n} · ${RETRO_VARIANTS[n - 1].name}`);
  }

  apply(style) {
    this.style = style;
    document.body.dataset.fx = style;

    if (style === 'flat') this._toonify();
    else this._restore();
    for (const h of this._outlines) h.visible = style === 'flat';

    // Resolución interna según la variante retro activa.
    const cfg = RETRO_VARIANTS[this.variant - 1];
    const pr = style === 'retro'
      ? Math.min(0.6, Math.max(0.12, cfg.width / innerWidth))
      : this._basePR;
    this.renderer.setPixelRatio(pr);

    this.post?.setRetroVariant(cfg);
    this.post?.setStyle(style);
    this.post?.setSize(innerWidth, innerHeight);
  }

  /** Re-aplica el estilo (p. ej. cuando los GLB cargan tarde). */
  refresh() {
    this.apply(this.style);
  }

  _toast(text) {
    let t = document.querySelector('.fx-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'fx-toast mono';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
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
