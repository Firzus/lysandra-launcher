import { Modal, ModalContent } from '@heroui/modal'
import { Tabs, Tab } from '@heroui/tabs'
import { useTranslation } from 'react-i18next'

import { GeneralAppSettings } from './tabs/general-app-settings'

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const AppSettingsModal: React.FC<Props> = ({ isOpen, onOpenChange }) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} size="3xl" onOpenChange={onOpenChange}>
      <ModalContent>
        <p className="text-muted-foreground absolute left-8 top-6 text-xl">{t('settings.title')}</p>

        <Tabs
          fullWidth
          isVertical
          classNames={{
            tabWrapper: 'text-foreground size-full h-[500px]',
            base: 'px-4 py-6 w-[280px]',
            panel: 'pl-6 pr-3 py-6 w-full flex-1 bg-default',
            tabList: 'mt-12',
            tab: 'justify-start',
            // tabContent: '',
          }}
          variant="light"
        >
          <Tab key="general" title={t('settings.general')}>
            <p className="text-lg font-semibold">{t('settings.general')}</p>

            <section className="mt-4 size-full overflow-y-auto pr-3">
              <GeneralAppSettings />
            </section>
          </Tab>

          <Tab key="download" title={t('settings.download')}>
            <p className="text-lg font-semibold">{t('settings.download')}</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{t('settings.download_speed')}</p>
            </div>
          </Tab>

          <Tab key="legal" title={t('settings.legal')}>
            <p className="text-lg font-semibold">{t('settings.legal')}</p>

            <div className="mt-4 size-full overflow-y-auto">
              <p>{t('settings.user_agreement')}</p>
              <p>{t('settings.privacy_policy')}</p>
            </div>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  )
}
