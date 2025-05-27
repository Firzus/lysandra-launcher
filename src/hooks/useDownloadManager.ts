import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

import {
  DownloadProgress,
  DownloadStats,
  DownloadManagerAPI,
  DownloadProgressEvent,
  DownloadCompletedEvent,
  DownloadFailedEvent,
} from '../types/download'

export const useDownloadManager = (): DownloadManagerAPI & {
  downloads: DownloadProgress[]
  stats: DownloadStats | null
  isLoading: boolean
  error: string | null
  refreshDownloads: () => Promise<void>
  refreshStats: () => Promise<void>
} => {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([])
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unlistenFunctions = useRef<UnlistenFn[]>([])

  // Charger les téléchargements existants
  const refreshDownloads = useCallback(async () => {
    try {
      setError(null)
      const allDownloads = await invoke<DownloadProgress[]>('get_all_downloads')

      setDownloads(allDownloads)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      console.error('Failed to fetch downloads:', errorMessage)
      setError(errorMessage)
    }
  }, [])

  // Charger les statistiques
  const refreshStats = useCallback(async () => {
    try {
      const downloadStats = await invoke<DownloadStats>('get_download_stats')

      setStats(downloadStats)
    } catch (err) {
      console.error('Failed to fetch download stats:', err)
    }
  }, [])

  // Mettre à jour un téléchargement spécifique
  const updateDownload = useCallback((updatedDownload: DownloadProgress) => {
    setDownloads((prev) =>
      prev.map((download) => (download.id === updatedDownload.id ? updatedDownload : download)),
    )
  }, [])

  // Supprimer un téléchargement de la liste
  const removeDownloadFromList = useCallback((downloadId: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== downloadId))
  }, [])

  // Configuration des listeners d'événements
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Écouter les mises à jour de progression
        const unlistenProgress = await listen<DownloadProgressEvent>(
          'download-progress',
          (event) => {
            updateDownload(event.payload)
          },
        )

        // Écouter les téléchargements terminés
        const unlistenCompleted = await listen<DownloadCompletedEvent>(
          'download-completed',
          (event) => {
            updateDownload(event.payload)
            refreshStats() // Mettre à jour les statistiques
          },
        )

        // Écouter les échecs de téléchargement
        const unlistenFailed = await listen<DownloadFailedEvent>('download-failed', (event) => {
          updateDownload(event.payload)
          refreshStats() // Mettre à jour les statistiques
        })

        // Sauvegarder les fonctions de désabonnement
        unlistenFunctions.current = [unlistenProgress, unlistenCompleted, unlistenFailed]
      } catch (err) {
        console.error('Failed to setup download listeners:', err)
        setError('Failed to setup download listeners')
      }
    }

    setupListeners()

    // Cleanup function
    return () => {
      unlistenFunctions.current.forEach((unlisten) => {
        if (unlisten) unlisten()
      })
    }
  }, [updateDownload, refreshStats])

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await Promise.all([refreshDownloads(), refreshStats()])
      setIsLoading(false)
    }

    loadInitialData()
  }, [refreshDownloads, refreshStats])

  // API Methods
  const startDownload = useCallback(
    async (url: string, filePath: string): Promise<string> => {
      try {
        setError(null)
        const downloadId = await invoke<string>('start_download', { url, filePath })

        // Rafraîchir la liste pour obtenir le nouveau téléchargement
        setTimeout(refreshDownloads, 100)

        return downloadId
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)

        setError(errorMessage)
        throw err
      }
    },
    [refreshDownloads],
  )

  const pauseDownload = useCallback(async (downloadId: string): Promise<void> => {
    try {
      setError(null)
      await invoke('pause_download', { downloadId })
      // La progression sera mise à jour via l'événement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      setError(errorMessage)
      throw err
    }
  }, [])

  const resumeDownload = useCallback(async (downloadId: string): Promise<void> => {
    try {
      setError(null)
      await invoke('resume_download', { downloadId })
      // La progression sera mise à jour via l'événement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      setError(errorMessage)
      throw err
    }
  }, [])

  const cancelDownload = useCallback(async (downloadId: string): Promise<void> => {
    try {
      setError(null)
      await invoke('cancel_download', { downloadId })
      // La progression sera mise à jour via l'événement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      setError(errorMessage)
      throw err
    }
  }, [])

  const removeDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        setError(null)
        await invoke('remove_download', { downloadId })
        removeDownloadFromList(downloadId)
        refreshStats()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)

        setError(errorMessage)
        throw err
      }
    },
    [removeDownloadFromList, refreshStats],
  )

  const getDownloadProgress = useCallback(
    async (downloadId: string): Promise<DownloadProgress | null> => {
      try {
        return await invoke<DownloadProgress | null>('get_download_progress', { downloadId })
      } catch (err) {
        console.error('Failed to get download progress:', err)

        return null
      }
    },
    [],
  )

  const getAllDownloads = useCallback(async (): Promise<DownloadProgress[]> => {
    try {
      return await invoke<DownloadProgress[]>('get_all_downloads')
    } catch (err) {
      console.error('Failed to get all downloads:', err)

      return []
    }
  }, [])

  const cleanupCompletedDownloads = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      await invoke('cleanup_completed_downloads')
      refreshDownloads()
      refreshStats()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      setError(errorMessage)
      throw err
    }
  }, [refreshDownloads, refreshStats])

  const getDownloadStats = useCallback(async (): Promise<DownloadStats> => {
    try {
      return await invoke<DownloadStats>('get_download_stats')
    } catch (err) {
      console.error('Failed to get download stats:', err)
      throw err
    }
  }, [])

  return {
    // État
    downloads,
    stats,
    isLoading,
    error,

    // Méthodes de rafraîchissement
    refreshDownloads,
    refreshStats,

    // API du gestionnaire de téléchargement
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    getDownloadProgress,
    getAllDownloads,
    cleanupCompletedDownloads,
    getDownloadStats,
  }
}

// Hook pour surveiller un téléchargement spécifique
export const useDownload = (downloadId: string) => {
  const [download, setDownload] = useState<DownloadProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDownload = async () => {
      try {
        const progress = await invoke<DownloadProgress | null>('get_download_progress', {
          downloadId,
        })

        setDownload(progress)
      } catch (err) {
        console.error('Failed to load download:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDownload()

    // Écouter les mises à jour de ce téléchargement spécifique
    const setupListener = async () => {
      const unlisten = await listen<DownloadProgressEvent>('download-progress', (event) => {
        if (event.payload.id === downloadId) {
          setDownload(event.payload)
        }
      })

      return unlisten
    }

    let unlisten: UnlistenFn | null = null

    setupListener().then((fn) => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [downloadId])

  return {
    download,
    isLoading,
  }
}
