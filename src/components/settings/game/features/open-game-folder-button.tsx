import { Button } from '@heroui/button'
import { LuFolderOpen } from 'react-icons/lu'
import { invoke } from '@tauri-apps/api/core'

import { getGamePaths, GAME_IDS } from '@/utils/paths'

type Props = {
  className?: string
}

export const OpenGameFolderButton: React.FC<Props> = ({ className }) => {
  const handleOpenFolder = async () => {
    try {
      const gamePaths = await getGamePaths(GAME_IDS.LYSANDRA)

      await invoke('open_folder', { path: gamePaths.install })
    } catch (error) {
      console.error('Failed to open game folder:', error)
    }
  }

  return (
    <Button
      className={className}
      size="sm"
      startContent={<LuFolderOpen size={16} />}
      variant="flat"
      onPress={handleOpenFolder}
    >
      Ouvrir le dossier
    </Button>
  )
}
