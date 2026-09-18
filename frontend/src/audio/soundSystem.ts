/**
 * Web Audio API procedural synthesizer for the cybernetic Virtual Classroom.
 * Generates subtle ambient drone hum (55Hz + 110Hz sine oscillators + lowpass filter)
 * and interactive audio cues with instant mute control.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public init(): void {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Lowpass filter for deep sci-fi warmth
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      // Drone gain
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.droneGain.connect(this.filter);
      this.filter.connect(this.masterGain);

      // Sub-bass oscillator (55Hz - A1 fundamental)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.osc1.connect(this.droneGain);

      // Harmonic warmth oscillator (110Hz - A2 octave harmonic)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);
      this.osc2.connect(this.droneGain);

      this.osc1.start();
      this.osc2.start();
      this.isRunning = true;
    } catch {
      // Audio context might be restricted or unsupported in non-browser envs
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.ctx) {
      this.init();
    } else {
      this.resumeContext();
    }

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.6;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playChirp(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const chirpOsc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();

      chirpOsc.type = 'sine';
      chirpOsc.frequency.setValueAtTime(880, this.ctx.currentTime);
      chirpOsc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.08);

      chirpGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(this.masterGain);

      chirpOsc.start();
      chirpOsc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  public playChime(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const chimeOsc1 = this.ctx.createOscillator();
      const chimeOsc2 = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc1.type = 'sine';
      chimeOsc1.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      chimeOsc1.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.25); // C6

      chimeOsc2.type = 'sine';
      chimeOsc2.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
      chimeOsc2.frequency.exponentialRampToValueAtTime(1318.5, this.ctx.currentTime + 0.25); // E6

      chimeGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      chimeOsc1.connect(chimeGain);
      chimeOsc2.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc1.start();
      chimeOsc2.start();
      chimeOsc1.stop(this.ctx.currentTime + 0.3);
      chimeOsc2.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  public playMagneticThud(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  public playPop(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  public playSuccess(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      // Ascending major chord fanfare
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.08;
        const duration = 0.22;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch {
      // Ignore
    }
  }

  public playAlert(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }
}

export const soundSystem = new SoundSystem();
