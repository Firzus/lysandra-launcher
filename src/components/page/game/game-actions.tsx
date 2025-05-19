import { LuCloudDownload, LuSettings2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'
import { useTranslation } from 'react-i18next'

import { GameSettingsModal } from '@/components/settings/game/game-settings-modal'
import { fetchManifest } from '@/utils/update-service'

export const GameActions: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { t } = useTranslation()

  const handleDownload = async () => {
    const { version, url } = await fetchManifest({
      owner: 'Firzus',
      repo: 'lysandra-vslice',
    })

    console.log('Latest version:', version)
    console.log('Download URL:', url)
  }

  return (
    <div className="space-x-3">
      <Button
        onPress={handleDownload}
        color="primary"
        radius="lg"
        size="lg"
        startContent={<LuCloudDownload size={24} />}
      >
        <span className="w-24 text-end">{t('game.download')}</span>
      </Button>

      <Button isIconOnly radius="lg" size="lg" onPress={onOpen}>
        <LuSettings2 className="text-muted-foreground" size={24} />
      </Button>

      <GameSettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  )
}
