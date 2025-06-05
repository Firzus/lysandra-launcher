# PRD - Huz Studio Launcher

## Overview

Le Huz Studio Launcher est une application desktop cross-platform moderne conçue pour gérer et lancer des jeux vidéo, inspirée par l'écosystème des launchers Hoyoverse. L'application résout le problème de la fragmentation des jeux en offrant une interface unifiée pour découvrir, télécharger, mettre à jour et lancer des jeux.

**Problème résolu :** Simplifier l'expérience de gestion des jeux pour les joueurs en centralisant l'accès, les mises à jour et la découverte de contenu dans une interface moderne et performante.

**Public cible :** Gamers PC cherchant une expérience de launcher moderne, fluide et esthétiquement plaisante.

**Valeur ajoutée :** Interface utilisateur moderne avec animations fluides, performances natives grâce à Tauri 2.0, système de mise à jour automatique, et expérience utilisateur comparable aux standards de l'industrie.

## Core Features

### 1. Système de Gestion des Jeux

- **Fonction :** Découverte, installation, mise à jour et désinstallation des jeux
- **Importance :** Fonctionnalité centrale du launcher - sans cela, l'application n'a pas de raison d'être
- **Fonctionnement :** Interface en grille/liste affichant les jeux disponibles, avec statuts de téléchargement en temps réel et gestion des versions

### 2. Interface Utilisateur Moderne

- **Fonction :** UI responsive avec animations fluides, thème sombre unifié, et navigation intuitive
- **Importance :** Différenciation concurrentielle majeure - l'expérience visuelle détermine l'adoption utilisateur
- **Fonctionnement :** Composants HeroUI avec animations Framer Motion, identité visuelle sombre cohérente, layouts adaptatifs

### 3. Système de Mise à Jour Automatique

- **Fonction :** Mise à jour automatique du launcher et des jeux installés
- **Importance :** Essentiel pour la sécurité et l'expérience utilisateur continue
- **Fonctionnement :** Détection automatique des mises à jour en arrière-plan avec notifications non-intrusives

### 4. Gestionnaire de Téléchargements

- **Fonction :** Téléchargements simultanés avec contrôle de bande passante et reprise automatique
- **Importance :** Performance critique pour l'expérience utilisateur lors de l'installation de gros jeux
- **Fonctionnement :** Queue de téléchargement avec priorisation, limitation de bande passante, gestion d'erreurs, et support des mises à jour différentielles pour optimiser la bande passante

### 5. Système de Notifications

- **Fonction :** Notifications système pour mises à jour, téléchargements terminés, et actualités
- **Importance :** Maintient l'engagement utilisateur et informe des événements importants
- **Fonctionnement :** Notifications natives OS via Tauri 2.0 avec centre de notifications intégré

### 6. Intégration Social et Communauté

- **Fonction :** Actualités, événements, et liens vers les communautés des jeux
- **Importance :** Augmente la rétention et l'engagement des utilisateurs
- **Fonctionnement :** Feed d'actualités intégré, liens vers Discord/Reddit, système d'événements

## User Experience

### User Personas

**Persona Principal - Le Gamer Actif (Alex, 22 ans)**

- Joue quotidiennement à plusieurs jeux
- Valorise les performances et la rapidité
- Apprécie les interfaces modernes et personnalisables
- Actif dans les communautés gaming

**Persona Secondaire - Le Casual Gamer (Marie, 28 ans)**

- Joue occasionnellement le week-end
- Préfère la simplicité et la stabilité
- Veut une expérience sans friction
- Moins technique que le gamer actif

### Key User Flows

**Flow 1 : Première Installation**

1. Téléchargement et installation du launcher
2. Onboarding avec sélection des préférences
3. Découverte des jeux disponibles
4. Installation du premier jeu

**Flow 2 : Utilisation Quotidienne**

1. Ouverture du launcher (démarrage rapide)
2. Consultation des notifications/actualités
3. Vérification des mises à jour en arrière-plan
4. Lancement direct du jeu souhaité

**Flow 3 : Découverte et Installation de Nouveaux Jeux**

