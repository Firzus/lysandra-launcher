import { Card, CardBody } from '@heroui/card'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '../features/language-switcher'

import { CheckUpdateButton } from '@/components/settings/app/features/check-update-button'

export const GeneralAppSettings: React.FC = () => {
  const { t } = useTranslation()

  return (
    <>
      <p className="text-muted-foreground mb-2">{t('update.refresh_launcher')}</p>
      {/* Update Client */}
      <Card shadow="none">
        <CardBody className="flex-row justify-between">
          <p>{t('update.check_desc')}</p>
          <CheckUpdateButton className="ml-6" />
        </CardBody>
      </Card>

      <p className="text-muted-foreground mb-2 mt-4">{t('settings.language_client')}</p>
      {/* Language Selection */}
      <Card shadow="none">
        <CardBody className="flex-row justify-between">
          <p>{t('language.desciption')}</p>
          <LanguageSwitcher className="ml-6" />
        </CardBody>
      </Card>

      <div>{t('settings.startup_option')}</div>
      <div>{t('settings.close_client')}</div>
    </>
  )
}
