import { LuCloudDownload, LuSettings2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'

import GameSettingsModal from './game-settings-modal'

export default function GameActions() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="space-x-3">
      <Button
        aria-label="Game Acion"
        color="primary"
        radius="lg"
        size="lg"
        startContent={<LuCloudDownload size={24} />}
      >
        <span className="w-24 text-end">Télécharger</span>
      </Button>

      <Button isIconOnly aria-label="Game Settings" radius="lg" size="lg" onPress={onOpen}>
        <LuSettings2 className="text-muted-foreground" size={24} />
      </Button>

      <GameSettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  )
}
