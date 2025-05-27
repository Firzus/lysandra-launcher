# Huz Studio Launcher

Un launcher de jeu moderne multiplateforme construit avec Tauri 2.0, Vite, React et HeroUI.

## Description

Huz Studio Launcher est une application de bureau moderne qui permet de gérer l'installation, les mises à jour et le lancement des jeux Huz Studio. L'application offre une interface utilisateur moderne et intuitive avec support multilingue.

## À propos

Huz Studio Launcher est une application de bureau qui permet de gérer l'installation, les mises à jour et le lancement du jeu Huz Studio. L'application offre une interface utilisateur moderne et intuitive avec support multilingue.

## Technologies utilisées

### Frontend

- [Vite](https://vitejs.dev/) - Outil de build moderne et rapide
- [React 18](https://react.dev/) - Bibliothèque JavaScript pour les interfaces utilisateur
- [HeroUI v2](https://heroui.com) - Composants UI modernes basés sur React
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS utilitaire
- [TypeScript](https://www.typescriptlang.org) - JavaScript typé
- [React i18next](https://react.i18next.com/) - Internationalisation pour React

### Framework d'application de bureau

- [Tauri 2.0](https://tauri.app/) - Framework pour créer des applications de bureau sécurisées et légères
  - Binaires plus petits comparé à Electron
  - Dialogues et notifications natifs du système
  - Support du system tray
  - Mises à jour automatiques
  - Intégration native avec l'OS

### Backend

- [Rust](https://www.rust-lang.org/) - Langage de programmation système rapide et efficace en mémoire
  - Alimente les fonctionnalités principales de Tauri
  - Fournit des performances natives pour les opérations critiques

## Fonctionnalités

- **Interface moderne** : Interface utilisateur moderne avec thème sombre
- **Multilingue** : Support pour Français, Anglais, Espagnol et Allemand
- **Gestion des installations** : Installation, mise à jour et désinstallation du jeu
- **Notifications** : Notifications système pour les événements importants
- **Démarrage automatique** : Option pour démarrer avec le système
- **Mises à jour automatiques** : Mise à jour automatique du launcher
- **Contrôles de fenêtre personnalisés** : Interface sans décoration avec contrôles intégrés

## Comment utiliser

Pour cloner le projet, exécutez la commande suivante :

```bash
git clone https://github.com/Firzus/huz-studio-launcher.git
cd huz-studio-launcher
```

### Installer les dépendances

Vous pouvez utiliser `npm` :

```bash
npm install
```

### Commandes Tauri

```bash
# Développement avec rechargement automatique
npm run dev

# Compilation pour la production
npm run build

# Compiler pour une plateforme spécifique
npm run build -- --target universal-apple-darwin  # macOS Universal
npm run build -- --target x86_64-pc-windows-msvc  # Windows x64
npm run build -- --target x86_64-unknown-linux-gnu  # Linux x64
```

## Structure du projet

```
huz-studio-launcher/
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── hooks/         # Hooks React personnalisés
│   ├── locales/       # Fichiers de traduction (fr, en, es, de)
│   ├── pages/         # Pages de l'application
│   ├── types/         # Définitions TypeScript
│   ├── utils/         # Fonctions utilitaires
│   └── App.tsx        # Composant principal
├── src-tauri/         # Code Rust et configuration Tauri
├── public/            # Assets statiques
└── dist/              # Build de production
```

## CI/CD avec GitHub Actions

Ce projet utilise GitHub Actions pour automatiser le processus de compilation et de publication sur plusieurs plateformes (Windows, macOS et Linux). Quand un tag avec le format `v*` (par exemple `v1.0.0`) est poussé, GitHub Actions compile automatiquement l'application pour toutes les plateformes et crée un draft release.

### Processus de compilation automatisé

Le workflow `.github/workflows/publish.yml` automatise la compilation de l'application pour Windows, macOS et Linux, et crée un draft release sur GitHub quand un tag `v*` est poussé.

### Créer une nouvelle version

Pour créer une nouvelle version :

1. Mettre à jour la version dans `package.json` et `src-tauri/tauri.conf.json`
2. Créer et pousser un nouveau tag :
   ```bash
   git tag v0.0.5
   git push origin v0.0.5
   ```
3. GitHub Actions compilera automatiquement l'application et créera un draft release
4. Revoir et publier le draft release sur GitHub

## Configuration

L'application peut être configurée via l'interface des paramètres :

- **Langue** : Choisir entre Français, Anglais, Espagnol et Allemand
- **Notifications** : Activer/désactiver les notifications système
- **Démarrage automatique** : Lancer l'application au démarrage du système
- **Mises à jour** : Vérifier et installer les mises à jour automatiquement

## Licence

Sous licence [MIT](LICENSE).
