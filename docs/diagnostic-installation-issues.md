# 🔧 Diagnostic des problèmes d'installation

Ce document explique comment diagnostiquer et résoudre les problèmes d'installation du launcher.

## 📍 Structure des chemins corrigée

### **Chemin par défaut**

```
AppData/Local/com.huzstudio.launcher/     ← Dossier racine du launcher
├── games/                                ← Regroupe TOUS les jeux
│   └── lysandra-vslice/                  ← Dossier du jeu créé automatiquement
│       ├── install/                      ← Fichiers du jeu
│       ├── saves/                        ← Sauvegardes
│       ├── logs/                         ← Journaux du jeu
│       └── config/                       ← Configuration du jeu
│           └── version.txt               ← Version installée
├── config/                               ← Configuration du launcher
├── cache/                                ← Cache temporaire du launcher
└── logs/                                 ← Journaux du launcher
```

### **Chemin personnalisé** (exemple: `D:/Games`)

```
D:/Games/                                 ← Dossier "games" personnalisé
└── lysandra-vslice/                      ← Dossier du jeu créé automatiquement
    ├── install/                          ← Fichiers du jeu
    ├── saves/                            ← Sauvegardes
    ├── logs/                             ← Journaux du jeu
    └── config/                           ← Configuration du jeu
        └── version.txt                   ← Version installée
```

## 🔍 Problème de vérification de hash

### **Symptômes dans les logs**

```
Expected hash: FB3554B77A650426F9F4369B8BB1F841A5DF4D5CE523C3CA55373B81AE99960A
Actual hash:   eb4d761a73b345daedeae0dec67e04510347f90374946060b492da240267892a
❌ Hash verification failed
```

### **Causes possibles**

1. **Manifeste obsolète** (le plus probable)

   - Le hash dans le manifeste GitHub ne correspond plus au fichier
   - Le développeur a mis à jour le fichier sans mettre à jour le hash

2. **Corruption pendant le téléchargement**

   - Problème réseau
   - Proxy/cache intermédiaire
   - Interruption du téléchargement

3. **Modification par antivirus**

   - Certains antivirus modifient les fichiers .exe
   - Quarantaine partielle

4. **Cache corrompu**
   - Ancienne version en cache
   - Fichier partiellement écrit

### **Solutions automatiques implémentées**

1. **Retry avec délais progressifs**

   ```
   Tentative 1: Attente 3s
   Tentative 2: Attente 5s
   Tentative 3: Attente 7s
   Tentative 4: Attente 9s
   Tentative 5: Attente 11s
   ```

2. **Mode dégradé**

   - Après 5 échecs, l'installation continue
   - Message d'avertissement à l'utilisateur
   - Extraction tentée malgré l'échec de hash

3. **Diagnostic automatique**
   - Analyse des hashs en cas d'échec
   - Suggestions d'actions à l'utilisateur
   - Informations de debug complètes

### **Actions manuelles recommandées**

1. **Vérifier le manifeste GitHub**

   ```
   https://github.com/Firzus/lysandra-vslice/releases/latest/download/latest.json
   ```

2. **Vider le cache**

   - Supprimer `AppData/Local/com.huzstudio.launcher/cache/`
   - Relancer l'installation

3. **Désactiver temporairement l'antivirus**

   - Pendant le téléchargement uniquement
   - Réactiver après installation

4. **Essayer un autre réseau**
   - Wi-Fi différent
   - Données mobiles
   - VPN si nécessaire

## 🚨 Messages d'erreur courants

### **"corrupt deflate stream"**

```
❌ Extraction failed: corrupt deflate stream
```

**Cause** : Fichier ZIP corrompu (souvent lié au hash incorrect)
**Solution** : Suivre les étapes de résolution du hash

### **"Impossible de créer le dossier"**

```
❌ Impossible de créer le dossier: Access denied
```

**Cause** : Permissions insuffisantes
**Solution** : Choisir un dossier avec droits d'écriture (Documents, Desktop)

### **"Pas de permissions d'écriture"**

```
❌ Pas de permissions d'écriture: Permission denied
```

**Cause** : Dossier protégé en écriture
**Solution** : Sélectionner un autre dossier d'installation

## 🔧 Mode debug avancé

Pour activer le debug complet, ouvrir la console développeur (F12) et taper :

```javascript
window.forceSyncCheck()
```

### **Informations de debug fournies**

- Taille exacte du fichier téléchargé
- Comparaison détaillée des hashs
- Analyse des préfixes de hash
- Suggestions d'actions correctives
- Historique des tentatives

## 📋 Checklist de résolution

- [ ] Vérifier l'espace disque disponible (>5GB)
- [ ] Tester les permissions d'écriture
- [ ] Vider le cache du launcher
- [ ] Essayer un autre dossier d'installation
- [ ] Désactiver temporairement l'antivirus
- [ ] Vérifier la connexion réseau
- [ ] Consulter les logs complets (F12)
- [ ] Signaler le problème si persistant

## 📞 Support

Si le problème persiste après avoir suivi toutes les étapes :

1. **Exporter les logs** : F12 → Console → Clic droit → "Enregistrer sous"
2. **Noter la configuration** : OS, antivirus, configuration réseau
3. **Créer un rapport** avec les informations collectées

## 🔄 Améliorations futures

- Vérification automatique du manifeste GitHub
- Cache intelligent avec validation d'intégrité
- Interface utilisateur pour les options de récupération
- Téléchargement alternatif en cas d'échec persistant
