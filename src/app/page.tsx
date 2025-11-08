

'use client';

import HeroCarousel from '@/components/product/hero-carousel';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const HomePageClient = dynamic(() => import('@/components/layout/home-page-client'), {
    loading: () => <HomeProductsSkeleton />,
    ssr: false // This component fetches client-side data like recommendations
});

function HomeProductsSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="mb-12 md:mb-16">
                <Skeleton className="h-10 w-80 mx-auto mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            </div>
            {[...Array(3)].map((_, index) => (
                <div key={index} className="mt-12 md:mt-16">
                    <Skeleton className="h-10 w-64 mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                    </div>
                </div>
            ))}
        </div>
    )
}


export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroCarousel />
      <HomePageClient />
    </div>
  );
}
