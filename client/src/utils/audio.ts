// Bộ phát âm thanh tự tạo bằng Web Audio API, tối ưu hóa cho Mobile & Desktop
class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted = false;
  private isUnlocked = false;

  public unlock() {
    if (this.isUnlocked) return;
    try {
      this.initCtx();
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else if (this.ctx.state === 'running') {
          this.isUnlocked = true;
        }
      }
    } catch {
      // Bỏ qua lỗi hạn chế âm thanh trên một số trình duyệt
    }
  }

  private initCtx() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      this.ctx = null;
    }
  }

  public playCardSelect() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Safe fallback
    }
  }

  public playCardPlay() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Safe fallback
    }
  }

  public playChatHeo() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {
      // Safe fallback
    }
  }

  public playVictory() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.12);
        osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.3);
      });
    } catch {
      // Safe fallback
    }
  }

  public playTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ctx.state !== 'running') return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Safe fallback
    }
  }
}

export const sound = new SoundManager();

// Tự động mở khóa AudioContext ngay khi người dùng chạm (touch) lần đầu trên mobile
if (typeof window !== 'undefined') {
  const unlockAudioListener = () => {
    sound.unlock();
    window.removeEventListener('touchstart', unlockAudioListener);
    window.removeEventListener('pointerdown', unlockAudioListener);
    window.removeEventListener('click', unlockAudioListener);
  };
  window.addEventListener('touchstart', unlockAudioListener, { passive: true });
  window.addEventListener('pointerdown', unlockAudioListener, { passive: true });
  window.addEventListener('click', unlockAudioListener, { passive: true });
}
