import { useEffect, useState } from 'react'

import { ensureLauncherDirectories } from '@/utils/paths'

type LauncherIntegrityStatus = 'checking' | 'ready' | 'error'

/**
 * Hook pour vérifier et maintenir l'intégrité de la structure du launcher
 * Utilisé dans App.tsx pour s'assurer que la structure existe à chaque démarrage
 */
export function useLauncherIntegrity() {
  const [status, setStatus] = useState<LauncherIntegrityStatus>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkLauncherIntegrity = async () => {
      try {
        setStatus('checking')
        setError(null)

        // Vérifier et recréer la structure si nécessaire
        await ensureLauncherDirectories()

        console.log('✅ Launcher structure verified/created')
        setStatus('ready')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'

        console.error('❌ Failed to verify launcher structure:', errorMessage)
        setError(errorMessage)
        setStatus('error')
      }
    }

    checkLauncherIntegrity()
  }, [])

  return {
    status,
    error,
    isReady: status === 'ready',
    isChecking: status === 'checking',
    hasError: status === 'error',
  }
}
