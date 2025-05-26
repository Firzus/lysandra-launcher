import React from 'react'
import { Button } from '@heroui/button'
import { Link } from '@heroui/link'
import { Image } from '@heroui/image'
import { Card, CardBody, CardFooter } from '@heroui/card'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

import { openLink } from '@/utils/opener'
import { carouselEvents } from '@/data/lysandra'

type Props = {}

export const GameCarousel: React.FC<Props> = () => {
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
    <Card className="mt-auto h-[220px] border border-default backdrop-blur-md">
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
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
          radius="full"
          size="sm"
          variant="flat"
          aria-label="Previous slide"
          onPress={prevSlide}
        >
          <LuChevronLeft size={16} />
        </Button>

        <Button
          isIconOnly
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
          radius="full"
          size="sm"
          variant="flat"
          aria-label="Next slide"
          onPress={nextSlide}
        >
          <LuChevronRight size={16} />
        </Button>
      </CardBody>

      <CardFooter className="flex px-4 py-2">
        <Link
          isExternal
          className="cursor-pointer truncate pr-2 text-sm font-medium leading-none text-foreground"
          underline="hover"
          onPress={() => {
            openLink(carouselEvents[currentIndex].link)
          }}
        >
          {carouselEvents[currentIndex].title}
        </Link>

        <p className="text-muted-foreground ml-auto text-sm font-medium leading-none">
          {carouselEvents[currentIndex].date.toLocaleDateString()}
        </p>
      </CardFooter>
    </Card>
  )
}
