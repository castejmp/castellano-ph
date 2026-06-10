/**
 * EL IMÁN DE SCROLL — scroll nativo + snap direccional.
 *
 * Reglas (firma de la experiencia):
 *  · La estación asentada se recuerda como "casa".
 *  · Un flick corto avanza hacia donde apuntó el gesto. Nunca rebota.
 *  · El snap es cancelable por CUALQUIER input del usuario.
 *  · prefers-reduced-motion → saltos instantáneos, sin animación.
 */
export class ScrollEngine {
  constructor(stations, reduced) {
    this.max = stations - 1;
    this.reduced = reduced;
    this.home = 0;
    this.gestureDir = 0;
    this.lastInput = 0;
    this.anim = null;

    const userInput = (dir) => {
      this.lastInput = performance.now();
      if (dir) this.gestureDir = dir;
      this.cancelAnim();
    };

    addEventListener('wheel', (e) => userInput(Math.sign(e.deltaY)), { passive: true });
    addEventListener('keydown', () => userInput(0));
    addEventListener('mousedown', () => userInput(0));

    // El momentum de mobile sigue scrolleando después del touchend:
    // cualquier scroll que NO sea nuestro cuenta como input y posterga el snap.
    this._self = false;
    addEventListener('scroll', () => {
      if (this._self) { this._self = false; return; }
      this.lastInput = performance.now();
    }, { passive: true });

    let touchY = 0;
    addEventListener('touchstart', (e) => {
      touchY = e.touches[0].clientY;
      userInput(0);
    }, { passive: true });
    addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      userInput(Math.sign(touchY - y)); // dedo sube = scroll baja = avanza
      touchY = y;
    }, { passive: true });
  }

  get maxScroll() {
    return document.documentElement.scrollHeight - innerHeight;
  }

  get progress() {
    const m = this.maxScroll;
    return m > 0 ? Math.min(1, Math.max(0, scrollY / m)) : 0;
  }

  get stationFloat() {
    return this.progress * this.max;
  }

  cancelAnim() {
    if (this.anim) {
      cancelAnimationFrame(this.anim);
      this.anim = null;
    }
  }

  /** Llamar cada frame: decide si toca asentar. */
  update() {
    const now = performance.now();
    if (this.anim || now - this.lastInput < 160) return;

    const f = this.stationFloat;
    const nearest = Math.round(f);

    // Ya asentado: actualizar casa y limpiar gesto.
    if (Math.abs(f - nearest) < 0.012) {
      this.home = nearest;
      this.gestureDir = 0;
      return;
    }

    // Imán direccional: el gesto manda. Nunca rebota contra la dirección.
    let target;
    if (this.gestureDir > 0) target = Math.ceil(f - 0.04);
    else if (this.gestureDir < 0) target = Math.floor(f + 0.04);
    else target = nearest;
    target = Math.min(this.max, Math.max(0, target));

    this.goTo(target);
  }

  goTo(station) {
    const targetY = (station / this.max) * this.maxScroll;
    this.cancelAnim();
    this.gestureDir = 0;

    if (this.reduced) {
      this._self = true;
      scrollTo(0, targetY);
      this.home = station;
      return;
    }

    const fromY = scrollY;
    const dist = targetY - fromY;
    if (Math.abs(dist) < 2) { this.home = station; return; }
    const dur = Math.min(900, 380 + Math.abs(dist) * 0.12);
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      this._self = true;
      scrollTo(0, fromY + dist * ease(t));
      if (t < 1) {
        this.anim = requestAnimationFrame(step);
      } else {
        this.anim = null;
        this.home = station;
      }
    };
    this.anim = requestAnimationFrame(step);
  }
}
