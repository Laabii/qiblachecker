/**
 * Web Audio API Harmonic Synthesizer
 * Plays a clean, soothing harmonic chime when user aligns with Qibla (no external MP3 asset dependency).
 * CheckQibla.com
 */

class AudioFeedbackManager {
  private ctx: AudioContext | null = null;
  private lastPlayTime: number = 0;
  private minIntervalMs: number = 1200; // debounce between chimes

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play a harmonious two-tone serene chime (F5 + C6 harmonics)
   */
  public playQiblaLockedChime(): void {
    const now = Date.now();
    if (now - this.lastPlayTime < this.minIntervalMs) {
      return;
    }
    this.lastPlayTime = now;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, t);
      masterGain.gain.exponentialRampToValueAtTime(0.2, t + 0.04);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      masterGain.connect(ctx.destination);

      // Fundamental Tone (698.46 Hz - F5)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, t);
      osc1.connect(masterGain);

      // Harmonic Over-Tone (1046.50 Hz - C6)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, t + 0.08);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.exponentialRampToValueAtTime(0.15, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.85);

      osc2.start(t + 0.08);
      osc2.stop(t + 0.95);
    } catch {
      // Audio playback failed or blocked by autoplay policy
    }
  }

  /**
   * Trigger device vibration if supported and enabled
   */
  public triggerHaptic(duration: number = 180): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Haptics unavailable
      }
    }
  }
}

export const audioFeedback = new AudioFeedbackManager();
