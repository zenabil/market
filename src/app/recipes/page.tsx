

'use client';

import { Suspense } from 'react';
import RecipesPageClient from './recipes-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recettes',
  description: 'Inspirez-vous pour votre prochain repas avec nos délicieuses recettes, faciles à suivre et parfaites pour toutes les occasions.',
};

export default function RecipesPage() {
  return (
    <Suspense fallback={<RecipesPageSkeleton />}>
      <RecipesPageClient />
    </Suspense>
  );
}

function RecipesPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-12">
                <Skeleton className="h-12 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-2/3 mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-96 w-full" />
                ))}
            </div>
        </div>
    );
}
