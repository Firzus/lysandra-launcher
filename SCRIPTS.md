# Scripts NPM - Lysandra Launcher

## Scripts de développement

### `npm run dev`

Lance l'application Tauri en mode développement.

- Hot Module Replacement (HMR) activé
- Lance automatiquement Vite en arrière-plan
- Ouvre l'application native (pas dans le navigateur)

## Scripts de build

### `npm run build`

Compile le frontend seulement (TypeScript + Vite).

- Vérifie les types TypeScript avec `tsc`
- Génère les assets optimisés dans `dist/`
- Utilisé automatiquement par les builds Tauri

### `npm run build:local`

Build complet de l'application Tauri pour tests locaux.

- Exécute `npm run build` automatiquement
- Génère l'exécutable dans `src-tauri/target/release/`
- Crée l'installateur NSIS pour Windows

### `npm run build:prod`

Build de production avec updater activé.

- Active le système de mise à jour automatique
- Génère les artefacts de mise à jour
- Utilisé pour les releases officielles

## Scripts de qualité de code

### `npm run lint`

Corrige automatiquement les problèmes de linting détectés.

- Utilise ESLint avec les règles configurées
- Applique les corrections automatiques quand possible

## Scripts Tauri

### `npm run tauri`

Accès direct aux commandes Tauri CLI.

- Exemple : `npm run tauri build` pour le build
- Exemple : `npm run tauri info` pour les informations système

## Commandes courantes

```bash
# Développement
npm run dev                 # Application complète avec hot reload

# Tests et build
npm run build:local        # Build local pour tests
npm run build:prod         # Build de production avec updater

# Qualité de code
npm run lint               # Correction automatique
```

## Notes importantes

- `npm run dev` lance directement l'application Tauri (pas le navigateur)
- Le port 1420 est géré automatiquement par Tauri 2.0
- Toujours utiliser `npm run build:local` pour tester en production
- Le script `build:prod` est réservé aux releases officielles
