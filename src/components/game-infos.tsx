import { patchInfos } from '@/data/patch-infos'
import NewsCarousel from '@/components/news-carousel'

export default function GameInfos() {
  return (
    <div className="z-10 flex h-full w-[400px] flex-col bg-white/10">
      <h1 className="pb-2 text-3xl font-semibold">Lysandra</h1>
      <h2 className="text-sm font-medium">Version {patchInfos.version}</h2>
      <h3 className="text-5xl font-extrabold">{patchInfos.label}</h3>
      <div className="mt-4 whitespace-pre-line">
        {patchInfos.description.split('\n').map((line, index) => (
          <p key={index} className="text-primary">
            {line}
          </p>
        ))}
      </div>

      <NewsCarousel />
    </div>
  )
}
