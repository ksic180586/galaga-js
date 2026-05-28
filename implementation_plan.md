# Galaga RPG — Plan de Développement

## Description

Un jeu de tir spatial inspiré de Galaga, enrichi d'un système de progression RPG complet avec power-ups, niveaux, et statistiques de vaisseau. Développé en HTML5 Canvas + JavaScript vanilla.

---

## Mécaniques de Jeu

### Core Gameplay (Galaga)
- **Vaisseau joueur** : déplacement latéral, tir automatique ou manuel
- **Vagues d'ennemis** : formations en V, grille, spirale selon les niveaux
- **Patterns d'attaque ennemis** : dive bombs, tir groupé, kamikaze
- **Boss** : tous les 5 niveaux, avec plusieurs phases

### Système RPG
- **Niveau de vaisseau** (XP gagnée en tuant des ennemis)
- **Stats upgradables** :
  - ❤️ HP Max
  - ⚡ Vitesse de déplacement
  - 🔫 Dégâts des tirs
  - 🔄 Cadence de tir (Fire Rate)
  - 🛡️ Bouclier régénérant
- **Arbre de compétences** : 3 branches (Offensif, Défensif, Support)

---

## Power-Ups In-Game (drops ennemis)

| Icône | Nom | Effet |
|-------|-----|-------|
| ⚡ | **Rapid Fire** | Cadence x3 pendant 10s |
| 💎 | **Triple Shot** | 3 projectiles simultanés |
| 🌀 | **Spread Shot** | Dispersion 5 projectiles |
| 🔵 | **Shield Bubble** | Bouclier temporaire |
| ⭐ | **Star Bomb** | Explosion AoE massive |
| 🔴 | **Laser Beam** | Rayon continu perçant |
| 🌙 | **Ghost Mode** | Invincibilité 5s |
| 💠 | **Drone** | Vaisseau allié automatique |
| 🔥 | **Flame Trail** | Projectiles avec DoT |
| 💛 | **XP Boost** | +50% XP pendant 30s |

---

## Architecture des Fichiers

### [NEW] index.html
Page principale — structure Canvas + HUD

### [NEW] css/style.css
Design sombre premium avec animations, glassmorphism pour le HUD

### [NEW] js/game.js
Game loop principal (requestAnimationFrame), gestion états (Menu, Playing, LevelUp, GameOver)

### [NEW] js/player.js
Classe Player : position, stats RPG, tir, animations, gestion power-ups actifs

### [NEW] js/enemy.js
Classes Enemy, EnemyFormation, BossEnemy — patterns de mouvement et attaque

### [NEW] js/projectile.js
Classes Projectile, LaserBeam, BombProjectile — types de tirs joueur et ennemi

### [NEW] js/powerup.js
Classe PowerUp — drops, effets temporaires, stack logic

### [NEW] js/rpg.js
Système XP, niveau, arbre de compétences, stats upgrades

### [NEW] js/ui.js
HUD en-jeu (HP bar, bouclier, XP bar, power-ups actifs, score), écrans Menu/GameOver/LevelUp

### [NEW] js/particles.js
Système de particules pour explosions, trails, effets visuels

### [NEW] js/audio.js
Gestionnaire audio (Web Audio API) — sons synthétisés sans fichiers externes

### [NEW] js/utils.js
Fonctions utilitaires : collision, math, random, lerp

---

## Design Visuel

- **Thème** : Space dark — fond étoilé animé (parallax)
- **Palette** : Violet néon `#7B2FBE`, Cyan `#00F5FF`, Or `#FFD700`, Rouge `#FF3860`
- **HUD** : Style glassmorphism, barres animées, icônes power-ups
- **Vaisseaux** : Dessinés en Canvas (polygones + gradients lumineux)
- **Explosions** : Système de particules colorées

---

## Progression des Niveaux

| Niveau | Nouveauté |
|--------|-----------|
| 1-4 | Ennemis basiques, formations simples |
| 5 | 🔴 Premier Boss |
| 6-9 | Ennemis améliorés, vitesse accrue |
| 10 | 🔴 Boss intermédiaire (multi-phases) |
| 11+ | Ennemis spéciaux, patterns complexes |

---

## Plan d'Exécution

1. Structure HTML + CSS de base
2. Game loop et gestion d'états
3. Joueur + contrôles + tir de base
4. Système d'ennemis + IA de base
5. Power-ups + effets visuels
6. Système RPG (XP, niveaux, upgrades)
7. HUD complet + écrans de menu
8. Audio (Web Audio API)
9. Boss + patterns avancés
10. Polish final (particules, animations)

---

## Serveur Local (Démarrage et Arrêt)

Étant donné que le jeu est composé de fichiers statiques (HTML, CSS, JS), vous pouvez le lancer en utilisant l'une des méthodes ci-dessous pour héberger localement le projet :

### Option 1 : Avec Node.js (Recommandé)
- **Pour démarrer** :
  ```bash
  npx serve
  ```
  *(Le jeu sera accessible sur http://localhost:3000 par défaut)*
- **Pour arrêter** :
  Appuyez sur `Ctrl + C` dans le terminal.

### Option 2 : Avec Python
- **Pour démarrer** :
  ```bash
  python -m http.server 8000
  ```
  *(Le jeu sera accessible sur http://localhost:8000)*
- **Pour arrêter** :
  Appuyez sur `Ctrl + C` dans le terminal.

---

## Questions Ouvertes

> [!IMPORTANT]
> **Contrôles** : Souris uniquement ? Clavier (WASD/Flèches) ? Les deux ?

> [!IMPORTANT]
> **Sauvegarde** : Conserver la progression RPG via `localStorage` entre les sessions ?

> [!IMPORTANT]
> **Multijoueur** : Jeu solo uniquement, ou mode 2 joueurs (partage de clavier) à prévoir ?
