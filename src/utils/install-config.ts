import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'

export type GameInstallConfiguration = {
  gameId: string
  customInstallPath?: string
  createDesktopShortcut: boolean
  createStartMenuShortcut: boolean
  useCustomPath: boolean
}

export type GamePathConfig = {
  root: string
  install: string
  saves: string
  logs: string
  config: string
  versionFile: string
}

export type GameInstallResult = {
  success: boolean
  version?: string
  error?: string
}

const INSTALL_CONFIG_KEY_PREFIX = 'game_install_config_'

/**
 * Sauvegarde la configuration d'installation pour un jeu
 */
export async function saveInstallConfiguration(config: GameInstallConfiguration): Promise<void> {
  try {
    const configKey = `${INSTALL_CONFIG_KEY_PREFIX}${config.gameId}`
    const configJson = JSON.stringify(config)

    await invoke('store_config', {
      key: configKey,
      value: configJson,
    })

    console.log(`✅ Install configuration saved for ${config.gameId}:`, config)
  } catch (error) {
    console.error(`❌ Failed to save install configuration for ${config.gameId}:`, error)
    throw new Error(`Failed to save install configuration: ${error}`)
  }
}

/**
 * Récupère la configuration d'installation pour un jeu
 */
export async function getInstallConfiguration(
  gameId: string,
): Promise<GameInstallConfiguration | null> {
  try {
    const configKey = `${INSTALL_CONFIG_KEY_PREFIX}${gameId}`
    const configJson = await invoke<string>('get_config', { key: configKey })

    if (configJson) {
      const config = JSON.parse(configJson) as GameInstallConfiguration

      console.log(`✅ Install configuration loaded for ${gameId}:`, config)

      return config
    }

    return null
  } catch (error) {
    console.warn(`⚠️ No install configuration found for ${gameId}:`, error)

    return null
  }
}

/**
 * Génère les chemins d'installation basés sur la configuration
 * Suit les conventions de Steam/Xbox App pour les installations personnalisées
 * Structure cohérente : CheminBase/JeuID/install/ (toujours avec dossier du jeu)
 */
export async function generateGamePaths(
  gameId: string,
  config?: GameInstallConfiguration,
): Promise<GamePathConfig> {
  try {
    // Si pas de configuration fournie, essayer de la charger
    if (!config) {
      const loadedConfig = await getInstallConfiguration(gameId)

      if (loadedConfig) {
        config = loadedConfig
      }
    }

    let baseGamesPath: string

    if (config?.useCustomPath && config.customInstallPath) {
      // Pour les chemins personnalisés : CheminPersonnalisé devient le dossier "games"
      console.log(`📁 Using custom games path for ${gameId}: ${config.customInstallPath}`)
      baseGamesPath = config.customInstallPath
    } else {
      // Utiliser le chemin par défaut dans AppData avec dossier "games"
      console.log(`📁 Using default games path for ${gameId}`)
      const appDataDir = await invoke<string>('get_app_data_dir')

      // Ajouter le dossier "games" pour regrouper tous les jeux
      baseGamesPath = await join(appDataDir, 'games')
    }

    // Toujours créer un dossier spécifique au jeu dans le chemin des jeux
    const gameRoot = await join(baseGamesPath, gameId)
    const installPath = await join(gameRoot, 'install')
    const savesPath = await join(gameRoot, 'saves')
    const logsPath = await join(gameRoot, 'logs')
    const configPath = await join(gameRoot, 'config')
    const versionFilePath = await join(configPath, 'version.txt')

    const paths: GamePathConfig = {
      root: gameRoot,
      install: installPath,
      saves: savesPath,
      logs: logsPath,
      config: configPath,
      versionFile: versionFilePath,
    }

    console.log(`📁 Generated paths for ${gameId}:`)
    console.log(`   Root: ${paths.root}`)
    console.log(`   Install: ${paths.install}`)
    console.log(`   Saves: ${paths.saves}`)
    console.log(`   Logs: ${paths.logs}`)
    console.log(`   Config: ${paths.config}`)
    console.log(`   Version File: ${paths.versionFile}`)

    return paths
  } catch (error) {
    console.error(`❌ Failed to generate game paths for ${gameId}:`, error)
    throw new Error(`Failed to generate game paths: ${error}`)
  }
}

/**
 * Vérifie si un chemin d'installation personnalisé est valide
 * Le chemin fourni sera utilisé comme dossier "games" parent
 * Exemple : Si path = "D:/Games", les jeux seront installés dans "D:/Games/lysandra-vslice/"
 */
