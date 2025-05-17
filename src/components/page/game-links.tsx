import React from 'react'
import { Button } from '@heroui/button'

import { openLink } from '@/utils/opener'
import { socialLinks } from '@/data/social-links'

type Props = {}

export const GameLinks: React.FC<Props> = () => {
  return (
    <div className="absolute right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-4">
      {socialLinks.map((link, i) => (
        <Button
          key={i}
          isIconOnly
          aria-label={`Visit ${link.name}`}
          radius="full"
          variant="light"
          onPress={() => openLink(link.url)}
        >
          {React.createElement(link.icon, {
            size: 20,
          })}
        </Button>
      ))}
    </div>
  )
}
