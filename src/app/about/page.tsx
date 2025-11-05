'use client';

import { useLanguage } from '@/hooks/use-language';
import Image from 'next/image';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{t('about.title')}</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{t('about.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzdXBlcm1hcmtldCUyMGludGVyaW9yfGVufDB8fHx8MTc2MjY0MjIzM3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Supermarket Interior"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-ai-hint="supermarket interior"
          />
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg leading-relaxed">{t('about.p1')}</p>
          <p className="leading-relaxed">{t('about.p2')}</p>
          <p className="leading-relaxed">{t('about.p3')}</p>
        </div>
      </div>
    </div>
  );
}
