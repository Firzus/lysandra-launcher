import { LuBolt } from 'react-icons/lu'
import { RiGameFill } from 'react-icons/ri'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'

export default function Sidebar() {
  return (
    <nav className="flex w-16 flex-col items-center justify-between p-3">
      <RiGameFill className="fill-foreground" size={20} />

      <Tooltip content="Paramètres" placement="right">
        <Button isIconOnly>
          <LuBolt className="fill-foreground" size={20} />
        </Button>
      </Tooltip>
    </nav>
  )
}
