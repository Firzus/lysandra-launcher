import { LuBolt, LuGamepad2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'

import AppSettingsModal from './app-settings-modal'

export default function Sidebar() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <nav className="flex w-16 flex-col items-center justify-between p-3">
      <span className="flex size-10 p-1">
        <LuGamepad2 className="text-foreground" size={32} />
      </span>

      <Button isIconOnly aria-label="App Settings" variant="light" onPress={onOpen}>
        <LuBolt size={20} />
      </Button>

      <AppSettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </nav>
  )
}
