import { LuCloudDownload, LuSettings2 } from 'react-icons/lu'
import { Button } from '@heroui/button'
import { useDisclosure } from '@heroui/modal'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { GameSettingsModal } from '@/components/settings/game/game-settings-modal'
import { DownloadProgress } from '@/components/page/game/download-progress'

// Test
import { downloadOperation, fetchManifest } from '@/utils/update-service'
import { checkFileHash } from '@/utils/hash-verification'

export const GameActions: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { t } = useTranslation()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      const { version, url, hash, platform } = await fetchManifest('Firzus', 'lysandra-vslice')

      const localPath = 'C:/Users/lilia/Downloads'

      // Appel de la fonction de téléchargement
      await downloadOperation(version, url, localPath)

      console.log('Download completed')

      const fileName = `${localPath}/game-${version}.zip`

      // Vérification du hash
      const isGood = await checkFileHash(fileName, hash)

      console.log('hash is good', isGood)
    } catch (error) {
      throw new Error(`Failed to download: ${error}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-start">
      <div className="space-x-3">
        <Button
          color="primary"
          isDisabled={isDownloading}
          radius="lg"
          size="lg"
          startContent={<LuCloudDownload size={24} />}
          onPress={handleDownload}
        >
          <span className="w-24 text-end">{t('game.download')}</span>
        </Button>

        <Button isIconOnly radius="lg" size="lg" onPress={onOpen}>
          <LuSettings2 className="text-muted-foreground" size={24} />
        </Button>

        <GameSettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />
      </div>

      {/* Composant de progression */}
      <DownloadProgress />
    </div>
  )
}
