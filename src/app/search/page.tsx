'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useLanguage } from '@/hooks/use-language';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

function SearchResults() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;

    const lowercasedQuery = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.en.toLowerCase().includes(lowercasedQuery) ||
      product.name.ar.toLowerCase().includes(lowercasedQuery) ||
      product.name.fr.toLowerCase().includes(lowercasedQuery) ||
      product.description.en?.toLowerCase().includes(lowercasedQuery) ||
      product.description.ar?.toLowerCase().includes(lowercasedQuery) ||
      product.description.fr?.toLowerCase().includes(lowercasedQuery)
    );
  }, [products, searchQuery]);


  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">
          {searchQuery ? t('search.results_for', { query: searchQuery }) : t('search.title')}
        </h1>
        {filteredProducts && (
            <p className="mt-2 text-lg text-muted-foreground">
                {t('search.products_found', { count: filteredProducts.length })}
            </p>
        )}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
                    {t('search.no_results')}
                </div>
            )}
        </>
      )}
    </div>
  );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}
