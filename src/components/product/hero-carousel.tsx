'use client';

import React from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/hooks/use-language';
import Autoplay from "embla-carousel-autoplay";

const slides = [
  {
    id: 'hero-1',
    headingKey: 'hero.slide1_heading',
    subheadingKey: 'hero.slide1_subheading',
  },
  {
    id: 'hero-2',
    headingKey: 'hero.slide2_heading',
    subheadingKey: 'hero.slide2_subheading',
  },
  {
    id: 'hero-3',
    headingKey: 'hero.slide3_heading',
    subheadingKey: 'hero.slide3_subheading',
  },
];

export default function HeroCarousel() {
  const { t } = useLanguage();
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <Carousel
      className="w-full"
      opts={{ loop: true }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {slides.map((slide) => {
          const imageData = PlaceHolderImages.find((img) => img.id === slide.id);
          if (!imageData) return null;

          return (
            <CarouselItem key={slide.id}>
              <div className="relative aspect-[2/1] md:aspect-[3/1] lg:aspect-[3.5/1] w-full">
                <Image
                  src={imageData.imageUrl}
                  alt={imageData.description || 'Hero image'}
                  fill
                  className="object-cover"
                  data-ai-hint={imageData.imageHint}
                  priority={slide.id === 'hero-1'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  <div className="container">
                    <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg">
                      {t(slide.headingKey)}
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200 drop-shadow">
                      {t(slide.subheadingKey)}
                    </p>
                    <Button size="lg" className="mt-8 font-bold text-base">
                      {t('hero.shop_now')}
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none" />
    </Carousel>
  );
}
