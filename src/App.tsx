import { Divider } from '@heroui/divider'

import DragZone from './components/drag-zone'

import SocialLinks from '@/components/social-links'
import GameActions from '@/components/game-actions'
import WindowControls from '@/components/window-controls'
import GameInfos from '@/components/game-infos'
import Sidebar from '@/components/sidebar'
import { UpdateBanner } from '@/components/update-banner'

import Artwork from '/images/artwork.png'

export default function App() {
  return (
    <main className="flex h-screen select-none overflow-hidden bg-background text-foreground antialiased dark">
      <Sidebar />
      <Divider orientation="vertical" />{' '}
      <section className="relative flex size-full items-end justify-between p-16">
        {/* Background */}
        <img
          alt="Artwork for current game version"
          className="absolute inset-0 size-full object-cover object-center"
          src={Artwork}
        />

        {/* Update notification banner */}
        <div className="absolute left-1/2 top-4 z-10 w-96 -translate-x-1/2 transform">
          <UpdateBanner />
        </div>

        <DragZone />
        <WindowControls />
        <SocialLinks />
        <GameInfos />
        <GameActions />
      </section>
    </main>
  )
}
