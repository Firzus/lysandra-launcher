import React from 'react'
import { LuCloudDownload, LuSettings2, LuPlay, LuWrench, LuRotateCcw } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification'

import { GameSettingsModal } from '@/components/settings/game/game-settings-modal'
import {
  InstallGameModal,
  type InstallConfig,
} from '@/components/settings/game/features/install-game-modal'
import reducer from '@/utils/game-action-sm'
import { initializeGameCheck } from '@/utils/game-checker'
import { installLysandra, updateLysandra, type GameInstallProgress } from '@/utils/game-installer'
import { repairGame, type GameRepairProgress } from '@/utils/game-repair'
import { launchGame, startGameProcessMonitoring } from '@/utils/game-launcher'
import { isGameInstalled } from '@/utils/game-uninstaller'
import { GAME_IDS } from '@/utils/paths'

export const GameActions: React.FC = () => {
  const { t } = useTranslation() as any

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const {
    isOpen: isInstallModalOpen,
    onOpen: onInstallModalOpen,
    onOpenChange: onInstallModalOpenChange,
  } = useDisclosure()

  // State Machine
  const [gameState, dispatch] = React.useReducer(reducer, 'idle')

  // Progress states
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [installProgress, setInstallProgress] = React.useState<GameInstallProgress | null>(null)
  const [repairProgress, setRepairProgress] = React.useState<GameRepairProgress | null>(null)
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [gameInstalled, setGameInstalled] = React.useState<boolean>(false)

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
      } catch {
        // Notification permission error handled silently
      }
    }
    requestNotificationPermission()
  }, [])

  // Surveillance du processus de jeu pour les transitions Playing ↔ Ready
  React.useEffect(() => {
    if (gameState === 'launching' || gameState === 'playing') {
      const stopMonitoring = startGameProcessMonitoring(
        GAME_IDS.LYSANDRA,
        () => dispatch({ type: 'OPEN_UNITY' }),
        () => dispatch({ type: 'CLOSE_UNITY' })
      )

      return stopMonitoring
    }
  }, [gameState])

  // Déclencher la vérification au chargement de la page
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SELECT_GAME' })
        const result = await initializeGameCheck()
        dispatch({ type: result.action })

        // Vérifier si le jeu est installé pour afficher/masquer le bouton des paramètres
        const installed = await isGameInstalled(GAME_IDS.LYSANDRA)
        setGameInstalled(installed)

        if (result.error && result.action === 'CHECK_FAIL') {
          setErrorMessage(result.error)
        }
      } catch (error) {
        dispatch({ type: 'CHECK_FAIL' })
        setErrorMessage(`Initialization failed: ${error}`)
      }
    }
    initializeApp()
  }, [])

  // Gestion des actions selon l'état
  const handlePrimaryAction = async () => {
    switch (gameState) {
      case 'waitingForDownload':
        onInstallModalOpen()
        break

      case 'waitingForUpdate':
        onInstallModalOpen()
        break

      case 'waitingForRepair':
        await handleRepair()
        break

      case 'ready':
        await handlePlay()
        break

      default:
        console.log(`No action defined for state: ${gameState}`)
    }
  }

  const handleInstallConfirm = async (config: InstallConfig) => {
    try {
      setIsProcessing(true)
      setInstallProgress(null)
      setDownloadProgress(0)

      const isUpdate = gameState === 'waitingForUpdate'
      dispatch({ type: isUpdate ? 'CLICK_UPDATE_BUTTON' : 'CLICK_DOWNLOAD_BUTTON' })

      if (config.locateExistingGame && config.existingGamePath) {
        // TODO: Implémenter la logique de localisation
        setInstallProgress({
          step: 'complete',
          message: t('game.install_modal.locate_confirm') + ' : ' + config.existingGamePath,
        })
        dispatch({ type: isUpdate ? 'UPDATE_COMPLETED' : 'DOWNLOAD_COMPLETED' })
        return
      }

      const installFunction = isUpdate ? updateLysandra : installLysandra
      const completedAction = isUpdate ? 'UPDATE_COMPLETED' : 'DOWNLOAD_COMPLETED'
      const failedAction = isUpdate ? 'FAILED_TO_UPDATE' : 'FAILED_TO_DOWNLOAD'

      const result = await installFunction((progress) => {
        setInstallProgress(progress)
      })

      if (result.success) {
        dispatch({ type: completedAction })
        await sendDownloadCompleteNotification(isUpdate, result.version)

        // Mettre à jour l'état d'installation après succès
        const installed = await isGameInstalled(GAME_IDS.LYSANDRA)
        setGameInstalled(installed)
      } else {
        dispatch({ type: failedAction })
        setErrorMessage(result.error || 'Installation failed')
      }
    } catch (error) {
      const failedAction = gameState === 'updating' ? 'FAILED_TO_UPDATE' : 'FAILED_TO_DOWNLOAD'
      dispatch({ type: failedAction })
      setErrorMessage(`Installation error: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRepair = async () => {
    try {
      setIsProcessing(true)
      setRepairProgress(null)
      dispatch({ type: 'CLICK_REPAIR_BUTTON' })

      const result = await repairGame(GAME_IDS.LYSANDRA, (progress) => {
        setRepairProgress(progress)
      })

      if (result.success) {
        dispatch({ type: 'SUCCESS_REPAIR' })
        // Re-vérifier le jeu après réparation
        setTimeout(async () => {
          const checkResult = await initializeGameCheck()
          dispatch({ type: checkResult.action })
        }, 1000)
      } else {
        dispatch({ type: 'CHECK_FAIL' })
        setErrorMessage(result.error || 'Repair failed')
      }
    } catch (error) {
      dispatch({ type: 'CHECK_FAIL' })
      setErrorMessage(`Repair error: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePlay = async () => {
    try {
      dispatch({ type: 'CLICK_PLAY_BUTTON' })

      const result = await launchGame(GAME_IDS.LYSANDRA)

      if (result.success) {
        // La transition vers 'playing' sera gérée par le monitoring des processus
        console.log('Game launch initiated, waiting for process detection...')
      } else {
        dispatch({ type: 'FAILED_TO_LAUNCH' })
        setErrorMessage(result.error || 'Failed to launch game')
      }
    } catch (error) {
      dispatch({ type: 'FAILED_TO_LAUNCH' })
      setErrorMessage(`Launch error: ${error}`)
    }
  }

  const handleCloseError = () => {
    setErrorMessage(null)
    dispatch({ type: 'CLOSE_ERROR_MESSAGE' })
  }

  const sendDownloadCompleteNotification = async (isUpdate: boolean, version?: string) => {
    try {
      const permissionGranted = await isPermissionGranted()
      if (permissionGranted) {
        await sendNotification({
          title: isUpdate
            ? t('notification.update_complete.title')
            : t('notification.download_complete.title'),
          body: isUpdate
            ? t('notification.update_complete.body', { version: version || 'unknown' })
            : t('notification.download_complete.body', {
              game: 'Lysandra',
              version: version || 'unknown',
            }),
        })
      }
    } catch {
      // Notification error handled silently
    }
  }

  const getButtonConfig = () => {
    switch (gameState) {
      case 'checking':
        return {
          text: t('game.states.checking'),
          icon: LuRotateCcw,
          disabled: true,
          loading: true,
        }

      case 'waitingForDownload':
        return {
          text: t('game.states.download'),
          icon: LuCloudDownload,
          disabled: isProcessing,
          loading: false,
        }

      case 'downloading':
        return {
          text: installProgress?.step === 'downloading'
            ? `${downloadProgress}%`
            : t(`game.install.${installProgress?.step || 'processing'}`),
          icon: LuCloudDownload,
          disabled: true,
          loading: true,
        }

      case 'waitingForUpdate':
        return {
          text: t('game.states.update'),
          icon: LuCloudDownload,
          disabled: isProcessing,
          loading: false,
        }

      case 'updating':
        return {
          text: installProgress?.step === 'downloading'
            ? `${downloadProgress}%`
            : t(`game.install.${installProgress?.step || 'processing'}`),
          icon: LuCloudDownload,
          disabled: true,
          loading: true,
        }

      case 'waitingForRepair':
        return {
          text: t('game.states.repair'),
          icon: LuWrench,
          disabled: isProcessing,
          loading: false,
        }

      case 'repairing':
        return {
          text: repairProgress?.message || t('game.states.repair'),
          icon: LuWrench,
          disabled: true,
          loading: true,
        }

      case 'ready':
        return {
          text: t('game.states.play'),
          icon: LuPlay,
          disabled: isProcessing,
          loading: false,
        }

      case 'launching':
        return {
          text: t('game.states.launching'),
          icon: LuPlay,
          disabled: true,
          loading: true,
        }

      case 'playing':
        return {
          text: t('game.states.playing'),
          icon: LuPlay,
          disabled: true,
          loading: false,
        }

      case 'error':
        return {
          text: t('game.states.error'),
          icon: LuWrench,
          disabled: false,
          loading: false,
        }

      default:
        return {
          text: t('game.states.unknown'),
          icon: LuCloudDownload,
          disabled: true,
          loading: false,
        }
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <div className="flex flex-col items-start">
      {/* Debug: Affichage de l'état actuel */}
      <div className="mb-4 text-sm text-gray-500">
        État actuel: <span className="font-mono">{gameState}</span>
      </div>

      {/* Affichage des erreurs */}
      {errorMessage && gameState === 'error' && (
        <div className="mb-4 w-full max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between items-start">
              <div>
                <strong className="font-bold">Erreur:</strong>
                <span className="block sm:inline"> {errorMessage}</span>
              </div>
              <button
                className="text-red-700 hover:text-red-900"
                onClick={handleCloseError}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affichage du progrès d'installation */}
      {installProgress && (gameState === 'downloading' || gameState === 'updating') && (
        <div className="mb-4 w-full max-w-md">
          <div className={`text-muted-foreground mb-1 text-sm ${installProgress.step !== 'downloading' && installProgress.step !== 'complete'
            ? 'animate-pulse'
            : ''
            }`}>
            {installProgress.message}
          </div>
          <div className="text-muted-foreground mb-2 text-xs">
            Étape: <span className="font-mono">{installProgress.step}</span>
          </div>

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

      {/* Affichage du progrès de réparation */}
      {repairProgress && gameState === 'repairing' && (
        <div className="mb-4 w-full max-w-md">
          <div className={`text-muted-foreground mb-1 text-sm ${repairProgress.step !== 'complete' ? 'animate-pulse' : ''
            }`}>
            {repairProgress.message}
          </div>
          {repairProgress.details && (
            <div className="text-muted-foreground mb-2 text-xs">
              {repairProgress.details}
            </div>
          )}
          {repairProgress.progress && (
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${repairProgress.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          className={buttonConfig.loading ? 'animate-pulse' : ''}
          color="primary"
          isDisabled={buttonConfig.disabled}
          radius="lg"
          size="lg"
          startContent={<buttonConfig.icon size={24} />}
          onPress={handlePrimaryAction}
        >
          <span className="w-24 text-end">{buttonConfig.text}</span>
        </Button>

        {/* Bouton des paramètres du jeu - masqué si le jeu n'est pas installé */}
        {gameInstalled && (
          <Button isIconOnly radius="lg" size="lg" onPress={onOpen}>
            <LuSettings2 className="text-muted-foreground" size={24} />
          </Button>
        )}

        <GameSettingsModal
          isOpen={isOpen}
          onGameUninstalled={async () => {
            dispatch({ type: 'SELECT_GAME' })

            // Mettre à jour l'état d'installation après désinstallation
            const installed = await isGameInstalled(GAME_IDS.LYSANDRA)
            setGameInstalled(installed)

            setTimeout(async () => {
              const result = await initializeGameCheck()
              dispatch({ type: result.action })
            }, 500)
          }}
          onOpenChange={onOpenChange}
        />

        <InstallGameModal
          gameId="lysandra"
          isOpen={isInstallModalOpen}
          isUpdate={gameState === 'waitingForUpdate'}
          onInstallConfirm={handleInstallConfirm}
          onOpenChange={onInstallModalOpenChange}
        />
      </div>
    </div>
  )
}
