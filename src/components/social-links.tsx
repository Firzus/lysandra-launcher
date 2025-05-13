import React from 'react'
import { Button } from '@heroui/button'

import { socialLinks } from '@/data/social-links'

export default function SocialLinks() {
  return (
    <div className="absolute right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
      {socialLinks.map((link, i) => (
        <Button
          key={i}
          isIconOnly
          aria-label={`Visit ${link.name}`}
          radius="full"
          variant="light"
          onPress={() => window.open(link.url, '_blank')}
        >
          {React.createElement(link.icon, {
            size: 20,
          })}
        </Button>
      ))}
    </div>
  )
}
