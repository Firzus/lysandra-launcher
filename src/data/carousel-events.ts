type carouselEventsType = {
  type: 'infos' | 'évènements' | 'mise à jour'
  title: string
  date: Date
  image: string
  link: string
}

export const carouselEvents: carouselEventsType[] = [
  {
    type: 'infos',
    title: 'Sortie officielle de la version 1.0',
    date: new Date('2023-05-01'),
    image: '/images/events/item-1.png',
    link: 'https://tauri.app',
  },
  {
    type: 'évènements',
    title: 'Un autre réveil - Événement limité',
    date: new Date('2023-05-02'),
    image: '/images/events/item-1.png',
    link: 'https://tauri.app',
  },
  {
    type: 'mise à jour',
    title: 'Nouvelle zone disponible',
    date: new Date('2023-05-03'),
    image: '/images/events/item-1.png',
    link: 'https://tauri.app',
  },
]
