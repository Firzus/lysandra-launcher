import {
  Button,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react'
import { useState } from 'react'
import { LuTrash2, LuInfo } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'

import { uninstallLysandra, uninstallLysandraCompletely } from '@/utils/game-uninstaller'

type Props = {
  className?: string
  onUninstallComplete?: () => void
}

export const UninstallGameButton: React.FC<Props> = ({ className, onUninstallComplete }) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [isUninstalling, setIsUninstalling] = useState(false)
  const [deleteAllData, setDeleteAllData] = useState(false)

  const handleUninstall = async () => {
    try {
      setIsUninstalling(true)

      const result = deleteAllData ? await uninstallLysandraCompletely() : await uninstallLysandra()

      if (result.success) {
        console.log('✅ Game uninstalled successfully')
        if (onUninstallComplete) {
          onUninstallComplete()
        }
        onOpenChange()
      } else {
        console.error('❌ Uninstall failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Uninstall error:', error)
    } finally {
      setIsUninstalling(false)
    }
  }

  return (
    <>
      <Button
        className={className}
        color="danger"
        size="sm"
        startContent={<LuTrash2 size={16} />}
        variant="flat"
        onPress={onOpen}
      >
        {t('game.uninstall')}
      </Button>

      <Modal isOpen={isOpen} size="md" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <LuInfo className="text-warning" size={24} />
                  <span>{t('game.uninstall_modal.title')}</span>
                </div>
              </ModalHeader>

              <ModalBody>
                <p className="text-muted-foreground mb-4 text-sm">
                  {t('game.uninstall_modal.description')}
                </p>

                <div className="border-warning-200 bg-warning-50 mb-4 rounded-lg border p-3">
                  <p className="text-warning-800 text-sm">
                    {t('game.uninstall_modal.keep_saves_info')}
                  </p>
                </div>

                <Checkbox
                  color="danger"
                  isSelected={deleteAllData}
                  size="sm"
                  onValueChange={setDeleteAllData}
                >
                  <span className="text-sm">
                    {t('game.uninstall_modal.delete_all_data')}
                    <span className="text-danger font-medium">
                      {' '}
                      {t('game.uninstall_modal.irreversible')}
                    </span>
                  </span>
                </Checkbox>

                {deleteAllData && (
                  <div className="border-danger-200 bg-danger-50 mt-3 rounded-lg border p-3">
                    <p className="text-danger-800 text-sm">
                      {t('game.uninstall_modal.warning_complete')}
                    </p>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  color="default"
                  isDisabled={isUninstalling}
                  variant="light"
                  onPress={onClose}
                >
                  {t('game.uninstall_modal.cancel')}
                </Button>
                <Button
                  color="danger"
                  isLoading={isUninstalling}
                  startContent={!isUninstalling ? <LuTrash2 size={16} /> : undefined}
                  onPress={handleUninstall}
                >
                  {isUninstalling
                    ? t('game.uninstall_modal.in_progress')
                    : t('game.uninstall_modal.confirm')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
