import { CONFIG } from './config.js';

// --- Projectiles (Lasers) ---
export class Projectile {
    constructor(x, y, vx, vy, isEnemy = false, color = '#00f0ff') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.color = color;
        this.width = isEnemy ? 3 : 4;
        this.height = isEnemy ? 12 : 16;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        if (CONFIG.glowEnabled) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fill();
        ctx.restore();
    }
}
