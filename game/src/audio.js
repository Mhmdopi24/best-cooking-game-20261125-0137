// audio.js — SoundKitchen: every sound in Sizzle & Skillet is synthesized
// with WebAudio at the moment it is needed. No audio files, nothing to load.
// The context is created lazily on the first user gesture, as browsers
// require; until then every method is a quiet no-op.

export class SoundKitchen {
  constructor() {
    this.context = null;
    this.master = null;
  }

  // Call from any pointer or key handler: safe to call again and again.
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    this.context = new AudioCtor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.context.destination);
  }

  tone(freqFrom, freqTo, seconds, type = 'sine', volume = 1, delay = 0) {
    if (!this.context) return;
    const t0 = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noise(seconds, volume = 0.5, delay = 0, lowpass = 6000) {
    if (!this.context) return;
    const t0 = this.context.currentTime + delay;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t0);
  }

  // An ingredient lands on the plate or in a bin: a soft wooden pop.
  pop() {
    this.tone(320, 140, 0.09, 'triangle', 0.9);
  }

  // A raw ingredient hits the hot grill: a short burst of sizzle.
  sizzle() {
    this.noise(0.35, 0.7, 0, 7500);
    this.tone(180, 90, 0.08, 'square', 0.15);
  }

  // A grill slot enters its golden window: one clear ding.
  ding() {
    this.tone(1318, 1318, 0.35, 'sine', 0.8);
    this.tone(1975, 1975, 0.3, 'sine', 0.35, 0.02);
  }

  // A dish is served: the till's little arpeggio.
  serve() {
    this.tone(784, 784, 0.1, 'triangle', 0.8);
    this.tone(988, 988, 0.1, 'triangle', 0.8, 0.07);
    this.tone(1318, 1318, 0.22, 'triangle', 0.9, 0.14);
    this.noise(0.12, 0.25, 0.14, 9000);
  }

  // A mistake: wrong serve, burnt food, a customer walking out.
  buzz() {
    this.tone(160, 110, 0.22, 'sawtooth', 0.55);
  }

  // Food hits the trash: a dull thud.
  thud() {
    this.noise(0.14, 0.8, 0, 900);
    this.tone(120, 60, 0.14, 'sine', 0.8);
  }

  // A new ticket pins to the board: a paper flick and a pin click.
  ticket() {
    this.noise(0.06, 0.4, 0, 5000);
    this.tone(900, 500, 0.05, 'square', 0.25, 0.03);
  }
}
