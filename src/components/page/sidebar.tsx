import { LuBolt, LuGamepad2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import { useDisclosure } from '@heroui/modal'

import { AppSettingsModal } from '@/components/settings/app/app-settings-modal'

type Props = {}

export const Sidebar: React.FC<Props> = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <nav className="flex w-16 flex-col items-center justify-between p-3">
      <span className="flex size-10 p-1">
        <LuGamepad2 className="text-foreground" size={32} />
      </span>

      <Tooltip content="Paramètres" placement="right">
        <Button isIconOnly aria-label="Game Settings" variant="light" onPress={onOpen}>
          <LuBolt size={20} />
        </Button>
      </Tooltip>

      <AppSettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </nav>
  )
}
