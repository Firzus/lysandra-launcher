import { Tooltip } from '@heroui/tooltip'
import { Button } from '@heroui/button'
import { LuMinus, LuX } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'

import { handleMinimize, handleClose } from '@/utils/windowControls'

export const WindowControls: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="absolute right-6 top-4 z-20 space-x-4">
      <Tooltip content={t('window.minimize')} placement="bottom">
        <Button isIconOnly radius="full" size="sm" variant="light" onPress={handleMinimize}>
          <LuMinus size={16} />
        </Button>
      </Tooltip>

      <Tooltip content={t('window.close')} placement="bottom-start">
        <Button isIconOnly radius="full" size="sm" variant="light" onPress={handleClose}>
          <LuX size={16} />
        </Button>
      </Tooltip>
    </div>
  )
}
