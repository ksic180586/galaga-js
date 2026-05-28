import { CONFIG } from './config.js';

// --- Système de Particules Néon ---
export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.size = Math.random() * 2.5 + 1;
    }

    update(dt = 1) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= Math.pow(0.96, dt); // Friction indépendante du framerate
        this.vy *= Math.pow(0.96, dt);
        this.alpha -= this.decay * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        if (CONFIG.glowEnabled) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
