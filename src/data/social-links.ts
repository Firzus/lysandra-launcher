import { FaDiscord, FaTiktok, FaFacebook, FaYoutube, FaXTwitter } from 'react-icons/fa6'

type SocialLinkProps = {
  name: string
  icon: React.ElementType
  url: string
}

export const socialLinks: SocialLinkProps[] = [
  { name: 'TikTok', icon: FaTiktok, url: 'https://tauri.app' },
  { name: 'Discord', icon: FaDiscord, url: 'https://tauri.app' },
  { name: 'Facebook', icon: FaFacebook, url: 'https://tauri.app' },
  { name: 'YouTube', icon: FaYoutube, url: 'https://tauri.app' },
  { name: 'X (Twitter)', icon: FaXTwitter, url: 'https://tauri.app' },
]
