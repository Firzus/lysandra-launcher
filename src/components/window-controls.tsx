import { Button } from '@heroui/button'
import { LuMinus, LuX } from 'react-icons/lu'

export default function WindowControls() {
  return (
    <div className="absolute right-6 top-4 space-x-4">
      <Button isIconOnly radius="full" size="sm" variant="light">
        <LuMinus size={16} />
      </Button>
      <Button isIconOnly radius="full" size="sm" variant="light">
        <LuX size={16} />
      </Button>
    </div>
  )
}
