import { FaDiscord, FaTiktok, FaFacebook, FaYoutube, FaXTwitter } from 'react-icons/fa6'

import {
  SocialLinkProps,
  CarouselEventsProps,
  GlobalInfosProps,
  PatchInfosProps,
} from '@/types/game-data'

const globalInfos: GlobalInfosProps = {
  name: 'Lysandra',
  owner: 'Firzus',
  repositoryName: 'lysandra-launcher',
  repositoryUrl: 'https://github.com/Firzus/lysandra-launcher',
}

const carouselEvents: CarouselEventsProps[] = [
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

const patchInfos: PatchInfosProps = {
  version: '1.0',
  label: 'Un Autre Réveil',
  description: "Lyra ✦ Fille d'un autre temps \n Evènement à durée limitée",
}

const socialLinks: SocialLinkProps[] = [
  { label: 'TikTok', icon: FaTiktok, url: 'https://tauri.app' },
  { label: 'Discord', icon: FaDiscord, url: 'https://tauri.app' },
  { label: 'Facebook', icon: FaFacebook, url: 'https://tauri.app' },
  { label: 'YouTube', icon: FaYoutube, url: 'https://tauri.app' },
  { label: 'X (Twitter)', icon: FaXTwitter, url: 'https://tauri.app' },
]

export { globalInfos, carouselEvents, patchInfos, socialLinks }
