import { CONFIG } from '../config.js';

/**
 * EL AUDIO — audio-reactivo de verdad.
 * Cadena: synth/stream → master → compresor → AnalyserNode → salida.
 * Las bandas bass/mid/treb salen del analyser y manejan la LED, los
 * spots, el crowd y las partículas.
 *
 * Cada modo intenta su trackUrl por streaming; si falla o no hay,
 * suena el synth procedural del modo. La experiencia nunca queda muda.
 */

const n2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor() {
    this.bands = { bass: 0, mid: 0, treb: 0, level: 0 };
    this.ready = false;
  }

  /** Llamar desde un gesto del usuario (el gate). */
  init() {
    if (this.ready) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.5;
    this.master.connect(comp);
    comp.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.fft = new Uint8Array(this.analyser.frequencyBinCount);

    this.synth = new StepSynth(ctx, this.master);
    this.trackGain = ctx.createGain();
    this.trackGain.gain.value = 0;
    this.trackGain.connect(this.master);
    this.ready = true;
  }

  /** Silencia/activa el master con una rampa corta (sin clicks). */
  setMuted(muted) {
    this.muted = muted;
    if (!this.ready) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  setMode(name) {
    if (!this.ready) return;
    this.ctx.resume();
    const mode = CONFIG.modes[name];
    this._stopStream();

    if (mode.trackUrl) {
      this._tryStream(mode);
    } else {
      this.synth.play(mode.music);
    }
  }

  _tryStream(mode) {
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.loop = true;
    el.src = mode.trackUrl;
    this._streamEl = el;

    const fallback = () => {
      if (this._streamEl !== el) return;
      this._stopStream();
      this.synth.play(mode.music);
    };
    el.addEventListener('error', fallback);
    el.addEventListener('stalled', fallback);

    el.addEventListener('canplay', () => {
      if (this._streamEl !== el) return;
      try {
        this._streamSrc = this.ctx.createMediaElementSource(el);
        this._streamSrc.connect(this.trackGain);
        el.play();
        this.synth.stop();
        this.trackGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2);
      } catch {
        fallback();
      }
    }, { once: true });

    el.load();
    // Si en 4 s no arrancó, entra el synth.
    setTimeout(() => { if (el.paused) fallback(); }, 4000);
  }

  _stopStream() {
    if (this._streamEl) {
      this._streamEl.pause();
      this._streamEl.src = '';
      this._streamEl = null;
    }
    if (this._streamSrc) {
      try { this._streamSrc.disconnect(); } catch { /* ya desconectado */ }
      this._streamSrc = null;
    }
    if (this.trackGain) this.trackGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  /** Lee el analyser y suaviza. Devuelve bands. */
  update() {
    if (!this.ready) return this.bands;
    this.analyser.getByteFrequencyData(this.fft);
    const avg = (a, b) => {
      let s = 0;
      for (let i = a; i < b; i++) s += this.fft[i];
      return s / ((b - a) * 255);
    };
    const t = {
      bass: Math.min(1, avg(1, 7) * 1.5),
      mid: Math.min(1, avg(8, 42) * 1.9),
      treb: Math.min(1, avg(46, 120) * 2.6),
    };
    for (const k of ['bass', 'mid', 'treb']) {
      const cur = this.bands[k];
      // Ataque rápido, caída lenta: se siente el golpe.
      this.bands[k] = cur + (t[k] - cur) * (t[k] > cur ? 0.55 : 0.13);
    }
    this.bands.level = (this.bands.bass + this.bands.mid + this.bands.treb) / 3;
    return this.bands;
  }
}

/* ──────────────────────────────────────────────────
 * StepSynth — secuenciador de 16 pasos con lookahead.
 * Voces: kick, hat, rim, bajo y stab de acorde con send a delay.
 * Los patterns viven en config.js (music de cada modo).
 * ────────────────────────────────────────────────── */
class StepSynth {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(out);

    // Delay para el skank dub / aire de los stabs.
    this.delay = ctx.createDelay(1.2);
    this.fb = ctx.createGain();
    this.fb.gain.value = 0.42;
    this.delay.connect(this.fb);
    this.fb.connect(this.delay);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.5;
    this.delay.connect(this.wet);
    this.wet.connect(this.out);

    // Buffer de ruido compartido (hats, rim).
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.timer = null;
    this.cfg = null;
  }

  play(music) {
    const t = this.ctx.currentTime;
    if (this.cfg) {
      // Cambio de modo: fade out corto, swap, fade in. Total < 1 s.
      this.out.gain.cancelScheduledValues(t);
      this.out.gain.setTargetAtTime(0, t, 0.09);
      clearInterval(this.timer);
      setTimeout(() => this._start(music), 330);
    } else {
      this._start(music);
    }
  }

  _start(music) {
    this.cfg = music;
    this.delay.delayTime.value = (60 / music.bpm) * 0.75;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.06;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0.9, t, 0.18);
    clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), 25);
  }

  stop() {
    const t = this.ctx.currentTime;
    this.out.gain.setTargetAtTime(0, t, 0.12);
    clearInterval(this.timer);
    this.timer = null;
    this.cfg = null;
  }

  _tick() {
    const c = this.cfg;
    if (!c) return;
    const spb = 60 / c.bpm / 4; // dieciseisava
    while (this.nextT < this.ctx.currentTime + 0.12) {
      const s = this.step % 16;
      const swing = s % 2 === 1 ? c.swing * spb : 0;
      this._schedule(s, this.step, this.nextT + swing);
      this.nextT += spb;
      this.step++;
    }
  }

  _schedule(s, abs, t) {
    const c = this.cfg;
    if (c.kick[s]) this._kick(t, c.kickTone);
    if (c.hat[s]) this._hat(t, c.hat[s] === 2);
    if (c.rim[s]) this._rim(t);
    const b = c.bass[s];
    if (b !== null && b !== undefined) {
      this._bass(t, n2f(c.root + b), 60 / c.bpm / 4 * 1.7, c.bassType, c.bassCut, c.bassGain);
    }
    if (c.chord[s] && Math.floor(abs / 16) % c.chordEvery === 0) {
      this._chord(t, c.chordNotes.map((x) => n2f(c.root + x)), c.chordLen, c.chordSend, c.chordType, c.chordCut);
    }
  }

  _env(t, peak, dur) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    return g;
  }

  _kick(t, tone = 140) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(tone, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.11);
    const g = this._env(t, 1.0, 0.3);
    o.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + 0.32);
  }

  _hat(t, open) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7400;
    const g = this._env(t, open ? 0.22 : 0.14, open ? 0.3 : 0.06);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.out);
    src.start(t);
    src.stop(t + (open ? 0.32 : 0.08));
  }

  _rim(t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 7;
    const g = this._env(t, 0.5, 0.07);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.out);
    src.start(t);
    src.stop(t + 0.09);
  }

  _bass(t, freq, dur, type, cut, gain) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cut;
    const g = this._env(t, gain, dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _chord(t, freqs, len, send, type, cut) {
    for (const f of freqs) {
      for (const det of [-6, 6]) {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.detune.value = det;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = cut;
        const g = this._env(t, 0.09, len);
        o.connect(lp);
        lp.connect(g);
        g.connect(this.out);
        if (send > 0) {
          const sg = this.ctx.createGain();
          sg.gain.value = send;
          g.connect(sg);
          sg.connect(this.delay);
        }
        o.start(t);
        o.stop(t + len + 0.05);
      }
    }
  }
}
