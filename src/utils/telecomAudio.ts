/**
 * Realistic Telephony Audio Generator using the Web Audio API
 * Generates North American standard call progress tones (Ringback, DTMF keypad tones, line click)
 */

class TelecomAudioEngine {
  private ctx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;

  private initCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play standard DTMF Keypad tone
  playDTMF(key: string, durationMs: number = 180) {
    try {
      const ctx = this.initCtx();
      const dtmfFreqs: Record<string, [number, number]> = {
        '1': [697, 1209],
        '2': [697, 1336],
        '3': [697, 1477],
        '4': [770, 1209],
        '5': [770, 1336],
        '6': [770, 1477],
        '7': [852, 1209],
        '8': [852, 1336],
        '9': [852, 1477],
        '*': [941, 1209],
        '0': [941, 1336],
        '#': [941, 1477],
      };

      const freqs = dtmfFreqs[key] || [697, 1209];
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freqs[0], now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freqs[1], now);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationMs / 1000);
      osc2.stop(now + durationMs / 1000);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  // Play realistic North American Ringback Tone (440Hz + 480Hz)
  playRingback(onFinished?: () => void) {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now);

      // Fade in and fade out for 1.8 seconds (single realistic ring)
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.setValueAtTime(0.12, now + 1.6);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);

      setTimeout(() => {
        this.playLineConnectClick();
        if (onFinished) onFinished();
      }, 1900);
    } catch (e) {
      if (onFinished) onFinished();
    }
  }

  // Play line connection click / electronic handshake
  playLineConnectClick() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Ignore
    }
  }

  private holdInterval: any = null;

  // Play a soft, warm repetitive hold chime loop
  playHoldChime() {
    this.stopHoldChime();
    const playChord = () => {
      try {
        const ctx = this.initCtx();
        const now = ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99]; // C Major arpeggio / chord
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.001, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.85);
        });
      } catch (e) {}
    };

    playChord();
    this.holdInterval = setInterval(playChord, 2200);
  }

  stopHoldChime() {
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
  }

  // Play PBX transfer / switchboard handoff tone
  playTransferChime(onComplete?: () => void) {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.setValueAtTime(554.37, now);
      osc2.frequency.setValueAtTime(1108.73, now + 0.18);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    } catch (e) {
      if (onComplete) onComplete();
    }
  }

  // Immediately terminate all ongoing tones and audio synthesis
  stopAll() {
    this.stopHoldChime();
    try {
      if (this.ctx) {
        if (this.ctx.state !== 'closed') {
          this.ctx.close();
        }
        this.ctx = null;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Play hangup / busy tone (480Hz + 620Hz, 3 short bursts)
  playHangupTone() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      for (let i = 0; i < 2; i++) {
        const start = now + i * 0.4;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(480, start);
        osc2.frequency.setValueAtTime(620, start);

        gain.gain.setValueAtTime(0.1, start);
        gain.gain.setValueAtTime(0.001, start + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + 0.25);
        osc2.stop(start + 0.25);
      }
    } catch (e) {
      // Ignore
    }
  }
}

export const telecomAudio = new TelecomAudioEngine();