export async function validateCustomInstallPath(
  path: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log(`🔍 Validating custom games directory: ${path}`)

    // Vérifier que le chemin existe ou peut être créé
    const pathExists = await invoke<boolean>('check_directory_exists', { path })

    if (!pathExists) {
      // Essayer de créer le dossier pour valider l'accès
      try {
        await invoke('create_dir_all', { path })
        console.log(`✅ Custom games directory validated and created: ${path}`)
      } catch (createError) {
        return {
          valid: false,
          error: `Impossible de créer le dossier: ${createError}`,
        }
      }
    }

    // Vérifier les permissions d'écriture
    const testFilePath = await join(path, '.huz_launcher_test')

    try {
      await invoke('write_text_file', {
        path: testFilePath,
        content: 'test write permissions',
      })
      await invoke('delete_file', { path: testFilePath })
      console.log(`✅ Write permissions validated for: ${path}`)
    } catch (writeError) {
      return {
        valid: false,
        error: `Pas de permissions d'écriture: ${writeError}`,
      }
    }

    // Vérifier l'espace disponible (recommandé pour les jeux)
    try {
      const freeSpace = await invoke<number>('get_free_space', { path })
      const requiredSpace = 5 * 1024 * 1024 * 1024 // 5GB en bytes

      if (freeSpace < requiredSpace) {
        console.warn(
          `⚠️ Espace disque faible à ${path}: ${Math.round(freeSpace / (1024 * 1024 * 1024))}GB disponible, ${Math.round(requiredSpace / (1024 * 1024 * 1024))}GB recommandé`,
        )
        // Ne pas échouer la validation, juste avertir
      } else {
        console.log(
          `✅ Sufficient disk space: ${Math.round(freeSpace / (1024 * 1024 * 1024))}GB available`,
        )
      }
    } catch (spaceError) {
      console.warn(`⚠️ Could not check free space for ${path}:`, spaceError)
    }

    console.log(`✅ Custom games directory validation successful: ${path}`)

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: `Échec de validation du chemin: ${error}`,
    }
  }
}

/**
 * Migre une installation existante vers un nouveau chemin
 * Suit les conventions de Steam pour la migration de jeux
 * newGamesPath sera utilisé comme nouveau dossier "games" parent
 */
export async function migrateGameInstallation(
  gameId: string,
  newGamesPath: string,
  onProgress?: (progress: { step: string; percentage: number }) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚚 Starting migration of ${gameId} to games directory: ${newGamesPath}`)
    onProgress?.({ step: 'Préparation de la migration...', percentage: 0 })

    // Récupérer l'ancienne configuration
    const oldConfig = await getInstallConfiguration(gameId)

    if (!oldConfig) {
      throw new Error('No existing install configuration found')
    }

    // Générer les anciens et nouveaux chemins
    const oldPaths = await generateGamePaths(gameId, oldConfig)
    const newConfig: GameInstallConfiguration = {
      ...oldConfig,
      customInstallPath: newGamesPath,
      useCustomPath: true,
    }
    const newPaths = await generateGamePaths(gameId, newConfig)

    console.log(`Migration paths:`)
    console.log(`  From: ${oldPaths.root}`)
    console.log(`  To: ${newPaths.root}`)

    onProgress?.({ step: 'Validation du nouveau dossier...', percentage: 10 })

    // Valider le nouveau dossier "games" parent
    const validation = await validateCustomInstallPath(newGamesPath)

    if (!validation.valid) {
      throw new Error(`Invalid destination games directory: ${validation.error}`)
    }

    onProgress?.({ step: 'Copie des fichiers du jeu...', percentage: 20 })

    // Copier tous les fichiers du jeu (dossier complet du jeu)
    await invoke('copy_directory', {
      source: oldPaths.root,
      destination: newPaths.root,
    })

    onProgress?.({ step: 'Vérification de la copie...', percentage: 70 })

    // Vérifier que la copie a réussi
    const newInstallExists = await invoke<boolean>('check_directory_exists', {
      path: newPaths.install,
    })
    const newVersionExists = await invoke<boolean>('check_file_exists', {
      path: newPaths.versionFile,
    })

    if (!newInstallExists || !newVersionExists) {
      throw new Error('Migration failed: destination game files not found')
    }

    onProgress?.({ step: 'Sauvegarde de la nouvelle configuration...', percentage: 80 })

    // Sauvegarder la nouvelle configuration
    await saveInstallConfiguration(newConfig)

    onProgress?.({ step: "Suppression de l'ancienne installation...", percentage: 90 })

    // Supprimer l'ancien dossier du jeu
    await invoke('delete_directory', { path: oldPaths.root })

    onProgress?.({ step: 'Migration terminée', percentage: 100 })

    console.log(`✅ Migration completed successfully for ${gameId}`)
    console.log(`   Game moved from: ${oldPaths.root}`)
    console.log(`   Game moved to: ${newPaths.root}`)

    return { success: true }
  } catch (error) {
    console.error(`❌ Migration failed for ${gameId}:`, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
    }
  }
}
