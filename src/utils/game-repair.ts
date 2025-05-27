import { invoke } from '@tauri-apps/api/core'

import { getGamePaths } from './paths'
import { checkGameIntegrity, initializeGameStructure } from './game-integrity'

export type GameRepairProgress = {
  step: 'analyzing' | 'repairing_structure' | 'verifying_files' | 'complete' | 'failed'
  progress?: number
  message: string
  details?: string
}

export type GameRepairResult = {
  success: boolean
  error?: string
  repairActions: string[]
}

/**
 * Répare un jeu en analysant et corrigeant les problèmes détectés
 * Utilisé dans l'état Repairing de la state machine
 */
export async function repairGame(
  gameId: string,
  onProgress?: (progress: GameRepairProgress) => void,
): Promise<GameRepairResult> {
  const repairActions: string[] = []

  try {
    console.log(`🔧 Starting repair process for game: ${gameId}`)

    // Étape 1: Analyse des problèmes
    onProgress?.({
      step: 'analyzing',
      progress: 10,
      message: 'Analyse des problèmes détectés...',
    })

    const integrityCheck = await checkGameIntegrity(gameId)

    if (integrityCheck.isValid) {
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Aucune réparation nécessaire - le jeu est en bon état',
      })

      return {
        success: true,
        repairActions: ['No repair needed - game is healthy'],
      }
    }

    // Étape 2: Réparation de la structure
    onProgress?.({
      step: 'repairing_structure',
      progress: 30,
      message: 'Réparation de la structure de dossiers...',
    })

    await repairGameStructure(gameId, integrityCheck, repairActions)

    // Étape 3: Vérification des fichiers critiques
    onProgress?.({
      step: 'verifying_files',
      progress: 60,
      message: 'Vérification et réparation des fichiers...',
    })

    await repairGameFiles(gameId, integrityCheck, repairActions)

    // Étape 4: Vérification finale
    onProgress?.({
      step: 'verifying_files',
      progress: 90,
      message: "Vérification finale de l'intégrité...",
    })

    const finalCheck = await checkGameIntegrity(gameId)

    if (finalCheck.isValid) {
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Réparation terminée avec succès',
      })

      console.log(`✅ Game repair completed successfully for: ${gameId}`)
      console.log('Repair actions performed:', repairActions)

      return {
        success: true,
        repairActions,
      }
    } else {
      onProgress?.({
        step: 'failed',
        progress: 100,
        message: "La réparation n'a pas pu corriger tous les problèmes",
        details: `Problèmes restants: ${finalCheck.missingDirectories.length} dossiers, ${finalCheck.missingFiles.length} fichiers`,
      })

      return {
        success: false,
        error: 'Repair could not fix all issues',
        repairActions,
      }
    }
  } catch (error) {
    console.error(`❌ Game repair failed for ${gameId}:`, error)

    onProgress?.({
      step: 'failed',
      progress: 100,
      message: 'Erreur lors de la réparation',
      details: `${error}`,
    })

    return {
      success: false,
      error: `Repair process failed: ${error}`,
      repairActions,
    }
  }
}

/**
 * Répare la structure de dossiers du jeu
 */
async function repairGameStructure(
  gameId: string,
  integrityCheck: any,
  repairActions: string[],
): Promise<void> {
  // Recréer les dossiers manquants
  if (integrityCheck.missingDirectories.length > 0) {
    console.log(`📁 Recreating ${integrityCheck.missingDirectories.length} missing directories`)

    for (const missingDir of integrityCheck.missingDirectories) {
      try {
        await invoke('create_dir_all', { path: missingDir })
        repairActions.push(`Created missing directory: ${missingDir}`)
        console.log(`✅ Created directory: ${missingDir}`)
      } catch (error) {
        console.error(`❌ Failed to create directory ${missingDir}:`, error)
        repairActions.push(`Failed to create directory: ${missingDir} - ${error}`)
      }
    }
  }

  // Réinitialiser la structure complète si nécessaire
  try {
    await initializeGameStructure(gameId)
    repairActions.push('Reinitialized game structure')
  } catch (error) {
    console.error('Failed to reinitialize game structure:', error)
    repairActions.push(`Failed to reinitialize structure: ${error}`)
  }
}

/**
 * Répare les fichiers critiques du jeu
 */
async function repairGameFiles(
  gameId: string,
  integrityCheck: any,
  repairActions: string[],
): Promise<void> {
  const gamePaths = await getGamePaths(gameId)

  // Recréer les fichiers critiques manquants
  if (integrityCheck.missingFiles.length > 0) {
    console.log(`📄 Recreating ${integrityCheck.missingFiles.length} missing files`)

    for (const missingFile of integrityCheck.missingFiles) {
      try {
        if (missingFile === gamePaths.versionFile) {
          // Recréer le fichier version.txt vide
          await invoke('write_text_file', {
            path: missingFile,
            content: '',
          })
          repairActions.push('Recreated version.txt file')
          console.log(`✅ Recreated version file: ${missingFile}`)
        } else {
          // Pour d'autres fichiers critiques, créer un fichier vide ou par défaut
          await invoke('write_text_file', {
            path: missingFile,
            content: '',
          })
          repairActions.push(`Recreated missing file: ${missingFile}`)
          console.log(`✅ Recreated file: ${missingFile}`)
        }
      } catch (error) {
        console.error(`❌ Failed to recreate file ${missingFile}:`, error)
        repairActions.push(`Failed to recreate file: ${missingFile} - ${error}`)
      }
    }
  }

  // TODO: Réparer les fichiers corrompus
  if (integrityCheck.corruptedFiles.length > 0) {
    console.log(`🔧 Found ${integrityCheck.corruptedFiles.length} corrupted files`)
    repairActions.push(
      `Found ${integrityCheck.corruptedFiles.length} corrupted files (repair not implemented yet)`,
    )

    // Pour l'instant, on log seulement les fichiers corrompus
    // Dans une version future, on pourrait re-télécharger ces fichiers spécifiques
    for (const corruptedFile of integrityCheck.corruptedFiles) {
      console.log(`⚠️ Corrupted file detected: ${corruptedFile}`)
    }
  }
}

/**
 * Vérifie si un jeu a besoin d'être réparé
 * Utilisé pour déterminer si on doit passer en état WaitingForRepair
 */
export async function checkIfRepairNeeded(gameId: string): Promise<boolean> {
  try {
    const integrityCheck = await checkGameIntegrity(gameId)

    return integrityCheck.needsRepair
  } catch (error) {
    console.error(`Failed to check repair status for ${gameId}:`, error)

    return true // En cas d'erreur, on assume qu'une réparation est nécessaire
  }
}
