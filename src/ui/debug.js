/**
 * HUD DE DEBUG — visible con ?fps en la URL.
 * Muestra fps, draw calls, triángulos, tier de calidad y pixelRatio.
 */
export class DebugHud {
  constructor() {
    this.enabled = new URLSearchParams(location.search).has('fps');
    if (!this.enabled) return;
    this.el = document.createElement('div');
    this.el.className = 'debug mono';
    document.body.appendChild(this.el);
  }

  update({ fps, calls, tris, tier, dpr }) {
    if (!this.enabled) return;
    this.el.textContent =
      `FPS    ${fps}\n` +
      `CALLS  ${calls}\n` +
      `TRIS   ${(tris / 1000).toFixed(1)}k\n` +
      `TIER   ${tier}\n` +
      `DPR    ${dpr.toFixed(2)}`;
  }
}