1. Navigation dans le catalogue
2. Consultation des détails et médias du jeu
3. Installation en un clic
4. Suivi du progrès de téléchargement

### UI/UX Considerations

- **Performance First :** Interface fluide 60fps minimum
- **Accessibilité :** Support des raccourcis clavier, contraste élevé
- **Fixed Resolution :** Taille optimisée fixe 1280x720 pour expérience consistante
- **Animations Meaningul :** Transitions qui guident l'utilisateur, jamais gratuites
- **Feedback Immédiat :** États de chargement, confirmations visuelles

## Technical Architecture

### System Components

**Frontend (React + TypeScript)**

- Interface utilisateur optimisée 1280x720 avec HeroUI components
- State management avec React (useState, useReducer)
- Animations avec Framer Motion
- Styling avec Tailwind CSS

**Backend (Rust + Tauri 2.0)**

- API Tauri 2.0 pour interactions système natives
- Gestionnaire de téléchargements avec multi-threading Rust
- Système de mise à jour automatique intégré
- Intégrations OS natives avancées (UAC, permissions, notifications)
- Plugin architecture pour extensibilité future

### Avantages Tauri 2.0 pour Gaming Launcher

**Performance Native**

- Binaires 10x plus légers qu'Electron (~10MB vs ~100MB)
- Démarrage instantané (<1 seconde vs 3-5 secondes)
- Consommation mémoire réduite (~50MB vs 200-500MB)
- CPU usage minimal au repos

**Sécurité Renforcée**

- Sandboxing avancé entre frontend et backend
- Permissions granulaires pour accès système
- Code Rust memory-safe pour le backend
- APIs sécurisées par défaut

**Intégration OS Native**

- Notifications système authentiques
- Dialogs natifs (file picker, UAC)
- System tray integration
- Auto-updater intégré
- Deep linking support

**Écosystème Moderne**

- Plugin system extensible
- TypeScript support complet
- Hot reload en développement
- Build cross-platform automatisé

### Stratégies de Téléchargement et Mise à Jour

**Approche Hybride Recommandée**

Le launcher implémente une stratégie de téléchargement adaptative selon la taille et le type de contenu :

**Phase 1 : ZIP Complets (MVP)**

- Téléchargement direct depuis GitHub Releases
- Archives ZIP complètes par version
- Simplicité d'implémentation et robustesse maximale
- Optimal pour jeux <2GB et mises à jour peu fréquentes

**Phase 2 : Patches Différentiels (Optimisation)**

- Calcul de deltas pour gros jeux (>2GB)
- Compression des patches avec Zstd/LZ4
- Fallback automatique vers ZIP complet si nécessaire
- Économie de bande passante jusqu'à 90%

**Phase 3 : Synchronisation Partielle Type Rsync (Avancé)**

- Calcul de deltas à la volée côté serveur
- Synchronisation bloc par bloc des fichiers modifiés
- Compression adaptive selon le contenu
- Optimal pour jeux en live service avec updates fréquentes

**Comparaison des Méthodes**

| Critère                       | ZIP Complet         | Patch Différentiel     | Rsync-like              |
| ----------------------------- | ------------------- | ---------------------- | ----------------------- |
| **Volume téléchargement**     | Élevé (100% du jeu) | Moyen (10-30% typique) | Minimal (1-5% optimisé) |
| **Complexité implémentation** | Faible ⭐           | Moyenne ⭐⭐           | Élevée ⭐⭐⭐           |
| **Robustesse**                | Excellente          | Bonne                  | Bonne avec fallback     |
| **Bande passante**            | Importante          | Optimisée              | Minimale                |
| **Cas d'usage**               | Jeux <2GB, MVP      | Jeux moyens/gros       | Live service, MMO       |

**Spécifications Techniques de Téléchargement**

**ZIP Complets (Phase 1)**

```typescript
interface FullDownload {
  method: 'complete'
  source: string // GitHub Release URL
  checksum: string // SHA-256
  size: number
  compression: 'zip'
  chunks: ChunkInfo[] // Pour download resumable
}
```

**Patches Différentiels (Phase 2)**

