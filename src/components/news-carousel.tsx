import { useState } from 'react'
import { Button } from '@heroui/button'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

// Mock news data (à remplacer par des données réelles)
const newsItems = [
  {
    id: 1,
    type: 'INFOS',
    title: 'Sortie officielle de la version 1.0',
    date: '20/05',
    image: 'https://via.placeholder.com/550x150/CC8800/FFFFFF',
  },
  {
    id: 2,
    type: 'ÉVÉNEMENT',
    title: 'Un autre réveil - Événement limité',
    date: '25/05',
    image: 'https://via.placeholder.com/550x150/CC8800/FFFFFF',
  },
  {
    id: 3,
    type: 'MISE À JOUR',
    title: 'Nouvelle zone disponible',
    date: '01/06',
    image: 'https://via.placeholder.com/550x150/CC8800/FFFFFF',
  },
]

export default function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % newsItems.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length)
  }

  return (
    <div className="mt-auto flex h-[220px] items-center justify-between">
      <Button
        isIconOnly
        aria-label="Previous news"
        className="absolute left-4 z-10 bg-black/10 text-white backdrop-blur-sm hover:bg-black/30"
        radius="full"
        size="sm"
        onPress={goToPrevious}
      >
        <LuChevronLeft size={18} />
      </Button>

      <div className="relative h-full w-full">
        <div
          className="flex h-full w-full items-end bg-cover bg-center p-4"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url(${newsItems[currentIndex].image})`,
          }}
        >
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">
                {newsItems[currentIndex].type} - Sortie officielle de la version 1.0
              </span>
              <span className="text-xs text-white/70">{newsItems[currentIndex].date}</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        isIconOnly
        aria-label="Next news"
        className="absolute right-4 z-10 bg-black/10 text-white backdrop-blur-sm hover:bg-black/30"
        radius="full"
        size="sm"
        onClick={goToNext}
      >
        <LuChevronRight size={18} />
      </Button>
    </div>
  )
}
