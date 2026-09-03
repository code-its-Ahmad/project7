class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('portfolio_sound_muted') === 'true';
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('portfolio_sound_muted', muted ? 'true' : 'false');
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft subtle hover pop
  public playHover() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Crisp click sound
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
  }

  // Pleasant success chime
  public playSuccess() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.04, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.25);
      });
    } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
  }

  // Swoosh on tab/filter change
  public playWhoosh() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
  }

  // Futuristic cyber system boot tone
  public playBoot() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const chords = [220, 440, 659.25, 880, 1318.5]; // A3, A4, E5, A5, E6
      chords.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.5, now + idx * 0.09);
        osc.frequency.exponentialRampToValueAtTime(freq, now + idx * 0.09 + 0.3);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.09 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.65);
      });
    } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
  }

  // Terminal mechanical keypress click
  public playKeypress() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const randomPitch = 1200 + Math.random() * 600;
      osc.frequency.setValueAtTime(randomPitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
  }

  // Sci-fi high-tech beep
  public playBeep(pitch: number = 880) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
  }

  // Mobile haptic vibration helper (safe for Infinix Hot 10 & all mobile phones)
  public vibrate(pattern: number | number[] = 12) {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
      // Deliberate no-op: WebAudio is a cosmetic enhancement. Autoplay policy,
      // a suspended AudioContext or an unsupported browser must never surface
      // an error to the user or interrupt the interaction that triggered it.
    }
    }
  }
}

export const soundManager = new SoundManager();
