import { relaunch } from '@tauri-apps/plugin-process'
import { Button } from '@heroui/button'
import { addToast } from '@heroui/toast'
import { useTranslation } from 'react-i18next'

import { useAutoAppUpdate } from '@/hooks/use-auto-app-update'

type Props = {
  className?: string
}

export const CheckUpdateButton: React.FC<Props> = ({ className }) => {
  const { status } = useAutoAppUpdate()
  const { t } = useTranslation()

  const handleCheck = () => {
    if (status === 'ready') {
      addToast({
        color: 'success',
        title: t('update.ready'),
        description: t('update.already_latest'),
      })
    } else if (status === 'error') {
      addToast({
        color: 'danger',
        title: t('update.error'),
        description: t('update.error_desc'),
      })
    } else {
      addToast({
        color: 'warning',
        shouldShowTimeoutProgress: true,
        timeout: 5000,
        title: t('update.available'),
        description: t('update.will_restart'),
      })

      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve()
        }, 5000)
      }).then(async () => {
        await relaunch()
      })
    }
  }

  return (
    <Button className={className} color="primary" size="sm" variant="flat" onPress={handleCheck}>
      {t('update.check')}
    </Button>
  )
}
