import { Tooltip } from '@heroui/tooltip'
import { Button } from '@heroui/button'
import { LuMinus, LuX } from 'react-icons/lu'

import { handleMinimize, handleClose } from '@/utils/window-controls'

export const WindowControls: React.FC = () => {
  return (
    <div className="absolute right-6 top-4 z-20 space-x-4">
      <Tooltip content="Minimiser" placement="bottom">
        <Button isIconOnly radius="full" size="sm" variant="light" onPress={handleMinimize}>
          <LuMinus size={16} />
        </Button>
      </Tooltip>

      <Tooltip content="Fermer" placement="bottom-start">
        <Button isIconOnly radius="full" size="sm" variant="light" onPress={handleClose}>
          <LuX size={16} />
        </Button>
      </Tooltip>
    </div>
  )
}
