// --- Structures Géométriques & Helpers de Tracé ---
export class Starfield {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.layers = [
            { stars: [], speed: 0.5, size: 1, color: 'rgba(255, 255, 255, 0.3)' },   // Fond lointain
            { stars: [], speed: 1.2, size: 1.5, color: 'rgba(0, 240, 255, 0.5)' },  // Étoiles moyennes cyan
            { stars: [], speed: 2.5, size: 2.2, color: 'rgba(255, 0, 127, 0.6)' }   // Étoiles proches roses
        ];

        // Initialiser les étoiles aléatoirement
        this.layers.forEach(layer => {
            for (let i = 0; i < 25; i++) {
                layer.stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height
                });
            }
        });

        // Nébuleuses décoratives
        this.nebulas = [
            { x: width * 0.2, y: height * 0.3, r: 150, color: 'rgba(255, 0, 127, 0.03)', speed: 0.1 },
            { x: width * 0.8, y: height * 0.7, r: 180, color: 'rgba(0, 240, 255, 0.03)', speed: 0.08 }
        ];
    }

    update(dt = 1) {
        // Déplacer les étoiles vers le bas
        this.layers.forEach(layer => {
            layer.stars.forEach(star => {
                star.y += layer.speed * dt;
                if (star.y > this.height) {
                    star.y = 0;
                    star.x = Math.random() * this.width;
                }
            });
        });

        // Déplacer doucement les nébuleuses
        this.nebulas.forEach(n => {
            n.y += n.speed * dt;
            if (n.y - n.r > this.height) {
                n.y = -n.r;
                n.x = Math.random() * this.width;
            }
        });
    }

    draw(ctx) {
        // Tracé des nébuleuses en premier (dégradés radiaux doux)
        this.nebulas.forEach(n => {
            const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
            grad.addColorStop(0, n.color);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Tracé des couches d'étoiles
        this.layers.forEach(layer => {
            ctx.fillStyle = layer.color;
            layer.stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, layer.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }
}
