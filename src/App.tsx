import { Divider } from '@heroui/divider'

import SocialLinks from './components/social-links'
import GameActions from './components/game-actions'
import WindowControls from './components/window-controls'
import GameInfos from './components/game-infos'

import { Sidebar } from '@/components/sidebar'

import Artwork from '/images/artwork.png'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onSettingsClick={() => {}} />
      <Divider orientation="vertical" />

      {/* Main content area */}
      <section className="relative flex size-full items-end justify-between p-16">
        {/* Background artwork */}
        <img
          alt="Artwork for current game version"
          className="absolute inset-0 size-full object-cover object-center"
          src={Artwork}
        />

        <WindowControls />
        <SocialLinks />
        <GameInfos />
        <GameActions />
      </section>
    </div>
  )
}
