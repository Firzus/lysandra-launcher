import { Divider } from '@heroui/divider'
import { Button } from '@heroui/button'
import { LuMinus, LuX, LuDownload, LuSettings } from 'react-icons/lu'
import { FaDiscord, FaFacebook, FaYoutube, FaInstagram, FaXTwitter } from 'react-icons/fa6'

import NewsCarousel from './components/news-carousel'

import { Sidebar } from '@/components/sidebar'
import { patchInfos } from '@/data/patch-infos'
import Artwork from '@/assets/images/artwork.png'

export default function App() {
  // Social media icons
  const socialIcons = [
    { icon: <FaXTwitter size={20} />, href: '#' },
    { icon: <FaDiscord size={20} />, href: '#' },
    { icon: <FaFacebook size={20} />, href: '#' },
    { icon: <FaYoutube size={20} />, href: '#' },
    { icon: <FaInstagram size={20} />, href: '#' },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with navigation */}
      <Sidebar onSettingsClick={() => {}} />

      <Divider orientation="vertical" />

      {/* Main content area */}
      <section className="relative flex flex-1 p-8">
        {/* Background artwork */}
        <img
          alt="Artwork for current game version"
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={Artwork}
        />

        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Window controls */}
        <div className="absolute right-6 top-4 z-50 flex flex-row items-center gap-2">
          <Button
            isIconOnly
            className="bg-black/30 text-white hover:bg-black/40"
            size="sm"
            variant="light"
          >
            <LuMinus size={18} />
          </Button>
          <Button
            isIconOnly
            className="bg-black/30 text-white hover:bg-danger"
            size="sm"
            variant="light"
          >
            <LuX size={18} />
          </Button>
        </div>

        {/* Social media icons - vertical on the right */}
        <div className="absolute right-6 top-1/4 z-10 flex flex-col space-y-4">
          {socialIcons.map((social, index) => (
            <a
              key={index}
              className="text-white transition-colors hover:text-primary"
              href={social.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Game title and info */}
        <div className="left-0 top-0 z-10 p-12">
          <h1 className="text-3xl font-bold text-white">Lysandra</h1>
          <div className="text-sm text-primary">Version {patchInfos.version}</div>

          <h2 className="mt-8 text-6xl font-bold text-white">{patchInfos.label}</h2>

          <div className="mt-4 whitespace-pre-line">
            {patchInfos.description.split('\n').map((line, index) => (
              <div key={index} className="text-lg text-primary">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* News carousel - positioned at the bottom */}
        <div className="absolute bottom-0 left-0 w-[550px] border-t border-gray-800/30 bg-black/30 backdrop-blur-sm">
          <NewsCarousel />
        </div>

        {/* Game actions - positioned at the bottom right */}
        <div className="absolute bottom-8 right-8 z-10 flex items-center gap-2">
          <Button
            className="bg-primary font-medium text-default shadow-lg backdrop-blur-sm hover:bg-primary/90"
            size="lg"
            startContent={<LuDownload size={18} />}
          >
            Télécharger
          </Button>

          <Button
            isIconOnly
            aria-label="Settings"
            className="border-0 bg-transparent text-white hover:bg-black/20"
            variant="bordered"
          >
            <LuSettings size={20} />
          </Button>
        </div>
      </section>
    </div>
  )
}
