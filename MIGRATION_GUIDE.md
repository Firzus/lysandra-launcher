# Guide de Migration - Structure HuzStudio Unifiée

## Aperçu des Changements

Cette mise à jour restructure complètement HuzStudio pour que toutes les données de l'application soient dans un seul répertoire de façon cross-plateforme.

### Ancienne Structure

```
Windows: %LOCALAPPDATA%/Huz Studio Launcher/
macOS: ~/Library/Application Support/Huz Studio Launcher/
Linux: ~/.local/share/Huz Studio Launcher/
```

### Nouvelle Structure Unifiée

```
Windows: C:/Program Files/HuzStudio/
macOS: /Applications/HuzStudio/
Linux: /opt/HuzStudio/ (ou ~/HuzStudio/ selon les permissions)
```

## Structure de Répertoires

```
HuzStudio/                 ← Dossier racine du launcher
├── games/                 ← Regroupe les données des jeux gérés
│   ├── JeuA/             ← Dossier du jeu « JeuA »
│   │   ├── install/      ← Fichiers d'installation du jeu
│   │   ├── saves/        ← Sauvegardes utilisateur du jeu
│   │   ├── logs/         ← Journaux propres au jeu
│   │   └── config/       ← Configurations du jeu
│   └── JeuB/             ← Dossier d'un autre jeu
│       └── ...
├── config/               ← Configuration du launcher
├── cache/                ← Fichiers cache du launcher
├── logs/                 ← Journaux du launcher
├── HuzStudio.exe         ← Exécutable du launcher (Windows)
└── uninstall.exe         ← Exécutable du désinstaller (Windows)
```

## Changements de Code

### Backend (Rust)

#### Nouveau Module PathManager

```rust
use crate::path_manager::PathManager;

// Obtenir le répertoire racine
let root = PathManager::get_huzstudio_root()?;

// Obtenir les répertoires spécifiques
let games_dir = PathManager::get_games_dir()?;
let config_dir = PathManager::get_config_dir()?;

// Initialiser la structure pour un jeu
PathManager::initialize_game_structure("mon_jeu")?;
```

#### Nouvelles Commandes Tauri

- `get_huzstudio_root_path()` - Obtient le répertoire racine
- `get_games_directory()` - Obtient le répertoire des jeux
- `get_config_directory()` - Obtient le répertoire de configuration
- `get_cache_directory()` - Obtient le répertoire de cache
- `get_logs_directory()` - Obtient le répertoire des logs
- `get_game_directory(game_id)` - Obtient le répertoire d'un jeu
- `get_game_install_directory(game_id)` - Obtient le répertoire d'installation d'un jeu
- `initialize_game_directories(game_id)` - Initialise la structure pour un jeu
- `verify_huzstudio_structure()` - Vérifie la structure

### Frontend (TypeScript)

#### Utilisation du PathManager

```typescript
import PathManager from './utils/pathManager'

// Obtenir les informations sur la structure
const structureInfo = await PathManager.getStructureInfo()
console.log('HuzStudio root:', structureInfo.root)

// Initialiser un jeu
await PathManager.initializeGameDirectories('mon_jeu')
const gameStructure = await PathManager.getGameStructure('mon_jeu')
```

#### Hook React

```tsx
import { usePathManager } from './utils/pathManager'

function MyComponent() {
  const { structureInfo, loading, error, initializeGame } = usePathManager()

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div>
      <p>HuzStudio installé dans: {structureInfo.root}</p>
      <button onClick={() => initializeGame('nouveau_jeu')}>Initialiser un nouveau jeu</button>
    </div>
  )
}
```

## Installation et Désinstallation

### Windows (NSIS)

- **Installation** : L'installateur crée automatiquement la structure dans `C:/Program Files/HuzStudio/`
- **Mode d'installation** : `perMachine` (nécessite les droits administrateur)
- **Désinstallation** : Option de conserver ou supprimer les données des jeux

### macOS (DMG)

- **Installation** : Glisser-déposer dans `/Applications/HuzStudio/`
- **Désinstallation** : Suppression manuelle avec option de conservation des données

### Linux (AppImage)

- **Installation** : Auto-conteneu avec données dans `/opt/HuzStudio/` ou `~/HuzStudio/`
- **Permissions** : Tente `/opt/HuzStudio/` puis fallback vers `~/HuzStudio/`

## Migration des Données Existantes

### Script de Migration (à implémenter)

```typescript
async function migrateExistingData() {
  // 1. Détecter l'ancienne installation
  const oldPath = await getOldInstallationPath()

  // 2. Créer la nouvelle structure
  await PathManager.initializeStructure()

  // 3. Migrer les données
  if (await checkDirectoryExists(oldPath)) {
    const newRoot = await PathManager.getHuzStudioRoot()
    await copyDirectory(oldPath, newRoot)
  }

  // 4. Nettoyer l'ancien répertoire (optionnel)
  // await deleteDirectory(oldPath);
}
```

## Commandes de Build

### Build Standard

```bash
npm run tauri build
```

### Build Cross-Plateforme (expérimental)

```bash
# Pour Windows depuis Linux/macOS
npm run tauri build -- --runner cargo-xwin --target x86_64-pc-windows-msvc
```

## Configuration NSIS Personnalisée

Le fichier `src-tauri/windows/hooks.nsi` contient les hooks personnalisés pour :

- Création de la structure de répertoires
- Gestion des raccourcis
- Options de désinstallation
- Conservation des données utilisateur

## Avantages de la Nouvelle Structure

1. **Unification** : Même structure sur tous les OS
2. **Simplicité** : Un seul répertoire à gérer
3. **Portabilité** : Facile à sauvegarder/restaurer
4. **Organisation** : Structure claire et logique
5. **Maintenance** : Plus facile à maintenir et déboguer

## Notes Importantes

- Les anciennes installations continueront de fonctionner
- La migration doit être gérée dans le code de l'application
- Les droits administrateur sont nécessaires sur Windows pour l'installation
- Sur Linux, fallback automatique vers le répertoire utilisateur si `/opt/` n'est pas accessible

## Commandes Utiles

```bash
# Vérifier la structure
cargo tauri dev

# Build avec la nouvelle configuration
cargo tauri build

# Tester l'installation NSIS
# (Le fichier .exe sera dans target/release/bundle/nsis/)
```
