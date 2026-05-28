import { CONFIG } from './config.js';

// --- Cristaux de Plasma Néon (Monnaie) ---
export class Crystal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 1.5 + Math.random() * 1;
        this.vx = Math.sin(x) * 0.5;
        this.size = 6;
        this.pulseTimer = 0;
        this.color = '#ffaa00';
        this.collected = false;
        this.crystalVacuumRange = 400; // px
    }

    update(playerX, playerY, magnetLevel) {
        this.pulseTimer += 0.1;

        // Rayon d'attraction magnétique
        const vacuumRange = this.crystalVacuumRange + magnetLevel * 70;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < vacuumRange) {
            // Attraction fluide vers le joueur
            const force = (vacuumRange - dist) / vacuumRange;
            const speed = 8 * force + 1;
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        } else {
            // Chute naturelle
            this.y += this.vy;
            this.x += Math.sin(this.pulseTimer) * 0.2;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.pulseTimer * 0.5);
        ctx.fillStyle = this.color;
        if (CONFIG.glowEnabled) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
        }
        // Tracé d'un losange lumineux
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.7, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
