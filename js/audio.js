// --- Synthétiseur Audio Dynamique (Web Audio API) ---
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playLaser() {
        if (!this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playExplosion(type = 'normal') {
        if (!this.ctx) return;
        this.init();

        const bufferSize = this.ctx.sampleRate * (type === 'boss' ? 0.8 : 0.3);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Remplir avec du bruit blanc
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'boss' ? 300 : 800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + (type === 'boss' ? 0.8 : 0.3));

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(type === 'boss' ? 0.3 : 0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (type === 'boss' ? 0.8 : 0.3));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + (type === 'boss' ? 0.8 : 0.3));
    }

    playHit() {
        if (!this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.setValueAtTime(60, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playUpgrade() {
        if (!this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const playTone = (freq, time, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + duration);
        };

        playTone(523.25, now, 0.1);      // C5
        playTone(659.25, now + 0.08, 0.1); // E5
        playTone(783.99, now + 0.16, 0.12); // G5
        playTone(1046.50, now + 0.24, 0.2); // C6
    }

    playLevelUp() {
        if (!this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const playTone = (freq, time, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.05, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + duration);
        };

        playTone(392.00, now, 0.15); // G4
        playTone(523.25, now + 0.15, 0.15); // C5
        playTone(659.25, now + 0.30, 0.15); // E5
        playTone(783.99, now + 0.45, 0.3);  // G5
    }
}

export const sfx = new SoundFX();
