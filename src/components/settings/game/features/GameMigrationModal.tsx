import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Input,
} from '@heroui/react'
import { LuFolder, LuArrowRight, LuTriangleAlert } from 'react-icons/lu'
import { open } from '@tauri-apps/plugin-dialog'

import { migrateGameInstallation } from '@/utils/install-config'

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  gameId: string
  currentPath: string
  onMigrationComplete?: () => void
}

export const GameMigrationModal: React.FC<Props> = ({
  isOpen,
  onOpenChange,
  gameId,
  currentPath,
  onMigrationComplete,
}) => {
  const { t } = useTranslation()
  const [newPath, setNewPath] = useState('')
  const [isLoadingPath, setIsLoadingPath] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState<{
    step: string
    percentage: number
  } | null>(null)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  const handleBrowseNewPath = async () => {
    try {
      setIsLoadingPath(true)
      const selectedPath = await open({
        title: t('game.install_modal.select_install_folder'),
        defaultPath: newPath || '',
        directory: true,
        multiple: false,
      })

      if (selectedPath) {
        setNewPath(selectedPath)
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
    } finally {
      setIsLoadingPath(false)
    }
  }

  const handleMigrate = async () => {
    if (!newPath.trim()) {
      return
    }

    try {
      setIsMigrating(true)
      setMigrationError(null)
      setMigrationProgress({ step: 'Démarrage...', percentage: 0 })

      const result = await migrateGameInstallation(gameId, newPath, (progress) => {
        setMigrationProgress(progress)
      })

      if (result.success) {
        setMigrationProgress({ step: t('game.install_modal.migration_success'), percentage: 100 })
        setTimeout(() => {
          onMigrationComplete?.()
          onOpenChange(false)
        }, 2000)
      } else {
        setMigrationError(result.error || t('game.install_modal.migration_failed'))
      }
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleClose = () => {
    if (!isMigrating) {
      setNewPath('')
      setMigrationProgress(null)
      setMigrationError(null)
      onOpenChange(false)
    }
  }

  const isValidPath = newPath.trim() !== '' && newPath !== currentPath

  return (
    <Modal isOpen={isOpen} isDismissable={!isMigrating} size="lg" onOpenChange={handleClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <LuFolder className="text-primary" size={24} />
                <span>Migrer l'installation</span>
              </div>
            </ModalHeader>

            <ModalBody className="gap-6">
              {/* Chemin actuel */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Emplacement actuel</h4>
                <div className="bg-default-100 rounded-lg p-3">
                  <p className="text-muted-foreground text-sm break-all">{currentPath}</p>
                </div>
              </div>

              {/* Flèche de migration */}
              <div className="flex justify-center">
                <LuArrowRight className="text-muted-foreground" size={24} />
              </div>

              {/* Nouveau chemin */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Nouvel emplacement</h4>
                <Input
                  endContent={
                    <Button
                      isIconOnly
                      aria-label="Parcourir"
                      isDisabled={isMigrating}
                      isLoading={isLoadingPath}
                      size="sm"
                      variant="light"
                      onPress={handleBrowseNewPath}
                    >
                      <LuFolder size={16} />
                    </Button>
                  }
                  isDisabled={isMigrating}
                  placeholder="Sélectionner le nouveau dossier..."
                  value={newPath}
                  onValueChange={setNewPath}
                />
              </div>

              {/* Avertissement */}
              <div className="border-warning-200 bg-warning-50 rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <LuTriangleAlert className="text-warning-600 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-warning-800 text-sm font-medium">Attention</p>
                    <p className="text-warning-700 text-xs">
                      Cette opération déplacera tous les fichiers du jeu vers le nouvel emplacement.
                      Assurez-vous d'avoir suffisamment d'espace libre.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progression de migration */}
              {migrationProgress && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    {t('game.install_modal.migration_in_progress')}
                  </h4>
                  <Progress
                    color="primary"
                    label={migrationProgress.step}
                    size="sm"
                    value={migrationProgress.percentage}
                  />
                </div>
              )}

              {/* Erreur de migration */}
              {migrationError && (
                <div className="border-danger-200 bg-danger-50 rounded-lg border p-3">
                  <p className="text-danger-800 text-sm">{migrationError}</p>
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button
                color="default"
                isDisabled={isMigrating}
                variant="light"
                onPress={handleClose}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                isDisabled={!isValidPath || isMigrating}
                isLoading={isMigrating}
                onPress={handleMigrate}
              >
                {isMigrating ? 'Migration...' : 'Migrer'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
