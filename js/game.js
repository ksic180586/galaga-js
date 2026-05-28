"use strict";

import { CONFIG } from './config.js';
import { sfx } from './audio.js';
import { Starfield } from './starfield.js';
import { Particle } from './particles.js';
import { Crystal } from './crystal.js';
import { Projectile } from './projectile.js';
import { Enemy } from './enemy.js';
import { Player } from './player.js';

// --- Noyau du Moteur de Jeu ---
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Dimensionnement
        this.width = CONFIG.canvasWidth;
        this.height = CONFIG.canvasHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Éléments
        this.starfield = new Starfield(this.width, this.height);

        // États de jeu
        this.state = 'MENU'; // MENU, PLAYING, SHOP, GAMEOVER, PAUSE
        this.gameFrame = 0;
        this.score = 0;
        this.wave = 1;
        this.crystals = 0;
        this.gridOffset = 0;
        this.gridDirection = 1;

        // Secousse caméra (Screen Shake)
        this.shakeIntensity = 0;

        // Listes d'entités
        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.particles = [];
        this.crystalsList = [];

        // Inputs
        this.keys = {};
        this.pointerX = null;
        this.isPointerDown = false;

        // Progression globale & boutique (Sauvegarde dans localStorage)
        this.loadProfile();

        // Liaisons d'événements
        this.bindEvents();
        this.initUI();

        // Lancement de la boucle
        this.tick();
    }

    loadProfile() {
        this.highScore = parseInt(localStorage.getItem('g_nv_highscore')) || 0;

        // Niveaux d'amélioration de départ
        this.upgrades = {
            weapon: 1,    // Niv 1 à 4
            firerate: 1,  // Niv 1 à 5
            shield: 1,    // Niv 1 à 5 (bouclier max de 1 à 5)
            magnet: 0     // Niv 0 à 3
        };

        // Prix des améliorations
        this.upgradePrices = {
            weapon: [0, 25, 55, 120, 9999], // Niveau 1 déjà acquis, prix pour niv 2, 3, 4
            firerate: [0, 15, 30, 60, 100, 9999],
            shield: [0, 20, 45, 80, 150, 9999],
            magnet: [10, 25, 55, 9999]
        };
    }

    saveProfile() {
        localStorage.setItem('g_nv_highscore', this.highScore);
    }

    initUI() {
        // Mettre à jour l'affichage des meilleurs scores
        document.getElementById('best-score-display').textContent = this.formatScore(this.highScore);

        // Boutons Menu Principal
        document.getElementById('btn-play').addEventListener('click', () => {
            sfx.init();
            this.startGame();
        });

        document.getElementById('btn-commands').addEventListener('click', () => {
            sfx.init();
            document.getElementById('commands-modal').classList.remove('hidden');
            document.getElementById('commands-modal').classList.add('active');
        });

        document.getElementById('btn-close-commands').addEventListener('click', () => {
            document.getElementById('commands-modal').classList.remove('active');
            setTimeout(() => document.getElementById('commands-modal').classList.add('hidden'), 300);
        });

        // Boutique d'amélioration (Suivant)
        document.getElementById('btn-next-wave').addEventListener('click', () => {
            this.closeShopAndNextWave();
        });

        // Liaison dynamique des boutons de boutique
        document.querySelectorAll('.btn-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                this.buyUpgrade(type);
            });
        });

        // Boutons Game Over
        document.getElementById('btn-restart').addEventListener('click', () => {
            sfx.init();
            this.startGame();
        });

        document.getElementById('btn-home').addEventListener('click', () => {
            this.changeState('MENU');
        });

        document.getElementById('btn-save-record').addEventListener('click', () => {
            this.saveLeaderboardScore();
        });

        // Pause
        document.getElementById('btn-resume').addEventListener('click', () => {
            this.changeState('PLAYING');
        });
    }

    bindEvents() {
        // Clavier
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            // Raccourci pause P
            if (e.key.toLowerCase() === 'p' && this.state === 'PLAYING') {
                this.changeState('PAUSE');
            } else if (e.key.toLowerCase() === 'p' && this.state === 'PAUSE') {
                this.changeState('PLAYING');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Souris et Tactile pour drag fluide
        const rect = this.canvas.getBoundingClientRect();

        const setPointerX = (clientValX) => {
            const relativeX = (clientValX - rect.left) / rect.width;
            this.pointerX = relativeX * this.width;
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state !== 'PLAYING') return;
            this.isPointerDown = true;
            setPointerX(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isPointerDown) return;
            setPointerX(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            this.isPointerDown = false;
        });

        // Support mobile tactile
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.state !== 'PLAYING') return;
            sfx.init();
            this.isPointerDown = true;
            setPointerX(e.touches[0].clientX);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isPointerDown) return;
            setPointerX(e.touches[0].clientX);
            e.preventDefault(); // Bloquer scroll
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.isPointerDown = false;
        });

        // Resize réactif du conteneur en assurant que le ratio est maintenu
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    handleResize() {
        // Redimensionner dynamiquement pour garder les proportions adaptées sur mobile
        const container = document.getElementById('game-container');
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (winW < 600 || winH < 800) {
            // Mobile adaptatif
            const scale = Math.min(winW / 600, winH / 800);
            container.style.transform = `scale(${scale})`;
            container.style.transformOrigin = 'center center';
        } else {
            container.style.transform = 'none';
        }
    }

    // --- Gestion des États ---
    changeState(newState) {
        this.state = newState;

        // Cacher tous les écrans
        document.querySelectorAll('.ui-screen').forEach(screen => {
            screen.classList.remove('active');
            if (screen.id !== 'hud') screen.classList.add('hidden');
        });

        // Afficher l'écran actif
        if (newState === 'MENU') {
            document.getElementById('menu-screen').classList.remove('hidden');
            setTimeout(() => document.getElementById('menu-screen').classList.add('active'), 50);
            document.getElementById('best-score-display').textContent = this.formatScore(this.highScore);
            document.getElementById('hud').classList.add('hidden');
        }
        else if (newState === 'PLAYING') {
            document.getElementById('hud').classList.remove('hidden');
            // Laisser le canvas de jeu visible en fond
        }
        else if (newState === 'SHOP') {
            this.openShop();
        }
        else if (newState === 'GAMEOVER') {
            this.openGameOver();
        }
        else if (newState === 'PAUSE') {
            document.getElementById('pause-screen').classList.remove('hidden');
            setTimeout(() => document.getElementById('pause-screen').classList.add('active'), 50);
        }
    }

    // --- Démarrer le Jeu ---
    startGame() {
        this.score = 0;
        this.wave = 1;
        this.crystals = 0;

        // Réinitialiser les améliorations temporaires pour la partie
        this.upgrades = {
            weapon: 1,
            firerate: 1,
            shield: 1,
            magnet: 0
        };

        // Créer joueur
        this.player = new Player(this.width, this.height);

        // Vider entités
        this.projectiles = [];
        this.enemies = [];
        this.particles = [];
        this.crystalsList = [];

        this.gridOffset = 0;
        this.gridDirection = 1;

        this.changeState('PLAYING');
        this.generateWave();
        sfx.playLevelUp();
    }

    // --- Génération de Vagues ---
    generateWave() {
        this.enemies = [];

        if (this.wave % 5 === 0) {
            // Vague de BOSS !
            const startX = this.width / 2;
            const targetX = this.width / 2;
            const targetY = 180;
            const boss = new Enemy('boss', targetX, targetY, startX, 'left', this.width);
            // Ajustement HP Boss selon la vague
            boss.hp = 15 + (this.wave / 5) * 15;
            boss.maxHp = boss.hp;
            this.enemies.push(boss);
        }
        else {
            // Vague Standard
            // Disposer en grille : 3 lignes d'ennemis
            const rows = 3;
            const cols = 6;
            const startY = 120;
            const colSpacing = 60;
            const rowSpacing = 50;

            for (let r = 0; r < rows; r++) {
                // Déterminer le type d'ennemi par ligne
                let type = 'drone';
                if (r === 1) type = 'swarmer';
                if (r === 2) type = 'kamikaze';

                for (let c = 0; c < cols; c++) {
                    // Positionnement final
                    const targetX = (this.width / 2) - ((cols - 1) * colSpacing / 2) + c * colSpacing;
                    const targetY = startY + r * rowSpacing;

                    // Point d'entrée décalé
                    const side = c % 2 === 0 ? 'left' : 'right';
                    const startX = side === 'left' ? -40 : this.width + 40;

                    this.enemies.push(new Enemy(type, targetX, targetY, startX, side, this.width));
                }
            }
        }

        this.gameFrame = 0;
    }

    // --- Boucle de Jeu Principale ---
    tick() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.tick());
    }

    // --- Logique d'Évolution (Update) ---
    update() {
        this.starfield.update();

        if (this.state !== 'PLAYING') {
            // Mettre à jour les particules en tâche de fond pour effet visuel continu
            this.particles.forEach(p => p.update());
            this.particles = this.particles.filter(p => p.alpha > 0);
            return;
        }

        this.gameFrame++;

        // --- 1. Mouvement Grille Ennemi ---
        // Fait osciller les ennemis de gauche à droite
        const maxOffset = 30;
        this.gridOffset += 0.4 * this.gridDirection;
        if (Math.abs(this.gridOffset) > maxOffset) {
            this.gridDirection *= -1;
        }

        // --- 2. Mise à jour Joueur ---
        if (this.player) {
            this.player.update(this.keys, this.pointerX, this.isPointerDown, this.upgrades.firerate, this.projectiles);
        }

        // --- 3. Lasers & Projectiles ---
        this.projectiles.forEach(p => p.update());
        // Filtrer les lasers sortis de l'écran
        this.projectiles = this.projectiles.filter(p => p.y > -20 && p.y < this.height + 20);

        // --- 4. Ennemis & Attaques Plongeantes ---
        const playerX = this.player ? this.player.x : this.width / 2;
        const playerY = this.player ? this.player.y : this.height - 80;

        this.enemies.forEach(e => {
            e.update(playerX, this.gameFrame, this.width, this.height, this.gridOffset);

            // Les ennemis attaquent de manière probabiliste si en grille
            if (e.state === 'grid' && e.type !== 'boss') {
                const baseProb = 0.0006 + this.wave * 0.0002;
                if (Math.random() < baseProb) {
                    e.state = 'diving';
                }
            }

            // Tirs ennemis périodiques
            if (e.state !== 'entering' && Math.random() < e.shootProb) {
                this.enemyShoot(e);
            }
        });

        // --- 5. Cristaux & Particules ---
        this.crystalsList.forEach(c => c.update(playerX, playerY, this.upgrades.magnet));
        this.crystalsList = this.crystalsList.filter(c => c.y < this.height + 20 && !c.collected);

        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.alpha > 0);

        // Décroissance secousses caméra
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= 0.9;
            if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
        }

        // --- 6. Collisions ---
        this.checkCollisions();

        // --- 7. Passage de Vague ---
        if (this.enemies.length === 0) {
            sfx.playUpgrade();
            this.changeState('SHOP');
        }

        // --- 8. Synchronisation HUD ---
        this.updateHUD();
    }



    enemyShoot(enemy) {
        let speed = 4 + this.wave * 0.3;
        if (enemy.type === 'boss') {
            // Le boss tire des vagues doubles
            this.projectiles.push(new Projectile(enemy.x - 15, enemy.y + 15, 0, speed, true, '#ff007f'));
            this.projectiles.push(new Projectile(enemy.x + 15, enemy.y + 15, 0, speed, true, '#ff007f'));
            sfx.playLaser();
        }
        else {
            // Tir simple vers le bas ou incliné vers le joueur
            const targetX = this.player ? this.player.x : this.width / 2;
            const targetY = this.player ? this.player.y : this.height - 80;
            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const dist = Math.hypot(dx, dy) || 1;

            // Viser partiellement le joueur
            const vx = (dx / dist) * 1.5;
            this.projectiles.push(new Projectile(enemy.x, enemy.y + 15, vx, speed, true, '#ffaa00'));
        }
    }

    // --- Gestion des Collisions ---
    checkCollisions() {
        if (!this.player) return;

        // 1. Lasers Joueur contre Ennemis
        for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
            const p = this.projectiles[pIdx];
            if (p.isEnemy) continue;

            for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = this.enemies[eIdx];

                // Collision box
                if (p.x > e.x - e.width / 2 && p.x < e.x + e.width / 2 &&
                    p.y > e.y - e.height / 2 && p.y < e.y + e.height / 2) {

                    // Détruire laser
                    this.projectiles.splice(pIdx, 1);

                    // Toucher Ennemi
                    e.hp--;
                    sfx.playHit();

                    // Petites étincelles d'impact
                    this.createExplosionParticles(p.x, p.y, e.color, 5);

                    if (e.hp <= 0) {
                        this.destroyEnemy(e, eIdx);
                    }
                    break; // Sortir pour passer au laser suivant
                }
            }
        }

        // 2. Lasers Ennemis ou Ennemis physiques contre Joueur
        if (!this.player.invulnerable) {
            // Lasers ennemis
            for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
                const p = this.projectiles[pIdx];
                if (!p.isEnemy) continue;

                if (p.x > this.player.x - this.player.width / 2 && p.x < this.player.x + this.player.width / 2 &&
                    p.y > this.player.y - this.player.height / 2 && p.y < this.player.y + this.player.height / 2) {

                    this.projectiles.splice(pIdx, 1);
                    this.hitPlayer();
                    break;
                }
            }

            // Ennemis physiques en plongée
            if (!this.player) return;
            for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = this.enemies[eIdx];
                if (e.state !== 'diving') continue;

                const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (dist < (e.width / 2 + this.player.width / 3)) {
                    // Détruire l'ennemi kamikaze et blesser joueur
                    this.destroyEnemy(e, eIdx);
                    this.hitPlayer();
                    break;
                }
            }
        }

        // Sécurité si le joueur a été détruit lors des sous-étapes précédentes de collision
        if (!this.player) return;

        // 3. Collision Vaisseau et Cristaux
        for (let cIdx = this.crystalsList.length - 1; cIdx >= 0; cIdx--) {
            const c = this.crystalsList[cIdx];
            const dist = Math.hypot(c.x - this.player.x, c.y - this.player.y);

            if (dist < 20) {
                c.collected = true;
                this.crystals++;
                this.score += 50;
                sfx.playLaser(); // Petit sifflement aigu
            }
        }
    }

    destroyEnemy(enemy, index) {
        this.enemies.splice(index, 1);
        this.score += enemy.scoreVal;

        const isBoss = enemy.type === 'boss';

        // Grosse explosion de particules
        this.createExplosionParticles(enemy.x, enemy.y, enemy.color, isBoss ? 60 : 15);
        sfx.playExplosion(isBoss ? 'boss' : 'normal');

        // Secousse caméra proportionnelle
        this.shakeIntensity = isBoss ? 25 : 8;

        // Spawn de cristaux néon — les drops augmentent avec la vague
        // Probabilité de base augmente de 5% par vague (plafonné à 90%)
        const waveBonus = Math.min(this.wave * 0.05, 0.65);
        let crystalProb = 0.25 + waveBonus;                              // Drone  : 25% → 90%
        if (enemy.type === 'swarmer') crystalProb = 0.45 + waveBonus;  // Swarmer : 45% → 90%
        if (enemy.type === 'kamikaze') crystalProb = 0.55 + waveBonus;  // Kamikaze : 55% → 90%
        crystalProb = Math.min(crystalProb, 0.90); // Plafond à 90%

        // À partir de la vague 5, les ennemis normaux peuvent dropper 2 cristaux
        // À partir de la vague 10, ils peuvent en dropper 3
        const maxDrops = this.wave >= 10 ? 3 : this.wave >= 5 ? 2 : 1;

        if (isBoss) {
            // Boss spawn de plus en plus de cristaux selon la vague
            const bossDropCount = 15 + Math.floor(this.wave / 5) * 10; // +10 par palier de boss
            for (let i = 0; i < bossDropCount; i++) {
                this.crystalsList.push(new Crystal(enemy.x + (Math.random() * 80 - 40), enemy.y + (Math.random() * 40 - 20)));
            }
        } else {
            // Ennemis normaux : plusieurs jets possibles aux vagues élevées
            for (let d = 0; d < maxDrops; d++) {
                if (Math.random() < crystalProb) {
                    this.crystalsList.push(new Crystal(
                        enemy.x + (d > 0 ? (Math.random() * 20 - 10) : 0),
                        enemy.y + (d > 0 ? (Math.random() * 10 - 5) : 0)
                    ));
                }
            }
        }
    }

    hitPlayer() {
        this.player.shield--;
        this.shakeIntensity = 20;
        this.createExplosionParticles(this.player.x, this.player.y, '#00f0ff', 25);
        sfx.playExplosion('normal');

        if (this.player.shield <= 0) {
            this.player.shield = 0;
            this.killPlayer();
        } else {
            // Rendre temporairement invulnérable
            this.player.invulnerable = true;
            this.player.invulnTimer = 1500; // 1.5 secondes
            sfx.playHit();
        }
    }

    killPlayer() {
        this.createExplosionParticles(this.player.x, this.player.y, '#ff007f', 80);
        this.player = null;
        sfx.playExplosion('boss');

        // Passer à Game Over après petit délai dramatique
        setTimeout(() => this.changeState('GAMEOVER'), 1500);
    }

    createExplosionParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    // --- Rendu Graphique (Draw) ---
    draw() {
        this.ctx.save();

        // Appliquer secousse écran
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }

        // Effacer fond
        this.ctx.fillStyle = CONFIG.glowEnabled ? '#05030a' : '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Starfield parallaxe
        this.starfield.draw(this.ctx);

        // Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));

        // Ennemis
        this.enemies.forEach(e => e.draw(this.ctx, this.gameFrame));

        // Cristaux
        this.crystalsList.forEach(c => c.draw(this.ctx));

        // Particules
        this.particles.forEach(p => p.draw(this.ctx));

        // Joueur
        if (this.player) {
            this.player.draw(this.ctx, this.gameFrame);
        }

        this.ctx.restore();
    }

    // --- Helpers Utilitaires ---
    formatScore(num) {
        return num.toString().padStart(6, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    updateHUD() {
        document.getElementById('hud-score').textContent = this.formatScore(this.score);
        document.getElementById('hud-wave').textContent = this.wave;
        document.getElementById('hud-crystals').textContent = this.crystals;

        // Gérer barre de vie / bouclier
        if (this.player) {
            const pct = (this.player.shield / this.player.maxShield) * 100;
            document.getElementById('hud-shield-fill').style.width = `${pct}%`;
        }
    }

    // --- Système de Boutique ---
    openShop() {
        // Stopper pointeur pressé pour éviter les tirs intempestifs après chargement
        this.isPointerDown = false;

        document.getElementById('shop-screen').classList.remove('hidden');
        setTimeout(() => document.getElementById('shop-screen').classList.add('active'), 50);

        // Mettre à jour solde cristaux boutique
        document.getElementById('shop-crystals-count').textContent = this.crystals;
        document.getElementById('shop-next-wave-num').textContent = this.wave + 1;

        // Actualiser l'affichage des améliorations de la boutique
        this.updateShopCardsUI();
    }

    updateShopCardsUI() {
        const types = ['weapon', 'firerate', 'shield', 'magnet'];

        types.forEach(type => {
            const currentLevel = this.upgrades[type];
            const price = this.upgradePrices[type][currentLevel];
            const btn = document.getElementById(`btn-up-${type}`);

            if (!btn) return;

            // Déterminer libellé et désactivation
            if (price === 9999 || (type === 'weapon' && currentLevel >= 4)) {
                btn.innerHTML = `<span>MAX</span><span class="upgrade-level">Niv. ${currentLevel}</span>`;
                btn.disabled = true;
            } else {
                btn.innerHTML = `<span class="upgrade-cost">${price} Plasma</span><span class="upgrade-level">Niv. ${currentLevel}</span>`;
                // Désactiver si pas assez de cristaux
                btn.disabled = this.crystals < price;
            }
        });
    }

    buyUpgrade(type) {
        const currentLevel = this.upgrades[type];
        const price = this.upgradePrices[type][currentLevel];

        if (this.crystals >= price) {
            this.crystals -= price;
            this.upgrades[type]++;

            // Effet sur le vaisseau immédiatement si applicable
            if (type === 'weapon') {
                this.player.weaponUpgradeLevel++;
            }
            else if (type === 'shield') {
                this.player.maxShield++;
                this.player.shield++;
            }

            sfx.playUpgrade();

            // Rafraîchir UI
            document.getElementById('shop-crystals-count').textContent = this.crystals;
            this.updateShopCardsUI();
            this.updateHUD();
        }
    }

    closeShopAndNextWave() {
        this.wave++;

        // Fermer écran boutique
        document.getElementById('shop-screen').classList.remove('active');
        setTimeout(() => {
            document.getElementById('shop-screen').classList.add('hidden');
            this.changeState('PLAYING');
            this.generateWave();
            sfx.playLevelUp();
        }, 300);
    }

    // --- Système de Fin de Partie (Game Over) ---
    openGameOver() {
        document.getElementById('game-over-screen').classList.remove('hidden');
        setTimeout(() => document.getElementById('game-over-screen').classList.add('active'), 50);

        document.getElementById('go-wave').textContent = this.wave;
        document.getElementById('go-score').textContent = this.formatScore(this.score);
        document.getElementById('go-crystals').textContent = this.crystals;

        // Si record battu
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveProfile();
            document.getElementById('new-record-section').classList.remove('hidden');
        } else {
            document.getElementById('new-record-section').classList.add('hidden');
        }

        this.renderLeaderboard();
    }

    saveLeaderboardScore() {
        const nameInput = document.getElementById('player-name-input');
        let name = nameInput.value.trim().toUpperCase();
        if (!name) name = 'AAA';

        let leaderboard = JSON.parse(localStorage.getItem('g_nv_leaderboard')) || [
            { name: 'NEO', score: 10000, wave: 5 },
            { name: 'VOI', score: 5000, wave: 3 },
            { name: 'GAL', score: 2500, wave: 2 }
        ];

        // Ajouter le nouveau score
        leaderboard.push({
            name: name,
            score: this.score,
            wave: this.wave
        });

        // Trier et limiter au top 5
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5);

        localStorage.setItem('g_nv_leaderboard', JSON.stringify(leaderboard));

        // Cacher formulaire record
        document.getElementById('new-record-section').classList.add('hidden');
        this.renderLeaderboard();
    }

    renderLeaderboard() {
        const container = document.getElementById('leaderboard-list');
        container.innerHTML = '';

        const leaderboard = JSON.parse(localStorage.getItem('g_nv_leaderboard')) || [
            { name: 'NEO', score: 10000, wave: 5 },
            { name: 'VOI', score: 5000, wave: 3 },
            { name: 'GAL', score: 2500, wave: 2 }
        ];

        leaderboard.forEach((entry, idx) => {
            const isCurrent = entry.score === this.score && entry.wave === this.wave;
            const row = document.createElement('div');
            row.className = `leaderboard-row ${isCurrent ? 'highlighted' : ''}`;

            row.innerHTML = `
                <span class="leaderboard-rank">#${idx + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${this.formatScore(entry.score)}</span>
            `;
            container.appendChild(row);
        });
    }
}

// --- Initialisation du Jeu au Chargement de la Page ---
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.engine = new GameEngine();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.engine = new GameEngine();
    });
}
