import React from 'react'
import { Button } from '@heroui/button'

import { openLink } from '@/utils/opener'
import { socialLinks } from '@/data/lysandra'

type Props = {}

export const GameLinks: React.FC<Props> = () => {
  return (
    <div className="absolute right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-4">
      {socialLinks.map((link, i) => (
        <Button key={i} isIconOnly radius="full" variant="light" aria-label={link.name} onPress={() => openLink(link.url)}>
          {React.createElement(link.icon, {
            size: 20,
          })}
        </Button>
      ))}
    </div>
  )
}
