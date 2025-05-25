import { invoke } from '@tauri-apps/api/core'

import { getGamePaths, ensureGameDirectories } from './paths'

export type GameIntegrityResult = {
  isValid: boolean
  missingDirectories: string[]
  missingFiles: string[]
  corruptedFiles: string[]
  needsRepair: boolean
}

/**
 * Vérifie l'intégrité complète d'un jeu installé
 * Utilisé dans la transition Checking et pour déclencher l'état Repair
 */
export async function checkGameIntegrity(gameId: string): Promise<GameIntegrityResult> {
  const result: GameIntegrityResult = {
    isValid: true,
    missingDirectories: [],
    missingFiles: [],
    corruptedFiles: [],
    needsRepair: false,
  }

  try {
    const gamePaths = await getGamePaths(gameId)

    // 1. Vérifier que tous les dossiers existent
    const requiredDirectories = [
      gamePaths.install,
      gamePaths.saves,
      gamePaths.logs,
      gamePaths.config,
    ]

    for (const dir of requiredDirectories) {
      try {
        await invoke('check_directory_exists', { path: dir })
      } catch {
        result.missingDirectories.push(dir)
        result.isValid = false
      }
    }

    // 2. Vérifier les fichiers critiques
    const requiredFiles = [
      gamePaths.versionFile, // version.txt obligatoire
    ]

    for (const file of requiredFiles) {
      try {
        await invoke('read_text_file', { path: file })
      } catch {
        result.missingFiles.push(file)
        result.isValid = false
      }
    }

    // 3. Vérifier l'intégrité des fichiers du jeu (si installé)
    if (result.missingFiles.length === 0) {
      // TODO: Ajouter la vérification des hashes des fichiers du jeu
      // const gameFiles = await getInstalledGameFiles(gamePaths.install)
      // for (const file of gameFiles) {
      //   if (!(await verifyFileHash(file))) {
      //     result.corruptedFiles.push(file)
      //     result.isValid = false
      //   }
      // }
    }

    result.needsRepair = !result.isValid

    return result
  } catch (error) {
    console.error('Failed to check game integrity:', error)

    return {
      isValid: false,
      missingDirectories: [],
      missingFiles: [],
      corruptedFiles: [],
      needsRepair: true,
    }
  }
}

/**
 * Répare l'intégrité d'un jeu en recréant les dossiers/fichiers manquants
 * Utilisé dans l'état Repair de la state machine
 */
export async function repairGameIntegrity(gameId: string): Promise<boolean> {
  try {
    console.log(`🔧 Repairing game integrity for: ${gameId}`)

    // 1. Recréer la structure de dossiers
    await ensureGameDirectories(gameId)

    // 2. Vérifier à nouveau l'intégrité
    const integrityCheck = await checkGameIntegrity(gameId)

    if (integrityCheck.isValid) {
      console.log(`✅ Game integrity repaired successfully for: ${gameId}`)

      return true
    } else {
      console.error(`❌ Failed to repair game integrity for: ${gameId}`, integrityCheck)

      return false
    }
  } catch (error) {
    console.error(`❌ Error during game repair for ${gameId}:`, error)

    return false
  }
}

/**
 * Initialise la structure d'un jeu lors de son installation
 * Utilisé quand on installe un nouveau jeu
 */
export async function initializeGameStructure(gameId: string): Promise<boolean> {
  try {
    console.log(`📁 Initializing game structure for: ${gameId}`)

    // Créer tous les dossiers nécessaires
    await ensureGameDirectories(gameId)

    // Créer les fichiers de base si nécessaire
    const gamePaths = await getGamePaths(gameId)

    // Créer un fichier version.txt vide (sera rempli lors de l'installation)
    try {
      await invoke('read_text_file', { path: gamePaths.versionFile })
    } catch {
      // Le fichier n'existe pas, on le crée vide
      await invoke('write_text_file', {
        path: gamePaths.versionFile,
        content: '',
      })
    }

    console.log(`✅ Game structure initialized for: ${gameId}`)

    return true
  } catch (error) {
    console.error(`❌ Failed to initialize game structure for ${gameId}:`, error)

    return false
  }
}
