'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, or, and, orderBy, limit } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-provider';

function SearchResults() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !searchQuery) return null;
    
    // Split search query into words for more flexible matching
    const searchKeywords = searchQuery.toLowerCase().split(' ').filter(k => k);

    // This is a more advanced query, it's better for performance
    // but might not be supported by your current Firestore indexes.
    // A simpler client-side filter is used as a fallback.
    return query(collection(firestore, 'products'));

  }, [firestore, searchQuery]);

  const { data: allProducts, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = React.useMemo(() => {
    if (!allProducts) return [];
    if (!searchQuery) return allProducts; // Show all if query is empty

    const lowercasedQuery = searchQuery.toLowerCase();
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(lowercasedQuery) ||
      (product.description && product.description.toLowerCase().includes(lowercasedQuery))
    );
  }, [allProducts, searchQuery]);


  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">
          {searchQuery ? t('search.resultsFor').replace('{{query}}', searchQuery) : t('search.title')}
        </h1>
        {filteredProducts && (
            <p className="mt-2 text-lg text-muted-foreground">
                {t('search.productsFound').replace('{{count}}', filteredProducts.length.toString())}
            </p>
        )}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <>
            {filteredProducts.length > 0 ? (
                 <ProductGrid title="" products={filteredProducts} />
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    {t('search.noResults')}
                </div>
            )}
        </>
      )}
    </div>
  );
}


export default function SearchPage() {
    return (
        <Suspense fallback={
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
        }>
            <SearchResults />
        </Suspense>
    )
}
