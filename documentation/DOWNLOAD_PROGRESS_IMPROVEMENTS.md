# Améliorations du calcul de progression de téléchargement

## Problème identifié

Le pourcentage de progression du téléchargement était faussé car il utilisait `Math.floor()` pour calculer le pourcentage, ce qui sous-estimait systématiquement la progression réelle.

## Solution implémentée

### 1. Amélioration du calcul backend (`src/utils/update-service.ts`)

**Avant :**

```javascript
const progressPercentage = Math.floor((progress * 100) / total)
```

**Après :**

```javascript
const progressPercentage = total > 0 ? Math.round((progress * 100) / total) : 0
```

### 2. Recalcul côté frontend pour plus de précision

**Dans `src/components/page/game/download-progress.tsx` :**

```javascript
// Recalculer le pourcentage directement à partir des bytes pour plus de précision
const calculatedProgress =
  event.payload.total > 0 ? Math.round((event.payload.progress * 100) / event.payload.total) : 0
```

**Dans `src/components/page/game/game-actions.tsx` :**

```javascript
const { progress, total } = event.payload
// Recalculer le pourcentage directement à partir des bytes pour plus de précision
const calculatedProgress = total > 0 ? Math.round((progress * 100) / total) : 0
```

## Avantages de cette approche

1. **Précision améliorée** : `Math.round()` donne un pourcentage plus proche de la réalité
2. **Double vérification** : Le frontend recalcule à partir des bytes bruts pour garantir la précision
3. **Protection contre division par zéro** : Vérification `total > 0`
4. **Compatibilité maintenue** : Le backend continue d'envoyer `progress_percentage` pour la compatibilité

## Exemples d'amélioration

| Bytes téléchargés | Total     | Exact   | Ancien (floor) | Nouveau (round) |
| ----------------- | --------- | ------- | -------------- | --------------- |
| 456,789           | 1,000,000 | 45.68%  | 45%            | 46%             |
| 789,012           | 1,000,000 | 78.90%  | 78%            | 79%             |
| 999,999           | 1,000,000 | 100.00% | 99%            | 100%            |

## Utilisation des bytes

Le plugin Tauri Upload fournit les valeurs `progress` et `total` en bytes, ce qui permet un calcul précis :

- `progress` : nombre de bytes téléchargés
- `total` : taille totale du fichier en bytes

Cette approche basée sur les bytes garantit que le pourcentage reflète fidèlement l'état réel du téléchargement.
