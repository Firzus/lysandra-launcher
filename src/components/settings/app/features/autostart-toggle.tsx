import { Switch, Spinner } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import { useAutostart } from '@/hooks/useAutostart'

type Props = {
  className?: string
}

export const AutostartToggle: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation()
  const { isAutostartEnabled, isLoading, error, toggleAutostart } = useAutostart()

  const handleToggle = async () => {
    await toggleAutostart()
  }

  if (error) {
    return (
      <div className={`${className} text-danger text-sm`}>
        {t('settings.autostart.error')}: {error}
      </div>
    )
  }

  return (
    <div className={`${className} flex items-center gap-2`}>
      {isLoading && <Spinner size="sm" />}
      <Switch
        isDisabled={isLoading}
        isSelected={isAutostartEnabled}
        size="sm"
        onValueChange={handleToggle}
      >
        {t('settings.autostart.enable')}
      </Switch>
    </div>
  )
}
