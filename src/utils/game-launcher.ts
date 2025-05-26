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

    // Lancer le jeu avec la commande Tauri
    const pid = await invoke<number>('launch_game_executable', {
      executablePath: gameExecutable,
    })

    console.log(`✅ Game launched successfully with PID: ${pid}`)

    return {
      success: true,
      processId: pid,
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
export async function checkGameProcessStatus(gameId: string): Promise<GameProcessStatus> {
  try {
    // Pour l'instant, on utilise une approche simple en cherchant les processus Unity
    // TODO: Améliorer avec un système de tracking des PID

    const isRunning = await checkUnityProcessRunning()

    return {
      isRunning,
      processId: isRunning ? undefined : undefined, // TODO: tracker le PID réel
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

/**
 * Surveille l'état du processus du jeu et émet des événements
 * Utilisé pour détecter automatiquement les changements d'état
 */
export function startGameProcessMonitoring(
  gameId: string,
  onGameStart: () => void,
  onGameStop: () => void,
): () => void {
  let isMonitoring = true
  let wasRunning = false

  const checkInterval = setInterval(async () => {
    if (!isMonitoring) return

    try {
      const status = await checkGameProcessStatus(gameId)

      if (status.isRunning && !wasRunning) {
        // Jeu vient de démarrer
        console.log('🎮 Game process detected - transitioning to Playing')
        onGameStart()
        wasRunning = true
      } else if (!status.isRunning && wasRunning) {
        // Jeu vient de s'arrêter
        console.log('🛑 Game process stopped - transitioning to Ready')
        onGameStop()
        wasRunning = false
      }
    } catch (error) {
      console.error('Error monitoring game process:', error)
    }
  }, 2000) // Vérifier toutes les 2 secondes

  // Fonction de nettoyage
  return () => {
    isMonitoring = false
    clearInterval(checkInterval)
  }
}
