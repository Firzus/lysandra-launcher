import { Card, CardBody } from '@heroui/card'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '../features/language-switcher'
import { AutostartToggle } from '../features/autostart-toggle'
import { DebugLauncherStructure } from '../features/debug-launcher-structure'
import { DebugShowLauncherPath } from '../features/debug-show-launcher-path'

import { CheckUpdateButton } from '@/components/settings/app/features/check-update-button'

export const GeneralAppSettings: React.FC = () => {
  const { t } = useTranslation() as any

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

      <p className="text-muted-foreground mb-2 mt-4">{t('settings.autostart.title')}</p>
      {/* Autostart Option */}
      <Card shadow="none">
        <CardBody className="flex-row justify-between">
          <div>
            <p className="font-medium">{t('settings.autostart.title')}</p>
            <p className="text-muted-foreground text-xs">{t('settings.autostart.description')}</p>
          </div>
          <AutostartToggle className="ml-6" />
        </CardBody>
      </Card>

      <div>{t('settings.startup_option')}</div>
      <div>{t('settings.close_client')}</div>

      {/* Section Debug - Seulement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <p className="text-muted-foreground mb-2 mt-6">{t('debug.title')}</p>

          {/* Créer structure */}
          <Card className="border-orange-200" shadow="none">
            <CardBody className="flex-row justify-between">
              <div>
                <p className="font-medium">{t('debug.launcher_structure')}</p>
                <p className="text-muted-foreground text-xs">
                  {t('debug.launcher_structure_desc')}
                </p>
              </div>
              <DebugLauncherStructure className="ml-6" />
            </CardBody>
          </Card>

          {/* Afficher chemin */}
          <Card className="mt-2 border-orange-200" shadow="none">
            <CardBody className="flex-row justify-between">
              <div>
                <p className="font-medium">{t('debug.launcher_folder')}</p>
                <p className="text-muted-foreground text-xs">{t('debug.launcher_folder_desc')}</p>
              </div>
              <DebugShowLauncherPath className="ml-6" />
            </CardBody>
          </Card>
        </>
      )}
    </>
  )
}
