import { LuBolt, LuGamepad2 } from 'react-icons/lu'
import { Tooltip } from '@heroui/tooltip'
import { Button } from '@heroui/button'

type SidebarProps = {
  onSettingsClick: () => void
}

export const Sidebar = ({ onSettingsClick }: SidebarProps) => {
  return (
    <nav className="flex w-16 flex-col items-center justify-between p-3">
      <span className="flex size-10 p-1">
        <LuGamepad2 className="text-foreground" size={32} />
      </span>

      <Tooltip content="Paramètres" placement="right" showArrow={true}>
        <Button isIconOnly variant="light" onPress={onSettingsClick}>
          <LuBolt size={20} />
        </Button>
      </Tooltip>
    </nav>
  )
}
