# Refactorisation de la Structure des Dossiers

## Problème résolu

Le dossier `config` n'était pas créé systématiquement lors de l'installation d'un jeu, causant des problèmes dans l'architecture des dossiers attendue :

```
com.lysandra.dev/games/lysandra-vslice/
├── install/     ✅ Créé
├── saves/       ✅ Créé
├── logs/        ✅ Créé
└── config/      ❌ Manquant
```

## Solution implémentée

### 1. Nouveau gestionnaire centralisé (`game-directory-manager.ts`)

**Fonctions principales :**

- `checkGameDirectoryStructure()` - Vérifie la structure complète
- `initializeGameDirectoryStructure()` - Initialise avec vérifications
- `repairGameDirectoryStructure()` - Répare les problèmes détectés

**Avantages :**

- Vérifications robustes avec retry
- Logging détaillé pour le debugging
- Gestion d'erreurs granulaire
- Retour d'informations structuré

### 2. Amélioration de `ensureGameDirectories()` (`paths.ts`)

**Avant :**

```typescript
// Création simple sans vérification
await invoke('create_dir_all', { path: paths.config })
```

**Après :**

```typescript
// Création avec logging et gestion d'erreurs
for (const dir of directories) {
  try {
    await invoke('create_dir_all', { path: dir.path })
    console.log(`✅ Created ${dir.name} directory: ${dir.path}`)
  } catch (error) {
    console.error(`❌ Failed to create ${dir.name} directory: ${dir.path}`, error)
    throw new Error(`Failed to create ${dir.name} directory: ${error}`)
  }
}
```

### 3. Refactorisation du processus d'installation (`game-installer.ts`)

**Nouvelles étapes :**

1. **Initialisation précoce** - Structure créée AVANT le téléchargement
2. **Vérifications multiples** - Contrôles à chaque étape critique
3. **Réparation automatique** - Correction des problèmes détectés
4. **Validation finale** - Vérification complète post-installation

**Flux amélioré :**

```
0. Initialiser structure des dossiers ← NOUVEAU
1. Récupérer manifeste
2. Télécharger archive
3. Vérifier intégrité
4. Extraire fichiers
5. Sauvegarder version
6. Vérifier structure finale ← NOUVEAU
7. Nettoyer fichiers temporaires
```

### 4. Traductions ajoutées

Nouvelle clé dans tous les fichiers de langue :

- `game.install.initializing_structure`

**Exemples :**

- 🇫🇷 "Initialisation de la structure des dossiers..."
- 🇬🇧 "Initializing directory structure..."
- 🇩🇪 "Ordner-Struktur initialisieren..."
- 🇪🇸 "Inicializando estructura de directorios..."

## Structure finale garantie

Après installation, la structure suivante est garantie :

```
%LOCALAPPDATA%/com.lysandra.dev/
├── games/
│   └── lysandra-vslice/
│       ├── install/          ← Fichiers du jeu
│       ├── saves/            ← Sauvegardes utilisateur
│       ├── logs/             ← Logs du jeu
│       ├── config/           ← Configuration utilisateur
│       │   └── version.txt   ← Version installée
│       └── ...
├── config/                   ← Configuration launcher
├── cache/                    ← Fichiers temporaires
└── logs/                     ← Logs launcher
```

## Tests et validation

### Script de test inclus

```typescript
import { testDirectoryStructure } from './utils/test-directory-structure'

// Dans la console du navigateur :
await testDirectoryStructure()
```

### Commandes de test

```bash
# Compilation et vérification
npm run build

# Test en développement
npm run dev
```

## Avantages de la refactorisation

1. **Robustesse** - Gestion d'erreurs complète
2. **Debugging** - Logs détaillés à chaque étape
3. **Maintenance** - Code centralisé et réutilisable
4. **Fiabilité** - Vérifications multiples et réparation automatique
5. **Extensibilité** - Facile d'ajouter de nouveaux dossiers/fichiers

## Compatibilité

- ✅ Rétrocompatible avec les installations existantes
- ✅ Répare automatiquement les structures incomplètes
- ✅ Maintient les fonctions existantes pour la compatibilité
- ✅ Aucun impact sur les sauvegardes utilisateur
