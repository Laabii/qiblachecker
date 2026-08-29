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
   * Trigger device vibration & tactile haptics across Android & iOS
   */
  public triggerHaptic(duration: number = 180): void {
    // 1. Standard W3C Vibration API (Android / Chrome)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        // Crisp double-pulse haptic pattern (tap-tap)
        navigator.vibrate([60, 40, 80]);
      } catch {
        // Ignore
      }
    }

    // 2. iOS Taptic Acoustic Transducer Pulse (iOS Safari fallback)
    // Safari iOS blocks navigator.vibrate, but a steep sub-bass impulse (55Hz-65Hz)
    // drives the iPhone acoustic chamber to create physical tactile vibration in the hand.
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const hapticOsc = ctx.createOscillator();
      const hapticGain = ctx.createGain();

      hapticOsc.type = 'triangle';
      hapticOsc.frequency.setValueAtTime(58, t); // 58 Hz sub-bass sweet spot for iPhone chassis
      hapticOsc.frequency.exponentialRampToValueAtTime(42, t + 0.08);

      hapticGain.gain.setValueAtTime(0.001, t);
      hapticGain.gain.linearRampToValueAtTime(0.9, t + 0.015);
      hapticGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      hapticOsc.connect(hapticGain);
      hapticGain.connect(ctx.destination);

      hapticOsc.start(t);
      hapticOsc.stop(t + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Unlock and pre-warm audio context on first user touch gesture
   */
  public unlockAudio(): void {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }
}

export const audioFeedback = new AudioFeedbackManager();
