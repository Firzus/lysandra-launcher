import { LuCloudDownload, LuSettings2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification'
import React from 'react'

import { GameSettingsModal } from '@/components/settings/game/game-settings-modal'
import { InstallGameModal, type InstallConfig } from '@/components/settings/game/features/install-game-modal'

// State Machine & Utils
import reducer from '@/utils/game-action-sm'
import { initializeGameCheck } from '@/utils/game-checker'
import { installLysandra, updateLysandra, type GameInstallProgress } from '@/utils/game-installer'

export const GameActions: React.FC = () => {
  const { t } = useTranslation() as any

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const {
    isOpen: isInstallModalOpen,
    onOpen: onInstallModalOpen,
    onOpenChange: onInstallModalOpenChange
  } = useDisclosure()

  // State Machine
  const [gameState, dispatch] = React.useReducer(reducer, 'idle')
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [installProgress, setInstallProgress] = React.useState<GameInstallProgress | null>(null)
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0)

  // Écouter les événements de progression du téléchargement
  React.useEffect(() => {
    const setupProgressListener = async () => {
      const unlisten = await listen('download-progress', (event: any) => {
        const { progress_percentage } = event.payload

        setDownloadProgress(progress_percentage)
      })

      return unlisten
    }

    let unlisten: (() => void) | null = null

    setupProgressListener().then((fn) => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  // Demander les permissions de notification au chargement
  React.useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const permissionGranted = await isPermissionGranted()
        if (!permissionGranted) {
          await requestPermission()
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error)
      }
    }

    requestNotificationPermission()
  }, [])

  // Déclencher la vérification au chargement de la page
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Transition Idle → Checking
        dispatch({ type: 'SELECT_GAME' })

        // 2. Vérifier l'état du jeu (qui va initialiser sa structure)
        const result = await initializeGameCheck()

        // 3. Dispatcher l'action selon le résultat
        dispatch({ type: result.action })

        if (result.error) {
          console.error('Game check error:', result.error)
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
        dispatch({ type: 'CHECK_FAIL' })
      }
    }

    initializeApp()
  }, [])

  const sendDownloadCompleteNotification = async (isUpdate: boolean, version?: string) => {
    try {
      const permissionGranted = await isPermissionGranted()
      if (permissionGranted) {
        await sendNotification({
          title: isUpdate ? t('notification.update_complete.title') : t('notification.download_complete.title'),
          body: isUpdate
            ? t('notification.update_complete.body', { version: version || 'unknown' })
            : t('notification.download_complete.body', { game: 'Lysandra', version: version || 'unknown' }),
        })
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  const handleDownloadClick = () => {
    // Ouvrir le modal d'installation/configuration
    onInstallModalOpen()
  }

  const handleInstallConfirm = async (config: InstallConfig) => {
    try {
      setIsDownloading(true)
      setInstallProgress(null)
      setDownloadProgress(0)

      // Déterminer si c'est une installation ou une mise à jour
      const isUpdate = gameState === 'ready' || gameState === 'checking'

      // Si l'utilisateur veut localiser un jeu existant
      if (config.locateExistingGame && config.existingGamePath) {
        // TODO: Implémenter la logique de localisation
        console.log('Locating existing game at:', config.existingGamePath)
        // Pour l'instant, on simule une localisation réussie
        dispatch({ type: 'DOWNLOAD_COMPLETED' })
        setInstallProgress({
          step: 'complete',
          message: t('game.install_modal.locate_confirm') + ' : ' + config.existingGamePath,
        })
        return
      }

      const installFunction = isUpdate ? updateLysandra : installLysandra
      const actionType = isUpdate ? 'UPDATE_COMPLETED' : 'DOWNLOAD_COMPLETED'

      // Lancer l'installation/mise à jour avec suivi du progrès
      const result = await installFunction((progress) => {
        setInstallProgress(progress)
      })

      if (result.success) {
        console.log(`✅ ${isUpdate ? 'Update' : 'Installation'} completed successfully!`)
        dispatch({ type: actionType })
        setInstallProgress({
          step: 'complete',
          message: isUpdate
            ? t('game.install.updated_from_to', {
              oldVersion: 'current',
              newVersion: result.version,
            })
            : t('game.install.complete', { game: 'Lysandra', version: result.version }),
        })

        // Envoyer une notification de fin de téléchargement/mise à jour
        await sendDownloadCompleteNotification(isUpdate, result.version)

        // TODO: Créer les raccourcis si demandés
        if (!isUpdate && config.createDesktopShortcut) {
          console.log('Creating desktop shortcut...')
        }
        if (!isUpdate && config.createStartMenuShortcut) {
          console.log('Creating start menu shortcut...')
        }
      } else {
        console.error(`❌ ${isUpdate ? 'Update' : 'Installation'} failed:`, result.error)
        dispatch({ type: isUpdate ? 'FAILED_TO_UPDATE' : 'FAILED_TO_DOWNLOAD' })
        setInstallProgress({
          step: 'complete',
          message: `${t('debug.error')}: ${result.error}`,
        })
      }
    } catch (error) {
      console.error('Installation/Update error:', error)
      dispatch({ type: 'CHECK_FAIL' })
      setInstallProgress({
        step: 'complete',
        message: `${t('debug.error')}: ${error}`,
      })
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
      // Nettoyer le message après 5 secondes
      setTimeout(() => setInstallProgress(null), 5000)
    }
  }

  const getButtonText = () => {
    if (gameState === 'checking') return t('game.states.checking')
    if (isDownloading) {
      if (installProgress?.step === 'downloading') {
        return `${downloadProgress}%`
      }

      return installProgress?.step === 'extracting'
        ? t('game.states.extracting')
        : installProgress?.step === 'verifying'
          ? t('game.states.verifying')
          : installProgress?.step === 'installing'
            ? t('game.states.installing')
            : installProgress?.step === 'cleaning'
              ? t('game.states.cleaning')
              : t('game.states.processing')
    }
    if (gameState === 'ready') return t('game.states.update')
    if (gameState === 'error' || gameState === 'waitingForRepair') return t('game.states.repair')

    return t('game.states.download')
  }

  return (
    <div className="flex flex-col items-start">
      {/* Debug: Affichage de l'état actuel */}
      <div className="mb-4 text-sm text-gray-500">
        État actuel: <span className="font-mono">{gameState}</span>
      </div>

      {/* Affichage du progrès d'installation */}
      {installProgress && (
        <div className="mb-4 w-full max-w-md">
          <div
            className={`text-muted-foreground mb-1 text-sm ${installProgress.step !== 'downloading' && installProgress.step !== 'complete'
              ? 'animate-pulse'
              : ''
              }`}
          >
            {installProgress.message}
          </div>
          <div className="text-muted-foreground mb-2 text-xs">
            Étape: <span className="font-mono">{installProgress.step}</span>
          </div>

          {/* Barre de progression pour le téléchargement */}
          {installProgress.step === 'downloading' && (
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-x-3">
        <Button
          className={
            (isDownloading && installProgress?.step !== 'downloading') || gameState === 'checking'
              ? 'animate-pulse'
              : ''
          }
          color="primary"
          isDisabled={isDownloading || gameState === 'checking'}
          radius="lg"
          size="lg"
          startContent={<LuCloudDownload size={24} />}
          onPress={handleDownloadClick}
        >
          <span className="w-24 text-end">{getButtonText()}</span>
        </Button>

        <Button isIconOnly radius="lg" size="lg" onPress={onOpen}>
          <LuSettings2 className="text-muted-foreground" size={24} />
        </Button>

        <GameSettingsModal
          isOpen={isOpen}
          onGameUninstalled={() => {
            // Relancer la vérification du jeu après désinstallation
            dispatch({ type: 'SELECT_GAME' })
            setTimeout(async () => {
              const result = await initializeGameCheck()

              dispatch({ type: result.action })
            }, 500)
          }}
          onOpenChange={onOpenChange}
        />

        <InstallGameModal
          isOpen={isInstallModalOpen}
          onOpenChange={onInstallModalOpenChange}
          onInstallConfirm={handleInstallConfirm}
          gameId="lysandra"
          isUpdate={gameState === 'ready' || gameState === 'checking'}
        />
      </div>
    </div>
  )
}
