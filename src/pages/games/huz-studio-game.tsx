import { GameActions } from '@/components/page/game/GameActions'
import { GameBackground } from '@/components/page/game/GameBackground'
import { GameInfos } from '@/components/page/game/GameInfos'
import { GameLinks } from '@/components/page/game/GameLinks'

import Artwork from '/images/artwork.png'

export const HuzStudioGame: React.FC = () => {
  return (
    <section className="relative flex size-full items-end justify-between p-16">
      <GameLinks />
      <GameBackground imgPath={Artwork} />
      <GameInfos />
      <GameActions />
    </section>
  )
}
