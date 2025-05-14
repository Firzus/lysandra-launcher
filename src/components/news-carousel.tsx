import React from 'react'
import { Button } from '@heroui/button'
import { Link } from '@heroui/link'
import { Image } from '@heroui/image'
import { Card, CardBody, CardFooter } from '@heroui/card'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

import { carouselEvents } from '@/data/carousel-events'

export default function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselEvents.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselEvents.length) % carouselEvents.length)
  }

  React.useEffect(() => {
    const timer = setInterval(nextSlide, 10000)

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
          onPress={nextSlide}
        >
          <LuChevronRight size={16} />
        </Button>
      </CardBody>

      <CardFooter className="flex px-4 py-2">
        <Link
          isExternal
          className="truncate pr-2 text-sm font-medium leading-none text-foreground"
          href={carouselEvents[currentIndex].link}
          underline="hover"
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
