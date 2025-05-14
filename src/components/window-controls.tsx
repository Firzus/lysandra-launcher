import { Button } from '@heroui/button'
import { LuMinus, LuX } from 'react-icons/lu'
import { getCurrentWindow } from '@tauri-apps/api/window'

export default function WindowControls() {
  const handleMinimize = async () => {
    await getCurrentWindow().minimize()
  }

  const handleClose = async () => {
    await getCurrentWindow().close()
  }

  return (
    <div className="absolute right-6 top-4 space-x-4">
      <Button isIconOnly radius="full" size="sm" variant="light" onPress={handleMinimize}>
        <LuMinus size={16} />
      </Button>
      <Button isIconOnly radius="full" size="sm" variant="light" onPress={handleClose}>
        <LuX size={16} />
      </Button>
    </div>
  )
}
