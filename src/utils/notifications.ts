import { sendNotification } from '@tauri-apps/plugin-notification'
import { LazyStore } from '@tauri-apps/plugin-store'

const NOTIFICATIONS_KEY = 'notifications_enabled'
const store = new LazyStore('settings.json')

export type NotificationType = 'download' | 'update' | 'error'

export interface NotificationOptions {
  title: string
  body: string
  type?: NotificationType
  icon?: string
}

/**
 * Envoie une notification si les notifications sont activées par l'utilisateur
 */
export const sendAppNotification = async (options: NotificationOptions): Promise<void> => {
  try {
    // Vérifier si les notifications sont activées par l'utilisateur
    const isEnabled = await store.get<boolean>(NOTIFICATIONS_KEY)

    if (isEnabled !== true) {
      console.log('Notifications disabled by user, skipping notification:', options.title)

      return
    }

    // Envoyer la notification
    await sendNotification({
      title: options.title,
      body: options.body,
      icon: options.icon,
    })

    console.log('Notification sent:', options.title)
  } catch (error) {
    console.warn('Failed to send notification:', error)
  }
}

/**
 * Envoie une notification de téléchargement terminé
 */
export const sendDownloadCompleteNotification = async (
  game: string,
  version: string,
): Promise<void> => {
  await sendAppNotification({
    title: 'Téléchargement terminé',
    body: `${game} v${version} a été installé avec succès !`,
    type: 'download',
  })
}

/**
 * Envoie une notification de mise à jour disponible
 */
export const sendUpdateAvailableNotification = async (
  game: string,
  version: string,
): Promise<void> => {
  await sendAppNotification({
    title: 'Mise à jour disponible',
    body: `${game} v${version} est maintenant disponible !`,
    type: 'update',
  })
}

/**
 * Envoie une notification d'erreur
 */
export const sendErrorNotification = async (title: string, error: string): Promise<void> => {
  await sendAppNotification({
    title,
    body: error,
    type: 'error',
  })
}
