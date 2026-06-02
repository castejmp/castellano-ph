/**
 * Motor de audio del "Modo Vivo".
 *
 * Analiza el audio en vivo (micrófono) o, si el usuario no da permiso,
 * sintetiza un track de demo con la Web Audio API — así el efecto funciona
 * siempre, sin depender de ningún archivo externo.
 *
 * Expone tres bandas normalizadas (0..1): bass, mid, treble — más un nivel
 * general. El campo de partículas las lee en cada frame.
 */

export interface AudioBands {
  bass: number;
  mid: number;
  treble: number;
  level: number;
}

export type AudioSourceKind = 'mic' | 'demo' | null;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private micStream: MediaStream | null = null;
  private demoNodes: AudioNode[] = [];
  private rafId = 0;

  /** Bandas suavizadas que leen las partículas (objeto mutable estable). */
  readonly bands: AudioBands = { bass: 0, mid: 0, treble: 0, level: 0 };
  source: AudioSourceKind = null;

  /** Arranca el análisis. Intenta micrófono; si falla, usa demo sintético. */
  async start(): Promise<AudioSourceKind> {
    this.ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.8;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
      });
      const src = this.ctx.createMediaStreamSource(this.micStream);
      src.connect(this.analyser);
      this.source = 'mic';
    } catch {
      // Permiso denegado o sin micrófono → demo sintético embebido.
      this.buildDemoTrack();
      this.source = 'demo';
    }

    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.loop();
    return this.source;
  }

  /**
   * Construye un loop musical simple con osciladores: un bajo pulsante,
   * un pad medio y destellos agudos. No suena fuerte; es una demo del efecto.
   */
  private buildDemoTrack() {
    if (!this.ctx || !this.analyser) return;
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(this.analyser);
    // Un toque audible muy suave para que se sienta el "vivo".
    const out = ctx.createGain();
    out.gain.value = 0.05;
    master.connect(out);
    out.connect(ctx.destination);

    // Bajo pulsante (kick estilizado vía LFO sobre la ganancia).
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 56;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.0;
    const kickLfo = ctx.createOscillator();
    kickLfo.type = 'square';
    kickLfo.frequency.value = 2; // ~120 BPM
    const kickDepth = ctx.createGain();
    kickDepth.gain.value = 0.9;
    kickLfo.connect(kickDepth).connect(bassGain.gain);
    bass.connect(bassGain).connect(master);

    // Pad medio.
    const pad = ctx.createOscillator();
    pad.type = 'sawtooth';
    pad.frequency.value = 220;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 800;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.35;
    pad.connect(padFilter).connect(padGain).connect(master);

    // Agudos / destellos.
    const hi = ctx.createOscillator();
    hi.type = 'triangle';
    hi.frequency.value = 1760;
    const hiGain = ctx.createGain();
    hiGain.gain.value = 0.0;
    const hiLfo = ctx.createOscillator();
    hiLfo.type = 'sine';
    hiLfo.frequency.value = 6;
    const hiDepth = ctx.createGain();
    hiDepth.gain.value = 0.12;
    hiLfo.connect(hiDepth).connect(hiGain.gain);
    hi.connect(hiGain).connect(master);

    [bass, kickLfo, pad, hi, hiLfo].forEach((o) => o.start());
    this.demoNodes = [bass, kickLfo, kickDepth, pad, padFilter, padGain, hi, hiGain, hiLfo, hiDepth, master, out];
  }

  private loop = () => {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(this.freqData);
    const n = this.freqData.length;

    // Repartimos el espectro en tres tercios.
    const third = Math.floor(n / 3);
    let bass = 0;
    let mid = 0;
    let treble = 0;
    for (let i = 0; i < n; i++) {
      const v = this.freqData[i] / 255;
      if (i < third) bass += v;
      else if (i < third * 2) mid += v;
      else treble += v;
    }
    bass /= third;
    mid /= third;
    treble /= n - third * 2;

    // Suavizado exponencial para evitar saltos bruscos.
    const k = 0.18;
    this.bands.bass += (bass - this.bands.bass) * k;
    this.bands.mid += (mid - this.bands.mid) * k;
    this.bands.treble += (treble - this.bands.treble) * k;
    this.bands.level = (this.bands.bass + this.bands.mid + this.bands.treble) / 3;

    this.rafId = requestAnimationFrame(this.loop);
  };

  stop() {
    cancelAnimationFrame(this.rafId);
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
    this.demoNodes.forEach((node) => {
      try {
        (node as OscillatorNode).stop?.();
      } catch {
        /* nodos sin stop */
      }
      node.disconnect();
    });
    this.demoNodes = [];
    this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.bands.bass = this.bands.mid = this.bands.treble = this.bands.level = 0;
  }
}
