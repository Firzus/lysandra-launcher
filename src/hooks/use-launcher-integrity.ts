import { useEffect, useState, useCallback, useMemo } from 'react'

import { ensureLauncherDirectories } from '@/utils/paths'

type LauncherIntegrityStatus = 'checking' | 'ready' | 'error'

type IntegrityState = {
  status: LauncherIntegrityStatus
  error: string | null
}

/**
 * Hook pour vérifier et maintenir l'intégrité de la structure du launcher
 * Utilisé dans App.tsx pour s'assurer que la structure existe à chaque démarrage
 */
export function useLauncherIntegrity() {
  const [state, setState] = useState<IntegrityState>({
    status: 'checking',
    error: null,
  })

  const setStatus = useCallback((status: LauncherIntegrityStatus) => {
    setState((prev) => ({ ...prev, status }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, status: error ? 'error' : 'ready' }))
  }, [])

  const checkLauncherIntegrity = useCallback(async () => {
    try {
      setStatus('checking')
      setError(null)

      await ensureLauncherDirectories()
      setStatus('ready')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to verify launcher structure:', errorMessage, err)
      setError(errorMessage)
    }
  }, [setStatus, setError])

  useEffect(() => {
    checkLauncherIntegrity()
  }, [checkLauncherIntegrity])

  // Mémorisation du résultat pour éviter les re-renders inutiles
  return useMemo(
    () => ({
      status: state.status,
      error: state.error,
      isReady: state.status === 'ready',
      isChecking: state.status === 'checking',
      hasError: state.status === 'error',
      retry: checkLauncherIntegrity,
    }),
    [state, checkLauncherIntegrity],
  )
}
