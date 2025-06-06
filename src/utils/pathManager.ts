import { invoke } from '@tauri-apps/api/core'

/**
 * Gestionnaire de chemins pour HuzStudio - Interface Frontend
 */
export class PathManager {
  /**
   * Obtient le répertoire racine HuzStudio
   */
  static async getHuzStudioRoot(): Promise<string> {
    return await invoke<string>('get_huzstudio_root_path')
  }

  /**
   * Obtient le répertoire des jeux
   */
  static async getGamesDirectory(): Promise<string> {
    return await invoke<string>('get_games_directory')
  }

  /**
   * Obtient le répertoire de configuration
   */
  static async getConfigDirectory(): Promise<string> {
    return await invoke<string>('get_config_directory')
  }

  /**
   * Obtient le répertoire de cache
   */
  static async getCacheDirectory(): Promise<string> {
    return await invoke<string>('get_cache_directory')
  }

  /**
   * Obtient le répertoire des logs
   */
  static async getLogsDirectory(): Promise<string> {
    return await invoke<string>('get_logs_directory')
  }

  /**
   * Obtient le répertoire d'un jeu spécifique
   */
  static async getGameDirectory(gameId: string): Promise<string> {
    return await invoke<string>('get_game_directory', { gameId })
  }

  /**
   * Obtient le répertoire d'installation d'un jeu
   */
  static async getGameInstallDirectory(gameId: string): Promise<string> {
    return await invoke<string>('get_game_install_directory', { gameId })
  }

  /**
   * Initialise la structure de répertoires pour un jeu
   */
  static async initializeGameDirectories(gameId: string): Promise<void> {
    return await invoke<void>('initialize_game_directories', { gameId })
  }

  /**
   * Vérifie si la structure HuzStudio est présente et accessible
   */
  static async verifyStructure(): Promise<boolean> {
    return await invoke<boolean>('verify_huzstudio_structure')
  }

  /**
   * Obtient l'information complète sur la structure HuzStudio
   */
  static async getStructureInfo(): Promise<{
    root: string
    games: string
    config: string
    cache: string
    logs: string
    isValid: boolean
  }> {
    const [root, games, config, cache, logs, isValid] = await Promise.all([
      this.getHuzStudioRoot(),
      this.getGamesDirectory(),
      this.getConfigDirectory(),
      this.getCacheDirectory(),
      this.getLogsDirectory(),
      this.verifyStructure(),
    ])

    return {
      root,
      games,
      config,
      cache,
      logs,
      isValid,
    }
  }

  /**
   * Construit le chemin complet pour un jeu avec ses sous-répertoires
   */
  static async getGameStructure(gameId: string): Promise<{
    gameDir: string
    installDir: string
    savesDir: string
    logsDir: string
    configDir: string
  }> {
    const gameDir = await this.getGameDirectory(gameId)

    return {
      gameDir,
      installDir: `${gameDir}/install`,
      savesDir: `${gameDir}/saves`,
      logsDir: `${gameDir}/logs`,
      configDir: `${gameDir}/config`,
    }
  }
}

/**
 * Hook React pour utiliser PathManager
 */
import { useState, useEffect } from 'react'

export function usePathManager() {
  const [structureInfo, setStructureInfo] = useState<{
    root: string
    games: string
    config: string
    cache: string
    logs: string
    isValid: boolean
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    PathManager.getStructureInfo()
      .then(setStructureInfo)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const initializeGame = async (gameId: string) => {
    try {
      await PathManager.initializeGameDirectories(gameId)

      return await PathManager.getGameStructure(gameId)
    } catch (err) {
      throw new Error(`Failed to initialize game directories: ${err}`)
    }
  }

  return {
    structureInfo,
    loading,
    error,
    initializeGame,
    PathManager,
  }
}

export default PathManager
