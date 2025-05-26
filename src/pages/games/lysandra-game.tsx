import { GameActions } from '@/components/page/game/game-actions'
import { GameBackground } from '@/components/page/game/game-background'
import { GameInfos } from '@/components/page/game/game-infos'
import { GameLinks } from '@/components/page/game/game-links'
import { ExtractionProgress } from '@/components/page/game/extraction-progress'

import Artwork from '/images/artwork.png'

export const LysandraGame: React.FC = () => {
  return (
    <section className="relative flex size-full items-end justify-between p-16">
      <GameLinks />
      <GameBackground imgPath={Artwork} />
      <GameInfos />
      <GameActions />

      {/* Composant de progression d'extraction - affiché en overlay */}
      <div className="absolute right-4 top-4 z-50 w-96">
        <ExtractionProgress />
      </div>
    </section>
  )
}