```typescript
interface DifferentialDownload {
  method: 'differential'
  baseVersion: string
  targetVersion: string
  patches: PatchInfo[]
  totalDeltaSize: number
  compressionRatio: number
}

interface PatchInfo {
  file: string
  operation: 'add' | 'modify' | 'delete'
  deltaSize: number
  algorithm: 'bsdiff' | 'xdelta3'
  checksum: string
}
```

**Synchronisation Rsync-like (Phase 3)**

```typescript
interface RsyncDownload {
  method: 'rsync'
  blockSize: number // 4KB par défaut
  algorithm: 'rolling_hash'
  blocks: BlockDelta[]
  compressionLevel: number
}

interface BlockDelta {
  fileOffset: number
  localHash?: string // Hash du bloc local
  deltaData?: Uint8Array // Données différentielles
  operation: 'keep' | 'replace' | 'insert'
}
```

**Algorithme de Sélection Automatique**

```typescript
function selectDownloadStrategy(
  gameSize: number,
  lastUpdate: Date,
  updateFrequency: number,
): DownloadMethod {
  // Jeux petits ou première installation -> ZIP complet
  if (gameSize < 2_000_000_000 || !hasLocalVersion()) {
    return 'complete'
  }

  // Jeux moyens avec updates occasionnelles -> Patches
  if (gameSize < 10_000_000_000 && updateFrequency < 1 / week) {
    return 'differential'
  }

  // Gros jeux ou updates fréquentes -> Rsync
  return 'rsync'
}
```

**Optimisations de Performance**

- **Compression Adaptative** : Zstd pour patches, LZ4 pour vitesse
- **Parallel Downloads** : 4 chunks simultanés maximum
- **Bandwidth Throttling** : Limite configurable par l'utilisateur
- **Resume Support** : HTTP Range requests pour tous les types
- **Error Recovery** : Retry automatique avec backoff exponentiel
- **Cache Validation** : Verification checksums avant application

**Métriques et Monitoring**

