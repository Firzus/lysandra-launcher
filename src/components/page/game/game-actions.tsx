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
import { extractZip } from '@/utils/zip'
import { writeTextFile } from '@tauri-apps/plugin-fs'

export const GameActions: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { t } = useTranslation()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // 1. Récupérer le manifeste
      const { version, url, hash } = await fetchManifest('Firzus', 'lysandra-vslice')

      const localPath = 'C:/Users/lilia/Downloads'
      const fileName = `${localPath}/game-${version}.zip`

      // 2. Appel de la fonction de téléchargement
      await downloadOperation(version, url, localPath)

      // 3. Vérification du hash
      if (!(await checkFileHash(fileName, hash))) {
        throw new Error('Hash verification failed')
      }

      // 4. Extraire le fichier ZIP (au même endroit)
      await extractZip(fileName, localPath)

      // 5. Sauvegarder la version localement
      await writeTextFile(`${localPath}/version.txt`, version)
    } catch (error) {
      throw new Error(`Failed to download: ${error}`)
    } finally {
      setIsDownloading(false)
    }

    // succes
    console.log('Operation complete')
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
