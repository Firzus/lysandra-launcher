import { Button } from '@heroui/button'
import { LuDownload, LuSettings } from 'react-icons/lu'

export default function GameActions() {
  return (
    <div className="flex gap-3">
      <Button
        className="bg-primary font-medium text-default shadow-lg hover:bg-primary/90"
        size="lg"
        startContent={<LuDownload size={18} />}
      >
        Télécharger
      </Button>

      <Button
        isIconOnly
        aria-label="Download settings"
        className="bg-default/20 text-white shadow-lg backdrop-blur-sm hover:bg-default/40"
        size="lg"
      >
        <LuSettings size={18} />
      </Button>
    </div>
  )
}
