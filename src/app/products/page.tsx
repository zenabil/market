
import { Suspense } from 'react';
import ProductsPageClient from './products-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tous les produits',
  description: 'Parcourez notre gamme complète de produits frais et de haute qualité chez Tlemcen Smart Supermarket.',
};


export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsPageClient />
    </Suspense>
  );
}

function ProductsPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-8">
                <Skeleton className="h-12 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-2/3 mx-auto mt-2" />
            </div>
             <div className="flex flex-wrap justify-center gap-2 mb-8">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}
            </div>
             <div className="flex justify-end mb-8">
                 <Skeleton className="h-10 w-[180px]" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                ))}
            </div>
        </div>
    )
}
