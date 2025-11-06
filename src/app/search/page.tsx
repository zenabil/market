'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

function SearchResults() {
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
      product.name.toLowerCase().includes(lowercasedQuery) ||
      product.description?.toLowerCase().includes(lowercasedQuery)
    );
  }, [products, searchQuery]);


  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">
          {searchQuery ? `Résultats pour "${searchQuery}"` : 'Recherche de produits'}
        </h1>
        {filteredProducts && (
            <p className="mt-2 text-lg text-muted-foreground">
                {`${filteredProducts.length} produits trouvés`}
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
                    Aucun résultat trouvé.
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
