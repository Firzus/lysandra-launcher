import { LuBolt, LuGamepad2 } from 'react-icons/lu'
import { Button, Tooltip, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import { AppSettingsModal } from '@/components/settings/app/app-settings-modal'

export const Sidebar: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { t } = useTranslation()

  return (
    <nav className="flex w-16 flex-col items-center justify-between p-3">
      <span className="flex size-10 p-1">
        <LuGamepad2 className="text-foreground" size={32} />
      </span>

      <Tooltip content={t('sidebar.settings')} placement="right">
        <Button isIconOnly variant="light" onPress={onOpen}>
          <LuBolt size={20} />
        </Button>
      </Tooltip>

      <AppSettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </nav>
  )
}
