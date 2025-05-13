import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import { FaDiscord, FaTiktok, FaFacebook, FaYoutube, FaXTwitter } from 'react-icons/fa6'

const socialLinks = [
  { name: 'TikTok', icon: <FaTiktok size={18} />, url: 'https://tiktok.com/' },
  { name: 'Discord', icon: <FaDiscord size={18} />, url: 'https://discord.gg/' },
  { name: 'Facebook', icon: <FaFacebook size={18} />, url: 'https://facebook.com/' },
  { name: 'YouTube', icon: <FaYoutube size={18} />, url: 'https://youtube.com/' },
  { name: 'X (Twitter)', icon: <FaXTwitter size={18} />, url: 'https://x.com/' },
]

export default function SocialLinks() {
  return (
    <div className="absolute right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-4">
      {socialLinks.map((link) => (
        <Tooltip
          key={link.name}
          className="bg-secondary text-foreground"
          content={link.name}
          placement="left"
        >
          <Button
            isIconOnly
            aria-label={`Visit ${link.name}`}
            className="bg-black/30 text-white shadow-md transition-all hover:bg-black/50"
            radius="full"
            size="sm"
            onClick={() => window.open(link.url, '_blank')}
          >
            {link.icon}
          </Button>
        </Tooltip>
      ))}
    </div>
  )
}
