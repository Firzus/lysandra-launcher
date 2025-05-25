import { useCallback, useMemo, useState, useEffect } from 'react'
import { check, type DownloadEvent } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

type Status = 'idle' | 'checking' | 'downloading' | 'installing' | 'ready' | 'error'

type UpdateState = {
  status: Status
  progress: number
  error?: string
}

export function useAutoAppUpdate() {
  const [state, setState] = useState<UpdateState>({
    status: 'idle',
    progress: 0,
  })

  const updateStatus = useCallback((newStatus: Status) => {
    setState((prev: UpdateState) => ({ ...prev, status: newStatus }))
  }, [])

  const updateProgress = useCallback((progress: number) => {
    setState((prev: UpdateState) => ({ ...prev, progress }))
  }, [])

  const setError = useCallback((error: string) => {
    setState((prev: UpdateState) => ({ ...prev, error, status: 'error' }))
  }, [])

  const handleDownloadProgress = useCallback(
    (event: DownloadEvent, total: number) => {
      switch (event.event) {
        case 'Progress':
          const progress = total > 0 ? Math.round((event.data.chunkLength / total) * 100) : 0

          updateProgress(progress)
          break
      }
    },
    [updateProgress],
  )

  const checkForUpdates = useCallback(async () => {
    try {
      updateStatus('checking')

      const update = await check()

      if (!update) {
        updateStatus('ready')

        return
      }

      updateStatus('downloading')
      let total = 0

      await update.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0
            break
          case 'Progress':
            handleDownloadProgress(event, total)
            break
        }
      })

      updateStatus('installing')
      await relaunch()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'

      setError(errorMessage)
    }
  }, [updateStatus, handleDownloadProgress, setError])

  useEffect(() => {
    checkForUpdates()
  }, [checkForUpdates])

  // Mémorisation du résultat pour éviter les re-renders inutiles
  return useMemo(
    () => ({
      status: state.status,
      progress: state.progress,
      error: state.error,
      isLoading:
        state.status === 'checking' ||
        state.status === 'downloading' ||
        state.status === 'installing',
      isReady: state.status === 'ready',
      hasError: state.status === 'error',
    }),
    [state],
  )
}
