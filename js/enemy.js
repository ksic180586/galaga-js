import { CONFIG } from './config.js';
import { getBezierPoint } from './utils.js';

// --- Classe Ennemis ---
export class Enemy {
    constructor(type, gridX, gridY, startX, entrySide, canvasWidth) {
        this.type = type; // 'drone', 'swarmer', 'kamikaze', 'boss'
        this.gridX = gridX; // Cible de position finale X en grille
        this.gridY = gridY; // Cible de position finale Y en grille

        // États : 'entering' (vol initial), 'grid' (maintien de ligne), 'diving' (attaque plongeante)
        this.state = 'entering';

        this.x = startX;
        this.y = -50;
        this.width = 30;
        this.height = 30;

        this.entryProgress = 0;
        this.entrySpeed = 0.012 + Math.random() * 0.005;
        this.rotAngle = 0;

        // Définition de la trajectoire de Bézier pour l'apparition en courbes fluides
        const endX = gridX;
        const endY = gridY;
        const ctrlX1 = entrySide === 'left' ? -100 : canvasWidth + 100;
        const ctrlY1 = 150;
        const ctrlX2 = entrySide === 'left' ? canvasWidth * 0.4 : canvasWidth * 0.6;
        const ctrlY2 = gridY + 200;

        this.bezierPoints = {
            p0: { x: startX, y: -50 },
            p1: { x: ctrlX1, y: ctrlY1 },
            p2: { x: ctrlX2, y: ctrlY2 },
            p3: { x: endX, y: endY }
        };

        // Paramétrage des statistiques selon le type
        this.setupStats();
    }

    setupStats() {
        switch (this.type) {
            case 'drone':
                this.hp = 1;
                this.scoreVal = 100;
                this.color = '#ff007f'; // Rose néon
                this.shootProb = 0.001;
                break;
            case 'swarmer':
                this.hp = 2;
                this.scoreVal = 200;
                this.color = '#ffaa00'; // Orange plasma
                this.shootProb = 0.002;
                break;
            case 'kamikaze':
                this.hp = 1;
                this.scoreVal = 300;
                this.color = '#ffdd00'; // Jaune cyber
                this.shootProb = 0.004;
                break;
            case 'boss':
                this.hp = 20; // Plus fort
                this.scoreVal = 1500;
                this.color = '#b026ff'; // Violet profond
                this.shootProb = 0.015;
                this.width = 65;
                this.height = 50;
                this.state = 'entering';
                // Boss descend simplement par le haut
                this.bezierPoints.p1 = { x: 300, y: 50 };
                this.bezierPoints.p2 = { x: 300, y: 100 };
                this.bezierPoints.p3 = { x: 300, y: 150 };
                break;
        }
        this.maxHp = this.hp;
    }

    update(playerX, gameFrame, canvasWidth, canvasHeight, gridOffset) {
        if (this.state === 'entering') {
            this.entryProgress += this.entrySpeed;
            if (this.entryProgress >= 1) {
                this.entryProgress = 1;
                this.state = 'grid';
            }
            const pt = getBezierPoint(
                this.bezierPoints.p0,
                this.bezierPoints.p1,
                this.bezierPoints.p2,
                this.bezierPoints.p3,
                this.entryProgress
            );
            this.x = pt.x;
            this.y = pt.y;
            this.rotAngle = Math.sin(this.entryProgress * Math.PI * 4) * 0.4;
        }
        else if (this.state === 'grid') {
            // Positionnement en grille dynamique avec glissement oscillatoire
            this.x = this.gridX + gridOffset;
            this.y = this.gridY;
            this.rotAngle = Math.sin(gameFrame * 0.03) * 0.1;
        }
        else if (this.state === 'diving') {
            // Plongée d'attaque agressive
            this.y += 4.5;
            this.x += Math.sin(this.y * 0.02) * 3; // Mouvement de sinusoïde léger
            this.rotAngle += 0.08;

            if (this.y > canvasHeight + 40) {
                // Reclassement par le haut en grille
                this.y = -50;
                this.state = 'entering';
                this.entryProgress = 0;
            }
        }
    }

    draw(ctx, gameFrame) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotAngle);

        ctx.fillStyle = this.color;
        if (CONFIG.glowEnabled) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        }

        // Dessin vectoriel personnalisé selon le type d'ennemi
        if (this.type === 'drone') {
            // Losange blindé à deux ailes articulées
            const wingAnim = Math.sin(gameFrame * 0.1) * 4;
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2 + wingAnim, 0);
            ctx.lineTo(0, this.height / 2);
            ctx.lineTo(-this.width / 2 - wingAnim, 0);
            ctx.closePath();
            ctx.fill();

            // Noyau lumineux central
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (this.type === 'swarmer') {
            // Flèche angulaire style insectoïde
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 3);
            ctx.lineTo(this.width / 4, this.height / 2);
            ctx.lineTo(0, this.height / 6);
            ctx.lineTo(-this.width / 4, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 3);
            ctx.closePath();
            ctx.fill();
        }
        else if (this.type === 'kamikaze') {
            // Forme de shuriken rotatif néon
            ctx.rotate(gameFrame * 0.1);
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.lineTo(0, -this.height / 2);
                ctx.lineTo(this.width / 4, -this.height / 8);
                ctx.rotate(Math.PI / 2);
            }
            ctx.closePath();
            ctx.fill();
        }
        else if (this.type === 'boss') {
            // Vaisseau-mère imposant
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height / 4);
            ctx.lineTo(this.width / 3, this.height / 2);
            ctx.lineTo(this.width / 6, this.height / 4);
            ctx.lineTo(-this.width / 6, this.height / 4);
            ctx.lineTo(-this.width / 3, this.height / 2);
            ctx.lineTo(-this.width / 2, -this.height / 4);
            ctx.closePath();
            ctx.fill();

            // Noyau de tir de boss
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            // Barre de vie du boss miniaturisée
            const hpRatio = this.hp / this.maxHp;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(-25, -this.height / 2 - 12, 50, 4);
            ctx.fillStyle = hpRatio > 0.4 ? '#39ff14' : '#ff007f';
            ctx.fillRect(-25, -this.height / 2 - 12, 50 * hpRatio, 4);
        }

        ctx.restore();
    }
}
