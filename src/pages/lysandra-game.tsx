import { GameActions } from '@/components/page/game/game-actions'
import { GameBackground } from '@/components/page/game/game-background'
import { GameInfos } from '@/components/page/game/game-infos'
import { GameLinks } from '@/components/page/game/game-links'

import Artwork from '/images/artwork.png'

export const LysandraGame: React.FC = () => {
  return (
    <section className="relative flex size-full items-end justify-between p-16">
      <GameLinks />
      <GameBackground imgPath={Artwork} />
      <GameInfos />
      <GameActions />
    </section>
  )
}
