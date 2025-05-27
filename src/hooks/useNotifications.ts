import { useState, useEffect } from 'react'
import { LazyStore } from '@tauri-apps/plugin-store'
import { requestPermission, isPermissionGranted } from '@tauri-apps/plugin-notification'

const NOTIFICATIONS_KEY = 'notifications_enabled'
const store = new LazyStore('settings.json')

export const useNotifications = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSystemPermission, setHasSystemPermission] = useState<boolean>(false)

  // Vérifier l'état initial des notifications
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Vérifier la permission système
        const permission = await isPermissionGranted()

        setHasSystemPermission(permission)

        // Charger la préférence utilisateur
        const savedPreference = await store.get<boolean>(NOTIFICATIONS_KEY)
        const isEnabled = savedPreference !== null ? savedPreference : permission

        setIsNotificationsEnabled(isEnabled ?? false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setIsNotificationsEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkNotificationStatus()
  }, [])

  // Activer les notifications
  const enableNotifications = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      // Demander la permission système si pas encore accordée
      if (!hasSystemPermission) {
        const permission = await requestPermission()

        if (permission !== 'granted') {
          throw new Error('Permission refusée par le système')
        }

        setHasSystemPermission(true)
      }

      // Sauvegarder la préférence
      await store.set(NOTIFICATIONS_KEY, true)
      await store.save()

      setIsNotificationsEnabled(true)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'activation"

      setError(errorMessage)

      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Désactiver les notifications
  const disableNotifications = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      // Sauvegarder la préférence
      await store.set(NOTIFICATIONS_KEY, false)
      await store.save()

      setIsNotificationsEnabled(false)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la désactivation'

      setError(errorMessage)

      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Basculer l'état des notifications
  const toggleNotifications = async (): Promise<boolean> => {
    if (isNotificationsEnabled) {
      return await disableNotifications()
    } else {
      return await enableNotifications()
    }
  }

  return {
    isNotificationsEnabled,
    hasSystemPermission,
    isLoading,
    error,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
  }
}
