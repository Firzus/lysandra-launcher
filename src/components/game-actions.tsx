import { LuCloudDownload, LuSettings2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import React from 'react'

export default function GameActions() {
  const actionButtonState = React.useState()

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

      <Button isIconOnly aria-label="Game Settings" radius="lg" size="lg" onPress={() => {}}>
        <LuSettings2 size={24} />
      </Button>
    </div>
  )
}
