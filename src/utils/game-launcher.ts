import { invoke } from '@tauri-apps/api/core'

import { getGamePaths } from './paths'
import { getGameExecutable } from './game-data'

export type GameLaunchResult = {
  success: boolean
  error?: string
  processId?: number
}

export type GameProcessStatus = {
  isRunning: boolean
  processId?: number
  error?: string
}

/**
 * Lance le jeu et retourne le résultat
 * Utilisé dans la transition Ready → Launching
 */
export async function launchGame(gameId: string): Promise<GameLaunchResult> {
  try {
    console.log(`🚀 Launching game: ${gameId}`)

    const gamePaths = await getGamePaths(gameId)

    // Chercher l'exécutable du jeu
    const gameExecutable = await findGameExecutable(gamePaths.install, gameId)

    if (!gameExecutable) {
      return {
        success: false,
        error: 'Game executable not found',
      }
    }

    // Lancer le jeu avec le plugin Shell (gestion automatique des événements)
    await invoke('launch_game_with_shell', {
      executablePath: gameExecutable,
      gameId,
    })

    console.log(`✅ Game launch initiated with Shell plugin for ${gameId}`)

    return {
      success: true,
      processId: undefined, // Le PID sera fourni dans les événements
    }
  } catch (error) {
    console.error(`❌ Failed to launch game ${gameId}:`, error)

    return {
      success: false,
      error: `Failed to launch game: ${error}`,
    }
  }
}

/**
 * Vérifie si le jeu est en cours d'exécution
 * Utilisé pour détecter les transitions Playing ↔ Ready
 */
export async function checkGameProcessStatus(
  gameId: string,
  processId?: number,
): Promise<GameProcessStatus> {
  try {
    // Si on a un PID spécifique, vérifier ce processus en priorité
    if (processId) {
      try {
        const isRunning = await invoke<boolean>('check_process_running', { pid: processId })

        if (isRunning) {
          return {
            isRunning: true,
            processId,
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to check specific process ${processId}:`, error)
      }
    }

    // Fallback: chercher des processus Unity génériques
    const isRunning = await checkUnityProcessRunning()

    return {
      isRunning,
      processId: isRunning ? undefined : undefined,
    }
  } catch (error) {
    console.error(`❌ Failed to check game process status for ${gameId}:`, error)

    return {
      isRunning: false,
      error: `Failed to check process: ${error}`,
    }
  }
}

/**
 * Trouve l'exécutable principal du jeu dans le dossier d'installation
 */
async function findGameExecutable(installPath: string, gameId: string): Promise<string | null> {
  try {
    console.log(`🔍 Searching for game executable in: ${installPath}`)

    // Utiliser le nom d'exécutable défini dans les données du jeu
    const primaryExecutable = getGameExecutable(gameId)
    const executablePath = `${installPath}/${primaryExecutable}`

    console.log(`🔍 Checking primary executable: ${executablePath}`)

    // Vérifier si l'exécutable principal existe
    const exists = await invoke<boolean>('check_file_exists', { path: executablePath })

    if (exists) {
      console.log(`✅ Found primary game executable: ${executablePath}`)

      return executablePath
    }

    console.log(`⚠️ Primary executable not found: ${primaryExecutable}`)

    // Fallback: chercher d'autres exécutables courants
    const fallbackExecutables = ['Game.exe', 'lysandra.exe', 'game.exe']

    for (const executableName of fallbackExecutables) {
      try {
        const fallbackPath = `${installPath}/${executableName}`

        console.log(`🔍 Checking fallback: ${fallbackPath}`)

        const fallbackExists = await invoke<boolean>('check_file_exists', { path: fallbackPath })

        if (fallbackExists) {
          console.log(`✅ Found fallback executable: ${fallbackPath}`)

          return fallbackPath
        }
      } catch (error) {
        console.warn(`⚠️ Error checking fallback ${executableName}:`, error)
      }
    }

    // Si aucun exécutable spécifique n'est trouvé, lister le contenu du dossier pour diagnostic
    console.log(`❌ No specific executable found, listing directory contents for diagnosis...`)

    // Vérifier si le dossier d'installation existe
    const dirExists = await invoke<boolean>('check_directory_exists', { path: installPath })

    if (!dirExists) {
      console.error(`❌ Install directory does not exist: ${installPath}`)

      return null
    }

    try {
      const contents = await invoke<string[]>('list_directory_contents', { path: installPath })

      console.log(`📁 Directory contents:`, contents)

      // Chercher des fichiers .exe dans la liste
      const exeFiles = contents.filter(
        (item) => item.startsWith('[FILE]') && item.toLowerCase().includes('.exe'),
      )

      if (exeFiles.length > 0) {
        console.log(`🎯 Found .exe files:`, exeFiles)
        // Prendre le premier fichier .exe trouvé
        const firstExe = exeFiles[0].replace('[FILE] ', '')
        const executablePath = `${installPath}/${firstExe}`

        console.log(`🎮 Using executable: ${executablePath}`)

        return executablePath
      } else {
        console.error(`❌ No .exe files found in directory`)
      }
    } catch (error) {
      console.error(`❌ Failed to list directory contents:`, error)
    }

    return null
  } catch (error) {
    console.error('❌ Failed to find game executable:', error)

    return null
  }
}

/**
 * Vérifie si un processus Unity est en cours d'exécution
 * Méthode simple pour détecter si le jeu tourne
 */
async function checkUnityProcessRunning(): Promise<boolean> {
  try {
    console.log('🔍 Checking for Unity/game processes...')
    const isRunning = await invoke<boolean>('check_unity_process_running')

    console.log(`🎮 Unity process running: ${isRunning}`)

    return isRunning
  } catch (error) {
    console.error('Failed to check Unity process:', error)

    return false
  }
}

// Note: L'ancien système de polling a été remplacé par un système d'événements en temps réel
// Voir useGameProcessEvents et start_game_process_monitoring dans le backend Rust
