import React from 'react'
import { Button, Link, Image, Card, CardBody, CardFooter } from '@heroui/react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'

import { openLink } from '@/utils/opener'
import { carouselEvents } from '@/data/lysandra'

type Props = {}

export const GameCarousel: React.FC<Props> = () => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselEvents.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselEvents.length) % carouselEvents.length)
  }

  React.useEffect(() => {
    const timer = setInterval(nextSlide, 30000)

    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="border-default mt-auto h-[220px] border backdrop-blur-md">
      <CardBody className="relative p-0">
        <Image
          removeWrapper
          alt={carouselEvents[currentIndex].title}
          className="size-full object-cover object-center"
          radius="none"
          src={carouselEvents[currentIndex].image}
        />

        <Button
          isIconOnly
          aria-label={t('carousel.previous_slide')}
          className="absolute top-1/2 left-4 z-10 -translate-y-1/2"
          radius="full"
          size="sm"
          variant="flat"
          onPress={prevSlide}
        >
          <LuChevronLeft size={16} />
        </Button>

        <Button
          isIconOnly
          aria-label={t('carousel.next_slide')}
          className="absolute top-1/2 right-4 z-10 -translate-y-1/2"
          radius="full"
          size="sm"
          variant="flat"
          onPress={nextSlide}
        >
          <LuChevronRight size={16} />
        </Button>
      </CardBody>

      <CardFooter className="flex px-4 py-2">
        <Link
          isExternal
          className="text-foreground cursor-pointer truncate pr-2 text-sm leading-none font-medium"
          underline="hover"
          onPress={() => {
            openLink(carouselEvents[currentIndex].link)
          }}
        >
          {carouselEvents[currentIndex].title}
        </Link>

        <p className="text-muted-foreground ml-auto text-sm leading-none font-medium">
          {carouselEvents[currentIndex].date.toLocaleDateString()}
        </p>
      </CardFooter>
    </Card>
  )
}
