import { invoke } from '@tauri-apps/api/core'

import { getGamePaths, GAME_IDS } from './paths'

export type GameUninstallResult = {
  success: boolean
  error?: string
}

/**
 * Désinstalle complètement un jeu en supprimant tous ses fichiers et dossiers
 */
export async function uninstallGame(gameId: string): Promise<GameUninstallResult> {
  try {
    console.log(`🗑️ Starting uninstallation of game: ${gameId}`)

    const gamePaths = await getGamePaths(gameId)

    // 1. Supprimer le dossier d'installation (contient les binaires du jeu)
    try {
      await invoke('delete_directory', { path: gamePaths.install })
      console.log(`✅ Deleted install directory: ${gamePaths.install}`)
    } catch (error) {
      console.warn(`⚠️ Could not delete install directory: ${error}`)
    }

    // 2. Supprimer le fichier de version
    try {
      await invoke('delete_file', { path: gamePaths.versionFile })
      console.log(`✅ Deleted version file: ${gamePaths.versionFile}`)
    } catch (error) {
      console.warn(`⚠️ Could not delete version file: ${error}`)
    }

    // 3. Supprimer les logs du jeu (optionnel, on peut les garder pour debug)
    try {
      await invoke('delete_directory', { path: gamePaths.logs })
      console.log(`✅ Deleted logs directory: ${gamePaths.logs}`)
    } catch (error) {
      console.warn(`⚠️ Could not delete logs directory: ${error}`)
    }

    // Note: On garde volontairement les sauvegardes (saves) et la config utilisateur
    // L'utilisateur peut les supprimer manuellement s'il le souhaite

    console.log(`✅ Game ${gameId} uninstalled successfully`)

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

    console.error(`❌ Failed to uninstall game ${gameId}:`, errorMessage)

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

    const gamePaths = await getGamePaths(gameId)

    // Supprimer tout le dossier du jeu (install, saves, logs, config)
    try {
      await invoke('delete_directory', { path: gamePaths.root })
      console.log(`✅ Deleted entire game directory: ${gamePaths.root}`)
    } catch (error) {
      console.error(`❌ Could not delete game directory: ${error}`)
      throw error
    }

    console.log(`✅ Game ${gameId} completely uninstalled`)

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
    const size = await invoke<number>('get_directory_size', { path: gamePaths.root })

    // Convertir en unités lisibles
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  } catch (error) {
    console.error('Failed to get game size:', error)

    return 'Inconnu'
  }
}
