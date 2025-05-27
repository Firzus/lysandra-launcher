import { Switch } from '@heroui/switch'
import { Spinner } from '@heroui/spinner'
import { useTranslation } from 'react-i18next'

import { useNotifications } from '@/hooks/use-notifications'

type Props = {
  className?: string
}

export const NotificationsToggle: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation()
  const { isNotificationsEnabled, hasSystemPermission, isLoading, error, toggleNotifications } =
    useNotifications()

  const handleToggle = async () => {
    await toggleNotifications()
  }

  if (error) {
    return (
      <div className={`${className} text-sm text-danger`}>
        {t('settings.notifications_settings.error')}: {error}
      </div>
    )
  }

  return (
    <div className={`${className} flex items-center gap-2`}>
      {isLoading && <Spinner size="sm" />}
      <div className="flex flex-col gap-1">
        <Switch
          isDisabled={isLoading}
          isSelected={isNotificationsEnabled}
          size="sm"
          onValueChange={handleToggle}
        >
          {t('settings.notifications_settings.enable')}
        </Switch>
        {!hasSystemPermission && isNotificationsEnabled && (
          <p className="text-xs text-warning">
            {t('settings.notifications_settings.permission_required')}
          </p>
        )}
      </div>
    </div>
  )
}
