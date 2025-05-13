import { Divider } from '@heroui/divider'

import SocialLinks from './components/social-links'

import Sidebar from '@/components/sidebar'
import Artwork from '@/assets/images/artwork.png'

export default function App() {
  return (
    <main className="flex h-screen bg-background text-foreground antialiased dark">
      <Sidebar />
      <Divider orientation="vertical" />
      <section className="relative flex flex-1 items-end p-16">
        {/* Background */}
        <img
          alt="Artwork for current game version"
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={Artwork}
        />

        {/* System */}
        <div className="absolute right-6 top-4 space-x-4">
          <button>-</button>
          <button>x</button>
        </div>

        {/* Social */}
        <SocialLinks />

        {/* Infos */}
        <div className="h-full w-[400px] bg-secondary">
          <div />
          <div />
        </div>

        {/* Actions */}
        <div className="space-x-2">
          <button>télécharger</button>
          <button>settings dl</button>
        </div>
      </section>
    </main>
  )
}
