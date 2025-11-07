
import { Suspense } from 'react';
import AboutPageClient from './about-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À Propos',
  description: 'Apprenez-en plus sur l\'histoire, les valeurs et l\'équipe de Tlemcen Smart Supermarket.',
  openGraph: {
      title: 'À Propos de Tlemcen Smart Supermarket',
      description: 'Découvrez notre engagement envers la qualité, la communauté et l\'innovation.',
  },
};

export default function AboutPage() {
  return (
    <Suspense fallback={<AboutPageSkeleton />}>
        <AboutPageClient />
    </Suspense>
  );
}

function AboutPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-12">
                <Skeleton className="h-12 w-2/3 mx-auto" />
                <Skeleton className="h-6 w-1/3 mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <Skeleton className="w-full aspect-square md:aspect-[4/3] rounded-lg" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
             <section className="mt-16 md:mt-24 text-center">
                <Skeleton className="h-10 w-1/2 mx-auto mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            </section>
             <section className="mt-16 md:mt-24 text-center">
                 <Skeleton className="h-10 w-1/3 mx-auto mb-4" />
                 <Skeleton className="h-5 w-1/2 mx-auto mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <Skeleton className="h-24 w-24 rounded-full mb-4" />
                            <Skeleton className="h-6 w-32 mb-1" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
