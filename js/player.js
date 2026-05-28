import { CONFIG } from './config.js';
import { sfx } from './audio.js';
import { Projectile } from './projectile.js';

export class Player {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.width = 44;
        this.height = 38;
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 80;
        this.shield = 1;
        this.maxShield = 1;
        this.lastShotTime = 0;
        this.invulnerable = false;
        this.invulnTimer = 0;
        this.playerSpeed = 12; // increased speed for more responsive controls
        this.baseFireRate = 400; // ms
        this.weaponUpgradeLevel = 1;
    }

    update(keys, pointerX, isPointerDown, fireRateUpgradeLevel, projectiles, dt = 1) {
        // Déplacement par clavier
        let dx = 0;
        if (keys['arrowleft'] || keys['q'] || keys['keya']) {
            dx = -this.playerSpeed;
        }
        if (keys['arrowright'] || keys['d'] || keys['keyd']) {
            dx = this.playerSpeed;
        }

        // Appliquer mouvement clavier
        this.x += dx * dt;

        // Déplacement par drag (tactile ou souris)
        if (pointerX !== null) {
            // Déplacement direct vers le pointeur, avec contrainte aux bords
            const clampedX = Math.max(this.width / 2, Math.min(this.canvasWidth - this.width / 2, pointerX));
            this.x = clampedX;
        }

        // Bloquer aux bordures
        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > this.canvasWidth - this.width / 2) this.x = this.canvasWidth - this.width / 2;

        // Tir automatique si espace ou clic pressé
        const fireInterval = this.baseFireRate - (fireRateUpgradeLevel - 1) * 65; // Vitesse selon upgrade
        const now = Date.now();
        if ((keys[' '] || isPointerDown) && now - this.lastShotTime > fireInterval) {
            this.shoot(this.weaponUpgradeLevel, projectiles);
            this.lastShotTime = now;
        }

        // Gestion invulnérabilité clignotante après dégât (indépendante du framerate via dt)
        if (this.invulnerable) {
            this.invulnTimer -= 16.67 * dt; // temps écoulé réel en ms (16.67ms à 60fps)
            if (this.invulnTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    shoot(weaponUpgradeLevel, projectiles) {
        const pSpeed = -10;
        sfx.playLaser();

        if (weaponUpgradeLevel === 1) {
            // Tir simple central
            projectiles.push(new Projectile(this.x, this.y - 15, 0, pSpeed, false, '#00f0ff'));
        }
        else if (weaponUpgradeLevel === 2) {
            // Double tir parallèle
            projectiles.push(new Projectile(this.x - 10, this.y - 12, 0, pSpeed, false, '#00f0ff'));
            projectiles.push(new Projectile(this.x + 10, this.y - 12, 0, pSpeed, false, '#00f0ff'));
        }
        else if (weaponUpgradeLevel === 3) {
            // Triple tir (2 droit, 2 inclinés)
            projectiles.push(new Projectile(this.x - 6, this.y - 15, 0, pSpeed, false, '#ff007f'));
            projectiles.push(new Projectile(this.x + 6, this.y - 15, 0, pSpeed, false, '#ff007f'));
            projectiles.push(new Projectile(this.x - 12, this.y - 10, -2, pSpeed, false, '#00f0ff'));
            projectiles.push(new Projectile(this.x + 12, this.y - 10, 2, pSpeed, false, '#00f0ff'));
        }
        else if (weaponUpgradeLevel >= 4) {
            // Quad-tir suprême dévastateur
            projectiles.push(new Projectile(this.x - 6, this.y - 15, 0, pSpeed, false, '#ff007f'));
            projectiles.push(new Projectile(this.x + 6, this.y - 15, 0, pSpeed, false, '#ff007f'));
            projectiles.push(new Projectile(this.x - 16, this.y - 10, -3, pSpeed - 1, false, '#00f0ff'));
            projectiles.push(new Projectile(this.x + 16, this.y - 10, 3, pSpeed - 1, false, '#00f0ff'));
            projectiles.push(new Projectile(this.x - 16, this.y - 10, -1, pSpeed - 1, false, '#00f0ff'));
            projectiles.push(new Projectile(this.x + 16, this.y - 10, 1, pSpeed - 1, false, '#00f0ff'));
        }
    }

    draw(ctx, gameFrame) {
        // Masquer périodiquement si invulnérable (effet clignotant)
        if (this.invulnerable && Math.floor(gameFrame / 6) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        const shipColor = '#00f0ff';
        ctx.fillStyle = shipColor;
        if (CONFIG.glowEnabled) {
            ctx.shadowColor = shipColor;
            ctx.shadowBlur = 12;
        }

        // Tracé du vaisseau cyber-chasseur néon élégant
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2); // Pointe centrale
        ctx.lineTo(this.width / 4, -this.height / 6);
        ctx.lineTo(this.width / 2, this.height / 3); // Aile droite
        ctx.lineTo(this.width / 4, this.height / 2);
        ctx.lineTo(0, this.height / 4); // Base centrale rentrante
        ctx.lineTo(-this.width / 4, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 3); // Aile gauche
        ctx.lineTo(-this.width / 4, -this.height / 6);
        ctx.closePath();
        ctx.fill();

        // Réacteur incandescent central
        const enginePulse = Math.sin(gameFrame * 0.3) * 4 + 8;
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-5, this.height / 4);
        ctx.lineTo(0, this.height / 4 + enginePulse);
        ctx.lineTo(5, this.height / 4);
        ctx.closePath();
        ctx.fill();

        // Si le bouclier est actif, dessiner un halo d'énergie protecteur
        if (this.shield > 1) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.75, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
