import { Modal, ModalContent } from '@heroui/modal'
import { Tabs, Tab } from '@heroui/tabs'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const GameSettingsModal: React.FC<Props> = ({ isOpen, onOpenChange }) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} size="3xl" onOpenChange={onOpenChange}>
      <ModalContent>
        <p className="text-muted-foreground absolute left-8 top-6 text-xl">
          {t('game.settings_title')}
        </p>

        <Tabs
          fullWidth
          isVertical
          aria-label={t('settings.aria')}
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

            <div className="mt-4 size-full overflow-y-auto">
              <div>{t('game.size')}</div>
              <div>{t('game.directory')}</div>
              <div>{t('game.check_updates')}</div>
              <div>{t('game.repair')}</div>
              <div>{t('game.locate')}</div>
              <div>{t('game.uninstall')}</div>
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
