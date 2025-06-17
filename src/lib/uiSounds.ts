
// UI Sound System for Iron Man-style interactions
class UISoundSystem {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Create audio context on user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isEnabled = true;
    } catch (error) {
      console.log("Audio not supported:", error);
      this.isEnabled = false;
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Iron Man-style UI sounds
  hover() {
    this.createTone(800, 0.1, 'sine');
  }

  click() {
    this.createTone(1200, 0.15, 'triangle');
  }

  success() {
    this.createTone(523, 0.2, 'sine'); // C note
    setTimeout(() => this.createTone(659, 0.3, 'sine'), 100); // E note
  }

  error() {
    this.createTone(200, 0.3, 'sawtooth');
  }

  notification() {
    this.createTone(880, 0.1, 'sine');
    setTimeout(() => this.createTone(1100, 0.1, 'sine'), 150);
  }

  dataFlow() {
    // Subtle data processing sound
    this.createTone(400 + Math.random() * 200, 0.05, 'square');
  }

  enable() {
    this.isEnabled = true;
    if (!this.audioContext) {
      this.init();
    }
  }

  disable() {
    this.isEnabled = false;
  }
}

export const uiSounds = new UISoundSystem();

// Auto-enable on first user interaction
document.addEventListener('click', () => {
  uiSounds.enable();
}, { once: true });
