import type { DownloadProgress, DownloadStatus } from '@/types/download'

import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { join } from '@tauri-apps/api/path'

import { getGamePaths } from '@/utils/paths'

export type GameDownloadProgress = {
  gameId: string
  version: string
  downloadId?: string
  status: DownloadStatus
  percentage: number
  speed: number
  downloadedBytes: number
  totalBytes: number
  error?: string
}

export type GameDownloadResult = {
  success: boolean
  downloadId?: string
  filePath?: string
  error?: string
}

export const useGameDownload = () => {
  const [activeDownloads, setActiveDownloads] = useState<Map<string, GameDownloadProgress>>(
    new Map(),
  )
  const unlistenFunctions = useRef<UnlistenFn[]>([])

  // Configuration des listeners d'événements
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Écouter les mises à jour de progression
        const unlistenProgress = await listen<DownloadProgress>('download-progress', (event) => {
          const download = event.payload

          // Extraire les informations du jeu depuis le file_path
          const fileName = download.file_path.split('/').pop() || ''
          const gameIdMatch = fileName.match(/^([^-]+)-(.+)\.zip$/)

          if (gameIdMatch) {
            const [, gameId, version] = gameIdMatch

            setActiveDownloads((prev) => {
              const updated = new Map(prev)

              updated.set(gameId, {
                gameId,
                version,
                downloadId: download.id,
                status: download.status,
                percentage: download.percentage,
                speed: download.speed,
                downloadedBytes: download.downloaded,
                totalBytes: download.total_size,
                error: download.error,
              })

              return updated
            })
          }
        })

        // Écouter les téléchargements terminés
        const unlistenCompleted = await listen<DownloadProgress>('download-completed', (event) => {
          const download = event.payload
          const fileName = download.file_path.split('/').pop() || ''
          const gameIdMatch = fileName.match(/^([^-]+)-(.+)\.zip$/)

          if (gameIdMatch) {
            const [, gameId, version] = gameIdMatch

            setActiveDownloads((prev) => {
              const updated = new Map(prev)

              updated.set(gameId, {
                gameId,
                version,
                downloadId: download.id,
                status: 'Completed',
                percentage: 100,
                speed: 0,
                downloadedBytes: download.total_size,
                totalBytes: download.total_size,
              })

              return updated
            })
          }
        })

        // Écouter les échecs de téléchargement
        const unlistenFailed = await listen<DownloadProgress>('download-failed', (event) => {
          const download = event.payload
          const fileName = download.file_path.split('/').pop() || ''
          const gameIdMatch = fileName.match(/^([^-]+)-(.+)\.zip$/)

          if (gameIdMatch) {
            const [, gameId, version] = gameIdMatch

            setActiveDownloads((prev) => {
              const updated = new Map(prev)

              updated.set(gameId, {
                gameId,
                version,
                downloadId: download.id,
                status: 'Failed',
                percentage: download.percentage,
                speed: 0,
                downloadedBytes: download.downloaded,
                totalBytes: download.total_size,
                error: download.error,
              })

              return updated
            })
          }
        })

        // Sauvegarder les fonctions de désabonnement
        unlistenFunctions.current = [unlistenProgress, unlistenCompleted, unlistenFailed]
      } catch (err) {
        console.error('Failed to setup game download listeners:', err)
      }
    }

    setupListeners()

    // Cleanup function
    return () => {
      unlistenFunctions.current.forEach((unlisten) => {
        if (unlisten) unlisten()
      })
    }
  }, [])

  // Démarrer un téléchargement de jeu
  const startGameDownload = useCallback(
    async (gameId: string, version: string, url: string): Promise<GameDownloadResult> => {
      try {
        // Obtenir les chemins du jeu
        const gamePaths = await getGamePaths(gameId)
        const cacheDir = await join(await gamePaths.root, '..', '..', 'cache')
        const zipFileName = `${gameId}-${version}.zip`
        const zipFilePath = await join(cacheDir, zipFileName)

        // S'assurer que le dossier cache existe
        await invoke('create_dir_all', { path: cacheDir })

        // Démarrer le téléchargement avec le nouveau système
        const downloadId = await invoke<string>('start_download', {
          url,
          filePath: zipFilePath,
        })

        // Initialiser l'état dans notre Map
        setActiveDownloads((prev) => {
          const updated = new Map(prev)

          updated.set(gameId, {
            gameId,
            version,
            downloadId,
            status: 'Pending',
            percentage: 0,
            speed: 0,
            downloadedBytes: 0,
            totalBytes: 0,
          })

          return updated
        })

        return {
          success: true,
          downloadId,
          filePath: zipFilePath,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        console.error('Failed to start game download:', errorMessage)

        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [],
  )

  // Mettre en pause un téléchargement
  const pauseGameDownload = useCallback(
    async (gameId: string): Promise<void> => {
      const download = activeDownloads.get(gameId)

      if (download?.downloadId) {
        try {
          await invoke('pause_download', { downloadId: download.downloadId })
        } catch (error) {
          console.error('Failed to pause download:', error)
          throw error
        }
      }
    },
    [activeDownloads],
  )

  // Reprendre un téléchargement
  const resumeGameDownload = useCallback(
    async (gameId: string): Promise<void> => {
      const download = activeDownloads.get(gameId)

      if (download?.downloadId) {
        try {
          await invoke('resume_download', { downloadId: download.downloadId })
        } catch (error) {
          console.error('Failed to resume download:', error)
          throw error
        }
      }
    },
    [activeDownloads],
  )

  // Annuler un téléchargement
  const cancelGameDownload = useCallback(
    async (gameId: string): Promise<void> => {
      const download = activeDownloads.get(gameId)

      if (download?.downloadId) {
        try {
          await invoke('cancel_download', { downloadId: download.downloadId })

          // Supprimer de notre état local
          setActiveDownloads((prev) => {
            const updated = new Map(prev)

            updated.delete(gameId)

            return updated
          })
        } catch (error) {
          console.error('Failed to cancel download:', error)
          throw error
        }
      }
    },
    [activeDownloads],
  )

  // Obtenir la progression d'un téléchargement spécifique
  const getGameDownloadProgress = useCallback(
    (gameId: string): GameDownloadProgress | null => {
      return activeDownloads.get(gameId) || null
    },
    [activeDownloads],
  )

  // Vérifier si un jeu est en cours de téléchargement
  const isGameDownloading = useCallback(
    (gameId: string): boolean => {
      const download = activeDownloads.get(gameId)

      return download?.status === 'Downloading' || download?.status === 'Pending'
    },
    [activeDownloads],
  )

  // Obtenir tous les téléchargements actifs
  const getAllGameDownloads = useCallback((): GameDownloadProgress[] => {
    return Array.from(activeDownloads.values())
  }, [activeDownloads])

  // Nettoyer un téléchargement terminé
  const clearGameDownload = useCallback((gameId: string): void => {
    setActiveDownloads((prev) => {
      const updated = new Map(prev)

      updated.delete(gameId)

      return updated
    })
  }, [])

  return {
    // État
    activeDownloads: Array.from(activeDownloads.values()),

    // Actions
    startGameDownload,
    pauseGameDownload,
    resumeGameDownload,
    cancelGameDownload,
    clearGameDownload,

    // Getters
    getGameDownloadProgress,
    isGameDownloading,
    getAllGameDownloads,
  }
}
