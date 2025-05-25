import { GameCarousel } from './game-carousel'

import { patchInfos } from '@/data/lysandra'

type Props = {}

export const GameInfos: React.FC<Props> = () => {
  return (
    <div className="z-10 flex h-full w-[400px] flex-col">
      <h1 className="text-3xl font-semibold">Lysandra</h1>
      <h2 className="mt-1 text-sm font-medium">Version {patchInfos.version}</h2>
      <h3 className="mt-2 text-5xl font-extrabold">{patchInfos.label}</h3>
      <div className="mt-2 whitespace-pre-line">
        {patchInfos.description.split('\n').map((line, index) => (
          <p key={index} className="text-primary">
            {line}
          </p>
        ))}
      </div>

      <GameCarousel />
    </div>
  )
}
