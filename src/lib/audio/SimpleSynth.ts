export class SimpleSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy init via user interaction usually required, but we'll try to init
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Default volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTone(frequency: number, durationSec: number = 0.5, type: OscillatorType = "sine") {
    this.init();
    if (!this.ctx || !this.masterGain) {
      console.error("SimpleSynth: AudioContext not initialized");
      return;
    }

    // console.log(`SimpleSynth: Playing tone ${frequency}Hz for ${durationSec}s`);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    // Envelope to avoid clicking
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(1, this.ctx.currentTime + durationSec - 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + durationSec);
  }

  beep() {
    this.playTone(880, 0.2, "square"); // A5
  }
}

export const synth = new SimpleSynth();
