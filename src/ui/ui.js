import { CONFIG } from '../config.js';
import { wordmarkCanvas } from '../scene/brand.js';

/**
 * EL OVERLAY — todo el HTML vive acá, fuera del canvas.
 * Gate de entrada, nav con reloj + ciclador de modo + HUD de shot,
 * dots laterales, una card por estación, flash y footer fijo.
 */
export class UI {
  constructor({ onModeChosen, onModeCycle, onDot, onToggleMute }) {
    const root = document.getElementById('ui');
    const S = CONFIG.stations;

    /* Brand bar — intocable. */
    const bb = el('div', 'brandbar');
    for (const c of CONFIG.brandBar) {
      const s = document.createElement('span');
      s.style.background = c;
      bb.appendChild(s);
    }

    /* Nav */
    const nav = el('nav', 'nav');
    nav.innerHTML = `
      <span class="wordmark"><img alt="${CONFIG.studio}" /></span>
      <div class="right mono">
        <span class="hud" data-hud>SHOT 01/09 · ${S[0].name}</span>
        <span class="clock" data-clock></span>
        <button class="mute-btn" data-mute-btn type="button" aria-label="Silenciar" aria-pressed="false">
          <span data-mute-icon>♪</span>
        </button>
        <button class="mode-btn" data-mode-btn type="button">MODO</button>
      </div>`;
    // El logo calcado también en la nav (mismo dibujo que el piso).
    nav.querySelector('.wordmark img').src = wordmarkCanvas().toDataURL();
    this.hud = nav.querySelector('[data-hud]');
    this.clockEl = nav.querySelector('[data-clock]');
    this.modeBtn = nav.querySelector('[data-mode-btn]');
    this.modeBtn.addEventListener('click', onModeCycle);
    this.muteBtn = nav.querySelector('[data-mute-btn]');
    this.muteIcon = nav.querySelector('[data-mute-icon]');
    this.muteBtn.addEventListener('click', () => {
      const muted = onToggleMute();
      this.muteBtn.setAttribute('aria-pressed', String(muted));
      this.muteBtn.classList.toggle('muted', muted);
      this.muteIcon.textContent = muted ? '✕' : '♪';
      this.muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
    });

    /* Dots laterales */
    const dots = el('div', 'dots');
    this.dotEls = S.map((st, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', st.name);
      b.innerHTML = `<span class="tip mono">${st.name}</span>`;
      b.addEventListener('click', () => onDot(i));
      dots.appendChild(b);
      return b;
    });

    /* Título de la estación 0 */
    const hero = el('div', 'hero-title');
    hero.innerHTML = `
      <div>
        <h1><span class="pre">BIENVENIDO A</span>TU EVENTO</h1>
        <div class="hint mono">NAVEGÁ PARA DESCUBRIR QUÉ HACEMOS</div>
      </div>`;
    this.hero = hero;

    /* Cards por estación */
    this.cards = S.map((st, i) => {
      const c = el('article', `card${i % 2 ? ' right' : ''}`);
      c.innerHTML = `
        <div class="kicker mono">${st.kicker}</div>
        <h2>${st.name}</h2>
        <p>${st.body}</p>
        ${st.items.length ? `<ul>${st.items.map((it) => `<li>${it}</li>`).join('')}</ul>` : ''}
        ${st.cta ? `
          <a class="cta" href="${CONFIG.whatsapp}" target="_blank" rel="noopener">${st.cta} →</a>
          <a class="cta-ig mono" href="${CONFIG.instagram}" target="_blank" rel="noopener">${CONFIG.instagramLabel}</a>
        ` : ''}`;
      return c;
    });
    // La estación 0 usa el hero y la 8 la placa final: sin card.
    this.cards[0].style.display = 'none';
    this.cards[8].style.display = 'none';

    /* Placa final centrada (espejo de la bienvenida) */
    const F = CONFIG.finale;
    const finale = el('div', 'finale');
    finale.innerHTML = `
      <div>
        <div class="kicker mono">${F.kicker}</div>
        <h2><span class="pre">${F.pre}</span>${F.title}</h2>
        <div class="ctas">
          <a class="cta" href="${CONFIG.whatsapp}" target="_blank" rel="noopener">HABLEMOS</a>
          <a class="ghost" href="${CONFIG.instagram}" target="_blank" rel="noopener">${CONFIG.instagramLabel}</a>
          <button class="ghost" type="button" data-ver>${F.verMas}</button>
        </div>
      </div>`;
    finale.querySelector('[data-ver]').addEventListener('click', () => onDot(0));
    this.finale = finale;

    /* Flash de fotografía */
    this.flashEl = el('div', 'flash');

    /* HUD de cámara para el estilo VHS (visible vía body[data-fx]). */
    const rec = el('div', 'rec-hud mono');
    rec.innerHTML = `<span class="dot"></span>REC`;

    /* Footer fijo */
    const footer = el('footer', 'footer mono');
    footer.innerHTML = `
      <a href="${CONFIG.whatsapp}" target="_blank" rel="noopener">${CONFIG.whatsappLabel}</a>
      <span class="loc">${CONFIG.location}</span>`;

    /* Gate */
    const gate = el('div', 'gate');
    gate.innerHTML = `
      <div class="inner">
        <div class="word mono">${CONFIG.studio}</div>
        <div class="bar"><i data-bar></i></div>
        <h2 class="q">¿Qué celebramos?</h2>
        <div class="choices">
          ${CONFIG.modeOrder.map((m) => `
            <button type="button" data-choice="${m}" style="--c:${CONFIG.modes[m].accent}">
              ${CONFIG.modes[m].label}
            </button>`).join('')}
        </div>
        <div class="sound">LA EXPERIENCIA SUENA · SUBÍ EL VOLUMEN</div>
      </div>`;
    this.gate = gate;
    this.gateBar = gate.querySelector('[data-bar]');
    gate.querySelectorAll('[data-choice]').forEach((b) => {
      b.addEventListener('click', () => {
        gate.classList.add('leaving');
        setTimeout(() => gate.remove(), 850);
        onModeChosen(b.dataset.choice);
      });
    });

    root.append(bb, hero, ...this.cards, finale, dots, nav, this.flashEl, rec, footer, gate);

    /* Reloj */
    const tick = () => {
      this.clockEl.textContent = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit',
      });
    };
    tick();
    setInterval(tick, 10_000);

    this._shot = -1;
  }

  /** Preloader del gate: 0..1, después habilita la pregunta. */
  gateProgress(p) {
    this.gateBar.style.width = `${Math.round(p * 100)}%`;
    if (p >= 1) this.gate.classList.add('ready');
  }

  setModeLabel(name) {
    this.modeBtn.textContent = CONFIG.modes[name].label;
  }

  /** f: estación flotante 0..8 — maneja cards, dots, HUD, hero y final. */
  setStation(f) {
    const r = Math.round(f);
    this.cards.forEach((c, i) => {
      c.classList.toggle('show', i > 0 && i < 8 && Math.abs(f - i) < 0.38);
    });
    this.dotEls.forEach((d, i) => d.classList.toggle('active', i === r));
    this.hero.style.opacity = Math.max(0, 1 - f * 1.7);
    const fw = Math.min(1, Math.max(0, (f - 7.45) / 0.45));
    this.finale.style.opacity = fw;
    this.finale.style.pointerEvents = fw > 0.6 ? 'auto' : 'none';

    if (r !== this._shot) {
      this._shot = r;
      const st = CONFIG.stations[r];
      this.hud.textContent = `SHOT 0${r + 1}/09 · ${st.name}`;
    }
  }

  flash() {
    this.flashEl.classList.remove('fire');
    // Reflow para reiniciar la animación CSS.
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('fire');
  }
}

function el(tag, cls) {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}
