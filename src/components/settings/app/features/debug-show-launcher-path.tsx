import { Button } from '@heroui/button'
import { useState } from 'react'
import { LuFolderOpen, LuCopy, LuCheck } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'

import { getLauncherRootPath } from '@/utils/paths'

type Props = {
  className?: string
}

export const DebugShowLauncherPath: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation() as any
  const [path, setPath] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleShowPath = async () => {
    try {
      const launcherPath = await getLauncherRootPath()

      setPath(launcherPath)
      console.log('📁 Launcher path:', launcherPath)
    } catch (error) {
      console.error('Failed to get launcher path:', error)
    }
  }

  const handleOpenFolder = async () => {
    try {
      if (!path) {
        await handleShowPath()

        return
      }

      // Ouvrir le dossier dans l'explorateur
      await invoke('open_folder', { path })
    } catch (error) {
      console.error('Failed to open folder:', error)
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
    } catch (error) {
      console.error('Failed to copy path:', error)
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
