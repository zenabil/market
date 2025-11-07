'use client';

import React, { useState, useMemo } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const { categories, areCategoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('popularity');

  const isLoading = areProductsLoading || areCategoriesLoading;

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = selectedCategoryId
      ? products.filter(p => p.categoryId === selectedCategoryId)
      : products;

    switch (sortOption) {
      case 'price-asc':
        return filtered.sort((a, b) => (a.price * (1 - a.discount / 100)) - (b.price * (1 - b.discount / 100)));
      case 'price-desc':
        return filtered.sort((a, b) => (b.price * (1 - b.discount / 100)) - (a.price * (1 - a.discount / 100)));
      case 'name-asc':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'popularity':
      default:
        return filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }
  }, [products, selectedCategoryId, sortOption]);

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
      
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Button 
          variant={!selectedCategoryId ? 'default' : 'outline'}
          onClick={() => setSelectedCategoryId(null)}
          size="sm"
        >
          Tous les produits
        </Button>
        {categories?.map(category => (
          <Button 
            key={category.id} 
            variant={selectedCategoryId === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategoryId(category.id)}
            size="sm"
          >
            {category.name}
          </Button>
        ))}
      </div>

       <div className="flex justify-end mb-8">
        <Select onValueChange={setSortOption} defaultValue={sortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Popularité</SelectItem>
            <SelectItem value="price-asc">Prix: croissant</SelectItem>
            <SelectItem value="price-desc">Prix: décroissant</SelectItem>
            <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <ProductGrid title="" products={sortedAndFilteredProducts || []} />
      )}
    </div>
  );
}
