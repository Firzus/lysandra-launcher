import { invoke } from '@tauri-apps/api/core'

import { getGamePaths, GAME_IDS } from './paths'

export type GameUninstallResult = {
  success: boolean
  error?: string
}

/**
 * Émet un événement de désinstallation vers le frontend
 */
async function emitUninstallEvent(
  gameId: string,
  step: string,
  message: string,
  success: boolean = true,
): Promise<void> {
  try {
    await invoke('emit_uninstall_event', {
      gameId,
      step,
      message,
      success,
    })
  } catch (error) {
    console.warn('Failed to emit uninstall event:', error)
  }
}

/**
 * Désinstalle complètement un jeu en supprimant tous ses fichiers et dossiers
 */
export async function uninstallGame(gameId: string): Promise<GameUninstallResult> {
  try {
    console.log(`🗑️ Starting uninstallation of game: ${gameId}`)
    await emitUninstallEvent(gameId, 'started', 'Démarrage de la désinstallation...')

    const gamePaths = await getGamePaths(gameId)

    // 1. Supprimer le dossier d'installation (contient les binaires du jeu)
    try {
      await emitUninstallEvent(gameId, 'removing-install', 'Suppression des fichiers du jeu...')
      await invoke('delete_directory', { path: gamePaths.install })
      console.log(`✅ Deleted install directory: ${gamePaths.install}`)
    } catch (error) {
      console.warn(`⚠️ Could not delete install directory: ${error}`)
    }

    // 2. Supprimer le fichier de version
    try {
      await emitUninstallEvent(gameId, 'removing-version', 'Suppression du fichier de version...')
      await invoke('delete_file', { path: gamePaths.versionFile })
      console.log(`✅ Deleted version file: ${gamePaths.versionFile}`)
    } catch (error) {
      console.warn(`⚠️ Could not delete version file: ${error}`)
    }

    // 3. Supprimer les logs du jeu (optionnel, on peut les garder pour debug)
    try {
      await emitUninstallEvent(gameId, 'removing-logs', 'Suppression des logs...')
      await invoke('delete_directory', { path: gamePaths.logs })
      console.log(`✅ Deleted logs directory: ${gamePaths.logs}`)
    } catch (error) {
      console.warn(`⚠️ Could not delete logs directory: ${error}`)
    }

    // Note: On garde volontairement les sauvegardes (saves) et la config utilisateur
    // L'utilisateur peut les supprimer manuellement s'il le souhaite

    console.log(`✅ Game ${gameId} uninstalled successfully`)
    await emitUninstallEvent(gameId, 'completed', 'Désinstallation terminée avec succès')

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

    console.error(`❌ Failed to uninstall game ${gameId}:`, errorMessage)
    await emitUninstallEvent(gameId, 'error', `Erreur: ${errorMessage}`, false)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Désinstalle complètement un jeu ET supprime toutes ses données (sauvegardes, config)
 * ⚠️ ATTENTION: Cette action est irréversible !
 */
export async function uninstallGameCompletely(gameId: string): Promise<GameUninstallResult> {
  try {
    console.log(`🗑️ Starting COMPLETE uninstallation of game: ${gameId}`)
    await emitUninstallEvent(gameId, 'started', 'Démarrage de la désinstallation complète...')

    const gamePaths = await getGamePaths(gameId)

    // Supprimer tout le dossier du jeu (install, saves, logs, config)
    try {
      await emitUninstallEvent(gameId, 'removing-all', 'Suppression de tous les fichiers du jeu...')
      await invoke('delete_directory', { path: gamePaths.root })
      console.log(`✅ Deleted entire game directory: ${gamePaths.root}`)
    } catch (error) {
      console.error(`❌ Could not delete game directory: ${error}`)
      await emitUninstallEvent(gameId, 'error', `Erreur: ${error}`, false)
      throw error
    }

    console.log(`✅ Game ${gameId} completely uninstalled`)
    await emitUninstallEvent(gameId, 'completed', 'Désinstallation complète terminée')

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

    console.error(`❌ Failed to completely uninstall game ${gameId}:`, errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Fonction helper pour désinstaller Lysandra spécifiquement
 */
export async function uninstallLysandra(): Promise<GameUninstallResult> {
  return await uninstallGame(GAME_IDS.LYSANDRA)
}

/**
 * Fonction helper pour désinstaller complètement Lysandra spécifiquement
 */
export async function uninstallLysandraCompletely(): Promise<GameUninstallResult> {
  return await uninstallGameCompletely(GAME_IDS.LYSANDRA)
}

/**
 * Obtient la taille approximative d'un jeu installé
 */
export async function getGameSize(gameId: string): Promise<string> {
  try {
    const gamePaths = await getGamePaths(gameId)

    // Vérifier si le dossier du jeu existe
    const directoryExists = await invoke<boolean>('check_directory_exists', {
      path: gamePaths.root,
    })

    if (!directoryExists) {
      return '0 B' // Jeu pas installé
    }

    const size = await invoke<number>('get_directory_size', { path: gamePaths.root })

    // Convertir en unités lisibles
    if (size === 0) return '0 B'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  } catch (error) {
    console.error('Failed to get game size:', error)
    return 'Inconnu'
  }
}

/**
 * Vérifie si un jeu est installé en vérifiant l'existence de son dossier
 */
export async function isGameInstalled(gameId: string): Promise<boolean> {
  try {
    const gamePaths = await getGamePaths(gameId)

    // Vérifier si le dossier d'installation existe et contient des fichiers
    const installDirExists = await invoke<boolean>('check_directory_exists', {
      path: gamePaths.install,
    })

    if (!installDirExists) {
      return false
    }

    // Vérifier si le fichier version existe et n'est pas vide
    try {
      const versionContent = await invoke<string>('read_text_file', {
        path: gamePaths.versionFile,
      })
      return versionContent.trim().length > 0
    } catch {
      return false
    }
  } catch (error) {
    console.error('Failed to check if game is installed:', error)
    return false
  }
}
