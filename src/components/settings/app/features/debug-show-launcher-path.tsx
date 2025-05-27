import { Button } from '@heroui/button'
import { useState } from 'react'
import { LuFolderOpen, LuCopy, LuCheck } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { openPath } from '@tauri-apps/plugin-opener'

import { getLauncherRootPath } from '@/utils/paths'

type Props = {
  className?: string
}

export const DebugShowLauncherPath: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation()
  const [path, setPath] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleShowPath = async () => {
    try {
      const launcherPath = await getLauncherRootPath()

      setPath(launcherPath)
    } catch {
      // Error getting launcher path
    }
  }

  const handleOpenFolder = async () => {
    try {
      // Obtenir le chemin du launcher et l'ouvrir directement
      const launcherPath = await getLauncherRootPath()

      // Mettre à jour le state pour afficher le chemin si ce n'est pas déjà fait
      if (!path) {
        setPath(launcherPath)
      }

      // Ouvrir le dossier dans l'explorateur avec le plugin opener
      await openPath(launcherPath)
    } catch {
      // Error opening folder
    }
  }

  const handleCopyPath = async () => {
    try {
      if (!path) {
        await handleShowPath()

        return
      }

      await navigator.clipboard.writeText(path)
      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Error copying path
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Button
          size="sm"
          startContent={<LuFolderOpen size={16} />}
          variant="flat"
          onPress={handleOpenFolder}
        >
          {t('debug.open')}
        </Button>

        <Button
          color={copied ? 'success' : 'default'}
          size="sm"
          startContent={copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
          variant="flat"
          onPress={handleCopyPath}
        >
          {copied ? t('debug.copied') : t('debug.copy')}
        </Button>
      </div>

      {path && <p className="text-muted-foreground mt-2 break-all font-mono text-xs">{path}</p>}
    </div>
  )
}
