import { FaDiscord, FaTiktok, FaFacebook, FaYoutube, FaXTwitter } from 'react-icons/fa6'

type SocialLinkProps = {
  name: string
  icon: React.ElementType
  url: string
}

export const socialLinks: SocialLinkProps[] = [
  { name: 'TikTok', icon: FaTiktok, url: 'https://www.google.fr/' },
  { name: 'Discord', icon: FaDiscord, url: 'https://www.google.fr/' },
  { name: 'Facebook', icon: FaFacebook, url: 'https://www.google.fr/' },
  { name: 'YouTube', icon: FaYoutube, url: 'https://www.google.fr/' },
  { name: 'X (Twitter)', icon: FaXTwitter, url: 'https://www.google.fr/' },
]
