import { Modal, ModalContent, Tabs, Tab, Card, CardBody } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import { UninstallGameButton } from './features/UninstallGameButton'
import { GameSizeDisplay } from './features/GameSizeDisplay'
import { OpenGameFolderButton } from './features/OpenGameFolderButton'

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onGameUninstalled?: () => void
}

export const GameSettingsModal: React.FC<Props> = ({ isOpen, onOpenChange, onGameUninstalled }) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} size="3xl" onOpenChange={onOpenChange}>
      <ModalContent>
        <p className="text-muted-foreground absolute top-6 left-8 text-xl">
          {t('game.settings_title')}
        </p>

        <Tabs
          fullWidth
          isVertical
          classNames={{
            tabWrapper: 'text-foreground size-full h-[500px]',
            base: 'px-4 py-6 w-[280px]',
            panel: 'p-6 w-full flex-1 bg-default',
            tabList: 'mt-12',
            tab: 'justify-start',
            tabContent: '',
          }}
          variant="light"
        >
          <Tab key="infos" title={t('game.infos')}>
            <p className="text-lg font-semibold">{t('game.infos')}</p>

            <div className="mt-4 size-full space-y-6 overflow-y-auto">
              {/* Section Taille du jeu */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('game.actions.game_size')}</p>
                    <p className="text-muted-foreground text-xs">
                      {t('game.actions.game_size_desc')}
                    </p>
                  </div>
                  <GameSizeDisplay />
                </div>
              </div>

              {/* Section Actions */}
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm font-medium">
                  {t('game.actions.title')}
                </p>

                {/* Dossier du jeu */}
                <Card shadow="none">
                  <CardBody className="flex-row items-center justify-between">
                    <div>
                      <p className="font-medium">{t('game.actions.open_folder')}</p>
                      <p className="text-muted-foreground text-xs">
                        {t('game.actions.open_folder_desc')}
                      </p>
                    </div>
                    <OpenGameFolderButton />
                  </CardBody>
                </Card>

                {/* Désinstallation */}
                <Card className="border-danger-200" shadow="none">
                  <CardBody className="flex-row items-center justify-between">
                    <div>
                      <p className="text-danger font-medium">{t('game.actions.uninstall_game')}</p>
                      <p className="text-muted-foreground text-xs">
                        {t('game.actions.uninstall_game_desc')}
                      </p>
                    </div>
                    <UninstallGameButton
                      onUninstallComplete={() => {
                        if (onGameUninstalled) {
                          onGameUninstalled()
                        }
                        onOpenChange(false)
                      }}
                    />
                  </CardBody>
                </Card>
              </div>
            </div>
          </Tab>

          <Tab key="logs" title={t('game.logs')}>
            <p className="text-lg font-semibold">{t('game.logs')}</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{t('game.logs_content')}</p>
            </div>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  )
}
