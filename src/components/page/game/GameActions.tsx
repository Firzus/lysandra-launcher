import type { UninstallEvent } from '@/types/uninstall'

import React from 'react'
import { LuCloudDownload, LuSettings2, LuPlay, LuWrench, LuRotateCcw } from 'react-icons/lu'
import { Button, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'

import { useGameDownload } from '@/hooks/useGameDownload'
import { useGameProcessEvents } from '@/hooks/useGameProcessEvents'
import { GameSettingsModal } from '@/components/settings/game/GameSettingsModal'
import {
  InstallGameModal,
  type InstallConfig,
} from '@/components/settings/game/features/InstallGameModal'
import reducer from '@/utils/game-action-sm'
import { initializeGameCheck } from '@/utils/game-checker'
import { downloadAndInstallGame, type GameInstallProgress } from '@/utils/game-installer'
import { repairGame, type GameRepairProgress } from '@/utils/game-repair'
import { launchGame } from '@/utils/game-launcher'
import { isGameInstalled } from '@/utils/game-uninstaller'
import { GAME_IDS } from '@/utils/paths'
import { syncDebugger } from '@/utils/debug-sync'
import { getGameRepository } from '@/utils/game-data'
import { GameInstallConfiguration, type GameInstallResult } from '@/utils/install-config'

export const GameActions: React.FC = () => {
  const { t } = useTranslation()

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const {
    isOpen: isInstallModalOpen,
    onOpen: onInstallModalOpen,
    onOpenChange: onInstallModalOpenChange,
  } = useDisclosure()

  // Hook pour la gestion des téléchargements avancés
  const { getGameDownloadProgress, isGameDownloading } = useGameDownload()

  // State Machine
  const [gameState, dispatch] = React.useReducer(reducer, 'idle')

  // Progress states
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [installProgress, setInstallProgress] = React.useState<GameInstallProgress | null>(null)
  const [repairProgress, setRepairProgress] = React.useState<GameRepairProgress | null>(null)
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [gameInstalled, setGameInstalled] = React.useState<boolean>(false)
  const [uninstallProgress, setUninstallProgress] = React.useState<string | null>(null)

  // Écouter les événements de progression du téléchargement
  React.useEffect(() => {
    const setupProgressListener = async () => {
      const unlisten = await listen('download-progress', (event: any) => {
        const { progress, total } = event.payload
        // Recalculer le pourcentage directement à partir des bytes pour plus de précision
        const calculatedProgress = total > 0 ? Math.round((progress * 100) / total) : 0

        setDownloadProgress(calculatedProgress)
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

  // Logger les changements d'état pour debug
  React.useEffect(() => {
    console.log('🎯 Game state changed to:', gameState)
  }, [gameState])

  // Écouter les événements de désinstallation
  React.useEffect(() => {
    const setupUninstallListener = async () => {
      const unlisten = await listen<UninstallEvent>('game-uninstall', (event) => {
        const { game_id, step, message, success } = event.payload

        if (game_id === GAME_IDS.LYSANDRA) {
          console.log(`🗑️ Uninstall event: ${step} - ${message}`)

          if (step === 'started') {
            // Désinstallation commencée - passer à l'état uninstalling
            dispatch({ type: 'START_UNINSTALL' })
            setUninstallProgress(message)
          } else if (step === 'completed' && success) {
            // Désinstallation réussie - déclencher la transition et re-vérifier
            setUninstallProgress(null)
            setGameInstalled(false)
            dispatch({ type: 'UNINSTALL_COMPLETED' })

            // Re-vérifier après un court délai pour s'assurer que tous les fichiers sont supprimés
            setTimeout(() => {
              forceGameStateRefresh()
            }, 200)
          } else if (step === 'error' && !success) {
            // Erreur de désinstallation
            setUninstallProgress(null)
            setErrorMessage(message)
            dispatch({ type: 'FAILED_TO_UNINSTALL' })
          } else {
            // Mise à jour du progrès pour les autres étapes
            setUninstallProgress(message)
          }
        }
      })

      return unlisten
    }

    let unlisten: (() => void) | null = null

    setupUninstallListener().then((fn) => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  // Debug sync en mode développement
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🐛 Sync debugger initialized in development mode')

      // Ajouter une fonction globale pour tester la sync
      ;(window as any).forceSyncCheck = () => syncDebugger.forceSyncCheck()
      console.log('🔧 Use window.forceSyncCheck() to manually check synchronization')
    }

    return () => {
      if (import.meta.env.DEV) {
        syncDebugger.cleanup()
        delete (window as any).forceSyncCheck
      }
    }
  }, [])

  // Note: État du processus supprimé - plus nécessaire avec le plugin Shell

  // Système d'écoute des événements de processus de jeu en temps réel
  useGameProcessEvents({
    onGameStarting: (gameId) => {
      if (gameId === GAME_IDS.LYSANDRA) {
        console.log('🚀 Game is starting, staying in launching state...')
        // Rester en état "launching" jusqu'à confirmation que le jeu tourne
      }
    },
    onGameRunning: (gameId, processId) => {
      if (gameId === GAME_IDS.LYSANDRA) {
        console.log(`🎮 Game is confirmed running with PID ${processId}`)
        dispatch({ type: 'OPEN_UNITY' })
      }
    },
    onGameStopped: (gameId) => {
      if (gameId === GAME_IDS.LYSANDRA) {
        console.log('🛑 Game has stopped - dispatching CLOSE_UNITY action')
        console.log('Current game state before CLOSE_UNITY:', gameState)
        dispatch({ type: 'CLOSE_UNITY' })
        console.log('CLOSE_UNITY action dispatched')
      }
    },
    onError: (gameId, error) => {
      if (gameId === GAME_IDS.LYSANDRA) {
        console.error('❌ Game process error:', error)
        setErrorMessage(`Process error: ${error}`)
        dispatch({ type: 'FAILED_TO_LAUNCH' })
      }
    },
  })

  // Note: Code debug obsolète supprimé - plus nécessaire avec le plugin Shell

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

      // Créer la configuration d'installation pour le système
      const installConfiguration: GameInstallConfiguration = {
        gameId: GAME_IDS.LYSANDRA,
        customInstallPath: config.installPath,
        createDesktopShortcut: config.createDesktopShortcut,
        createStartMenuShortcut: config.createStartMenuShortcut,
        useCustomPath: Boolean(config.installPath && config.installPath.trim() !== ''),
      }

      console.log('🔧 Install configuration created:', installConfiguration)

      const completedAction = isUpdate ? 'UPDATE_COMPLETED' : 'DOWNLOAD_COMPLETED'
      const failedAction = isUpdate ? 'FAILED_TO_UPDATE' : 'FAILED_TO_DOWNLOAD'

      let result: GameInstallResult

      // Pour les mises à jour ET les nouvelles installations, utiliser la nouvelle fonction avec configuration
      const { owner, repo } = getGameRepository(GAME_IDS.LYSANDRA)
      result = await downloadAndInstallGame(
        GAME_IDS.LYSANDRA,
        owner,
        repo,
        installConfiguration,
        (progress) => {
          setInstallProgress(progress)
        },
      )

      if (result.success) {
        dispatch({ type: completedAction })

        // Mettre à jour l'état d'installation après succès
        const installed = await isGameInstalled(GAME_IDS.LYSANDRA)

        setGameInstalled(installed)

        console.log(`✅ Game installation completed successfully at custom path`)
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

  const forceGameStateRefresh = React.useCallback(async () => {
    console.log('🔄 Force refreshing game state...')

    // Vérifier si le jeu est installé
    const installed = await isGameInstalled(GAME_IDS.LYSANDRA)

    setGameInstalled(installed)

    // Relancer la vérification complète
    const result = await initializeGameCheck()

    dispatch({ type: result.action })

    console.log(`✅ Game state refreshed: installed=${installed}, action=${result.action}`)
  }, [])

  const getButtonConfig = () => {
    // Vérifier s'il y a un téléchargement actif avec le nouveau système
    const activeDownload = getGameDownloadProgress(GAME_IDS.LYSANDRA)
    const hasActiveDownload = isGameDownloading(GAME_IDS.LYSANDRA)

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
        // Utiliser la progression du nouveau système si disponible
        const currentProgress = activeDownload?.percentage || downloadProgress

        return {
          text:
            hasActiveDownload && activeDownload && activeDownload.percentage > 0
              ? `${Math.round(activeDownload.percentage)}%`
              : currentProgress > 0
                ? `${currentProgress}%`
                : installProgress?.message || t('game.states.downloading'),
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
        // Utiliser la progression du nouveau système si disponible
        const updateProgress = activeDownload?.percentage || downloadProgress

        return {
          text:
            hasActiveDownload && activeDownload && activeDownload.percentage > 0
              ? `${Math.round(activeDownload.percentage)}%`
              : updateProgress > 0
                ? `${updateProgress}%`
                : installProgress?.message || t('game.states.downloading'),
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

      case 'uninstalling':
        return {
          text: t('game.states.uninstalling') || 'Désinstallation...',
          icon: LuWrench,
          disabled: true,
          loading: true,
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
      {/* Affichage des erreurs */}
      {errorMessage && gameState === 'error' && (
        <div className="mb-4 w-full max-w-md">
          <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <div className="flex items-start justify-between">
              <div>
                <strong className="font-bold">Erreur:</strong>
                <span className="block sm:inline"> {errorMessage}</span>
              </div>
              <button className="text-red-700 hover:text-red-900" onClick={handleCloseError}>
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affichage du progrès d'installation */}
      {installProgress && (gameState === 'downloading' || gameState === 'updating') && (
        <div className="mb-4 w-full max-w-md">
          <div
            className={`text-muted-foreground mb-1 text-sm ${
              installProgress.step !== 'downloading' && installProgress.step !== 'complete'
                ? 'animate-pulse'
                : ''
            }`}
          >
            {installProgress.message}
          </div>
          <div className="text-muted-foreground mb-2 text-xs">
            Étape: <span className="font-mono">{installProgress.step}</span>
          </div>

          {installProgress.step === 'downloading' && (
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Affichage du progrès de réparation */}
      {repairProgress && gameState === 'repairing' && (
        <div className="mb-4 w-full max-w-md">
          <div
            className={`text-muted-foreground mb-1 text-sm ${
              repairProgress.step !== 'complete' ? 'animate-pulse' : ''
            }`}
          >
            {repairProgress.message}
          </div>
          {repairProgress.details && (
            <div className="text-muted-foreground mb-2 text-xs">{repairProgress.details}</div>
          )}
          {repairProgress.progress && (
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${repairProgress.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Affichage du progrès de désinstallation */}
      {(uninstallProgress || gameState === 'uninstalling') && (
        <div className="mb-4 w-full max-w-md">
          <div className="text-muted-foreground mb-1 animate-pulse text-sm">
            {uninstallProgress || t('game.uninstall_progress.in_progress')}
          </div>
          <div className="text-muted-foreground mb-2 text-xs">
            Étape: <span className="font-mono">uninstalling</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {/* Bouton des paramètres du jeu - masqué si le jeu n'est pas installé */}
        {gameInstalled && (
          <Button
            isIconOnly
            aria-label={t('game.settings_title')}
            radius="lg"
            size="lg"
            onPress={onOpen}
          >
            <LuSettings2 className="text-muted-foreground" size={24} />
          </Button>
        )}

        <Button
          className={`${buttonConfig.loading ? 'animate-pulse' : ''} min-w-40`}
          color="primary"
          isDisabled={buttonConfig.disabled}
          radius="lg"
          size="lg"
          startContent={<buttonConfig.icon size={24} />}
          onPress={handlePrimaryAction}
        >
          <span className="w-32 text-center">{buttonConfig.text}</span>
        </Button>

        <GameSettingsModal
          isOpen={isOpen}
          onGameUninstalled={() => {
            // Nettoyage des états locaux seulement
            // Les événements Tauri gèrent la state machine
            setInstallProgress(null)
            setRepairProgress(null)
            setDownloadProgress(0)
            setErrorMessage(null)
            setIsProcessing(false)
          }}
          onOpenChange={onOpenChange}
        />

        <InstallGameModal
          isOpen={isInstallModalOpen}
          isUpdate={gameState === 'waitingForUpdate'}
          onInstallConfirm={handleInstallConfirm}
          onOpenChange={onInstallModalOpenChange}
        />
      </div>
    </div>
  )
}
