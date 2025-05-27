import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { useTranslation } from 'react-i18next'
import { LuBell } from 'react-icons/lu'

import { NotificationsToggle } from '../features/notifications-toggle'

import { sendAppNotification } from '@/utils/notifications'

export const NotificationsAppSettings: React.FC = () => {
  const { t } = useTranslation() as any

  const handleTestNotification = async () => {
    await sendAppNotification({
      title: 'Test de notification',
      body: 'Les notifications fonctionnent correctement ! 🎉',
      type: 'download',
    })
  }

  return (
    <>
      <p className="text-muted-foreground mb-2">{t('settings.notifications')}</p>

      {/* Toggle pour activer/désactiver les notifications */}
      <Card shadow="none">
        <CardBody className="flex-row justify-between">
          <div>
            <p className="font-medium">{t('settings.notifications_settings.title')}</p>
            <p className="text-muted-foreground text-xs">
              {t('settings.notifications_settings.description')}
            </p>
          </div>
          <NotificationsToggle className="ml-6" />
        </CardBody>
      </Card>

      {/* Bouton de test */}
      <Card className="mt-2" shadow="none">
        <CardBody className="flex-row justify-between">
          <div>
            <p className="font-medium">{t('settings.notifications_settings.test_title')}</p>
            <p className="text-muted-foreground text-xs">
              {t('settings.notifications_settings.test_description')}
            </p>
          </div>
          <Button
            color="secondary"
            size="sm"
            startContent={<LuBell size={16} />}
            variant="light"
            onPress={handleTestNotification}
          >
            {t('settings.notifications_settings.test_button')}
          </Button>
        </CardBody>
      </Card>

      {/* Informations supplémentaires */}
      <Card className="mt-2" shadow="none">
        <CardBody>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('settings.notifications_settings.info_title')}</p>
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>{t('settings.notifications_settings.info_download')}</p>
              <p>{t('settings.notifications_settings.info_update')}</p>
              <p>{t('settings.notifications_settings.info_error')}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
