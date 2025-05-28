import { Button } from '@heroui/button'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Checkbox } from '@heroui/checkbox'
import { Input } from '@heroui/input'
import { Divider } from '@heroui/divider'
import { useState, useEffect } from 'react'
import { LuFolder, LuFolderOpen, LuDownload, LuMapPin, LuCheck, LuX, LuLoader } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { open } from '@tauri-apps/plugin-dialog'

import { getLauncherPaths } from '@/utils/paths'
import { AutoDetectionPanel } from './AutoDetectionPanel'
import { validateGameInstallation } from '@/utils/game-auto-detection'
import type { ValidationResult } from '@/types/game-detection'

type InstallConfig = {
  installPath: string
  createDesktopShortcut: boolean
  createStartMenuShortcut: boolean
  locateExistingGame: boolean
  existingGamePath?: string
}

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onInstallConfirm: (config: InstallConfig) => void
  isUpdate?: boolean
}

export const InstallGameModal: React.FC<Props> = ({
  isOpen,
  onOpenChange,
  onInstallConfirm,
  isUpdate = false,
}) => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<InstallConfig>({
    installPath: '',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    locateExistingGame: false,
    existingGamePath: '',
  })
  const [isLoadingPath, setIsLoadingPath] = useState(false)
  const [isValidatingPath, setIsValidatingPath] = useState(false)
  const [pathValidation, setPathValidation] = useState<ValidationResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Fonction pour valider le chemin d'un jeu existant
  const validateExistingGamePath = async (path: string) => {
    if (!path || path.trim() === '') {
      setPathValidation(null)
      setValidationError(null)
      return
    }

    try {
      setIsValidatingPath(true)
      setValidationError(null)

      console.log('🔍 Validating existing game path:', path)
      const result = await validateGameInstallation(path)

      setPathValidation(result)

      if (!result.is_valid) {
        if (!result.path_accessible) {
          setValidationError(t('game.install_modal.path_not_accessible'))
        } else if (!result.executable_exists) {
          setValidationError(t('game.install_modal.no_executable_found'))
        } else if (!result.is_game_directory) {
          setValidationError(t('game.install_modal.not_game_directory'))
        } else {
          setValidationError(t('game.install_modal.validation_failed'))
        }
      }
    } catch (error) {
      console.error('❌ Failed to validate game path:', error)
      setValidationError(t('game.install_modal.validation_error'))
      setPathValidation(null)
    } finally {
      setIsValidatingPath(false)
    }
  }

  // Valider automatiquement quand le chemin change
  useEffect(() => {
    if (config.locateExistingGame && config.existingGamePath) {
      // Débounce de 500ms pour éviter trop d'appels
      const timeoutId = setTimeout(() => {
        validateExistingGamePath(config.existingGamePath!)
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setPathValidation(null)
      setValidationError(null)
    }
  }, [config.existingGamePath, config.locateExistingGame])

  // Réinitialiser la validation quand on ferme/ouvre le modal
  useEffect(() => {
    if (!isOpen) {
      setPathValidation(null)
      setValidationError(null)
      setIsValidatingPath(false)
    }
  }, [isOpen])

  // Initialiser le chemin par défaut
  useEffect(() => {
    const initDefaultPath = async () => {
      try {
        const launcherPaths = await getLauncherPaths()

        setConfig((prev) => ({
          ...prev,
          installPath: launcherPaths.games,
        }))
      } catch (error) {
        console.error('Failed to get default install path:', error)
      }
    }

    if (isOpen) {
      initDefaultPath()
    }
  }, [isOpen])

  const handleBrowseInstallPath = async () => {
    try {
      setIsLoadingPath(true)
      const selectedPath = await open({
        title: t('game.install_modal.select_install_folder'),
        defaultPath: config.installPath,
        directory: true,
        multiple: false,
      })

      if (selectedPath) {
        setConfig((prev) => ({
          ...prev,
          installPath: selectedPath,
        }))
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
    } finally {
      setIsLoadingPath(false)
    }
  }

  const handleBrowseExistingGame = async () => {
    try {
      setIsLoadingPath(true)
      const selectedPath = await open({
        title: t('game.install_modal.locate_existing_game'),
        defaultPath: config.existingGamePath || '',
        directory: true,
        multiple: false,
      })

      if (selectedPath) {
        setConfig((prev) => ({
          ...prev,
          existingGamePath: selectedPath,
        }))
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
    } finally {
      setIsLoadingPath(false)
    }
  }

  const handleAutoDetectionSelection = (path: string, executable?: string) => {
    setConfig((prev) => ({
      ...prev,
      existingGamePath: path,
      // Optionellement stocker l'exécutable suggéré dans les métadonnées
    }))
    console.log('✅ Auto-detection selected:', path, 'executable:', executable)
  }

  const handleConfirm = () => {
    onInstallConfirm(config)
    onOpenChange(false)
  }

  const isConfigValid = () => {
    if (config.locateExistingGame) {
      // Pour localiser un jeu existant, il faut que le chemin soit valide
      return config.existingGamePath &&
        config.existingGamePath.trim() !== '' &&
        pathValidation?.is_valid === true &&
        !isValidatingPath
    }

    return config.installPath && config.installPath.trim() !== ''
  }

  const getValidationIcon = () => {
    if (isValidatingPath) {
      return <LuLoader className="animate-spin text-default-400" size={16} />
    }

    if (pathValidation?.is_valid) {
      return <LuCheck className="text-success" size={16} />
    }

    if (pathValidation !== null && !pathValidation.is_valid) {
      return <LuX className="text-danger" size={16} />
    }

    return null
  }

  return (
    <Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <LuDownload className="text-primary" size={24} />
                <span>
                  {isUpdate
                    ? t('game.install_modal.update_title')
                    : t('game.install_modal.install_title')}
                </span>
              </div>
            </ModalHeader>

            <ModalBody className="gap-6">
              {/* Option : Localiser un jeu existant */}
              <div className="space-y-3">
                <Checkbox
                  color="primary"
                  isSelected={config.locateExistingGame}
                  size="sm"
                  onValueChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      locateExistingGame: checked,
                      existingGamePath: checked ? prev.existingGamePath : '',
                    }))
                  }
                >
                  <span className="text-sm font-medium">
                    {t('game.install_modal.locate_existing')}
                  </span>
                </Checkbox>

                <p className="text-muted-foreground ml-6 text-xs">
                  {t('game.install_modal.locate_existing_desc')}
                </p>

                {config.locateExistingGame && (
                  <div className="ml-6 space-y-4">
                    <Input
                      endContent={
                        <div className="flex items-center gap-2">
                          {getValidationIcon()}
                          <Button
                            isIconOnly
                            aria-label={t('game.install_modal.browse_existing_game')}
                            isLoading={isLoadingPath}
                            size="sm"
                            variant="light"
                            onPress={handleBrowseExistingGame}
                          >
                            <LuFolderOpen size={16} />
                          </Button>
                        </div>
                      }
                      label={t('game.install_modal.existing_game_path')}
                      placeholder={t('game.install_modal.existing_game_path_placeholder')}
                      value={config.existingGamePath || ''}
                      onValueChange={(value) =>
                        setConfig((prev) => ({ ...prev, existingGamePath: value }))
                      }
                    />

                    {/* Affichage des résultats de validation */}
                    {config.existingGamePath && config.existingGamePath.trim() !== '' && (
                      <div className="space-y-2">
                        {isValidatingPath && (
                          <p className="text-xs text-default-500 flex items-center gap-2">
                            <LuLoader className="animate-spin" size={12} />
                            {t('game.install_modal.validation_in_progress')}
                          </p>
                        )}

                        {pathValidation && pathValidation.is_valid && (
                          <div className="space-y-1">
                            <p className="text-xs text-success flex items-center gap-2">
                              <LuCheck size={12} />
                              {t('game.install_modal.validation_success')}
                            </p>
                            {pathValidation.suggested_executable && (
                              <p className="text-xs text-default-500">
                                {t('game.install_modal.suggested_executable', {
                                  executable: pathValidation.suggested_executable
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {validationError && (
                          <p className="text-xs text-danger flex items-center gap-2">
                            <LuX size={12} />
                            {validationError}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Divider entre sélection manuelle et automatique */}
                    <Divider />

                    {/* Panneau de détection automatique */}
                    <AutoDetectionPanel
                      gameNameToSearch="Lysandra"
                      onInstallationSelected={handleAutoDetectionSelection}
                      isSearching={isLoadingPath}
                    />
                  </div>
                )}
              </div>

              {/* Dossier d'installation (si pas de localisation) */}
              {!config.locateExistingGame && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    {t('game.install_modal.installation_settings')}
                  </h4>

                  <Input
                    endContent={
                      <Button
                        isIconOnly
                        aria-label={t('game.install_modal.browse_install_path')}
                        isLoading={isLoadingPath}
                        size="sm"
                        variant="light"
                        onPress={handleBrowseInstallPath}
                      >
                        <LuFolder size={16} />
                      </Button>
                    }
                    label={t('game.install_modal.install_path')}
                    placeholder={t('game.install_modal.install_path_placeholder')}
                    value={config.installPath}
                    onValueChange={(value) =>
                      setConfig((prev) => ({ ...prev, installPath: value }))
                    }
                  />
                </div>
              )}

              {/* Options de raccourcis (seulement pour nouvelle installation) */}
              {!config.locateExistingGame && !isUpdate && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">{t('game.install_modal.shortcuts')}</h4>

                  <div className="space-y-2">
                    <Checkbox
                      color="primary"
                      isSelected={config.createDesktopShortcut}
                      size="sm"
                      onValueChange={(checked) =>
                        setConfig((prev) => ({ ...prev, createDesktopShortcut: checked }))
                      }
                    >
                      <span className="text-sm">{t('game.install_modal.desktop_shortcut')}</span>
                    </Checkbox>

                    <Checkbox
                      color="primary"
                      isSelected={config.createStartMenuShortcut}
                      size="sm"
                      onValueChange={(checked) =>
                        setConfig((prev) => ({ ...prev, createStartMenuShortcut: checked }))
                      }
                    >
                      <span className="text-sm">{t('game.install_modal.start_menu_shortcut')}</span>
                    </Checkbox>
                  </div>
                </div>
              )}

              {/* Informations sur l'espace disque */}
              <div className="rounded-lg bg-default-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <LuMapPin className="text-muted-foreground" size={16} />
                  <span className="text-sm font-medium">
                    {t('game.install_modal.disk_space_info')}
                  </span>
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <p>{t('game.install_modal.required_space')}: ~2.5 GB</p>
                  <p>{t('game.install_modal.recommended_space')}: ~5 GB</p>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                {t('game.install_modal.cancel')}
              </Button>
              <Button
                color="primary"
                isDisabled={!isConfigValid()}
                startContent={<LuDownload size={16} />}
                onPress={handleConfirm}
              >
                {config.locateExistingGame
                  ? t('game.install_modal.locate_confirm')
                  : isUpdate
                    ? t('game.install_modal.update_confirm')
                    : t('game.install_modal.install_confirm')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export type { InstallConfig }
