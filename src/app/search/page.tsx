
'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-provider';
import dynamic from 'next/dynamic';

const SearchResultsClient = dynamic(() => import('./search-client'), {
    loading: () => <SearchResultsSkeleton />,
});

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResultsClient />
        </Suspense>
    )
}


function SearchResultsSkeleton() {
    return (
         <div className="container py-8 md:py-12">
            <div className="text-center mb-8">
                <Skeleton className="h-14 w-1/2 mx-auto" />
                <Skeleton className="h-7 w-1/4 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                ))}
            </div>
        </div>
    );
}

