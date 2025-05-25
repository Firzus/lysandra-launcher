import { Button } from '@heroui/button'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Checkbox } from '@heroui/checkbox'
import { Input } from '@heroui/input'
import { useState, useEffect } from 'react'
import { LuFolder, LuFolderOpen, LuDownload, LuMapPin } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'

import { getGamePaths } from '@/utils/paths'

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
  gameId: string
  isUpdate?: boolean
}

export const InstallGameModal: React.FC<Props> = ({
  isOpen,
  onOpenChange,
  onInstallConfirm,
  gameId,
  isUpdate = false,
}) => {
  const { t } = useTranslation() as any
  const [config, setConfig] = useState<InstallConfig>({
    installPath: '',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    locateExistingGame: false,
    existingGamePath: '',
  })
  const [isLoadingPath, setIsLoadingPath] = useState(false)

  // Initialiser le chemin par défaut
  useEffect(() => {
    const initDefaultPath = async () => {
      try {
        const gamePaths = await getGamePaths(gameId)

        setConfig((prev) => ({
          ...prev,
          installPath: gamePaths.install,
        }))
      } catch (error) {
        console.error('Failed to get default install path:', error)
      }
    }

    if (isOpen) {
      initDefaultPath()
    }
  }, [isOpen, gameId])

  const handleBrowseInstallPath = async () => {
    try {
      setIsLoadingPath(true)
      const selectedPath = await invoke<string | null>('open_folder_dialog', {
        title: t('game.install_modal.select_install_folder'),
        default_path: config.installPath,
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
      const selectedPath = await invoke<string | null>('open_folder_dialog', {
        title: t('game.install_modal.locate_existing_game'),
        default_path: config.existingGamePath || '',
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

  const handleConfirm = () => {
    onInstallConfirm(config)
    onOpenChange(false)
  }

  const isConfigValid = () => {
    if (config.locateExistingGame) {
      return config.existingGamePath && config.existingGamePath.trim() !== ''
    }

    return config.installPath && config.installPath.trim() !== ''
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
                  <div className="ml-6 space-y-2">
                    <Input
                      endContent={
                        <Button
                          isIconOnly
                          isLoading={isLoadingPath}
                          size="sm"
                          variant="light"
                          onPress={handleBrowseExistingGame}
                        >
                          <LuFolderOpen size={16} />
                        </Button>
                      }
                      label={t('game.install_modal.existing_game_path')}
                      placeholder={t('game.install_modal.existing_game_path_placeholder')}
                      value={config.existingGamePath || ''}
                      onValueChange={(value) =>
                        setConfig((prev) => ({ ...prev, existingGamePath: value }))
                      }
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
