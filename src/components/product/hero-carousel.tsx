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
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';

const slides = [
  {
    id: 'hero-1',
    heading: 'منتجات طازجة، مباشرة إلى باب منزلك',
    subheading: 'اكتشف مجموعتنا المختارة من الفواكه والخضروات والمنتجات المحلية عالية الجودة.',
  },
  {
    id: 'hero-2',
    heading: 'عروض لا تفوت كل أسبوع',
    subheading: 'وفّر على علاماتك التجارية المفضلة مع عروضنا الحصرية.',
  },
  {
    id: 'hero-3',
    heading: 'المخبز، وكأنه في المنزل',
    subheading: 'تذوق الخبز والمعجنات الحرفية التي نعدها يوميًا.',
  },
];

export default function HeroCarousel() {
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
                      {slide.heading}
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200 drop-shadow">
                      {slide.subheading}
                    </p>
                    <Button size="lg" className="mt-8 font-bold text-base" asChild>
                      <Link href="/products">تسوق الآن</Link>
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