- Ratio compression/décompression par méthode
- Vitesse de téléchargement moyenne par région
- Taux d'échec et recovery time
- Économies de bande passante vs ZIP complet
- Satisfaction utilisateur (temps d'attente)

### Système de Pré-téléchargement (Phase 4)

**Concept et Objectifs**

Le système de pré-téléchargement permet aux joueurs de télécharger les grosses mises à jour (>1GB) plusieurs jours avant leur sortie officielle, éliminant ainsi complètement le temps d'attente lors du lancement de la nouvelle version.

**Spécifications Techniques du Pré-téléchargement**

```typescript
interface PreDownloadManifest {
  updateId: string
  gameId: string
  releaseDate: Date // Date de sortie officielle
  predownloadStart: Date // Début du pré-téléchargement
  estimatedSize: number
  priority: 'low' | 'normal' | 'high'
  autoStart: boolean // Démarrage automatique configuré par l'utilisateur
  encryptionKey?: string // Chiffrement optionnel jusqu'à release
}

interface PreDownloadSettings {
  enabled: boolean
  autoStartThreshold: number // Taille minimum pour auto-start (en MB)
  maxConcurrentPreloads: number // Limite simultanée
  scheduleWindow: {
    startHour: number // 2h du matin par défaut
    endHour: number // 6h du matin par défaut
  }
  wifiOnly: boolean // Pré-téléchargement uniquement sur WiFi
}
```

**Mécanisme de Déclenchement Automatique**

Le système surveille les manifests et détecte automatiquement les grosses mises à jour annoncées. Lorsqu'une mise à jour dépasse le seuil configuré (1GB par défaut), le launcher propose automatiquement le pré-téléchargement à l'utilisateur avec une estimation du temps nécessaire et de l'espace disque requis.

**Planification Intelligente**

Le pré-téléchargement utilise une planification intelligente qui respecte les préférences utilisateur. Par défaut, les téléchargements se lancent pendant les heures creuses (2h-6h du matin) pour éviter d'impacter les sessions de jeu. Le système adapte automatiquement la vitesse selon l'activité détectée de l'utilisateur.

**Sécurité et Intégrité**

Les fichiers pré-téléchargés peuvent être chiffrés jusqu'à la date de sortie officielle pour éviter les leaks prématurés. Le système vérifie continuellement l'intégrité des fichiers téléchargés et peut re-télécharger les portions corrompues automatiquement.

**Interface Utilisateur du Pré-téléchargement**

L'interface affiche clairement l'état des pré-téléchargements avec une barre de progression dédiée, la date de disponibilité, et l'espace disque nécessaire. Les utilisateurs peuvent mettre en pause, reprendre, ou annuler les pré-téléchargements selon leurs besoins.

**Activation Automatique le Jour J**

Le jour de la sortie officielle, le launcher active automatiquement la nouvelle version en appliquant les derniers patches de finalisation (généralement <100MB) et en déchiffrant les fichiers si nécessaire. Cette opération prend typiquement moins de 2 minutes, créant une expérience quasi-instantanée pour le joueur.

**Data Layer**

- SQLite local pour métadonnées des jeux installés (`C:\Program Files\HuzStudio\config\games.db`)
- Manifests JSON fetched from Huz Studio API (cache dans `C:\Program Files\HuzStudio\cache\`)
- Configuration utilisateur en JSON local (`C:\Program Files\HuzStudio\config\settings.json`)
- Structure de fichiers organisée par jeu avec séparation install/saves/logs/config

### Architecture de Fichiers et Stockage

**Structure de Dossiers HuzStudio/ (Approche Program Files)**

```
C:\Program Files\HuzStudio\     ← Installation principale (droits admin)
├─ games/                       ← Jeux gérés par le launcher
│   ├─ JeuA/                    ← Dossier d'un jeu spécifique
│   │   ├─ install/             ← Fichiers d'installation (binaires, assets)
│   │   ├─ saves/               ← Sauvegardes utilisateur
│   │   ├─ logs/                ← Logs spécifiques au jeu
│   │   └─ config/              ← Configuration et paramètres du jeu
│   └─ JeuB/                    ← Autres jeux (structure identique)
├─ config/                      ← Configuration du launcher
│   ├─ settings.json            ← Paramètres utilisateur globaux
│   ├─ games.db                ← Base SQLite des jeux installés
│   └─ cache_config.json       ← Configuration du cache
├─ cache/                       ← Cache temporaire du launcher
│   ├─ manifests/              ← Manifests JSON mis en cache
│   ├─ downloads/              ← Téléchargements en cours
│   ├─ images/                 ← Cache des images (banners, screenshots)
│   └─ temp/                   ← Fichiers temporaires
├─ logs/                        ← Journaux du launcher
│   ├─ launcher.log            ← Log principal du launcher
│   ├─ downloads.log           ← Log des téléchargements
│   └─ errors.log              ← Log des erreurs critiques
├─ launcher.exe                 ← Exécutable principal
├─ uninstall.exe               ← Désinstalleur
└─ updater.exe                 ← Utilitaire de mise à jour (droits admin)
```

**Gestion des Permissions Windows :**

- **Installation** : Droits administrateur requis pour `C:\Program Files\HuzStudio\`
- **Fonctionnement** : Launcher s'exécute en mode utilisateur standard
- **Mises à jour** : `updater.exe` avec élévation UAC quand nécessaire
- **Saves utilisateur** : ACL configurées pour accès lecture/écriture utilisateur

**Avantages de cette Structure :**

- **Standard Gaming** : Cohérence avec Steam, Epic, Battle.net, HoYoPlay
- **Sécurité renforcée** : Binaires protégés dans Program Files
- **Centralisation** : Une seule installation pour tous les utilisateurs
- **Isolation par jeu** : Structure claire et maintenable
- **Intégration Windows** : Respect des conventions Microsoft
- **Désinstallation propre** : Via Programs & Features + désinstalleur custom

**Gestion Cross-Platform :**

- Windows : `C:\Program Files\HuzStudio\` (installation admin, ACL pour utilisateurs)
- macOS : `/Applications/HuzStudio.app/Contents/` (bundle structure, keychain integration)
- Linux : `/opt/huzstudio/` (package manager integration, desktop files)

```typescript
// Manifests récupérés depuis l'API
interface LauncherManifest {
  version: string
  releaseDate: string
  downloadUrl: string
  checksum: string
  releaseNotes: string
  size: number
  platform: 'windows' | 'macos' | 'linux'
}

interface GameManifest {
  id: string
  title: string
  version: string
  releaseDate: string
  downloadUrl: string
  checksum: string
  description: string
  size: number
  images: {
    banner: string
    thumbnail: string
    screenshots: string[]
  }
  systemRequirements: {
    minimum: SystemSpecs
    recommended: SystemSpecs
  }
}

// État local dans SQLite
interface LocalGame {
  id: string
  manifestVersion: string // Version du manifest utilisé
  installPath: string
  installedVersion: string
  status: 'available' | 'installing' | 'installed' | 'updating' | 'needs_update'
  lastPlayed?: Date
  playTime: number // en minutes
  installDate: Date
  lastUpdateCheck: Date
}

interface Download {
  id: string
  type: 'game' | 'launcher_update'
  manifestData: GameManifest | LauncherManifest
  progress: number
  speed: number
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  estimatedTime: number
  startedAt: Date
}

interface UserSettings {
  downloadPath: string
  maxConcurrentDownloads: number
  bandwidthLimit?: number
  autoUpdate: boolean
  notifications: boolean
  updateCheckInterval: number // en minutes
  manifestApiUrl: string
}

// API Response pour manifests
interface ManifestApiResponse<T> {
  data: T
  cached: boolean
  timestamp: string
  ttl?: number
}
```

### Architecture Distribuée Manifests

**Stratégie Update-First**

- Vérification périodique des manifests
- Comparaison des versions pour détection des mises à jour
- Téléchargement différentiel quand possible
- Validation checksum SHA-256 obligatoire

**Gestion du Cache Manifests**

- Cache local des manifests avec TTL (1 heure par défaut)
- Invalidation manuelle possible via UI
- Fallback en cas d'indisponibilité API
- Compression gzip pour optimiser la bande passante

**Version Management**

- Semantic versioning (semver) pour comparaisons
- Support des pre-releases et beta versions
- Rollback possible vers version précédente
- Historique des versions installées

### APIs and Integrations

- **Tauri 2.0 APIs :** File system, notifications, auto-updater, window management, process spawning, shell operations
- **Tauri 2.0 Plugins :** SQL plugin, HTTP client, deep linking, system dialogs
- **Huz Studio Manifest API :** Microservice Express.js pour manifests JSON (launcher + game versions)
- **GitHub Releases Integration :** Récupération automatique des versions via manifests
- **CDN Integration :** Distribution des fichiers de jeu via GitHub Releases
- **Analytics API :** Télémétrie anonyme pour amélioration continue (optionnel)

### Infrastructure Requirements

**Development**

- Node.js 18+ pour le build frontend
- Rust 1.70+ pour le backend Tauri 2.0
- Tauri CLI 2.0 pour builds et développement
- Git LFS pour assets volumineux

**Production**

- Huz Studio Manifest API déployé sur Railway avec auto-deploy
- GitHub Releases comme CDN pour distribution des fichiers
- Webhooks GitHub pour invalidation automatique du cache
- Validation HMAC-SHA256 pour sécurité des webhooks
- Système de signature de code pour la sécurité
- Infrastructure CI/CD pour builds automatisés multi-platform
- Monitoring Railway et logs Winston structurés

## Development Roadmap

### Phase 1 : MVP Core (Foundation)

**Scope :** Fonctionnalités essentielles pour un launcher fonctionnel

- Interface de base avec liste des jeux
- Intégration Huz Studio Manifest API
- Système d'installation/désinstallation simple
- Gestionnaire de téléchargements basique
- Configuration utilisateur de base
- Cache local SQLite pour jeux installés
- Système de vérification et mise à jour via manifests
- Validation checksum et intégrité des téléchargements

**Critères de succès :** Capacité à installer et lancer au moins un jeu avec vérification automatique des mises à jour

### Phase 2 : Enhanced UX (Polish)

**Scope :** Amélioration de l'expérience utilisateur et optimisations de téléchargement

- Animations et transitions fluides
- Polish et raffinement de l'identité visuelle sombre
- **Patches différentiels** pour jeux >2GB avec économies de bande passante
- Gestionnaire de téléchargements avancé (pause/resume/priorité)
- Notifications système intégrées
- Optimisations de performance et cache intelligent

**Critères de succès :** Interface comparable aux standards industriels + réduction 60% du volume de téléchargement

### Phase 3 : Social Features (Engagement)

**Scope :** Fonctionnalités communautaires et sociales

- Feed d'actualités intégré
- Système d'événements et promotions
- Intégration Discord/réseaux sociaux
- Système de favoris et collections
- Partage et recommandations

**Critères de succès :** Augmentation de 40% du temps passé dans le launcher

### Phase 4 : Advanced Features (Innovation)

**Scope :** Fonctionnalités avancées et différenciation

- **Synchronisation rsync-like** pour optimisation maximale de bande passante
- **Système de pré-téléchargement** pour grosses mises à jour (>1GB) avec planification automatique
- Analytics avancées et télémétrie anonyme
- Système de recommandations basé sur les patterns d'usage
- Optimisations automatiques de performance
- Diagnostic système intégré pour support technique
- Metrics de santé des jeux et crash reporting
- Pre-loading intelligent des updates en arrière-plan

**Critères de succès :** Données exploitables pour amélioration continue + économies de bande passante >90% vs méthodes traditionnelles + expérience "zero-downtime" pour les mises à jour majeures

## Logical Dependency Chain

### Foundation (Ordre de développement critique)

1. **Setup Infrastructure** → Tauri 2.0 + React + TypeScript base avec plugins essentiels
2. **Windows Integration & Permissions** → Gestion UAC, droits admin, Program Files access via Tauri 2.0
3. **File System Architecture** → Création structure `C:\Program Files\HuzStudio\` avec ACL appropriées
4. **Manifest API Client** → Client HTTP pour Huz Studio Manifest API via Tauri HTTP plugin
5. **Core Data Models** → Structures pour manifests et jeux locaux
6. **SQLite Local Storage** → Base games.db via Tauri SQL plugin avec schéma optimisé
7. **Cache Management System** → Gestion intelligente cache\ avec TTL et LRU
8. **Basic UI Components** → Layout principal et composants de base
9. **File System Integration** → Lecture/écriture via Tauri 2.0 FS API avec respect permissions
10. **Version Comparison Logic** → Détection mises à jour via manifests
11. **Basic Game Management** → Installation dans games\{id}\ avec gestion permissions

### Incremental Build-Up (Chaque étape utilise la précédente)

8. **Download Manager (Phase 1)** → S'appuie sur File System + Game Management, ZIP complets
9. **UI Polish & Animations** → Améliore Basic UI Components
10. **Settings System** → Utilise File System + UI Components
11. **Notifications** → Intègre Download Manager + Settings
12. **Auto-Updater** → Combine File System + Notifications
13. **Differential Downloads (Phase 2)** → Étend Download Manager avec patches
14. **Advanced Cache Management** → Optimise File System + Downloads

### Advanced Features (Construites sur base solide)

11. **News Feed** → Utilise UI Components + Notifications
12. **Social Integration** → S'appuie sur Settings + News Feed
13. **Advanced Download Features** → Étend Download Manager
14. **Visual Polish & Consistency** → Améliore UI Components existants

## Risks and Mitigations

### Technical Challenges

**Risque :** Performance des téléchargements sur connexions lentes
**Mitigation :** Implémentation de compression adaptative et téléchargements par chunks

**Risque :** Compatibilité cross-platform (Windows/macOS/Linux)
**Mitigation :** Tests automatisés sur tous les OS, utilisation des APIs Tauri 2.0 standardisées, plugins officiels

**Risque :** Sécurité et vérification d'intégrité des fichiers
**Mitigation :** Checksums SHA-256 obligatoires, validation signature des releases GitHub

**Risque :** Indisponibilité du serveur de manifests
**Mitigation :** Cache local robuste, mode dégradé avec derniers manifests connus, retry avec backoff

**Risque :** Corruption ou manipulation des manifests
**Mitigation :** Validation schema JSON, vérification cohérence des URLs, checksums obligatoires

**Risque :** GitHub API rate limiting
**Mitigation :** Cache intelligent côté serveur, token d'authentification GitHub, fallback gracieux

**Risque :** Gestion complexe de la structure de fichiers multi-jeux
**Mitigation :** Validation stricte des chemins, atomic operations pour installations, rollback automatique en cas d'échec

**Risque :** Corruption de données lors d'arrêt brutal pendant installation
**Mitigation :** Transactions filesystem, états intermédiaires trackés, recovery automatique au démarrage

**Risque :** Espace disque insuffisant pendant installation
**Mitigation :** Vérification espace disponible avant téléchargement, nettoyage cache automatique, alertes utilisateur

**Risque :** Gestion complexe des permissions Windows (UAC, Program Files)
**Mitigation :** Installation avec droits admin, runtime en mode utilisateur, élévation UAC uniquement si nécessaire

**Risque :** Conflit avec antivirus sur écriture dans Program Files
**Mitigation :** Signature de code, whitelist antivirus, communication claire des opérations fichiers

**Risque :** Échec des mises à jour auto sans droits admin
**Mitigation :** updater.exe séparé avec élévation UAC, fallback vers mise à jour manuelle, notification utilisateur

**Risque :** Courbe d'apprentissage Tauri 2.0 et écosystème moins mature qu'Electron
**Mitigation :** Formation équipe sur Rust/Tauri, utilisation plugins officiels, communauté active et documentation complète

**Risque :** Debug et profiling plus complexe avec stack Rust + JS
**Mitigation :** Outils de debug Tauri intégrés, logging structuré, télémétrie pour monitoring production

**Risque :** Complexité des patches différentiels et corruption de données
**Mitigation :** Validation checksums à chaque étape, fallback automatique vers ZIP complet, tests exhaustifs

**Risque :** Performance dégradée du calcul de deltas sur machines anciennes
**Mitigation :** Seuils adaptatifs selon performance CPU, calculs en background threads, fallback ZIP

**Risque :** Multiplication des versions de patches à maintenir côté serveur
**Mitigation :** Politique de rétention des patches (dernières 5 versions), patches cumulatifs, nettoyage automatique

### MVP Definition et Scope

**Risque :** Feature creep pendant le développement du MVP
**Mitigation :** PRD strict avec critères de succès mesurables, reviews hebdomadaires

**Risque :** MVP trop complexe pour timeline initiale
**Mitigation :** Découpage en micro-features avec validation progressive

**Risque :** Interface trop basique pour l'adoption utilisateur
**Mitigation :** Focus sur 2-3 interactions clés parfaitement polies plutôt que toutes les features

### Resource Constraints

**Risque :** Équipe limitée pour développement cross-platform
**Mitigation :** Priorisation Windows en premier, puis macOS/Linux en phases ultérieures

**Risque :** Coûts d'infrastructure (CDN, serveurs)
**Mitigation :** Démarrage avec un petit catalogue, expansion progressive

**Risque :** Maintenance et support post-lancement
**Mitigation :** Système de télémétrie pour identifier les problèmes critiques rapidement

## Appendix

### Research Findings

**Analyse Concurrentielle :**

- Epic Games Store : Interface moderne mais performance perfectible
- Steam : Feature-rich mais interface datée
- Battle.net : Excellent mais limité à l'écosystème Blizzard
- HoYoverse Launcher : UI excellente, inspirant pour notre direction

**User Research :**

- 78% des utilisateurs privilégient la rapidité de lancement
- 65% veulent une interface moderne et personnalisable
- 52% utilisent plusieurs launchers simultanément

### Technical Specifications

**Performance Targets :**

- Démarrage < 1 seconde avec Tauri 2.0 (vs 3+ secondes Electron)
- Interface fluide 60fps minimum à 1280x720
- Utilisation mémoire < 50MB au repos (optimisation Rust)
- Téléchargements à 90% de la bande passante disponible
- Récupération manifests < 1 seconde
- Vérification mises à jour < 3 secondes

**Tauri 2.0 Specific Optimizations :**

- Bundle size : <15MB pour l'installeur complet
- Memory footprint : <50MB RAM au repos
- Cold start : <500ms sur SSD moderne
- Plugin system : Chargement à la demande des fonctionnalités
- Build time : Optimisation Rust release mode pour performance maximale

**Manifest API Integration Specifications :**

- Endpoints : `/api/v1/manifests/launcher` et `/api/v1/manifests/game`
- Timeout requêtes : 5 secondes maximum
- Retry automatique : 3 tentatives avec backoff exponentiel
- Cache local TTL : 1 heure pour manifests, validation checksum systématique
- Compression : gzip automatique pour toutes les requêtes
- Fallback : utilisation des derniers manifests valides en cas d'échec

**File System Management Specifications :**

- Installation principale : `C:\Program Files\HuzStudio\` avec droits administrateur
- Fonctionnement quotidien : Mode utilisateur standard pour le launcher
- Gestion des permissions : ACL configurées pour accès utilisateur aux saves/config
- Élévation UAC : Uniquement pour mises à jour via `updater.exe`
- Isolation par jeu : Chaque jeu dans `games\{gameId}\` avec sous-dossiers dédiés
- Désinstallation : Via Programmes et fonctionnalités + nettoyage custom
- Cross-platform : Adaptation automatique selon les conventions OS

**Security & Permissions Specifications :**

- Installation : Droits admin requis, signature de code obligatoire
- Runtime : Launcher en mode utilisateur, élévation uniquement si nécessaire
- UAC Integration : Prompts UAC pour opérations sensibles (updates, désinstallation)
- File Permissions : Lecture pour tous, écriture utilisateur pour saves/logs/config
- Registry Integration : Entrées Windows pour désinstallation et associations de fichiers
- Digital Signature : Code signing certificate pour tous les exécutables

**Cache Management Specifications :**

- Manifests cache : TTL 1 heure, stockés dans `cache\manifests\`
- Images cache : TTL 24 heures, stockés dans `cache\images\`
- Downloads temporaires : `cache\downloads\` avec nettoyage auto
- Politique LRU : Éviction des fichiers les moins récemment utilisés
- Limite de taille : 2GB maximum par défaut (configurable)
- Compression : Images WebP pour optimiser l'espace
- Maintenance : Nettoyage automatique au démarrage si > limite

**Download Strategy Specifications :**

- Phase 1 MVP : ZIP complets uniquement, simple et robuste
- Phase 2 : Patches différentiels pour jeux >2GB, seuil configurable
- Phase 3 : Rsync-like pour optimisation maximale (<5% de la taille totale)
- Fallback automatique : ZIP complet si patches échouent ou corrompus
- Sélection adaptative : Algorithme automatique selon taille jeu et fréquence updates
- Compression : Zstd pour patches (ratio optimal), LZ4 pour vitesse
- Parallélisation : 4 chunks simultanés, configurable selon bande passante
- Resume support : HTTP Range requests, reprise après interruption
- Validation : SHA-256 checksums à chaque étape, intégrité garantie

**Version Management Specifications :**

- Format versioning : Semantic Versioning (semver)
- Vérification : Comparaison automatique toutes les heures
- Validation : Checksum SHA-256 obligatoire pour tous les téléchargements
- Rollback : Possibilité de revenir à la version précédente
- Update strategy : Téléchargement en arrière-plan, installation au redémarrage
- Backup avant update : Sauvegarde de `games/{id}/install/` avant mise à jour

**UI Specifications :**

- Résolution fixe : 1280x720 (HD)
- Fenêtre non-redimensionnable pour expérience consistante
- Optimisation pour ratio 16:9
- Support multi-écrans avec positionnement centré

**Security Requirements :**

- Signature de code obligatoire pour tous les binaires
- Chiffrement AES-256 pour données sensibles
- Validation d'intégrité SHA-256 pour tous les téléchargements
- Principe de moindre privilège pour accès système

**Accessibility Standards :**

- Conformité WCAG 2.1 Level AA
- Support des lecteurs d'écran
- Navigation clavier complète
- Contrastes minimum 4.5:1
