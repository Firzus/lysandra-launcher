import { useState, useEffect } from 'react'
import { LuHardDrive } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'

import { getGameSize } from '@/utils/game-uninstaller'
import { GAME_IDS } from '@/utils/paths'

type Props = {
  className?: string
}

export const GameSizeDisplay: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation() as any
  const [size, setSize] = useState<string>('Calcul...')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGameSize = async () => {
      try {
        setIsLoading(true)
        const gameSize = await getGameSize(GAME_IDS.LYSANDRA)
        setSize(gameSize)
      } catch (error) {
        console.error('Failed to get game size:', error)
        setSize('Erreur')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGameSize()
  }, [])

  // Afficher un message spécial si le jeu n'est pas installé
  const displaySize = size === '0 B' ? t('game.actions.game_size_not_installed') : size

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LuHardDrive className="text-muted-foreground" size={16} />
      <span className={`text-sm ${isLoading ? 'animate-pulse' : ''} ${size === '0 B' ? 'text-muted-foreground italic' : ''
        }`}>
        {displaySize}
      </span>
    </div>
  )
}
