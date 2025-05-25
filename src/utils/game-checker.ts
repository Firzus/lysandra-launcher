import { invoke } from '@tauri-apps/api/core'

import { fetchManifest } from './update-service'
import { getGamePaths, GAME_IDS } from './paths'
import { checkGameIntegrity, initializeGameStructure } from './game-integrity'

export type GameCheckResult = {
  action: 'CHECK_PASS' | 'FIND_UPDATE' | 'GAME_NOT_INSTALLED' | 'CHECK_FAIL' | 'CLICK_REPAIR'
  currentVersion?: string
  latestVersion?: string
  error?: string
  needsRepair?: boolean
}

/**
 * Vérifie l'état du jeu installé et détermine l'action suivante
 * Utilisé pour la transition Idle → Checking
 */
export async function checkGameStatus(
  gameId: string,
  owner: string,
  repo: string,
): Promise<GameCheckResult> {
  try {
    // 0. Initialiser la structure du jeu si nécessaire
    await initializeGameStructure(gameId)
    const gamePaths = await getGamePaths(gameId)

    // 1. Vérifier l'intégrité du jeu
    const integrityCheck = await checkGameIntegrity(gameId)

    if (integrityCheck.needsRepair) {
      console.log('🔧 Game integrity issues detected, repair needed')

      return {
        action: 'CLICK_REPAIR',
        needsRepair: true,
        error: `Missing: ${integrityCheck.missingDirectories.length} dirs, ${integrityCheck.missingFiles.length} files`,
      }
    }

    // 2. Vérifier si le jeu est installé (fichier version.txt existe et n'est pas vide)
    let currentVersion: string

    try {
      currentVersion = await invoke<string>('read_text_file', { path: gamePaths.versionFile })
      currentVersion = currentVersion.trim()

      if (!currentVersion) {
        // Fichier version vide = jeu non installé
        console.log('No game installed - version file is empty')

        return {
          action: 'GAME_NOT_INSTALLED',
        }
      }
    } catch {
      // Pas de fichier version = jeu non installé
      console.log('No game installed - version file not found at:', gamePaths.versionFile)

      return {
        action: 'GAME_NOT_INSTALLED',
      }
    }

    // 2. Récupérer la dernière version disponible
    let manifest

    try {
      manifest = await fetchManifest(owner, repo)
    } catch (error) {
      return {
        action: 'CHECK_FAIL',
        error: `Failed to fetch manifest: ${error}`,
      }
    }

    // 3. Comparer les versions
    if (currentVersion !== manifest.version) {
      return {
        action: 'FIND_UPDATE',
        currentVersion,
        latestVersion: manifest.version,
      }
    }

    // 4. Jeu à jour
    return {
      action: 'CHECK_PASS',
      currentVersion,
      latestVersion: manifest.version,
    }
  } catch (error) {
    return {
      action: 'CHECK_FAIL',
      error: `Unexpected error during game check: ${error}`,
    }
  }
}

/**
 * Hook pour déclencher la vérification du jeu au chargement de la page
 * Retourne l'action à dispatcher dans la state machine
 */
export async function initializeGameCheck(): Promise<GameCheckResult> {
  // Pour l'instant, on a qu'un seul jeu : Lysandra
  return await checkGameStatus(GAME_IDS.LYSANDRA, 'Firzus', 'lysandra-vslice')
}
