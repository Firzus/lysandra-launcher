import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

import { GAME_IDS } from './paths'
import { isGameInstalled } from './game-uninstaller'
import { initializeGameCheck } from './game-checker'
import type { UninstallEvent } from '@/types/uninstall'

/**
 * Utilitaire de debug pour tester la synchronisation lors de la désinstallation
 */
export class SyncDebugger {
  private listeners: (() => void)[] = []

  constructor() {
    this.setupEventListener()
  }

  private async setupEventListener() {
    const unlisten = await listen<UninstallEvent>('game-uninstall', (event) => {
      const { game_id, step, message, success } = event.payload

      if (game_id === GAME_IDS.LYSANDRA) {
        console.log(`[SYNC DEBUG] Event: ${step} - ${message} (success: ${success})`)

        // Vérifier l'état réel du jeu après chaque événement
        this.checkGameStateAsync()
      }
    })

    this.listeners.push(unlisten)
  }

  private async checkGameStateAsync() {
    // Attendre un peu pour que les fichiers soient supprimés
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const installed = await isGameInstalled(GAME_IDS.LYSANDRA)
      const gameCheck = await initializeGameCheck()

      console.log(`[SYNC DEBUG] Game state check:`)
      console.log(`  - isGameInstalled(): ${installed}`)
      console.log(`  - gameCheck.action: ${gameCheck.action}`)
      console.log(`  - gameCheck.error: ${gameCheck.error || 'none'}`)

      // Vérifier l'existence des fichiers/dossiers critiques
      await this.checkCriticalPaths()
    } catch (error) {
      console.error(`[SYNC DEBUG] Error during state check:`, error)
    }
  }

  private async checkCriticalPaths() {
    try {
      const paths = [
        'C:\\Users\\lilia\\AppData\\Local\\com.lysandra.dev\\games\\lysandra-vslice\\install',
        'C:\\Users\\lilia\\AppData\\Local\\com.lysandra.dev\\games\\lysandra-vslice\\config\\version.txt',
        'C:\\Users\\lilia\\AppData\\Local\\com.lysandra.dev\\games\\lysandra-vslice',
      ]

      for (const path of paths) {
        try {
          const existsDir = await invoke<boolean>('check_directory_exists', { path })
          const existsFile = await invoke<boolean>('check_file_exists', { path })

          console.log(`[SYNC DEBUG] Path: ${path}`)
          console.log(`  - exists as dir: ${existsDir}`)
          console.log(`  - exists as file: ${existsFile}`)
        } catch (error) {
          console.log(`[SYNC DEBUG] Path: ${path} - Error: ${error}`)
        }
      }
    } catch (error) {
      console.error(`[SYNC DEBUG] Error checking paths:`, error)
    }
  }

  /**
   * Force une vérification manuelle de la synchronisation
   */
  async forceSyncCheck() {
    console.log(`[SYNC DEBUG] === FORCE SYNC CHECK ===`)
    await this.checkGameStateAsync()
    console.log(`[SYNC DEBUG] === END FORCE SYNC CHECK ===`)
  }

  /**
   * Nettoie les listeners d'événements
   */
  cleanup() {
    this.listeners.forEach((unlisten) => unlisten())
    this.listeners = []
  }
}

/**
 * Instance globale du debugger
 */
export const syncDebugger = new SyncDebugger()
