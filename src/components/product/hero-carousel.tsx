
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
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { SiteImage } from '@/lib/placeholder-data';
import { Skeleton } from '../ui/skeleton';

type SlideContent = {
  id: string;
  headingKey: string;
  subheadingKey: string;
};

const slides: SlideContent[] = [
  {
    id: 'hero-1',
    headingKey: 'hero1.heading',
    subheadingKey: 'hero1.subheading',
  },
  {
    id: 'hero-2',
    headingKey: 'hero2.heading',
    subheadingKey: 'hero2.subheading',
  },
  {
    id: 'hero-3',
    headingKey: 'hero3.heading',
    subheadingKey: 'hero3.subheading',
  },
];

export default function HeroCarousel() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const heroImageIds = slides.map(s => s.id);
  const heroImagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'siteImages'), where('id', 'in', heroImageIds), limit(heroImageIds.length));
  }, [firestore]);

  const { data: heroImages, isLoading } = useCollection<SiteImage>(heroImagesQuery);
  
  const heroImagesMap = React.useMemo(() => {
    if (!heroImages) return new Map();
    return new Map(heroImages.map(img => [img.id, img]));
  }, [heroImages]);

  if (isLoading) {
    return <Skeleton className="aspect-[2/1] md:aspect-[3/1] lg:aspect-[3.5/1] w-full" />;
  }

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
          const imageData = heroImagesMap.get(slide.id);
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
                      {t(`home.${slide.headingKey}`)}
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200 drop-shadow">
                      {t(`home.${slide.subheadingKey}`)}
                    </p>
                    <Button size="lg" className="mt-8 font-bold text-base" asChild>
                      <Link href="/products">{t('home.shopNow')}</Link>
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
