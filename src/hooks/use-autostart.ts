import { useState, useEffect } from 'react'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'

export const useAutostart = () => {
  const [isAutostartEnabled, setIsAutostartEnabled] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Vérifier l'état initial de l'autostart
  useEffect(() => {
    const checkAutostartStatus = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const enabled = await isEnabled()

        setIsAutostartEnabled(enabled)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    checkAutostartStatus()
  }, [])

  // Activer l'autostart
  const enableAutostart = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      await enable()
      setIsAutostartEnabled(true)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'activation")

      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Désactiver l'autostart
  const disableAutostart = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      await disable()
      setIsAutostartEnabled(false)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la désactivation')

      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Basculer l'état de l'autostart
  const toggleAutostart = async (): Promise<boolean> => {
    if (isAutostartEnabled) {
      return await disableAutostart()
    } else {
      return await enableAutostart()
    }
  }

  return {
    isAutostartEnabled,
    isLoading,
    error,
    enableAutostart,
    disableAutostart,
    toggleAutostart,
  }
}
