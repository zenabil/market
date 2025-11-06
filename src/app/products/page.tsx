'use client';

import React, { useState, useMemo } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const { categories, areCategoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const isLoading = areProductsLoading || areCategoriesLoading;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategoryId) return products;
    return products.filter(p => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return 'Tous les produits';
    return categories?.find(c => c.id === selectedCategoryId)?.name || 'Produits';
  }, [selectedCategoryId, categories]);


  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{selectedCategoryName}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {selectedCategoryId 
            ? `Découvrez nos produits dans la catégorie ${selectedCategoryName}`
            : 'Parcourez notre sélection complète de produits frais et de qualité.'
          }
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        <Button 
          variant={!selectedCategoryId ? 'default' : 'outline'}
          onClick={() => setSelectedCategoryId(null)}
        >
          Tous les produits
        </Button>
        {categories?.map(category => (
          <Button 
            key={category.id} 
            variant={selectedCategoryId === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>


      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <ProductGrid title="" products={filteredProducts || []} />
      )}
    </div>
  );
}
